// Tropical Escape dolphins: created offshore, the swim clip and the leap both move them, and leaving disposes them.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module');
const orig=Module.prototype.require;
Module.prototype.require=function(id){if(id==='babylonjs')return require('../void-runner/vendor/babylon-8.26.0.js');return orig.apply(this,arguments);};
const BABYLON=require('../void-runner/vendor/babylon-8.26.0.js');
require('../void-runner/vendor/babylonjs-loaders-8.26.0.min.js');
const {ownInstance}=require('../void-runner/asset-pipeline.js');
globalThis.VoidVR={register(){}};
globalThis.VoidVRKit={kit(){},spot:(id,label,x,z,range=2.4)=>({id:'vr-'+id,label,position:[x,1.7,z],action:'vr-act',range})};
globalThis.VoidAssets={ownInstance};
require('../void-runner/vr-tropical.js');
const D=globalThis.VoidTropicalDolphins;
const PIER_END=34;

test('dolphins are placed offshore and the leap stays on the surface',()=>{
  const school=D.create(3);
  assert.equal(school.length,3);
  for(const d of school){assert.ok(d.z>PIER_END,d.z+' is past the pier');assert.ok(d.z>=42);assert.equal(d.phase,'swim');assert.equal(d.shown,true);assert.equal(d.y,D.SURFACE);}
  const first=school[0],x0=first.x;
  for(let i=0;i<20;i++)D.step(first,.05);
  assert.ok(first.x>x0,'swimming toward +x moves the dolphin');
  assert.equal(first.shown,true);assert.equal(first.y,D.SURFACE);
  first.wait=0;const started=D.step(first,.05);
  assert.equal(first.phase,'leap');assert.ok(started.some(e=>e.splash),'leaving the water splashes');
  let peak=first.y,shownBelow=false;
  for(let i=0;i<40&&first.phase!=='under';i++){D.step(first,.05);if(first.shown&&first.y<D.SURFACE-1e-6)shownBelow=true;peak=Math.max(peak,first.y);}
  assert.equal(shownBelow,false,'a visible dolphin is never below the cruise height');
  assert.ok(peak>D.SURFACE+D.LEAP_H*.9,'the arc clears the water');
  assert.equal(first.phase,'under');assert.equal(first.shown,false,'the dive is not drawn under the sea');
  let back=false;
  for(let i=0;i<40&&!back;i++)back=D.step(first,.05).some(e=>e.splash)&&first.phase==='swim';
  assert.equal(first.phase,'swim');assert.equal(first.shown,true);assert.equal(first.y,D.SURFACE);
});

test('dolphins are created, the swim clip plays, they leap, and dispose removes them',async()=>{
  const engine=new BABYLON.NullEngine(),scene=new BABYLON.Scene(engine);
  scene.activeCamera=new BABYLON.FreeCamera('cam',new BABYLON.Vector3(0,2,-8),scene);
  const container=await BABYLON.SceneLoader.LoadAssetContainerAsync('',new Uint8Array(fs.readFileSync('void-runner/assets/vr/models/dolphin.glb')),scene,null,'.glb');
  const parent=new BABYLON.TransformNode('room',scene),tickers=[];
  const k={B:BABYLON,scene,parent,
   material(name){return new BABYLON.StandardMaterial('vr-'+name,scene);},
   paint(){const tex=new BABYLON.RawTexture(new Uint8Array(16*16*4),16,16,BABYLON.Engine.TEXTUREFORMAT_RGBA,scene,false,false,BABYLON.Texture.NEAREST_SAMPLINGMODE,BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE);tex.hasAlpha=true;return tex;},
   every(fn){tickers.push(fn);},
   dispose(){tickers.length=0;for(const p of [...scene.particleSystems])p.dispose();container.dispose();}};
  const school=D.spawn(k,container,2);
  assert.equal(school.dolphins.length,2);
  assert.ok(container.animationGroups.every(g=>g.isPlaying===false),'the loaded clip is left stopped');
  assert.ok(school.dolphins.every(d=>d.swim.isPlaying&&/swim/i.test(d.swim.name)),'each dolphin starts its own swim clip');
  const d0=school.dolphins[0],mesh=d0.node.getChildMeshes(false).find(m=>m.skeleton),bone=mesh.skeleton.bones.find(b=>b.name==='Tail');
  assert.equal(bone.getTransformNode().name,'vr-dolphin0-Tail');
  d0.swim.goToFrame(0);mesh.skeleton.prepare(true);const rest=bone.rotationQuaternion.x;
  d0.swim.goToFrame(30);mesh.skeleton.prepare(true);
  assert.notEqual(+bone.rotationQuaternion.x.toFixed(3),+rest.toFixed(3),'the swim clip moves the skeleton');
  const x0=d0.node.position.x;
  for(let i=0;i<10;i++)for(const fn of tickers)fn(.05,i);
  assert.ok(d0.node.position.x>x0,'the per-frame update moves the dolphin');
  d0.wait=0;d0.phase='swim';
  let peak=d0.node.position.y;
  for(let i=0;i<20;i++){for(const fn of tickers)fn(.1,i);peak=Math.max(peak,d0.node.position.y);}
  assert.ok(peak>D.SURFACE+2,'the placed model follows the leap');
  assert.ok(scene.particleSystems.some(p=>p.name.startsWith('vr-dolphin-splash')&&p.isStarted()),'a splash system is running');
  const node=d0.node,group=d0.swim;
  k.dispose();
  assert.equal(node.isDisposed(),true);
  assert.equal(group.targetedAnimations.length,0);assert.equal(scene.animationGroups.includes(group),false);
  assert.equal(scene.particleSystems.length,0);assert.equal(D.live,null);assert.equal(tickers.length,0);
  engine.dispose();
});
