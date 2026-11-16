# NeoChinatown remake: the art-direction pass

Build `2026-11-16-oldtown-block-1` (16 Nov 2026). Branch `claude/port-remake-1`. Not pushed.

David, 16 Nov 2026: "You're welcome to remake NeoChinaTown and make it look like a real cyberpunk city ... Wanting AAA, currently looks thrown together. The area around the landing pad looks especially bad with gaps." Then, the same day: "Treat the landing-pad-to-alley walk as the art-direction pass for NeoChinaTown. Use the existing assets first ... show me three matched player-eye views of the current route and a proposed paint-over of the Main Street view. Use that paint-over to establish the storefront alignment, lighting palette, and one landmark that draws me toward the alley. Then build one continuous block to match it, verify the building joins in the running game, and show me the same three views afterward. Let's judge that block before applying the style district-wide."

**So what ships in this build is ONE block.** Everything else here is either the method (to reuse if David approves the block) or parked work that is switched off.

## 1. What is live in this build: the alley-corner block on Main Street (Old Town)

`void-runner/ncz-oldtown-block.js`. Main Street's east side from Milked's side street to the North Gate (x 71, z -68.5 to -20), about 12 m deep. Five buildings that share party walls, south to north: corner-south (brick, 16.5 m), **the Lantern Bridge** over the alley mouth (5.2 m to 15 m up, 6 m deep), corner-north (concrete, 22 m), mid (weathered concrete, 17.5 m), gate-end (blue sheet steel, 25 m).

What the block sets (the standard the paint-over proposed):

| | Rule |
|---|---|
| Storefront alignment | One street wall on the street line. Every ground-floor unit stands between two piers under ONE lintel and canopy at 4.2 m. One pavement line. |
| Sign band | Every shop name hangs at 3.3 to 3.9 m under the canopy. No signs at random heights. Words are the street's existing shop names only. |
| Party walls | Buildings of different height and surface meet with no gap or set-back; a thin pier marks each join. |
| Door rhythm | A housing door (unit number, intercom, mail bank, stoop, one lamp; it does not open and has no prompt) at an end of each building; shops and shutters between. |
| Windows | One painted sheet of eight window types; about four in ten lit; sills, hoods, plain AC boxes and balconies; pipes and conduit; one fire escape. |
| Lamps | Warm sodium wall lamps at a steady spacing, each with a cone and a pool on wall and pavement; one cold lamp at the gate end. Two real lamps on Medium and up. |
| The landmark | **The Lantern Bridge**: flats across the alley mouth with a band of warm windows, five red lanterns under its street edge, and a chevron light 8.2 m tall on its north pier at (70.0, 10.2, -54.75). No words. It is the only thing on the street that crosses an opening and the warmest light on it. |

**Lighting palette** (`VoidOldTownBlock.PALETTE`):

| Name | Hex | Used for |
|---|---|---|
| sodium | `#ffb35c` | key: street lamps on the pavement, the bridge's underside, the chevron light |
| window | `#f0bd80` | lit rooms and shopfronts |
| teal | `#3fb8c4` | fill: sky light on walls and wet road, cool rooms, the haze |
| lantern | `#ff5a2e` | the landmark's accent only: the lantern row at the alley mouth |
| pink | `#ff5fb0` | sign accent: about one sign in five; never as an outline |
| fog | `#13272b` | what distance fades to; shadows lean to this, not to black |

**Existing assets only.** The game's own textures (`assets/textures/ncz`: brick, concrete-old, concrete-mold, metal-leaks, corrugated-blue, road-cracked), its shop names, its lamp-and-pool style, and boxes built in code. No model file is loaded by this block (`models:false`); nothing was generated for it. **0 credits.**

**What it leaves alone:** walkable space, collision, the alley and its own brick walls and fittings, the District's door, NULL, the taxi stop, every interaction, the pavement, the advertisement boards and kiosks (the screens work's), the cables. It only draws. `street-sight.js` still sees solid blocks either side of the alley; the bridge is above head height.

