# Void Runner Save System Audit

Source: `Smartsec916/the-darknet-district-site`, `main`, commit
`a47e0e95355fa6e1444a942ab7a809b49be08a66` (inspected October 6, 2026).
The live opening-data implementation matches this source. Changes are prepared
locally; this update does not deploy or change a real user's save.

## Current Implementation

`campaign.js` owns Campaign state and validates/migrates browser restores.
`progression.js`, `universe.js`, `mission-log.js`, and `story.js` own the existing
progression, location, mission, and dialogue records. These systems are extended.
There is no replacement save manager or duplicate tutorial state machine.

There is one local Campaign slot per browser origin and one cloud Campaign slot
per authenticated account. There are no named or numbered save slots. Local
autosaves are automatic; cloud saving/loading remains an explicit, confirmed
copy through the account screen. Login does not silently replace the local slot.

## Storage

- Local: `localStorage['void-runner-campaign-v1']`; its serialized payload uses
  Campaign schema version 2. The browser slot is shared on that origin, rather
  than keyed by Firebase UID. Logout does not erase it.
- Cloud: Firestore project `the-darknet-district-71873`, collection `vr_players`,
  document `SHA256(Firebase UID)`, fields `save`, `revision`, and `savedAt`.
- The Flask `/api/void-runner/account` and `/save` endpoints verify Firebase ID
  tokens. Cloud writes use a revision-checked transaction to reject conflicts.
  Direct browser Firestore access is denied by the existing rules.
- Paid entitlement records remain separate in `vr_orders`; neither a Campaign
  save nor Skirmish can grant paid ownership.
- Input, audio, and graphics preferences use separate browser records. The
  service-worker cache stores game files and assets, not Campaign saves.

## Save Triggers

Existing local autosaves cover new Campaign creation, first-time tutorial actions,
recording/pistol dialogue, practice shots and reloads, departures, route changes,
arrivals/docking, mission acceptance/completion, story choices, inventory changes,
equipment purchases/installation/removal, ship purchases/switches, unlocks, and
checkpoint recovery. Walking resumes also record a safe landing checkpoint.

This update additionally saves Campaign when opening its menu and when leaving
the active session. The fourth distinct practice hit, completed Mara handoff,
and first boarding are persisted immediately. A physical-target recovery writes
only when it repairs state. Unchanged serialized state no longer causes repeated
local writes or timestamp changes. There is no per-frame cloud autosave.

Manual saving: the account screen's confirmed **Save This Journey to Cloud**.
There is no separate manual local-save button.

## Data Persisted

- Campaign quest/current mission, active contract, completed delivery count,
  completed chapter missions, acquired mission records and objective completion,
  tracked mission, and explicit tracking preferences.
- Tutorial flags, shooting completion, Mara handoff, hologram/pistol acquisition,
  individual can IDs, training completion, and migration flags.
- NPC/story flags, characters, relationships, met contacts, dialogue events,
  pending content, chapter, story unlocks, and encounter history.
- Credits, owned ordinary ships, active ordinary ship, upgrades, standard/credit
  gear, equipped loadout, and saved loadouts for each ship.
- Personal weapon, magazine/reserve ammunition, items, attachments, and optic;
  owned/installed ship modules, missile count, cargo, data packages, and relays.
- Current location, last safe checkpoint, discovered/visited locations, system,
  free-travel unlocks, station state, and save timestamp.

Available missions are derived from saved progression and content prerequisites.
Armor is represented by the existing hull upgrade/modules, not a new inventory.
Legacy faction/relationship fields are preserved where already supported; no
removed Reputation feature or new reputation UI is introduced.

## Problems Found

- Four can hits could still leave boarding locked by an unrelated missing ground
  action such as reload. Mara's response used that same restrictive predicate.
- There was no explicit saved shooting milestone or Mara/ship handoff milestone.
- The menu hid Skirmish whenever a Campaign resume callback existed; entering
  Skirmish could discard that callback without retiring the old scene/session.
- Flight Skirmish removed its save guard before awaited cleanup restored the
  original Campaign object. FPS isolation diagnostics covered only some fields.
