// Street taxis: destinations come only from the registry of existing NeoChinatown stops,
// cabs stay on the roads, and a person in front of one brings it to a stop.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../void-runner/neochinatown.js'),C=require('../void-runner/campaign.js'),F=require('../void-runner/taxi-rules.js'),R=require('../void-runner/road-taxi-rules.js');
const city=()=>{const s=C.fresh();s.location='earth';s.credits=100;return s;};
const zone=id=>N.taxiZones.find(z=>z.id===id);

test('the registry is the only destination list, and every stop is an existing taxi zone',()=>{
  const stops=R.stops(),ids=stops.map(d=>d.id);
  assert.deepEqual(ids,R.REGISTRY);
  assert.deepEqual(new Set(ids),new Set(['main','avenue','alley-mouth','passage']));
  for(const d of stops){const z=zone(d.id);assert.ok(z&&!z.district,d.id);assert.deepEqual(d.position,z.position);assert.equal(d.label,z.name);}
  for(const d of N.districts)assert.ok((d.placeholder||d.built)&&!ids.includes(d.id),d.id+' is not a street-taxi stop');
  assert.equal(R.cost([0,0],[80,0]),F.cost([0,0],[80,0]),'the fare is the sky-cab fare');
});

test('street taxis are offered on foot in NeoChinatown and refused indoors, in a fight, or with no credits',()=>{
  const s=city();
  assert.equal(R.availability(s,{onFoot:true,area:'street'}).ok,true);
  assert.equal(R.availability(s,{onFoot:true,area:'district'}).ok,false);
  assert.equal(R.availability(s,{onFoot:true,area:'terrace'}).ok,false);
  assert.equal(R.availability(s,{onFoot:true,area:'street',combat:true}).ok,false);
  assert.equal(R.availability(s,{onFoot:false,area:'street'}).ok,false);
  assert.match(R.availability(C.fresh(),{onFoot:true,area:'street'}).reason,/No street taxi/);
  const here=R.destinations(s,{player:[61,-100]}).find(d=>d.id==='main');
  assert.equal(here.ok,false);assert.match(here.reason,/Already there/);
  const far=R.destinations(s,{player:[40,-12.5]}).find(d=>d.id==='passage');
  assert.equal(far.ok,true);assert.ok(far.fare>=F.fare.base&&far.fare<=F.fare.max);
  s.credits=1;assert.equal(R.destinations(s,{player:[40,-12.5]}).find(d=>d.id==='passage').ok,false);
});

test('the fare is charged once and refunded once if the trip is interrupted',()=>{
  const s=city();assert.equal(R.charge(s,'avenue',24),24);assert.equal(s.credits,76);assert.equal(R.charge(s,'avenue',24),0);
  assert.equal(s.story.flags.roadTaxiTrip,'avenue:24');assert.equal(s.story.flags.taxiTrip,undefined,'sky-cab fare is a different record');
  const saved=C.restore(JSON.stringify(s));assert.equal(R.recover(saved),24);assert.equal(saved.credits,100);assert.equal(R.recover(saved),0);
  R.arrive(s);assert.equal(s.story.flags.roadTaxiTrip,undefined);
});

test('every lane, turn and spur stays on a road that already exists',()=>{
  const net=R.network();
  for(const e of net.edges){const L=R.pathLength(e.pts);for(let s=0;s<=L;s+=1){const p=R.pointAlong(e.pts,s,false);
   assert.ok(R.onRoad(p.x,p.z,0.05),e.id+' leaves the roads at '+p.x.toFixed(1)+','+p.z.toFixed(1));}}
  const alley=N.streets.alley,pad=N.streets.pad;
  for(const e of net.edges)for(const p of e.pts){
   assert.ok(!(p.x>alley[0]&&p.x<alley[1]&&p.z>alley[2]&&p.z<alley[3]),'cabs do not drive the alley');
   assert.ok(!(p.x>pad[0]&&p.x<pad[1]&&p.z>pad[2]&&p.z<pad[3]),'cabs do not drive onto the landing pad');
  }
});

test('a route between two real stops stays on the roads and reaches the stop',()=>{
  const net=R.network(),from=zone('main'),to=zone('passage');
  const path=R.route(net,{x:from.position[0],z:from.position[1]},{x:to.position[0],z:to.position[1]});
  assert.ok(path.length>2);assert.ok(R.pathLength(path)>20);
  const L=R.pathLength(path);
  for(let s=0;s<=L;s+=2){const p=R.pointAlong(path,s,false);assert.ok(R.onRoad(p.x,p.z,0.05),p.x.toFixed(1)+','+p.z.toFixed(1));}
  const end=path[path.length-1];assert.ok(Math.hypot(end.x-to.position[0],end.z-to.position[1])<8);
});

test('a cab slows and stops for someone in front of it, then drives on once they step aside',()=>{
  const taxi={x:0,z:0,yaw:0,speed:R.SPEC.cruise,s:0,loop:false,phase:'cruise',path:[{x:0,z:0},{x:0,z:80}],pathLen:80,blockedFor:0,wait:0};
  const player={x:0,z:14,r:R.SPEC.playerR};
  let min=Infinity;
  for(let i=0;i<80;i++){R.follow(taxi,0.1,[player]);min=Math.min(min,Math.hypot(taxi.x-player.x,taxi.z-player.z));}
  assert.equal(taxi.speed,0,'stopped');
  assert.ok(min>R.SPEC.nose+R.SPEC.playerR-0.05,'the cab does not reach the person');
  assert.ok(taxi.z<player.z-R.SPEC.nose);
  const side={x:8,z:player.z,r:R.SPEC.playerR};
  for(let i=0;i<30;i++)R.follow(taxi,0.1,[side]);
  assert.ok(taxi.speed>4,'it moves again once the road is clear');
});

