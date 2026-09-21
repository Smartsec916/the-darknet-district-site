"""Exercise payment trust boundaries using real Flask/Stripe parsing and fake cloud storage."""
import copy
import hashlib
import hmac
import json
import os
import time
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from flask import Flask
import stripe
import void_runner_api as vr


class Snapshot:
    def __init__(self, ref): self.reference = ref
    def to_dict(self): return copy.deepcopy(self.reference.db.data.get(self.reference.key))


class Ref:
    def __init__(self, db, key): self.db, self.key = db, key
    def get(self, **kwargs): return Snapshot(self)
    def set(self, data, merge=False): self.db.data[self.key] = {**(self.db.data.get(self.key, {}) if merge else {}), **copy.deepcopy(data)}
    def update(self, data): self.set(data, True)
    def delete(self): self.db.data.pop(self.key, None)
    def collection(self, name): return Collection(self.db, self.key+'/'+name)


class Collection:
    def __init__(self, db, key): self.db, self.key = db, key
    def document(self, key): return Ref(self.db, self.key+'/'+key)
    def where(self, filter):
        return SimpleNamespace(stream=lambda: [Snapshot(Ref(self.db,k)) for k,v in self.db.data.items() if k.startswith(self.key+'/') and v.get(filter.field_path) == filter.value])


