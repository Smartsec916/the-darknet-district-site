"""A player reply that is a choice (19 Nov 2026): a player line {who: 'You', text, choice: {...}} in what is said when a step is done, or in the offer of a mission
that does not ask (in person or walked near). The same rules as void-runner/mission-content.js checkChoice; "Ask the player" steps also take gain (credits the player
gets on ACCEPT) and DENY 'continue'. The Mission Editor's server copy refuses out-of-range credits, over-long button words and an unknown DENY."""
import copy
import json
import unittest
from pathlib import Path

import void_runner_live_content as live
import void_runner_drafts as drafts

INV = json.loads((Path(__file__).resolve().parent.parent / 'void_runner_admin_inventory.json').read_text(encoding='utf-8'))
GO = {'id': 'go', 'kind': 'go', 'place': 'port', 'label': 'Go to the Port.'}


def reply(choice, text='Sure.'):
    return {'who': 'You', 'text': text, 'choice': choice}


def tree(choice=None, extra=None, where='say', text='Sure.'):
    say = [{'who': 'iris', 'text': 'Want a job? I pay up front.'}, reply(choice if choice is not None else {'credits': 100}, text), {'who': 'iris', 'text': 'Then go.'}]
    talk = {'id': 'talk', 'kind': 'talk', 'npc': 'iris', 'label': 'Talk to Iris.'}
    m = {'id': 'draft-rc-m1', 'number': 81, 'title': 'A reply', 'type': 'side', 'giver': 'iris', 'objectives': [talk, copy.deepcopy(GO)]}
    if where == 'say':
        talk['say'] = say
    else:
        m['offer'] = say
    m.update(extra or {})
    return {'id': 'draft-rc', 'name': 'Reply', 'missions': [m]}


OTHER = {'id': 'draft-other', 'name': 'Other', 'missions': [{'id': 'draft-other-m1', 'number': 82, 'title': 'Plan B', 'type': 'side', 'giver': 'iris', 'objectives': [copy.deepcopy(GO)]}]}
NEAR = {'start': {'how': 'notification', 'channel': 'notify', 'from': 'iris', 'text': 'Iris waves you over.', 'when': {'kind': 'near', 'npc': 'iris', 'distance': 5}}}


def doc(*trees):
    return {'format': live.FORMAT, 'version': 1, 'trees': list(trees)}


def workspace(trees):
    return {'schemaVersion': 1, 'kind': 'workspace', 'adapter': 'mission-editor', 'sourceKey': drafts.WORKSPACE_ID, 'baseRevision': 0,
            'data': {'id': drafts.WORKSPACE_ID, 'title': 'Mission Editor', 'bundle': {'version': 1, 'trees': trees}}}


class ReplyChoiceServerTests(unittest.TestCase):
    def test_valid(self):
        ok = [{}, {'credits': 100}, {'credits': -50, 'yes': 'PAY', 'no': 'NO WAY'}, {'credits': 100000, 'noText': 'Not today.', 'deny': 'continue'},
              {'deny': 'skip', 'goto': 'go'}, {'deny': 'back', 'goto': 'talk'}, {'yesSay': [{'who': 'iris', 'text': 'Good.'}], 'noSay': [{'who': 'You', 'text': 'Bye.'}, {'who': 'iris', 'text': 'Pity.'}]}]
        for c in ok:
            self.assertEqual(live.check(doc(tree(c)), INV), [], c)
        self.assertEqual(live.check(doc(tree({'deny': 'tree', 'denyStart': 'draft-other-m1'}), OTHER), INV), [])
        self.assertEqual(live.check(doc(tree({'credits': 100}, text='')), INV), [], 'the reply on ACCEPT may be empty')
        # the offer: in person without its own ACCEPT / DENY, or walked near
        self.assertEqual(live.check(doc(tree({'credits': 100}, where='offer')), INV), [])
        self.assertEqual(live.check(doc(tree({'credits': 100}, NEAR, where='offer')), INV), [])

    def test_refused(self):
        bad = [{'credits': 0}, {'credits': 100001}, {'credits': -100001}, {'credits': 1.5}, {'yes': 'X' * 21}, {'no': '<b>x</b>'}, {'noText': ''}, {'deny': 'maybe'},
               {'deny': 'skip'}, {'deny': 'skip', 'goto': 'talk'}, {'deny': 'back'}, {'deny': 'back', 'goto': 'go'}, {'goto': 'go'}, {'deny': 'tree'},
               {'denyStart': 'draft-other-m1'}, {'unknown': 1}, {'yesSay': [{'who': 'You', 'text': 'x', 'choice': {}}]}]
        for c in bad:
            self.assertNotEqual(live.check(doc(tree(c), OTHER), INV), [], c)
        # only the player's reply; not in a Comms call; not in an offer that asks itself or arrives by message
        t = tree({'credits': 5})
        t['missions'][0]['objectives'][0]['say'][1]['who'] = 'iris'
        self.assertNotEqual(live.check(doc(t), INV), [])
        self.assertNotEqual(live.check(doc(tree({}, {'start': {'how': 'person', 'accept': True}}, where='offer')), INV), [])
        msg = {'start': {'how': 'notification', 'channel': 'messages', 'from': 'iris', 'header': 'IRIS', 'text': 'Hi.', 'when': {'kind': 'pod-exit'}}}
        self.assertNotEqual(live.check(doc(tree({}, msg, where='offer')), INV), [])
        t = tree({})
        t['missions'][0]['objectives'][0]['early'] = [reply({})]
        self.assertNotEqual(live.check(doc(t), INV), [])
        # going back repeats a step that gives credits each time
        t = tree({'deny': 'back', 'goto': 'talk'}, {'unlocks': [{'kind': 'credits', 'amount': 10, 'when': 'talk'}]})
        self.assertTrue(any('each time' in e for e in live.check(doc(t), INV)))

    def test_ask_step_gain_and_continue(self):
        q = {'id': 'q', 'kind': 'ask', 'label': 'Decide', 'question': 'Take it?'}
        m = {'id': 'draft-ask-m1', 'number': 83, 'title': 'Ask', 'type': 'side', 'giver': 'iris', 'objectives': [dict(q, gain=100, deny='continue'), copy.deepcopy(GO)]}
        self.assertEqual(live.check(doc({'id': 'draft-ask', 'name': 'Ask', 'missions': [m]}), INV), [])
        for bad in ({'gain': 0}, {'gain': 100001}, {'gain': 5, 'price': 5}):
            m2 = copy.deepcopy(m)
            m2['objectives'][0].update(bad)
            self.assertNotEqual(live.check(doc({'id': 'draft-ask', 'name': 'Ask', 'missions': [m2]}), INV), [], bad)

    def test_workspace_copy(self):
        self.assertTrue(drafts.validate_workspace(workspace([tree({'credits': -100, 'deny': 'continue'})]))['valid'])
        for c in ({'credits': 0}, {'credits': 100001}, {'yes': 'X' * 21}, {'deny': 'never'}):
            with self.assertRaises(drafts.DraftError):
                drafts.validate_workspace(workspace([tree(c)]))


if __name__ == '__main__':
    unittest.main()
