// Street taxis: destinations come only from the stops and far places in ncz-quarters.js, cabs stay on the roads of their quarter,
// a person in front of one brings it to a stop, and a trip to another quarter or district goes through the checkpoints' vehicle bays.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../void-runner/neochinatown.js'),C=require('../void-runner/campaign.js'),Q=require('../void-runner/ncz-quarters.js'),R=require('../void-runner/road-taxi-rules.js');
const city=()=>{const s=C.fresh();s.location='earth';s.credits=100;return s;};
const zone=id=>N.taxiZones.find(z=>z.id===id);

test('the stops are the only destination list, each in its own quarter, plus the two places beyond the gates',()=>{
  const stops=R.stops(),ids=stops.map(d=>d.id);
  assert.deepEqual(ids,R.REGISTRY);
  assert.deepEqual(ids,['passage','main','milked','alley-mouth','avenue','function-gate','east-gate']);
  for(const d of stops){const z=zone(d.id);assert.ok(z,d.id);assert.deepEqual(d.position,z.position);assert.equal(d.label,z.name);assert.equal(Q.quarterAt(d.position[0],d.position[1]),d.quarter);}
  assert.deepEqual(R.stops('port').map(d=>d.id),['passage']);
  for(const d of N.districts.filter(d=>d.retired))assert.ok(!ids.includes(d.id),d.id+' is behind a shut gate, not a stop');
  assert.equal(R.cost([0,0],[80,0]),16);assert.equal(R.cost([0,0],[5000,0]),60,'never more than 60 CR');
  assert.equal(fs.existsSync('void-runner/sky-cab.js')||fs.existsSync('void-runner/city-taxi.js')||fs.existsSync('void-runner/taxi-rules.js'),false,'the sky cabs are gone');
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
  assert.equal(far.ok,true);assert.ok(far.fare>=R.fare.base&&far.fare<=R.fare.max);assert.deepEqual(far.legs.map(l=>l.gate),['north','customs']);assert.match(far.via,/North Gate, then Port Customs/);
  s.credits=1;assert.equal(R.destinations(s,{player:[40,-12.5]}).find(d=>d.id==='passage').ok,false);
  const list=R.destinations(city(),{player:[126.9,-59.3]});assert.deepEqual(list.filter(d=>d.far).map(d=>[d.id,d.fare]),[['corporate',60],['temple',60]]);
});

test('the fare is charged once and refunded once if the trip is interrupted',()=>{
  const s=city();assert.equal(R.charge(s,'avenue',24),24);assert.equal(s.credits,76);assert.equal(R.charge(s,'avenue',24),0);
  assert.equal(s.story.flags.roadTaxiTrip,'avenue:24');
  const saved=C.restore(JSON.stringify(s));assert.equal(R.recover(saved),24);assert.equal(saved.credits,100);assert.equal(R.recover(saved),0);
  R.arrive(s);assert.equal(s.story.flags.roadTaxiTrip,undefined);
});

test('every lane, turn and spur of every quarter stays on a road of that quarter, and reaches the middle of each vehicle bay',()=>{
  for(const q of Q.IDS){const net=R.network(q);assert.equal(net.quarter,q);
   for(const e of net.edges){const L=R.pathLength(e.pts);for(let s=0;s<=L;s+=.5){const p=R.pointAlong(e.pts,s,false);
    assert.ok(R.onRoad(p.x,p.z,0.05),q+' '+e.id+' leaves the roads at '+p.x.toFixed(1)+','+p.z.toFixed(1));assert.ok(Q.inQuarter(q,p.x,p.z),q+' '+e.id+' leaves the quarter');
    // a cab is never inside a gate except in a bay
    for(const g of Q.gatesOf(q))if(p.x>g.rect[0]&&p.x<g.rect[1]&&p.z>g.rect[2]&&p.z<g.rect[3])assert.ok(Q.lanesOf(g.id).some(l=>l.kind==='bay'&&p.x>l.rect[0]+.9&&p.x<l.rect[1]-.9&&p.z>=l.rect[2]&&p.z<=l.rect[3]||l.kind==='bay'&&p.z>l.rect[2]+.9&&p.z<l.rect[3]-.9&&p.x>=l.rect[0]&&p.x<=l.rect[1]),q+' '+e.id+' drives through a wall of '+g.id);}}
   for(const g of Q.gatesOf(q))for(const l of Q.lanesOf(g.id).filter(l=>l.kind==='bay')){const b=net.bays[l.key];assert.ok(b&&Math.hypot(b.x-l.mid[0],b.z-l.mid[1])<.01,q+' '+l.key);assert.ok(net.edges.some(e=>Math.hypot(e.pts[0].x-b.x,e.pts[0].z-b.z)<.01)||net.edges.some(e=>{const z=e.pts[e.pts.length-1];return Math.hypot(z.x-b.x,z.z-b.z)<.01;}));}
   const alley=N.streets.alley,pad=N.streets.pad;
   for(const e of net.edges)for(const p of e.pts){
    assert.ok(!(p.x>alley[0]&&p.x<alley[1]&&p.z>alley[2]&&p.z<alley[3]),'cabs do not drive the alley');
    assert.ok(!(p.x>pad[0]&&p.x<pad[1]&&p.z>pad[2]&&p.z<pad[3]),'cabs do not drive onto the landing pad');
   }}
  assert.equal(R.network('port').loop.length,0);assert.ok(R.network('port').rank,'the Port keeps one cab at a rank');
});

