// Resolve input ownership without changing gameplay mode, mission state or the network session.
(function(root){
  'use strict';
  function policy(name,lock,camera,movement,ui,shortcuts){
    return Object.freeze({name,pointerLock:lock,cursor:!lock,camera,movement,ui,shortcuts});
  }
  const states={
    exploration:policy('exploration',true,true,true,false,'game'),
    flight:policy('flight',false,true,true,false,'game'),
    feed:policy('feed',true,true,false,false,'activity'),
    seated:policy('seated',true,true,false,false,'seat'),
    floating:policy('conversation',true,true,true,true,'interface'),
    floatingSeated:policy('conversation',true,true,false,true,'interface'),
    floatingCursor:policy('conversation',false,false,true,true,'interface'),
    conversation:policy('conversation',false,false,false,true,'interface'),
    activity:policy('activity',false,false,false,true,'interface'),
    store:policy('store',false,false,false,true,'interface'),
    device:policy('device',false,false,false,true,'interface'),
    vr:policy('vr',false,false,false,true,'interface'),
    menu:policy('menu',false,false,false,true,'interface'),
    cursor:policy('cursor',false,false,false,true,'interface'),
    background:policy('background',false,false,false,false,'none'),
    loading:policy('loading',false,false,false,true,'interface')
  };
  function resolve(mode,surface,away,manual,seated){
    if(away)return states.background;
    if(surface==='floating'){
      if(mode==='walking'&&!seated)return manual?states.floatingCursor:states.floating;
      if(!manual&&(mode==='vr-seated'||mode==='walking'&&seated))return states.floatingSeated;
      return states.conversation;
    }
    if(surface&&surface!=='feed')return states[surface];
    if(surface==='feed')return manual?states.cursor:states.feed;
    if(/prepar|loading|transition/.test(mode))return states.loading;
    if(manual)return states.cursor;
    if(seated||['vr-seated','food-seated','pod-waking'].includes(mode))return states.seated;
    if(['walking','skirmish-fps'].includes(mode))return states.exploration;
    if(['play','transit3d'].includes(mode))return states.flight;
    if(mode==='dialogue')return states.conversation;
    if(mode==='equipment')return states.store;
    if(mode==='arcade')return states.activity;
    if(mode.startsWith('vr-'))return states.vr;
    return states.menu;
  }
  if(typeof module!=='undefined')module.exports={resolve,states};
  if(!root.document)return;
  const surfaces=[
    ['loading','#district-transition,#milked-transition,#vr-transition,#gate-transit,#landing-seq'],
    ['menu','dialog[open],#dev-balance,#keymap,#personal-hud,#mission-log,#character-creator'],
    ['device','#personal-device.open,#pd-callpill,#pod-music-input'],
    ['vr','#vr-menu'],
    ['store','#trade-window,#trade-toast:has(button),.pod-vend,#shop-here:has(button)'],
    ['activity','#milked-studio-request-panel,#arcade-play'],
    ['feed','#cam-feed'],
    ['floating','#screen.conversation-live,.vr-companion-menu,.tea-duo-choices'],
    ['conversation','#screen:has(.dialogue-window)'],
    ['menu','#screen:has(button),[role="dialog"]:not(#personal-device)']
  ];
  const watched='#screen,#personal-device,.pod-vend,.vr-companion-menu,'+
    surfaces.map(([,selector])=>selector.replaceAll(/:has\([^)]+\)/g,'')).join(',');
  const visible=el=>!el.closest('[hidden],.hidden,[aria-hidden="true"]')&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
  let surface=null,panel=null,manual=false,away=document.hidden||document.hasFocus?.()===false,previous=null,tip=null;
  const gameMode=()=>typeof mode==='string'?mode:'menu';
  const current=()=>resolve(gameMode(),surface,away||document.hidden,manual,root.VoidTeaDuo?.seated||root.VoidVehicle?.driving);   // driving the utility vehicle (vehicle.js) uses the seated policy
  function clear(keepWalking=false){
    if(typeof walkingKeys!=='undefined'){
      if(keepWalking){
        for(const key of walkingKeys)if(!['KeyW','KeyA','KeyS','KeyD'].includes(key))walkingKeys.delete(key);
      }else walkingKeys.clear();
    }
    for(const player of [typeof walker==='undefined'?null:walker,root.VoidSkirmish?.active?.player]){
      if(player){player.vx=0;player.vz=0;player.jumpRequested=false;}
    }
    if(typeof clearInput==='function')clearInput();
    root.VoidInput?.virtual?.clear();
    if(typeof groundState!=='undefined')groundState.aim=false;
    root.dispatchEvent(new Event('void-input-clear'));
  }
  function refresh(){
    const state=current(),lock=document.pointerLockElement;
    if(previous!==state){if(!state.movement||state.ui)clear(!!previous?.movement&&state.movement);previous=state;}
    // A pending pod request can resolve after the exit to walking. Only the current view may keep capture.
    if(lock&&(!state.pointerLock||(lock.id==='pod-wake'&&gameMode()!=='pod-waking')))document.exitPointerLock?.();
    const game=['walking','skirmish-fps','food-seated','vr-seated'].includes(gameMode());
    if(!tip&&game){tip=document.createElement('div');tip.id='resume-hint';tip.style.cssText='position:fixed;bottom:7%;right:2%;padding:4px 8px;color:#9bded6;background:#08151bcc;font:11px monospace;letter-spacing:.07em;pointer-events:none;z-index:40';document.body.append(tip);}
    if(tip){
      const cursorKey=root.VoidInput?.label?.(root.VoidInput.bindings.cursor)||'ESC';
      const label=state===states.background?'CLICK TO RETURN TO THE GAME':state.pointerLock?(lock?(state.ui?cursorKey+' · FREE CURSOR':'MOUSE LOOK'):'CLICK VIEW FOR MOUSE LOOK'):'CURSOR';
      if(tip.textContent!==label)tip.textContent=label;
      tip.hidden=!game||root.VoidControls?.deviceClass==='touch-first';
    }
    return state;
  }
  function scan(){
    const priorPanel=panel;panel=null;surface=null;
    for(const [name,selector] of surfaces){
      panel=Array.from(document.querySelectorAll(selector)).find(visible);
      if(panel){surface=panel.id==='screen'&&name==='menu'&&gameMode()==='equipment'?'store':name;break;}
    }
    if(panel&&panel!==priorPanel&&!panel.contains(document.activeElement)&&['store','activity','conversation','floating'].includes(surface)){
      const first=[...panel.querySelectorAll('button:not([disabled]),[role="button"]')].find(visible);
      first?.focus({preventScroll:true});
    }
    refresh();
  }
  // Observe panel roots, not the changing text of HUD counters or subtitles.
  const observer=new MutationObserver(records=>{
    if(records.some(r=>r.type==='attributes'?r.target.matches(watched)||(panel&&r.target.contains(panel)):
      r.target.id==='screen'||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches(watched)||n===panel))))scan();
  });
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','class','aria-hidden']});
  root.addEventListener('blur',()=>{away=true;manual=false;clear();refresh();});
  root.addEventListener('focus',()=>{away=false;scan();});
  document.addEventListener('visibilitychange',()=>{away=document.hidden||!document.hasFocus();manual=false;if(away)clear();scan();});
  let lastUnlock=-Infinity,hadLock=false;
  document.addEventListener('pointerlockchange',()=>{
    if(!document.pointerLockElement){if(hadLock)lastUnlock=performance.now();const state=current();clear(state.name==='conversation'&&state.movement);}
    hadLock=!!document.pointerLockElement;
    refresh();
  });
  function freeMouse(){
    if(document.pointerLockElement){document.exitPointerLock?.();return true;}
    // Some browsers dispatch the unlock just before delivering the Escape key.
    if(performance.now()-lastUnlock<180){lastUnlock=-Infinity;return true;}
    return false;
  }
  root.addEventListener('keydown',e=>{
    const voice=root.VoidVoice?.settings;
    if(e.code===root.VoidInput?.bindings?.cursor&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.getModifierState?.('AltGraph')&&
      !(voice?.enabled&&voice.mode==='ptt'&&voice.pttKey===e.code)&&(current().pointerLock||current()===states.flight)){
      manual=true;refresh();return;
    }
    if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
    if(!panel||!current().ui)return;
    // Walking toward the cot dismisses its navigation hint and returns the movement key to the game.
    if(panel.dataset.approach&&['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){
      panel.querySelector('button')?.click();scan();return;
    }
    if(e.code==='Escape'){
      if(surface==='floating'&&freeMouse()){e.preventDefault();e.stopImmediatePropagation();return;}
      const dismiss=panel.querySelector('[data-input-dismiss],.conversation-minimize');
      if(dismiss){e.preventDefault();e.stopImmediatePropagation();dismiss.click();}return;
    }
    if((e.code==='Enter'||e.code==='Space')&&e.target.tagName==='BUTTON'&&panel.contains(e.target)){
      e.preventDefault();e.stopImmediatePropagation();e.target.click();return;
    }
    if(!['conversation','activity'].includes(current().name))return;
    const choices=[...panel.querySelectorAll('.speech-controls #speech-next,.speech-controls [data-talk-choice],.tea-duo-choices button,.choice-menu button[data-action]')].filter(visible);
    const i=/^Digit[1-9]$/.test(e.code)?Number(e.code.slice(-1))-1:-1;
    if(i>=0&&choices[i]){e.preventDefault();e.stopImmediatePropagation();if(!choices[i].disabled)choices[i].click();}
    if(choices.length&&['ArrowDown','ArrowUp'].includes(e.code)){
      e.preventDefault();e.stopImmediatePropagation();const buttons=choices.filter(b=>!b.disabled);
      if(buttons.length){const at=buttons.indexOf(document.activeElement);buttons[(at<0?0:(at+(e.code==='ArrowDown'?1:-1)+buttons.length)%buttons.length)].focus();}
    }
  },true);
  root.addEventListener('keyup',e=>{if(manual&&e.code===root.VoidInput?.bindings?.cursor){manual=false;refresh();}},true);
  function capture(element){
    if(!current().pointerLock||!element?.requestPointerLock||document.pointerLockElement===element||
      (navigator.userActivation&&!navigator.userActivation.isActive))return;
    return element.requestPointerLock();
  }
  root.VoidInputState={get current(){return current();},refresh,scan,capture,freeMouse};
  // Mode changes can occur without adding or removing a panel.
  function frame(){if(current()!==previous)refresh();requestAnimationFrame(frame);}
  requestAnimationFrame(()=>{scan();frame();});
})(globalThis);
