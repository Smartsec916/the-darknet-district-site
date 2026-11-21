'use strict';
// A fortified gate's corner pylons never stand over a lane's opening (the East Gate's walkers' lane was half inside its pylon, 18 Nov 2026).
const test=require('node:test'),assert=require('node:assert/strict'),Q=require('../void-runner/ncz-quarters.js');
test('no pylon overlaps a lane, and each is 1.5 m wide',()=>{for(const g of Q.GATES){const p=Q.pylons(g);assert.equal(p.length,2);
 for(const [a,b] of p){assert.ok(Math.abs(b-a-1.5)<1e-9,g.id);for(const l of g.lanes)assert.ok(b<=l.v[0]+1e-9||a>=l.v[1]-1e-9,g.id+' pylon '+a+'..'+b+' over lane '+l.id);}}});
test('East Gate: the north pylon stands outside the walkers\' lane',()=>{const g=Q.gate('east'),foot=g.lanes.find(l=>l.kind==='foot'),[,hi]=Q.pylons(g);
 assert.equal(hi[0],foot.v[1]);assert.ok(hi[1]>Q.span(g).v1,'it reaches past the gate edge into the building row');});
test('a pylon with room keeps its place at the gate edge',()=>{const g=Q.gate('east'),[lo]=Q.pylons(g);assert.deepEqual(lo,[Q.span(g).v0,Q.span(g).v0+1.5]);});
