/* District hub: the pure rules. No network, no clock, no storage: every function gets what it needs, so the same module can sit
   behind this local test server today and a production hub later. Identity NEVER comes from a message: the transport verifies a
   login token and passes the verified account in. A client may only say where it is. */
'use strict';
const crypto=require('node:crypto');

// Whitelisted rooms. The bounds are a coarse sanity box around the district interior (this is NOT the floor plan; the real
// footprint is owned by void-runner/neochinatown.js). The prototype supports the interior only, because that is where the
// district character models are loaded (the street loads a different set of crowd models).
const ROOMS={'district-interior':{x:[-400,400],z:[-400,400],cap:12}};
// Existing animated District crowd models that a character slot may name (see CHARACTER_MODELS in void_runner_api.py).
const RENDERABLE=['district-smuggler','district-resident'];
const DEFAULT_MODEL='district-smuggler';
const LIMITS={maxBytes:512,maxHelloBytes:4400,helloMs:45000,maxSpeed:9,speedSlack:1.5,snapEveryMs:5000,staleMs:12000,maxPerSecond:40,violationsBeforeKick:8,stateIntervalMs:80,walkHoldMs:450};

// A public handle (3 to 20 letters, digits, underscore: the same rule as the handle registry) is the display name; the server re-checks it.
const HANDLE=/^[A-Za-z0-9_]{3,20}$/;
const publicId=uid=>crypto.createHash('sha256').update('district-hub:'+uid).digest('hex').slice(0,12);
const num=v=>typeof v==='number'&&Number.isFinite(v);

// A raw frame becomes a message object or null. Only the three client messages exist.
function parse(raw){
  if(typeof raw!=='string'||raw.length>LIMITS.maxHelloBytes)return null; // a login token is about 1 KB; every other message is tiny
  let m;try{m=JSON.parse(raw);}catch{return null;}
  if(!m||typeof m!=='object'||Array.isArray(m))return null;
  const keys=Object.keys(m).sort().join();
  if(m.t!=='hello'&&raw.length>LIMITS.maxBytes)return null;
  if(m.t==='hello')return keys==='room,t,token'&&typeof m.token==='string'&&m.token.length<4096&&typeof m.room==='string'?m:null;
  if(m.t==='state')return keys==='t,x,yaw,z'&&num(m.x)&&num(m.z)&&num(m.yaw)&&Math.abs(m.x)<1e5&&Math.abs(m.z)<1e5&&Math.abs(m.yaw)<1e4?m:null;
  if(m.t==='bye')return keys==='t'?m:null;
  return null; // anything else, including any attempt to send an identity, model or name, is invalid
}
const wrap=a=>{a=a%(Math.PI*2);return a>Math.PI?a-Math.PI*2:a<-Math.PI?a+Math.PI*2:a;};

class Hub{
  /* send(connection, object) and close(connection, code, reason) are supplied by the transport. */
  constructor({send,close,now=()=>Date.now()}){this.send=send;this.closeConn=close;this.now=now;this.peers=new Map();this.byConn=new Map();}
  roomPeers(room){return [...this.peers.values()].filter(p=>p.room===room);}
  view(p){return {id:p.id,name:p.name,model:p.model,x:p.x,z:p.z,yaw:p.yaw,clip:p.clip};}
  broadcast(room,message,exceptId){for(const p of this.roomPeers(room))if(p.id!==exceptId)this.send(p.conn,message);}

  /* `who` is the verified identity from the transport: {uid, anonymous, model}. Returns true when the player is in. */
  join(conn,message,who){
    const room=ROOMS[message.room];
    if(!room){this.send(conn,{t:'error',reason:'unknown room'});return false;}
    const id=publicId(who.uid),t=this.now();
    // A second connection for the same account replaces the first: never two avatars for one account.
    const old=this.peers.get(who.uid);if(old)this.drop(old.conn,4001,'replaced by a newer connection');
    if(this.roomPeers(message.room).length>=room.cap){this.send(conn,{t:'error',reason:'room full'});this.closeConn(conn,4003,'room full');return false;}
    const model=who.anonymous||!RENDERABLE.includes(who.model)?DEFAULT_MODEL:who.model;
    const peer={uid:who.uid,id,conn,room:message.room,name:typeof who.handle==='string'&&HANDLE.test(who.handle)?who.handle:(who.anonymous?'Guest-':'Pilot-')+id.slice(0,4),model,x:0,z:0,yaw:0,clip:'idle',placed:false,lastAt:t,lastMove:t,lastSnap:-Infinity,bucketAt:t,bucket:0,violations:0};
    this.peers.set(who.uid,peer);this.byConn.set(conn,peer);
    this.send(conn,{t:'welcome',you:id,peers:this.roomPeers(message.room).filter(p=>p.id!==id&&p.placed).map(p=>this.view(p))});
    return true;
  }

  /* A state message. The server decides what it accepts and derives the animation itself. */
  state(conn,m){
    const p=this.byConn.get(conn);if(!p)return {ok:false,reason:'no session'};
    const t=this.now(),room=ROOMS[p.room];
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
    if(p&&this.peers.get(p.uid)===p){this.peers.delete(p.uid);if(p.placed)this.broadcast(p.room,{t:'leave',id:p.id});}
    if(code)this.closeConn(conn,code,reason||'');
  }
  closed(conn){this.drop(conn,0);}
  /* Players that went silent (a dead network, a sleeping laptop) leave too, so no ghost avatar stays. */
  sweep(){const t=this.now();for(const p of [...this.peers.values()])if(t-p.lastAt>LIMITS.staleMs)this.drop(p.conn,4004,'timed out');}
}
module.exports={ROOMS,RENDERABLE,DEFAULT_MODEL,LIMITS,publicId,parse,Hub};
