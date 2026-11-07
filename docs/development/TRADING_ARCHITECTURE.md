# Player-to-player trading: architecture, what is built, what is blocked

Written 2026-11-05. **Trading of real items and credits is disabled and cannot be switched on.** What exists is the interaction flow, the trade window, the server-side trade rules and a *simulated* ledger used only in local tests. Nothing here touches a save, Firestore, Neon, Render or any real account.

## 1. What the game's economy looks like today (inspected)

| Thing | Where it lives now | Who is the authority | Tradable safely today? |
|---|---|---|---|
| Credits | `credits` in the campaign save (browser `localStorage`, optionally mirrored to the cloud save) | **The browser.** `clean_save()` only checks a whole number between 0 and 100,000,000. | **No.** A player can write any balance. |
| Equipment fitted to ships | `loadout`, `shipLoadouts`, `standardGear`, `creditGear` in the save | The browser; the server checks ids against a fixed list, not ownership history. | No. |
| Ships | `ownedShips` (at most 3, fixed ids) | The browser (range-checked). | No. |
| Salvage and cargo | `progression.cargo` in the save (counted units) | The browser. | No. |
| Personal items | `progression.personal` (weapon, ammo, reserve) | The browser. | No (also bound to the owner by design). |
| **Purchased equipment** | `vr_orders` in Firestore, written only by the server after a verified Stripe payment (`inventory()` in `void_runner_api.py`) | **The server.** | It is server-owned, but it is a **real-money entitlement**, so it must never be tradable (the catalog marks it so). |
| Cloud save | `vr_players/{hash(uid)}`: `save`, `revision`, `savedAt`, `character` | The save is client-reported; `revision` only prevents two devices overwriting each other. | n/a |

**Conclusion:** every balance and every item a player can currently offer is something the player's own browser can edit. A trade built on those would let anyone mint credits and duplicate items, so the persistent trading step is blocked until items and credits can be owned by the server.

## 2. What is built in this phase

```
 browser (trade window, prompt)        hub (tools/district-hub)                          ledger (ledger.cjs)
 ------------------------------        -----------------------------------------         -----------------------------
 T near a player  ----request---->     TradeBook (trade.cjs): pure state machine  ---->  DisabledLedger  (production: refuses all)
 accept / decline / cancel             - same room, within 3 m to start                   SimulatedLedger (local tests only)
 offer / confirm (with version)        - one session per player                           PERSISTENT SERVER-OWNED LEDGER (not built)
 <---- update / done / cancelled ----  - cancel on walk away, leave, replace, timeout
                                       - confirmations bound to an offer version
                                       - ONE call: ledger.settle(...) all or nothing
```

