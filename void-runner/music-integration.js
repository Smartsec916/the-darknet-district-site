/* Feeds the game state to the music director each frame and lets the engine perform the result.
   Runs after menu.js's audio update; the old drone bed in ship-audio.js stays silent while active. */
(function(){
 const D=VoidMusicDirector,E=VoidMusicEngine,director=D.create();let warned=false;
 const musicUpdate=update;
 update=function(dt){
  musicUpdate(dt);
  try{
   if(!VoidAudio.settings.enabled){globalThis.VoidClubAudio?.update({active:false,dt});return;}
   // Inside a VR simulation the city's score gives way to the simulation's own ambience (vr-core.js).
   if(globalThis.VoidVR?.active||globalThis.VoidVR?.busy){E.stop?.();globalThis.VoidClubAudio?.update({active:false,dt});return;}
   VoidAudio.composerActive(true);
   const walking=!!walkingLocation&&!!walker&&['walking','dialogue','mission-log'].includes(mode);
   const flying=['play','pause','preparing-flight'].includes(mode)&&!!flight.route||mode==='play';
   const route=flight.route,far=route&&route.progress>=.5&&current?.destination;
   const stats=flying?VoidFlightCraft.stats():null;
   const c={
    mode:mode==='menu'?'menu':flying?'play':walking?'walking':'dock',
    location:state?.location,
    // In flight the score follows the system being flown through (past halfway, the destination's).
    system:VoidUniverse.system(far?current.destination:state?.location),
    phase:route?.phase,hazard:flying&&current?.kind==='hazard',
    combat:flying&&enemies.some(VoidStory.hostile),
    danger:flying&&stats&&hp<stats.hull*.25,
    dialogue:mode==='dialogue'||globalThis.VoidRelayRadio?.speaking===true,
    battle:flying&&!!globalThis.VoidFactionBattleState?.(),
    layoutKind:walking?walkingLocation.kind:null,
    walker:walking?{x:walker.x,z:walker.z}:null
   };
   // The nightclub's own sound (ncz-club-audio.js) decides how much of the city's music is left around it; the score keeps playing underneath.
   const club=globalThis.VoidClubAudio?.update({active:walking&&state?.location==='earth',dt,walker:walking?{x:walker.x,z:walker.z,yaw:walker.yaw}:null,doorOpen:!!globalThis.VoidNeoChinatown?.nightclub?.isOpen?.()}),target=D.step(director,c,dt);
   target.cityLevel=club?.city??1;
   E.update(target);
  }catch(error){if(!warned){warned=true;console.warn('[VOID music]',error.message);}}
 };
 globalThis.VoidMusicDebug=()=>({style:E.current,speaker:E.speaker,director:{...director}});
})();
