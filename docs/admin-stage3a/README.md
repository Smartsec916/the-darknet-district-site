# Stage 3A — mission and dialogue administration foundation

Date: 2026-10-29. Branch: `codex/mission-admin-stage3a`. Base: `main` at `8e82200498bd5115baa2e985c1ea1b6827c86d97`. Read-only implementation for review, not deployed. No changes to gameplay, mission rules, dialogue wording, voice identities, player saves, payments or entitlements.

## Stage 1 gate and branch separation

Before beginning this phase, PR #112's Linux code revision `fe33479` passed all jobs in [run 40877419184](https://github.com/Smartsec916/the-darknet-district-site/actions/runs/40877419184). Its subsequent documentation/evidence commit `4ffe963` also passed all jobs in [run 40878558971](https://github.com/Smartsec916/the-darknet-district-site/actions/runs/40878558971), including the Babylon smoke test. The root cause and before/after artifacts are in that PR's stabilization report. The sampler had discarded every active frame over 500ms on software Chromium; warmup also used capped simulation time. Both are fixed, with stronger nonzero-measurement/paused-animation coverage. Stage 1 remains draft, unmerged.

This phase is independently branched from main. It does not contain Stage 1 or Stage 2 commits. PR #113 remains unchanged at `fff1895a1881bd2f1cae7ef81a931103eb2611bb`. There is no overlapping implementation file with either PR. **Integration task:** the generated inventory fingerprints game sources; once #112 is merged, regenerate the inventory on the combined branch and rerun tests. This detects provenance drift without importing stabilization changes into this PR.

## Existing architecture inspected

- Hosting: GitHub Pages serves root static HTML/CSS/JS; Python Flask on Render serves APIs. No frontend build step or new runtime service is needed. The admin shell is `admin/void-runner.html`; it calls the same Render API origin as `void-runner/network.js` on the production hostname.
- Authentication: `firebase-auth.js` uses the existing Firebase project and Google provider. `void_runner_api.signed_in` verifies Firebase token signature/audience/expiry through Firebase Admin and explicitly checks revocation. `balance_admin` checks the **server environment UID allowlist** `VOID_ADMIN_UIDS`. The new read endpoint reuses both. An email, browser `admin` claim, local save or UI flag never grants permission.
- Backend: existing Flask Blueprint `/api/void-runner`, existing CORS site allowlist, existing account enablement switch and existing `no-store` policy. No new Firebase project, database, credentials, billing account or paid service.
- Missions: `mission-log.js` provides 18 existing mission/tutorial definitions and its runtime `sync`, `available`, `metadata` and guidance logic. `content.js` provides 12 campaign contracts, including their `requires` chain. These remain authoritative; this phase creates a **projection**, not a second mission engine.
- Dialogue: one structured scene is exported by `story-content.js`; many conversations and conditional lines live in `scenes.js`, `prologue-integration.js`, faction/homeworld scenes and other runtime wrappers. The existing voice manifest indexes fixed recorded literals; `vr-companions.js` contains current Seren/Kai/Nadia dialogue and behaviour data. Dynamic dialogue cannot honestly be presented as a complete structured graph yet.
- Saves: `void_runner_api.clean_save` validates against `void-runner/save-manifest.json`, mission/contract allowlists and bounded progression/story fields. Local campaign restoration and story cursors rely on existing stable IDs. This phase changes no IDs or save schema, does not load a player save in the atlas, and exposes no save mutation method.

## Implemented interface

A dark cyan/magenta, responsive administration shell provides:

- Mission list, search, source inspector and visual **declared prerequisite** graph.
- Character selector covering 23 registered characters, including Iris, Admin, Mara, Rook, Elara, Marcus, Seren, Kai and Nadia.
- 465 indexed dialogue lines, voice/profile/status references, structured node data and searchable current source references.
- A branching preview of `mara_workshop_intro`; advancing choices updates only the preview, and end actions are displayed as **not executed**.
- Source fingerprints, inventory revision, coverage notes and structural validation findings. Current references have no missing declared prerequisites, cycles or missing structured dialogue targets.
- Signed-out and denied states; token refresh before access; clearing data on sign-out/auth changes and rejecting stale in-flight results.

The mission graph does not invent links from display order, infer all runtime availability, or pretend the inline conversations are fully extracted. Conditional fields, rewards and effects appear as read-only data in the inspector. No controls imply that drafts or publishing are already functional.

[Mission and character inventory](inventory.md) lists existing IDs, sources, counts and voice status.

## Read-only data contract and workflow

`tools/admin-inventory.cjs` imports existing trusted pure registries and reads existing voice/source data at maintenance time. It never executes submitted admin code. `void_runner_admin_inventory.json` is a deterministic versioned projection with:

- `schemaVersion:1`, `readOnly:true`, source-content revision;
- missions with namespaced **UI keys** (`registry:` / `campaign:`), untouched game IDs, engine/source, objectives, conditions, rewards and declared dependencies;
- characters, voice references, structured scenes, line records and source references;
- graph edges, validation warnings, explicit coverage limits, source hashes and current save-manifest reference.

The UI keys disambiguate engine origins; they are not new game mission IDs. Refresh with `node tools/admin-inventory.cjs`. `--check` and the Node suite detect stale projections. Every source hash uses the current repository file bytes; no timestamp-only freshness claim is made.