class DB:
    def __init__(self): self.data = {}
    def collection(self, key): return Collection(self, key)
    def transaction(self): return SimpleNamespace(set=lambda ref,data,**kw:ref.set(data,**kw))


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.db=DB();self.auth=SimpleNamespace(verify_id_token=lambda token,**kw:{'uid':token} if token=='pilot' else (_ for _ in ()).throw(ValueError()))
        self.app=Flask(__name__);self.app.register_blueprint(vr.api);self.client=self.app.test_client()
        self.services=patch.object(vr,'services',return_value=(self.db,self.auth,None));self.services.start()
        self.tx=patch('firebase_admin.firestore.transactional',lambda f:f);self.tx.start()
        self.header={'Authorization':'Bearer pilot'}
        self.session={'id':'cs_test_example','metadata':{'attempt':'abc'},'client_reference_id':'pilot','payment_status':'paid','amount_total':499,'currency':'usd','livemode':False,'line_items':{'data':[{'quantity':1,'price':{'id':'price_example'}}]},'payment_intent':{'id':'pi_example','latest_charge':{'amount_refunded':0,'disputed':False}}}
        self.stripe=SimpleNamespace(checkout=SimpleNamespace(Session=SimpleNamespace(retrieve=lambda *a,**k:copy.deepcopy(self.session))))
        self.db.collection('vr_checkouts').document('abc').set({'uid':'pilot','price':'price_example','item':'wraith','amount':499,'currency':'usd','live':False})
    def tearDown(self): self.services.stop();self.tx.stop()
    def test_missing_and_invalid_login_rejected(self):
        self.assertEqual(self.client.get('/api/void-runner/account').status_code,401)
        self.assertEqual(self.client.get('/api/void-runner/account',headers={'Authorization':'Bearer forged'}).status_code,401)
    def test_developer_endpoints_fail_closed(self):
        for method in [self.client.get, self.client.post]:
            self.assertEqual(method('/api/void-runner/developer/balance').status_code,401)
            self.assertEqual(method('/api/void-runner/developer/balance',headers={'Authorization':'Bearer forged'}).status_code,401)
            with patch.dict(os.environ, {'VOID_ADMIN_UIDS': ''}):
                self.assertEqual(method('/api/void-runner/developer/balance',headers=self.header).status_code,403)
        self.assertNotIn('vr_config/combat',self.db.data)
    def test_admin_balance_validation_conflict_and_isolation(self):
        with patch.dict(os.environ, {'VOID_ADMIN_UIDS': 'other, pilot'}):
            original=self.client.get('/api/void-runner/developer/balance',headers=self.header).json
            values={**original['values'],'enemyHull':8}
            payload={'values':values,'revision':0,'preset':'CUSTOM'}
            self.assertEqual(self.client.post('/api/void-runner/developer/balance',headers=self.header,json=payload).status_code,200)
            self.assertEqual(self.client.post('/api/void-runner/developer/balance',headers=self.header,json=payload).status_code,409)
            self.assertEqual(self.db.data['vr_config/combat']['updatedBy'],'pilot')
            for invalid in [True,-1,1000000,'10',float('inf')]:
                payload['values']={**values,'enemyHull':invalid};payload['revision']=1
                self.assertEqual(self.client.post('/api/void-runner/developer/balance',headers=self.header,json=payload).status_code,400)
            payload['values']={**values,'admin':True}
            self.assertEqual(self.client.post('/api/void-runner/developer/balance',headers=self.header,json=payload).status_code,400)
            self.assertEqual(self.db.data['vr_config/combat']['revision'],1)
            self.assertEqual(self.client.get('/api/void-runner/account',headers=self.header).json['owned'],[])
            self.assertIsNone(self.client.get('/api/void-runner/account',headers=self.header).json['save'])
    def test_repeated_fulfillment_grants_only_one_item(self):
        for _ in range(3): self.assertEqual(vr.fulfill(self.db,self.stripe,'cs_test_example','pilot'),'paid')
        self.assertEqual(vr.inventory(self.db,'pilot'),['wraith'])
        self.assertEqual(len([k for k in self.db.data if k.startswith('vr_orders/')]),1)
        self.assertEqual(vr.inventory(self.db,'other'),[])
    def test_other_account_cannot_claim_order(self):
        with self.assertRaises(vr.ApiError): vr.fulfill(self.db,self.stripe,'cs_test_example','other')
        self.assertEqual(vr.inventory(self.db,'other'),[])
    def test_unpaid_wrong_price_amount_or_mode_never_grants(self):
        self.session['payment_status']='unpaid';self.assertEqual(vr.fulfill(self.db,self.stripe,'cs_test_example'),'pending')
        self.session['payment_status']='paid'
        for key,value in [('amount_total',1),('currency','eur'),('livemode',True)]:
            old=self.session[key];self.session[key]=value
            with self.assertRaises(vr.ApiError):vr.fulfill(self.db,self.stripe,'cs_test_example')
            self.session[key]=old
        self.session['line_items']['data'][0]['price']['id']='price_fake'
        with self.assertRaises(vr.ApiError):vr.fulfill(self.db,self.stripe,'cs_test_example')
        self.assertEqual(vr.inventory(self.db,'pilot'),[])
    def test_refund_before_or_after_completion_cannot_be_regranted(self):
        vr.revoke_payment(self.db,'pi_example')
        self.assertEqual(vr.fulfill(self.db,self.stripe,'cs_test_example'),'revoked')
        self.assertEqual(vr.inventory(self.db,'pilot'),[])
        self.db.data.pop('vr_payment_blocks/pi_example')
        self.assertEqual(vr.fulfill(self.db,self.stripe,'cs_test_example'),'revoked')
    def test_partial_refund_revokes_and_duplicate_purchase_is_rejected(self):
        vr.fulfill(self.db,self.stripe,'cs_test_example')
        self.assertEqual(self.client.post('/api/void-runner/checkout',json={'item':'wraith'},headers=self.header).status_code,409)
        self.session['payment_intent']['latest_charge']['amount_refunded']=100
        self.assertEqual(vr.fulfill(self.db,self.stripe,'cs_test_example'),'revoked')
    def test_save_conflict_and_ownership_fields(self):
        state={'version':2,'quest':'open','location':'meridian','credits':100,'reputation':5,'completed':2,'upgrades':{'guns':1,'armor':0,'engines':0},'cleared':[],'contract':None,'loadout':{'weapon':'wraith','shield':None,'utility':None},'owned':['wraith']}
        response=self.client.post('/api/void-runner/save',json={'save':state,'revision':0},headers=self.header)
        self.assertEqual(response.status_code,200)
        self.assertEqual(self.client.post('/api/void-runner/save',json={'save':state,'revision':0},headers=self.header).status_code,409)
        account=self.client.get('/api/void-runner/account',headers=self.header).json
        self.assertNotIn('owned',account['save']);self.assertEqual(account['owned'],[])
        state['credits']=True
        self.assertEqual(self.client.post('/api/void-runner/save',json={'save':state,'revision':1},headers=self.header).status_code,400)
    def test_ship_progression_and_route_roundtrip_stays_separate_from_purchases(self):
        state={'version':2,'quest':'open','location':'meridian','credits':500,'completed':2,'upgrades':{'guns':1,'armor':0,'engines':0},'cleared':[],'contract':'medicine','loadout':{'weapon':'pulse2','shield':'shield2','utility':None,'missile':'launcher'},'creditGear':['launcher'],'ownedShips':['starter','ship2'],'activeShip':'ship2','standardGear':['pulse1','shield1','pulse2','shield2'],'shipLoadouts':{'ship2':{'weapon':'pulse2','shield':'shield2','missile':'launcher'}},'combatRuns':2,'missileOfferSeen':True,'travel':{'origin':'meridian','destination':'kepler','mission':'medicine','progress':.42,'encounter':{'type':'combat','state':'active'}},'owned':['wraith']}
        clean=vr.clean_save(state)
        self.assertEqual(clean['activeShip'],'ship2')
        self.assertEqual(clean['shipLoadouts']['ship2']['missile'],'launcher')
        self.assertTrue(clean['missileUnlocked'])
        self.assertTrue(clean['missileOfferSeen'])
        self.assertEqual(clean['travel']['progress'],.42)
        self.assertNotIn('owned',clean)
        self.assertEqual(self.client.post('/api/void-runner/save',json={'save':state,'revision':0},headers=self.header).status_code,200)
        account=self.client.get('/api/void-runner/account',headers=self.header).json
        self.assertEqual(account['save'],clean)
        self.assertEqual(account['owned'],[])
        for patch in [{'ownedShips':['wraith']},{'standardGear':['aegis']},{'activeShip':'invalid'},{'combatRuns':True},{'travel':{**state['travel'],'progress':float('nan')}},{'shipLoadouts':{'ship2':{'missile':'wraith'}}}]:
            with self.assertRaises(vr.ApiError):
                vr.clean_save({**state,**patch})

    def test_credit_equipment_save_roundtrip_cannot_grant_paid_gear(self):
        state={'version':2,'quest':'return','location':'kepler','credits':150,'reputation':2,'completed':1,'upgrades':{'guns':0,'armor':0,'engines':0,'shields':1},'cleared':[],'contract':None,'loadout':{'weapon':None,'shield':None,'utility':'scout'},'creditGear':['scout'],'loginOfferSeen':True}
        response=self.client.post('/api/void-runner/save',json={'save':state,'revision':0},headers=self.header)
        self.assertEqual(response.status_code,200)
        account=self.client.get('/api/void-runner/account',headers=self.header).json
        self.assertEqual(account['save'],vr.clean_save(state))
        self.assertEqual(account['save']['ownedShips'],['starter'])
        self.assertEqual(account['save']['activeShip'],'starter')
        self.assertEqual(account['save']['combatRuns'],1)
        self.assertNotIn('reputation',account['save'])
        modern={k:v for k,v in state.items() if k!='reputation'}
        self.assertEqual(vr.clean_save(modern),account['save'])
        state['reputation']='ignored legacy value'
        self.assertEqual(vr.clean_save(state),account['save'])
        self.assertEqual(account['owned'],[])
        state['creditGear']=['sentinel']
        self.assertEqual(self.client.post('/api/void-runner/save',json={'save':state,'revision':1},headers=self.header).status_code,400)
    def test_actual_stripe_signature_verification(self):
        event={'id':'evt_test','type':'charge.refunded','data':{'object':{'payment_intent':'pi_example'}}}
        body=json.dumps(event);stamp=int(time.time());secret='whsec_test_fixture'
        signature=hmac.new(secret.encode(),f'{stamp}.{body}'.encode(),hashlib.sha256).hexdigest()
        with patch.object(vr,'payment_service',return_value=stripe),patch.dict(os.environ,{'STRIPE_WEBHOOK_SECRET':secret}):
            self.assertEqual(self.client.post('/api/void-runner/webhook',data=body,headers={'Stripe-Signature':'bad'},content_type='application/json').status_code,400)
            self.assertEqual(self.client.post('/api/void-runner/webhook',data=body,headers={'Stripe-Signature':f't={stamp},v1={signature}'},content_type='application/json').status_code,200)
            self.assertTrue(self.db.data['vr_payment_blocks/pi_example']['blocked'])
    def test_live_payments_require_explicit_enable(self):
        with patch.dict(os.environ,{'STRIPE_SECRET_KEY':'sk_live_fixture','VOID_ALLOW_LIVE_PAYMENTS':'false'}):
            with self.assertRaises(vr.ApiError):vr.payment_service()
    def test_test_purchases_do_not_become_live_equipment(self):
        vr.fulfill(self.db,self.stripe,'cs_test_example')
        with patch.dict(os.environ,{'STRIPE_SECRET_KEY':'sk_live_fixture'}):
            self.assertEqual(vr.inventory(self.db,'pilot'),[])
    def test_checkout_uses_server_price_and_reuses_pending_session(self):
        created=[]
        def create(**kwargs):
            created.append(kwargs)
            return {'id':'cs_pending','url':'https://checkout.stripe.com/c/pay/test'}
        self.stripe.Price=SimpleNamespace(retrieve=lambda pid:{'id':pid,'unit_amount':499,'currency':'usd','active':True,'livemode':False})
        self.stripe.checkout.Session.create=create
        self.stripe.checkout.Session.retrieve=lambda sid:{'id':sid,'status':'open','url':'https://checkout.stripe.com/c/pay/test'}
        with patch.object(vr,'payment_service',return_value=self.stripe),patch.dict(os.environ,{'STRIPE_SECRET_KEY':'sk_test_fixture','VOID_PRICE_WRAITH':'price_real'}):
            for _ in range(2):
                response=self.client.post('/api/void-runner/checkout',json={'item':'wraith','price':'price_fake','uid':'other','amount':1},headers=self.header)
                self.assertEqual(response.status_code,200)
        self.assertEqual(len(created),1)
        self.assertEqual(created[0]['client_reference_id'],'pilot')
        self.assertEqual(created[0]['line_items'],[{'price':'price_real','quantity':1}])


if __name__=='__main__': unittest.main()
