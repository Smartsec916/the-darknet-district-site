# The Darknet District — Active AI Roadmap

**Updated:** November 10, 2026. Source of truth for the **current development sequence**; October-era campaign milestones in `VOID_RUNNER_HANDOFF.md` are historical. Owner: David (`Smartsec916`).

## Milestone 0 — Release readiness for District-first entry (NOW; draft PR #212)

**Implementation staged and current CI green** (Node, Python and Babylon smoke; see `AI_HANDOFF.md`). **Not merged/published.**

- [x] Stage gated desktop/phone entry and coherent District integration in a draft branch.
- [x] Stage hairstyle asset GLBs with matching character fit metadata and browser catalog.
- [x] Sync root/static game entrypoints; restore guest/share security scripts.
- [x] Remove retired Void Runner Arcade listing without reverting current homepage.
- [x] Reconcile tests after November new-campaign mission reset and regenerate admin registry projection.
- [x] Pass latest GitHub CI Node, Python and Babylon stabilization smoke.
- [ ] Manually verify creator renders, available appearance controls apply, save/restoration works, and character picker precedes pod exit.
- [ ] Verify **every login/reconnect** returns to the player's own pod; pod reentry, private music, doors/vestibule, and street/interior loads.
- [ ] Test mobile gate (no game asset download), desktop and ROG Ally.
- [ ] Test guest login, account identity and saved progress against appropriate nonproduction services; verify Firebase/Render permissions.
- [ ] Audit SW cache BUILD, licensed assets and production dependencies; review diff against latest main.
- [ ] Decide safe partial release(s), if any, versus holding PR #212 for complete acceptance.
- [ ] Merge/deploy **only** reviewed and authorized production-ready code; verify live website behavior afterwards.

## Milestone 1 — District editor, interactions and world polish

- User-friendly editor panels for Locations, NPCs, Dialog, Missions; location-to-character selection, previews, published state, outfit compatibility, color options, animations/emotes, editable waypoint map/doors and movement/interaction presets.
- District interior: pods, VR Play room, store with Admin/Iris, meeting area, future nightclub/vending; retain top nav and visual theme. Street: NeoChinatown night haze, neon/rain, buildings and taxi.
- Resolve invisible collisions at double doors/vestibule; improve prompts and UI; replace old L-key messaging with resizable holographic device/phone.
- Import supplied 3D assets safely and one at a time when required; maintain licensing/provenance and test performance.

## Milestone 2 — Multiplayer and social service (not automatically authorized for production)

- Automatic instance/server joining; Firebase-authenticated accounts and restricted guest behavior.
- Remote player model sync, handles/uniqueness, text chat, optional external voice, emotes, trading and basic moderation/security.
- Only enable after testing server authorization, cross-account isolation, no public share privilege and acceptable Render costs.
- Embedded device: Mission Log, social conversations/messages, news/feed, camera and future app marketplace with upgrade path. No fabricated live services.

## Milestone 3 — Missions and progression

- First missions entirely local to NeoChinatown/District; preserve NPCs but **do not reinstate legacy Mara/Vesper starting tutorial**.
- Ships become attainable by a **later approved mission**; scanner/scrambler, factions, bounty, radio and expanded planets remain later story features needing David's creative signoff.
- Keep story definitions distinct from active missions; zero new-campaign missions until approved.

## Cross-cutting safety / business

- User allows clearing **unfinished in-game shop inventory** when needed for a working early release. Preserve real storefront apps/merchandise, customer purchases/entitlements, Shopify integrations and music licensing.
- Keep `VOID_RUNNER_HANDOFF.md` for historical canon and `CLAUDE.md` / `AGENTS.md` for operational rules.
- No blanket merge of divergent old branches or outdated PRs. Always update `AI_HANDOFF.md`, run tests, bump game SW BUILD when relevant, and inspect deployment status rather than assuming success.
