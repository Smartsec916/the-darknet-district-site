/* Flying taxi rules (David's brief, 2026-10-27). No rendering: availability, destinations, fares and pickup zones.
   - Service exists only where a city registers a network (NeoChinatown for now). Not in space, not inside stations,
     not inside the District, never during a fight or a scene change.
   - The fare is shown before you call, charged once when the doors close, and recorded in story.flags.taxiTrip until
     you arrive. A trip interrupted by a reload is refunded once (the trip itself never resumes mid-air).
   - Return to Ship lands at the zone nearest the ship's actual parked position (from the location's layout). */
(function(root){
 'use strict';
 const node=typeof module!=='undefined',N=node?require('./neochinatown.js'):root.VoidNeoChinatown;
 const fare={base:12,perMetre:.05,max:60};
 // City networks by location id. Each lists its zones and destinations (a destination lands at one zone).
 const networks={
  earth:{name:'NeoChinatown Sky Cabs',zones:()=>N.taxiZones,destinations:()=>[
   {id:'ship',label:'Return to ship',zone:null,ship:true},
   {id:'district',label:'The Darknet District',zone:'alley-mouth'},
   {id:'main',label:'Main Street',zone:'main'},
   {id:'avenue',label:'The avenue',zone:'avenue'},
   ...N.districts.map(d=>({id:d.id,label:d.name,zone:d.id,placeholder:true}))]}
 };
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 // ctx: {mode, onFoot, area ('street'|'district'|'terrace'), busy, combat, location}. Returns {ok, reason}.
 function availability(s,ctx={}){
  const net=networks[s?.location];
  if(!net)return {ok:false,reason:ctx.inSpace?'No taxis fly in space.':'No taxi service operates here.'};
  if(!ctx.onFoot)return {ok:false,reason:'Taxis pick up on foot, in the city.'};
  if(ctx.area==='district')return {ok:false,reason:'Taxis can’t land in The Darknet District. Step out into the alley first.'};
  if(ctx.combat)return {ok:false,reason:'No cab will come in while there’s fighting.'};
  if(ctx.busy)return {ok:false,reason:'Try again in a moment.'};
  if(s?.story?.flags?.taxiBlocked)return {ok:false,reason:'Taxi service is suspended for this mission.'};
  return {ok:true,network:net.name};
 }
 function zones(s){return networks[s?.location]?.zones()||[];}
 function zone(s,id){return zones(s).find(z=>z.id===id)||null;}
 // The zone closest to a point (a pickup near the player, or a drop near the ship).
 function nearestZone(s,p,except){let best=null,d=Infinity;for(const z of zones(s)){if(z.id===except)continue;const k=dist(z.position,p);if(k<d){d=k;best=z;}}return best;}
 // The ship's real parked position here (the 'ship' solid in the location's layout), or null.
 function shipPosition(layout){const s=layout?.solids?.find(x=>x.id==='ship');return s?[s.position[0],s.position[2]]:null;}
 function cost(from,to){return Math.min(fare.max,Math.round(fare.base+fare.perMetre*dist(from,to)));}
 // Destinations with their landing zone, fare and whether they can be chosen. ctx: {player:[x,z], layout}.
 function destinations(s,ctx){const net=networks[s?.location];if(!net)return [];const pickup=nearestZone(s,ctx.player),ship=shipPosition(ctx.layout);
  return net.destinations().map(d=>{const z=d.ship?(ship&&nearestZone(s,ship)):zone(s,d.zone);if(!z)return {...d,ok:false,reason:'No landing zone.'};
   if(d.ship&&dist(ctx.player,ship)<25)return {...d,zone:z.id,ok:false,reason:'Your ship is right here.'};
   if(pickup&&z.id===pickup.id||dist(ctx.player,z.position)<20)return {...d,zone:z.id,ok:false,reason:'You’re already there.'};
   const price=cost(pickup.position,z.position);return {...d,zone:z.id,fare:price,ok:s.credits>=price,reason:s.credits>=price?null:'Not enough credits ('+price+' CR).'};});}
 // Charging: once, when the doors close. Returns the amount or 0.
 function charge(s,dest,price){if(s.story.flags.taxiTrip||s.credits<price)return 0;s.credits-=price;s.story.flags.taxiTrip=dest+':'+price;return price;}
 function arrive(s){delete s.story.flags.taxiTrip;}
 // A trip still recorded after a reload was interrupted: refund it once.
 function recover(s){const m=/^[a-z-]+:(\d{1,4})$/.exec(String(s?.story?.flags?.taxiTrip||''));if(!m)return 0;delete s.story.flags.taxiTrip;const back=Number(m[1]);s.credits+=back;return back;}
 const api={fare,networks,availability,zones,zone,nearestZone,shipPosition,cost,destinations,charge,arrive,recover};
 if(node)module.exports=api;else root.VoidTaxiRules=api;
})(globalThis);
