const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../void-runner');
const C=require('../void-runner/campaign.js'),P=require('../void-runner/progression.js');
const M=require('../void-runner/missiles.js'),T=require('../void-runner/targeting.js');
const B=require('../void-runner/balance.js').defaults,FM=require('../void-runner/cockpit-math.js');
const source=fs.readFileSync(path.join(root,'combat.js'),'utf8');
const current=source.slice(source.indexOf('const campaignMissileFireConsequences='),source.indexOf("canvas.addEventListener('contextmenu'"));
// Frozen Phase 1 fireMissile implementation: behavior/order oracle, not production code.
const previous=`function fireMissile(){
 if(mode!=='play')return;
 VoidTargeting.step(missileLock,lockCandidates(),flightPoint,W,H,0,missileBalance(),VoidMissiles.ready(missileState));
 const missile=VoidMissiles.launch(missileState,missileLock,flightBasis(),missileBalance(),missileCooldown);
 if(!missile){updateMissileHud();VoidAudio.event('dry');return;}missiles.push(missile);if(!devMissileTrial){state.progression.missiles=missileState.missilesLoaded;VoidProgression.mark(state,'missileLocked');VoidProgression.mark(state,'missileFired');save();}missileCooldown=missileBalance().missileCooldown;missileLock=VoidTargeting.fresh();VoidAudio.event('missile',VoidShips.get(state));updateMissileHud();
}`;
const copy=v=>JSON.parse(JSON.stringify(v));
function run(code,o={}){
 const trace=[],saves=[];let ctx;
 const target={x:0,y:0,z:50,size:1,relationship:'hostile',...o.target};
 const state=C.fresh();state.progression.missiles=3;
 const initial=copy(state);
 const snapshot=()=>copy({state:ctx.state,runtime:ctx.missileState,missiles:ctx.missiles,lock:ctx.missileLock,cooldown:ctx.missileCooldown});
 const record=name=>trace.push({name,...snapshot()});
 const progression={...P,mark(s,id){record(id);return P.mark(s,id);}};
 const mod={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'campaign.js'),'utf8'),{module:mod,require:id=>id==='./progression.js'?progression:require(path.join(root,id))});
 ctx=vm.createContext({C:mod.exports,state,mode:o.mode||'play',devMissileTrial:!!o.trial,
  missileState:{ownsMissileLauncher:true,equipped:true,missilesLoaded:3,missileCapacity:3,...o.runtime},
  missiles:[],missileCooldown:o.cooldown||0,missileLock:{target:o.noTarget?null:target,progress:o.progress??1,status:'LOCK'},
  W:1000,H:800,lockCandidates:()=>o.noTarget?[]:[target],flightPoint:e=>({x:500+e.x*10,y:352+e.y*10,z:e.z}),flightBasis:()=>FM.basis(0,0),missileBalance:()=>B,
  VoidTargeting:{...T,step(...args){record('targeting');return T.step(...args);}},
  VoidMissiles:{...M,launch(...args){record('launch');return M.launch(...args);}},
  VoidProgression:progression,VoidShips:{get:s=>s.activeShip},
  VoidAudio:{event:name=>record('audio:'+name)},updateMissileHud:()=>record('hud'),save:()=>{record('save');saves.push(copy(ctx.state));}
 });
 vm.runInContext(code,ctx);
 if(o.replaceState){ctx.state=C.fresh();ctx.state.progression.missiles=3;}
 for(let i=0;i<(o.attempts||1);i++){
  if(i&&o.rearmLock){ctx.missileCooldown=0;ctx.missileLock={target,progress:1,status:'LOCK'};}
  if(o.neutral)ctx.fireMissile(null);else ctx.fireMissile();
 }
 return {initial,trace,saves,...snapshot()};
}
const failures=[
 ['no ammunition',{runtime:{missilesLoaded:0}}],['no target',{noTarget:true}],
 ['dead target',{target:{dead:true}}],['friendly target',{target:{relationship:'friendly'}}],
 ['out-of-range target',{target:{z:B.missileRange+1}}],['target moved off reticle',{target:{x:100}}],
 ['incomplete lock',{progress:.5}],['cooldown active',{cooldown:1}],
 ['launcher not owned',{runtime:{ownsMissileLauncher:false}}],['launcher unequipped',{runtime:{equipped:false}}]
];
for(const [name,options]of failures)test('missile-fire equivalence: '+name,()=>{
 const actual=run(current,options);assert.deepEqual(actual,run(previous,options));
 assert.equal(actual.missiles.length,0);assert.deepEqual(actual.state,actual.initial);assert.equal(actual.saves.length,0);
 assert.deepEqual(actual.trace.map(x=>x.name),['targeting','launch','hud','audio:dry']);
});
test('successful missile preserves ammo, progression, save and presentation order',()=>{
 const actual=run(current);assert.deepEqual(actual,run(previous));
 assert.deepEqual(actual.trace.map(x=>x.name),['targeting','launch','missileLocked','missileFired','save','audio:missile','hud']);
 assert.equal(actual.runtime.missilesLoaded,2);assert.equal(actual.state.progression.missiles,2);
 assert.equal(actual.missiles.length,1);assert.equal(actual.saves.length,1);
 const first=actual.trace.find(x=>x.name==='missileLocked'),saved=actual.trace.find(x=>x.name==='save');
 assert.equal(first.state.progression.missiles,2);assert.equal(first.missiles.length,1);
 assert.equal(saved.cooldown,0);assert.equal(saved.lock.progress,1);
 assert.equal(saved.state.progression.flags.missileFired,true);
 assert.equal(actual.cooldown,B.missileCooldown);assert.equal(actual.lock.target,null);
});
test('non-play mode remains a silent no-op',()=>{const a=run(current,{mode:'menu'});assert.deepEqual(a,run(previous,{mode:'menu'}));assert.deepEqual(a.trace,[]);});
test('developer trial fires without Campaign writes',()=>{const a=run(current,{trial:true});assert.deepEqual(a,run(previous,{trial:true}));assert.deepEqual(a.state,a.initial);assert.equal(a.saves.length,0);assert.equal(a.missiles.length,1);});
test('neutral consequence policy consumes runtime ammo only',()=>{const a=run(current,{neutral:true});assert.deepEqual(a.state,a.initial);assert.equal(a.saves.length,0);assert.equal(a.runtime.missilesLoaded,2);assert.equal(a.missiles.length,1);assert.deepEqual(a.trace.map(x=>x.name),['targeting','launch','audio:missile','hud']);});
test('repeated valid launches consume once each and stop at empty',()=>{const o={attempts:4,rearmLock:true},a=run(current,o);assert.deepEqual(a,run(previous,o));assert.equal(a.saves.length,3);assert.equal(a.missiles.length,3);assert.equal(a.state.progression.missiles,0);assert.deepEqual(a.saves.map(s=>s.progression.missiles),[2,1,0]);});
test('immediate repeat preserves cooldown/lock rejection and saves once',()=>{const o={attempts:2},a=run(current,o);assert.deepEqual(a,run(previous,o));assert.equal(a.saves.length,1);assert.equal(a.missiles.length,1);});
test('missile consequence handler follows replaced Campaign state',()=>{const o={replaceState:true},a=run(current,o);assert.deepEqual(a,run(previous,o));assert.equal(a.state.progression.missiles,2);assert.equal(a.state.progression.flags.missileFired,true);});
