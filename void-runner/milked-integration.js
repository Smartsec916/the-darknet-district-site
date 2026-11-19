/* Milked: registers the interior as a place and the interaction handlers (milked.js has the data, milked-build.js the 3D build). Browser only.
   Everything here is provisional placeholder text. Nothing starts a mission and nothing is saved except the usual "met" entry a conversation records. */
(function(root){
 'use strict';
 const MK=root.VoidMilked;if(!MK||typeof document==='undefined')return;
 // The inside of Milked is a place of its own (milked.js layout(), milked-build.js build()), reached only through the front vestibule or the rear lobby
 // (milked-transition.js). It is not a save location: nothing here writes to the save.
 try{if(typeof VoidExplorationData!=='undefined'&&VoidExplorationData.locations&&MK.layout)VoidExplorationData.locations[MK.KEY]=MK.layout();}catch(e){console.warn('[Milked]',e);}
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof talk==='undefined')return;clearInterval(wait);start();},300);
 function start(){
  // The two characters get a name and role for the dialogue window (they are separate from the VR companion Eva).
  const chars=root.VoidStoryContent?.characters;
  if(chars)for(const m of [MK.MODELS.eva,MK.MODELS.fish])if(!chars[m.id])chars[m.id]={id:m.id,name:m.name,role:m.role,portrait:'art/characters.png',cell:'0% 0%',faction:'independent',tags:['milked'],biography:'Placeholder. Provisional until approved.',relationshipDefault:0};
  const done=()=>{try{resumeWalking();}catch{}};
  const say=(who,texts)=>talk('',texts.map(text=>({who,text})),done,'CLOSE');
  const note=text=>{done();try{announce(text);}catch{}};
  const R=(action,fn)=>VoidInteractions.register(action,fn);
  R('milked-eva',()=>say(MK.MODELS.eva.id,MK.DIALOGUE.eva.greeting));
  R('milked-fish',()=>say(MK.MODELS.fish.id,MK.DIALOGUE.fish.greeting));
  R('milked-intercom',()=>note('VISITOR CHECK-IN: adults only. Card accepted. Stand in the middle of the vestibule: the doors seal, then the inner doors open.'));
  R('milked-security',()=>note('SECURITY MONITORS: vestibule, hallway, rear door and the side street. Nothing unusual.'));
  // Same E interaction and ON AIR notice as before, with a compact semi-transparent local-only request panel.
  const style=document.createElement('style');
  style.textContent=`
   #milked-animation-panel{position:fixed;right:clamp(12px,3vw,38px);bottom:clamp(24px,7vh,90px);width:min(330px,calc(100vw - 24px));z-index:2147482000;
    background:rgba(8,12,18,.64);color:#f1eff5;border:1px solid rgba(255,112,180,.7);border-radius:12px;
    box-shadow:0 8px 32px rgba(0,0,0,.33);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
    padding:16px;font:14px/1.45 system-ui,sans-serif;pointer-events:auto;}
   #milked-animation-panel[hidden]{display:none!important}
   #milked-animation-panel .mk-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
   #milked-animation-panel h2{font:600 15px system-ui,sans-serif;letter-spacing:.08em;margin:0;color:#ffb2d3}
   #milked-animation-panel p{margin:7px 0;color:#e8e5ed}
   #milked-animation-panel .mk-small{font-size:12px;color:#c9d2d9}
   #milked-animation-panel label{display:block;margin:12px 0 5px;color:#ccebdc}
   #milked-animation-panel select{display:block;width:100%;box-sizing:border-box;min-height:38px;padding:7px 10px;
    color:#f5f5f5;background:rgba(10,19,24,.76);border:1px solid rgba(117,221,184,.65);border-radius:7px}
   #milked-animation-panel select option{color:#f5f5f5;background:#18232b}
   #milked-animation-panel button{border-radius:7px;padding:8px 12px;cursor:pointer;font-weight:600}
   #milked-animation-panel .mk-close{background:rgba(20,26,34,.55);border:1px solid #a3a5b4;color:#eee}
   #milked-animation-panel .mk-request{background:rgba(64,119,96,.8);border:1px solid #76d9ac;color:#fff}
   #milked-animation-panel button:disabled{opacity:.5;cursor:default}
   #milked-animation-panel .mk-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
   #milked-animation-panel .mk-result{min-height:18px;font-size:12px;color:#bff5d7}
   @media(max-width:600px){#milked-animation-panel{right:12px;bottom:20px}}
  `;
  document.head.append(style);
  const panel=document.createElement('section');panel.id='milked-animation-panel';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label','MilkED studio animation requests');
  const header=document.createElement('div');header.className='mk-head';
  const heading=document.createElement('h2');header.append(heading);
  const close=document.createElement('button');close.type='button';close.className='mk-close';close.textContent='CLOSE';header.append(close);
  const detail=document.createElement('p');detail.className='mk-small';
  const info=document.createElement('p');info.textContent='One performer · fixed cameras · soundproof observation window.';
  const label=document.createElement('label');label.textContent='REQUEST ANIMATION';label.htmlFor='milked-animation-choice';
  const select=document.createElement('select');select.id='milked-animation-choice';
  const result=document.createElement('p');result.className='mk-result';result.setAttribute('role','status');
  const actions=document.createElement('div');actions.className='mk-actions';
  const request=document.createElement('button');request.className='mk-request';request.type='button';request.textContent='REQUEST';
  actions.append(request);panel.append(header,detail,info,label,select,result,actions);document.body.append(panel);
  let openedStudio=0,lastSignature='',refreshTimer=null;
  const zone=()=>root.VoidBabylon?.zone;
  const pretty=clip=>clip.replace(/^ac-/,'ActorCore · ').replace(/-/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
  function closePanel(){panel.hidden=true;openedStudio=0;lastSignature='';if(refreshTimer!==null)clearInterval(refreshTimer);refreshTimer=null;}
  function refreshPanel(){
   if(!openedStudio)return;
   const model=zone()?.studioAnimations?.(openedStudio);
   if(!model){result.textContent='Studio view unavailable.';request.disabled=true;return;}
   const signature=[model.look,model.ready,model.clips.join('|')].join(':');
   heading.textContent='MILKED // STUDIO '+openedStudio;
   detail.textContent=model.ready?'ON AIR · '+model.performer+' · '+model.clips.length+' available animations':'ON AIR · Loading performer…';
   if(signature!==lastSignature){
    const previous=select.value;select.replaceChildren();
    for(const clip of model.clips){const option=document.createElement('option');option.value=clip;option.textContent=pretty(clip);select.append(option);}
    if(model.clips.includes(previous))select.value=previous;
    lastSignature=signature;result.textContent='';
   }
   request.disabled=!model.ready||!model.clips.length;
   if(model.ready&&!model.clips.length)result.textContent='No compatible animations loaded.';
  }
  function openPanel(studio){
   if(!Number.isInteger(studio)||studio<1||studio>4)return;
   closePanel();openedStudio=studio;panel.hidden=false;refreshPanel();
   refreshTimer=setInterval(()=>{if(!root.VoidBabylon?.zone?.studioAnimations){closePanel();return;}refreshPanel();},750);
   select.focus({preventScroll:true});
  }
  close.addEventListener('click',closePanel);
  request.addEventListener('click',()=>{
   const selected=select.value,model=zone()?.studioAnimations?.(openedStudio);
   if(!model?.clips.includes(selected)){refreshPanel();result.textContent='This animation is no longer available.';return;}
   const answer=zone()?.requestStudioAnimation?.(openedStudio,selected);
   result.textContent=answer?.ok?'REQUEST RECEIVED · '+pretty(selected):(answer?.reason||'Request unavailable.');
  });
  document.addEventListener('keydown',e=>{
   if(panel.hidden)return;
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closePanel();return;}
   // Prevent WASD/E and other movement shortcuts from reaching the walking controller while the dropdown is open.
   if(!/^(Key[WASDECRXQ]|ShiftLeft|ShiftRight|ControlLeft|ControlRight)$/.test(e.code))return;
   e.stopImmediatePropagation();if(e.target!==select)e.preventDefault();
  },true);
  root.VoidMilkedStudioRequest={open:openPanel,close:closePanel,get studio(){return openedStudio;},get visible(){return !panel.hidden;}};
  R('milked-studio',({item}={})=>{
   const n=Number(item?.studio);note('STUDIO '+(Number.isInteger(n)?n:'')+' is ON AIR: one performer, fixed cameras, nobody else in the room. The glass is soundproof.');
   openPanel(n);
  });
  R('milked-cameras',()=>note('REMOTE CAMERA CONTROLS: every studio camera is on a stand and is moved from this desk. All four studios are live.'));
  R('milked-dressing',()=>note('DRESSING ROOM B is occupied. The door is locked.'));
  R('milked-restroom',()=>note('STAFF RESTROOMS. Occupied.'));
 }
})(globalThis);
