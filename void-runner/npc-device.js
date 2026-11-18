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
   It is THE hook for any fight or street argument (call it with the place; radius about 12 m). Filmers are capped per quality (FILM_CAPS: the nearest film, the rest
   watch); those stepping closer walk in on spread lines (gatherMove) and walk back afterwards. Food: diners at the street's food shopfronts (ncz-nightlife.js) hold a
   takeaway bowl and photograph it. Cost: one batch of people refreshed per frame, the scheduler at 10 Hz, only posed people touched every frame (18 Nov 2026).
   The rules (tiers, scheduler, caps, spectacle) are pure and run in Node (tests/npc-device.test.cjs); the drawing runs in the browser. */
(function(root){
 'use strict';
 // Device tiers: share of people carrying each (when their data gives none), the hologram colour (the device's UI colour) and its strength.
 // V2: PLACEHOLDER colour, pending the owner's V2 design ("V2 will look similar to V1, just different color. I'll come up with V2 details later"). One constant.
 const V2_PLACEHOLDER_COLOR='#b58cff';
 const TIERS={
  v1:{share:.72,color:'#61eee9',alpha:.82,name:'V1'},                 // device-v1.css --pd-edge-hi (the V1's rail): the cuff and panel
  v2:{share:.23,color:V2_PLACEHOLDER_COLOR,alpha:.8,name:'V2',placeholder:true}, // the same cuff and panel as the V1, its own colour
  v3:{share:.05,color:'#46ff7a',alpha:.66,name:'V3 // SHADOW',eye:true}}; // device-v1.css [data-device=v3]. The owner: "V3 // Shadow get it streamed into their eye. So just their eye glows." No cuff, no panel
 const CAPS={low:4,medium:10,high:16,ultra:16};
 const capFor=q=>CAPS[q]??CAPS.medium;
 // How many of a spectacle's onlookers film it (the nearest; the rest only watch), by quality. Within CAPS, so the filmers are drawn first.
 const FILM_CAPS={low:3,medium:6,high:10,ultra:10};
 const filmCapFor=q=>FILM_CAPS[q]??FILM_CAPS.medium;
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
 const config={near:22,flashShare:.5,spectacle:{radius:12,duration:12,film:.78,closer:.25,back:.2,linger:[2,5],delay:[.2,1.5],
  // gathering loosely: those stepping closer walk in up to `max` m (more from further out) and never nearer than `near` m; onlookers beyond `far` drift in a little;
  // a step back is `back` m; each comes in on a slightly different line (`arc` radians in all), so they spread round it rather than queue
  gather:{near:3.5,far:8,step:.8,pull:.3,max:2.2,drift:.4,back:.8,arc:.6}}};
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
  return {step,session:id=>st.get(id)?.session||null,state:st,forget:id=>st.delete(id),end(id,kind='walker'){const s=st.get(id);if(s?.session){s.session=null;s.cool=coolFor(KINDS[kind]?.group||'street',rnd);}}};
 }
 /* The people who are drawn using it: those in a session, near and in view, nearest first, at most `cap`. Someone already shown keeps their place over a newcomer
    a little nearer (no flicker at the edge). list: [{id, d, visible, shown}] */
 function choosePosed(list,cap){return new Set(list.filter(a=>a.visible).sort((a,b)=>(a.shown?a.d*.8:a.d)-(b.shown?b.d*.8:b.d)).slice(0,Math.max(0,cap)).map(a=>a.id));}
 // Who never joins a crowd filming a spectacle.
 const excluded=a=>!!(a.monk||a.tier==='v3');
 /* createReactor() -> {spectacle(ev, agents, now), reactionOf(id, now), step(now), active}. ev: {x, z, radius, kind, duration}. agents: [{id, x, z, tier, monk}].
    Each person within the radius gets {mode:'film'|'watch'|'ignore'|'leave', step:+1 closer|-1 back|0, from (start time), until (end time)}. */
 /* How far an onlooker at distance d walks in (+) or steps back (-), in metres, for their step (+1 closer, -1 back, 0 stay): a loose gathering, never on top of it. */
 function gatherMove(d,step,g=config.spectacle.gather){if(step<0)return -g.back;const want=step>0?Math.min(g.max,g.step+Math.max(0,d-g.near)*g.pull):Math.max(0,d-g.far)*g.drift;return Math.max(0,Math.min(want,d-g.near));}
 function createReactor({rnd=Math.random,cfg=config.spectacle}={}){
  const events=[];let serial=0;
  // ev.filmCap: at most this many film (the nearest of those who would); the others watch. Omitted: no cap (the browser passes filmCapFor(quality)).
  function spectacle(ev,agents,now){const e={id:++serial,x:+ev.x||0,z:+ev.z||0,radius:ev.radius??cfg.radius,kind:ev.kind||'spectacle',t0:now,end:now+(ev.duration??cfg.duration),who:new Map(),y:ev.y??1.25};
   const films=[],cap=ev.filmCap??cfg.filmCap??Infinity,g=cfg.gather||config.spectacle.gather;
   for(const a of agents){const d=Math.hypot(a.x-e.x,a.z-e.z);if(d>e.radius||(ev.skip&&ev.skip.has(a.id)))continue;
    const ex=excluded(a),mode=ex?(a.monk?'ignore':(rnd()<.5?'leave':'ignore')):(rnd()<cfg.film?'film':'watch');
    const r=rnd(),step=ex?0:r<cfg.closer?1:r<cfg.closer+cfg.back?-1:0;
    const x={id:a.id,event:e.id,mode,step,move:ex?0:gatherMove(d,step,g),arc:ex?0:(rnd()-.5)*g.arc,d,x:e.x,z:e.z,y:e.y,from:now+cfg.delay[0]+rnd()*(cfg.delay[1]-cfg.delay[0]),until:e.end+cfg.linger[0]+rnd()*(cfg.linger[1]-cfg.linger[0])};
    e.who.set(a.id,x);if(mode==='film')films.push(x);}
   films.sort((p,q)=>p.d-q.d);for(const x of films.slice(Math.max(0,cap)))x.mode='watch';
   events.push(e);return e;}
  function reactionOf(id,now){let best=null;for(const e of events){const r=e.who.get(id);if(r&&now>=r.from&&now<r.until&&(!best||r.from>best.from))best=r;}return best;}
  function step(now){for(let i=events.length-1;i>=0;i--){let live=false;for(const r of events[i].who.values())if(now<r.until)live=true;if(!live&&now>=events[i].end)events.splice(i,1);}}
  function end(id,now){const e=events.find(x=>x.id===id);if(e){e.end=Math.min(e.end,now);for(const r of e.who.values())r.until=Math.min(r.until,now+cfg.linger[0]);}}
  return {spectacle,reactionOf,step,end,get active(){return events.slice();}};
 }
 // Kind of a person from the marks their makers leave (metadata), or null for people this never touches.
 const STORY=new Set(['admin','dax']);   // both carry a V3 // Shadow (district-people.js). Iris is an android: her device is all internal, so she never shows one (the owner, 18 Nov 2026)
 function kindOf(m){if(!m||m.argument||m.companion||m.life)return null;
  if(m.npcDevice?.kind)return m.npcDevice.kind;
  if(typeof m.alley==='string')return /sitter/.test(m.alley)?'seated':/drunk/.test(m.alley)?null:'stander';
  if(typeof m.club==='string')return /^dancer/.test(m.club)?'dancer':/^bar-guest/.test(m.club)?'bar':m.club==='door'?'stander':null;
  if(typeof m.nightlife==='string')return /^stand/.test(m.nightlife)?'stander':'walker';
  const c=String(m.character||'');if(STORY.has(c))return 'story';
  if(/^crew-bar\d/.test(c))return 'food';if(/^crew-(vr|bartender)|^crew-pressure/.test(c))return null;if(/^crew-/.test(c)&&m.ambient)return /sit/.test(c)?'seated':'stander';
  return null;}
 /* The device a named person carries (district-people.js `device`), or null. Only for people with a name: the street's people carry no `character`, and matching
    `undefined` against a person with no `crew` gave every one of them Admin's V3 // Shadow (fixed 18 Nov 2026: almost nobody on the street could film a spectacle). */
 function deviceOf(people,character){if(!character||!Array.isArray(people))return null;const p=people.find(n=>n&&(n.id===character||(n.crew&&n.crew===character)));return p?.device||null;}
 // Fixed pairs among the places' own people (who takes a selfie with whom).
 const PAIRS={'crew-hall-talk1':'crew-hall-talk2','crew-hall-talk2':'crew-hall-talk1','bar-guest-a':'bar-guest-b','bar-guest-b':'bar-guest-a','dancer-0':'dancer-1','dancer-1':'dancer-0','dancer-2':'dancer-3','dancer-3':'dancer-2','crew-bar1':'crew-bar2','crew-bar2':'crew-bar1'};
 /* OTHER PLAYERS (multiplayer, the owner, 18 Nov 2026: "players see each other using their device"). The hub tells only open or closed, the model (v1, v2, v3) and
    read or cam (remote-players.js); never what is on the screen. A remote player's avatar is marked by remote-players.js (metadata.remoteDevice on its
    'remote-player:<id>' node: {tier(), force()}) and is the ONE kind of player this module draws: same cuff and panel as people (V1 teal, V2 the placeholder
    violet), the V3 // Shadow only its eye. Never the local player, never companions. remotePose: what the avatar shows for what the hub said (null: nothing). */
 function remotePose(dev,pose){if(!TIERS[dev])return null;return pose==='cam'?'photo':'scroll';}
 const pure={deviceOf,V2_PLACEHOLDER_COLOR,remotePose,TIERS,CAPS,capFor,FILM_CAPS,filmCapFor,gatherMove,KINDS,GROUPS,STILL,PHOTO,config,hash,tierFor,poseFor,createScheduler,choosePosed,excluded,createReactor,kindOf,PAIRS};
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
 const remoteOf=n=>{for(let p=n;p;p=p.parent){const r=p.metadata?.remoteDevice;if(r)return r;if(/^remote-player:/.test(p.name||''))return null;}return null;};   // a remote player's avatar (the deliberate exception)
 const isCompanion=n=>{for(let p=n;p;p=p.parent)if(p.metadata?.companion||/^remote-player:|^player|avatar/i.test(p.name||''))return true;return false;};
 const talking=()=>{try{return !!root.VoidConversationUI?.isOpen||(typeof speech!=='undefined'&&!!speech?.lines?.length&&typeof walkingLocation!=='undefined'&&!!walkingLocation);}catch{return false;}};
 // The hologram's textures. From outside it is never readable: soft blurred blocks (reading) or a blurred smear of a "picture" inside viewfinder corners (camera),
 // a glowing edge and scanlines, in the tier's colour. Black is see-through (the material adds light).
 function hologramTexture(name,hex,kind){const T=new B.DynamicTexture('npc-holo-'+name,{width:128,height:96},scene,true);const g=T.getContext();g.fillStyle='#000';g.fillRect(0,0,128,96);
  const c=B.Color3.FromHexString(hex),rgb=a=>'rgba('+Math.round(c.r*255)+','+Math.round(c.g*255)+','+Math.round(c.b*255)+','+a+')';let s=hash(name);const R=()=>((s=Math.imul(s^s>>>15,2246822507)>>>0)%1000)/1000;
  g.fillStyle=rgb(.24);g.fillRect(3,3,122,90);g.filter='blur(3px)';
  if(kind==='panel'){g.fillStyle=rgb(.55);g.fillRect(10,9,46,6);g.fillStyle=rgb(.3);g.fillRect(10,21,108,22);for(let i=0;i<3;i++){g.fillStyle=rgb(.5);g.fillRect(12,52+i*13,9,8);g.fillStyle=rgb(.25+R()*.3);g.fillRect(27,53+i*13,40+R()*50,5);}}
  else{for(let i=0;i<14;i++){g.fillStyle=rgb(.12+R()*.35);g.fillRect(14+R()*90,14+R()*60,8+R()*26,6+R()*22);}g.filter='blur(1px)';g.strokeStyle=rgb(.95);g.lineWidth=3;const L=15;for(const [x,y,dx,dy] of [[9,9,1,1],[119,9,-1,1],[9,87,1,-1],[119,87,-1,-1]]){g.beginPath();g.moveTo(x,y+dy*L);g.lineTo(x,y);g.lineTo(x+dx*L,y);g.stroke();}
   g.beginPath();g.arc(108,76,6,0,Math.PI*2);g.lineWidth=2;g.stroke();}
  g.filter='none';g.strokeStyle=rgb(.9);g.lineWidth=2;g.strokeRect(2,2,124,92);
  g.fillStyle='rgba(0,0,0,.4)';for(let y=0;y<96;y+=3)g.fillRect(0,y,128,1);   // scanlines
  T.update();return T;}
 // The kit, made once per scene: per tier a reading panel, a camera panel, the light cone from the emitter and the emitter strip (instances of one mesh each, one material
 // each); the cuff itself (dark metal, one lit material for all); a flash.
 function buildKit(){const own=[],src={};
  const unlit=(name,alpha,tex,color)=>{const m=new B.StandardMaterial(name,scene);m.disableLighting=true;m.diffuseColor=B.Color3.Black();if(tex)m.emissiveTexture=tex;else m.emissiveColor=color;m.alpha=alpha;m.alphaMode=B.Engine.ALPHA_ADD;m.backFaceCulling=false;own.push(m);return m;};
  const hidden=m=>{m.isPickable=false;m.position.y=-500;m.alwaysSelectAsActiveMesh=false;own.push(m);return m;};
  const flashMat=unlit('npc-holo-flash',.55,null,new B.Color3(1,1,1));
  const flash=hidden(B.MeshBuilder.CreateDisc('npc-holo-flash',{radius:.5,tessellation:12},scene));flash.material=flashMat;flash.billboardMode=B.TransformNode.BILLBOARDMODE_ALL;flash.scaling.setAll(.001);
  // the cuff: a short dark metal band round the left forearm (its axis is the mesh's Y), lit by the scene
  const metal=new B.StandardMaterial('npc-v1-cuff',scene);metal.diffuseColor=new B.Color3(.05,.055,.06);metal.specularColor=new B.Color3(.45,.5,.55);metal.specularPower=48;own.push(metal);
  const cuff=hidden(B.MeshBuilder.CreateCylinder('npc-v1-cuff',{diameter:.092,height:.085,tessellation:12},scene));cuff.material=metal;
  // the light cone: a four-sided frustum from the emitter (bottom, y 0) to the panel (top, y 1), scaled each frame
  const cone=B.MeshBuilder.CreateCylinder('npc-holo-cone',{diameterTop:1.414,diameterBottom:.06,height:1,tessellation:4,cap:B.Mesh.NO_CAP},scene);cone.bakeTransformIntoVertices(B.Matrix.RotationY(Math.PI/4).multiply(B.Matrix.Translation(0,.5,0)));hidden(cone);
  for(const [tier,T] of Object.entries(TIERS)){src[tier]={};const col=B.Color3.FromHexString(T.color);
   for(const kind of ['panel','camera']){const tex=hologramTexture(tier+'-'+kind,T.color,kind);own.push(tex);const m=unlit('npc-holo-'+tier+'-'+kind,T.alpha,tex);
    const mesh=hidden(B.MeshBuilder.CreatePlane('npc-holo-'+tier+'-'+kind,{width:1,height:.72},scene));mesh.material=m;src[tier][kind]={mesh,mat:m,tex,pool:[]};}
   const cm=unlit('npc-holo-'+tier+'-cone',T.alpha*.22,null,col),cc=cone.clone('npc-holo-'+tier+'-cone');cc.material=cm;hidden(cc);src[tier].cone={mesh:cc,mat:cm,pool:[]};
   const em=unlit('npc-v1-'+tier+'-emitter',Math.min(1,T.alpha*1.6),null,col),e=hidden(B.MeshBuilder.CreateBox('npc-v1-'+tier+'-emitter',{width:.024,height:.008,depth:.038},scene));e.material=em;src[tier].emitter={mesh:e,mat:em,pool:[]};}
  // the Shadow's eye: a small soft glow at one eye (a billboard disc, one material)
  const eyeMat=unlit('npc-v3-eye',.5,null,B.Color3.FromHexString(TIERS.v3.color)),eyeGlow=hidden(B.MeshBuilder.CreateDisc('npc-v3-eye',{radius:.5,tessellation:10},scene));eyeGlow.material=eyeMat;eyeGlow.billboardMode=B.TransformNode.BILLBOARDMODE_ALL;
  // a diner's takeaway bowl (the food photo at a food shopfront): a paper bowl with a pair of chopsticks across it, lit by the scene, faintly warm so it reads at night
  const paper=new B.StandardMaterial('npc-dish',scene);paper.diffuseColor=new B.Color3(.82,.76,.66);paper.emissiveColor=new B.Color3(.1,.08,.06);paper.specularColor=new B.Color3(.08,.08,.08);own.push(paper);
  const bowl=B.MeshBuilder.CreateCylinder('npc-dish-b',{diameterTop:.13,diameterBottom:.085,height:.07,tessellation:14},scene),st1=B.MeshBuilder.CreateBox('npc-dish-s1',{width:.006,height:.006,depth:.21},scene),st2=st1.clone('npc-dish-s2');
  st1.position.set(-.012,.045,0);st1.rotation.set(.12,.35,0);st2.position.set(.012,.045,0);st2.rotation.set(.12,.42,0);
  const dish=hidden(B.Mesh.MergeMeshes([bowl,st1,st2],true,true));dish.name='npc-dish';dish.material=paper;
  src.cuff={mesh:cuff,pool:[]};src.eye={mesh:eyeGlow,mat:eyeMat,pool:[]};src.dish={mesh:dish,pool:[]};cone.dispose();own.splice(own.indexOf(cone),1);
  scene.onDisposeObservable.addOnce(()=>{for(const o of own)try{o.dispose();}catch{}});
  return {src,flash,flashMat,flashes:[]};}
 const solo=k=>k==='cuff'||k==='eye'||k==='dish';
 function take(tier,kind){const s=solo(kind)?kit.src[kind]:kit.src[tier][kind];const m=s.pool.pop()||s.mesh.createInstance(s.mesh.name+'-i');m.setEnabled(true);m.isPickable=false;return m;}
 function give(tier,kind,m){if(!m)return;m.setEnabled(false);(solo(kind)?kit.src[kind]:kit.src[tier][kind]).pool.push(m);}
 function spark(at,size,dim){const f=kit.flash.createInstance('npc-holo-flash-i');f.position.copyFrom(at);f.scaling.setAll(.001);kit.flashes.push({f,t:0,size,dim});stats.flashes++;}
 // ---- bones ----
 const BONES=['Hips','Spine2','Neck','Head','RightArm','RightForeArm','RightHand','RightHandMiddle1','LeftArm','LeftForeArm','LeftHand','LeftHandMiddle1'];
 function bonesOf(node){const found={};for(const t of node.getDescendants(false)){if(!t.rotationQuaternion&&!(t instanceof B.TransformNode))continue;for(const b of BONES)if(!found[b]&&(t.name.endsWith('mixamorig:'+b)||new RegExp('(^|[:_ .|])'+b+'$').test(t.name)))found[b]=t;}
  if(!found.Head)for(const m of node.getChildMeshes(false)){const sk=m.skeleton;if(!sk)continue;for(const b of BONES){const bone=!found[b]&&sk.bones.find(x=>new RegExp('(^|[:_ .|])'+b+'$').test(x.name)),tn=bone?.getTransformNode?.();if(tn)found[b]=tn;}if(found.Head)break;}
  for(const b of Object.keys(found))if(!found[b].rotationQuaternion)found[b].rotationQuaternion=B.Quaternion.FromEulerVector(found[b].rotation);
  return found.Head&&found.Neck&&found.LeftArm&&found.LeftForeArm&&found.LeftHand&&found.RightArm&&found.RightForeArm&&found.RightHand?found:null;}
 const refresh=b=>{const chain=[];for(let n=b;n;n=n.parent)chain.unshift(n);for(const n of chain)n.computeWorldMatrix(true);};
 let saved=new Map();   // bone -> its clip rotation, put back after the frame is drawn
 function keep(b){if(!saved.has(b))saved.set(b,b.rotationQuaternion.clone());}
 // Turn bone b so that the world direction `cur` (from the bone) points along `want`, by fraction w; in the parent's own space (a mirrored glTF root would flip a world rotation).
 function aimDir(b,cur,want,w){if(!b?.parent||w<=0)return;keep(b);b.parent.getWorldMatrix().invertToRef(M);const f=B.Vector3.TransformNormal(cur,M),g=B.Vector3.TransformNormal(want,M);if(f.lengthSquared()<1e-10||g.lengthSquared()<1e-10)return;f.normalize();g.normalize();
  const Q=new B.Quaternion();B.Quaternion.FromUnitVectorsToRef(f,g,Q);const d=B.Quaternion.Slerp(ID,Q,Math.min(1,w));d.multiplyToRef(b.rotationQuaternion,qT);b.rotationQuaternion.copyFrom(qT);b.computeWorldMatrix(true);}
 const P=b=>b.getAbsolutePosition().clone();
 // Two-bone reach: one wrist (side 'Left' or 'Right') toward T (world), the elbow bending toward `pole` (a world direction), by weight w; the wrist then follows the
 // forearm, tipped by `tip` (a world direction added to it: up for a hand held flat, the bracer facing up).
 function reach(fig,s,T,pole,w,tip){const a=fig.bones[s+'Arm'],f=fig.bones[s+'ForeArm'],h=fig.bones[s+'Hand'];refresh(h);const S=P(a),E=P(f),W=P(h),L1=B.Vector3.Distance(S,E),L2=B.Vector3.Distance(E,W);
  let to=T.subtract(S),d=to.length();if(d<1e-4)return;const u=to.scale(1/d);d=Math.max(Math.abs(L1-L2)+.01,Math.min((L1+L2)*.985,d));
  const x=(L1*L1-L2*L2+d*d)/(2*d),hh=Math.sqrt(Math.max(0,L1*L1-x*x));let v=pole.subtract(u.scale(B.Vector3.Dot(pole,u)));if(v.lengthSquared()<1e-6)v=new B.Vector3(0,-1,0);v.normalize();
  const E2=S.add(u.scale(x)).add(v.scale(hh)),T2=S.add(u.scale(d));aimDir(a,E.subtract(S),E2.subtract(S),w);refresh(h);const E3=P(f),W3=P(h);aimDir(f,W3.subtract(E3),T2.subtract(E3),w);
  if(fig.debug){refresh(h);fig.debug[s]={T:T.asArray(),T2:T2.asArray(),E2:E2.asArray(),elbow:P(f).asArray(),wrist:P(h).asArray(),S:S.asArray(),w};}
  const mid=fig.bones[s+'HandMiddle1'];if(mid){refresh(mid);const Wn=P(h),Fn=P(mid),fore=Wn.subtract(P(f)).normalize();aimDir(h,Fn.subtract(Wn),fore.add(tip||B.Vector3.Zero()),w*.8);}}
 // Neck and head toward a world point (35% / 65%), within natural limits; `tilt` rolls the head a little to one side (a pose for a selfie).
 function lookAt(fig,target,w,body){const h=fig.bones.Head;refresh(h);const hp=P(h);let dir=target.subtract(hp);const flat=Math.hypot(dir.x,dir.z)||1e-6;let pitch=Math.atan2(dir.y,flat),yaw=Math.atan2(dir.x,dir.z)-body.yaw;yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));
  pitch=Math.max(-.8,Math.min(.5,pitch));yaw=Math.max(-1.1,Math.min(1.1,yaw));const yw=body.yaw+yaw;dir=new B.Vector3(Math.sin(yw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yw)*Math.cos(pitch));
  let done=0,acc=0;for(const [name,share] of [['Neck',.35],['Head',.65]]){const b=fig.bones[name];acc+=share;const goal=acc*w,frac=done>=1?0:Math.max(0,Math.min(1,(goal-done)/(1-done)));done=goal;if(!frac)continue;
   refresh(h);const fwd=B.Vector3.TransformNormal(B.Axis.Z,h.getWorldMatrix()).normalize();aimDir(b,fwd,dir,frac);}}
 // Lean the chest toward a point (a friend leaning into a selfie).
 function lean(fig,toward,w,k=.22){const s=fig.bones.Spine2;if(!s)return;refresh(s);const up=B.Vector3.TransformNormal(B.Axis.Y,s.getWorldMatrix()).normalize(),side=toward.subtract(P(s));side.y=0;if(side.lengthSquared()<1e-6)return;side.normalize();aimDir(s,up,up.add(side.scale(k)),w);}
 function bodyFrame(node){const m=node.getWorldMatrix(),f=B.Vector3.TransformNormal(B.Axis.Z,m);f.y=0;f.normalize();return {fwd:f,yaw:Math.atan2(f.x,f.z)};}
 // A rotation from three axes (Babylon: X right, Y up, Z forward).
 function basis(x,y,z,out){B.Quaternion.RotationQuaternionFromAxisToRef(x,y,z,out);return out;}
 // ---- people ----
 function agentFor(f){let a=agents.get(f);if(a!==undefined)return a;const node=f.node,remote=node&&remoteOf(node);
  if(remote){const key=String(remote.id||node.name);a={id:'remote:'+key+'#'+node.uniqueId,key:'remote:'+key,f,node,kind:'player-remote',remote:true,tier:TIERS[remote.tier?.()]?remote.tier():'v1',monk:false,pairKey:null,fig:undefined,last:null,speed:0,w:0,pose:null,holo:null,frame:null,swipe:Math.random()*9,yaw:null,off:0,extra:remote};agents.set(f,a);return a;}
  if(!node||isCompanion(node)){agents.set(f,null);return null;}
  const m=metaOf(node),extra=tagged.get(node)||m.npcDevice||{},kind=extra.kind||kindOf(m);if(!kind){agents.set(f,null);return null;}
  const key=String(m.nightlife||m.club||m.alley||m.character||node.name),person={device:deviceOf(root.VoidDistrictPeople?.npcs?.(),m.character)};
  a={id:key+'#'+f.node.uniqueId,key,f,node,kind,tier:tierFor(key,extra.tier||person?.device),monk:!!(extra.monk||m.monk),pairKey:extra.pair||PAIRS[key]||null,fig:undefined,last:null,speed:0,w:0,pose:null,holo:null,frame:null,swipe:Math.random()*9,yaw:null,off:0,extra};
  agents.set(f,a);return a;}
 function figOf(a){if(a.fig===undefined)a.fig=bonesOf(a.node)?{bones:bonesOf(a.node)}:null;return a.fig;}
 function listAgents(){const out=[];for(const f of root.VoidCrowd?.figures?.()||[]){const a=agentFor(f);if(a&&!a.node.isDisposed())out.push(a);}for(const [f,a] of agents)if(a&&(a.node.isDisposed()||!root.VoidCrowd.figures().has(f))){drop(a);agents.delete(f);sched.forget(a.id);}return out;}
 function drop(a){for(const k of ['cuff','emitter','cone','panel','camera','eye','dish'])if(a['m_'+k]){give(a.pieceTier,k,a['m_'+k]);a['m_'+k]=null;}}
 const byKey=new Map();
 // ---- spectacle ----
 function spectacle(ev={}){const list=listAgents().filter(a=>a.kind!=='story'&&!a.remote&&a.node.isEnabled()).map(a=>{const p=a.node.getAbsolutePosition();return {id:a.id,x:p.x,z:p.z,tier:a.tier,monk:a.monk};});
  const e=reactor.spectacle({filmCap:filmCapFor(quality()),...ev,skip:new Set(ev.skip||[])},list,clock);return {id:e.id,kind:e.kind,x:e.x,z:e.z,radius:e.radius,end:()=>reactor.end(e.id,clock),reactions:[...e.who.values()].map(r=>({id:r.id,mode:r.mode,step:r.step}))};}
 const reactionOf=node=>{for(const a of agents.values())if(a&&a.node===node)return reactor.reactionOf(a.id,clock);return null;};
 const sessionOf=node=>{for(const a of agents.values())if(a&&a.node===node)return sched.session(a.id);return null;};
 // A walker the owner's script should keep still (a photo, a selfie, filming, watching).
 function holds(node){const r=reactionOf(node);if(r&&(r.mode==='film'||r.mode==='watch'))return true;const s=sessionOf(node);return !!s&&STILL.has(s.pose);}
 // Reading while walking (ncz-nightlife.js runs into things): a V1 or V2 reader on the street. Never the V3 // Shadow (streamed into the eye: they stay aware), monks or story people.
 function distracted(node){for(const a of agents.values())if(a&&a.node===node){if(a.tier==='v3'||a.monk||a.kind!=='walker')return false;const s=sched.session(a.id);return (a.forced||s?.pose)==='scroll'&&a.w>.3;}return false;}
 /* A startle: a near miss (they look up, the hologram flickers, then back to it) or a bump ({close:true}: the hologram flickers and closes; the look is over). */
 function startle(node,{close=false}={}){for(const a of agents.values())if(a&&a.node===node){a.flick=clock+.8;if(close){a.hush=clock+3;sched.end(a.id,a.kind);}else a.w=Math.min(a.w,.45);stats.startles=(stats.startles||0)+1;return true;}return false;}
 // Walking pace while reading: slower.
 function pace(node){const s=sessionOf(node);return s&&s.pose==='scroll'?.62:1;}
 /* One step of a gathering onlooker: a.off (metres along a.ux/a.uz, toward the spectacle) eases toward `goal` at a walking pace; facing `face` (the spectacle), or the
    way they walk. Walking more than a few tens of centimetres plays their walk clip (no sliding), then idle. Moved and turned for this frame only (xform, put back
    after the frame is drawn). Street walkers on their way home again are not turned or re-clipped (ncz-nightlife.js walks them on). */
 function gather(a,dt,goal,face){const n=a.node,free=!n.rotationQuaternion&&!n.parent?.rotationQuaternion,walker=a.extra.walker===true,dd=goal-a.off,far=Math.abs(dd)>.12;
  a.off+=Math.sign(dd)*Math.min(Math.abs(dd),dt*(walker&&face===null?1.2:.95));if(Math.abs(a.off)<.005&&goal===0)a.off=0;
  const walkIn=far&&(dd>.25||a.gathering&&dd>.05||face===null&&a.off>.3)&&!(walker&&face===null),home=n.rotation.y;
  if(a.yaw===null)a.yaw=n.rotationQuaternion?0:home;
  const want=walkIn?Math.atan2(dd>0?a.ux:-a.ux,dd>0?a.uz:-a.uz):face!==null?face:home,dy=Math.atan2(Math.sin(want-a.yaw),Math.cos(want-a.yaw));a.yaw+=dy*Math.min(1,dt*3);
  if(face===null&&!a.off&&Math.abs(dy)<.05)a.yaw=null;
  if(a.f.play&&!(walker&&face===null)){if(walkIn&&!a.gathering&&a.f.has?.('walk')!==false){a.gathering=true;if(!a.restore&&!walker)a.restore=a.f.clip;a.f.play('walk');}else if(!walkIn&&a.gathering){a.gathering=false;a.f.play('idle');}}
  else if(a.gathering){a.gathering=false;}
  if(free&&(a.off||a.yaw!==null)){xform.push([n,n.position.clone(),home]);n.position.x+=a.ux*a.off;n.position.z+=a.uz*a.off;if(a.yaw!==null&&!(walker&&face===null))n.rotation.y=a.yaw;}}
 // ---- each frame ----
 let xform=[];   // [node, position, rotationY] to put back after the frame
 /* Each frame is cheap: one batch of people (every BATCHES-th, in turn) has its position, speed, view and state refreshed; the scheduler and who is drawn are worked
    out every THINK seconds from those; only the people in a pose (or gathering) are eased and moved every frame. No per-frame lists. */
 const THINK=.1,BATCHES=3,PLANES=[];let tick=0,thinkAcc=THINK,list=[],posedSet=new Set();const INPUT=[],WANT=[];
 function sense(a,eye,zf,chat,lookBusy){if(a.node.isDisposed())return;const p=a.node.getAbsolutePosition(),el=clock-(a.seenAt??clock);if(a.seenAt!==undefined&&el>0)a.speed=a.speed*.55+.45*Math.hypot(p.x-a.lx,p.z-a.lz)/el;a.lx=p.x;a.lz=p.z;a.seenAt=clock;
  a.d=Math.hypot(p.x-eye.x,p.z-eye.z)*zf;
  if(a.remote){const tr=a.extra.tier?.();if(TIERS[tr])a.tier=tr;}   // another player: their model may change while they are here
  const ext=a.extra.state?.()||{},react=a.remote?null:reactor.reactionOf(a.id,clock);a.react=react;
  const moving=ext.moving??a.speed>.25,forced=a.extra.force?.();a.forced=forced||null;
  a.can=!forced&&!react&&a.node.isEnabled()&&!(a.kind==='story'&&(chat||lookBusy===String(metaOf(a.node).character)||moving))&&ext.can!==false;a.moving=moving;
  let vis=a.node.isEnabled()&&!a.f.culled&&a.f.active!==false&&a.d<config.near;if(vis)for(const pl of PLANES)if(pl.normal.x*p.x+pl.normal.y*(p.y+1.4)+pl.normal.z*p.z+pl.d<-.6){vis=false;break;}a.visible=vis;}
 function think(dt){byKey.clear();for(const a of list)byKey.set(a.key,a);INPUT.length=0;
  for(const a of list){const o=a.input||(a.input={});o.id=a.id;o.kind=a.kind;o.tier=a.tier;o.can=a.can;o.moving=a.moving;o.pair=a.pairKey&&byKey.get(a.pairKey)?.id;INPUT.push(o);}
  sched.step(dt,INPUT);
  // who is drawn using it
  WANT.length=0;let using=0;stats.tiers={};
  for(const a of list){a.session=sched.session(a.id);a.goal=a.hush>clock&&!a.react?null:a.forced?{pose:a.forced,role:'solo'}:a.react&&a.react.mode==='film'?FILM:a.react&&a.react.mode==='watch'?WATCH:a.session;
   if(a.goal||a.w>0){const o=a.want||(a.want={});o.id=a.id;o.d=a.d;o.visible=a.visible;o.shown=a.w>0;WANT.push(o);}
   if(a.session||a.forced||a.react?.mode==='film')using++;stats.tiers[a.tier]=(stats.tiers[a.tier]||0)+1;}
  const cap=capFor(quality());posedSet=choosePosed(WANT,cap);stats.agents=list.length;stats.using=using;stats.cap=cap;}
 const FILM={pose:'film',role:'solo'},WATCH={pose:'watch',role:'solo'};
 function before(dt){const t0=performance.now();clock+=dt;reactor.step(clock);
  const cam=scene.activeCamera;if(!cam)return;if(!kit)kit=buildKit();
  thinkAcc+=dt;tick++;const thinking=thinkAcc>=THINK;if(thinking)list=listAgents();
  const eye=cam.globalPosition,zf=root.VoidZoom?root.VoidZoom.now():1,chat=talking(),lookBusy=root.VoidNPCLook?.current?.character,batch=tick%BATCHES;
  if(!PLANES.length)for(let i=0;i<6;i++)PLANES.push(new B.Plane(0,0,0,0));B.Frustum.GetPlanesToRef(cam.getTransformationMatrix(),PLANES);
  for(let i=0;i<list.length;i++){const a=list[i];if(a.seenAt===undefined||i%BATCHES===batch)sense(a,eye,zf,chat,lookBusy);}
  if(thinking){think(thinkAcc);thinkAcc=0;}
  let n=0;stats.poses={};
  for(const a of list){const on=!!a.goal&&posedSet.has(a.id);if(!on&&a.w<=0&&!a.pose&&!a.react&&!a.reacting&&!a.off&&a.yaw===null)continue;
   if(on&&a.goal.pose!==a.pose&&a.w>.05){a.ending=true;}else if(on){a.pose=a.goal.pose;a.role=a.goal.role;a.partner=a.goal.partner;a.ending=false;}
   a.w=Math.max(0,Math.min(1,a.w+(on&&!a.ending?1:-1)*dt*2.2));if(a.w<=0){a.ending=false;if(on){a.pose=a.goal.pose;a.role=a.goal.role;a.partner=a.goal.partner;}else if(a.pose){a.pose=null;drop(a);}}
   if(a.w>0&&a.pose){n++;stats.poses[a.pose]=(stats.poses[a.pose]||0)+1;}
   // turning toward a spectacle (and a step closer or back), turning away for those who leave
   // gathering loosely (reactor gatherMove): those who come closer WALK in on their own slightly different line (r.arc), then face it; afterwards they walk back
   const r=a.react;if(r&&r.mode!=='ignore'&&a.node.isEnabled()){const wp=a.node.getAbsolutePosition(),tx=r.x-wp.x,tz=r.z-wp.z,len=Math.hypot(tx,tz)||1,ca=Math.cos(r.arc||0),sa=Math.sin(r.arc||0);
    a.ux=(tx*ca-tz*sa)/len;a.uz=(tx*sa+tz*ca)/len;const goal=r.mode==='leave'?0:(r.move??(r.step||0)*.8),to=Math.atan2(tx,tz)+(r.mode==='leave'?Math.PI:0);
    if(!a.reacting){a.reacting=r.event;a.homing=false;if(a.extra.walker!==true&&a.f.play&&(r.mode==='film'||r.mode==='watch')){if(!a.restore)a.restore=a.f.clip;a.f.play('idle');}}
    gather(a,dt,clock>=r.from+.3?goal:0,to);}
   else if(a.reacting||a.off){if(a.reacting){a.reacting=null;a.homing=true;}gather(a,dt,0,null);
    if(!a.off&&a.yaw===null){a.homing=false;if(a.restore){a.f.play(a.restore);a.restore=null;}}}
   else a.yaw=null;
   }
  // the pair-selfie couple face the same way, the friend on the holder's left
  for(const a of list){if(a.pose!=='pair-selfie'||a.role!=='holder'||a.w<=0)continue;const b=list.find(x=>x.id===a.partner);if(!b||b.node.rotationQuaternion||a.node.rotationQuaternion)continue;
   const pa=a.node.getAbsolutePosition(),pb=b.node.getAbsolutePosition(),dx=pb.x-pa.x,dz=pb.z-pa.z;const face=Math.atan2(dx,dz)-Math.PI/2;   // b on a's right when both face `face` (a holds the bracer out to the left)
   for(const x of [a,b]){if(!xform.some(e=>e[0]===x.node))xform.push([x.node,x.node.position.clone(),x.node.rotation.y]);const cur=x.node.rotation.y,dd=Math.atan2(Math.sin(face-cur),Math.cos(face-cur));x.node.rotation.y=cur+dd*Math.min(1,a.w*1.1);}
   // the friend steps in close (a friend standing further off than 0.6 m comes most of the way, eased with the pose)
   const gap=Math.hypot(dx,dz),step=Math.max(0,gap-.6)*Math.min(1,a.w);if(step>.01&&!b.node.parent?.rotationQuaternion){b.node.position.x-=dx/gap*step;b.node.position.z-=dz/gap*step;}}
  stats.posed=n;
  // flashes
  for(let i=kit.flashes.length-1;i>=0;i--){const s=kit.flashes[i];s.t+=dt;const k=s.t/.16;if(k>=1){s.f.dispose();kit.flashes.splice(i,1);continue;}s.f.scaling.setAll(s.size*Math.sin(Math.PI*Math.min(1,k))*(s.dim?.4:1)+.001);}
  for(const [t,T] of Object.entries(kit.src))if(TIERS[t])for(const k of ['panel','camera'])T[k].tex.vOffset=(clock*.03)%1;
  kit.src.eye.mat.alpha=TIERS.v3.alpha*(.75+.25*Math.sin(clock*17.3)*Math.sin(clock*5.9));for(const [tier,T] of Object.entries(kit.src)){if(!TIERS[tier]||TIERS[tier].eye)continue;const fl=.88+.12*Math.sin(clock*23.7+tier.length)*Math.sin(clock*7.1);T.panel.mat.alpha=TIERS[tier].alpha*fl;T.camera.mat.alpha=TIERS[tier].alpha*1.15*fl;}
  stats.ms=performance.now()-t0;}
 function after(){const t0=performance.now();if(!kit)return;
  for(const a of agents.values()){if(!a||!a.pose||a.w<=0)continue;const fig=figOf(a);if(!fig||!a.node.isEnabled()){drop(a);continue;}try{pose(a,fig);}catch(e){console.warn('[VOID npc device]',e);a.fig=null;drop(a);}}
  stats.msPose=performance.now()-t0;stats.msFrame=stats.ms;stats.ms+=stats.msPose;}
 const ease=w=>w*w*(3-2*w);
 // The pieces a person shows while using it: the cuff and its emitter, the cone of light and the panel (reading) or the camera panel (viewfinder).
 function show(a,kind,on){const key='m_'+kind;if(on){if(a[key]&&a.pieceTier!==a.tier){for(const k of ['cuff','emitter','cone','panel','camera','eye','dish'])if(a['m_'+k]){give(a.pieceTier,k,a['m_'+k]);a['m_'+k]=null;}}a.pieceTier=a.tier;if(!a[key])a[key]=take(a.tier,kind);return a[key];}
  if(a[key]){give(a.pieceTier,kind,a[key]);a[key]=null;}return null;}
 function pose(a,fig){const w=ease(a.w),body=bodyFrame(a.node),up=B.Axis.Y,h=fig.bones.Head;refresh(h);
  const side=P(fig.bones.RightArm).subtract(P(fig.bones.LeftArm));side.y=0;side.normalize();const left=side.scale(-1);   // `side`: toward the person's own right
  const head0=P(h),eye0=head0.add(up.scale(.09)).add(body.fwd.scale(.07)),chest=fig.bones.Spine2?P(fig.bones.Spine2):head0.add(up.scale(-.42));
  const tier=a.tier,eyeCam=TIERS[tier].eye,r=a.react,s=a.session||{},partner=a.partner&&[...agents.values()].find(x=>x&&x.id===a.partner);
  const shL=P(fig.bones.LeftArm),armL=B.Vector3.Distance(shL,P(fig.bones.LeftForeArm))+B.Vector3.Distance(P(fig.bones.LeftForeArm),P(fig.bones.LeftHand));
  const subject=()=>{if(r)return new B.Vector3(r.x,r.y,r.z);if(a.pose==='food-photo'&&a.dishAt)return a.dishAt;if(a.pose==='food-photo')return new B.Vector3(eye0.x+body.fwd.x*.6,eye0.y-.8,eye0.z+body.fwd.z*.6);const t=a.extra.target?.();if(t)return t;return eye0.add(body.fwd.scale(4)).add(up.scale(-.1));};
  if(eyeCam){   // V3 // SHADOW: streamed into the eye. One eye glows faintly; no arm moves; at most a slight tilt of the head or a stare at the subject
   for(const k of ['cuff','emitter','cone','panel','camera','dish'])show(a,k,false);
   if(a.pose==='scroll')lookAt(fig,eye0.add(body.fwd.scale(1.2)).add(up.scale(-.35)),w*.45,body);else if(a.pose!=='watch')lookAt(fig,subject(),w*.6,body);
   refresh(h);const hm=h.getWorldMatrix(),gl=P(h).add(B.Vector3.TransformNormal(up,hm).normalize().scale(.085)).add(B.Vector3.TransformNormal(B.Axis.Z,hm).normalize().scale(.11)).add(side.scale(.031));
   if(a.pose==='watch')show(a,'eye',false);else{const g=show(a,'eye',true);g.position.copyFrom(gl);g.scaling.setAll(.028*w+.001);}
   for(const t of s.flash||[])if(a.session&&a.session.t>=t&&!(a.flashed||[]).includes(t)){(a.flashed=a.flashed||[]).push(t);spark(gl,.02,true);}
   if(!a.session)a.flashed=null;return;}
  let panel=null,cam=false,cuff=true,lift=.08,dish=false;   // panel: where the hologram stands; cam: the viewfinder rather than the reading panel; lift: how high above the emitter
  const poleL=left.add(up.scale(-.45)).add(body.fwd.scale(-.15));
  switch(a.pose){
   case 'scroll':{   // the left forearm across the chest, the panel rising from the bracer toward the face, the head down to it; the right hand swipes now and then
    reach(fig,'Left',chest.add(body.fwd.scale(.25)).add(up.scale(-.08)).add(side.scale(.12)),left.add(up.scale(-.35)).add(body.fwd.scale(.15)),w,up.scale(.1));
    panel='read';a.swipe+=1/60;const sw=Math.max(0,Math.sin(a.swipe*.9))**10;
    if(sw>.02&&!a.moving)reach(fig,'Right',chest.add(body.fwd.scale(.36)).add(up.scale(.2)).add(side.scale(.02+sw*.06)),side.add(up.scale(-.6)),w*sw*.85,up.scale(.3));
    break;}
   case 'watch':{cuff=false;lookAt(fig,subject(),w,body);break;}
   case 'food-photo':if(a.extra.dish){   // a diner: the bowl held out low in the right hand, the frame held between the eye and the bowl, looking down through it
    const bowlAt=chest.add(body.fwd.scale(.4)).add(up.scale(-.32)).add(side.scale(.06));reach(fig,'Right',bowlAt,side.add(up.scale(-.7)),w,up.scale(.6));refresh(fig.bones.RightHand);
    const bw=P(fig.bones.RightHand).add(up.scale(.05)).add(body.fwd.scale(.03)),b=show(a,'dish',true);b.position.copyFrom(bw);b.rotation.y=body.yaw;b.scaling.setAll(Math.max(.001,Math.min(1,w*1.4)));a.dishAt=bw;dish=true;
    const pcW=eye0.add(bw.subtract(eye0).scale(.42));reach(fig,'Left',pcW.subtract(up.scale(.17)),poleL,w,up.scale(.5));panel='cam';cam=true;lift=.11;break;}
   // falls through: someone at a bar photographs their drink on the counter
   case 'photo':case 'film':{const S=subject();const dir=S.subtract(shL).normalize();reach(fig,'Left',shL.add(dir.scale(armL*(a.pose==='food-photo'?.8:.9))).add(side.scale(.06)),poleL,w,up.scale(.5));panel='cam';cam=true;lift=.11;break;}
   case 'selfie':{   // the arm out to the front-left, the panel turned back to the face; the right hand up by the face (a peace sign, as near as a rig without finger poses gets)
    const out=body.fwd.scale(.62).add(left.scale(.42)).add(up.scale(.32)).normalize();reach(fig,'Left',shL.add(out.scale(armL*.93)),poleL,w,up.scale(.4));
    reach(fig,'Right',head0.add(side.scale(.13)).add(body.fwd.scale(.13)).add(up.scale(-.02)),side.add(up.scale(-.9)),w*.9,up.scale(.6));panel='cam';cam=true;lift=.1;break;}
   case 'pair-selfie':{const pf=partner&&figOf(partner),ph=pf?P(pf.bones.Head):null;
    if(a.role==='friend'){if(ph)lean(fig,ph,w,.3);const pc=partner?.m_camera;lookAt(fig,pc?pc.position:eye0.add(body.fwd.scale(.5)),w,body);cuff=false;break;}
    const mid=ph?head0.add(ph).scale(.5):head0,T=mid.add(body.fwd.scale(.55)).add(left.scale(.12)).add(up.scale(.2));reach(fig,'Left',T,poleL,w,up.scale(.4));if(ph)lean(fig,ph,w*.5);panel='cam';cam=true;lift=.1;break;}
  }
  // the bracer on the left forearm, near the wrist; its emitter on the side facing the panel
  const fL=fig.bones.LeftForeArm,hL=fig.bones.LeftHand;refresh(hL);const elbow=P(fL),wrist=P(hL),axis=wrist.subtract(elbow).normalize(),at=elbow.add(wrist.subtract(elbow).scale(.78));
  if(cuff){const c=show(a,'cuff',true);c.position.copyFrom(at);c.rotationQuaternion=c.rotationQuaternion||new B.Quaternion();let x=B.Vector3.Cross(axis,up);if(x.lengthSquared()<1e-4)x=side.clone();x.normalize();basis(x,axis,B.Vector3.Cross(x,axis),c.rotationQuaternion);c.scaling.setAll(Math.min(1,.6+w));}
  else show(a,'cuff',false);
  refresh(h);const hm=h.getWorldMatrix(),eye=P(h).add(B.Vector3.TransformNormal(up,hm).normalize().scale(.09)).add(B.Vector3.TransformNormal(B.Axis.Z,hm).normalize().scale(.07));
  if(cuff&&panel){
   // the emitter: on top of the bracer (the side toward the panel's rise)
   let n=up.subtract(axis.scale(B.Vector3.Dot(up,axis)));if(n.lengthSquared()<1e-4)n=eye.subtract(at);n.normalize();const em=at.add(n.scale(.047));
   const e=show(a,'emitter',true);e.position.copyFrom(em);e.rotationQuaternion=e.rotationQuaternion||new B.Quaternion();basis(B.Vector3.Cross(n,axis).normalize(),n,axis,e.rotationQuaternion);e.scaling.setAll(w);
   // the panel above the emitter, a little toward the eye, square to the line from the eye; it unfolds with the pose
   const toEye=eye.subtract(em);toEye.y=0;const pc=em.add(up.scale(lift+.06)).add(cam?B.Vector3.Zero():body.fwd.scale(.07));void toEye;const z=pc.subtract(eye).normalize();let px=B.Vector3.Cross(up,z);if(px.lengthSquared()<1e-4)px=side.clone();px.normalize();const py=B.Vector3.Cross(z,px);
   const pw=(cam?.2:.27)*(a.flick>clock&&Math.random()<.45?.3:1),k=.25+.75*w,pm=show(a,cam?'camera':'panel',true);show(a,cam?'panel':'camera',false);pm.position.copyFrom(pc);pm.rotationQuaternion=pm.rotationQuaternion||new B.Quaternion();basis(px,py,z,pm.rotationQuaternion);pm.scaling.set(pw*k,pw*w,1);
   // the faint cone of light from the emitter to the panel's lower edge
   const base=pc.subtract(py.scale(pw*.72*w*.5)),dir=base.subtract(em),len=dir.length();if(len>.01){const cy=dir.scale(1/len),cx=px.subtract(cy.scale(B.Vector3.Dot(px,cy))).normalize(),cz=B.Vector3.Cross(cx,cy);
    const cn=show(a,'cone',true);cn.position.copyFrom(em);cn.rotationQuaternion=cn.rotationQuaternion||new B.Quaternion();basis(cx,cy,cz,cn.rotationQuaternion);cn.scaling.set(pw*k*.7,len,.02+.01*w);}
   // the reader looks down at it; a camera user at the subject through it (the viewfinder is in line); a selfie at the panel
   if(a.pose==='scroll')lookAt(fig,pc,w,body);else if(a.pose==='selfie'||a.pose==='pair-selfie')lookAt(fig,pc,w,body);else lookAt(fig,pc.add(pc.subtract(eye).normalize().scale(2)),w,body);
   for(const t of s.flash||[])if(a.session&&a.session.t>=t&&!(a.flashed||[]).includes(t)&&w>.8){(a.flashed=a.flashed||[]).push(t);spark(pc,.08,tier==='v3');}
   if(r&&r.mode==='film'&&Math.random()<.003)spark(pc,.05,true);}
  else for(const k of ['emitter','cone','panel','camera'])show(a,k,false);
  if(eyeCam&&PHOTO.has(a.pose))for(const t of s.flash||[])if(a.session&&a.session.t>=t&&!(a.flashed||[]).includes(t)){(a.flashed=a.flashed||[]).push(t);spark(eye0.add(side.scale(.035)),.012,true);}
  if(!dish){show(a,'dish',false);a.dishAt=null;}
  if(!a.session)a.flashed=null;
 }
 function restore(){for(const [b,q] of saved)if(!b.isDisposed?.())b.rotationQuaternion.copyFrom(q);saved.clear();for(const [n,p,ry] of xform)if(!n.isDisposed()){n.position.copyFrom(p);n.rotation.y=ry;}xform=[];}
 function attach(sc){try{if(scene&&!scene.isDisposed){for(const [o,h] of obs)o.remove(h);}}catch{}obs=[];
  for(const a of agents.values())if(a)drop(a);agents.clear();kit=null;saved.clear();xform=[];scene=sc;if(!sc)return;
  obs.push([sc.onBeforeAnimationsObservable,sc.onBeforeAnimationsObservable.add(()=>{const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;try{before(dt);}catch(e){console.warn('[VOID npc device]',e);}})]);
  obs.push([sc.onAfterAnimationsObservable,sc.onAfterAnimationsObservable.add(()=>{try{after();}catch(e){console.warn('[VOID npc device]',e);}})]);
  obs.push([sc.onAfterRenderObservable,sc.onAfterRenderObservable.add(()=>{try{restore();}catch{}})]);}
 let dead=false;if(typeof update==='function'){const prior=update;update=function(...args){const r=prior(...args);if(dead)return r;try{const sc=root.VoidBabylon?.scene||null;if(sc&&!B&&root.BABYLON){B=root.BABYLON;M=new B.Matrix();qT=new B.Quaternion();ID=B.Quaternion.Identity();V=B.Vector3;}if(sc!==scene&&B)attach(sc&&!sc.isDisposed?sc:null);}catch{}return r;};}
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
  const dur=opts.duration??14,ev=spectacle({x:cx,z:cz,radius:opts.radius??config.spectacle.radius,kind:'argument',duration:dur});
  staged={made,t:0,dur,ev,x:cx,z:cz};
  // the two of them: a jab of the arm toward the other, a lean in, turns of the shoulder (their talk clip underneath)
  const tick=()=>{if(!staged)return;staged.t+=Math.min(.1,scene.getEngine().getDeltaTime()/1000);if(staged.t>dur+1){stopArgument();return;}for(const [i,m] of staged.made.entries()){const k=Math.sin(staged.t*(i?3.3:2.7)+i*2);m.node.rotation.y=m.yaw+k*.18;m.node.rotation.x=Math.max(0,k)*.05;}};
  staged.obs=scene.onBeforeRenderObservable.add(tick);
  return {x:cx,z:cz,people:made.map(m=>m.look),reactions:ev.reactions};}
 function stopArgument(){if(!staged)return;try{scene.onBeforeRenderObservable.remove(staged.obs);}catch{}for(const m of staged.made){try{m.anim?.dispose?.();m.node.dispose();}catch{}}staged=null;}
 const api={...pure,detach(){dead=true;stopArgument();attach(null);},tag,enlist,distracted,startle,spectacle,stageArgument,stopArgument,reactionOf,holds,pace,sessionOf,
  stats:()=>({...stats,poses:{...stats.poses},tiers:{...stats.tiers},staged:staged?{x:staged.x,z:staged.z,t:staged.t}:null}),
  agents:()=>[...agents.values()].filter(Boolean).map(a=>({id:a.id,key:a.key,kind:a.kind,tier:a.tier,monk:a.monk,pose:a.pose,w:a.w,visible:a.visible,d:a.d,react:a.react?a.react.mode:null,session:a.session?a.session.pose:null,holo:!!a.m_panel,frame:!!a.m_camera,cuff:!!a.m_cuff,eye:!!a.m_eye,dish:!!a.m_dish,off:+(a.off||0).toFixed(2),gathering:!!a.gathering,node:a.node})),
  scheduler:sched,reactor,get scene(){return scene;},_agent:node=>[...agents.values()].find(a=>a&&a.node===node)||null};
 root.VoidNPCDevice=api;
 root.VoidCrowdReact={spectacle,stageArgument,stopArgument,reactionOf,holds,pace,tag,get active(){return reactor.active;}};
})(typeof globalThis!=='undefined'?globalThis:this);
