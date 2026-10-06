/* One sensor controller for Campaign and disposable Flight Skirmish sessions. */
(function(){
 let sensors=VoidSensors.create();
 const reset=resetMissileFlight;
 resetMissileFlight=function(){sensors=VoidSensors.create();control.textContent='GO DARK';return reset();};
 const previousUpdate=update;
 update=function(dt){if(mode==='play')VoidSensors.step(sensors,dt,{throttle:Math.min(1,FM.length(flight.velocity||{})/70),firing:bullets.length>0});previousUpdate(dt);control.hidden=mode!=='play';};
 const candidates=lockCandidates;
 lockCandidates=function(){return sensors.radar?candidates().filter(e=>VoidSensors.detects(sensors,e)&&!globalThis.VoidFlightSkirmish?.lineBlocked(e)):[];};
 const select=selectCombatTarget;
 selectCombatTarget=function(action){select(action);if(selectedTarget&&!VoidSensors.detects(sensors,selectedTarget)){selectedTarget=null;missileLock=VoidTargeting.fresh();}};
 const balance=missileBalance;
 missileBalance=function(){const b=balance();return {...b,missileLockTime:b.missileLockTime*(sensors.profile.acquisition/1.5)/sensors.profile.lockQuality};};
 const status=missileStatus;
 missileStatus=function(){return sensors.radar?status():'RADAR OFF · ACTIVE LOCK UNAVAILABLE';};
 const control=document.createElement('button');control.id='sensor-toggle';control.className='quiet';control.hidden=true;document.querySelector('footer>div').prepend(control);
 function toggle(){if(mode!=='play')return;sensors.radar=!sensors.radar;VoidSensors.step(sensors,0);selectedTarget=null;missileLock=VoidTargeting.fresh();control.textContent=sensors.radar?'GO DARK':'RADAR ON';announce(sensors.radar?'Radar active.':'GO DARK · Passive sensors only. Engines and weapons remain detectable.');}
 control.textContent='GO DARK';control.addEventListener('click',toggle);
 globalThis.VoidFlightSensors={get state(){return sensors;},toggle,visible:e=>VoidSensors.detects(sensors,e),get range(){return VoidSensors.range(sensors);}};
})();
