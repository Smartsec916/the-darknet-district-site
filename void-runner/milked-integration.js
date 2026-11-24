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

  // Extend the original studio-window E interaction. No new 3D trigger is registered.
  // The panel is deliberately see-through so visitors can watch the dancer.
  const currentZone=()=>root.VoidBabylon?.zone?.area===MK.AREA?root.VoidBabylon.zone:null;
  let open=null;
  function closeStudio(){
   if(!open)return;clearInterval(open.timer);document.removeEventListener('keydown',open.key,true);
   open.panel.remove();open=null;
  }
  function viewStudio(number){
   closeStudio();done();
   const studio=Number(number);
   if(!MK.STUDIOS.some(s=>s.n===studio))return;
   const panel=document.createElement('section');
   panel.id='milked-studio-request-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Studio '+studio+' observation and animation requests');
   panel.style.cssText='position:fixed;z-index:2147483000;right:clamp(10px,3vw,36px);top:18%;width:min(350px,calc(100vw - 20px));max-height:72vh;overflow:auto;box-sizing:border-box;padding:17px 18px;color:#edf6ff;background:rgba(7,11,19,.65);border:1px solid rgba(255,63,180,.7);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.32);font:14px/1.5 system-ui,sans-serif;backdrop-filter:blur(3px);pointer-events:auto';
   const title=document.createElement('div');title.style.cssText='font-size:16px;font-weight:750;letter-spacing:.09em;color:#ff9bd8';title.textContent='MILKED // STUDIO '+studio;
   const intro=document.createElement('p');intro.style.cssText='margin:8px 0 12px';intro.textContent=!MK.STUDIOS[studio-1]?.dancer?'OFF AIR · No performer scheduled':'ON AIR · Fixed cameras · Soundproof observation window';
   const who=document.createElement('div');who.style.cssText='font-size:12px;color:#aafdd5;margin-bottom:9px';who.textContent='Connecting to performer…';
   const label=document.createElement('label');label.textContent='REQUEST ANIMATION';label.style.cssText='display:block;font-size:12px;letter-spacing:.08em;margin-bottom:5px';label.htmlFor='milked-animation-choice';
   const select=document.createElement('select');select.id='milked-animation-choice';select.style.cssText='width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid rgba(57,255,156,.6);border-radius:6px;color:#fff;background:rgba(12,20,28,.84);font:inherit';
   const buttons=document.createElement('div');buttons.style.cssText='display:flex;gap:8px;margin-top:12px';
   const button=(name,color)=>{const el=document.createElement('button');el.type='button';el.textContent=name;el.style.cssText='flex:1;padding:9px 10px;border:1px solid '+color+';border-radius:6px;background:rgba(12,19,27,.78);color:#fff;cursor:pointer;font:inherit';return el;};
   const request=button('REQUEST','#39ff9c'),close=button('CLOSE','#ff3fb4');buttons.append(request,close);
   const status=document.createElement('div');status.setAttribute('role','status');status.style.cssText='min-height:20px;margin-top:10px;font-size:12px;color:#aafdd5';
   panel.append(title,intro,who,label,select,buttons,status);document.body.append(panel);
   const names={'studio-warrior':'Female Warrior','vr-companion-bm':'Dex','npc-milked-auburn':'Auburn'};
   const vacant=!MK.STUDIOS[studio-1]?.dancer;
   if(vacant){who.remove();label.remove();select.remove();request.remove();}
   let signature='';
   function refresh(){
    if(vacant)return;
    const available=currentZone()?.animationChoices?.(studio),look=available?.look||MK.STUDIOS[studio-1]?.dancer?.look,clips=available?.clips||[];
    const sig=String(look)+'|'+clips.map(c=>c.id).join(',');
    if(sig!==signature){
     const previous=select.value;signature=sig;select.replaceChildren();
     if(clips.length)for(const c of clips){const option=document.createElement('option');option.value=c.id;option.textContent=c.label;select.append(option);}
     else{const option=document.createElement('option');option.value='';option.textContent='Waiting for available animations';select.append(option);}
     if(clips.some(c=>c.id===previous))select.value=previous;
     status.textContent='';
    }
    who.textContent='PERFORMER · '+(names[look]||look||'Loading');
    request.disabled=!clips.length;select.disabled=!clips.length;request.style.opacity=clips.length?'1':'.5';
   }
   request.addEventListener('click',()=>{
    const response=currentZone()?.requestAnimation?.(studio,select.value);
    status.textContent=response?.message||'Performer unavailable. Try again when the model loads.';
    status.style.color=response?.ok?'#aafdd5':'#ffb4c9';refresh();
   });
   close.addEventListener('click',closeStudio);
   const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeStudio();}else if(panel.contains(document.activeElement)&&['ArrowDown','ArrowUp','Enter',' '].includes(e.key))e.stopPropagation();};
   document.addEventListener('keydown',key,true);
   open={panel,key,timer:setInterval(()=>{if(currentZone())refresh();else closeStudio();},1000)};
   refresh();(vacant?close:select).focus();
  }
  R('milked-studio',({item}={})=>viewStudio(item?.studio));
  R('milked-cameras',()=>note('REMOTE CAMERA CONTROLS: every studio camera is on a stand and is moved from this desk. All four studios are live.'));
  R('milked-dressing',()=>note('DRESSING ROOM B is occupied. The door is locked.'));
  R('milked-restroom',()=>note('STAFF RESTROOMS. Occupied.'));
 }
})(globalThis);
