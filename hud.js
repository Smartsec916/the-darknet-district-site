/*
------------------------------------------------------------------------------
THE DARKNET DISTRICT — IMMERSIVE HUD BEHAVIOR

Purpose: creates the decorative visor layer for pages that explicitly opt in.
The HUD never owns navigation, content, authentication, or Iris behavior.
------------------------------------------------------------------------------
*/

(function () {
  "use strict";

  const body = document.body;
  if (!body || body.dataset.hud !== "immersive") {
    return;
  }

  // ---------------------------------------------------------------------------
  // VISOR FRAME — spans the whole document so its lower edge reaches page end.
  // ---------------------------------------------------------------------------
  const layer = document.createElement("div");
  layer.className = "tdnd-hud-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <div class="tdnd-hud-viewport">
      <span class="tdnd-hud-bracket tdnd-hud-bracket--top-left"></span>
      <span class="tdnd-hud-bracket tdnd-hud-bracket--top-right"></span>
      <span class="tdnd-hud-bracket tdnd-hud-bracket--bottom-left"></span>
      <span class="tdnd-hud-bracket tdnd-hud-bracket--bottom-right"></span>
      <div class="tdnd-hud-coordinates tdnd-hud-coordinates--top">
        <span data-hud-lat>LAT 37.7749</span><span data-hud-lon>LON 122.4194</span><span>NODE 06</span>
      </div>
      <div class="tdnd-hud-coordinates tdnd-hud-coordinates--bottom">
        <span>SECTOR 01</span><span>SYNC 98%</span><span>SECURE</span>
      </div>
      <div class="tdnd-hud-top-status">Net: Stable&nbsp;&nbsp;|&nbsp;&nbsp;Node 06&nbsp;&nbsp;|&nbsp;&nbsp;Sync 98%</div>
      <div class="tdnd-hud-connector tdnd-hud-connector--left"></div>
      <div class="tdnd-hud-connector tdnd-hud-connector--right"></div>
      <div class="tdnd-hud-status">Iris // Resource Link Established</div>
    </div>
  `;
  body.prepend(layer);

  // ---------------------------------------------------------------------------
  // FLIGHT TAPES — LAT on the left, LON on the right, fixed to the screen.
  // Ticks are spaced in page pixels, so the tape is exactly as long as the page
  // and slides past a fixed caret while scrolling, like an altitude tape.
  // ---------------------------------------------------------------------------
  const TAPE = {
    minorEvery: 20,      // page px between minor ticks
    midEvery: 100,       // page px between longer ticks
    labelEvery: 200,     // page px between labelled ticks
    origin: { lat: 37.7749, lon: 122.4194 },
    perPixel: { lat: -0.0000025, lon: 0.0000016 }, // degrees per page px
    settle: 0.16         // how quickly the tape catches up with the scroll
  };

  const tapes = document.createElement("div");
  tapes.className = "tdnd-hud-tapes";
  tapes.setAttribute("aria-hidden", "true");
  tapes.innerHTML = `
    <div class="tdnd-hud-tape tdnd-hud-tape--left" data-axis="lat">
      <canvas></canvas><div class="tdnd-hud-caret"><b data-caret>37.7749</b><small>LAT N</small></div>
    </div>
    <div class="tdnd-hud-tape tdnd-hud-tape--right" data-axis="lon">
      <canvas></canvas><div class="tdnd-hud-caret"><b data-caret>122.4194</b><small>LON W</small></div>
    </div>
  `;
  body.prepend(tapes);

  const tapeViews = Array.from(tapes.querySelectorAll(".tdnd-hud-tape")).map((el) => ({
    axis: el.dataset.axis,
    side: el.classList.contains("tdnd-hud-tape--left") ? "left" : "right",
    el,
    canvas: el.querySelector("canvas"),
    caret: el.querySelector("[data-caret]"),
    ctx: null,
    width: 0,
    height: 0
  }));
  const visorLat = layer.querySelector("[data-hud-lat]");
  const visorLon = layer.querySelector("[data-hud-lon]");

  function valueAt(axis, pagePx) {
    return TAPE.origin[axis] + pagePx * TAPE.perPixel[axis];
  }

  function sizeTapes() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    tapeViews.forEach((view) => {
      const rect = view.el.getBoundingClientRect();
      view.width = rect.width;
      view.height = rect.height;
      view.canvas.width = Math.max(1, Math.round(rect.width * ratio));
      view.canvas.height = Math.max(1, Math.round(rect.height * ratio));
      view.ctx = view.canvas.getContext("2d");
      view.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
  }

  function drawTape(view, centerPagePx, docHeight) {
    const { ctx, width, height, side, axis } = view;
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const mid = height / 2;
    const compact = width < 40;
    const showLabels = width >= 60;
    const edge = side === "left" ? 0 : width;
    const dir = side === "left" ? 1 : -1;

    // Spine of the tape.
    ctx.fillStyle = "rgba(126, 255, 222, 0.16)";
    ctx.fillRect(side === "left" ? 0 : width - 1, 0, 1, height);

    const first = Math.ceil((centerPagePx - mid) / TAPE.minorEvery) * TAPE.minorEvery;
    const last = centerPagePx + mid;
    ctx.font = '9px "Courier New", monospace';
    ctx.textBaseline = "middle";
    ctx.textAlign = side === "left" ? "left" : "right";

    for (let p = first; p <= last; p += TAPE.minorEvery) {
      if (p < 0 || p > docHeight) continue; // the tape ends where the page ends
      const y = mid + (p - centerPagePx);
      const fade = Math.max(0, 1 - Math.abs(y - mid) / (mid * 1.05));
      const isLabel = p % TAPE.labelEvery === 0;
      const isMid = p % TAPE.midEvery === 0;
      const len = isLabel ? (compact ? 12 : 22) : isMid ? (compact ? 8 : 14) : (compact ? 4 : 7);

      ctx.fillStyle = `rgba(126, 255, 222, ${(isLabel ? 0.75 : isMid ? 0.5 : 0.3) * fade})`;
      ctx.fillRect(side === "left" ? edge : edge - len, Math.round(y), len, 1);

      if (isLabel && showLabels) {
        ctx.fillStyle = `rgba(150, 255, 226, ${0.6 * fade})`;
        ctx.fillText(valueAt(axis, p).toFixed(4), edge + dir * (len + 6), y);
      }
    }

    // Page start and end markers, so each tape visibly spans its own page.
    [0, docHeight].forEach((p) => {
      const y = mid + (p - centerPagePx);
      if (y < 0 || y > height) return;
      ctx.fillStyle = "rgba(255, 51, 102, 0.55)";
      ctx.fillRect(side === "left" ? edge : edge - (compact ? 14 : 34), Math.round(y), compact ? 14 : 34, 1);
    });

    // Thin position strip on the spine: where this screen sits within the page.
    if (docHeight > 0) {
      const top = (Math.max(0, centerPagePx - window.innerHeight / 2) / docHeight) * height;
      const span = Math.max(12, (window.innerHeight / docHeight) * height);
      ctx.fillStyle = "rgba(0, 255, 157, 0.55)";
      ctx.fillRect(side === "left" ? 0 : width - 2, top, 2, Math.min(span, height - top));
    }
  }

  // ---------------------------------------------------------------------------
  // DOCUMENT HEIGHT — keeps the visor frame and tape length matched to the page.
  // ---------------------------------------------------------------------------
  let docHeight = 0;
  let measureFrame = null;

  function measureDocumentHeight() {
    const documentElement = document.documentElement;
    return Math.max(
      documentElement.scrollHeight,
      documentElement.offsetHeight,
      body.scrollHeight,
      body.offsetHeight,
      window.innerHeight
    );
  }

  function remeasure() {
    measureFrame = null;
    const height = measureDocumentHeight();
    if (height !== docHeight) {
      docHeight = height;
      document.documentElement.style.setProperty("--tdnd-hud-document-height", `${height}px`);
      layer.style.height = `${height}px`;
    }
    requestDraw();
  }

  function requestRemeasure() {
    if (measureFrame === null) {
      measureFrame = window.requestAnimationFrame(remeasure);
    }
  }

  window.addEventListener("load", requestRemeasure);
  window.addEventListener("resize", () => { sizeTapes(); requestRemeasure(); }, { passive: true });

  if (typeof ResizeObserver === "function") {
    const resizeObserver = new ResizeObserver(requestRemeasure);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(body);
  }

  Array.from(document.images).forEach((image) => {
    if (!image.complete) {
      image.addEventListener("load", requestRemeasure, { once: true });
      image.addEventListener("error", requestRemeasure, { once: true });
    }
  });

  // ---------------------------------------------------------------------------
  // MOTION — tape glide, pointer point-of-view, and head-mounted sway.
  // ---------------------------------------------------------------------------
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionQuery.matches;
  let smoothScroll = window.scrollY;
  let lastScroll = window.scrollY;
  let velocity = 0;
  let povX = 0;
  let povY = 0;
  let targetPovX = 0;
  let targetPovY = 0;
  let loopFrame = null;
  let drawFrame = null;

  function getHudSetting(name, fallback) {
    const value = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(name)
    );
    return Number.isFinite(value) ? value : fallback;
  }

  let swayStrength = 1;
  let povStrength = 8;
  let povSettle = 0.1;
  let scrollParallax = 0.012;
  function readSettings() {
    swayStrength = getHudSetting("--tdnd-hud-sway-strength", 1);
    povStrength = getHudSetting("--tdnd-hud-pov-parallax-strength", 8);
    povSettle = getHudSetting("--tdnd-hud-pov-settle", 0.1);
    scrollParallax = getHudSetting("--tdnd-hud-scroll-parallax-strength", 0.012);
  }

  function render() {
    const center = smoothScroll + window.innerHeight / 2;
    tapeViews.forEach((view) => drawTape(view, center, docHeight));

    const lat = valueAt("lat", center).toFixed(4);
    const lon = valueAt("lon", center).toFixed(4);
    tapeViews[0].caret.textContent = lat;
    tapeViews[1].caret.textContent = lon;
    if (visorLat) visorLat.textContent = `LAT ${lat}`;
    if (visorLon) visorLon.textContent = `LON ${lon}`;

    body.style.setProperty("--tdnd-hud-scroll-offset", `${Math.min(8, window.scrollY * scrollParallax)}px`);
  }

  // Sum of slow, unrelated sine waves: never repeats visibly, never jerks.
  function sway(t) {
    const s = swayStrength;
    return {
      x: s * (1.1 * Math.sin(t * 0.43) + 0.6 * Math.sin(t * 1.21 + 1.3) + 0.25 * Math.sin(t * 2.9 + 0.4)),
      y: s * (0.9 * Math.sin(t * 0.57 + 2.1) + 0.5 * Math.sin(t * 1.63 + 0.7) + 0.2 * Math.sin(t * 3.7)),
      r: s * (0.08 * Math.sin(t * 0.31 + 0.9) + 0.03 * Math.sin(t * 1.1))
    };
  }

  function loop(now) {
    loopFrame = null;
    const scroll = window.scrollY;
    velocity += ((scroll - lastScroll) - velocity) * 0.2;
    lastScroll = scroll;

    smoothScroll += (scroll - smoothScroll) * TAPE.settle;
    if (Math.abs(scroll - smoothScroll) < 0.1) smoothScroll = scroll;

    povX += (targetPovX - povX) * povSettle;
    povY += (targetPovY - povY) * povSettle;

    const t = now / 1000;
    const s = sway(t);
    // A quick scroll makes the view lag a touch, the way a head trails a turn.
    const lag = Math.max(-3, Math.min(3, -velocity * 0.06));

    tapes.style.setProperty("--tdnd-hud-sway-x", `${(s.x + povX * 0.3).toFixed(2)}px`);
    tapes.style.setProperty("--tdnd-hud-sway-y", `${(s.y + povY * 0.3 + lag).toFixed(2)}px`);
    tapes.style.setProperty("--tdnd-hud-sway-r", `${s.r.toFixed(3)}deg`);
    body.style.setProperty("--tdnd-hud-pov-x", `${povX.toFixed(2)}px`);
    body.style.setProperty("--tdnd-hud-pov-y", `${povY.toFixed(2)}px`);

    render();
    if (!reduceMotion && !document.hidden) {
      loopFrame = window.requestAnimationFrame(loop);
    }
  }

  function requestDraw() {
    if (!reduceMotion) {
      if (loopFrame === null && !document.hidden) loopFrame = window.requestAnimationFrame(loop);
      return;
    }
    if (drawFrame === null) {
      drawFrame = window.requestAnimationFrame(() => {
        drawFrame = null;
        smoothScroll = window.scrollY;
        render();
      });
    }
  }

  function updatePovTarget(event) {
    const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
    const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
    targetPovX = normalizedX * povStrength;
    targetPovY = normalizedY * povStrength;
  }

  function resetPovTarget() {
    targetPovX = 0;
    targetPovY = 0;
  }

  function applyMotionPreference() {
    reduceMotion = motionQuery.matches;
    readSettings();
    window.removeEventListener("pointermove", updatePovTarget);
    window.removeEventListener("blur", resetPovTarget);
    if (loopFrame !== null) {
      window.cancelAnimationFrame(loopFrame);
      loopFrame = null;
    }

    if (reduceMotion) {
      ["--tdnd-hud-scroll-offset", "--tdnd-hud-pov-x", "--tdnd-hud-pov-y"].forEach((name) => body.style.removeProperty(name));
      ["--tdnd-hud-sway-x", "--tdnd-hud-sway-y", "--tdnd-hud-sway-r"].forEach((name) => tapes.style.removeProperty(name));
    } else {
      window.addEventListener("pointermove", updatePovTarget, { passive: true });
      window.addEventListener("blur", resetPovTarget);
    }
    requestDraw();
  }

  window.addEventListener("scroll", requestDraw, { passive: true });
  document.addEventListener("visibilitychange", requestDraw);
  motionQuery.addEventListener("change", applyMotionPreference);

  sizeTapes();
  docHeight = 0;
  remeasure();
  applyMotionPreference();
}());
