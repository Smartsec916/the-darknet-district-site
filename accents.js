/*
==============================================================================
THE DARKNET DISTRICT — HOMEPAGE TECH ACCENTS

Builds the decorative elements styled in accents.css. Everything here is
cosmetic: navigation, sign-in and the Iris chat keep working without it.
==============================================================================
*/

(function () {
  "use strict";

  const body = document.body;
  const hero = document.querySelector(".first-section");
  if (!body || !body.classList.contains("site-home") || !hero) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, className, html) {
    const node = document.createElement(tag);
    node.className = className;
    if (html) node.innerHTML = html;
    node.setAttribute("aria-hidden", "true");
    return node;
  }

  // ---------------------------------------------------------------------------
  // HERO LAYERS
  // ---------------------------------------------------------------------------
  const content = hero.firstElementChild;
  if (content) content.classList.add("tdd-hero-content");

  const tearA = el("div", "tdd-tear tdd-tear--a");
  const tearB = el("div", "tdd-tear tdd-tear--b");
  const grid = el("div", "tdd-grid");
  const ruler = el("div", "tdd-ruler", '<span class="tdd-ruler-mark"></span>');
  const readTL = el("div", "tdd-readout tdd-readout--tl", '<span class="tdd-pulse"></span>Node <b>online</b><span class="tdd-wide"> &nbsp;·&nbsp; sector 03</span>');
  const readTR = el("div", "tdd-readout tdd-readout--tr", 'x <b data-tdd-x>0.500</b> &nbsp; y <b data-tdd-y>0.460</b>');
  const readBL = el("div", "tdd-readout tdd-readout--bl", '<span data-tdd-clock>00:00:00</span> &nbsp;·&nbsp; uplink <b data-tdd-latency>42</b>ms &nbsp;·&nbsp; enc AES-256');
  const crosses = [1, 2, 3, 4].map((n) => el("span", `tdd-cross tdd-cross--${n}`));
  hero.prepend(tearA, tearB, grid, ruler, readTL, readTR, readBL, ...crosses);

  const outX = readTR.querySelector("[data-tdd-x]");
  const outY = readTR.querySelector("[data-tdd-y]");
  const rulerMark = ruler.querySelector(".tdd-ruler-mark");

  let pointerFrame = null;
  let lastPointer = null;
  function applyPointer() {
    pointerFrame = null;
    if (!lastPointer) return;
    const rect = hero.getBoundingClientRect();
    const x = lastPointer.clientX - rect.left;
    const y = lastPointer.clientY - rect.top;
    hero.style.setProperty("--tdd-mx", `${x}px`);
    hero.style.setProperty("--tdd-my", `${y}px`);
    rulerMark.style.setProperty("--tdd-px", `${x}px`);
    outX.textContent = Math.min(1, Math.max(0, x / rect.width)).toFixed(3);
    outY.textContent = Math.min(1, Math.max(0, y / rect.height)).toFixed(3);
  }
  hero.addEventListener("pointermove", (event) => {
    lastPointer = event;
    if (pointerFrame === null) pointerFrame = window.requestAnimationFrame(applyPointer);
  }, { passive: true });

  const clock = readBL.querySelector("[data-tdd-clock]");
  const latency = readBL.querySelector("[data-tdd-latency]");
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const now = new Date();
    clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    latency.textContent = String(38 + Math.round(Math.random() * 9));
  }
  tick();
  window.setInterval(tick, 1000);

  // ---------------------------------------------------------------------------
  // NAVIGATION — mark the current page
  // ---------------------------------------------------------------------------
  document.querySelectorAll(".top-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === "/" || href === "index.html" || href === "./") {
      link.setAttribute("aria-current", "page");
    }
  });

  // ---------------------------------------------------------------------------
  // TITLE — light seams and the ghost copies used for the slice glitch
  // ---------------------------------------------------------------------------
  const title = hero.querySelector(".cyberpunk-title");
  let ghosts = [];
  if (title) {
    const text = title.dataset.text || title.textContent.trim();
    title.append(
      el("span", "tdd-edge tdd-edge--top"),
      el("span", "tdd-edge tdd-edge--bottom")
    );
    ghosts = [el("span", "tdd-ghost tdd-ghost--r"), el("span", "tdd-ghost tdd-ghost--c")];
    ghosts.forEach((ghost) => {
      ghost.textContent = text;
      title.append(ghost);
    });
  }

  // ---------------------------------------------------------------------------
  // IRIS — glass capsule with avatar and scanning ring
  // ---------------------------------------------------------------------------
  const irisButton = document.getElementById("chatButton");
  if (irisButton) {
    const label = irisButton.textContent.trim() || "Chat with Iris";
    irisButton.classList.add("tdd-iris");
    irisButton.innerHTML = `
      <span class="tdd-iris-avatar" aria-hidden="true">
        <img src="attached_assets/Iris%2001.webp" alt="">
        <svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="16.5"></circle></svg>
      </span>
      <span class="tdd-iris-text"><span></span><small>Online</small></span>`;
    irisButton.querySelector(".tdd-iris-text > span").textContent = label;
  }

  if (reduceMotion) {
    return;
  }

  // ---------------------------------------------------------------------------
  // SIGNAL TEAR — a thin band of the skyline slips sideways, rarely
  // ---------------------------------------------------------------------------
  function showBand(layerEl, top, height, shift) {
    layerEl.style.clipPath = `inset(${top}% 0 ${Math.max(0, 100 - top - height)}% 0)`;
    layerEl.style.transform = `translateX(${shift}px)`;
    layerEl.classList.add("is-on");
  }

  function tear() {
    if (!document.hidden) {
      const top = 12 + Math.random() * 70;
      const height = 0.6 + Math.random() * 2.6;
      const shift = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 16);
      showBand(tearA, top, height, shift);
      showBand(tearB, top + height * 0.3, height * 0.5, -shift * 0.6);
      window.setTimeout(() => {
        tearA.classList.remove("is-on");
        tearB.classList.remove("is-on");
      }, 70 + Math.random() * 60);
      if (Math.random() < 0.4) {
        window.setTimeout(() => {
          showBand(tearA, top + 1.5, height * 0.7, shift * -0.5);
          window.setTimeout(() => tearA.classList.remove("is-on"), 55);
        }, 160);
      }
    }
    window.setTimeout(tear, 6000 + Math.random() * 5000);
  }
  window.setTimeout(tear, 2200);

  // ---------------------------------------------------------------------------
  // TITLE SLICE — two colored slivers of the title shift for one frame
  // ---------------------------------------------------------------------------
  function slice() {
    if (title && ghosts.length && !document.hidden) {
      const height = 8 + Math.random() * 22;
      const topA = Math.random() * 70;
      const topB = Math.random() * 70;
      ghosts[0].style.clipPath = `inset(${topA}% 0 ${Math.max(0, 100 - topA - height)}% 0)`;
      ghosts[0].style.transform = `translateX(-${2 + Math.random() * 4}px)`;
      ghosts[1].style.clipPath = `inset(${topB}% 0 ${Math.max(0, 100 - topB - height * 0.6)}% 0)`;
      ghosts[1].style.transform = `translateX(${2 + Math.random() * 4}px)`;
      title.classList.add("is-slicing");
      window.setTimeout(() => title.classList.remove("is-slicing"), 90);
    }
    window.setTimeout(slice, 4500 + Math.random() * 5000);
  }
  window.setTimeout(slice, 3500);

  // ---------------------------------------------------------------------------
  // ENTER BUTTON — label decodes when hovered or focused
  // ---------------------------------------------------------------------------
  const enter = hero.querySelector(".enter-district-btn");
  if (enter) {
    const original = enter.textContent.trim();
    const labelSpan = document.createElement("span");
    labelSpan.textContent = original;
    enter.textContent = "";
    enter.append(labelSpan);
    enter.setAttribute("aria-label", original);

    const glyphs = "ABCDEFGHJKLMNPRSTUVXYZ0123456789";
    let decoding = false;
    function decode() {
      if (decoding) return;
      decoding = true;
      enter.style.minWidth = `${enter.offsetWidth}px`;
      const start = performance.now();
      const duration = 420;
      (function frame(now) {
        const progress = Math.min(1, (now - start) / duration);
        let out = "";
        for (let i = 0; i < original.length; i += 1) {
          const ch = original[i];
          out += ch === " " || i / original.length < progress ? ch : glyphs[(Math.random() * glyphs.length) | 0];
        }
        labelSpan.textContent = out;
        if (progress < 1) {
          window.requestAnimationFrame(frame);
        } else {
          labelSpan.textContent = original;
          decoding = false;
        }
      })(start);
    }
    enter.addEventListener("mouseenter", decode);
    enter.addEventListener("focus", decode);
  }
}());
