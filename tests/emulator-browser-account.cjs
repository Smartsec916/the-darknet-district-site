/* Browser identity/API bridge for the NPC multiplayer gate. Loads the real account.js,
   network.js and district-identity.js. Only the auth module is replaced in this
   disposable browser by the same Firebase SDK version connected to local emulators.
   The UI shell and raw hub socket are fixtures, not a rendered gameplay test. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http'),crypto=require('node:crypto'),{spawn}=require('node:child_process'),readline=require('node:readline');
const {create}=require('../tools/district-hub/emulator-providers.cjs');
const {start}=require('../tools/district-hub/hub-server.cjs');
const providers=create(); // refuses nonlocal endpoints and real Google credentials
const authOrigin='http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST;
const origin='http://127.0.0.1:5188',root=path.resolve(__dirname,'..');
const modules=process.env.VOID_EMULATOR_NODE_MODULES;
assert(modules&&path.isAbsolute(modules),'set VOID_EMULATOR_NODE_MODULES to the isolated SDK installation');
const {chromium}=require('playwright'),esbuild=require(path.join(modules,'esbuild'));
const password='correct-horse-9';
const sdkSource=[
  "import {initializeApp} from 'firebase/app';",
  "import {getAuth,connectAuthEmulator,GoogleAuthProvider} from 'firebase/auth';",
  "const app=initializeApp({apiKey:'fake',authDomain:'localhost',projectId:'demo-darknet-local'});",
  "export const auth=getAuth(app),provider=new GoogleAuthProvider();",
  "connectAuthEmulator(auth,"+JSON.stringify(origin)+",{disableWarnings:true});",
  "export {createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut,getRedirectResult,isSignInWithEmailLink,signInWithEmailLink,sendSignInLinkToEmail,signInWithPopup,signInWithRedirect,signInAnonymously,EmailAuthProvider,linkWithCredential,linkWithPopup} from 'firebase/auth';"
].join('\n');
const shell='<!doctype html><meta charset="utf-8"><div id="fixture"></div>'+
 '<script>const screen=document.getElementById("fixture"),mode="fixture",view="";'+
 'window.VoidDevTools={identity(){}};window.VoidLoading={stage(){}};'+
 'function setOwnedGear(){} function announce(){}</script>'+
 '<script src="/void-runner/network.js"></script><script src="/void-runner/account.js"></script>';
const paths=new Set(['/void-runner/network.js','/void-runner/account.js','/district-identity.js']);
const realApiPaths=new Set(['/api/void-runner/account','/api/void-runner/character']);
// Firebase's emulator SDK uses these provider-prefixed REST paths. The browser
// shell is served by an actual loopback HTTP listener; proxy these requests to the
// real loopback emulator rather than relying on cross-origin browser transport.
const authPaths=new Set([
  '/identitytoolkit.googleapis.com/v1/accounts:signUp',
  '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
  '/identitytoolkit.googleapis.com/v1/accounts:lookup',
  '/securetoken.googleapis.com/v1/token'
]);

async function main(){
  const bundle=await esbuild.build({stdin:{contents:sdkSource,resolveDir:root,sourcefile:'emulator-auth.js'},nodePaths:[modules],bundle:true,platform:'browser',format:'esm',write:false});
  const sdk=bundle.outputFiles[0].text;
  // Reuse the exact local Flask/API/Firestore bootstrap already covered by the Python suite.
  const proc=spawn('python',['-u','-c','from tests.test_character_emulator import CharacterEmulatorTests as C; import threading; C.setUpClass(); print(C.base,flush=True); threading.Event().wait()'],{cwd:root,stdio:['ignore','pipe','inherit']});
  let browser,hub,fixture;
  const lines=readline.createInterface({input:proc.stdout});
  try{
    const apiBase=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('local API startup timeout')),30000);
      lines.on('line',line=>{if(/^http:\/\/127\.0\.0\.1:\d+\/api\/void-runner$/.test(line)){clearTimeout(timer);resolve(line);}});
      proc.once('error',e=>{clearTimeout(timer);reject(e);});
      proc.once('exit',code=>{clearTimeout(timer);reject(new Error('local API exited '+code));});
    });
    const hubEvents=[];
    hub=await start({origins:[origin],identify:t=>providers.identify(t),log:(event,...args)=>{
      // Record only transport event names and close codes, never auth tokens or account identifiers.
      if(event==='leave')hubEvents.push('leave:'+args[1]);
      else if(event==='identified')hubEvents.push('identified:'+args[0]);
      else hubEvents.push(event);
    }});
    const hubUrl='ws://127.0.0.1:'+hub.port;
    // A real document origin and TCP listener are required for the Chromium
    // WebSocket upgrade; route.fulfill alone never opened the fixture origin.
    // CSP and the finite HTTP path allowlist keep all browser traffic local.
    fixture=http.createServer(async(req,res)=>{
      const send=(status,contentType,body)=>{
        res.writeHead(status,{'content-type':contentType,'cache-control':'no-store',
          'content-security-policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; connect-src 'self' "+hubUrl+"; style-src 'self' 'unsafe-inline'; img-src 'self' data:"});
        res.end(body);
      };
      try{
        if(req.headers.host!==new URL(origin).host)return send(403,'text/plain','host refused');
        const u=new URL(req.url,origin);
        if(u.origin!==origin)return send(403,'text/plain','origin refused');
        if(req.method==='GET'){
          if(u.pathname==='/')return send(200,'text/html',shell);
          if(u.pathname==='/firebase-auth.js')return send(200,'text/javascript',sdk);
          if(paths.has(u.pathname))return send(200,'text/javascript',fs.readFileSync(path.join(root,u.pathname.slice(1)),'utf8'));
        }
        const isAuth=authPaths.has(u.pathname)&&req.method==='POST';
        const isApi=realApiPaths.has(u.pathname)&&['GET','POST'].includes(req.method);
        if(!isAuth&&!isApi)return send(u.pathname.startsWith('/api/')?503:404,'application/json','{}');
        const headers={'content-type':req.headers['content-type']||'application/json'};
        if(isApi){
          if(!req.headers.authorization?.startsWith('Bearer '))return send(401,'application/json','{}');
          headers.authorization=req.headers.authorization;
        }
        const chunks=[];let length=0;
        for await(const chunk of req){length+=chunk.length;if(length>65536)return send(413,'application/json','{}');chunks.push(chunk);}
        const target=isAuth?authOrigin+u.pathname+u.search:apiBase+u.pathname.slice('/api/void-runner'.length)+u.search;
        const result=await fetch(target,{method:req.method,headers,redirect:'error',body:length?Buffer.concat(chunks):undefined});
        return send(result.status,'application/json',await result.text());
      }catch(e){
        // Never log request bodies, SDK tokens or account identifiers.
        return send(502,'application/json','{}');
      }
    });
    await new Promise((resolve,reject)=>{fixture.once('error',reject);fixture.listen(5188,'127.0.0.1',resolve);});
    assert.equal((await fetch(origin+'/')).status,200,'fixture HTTP listener reachable');
    assert.equal((await fetch('http://127.0.0.1:'+hub.port+'/health')).status,200,'hub HTTP listener reachable');
    browser=await chromium.launch({args:['--no-sandbox','--no-proxy-server']});
    async function session(){
      const ctx=await browser.newContext({serviceWorkers:'block'}),page=await ctx.newPage(),errors=[],apiCalls=[],authCalls=[],socketEvents=[];
      page.on('pageerror',e=>errors.push(e.message));
      // Observe genuine HTTP responses instead of fulfilling the document
      // through Playwright. Block non-loopback HTTP(S) as defense in depth.
      await ctx.route('https://**/*',route=>route.abort());
      await ctx.route(/^http:\/\/(?!127\.0\.0\.1(?::\d+)?\/)/,route=>route.abort());
      page.on('response',response=>{
        const u=new URL(response.url());
        if(u.origin!==origin)return;
        if(authPaths.has(u.pathname))authCalls.push({path:u.pathname,status:response.status()});
        if(realApiPaths.has(u.pathname))apiCalls.push({path:u.pathname,method:response.request().method(),status:response.status()});
      });
      const cdp=await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      cdp.on('Network.webSocketHandshakeResponseReceived',e=>socketEvents.push('handshake HTTP '+e.response.status));
      cdp.on('Network.webSocketFrameError',()=>socketEvents.push('frame error'));
      page.on('websocket',ws=>{
        if(ws.url()!==hubUrl&&ws.url()!==hubUrl+'/'){socketEvents.push('unexpected socket');return;}
        socketEvents.push('socket created');
        ws.on('socketerror',()=>socketEvents.push('socket error'));
        ws.on('close',()=>socketEvents.push('socket closed'));
      });
      await page.goto(origin+'/');
      assert.equal(await page.evaluate(()=>location.origin),origin,'actual loopback document origin');
      await page.waitForFunction(()=>window.VoidAccount?.authStatus==='ready'&&!VoidAccount.user,{},{timeout:30000});
      return {ctx,page,errors,apiCalls,authCalls,socketEvents};
    }
    const A=await session(),B=await session();
    async function register(s,base){
      const email='browser-'+crypto.randomUUID()+'@example.test';
      const uid=await s.page.evaluate(async({email,password})=>{
        const fb=await import('/firebase-auth.js');
        return (await fb.createUserWithEmailAndPassword(fb.auth,email,password)).user.uid;
      },{email,password});
      await s.page.waitForFunction(uid=>VoidAccount.user?.uid===uid&&VoidAccount.profileReady,uid,{timeout:30000});
      assert(s.authCalls.some(x=>x.path.endsWith('/accounts:signUp')&&x.status===200),'real emulator signup must succeed');
      assert.equal(await s.page.evaluate(()=>VoidAccount.character),null);
      const created=await s.page.evaluate(base=>VoidAccount.completeMultiplayerCharacter({base}),base);
      assert.equal(created.created,true);
      assert.equal(created.character.model,base==='female'?'district-resident':'district-smuggler');
      assert(s.apiCalls.some(x=>x.path==='/api/void-runner/character'&&x.method==='POST'&&x.status===201),'real API creation must succeed');
      return {uid,email,model:created.character.model};
    }
    const a=await register(A,'female'),b=await register(B,'male');
    assert.notEqual(a.uid,b.uid);
    async function connect(s,uid){
      await s.page.evaluate(async url=>{
        const token=await VoidAccount.user.getIdToken();
        const socket=new WebSocket(url);
        window.fixtureHub={socket,messages:[],closed:null,failed:false,opened:false};
        socket.addEventListener('message',event=>fixtureHub.messages.push(JSON.parse(event.data)));
        socket.addEventListener('close',event=>fixtureHub.closed=event.code);
        socket.addEventListener('error',()=>{fixtureHub.failed=true;});
        socket.addEventListener('open',()=>{fixtureHub.opened=true;socket.send(JSON.stringify({t:'hello',token,room:'district-interior'}));});
      },hubUrl);
      try{
        await s.page.waitForFunction(()=>fixtureHub.failed||fixtureHub.closed!==null||fixtureHub.messages.some(m=>['welcome','error','refused'].includes(m.t)),null,{timeout:15000});
        assert(await s.page.evaluate(()=>fixtureHub.messages.some(m=>m.t==='welcome')),'real hub must welcome the authenticated browser');
      }catch(e){
        const status=await s.page.evaluate(()=>({opened:fixtureHub.opened,failed:fixtureHub.failed,closed:fixtureHub.closed,types:fixtureHub.messages.map(m=>m.t)}));
        throw new Error('Browser hub handshake failed: '+JSON.stringify({status,socketEvents:s.socketEvents,hubEvents}),{cause:e});
      }
      await s.page.evaluate(()=>fixtureHub.socket.send(JSON.stringify({t:'state',x:10,z:10,yaw:0})));
      // The welcome is sent before first placement; wait for the authoritative
      // server placement before joining the next client and checking its peer list.
      const deadline=Date.now()+5000;
      while(!hub.hub.peers.get(uid)?.placed&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,25));
      assert(hub.hub.peers.get(uid)?.placed,'real hub must place the browser peer');
    }
    await connect(A,a.uid);
    await connect(B,b.uid);
    await A.page.waitForFunction(model=>fixtureHub.messages.some(m=>m.t==='join'&&m.peer.model===model),b.model,{timeout:15000});
    const welcome=await B.page.evaluate(()=>fixtureHub.messages.find(m=>m.t==='welcome'));
    assert(welcome.peers.some(p=>p.model===a.model),'hub sees the character created by the real API');
    assert.equal(hub.hub.peers.size,2);
    // A real SDK logout clears the actual account module; the raw fixture socket
    // is closed explicitly. This does not claim the gameplay reconnect path works.
    await A.page.evaluate(async()=>{fixtureHub.socket.close();const fb=await import('/firebase-auth.js');await fb.signOut(fb.auth);});
    await A.page.waitForFunction(()=>!VoidAccount.user&&!VoidAccount.profileReady&&VoidAccount.character===null,null,{timeout:15000});
    await B.page.waitForFunction(()=>fixtureHub.messages.some(m=>m.t==='leave'),null,{timeout:15000});
    await A.page.evaluate(async({email,password})=>{const fb=await import('/firebase-auth.js');await fb.signInWithEmailAndPassword(fb.auth,email,password);},{email:a.email,password});
    await A.page.waitForFunction(({uid,model})=>VoidAccount.user?.uid===uid&&VoidAccount.profileReady&&VoidAccount.character?.model===model,a,{timeout:30000});
    assert(A.authCalls.some(x=>x.path.endsWith('/accounts:signInWithPassword')&&x.status===200),'real emulator relogin must succeed');
    await A.page.reload();
    await A.page.waitForFunction(({uid,model})=>VoidAccount.user?.uid===uid&&VoidAccount.profileReady&&VoidAccount.character?.model===model,a,{timeout:30000});
    assert.equal(await B.page.evaluate(()=>VoidAccount.character.model),b.model);
    assert.equal(await B.page.evaluate(()=>VoidAccount.user.uid),b.uid);
    assert.equal(await A.page.evaluate(()=>localStorage.getItem('tdd-dev-mp-token')),null);
    assert.equal(await B.page.evaluate(()=>localStorage.getItem('tdd-dev-mp-token')),null);
    assert.deepEqual([...A.errors,...B.errors],[]);
    assert(![...A.socketEvents,...B.socketEvents].includes('unexpected socket'),'only the local test hub may be contacted');
    console.log('BROWSER_ACCOUNT_GATE_OK');
  }finally{
    try{if(browser)await browser.close();}finally{
      try{if(hub)await hub.close();}finally{try{if(fixture?.listening)await new Promise(resolve=>fixture.close(resolve));}finally{lines.close();proc.kill();}}
    }
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
