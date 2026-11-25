/* Tier 2 and 3 sight stops at a wall. Hearing is a range. Tier 1 ignores a saved record. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const A=require(R('void-runner/npc-awareness.js')),P=require(R('void-runner/npc-paths.js'));
const aw={sight:40,fov:90,hear:{walk:20,sprint:40,combat:60}};
const her={x:0,z:0,yaw:0,tier:2,awareness:aw};
const wall=[[-1,1,2,3]];

test('sight is a cone and stops at a wall; a sprint is heard farther than a walk; Tier 1 ignores the record',()=>{
 assert.equal(A.notice(her,{x:0,z:5,kind:'walk'},[]).seen,true);
 assert.equal(A.notice(her,{x:5,z:0,kind:'walk'},[]).seen,false,'beside her, outside the cone');
 assert.equal(A.notice(her,{x:0,z:6,kind:'walk'},wall).seen,false);
 assert.equal(A.notice(her,{x:0,z:6,kind:'walk'},wall).heard,true,'hearing is not a view through the wall');
 assert.equal(A.notice(her,{x:0,z:10,kind:'walk'},[]).heard,false);
 assert.equal(A.notice(her,{x:0,z:10,kind:'sprint'},[]).heard,true);
 assert.equal(A.notice({...her,tier:1,awareness:{...aw,sight:80,hear:{walk:150,sprint:150,combat:150}}},{x:0,z:10,kind:'walk'},[]).seen,false);
 assert.deepEqual(A.problems(aw),[]);
 assert.match(A.problems({...aw,hear:{...aw.hear,sprint:10}}).join(' '),/sprint/);
 const plan={mode:'original',tier:2,awareness:aw};
 assert.deepEqual(P.planProblems('tea-host',plan),[]);
 assert.equal(P.planNow('tea-host',{plan:{...plan,mode:'stay',x:103.5,z:-6.4,yaw:0,actions:['idle']}}).awareness.sight,40);
 assert.match(P.planProblems('tea-host',{mode:'original',tier:1,awareness:aw}).join(' '),/Tier 2 or Tier 3/);
 const html=fs.readFileSync(R('void-runner.html'),'utf8');
 assert.ok(html.indexOf('npc-awareness.js')>0&&html.indexOf('npc-awareness.js')<html.indexOf('npc-paths.js'));
 assert.equal(fs.readFileSync(R('static/void-runner.html'),'utf8'),html);
});
