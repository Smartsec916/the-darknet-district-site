const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../void-runner/campaign.js'),P=require('../void-runner/progression.js'),U=require('../void-runner/universe.js'),Opening=require('../void-runner/opening-data.js');
const baseline=require('./fixtures/pistol-phase2.json');
const source=fs.readFileSync(path.join(__dirname,'../void-runner/prologue-integration.js'),'utf8');
const current=source.slice(source.indexOf('const campaignPistolConsequences='),source.indexOf("groundControls.addEventListener('click'"));
const currentStep=source.split(/\r?\n/).find(l=>l.trimStart().startsWith('groundState.cooldown=Math.max'));
const copy=v=>JSON.parse(JSON.stringify(v));
function run(old,o={}){
 const state=C.fresh();state.progression.personal.weapon='ward-pistol';state.progression.opening.pistol=true;
 Object.assign(state.progression.personal,o.ammo||{});state.progression.opening.cans=[...(o.cans||[])];
 if(o.marked)state.progression.flags={fire:true,reload:true};
 const initial=copy(state),trace=[],saves=[];let ctx;
 const snapshot=()=>copy({state:ctx.state,weapon:ctx.groundState});
 const record=name=>trace.push({name,...snapshot()});
 const persist=()=>{record('save');saves.push(copy(ctx.state));};
 const stamp=id=>{record('mark:'+id);if(P.mark(ctx.state,id)){if(ctx.state.progression.completed)U.unlock(ctx.state);persist();}};
 class Vector3{constructor(x,y,z){Object.assign(this,{x,y,z});}}
 class Ray{constructor(origin,direction,length){Object.assign(this,{origin,direction,length});}}
 ctx=vm.createContext({state,C,P,stamp,save:persist,mode:o.mode||'walking',groundState:{drawn:true,aim:false,cooldown:0,reload:0,...o.weapon},
  walkingKeys:new Set(),walker:{x:0,y:1.68,z:0,yaw:0,pitch:0,height:0},walkingLocation:{solids:o.blocked?[{position:[0,1.68,2],size:[2,3,2]}]:[]},
  BABYLON:{Vector3,Ray},VoidOpening:{hit(s,id){record('can:'+id);return Opening.hit(s,id);}},
  VoidBabylon:{opening:o.noOpening?null:{hit(id){record('animate:'+id);}},scene:{pickWithRay(ray,predicate){record('ray');assert.equal(ray.length,40);assert.equal(predicate({isPickable:true,metadata:{canId:3}}),true);assert.equal(predicate({isPickable:true,metadata:{}}),false);return {hit:!o.miss,distance:10,pickedMesh:{metadata:{canId:o.canId??3}}};}}},
  VoidAudio:{event:id=>record('audio:'+id)},VoidShips:{get:()=>({})},announce:()=>record('announce'),personalInventory:()=>record('inventory')
 });
 vm.runInContext((old?baseline.action:current)+'\nfunction stepWeapon(dt){'+(old?baseline.step:currentStep)+'}',ctx);
 if(o.replaceState){ctx.state=copy(state);ctx.state.progression.personal.ammo=4;}
 const ammunition={ammo:3,reserve:2};
 for(const action of o.actions||['fire']){
  if(typeof action==='number')ctx.stepWeapon(action);
  else if(o.neutral){if(action==='finish')ctx.finishPistolReload(ammunition,null);else ctx.pistolAction(action,ammunition,null);}
  else ctx.groundAction(action);
 }
 return {initial,trace,saves,ammunition,...snapshot()};
}
const cases=[
 ['successful shot',{},2],
 ['already marked shot saves once',{marked:true},1],
 ['empty magazine',{ammo:{ammo:0}},0],
 ['holstered fire',{weapon:{drawn:false}},0],
 ['cooldown blocks repeated fire',{actions:['fire','fire']},2],
 ['reload blocks fire',{weapon:{reload:.5}},0],
 ['outside walking mode',{mode:'menu'},0],
 ['miss still consumes and saves',{miss:true},2],
 ['no workshop still fires',{noOpening:true},2],
 ['wall blocks can hit',{blocked:true},2],
 ['duplicate can does not animate',{cans:[3]},2],
 ['fourth can triggers progression and announcement',{cans:[0,1,2]},2],
 ['full reload',{ammo:{ammo:3,reserve:10},actions:['reload',P.tuning.ground.reload]},2],
 ['partial reload',{ammo:{ammo:3,reserve:2},actions:['reload',P.tuning.ground.reload]},2],
 ['reload without reserve',{ammo:{ammo:3,reserve:0},actions:['reload',2]},0],
 ['full magazine reload attempt',{actions:['reload',2]},0],
 ['holstered reload attempt',{weapon:{drawn:false},ammo:{ammo:3},actions:['reload',2]},0],
 ['reload timer does not restart',{ammo:{ammo:3},actions:['reload',.5,'reload',.61]},2],
 ['incomplete reload has no ammo or save effect',{ammo:{ammo:3},actions:['reload',.5]},0],
 ['reload completion processed once',{ammo:{ammo:3},marked:true,actions:['reload',2,2]},1],
 ['draw holster aim remain unchanged',{actions:['draw','draw','aim','aim']},3],
 ['handler follows replaced state',{replaceState:true},2]
];
for(const [name,options,count]of cases)test('pistol equivalence: '+name,()=>{
 const a=run(false,options);assert.deepEqual(a,run(true,options));assert.equal(a.saves.length,count);
});
test('fire saves before ray processing on first tutorial mark and after can processing',()=>{
 const a=run(false,{cans:[0,1,2]});assert.deepEqual(a.trace.map(x=>x.name),['mark:fire','save','ray','can:3','animate:3','announce','save','audio:laser']);
 assert.equal(a.saves[0].progression.personal.ammo,P.tuning.ground.magazine-1);assert.equal(a.saves[0].progression.opening.cans.length,3);assert.equal(a.saves[1].progression.opening.cans.length,4);
 assert.equal(a.trace[0].weapon.cooldown,P.tuning.ground.cooldown);
});
test('partial reload writes ammo before marking and retains both first-time saves',()=>{
 const a=run(false,{ammo:{ammo:3,reserve:2},actions:['reload',2]});assert.equal(a.state.progression.personal.ammo,5);assert.equal(a.state.progression.personal.reserve,0);
 assert.deepEqual(a.trace.map(x=>x.name),['mark:reload','save','save']);assert.equal(a.trace[0].weapon.reload,0);
});
test('neutral fire and reload operate on supplied values without Campaign mutations',()=>{
 const a=run(false,{neutral:true,actions:['fire','finish']});assert.deepEqual(a.state,a.initial);assert.deepEqual(a.saves,[]);assert.deepEqual(a.ammunition,{ammo:4,reserve:0});assert.deepEqual(a.trace.map(x=>x.name),['ray','audio:laser']);
});
