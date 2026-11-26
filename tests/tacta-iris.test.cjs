const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const exchanges=require('../void-runner/tacta-iris-dialogue.json');

test('every authored Tacta and Iris exchange has distinct playable recordings',()=>{
 const ids=new Set(),stages=new Set(),speakers={tacta:0,iris:0};
 for(const exchange of exchanges){
  stages.add(exchange.stage);
  for(const [i,line] of exchange.lines.entries()){
   assert.equal(line.id,exchange.id+'-'+(i+1));
   assert.ok(!ids.has(line.id));
   ids.add(line.id);
   assert.ok(Object.hasOwn(speakers,line.speaker));
   speakers[line.speaker]++;
   assert.ok(line.text.trim()&&line.delivery.trim()&&line.seconds>0);
   const location=path.join(__dirname,'../void-runner/assets/audio/voice/extra/tacta-iris',line.id+'.mp3');
   assert.ok(fs.statSync(location).size>1000,line.id);
  }
 }
 assert.equal(exchanges.length,29);
 assert.deepEqual(speakers,{tacta:71,iris:59});
 assert.deepEqual(stages,new Set(['arrival','visit','goodbye']));
});
