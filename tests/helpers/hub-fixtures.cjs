/* Test fixtures for the PRODUCTION hub path with no network and no emulator: a local RSA key pair stands in for Google's, tokens are
   signed like Firebase ID tokens, and an in-process fake of the game API answers the two endpoints the hub forwards to. */
'use strict';
const crypto=require('node:crypto');
const PROJECT='the-darknet-district-71873';
const keys=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');

/* accounts: {name: {uid, provider:'password'|'anonymous', model, handle}} */
function makeWorld(accounts){
  const now=Math.floor(Date.now()/1000),tokens={};
  for(const a of Object.values(accounts)){
    const h=b64({alg:'RS256',kid:'test-key',typ:'JWT'}),p=b64({aud:PROJECT,iss:`https://securetoken.google.com/${PROJECT}`,sub:a.uid,iat:now-5,auth_time:now-5,exp:now+3000,...(a.emailVerified?{email_verified:true}:{}),firebase:{sign_in_provider:a.provider||'password'}});
    a.token=h+'.'+p+'.'+crypto.sign('RSA-SHA256',Buffer.from(h+'.'+p),keys.privateKey).toString('base64url');tokens[a.token]=a;
  }
  const calls=[];
  const fetchJwks=async()=>({keys:[{...keys.publicKey.export({format:'jwk'}),kid:'test-key',alg:'RS256',use:'sig'}],maxAge:3600});
  // The fake game API: knows an account only by the bearer token it is given, as the real one does.
  const fetchImpl=async(url,opt)=>{
    const u=new URL(url),bearer=(opt?.headers?.authorization||'').replace(/^Bearer /,''),who=tokens[bearer];calls.push([u.pathname,bearer]);
    const reply=(status,body)=>({ok:status<400,status,headers:{get:()=>'application/json'},json:async()=>body});
    if(!who)return reply(401,{error:'Sign in to continue.'});
    if(u.pathname==='/api/void-runner/character')return reply(200,{character:who.model?{gender:who.model==='district-resident'?'female':'male',model:who.model}:null,...(who.appearance?{appearance:who.appearance}:{})});
    if(u.pathname==='/api/identity/me')return reply(200,{handle:who.handle||null});
    return reply(404,{});
  };
  return {fetchJwks,fetchImpl,calls,accounts,PROJECT};
}
module.exports={makeWorld,PROJECT};
