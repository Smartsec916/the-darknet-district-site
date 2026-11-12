# The city map (V1 device, Map app)

Code: `void-runner/district-map.js`. The device's Map app (`void-runner/personal-device.js`, `map()` and `drawMap()`) mounts it; if the file is missing the older "explored areas" picture is used.

## It is generated, not drawn

`VoidDistrictMap.model(VoidNeoChinatown)` reads the game's own layout in `void-runner/neochinatown.js`:

| On the map | Comes from |
|---|---|
| Streets and their outlines | `streets` (named rectangles) |
| The Darknet District and the smoking terrace | `footprints` |
| Walls | `layout('street').solids` and `layout('interior').solids` |
| Places (shop, bar, VR arcade, pods, wardrobe, Admin, Iris, landing pad...) | `layout(...).interactions` |
| Taxi stops | `taxiZones` |
| Entrance and security vestibule | the District door and `VoidDistrictArea` |
| Places that are not built (Corporate District, Milked, Containers) | `districts` with `placeholder: true`: shown only to authorised developers, dashed |

## Adding a location

1. Add the street rectangle, building footprint or interaction to the layout in `neochinatown.js` as usual. It appears on the map with no further work.
2. For a nicer name or a different marker colour, add one line to `PLACE` (interaction id → `[name, kind]`) or `STREET_NAMES` in `district-map.js`. Kinds: `entrance`, `service`, `vr`, `shop`, `transit`, `mission`.
3. A place that should stay hidden from players: mark its district `placeholder: true`.
4. `tests/district-map.test.cjs` fails if anything on the map is not in the layout at the layout's own coordinates.

## What the player can do

Zoom (wheel, + and −), pan (drag or arrow keys), MY POSITION, WHOLE CITY, switch layers, select a marker or a row in PLACES, SET WAYPOINT, CLEAR WAYPOINT. Their own position and facing are always shown.

## Waypoints

- Stored in the save as `story.flags.deviceWaypoint` (the place id).
- The HUD shows a small pointer, the name and the distance, updated four times a second while walking. Within 3 metres it announces arrival and clears.
- **Direction only.** The game has no pathfinding data, so no route is drawn and the device says so. A destination in the other environment is pointed to the security vestibule first.

## Layers

Locations, Shops, Transit, Missions (empty until missions exist), Players (present, switched off and empty: other players and NPCs are not exposed on the map until the game has rules and privacy settings for that).

## Tests

`tests/district-map.test.cjs` (data honesty, guidance maths) and `tests/district-map-browser.cjs` (a real browser: open, zoom, pan, select, waypoint, arrival).
