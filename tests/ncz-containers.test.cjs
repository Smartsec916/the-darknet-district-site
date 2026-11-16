/* The Outskirts' container homes (void-runner/ncz-containers.js): the plan is fixed, walkways stay open, the reserved home is data only, nothing is lettered. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const CT=require('../void-runner/ncz-containers.js'),Q=require('../void-runner/ncz-quarters.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js');
const src=fs.readFileSync(path.join(__dirname,'../void-runner/ncz-containers.js'),'utf8');
test('the plan is deterministic and every container stands inside the open ground of The Outskirts',()=>{
 assert.deepEqual(CT.plan(4127).map(c=>[c.id,c.x,c.z,c.levels.map(l=>l.paint)]),CT.plan(4127).map(c=>[c.id,c.x,c.z,c.levels.map(l=>l.paint)]));
 const open=Q.QUARTERS.outskirts.streets;
 for(const c of CT.PLAN)assert.ok(open.some(r=>c.x-c.w/2>=r[0]-.01&&c.x+c.w/2<=r[1]+.01&&c.z-c.d/2>=r[2]-.01&&c.z+c.d/2<=r[3]+.01),c.id+' is inside the open ground');
 assert.ok(CT.PLAN.some(c=>c.stack>=3)&&CT.PLAN.some(c=>c.flag==='deck')&&CT.PLAN.some(c=>c.flag==='lean'),'stacked, deck and lean-to variants');
});
test('walking: the gate exit reaches the plaza, both lanes and the reserved home\'s door; the whole area is bounded',()=>{
 const L=N.layout('street','outskirts'),sp=L.spawn;assert.equal(E.blocked(sp[0],sp[2],L),false);
 const seen=new Set(),todo=[[sp[0],sp[2]]],cells=[];const k=(x,z)=>Math.round(x*2)+':'+Math.round(z*2);seen.add(k(sp[0],sp[2]));
 while(todo.length&&cells.length<80000){const [x,z]=todo.pop();cells.push([x,z]);for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const nx=x+dx,nz=z+dz;if(seen.has(k(nx,nz)))continue;seen.add(k(nx,nz));if(!E.blocked(nx,nz,L))todo.push([nx,nz]);}}
 for(const [x,z] of cells)assert.ok(Q.inQuarter('outskirts',x,z,.8),'a walker got out to '+x+','+z);
 const near=(x,z,r)=>cells.some(c=>Math.hypot(c[0]-x,c[1]-z)<r);
 assert.ok(near(61,-240,.6),'the plaza');assert.ok(near(28,-245,.6),'the west lane');assert.ok(near(100,-244,.6),'the east lane');
 const K=CT.KAI_HOME;assert.ok(near(K.step.x-1,K.door.z,1.2),'the home\'s step can be walked up to');
 assert.ok(cells.length>600,'enough to walk around: '+cells.length);
});
test('Kai Kryptos\' home is reserved as data only: an id, a place and a yaw; no character, no text, no interaction',()=>{
 const K=CT.KAI_HOME;assert.equal(K.id,'kai-kryptos-home');assert.equal(K.interaction,null);assert.equal(K.position.length,3);assert.ok(Number.isFinite(K.yaw));
 assert.ok(!/npc-kai|dialogue|VoidInteractions|register\(/.test(src.replace(/\/\*[\s\S]*?\*\//g,'')),'nothing of a character or an interaction');
 assert.ok(!/fillText|font\s*=/.test(src),'no letters are painted anywhere in the kit');
});
test('The Outskirts has no taxi stop, no road network, no ad screens and no vehicle bay at A6',()=>{
 const R=require('../void-runner/road-taxi-rules.js'),A=require('../void-runner/ad-screens-data.js');
 assert.deepEqual(R.createTraffic(2,1,'outskirts').taxis,[]);assert.equal(A.zoneAt('outskirts',61,-240),null);assert.deepEqual(Q.callPrompts('outskirts'),[]);
});
