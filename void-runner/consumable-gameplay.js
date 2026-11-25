// The authoritative inventory and timestamps belong to the existing shop API.
(function(root){
 'use strict';
 let uid=null,active=[],data=null,offset=0,scene=null,audio=null,retryAt=0,revision=0,lastPoll=0,pending=null;
 const reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const settingsKey='void-runner-consumable-accessibility';
 const defaults=()=>({motion:!reduced(),distortion:!reduced(),flashing:false});
 function preferences(){try{return {...defaults(),...JSON.parse(localStorage.getItem(settingsKey)||'{}')};}catch{return defaults();}}
 let prefs=preferences();
 function setPreference(key,value){if(!Object.hasOwn(defaults(),key))return;prefs[key]=!!value;try{localStorage.setItem(settingsKey,JSON.stringify(prefs));}catch{}}
 function now(){return Date.now()/1000+offset;}
 async function request(path,body){
  const user=root.VoidAccount?.user;if(!user||user.isAnonymous)throw Error('Sign in with a District account.');
  if(!root.VoidDevTest?.active && typeof state!=='undefined' && root.VoidClock &&
     ['shop/state','shop/purchase','keycards/access','keycards/move','keycards/reward'].includes(path)){
   path+='?gameMinute='+root.VoidClock.minutes(state);
  }
  const id=user.uid;let token=await user.getIdToken();
  const call=()=>{if(root.VoidAccount?.user?.uid!==id)throw Error('Account changed.');return root.VoidNetwork.request(path,{token,body,scope:id+':shop'});};
  try{return await call();}catch(e){if(e.status!==401)throw e;token=await user.getIdToken(true);return call();}
 }
 function refresh(){
  const who=root.VoidAccount?.user?.uid;if(!who)return Promise.resolve(null);
  if(pending?.uid===who)return pending.work;
  const v=++revision;
  const work=request('shop/state').then(d=>{if(who===root.VoidAccount?.user?.uid&&v===revision){uid=who;active=d.active||[];data=d;offset=d.now-Date.now()/1000;lastPoll=Date.now();}return d;}).finally(()=>{if(pending?.work===work)pending=null;});
  pending={work,uid:who};return work;
 }
 let sampledRows,sampledTick,sampledFrame;
 function currentFrame(){
  const t=now(),tick=Math.floor(t*60);
  if(sampledRows!==active||sampledTick!==tick){sampledRows=active;sampledTick=tick;sampledFrame=root.VoidConsumableRenderer.sample(active,t);}
  return sampledFrame;
 }
 function loop(){
  const who=root.VoidAccount?.user?.uid;
  if(who!==uid){uid=who;active=[];data=null;lastPoll=0;retryAt=0;revision++;pending=null;}
  if(who&&root.VoidAccount.profileReady&&!document.hidden&&Date.now()>retryAt&&Date.now()-lastPoll>60000){
   retryAt=Date.now()+15000;refresh().catch(()=>{});
  }
  const world=root.VoidBabylon?.scene;
  if(active.length&&world&&world!==scene){scene=world;root.VoidConsumableRenderer.attach(scene,()=>{
    if(!active.length)return null;return {frame:currentFrame(),limits:prefs,time:now()%8192};
   });}
  const frame=currentFrame(),audible=[...frame.effects.keys()].some(k=>k.startsWith('audio'));
  if(audible&&root.VoidAudio?.ready){
   if(!audio){const bus=root.VoidAudio.bus('master');if(bus)audio=root.VoidConsumableAudio.attach(bus.context,bus.node,bus.context.destination);}
   audio?.apply(frame);
  }else if(audio){audio.dispose();audio=null;}
 }
 const api={request,refresh,now,get data(){return uid===root.VoidAccount?.user?.uid?data:null;},get preferences(){return {...prefs};},setPreference,
  modifier(stat){if(!active.length||uid!==root.VoidAccount?.user?.uid)return 0;const rule=root.VoidConsumableSpec.modifiers[stat];return rule?Math.max(rule.min,Math.min(rule.max,currentFrame().modifiers[stat]||0)):0;}};
 root.VoidConsumableGame=api;
 if(root.document){setInterval(loop,350);root.addEventListener('focus',()=>{lastPoll=0;});}
})(globalThis);
