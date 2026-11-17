# Street taxis (NeoChinatown)

> **Update, build `2026-11-16-quarters-1`:** road taxis are now the ONLY taxis (the sky cabs were scrapped by the owner). Each quarter of NeoChinatown has its own cabs; a trip to another quarter, the Corporate District or the Zen Zephyr Temple drives through a checkpoint's vehicle bay. Stops: The Port, Main Street, Milked corner, NULL / the alley, The Avenue, Function Gate, East Gate. See [`NEOCHINATOWN_QUARTERS.md`](NEOCHINATOWN_QUARTERS.md). Text below that mentions sky cabs or four stops is older.

> **Update, build `2026-11-16-fixes-1`: how a taxi is called.** The owner: "Couldn't figure out how to call a taxi." Until now the only ways were the V1's map (L, Map, STREET TAXIS) and the terminal's TAXI / TRANSPORT section (P); nothing in the street said so. Now: (1) walk up to the TAXI post at any stop, or the one by The Darknet District's door, and the prompt CALL A TAXI opens the list of destinations and fares; (2) the G key opens the same list anywhere on foot; (3) the KeyMap shows G. The posts have a lit plate, an amber lamp and a call panel. Posts and prompts come from `CALL_POINTS` / `callPrompts()` in `ncz-quarters.js`; the handler is `road-taxi-call` in `road-taxi.js`. The cab itself was not restyled.

Self-driving cabs drive the roads. The flying sky cabs are still there; this is the service on the street.

## Where it lives

| Piece | File |
|---|---|
| Stops, fares, roads, collision, the trip | `void-runner/road-taxi-rules.js` |
| The cab you see, and the ride | `void-runner/road-taxi.js` |
| "Call a taxi" on the V1 map | `void-runner/district-map.js` (the STREET TAXIS list) |

The cab is built from simple shapes in code. There is no model file. The licence note is in `docs/VOID_RUNNER_ASSET_LICENSES.md`.

## Stops

Only places that already exist, and only the taxi zones that are actually built:

- Main Street
- The avenue
- Main Street by the alley
- The passage by the landing pad

Corporate District, Milked and the Container Settlement are not stops. Milked (since 16 Nov 2026 on a side street off Main Street) is a short walk from the two Main Street stops; the cab never turns into its side street or service alley. The cab also does not drive the alley or into the District.

To add a stop later: give it a taxi zone in `void-runner/neochinatown.js` (the same list the sky cabs use), then add that zone's id to `REGISTRY` at the top of `void-runner/road-taxi-rules.js`. The map, the fare and the driving pick it up from that list. Do not add a name that is not already a zone.

## How a ride works

On the street in NeoChinatown, open the V1 (L) and the map. STREET TAXIS lists the stops and the fare. The cab drives to the nearest point on the road, opens its door, and waits. BOARD TAXI (E) charges the fare once, the same prices as the sky cabs. It then drives to that stop. E steps you out. Cancelling before you board costs nothing. A reload in the middle refunds the fare once (`story.flags.roadTaxiTrip`).

If you walk in front of a cab it slows and stops, then moves again when you step aside. It does the same for another cab.

Inside the District the map explains that the cabs stay on the roads.
