const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('../void-runner/apartments.js');
test('entrance colors keep mission priority and distinguish shared housing',()=>{
 const d=A.doors().find(door=>door.style==='normal');
 const npc={missions:[],residents:[{name:'Resident',slot:1}]};
 assert.equal(A.entranceType(d), 'available');
 assert.equal(A.entranceType({...d,family:'office'}),'commercial');
 assert.equal(A.entranceType(d,npc),'npc');
 const players=[{name:'Player',slot:2}];
 assert.equal(A.entranceType(d,null,players),'player');
 const shared=A.propertyRecord(d,npc,players);
 assert.equal(shared.kind,'shared');
 assert.equal(A.entranceLegend.shared.colors.length,2);
 assert.equal(shared.units[1].residents.length,1);
 assert.equal(shared.units[1].players.length,0);
 assert.equal(shared.units[2].players.length,1);
 assert.equal(A.entranceType(d,{...npc,missions:[{id:'awakening'}]},players),'mission');
 assert.equal(A.propertyRecord({...d,name:'Renamed'},npc,players).units[1].id,shared.units[1].id);
});
test('draft and live reservations remain visible for the same mission',async()=>{
 const door=A.doors()[0];
 const trees=[{missions:[{id:'awakening',apartments:[{id:'flat',door:door.id,number:101}]}]}];
 const result=await A.readAddressRegistry({readLive:async()=>({content:{trees}}),readLocal:()=>({version:1,trees})});
 assert.deepEqual([...result.missionSources.get('awakening')],['Published','Local draft']);
 assert.equal(result.rows.get(door.id).missions.length,1);
});

test('moving a mission entrance in a draft keeps each reservation source on the right door',async()=>{
 const [oldDoor,newDoor]=A.doors();
 const trees=d=>[{missions:[{id:'mission',apartments:[{id:'home',door:d.id}]}]}];
 const result=await A.readAddressRegistry({readLive:async()=>({content:{trees:trees(oldDoor)}}),readLocal:()=>({version:1,trees:trees(newDoor)})});
 assert.deepEqual([...result.doorSources.get(oldDoor.id+'/mission')],['Published']);
 assert.deepEqual([...result.doorSources.get(newDoor.id+'/mission')],['Local draft']);
});

test('companion address checks include player occupants without exposing account IDs',async()=>{
 const door=A.doors()[0];
 const result=await A.readAddressRegistry({readLive:async()=>({content:{}}),
  readProperties:async()=>({units:{[A.residenceKey(door.id,1)]:{owner:'private-id',name:'Resident'}}})});
 assert.equal(result.complete,true);
 assert.deepEqual(result.rows.get(door.id).players,[{name:'Resident',slot:1}]);
});

test('corporate entrance and arrival point round-trip through the area map',()=>{
 const areas=require('../void-runner/npc-areas.js'),door=A.door('biz-corp-s-40');
 for(const point of [[door.x,door.z],door.front]){
  const displayed=A.editorDoorPoint(door,point);
  assert.deepEqual(areas.toLocal(door.scene,displayed),{x:point[0],z:point[1]});
 }
});

test('a mission giver makes its residence yellow and leaves other units assignable',()=>{
 const door=A.doors()[0],characters={giver:{name:'Giver',residence:{door:door.id,slot:0}}};
 const rows=A.addressRegistry([{missions:[{id:'test-mission',title:'Test mission',giver:'giver'}]}],characters);
 const property=A.propertyRecord(door,rows.get(door.id));
 assert.equal(property.kind,'mission');
 assert.equal(property.reserved,false);
 assert.equal(property.missions[0].id,'test-mission');
 assert.equal(property.units[1].residents.length,0);
});
