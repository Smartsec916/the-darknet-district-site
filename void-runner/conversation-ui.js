/* One floating transcript for walking NPC and VR companion dialogue. Movement stays in walking mode. */
(function(){
 const history=globalThis.VoidConversationHistory;
 const restore=document.createElement('button');restore.id='conversation-restore';restore.type='button';restore.hidden=true;restore.textContent='CONVERSATION · RESTORE';document.body.append(restore);
 let minimized=false,lastLine=null,activeMode=null;
 const uid=()=>window.VoidAccount?.user?.uid||'guest';
 function hasContent(){return !!speech||!!screen.querySelector('.choice-menu');}
 function floating(){return !!activeMode&&!!walkingLocation&&!!walker&&hasContent();}
 function show(){if(!floating())return;mode=activeMode;screen.classList.add('conversation-live');screen.classList.toggle('hidden',minimized);restore.hidden=!minimized;if(!minimized&&document.pointerLockElement)document.exitPointerLock?.();canvas.focus({preventScroll:true});}
 const priorTalk=talk;
 talk=function(...args){activeMode=['walking','vr-seated'].includes(mode)?mode:null;minimized=false;lastLine=null;priorTalk(...args);if(floating())document.exitPointerLock?.();show();};
 const priorRender=renderLine;
 renderLine=function(...args){priorRender(...args);if(!floating())return;
  const line=speech.lines[speech.index],signature=speech.index+':'+line.who+':'+line.text;
  if(lastLine!==signature){history.append(localStorage,uid(),{character:line.who||'companion',name:characters[line.who]?.name||line.who||'Companion',text:line.text,place:state.location,at:Date.now()});lastLine=signature;}
  const win=screen.querySelector('.dialogue-window');if(win&&!win.querySelector('.conversation-minimize')){
   const thread=document.createElement('div');thread.className='conversation-thread';thread.setAttribute('aria-label','Conversation history');
   for(const row of history.filter(history.read(localStorage,uid()),'all',line.who||'companion').slice(-9,-1)){const bubble=document.createElement('article');bubble.className='social-message';const name=document.createElement('b');name.textContent=row.name;const time=document.createElement('time');time.dateTime=new Date(row.at).toISOString();time.textContent=' · '+new Date(row.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});const body=document.createElement('p');body.textContent=row.text;bubble.append(name,time,body);thread.append(bubble);}
   win.insertBefore(thread,win.querySelector('.speech-body'));
   const b=document.createElement('button');b.type='button';b.className='conversation-minimize quiet';b.textContent='MINIMIZE';b.addEventListener('click',e=>{e.stopPropagation();minimized=true;screen.classList.add('hidden');restore.hidden=false;canvas.focus({preventScroll:true});});win.prepend(b);
  }
  show();
 };
 restore.addEventListener('click',()=>{if(!hasContent()){restore.hidden=true;return;}minimized=false;show();});
 const priorResume=resumeWalking;
 resumeWalking=function(...args){activeMode=null;minimized=false;restore.hidden=true;screen.classList.remove('conversation-live');return priorResume(...args);};
 const priorAdvance=advanceSpeech;
 advanceSpeech=function(...args){const result=priorAdvance(...args);if(!hasContent()&&screen.classList.contains('conversation-live')){activeMode=null;screen.classList.remove('conversation-live');screen.classList.add('hidden');restore.hidden=true;}return result;};
 if(typeof renderStoryChoices==='function'){const priorChoices=renderStoryChoices;renderStoryChoices=function(...args){priorChoices(...args);if(activeMode&&walkingLocation&&walker){screen.querySelector('.dialogue-window')?.classList.add('choice-menu');mode=activeMode;screen.classList.add('conversation-live');screen.classList.remove('hidden');}};}
 document.addEventListener('keydown',e=>{if(e.code==='Escape'&&speech&&screen.classList.contains('conversation-live')){minimized=true;screen.classList.add('hidden');restore.hidden=false;}},true);
 globalThis.VoidConversationUI={get isOpen(){return hasContent()&&screen.classList.contains('conversation-live');},continueWalking(){if(!this.isOpen)return false;activeMode='walking';mode='walking';walkingKeys.clear();canvas.focus({preventScroll:true});return true;}};
})();
