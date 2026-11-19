/* ElevenLabs voice tags in what is said, and the ElevenLabs model choice (the owner, 19 Nov 2026: "so i can put elevenlabs voice tags into the what is said section?",
   "choose a model?", "v4?"). Tags are checked like the server, removed for players where content is adapted (mission-content.js apply / mapLine), kept in the text a voice
   is sent only for a model that reads them (Eleven v4 / v3), and counted as sent. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G,MS};}
const V=()=>{fresh();return require(R('void-runner/npc-voices.js'));};
const tree=(text,start='Over here.')=>({id:'draft-tags',name:'Tags',missions:[{id:'draft-tags-m1',number:77,title:'Quiet',type:'side',giver:'admin',
 start:{how:'notification',channel:'messages',from:'admin',header:'ADMIN',text:start,when:{kind:'pod-exit'}},objectives:[{id:'see',kind:'talk',npc:'admin',label:'Talk to Admin.',say:[{who:'admin',text}]}]}]});

test('strip: players never see tags; spaces and punctuation tidied; a line without tags is returned exactly as it is',()=>{const X=V();
 for(const [a,b] of [['[whispers] Keep it down.','Keep it down.'],['Fine [sighs], go.','Fine, go.'],['Go [laughs]!','Go!'],['[excited] [laughs] Yes!','Yes!'],['Stay [meditative] calm.','Stay calm.'],['Keep [whispers] it  down.','Keep it down.']])assert.equal(X.strip(a),b,a);
 for(const t of ['No tags  here. ','A [Placeholder] stays','[Write Admin\'s introduction here]'])assert.equal(X.strip(t),t,'unchanged: '+t);});

test('tag rules: lowercase words, spaces and hyphens; 30 characters each; 6 per line; malformed brackets refused in plain words',()=>{const X=V();
 for(const t of ['[whispers] Keep it down.','[laughs] [excited] Yes!','[short-breath] Run.','[Write Admin\'s introduction to The Darknet District here]','Plain.'])assert.deepEqual(X.tagProblems(t),[],t);
 for(const [t,why] of [['[whispers Keep it down.',/not closed/],['Keep it down]',/not closed/],['[] Hi',/Empty brackets/],['[Whispers] Hi',/lowercase/],['[sigh2] Hi',/lowercase/],['['+'a'.repeat(31)+'] Hi',/too long/],['[a][b][c][d][e][f][g] Hi',/Too many/],['[sighs]',/needs words/]])
  assert.match(X.tagProblems(t).join(' '),why,t);});

test('the text a voice is sent: tags only for Eleven v4 / v3; Kokoro, Multilingual v2, Flash and Turbo get the line without them; estimate counts it as sent',()=>{const X=V();
 const t='[whispers]  Keep it down.';
 assert.equal(X.speakText(t,{kind:'elevenlabs',model:'eleven_v4'}),'[whispers] Keep it down.');assert.equal(X.speakText(t,{kind:'elevenlabs',model:'eleven_v3'}),'[whispers] Keep it down.');
 assert.equal(X.speakText(t,{engine:'elevenlabs',model:'eleven_v4'}),'[whispers] Keep it down.','a queue engine record');
 for(const v of [{kind:'elevenlabs',model:'eleven_multilingual_v2'},{kind:'elevenlabs',model:'eleven_flash_v2_5'},{kind:'elevenlabs',model:'eleven_turbo_v2_5'},{kind:'kokoro',voice:'af_river'},{kind:'none'}])assert.equal(X.speakText(t,v),'Keep it down.',JSON.stringify(v));
 assert.equal(X.estimate([X.speakText(t,{kind:'elevenlabs',model:'eleven_v4'})],'eleven_v4').chars,24);assert.equal(X.estimate([X.speakText(t,{kind:'kokoro'})]).chars,13);
 assert.equal(X.estimate(['x'.repeat(100)],'eleven_flash_v2_5').credits,50);assert.equal(X.estimate(['x'.repeat(100)],'eleven_v4').credits,100);
 assert.match(X.tagWarning(t,{kind:'kokoro',voice:'af_river'},'Nyx'),/Kokoro voice, which cannot use voice tags/);assert.match(X.tagWarning(t,{kind:'elevenlabs',model:'eleven_flash_v2_5'}),/does not read voice tags/);
 assert.equal(X.tagWarning(t,{kind:'elevenlabs',model:'eleven_v4'}),null);assert.equal(X.tagWarning('No tags.',{kind:'kokoro'}),null);});

test('models: an allow-list with plain descriptions; Eleven v4 is the default, reads tags and is Zen Zephyr\'s recorded model; older choices without a model still load',()=>{const X=V();
 assert.deepEqual(Object.keys(X.MODELS),['eleven_v4','eleven_v3','eleven_multilingual_v2','eleven_flash_v2_5','eleven_turbo_v2_5']);assert.equal(X.DEFAULT_MODEL,'eleven_v4');
 assert.equal(X.MODELS.eleven_v4.label,'Eleven v4 (newest; supports voice tags — used for Zen Zephyr)');assert.equal(X.MODELS.eleven_v4.tags,true);assert.equal(X.MODELS.eleven_v3.tags,true);assert.equal(X.MODELS.eleven_flash_v2_5.rate,.5);
 const ID='AbCdEfGhIjKlMnOpQrSt',ok={engine:'elevenlabs',voiceId:ID,name:'Gravel vendor',chosen:'2026-11-19 by the owner'};
 assert.equal(X.make('admin',ID,'Gravel vendor',{date:'2026-11-19'}).voice.model,'eleven_v4');assert.equal(X.make('admin',ID,'Gravel vendor',{model:'eleven_turbo_v2_5'}).voice.model,'eleven_turbo_v2_5');
 assert.equal(X.make('admin',ID,'Gravel vendor',{model:'eleven_v9'}).ok,false);
 assert.deepEqual(X.problems({admin:ok}),[]);assert.deepEqual(X.problems({admin:{...ok,model:'eleven_v3'}}),[]);assert.match(X.problems({admin:{...ok,model:'eleven_v9'}})[0],/unknown ElevenLabs model/);
 const eng=JSON.parse(fs.readFileSync(R('tools/audio/revoice-engines.json'),'utf8')).characters;
 assert.equal(X.current('zen-zephyr',{engines:eng}).model,'eleven_v4');assert.equal(X.current('admin',{engines:eng}).model,'eleven_v4','no model recorded: the default');
 assert.equal(X.current('admin',{engines:eng,voices:{admin:{...ok,model:'eleven_multilingual_v2'}}}).model,'eleven_multilingual_v2');
 assert.equal(X.exportEngines({admin:{...ok,model:'eleven_flash_v2_5'}}).characters.admin.model,'eleven_flash_v2_5');});

test('the game shows lines without tags: tree lines, notification text and changed lines are stripped where content is adapted; malformed tags refuse the record',()=>{
 const x=env(),{MC}=x,ctx={givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()};
 const good={format:MC.FORMAT,version:MC.VERSION,trees:[tree('[whispers] Keep it down.','[sighs] Come by when you can.')],lines:[{who:'iris',from:'x',to:'[laughs] Hello there.'}]};
 const errs=MC.check(good,ctx).errors.filter(e=>/tag|bracket/i.test(e));assert.deepEqual(errs,[]);
 MC.apply({format:MC.FORMAT,version:MC.VERSION,trees:good.trees},x.e,ctx);
 const m=x.e.trees.find(t=>t.id==='draft-tags').missions[0];assert.equal(m.objectives[0].say[0].text,'Keep it down.');assert.equal(m.start.text,'Come by when you can.');
 x.e.lineMap=new Map([['iris|x','placeholder']]);assert.equal(MC.mapLine(x.e,{who:'Iris',text:'Unchanged.'}).text,'Unchanged.');
 MC.apply({format:MC.FORMAT,version:MC.VERSION,lines:[{who:'iris',from:'Hello.',to:'[laughs] Hello there.'}]},x.e);assert.equal(MC.mapLine(x.e,{who:'Iris',text:'Hello.'}).text,'Hello there.');
 for(const bad of [tree('[whispers Keep it down.'),tree('Hi.','[Loud] Come by.'),tree('[a][b][c][d][e][f][g] Too many.')])assert.ok(MC.check({format:MC.FORMAT,version:MC.VERSION,trees:[bad]},ctx).errors.some(e=>/bracket|lowercase|Too many/.test(e)),JSON.stringify(bad.missions[0].objectives[0].say));
 // the shipped storyline's placeholder "[Write ... here]" is not a tag
 assert.deepEqual(MC.check({format:MC.FORMAT,version:MC.VERSION,trees:MC.treesContent(x.MS.trees(),{givers:x.e.givers}).trees},ctx).errors.filter(e=>/tag|bracket/i.test(e)),[]);});

test('the editor: one help line under the line fields, a warning on Kokoro-voiced characters, the model choice in the Voice box, the model sent with a draft choice',()=>{
 const s=fs.readFileSync(R('void-runner/mission-editor.js'),'utf8');
 assert.match(s,/You can add ElevenLabs voice tags like \[whispers\] or \[laughs\]\. Players never see them; only ElevenLabs voices use them\./);
 assert.match(s,/data-me-tag-note/);assert.match(s,/data-voice-model/);assert.match(s,/x\.model=V\(\)\.modelOf\(v\)/);
 const W=(fresh(),require(R('void-runner/editor-wizard.js'))),a=W.fresh();Object.assign(a,{start:'messages',message:{text:'[Loud] Hi.'}});assert.ok(W.problems(a,'start').some(p=>/lowercase/.test(p)));});
