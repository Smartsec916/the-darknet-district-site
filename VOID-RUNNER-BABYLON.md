# Babylon migration foundation

## Recovery and scope

Reference: production main `0d7f43d`, fetched September 23, 2026. Local recovery branch: `checkpoint/pre-babylon-production`. Development branch: `codex/void-runner-babylon-foundation`. No production deployment is part of this work.

Keep the original renderer available. Babylon is an explicit graphics selection and can be tested with `?renderer=babylon`; `?renderer=legacy` is the recovery path. The engine is locally hosted, version pinned and lazy loaded. No paid services or new backend infrastructure.

## Audit before implementation

The entry page loads classic script modules in dependency order and has a Flask mirror. `bootstrap.js` owns the only animation loop. `game.js` supplies the shared state; later modules compose its launch/update/draw hooks. Account code is a separate ES module. Retain that integration pattern for this milestone rather than replacing the application build system.

| System | Authority retained | Babylon responsibility |
| --- | --- | --- |
| Flight | `pilot-flight.js`, `cockpit-math.js`, `ships.js`, `balance.js` | Map the down-positive game Y axis into up-positive scene Y; consume camera basis and player-relative object positions |
| Timing | Existing 1/120-second internal flight steps; bounded animation delta | Render once per animation frame; never introduce a second simulation loop |
| Combat | `cockpit.js`, `enemy-pilots.js`, `targeting.js`, `missiles.js`, `combat.js` | Meshes, tracers, exhaust and pooled explosion fragments; no damage or ownership decisions |
| Campaign/economy | `campaign.js`, `content.js`, `expansion.js` | No rewards, purchases or mission completion in renderer |
| Story | `story-content.js`, `story.js`, `story-scenes.js`, `scenes.js` | Spatial interaction routes back into existing dialogue and events |
| Persistence | Campaign v1/v2 restore, local save key, Python validation, generated save manifest | Graphics/walking presentation cannot invalidate campaign saves |
| Accounts | Firebase identity, generation checks, authenticated API, server-owned paid inventory | Unchanged |
| Audio | Single gesture-unlocked Web Audio context, category buses, speech cancellation | Position-aware existing effects; local track/radio adapter shares mixer |
| Navigation | `warp.js` route checkpoints and encounter gates | Reusable marker reveal timing, alignment feedback, destination preparation |
| Cockpit | Canonical transparent `cockpit-kestrel.png`, existing instruments | Retain readable overlay over 3D exterior; small bounded visual feedback only |
| Stations | Four canonical station identities, existing menus and departure artwork | Prototype geometry, preloaded exterior, doors, small walkable hangar |

Existing ships and projectiles use player-relative coordinates, not a global planetary coordinate system. Moving the scene camera through an independent Babylon physics world would duplicate movement and break targeting. The adapter must reflect game Y and retain the projection center at 50% width / 44% height. Missile collision is already swept-segment based. Enemy pilots already implement stable attack/pass/evade/retreat states. Escort logic currently targets a fixed shuttle point; replace that point with a small reusable escort state while retaining mission rewards and retry rules.

The prior renderer draws asteroids/planets only in alignment or encounter phases, while departure art can already be transparent. Combined with asynchronous exterior texture loading, this explains the departure gap. Preparation must complete before launch presentation advances, and Babylon exterior objects must remain present through departure.

Tests cover campaign migration, ownership, flight math, missile collision, targeting, route progression, audio, account fixtures, menus, piloted opening routes and browser rendering. Preserve these tests and add browser coverage for Babylon and exploration. Real Google sign-in and production payments are outside local fixture verification.

## Asset audit

| Category | Existing assets | Treatment |
| --- | --- | --- |
| A: directly reusable | `cockpit-kestrel.png`, character portraits, Vesper/bar/dock/concourse paintings | Keep cockpit and dialogue artwork in existing UI |
| B: textures/materials | Four `sky-*.png`, station paintings, `ships.png` atlas, transparent `hangar-*.png` | Reuse as scene backdrop or reference panels where appropriate |
| C: canonical references | Ship atlas, station exteriors, station/hangar prompt documents | Shape and palette guide primitive models; do not invent replacement canon |
| D: future 3D models | Kestrel, other hulls, station exteriors, walking NPCs, hangars | Clearly identified geometry blockouts pending GLB models |
| E: obsolete | None in this milestone | Do not delete recovery assets |

New asset directories live under `void-runner/assets/`. Prefer GLB with metres, Y-up, forward +Z, named materials and sockets, baked static detail, shared textures, modest geometry and exported collision proxies. Keep canonical references in `art/`; do not duplicate large paintings into the new tree. Never enable decoder CDN downloads silently: any compression decoder must be locally hosted and pinned too.

