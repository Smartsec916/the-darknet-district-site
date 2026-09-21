import copy
import os
from types import SimpleNamespace
from unittest.mock import patch
import unittest
import void_runner_api as vr
import test_void_runner_api as fixtures
from server import app

class SpectreTests(unittest.TestCase):
    setUp=fixtures.ApiTests.setUp
    tearDown=fixtures.ApiTests.tearDown
    def test_spectre_price_configuration_is_exactly_one_dollar(self):
        price={'unit_amount':100,'active':True,'livemode':False,'currency':'usd'}
        stripe=SimpleNamespace(Price=SimpleNamespace(retrieve=lambda _:price))
        with patch.dict(os.environ,{'VOID_PRICE_SPECTRE':'price_spectre','STRIPE_SECRET_KEY':'sk_test_fixture'}):
            self.assertEqual(vr.product(stripe,'spectre')['amount'],100)
            for changes in [{'unit_amount':2500},{'unit_amount':99},{'currency':'eur'},{'recurring':{'interval':'month'}},{'active':False},{'livemode':True}]:
                original=copy.deepcopy(price);price.update(changes)
                with self.assertRaises(vr.ApiError):vr.product(stripe,'spectre')
                price.clear();price.update(original)

    def test_spectre_fulfillment_failed_canceled_success_refund_and_account_inventory(self):
        self.db.data['vr_checkouts/abc'].update(item='spectre',amount=100,price='price_spectre')
        self.session.update(amount_total=100,payment_status='unpaid',status='expired')
        self.session['line_items']['data'][0]['price']['id']='price_spectre'
        self.assertEqual(vr.fulfill(self.db,self.stripe,'cs_test_example','pilot'),'pending')
        self.assertEqual(vr.inventory(self.db,'pilot'),[])
        self.session.update(payment_status='paid',status='complete')
        self.session['amount_total']=99
        with self.assertRaises(vr.ApiError):vr.fulfill(self.db,self.stripe,'cs_test_example','pilot')
        self.assertEqual(vr.inventory(self.db,'pilot'),[])
        self.session['amount_total']=100
        with self.assertRaises(vr.ApiError):vr.fulfill(self.db,self.stripe,'cs_test_example','other')
        self.assertEqual(vr.fulfill(self.db,self.stripe,'cs_test_example','pilot'),'paid')
        self.assertEqual(self.client.get('/api/void-runner/account',headers=self.header).json['owned'],['spectre'])
        self.assertEqual(self.client.post('/api/void-runner/checkout',json={'item':'spectre'},headers=self.header).status_code,409)
        self.assertEqual(self.client.post('/api/void-runner/checkout',json={'item':'spectre','owned':True}).status_code,401)
        vr.revoke_payment(self.db,'pi_example')
        self.assertEqual(vr.inventory(self.db,'pilot'),[])
        self.assertEqual(vr.fulfill(self.db,self.stripe,'cs_test_example','pilot'),'revoked')

    def test_save_cannot_create_spectre_inventory(self):
        state={'version':2,'quest':'open','location':'meridian','credits':2500,'completed':2,'upgrades':{'guns':0,'armor':0,'engines':0},'contract':None,'cleared':[],'loadout':{'weapon':'pulse3','shield':'shield3'},'ownedShips':['starter','ship3'],'activeShip':'ship3','standardGear':['pulse3','shield3'],'spectrePurchased':True}
        response=self.client.post('/api/void-runner/save',json={'save':state,'revision':0},headers=self.header)
        self.assertEqual(response.status_code,200)
        data=self.client.get('/api/void-runner/account',headers=self.header).json
        self.assertEqual(data['owned'],[]);self.assertEqual(data['save']['activeShip'],'starter')
        self.assertNotIn('ship3',data['save']['ownedShips']);self.assertNotIn('pulse3',data['save']['standardGear'])
        self.assertNotIn('spectrePurchased',data['save'])

class CorsTests(unittest.TestCase):
    def test_actual_server_cors_including_auth_errors_and_service_errors(self):
        client=app.test_client()
        for origin in ['https://thedarknetdistrict.com','https://www.thedarknetdistrict.com']:
            for path in ['balance','catalog','account','developer/balance']:
                response=client.options('/api/void-runner/'+path,headers={'Origin':origin,'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization,content-type'})
                self.assertEqual(response.status_code,200);self.assertEqual(response.headers['Access-Control-Allow-Origin'],origin)
                self.assertIn('authorization',response.headers['Access-Control-Allow-Headers'].lower());self.assertNotIn('Access-Control-Allow-Credentials',response.headers)
                with patch.object(vr,'services',side_effect=vr.ApiError('Unavailable',503)),patch.dict(os.environ,{'VOID_ACCOUNTS_ENABLED':'true'}):
                    response=client.get('/api/void-runner/'+path,headers={'Origin':origin})
                self.assertEqual(response.status_code,503);self.assertEqual(response.headers['Access-Control-Allow-Origin'],origin)
        denied=client.options('/api/void-runner/account',headers={'Origin':'https://untrusted.example','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization'})
        self.assertNotIn('Access-Control-Allow-Origin',denied.headers)

if __name__=='__main__':unittest.main()
