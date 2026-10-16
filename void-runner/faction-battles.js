/* Faction battles in flight (design doc 08). Each District delivery's outbound jump drops out
   once near the border, beside a small Communion vs Natural Order fight the player can watch or
   leave. The battle ships are not enemies: they are never targeted, locked or fired upon by the
   game's combat code, and they never fire on the player. Rules live in faction-battle.js. */
(function(){
 const FB=VoidFactionBattle;let battle=null,battleRoute=null;
 const clear=()=>{battle=null;battleRoute=null;};
 const battleUpdate=update;
 update=function(dt){
  const route=flight.route;
  if(mode==='play'&&!battle){
   const faction=FB.due(state,current,route);
   if(faction){
    FB.begin(state,route,faction);state.travel=route;save();
    battle=FB.create(faction,flightBasis());battleRoute=route;
    globalThis.VoidAudio?.event('exit',VoidFlightCraft.ship());
    announce('WARP DROP · Weapons fire near the '+VoidUniverse.systems[faction].name+' border. Align with your route to jump on when ready.');
   }
  }
   battleUpdate(dt);
  if(!battle)return;
  // Leaving (warp resumes, docking, death, menus) removes every ship, bolt and wreck.
  if(flight.route!==battleRoute||battleRoute.phase!=='align'||!['play','pause','mission-log'].includes(mode)){clear();return;}
  if(mode!=='play')return;
  FB.step(battle,dt,flight.velocity||{x:0,y:0,z:0});
  for(const e of battle.events.splice(0)){
   VoidCombatEffects.explode(e,e.kind);
   if(e.type==='destroyed')globalThis.VoidAudio?.event('explosion',VoidFlightCraft.ship(),e,flightBasis());
  }
  if(battle.ended&&!battle.wrecks.length)clear();
 };
 // During the drop only the mission route is offered, so the jump cannot be re-routed from here.
 const battleRoutes=flightRoutes;
 flightRoutes=function(){const routes=battleRoutes();return battle?routes.filter(r=>r.id===current?.destination):routes;};
 const battleSnapshot=migrationSnapshot;
 migrationSnapshot=function(){const s=battleSnapshot();if(battle){s.ships=[...s.ships,...FB.visible(battle)];s.factionShots=battle.shots;}return s;};
 globalThis.VoidFactionBattleState=()=>battle;
})();