`GET /api/void-runner/developer/content` requires verified sign-in and an allowlisted UID. It reads only the fixed repository inventory file, checks its schema, returns JSON and performs **zero database calls**. POST/PUT/PATCH/DELETE have no route. No request-supplied path, evaluation, SQL, shell, mission action or reward calculation exists. Existing API limits and cache policy remain in force.

## Security boundaries and limits

- Server authorization is the boundary; the static page being hidden or unlinked is not a permission mechanism.
- All inventory records are rendered with text nodes, not HTML interpolation. A browser test injects an HTML event-handler payload and verifies it stays inert. The shell also restricts scripts with a Content Security Policy; inline styles support graph positioning, not script execution.
- Tokens stay in memory for requests; no custom token persistence is introduced. No account identifiers, secrets or credentials are bundled into the editor.
- CORS remains the existing production site-origin list; CORS is not treated as authorization. Browser fetches omit cookies and request noncached responses.
- The repository, game scripts and generated projection contain public game content. **This is not a confidentiality guarantee for unpublished narrative.** The protected API gates administrative access; private future drafts must be stored behind server authorization and must never be emitted into GitHub Pages or public artifacts.
- This phase does not add draft storage, audit writes, publishing, rollback endpoints or a new role service. Those are deferred, not silently implemented.
- Production Google/Firebase sign-in and actual owner provisioning were not exercised against live accounts. Backend tests use the real Flask route with a mocked Firebase verifier and explicitly test its revocation argument. Browser screenshots use a mocked authorized API response and authentication module. No claim of a deployed administrator session is made.
- Before deployment, confirm the owner's actual Firebase **UID** is in the existing server allowlist. The supplied email alone is insufficient; no hardcoded email bypass is added. If accounts are disabled, this endpoint fails closed with 503.

## Validation

- **409 Node tests passed** (404 existing + five projection/graph/voice/UI boundary regressions).
- **98 API/save Python tests passed**, including six new authorization/read-only tests; **six Blackout API tests** also passed.
- Auth tests: missing, forged and revoked tokens → 401; verified user not on server UID list → 403; allowlisted verified UID → 200 with `no-store`; disabled infrastructure/bad artifact schema → 503; mutating methods → 405; no database calls.
- Browser: signed-out and denied states, authorized mission inspector/search, character filtering, structured branching preview, HTML injection resistance, sign-out cleanup, GET-only inventory requests, companion lines and mobile no-overflow checks passed with no page errors.
- JavaScript syntax, Python compilation, projection drift and Git whitespace checks passed. Hosted CI results are linked in the draft PR; tests do not certify live OAuth, Firestore permissions or production deployment.

Screenshots: [mission desktop](missions-desktop.png), [dialogue desktop](dialogue-desktop.png), [structured graph](dialogue-graph-desktop.png), [mission mobile](missions-mobile.png), [dialogue mobile](dialogue-mobile.png), [signed out](signed-out.png). Raw browser and test logs are alongside this report.

## Decisions required before Stage 3B / publishing

The read-only foundation introduces no paid infrastructure. The following remain proposals requiring approval before implementation:

1. **Draft source and publishing model.** Recommended: server-private, schema-validated Firestore draft/revision records using the existing Firebase backend, with one atomic published-revision pointer and a bundled fallback consumed by the existing mission/dialogue registries. Alternative: Git-reviewed source publishing, which keeps deployment as the publication boundary but is less immediate. Neither is built here. Confirm costs/limits before enabling writes.
2. **Roles.** Reuse the existing owner UID allowlist initially; approve separate editor/publisher permissions before granting anyone else draft or publication rights. Do not infer roles from email.
3. **Supported data registry.** Before editing, inventory and explicitly allowlist each supported condition, trigger, reward/effect, animation and voice reference. Inline legacy conversations need deliberate adapters into existing runtime systems. Do not permit executable user expressions or replace the mission engine.
4. **Compatibility gate.** Approve rules for disabling active missions, removing referenced nodes, changing rewards/IDs and preserving story cursors. Require reference/cycle/unreachable-path/item/reward validation and a representative saved-campaign corpus before publish.

## Preserved later-phase scope

Stage 3B remains secure editing, drafts and sandbox previews: create/duplicate/disable/search missions, objectives, prerequisites, failure/completion conditions, rewards, availability, faction effects; all registered-character dialogue, greetings, ambient/mission/companion/faction branches, responses, cooldowns, voice/animation/expression references. No approved wording or voice changes without explicit creative approval.

Stage 3C remains validate/publish/history/diff/rollback: atomic publication, server-side authorization, input/XSS validation, audit history, compatibility checks and recovery. Stage 3D expands conditional branching and contextual/faction reactions without rewriting the mission engine. The full originally approved Stage 3 requirements remain the target; this read-only milestone does not narrow them.

Stage 4 remains queued and must reuse that same authorization, draft, revision and publication infrastructure for existing stores, item IDs, direct prices/stock and mission dependency checks. No store editor or dynamic economy is implemented now.

No PR has been merged or deployed. Review this foundation and the proposed write/publication architecture before beginning Stage 3B.
