"""Mission Editor publishing and re-voice queue: owner only, off by default, immutable versions, undo, fake storage only (no production calls)."""
import copy
import json
from pathlib import Path
import os
import unittest
from unittest.mock import patch
import test_content_drafts as fixtures
import test_story_save
import void_runner_api as vr
import void_runner_live_content as live

LINE = 'Always got work. Just depends on where you’re willing to go.'


def beginner(title='FIRST CONTACT'):
    return [{'id': 'first-contact', 'title': title, 'type': 'main', 'giver': 'Admin', 'rewards': 0,
             'objectives': [{'id': 'speak', 'label': 'Speak with Admin', 'on': 'talk-admin', 'interaction': 'admin', 'say': [{'who': 'Admin', 'text': 'Welcome.'}]}]},
            {'id': 'new-errand', 'title': 'NEW ERRAND', 'type': 'main', 'giver': 'Iris', 'rewards': 50, 'prerequisites': ['first-contact'],
             'objectives': [{'id': 'go', 'label': 'Talk to Iris', 'on': 'talk-iris'}]}]


def content(**extra):
    c = {'format': live.FORMAT, 'version': 1, 'beginner': beginner(), 'registry': {'legal-run': {'title': 'AN HONEST DAY', 'objectives': {'arrive': 'Bring the filters'}}},
         'lines': [{'who': 'admin', 'from': LINE, 'to': 'Work? Always.'}]}
    c.update(extra)
    return c


