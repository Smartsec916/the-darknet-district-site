/* Presentation clock: no campaign destinations or rewards live here. */
(function(root) {
  function create(delay = 2) {
    return {
      delay,
      elapsed: 0,
      key: null
    };
  }

  function reset(clock, key) {
    clock.key = key;
    clock.elapsed = 0;
  }

  function step(clock, dt, key, active = true) {
    if (clock.key !== key) reset(clock, key);
    if (active && Number.isFinite(dt)) clock.elapsed += Math.max(0, dt);
    return opacity(clock);
  }

  function opacity(clock) {
    return Math.max(0, Math.min(1, (clock.elapsed - clock.delay) / .4));
  }
  const api = {
    create,
    reset,
    step,
    opacity
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidNavigationReveal = api;
})(globalThis);
