/* District hub: the pure rules. No network, no clock, no storage: every function gets what it needs, so the same module can sit
   behind this local test server today and a production hub later. Identity NEVER comes from a message: the transport verifies a
   login token and passes the verified account in. A client may only say where it is. */
'use strict';
const crypto=require('node:crypto');
const {TradeBook,parseTrade,RULES:TRADE_RULES}=require('./trade.cjs');
const Chat=require('./chat.cjs');

// Whitelisted rooms. The bounds are a coarse sanity box around the district interior (this is NOT the floor plan; the real
// footprint is owned by void-runner/neochinatown.js). The prototype supports the interior only, because that is where the
// district character models are loaded (the street loads a different set of crowd models).
const ROOMS={'district-interior':{x:[-400,400],z:[-400,400],cap:12}};
// Existing animated District crowd models that a character slot may name (see CHARACTER_MODELS in void_runner_api.py).
// The creator's appearance rules are shared with the game (one catalog, one validator). If the file is not deployed with the hub, appearances are simply ignored.
const Appearance=(()=>{try{return require('./appearance/character-appearance.js');}catch{return null;}})();
const RENDERABLE=Appearance?[...new Set(['district-smuggler','district-resident',...Object.values(Appearance.CATALOG.looks).map(l=>l.model)])]:['district-smuggler','district-resident'];
const DEFAULT_MODEL='district-smuggler';
const LIMITS={maxBytes:512,maxHelloBytes:4400,helloMs:45000,maxSpeed:9,speedSlack:1.5,snapEveryMs:5000,staleMs:12000,maxPerSecond:40,violationsBeforeKick:8,stateIntervalMs:80,walkHoldMs:450};

// A public handle (3 to 20 letters, digits, underscore: the same rule as the handle registry) is the display name; the server re-checks it.
const HANDLE=/^[A-Za-z0-9_]{3,20}$/;
/* ---- Shared VR sessions (docs/development/VR_SESSIONS.md). A session is a room of its own, named 'vr:<id>': everything that is per room (who sees whom, chat) is
   therefore per session without further code. PUBLIC sessions are listed and joinable by id. PRIVATE sessions are never listed, cannot be joined by id (the answer
   is the same as for a session that does not exist) and are entered only with their join code; whoever entered once may come back while the session lives.
   The creator leaving does not end a session: the longest-present member becomes its owner; the session ends when the last member leaves. ---- */
const VR={cap:8,maxSessions:40,createEveryMs:5000,codeMs:30*60*1000,badCodes:5,badCodeWindowMs:60000,exp:/^[a-z0-9-]{1,40}$/,code:/^[A-HJ-NP-Z2-9]{8}$/,id:/^[0-9a-f]{12}$/,district:'district-interior',bounds:{x:[-2e4,2e4],z:[-2e4,2e4]}};
const CODE_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 32 symbols, no look-alikes: 8 of them are 40 bits
const newCode=()=>[...crypto.randomBytes(8)].map(b=>CODE_ALPHABET[b&31]).join('');
// Options of the experience (which forest, which arena): a small flat object of plain values, passed on as data. The joining game checks it against its own menu.
function cleanOpts(text){if(typeof text!=='string'||text.length>240)return null;let o;try{o=JSON.parse(text);}catch{return null;}if(!o||typeof o!=='object'||Array.isArray(o))return null;const keys=Object.keys(o);if(keys.length>8)return null;
  for(const k of keys){const v=o[k];if(!/^[A-Za-z0-9_-]{1,24}$/.test(k)||!(typeof v==='boolean'||(typeof v==='number'&&Number.isFinite(v))||(typeof v==='string'&&/^[A-Za-z0-9 _:.-]{0,40}$/.test(v))))return null;}return JSON.stringify(o);}
const publicId=uid=>crypto.createHash('sha256').update('district-hub:'+uid).digest('hex').slice(0,12);
const num=v=>typeof v==='number'&&Number.isFinite(v);

