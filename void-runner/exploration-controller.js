/* Collision and interaction selection are engine-independent and deterministic. */
(function(root) {
  const radius = .38;

  function blocked(x, z, location, ignoreId=null) {
    if (Math.abs(x) > location.bounds[0] - radius || Math.abs(z) > location.bounds[1] - radius) return true;
    return location.solids.some(s => s.id!==ignoreId && !s.open && Math.abs(x - s.position[0]) < s.size[0] / 2 + radius && Math.abs(z - s.position[2]) < s.size[2] / 2 + radius);
  }

  const config={sensitivity:.0022,walk:3.9,sprint:6.4,crouch:1.65,acceleration:32,braking:44,gravity:18,jump:4.6};
  function step(player,input,dt,location){
    dt=Math.max(0,Math.min(.1,dt));const length=Math.max(1,Math.hypot(input.x,input.z)),speed=input.crouch?config.crouch:input.run?config.sprint:config.walk;
    const tx=(Math.cos(player.yaw)*input.x+Math.sin(player.yaw)*input.z)/length*speed,tz=(-Math.sin(player.yaw)*input.x+Math.cos(player.yaw)*input.z)/length*speed;
    const approach=(a,b,d)=>a+Math.sign(b-a)*Math.min(Math.abs(b-a),d),steps=Math.max(1,Math.ceil(dt/.008));
    if(player.jumpRequested){if(!(player.height>0)){player.vy=config.jump;player.height=.001;}player.jumpRequested=false;}
    for(let i=0;i<steps;i++){const t=dt/steps,acc=(length>1||input.x||input.z?config.acceleration:config.braking)*t;
      const ax=tx-(player.vx||0),az=tz-(player.vz||0),delta=Math.hypot(ax,az),gain=delta?Math.min(1,acc/delta):0;
      player.vx=(player.vx||0)+ax*gain;player.vz=(player.vz||0)+az*gain;
      if(!blocked(player.x+player.vx*t,player.z,location))player.x+=player.vx*t;else player.vx=0;
      if(!blocked(player.x,player.z+player.vz*t,location))player.z+=player.vz*t;else player.vz=0;
      if(player.height>0){player.vy-=config.gravity*t;player.height=Math.max(0,player.height+player.vy*t);if(!player.height)player.vy=0;}
      player.eye=approach(player.eye||1.68,input.crouch?1.08:1.68,4*t);player.y=player.eye+(player.height||0);
    }
  }

  /* Talking to people (the owner, 17 Nov 2026: "make the area that makes 'Talk to...' show up for all characters a little bigger"): a person's prompt reaches
     1.5x as far and over a wider look (about 69 degrees off centre instead of 57). Among people, the one nearest the centre of the view wins (then the nearer);
     against an object, a person counts at two thirds of the distance. Line of sight is checked as before: never through a wall or a counter. */
  const TALK = {reach: 1.5, cos: .35, objectCos: .55};
  const isTalk = item => item.talk === true || (item.talk !== false && /^(SPEAK WITH |TALK TO |TALK \/ |TALK — )/.test(String(item.label || '')));
  function visible(player, location, item, dx, dz, distance) {
    for (let t = .15; t < distance - .45; t += .15)
      if (blocked(player.x + dx * t / distance, player.z + dz * t / distance, location, item.action==='station-door'?item.door:null)) return false;
    return true;
  }
  function select(player, location, allowed = () => true) {
    let object = null, objectDistance = Infinity, person = null, personScore = null;
    const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw);
    for (const item of location.interactions) {
      const dx = item.position[0] - player.x,
        dz = item.position[2] - player.z,
        distance = Math.hypot(dx, dz), talk = isTalk(item);
      const facing = distance > .5 ? (dx * fx + dz * fz) / distance : 1;
      if (talk) {
        if (distance > item.range * TALK.reach || facing < TALK.cos || !allowed(item)) continue;
        if (person && (facing < personScore.facing - .02 || (Math.abs(facing - personScore.facing) <= .02 && distance >= personScore.distance))) continue;
        if (visible(player, location, item, dx, dz, distance)) { person = item; personScore = {facing, distance}; }
      } else {
        if (distance > item.range || distance > objectDistance || !allowed(item)) continue;
        if (facing < TALK.objectCos) continue;
        if (visible(player, location, item, dx, dz, distance)) { object = item; objectDistance = distance; }
      }
    }
    if (!person) return object;
    if (!object) return person;
    return objectDistance < personScore.distance / TALK.reach ? object : person;
  }
  const api = {
    step,config,
    select, isTalk, TALK,
    blocked,
    radius
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidExplorer = api;
})(globalThis);
