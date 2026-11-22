# Advanced NPC interactions — implementation checkpoint (2026-11-22)

Branch: codex/npc-advanced-interactions. This is an isolated development branch, not deployed.

Owner-approved scope:
- Keep basic NPC editor intact. Optional collapsed Advanced settings.
- Proximity and room entry/exit triggers, short-visit and longer-visit dialogue, configurable time/cooldown; per-player state.
- Companion-style greeting and response choices; walk away cancels.
- Follow invitation, map destination, timed waiting/catch-up, arrival dialogue and actions, then return to original position/activity on cancellation.
- Linked NPC groups: one speaker at a time, alternate greetings or author ordered dialogue and synchronized compatible animations; no overlap.
- Consistent Eleven v4 controls, tags, bulk import and generation for supported speaking NPCs. No paid generations without explicit confirmation; keep existing assignments and clips.

Checkpoint 1: isolated pure helpers in void-runner/npc-advanced-interactions.js; smoke checks for speaker exclusivity, alternate turn, visit duration and timeout passed. Not loaded by game yet.

Next: add persistent schema and mirrored validation in mission-content.js and void_runner_live_content.py, editor controls in npc-editor.js, runtime adapters in live-content.js and path/escort adapters; verify script loading and draft/publish flow, audio completion/cancellation and room identity, multiplayer separation, and all existing regressions before merging. Add repository tests for helpers and integration before release. Do not treat this checkpoint as a complete implementation.

