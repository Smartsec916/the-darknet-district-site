/* Verifies a Firebase ID token with Google's published public keys: no secret and no service account, the same method the Iris
   service uses (iris-service/server/firebaseAuth.ts, which this follows check for check). Who someone is comes ONLY from here.
     - the signature is RS256 and matches one of Google's current keys (never "none", never an HMAC trick),
     - issued for this Firebase project (audience and issuer), not expired, not issued in the future.
   One thing the Admin SDK can do that this cannot: ask whether the account was revoked, so a revoked token works until it expires
   (up to an hour). The hub's uid deny-list (HUB_DENY_UIDS) is the control for that. */
'use strict';
const crypto=require('node:crypto');

const DEFAULT_PROJECT='the-darknet-district-71873';
const JWKS_URL='https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const MAX_TOKEN=8192,SKEW=300;

/* `fetchJwks()` returns {keys:[jwk...], maxAge?:seconds}; the default asks Google, tests pass their own. */
function defaultFetchJwks(fetchImpl=fetch){
  return async()=>{
    const r=await fetchImpl(JWKS_URL,{signal:AbortSignal.timeout(5000),headers:{accept:'application/json'}});
    if(!r.ok)throw new Error('key server answered '+r.status);
    const m=/max-age=(\d+)/.exec(r.headers.get('cache-control')||'');
    return {...(await r.json()),maxAge:m?Number(m[1]):undefined};
  };
}

function createVerifier({projectId=DEFAULT_PROJECT,fetchJwks=defaultFetchJwks(),now=()=>Date.now(),log=()=>{}}={}){
  let cache=null,inflight=null;
  async function load(){
    try{
      const body=await fetchJwks(),keys=new Map();
      for(const jwk of body.keys||[]){if(jwk.kty!=='RSA'||!jwk.kid)continue;try{keys.set(jwk.kid,crypto.createPublicKey({key:jwk,format:'jwk'}));}catch{}}
      if(!keys.size)throw new Error('no usable keys');
      const ttl=Math.min(Math.max(body.maxAge??3600,300),86400)*1000;
      return {keys,fetchedAt:now(),expires:now()+ttl};
    }catch(e){log('warn','keys unavailable: '+String(e.message).slice(0,100));return null;}
  }
  async function keyFor(kid){
    const stale=!cache||cache.expires<now();
    // An unknown key id can mean Google rotated its keys: refresh, but never more than once a minute.
    const unknown=cache&&!cache.keys.has(kid)&&now()-cache.fetchedAt>60_000;
    if(stale||unknown){inflight??=load().finally(()=>{inflight=null;});const fresh=await inflight;if(fresh)cache=fresh;}
    return cache?.keys.get(kid)||null;
  }
  const decode=part=>{try{const v=JSON.parse(Buffer.from(part,'base64url').toString('utf8'));return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch{return null;}};

  /* -> {uid, anonymous, provider, expiresAt} or null. Anything wrong at all is simply "not signed in". */
  async function verify(token){
    if(typeof token!=='string'||!token||token.length>MAX_TOKEN)return null;
    const parts=token.split('.');if(parts.length!==3)return null;
    const header=decode(parts[0]),payload=decode(parts[1]);if(!header||!payload)return null;
    if(header.alg!=='RS256'||typeof header.kid!=='string')return null;
    const key=await keyFor(header.kid);if(!key)return null;
    let ok=false;try{ok=crypto.verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),key,Buffer.from(parts[2],'base64url'));}catch{return null;}
    if(!ok)return null;
    const t=Math.floor(now()/1000);
    if(payload.aud!==projectId||payload.iss!==`https://securetoken.google.com/${projectId}`)return null;
    if(typeof payload.sub!=='string'||!payload.sub||payload.sub.length>128)return null;
    if(typeof payload.exp!=='number'||payload.exp<=t)return null;
    if(typeof payload.iat!=='number'||payload.iat>t+SKEW)return null;
    if(typeof payload.auth_time!=='number'||payload.auth_time>t+SKEW)return null;
    const provider=typeof payload.firebase?.sign_in_provider==='string'?payload.firebase.sign_in_provider:'unknown';
    return {uid:payload.sub,provider,anonymous:provider==='anonymous',expiresAt:payload.exp};
  }
  return {verify,reset(){cache=null;inflight=null;}};
}
module.exports={createVerifier,DEFAULT_PROJECT,JWKS_URL};
