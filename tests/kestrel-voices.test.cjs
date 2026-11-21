/* Mission 012 (First Cargo Delivery) and Rook's side-mission lines are recorded (ElevenLabs, 21 Nov 2026): every line has its clip in extra/manifest.json,
   keyed by speaker + exact text, so a word changed without a new recording fails here. Iris's Comms calls play line by line (personal-device.js callVoicePlan). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const R=p=>path.join(__dirname,'..',p);
const M=require(R('void-runner/main-story.js')),RC=require(R('void-runner/rook-cargo-jobs.js'));
const lines=JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/extra/manifest.json'),'utf8')).lines;
const clip=(who,text)=>Object.entries(lines).find(([,l])=>l.speaker===who&&l.text===text);
const check=(who,text)=>{const c=clip(who,text);assert.ok(c,'no clip for '+who+': '+text);const [id,l]=c;assert.equal(l.file,'extra/'+id+'.ogg');assert.match(l.file,/^extra\/[a-z0-9-]+\.ogg$/);
 const f=R('void-runner/assets/audio/voice/'+l.file);assert.ok(fs.statSync(f).size>1000,id+' is a real clip');assert.equal(fs.readFileSync(f).subarray(0,4).toString('latin1'),'OggS',id+' is ogg');assert.match(l.note,/owner-approved 21 Nov 2026/);
 assert.equal(l.voiceId,who==='iris'?'CvD6hF1BJzAFN428j1cO':'wzVFxVZCBIi6KBxNhQDI');return id;};
test('every Iris line of Mission 012 (the owner\'s and the approved ones) and Rook\'s two has a clip',()=>{
 for(const t of Object.values(M.IRIS_OK))check('iris',t);
 for(const [k,t] of Object.entries(M.CARGO_LINES))check(k.startsWith('rook')?'rook':'iris',t);
 for(const o of M.M012.objectives)for(const l of o.say||[])check(l.who,l.text);});
test('Rook\'s side-mission lines (coordinates, board) have clips',()=>{check('rook',RC.lines.coordinates);check('rook',RC.lines.board);});
test('the start call (congrats + walk) splits into two recorded lines, played one by one (no single clip for the joined text)',()=>{
 const text=M.M012.start.text,parts=text.split('\n').map(x=>x.trim()).filter(Boolean);assert.equal(M.M012.start.from,'iris');
 assert.deepEqual(parts,[M.IRIS_OK.congrats,M.IRIS_OK.walk]);assert.deepEqual(parts.map(p=>check('iris',p)),['iris-m012-congrats','iris-m012-walk']);
 assert.equal(clip('iris',text),undefined,'no joined clip: callVoicePlan plays the lines one by one');
 // a step's Comms call is its lines joined the same way (mission-content.js stepMessage): no line may contain a line break
 for(const o of M.M012.objectives)for(const l of o.say||[])assert.ok(!/\n/.test(l.text));});
