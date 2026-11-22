/* Imported voice files (Developer Tools, 19 Nov 2026): caps, the voice status (text changed since the import), what the content references, the file's address
   (SHA-256), the Ogg Opus muxer, the content check and the game-side lookup (void-runner/voice-imports.js, mission-content.js). */
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const VI=require('../void-runner/voice-imports.js'),MC=require('../void-runner/mission-content.js');
const H='a'.repeat(64),H2='b'.repeat(64);
const rec=(o={})=>VI.record({who:'admin',text:'Keep it down.',hash:H,type:'audio/mpeg',duration:3.21,bytes:51234,name:'line.mp3',...o});

test('caps: 40 seconds and 600 KB, in plain words',()=>{
 assert.deepEqual(VI.caps({duration:12,bytes:100000}),[]);
 assert.deepEqual(VI.caps({duration:40,bytes:VI.LIMIT.bytes}),[]);
 assert.match(VI.caps({duration:41.3,bytes:1000})[0],/41\.3 s long; the limit is 40 seconds/);
 assert.match(VI.caps({duration:10,bytes:700000})[0],/684 KB; the limit is 586 KB\. In ElevenLabs, download it as a lower-quality MP3/);
 assert.match(VI.caps({duration:0,bytes:10})[0],/no sound/);
 assert.equal(VI.plan('audio/mpeg',500000),'keep');assert.equal(VI.plan('audio/mpeg',700000),'encode');assert.equal(VI.plan('audio/mp4',10000),'encode');assert.equal(VI.plan('audio/webm',10000),'encode');
});

test('sniff reads the first bytes, not the name',()=>{
 const b=s=>new Uint8Array([...Buffer.from(s,'binary'),...new Uint8Array(16)]);
 assert.equal(VI.sniff(b('OggS')),'audio/ogg');assert.equal(VI.sniff(b('RIFF\0\0\0\0WAVE')),'audio/wav');assert.equal(VI.sniff(b('ID3')),'audio/mpeg');
 assert.equal(VI.sniff(new Uint8Array([0xff,0xfb,0x90,0x64,0,0,0,0,0,0,0,0])),'audio/mpeg');assert.equal(VI.sniff(b('\0\0\0\x20ftypM4A ')),'audio/mp4');
 assert.equal(VI.sniff(new Uint8Array([0x1a,0x45,0xdf,0xa3,0,0,0,0,0,0,0,0])),'audio/webm');assert.equal(VI.sniff(b('<html>')),null);
});

test('status: imported, text changed since the import, file missing in this browser',()=>{
 const r=rec();assert.equal(VI.status(null,'x'),null);
 assert.deepEqual(VI.status(r,'Keep it down.'),{state:'ok',text:'Voice: imported file (used instead of any recorded clip)',cls:'ok'});
 assert.equal(VI.status(r,'  Keep it down. ').state,'ok','spaces at the ends do not count');
 const c=VI.status(r,'Keep it down, please.');assert.equal(c.state,'changed');assert.match(c.text,/text changed since the voice was imported/);
 assert.equal(VI.status(r,'Keep it down.',{available:false}).state,'missing');
 assert.equal(VI.status(rec({text:'[whispers] Keep it down.'}),'[whispers] Keep it down.').state,'ok','voice tags stay in the editor text');
 assert.equal(VI.status(rec({text:'[whispers] Keep it down.'}),'[shouts] Keep it down.').state,'changed','a changed tag is a change');
});

test('content references: only imports whose line still says the same words; one per spoken line',()=>{
 const recs={'tree:m1/offer/0':rec(),'tree:m1/offer/1':rec({text:'Old words.',hash:H2}),'admin|Shipped line.':rec({text:'Shipped line, edited.',hash:H2})};
 const now={'tree:m1/offer/0':'Keep it down.','tree:m1/offer/1':'New words.','admin|Shipped line.':'Shipped line, edited.'};
 const list=VI.contentClips(recs,k=>now[k]);
 assert.deepEqual(list.map(c=>c.text),['Keep it down.','Shipped line, edited.']);assert.deepEqual(Object.keys(list[0]).sort(),['bytes','duration','hash','text','type','who']);
 assert.deepEqual(VI.clipProblems(list),[]);
 assert.equal(VI.contentClips({a:rec(),b:rec({hash:H2})}).length,1,'two imports for the same spoken line: the last one');
 assert.equal(VI.contentClips({a:{...rec(),type:'audio/mp4'}}).length,0,'a bad record is never sent');
});

