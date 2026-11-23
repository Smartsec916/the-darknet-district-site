/* Collision and interaction selection are engine-independent and deterministic. */
(function(root) {
  const radius = .38;

  function blocked(x, z, location, ignoreId=null) {
    if (Math.abs(x) > location.bounds[0] - radius || Math.abs(z) > location.bounds[1] - radius) return true;
    return location.solids.some(s => s.id!==ignoreId && !s.open && Math.abs(x - s.position[0]) < s.size[0] / 2 + radius && Math.abs(z - s.position[2]) < s.size[2] / 2 + radius);
  }

  /* NEVER STUCK IN A SOLID (the owner, 20 Nov 2026: "look for reasons you might get stuck in a housing room and can't move once you enter. maybe stuck in the couch"):
     - depth(): how far the player's circle reaches into the solids at (x, z) (0: standing free). A move that is blocked is still allowed when the player already
       overlaps something and the move takes him further out of it, so a spawn, a door closing or a collision box placed on him can never hold him in place
       (he walks out the way he came; never further in, never through a wall from outside).
     - free(): the nearest spot (in rings of 0.1 m, up to `max` metres) where the player can stand; for arrivals and the stuck check below.
     - watch(): the quiet unstick. When a movement key has been held for 2 s, the player has not moved and he cannot step even 5 cm in any of the four
       directions, he is put on the nearest free spot. Walking into a wall never triggers it (the other directions are open). */
  function depth(x, z, location) {
    let d = 0;
    for (const s of location.solids) { if (s.open) continue; const px = s.size[0] / 2 + radius - Math.abs(x - s.position[0]), pz = s.size[2] / 2 + radius - Math.abs(z - s.position[2]); if (px > 0 && pz > 0) d += Math.min(px, pz); }
    const bx = Math.abs(x) - (location.bounds[0] - radius), bz = Math.abs(z) - (location.bounds[1] - radius); if (bx > 0) d += bx; if (bz > 0) d += bz;
    return d;
  }
  function free(x, z, location, max = 4) {
    if (!blocked(x, z, location)) return {x, z, moved: false};
    for (let r = .1; r <= max + 1e-9; r += .1) { const n = Math.max(8, Math.round(r * 24));
      for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (!blocked(px, pz, location)) return {x: px, z: pz, moved: true, distance: r}; } }
    return {x, z, moved: false, failed: true};
  }
  const pinned = (x, z, location) => [[.05, 0], [-.05, 0], [0, .05], [0, -.05]].every(([a, b]) => blocked(x + a, z + b, location));
  function watch(player, input, dt, location) {
    const pushing = !!(input && (input.x || input.z));
    if (!pushing || !location || player.height > 0) { player.stuckTime = 0; player.stuckFrom = null; return false; }
    if (!player.stuckFrom || Math.hypot(player.x - player.stuckFrom[0], player.z - player.stuckFrom[1]) > .05) { player.stuckFrom = [player.x, player.z]; player.stuckTime = 0; return false; }
    player.stuckTime = (player.stuckTime || 0) + Math.max(0, Math.min(.1, dt || 0));
    if (player.stuckTime < 2 || !pinned(player.x, player.z, location)) return false;
    player.stuckTime = 0; player.stuckFrom = null;
    const f = free(player.x, player.z, location, 6); if (!f.moved) return false;
    player.x = f.x; player.z = f.z; player.vx = player.vz = 0; return true;
  }

  const config={sensitivity:.0022,walk:3.9,sprint:6.4,crouch:1.65,acceleration:32,braking:44,gravity:18,jump:4.6};
  function step(player,input,dt,location){
    dt=Math.max(0,Math.min(.1,dt));const length=Math.max(1,Math.hypot(input.x,input.z));let speed=input.crouch?config.crouch:input.run?config.sprint:config.walk;
    try{const m=root.VoidDevStudios?.moveMul?.(typeof state!=='undefined'?state?.story?.flags?.shopEffect:null,Date.now()/1000);if(m>1)speed*=m;}catch{}
    const tx=(Math.cos(player.yaw)*input.x+Math.sin(player.yaw)*input.z)/length*speed,tz=(-Math.sin(player.yaw)*input.x+Math.cos(player.yaw)*input.z)/length*speed;
    const approach=(a,b,d)=>a+Math.sign(b-a)*Math.min(Math.abs(b-a),d),steps=Math.max(1,Math.ceil(dt/.008));
    if(player.jumpRequested){if(!(player.height>0)){player.vy=config.jump;player.height=.001;}player.jumpRequested=false;}
    for(let i=0;i<steps;i++){const t=dt/steps,acc=(length>1||input.x||input.z?config.acceleration:config.braking)*t;
      const ax=tx-(player.vx||0),az=tz-(player.vz||0),delta=Math.hypot(ax,az),gain=delta?Math.min(1,acc/delta):0;
      player.vx=(player.vx||0)+ax*gain;player.vz=(player.vz||0)+az*gain;
      // a blocked move is still taken when it leads out of a solid the player already overlaps (depth(): never further in)
      {const nx=player.x+player.vx*t;if(!blocked(nx,player.z,location)||(player.vx&&depth(nx,player.z,location)<depth(player.x,player.z,location)-1e-6))player.x=nx;else player.vx=0;}
      {const nz=player.z+player.vz*t;if(!blocked(player.x,nz,location)||(player.vz&&depth(player.x,nz,location)<depth(player.x,player.z,location)-1e-6))player.z=nz;else player.vz=0;}
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
    for (const item of location.interactions) { if (item.hidden) continue;   // a prompt switched off for now (a street door no mission of the player's uses: apartment-integration.js)
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
    depth, free, watch,
    radius
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidExplorer = api;
})(globalThis);