## Additional approved requirement: cross-area daily itineraries
- Select ordered destinations (home apartment, optional noodle stand, Iris's store, home) and dwell/activities at each. Connect destinations via existing walkable area links, gates and apartment/vestibule doors with appropriate access checks; do not teleport visible NPCs or bypass security.
- Reuse existing escort cross-area navigation where appropriate; current ordinary NPC paths are restricted to a single area. Keep existing single-area paths unchanged. Handle unavailable routes, scene unload and re-entry, and return home safely.
- Iris relationship visit: ambient partner conversation and compatible animations may continue while another player receives a private Comms mission call. Local in-person mission interactions take priority; resume afterward. Mission 011 evidence handover includes Iris; Mission 012 tutorial is remote. Test with two clients.

- Tier policy (owner clarification): Tier 1 ambient filler stays within its local area and never crosses vestibules as part of ordinary wandering. Cross-area itineraries and vestibule navigation are opt-in for Tier 2 and Tier 3 NPCs only. Preserve existing crowd budgets and local movement; test that Tier 1 cannot enter the cross-area planner.

## Crowd checkpoint
- NeoChinatown ambient walker targets 12/28/44 -> 8/20/31 (Low/Medium/High), standers and diners also reduced roughly 30%; cook/vendor configuration unchanged. NULL ambient count reduced by one per preset (6/9/10 total; named NPCs and staff retained). Syntax checks passed; regression testing pending, including monk counts and nightclub cast assertions.
- Add NPC Tier selector in editor and independent configurable Tier 1 density by area. Tier 2 and 3 must never be hidden or culled merely because of graphics quality or crowd-budget governor; preserve normal off-screen/unloaded-area optimizations and schedule state. No changes deployed yet.

## Owner-approved execution order (22 Nov)
1. Finish Advanced NPC interaction editor, timing, room triggers, dialogue branches, follow/return and arrival actions; Eleven v4 controls and linked group conversations. Test and checkpoint.
2. Finish companion residence/relationship visit support, cross-area Tier 2/3 itineraries, explicit tier selector and protected visibility; verify Iris remote calls do not interrupt unrelated local social interactions. Complete crowd-density changes and regression checks.
3. Tier 3 awareness and configurable reactions, compatible animation assignment; staged player hand-to-hand combat beginning in underground fighting ring, first-person arms only in combat, rounds and server-validated credit rewards. Preserve exploration and missions.
4. Underground entrance audit: Avenue, Old Town/NULL and Far South, both directions; clear visual and collision obstructions at door, stair and landing, improve localized lighting and obvious route to main tunnel; retain security and ambience. Verify actual walks and existing mission/escort routes.
Keep separate commits, update this handoff at each completed stage, and do not claim deployment until verified. The current checkpoint is not a complete implementation.

## Tier perception editor (owner addition, 22 Nov)
- Add optional Advanced > Awareness settings with editable sight range (feet), horizontal field of view, line-of-sight/obstruction checks, hearing range by event (walk, sprint, combat), and individual reaction rules. Tier 1 uses cheap local checks only; Tier 2 supports bounded event-driven perception; Tier 3 supports configurable investigation, suspicion and memory. Do not equate detection with omniscience or let NPCs see through walls.
- Map/3D developer preview: selectable NPC, directional sight cone, hearing radius and occluded regions where supported; display test event and detected/not detected state. Debug overlay is developer-only and off by default; use existing units conversion, collision geometry and movement state. No per-frame raycasts for entire crowds; stagger and bound active sensing. Test Dax, quiet versus sprinting player, blocked sight, distance limits and separate multiplayer event scope.

- Awareness/device extension: expose the NPC's assigned device (V1, V2 where available, V3 // Shadow or none), using its existing canonical equipment assignment. Separate normal vision from active device-assisted range and field of view; Shadow is integrated in the eye for equipped elite NPCs, no forearm hologram. Preview both sensing modes. Optional night vision and thermal modes as independently configurable future capabilities, with light/heat and obstruction rules; never treat thermal as unconditional through-wall vision. Preserve existing player Shadow zoom and device behavior. Thermal/night vision are exploratory features, not yet implemented.

## Consumables and physical shop (owner request)
- Add Dev Tools Consumables tab: reusable effects library (trails, blur, color shift, other optional visual effects, sprint speed and stamina modifiers), layered per item with independent onset, intensity, duration and fade; preview and reduced-motion/visual accessibility settings. Food/drink and fictional stimulants use the same system; preserve existing item identities, inventory and gameplay.
- Assign each item to one or more NPC vendors or shops, price and availability; use existing authoritative purchase/inventory rules, validate effects, enforce expiry and bounded stacking, no duplicate purchases or credits. No real-world substance recipes.
- Audit existing physical District shop interaction; provide clearly marked SHOP HERE terminal in the store connected to the existing catalog/transaction flow, without requiring Admin or Iris to stop mission or social dialogue. Test terminal, missions and multiplayer inventory. Add after the existing approved work order.

- Vending machines: stationary interactable vendor entities selectable in Dev Tools, with unique IDs, map placement, facing, model, interaction radius, prompt, catalog, prices and availability. Reuse the same shop transaction and consumable catalog as NPC vendors; no NPC walking, speech, awareness or AI required. Existing vending machines and their functions remain intact. Support draft preview and individual publishing; validate placement/access and purchases.

### Consumable editor suggested starting presets
- New effects start with editable suggested values only; nothing is automatically attached to existing items or published. Explicitly add effects to an item. Independent timing, intensity, fades and stacking controls; default repeated consumption refreshes rather than multiplies gameplay bonuses. Enforce server-side gameplay modifier caps and test balance.
- Sprint speed +20% for 90s; stamina drain +15% for 90s as optional separate drawback. Stamina recovery +15% for 60s; melee damage +10% for 45s; incoming damage -10% for 45s; footstep volume -20% for 60s. Optional delayed fatigue: stamina recovery -10% for 30s.
- Visual trails, color shift, blur and fractals: start at 20% intensity for 60s, 3s fade-in and 10s fade-out. Audio echo starts at 15% wet mix for 60s; imported ambient sounds default to 15% volume. All editable, with safe reduced-motion/visual intensity and audio controls. Preview moving subjects and camera using gameplay shaders and audio processing.

- Item appearance import UI: display recommended format and dimensions directly beside each upload control before file selection (inventory icon: 512 × 512 px PNG, transparent background, centered item; accept other suitable sizes with aspect-preserving thumbnail processing and nonblocking recommendations). Show preview and actual imported dimensions; GLB model upload should list supported format and recommended asset budget separately. Keep custom icons optional with automatic model thumbnail generation.

- NPC Editor list filters (owner request): provide combinable Location and Tier (All, 1, 2, 3, unassigned) filters beside name search, based on registered areas and canonical NPC assignments. Distinguish assigned/home area from current runtime area when available; include all accessible districts/interiors, imported companions, and named NPCs. Preserve existing selections and editing workflows, show results count and clear filters; filters must not change NPC data or actual world visibility. Include in the first editor implementation checkpoint.

- NPC left sidebar: collapsible location/tier filter groups, remember selected filters between visits, and avoid expanding a long unfiltered NPC list by default.

- Owner clarification: audit every existing vending machine in all accessible game areas, including decorative/static models, and make each usable via the shared shop interaction. Give each a stable ID, editable catalog, price/stock and prompt; use sensible configurable starter stock matching the machine appearance, preserve existing working interactions, verify accessibility and purchases across areas. All newly placed vending machines should be interactable by default. Do not duplicate existing machines or require manual conversion of every existing prop by the owner.

- District physical shop kiosk placement: three self-service kiosks total: one immediately to the left of the store entrance as the player enters; two along the far wall beside the survival gear, toward Iris's side of the store but against the far wall. Confirm placement against actual scene geometry, preserve door clearance, walking paths and mission interactions. Clearly illuminated SHOP HERE signage, E interaction, shared existing store inventory and authoritative transactions, independent kiosk IDs and editable placement; use restrained wall-aligned cyberpunk design consistent with the store. Verify all three in gameplay before release.

- Unified in-game Items/Shop editor: filter the existing and custom item catalog by registered sale location, vendor type (NPC, kiosk, vending machine), individual vendor/machine, category (weapons, ammunition, missiles, survival gear, consumables, etc.), and name. Provide both item-to-vendor assignment and vendor-to-item catalog editing, with per-vendor prices/stock where supported, and show unassigned items. Preserve existing canonical items, shared store kiosks and authoritative purchase/unlock rules; no live catalog changes until explicitly published.

- NPC vendor role: allow any selectable NPC to opt into a vendor role through NPC Editor or Items & Vendors Editor, without replacing their tier, personality, schedule, dialogue or mission roles. Configure catalog, prices, availability, optional opening hours and shop dialogue/interaction choice; support disabling vendor role and mobile vendors based on current location. Preserve mission priority and existing purchase eligibility checks. Draft/publish and test with imported companions and named mission NPCs.

- Purchasable NPC services: add a non-inventory service item type to the Items & Vendors editor, linked to the selling NPC and a reusable authored action sequence (dialogue, compatible animations, movement/follow, timed activity, completion and return). Configure title, description, price, availability, duration and cancellation/refund policy. Validate NPC availability and purchase server-side, reserve service per player, preserve mission priority and prevent duplicate charges; test completion, refusal and disconnect. Examples: guided tour, performance, training session.
