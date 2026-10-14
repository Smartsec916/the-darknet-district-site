/*
==============================================================================
THE DARKNET DISTRICT — VOID RUNNER MENU BACKDROP

Renders the Void Runner main-menu scene (Meridian station and planet) behind
an element marked with data-void-backdrop, using the game's own modules from
void-runner/. Any change to the game's menu graphics shows up here too.

Purely decorative: it waits until the page has finished loading, skips
visitors who asked to save data or have no WebGL, and removes itself quietly
if anything fails.
==============================================================================
*/

(function () {
  "use strict";

  const host = document.querySelector("[data-void-backdrop]");
  if (!host) return;

  const connection = navigator.connection;
  if (connection && connection.saveData) return;

  // The same modules, in the same order, that void-runner.html loads them.
  const MODULES = [
    "void-runner/preparation.js",
    "void-runner/asset-pipeline.js",
    "void-runner/meridian-art.js",
    "void-runner/meridian-station.js",
    "void-runner/babylon-renderer.js"
  ];
  const FRAME_INTERVAL = 1000 / 30; // a faded backdrop does not need 60fps
  // The menu is framed for a widescreen window, with the station, planet and
  // asteroids in its right half. Render it at that shape and crop to that subject.
  // If the game's menu composition changes, adjust SUBJECT to match.
  const MENU_ASPECT = 1.6;
  // Station, planet and the nearby asteroids, as fractions of the frame.
  const SUBJECT = { x: 0.75, y: 0.45, width: 0.56, height: 0.6 };
  const FILL = 0.9;            // how much of the panel the subject fills
  const MAX_RENDER_WIDTH = 1200;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function hasWebGL() {
    try {
      const probe = document.createElement("canvas");
      const context = probe.getContext("webgl2") || probe.getContext("webgl");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      return Boolean(context);
    } catch (error) {
      return false;
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = src;
      tag.async = false;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(tag);
    });
  }

  // The game's loading screen is not on this page; its status calls become no-ops.
  function ensureLoadingStub() {
    if (window.VoidLoading) return;
    window.VoidLoading = {
      graphicsLost: false,
      stage() {},
      ready() {},
      error() {},
      graphicsState(state) { this.graphicsLost = state === "lost"; }
    };
  }

  async function start() {
    if (!hasWebGL()) return;
    ensureLoadingStub();
    for (const src of MODULES) {
      await loadScript(src);
    }
    if (!window.VoidBabylon || typeof window.VoidBabylon.prepareMenu !== "function") {
      throw new Error("Void Runner menu renderer is not available.");
    }
    await window.VoidBabylon.prepareMenu();

    const canvas = document.createElement("canvas");
    canvas.className = "tdd-vr-backdrop";
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);
    const context = canvas.getContext("2d");

    let visible = true;
    let frame = null;
    let lastDraw = 0;
    const started = performance.now();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) schedule();
      }).observe(host);
    }

    function draw(now) {
      frame = null;
      if (!visible || document.hidden) return;
      if (now - lastDraw >= FRAME_INTERVAL || reduceMotion.matches) {
        lastDraw = now;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(2, Math.round(rect.width));
        const height = Math.max(2, Math.round(rect.height));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const seconds = (now - started) / 1000;
        // Width the full frame would need for the subject to fill the panel.
        const frameWidth = Math.min(
          (FILL * width) / SUBJECT.width,
          (FILL * height * MENU_ASPECT) / SUBJECT.height
        );
        const renderWidth = Math.round(Math.min(MAX_RENDER_WIDTH, frameWidth));
        const renderHeight = Math.round(renderWidth / MENU_ASPECT);
        const image = window.VoidBabylon.renderMenu(renderWidth, renderHeight, seconds, reduceMotion.matches);
        if (image) {
          const ratio = renderWidth / frameWidth; // render pixels per panel pixel
          const sourceWidth = width * ratio;
          const sourceHeight = height * ratio;
          const sx = SUBJECT.x * renderWidth - sourceWidth / 2;
          const sy = SUBJECT.y * renderHeight - sourceHeight / 2;
          context.clearRect(0, 0, width, height);
          context.drawImage(image, sx, sy, sourceWidth, sourceHeight, 0, 0, width, height);
          canvas.classList.add("is-ready");
        }
      }
      if (!reduceMotion.matches) schedule();
    }

    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(draw);
    }

    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("resize", schedule, { passive: true });
    reduceMotion.addEventListener?.("change", schedule);
    schedule();
  }

  function begin() {
    start().catch((error) => {
      console.info("[District] Void Runner backdrop skipped:", error.message);
      host.querySelector(".tdd-vr-backdrop")?.remove();
    });
  }

  // Wait for the page itself to finish, then for an idle moment, before
  // pulling in the 3D engine.
  function whenIdle() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(begin, { timeout: 2500 });
    } else {
      window.setTimeout(begin, 600);
    }
  }

  if (document.readyState === "complete") {
    whenIdle();
  } else {
    window.addEventListener("load", whenIdle, { once: true });
  }
}());
