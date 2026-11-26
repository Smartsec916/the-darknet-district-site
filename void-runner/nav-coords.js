/* Flight-map coordinates (VoidNav), 20 Nov 2026. The owner: "For now with the mission to Rook I just want to keep it simple and only show the warp markers that are needed
   to get to Meridian Station. But once you deliver to Rook ... He will tell you that he's just sent you coordinates of locations throughout the world and it updates your
   flying Map App with the locations automatically. ... I want the Map App while flying to show all of the warp markers to every location within the system you're flying in
   as well as warp markers to the other systems you can get to from the system you're in."
   Which warp markers flight shows (world-integration.js flightRoutes, the Map app in flight-nav.js, campaign.js chooseDestination):
    - FULL ('full'): story.flags.navCoords === true. Every location of the system the player is in, and the warp marker (the hub) of every other system they can reach.
      grantCoordinates() makes every place of the open systems (Erebus, Tessaly) known; a faction system stays as its own story opened it (its homeworld stays closed).
    - ROUTE ONLY ('route'): no coordinates yet and an active mission somewhere else: only the markers on the way to it (universe.js nextHop: the place itself in this system,
      or the warp marker to its system), plus the way home to NeoChinatown (The Port).
    - KNOWN ('known'): no coordinates and no mission elsewhere: the places already discovered (as before), so nobody is ever left without a marker.
   Saves: navCoords is a boolean in story.flags (cloud saves accept it). A save from before this (navCoords unset) that already owns a ship and has flown or discovered
   beyond NeoChinatown gets navCoords=true on load (migrate, from campaign.js restore). A new ship (campaign.js awardStarterShip) sets navCoords=false, so a new pilot
   starts in route-only mode until Rook sends the coordinates (or a Mission Editor unlock "nav-coords" does). */
(function(root){
 'use strict';
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const FLAG='navCoords',ROOK_DONE='rook-first-delivery-done',OPEN_SYSTEMS=['erebus','sol'],HOME='earth',UNLOCK='nav-coords';
 const has=s=>s?.story?.flags?.[FLAG]===true;
 /* The first delivery to Rook is done: Mission 012 (First Cargo Delivery) sets it with its "Shared game flag" unlock (mission-content.js contract-flag). The one switch. */
 const rookDone=s=>s?.story?.flags?.[ROOK_DONE]===true;
 /* The places the coordinates cover: every place in the open systems. */
 const coordinatePlaces=()=>Object.keys(U.locations).filter(id=>OPEN_SYSTEMS.includes(U.system(id)));
 const known=s=>s?.universe?.discoveredLocations||[];
 /* Sets the flag and makes every coordinate place known. Returns true when something changed (a second call changes nothing and returns false). */
 function grant(s,reason){
  if(!s?.story?.flags||!s.universe||!Array.isArray(s.universe.discoveredLocations))return false;
  let changed=!has(s);for(const id of coordinatePlaces())if(!known(s).includes(id)){U.discover(s,id);changed=true;}
  s.story.flags[FLAG]=true;if(changed&&typeof reason==='string'&&/^[a-z][a-z0-9-]{0,39}$/.test(reason))s.story.flags.navCoordsFrom=reason;return changed;}
 /* A save from before the coordinates existed that already flies freely keeps every marker. */
 // Every ship owner already knows the Erebus and Tessaly places (universe.js restore: fresh, freeTravel, quest 'open'), so 'discovered beyond' means a faction system's place.
 function qualifies(s){const f=s?.story?.flags||{},u=s?.universe||{};if(f.shipAccess==='none'||u.freeTravel!==true)return false;
  return (u.visitedLocations||[]).some(id=>id!==HOME&&id!=='vesper')||known(s).some(id=>!coordinatePlaces().includes(id))||(f.missionPool!=='closed'&&s.quest!=='inheritance');}
 function migrate(s){if(has(s)){let changed=false;for(const id of coordinatePlaces())if(!known(s).includes(id)){U.discover(s,id);changed=true;}return changed;}if(!s?.story?.flags||s.story.flags[FLAG]!==undefined||!qualifies(s))return false;grant(s,'migrated');return true;}
 /* Which mode the Map app is in (see the top). active: VoidMissions.active() (Node tests pass a list). */
 function hops(s,active){const here=s.location,need=new Set();for(const m of active||[]){if(!m||m.completed||!m.destination||!U.locations[m.destination]||m.destination===here)continue;need.add(U.nextHop(here,m.destination));}return need;}
 function mode(s,active){return has(s)?'full':hops(s,active).size?'route':'known';}
 /* The marker ids (location ids) flight shows. Always a subset of universe.js destinations(), so every marker can be flown to. */
 function markers(s,active){const all=U.destinations(s);if(has(s))return all;const need=hops(s,active);if(!need.size)return all;if(s.location!==HOME)need.add(U.nextHop(s.location,HOME));const route=all.filter(id=>need.has(id));return route.length?route:all;}
 const api={FLAG,ROOK_DONE,UNLOCK,OPEN_SYSTEMS,HOME,has,rookDone,coordinatePlaces,grant,qualifies,migrate,mode,markers};
 if(typeof module!=='undefined'){module.exports=api;return;}
 root.VoidNav=api;

 // ---- browser ----
 const st=()=>{try{return state;}catch{return null;}};
 const TEXT='NAV DATA RECEIVED · every Erebus and Tessaly System location added to your Map';
 let activeAt=0,activeList=[],activeFor=null;
 /* Active missions, read at most once a second (flightRoutes asks every frame). */
 function active(){const s=st(),now=Date.now();if(s!==activeFor||now-activeAt>1000){activeAt=now;activeFor=s;try{activeList=VoidMissions.active(s,C);}catch{activeList=[];}}return activeList;}
 function shown(){const s=st();if(!s)return [];return markers(s,active());}
 function refresh(){try{const P=root.VoidPersonalDevice;if(P?.isOpen&&P.app==='map')P.openApp('map');}catch{}}
 function banner(){try{root.VoidV1?.notify?.({app:'map',key:'nav-coords',text:TEXT,hint:{text:'open',help:true}});}catch{}try{announce(TEXT);}catch{}}
 // The banner also follows a grant made elsewhere (a Mission Editor unlock): the flag turning true in the same campaign, not a load.
 let seenFor=null,seen=false;
 setInterval(()=>{const s=st();if(!s)return;if(s!==seenFor){seenFor=s;seen=has(s);return;}const now=has(s);if(now&&!seen){activeAt=0;banner();refresh();}seen=now;},1000);
 /* THE INTERFACE (for the Awakening tree and any code): gives the player every location's coordinates now. Idempotent: a second call changes nothing and shows nothing. */
 function grantCoordinates(reason){const s=st();if(!s)return false;const changed=grant(s,reason||'game');seenFor=s;seen=true;activeAt=0;if(!changed)return false;try{save();}catch{}banner();refresh();return true;}
 Object.assign(api,{grantCoordinates,shown,active,TEXT});
})(globalThis);
