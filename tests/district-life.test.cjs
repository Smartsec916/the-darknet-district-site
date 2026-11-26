/* The District residents' routines (the owner, 15 Nov 2026): arcade, store, bar; about half wear an oxygen mask at the bar. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const L=require('../void-runner/district-life.js'),T0=1.8e9;
test('every resident spends time at home, walking, and at the arcade, the store and the bar',()=>{
 for(const id of L.WHO){const seen=new Set();for(let t=0;t<L.ROUND*40;t+=7){const s=L.at(id,T0+t);seen.add(s.home?'home':s.kind==='walk'?'walk':s.what);}
  for(const k of ['home','walk','arcade','store','bar'])assert.ok(seen.has(k),id+' '+k);}
});
test('a round joins up: it starts and ends at home and nobody jumps',()=>{
 for(const id of L.WHO)for(let n=100;n<120;n++){const steps=L.round(id,n);assert.equal(steps[0].kind,'home');assert.equal(steps[steps.length-1].kind,'home');
  for(let i=1;i<steps.length;i++)assert.ok(Math.abs(steps[i].start-steps[i-1].end)<1e-6);assert.ok(steps[steps.length-2].end<=L.ROUND,'the round fits');}
 for(const id of L.WHO){let prev=null;for(let t=0;t<L.ROUND*3;t+=.5){const s=L.at(id,T0+t);if(!s.home&&prev&&!prev.home)assert.ok(Math.hypot(s.x-prev.x,s.z-prev.z)<=L.SPEED*.5+.01,id+' moved too far in half a second');prev=s;}}
});
test('two residents are never sent to the same place in the same leg of a round',()=>{
 for(let n=0;n<60;n++){const a=new Set(),b=new Set();for(const id of L.WHO){const st=L.round(id,n).filter(s=>s.kind==='stay');a.add(st[0].place);b.add(st[1].place);}assert.equal(a.size,L.WHO.length);assert.equal(b.size,L.WHO.length);}
});
test('about half of the people at the bar wear an oxygen mask, and nobody wears one anywhere else',()=>{
 let bar=0,mask=0;for(const id of L.WHO)for(let t=0;t<L.ROUND*400;t+=20){const s=L.at(id,T0+t);if(s.home||s.kind!=='stay')continue;if(s.what==='bar'){bar++;if(s.mask)mask++;}else assert.equal(s.mask,false);}
 assert.ok(mask/bar>.3&&mask/bar<.7,'share '+mask/bar);
});
test('the arcade spots stand in front of the four cabinets available to other residents; the game hands the figures over',()=>{
 const N=require('../void-runner/neochinatown.js'),cabs=L.PLACES.filter(p=>p.kind==='arcade');const available=N.arcade.filter(c=>c.game!=='hotel-headshots');assert.equal(cabs.length,available.length);
 available.forEach((c,i)=>{assert.ok(Math.abs(cabs[i].at[1]-c.z)<.01);assert.ok(cabs[i].at[0]>c.x&&cabs[i].face[0]<=c.x+.01);});
 assert.ok(fs.readFileSync('void-runner/babylon-renderer.js','utf8').includes('metadata?.life'));assert.ok(fs.readFileSync('void-runner/crowd.js','utf8').includes('controller:node=>'));
 assert.ok(fs.readFileSync('void-runner.html','utf8').includes('void-runner/district-life.js'));
});

test('every resident route stays clear of the current District solids',()=>{
 const N=require('../void-runner/neochinatown.js'),solids=N.layout('interior').solids;
 const places=[...Object.values(L.HOMES),...L.PLACES];
 for(const from of places)for(const to of places){
  if(from===to)continue;
  const path=L.route(from,to),length=L.length(path);
  for(let distance=0;distance<=length;distance+=.2){
   const point=L.along(path,distance),[x,z]=N.toWorld(point.x,point.z);
   const hit=solids.find(s=>s.position[1]-s.size[1]/2<1.6&&
    Math.abs(x-s.position[0])<s.size[0]/2+.25&&Math.abs(z-s.position[2])<s.size[2]/2+.25);
   assert.equal(hit,undefined,`${from.at} to ${to.at} crosses ${hit?.id} at ${point.x.toFixed(1)}, ${point.z.toFixed(1)}`);
  }
 }
});
