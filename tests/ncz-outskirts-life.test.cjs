/* The Outskirts' residents (void-runner/ncz-outskirts-life.js): ambient only, about half poor, clothed, no names or dialogue, inside the open ground and clear of containers. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const L=require('../void-runner/ncz-outskirts-life.js'),CT=require('../void-runner/ncz-containers.js'),Q=require('../void-runner/ncz-quarters.js');
const clips=look=>['idle','talk','sit','smoke','drink','watch','walk'];
test('about half of them look poor, the plan is the same every time, and Low has fewer',()=>{
 const m=L.plan('medium',clips),l=L.plan('low',clips);assert.deepEqual(m.map(p=>p.id+p.look),L.plan('medium',clips).map(p=>p.id+p.look));
 const share=m.filter(p=>p.poor).length/m.length;assert.ok(share>.4&&share<.6,'poor share '+share);assert.ok(l.length<m.length&&l.length>=5);
 for(const p of m.filter(p=>p.poor))assert.equal(p.worn.length,6,'each piece of clothing has its own worn colour');
 assert.ok(m.every(p=>L.CAST.includes(p.look)),'the street crowd\'s own looks');
});
test('they stand on open ground, not inside a container, and in The Outskirts only',()=>{
 for(const p of L.PEOPLE){assert.ok(Q.inQuarter('outskirts',p.x,p.z),p.id+' is in the quarter');assert.ok(!CT.PLAN.some(c=>Math.abs(p.x-c.x)<c.w/2+.2&&Math.abs(p.z-c.z)<c.d/2+.2),p.id+' is not inside a container');}
 const src=fs.readFileSync(path.join(__dirname,'../void-runner/ncz-outskirts-life.js'),'utf8');assert.ok(!/talk\(|VoidInteractions|register\(|name:/.test(src.replace(/\/\*[\s\S]*?\*\//g,'')),'no dialogue, interaction or name');
});
