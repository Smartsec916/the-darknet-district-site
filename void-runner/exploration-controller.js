/* Collision and interaction selection are engine-independent and deterministic. */
(function(root) {
  const radius = .38;

  function blocked(x, z, location) {
    if (Math.abs(x) > location.bounds[0] - radius || Math.abs(z) > location.bounds[1] - radius) return true;
    return location.solids.some(s => Math.abs(x - s.position[0]) < s.size[0] / 2 + radius && Math.abs(z - s.position[2]) < s.size[2] / 2 + radius);
  }

  function step(player, input, dt, location) {
    dt = Math.max(0, Math.min(.1, dt));
    const length = Math.max(1, Math.hypot(input.x, input.z)),
      speed = input.run ? 5 : 2.8;
    const dx = (Math.cos(player.yaw) * input.x + Math.sin(player.yaw) * input.z) / length * speed * dt;
    const dz = (-Math.sin(player.yaw) * input.x + Math.cos(player.yaw) * input.z) / length * speed * dt;
    // Subdivide so sprinting cannot tunnel through narrow colliders.
    const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .15));
    for (let i = 0; i < count; i++) {
      if (!blocked(player.x + dx / count, player.z, location)) player.x += dx / count;
      if (!blocked(player.x, player.z + dz / count, location)) player.z += dz / count;
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
    step,
    select,
    blocked,
    radius
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidExplorer = api;
})(globalThis);