// A raw frame becomes a message object or null. Only the three client messages exist.
function parse(raw){
  if(typeof raw!=='string'||raw.length>LIMITS.maxHelloBytes)return null; // a login token is about 1 KB; every other message is tiny
  let m;try{m=JSON.parse(raw);}catch{return null;}
  if(!m||typeof m!=='object'||Array.isArray(m))return null;
  const keys=Object.keys(m).sort().join();
  if(m.t==='trade')return raw.length<=TRADE_RULES.maxBytes?parseTrade(m):null;   // trades carry an item list, so a little more room
  if(m.t!=='hello'&&m.t!=='refresh'&&raw.length>LIMITS.maxBytes)return null;
  if(m.t==='hello')return keys==='room,t,token'&&typeof m.token==='string'&&m.token.length<4096&&typeof m.room==='string'?m:null;
  if(m.t==='state')return keys==='t,x,yaw,z'&&num(m.x)&&num(m.z)&&num(m.yaw)&&Math.abs(m.x)<1e5&&Math.abs(m.z)<1e5&&Math.abs(m.yaw)<1e4?m:null;
  if(m.t==='bye')return keys==='t'?m:null;
  if(m.t==='chat')return keys==='t,text'&&typeof m.text==='string'&&m.text.length<=Chat.RULES.maxChars*4?m:null;   // the cleaned length is checked again by chat.cjs
  if(m.t==='ignore')return keys==='id,on,t'&&/^[0-9a-f]{12}$/.test(String(m.id))&&typeof m.on==='boolean'?m:null;
  if(m.t==='report')return (keys==='id,reason,t'||keys==='id,note,reason,t')&&/^[0-9a-f]{12}$/.test(String(m.id))&&Chat.RULES.reasons.includes(m.reason)&&(m.note===undefined||typeof m.note==='string')?m:null;
  if(m.t==='vr-list'||m.t==='vr-leave')return keys==='t'?m:null;
  if(m.t==='vr-create')return keys==='exp,opts,private,t'&&VR.exp.test(String(m.exp))&&typeof m.private==='boolean'&&cleanOpts(m.opts)!==null?m:null;
  if(m.t==='vr-join')return (keys==='id,t'&&VR.id.test(String(m.id)))||(keys==='code,t'&&typeof m.code==='string'&&m.code.length<=12)?m:null;
  if(m.t==='refresh')return keys==='t,token'&&typeof m.token==='string'&&m.token.length<4096?m:null;   // re-read my saved look (a fresh sign-in token, like hello)
  return null; // anything else, including any attempt to send an identity, model or name, is invalid
}
const wrap=a=>{a=a%(Math.PI*2);return a>Math.PI?a-Math.PI*2:a<-Math.PI?a+Math.PI*2:a;};

