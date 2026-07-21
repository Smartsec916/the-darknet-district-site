/*
==============================================================================
THE DARKNET DISTRICT — IMMERSIVE HUD BEHAVIOR

Purpose: creates the decorative visor layer for pages that explicitly opt in.
The HUD never owns navigation, content, authentication, or Iris behavior.
==============================================================================
*/

(function () {
  "use strict";

  const body = document.body;
  if (!body || body.dataset.hud !== "immersive") {
    return;
  }

  const host = document.querySelector(".resources-bg");
  if (!host) {
    return;
  }

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

  host.prepend(layer);

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frameId = null;

  // Scroll only shifts the decorative coordinate layer by a few pixels.
  function updateParallax() {
    frameId = null;
    const strength = Number.parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--tdnd-hud-scroll-parallax-strength")
    ) || 0;
    const offset = Math.min(8, window.scrollY * strength);
    body.style.setProperty("--tdnd-hud-scroll-offset", `${offset}px`);
  }

  function requestParallaxUpdate() {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(updateParallax);
    }
  }

  function updateMotionPreference() {
    window.removeEventListener("scroll", requestParallaxUpdate);

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    if (!motionQuery.matches) {
      window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
      requestParallaxUpdate();
    } else {
      body.style.removeProperty("--tdnd-hud-scroll-offset");
    }
  }

  motionQuery.addEventListener("change", updateMotionPreference);
  updateMotionPreference();
}());
