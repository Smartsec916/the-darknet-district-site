// Zen Zephyr's conversation (the owner's approved, voiced script, 18 Nov 2026): exact text, five topics, a recording for every line, random quotes without
// immediate repeats, the follow-up after each quote, "Yes" to leave, the greeting once per visit, his sight line, and his live voice effect.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const Z=require(R('void-runner/zen-chat.js')),T=require(R('void-runner/temple.js')),I=require(R('tools/audio/zen-import.cjs'));
const script=JSON.parse(fs.readFileSync(R('tools/audio/zen-zephyr-script.json'),'utf8'));
const extra=JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/extra/manifest.json'),'utf8'));
const seeded=(n=1)=>()=>{n=(n*16807)%2147483647;return (n-1)/2147483646;};
test('the game carries the owner\'s script word for word (greeting, follow-up, five topics with label, subtitle and every line, in order)',()=>{
 assert.equal(Z.SCRIPT.greeting,script.greeting);assert.equal(Z.SCRIPT.followUp,script.followUp);
 assert.deepEqual(Z.SCRIPT.topics,script.topics.map(t=>({id:t.id,label:t.label,sub:t.sub,lines:t.lines})));
 assert.equal(Z.SCRIPT.topics.length,5);assert.deepEqual(Z.SCRIPT.topics.map(t=>t.id),['tech','desire','peace','death','rebellion']);
 assert.equal(Z.choiceLabel(Z.SCRIPT.topics[0]),'Enlightenment & Technology — Finding humanity beneath the chrome.');
 const b=I.build();assert.equal(b.chatOut,b.chat,'zen-chat.js is up to date with the script (node tools/audio/zen-import.cjs)');
});
test('every line has its recording registered by speaker and exact text, and the clip file is present',()=>{
 const want=Z.voiced();assert.equal(want.length,2+script.topics.reduce((n,t)=>n+t.lines.length,0));
 const mine=Object.entries(extra.lines).filter(([,l])=>l.speaker==='zen-zephyr');assert.equal(mine.length,want.length,'no stale or missing entries');
 for(const [key,text] of want){const e=extra.lines['zen-'+key];assert.ok(e,key);assert.equal(e.speaker,'zen-zephyr');assert.equal(e.text,text,key);assert.equal(e.file,'extra/zen-'+key+'.ogg');assert.equal(e.voiceId,'bAq8AI9QURijOtmeFFqT');assert.match(e.voice,/Sigma Centauri/);
  assert.ok(fs.existsSync(R('void-runner/assets/audio/voice/'+e.file)),'clip '+e.file);}
 assert.equal(new Set(want.map(([,t])=>t)).size,want.length,'every line is unique, so speaker+text finds one clip');
 assert.equal(fs.readFileSync(R('void-runner/assets/audio/voice/extra/manifest.json'),'utf8'),I.build().manifestText,'the manifest matches the script');
 assert.deepEqual(extra.cast['zen-zephyr'],{effect:'monk'});
 const eng=JSON.parse(fs.readFileSync(R('tools/audio/revoice-engines.json'),'utf8')).characters['zen-zephyr'];assert.equal(eng.engine,'elevenlabs');assert.equal(eng.voiceId,'bAq8AI9QURijOtmeFFqT');
});
test('the conversation opens with the greeting and the five choices plus a way out; a choice gives one of its quotes, then the follow-up, then the choices again and "Yes"',()=>{
 const c=Z.create({random:seeded(7)}),o=c.open();
 assert.deepEqual(o.lines,[{who:'zen-zephyr',text:script.greeting}]);assert.deepEqual(o.choices.filter(x=>!x.leave).map(x=>x.label),script.topics.map(t=>t.label+' — '+t.sub));
 assert.equal(o.choices.filter(x=>x.leave).length,1);
 for(const t of script.topics){const r=c.pick(t.id);assert.equal(r.lines.length,2);assert.ok(t.lines.includes(r.lines[0].text),t.id);assert.equal(r.lines[1].text,script.followUp);assert.ok(r.lines.every(l=>l.who==='zen-zephyr'));
  assert.deepEqual(r.choices.map(x=>x.id),[...script.topics.map(x=>x.id),'leave']);assert.equal(r.choices.at(-1).label,'Yes');assert.equal(r.choices.at(-1).leave,true);}
 assert.equal(c.pick('nonsense'),null);
});
test('quotes are random, never the same twice in a row, and none repeats until the category is used up',()=>{
 for(const seed of [1,2,5,99,12345]){const c=Z.create({random:seeded(seed)});
 for(const t of script.topics){const said=[];for(let i=0;i<t.lines.length*3+1;i++)said.push(c.pick(t.id).lines[0].text);
  for(let i=1;i<said.length;i++)assert.notEqual(said[i],said[i-1],t.id+' repeated at '+i);
  assert.equal(new Set(said.slice(0,t.lines.length)).size,t.lines.length,t.id+': every line once before any repeats');}}
 const orders=new Set([1,2,3,4].map(s=>{const k=Z.create({random:seeded(s)});return [0,1,2].map(()=>k.pick('tech').lines[0].text).join('|');}));assert.ok(orders.size>1,'the order is random');
});
test('the greeting plays once per visit, at a distance, in his sight; E later shows his question without saying it again',()=>{
 const c=Z.create();assert.ok(Z.GREET_RANGE>=12&&Z.GREET_RANGE<=15&&Z.TALK_RANGE<Z.GREET_RANGE);
 assert.equal(c.shouldGreet(Z.GREET_RANGE+1,true),false,'too far');assert.equal(c.shouldGreet(Z.GREET_RANGE-1,false),false,'out of sight');assert.equal(c.shouldGreet(Z.GREET_RANGE-1,true),true);
 assert.deepEqual(c.greet(),[{who:'zen-zephyr',text:script.greeting}]);assert.equal(c.shouldGreet(3,true),false,'not again this visit');
 assert.equal(c.open().lines[0].silent,true,'opening after the greeting does not re-speak it');assert.equal(c.open().lines[0].silent,true);
 c.visit();assert.equal(c.shouldGreet(10,true),true,'a new visit greets again');
 const d=Z.create();assert.ok(!d.open().lines[0].silent,'reaching him without the greeting: it plays first');assert.equal(d.shouldGreet(5,true),false);
});
test('he sees the player across the hall but not from outside it or from behind a pillar',()=>{
 assert.equal(T.seesMonk(0,10),true);assert.equal(T.seesMonk(-11,8),true);assert.equal(T.seesMonk(0,-10),false,'outside the hall');assert.equal(T.seesMonk(11,0),false,'behind a pillar');
});
test('the placeholder chat is gone: no keyword matching, no typed panel, no provider hook',()=>{
 const src=fs.readFileSync(R('void-runner/zen-chat.js'),'utf8'),wire=fs.readFileSync(R('void-runner/temple-integration.js'),'utf8');
 for(const gone of ['QUOTES','TOPICS','registerProvider','FALLBACKS'])assert.ok(!src.includes(gone),gone);assert.ok(!/zen-chat'|#zen-log|<input/.test(wire),'no typed chat panel');
 assert.ok(wire.includes('talkChoice')&&wire.includes('menu:true'),'the ordinary conversation window and its choice list');
});
test('his live voice effect: a named, tunable "monk" preset (the owner: more digital), applied only to him',()=>{
 const V=require(R('void-runner/voice-clips.js')),M=V.PRESETS.monk;assert.ok(M&&V.PRESETS.android);
 assert.equal(M.strength,V.ZEN_STRENGTH);assert.equal(M.highpassHz,90);assert.equal(M.crushBits,10);assert.equal(M.crushMix,.25);assert.equal(M.flangerMs,2);assert.equal(M.flangerDepthMs,1.5);assert.equal(M.flangerFeedback,.2);assert.equal(M.flangerHz,.25);assert.equal(M.echoMs,18);assert.equal(M.echoDecay,.18);
 assert.ok(M.crushMix+M.echoDecay>V.PRESETS.android.combMix+V.PRESETS.android.chorusMix,'more digital than Iris\'s faint android colour');
 const src=fs.readFileSync(R('void-runner/voice-clips.js'),'utf8');assert.match(src,/name==='monk'\?monk\(/);
});
