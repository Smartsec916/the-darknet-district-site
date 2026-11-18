/* The shared humanoid animation library (the owner, 16 Nov 2026): motion-capture clips kept ONCE, on a bare skeleton, and applied to every character whose
   skeleton has the same bones, instead of being baked into each character's own file. A new clip is added by retargeting it into the library
   (tools/animation-pipeline/retarget_library.py) and listing it in CLIPS below; nothing else changes.

   - Library files live in void-runner/assets/models/anim/. The first one, `actorcore`, holds licensed ActorCore motion capture and is NOT in this public
     repository: it is packed and encrypted like the other licensed models (private repository, sealed at the Pages build). Where the file is missing
     (a local checkout without the private assets) nothing is added and every character keeps the clips it already has.
   - A clip is given to a figure by name: the library's bones and the figure's bones are matched by their names after the last ':' (mixamorig:Hips -> Hips).
     Rotations are copied as they are; the hips' movement is scaled to the figure's own hip height, so a shorter or taller figure sits and lies at the right height.
   - The clips become ordinary animation groups on the figure, named <look>-<clip>, and are added to the figure's look in VoidCrowd.clips, so the code that
     already plays clips by name (crowd.js controllers, the companions) plays them like any other.
   Pure data and helpers run in Node (tests/anim-library.test.cjs). */
