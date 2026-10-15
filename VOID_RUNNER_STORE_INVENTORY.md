# VOID//RUNNER: Store Inventory Audit

**As of:** 2026-10-15 · `main` after PR #49 · Update this file whenever the store system changes.

This lists every store that is **actually implemented** in the game today, with prices and stock taken from the code. Nothing here is planned or invented.

## 1. Summary

- There is **one shared catalogue**, the Station Outfitter. Every station and The Darknet District sell exactly the same things at the same prices.
- **All inventories are static.** Nothing rotates, restocks, sells out, or varies by location or faction. Each item can be bought once (upgrades once per tier).
- No store has an NPC who runs it in gameplay terms. Admin and Iris stand behind the District counter, but "Browse the shop" opens the same Station Outfitter.
- Prices are in campaign **credits (CR)**. The one exception is the premium Spectre ship ($1.00 USD, bought through the player's account, not with credits).

## 2. Stores

| Store | Where | Operated by | Opens with | Requirement |
|---|---|---|---|---|
| **Station Outfitter** (ship store, standard outfitting, modules, credit gear) | Every walkable station's "Ship Outfitter" terminal: Meridian, Kepler, Rusthaven Port, The Foundry, Tessaly Belt Anchorage, The Vigil, Holdfast. Also the docking menu's "Shop". | No NPC | `shop()` (`hangar.js`, `expansion.js`) | At least one completed delivery; before that it sends the player home |
| **The Darknet District shop** | NeoChinatown, Admin and Iris's counter ("Browse the shop") | Admin and Iris (set dressing only) | Same `shop()`: identical to the Station Outfitter | Same |
| **Workshop personal equipment vendor** | Vesper, Ward Freight Workshop ("yellow counter") | No NPC | `personalVendor()` (`prologue-integration.js`) | None |
| **Vending machines** (flavour only) | The Darknet District, back area | — | `district-vending` | Free; gives no item ("a can of Drink Oil") |

Not stores: the mission terminal and cargo board (contracts), Rook's booth (freight runs), and the District's VR rigs ("Every rig is booked tonight").

## 3. Inventory

### Station Outfitter / The Darknet District shop (identical)

| Section | Item | Price | Stock | Availability |
|---|---|---|---|---|
| Ship store | Peregrine / 02 | 1,000 CR | Once | Always listed |
| Ship store | Spectre / 03 (premium) | $1.00 USD | Once | Real-money purchase through the player's account (`purchase:spectre`) |
| Standard outfitting | Pulse cannons, tiers 1–3 | 350 / 700 / 1,200 CR | One per tier | Always |
| Standard outfitting | Hull plating, tiers 1–3 | 300 / 600 / 1,000 CR | One per tier | Always |
| Standard outfitting | Vector thrusters, tiers 1–3 | 250 / 500 / 900 CR | One per tier | Always |
| Standard outfitting | Deflector shield, tiers 1–3 | 300 / 650 / 1,000 CR | One per tier | Always |
| Ship modules | Reserve capacitor | 150 CR | Once | Fits all ships |
| Ship modules | Ward cooling loop | 120 CR | Once | Also given free on the first docking |
| Ship modules | Focused pulse coils | 240 CR | Once | Fits all ships |
| Ship modules | Compact shield generator | 220 CR | Once | Fits all ships |
| Ship modules | Maneuvering vanes | 200 CR | Once | Fits all ships |
| Credit gear | Missile launcher (Rook's voucher) | 0 CR | Once | After two combat runs (missile qualification) |
| Credit gear | Vector Booster | 500 CR | Once | Always |
| Credit gear | Scout Drone | 700 CR | Once | Always |
| Placeholder | "Exclusive item — coming soon" | — | — | Placeholder card only; nothing to buy |
| Account items | Wraith Cannon, Aegis Shield, Ghost Drive, Sentinel Drone | — | — | Shown only if the player's account already owns them; no purchase button in this store |

### Workshop personal equipment vendor (Vesper)

| Item | Price | Stock | Availability |
|---|---|---|---|
| Red-dot sight (Ward pistol optic) | 25 CR | Once | Always; part of the optional ground tutorial |

## 4. How purchases are stored

| Purchase | Saved in | Cloud save check |
|---|---|---|
| Ships | `ownedShips`, `shipLoadouts` | `clean_save()` limits ships to starter, ship2; Spectre is never trusted from a save |
| Upgrade tiers | `upgrades.{guns,armor,engines,shields}` (0–3) | Validated 0–3 |
| Credit gear | `creditGear` | Validated against launcher, vector, scout |
| Ship modules | `progression.equipment.owned` | `clean_progression()` |
| Red-dot sight | `progression.personal.attachments` | `clean_progression()` |

## 5. Gaps relevant to the store brief

- No dynamic inventory exists: no stock counts, restock timers, location or faction stock, or per-visit state.
- The District has no District-specific merchandise; its shop is the generic outfitter.
- Faction locations (The Vigil, Holdfast) sell the generic catalogue; nothing Communion- or Natural Order-specific exists yet.
- Every module is tagged `faction: null`, `technology: conventional`, which leaves room for faction stock later.