class LiveContentTests(unittest.TestCase):
    setUp = fixtures.DraftTests.setUp

    def setUp(self):
        fixtures.DraftTests.setUp(self)
        live.clear_cache()
        self.addCleanup(live.clear_cache)
        env = patch.dict(os.environ, {'VOID_CONTENT_PUBLISH_ENABLED': 'true', 'VOID_ACCOUNTS_ENABLED': 'true'})
        env.start()
        self.addCleanup(env.stop)

    def post(self, path, body, token='owner'):
        return self.client.post('/api/void-runner/developer/' + path, headers={'Authorization': 'Bearer ' + token}, json=body)

    def get(self, path, token='owner'):
        return self.client.get('/api/void-runner/' + path, headers={'Authorization': 'Bearer ' + token} if token else {})

    def test_owner_only_and_off_by_default(self):
        for token, status in [(None, 401), ('forged', 401), ('outsider', 403)]:
            h = {} if token is None else {'Authorization': 'Bearer ' + token}
            self.assertEqual(self.client.post('/api/void-runner/developer/live-content/publish', headers=h, json={'expected': 0, 'content': content()}).status_code, status)
            self.assertEqual(self.client.post('/api/void-runner/developer/live-content/rollback', headers=h, json={'expected': 0}).status_code, status)
        with patch.dict(os.environ, {'VOID_CONTENT_EDITOR_UID': ''}):
            self.assertEqual(self.post('live-content/publish', {'expected': 0, 'content': content()}).status_code, 403)
        with patch.dict(os.environ, {'VOID_CONTENT_PUBLISH_ENABLED': 'false'}):
            self.assertEqual(self.post('live-content/publish', {'expected': 0, 'content': content()}).status_code, 404)
            self.assertEqual(self.get('developer/live-content').status_code, 404)
            self.assertEqual(self.get('live-content', token=None).status_code, 404, 'players get nothing: the shipped missions stay')
        with patch.dict(os.environ, {'VOID_CONTENT_PUBLISH_ENABLED': ''}):
            self.assertEqual(self.post('live-content/publish', {'expected': 0, 'content': content()}).status_code, 404)
        self.assertEqual(self.db.data, {}, 'nothing written by refused calls')

    def test_editor_falls_back_to_the_single_admin(self):
        import void_runner_drafts as drafts
        with patch.dict(os.environ, {'VOID_CONTENT_EDITOR_UID': '', 'VOID_ADMIN_UIDS': 'owner'}):
            self.assertEqual(drafts.editor_uid(), 'owner')
            self.assertEqual(self.post('live-content/publish', {'expected': 0, 'content': content()}).status_code, 200)
        with patch.dict(os.environ, {'VOID_CONTENT_EDITOR_UID': '', 'VOID_ADMIN_UIDS': 'owner,outsider'}):
            self.assertEqual(drafts.editor_uid(), '', 'two developers: an explicit editor must be configured')
        with patch.dict(os.environ, {'VOID_CONTENT_EDITOR_UID': 'outsider', 'VOID_ADMIN_UIDS': 'owner'}):
            self.assertEqual(self.post('live-content/publish', {'expected': 0, 'content': content()}).status_code, 403, 'the explicit setting wins and must still be an allowlisted developer')

    def test_publish_versions_and_one_click_undo(self):
        self.assertEqual(self.get('live-content', token=None).json, {'version': 0, 'content': None})
        first = self.post('live-content/publish', {'expected': 0, 'content': content(note='First')})
        self.assertEqual(first.status_code, 200, first.json)
        self.assertEqual(first.json['version'], 1)
        self.assertEqual(self.get('live-content', token=None).json['content']['registry']['legal-run']['title'], 'AN HONEST DAY')
        stale = self.post('live-content/publish', {'expected': 0, 'content': content()})
        self.assertEqual(stale.status_code, 409, 'a stale publish never overwrites')
        second = self.post('live-content/publish', {'expected': 1, 'content': content(beginner=beginner('HELLO'))})
        self.assertEqual(second.json['version'], 2)
        undo = self.post('live-content/rollback', {'expected': 2})
        self.assertEqual(undo.status_code, 200, undo.json)
        self.assertEqual(undo.json['version'], 3)
        self.assertEqual(undo.json['from'], 1)
        self.assertEqual(undo.json['content'], first.json['content'], 'undo restores the previous version as a new version')
        self.assertEqual(self.get('live-content', token=None).json['content']['beginner'][0]['title'], 'FIRST CONTACT')
        self.assertEqual(self.get('developer/live-content/1').json, first.json, 'old versions are never changed')
        back = self.post('live-content/rollback', {'expected': 3, 'target': 0})
        self.assertEqual(back.json['content'], None)
        self.assertEqual(self.get('live-content', token=None).json, {'version': 4, 'content': None, 'publishedAt': back.json['at']})
        state = self.get('developer/live-content').json
        self.assertEqual([h['version'] for h in state['history']], [1, 2, 3, 4])
        self.assertEqual([h['action'] for h in state['history']], ['publish', 'publish', 'rollback', 'rollback'])
        self.assertTrue(all(k.startswith(('vr_live_content_state/', 'vr_live_content_versions/')) for k in self.db.data))

    def test_validation_blocks_bad_content(self):
        bad = []
        c = content(); c['beginner'][0]['objectives'][0]['on'] = 'teleport'; bad.append(c)
        c = content(); c['beginner'][0]['title'] = '<b>x</b>'; bad.append(c)
        c = content(); c['beginner'][1]['prerequisites'] = ['nope']; bad.append(c)
        c = content(); c['registry'] = {'no-such-mission': {'title': 'x'}}; bad.append(c)
        c = content(); c['lines'] = [{'who': 'admin', 'from': 'A line that is not in the game.', 'to': 'x'}]; bad.append(c)
        c = content(); c['lines'] = [{'who': 'player', 'from': LINE, 'to': 'x'}]; bad.append(c)
        c = content(); c['script'] = 'alert(1)'; bad.append(c)
        c = content(); c['beginner'][0]['objectives'][0]['award'] = 'spectre'; bad.append(c)
        for c in bad:
            r = self.post('live-content/publish', {'expected': 0, 'content': c})
            self.assertEqual(r.status_code, 422 if 'script' not in c else 422, r.json)
        self.assertEqual(self.post('live-content/publish', {'expected': 0, 'content': {'format': live.FORMAT, 'version': 1}}).status_code, 422, 'nothing to publish')
        ok = self.post('live-content/check', {'content': content()})
        self.assertTrue(ok.json['ok'])
        self.assertEqual(self.db.data, {})

    def test_published_ids_pass_cloud_save_validation(self):
        """A beginner mission's records and reward flag are still accepted by clean_save (old saves load). Since 17 Nov 2026 the beginner campaign is removed
        from the game, so a tracked beginner mission in a District campaign is untracked; the records are kept."""
        state = test_story_save.StorySaveTests.state(None)
        state['story']['flags'].update({'missionPool': 'closed', 'br_new-errand': True})
        state['universe'] = {'trackingInitialized': True, 'trackedMission': 'new-errand', 'freeTravel': False,
                             'missions': {'new-errand': {'acquired': True, 'completed': False, 'objectives': {'go': True}}, 'first-contact': {'acquired': True, 'completed': True, 'objectives': {'speak': True}}}}
        clean = vr.clean_save(state)
        self.assertEqual(clean['universe']['missions']['new-errand']['objectives'], {'go': True})
        self.assertTrue(clean['story']['flags']['br_new-errand'])
        self.assertIsNone(clean['universe']['trackedMission'], 'a removed mission is untracked')
        self.assertTrue(clean['universe']['autoTrack'])
        self.assertTrue(clean['universe']['missions']['first-contact']['completed'], 'records are kept')


    def test_new_trees_publish_and_their_records_pass_cloud_save(self):
        """The owner's new trees (draft- ids, givers with a TALK prompt, supported steps and unlocks) publish; anything the game cannot run is refused;
        their mission records and flags (mt_<id> when paid, mf_<name> from a flag unlock) are accepted by clean_save as they are."""
        tree = {'id': 'draft-test-tree', 'name': 'Test tree', 'missions': [{'id': 'draft-test-tree-m1', 'title': 'FIRST', 'type': 'side', 'giver': 'admin', 'rewards': 10,
                'offer': [{'who': 'admin', 'text': 'Test line.'}],
                'objectives': [{'id': 'step-1', 'label': 'Talk to Iris', 'kind': 'talk', 'npc': 'iris'}, {'id': 'step-2', 'label': 'Go to the Port', 'kind': 'go', 'place': 'port'}],
                'ending': {'npc': 'rook', 'place': 'meridian'}, 'unlocks': [{'kind': 'flag', 'id': 'testFlag', 'value': True}, {'kind': 'location', 'id': 'vigil'}, {'kind': 'ship', 'id': 'ship2'}]}]}
        good = {'format': live.FORMAT, 'version': 1, 'trees': [tree], 'names': {'vesper-opening': 'Old opening'}}
        self.assertEqual(live.check(good), [])
        r = self.post('live-content/publish', {'expected': 0, 'content': good})
        self.assertEqual(r.status_code, 200, r.json)
        self.assertEqual(self.get('live-content', token=None).json['content']['trees'][0]['id'], 'draft-test-tree')
        for change in [lambda m: m.update(giver='rin-takeda'), lambda m: m['objectives'][0].update(kind='fight'), lambda m: m.update(id='first'),
                       lambda m: m['objectives'][1].update(place='atlantis'), lambda m: m.update(unlocks=[{'kind': 'item', 'id': 'warflying-module'}]),
                       lambda m: m.update(unlocks=[{'kind': 'ship', 'id': 'ship3'}]), lambda m: m.update(unlocks=[{'kind': 'tree', 'id': 'draft-test-tree'}]),
                       lambda m: m['objectives'][1].update(kind='arrive', place='district'), lambda m: m['offer'].append({'who': 'darth', 'text': 'x'})]:
            c = copy.deepcopy(good)
            change(c['trees'][0]['missions'][0])
            self.assertTrue(live.check(c), c)
        state = test_story_save.StorySaveTests.state(None)
        state['story']['flags'].update({'missionPool': 'closed', 'mt_draft-test-tree-m1': True, 'mf_testFlag': True, 'ts_draft-test-tree': True, 'starterShipAwarded': True, 'shipAccess': 'granted'})
        state['ownedShips'] = ['starter', 'ship2']
        state['shipLoadouts'] = {'ship2': dict(state['loadout'])}
        state['story']['met'] = ['Admin', 'iris', 'rook', 'zen-zephyr', 'milked-eva']
        state['universe'] = {'trackingInitialized': True, 'trackedMission': 'draft-test-tree-m1', 'freeTravel': False,
                             'missions': {'draft-test-tree-m1': {'acquired': True, 'completed': True, 'objectives': {'step-1': True, 'step-2': True, 'turn-in': True}}}}
        clean = vr.clean_save(state)
        self.assertEqual(clean['universe']['missions']['draft-test-tree-m1']['objectives'], {'step-1': True, 'step-2': True, 'turn-in': True})
        self.assertTrue(clean['story']['flags']['mt_draft-test-tree-m1'])
        self.assertTrue(clean['story']['flags']['mf_testFlag'])
        self.assertEqual(clean['ownedShips'], ['starter', 'ship2'], 'a granted hull is an ordinary owned ship')