## Planned implementation sequence

1. Add isolated renderer loader, state adapter, quality controls and legacy recovery.
2. Render flight objects with Babylon, preserve cockpit/HUD and simulation.
3. Gate departure on readiness; add reusable marker reveal.
4. Connect escort state and bounded graphical effects.
5. Add data-driven collidable walking blockouts and interactions.
6. Add progression-gated Sol route and Earth/Mars landing prototypes.
7. Add billboards and locally hosted radio/music hooks; document extension contracts.
8. Run existing and new tests, inspect rendered output, package a reviewable change.

## TDD requirements reserved for later design

Sacramento city → alley → TDD entrance → security vestibule → badge scanner → glass security door → main interior. Long main hallway: VR/arcade on one side, bar/social area on the other; back hallway farther in. Shop: Admin and Iris usually present. Side hallway: vending machines, sleeping pods, meeting-room door, stairs upward, smoking area. Restricted/secret spaces are intentionally unspecified. This milestone stops at the entrance; no finished interior or invented secret areas.

## Try the milestone

Serve the repository using the existing Python server or a static HTTP server. Open `void-runner.html?renderer=babylon`, or choose **Settings → Graphics → Babylon 3D / preview**, then depart. The original renderer remains the default for existing players. Settings are stored separately under `void-runner-graphics-v1` and do not affect campaign data. `?renderer=legacy` overrides a broken graphics preference.

At a dock, choose **Leave ship / 3D hangar**. Walk with WASD, run with Shift, click the canvas for mouse capture or drag to look, and press E near a highlighted interaction. Escape releases capture and opens the existing menu. Touch devices have movement buttons, drag look and a tap interaction button. The Kestrel boarding point is beside the ship, not inside its collider. Rook connects to the existing quest-sensitive conversation/job flow; **Return to exploration** returns to the hangar. The room is explicitly a test hangar, not a replacement for every station interior.

After the opening story reaches `quest === 'open'`, the dock/navigation menu exposes Sol. Cargo contracts must be completed first. Plot Earth or Mars, turn toward its marker, hold alignment, then complete the short interstellar transit. Choose **Land** to enter the location blockout. Return to the frontier through Sol navigation. Earth/Mars are expedition destinations, not added to the four canonical station IDs; this intentionally avoids breaking existing station logic and cloud validation. The last Sol destination is stored in the already validated `story.flags.solDestination`; dock menus offer **Resume Sol visit** after reload. Exact walking coordinates and partially completed interstellar transit are not saved in this prototype.

## Module contracts

| Module | Responsibilities |
| --- | --- |
| `babylon-renderer.js` | One engine/scene; read-only snapshot rendering; current space/room geometry; materials; instancing; bounded effects; disposal |
| `babylon-integration.js` | Existing hook integration; async launch readiness; original-renderer recovery; HUD composition; walking mode; Sol expedition UI |
| `navigation-reveal.js` | Engine-independent two-second active-time clock with 0.4-second fade |
| `exploration-data.js` | Systems, planetary destinations, landing rooms, colliders, NPC placements, signs, radio definitions |
| `exploration-controller.js` | Horizontal swept subdivision/axis sliding, bounded movement, range/facing/line-of-sight interaction selection |
| `escort.js` | Player-relative escort navigation, distance hold, progress, distress and health |
| `asset-pipeline.js` | Validated local GLB loading, cached containers, instantiation, release |
| `radio.js` | Local media selection, regional availability, story conditions, crossfades, stop/disposal |

The adapter snapshot has `basis`, `route`, `rocks`, `ships`, `bullets`, `hostile`, `missiles`, `effects`, `time` and `approach`. Renderer functions never call campaign completion, grant gear, deduct credits, or advance projectiles. The original `loop` calls the composed update and draw once. The Babylon engine has no `runRenderLoop`, camera input handlers or physics plugin. `audioEngine:false` prevents it from creating a second audio context.

Game coordinates are right-positive X, down-positive Y, forward-positive Z. `vector()` maps `(x,y,z)` to `(x,-y,z)`. The camera uses the existing basis and a projection whose optical center is at `(W/2,H*.44)` with focal length `min(W,H)*.82`. Browser tests compare Babylon projections with existing targeting to within 0.01 pixels at nonzero yaw, pitch and roll.

## GLB pipeline

Babylon **8.26.0** and matching loaders are vendored under `void-runner/vendor/` with the Apache-2.0 license. The 7.18 MB uncompressed engine loads only when a 3D scene is requested; the 307 KB loader loads only when a GLB is configured. No runtime CDN is required. Enable HTTP gzip/Brotli on the existing host when available. Vendor updates should be deliberate and test both scripts together.

