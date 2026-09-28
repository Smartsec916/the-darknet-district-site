/* Final adapter around existing Campaign entry points; no resource or save migration. */
const VoidFlightSession=window.VoidFlightSession=VoidFlightLifecycle.create({
 clearInput:()=>clearInput(),
 cancel(){preparationGeneration++;VoidPreparation.cancel();VoidMenu.returnTo=null;},
 release(){VoidBabylon.release();}
});
let ownedLaunch=null;
const sessionLaunch=launch;
launch=function(){
 const existing=VoidFlightSession.active;
 if(existing)return ownedLaunch?.owner===existing?ownedLaunch.promise:Promise.resolve(existing);
 const owner=VoidFlightSession.begin();
 const promise=(async()=>{
  await owner.ready;
  if(!VoidFlightSession.owns(owner))return;
  try{
   await sessionLaunch();
   if(!VoidFlightSession.owns(owner))return;
   if(mode==='play'){VoidFlightSession.activate(owner);return owner;}
   await VoidFlightSession.end(owner);
  }catch(error){await VoidFlightSession.end(owner);throw error;}
 })();
 ownedLaunch={owner,promise};
 return promise;
};
const sessionDock=dock;
dock=async function(...args){
 const owner=VoidFlightSession.active;
 if(owner){const cleanup=VoidFlightSession.end(owner),token=preparationGeneration;await cleanup;if(token!==preparationGeneration||VoidFlightSession.active)return;}
 return sessionDock(...args);
};
const sessionJourney=newJourney;
newJourney=async function(...args){
 const owner=VoidFlightSession.active,cleanup=VoidFlightSession.end();
 // Also invalidate any pre-flight room/background preparation before a new Campaign.
 const token=++preparationGeneration;VoidPreparation.cancel();
 await cleanup;
 if(token!==preparationGeneration||VoidFlightSession.active)return;
 if(!owner)await VoidFlightSession.exclusive(()=>{if(token===preparationGeneration&&!VoidFlightSession.active)VoidBabylon.release();});
 if(token!==preparationGeneration||VoidFlightSession.active)return;
 VoidGraphics.busy=false;
 return sessionJourney(...args);
};
const sessionSavedWorld=resumeSavedWorld;
resumeSavedWorld=async function(...args){
 const cleanup=VoidFlightSession.end(),token=preparationGeneration;
 await cleanup;if(token!==preparationGeneration||VoidFlightSession.active)return;
 return sessionSavedWorld(...args);
};
const sessionRespawn=safeRespawn;
safeRespawn=async function(...args){
 const cleanup=VoidFlightSession.end(),token=preparationGeneration;
 await cleanup;if(token!==preparationGeneration||VoidFlightSession.active)return;
 return sessionRespawn(...args);
};
const sessionHurt=hurt;
hurt=function(...args){const result=sessionHurt(...args);if(mode==='over')VoidFlightSession.end();return result;};
const sessionEscortImpact=escortImpact;
escortImpact=function(...args){const result=sessionEscortImpact(...args);if(mode==='over')VoidFlightSession.end();return result;};
// Delayed/direct UI dispatch must not operate on an obsolete or paused flight.
const sessionFireMissile=fireMissile,sessionSelectTarget=selectCombatTarget,sessionDrive=activateDrive;
fireMissile=function(...args){if(mode==='play'&&VoidFlightSession.running())return sessionFireMissile(...args);};
selectCombatTarget=function(...args){if(mode==='play'&&VoidFlightSession.running())return sessionSelectTarget(...args);};
activateDrive=function(...args){if(mode==='play'&&VoidFlightSession.running())return sessionDrive(...args);};
let missionOwner=null;
const sessionOpenLog=openMissionLog,sessionCloseLog=closeMissionLog;
openMissionLog=function(){const owner=mode==='play'?VoidFlightSession.active:null;sessionOpenLog();if(owner&&mode==='mission-log'){missionOwner=owner;VoidFlightSession.pause(owner);}};
closeMissionLog=function(){if(missionOwner){const owner=missionOwner;missionOwner=null;if(!VoidFlightSession.resume(owner)){missionPanel?.remove();missionPanel=null;missionReturn=null;return;}}return sessionCloseLog();};
const sessionUpdate=update;
update=function(dt){if(mode==='play'&&!VoidFlightSession.running())return;sessionUpdate(dt);if(['over','recovery'].includes(mode))VoidFlightSession.end();};