def awakening(**extra):
    """Mission 001 as the Mission Editor publishes it (main-story.js, stripped by mission-content.js treeStrip)."""
    m = {'id': 'm001-awakening', 'number': 1, 'title': 'Awakening', 'type': 'main', 'category': 'Main storyline / Introduction', 'giver': 'admin', 'location': 'district',
         'objective': 'Locate Admin',
         'start': {'how': 'notification', 'channel': 'comms', 'from': 'admin', 'text': "You're awake. Good.\nWhen you're ready, come find me. We need to talk.", 'header': 'ADMIN // INCOMING MESSAGE', 'when': {'kind': 'pod-exit'}},
         'objectives': [{'id': 'exit-pod', 'label': 'Exit the Sleeping Pod.', 'kind': 'pod-exit'},
                        {'id': 'message', 'label': "Receive Admin's message.", 'kind': 'message'},
                        {'id': 'speak', 'label': 'Find and speak with Admin.', 'kind': 'talk', 'npc': 'admin', 'say': [{'who': 'admin', 'text': "[Write Admin's introduction to The Darknet District here]"}]},
                        {'id': 'introduction', 'label': 'Receive an introduction to The Darknet District.', 'kind': 'hear', 'npc': 'admin'}]}
    m.update(extra)
    return {'id': 'main-storyline', 'name': 'Main storyline', 'missions': [m]}