Models must be self-contained glTF 2.0 GLBs. External texture/buffer URIs are rejected. Draco, Meshopt and Basis extensions are deliberately rejected until their free decoders are also pinned and hosted locally; this avoids unexpected downloads. For now export normal geometry and embedded PNG/JPEG textures. Ship/station blockouts remain the fallback when no model is registered; a configured but missing model holds preparation with a recoverable error.

Example registration in a content script loaded after `asset-pipeline.js` and before a scene is entered:

```js
VoidAssets.models.ships.raider = {src:'assets/ships/raider.glb', scale:1, yaw:0};
VoidAssets.models.ships.starter = {src:'assets/ships/kestrel.glb', scale:1};
VoidAssets.models.stations.meridian = {src:'assets/stations/meridian.glb', scale:1};
```

`prepareSpace(id, shipTypes)` loads only requested ship classes and the current station model. The default class set covers the existing raider/interceptor/gunship plus courier/security/shuttle. The hangar loads the registered starter hull. Local room models use `models:[{id,src,position:[x,y,z],scale,yaw}]`. Render transforms sit outside the GLB's unit/axis adjustment node. Colliders are separate content definitions, so art changes cannot unexpectedly alter flight damage or walking bounds. Model containers and instances are disposed when leaving the location.

## Locations, NPCs and interaction

Add a room to `VoidExplorationData.locations`:

```js
serviceDeck: {
  name:'MERIDIAN / SERVICE DECK', kind:'hangar', prototype:true,
  bounds:[12,18], spawn:[0,1.7,-12], color:'#416268', music:'industrial',
  solids:[{id:'workbench',position:[5,1,6],size:[3,2,2]}],
  interactions:[{
    id:'mechanic', label:'TALK — MECHANIC', position:[1,1.7,3], range:3,
    action:'talk', character:'existingCharacterId', scene:'existingStorySceneId',
    when:{flags:{serviceDeckOpen:true}}
  }],
  signs:[], models:[]
}
```

Room coordinates are Babylon Y-up metres. `solids` are full box dimensions and provide horizontal collision. This controller supports flat floors, with no stairs, jumping or crouching yet. A room requires `solids`, `interactions` and `signs` arrays. Interactions must be close, in front of the player, unobstructed and satisfy `VoidStory.matches`. Reuse registered story scenes rather than embedding new branching logic in rendering code. Built-in actions are `board`, `talk`, `services`, `airlock`, `terminal`, `tdd`, and `inspectProduct`.

New action handlers can be registered without editing the controller:

```js
VoidInteractions.register('myTerminal', ({item,state,resume,save}) => {
  // Present existing game content, then call resume().
});
```

Shop display objects can carry `product:{title,description,provider,productId,variantId}`. `inspectProduct` currently displays escaped title/description only. It does not request Shopify data, add to carts, navigate to checkout or introduce affiliate products. No merchandise art or TDD interior is supplied.

## Relationships, escorts and jobs

Ship allegiance is `friendly`, `neutral` or `hostile`; an absent value retains legacy hostile behavior. Existing lock, laser, drone, missile and route-clear rules remain authoritative. Babylon flights include small neutral courier/friendly security traffic examples; they do not contribute to required enemy counts. HUD brackets use green for friendly, gray for neutral and red for hostile. The original renderer remains capable of showing story-defined allied contacts.

Existing escort contracts (`belt-3`, `lockdown-1`) create a physical friendly shuttle in Babylon mode. Its heading is fixed to the route vector, speed defaults to 12 units/second and proximity range to 110 units. It waits when the player leaves that range and resumes on rendezvous. Existing enemies can fire at both the player and shuttle; shuttle shots now aim at its actual position and use swept impact checks. Health loss produces graphical feedback; destruction invokes the existing safe retry behavior. Completion requires hostiles cleared, escort progress complete and the player within escort range. Reloading restarts the current route encounter using the existing checkpoint policy; an in-progress escort is not independently persisted. This is one-ship escort support, not a convoy/pathfinding system.

Job chaining, conditional availability, recurring characters, relationships and flags remain in the existing story/campaign modules. Faction definitions already exist; faction reputation can currently be expressed through bounded story relationships and event conditions. No giant branching job rewrite or new reward authority was added.

## Navigation and preparation

The reusable reveal clock resets on route phase changes and launch; it advances only during active play, not menus. Alignment markers remain hidden for two seconds, then fade over 0.4 seconds. Warp acquisition is held while the marker is hidden so an already-aligned pilot cannot skip the presentation. The route destination and encounter resolution stay internal and immediate. The direct `warp.js` state machine is unchanged.

