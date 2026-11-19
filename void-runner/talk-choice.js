/* A CONVERSATION THAT ENDS WITH A CHOICE (browser only; small and reusable). Built for Mission 002's in-person offer (the owner, 17 Nov 2026: Admin offers it, the player
   can ACCEPT or decline and come back later), usable by anything that needs one.
   talkChoice(lines, choices, heading): shows the lines in the ordinary conversation window (scenes.js talk(), so voice clips, the floating walking window and the
   conversation history all behave as usual). On the last line the main button is the first choice and the other choices sit beside it.
   choices: [{label, run, disabled}] - run() is called once, after the window has closed for it. A disabled choice is shown greyed (ACCEPT while the player cannot pay).
   opts.offer (19 Nov 2026): a mission offer card on the last line: {title, description, cost, costWhen, reward, need, yes} (mission-content.js offerOf). Leaving the window any other way (Esc keeps it minimised; reloading) chooses nothing.
   opts.menu (Zen Zephyr, 18 Nov 2026): a list instead - on the last line EVERY choice is a button in a column under the line, the main button is hidden, and nothing is
   chosen by default (CONTINUE, if it is ever reached, runs opts.cancel). A line marked silent:true is shown without being spoken (a question already heard this visit). */
(function(root){
 'use strict';
 if(typeof talk!=='function'||typeof renderLine!=='function'||typeof screen==='undefined')return;
 const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function decorate(){
  try{if(typeof speech==='undefined'||!speech||!Array.isArray(speech.choices))return;const box=screen.querySelector('.speech-controls');if(!box)return;
   const last=speech.index===speech.lines.length-1;box.querySelectorAll('[data-talk-choice]').forEach(b=>{if(!last)b.remove();});
   const o=speech.offer;if(o&&last&&!screen.querySelector('[data-talk-offer]')){const money=o.cost?'COST '+o.cost+' CR · '+(o.costWhen&&o.costWhen!=='accept'?'paid at a later step':'paid when you press '+(o.yes||'ACCEPT')):o.reward?'REWARD '+o.reward+' CR':'';
    box.insertAdjacentHTML('beforebegin','<div class="talk-offer" data-talk-offer="'+esc(o.mission)+'"><b>'+esc(o.title)+'</b>'+(o.description?'<span>'+esc(o.description)+'</span>':'')+(money?'<span class="talk-offer-money'+(o.cost?' cost':'')+'" data-talk-offer-money>'+esc(money)+'</span>':'')+(o.need?'<span class="talk-offer-need" data-talk-offer-need>You need '+esc(o.need)+' CR</span>':'')+'</div>');}
   if(!last||box.querySelector('[data-talk-choice]'))return;
   if(speech.menu){box.classList.add('talk-menu');const th=screen.querySelector('.conversation-thread');if(th)requestAnimationFrame(()=>{th.scrollTop=th.scrollHeight;});   // the latest line (his quote) in view above the list
const next=box.querySelector('#speech-next');if(next)next.style.display='none';
    speech.choices.forEach((c,i)=>box.insertAdjacentHTML('beforeend','<button type="button" class="talk-menu-choice'+(c.leave?' quiet':'')+'" data-talk-choice="'+i+'" data-action="talk-choice">'+esc(c.label)+'</button>'));return;}
   speech.choices.slice(1).forEach((c,i)=>box.insertAdjacentHTML('beforeend','<button type="button" class="quiet" data-talk-choice="'+(i+1)+'" data-action="talk-choice"'+(c.disabled?' disabled aria-disabled="true" title="'+esc(c.label)+'"':'')+'>'+esc(c.label)+'</button>'));}catch{}}
 // A silent line is shown but not spoken (and so waits only for its reading time).
 if(typeof speakLine==='function'){const spoken=speakLine;speakLine=function(){const l=typeof speech!=='undefined'&&speech?speech.lines[speech.index]:null;if(l&&l.silent){try{root.VoidAudio?.cancel();}catch{}speech.voice={index:speech.index,at:performance.now(),started:false,ended:false,clip:false};return;}return spoken.apply(this,arguments);};}
 const shown=renderLine;renderLine=function(){const r=shown.apply(this,arguments);decorate();return r;};
 function talkChoice(lines,choices,heading,opts={}){
  if(!Array.isArray(lines)||!lines.length||!Array.isArray(choices)||!choices.length)return false;
  let done=false;const once=c=>()=>{if(done)return;done=true;try{c.run();}catch(e){try{console.warn('[VOID//RUNNER] choice failed',e);}catch{}}};
  const list=choices.map(c=>({label:String(c.label||'CONTINUE'),leave:!!c.leave,disabled:!!c.disabled,run:c.disabled?()=>{}:once(c)})),menu=!!opts.menu;
  talk('',lines,menu?once({run:opts.cancel||(()=>{try{resumeWalking();}catch{}})}):list[0].run,menu?'CONTINUE':list[0].label,heading||'');
  if(typeof speech!=='undefined'&&speech){speech.choices=list;speech.menu=menu;speech.offer=opts.offer||null;decorate();}
  return true;
 }
 // The other choices: the window closes (as advanceSpeech would), then the choice runs.
 screen.addEventListener('click',e=>{const b=e.target.closest?.('[data-talk-choice]');if(!b||typeof speech==='undefined'||!speech||!Array.isArray(speech.choices))return;
  const c=speech.choices[Number(b.dataset.talkChoice)];if(!c||c.disabled||b.disabled)return;e.stopPropagation();speech=null;try{root.VoidAudio?.cancel();}catch{}c.run();},true);
 root.talkChoice=talkChoice;
})(globalThis);
