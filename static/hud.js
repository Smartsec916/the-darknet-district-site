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

  const host = body;

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
        <span>LAT 37.7749</span><span>LON 122.4194</span><span>NODE 06</span>
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

  // The visor frame follows the full document so its lower edge reaches the page end.
  body.prepend(layer);

  // Stations are generated from the measured document height rather than a
  // fixed count, so long pages get enough stations to reach the true bottom.
  const HUD_SCALE_STATION_SPACING = 130; // approximate px between stations
  const HUD_SCALE_MIN_STATIONS = 8;

  const pageScale = document.createElement("div");
  pageScale.className = "tdnd-hud-page-scale";
  pageScale.setAttribute("aria-hidden", "true");
  host.prepend(pageScale);

  let scaleReadouts = [];
  let lastScaleHeight = 0;
  let lastStationCount = 0;
  let scaleRebuildFrame = null;

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

  function buildScaleStations(count) {
    return Array.from({ length: count }, (_, index) =>
      `<span class="tdnd-hud-scale-station" data-hud-scale-index="${index}">${String((index * 60) % 1000).padStart(3, "0")}</span>`
    ).join("");
  }

  function rebuildPageScale() {
    const docHeight = measureDocumentHeight();
    const stationCount = Math.max(
      HUD_SCALE_MIN_STATIONS,
      Math.round(docHeight / HUD_SCALE_STATION_SPACING)
    );

    if (docHeight === lastScaleHeight && stationCount === lastStationCount) {
      return;
    }

    lastScaleHeight = docHeight;
    lastStationCount = stationCount;

    // Both overlays share the full measured height and remain out of flow.
    document.documentElement.style.setProperty("--tdnd-hud-document-height", `${docHeight}px`);
    pageScale.style.height = `${docHeight}px`;
    layer.style.height = `${docHeight}px`;
    pageScale.style.setProperty("--tdnd-hud-scale-count", String(stationCount));

    const stations = buildScaleStations(stationCount);
    pageScale.innerHTML = `
      <div class="tdnd-hud-page-scale-rail tdnd-hud-page-scale-rail--left">${stations}</div>
      <div class="tdnd-hud-page-scale-rail tdnd-hud-page-scale-rail--right">${stations}</div>
    `;
    scaleReadouts = pageScale.querySelectorAll("[data-hud-scale-index]");
    requestParallaxUpdate();
  }

  function requestScaleRebuild() {
    if (scaleRebuildFrame === null) {
      scaleRebuildFrame = window.requestAnimationFrame(() => {
        scaleRebuildFrame = null;
        rebuildPageScale();
      });
    }
  }

  // Keep the scale and full HUD frame current as content changes dimensions.
  window.addEventListener("load", requestScaleRebuild);
  window.addEventListener("resize", requestScaleRebuild, { passive: true });

  if (typeof ResizeObserver === "function") {
    const scaleResizeObserver = new ResizeObserver(requestScaleRebuild);
    scaleResizeObserver.observe(document.documentElement);
    scaleResizeObserver.observe(body);
  }

  if (typeof MutationObserver === "function") {
    const documentMutationObserver = new MutationObserver(requestScaleRebuild);
    documentMutationObserver.observe(body, { childList: true, subtree: true });
  }

  // Fallback for late-loading images shifting the document height.
  Array.from(document.images).forEach((image) => {
    if (!image.complete) {
      image.addEventListener("load", requestScaleRebuild, { once: true });
      image.addEventListener("error", requestScaleRebuild, { once: true });
    }
  });

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frameId = null;
  let povFrameId = null;
  let povX = 0;
  let povY = 0;
  let targetPovX = 0;
  let targetPovY = 0;

  function getHudSetting(name, fallback) {
    const value = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(name)
    );
    return Number.isFinite(value) ? value : fallback;
  }

  // Scroll adjusts the coordinate readouts; pointer input moves the HUD layer itself.
  function updateParallax() {
    frameId = null;
    const strength = getHudSetting("--tdnd-hud-scroll-parallax-strength", 0);
    const offset = Math.min(8, window.scrollY * strength);
    body.style.setProperty("--tdnd-hud-scroll-offset", `${offset}px`);

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = window.scrollY / maxScroll;
    const readoutBase = Math.round(progress * 360);
    pageScale.style.setProperty("--tdnd-hud-page-scroll-offset", `${Math.min(16, window.scrollY * 0.01)}px`);

    scaleReadouts.forEach((readout) => {
      const station = Number(readout.dataset.hudScaleIndex);
      readout.textContent = String((readoutBase + station * 60) % 1000).padStart(3, "0");
    });
  }

  function requestParallaxUpdate() {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(updateParallax);
    }
  }

  // Smoothly settles the decorative frame toward the viewer's pointer position.
  function updatePovParallax() {
    povFrameId = null;
    const settle = getHudSetting("--tdnd-hud-pov-settle", 0.1);
    povX += (targetPovX - povX) * settle;
    povY += (targetPovY - povY) * settle;

    body.style.setProperty("--tdnd-hud-pov-x", `${povX.toFixed(2)}px`);
    body.style.setProperty("--tdnd-hud-pov-y", `${povY.toFixed(2)}px`);

    if (Math.abs(targetPovX - povX) > 0.05 || Math.abs(targetPovY - povY) > 0.05) {
      povFrameId = window.requestAnimationFrame(updatePovParallax);
    }
  }

  function requestPovUpdate() {
    if (povFrameId === null) {
      povFrameId = window.requestAnimationFrame(updatePovParallax);
    }
  }

  function updatePovTarget(event) {
    const strength = getHudSetting("--tdnd-hud-pov-parallax-strength", 8);
    const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
    const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
    targetPovX = normalizedX * strength;
    targetPovY = normalizedY * strength;
    requestPovUpdate();
  }

  function resetPovTarget() {
    targetPovX = 0;
    targetPovY = 0;
    requestPovUpdate();
  }

  function updateMotionPreference() {
    window.removeEventListener("scroll", requestParallaxUpdate);
    window.removeEventListener("pointermove", updatePovTarget);
    window.removeEventListener("blur", resetPovTarget);

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    if (povFrameId !== null) {
      window.cancelAnimationFrame(povFrameId);
      povFrameId = null;
    }

    if (!motionQuery.matches) {
      window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
      window.addEventListener("pointermove", updatePovTarget, { passive: true });
      window.addEventListener("blur", resetPovTarget);
      requestParallaxUpdate();
      resetPovTarget();
    } else {
      body.style.removeProperty("--tdnd-hud-scroll-offset");
      body.style.removeProperty("--tdnd-hud-pov-x");
      body.style.removeProperty("--tdnd-hud-pov-y");
      pageScale.style.removeProperty("--tdnd-hud-page-scroll-offset");
    }
  }

  motionQuery.addEventListener("change", updateMotionPreference);
  rebuildPageScale();
  updateMotionPreference();
}());