Before a Babylon departure, initialize the engine, prepare the current exterior, wait for sky/model loading and scene readiness, and decode the canonical departure artwork. Only then call the existing launch chain. The planet, rocks, station and traffic exist during the departure phase; transparent hangar artwork stays over them as the ship leaves. There is no phase that deliberately removes the exterior. Destination preparation occurs behind a warp synchronization overlay while simulation is held. Required asset failure keeps the pilot at a recoverable preparation screen, with retry/original-renderer controls. Preparation has a 30-second timeout. Menus cannot capture a half-prepared transition.

Sol reuses the Kestrel flight integrator for alignment and has a compact eight-second interstellar transition. Earth and Mars are separately prepared, and their walking blockouts are built only when landed. No whole planet terrain, city streaming or final TDD floorplan is implied.

## Holographic signage

Signs are data entries with `id`, `position`, optional Y-axis `rotation`, `text`, `color`, optional `animation` and optional story `when` conditions. `pulse`, `flicker` and `rotate` animate a shared rendering path. They use small emissive, transparent dynamic textures. Location authors control density by the number and placement of definitions. Conditions are checked during rendering. Video textures are an extension point, not shipped playback; no videos or ad-network requests are made.

## Music and radio

The existing audio mixer remains the owner. `VoidAudio.connectMedia(element,'music')` connects local tracks to the same category and master gain, retaining mute, voice ducking, gesture activation and suspension. Procedural music fades away while a media track is active. No paid voice/music service is added.

Put tracks under `assets/audio/` and register them in a content script:

```js
VoidRadio.music.earth.push({src:'void-runner/assets/audio/earth-night.ogg',title:'Earth Night',loop:true});
VoidRadio.music.combat.push({src:'void-runner/assets/audio/combat.ogg',title:'Combat'});
VoidRadio.stations.district.tracks.push({
  src:'void-runner/assets/audio/district-news.ogg',title:'District News',loop:false,
  when:{flags:{districtNewsUnlocked:true}}
});
```

Media paths are relative to the page and must be same-origin. Categories include flight, combat, Earth, Mars, district, bars, stations, industrial areas, sleeping pods and story. Radio choices live in Settings; regional availability and story flags select eligible programming. Transitions crossfade over roughly two seconds. Station lists are deliberately empty until the owner supplies tracks; the UI says no local tracks are installed. Current programming chooses the first eligible entry: this is not yet a timed news scheduler, shuffled playlist or continuous broadcast simulation. Signal availability changes by region, not an astronomical inverse-distance propagation model.

Existing engine/weapons/explosion spatial sounds continue using camera-relative pan and distance attenuation. Walking adds footstep/door cues. Babylon audio is not enabled because retaining one tested audio owner is safer here. Positioned arcade/bar/vending emitters and spatial NPC voice sources remain future content work.

## Performance and graphics quality

| Preset | Resolution divisor | Asteroid instances | Star instances | Fragment limit |
| --- | ---: | ---: | ---: | ---: |
| Low | 1.5 | 18 | 180 | 60 |
| Medium | 1 | 34 | 360 | 120 |
| High | 0.8 | 48 | 600 | 220 |

Render surfaces are capped at 2560×1600. Coarse-pointer or ≤4-core devices default low; other devices default medium. Resolution and effect budget changes apply immediately; static instance counts rebuild when a new scene is prepared. The implementation uses shared materials, instanced stars/rocks/projectiles/fragments, at most twelve active explosion sprite groups, and no shadow-map/reflection/post-processing passes. Presets do not claim those expensive features are implemented. There is one current environment; obsolete room/space nodes, textures, materials and model containers are released. The 2D cockpit composition still copies the Babylon render surface each frame; a later optimization can layer the canvases directly after compatibility testing.

## Validation commands

```text
node --test tests/*.test.cjs
python -m unittest discover -s tests -p "test_*.py"
node tests/babylon-browser.cjs
node tests/babylon-piloted-browser.cjs
node tests/babylon-assets-audio-browser.cjs
node tests/babylon-recovery-browser.cjs
```

Browser tests require Playwright and Chromium/Edge, a static server at port 5000, Flask on port 5001, and (for `production-browser.cjs`) the local HTTPS fixture on port 5443. Start that fixture with `python tests/production_fixture.py --cert-dir <scratch-directory>`. `VOID_SCREENSHOT_DIR` enables Babylon screenshots. Existing menu/account/audio/overhaul/HUD/piloted/travel/startup/entrypoint suites must remain passing. The GLB/audio test serves generated test fixtures through Playwright routes; it does not ship fake production music or models. Recovery testing deliberately denies the engine download. Performance is structurally bounded, not certified across physical low-end phones.

Babylon API references used: [camera documentation](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/cameras/camera_introduction.md), [asset/container loading](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/importers/loadingFileTypes.md), and [engine capabilities](https://www.babylonjs.com/specifications/).
