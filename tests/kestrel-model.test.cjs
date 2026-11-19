'use strict';
/* The Kestrel's exterior (kestrel-model.js, 19 Nov 2026): the Meshy model in the code ship's frame with its gear, engine glow and gun hooks, a High and a
   Low file, lossless meshopt geometry, and the code Kestrel kept as the stand-in when the file does not load. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('../void-runner/kestrel-model.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const glb=f=>{const b=fs.readFileSync(path.join(__dirname,'..','void-runner',f));assert.equal(b.readUInt32LE(0),0x46546c67);const n=b.readUInt32LE(12);return {b,j:JSON.parse(b.slice(20,20+n).toString()),bin:28+n};};
// width and height of a JPEG from its SOF marker
function jpegSize(buf){let i=2;while(i<buf.length){if(buf[i]!==0xff){i++;continue;}const m=buf[i+1],len=buf.readUInt16BE(i+2);if(m>=0xc0&&m<=0xcf&&![0xc4,0xc8,0xcc].includes(m))return [buf.readUInt16BE(i+7),buf.readUInt16BE(i+5)];i+=2+len;}return null;}

test('the files: hull, canopy, three legs, two lit engine cores and the hook nodes, in the code ship\'s frame; meshopt; High 2048 and Low 1024 maps',()=>{
 for(const [q,max] of [['high',2048],['low',1024]]){const f=K.MODEL.src(q),{b,j,bin}=glb(f);
  assert.ok(b.length<4.5e6,f+' size '+b.length);assert.ok((j.extensionsUsed||[]).includes('EXT_meshopt_compression'),'meshopt');
  const node=n=>j.nodes.find(x=>x.name===n);for(const k of K.HOOKS)assert.ok(node(k),f+' '+k);
  for(const k of ['hull','canopy','gear_nose','gear_left','gear_right','exhaust_left','exhaust_right'])assert.ok(node(k).mesh!==undefined,k+' has a mesh');
  assert.ok(j.materials.some(m=>m.name==='canopy_glass')&&j.materials.some(m=>m.name==='exhaust'&&m.emissiveFactor));
  // nose +z, the gear forward of the mains, the engines at the back, the left side at +x in the file (Babylon turns it to the pilot's left)
  const t=k=>node(k).translation;assert.ok(t('gear_nose')[2]>1&&t('gear_left')[2]<.5&&t('engine_left')[2]<-2&&t('engine_right')[2]<-2);
  assert.ok(t('engine_left')[0]>0&&t('engine_right')[0]<0&&t('muzzle_left')[0]>0&&t('missile_right')[0]<0);
  assert.ok(t('muzzle_chin_left')[2]>2,'chin guns at the nose');
  let tris=0;for(const m of j.meshes)for(const p of m.primitives)tris+=j.accessors[p.indices].count/3;assert.ok(tris>25000&&tris<40000,'triangles '+tris);
  for(const im of j.images){assert.equal(im.mimeType,'image/jpeg');const v=j.bufferViews[im.bufferView],s=jpegSize(b.slice(bin+(v.byteOffset||0),bin+(v.byteOffset||0)+v.byteLength));assert.ok(s&&Math.max(...s)<=max,f+' '+im.name+' '+s);}
 }
 assert.equal(K.MODEL.src('low'),'assets/models/ships/kestrel-low.glb');assert.equal(K.MODEL.src('medium'),'assets/models/ships/kestrel.glb');
});
test('register and definitions give the quality\'s file under ship:starter',()=>{
 const assets={models:{ships:{}}};K.register(assets,'low');assert.equal(assets.models.ships.starter.src,'assets/models/ships/kestrel-low.glb');
 assert.deepEqual(Object.keys(K.definitions('high')),['ship:starter']);
});
test('legs stretch to a floor within reason',()=>{
 assert.equal(K.gearScale(-.5,-.9,-.9),1);assert.ok(Math.abs(K.gearScale(-.5,-.9,-1)-1.25)<1e-9);assert.equal(K.gearScale(-.5,-.9,-3),1.45);assert.equal(K.gearScale(-.5,-.9,0),.7);
});
test('the page loads it; shipModel dresses the model and keeps the code Kestrel as the stand-in; every place that shows the ship loads the file',()=>{
 for(const f of ['void-runner.html','static/void-runner.html']){const h=read(f);assert.ok(h.indexOf('void-runner/kestrel-model.js')>h.indexOf('void-runner/asset-pipeline.js')&&h.indexOf('void-runner/kestrel-model.js')<h.indexOf('void-runner/babylon-renderer.js'));}
 const r=read('void-runner/babylon-renderer.js');
 assert.match(r,/VoidKestrel\.dress\(model,\{scene,landed:!!opts\.landed,allegiance\}\)/);assert.match(r,/const positions=\[\],indices=\[\],normals=\[\],uvs=\[\],rings=/,'the code Kestrel stays');
 assert.match(r,/fitGround\(ground\)/);assert.ok((r.match(/VoidKestrel/g)||[]).length>=4);assert.match(r,/\.\.\.kestrel\}/);
});
