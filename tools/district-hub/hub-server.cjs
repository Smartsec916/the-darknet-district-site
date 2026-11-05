/* WebSocket transport for the pure Hub in protocol.cjs, plus a /health page for the host's health check.
   Everything environment-specific is passed in:
     identify(token) -> {uid, anonymous, model, handle} | null   (who this is; the only source of identity)
     access          -> {allowed:Set|null, denied:Set}            (null allowed = any signed-in account)
     origins         -> exact Origin strings, or null for local development origins only
     gate            -> ConnectionGate                             (connection limits)                                       */
'use strict';
const http=require('node:http');
const {WebSocketServer}=require('ws');
const {Hub,parse,LIMITS}=require('./protocol.cjs');
const {clientIp,ConnectionGate}=require('./limits.cjs');

const LOCAL_ORIGIN=/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;

function start({identify,access={allowed:null,denied:new Set()},origins=null,gate=new ConnectionGate(),trustHops=0,port=0,host='127.0.0.1',log=()=>{}}){
  const originOk=o=>origins?typeof o==='string'&&origins.includes(o):(!o||LOCAL_ORIGIN.test(o));
  const server=http.createServer((req,res)=>{
    if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({ok:true,players:hub.peers.size}));return;}
    res.writeHead(404,{'content-type':'text/plain'});res.end('not found');
  });
  const wss=new WebSocketServer({server,maxPayload:LIMITS.maxHelloBytes,verifyClient:({origin},cb)=>originOk(origin)?cb(true):cb(false,403,'origin not allowed')});
  const hub=new Hub({send:(ws,m)=>{if(ws.readyState===1)ws.send(JSON.stringify(m));},close:(ws,code,why)=>{try{ws.close(code,why);}catch{}}});
  let stopping=false;
  wss.on('connection',(ws,req)=>{
    const ip=clientIp(req.socket.remoteAddress,req.headers['x-forwarded-for'],trustHops),admitted=gate.admit(ip);
    if(!admitted.ok||stopping){log('refused connection',stopping?'restarting':admitted.reason);ws.close(stopping?1012:4006,stopping?'restarting':admitted.reason);return;}
    ws.alive=true;ws.joined=false;ws.busy=false;let released=false;
    const release=()=>{if(!released){released=true;gate.release(ip);}};
    const hello=setTimeout(()=>{if(!ws.joined)ws.close(4005,'hello required');},LIMITS.helloMs);
    ws.on('pong',()=>{ws.alive=true;});
    ws.on('message',async data=>{
      const m=parse(data.toString());
      if(!m){hub.send(ws,{t:'refused',reason:'invalid message'});if(!ws.joined)ws.close(4002,'invalid');else{const p=hub.byConn.get(ws);if(p)hub.violate(p,'invalid message');}return;}
      if(m.t==='hello'){
        log('hello received');        if(ws.joined||ws.busy)return;ws.busy=true;
        const who=await identify(m.token).catch(()=>null);
        log('identified',who?'yes':'no');
        if(!who){log('sign-in not accepted');hub.send(ws,{t:'error',reason:'sign-in not accepted'});ws.close(4401,'sign-in not accepted');return;}
        // The allow-list is checked on the verified account id, never on anything the client wrote.
        if(access.denied.has(who.uid)||(access.allowed&&!access.allowed.has(who.uid))){log('not on the test list');hub.send(ws,{t:'error',reason:'not on the test list'});ws.close(4403,'not allowed');return;}
        if(ws.readyState!==1){ws.busy=false;return;}
        ws.joined=hub.join(ws,m,who);ws.busy=false;clearTimeout(hello);
        if(ws.joined)log('join',hub.byConn.get(ws)?.id);
        return;
      }
      if(!ws.joined){ws.close(4002,'hello first');return;}
      if(m.t==='bye'){hub.drop(ws,1000,'bye');return;}
      hub.state(ws,m);
    });
    ws.on('close',(code)=>{clearTimeout(hello);release();const p=hub.byConn.get(ws);if(p)log('leave',p.id,code);hub.closed(ws);});
    log('connection',ip);
    ws.on('error',()=>{});
  });
  const timer=setInterval(()=>{hub.sweep();for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;try{ws.ping();}catch{}}},4000);
  return new Promise(resolve=>server.listen(port,host,()=>resolve({
    server,wss,hub,gate,get port(){return server.address().port;},
    /* A restart or a stop tells every client "service restarting" (1012) so they reconnect at once, then closes. */
    close:()=>new Promise(res=>{stopping=true;clearInterval(timer);for(const c of wss.clients)try{c.close(1012,'restarting');}catch{}
      setTimeout(()=>{for(const c of wss.clients)c.terminate();wss.close(()=>server.close(()=>res()));},250);})
  })));
}
module.exports={start};
