# Retiring old VOID//RUNNER campaigns

Decision (David, 2026-11-04): David is the only player with saved progress and has authorised retiring it. The new Darknet District campaign is the only campaign. Nothing in production has been deleted or changed. The reset below is prepared, tested against fake data, and **waits for David's final approval**.

## What the code now does (no production data involved)
- Every new campaign carries `story.flags.campaignEpoch = 1` (`CAMPAIGN_EPOCH` in `void-runner/campaign.js`; the same number in `void_runner_api.py`). A campaign without it was made before the reset and is **retired**.
- **Browser:** a retired campaign is never loaded. At startup the game copies it to `void-runner-campaign-v1.retired` (never overwriting an earlier copy), frees the slot, and the main menu says the earlier campaign was retired. Continue is unavailable until the player starts the new campaign.
- **Cloud API:** `GET /api/void-runner/account` no longer returns a retired cloud save (it reports `retired: true`); `POST /api/void-runner/save` refuses one (409). The stored record is **not** touched by either.
- Old-format conversion code (version 1 saves, the `undertow` to `rusthaven` rename, story-less saves, the pre-lock ship normalisation) is removed, because those saves are retired before they could reach it.
- Kept, as asked: the archived missions (`docs/void-runner/mission-archive/2026-11-03/`), the mission engine and editor, every NPC and dialogue, the voice registry, ship systems (`ships.js`, `grantShip`), and the editor's drafts and releases.

## Exactly where old saves are stored

| Where | What | Key / path | Contains progress? |
|---|---|---|---|
| **The player's browser** | The campaign slot | `localStorage['void-runner-campaign-v1']` on the site's origin (one slot per browser, not per account; logging out does not erase it) | **Yes. This is the local save.** |
| Browser | Graphics, controls, audio, voices, companion looks, last VR party, nightclub flag | `void-runner-graphics-v1`, the input-bindings key, the ship-audio settings key, `void-runner-voices-v1`, companion-look and party keys, `void-nightclub` | No. Preferences. Left alone. |
| Browser | Sign-in session | Firebase Auth's own storage (IndexedDB) | No. Left alone. |
| Browser | Cached game files | Service-worker caches `void-runner-core-*`, `void-runner-assets-*` | No. Replaced automatically when the build changes. |
| **Firestore**, project `the-darknet-district-71873` | The cloud campaign | Collection **`vr_players`**, one document per account, document id = SHA-256 of the Firebase UID, fields **`save`**, **`savedAt`**, **`revision`**. Written only by `POST /api/void-runner/save`; browser access is denied by the rules (`void-runner/firestore.rules`). | **Yes. `save` and `savedAt` are the cloud save.** (`revision` is a counter used to detect two devices saving at once.) |

Nowhere else holds campaign progress. Cloud saving is manual (the account page's save and load buttons); nothing syncs in the background.

## What the reset would touch, and what it never touches

**Would change (only these):** in collection `vr_players`, for each document whose `save` is a pre-reset campaign (no campaign epoch): remove the fields `save` and `savedAt`, and raise `revision` by 1 so any other device refreshes. A document holding a **current** campaign is never touched. A document that changed after the report is skipped.

**Never touched:**
- Accounts and sign-in records (Firebase Authentication, a separate system the tool does not connect to).
- Public handles (`bp_handles`, `bp_profiles`, shared with Blackout Protocol).
- Purchases and equipment ownership: `vr_orders`, `vr_checkouts`, `vr_payment_blocks`. Ownership is derived from `vr_orders`, not from the save.
- Pending payments: the subcollection `vr_players/*/pending`.
- Admin privileges: they come from the `VOID_ADMIN_UIDS` environment variable on the server, not from any database record. (Iris admin uses its own list.)
- Editor and publishing data: `vr_content_workspaces`, `vr_content_drafts`, `vr_content_revisions`, `vr_content_release_workspaces`, `vr_content_releases`; balance settings `vr_config`.
- Iris chat history and memory (the separate Neon database), Blackout Protocol data, and anything else on the website.
- Any other field in a `vr_players` document (the tool reports such fields and leaves them).

So the reset can be limited to game progress, and the tool is written so it cannot do anything else (a test checks that it names only this collection and these two fields).

## The tool and the procedure
`tools/reset-void-runner-saves.py` (tested with fake data in `tests/test_reset_tool.py`). It needs Firebase Admin credentials in your own environment (`GOOGLE_APPLICATION_CREDENTIALS`); the repository holds none.

1. **Report (read-only; default).** `python tools/reset-void-runner-saves.py`. Prints, as JSON: documents in `vr_players`, how many have a save, how many are current, and the exact list of old campaigns that would be retired (document id, revision, saved date, and a one-line summary: quest, location, credits, deliveries). **I have not been able to run this against production (no credentials, by design), so the real counts are unknown until you or someone with access run it.** David expects one.
2. **Review.** Check the list. Anything unexpected stops here.
3. **Approval.** David's explicit go-ahead for that list.
4. **Apply.** `python tools/reset-void-runner-saves.py --apply --backup-file saves-backup.json`. It prints the report again, asks you to type `RETIRE OLD VOID RUNNER SAVES`, writes a complete owner-only backup of every field it will remove (refusing to overwrite an existing file), then retires each document in its own transaction, skipping any that changed since the report.
5. **Verify.** Run the report again: `oldCampaignsToRetire` should be 0. Sign in on the site: the account page shows no cloud save, and the game starts the new campaign.
6. **Rollback (if ever needed).** `python tools/reset-void-runner-saves.py --restore saves-backup.json --apply` puts the saves back, but never over a document that has a save now. The backup file is the only copy, so keep it private. A matching local copy of David's browser save is already kept under `void-runner-campaign-v1.retired` when the game first starts after the update.

## Order of rollout
1. Merge and deploy the code (this PR and the stack). Old saves are immediately unusable and invisible; nothing is deleted.
2. Run the report, get approval, then (optionally) run the reset. It is cleanup only: the game and API already ignore old saves, so there is no urgency and no gap if the reset is never run.

## Limits and unknowns
- The number and content of production records cannot be known from the repository.
- The Firestore backup lives only on the machine that ran the tool.
- A player on an old cached copy of the game could still try to save an old-format campaign; the API now refuses it (409) and the build change refreshes the cache.