**How it replaces the old block.** `neochinatown.js` builds the block first (Old Town only). While it stands, `replaces(name, position)` tells the old street build which of its own pieces to leave out: the old plots there, their windows and roof clutter, and on the street front the old storefront strip, awnings, shop signs, blade signs, wall lamps and light pools. The old build still runs its seeded sequence, so nothing else in the city moves. If the file is missing or throws, the old block is built as before and the console says so (`[Block] ...`). Off switch: `VoidOldTownBlock.enabled=false` before entering Old Town.

**Purchased city pack.** Not on this machine, so everything in every picture is the built **FALLBACK**. On the live site the pack has one use on the street (an apartment block and stalls on Main Street's WEST side, z -76.6 to -49.4), and that use has been switched off since NULL's front was added (`both=!club&&...` in `neochinatown.js`): with the nightclub enabled the pack is not drawn anywhere on the street. This block is on the EAST side and does not touch that code, so the two cannot double up; if the nightclub front were ever switched off, the pack would appear across the road from this block, not in it.

## 2. The method

1. **Three matched views.** `docs/development/neochinatown-remake/cameras.json` holds each view's position, yaw, pitch, field of view and quarter; `tests/ncz-artpass-views-browser.cjs` re-shoots them identically (1920 by 1080, HUD hidden, the game's own walking camera).
2. **A paint-over of the Main Street view**, made in 2D over the real screenshot with the same camera (`tools/art/ncz-paintover.py`): flat facades drawn from the game's textures, sign names and lamp style, placed in perspective, then light pools, haze, reflections and rain. It sets alignment, palette and landmark before anything is built.
3. **One block built to it**, then the same three views again.
4. **The ray-grid gap check**, `tests/ncz-raygrid-browser.cjs`: rays every 0.2 m along each street wall and every 0.25 m up it, starting 0.6 m in front of the street line and going straight in; a ray is flagged when it passes more than the wall's depth (0.6 m here) behind the line without meeting a drawn solid surface. Not counted: anything invisible or switched off, signs, boards, screens, lit pictures, window glass sheets, light effects, decals, puddles, ground, sky, people, thin-instanced props. The walls and the intentional openings are data (`VoidOldTownBlock.WALLS` / `.OPENINGS`; `VoidPortData.WALLS` / `.OPENINGS` for the Port), so another script can use them. Run it with the block off (`old`) for the BEFORE and on (`new`) for the AFTER.

Results of this pass (pictures and numbers): section 6.

## 3. The city kit (`void-runner/ncz-kit.js`)

What the block (and the parked Port) are built from. `VoidCityKit.create({B,scene,parent,quality,name,models})`:

- **Surfaces** `S.*`: the shared tiling walls, metals and paving. Low: plain lit materials. Medium and up: physically based with normal maps. A building is tinted and darkened toward the ground through vertex colours, so a street of different buildings is one draw call per surface.
- **Batches** `box()`, `quad()`: everything static is written into one mesh per material.
- **Facades** `face()`, `dress()`, `building()`, `tower()`, `roof()`, `door()`, `fireEscape()`.
- **Pictures** `lit()` (one lit sheet for all signs, plates, intercoms and pictograms), `mark()` (one see-through sheet for paint, drains, manholes, stains and tags).
- **Light** `wallLamp()`, `cone()`, `wallWash()`, `groundWash()`, `shade()`, `light()` (real lamps, Medium and up).
- **Wet ground** `ground()` with a real mirror picture on Medium and up (used by the parked Port only).
- **Props** `prop()`: modelled props as thin instances with built stand-ins; `models:false` uses the stand-ins on every tier.

To apply the block's style to another frontage: describe its buildings as `[rect, height, surface]`, give each street face a list of ground-floor bays (`shop`, `shutter`, `door`, `blank`), hang the sign band on the shop bays, place lamps at a steady spacing, write a `replaces()` for the old pieces it stands in for, and declare its `WALLS` and `OPENINGS` for the gap check.

## 4. David's requirements for every quarter (recorded 16 Nov 2026; not yet built except where noted)

"NeoChinaTown needs food stalls in each area, housing (not interiors) but doors to them, entertainment like the nightclub. I'll come up with more. Gross public restrooms (somethings with NPCs passed out in them."

