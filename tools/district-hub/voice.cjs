/* Voice (LiveKit): the hub mints a short-lived access token for a player who asks for one, for the voice room that matches the place they are in.
   - The API secret lives only in this process's environment (LIVEKIT_API_SECRET on Render). It is never sent to a browser, logged or stored.
   - A token is a JWT signed with HMAC-SHA256, in the shape LiveKit's servers accept: issuer = the API key, subject = the participant's identity, and a
     `video` grant naming ONE room. No dependency is needed to make one.
   - Identity is the player's public id (never the account id); the name is the handle the hub already shows. Audio only: no camera or screen can be published.
   - Nothing is recorded or transcribed by this code, and no recording grant is ever issued. */
'use strict';
const crypto=require('node:crypto');
const b64=o=>Buffer.from(typeof o==='string'?o:JSON.stringify(o)).toString('base64url');
const URL_OK=/^wss:\/\/[a-z0-9][a-z0-9.-]{2,120}$/,KEY_OK=/^[A-Za-z0-9]{6,64}$/;
/* env -> {url, key, secret} or null (voice simply off). Wrong or half-set values never stop the hub: multiplayer must not go down because of a typo in a
   voice setting, so they turn voice off and say why (the reason names which variable, never its value). */
function fromEnv(env=process.env,warn=()=>{}){
  const url=String(env.LIVEKIT_URL||'').trim().replace(/\/+$/,''),key=String(env.LIVEKIT_API_KEY||'').trim(),secret=String(env.LIVEKIT_API_SECRET||'');
  if(!url&&!key&&!secret)return null;
  const bad=[!URL_OK.test(url)&&'LIVEKIT_URL (must look like wss://name.livekit.cloud)',!KEY_OK.test(key)&&'LIVEKIT_API_KEY',secret.length<16&&'LIVEKIT_API_SECRET'].filter(Boolean);
  if(bad.length){warn('voice is OFF: check '+bad.join(', '));return null;}
  return {url,key,secret};
}
/* The voice room for a hub room. A shared VR session is its own hub room ('vr:<id>'), so it gets its own voice room: private sessions stay private. */
const roomName=hubRoom=>'dd-'+String(hubRoom).replace(/[^a-z0-9-]/gi,'-').slice(0,60);
function token(voice,{identity,name,room,ttl=600,now=Date.now()}){
  if(!voice||!/^[0-9a-f]{12}$/.test(String(identity))||!room)throw new Error('voice token: bad request');
  const t=Math.floor(now/1000),head={alg:'HS256',typ:'JWT'};
  const body={iss:voice.key,sub:identity,jti:identity+'-'+t,nbf:t-5,exp:t+Math.max(60,Math.min(3600,ttl)),name:String(name||'').slice(0,40),
    video:{room,roomJoin:true,canPublish:true,canSubscribe:true,canPublishData:false,canPublishSources:['microphone']}};   // microphone only: no camera, no screen share
  const signing=b64(head)+'.'+b64(body);
  return {token:signing+'.'+crypto.createHmac('sha256',voice.secret).update(signing).digest('base64url'),expires:body.exp*1000};
}
module.exports={fromEnv,roomName,token};
