/* Two independent browser sessions in one local District instance. Needs the local Auth and Firestore emulators:
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 SITE_TEST_URL=http://127.0.0.1:5187 node tests/multiplayer-browser.cjs [low|high]
   It starts its own hub (in this process, local only) and uses throwaway emulator accounts. No production service is contacted. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const AUTH=process.env.FIREBASE_AUTH_EMULATOR_HOST,STORE=process.env.FIRESTORE_EMULATOR_HOST,base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
if(!AUTH||!STORE){console.log('skipped: emulators are not running');process.exit(0);}
const tier=process.argv[2]==='high'?'high':'low';
const {create}=require('../tools/district-hub/emulator-providers.cjs'),{start}=require('../tools/district-hub/hub-server.cjs');
const post=async(path,body)=>(await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:${path}?key=fake`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})).json();
const account=async model=>{const d=await post('signUp',{email:`mp${crypto.randomUUID().slice(0,8)}@example.test`,password:'correct-horse-9',returnSecureToken:true});
 await fetch(`http://${STORE}/v1/projects/demo-darknet-local/databases/(default)/documents/vr_players/${crypto.createHash('sha256').update(d.localId).digest('hex')}`,{method:'PATCH',headers:{authorization:'Bearer owner','content-type':'application/json'},body:JSON.stringify({fields:{character:{mapValue:{fields:{gender:{stringValue:model==='district-resident'?'female':'male'},model:{stringValue:model}}}}}})});
 return {uid:d.localId,token:d.idToken,model};};
let pa,pb;
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const providers=create();let hub=await start({identify:t=>providers.identify(t)}),port=hub.port;
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']}),errors=[];
 const A=await account('district-resident'),B=await account('district-smuggler');
 async function player(acct){
  const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'}),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.setDefaultTimeout(240000);   // two software-rendered High scenes share this machine: a click can wait seconds for a frame
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(([q,t])=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q}));localStorage.setItem('tdd-dev-mp-token',t);},[tier,acct.token]);
  await page.goto(`${base}/void-runner.html?multiplayer=1&hub=ws://127.0.0.1:${port}`);await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');
  const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0,null,{timeout:120000});
  return {ctx,page};};
 const peersOf=p=>p.page.evaluate(()=>VoidRemotePlayers.peers);
 const diag=async()=>{for(const [n,q] of [['A',pa],['B',pb]])if(q)console.error('DIAG',n,JSON.stringify(await q.page.evaluate(()=>({status:VoidRemotePlayers.status,lastClose:VoidRemotePlayers.lastClose,peers:VoidRemotePlayers.peers.map(x=>({id:x.id,drawn:x.drawn,clip:x.clip})),mode,area:walkingLocation?.area,pending:VoidAssets.pending}))));console.error('DIAG hub',JSON.stringify([...hub.hub.peers.values()].map(q=>({id:q.id,placed:q.placed}))));};
 const untilPeers=async(p,fn,ms=90000)=>{try{await p.page.waitForFunction(f=>{const v=VoidRemotePlayers.peers;return eval('('+f+')')(v);},fn.toString(),{timeout:ms,polling:200});}catch(e){await diag();throw e;}};
 const snapshot=p=>p.page.evaluate(()=>({loc:state.location,credits:state.credits,quest:state.quest,story:JSON.stringify(state.story),npcs:(()=>{const remote=n=>{for(let q=n.parent;q;q=q.parent)if(/^remote-player:/.test(q.name))return true;return false;};return VoidBabylon.scene.transformNodes.filter(n=>/^crowd:/.test(n.name)&&!remote(n)).length;})()}));
 try{
  pa=await player(A);pb=await player(B);
  const before=[await snapshot(pa),await snapshot(pb)];
  // 1. Both see exactly one other player, drawn, wearing the character the SERVER stored for that account.
  try{await untilPeers(pa,v=>v.length===1&&v[0].drawn);await untilPeers(pb,v=>v.length===1&&v[0].drawn);}
  catch(e){for(const [n,q] of [['A',pa],['B',pb]])console.error('DIAG',n,JSON.stringify(await q.page.evaluate(()=>({status:VoidRemotePlayers.status,lastClose:VoidRemotePlayers.lastClose,peers:VoidRemotePlayers.peers,mode,loc:walkingLocation?.id,area:walkingLocation?.area,pending:VoidAssets.pending,failed:[...VoidAssets.failed.keys()]}))));
   console.error('DIAG hub',JSON.stringify([...hub.hub.peers.values()].map(q=>({id:q.id,placed:q.placed,x:q.x,z:q.z}))));throw e;}
  const seenByA=(await peersOf(pa))[0],seenByB=(await peersOf(pb))[0];if(!seenByA||!seenByB){await diag();throw new Error('a peer vanished right after being drawn');}
  assert.equal(seenByA.model,'district-smuggler','A sees B as B\'s character');assert.equal(seenByB.model,'district-resident','B sees A as A\'s character');
  assert(seenByA.name.startsWith('Pilot-')&&seenByB.name.startsWith('Pilot-'));
  // 2. Movement, facing and animation. B walks for real; A must see B arrive within a small error, walking then idle.
  const b0=await pb.page.evaluate(()=>({x:walker.x,z:walker.z}));
  await pb.page.keyboard.down('KeyW');
  await pa.page.waitForFunction(()=>VoidRemotePlayers.peers[0]?.seen.includes('walk'),null,{timeout:90000,polling:100});   // A was told B is walking
  await pb.page.waitForFunction(p=>Math.hypot(walker.x-p.x,walker.z-p.z)>.8,b0,{timeout:60000,polling:100});await pb.page.keyboard.up('KeyW');
  await pa.page.waitForFunction(()=>VoidRemotePlayers.peers[0]?.clip==='idle',null,{timeout:60000,polling:100});await wait(500);
  await pb.page.evaluate(()=>{walker.yaw=2.2;});await wait(2500);   // turn on the spot: facing must follow
  // Eventual consistency: wait (bounded) until A's view of B is within tolerance, and record how long that took (a frame-rate-bound figure under software GL).
  const t0=Date.now();let bNow,aSees,err,dyaw;
  for(;;){bNow=await pb.page.evaluate(()=>({x:walker.x,z:walker.z,yaw:walker.yaw}));aSees=(await peersOf(pa))[0];
   err=Math.hypot(aSees.x-bNow.x,aSees.z-bNow.z);dyaw=Math.abs(Math.atan2(Math.sin(aSees.yaw-bNow.yaw),Math.cos(aSees.yaw-bNow.yaw)));
   if(err<.35&&dyaw<.2||Date.now()-t0>40000)break;await wait(200);}
  const settleMs=Date.now()-t0;
  assert(err<.35,'A sees B within 0.35 m of where B really is: '+err.toFixed(3));assert(dyaw<.2,'A sees B facing the right way: '+dyaw.toFixed(3));
  // Look at the other player for a screenshot, and check the avatar is a District model of human height.
  await pa.page.evaluate(()=>{const p=VoidRemotePlayers.peers[0];walker.yaw=Math.atan2(p.x-walker.x,p.z-walker.z);walker.pitch=0;});await wait(1200);await pa.page.screenshot({path:`/tmp/dd-multiplayer-${tier}.png`});
  const h=await pa.page.evaluate(()=>{const n=VoidBabylon.scene.transformNodes.find(x=>/^remote-player:/.test(x.name)),ms=n.getChildMeshes().filter(m=>m.isEnabled()&&m.isVisible&&m.name!=='remote-tag');let lo=1e9,hi=-1e9;for(const m of ms){m.computeWorldMatrix(true);m.refreshBoundingInfo?.({applySkeleton:true,applyMorph:false});const b=m.getBoundingInfo().boundingBox;lo=Math.min(lo,b.minimumWorld.y);hi=Math.max(hi,b.maximumWorld.y);}return +(hi-lo).toFixed(2);});
  assert(h>1.8&&h<2.1,'the remote smuggler is the same size as the NPC smuggler (1.96): '+h);
  // 3. A closes the tab: B's view loses the avatar (no ghost).
  // A third player (a plain test socket, so a third renderer is not needed) joins and leaves: B draws two avatars, then one. No ghost remains.
  const WebSocket=require('ws'),C=await account('district-resident'),sock=new WebSocket(`ws://127.0.0.1:${port}`);
  await new Promise(r=>sock.on('open',r));sock.send(JSON.stringify({t:'hello',token:C.token,room:'district-interior'}));await wait(600);sock.send(JSON.stringify({t:'state',x:b0.x+1,z:b0.z,yaw:0}));
  await untilPeers(pb,v=>v.length===2&&v.every(x=>x.drawn));sock.terminate();await untilPeers(pb,v=>v.length===1,30000);
  // 4. The hub goes away and comes back: both clients reconnect by themselves and the roster is rebuilt without duplicates.
  await hub.close();await pb.page.waitForFunction(()=>VoidRemotePlayers.peers.length===0&&!VoidRemotePlayers.connected,null,{timeout:30000});
  hub=await start({identify:t=>providers.identify(t),port});
  await untilPeers(pa,v=>v.length===1&&v[0].drawn,90000);await untilPeers(pb,v=>v.length===1&&v[0].drawn,90000);
  // 5. Nothing else moved: NPC count and the local campaign are unchanged; the other player added no NPC.
  const after=[await snapshot(pb)];assert.equal(after[0].npcs,before[1].npcs,'NPC count unchanged');assert.equal(after[0].story,before[1].story);assert.equal(after[0].credits,before[1].credits);assert.equal(after[0].loc,before[1].loc);
  const noSaves=await pb.page.evaluate(()=>!Object.keys(localStorage).some(k=>/multiplayer|remote/i.test(k)&&k!=='tdd-multiplayer'));assert(noSaves,'no multiplayer data is stored in the campaign');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,settleMs,err:+err.toFixed(3),dyaw:+dyaw.toFixed(3),height:h,seenByA:seenByA.model,seenByB:seenByB.model,npcs:after[0].npcs,errors}));
 }finally{await browser.close();await hub.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
