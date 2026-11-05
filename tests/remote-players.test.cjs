const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('../void-runner/remote-players.js');
const store=(o={})=>({getItem:k=>k in o?o[k]:null});
const live=(search='',h='thedarknetdistrict.com',protocol='https:')=>({hostname:h,search,protocol});

test('remote players are off by default everywhere, and a link can never switch them on live',()=>{
 for(const h of ['thedarknetdistrict.com','www.thedarknetdistrict.com','127.0.0.1','localhost'])assert.equal(R.allowed(live('',h),store()),false,h+' with nothing set');
 assert.equal(R.allowed(live('?multiplayer=1&hub=wss://x.onrender.com'),store()),false,'an address alone never enables it on the live site');
 assert.equal(R.allowed(live('?multiplayer=1','www.thedarknetdistrict.com'),store()),false);
 assert.equal(R.allowed(live('','thedarknetdistrict.com'),store({'tdd-multiplayer':'1'})),true,'the tester\'s own local flag does');
 assert.equal(R.allowed(live('','thedarknetdistrict.com','http:'),store({'tdd-multiplayer':'1'})),false,'only over https');
 for(const h of ['thedarknetdistrict.com.evil.example','evil-thedarknetdistrict.com','localhost.evil.com','127.0.0.1.evil.com'])assert.equal(R.allowed(live('?multiplayer=1',h),store({'tdd-multiplayer':'1'})),false,h);
 assert.equal(R.allowed(live('?multiplayer=1','127.0.0.1','http:'),store()),true,'local development: the address is enough');
 assert.equal(R.allowed(live('','localhost','http:'),store({'tdd-multiplayer':'1'})),true);
});
test('the hub address cannot be redirected: live pages use only the tester\'s stored onrender.com hub; local pages only a local one',()=>{
 const own=(u)=>store({'tdd-hub':u});
 assert.equal(R.hubUrl(live(),own('wss://district-hub.onrender.com')),'wss://district-hub.onrender.com');
 assert.equal(R.hubUrl(live('?hub=wss://evil.example'),store()),'','the address bar is ignored on the live site');
 assert.equal(R.hubUrl(live('?hub=wss://evil.onrender.com'),store()),'');
 for(const bad of ['wss://evil.example','ws://district-hub.onrender.com','wss://district-hub.onrender.com.evil.example','wss://district-hub.onrender.com/x','wss://a.b.onrender.com','https://district-hub.onrender.com'])assert.equal(R.hubUrl(live(),own(bad)),'',bad);
 const l=(q)=>live(q,'127.0.0.1','http:');
 assert.equal(R.hubUrl(l(''),store()),'ws://127.0.0.1:8787');assert.equal(R.hubUrl(l('?hub=ws://127.0.0.1:9000'),store()),'ws://127.0.0.1:9000');
 assert.equal(R.hubUrl(l('?hub=wss://hub.example.com'),store()),'ws://127.0.0.1:8787');assert.equal(R.hubUrl(l('?hub=ws://127.0.0.1.evil.com:80'),store()),'ws://127.0.0.1:8787');
});
test('names are shown as plain, safe text',()=>{
 assert.equal(R.clean('Neon_Fox'),'Neon_Fox');assert.equal(R.clean('Guest-1a2b'),'Guest-1a2b');
 for(const bad of ['<img src=x>','a','x'.repeat(40),'with space','Admin‮',null,{},7])assert.equal(R.clean(bad),'Guest');
});
test('the client never sends an identity, model or name, and does not touch saves, NPCs or other areas',()=>{
 const code=fs.readFileSync('void-runner/remote-players.js','utf8');
 const sent=[...code.matchAll(/send\(JSON\.stringify\((\{.*?\})\)\)/g)].map(m=>m[1]).join(' ');
 assert.match(sent,/t:'hello'/);assert.match(sent,/t:'state'/);assert.doesNotMatch(sent,/uid|model|name|character|account|handle/i);
 assert.doesNotMatch(code,/\bsave\(|localStorage\.setItem|VoidCrowd\.(casts|staff|clips)\s*=|districtCrew|ncz-nightlife|VoidVR|VoidFlight|innerHTML/);
 assert.match(code,/walkingLocation\.area==='interior'/,'only the District interior');
 assert.match(code,/if\(!inRoom\(\)\)\{if\(ws\|\|peers\.size\|\|retryTimer\)disconnect\(\)/,'anywhere else: no connection at all');
});
test('the script is a game script: a phone never downloads it, and it ships once, in both copies of the page',()=>{
 const html=fs.readFileSync('void-runner.html','utf8');
 assert.match(html,/<script type="text\/tdd-game" src="void-runner\/remote-players\.js"><\/script>/,'inert until the device gate releases it');
 assert.doesNotMatch(html,/<script src="void-runner\/remote-players\.js"/);
 assert.equal((html.match(/remote-players\.js/g)||[]).length,1);assert.equal(fs.readFileSync('static/void-runner.html','utf8'),html);
});
