const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('../void-runner/remote-players.js');
const store=v=>({getItem:k=>k==='tdd-multiplayer'?v:null});
test('remote players are local development only',()=>{
 assert.equal(R.allowed({hostname:'thedarknetdistrict.com',search:'?multiplayer=1'},store('1')),false,'never on the live site');
 assert.equal(R.allowed({hostname:'localhost.evil.com',search:'?multiplayer=1'},store('1')),false);
 assert.equal(R.allowed({hostname:'127.0.0.1',search:''},store(null)),false,'local but not asked for');
 assert.equal(R.allowed({hostname:'127.0.0.1',search:'?multiplayer=1'},store(null)),true);
 assert.equal(R.allowed({hostname:'localhost',search:''},store('1')),true);
});
test('the hub address can only be a local one',()=>{
 const l=q=>({search:q}),st={getItem:()=>null};
 assert.equal(R.hubUrl(l(''),st),'ws://127.0.0.1:8787');
 assert.equal(R.hubUrl(l('?hub=ws://127.0.0.1:9000'),st),'ws://127.0.0.1:9000');
 assert.equal(R.hubUrl(l('?hub=wss://hub.example.com'),st),'ws://127.0.0.1:8787');
 assert.equal(R.hubUrl(l('?hub=ws://127.0.0.1.evil.com:80'),st),'ws://127.0.0.1:8787');
});
test('the client never sends an identity, model or name, and does not touch saves or NPCs',()=>{
 const code=fs.readFileSync('void-runner/remote-players.js','utf8');
 const sent=[...code.matchAll(/send\(JSON\.stringify\((\{.*?\})\)\)/g)].map(m=>m[1]).join(' ');
 assert.match(sent,/t:'hello'/);assert.match(sent,/t:'state'/);assert.doesNotMatch(sent,/uid|model|name|character|account/i);
 assert.doesNotMatch(code,/\bsave\(|localStorage\.setItem|VoidCrowd\.(casts|staff|clips)\s*=|districtCrew|ncz-nightlife|VoidVR/);
 const html=fs.readFileSync('void-runner.html','utf8');assert.equal((html.match(/remote-players\.js/g)||[]).length,1);assert.equal(fs.readFileSync('static/void-runner.html','utf8'),html);
});
