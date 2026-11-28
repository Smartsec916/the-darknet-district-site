/* IRIS'S AMBIENT LINES IN THE GAME (browser only; the rules and the numbers are iris-ambient.js). Twice a second this reads what is going on and asks the rules
   whether Iris says something now; a line shows as "Iris (Comms): ..." in the notice line and plays her recorded clip (voice-clips.js, speaker 'iris' + exact text)
   through the game's voice channel (VoidAudio.speak: with voice off nothing plays and only the words show, as with her other Comms lines).
   Automatic lines play during access-point hacks and the BR-04 wait between Missions 009 and 010.
   Switches: Settings > IRIS CHATTER (this browser: localStorage 'void-runner-iris-chatter'), Developer Tools > Test & Jump To > Iris ambient lines (this session).
   Nothing is saved with the campaign. */
(function(root){
 'use strict';
 if(typeof document==='undefined')return;
 const R=root.VoidIrisAmbientRules;if(!R)return;
 const KEY='void-runner-iris-chatter';
 const st_=()=>{try{return typeof state!=='undefined'?state:null;}catch{return null;}};
 const md=()=>{try{return typeof mode!=='undefined'?mode:null;}catch{return null;}};
 let playerOn=(()=>{try{return root.localStorage.getItem(KEY)!=='off';}catch{return true;}})(),devOn=true;
 let clock=0,lastT=performance.now(),hackRun=0,hackObj=null;
 const st=R.create(0);
 const missions=()=>(st_()?.universe?.missions)||{};
 function contact(){const s=st_();return !!(s&&s.story&&s.story.flags&&(s.story.flags.metIris===true||missions()['m001-awakening']?.completed===true));}
 function voiceOn(){const a=root.VoidAudio?.settings;return !!a&&a.enabled!==false&&a.voiceEnabled!==false&&Number(a.voice)>0;}
 function busy(){
  if(document.hidden||md()!=='walking')return true;
  try{if(typeof speech!=='undefined'&&speech)return true;}catch{}
  try{if(typeof noticeTime!=='undefined'&&noticeTime>0)return true;}catch{}
  const V=root.VoidV1,c=V?.call;if(c&&!c.ended)return true;if(V?.banner)return true;
  if(root.VoidPersonalDevice?.isOpen||root.VoidCameraFeed?.active||root.VoidCharacterCreator?.isOpen||root.VoidDevTest?.active)return true;
  const n=root.VoidVoiceClips?.now;if(n&&!n.ended)return true;if(root.speechSynthesis?.speaking)return true;
  if(root.VoidRemotePlayers?.vrSession)return true;   // a shared VR session: not there
  return false;}
 function enemies(){try{return (root.VoidZoneRun?.enemies||[]).filter(e=>!e.dead);}catch{return [];}}
 function ctx(){
  const s=st_(),ms=missions(),ex=enemies();
  const h=root.VoidApartments?.hacking;if(h!==hackObj){hackObj=h;if(h)hackRun++;}
  const trees=(()=>{try{return !!root.VoidLiveContent?.treesOn?.();}catch{return false;}})();
  return {enabled:playerOn&&devOn,contact:contact(),busy:busy(),combat:ex.some(e=>e.alert),hostile:(()=>{try{return root.VoidZoneRun?.current?.()?.zone==='hostile';}catch{return false;}})(),
   voice:voiceOn(),hack:h&&h.job?{key:'hack#'+hackRun,hold:Number(h.job.hold)||0,t:Number(h.t)||0}:null,
   gap:trees&&!!s&&ms[R.MISSION_009]?.completed===true&&!ms[R.MISSION_010]?.acquired};}
 function say(line){const text=line.text;try{announce('Iris (Comms): '+text);try{noticeTime=Math.max(noticeTime,Math.min(9,2.5+text.length/16));}catch{}}catch{}
  if(line.speak!==false)try{if(root.VoidVoiceClips?.has?.(R.SPEAKER,text))root.VoidAudio?.speak?.(R.SPEAKER,text);}catch{}
  last={...line,at:clock};}
 let last=null;
 function tick(){const t=performance.now(),dt=Math.min(1,(t-lastT)/1000);lastT=t;if(!document.hidden&&md()!=='pause')clock+=dt;
  try{const c=ctx(),l=R.decide(st,c,clock);if(l)say(l);}catch(e){console.warn('[iris ambient]',e);}}
 setInterval(tick,500);
 // ---- Settings: IRIS CHATTER on / off (this browser) ----
 function setPlayer(v){playerOn=!!v;try{root.localStorage.setItem(KEY,playerOn?'on':'off');}catch{}}
 if(typeof settingsPage==='function'){const prev=settingsPage;settingsPage=function(){const r=prev.apply(this,arguments);try{const p=screen.querySelector('.settings-panel');
   if(p&&!p.querySelector('[data-action="iris-chatter"]'))p.insertAdjacentHTML('beforeend','<h2>Iris</h2><button data-action="iris-chatter" class="quiet" aria-pressed="'+playerOn+'">IRIS CHATTER: '+(playerOn?'ON':'OFF')+'</button><p class="fine">Iris can speak over Comms during long access-point hacks and while you wait for BR-04.</p>');}catch{}return r;};}
 document.addEventListener('click',e=>{const b=e.target&&e.target.closest?e.target.closest('[data-action="iris-chatter"]'):null;if(!b)return;setPlayer(!playerOn);b.textContent='IRIS CHATTER: '+(playerOn?'ON':'OFF');b.setAttribute('aria-pressed',String(playerOn));});
 // ---- Developer Tools > Test & Jump To: the switch, the numbers, the lines, a preview of each kind ----
 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function devHtml(){const T=R.TUNING,ago=id=>{const a=st.last[id];return a==null?'—':Math.round(clock-a)+' s ago';};
  return '<h3 class="dev-group">Iris ambient lines</h3><label class="dev-field"><input type="checkbox" data-iris-dev '+(devOn?'checked':'')+'> Iris ambient lines (this session'+(playerOn?'':'; the player setting IRIS CHATTER is OFF')+')</label>'
   +'<p class="dev-note">Numbers (seconds, iris-ambient.js TUNING): '+Object.entries(T).map(([k,v])=>esc(k)+' '+esc(v)).join(' · ')+'. Store line this session: '+(st.storeDone?'played':'not yet')+'.</p>'
   +'<table class="dev-table"><tr><th>Kind</th><th>Line</th><th>Last</th></tr>'+R.LINES.map(l=>'<tr><td>'+esc(l.cat)+'</td><td>'+esc(l.text)+'</td><td>'+ago(l.id)+'</td></tr>').join('')+'</table>'
   +'<p>'+['hack','sneak','spotted','wait','joke','store'].map(c=>'<button type="button" data-iris-try="'+c+'">PREVIEW '+c.toUpperCase()+'</button>').join(' ')+'</p>';}
 if(root.VoidDevTest&&typeof root.VoidDevTest.render==='function'){const r0=root.VoidDevTest.render;root.VoidDevTest.render=function(){return r0.apply(this,arguments)+devHtml();};}
 document.addEventListener('change',e=>{if(e.target&&e.target.matches&&e.target.matches('[data-iris-dev]'))devOn=!!e.target.checked;});
 document.addEventListener('click',e=>{const b=e.target&&e.target.closest?e.target.closest('[data-iris-try]'):null;if(!b)return;const l=R.force(st,b.dataset.irisTry,{voice:voiceOn()},clock);if(!l)return;
  try{if(root.VoidVoiceClips?.has?.(R.SPEAKER,l.text))root.VoidAudio?.speak?.(R.SPEAKER,l.text);}catch{}b.title=l.text;last={...l,at:clock};});
 root.VoidIrisAmbient={ctx,get state(){return st;},get last(){return last;},get log(){return st.log.slice();},get clock(){return clock;},set clock(v){clock=Number(v)||0;},
  get enabled(){return playerOn&&devOn;},get player(){return playerOn;},set player(v){setPlayer(v);},get dev(){return devOn;},set dev(v){devOn=!!v;}};
})(globalThis);
