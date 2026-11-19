/* ElevenLabs voice choices from Developer Tools (queue item 0b, 18 Nov 2026): parsing a pasted link or ID (npc-voices.js), refusals (reserved slot, broadcast voices,
   The Function), the estimate, the revoice-engines.json export, the content shape (mission-content.js), the editor's line engine (mission-trees.js), the page order,
   the server's copy of the rules, and that nothing in the editor can generate audio or hold an API key. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const V=()=>{fresh();return require(R('void-runner/npc-voices.js'));};
const reg=()=>JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8'));
const ID='AbCdEfGhIjKlMnOpQrSt',ok={engine:'elevenlabs',voiceId:ID,name:'Gravel vendor',chosen:'2026-11-18 by the owner'};

test('a pasted ElevenLabs link or a bare voice id gives the 20-character id; anything else says why in plain words',()=>{const X=V();
 for(const s of [ID,' '+ID+' ','https://elevenlabs.io/voices/'+ID,'elevenlabs.io/voices/'+ID,'https://elevenlabs.io/app/voice-library?voiceId='+ID,'https://elevenlabs.io/app/voice-lab/share/abc123/'+ID,'https://www.elevenlabs.io/voices/'+ID+'?from=x#top','https://elevenlabs.io/voices/DMyrgzQFny3JI1Y1paM5'])
  {const r=X.parse(s);assert.ok(r.ok,s);assert.equal(r.id,s.includes('DMyrgz')?'DMyrgzQFny3JI1Y1paM5':ID,s);}
 for(const [s,why] of [['','Paste'],['AbCdEf123','exactly 20'],['https://example.com/voices/'+ID,'Only an elevenlabs.io'],['https://elevenlabs.io/app/voice-library','no voice ID'],['not a link at all!','not a link'],[ID+'x','exactly 20'],['https://elevenlabs.io.evil.com/voices/'+ID,'Only an elevenlabs.io']])
  {const r=X.parse(s);assert.equal(r.ok,false,s);assert.match(r.why,new RegExp(why),s);}
 assert.equal(X.listenUrl(ID),'https://elevenlabs.io/voices/'+ID);assert.equal(X.listenUrl('nope'),null);});

test('refused: the reserved slot, broadcast voices and The Function; Reverie and Lace allowed with the street-voice note',()=>{const X=V(),r=reg();
 for(const id of ['special-character','the-function','news-anchor','commercial-announcer',...Object.keys(r.broadcast),...Object.keys(r.reserved)])assert.ok(X.refusal(id,r),id);
 for(const id of ['admin','iris','rook','grey-reverie','ethereal-lace','zen-zephyr','mara'])assert.equal(X.refusal(id,r),null,id);
 assert.match(X.note('grey-reverie'),/ordinary, neutral street voice/);assert.equal(X.note('admin'),'');
 assert.equal(X.make('special-character',ID,'x',{registry:r}).ok,false);assert.equal(X.make('the-function',ID,'x',{registry:r}).ok,false);
 const m=X.make('grey-reverie','https://elevenlabs.io/voices/'+ID,'  Gravel vendor ',{registry:r,date:'2026-11-18'});assert.deepEqual(m,{ok:true,voice:{...ok,model:'eleven_v4'}});   // a new choice records its model (default Eleven v4, 19 Nov 2026)
 for(const [n,why] of [['','Give the voice a name'],['x'.repeat(61),'too long'],['<b>x</b>','plain text']])assert.match(X.make('admin',ID,n,{registry:r}).why,new RegExp(why));});

test('content.voices is checked the same way in the browser (mission-content.js) and is carried by drafts, play and publish',()=>{fresh();const MC=require(R('void-runner/mission-content.js')),X=require(R('void-runner/npc-voices.js'));
 const doc=v=>({format:MC.FORMAT,version:MC.VERSION,voices:v});
 assert.deepEqual(MC.check(doc({'grey-reverie':ok,admin:{...ok,voiceId:'DMyrgzQFny3JI1Y1paM5'}}),{registry:reg()}).errors,[]);
 for(const [v,why] of [[{'special-character':ok},'reserved'],[{'the-function':ok},'no voice'],[{'news-anchor':ok},'Broadcast'],[{admin:{...ok,voiceId:'short'}},'20 letters'],[{admin:{...ok,apiKey:'sk_x'}},'20 letters'],[{admin:{...ok,engine:'kokoro'}},'20 letters'],[{admin:{...ok,chosen:'yesterday'}},'20 letters'],[{admin:{...ok,name:'<i>x</i>'}},'20 letters'],[[],'unknown shape']])
  {const r=MC.check(doc(v),{registry:reg()});assert.equal(r.ok,false,JSON.stringify(v));assert.ok(r.errors.some(e=>new RegExp(why).test(e)),r.errors.join('|'));}
 const c=MC.fromDrafts({local:{missions:{},lines:{},trees:[],voices:{'grey-reverie':ok,'the-function':ok,admin:{voiceId:'bad'}}}});assert.deepEqual(c.voices,{'grey-reverie':ok},'only clean, allowed choices are sent');
 assert.equal(MC.empty(c),false,'a voice choice alone is something to publish');assert.equal(MC.empty(MC.fromDrafts({local:{voices:{}}})),true);
 const e={givers:[]};MC.snapshot(e);const out=MC.apply(c,e);assert.deepEqual(e.voices,{'grey-reverie':ok});assert.ok(out.applied.some(a=>/voice choice/.test(a)));assert.ok(X);});

test('the current voice: an editor choice, else the re-voice file, else the registered Kokoro voice (read-only), else none',()=>{const X=V(),r=reg(),eng=JSON.parse(fs.readFileSync(R('tools/audio/revoice-engines.json'),'utf8')).characters;
 assert.deepEqual(X.current('mara',{registry:r,engines:eng,voices:{}}),{kind:'kokoro',voice:'af_bella',status:'approved'});
 const a=X.current('admin',{registry:r,engines:eng,voices:{}});assert.equal(a.kind,'elevenlabs');assert.equal(a.from,'file');assert.equal(a.voiceId,'DMyrgzQFny3JI1Y1paM5');assert.equal(a.kokoro.voice,'am_michael');
 const b=X.current('mara',{registry:r,engines:eng,voices:{mara:ok}});assert.equal(b.from,'editor');assert.equal(b.voiceId,ID);assert.equal(b.kokoro.voice,'af_bella','the registered voice stays as it is');
 assert.deepEqual(X.current('grey-reverie',{registry:r,engines:eng,voices:{}}),{kind:'none'});
 // the editor's lines pick it up (mission-trees.js: the engine of each NPC's lines and of a tree's NPCs)
 fresh();const T=require(R('void-runner/mission-trees.js')),S=require(R('admin/studio-model.js'));
 const src=v=>{fresh();return {missions:require(R('void-runner/mission-log.js')).definitions,beginner:require(R('void-runner/beginner.js')).MISSIONS,content:require(R('void-runner/content.js')),campaign:require(R('void-runner/campaign.js')),story:require(R('void-runner/story-content.js')),registry:r,files:Object.fromEntries(T.FILES.map(f=>[f,fs.readFileSync(R(f),'utf8')])),modules:require(R('void-runner/progression.js')).modules,ships:require(R('void-runner/ships.js')).ships,locations:require(R('void-runner/universe.js')).locations,stores:S.STORES,engines:eng,voices:v};};
 const rook=b0=>(b0.npcs||[]).find(n=>n.id==='rook');
 const before=T.build(src({})),after=T.build(src({rook:ok}));assert.equal(rook(before).engine.voiceId,'wzVFxVZCBIi6KBxNhQDI');assert.equal(rook(after).engine.voiceId,ID);assert.equal(rook(after).engine.from,'editor');
 const tn=after.trees.flatMap(t=>t.npcs).find(n=>n.id==='rook');assert.ok(tn);assert.equal(tn.engine.voiceId,ID);assert.deepEqual(rook(after).voice,{voice:'bm_fable',status:'approved'},'the registered voice is unchanged');});

test('the estimate counts spoken characters and states its assumption (about 1 credit per character; Flash / Turbo about half)',()=>{const X=V();
 const e=X.estimate(['Hello there.','',null,'  Work? Always.  ','日本']);assert.deepEqual({lines:e.lines,chars:e.chars,credits:e.credits,fast:e.fast},{lines:3,chars:12+13+2,credits:27,fast:14});
 assert.match(e.text,/Estimate only/);assert.match(e.text,/1 credit per character/);assert.deepEqual(X.estimate([]),{lines:0,chars:0,credits:0,fast:0,text:e.text});});

test('the export is revoice-engines.json format: the file\'s own characters kept, editor choices added with engine, voice, voiceId, chosen "by the owner" and a note',()=>{const X=V(),file=JSON.parse(fs.readFileSync(R('tools/audio/revoice-engines.json'),'utf8'));
 const out=X.exportEngines({'grey-reverie':ok,'the-function':ok,junk:{voiceId:'x'}},file);assert.deepEqual(Object.keys(out),['about','characters']);
 for(const [id,e] of Object.entries(file.characters))assert.deepEqual(out.characters[id],e,id+' kept as it is');
 const g=out.characters['grey-reverie'];assert.deepEqual(Object.keys(g),['engine','voice','voiceId','model','chosen','note']);assert.equal(g.model,'eleven_v4');assert.equal(g.engine,'elevenlabs');assert.equal(g.voiceId,ID);
 assert.match(g.chosen,/^2026-11-18 by the owner \(https:\/\/elevenlabs\.io\/voices\/AbCdEfGhIjKlMnOpQrSt\)$/);assert.match(g.note,/spend not yet approved/);assert.match(g.voice,/Gravel vendor/);
 assert.equal(out.characters['the-function'],undefined);assert.equal(out.characters.junk,undefined);
 for(const e of Object.values(file.characters))assert.ok(X.ID.test(e.voiceId),'every voice id in the file passes the same format check');
 assert.deepEqual(file,JSON.parse(fs.readFileSync(R('tools/audio/revoice-engines.json'),'utf8')),'the file itself is never changed');});

test('the page loads npc-voices.js before the Mission Editor content rules; the site publishes the re-voice file the editor reads',()=>{const html=fs.readFileSync(R('void-runner.html'),'utf8');
 const i=html.indexOf('void-runner/npc-paths.js'),j=html.indexOf('void-runner/npc-voices.js'),k=html.indexOf('void-runner/mission-content.js');assert.ok(i>0&&j>i&&k>j);
 assert.equal(html,fs.readFileSync(R('static/void-runner.html'),'utf8'));assert.ok(require(R('tools/assets/build-pages.cjs')).publishable('tools/audio/revoice-engines.json'));});

test('the server repeats the same refusals and id format (void_runner_live_content.py)',()=>{const X=V(),py=fs.readFileSync(R('void_runner_live_content.py'),'utf8');
 for(const id of Object.keys(X.REFUSED))assert.match(py,new RegExp("'"+id+"': '"),id);assert.match(py,/VOICE_ID = re\.compile\(r'\^\[A-Za-z0-9\]\{20\}\$'\)/);
 const gen=fs.readFileSync(R('tools/audio/generate.py'),'utf8');for(const id of Object.keys(X.REFUSED))assert.ok(gen.includes("'"+id+"'"),'generate.py refuses '+id);});

test('the editor never generates audio and never handles an API key: no ElevenLabs API host, no key field, no text-to-speech call',()=>{
 for(const f of ['void-runner/npc-voices.js','void-runner/mission-editor.js','void-runner/npc-editor.js']){const s=fs.readFileSync(R(f),'utf8');
  assert.doesNotMatch(s,/api\.elevenlabs\.io|xi-api-key|text-to-speech|elevenlabs\.io\/v1/i,f);assert.doesNotMatch(s,/type:'password'|apiKey|api_key/i,f);}
 const me=fs.readFileSync(R('void-runner/mission-editor.js'),'utf8');assert.match(me,/rel:'noopener noreferrer','data-voice-listen'/,'Listen on ElevenLabs opens the public voice page in a new tab');});
