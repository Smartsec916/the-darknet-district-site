const test=require('node:test'),assert=require('node:assert/strict');
// A minimal stand-in for Web Audio, counting the nodes the engine creates.
function fakeAudio(){
  const stats={nodes:0,started:0};
  const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
  const node=extra=>{stats.nodes++;return {connect(){},disconnect(){},start(){stats.started++;},stop(){},gain:param(),frequency:param(),detune:param(),Q:param(),threshold:param(),ratio:param(),type:'',buffer:null,loop:false,...extra};};
  const ctx={currentTime:0,state:'running',sampleRate:8000,createGain:()=>node(),createOscillator:()=>node(),createBiquadFilter:()=>node(),createBufferSource:()=>node(),createDynamicsCompressor:()=>node(),
    createBuffer:(c,len)=>({getChannelData:()=>new Float32Array(len)})};
  return {ctx,stats,bus:node()};
}
const S=require('../void-runner/music-score.js');globalThis.VoidMusicScore=S;
const audio=fakeAudio();globalThis.VoidAudio={bus:()=>({context:audio.ctx,node:audio.bus})};
require('../void-runner/music-engine.js');const E=globalThis.VoidMusicEngine;
const target=(style,intensity=0,extra={})=>({style,intensity,tension:0,duck:0,speaker:null,...extra});
function play(style,seconds,intensity=0){for(let t=0;t<seconds;t+=.05){audio.ctx.currentTime+=.05;E.update(target(style,intensity));}}

test('every style plays notes and stays light enough for low-powered hardware',()=>{
  for(const id of Object.keys(S.styles)){
    E.stop();play('space',4);const before=audio.stats.nodes,startedBefore=audio.stats.started;
    play(id,6,2);const perSecond=(audio.stats.nodes-before)/6;
    assert(audio.stats.started>startedBefore,id+' plays');assert(perSecond<450,id+' creates '+perSecond.toFixed(0)+' audio nodes per second');
  }
});
test('a flickering state never piles up music, even with a frozen clock',()=>{
  E.stop();const before=audio.stats.nodes;
  for(let i=0;i<400;i++)E.update(target(i%2?'theme':'meridian'));
  assert(audio.stats.nodes-before<4000,'bounded: '+(audio.stats.nodes-before)+' nodes');
  assert(['theme','meridian'].includes(E.current));
});
test('switching style crossfades to the new one; bar speakers come and go',()=>{
  E.stop();play('district-hall',2);assert.equal(E.current,'district-hall');
  for(let t=0;t<1;t+=.05){audio.ctx.currentTime+=.05;E.update(target('district-hall',0,{speaker:{style:'district-bar',level:.8}}));}
  assert.equal(E.speaker,'district-bar');
  for(let t=0;t<1;t+=.05){audio.ctx.currentTime+=.05;E.update(target('district-store'));}
  assert.equal(E.current,'district-store');assert.equal(E.speaker,null);
});
