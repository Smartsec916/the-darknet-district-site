/* The two checkpoints of Milked (the front security vestibule and the rear lobby): the zones and doors, which environment may open which door, the
   orchestration (what loads, in what order, how failure recovers) with fakes for the renderer, and that nothing is saved. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const MK=require('../void-runner/milked.js'),T=require('../void-runner/milked-transition.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),A=require('../void-runner/district-area.js'),C=require('../void-runner/campaign.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8'),mid=r=>({x:(r[0]+r[1])/2,z:(r[2]+r[3])/2});

test('two checkpoints: the front vestibule on the side street and the rear lobby on the service alley',()=>{
 assert.deepEqual(Object.keys(MK.GATES),['front','rear']);const {front,rear}=MK.GATES;
 assert.equal(front.outer,'milked-door');assert.deepEqual(front.inner,['milked-inner-door']);assert.equal(rear.outer,'milked-rear-door');assert.deepEqual(rear.inner,['milked-lobby-north','milked-lobby-west']);
 for(const g of [front,rear]){const c=mid(g.centre);assert.equal(MK.gateAt(c),g);assert.ok(MK.atCentre(g,c));for(const id of [g.outer,...g.inner])assert.ok(MK.DOORS.some(d=>d.id===id&&d.gate===g.id),id);
  // the middle is clear of every doorway (so no door is held open by the player) and it is open floor in both environments
  for(const d of MK.DOORS.filter(d=>d.gate===g.id))for(const [x,z] of [[g.centre[0],g.centre[2]],[g.centre[1],g.centre[2]],[g.centre[0],g.centre[3]],[g.centre[1],g.centre[3]]]){const across=d.axis==='x'?Math.abs(z-d.z):Math.abs(x-d.x);assert.ok(across>=.72,g.id+' centre is clear of '+d.id+' ('+across.toFixed(2)+' m)');}
  for(const L of [N.layout('street'),MK.layout()])for(const [x,z] of [[c.x,c.z],[g.centre[0],g.centre[2]],[g.centre[1],g.centre[3]]])assert.equal(E.blocked(x,z,L),false,g.id+' centre is open floor');}
 assert.equal(MK.gateAt({x:84,z:-79}),null,'reception is not a checkpoint');assert.equal(MK.gateAt({x:81.75,z:-72}),null,'nor is the side street');assert.equal(MK.gateAt(null),null);
 assert.equal(MK.atCentre(front,{x:81.75,z:-74.3}),false,'the doorway is not the middle');
});
test('the street opens only the two outer doors and the interior only the three inner ones, so an outer and an inner door are never open together',()=>{
 const st=MK.DOORS.filter(d=>MK.openable(d,'street')).map(d=>d.id),inn=MK.DOORS.filter(d=>MK.openable(d,MK.AREA)).map(d=>d.id);
 assert.deepEqual(st,['milked-door','milked-rear-door']);assert.deepEqual(inn,['milked-inner-door','milked-lobby-north','milked-lobby-west']);assert.equal(st.length+inn.length,MK.DOORS.length);
 // every door has a collision box in both environments, shut until the door control opens it
 for(const L of [N.layout('street'),MK.layout()])for(const d of MK.DOORS){const s=L.solids.find(q=>q.id===d.id);assert.ok(s&&s.door&&!s.open,d.id);assert.equal(E.blocked(d.x,d.z,L),true,d.id+' is solid when shut');}
});
test('the interior is a place of its own that keeps NeoChinatown\'s id and coordinates, and is never a save location',()=>{
 const L=MK.layout();assert.equal(L.id,'neochinatown','the map, the camera label, the music zone and multiplayer presence keep working');assert.equal(L.area,'milked');assert.equal(L.milked,true);assert.equal(L.district,undefined,'it is not built by the city builder');
 assert.equal(MK.KEY,'milked');assert.ok(MK.inside({x:L.spawn[0],z:L.spawn[2]}));assert.equal(E.blocked(L.spawn[0],L.spawn[2],L),false);
 assert.ok(L.interactions.length>=11);assert.deepEqual(N.layout('street').interactions.filter(i=>/^milked-/.test(i.id)).map(i=>i.id),['milked-intercom'],'the street keeps only the check-in reader');
 // nothing is written to the save: no flag, no location id, and the area rules still say "street" for any save
 for(const f of ['void-runner/milked.js','void-runner/milked-build.js','void-runner/milked-transition.js','void-runner/milked-integration.js']){const code=read(f).replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');assert.ok(!/story\.flags|(^|[^.\w])save\(|localStorage/.test(code),f+' touches no save');}
 assert.ok(!JSON.stringify(JSON.parse(read('void-runner/save-manifest.json'))).includes('milked'));
 const s=C.fresh();s.location='earth';assert.equal(A.keyFor(s),A.KEY.street,'a game saved inside Milked resumes on the street side (and every login wakes in the Sleeping Pod)');
 assert.match(read('void-runner/milked-integration.js'),/VoidExplorationData\.locations\[MK\.KEY\]=MK\.layout\(\)/);
 assert.match(read('void-runner/babylon-renderer.js'),/def\.milked&&root\.VoidMilked\?\.build/);
 // taxis do not come indoors
 const R=require('../void-runner/road-taxi-rules.js');assert.equal(R.availability(s,{onFoot:true,area:'milked'}).ok,false);assert.match(R.availability(s,{onFoot:true,area:'milked'}).reason,/Step outside/);assert.equal(R.availability(s,{onFoot:true,area:'street'}).ok,true);
 assert.match(read('void-runner/road-taxi.js'),/area!=='milked'/);
});

// ---- the orchestration, with fakes ----
function rig(over={}){
 const log=[],loc={street:{area:'street'},milked:{area:'milked'}};let where='street',mode='walking',t=0;
 const g=MK.GATES[over.gate||'front'],walker={...mid(g.centre),yaw:1.2};
 const mk=()=>{let secured=false,open=over.startOpen??.6,stuck=!!over.stuck;const d={secure(on){secured=!!on;log.push('secure:'+on);},closed(){if(secured&&!stuck)open=Math.max(0,open-.3);return open<=.02;},openness:()=>open,release(id){secured=false;log.push('release:'+id);},state:()=>[{id:'x',open}],get secured(){return secured;}};return d;};
 let doors=mk();
 const deps={M:MK,walker:()=>walker,mode:()=>mode,location:()=>loc[where],graphicsBusy:()=>false,streetKey:()=>'sacramento',doors:()=>over.noDoors?null:doors,
  enterWalking:async(key,opts)=>{log.push('load:'+key);if(over.failLoad&&!deps._failed){deps._failed=true;mode='dock';return;}where=key==='milked'?'milked':'street';mode='walking';Object.assign(walker,{x:opts.spawn[0],z:opts.spawn[2],yaw:opts.yaw});doors=mk();},
  freeze:()=>{mode='preparing';log.push('freeze');},announce:m=>log.push('say:'+m),warn:()=>{},wait:async()=>{},sleep:async()=>{t+=80;},now:()=>t,
  overlay:{show:(dir,text,gate)=>log.push('card:'+dir+':'+gate+':'+text.kicker),step:i=>log.push('step:'+i),hide:async()=>log.push('card-off')},...over.deps};
 const ctl=T.create(deps);return {ctl,log,walker,set where(v){where=v;},get where(){return where;},get mode(){return mode;},set mode(v){mode=v;},tick:n=>{t+=n;},get doors(){return doors;}};
}
test('walking in: the doors seal first, the card covers the view, the interior loads, and only then do the inner doors open',async()=>{
 const r=rig();assert.equal(await r.ctl.go('in'),true);assert.equal(r.where,'milked');
 const i=k=>r.log.findIndex(x=>x.startsWith(k));
 assert.ok(i('secure:true')<i('freeze')&&i('freeze')<i('card:in:front')&&i('card:in:front')<i('load:milked')&&i('load:milked')<i('card-off')&&i('card-off')<i('release:milked-inner-door'),r.log.join(' | '));
 assert.ok(!r.log.includes('release:milked-door'),'the street doors are never released on the way in');
 assert.deepEqual(r.ctl.history,['ENTRY_DOOR_CLOSING','SECURED','CHECK_IN','DESTINATION_LOADING','DESTINATION_READY','EXIT_DOOR_OPEN','COMPLETE']);
 assert.ok(r.ctl.sealed.every(d=>d.open<=.02),'the sensors said shut when the room was sealed');assert.match(r.log.find(x=>x.startsWith('card:')),/MILKED/);
 assert.deepEqual([r.walker.x,r.walker.z,r.walker.yaw],[mid(MK.GATES.front.centre).x,mid(MK.GATES.front.centre).z,1.2],'the player keeps their place and facing');
});
test('walking out by the rear lobby: both inner doors seal, the street loads, the alley door opens',async()=>{
 const r=rig({gate:'rear'});r.where='milked';assert.equal(await r.ctl.go('out'),true);assert.equal(r.where,'street');
 assert.ok(r.log.includes('load:sacramento'));assert.ok(r.log.includes('release:milked-rear-door'));assert.ok(!r.log.some(x=>/release:milked-lobby/.test(x)));assert.match(r.log.find(x=>x.startsWith('card:')),/card:out:rear/);
 const r2=rig({gate:'rear'});assert.equal(await r2.ctl.go('in'),true);assert.ok(r2.log.includes('release:milked-lobby-north')&&r2.log.includes('release:milked-lobby-west'),'coming in from the alley, both inner doors open');
});
test('it starts by itself in the middle of the room, once, and re-arms only after the player has left the room',async()=>{
 const r=rig();assert.equal(await r.ctl.tick(),false,'appearing in the room does not start it');assert.equal(r.ctl.armed,false);
 Object.assign(r.walker,{x:81.75,z:-72});r.ctl.tick();assert.equal(r.ctl.armed,true);
 Object.assign(r.walker,{x:81.75,z:-74.4});assert.equal(await r.ctl.tick(),false,'the doorway is not the middle');assert.equal(r.ctl.state,'ENTRY_DOOR_OPEN');
 Object.assign(r.walker,mid(MK.GATES.front.centre));assert.equal(await r.ctl.tick(),true);assert.equal(r.where,'milked');
 r.tick(5000);assert.equal(await r.ctl.tick(),false,'no immediate return trip');
 Object.assign(r.walker,{x:84,z:-79});r.ctl.tick();Object.assign(r.walker,mid(MK.GATES.front.centre));r.tick(5000);assert.equal(await r.ctl.tick(),true,'after stepping out and back it works the other way');assert.equal(r.where,'street');
});
test('the wrong place or direction, a busy game, and a player outside the middle are all refused',async()=>{
 const r=rig();assert.equal(await r.ctl.go('out'),false,'cannot leave from the street');
 Object.assign(r.walker,{x:84,z:-79});assert.equal(await r.ctl.go('in'),false,'not in a checkpoint');
 Object.assign(r.walker,{x:81.75,z:-74.4});assert.equal(await r.ctl.go('in'),false);assert.ok(r.log.some(x=>/middle of the security vestibule/.test(x)));
 const b=rig({deps:{graphicsBusy:()=>true}});assert.equal(await b.ctl.go('in'),false);const m=rig();m.mode='dialogue';assert.equal(await m.ctl.go('in'),false);
});
test('stepping back out while the doors close calls it off; doors that will not close release the player',async()=>{
 const r=rig({stuck:true,deps:{sleep:async function(){r.walker.z=-72;}}});assert.equal(await r.ctl.go('in'),false);assert.equal(r.ctl.state,'IDLE');assert.ok(r.log.includes('secure:false'));assert.ok(!r.log.some(x=>x.startsWith('load:')));
 const s=rig({stuck:true});assert.equal(await s.ctl.go('in'),false);assert.equal(s.ctl.state,'RECOVERY');assert.ok(s.log.includes('release:milked-door'),'the door behind is released');assert.ok(!s.log.some(x=>x.startsWith('load:')||x.startsWith('card:')),'nothing loaded and no card shown');
});
test('a load that fails puts the player back on the side they came from with the door behind them open',async()=>{
 const r=rig({failLoad:true});assert.equal(await r.ctl.go('in'),false);assert.equal(r.ctl.state,'RECOVERY');assert.equal(r.where,'street');
 assert.deepEqual(r.log.filter(x=>x.startsWith('load:')),['load:milked','load:sacramento']);assert.ok(r.log.includes('release:milked-door'));assert.ok(r.log.includes('card-off'));assert.ok(r.log.some(x=>/door behind you is open/.test(x)));
});
test('the loading card is Milked\'s own, not the District\'s',()=>{
 const src=read('void-runner/milked-transition.js');assert.match(src,/#milked-transition/);assert.ok(!/district-transition|dt-beam|SECURITY SCAN|DARKNET/.test(src.replace(/\/\*[\s\S]*?\*\//g,'')),'it shares nothing with the District\'s scan');
 assert.match(src,/#ff3fb4/);assert.match(src,/#39ff9c/);assert.match(src,/mt-drops/);for(const g of ['front','rear'])for(const d of ['in','out']){const t=T.TEXT[g][d];assert.match(t.kicker,/^MILKED/);assert.equal(t.steps.length,4);}
 const html=read('void-runner.html');assert.ok(html.indexOf('void-runner/milked.js')<html.indexOf('void-runner/milked-build.js')&&html.indexOf('void-runner/milked-build.js')<html.indexOf('void-runner/neochinatown.js'),'the build is loaded before the city');
 assert.ok(html.indexOf('void-runner/district-area.js')<html.indexOf('void-runner/milked-transition.js'));
});
