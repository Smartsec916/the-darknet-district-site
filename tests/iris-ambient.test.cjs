// Iris's ambient Comms lines (the owner, 21 Nov 2026): the rules in void-runner/iris-ambient.js, their clips, and the game wiring.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../void-runner/iris-ambient.js');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const T=R.TUNING;
const BASE={enabled:true,contact:true,busy:false,combat:false,hostile:false,mission:true,voice:true};
const base=BASE,first=()=>0;   // a fixed "random"
const OWNER={'iris-bark-hack-1':'Almost there.','iris-bark-hack-2':'Just a little longer.','iris-bark-hack-3':'Steady. You\'re halfway through.','iris-bark-hack-4':'Keep your hand still. Nearly done.',
 'iris-bark-sneak-1':'Easy. Don\'t rush it.','iris-bark-sneak-2':'He hasn\'t seen you. Let\'s keep it that way.','iris-bark-spotted-1':'That happens. Try again, a little slower.',
 'iris-bark-wait-1':'Nothing yet. I\'ll tell you the moment it changes.','iris-bark-joke-1':'For the record, I calculated your odds. I\'ve decided not to share them.',
 'iris-bark-joke-2':'I\'d come and help, but someone has to mind the counter.','iris-bark-joke-3':'You\'re doing fine. Statistically, someone has done this worse.',
 'iris-bark-store-1':'Have you seen the new T-shirts in the store? You\'d look a lot cooler doing this in one.','iris-bark-store-2':'If you\'re going to break into places, you might as well look good doing it. The store has new shirts.'};

test('the 13 lines are the owner\'s words verbatim, each with a clip of the exact text',()=>{
 assert.deepEqual(Object.fromEntries(R.LINES.map(l=>[l.id,l.text])),OWNER);
 const m=JSON.parse(read('void-runner/assets/audio/voice/extra/manifest.json'));
 for(const l of R.LINES){const e=m.lines[l.id];assert.ok(e,l.id);assert.equal(e.speaker,'iris');assert.equal(e.text,l.text);assert.equal(e.file,'extra/'+l.id+'.ogg');assert.equal(e.voiceId,'CvD6hF1BJzAFN428j1cO');assert.equal(e.source,'iris-ambient.js');assert.match(e.note,/owner-approved 21 Nov 2026/);
  const f=path.join(root,'void-runner/assets/audio/voice',e.file);assert.ok(fs.existsSync(f),f);assert.equal(fs.readFileSync(f).subarray(0,4).toString(),'OggS');}
});

test('a hack of 8 s or more: one line around the middle, never on a short hack',()=>{
 const s=R.create(0);s.calmSince=0;
 assert.equal(R.decide(s,{...base,hack:{key:'h1',hold:6,t:3}},300,{random:first}),null,'a 6 s hack: nothing');
 assert.equal(R.decide(s,{...base,hack:{key:'h2',hold:10,t:2}},300,{random:first}),null,'too early');
 const l=R.decide(s,{...base,hack:{key:'h2',hold:10,t:5}},301,{random:first});assert.equal(l&&l.cat,'hack');
 assert.equal(R.decide(s,{...base,hack:{key:'h2',hold:10,t:6}},302,{random:first}),null,'at most one per hack');
 assert.equal(R.decide(s,{...base,hack:{key:'h3',hold:10,t:5}},350,{random:first}),null,'the global cooldown');
 assert.equal(R.decide(s,{...base,hack:{key:'h4',hold:10,t:5}},301+T.globalCooldown,{random:first})?.cat,'hack');
});

