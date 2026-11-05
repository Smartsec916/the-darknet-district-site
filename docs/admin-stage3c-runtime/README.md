# Stage 3C — registered-content publication and runtime adapters

## Status and branch strategy
Continues the Stage 3C foundation from superseding merged PR #138; old PR #120 is closed and was not reopened. Current main at inspection was 7f2e8b1. Work branches from integration/codex-start at 71e45fccada96a0fd76c848416eed47bf7f6e645, the recommended November 4 handoff base. Its existing District-first campaign, epoch/save retirement, separate environments, pod music and other stacked PR changes are dependencies, not reimplemented here. The new PR targets that integration branch so its diff contains only this continuation. No branch in the existing stack was modified, merged or closed.

This implements publication for an explicit v1 subset of registered content. The publication path, public serving and game adoption are all disabled by default. No production environment, publisher grant, Firestore rules, data reset, purchase, asset, approved voice or deployment was changed. Stage 4 remains queued.

## Supported native adapters
| Source | Publishable | Preserved / rejected |
|---|---|---|
| Existing mission registry | Title, description, existing objective labels, prerequisites and additional availability predicates; disabling new acquisition | Objective identity/order/type, completion callbacks, destination/interactions, rewards and existing acquired/completed progress stay source-owned. Closed mission pools stay closed. |
| Registered structured dialogue | Heading, text, choices, registered choice effects/conditions and transitions among existing nodes | Character/voice identities, node IDs, native terminal callbacks/labels/backgrounds and node effects are preserved. New nodes, cooldowns, source conditional-choice wrappers without an adapter and repeated effect keys are rejected. |
| Registered companion literal | Text in its exact existing dialogue slot | Model, animation, voice, identity, clothing, behaviour and the slot structure are preserved. |
| Contracts, new/duplicated identities, inline legacy dialogue | Drafts/inspection only | Publishing rejects unsupported adapters rather than ignoring edits. No second engine or save allowlist is introduced. |

Conditions compile to the existing story predicate engine (flags, mission completion and location). Mission acquisition uses the existing mission registry and adds gates there; an already-acquired record still progresses. Applying a snapshot itself never executes actions or rewards. Existing completed transactions are not replayed; reward changes remain blocked pending their native payment adapters. System-owned campaign, mission-pool, ship-access and VR isolation flags cannot be set by published choice effects. Companion text changes do not generate audio or reassign voices; changed voiced text still needs the existing audio-production review.

Only consumers of the registered structured scene graph receive graph updates. Custom prologue/cinematic and other JavaScript wrappers remain authoritative; this does not silently turn every legacy conversation into editable runtime content.

## Publication and rollback protocol
1. Save a private draft and prepare an immutable candidate using the existing Stage 3B/3C foundation. Neither action makes anything public.
2. Compile a selected candidate on the server. Recheck schema, dependencies, source fingerprint, compatibility and native-adapter limits; return a typed snapshot plus SHA-256 digest without writes.
3. Review the compiled snapshot, enter an audit reason and acknowledge review. Publish sends the selected immutable candidate revision, reviewed digest and expected current public generation.
4. In a Firestore transaction, recompile and recheck the digest and generation, create immutable public version/private audit records, then update the active public pointer and bounded history together. Concurrent publications have one winner; stale requests return HTTP 409.
5. Rollback selects an immutable published generation or repository baseline (generation zero), verifies source/digest/audit ownership, and creates a new audited generation. Previous versions remain unchanged.

The public endpoint is /api/void-runner/content. It returns an explicit projection: schema version, source revision, generation, digest and compiled runtime fields. It never returns draft envelopes, unpublished candidates, sourceKey, actor identity, audit reasons or draft history. All editor/history/compile/publish/rollback endpoints remain server-authorized.

The game checks a snapshot only at startup. One selected version is pinned for that page lifetime; no live poll or mid-dialogue swap occurs. A single bounded localStorage slot holds only already-published content for offline fallback, with Unicode-safe digest and source-build checks. Invalid/mismatched content falls back to repository data before any registry mutation; an explicit server disable clears that published cache. Campaign saves and private drafts are not stored in that cache.