| Requirement | Standard | State |
|---|---|---|
| Food stalls in each area | counter, awning, lanterns or lamps, steam, stools, cooking gear; a vendor and customers only from existing street figures, no new dialogue; no invented menu or brand (pictograms, NOODLES / 麵, prices as numbers) | one is built in the parked Port (north-east nook of the pad yard); none live |
| Housing | apartment entrances along the street walls: real doors with intercoms, unit numbers, mail slots, stoops, lit stairwell windows; doors do not open; no prompt | **live on the alley-corner block** (units 61, 55, 31); five more in the parked Port |
| Entertainment | like the nightclub; nothing new decided | named frontage spots kept free in the parked Port (`VoidPortData.FRONTAGES`); Old Town has NULL |
| Gross public restrooms | a small room you can walk into: stained tiles, cracked mirror, flickering tube, tags (shapes, not slogans), stalls, sinks, wet floor; sometimes someone passed out (clothed, no gore, no dialogue) | one is built in the parked Port (north end of the lane); "sometimes" is seeded by day and visit; the person is an existing street figure in the existing sitting clip, slumped (the licensed floor-pose library was not wired in); none live |

Also from David, 16 Nov: "The taxi graphic needs updating." A road taxi model was made and a loader written (`road-taxi-model.js`), then parked with the rest before it could be checked in the running game. It is switched off (`VoidRoadTaxiModel.enabled=false`): every cab is still the built one.

## 5. Parked work in progress (in the repository, switched OFF, not finished, not for judging yet)

David stopped the Port remake and all generation on 16 Nov to do the art pass first. What exists:

- `void-runner/ncz-port.js`, `ncz-port-data.js`: the Port quarter rebuilt from the kit: a closed ring of dressed buildings round the pad yard and the lane, a second ring of lit towers, a landing deck with markings and guidance lights, floodlight masts, a ground-control booth, fuel bowser, cargo tug and crates, a food stall, five housing doors, a public toilet, a bridge over Port Customs, screen mounts (`MOUNTS`) and venue fronts (`FRONTAGES`) as data, wet ground with a mirror. **Off:** `VoidPort.enabled=false`; while off the old Port is built and its collision is the old one (a test checks this). It was seen running on Low and Medium (first pictures only); it was over its triangle budget on Medium in one view (1.23 M against 1.2 M) before the last trims, and the gap check, the walk through customs, save and reload, and the people in it were not yet verified.
- `void-runner/assets/models/ncz-kit/`: twelve props and a road taxi made with Meshy (12 MB). Used only by the parked Port and the parked taxi loader.

### Meshy credits (this branch)

All on 16 Nov 2026, on David's account through the Blender bridge, before he stopped generation. Text to image (nano-banana-pro) 9, image to 3D 30, remesh 5: 44 a model.

| What | Credits |
|---|---|
| Twelve kit props: AC cluster, balcony, shutter front, water tank, roof plant, fuel bowser, cargo loader, crate stack, dumpster, vending machine, scooter, customs booth | 528 |
| A food stall concept picture (never taken to 3D: the stall was built in code instead) | 9 |
| The road taxi | 44 |
| **Total** | **581** (limit for the Port slice was 600; the account showed 1,401 before) |

Nothing was generated for the alley-corner block or the paint-over. Batch folders on David's PC: `Documents\DarknetDistrict_Assets\Meshy\ncz_port\` and `...\ncz_taxi\` (`props.json` with the prompts, `status.json` with every task id, `out\` with the shrunk files). No licensed or purchased model and no photograph of a real person was sent to any AI tool; David's three reference pictures were looked at but not uploaded.

**Command windows on David's PC.** They were this work. The batch runner was started as a detached process with no console, so every Meshy command it ran opened its own console window (about 13 for the pictures, 12 for the models, 12 for the remeshes), and one balance check was run through a shell. From the taxi onward every process was started windowless (`CREATE_NO_WINDOW`), in as few launches as possible, and nothing was left running.

## 6. Results of the art pass

### The gap, and a city-wide bug found by the check

