/* VR experience: Play in a Bedroom. A private apartment bedroom high above NeoChinatown at night, with an original adult
   companion chosen at the terminal (Female or Male, then a model from the companion registry in vr-companions.js; Seren
   and Kai to begin with). The companion keeps you in view wherever you go (head, neck and chest turn toward you; the
   body turns when you go round), has their own initiative (comes over, talks, invites you to sit, dance or lie back,
   respects a "not now", wanders, looks out of the window), flirts with gestures (a blown kiss, a coy look, a laugh),
   sits with you, dances, holds hands and, when the moment is right and you choose it, shares a kiss. Everything is
   optional and non-explicit; you can simply enjoy the room. The room and the city outside are built in vr-suite-room.js.
   One companion, or two together (Ava and Eva): each has their own looks, brain, place on the sofa and spot by the
   window, keeps clear of the other, and takes "Follow me", "Stay here" and "Go back to your spot".
   DRAFT: Seren's and Kai's names and all their lines are Claude's placeholders for David's review. Unvoiced.
   Characters: MakeHuman (CC0); animation: Rokoko free mocap, Quaternius (CC0) and Mixamo. */
(function(){
 const {kit,spot}=VoidVRKit,C=globalThis.VoidVRCompanions||require('./vr-companions.js');
 // The apartment: 12 x 10 m, the bed against the fluted wall to the north, floor-to-ceiling glass to the east with a
 // sliding door onto a balcony, the lounge to the west, the desk and shelves to the south.
 // The sofa seat is angled toward the cushion beside it, so a companion sitting there is in view.
 const seats={sofa:{x:-4.4,z:-1.2,yaw:.4,eye:1.1},sofa2:{x:-3.6,z:.2,yaw:Math.PI/2,eye:1.1},bed:{x:1.2,z:3.2,yaw:Math.PI/2,eye:1.08},bed2:{x:-1.2,z:3.2,yaw:-Math.PI/2,eye:1.08},armchair:{x:4.3,z:-3.4,yaw:.9,eye:1.08},balcony:{x:8.4,z:0,yaw:Math.PI/2,eye:1.6}};
 // Each companion of a party has a slot: their spot by the window, their place on the sofa (and where they walk to
 // before sitting) and the side they keep when following you. With two, you sit between them on the sofa.
 const slots=[{home:[3.6,.3],sofa:{x:-4.32,z:.2,from:[-3.7,.55]},side:1},{home:[3.6,-1.5],sofa:{x:-4.32,z:-1.55,from:[-3.7,-1.95]},side:-1}];
 const pairSeat={x:-4.4,z:-.65,yaw:Math.PI/2,eye:1.1};
 function layout(opts){const wall=(id,x,z,w,d)=>({id:'vr-'+id,position:[x,1.5,z],size:[w,3,d]});
  return {id:'vr-suite',name:'VR · PLAY IN A BEDROOM',bounds:[11,7],spawn:[-3,1.7,-3.9],yaw:.5,music:null,signs:[],
   solids:[wall('w-n',0,5.1,12.4,.3),wall('w-s',0,-5.1,12.4,.3),wall('w-w',-6.1,0,.3,10),wall('w-e1',6.1,-3.1,.3,3.8),wall('w-e2',6.1,3.1,.3,3.8),
    {id:'vr-rail',position:[8.95,.55,0],size:[.2,1.1,5.4]},{id:'vr-rail-n',position:[7.5,.55,2.75],size:[3,1.1,.2]},{id:'vr-rail-s',position:[7.5,.55,-2.75],size:[3,1.1,.2]},
    {id:'vr-bed',position:[0,.4,3.55],size:[3,.8,2.75]},{id:'vr-nightstand-l',position:[-2.15,.4,4.72],size:[.66,.8,.5]},{id:'vr-nightstand-r',position:[2.15,.4,4.72],size:[.66,.8,.5]},
    {id:'vr-sofa',position:[-4.72,.4,-.5],size:[1.05,.8,2.7]},{id:'vr-table',position:[-2.8,.2,-.7],size:[.7,.4,1.25]},{id:'vr-armchair',position:[4.3,.4,-3.4],size:[.95,.8,.95]},
    {id:'vr-desk',position:[1.4,.4,-4.7],size:[1.8,.8,.6]},{id:'vr-credenza',position:[-2.3,.4,-4.78],size:[2.6,.8,.5]},{id:'vr-lamp',position:[-5.5,.4,-2.6],size:[.35,.8,.35]},
    {id:'vr-plant-n',position:[5.3,.4,4.35],size:[.6,.8,.6]},{id:'vr-plant-s',position:[-5.35,.4,-4.3],size:[.6,.8,.6]}],
   interactions:[spot('companion','TALK',0,0,6),...(C.party(opts||{}).length>1?[spot('companion-2','TALK',0,0,6)]:[]),spot('lamp','MOOD LIGHTING',-2.8,4.2,1.8),spot('music','MUSIC',1.4,-3.9,1.8),spot('curtains','CURTAINS',5.2,-2.6,2),
    spot('sit-sofa','SIT ON THE SOFA',-3.8,-1.2,1.8),spot('sit-bed','SIT ON THE BED',1.9,3.2,1.8),spot('sit-armchair','SIT IN THE ARMCHAIR',3.8,-2.8,1.6),spot('balcony','LEAN ON THE BALCONY RAIL',8.3,0,2.2)]};}
 async function build(ctx){
  const k=kit(ctx),B=k.B,api=ctx.api,party=C.party(ctx.opts);if(!party.length)party.push(C.resolve({choice:'f'}));
  // Night: little sky light, a violet glow from the city through the glass, deep haze over the streets.
  k.light({clear:[.012,.008,.02],fog:[.14,.06,.16],fogDensity:.0028,sunColor:[.5,.42,.85],sunIntensity:.4,sunDir:[-1,-.35,.1],sky:[.5,.38,.62],ground:[.18,.11,.15],ambient:1,exposure:1.45,contrast:1.1,env:.3});
  const room=await VoidVRSuiteRoom.build(k,ctx);k.every((dt,t)=>room.tick(dt,t));
  const moods={warm:{label:'Warm'},rose:{label:'Rose'},night:{label:'Night'},candle:{label:'Candlelight'}};
  function mood(name){room.mood(name);k.mood=moods[name]?name:'rose';}
  mood(ctx.settings.mood||'rose');room.music(ctx.settings.music||'lounge');
  const blockedAt=(x,z)=>VoidExplorer.blocked(x,z,walkingLocation||layout(ctx.opts));
  // ---- Shared by everyone in the room: remarks as a subtitle, the dialogue panel and its choice menu ----
  const line=document.createElement('div');line.id='vr-companion-line';line.setAttribute('aria-live','polite');document.body.append(line);let lineTime=0;
  function showLine(name,text){line.innerHTML='<b>'+name+'</b> '+text.replace(/</g,'&lt;');line.classList.add('show');lineTime=Math.min(7,2.5+text.length*.055);}
  k.every(dt=>{if(lineTime>0){lineTime-=dt;if(lineTime<=0)line.classList.remove('show');}});
  // A companion's line in the game's dialogue panel. With no line (Ava and Eva have none yet) there's no panel at
  // all: whatever follows the line happens straight away.
  function say(comp,text,done,label='CONTINUE'){if(!text){done?.();return;}talk('',[{who:comp.who.name,text}],()=>{done?done():resumeWalking();},label);comp.talking();comp.brain.note('talked');}
  let choices=null;
  // The choice panel (vr.css: compact, opaque, beside the room rather than across it). Options may carry a group
  // (Talk / Together / Leave); arrows, WASD or the d-pad move the highlight, Enter / Space / E or A choose, Escape or B
  // closes (the last option: "Never mind" / "Not now"). Without a line to open with, the panel shows a plain
  // prompt (not the companion speaking).
  function ask2(comp,text,opts){comp.c.youSeat=mode==='vr-seated'?{...api.session.seat}:null;
   if(text)say(comp,text,()=>{},'');else talk('',[{who:'',text:'With '+comp.who.name+'. What would you like to do?'}],()=>{},'');
   speech.shown=speech.lines[0].text.length;$('speech-next').style.display='none';screen.querySelector('.dialogue-window')?.classList.add('choice-menu','vr-companion-menu');
   choices=opts;let html='',group=null;opts.forEach(([l,,g],i)=>{if(g&&g!==group){html+=(group?'</div>':'')+'<div class="vr-choice-group" role="group" aria-label="'+g+'"><div class="vr-choice-head">'+g.toUpperCase()+'</div>';group=g;}
    html+='<button data-action="vr-choice:'+i+'" role="menuitem" class="vr-choice'+(i===opts.length-1?' quiet':'')+'">'+l.toUpperCase()+'</button>';});if(group)html+='</div>';
   screen.querySelector('.speech-controls')?.insertAdjacentHTML('beforeend','<div class="vr-choices" role="menu">'+html+'</div>');focusChoice(0);}
  const choiceButtons=()=>[...screen.querySelectorAll('.vr-companion-menu button.vr-choice')];
  function focusChoice(i){const all=choiceButtons();if(!all.length)return;const b=all[(i+all.length)%all.length];b.focus({preventScroll:true});b.scrollIntoView({block:'nearest'});}
  // Moves the highlight to the nearest option in a direction (the options sit in a grid on wide screens).
  function moveChoice(dx,dy){const all=choiceButtons(),cur=all.indexOf(document.activeElement);if(cur<0)return focusChoice(0);const a=all[cur].getBoundingClientRect();let best=null;
   for(const [i,b] of all.entries()){if(i===cur)continue;const r=b.getBoundingClientRect(),vx=r.left-a.left,vy=r.top-a.top;if(dx&&Math.sign(vx)!==dx||dy&&Math.sign(vy)!==dy)continue;if(dx&&Math.abs(vy)>a.height*1.5&&!dy)continue;
    const d=Math.hypot(vx*(dy?3:1),vy*(dx?3:1));if(!best||d<best.d)best={i,d};}
   if(best)focusChoice(best.i);else if(dy)focusChoice(dy>0?0:all.length-1);}
  function chooseFocused(){const b=document.activeElement?.closest?.('button.vr-choice');(b||choiceButtons()[0])?.click();}
  function closeChoices(){const all=choiceButtons();all[all.length-1]?.click();}
  function onMenuKey(e){if(!choices||!screen.querySelector('.vr-companion-menu'))return;const k=e.key;
   const map={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],W:[0,-1],S:[0,1],A:[-1,0],D:[1,0]};
   if(map[k]){moveChoice(...map[k]);}else if(k==='Enter'||k===' '||k==='e'||k==='E'){chooseFocused();}else if(k==='Escape'){closeChoices();}else return;e.preventDefault();e.stopImmediatePropagation();}
  window.addEventListener('keydown',onMenuKey,true);
  let padPrev=[];k.every(()=>{if(!choices)return padPrev=[];const pad=[...(navigator.getGamepads?.()||[])].find(p=>p&&p.connected!==false);if(!pad)return;const now=pad.buttons.map(b=>b.pressed),ly=pad.axes[1]||0,lx=pad.axes[0]||0;
   now[12]=now[12]||ly<-.6;now[13]=now[13]||ly>.6;now[14]=now[14]||lx<-.6;now[15]=now[15]||lx>.6;const hit=i=>now[i]&&!padPrev[i];
   if(hit(12))moveChoice(0,-1);else if(hit(13))moveChoice(0,1);else if(hit(14))moveChoice(-1,0);else if(hit(15))moveChoice(1,0);else if(hit(0))chooseFocused();else if(hit(1))closeChoices();padPrev=now;});
  screen.addEventListener('click',onChoice);
  function onChoice(e){const a=e.target.closest('button')?.dataset.action;if(!a?.startsWith('vr-choice:')||!choices)return;const f=choices[+a.slice(10)][1];choices=null;speech=null;f();}
  // The kiss: the companion leans in and the view softens into a warm glow for a moment (nothing explicit).
  k.overlayFn=(g,W,H)=>{if(!(k.kiss>0))return;const a=Math.sin(Math.min(1,k.kiss/1.6)*Math.PI);g.save();const r=g.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.9);r.addColorStop(0,'rgba(255,170,150,'+a*.25+')');r.addColorStop(1,'rgba(40,10,20,'+a*.85+')');g.fillStyle=r;g.fillRect(0,0,W,H);g.restore();};
  k.every(dt=>{if(k.kiss>0)k.kiss-=dt;});
  // ---- Two companions never aim for the same spot: a destination closer than ROOM_GAP to where another one is or is
  // going moves round them (to a free spot, keeping clear of the furniture) ----
  const comps=[],ROOM_GAP=.9,others=me=>comps.filter(o=>o!==me);
  function spaced(me,x,z){for(const o of others(me))for(const [ox,oz] of [o.at(),o.dest()]){const dx=x-ox,dz=z-oz,d=Math.hypot(dx,dz);if(d>=ROOM_GAP)continue;
    const ux=d>.05?dx/d:me.slot?-1:1,uz=d>.05?dz/d:0;
    for(const a of [0,.8,-.8,1.6,-1.6,2.4,-2.4]){const nx=ox+(ux*Math.cos(a)-uz*Math.sin(a))*ROOM_GAP,nz=oz+(ux*Math.sin(a)+uz*Math.cos(a))*ROOM_GAP;if(!blockedAt(nx,nz)){x=nx;z=nz;break;}}}
   return [x,z];}
  const party2=party.length>1;
  // ---- Each companion: their own model, looks, animation, attention, brain and commands (vr-companions.js holds
  // the registry, settings, brain, tracking maths and paths) ----
  async function companion(who,S,slot){
   const L=who.dialogue||{},cfg=C.settings(who),look=who.model,mem={},home=S.home,talks=C.speaks(who),tag=slot?'-'+(slot+1):'',self={who,slot,cfg};
   const container=await VoidAssets.loadContainer({src:'assets/models/crowd/'+C.file(who)},k.scene,ctx.task,'vr:'+look);(k._containers||(k._containers=[])).push(container);
   const inst=container.instantiateModelsToScene(n=>look+'-'+n,false,{doNotInstantiate:true}),node=new B.TransformNode('vr-companion'+tag,k.scene),asset=new B.TransformNode('vr-companion-asset'+tag,k.scene);node.parent=k.parent;VoidAssets.ownInstance(inst,node);asset.parent=node;for(const r of inst.rootNodes)r.parent=asset;
   for(const g of inst.animationGroups)g.stop();node.metadata={animationGroups:inst.animationGroups,companion:who.id};for(const m of node.getChildMeshes())m.isPickable=false;
   // Looks (vr-companions.js): the saved or default outfit, hairstyle, glasses and colours. Parts are shown or hidden;
   // colour variants are separate textures loaded the first time they are chosen.
   const lookParts=new Set(C.looks(who).flatMap(g=>g.options.flatMap(o=>o.parts||[]))),partOf=m=>{const n=m.name.replace(/_primitive\d+$/,'');let hit=null;for(const p of lookParts)if(n.endsWith('_'+p)&&(!hit||p.length>hit.length))hit=p;return hit;};// the longest part wins: "piping_jacket" is not "jacket"
   const materials=name=>{const out=new Set();for(const m of node.getChildMeshes())for(const x of m.material?.subMaterials||[m.material])if(x?.name===name)out.add(x);return [...out];};
   let picked=C.savedLooks(who);const own={},ownMat={},loaded={};
   function variant(file){return loaded[file]??=(async()=>{const r=await fetch('void-runner/assets/models/crowd/'+look+'/'+file+'.vrtex');if(!r.ok)throw Error('Look texture HTTP '+r.status);
    // A variant is a scrambled PNG, JPEG or KTX2 (kept compressed on the GPU, like the model's own textures).
    const bytes=new Uint8Array(await VoidAssets.open(await r.arrayBuffer())),ktx2=bytes[0]===0xab&&bytes[1]===0x4b&&bytes[2]===0x54&&bytes[3]===0x58;
    const src=URL.createObjectURL(new Blob([bytes],{type:ktx2?'image/ktx2':bytes[0]===0x89?'image/png':'image/jpeg'}));if(ktx2)VoidAssets.useKTX2Locally();
    return new Promise((ok,no)=>{const t=new B.Texture(src,k.scene,{noMipmap:false,invertY:false,samplingMode:B.Texture.TRILINEAR_SAMPLINGMODE,forcedExtension:ktx2?'.ktx2':undefined,
     onLoad:()=>{URL.revokeObjectURL(src);ok(t);},onError:m=>{URL.revokeObjectURL(src);no(Error(m||'Look texture failed'));}});});})();}
   async function wear(key,id){if(key)picked={...picked,[key]:C.option(who,key,id)?.id};const on=C.wears(who,picked),want=C.lookTextures(who,picked);
    for(const m of node.getChildMeshes()){const p=partOf(m);if(p)m.setEnabled(on(p));}
    if(api.session)for(const [g,v] of Object.entries(C.chosen(who,picked)))api.session.settings['look-'+who.id+'-'+g]=v;
    await Promise.all(C.variantTextures(who).flatMap(name=>materials(name).map(async mat=>{if(!(name in own))own[name]=mat.albedoTexture;const file=want[name];if(!file){mat.albedoTexture=own[name];return;}
     try{const t=await variant(file);if(C.lookTextures(who,picked)[name]!==file)return;t.hasAlpha=!!own[name]?.hasAlpha;t.coordinatesIndex=own[name]?.coordinatesIndex||0;mat.albedoTexture=t;}catch(e){console.warn('[VR companion look]',file,e.message);}})));
    // Material values (a glossier finish) for the chosen looks; materials no look sets keep their own.
    const wantMat=C.lookMaterials(who,picked);
    for(const name of C.variantMaterials(who))for(const mat of materials(name)){const base=ownMat[name]??={roughness:mat.roughness};mat.roughness=wantMat[name]?.roughness??base.roughness;}
    // Variants no longer worn give their GPU memory back (choosing one again reloads it, under a tenth of a second).
    const inUse=new Set(Object.values(C.lookTextures(who,picked)));
    for(const file of Object.keys(loaded))if(!inUse.has(file)){const p=loaded[file];delete loaded[file];p.then(t=>t.dispose(),()=>{});}
    return C.chosen(who,picked);}
   await wear();
   const has=n=>VoidCrowd.clipIn(look,n)===n,clip=role=>C.clipFor(who,role,has);
   // A gesture for a role, picked at random from the companion's own list (their personality).
   const gestureFor=role=>{const own=(who.clips[role]||[]).filter(has);return own.length?own[Math.floor(Math.random()*own.length)]:clip(role);};
   const anim=VoidCrowd.animate(node,look,'idle');node.position.set(home[0],0,home[1]);node.rotation.y=-Math.PI/2;
   room.follow(node,()=>c.sitting||c.reclining?1.25:1.72);
   // mode: 'free' (their own initiative), 'follow' (they keep near you) or 'stay' (they keep their place).
   const c={state:'idle',path:[],then:null,affection:0,sitting:false,dancing:false,reclining:false,busy:0,turning:false,greeted:false,watch:0,mode:'free'};
   const loop=()=>c.reclining?'recline':c.sitting?(Math.random()<.35?clip('sitAlt'):'sit'):c.dancing?c.danceClip:'idle';
   const idle=()=>anim.play(loop());
   // One-shot gesture, then back to whatever they were doing. Keeps them "busy" (the brain waits) meanwhile.
   function gesture(role){if(c.state==='walk')return;const name=typeof role==='string'&&has(role)?role:gestureFor(role),len=anim.playOnce(name,loop());if(len)c.busy=Math.max(c.busy,len);
    if(['greet','flirt','laugh','confident','shy'].includes(role)){self.smile?.(1.2+Math.random()*1.5);for(const o of others(self))o.react?.(self);}}
   const at=()=>[node.position.x,node.position.z],dest=()=>c.state==='walk'&&c.path.length?c.path[c.path.length-1]:at();
   // Walking: a path round the furniture (A* on the room's collision), then `then` on arrival. Destinations keep
   // clear of the other companion unless `exact` (a seat).
   function walkTo(x,z,then,exact){if(!exact)[x,z]=spaced(self,x,z);const p=C.path(at(),[x,z],blockedAt)||[[x,z]];stand(true);c.dancing=false;c.reclining=false;c.state='walk';c.path=p;c.then=then;anim.play(clip('walk'));}
   // Towards you, stopping at their personal-space distance on their side.
   function approach(then){const dx=node.position.x-walker.x,dz=node.position.z-walker.z,d=Math.hypot(dx,dz)||1,gap=cfg.personalSpace;if(d<=gap+.25){then?.();return;}
    let tx=walker.x+dx/d*gap,tz=walker.z+dz/d*gap;if(blockedAt(tx,tz)){for(const a of [.6,-.6,1.2,-1.2,1.8,-1.8]){const ang=Math.atan2(dx,dz)+a,x=walker.x+Math.sin(ang)*gap,z=walker.z+Math.cos(ang)*gap;if(!blockedAt(x,z)){tx=x;tz=z;break;}}}walkTo(tx,tz,then);}
   function stand(quiet){if(c.sitting){c.sitting=false;if(!quiet)anim.playOnce('sit-exit','idle');}if(c.reclining){c.reclining=false;node.position.y=0;}}
   const face=(yaw,dt,rate)=>{const d=C.wrap(yaw-node.rotation.y);node.rotation.y+=d*Math.min(1,dt*rate);return Math.abs(d);};
   // ---- Attention: chest, neck and head turn so the face points at your eyes, whatever the clip is doing ----
   // Each frame, after the clip has posed the body, the head's actual facing is measured and corrected toward the
   // wanted direction (clamped to a natural range), shared out down the chain. Nothing accumulates between frames.
   const bones={};for(const t of node.getDescendants(false))for(const [b] of C.chain)if(t.name.endsWith('mixamorig:'+b))bones[b]=t;
   const att={yaw:0,pitch:0,weight:0,glance:null,glanceIn:2+Math.random()*4,last:{},base:{},axis:null,err:{yaw:0,pitch:0}},
    M1=new B.Matrix(),qW=new B.Quaternion(),ID=B.Quaternion.Identity();
   // World matrices from the figure's root down to a bone, so a just-animated pose is measured, not last frame's.
   const refresh=b=>{const chain=[];for(let n=b;n&&n!==k.parent;n=n.parent)chain.unshift(n);for(const n of chain)n.computeWorldMatrix(true);};
   const forward=()=>{refresh(bones.Head);return B.Vector3.TransformNormal(att.axis,bones.Head.getWorldMatrix()).normalize();};
   function applyLook(dt){
    const cam=k.scene.activeCamera;if(!cam||!bones.Head)return;
    // Restore any bone a paused clip didn't overwrite, so the correction is measured from the clip's own pose.
    for(const [name] of C.chain){const b=bones[name];if(b?.rotationQuaternion&&att.last[name]&&b.rotationQuaternion.equals(att.last[name]))b.rotationQuaternion.copyFrom(att.base[name]);if(b?.rotationQuaternion)(att.base[name]??=new B.Quaternion()).copyFrom(b.rotationQuaternion);}
    // The head bone's own "forward" axis: the one that points where the body faces (found once).
    if(!att.axis){refresh(bones.Head);const m=bones.Head.getWorldMatrix(),f=new B.Vector3(Math.sin(node.rotation.y),0,Math.cos(node.rotation.y));let best=null;
     for(const a of [[1,0,0],[0,1,0],[0,0,1],[-1,0,0],[0,-1,0],[0,0,-1]]){const v=B.Vector3.TransformNormal(new B.Vector3(...a),m).normalize(),d=B.Vector3.Dot(v,f);if(!best||d>best.d)best={a,d};}att.axis=new B.Vector3(...best.a);}
    const head=bones.Head.getAbsolutePosition();
    // Now and then they glance away (out of the window, or to one side), then come back to you.
    att.glanceIn-=dt;if(att.glance){att.glance.t-=dt;if(att.glance.t<=0){att.glance=null;att.glanceIn=cfg.glanceEvery[0]+Math.random()*(cfg.glanceEvery[1]-cfg.glanceEvery[0]);}}
    else if(att.glanceIn<=0&&!c.kissing){const other=others(self)[0];if(other&&c.state!=='window'&&Math.random()<.18){const h=other.bones.Head?.getAbsolutePosition?.();if(h){att.glance={t:1.2+Math.random()*1.4,x:h.x,y:h.y,z:h.z};}}
     else if(Math.random()>cfg.attention||c.state==='window'){const side=Math.random()<.5?-1:1,a=node.rotation.y+side*(.7+Math.random()*.5);att.glance={t:cfg.glanceFor[0]+Math.random()*(cfg.glanceFor[1]-cfg.glanceFor[0]),x:c.state==='window'?7:head.x+Math.sin(a)*3,y:head.y+(Math.random()-.6)*.6,z:c.state==='window'?node.position.z+(Math.random()-.5)*3:head.z+Math.cos(a)*3};}else att.glanceIn=2+Math.random()*3;}
    const target=att.glance||cam.globalPosition,seated=c.sitting||c.reclining,lim={...cfg,maxHeadYaw:cfg.maxHeadYaw*(seated?1.2:1)},Lk=C.look(node.rotation.y,head,target,lim,c.turning);
    // Standing still, they turn their whole body once you are well round to one side.
    const free=c.state==='idle'&&!seated&&!att.glance&&!(c.busy>0);
    if(free){if(Lk.turn){c.turning=true;if(face(Lk.want,dt,2.4)<cfg.bodyTurnUntil)c.turning=false;}else c.turning=false;}
    else if(c.dancing&&!att.glance)face(Lk.want,dt,1.4);
    const w=(c.state==='walk'?.35:c.reclining?.55:c.dancing?.75:1)*cfg.headTracking*(c.state==='window'&&!att.glance?.4:1);
    att.yaw=C.ease(att.yaw,Lk.yaw,5,dt);att.pitch=C.ease(att.pitch,Lk.pitch,5,dt);att.weight=C.ease(att.weight,w,2.5,dt);
    // Where the face should point. Each bone takes its share of the remaining turn, worked out in its parent's own
    // space (the glTF root mirrors the skeleton, so world-space rotations would flip the vertical part).
    const yw=node.rotation.y+att.yaw,want=new B.Vector3(Math.sin(yw)*Math.cos(att.pitch),Math.sin(att.pitch),Math.cos(yw)*Math.cos(att.pitch)).normalize(),f=forward();
    const yawOf=v=>Math.atan2(v.x,v.z);att.err={yaw:C.wrap(yawOf(want)-yawOf(f)),pitch:Math.asin(want.y)-Math.asin(Math.max(-1,Math.min(1,f.y)))};
    let done=0,acc=0;
    for(const [name,share] of C.chain){const b=bones[name];acc+=share;if(!b?.rotationQuaternion)continue;
     const goal=acc*att.weight,frac=done>=1?0:Math.max(0,Math.min(1,(goal-done)/(1-done)));done=goal;if(!frac)continue;
     const now=forward();refresh(b);b.parent.getWorldMatrix().invertToRef(M1);
     const fp=B.Vector3.TransformNormal(now,M1).normalize(),wp=B.Vector3.TransformNormal(want,M1).normalize(),Q=new B.Quaternion();B.Quaternion.FromUnitVectorsToRef(fp,wp,Q);
     B.Quaternion.Slerp(ID,Q,frac).multiplyToRef(b.rotationQuaternion,qW);b.rotationQuaternion.copyFrom(qW);b.computeWorldMatrix(true);(att.last[name]??=new B.Quaternion()).copyFrom(b.rotationQuaternion);}
    if(att.debug){const f2=forward();att.post={want:want.asArray().map(v=>+v.toFixed(3)),before:f.asArray().map(v=>+v.toFixed(3)),after:f2.asArray().map(v=>+v.toFixed(3)),w:+att.weight.toFixed(2)};}}
   let lastAnimTime=performance.now();const lookObserver=k.scene.onAfterAnimationsObservable.add(()=>{const now=performance.now(),dt=Math.min(.1,(now-lastAnimTime)/1000);lastAnimTime=now;try{applyLook(dt);}catch(e){console.warn('[VR companion look]',e);}});
   // ---- Remarks they make on their own: a subtitle, never a blocking panel ----
   function remark(pool){const text=C.pick(L[pool],mem,pool);if(text)showLine(who.name,text);}
   // ---- Following you: a place behind you, a little to their own side when two of you are walking together ----
   function followPoint(){const fx=Math.sin(walker.yaw),fz=Math.cos(walker.yaw),side=party2?S.side*.65:.4,rx=Math.cos(walker.yaw),rz=-Math.sin(walker.yaw);
    for(const [b,s] of [[1.2,side],[.9,side*1.6],[1.6,0],[.6,side*1.9]]){const x=walker.x-fx*b+rx*s,z=walker.z-fz*b+rz*s;if(!blockedAt(x,z))return [x,z];}return at();}
   // ---- Moving and doing things each frame ----
   const brain=C.brain(cfg);let thinkIn=1.5+slot*.6,lastPlayer={x:walker?.x||0,z:walker?.z||0},stillFor=0;
   const playerSeat=()=>{const s=api.session?.seat;if(mode!=='vr-seated'||!s)return null;return Object.keys(seats).find(n=>Math.hypot(seats[n].x-s.x,seats[n].z-s.z)<.2)||(Math.hypot(pairSeat.x-s.x,pairSeat.z-s.z)<.2?'sofa':'other');};
   const spotId='vr-companion'+tag;
   k.every((dt)=>{
    if(c.busy>0)c.busy-=dt;
    if(c.state==='walk'){const [x,z]=c.path[0],dx=x-node.position.x,dz=z-node.position.z,d=Math.hypot(dx,dz);face(Math.atan2(dx,dz),dt,6);
     if(d<.08){c.path.shift();if(!c.path.length){c.state='idle';anim.play('idle');const t=c.then;c.then=null;t?.();}}
     else{let st=Math.min(d,cfg.walkSpeed*dt),ux=dx/d,uz=dz/d;
      // On the way, keep clear of the other companion: the second gives way to the first for a moment, and either
      // steps round one standing (or still waiting) in the way.
      for(const o of others(self)){const [ox,oz]=o.at(),vx=ox-node.position.x,vz=oz-node.position.z,od=Math.hypot(vx,vz);if(od>.8||vx*ux+vz*uz<=0)continue;
       if(o.c.state==='walk'&&slot>o.slot&&(c.yielded=(c.yielded||0)+dt)<1.2){st=0;break;}
       const lx=-uz,lz=ux,away=lx*vx+lz*vz>0?-1:1,sx=ux*.45+lx*away*.9,sz=uz*.45+lz*away*.9,sl=Math.hypot(sx,sz);ux=sx/sl;uz=sz/sl;break;}
      if(st){c.yielded=0;const nx=node.position.x+ux*st,nz=node.position.z+uz*st;if(!blockedAt(nx,nz)){node.position.x=nx;node.position.z=nz;}else{node.position.x+=dx/d*st;node.position.z+=dz/d*st;}}}}
    if(c.watch>0)c.watch-=dt;
    const sp=walkingLocation?.interactions.find(i=>i.id===spotId);if(sp){sp.position[0]=node.position.x;sp.position[2]=node.position.z;sp.label='TALK TO '+who.name.toUpperCase();}
    // The brain thinks four times a second.
    const moved=Math.hypot(walker.x-lastPlayer.x,walker.z-lastPlayer.z);lastPlayer={x:walker.x,z:walker.z};stillFor=moved/Math.max(dt,1e-3)<.15?stillFor+dt:0;
    thinkIn-=dt;if(thinkIn>0)return;const step=.25-thinkIn;thinkIn=.25;
    const standing=!c.sitting&&!c.reclining&&!c.dancing&&!c.kissing;
    // Following: they set off when you've moved away from where they're heading.
    if(c.mode==='follow'&&standing&&!(c.busy>0)){const [fx,fz]=followPoint(),[tx,tz]=dest();if(Math.hypot(fx-tx,fz-tz)>1&&Math.hypot(fx-node.position.x,fz-node.position.z)>.9)walkTo(fx,fz,null);}
    // Standing in each other's way (after a gesture, a dance or a turn): the second one steps aside.
    if(c.state==='idle'&&standing&&slot>0)for(const o of others(self)){const [ox,oz]=o.at();if(!o.c.sitting&&!o.c.reclining&&Math.hypot(ox-node.position.x,oz-node.position.z)<.55){walkTo(node.position.x,node.position.z,null);break;}}
    const interacting=!['walking','vr-seated'].includes(mode)||!!choices||c.kissing,state=c.busy>0||c.watch>0||c.state==='window'&&c.windowFor>0?'busy':c.state==='walk'?'walk':c.reclining?'recline':c.sitting?'sit':c.dancing?'dance':'idle';
    if(c.state==='window'){c.windowFor-=step;if(c.windowFor<=0){c.state='idle';idle();}}
    const intent=brain.tick({dt:step,player:{x:walker.x,z:walker.z,seated:playerSeat(),still:stillFor>.5,interacting},comp:{x:node.position.x,z:node.position.z,state},zones:{window:walker.x>4.2}});
    if(intent)act(intent);});
   // What the brain asked for. While following you or staying put they still make remarks, but don't wander off.
   const spots=[[-2.3,-3.9,Math.PI],[0,1.5,0],[1.4,-3.6,Math.PI],[-3.4,1.6,-Math.PI/2],[3.4,1.2,Math.PI/2],[-1.2,-1.6,.6]];
   function act(i){
    if(i.do==='say'){remark(i.pool);if(i.gesture)gesture(i.gesture);}
    else if(i.do==='watch'){c.watch=2.5;}
    else if(c.mode!=='free')return;
    else if(i.do==='approach')approach(()=>{remark(i.pool);gesture(Math.random()<cfg.flirtatiousness?'flirt':'greet');});
    else if(i.do==='invite'){if(talks&&!(i.kind==='recline'&&others(self).some(o=>o.c.reclining)))invite(i.kind,i.pool);}
    else if(i.do==='activity'){
     if(i.kind==='gesture')gesture(Math.random()<.5?'idleAlt':Math.random()<cfg.flirtatiousness?'shy':'confident');
     else if(i.kind==='window')walkTo(5.1,(Math.random()-.5)*3.4,()=>{c.state='window';c.windowFor=7+Math.random()*6;node.rotation.y=Math.PI/2;if(Math.random()<.5)k.after(()=>{if(api.session&&c.state==='window')gesture('glance');},2500);});
     else if(i.kind==='sofa'&&has('sit'))walkTo(...S.sofa.from,()=>{sitOnSofa();k.after(()=>{if(api.session&&c.sitting&&mode!=='vr-seated'&&!c.withYou){stand();}},14000+Math.random()*8000);},true);
     else{const [x,z,yaw]=spots[Math.floor(Math.random()*spots.length)];walkTo(x,z,()=>{node.rotation.y=yaw;});}}}
   function sitOnSofa(){node.rotation.y=Math.PI/2;node.position.set(S.sofa.x,0,S.sofa.z);c.sitting=true;c.state='idle';anim.playOnce('sit-enter',loop());}
   // An invitation: they come over if needed, ask, and respect the answer.
   function invite(kind,pool){const ask=()=>{const q=C.pick(L[pool],mem,pool);if(!q||!api.session)return;
     ask2(self,q,[['Yes',()=>{brain.note('accepted:'+kind);remark('accepted');if(kind==='dance')dance(true);else if(kind==='sit')sitTogether(true);else if(kind==='recline')recline(true);else if(kind==='join-sofa')joinSofa();}],
      ['Not now',()=>{brain.note('declined:'+kind);remark('declined');gesture('decline');if(kind==='join-sofa')reseat();}]]);};
    if(kind==='join-sofa')ask();else approach(ask);}
   // Asking while you're seated keeps you seated.
   function reseat(){if(c.youSeat)api.sit({...c.youSeat,text:'You settle back in.'});c.youSeat=null;}
   function joinSofa(){reseat();walkTo(...S.sofa.from,()=>{sitOnSofa();c.withYou=true;remark('sit');},true);}
   // ---- Conversation and things to do together, from the choice menu ----
   function menu(){const far=Math.hypot(walker.x-node.position.x,walker.z-node.position.z)>2.8&&!c.sitting,never=['Never mind',()=>{resumeWalking();idle();},'Leave'];
    const atHome=Math.hypot(node.position.x-home[0],node.position.z-home[1])<.4;
    const commands=[...(c.mode!=='follow'?[['Follow me',followMe,'Together']]:[]),...(c.mode!=='stay'?[['Stay here',stayHere,'Together']]:[]),...(c.mode!=='free'||!atHome?[['Go back to your spot',goBack,'Together']]:[])];
    const together=[['Sit together',()=>sitTogether(),'Together'],[c.dancing?'Stop dancing':'Dance together',()=>dance(),'Together']];
    const opts=far?[['Come over here',comeHere,'Together'],...together,...commands,never]:
     [...(talks?[['Chat',chat,'Talk'],['Compliment them',compliment,'Talk'],['Flirt',flirt,'Talk']]:[]),...together,...(has('recline')&&!others(self).some(o=>o.c.reclining)?[['Lie back together',()=>recline(),'Together']]:[]),
      ['Hold hands',hands,'Together'],...(talks?[['Kiss',kiss,'Together'],['Relax together',relax,'Together']]:[]),...commands,...(talks?[['Say goodnight',goodbye,'Leave']]:[]),never];
    const opening=c.greeted?C.pick(L.chat,mem,'menu'):C.pick(L.greet,mem,'greet');c.greeted=true;ask2(self,far?C.pick(L.approach,mem,'menu-far'):opening,opts);}
   const after=()=>{resumeWalking();idle();};
   function comeHere(){resumeWalking();c.mode=c.mode==='stay'?'free':c.mode;remark('comeHere');approach(()=>gesture('greet'));}
   function chat(){say(self,C.pick(L.chat,mem,'chat'),after);gesture(Math.random()<.4?'laugh':'idleAlt');}
   function compliment(){c.affection++;say(self,C.pick(L.compliment,mem,'compliment'),after);gesture(Math.random()<.5?'shy':'laugh');}
   function flirt(){c.affection++;say(self,C.pick(L.flirt,mem,'flirt'),after);gesture('flirt');}
   function sitTogether(){c.dancing=false;resumeWalking();c.withYou=true;walkTo(...S.sofa.from,sitOnSofa,true);api.sit({...(party2?pairSeat:seats.sofa),text:C.pick(L.sit,mem,'sit')||'You sit down together.'});}
   function dance(asked){if(c.dancing&&!asked){c.dancing=false;idle();resumeWalking();return;}stand(true);
    c.danceClip=Math.random()<(.25+cfg.flirtatiousness*.2)&&has(clip('playfulDance'))?clip('playfulDance'):clip('dance');c.dancing=true;
    if(!api.session.settings.music||api.session.settings.music==='off'){api.setPad('velvet');room.music('velvet');api.session.settings.music='velvet';}
    const s=party2?S.side*.55:0;walkTo(walker.x+Math.sin(walker.yaw)*1.2+Math.cos(walker.yaw)*s,walker.z+Math.cos(walker.yaw)*1.2-Math.sin(walker.yaw)*s,()=>{c.dancing=true;anim.play(c.danceClip);});
    if(!asked)say(self,C.pick(L.dance,mem,'dance'),()=>{resumeWalking();anim.play(c.danceClip);});else resumeWalking();}
   // Lying back on the bed together: they stretch out on the duvet; you sit on its edge beside them.
   function recline(){resumeWalking();walkTo(1.95,2.9,()=>{c.reclining=true;c.state='idle';node.rotation.y=-Math.PI/2;node.position.set(.95,.5,3.35);anim.play('recline');remark('recline');},true);api.sit({x:-.35,z:3.1,yaw:Math.PI/2+.25,eye:1.05,text:'You stretch out on the bed. The ceiling glows violet.'});}
   function hands(){c.affection++;const near=Math.hypot(walker.x-node.position.x,walker.z-node.position.z);if(!c.sitting&&near>1.3)approach(()=>gesture('interact'));else gesture('interact');say(self,C.pick(L.hands,mem,'hands'),after);}
   // A kiss is the companion's choice too: only when you've been close (sitting or dancing) and talking a while.
   function kiss(){if(!c.sitting&&!c.dancing&&!c.reclining)return say(self,C.pick(L.notNow,mem,'notNow'));if(c.affection<3)return say(self,C.pick(L.notYet,mem,'notYet'));
    say(self,L.kiss[0],()=>{resumeWalking();c.kissing=true;k.kiss=1.6;api.sfx(520,1.2,'sine',.02);k.after(()=>{c.kissing=false;if(api.session){gesture('shy');say(self,C.pick(L.kissAfter,mem,'kissAfter'),after);}},1700);});}
   function relax(){c.affection++;if(!c.sitting)return sitTogether();say(self,C.pick(L.relax,mem,'relax'),after);}
   function goodbye(){say(self,C.pick(L.bye,mem,'bye'),()=>{api.exit();},'EXIT VR →');gesture('flirt');}
   // Commands: they follow you, keep their place, or go back to their own spot by the window.
   function followMe(){after();stand(true);c.dancing=false;c.mode='follow';gesture('greet');announce(who.name+' is coming with you.');}
   function stayHere(){after();if(c.state==='walk'){c.path=[];c.then=null;c.state='idle';idle();}c.mode='stay';announce(who.name+' will wait here.');}
   function goBack(){after();c.mode='free';c.withYou=false;walkTo(...home,()=>{node.rotation.y=-Math.PI/2;});announce(who.name+' heads back.');}
   // Models with blink shapes blink every 2-6 s, now and then twice; a blink closes and opens in 0.18 s.
   const blinks=node.getChildMeshes().flatMap(m=>{const mt=m.morphTargetManager;return mt?Array.from({length:mt.numTargets},(_,i)=>mt.getTarget(i)).filter(t=>/^Eye_Blink_[LR]$/.test(t.name)):[];});
   if(blinks.length){let next=1.5+slot,t=-1;k.every(dt=>{next-=dt;if(next<=0&&t<0){t=0;next=Math.random()<.15?.3:2+Math.random()*4;}
    if(t>=0){t+=dt;const w=t<.07?t/.07:t<.18?1-(t-.07)/.11:0;for(const b of blinks)b.influence=Math.max(0,w);if(t>=.18)t=-1;}});}
   // Life between interactions (David, 2026-10-31): now and then a smile (models with smile shapes), and a reaction to
   // the other companion's gestures (a look, a laugh or a shy tilt, a smile). Occasional by design: each has its own
   // random interval and cooldown, and nothing starts while they're walking, busy, or in a scene with you.
   const smiles=node.getChildMeshes().flatMap(m=>{const mt=m.morphTargetManager;return mt?Array.from({length:mt.numTargets},(_,i)=>mt.getTarget(i)).filter(t=>/^Smile_[LR]$/.test(t.name)):[];});
   const sm={w:0,hold:0,next:6+Math.random()*10};self.smile=dur=>{if(smiles.length)sm.hold=Math.max(sm.hold,dur);};
   if(smiles.length)k.every(dt=>{sm.next-=dt;if(sm.next<=0){sm.next=7+Math.random()*12;if(Math.random()<.4&&!c.kissing)sm.hold=1.5+Math.random()*2;}
    if(sm.hold>0)sm.hold-=dt;sm.w+=((sm.hold>0?.75:0)-sm.w)*Math.min(1,dt*4);for(const t of smiles)t.influence=sm.w;});
   let reactAt=-1e9;self.react=from=>{const now=performance.now()/1000;if(now-reactAt<8||c.state!=='idle'||c.busy>0||c.sitting||c.dancing||c.kissing)return;
    const [fx,fz]=from.at();if(Math.hypot(fx-node.position.x,fz-node.position.z)>4.5||Math.random()>.35)return;reactAt=now;
    const h=from.bones.Head?.getAbsolutePosition?.();if(h)att.glance={t:1.6,x:h.x,y:h.y,z:h.z};
    k.after(()=>{if(api.session&&c.state==='idle'&&!(c.busy>0)){self.smile(1.5+Math.random());const r=Math.random();if(r<.5)gesture(has('laugh')?'laugh':'shy');else if(r<.8)gesture('shy');}},600+Math.random()*600);};
   Object.assign(self,{node,anim,c,brain,att,bones,act,at,dest,talks,menu,gesture,wear,idle,
    talking(){anim.play(c.sitting?'sit-talk':c.dancing?c.danceClip:c.reclining?'recline':'talk');},
    greet(){c.greeted=true;gesture('greet');if(talks)say(self,C.pick(L.greet,mem,'greet'));},
    onStand(){c.withYou=false;if(c.sitting||c.reclining){stand();c.state='idle';if(c.mode==='free')walkTo(...home);}},
    open(){if(c.sitting&&mode!=='vr-seated'&&!c.withYou){stand();}menu();},
    follow:followMe,stay:stayHere,goBack,
    dispose(){k.scene.onAfterAnimationsObservable.remove(lookObserver);node.dispose(false,false);for(const t of Object.values(loaded))t.then(x=>x.dispose(),()=>{});}});
   return self;}
  for(const [slot,who] of party.entries())comps.push(await companion(who,slots[slot],slot));
  const first=comps[0];
  const dispose=()=>{screen.removeEventListener('click',onChoice);window.removeEventListener('keydown',onMenuKey,true);line.remove();for(const x of comps)x.dispose();for(const c2 of k._containers||[])c2.dispose();k.dispose();};
  return {tick:k.tick,dispose,companions:comps,anim:first.anim,companion:first.node,who:first.who,config:first.cfg,brain:first.brain,attention:first.att,bones:first.bones,state:first.c,act:first.act,overlay:(g,W,H)=>k.overlayFn(g,W,H),
   // The first companion greets you; a second one waves a moment later.
   onEnter(){k.after(()=>{if(api.session&&mode==='walking')first.greet();},1200);if(comps[1])k.after(()=>{if(api.session&&mode==='walking')comps[1].gesture('greet');},2600);},
   onStand(){for(const x of comps)x.onStand();},
   interact(item){const id=item.id.slice(3);
    if(id.startsWith('companion')){comps[id==='companion'?0:+id.slice(10)-1]?.open();}
    else if(id==='lamp'){const order=Object.keys(moods),next=order[(order.indexOf(k.mood)+1)%order.length];mood(next);api.session.settings.mood=next;announce('Lighting: '+moods[next].label+'.');}
    else if(id==='music'){const order=['off','lounge','velvet','midnight'],next=order[(order.indexOf(api.session.settings.music||'off')+1)%order.length];api.setPad(next);room.music(next);api.session.settings.music=next;announce('Music: '+(next==='off'?'off':next)+'.');}
    else if(id==='curtains'){k.curtainsOpen=!k.curtainsOpen;room.curtains(k.curtainsOpen);announce(k.curtainsOpen?'You draw the curtains back. NeoChinatown glows below.':'The curtains close softly.');}
    else if(id.startsWith('sit-')||id==='balcony'){const s=seats[id.replace('sit-','')]||seats.balcony;api.sit({...s,text:id==='balcony'?'You lean on the rail. The city hums far below, all neon and rain-haze.':'You sit down. The room is quiet and soft.'});}},
   // Looks are set per companion ("look-<companion>-<group>") and saved as that companion's preference.
   setOption(key,val){if(key==='mood')mood(val);if(key==='music'){api.setPad(val);room.music(val);}
    const m=/^look-(.+)-([^-]+)$/.exec(key),x=m&&comps.find(o=>o.who.id===m[1]);if(x){x.wear(m[2],val);C.saveLook(x.who,m[2],val);}}};
 }
 const registered={id:'suite',title:'Play in a Bedroom',status:'ready',station:1,tint:'linear-gradient(135deg,#1a0820,#ff2d96)',preview:'void-runner/assets/vr/preview-suite.jpg',
  description:'A private apartment high above NeoChinatown at night, with an adult companion of your choice. Talk, sit together, dance, or simply enjoy the room. Romance is optional and never explicit.',
  picker:{
   // Model files are checked when the picker opens; a missing one is shown but can't be chosen.
   installed:{},
   prepare(){const byModel=new Map([...C.companions.values()].map(e=>[e.model,e]));return Promise.all([...byModel.values()].map(e=>fetch('void-runner/assets/models/crowd/'+C.file(e),{method:'HEAD'}).then(r=>{this.installed[e.model]=r.ok;}).catch(()=>{})));},
   usable(sex){return C.list({sex,has:m=>VoidCrowd.clips[m]||[],installed:this.installed}).filter(e=>C.offered(e));},
   steps:[
    {title:'COMPANION',prompt:'Who would you like to spend the evening with? Every companion is an original adult character of this simulation.',
     choices(){return [['female','Female','Women companions'],['male','Male','Men companions']].map(([id,label,about])=>{const n=suitePicker().usable(id).filter(e=>e.usable).length;
      // The card shows who is in that gallery (up to four portraits) over its tint.
      const previews=suitePicker().usable(id).filter(e=>e.usable&&e.preview).slice(0,4).map(e=>e.preview);
      return {id,label,description:n?about+' · '+n+' available':'None available yet.',usable:n>0,reason:'No companions available.',previews,tint:id==='female'?'linear-gradient(135deg,#2a0c22,#ff4fb0)':'linear-gradient(135deg,#0c1a2a,#5a7bff)'};});}},
    {title:'CHOOSE A COMPANION',prompt:'Pick who you would like to meet: one companion alone, or two together where a card says so. You can change your mind by leaving the simulation and choosing again.',
     // Each companion alone, then the rooms for two (C.pairs) whose companions are all in this gallery.
     choices([sex]){const usable=suitePicker().usable(sex),one=usable.map(e=>({id:e.id,label:e.name,description:e.about||'',preview:e.preview,usable:e.usable,reason:e.reason}));
      const two=C.pairs.map(p=>({p,members:p.companions.map(id=>usable.find(e=>e.id===id))})).filter(x=>x.members.every(Boolean)).map(({p,members})=>({id:p.id,label:p.name,
       description:'Both of them, together in the same room.',previews:members.map(e=>e.preview),usable:members.every(e=>e.usable),reason:members.find(e=>!e.usable)?.reason}));
      return [...one,...two];},
     // The last choice is remembered and picked again (where it can still be chosen here).
     initial([sex]){const ids=lastParty(),id=C.pairs.find(p=>p.companions.join()===ids.join())?.id||(ids.length===1?ids[0]:null);
      return id&&this.choices([sex]).some(c=>c.id===id&&c.usable!==false)?id:null;}}],
   options:([,sel])=>{const p=C.pairs.find(x=>x.id===sel),ids=p?p.companions:[sel];rememberParty(ids);return ids.length>1?{companions:ids}:{companion:ids[0]};}},
  validate:opts=>{const all=C.list({has:m=>(globalThis.VoidCrowd?.clips[m]||[]),installed:suitePicker().installed}),party=C.party(opts);return party.length>0&&party.every(e=>all.find(x=>x.id===e.id)?.usable);},
  defaults:{mood:'rose',music:'lounge'},
  // The VR menu's settings: mood and music, then each companion's looks (outfit, hairstyle, glasses, colours) that
  // have a choice, named for the companion when two are in the room.
  settings(opts){const party=C.party(opts);return [{key:'mood',label:'Mood lighting',values:[['warm','Warm'],['rose','Rose'],['night','Night'],['candle','Candlelight']]},{key:'music',label:'Music',values:[['off','Off'],['lounge','Lounge'],['velvet','Velvet'],['midnight','Midnight']]},
   ...party.flatMap(e=>C.looks(e).filter(g=>g.options.length>1).map(g=>({key:'look-'+e.id+'-'+g.key,label:(party.length>1?e.name+': ':'')+g.label,values:g.options.map(o=>[o.id,o.label])})))];},
  ambience:()=>({waves:.018,pad:'lounge'}),layout,build};
 VoidVR.register(registered);
 function suitePicker(){return VoidVR.registry?.get?.('suite')?.picker||registered.picker;}
 // Who you last chose at the terminal, kept per browser like other preferences.
 const partyKey='void-runner-companion-party-v1';
 function lastParty(){try{const v=JSON.parse(globalThis.localStorage?.getItem(partyKey)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[];}catch{return [];}}
 function rememberParty(ids){try{globalThis.localStorage?.setItem(partyKey,JSON.stringify(ids));}catch{}}
})();
