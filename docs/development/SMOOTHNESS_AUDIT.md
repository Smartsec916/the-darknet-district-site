# Smoothness audit (17 Nov 2026)

Branch `claude/perf-audit-1`, builds `2026-11-17-smooth-1` to `-smooth-3`. The owner's request: "do an audit on how to make the game run smoother without sacrificing graphic quality. Like when you exit the vestibule from The Darknet District to the alley, when you walk towards the street there's a lag moment. Grok said it's because it's loading the nightclub. So maybe load it before the loading is over inside the vestibule. After the Milked vestibule opens to the inside there's a big lag moment too."

## In plain words (for the owner)

**The lag walking out of the District toward the street.** Grok was half right. The nightclub (NULL) was being built the moment you came within 70 metres of it, which is about four steps out of the District's door, and that cost a little. The big lag came a few seconds later and was a side effect: the club brings its own coloured lights, and the next time any character model finished loading, the game engine redid the "recipe" (the shader) of every surface in view to make room for those lights. That is 25 to 40 recipes in one go, and that is the freeze you felt.

Now all of that happens while the vestibule's security scan is still on screen: the club is built (and kept hidden until you are within 70 metres, exactly as before), its recipes are made, every surface is given room for all the lights straight away, and the street people whose models are already on your computer are put in place. Walking from the door to Main Street now makes 2 recipes instead of 32 to 40, and the long freeze is gone in my measurements.

**The lag when Milked's inner doors open.** Milked's people (Eva, Fish and the four dancers) were only fetched once you were standing inside, so they arrived, and their recipes were made, right as the inner doors opened. On top of that, the room's reflections (the "picture" every shiny surface reflects, and the floor mirror) were drawn for the first time at that moment. Now, behind the check-in card, the people are put in place (when their models are already on your computer), all their recipes are made, and the first reflection picture and the floor mirror are drawn. Walking in now makes no new recipes at all, and the frame spikes are gone in my measurements.

**What changed on screen:** nothing should look different; side-by-side pictures of old and new are in `docs/development/smoothness-audit/`. Two things you may notice in Milked: the people are already standing there when the doors open (before, they popped in a few seconds later), and the shiny surfaces reflect the room from the first moment (before, for the first second or two they reflected a plain sky first). Milked's check-in card can also stay up a little longer, because the work happens behind it instead of in front of you.

**What I could not check:** I only have a software graphics card here (it draws on the processor and is roughly a hundred times slower than yours). It shows which work happens when, but not how many milliseconds your PC spends on it. Please walk both routes on your PC: out of the District to Main Street, and into Milked. If it still stutters, the console command `VoidBabylon.zone.state().prepared` inside Milked tells me how long each step behind the card took.

**Ideas that would make it smoother still but could change the look** are at the end, in a ranked list. None of them is done; each needs your yes.

## Method

Everything was measured in the real game in Playwright's bundled Chromium with software WebGL (`--use-gl=swiftshader`), 800 x 450, frame-rate governor untouched, comparing the unchanged `main` (served on port 5188 from an exported copy) with this branch (port 5187), one browser at a time:

- a per-frame trace (`requestAnimationFrame` intervals, scene mesh/material/texture/light counts, nightclub phase, player position),
- a long-task observer,
- a log of every new shader program (wrapping `engine.createEffect`; the mesh and material that asked for it; the define difference from that material's previous program),
- a trap on `maxSimultaneousLights` that records who changes it, with the call stack,
- a CPU profile over the walk, cut per frame.

The probe scripts are in this session's scratchpad, not committed; `tests/smoothness-browser.cjs` keeps the essential checks. To emulate a returning player, the crowd models were put in the browser's offline cache before each run (the service worker does the same after a first visit). A first visit still downloads figures after the loading screen, as before.

**Why frame counts over 50 ms are not quoted:** in software rendering every frame is over 50 ms (the median is 170 to 1,000 ms because the processor does the graphics card's work). The hitch measure used instead is a frame's time above the median of the 30 frames around it, plus the number of shader programs made during the walk.

## Hitch 1: the District's vestibule, the alley, toward Main Street

**Route:** wake, exit the pod, walk out through the real checkpoint, hold W north out of the vestibule into the alley, then west down the alley to Main Street.

### What happened (evidence)

1. At 70 m from NULL (`ncz-nightclub.js tick`: `d<70` then `load()`; about 4 m out of the vestibule) the code-built club was made: 167 meshes, 33 materials, 2 point lights (4 on Medium), and its people instanced. One frame of about +300 ms in software; the CPU profile shows `buildOwn` and `instantiateModelsToScene` for the people.
2. **Seconds later, the big one.** 25 to 40 shader programs were compiled in one frame for the whole street: asphalt, shopfronts, alley brick, gates, road taxi, every crowd figure in view. The define log shows the only difference from each material's previous program: `MAXLIGHTCOUNT 4` became `5` (Low). The `maxSimultaneousLights` trap caught the writer: Babylon's glTF loader, which, when any model finishes loading, sets every material in the scene to `max(its slots, number of lights in the scene)` (`babylonjs-loaders` onReady; `asset-pipeline.js` already clamps it at 8). NULL had just added its lights, so the next model to arrive (the club's own people's looks, a street figure's look, a gear piece) re-made every shader. Worst frame +1,400 to +2,133 ms above the local median, with 2 s and 1.5 s long tasks spent in `getProgramParameter` (shader compile and link).
3. On Medium the street already has 8 lights per surface (sun, sky, street lamp, two District entrance lamps, three gate lamps), so the same rebuild (4 to 8 slots, `+LIGHT4..7`) happens at the first model load after the street appears, in the first seconds after the doors open.
4. Within 28 m of NULL its lights switch on, which changes the club's own shaders again (new variants at the alley mouth).
5. As the doors opened, the street's walkers were spawned at random over the first second (`ncz-nightlife.js`: `rnd()<dt` per person per frame), each an instanced model plus its street gear, and each fading in through a see-through stage that needs a different shader variant (`ALPHABLEND`) from the solid one.

### What was fixed (no visual change)

- `neochinatown.js` `prepare()`, called by the loader (`babylon-renderer.js`) before the street is handed over, i.e. while the security scan is still up:
  - NULL is built now (`ncz-nightclub.js prepare()`), but held hidden: shutter down, nothing drawn, lights off, until the player first comes within 70 m. Then it appears exactly as it used to. (`warm()`) compiles its shaders both with its lights off (seen from afar) and on (within 28 m).
  - The street people whose looks are ready are made now (`nightlife.prewarm`, `alley.prewarm`); each still starts unseen and fades in as before. Their shaders are compiled for both the see-through and the solid stage (`nightlife.warm`).
  - Every material is given the light slots the glTF loader would give it at its next model (`asset-pipeline.js settleLights`, at most 8), and materials made later (road taxis, tinted clothes) are settled before the frame they are first drawn in (`keepLights`, checked when the number of materials changes). After this the loader's step changes nothing, so it rebuilds nothing.
- Why the look is identical: a material lit by no more lights than it already had slots for compiles to the same shader (the extra slots are switched off by their own defines). A material lit by more (Medium, 8 lights) is drawn as it would be after the loader's step, which in normal play happens within seconds of arriving anyway; that is the look players see. NULL's reveal distance, lights distance, interior distance and doorway are unchanged.
- A subtlety found on the way: a Babylon scene that has drawn no frame since a change takes its shaders as current (`_isReadyForSubMesh` compares a render id). The preparation calls `scene.incrementRenderId()` after each change so the readiness wait really compiles.

### Before and after (Low, 800 x 450, software rendering, returning player)

| | Before (`main`) | After |
|---|---|---|
| Shader programs made during the walk | 32 (40 in a first-visit run) | 2 |
| Worst frame above its local median | +2,133 ms (at NULL's build, x 118.9) | +850 ms (see note) |
| Frames more than 250 ms above their local median | 5 | 2 |
| Security scan time (overlay up to doors opening) | 6 s | 6 s |

Note: both remaining spikes are also in the `main` run at the same places: one is the probe's own key press when the walk starts; the other is the first frame looking west down the whole alley (+384 ms on `main`, +666 ms here). Neither makes a shader or a mesh; they are software-renderer cost of drawing a much bigger view for the first time, which a real graphics card does not show the same way. Not verified on a real card.

`tests/smoothness-browser.cjs` (Low): NULL ready and hidden at hand-over, no material short of light slots, NULL revealed and open at the alley mouth, 2 programs compiled walking door to Main Street.

## Hitch 2: Milked, the inner doors opening

**Route:** Far South, Milked's front doors, the vestibule (the check-in card), then the inner doors open and the player walks into reception and stands 30 s.

### What happened (evidence)

1. Every environment change releases all loaded models (`babylon-renderer.js release()` to `VoidAssets.release()`), and Milked loaded its people's looks only once the player was walking (`milked-build.js staff()`, `mode==='walking'`). They arrived 8 to 14 s after the card lifted, right around the inner doors opening; instancing, tinting the dancers' clothes and compiling their shaders (skinned, 7 to 8 lights) cost frames of +1.7 s and +2.5 s.
2. Their glTF loads then raised the light slots of the earlier figures (`+LIGHT7`), recompiling them again.
3. The floor mirror drew the walls with its own variants (`CLIPPLANE`, `MIRRORED`) the first time, +12 s and later.
4. The room picture every surface reflects (two reflection probes, six views each) was first drawn 1.2 s after the doors opened.

### What was fixed (no visual change)

`milked-build.js prepare()`, called by the loader behind the check-in card:
- the people's looks that are already on the computer (in memory or the offline cache; the rule every place follows, `asset-pipeline.js prepare`) are loaded and the people placed now; a first visit still downloads them after the card, as before;
- light slots settled, then a full readiness wait including render targets (`whenReadyAsync(true)`: the people, their shadow and glow variants);
- the first room picture is drawn now, under the light it would have had at 1.2 s (the lamps faded in); later pictures still come at 14 s and 34 s;
- the floor mirror is drawn once so its variants exist.

### Before and after (Medium, 800 x 450, software rendering, returning player)

| | Before (`main`) | After |
|---|---|---|
| Shader programs made after the card | 37 | 0 |
| Worst frame | 3,517 ms (median 950) | 1,217 ms (median 950) |
| Frames more than 250 ms above their local median | 7 | 0 |
| Check-in card time | 5 s | 38 s in software rendering |

**The card is longer in software rendering**: figures 14 s (loading six 3 to 4.5 MB models from the local server and parsing them on a slow virtual processor), shaders 12 s (compiling on the processor), mirror 9 s (two full mirror drawings at about 1 frame a second). The same work used to happen after the card, as stutter. On a real graphics card these steps should take a small fraction of that; `VoidBabylon.zone.state().prepared` reports each step in ms so it can be checked on the owner's PC. Not verified on a real card.

## Same look: checked

Same seed for the game's random numbers, same route, both builds waited past the old rebuild moment, then fixed viewpoints. At each: a screenshot, and the shader settings (defines) of every mesh drawn, compared mesh by mesh. Side-by-side pictures (left `main`, right this branch) are in [`smoothness-audit/`](smoothness-audit/).

| View | Pixels differing by more than 32/255 | Drawn meshes with identical shader settings |
|---|---|---|
| Alley, looking west (Low) | 0.00% | 261 of 261 |
| Alley mouth, NULL across the street (Low) | 0.16% | 323 of 323 |
| NULL's doorway (Low) | 0.53% | 325 of 325 |
| Main Street north (Low) | 0.33% | 330 of 330 |
| Milked reception (Medium) | 0.06% | 77 of 101 (see below) |
| Milked hallway (Medium) | 0.08% | 96 of 109 |

On the street the only differences are walkers in other places (they appear at random times) and NULL's animated screen; buildings, signs, lights and the club are pixel-identical. In Milked the remaining differences are reflections: on `main` the room picture that surfaces reflect replaces the default sky reflection only some seconds after the doors open (1.2 s on a fast machine, later on a slow one), and that is the define that differs (`GAMMAREFLECTION`); now it is in place from the first frame. Measured a minute later, both builds reflect the same room picture (`milked-room-0`, same colour space). This is the room's intended look arriving sooner, not a new look.

## Steady state (step 3)

From a 5-minute CPU profile of the street walk (Low), excluding the software renderer's own drawing time:

| Where | Share | Note |
|---|---|---|
| Babylon's own render work (`scene.render`) | about 10 ms a frame here | normal |
| Copying the 3D picture onto the 2D game canvas each frame (`babylon-integration.js draw`, `ctx.drawImage`) | in software this is where the frame waits for the drawing | structural, see proposal 3 |
| `renderRoom` gathering every mesh of the room every frame to find station doors | about 0.7 ms a frame here, plus garbage | **fixed** (cached; NeoChinatown has none) |
| NeoChinatown tick (people, ads, gates, sight) | about 1.4 ms a frame here | fine |
| Advertisement screens repainting (6 to 12 times a second, only when seen) | about 0.5 ms a frame here | already throttled |
| Garbage collection | about 0.1% of busy time | fine |

## Ranked further proposals

Marked **(same look)** where the picture would not change, **(changes look)** where it would and needs the owner's approval.

1. **(same look) Other first-time stutters found in the same way.** The same light-slot rule and people preparation now run for every street quarter (gates, road taxi between quarters, Outskirts), because they all go through the same loader. Not yet measured one by one: the gate and taxi swaps, the pod exit into the District (the pod room was deliberately not touched), the VR rooms. The probe method above can be pointed at each.
2. **(same look) A first visit to Milked or a new street figure** still downloads models after the loading screen and makes their shaders when they first appear. Starting those downloads while the player walks toward Milked's door would move it earlier; it was not done because a large download during a walk has its own cost.
3. **(same look) Show the 3D canvas directly.** Each frame the 3D picture is copied onto the game's 2D canvas and the HUD drawn over it. Drawing the HUD on a transparent canvas over the 3D one would save a full-screen copy and a synchronisation every frame. A bigger change to how the screen is put together; needs careful testing of every overlay.
4. **(changes look, slightly) Local lamps only on the surfaces they reach.** On Medium every street surface is shaded by 8 lights, including the gate lamps and the District entrance lamps far away. Telling each lamp which meshes are within its range would cut the shading work. Identical only where a lamp's light really ends at its range (PBR materials use physical falloff, which does not end), so it can change faint far lighting.
5. **(changes look) Glow and bloom.** On Medium the glow layer roughly doubles the draw calls outdoors (`OUTDOOR_PERFORMANCE.md`). A smaller glow texture or fewer meshes in it would be cheaper but softer.
6. **(changes look) Milked's reflection pictures** are re-taken at 14 s and 34 s (six views of the room each). Now that the people are there from the start, the re-takes could be dropped; reflections would then not catch later arrivals.
7. **(changes look) Simpler far figures** (from `OUTDOOR_PERFORMANCE.md` section 5.1): low-detail models beyond 30 to 40 m.

## Tests run (17 Nov 2026, software rendering)

- `npm test`: 1,067 pass (adds `tests/smoothness.test.cjs`).
- `tests/smoothness-browser.cjs low`: pass (NULL ready and hidden at hand-over, every material settled, NULL revealed at the alley mouth, 2 programs on the walk; Milked handed over with all 6 people placed).
- `tests/milked-browser.cjs low`: pass (797 frames watched, doors never both open).
- `STABILIZATION_SMOKE=1 BROWSER_CHANNEL=chromium tests/stabilization-browser.cjs`: pass, no errors.
- `tests/ncz-quarters-browser.cjs low`: pass (every gate both ways, taxis to the Corporate District, Temple, Milked, Main Street and the Port).
- `tests/nightclub-browser.cjs low`: fails at its first step on `main` too (`VoidNeoChinatown.nightclub` is undefined in the street it enters, so `isOpen()` never becomes true); not caused by this branch, not investigated further. NULL's opening is covered by `tests/smoothness-browser.cjs`.

## Files

`void-runner/asset-pipeline.js` (`settleLights`, `keepLights`, `isCached`), `void-runner/ncz-nightclub.js` (`prepare`, `warm`, hidden until 70 m), `void-runner/neochinatown.js` (`prepare`), `void-runner/ncz-nightlife.js` (`prewarm`, `warm`), `void-runner/ncz-alley.js` (`prewarm`), `void-runner/milked-build.js` (`prepare`, `state().prepared`), `void-runner/babylon-renderer.js` (calls both, door list cache). Tests: `tests/smoothness.test.cjs`, `tests/smoothness-browser.cjs [low|medium]`.