def side_tree(tid, number):
    return {'id': tid, 'name': 'Tree ' + tid, 'missions': [{'id': tid + '-m1', 'number': number, 'title': 'SIDE', 'type': 'side', 'giver': 'admin',
            'objectives': [{'id': 'step-1', 'label': 'Talk to Iris', 'kind': 'talk', 'npc': 'iris'}]}]}


class MissionNumberTests(unittest.TestCase):
    """Mission numbers (17 Nov 2026): unique, never reused once used (shipped ledger and every published number), and the main storyline needs one."""
    setUp = LiveContentTests.setUp
    post = LiveContentTests.post
    get = LiveContentTests.get

    def mc(self, *trees):
        return {'format': live.FORMAT, 'version': 1, 'trees': list(trees)}

    def test_shipped_ledger_and_main_storyline(self):
        self.assertEqual(live.shipped_numbers(), {1: 'm001-awakening', 2: 'm002-eyes-on-the-street', 3: 'm003-corporate-connections'})
        self.assertEqual(live.check(self.mc(awakening())), [], 'Mission 001 as shipped is valid')
        self.assertTrue(live.check(self.mc(awakening(number=None))), 'a main storyline mission needs a number')
        self.assertTrue(live.check(self.mc(awakening(number=1000))))
        self.assertTrue(live.check(self.mc(awakening(trigger='pod-exit'))), 'unknown fields are refused')
        for change in [dict(how='telepathy'), dict(channel='fax'), dict(header='<b>x</b>'), dict(text=''), dict(**{'from': 'darth'}), dict(when={'kind': 'moon'}),
                       dict(when={'kind': 'place', 'place': 'atlantis'}), dict(when={'kind': 'after-mission', 'mission': 'nowhere'}), dict(when={'kind': 'flag', 'flag': 'bad flag', 'value': True})]:
            bad = awakening()
            bad['missions'][0]['start'].update(change)
            self.assertTrue(live.check(self.mc(bad)), change)
        bad = awakening(start={'how': 'person'})
        self.assertTrue(live.check(self.mc(bad)), 'a "notification arrives" step needs a notification start')
        bad = awakening()
        bad['missions'][0]['objectives'][1]['message'] = {'from': 'admin', 'header': 'H', 'text': 'x'}
        self.assertTrue(live.check(self.mc(bad)), 'steps carry no message of their own')
        side = side_tree('draft-a', 5)
        for when in [{'kind': 'after-mission', 'mission': 'm001-awakening'}, {'kind': 'place', 'place': 'port'}, {'kind': 'flag', 'flag': 'mf_x', 'value': True}, {'kind': 'pod-exit'}]:
            side['missions'][0]['start'] = {'how': 'notification', 'channel': 'comms', 'from': 'iris', 'header': 'IRIS // CALL', 'text': 'Test.', 'when': when}
            self.assertEqual(live.check(self.mc(awakening(), side)), [], when)
        side['missions'][0]['start'] = {'how': 'notification', 'channel': 'notify', 'from': 'iris', 'text': 'Test.', 'when': {'kind': 'pod-exit'}}
        self.assertEqual(live.check(self.mc(awakening(), side)), [], 'a banner needs no header')
        other = {'id': 'some-tree', 'name': 'X', 'missions': awakening()['missions']}
        self.assertTrue(live.check(self.mc(other)), 'only listed story trees may skip the draft- prefix')

    def test_duplicates_and_reuse_are_refused(self):
        self.assertTrue(any('two missions' in p for p in live.check(self.mc(awakening(), side_tree('draft-a', 5), side_tree('draft-b', 5)))))
        self.assertTrue(any('never reused' in p for p in live.check(self.mc(side_tree('draft-a', 1)))), 'number 1 belongs to Mission 001')
        self.assertEqual(live.check(self.mc(awakening(), side_tree('draft-a', 5))), [])

    def test_published_numbers_are_never_reused(self):
        # (002 is Mission 002 — Eyes on the Street since 17 Nov 2026: test trees use 005 and 006)
        first = self.post('live-content/publish', {'expected': 0, 'content': self.mc(awakening(), side_tree('draft-a', 5))})
        self.assertEqual(first.status_code, 200, first.json)
        self.assertEqual(self.get('developer/live-content').json['numbers'], {'1': 'm001-awakening', '2': 'm002-eyes-on-the-street', '3': 'm003-corporate-connections', '5': 'draft-a-m1'})
        # draft-a is removed; its number 5 stays taken
        again = self.post('live-content/publish', {'expected': 1, 'content': self.mc(awakening(), side_tree('draft-b', 5))})
        self.assertEqual(again.status_code, 422, again.json)
        self.assertIn('never reused', ' '.join(again.json.get('problems', [again.json.get('error', '')])))
        ok = self.post('live-content/publish', {'expected': 1, 'content': self.mc(awakening(), side_tree('draft-b', 6))})
        self.assertEqual(ok.status_code, 200, ok.json)
        self.assertEqual(self.get('developer/live-content').json['numbers'], {'1': 'm001-awakening', '2': 'm002-eyes-on-the-street', '3': 'm003-corporate-connections', '5': 'draft-a-m1', '6': 'draft-b-m1'})


