// The voice summary at the top of an NPC's page, the EL badge in the NPC list and the giver card's model (the owner, 19 Nov 2026).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const V=require('../void-runner/npc-voices.js');
const ROOT=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const engines=JSON.parse(read('tools/audio/revoice-engines.json')).characters;
test('Lace, Reverie and Dax show their chosen ElevenLabs voice, model and link from the voice file',()=>{
 for(const [who,id,nm] of [['ethereal-lace','KR1TkIhkSykEjI4B0DtH','Lace'],['grey-reverie','n7Wi4g1bhpw4Bs8HK5ph','Reverie'],['dax','3WOiQKby7odOR8Z57fNQ','Dax']]){
  const s=V.summary(V.current(who,{engines}));
  assert.equal(s.kind,'elevenlabs');assert.equal(s.badge,'EL');assert.equal(s.url,'https://elevenlabs.io/voices/'+id);assert.equal(s.from,'file');
  assert.equal(s.modelLabel,'Eleven v4');assert.match(s.text,new RegExp('^ElevenLabs — the voice chosen for '+nm+' on 19 Nov 2026 \\(Eleven v4\\)$'));assert.match(s.fromText,/voice file/);}
});
test('a draft choice wins and says so; its model is shown',()=>{
 const voices={'ethereal-lace':{engine:'elevenlabs',voiceId:'AbCdEfGhIjKlMnOpQrSt',name:'Quiet vendor',chosen:'2026-11-19 by the owner',model:'eleven_multilingual_v2'}};
 const s=V.summary(V.current('ethereal-lace',{engines,voices}));
 assert.equal(s.text,'ElevenLabs — Quiet vendor (Multilingual v2)');assert.equal(s.from,'editor');assert.match(s.fromText,/draft/);assert.equal(s.url,'https://elevenlabs.io/voices/AbCdEfGhIjKlMnOpQrSt');
});
test('Kokoro and no voice',()=>{
 const registry={npcs:{bob:{voice:'am_santa',status:'approved'}}};
 assert.deepEqual(V.summary(V.current('bob',{registry})),{kind:'kokoro',text:'free local voice am_santa (locked)',badge:'K'});
 assert.equal(V.summary(V.current('nobody',{})).text,'none yet — choose one in Lines & voice');assert.equal(V.summary(null).kind,'none');
});
test('the editors use the summary: About section, list badge, giver card model; links open a new tab with noopener',()=>{
 const me=read('void-runner/mission-editor.js'),ne=read('void-runner/npc-editor.js');
 assert.match(me,/function voiceSummary\(id\)/);assert.match(me,/voiceNow,voiceSummary,/);assert.match(me,/'LISTEN ON ELEVENLABS ↗','me-link',\{href:s\.url,target:'_blank',rel:'noopener noreferrer'/);
 assert.match(me,/X\.modelLabel\(cur\.model\)/);
 assert.match(ne,/facts\.append\(S\(\)\.voiceSummary\(e\.id\)\)/);assert.match(ne,/'data-npc-voice-badge':x\.id/);
});
