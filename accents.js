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
  hero.prepend(tearA, tearB, grid);

  // The grid is lit around the cursor.
  let pointerFrame = null;
  let lastPointer = null;
  function applyPointer() {
    pointerFrame = null;
    if (!lastPointer) return;
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty("--tdd-mx", `${lastPointer.clientX - rect.left}px`);
    hero.style.setProperty("--tdd-my", `${lastPointer.clientY - rect.top}px`);
  }
  hero.addEventListener("pointermove", (event) => {
    lastPointer = event;
    if (pointerFrame === null) pointerFrame = window.requestAnimationFrame(applyPointer);
  }, { passive: true });

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
}());
