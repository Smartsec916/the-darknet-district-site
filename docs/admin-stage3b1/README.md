# Stage 3B.1: draft reliability, recovery and export

Date: 2026-11-01. Branch `claude/stage3b1-draft-reliability`, based on `main` at `c1f3d64`. Not deployed. Drafts stay disabled (`VOID_CONTENT_DRAFTS_ENABLED` unset), Stage 3C stays disabled, and no Firebase rules, indexes, Render settings or production data were changed.

## Defects fixed

| Defect (Stage 3B audit) | Fix |
|---|---|
| Any change to the 125 fingerprinted game sources made every draft unsaveable (409, "rebase") with no way forward | Reviewed **rebase** (below). Saves still refuse a stale draft, and a save can no longer move a draft to a new inventory by editing `baseRevision`; only a confirmed rebase can. |
| "Read revision" loaded an old revision's number, so saving it was a 409 | Historical revisions are only **viewed, compared or restored**; the editor always edits the head. Restore writes the old content as a new revision. |
| 20 drafts and 100 revisions per draft, with no archive, delete or export | **Archive / restore from archive**, **continue as a new draft** at the revision limit, and **export**. No permanent deletion. |

## Rebase

Every saved revision now keeps `source`: the inventory revision it was saved against and a snapshot of its own source mission or scene (`template()` output) with a SHA-256 hash. When the server's inventory changes, `POST /developer/drafts/<id>/rebase/plan` (zero writes) compares three versions per unit (each mission field; dialogue title, start, cooldown and each node by ID):

| Status | Meaning | Applied result |
|---|---|---|
| `current` | Already on the current inventory | Nothing to do |
| `unrelated` | This content's source is identical; only other game files changed (also all new `draft-` content) | Draft content kept |
| `relevant` | The source changed parts the draft did not edit | Source changes applied to untouched parts; draft edits kept |
| `conflict` | Source and draft changed the same part differently | **Refused** until the administrator chooses `draft` or `source` for each conflicting part, then reviews again |
| `manual` | Draft saved before snapshots existed (attribution impossible) | Every difference listed; draft kept unless the administrator takes the source per part |
| `invalid` | Source removed, or the result fails validation | **Refused**, nothing written |

`POST /developer/drafts/<id>/rebase` needs `confirm: true`, the current head revision and the `planDigest` from the reviewed plan. The plan is recomputed inside the transaction; any change since the review (draft, inventory or choices) is a 409 `plan-changed`. The rebase becomes a new revision; earlier revisions are untouched.

## Restore, compare and history

- The head record carries `history` (revision, action, time, inventory, plus restore/rebase/archive details, at most 300 events). Older heads without it get one synthesized from their revision count.
- `GET /developer/drafts/<id>/compare?from=N[&to=M]` compares two revisions by unit (zero writes).
- `POST /developer/drafts/<id>/restore` `{revision, fromRevision, confirm: true}` checks the head revision, copies revision N's content and source as a new revision (`restoredFrom: N`). Content from an older inventory is restored as it was and marked `validation.valid: false` with `code: rebase-required`; it must be rebased before it can be saved again or released.

## Archive and revision limit

- `POST /developer/drafts/<id>/archive` and `/unarchive` `{revision, confirm: true}` move the draft between the index's `heads` (active, limit 20) and `archived` (limit 40). Content, revisions and ownership are unchanged; the head gets `archived`, `archivedAt` and a history event.
- Archived drafts can be read, compared and exported, but not saved, rebased, restored or continued (409 `archived`), and release preparation refuses them.
- Restoring from the archive needs a free active slot and no other active draft for the same content.
- At the 100-revision limit a save is a 409 `revision-limit`. `POST /developer/drafts/<id>/continue` `{revision, newId, confirm: true}` archives the draft with its full history and starts `newId` at r1 with the same content (`continuedFrom`). Nothing is deleted.

## Export

`GET /developer/drafts/export[?history=heads]` (editor only, drafts enabled) returns JSON:

```
format: void-runner-draft-export   formatVersion: 1   draftSchemaVersion: 1
exportedAt, sourceInventoryRevision, owner (SHA-256 of the account id, never the id itself), includes
counts: {active, archived, revisions}
drafts: [{id, archived, head: {...record, history}, revisions: [every immutable revision]}]
integrity: {algorithm: sha256, canonicalization, digest}   (digest of everything except integrity)
```

It reads only the caller's `vr_content_*` documents and contains no credentials, API keys, account ids, emails or player data. The admin page downloads it as a file; nothing is uploaded anywhere. Check a file offline with `python tools/verify-draft-export.py <file>`. There is no import: a future import must be reviewed separately and should only ever create new drafts, never overwrite.

Reads per export: 1 + drafts + revisions (worst case 1 + 60 + 6,000; `?history=heads` reads 1 + drafts).

## Security

- Every new route uses the existing `@signed_in` (Firebase token verification with revocation check) and `editor()` (UID in `VOID_ADMIN_UIDS` and equal to `VOID_CONTENT_EDITOR_UID`; storage only with `VOID_CONTENT_DRAFTS_ENABLED=true`).
- All changes are Firestore transactions that read the index and head first, check ownership and the expected revision, and write the index, head and a create-only revision together.
- Request bodies are closed schemas; draft IDs are validated and `export` is reserved; the 256 KB body limit still applies.
- Draft operations are logged with action, draft id, revision and a 12-character owner-key prefix, never content.
- Rules: `firestore.rules` here is a merge fragment denying browsers all `vr_content_*` access (no new collections). `firestore.indexes.json` exempts the large map fields from indexing. Neither is deployed.

## Data migration

None. Older records keep working: missing `history`, `source`, `action`, `archived` and the workspace `archived` map are handled. Such drafts rebase in `manual` mode once; afterwards they carry snapshots.

## Tests

`tests/test_content_drafts_reliability.py` (20 tests) and `tests/content-drafts-recovery-browser.cjs` (run against `VOID_TEST_SEED_STALE_DRAFT=1 python tests/serve-admin-drafts.py`). In-memory Firestore double and mocked sign-in only.
