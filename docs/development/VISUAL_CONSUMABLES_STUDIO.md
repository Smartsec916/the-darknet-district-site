# Visual Consumables Studio

Open Developer Tools → Studios → Items. The library separates consumables, combat and equipment, and other products such as keycards and services. Video Maker and Sound Studio open their existing projects. The searchable library, seller entries, catalog import/export, draft revisions, immutable live versions and rollback use the existing Items API.

## Editor and gameplay

Open a consumable, expand a category and add a track. Preview a single track, a category, or all tracks. Drag a timeline block to move it. Drag its right edge to change its duration. The arrow keys move the selected block by one second and Shift plus an arrow resizes it. Expand **Intensity curve** for draggable control points, numerical editing, interpolation, zoom and curve undo/redo. Move an endpoint vertically or an interior point in two dimensions. Reset restores the default envelope. The item and vendor cards apply pending effect edits to the private item draft before opening the existing catalog controls.

The preview owns its Babylon scene, sound source, simulated clock and health and stamina values. The Blackrock camera room uses the game builder. The character preview plays the shipped regular-01 walk animation. Health starts at half capacity. The stamina example alternates six seconds of sprinting with six seconds of recovery. Walk and run readouts show normal and modified speed in metres per second. The health example isolates the item's contribution to recovery. Camera, distortion and flashing preferences start from the player's settings and can be changed locally for the preview.

## Authoring inventory

| Card | Stored settings and runtime behavior |
| --- | --- |
| Visual | Lens blur, glow, exposure, grain, signal glitch, chromatic separation, trails, color shift and tint, kaleidoscope, fractal warp, wavy and double vision, tunnel vision, particles, camera bob, drift, shake, sway and field of view |
| Audio | Filtering, echo, reverb, pitch, pan, distortion, murmurs, ambient sound, world volume and heartbeat. Activation, expiration and loop files reference packaged game audio. |
| Physical | Walk and sprint speed, movement control, stamina regeneration and drain, jump height and movement restriction |
| Health | Health and stamina on consumption, gradual recovery and loss, temporary maximum health |
| Combat | Sidearm damage, spread, recoil and reload, incoming damage resistance, fitted ship shield regeneration and energy recharge |
| Status | Interaction awareness. Replacement groups can cancel an earlier dose. |
| Timing | Layer intensity or amount, start, duration, fade, speed and stacking. Dose repetition supports prevention, refresh, extend, intensify, independent doses and replacement with bounded stacks and duration. |
| Properties | Stable ID, name, category, subcategory, kind, status, icon, model, image, use animation, sounds, price, carrying limit, weight, rarity, cooldown and game registry link |
| Distribution | Existing counters, stalls, kiosks, vending locations and registered NPC vendors, vendor-specific price, stock, restock interval, sale hours and reputation or mission requirements |

## Compatibility and release

Catalog format remains `vr-items` version 1. A track can include an optional `curve` with 2–32 ordered normalized points spanning 0–1 and `linear`, `smooth`, or `step` interpolation. The curve multiplies the existing intensity and fade envelope. A duration extension stretches the normalized curve. Omission preserves the original envelope. Browser and server validators reject invalid shapes. The runtime still reads the dose definition recorded by the server on use.

Legacy presets contain effects only. Applying one preserves an item's gameplay modifiers. New presets also store modifiers and immediate amounts. Optional packaged sound paths and on-use amounts default to silence and zero. Item IDs, stock keys, receipt keys, inventory and campaign documents require no migration. Current limitation: the item editor previews the consumable's effects, not a live competitive combat encounter. No publishing operation is part of preview.

Regression coverage includes `tests/item-catalog-browser.cjs`, `tests/consumable-layers.test.cjs`, `tests/consumables.test.cjs` and `tests/test_items.py`. The browser test uses an isolated draft and publishing fixture. The Flask suite exercises the transaction handlers and version checks.
