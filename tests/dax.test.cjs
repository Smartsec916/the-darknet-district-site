const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../void-runner/dax.js'),N=require('../void-runner/neochinatown.js'),C=require('../void-runner/crowd.js');
const X=require('../void-runner/npc-paths.js'),R=require('../void-runner/dax-editor-routine.js');
const L=N.layout('interior');
const world=(x,z)=>{const [a,b]=N.toWorld(x,z);return {x:a,z:b};};
const blocked=(px,pz,r=.25)=>{const [x,z]=N.toWorld(px,pz);return L.solids.some(s=>{
 const p=s.position,sz=s.size;
 return p[1]-sz[1]/2<1.6&&p[1]+sz[1]/2>.1&&Math.abs(x-p[0])<sz[0]/2+r&&Math.abs(z-p[2])<sz[2]/2+r;
});};
const first=world(1.6,54.5),second=world(1.6,58);
test('the validated fallback is stationary and clear across the entire shared day',()=>{
 const get=R.timeline(null,X,N.door,()=>{throw Error('No routine');});
 assert.deepEqual(get(0),get(86399));
 assert.equal(get(1).source,'default');
 assert.deepEqual(X.spotProblems('dax',first),[]);
 assert.equal(blocked(get(0).x,get(0).z),false);
});
test('an authored route uses the real hallway, respects step actions and loops without crossing walls',()=>{
 const raw={mode:'path',points:[{...first,action:'shadow',seconds:5},{...second,action:'walk-on',seconds:99}]};
 assert.deepEqual(X.planProblems('dax',raw),[]);
 const get=R.timeline(raw,X,N.door,()=>[]);
 let walk=false,eye=false,previous;
 for(let time=0;time<30;time+=.1){
  const s=get(time);
  assert.ok(!blocked(s.x,s.z),JSON.stringify(s));
  assert.ok(C.clips['npc-dax'].includes(s.clip),s.clip);
  if(previous)assert.ok(Math.hypot(s.x-previous.x,s.z-previous.z)<=R.SPEED*.1+.001);
  walk||=s.clip==='walk';
  eye||=s.device;
  previous=s;
 }
 assert.ok(walk&&eye);
 assert.equal(get(0).clip,'look');
 assert.equal(get(5.1).clip,'walk');
 assert.equal(get(7.8).clip,'walk','walk-on never holds for its stored seconds');
});
test('the same UTC schedule is continuous at a live boundary and playback time is independent of player saves',()=>{
 const stay={mode:'stay',...first,yaw:0,actions:['idle']};
 const raw={...stay,schedule:[{from:'23:45',to:'00:15',mode:'stay',...second,yaw:0,actions:['watch']}]};
 assert.deepEqual(X.planProblems('dax',raw),[]);
 const route=(a,b)=>[b];
 const get=R.timeline(raw,X,N.door,route),secondClient=R.timeline(structuredClone(raw),X,N.door,route);
 for(const time of [85499.95,85500,85500.05,86399.95,86400,86400.05,87300,87300.05]){
  const s=get(time),prev=get(time-.05);
  assert.deepEqual(s,secondClient(time));
  assert.ok(Math.hypot(s.x-prev.x,s.z-prev.z)<=R.SPEED*.05+.001);
  assert.ok(!blocked(s.x,s.z));
 }
 assert.equal(get(85501).clip,'walk');
 assert.equal(get(86400).clip,'watch');
 assert.equal(get(87305).clip,'idle');
 assert.equal(R.timeline(null,X,N.door,route)(87305).source,'default');
});
test('there is one Dax, she is a licensed model that is not in this repository, and her clips are the ones built for her',()=>{
 const fs=require('node:fs'),path=require('node:path');assert.ok(!fs.existsSync(path.join(__dirname,'..','void-runner',D.FILE))||require('node:child_process').execFileSync('git',['ls-files',path.join('void-runner',D.FILE)],{cwd:path.join(__dirname,'..'),encoding:'utf8'}).trim()==='','her model is never tracked here');
 const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tools/animation-pipeline/characters/npc-dax.json'),'utf8'));
 assert.deepEqual(spec.clips.map(c=>c==='walk-game'?'walk':c).sort(),C.clips['npc-dax'].slice().sort());assert.equal(D.EYE.length,4);
});
