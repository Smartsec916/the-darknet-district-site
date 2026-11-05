/* WebSocket transport for the pure Hub in protocol.cjs. It verifies the login token through an injected provider, so the same
   server can later run with production providers. It binds to 127.0.0.1 and accepts only local web origins. */
'use strict';
const {WebSocketServer}=require('ws');
const {Hub,parse,LIMITS}=require('./protocol.cjs');

function start({providers,port=0,host='127.0.0.1',log=()=>{}}){
  const wss=new WebSocketServer({host,port,maxPayload:LIMITS.maxHelloBytes,verifyClient:({origin})=>!origin||/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)});
  const hub=new Hub({send:(ws,m)=>{if(ws.readyState===1)ws.send(JSON.stringify(m));},close:(ws,code,why)=>{try{ws.close(code,why);}catch{}}});
  wss.on('connection',ws=>{
    ws.alive=true;ws.joined=false;ws.busy=false;
    const hello=setTimeout(()=>{if(!ws.joined)ws.close(4005,'hello required');},LIMITS.helloMs);
    ws.on('pong',()=>{ws.alive=true;});
    ws.on('message',async data=>{
      const m=parse(data.toString());
      if(!m){hub.send(ws,{t:'refused',reason:'invalid message'});if(!ws.joined)ws.close(4002,'invalid');else{const p=hub.byConn.get(ws);if(p)hub.violate(p,'invalid message');}return;}
      if(m.t==='hello'){
        if(ws.joined||ws.busy)return;ws.busy=true;
        const who=await providers.verifyToken(m.token);
        if(!who){hub.send(ws,{t:'error',reason:'sign-in not accepted'});ws.close(4401,'sign-in not accepted');return;}
        // The character lookup is the server's own. A guest, and a registered account with no character, get the default look.
        const model=who.anonymous?null:await providers.characterModel(who.uid);
        if(ws.readyState!==1){ws.busy=false;return;}
        ws.joined=hub.join(ws,m,{uid:who.uid,anonymous:who.anonymous,model});ws.busy=false;clearTimeout(hello);
        if(ws.joined)log('join',hub.byConn.get(ws)?.id);
        return;
      }
      if(!ws.joined){ws.close(4002,'hello first');return;}
      if(m.t==='bye'){hub.drop(ws,1000,'bye');return;}
      hub.state(ws,m);
    });
    ws.on('close',()=>{clearTimeout(hello);hub.closed(ws);});
    ws.on('error',()=>{});
  });
  const timer=setInterval(()=>{hub.sweep();for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;try{ws.ping();}catch{}}},4000);
  return {wss,hub,get port(){return wss.address().port;},close:()=>new Promise(res=>{clearInterval(timer);for(const c of wss.clients)c.terminate();wss.close(()=>res());})};
}
module.exports={start};
