/* A CONVERSATION THAT ENDS WITH A CHOICE (browser only; small and reusable). Built for Mission 002's in-person offer (the owner, 17 Nov 2026: Admin offers it, the player
   can ACCEPT or decline and come back later), usable by anything that needs one.
   talkChoice(lines, choices, heading): shows the lines in the ordinary conversation window (scenes.js talk(), so voice clips, the floating walking window and the
   conversation history all behave as usual). On the last line the main button is the first choice and the other choices sit beside it.
   choices: [{label, run}] - run() is called once, after the window has closed for it. Leaving the window any other way (Esc keeps it minimised; reloading) chooses nothing.
   opts.menu (Zen Zephyr, 18 Nov 2026): a list instead - on the last line EVERY choice is a button in a column under the line, the main button is hidden, and nothing is
   chosen by default (CONTINUE, if it is ever reached, runs opts.cancel). A line marked silent:true is shown without being spoken (a question already heard this visit). */
(function(root){
 'use strict';
 if(typeof talk!=='function'||typeof renderLine!=='function'||typeof screen==='undefined')return;
 const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function decorate(){
  try{if(typeof speech==='undefined'||!speech||!Array.isArray(speech.choices))return;const box=screen.querySelector('.speech-controls');if(!box)return;
   const last=speech.index===speech.lines.length-1;box.querySelectorAll('[data-talk-choice]').forEach(b=>{if(!last)b.remove();});
   if(!last||box.querySelector('[data-talk-choice]'))return;
   if(speech.menu){box.classList.add('talk-menu');const th=screen.querySelector('.conversation-thread');if(th)requestAnimationFrame(()=>{th.scrollTop=th.scrollHeight;});   // the latest line (his quote) in view above the list
const next=box.querySelector('#speech-next');if(next)next.style.display='none';
    speech.choices.forEach((c,i)=>box.insertAdjacentHTML('beforeend','<button type="button" class="talk-menu-choice'+(c.leave?' quiet':'')+'" data-talk-choice="'+i+'" data-action="talk-choice">'+esc(c.label)+'</button>'));return;}
   speech.choices.slice(1).forEach((c,i)=>box.insertAdjacentHTML('beforeend','<button type="button" class="quiet" data-talk-choice="'+(i+1)+'" data-action="talk-choice">'+esc(c.label)+'</button>'));}catch{}}
 // A silent line is shown but not spoken (and so waits only for its reading time).
 if(typeof speakLine==='function'){const spoken=speakLine;speakLine=function(){const l=typeof speech!=='undefined'&&speech?speech.lines[speech.index]:null;if(l&&l.silent){try{root.VoidAudio?.cancel();}catch{}speech.voice={index:speech.index,at:performance.now(),started:false,ended:false,clip:false};return;}return spoken.apply(this,arguments);};}
 const shown=renderLine;renderLine=function(){const r=shown.apply(this,arguments);decorate();return r;};
 function talkChoice(lines,choices,heading,opts={}){
  if(!Array.isArray(lines)||!lines.length||!Array.isArray(choices)||!choices.length)return false;
  let done=false;const once=c=>()=>{if(done)return;done=true;try{c.run();}catch(e){try{console.warn('[VOID//RUNNER] choice failed',e);}catch{}}};
  const list=choices.map(c=>({label:String(c.label||'CONTINUE'),leave:!!c.leave,run:once(c)})),menu=!!opts.menu;
  talk('',lines,menu?once({run:opts.cancel||(()=>{try{resumeWalking();}catch{}})}):list[0].run,menu?'CONTINUE':list[0].label,heading||'');
  if(typeof speech!=='undefined'&&speech){speech.choices=list;speech.menu=menu;decorate();}
  return true;
 }
 // The other choices: the window closes (as advanceSpeech would), then the choice runs.
 screen.addEventListener('click',e=>{const b=e.target.closest?.('[data-talk-choice]');if(!b||typeof speech==='undefined'||!speech||!Array.isArray(speech.choices))return;
  const c=speech.choices[Number(b.dataset.talkChoice)];if(!c)return;e.stopPropagation();speech=null;try{root.VoidAudio?.cancel();}catch{}c.run();},true);
 root.talkChoice=talkChoice;
})(globalThis);
