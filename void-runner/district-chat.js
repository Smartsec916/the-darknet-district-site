/* District text chat, mute, block and report (browser only; phones never download this script: it is inert until the device gate releases it).
   Shown only while multiplayer is connected in the District interior with a registered account. All text is drawn with textContent (never markup). The hub
   decides who may speak and who hears it (tools/district-hub/chat.cjs); this file is only the screen. Handling path for reports: docs/development/MODERATION.md. */
(function(root){
 'use strict';
 const REASONS=[['harassment','HARASSMENT'],['spam','SPAM'],['inappropriate','INAPPROPRIATE'],['cheating','CHEATING'],['other','OTHER']];
 const CSS=`#district-chat{position:fixed;left:16px;bottom:92px;z-index:45;width:min(420px,calc(100vw - 32px));font:12px/1.45 ui-monospace,Consolas,monospace;color:#d9fbff;display:none}
#district-chat.on{display:block}
#district-chat .dc-log{max-height:150px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;pointer-events:none}
#district-chat.open .dc-log{pointer-events:auto;overflow-y:auto;max-height:230px;background:rgba(2,6,12,.82);padding:6px 8px;border:1px solid rgba(56,232,255,.25)}
#district-chat .dc-line{background:rgba(2,6,12,.62);padding:2px 7px;border-left:2px solid #38e8ff;word-break:break-word;transition:opacity .6s}
#district-chat .dc-line.old{opacity:0}#district-chat.open .dc-line.old{opacity:1}
#district-chat .dc-line.me{border-left-color:#ff3fb4}#district-chat .dc-line.sys{border-left-color:#8fb3bd;color:#8fb3bd}
#district-chat .dc-name{color:#58ffe1;font-weight:700;margin-right:6px}#district-chat .dc-line.me .dc-name{color:#ff7ac9}
#district-chat form{display:flex;gap:6px;margin-top:4px}
#district-chat input{flex:1;font:inherit;color:#fff;background:rgba(2,6,12,.94);border:1px solid #38e8ff;padding:6px 8px;min-width:0}
#district-chat button{font:inherit;font-size:11px;letter-spacing:.06em;color:#d9fbff;background:rgba(10,24,34,.92);border:1px solid rgba(56,232,255,.4);padding:5px 9px;cursor:pointer;min-height:28px}
#district-chat button:hover,#district-chat button:focus-visible{outline:2px solid #38e8ff;outline-offset:1px}
#district-chat .dc-bar{display:flex;gap:6px;margin-top:4px;pointer-events:auto}
#district-chat .dc-note{font-size:10px;color:#8fb3bd;margin-top:3px}
#district-chat .dc-people{margin-top:4px;background:rgba(2,6,12,.96);border:1px solid rgba(255,63,180,.45);padding:8px;max-height:240px;overflow:auto}
#district-chat .dc-person{display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:4px 0;border-bottom:1px solid rgba(56,232,255,.12)}
#district-chat .dc-person b{flex:1 1 100%;color:#58ffe1}
#district-chat .dc-report{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;width:100%}
#district-chat select,#district-chat .dc-report input{font:inherit;font-size:11px;background:#04070a;color:#d9fbff;border:1px solid rgba(56,232,255,.4);padding:3px}
@media(max-width:700px){#district-chat{bottom:120px}}`;
 let peopleSig='',el=null,logEl,formEl,inputEl,peopleEl,noteEl,open=false,peopleOpen=false,lines=[],unsub=null,rp=null,tick=0;
 const el_=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const inRoom=()=>typeof mode!=='undefined'&&mode==='walking'&&typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';

 function build(){
  const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  el=el_('section');el.id='district-chat';el.setAttribute('aria-label','District chat');
  logEl=el_('div','dc-log');logEl.setAttribute('role','log');logEl.setAttribute('aria-live','polite');
  formEl=el_('form');formEl.hidden=true;inputEl=el_('input');inputEl.type='text';inputEl.maxLength=200;inputEl.autocomplete='off';inputEl.setAttribute('aria-label','Chat message (200 characters, no links)');inputEl.placeholder='Say something to the District (Enter to send, Esc to close)';
  const send=el_('button','','SEND');send.type='submit';formEl.append(inputEl,send);
  const bar=el_('div','dc-bar'),b1=el_('button','','CHAT · ENTER'),b2=el_('button','','PLAYERS');b1.type=b2.type='button';b1.dataset.dc='chat';b2.dataset.dc='people';bar.append(b1,b2);
  peopleEl=el_('div','dc-people');peopleEl.hidden=true;noteEl=el_('div','dc-note');
  el.append(logEl,formEl,bar,peopleEl,noteEl);document.body.appendChild(el);
  bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.dc==='chat')setOpen(!open);else togglePeople();});
  formEl.addEventListener('submit',e=>{e.preventDefault();const t=inputEl.value.trim();if(!t)return;
   if(t[0]==='/'){inputEl.value='';command(t);return;}   // commands are never sent as chat
   if(rp.sendChat(t))inputEl.value='';else note('Not connected right now.');});
  inputEl.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();setOpen(false);}});
 }
 // Keyboard-only players (the mouse is captured while walking): /players, /mute NAME, /unmute NAME, /block NAME, /unblock NAME, /help. Reports use the PLAYERS panel.
 function command(t){
  const [c,...rest]=t.slice(1).split(/\s+/),name=rest.join(' ').toLowerCase();
  if(c==='players'||c==='who'){if(!peopleOpen)togglePeople();return;}
  if(['mute','unmute','block','unblock'].includes(c)){const p=rp.peers.find(q=>q.name.toLowerCase()===name);if(!p){addLine('sys','','No player named "'+rest.join(' ')+'" is here.');return;}rp.setIgnore(p.id,c==='mute'?'mute':c==='block'?'block':null);addLine('sys','',p.name+(c==='mute'?' is muted.':c==='block'?' is blocked.':' is no longer muted or blocked.'));if(peopleOpen)renderPeople();return;}
  addLine('sys','','Commands: /players, /mute NAME, /unmute NAME, /block NAME, /unblock NAME. Use PLAYERS to report someone.');
 }
 function note(t){if(noteEl)noteEl.textContent=t;}
 function addLine(kind,name,text){
  lines.push({kind,name,text,at:Date.now()});if(lines.length>50)lines.shift();draw();
 }
 function draw(){
  if(!logEl)return;logEl.textContent='';const now=Date.now();
  for(const l of lines.slice(-(open?50:6))){
   const d=el_('div','dc-line'+(l.kind==='me'?' me':l.kind==='sys'?' sys':'')+(!open&&now-l.at>14000?' old':''));
   if(l.name){d.append(el_('span','dc-name',l.name));}d.append(document.createTextNode(l.text));logEl.appendChild(d);
  }
  if(open)logEl.scrollTop=logEl.scrollHeight;
 }
 function setOpen(v){
  open=!!v&&!!el&&rp?.connected&&rp.features.chat;if(!el)return;el.classList.toggle('open',open);formEl.hidden=!open;
  if(open){document.exitPointerLock?.();try{walkingKeys.clear();}catch{}inputEl.focus();note(rp.features.chat?'':'Chat needs a registered account.');}
  else{inputEl.blur();document.activeElement?.blur?.();}
  draw();
 }
 function togglePeople(){peopleOpen=!peopleOpen;peopleEl.hidden=!peopleOpen;el.classList.toggle('people',peopleOpen);   // the cursor stays free while this panel is open (mouse-control.js)
  if(peopleOpen){document.exitPointerLock?.();renderPeople();}}
 function renderPeople(){
  peopleSig=rp.peers.map(p=>p.id+p.name).join('|')+JSON.stringify(rp.ignored);peopleEl.textContent='';
  const peers=rp.peers,ignRows=rp.ignored,ign=new Map(ignRows.map(([id,m])=>[id,m]));
  // everyone here, plus anyone muted or blocked who is not in view (a blocked player's character is hidden, so they must stay listed to be unblocked)
  const rows=peers.map(p=>({id:p.id,name:p.name,here:true}));for(const [id,m,name] of ignRows)if(!rows.some(r=>r.id===id))rows.push({id,name,here:false});
  if(!rows.length){peopleEl.appendChild(el_('div','dc-note','Nobody else is here right now.'));}
  for(const p of rows){
   const row=el_('div','dc-person'),mode_=ign.get(p.id);row.appendChild(el_('b','',p.name+(mode_?'  ['+mode_.toUpperCase()+']':'')+(p.here?'':'  (not in view)')));
   const mk=(label,fn)=>{const b=el_('button','',label);b.type='button';b.addEventListener('click',fn);row.appendChild(b);return b;};
   mk(mode_==='mute'?'UNMUTE':'MUTE',()=>{rp.setIgnore(p.id,mode_==='mute'?null:'mute',p.name);renderPeople();});
   mk(mode_==='block'?'UNBLOCK':'BLOCK',()=>{rp.setIgnore(p.id,mode_==='block'?null:'block',p.name);renderPeople();});
   if(p.here)mk('REPORT',()=>{if(row.querySelector('.dc-report'))return;const r=el_('div','dc-report'),sel=el_('select');sel.setAttribute('aria-label','Reason');for(const [v,l] of REASONS){const o=el_('option','',l);o.value=v;sel.appendChild(o);}
    const nt=el_('input');nt.type='text';nt.maxLength=120;nt.placeholder='What happened? (optional)';nt.setAttribute('aria-label','Report note');
    const go=el_('button','','SEND REPORT');go.type='button';go.addEventListener('click',()=>{if(rp.report(p.id,sel.value,nt.value))note('Report sent. A human reads these. Thank you.');else note('Could not send the report right now.');r.remove();});
    nt.addEventListener('keydown',e=>e.stopPropagation());r.append(sel,nt,go);row.appendChild(r);sel.focus();});
   peopleEl.appendChild(row);
  }
  peopleEl.appendChild(el_('div','dc-note','Mute hides a player\'s chat. Block also hides their character. Both are kept on this device.'));
 }
 function onChat(m){
  if(m.t==='chat'){addLine(m.id===rp.me?'me':'chat',m.name,m.text);}
  else if(m.t==='chat-refused')addLine('sys','',m.reason);
  else if(m.t==='reported')note('Report sent. A human reads these. Thank you.');
  else if(m.t==='report-refused')note(m.reason);
  else if(m.t==='chat-status'){if(!m.on)setOpen(false);}
 }
 function frame(){
  const show=!!rp&&rp.connected&&inRoom()&&!(root.VoidCharacterCreator?.isOpen);
  if(show&&!el)build();
  if(el){el.classList.toggle('on',show);if(!show){if(open)setOpen(false);if(peopleOpen)togglePeople();}
   if(show&&peopleOpen){const sig=rp.peers.map(p=>p.id+p.name).join('|')+JSON.stringify(rp.ignored);if(sig!==peopleSig){peopleSig=sig;renderPeople();}}   // only when the list really changed, so buttons stay put under the cursor
   if(show&&!open&&lines.length&&lines.some(l=>Date.now()-l.at>14000))draw();}
 }
 addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.repeat||open||!el||!el.classList.contains('on'))return;
  if(/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target?.tagName||''))return;
  if(!rp?.features.chat){note('Chat needs a registered account.');return;}
  e.preventDefault();setOpen(true);
 },true);
 addEventListener('keydown',e=>{if(open&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();setOpen(false);}},true);
 function boot(){
  rp=root.VoidRemotePlayers;if(!rp){setTimeout(boot,1500);return;}
  unsub=rp.onChat(onChat);tick=setInterval(frame,400);
 }
 if(typeof document!=='undefined')boot();
 root.VoidDistrictChat={get open(){return open;},get lines(){return lines.map(l=>({...l}));},_add:addLine};
})(globalThis);
