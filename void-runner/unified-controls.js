/* Shared device input for Campaign, Skirmish, and flight. Gameplay owns consequences. */
(function(root){
  const input=VoidInput,canvas=document.getElementById('space'),activeModes=new Set(['walking','skirmish-fps','play']);
  const isWindows=/Win/i.test(navigator.platform||'')||/Windows/i.test(navigator.userAgent||'');
  const coarse=matchMedia('(pointer:coarse)').matches,fine=matchMedia('(any-pointer:fine)').matches;
  const touchFirst=!isWindows&&((coarse&&!fine)||(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)&&coarse));
  let active='keyboard',padIndex=-1,previousButtons=[],previousAxes=[0,0,0,0],capture=null,movePointer=null,lookPointer=null,lastMode='',lastPrompt='';
  const touchHeld=new Set(),padHeld=new Set(),move={x:0,z:0};
  const names=['A / Cross','B / Circle','X / Square','Y / Triangle','LB / L1','RB / R1','LT / L2','RT / R2','Back','Start','LS','RS','D-pad Up','D-pad Down','D-pad Left','D-pad Right','Home'];
  const fpsActions=['fire','aim','jump','interact','reload','draw','crouch','sprint','pause'],flightActions=['fire','missile','nearest','next','previous','lock','throttleUp','throttleDown','pause'];
  const axisKeys=Object.keys(input.axes);
  const layer=document.createElement('div');layer.id='device-controls';layer.innerHTML='<div id="device-move" aria-label="Movement joystick"><span class="device-stick"></span></div><div id="device-look" aria-label="Drag to look"></div><div id="device-actions"></div><div id="device-rotate" role="status">ROTATE DEVICE<br><small>VOID//RUNNER is designed for landscape gameplay.</small></div>';document.body.append(layer);
  const moveEl=layer.querySelector('#device-move'),knob=moveEl.firstElementChild,lookEl=layer.querySelector('#device-look'),buttons=layer.querySelector('#device-actions');
  function setActive(value){if(active===value)return;active=value;document.body.dataset.inputDevice=value;refreshPrompts();}
  function label(id){if(active==='gamepad'){const n=input.controller.bindings[id];return names[n]||'Controller';}if(active==='touch')return id.toUpperCase();return input.label(input.bindings[id]||{jump:'Space',interact:'KeyE',reload:'KeyR',draw:'Digit1'}[id]||id);}
  function refreshPrompts(){
    const text=active==='gamepad'?'GAMEPAD':active==='touch'?'TOUCH':'KEYBOARD';
    if(lastPrompt===text)return;lastPrompt=text;
    document.body.dataset.inputDevice=active;
  }
  function dispatch(id,pressed){
    if(id==='pause'){if(pressed){if(mode==='menu'&&VoidMenu.returnTo)resumeMenu();else if(activeModes.has(mode))openGameMenu();}return;}
    if(mode==='walking'){
      if(id==='interact'){if(pressed)interactWalking();return;}
      if(id==='aim'){if(pressed&&!groundState.aim)groundAction('aim');if(!pressed)groundState.aim=false;return;}
      if(id==='fire'){if(pressed)groundAction('fire');return;}
      if(pressed&&['jump','reload','draw','inventory'].includes(id))groundAction(id);
      return;
    }
    if(mode==='skirmish-fps'){root.VoidSkirmish?.action(id,pressed);return;}
    if(mode==='play'&&pressed){
      if(id==='missile')fireMissile();
      else if(['nearest','next','previous','clear','lock'].includes(id))selectCombatTarget(id);
    }
  }
  function startTouch(id){touchHeld.add(id);input.virtual.add(id);dispatch(id,true);setActive('touch');}
  function stopTouch(id){touchHeld.delete(id);input.virtual.delete(id);dispatch(id,false);}
  function clearTouch(){for(const id of [...touchHeld])stopTouch(id);movePointer=lookPointer=null;move.x=move.z=0;knob.style.transform='translate(-50%,-50%)';}
  function refreshButtons(){const flight=mode==='play';const spec=flight?[['fire','FIRE'],['missile','MISSILE'],['throttleUp','THRUST +'],['throttleDown','BRAKE'],['nearest','TARGET'],['lock','LOCK']]:[['fire','FIRE'],['aim','AIM'],['jump','JUMP'],['interact','INTERACT'],['reload','RELOAD'],['draw','DRAW'],['sprint','RUN']];
    const signature=mode;if(buttons.dataset.signature===signature)return;buttons.dataset.signature=signature;buttons.innerHTML=spec.filter(([id])=>id!=='interact'||mode==='walking').map(([id,text])=>'<button type="button" data-device-action="'+id+'" aria-label="'+text+'">'+text+'</button>').join('');
  }
  function resetMove(){move.x=move.z=0;movePointer=null;knob.style.transform='translate(-50%,-50%)';}
  function moveStick(e){const r=moveEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,limit=r.width*.35;let x=(e.clientX-cx)/limit,y=(e.clientY-cy)/limit;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}if(length<.13){x=0;y=0;}move.x=x;move.z=-y;knob.style.transform='translate(calc(-50% + '+(x*limit)+'px),calc(-50% + '+(y*limit)+'px))';}
  moveEl.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||movePointer!==null)return;e.preventDefault();movePointer=e.pointerId;moveEl.setPointerCapture(e.pointerId);moveStick(e);setActive('touch');});
  moveEl.addEventListener('pointermove',e=>{if(e.pointerId===movePointer){e.preventDefault();moveStick(e);}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])moveEl.addEventListener(type,e=>{if(e.pointerId===movePointer)resetMove();});
  lookEl.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||lookPointer!==null)return;e.preventDefault();lookPointer={id:e.pointerId,x:e.clientX,y:e.clientY};lookEl.setPointerCapture(e.pointerId);setActive('touch');});
  lookEl.addEventListener('pointermove',e=>{if(!lookPointer||e.pointerId!==lookPointer.id)return;e.preventDefault();const dx=e.clientX-lookPointer.x,dy=e.clientY-lookPointer.y;lookPointer.x=e.clientX;lookPointer.y=e.clientY;if(mode==='walking'&&walker){walker.yaw+=dx*VoidExplorer.config.sensitivity;walker.pitch=FM.clamp(walker.pitch+dy*VoidExplorer.config.sensitivity,-1.35,1.35);}else if(mode==='skirmish-fps'&&root.VoidSkirmish?.active){const p=root.VoidSkirmish.active.player;p.yaw+=dx*VoidExplorer.config.sensitivity;p.pitch=FM.clamp(p.pitch+dy*VoidExplorer.config.sensitivity,-1.25,1.25);}else if(mode==='play')aim(e);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])lookEl.addEventListener(type,e=>{if(lookPointer?.id===e.pointerId){lookPointer=null;if(mode==='play')flight.mouseX=flight.mouseY=0;}});
  buttons.addEventListener('pointerdown',e=>{const button=e.target.closest('button[data-device-action]');if(!button||e.pointerType==='mouse')return;e.preventDefault();button.setPointerCapture(e.pointerId);button.dataset.pointer=String(e.pointerId);startTouch(button.dataset.deviceAction);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])buttons.addEventListener(type,e=>{const button=e.target.closest('button[data-device-action]');if(button?.dataset.pointer===String(e.pointerId)){delete button.dataset.pointer;stopTouch(button.dataset.deviceAction);}});
  for(const type of ['contextmenu','selectstart','dragstart'])layer.addEventListener(type,e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')setActive('keyboard');},true);
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&Math.abs(e.movementX)+Math.abs(e.movementY)>2)setActive('keyboard');},true);
  for(const type of ['contextmenu','selectstart','dragstart'])canvas.addEventListener(type,e=>{if(touchFirst&&activeModes.has(mode))e.preventDefault();});
  addEventListener('keydown',e=>{if(!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.target.isContentEditable)setActive('keyboard');},true);
  addEventListener('blur',clearTouch);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTouch();});
  function dead(value,threshold){const n=Math.abs(value);return n<=threshold?0:Math.sign(value)*(n-threshold)/(1-threshold);}
  function gamepad(){try{for(const pad of navigator.getGamepads?.()||[])if(pad&&pad.connected!==false&&(pad.mapping==='standard'||pad.axes?.length>=4))return pad;return null;}catch{return null;}}
  function pollPad(dt){
    const pad=gamepad();if(!pad){if(padIndex>=0){for(const id of padHeld){dispatch(id,false);input.virtual.delete(id);}padHeld.clear();previousButtons=[];previousAxes=[0,0,0,0];padIndex=-1;if(active==='gamepad')setActive(touchFirst?'touch':'keyboard');}return;}
    if(pad.index!==padIndex){padIndex=pad.index;previousButtons=[];previousAxes=[0,0,0,0];padHeld.clear();}
    const c=input.controller,digital=mode==='play'?flightActions:fpsActions;
    const raw=pad.buttons.map(b=>!!b&&(b.pressed||b.value>.55));const lx=dead(pad.axes[0]||0,c.leftDeadZone),ly=dead(pad.axes[1]||0,c.leftDeadZone),rx=dead(pad.axes[2]||0,c.rightDeadZone),ry=dead(pad.axes[3]||0,c.rightDeadZone);
    if(capture){const index=raw.findIndex((pressed,i)=>pressed&&!previousButtons[i]);if(index>=0){const result=input.bindController(capture,index),status=document.getElementById('device-binding-status');if(result.error){if(status)status.textContent=result.error;}else{capture=null;mainAction('device-bindings');if(document.getElementById('device-binding-status'))document.getElementById('device-binding-status').textContent=result.saved?'Binding saved.':'Binding active for this session.';}}previousButtons=raw;return;}
    const axes=[lx,ly,rx,ry];if((Math.hypot(...axes)>.24&&axes.some((value,i)=>Math.abs(value-previousAxes[i])>.08))||raw.some((pressed,i)=>pressed&&!previousButtons[i]))setActive('gamepad');
    if(active==='gamepad'){input.axes.moveX=lx;input.axes.moveZ=-ly;input.axes.flightX=lx;input.axes.flightY=ly;input.axes.roll=rx;input.axes.lookX=rx;input.axes.lookY=ry*(c.invertY?-1:1);
      if(mode==='walking'&&walker){walker.yaw+=rx*c.sensitivity*dt*2.5;walker.pitch=FM.clamp(walker.pitch+input.axes.lookY*c.sensitivity*dt*2.5,-1.35,1.35);}
      else if(mode==='skirmish-fps'&&root.VoidSkirmish?.active){const p=root.VoidSkirmish.active.player;p.yaw+=rx*c.sensitivity*dt*2.5;p.pitch=FM.clamp(p.pitch+input.axes.lookY*c.sensitivity*dt*2.5,-1.25,1.25);}
    }
    for(const id of digital){const index=c.bindings[id],pressed=!!raw[index]&&active==='gamepad'&&(activeModes.has(mode)||(id==='pause'&&mode==='menu'&&VoidMenu.returnTo));if(pressed){input.virtual.add(id);padHeld.add(id);}else{input.virtual.delete(id);padHeld.delete(id);}if(pressed&&!previousButtons[index])dispatch(id,true);else if(!pressed&&previousButtons[index])dispatch(id,false);}
    if(active==='gamepad'&&mode==='walking'&&raw[c.bindings.fire])dispatch('fire',true);
    if(active==='gamepad'&&mode==='skirmish-fps'&&raw[c.bindings.fire])dispatch('fire',true);
    previousButtons=raw;previousAxes=axes;
  }
  function poll(dt){
    if(lastMode!==mode){clearTouch();for(const id of padHeld)input.virtual.delete(id);padHeld.clear();lastMode=mode;buttons.dataset.signature='';}
    if(capture&&!document.getElementById('device-binding-status'))capture=null;
    const gameplay=activeModes.has(mode),show=touchFirst&&gameplay&&active!=='gamepad';
    layer.classList.toggle('visible',show);document.body.classList.toggle('mobile-gameplay',show);
    layer.classList.toggle('flight',mode==='play');layer.classList.toggle('portrait',show&&innerHeight>innerWidth);
    if(show)refreshButtons();
    for(const key of axisKeys)input.axes[key]=0;
    pollPad(dt);
    if(show){input.axes.moveX=move.x;input.axes.moveZ=move.z;if(mode==='play'){input.axes.flightX=move.x;input.axes.flightY=-move.z;}}
    if(touchHeld.has('fire')&&mode==='walking')dispatch('fire',true);
    if(touchHeld.has('fire')&&mode==='skirmish-fps')dispatch('fire',true);
  }
  function applyPrompts(){if(active==='keyboard')return;const tutorial=document.getElementById('tutorial-prompt');if(tutorial&&!tutorial.hidden){let value=tutorial.textContent;for(const [pattern,replacement] of [[/WASD \/ touch arrows/g,'LEFT STICK'],[/Space \/ Jump/g,label('jump')+' / Jump'],[/E \/ Interact/g,label('interact')+' / Interact'],[/Hold Shift/g,'Hold '+label('sprint')],[/right mouse \/ Aim/g,label('aim')+' / Aim'],[/Left mouse \/ Fire/g,label('fire')+' / Fire'],[/R \/ Reload/g,label('reload')+' / Reload'],[/1 \/ Draw/g,label('draw')+' / Draw']])value=value.replace(pattern,replacement);if(value!==tutorial.textContent)tutorial.textContent=value;}const hint=document.querySelector('#skirmish-hud .skirmish-controls');if(hint){const value=active==='gamepad'?'LEFT STICK MOVE · RIGHT STICK LOOK · '+label('fire')+' FIRE · '+label('aim')+' AIM · '+label('reload')+' RELOAD · '+label('pause')+' MENU':'JOYSTICK MOVE · DRAG LOOK · TOUCH ACTION BUTTONS';if(hint.textContent!==value)hint.textContent=value;}}
  const beforeUpdate=update;update=function(dt){poll(dt);beforeUpdate(dt);applyPrompts();};
  const baseSettings=settingsPage;settingsPage=function(){baseSettings();const section=screen.querySelector('.settings-panel');section.insertAdjacentHTML('beforeend','<h2>Controls / Gamepad</h2>'+button('GAMEPAD BUTTONS','device-bindings',true)+'<label>Controller look sensitivity<input id="device-sensitivity" type="range" min="0.25" max="2.5" step="0.05" value="'+input.controller.sensitivity+'"><output>'+input.controller.sensitivity+'</output></label><label>Left stick dead zone<input id="device-left-zone" type="range" min="0.05" max="0.4" step="0.01" value="'+input.controller.leftDeadZone+'"><output>'+input.controller.leftDeadZone+'</output></label><label>Right stick dead zone<input id="device-right-zone" type="range" min="0.05" max="0.4" step="0.01" value="'+input.controller.rightDeadZone+'"><output>'+input.controller.rightDeadZone+'</output></label><label>Invert controller Y<input id="device-invert" type="checkbox" '+(input.controller.invertY?'checked':'')+'></label><h2>Display</h2>'+button('FULLSCREEN: '+(document.fullscreenElement?'ON':'OFF'),'device-fullscreen',true)+'<p id="fullscreen-status" class="fine"></p>');};
  const baseAction=mainAction;mainAction=function(a){if(a==='device-bindings'){bindingsPage();screen.querySelector('.settings-panel').innerHTML='<h1>Gamepad buttons</h1><p>Select an action, then press a controller button.</p>'+Object.entries(input.controller.bindings).map(([id,index])=>'<div class="binding-row"><span>'+id+'</span>'+button(names[index]||String(index),'device-bind:'+id,true)+'</div>').join('')+'<p id="device-binding-status" role="status"></p>'+button('RESET GAMEPAD','device-reset',true)+button('BACK','bindings-back',true);return;}if(a==='device-reset'){input.resetController();mainAction('device-bindings');return;}if(a?.startsWith('device-bind:')){capture=a.slice(12);const status=document.getElementById('device-binding-status');if(status)status.textContent='Press a controller button for '+capture+'…';return;}if(a==='device-fullscreen'){toggleFullscreen();return;}baseAction(a);};
  screen.addEventListener('input',e=>{const key={'device-sensitivity':'sensitivity','device-left-zone':'leftDeadZone','device-right-zone':'rightDeadZone'}[e.target.id];if(!key)return;input.controller[key]=Number(e.target.value);input.persist();e.target.nextElementSibling.value=e.target.value;});
  screen.addEventListener('change',e=>{if(e.target.id==='device-invert'){input.controller.invertY=e.target.checked;input.persist();}});
  function syncFullscreen(){const b=screen.querySelector('[data-action="device-fullscreen"]');if(b)b.textContent='FULLSCREEN: '+(document.fullscreenElement?'ON':'OFF');resize();root.VoidBabylon?.resizeViewport?.(W,H);}
  async function toggleFullscreen(){const status=document.getElementById('fullscreen-status');try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.body.requestFullscreen)await document.body.requestFullscreen();else throw new Error('Fullscreen is unavailable in this browser.');}catch(error){if(status)status.textContent=error.message||'Fullscreen was declined.';}finally{syncFullscreen();}}
  document.addEventListener('fullscreenchange',syncFullscreen);addEventListener('resize',syncFullscreen);root.visualViewport?.addEventListener('resize',syncFullscreen);
  root.VoidControls={get deviceClass(){return touchFirst?'touch-first':'desktop-hybrid';},get active(){return active;},label,poll,clearTouch,toggleFullscreen};
  document.body.dataset.deviceClass=touchFirst?'touch-first':'desktop-hybrid';
})(globalThis);
