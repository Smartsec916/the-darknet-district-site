"""Consumables Studio server: drafts, publishing, versions, authority over price, stock, inventory and item use. Fake storage only."""
import copy
import json
import os
import threading
import unittest
from unittest.mock import patch
import test_content_drafts as fixtures
import void_runner_items as items

U = '/api/void-runner/'


def catalog():
    c = copy.deepcopy(items.SEED)
    c['vendors'] = [v for v in c['vendors'] if v['id'] == 'shop-here']
    it = {'id': 'ghost-circuit', 'name': 'Ghost circuit', 'description': 'A fictional stimulant.', 'category': 'stimulants', 'subcategory': '', 'kind': 'consumable', 'icon': '◈', 'model': None, 'animation': 'inject',
          'price': 60, 'stack': 3, 'weight': 0.1, 'rarity': 'rare', 'status': 'published', 'cooldown': 30, 'consumable': {'effects': [
              {'id': 'ca', 'type': 'chromaticAberration', 'intensity': .65, 'delay': 0, 'duration': 45, 'fadeIn': 3, 'fadeOut': 6, 'speed': 1, 'stacking': 'max', 'params': {k: p['def'] for k, p in items.SPEC['effects']['chromaticAberration']['params'].items()}}],
              'modifiers': [{'stat': 'walkSpeed', 'amount': .2, 'delay': 0, 'duration': 90}, {'stat': 'walkSpeed', 'amount': -.1, 'delay': 90, 'duration': 30}]}}
    c['items'].append(it)
    c['vendors'].append({'id': 'kiosk-a', 'name': 'Kiosk A', 'kind': 'kiosk', 'location': 'District store', 'entity': 'kiosk-entrance', 'entries': [
        {'item': 'ghost-circuit', 'price': 75, 'stock': 2, 'maxStock': 5, 'restock': {'mode': 'interval', 'every': 60, 'amount': 1}, 'available': True}]})
    c['vendors'].append({'id': 'vend-d', 'name': 'Drinks', 'kind': 'vending', 'location': 'Alcove', 'entity': 'vend-drinks', 'entries': [
        {'item': 'ghost-circuit', 'price': 50, 'stock': 9, 'maxStock': 9, 'restock': {'mode': 'none', 'every': 0, 'amount': 0}, 'available': True}]})
    return c


