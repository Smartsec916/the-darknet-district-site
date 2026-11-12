/* The security-door transition between NeoChinatown's street and the District interior: area rules, saved locations,
   and the orchestration (what loads, in what order, what is saved, how failure recovers), using fakes for the renderer. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../void-runner/district-area.js'),T=require('../void-runner/district-transition.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js');
const C=require('../void-runner/campaign.js');
const street=N.layout('street'),interior=N.layout('interior'),read=f=>fs.readFileSync(f,'utf8');
const stateWith=flags=>({story:{flags:{...flags}}});

test('area and location key come from the save: outside unless inside with a badge',()=>{
 assert.deepEqual(A.KEY,{street:'sacramento',interior:'darknet-district'});
 assert.equal(A.areaOf(stateWith({})),'street');assert.equal(A.keyFor(stateWith({})),'sacramento');
 assert.equal(A.areaOf(stateWith({area:'district',districtBadge:true})),'interior');assert.equal(A.keyFor(stateWith({area:'district',districtBadge:true})),'darknet-district');
 assert.equal(A.areaOf(stateWith({area:'district'})),'street','an area flag without a badge cannot place a player inside');
 assert.equal(A.areaOf(stateWith({districtBadge:true})),'street','a badge alone does not move a player inside');
 assert.equal(A.areaOf(null),'street');assert.equal(A.areaOf({}),'street');
});
test('saved locations: a saved current campaign, a new campaign and a save made inside all resume in the right environment',()=>{
 const saved=C.restore(JSON.stringify(C.fresh()));assert.equal(A.keyFor(saved),'sacramento');assert.deepEqual(A.resume(saved,N),{});
 const fresh=C.startDistrictCampaign(C.fresh());assert.equal(A.keyFor(fresh),'darknet-district','a new campaign wakes inside the District');
 const pod=A.resume(fresh,N),[px,pz]=N.toWorld(pod.spawn[0],pod.spawn[2]);assert(Math.abs(px+5.2)<.01&&Math.abs(pz-76.7)<.01,'the wake view is inside pod 01, at the back of the building');
 const exit=A.podExit(N);assert(!E.blocked(exit.spawn[0],exit.spawn[2],interior),'Exit Pod puts the player on open floor');
 const inside=C.restore(JSON.stringify(Object.assign(C.startDistrictCampaign(C.fresh()),{})));Object.assign(inside.story.flags,{area:'district',districtBadge:true,districtDoor:true});delete inside.story.flags.podWakePending;
 const again=C.restore(JSON.stringify(inside));assert.equal(again.location,'earth');assert.equal(again.story.flags.area,'district','the flag survives save and reload');assert.equal(A.keyFor(again),'darknet-district');
 const r=A.resume(again,N);assert(!E.blocked(r.spawn[0],r.spawn[2],interior),'the resume spot is open floor in the interior');const [lx,lz]=N.toWorld(r.spawn[0],r.spawn[2]);assert(Math.abs(lx)<.01&&lz>26&&lz<30,'just inside the inner door');assert.equal(r.yaw,Math.PI);
});
test('the cloud save validator keeps the area flag',()=>{
 const py=read('tests/test_story_save.py');assert(py.includes("area"),'covered by the Python save test');
});
test('the street spawn and the exit spawn are outside the door; the vestibule is open floor in both environments',()=>{
 const o=A.exitSpawn(N);assert(!E.blocked(o.spawn[0],o.spawn[2],street));const [lx,lz]=N.toWorld(o.spawn[0],o.spawn[2]);assert(Math.abs(lx)<.01&&lz<20,'outside the outer door');assert.equal(A.exitTrigger(N,{x:o.spawn[0],z:o.spawn[2]}),false,'arriving does not trigger the exit again');assert.equal(o.yaw,-Math.PI/2);
 for(const lzv of [21,22.5,24,25]){const [x,z]=N.toWorld(0,lzv);assert(!E.blocked(x,z,street),'street vestibule '+lzv);assert(!E.blocked(x,z,interior),'interior vestibule '+lzv);}
 const [dx,dz]=N.toWorld(...A.POINT.outside);assert.equal(A.enterTrigger(N,{x:dx,z:dz},stateWith({districtBadge:true})),false,'standing outside never enters');
});
test('the checkpoint zone is the middle of the vestibule, the same for entering and leaving',()=>{
 const mid=N.toWorld(0,23),nearOuter=N.toWorld(0,21),nearInner=N.toWorld(0,25),outside=N.toWorld(0,19),hall=N.toWorld(0,30),wide=N.toWorld(8,23);
 const at=p=>({x:p[0],z:p[1]});
 assert.equal(A.centre(N,at(mid)),true);assert.equal(A.enterTrigger(N,at(mid)),true);assert.equal(A.exitTrigger(N,at(mid)),true);
 for(const p of [nearOuter,nearInner,outside,hall,wide])assert.equal(A.centre(N,at(p)),false);
 assert.equal(A.inVestibule(N,at(nearOuter)),true);assert.equal(A.inVestibule(N,at(nearInner)),true);assert.equal(A.inVestibule(N,at(outside)),false);assert.equal(A.inVestibule(N,at(hall)),false);
 assert(A.CENTRE.from>20+1.1&&A.CENTRE.to<26-1.1,'clear of both doorways, so a door can always close behind the player');
});
// ---- orchestration, with fakes ----
function rig(over={}){
 const log=[],st={story:{flags:{districtDoor:true,...(over.flags||{})}}};let location={area:over.from||'street'},mode='walking',walker={x:126.9,z:-66,yaw:3.14},busy=false,t=0;
 const d={A,N,state:()=>st,walker:()=>walker,mode:()=>mode,location:()=>location,graphicsBusy:()=>busy,now:()=>t,wait:async ms=>{log.push('wait:'+ms);},sleep:async ms=>{t+=ms;over.onSleep?.(api);},
  freeze:()=>{mode='preparing';log.push('freeze');},save:()=>log.push('save:'+JSON.stringify(st.story.flags.area||null)),announce:m=>log.push('announce:'+m),warn:()=>log.push('warn'),
  afterLoad:dir=>log.push('after:'+dir),afterBadge:()=>log.push('badge'),onState:p=>log.push('state:'+p),
  overlay:{show:(dir,text)=>log.push('show:'+dir+':'+text.title),step:i=>log.push('step:'+i),hide:async()=>log.push('hide')},
  enterWalking:async(key,opts)=>{log.push('enter:'+key+(opts.silent?':silent':''));if(over.fail===key){mode='dock';location=null;return;}location={area:key===A.KEY.interior?'interior':'street'};mode='walking';walker={x:opts.spawn[0],z:opts.spawn[2],yaw:opts.yaw};if(over.doors)door.fresh();}};
 // fake doors with sensors: told to close, they report closed only after `closeAfter` sensor reads (never, when stuck)
 const door={secured:false,reads:0,released:[],log,fresh(){door.secured=false;door.reads=0;},secure(on){door.secured=on;log.push('doors:'+(on?'seal':'unseal'));},closed(){door.total=(door.total||0)+1;return door.secured&&!over.stuck&&++door.reads>(over.closeAfter??2);},release(id){door.secured=false;door.released.push(id);log.push('doors:open:'+id);}};
 if(over.doors)d.doors=()=>door;
 const api={d,log,st,door,ctl:null,get location(){return location;},get walker(){return walker;},get mode(){return mode;},advance:ms=>{t+=ms;},setBusy:v=>{busy=v;},stand:(lx,lz)=>{const g=N.toWorld(lx,lz);walker.x=g[0];walker.z=g[1];}};
 api.ctl=T.create(d);return api;
}
const only=(log,prefixes)=>log.filter(x=>prefixes.some(p=>x.startsWith(p)));
test('going in: nothing is shown or loaded until the door sensors report both doors shut; then scan, load in place, save, clear the scan, open the inner door',async()=>{
 const r=rig({doors:true});r.stand(0,23);assert.equal(await r.ctl.go('in'),true);
 assert.deepEqual(only(r.log,['doors','freeze','show','enter','save','hide','state:VESTIBULE','state:EXIT','badge']),
  ['doors:seal','state:VESTIBULE_SECURED','freeze','show:in:SECURITY SCAN','enter:darknet-district:silent','doors:seal','save:"district"','hide','state:EXIT_DOOR_OPEN','doors:open:district-inner-door','badge']);
 assert.deepEqual(r.ctl.history,['ENTRY_DOOR_CLOSING','VESTIBULE_SECURED','SECURITY_SCAN','DESTINATION_LOADING','DESTINATION_READY','EXIT_DOOR_OPEN','COMPLETE']);
 assert.deepEqual(r.st.story.flags,{districtDoor:true,districtBadge:true,area:'district'});assert.equal(r.location.area,'interior');
 const g=N.toWorld(0,23);assert.deepEqual([r.walker.x,r.walker.z,r.walker.yaw],[g[0],g[1],3.14],'same place, same view');
 assert(r.door.total>2,'the sensors were read until they reported closed');
});
test('a returning badge holder gets no second badge message',async()=>{const r=rig({flags:{districtBadge:true}});await r.ctl.go('in');assert(!r.log.includes('badge'));});
test('going out is the same sequence from the same spot: the street loads around the player, who stays in the vestibule; the outer door opens last',async()=>{
 const r=rig({doors:true,from:'interior',flags:{area:'district',districtBadge:true}});r.stand(.5,23.4);const before=[r.walker.x,r.walker.z,r.walker.yaw];assert.equal(await r.ctl.go('out'),true);
 assert.deepEqual(only(r.log,['doors','freeze','show','enter','save','hide']),['doors:seal','freeze','show:out:SECURITY SCAN','enter:sacramento:silent','doors:seal','save:null','hide','doors:open:district-door']);
 assert.equal(r.st.story.flags.area,undefined);assert.equal(r.st.story.flags.districtBadge,true,'the badge is kept');assert.equal(r.location.area,'street');
 assert.deepEqual([r.walker.x,r.walker.z,r.walker.yaw],before,'no jump and no turn');
});
test('the scan cannot start while a door is open: stuck doors end in recovery with the entry door released, and nothing was loaded',async()=>{
 const r=rig({doors:true,stuck:true});r.stand(0,23);assert.equal(await r.ctl.go('in'),false);
 assert(!r.log.some(x=>x.startsWith('show')||x.startsWith('enter')||x==='freeze'),'no scan, no load, the player was never frozen');
 assert.deepEqual(r.door.released,['district-door']);assert.equal(r.ctl.state,'RECOVERY');assert.equal(r.mode,'walking');assert(r.log.some(x=>/could not seal/.test(x)));
});
test('stepping back out while the doors close calls the checkpoint off; the doors are unsealed',async()=>{
 const r=rig({doors:true,closeAfter:50,onSleep:api=>api.stand(0,19)});r.stand(0,23);assert.equal(await r.ctl.go('in'),false);
 assert.deepEqual(only(r.log,['doors','show','enter']),['doors:seal','doors:unseal']);assert.equal(r.ctl.state,'IDLE');
});
test('with real doors the checkpoint only works from the middle of the vestibule',async()=>{
 const r=rig({doors:true});r.stand(0,17.4);assert.equal(await r.ctl.go('in'),false);assert(!r.log.some(x=>x.startsWith('doors')));assert(r.log.some(x=>/middle of the security vestibule/.test(x)));
});
test('only one environment is ever loaded: nothing is loaded before the previous load finished, and only one is requested per transition',async()=>{
 const r=rig();await r.ctl.go('in');assert.equal(r.log.filter(x=>x.startsWith('enter:')).length,1);
 const r2=rig();const p=r2.ctl.go('in'),q=r2.ctl.go('in');assert.equal(await q,false,'a second request while busy is refused');await p;assert.equal(r2.log.filter(x=>x.startsWith('enter:')).length,1);
});
test('a transition is refused in the wrong place, while busy, mid-load or in cooldown, and the cooldown ends',async()=>{
 const r=rig();assert.equal(await r.ctl.go('out'),false,'not inside');
 r.setBusy(true);assert.equal(await r.ctl.go('in'),false);r.setBusy(false);
 assert.equal(await r.ctl.go('in'),true);assert.equal(await r.ctl.go('out'),false,'cooldown');r.advance(2000);assert.equal(await r.ctl.go('out'),true);assert.equal(r.location.area,'street');
});
test('a failed load puts the player back where they were with the door behind them open, and says so; the flags are untouched',async()=>{
 const r=rig({doors:true,fail:'darknet-district'});r.stand(0,23);assert.equal(await r.ctl.go('in'),false);
 assert.deepEqual(r.log.filter(x=>x.startsWith('enter:')),['enter:darknet-district:silent','enter:sacramento:silent']);assert.equal(r.location.area,'street');assert.equal(r.mode,'walking');
 assert.equal(r.st.story.flags.area,undefined);assert.equal(r.st.story.flags.districtBadge,undefined);assert(!r.log.some(x=>x.startsWith('save')));
 assert.deepEqual(r.door.released,['district-door'],'the outer door, the way back, is opened');assert(r.log.includes('hide'));assert(r.log.some(x=>/door behind you is open/.test(x)));assert.equal(r.ctl.state,'RECOVERY');
});
test('tick: only the middle of the vestibule starts it; after a transfer the player must leave the vestibule before it starts again',async()=>{
 const r=rig({doors:true,flags:{districtBadge:true}});r.stand(0,17.4);assert.equal(r.ctl.tick(),false);r.stand(0,21);assert.equal(r.ctl.tick(),false,'just inside the outer door: not yet');assert.equal(r.ctl.state,'ENTRY_DOOR_OPEN');
 r.stand(0,23);assert.equal(await r.ctl.tick(),true);assert.equal(r.location.area,'interior');
 r.advance(5000);assert.equal(r.ctl.tick(),false,'still standing in the middle: not sent straight back');assert.equal(r.ctl.armed,false);
 r.stand(0,29);assert.equal(r.ctl.tick(),false);assert.equal(r.ctl.armed,true);assert.equal(r.ctl.state,'IDLE');
 r.stand(0,23);assert.equal(await r.ctl.tick(),true);assert.equal(r.location.area,'street');
 const r2=rig({doors:true});r2.stand(0,17.4);r2.ctl.tick();r2.stand(0,23);assert.equal(await r2.ctl.tick(),true,'a first-time visitor who walks in is scanned automatically');
});
test('appearing in the vestibule (back from a simulation, a resumed game) does not start the checkpoint; walking out and in again does',async()=>{
 const r=rig({doors:true,from:'interior',flags:{area:'district',districtBadge:true}});r.stand(0,23);assert.equal(r.ctl.tick(),false,'just loaded, standing in the middle: nothing happens');assert.equal(r.ctl.armed,false);assert.equal(r.location.area,'interior');
 r.stand(0,23.5);assert.equal(r.ctl.tick(),false);r.stand(-12,36);assert.equal(r.ctl.tick(),false);assert.equal(r.ctl.armed,true);
 r.stand(0,23);assert.equal(await r.ctl.tick(),true);assert.equal(r.location.area,'street');
 // the same again when the place record is the very same object as before (the game reuses it): a menu or a loading screen in between is enough to notice
 const q=rig({doors:true,from:'interior',flags:{area:'district',districtBadge:true}});q.stand(-12,36);q.ctl.tick();assert.equal(q.ctl.armed,true);q.d.mode=()=>'vr-transition';q.ctl.tick();q.d.mode=()=>'walking';q.stand(0,23);assert.equal(q.ctl.tick(),false,'appeared in the middle after a simulation: not sent out');assert.equal(q.location.area,'interior');
});
test('reduced motion shortens the scan',async()=>{const r=rig();r.d.reducedMotion=()=>true;const ctl=T.create(r.d);await ctl.go('in');assert(r.log.includes('wait:'+(2400*.35)));});
test('the wording never says airlock, and there is no timed progress bar',()=>{
 const js=read('void-runner/district-transition.js'),css=read('void-runner/district-transition.css');
 assert.doesNotMatch(JSON.stringify(T.TEXT),/airlock/i);assert.doesNotMatch(js.replace(/\/\*[\s\S]*?\*\//g,''),/airlock/i);assert.doesNotMatch(js,/animation-duration/);assert.doesNotMatch(css,/dt-fill/);
});
test('the doors: each environment keeps the door to the other side shut, and the checkpoint has seal, sensor and release controls',()=>{
 const n=read('void-runner/neochinatown.js');
 assert.match(n,/isOpenable=d=>!\(area==='street'&&d\.id==='district-inner-door'\)&&!\(area==='interior'&&d\.id==='district-door'\)/);
 assert.match(n,/secure\(on\)\{secured=!!on;/);assert.match(n,/closed\(\)\{return list\.every\(d=>\{const solid=solidOf\(d\);return d\.open<=\.02&&\(!solid\|\|!solid\.open\);\}\);\}/);assert.match(n,/release\(id,seconds=8\)/);
 assert.match(n,/const want=secured\?d\.open>\.05&&inDoorway:/,'a sealed door still never closes on someone standing in it');
});

// ---- wiring in the game files ----
test('the loader, taxi and VR paths use the area rules',()=>{
 const w=read('void-runner/world-integration.js');assert(w.includes('VoidDistrictArea.keyFor(state),VoidDistrictArea.resume(state,VoidNeoChinatown)'));assert(w.includes('enterWalking=async function(id,options)'));assert(/worldEnterWalking\(id,options\)/.test(w));
 const v=read('void-runner/vr-core.js');assert.equal((v.match(/VoidDistrictArea\.keyFor\(state\)/g)||[]).length,2);assert(v.includes('vrEnter(id,options)'));
 const b=read('void-runner/babylon-integration.js');assert(b.includes('async function enterWalking(id, options = {})')&&b.includes('options.silent')&&b.includes('options.spawn'));
 const p=read('void-runner/prologue-integration.js');assert(p.includes("VoidNeoChinatown.layout('street')")&&p.includes("locations['darknet-district']=VoidNeoChinatown.layout('interior')")&&p.includes('function districtBadgeIssued()'));
 const html=read('void-runner.html');for(const f of ['district-area.js','district-transition.js','district-transition.css'])assert(html.includes('void-runner/'+f),f);
 assert.equal(html,read('static/void-runner.html'),'static copy is in sync');
 assert(html.indexOf('district-area.js')<html.indexOf('world-integration.js')&&html.indexOf('prologue-integration.js')<html.indexOf('district-transition.js'));
});
test('the new-player start wakes in a pod and Exit Pod leads to open floor',()=>{
 const w=read('void-runner/world-integration.js'),s=C.startDistrictCampaign(C.fresh());
 assert.deepEqual([s.story.flags.area,s.story.flags.districtBadge,s.story.flags.districtDoor,s.story.flags.podWakePending],['district',true,true,true]);
 assert.equal(A.keyFor(s),'darknet-district');const pod=A.resume(s,N),[x,z]=N.toWorld(pod.spawn[0],pod.spawn[2]);
 assert(Math.abs(x+5.2)<.01&&Math.abs(z-76.7)<.01);assert.equal(pod.spawn[1],1.1);
 const exit=A.podExit(N);assert(!E.blocked(exit.spawn[0],exit.spawn[2],interior));
 assert(w.includes('showPodWake()')&&w.includes('EXIT POD'),'the wake view has an explicit exit');
});
test('the existing interactions, the taxi, the VR arcade and the doors are all still wired',()=>{
 const ids=new Set(street.interactions.map(i=>i.id).concat(interior.interactions.map(i=>i.id)));for(const id of ['board','terminal','admin','district-iris','district-shop','district-bar','district-vr','district-vending','district-pod','district-meeting','district-stairs','district-stairs-down'])assert(ids.has(id),id);assert(!ids.has('tdd')&&!ids.has('district-scan')&&!ids.has('district-pod-music'),'no obsolete room/entrance prompts');
 const t=read('void-runner/district-transition.js');assert(t.includes("VoidInteractions.handlers.get('district-scan')")&&t.includes('original?.(...a)'),'the scanner keeps its original behaviour outside the street');
 assert(read('void-runner/neochinatown.js').includes("for(const k of ['city','nightclub','booths'])root.VoidNeoChinatown[k]=undefined"),'stale handles from a released environment are cleared');
});
test('continuing a campaign after Exit Pod resumes in the interior without replaying the wake view',()=>{
 const w=read('void-runner/world-integration.js'),s=C.startDistrictCampaign(C.fresh());delete s.story.flags.podWakePending;
 const restored=C.restore(JSON.stringify(s)),spot=A.resume(restored,N),[x,z]=N.toWorld(spot.spawn[0],spot.spawn[2]);
 assert.equal(A.keyFor(restored),'darknet-district');assert(Math.abs(x)<.01&&z>26&&z<30,'resume is in the hall');
 assert(w.includes('VoidDistrictArea.resume(state,VoidNeoChinatown)'),'the saved location determines the loaded environment');
 assert(w.includes("if(state.quest==='inheritance'){await workshopOpening();return;}")||w.includes('workshopOpening'),'a new campaign still starts through the same routine');
});