class Hub{
  /* send(connection, object) and close(connection, code, reason) are supplied by the transport. */
  constructor({send,close,now=()=>Date.now(),report=()=>{}}){this.send=send;this.closeConn=close;this.now=now;this.report=report;this.peers=new Map();this.byConn=new Map();this.trades=null;this.history=[];this.sessions=new Map();}
  /* Turns player-to-player trading on for this hub, against a ledger (ledger.cjs). The production ledger is the disabled one. */
  attachTrades(ledger,{simulated=false,rules}={}){
   this.trades=new TradeBook({ledger,simulated,rules,now:()=>this.now(),peers:{byUid:u=>this.peers.get(u)||null,byPublicId:id=>[...this.peers.values()].find(p=>p.id===id)||null},
    send:(uid,m)=>{const p=this.peers.get(uid);if(p)this.send(p.conn,m);}});
   return this.trades;
  }
  /* A trade message from a joined player. Identity is the verified account of this connection, never anything in the message. */
  trade(conn,m){const p=this.byConn.get(conn);if(!p)return Promise.resolve();if(!this.trades)return Promise.resolve(this.send(conn,{t:'trade',ev:'refused',reason:'Trading is not enabled.'}));
   return this.trades.handle(p.uid,m).catch(()=>this.send(conn,{t:'trade',ev:'refused',reason:'The trade could not be processed.'}));}
  roomPeers(room){return [...this.peers.values()].filter(p=>p.room===room);}
  view(p){return {id:p.id,name:p.name,model:p.model,appearance:p.appearance,x:p.x,z:p.z,yaw:p.yaw,clip:p.clip};}
  /* The look a verified account is shown with: its saved appearance when valid (ids checked again here), else the look matching its old {gender, model} character, else the default. */
  look(who){
   if(who.anonymous)return {model:DEFAULT_MODEL,appearance:null};
   if(Appearance&&who.appearance&&Appearance.validate(who.appearance)){const a=Appearance.normalize(who.appearance);return {model:Appearance.CATALOG.looks[a.look].model,appearance:a};}
   const model=RENDERABLE.includes(who.model)?who.model:DEFAULT_MODEL;
   return {model,appearance:Appearance?Appearance.fromLegacy({gender:model==='district-resident'?'female':'male',model}):null};
  }
  /* A player changed their look (wardrobe): `who` is freshly verified. Only the same account, at most once every 2 seconds. */
  refresh(conn,who){
   const p=this.byConn.get(conn);if(!p||p.uid!==who.uid)return false;const t=this.now();
   if(t-(p.lastRefresh??-Infinity)<2000){this.send(conn,{t:'refused',reason:'too many look changes'});return false;}
   p.lastRefresh=t;const l=this.look(who);
   if(JSON.stringify(l.appearance)===JSON.stringify(p.appearance)&&l.model===p.model)return true;
   p.model=l.model;p.appearance=l.appearance;
   if(p.placed)this.broadcast(p.room,{t:'look',id:p.id,model:p.model,appearance:p.appearance},p.id);
   return true;
  }
  broadcast(room,message,exceptId){for(const p of this.roomPeers(room))if(p.id!==exceptId)this.send(p.conn,message);}

  /* `who` is the verified identity from the transport: {uid, anonymous, model}. Returns true when the player is in. */
  join(conn,message,who){
    const room=ROOMS[message.room];
    if(!room){this.send(conn,{t:'error',reason:'unknown room'});return false;}
    const id=publicId(who.uid),t=this.now();
    // A second connection for the same account replaces the first: never two avatars for one account.
    const old=this.peers.get(who.uid);if(old)this.drop(old.conn,4001,'replaced by a newer connection');
    if(this.roomPeers(message.room).length>=room.cap){this.send(conn,{t:'error',reason:'room full'});this.closeConn(conn,4003,'room full');return false;}
    const {model,appearance}=this.look(who);
    const peer={uid:who.uid,id,conn,room:message.room,name:typeof who.handle==='string'&&HANDLE.test(who.handle)?who.handle:(who.anonymous?'Guest-':'Pilot-')+id.slice(0,4),model,appearance,x:0,z:0,yaw:0,clip:'idle',placed:false,anonymous:!!who.anonymous,ignoring:new Set(),chatTimes:[],chatRefusals:0,chatLockUntil:0,reports:0,lastReportAt:-Infinity,lastAt:t,lastMove:t,lastSnap:-Infinity,bucketAt:t,bucket:0,violations:0};
    this.peers.set(who.uid,peer);this.byConn.set(conn,peer);
    this.send(conn,{t:'welcome',you:id,features:{trade:!!this.trades?.enabled,tradeSimulated:!!this.trades?.simulated,chat:!who.anonymous,vr:true},peers:this.roomPeers(message.room).filter(p=>p.id!==id&&p.placed).map(p=>this.view(p))});
    return true;
  }

