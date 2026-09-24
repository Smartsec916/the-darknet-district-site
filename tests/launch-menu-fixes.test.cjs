const test=require('node:test'),assert=require('node:assert/strict');
const Audio=require('../void-runner/ship-audio.js');
test('character matching is independent of voice order and prefers natural matching voices',()=>{
 const pool=[{name:'Microsoft David',voiceURI:'d'},{name:'Microsoft Zira',voiceURI:'z'},{name:'Microsoft Sonia Natural',voiceURI:'s'}];
 assert.equal(Audio.selectVoice('mara',pool).voiceURI,'s');
 assert.equal(Audio.selectVoice('mara',pool.reverse()).voiceURI,'s');
 assert.equal(Audio.selectVoice('elias',pool).voiceURI,'d');
 assert.equal(Audio.selectVoice('mara',[pool.find(v=>v.voiceURI==='d')]),null);
});
test('explicit character voice choices override automatic matching and can be reset',()=>{
 const pool=[{name:'Custom voice',voiceURI:'custom'},{name:'Microsoft Zira',voiceURI:'zira'}];
 Audio.chooseVoice('mara','custom');assert.equal(Audio.selectVoice('mara',pool).voiceURI,'custom');
 Audio.chooseVoice('mara','');assert.equal(Audio.selectVoice('mara',pool).voiceURI,'zira');
});
