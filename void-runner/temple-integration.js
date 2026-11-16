/* Zen Zephyr Temple: game wiring (browser only). Registers the walking location, the interaction handlers, the return cab, and the typed conversation panel.
   The conversation is LOCAL (zen-chat.js): not an AI, no network. Nothing here is saved except the map fog (written by temple-build.js) and the taxi's own trip record (road-taxi-rules.js). */
(function(root){
 'use strict';
 const T=root.VoidTemple,Z=root.VoidZenChat;if(!T||!Z||typeof document==='undefined')return;
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof VoidExplorationData==='undefined'||typeof announce==='undefined')return;clearInterval(wait);start();},400);
 function start(){
  VoidExplorationData.locations.temple=T.layout();
  const done=()=>{try{resumeWalking();}catch{}};
  const note=t=>{done();try{announce(t);}catch{}};
  const R=(a,f)=>VoidInteractions.register(a,f);
  const chat=Z.create();T.chat=chat;   // a future API dialogue registers on T.chat.registerProvider(...) and is switched on with T.chat.enableProvider(true); it is OFF by default
  R('temple-cab',()=>{done();if(!root.VoidRoadTaxi?.returnFrom){note('The taxi is not available.');return;}root.VoidRoadTaxi.returnFrom('temple','cab');});
  R('temple-walk',()=>{done();if(!root.VoidRoadTaxi?.returnFrom){note('The gate is not available.');return;}root.VoidRoadTaxi.returnFrom('temple','foot');});   // the East Gate's walkers' lane (16 Nov 2026)
  R('temple-altar',({item})=>note(T.ALTAR_TEXT[item?.altar]||'DATA ALTAR: the glass is warm and still.'));
  R('temple-incense',()=>note('Blue-flame incense. It burns without smoke and smells faintly of warm metal and rain.'));
  R('temple-overlook',()=>note('Far below to the south-east the city glows through the mist: towers, traffic, neon. From here it is almost silent.'));
  // ---- the conversation panel ----
  const css=document.createElement('style');css.textContent='#zen-chat{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);width:min(680px,94vw);max-height:78vh;overflow:hidden;z-index:60;display:flex;flex-direction:column;background:rgba(4,12,17,.94);border:1px solid #2a7f8a;box-shadow:0 0 40px rgba(56,232,255,.12);font:14px Consolas,monospace;color:#cfeff5}#zen-chat[hidden]{display:none}#zen-chat header,#zen-chat form,#zen-chat details{flex:none}#zen-chat header{padding:8px 12px;border-bottom:1px solid #1d4f58;display:flex;justify-content:space-between;gap:10px;align-items:baseline;background:#07161c;position:relative;z-index:2}#zen-chat header b{color:#7fe9ff;letter-spacing:.12em}#zen-chat header span{color:#ffb347;font-size:11px;letter-spacing:.1em}#zen-log{padding:10px 12px;overflow:auto;flex:1 1 140px;min-height:90px;max-height:34vh;contain:paint;position:relative;z-index:1}#zen-log p{margin:0 0 9px;line-height:1.45}#zen-log .you{color:#9fb0b8}#zen-log .zen{color:#d9f6ff}#zen-log .zen:before{content:"ZEN ZEPHYR  ";color:#38e8ff;font-size:11px;letter-spacing:.1em}#zen-log .you:before{content:"YOU  ";color:#6a8790;font-size:11px;letter-spacing:.1em}#zen-chat form{display:flex;gap:8px;padding:8px 12px;border-top:1px solid #1d4f58}#zen-chat input{flex:1;background:#06141a;border:1px solid #2a7f8a;color:#e8fbff;padding:7px 9px;font:inherit}#zen-chat button{background:#0b2a33;border:1px solid #2a7f8a;color:#7fe9ff;padding:6px 12px;font:inherit;cursor:pointer;letter-spacing:.08em}#zen-chat button:hover,#zen-chat button:focus-visible{background:#12414d;outline:none}#zen-chat details{padding:0 12px 8px}#zen-chat summary{cursor:pointer;color:#7fe9ff;padding:4px 0;letter-spacing:.08em}#zen-list{display:grid;gap:4px;max-height:22vh;overflow:auto;margin-top:4px}#zen-list button{text-align:left;letter-spacing:0;font-size:12px;padding:5px 8px}';document.head.appendChild(css);
  const panel=document.createElement('section');panel.id='zen-chat';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Conversation with Zen Zephyr');
  panel.innerHTML='<header><b>ZEN ZEPHYR</b><span>'+Z.LABEL+'</span></header><div id="zen-log" aria-live="polite"></div><details><summary>CHOOSE A TEACHING ('+Z.QUOTES.length+')</summary><div id="zen-list"></div></details><form autocomplete="off"><input type="text" maxlength="200" aria-label="Type to Zen Zephyr" placeholder="Type, and press Enter. Try: fear, silence, the city, code, rest."><button type="submit">SEND</button><button type="button" data-close>LEAVE · ESC</button></form>';
  document.body.appendChild(panel);
  const log=panel.querySelector('#zen-log'),input=panel.querySelector('input'),list=panel.querySelector('#zen-list');let open=false;
  const line=(who,text)=>{const p=document.createElement('p');p.className=who;p.textContent=text;log.appendChild(p);log.scrollTop=log.scrollHeight;};
  for(const q of Z.QUOTES){const b=document.createElement('button');b.type='button';b.textContent=q.text;b.dataset.quote=q.id;list.appendChild(b);}
  list.addEventListener('click',e=>{const b=e.target.closest('[data-quote]');if(!b)return;const r=chat.choose(b.dataset.quote);if(r){line('you','(asks for a teaching)');line('zen',r.text);}input.focus();});
  panel.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const t=input.value.trim();if(!t)return;input.value='';line('you',t);const r=await chat.ask(t);line('zen',r.text);});
  // Typing must not move the player or trigger game keys, and Escape closes this panel, not the pause menu.
  const stop=e=>{e.stopPropagation();};panel.addEventListener('keydown',e=>{stop(e);if(e.key==='Escape'){e.preventDefault();close();}},false);panel.addEventListener('keyup',stop,false);panel.addEventListener('keypress',stop,false);
  panel.addEventListener('click',e=>{if(e.target.closest('[data-close]'))close();});
  function show(){if(open)return;open=true;document.exitPointerLock?.();try{walkingKeys.clear();}catch{}try{mode='dialogue';}catch{}panel.hidden=false;if(!log.children.length)line('zen',chat.local('hello').text);setTimeout(()=>input.focus(),30);}
  function close(){if(!open)return;open=false;panel.hidden=true;input.blur();done();}
  T.panel={show,close,get isOpen(){return open;}};
  R('temple-monk',()=>show());
 }
})(globalThis);
