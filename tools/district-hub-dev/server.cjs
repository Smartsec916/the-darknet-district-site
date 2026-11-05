#!/usr/bin/env node
/* Local District hub for development: node tools/district-hub-dev/server.cjs [port]   (default 8787)
   Needs the local Auth and Firestore emulators (docs/development/LOCAL_API_TEST.md). Never connects to anything else. */
'use strict';
const providers=require('./emulator-providers.cjs').create();
const {start}=require('./hub-server.cjs');
const port=Number(process.argv[2]||process.env.HUB_PORT||8787);
const s=start({providers,port,log:(...a)=>console.log(new Date().toISOString(),...a)});
s.wss.on('listening',()=>console.log(`District dev hub on ws://127.0.0.1:${s.port} (emulator project ${providers.project})`));
process.on('SIGINT',()=>s.close().then(()=>process.exit(0)));