test('clip and record checks (the draft, the content, mission-content.js check)',()=>{
 const ok={who:'zen-zephyr',text:'Breathe.',hash:H,type:'audio/ogg',duration:2.5,bytes:20000};assert.deepEqual(VI.clipProblems([ok]),[]);
 const bad=[[{...ok,who:'player'},/not the player/],[{...ok,text:'<b>x</b>'},/plain text/],[{...ok,hash:'zz'},/bad file address/],[{...ok,type:'audio/mp4'},/MP3, WAV or Ogg/],
  [{...ok,duration:41},/40 seconds/],[{...ok,bytes:600001},/600 KB/],[{...ok,data:'AAAA'},/unknown fields/]];
 for(const [c,re] of bad)assert.ok(VI.clipProblems([c]).some(p=>re.test(p)),JSON.stringify(c));
 assert.match(VI.clipProblems([ok,{...ok,hash:H2}])[0],/same line/);assert.match(VI.clipProblems({})[0],/unknown shape/);
 assert.match(VI.clipProblems(Array.from({length:201},(_,i)=>({...ok,text:'L'+i})))[0],/Too many/);
 assert.deepEqual(VI.recordProblems({'tree:m1/offer/0':rec()}),[]);assert.ok(VI.recordProblems({'tree:m1/offer/0':{...rec(),data:'x'}}).length);assert.ok(VI.recordProblems([]).length);
 const doc={format:MC.FORMAT,version:1,clips:[ok]};assert.deepEqual(MC.check(doc,{}).errors,[]);
 assert.ok(MC.check({...doc,clips:[{...ok,bytes:9e9}]},{}).errors.some(e=>/600 KB/.test(e)));
 assert.equal(MC.empty(doc),false,'imported files alone are something to publish');
 const d=MC.fromDrafts({local:{trees:[],missions:{},lines:{},clips:{'tree:m1/offer/0':rec()}},clipText:()=>'Keep it down.'});assert.equal(d.clips.length,1);
 assert.equal(MC.fromDrafts({local:{trees:[],missions:{},lines:{},clips:{'tree:m1/offer/0':rec()}},clipText:()=>'Other words.'}).clips,undefined);
 const env={};MC.snapshot(env);const r=MC.apply(doc,env);assert.deepEqual(r.refused,[]);assert.deepEqual(env.clips,[ok]);
});

test('keyOf matches how the game speaks: display names, ids, voice tags removed',()=>{
 assert.equal(VI.keyOf('Admin','Hello. '),VI.keyOf('admin','Hello.'));assert.equal(VI.keyOf('Arcade attendant','x'),'attendant|x');assert.equal(VI.keyOf('zen-zephyr','x'),'zen-zephyr|x');
});

test('ordinary interaction audio cannot override a mission recording of identical words',()=>{
 const ctx={document:{},console};require('node:vm').runInNewContext(fs.readFileSync(path.join(__dirname,'..','void-runner/voice-imports.js'),'utf8'),ctx);const I=ctx.VoidVoiceImports;
 const mission={who:'tea-host',text:'Welcome.',hash:H,type:'audio/mpeg',duration:2,bytes:100};const ordinary={...mission,hash:H2};
 I.use([mission],{interactions:[ordinary],givers:[{id:'tea-host',say:'tea-host',name:'Tea Room Host'}]});assert.equal(I.find('Tea Room Host','Welcome.').hash,H);assert.equal(I.find('Tea Room Host','Welcome.',true).hash,H2);
 I.use([],{interactions:[ordinary]});assert.equal(I.find('tea-host','Welcome.'),null);assert.equal(I.find('tea-host','Welcome.',true).hash,H2);
 I.use([]);assert.equal(I.find('tea-host','Welcome.',true),null);
});

test('the file address is its SHA-256 (the fallback matches the platform)',async()=>{
 for(const n of [0,1,55,56,63,64,65,1000,70001]){const b=crypto.randomBytes(n);assert.equal(VI.sha256Sync(b),crypto.createHash('sha256').update(b).digest('hex'),'n='+n);assert.equal(await VI.sha256(b),crypto.createHash('sha256').update(b).digest('hex'));}
});

test('Ogg Opus muxer: valid pages, CRCs, the exact length, read back by oggInfo',()=>{
 const packets=Array.from({length:500},(_,i)=>({data:crypto.randomBytes(40+(i%300)),samples:960}));   // 10 s of 20 ms packets, some longer than 255 bytes
 const ogg=VI.oggOpus(packets,{preSkip:312,inputRate:24000,length:24000*9.99});const info=VI.oggInfo(ogg);
 assert.equal(info.codec,'opus');assert.equal(info.crcOk,true);assert.equal(info.preSkip,312);assert.ok(Math.abs(info.duration-9.99)<1e-6,String(info.duration));assert.ok(info.pages>=12);
 assert.equal(Buffer.from(ogg.subarray(28,36)).toString(),'OpusHead');assert.equal(ogg[5],2,'first page starts the stream');
 const bad=Uint8Array.from(ogg);bad[200]^=0xff;assert.equal(VI.oggInfo(bad).crcOk,false);assert.equal(VI.oggInfo(new Uint8Array([1,2,3])),null);
 const known=path.join(__dirname,'..','void-runner/assets/audio/voice/extra/admin-m002-call.ogg');if(fs.existsSync(known)){const k=VI.oggInfo(fs.readFileSync(known));assert.equal(k.codec,'vorbis');assert.equal(k.crcOk,true);assert.ok(Math.abs(k.duration-25.2)<0.05,String(k.duration));}
});

test('the game page loads voice-imports.js before voice-clips.js and mission-content.js',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','void-runner.html'),'utf8'),at=f=>html.indexOf('src="void-runner/'+f+'"');
 assert.ok(at('voice-imports.js')>0);assert.ok(at('voice-imports.js')<at('voice-clips.js'));assert.ok(at('voice-imports.js')<at('mission-content.js'));
 const vc=fs.readFileSync(path.join(__dirname,'..','void-runner/voice-clips.js'),'utf8');assert.match(vc,/VoidVoiceImports/,'recorded-line playback consults the imports first');
});
