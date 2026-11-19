'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Fit=require('../void-runner/character-fit.js'),{parseGlb,accessor}=require('../tools/assets/glb-lib.cjs');
const PARTS=path.join(__dirname,'..','void-runner/assets/models/parts'),DATA=JSON.parse(fs.readFileSync(path.join(PARTS,'bind-data.json'),'utf8'));

test('matrix helpers: inverse and multiply',()=>{
 const m=[0,1,0,0,-1,0,0,0,0,0,2,0,3,4,5,1],p=Fit.mul(m,Fit.inv(m));
 p.forEach((v,i)=>assert.ok(Math.abs(v-Fit.I()[i])<1e-9));
 assert.throws(()=>Fit.inv(new Array(16).fill(0)));
});
test('refit onto the same body changes nothing',()=>{
 const part=DATA.parts.short01,g=parseGlb(path.join(PARTS,part.file)),pr=g.json.meshes[0].primitives[0];
 const mesh={positions:accessor(g,pr.attributes.POSITION).values,normals:accessor(g,pr.attributes.NORMAL).values,joints:accessor(g,pr.attributes.JOINTS_0).values,weights:accessor(g,pr.attributes.WEIGHTS_0).values};
 const wmax=g.json.accessors[pr.attributes.WEIGHTS_0].componentType===5126?1:g.json.accessors[pr.attributes.WEIGHTS_0].componentType===5121?255:65535;
 mesh.weights=mesh.weights.map(w=>w/wmax);
 const r=Fit.refit(mesh,part.ibm,part.ibm,1);
 for(let i=0;i<mesh.positions.length;i++)assert.ok(Math.abs(r.positions[i]-mesh.positions[i])<1e-4);
});
test('every hairstyle fits the bodies the catalog offers it on, and the fit data is consistent',()=>{
 assert.equal(Object.keys(DATA.parts).length,9);
 for(const [style,p] of Object.entries(DATA.parts)){
  assert.ok(fs.existsSync(path.join(PARTS,p.file)));
  assert.ok(p.tris>0&&p.tris<9000,style+' triangle count');
  for(const [body,f] of Object.entries(DATA.fit[style])){
   const r=Fit.headFit(p.headDims,DATA.bodies[body].headDims);
   assert.equal(f.ok,r.mismatch<=Fit.FIT_LIMIT);
   for(const j of p.joints)assert.ok(DATA.bodies[body].ibm[j],'body '+body+' lacks joint '+j);
  }
 }
});
test('a hairstyle moved onto a different body lands on that body\'s head',()=>{
 // short01 (vesper-mechanic) onto hacker-01: after the fit the hair must sit around the target head, not float away
 const a=DATA.parts.short01,dst=DATA.bodies['hacker-01'],srcBody=DATA.bodies[a.source],g=parseGlb(path.join(PARTS,a.file)),pr=g.json.meshes[0].primitives[0];
 const wd=g.json.accessors[pr.attributes.WEIGHTS_0].componentType===5126?1:255;
 const mesh={positions:accessor(g,pr.attributes.POSITION).values,normals:null,joints:accessor(g,pr.attributes.JOINTS_0).values,weights:accessor(g,pr.attributes.WEIGHTS_0).values.map(w=>w/wd)};
 const s=Fit.headFit(a.headDims,dst.headDims).scale,r=Fit.refit(mesh,srcBody.ibm,dst.ibm,s);
 const topSrc=Math.max(...mesh.positions.filter((_,i)=>i%3===1)),topDst=Math.max(...r.positions.filter((_,i)=>i%3===1));
 assert.ok(Math.abs(topDst-dst.topY)<0.12,'hair top '+topDst+' vs head top '+dst.topY);
 assert.ok(Math.abs(topSrc-srcBody.topY)<0.12);
});
