# Street taxis (NeoChinatown)

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

Corporate District, Milked and the Container Settlement are not stops. They are still only signs. The cab also does not drive the alley or into the District.

To add a stop later: give it a taxi zone in `void-runner/neochinatown.js` (the same list the sky cabs use), then add that zone's id to `REGISTRY` at the top of `void-runner/road-taxi-rules.js`. The map, the fare and the driving pick it up from that list. Do not add a name that is not already a zone.

## How a ride works

On the street in NeoChinatown, open the V1 (L) and the map. STREET TAXIS lists the stops and the fare. The cab drives to the nearest point on the road, opens its door, and waits. BOARD TAXI (E) charges the fare once, the same prices as the sky cabs. It then drives to that stop. E steps you out. Cancelling before you board costs nothing. A reload in the middle refunds the fare once (`story.flags.roadTaxiTrip`).

If you walk in front of a cab it slows and stops, then moves again when you step aside. It does the same for another cab.

Inside the District the map explains that the cabs stay on the roads.
