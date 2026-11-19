/* Draft tests run at the time Reverie or Lace is really out (the owner, 19 Nov 2026: "If I test with REVERIE or LACE make it the time they are actually there").
   ncz-street-pair.js streetTime() is the one street clock; a throwaway test session may simulate it (testClock / simulate); the draft exemption is gone. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const at=(h,m=0,s=0)=>Date.UTC(2026,10,19,h,m,s);
const REV='grey-reverie',LACE='ethereal-lace';

test('the street clock is the real time until a test simulates it, runs on from the simulated moment, and ends with simulate(null)',()=>{
 fresh();const S=require(R('void-runner/ncz-street-pair.js'));
 assert.equal(S.simulated(),false);assert.equal(S.streetTime(at(14)),at(14));const t=Date.now();assert.ok(Math.abs(S.streetTime()-t)<1000);
 assert.equal(S.simulate(at(3),at(14)),true);assert.equal(S.simulated(),true);
 assert.equal(S.streetTime(at(14)),at(3));assert.equal(S.streetTime(at(14,10)),at(3,10),'runs on');assert.equal(S.onStreet(S.streetTime(at(14))).id,REV);
 assert.equal(S.simulate(null),false);assert.equal(S.simulated(),false);assert.equal(S.streetTime(at(14)),at(14),'ends with the session');
});

test('chosen times: Reverie 03:00 UTC, Lace 15:00 UTC, or the real time when she is already out; never in the 90 s handover or near the end of her shift',()=>{
 fresh();const S=require(R('void-runner/ncz-street-pair.js'));
 let c=S.testClock([LACE],at(6));assert.equal(c.id,LACE);assert.equal(c.ms,at(15));assert.equal(c.time,'15:00');assert.equal(c.kept,false);assert.equal(c.note,"Testing at 15:00 UTC, Lace's shift.");
 c=S.testClock([REV],at(20));assert.equal(c.ms,at(3));assert.equal(c.note,"Testing at 03:00 UTC, Reverie's shift.");
 c=S.testClock([REV],at(6,30));assert.equal(c.kept,true);assert.equal(c.ms,at(6,30));assert.match(c.note,/06:30 UTC \(the real time\), Reverie's shift/);
 assert.equal(S.testClock([REV],at(0,0,40)).ms,at(3),'the handover: not the real time');assert.equal(S.testClock([LACE],at(12,1)).ms,at(15));
 assert.equal(S.testClock([LACE],at(12,1,31)).kept,true);assert.equal(S.testClock([REV],at(11,45)).ms,at(3),'shift ends in 15 minutes: not kept');
 // every chosen moment has the right one out, well clear of the handover, for every real minute of a day
 for(let m=0;m<1440;m+=7)for(const id of [REV,LACE]){const r=at(0)+m*60e3,x=S.testClock([id],r),w=S.onStreet(x.ms);assert.equal(w&&w.id,id,id+' at minute '+m);
  assert.ok(x.ms-S.shiftStart(x.ms)>=S.config.arrive*1000+60e3,'clear of the handover');assert.ok(S.nextChange(x.ms)-x.ms>=S.TEST.keep,'not about to end');}
 assert.equal(S.testClock(['admin','iris',null],at(6)),null,'neither involved: no simulated clock');assert.equal(S.testClock([],at(6)),null);
});

test('both involved: the first one used wins, with a plain notice that the other is not out',()=>{
 fresh();const S=require(R('void-runner/ncz-street-pair.js'));
 const c=S.testClock(['admin',REV,LACE,REV],at(15));assert.equal(c.id,REV);assert.equal(c.ms,at(3));assert.deepEqual(c.others,['Lace']);
 assert.equal(c.note,"Testing at 03:00 UTC, Reverie's shift. Lace isn't out then.");
 assert.equal(S.testClock([LACE,REV],at(6)).note,"Testing at 15:00 UTC, Lace's shift. Reverie isn't out then.");
});

test('everything that reads the street clock agrees under a simulated one: who is out, mission availability, shift notes, Studio 1 at Milked',()=>{
 fresh();const S=require(R('void-runner/ncz-street-pair.js')),G=require(R('void-runner/mission-givers.js'));
 const lace={id:LACE,name:'Lace',shift:{hours:[12,24],arrive:90}},rev={id:REV,name:'Reverie',shift:{hours:[0,12],arrive:90}};
 const real=Date.now(),c=S.testClock([LACE],real);S.simulate(c.ms);
 try{assert.equal(S.onStreet(S.streetTime()).id,LACE);assert.equal(G.onDuty(lace),true);assert.equal(G.onDuty(rev),false);assert.match(G.shiftText(lace),/She is out now/);
  assert.equal(G.streetTime(real)>=c.ms-1000&&G.streetTime(real)<=c.ms+1000,true);
  // milked.js chooses the OTHER resident for Studio 1 from the same clock
  global.VoidStreetPair=S;delete require.cache[R('void-runner/milked.js')];const MK=require(R('void-runner/milked.js'));assert.equal(MK.studioOnePerformer().look,'npc-grey-reverie');}
 finally{S.simulate(null);delete global.VoidStreetPair;}
});

test('the draft exemption is gone; the editor sets the clock for every draft test; dev-test resets it per session and on leaving; the banner shows both clocks',()=>{
 const sp=fs.readFileSync(R('void-runner/ncz-street-pair.js'),'utf8'),ed=fs.readFileSync(R('void-runner/mission-editor.js'),'utf8'),dt=fs.readFileSync(R('void-runner/dev-test.js'),'utf8'),mc=fs.readFileSync(R('void-runner/mission-content.js'),'utf8');
 assert.doesNotMatch(sp,/VoidStreetPair\?\.force|force:null/);assert.match(sp,/const out=\(\)=>onStreet\(now\(\),cfg\);/);assert.match(sp,/now:clockFn=\(\)=>streetTime\(\)/);
 assert.doesNotMatch(mc,/env\.draft\)return true/);assert.doesNotMatch(ed,/VoidStreetPair\.force/);
 assert.match(ed,/build:\(\)=>\{jumpTo\.notes=streetClock\(\[npc\]\)/,'Jump there / See it on the street / NPC-tab plays');
 assert.match(ed,/notes\.push\(\.\.\.streetClock\(\[m\.giver,nw\.kind==='near'\?nw\.npc:null,\.\.\.m\.objectives\.flatMap\(o=>\[o\.npc,\.\.\.\(o\.subjects\|\|\[\]\)\]\),m\.ending&&m\.ending\.npc\]\)\)/,'PLAY THIS DRAFT / PLAY IT NOW');
 assert.equal((ed.match(/clock:clockText/g)||[]).length,2);assert.match(ed,/'Street '\+S\.utcLabel\(S\.streetTime\(\)\)\+' UTC'/);assert.match(ed,/'In-game '\+GC\.now\(state\)\.label/);
 assert.match(dt,/panel\.hidden=true;globalThis\.VoidStreetPair\?\.simulate\?\.\(null\);/);assert.match(dt,/function exit\(\)\{globalThis\.VoidStreetPair\?\.simulate\?\.\(null\);location\.reload\(\);\}/);
 // never saved: nothing in the street pair writes the save or storage
 assert.doesNotMatch(sp,/story\.flags|localStorage|sessionStorage/);
});
