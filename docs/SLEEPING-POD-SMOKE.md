# Sleeping Pod smoke on phones: what was found, what changed, how to check it on your phone

## What was investigated, and the evidence

| Question | Finding | Evidence |
|---|---|---|
| Was the previous fix deployed? | **Yes.** The live site serves the same `sleeping-pod-smoke.js` as `main` (the version from `bb8d819`, with `?smokedebug`). | `curl https://thedarknetdistrict.com/sleeping-pod-smoke.js` is byte-identical to `main`'s; it contains `smokedebug` and no `cuts` counter. |
| Does connection speed matter? | **No.** Nothing in the smoke path reads the connection, saves-data, device memory, CPU count or browser name, and the script loads nothing: the plume is drawn from code. | `grep` of the script and the page; `tests/sleeping-pod-smoke.test.cjs` now enforces it. |
| Is the effect too heavy for a phone GPU? | **Unlikely.** About 64 hash evaluations per pixel at roughly 55,000 pixels (the canvas is 165 x 336 on a phone-sized screen, then scaled up): well within a phone GPU. Frame-rate monitoring no longer switches the effect off (since `bb8d819`); quality only drops to a floor. | It draws at the display's full rate on this computer (120 fps) and at 30 fps with the new phone cap. A real phone GPU was not available to measure. |
| Do WebGL and the canvas work in a phone-sized, touch, mobile-user-agent browser? | **Yes**, in Playwright's Pixel 7 emulation: the plume draws visible pixels (read back and screenshotted), above the page, below the nav, never intercepting taps. | `tests/sleeping-pod-smoke-browser.cjs`, screenshots in `work/smoke/`. This is an emulation on this computer's GPU, not a phone. |
| What makes it appear nowhere at all on a phone? | **The reduced-motion setting.** `sleeping_pod.html` hid the canvas with `display: none !important` and the script returned early whenever `prefers-reduced-motion: reduce` was on. On Android, **Remove animations** (Settings > Accessibility; also turned on by some battery-saver modes on Samsung and other phones) is reported to Chrome as reduced motion. With it on, no GPU, no connection and no code path could make the smoke appear. | The two lines above in the old source. **I could not read your phone's settings, so this is the most probable cause, not a confirmed one**: see "Check it on your phone". |
| Other real faults found by reading the code | (1) A page restored from the back/forward cache (Android Chrome does this on the Back button) never restarted the smoke until reloaded. (2) If WebGL failed in any way the effect was switched off for the whole visit. (3) A WebGL context that "works" but draws nothing (a driver fault) was invisible to the script. | Each is reproduced by a test that fails on the old code's logic. |

## What changed (desktop WebGL plume untouched: the shader is byte-for-byte the same, and a test checks it)

- **Canvas 2D version** of the same plume (about 26 soft overlapping puffs rising, widening and fading like the shader's, drawn at the same low resolution) used when WebGL is missing, fails to compile, is lost, or draws nothing. The "draws nothing" case is detected by reading a grid of pixels in a dense frame; the same plume then carries on in Canvas 2D.
- **Phones** draw at about 30 frames a second instead of the screen's 90 or 120, which saves battery and heat.
- **Reduced motion**: nothing moves. One still, soft haze fades in and out (opacity only, no frame loop at all), every 30 to 55 seconds. If you would rather have no smoke at all with reduced motion on, that is one line (`if (reduced()) { ... }` at the top of `startExhale`).
- **Back/forward cache**: the smoke starts again after a restore.
- **Iris**: the chat tells the page when its window opens and closes. On a phone, where the window covers the screen, a new plume waits until it is closed; the Iris button is lifted above the pod's own Dim and Music buttons on phones; "Dim the lights" dims whichever canvas is showing the smoke. Opening and closing Iris never disables the smoke (tested).

## Check it on your phone (this is the part only a real phone can confirm)

Open `https://thedarknetdistrict.com/sleeping_pod.html?smokedebug` on the phone (after this is deployed). A small panel at the top shows, live: which renderer is in use (`webgl`, `2d` or `still`), whether WebGL started, whether **reduced-motion** is on, whether the page is in a phone layout, the frame rate, and whether pixels were actually drawn. Tap the page and press X on a keyboard, or wait 7 to 13 seconds for the first plume. If the panel says `reduced-motion: true`, that is the cause, and the still haze is what you will now see; turning off Settings > Accessibility > Remove animations brings back the moving plume. If it says `reduced-motion: false` and the plume still does not show, the panel's `pixels drawn` and `last:` lines say why, and the answer is worth sending back.

## Tests

`node tests/sleeping-pod-smoke-browser.cjs` (12 checks: desktop WebGL, phone WebGL, forced Canvas 2D, no WebGL, WebGL that draws nothing, shader that will not compile, reduced motion, hidden tab, back/forward cache, Iris and the smoke together on phone and desktop, dimming) and `node --test tests/sleeping-pod-smoke.test.cjs`. The browser checks are **Playwright emulation on this computer's GPU, not a physical phone**.
