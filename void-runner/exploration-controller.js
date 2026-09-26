/* Collision and interaction selection are engine-independent and deterministic. */
(function(root) {
  const radius = .38;

  function blocked(x, z, location) {
    if (Math.abs(x) > location.bounds[0] - radius || Math.abs(z) > location.bounds[1] - radius) return true;
    return location.solids.some(s => Math.abs(x - s.position[0]) < s.size[0] / 2 + radius && Math.abs(z - s.position[2]) < s.size[2] / 2 + radius);
  }

  const config={sensitivity:.0022,walk:3.4,sprint:5.6,crouch:1.65,acceleration:32,braking:44,gravity:18,jump:4.6};
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

  function select(player, location, allowed = () => true) {
    let best = null,
      nearest = Infinity;
    for (const item of location.interactions) {
      const dx = item.position[0] - player.x,
        dz = item.position[2] - player.z,
        distance = Math.hypot(dx, dz);
      if (distance > item.range || distance > nearest || !allowed(item)) continue;
      if (distance > .5 && (dx * Math.sin(player.yaw) + dz * Math.cos(player.yaw)) / distance < .55) continue;
      // Test horizontal line of sight; never interact through a wall.
      let occluded = false;
      for (let t = .15; t < distance - .45; t += .15)
        if (blocked(player.x + dx * t / distance, player.z + dz * t / distance, location)) {
          occluded = true;
          break;
        }
      if (!occluded) {
        best = item;
        nearest = distance;
      }
    }
    return best;
  }
  const api = {
    step,config,
    select,
    blocked,
    radius
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidExplorer = api;
})(globalThis);