test('the global and per-line cooldowns',()=>{
 const s=R.create(0);const a=R.decide(s,{...base,hack:{key:'a',hold:10,t:5}},1000,{random:first});assert.equal(a.id,'iris-bark-hack-1');
 const b=R.decide(s,{...base,hack:{key:'b',hold:10,t:5}},1000+T.globalCooldown,{random:first});assert.notEqual(b.id,a.id,'the same line does not come back soon');
 // only one sneak line left ready after both are used? per-line cooldown blocks a line, then frees it
 const s2=R.create(0);R.decide(s2,{...base,sneak:{visit:'v1',guardNear:true,seen:false}},500,{random:first});
 R.decide(s2,{...base,sneak:{visit:'v2',guardNear:true,seen:false}},500+T.globalCooldown,{random:first});
 assert.equal(R.decide(s2,{...base,sneak:{visit:'v3',guardNear:true,seen:false}},500+2*T.globalCooldown,{random:first}),null,'both sneak lines on their cooldown');
 assert.ok(R.decide(s2,{...base,sneak:{visit:'v4',guardNear:true,seen:false}},500+T.lineCooldown+1,{random:first}));
});

test('sneak: once per visit, only while the guard has not seen the player',()=>{
 const s=R.create(0);
 assert.equal(R.decide(s,{...base,sneak:{visit:'v',guardNear:true,seen:true}},300),null);
 assert.equal(R.decide(s,{...base,sneak:{visit:'v',guardNear:true,seen:false}},301)?.cat,'sneak');
 assert.equal(R.decide(s,{...base,sneak:{visit:'v',guardNear:true,seen:false}},301+T.globalCooldown),null,'the same visit');
 assert.equal(R.decide(s,{...base,sneak:{visit:'v',guardNear:false}},301+T.globalCooldown+T.calmFor+T.quietCooldown),null,'no quiet lines inside a sneak area');
});

test('spotted: a few seconds after SPOTTED, once',()=>{
 const base={...BASE,mission:false};const s=R.create(0);R.spotted(s,500);
 assert.equal(R.decide(s,base,501),null);
 assert.equal(R.decide(s,base,500+T.spottedDelay)?.id,'iris-bark-spotted-1');
 assert.equal(R.decide(s,base,500+T.spottedDelay+1),null);
 const s2=R.create(0);R.spotted(s2,500);assert.equal(R.decide(s2,base,500+T.spottedWithin+1),null,'too late: given up');
});

test('never while busy, in combat, without Iris as a contact, or switched off; nothing is queued',()=>{
 for(const k of [{busy:true},{combat:true},{contact:false},{enabled:false}]){const s=R.create(0);R.spotted(s,0);
  assert.equal(R.decide(s,{...base,...k,hack:{key:'h',hold:10,t:5}},300),null,JSON.stringify(k));
  assert.equal(R.decide(s,{...base,...k},300+T.spottedDelay),null);}
 const s=R.create(0);assert.equal(R.decide(s,{...base,busy:true,hack:{key:'h',hold:10,t:5}},300),null);
 assert.equal(R.decide(s,{...base,hack:{key:'h',hold:10,t:9}},301),null,'past the middle: skipped, not queued');
 assert.equal(R.force(R.create(0),'joke',{busy:true}),null,'a preview waits for nothing either');
});

test('voice off: the line still shows (speak false)',()=>{
 const s=R.create(0);const l=R.decide(s,{...base,voice:false,hack:{key:'h',hold:10,t:5}},300);assert.equal(l.cat,'hack');assert.equal(l.speak,false);
 assert.equal(R.decide(R.create(0),{...base,hack:{key:'h',hold:10,t:5}},300).speak,true);
});

test('quiet lines: jokes need a mission and 60 s of calm; the store line at most once per session',()=>{
 const s=R.create(0);
 assert.equal(R.decide(s,{...base,mission:false},T.calmFor+1),null,'no mission, the store line not yet due');
 assert.equal(R.decide(s,{...base,hostile:true},T.calmFor+1),null,'a hostile zone');
 assert.equal(R.decide(s,base,T.calmFor+1)?.cat,'joke');
 // tense moments reset the calm
 const s2=R.create(0);R.decide(s2,{...base,busy:true},50);assert.equal(R.decide(s2,base,100),null);assert.equal(R.decide(s2,base,50+T.calmFor)?.cat,'joke');
 // the store line: after storeAfter, once
 const s3=R.create(0),pick=()=>0;let stores=0;
 for(let t=T.storeAfter;t<T.storeAfter+20000;t+=5){const l=R.decide(s3,{...base,mission:false},t,{random:pick});if(l&&l.cat==='store')stores++;}
 assert.equal(stores,1);assert.equal(s3.storeDone,true);
});