class MissionRemovalSaveTests(unittest.TestCase):
    """Saves after the missions were removed (17 Nov 2026): never rejected, removed missions untracked, Mission 001 accepted."""

    def test_old_progress_is_kept_and_untracked_and_mission_001_is_accepted(self):
        state = test_story_save.StorySaveTests.state(None)
        state['credits'] = 4321
        state['story']['flags'].update({'missionPool': 'closed', 'br_first-contact': True, 'br_district-errand': True, 'starterShipAwarded': True, 'shipAccess': 'granted',
                                        'v1m_m001-awakening_message': 1763400000, 'v1r_m001-awakening_message': True})
        state['universe'] = {'trackingInitialized': True, 'trackedMission': 'job-worth-taking', 'freeTravel': True,
                             'missions': {'first-contact': {'acquired': True, 'completed': True, 'objectives': {'speak': True}},
                                          'job-worth-taking': {'acquired': True, 'completed': False, 'objectives': {'collect': True}}}}
        clean = vr.clean_save(state)
        self.assertIsNone(clean['universe']['trackedMission'])
        self.assertEqual(clean['credits'], 4321)
        self.assertEqual(set(clean['universe']['missions']), {'first-contact', 'job-worth-taking'}, 'old ids are still accepted and kept')
        state['universe']['trackedMission'] = 'm001-awakening'
        state['universe']['missions']['m001-awakening'] = {'acquired': True, 'completed': False, 'objectives': {'exit-pod': True, 'message': True}}
        clean = vr.clean_save(state)
        self.assertEqual(clean['universe']['trackedMission'], 'm001-awakening')
        self.assertEqual(clean['universe']['missions']['m001-awakening']['objectives'], {'exit-pod': True, 'message': True})
        self.assertEqual(clean['story']['flags']['v1m_m001-awakening_message'], 1763400000)
        # an old (open pool) campaign keeps whatever it tracks
        state['story']['flags'].pop('missionPool')
        state['universe']['trackedMission'] = 'legal-run'
        self.assertEqual(vr.clean_save(state)['universe']['trackedMission'], 'legal-run')

    def test_mission_002_save_is_accepted(self):
        """Mission 002 — Eyes on the Street (17 Nov 2026): its record, its Comms call flags, the paid flag, the credits and Admin's standing (story.relationships) all pass."""
        state = test_story_save.StorySaveTests.state(None)
        state['credits'] = 600
        mid = 'm002-eyes-on-the-street'
        state['story']['flags'].update({'missionPool': 'closed', 'mt_m001-awakening': True, 'v1m_' + mid + '_enter-null': 1763400100, 'v1r_' + mid + '_enter-null': True, 'mt_' + mid: True})
        state['story']['relationships'] = {'admin': 10}
        state['universe'] = {'trackingInitialized': True, 'trackedMission': mid, 'freeTravel': False,
                             'missions': {'m001-awakening': {'acquired': True, 'completed': True, 'objectives': {'exit-pod': True, 'message': True, 'speak': True, 'introduction': True}},
                                          mid: {'acquired': True, 'completed': False, 'objectives': {'enter-null': True, 'photograph': True}}}}
        clean = vr.clean_save(state)
        self.assertEqual(clean['universe']['trackedMission'], mid, 'a story mission stays tracked')
        self.assertEqual(clean['universe']['missions'][mid]['objectives'], {'enter-null': True, 'photograph': True})
        self.assertEqual(clean['story']['flags']['v1m_' + mid + '_enter-null'], 1763400100)
        self.assertIs(clean['story']['flags']['mt_' + mid], True)
        self.assertEqual(clean['story']['relationships'], {'admin': 10})
        self.assertEqual(clean['credits'], 600)
        state['story']['relationships'] = {'admin': 101}
        with self.assertRaises(vr.ApiError):
            vr.clean_save(state)

    def test_mission_002_publishes_with_its_new_kinds(self):
        """The shipped Awakening tree with Mission 002, as the editor publishes it, passes the server check; broken new kinds are refused."""
        import copy, subprocess
        out = subprocess.run(['node', '-e', "const MC=require('./void-runner/mission-content.js'),MS=require('./void-runner/main-story.js');process.stdout.write(JSON.stringify(MC.treesContent(MS.trees(),{givers:[{id:'admin',canTalk:true,draft:true}]}).trees))"],
                             capture_output=True, text=True, cwd=str(Path(__file__).resolve().parent.parent), check=True)
        trees = json.loads(out.stdout)
        content = {'format': 'darknet-district-mission-content', 'version': 1, 'trees': trees}
        self.assertEqual(live.check(content), [])
        eyes = content['trees'][0]['missions'][1]
        self.assertEqual(eyes['objectives'][1]['subjects'], ['juno-vex', 'halden-reyes'])
        self.assertEqual(eyes['objectives'][2]['subjects'], ['juno-vex', 'halden-reyes'])
        self.assertIn('halden-reyes', json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text())['missionEditor']['subjects'])
        for change in [lambda m: m['objectives'][0].update(place='atlantis'), lambda m: m['objectives'][1].update(npc='nobody'), lambda m: m['objectives'][2].update(subject='nobody'),
                       lambda m: m['objectives'][0].update(via='fax'), lambda m: m['unlocks'][0].update(amount=0), lambda m: m['unlocks'][0].update(id='nobody'), lambda m: m['start'].update(accept='yes'),
                       lambda m: m['objectives'][3].update(wrong=[{'who': 'admin', 'text': 'x'}]),
                       # the photo needs Juno Vex and Halden Reyes (the owner, 17 Nov 2026): a broken list of people is refused
                       lambda m: m['objectives'][1].update(subjects=['halden-reyes', 'juno-vex']), lambda m: m['objectives'][1].update(subjects=['juno-vex', 'nobody']),
                       lambda m: m['objectives'][2].update(subjects=['juno-vex', 'juno-vex']), lambda m: m['objectives'][2].update(subjects='juno-vex'),
                       lambda m: m['objectives'][3].update(subjects=['admin'])]:
            bad = copy.deepcopy(content)
            change(bad['trees'][0]['missions'][1])
            self.assertTrue(live.check(bad), 'refused')

    def test_mission_003_save_is_accepted(self):
        """Mission 003 — Corporate Connections (17 Nov 2026): its record, the staff-door flag, the V1 contact, the Social follow, the active-playtime counter, the
        completion stamp and the fired follow-up all pass clean_save as they are (story.flags: booleans, short strings, safe integers)."""
        state = test_story_save.StorySaveTests.state(None)
        mid = 'm003-corporate-connections'
        state['story']['flags'].update({'missionPool': 'closed', 'mt_m001-awakening': True, 'mt_m002-eyes-on-the-street': True, 'mt_' + mid: True, 'mf_milkedStaff': True,
                                        'v1Contacts': 'milked-fish', 'socialFollowing': 'n:milked-fish', 'playSec': 5400, 'pc_' + mid: 4500, 'ev_fish-followup-due': True})
        state['universe'] = {'trackingInitialized': True, 'trackedMission': None, 'freeTravel': False,
                             'missions': {mid: {'acquired': True, 'completed': True, 'objectives': {'travel-milked': True, 'speak-eva': True, 'meet-fish': True, 'await-fish': True}}}}
        clean = vr.clean_save(state)
        self.assertEqual(clean['universe']['missions'][mid]['objectives'], {'travel-milked': True, 'speak-eva': True, 'meet-fish': True, 'await-fish': True})
        for k, v in {'mf_milkedStaff': True, 'v1Contacts': 'milked-fish', 'socialFollowing': 'n:milked-fish', 'playSec': 5400, 'pc_' + mid: 4500, 'ev_fish-followup-due': True}.items():
            self.assertEqual(clean['story']['flags'][k], v, k)
        state['universe']['trackedMission'] = mid
        state['universe']['missions'][mid]['completed'] = False
        self.assertEqual(vr.clean_save(state)['universe']['trackedMission'], mid, 'Mission 003 stays tracked')

    def test_mission_003_publishes_with_its_new_kinds(self):
        """The shipped Awakening tree with Mission 003 passes the server check; the new kinds (await-call step, contact and follow unlocks, the
        "after active play" trigger) are checked the same way as in the game."""
        import copy, subprocess
        out = subprocess.run(['node', '-e', "const MC=require('./void-runner/mission-content.js'),MS=require('./void-runner/main-story.js');process.stdout.write(JSON.stringify(MC.treesContent(MS.trees(),{givers:['admin','milked-eva','milked-fish'].map(id=>({id,canTalk:true,draft:true}))}).trees))"],
                             capture_output=True, text=True, cwd=str(Path(__file__).resolve().parent.parent), check=True)
        content = {'format': 'darknet-district-mission-content', 'version': 1, 'trees': json.loads(out.stdout)}
        self.assertEqual(live.check(content), [])
        m3 = content['trees'][0]['missions'][2]
        self.assertEqual(m3['id'], 'm003-corporate-connections')
        self.assertEqual([o['kind'] for o in m3['objectives']], ['enter', 'talk', 'talk', 'await-call'])
        for change in [lambda m: m['unlocks'][1].update(id='nobody'), lambda m: m['unlocks'][2].update(id='Bad Id'), lambda m: m['objectives'][3].update(npc='nobody'),
                       lambda m: m['unlocks'][0].update(kind='teleport')]:
            bad = copy.deepcopy(content)
            change(bad['trees'][0]['missions'][2])
            self.assertTrue(live.check(bad), 'refused')
        # "after active play": a follow-up mission started by a Comms call N minutes of active play after Mission 003
        follow = {'id': 'draft-fish', 'name': 'Fish', 'missions': [{'id': 'draft-fish-m1', 'number': 9, 'title': 'Fish calls', 'type': 'side', 'giver': 'milked-fish',
                  'start': {'how': 'notification', 'channel': 'comms', 'from': 'milked-fish', 'header': 'FISH // INCOMING CALL', 'text': 'x', 'when': {'kind': 'playtime', 'mission': 'm003-corporate-connections', 'value': 15}},
                  'objectives': [{'id': 's', 'label': 'x', 'kind': 'talk', 'npc': 'milked-fish'}]}]}
        good = copy.deepcopy(content)
        good['trees'].append(follow)
        self.assertEqual(live.check(good), [])
        for v in (0, 1441, '15', 2.5):
            bad = copy.deepcopy(good)
            bad['trees'][1]['missions'][0]['start']['when']['value'] = v
            self.assertTrue(live.check(bad), v)
        bad = copy.deepcopy(good)
        bad['trees'][1]['missions'][0]['start']['when']['mission'] = 'nowhere'
        self.assertTrue(live.check(bad))

    def test_manifest_lists_mission_001(self):
        m = live.manifest()
        self.assertIn('m001-awakening', m['storyMissions'])
        self.assertIn('m002-eyes-on-the-street', m['storyMissions'])
        self.assertIn('m003-corporate-connections', m['storyMissions'])
        self.assertEqual(m['missionNumbers'], {'1': 'm001-awakening', '2': 'm002-eyes-on-the-street', '3': 'm003-corporate-connections'})
        self.assertIn('main-storyline', m['storyTrees'])


