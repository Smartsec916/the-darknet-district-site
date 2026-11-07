/* Character creator and wardrobe (browser only; phones never download this script: it is inert until the device gate releases it).
   One screen serves both uses: first-time creation for a new campaign without a character, and the free, unlimited Wardrobe in the Sleeping Pod room.
   It changes ONLY the saved appearance (character-appearance.js). It never touches location, inventory, credits, missions or equipment.
   The preview is the real character in the real pod room, seen by the game's own camera while the game is paused (mode 'character-creator').          */
(function(root){
 'use strict';
 const A=root.VoidCharacterAppearance,CAT=A.CATALOG,KEEP=['hairColor','clothingColor'];
 const STAGE={x:-9,z:60,dist:2.7,eye:1.4};   // in the pod room's own coordinates: the camera stands here looking +z (towards the music screen); the character stands `dist` metres ahead
 let lamps=[],open=false,ctx=null,char=null,draft=null,original=null,snapshot=null,holder=null,spin=0,auto=true,seq=0,pad=null,raf=0,drag=null,ui=null;
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
  <div class="cc-bar"><button class="cc-ok" data-cc="confirm"${char?.ready?'':' disabled'}>CONFIRM</button><button data-cc="cancel">${ctx.context==='first'?'SKIP FOR NOW':'CANCEL'}</button></div>
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
  open=true;ctx=c||{context:'wardrobe'};ensureUi();
  original=stored()||A.defaults(A.DEFAULT_LOOK.male);draft=A.normalize(original);
  snapshot={mode,walker:{...walker}};
  // The District interior sits in the world rotated half a turn: world = anchor - local. The anchor comes from the known pod exit point.
  const DA=root.VoidDistrictArea,exit=DA?.podExit?.(root.VoidNeoChinatown);if(!exit){open=false;return false;}
  const P=DA.POINT.podExit,cx=exit.spawn[0]+P[0],cz=exit.spawn[2]+P[1],W=(x,z)=>[cx-x,cz-z],floor=exit.spawn[1]-1.68,cam=W(STAGE.x,STAGE.z),at=W(STAGE.x,STAGE.z+STAGE.dist);
  mode='character-creator';clearInput?.();walkingKeys?.clear?.();document.exitPointerLock?.();
  Object.assign(walker,{x:cam[0],z:cam[1],y:floor+STAGE.eye,yaw:Math.PI,pitch:0,vx:0,vz:0,eye:STAGE.eye});
  holder=new S.TransformNode('character-creator-stage',scene);holder.position.set(at[0],floor,at[1]);
  // two lamps for the preview only (first in the light list so the room's light limit cannot drop them), removed on close
  const k=W(STAGE.x+.6,STAGE.z+STAGE.dist-1.6),r=W(STAGE.x-1.2,STAGE.z+STAGE.dist+1.4);
  const key=new S.PointLight('character-creator-key',new S.Vector3(k[0],floor+2.4,k[1]),scene),rim=new S.PointLight('character-creator-rim',new S.Vector3(r[0],floor+2.2,r[1]),scene);
  key.diffuse=new S.Color3(.85,.95,1);key.intensity=1.5;key.range=7;rim.diffuse=new S.Color3(1,.25,.7);rim.intensity=1.1;rim.range=6;
  lamps=[key,rim];for(const l of lamps){scene.lights.splice(scene.lights.indexOf(l),1);scene.lights.unshift(l);}scene.markAllMaterialsAsDirty?.(S.Constants.MATERIAL_LightDirtyFlag);
  spin=0;auto=true;ui.classList.add('on');render();ui.querySelector('[data-cc=confirm]')?.focus();
  const mine=++seq;
  try{char=await root.VoidCharacterAssembler.build(draft,holder,{scene});if(mine===seq&&open){char.play('idle');render();}else char.dispose();}
  catch(e){console.warn('[character creator]',e.message);if(open){ui.querySelector('.cc-sub').textContent='The character models could not be loaded. Nothing was changed.';}}
  tick();return true;
 }
 function close(confirm){
  if(!open)return;
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
  }else if(confirm){const s=storage();if(s&&A.save(s,uid(),draft)){try{if(typeof state!=='undefined'&&state?.story?.flags){state.story.flags.appearanceChosen=true;state.story.flags.appearanceOffered=true;}}catch{}root.VoidCharacterCreator.onChange?.(A.normalize(draft));upload(A.normalize(draft)).then(()=>root.VoidRemotePlayers?.refreshLook?.());}}
  else if(ctx.context==='first'){try{state.story.flags.appearanceOffered=true;}catch{}}
  open=false;cancelAnimationFrame(raf);seq++;char?.dispose();char=null;holder?.dispose();holder=null;{const sc=root.VoidBabylon?.scene;for(const l of lamps)l.dispose();lamps=[];sc?.markAllMaterialsAsDirty?.(root.BABYLON.Constants.MATERIAL_LightDirtyFlag);}ui.classList.remove('on');ui.innerHTML='';
  Object.assign(walker,snapshot.walker);mode=snapshot.mode;
  const done=ctx.onClose;ctx=null;if(confirm&&typeof save==='function')try{save();}catch{}
  if(snapshot.mode==='walking'&&typeof resumeWalking==='function')resumeWalking();
  done?.(confirm,confirm?A.normalize(draft):null);
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

 // First campaign without any character: offer the creator once when the player is about to leave the pod. Existing players and saves are never asked.
 function wire(){
  const wake=document.getElementById('pod-wake');if(!wake)return;
  wake.addEventListener('click',e=>{
   if(!e.target.closest('button')||open||mode!=='pod-waking')return;
   let offered=true;try{offered=!!state.story.flags.appearanceOffered;}catch{}
   if(offered||stored())return;
   e.stopImmediatePropagation();e.preventDefault();
   const card=wake;card.hidden=true;show({context:'first',onClose:()=>{mode='pod-waking';card.hidden=false;card.querySelector('button')?.focus({preventScroll:true});}});
  },true);
 }
 if(typeof document!=='undefined')(document.readyState==='loading'?document.addEventListener.bind(document,'DOMContentLoaded'):f=>f())(wire);
})(globalThis);
