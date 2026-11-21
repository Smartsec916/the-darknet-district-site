// The six Blackrock members' chorus (21 Nov 2026): Mission 010's seven robed-all lines and the laugh, each ONE mix of the six approved voices (the owner's "half in sync"
// recipe, cult-room.js CHORUS), under the speaker id the camera feed looks them up by. The laugh beat has no words: it is keyed by its animation ('[laugh]').
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const R=p=>path.join(__dirname,'..',p);
const MS=require(R('void-runner/main-story.js')),C=require(R('void-runner/cult-room.js'));
const X=JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/extra/manifest.json'),'utf8'));
const IDS=['SO9JediIwzugrikv7xw0','VsQmyFHffusQDewmHB5v','oXuGG4PpSq1U1YAFxeEO','wqcUglz7RaiukTjAKIvu','hqsADTrqjrr0sI9LFcYV','ctbfMo4IDq5ExcIEim2K'];
// an ogg's length in seconds: the last page's granule position at 24 kHz
const oggSecs=f=>{const b=fs.readFileSync(f),i=b.lastIndexOf(Buffer.from('OggS'));return Number(b.readBigUInt64LE(i+6))/24000;};
const lineEvents=()=>C.compile(MS.RITUAL).events.filter(e=>e.type==='line');

test('voiceText: a line\'s words, or for an empty line with an animation its [anim] key; nothing otherwise',()=>{
 assert.equal(C.voiceText({type:'line',who:'robed-all',text:'Good.'}),'Good.');
 assert.equal(C.voiceText({type:'line',who:'robed-all',text:'',anim:'laugh'}),'[laugh]');
 assert.equal(C.voiceText({type:'line',who:'robed-1',text:''}),'');
 assert.equal(C.voiceText({type:'door',open:true}),'');assert.equal(C.voiceText(null),'');
 // the compiled laugh beat carries its animation, and still shows nothing
 const cs=C.compile(MS.RITUAL),laugh=cs.events.find(e=>e.type==='line'&&!e.text);assert.equal(laugh.who,'robed-all');assert.equal(laugh.anim,'laugh');
 assert.deepEqual(C.lineAt(cs,laugh.t+.5),[]);
});

test('every robed-all beat of the BR-04 ritual (7 lines and the laugh) has exactly one chorus clip, in order',()=>{
 const want=lineEvents().filter(e=>e.who==='robed-all').map(C.voiceText);assert.equal(want.length,8);assert.equal(want[7],'[laugh]');
 const ritualFeed=MS.M010.feeds.find(f=>f.id==='br-04');assert.equal(ritualFeed.scene,MS.RITUAL);
 want.forEach((text,i)=>{const id='robed-all-m010-'+(i+1),e=X.lines[id];assert.ok(e,id);
  assert.deepEqual(Object.entries(X.lines).filter(([,l])=>l.speaker==='robed-all'&&l.text===text).map(([k])=>k),[id]);
  assert.equal(e.speaker,'robed-all');assert.equal(e.text,text);assert.equal(e.file,'extra/'+id+'.ogg');
  assert.equal(e.voice,'Blackrock Members 1–6 (chorus mix)');assert.deepEqual(e.voiceIds,IDS);assert.match(e.note,/half in sync/);
  const f=R('void-runner/assets/audio/voice/'+e.file),n=fs.statSync(f).size;assert.ok(n>8000&&n<120000,e.file+' '+n);
  assert.equal(fs.readFileSync(f).subarray(0,4).toString(),'OggS');assert.match(fs.readFileSync(f).subarray(0,200).toString('latin1'),/vorbis/);});
 assert.match(X.lines['robed-all-m010-8'].note,/no time-stretch/);
 // the six voices are the approved ones in cult-room.js CHORUS
 assert.deepEqual(C.SIX.map(id=>C.CHORUS['robed-all'].voices[id].voiceId),IDS);
});

test('each chorus clip ends before the next voiced beat starts (no line is cut off)',()=>{
 const ev=lineEvents();ev.forEach((e,i)=>{if(e.who!=='robed-all')return;const k=ev.filter(x=>x.who==='robed-all').indexOf(e)+1;
  const secs=oggSecs(R('void-runner/assets/audio/voice/extra/robed-all-m010-'+k+'.ogg'));assert.ok(secs>1&&secs<12,k+': '+secs);
  const next=ev[i+1];if(next)assert.ok(e.t+secs<=next.t,'chorus '+k+' ('+secs.toFixed(2)+' s) overlaps the next line');});
});

test('build bumped',()=>{assert.match(fs.readFileSync(R('void-runner-sw.js'),'utf8').split('\n')[3],/^const BUILD='2026-11-21-chorus-voices-1';\r?$/);});
