"""Player lines and animations on the server (19 Nov 2026): the same rules as void-runner/mission-content.js / npc-gestures.js, from the admin inventory
(missionEditor.gestures; clips added in the NPCs tab via npcPaths.movable[id].anims and the published plan). The editor's server copy refuses malformed animations."""
import json
import unittest
from pathlib import Path

import void_runner_live_content as live
import void_runner_drafts as drafts

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))


def tree(objectives, offer=None):
    return {'id': 'draft-chat', 'name': 'Chat', 'missions': [{'id': 'draft-chat-m1', 'number': 71, 'title': 'A word with Iris', 'type': 'side', 'giver': 'admin',
                                                              'offer': offer or [{'who': 'admin', 'text': 'Go and see Iris.'}], 'objectives': objectives}]}


TALK = {'id': 'iris', 'kind': 'talk', 'npc': 'iris', 'label': 'Talk to Iris',
        'say': [{'who': 'iris', 'text': 'You again.'}, {'who': 'You', 'text': 'Admin sent me.'}, {'who': 'iris', 'text': 'Of course he did.', 'anim': 'shrug'}]}


def doc(trees, npcs=None):
    d = {'format': live.FORMAT, 'version': 1, 'trees': trees}
    if npcs:
        d['npcs'] = npcs
    return d


def workspace(trees):
    return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
            'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor', 'bundle': {'version': 1, 'trees': trees}}}


class PlayerLinesServerTests(unittest.TestCase):
    def test_back_and_forth_with_an_animation(self):
        self.assertEqual(live.check(doc([tree([TALK])]), INV), [])
        anim = {'id': 'shrug', 'kind': 'anim', 'npc': 'iris', 'clip': 'shrug', 'hold': 2, 'label': 'Watch Iris'}
        self.assertEqual(live.check(doc([tree([TALK, anim])]), INV), [])

    def test_refused(self):
        def errs(objs, npcs=None):
            return ' | '.join(live.check(doc([tree(objs)], npcs), INV))
        self.assertIn('not an animation', errs([{**TALK, 'say': [{'who': 'iris', 'text': 'x', 'anim': 'dance-samba'}]}]))
        self.assertIn('no animation', errs([{**TALK, 'say': [{'who': 'You', 'text': 'x', 'anim': 'shrug'}]}]))
        self.assertIn('unknown name', errs([{**TALK, 'say': [{'who': 'iris', 'text': 'x', 'anim': '<b>'}]}]))
        self.assertIn('0 to 30', errs([{'id': 'a', 'kind': 'anim', 'npc': 'iris', 'clip': 'shrug', 'hold': 31, 'label': 'x'}]))
        self.assertIn('not an animation', errs([{'id': 'a', 'kind': 'anim', 'npc': 'iris', 'clip': 'walk', 'label': 'x'}]))
        self.assertIn('not an animation', errs([{'id': 'a', 'kind': 'anim', 'npc': 'street-cat', 'clip': 'idle', 'label': 'x'}]))
        self.assertIn('no lines', errs([{'id': 'a', 'kind': 'anim', 'npc': 'iris', 'clip': 'shrug', 'label': 'x', 'say': [{'who': 'iris', 'text': 'x'}]}]))
        self.assertIn('only an animation step', errs([{**TALK, 'clip': 'shrug'}]))

    def test_added_animation_counts_only_with_her_plan(self):
        added = 'npc-busker/laugh'
        self.assertIn(added, INV['npcPaths']['movable']['grey-reverie']['anims'])
        rv = [{'id': 'rv', 'kind': 'talk', 'npc': 'grey-reverie', 'label': 'Talk to Reverie', 'say': [{'who': 'grey-reverie', 'text': 'Hey.', 'anim': added}]}]
        self.assertTrue(live.check(doc([tree(rv)]), INV))
        self.assertEqual(live.check(doc([tree(rv)], {'grey-reverie': {'mode': 'original', 'anims': [added]}}), INV), [])
        self.assertNotIn('dance-samba', INV['missionEditor']['gestures']['grey-reverie']['clips'])

    def test_workspace_copy(self):
        ok = [tree([TALK, {'id': 'a', 'kind': 'anim', 'npc': 'iris', 'clip': 'shrug', 'hold': 3, 'label': ''}])]
        self.assertTrue(drafts.validate_workspace(workspace(ok))['valid'])
        with self.assertRaises(drafts.DraftError):
            drafts.validate_workspace(workspace([tree([{'id': 'a', 'kind': 'anim', 'npc': 'iris', 'clip': 'shrug', 'hold': 999, 'label': ''}])]))
        with self.assertRaises(drafts.DraftError):
            drafts.validate_workspace(workspace([tree([{**TALK, 'say': [{'who': 'iris', 'text': 'x', 'anim': 'Bad Name!'}]}])]))


class MissionTimerServerTests(unittest.TestCase):
    """Mission timers (the owner, 19 Nov 2026: "mission timers. set the amount of time between actions, lines, etc")."""
    def test_valid_timers(self):
        talk = {**TALK, 'delay': 5, 'say': [{'who': 'iris', 'text': 'One.'}, {'who': 'iris', 'text': 'Two.', 'wait': 3, 'show': 4, 'anim': 'shrug', 'animFor': 2}]}
        wait = {'id': 'w', 'kind': 'wait', 'hold': 30, 'label': 'Wait'}
        near = {'id': 'n', 'kind': 'wait', 'hold': 600, 'npc': 'iris', 'near': 5, 'label': 'Stay with Iris'}
        self.assertEqual(live.check(doc([tree([talk, wait, near])]), INV), [])

    def test_refused_timers(self):
        def errs(objs):
            return ' | '.join(live.check(doc([tree(objs)]), INV))
        self.assertIn('0 to 60', errs([{**TALK, 'say': [{'who': 'iris', 'text': 'x', 'wait': 61}]}]))
        self.assertIn('1 to 60', errs([{**TALK, 'say': [{'who': 'iris', 'text': 'x', 'show': 0}]}]))
        self.assertIn('only a line with an animation', errs([{**TALK, 'say': [{'who': 'iris', 'text': 'x', 'animFor': 2}]}]))
        self.assertIn('0 to 600', errs([{**TALK, 'delay': 601}]))
        self.assertIn('1 to 600', errs([{'id': 'w', 'kind': 'wait', 'hold': 0, 'label': 'x'}]))
        self.assertIn('1 to 50', errs([{'id': 'w', 'kind': 'wait', 'hold': 5, 'npc': 'iris', 'near': 51, 'label': 'x'}]))
        self.assertIn('stay near', errs([{'id': 'w', 'kind': 'wait', 'hold': 5, 'near': 5, 'label': 'x'}]))
        self.assertIn('only a wait, observe, overhear or follow step has a distance', errs([{**TALK, 'near': 3}]))
        with self.assertRaises(drafts.DraftError):
            drafts.validate_workspace(workspace([tree([{**TALK, 'delay': 9999}])]))


if __name__ == '__main__':
    unittest.main()
