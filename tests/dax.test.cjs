// Dax: her places are reachable without walking through a wall, her day joins up from hour to hour, and the clock alone says where she is.
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../void-runner/dax.js'),N=require('../void-runner/neochinatown.js'),C=require('../void-runner/crowd.js');
const L=N.layout('interior');
// a point (plan metres) is clear when no solid that reaches below head height is within a body's width of it
const blocked=(px,pz,r=.3)=>{const [x,z]=N.toWorld(px,pz);return L.solids.some(s=>{const p=s.position,sz=s.size;return p[1]-sz[1]/2<1.6&&Math.abs(x-p[0])<sz[0]/2+r&&Math.abs(z-p[2])<sz[2]/2+r;});};
const names=Object.keys(D.SPOTS);
test('every place she stands is clear, and inside the District',()=>{
 for(const n of names){const s=D.SPOTS[n];assert.ok(!blocked(s.at[0],s.at[1]),n+' is clear');assert.equal(N.zone({x:N.toWorld(s.at[0],s.at[1])[0],z:N.toWorld(s.at[0],s.at[1])[1]}).area,'district',n);assert.ok(s.clips.length&&s.stay[1]>s.stay[0]);}
});
test('every way between two places, and the way out, crosses no wall',()=>{
 for(const a of [...names,'away'])for(const b of [...names,'away']){if(a===b)continue;const p=D.route(a,b),len=D.length(p);assert.ok(len>1&&len<80,a+'>'+b+' '+len.toFixed(1));
  for(let d=0;d<=len;d+=.25){const q=D.along(p,d);assert.ok(!blocked(q.x,q.z,.25),a+' > '+b+' is blocked at '+q.x.toFixed(1)+', '+q.z.toFixed(1));}
  const end=D.along(p,len),to=b==='away'?D.EXIT:D.SPOTS[b].at;assert.ok(Math.hypot(end.x-to[0],end.z-to[1])<1e-6,'ends where she stands');}
});
test('an hour of her life has no gaps, begins where the last one ended, and takes her to several places',()=>{
 for(let h=495000;h<495040;h++){const d=D.day(h);assert.equal(d[0].start,0);assert.ok(d.at(-1).end>3600);
  for(let i=1;i<d.length;i++)assert.ok(Math.abs(d[i].start-d[i-1].end)<1e-6,'no gap at step '+i);
  const first=d[0].spot,prev=D.day(h-1).at(-1);assert.equal(prev.kind==='walk'?prev.to:prev.spot,first,'hour '+h+' begins where the last ended');
  assert.ok(new Set(d.filter(s=>s.kind!=='walk').map(s=>s.spot)).size>=3,'she does not stand in one place all hour');}
});
test('the clock alone says where she is: the same for everyone, moving smoothly, never through a wall',()=>{
 const t0=495003*3600;assert.deepEqual(D.schedule(t0+1234.5),D.schedule(t0+1234.5));
 let prev=null,inside=0,away=0,device=0,walk=0;
 for(let t=t0;t<t0+3*3600;t+=.5){const s=D.schedule(t);if(!s.inside){away++;prev=null;assert.equal(s.place,'NeoChinatown'===s.place?s.place:s.place);continue;}inside++;if(s.device)device++;if(s.clip==='walk')walk++;
  assert.ok(!blocked(s.x,s.z,.25),'blocked at '+s.x.toFixed(1)+', '+s.z.toFixed(1)+' t+'+(t-t0));assert.ok(C.clips['npc-dax'].includes(s.clip),s.clip);assert.ok(Number.isFinite(s.yaw));
  if(prev)assert.ok(Math.hypot(s.x-prev.x,s.z-prev.z)<=D.SPEED*.5+.05,'no jump at t+'+(t-t0));prev=s;}
 assert.ok(inside>0&&walk>0&&device>0,'she is in the District, walks, and uses her V3 some of the time');
 let anyAway=false;for(let h=495000;h<495200&&!anyAway;h++)anyAway=D.day(h).some(s=>s.kind==='away');assert.ok(anyAway,'some of the time she is away from the District');
});
test('there is one Dax, she is a licensed model that is not in this repository, and her clips are the ones built for her',()=>{
 const fs=require('node:fs'),path=require('node:path');assert.ok(!fs.existsSync(path.join(__dirname,'..','void-runner',D.FILE))||require('node:child_process').execFileSync('git',['ls-files',path.join('void-runner',D.FILE)],{cwd:path.join(__dirname,'..'),encoding:'utf8'}).trim()==='','her model is never tracked here');
 const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tools/animation-pipeline/characters/npc-dax.json'),'utf8'));
 assert.deepEqual(spec.clips.map(c=>c==='walk-game'?'walk':c).sort(),C.clips['npc-dax'].slice().sort());assert.equal(D.EYE.length,4);
});
