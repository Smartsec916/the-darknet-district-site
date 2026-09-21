"""Local HTTPS fixture using the real Flask app/CORS and production hostnames.
No connection to Firebase, Stripe, or the deployed API is made.
Run with --cert-dir pointing to a scratch directory; certs are self-signed test-only.
"""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import argparse
from datetime import datetime,timedelta,timezone
import time
from flask import request,jsonify,send_from_directory
from server import app
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes,serialization
from cryptography.hazmat.primitives.asymmetric import rsa

settings={'mode':'healthy','owned':[],'requests':[]}
@app.before_request
def fixture():
    path=request.path
    if path=='/__fixture':
        if request.method=='POST':settings.update(request.get_json())
        return jsonify(settings)
    if path.startswith('/api/void-runner/'):
        settings['requests'].append({'path':path,'method':request.method,'origin':request.headers.get('Origin')})
        if settings['mode']=='gateway':return '<title>Service Suspended</title>',503,{'x-render-routing':'suspend'}
        if settings['mode']=='slow':time.sleep(2)
        if request.method=='OPTIONS':return '',200
        if path.endswith('/balance') and '/developer/' not in path:
            from void_runner_api import BALANCE_DEFAULTS
            return jsonify(values=BALANCE_DEFAULTS)
        if path.endswith('/catalog'):return jsonify(products=[{'id':'spectre','amount':100,'currency':'usd'}],testMode=True)
        if request.headers.get('Authorization')!='Bearer fixture-token':return jsonify(error='Sign in to continue.'),401
        if path.endswith('/account'):return jsonify(owned=settings['owned'],revision=0,save=None,savedAt=None,developer=False)
        if path.endswith('/developer/balance'):return jsonify(error='Not authorized'),403
        if path.endswith('/checkout'):return jsonify(error='Fixture does not create real payments.'),503
    if path=='/firebase-auth.js':return "export const auth={currentUser:null};export function onAuthStateChanged(auth,cb){window.fixtureIdentity=cb;queueMicrotask(()=>cb(null));return ()=>{};} export async function getRedirectResult(){} export async function signOut(){window.fixtureIdentity(null);}",200,{'Content-Type':'text/javascript'}
    if path=='/void-runner.html':return send_from_directory(app.root_path,'void-runner.html')

# Flask executes after_request hooks in reverse order: remove CORS after the real hook.
def gateway_headers(response):
    if settings['mode']=='gateway' and request.path.startswith('/api/void-runner/'):
        for name in list(response.headers.keys()):
            if name.lower().startswith('access-control-'):response.headers.pop(name,None)
    return response
app.after_request_funcs[None].insert(0,gateway_headers)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--cert-dir',required=True);args=parser.parse_args()
    directory=Path(args.cert_dir);directory.mkdir(parents=True,exist_ok=True)
    key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
    name=x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'VOID local test')])
    hosts=['thedarknetdistrict.com','www.thedarknetdistrict.com','the-darknet-district-site.onrender.com','localhost']
    cert=x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key()).serial_number(x509.random_serial_number()).not_valid_before(datetime.now(timezone.utc)-timedelta(days=1)).not_valid_after(datetime.now(timezone.utc)+timedelta(days=2)).add_extension(x509.SubjectAlternativeName([x509.DNSName(h) for h in hosts]),False).sign(key,hashes.SHA256())
    (directory/'fixture.key').write_bytes(key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.TraditionalOpenSSL,serialization.NoEncryption()))
    (directory/'fixture.crt').write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    app.run(host='127.0.0.1',port=5443,threaded=True,ssl_context=(str(directory/'fixture.crt'),str(directory/'fixture.key')))