  /* ---- Text chat. Only the verified, registered account of this connection can speak; the name is the hub's, never the message's. ---- */
  chat(conn,m){
    const p=this.byConn.get(conn);if(!p)return {ok:false};const t=this.now(),R=Chat.RULES;
    const refuse=(reason,soft=true)=>{if(soft&&++p.chatRefusals>=R.lockAfterRefusals){p.chatRefusals=0;p.chatLockUntil=t+R.lockMs;reason='You are sending messages too fast. Chat is paused for a minute.';}this.send(conn,{t:'chat-refused',reason});return {ok:false,reason};};
    if(p.anonymous)return refuse('Chat needs a registered account.',false);
    if(!p.placed)return refuse('Walk into the District first.',false);
    if(t<p.chatLockUntil)return refuse('Chat is paused for a moment.',false);
    const c=Chat.clean(m.text);if(!c.ok)return refuse(c.reason);
    p.chatTimes=p.chatTimes.filter(x=>t-x<R.windowMs);
    if(p.chatTimes.length&&t-p.chatTimes[p.chatTimes.length-1]<R.minIntervalMs)return refuse('Slow down a little.');
    if(p.chatTimes.length>=R.perWindow)return refuse('You are sending messages too fast.');
    if(p.lastText===c.text&&t-p.lastTextAt<R.duplicateMs)return refuse('You just said that.');
    p.chatTimes.push(t);p.lastText=c.text;p.lastTextAt=t;p.chatRefusals=0;
    const msg={t:'chat',id:p.id,name:p.name,text:c.text,at:t};
    this.history.push({room:p.room,id:p.id,uid:p.uid,name:p.name,text:c.text,at:t});if(this.history.length>R.historyKeep)this.history.shift();
    for(const q of this.roomPeers(p.room))if(q.id===p.id||!q.ignoring.has(p.id))this.send(q.conn,msg);
    return {ok:true};
  }
  /* Mute or block: the hub stops delivering that player's chat to this connection. (The game also hides a blocked player's avatar.) */
  ignore(conn,m){const p=this.byConn.get(conn);if(!p||m.id===p.id)return false;if(m.on){if(p.ignoring.size>=Chat.RULES.maxIgnored&&!p.ignoring.has(m.id))return false;p.ignoring.add(m.id);}else p.ignoring.delete(m.id);return true;}
  /* A report goes to the hub's log (the owner's handling path: docs/development/MODERATION.md) together with the reported player's recent lines. */
  reportPlayer(conn,m){
    const p=this.byConn.get(conn);if(!p)return false;const t=this.now(),R=Chat.RULES;
    if(p.anonymous){this.send(conn,{t:'report-refused',reason:'Reporting needs a registered account.'});return false;}
    if(t-p.lastReportAt<R.reportEveryMs||p.reports>=R.reportsPerSession){this.send(conn,{t:'report-refused',reason:'Please wait before sending another report.'});return false;}
    const target=this.roomPeers(p.room).find(q=>q.id===m.id)||null,seen=this.history.filter(h=>h.id===m.id&&h.room===p.room);
    if(m.id===p.id||(!target&&!seen.length)){this.send(conn,{t:'report-refused',reason:'That player is not here.'});return false;}
    const who=target||seen[seen.length-1];p.lastReportAt=t;p.reports++;
    this.report({at:new Date(t).toISOString(),room:p.room,reason:m.reason,note:Chat.cleanNote(m.note),reporter:{id:p.id,uid:p.uid,name:p.name},target:{id:m.id,uid:who.uid,name:who.name},recentLines:seen.slice(-10).map(h=>({at:new Date(h.at).toISOString(),text:h.text}))});
    this.send(conn,{t:'reported'});return true;
  }

