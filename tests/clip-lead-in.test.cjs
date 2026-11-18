/* The stray bind-pose first frame (18 Nov 2026): most figures' talk / watch / drink / wipe clips start with one key in the bind pose, arms straight out,
   and every NPC flung its arms out and down each time such a loop came round. asset-pipeline.js trims each clip's start past that key when a model loads. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../void-runner/asset-pipeline.js');
// The rotation keys of one bone in one clip of a GLB, as {frame (15 fps, as Babylon's glTF loader counts), value}.
function keysOf(file,clip,bone){const b=fs.readFileSync(file),jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString()),bin=b.slice(20+jl+8);
 const acc=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],n={SCALAR:1,VEC4:4}[a.type],off=(v.byteOffset||0)+(a.byteOffset||0),st=v.byteStride||n*4,out=[];for(let k=0;k<a.count;k++){const r=[];for(let c=0;c<n;c++)r.push(bin.readFloatLE(off+k*st+c*4));out.push(n===1?r[0]:r);}return out;};
 const a=(j.animations||[]).find(x=>x.name===clip);if(!a)return null;const c=a.channels.find(c=>c.target.path==='rotation'&&j.nodes[c.target.node].name.endsWith(bone));if(!c)return null;
 const s=a.samplers[c.sampler],t=acc(s.input),v=acc(s.output);return t.map((x,i)=>({frame:Math.round(x*15),value:v[i]}));}
const crowd=path.join(__dirname,'../void-runner/assets/models/crowd');
test('a first key far from the second (the bind pose) is skipped; an ordinary start is kept',()=>{
 const T=[.42,.42,-.57,.57],down=[-.566,.324,-.184,.736],near=[-.55,.33,-.19,.74];
 assert.equal(A.leadInEnd([{frame:1,value:T},{frame:2,value:down},{frame:3,value:down},{frame:4,value:down}]),2);
 assert.equal(A.leadInEnd([{frame:1,value:near},{frame:2,value:down},{frame:3,value:down},{frame:4,value:down}]),null);
 assert.equal(A.leadInEnd([{frame:0,value:T},{frame:4,value:T},{frame:8,value:down},{frame:12,value:down},{frame:484,value:down}]),8,'the stray key copied to frame 0 (as Babylon loads it)');
 assert.equal(A.leadInEnd([{frame:1,value:T},{frame:2,value:down}]),null,'too short to judge');assert.equal(A.leadInEnd(null),null);
});
test('the shipped clips that carry it are found (Fish\'s talk and watch, a crowd look\'s talk), and her idle is left alone',()=>{
 const fish=path.join(crowd,'npc-fish.glb');
 for(const clip of ['talk','watch','drink'])for(const bone of ['mixamorig:LeftArm','mixamorig:RightArm'])assert.equal(A.leadInEnd(keysOf(fish,clip,bone)),2,'npc-fish '+clip+' '+bone);
 assert.equal(A.leadInEnd(keysOf(fish,'idle','mixamorig:LeftArm')),null);
 assert.equal(A.leadInEnd(keysOf(path.join(crowd,'district-resident.glb'),'talk','mixamorig:LeftArm')),2);
});
test('trimLeadIn moves a clip\'s start past the stray key and leaves the others',()=>{
 const T={asArray:()=>[.42,.42,-.57,.57]},down={asArray:()=>[-.566,.324,-.184,.736]};
 const group=(name,first)=>{const g={name,from:0,to:121,normalized:null,targetedAnimations:[{target:{name:'mixamorig:LeftArm'},animation:{targetProperty:'rotationQuaternion',getKeys:()=>[{frame:0,value:first},{frame:1,value:first},{frame:2,value:down},{frame:3,value:down},{frame:121,value:down}]}}],normalize(a,b){this.normalized=[a,b];}};return g;};
 const talk=group('talk',T),idle=group('idle',down);
 assert.equal(A.trimLeadIn({animationGroups:[talk,idle]}),1);assert.deepEqual(talk.normalized,[2,121]);assert.equal(idle.normalized,null);
});
test('copies of a model keep the trimmed start (a copy rebuilds its clip range from the keys)',()=>{
 const made=[];const copy=(name,from)=>({name,from,to:121,normalize(a,b){made.push([name,a,b]);this.from=a;}});
 const r=A.keepTrim({animationGroups:[{name:'talk',from:8,to:121},{name:'idle',from:0,to:121}]},{animationGroups:[copy('crowd:npc-fish-talk',0),copy('crowd:npc-fish-idle',0)]});
 assert.deepEqual(made,[['crowd:npc-fish-talk',8,121]]);assert.equal(r.animationGroups[0].from,8);
});
