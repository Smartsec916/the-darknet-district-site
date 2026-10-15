const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../void-runner/music-director.js'),S=require('../void-runner/music-score.js'),U=require('../void-runner/universe.js');
const walk=(location,x,z,extra={})=>({mode:'walking',location,walker:{x,z},layoutKind:location==='earth'?'city':'station',...extra});
function settle(d,c,seconds=3){let r;for(let t=0;t<seconds;t+=.1)r=D.step(d,c,.1);return r;}

test('every location in the game has its own musical identity',()=>{
  for(const id of Object.keys(U.locations))assert(S.styles[D.zoneStyle({mode:'dock',location:id})],'style for '+id);
  const picked=new Set(Object.keys(U.locations).map(id=>D.zoneStyle({mode:'dock',location:id})));
  assert(picked.has('communion')&&picked.has('natural-order')&&picked.has('vesper')&&picked.has('meridian'));
  assert.notEqual(D.zoneStyle({mode:'dock',location:'vigil'}),D.zoneStyle({mode:'dock',location:'holdfast'}));
});
test('every style is playable: valid key, harmony and known layer types',()=>{
  const types=new Set(['pad','strings','choir','keys','drone','cluster','bass','arp','motif','swell','metal','kick','snare','clap','hat','tom']);
  for(const [id,s] of Object.entries(S.styles)){
    assert(S.modes[s.mode],id+' mode');assert(s.bpm>=40&&s.bpm<=140,id+' tempo');assert(s.prog.length>0&&s.mood,id+' harmony and description');
    for(const l of S.layersFor(s,2,1)){assert(types.has(l.type),id+' layer '+l.type);if(l.pattern)assert.equal(l.pattern.length,16,id+' '+l.type+' pattern');}
  }
});
test('District zones are distinguished by where the player stands',()=>{
  assert.equal(D.zoneStyle(walk('earth',0,-40)),'neochinatown');
  assert.equal(D.zoneStyle(walk('earth',1,23)),'district-entry');
  assert.equal(D.zoneStyle(walk('earth',0,32)),'district-hall');
  assert.equal(D.zoneStyle(walk('earth',10,47)),'district-store');
  assert.equal(D.zoneStyle(walk('earth',-9,40)),'district-arcade');
  assert.equal(D.zoneStyle(walk('earth',-12.5,62.5)),'district-rest');
  assert.equal(D.zoneStyle(walk('earth',30,68)),'district-terrace');
});
test('walking between District zones waits a moment so the music never flickers',()=>{
  const d=D.create();settle(d,walk('earth',0,32));assert.equal(d.style,'district-hall');
  D.step(d,walk('earth',10,47),.5);assert.equal(d.style,'district-hall','still holding');
  D.step(d,walk('earth',0,32),.5);D.step(d,walk('earth',10,47),.5);assert.equal(d.style,'district-hall','a brief step in and out never switches');
  settle(d,walk('earth',10,47),2);assert.equal(d.style,'district-store');
});
test('big context changes switch at once',()=>{
  const d=D.create();settle(d,walk('meridian',0,0));assert.equal(D.step(d,{mode:'play',location:'meridian',phase:'align'},.1).style,'space');
  assert.equal(D.step(d,{mode:'play',location:'meridian',phase:'warp'},.1).style,'warp');
  assert.equal(D.step(d,{mode:'menu'},.1).style,'theme');
});
test('faction space has its own colour and combat keeps its cooldown',()=>{
  const d=D.create();assert.equal(D.step(d,{mode:'play',system:'communion',phase:'align'},.1).style,'space-cantor');
  assert.equal(D.step(d,{mode:'play',system:'natural-order',phase:'align'},.1).style,'space-garrow');
  assert.equal(D.step(d,{mode:'play',system:'erebus',phase:'align',combat:true},.1).intensity,2);
  const after=D.step(d,{mode:'play',system:'erebus',phase:'align'},1);assert.equal(after.intensity,1,'post-combat cooldown');
  assert.equal(settle(d,{mode:'play',system:'erebus',phase:'align'},D.config.combatCooldown+1).intensity,0,'then calm again');
});
test('watching a faction battle adds tension, never player-combat music',()=>{
  const r=D.step(D.create(),{mode:'play',system:'communion',phase:'align',battle:true},.1);
  assert.equal(r.tension,1);assert(r.intensity<2);
});
test('bar music comes from in-world speakers and fades with distance',()=>{
  const near=D.speaker(walk('meridian',0,58)),mid=D.speaker(walk('meridian',0,45)),far=D.speaker(walk('meridian',0,10));
  assert.equal(near.style,'dead-channel');assert.equal(near.level,1);assert(mid.level>0&&mid.level<1);assert.equal(far,null);
  assert.equal(D.speaker(walk('earth',10,38)).style,'district-bar');
  assert.equal(D.speaker(walk('earth',10,46.5)),null,'the bar music stays out of Admin and Iris’s store');
  assert.equal(D.speaker({mode:'play',location:'meridian'}),null,'no bar speakers in flight');
});
test('dialogue ducks the music without stopping it',()=>{
  const r=D.step(D.create(),{...walk('earth',10,46),mode:'dialogue',dialogue:true},.1);assert.equal(r.duck,D.config.dialogueDuck);assert(r.style);
});
test('the VOID//RUNNER motif and harmony resolve to real notes in every style',()=>{
  for(const s of Object.values(S.styles)){const notes=S.motif.map(i=>S.midi(s,i));assert(notes.every(n=>n>=24&&n<=96));assert.equal(S.triad(s,S.chord(s,0)).length,3);}
});
