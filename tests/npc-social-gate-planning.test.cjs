const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../void-runner/npc-escort.js'),'utf8');
function fixture(){
 const areaOf=p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.z)?null:p.x<10?'a':p.x<30?'b':'c';
 const lane=(key,x)=>({key,gate:key,kind:'foot',mid:[x,0],doors:{lo:{x:x-2,z:0},hi:{x:x+2,z:0}}});
 const areas=['a','b','c'].map(id=>({id,scene:'street',quarter:id}));
 const root={VoidNPCPaths:{MOVABLE:{npc:{name:'NPC'},cat:{cat:true},dax:{placementOnly:true}},spotProblems:()=>[]},
  VoidNPCAreas:{list:()=>areas,get:id=>areas.find(a=>a.id===id),areaOf,nearest:p=>p},
  VoidQuarters:{LANES:[lane('ab',10),lane('bc',30)],gate:k=>({name:k,ends:{lo:{quarter:k[0]},hi:{quarter:k[1]}}})}};
 vm.runInNewContext(source,root);
 const E=root.VoidNPCEscort,policy={enabled:true,tier:2,session:'social:npc:1',leg:0,allowGate:()=>true};
 const from={area:'a',x:2,z:0},dest={area:'c',x:40,z:0},plan=()=>E.socialGateLeg('npc',from,dest,policy);
 const cross=(p=plan(),over={},actor={},pol=policy)=>E.socialGateCross(p,{...p.to,key:p.key,area:p.area,...actor},{key:p.key,from:p.area,to:p.next,via:p.via,onFoot:true,riding:false,player:p.to,...over},pol);
 return {E,root,policy,from,dest,plan,cross};
}
test('opted-in tier 2 plans first canonical foot gate of a multi-leg route',()=>{const f=fixture(),p=f.plan();assert.equal(p.via,'gate:ab');assert.equal(p.next,'b');assert.equal(p.final,false);assert.equal(p.to.x,6.4);assert.equal(f.E.socialGateLeg('npc',{area:'b',x:14,z:0},f.dest,f.policy).via,'gate:bc');});
test('tier 1, missing opt-in, unknown tier and missing gate authority fail closed',()=>{const f=fixture();for(const policy of [{...f.policy,tier:1},{...f.policy,enabled:false},{...f.policy,tier:4},{...f.policy,allowGate:undefined},{...f.policy,allowGate:()=>1}])assert.equal(f.E.socialGateLeg('npc',f.from,f.dest,policy),null);});
test('placement-only and cat cannot acquire a social gate route',()=>{const f=fixture();for(const id of ['dax','cat'])assert.equal(f.E.socialGateLeg(id,f.from,f.dest,{...f.policy,session:'social:'+id+':1'}),null);});
test('denied later gate, throwing authority and wrong actor area reject whole route',()=>{const f=fixture();assert.equal(f.E.socialGateLeg('npc',f.from,f.dest,{...f.policy,allowGate:(_,id)=>id!=='gate:bc'}),null);assert.equal(f.E.socialGateLeg('npc',f.from,f.dest,{...f.policy,allowGate:()=>{throw Error('locked');}}),null);assert.equal(f.E.socialGateLeg('npc',{...f.from,area:'b'},f.dest,f.policy),null);});
test('actual gate crossing returns canonical arrival and no taxi or spawn fallback',()=>{const f=fixture(),p=f.plan(),r=f.cross(p);assert.equal(r.area,'b');assert.equal(r.x,14.4);assert.equal(r.ride,null);assert.equal(r.key,p.key);});
test('reject stale generation, wrong transition and taxi or ambiguous movement',()=>{const f=fixture(),p=f.plan();for(const t of [{via:'gate:bc'},{from:'b'},{to:'c'},{riding:true},{riding:undefined},{onFoot:false}])assert.equal(f.cross(p,t),null);assert.equal(f.cross(p,{}, {key:'old'}),null);assert.equal(f.cross(p,{}, {},{...f.policy,session:'social:npc:2'}),null);});
test('actual actor and player must reach gate and cannot substitute arbitrary points',()=>{const f=fixture(),p=f.plan();assert.equal(f.cross(p,{}, {x:1}),null);assert.equal(f.cross(p,{player:{x:0,z:0}}),null);assert.equal(f.cross({...p,to:{x:1,z:0}}),null);});
test('gate permission and canonical arrival checked again at transfer time',()=>{const f=fixture(),p=f.plan();assert.equal(f.cross(p,{}, {},{...f.policy,allowGate:()=>false}),null);f.root.VoidNPCPaths.spotProblems=(_,q)=>q.x>10?['closed']:[];assert.equal(f.cross(p),null);});
test('mission planner retains default routing when no social authority supplied',()=>{const f=fixture();assert.equal(f.E.areaRoute('npc',f.from,f.dest).length,2);assert.equal(f.E.areaRoute('npc',f.from,f.dest,()=>false),null);});

test('leg ordinal must be an explicit nonnegative safe integer',()=>{const f=fixture();for(const leg of [undefined,null,-1,0.5,Infinity,'0',Number.MAX_SAFE_INTEGER+1])assert.equal(f.E.socialGateLeg('npc',f.from,f.dest,{...f.policy,leg}),null);});
test('old gate transition cannot satisfy a repeated leg in the same session',()=>{const f=fixture(),p=f.plan(),policy={...f.policy,leg:2},again=f.E.socialGateLeg('npc',f.from,f.dest,policy);assert.notEqual(p.key,again.key);assert.equal(f.cross(p,{}, {},policy),null);assert.equal(f.cross(again,{key:p.key},{},policy),null);assert.equal(f.cross(again,{}, {key:p.key},policy),null);assert.equal(f.cross(again,{}, {},policy).leg,2);});
test('transition must carry the current exact leg key, including first crossing',()=>{const f=fixture(),p=f.plan();for(const key of [undefined,null,'old'])assert.equal(f.cross(p,{key}),null);assert.equal(f.cross(p).leg,0);});
test('mutated plan ordinal and invalid current ordinal cannot transfer',()=>{const f=fixture(),p=f.plan();assert.equal(f.cross({...p,leg:1}),null);for(const leg of [undefined,-1,Infinity])assert.equal(f.cross(p,{}, {},{...f.policy,leg}),null);});
