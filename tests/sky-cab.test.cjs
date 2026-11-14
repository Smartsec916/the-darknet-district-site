// The reusable sky-cab transition (sky-cab.js): order of loading, minimum ride, the destination replacing the cab only when ready, failure recovery, fares, return leg.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('../void-runner/sky-cab.js');
function harness(over={}){
  const log=[],h={log,credits:100,loc:'neochinatown',flags:{},saves:0,notes:[],sleeps:[],fail:{}};
  const state={story:{flags:h.flags}};Object.defineProperty(state,'credits',{get:()=>h.credits,set:v=>{h.credits=v;}});
  const d={state:()=>state,location:()=>h.loc?{id:h.loc}:null,walker:()=>({x:-90,z:-12.5,yaw:1.2}),save:()=>{h.saves++;},announce:t=>h.notes.push(t),refund:n=>{h.credits+=n;log.push('refund:'+n);},
   homeKey:()=>'sacramento',locationIdOf:k=>k==='sacramento'?'neochinatown':k,originKey:id=>id==='neochinatown'?'sacramento':id,homeSpawn:()=>({spawn:[-90,1.7,-12.5],yaw:Math.PI/2}),
   sleep:async ms=>{h.sleeps.push(ms);log.push('sleep');},rideMs:dest=>K.rideMs(dest),
   prefetch:async dest=>{log.push('prefetch:'+dest.id);if(h.fail.prefetch)throw new Error('not available');},
   enterWalking:async(key,opts)=>{log.push('enter:'+key);h.onEnter?.(key);if(h.fail[key]){throw new Error('load failed');}h.loc=key==='sacramento'?'neochinatown':key;h.last=opts;},...over};
  h.ctl=K.create(d);return h;
}
test('a trip loads the cab first, rides, readies the destination, then replaces the cab with it',async()=>{
  const h=harness(),from={spawn:[-90,1.7,-12.5],yaw:1.2};h.credits=40;   // the 60 CR fare was already charged by the street cab
  const ok=await h.ctl.travel('corporate',{from,paid:60});assert.equal(ok,true);
  assert.deepEqual(h.log.filter(x=>/^(enter|prefetch)/.test(x)),['enter:skycab','prefetch:corporate','enter:corporate'],'the cab is entered before the destination, which comes last');
  assert.equal(h.loc,'corporate');assert.deepEqual(h.ctl.history,['BOARDED','RIDING','LOADING','ARRIVED']);assert.equal(h.credits,40,'no refund on success');
  assert.equal(h.flags.skyCabTrip,undefined,'the trip record is cleared on arrival');assert.ok(h.flags.cabReturn,'the return spot is kept');assert.ok(h.notes.some(n=>/Arrived: Corporate District/.test(n)));
});
test('the ride lasts a fair minimum, and the destination waits for BOTH the ride and its readiness',async()=>{
  const order=[];let releasePrefetch;const gate=new Promise(r=>{releasePrefetch=r;});
  const h=harness({prefetch:async()=>{order.push('prefetch-start');await gate;order.push('prefetch-done');},sleep:async ms=>{order.push('ride:'+ms);}});h.onEnter=key=>order.push('enter:'+key);
  const p=h.ctl.travel('corporate',{from:{spawn:[0,1.7,0],yaw:0},paid:60});await new Promise(r=>setTimeout(r,20));
  assert.ok(!order.includes('enter:corporate'),'not loaded while the destination is not ready');releasePrefetch();await p;
  const ride=Number(order.find(x=>/^ride:/.test(x)).slice(5));assert.ok(ride>=K.RIDE_MIN_MS&&ride<=K.RIDE_MAX_MS,'ride '+ride);assert.ok(order.indexOf('enter:corporate')>order.indexOf('prefetch-done'));
  assert.ok(K.rideMs(K.DESTINATIONS.corporate,true)<K.rideMs(K.DESTINATIONS.corporate),'reduced motion shortens the ride');
});
test('a destination that fails to load recovers: the fare is returned once and the player goes back where they left',async()=>{
  const h=harness();h.credits=40;h.fail.corporate=true;const from={spawn:[-90,1.7,-12.5],yaw:1.2};
  const ok=await h.ctl.travel('corporate',{from,paid:60});assert.equal(ok,false);assert.equal(h.credits,100,'refunded exactly once');assert.equal(h.log.filter(x=>x==='refund:60').length,1);
  assert.equal(h.loc,'neochinatown','back in the city');assert.deepEqual(h.last.spawn,from.spawn);assert.equal(h.last.yaw,1.2);assert.equal(h.flags.skyCabTrip,undefined);assert.ok(h.notes.some(n=>/could not land.*60 CR was returned/.test(n)));assert.equal(h.ctl.history.at(-1),'RECOVERED');
});
test('a destination that is not available is caught while riding, with the fare returned',async()=>{
  const h=harness();h.credits=40;h.fail.prefetch=true;const ok=await h.ctl.travel('corporate',{from:{spawn:[1,1.7,2],yaw:0},paid:60});assert.equal(ok,false);assert.equal(h.credits,100);assert.equal(h.loc,'neochinatown');assert.ok(!h.log.includes('enter:corporate'),'the destination was never entered');
});
test('a cab room that fails to load recovers too',async()=>{
  const h=harness();h.credits=40;h.fail.skycab=true;const ok=await h.ctl.travel('corporate',{from:{spawn:[1,1.7,2],yaw:0},paid:60});assert.equal(ok,false);assert.equal(h.credits,100);assert.equal(h.loc,'neochinatown');
});
test('if recovery itself fails the trip record stays, so the next load refunds it once',async()=>{
  const h=harness();h.credits=40;let n=0;const h2=harness({enterWalking:async key=>{n++;if(n>=1&&key!=='skycab'&&key!=='sacramento'){throw new Error('x');}if(key==='sacramento')throw new Error('cannot go back');h2.loc=key;}});h2.credits=40;
  const ok=await h2.ctl.travel('corporate',{from:{spawn:[1,1.7,2],yaw:0},paid:60});assert.equal(ok,false);assert.equal(h2.ctl.history.at(-1),'FAILED');assert.ok(K.parseTrip(h2.flags.skyCabTrip));
  const back=h2.ctl.recoverSaved();assert.equal(back,0,'the zero-fare record refunds nothing again');assert.equal(h2.flags.skyCabTrip,undefined);void h;
});
test('after a reload an interrupted trip refunds its fare once, never twice',()=>{
  const h=harness();h.credits=40;h.flags.skyCabTrip='corporate:60';h.flags.cabReturn='-90.00,-12.50,1.200';assert.equal(h.ctl.recoverSaved(),60);assert.equal(h.credits,100);assert.equal(h.flags.skyCabTrip,undefined);assert.equal(h.flags.cabReturn,undefined);assert.equal(h.ctl.recoverSaved(),0);assert.equal(h.credits,100);
  assert.deepEqual(K.parseTrip('corporate:60'),{dest:'corporate',paid:60});assert.equal(K.parseTrip('corporate'),null);assert.equal(K.parseTrip('x:99999'),null);assert.equal(K.parseTrip(undefined),null);
});
test('the fare can never exceed the 60 CR maximum, and a trip cannot start twice at once',async()=>{
  const h=harness();assert.equal(await h.ctl.travel('corporate',{from:{spawn:[0,1.7,0],yaw:0},paid:61}),false);assert.equal(h.log.length,0,'nothing was loaded');assert.equal(await h.ctl.travel('nowhere',{from:{spawn:[0,1.7,0],yaw:0},paid:0}),false);
  const slow=harness({sleep:()=>new Promise(r=>setTimeout(r,40))});const a=slow.ctl.travel('corporate',{from:{spawn:[0,1.7,0],yaw:0},paid:60});assert.equal(await slow.ctl.travel('corporate',{from:{spawn:[0,1.7,0],yaw:0},paid:60}),false,'busy');assert.equal(await a,true);
  assert.equal(K.DESTINATIONS.corporate.fare,60);assert.equal(K.DESTINATIONS.neochinatown.fare,0,'the return is included');
});
test('the return leg is free, goes back to where the player left, and a failed return leaves them in Corporate',async()=>{
  const h=harness(),from={spawn:[-90,1.7,-12.5],yaw:1.2};await h.ctl.travel('corporate',{from,paid:60});assert.equal(h.loc,'corporate');h.credits=0;
  const ok=await h.ctl.travel('neochinatown',{from:{spawn:[0,1.7,-17.4],yaw:0},paid:0});assert.equal(ok,true);assert.equal(h.loc,'neochinatown');assert.equal(h.credits,0,'no second fare, and nothing was needed');assert.deepEqual(h.last.spawn,from.spawn,'the exact place they left');assert.equal(h.flags.cabReturn,undefined);
  const g=harness();await g.ctl.travel('corporate',{from,paid:60});g.fail.sacramento=true;const bad=await g.ctl.travel('neochinatown',{from:{spawn:[0,1.7,-17.4],yaw:0},paid:0});assert.equal(bad,false);assert.equal(g.loc,'corporate','safely back in Corporate: nobody is stranded in the cab');
});
test('the return spot survives a reload (kept as text in the save)',()=>{
  assert.deepEqual(K.parseReturn('-90.00,-12.50,1.200'),{spawn:[-90,1.7,-12.5],yaw:1.2});assert.equal(K.parseReturn('x'),null);
  const h=harness();h.flags.cabReturn='-90.00,-12.50,1.200';return h.ctl.travel('neochinatown',{from:{spawn:[0,1.7,-17.4],yaw:0},paid:0}).then(ok=>{assert.equal(ok,true);assert.deepEqual(h.last.spawn,[-90,1.7,-12.5]);});
});
test('the same transition serves the Temple: out and back, with the same fare rules and recovery',async()=>{
  const h=harness(),from={spawn:[45,1.7,-12.5],yaw:1.57};h.credits=40;assert.equal(await h.ctl.travel('temple',{from,paid:60}),true);assert.equal(h.loc,'temple');assert.deepEqual(h.log.filter(x=>/^(enter|prefetch)/.test(x)),['enter:skycab','prefetch:temple','enter:temple']);assert.deepEqual(h.last.spawn,K.DESTINATIONS.temple.spawn);
  assert.equal(await h.ctl.travel('neochinatown',{from:{spawn:[0,1.7,-39],yaw:0},paid:0}),true);assert.equal(h.loc,'neochinatown');assert.deepEqual(h.last.spawn,from.spawn);assert.equal(h.credits,40,'no second fare');
  const f=harness();f.credits=40;f.fail.temple=true;assert.equal(await f.ctl.travel('temple',{from,paid:60}),false);assert.equal(f.credits,100,'refunded');assert.equal(f.loc,'neochinatown');
  const longer=K.rideMs(K.DESTINATIONS.temple)>=K.rideMs(K.DESTINATIONS.corporate);assert.ok(longer,'farther away, not a shorter ride');assert.ok(K.rideMs(K.DESTINATIONS.temple)<=K.RIDE_MAX_MS);
});
test('the 3D cab is a real room: seats, dashboard, fare readout, rain on the windows, neon outside; it is built from geometry, not an image',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../void-runner/sky-cab.js'),'utf8');assert.equal(K.CAB_LOCATION.skycab,true);assert.equal(K.CAB_LOCATION.id,'skycab');assert.equal(typeof K.build,'function');
  for(const part of ['seatM','dash','rainTex','streaks','towers','fare','FARE','progress'])assert.ok(src.includes(part),part);assert.match(src,/CreateBox/);assert.match(src,/CreatePlane/);assert.ok(!/<img|\.png|\.jpg|backgroundImage/.test(src),'no flat loading image');
  assert.deepEqual(K.CAB_LOCATION.solids,[]);assert.ok(K.CAB_LOCATION.bounds[0]<1,'the player stays seated');
});
test('the street cab hands scene destinations to the transition and keeps its own flow for the rest',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../void-runner/city-taxi.js'),'utf8');assert.match(src,/trip\.dest\.scene&&globalThis\.VoidSkyCab\?\.ride/);assert.match(src,/case 'handoff'/);assert.match(src,/trip\.phase='climb'/);
});