test('someone beside the road does not stop a cab, and a cab behind another one keeps its distance',()=>{
  const taxi={x:0,z:0,yaw:0,speed:R.SPEC.cruise,s:0,loop:false,phase:'cruise',path:[{x:0,z:0},{x:0,z:40}],pathLen:40,blockedFor:0};
  let slow=false;for(let i=0;i<6;i++){R.follow(taxi,0.1,[{x:6,z:8,r:R.SPEC.playerR}]);if(taxi.speed<R.SPEC.cruise-1)slow=true;}
  assert.equal(slow,false);
  const lead={x:0,z:24,r:R.SPEC.taxiR},fol={x:0,z:8,yaw:0,speed:R.SPEC.cruise,s:0,loop:false,phase:'cruise',path:[{x:0,z:8},{x:0,z:40}],pathLen:32,blockedFor:0};
  for(let i=0;i<80;i++)R.follow(fol,0.1,[lead]);
  assert.equal(fol.speed,0);assert.ok(lead.z-fol.z>R.SPEC.nose+1,'it stops short of the cab ahead');
  lead.z=50;for(let i=0;i<20;i++)R.follow(fol,0.1,[lead]);
  assert.ok(fol.speed>3,'it follows once the cab ahead has moved on');
});

test('hailing a cab drives it to the player and then to the chosen stop, charging once',()=>{
  const s=city(),world=R.createTraffic(4,3),player={x:61,z:-90,riding:false};
  const called=R.hail(world,s,player,'avenue');
  assert.equal(called.ok,true);assert.ok(called.fare>0);
  assert.equal(R.hail(world,s,player,'passage').ok,false,'one booking at a time');
  let boarded=false,arrived=false;
  for(let i=0;i<1200&&!arrived;i++){
   R.stepWorld(world,0.1,player);
   const cab=world.job.cab;
   if(!boarded&&cab.phase==='waiting'){const door=R.doorPoints(cab)[0];player.x=door.x;player.z=door.z;
    const paid=R.board(world,s);assert.equal(paid.ok,true);assert.equal(paid.paid,called.fare);assert.equal(R.board(world,s).ok,false);boarded=true;player.riding=true;}
   if(player.riding){const seat=R.seatPoint(cab);player.x=seat.x;player.z=seat.z;}
   if(cab.phase==='arrived')arrived=true;
   for(const t of world.taxis)assert.ok(R.onRoad(t.x,t.z,0.2),t.id+' left the roads');
  }
  assert.ok(boarded&&arrived,'the cab arrived');
  const dest=zone('avenue');assert.ok(Math.hypot(world.job.cab.x-dest.position[0],world.job.cab.z-dest.position[1])<12);
  assert.equal(s.credits,100-called.fare);
  const left=R.exitRide(world,s);assert.equal(left.ok,true);assert.equal(s.story.flags.roadTaxiTrip,undefined);
  assert.equal(s.credits,100-called.fare,'stepping out does not charge again');
});

test('a cab that is waved off before boarding costs nothing, and a reload refunds a charged trip',()=>{
  const s=city(),world=R.createTraffic(2,9),player={x:40,z:-12.5,riding:false};
  assert.equal(R.hail(world,s,{x:61,z:-70},'passage').ok,true);
  R.stepWorld(world,0.2,player);
  assert.equal(R.cancel(world).ok,true);assert.equal(s.credits,100);assert.equal(world.job.released,true);
  const again=R.createTraffic(2,9);assert.equal(R.hail(again,s,{x:61,z:-70},'main').ok,true);
  for(let i=0;i<800&&again.job.cab.phase!=='waiting';i++)R.stepWorld(again,0.1,{x:61,z:-70,riding:false});
  assert.equal(again.job.cab.phase,'waiting');
  assert.equal(R.board(again,s).ok,true);
  const saved=C.restore(JSON.stringify(s));assert.equal(R.recover(saved),again.job.fare);
});

test('the cab, the registry and the map hail control ship with the game page',()=>{
  for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(f,'utf8');
   assert.ok(h.indexOf('void-runner/road-taxi-rules.js')>h.indexOf('void-runner/taxi-rules.js'));
   assert.ok(h.indexOf('void-runner/road-taxi-rules.js')<h.indexOf('void-runner/road-taxi.js'));
   assert.ok(h.indexOf('void-runner/road-taxi.js')>h.indexOf('void-runner/city-taxi.js'));
   assert.match(h,/<script type="text\/tdd-game" src="void-runner\/road-taxi\.js"><\/script>/);}
  const map=fs.readFileSync('void-runner/district-map.js','utf8');
  assert.match(map,/CALL TAXI/);assert.match(map,/data-map-hail/);assert.match(map,/DIRECTION ONLY/);
  const page=fs.readFileSync('void-runner/road-taxi.js','utf8');
  assert.match(page,/road-taxi-rules/);assert.doesNotMatch(page,/pod-music|Sleeping Pod|drawPod/);
});
