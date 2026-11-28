const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../void-runner/apartments.js'),E=require('../void-runner/npc-escort.js'),D=require('../void-runner/apartment-editor.js');

test('apartment addresses exclude mission buildings and occupied units',()=>{
 const door=A.door('apt-road-n-27'),other=A.door('apt-road-n-34');
 const rows=new Map([[door.id,{missions:[{id:'test'}]}],[other.id,{residents:[{slot:2}],players:[{slot:3}]}]]);
 const available=D.available(A,rows);
 assert.ok(!available.some(d=>d.id===door.id));
 assert.ok(!available.find(d=>d.id===other.id).slots.includes(2));
 assert.ok(!available.find(d=>d.id===other.id).slots.includes(3));
 assert.ok(available.find(d=>d.id===other.id).slots.includes(0));
 assert.notEqual(D.roomId(other.id,0),D.roomId(other.id,1));
});
test('NPC home editing includes assigned residents even on a mission street, but excludes player units',()=>{
 const door=A.door('apt-road-n-27');
 const rows=new Map([[door.id,{missions:[{id:'test'}],residents:[{id:'resident',name:'Resident',slot:1},{id:'shared',name:'Shared',slot:2}],players:[{slot:2}]}]]);
 const homes=D.available(A,rows,true);
 assert.deepEqual(homes.find(d=>d.id===door.id).slots,[1]);
 assert.equal(homes.find(d=>d.id===door.id).units[0].residents[0].name,'Resident');
});
test('placement guide reserves entrances, interaction routes, and existing furniture in every layout',()=>{
 for(const style of A.STYLE_IDS){
  const def=A.layout('flat',style),guide=D.guideFor(A,E,def);
  const {limits,solids,routes}=guide;
  const check=b=>D.placementProblem(b,limits,solids,routes,[]);
  const at=(x,z)=>({x,z,y:0,w:.2,d:.2,h:.35});
  const [ox,oz]=A.ORIGIN;
  assert.ok(check(at(def.spawn[0]-ox,def.spawn[2]-oz)),style+' spawn');
  assert.ok(check(at(limits.door.x,limits.door.z+.25)),style+' door');
  assert.ok(check(at(limits.x[1],limits.z[1])),style+' walls');
  let clear=false;
  for(let x=limits.x[0]+.25;x<limits.x[1]&&!clear;x+=.25){
   for(let z=limits.z[0]+.25;z<limits.z[1]&&!clear;z+=.25)clear=!check(at(x,z));
  }
  assert.ok(clear,style+' has usable placement space');
 }
});
test('rotated prop dimensions protect floor paths and catch other props',()=>{
 const limits={x:[-4,4],z:[-4,4],ceil:2.8};
 const box=D.footprint({x:0,y:0,z:0,scale:1,yaw:Math.PI/2},[2,.4,.4]);
 assert.ok(box.d>1.99&&box.w<.41);
 assert.match(D.placementProblem(box,limits,[],[{x:0,z:.9,w:.2,d:.2}],[]),/route/);
 assert.match(D.placementProblem(box,limits,[],[],[{...box,y:.3}]),/another placed asset/);
 assert.equal(D.placementProblem({...box,y:2},limits,[],[{x:0,z:.9,w:.2,d:.2}],[]),'');
});
test('every game asset in the finder has a tracked source model',()=>{
 for(const model of D.CATALOG)assert.ok(fs.existsSync(path.join(__dirname,'../void-runner/assets/models',model.file)),model.file);
});
test('licensed uploads keep local design IDs and resolve only to the packed asset directory',()=>{
 const id='a'.repeat(32),rows=[{id,name:'Bed',category:'Furniture'},{id:'../x',name:'Bad',category:'Other'}];
 const [local]=D.localCatalog(rows),[published]=D.localCatalog(rows,true);
 assert.equal(D.localCatalog(rows,true).length,1);
 assert.equal(published.id,local.id);
 assert.equal(published.src,'assets/models/apartment-library/'+id+'.vrpak');
 assert.equal(published.origin,'Private library');
});
