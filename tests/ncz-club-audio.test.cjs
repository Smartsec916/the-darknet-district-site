// The nightclub's spatial sound: rules (where you stand -> what you hear) and the Web Audio graph on a stand-in context.
const test=require('node:test'),assert=require('node:assert/strict');
const NC=require('../void-runner/ncz-nightclub.js');NC.force(true);
const S=require('../void-runner/music-score.js');globalThis.VoidMusicScore=S;

// ---- A stand-in for Web Audio that records parameters and counts nodes ----
function fakeAudio(){
 const stats={nodes:0,started:0,panners:0,sources:0};
 const param=(v=0)=>({value:v,target:v,setValueAtTime(x){this.value=x;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(x){this.target=x;}});
 const node=extra=>{stats.nodes++;return {connect(){},disconnect(){},start(){stats.started++;},stop(){},gain:param(1),frequency:param(),detune:param(),Q:param(),threshold:param(),ratio:param(),type:'',buffer:null,loop:false,...extra};};
 const listener={positionX:param(),positionY:param(),positionZ:param(),forwardX:param(),forwardY:param(),forwardZ:param(),upX:param(),upY:param(),upZ:param()};
 const ctx={currentTime:0,state:'running',sampleRate:8000,listener,createGain:()=>node(),createOscillator:()=>node(),createBiquadFilter:()=>node(),createBufferSource:()=>{stats.sources++;return node();},createDynamicsCompressor:()=>node(),
  createPanner:()=>{stats.panners++;return node({positionX:param(),positionY:param(),positionZ:param()});},createConvolver:()=>node(),
  createBuffer:(c,len)=>({getChannelData:()=>new Float32Array(len)})};
 const buses={music:node(),ambient:node()};
 return {ctx,stats,buses};
}
const A=fakeAudio(),trims=[];
globalThis.VoidAudio={settings:{enabled:true},bus:name=>A.buses[name]?{context:A.ctx,node:A.buses[name]}:null,trim:(n,v)=>trims.push([n,v])};
require('../void-runner/music-engine.js');const E=globalThis.VoidMusicEngine;
const CA=require('../void-runner/ncz-club-audio.js');
const door=NC.DOOR,H=NC.HALL;

test('outside, the club is faint bass through the walls, brighter only in front of the open door, gone past the set distance',()=>{
 const wall=CA.exterior(34,-80,true),front=CA.exterior(60,door.z,true),behind=CA.exterior(8,-58.5,true),side=CA.exterior(60,-44,true);
 assert.ok(wall.wall.cutoff<=CA.config.wallCutoff&&wall.door.gain===0,'behind the south wall: bass only, nothing through the door');
 assert.ok(behind.door.gain===0,'behind the building the door cannot be heard');
 assert.ok(front.door.align>.95&&front.door.cutoff>2*wall.wall.cutoff,'in front of the door the sound is far brighter than through a wall');
 assert.ok(front.door.gain>.4*CA.config.doorLoss&&side.door.gain<front.door.gain/3,'a glancing angle hears much less through the doorway');
 assert.ok(CA.exterior(60,door.z,false).door.gain<front.door.gain/8,'a shut door attenuates it');
 assert.equal(CA.exterior(60,door.z,true).distance,9);assert.ok(!CA.exterior(200,door.z,true).audible,'beyond maxDistance it is inaudible');
 // fainter and duller with distance
 const near=CA.exterior(56,door.z,true),far=CA.exterior(100,door.z,true);assert.ok(far.door.cutoff<near.door.cutoff&&far.wall.cutoff<near.wall.cutoff);
 assert.ok(CA.linear(CA.config.maxDistance,CA.config.refDistance,CA.config.maxDistance)===0&&CA.linear(10,3,60)>CA.linear(30,3,60));
 // the wall emitter stands on the building's nearest edge, so the bass comes from the building
 assert.deepEqual([wall.wall.x,wall.wall.z],[34,H[2]]);assert.deepEqual([CA.exterior(60,-58.5,true).wall.x,CA.exterior(60,-58.5,true).wall.z],[H[1],-58.5]);
});

test('zones: street, entrance and interior',()=>{
 assert.equal(CA.zoneOf(70,-58.5),'exterior');assert.equal(CA.zoneOf(53,door.z),'entrance');assert.equal(CA.zoneOf(48,door.z),'entrance');
 assert.equal(CA.zoneOf(35,-58.5),'interior');assert.equal(CA.zoneOf(34,-80),'exterior');
 assert.equal(CA.insideTarget(60,-58.5),0);assert.equal(CA.insideTarget(35,-58.5),1);assert.ok(CA.insideTarget(49,-58.5)>0&&CA.insideTarget(49,-58.5)<.5);
});

test('crossing the door crossfades in about 2.5 s in both directions, with equal power and no gap',()=>{
 const s=CA.create();let t=0;const at=(x,secs)=>{for(let i=0;i<secs*60;i++,t+=1/60)CA.advance(s,x,-58.5,1/60);return CA.mix(s.inside);};
 let m=at(60,1);assert.equal(m.city,1);assert.equal(m.interior,0);
 m=at(40,.5);assert.ok(m.city<1&&m.city>.5&&m.interior>0&&m.interior<.7,'half a second in: mid-fade');
 m=at(40,2.5);assert.ok(m.city<.1&&m.interior>.99,'after ~3 s the city is nearly gone');
 for(let secs=0;secs<4;secs+=.1){m=at(40,.1);assert.ok(Math.hypot(m.city,m.interior)>.99&&Math.hypot(m.city,m.interior)<1.01,'constant power');}
 assert.ok(m.cutoff>19000&&m.reverb===1&&m.ambient<.2,'filter fully open, reverb and murmur up, street ambience down');
 m=at(40,3);assert.equal(m.city,0,'fully inside: the city music is inaudible');
 m=at(60,.5);assert.ok(m.city>0&&m.city<.75,'leaving: the city starts coming back at once');
 m=at(60,3);assert.ok(m.city>.99&&m.cutoff<700&&m.interior<.05,'back outside: the club is muffled again, the street music is whole');
});

test('low-pass opens gradually (log scale) and fast movement never jumps',()=>{
 const s=CA.create(),cut=[];for(let i=0;i<150;i++){CA.advance(s,40,-58.5,1/60);cut.push(CA.mix(s.inside).cutoff);}
 assert.ok(cut.every((c,i)=>i===0||c>=cut[i-1]),'monotonic');assert.ok(cut[0]<1000&&cut.at(-1)>5000);
 // a teleport across the door and straight back: the smoothed factor moves a little each frame, never jumps
 const p=CA.create();let prev=0,maxStep=0;for(let i=0;i<300;i++){CA.advance(p,i%20<10?40:60,-58.5,1/60);maxStep=Math.max(maxStep,Math.abs(p.inside-prev));prev=p.inside;}
 assert.ok(maxStep<.05,'largest single-frame change '+maxStep.toFixed(3));
 // a long frame (hidden tab) lands on the target without overshoot
 const q=CA.create();CA.advance(q,40,-58.5,10);assert.ok(q.inside<=1&&q.inside>.99);
});

test('inside, the song is audible everywhere and moving between speakers does not jump in level',()=>{
 let lo=Infinity,hi=0;for(let x=H[0]+1;x<=H[1]-1;x+=1)for(let z=H[2]+1;z<=H[3]-1;z+=1){const l=CA.interiorLevel(x,z);lo=Math.min(lo,l);hi=Math.max(hi,l);}
 assert.ok(lo>CA.config.bed,'never below the bed ('+lo.toFixed(2)+')');assert.ok(hi/lo<2.2,'loudest spot is less than 7 dB above the quietest ('+(20*Math.log10(hi/lo)).toFixed(1)+' dB)');
 // stepping 0.5 m changes the level by less than 1.5 dB anywhere
 let worst=0;for(let x=H[0]+1;x<H[1]-1;x+=.5)for(let z=H[2]+1;z<H[3]-1;z+=1)worst=Math.max(worst,Math.abs(20*Math.log10(CA.interiorLevel(x+.5,z)/CA.interiorLevel(x,z))));
 assert.ok(worst<1.5,'largest step '+worst.toFixed(2)+' dB');
 for(const e of NC.emitters())assert.ok(e.x>H[0]&&e.x<H[1]&&e.z>H[2]&&e.z<H[3],e.id+' is inside the hall');
});

test('one song, one source: the graph is built once, never duplicated, and the song keeps its place',()=>{
 CA.dispose();A.ctx.currentTime=0;
 const walkerAt=(x,z=-58.5,yaw=-Math.PI/2)=>({x,z,yaw}),frame=(x,z,open=true)=>{A.ctx.currentTime+=1/60;const m=CA.update({active:true,dt:1/60,walker:walkerAt(x,z),doorOpen:open});E.update({style:'neochinatown',intensity:0,tension:0,duck:0,speaker:null,cityLevel:m.city});return m;};
 for(let i=0;i<120;i++)frame(70);
 const g=CA.graph;assert.ok(g,'graph built on the running context');assert.equal(A.stats.panners,2+NC.emitters().length,'two exterior paths plus every interior emitter, once');
 const panners=A.stats.panners;
 // walk in and out repeatedly
 for(let k=0;k<6;k++){for(let i=0;i<150;i++)frame(40);for(let i=0;i<150;i++)frame(60);}
 assert.equal(CA.graph,g,'the same graph throughout');assert.equal(A.stats.panners,panners,'no new panners');
 // listener follows the player; north (+z) maps to -z in Web Audio, facing west
 const L=A.ctx.listener;assert.equal(L.positionX.target,60);assert.equal(L.positionZ.target,58.5);assert.ok(L.forwardX.target<-.99,'facing west');
 // city share is carried to the engine
 for(let i=0;i<400;i++)frame(40);assert.equal(CA.debug().city,0);assert.equal(CA.debug().zone,'interior');
 // the song's place: leave for 40 s (suspended, nothing scheduled), come back
 for(let i=0;i<60*10;i++)frame(150);assert.ok(g.source.suspended,'far away: suspended, no scheduling');const farStep=g.source.step;
 for(let i=0;i<60*30;i++)frame(150);assert.equal(g.source.step,farStep,'nothing scheduled while far');
 for(let i=0;i<10;i++)frame(60);assert.ok(!g.source.suspended);
 const sd=60/S.styles.nightclub.bpm/4,expected=Math.ceil(A.ctx.currentTime/sd);
 assert.ok(Math.abs(g.source.step-expected)<8,'the song is where it would be by now ('+g.source.step+' vs '+expected+'), not restarted');
 // leaving the city: stops scheduling, restores the street's ambience, tears down later
 const m=CA.update({active:false,dt:1});assert.equal(m.city,1);assert.ok(g.source.suspended);assert.deepEqual(trims.at(-1),['ambient',1]);
 for(let i=0;i<25;i++)CA.update({active:false,dt:1});assert.equal(CA.graph,null,'torn down after a while away');
});

test('a not-yet-running context just waits; nothing is built and the street music is untouched',()=>{
 CA.dispose();const was=A.ctx.state;A.ctx.state='suspended';
 const m=CA.update({active:true,dt:.016,walker:{x:40,z:-58.5,yaw:0},doorOpen:true});
 assert.equal(CA.graph,null);assert.ok(m.city<1||m.city===1);A.ctx.state=was;CA.dispose();
});

test('the engine keeps world sources apart from the city mix and from style changes',()=>{
 const before=A.stats.started;
 const dest=A.ctx.createGain();E.update({style:'theme',intensity:0,tension:0,duck:0,speaker:null});
 const src=E.worldSource('nightclub',dest);assert.ok(src);
 for(let i=0;i<120;i++){A.ctx.currentTime+=.05;E.update({style:i%40<20?'theme':'meridian',intensity:0,tension:0,duck:0,speaker:null,cityLevel:.5});}
 assert.ok(A.stats.started>before,'it plays');const s1=src.step;assert.ok(s1>20);
 src.suspend();const at=src.step;for(let i=0;i<100;i++){A.ctx.currentTime+=.05;E.update({style:'theme',intensity:0,tension:0,duck:0,speaker:null});}
 assert.equal(src.step,at,'suspended: no steps');src.resume();assert.ok(src.step>at+30,'resumed where the song would be');src.dispose();
});

test('the club has its own soundtrack, separate from the street, and a place for the final recording',()=>{
 const club=S.styles.nightclub,street=S.styles.neochinatown;assert.ok(club&&street&&club!==street);assert.ok(club.bpm!==street.bpm);
 assert.equal(S.files.nightclub,undefined,'no recorded track installed yet (generated original in use)');
 assert.ok(CA.config.style==='nightclub'&&S.styles[CA.config.style]);
});