  /* A state message. The server decides what it accepts and derives the animation itself. */
  state(conn,m){
    const p=this.byConn.get(conn);if(!p)return {ok:false,reason:'no session'};
    const t=this.now(),room=ROOMS[p.room]||VR.bounds;
    if(t-p.bucketAt>=1000){p.bucketAt=t;p.bucket=0;}
    if(++p.bucket>LIMITS.maxPerSecond)return this.violate(p,'flood',true);
    p.lastAt=t;
    if(t-(p.lastRelay??-Infinity)<LIMITS.stateIntervalMs)return {ok:true,dropped:true}; // over 12 Hz: dropped, not punished
    if(m.x<room.x[0]||m.x>room.x[1]||m.z<room.z[0]||m.z>room.z[1])return this.violate(p,'out of bounds');
    const dt=Math.max(.05,(t-p.lastMove)/1000);let moved=0;
    if(p.placed){
      const d=Math.hypot(m.x-p.x,m.z-p.z);moved=d;
      if(d>LIMITS.maxSpeed*dt*LIMITS.speedSlack+.5){
        // A jump (a door, leaving the pod) is allowed once per few seconds; anything more is refused and counted.
        if(t-p.lastSnap<LIMITS.snapEveryMs)return this.violate(p,'moving too fast');
        p.lastSnap=t;moved=0;
      }
    }
    p.x=m.x;p.z=m.z;p.yaw=wrap(m.yaw);p.lastMove=t;p.lastRelay=t;
    // Walking is chosen from how far the player moved since the last update (not metres per real second: a slow machine moves in
    // small steps) and holds for a moment, so an uneven frame rate never makes the animation flicker. Legality uses real time above.
    if(moved>.02)p.walkUntil=t+LIMITS.walkHoldMs;
    p.clip=t<(p.walkUntil??0)?'walk':'idle';
    queueMicrotask(()=>this.trades?.onMove(p.uid));   // a step away from a trade partner ends the trade
    const first=!p.placed;p.placed=true;
    if(first)this.broadcast(p.room,{t:'join',peer:this.view(p)},p.id);
    else this.broadcast(p.room,{t:'state',id:p.id,x:p.x,z:p.z,yaw:p.yaw,clip:p.clip},p.id);
    return {ok:true};
  }
  violate(p,reason,hard){
    this.send(p.conn,{t:'refused',reason});
    if(hard||++p.violations>=LIMITS.violationsBeforeKick){this.drop(p.conn,4002,reason);}
    return {ok:false,reason};
  }
  /* Leave, close or kick: the avatar goes from every other screen exactly once. */
  drop(conn,code,reason){
    const p=this.byConn.get(conn);this.byConn.delete(conn);
    if(p&&this.peers.get(p.uid)===p){this.trades?.onLeave(p.uid);this.peers.delete(p.uid);if(p.placed)this.broadcast(p.room,{t:'leave',id:p.id});this.vrDepart(p);}
    if(code)this.closeConn(conn,code,reason||'');
  }
  /* ---- Shared VR sessions ---- */
  vrOf(p){return p.room.startsWith('vr:')?this.sessions.get(p.room.slice(3))||null:null;}
  vrInfo(s,forMember){const owner=this.peers.get(s.owner);return {id:s.id,exp:s.exp,opts:s.opts,private:s.private,count:s.members.size,cap:VR.cap,host:owner?owner.name:'',...(forMember&&s.private?{code:s.code,codeExpires:s.createdAt+VR.codeMs}:{})};}
  /* A member is gone from its session (left, disconnected, kicked): pass ownership on or end the session. */
  vrDepart(p){const s=this.vrOf(p);if(!s)return;s.members.delete(p.uid);
   if(!s.members.size){this.sessions.delete(s.id);return;}
   if(s.owner===p.uid)s.owner=[...s.members][0];
   for(const uid of s.members){const q=this.peers.get(uid);if(q)this.send(q.conn,{t:'vr-update',session:this.vrInfo(s,true)});}}
  /* Move a player between the District and a session: gone from the old room's screens, and shown in the new one with its next position. */
  vrMove(p,room){this.trades?.onLeave(p.uid);if(p.placed)this.broadcast(p.room,{t:'leave',id:p.id});this.vrDepart(p);p.room=room;p.placed=false;p.lastSnap=-Infinity;p.clip='idle';
   const s=this.vrOf(p);if(s)s.members.add(p.uid);
   this.send(p.conn,{t:'vr-room',session:s?this.vrInfo(s,true):null,peers:this.roomPeers(room).filter(q=>q.id!==p.id&&q.placed).map(q=>this.view(q))});
   if(s)for(const uid of s.members){const q=this.peers.get(uid);if(q&&q!==p)this.send(q.conn,{t:'vr-update',session:this.vrInfo(s,true)});}}
  vrRefuse(conn,reason){this.send(conn,{t:'vr-refused',reason});return {ok:false,reason};}
  vrList(conn){const p=this.byConn.get(conn);if(!p)return;this.send(conn,{t:'vr-sessions',list:[...this.sessions.values()].filter(s=>!s.private).map(s=>this.vrInfo(s,false))});}
  vrCreate(conn,m){const p=this.byConn.get(conn);if(!p)return {ok:false};const t=this.now();
   if(p.anonymous)return this.vrRefuse(conn,'Shared VR sessions need a registered account.');
   if(t-(p.lastVrCreate??-Infinity)<VR.createEveryMs)return this.vrRefuse(conn,'Wait a moment before opening another session.');
   if(this.sessions.size>=VR.maxSessions)return this.vrRefuse(conn,'Too many sessions are open right now.');
   p.lastVrCreate=t;let id;do{id=crypto.randomBytes(6).toString('hex');}while(this.sessions.has(id));
   const s={id,exp:m.exp,opts:cleanOpts(m.opts),private:m.private,code:m.private?newCode():null,owner:p.uid,members:new Set(),allowed:new Set([p.uid]),createdAt:t};this.sessions.set(id,s);
   this.vrMove(p,'vr:'+id);return {ok:true,id};}
  vrJoin(conn,m){const p=this.byConn.get(conn);if(!p)return {ok:false};const t=this.now(),NONE='That session is not available.';
   if(p.anonymous)return this.vrRefuse(conn,'Shared VR sessions need a registered account.');
   let s=null;
   if(m.code!==undefined){
    p.badCodes=(p.badCodes||[]).filter(x=>t-x<VR.badCodeWindowMs);if(p.badCodes.length>=VR.badCodes)return this.vrRefuse(conn,'Too many wrong codes. Try again in a minute.');
    const code=String(m.code).toUpperCase().replace(/[^A-Z0-9]/g,'');
    s=VR.code.test(code)?[...this.sessions.values()].find(x=>x.private&&x.code===code&&t-x.createdAt<=VR.codeMs)||null:null;
    if(!s){p.badCodes.push(t);return this.vrRefuse(conn,'That code is not valid.');}
    s.allowed.add(p.uid);
   }else{s=this.sessions.get(m.id)||null;if(!s||(s.private&&!s.allowed.has(p.uid)))return this.vrRefuse(conn,NONE);}   // a private session answers exactly like no session
   if(this.vrOf(p)===s)return {ok:true,id:s.id};
   if(s.members.size>=VR.cap)return this.vrRefuse(conn,'That session is full.');
   this.vrMove(p,'vr:'+s.id);return {ok:true,id:s.id};}
  vrLeave(conn){const p=this.byConn.get(conn);if(!p||!p.room.startsWith('vr:'))return {ok:false};this.vrMove(p,VR.district);return {ok:true};}
  closed(conn){this.drop(conn,0);}
  /* Players that went silent (a dead network, a sleeping laptop) leave too, so no ghost avatar stays. */
  sweep(){this.trades?.sweep();const t=this.now();for(const p of [...this.peers.values()])if(t-p.lastAt>LIMITS.staleMs)this.drop(p.conn,4004,'timed out');}
}
module.exports={ROOMS,RENDERABLE,DEFAULT_MODEL,LIMITS,VR,publicId,parse,Hub};
