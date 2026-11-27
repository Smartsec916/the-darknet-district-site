'use strict';
// PLUG & PLAY's own place id (owner-approved, 27 Nov 2026): registered in the place registry (mission editor pickers, triggers, photo locations) under
// Stale System > Low Quay, with rooms; the Dev Tools jump lists it and lands inside; the cloud save accepts the id as a place.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../void-runner/places.js'),CL=require('../void-runner/low-quay-club.js'),LQ=require('../void-runner/low-quay.js');
test('low-quay-plug-and-play is a venue under Low Quay in the Stale System, with its rooms',()=>{
 const v=P.node('low-quay-plug-and-play');assert.ok(v);assert.equal(v.name,'Plug & Play');assert.equal(v.level,'venue');
 assert.deepEqual(P.path('low-quay-plug-and-play'),['stale-system','low-quay','low-quay-plug-and-play']);
 assert.equal(P.node('stale-system').system,'stale');assert.equal(P.node('low-quay').location,'low-quay');
 assert.ok(P.options().some(o=>o.id==='low-quay-plug-and-play'&&o.selectable),'pickable in the mission editor');
 for(const id of ['floor','stage','alcove','kitchen','backstage'])assert.equal(P.node('low-quay-plug-and-play-'+id).parent,'low-quay-plug-and-play');
 // a point in the scene resolves to the right room
 const at=(x,z)=>P.deepest({scene:'planet-low-quay',x,z});
 assert.equal(at(30.4,371),'low-quay-plug-and-play-floor');assert.equal(at(35,381),'low-quay-plug-and-play-kitchen');assert.equal(at(41,381),'low-quay-plug-and-play-backstage');
 assert.equal(at(39.5,362),'low-quay-plug-and-play-alcove');assert.equal(at(0,-423),null,'the pad is not in the club');
 assert.ok(P.chain('low-quay-plug-and-play-kitchen').includes('Plug & Play · Low Quay · Stale System'));
});
test('entering it: draft play and the Dev Tools jump land inside the club, on open floor',()=>{
 const v=P.node('low-quay-plug-and-play');assert.equal(v.enter.location,'low-quay');const [x,,z]=v.enter.spawn;assert.ok(CL.inside(x,z));
 const L=LQ.layout();assert.ok(!L.solids.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+.38&&Math.abs(z-s.position[2])<s.size[2]/2+.38),'spawn is free');
 const dev=fs.readFileSync('void-runner/dev-test.js','utf8');assert.match(dev,/n\.level==='venue'&&n\.enter\?\.location===id&&n\.enter\.spawn/);
});
test('the id fits the save formats (photo and trigger place ids) and no location id changed',()=>{
 assert.match('low-quay-plug-and-play',/^[a-z0-9][a-z0-9:>-]{0,47}$/);   // void_runner_api.py place pattern
 const man=JSON.parse(fs.readFileSync('void-runner/save-manifest.json','utf8'));assert.ok(man.locations.includes('low-quay'));assert.ok(man.systems.includes('stale'));
});
