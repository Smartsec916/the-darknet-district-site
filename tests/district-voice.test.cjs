/* Proximity voice rules (void-runner/district-voice.js) and the promises the feature makes. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const V=require('../void-runner/district-voice.js');
test('a voice is full up close, fades with distance, and is gone far away',()=>{
 assert.equal(V.loudness(0),1);assert.equal(V.loudness(2),1);assert(V.loudness(8)<1&&V.loudness(8)>V.loudness(16)&&V.loudness(16)>V.loudness(28));assert.equal(V.loudness(40),0);assert.equal(V.loudness(NaN),0);
});
test('a wall muffles and quietens; your mute, a player\'s volume and the master volume all apply',()=>{
 const open=V.mix({dist:5}),wall=V.mix({dist:5,blocked:true});assert(wall.gain<open.gain*.3);assert(wall.hz<2000&&open.hz>10000);
 assert.equal(V.mix({dist:1,muted:true}).gain,0);assert(V.mix({dist:1,vol:.5}).gain<V.mix({dist:1}).gain);assert.equal(V.mix({dist:1,vol:1,master:0}).gain,0);assert(V.mix({dist:1,vol:99}).gain<=2*1.5);
});
test('voice never starts by itself: a stored "enabled" is ignored; settings are cleaned',()=>{
 const s=V.cleanSettings({enabled:true,mode:'open',pttKey:'KeyG',muted:true,volume:9,mic:'abc',players:{'0123456789ab':{vol:5,muted:true},'bad id':{vol:1}},extra:'x'});
 assert.equal(s.enabled,false);assert.equal(s.mode,'open');assert.equal(s.pttKey,'KeyG');assert.equal(s.muted,true);assert.equal(s.volume,1.5);assert.deepEqual(s.players,{'0123456789ab':{vol:2,muted:true}});assert(!('extra' in s));
 assert.equal(V.cleanSettings({pttKey:'Escape'}).pttKey,'KeyV');assert.equal(V.cleanSettings(null).enabled,false);assert.equal(V.DEFAULTS.enabled,false);assert.equal(V.DEFAULTS.mode,'ptt');
});
test('the client asks for a microphone only, holds no secret, and the library is loaded only when voice is switched on',()=>{
 const src=fs.readFileSync('void-runner/district-voice.js','utf8'),code=src.replace(/\/\*[\s\S]*?\*\//g,'');
 assert.doesNotMatch(code,/setCameraEnabled|setScreenShareEnabled|getDisplayMedia|video:\s*true/);assert.doesNotMatch(code,/API_SECRET|apiSecret|MediaRecorder|SpeechRecognition/);
 assert.match(code,/echoCancellation:true,noiseSuppression:true,autoGainControl:true/);assert.match(code,/o\.enabled=false;/);
 const html=fs.readFileSync('void-runner.html','utf8');assert(html.includes('void-runner/district-voice.js'));assert(!html.includes('livekit-client'),'the voice library is not loaded with the page');
 assert(fs.existsSync('void-runner/vendor/livekit-client-2.24.1.umd.js'));
 for(const f of ['void-runner/district-voice.js','void-runner/remote-players.js','void-runner/personal-device.js'])assert.doesNotMatch(fs.readFileSync(f,'utf8'),/LIVEKIT_API_SECRET|livekit\.cloud/,f+' names no server or secret');
});
