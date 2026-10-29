# Stage 3B — secure private drafts and isolated previews

Review date: 2026-10-29. Feature branch: `codex/mission-admin-stage3b`. PR base: `codex/admin-foundation-integration`. No production settings, rules, IAM, billing, account privileges or services were changed. No content is activated by saving a draft.

## Integration status and scope

At start, #112, #113 and #114 remained unmerged. The integration base contains the exact #114 head `a2c373d` and #112 head `4ffe963`, merged locally without conflicts. Inventory fingerprints were regenerated at integration commit `5a3e8e5`. These commits are not cherry-picked or rewritten. The Stage 3B PR compares against this integration base, so prior PR changes do not appear again in its feature diff. #113 is unrelated navigation and remains separate. All three original PR heads are unchanged.

Once those foundations are approved and land on main, retarget the feature PR to main, regenerate provenance if necessary, and rerun combined tests. Do not merge the integration base as a shortcut around individual review.

The later deployment brief authorizes deployment only after combined compatibility and production prerequisites pass. This report establishes implementation readiness for review, **not permission to enable unverified private infrastructure**. Stage 3C publishing and Stage 4 remain separate later phases.

## What is implemented

- Mission draft editing for all 30 existing mission/contract projections: title, description, enabled/availability, stable objectives, prerequisites, rewards and typed availability conditions. Duplication creates a separate `draft-` identity without renaming existing missions.
- Registered-character dialogue proposals through existing structured scene and companion-line adapters, plus new draft scenes for supported characters. Node text, player choices, transitions, conditions, cooldowns and typed planned effects can be edited. Existing character/voice assignments are locked; new nodes select only registered supported characters. Additional expressions/animations are explicitly unsupported rather than invented.
- Searchable source atlas and private draft selector, mission/objective/reward property controls, dialogue/node controls, typed JSON fields for advanced conditions/effects, validation messages and isolated previews.
- Private Firestore head records plus immutable revision snapshots. Explicit optimistic revisions reject stale writes with HTTP 409; no automatic overwrite or silent conflict retry with a new revision.
- Cross-draft dependency validation uses one owner workspace graph index in the same transaction as the draft. Transaction retries serialize updates to the graph, preventing two separate drafts from introducing an unnoticed cycle concurrently.
- Read previous draft revisions without live rollback or publication. History reads do not activate content.
- Compatibility warnings for removed objective/cursor node IDs, disabling active missions and reward changes; source inventory changes require explicit review/rebase instead of silently saving against a different baseline.

## Explicit registries and adapters

The server is authoritative for the closed schema (`void_runner_drafts.schema`):

| Registry | Supported in 3B |
|---|---|
| Conditions | boolean story flag, existing mission completion, registered location |
| Objectives | instruction or typed condition |
| Planned actions | set boolean flag, registered-character relationship delta |
| Rewards | bounded nonnegative credits; bounded Communion/Natural Order reputation delta |
| Dialogue transitions | next node, player choice, terminal node |
| Expressions / animations | `none` only; unsupported references rejected |
| Voices | existing character identity only; no recasting or reserved voice provisioning |

Unknown fields, executable expressions/actions, malformed types, invalid IDs, oversized records, HTML tags, broken references, cycles and unreachable dialogue nodes are rejected. Existing IDs are immutable at draft identity level. Source/identity changes on a saved draft return 409; duplication is explicit. Existing character/voice assignments cannot be switched through a draft.

`mission-overlay` adapts existing registry/contract metadata into an unpublished draft projection. It does not replace runtime mission completion or availability wrappers. The preview adapter delegates supported flags/completion predicates to existing `VoidStory.matches`; it does not implement a new progression engine.

`structured-scene` covers `mara_workshop_intro`, preserving source IDs. `companion-line` covers the existing individual Seren/Kai/Nadia registry slots and cannot silently replace a companion or branch its single slot. `new-dialogue` creates a draft proposal without an activation route. Voice-manifest/legacy inline lines remain **read-only** with an explicit adapter-needed message; no regex rewriting of live JavaScript occurs. The 3A source/reference inventory remains available for finding those lines.

## Storage and authorization boundaries

All endpoints reuse the existing verified Firebase bearer identity with revocation checking and server UID allowlist. A single additional `VOID_CONTENT_EDITOR_UID` must match that verified allowlisted UID. No editor is provisioned here and no email/browser flag can grant access. The role response deliberately returns `publisher:false`; publisher authorization is not implemented or granted.

`VOID_CONTENT_DRAFTS_ENABLED` defaults off. Schema/template and pure validation access still require the configured editor; private persistence additionally requires that enable flag. Missing configuration denies access, rather than falling back to public storage.

- `/api/void-runner/developer/drafts/schema`: explicit registries and roles.
- `/template?kind=...&source=...`: source-backed draft projection; unsupported legacy sources return 422.
- `GET /drafts`: bounded workspace index, no unbounded query/listener.
- `GET /drafts/<id>[?revision=N]`: private head or immutable historical revision.
- `POST /drafts/<id>`: `{revision, document}`; atomically validate and create next version.
- `POST /drafts/validate`: validate without writing or executing game effects.

Private records live only in `vr_content_drafts/<sha256(uid)>_<id>` and `vr_content_workspaces/<sha256(uid)>`. Revisions use the `vr_content_revisions` subcollection. No draft document is written to GitHub Pages, inventory JSON, localStorage, IndexedDB, browser downloads or repository files. Test screenshots contain synthetic local proposals, not unpublished owner content.