- **Interaction.** When another player is within 3 m a prompt shows `[T] TRADE WITH <name>`. The other player sees a request with Accept and Decline. Either side can cancel at any time before the final exchange begins. Walking beyond 4.5 m, changing location, disconnecting, a second login replacing the session, or a timeout (30 s unanswered, 5 min idle) cancels it. A player in a trade cannot be asked and cannot ask; a decline starts an 8 s cool-down for that pair.
- **Where it works.** Trading is a property of a *room* (a landing location in the hub's room table), not of one place: the state machine only asks "same room, close enough". The District interior is the only room today, because it is the only multiplayer room. Each new multiplayer-enabled landing location is one new entry in the room table (`protocol.cjs` `ROOMS`) and needs no trade code. It only runs while walking at a landing location; the client disconnects from the hub in flight, in the street, in VR and in combat, so there is no remote or in-flight trading.
- **The window.** A cyberpunk panel with two columns (YOUR OFFER and THEIR OFFER), item names and quantities, credits, the player's own tradable inventory with quantity steppers, a credits field, a confirmation chip for each side, CONFIRM EXCHANGE and CANCEL TRADE. Any change by either player clears both confirmations; a confirmation is tied to the exact offer version the player saw, so an offer cannot be swapped under a pending confirmation.
- **What can be offered.** Credits; counted stacks (salvage recovered from destroyed ships and ordinary inventory); unique equipment and ship components, each with a serial so a piece cannot exist twice. Catalog entries can be marked not tradable with a reason shown to the player (personal weapons, purchased equipment, restricted items). The trade catalog (`trade-items.cjs`) holds only placeholder ids for the simulation.
- **The ledger interface** (`ledger.cjs`): `snapshot(uid)`, `check(uid, offer)`, `settle({tradeId, a, b})`. `settle` re-verifies both sides and changes both or neither, is replay-safe by trade id, and refuses two settlements that need the same item. `tests/helpers/ledger-contract.cjs` is the contract any ledger must pass.
- **Production behaviour.** The hub's default ledger is `DisabledLedger`; `HUB_TRADING` is refused in production mode (the hub will not start with it set), a production hub refuses an injected ledger, `welcome.features.trade` is false, the client shows nothing, and every trade message is answered "Trading is not enabled." The Render Blueprint sets no trading variable.

## 3. What is simulated (local tests only)

`SimulatedLedger` holds in-memory inventories for test accounts, serialises settlements with a single lock, keeps an idempotency table and an append-only log, and can be told to fail between its two writes to prove the rollback. The two "authenticated test players" are signed test tokens checked by the same verifier the real hub uses, with an in-process fake of the game API. In the emulator-mode hub, `HUB_TRADING=simulated` gives every account a starting simulated inventory and the window shows a permanent **SIMULATED INVENTORY: no real items or credits** banner. None of it persists.

## 4. What a persistent, server-owned inventory requires

1. **A server-owned store.** Recommended first: Firestore through the existing Render game API (already the pattern for `vr_orders`), with deny-all browser rules (the fragment style already in `void-runner/firestore.rules`). Proposed documents: `vr_vaults/{hash(uid)}` = `{credits, stacks:{id:qty}, equipment:[{serial,id}], revision}`; `vr_trades/{tradeId}` = the immutable transaction record (both uids, both offers, outcome, time, hub instance); `vr_mints/{eventId}` = idempotency for server-side grants. Alternative: Postgres on the existing free Neon plan (real row locks, constraints, simple audit queries) at the cost of a new table set and driver in the Python API.
2. **One settlement transaction.** `settle` becomes a Firestore transaction (or SQL transaction) that reads both vaults and `vr_trades/{tradeId}`, checks ownership and balances, writes both vaults and the trade record, and succeeds or aborts as a whole. The trade id is the document id, which gives replay safety for free.
3. **Who may call it.** Only the hub, and only for a trade both players confirmed. Recommended: an internal endpoint on the game API that the hub calls with a signed request (a new shared secret, which needs approval), so the hub never gets Firestore credentials. The API re-verifies everything from the vaults and never trusts the hub's view of ownership.
4. **How things become server-owned (the hard part).** Importing what a browser claims to hold would let the claim be forged, so a vault may be filled only by **server-trusted sources**: (a) a one-time grant when the system starts (an owner decision about what a player begins with), (b) rewards the server itself decides, which first needs mission and combat results to be validated server-side, (c) **sale of salvage to an NPC merchant at a server-set price**, (d) purchases through the existing payment flow (which stay account-bound, not tradable). Local campaign credits and gear remain local and are **not** convertible. A deposit button from the save to the vault must not exist: it is exactly the duplication hole.
5. **A separate balance, one currency.** Vault credits are the same in-game credits, not a new currency, but they are a second balance held by the server; how local and vault credits relate (for example, vault credits can be spent at merchants and in trades, local credits keep paying for the single-player economy) is an owner design decision.
6. **Operational needs.** A kill switch, per-account daily value limits, an admin read-only trade viewer for disputes (reads `vr_trades`), moderation hooks (block list), rate limits on the settle endpoint, backups and a rollback plan for the new collections, Firestore rules deployed and reviewed (the pending administrator action), and the same contract tests run against a test database (never production).
7. **Client changes.** Showing the vault in the HUD (inventory screen) and routing merchant sales through the server. The trade window already works from a server-sent inventory snapshot, so it needs no change.

## 5. Preparation for future gameplay

- **NPC merchants:** a merchant is just a ledger counterparty with server-set prices: `ledger.sell(uid, offer)` and `ledger.buy(uid, item)` using the same atomic machinery and the same record format. No trade-state code is involved.
- **Rare and restricted equipment:** per-item flags in the catalog (`tradable`, reason shown to the player); a restricted item can be held and never offered, enforced in `normalizeOffer` and again in the ledger.
- **Player-to-player barter:** the current feature (items for items, with or without credits).
- **Not built, by design:** no auction house, no remote or in-flight trading, no new currency.

## 6. Threats and where each is stopped

| Threat | Stopped by | Test |
|---|---|---|
| Duplicating items by trading the same item twice | A serial exists once; `settle` re-checks inside its lock; two settlements needing one item cannot both succeed | `ledger-contract.cjs`, `district-hub-trade-ws.cjs` race test |
| Negative, fractional, huge or non-numeric amounts | `normalizeOffer` rejects them; the ledger checks again and never lets a balance go below zero | contract and session tests |
| Offering what you do not own | `ledger.check` at offer and confirm, `settle` again at commit | session tests |
| A forged identity or item list in a message | The trade message has an exact shape; identity is the verified connection | `trade-session.test.cjs`, trade ws test |
| Changing the offer after the other player confirmed | Confirmations are tied to the offer version and cleared by any change | session test |
| Replaying a request, confirm or settlement | Versions, one session per player, and the trade id as an idempotency key | session and contract tests |
| Half a trade after a failure | Copy-then-swap commit; tested with injected failures before and between the two writes | contract and trade ws tests |
| Trading from far away, between locations, or while flying | Server-side distance and room checks on every message and every move; no connection outside the District interior | session and trade ws tests |
| Trade spam and harassment | Per-player message limit, one request at a time, decline cool-down, request expiry | session tests |
| Enabling real trading by mistake | Production refuses `HUB_TRADING` and any injected ledger; the default ledger refuses everything | production tests, config |

## 7. Remaining before safe real-player trading

1. Owner decisions: which items are tradable, what players start with, how local and vault credits relate, value limits, minors and chat policy.
2. Approval and build of the persistent ledger (section 4), the signed hub-to-API call, and Firestore rules (administrator action).
3. Server-side minting paths (at least NPC merchant sales) so the vault can contain anything at all.
4. Contract suite against a test database; a staged test with two real players on a throw-away project, then the allow-listed live test.
5. Admin dispute viewer and the kill switch.
