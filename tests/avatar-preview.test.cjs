const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../void-runner/avatar-preview.js');
test('avatar preview is local development only',()=>{
 const store=v=>({getItem:()=>v});
 assert.equal(A.allowed({hostname:'thedarknetdistrict.com',search:'?avatar-preview=1'},store('1')),false,'never on the live site');
 assert.equal(A.allowed({hostname:'www.thedarknetdistrict.com',search:'?avatar-preview=1'},store('1')),false);
 assert.equal(A.allowed({hostname:'localhost.evil.com',search:'?avatar-preview=1'},store(null)),false);
 assert.equal(A.allowed({hostname:'127.0.0.1',search:''},store(null)),false,'local but not asked for');
 assert.equal(A.allowed({hostname:'127.0.0.1',search:'?avatar-preview=1'},store(null)),true);
 assert.equal(A.allowed({hostname:'localhost',search:''},store('1')),true);
 assert.deepEqual(A.MODELS,['district-smuggler','district-resident','admin']);
});
test('avatar preview is wired as one extra script and touches no NPC code',()=>{
 const html=fs.readFileSync('void-runner.html','utf8'),code=fs.readFileSync('void-runner/avatar-preview.js','utf8');
 assert.equal((html.match(/avatar-preview\.js/g)||[]).length,1);
 assert.equal(fs.readFileSync('static/void-runner.html','utf8'),html);
 assert.doesNotMatch(code,/VoidCrowd\.(casts|staff|clips)\s*=|\.pick\s*=|districtCrew|ncz-nightlife/);
});
