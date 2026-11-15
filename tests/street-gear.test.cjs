// Street gear: what a person wears is decided by who they are, the gear is built on the body it is for, and every character file has its measurements.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../void-runner/street-gear.js'),root=path.join(__dirname,'..');
const fit=JSON.parse(fs.readFileSync(path.join(root,'void-runner/assets/models/gear/street-fit.json'),'utf8')).bodies;
const looks=fs.readdirSync(path.join(root,'void-runner/assets/models/crowd')).filter(f=>f.endsWith('.glb')).map(f=>f.slice(0,-4));
test('every character file has its measurements',()=>{
 for(const l of looks){const b=fit[l];assert.ok(b,l);assert.ok(b.height>1&&b.height<2.2,l);for(const k of ['waist','ribs','brow'])assert.ok(b[k].halfW>0&&b[k].front>b[k].back,l+' '+k);
  for(const s of ['Left','Right'])for(const k of ['thigh','knee','shin','forearm'])assert.ok(b[s][k].r>.015&&b[s][k].r<.2,l+' '+s+' '+k);}
 assert.deepEqual(Object.keys(fit).filter(l=>fit[l].skirt).sort(),['fixer-01','meridian-bartender','vr-companion-f'],'the three skirted outfits are known');
});
test('a person wears the same kit every time, and people differ',()=>{
 const a=G.loadout('district-resident:crew-bar1','district-resident',fit['district-resident']);assert.deepEqual(a,G.loadout('district-resident:crew-bar1','district-resident',fit['district-resident']));
 const kits=new Set();for(let i=0;i<60;i++)kits.add(JSON.stringify(G.loadout('hacker-01:walker-'+i,'hacker-01',fit['hacker-01'])));assert.ok(kits.size>25,'60 walkers wear many different kits ('+kits.size+')');
 const accents=new Set();for(let i=0;i<60;i++)accents.add(G.loadout('x:'+i,'hacker-01',fit['hacker-01']).accent);assert.equal(accents.size,G.ACCENTS.length,'every accent colour is used');
});
test('nothing is strapped over a skirt, and no goggles over a hat',()=>{
 for(let i=0;i<80;i++){const w=G.loadout('fixer-01:'+i,'fixer-01',fit['fixer-01']);assert.equal(w.thighs,'');assert.equal(w.knees,false);
  assert.equal(G.loadout('district-smuggler:'+i,'district-smuggler',fit['district-smuggler']).goggles,false);}
 assert.ok(!G.wants('vr-companion-f')&&!G.wants('vr-companion-m')&&G.wants('outlaw-01'),'VR companions are left alone');
});
const FULL={belt:true,pouches:4,harness:true,thighs:'LR',knees:true,bracer:'L',goggles:true,accent:2};
test('the full kit is one small mesh, built on the body it is for',()=>{
 for(const l of looks){const b=fit[l],g=G.build(b,FULL),n=g.positions.length/3,u=b.height/1.8;
  assert.equal(g.normals.length,n*3);assert.equal(g.uvs.length,n*2);assert.equal(g.bone.length,n);assert.ok(g.indices.length/3<1600,l+' triangles '+g.indices.length/3);
  assert.deepEqual(g.parts,['belt','harness','thigh_L','knee_L','bracer_L','thigh_R','knee_R','goggles']);
  for(const v of g.positions)assert.ok(Number.isFinite(v),l);for(const i of g.indices)assert.ok(i>=0&&i<n);for(const bi of g.bone)assert.ok(bi>=0&&bi<g.bones.length);
  // every vertex is close to the joint it hangs from (nothing flies off), in that body's own size
  for(let i=0;i<n;i++){const j=b.joints[g.bones[g.bone[i]]],d=Math.hypot(g.positions[i*3]-j[0],g.positions[i*3+1]-j[1],g.positions[i*3+2]-j[2]);assert.ok(d<.62*u,l+' '+g.bones[g.bone[i]]+' '+d.toFixed(3));}
  // normals are unit length
  for(let i=0;i<n;i+=97){const L=Math.hypot(g.normals[i*3],g.normals[i*3+1],g.normals[i*3+2]);assert.ok(Math.abs(L-1)<1e-6);}
  // colours come from the palette strip
  for(let i=0;i<n;i++){const cell=g.uvs[i*2]*G.CELLS-.5;assert.ok(Math.abs(cell-Math.round(cell))<1e-9&&cell>=0&&cell<G.CELLS);}
 }
});
test('the belt goes round the waist and the bracer round the forearm',()=>{
 const b=fit['outlaw-01'],belt=G.build(b,{...FULL,harness:false,thighs:'',knees:false,bracer:'',goggles:false});let minX=9,maxX=-9,minZ=9,maxZ=-9;
 for(let i=0;i<belt.positions.length;i+=3){minX=Math.min(minX,belt.positions[i]);maxX=Math.max(maxX,belt.positions[i]);minZ=Math.min(minZ,belt.positions[i+2]);maxZ=Math.max(maxZ,belt.positions[i+2]);}
 assert.ok(maxX>b.joints.Hips[0]+b.waist.halfW&&minX<b.joints.Hips[0]-b.waist.halfW,'wider than the waist');assert.ok(maxZ>b.waist.front&&minZ<b.waist.back,'in front of and behind the waist');
 const br=G.build(b,{...FULL,belt:false,harness:false,thighs:'',knees:false,goggles:false,bracer:'R'});assert.deepEqual(br.bones,['RightForeArm']);
 const e=b.joints.RightForeArm,h=b.joints.RightHand;for(let i=0;i<br.positions.length;i+=3){const x=br.positions[i];assert.ok(x<Math.max(e[0],h[0])+.001&&x>Math.min(e[0],h[0])-.001,'between elbow and wrist');}
});
test('nothing to wear builds nothing',()=>{assert.equal(G.build(fit['hacker-01'],{belt:false,pouches:2,harness:false,thighs:'',knees:false,bracer:'',goggles:false,accent:0}).indices.length,0);});
