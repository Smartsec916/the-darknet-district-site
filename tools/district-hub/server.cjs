#!/usr/bin/env node
/* The District hub. Two modes, chosen by HUB_MODE:
     emulator (default)  local development against the Firebase emulators (docs/development/LOCAL_API_TEST.md). Never reaches anything else.
     production          Google public-key token verification + the existing game API; see docs/development/HUB_DEPLOYMENT.md.
   Nothing here deploys itself: it runs only where someone starts it. */
'use strict';
const {fromEnv}=require('./config.cjs');
const {start}=require('./hub-server.cjs');
const {ConnectionGate}=require('./limits.cjs');
const {DisabledLedger,SimulatedLedger}=require('./ledger.cjs');
const crypto=require('node:crypto');

/* `deps` exists so tests can supply a key set, a network and a local page origin without touching the internet: {fetchJwks, fetchImpl, origins}. */
async function main(env=process.env,deps={}){
  const cfg=fromEnv(env),log=deps.log||(deps.quiet?()=>{}:(...a)=>console.log(new Date().toISOString(),...a));
  let identify,label;
  if(cfg.mode==='emulator'){
    const providers=require('./emulator-providers.cjs').create(env);identify=t=>providers.identify(t);label='emulator project '+providers.project;
  }else{
    const {createVerifier}=require('./google-auth.cjs'),{createApiProvider}=require('./api-providers.cjs');
    const verifier=createVerifier({projectId:cfg.projectId,fetchJwks:deps.fetchJwks,log:(l,m)=>log(l,m)}),api=createApiProvider({apiBase:cfg.apiBase,fetchImpl:deps.fetchImpl,log:(l,m)=>log(l,m)});
    identify=async token=>{const who=await verifier.verify(token);if(!who)return null;if(cfg.denied.has(who.uid)||(cfg.allowed&&!cfg.allowed.has(who.uid)))return {...who,model:null,handle:null};
      return {...who,...(await api.profile(token,who))};};
    label='production (API '+cfg.apiBase+', '+(cfg.allowed?cfg.allowed.size+' allowed account(s)':'ANY signed-in account')+')';
  }
  // The ledger: disabled unless local simulated trading was asked for (emulator mode only; config.cjs refuses it in production).
  const sim=uid=>({credits:1000,stacks:{'scrap-plate':12,'med-gel':3,'drive-coil':2},equipment:['pulse1-'+crypto.createHash('sha256').update('p'+uid).digest('hex').slice(0,8),'shield1-'+crypto.createHash('sha256').update('s'+uid).digest('hex').slice(0,8)]});
  if(deps.ledger&&cfg.mode==='production'&&deps.allowTestLedger!==true)throw new Error('A production hub cannot be given a ledger: trading stays disabled.');
  const ledger=deps.ledger||(cfg.tradingSimulated?new SimulatedLedger({defaults:sim}):new DisabledLedger());
  const hub=await start({ledger,identify,access:{allowed:cfg.allowed,denied:cfg.denied},origins:deps.origins??cfg.origins,trustHops:cfg.trustHops,port:cfg.port,host:cfg.host,
    gate:new ConnectionGate({perIp:cfg.perIp,perIpPerMinute:cfg.perIpPerMinute,total:cfg.total}),log});
  log(`District hub listening on ${cfg.host}:${hub.port} - ${label}`);
  if(!deps.quiet){const stop=()=>hub.close().then(()=>process.exit(0));process.on('SIGTERM',stop);process.on('SIGINT',stop);}
  return hub;
}
if(require.main===module)main().catch(e=>{console.error('District hub not started:',e.message);process.exit(1);});
module.exports={main};