- Cloud validation still rejected magazines above eight rounds despite the
  current ten-round weapon. It discarded acquired mission/objective records and
  tracking preferences, and could revoke free-travel access on restoration.
- Repeated save calls could write identical state with new timestamps.

## Changes Made

- Existing progression flags now include `shootingTutorialComplete` and
  `maraShipHandoff`. Four unique legitimate target hits record shooting completion
  immediately. Recording and pistol acquisition remain required; reload and
  other recorded control exercises no longer lock a completed shooting objective.
- Objectives advance to **Meet Mara by the ship**, then **Board the Kestrel**.
  Mara walks around the ship collider to a reachable position beside boarding.
- Boarding with completed practice and a missing handoff automatically plays
  Mara's existing story line, completes the handoff, and opens the cockpit.
- Recorded target IDs repair missed flags on restore. Physically hit/nonpickable
  practice targets repair a missed callback during walking. Successful boarding
  is durable evidence and cannot regress to shooting. Partial practice remains
  unfinished; repair never invents unhit target IDs from a moved NPC.
- Main Menu always exposes Continue Campaign, Campaign, Skirmish, Settings /
  Keybindings, and Logout. Continue is disabled without a local save. Campaign
  offers Load and New; existing local saves require overwrite confirmation.
- Mode changes cancel preparations, end flight ownership, release scenes, clear
  walking/combat/input/dialogue state, and retire stale mission-log callbacks.
  Settings and Resume retain the existing pause workflow.
- Cloud validation preserves the added tutorial flags, ten-round magazines,
  mission records, tracking preferences, and existing free-travel access.
- Cache build IDs are advanced together so the update invalidates older caches.

## Campaign vs Skirmish

FPS keeps match health, ammunition, enemies, position, and kills in its disposable
match object. Its invariant check now compares the complete Campaign object.
Flight reads owned ships, equipment, and installed modules, then uses an existing
deep clone for its temporary state. Save suppression lasts through awaited
cleanup; the original Campaign object is restored before it is lifted. General
local-save and account-action guards also reject active Skirmish writes.

Campaign menu exit saves before cleanup. Skirmish exit does not save its temporary
values. Both modes return to a menu with Campaign and Skirmish available.

## Death and Checkpoints

Hull damage, dead entities, ground health, and precise runtime position are not
Campaign save fields. The existing restore path clears travel/destination and
dialogue cursors, returning to the saved safe station/checkpoint while retaining
progression, credits, cargo, equipment, and mission records. This update preserves
that design; it does not replace the checkpoint with a dead/transitional position.

## Validation

- All 198 JavaScript unit/regression tests pass.
- All 33 Python API/save/ownership tests pass, using fake cloud storage.
- Browser: actual pistol raycasts hit four cans without reloading; the saved
  milestone and immediate objective update are verified.
- Browser: missed completion callback recovery, reload before handoff, normal
  reachable Mara interaction, reload after handoff, automatic boarding dialogue,
  and saved first boarding pass.
- Browser: two Campaign -> Menu -> FPS -> Menu -> Flight -> Menu -> Campaign
  cycles pass; Campaign storage remains byte-identical during each match.
- Browser: Campaign death returns to Vesper with tutorial milestones intact;
  duplicate saves do not rewrite unchanged state; mobile menu fits at 390x844.
- Browser: simulated Firebase login/logout, manual cloud copy/restore, tutorial
  continuity, and existing-save overwrite confirmation pass.

No real Firebase account, production cloud write, purchase, or deployment was
performed. Browser account services are mocked; Python tests exercise the real
validator and API handlers against fake storage.

## Remaining Recommendations

- Offer local export/import or backup slots for recovery from browser storage
  clearing; the current design has one local slot and one manual cloud copy.
- Consider per-user local slots and cross-tab conflict detection as a separate
  migration. The shared browser slot and explicit cloud replacement are retained.
- Verify the deployed backend receives the updated validators before exposing
  the updated browser flags to production cloud saving. Deploy both cache files.
- Premium ships remain subject to existing server verification on login; their
  saved loadouts are not proof of entitlement.
- Production identity/network and real cross-device cloud behavior require a
  deployment smoke test. No automatic cloud replacement is added here.
