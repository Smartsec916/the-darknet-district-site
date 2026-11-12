# The Darknet District — Active AI Roadmap

## Order of work as of 2026-11-12

Current state is the Start here section of [`AI_HANDOFF.md`](AI_HANDOFF.md). This file is only the sequence. Do not reopen finished November 11 items (ten pods, V1 device, vestibule checkpoint): they are on `main`.

1. Dolphins are on `main` ([#240](https://github.com/Smartsec916/the-darknet-district-site/pull/240)). Do not add crabs or a second dolphin pass.
2. **Let the four visual wins finish on their own branch.** [bc-8ae0a04a-9e48-58cf-9465-9f4d838cd39f](https://cursor.com/agents/bc-8ae0a04a-9e48-58cf-9465-9f4d838cd39f). Do not merge until David says so. Do not start reflections, shadows, new buildings, or WebXR in that branch. Leave the Sleeping Pod room and the music player alone.
3. **Wait for David's answers** in AI_HANDOFF.md "Open questions" before companion top-10 fixes, a noodle stand, a paid voice re-record, or the player part-assembler.
4. Later phases of the 10 Nov 2026 master specification, one at a time, each proposed before it is built. Phase 1 (vestibule) is done (`VESTIBULE_CHECKPOINT.md`).

**Updated:** 12 November 2026. October-era campaign milestones in `VOID_RUNNER_HANDOFF.md` are historical. Owner: David (`Smartsec916`).

## Milestone 0 — District-first entry (shipped)

PR **#212 merged on 11 Nov 2026** and later pull requests carried the runtime, pods, device, vestibule, arcade, and NULL. The checklist below is the original acceptance list. Items still unchecked are manual checks, not a reason to reopen #212.

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
- [x] PR #212 merged 11 Nov 2026. Later slices (runtime, pods, V1 device, vestibule, arcade, NULL) shipped on their own pull requests. Do not hold #212.
- [ ] Manual checks above are still open. New merges still need David's "push" / "pull it" and a look at the live site afterwards.

## Milestone 1 — District editor, interactions and world polish

- User-friendly editor panels for Locations, NPCs, Dialog, Missions; location-to-character selection, previews, published state, outfit compatibility, color options, animations/emotes, editable waypoint map/doors and movement/interaction presets.
- District interior: pods, VR Play room, store with Admin/Iris, meeting area. NULL nightclub is open (#238). Pod vending is flavour only. Street: NeoChinatown night haze, neon/rain, buildings and taxi.
- Vestibule checkpoint is in (#230). The V1 device is on L (#220); Camera, Gallery, messages, and friends are still placeholders. Editor panels are not built.
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
