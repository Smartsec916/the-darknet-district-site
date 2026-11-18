// Zen Zephyr Temple: the monastery wall at the plateau's edge (temple-wall.js). Layout, gaps, height, colliders, reachability, wiring.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const T=require('../void-runner/temple.js'),W=require('../void-runner/temple-wall.js'),E=require('../void-runner/exploration-controller.js');
const L=T.layout(),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const reach=()=>{const st=.5,seen=new Set(),key=(x,z)=>x.toFixed(1)+','+z.toFixed(1),q=[[0,-38]];seen.add(key(0,-38));for(let i=0;i<q.length;i++){const [x,z]=q[i];for(const [dx,dz] of [[st,0],[-st,0],[0,st],[0,-st]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||E.blocked(nx,nz,L))continue;seen.add(k);q.push([nx,nz]);}}return q;};
test('the wall follows the plateau edge on all four sides, just inside the drop',()=>{
  const segs=W.segments();for(const side of ['south','north','west','east'])assert.ok(segs.some(s=>s.side===side),side);
  for(const s of segs){assert.ok(Math.abs(Math.abs(s.c)-49.1)<1e-9,'on the edge line');assert.ok(Math.abs(s.c)+W.BASE/2<=W.EDGE,'outer face inside the drop at 50');assert.ok(Math.abs(s.c)-W.BASE/2>Math.abs(T.PLATEAU[1])-1,'at the edge, not inside the courtyard');
   assert.ok(s.from>=-W.EDGE&&s.to<=W.EDGE&&s.to>s.from);}
  // every side covered from corner to corner except the gate gaps
  const covered=side=>{const r=segs.filter(s=>s.side===side).sort((a,b)=>a.from-b.from);let len=0;for(const s of r)len+=s.to-s.from;return len;};
  const gaps=W.GATES.reduce((a,g)=>a+(g.to-g.from),0);assert.ok(Math.abs(covered('north')-2*(49.1+W.BASE/2))<1e-6);assert.ok(Math.abs(covered('south')+gaps-2*(49.1+W.BASE/2))<1e-6);assert.ok(Math.abs(covered('east')-2*(49.1-W.BASE/2))<1e-6,'the overlook window is a segment too');
});
test('just taller than the player: 2.1-2.4 m to the coping; a battered (tapered) base; the overlook keeps a 1 m sill',()=>{
  assert.ok(W.HEIGHT>=2.1&&W.HEIGHT<=2.4,W.HEIGHT);assert.ok(W.HEIGHT>T.ARRIVAL.spawn[1]+.4,'above eye height');assert.ok(W.halfAt(0)>W.halfAt(W.BODY),'battered');
  for(const s of W.segments())assert.ok(s.kind==='window'?s.height===1:s.height===W.HEIGHT);assert.equal(W.segments().filter(s=>s.kind==='window').length,1);
  const win=W.segments().find(s=>s.kind==='window');assert.equal(win.side,'east');const ov=T.INTERACTIONS.find(i=>i.id==='temple-overlook');assert.ok(ov.position[2]>win.from&&ov.position[2]<win.to,'the window is in front of the overlook');
});
test('gaps where the ways out are: the road bay behind the taxi stop, the walkers\' bay behind the East Gate sign',()=>{
  const road=W.GATES.find(g=>g.kind==='road'),foot=W.GATES.find(g=>g.kind==='foot');assert.ok(road.from<T.CAB_PAD.x-2.4&&road.to>T.CAB_PAD.x+2.4,'wider than the cab');assert.ok(foot.from<T.WALK_BACK.x&&foot.to>T.WALK_BACK.x);
  for(const g of W.GATES){const m=(g.from+g.to)/2;assert.equal(E.blocked(m,-48.8,L),false,g.id+' open');assert.equal(E.blocked(m,-W.EDGE,L),true,'but the edge is still the edge');}
  for(const x of [-30,-20,20,30])assert.equal(E.blocked(x,-48.8,L),true,'south wall solid at '+x);
});
test('colliders replace the old parapet: solid all round except the gates, and you cannot leave through the wall',()=>{
  assert.ok(!L.solids.some(s=>/^temple-parapet-/.test(s.id)),'the parapet solids are gone');const per=L.solids.filter(s=>/^temple-perimeter-/.test(s.id));assert.equal(per.length,W.segments().length);
  for(const s of per)assert.ok(s.size[1]>=2.1);
  for(const [x,z] of [[48.8,0],[-48.8,10],[0,48.8],[48.8,-20],[48.8,40],[-40,-48.8],[48.8,48.8]])assert.equal(E.blocked(x,z,L),true,x+','+z);
  const q=reach();const out=q.filter(([x,z])=>Math.abs(x)>48.4||Math.abs(z)>48.4);for(const [x,z] of out)assert.ok(z<-48&&W.GATES.some(g=>x>=g.from-.01&&x<=g.to+.01),'past the wall line only in a gate: '+x+','+z);
  assert.ok(out.length>0,'the gates can be walked into');
});
test('every Temple interaction is still reachable with the wall in place',()=>{
  const q=reach();for(const i of L.interactions)assert.ok(q.some(([x,z])=>Math.hypot(x-i.position[0],z-i.position[2])<=i.range),i.id);
});
test('decoration: niches, lanterns, finials on corners and gate piers, sparing saffron cloth; and the wiring',()=>{
  const f=W.features(),n=k=>f.filter(x=>x.kind===k).length;assert.ok(n('wheels')>=8&&n('glyph')>=8);assert.ok(n('lantern')>=4&&n('lantern')<n('wheels')+n('glyph'),'occasional lanterns');assert.equal(n('stupa'),6);assert.ok(n('banner')<=6);
  const html=read('void-runner.html');assert.ok(html.indexOf('void-runner/temple.js')<html.indexOf('void-runner/temple-wall.js')&&html.indexOf('void-runner/temple-wall.js')<html.indexOf('void-runner/temple-build.js'),'loaded after temple.js, before the build');
  const src=read('void-runner/temple-build.js');assert.match(src,/VoidTempleWall\.build\(\{scene,parent:node,quality,own/);assert.match(src,/else for\(const r of T\.PARAPET\)/,'falls back to the parapet');
  const w=read('void-runner/temple-wall.js');assert.match(w,/MergeMeshes/);assert.doesNotMatch(w,/new B\.(Point|Spot|Directional|Hemispheric)Light/,'no real lights');assert.match(w,/own\.push/);
});
