/* David's playthrough of 16 Nov 2026 ("I couldn't get to Milked. Couldn't figure out how to call a taxi."): nothing that could be reached before the city was cut into
   quarters may be cut off now, and a taxi can be called by walking up to a post. Pure data: the same collision the game walks on (exploration-controller.js blocked()). */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),Q=require('../void-runner/ncz-quarters.js'),MK=require('../void-runner/milked.js'),A=require('../void-runner/district-area.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..','void-runner',f),'utf8');
// Everywhere a walker can get to from `start`, on a 0.4 m grid. Doors that open for a walker (gates, Milked, the District, NULL) count as open.
function reachable(L,start){const step=.4,seen=new Set(),key=(i,j)=>i+','+j,loc={...L,solids:L.solids.filter(s=>!(s.door||/door/.test(s.id)))},stack=[[Math.round(start[0]/step),Math.round(start[1]/step)]];seen.add(key(...stack[0]));
 while(stack.length){const [i,j]=stack.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(i+a,j+b);if(seen.has(k)||E.blocked((i+a)*step,(j+b)*step,loc))continue;seen.add(k);stack.push([i+a,j+b]);}}
 return (x,z,r=1.2)=>{for(let dx=-r;dx<=r+1e-9;dx+=step)for(let dz=-r;dz<=r+1e-9;dz+=step)if(seen.has(key(Math.round((x+dx)/step),Math.round((z+dz)/step))))return true;return false;};}
