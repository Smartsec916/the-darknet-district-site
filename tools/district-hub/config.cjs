/* Hub configuration from environment variables. Fails closed: a production hub with no allow-list refuses to start rather than
   quietly letting everyone in. Nothing secret is needed or read here. */
'use strict';
const {isLocal}=require('./emulator-providers.cjs');

const list=v=>String(v||'').split(',').map(s=>s.trim()).filter(Boolean);
const SITE_ORIGINS=['https://thedarknetdistrict.com','https://www.thedarknetdistrict.com'];

function fromEnv(env=process.env){
  const mode=env.HUB_MODE==='production'?'production':'emulator';
  const cfg={mode,port:Number(env.PORT||env.HUB_PORT||8787),
    perIp:Number(env.HUB_MAX_PER_IP||4),perIpPerMinute:Number(env.HUB_MAX_NEW_PER_MINUTE||20),total:Number(env.HUB_MAX_CONNECTIONS||60),
    trustHops:Number(env.HUB_TRUST_PROXY_HOPS??(env.RENDER?1:0))};
  for(const k of ['port','perIp','perIpPerMinute','total','trustHops'])if(!Number.isInteger(cfg[k])||cfg[k]<0)throw new Error(`HUB setting for ${k} must be a whole number`);
  if(mode==='emulator'){
    if(!isLocal(env.FIREBASE_AUTH_EMULATOR_HOST)||!isLocal(env.FIRESTORE_EMULATOR_HOST))throw new Error('Emulator mode needs FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST on this machine.');
    return {...cfg,host:'127.0.0.1',origins:null,allowed:null,denied:new Set(list(env.HUB_DENY_UIDS))};
  }
  // Production: public host, exact origins, an explicit allow-list.
  const apiBase=env.HUB_API_BASE||'';
  if(!/^https:\/\/[^/\s]+$/.test(apiBase))throw new Error('HUB_API_BASE must be the game API origin, for example https://the-darknet-district-site.onrender.com');
  const allowed=new Set(list(env.HUB_ALLOWED_UIDS));
  if(!allowed.size&&env.HUB_ALLOW_ANY_SIGNED_IN!=='true')throw new Error('HUB_ALLOWED_UIDS is empty. The first test is restricted to listed accounts; set HUB_ALLOW_ANY_SIGNED_IN=true only when the owner approves an open test.');
  const origins=list(env.HUB_ALLOWED_ORIGINS||SITE_ORIGINS.join(','));
  if(origins.some(o=>!/^https:\/\/[^/\s*]+$/.test(o)))throw new Error('HUB_ALLOWED_ORIGINS must be exact https origins (no wildcards).');
  return {...cfg,host:'0.0.0.0',apiBase,projectId:env.FIREBASE_PROJECT_ID||undefined,origins,allowed:allowed.size?allowed:null,denied:new Set(list(env.HUB_DENY_UIDS))};
}
module.exports={fromEnv,SITE_ORIGINS};
