/* Pins the facts the character audit and plan rest on, so they cannot drift unnoticed (docs/development/CHARACTER_MODEL_AUDIT.md). Read-only: it only opens GLB files. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {analyze,imageSize}=require('../tools/assets/analyze-character-models.cjs');
const dir='void-runner/assets/models/crowd',files=fs.readdirSync(dir).filter(f=>f.endsWith('.glb')).sort();
const all=files.map(f=>({f,...analyze(fs.readFileSync(path.join(dir,f)),f)}));

test('the analysis tool reads a hand-built GLB correctly',()=>{
 const json={asset:{version:'2.0'},nodes:[{name:'root',children:[1]},{name:'mixamorig:Hips'}],skins:[{joints:[1]}],meshes:[{name:'base',primitives:[{attributes:{POSITION:0},indices:1}]}],
  accessors:[{count:3,type:'VEC3',componentType:5126,min:[0,0,0],max:[0,1.8,0]},{count:3,type:'SCALAR',componentType:5123}],animations:[{name:'idle',channels:[{}],samplers:[{input:1,output:0}]}]};
 let j=Buffer.from(JSON.stringify(json));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);const bin=Buffer.alloc(8);
 const h=Buffer.alloc(12);h.write('glTF',0,'latin1');h.writeUInt32LE(2,4);h.writeUInt32LE(12+8+j.length+8+bin.length,8);
 const c0=Buffer.alloc(8);c0.writeUInt32LE(j.length,0);c0.write('JSON',4,'latin1');const c1=Buffer.alloc(8);c1.writeUInt32LE(bin.length,0);c1.write('BIN\0',4,'latin1');
 const r=analyze(Buffer.concat([h,c0,j,c1,bin]),'x.glb');
 assert.equal(r.triangles,1);assert.equal(r.meshes.length,1);assert.equal(r.skeleton.joints,1);assert.equal(r.animations[0].name,'idle');assert.equal(r.bindPoseHeight,1.8);assert.equal(analyze(Buffer.from('nope'),'y').error,'not a glb');
 assert.deepEqual(imageSize(Buffer.concat([Buffer.from([0x89]),Buffer.from('PNG\r\n\x1a\n'),Buffer.alloc(8),Buffer.from([0,0,2,0,0,0,1,0])]),'image/png'),[512,256]);
});
test('all 22 MakeHuman crowd characters share one 52-joint skeleton with identical names and order',()=>{
 assert.equal(files.length,22);
 const ref=JSON.stringify(analyze(fs.readFileSync(path.join(dir,'district-smuggler.glb')),'r').skeleton.names);
 assert.equal(JSON.parse(ref).length,52);
 for(const m of all){assert.equal(m.skeleton.joints,52,m.f);assert.equal(m.skeleton.convention,'mixamorig:',m.f);assert.equal(JSON.stringify(m.skeleton.names),ref,m.f+': joint names or order differ');}
});
test('the characters have separate body, hair, outfit and shoe meshes, no face rig and no morph targets (so no sliders)',()=>{
 for(const m of all){
  assert.equal(m.morphTargetsMax,0,m.f+': a morph target would make facial sliders possible: update the plan');assert.equal(m.skeleton.hasFaceBones,false,m.f);
  const names=m.meshes.map(x=>x.name);assert(names.includes('base'),m.f+' has a separate body');assert(m.meshes.length>=7,m.f+' has separate parts');
  assert.equal(m.images.every(i=>i.size&&i.size[0]===512&&i.size[1]===512),true,m.f+' textures are 512 px');
 }
});
test('the two current player looks and everything the hub may render exist, with the clips remote players need',()=>{
 const {RENDERABLE}=require('../tools/district-hub/protocol.cjs');
 for(const model of RENDERABLE){const m=all.find(x=>x.f===model+'.glb');assert(m,model);const clips=m.animations.map(a=>a.name);assert(clips.includes('idle')&&clips.includes('walk'),model+' clips: '+clips);}
});
test('no run, hug or turn clip exists in any built character (the audit says so)',()=>{
 for(const m of all)for(const a of m.animations)assert.doesNotMatch(a.name,/^(run|jog|sprint|hug|turn|jump|crouch)/,m.f+' now has '+a.name+': update the audit and plan');
});
