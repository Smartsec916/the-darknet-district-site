/* Distances shown in feet (the owner, 20 Nov 2026: "can you change the distances to feet instead of meters"). Display only: the game, saves, mission data and the server
   keep metres. units.js (VoidUnits) formats and converts; the editors show feet and store metres without drifting a value nobody edited. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const U=require(R('void-runner/units.js'));
const src=p=>fs.readFileSync(R(p),'utf8');

test('fmtDist: whole feet, comma grouping, miles from one mile',()=>{
 assert.equal(U.fmtDist(0),'0 ft');assert.equal(U.fmtDist(1),'3 ft');assert.equal(U.fmtDist(5),'16 ft');assert.equal(U.fmtDist(13.4),'44 ft');assert.equal(U.fmtDist(44),'144 ft');
 assert.equal(U.fmtDist(304.8),'1,000 ft');assert.equal(U.fmtDist(1500),'4,921 ft');assert.equal(U.fmtDist(1609.34),'1.0 mi');assert.equal(U.fmtDist(1931),'1.2 mi');
 assert.equal(U.fmtDist(20000),'12 mi');assert.equal(U.fmtDist(20000,{miles:false}),'65,617 ft');assert.equal(U.fmtDist('6'),'20 ft');
 assert.equal(U.fmtDist(NaN),'');assert.equal(U.fmtDist(null),'');assert.equal(U.fmtDist(undefined),'');
});

test('toFeet / fromFeet / ftRange',()=>{
 assert.ok(Math.abs(U.toFeet(1)-3.28084)<1e-12);assert.equal(U.fromFeet(16),4.877);assert.equal(U.fromFeet(3.28084),1);
 assert.deepEqual(U.ftRange(1,30),[4,98]);assert.deepEqual(U.ftRange(1,50),[4,164]);assert.deepEqual(U.ftRange(.5,10),[2,32]);assert.deepEqual(U.ftRange(3,30),[10,98]);
 for(const [a,b] of [[1,30],[1,50],[.5,10],[3,30],[15,150],[5,60],[2,3.4],[1.2,3]]){const [lo,hi]=U.ftRange(a,b);assert.ok(U.fromFeet(lo)>=a&&U.fromFeet(hi)<=b,'the feet limits stay inside '+a+'..'+b+' m');}
});

test('editor round trip: a value nobody edited is stored unchanged; an edited one is feet / 3.28084 to 3 decimals (whole metres where required)',()=>{
 for(const v of [1,1.5,2,2.6,4.877,5,5.5,6,8,12.3,15,18.7,25,30,40,50,.5,10])assert.equal(U.m(U.ft(v),v),v,'unchanged '+v);
 for(const v of [1,1.5,2,2.6,5,6,8,30])assert.equal(U.m(String(U.ft(v)),v),v,'from the input text '+v);
 assert.equal(U.m(20,5),6.096);assert.equal(U.m(17,5),5.182);assert.equal(U.m(20,5,{whole:true}),6);assert.equal(U.m(200,5,{min:1,max:30}),30);assert.equal(U.m(1,5,{min:1,max:30}),1);
 assert.equal(U.m('',5),5);assert.equal(U.m('abc',undefined),undefined);
 // a few open-and-save cycles never drift
 let v=5.182;for(let i=0;i<5;i++)v=U.m(U.ft(v),v);assert.equal(v,5.182);
});

test('the built-in missions survive the editors unchanged: every stored distance comes back as the same metres',()=>{
 const MS=require(R('void-runner/main-story.js'));const seen=[];
 const walk=o=>{if(!o||typeof o!=='object')return;if(Array.isArray(o)){o.forEach(walk);return;}for(const [k,v] of Object.entries(o)){if(['near','close','wait','lost','distance','radius','gap'].includes(k)&&typeof v==='number')seen.push(v);else walk(v);}};
 walk(MS.trees?MS.trees():MS);assert.ok(seen.length>3,'found the stored distances');
 for(const v of seen)assert.equal(U.m(U.ft(v),v),v);
 const before=JSON.stringify(MS.trees?MS.trees():MS);for(const v of seen)U.m(U.ft(v),v);assert.equal(JSON.stringify(MS.trees?MS.trees():MS),before);
});

test('messages in metres (the game’s checks and the server’s answers) read in feet',()=>{
 assert.equal(U.text('“when walked near” needs a distance from 1 to 30 metres.'),'“when walked near” needs a distance from 4 to 98 ft.');
 assert.equal(U.text('a wait step’s distance is a whole number of metres from 1 to 50.'),'a wait step’s distance is from 4 to 164 ft.');
 assert.equal(U.text('“too close” is 0.5 to 10 metres.'),'“too close” is 2 to 32 ft.');
 assert.equal(U.text('must be further than (8 m).'),'must be further than (26 ft).');
 assert.equal(U.text('the walking speed is 0.2 to 1 m/s.'),'the walking speed is 0.2 to 1 m/s.');
 assert.equal(U.text('x is a number of metres.'),'x is a number of metres.','coordinates stay metres');
 assert.equal(U.text('waits 5 minutes'),'waits 5 minutes');assert.equal(U.text('Mission m005'),'Mission m005');
 // every distance message the server sends converts (no number left beside "metres")
 const py=src('void_runner_live_content.py'),msgs=[...py.matchAll(/'([^'\n]*\d[^'\n]*metres[^'\n]*)'/g)].map(x=>x[1].replace(/%d to %d/,'3 to 30'));
 assert.ok(msgs.length>=5);for(const m of msgs)assert.doesNotMatch(U.text(m),/\d+(?:\.\d+)? ?(?:metres|m)\b(?!\/)/,m);
 const MC=src('void-runner/mission-content.js');assert.match(MC,/needs a distance from 1 to 30 metres/,'the checks themselves still speak metres (the stored form)');
});

test('the game loads units.js first; the page copies match',()=>{
 const html=src('void-runner.html');assert.ok(html.indexOf('void-runner/units.js')>0&&html.indexOf('void-runner/units.js')<html.indexOf('void-runner/balance-data.js'));
 assert.equal(src('static/void-runner.html'),html);
});

test('player-facing distances use feet: arrow, markers, caption, V1 map, taxi, nearby players, photos, skirmish',()=>{
 const files={'void-runner/mission-guide.js':/'TARGET · '\+VoidUnits\.fmtDist\(d\)/,'void-runner/world-markers.js':/'GUIDE · '\+VoidUnits\.fmtDist\(d\)/,'void-runner/world-integration.js':/const label=VoidUnits\.fmtDist\(o\.length\)/,
  'void-runner/district-map.js':/VoidUnits\.fmtDist\(gd\.distance\)/,'void-runner/road-taxi.js':/VoidUnits\.fmtDist\(st\.distance\)/,'void-runner/personal-device.js':/VoidUnits\.fmtDist\(d\)\+' away'/,
  'void-runner/device-gallery.js':/VoidUnits\|\|require\('\.\/units\.js'\)\)\.fmtDist\(x\.dist\)/,'void-runner/skirmish.js':/' · NEAREST '\+VoidUnits\.fmtDist/};
 for(const [f,re] of Object.entries(files)){const s=src(f);assert.match(s,re,f);assert.doesNotMatch(s,/\)\s*\+\s*' ?[mM]( away| from you| ·)?'/,f+' has no number followed by a metre unit');}
 assert.doesNotMatch(src('void-runner/world-integration.js'),/guideMetres\(waypoint\)\)\+'m'/);
 assert.match(src('void-runner/main-story.js'),/stay within about twenty feet/);
});

test('editors show feet with "ft" labels and store metres',()=>{
 const me=src('void-runner/mission-editor.js');
 assert.match(me,/'aria-label':'Distance in feet'/);assert.match(me,/VoidUnits\.m\(di\.value,G\(\)\.nearMetres\(w\.distance\),\{min:N\.min,max:N\.max\}\)/);
 assert.match(me,/'aria-label':'Only while the player stays within \(feet\)'/);assert.match(me,/VoidUnits\.m\(parseInt\(nr\.value,10\),o\.near,\{min:1,max:50,whole:true\}\)/);
 assert.match(me,/U\.ftRange\(lim\[0\],lim\[1\]\)/);assert.match(me,/el\('span','ft behind','me-small'\)/);assert.match(me,/VoidUnits\.text\(t\)/);
 assert.doesNotMatch(me,/'metres of'|'m of'|' m\) to start it|in metres \(1 to 30\)/);
 const bv=src('void-runner/mission-blocks-view.js');assert.match(bv,/'Distance in feet'/);assert.match(bv,/VoidUnits\.ftRange\(1,50\)/);assert.doesNotMatch(bv,/'metres of '|'m of'/);
 const eh=src('void-runner/editor-home.js');assert.match(eh,/How close the player comes \(feet, 4 to 98\)/);assert.match(eh,/VoidUnits\.m\(d\.value,a\.distance\|\|5\)/);
 const mm=src('void-runner/mission-mechanics-editor.js');assert.match(mm,/numFt\('Too close \(feet\)'/);assert.match(mm,/numFt\(lost\?'Lost beyond \(feet\)':'Within \(feet\)'/);
 const cr=src('void-runner/cult-room-editor.js');assert.match(cr,/numFt\('Circle radius \(ft\)'/);assert.match(cr,/numFt\('gap in the line \(ft\)'/);
 for(const f of ['void-runner/editor-wizard.js','void-runner/mission-blocks.js','void-runner/mission-givers.js','void-runner/npc-escort.js'])assert.doesNotMatch(src(f),/\(5 m(etres)? if|within 15 m|about 2 metres behind/,f);
});
