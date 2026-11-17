/* The person speaking to you looks at you (the owner, 17 Nov 2026: "if a mission giver is speaking their mission lines to the player engage head tracking on the
   mission giver NPC"). While a walking conversation is open, its speaker's head (and a little of the neck) turns toward the player's eyes, eased in and out,
   within about 70 degrees to either side and 30 up or down; past about 60 degrees the whole figure turns a little too (at most 25 degrees). Applied after the
   clip has posed the figure each frame and taken off again before the next frame's animation, so idle clips keep playing and nothing accumulates.
   Only figures the scene names as a character (metadata.character: Admin, Iris, the bartender, crowd and assembler figures); never a player avatar.
   The speaker is found by the line's `who` (case-insensitive), else the character nearest the interaction the player used (the bartender, for one). */
(function(root){
 const DEG=Math.PI/180,LIMITS={yaw:70*DEG,pitch:30*DEG,bodyAt:60*DEG,body:25*DEG};
 const CHAIN=[['Neck',.35],['Head',.65]];
 const wrap=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
 // The turn wanted, relative to where the body faces: head yaw / pitch clamped to a natural range, and how far the body itself turns (only past bodyAt).
 function aim(bodyYaw,head,target,l=LIMITS){const dx=target.x-head.x,dz=target.z-head.z,dy=target.y-head.y,off=wrap(Math.atan2(dx,dz)-bodyYaw),flat=Math.hypot(dx,dz)||1e-6;
  const body=Math.abs(off)>l.bodyAt?Math.sign(off)*Math.min(l.body,Math.abs(off)-l.bodyAt):0,rest=off-body;
  return {yaw:Math.max(-l.yaw,Math.min(l.yaw,rest)),pitch:Math.max(-l.pitch,Math.min(l.pitch,Math.atan2(dy,flat))),body,offset:off};}
 const ease=(from,to,rate,dt)=>from+(to-from)*Math.min(1,Math.max(0,dt*rate));
 const api={aim,ease,wrap,LIMITS,CHAIN};
 if(typeof module!=='undefined'){module.exports=api;return;}
 root.VoidNPCLook=api;
 let B=null,M=null,qT=null,ID=null;   // Babylon is loaded after the game scripts: taken when the first 3D scene appears
 let scene=null,before=null,after=null,current=null,lastWho=null,lastPlace=null,missed=null,last=performance.now();
 const isPlayer=n=>/^remote-player:|^player|avatar|walker/i.test(n?.name||'');
 // VR companions (vr-suite.js) have their own attention pass; a second head turn on top of it would fight it. Never theirs (17 Nov 2026).
 const isCompanion=n=>{for(let p=n;p;p=p.parent)if(p.metadata?.companion)return true;return false;};
 function figures(sc){const out=[];for(const n of [...sc.transformNodes,...sc.meshes])if(n.metadata?.character&&!n.isDisposed()&&n.isEnabled()&&!isPlayer(n)&&!isPlayer(n.parent)&&!isCompanion(n))out.push(n);return out;}
 function bonesOf(node){const found={};for(const t of node.getDescendants(false)){if(!t.rotationQuaternion&&!(t instanceof B.TransformNode))continue;for(const [b] of CHAIN)if(!found[b]&&new RegExp('(^|[:_ .|])'+b+'$').test(t.name))found[b]=t;}
  if(!found.Head)for(const m of node.getChildMeshes(false)){const sk=m.skeleton;if(!sk)continue;for(const [b] of CHAIN){const bone=!found[b]&&sk.bones.find(x=>new RegExp('(^|[:_ .|])'+b+'$').test(x.name)),tn=bone?.getTransformNode?.();if(tn)found[b]=tn;}if(found.Head)break;}
  for(const b of Object.keys(found))if(!found[b].rotationQuaternion)found[b].rotationQuaternion=B.Quaternion.FromEulerVector(found[b].rotation);
  return found.Head?found:null;}
 // The speaker's figure in the current scene.
 function speaker(sc,who){const id=String(who||'').toLowerCase(),all=figures(sc);if(!id)return null;
  let node=all.find(n=>String(n.metadata.character).toLowerCase()===id);
  if(!node&&lastPlace){let best=3;for(const n of all){const p=n.getAbsolutePosition(),d=Math.hypot(p.x-lastPlace.x,p.z-lastPlace.z);if(d<best){best=d;node=n;}}}
  // The figure with a model of its own sits under the holder: climb to the outermost named node, and use the nearest one that has a head.
  while(node&&node.parent?.metadata?.character===node.metadata.character)node=node.parent;return node;}
 function bodyYawOf(node){const f=B.Vector3.TransformNormal(new B.Vector3(0,0,1),node.getWorldMatrix());return Math.atan2(f.x,f.z);}
 const refresh=b=>{const chain=[];for(let n=b;n;n=n.parent)chain.unshift(n);for(const n of chain)n.computeWorldMatrix(true);};
 function start(node){const bones=bonesOf(node);if(!bones)return null;return {node,bones,weight:0,yaw:0,pitch:0,body:0,axis:null,applied:new Map(),bodySet:null};}
 function undo(){if(!current)return;for(const [b,q] of current.applied){q.conjugateToRef(qT);qT.multiplyToRef(b.rotationQuaternion,qT);b.rotationQuaternion.copyFrom(qT);}current.applied.clear();
  const n=current.node;if(current.bodySet&&!n.rotationQuaternion&&Math.abs(n.rotation.y-current.bodySet.to)<1e-6)n.rotation.y=current.bodySet.from;current.bodySet=null;}
 function apply(dt){
  const who=wanted(),cam=scene.activeCamera;
  if(!who)missed=null;
  if(who&&who!==missed&&(!current||current.who!==who)){const node=speaker(scene,who);if(!node)missed=who;   // nobody to turn (a voice without a figure here): not searched again every frame
  if(node&&node!==current?.node){if(current&&current.weight>.02){current.release=true;}else{current=start(node);if(current)current.who=who;}}else if(current&&node===current.node){current.who=who;current.release=false;}}
  if(!current||!cam)return;
  if(current.node.isDisposed()||current.bones.Head.isDisposed?.()){current=null;missed=null;return;}   // the figure was replaced (a model arriving late): found again next frame
  const c=current,active=!!who&&!c.release&&c.who===who;
  const head=c.bones.Head;refresh(head);const hp=head.getAbsolutePosition(),bodyYaw=bodyYawOf(c.node),eye=cam.globalPosition;
  const a=aim(bodyYaw,hp,eye);c.weight=ease(c.weight,active?1:0,active?3.5:2.5,dt);c.yaw=ease(c.yaw,active?a.yaw:0,6,dt);c.pitch=ease(c.pitch,active?a.pitch:0,6,dt);c.body=ease(c.body,active?a.body:0,2.5,dt);
  if(!active&&c.weight<.01){current=null;return;}
  // The figure turns a little toward you when you are well round to one side.
  if(!c.node.rotationQuaternion&&Math.abs(c.body)>1e-4){const from=c.node.rotation.y,to=from+c.body*c.weight;c.node.rotation.y=to;c.bodySet={from,to};c.node.computeWorldMatrix(true);}
  const yawNow=bodyYawOf(c.node);
  // The head's own forward axis: of its six local axes, the one that points most nearly where the body faces (found once, in the clip's pose).
  // A Mixamo rig (Admin, the crowd and assembler figures) faces along the head bone's own +Z. Measuring it from the pose picked an ear when the idle clip had the head turned.
  if(!c.axis&&/mixamorig/i.test(head.name))c.axis=new B.Vector3(0,0,1);
  if(!c.axis){refresh(head);const m=head.getWorldMatrix(),f=new B.Vector3(Math.sin(yawNow),0,Math.cos(yawNow));let best=-2;for(const v of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const ax=new B.Vector3(...v),w=B.Vector3.TransformNormal(ax,m).normalize(),d=B.Vector3.Dot(w,f);if(d>best){best=d;c.axis=ax;}}}
  const forward=()=>{refresh(head);return B.Vector3.TransformNormal(c.axis,head.getWorldMatrix()).normalize();};
  const yw=yawNow+c.yaw,want=new B.Vector3(Math.sin(yw)*Math.cos(c.pitch),Math.sin(c.pitch),Math.cos(yw)*Math.cos(c.pitch)).normalize();
  // Each bone takes its share of the remaining turn, in its parent's own space (a mirrored glTF root would flip a world-space rotation).
  let done=0,acc=0;
  for(const [name,share] of CHAIN){const b=c.bones[name];acc+=share;if(!b?.rotationQuaternion||!b.parent)continue;const goal=acc*c.weight,frac=done>=1?0:Math.max(0,Math.min(1,(goal-done)/(1-done)));done=goal;if(!frac)continue;
   const now=forward();refresh(b);b.parent.getWorldMatrix().invertToRef(M);const fp=B.Vector3.TransformNormal(now,M).normalize(),wp=B.Vector3.TransformNormal(want,M).normalize(),Q=new B.Quaternion();
   B.Quaternion.FromUnitVectorsToRef(fp,wp,Q);const d=B.Quaternion.Slerp(ID,Q,frac);d.multiplyToRef(b.rotationQuaternion,qT);b.rotationQuaternion.copyFrom(qT);b.computeWorldMatrix(true);
   const prev=c.applied.get(b);c.applied.set(b,prev?d.multiply(prev):d);}
  // how far the face points from the player's eyes after the turn, in degrees (read by the browser test; 0 when looking straight at you)
  const f2=forward(),to=eye.subtract(head.getAbsolutePosition()).normalize();
  c.debug={axis:c.axis.asArray(),yaw:c.yaw,pitch:c.pitch,weight:c.weight,body:c.body,offset:a.offset,miss:Math.acos(Math.max(-1,Math.min(1,B.Vector3.Dot(f2,to))))/DEG};
 }
 // Who should be looking: the current line's speaker in a walking conversation (and while its choice is on screen).
 function wanted(){try{const open=typeof walkingLocation!=='undefined'&&walkingLocation&&typeof walker!=='undefined'&&walker;if(!open)return null;
  if(typeof speech!=='undefined'&&speech?.lines?.[speech.index]){lastWho=speech.lines[speech.index].who;return lastWho;}
  return root.VoidConversationUI?.isOpen?lastWho:null;}catch{return null;}}
 function attach(sc){if(scene===sc)return;try{if(scene&&!scene.isDisposed){scene.onBeforeAnimationsObservable.remove(before);scene.onAfterAnimationsObservable.remove(after);}}catch{}
  scene=sc;current=null;missed=null;if(!sc)return;
  before=sc.onBeforeAnimationsObservable.add(()=>{try{undo();}catch(e){current=null;}});
  after=sc.onAfterAnimationsObservable.add(()=>{const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;try{apply(dt);}catch(e){console.warn('[VOID npc look]',e);current=null;}});}
 // The interaction the player used last: finds a speaker whose line name is not its figure's id (Bartender).
 if(typeof talk==='function'){const prior=talk;talk=function(...args){try{const t=typeof walkTarget!=='undefined'&&walkTarget;lastPlace=t?{x:t.position[0],z:t.position[2]}:null;}catch{lastPlace=null;}return prior.apply(this,args);};}
 if(typeof update==='function'){const prior=update;update=function(...args){const r=prior(...args);try{const sc=root.VoidBabylon?.scene||null;if(sc&&!B&&root.BABYLON){B=root.BABYLON;M=new B.Matrix();qT=new B.Quaternion();ID=B.Quaternion.Identity();}if(sc!==scene&&B)attach(sc&&!sc.isDisposed?sc:null);}catch{}return r;};}
 Object.defineProperty(api,'current',{get(){return current?{who:current.who,character:current.node.metadata?.character,...current.debug}:null;}});
})(globalThis);
