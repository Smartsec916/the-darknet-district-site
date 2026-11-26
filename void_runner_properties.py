"""Residential unit assignments shared by the property inspector and live NPC publishing."""
import hashlib
import re

from void_runner_drafts import DraftError, inventory


def registry_ref(db):
    return db.collection('vr_property_registry').document('units')


def npc_units(content):
    result = {}
    for npc, character in ((content or {}).get('characters') or {}).items():
        home = character.get('residence') or {}
        if home.get('door') and type(home.get('slot')) is int:
            result.setdefault(f"residence/{home['door']}/{home['slot']}", set()).add(npc)
    return result


def validate_new_npc_units(before, after, players):
    previous = npc_units(before)
    reserved = mission_entrances(after)
    newly_reserved = reserved - mission_entrances(before)
    if any(unit.split('/')[1] in newly_reserved for unit in players):
        raise DraftError('A new mission entrance is assigned to player housing. Choose another entrance.', 409)
    for unit, occupants in npc_units(after).items():
        if occupants - previous.get(unit, set()) and (len(occupants) > 1 or unit in players or unit.split('/')[1] in reserved):
            raise DraftError('The apartment is assigned or its entrance is reserved. Choose an available unit.', 409)


def assignments(db):
    record = registry_ref(db).get().to_dict() or {}
    return {'revision': record.get('revision', 0), 'units': record.get('units', {})}


def mission_entrances(content):
    result = set(inventory().get('shippedMissionEntrances', []))
    for tree in (content or {}).get('trees', []):
        for mission in tree.get('missions', []):
            for apartment in mission.get('apartments', []):
                result.add(apartment.get('door'))
            for objective in mission.get('objectives', []):
                access = objective.get('ap', '')
                if objective.get('kind') == 'hack' and isinstance(access, str) and access in inventory()['apartments']['doors']:
                    result.add(access)
    return result


def assign(db, body, editor):
    from firebase_admin import firestore
    import void_runner_live_content as live
    import void_runner_items as items
    if not isinstance(body, dict) or set(body) != {'revision', 'unit', 'player'} or type(body['revision']) is not int:
        raise DraftError('Select an apartment and a saved player account.')
    unit, player = body['unit'], body['player']
    if not isinstance(unit, str) or not re.fullmatch(r'residence/[a-z0-9-]+/(0|[1-9][0-9]?)', unit):
        raise DraftError('Choose a registered residential unit.')
    _, entrance, slot = unit.split('/')
    door = inventory()['apartments']['doors'].get(entrance, {})
    family = door.get('family')
    if family not in ('city', 'container') or int(slot) >= (4 if family == 'container' else 10):
        raise DraftError('Choose an apartment in a residential building.')
    if player is not None and (not isinstance(player, str) or not re.fullmatch('[A-Za-z0-9_-]{1,128}', player)):
        raise DraftError('Choose a valid player account.')
    ref = registry_ref(db)

    @firestore.transactional
    def write(tx):
        rec = ref.get(transaction=tx).to_dict() or {}
        revision, units = rec.get('revision', 0), dict(rec.get('units', {}))
        if revision != body['revision']:
            raise DraftError('Assignments changed. Refresh the map before editing.', 409)
        card_id = hashlib.sha256(('resident/' + unit).encode()).hexdigest()
        if player is None:
            previous = units.pop(unit, None)
            if previous:
                holder = db.collection(items.PLAYERS).document(previous['owner'])
                bag = items._clean_player(holder.get(transaction=tx).to_dict())
                bag['cards'].pop(card_id, None)
                tx.set(holder, bag)
        else:
            owner = hashlib.sha256(player.encode()).hexdigest()
            if unit in units and units[unit]['owner'] != owner:
                raise DraftError('Release the existing assignment before reassigning this apartment.', 409)
            state = live._state_ref(db).get(transaction=tx).to_dict() or {}
            version = state.get('live', 0)
            content = (live._version_ref(db, version).get(transaction=tx).to_dict() or {}).get('content') if version else {}
            from void_runner_drafts import refs
            _, draft_ref = refs(db, editor, 'mission-editor-workspace')
            draft = draft_ref.get(transaction=tx).to_dict() or {}
            bundle = (draft.get('document') or {}).get('data', {}).get('bundle', {})
            if entrance in mission_entrances(content) or entrance in mission_entrances(bundle):
                raise DraftError('This street entrance is reserved by a mission.', 409)
            if unit in npc_units(content) or unit in npc_units(bundle):
                raise DraftError('An NPC already resides in this unit.', 409)
            account = db.collection('vr_players').document(owner).get(transaction=tx).to_dict()
            if not account:
                raise DraftError('The player needs a saved campaign.', 404)
            units[unit] = {'owner': owner, 'name': account.get('handle') or 'Player resident'}
            holder = items._player_ref(db, player)
            bag = items._clean_player(holder.get(transaction=tx).to_dict())
            number = int(slot) + (1 if family == 'container' else 101)
            bag['cards'][card_id] = {
                'id': card_id, 'template': 'resident-access', 'name': 'Apartment ' + str(number) + ' keycard',
                'icon': '▣', 'description': 'Residential access', 'notes': '', 'issuedTo': owner,
                'doors': [entrance, unit], 'expires': 0, 'bearer': False,
                'droppable': False, 'transferable': False, 'pickup': False
            }
            tx.set(holder, bag)
        result = {'units': units, 'revision': revision + 1}
        tx.set(ref, result)
        return result
    return write(db.transaction())
