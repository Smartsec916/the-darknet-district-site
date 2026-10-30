# Stage 3C — release preparation foundation (in progress)

## Delivery boundary
This is the first Stage 3C increment, not completed live publishing. It builds private immutable release candidates, comparison, audit history and atomic candidate rollback on the existing Stage 3B repository. Nothing consumes these packages in gameplay. No candidate operation publishes a mission, changes approved dialogue, grants rewards or alters player saves. The UI explicitly identifies this boundary.

## Implementation
- Server-private release schema/history/record/compare/plan/prepare/rollback routes under /api/void-runner/developer/releases. No public release endpoint exists.
- Verified Firebase identity and the existing administrator UID allowlist remain authoritative. Reads require the configured Stage 3B owner. Writes additionally require an explicitly configured VOID_CONTENT_PUBLISHER_UID matching that same editor and allowlist; no fallback publisher or additional administrator is provisioned.
- VOID_CONTENT_RELEASES_ENABLED defaults off, and existing private-draft infrastructure must also be enabled. No production environment value, security rule, IAM grant or billing service was changed.
- A Firestore transaction reads the candidate pointer, prior package and selected saved draft heads; checks expected release and draft revisions; revalidates the complete package/dependency graph/source fingerprint; then creates one immutable package with audit record and updates its private candidate pointer. Concurrent edits fail with HTTP 409 rather than overwrite.
- Plan/compare return typed JSON differences and perform zero writes. The browser uses textContent and DOM controls, not executable patches, HTML or stored expressions.
- Rollback creates a new audited candidate revision; prior packages are unchanged. The target is revalidated against the current source inventory, so a stale package cannot bypass source/save checks.
- Packages are limited to 20 content documents, 256KiB and 100 immutable revisions per owner. History is bounded and requires no unbounded query or listener. Server collections: vr_content_releases and vr_content_release_workspaces.
- Existing mission identities, objectives/cursors, voice identities, aliases and save manifests are preserved. Save-compatibility warnings become hard preparation gates. New/duplicated content identities require a native mission/save adapter and are refused. Existing dialogue nodes/characters/voices cannot be removed or recast. Schema/graph validation rejects unsupported effects and cycles.

## Remaining Stage 3C work
Live publication is intentionally incomplete and must not be inferred from candidate preparation. Remaining work includes native runtime adapters for each supported field, atomic public-version selection, runtime snapshot pinning/refresh boundaries, fail-closed fallback, completed-reward semantics, live rollback preserving every previously published cursor, approved publishing controls and deployment verification. Existing wrappers must remain authoritative; no second mission engine will be created. Changing source text does not regenerate approved voice recordings automatically. Legacy inline dialogue still requires explicit adapters.

Before activation, review the adapter field matrix and source/save migration policy, the production Firestore rules/IAM/UID/billing configuration, and a separately approved publisher grant. There is no paid infrastructure proposal. Stage 4 can reuse the owner, private revision, package and audit infrastructure, but no store/economy editor is included.

## Security and costs
The proposed rules fragment denies all browser reads/writes to the two new private collections. It is not deployed; the complete deployed ruleset must be checked for overlapping broad grants. Admin SDK access still requires server authorization and IAM. No draft/package payload is checked into public files or persisted in browser storage; screenshots use local synthetic fixtures.

A preparation with N selected drafts uses approximately N+2 document reads (state, prior package, draft heads) and two writes; first preparation omits the prior-package read. Retries add reads. A rollback uses up to three reads/two writes. Maximum package payload history is about 25MiB before overhead and indexes. This shares the existing project's quotas; actual billing/rules/IAM remain unverified and production storage remains disabled. Large package fields need index exemptions before enablement.

## Verification
434 Node tests pass. 124 Python API/save tests plus six Blackout tests pass, including twelve release tests covering unauthorized/disabled access, separate publisher privilege, zero-write plans, immutable history, comparisons, concurrent pointer conflicts, changed drafts, rollback/source validation, package limits, malformed payloads and save-compatibility rejection.

Local real-Flask browser tests with fake verified identity and atomic in-memory Firestore contract storage pass candidate plan, r1/r2 preparation, cross-version comparison, r3 rollback, unchanged original revision, campaign-storage isolation, mobile containment and sign-out clearing. Existing Stage 3B browser editing/conflict/preview regressions also pass. Desktop and mobile screenshots are included. These tests do not certify deployed Firebase rules, real Firestore transactions or production publisher configuration.

## Branch dependencies
Based on codex/admin-publication-integration, which merges unchanged Stage 3B with deployed main 60b459b. PRs #114 and #115 remain unmerged. No changes were added to their branches. Inventory fingerprints and generated navigation match current sources. This draft PR must not be merged or deployed under the earlier website deployment approval.