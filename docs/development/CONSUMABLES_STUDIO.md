# Consumables Studio and Items & Vendors (23 Nov 2026)

The owner's brief: design a fictional consumable, set its visual, audio and gameplay effects, preview it in 3D, publish it, put it on a seller, and have a player buy and use it. This file is the audit and the design. Phase notes at the end say what has shipped.

## Audit (what was already there)

- **Developer Tools** (`void-runner/dev-tools.js`): tabs Start, Mission Editor, NPCs, VR Companions, Test, Zones, Combat Balance, **Studios**, Achievements, Guide. Studios was a static list (`dev-studios.js panel()`). Editor scripts load on demand for confirmed developers only (`editorScripts`, `loadEditor`). Requests go through `VoidDevTools.request` (Firebase token).
- **Authorisation**: `balance_admin(uid)` = `VOID_ADMIN_UIDS`. Reused for every route here. No new secret and no new environment variable.
- **Publish pattern**: `void_runner_live_content.py` (state pointer + create-only versions in one transaction, optimistic `expected`, undo = new version, 60 s public cache). `void_runner_items.py` copies it for a separate catalog; it does not touch mission content.
- **Items today**: there is no global shop database. Credits and `progression.personal.items` (`ward-kit`, `hacking-device`) live in the save (client-held, checked by `clean_save`). Pod vending (`VoidPodVending`) is display stock. SHOP HERE (`dev-studios.js`) sold two local tonics via `story.flags.shopEffect`. `district-vending` was a one-line joke. There were no kiosks (the only "kiosk" is the VR terminal and the scanner post).
- **Game mechanics that exist on foot**: walk, sprint, crouch speed and acceleration/braking (`exploration-controller.js`). There is **no stamina, melee, accuracy or night-vision system**, and no on-foot damage. Those modifiers are in the schema with `supported:false` and are refused by the server. No new mechanic was invented. Night sight is available as a visual (colour shift exposure and tint).
- **Rendering**: one Babylon scene and one camera, drawn by `renderRoom()` in `babylon-renderer.js` (camera set from the player every frame, then `scene.render()`). Quality tiers low/medium/high/ultra in `presets`; `look.apply` builds a `DefaultRenderingPipeline` and glow layer from Medium up.
- **Audio**: `VoidAudio` (`ship-audio.js`) owns one AudioContext with buses master, music, effects, voice, ambient. Remote voice chat (LiveKit, `district-voice.js`) enters the **voice** bus. Consumable audio is inserted only on music, effects and ambient, so voice chat and the microphone are never processed.
- **Vendors/entities**: interactions are registered with `VoidInteractions.register(action, handler)`. Sellers that exist: SHOP HERE counter (`district-shop-here`), the hallway vending alcove (`district-vending`; three machines DRINKS, DISPENSARY, NEUROHACKERS in `district-rooms.js`), the bar. No NPC dialogue is modified.
- **Open PRs/branches**: other sessions work on `claude/nomi-se7en-3` (tea room, NPC dialogue). Not touched.

## Data model (`void-runner/consumable-spec.js`, shared by browser and server)

One catalog document `{format:'vr-items', version:1, categories, items, vendors, presets}`:

- **Item** (ItemDefinition): id, name, description, category, subcategory, kind (consumable, food, beverage, weapon, ammunition, missile, equipment, medical, misc), icon, optional model (a game model path), animation, price (default), stack (also the carry limit), weight, rarity, status (`draft`, `published`, `retired`), cooldown, optional `registryId` (links to an item the game already has), optional `consumable` (ConsumableDefinition: `effects[]`, `modifiers[]`).
- **Effect** (EffectDefinition): id, type, intensity, delay, duration, fadeIn, fadeOut, speed, stacking (`max`, `additive`, `replace`, `independent`), params (per type, ranges in the spec).
- **Modifier**: stat, amount (a fraction, 0.2 = +20 percent, negative allowed), delay, duration.
- **Preset** (EffectPreset): a named list of effects.
- **Vendor** (VendorDefinition): id, name, kind, location, `entity` (must be in `vendorRegistry`, the list of real game sellers), entries.
- **Vendor entry** (VendorInventoryEntry): item, price, stock, maxStock, restock `{mode:none|interval, every, amount}`, available.
- **Published version**: immutable `vr_items_versions/v<n>`; pointer and the ledger of ever-published ids in `vr_items_state/current`.

Storage (Firestore, all new collections; the campaign save is untouched): `vr_items_drafts/<hash(uid)>` (private, optimistic revision), `vr_items_versions`, `vr_items_state`, `vr_items_stock/<vendor>__<item>` (remaining, last restock, base), `vr_shop_players/<hash(uid)>` (owned counts, active uses, last-use times, 30 recent request ids).

Rules enforced on the server (`void_runner_items.py`):
- Only `VOID_ADMIN_UIDS` can save drafts, publish, roll back or read versions.
- Publishing validates the whole draft with the same closed rules as the browser, fails on any problem, and never overwrites: a new version each time.
- **A published item id can never be deleted, returned to draft, or have its kind or registry link changed.** "Delete" of a published item means Retire: it stops being sold, players keep and can use what they hold. Undo re-adds later items as retired.
- Purchase: price, stock, carry limit and availability come from the published catalog and the stock record; negative or zero quantities, unknown items, unlisted items and extra fields are refused; a request id makes a repeated request free; stock and holdings change in one transaction (concurrent buyers cannot oversell). Restocking is computed from the stock record's clock.
- Use: removes one held item, enforces cooldown, returns the **server's** effect and modifier definition. The client cannot send amounts. `modifiers_now()` is the clamped, time-evaluated modifier set the multiplayer service should read.
- The credit balance is the one thing the server cannot check: credits live in the client's save and there is no wallet service. The browser sends its balance, the server checks it covers the server-computed cost and returns the new balance. Moving credits server-side is a separate design decision for the owner.

## API (`/api/void-runner/...`)

Public: `GET items/catalog`. Signed in: `GET shop/vendor/<id>`, `GET shop/state`, `POST shop/purchase`, `POST shop/use`. Administrator: `GET developer/items`, `POST developer/items/draft`, `POST developer/items/publish`, `POST developer/items/rollback`, `GET developer/items/versions/<n>`.

## Phases

1. **Audit and data model** (this PR): spec, pure rules (`consumables.js`), server module, routes, seed (the two SHOP HERE tonics), tests (`tests/consumables.test.cjs`, `tests/test_items.py`).
2. and 3. Effect engine, Consumables Studio and live preview. 4. and 5. Items & Vendors editor, vending, kiosks, purchasing, use from inventory. See the sections added by those PRs.

Render needs a redeploy after phase 1 for the routes to exist. No new environment variable is needed.
