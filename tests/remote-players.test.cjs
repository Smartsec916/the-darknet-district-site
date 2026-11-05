const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('../void-runner/remote-players.js');
const store=(o={})=>({getItem:k=>k in o?o[k]:null});
const live=(search='',h='thedarknetdistrict.com',protocol='https:')=>({hostname:h,search,protocol});

const HUB='wss://district-hub.onrender.com';
test('nothing is shown or enabled on the live site while no hub is configured (the shipped state)',()=>{
 assert.equal(R.LIVE_HUB,'','LIVE_HUB ships empty: setting it is a deliberate, reviewed change');
 for(const h of ['thedarknetdistrict.com','www.thedarknetdistrict.com'])for(const st of [store(),store({'tdd-multiplayer':'1','tdd-hub':HUB})]){
  assert.equal(R.available(live('',h)),false,h);assert.equal(R.allowed(live('?multiplayer=1&hub='+HUB,h),st),false,h);assert.equal(R.hubUrl(live('?hub='+HUB,h),st),'',h);}
});
test('with a hub configured, the option appears live and only the tester\'s own button enables it; no link can',()=>{
 for(const h of ['thedarknetdistrict.com','www.thedarknetdistrict.com']){
  assert.equal(R.available(live('',h),HUB),true);
  assert.equal(R.allowed(live('',h),store(),HUB),false,'off until the tester presses the button');
  assert.equal(R.allowed(live('?multiplayer=1&hub=wss://evil.onrender.com',h),store(),HUB),false,'an address never enables it');
  assert.equal(R.allowed(live('',h),store({'tdd-multiplayer':'1'}),HUB),true,'the button\'s stored choice does');
  assert.equal(R.hubUrl(live('?hub=wss://evil.onrender.com',h),store({'tdd-hub':'wss://evil.onrender.com'}),HUB),HUB,'the hub is the configured one, never an address or a stored value');}
 assert.equal(R.available(live('','thedarknetdistrict.com','http:'),HUB),false,'only over https');
 for(const h of ['thedarknetdistrict.com.evil.example','evil-thedarknetdistrict.com','localhost.evil.com','127.0.0.1.evil.com'])assert.equal(R.available(live('?multiplayer=1',h),HUB),false,h);
 for(const bad of ['wss://evil.example','ws://district-hub.onrender.com','wss://district-hub.onrender.com.evil.example','wss://district-hub.onrender.com/x','wss://a.b.onrender.com','https://district-hub.onrender.com',''])assert.equal(R.available(live(),bad),false,'configured hub '+bad);
});
test('local pages: the option is always there, the address or flag enables it, and only a local hub is accepted',()=>{
 const l=(q,h='127.0.0.1')=>live(q,h,'http:');
 assert.equal(R.available(l('')),true);assert.equal(R.allowed(l(''),store()),false);assert.equal(R.allowed(l('?multiplayer=1'),store()),true);assert.equal(R.allowed(l('','localhost'),store({'tdd-multiplayer':'1'})),true);
 assert.equal(R.hubUrl(l(''),store()),'ws://127.0.0.1:8787');assert.equal(R.hubUrl(l('?hub=ws://127.0.0.1:9000'),store()),'ws://127.0.0.1:9000');
 assert.equal(R.hubUrl(l('?hub=wss://hub.example.com'),store()),'ws://127.0.0.1:8787');assert.equal(R.hubUrl(l('?hub=ws://127.0.0.1.evil.com:80'),store()),'ws://127.0.0.1:8787');
});
test('every status has plain words for the Settings line',()=>{
 for(const st of ['off','in','connecting','waking the server','sign in to join','not on the test list','sign-in not accepted','replaced by another session','server restarting','offline','no hub configured','refused: x'])assert(R.words(st,true).length>=4,st);
 assert.match(R.words('off',false),/Sign in/);assert.doesNotMatch(R.words('off',true),/Sign in/);
});
test('names are shown as plain, safe text',()=>{
 assert.equal(R.clean('Neon_Fox'),'Neon_Fox');assert.equal(R.clean('Guest-1a2b'),'Guest-1a2b');
 for(const bad of ['<img src=x>','a','x'.repeat(40),'with space','Admin‮',null,{},7])assert.equal(R.clean(bad),'Guest');
});
test('the client never sends an identity, model or name, and does not touch saves, NPCs or other areas',()=>{
 const code=fs.readFileSync('void-runner/remote-players.js','utf8');
 const sent=[...code.matchAll(/send\(JSON\.stringify\((\{.*?\})\)\)/g)].map(m=>m[1]).join(' ');
 assert.match(sent,/t:'hello'/);assert.match(sent,/t:'state'/);assert.doesNotMatch(sent,/uid|model|name|character|account|handle/i);
 assert.doesNotMatch(code.replace(/setFlag=v=>\{[^\n]*\n/,''),/\bsave\(|localStorage\.setItem|VoidCrowd\.(casts|staff|clips)\s*=|districtCrew|ncz-nightlife|VoidVR|VoidFlight|innerHTML/);
 assert.match(code,/walkingLocation\.area==='interior'/,'only the District interior');
 assert.match(code,/if\(!inRoom\(\)\)\{if\(ws\|\|peers\.size\|\|retryTimer\)disconnect\(\)/,'anywhere else: no connection at all');
 assert.match(code,/const LIVE_HUB='';/,'the live hub ships empty');
});
test('the script is a game script: a phone never downloads it, and it ships once, in both copies of the page',()=>{
 const html=fs.readFileSync('void-runner.html','utf8');
 assert.match(html,/<script type="text\/tdd-game" src="void-runner\/remote-players\.js"><\/script>/,'inert until the device gate releases it');
 assert.doesNotMatch(html,/<script src="void-runner\/remote-players\.js"/);
 assert.equal((html.match(/remote-players\.js/g)||[]).length,1);assert.equal(fs.readFileSync('static/void-runner.html','utf8'),html);
});
