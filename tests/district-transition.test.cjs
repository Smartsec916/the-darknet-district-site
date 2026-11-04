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
 const fresh=C.startDistrictCampaign(C.fresh());assert.equal(A.keyFor(fresh),'sacramento','a new campaign starts outside the doors');
 const inside=C.restore(JSON.stringify(Object.assign(C.startDistrictCampaign(C.fresh()),{})));Object.assign(inside.story.flags,{area:'district',districtBadge:true,districtDoor:true});
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
test('triggers: a badge holder walking into the vestibule enters; without a badge the scanner is needed; walking out through the door leaves',()=>{
 const inside=N.toWorld(0,24),near=N.toWorld(0,21.4),out=N.toWorld(0,20.4),hall=N.toWorld(0,30);
 assert.equal(A.enterTrigger(N,{x:inside[0],z:inside[1]},stateWith({districtBadge:true})),true);assert.equal(A.enterTrigger(N,{x:inside[0],z:inside[1]},stateWith({})),false);
 assert.equal(A.enterTrigger(N,{x:near[0],z:near[1]},stateWith({districtBadge:true})),false,'just past the outer door is not far enough');
 assert.equal(A.exitTrigger(N,{x:out[0],z:out[1]}),true);assert.equal(A.exitTrigger(N,{x:hall[0],z:hall[1]}),false);assert.equal(A.exitTrigger(N,{x:inside[0],z:inside[1]}),false);
 const wide=N.toWorld(8,24);assert.equal(A.enterTrigger(N,{x:wide[0],z:wide[1]},stateWith({districtBadge:true})),false,'only the vestibule, not the walls beside it');
});
// ---- orchestration, with fakes ----
function rig(over={}){
 const log=[],st={story:{flags:{districtDoor:true,...(over.flags||{})}}};let location={area:over.from||'street'},mode='walking',walker={x:126.9,z:-66,yaw:3.14},busy=false,t=0;
 const d={A,N,state:()=>st,walker:()=>walker,mode:()=>mode,location:()=>location,graphicsBusy:()=>busy,now:()=>t,wait:async ms=>{log.push('wait:'+ms);},
  freeze:()=>{mode='preparing';log.push('freeze');},save:()=>log.push('save:'+JSON.stringify(st.story.flags.area||null)),announce:m=>log.push('announce:'+m),warn:()=>log.push('warn'),
  afterLoad:dir=>log.push('after:'+dir),afterBadge:()=>log.push('badge'),
  overlay:{show:(dir,text)=>log.push('show:'+dir+':'+text.title),hide:async()=>log.push('hide')},
  enterWalking:async(key,opts)=>{log.push('enter:'+key+(opts.silent?':silent':''));if(over.fail===key){mode='dock';location=null;return;}location={area:key===A.KEY.interior?'interior':'street'};mode='walking';walker={x:opts.spawn[0],z:opts.spawn[2],yaw:opts.yaw};}};
 return {d,log,st,ctl:T.create(d),get location(){return location;},get walker(){return walker;},get mode(){return mode;},advance:ms=>{t+=ms;},setBusy:v=>{busy=v;}};
}
test('going in: freeze, overlay, load the interior silently where the player stands, then set the flags and save, open the inner door and show the badge once',async()=>{
 const r=rig();assert.equal(await r.ctl.go('in'),true);
 assert.deepEqual(r.log,['freeze','show:in:SECURITY CHECKPOINT','enter:darknet-district:silent','wait:2400','save:"district"','after:in','hide','badge']);
 assert.deepEqual(r.st.story.flags,{districtDoor:true,districtBadge:true,area:'district'});assert.equal(r.location.area,'interior');
 assert.deepEqual([r.walker.x,r.walker.z],[126.9,-66],'same place, same view');
});
test('a returning badge holder gets no second badge message',async()=>{const r=rig({flags:{districtBadge:true}});await r.ctl.go('in');assert(!r.log.includes('badge'));});
test('going out: load the street outside the door, clear the area flag, save',async()=>{
 const r=rig({from:'interior',flags:{area:'district',districtBadge:true}});assert.equal(await r.ctl.go('out'),true);
 assert.deepEqual(r.log.slice(0,4),['freeze','show:out:AIRLOCK','enter:sacramento:silent','wait:2000']);assert(r.log.includes('save:null'));
 assert.equal(r.st.story.flags.area,undefined);assert.equal(r.st.story.flags.districtBadge,true,'the badge is kept');assert.equal(r.location.area,'street');
 const o=A.exitSpawn(N);assert.deepEqual([r.walker.x,r.walker.z,r.walker.yaw],[o.spawn[0],o.spawn[2],o.yaw]);
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
test('a failed load puts the player back where they were and says so; the flags are untouched',async()=>{
 const r=rig({fail:'darknet-district'});assert.equal(await r.ctl.go('in'),false);
 assert.deepEqual(r.log.filter(x=>x.startsWith('enter:')),['enter:darknet-district:silent','enter:sacramento:silent']);assert.equal(r.location.area,'street');assert.equal(r.mode,'walking');
 assert.equal(r.st.story.flags.area,undefined);assert.equal(r.st.story.flags.districtBadge,undefined);assert(!r.log.some(x=>x.startsWith('save')));assert(r.log.includes('announce:The door did not cycle. Try again.'));
});
test('tick starts the transition from the vestibule edges and not from anywhere else',async()=>{
 const r=rig({flags:{districtBadge:true}});r.walker.x=N.toWorld(0,17.4)[0];r.walker.z=N.toWorld(0,17.4)[1];assert.equal(r.ctl.tick(),false);
 const g=N.toWorld(0,24);r.walker.x=g[0];r.walker.z=g[1];assert.equal(await r.ctl.tick(),true);assert.equal(r.location.area,'interior');
 r.advance(2000);const o=N.toWorld(0,20.5);r.walker.x=o[0];r.walker.z=o[1];assert.equal(await r.ctl.tick(),true);assert.equal(r.location.area,'street');
 const r2=rig();const v=N.toWorld(0,24);r2.walker.x=v[0];r2.walker.z=v[1];assert.equal(r2.ctl.tick(),false,'no badge: the scanner has to be used');
});
test('reduced motion shortens the scan',async()=>{const r=rig();r.d.reducedMotion=()=>true;const ctl=T.create(r.d);await ctl.go('in');assert(r.log.includes('wait:'+(2400*.35)));});

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
test('the new-player start is still outside the doors',()=>{
 const w=read('void-runner/world-integration.js');assert(w.includes("N.toWorld(0,17)"));const s=C.startDistrictCampaign(C.fresh());assert.equal(s.story.flags.area,undefined);assert.equal(A.keyFor(s),'sacramento');
 const [x,z]=N.toWorld(0,17);assert(!E.blocked(x,z,street));assert.equal(A.enterTrigger(N,{x,z},s),false);assert.equal(A.exitTrigger(N,{x,z}),false);
});
test('the existing interactions, the taxi, the VR arcade and the doors are all still wired',()=>{
 const ids=new Set(street.interactions.map(i=>i.id).concat(interior.interactions.map(i=>i.id)));for(const id of ['board','terminal','tdd','district-scan','admin','district-iris','district-shop','district-bar','district-vr','district-vending','district-pod','district-meeting','district-stairs','district-stairs-down'])assert(ids.has(id),id);
 const t=read('void-runner/district-transition.js');assert(t.includes("VoidInteractions.handlers.get('district-scan')")&&t.includes('original?.(...a)'),'the scanner keeps its original behaviour outside the street');
 assert(read('void-runner/neochinatown.js').includes("for(const k of ['city','nightclub','booths'])root.VoidNeoChinatown[k]=undefined"),'stale handles from a released environment are cleared');
});
test('continuing a new campaign saved inside the District does not move the player to the street start',()=>{
 const w=read('void-runner/world-integration.js');const fn=w.slice(w.indexOf('async function districtStart()'),w.indexOf('workshopOpening=async function'));
 assert(fn.includes("walkingLocation.area==='interior'")&&fn.indexOf("walkingLocation.area==='interior'")<fn.indexOf('N.toWorld(0,17)'),'the street start position is only applied outside');
 assert(w.includes("if(state.quest==='inheritance'){await workshopOpening();return;}")||w.includes('workshopOpening'),'a new campaign still starts through the same routine');
});
