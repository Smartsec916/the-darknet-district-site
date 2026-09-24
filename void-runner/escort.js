/* Escort state uses the same player-relative frame as the flight simulation. */
(function(root) {
  function create(def = {}) {
    return {
      id: def.id || 'shuttle',
      relationship: 'friendly',
      x: 0,
      y: 5,
      z: 38,
      health: def.health || 100,
      maxHealth: def.health || 100,
      speed: def.speed || 12,
      range: def.range || 110,
      heading: def.heading ? {
        ...def.heading
      } : null,
      progress: 0,
      status: 'rendezvous',
      distress: false,
      dead: false
    };
  }

  function step(ship, dt, velocity, forward, hostiles, routeLength = 200) {
    if (ship.dead || ship.status === 'complete') return;
    const distance = Math.hypot(ship.x, ship.y, ship.z),
      near = distance <= ship.range;
    ship.status = !near ? 'waiting' : hostiles ? 'defending' : 'transit';
    ship.distress = hostiles || ship.health < ship.maxHealth * .3;
    const speed = near ? ship.speed : 0,
      heading = ship.heading || forward;
    for (const axis of ['x', 'y', 'z']) ship[axis] += (heading[axis] * speed - velocity[axis]) * dt;
    if (near && !hostiles) ship.progress = Math.min(1, ship.progress + speed * dt / routeLength);
  }

  function damage(ship, amount) {
    ship.health = Math.max(0, ship.health - Math.max(0, amount));
    ship.dead = ship.health === 0;
    if (ship.dead) ship.status = 'lost';
    ship.distress = true;
  }
  const api = {
    create,
    step,
    damage
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidEscort = api;
})(globalThis);
