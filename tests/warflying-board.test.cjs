const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const B=require('../void-runner/warflying-board.js'),S=require('../void-runner/signals.js'),R=require('../void-runner/relay.js');
const doc=fs.readFileSync(path.join(__dirname,'../docs/void-runner/design-source/12-street-advertisements-david.md'),'utf8');
const monday=w=>new Date(Date.UTC(2026,0,5)+w*7*864e5);

test('the handle list is the owner’s two batches, verbatim, with the repeats removed',()=>{
  const first=/board \(verbatim\): (.*?)\.\n/.exec(doc)[1].split(', '),second=/repeat the first batch\): (.*?)\.\n/.exec(doc)[1].split(', ');
  assert.deepEqual(B.HANDLES,[...new Set([...first,...second])]);assert.equal(new Set(B.HANDLES).size,B.HANDLES.length);
  assert.ok(B.HANDLES.includes('DirtyCircuit')&&B.HANDLES.includes('DirtyCircuits'),'two different handles of his, both kept');
});
test('the week is the ISO week, in UTC',()=>{
  assert.equal(B.weekOf(new Date(Date.UTC(2026,10,16,0,0))).key,'2026-W47');assert.equal(B.weekOf(new Date(Date.UTC(2026,10,22,23,59))).key,'2026-W47');
  assert.equal(B.weekOf(new Date(Date.UTC(2026,10,23,0,0))).key,'2026-W48');
  assert.equal(B.weekOf(new Date(Date.UTC(2027,0,1))).key,'2026-W53');assert.equal(B.weekOf(new Date(Date.UTC(2024,11,30))).key,'2025-W01');
});
test('the board is the same for everyone in a week and different the next week',()=>{
  const a=B.five(new Date(Date.UTC(2026,10,17,9))),b=B.five(new Date(Date.UTC(2026,10,17,9)));assert.deepEqual(a,b);assert.equal(a.length,5);
  // a fresh copy of the module (another player's machine) agrees
  delete require.cache[require.resolve('../void-runner/warflying-board.js')];const other=require('../void-runner/warflying-board.js');
  assert.deepEqual(other.five(new Date(Date.UTC(2026,10,17,9))),a);
  assert.deepEqual(B.five(new Date(Date.UTC(2026,10,16,0,0,1))).map(r=>r.name).sort(),B.five(new Date(Date.UTC(2026,10,22,23,59))).map(r=>r.name).sort(),'the same five all week');
  assert.notDeepEqual(B.five(new Date(Date.UTC(2026,10,24,9))).map(r=>r.name),a.map(r=>r.name));
});
test('number one is always one of the owner’s, is never overtaken by the other four, and changes from week to week',()=>{
  let last=null;const tops=new Set();
  for(let w=0;w<300;w++){const plan=B.plan(B.weekOf(monday(w)));assert.ok(B.isOwnerHandle(plan[0].name));assert.notEqual(plan[0].name,last,'not the same handle two weeks running');last=plan[0].name;tops.add(last);
   for(const h of [0,30,90,167]){const rows=B.five(new Date(monday(w).getTime()+h*36e5));assert.equal(rows[0].name,plan[0].name);assert.ok(rows[0].points>rows[1].points);
    assert.equal(new Set(rows.map(r=>r.name)).size,5);assert.ok(rows.every(r=>Number.isSafeInteger(r.points)&&r.points>0&&r.points<S.all().length&&r.name.length<=24));}}
  assert.ok(tops.size>40,'most of his handles get a turn');
});
test('places two to five mostly come from the generator; only the owner’s handles ever change place',()=>{
  let made=0,owner=0,moves=0;
  for(let w=0;w<300;w++){const plan=B.plan(B.weekOf(monday(w)));for(const p of plan.slice(1)){if(p.kind==='owner'){owner++;assert.ok(B.isOwnerHandle(p.name));}else{made++;assert.ok(!B.isOwnerHandle(p.name));}}
   let prev=null;for(let h=0;h<=168;h+=4){const rows=B.ranked(0,'YOU',new Date(monday(w).getTime()+Math.min(h,167.9)*36e5));if(prev)for(const m of R.moments(prev,rows)){moves++;assert.ok(B.isOwnerHandle(m.vars.name),m.vars.name);}prev=rows;}}
  assert.ok(made>owner,'more generated than the owner’s');assert.ok(owner>0);assert.ok(moves>50,'the radio’s WarFlying commentary still has real changes to report');
});
test('generated handles: plausible, some end in two digits, none is one of the owner’s, none is rude, none is a name',()=>{
  const all=B.sample(600,3);assert.equal(new Set(all).size,600);
  assert.ok(all.every(h=>/^[A-Za-z]+(_[A-Za-z]+)?\d{0,2}$/.test(h)&&h.length>=4&&h.length<=24),'letters, at most one underscore, at most two digits');
  const digits=all.filter(h=>/\d\d$/.test(h)).length;assert.ok(digits>180&&digits<480,'a good share look like login handles ending in two digits: '+digits);
  assert.ok(all.some(h=>B.PLAIN.includes(h.replace(/\d+$/,''))),'some plain ones');assert.ok(!all.some(B.isOwnerHandle));
  // every word the generator can use is on the lists, and the lists hold nothing from a short list of words that must never appear
  const banned=/slut|whore|bitch|perv|pimp|condom|virgin|gspot|booty|nasty|sinner|flesh|moist|kill|rape|nazi|fuck|shit|cunt|dick|cock|tits|sex|porn|damn|hell|god|jesus/i;
  for(const w of [...B.FIRST,...B.SECOND,...B.PLAIN])assert.ok(!banned.test(w),w);
  assert.deepEqual(B.sample(20,9),B.sample(20,9),'the same seed gives the same handles');
});
test('only five are shown; the player is measured against them; the voice names only number one',()=>{
  const when=new Date(Date.UTC(2026,10,18,15)),five=B.five(when);
  const out=B.standings(0,'YOU',when);assert.equal(out.header,'WARFLYING LEADERSHIP BOARD');assert.equal(out.rows.length,5);assert.ok(!out.rows.some(r=>r.player));
  assert.deepEqual(out.you,{name:'YOU',points:0,rank:null});assert.equal(out.spoken,five[0].name);assert.ok(B.isOwnerHandle(out.spoken));
  const mid=B.standings(five[2].points+1,'Pilot_7',when);assert.equal(mid.rows.length,5);assert.equal(mid.you.rank,3);assert.equal(mid.rows[2].name,'Pilot_7');assert.ok(!mid.rows.some(r=>r.name===five[4].name),'the fifth handle drops off');
  assert.equal(mid.spoken,five[0].name);
  const tie=B.standings(five[0].points,'Pilot_7',when);assert.equal(tie.you.rank,2,'a tie goes to the handle who got there first');
  const top=B.standings(five[0].points+1,'Pilot_7',when);assert.equal(top.first.name,'Pilot_7');assert.equal(top.spoken,'a new number one');assert.equal(B.NEW_ONE,'a new number one');
  assert.equal(B.standings(1,'x'.repeat(60),when).you.name.length,24);
});
