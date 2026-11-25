/* Opt-in view of the game for a tab selected in Cinematic Studio. */
(function () {
  const url = new URL(location.href);
  if (url.searchParams.get('cinemaView') !== 'clean') return;

  const style = document.createElement('style');
  style.textContent = `
    html.cinema-world :is(#flight-hud,#systems-hud,#fps-ammo-hud,#walking-caption,
      #mission-hint,#tutorial-prompt,#guidance-card,#combat-debug,#mp-chip,#credits,#notice) {
      visibility: hidden !important;
    }
    @media (pointer:fine) { html.cinema-world #walking-interact { visibility: hidden; } }
  `;
  document.head.append(style);

  // The original draw still updates the world and interactive panels. Present its
  // rendered 3D frame before the painted crosshair, mission arrows and debug HUD.
  const original = draw;
  draw = function () {
    original.apply(this, arguments);
    const inWorld = (mode === 'walking' || mode === 'play' || mode === 'skirmish-fps') &&
      !globalThis.VoidCameraFeed?.active;
    const surface = inWorld && globalThis.VoidBabylon?.scene?.getEngine().getRenderingCanvas();
    document.documentElement.classList.toggle('cinema-world', Boolean(surface));
    if (surface) ctx.drawImage(surface, 0, 0, W, H);
  };
})();