const street=q=>N.layout('street',q),districtDoor=()=>A.exitSpawn(N).spawn;
test('from The Darknet District\'s street door a walker can reach Milked (front door and rear door), NULL, the alley, Main Street, every Old Town gate and every taxi stop',()=>{
 const L=street('oldtown'),d=districtDoor(),can=reachable(L,[d[0],d[2]]);assert.equal(E.blocked(d[0],d[2],L),false,'the District\'s door opens onto clear ground');
 assert.ok(can(MK.DOOR.x,MK.DOOR.z+1,.8),'Milked\'s front door, from the side street');assert.ok(can(MK.REAR.x,MK.REAR.z-1,.8),'Milked\'s rear door, from the service alley');
 const intercom=L.interactions.find(i=>i.id==='milked-intercom');assert.ok(intercom,'Milked\'s check-in is part of the Old Town street');assert.ok(can(intercom.position[0],intercom.position[2],intercom.range),'and can be walked to');
 assert.ok(can((MK.LANE[0]+MK.LANE[1])/2,(MK.LANE[2]+MK.LANE[3])/2),'Milked\'s side street');assert.ok(can(61,-66)&&can(61,-100)&&can(61,-40),'Main Street, end to end');assert.ok(can(100,-58.5),'the alley');
 const club=L.interactions.find(i=>i.id==='club-bar');if(club)assert.ok(can(club.position[0],club.position[2],club.range),'NULL\'s bar');
 for(const g of Q.gatesOf('oldtown'))for(const l of Q.lanesOf(g.id)){const e=Q.endOf(g,'oldtown'),dr=l.doors[e],out=e==='lo'?-1.2:1.2,[x,z]=g.axis==='z'?[dr.x,dr.z+out]:[dr.x+out,dr.z];assert.ok(can(x,z,.8),g.name+' '+l.id+' can be walked up to');assert.ok(can(l.mid[0],l.mid[1],.8),g.name+' '+l.id+' can be walked into');}
 for(const s of Q.STOPS.filter(s=>s.quarter==='oldtown'))assert.ok(can(s.position[0],s.position[1]),'taxi stop '+s.name);
});
test('in the Port and on the Avenue every gate lane, taxi stop and prompt can be reached from where a walker arrives',()=>{
 for(const q of ['port','avenue']){const L=street(q),can=reachable(L,[L.spawn[0],L.spawn[2]]);
  for(const g of Q.gatesOf(q))for(const l of Q.lanesOf(g.id))assert.ok(can(l.mid[0],l.mid[1],.8),q+': '+g.name+' '+l.id);
  for(const s of Q.STOPS.filter(s=>s.quarter===q))assert.ok(can(s.position[0],s.position[1]),q+': taxi stop '+s.name);
  for(const p of Q.callPrompts(q))assert.ok(can(p.position[0],p.position[2],.4),q+': '+p.id);}
 const port=street('port'),can=reachable(port,[port.spawn[0],port.spawn[2]]);for(const id of ['board','terminal']){const i=port.interactions.find(x=>x.id===id);assert.ok(can(i.position[0],i.position[2],i.range),'the pad\'s '+id);}
});
test('CALL A TAXI: a prompt at the post of each of the seven stops and one by the District\'s door, each on open ground beside its post',()=>{
 assert.equal(Q.CALL_LABEL,'CALL A TAXI');assert.deepEqual(Q.CALL_POINTS.map(c=>c.id),[...Q.STOPS.map(s=>s.id),'district-door']);
 let n=0;for(const q of Q.IDS){const L=street(q),prompts=L.interactions.filter(i=>i.action==='road-taxi-call');assert.deepEqual(prompts.map(p=>p.id),Q.CALL_POINTS.filter(c=>c.quarter===q).map(c=>'taxi-call-'+c.id),q+' has its own prompts and nobody else\'s');
  for(const p of prompts){n++;assert.equal(p.label,'CALL A TAXI');assert.equal(E.blocked(p.position[0],p.position[2],L),false,p.id+' stands on open ground');
   const c=Q.CALL_POINTS.find(c=>'taxi-call-'+c.id===p.id);assert.ok(Math.hypot(p.position[0]-c.post[0],p.position[2]-c.post[1])<1,'beside its post');assert.ok(Q.inQuarter(q,c.post[0],c.post[1]),p.id+' post is in its quarter');
   for(const o of L.interactions)if(o!==p&&o.action!=='road-taxi-call')assert.ok(Math.hypot(o.position[0]-p.position[0],o.position[2]-p.position[2])>1.5,p.id+' does not sit on top of '+o.id);}}
 assert.equal(n,8);
 for(const s of Q.STOPS){assert.equal(s.post.length,3);assert.ok(Math.hypot(s.post[0]-s.position[0],s.post[1]-s.position[1])<8,s.id+': the post is at its stop');}
 const d=districtDoor(),door=Q.callPrompts('oldtown').find(p=>p.id==='taxi-call-district-door');assert.ok(Math.hypot(door.position[0]-d[0],door.position[2]-d[2])<5,'a taxi can be called a few steps from the District\'s door');
 assert.equal(N.layout('interior').interactions.some(i=>i.action==='road-taxi-call'),false,'no taxi prompt indoors');assert.equal(N.layout('all').interactions.some(i=>i.action==='road-taxi-call'),false);
});
test('the prompt and the G key open the list of destinations and fares; the posts are built from the same list',()=>{
 const r=read('road-taxi.js'),g=read('ncz-gates.js');
 assert.match(r,/VoidInteractions\.register\('road-taxi-call'/);assert.match(r,/VoidHUD\?\.open\?\.\('taxi'\)/);assert.match(r,/e\.code!=='KeyG'/);assert.match(read('personal-hud.js'),/\['taxi','TAXI \/ TRANSPORT'\]/);
 // the cause found on 16 Nov 2026: with the terminal open the game's mode is 'hud', and the list refused everyone as "not on foot"
 assert.match(r,/mode==='hud'&&globalThis\.VoidHUD\?\.returnMode==='walking'/);assert.match(read('personal-hud.js'),/get returnMode\(\)\{return returnMode;\}/);
 {const R=require('../void-runner/road-taxi-rules.js'),C=require('../void-runner/campaign.js'),s=C.fresh();s.location='earth';s.credits=100;
  assert.equal(R.availability(s,{onFoot:false,area:'street',quarter:'oldtown'}).ok,false);assert.equal(R.availability(s,{onFoot:true,area:'street',quarter:'oldtown'}).ok,true,'a player reading the terminal on the street is offered taxis');
  const d=R.destinations(s,{onFoot:true,area:'street',player:[67.5,-66],quarter:'oldtown'});for(const id of ['milked','main','passage','avenue','corporate','temple'])assert.ok(d.find(x=>x.id===id),'the list offers '+id);assert.ok(d.every(x=>typeof x.fare==='number'),'each with its fare');}
 assert.match(g,/Q\.CALL_POINTS\.filter\(x=>x\.quarter===quarter\)/);assert.match(g,/signMat\('taxi',\['TAXI'\]/);assert.match(g,/gate-taxi-lamp/);
 const K=require('../void-runner/keymap.js');assert.ok(K.place(K.entries('walking',K.DEFAULTS,{})).keys.some(k=>k.code==='KeyG'&&k.label==='Taxi'),'the KeyMap shows the taxi key');
});
test('a taxi can be called from every CALL A TAXI prompt, including the one by the District\'s door (it used to be refused there: more than 50 m from a road)',()=>{
 const R=require('../void-runner/road-taxi-rules.js'),C=require('../void-runner/campaign.js');
 for(const q of Q.IDS)for(const p of Q.callPrompts(q)){const s=C.fresh();s.location='earth';s.credits=500;const world=R.createTraffic(2,4127,q),player={x:p.position[0],z:p.position[2],riding:false};
  const list=R.destinations(s,{onFoot:true,area:'street',player:[player.x,player.z],quarter:q}).filter(d=>d.ok);assert.ok(list.length>=5,p.id+' offers destinations');
  const res=R.hail(world,s,player,list[0].id,{onFoot:true,area:'street',player:[player.x,player.z],quarter:q});assert.equal(res.ok,true,p.id+': '+res.reason);assert.ok(res.walk<=R.PICKUP_REACH);
  if(p.id==='taxi-call-district-door'){assert.ok(res.walk>50,'the cab waits at the alley\'s mouth, a walk away: '+res.walk+' m');assert.ok(res.pickup.x<72,'on Main Street');
   const m=R.hail(R.createTraffic(2,4127,q),s,player,'milked',{onFoot:true,area:'street',player:[player.x,player.z],quarter:q});assert.equal(m.ok,true,'Milked corner can be called from the District\'s door');}}
 // and from the door itself, and from the far end of the alley
 for(const x of [126.9,135]){const s=C.fresh();s.location='earth';s.credits=500;const res=R.hail(R.createTraffic(2,4127,'oldtown'),s,{x,z:-58.5,riding:false},'milked',{onFoot:true,area:'street',player:[x,-58.5],quarter:'oldtown'});assert.equal(res.ok,true,'x '+x+': '+res.reason);}
});
