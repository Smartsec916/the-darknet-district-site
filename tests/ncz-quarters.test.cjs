/* NeoChinatown's three quarters and their checkpoints (void-runner/ncz-quarters.js): the map, what each quarter's build keeps, the gates' rooms and doors,
   the collision that seals a quarter, taxi routes between quarters, saves, and adding a checkpoint by one entry. */
const test=require('node:test'),assert=require('node:assert/strict');
const Q=require('../void-runner/ncz-quarters.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),MK=require('../void-runner/milked.js'),A=require('../void-runner/district-area.js');
const mid=r=>[(r[0]+r[1])/2,(r[2]+r[3])/2];
// every open half-metre cell a walker can reach from a point, in a layout
function reach(L,from,limit=60000){const key=(x,z)=>Math.round(x*2)+':'+Math.round(z*2),seen=new Set([key(from[0],from[1])]),todo=[[Math.round(from[0]*2)/2,Math.round(from[1]*2)/2]],out=[];
 while(todo.length&&out.length<limit){const [x,z]=todo.pop();out.push([x,z]);for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k))continue;seen.add(k);if(!E.blocked(nx,nz,L))todo.push([nx,nz]);}}return out;}

test('the streets here are the streets neochinatown.js walks',()=>{for(const k of Object.keys(Q.S))assert.deepEqual(Q.S[k],N.streets[k],k);assert.equal(N.quarters,Q);});
test('three quarters; the everyday loop is all in Old Town and never meets a checkpoint',()=>{
 assert.deepEqual(Q.IDS,['port','oldtown','avenue']);assert.deepEqual(Object.values(Q.QUARTERS).map(q=>q.name),['The Port','Old Town','The Avenue']);
 const exit=A.exitSpawn(N).spawn,loop={districtDoor:[exit[0],exit[2]],alley:[100,-58.5],mainStreet:[61,-58.5],nullDoor:[52,-58.5],milkedFront:[MK.DOOR.x,MK.DOOR.z+1],milkedRear:[94.75,-91.5],accessRoad:[30,-118.5]};
 for(const [name,[x,z]] of Object.entries(loop)){assert.equal(Q.quarterAt(x,z),'oldtown',name);assert.equal(Q.laneAt({x,z}),null,name+' is not inside a checkpoint');}
 // and a walker really can get round it with every gate door shut
 const L=N.layout('street','oldtown'),cells=reach(L,[exit[0],exit[2]]),has=(x,z)=>cells.some(c=>Math.hypot(c[0]-x,c[1]-z)<.8);
 for(const [name,[x,z]] of Object.entries(loop))assert.ok(has(x,z),name+' is reachable from the District door');
 assert.equal(Q.quarterAt(31,-96),'port');assert.equal(Q.quarterAt(61,-12),'avenue');assert.equal(Q.quarterAt(-50,-12),null,'the retired west street is nobody\'s');assert.equal(Q.quarterAt(61,-150),null);assert.equal(Q.quarterAt(61,-23,'avenue'),'avenue');assert.equal(Q.quarterAt(61,-23,'oldtown'),'oldtown');
});
test('each quarter is sealed by its gates: with the doors shut nobody walks out of it, and its spawn is open floor',()=>{
 for(const q of Q.IDS){const L=N.layout('street',q),sp=Q.QUARTERS[q].spawn;assert.equal(L.quarter,q);assert.equal(L.area,'street');assert.equal(L.id,'neochinatown');assert.deepEqual(L.spawn,sp);assert.equal(E.blocked(sp[0],sp[2],L),false,q+' spawn');
  const cells=reach(L,[sp[0],sp[2]]);assert.ok(cells.length>400&&cells.length<60000,q+' '+cells.length);
  for(const [x,z] of cells)assert.ok(Q.inQuarter(q,x,z,.8),q+': a walker got to '+x+','+z);
  // open this quarter's door of every foot lane: the room is reached, the far side is not
  for(const g of Q.gatesOf(q))for(const l of Q.lanesOf(g.id)){const e=Q.endOf(g,q);L.solids.find(s=>s.id===l.doors[e].id).open=true;}
  const more=reach(L,[sp[0],sp[2]]);for(const [x,z] of more)assert.ok(Q.inQuarter(q,x,z,.8),q+' with its own doors open: '+x+','+z);
  for(const g of Q.gatesOf(q))for(const l of Q.lanesOf(g.id))assert.ok(more.some(c=>Math.hypot(c[0]-l.mid[0],c[1]-l.mid[1])<.6),q+': the middle of '+l.key+' is reached');}
 // the whole-city layout (no quarter) is what it always was
 assert.equal(N.layout('street').quarter,undefined);assert.ok(!N.layout('street').solids.some(s=>String(s.id).startsWith('gate-')));
});
test('the checkpoints of map A: who runs them, what they join, their lanes',()=>{
 const by=Object.fromEntries(Q.GATES.map(g=>[g.id,g]));assert.deepEqual(Q.GATES.map(g=>g.code+' '+g.name),['A1 Port Customs','A2 North Gate','A3 Function Gate','A4 East Gate','A5 South Gate']);
 assert.deepEqual([by.customs.ends.lo.quarter,by.customs.ends.hi.quarter],['oldtown','port']);assert.deepEqual([by.north.ends.lo.quarter,by.north.ends.hi.quarter],['oldtown','avenue']);
 assert.equal(by.function.ends.lo.scene,'corporate');assert.equal(by.function.ends.hi.quarter,'avenue');assert.equal(by.east.ends.hi.scene,'temple');assert.equal(by.south.shut,true);
 assert.deepEqual(Q.GATES.map(g=>g.guard),['private','private','function','private',null]);
 const kinds=id=>Q.lanesOf(id).map(l=>l.kind).sort().join();assert.equal(kinds('customs'),'bay,foot');assert.equal(kinds('north'),'bay,bay,foot,foot');assert.equal(kinds('function'),'bay,foot','The Function\'s gate is walkable and takes cabs');assert.equal(kinds('east'),'bay,foot','the East Gate is walkable and takes cabs (walkers\' lane added 16 Nov 2026)');assert.equal(kinds('south'),'');
 for(const l of Q.LANES){const g=Q.gate(l.gate);assert.ok(l.rect[0]>=g.rect[0]-1e-9&&l.rect[1]<=g.rect[1]+1e-9&&l.rect[2]>=g.rect[2]-1e-9&&l.rect[3]<=g.rect[3]+1e-9,l.key+' lies in its gate');
  const c={x:l.mid[0],z:l.mid[1]};assert.equal(Q.laneAt(c).key,l.key);assert.ok(Q.atCentre(l,c));
  // the middle is clear of both doorways, and a cab (4.4 m) fits between a bay's doors
  for(const end of ['lo','hi']){const d=l.doors[end],along=d.axis==='x'?Math.abs(c.z-d.z):Math.abs(c.x-d.x);assert.ok(along>=2.2,l.key+' '+end);assert.equal(Q.atCentre(l,{x:d.x,z:d.z}),false);}
  if(l.kind==='bay'){const len=Math.hypot(l.doors.hi.x-l.doors.lo.x,l.doors.hi.z-l.doors.lo.z);assert.ok(len>=4.4+.6,l.key+' is '+len.toFixed(2)+' m between its doors');assert.ok(l.doors.lo.half*2>=1.9+.6,l.key+' is wide enough for a cab');}}
});
test('in any quarter only the door on that quarter\'s side can open, so the two doors of a lane are never open together',()=>{
 for(const l of Q.LANES){const g=Q.gate(l.gate);for(const q of Q.IDS){const can=['lo','hi'].filter(e=>Q.openable(l,e,q));if(Q.QUARTERS[q].gates.includes(g.id))assert.equal(can.length,1,l.key+' in '+q);else assert.equal(can.length,0,l.key+' in '+q);}}
 for(const q of Q.IDS){const L=N.layout('street',q);for(const g of Q.gatesOf(q))for(const l of Q.lanesOf(g.id))for(const e of ['lo','hi']){const s=L.solids.find(x=>x.id===l.doors[e].id);assert.ok(s&&s.door&&s.open===false,l.doors[e].id);assert.equal(E.blocked(l.doors[e].x,l.doors[e].z,L),true);}}
});
test('a quarter\'s build keeps its own street furniture and the buildings in sight of it, and the shared far city',()=>{
 assert.ok(Q.keepDetail('oldtown',52,-60));assert.ok(!Q.keepDetail('oldtown',80,-12),'the avenue\'s signs are not built in Old Town');assert.ok(!Q.keepDetail('avenue',52,-60));assert.ok(!Q.keepDetail('port',61,-60));assert.ok(Q.keepDetail('port',30,-96));
 assert.ok(Q.keepDetail(null,80,-12),'no quarter: everything, as before');
 assert.ok(Q.keepBuilding('avenue',80,-30));assert.ok(!Q.keepBuilding('avenue',80,-100));assert.ok(Q.keepBuilding('port',300,300),'the megacity is everyone\'s backdrop');assert.ok(!Q.keepBuilding('port',120,-40));
 // the District's own front and Milked belong to Old Town
 assert.ok(Q.keepDetail('oldtown',126.9,-91));assert.ok(Q.keepDetail('oldtown',88,-82));
});
test('taxis: seven kerbside stops, two places beyond the gates at 60 CR, and the gates a trip passes',()=>{
 assert.deepEqual(Q.STOPS.map(s=>s.id),['passage','main','milked','alley-mouth','avenue','function-gate','east-gate']);
 for(const s of Q.STOPS){assert.equal(Q.quarterAt(s.position[0],s.position[1]),s.quarter,s.id);assert.equal(E.blocked(s.position[0],s.position[1],N.layout('street',s.quarter)),false,s.id);}
 assert.deepEqual(N.taxiZones.map(z=>z.id),Q.STOPS.map(s=>s.id));
 assert.deepEqual(Q.FAR.map(f=>[f.id,f.fare,f.gate]),[['corporate',60,'function'],['temple',60,'east']]);
 assert.deepEqual(Q.gatesBetween('oldtown','oldtown'),[]);assert.deepEqual(Q.gatesBetween('port','avenue').map(h=>h.gate),['customs','north']);
 assert.deepEqual(Q.gatesBetween('oldtown','corporate').map(h=>h.gate),['north','function']);assert.deepEqual(Q.gatesBetween('port','temple').map(h=>h.gate),['customs','north','east']);assert.equal(Q.gatesBetween('nowhere','port'),null);
 assert.equal(Q.bayFor('north','oldtown').key,'north:bay-n');assert.equal(Q.bayFor('north','avenue').key,'north:bay-s');assert.equal(Q.bayFor('customs','port').key,'customs:bay');
});
test('saves: the quarter is remembered in story.flags, the Port needs no flag, and sky-cab records in old saves are refunded once and dropped',()=>{
 const s={credits:100,story:{flags:{}}};assert.equal(Q.resumeQuarter(s),'port');Q.remember(s,'avenue');assert.equal(s.story.flags.quarter,'avenue');assert.equal(Q.resumeQuarter(s),'avenue');Q.remember(s,'port');assert.equal('quarter' in s.story.flags,false);
 s.story.flags.quarter='moon';assert.equal(Q.resumeQuarter(s),'port');
 Object.assign(s.story.flags,{taxiTrip:'corporate:60',skyCabTrip:'corporate:60',cabReturn:'61.00,-66.00,0.000',deviceWaypoint:'taxi-corporate'});
 assert.equal(Q.migrateSave(s),120);assert.equal(s.credits,220);assert.deepEqual(s.story.flags,{});assert.equal(Q.migrateSave(s),0);assert.equal(s.credits,220,'never twice');
 const t={credits:5,story:{flags:{skyCabTrip:'temple:0',deviceWaypoint:'taxi-main',quarter:'oldtown'}}};assert.equal(Q.migrateSave(t),0);assert.deepEqual(t.story.flags,{deviceWaypoint:'taxi-main',quarter:'oldtown'},'a waypoint on a stop that still exists is kept');
 assert.equal(Q.migrateSave({}),0);
});
test('a new checkpoint is one entry: inside a quarter it has two working doors and exchanges nothing',()=>{
 const before=Q.GATES.length;
 assert.equal(Q.define({id:'test-alley',code:'T1',name:'Alley Check',sign:'CHECKPOINT',guard:'private',rect:[100,104,-61.6,-55.5],axis:'x',ends:{lo:{quarter:'oldtown'},hi:{quarter:'oldtown'}},lanes:[{id:'foot',kind:'foot',v:[-60.2,-57.2]}]}),true);
 try{const g=Q.gate('test-alley'),l=Q.lane('test-alley:foot');assert.ok(Q.internal(g));assert.deepEqual(Q.sidesOf(g,'oldtown'),['lo','hi']);assert.ok(Q.openable(l,'lo','oldtown')&&Q.openable(l,'hi','oldtown'));assert.ok(!Q.openable(l,'lo','avenue'));
  assert.equal(Q.laneAt({x:102,z:-58.7},'oldtown').key,'test-alley:foot');
  const L=N.layout('street','oldtown');assert.ok(L.solids.some(s=>s.id==='gate-test-alley-foot-lo'&&s.door));assert.equal(E.blocked(102,-56,L),true,'its wall stands in the alley');assert.equal(E.blocked(102,-58.7,L),false);
  assert.equal(Q.define({id:'test-alley'}),false,'an id is used once');
 }finally{Q.GATES.splice(before);for(let i=Q.LANES.length-1;i>=0;i--)if(Q.LANES[i].gate==='test-alley')Q.LANES.splice(i,1);const gs=Q.QUARTERS.oldtown.gates;gs.splice(gs.indexOf('test-alley'),1);}
});
test('multiplayer: the three quarters share one room on the hub (so chat reaches the whole city), and a player in another quarter is not drawn',()=>{
 const fs=require('node:fs'),rp=fs.readFileSync(require('node:path').join(__dirname,'../void-runner/remote-players.js'),'utf8'),hub=fs.readFileSync(require('node:path').join(__dirname,'../tools/district-hub/protocol.cjs'),'utf8');
 assert.match(rp,/wl\.area==='interior'\?ROOM:'neochinatown-street'/,'one street room, whatever the quarter');assert.doesNotMatch(rp,/neochinatown-(port|oldtown|avenue)/);assert.match(hub,/'neochinatown-street'/);assert.match(hub,/for\(const q of this\.roomPeers\(p\.room\)\)/,'chat goes to everyone in the room');
 assert.match(rp,/QZ\.inQuarter\(walkingLocation\.quarter,p\.x,p\.z,1\)/);
 // the rule itself: someone on Main Street is seen from Old Town and not from the Avenue or the Port; someone inside a gate is seen from both of its quarters
 assert.equal(Q.inQuarter('oldtown',61,-60,1),true);assert.equal(Q.inQuarter('avenue',61,-60,1),false);assert.equal(Q.inQuarter('port',61,-60,1),false);
 const m=Q.lane('north:foot-w').mid;assert.equal(Q.inQuarter('oldtown',m[0],m[1],1),true);assert.equal(Q.inQuarter('avenue',m[0],m[1],1),true);assert.equal(Q.inQuarter('port',m[0],m[1],1),false);
});
