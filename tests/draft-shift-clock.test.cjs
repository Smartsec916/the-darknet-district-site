const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const at=(h,m=0,s=0)=>Date.UTC(2026,10,19,h,m,s);


test('the street clock is the real time until a test simulates it, runs on from the simulated moment, and ends with simulate(null)',()=>{
 fresh();const S=require(R('void-runner/ncz-street-pair.js'));
 assert.equal(S.simulated(),false);assert.equal(S.streetTime(at(14)),at(14));const t=Date.now();assert.ok(Math.abs(S.streetTime()-t)<1000);
 assert.equal(S.simulate(at(3),at(14)),true);assert.equal(S.simulated(),true);
 assert.equal(S.streetTime(at(14)),at(3));assert.equal(S.streetTime(at(14,10)),at(3,10),'runs on');
 assert.equal(S.simulate(null),false);assert.equal(S.simulated(),false);assert.equal(S.streetTime(at(14)),at(14),'ends with the session');
});
