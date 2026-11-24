/* Tier 2 and 3 may walk from one area into the next through the gates. Tier 1 may not. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const P=require(R('void-runner/npc-paths.js')),A=require(R('void-runner/npc-areas.js'));
const REV='tea-host',CAT='street-cat';
const place=id=>{const p=A.places().find(q=>q.id===id);assert.ok(p,id);return {x:p.x,z:p.z};};
const stay=(from,to,id,extra)=>({from,to,mode:'stay',...place(id),yaw:0,actions:['idle'],...extra});

test('Tier 1 cannot walk into another area; Tier 2 can when a gate joins them',()=>{
 const day=(tier,cross)=>({mode:'original',...(tier?{tier}:{}),schedule:[stay('08:00','12:00','laundry'),stay('12:00','14:00','oldtown-alley-mouth',cross?{cross:true}:{})]});
 assert.match(P.planProblems(REV,day(null,true)).join(' '),/Tier 1/);
 assert.match(P.planProblems(REV,{...day(1,true),tier:1}).join(' '),/Tier 1/);
 assert.deepEqual(P.planProblems(REV,day(2,true)),[]);
 const at=P.planNow(REV,{plan:day(2,true),minute:13*60});
 assert.equal(at.area,'oldtown');assert.equal(at.depart.area,'avenue');assert.match(at.depart.via,/^gate:north/);assert.ok(A.areaOf(at.arrive)==='oldtown');
 assert.equal(P.planNow(REV,{plan:day(2,false),minute:13*60}).depart,undefined,'without the checkbox she still changes area when the block starts');
 assert.match(P.planProblems(REV,{mode:'original',tier:2,schedule:[stay('08:00','12:00','laundry'),stay('12:00','14:00','corporate-boulevard',{cross:true})]}).join(' '),/cannot walk/);
 assert.match(P.planProblems(CAT,{mode:'original',tier:2,schedule:[stay('08:00','12:00','laundry'),{...stay('12:00','14:00','district-hall',{cross:true}),actions:['cat-sit']}]}).join(' '),/never goes inside|cannot walk/);
 const sp=fs.readFileSync(R('void-runner/ncz-street-pair.js'),'utf8'),ed=fs.readFileSync(R('void-runner/npc-editor.js'),'utf8');
 assert.match(sp,/scenePlan/);assert.match(ed,/data-npc-tier-select/);assert.match(ed,/Walk through the gates/);
});
