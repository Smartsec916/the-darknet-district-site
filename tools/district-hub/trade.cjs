/* Player-to-player trading: the conversation between two players, as a state machine. PURE: no network, no clock, no storage. It never touches a
   balance or an item; every question about ownership and every change of ownership goes to the ledger (ledger.cjs). If the ledger is the
   disabled one, no session can ever complete.

   Rules this module enforces (all on the server's own knowledge of where players are; the client only asks):
     - Both players are in the same room (location) and within `interact` metres to start; a walk beyond `release` metres, a room change, a
       disconnect, a replaced session, or a timeout cancels the trade.
     - One session per player at a time: a player in a trade cannot be asked, and cannot ask.
     - Either player can cancel until the settlement itself begins (which takes an instant).
     - Any change to an offer cancels both confirmations, and a confirmation is bound to the exact offer version it saw (no bait and switch).
     - Both confirmations on the same version, a last check of distance, and then ONE call to ledger.settle (all or nothing, replay safe).
   Messages in:  {t:'trade', op:'request', to} | 'accept' | 'decline' | 'cancel' | 'offer' {v, credits, stacks, equipment} | 'confirm' {v}
   Messages out: {t:'trade', ev: 'incoming'|'requested'|'open'|'update'|'done'|'cancelled'|'failed'|'refused'|'inventory', ...}                   */
'use strict';
const crypto=require('node:crypto');
const {normalizeOffer,emptyOffer,isEmpty,describe,CATALOG,serialItem}=require('./trade-items.cjs');
/* A ledger snapshot with display names added, which is what a player is shown of their own inventory. */
const named=snap=>({credits:snap.credits,revision:snap.revision,stacks:snap.stacks.map(s=>({id:s.id,name:CATALOG[s.id]?.name||s.id,kind:CATALOG[s.id]?.kind,qty:s.qty})),equipment:snap.equipment.map(e=>({serial:e,id:serialItem(e),name:CATALOG[serialItem(e)]?.name||serialItem(e),kind:CATALOG[serialItem(e)]?.kind}))});

const RULES={interact:3,release:4.5,requestMs:30_000,idleMs:300_000,cooldownMs:8_000,perSecond:10,maxBytes:1500};
const ID12=/^[0-9a-f]{12}$/;
const intOk=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;

/* A raw JSON message of type 'trade' -> a clean object or null. Shape only; ownership is the ledger's business. */
function parseTrade(m){
 if(!m||typeof m!=='object'||m.t!=='trade'||typeof m.op!=='string')return null;
 const keys=Object.keys(m).sort().join();
 switch(m.op){
  case 'request':return keys==='op,t,to'&&typeof m.to==='string'&&ID12.test(m.to)?m:null;
  case 'accept':case 'decline':case 'cancel':return keys==='op,t'?m:null;
  case 'confirm':return keys==='op,t,v'&&intOk(m.v,1e6)?m:null;
  case 'offer':return keys==='credits,equipment,op,stacks,t,v'&&intOk(m.v,1e6)?m:null;
  default:return null;
 }
}

class TradeBook{
 /* peers: {byUid(uid)->{uid,id,name,room,x,z,placed}|null, byPublicId(id)->same|null}; send(uid,message); */
 constructor({ledger,peers,send,now=()=>Date.now(),newId=()=>crypto.randomBytes(8).toString('hex'),rules={},simulated=false}){
  this.ledger=ledger;this.peers=peers;this.send=send;this.now=now;this.newId=newId;this.rules={...RULES,...rules};this.simulated=simulated;
  this.sessions=new Map();this.byUid=new Map();this.cooldown=new Map();this.bucket=new Map();this.results=[];
 }
 get enabled(){return !!this.ledger?.enabled;}
 sessionOf(uid){return this.byUid.get(uid)||null;}
 other(s,uid){return s.a===uid?s.b:s.a;}
 name(uid){return this.peers.byUid(uid)?.name||'Player';}
 dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
 refuse(uid,reason,extra={}){this.send(uid,{t:'trade',ev:'refused',reason,...extra});}
 end(s,ev,reason,tell='both'){
  this.sessions.delete(s.id);for(const u of [s.a,s.b])if(this.byUid.get(u)===s)this.byUid.delete(u);
  s.state='ended';for(const u of [s.a,s.b])if(tell==='both'||tell===u)this.send(u,{t:'trade',ev,id:s.id,reason});
 }
 view(s,uid){
  const mine=s.offers[uid],theirs=s.offers[this.other(s,uid)];
  return {t:'trade',ev:'update',id:s.id,v:s.v,yours:describe(mine),theirs:describe(theirs),confirmed:{you:!!s.confirmed[uid],them:!!s.confirmed[this.other(s,uid)]}};
 }
 broadcast(s){for(const u of [s.a,s.b])this.send(u,this.view(s,u));}
 async inventory(uid){const snap=await this.ledger.snapshot(uid);this.send(uid,{t:'trade',ev:'inventory',inventory:named(snap)});return snap;}