## Gates and security boundaries
- Existing verified Firebase identity/revocation checks, UID administrator allowlist and sole editor remain authoritative.
- Existing private-draft and release preparation flags must pass, and the explicitly configured publisher UID must match that same editor. No new administrators or grants are provisioned.
- Live writes additionally require VOID_CONTENT_PUBLISHING_ENABLED=true.
- Anonymous public serving requires VOID_CONTENT_SERVING_ENABLED=true; when off, it performs no Firestore read.
- The client independently requires the void-published-content meta setting to be enabled in both game entry copies. It is disabled in this PR. The generated published-baseline.js contains only the source fingerprint; source generation never enables the feature.
- Every snapshot is tied to the combined game and publication-compiler fingerprint. The generated fingerprint file is excluded from its own input to avoid a cycle. Existing drafts need explicit rebase after source changes; there is no silent migration.
- No executable expression, dynamic import, arbitrary property path, stored HTML or callback from an editor is supported. The client validates the full payload before mutating a registry and rejects lifecycle effects independently of the server.

New storage collections: vr_runtime_content (active pointer/private index), vr_runtime_versions (immutable public projections) and vr_runtime_audit (private audit). The rules fragment denies all direct browser access, including to published records; the public API deliberately selects only released fields. Rules are not deployed, and full deployed rules/IAM must still be checked for overlapping grants before activation. Real Firestore/IAM/owner configuration has not been certified in this workspace.

## Performance, limits and operating cost
No runtime dependency, geometry, light, animation or per-frame loop is added. Disabled game adoption performs no fetch/cache access. Enabled startup makes one bounded request (four-second client timeout), then uses a published cache or baseline on failure. Public reads use a single five-second cache per backend worker with a lock, bounded SDK timeout and immediate invalidation in the publishing worker. Other workers may serve the preceding complete generation for up to five seconds; a running game stays pinned until its next load.

Publication uses approximately two reads (history/candidate) and four writes (version, audit, pointer, history); rollback adds target/audit reads. It never accesses player collections. The existing 256KiB compiled package/20-content limit applies; publication history is capped at 100 operations pending reviewed retention. No automatic deletion or paid service is introduced. Shared project billing/quota, IAM and production worker counts remain operator verification items; this report does not certify zero cost. Disable public serving to return clients to baseline if publication is unavailable. See the activation/rollback runbook below.

## Verification
- Baseline integration branch: 590 Node tests passed, one skipped.
- Current Node suite: 602 passed, one skipped (603 total), including twelve new runtime-adapter/cache/save-isolation tests.
- Publication Python suites: 28 passed, covering authentication/authorization, disabled zero-read behaviour, private/public separation, review digest, stale/concurrent publication, immutable rollback, baseline rollback, corrupt/missing versions, native callbacks, source compatibility, protected flags, bounded caching and unsupported effects/adapters.
- Full local Python suite: 179 tests; 178 pass and one untouched reset-backup permission assertion fails on Windows (POSIX 0600 versus Windows 0666). The security assertion is retained for Linux CI. Six Blackout API tests pass.
- Corrected one pre-existing Spectre security-test save fixture to carry the integration build's current campaign epoch. Its original premium-inventory forgery assertions remain. No production save validator/reset policy was weakened.
- End-to-end browser uses real local Flask handlers, fake verified identity and atomic in-memory Firestore storage. It exercises draft/candidate privacy, compile/acknowledge/publish, the actual game bootstrap adopting Unicode content, closed missions/no reward execution, page pinning, baseline rollback on reload, campaign-storage isolation, mobile containment and sign-out clearing. The late-module regression also verifies that a panel recovers an inventory event that fired before it loaded. No page errors. Service workers are blocked in this focused test so its temporary enabled HTML cannot be replaced by the intentionally disabled repository page; separate Babylon CI retains the game regression checks.
- The new Linux Content publication integration CI job reruns that HTTP/browser path with Chromium and uploads screenshots. Node, full Python, Babylon stabilization and Pages build are also required. No real owner login, real Firestore transaction or physical ROG Ally/GPU performance claim is made.

Screenshots: publication-desktop.png and publication-mobile.png. Test data is synthetic and contains no real owner's drafts. Original untracked audit files were preserved.

## Remaining before production enablement
Review this PR and its supported-field limits separately. Verify real Firebase rules/IAM, existing quota/billing and the actual editor/publisher UID; confirm matching backend/client builds; run real owner login/save and handheld checks. Do not enable flags or merge/deploy this work under the earlier website authorization. Future new mission/scene/node IDs, objective logic, reward changes, legacy dialogue adapters and audio production remain explicit follow-up work, not silently supported by this v1 path.