class RevoiceQueueTests(unittest.TestCase):
    def setUp(self):
        fixtures.DraftTests.setUp(self)

    def post(self, path, body, token='owner'):
        return self.client.post('/api/void-runner/developer/' + path, headers={'Authorization': 'Bearer ' + token}, json=body)

    def test_queue_add_list_done_and_auth(self):
        items = [{'ref': 'admin|' + LINE, 'who': 'admin', 'text': 'Work? Always.', 'from': LINE, 'mission': 'registry:communion-delivery', 'source': 'void-runner/faction-scenes.js'},
                 {'ref': 'rook|x', 'who': 'rook', 'text': 'Seal is intact.', 'from': 'Seal’s intact. Good.', 'mission': 'registry:admin-sealed-cargo-01', 'source': 'void-runner/faction-scenes.js'},
                 {'ref': 'mara|y', 'who': 'mara', 'text': 'Test line for Mara.', 'from': 'x', 'mission': '', 'source': 'void-runner/story-content.js'}]
        for token, status in [('forged', 401), ('outsider', 403)]:
            self.assertEqual(self.post('revoice', {'items': items}, token).status_code, status)
        with patch.dict(os.environ, {'VOID_CONTENT_DRAFTS_ENABLED': 'false'}):
            self.assertEqual(self.post('revoice', {'items': items}).status_code, 404)
        self.assertEqual(self.db.data, {})
        r = self.post('revoice', {'items': items})
        self.assertEqual(r.status_code, 200, r.json)
        by = {i['who']: i for i in r.json['items']}
        self.assertEqual(by['admin']['engine'], 'elevenlabs')
        self.assertEqual(by['admin']['voiceId'], 'DMyrgzQFny3JI1Y1paM5')
        self.assertEqual(by['admin']['waiting'], 'waiting for ElevenLabs re-voice (needs approval)')
        self.assertEqual(by['rook']['engine'], 'elevenlabs', 'Rook: the owner chose an ElevenLabs voice on 17 Nov 2026')
        self.assertEqual(by['rook']['voiceId'], 'wzVFxVZCBIi6KBxNhQDI')
        self.assertEqual(by['mara']['engine'], 'kokoro')
        self.assertEqual(by['mara']['voice'], 'af_bella', 'the registered voice, never a new one')
        self.assertEqual(by['mara']['id'], live.item_id('mara', 'Test line for Mara.'))
        listed = self.client.get('/api/void-runner/developer/revoice', headers=self.header).json['items']
        self.assertEqual(len(listed), 3)
        done = self.post('revoice/done', {'ids': [by['mara']['id'], by['admin']['id'], by['rook']['id']]}).json['items']
        st = {i['who']: i['status'] for i in done}
        self.assertEqual(st, {'mara': 'done', 'admin': 'queued', 'rook': 'queued'}, 'ElevenLabs lines stay queued until the owner approves')
        for bad in [{'items': [{**items[0], 'who': 'news-anchor'}]}, {'items': [{**items[0], 'who': 'special-character'}]}, {'items': [{**items[0], 'text': '<b>x</b>'}]}, {'items': [{**items[0], 'voice': 'af_bella'}]}]:
            self.assertIn(self.post('revoice', bad).status_code, (400, 422))
        self.assertTrue(all(k.startswith('vr_revoice_queue/') for k in self.db.data))


if __name__ == '__main__':
    unittest.main()
