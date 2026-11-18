# Zen Zephyr Temple: the Sanctum of the Circuit

> **Update, build `2026-11-18-temple-1` (graphics, footsteps, East Gate):** the hall was rebuilt toward the owner's reference picture of Zen Zephyr's temple (deep teal-green haze, towering dark ribbed server columns with small cyan readouts and thin data strips, thin hanging cables, a wet mirror-like floor with dark inlaid circuit and glyph lines, a bright arched doorway behind the dais), with warm accents only (candles, saffron runner and banners, prayer beads on the altars). Layout, collision, interactions, the monk and his lines are unchanged. Details:
> - **Surfaces:** physically based, from the game's own interior texture kit (`void-runner/assets/textures/district-interior/kit_*`, the files the District rooms use; nothing new is downloaded). Low uses plain colours and reads no texture files.
> - **Floor:** Medium and up mirror the hall in it (a planar mirror at half resolution, three quarters on High, as Milked's floor), listing only the hall's own solid meshes; Low keeps the painted glows under the pillars.
> - **Light:** Low adds none. Medium adds three real lights (a cold key through the oculus onto the dais, the doorway's spill, the candles' warm flicker); High adds two low aisle fills (five). They light only the hall's meshes (`includedOnlyMeshes`) and are disposed with the area. Fog is a cold green haze (exp2) that leaves the skyline unfogged; the scene's two lights, fog and image settings are put back on leaving, as before.
> - **Footsteps:** the code path for the player's own steps was the same as the street's (recorded concrete steps) and works in the browser test; no Temple-only fault was found. The Temple now has its own floor, **stone**: the concrete recordings, 40% quieter, a little lower and with the click filtered off (the owner: "a little quieter there"). If the music's report of where the player stands goes stale (a panel open, the pod playlist playing), the Temple and the Corporate District are now recognised from the location itself, so their steps never fall back to the near-silent synthetic tick (`area-ambience.js` `STEPS`, `ownStepSound`, `placeArea`; tested in `tests/area-ambience.test.cjs`). Not heard by ear.
> - **East Gate:** its corner pylon stood over the outer 1.2 m of the walkers' lane (the PEDESTRIANS sign read "ESTRIANS" and half the lane room was inside concrete); the Function Gate had the same fault. Pylons now come from `VoidQuarters.pylons()` and never stand over a lane (`tests/ncz-gate-pylons.test.cjs`).
> - **Browser test:** `tests/temple-browser.cjs` was rewritten to walk the East Gate (it rode the scrapped sky cab). Screenshots: `docs/development/temple/` (`*-medium.png`, plus before/after pairs).

> **Update, build `2026-11-16-fixes-1`:** the Temple can also be reached ON FOOT through the East Gate's new walkers' lane, and left the same way: a sign (EAST GATE / ON FOOT · E) on a post beside the taxi stop, with the prompt EAST GATE · WALK TO NEOCHINATOWN (`temple-walk` in `temple.js`, wired in `temple-integration.js`). A walker arrives where a taxi passenger does. Nothing else at the Temple changed. "Taxi-only" below is older.

> **Update, build `2026-11-16-quarters-1`:** the sky cab is gone. The Temple is reached by ROAD taxi through the East Gate at the east end of the Avenue (60 CR, ride back included); it stays taxi-only. Only the arrival stop changed here: the landing ring is removed, the parked cab is a road cab, the sign and prompt read TAXI. Nothing else at the Temple was touched. See [`NEOCHINATOWN_QUARTERS.md`](NEOCHINATOWN_QUARTERS.md). Text below about the sky-cab ride is older.

A separate, **taxi-only hilltop** far from the city, overlooking the distant NeoChinatown skyline. Part 3 of the three-location expansion ([`THREE_LOCATION_EXPANSION.md`](THREE_LOCATION_EXPANSION.md)). Reached by the **same reusable 3D sky-cab transition as the Corporate District** ([`CORPORATE.md`](CORPORATE.md)), flat **60 CR, return included**. Built from Babylon.js geometry and generated textures; nothing is downloaded. Status: **built, provisional** (the quotes are placeholders; the monk is a placeholder model). Screenshots: `docs/development/temple/`.

## Files

| File | What it is |
|---|---|
| `void-runner/temple.js` | Pure data: layout, collision, interactions, the monk's replacement point, map model and its registered map space. |
| `void-runner/temple-build.js` | The 3D scene (browser only). |
| `void-runner/temple-integration.js` | Registers the location and handlers, the return cab, and the typed conversation panel. |
| `void-runner/zen-chat.js` | The local conversation (pure): quotes, topic matching, fallback, the inactive provider hook. |
| Shared | `sky-cab.js` (a `temple` row in `DESTINATIONS`), `area-map.js` (fog and map spaces), `taxi-rules.js`, `city-taxi.js`, `babylon-renderer.js` (`zoneHandle`), `district-map.js` and `personal-device.js` (now read `walkingLocation.mapSpace`, so the next area needs no code there). |
| Tests | `tests/temple.test.cjs`, `zen-chat.test.cjs`, `sky-cab.test.cjs` (Temple legs), `tests/temple-browser.cjs` (real browser). |

## The trip

Personal HUD taxi list: **Zen Zephyr Temple · 60 CR, return included**. The street cab comes, the fare is charged once, the cab room replaces NeoChinatown while the Temple readies, then the Temple replaces the cab (identical rules to Corporate: minimum ride, failed loads refund once and put the player back, reload refund, free return to exactly where they boarded). A longer ride than Corporate, since it is farther. The cab dashboard reads "EN ROUTE · ZEN ZEPHYR TEMPLE".

## The place

- **The hill:** a stone plateau with a parapet, a long slope down, and the city far below to the south-east: towers rising out of the glow, scattered city lights, coloured glow bands in the mist, a star dome. It reads from the arrival terrace, the overlook, and through the chamber's long glass window.
- **Arrival terrace and path:** a cab pad with a parked cab and a ring, a stone path north between lantern posts with blue light pools, a **courtyard gate** reading SANCTUM OF THE CIRCUIT, four **blue-flame incense** braziers.
- **The chamber** (36 x 40 m): walls of **layered 3D-printed bands** (each a little in or out, with lit seams and ribs); **eight tall server pillars** whose LED faces scroll with data, each with a painted glow on the glossy floor; **hanging cables** with small lights; three slow layers of **mist** near the floor; **four glowing data altars** with scrolling screens; a **central dais** with concentric lit rings under an **oculus** and a pale beam of light; blue-flame incense by the door; a long glass window onto the city. No real lights are added (the scene keeps its two); accents are emissive and additive pools.
- **Zen Zephyr:** a seated placeholder monk on the dais: silver head, closed eyes, dark robe, mustard sash, mechanical joints and hands, teal chest lights, calm cross-legged posture, gentle breathing and a slow head sway.

### Replacement point for the monk (easy to find)
Open `void-runner/temple.js`, block `==== WHERE TO CHANGE THINGS ====`, object `MODEL` (`id: 'zen-zephyr'`, `asset: null`). Package the real model with the usual private asset process and set `asset`; `temple-build.js` is where the primitive monk is built (search `mk-skull`). The seat, the facing, and the interaction are in `temple.js`. No voice is cast and none was invented.

## The conversation

Press **E** at the dais: **SPEAK WITH ZEN ZEPHYR**. A panel opens: header **"LOCAL RECITATION · NOT AN AI"**, a log, a text box (up to 200 characters), **SEND**, and **LEAVE · ESC**. Typing does not move the player or trigger game keys; Escape closes the panel (not the pause menu).

- **22 local quotes** (`zen-chat.js QUOTES`): the two **exact lines** the owner specified ("In the network of complex codes, serenity lies in the simplest line." and "A mindful soul is like a processor; it understands, computes, and calmly executes."), two taken from the Origins Zen Zephyr scenes (mood only), and 18 **provisional placeholders** for the owner to approve or replace. All can be chosen from **CHOOSE A TEACHING**.
- **Matching:** keywords map to topics (serenity, code, mind, network, fear, change, breath, silence, machines, city, sanctuary, work); the reply is the first quote of that topic not yet said, restarting when all have been. Greetings, farewells and thanks have short replies.
- **Fallback:** when nothing matches, a calm line inviting a different question; never a claim to understand.
- **It is not an AI and does not pretend to be one.** Everything stays on the device: no network, no credentials, no cost (a test checks the module has no network or storage code).
- **Future API hook:** `VoidTemple.chat.registerProvider({id, respond(text,{history})})` then `enableProvider(true)`. It is **off by default** and nothing calls it unless registered and enabled; a failing provider falls back to the local answer.

## V1 map

Its own map space (`area-map.js`, flag `templeFog`): arrival terrace and cab stop, the approach, courtyard gate, Temple entrance, main chamber, Zen Zephyr's dais, the four data altars, the overlook, your position, waypoints, and **fog of war** saved in `story.flags.templeFog` (about 68 characters), restored after a reload (tested).

## Save compatibility

No new location id, mission id or server change. New tolerant `story.flags`: `templeFog` (and the shared `skyCabTrip`, `cabReturn`). A reload inside the Temple resumes on the NeoChinatown street; the map progress is kept.

## Known limits and next

- Tested in a software-rendered browser; the long street legs of the street cab were shortened in the test. No real-GPU, Firefox or multiplayer testing.
- The quotes beyond the two exact lines (and the two from Origins) are provisional placeholders. No voice. The altar and incense texts are short placeholders.
- Reload while inside the Temple resumes on the street. One return point (the cab pad).
- Visuals are still MeshBuilder geometry (now with the interior kit's PBR surfaces, a floor mirror and a few real lights on Medium and up): an upgrade candidate for Blender-made architecture. Zen Zephyr is still the primitive placeholder (a real model plugs in through `temple.js MODEL.asset`).
- Origins puts the Sanctum in a hidden pocket of an abandoned server farm; the owner's brief (a taxi-only hilltop) is what is built. Whether Origins is canon is not decided.
