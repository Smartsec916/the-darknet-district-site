const test=require('node:test'),assert=require('node:assert/strict');
const Reveal=require('../void-runner/navigation-reveal.js'),Explorer=require('../void-runner/exploration-controller.js'),Data=require('../void-runner/exploration-data.js'),Escort=require('../void-runner/escort.js'),C=require('../void-runner/campaign.js');
test('navigation reveal waits two active seconds, fades and resets for a new area',()=>{
 const clock=Reveal.create();for(let i=0;i<199;i++)Reveal.step(clock,.01,'departure');assert.equal(Reveal.opacity(clock),0);Reveal.step(clock,10,'departure',false);assert.equal(Reveal.opacity(clock),0);Reveal.step(clock,.22,'departure');assert(Reveal.opacity(clock)>.49);Reveal.step(clock,0,'encounter-clear');assert.equal(Reveal.opacity(clock),0);Reveal.step(clock,2.5,'encounter-clear');assert.equal(Reveal.opacity(clock),1);
});
test('walking controller blocks walls and diagonal sprint cannot tunnel or accelerate',()=>{
 const room=Data.locations.hangar,p={x:0,y:1.7,z:-15,yaw:0};for(let i=0;i<600;i++)Explorer.step(p,{x:1,z:0,run:true},.1,room);assert(p.x<room.bounds[0]);assert(!Explorer.blocked(p.x,p.z,room));
 const a={x:0,z:0,yaw:0},b={...a};Explorer.step(a,{x:0,z:1},.1,room);Explorer.step(b,{x:1,z:1},.1,room);assert(Math.abs(Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))<1e-8);
 const ship={x:-7,z:-12,yaw:0};for(let i=0;i<60;i++)Explorer.step(ship,{x:0,z:1,run:true},.1,room);assert(ship.z< -10.5);
});
test('interaction requires range, facing and unobstructed line of sight',()=>{
 const room=Data.locations.hangar,p={x:3,z:2,yaw:0};assert.equal(Explorer.select(p,room)?.id,'rook');p.yaw=Math.PI;assert.equal(Explorer.select(p,room),null);p.z=-10;p.yaw=0;assert.equal(Explorer.select(p,room),null);
 const blocked={bounds:[10,10],solids:[{position:[0,1,1],size:[3,2,.3]}],interactions:[{id:'through-wall',position:[0,1,2],range:4}]};assert.equal(Explorer.select({x:0,z:0,yaw:0},blocked),null);
});
test('escort rendezvous, transit, distance hold, distress and loss are reusable',()=>{
 const e=Escort.create();Escort.step(e,1,{x:0,y:0,z:12},{x:0,y:0,z:1},false);assert.equal(e.status,'transit');assert(e.progress>0);const progress=e.progress;Escort.step(e,1,{x:0,y:0,z:12},{x:0,y:0,z:1},true);assert.equal(e.status,'defending');assert.equal(e.progress,progress);assert(e.distress);e.z=200;Escort.step(e,1,{x:0,y:0,z:0},{x:0,y:0,z:1},false);assert.equal(e.status,'waiting');Escort.damage(e,101);assert(e.dead);assert.equal(e.status,'lost');
});
test('Sol unlock and landing definitions preserve an existing campaign save',()=>{
 const s=C.fresh();assert(!Data.solAvailable(s));s.quest='open';trained(s);assert(Data.solAvailable(s));s.story.flags.solDestination='earth';s.credits=321;const restored=C.restore(JSON.stringify(s));assert.equal(restored.credits,321);assert.equal(restored.location,'meridian');assert.equal(restored.story.flags.solDestination,'earth');assert.deepEqual(Data.systems.sol.destinations,['earth','mars']);for(const d of Object.values(Data.destinations))assert(Data.locations[d.location]);
});
test('GLB validation rejects remote asset references and implicit decoder dependencies',()=>{
 const Assets=require('../void-runner/asset-pipeline.js');
 function file(data){let json=JSON.stringify(data);json+=' '.repeat((4-json.length%4)%4);const bytes=new TextEncoder().encode(json),out=new ArrayBuffer(20+bytes.length),v=new DataView(out);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,out.byteLength,true);v.setUint32(12,bytes.length,true);v.setUint32(16,0x4e4f534a,true);new Uint8Array(out,20).set(bytes);return out;}
 assert.equal(Assets.validate(file({asset:{version:'2.0'},buffers:[]})).asset.version,'2.0');assert.throws(()=>Assets.validate(file({images:[{uri:'https://remote.invalid/texture.png'}]})),/self-contained/);assert.throws(()=>Assets.validate(file({extensionsUsed:['KHR_draco_mesh_compression']})),/decoder/);assert.throws(()=>Assets.validate(new ArrayBuffer(4)));
});

function trained(s){const P=require('../void-runner/progression.js');for(const f of P.flags)s.progression.flags[f]=true;s.progression.completed=true;s.progression.equipment.owned=['cooling'];s.missileOfferSeen=true;s.progression.checkpoint={location:s.location};return s;}
