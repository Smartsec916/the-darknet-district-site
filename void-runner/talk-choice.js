/* A CONVERSATION THAT ENDS WITH A CHOICE (browser only; small and reusable). Built for Mission 002's in-person offer (David, 17 Nov 2026: Admin offers it, the player
   can ACCEPT or decline and come back later), usable by anything that needs one.
   talkChoice(lines, choices, heading): shows the lines in the ordinary conversation window (scenes.js talk(), so voice clips, the floating walking window and the
   conversation history all behave as usual). On the last line the main button is the first choice and the other choices sit beside it.
   choices: [{label, run}] - run() is called once, after the window has closed for it. Leaving the window any other way (Esc keeps it minimised; reloading) chooses nothing. */
(function(root){
 'use strict';
 if(typeof talk!=='function'||typeof renderLine!=='function'||typeof screen==='undefined')return;
 const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function decorate(){
  try{if(typeof speech==='undefined'||!speech||!Array.isArray(speech.choices))return;const box=screen.querySelector('.speech-controls');if(!box)return;
   const last=speech.index===speech.lines.length-1;box.querySelectorAll('[data-talk-choice]').forEach(b=>{if(!last)b.remove();});
   if(!last||box.querySelector('[data-talk-choice]'))return;
   speech.choices.slice(1).forEach((c,i)=>box.insertAdjacentHTML('beforeend','<button type="button" class="quiet" data-talk-choice="'+(i+1)+'" data-action="talk-choice">'+esc(c.label)+'</button>'));}catch{}}
 const shown=renderLine;renderLine=function(){const r=shown.apply(this,arguments);decorate();return r;};
 function talkChoice(lines,choices,heading){
  if(!Array.isArray(lines)||!lines.length||!Array.isArray(choices)||!choices.length)return false;
  let done=false;const once=c=>()=>{if(done)return;done=true;try{c.run();}catch(e){try{console.warn('[VOID//RUNNER] choice failed',e);}catch{}}};
  const list=choices.map(c=>({label:String(c.label||'CONTINUE'),run:once(c)}));
  talk('',lines,list[0].run,list[0].label,heading||'');
  if(typeof speech!=='undefined'&&speech){speech.choices=list;decorate();}
  return true;
 }
 // The other choices: the window closes (as advanceSpeech would), then the choice runs.
 screen.addEventListener('click',e=>{const b=e.target.closest?.('[data-talk-choice]');if(!b||typeof speech==='undefined'||!speech||!Array.isArray(speech.choices))return;
  const c=speech.choices[Number(b.dataset.talkChoice)];if(!c)return;e.stopPropagation();speech=null;try{root.VoidAudio?.cancel();}catch{}c.run();},true);
 root.talkChoice=talkChoice;
})(globalThis);
