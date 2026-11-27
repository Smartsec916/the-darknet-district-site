/* The transition veil (void-runner/transition-veil.js): the last picture stays up while the next place loads, then crossfades; never over a transition
   that presents itself; a slow load still shows the card. Pure decision only. */
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../void-runner/transition-veil.js');
const s=o=>({mode:'',prev:'',holding:false,since:0,own:false,revealed:false,...o});
test('holds when a place the player is in starts loading another, and only then',()=>{
 for(const prev of ['walking','play','road-taxi','food-seated','vr-seated','walking-info'])for(const m of ['preparing','preparing-flight'])assert.equal(V.decide(s({prev,mode:m}),0),'hold',prev+'>'+m);
 for(const prev of ['menu','dock','pod-waking','preparing',''])assert.equal(V.decide(s({prev,mode:'preparing'}),0),null,'from '+prev+' the card shows as before');
 assert.equal(V.decide(s({prev:'walking',mode:'walking'}),0),null);
});
test('never covers a transition with its own presentation; releases when the load ends (also on failure) or one of those appears',()=>{
 assert.equal(V.decide(s({prev:'walking',mode:'preparing',own:true}),0),null);
 assert.equal(V.decide(s({mode:'walking',holding:true}),100),'release');assert.equal(V.decide(s({mode:'dock',holding:true}),100),'release','an error card');
 assert.equal(V.decide(s({mode:'preparing',holding:true,own:true}),100),'release');
});
test('a slow load shows the card (status and cancel) after the grace time',()=>{
 assert.equal(V.decide(s({mode:'preparing',holding:true,since:0}),V.GRACE_MS-1),null);assert.equal(V.decide(s({mode:'preparing',holding:true,since:0}),V.GRACE_MS+1),'reveal-card');
 assert.equal(V.decide(s({mode:'preparing',holding:true,since:0,revealed:true}),V.GRACE_MS+5000),null);
 for(const id of ['door-veil','under-veil','district-transition','milked-transition','gate-transit','landing-seq'])assert(V.OWN.includes(id),id);
});
