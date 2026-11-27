'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Hub,ROOMS,publicId}=require('../tools/district-hub/protocol.cjs');

function setup(){
  const sent=new Map(),closed=[];
  const hub=new Hub({send:(c,m)=>{if(!sent.has(c))sent.set(c,[]);sent.get(c).push(m);},close:(c,code,why)=>closed.push([c,code,why]),now:()=>1000000});
  const msgs=c=>sent.get(c)||[];
  const join=(c,uid,room)=>hub.join(c,{t:'hello',token:'fixture',room},{uid,anonymous:false,model:'district-resident'});
  const place=c=>hub.state(c,{t:'state',x:1,z:1,yaw:0});
  return {hub,msgs,join,place,closed};
}
for(const room of ['low-quay','stale-arrival']){
  test(room+' accepts two verified fixture identities, isolates other rooms and cleans up',()=>{
    const r=setup(),a={},b={},outside={};
    assert.ok(ROOMS[room]);
    assert.ok(r.join(outside,'outside','meridian'));r.place(outside);
    assert.ok(r.join(a,'alice',room));
    assert.ok(r.join(b,'bob',room));
    if(!room.endsWith('-arrival')){r.place(a);r.place(b);}
    assert.equal(r.hub.roomPeers(room).length,2);
    assert.ok(r.msgs(a).some(m=>m.t==='join'&&m.peer.id===publicId('bob')));
    assert.ok(r.msgs(b).some(m=>(m.t==='join'&&m.peer.id===publicId('alice'))||(m.t==='welcome'&&m.peers.some(p=>p.id===publicId('alice')))));
    assert.ok(!r.msgs(outside).some(m=>m.t==='join'));
    r.hub.closed(b);r.hub.closed(b);
    assert.equal(r.hub.roomPeers(room).length,1);
    assert.equal(r.msgs(a).filter(m=>m.t==='leave'&&m.id===publicId('bob')).length,1);
    assert.ok(!r.msgs(outside).some(m=>m.t==='leave'));
  });
}
test('unknown room stays refused without disturbing an existing connection',()=>{
  const r=setup(),a={},unknown={};
  assert.ok(r.join(a,'alice','meridian'));r.place(a);
  assert.equal(r.join(unknown,'alice','unregistered-fixture-room'),false);
  assert.equal(r.msgs(unknown).at(-1).reason,'unknown room');
  assert.equal(r.hub.roomPeers('meridian').length,1);
  assert.equal(r.closed.length,0);
});