A save transaction reads workspace and current head, then writes workspace, head and a create-only revision. Every returned record is owner checked. Maximums: 20 drafts, 100 revisions per draft, 96KB draft JSON, bounded nodes/objectives/choices and a 256KB HTTP body limit inherited from the API. No polling, listeners, delete, publish, live pointer, rollback or public draft retrieval exists. No access to player, order, entitlement or checkout collections is introduced.

## Preview and save compatibility

Preview operates on cloned in-memory fixtures. It calls no save API, reward executor, campaign completion, Story.apply or equipment grant. Mission output reports planned rewards and `executedActions:0`; dialogue choices advance only the preview view. Effects are displayed, not applied, so conditional paths after an effect require an explicit fixture flag. This is a bounded editor preview, not a playable mission simulator.

Live registries, story cursors, compatibility aliases, mission IDs, save manifests, approved text and voices are unchanged. Draft-only IDs are not added to player-save allowlists. Removal warnings must become publication compatibility gates in Stage 3C; a warning is never permission to activate a change.

## Infrastructure, security rules and cost findings

Verified in the repository: existing Firebase project configuration, Flask/Firebase Admin/Firestore integration, server UID authorization, closed game-collection rules, API CORS policy and no-store responses. Read-only production checks returned health HTTP 200 and unauthenticated account HTTP 401. These establish backend availability and an authentication boundary, **not deployed draft storage readiness**.

No Firebase/gcloud management CLI, service credentials or management connection is available in this workspace. The deployed Firestore ruleset, IAM privileges, current billing plan, quota usage, database region and owner UID assignment cannot be inspected here. No deployment or billing setting was changed. Private draft persistence must remain disabled until an authorized operator verifies those items.

The included `firestore.rules` is a merge fragment denying all browser reads/writes to draft/workspace collections and descendants. It was not deployed; a broad overlapping allow rule could override a deny, so the complete deployed ruleset must be reviewed. Firebase Admin bypasses client security rules and relies on IAM plus these server checks. See [Firebase rules documentation](https://firebase.google.com/docs/firestore/security/rules-conditions). Index-exemption recommendations are included for large draft payloads and workspace maps, not automatically applied to the project.

Expected incremental cost is an estimate: one normal save uses two document reads and three writes, plus possible transaction retries; list/head/history/validation each use at most one direct storage read. At 100 saves/day, that is roughly 200 reads and 300 writes before validation/UI reads/retries. No new database, cloud function, PITR, TTL or paid backup is requested. Manual saves and hard draft/revision/byte limits bound growth (roughly 192MB maximum revision payload before metadata/index overhead).

The Standard Firestore free allowance is shared with the existing app: one eligible database, 1GiB storage, 50,000 reads/day and 20,000 writes/day. Actual charges depend on existing usage, database eligibility and region; **zero cost is not certified**. Confirm these in the console before enabling persistence. [Official pricing](https://firebase.google.com/docs/firestore/pricing).

Production enablement prerequisites: verify existing default database/IAM, merge and test closed rules (including anonymous and ordinary authenticated direct-client denial), verify the owner's actual Firebase UID, review existing quota/billing/region, apply payload index exemptions as appropriate, then explicitly configure the existing allowlist plus single editor UID and draft enable flag. Do not enable billing or add administrators. Roll back by disabling the draft flag; immutable private drafts remain stored and live game content stays unchanged.

## Verification and limitations

- 422 Node tests passed on the integrated foundations, including preview isolation and no public/persistent browser draft storage checks.
- 112 API/save Python tests passed, including 14 new draft tests: missing/forged/outsider/disabled authorization, owner-only writes, immutable history, read/list, stale/concurrent conflicts, cross-draft cycle rejection, malformed payloads, unsupported actions, voice locks, source changes and cursor warnings.
- Browser integration used real local Flask handlers and a serialized atomic in-memory Firestore contract double. It passed editing, validation, saving, mission duplication, real HTTP 409 after a concurrent update, explicit reload, structured choices, preview campaign-storage isolation, mobile containment and sign-out clearing. No browser errors were captured.
- Tests use mocked Firebase token verification and transactional storage; they do not certify production OAuth, deployed rules/IAM or the real Firestore emulator. No remote data or credentials were used.
- Existing live-source inspection remains read-only. Inline conversations without adapters are explicitly not editable yet. New expression/animation references and item rewards are rejected, not promised. Stage 3C publication must integrate supported fields with the existing engine and block incompatible saves before activation.
- No publishing control, activation endpoint, rollback operation or additional publisher exists. Stage 4 will extend the same owner/role, private envelope, transaction and revision repository with store/item schemas, rather than creating another auth/publishing service.

Screenshots: [mission editor](mission-desktop.png), [dialogue editor](dialogue-desktop.png), [revision conflict](revision-conflict.png), [mobile editor](editor-mobile.png). Test artifacts are beside this report.

## Review conclusion

Stage 3B editing and private repository implementation is ready for review with the tested boundaries above. Production persistence is intentionally disabled pending infrastructure verification. The later storefront/model/integration work must keep that gate closed unless those checks are completed. No real draft or publishing feature has been activated for live players.