 /* The two players of a session: both still here, same room, close enough? */
 near(s,limit){
  const pa=this.peers.byUid(s.a),pb=this.peers.byUid(s.b);
  if(!pa||!pb||!pa.placed||!pb.placed)return 'a player left';
  if(pa.room!==pb.room)return 'changed location';
  if(this.dist(pa,pb)>limit)return 'walked away';
  return null;
 }
 limited(uid){
  const t=this.now(),b=this.bucket.get(uid)||{at:t,n:0};if(t-b.at>=1000){b.at=t;b.n=0;}b.n++;this.bucket.set(uid,b);return b.n>this.rules.perSecond;
 }

 async handle(uid,m){
  if(!this.enabled)return this.refuse(uid,'Trading is not enabled.');
  if(this.limited(uid))return this.refuse(uid,'Slow down.');
  const me=this.peers.byUid(uid);if(!me||!me.placed)return this.refuse(uid,'Not in the room yet.');
  switch(m.op){
   case 'request':return this.request(me,m.to);
   case 'accept':return this.accept(me);
   case 'decline':return this.decline(me);
   case 'cancel':return this.cancel(me);
   case 'offer':return this.offer(me,m);
   case 'confirm':return this.confirm(me,m);
  }
 }

 request(me,toId){
  if(this.sessionOf(me.uid))return this.refuse(me.uid,'You are already in a trade.');
  const to=this.peers.byPublicId(toId);
  if(!to||!to.placed||to.uid===me.uid)return this.refuse(me.uid,'That player is not here.');
  if(to.room!==me.room)return this.refuse(me.uid,'That player is in another location.');
  if(this.dist(me,to)>this.rules.interact)return this.refuse(me.uid,'Move closer to trade.');
  if(this.sessionOf(to.uid))return this.refuse(me.uid,this.name(to.uid)+' is busy.');
  const key=[me.uid,to.uid].sort().join('|'),cd=this.cooldown.get(key);if(cd&&this.now()<cd)return this.refuse(me.uid,'Wait a moment before asking again.');
  const s={id:this.newId(),a:me.uid,b:to.uid,room:me.room,state:'requested',v:0,offers:{[me.uid]:emptyOffer(),[to.uid]:emptyOffer()},confirmed:{},createdAt:this.now(),lastAt:this.now()};
  this.sessions.set(s.id,s);this.byUid.set(me.uid,s);this.byUid.set(to.uid,s);
  this.send(me.uid,{t:'trade',ev:'requested',id:s.id,to:{id:to.id,name:to.name}});
  this.send(to.uid,{t:'trade',ev:'incoming',id:s.id,from:{id:me.id,name:me.name}});
 }
 async accept(me){
  const s=this.sessionOf(me.uid);if(!s||s.state!=='requested'||s.b!==me.uid)return this.refuse(me.uid,'There is no request to accept.');
  const why=this.near(s,this.rules.interact);if(why)return this.end(s,'cancelled',why);
  s.state='open';s.lastAt=this.now();
  const snaps={};for(const u of [s.a,s.b])snaps[u]=await this.ledger.snapshot(u);
  if(s.state!=='open')return;   // cancelled while the inventories were being read
  for(const u of [s.a,s.b]){const o=this.other(s,u);this.send(u,{t:'trade',ev:'open',id:s.id,with:{id:this.peers.byUid(o)?.id,name:this.name(o)},inventory:named(snaps[u]),simulated:this.simulated});}
  this.broadcast(s);
 }
 decline(me){
  const s=this.sessionOf(me.uid);if(!s||s.state!=='requested'||s.b!==me.uid)return this.refuse(me.uid,'There is no request to decline.');
  this.cooldown.set([s.a,s.b].sort().join('|'),this.now()+this.rules.cooldownMs);this.end(s,'cancelled',this.name(me.uid)+' declined.');
 }
 cancel(me){
  const s=this.sessionOf(me.uid);if(!s)return this.refuse(me.uid,'You are not in a trade.');
  if(s.state==='settling')return this.refuse(me.uid,'The exchange is already being completed.');
  if(s.state==='requested'&&s.a===me.uid){this.send(s.b,{t:'trade',ev:'cancelled',id:s.id,reason:this.name(me.uid)+' cancelled the request.'});return this.end(s,'cancelled','You cancelled the request.',s.a);}
  this.end(s,'cancelled',this.name(me.uid)+' cancelled the trade.');
 }
 async offer(me,m){
  const s=this.sessionOf(me.uid);if(!s||s.state!=='open')return this.refuse(me.uid,'There is no open trade.');
  const why=this.near(s,this.rules.release);if(why)return this.end(s,'cancelled',why);
  if(m.v!==s.v){this.refuse(me.uid,'Your view was out of date.');return this.send(me.uid,this.view(s,me.uid));}
  const n=normalizeOffer({credits:m.credits,stacks:m.stacks,equipment:m.equipment});if(!n.ok){this.refuse(me.uid,n.reason);return this.send(me.uid,this.view(s,me.uid));}
  const c=await this.ledger.check(me.uid,n.offer);
  if(s.state!=='open'||m.v!==s.v)return;   // changed while the ledger was being asked
  if(!c.ok){this.refuse(me.uid,c.reason);return this.send(me.uid,this.view(s,me.uid));}
  s.offers[me.uid]=n.offer;s.v++;s.confirmed={};s.lastAt=this.now();this.broadcast(s);
 }
 async confirm(me,m){
  const s=this.sessionOf(me.uid);if(!s||s.state!=='open')return this.refuse(me.uid,'There is no open trade.');
  const why=this.near(s,this.rules.release);if(why)return this.end(s,'cancelled',why);
  if(m.v!==s.v){this.refuse(me.uid,'The offer changed. Review it again.');return this.send(me.uid,this.view(s,me.uid));}
  if(isEmpty(s.offers[s.a])&&isEmpty(s.offers[s.b]))return this.refuse(me.uid,'Nothing has been offered.');
  // Re-verify both sides against the ledger now: what a player had when they made the offer may be gone.
  for(const u of [s.a,s.b]){const c=await this.ledger.check(u,s.offers[u]);
   if(s.state!=='open'||m.v!==s.v)return;
   if(!c.ok){s.confirmed={};s.v++;this.broadcast(s);return this.end(s,'failed',this.name(u)+' can no longer cover the offer ('+c.reason+').');}}
  s.confirmed[me.uid]=true;s.lastAt=this.now();this.broadcast(s);
  if(!(s.confirmed[s.a]&&s.confirmed[s.b]))return;
  const gone=this.near(s,this.rules.release);if(gone)return this.end(s,'cancelled',gone);
  // Both agreed to exactly this version. From here the session can no longer be changed or cancelled; the ledger decides.
  s.state='settling';
  let result;
  try{result=await this.ledger.settle({tradeId:s.id,a:{uid:s.a,offer:s.offers[s.a]},b:{uid:s.b,offer:s.offers[s.b]}});}
  catch(e){result={ok:false,reason:'The exchange could not be completed. Nothing was changed.'};}
  this.results.push({id:s.id,ok:!!result.ok,reason:result.reason||null});
  this.sessions.delete(s.id);for(const u of [s.a,s.b])if(this.byUid.get(u)===s)this.byUid.delete(u);s.state='ended';
  if(!result.ok){for(const u of [s.a,s.b])this.send(u,{t:'trade',ev:'failed',id:s.id,reason:result.reason||'The exchange failed.'});return;}
  for(const u of [s.a,s.b]){const o=this.other(s,u);this.send(u,{t:'trade',ev:'done',id:s.id,gave:describe(s.offers[u]),got:describe(s.offers[o])});await this.inventory(u);}
 }

 /* Called by the hub when a player moves, leaves or goes silent. */
 onMove(uid){const s=this.sessionOf(uid);if(!s||s.state==='settling'||s.state==='ended')return;const why=this.near(s,s.state==='requested'?this.rules.interact*1.5:this.rules.release);if(why)this.end(s,'cancelled',why);}
 onLeave(uid){const s=this.sessionOf(uid);if(!s)return;if(s.state==='settling'){this.byUid.delete(uid);return;}this.end(s,'cancelled',this.name(uid)+' left.');}
 sweep(){
  const t=this.now();
  for(const s of [...this.sessions.values()]){
   if(s.state==='requested'&&t-s.createdAt>this.rules.requestMs)this.end(s,'cancelled','The request expired.');
   else if(s.state==='open'&&t-s.lastAt>this.rules.idleMs)this.end(s,'cancelled','The trade timed out.');
  }
  for(const [k,v] of this.cooldown)if(t>v)this.cooldown.delete(k);
 }
}
module.exports={TradeBook,parseTrade,RULES};
