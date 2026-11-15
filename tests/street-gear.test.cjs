// Street gear: what a person wears is decided by who they are, the gear is built on the body it is for, and every character file has its measurements.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../void-runner/street-gear.js'),root=path.join(__dirname,'..');
const fit=JSON.parse(fs.readFileSync(path.join(root,'void-runner/assets/models/gear/street-fit.json'),'utf8')).bodies;
const looks=fs.readdirSync(path.join(root,'void-runner/assets/models/crowd')).filter(f=>f.endsWith('.glb')&&!f.startsWith('npc-')).map(f=>f.slice(0,-4));   // npc-* characters come dressed and get no street gear
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
const FULL={belt:true,pouches:4,harness:true,thighs:'LR',knees:true,bracer:'L',goggles:true,jacket:true,accent:2};
test('the full kit is one small mesh, built on the body it is for',()=>{
 for(const l of looks){const b=fit[l],g=G.build(b,FULL),n=g.positions.length/3,u=b.height/1.8;
  assert.equal(g.normals.length,n*3);assert.equal(g.uvs.length,n*2);assert.equal(g.bone.length,n);assert.ok(g.indices.length/3<1900,l+' triangles '+g.indices.length/3);
  assert.deepEqual(g.parts,['belt','harness','thigh_L','knee_L','bracer_L','thigh_R','knee_R','jacket','goggles']);
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
 const b=fit['outlaw-01'],belt=G.build(b,{...FULL,harness:false,thighs:'',knees:false,bracer:'',goggles:false,jacket:false});let minX=9,maxX=-9,minZ=9,maxZ=-9;
 for(let i=0;i<belt.positions.length;i+=3){minX=Math.min(minX,belt.positions[i]);maxX=Math.max(maxX,belt.positions[i]);minZ=Math.min(minZ,belt.positions[i+2]);maxZ=Math.max(maxZ,belt.positions[i+2]);}
 assert.ok(maxX>b.joints.Hips[0]+b.waist.halfW&&minX<b.joints.Hips[0]-b.waist.halfW,'wider than the waist');assert.ok(maxZ>b.waist.front&&minZ<b.waist.back,'in front of and behind the waist');
 const br=G.build(b,{...FULL,belt:false,harness:false,thighs:'',knees:false,goggles:false,jacket:false,bracer:'R'});assert.deepEqual(br.bones,['RightForeArm']);
 const e=b.joints.RightForeArm,h=b.joints.RightHand;for(let i=0;i<br.positions.length;i+=3){const x=br.positions[i];assert.ok(x<Math.max(e[0],h[0])+.001&&x>Math.min(e[0],h[0])-.001,'between elbow and wrist');}
});
test('Admin has his own kit: amber, a jacket, and never eyewear',()=>{
 const w=G.loadout('admin','district-smuggler',fit['district-smuggler']);assert.equal(w.goggles,false,'David prefers Admin without eyewear');assert.equal(w.jacket,true);assert.deepEqual(G.ACCENTS[w.accent],[1,.62,.08],'amber');
 const g=G.build(fit['district-smuggler'],w);assert.ok(g.parts.includes('jacket')&&g.parts.includes('harness')&&g.parts.includes('belt')&&!g.parts.includes('goggles'));
 assert.equal(G.loadout('hacker-01:walker-3','hacker-01',fit['hacker-01']).jacket,false,'the jacket is Admin\'s alone');
});
test('Iris is an android, clean of belts and pouches',()=>{
 const w=G.loadout('iris','fixer-01',fit['fixer-01']);assert.equal(w.android,true);assert.equal(w.belt,false);assert.equal(w.harness,false);assert.equal(w.goggles,false);
 const g=G.build(fit['fixer-01'],w);assert.deepEqual(g.parts,['android']);assert.deepEqual(g.bones.sort(),['Head','Neck','Spine2']);
 assert.equal(G.loadout('fixer-01:walker-3','fixer-01',fit['fixer-01']).android,undefined,'nobody else is one');
});
test('nothing to wear builds nothing',()=>{assert.equal(G.build(fit['hacker-01'],{belt:false,pouches:2,harness:false,thighs:'',knees:false,bracer:'',goggles:false,accent:0}).indices.length,0);});

test('about one NPC in twenty wears the Rebellion Edition tee: a black body, sleeves, patches and the shirt\'s print on the chest',()=>{
 let tees=0;const N=4000;for(let i=0;i<N;i++){const w=G.loadout('hacker-01:walker-'+i,'hacker-01',fit['hacker-01']);if(w.tee){tees++;assert.equal(w.harness,false,'no chest rig over the print');}}
 assert.ok(tees/N>.035&&tees/N<.065,'about 5% ('+(100*tees/N).toFixed(1)+'%)');assert.equal(G.TEE_SHARE,.05);
 assert.equal(G.loadout('admin','district-smuggler',fit['district-smuggler']).tee,undefined,'not Admin');assert.equal(G.loadout('x:1','hacker-01',fit['hacker-01'],0).tee,false);assert.equal(G.loadout('x:1','hacker-01',fit['hacker-01'],1).tee,true);
 assert.ok(fs.statSync(path.join(root,G.TEE_PRINT)).size>3000,'the print picture is in the game');
 for(const l of looks){const b=fit[l],g=G.build(b,{tee:true,belt:false,pouches:0,harness:false,thighs:'',knees:false,bracer:'',goggles:false,accent:0}),u=b.height/1.8;
  assert.deepEqual(g.parts,['tee']);assert.deepEqual(g.bones.sort(),['LeftArm','RightArm','Spine1']);assert.ok(g.print&&g.print.bone==='Spine2');
  const P=g.print.positions,xs=[],ys=[],zs=[];for(let i=0;i<P.length;i+=3){xs.push(P[i]);ys.push(P[i+1]);zs.push(P[i+2]);}
  assert.ok(Math.min(...zs)>b.chest.front-.06*u,l+': the print is on the front of the chest');assert.ok(Math.abs((Math.max(...ys)-Math.min(...ys))-.2*u)<1e-6,'20 cm tall');
  assert.ok(Math.max(...xs)-Math.min(...xs)>.12*u&&Math.max(...xs)-Math.min(...xs)<.24*u,l+' print width');
  for(const v of g.print.uvs)assert.ok(v>=0&&v<=1);for(const v of g.positions)assert.ok(Number.isFinite(v));
  // u rises toward the wearer's left (+x), so the words read left to right for someone facing them
  assert.ok(P[0]<P[P.length-3]&&g.print.uvs[0]===0&&g.print.uvs[g.print.uvs.length-2]===1,l);}
 assert.equal(G.build(fit['hacker-01'],{tee:false,belt:true,pouches:2,harness:false,thighs:'',knees:false,bracer:'',goggles:false,accent:0}).print,null);
});

test('inside NULL exactly one NPC wears the tee, always the same dancer, at every quality',()=>{
 const src=fs.readFileSync(path.join(root,'void-runner/ncz-nightclub.js'),'utf8');assert.match(src,/low\?3:/,'even the lowest quality has dancers');assert.match(src,/spot\('dancer-'\+i/);assert.match(src,/club:p\.id/);
 const ids=['dancer-0','dancer-1','dancer-2','dancer-3','dancer-8','dj','bartender','door','bar-guest-a','bar-guest-b','vip-a','vip-b','queue-a','queue-b'];let n=0;
 for(const look of ['district-resident','ncz-neon','outlaw-01','hacker-01'])for(const share of [0,.05,1]){const w=ids.filter(id=>G.loadout(look+':club:'+id,look,fit[look],share).tee);assert.deepEqual(w,['dancer-0'],look+' share '+share);n++;}
 assert.equal(G.CLUB_TEE,'dancer-0');assert.equal(G.loadout('hacker-01:club:dancer-0','hacker-01',fit['hacker-01']).harness,false);
 assert.match(fs.readFileSync(path.join(root,'void-runner/street-gear.js'),'utf8'),/node\.metadata\?\.club\?'club:'\+node\.metadata\.club/,'club figures are seeded by their spot');
});
