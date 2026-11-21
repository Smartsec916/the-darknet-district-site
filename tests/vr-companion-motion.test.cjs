/* Companion fixes, 17 Nov 2026 (the owner: parts disappearing up close, odd head positions, more natural movement). Pure parts of vr-companions.js. */
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../void-runner/vr-companions.js');
const DEG=Math.PI/180,head={x:0,y:1.6,z:0};
test('the head keeps its side when you are almost straight behind (no whip from one shoulder to the other)',()=>{
 const behindLeft={x:-.1,y:1.6,z:-3},behindRight={x:.1,y:1.6,z:-3};
 assert(Math.abs(C.look(0,head,behindLeft).yaw/DEG+70)<1e-9,'free choice: the near side');
 assert(Math.abs(C.look(0,head,behindLeft,C.defaults,false,1).yaw/DEG-70)<1e-9,'turned right already: stays right');
 assert(Math.abs(C.look(0,head,behindRight,C.defaults,false,-1).yaw/DEG+70)<1e-9,'turned left already: stays left');
 // well round to one side, the side is whatever is nearer
 assert(C.look(0,head,{x:-3,y:1.6,z:0},C.defaults,false,1).yaw<0);
 // still clamped to the natural range
 for(const s of [-1,0,1])for(let a=-179;a<=179;a+=7){const r=C.look(0,head,{x:Math.sin(a*DEG)*2,y:2.5,z:Math.cos(a*DEG)*2},C.defaults,false,s);assert(Math.abs(r.yaw)<=C.defaults.maxHeadYaw+1e-9&&Math.abs(r.pitch)<=C.defaults.maxHeadPitch+1e-9);}
});
test('turning on the spot eases in and out and never spins faster than turnSpeed',()=>{
 let y=0,v=0,prev=0,maxRate=0,settled=null;for(let i=0;i<240;i++){const r=C.turnStep(y,Math.PI*.9,v,1/60);maxRate=Math.max(maxRate,Math.abs(r.yaw-y)*60);y=r.yaw;v=r.v;if(r.left<.01&&settled===null)settled=i;}
 assert(maxRate<=C.turnSpeed+1e-9,'max '+maxRate);assert(Math.abs(y-Math.PI*.9)<1e-3,'arrives');assert(settled>40&&settled<200,'takes a moment: '+settled);
 const first=C.turnStep(0,1,0,1/60);assert(first.yaw<.02,'starts gently');
 // never overshoots, either way round
 for(const w of [-2.5,-.3,.3,2.5]){let yy=0,vv=0;for(let i=0;i<300;i++){const r=C.turnStep(yy,w,vv,1/30);assert(Math.abs(C.wrap(w-r.yaw))<=Math.abs(C.wrap(w-yy))+1e-9);yy=r.yaw;vv=r.v;}}
});
test('moves that use the head keep most of their own head movement',()=>{
 assert.equal(C.headWeight('vr-companion-fc1-glance-back'),.35);assert.equal(C.headWeight('head-tilt'),.55);assert.equal(C.headWeight('idle'),1);assert.equal(C.headWeight(null),1);
 assert(C.maxCorrection.yaw<=80*DEG+1e-9&&C.maxCorrection.pitch<=35*DEG+1e-9);
});
test('the culling reach covers a body standing, sitting, lying back and with arms out',()=>{
 const R=C.reach;assert(R.y[0]<0&&R.y[1]>2.2,'below the floor to above a raised hand');assert(R.x[0]<=-1.8&&R.x[1]>=1.8&&R.z[0]<=-1.8&&R.z[1]>=1.8,'a body lying down either way from its origin');
});
test('glides are smooth and end exactly where they should',()=>{assert.equal(C.glideAt(0,2,0),0);assert.equal(C.glideAt(0,2,1),2);assert.equal(C.glideAt(0,2,5),2);assert(Math.abs(C.glideAt(0,2,.5)-1)<1e-12);assert(C.glideAt(0,2,.1)<.1);});