test('a route between two real stops stays on the roads and reaches the stop',()=>{
  const net=R.network('oldtown'),from=zone('main'),to=zone('alley-mouth');
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

// drive a trip in one quarter until the cab is at the stop or standing in a gate's bay
function run(world,s,player,until){let boarded=player.riding;for(let i=0;i<4000;i++){R.stepWorld(world,0.1,player);const cab=world.job.cab;
  if(!boarded&&cab.phase==='waiting'){const door=R.doorPoints(cab)[0];player.x=door.x;player.z=door.z;const paid=R.board(world,s);assert.equal(paid.ok,true);assert.equal(R.board(world,s).ok,false);boarded=true;player.riding=true;}
  if(player.riding){const seat=R.seatPoint(cab);player.x=seat.x;player.z=seat.z;}
  for(const t of world.taxis)assert.ok(R.onRoad(t.x,t.z,0.2)&&Q.inQuarter(world.quarter,t.x,t.z,.2),t.id+' left the roads of '+world.quarter);
  if(cab.phase===until)return true;}return false;}
test('hailing a cab drives it to the player and then to the chosen stop, charging once',()=>{
  const s=city(),world=R.createTraffic(4,3,'oldtown'),player={x:61,z:-90,riding:false};
  const called=R.hail(world,s,player,'alley-mouth');
  assert.equal(called.ok,true);assert.ok(called.fare>0);
  assert.equal(R.hail(world,s,player,'main').ok,false,'one booking at a time');
  assert.ok(run(world,s,player,'arrived'),'the cab arrived');
  const dest=zone('alley-mouth');assert.ok(Math.hypot(world.job.cab.x-dest.position[0],world.job.cab.z-dest.position[1])<12);
  assert.equal(s.credits,100-called.fare);
  const left=R.exitRide(world,s);assert.equal(left.ok,true);assert.equal(s.story.flags.roadTaxiTrip,undefined);
  assert.equal(s.credits,100-called.fare,'stepping out does not charge again');
});

test('a trip to another quarter drives into the gate\'s bay, is carried through, and ends at the stop; the fare is paid once and stays on record until the end',()=>{
  const s=city(),world=R.createTraffic(2,3,'port'),player={x:40,z:-97,riding:false};
  assert.equal(world.taxis.length,1);assert.equal(world.taxis[0].phase,'parked');
  const called=R.hail(world,s,player,'avenue');assert.equal(called.ok,true);
  assert.ok(run(world,s,player,'in-bay'));assert.deepEqual(world.job.via,{gate:'customs',lane:'customs:bay',from:'port',to:{quarter:'oldtown'}});
  assert.ok(Q.atCentre(Q.lane('customs:bay'),{x:world.job.cab.x,z:world.job.cab.z})||Math.hypot(world.job.cab.x-Q.lane('customs:bay').mid[0],world.job.cab.z-Q.lane('customs:bay').mid[1])<.5,'the cab stands in the middle of the bay');
  assert.equal(R.exitRide(world,s).ok,false,'nobody steps out inside a checkpoint');
  // Old Town
  let trip=R.carry(world.job);const old=R.createTraffic(2,3,'oldtown'),job2=R.resume(old,trip);assert.equal(job2.charged,true);assert.equal(job2.cab.yaw,Q.yawInto('customs','oldtown'));assert.ok(Math.hypot(job2.cab.x-world.job.cab.x,job2.cab.z-world.job.cab.z)<.5,'the same bay');
  assert.ok(run(old,s,player,'in-bay'));assert.equal(old.job.via.lane,'north:bay-n');assert.deepEqual(old.job.via.to,{quarter:'avenue'});
  // The Avenue
  trip=R.carry(old.job);const ave=R.createTraffic(2,3,'avenue');R.resume(ave,trip);assert.equal(ave.job.via,null);
  assert.ok(run(ave,s,player,'arrived'));const dest=zone('avenue');assert.ok(Math.hypot(ave.job.cab.x-dest.position[0],ave.job.cab.z-dest.position[1])<12);
  assert.equal(s.credits,100-called.fare);assert.equal(s.story.flags.roadTaxiTrip,'avenue:'+called.fare,'still on record, so a reload on the way refunds it');
  assert.equal(R.exitRide(ave,s).ok,true);assert.equal(s.story.flags.roadTaxiTrip,undefined);
  // the Port has one cab: the moment its passenger has stepped out it can be called again
  const port=R.createTraffic(1,3,'port'),p2={x:40,z:-97,riding:false};assert.equal(R.hail(port,s,p2,'main').ok,true);assert.ok(run(port,s,p2,'in-bay'));const o=R.createTraffic(1,3,'port');R.resume(o,{dest:R.stops().find(d=>d.id==='passage'),fare:5,legs:[],through:{gate:'customs',lane:'customs:bay'}});
  assert.ok(run(o,s,{x:0,z:0,riding:true},'arrived'));assert.equal(R.exitRide(o,s).ok,true);assert.equal(R.hail(o,s,{x:40,z:-97,riding:false},'avenue').ok,true,'called again at once');
});

test('the Corporate District and the Temple: 60 CR, through the Function Gate and the East Gate, and the ride back starts in the gate and costs nothing',()=>{
  for(const [id,gate,stop] of [['corporate','function','function-gate'],['temple','east','east-gate']]){
   const s=city(),world=R.createTraffic(2,5,'avenue'),player={x:61,z:-8,riding:false};const called=R.hail(world,s,player,id);assert.equal(called.ok,true);assert.equal(called.fare,60);
   assert.ok(run(world,s,player,'in-bay'));assert.deepEqual(world.job.via.to,{scene:id});assert.equal(world.job.via.gate,gate);assert.equal(s.credits,40);
   assert.deepEqual(R.carry(world.job).legs,[]);
   // back
   const back=R.returnTrip(id),w2=R.createTraffic(2,5,'avenue'),rider={x:0,z:0,riding:true};assert.equal(back.fare,0);assert.equal(back.through.gate,gate);R.resume(w2,back);
   assert.ok(run(w2,s,rider,'arrived'));const z=zone(stop);assert.ok(Math.hypot(w2.job.cab.x-z.position[0],w2.job.cab.z-z.position[1])<12,id+' ride back ends at '+stop);assert.equal(s.credits,40,'no second fare');}
  assert.equal(R.returnTrip('moon'),null);
});

test('a cab that is waved off before boarding costs nothing, and a reload refunds a charged trip',()=>{
  const s=city(),world=R.createTraffic(2,9,'oldtown'),player={x:40,z:-12.5,riding:false};
  assert.equal(R.hail(world,s,{x:61,z:-70},'passage').ok,true);
  R.stepWorld(world,0.2,player);
  assert.equal(R.cancel(world).ok,true);assert.equal(s.credits,100);assert.equal(world.job.released,true);
  const again=R.createTraffic(2,9,'oldtown');assert.equal(R.hail(again,s,{x:61,z:-70},'main').ok,true);
  for(let i=0;i<800&&again.job.cab.phase!=='waiting';i++)R.stepWorld(again,0.1,{x:61,z:-70,riding:false});
  assert.equal(again.job.cab.phase,'waiting');
  assert.equal(R.board(again,s).ok,true);
  const saved=C.restore(JSON.stringify(s));assert.equal(R.recover(saved),again.job.fare);
});

test('the cab, the registry and the map hail control ship with the game page',()=>{
  for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(f,'utf8');
   assert.ok(h.indexOf('void-runner/road-taxi-rules.js')>h.indexOf('void-runner/ncz-quarters.js'));assert.doesNotMatch(h,/sky-cab\.js|city-taxi\.js|void-runner\/taxi-rules\.js/);
   assert.ok(h.indexOf('void-runner/road-taxi-rules.js')<h.indexOf('void-runner/road-taxi.js'));
   assert.ok(h.indexOf('void-runner/ncz-gate-transit.js')>h.indexOf('void-runner/milked-transition.js'));
   assert.match(h,/<script type="text\/tdd-game" src="void-runner\/road-taxi\.js"><\/script>/);}
  const map=fs.readFileSync('void-runner/district-map.js','utf8');
  assert.match(map,/CALL TAXI/);assert.match(map,/data-map-hail/);assert.match(map,/DIRECTION ONLY/);
  const page=fs.readFileSync('void-runner/road-taxi.js','utf8');
  assert.match(page,/road-taxi-rules/);assert.doesNotMatch(page,/pod-music|Sleeping Pod|drawPod/);
});
