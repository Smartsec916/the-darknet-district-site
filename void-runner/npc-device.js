/* People using their V1 (the owner, 18 Nov 2026: "Lets also make the graphic of people using their V1, looking at it, using it to take pictures (usually at places like
   food stalls of their food, selfies at the club, of them with a friend, etc. If i add fighting in the city or if i add npcs arguing in the streets they'll all want a
   picture of it, with the exception of the monks, or tier 3 npcs"). And: "Remember it's a hologram that is put up in front of their face. You can't see other people's
   details, what they're looking at on it. It matches their device's UI color."
   WHAT IT LOOKS LIKE. No handheld object: a small translucent HOLOGRAM floats about 33 cm in front of the user's eyes, a little below eye level, facing them and following
   their head. From outside it is unreadable: soft blurred blocks and scanlines in their device's UI colour (V1 teal #61eee9 as the V1 screen's rail; V2 a placeholder
   blue until the V2 has a look; V3 // SHADOW the Shadow's monochrome green, so dim it is nearly invisible). The hand only gestures: raised beside the panel, a swipe now and
   then. A PHOTO is a small hologram FRAME at the outstretched hand, framing the subject, with a brief faint flash on capture; a SELFIE holds the frame out and turned back to
   the face; a PAIR SELFIE has a friend lean in; FILMING holds the frame up and keeps it on the action; a FOOD PHOTO angles it down at the counter. The V3 // Shadow's camera
   is in its owner's eye (device-v1.js): no frame, a fingertip to the temple and the faintest glint.
   HOW. Procedural bone overrides on the existing Mixamo-named rigs (crowd figures, the character assembler's kits, the Meshy residents): a two-bone reach for the right
   arm, the neck and head turned toward the panel or the subject, eased in and out; applied after the clip each frame and put back after the frame is drawn, so clips keep
   playing underneath (the same approach as npc-look.js). Panels, frames and flashes are instances of one mesh and one material per tier.
   WHO. Ambient people only: the street walkers and standers (ncz-nightlife.js), the alley, NULL's dancers, bar guests and door, the District's residents; Admin and Iris
   (and Dax) now and then idle-check theirs, never while a conversation is open, and Juno Vex's own "device" beat uses this panel. Never companions, players or dialogue
   speakers. Only people near and in view are posed, at most CAPS[quality] at once.
   SPECTACLE. VoidCrowdReact.spectacle({x,z,radius,kind,duration}): people within the radius stop, turn and (most of them) film it; some step closer, some back. Monks
   (metadata.monk) and V3 // Shadow carriers ignore it or walk away. Ends `duration` seconds later plus a few seconds of lingering. Developer Tools > Test & Jump To >
   STAGE A STREET ARGUMENT HERE puts two people arguing in front of the player and fires it.
   The rules (tiers, scheduler, caps, spectacle) are pure and run in Node (tests/npc-device.test.cjs); the drawing runs in the browser. */
