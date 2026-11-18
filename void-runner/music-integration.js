/* Feeds the game state to the music director each frame and lets the engine perform the result.
   Runs after menu.js's audio update; the old drone bed in ship-audio.js stays silent while active. */
(function(){
 const D=VoidMusicDirector,E=VoidMusicEngine,director=D.create();let warned=false;
 const musicUpdate=update;
 update=function(dt){
  musicUpdate(dt);
  try{
   if(!VoidAudio.settings.enabled){globalThis.VoidClubAudio?.update({active:false,dt});globalThis.VoidMusicArea=null;director.style=null;return;}
   // Inside a VR simulation the city's score gives way to the simulation's own ambience (vr-core.js).
   if(globalThis.VoidVR?.active||globalThis.VoidVR?.busy){E.stop?.();globalThis.VoidClubAudio?.update({active:false,dt});globalThis.VoidMusicArea=null;director.style=null;return;}
   // The player's own pod music (pod-music.js) replaces the city score while it plays, and pauses when the player leaves the District.
   if(globalThis.VoidPodMusic){globalThis.VoidPodMusic.update();if(globalThis.VoidPodMusic.playing){E.stop?.();globalThis.VoidClubAudio?.update({active:false,dt});globalThis.VoidMusicArea=null;director.style=null;return;}}
   VoidAudio.composerActive(true);
   // In a sleeping pod (waking, or making a character) no area music plays: the pod is quiet unless the player starts their own playlist.
   if(mode==='pod-waking'||mode==='character-creator'||state?.story?.flags?.podWakePending===true&&walkingLocation?.area==='interior'){   /* also with the pod's music panel open (the owner, 15 Nov 2026: the District's music is never heard in the pod) */E.stop?.();globalThis.VoidClubAudio?.update({active:false,dt});globalThis.VoidMusicArea=null;director.style=null;return;}
   const walking=!!walkingLocation&&!!walker&&['walking','dialogue','mission-log','road-taxi'].includes(mode);
   const flying=['play','pause','preparing-flight'].includes(mode)&&!!flight.route||mode==='play';
   const route=flight.route,far=route&&route.progress>=.5&&current?.destination;
   const stats=flying?VoidFlightCraft.stats():null;
   // On foot but not in plain walking (a panel open, a short hand-over between rooms): the music stays with where the player stands.
   const onFoot=walking||(!!walkingLocation&&!!walker&&!flying&&mode!=='menu');
   const c={
    mode:mode==='menu'?'menu':flying?'play':walking?'walking':'dock',
    location:state?.location,
    // In flight the score follows the system being flown through (past halfway, the destination's).
    system:VoidUniverse.system(far?current.destination:state?.location),
    phase:route?.phase,hazard:flying&&current?.kind==='hazard',
    combat:flying&&enemies.some(VoidStory.hostile),
    danger:flying&&stats&&hp<stats.hull*.25,
    dialogue:mode==='dialogue'||globalThis.VoidRelayRadio?.speaking===true,conversation:onFoot&&!!globalThis.VoidConversationUI?.isOpen,
    battle:flying&&!!globalThis.VoidFactionBattleState?.(),
    layoutKind:onFoot?walkingLocation.kind:null,place:onFoot?walkingLocation.id:null,
    walker:onFoot?{x:walker.x,z:walker.z}:null
   };
   // The nightclub's own sound (ncz-club-audio.js) decides how much of the city's music is left around it; the score keeps playing underneath.
   const club=globalThis.VoidClubAudio?.update({active:walking&&state?.location==='earth',dt,walker:walking?{x:walker.x,z:walker.z,yaw:walker.yaw}:null,doorOpen:!!globalThis.VoidNeoChinatown?.nightclub?.isOpen?.()}),target=D.step(director,c,dt);
   target.cityLevel=club?.city??1;
   // A conversation comes first: the music steps back a little while anyone is talking on voice chat, as it does for a spoken line.
   const talk=globalThis.VoidVoice;if(talk&&(talk.talking||talk.speaking?.length))target.duck=Math.max(target.duck||0,D.config.dialogueDuck);
   E.preload?.(D.neighbours[target.style]);
   // Where the player is, for the environmental sound (area-ambience.js).
   globalThis.VoidMusicArea=onFoot?{area:target.style,x:walker.x,z:walker.z,yaw:walker.yaw||0,city:target.cityLevel,at:performance.now()}:null;
   E.update(target);
  }catch(error){if(!warned){warned=true;console.warn('[VOID music]',error.message);}}
 };
 globalThis.VoidMusicDebug=()=>({style:E.current,speaker:E.speaker,director:{...director}});
})();
