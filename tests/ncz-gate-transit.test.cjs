/* Passing a checkpoint (void-runner/ncz-gate-transit.js): the order of events on foot and in a cab, that the exchange only happens behind shut doors, that an
   inside checkpoint exchanges nothing, recovery, which quarter an entry lands in, and that nothing on screen speaks of loading. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Q=require('../void-runner/ncz-quarters.js'),T=require('../void-runner/ncz-gate-transit.js');
const src=fs.readFileSync(path.join(__dirname,'../void-runner/ncz-gate-transit.js'),'utf8'),gsrc=fs.readFileSync(path.join(__dirname,'../void-runner/ncz-gates.js'),'utf8');
// a fake game: one location record, one set of gate doors per quarter
function world({quarter='oldtown',at,failLoad=false,stuck=false}={}){
 const log=[],w={x:at[0],z:at[1],yaw:0},loc={id:'neochinatown',area:'street',quarter};let mode='walking',builds=0;
 const mk=q=>{const open=new Map(),held=new Set();let secured=false;const g={quarter:q,scanning:new Set(),doors:{secure(on){secured=on;log.push((on?'secure ':'unsecure ')+q);if(on&&!stuck)for(const k of open.keys())open.set(k,0);},closed:()=>[...open.values()].every(v=>v<=.02),openness:()=>[...open.values()].reduce((a,b)=>a+b,0),
   release(id){log.push('release '+id);open.set(id,1);return true;},hold(id,on){log.push((on?'hold ':'drop ')+id);if(on)held.add(id);else held.delete(id);return true;},get secured(){return secured;}},scan(k,on){log.push((on?'scan ':'scan-off ')+k+' '+q);on?g.scanning.add(k):g.scanning.delete(k);return true;},open};return g;};
 let gates=mk(quarter);
 const d={Q,walker:()=>w,mode:()=>mode,location:()=>loc,gates:()=>gates,streetKey:()=>'sacramento',sceneKey:s=>s,sceneId:s=>s,sceneArrival:s=>({spawn:[0,1.7,-14],yaw:0}),
  sleep:()=>Promise.resolve(),now:(()=>{let t=0;return ()=>t+=50;})(),freeze(){mode='preparing';log.push('freeze');},save(){log.push('save');},announce:m=>log.push('say '+m),warn:e=>log.push('warn '+e.message),
  overlay:{show(){log.push('overlay');assert.equal(gates?gates.doors.closed():true,true,'the picture is held only behind shut doors');},hide(){log.push('overlay-off');return Promise.resolve();}},
  async enterWalking(key,o){builds++;log.push('enter '+key+(o.quarter?':'+o.quarter:''));if(failLoad&&builds===1)return;if(key==='sacramento'){loc.id='neochinatown';loc.area='street';loc.quarter=o.quarter;gates=mk(o.quarter);}else{loc.id=key;loc.area=undefined;loc.quarter=undefined;gates=null;}w.x=o.spawn[0];w.z=o.spawn[2];w.yaw=o.yaw;mode='walking';}};
 return {d,log,w,loc,ctl:T.create(d),setMode:m=>{mode=m;},gates:()=>gates};}
const lane=k=>Q.lane(k);
// arrive in the street, then walk to the middle of a lane (someone who merely APPEARS in a lane has not walked in)
const walkIn=(W,L)=>{const [x,z]=[W.w.x,W.w.z];W.w.x=-999;W.w.z=-999;W.ctl.tick();W.w.x=x;W.w.z=z;return W.ctl.tick();};

test('on foot through Port Customs: doors shut, scan, exchange, the far door opens; the player has not moved',async()=>{
 const L=lane('customs:foot'),W=world({quarter:'oldtown',at:L.mid}),{ctl,log,w,loc}=W;W.gates().open.set(L.doors.lo.id,1);
 assert.equal(await walkIn(W,L),true);
 assert.deepEqual(ctl.history,['ENTRY_DOOR_OPEN','ENTRY_DOOR_CLOSING','SECURED','SCAN','EXCHANGE','READY','EXIT_DOOR_OPEN','COMPLETE']);
 assert.equal(loc.quarter,'port');assert.deepEqual([w.x,w.z],L.mid);
 const order=['secure oldtown','scan customs:foot oldtown','freeze','overlay','enter sacramento:port','secure port','scan customs:foot port','overlay-off','scan-off customs:foot port','unsecure port','release '+L.doors.hi.id,'save'];
 let i=-1;for(const step of order){const k=log.indexOf(step,i+1);assert.ok(k>i,step+' out of order in '+log.join(' | '));i=k;}
 assert.ok(!log.includes('release '+L.doors.lo.id),'the door behind stays shut');assert.ok(typeof ctl.lastSwapMs==='number');
 // standing there afterwards does not send the player back; stepping out and in again does
 assert.equal(await ctl.tick(),false);assert.equal(ctl.armed,false);w.z=-100;ctl.tick();assert.equal(ctl.armed,true);
});
test('the checkpoint starts only from the middle of a foot lane, never in a vehicle bay, and is called off if the player steps out',async()=>{
 const L=lane('north:foot-w');let W=world({quarter:'oldtown',at:[L.doors.lo.x,L.doors.lo.z+.9]});assert.equal(await walkIn(W,L),false);assert.equal(W.ctl.state,'ENTRY_DOOR_OPEN');
 W=world({quarter:'oldtown',at:lane('north:bay-n').mid});assert.equal(await walkIn(W,L),false);assert.equal(W.ctl.state,'IDLE');
 W=world({quarter:'port',at:[31,-96]});assert.equal(await W.ctl.tick(),false);
 // a player who appears in the lane (a place just loaded) has not walked in
 W=world({quarter:'avenue',at:L.mid});assert.equal(await W.ctl.tick(),false,'appearing in a lane does not start it');assert.equal(W.ctl.armed,false);assert.equal(await walkIn(W,L),true,'walking out and in again does');assert.equal(W.loc.quarter,'oldtown');
});
test('walking through the Function Gate arrives in the Corporate District, and coming back puts the player in the gate with the city door opening',async()=>{
 const L=lane('function:foot'),W=world({quarter:'avenue',at:L.mid});assert.equal(await walkIn(W,L),true);assert.equal(W.loc.id,'corporate');assert.deepEqual([W.w.x,W.w.z],[0,-14]);assert.ok(W.log.includes('enter corporate'));
 assert.equal(await W.ctl.arrive({gate:'function',by:'foot'}),true);assert.equal(W.loc.quarter,'avenue');assert.deepEqual([W.w.x,W.w.z],L.mid);assert.ok(W.log.includes('release '+L.doors.hi.id));assert.equal(W.w.yaw,Math.PI/2,'facing into the avenue');
 assert.equal(await W.ctl.tick(),false,'and is not sent straight back');
 // the East Gate is walked the same way, to the Temple and back (walkers' lane added 16 Nov 2026)
 {const E=lane('east:foot'),W2=world({quarter:'avenue',at:E.mid});assert.equal(await walkIn(W2,E),true);assert.equal(W2.loc.id,'temple');assert.ok(W2.log.includes('enter temple'));
  assert.equal(await W2.ctl.arrive({gate:'east',by:'foot'}),true);assert.equal(W2.loc.quarter,'avenue');assert.deepEqual([W2.w.x,W2.w.z],E.mid);assert.ok(W2.log.includes('release '+E.doors.lo.id),'the avenue-side door opens');assert.equal(W2.w.yaw,-Math.PI/2,'facing into the avenue');assert.equal(await W2.ctl.tick(),false);}
});
test('a cab in a bay: the shutter behind drops, scan, exchange, the passenger is put back by the caller, the shutter ahead is held open',async()=>{
 const L=lane('north:bay-n'),W=world({quarter:'oldtown',at:L.mid});W.setMode('road-taxi');let put=0;
 assert.equal(await W.ctl.ride({lane:L.key,from:'oldtown',to:{quarter:'avenue'},spawn:[L.mid[0],1.08,L.mid[1]],yaw:0,after:async g=>{put++;assert.equal(g.quarter,'avenue');assert.equal(g.doors.secured,true,'still sealed while the cab is put back');}}),true);
 assert.equal(put,1);assert.equal(W.loc.quarter,'avenue');assert.ok(W.log.includes('drop '+L.doors.lo.id));assert.ok(W.log.includes('hold '+L.doors.hi.id));
 // to a far place: no gate on the other side to open
 const F=lane('function:bay'),V=world({quarter:'avenue',at:F.mid});V.setMode('road-taxi');assert.equal(await V.ctl.ride({lane:F.key,from:'avenue',to:{scene:'corporate'},spawn:[0,1.7,-14],yaw:0}),true);assert.equal(V.loc.id,'corporate');assert.ok(!V.log.some(l=>l.startsWith('hold ')));
 // and back by cab
 assert.equal(await V.ctl.arrive({gate:'function',by:'cab',spawn:[F.mid[0],1.08,F.mid[1]],yaw:Math.PI/2,after:async()=>{}}),true);assert.equal(V.loc.quarter,'avenue');assert.ok(V.log.includes('hold '+F.doors.hi.id));
});
test('if the next quarter does not appear the player is put back and the door behind opens; doors that will not shut call it off',async()=>{
 const L=lane('customs:foot');let W=world({quarter:'port',at:L.mid,failLoad:true});assert.equal(await walkIn(W,L),false);assert.equal(W.ctl.state,'RECOVERY');assert.equal(W.loc.quarter,'port');assert.ok(W.log.includes('release '+L.doors.hi.id),'the port-side door');assert.ok(W.log.some(l=>/could not let you through/.test(l)));
 W=world({quarter:'port',at:L.mid,stuck:true});W.gates().open.set(L.doors.hi.id,1);assert.equal(await walkIn(W,L),false);assert.equal(W.ctl.state,'RECOVERY');assert.ok(!W.log.includes('overlay'));assert.ok(W.log.includes('release '+L.doors.hi.id));
});
test('a checkpoint inside a quarter scans and opens its far door; nothing is exchanged',async()=>{
 const before=Q.GATES.length;Q.define({id:'test-in',code:'T2',name:'Inside Check',sign:'CHECKPOINT',guard:'private',rect:[100,104,-61.6,-55.5],axis:'x',ends:{lo:{quarter:'oldtown'},hi:{quarter:'oldtown'}},lanes:[{id:'foot',kind:'foot',v:[-60.2,-57.2]}]});
 try{const L=lane('test-in:foot'),W=world({quarter:'oldtown',at:[110,-58.7]});W.ctl.tick();W.w.x=L.doors.hi.x-.3;W.w.z=L.mid[1];W.ctl.tick();W.w.x=L.mid[0];const r=await W.ctl.tick();assert.equal(r,true,W.log.join(' | ')+' '+W.ctl.history.join('>'));
  assert.ok(!W.log.some(l=>l.startsWith('enter ')||l==='overlay'),'no exchange and no held picture');assert.ok(W.log.includes('release '+L.doors.lo.id),'came in by the east door, so the west door opens');assert.deepEqual(W.ctl.history.slice(-3),['SCAN','EXIT_DOOR_OPEN','COMPLETE']);
 }finally{Q.GATES.splice(before);for(let i=Q.LANES.length-1;i>=0;i--)if(Q.LANES[i].gate==='test-in')Q.LANES.splice(i,1);const gs=Q.QUARTERS.oldtown.gates;gs.splice(gs.indexOf('test-in'),1);}
});
test('an entry to the street lands in the quarter asked for, else where its spawn stands, else where the save was, else the Port',()=>{
 const s={story:{flags:{}}};assert.equal(T.resolve(Q,{},s),'port');assert.equal(T.resolve(Q,undefined,s),'port');assert.equal(T.resolve(Q,{spawn:[126.9,1.7,-59.3]},s),'oldtown','leaving the District');assert.equal(T.resolve(Q,{spawn:[81.75,1.7,-173]},s),'far-south','leaving Milked (its front door is in Far South now)');assert.equal(T.resolve(Q,{spawn:[81.75,1.7,-73]},s),'far-south','a position from before Milked moved goes with it');
 // settle(): where a player placed at a position from before the move, or on a street that is gone, really appears
 {const St=Q.settle;assert.deepEqual(St([81.75,1.7,-71],'oldtown'),{quarter:'far-south',spawn:[81.75,1.7,-171],moved:true},'the old side street: 100 m south with the building');
  const inside=St([84,1.7,-78],'oldtown');assert.equal(inside.quarter,'far-south');assert.deepEqual(inside.spawn,[81.75,1.7,-172.6],'a player who was INSIDE Milked is put outside its front door, on the side street');
  assert.deepEqual(St([61,1.7,-60],'oldtown'),{quarter:'oldtown',spawn:[61,1.7,-60],moved:false},'a point in a street is left alone');
  const gone=St([95,1.7,-93.5],'oldtown');assert.equal(St([90,1.7,-91],'oldtown').quarter,'oldtown','(20 Nov 2026) the old service alley\'s place by the terrace is Old Town\'s new back alley');assert.equal(gone.quarter,'far-south','the old service alley follows Milked too');
  const off=St([-90,1.7,-12.5],'oldtown');assert.equal(off.quarter,'oldtown');assert.equal(Q.quarterAt(off.spawn[0],off.spawn[2]),'oldtown','a point on a retired street goes to the nearest street of the saved quarter');
  const lost=St([200,1.7,-100],'oldtown');assert.equal(Q.quarterAt(lost.spawn[0],lost.spawn[2]),'oldtown','a point in solid block is brought to the nearest open ground');
  assert.equal(St(null,'oldtown'),null);}
 assert.equal(T.resolve(Q,{spawn:[40,1.7,-12.5]},s),'avenue');assert.equal(T.resolve(Q,{quarter:'avenue',spawn:[31,1.7,-96]},s),'avenue');s.story.flags.quarter='oldtown';assert.equal(T.resolve(Q,{},s),'oldtown');assert.equal(T.resolve(Q,{spawn:[-90,1.7,-12.5]},s),'oldtown','a point on a retired street falls back to the saved quarter');
});
test('nothing on screen speaks of loading: no words, no bar; the scan is a picture only',()=>{
 const css=src.slice(src.indexOf('css.textContent'),src.indexOf('document.head.append(css)')),html=src.slice(src.indexOf('insertAdjacentHTML'),src.indexOf('hide(){'));
 assert.doesNotMatch(css+html,/load|prepar|progress|percent|wait|bar\b/i);assert.match(html,/Security scan/);assert.equal((html.match(/>[^<]+</g)||[]).length,1,'one line of text, for screen readers only');assert.match(css,/gt-sr\{[^}]*clip-path/);
 for(const f of [src,gsrc])assert.doesNotMatch(f.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm,''),/contraband|bribe|confiscat/i,'no contraband rule is built');
 // signs: plain functional words only
 const words=[...gsrc.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm,'').matchAll(/'([A-Z][A-Z ]{2,})'/g)].map(m=>m[1]);assert.deepEqual([...new Set(words)].sort(),['CHECKPOINT','CLOSED','PEDESTRIANS','SCAN','TAXI','VEHICLES']);
 assert.deepEqual(Q.GATES.map(g=>g.sign),['CUSTOMS','NORTH GATE','FUNCTION GATE','EAST GATE','SOUTH GATE','FAR SOUTH GATE']);
 // the Function Gate's guards are the existing silent robots, and no guard has a line
 assert.match(gsrc,/VoidCorporateActors/);assert.doesNotMatch(gsrc,/announce\(|speak\(|say\(/);
});
