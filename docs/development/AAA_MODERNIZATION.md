# Graphics modernization: progress record

Direction (David, 2026-11-11/12): a cinematic science-fiction look. Blade Runner 2049 for atmosphere (darkness, haze, rain, restrained neon), Altered Carbon for urban density, The Expanse for believable engineering. References for mood only; nothing is copied. Work outward from the first thing a player sees. One finished area = one verified live release.

Excluded: mission characters; existing companions except one male and one female reference companion (not chosen yet).

Scores are honest estimates within the limits of a browser game, judged from screenshots taken with a SOFTWARE renderer in a cloud container (no real graphics card). Real-GPU frame rates are not measured.

## Order and status

| # | Area | Status |
|---|---|---|
| 1 | Main menu and "preparing" screens | **Live** (2026-11-12) |
| 2 | Character creator | Next |
| 3 | Sleeping Pod interior | Partly (Tesana surfaces, music/light panels, vending are live); needs depth, wear, lighting |
| 4 | Pod room after exit | Not started. Baseline: almost black, flat pods, floating "PODS" labels |
| 5 | District entrance and vestibule | Not started |
| 6 | Main District interior, VR Play area, store, Admin/Iris counter, social spaces | Not started |
| 7 | NeoChinatown streets | Not started |
| 8 | Player characters, regular NPCs, two reference companions | Not started |

## Area 1: main menu and preparing screens

- **Before:** the menu showed the old VOID//RUNNER space station and planet (a different game's identity). While a place was prepared, the words "3D display unavailable" showed through behind the card.
- **Now:** `void-runner/menu-backdrop.js` paints the city around the District at night in rain: cold air over an amber smog horizon, a stepped megastructure and towers fading into haze, dense lit windows, a few neon accents, a wet street that mirrors them, slow aircraft lights and rain. Still layers are painted once; each frame adds only rain, aircraft and drifting haze. With reduced motion it is a still picture. The same picture, dimmed, sits behind the "preparing" card. No assets, no 3D scene.
- **Files:** `void-runner/menu-backdrop.js` (new), `void-runner/world-integration.js` (`drawModernBackground`), `void-runner.html` + `static/void-runner.html`.
- **Scorecard:** atmosphere and identity 8, lighting/composition 7, interface 6 (the menu text and buttons are unchanged), performance 9 (2D only), stability 10 (unit tests and creator browser test pass).
- **Known limits:** it is a painted 2D picture, not the real 3D city. The menu still lists CAMPAIGN / SKIRMISH from the older game; changing those is a design decision for David. The old station scene is still loaded in the background to warm up the 3D engine (not shown): removing that load is a possible start-up saving.

## Baseline notes for the next areas (captured 2026-11-12, High setting)

- Character creator: dark flat room, character in a stiff pose, no key light on the character.
- Pod interior: clean but flat lilac surfaces; hatch ring is a flat yellow band; no wear, no depth.
- Pod room: walls nearly black, pods are plain boxes, marker labels float in the air.
