/* Shared, dependency-free expansion definitions. All chapters are free. */
(function(root) {
  'use strict';
  const chapters = [
    { id: 'belt', name: 'Ghost Belt', subtitle: 'Bring the lost ships home.', color: '#ffbd69' },
    { id: 'lockdown', name: 'Corporate Lockdown', subtitle: 'Break the blockade.', color: '#ef79ff' },
    { id: 'gate', name: 'Beyond the Gate', subtitle: 'Something is answering.', color: '#58ffe1' }
  ];
  const definitions = [
    ['belt-1','Dead reckoning','belt','salvage','kepler',8,1,40,800,'Recover 3 drifting flight recorders. Fly through the cyan diamonds.'],
    ['belt-2','Shattered lane','belt','hazard','foundry',10,1.5,44,950,'Cross the debris field. Amber rocks damage your hull; steer around them.'],
    ['belt-3','Last light','belt','escort','meridian',12,2,48,1100,'Keep the rescue shuttle alive. Intercept incoming fire before it reaches the shuttle.'],
    ['belt-4','The iron mouth','belt','boss','foundry',9,2.5,50,1600,'Destroy the mining dreadnought. Its broadside opens gaps between volleys.'],
    ['lockdown-1','Unlisted passengers','lockdown','escort','undertow',12,2.5,48,1400,'Escort the evacuation shuttle through corporate patrols.'],
    ['lockdown-2','Cut the power','lockdown','generator','kepler',12,3,50,1500,'Destroy the shield relay first. It protects every other enemy.'],
    ['lockdown-3','Evidence locker','lockdown','salvage','meridian',14,3,52,1700,'Recover 3 encrypted evidence cores while holding off interceptors.'],
    ['lockdown-4','Hostile takeover','lockdown','boss','undertow',12,3.5,55,2200,'Disable the corporate carrier and its fan of suppressing fire.'],
    ['gate-1','Event horizon','gate','hazard','undertow',14,3.5,54,1900,'Navigate the unstable gate. Avoid the fragments spilling into the flight lane.'],
    ['gate-2','Voices in the static','gate','salvage','kepler',15,4,56,2100,'Retrieve 3 alien signal fragments. Stay moving; the guardians track you.'],
    ['gate-3','The other side','gate','generator','foundry',16,4,58,2400,'Break the alien shield anchor, then clear the gate approach.'],
    ['gate-4','Void sentinel','gate','boss','meridian',14,4.5,60,3200,'Defeat the sentinel. Its final phase fires faster as its hull collapses.']
  ];
  const missions = definitions.map((d,i) => ({id:d[0],name:d[1],chapter:d[2],kind:d[3],destination:d[4],enemies:d[5],tier:d[6],duration:d[7],reward:d[8],briefing:d[9],cargo:d[3]==='escort'?'Rescue shuttle':d[3]==='salvage'?'Recovered intelligence':'Sector clearance',legal:true,rep:3,requirement:5,requires:i?definitions[i-1][0]:null,contact:'Rook'}));
  const balance=()=>typeof module!=='undefined'?require('./balance.js').values:root.VoidBalance.values;
  const gear = {
    wraith: {name:'Wraith Cannon',slot:'weapon',get description(){const b=balance();return 'Piercing bolts. '+b.premiumLaserDamage.toFixed(2)+' damage at '+b.premiumLaserFireRate.toFixed(2)+' shots per second.';},symbol:'W',color:'#ef79ff'},
    aegis: {name:'Aegis Shield',slot:'shield',get description(){const b=balance();return b.premiumShield+' shield capacity. Regenerates '+b.premiumShieldRechargeRate+' per second after '+b.premiumShieldRechargeDelay+' seconds without a hit.';},symbol:'A',color:'#58ffe1'},
    ghost: {name:'Ghost Drive',slot:'utility',description:'A 0.7-second invulnerable speed burst. Press E or tap DRIVE. 8-second cooldown.',symbol:'G',color:'#ffbd69'},
    sentinel: {name:'Sentinel Drone',slot:'utility',description:'An autonomous wingmate fires a targeted 4-damage bolt every 0.7 seconds.',symbol:'S',color:'#a9ff6b'}
  };
  const creditGear = {
    vector: {name:'Vector Booster',slot:'utility',price:500,description:'A 0.4-second evasive burst. 12-second cooldown. Press E or tap DRIVE.',art:'ghost',color:'#ffbd69'},
    scout: {name:'Scout Drone',slot:'utility',price:700,description:'A wingmate fires a targeted 2-damage bolt every 1.2 seconds.',art:'sentinel',color:'#a9ff6b'}
  };
  const api = {chapters,missions,gear,creditGear};
  if (typeof module !== 'undefined') module.exports=api; else root.VoidContent=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
