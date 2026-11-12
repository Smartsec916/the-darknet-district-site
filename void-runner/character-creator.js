/* Character creator and wardrobe (browser only; phones never download this script: it is inert until the device gate releases it).
   One screen serves both uses: first-time creation for a new campaign without a character, and the free, unlimited Wardrobe in the Sleeping Pod room.
   It changes ONLY the saved appearance (character-appearance.js). It never touches location, inventory, credits, missions or equipment.
   The preview is the real character in the real pod room, seen by the game's own camera while the game is paused (mode 'character-creator').          */
(function(root){
 'use strict';
 const A=root.VoidCharacterAppearance,CAT=A.CATALOG,KEEP=['hairColor','clothingColor'];
 const STAGE={x:-9,z:60,dist:3.05,eye:1.22,side:.85};   // `side` moves the character out from behind the options panel, to the middle of the free part of the screen   // in the pod room's own coordinates: the camera stands here looking +z (towards the music screen); the character stands `dist` metres ahead
 let lamps=[],open=false,closing=false,ctx=null,char=null,draft=null,original=null,snapshot=null,holder=null,spin=0,auto=true,seq=0,pad=null,raf=0,drag=null,ui=null;
 const uid=()=>root.VoidAccount?.user?.uid||'guest';
 const storage=()=>{try{return root.localStorage;}catch{return null;}};
 // The look saved with the account (once the server feature is on) wins on a new browser or device; otherwise this browser's own copy; otherwise the old character's look.
 const stored=()=>{const server=root.VoidAccount?.appearance;if(server&&A.validate(server))return A.normalize(server);const s=storage();return s?A.load(s,uid(),root.VoidAccount?.character):A.fromLegacy(root.VoidAccount?.character);};
 // Best effort and silent: while the server feature is off the API answers 404 and nothing happens beyond the local save.
 async function upload(a){try{const u=root.VoidAccount?.user;if(!u||u.isAnonymous||!root.VoidAccount.character||!root.VoidNetwork?.request)return false;
  await root.VoidNetwork.request('character/appearance',{body:a,token:await u.getIdToken(),scope:u.uid+':appearance'});root.VoidAccount.appearance=a;return true;}catch{return false;}}
 const current=()=>stored()||A.defaults(A.DEFAULT_LOOK.male);

 const CSS=`#character-creator{position:fixed;inset:0;z-index:60;display:none;pointer-events:none;font-family:ui-monospace,Consolas,monospace;color:#d9fbff}
#character-creator.on{display:block}
#character-creator .cc-panel{pointer-events:auto;position:absolute;left:0;top:0;bottom:0;width:min(440px,100%);overflow:auto;box-sizing:border-box;padding:18px 18px 110px;background:linear-gradient(90deg,#02060c,#02060c 88%,rgba(4,10,18,.92));border-right:1px solid rgba(56,232,255,.25)}
#character-creator h1{margin:0 0 2px;font-size:15px;letter-spacing:.2em;color:#38e8ff}#character-creator p.cc-sub{margin:0 0 14px;font-size:11px;color:#8fb3bd}
#character-creator h2{margin:16px 0 6px;font-size:11px;letter-spacing:.18em;color:#ff3fb4;border-bottom:1px solid rgba(255,63,180,.25);padding-bottom:3px}
#character-creator .cc-row{display:flex;flex-wrap:wrap;gap:6px}
#character-creator button{font:inherit;font-size:11px;letter-spacing:.08em;color:#d9fbff;background:rgba(10,24,34,.9);border:1px solid rgba(56,232,255,.35);padding:8px 10px;cursor:pointer;min-height:34px}
#character-creator button:hover,#character-creator button:focus-visible{outline:2px solid #38e8ff;outline-offset:1px;background:rgba(20,50,66,.95)}
#character-creator button[aria-pressed=true]{background:#0f4a52;border-color:#58ffe1;color:#fff;box-shadow:0 0 10px rgba(88,255,225,.35)}
#character-creator button[disabled]{opacity:.38;cursor:not-allowed}
#character-creator .cc-sw{width:34px;height:34px;padding:0;border-radius:50%;border:2px solid rgba(255,255,255,.25)}
#character-creator .cc-sw[aria-pressed=true]{border-color:#fff;box-shadow:0 0 0 2px #38e8ff}
#character-creator .cc-note{font-size:10px;color:#8fb3bd;margin:6px 0 0;line-height:1.5}
#character-creator .cc-bar{pointer-events:auto;position:absolute;left:0;bottom:0;width:min(440px,100%);box-sizing:border-box;display:flex;gap:8px;padding:12px 18px;background:rgba(2,6,12,.97);border-top:1px solid rgba(56,232,255,.25)}
#character-creator .cc-bar button{flex:1;min-height:42px;font-size:12px}#character-creator .cc-ok{background:#0f5a52;border-color:#58ffe1}
#character-creator .cc-spin{pointer-events:auto;position:absolute;right:24px;bottom:24px;display:flex;gap:8px}
#character-creator .cc-hint{position:absolute;right:24px;bottom:78px;font-size:10px;color:#8fb3bd;letter-spacing:.1em;text-align:right}
@media(max-width:700px){#character-creator .cc-panel{width:100%;bottom:46%;background:rgba(2,6,12,.94)}#character-creator .cc-bar{width:100%}}`;
 function ensureUi(){
  if(ui)return ui;
  const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  const el=document.createElement('section');el.id='character-creator';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Character creator');document.body.appendChild(el);
  el.addEventListener('click',e=>{const b=e.target.closest('[data-cc]');if(b&&!b.disabled)act(b.dataset.cc,b.dataset.v);});
  el.addEventListener('pointerdown',e=>{if(e.target.closest('.cc-panel,.cc-bar,.cc-spin'))return;drag={x:e.clientX};auto=false;el.setPointerCapture?.(e.pointerId);});
  el.addEventListener('pointermove',e=>{if(drag){spin+=(e.clientX-drag.x)*.01;drag.x=e.clientX;}});
  el.addEventListener('pointerup',()=>{drag=null;});
  return ui=el;
 }
 const swatch=(kind,c,sel)=>`<button class="cc-sw" data-cc="${kind}" data-v="${c.id}" style="background:${c.hex}" aria-pressed="${sel}" aria-label="${c.label}" title="${c.label}"></button>`;
 function render(){
  if(!ui)return;const o=A.options(draft),look=CAT.looks[draft.look],keep=ui.querySelector('.cc-panel')?.scrollTop||0,focus=document.activeElement?.dataset?.cc?document.activeElement.dataset.cc+'|'+(document.activeElement.dataset.v||''):null;
  const btn=(k,v,label,sel,en=true,why='')=>`<button data-cc="${k}" data-v="${v}" aria-pressed="${sel}"${en?'':' disabled'}${why?` title="${why}"`:''}>${label}</button>`;
  ui.innerHTML=`<div class="cc-panel"><h1>${ctx.context==='first'||ctx.context==='multiplayer-setup'?'CREATE YOUR CHARACTER':'WARDROBE'}</h1><p class="cc-sub">${ctx.context==='first'||ctx.context==='multiplayer-setup'?'You can change all of this later, free, in the Sleeping Pod wardrobe.':'Free and unlimited. Your location, inventory, credits and missions are not affected.'}</p>
  <h2>BODY</h2><div class="cc-row">${Object.entries(CAT.bases).map(([id,b])=>btn('base',id,b.label,draft.base===id)).join('')}</div>
  <h2>OUTFIT</h2><div class="cc-row">${o.looks.map(l=>btn('look',l.id,l.label,draft.look===l.id)).join('')}</div>
  <p class="cc-note">Each outfit comes with its own shoes. Swapping outfits and shoes separately needs extra character files that are not made yet.</p>
  <h2>CLOTHING COLOUR</h2><div class="cc-row">${btn('clothingColor','','ORIGINAL',draft.clothingColor===null)}${CAT.clothingColors.map(c=>swatch('clothingColor',c,draft.clothingColor===c.id)).join('')}</div>
  <h2>HAIRSTYLE</h2><div class="cc-row">${o.hair.map(h=>btn('hair',h.id,h.label,draft.hair===h.id,h.enabled,h.reason||'')).join('')}</div>
  <h2>HAIR COLOUR</h2><div class="cc-row">${btn('hairColor','','ORIGINAL',draft.hairColor===null)}${CAT.hairColors.map(c=>swatch('hairColor',c,draft.hairColor===c.id)).join('')}</div>
  ${o.accessories.length?`<h2>EXTRAS</h2><div class="cc-row">${o.accessories.map(a=>btn('acc',a.id,a.label+(draft.accessories.includes(a.id)?' · ON':' · OFF'),draft.accessories.includes(a.id))).join('')}</div>`:''}
  <p class="cc-note">Height is standard for each body (${CAT.bases.male.height} m / ${CAT.bases.female.height} m).</p></div>
  <div class="cc-bar"><button class="cc-ok" data-cc="confirm"${char?.ready&&!closing?'':' disabled'}>SAVE CHARACTER</button><button data-cc="cancel"${closing?' disabled':''}>${ctx.context==='first'?'BACK TO MENU':'CANCEL'}</button></div>
  <div class="cc-spin"><button data-cc="rotl" aria-label="Rotate left">&#9664;</button><button data-cc="auto" aria-pressed="${auto}">SPIN</button><button data-cc="rotr" aria-label="Rotate right">&#9654;</button></div>
  <div class="cc-hint">DRAG TO ROTATE · ARROWS ◀ ▶ · ESC CANCELS</div>`;
  const p=ui.querySelector('.cc-panel');p.scrollTop=keep;if(focus){const [k,v]=focus.split('|');[...ui.querySelectorAll('[data-cc]')].find(b=>b.dataset.cc===k&&(b.dataset.v||'')===v)?.focus({preventScroll:true});}
 }
 async function apply(next){
  if(!A.validate(next))return;draft=A.normalize(next);const my=++seq;render();
  if(char){try{await char.set(draft);}catch(e){console.warn('[character creator]',e.message);}}
  if(my===seq)render();
 }
 function act(kind,v){
  if(kind==='confirm')return close(true);if(kind==='cancel')return close(false);
  if(kind==='rotl'){spin-=.5;auto=false;return render();}if(kind==='rotr'){spin+=.5;auto=false;return render();}if(kind==='auto'){auto=!auto;return render();}
  const d={...draft,accessories:[...draft.accessories]};
  if(kind==='base'){if(v===d.base)return;const n=A.defaults(Object.keys(CAT.looks).find(id=>CAT.looks[id].base===v));return apply({...n,hairColor:d.hairColor,clothingColor:d.clothingColor});}
  if(kind==='look'){if(v===d.look)return;const n=A.defaults(v);return apply({...n,hairColor:d.hairColor,clothingColor:d.clothingColor});}
  if(kind==='hair'){d.hair=v;}
  if(kind==='hairColor')d.hairColor=v||null;if(kind==='clothingColor')d.clothingColor=v||null;
  if(kind==='acc'){const i=d.accessories.indexOf(v);if(i>=0)d.accessories.splice(i,1);else{d.accessories.push(v);if(v==='hat'&&d.hair!=='native'&&d.hair!=='none'&&!CAT.hair[d.hair].hatOk)d.hair='native';}}
  apply(d);
 }
 const forward=y=>[Math.sin(y),Math.cos(y)];
 async function show(c){
  if(open||typeof walker==='undefined'||!walker)return false;
  const S=root.BABYLON,scene=root.VoidBabylon?.scene;if(!S||!scene||!root.VoidCharacterAssembler)return false;
  open=true;closing=false;ctx=c||{context:'wardrobe'};ensureUi();
  original=stored()||A.defaults(A.DEFAULT_LOOK.male);draft=A.normalize(original);
  snapshot={mode,walker:{...walker}};
  // The District interior sits in the world rotated half a turn: world = anchor - local. The anchor comes from the known pod exit point.
  const DA=root.VoidDistrictArea,exit=DA?.podExit?.(root.VoidNeoChinatown);if(!exit){open=false;return false;}
  const P=DA.POINT.podExit,cx=exit.spawn[0]+P[0],cz=exit.spawn[2]+P[1],W=(x,z)=>[cx-x,cz-z],floor=exit.spawn[1]-1.68,cam=W(STAGE.x,STAGE.z),ax=STAGE.x+STAGE.side,az=STAGE.z+STAGE.dist,at=W(ax,az);
  mode='character-creator';clearInput?.();walkingKeys?.clear?.();document.exitPointerLock?.();
  Object.assign(walker,{x:cam[0],z:cam[1],y:floor+STAGE.eye,yaw:Math.PI,pitch:0,vx:0,vz:0,eye:STAGE.eye});
  holder=new S.TransformNode('character-creator-stage',scene);holder.position.set(at[0],floor,at[1]);
  // two lamps for the preview only (first in the light list so the room's light limit cannot drop them), removed on close
  const k=W(ax+1,az-1.9),r=W(ax-1.4,az+1.2),f=W(ax-1.5,az-1.4);
  const key=new S.PointLight('character-creator-key',new S.Vector3(k[0],floor+2.4,k[1]),scene),rim=new S.PointLight('character-creator-rim',new S.Vector3(r[0],floor+2.2,r[1]),scene);
  // A fitting-room stage, for the preview only: a warm key from the front, a magenta rim from behind and a low teal fill, so a dark outfit still reads against the dark room;
  // under the feet a scanning pad, and behind the character a faint light wall that gives the silhouette an edge. All of it is removed on close.
  const fill=new S.PointLight('character-creator-fill',new S.Vector3(f[0],floor+.9,f[1]),scene);
  key.diffuse=new S.Color3(1,.95,.88);key.intensity=4.2;key.range=9;rim.diffuse=new S.Color3(1,.25,.7);rim.intensity=3;rim.range=7;fill.diffuse=new S.Color3(.3,.8,.9);fill.intensity=1.6;fill.range=6;
  const set=new S.TransformNode('character-creator-set',scene),made=[],tex=(n,w,h,draw)=>{const t=new S.DynamicTexture(n,{width:w,height:h},scene,true);draw(t.getContext(),w,h);t.hasAlpha=true;t.update();made.push(t);return t;},
   glow=(n,t)=>{const m=new S.StandardMaterial(n,scene);m.diffuseColor=S.Color3.Black();m.specularColor=S.Color3.Black();m.emissiveTexture=t;m.opacityTexture=t;m.disableLighting=true;m.backFaceCulling=false;made.push(m);return m;};
  const pad=S.MeshBuilder.CreateDisc('character-creator-pad',{radius:.78,tessellation:48},scene);pad.rotation.x=Math.PI/2;pad.position.set(at[0],floor+.012,at[1]);pad.parent=set;pad.isPickable=false;
  pad.material=glow('character-creator-pad',tex('character-creator-pad',256,256,(g,w)=>{const c=w/2;g.clearRect(0,0,w,w);const rg=g.createRadialGradient(c,c,10,c,c,c);rg.addColorStop(0,'rgba(60,220,235,.05)');rg.addColorStop(.72,'rgba(60,220,235,.16)');rg.addColorStop(.9,'rgba(60,220,235,.02)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,w,w);
   g.strokeStyle='rgba(110,240,250,.9)';g.lineWidth=3;g.beginPath();g.arc(c,c,c*.9,0,7);g.stroke();g.strokeStyle='rgba(110,240,250,.35)';g.lineWidth=1.5;for(const r of [.72,.5])  {g.beginPath();g.arc(c,c,c*r,0,7);g.stroke();}
   g.strokeStyle='rgba(255,90,190,.8)';g.lineWidth=2;for(let k=0;k<24;k++){const a=k/24*Math.PI*2,r0=c*(k%6?.84:.78);g.beginPath();g.moveTo(c+Math.cos(a)*r0,c+Math.sin(a)*r0);g.lineTo(c+Math.cos(a)*c*.88,c+Math.sin(a)*c*.88);g.stroke();}}));
  const wallAt=W(ax,az+1.35),wall=S.MeshBuilder.CreatePlane('character-creator-wall',{width:3.4,height:2.9},scene);wall.position.set(wallAt[0],floor+1.45,wallAt[1]);wall.parent=set;wall.isPickable=false;
  wall.material=glow('character-creator-wall',tex('character-creator-wall',256,256,(g,w,h)=>{g.clearRect(0,0,w,h);const lg=g.createLinearGradient(0,0,0,h);lg.addColorStop(0,'rgba(20,60,80,0)');lg.addColorStop(.35,'rgba(28,90,110,.34)');lg.addColorStop(.8,'rgba(120,40,110,.3)');lg.addColorStop(1,'rgba(20,10,30,0)');g.fillStyle=lg;g.fillRect(0,0,w,h);
   const side=g.createLinearGradient(0,0,w,0);side.addColorStop(0,'rgba(0,0,0,1)');side.addColorStop(.18,'rgba(0,0,0,0)');side.addColorStop(.82,'rgba(0,0,0,0)');side.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=side;g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';
   for(const x of [.3,.4,.6,.7]){g.fillStyle='rgba(120,235,250,.5)';g.fillRect(w*x-1,h*.16,2,h*.68);}g.fillStyle='rgba(120,235,250,.22)';for(let y=h*.2;y<h*.82;y+=9)g.fillRect(w*.3,y,w*.4,1);}));
  set.dispose=(orig=>function(){for(const x of made)x.dispose();return orig.call(this,false,false);})(set.dispose);
  lamps=[key,rim,fill];for(const l of lamps){scene.lights.splice(scene.lights.indexOf(l),1);scene.lights.unshift(l);}scene.markAllMaterialsAsDirty?.(S.Constants.MATERIAL_LightDirtyFlag);lamps.push(set);
  spin=0;auto=true;ui.classList.add('on');render();ui.querySelector('[data-cc=confirm]')?.focus();
  const mine=++seq;
  try{char=await root.VoidCharacterAssembler.build(draft,holder,{scene});if(mine===seq&&open){char.play('idle');render();}else char.dispose();}
  catch(e){console.warn('[character creator]',e.message);if(open){ui.querySelector('.cc-sub').textContent='The character models could not be loaded. Nothing was changed.';}}
  tick();return true;
 }
 async function close(confirm){
  if(!open||closing)return;
  let selected=A.normalize(draft),keepSelection=true;
  // A registered account's existing character is authoritative. Check again
  // before writing the first local look so a late account response cannot be overwritten.
  if(confirm&&ctx.context==='first'&&root.VoidAccount?.user&&!root.VoidAccount.user.isAnonymous&&root.VoidAccount.profileReady){
   closing=true;render();const sub=ui.querySelector('.cc-sub');if(sub)sub.textContent='Saving your character…';
   try{const result=await root.VoidAccount.completeMultiplayerCharacter(selected);if(!result.created){keepSelection=false;selected=stored()||A.fromLegacy(result.character);}}
   catch(error){root.VoidRemotePlayers?.setupError?.(error.message||'Account sync is unavailable. Your character will stay in this browser for solo play.');}
   closing=false;
  }
  if(confirm&&ctx.context==='multiplayer-setup'){
   const selected=A.normalize(draft),owner=uid();
   Promise.resolve().then(()=>{
    if(!root.VoidAccount?.completeMultiplayerCharacter)throw new Error('Account setup is unavailable. Try again shortly.');
    return root.VoidAccount.completeMultiplayerCharacter(selected);
   }).then(async result=>{
    if(uid()!==owner)return;
    if(result.created){const s=storage();if(s)A.save(s,owner,selected);root.VoidCharacterCreator.onChange?.(selected);await upload(selected);}
    root.VoidRemotePlayers?.reconnect?.();
   }).catch(error=>root.VoidRemotePlayers?.setupError?.(error.message||'Character creation is unavailable. Try again.'));
  }else if(confirm){const s=storage();if(keepSelection&&(!s||!A.save(s,uid(),selected))){render();ui.querySelector('.cc-sub').textContent='Browser storage is unavailable. Your character was not saved; try again after enabling site storage.';return;}
   try{if(typeof state!=='undefined'&&state?.story?.flags){state.story.flags.appearanceChosen=true;state.story.flags.appearanceOffered=true;}}catch{}
   if(keepSelection){root.VoidCharacterCreator.onChange?.(selected);upload(selected).then(()=>root.VoidRemotePlayers?.refreshLook?.());}}
  open=false;cancelAnimationFrame(raf);seq++;char?.dispose();char=null;holder?.dispose();holder=null;{const sc=root.VoidBabylon?.scene;for(const l of lamps)l.dispose();lamps=[];sc?.markAllMaterialsAsDirty?.(root.BABYLON.Constants.MATERIAL_LightDirtyFlag);}ui.classList.remove('on');ui.innerHTML='';
  Object.assign(walker,snapshot.walker);mode=snapshot.mode;
  const done=ctx.onClose;ctx=null;if(confirm&&typeof save==='function')try{save();}catch{}
  if(snapshot.mode==='walking'&&typeof resumeWalking==='function')resumeWalking();
  done?.(confirm,confirm?selected:null);
 }
 function tick(){
  if(!open)return;raf=requestAnimationFrame(tick);
  if(holder){if(auto)spin+=.012;holder.rotation.y=spin;}
  // gamepad: d-pad or left stick moves between buttons, A presses, B cancels, right stick turns the character
  const g=[...(navigator.getGamepads?.()||[])].find(x=>x&&x.connected);
  if(g){const b=i=>!!g.buttons[i]?.pressed,was=pad||{},now={up:b(12)||g.axes[1]<-.6,down:b(13)||g.axes[1]>.6,a:b(0),b:b(1)};
   if(now.up&&!was.up)moveFocus(-1);if(now.down&&!was.down)moveFocus(1);if(now.a&&!was.a)document.activeElement?.click?.();if(now.b&&!was.b)close(false);
   if(Math.abs(g.axes[2])>.2){spin+=g.axes[2]*.04;auto=false;}pad=now;}
 }
 function moveFocus(d){const l=[...ui.querySelectorAll('button:not([disabled])')],i=l.indexOf(document.activeElement);(l[(i+d+l.length)%l.length]||l[0])?.focus();}
 addEventListener('keydown',e=>{
  if(!open)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(false);}
  else if(e.key==='ArrowLeft'){e.preventDefault();spin-=.15;auto=false;}else if(e.key==='ArrowRight'){e.preventDefault();spin+=.15;auto=false;}
  else if(e.key==='ArrowUp'){e.preventDefault();moveFocus(-1);}else if(e.key==='ArrowDown'){e.preventDefault();moveFocus(1);}
  e.stopPropagation();
 },true);

 // The game is paused while the creator is open: draw and update treat it exactly like waking in the pod (a still room, no movement).
 const asPod=fn=>function(){if(mode!=='character-creator')return fn.apply(this,arguments);mode='pod-waking';try{return fn.apply(this,arguments);}finally{if(mode==='pod-waking')mode='character-creator';}};
 if(typeof draw==='function')draw=asPod(draw);if(typeof update==='function')update=asPod(update);

 if(root.VoidInteractions)root.VoidInteractions.register('district-wardrobe',()=>{show({context:'wardrobe'});});
 root.VoidCharacterCreator={open:c=>show(c),close,get isOpen(){return open;},stored,current,onChange:null,STAGE};
})(globalThis);
