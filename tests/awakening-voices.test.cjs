// The Awakening's recorded voices (21 Nov 2026): Mission 004's tea-house associates and Fish's two Comms calls (Mandarin with the V1's English over it), Mission 007's
// Juno Vex and the Blackrock associate, Mission 010's initiate. Every line in the owner's script has a clip under the speaker id the game looks it up by.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const R=p=>path.join(__dirname,'..',p);
const MS=require(R('void-runner/main-story.js'));
const X=JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/extra/manifest.json'),'utf8'));
const lines=Object.entries(X.lines);
const find=(who,text)=>lines.filter(([,l])=>l.speaker===who&&l.text===text);
const step=(m,id)=>m.objectives.find(o=>o.id===id);
const ritual=who=>MS.RITUAL.beats.filter(b=>b.act==='line'&&b.who===who&&b.text).map(b=>b.text);
const NOTE=/generic placeholder voice chosen 21 Nov 2026 at the owner's request \('just make generic voices for now'\); the owner may replace it/i;

test('every overheard and initiate line has exactly one clip, a small ogg that exists, with the placeholder note',()=>{
 const want=[...step(MS.M004,'overhear').say,...step(MS.M007,'observe').say,...ritual('initiate').map(text=>({who:'initiate',text}))];
 assert.equal(want.length,6+5+4);
 for(const l of want){const hit=find(l.who,l.text);assert.equal(hit.length,1,l.who+': '+l.text);const [,e]=hit[0];
  assert.match(e.file,/^extra\/[a-z0-9-]+\.ogg$/);const f=R('void-runner/assets/audio/voice/'+e.file);assert.ok(fs.existsSync(f),e.file);const n=fs.statSync(f).size;assert.ok(n>5000&&n<120000,e.file+' '+n);
  assert.match(e.note,l.who==='initiate'?/owner-chosen 21 Nov 2026: ElevenLabs "Brock"/:NOTE);assert.ok(e.voiceId&&e.voice&&e.source,e.file);}
});

test('the four placeholder voices and Halden\'s owner-chosen voice: each speaker keeps one voice id, matching the registry and the editor',()=>{
 const T=require(R('void-runner/mission-trees.js')),j=JSON.parse(fs.readFileSync(R('tools/audio/revoice-engines.json'),'utf8')).characters;
 const ids={'tea-associate-1':'9dOAtmZTvILoncEvsUKb','tea-associate-2':'c1uwEpPUcC16tq1udqxk','juno-vex':'Xm5W2LBUW4LWizr18Fbd','blackrock-associate':'JjqNMa6BEYmyQYRCdHCa','initiate':'UXrpoYalpW5MpGiFHq3z'};
 for(const [who,id] of Object.entries(ids)){assert.deepEqual([...new Set(lines.filter(([,l])=>l.speaker===who).map(([,l])=>l.voiceId))],[id],who);
  assert.equal(j[who].voiceId,id);assert.equal(j[who].engine,'elevenlabs');assert.equal(j[who].model,'eleven_v4');assert.match(j[who].note,who==='initiate'?/Owner-chosen voice, not a placeholder/:/placeholder/i);assert.equal(T.VOICE_ENGINES[who].voice,j[who].voice);}
 assert.equal(j['juno-vex'].voice,'Juno Vex (Everley Rhodes)');assert.equal(j.initiate.voice,'Halden Reyes, the initiate (Brock)');
 // the approved voices are untouched
 assert.equal(j['milked-fish'].voiceId,'ggacvEjbmpoSuEinfFWs');assert.equal(j['robed-1'].voiceId,'SO9JediIwzugrikv7xw0');
});

test('Fish, Mission 004: each English call line has its English clip, linked from her Mandarin clip, in her approved voice',()=>{
 const en=[...MS.FISH_CALL,...step(MS.M004,'report').say.map(l=>l.text)];assert.equal(en.length,10);
 assert.deepEqual(MS.M004.start.text.split('\n'),MS.FISH_CALL,'the call text stays the owner\'s English');
 en.forEach((text,i)=>{const n=i+1,E=X.lines['fish-m004-en-'+n],Z=X.lines['fish-m004-zh-'+n];
  assert.ok(E&&Z,'pair '+n);assert.equal(E.speaker,'milked-fish');assert.equal(Z.speaker,'milked-fish');assert.equal(E.text,text);
  assert.match(Z.text,/[一-鿿]/,'Mandarin '+n);assert.deepEqual(Z.with,{id:'fish-m004-en-'+n});assert.equal(E.voiceId,'ggacvEjbmpoSuEinfFWs');assert.equal(Z.voiceId,'ggacvEjbmpoSuEinfFWs');
  for(const e of [E,Z])assert.ok(fs.statSync(R('void-runner/assets/audio/voice/'+e.file)).size<150000);});
 assert.ok(X.translations['milked-fish'].offset>0,'the translator\'s offset setting is the per-speaker one');
});

test('voice-clips.js: a translation\'s words said by the same speaker play the original with the translation over it',()=>{
 const src=fs.readFileSync(R('void-runner/voice-clips.js'),'utf8');
 assert.match(src,/lookup\.set\(e\.speaker\+'\|'\+w\.text,\{\.\.\.e,shown:w\.text\}\)/);
 assert.match(src,/function foreign\(who,text\)/);assert.match(src,/function duration\(who,text\)/);assert.match(src,/get now\(\)\{return now;\}/);
});

test('a Comms call with lines recorded one by one plays them in turn and shows the original with V1 TRANSLATION',()=>{
 const src=fs.readFileSync(R('void-runner/personal-device.js'),'utf8');
 assert.match(src,/call\.voice=callVoicePlan\(call,fresh\.text\)/);assert.match(src,/function callVoiceTick\(\)/);
 assert.match(src,/V1 TRANSLATION<\/b>'\+esc\(l\)/);assert.match(src,/root\.VoidAudio\?\.speak\?\.\(c\.who,l\)/);
 // a call recorded as one clip (Admin's Mission 001 call) is not split
 assert.match(src,/V\.has\(c\.who,String\(text\)\)\)return null/);
});

test('overheard lines and the camera feed speak through the game voice channel',()=>{
 const g=fs.readFileSync(R('void-runner/mission-mechanics-game.js'),'utf8');assert.match(g,/voiceHeard\(x\.key,r\.show,lines\[r\.show\]\)/);assert.match(g,/secs:i=>heardSecs\(lines\[i\]\)/);
 const f=fs.readFileSync(R('void-runner/camera-feed.js'),'utf8');assert.match(f,/root\.VoidAudio\.speak\(e\.who,vt\)/);assert.match(f,/const vt=CR\(\)\.voiceText\?CR\(\)\.voiceText\(e\):e\.text;if\(!vt\)continue;/);
});

test('Mission 007: Juno Vex is a woman\'s model, the Blackrock associate a man\'s (arena and street), positions kept',()=>{
 const c=id=>MS.M007.cast.find(x=>x.id===id);
 assert.equal(c('juno-vex').model,'npc-cyber-exec');assert.equal(c('blackrock-associate').model,'npc-fixer');assert.equal(c('associate-street').model,'npc-fixer');
 assert.deepEqual([c('juno-vex').x,c('juno-vex').z,c('blackrock-associate').x,c('blackrock-associate').z],[-16.6,-141.4,-15.4,-141.4]);
});

