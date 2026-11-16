/* The pure parts of the NeoChinatown building-gap check (tools/ncz/gap-check.cjs; docs/development/NCZ_GAP_CHECK.md). */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../tools/ncz/gap-check.cjs'),Q=require('../void-runner/ncz-quarters.js'),NC=require('../void-runner/ncz-nightclub.js');
test('expected walls: every street edge that is not another street, a gate or a declared opening',()=>{
 // a 10 x 4 street with a side street off its north edge and a gate at its east end
 const f=G.wallFaces([[0,10,0,4],[4,6,4,12]],[{id:'gate',rect:[10,12,0,4]}]);const at=(side,st)=>f.filter(x=>x.side===side&&x.street===st).map(x=>[x.from,x.to]);
 assert.deepEqual(at('n',0),[[0,4],[6,10]],'the side street\'s mouth is not a wall');assert.deepEqual(at('e',0),[],'nor is the gate');assert.deepEqual(at('w',0),[[0,4]]);assert.deepEqual(at('s',0),[[0,10]]);
 assert.deepEqual(at('s',1),[],'the side street opens into the main one');assert.deepEqual(at('n',1),[[4,6]]);assert.deepEqual(at('w',1),[[4,12]]);
 const n=f.find(x=>x.side==='n'&&x.street===0);assert.deepEqual(n.n,[0,1],'the normal points out of the street, into the building');assert.equal(n.axis,'x');assert.equal(n.fixed,4);
 // an opening in the middle of an edge (a doorway) splits the face
 assert.deepEqual(G.wallFaces([[0,10,0,4]],[{id:'door',rect:[4,5,-1,0]}]).filter(x=>x.side==='s').map(x=>[x.from,x.to]),[[0,4],[5,10]]);
});
test('Old Town and the Avenue: the faces follow the quarters\' own streets, the gates are openings, and nothing is expected across a street mouth',()=>{
 for(const q of ['oldtown','avenue']){const streets=Q.QUARTERS[q].streets.filter(r=>r!==NC.RECT),faces=G.wallFaces(streets,Q.gatesOf(q).map(g=>({id:g.id,rect:g.rect})));assert.ok(faces.length>=3,q);
  for(const f of faces){assert.ok(f.to-f.from>.5);const mid=(f.from+f.to)/2,[x,z]=f.axis==='z'?[f.fixed+f.n[0]*.6,mid]:[mid,f.fixed+f.n[1]*.6];
   assert.ok(!streets.some(r=>x>r[0]&&x<r[1]&&z>r[2]&&z<r[3]),q+': a wall is never expected inside a street');for(const g of Q.gatesOf(q))assert.ok(!(x>g.rect[0]&&x<g.rect[1]&&z>g.rect[2]&&z<g.rect[3]),q+': nor inside a gate');}}
 const av=G.wallFaces(Q.QUARTERS.avenue.streets,Q.gatesOf('avenue').map(g=>({id:g.id,rect:g.rect})));assert.deepEqual(av.filter(f=>f.side==='s').map(f=>[f.from,f.to]),[[10,51],[71,144]],'the North Gate stands in the Avenue\'s south side');
});
test('the ray grid: level rays from inside the street, a close grid, each long enough to pass the expected wall depth and no longer',()=>{
 const face={axis:'z',fixed:71,from:-55.5,to:-26,n:[1,0],side:'e'},rays=G.rayGrid(face,{step:.5,heights:[1,3],standoff:3,depth:1,margin:.4});
 assert.equal(rays.length,2*Math.floor((29.5-.8)/.5+1+1e-6));for(const r of rays){assert.equal(r.origin[0],68);assert.deepEqual(r.dir,[1,0,0]);assert.equal(r.wallAt,3);assert.equal(r.length,4);assert.ok(r.origin[2]>=-55.1-1e-9&&r.origin[2]<=-26.4+1e-9);assert.deepEqual(r.wall,[71,r.along]);}
 assert.equal(G.rayGrid(face,{room:1.5})[0].wallAt,1.5,'in a narrow street the ray starts inside the street');assert.equal(G.rayGrid({...face,axis:'x',fixed:-20,n:[0,-1]},{heights:[2]})[0].origin[2],-17);
});
test('classification and exclusions: a building piece within the depth is a wall; collision boxes, invisible meshes, signs, lights and people are looked through',()=>{
 const ray={length:4},hit=(name,distance,o={})=>({name,material:o.material||'',distance,visible:true,enabled:true,visibility:1,alpha:1,...o});
 assert.equal(G.classify(ray,[hit('old-building',3.1)]).result,'wall');assert.equal(G.classify(ray,[hit('storefront',2.95,{material:'ncz-shopfront'})]).by,'storefront');
 assert.equal(G.classify(ray,[]).result,'gap');assert.equal(G.classify(ray,[hit('old-building',9)]).result,'gap','a wall further back than the expected depth is not this wall');
 const through=G.classify(ray,[hit('shop-sign-3',2.8),hit('collider',3,{visible:false}),hit('ncz-batch',3.05,{material:'ncz-ad-argent'}),hit('light-pool',3.2),hit('crowd-walker',2),hit('awning',2.4),hit('glass',3,{alpha:.2})]);
 assert.equal(through.result,'gap');assert.deepEqual(through.skipped.map(s=>s.why),['sign, advertisement or decal','collision or invisible','sign, advertisement or decal','light, glow or weather','person, vehicle or drone','loose street furniture','see-through']);
 assert.equal(G.classify(ray,[hit('shop-sign-3',2.8),hit('old-building',3.12)]).result,'wall','a sign in front of a wall does not hide the wall');
 assert.equal(G.excluded({name:'gate-static',material:'ncz-gate-concrete',visible:true,enabled:true,visibility:1,alpha:1}),null,'a gatehouse is a building');
 assert.equal(G.excluded({name:'x',material:'',visible:true,enabled:false,visibility:1,alpha:1}),'collision or invisible');
});
test('flagged columns are reported as runs with a width',()=>{
 const cols=[0,.5,1,1.5,2,5,5.5].map(a=>({along:a,rows:6,gaps:a===1?0:6}));assert.deepEqual(G.runs(cols,.5).map(r=>[r.from,r.to,r.width]),[[-.25,.75,1],[1.25,2.25,1],[4.75,5.75,1]]);
 assert.deepEqual(G.runs([{along:3,rows:6,gaps:2}],.5),[],'a column where most rays hit the wall is not a run (windows, not a gap)');
});
test('the plots that should stand behind a face are found from the layout\'s city blocks, cut the way the builder cuts them',()=>{
 const N=require('../void-runner/neochinatown.js'),blocks=N.layout('all').solids.filter(s=>/^city-block-/.test(s.id));
 const face={axis:'z',fixed:71,from:-55.5,to:-26,n:[1,0]},plots=G.plotsBehind(face,blocks);assert.ok(plots.length>=2,'Main Street\'s east side north of the alley has plots');
 for(const p of plots){assert.ok(Math.abs(p.rect[0]-71)<.01,'each starts at the street line');assert.ok(p.rect[1]-p.rect[0]<=12.01&&p.rect[3]-p.rect[2]<=12.01,'no plot is wider than 12 m');assert.ok(p.from>=face.from&&p.to<=face.to);}
 assert.ok(Math.abs(plots[0].from-face.from)<.01&&Math.abs(plots[plots.length-1].to-face.to)<.01,'together they cover the face');for(let i=1;i<plots.length;i++)assert.ok(Math.abs(plots[i].from-plots[i-1].to)<.01,'with no space between them');
 assert.deepEqual(G.plotsBehind({axis:'z',fixed:61,from:-100,to:-90,n:[1,0]},blocks),[],'nothing stands in the middle of the road');
});
