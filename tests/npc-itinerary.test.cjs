/* Registered links and the authored schedule determine travel for all tiers. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const P=require(R('void-runner/npc-paths.js')),A=require(R('void-runner/npc-areas.js'));
const REV='tea-host',CAT='street-cat';
const place=id=>{const p=A.places().find(q=>q.id===id);assert.ok(p,id);return {x:p.x,z:p.z};};
const stay=(from,to,id,extra)=>({from,to,mode:'stay',...place(id),yaw:0,actions:['idle'],...extra});

test('all tiers can use an authored schedule crossing when a route exists',()=>{
 const day=(tier,cross)=>({mode:'original',...(tier?{tier}:{}),schedule:[stay('08:00','12:00','laundry'),stay('12:00','14:00','oldtown-alley-mouth',cross?{cross:true}:{})]});
 for(const tier of [undefined,1,2,3]){
  assert.deepEqual(P.planProblems(REV,day(tier,true)),[]);
  const at=P.planNow(REV,{plan:day(tier,true),minute:13*60});
  const source=P.scheduledScenePlan(REV,at,new Set(['avenue']));
  const destination=P.scheduledScenePlan(REV,at,new Set(['oldtown']));
  assert.equal(source.area,'avenue');assert.equal(A.areaOf(source),'avenue');
  assert.equal(destination.area,'oldtown');assert.equal(A.areaOf(destination.entry),'oldtown');
  assert.deepEqual(destination.actions,['idle']);
 }
 assert.equal(P.planNow(REV,{plan:day(2,false),minute:13*60}).crossings,undefined,'crossing presentation is opt-in');
 const route=day(1,true),town=route.schedule[1];
 route.schedule[1]={mode:'path',from:town.from,to:town.to,cross:true,name:'夜の巡回 🌙',points:[{x:town.x,z:town.z,action:'idle',seconds:4},{x:town.x+.4,z:town.z,action:'idle',seconds:4}]};
 assert.deepEqual(P.planProblems(REV,route),[]);
 assert.equal(P.clean(route).schedule[1].name,'夜の巡回 🌙');
 const routed=P.scheduledScenePlan(REV,P.planNow(REV,{plan:route,minute:13*60}),new Set(['oldtown']));
 assert.equal(routed.mode,'path');assert.equal(A.areaOf(routed.entry),'oldtown');assert.deepEqual(routed.points,route.schedule[1].points);
 assert.match(P.planProblems(REV,{mode:'original',tier:2,schedule:[stay('08:00','12:00','laundry'),stay('12:00','14:00','corporate-boulevard',{cross:true})]}).join(' '),/cannot walk/);
 const catPlan={mode:'original',schedule:[{...stay('08:00','12:00','laundry'),actions:['cat-sit']},{...stay('12:00','14:00','district-hall',{cross:true}),actions:['cat-sit']}]};
 assert.deepEqual(P.planProblems(CAT,catPlan),[]);
 const indoors=P.planNow(CAT,{plan:catPlan,minute:13*60});
 assert.equal(indoors.area,'district');
 assert.ok(indoors.crossings.oldtown.entry&&indoors.crossings.oldtown.depart);
 assert.deepEqual(P.scheduledScenePlan(CAT,indoors,new Set(['oldtown'])).actions,['cat-look']);
 const sp=fs.readFileSync(R('void-runner/ncz-street-pair.js'),'utf8'),ed=fs.readFileSync(R('void-runner/npc-editor.js'),'utf8');
 assert.match(sp,/scenePlan/);assert.match(ed,/data-npc-tier-select/);assert.match(ed,/Walk through the gates/);
});

test('the walking routine follows its approach once then keeps the scheduled destination',()=>{
 const actor='tea-host',plan={mode:'original',schedule:[stay('08:00','12:00','laundry'),stay('12:00','14:00','oldtown-alley-mouth',{cross:true})]};
 const E=require('../void-runner/npc-escort'),S=require('../void-runner/ncz-street-pair');
 const projected=P.scheduledScenePlan(actor,P.planNow(actor,{plan,minute:13*60}),new Set(['oldtown']));
 assert.ok(Math.hypot(projected.entry.x-projected.x,projected.entry.z-projected.z)>1);
 const before={area:globalThis.VoidNPCAreas,escort:globalThis.VoidNPCEscort,paths:globalThis.VoidNPCPaths};
 Object.assign(globalThis,{VoidNPCAreas:A,VoidNPCEscort:E,VoidNPCPaths:P});
 try{
  const s={who:actor,mode:'plan-go',x:projected.entry.x,z:projected.entry.z,yaw:0};
  for(let i=0;i<3000;i++)S.routineStep(s,.1,()=>.5,S.config,{plan:projected});
  assert.equal(s.x,projected.x);assert.equal(s.z,projected.z);assert.equal(s.clip,'idle');
 }finally{Object.assign(globalThis,{VoidNPCAreas:before.area,VoidNPCEscort:before.escort,VoidNPCPaths:before.paths});}
});