test('a wait on game time: the wait line once, waitDelay after it starts',()=>{
 const s=R.create(0);
 assert.equal(R.decide(s,{...base,wait:{key:'m/w'}},1000),null);
 assert.equal(R.decide(s,{...base,wait:{key:'m/w'}},1000+T.waitDelay)?.id,'iris-bark-wait-1');
 assert.equal(R.decide(s,{...base,wait:{key:'m/w'}},1000+T.waitDelay+T.globalCooldown),null,'once per wait');
});

test('the BR-04 gap: the wait line about 25 s after Mission 009, then a line about every 70 s, no repeats, stops when Mission 010 arrives',()=>{
 const s=R.create(0),said=[];let t=2000;
 // a hack line during Mission 009 just before: the gap still starts on time (its own cooldown)
 R.decide(s,{...base,hack:{key:'h',hold:10,t:5}},t-5);
 for(;t<2000+T.gapFirst-1;t+=.5)assert.equal(R.decide(s,{...base,gap:true},t),null);
 for(;t<2000+330;t+=.5){const l=R.decide(s,{...base,gap:true},t);if(l)said.push([t-2000,l]);}
 assert.equal(said[0][1].id,'iris-bark-wait-1');assert.ok(said[0][0]>=T.gapFirst&&said[0][0]<=T.gapFirst+1);
 assert.ok(said.length>=4,'she fills the gap: '+said.length+' lines');
 for(let i=1;i<said.length;i++){assert.ok(said[i][0]-said[i-1][0]>=T.gapCooldown);assert.ok(['joke','store'].includes(said[i][1].cat));}
 assert.equal(new Set(said.map(x=>x[1].id)).size,said.length,'no line twice');
 assert.ok(said.filter(x=>x[1].cat==='store').length<=1);
 // Mission 010 is here: no more gap lines (and nothing for a normal cooldown)
 assert.equal(R.decide(s,{...base,gap:false},t+T.gapCooldown),null);assert.equal(s.gap,null);
 // still never over other voice / a call / a conversation, and the switch and voice-off rules hold in the gap
 const s2=R.create(0);for(let x=0;x<200;x+=.5)assert.equal(R.decide(s2,{...base,gap:true,busy:true},x),null);
 const s3=R.create(0);for(let x=0;x<200;x+=.5)assert.equal(R.decide(s3,{...base,gap:true,enabled:false},x),null);
 const s4=R.create(0);let l=null;for(let x=0;x<60&&!l;x+=.5)l=R.decide(s4,{...base,gap:true,voice:false},x);assert.equal(l.speak,false);
 // the store line in the gap only if it has not played this session
 const s5=R.create(0);s5.storeDone=true;const ids=[];for(let x=0;x<600;x+=.5){const y=R.decide(s5,{...base,gap:true},x);if(y)ids.push(y.cat);}assert.ok(!ids.includes('store'));
});

test('the game wiring: loaded in order, the SPOTTED hook, the switches, the build',()=>{
 const html=read('void-runner.html');assert.equal(html,read('static/void-runner.html'));
 const a=html.indexOf('void-runner/iris-ambient.js'),b=html.indexOf('void-runner/iris-ambient-game.js'),d=html.indexOf('void-runner/dev-test.js'),m=html.indexOf('void-runner/mission-mechanics-game.js');
 assert.ok(m>0&&d>m&&a>d&&b>a&&html.indexOf('void-runner/bootstrap.js')>b);
 assert.match(read('void-runner/mission-mechanics-game.js'),/SPOTTED · Security saw you[^\n]*VoidIrisAmbient\?\.spotted\?\.\(\)/);
 const g=read('void-runner/iris-ambient-game.js');assert.match(g,/IRIS CHATTER/);assert.match(g,/data-iris-dev/);assert.match(g,/VoidDevTest\?\.active/);assert.match(g,/VoidApartments\?\.hacking/);
 assert.match(read('void-runner-sw.js').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);
 assert.doesNotMatch(g,/localStorage\.setItem\([^)]*state/,'nothing saved with the campaign');
});
