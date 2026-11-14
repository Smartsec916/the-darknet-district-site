/* Local progress (browser-kept counters): they only go up by reported events, a goal is reached once, a stored record is cleaned on the way in, and nothing here unlocks an achievement. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../void-runner/local-progress.js'),Catalogue=require('../void-runner/achievements.js');
test('catching fish counts up; the hundredth reaches the goal, once',()=>{
 const r=A.restore(null);for(let i=0;i<99;i++)assert.deepEqual(A.add(r,'tropical-fish',1,'2026-11-12'),[]);
 assert.equal(A.list(r)[0].progress,99);assert.equal(A.list(r)[0].earned,null);assert.match(A.lines(r)[0],/99 of 100/);
 assert.deepEqual(A.add(r,'tropical-fish',1,'2026-11-12'),['tropical-100-fish']);assert.deepEqual(A.add(r,'tropical-fish',1,'2026-11-13'),[],'not earned twice');
 assert.equal(A.list(r)[0].earned,'2026-11-12');assert.match(A.lines(r)[0],/^Tropical Escape · Catch 100 Fish · 100 of 100 · reached 2026-11-12 \(progress kept in this browser\)$/);assert.doesNotMatch(A.lines(r)[0],/unlocked|earned/i,'it never claims the achievement');
});
test('unknown counters, odd amounts and tampered records are refused or cleaned',()=>{
 const r=A.restore(null);assert.deepEqual(A.add(r,'made-up',1),[]);assert.deepEqual(A.add(r,'tropical-fish',-3),[]);assert.deepEqual(A.add(r,'tropical-fish',1.5),[]);assert.deepEqual(r.counters,{});
 A.add(r,'tropical-fish',1e9);assert.equal(r.counters['tropical-fish'],5,'one event can never add more than a handful');
 const dirty=A.restore(JSON.stringify({counters:{'tropical-fish':'lots','x':9},earned:{'tropical-100-fish':'<b>yes</b>','other':'2026-01-01'}}));assert.deepEqual(dirty,{counters:{},earned:{}});
 assert.deepEqual(A.restore('not json'),{counters:{},earned:{}});assert.deepEqual(A.lines(A.restore(null)),[],'nothing is shown before anything was done');
});
test('every definition is complete, and the script ships once in both copies of the page before the device',()=>{
 for(const d of A.DEFS)for(const k of ['id','game','gameTitle','title','description','counter','goal'])assert(d[k],d.id+' has '+k);
 for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(f,'utf8');assert.equal(h.split('void-runner/local-progress.js').length,2);assert(h.indexOf('void-runner/local-progress.js')<h.indexOf('void-runner/personal-device.js'));}
 assert.match(fs.readFileSync('void-runner/vr-tropical.js','utf8'),/VoidLocalProgress\?\.count\('tropical-fish',1\)/,'the fishing spot reports each fish landed');
});
test('the goal has a matching entry in the achievement catalogue, which still only unlocks on server-verified events',()=>{
 const defs=Catalogue.definitions||Catalogue.DEFINITIONS,d=defs.find(x=>x.id==='tropical-100-fish');assert(d,'in the catalogue');assert.equal(d.description,'Catch 100 fish in Tropical Escape.');assert.equal(d.condition.count,100);
 const events=Array.from({length:100},()=>({type:'vr_fish_landed',data:{world:'tropical'}}));assert.equal(Catalogue.preview(d,events).unlocked,false,'unverified events unlock nothing');
 assert.equal(Catalogue.preview(d,events.map(e=>({...e,verified:true}))).unlocked,true);
});