class ItemTests(unittest.TestCase):
    def setUp(self):
        fixtures.DraftTests.setUp(self)
        items.clear_cache()
        self.addCleanup(items.clear_cache)
        env = patch.dict(os.environ, {'VOID_ACCOUNTS_ENABLED': 'true', 'VOID_ADMIN_UIDS': 'owner'})
        env.start()
        self.addCleanup(env.stop)
        self.n = 0

    def fund(self, uid, credits):
        ref = self.db.collection('vr_players').document(items._tag(uid))
        self.db.data[ref.key] = {'save': {'credits': credits, 'location': 'earth'}, 'revision': 1, 'handle': 'unchanged'}


    def h(self, t='owner'):
        return {'Authorization': 'Bearer ' + t}

    def post(self, path, body, t='owner'):
        return self.client.post(U + path, headers=self.h(t), json=body)

    def get(self, path, t='owner'):
        return self.client.get(U + path, headers=self.h(t))

    def publish(self, c=None, expected=0):
        d = self.get('developer/items').json['draft']
        r = self.post('developer/items/draft', {'revision': d['revision'], 'content': c or catalog()})
        self.assertEqual(r.status_code, 200, r.json)
        return self.post('developer/items/publish', {'expected': expected})

    def nonce(self):
        self.n += 1
        return 'nonce-%08d' % self.n

    def buy(self, vendor='kiosk-a', item='ghost-circuit', qty=1, credits=1000, t='owner'):
        if 'vr_players/' + items._tag(t) not in self.db.data:
            self.fund(t, 1000)
        return self.post('shop/purchase', {'vendor': vendor, 'item': item, 'qty': qty, 'credits': credits, 'nonce': self.nonce()}, t)

    def test_seed_is_valid_and_matches_the_browser(self):
        self.assertEqual(items.problems(items.SEED), [])
        self.assertEqual(self.client.get(U + 'items/catalog').json['content']['items'][0]['id'], 'sprint-tonic')

    def test_every_effect_default_validates(self):
        for t, d in items.SPEC['effects'].items():
            e = {'id': 'x', 'type': t, 'intensity': .5, 'delay': 0, 'duration': 30, 'fadeIn': 2, 'fadeOut': 4, 'speed': 1, 'stacking': 'max', 'params': {k: p['def'] for k, p in d['params'].items()}}
            self.assertEqual(items.effect_problems(e, 't'), [], t)

    def test_only_the_administrator_can_edit_and_publish(self):
        for path, body in [('developer/items/draft', {'revision': 0, 'content': catalog()}), ('developer/items/publish', {'expected': 0}), ('developer/items/rollback', {'expected': 0, 'target': 1})]:
            for tok, status in [(None, 401), ('forged', 401), ('outsider', 403)]:
                h = {} if tok is None else self.h(tok)
                self.assertEqual(self.client.post(U + path, headers=h, json=body).status_code, status, path)
        self.assertEqual(self.client.get(U + 'developer/items', headers=self.h('outsider')).status_code, 403)
        self.assertEqual(self.db.data, {})

    def test_draft_persists_and_conflicts(self):
        c = catalog()
        self.assertEqual(self.post('developer/items/draft', {'revision': 0, 'content': c}).json['revision'], 1)
        self.assertEqual(self.get('developer/items').json['draft']['content']['items'][-1]['id'], 'ghost-circuit')
        self.assertEqual(self.post('developer/items/draft', {'revision': 0, 'content': c}).status_code, 409)
        self.assertEqual(self.client.get(U + 'items/catalog').json['version'], 0, 'a draft is never public')

    def test_invalid_catalogs_are_not_published(self):
        bad = catalog()
        bad['items'][-1]['consumable']['effects'][0]['intensity'] = 5
        bad['items'][-1]['consumable']['modifiers'][0]['amount'] = 9
        bad['items'].append({**bad['items'][-1], 'id': 'ghost-circuit'})
        bad['vendors'][-1]['entries'][0]['price'] = -3
        r = self.publish(bad)
        self.assertEqual(r.status_code, 422)
        self.assertEqual(self.client.get(U + 'items/catalog').json['version'], 0)
        for mutate in [lambda c: c['items'][-1]['consumable']['modifiers'].append({'stat': 'staminaRegen', 'amount': .1, 'delay': 0, 'duration': 5}),
                       lambda c: c['items'][-1].update(name='<script>'), lambda c: c['vendors'][-1].update(entity='nowhere'),
                       lambda c: c['vendors'][-1]['entries'][0].update(stock=99), lambda c: c['items'][-1]['consumable']['effects'][0].update(fadeIn=40, fadeOut=40)]:
            c = catalog(); mutate(c)
            self.assertTrue(items.problems(c))

    def test_publish_makes_items_available_and_versions_are_immutable(self):
        r = self.publish()
        self.assertEqual(r.status_code, 200, r.json)
        self.assertEqual(r.json['version'], 1)
        cat = self.client.get(U + 'items/catalog').json
        self.assertEqual(cat['version'], 1)
        self.assertIn('ghost-circuit', [i['id'] for i in cat['content']['items']])
        self.assertEqual(self.post('developer/items/publish', {'expected': 0}).status_code, 409)
        self.assertEqual(self.get('developer/items/versions/1').json['content']['items'][-1]['id'], 'ghost-circuit')

    def test_published_ids_cannot_be_deleted_retyped_or_returned_to_draft(self):
        self.publish()
        d = self.get('developer/items').json['draft']
        for mutate in [lambda c: c['items'].pop(), lambda c: c['items'][-1].update(status='draft'), lambda c: c['items'][-1].update(kind='weapon')]:
            c = catalog(); mutate(c)
            self.assertEqual(self.post('developer/items/draft', {'revision': d['revision'], 'content': c}).status_code, 200); d['revision'] += 1
            self.assertEqual(self.post('developer/items/publish', {'expected': 1}).status_code, 422)
        c = catalog(); c['items'][-1]['status'] = 'retired'
        self.post('developer/items/draft', {'revision': d['revision'], 'content': c})
        self.assertEqual(self.post('developer/items/publish', {'expected': 1}).json['version'], 2)
        self.assertEqual(self.get('shop/vendor/kiosk-a').json['entries'], [], 'a retired item is no longer sold')

    def test_rollback_keeps_items_published_since(self):
        self.publish(items.SEED)
        d = self.get('developer/items').json['draft']
        self.post('developer/items/draft', {'revision': d['revision'], 'content': catalog()})
        self.assertEqual(self.post('developer/items/publish', {'expected': 1}).json['version'], 2)
        r = self.post('developer/items/rollback', {'expected': 2, 'target': 1})
        self.assertEqual(r.status_code, 200, r.json)
        content = self.client.get(U + 'items/catalog').json['content']
        self.assertEqual({i['id']: i['status'] for i in content['items']}['ghost-circuit'], 'retired')

    def test_vendors_show_their_own_price_and_stock(self):
        self.publish()
        k = {e['item']: e for e in self.get('shop/vendor/kiosk-a').json['entries']}['ghost-circuit']
        v = {e['item']: e for e in self.get('shop/vendor/vend-drinks').json['entries']}['ghost-circuit']
        self.assertEqual((k['price'], k['stock'], v['price'], v['stock']), (75, 2, 50, 9))
        self.assertEqual(self.get('shop/vendor/nowhere').status_code, 404)

    def test_purchase_checks_price_stock_carry_and_credits(self):
        self.publish()
        self.assertEqual(self.buy(credits=74).status_code, 402)
        self.fund('owner', 100)
        r = self.buy(credits=100)
        self.assertEqual((r.status_code, r.json['cost'], r.json['credits'], r.json['owned'], r.json['stock']), (200, 75, 25, 1, 1))
        self.assertEqual(self.buy(qty=2).status_code, 409, 'only one left')
        self.assertEqual(self.buy(qty=0).status_code, 400)
        self.assertEqual(self.buy(qty=-1).status_code, 400)
        self.assertEqual(self.buy(credits=-5).status_code, 400)
        self.assertEqual(self.buy(item='nothing').status_code, 404)
        self.fund('owner', 1000)  # The campaign earned more credits.
        self.assertEqual(self.buy(vendor='vend-drinks', qty=2).status_code, 200)
        self.assertEqual(self.buy(vendor='vend-drinks').status_code, 409, 'carry limit of 3')
        self.assertEqual(self.get('shop/state').json['owned'], {'ghost-circuit': 3})
        self.assertEqual(self.get('shop/vendor/vend-drinks').json['entries'][0]['stock'], 7)

    def test_saved_balance_and_receipt_control_debits(self):
        self.publish()
        self.fund('owner', 1)
        self.assertEqual(self.buy(credits=1000).status_code, 402)
        self.assertEqual(self.get('shop/state').json['owned'], {})
        self.fund('owner', 500)
        body = {'vendor': 'vend-drinks', 'item': 'ghost-circuit', 'qty': 1, 'credits': 500, 'nonce': 'stable-order-1', 'revision': 1}
        one, two = self.post('shop/purchase', body), self.post('shop/purchase', body)
        self.assertEqual((one.json['credits'], two.json['credits'], two.json['cost']), (450, 450, 0))
        self.assertEqual(self.post('shop/purchase', {**body, 'qty': 2}).status_code, 409)

    def test_seller_hours_and_reputation_are_enforced_at_checkout(self):
        c = catalog()
        c['vendors'][1]['rules'] = {'opens': 22, 'closes': 4, 'minRep': 3, 'color': '#0099cc'}
        self.assertEqual(self.publish(c).status_code, 200)
        self.fund('owner', 1000)
        self.assertEqual(self.buy().status_code, 409)
        campaign = self.db.data['vr_players/' + items._tag('owner')]['save']
        campaign['story'] = {'flags': {'gameMin': 60}}
        self.assertEqual(self.buy().status_code, 409)
        campaign['progression'] = {'reputation': {'civilian': 3}}
        self.assertEqual(self.buy().status_code, 200)

    def test_exclusive_service_and_resume(self):
        c = catalog()
        tour = copy.deepcopy(c['items'][0])
        tour.update(id='tour', name='District tour', kind='service', consumable=None, service={'participation': 'follow', 'completion': 'confirm', 'steps': [{'seconds': 3, 'point': 1, 'clip': 'idle', 'line': 'This way.'}]})
        c['items'].append(tour)
        c['vendors'].append({'id': 'npc-guide', 'entity': 'npc-guide', 'name': 'Guide', 'kind': 'npc', 'location': 'District', 'entries': [{'item':'tour','price':20,'stock':10,'maxStock':10,'available':True,'restock':{'mode':'none','every':0,'amount':0}}]})
        self.assertEqual(self.publish(c).status_code, 200)
        self.fund('a', 100); self.fund('b', 100)
        body = {'vendor':'npc-guide','item':'tour','qty':1,'credits':100,'nonce':'service-order-1'}
        with patch('firebase_admin.firestore.transactional', fixtures.transactional):
            a = items.purchase(self.db, 'a', body, now=1000)
            self.assertEqual(a['service']['npc'], 'guide')
            self.assertEqual(items.purchase(self.db, 'a', body, now=1001)['cost'], 0)
            with self.assertRaises(items.DraftError): items.purchase(self.db, 'b', {**body,'nonce':'service-order-2'}, now=1001)
            with self.assertRaises(items.DraftError): items.finish_service(self.db, 'a', {'nonce':body['nonce']}, now=1002)
            self.assertEqual(items.player_state(self.db,'a',now=1004)['owned'], {})
            self.assertTrue(items.finish_service(self.db, 'a', {'nonce':body['nonce']}, now=1005)['finished'])
            self.assertEqual(items.purchase(self.db, 'b', {**body,'nonce':'service-order-2'}, now=1006)['cost'], 20)

    def test_forged_prices_and_extra_fields_are_refused(self):
        self.publish()
        r = self.post('shop/purchase', {'vendor': 'kiosk-a', 'item': 'ghost-circuit', 'qty': 1, 'credits': 1000, 'price': 1, 'nonce': self.nonce()})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.post('shop/purchase', {'vendor': 'kiosk-a', 'item': 'ghost-circuit', 'qty': 1, 'credits': 1000, 'nonce': 'x'}).status_code, 400)

    def test_a_repeated_request_is_not_charged_twice(self):
        self.publish()
        body = {'vendor': 'vend-drinks', 'item': 'ghost-circuit', 'qty': 1, 'credits': 500, 'nonce': 'same-nonce-1'}
        self.fund('owner', 500)
        a, b = self.post('shop/purchase', body), self.post('shop/purchase', body)
        self.assertEqual((a.json['cost'], b.json['cost'], b.json['duplicate']), (50, 0, True))
        self.assertEqual(self.get('shop/state').json['owned']['ghost-circuit'], 1)

    def test_restock_and_never_negative_stock(self):
        self.publish()
        entry = items.SEED and catalog()['vendors'][1]['entries'][0]
        r = items.restocked(entry, {'remaining': 0, 'at': 100, 'base': 2}, 100 + 185)
        self.assertEqual(r['remaining'], 3)
        r = items.restocked(entry, {'remaining': 4, 'at': 100, 'base': 2}, 100 + 6000)
        self.assertEqual(r['remaining'], 5)
        self.assertEqual(items.restocked(entry, {'remaining': 1, 'at': 0, 'base': 7}, 5)['remaining'], 2, 'a changed stock setting resets the count')

    def test_concurrent_buyers_cannot_oversell(self):
        self.publish()
        results = []

        for i in range(5):
            self.fund('u%d' % i, 500)
        def go(i):
            try:
                results.append(items.purchase(self.db, 'u%d' % i, {'vendor': 'kiosk-a', 'item': 'ghost-circuit', 'qty': 1, 'credits': 500, 'nonce': 'nonce-race-%d' % i})['cost'])
            except Exception as e:
                results.append(e.status)
        with patch('firebase_admin.firestore.transactional', fixtures.transactional):
            ts = [threading.Thread(target=go, args=(i,)) for i in range(5)]
            [t.start() for t in ts]; [t.join() for t in ts]
        self.assertEqual(sorted(results), [75, 75, 409, 409, 409])

    def test_use_consumes_one_and_returns_the_servers_definition(self):
        self.publish()
        self.buy(vendor='vend-drinks', qty=2)
        r = self.post('shop/use', {'item': 'ghost-circuit', 'nonce': self.nonce(), 'amount': 99})
        self.assertEqual(r.status_code, 400, 'a client cannot send effect amounts')
        r = self.post('shop/use', {'item': 'ghost-circuit', 'nonce': self.nonce()})
        self.assertEqual(r.status_code, 200, r.json)
        self.assertEqual(r.json['owned'], 1)
        self.assertEqual(r.json['definition']['modifiers'][0]['amount'], .2)
        self.assertEqual(self.post('shop/use', {'item': 'ghost-circuit', 'nonce': self.nonce()}).status_code, 409, 'cooldown')
        st = self.get('shop/state').json
        self.assertEqual(st['modifiers'], {'walkSpeed': .2})
        self.assertEqual(self.post('shop/use', {'item': 'sprint-tonic', 'nonce': self.nonce()}).status_code, 409, 'none owned')
        self.assertEqual(self.post('shop/use', {'item': 'nothing', 'nonce': self.nonce()}).status_code, 404)

    def test_modifiers_follow_delays_and_expire(self):
        a = [{'item': 'x', 'startedAt': 1000, 'definition': catalog()['items'][-1]['consumable'] and {'modifiers': catalog()['items'][-1]['consumable']['modifiers'], 'effects': []}}]
        self.assertEqual(items.modifiers_now(a, 1010), {'walkSpeed': .2})
        self.assertEqual(items.modifiers_now(a, 1100), {'walkSpeed': -.1})
        self.assertEqual(items.modifiers_now(a, 1121), {})
        two = a + [{**a[0], 'item': 'y'}]
        self.assertEqual(items.modifiers_now(two, 1010), {'walkSpeed': .4}, 'stacks, then clamps to the schema range')
        three = two + [{**a[0], 'item': 'z'}]
        self.assertEqual(items.modifiers_now(three, 1010), {'walkSpeed': .5})

    def test_existing_save_and_other_data_untouched(self):
        self.publish()
        self.buy()
        key = 'vr_players/' + items._tag('owner')
        self.assertEqual(self.db.data[key]['save'], {'credits': 925, 'location': 'earth'})
        self.assertEqual(self.db.data[key]['handle'], 'unchanged')
        self.assertTrue(all(k == key or k.startswith(('vr_items_', 'vr_shop_players/')) for k in self.db.data))

    def test_players_without_the_service_get_the_seed(self):
        with patch.dict(os.environ, {'VOID_ACCOUNTS_ENABLED': 'false'}):
            self.assertEqual(self.client.get(U + 'items/catalog').json['version'], 0)


if __name__ == '__main__':
    unittest.main()