(function(root){
 'use strict';
 // Device tiers: share of people carrying each (when their data gives none), the hologram colour (the device's UI colour) and its strength.
 const TIERS={
  v1:{share:.72,color:'#61eee9',alpha:.36,name:'V1'},                 // device-v1.css --pd-edge-hi (the V1's rail)
  v2:{share:.23,color:'#8fb8ff',alpha:.32,name:'V2',placeholder:true}, // the V2 has no interface yet: a placeholder colour until it does
  v3:{share:.05,color:'#46ff7a',alpha:.06,name:'V3 // SHADOW',eye:true}}; // device-v1.css [data-device=v3]; camera in the eye
 const CAPS={low:4,medium:10,high:16,ultra:16};
 const capFor=q=>CAPS[q]??CAPS.medium;
 // What each kind of person does with it. Poses: scroll (reading), photo, selfie, pair-selfie, film, food-photo.
 const KINDS={
  walker:{group:'street',moving:[['scroll',1]],still:[['scroll',.6],['photo',.4]],pair:.35},
  stander:{group:'street',still:[['scroll',.55],['photo',.2],['selfie',.25]],pair:.4},
  shop:{group:'street',still:[['photo',.5],['scroll',.5]]},
  seated:{group:'street',still:[['scroll',1]]},
  food:{group:'food',still:[['food-photo',.55],['scroll',.45]],pair:.3},
  dancer:{group:'club',still:[['selfie',.6],['film',.4]],pair:.4},
  bar:{group:'club',still:[['selfie',.35],['scroll',.35],['food-photo',.3]],pair:.45},
  story:{group:'story',still:[['scroll',1]]}};
 // Share of a group's people using a device at one time [at least, at most], and how long one look lasts (seconds).
 const GROUPS={street:{share:[.1,.2],dur:[5,15]},food:{share:[.15,.3],dur:[5,12]},club:{share:[.15,.3],dur:[4,10]},story:{share:[0,.5],dur:[6,10],cool:[60,140]}};
 const STILL=new Set(['photo','selfie','pair-selfie','film','food-photo']);   // poses that need the person to stop
 const PHOTO=new Set(['photo','selfie','pair-selfie','food-photo']);
 const config={near:22,flashShare:.5,spectacle:{radius:12,duration:12,film:.78,closer:.25,back:.2,linger:[2,5],delay:[.2,1.5]}};
 // A well mixed hash of a string (seeds such as 'night-12' differ by one character).
 function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;h=Math.imul(h,3266489909);h^=h>>>16;return h>>>0;}
 // The tier a person carries: their data's (district-people.js `device`) or one from the seed.
 function tierFor(seed,explicit){if(explicit&&TIERS[explicit])return explicit;const r=(hash(seed)%100000)/100000;return r<TIERS.v1.share?'v1':r<TIERS.v1.share+TIERS.v2.share?'v2':'v3';}
 const pickW=(list,r)=>{const t=list.reduce((s,[,w])=>s+w,0);let x=r*t;for(const [p,w] of list){x-=w;if(x<=0)return p;}return list[list.length-1][0];};
 // The pose a person takes: by kind and whether they are moving. V3 // Shadow carriers read and take photos with the eye, never selfies or filming.
 function poseFor(a,r){const k=KINDS[a.kind];if(!k)return null;const list=(a.moving?k.moving:k.still)||k.still||[];let p=pickW(list,r);if(a.tier==='v3'&&p!=='scroll')p=r<.5?'scroll':'photo';return p;}
 const coolFor=(g,rnd)=>{const G=GROUPS[g];if(G.cool)return G.cool[0]+rnd()*(G.cool[1]-G.cool[0]);const s=(G.share[0]+G.share[1])/2,dur=(G.dur[0]+G.dur[1])/2;return dur*(1-s)/s*(.6+.8*rnd());};
 /* createScheduler({rnd}) -> {step(dt, agents) -> [{id, start:session}|{id, end:true}], session(id), state}.
    agents: [{id, kind, tier, can (may use it now), moving, pair (partner id)}]. Keeps each group between its share band: at most ceil-free floor(hi*n) users,
    and tops up to floor(lo*n) from whoever is closest to their next look. */
 function createScheduler({rnd=Math.random,groups=GROUPS}={}){
  const st=new Map();
  function start(a,pose,role,partner,out){const G=groups[KINDS[a.kind].group],dur=G.dur[0]+rnd()*(G.dur[1]-G.dur[0]),s={pose,role,partner,t:0,dur,flash:[]};
   if(PHOTO.has(pose)&&role!=='friend'&&rnd()<config.flashShare)s.flash.push(dur*(.4+.3*rnd()));st.get(a.id).session=s;out.push({id:a.id,start:s});return s;}
  function stop(a,out){const s=st.get(a.id);if(!s?.session)return;s.session=null;s.cool=coolFor(KINDS[a.kind].group,rnd);out.push({id:a.id,end:true});}
  function step(dt,agents){
   const out=[],by=new Map(agents.map(a=>[a.id,a])),count=new Map();
   for(const a of agents){if(!KINDS[a.kind])continue;let s=st.get(a.id);if(!s){s={cool:coolFor(KINDS[a.kind].group,rnd)*rnd(),session:null};st.set(a.id,s);}
    if(s.session){const x=s.session;x.t+=dt;const p=x.partner&&by.get(x.partner);
     if(!a.can||x.t>=x.dur||(STILL.has(x.pose)&&a.moving)||(x.partner&&(!p||!p.can||!st.get(p.id)?.session)))stop(a,out);}
    else s.cool-=dt;}
   for(const a of agents){if(!KINDS[a.kind]||!a.can)continue;const g=KINDS[a.kind].group,c=count.get(g)||{n:0,on:0,wait:[]};c.n++;if(st.get(a.id).session)c.on++;else c.wait.push(a);count.set(g,c);}
   for(const [g,c] of count){const G=groups[g],hi=Math.max(G.share[1]>0?1:0,Math.floor(G.share[1]*c.n+1e-9)),lo=Math.floor(G.share[0]*c.n+1e-9);
    c.wait.sort((x,y)=>st.get(x.id).cool-st.get(y.id).cool);
    for(const a of c.wait){if(c.on>=hi)break;const s=st.get(a.id);if(s.session||(s.cool>0&&c.on>=lo))continue;
     const k=KINDS[a.kind],p=a.pair&&by.get(a.pair),ps=p&&st.get(p.id);
     if(p&&p.can&&!a.moving&&!p.moving&&ps&&!ps.session&&k.pair&&a.tier!=='v3'&&c.on+2<=Math.max(hi,2)&&rnd()<k.pair){start(a,'pair-selfie','holder',p.id,out);start(p,'pair-selfie','friend',a.id,out).dur=s.session.dur;c.on+=2;continue;}
     start(a,poseFor(a,rnd()),'solo',null,out);c.on++;}}
   return out;}
  return {step,session:id=>st.get(id)?.session||null,state:st,forget:id=>st.delete(id)};
 }
 /* The people who are drawn using it: those in a session, near and in view, nearest first, at most `cap`. Someone already shown keeps their place over a newcomer
    a little nearer (no flicker at the edge). list: [{id, d, visible, shown}] */
 function choosePosed(list,cap){return new Set(list.filter(a=>a.visible).sort((a,b)=>(a.shown?a.d*.8:a.d)-(b.shown?b.d*.8:b.d)).slice(0,Math.max(0,cap)).map(a=>a.id));}
 // Who never joins a crowd filming a spectacle.
 const excluded=a=>!!(a.monk||a.tier==='v3');
 /* createReactor() -> {spectacle(ev, agents, now), reactionOf(id, now), step(now), active}. ev: {x, z, radius, kind, duration}. agents: [{id, x, z, tier, monk}].
    Each person within the radius gets {mode:'film'|'watch'|'ignore'|'leave', step:+1 closer|-1 back|0, from (start time), until (end time)}. */
 function createReactor({rnd=Math.random,cfg=config.spectacle}={}){
  const events=[];let serial=0;
  function spectacle(ev,agents,now){const e={id:++serial,x:+ev.x||0,z:+ev.z||0,radius:ev.radius??cfg.radius,kind:ev.kind||'spectacle',t0:now,end:now+(ev.duration??cfg.duration),who:new Map(),y:ev.y??1.25};
   for(const a of agents){const d=Math.hypot(a.x-e.x,a.z-e.z);if(d>e.radius||(ev.skip&&ev.skip.has(a.id)))continue;
    const ex=excluded(a),mode=ex?(a.monk?'ignore':(rnd()<.5?'leave':'ignore')):(rnd()<cfg.film?'film':'watch');
    const r=rnd(),step=ex?0:r<cfg.closer?1:r<cfg.closer+cfg.back?-1:0;
    e.who.set(a.id,{id:a.id,event:e.id,mode,step,d,x:e.x,z:e.z,y:e.y,from:now+cfg.delay[0]+rnd()*(cfg.delay[1]-cfg.delay[0]),until:e.end+cfg.linger[0]+rnd()*(cfg.linger[1]-cfg.linger[0])});}
   events.push(e);return e;}
  function reactionOf(id,now){let best=null;for(const e of events){const r=e.who.get(id);if(r&&now>=r.from&&now<r.until&&(!best||r.from>best.from))best=r;}return best;}
  function step(now){for(let i=events.length-1;i>=0;i--){let live=false;for(const r of events[i].who.values())if(now<r.until)live=true;if(!live&&now>=events[i].end)events.splice(i,1);}}
  function end(id,now){const e=events.find(x=>x.id===id);if(e){e.end=Math.min(e.end,now);for(const r of e.who.values())r.until=Math.min(r.until,now+cfg.linger[0]);}}
  return {spectacle,reactionOf,step,end,get active(){return events.slice();}};
 }
 // Kind of a person from the marks their makers leave (metadata), or null for people this never touches.
 const STORY=new Set(['admin','iris','dax']);
 function kindOf(m){if(!m||m.argument||m.companion||m.life)return null;
  if(m.npcDevice?.kind)return m.npcDevice.kind;
  if(typeof m.alley==='string')return /sitter/.test(m.alley)?'seated':/drunk/.test(m.alley)?null:'stander';
  if(typeof m.club==='string')return /^dancer/.test(m.club)?'dancer':/^bar-guest/.test(m.club)?'bar':m.club==='door'?'stander':null;
  if(typeof m.nightlife==='string')return /^stand/.test(m.nightlife)?'stander':'walker';
  const c=String(m.character||'');if(STORY.has(c))return 'story';
  if(/^crew-bar\d/.test(c))return 'food';if(/^crew-(vr|bartender)|^crew-pressure/.test(c))return null;if(/^crew-/.test(c)&&m.ambient)return /sit/.test(c)?'seated':'stander';
  return null;}
 // Fixed pairs among the places' own people (who takes a selfie with whom).
 const PAIRS={'crew-hall-talk1':'crew-hall-talk2','crew-hall-talk2':'crew-hall-talk1','bar-guest-a':'bar-guest-b','bar-guest-b':'bar-guest-a','dancer-0':'dancer-1','dancer-1':'dancer-0','dancer-2':'dancer-3','dancer-3':'dancer-2','crew-bar1':'crew-bar2','crew-bar2':'crew-bar1'};
 const pure={TIERS,CAPS,capFor,KINDS,GROUPS,STILL,PHOTO,config,hash,tierFor,poseFor,createScheduler,choosePosed,excluded,createReactor,kindOf,PAIRS};
 if(typeof module==='object'&&module.exports){module.exports=pure;return;}

 /* ---------------- browser ---------------- */
 let B=null,M=null,qT=null,ID=null,V=null;
 let scene=null,obs=[],kit=null,clock=0,last=performance.now();
 const sched=createScheduler(),reactor=createReactor();
 const agents=new Map();   // controller -> agent
 const tagged=new WeakMap();   // node -> extra {monk, tier, kind, pair}
 const stats={agents:0,using:0,posed:0,cap:0,poses:{},tiers:{},flashes:0,ms:0};
 const quality=()=>root.VoidBabylon?.quality||'medium';
 const metaOf=n=>{const out={};for(let p=n;p;p=p.parent)if(p.metadata)for(const k in p.metadata)if(!(k in out))out[k]=p.metadata[k];return out;};
 const isCompanion=n=>{for(let p=n;p;p=p.parent)if(p.metadata?.companion||/^remote-player:|^player|avatar/i.test(p.name||''))return true;return false;};
 const talking=()=>{try{return !!root.VoidConversationUI?.isOpen||(typeof speech!=='undefined'&&!!speech?.lines?.length&&typeof walkingLocation!=='undefined'&&!!walkingLocation);}catch{return false;}};
 // The hologram's textures: blurred blocks and scanlines, never anything readable. Black is see-through (the material adds light).
 function hologramTexture(name,hex,kind){const T=new B.DynamicTexture('npc-holo-'+name,{width:128,height:96},scene,true);const g=T.getContext();g.clearRect(0,0,128,96);g.fillStyle='#000';g.fillRect(0,0,128,96);
  const c=B.Color3.FromHexString(hex),rgb=(a)=>'rgba('+Math.round(c.r*255)+','+Math.round(c.g*255)+','+Math.round(c.b*255)+','+a+')';
  if(kind==='panel'){g.fillStyle=rgb(.16);g.fillRect(3,3,122,90);g.filter='blur(3px)';let s=hash(name);const R=()=>((s=Math.imul(s^s>>>15,2246822507)>>>0)%1000)/1000;
   for(let i=0;i<9;i++){g.fillStyle=rgb(.25+R()*.45);g.fillRect(10+R()*20,8+i*9.5,30+R()*70,4+R()*3);}g.fillStyle=rgb(.5);g.fillRect(96,12,20,20);g.filter='none';
   g.strokeStyle=rgb(.75);g.lineWidth=1.5;g.strokeRect(2,2,124,92);}
  else{g.strokeStyle=rgb(.9);g.lineWidth=3;const L=18;for(const [x,y,dx,dy] of [[3,3,1,1],[125,3,-1,1],[3,93,1,-1],[125,93,-1,-1]]){g.beginPath();g.moveTo(x,y+dy*L);g.lineTo(x,y);g.lineTo(x+dx*L,y);g.stroke();}
   g.fillStyle=rgb(.08);g.fillRect(6,6,116,84);g.filter='blur(1px)';g.strokeStyle=rgb(.35);g.lineWidth=1;g.strokeRect(54,38,20,20);g.filter='none';}
  g.fillStyle='rgba(0,0,0,.45)';for(let y=0;y<96;y+=3)g.fillRect(0,y,128,1);   // scanlines
  T.update();T.hasAlpha=false;return T;}
 function buildKit(){const own=[],src={};const flashMat=new B.StandardMaterial('npc-holo-flash',scene);flashMat.disableLighting=true;flashMat.diffuseColor=B.Color3.Black();flashMat.emissiveColor=new B.Color3(1,1,1);flashMat.alpha=.55;flashMat.alphaMode=B.Engine.ALPHA_ADD;flashMat.backFaceCulling=false;own.push(flashMat);
  const flash=B.MeshBuilder.CreateDisc('npc-holo-flash',{radius:.5,tessellation:12},scene);flash.material=flashMat;flash.billboardMode=B.TransformNode.BILLBOARDMODE_ALL;flash.isPickable=false;flash.position.y=-500;flash.scaling.setAll(.001);own.push(flash);
  for(const [tier,T] of Object.entries(TIERS)){src[tier]={};for(const kind of ['panel','frame']){const tex=hologramTexture(tier+'-'+kind,T.color,kind),m=new B.StandardMaterial('npc-holo-'+tier+'-'+kind,scene);
    m.disableLighting=true;m.diffuseColor=B.Color3.Black();m.emissiveTexture=tex;m.alpha=T.alpha;m.alphaMode=B.Engine.ALPHA_ADD;m.backFaceCulling=false;m.fogEnabled=true;own.push(tex,m);
    const w=kind==='panel'?.2:.15,mesh=B.MeshBuilder.CreatePlane('npc-holo-'+tier+'-'+kind,{width:w,height:w*.72},scene);mesh.material=m;mesh.isPickable=false;mesh.position.y=-500;mesh.alwaysSelectAsActiveMesh=false;own.push(mesh);
    src[tier][kind]={mesh,mat:m,tex,pool:[]};}}
  scene.onDisposeObservable.addOnce(()=>{for(const o of own)try{o.dispose();}catch{}});
  return {src,flash,flashMat,flashes:[]};}
 function take(tier,kind){const s=kit.src[tier][kind];const m=s.pool.pop()||s.mesh.createInstance('npc-holo-'+tier+'-'+kind+'-i');m.setEnabled(true);m.isPickable=false;return m;}
 function give(tier,kind,m){if(!m)return;m.setEnabled(false);kit.src[tier][kind].pool.push(m);}
 function spark(at,size,dim){const f=kit.flash.createInstance('npc-holo-flash-i');f.position.copyFrom(at);f.scaling.setAll(.001);kit.flashes.push({f,t:0,size,dim});stats.flashes++;}
 // ---- bones ----
 const BONES=['Hips','Spine2','Neck','Head','RightShoulder','RightArm','RightForeArm','RightHand','RightHandMiddle1','LeftArm','LeftForeArm','LeftHand'];
 function bonesOf(node){const found={};for(const t of node.getDescendants(false)){if(!t.rotationQuaternion&&!(t instanceof B.TransformNode))continue;for(const b of BONES)if(!found[b]&&(t.name.endsWith('mixamorig:'+b)||new RegExp('(^|[:_ .|])'+b+'$').test(t.name)))found[b]=t;}
  if(!found.Head)for(const m of node.getChildMeshes(false)){const sk=m.skeleton;if(!sk)continue;for(const b of BONES){const bone=!found[b]&&sk.bones.find(x=>new RegExp('(^|[:_ .|])'+b+'$').test(x.name)),tn=bone?.getTransformNode?.();if(tn)found[b]=tn;}if(found.Head)break;}
  for(const b of Object.keys(found))if(!found[b].rotationQuaternion)found[b].rotationQuaternion=B.Quaternion.FromEulerVector(found[b].rotation);
  return found.Head&&found.RightArm&&found.RightForeArm&&found.RightHand&&found.Neck?found:null;}
 const refresh=b=>{const chain=[];for(let n=b;n;n=n.parent)chain.unshift(n);for(const n of chain)n.computeWorldMatrix(true);};
 let saved=new Map();   // bone -> its clip rotation, put back after the frame is drawn
 function keep(b){if(!saved.has(b))saved.set(b,b.rotationQuaternion.clone());}
 // Turn bone b so that the world direction `cur` (from the bone) points along `want`, by fraction w; in the parent's own space (a mirrored glTF root would flip a world rotation).
 function aimDir(b,cur,want,w){if(!b?.parent||w<=0)return;keep(b);b.parent.getWorldMatrix().invertToRef(M);const f=B.Vector3.TransformNormal(cur,M),g=B.Vector3.TransformNormal(want,M);if(f.lengthSquared()<1e-10||g.lengthSquared()<1e-10)return;f.normalize();g.normalize();
  const Q=new B.Quaternion();B.Quaternion.FromUnitVectorsToRef(f,g,Q);const d=B.Quaternion.Slerp(ID,Q,Math.min(1,w));d.multiplyToRef(b.rotationQuaternion,qT);b.rotationQuaternion.copyFrom(qT);b.computeWorldMatrix(true);}
 const P=b=>b.getAbsolutePosition().clone();
 // Two-bone reach: the right wrist toward T (world), the elbow bending toward `pole` (a world direction), by weight w.
 function reach(fig,T,pole,w){const {RightArm:a,RightForeArm:f,RightHand:h}=fig.bones;refresh(h);const S=P(a),E=P(f),W=P(h),L1=B.Vector3.Distance(S,E),L2=B.Vector3.Distance(E,W);
  let to=T.subtract(S),d=to.length();if(d<1e-4)return;const u=to.scale(1/d);d=Math.max(Math.abs(L1-L2)+.01,Math.min((L1+L2)*.985,d));
  const x=(L1*L1-L2*L2+d*d)/(2*d),hh=Math.sqrt(Math.max(0,L1*L1-x*x));let v=pole.subtract(u.scale(B.Vector3.Dot(pole,u)));if(v.lengthSquared()<1e-6)v=new B.Vector3(0,-1,0);v.normalize();
  const E2=S.add(u.scale(x)).add(v.scale(hh)),T2=S.add(u.scale(d));aimDir(a,E.subtract(S),E2.subtract(S),w);refresh(h);const E3=P(f),W3=P(h);aimDir(f,W3.subtract(E3),T2.subtract(E3),w);
  // the wrist straight (fingers on from the forearm), tipped up a little: an open, light hand
  if(fig.bones.RightHandMiddle1){refresh(fig.bones.RightHandMiddle1);const Wn=P(h),Fn=P(fig.bones.RightHandMiddle1),fore=Wn.subtract(P(f)).normalize();aimDir(h,Fn.subtract(Wn),fore.add(new B.Vector3(0,.35,0)),w*.8);}}
 // Neck and head toward a world point (35% / 65%), within natural limits.
 function lookAt(fig,target,w,body){const h=fig.bones.Head;refresh(h);const hp=P(h);let dir=target.subtract(hp);const flat=Math.hypot(dir.x,dir.z)||1e-6;let pitch=Math.atan2(dir.y,flat),yaw=Math.atan2(dir.x,dir.z)-body.yaw;yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));
  pitch=Math.max(-.75,Math.min(.5,pitch));yaw=Math.max(-1.1,Math.min(1.1,yaw));const yw=body.yaw+yaw;dir=new B.Vector3(Math.sin(yw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yw)*Math.cos(pitch));
  let done=0,acc=0;for(const [name,share] of [['Neck',.35],['Head',.65]]){const b=fig.bones[name];acc+=share;const goal=acc*w,frac=done>=1?0:Math.max(0,Math.min(1,(goal-done)/(1-done)));done=goal;if(!frac)continue;
   refresh(h);const fwd=B.Vector3.TransformNormal(B.Axis.Z,h.getWorldMatrix()).normalize();aimDir(b,fwd,dir,frac);}}
 // Lean the chest toward a point (a friend leaning into a selfie).
 function lean(fig,toward,w){const s=fig.bones.Spine2;if(!s)return;refresh(s);const up=B.Vector3.TransformNormal(B.Axis.Y,s.getWorldMatrix()).normalize(),side=toward.subtract(P(s));side.y=0;if(side.lengthSquared()<1e-6)return;side.normalize();aimDir(s,up,up.add(side.scale(.22)),w);}
 function bodyFrame(node){const m=node.getWorldMatrix(),f=B.Vector3.TransformNormal(B.Axis.Z,m);f.y=0;f.normalize();return {fwd:f,yaw:Math.atan2(f.x,f.z)};}
 // ---- people ----
 function agentFor(f){let a=agents.get(f);if(a!==undefined)return a;const node=f.node;if(!node||isCompanion(node)){agents.set(f,null);return null;}
  const m=metaOf(node),extra=tagged.get(node)||m.npcDevice||{},kind=extra.kind||kindOf(m);if(!kind){agents.set(f,null);return null;}
  const key=String(m.nightlife||m.club||m.alley||m.character||node.name),person=root.VoidDistrictPeople?.npcs?.()?.find?.(n=>n.crew===m.character||n.id===m.character);
  a={id:key+'#'+f.node.uniqueId,key,f,node,kind,tier:tierFor(key,extra.tier||person?.device),monk:!!(extra.monk||m.monk),pairKey:extra.pair||PAIRS[key]||null,fig:undefined,last:null,speed:0,w:0,pose:null,holo:null,frame:null,swipe:Math.random()*9,yaw:null,off:0,extra};
  agents.set(f,a);return a;}
 function figOf(a){if(a.fig===undefined)a.fig=bonesOf(a.node)?{bones:bonesOf(a.node)}:null;return a.fig;}
 function listAgents(){const out=[];for(const f of root.VoidCrowd?.figures?.()||[]){const a=agentFor(f);if(a&&!a.node.isDisposed())out.push(a);}for(const [f,a] of agents)if(a&&(a.node.isDisposed()||!root.VoidCrowd.figures().has(f))){drop(a);agents.delete(f);sched.forget(a.id);}return out;}
 function drop(a){if(a.holo){give(a.holoTier,'panel',a.holo);a.holo=null;}if(a.frame){give(a.holoTier,'frame',a.frame);a.frame=null;}}
 const byKey=new Map();
 // ---- spectacle ----
 function spectacle(ev={}){const list=listAgents().filter(a=>a.kind!=='story'&&a.node.isEnabled()).map(a=>{const p=a.node.getAbsolutePosition();return {id:a.id,x:p.x,z:p.z,tier:a.tier,monk:a.monk};});
  const e=reactor.spectacle({...ev,skip:new Set(ev.skip||[])},list,clock);return {id:e.id,kind:e.kind,x:e.x,z:e.z,radius:e.radius,end:()=>reactor.end(e.id,clock),reactions:[...e.who.values()].map(r=>({id:r.id,mode:r.mode,step:r.step}))};}
 const reactionOf=node=>{for(const a of agents.values())if(a&&a.node===node)return reactor.reactionOf(a.id,clock);return null;};
 const sessionOf=node=>{for(const a of agents.values())if(a&&a.node===node)return sched.session(a.id);return null;};
 // A walker the owner's script should keep still (a photo, a selfie, filming, watching).
 function holds(node){const r=reactionOf(node);if(r&&(r.mode==='film'||r.mode==='watch'))return true;const s=sessionOf(node);return !!s&&STILL.has(s.pose);}
 // Walking pace while reading: slower.
 function pace(node){const s=sessionOf(node);return s&&s.pose==='scroll'?.62:1;}
 // ---- each frame ----
 let xform=[];   // [node, position, rotationY] to put back after the frame
 function before(dt){const t0=performance.now();clock+=dt;reactor.step(clock);
  const cam=scene.activeCamera;if(!cam)return;if(!kit)kit=buildKit();
  const list=listAgents(),eye=cam.globalPosition,planes=B.Frustum.GetPlanes(cam.getTransformationMatrix()),zf=root.VoidZoom?root.VoidZoom.now():1,chat=talking(),lookBusy=root.VoidNPCLook?.current?.character;
  byKey.clear();for(const a of list)byKey.set(a.key,a);
  const input=[];
  for(const a of list){const p=a.node.getAbsolutePosition();if(a.last){a.speed=a.speed*.8+.2*Math.hypot(p.x-a.last.x,p.z-a.last.z)/Math.max(dt,1e-3);}a.last={x:p.x,z:p.z};a.d=Math.hypot(p.x-eye.x,p.z-eye.z)*zf;
   const ext=a.extra.state?.()||{},react=reactor.reactionOf(a.id,clock);a.react=react;
   const moving=ext.moving??a.speed>.25,forced=a.extra.force?.();a.forced=forced||null;
   const can=!forced&&!react&&a.node.isEnabled()&&!(a.kind==='story'&&(chat||lookBusy===String(metaOf(a.node).character)||moving))&&ext.can!==false;
   a.moving=moving;input.push({id:a.id,kind:a.kind,tier:a.tier,can,moving,pair:a.pairKey&&byKey.get(a.pairKey)?.id});
   let vis=a.node.isEnabled()&&!a.f.culled&&a.f.active!==false&&a.d<config.near;if(vis)for(const pl of planes)if(pl.normal.x*p.x+pl.normal.y*(p.y+1.4)+pl.normal.z*p.z+pl.d<-.6){vis=false;break;}a.visible=vis;}
  sched.step(dt,input);
  // who is drawn using it
  const want=[];for(const a of list){a.session=sched.session(a.id);a.goal=a.forced?{pose:a.forced,role:'solo'}:a.react&&a.react.mode==='film'?{pose:'film',role:'solo'}:a.react&&a.react.mode==='watch'?{pose:'watch',role:'solo'}:a.session;if(a.goal||a.w>0)want.push({id:a.id,d:a.d,visible:a.visible,shown:a.w>0});}
  const cap=capFor(quality()),posed=choosePosed(want,cap);
  stats.agents=list.length;stats.using=list.filter(a=>a.session||a.forced||a.react?.mode==='film').length;stats.cap=cap;stats.poses={};stats.tiers={};
  let n=0;for(const a of list){stats.tiers[a.tier]=(stats.tiers[a.tier]||0)+1;const on=!!a.goal&&posed.has(a.id);if(on&&a.goal.pose!==a.pose&&a.w>.05){a.ending=true;}else if(on){a.pose=a.goal.pose;a.role=a.goal.role;a.partner=a.goal.partner;a.ending=false;}
   a.w=Math.max(0,Math.min(1,a.w+(on&&!a.ending?1:-1)*dt*2.2));if(a.w<=0){a.ending=false;if(on){a.pose=a.goal.pose;a.role=a.goal.role;a.partner=a.goal.partner;}else{a.pose=null;drop(a);}}
   if(a.w>0&&a.pose){n++;stats.poses[a.pose]=(stats.poses[a.pose]||0)+1;}
   // turning toward a spectacle (and a step closer or back), turning away for those who leave
   const r=a.react;if(r&&r.mode!=='ignore'&&a.node.isEnabled()){const p=a.node.position;const wp=a.node.getAbsolutePosition(),tx=r.x-wp.x,tz=r.z-wp.z,to=Math.atan2(tx,tz)+(r.mode==='leave'?Math.PI:0);
    if(a.yaw===null)a.yaw=a.node.rotationQuaternion?0:a.node.rotation.y;const dy=Math.atan2(Math.sin(to-a.yaw),Math.cos(to-a.yaw));a.yaw+=dy*Math.min(1,dt*3);a.off+=((r.step||0)*Math.min(1,Math.max(0,(clock-r.from)/1.5))*.8-a.off)*Math.min(1,dt*2);
    if(!a.node.rotationQuaternion&&!a.node.parent?.rotationQuaternion){xform.push([a.node,p.clone(),a.node.rotation.y]);const len=Math.hypot(tx,tz)||1;p.x+=tx/len*a.off;p.z+=tz/len*a.off;a.node.rotation.y=a.yaw;}
    if(!a.reacting){a.reacting=r.event;if(a.extra.walker!==true&&a.f.play&&(r.mode==='film'||r.mode==='watch')){a.restore=a.f.clip;a.f.play('idle');}}}
   else{if(a.reacting){a.reacting=null;if(a.restore){a.f.play(a.restore);a.restore=null;}}a.yaw=null;a.off=0;}}
  // the pair-selfie couple face the same way, the friend on the holder's left
  for(const a of list){if(a.pose!=='pair-selfie'||a.role!=='holder'||a.w<=0)continue;const b=list.find(x=>x.id===a.partner);if(!b||b.node.rotationQuaternion||a.node.rotationQuaternion)continue;
   const pa=a.node.getAbsolutePosition(),pb=b.node.getAbsolutePosition(),dx=pb.x-pa.x,dz=pb.z-pa.z;const face=Math.atan2(dx,dz)+Math.PI/2;   // b to a's left when both face `face`
   for(const x of [a,b]){if(!xform.some(e=>e[0]===x.node))xform.push([x.node,x.node.position.clone(),x.node.rotation.y]);const cur=x.node.rotation.y,dd=Math.atan2(Math.sin(face-cur),Math.cos(face-cur));x.node.rotation.y=cur+dd*Math.min(1,a.w*1.1);}}
  stats.posed=n;
  // flashes
  for(let i=kit.flashes.length-1;i>=0;i--){const s=kit.flashes[i];s.t+=dt;const k=s.t/.16;if(k>=1){s.f.dispose();kit.flashes.splice(i,1);continue;}s.f.scaling.setAll(s.size*Math.sin(Math.PI*Math.min(1,k))*(s.dim?.4:1)+.001);}
  for(const T of Object.values(kit.src))for(const k of ['panel','frame']){const s=T[k];s.tex.vOffset=(clock*.04)%1;}
  for(const [tier,T] of Object.entries(kit.src)){const fl=.88+.12*Math.sin(clock*23.7+tier.length)*Math.sin(clock*7.1);T.panel.mat.alpha=TIERS[tier].alpha*fl;T.frame.mat.alpha=TIERS[tier].alpha*1.3*fl;}
  stats.ms=performance.now()-t0;}
 function after(){const t0=performance.now();if(!kit)return;
  for(const a of agents.values()){if(!a||!a.pose||a.w<=0)continue;const fig=figOf(a);if(!fig||!a.node.isEnabled()){drop(a);continue;}try{pose(a,fig);}catch(e){console.warn('[VOID npc device]',e);a.fig=null;drop(a);}}
  stats.ms+=performance.now()-t0;}
 const ease=w=>w*w*(3-2*w);
 function pose(a,fig){const w=ease(a.w),body=bodyFrame(a.node),up=B.Axis.Y,h=fig.bones.Head;refresh(h);
  const side=P(fig.bones.RightArm).subtract(P(fig.bones.LeftArm||fig.bones.Neck));side.y=0;side.normalize();   // toward the person's own right
  const head0=P(h),eye0=head0.add(up.scale(.09)).add(body.fwd.scale(.07)),pole=up.scale(-1).add(side.scale(.7)).add(body.fwd.scale(-.2));
  const tier=a.tier,eyeCam=TIERS[tier].eye,r=a.react,s=a.session||{},partner=a.partner&&[...agents.values()].find(x=>x&&x.id===a.partner);
  let frameAt=null,frameW=0,panel=false;
  const subject=()=>{if(r)return new B.Vector3(r.x,r.y,r.z);if(a.pose==='food-photo')return new B.Vector3(eye0.x+body.fwd.x*.55,eye0.y-.75,eye0.z+body.fwd.z*.55);const t=a.extra.target?.();if(t)return t;return eye0.add(body.fwd.scale(4)).add(up.scale(-.1));};
  switch(a.pose){
   case 'scroll':{a.swipe+=1/60;const sw=Math.max(0,Math.sin(a.swipe*1.3))**8;
    lookAt(fig,eye0.add(body.fwd.scale(.35)).add(up.scale(-.13)),w,body);
    if(!a.moving||a.kind!=='walker'||true)reach(fig,eye0.add(body.fwd.scale(.27)).add(up.scale(-.3+sw*.04)).add(side.scale(.11+sw*.06)),pole,w*(a.moving?.8:1));
    panel=true;break;}
   case 'watch':{lookAt(fig,subject(),w,body);break;}
   case 'photo':case 'film':case 'food-photo':{const S=subject();
    if(eyeCam){lookAt(fig,S,w,body);reach(fig,eye0.add(side.scale(.09)).add(body.fwd.scale(.02)).add(up.scale(-.02)),pole,w*.9);break;}
    const sh=P(fig.bones.RightArm),dir=S.subtract(sh).normalize(),L=B.Vector3.Distance(sh,P(fig.bones.RightForeArm))+B.Vector3.Distance(P(fig.bones.RightForeArm),P(fig.bones.RightHand));
    const T=sh.add(dir.scale(L*(a.pose==='food-photo'?.78:.84))).add(side.scale(-.05));reach(fig,T,pole,w);lookAt(fig,S,w,body);frameAt=true;frameW=w;break;}
   case 'selfie':{const T=head0.add(body.fwd.scale(.42)).add(up.scale(.2)).add(side.scale(.16));reach(fig,T,pole,w);refresh(h);lookAt(fig,P(fig.bones.RightHand).add(up.scale(.06)),w,body);frameAt=true;frameW=w;break;}
   case 'pair-selfie':{const pf=partner&&figOf(partner),ph=pf?P(pf.bones.Head):null;
    if(a.role==='friend'){const hold=pf?.bones.RightHand;if(ph)lean(fig,ph,w);lookAt(fig,hold?P(hold).add(up.scale(.06)):eye0.add(body.fwd.scale(.5)),w,body);break;}
    const mid=ph?head0.add(ph).scale(.5):head0,T=mid.add(body.fwd.scale(.5)).add(up.scale(.18)).add(side.scale(.12));reach(fig,T,pole,w);if(ph)lean(fig,ph,w*.5);refresh(h);lookAt(fig,P(fig.bones.RightHand).add(up.scale(.06)),w,body);frameAt=true;frameW=w;break;}
  }
  refresh(h);
  // the hologram in front of the face, following the head
  if(panel){if(!a.holo||a.holoTier!==tier){drop(a);a.holoTier=tier;a.holo=take(tier,'panel');}const hm=h.getWorldMatrix(),hp=P(h),fwd=B.Vector3.TransformNormal(B.Axis.Z,hm).normalize(),eye=hp.add(up.scale(.09)).add(fwd.scale(.07));
   const at=eye.add(fwd.scale(.33)).add(up.scale(-.03));a.holo.position.copyFrom(at);a.holo.lookAt(eye.add(at.subtract(eye).scale(2)));a.holo.scaling.set(.35+.65*w,w,1);}
  else if(a.holo){give(a.holoTier,'panel',a.holo);a.holo=null;}
  // the frame at the outstretched hand, square to the line from the eye
  if(frameAt){if(!a.frame||a.holoTier!==tier){drop(a);a.holoTier=tier;a.frame=take(tier,'frame');}const hb=fig.bones.RightHand,mid=fig.bones.RightHandMiddle1;refresh(mid||hb);const wp=P(hb),fp=mid?P(mid):wp,along=fp.subtract(wp);
   const hp=P(h),eye=hp.add(up.scale(.09)),at=wp.add(along.normalize().scale(.13)).add(up.scale(.05));a.frame.position.copyFrom(at);a.frame.lookAt(at.add(at.subtract(eye)));a.frame.scaling.set(frameW,frameW,1);
   for(const t of s.flash||[])if(a.session&&a.session.t>=t&&!(a.flashed||[]).includes(t)&&frameW>.8){(a.flashed=a.flashed||[]).push(t);spark(at,.07,tier==='v2');}
   if(r&&r.mode==='film'&&Math.random()<.003)spark(at,.05,true);}
  else if(a.frame){give(a.holoTier,'frame',a.frame);a.frame=null;}
  if(eyeCam&&PHOTO.has(a.pose))for(const t of s.flash||[])if(a.session&&a.session.t>=t&&!(a.flashed||[]).includes(t)){(a.flashed=a.flashed||[]).push(t);spark(eye0.add(side.scale(.035)),.012,true);}
  if(!a.session)a.flashed=null;
 }
 function restore(){for(const [b,q] of saved)if(!b.isDisposed?.())b.rotationQuaternion.copyFrom(q);saved.clear();for(const [n,p,ry] of xform)if(!n.isDisposed()){n.position.copyFrom(p);n.rotation.y=ry;}xform=[];}
 function attach(sc){try{if(scene&&!scene.isDisposed){for(const [o,h] of obs)o.remove(h);}}catch{}obs=[];
  for(const a of agents.values())if(a)drop(a);agents.clear();kit=null;saved.clear();xform=[];scene=sc;if(!sc)return;
  obs.push([sc.onBeforeAnimationsObservable,sc.onBeforeAnimationsObservable.add(()=>{const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;try{before(dt);}catch(e){console.warn('[VOID npc device]',e);}})]);
  obs.push([sc.onAfterAnimationsObservable,sc.onAfterAnimationsObservable.add(()=>{try{after();}catch(e){console.warn('[VOID npc device]',e);}})]);
  obs.push([sc.onAfterRenderObservable,sc.onAfterRenderObservable.add(()=>{try{restore();}catch{}})]);}
 if(typeof update==='function'){const prior=update;update=function(...args){const r=prior(...args);try{const sc=root.VoidBabylon?.scene||null;if(sc&&!B&&root.BABYLON){B=root.BABYLON;M=new B.Matrix();qT=new B.Quaternion();ID=B.Quaternion.Identity();V=B.Vector3;}if(sc!==scene&&B)attach(sc&&!sc.isDisposed?sc:null);}catch{}return r;};}
 /* Tag a person: {monk:true} (never films a spectacle), {tier:'v3'}, {kind}, {pair}. Works before or after they are first seen. */
 function tag(node,extra){if(!node)return;tagged.set(node,{...(tagged.get(node)||{}),...extra});for(const [f,a] of agents)if(a===null&&f.node===node)agents.delete(f);for(const a of agents.values())if(a&&a.node===node){Object.assign(a.extra,extra);if(extra.tier)a.tier=extra.tier;if('monk' in extra)a.monk=!!extra.monk;if(extra.kind)a.kind=extra.kind;if(extra.pair)a.pairKey=extra.pair;}}
 /* Owners that move their people (ncz-nightlife.js) enlist them: {kind, pair, state()->{moving, can}}. */
 function enlist(node,info){tag(node,{...info,walker:info.kind==='walker'});}
 /* STAGE A STREET ARGUMENT HERE (Developer Tools): two street people argue a few metres in front of the player, and the people round about react. */
 let staged=null;
 function stageArgument(opts={}){if(!scene||!B)return {error:'No 3D scene.'};stopArgument();
  const me=typeof walker!=='undefined'&&walker?walker:null,yaw=me?.yaw||0,cx=opts.x??(me?me.x+Math.sin(yaw)*5:0),cz=opts.z??(me?me.z+Math.cos(yaw)*5:0);
  const parent=[...agents.values()].find(a=>a&&a.node.parent)?.node.parent||null,looks=['ncz-neon','runner-02','outlaw-01','hacker-01','district-resident','fixer-01','district-smuggler','communion-tech'];const made=[];
  for(const look of looks){if(made.length>=2)break;const n=root.VoidAssets?.instance?.('crowd:'+look,parent);if(!n)continue;n.metadata={...n.metadata,crowd:look,argument:true};made.push({node:n,look});}
  if(made.length<2){for(const m of made)m.node.dispose();return {error:'No street figures are loaded here.'};}
  const along=yaw+Math.PI/2;made.forEach((m,i)=>{const s=i?.65:-.65;m.node.position.set(cx+Math.sin(along)*s,0,cz+Math.cos(along)*s);m.node.rotation.y=along+(i?-Math.PI/2:Math.PI/2);m.anim=root.VoidCrowd.animate(m.node,m.look,'talk');m.yaw=m.node.rotation.y;});
  const dur=opts.duration??14,ev=spectacle({x:cx,z:cz,radius:opts.radius??14,kind:'argument',duration:dur});
  staged={made,t:0,dur,ev,x:cx,z:cz};
  // the two of them: a jab of the arm toward the other, a lean in, turns of the shoulder (their talk clip underneath)
  const tick=()=>{if(!staged)return;staged.t+=1/60;if(staged.t>dur+1){stopArgument();return;}for(const [i,m] of staged.made.entries()){const k=Math.sin(staged.t*(i?3.3:2.7)+i*2);m.node.rotation.y=m.yaw+k*.18;m.node.rotation.x=Math.max(0,k)*.05;}};
  staged.obs=scene.onBeforeRenderObservable.add(tick);
  return {x:cx,z:cz,people:made.map(m=>m.look),reactions:ev.reactions};}
 function stopArgument(){if(!staged)return;try{scene.onBeforeRenderObservable.remove(staged.obs);}catch{}for(const m of staged.made){try{m.anim?.dispose?.();m.node.dispose();}catch{}}staged=null;}
 const api={...pure,tag,enlist,spectacle,stageArgument,stopArgument,reactionOf,holds,pace,sessionOf,
  stats:()=>({...stats,poses:{...stats.poses},tiers:{...stats.tiers},staged:staged?{x:staged.x,z:staged.z,t:staged.t}:null}),
  agents:()=>[...agents.values()].filter(Boolean).map(a=>({id:a.id,key:a.key,kind:a.kind,tier:a.tier,monk:a.monk,pose:a.pose,w:a.w,visible:a.visible,d:a.d,react:a.react?a.react.mode:null,session:a.session?a.session.pose:null,holo:!!a.holo,frame:!!a.frame,node:a.node})),
  scheduler:sched,reactor,get scene(){return scene;}};
 root.VoidNPCDevice=api;
 root.VoidCrowdReact={spectacle,stageArgument,stopArgument,reactionOf,holds,pace,tag,get active(){return reactor.active;}};
})(typeof globalThis!=='undefined'?globalThis:this);
