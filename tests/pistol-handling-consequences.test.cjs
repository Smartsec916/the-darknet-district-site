const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const C=require('../void-runner/campaign.js'),P=require('../void-runner/progression.js'),U=require('../void-runner/universe.js');
const source=fs.readFileSync(path.join(__dirname,'../void-runner/prologue-integration.js'),'utf8');
const current=source.slice(source.indexOf('const campaignPistolHandlingConsequences='),source.indexOf('function groundAction(action)'));
// Frozen Phase 3 draw/aim branches, including the enclosing walking-mode guard.
const previous=`function pistolHandlingAction(action){if(mode!=='walking')return;
 if(action==='draw'&&state.progression.personal.weapon){groundState.drawn=!groundState.drawn;stamp(groundState.drawn?'draw':'holster');}
 if(action==='aim'){groundState.aim=!groundState.aim;if(groundState.drawn&&groundState.aim){stamp('aim');if(state.progression.personal.optic==='red-dot')stamp('sightAim');}}
}`;
const copy=x=>JSON.parse(JSON.stringify(x));
function run(code,o={}){
 const state=C.fresh();Object.assign(state.progression.personal,{weapon:'ward-pistol'},o.personal);
 Object.assign(state.progression.flags,o.flags);const initial=copy(state),trace=[],saves=[];let ctx;
 const snapshot=()=>copy({state:ctx.state,weapon:ctx.groundState});
 const save=()=>{trace.push({event:'save',...snapshot()});saves.push(copy(ctx.state));};
 const stamp=id=>{trace.push({event:id,...snapshot()});if(P.mark(ctx.state,id)){if(ctx.state.progression.completed)U.unlock(ctx.state);save();}};
 ctx=vm.createContext({C,state,stamp,mode:o.mode||'walking',groundState:{drawn:false,aim:false,...o.runtime}});
 vm.runInContext(code,ctx);
 if(o.replaceState){ctx.state=copy(state);ctx.state.progression.personal.optic='red-dot';}
 for(const action of o.actions||['draw']){
  if(action==='release'){ctx.groundState.aim=false;continue;}
  if(o.neutral)ctx.pistolHandlingAction(action,{weapon:'ward-pistol'},null);
  else ctx.pistolHandlingAction(action);
 }
 return {initial,trace,saves,...snapshot()};
}
const cases=[
 ['first draw',{},1],
 ['repeated draw toggles and only marks each flag once',{actions:['draw','draw','draw','draw']},2],
 ['first holster',{runtime:{drawn:true}},1],
 ['already marked draw/holster',{flags:{draw:true,holster:true},actions:['draw','draw']},0],
 ['no weapon cannot draw',{personal:{weapon:null}},0],
 ['first aim',{runtime:{drawn:true},actions:['aim']},1],
 ['repeated aim toggles',{runtime:{drawn:true},actions:['aim','aim','aim']},1],
 ['aim while holstered toggles without progression',{actions:['aim']},0],
 ['aim without weapon retains existing behavior',{personal:{weapon:null},actions:['aim']},0],
 ['red-dot aim marks aim then sight',{personal:{optic:'red-dot'},runtime:{drawn:true},actions:['aim']},2],
 ['red-dot repeated aim does not resave',{personal:{optic:'red-dot'},runtime:{drawn:true},actions:['aim','aim','aim']},2],
 ['outside walking mode',{mode:'menu',actions:['draw','aim']},0],
 ['holstering does not clear active aim',{runtime:{drawn:true,aim:true}},1],
 ['aim release has no consequence',{runtime:{drawn:true},actions:['aim','release']},1],
 ['handler reads replaced Campaign state',{replaceState:true,runtime:{drawn:true},actions:['aim']},2]
];
for(const [name,options,count]of cases)test('pistol handling equivalence: '+name,()=>{
 const a=run(current,options);assert.deepEqual(a,run(previous,options));assert.equal(a.saves.length,count);
});
test('runtime transitions precede marks and optic saves preserve order',()=>{
 const a=run(current,{personal:{optic:'red-dot'},actions:['draw','aim']});
 assert.deepEqual(a.trace.map(x=>x.event),['draw','save','aim','save','sightAim','save']);
 assert.equal(a.trace[0].weapon.drawn,true);assert.equal(a.trace[2].weapon.aim,true);
 assert.equal(a.saves[1].progression.flags.sightAim,undefined);assert.equal(a.saves[2].progression.flags.sightAim,true);
});
test('neutral draw/aim/holster changes runtime without Campaign writes',()=>{
 const a=run(current,{neutral:true,actions:['draw','aim','draw']});
 assert.deepEqual(a.state,a.initial);assert.deepEqual(a.trace,[]);assert.deepEqual(a.saves,[]);
 assert.deepEqual(a.weapon,{drawn:false,aim:true});
});
