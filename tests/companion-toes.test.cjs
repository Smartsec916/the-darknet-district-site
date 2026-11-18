/* Dex and Yuki (licensed Male Female Base Rig, private .vrpak): no clip may fold or curl their toes. Their first build held both ToeBase bones 90 (Dex) and
   151-180 (Yuki) degrees off the rest pose in every clip; retarget_world.py --fix-toes holds them at rest (18 Nov 2026). The files are not in this public
   repository: set VOID_PRIVATE_ASSETS to a checkout of the private asset repository to run it; otherwise it skips. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=process.env.VOID_PRIVATE_ASSETS&&path.join(process.env.VOID_PRIVATE_ASSETS,'void-runner/assets/models/crowd');
function unpack(b){const out=Buffer.alloc(b.length-8);let x=(0x9e3779b9^b.readUInt32LE(4))>>>0||1;for(let i=0;i<out.length;i++){if((i&3)===0){x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;}out[i]=b[i+8]^(x>>>((i&3)*8))&255;}return out;}
for(const model of ['vr-companion-bm','vr-companion-bf'])test(model+': every clip keeps the toes within 50 degrees of rest (a dance may bend them a little; the faults were 85 to 180)',{skip:!dir||!fs.existsSync(path.join(dir||'',model+'.vrpak'))?'private assets not here':false},()=>{
 const b=unpack(fs.readFileSync(path.join(dir,model+'.vrpak'))),jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl)),bin=b.slice(28+jl);
 const toes=new Set(j.nodes.map((n,i)=>/ToeBase$/.test(n.name||'')?i:-1).filter(i=>i>=0));assert.equal(toes.size,2);let clips=0;
 for(const a of j.animations){for(const c of a.channels){if(!toes.has(c.target.node)||c.target.path!=='rotation')continue;const acc=j.accessors[a.samplers[c.sampler].output],bv=j.bufferViews[acc.bufferView],o=(bv.byteOffset||0)+(acc.byteOffset||0),r=j.nodes[c.target.node].rotation||[0,0,0,1];
   for(let k=0;k<acc.count;k++){const q=[0,1,2,3].map(e=>bin.readFloatLE(o+16*k+4*e)),d=Math.min(1,Math.abs(q[0]*r[0]+q[1]*r[1]+q[2]*r[2]+q[3]*r[3]));assert.ok(2*Math.acos(d)*180/Math.PI<=50,model+' '+a.name+' key '+k);}}clips++;}
 assert.ok(clips>=24);
});