(function(root){
 'use strict';
 /* Every clip in a library: {id, title, category, seconds (about), loop, root ('inplace' | 'free'), group (people who must play matching parts together),
    part (which seat of the group), needs (what the place must offer), who ('any' | 'f')}. */
 const CLIPS={actorcore:[
  {id:'ac-sit-bench-1',title:'Sitting on a bench, relaxed',category:'sit',seconds:27.7,loop:true,root:'free',needs:'seat'},
  {id:'ac-sit-bench-4',title:'Sitting on a bench, shifting',category:'sit',seconds:26.5,loop:true,root:'free',needs:'seat'},
  {id:'ac-stand-curve-2',title:'Standing pose, weight on one hip',category:'stand',seconds:12.4,loop:true,root:'inplace'},
  {id:'ac-stand-curve-3',title:'Standing pose, hand on hip',category:'stand',seconds:10.3,loop:true,root:'inplace'},
  {id:'ac-ground-pose-2',title:'Floor pose, kneeling',category:'floor',seconds:21.2,loop:true,root:'free',needs:'floor'},
  {id:'ac-ground-pose-3',title:'Floor pose, seated',category:'floor',seconds:20.1,loop:true,root:'free',needs:'floor'},
  {id:'ac-ground-pose-4',title:'Floor pose, reclining',category:'floor',seconds:18.4,loop:true,root:'free',needs:'floor'},
  {id:'ac-sensual-dance-3',title:'Slow dance',category:'dance',seconds:9.2,loop:true,root:'inplace'},
  {id:'ac-sensual-movement-1',title:'Slow movement',category:'dance',seconds:24,loop:true,root:'inplace'},
  {id:'ac-3sit-chat-g1-f1',title:'Seated conversation, set 1, first seat',category:'group-sit',seconds:17.9,loop:true,root:'free',needs:'seat',group:'3sit-g1',part:1},
  {id:'ac-3sit-chat-drink-g2-f2',title:'Seated conversation with a drink, set 2, second seat',category:'group-sit',seconds:17.6,loop:true,root:'free',needs:'seat',group:'3sit-g2',part:2},
  {id:'ac-3sit-chat-drink-g2-f3',title:'Seated conversation with a drink, set 2, third seat',category:'group-sit',seconds:17.6,loop:true,root:'free',needs:'seat',group:'3sit-g2',part:3},
  {id:'ac-cuddle-kiss-f',title:'Cuddle and kiss (her part)',category:'together',seconds:19,loop:false,root:'free',group:'cuddle-kiss',part:1,partner:'missing'},
  {id:'ac-sit-cuddle-hug-f',title:'Seated cuddle and hug (her part)',category:'together',seconds:12,loop:false,root:'free',needs:'seat',group:'sit-cuddle-hug',part:1,partner:'missing'}
 ]};
 const FILES={actorcore:'assets/models/anim/anim-actorcore.vrpak'};
 const SOURCES={actorcore:{name:'ActorCore (Reallusion) motion capture',licence:'Reallusion content licence, bought by the owner; originals are kept outside this repository',skeleton:'Mixamo-named humanoid (MakeHuman figures and anything retargeted to them)'}};
 const bare=n=>String(n||'').split(':').pop();
 const all=()=>Object.entries(CLIPS).flatMap(([lib,list])=>list.map(c=>({...c,library:lib})));
 const clip=id=>all().find(c=>c.id===id)||null;
 const byCategory=cat=>all().filter(c=>c.category===cat);
 /* The parts of a group sequence that exist, and the seats nobody has a recording for (those must be filled with a matching clip made in Blender, never
    with a part from a different sequence). */
 function group(name){const parts=all().filter(c=>c.group===name).sort((a,b)=>a.part-b.part),size=/^3sit/.test(name)?3:2,have=parts.map(p=>p.part);
  return {name,size,parts,missing:Array.from({length:size},(_,i)=>i+1).filter(i=>!have.includes(i))};}
 const groups=()=>[...new Set(all().map(c=>c.group).filter(Boolean))].map(group);
 /* Which clips a figure can take: its bones must include the ones the clip moves. bones: the figure's bare bone names. */
 const CORE=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
 const compatible=bones=>{const have=new Set(bones||[]);return CORE.every(b=>have.has(b));};
 /* Rotations are copied as they are, so a figure's bones must also REST the way the library's do (the same local axes). Same names are not enough: Dex and Yuki
    (the licensed Male Female Base Rig) name their bones mixamorig:* but every limb bone points along different local axes, and the copied clips twisted them
    into knots (the owner, 18 Nov 2026: "the new male model in Studio 3 is looking weird"). restOffset(lib, fig): the largest difference, in degrees, between the
    two rest rotations of any core bone (lib / fig: bare bone name -> [x,y,z,w]); restMatches: within REST_LIMIT. A figure that does not match keeps its own clips. */
 const REST_LIMIT=25;
 function restOffset(lib,fig){let worst=0;for(const b of CORE){const p=lib?.[b],q=fig?.[b];if(!p||!q)continue;const d=Math.min(1,Math.abs(p[0]*q[0]+p[1]*q[1]+p[2]*q[2]+p[3]*q[3])/((Math.hypot(...p)*Math.hypot(...q))||1));worst=Math.max(worst,2*Math.acos(d)*180/Math.PI);}return worst;}
 const restMatches=(lib,fig,limit=REST_LIMIT)=>restOffset(lib,fig)<=limit;
 const pure={CLIPS,FILES,SOURCES,CORE,bare,all,clip,byCategory,group,groups,compatible,REST_LIMIT,restOffset,restMatches};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 // ---- browser ----
 const loaded=new Map();   // library -> Promise<{container, hipY, groups: Map(clip id -> AnimationGroup)}> or null when the file is not there
 function load(lib,scene){
  const key=lib,have=loaded.get(key);if(have&&have.scene===scene)return have.promise;
  const promise=(async()=>{try{
    const container=await root.VoidAssets.loadContainer({src:FILES[lib]},scene,null,'anim:'+lib);
    const groups=new Map();for(const g of container.animationGroups||[]){g.stop();groups.set(g.name,g);}
    const hips=(container.transformNodes||[]).find(t=>bare(t.name)==='Hips');
    const rest={};for(const t of container.transformNodes||[]){const b=bare(t.name);if(!rest[b]&&t.rotationQuaternion)rest[b]=t.rotationQuaternion.asArray();}
    return {container,groups,rest,hipY:hips?Math.abs(hips.position.y)||1:1,hipsRest:hips?hips.position.clone():null};
   }catch(e){console.info('[VOID//RUNNER] animation library "'+lib+'" is not on this machine (licensed motion capture is published with the live site only). Characters keep their own clips.');return null;}})();
  loaded.set(key,{scene,promise});return promise;}
 /* Give a figure the library's clips. node: the figure's root (its bones are transform nodes under it); look: its look id (for VoidCrowd.clips);
    only: clip ids wanted (default: all). Returns the ids added. Safe to call twice. */
 async function apply(node,look,{library='actorcore',only=null,scene=null}={}){
  const sc=scene||node.getScene(),B=root.BABYLON,L=await load(library,sc);if(!L||node.isDisposed())return [];
  const bones=new Map();for(const t of node.getDescendants(false))if(t.rotationQuaternion!==undefined&&t.getClassName?.()==='TransformNode'){const b=bare(t.name);if(!bones.has(b))bones.set(b,t);}
  if(!compatible([...bones.keys()]))return [];
  // the figure's own rest pose (its skeleton's bind-time local rotations; the bones themselves are already posed by a clip)
  const rest={};for(const m of node.getChildMeshes(false)){const sk=m.skeleton;if(!sk)continue;for(const b of sk.bones){const k=bare(b.name);if(rest[k])continue;const q=new B.Quaternion();b.getRestMatrix().decompose(undefined,q);rest[k]=q.asArray();}}
  if(Object.keys(rest).length&&!restMatches(L.rest,rest)){node.metadata=node.metadata||{};node.metadata.animLibraryRefused=Math.round(restOffset(L.rest,rest));return [];}   // degrees off, for the browser test
  const hips=bones.get('Hips'),scale=hips&&L.hipsRest?(hips.position.length()||1)/(L.hipsRest.length()||1):1,meta=node.metadata=node.metadata||{},list=meta.animationGroups=meta.animationGroups||[],added=[];
  for(const c of CLIPS[library]){if(only&&!only.includes(c.id))continue;const src=L.groups.get(c.id);if(!src)continue;const name=look+'-'+c.id;if(list.some(g=>g.name===name)){added.push(c.id);continue;}
   const g=new B.AnimationGroup(name,sc);
   for(const ta of src.targetedAnimations){const target=bones.get(bare(ta.target.name));if(!target)continue;let a=ta.animation;
    if(a.targetProperty==='position'){if(bare(ta.target.name)!=='Hips')continue;a=a.clone();const rest=L.hipsRest,own=hips.position.clone();
     // the hips' travel from the library's rest spot, scaled to this figure, added to this figure's own rest spot
     a.setKeys(a.getKeys().map(k=>({frame:k.frame,value:new B.Vector3(own.x+(k.value.x-rest.x)*scale,own.y+(k.value.y-rest.y)*scale,own.z+(k.value.z-rest.z)*scale)})));}
    g.addTargetedAnimation(a,target);}
   if(!g.targetedAnimations.length){g.dispose();continue;}
   g.normalize(src.from,src.to);g.enableBlending=true;g.blendingSpeed=.045;g.loopAnimation=c.loop!==false;list.push(g);added.push(c.id);}
  const clips=root.VoidCrowd?.clips;if(clips&&look){clips[look]=clips[look]||[];for(const id of added)if(!clips[look].includes(id))clips[look].push(id);}
  meta.animLibrary=[...(meta.animLibrary||[]),...added.filter(id=>!(meta.animLibrary||[]).includes(id))];
  return added;}
 root.VoidAnimLibrary={...pure,load,apply,has:(node,id)=>!!node?.metadata?.animLibrary?.includes(id)};
})(typeof globalThis!=='undefined'?globalThis:this);
