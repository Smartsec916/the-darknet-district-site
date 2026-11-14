/* District chat STORE (browser only; phones never download this script: it is inert until the device gate releases it).
   Since V1 Phase 2 this file has no screen of its own: the V1 device's Messages app (personal-device.js) is the chat interface. This keeps what arrives from the multiplayer
   service (void-runner/remote-players.js) for the current session, counts what the player has not read yet, and runs the slash commands. It listens whether or not the V1 is
   open, so messages that arrive while the V1 is closed are kept and counted. Nothing is stored beyond this page session (no history on disk or on a server); the hub decides who may
   speak and who hears it (tools/district-hub/chat.cjs). Handling path for reports: docs/development/MODERATION.md (they reach the hub's server log only). */
(function(root){
 'use strict';
 const KEEP=100;                       // lines kept for this session
 let lines=[],seq=0,unread=0,viewing=false,note='',rp=null,unsub=null,booted=false,tick=0;
 const subs=new Set();
 const emit=()=>{for(const fn of subs)try{fn();}catch{}};
 const inRoom=()=>typeof mode!=='undefined'&&mode==='walking'&&typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';

 function add(kind,name,text,id,at){
  at=Number.isFinite(at)?at:Date.now();
  // the hub never replays or repeats a line, but a repeated delivery (a re-subscribed listener, a reconnect) must never show twice
  if(kind==='chat'||kind==='me'){const key=id+'|'+at+'|'+text;for(let i=lines.length-1;i>=0&&i>=lines.length-30;i--)if(lines[i].key===key)return false;lines.push({seq:++seq,kind,name,text,at,key});}
  else lines.push({seq:++seq,kind,name,text,at});
  if(lines.length>KEEP)lines.shift();
  if(kind==='chat'&&!viewing)unread++;   // only other people's messages, and only while the player is not looking at the chat
  emit();return true;
 }
 function onChat(m){
  if(m.t==='chat'){const mine=!!rp&&m.id===rp.me;add(mine?'me':'chat',String(m.name||''),String(m.text||''),String(m.id||''),Number(m.at));}
  else if(m.t==='chat-refused')add('sys','',String(m.reason||'Message refused.'));
  else if(m.t==='reported'){note='Report sent to the District server log for review. Reports are not stored as a permanent case file.';emit();}
  else if(m.t==='report-refused'){note=String(m.reason||'Report refused.');emit();}
  else if(m.t==='chat-status'){add('sys','',m.on?'Connected to the District.':'Disconnected from the District. Reconnecting when possible.');}
 }
 /* Sends what the player typed. A leading "/" is a command and is never sent as chat. Returns {ok, text?, players?}. */
 function submit(t){
  t=String(t||'').trim();if(!t)return {ok:false};
  if(!rp)return {ok:false,text:'Not connected right now.'};
  if(t[0]!=='/')return rp.sendChat(t)?{ok:true}:{ok:false,text:'Not connected right now.'};
  const [c,...rest]=t.slice(1).split(/\s+/),name=rest.join(' ').toLowerCase();
  if(c==='players'||c==='who')return {ok:true,players:true};
  if(['mute','unmute','block','unblock'].includes(c)){const p=rp.peers.find(q=>q.name.toLowerCase()===name);if(!p){add('sys','','No player named "'+rest.join(' ')+'" is here.');return {ok:true};}
   rp.setIgnore(p.id,c==='mute'?'mute':c==='block'?'block':null);add('sys','',p.name+(c==='mute'?' is muted.':c==='block'?' is blocked.':' is no longer muted or blocked.'));return {ok:true};}
  add('sys','','Commands: /players, /mute NAME, /unmute NAME, /block NAME, /unblock NAME. Use PLAYERS to report someone.');return {ok:true};
 }
 const markRead=()=>{if(unread){unread=0;emit();}};
 // The V1 says whether the chat is on screen right now. While it is, new lines are read at once; opening it clears what was waiting.
 function setViewing(v){v=!!v;if(v===viewing)return;viewing=v;if(v)markRead();}

 function boot(){
  rp=root.VoidRemotePlayers;if(!rp){setTimeout(boot,1500);return;}
  if(unsub)unsub();unsub=rp.onChat(onChat);   // exactly one listener, however many times boot runs
 }
 // Enter used to open the left-side chat box; it now opens the V1 on the District chat with the message box ready (only where the box used to work).
 addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  if(!rp?.connected||!inRoom()||root.VoidCharacterCreator?.isOpen||root.VoidPersonalDevice?.isOpen)return;
  if(/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target?.tagName||''))return;
  if(!rp.features.chat){note='Chat needs a registered account.';emit();}
  e.preventDefault();root.VoidPersonalDevice?.openApp?.('messages','chat',{focus:true});
 },true);
 if(typeof document!=='undefined'&&!booted){booted=true;boot();}
 root.VoidDistrictChat={
  get lines(){return lines.map(l=>({...l}));},get unread(){return unread;},get note(){return note;},clearNote(){note='';},
  get listeners(){return subs.size;},get hubListener(){return !!unsub;},
  markRead,setViewing,submit,onChange(fn){subs.add(fn);return ()=>subs.delete(fn);},boot,
  ...(/^(localhost|127\.0\.0\.1)$/.test(root.location?.hostname||'')?{_inject:onChat}:{}),   // test hook (local pages only): feeds a hub-shaped message through the same path the live listener uses
 };
})(globalThis);