The ray-grid check on the OLD block flagged **10,012 of 16,800 rays** (7,171 on the Main Street wall, 2,841 on its side on Milked's street). The rays were not slipping through cracks: **the front-row buildings were not there at all.** Since the quarters build (`2026-11-16-quarters-1`) a building's body (`old-building`) was judged by the street-detail rule (kept within 2.6 m of the quarter's streets) instead of the building rule (45 m), so every building that fronts a street was left out in every quarter, while its windows, pipes, balconies and roof clutter (which use the building rule) were still drawn, floating. What stood on the street line was only the 3 m shopfront strip; above it a ray travelled 12.5 m to the next plot behind (`ncz-batch` at x 82.93), or 84 m to a distant block. This is what David saw as gaps round the landing pad and along the streets.

- **The one gap shown up close:** Main Street east, between the shopfront strip (`storefront`, x 71.05, top at 3.1 m) and the missing building `old-building` on the plot x 71.12 to 82.93, z -43.67 to -31.83. Close-up position: (65, 1.7, -47.2) looking east and up. Before: red bars over the whole plot. After: the block's wall, 0 flagged rays.
- **After (the rebuilt block): 0 of 16,800 rays flagged**, in three separate runs. The alley mouth (630 rays inside the declared opening) is closed behind too.
- **The city-wide fix** is one word in `neochinatown.js` (`roofPiece` now lists `old-building`), with a test. It puts the front-row buildings back in all three quarters as they were before the quarters build: view 1 (the landing pad) shows it. It is a bug fix, not the new style; the buildings it restores are the old ones.

### The three views

Same cameras before and after (`cameras.json`). Before = `origin/main`. Everything on screen is the built fallback on this machine.

| View | What changed |
|---|---|
| 1, landing pad toward Port Customs | Not restyled. The walls round the pad are back (the bug fix): the windows that floated in the dark now sit in buildings. |
| 2, Main Street toward the alley | The east wall is the rebuilt block: one ground-floor line and sign band, five buildings that meet, the Lantern Bridge and its chevron light marking the alley. The west side is the old street (with its buildings back). |
| 3, alley mouth | You look into the alley under the bridge: two piers, the lantern row, two warm tubes on the soffit; the alley beyond is unchanged. |

Counts on Low (software renderer; what the game asks for, not frame rates): view 2 draw calls 304 to 334, triangles 0.42 M to 0.43 M; view 3 draw calls 308 to 336, triangles 0.28 M to 0.31 M. The increase is the restored buildings plus the block.

Pictures kept in the repository: `docs/development/neochinatown-remake/` (before and after sheets on Low and on brightened Medium, the gap sheets, the paint-over and its annotated copy, the paint-over next to the built block).

### Checked

- `npm test`: all pass (new: `tests/ncz-oldtown-block.test.cjs`, `tests/ncz-port.test.cjs`).
- In the running game (bundled Chromium, software renderer): the block built on Low and Medium with no page errors; the ray-grid check before and after; the three views before and after; the block's fallback (switching it off builds the old block, which is how the BEFORE of the gap check was made).
- **Not checked in the running game:** walking the whole route by hand, the taxi stop at the alley mouth in use, save and reload in Old Town with the block (none of these are touched by the block: it adds no collision and no interaction, and unit tests check the layout is unchanged). `tests/stabilization-browser.cjs` in smoke mode: see the report of 16 Nov for how far it ran on the shared machine.
- `python3 -m unittest tests.test_story_save tests.test_progression_save` cannot import `void_runner_api` on this machine (the same on `origin/main`); no Python was changed.

## Not verified, and what a browser game cannot match

- **Software renderer only.** No real graphics card, no frame rates. Medium is drawn dim outside VR (the open sharpen decision), so Medium was judged on copies brightened three times, labelled as such.
- **Against the reference picture:** the block has the reference's structure (a continuous wall, a building over an opening, warm lamps against teal air, a vertical sign) but not its richness. Its walls are flat textures on boxes: no modelled pipes, cables, awning cloth or clutter in depth, no real shadows, no reflections on Main Street's road (Old Town is the heavy quarter and has no mirror), and the rest of the street around it is still the old look, which is the point of judging one block first.
