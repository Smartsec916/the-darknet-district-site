"""Account-bound character creation against the REAL Firebase Auth and Firestore emulators, over real HTTP.

Never touches production. It refuses to run unless both emulator addresses are on this machine and the project id
starts with "demo-" (Firebase's reserved prefix for projects that cannot exist online). Without the emulators it is skipped.

  firebase emulators:start --only auth,firestore --project demo-darknet-local     (see docs/development/LOCAL_API_TEST.md)
  FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 python3 -m unittest tests.test_character_emulator
"""
import os, threading, time, unittest, uuid
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

FS, AUTH = os.getenv('FIRESTORE_EMULATOR_HOST', ''), os.getenv('FIREBASE_AUTH_EMULATOR_HOST', '')
PROJECT = 'demo-darknet-local'
LOCAL = lambda h: h.split(':')[0] in ('127.0.0.1', 'localhost')


@unittest.skipUnless(FS and AUTH and LOCAL(FS) and LOCAL(AUTH), 'Firebase emulators are not running locally')
class CharacterEmulatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import requests, firebase_admin
        from firebase_admin import credentials
        from flask import Flask
        from werkzeug.serving import make_server
        assert not os.getenv('GOOGLE_APPLICATION_CREDENTIALS'), 'refusing to run with real Google credentials in the environment'
        os.environ['VOID_ACCOUNTS_ENABLED'] = 'true'
        import void_runner_api as vr
        cls.vr, cls.requests = vr, requests
        vr.PROJECT = PROJECT
        from google.auth.credentials import AnonymousCredentials
        class Dev(credentials.Base):
            def get_credential(self): return AnonymousCredentials()
        try: firebase_admin.get_app('void-runner')
        except ValueError: firebase_admin.initialize_app(Dev(), options={'projectId': PROJECT}, name='void-runner')
        app = Flask(__name__); app.register_blueprint(vr.api)
        cls.server = make_server('127.0.0.1', 0, app, threaded=True)
        cls.base = 'http://127.0.0.1:%d/api/void-runner' % cls.server.server_port
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls): cls.server.shutdown()

    # ---- sign-in through the real Auth emulator ----
    def _auth(self, path, body):
        r = self.requests.post('http://%s/identitytoolkit.googleapis.com/v1/accounts:%s?key=fake' % (AUTH, path), json=body, timeout=20)
        r.raise_for_status(); return r.json()
    def register(self):
        email = 'p%s@example.test' % uuid.uuid4().hex[:10]
        d = self._auth('signUp', {'email': email, 'password': 'correct-horse-9', 'returnSecureToken': True})
        return {'email': email, 'uid': d['localId'], 'token': d['idToken']}
    def login(self, who): return self._auth('signInWithPassword', {'email': who['email'], 'password': 'correct-horse-9', 'returnSecureToken': True})['idToken']
    def guest(self):
        d = self._auth('signUp', {'returnSecureToken': True}); return {'uid': d['localId'], 'token': d['idToken']}
    def H(self, token): return {'Authorization': 'Bearer ' + token}
    def post(self, token, body, **kw): return self.requests.post(self.base + '/character', headers=self.H(token) if token else {}, json=body, timeout=20, **kw)
    def get(self, token): return self.requests.get(self.base + '/character', headers=self.H(token), timeout=20)
    MALE = {'gender': 'male', 'model': 'district-smuggler'}
    FEMALE = {'gender': 'female', 'model': 'district-resident'}

    def test_each_registered_account_creates_exactly_one_character(self):
        a, b = self.register(), self.register()
        self.assertIsNone(self.get(a['token']).json()['character'])
        self.assertEqual(self.post(a['token'], self.FEMALE).status_code, 201)
        for body in (self.FEMALE, self.MALE):
            self.assertEqual(self.post(a['token'], body).status_code, 409)
        self.assertEqual(self.get(a['token']).json()['character']['model'], 'district-resident')
        # another account is independent and keeps its own choice
        self.assertIsNone(self.get(b['token']).json()['character'])
        self.assertEqual(self.post(b['token'], self.MALE).status_code, 201)
        self.assertEqual(self.get(b['token']).json()['character']['model'], 'district-smuggler')
        self.assertEqual(self.get(a['token']).json()['character']['model'], 'district-resident')

    def test_concurrent_creation_yields_one_character(self):
        a = self.register()
        bodies = [self.FEMALE, self.MALE] * 6
        with ThreadPoolExecutor(12) as pool: codes = list(pool.map(lambda b: self.post(a['token'], b).status_code, bodies))
        # Exactly one wins. Contention losers are 409 (already created) or 503 (busy, retry), never a 500.
        self.assertEqual(codes.count(201), 1, codes); self.assertEqual(set(codes) - {201, 409, 503}, set(), codes)
        saved = self.get(a['token']).json()['character']
        self.assertIn(saved['model'], ('district-resident', 'district-smuggler'))
        self.assertEqual(self.get(a['token']).json()['character'], saved)

    def test_guests_cannot_claim_character_identities(self):
        g, reg = self.guest(), self.register()
        self.assertEqual(self.post(g['token'], self.FEMALE).status_code, 403)            # anonymous account: refused
        self.assertEqual(self.post(None, self.FEMALE).status_code, 401)                  # no token
        self.assertEqual(self.post('forged.token.value', self.FEMALE).status_code, 401)  # invalid token
        self.assertIsNone(self.get(g['token']).json()['character'])
        # a guest cannot read or adopt someone else's character by naming their uid
        self.assertEqual(self.post(reg['token'], self.MALE).status_code, 201)
        r = self.requests.post(self.base + '/character?uid=' + reg['uid'], headers={**self.H(g['token']), 'X-Uid': reg['uid']}, json={**self.MALE, 'uid': reg['uid']}, timeout=20)
        self.assertIn(r.status_code, (400, 403)); self.assertIsNone(self.get(g['token']).json()['character'])
        self.assertEqual(self.requests.get(self.base + '/character?uid=' + reg['uid'], headers=self.H(g['token']), timeout=20).json()['character'], None)

    def test_creation_is_server_authorized_not_bypassable(self):
        a = self.register()
        bad = [{'gender': 'female', 'model': 'district-smuggler'}, {'gender': 'male', 'model': 'admin'}, {'gender': 'male', 'model': 'district-smuggler', 'admin': True},
               {**self.MALE, 'uid': 'someone-else'}, {**self.MALE, 'createdAt': 1}, {'gender': 'robot', 'model': 'district-smuggler'}, {'gender': 'male'}, {},
               {'gender': ['male'], 'model': 'district-smuggler'}, {'gender': 'male', 'model': {'$ne': 1}}, ['male', 'district-smuggler'], 'male', None, 7, {'gender': 'male', 'model': '../admin'}]
        for body in bad: self.assertEqual(self.post(a['token'], body).status_code, 400, body)
        r = self.requests.post(self.base + '/character', headers={**self.H(a['token']), 'Content-Type': 'text/plain'}, data='{"gender":"male","model":"district-smuggler"}', timeout=20)
        self.assertEqual(r.status_code, 201) if r.status_code == 201 else self.assertEqual(r.status_code, 400)
        if r.status_code == 201:  # a lenient JSON parse is acceptable only if it still created a valid, single character
            self.assertEqual(self.get(a['token']).json()['character']['model'], 'district-smuggler')
        for verb in ('put', 'patch', 'delete'): self.assertEqual(getattr(self.requests, verb)(self.base + '/character', headers=self.H(a['token']), json=self.MALE, timeout=20).status_code, 405)
        # the browser cannot slip a character in through the save route, and saving never removes it
        from tests.test_story_save import StorySaveTests
        campaign = StorySaveTests().state()
        def save(token, extra):
            rev = self.requests.get(self.base + '/account', headers=self.H(token), timeout=20).json()['revision']
            return self.requests.post(self.base + '/save', headers=self.H(token), json={'revision': rev, 'save': campaign, **extra}, timeout=20)
        b = self.register()
        self.assertEqual(save(b['token'], {'character': {'gender': 'male', 'model': 'admin'}}).status_code, 200)   # a real, valid save
        self.assertIsNone(self.get(b['token']).json()['character'])
        self.assertEqual(save(b['token'], {'save': {**campaign, 'character': self.MALE}}).status_code in (200, 400), True)
        self.assertIsNone(self.get(b['token']).json()['character'])
        self.assertEqual(self.post(b['token'], self.FEMALE).status_code, 201)
        self.assertEqual(save(b['token'], {'character': self.MALE}).status_code, 200)
        self.assertEqual(self.get(b['token']).json()['character']['model'], 'district-resident')

    def test_only_the_authorized_administrator_selects_admin(self):
        admin, other = self.register(), self.register()
        ADMIN = {'gender': 'male', 'model': 'admin'}
        with patch.dict(os.environ, {'VOID_ADMIN_UIDS': admin['uid']}):
            self.assertEqual(self.post(other['token'], ADMIN).status_code, 400)
            self.assertEqual(self.post(self.guest()['token'], ADMIN).status_code, 403)
            self.assertEqual(self.post(admin['token'], {'gender': 'female', 'model': 'admin'}).status_code, 400)
            self.assertEqual(self.post(admin['token'], ADMIN).status_code, 201)
            self.assertEqual(self.post(admin['token'], self.MALE).status_code, 409)          # the single slot is used
            self.assertEqual(self.get(admin['token']).json()['character']['model'], 'admin')
        with patch.dict(os.environ, {'VOID_ADMIN_UIDS': ''}):                                  # admin list empty: nobody gets it
            self.assertEqual(self.post(self.register()['token'], ADMIN).status_code, 400)
        # the administrator list is matched by uid, not by email or handle
        impostor = self.register()
        with patch.dict(os.environ, {'VOID_ADMIN_UIDS': admin['email']}):
            self.assertEqual(self.post(impostor['token'], ADMIN).status_code, 400)

    def test_character_persists_across_logout_and_login(self):
        a = self.register()
        self.assertEqual(self.post(a['token'], self.FEMALE).status_code, 201)
        first = self.get(a['token']).json()['character']
        time.sleep(1.1)                                         # emulator tokens are unsigned and carry a one-second issue time: a later sign-in must differ
        fresh = self.login(a)                                   # a new sign-in after "logout": a different ID token
        self.assertNotEqual(fresh, a['token'])
        self.assertEqual(self.get(fresh).json()['character'], first)
        self.assertEqual(self.requests.get(self.base + '/account', headers=self.H(fresh), timeout=20).json()['character'], first)
        self.assertEqual(self.post(fresh, self.MALE).status_code, 409)                          # still just one after logging back in
        # a guest session on the same browser is a different identity and sees nothing
        self.assertIsNone(self.get(self.guest()['token']).json()['character'])

    def test_appearance_uses_existing_account_document_and_stays_off_by_default(self):
        a, other, guest = self.register(), self.register(), self.guest()
        look = {'v': 1, 'base': 'female', 'look': 'district-resident', 'hair': 'native',
                'hairColor': None, 'clothingColor': None, 'accessories': ['mask']}
        def set_look(token, value):
            return self.requests.post(self.base + '/character/appearance', headers=self.H(token), json=value, timeout=20)
        self.assertEqual(self.post(a['token'], self.FEMALE).status_code, 201)
        with patch.dict(os.environ, {'VOID_APPEARANCE_ENABLED': 'false'}):
            self.assertEqual(set_look(a['token'], look).status_code, 404)
        with patch.dict(os.environ, {'VOID_APPEARANCE_ENABLED': 'true'}):
            self.assertEqual(set_look(other['token'], look).status_code, 409, 'a character is required first')
            self.assertEqual(set_look(guest['token'], look).status_code, 403)
            self.assertEqual(set_look(a['token'], {**look, 'look': '../../admin'}).status_code, 400)
            self.assertEqual(set_look(a['token'], look).status_code, 200)
            self.assertEqual(self.get(a['token']).json()['appearance'], look)
            self.assertEqual(self.requests.get(self.base + '/account', headers=self.H(a['token']), timeout=20).json()['appearance'], look)
            self.assertIsNone(self.get(other['token']).json().get('appearance'), 'one account cannot see another look')
            self.assertEqual(self.get(self.login(a)).json()['appearance'], look, 'a new sign-in reads the stored look')
            self.assertEqual(self.get(a['token']).json()['character']['model'], 'district-resident', 'appearance never changes the one character')


if __name__ == '__main__': unittest.main()
