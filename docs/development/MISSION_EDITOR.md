# Mission Editor (Developer Tools > Mission Editor)

Built 17 Nov 2026 on branch `claude/mission-editor-1` (build `2026-11-17-mission-editor-1`). Not merged.

## For David, in plain words

Sign in with your account, open **DEVELOPER TOOLS**, then the **Mission Editor** tab (after Achievement Manager). The tab only appears for an account the server confirms as a developer. Seeing it is not permission: every save, publish and re-voice is checked again by the server.

- **Mission trees.** On the left: every mission tree in the game, grouped as ACTIVE (in today's District game), HISTORICAL (the older VOID//RUNNER missions a District campaign never reaches) and DRAFTS. Click a tree, then a mission.
- **For each tree:** the NPCs in it (who gives the mission, who speaks, who you deliver to) with their registered voice. Voices are shown, never changed here.
- **For each mission:** the name, the credits paid, the description, then each **step** ("what the player must do"), what each NPC says at that step, where the mission ends (and any branches), and **what becomes available** (store items and which store, ships, places that open, story flags, credits, the next mission). You can add your own unlock notes (only real items, ships, places, stores and factions can be picked).
- **All lines for an NPC:** every line a character says, Admin first: in missions (by tree, mission, step and scene) and outside missions (greetings, idle remarks, "come back later" lines, the District rules such as Admin's "Scanning in here is rude" line, VR companion talk, Milked's Eva and Fish).
- **Your own scripts are protected.** Lines from your design docs 05, 06, 07, 09, 10 and 12 show **"David's script — locked"**. Press **UNLOCK TO EDIT MY SCRIPT** on a line to change it yourself. Claude's placeholder lines say so.
- **Drafts.** Every edit is saved as you type, as a draft in this browser. Nobody else sees it. The beginner campaign uses the same draft as the Content Studio, so both tools show the same edits.
- **PLAY THIS DRAFT** (per mission, and per step: "PLAY THIS DRAFT FROM HERE"). Closes Developer Tools and starts a throwaway test game at that step with your draft applied. An orange banner says **PLAYING DRAFT: <mission> — not your real save · LEAVE DRAFT**. Nothing is saved, to this browser or the cloud. **LEAVE DRAFT** reloads the game with your real save exactly as it was and opens the Mission Editor on the same mission and step, draft intact ("last played" is shown).
- **PUBLISH TO ALL PLAYERS** (tab "Publish & versions"). A check screen first: problems that block publishing, what changes for players, warnings for players who are part-way through a mission, voice clips that no longer match, and the edits that cannot reach players yet. Publishing makes a new version; **UNDO** puts the previous version back (also as a new version), and the list shows every version with its time. **It is switched OFF on the server until you decide to switch it on** (see "Switching things on" below).
- **RE-VOICE.** A changed line that had a voice clip shows **"voice clip out of date: text only until re-voiced"**: the game shows it as text until it is recorded again. RE-VOICE (per line, per mission, per NPC) puts it in the re-voice queue. Kokoro characters are recorded on your PC (one command below). Admin's lines are queued for **ElevenLabs, Bill Adams** and stay **"waiting for ElevenLabs re-voice (needs approval)"**: nothing is generated until you approve the spend.

### What edits can do today, and what they cannot

| Edit | Draft | PLAY THIS DRAFT | Publish |
|---|---|---|---|
| Beginner campaign: names, descriptions, steps (label, order, what completes them), what is said at a step and the "too soon" line, credits, missions added or removed | yes | yes | yes |
| Older (historical) missions: name, description and step text in the V1 Mission Log | yes | yes | yes |
| Any NPC line shown in the conversation window (Admin, Iris, Rook, Mara, Elara, Marcus, Kess, Mercer, Milked's Eva and Fish, ...) | yes | yes | yes (text only until re-voiced) |
| Lines spoken another way (Admin's/Iris's scanning rule in `district-people.js`, VR companion talk, contract briefings) | yes | no | no: labelled **"can be edited after the next update (needs a code change)"**; kept in your draft and in **EXPORT MY EDITS** for Claude or Codex |
| "What becomes available" additions, reputation, ending notes, the Studio's choices, store items and "what is said" when handing a mission over | yes | no | no (listed on the check screen as "will NOT reach players"): the game has no adapter for them yet |
| Credits of historical missions | yes | no | no (their payment is set in campaign code) |
| Contracts (Rook's board, the chapters) | yes | no (flown contracts have no draft adapter) | no |
| Voices, voice assignments, Relay broadcasts, The Function | never | never | never |

### Switching things on (waiting for David; nothing was changed)

Everything new on the server is **inert until switched on**. On the Render API service (Environment):

| Setting | Value | What it switches on |
|---|---|---|
| `VOID_CONTENT_EDITOR_UID` | David's Firebase UID (it must also be in `VOID_ADMIN_UIDS`) | Who may publish, undo, use private server drafts and the re-voice queue. Already used by the Stage 3B drafts; check whether it is set. |
| `VOID_CONTENT_PUBLISH_ENABLED` | `true` | PUBLISH TO ALL PLAYERS, UNDO, the version list, and the public `GET /api/void-runner/live-content` that every game reads. Off: players keep the shipped missions. |
| `VOID_CONTENT_DRAFTS_ENABLED` | `true` | The re-voice queue (and the existing Stage 3B private server drafts). |

Firestore: the server writes three new collections with the Admin SDK only: `vr_live_content_state`, `vr_live_content_versions` (one create-only document per version) and `vr_revoice_queue`. Recommended rules fragment (not deployed; merge into the deployed ruleset and check for broad overlapping grants first):

```
match /vr_live_content_state/{doc} { allow read, write: if false; }
match /vr_live_content_versions/{doc} { allow read, write: if false; }
match /vr_revoice_queue/{doc} { allow read, write: if false; }
```

Cost: players' reads are cached for one minute per server instance (about two document reads a minute while anyone plays); a publish or undo is one transaction (one read, two writes).

### Re-voicing on your PC (one line)

In the Mission Editor, "All lines for an NPC", press **DOWNLOAD THE RE-VOICE QUEUE**, then from the repository folder, with the voice venv's Python:

```
python tools/audio/generate.py --models <your Kokoro folder> --from-queue --queue-file mission-editor-revoice-queue.json
```

Add `--dry-run` first to see what it would record. More than 100 clips needs `--yes`. It uses each character's registered approved voice through the normal generator, so every lock applies (approval fingerprints, protected clips, the reserved slot, broadcast voices refused). Clips go where clips always go (`void-runner/assets/audio/voice/`) and ship with the next push; the editor marks them done when it sees them. Alternatively, without a file: set `VOID_OWNER_ID_TOKEN` to your sign-in token for that one command (never stored) and leave out `--queue-file`. Admin's ElevenLabs lines are only listed.

## Trees found (game data, 17 Nov 2026)

| Tree | Status | Missions | Source |
|---|---|---|---|
| Beginner campaign: Sleeping Pod to first ship | ACTIVE (wording PROPOSED, not approved) | 6 | `beginner.js` |
| Vesper opening and Rook's first jobs | HISTORICAL | 9 | `mission-log.js` |
| Don't Ask Questions (Admin's sealed cargo) | HISTORICAL | 1 | `mission-log.js`, `campaign.js` |
| The Communion arc | HISTORICAL | 4 | `mission-log.js`, `campaign.js` |
| The Natural Order arc | HISTORICAL | 4 | `mission-log.js`, `campaign.js` |
| Rook's contract board (Meridian) | HISTORICAL | 3 | `campaign.js contracts` |
| Chapter: Ghost Belt / Corporate Lockdown / Beyond the Gate | HISTORICAL | 4 each | `content.js` |
| District drafts in the game data (Meet Eva at Milked, inactive) | DRAFT | 1 | `milked.js MISSION` |
| Your Studio draft's new missions; your private server drafts | DRAFT | when present | browser draft; Stage 3B |

Totals: 10 trees, 40 missions, 382 listed lines (296 from David's scripts). All 40 of Admin's Kokoro lines and his ElevenLabs line are listed (63 entries: the faction scenes appear under both arcs).

## For Claude and Codex

- `void-runner/mission-trees.js` (pure): extraction. Scene lines come from the `SCENES` anchor table (file, from/to text anchors, mission and slot, design doc); a test fails if an anchor disappears. Only plain quoted lines are extracted; a scene with code-built lines says "partial". `npcView` lists every speaker's lines from both voice manifests (Relay broadcasts excluded). `VOICE_ENGINES` must equal `tools/audio/revoice-engines.json` (tested).
- `void-runner/mission-content.js` (pure, loaded for every player): the one adapter. `check` (closed schema), `apply` (in place over a shipped snapshot, so versions and undo never stack), `mapLine` (edited lines), `fromDrafts`, `notApplied`, `changes`, `warnings`, `migrate` (never deletes from a save: an in-progress mission whose remaining steps are all done is completed and paid once; a tracked removed mission is untracked).
- `void-runner/live-content.js` (every player): fetches `live-content`, checks, applies, wraps `renderLine` for edited lines, migrates the loaded save. Fail safe to the shipped missions.
- `void-runner/mission-editor.js` (developers only, loaded on demand with `admin/studio-model.js`, `admin/studio-flow.js` and `mission-trees.js` by `dev-tools.js`). Drafts: `mission-editor-drafts-v1` (missions, lines keyed `speaker|original text`, played times) and the Studio's `studio-drafts-v1` for the beginner campaign.
- `void-runner/dev-test.js session()`: the throwaway session behind PLAY THIS DRAFT (same save and cloud blocking as Test & Jump To; leaving reloads without clearing the block).
- Server: `void_runner_live_content.py` + routes at the end of `void_runner_api.py`. Save compatibility: published beginner missions use ordinary mission records and `story.flags.br_<id>`, which `clean_save()` already accepts (tested); no manifest change is needed.
- `tools/audio/extract-lines.cjs` keeps manifest entries whose source is `mission-editor-queue`. Note: running it on unchanged `main` still drops about 60 older entries (existing drift); check the diff before committing a manifest.

## Tests

- `tests/mission-trees.test.cjs`: every tree, NPCs, locks, unlocks, endings, Admin's lines, the adapter (apply, rollback, registry text, lines), refusals, `notApplied`, warnings and save migration.
- `tests/test_live_content.py`: publish auth (owner allowed, others 403, switched off 404), versions, stale-write 409, undo, validation, cloud-save acceptance; re-voice queue add/list/done and auth.
- `tests/test_revoice_tool.py`: `generate.py --from-queue --dry-run` against a sample queue file.
- `tests/mission-editor-browser.cjs` (Chromium, offline, not in CI): opens the tab, screenshots at 1366x768 and 1920x1080, edits Iris's line and a step, PLAY THIS DRAFT from that step, checks the line and objective in the game, the real save and no cloud save, LEAVE DRAFT back to the same step with the draft intact, the publish check screen against a mocked server, a broken draft blocking publish, and published content applied or refused (fail safe) for players.
- Screenshots: `docs/development/mission-editor/`.

## Not verified

The real server with the switches on (Firestore transactions, deployed rules, David's UID), a real Firebase sign-in, the Kokoro render itself (dry run only; no models here), voice clips of edited lines in a real playthrough, draft play of every historical mission (only the beginner campaign was played in the browser test; historical missions start at their place and stage, and the editor says when a mission could not be started directly), and real graphics hardware.
