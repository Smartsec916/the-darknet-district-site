# VOID//RUNNER: Personal HUD, city expansion and flying taxis (2026-10-27)

David's brief: "Personal HUD, flying taxis, seamless city expansion and immersive loading". This records what was built, how it fits the existing systems, and what is still future work.

## Personal HUD (`hud-data.js`, `personal-hud.js`, `personal-hud.css`)

- **Look:** a fully opaque, full-screen terminal.
- **Opening:**
  - **P**, rebindable as "Personal HUD". Older saved bindings get P or the first free key.
  - **View/Back** on a controller.
  - It opens on foot, in flight and on the dock screens, but not in a skirmish or while a scene loads.
- **Input:** it uses the Mission Log's pattern. The game switches to its own `hud` mode, so there's no movement, firing or interaction, and the previous mode returns on close.
- **Sections:**
  - **Mission Log:** the same missions and tracking as L. There is no second database.
  - **Comms:**
    - **Relay link:** status comes from `comms.js`. NeoChinatown on foot counts as District premises: the Relay is blocked there and the terminal works locally.
    - **Messages:** rebuilt from story state.
    - **Contacts:** where each person physically is. Only the story's own remote channels are listed (Mara's comm, Rook's message). Nobody can be called from the HUD.
  - **Inventory:** what you carry, kept separate from what's aboard. The ship side is read-only; fitting stays at the hangar terminal.
  - **Taxi / Transport:** the service where one exists; otherwise the reason it isn't available.

## City expansion (`neochinatown.js`)

- **Unchanged:** the old neighbourhood's streets, walls, doors, interactions and spawn.
- **New streets** start from the avenue's two closed ends (no more ROAD CLOSED barriers) and the main street's south end:

  | Street | Leads to | Placeholder sign |
  |---|---|---|
  | `avenueWest` | `corporate` plaza | CORPORATE DISTRICT — PLACEHOLDER |
  | `avenueEast` | `milked` plaza | MILKED — FUTURE LOCATION |
  | `mainSouth` | `containers` plaza | CONTAINER SETTLEMENT — PLACEHOLDER |

  Milked is about 180 m on foot from the District door.
- **All on foot:** there are no loading points or teleports.
- **Walls:** everything that isn't street is solid over the whole area (`cityBox`), as before. Walls are now computed row by row: 9 ms instead of 240 ms, giving the same boxes.
- **The city is filled in:**
  - **Every block:** built up.
  - **Outer ring:** follows the new edge.
  - **Out to the megacity:** plain lit blocks fill the ground between the ring and the megacity, so from a taxi or a roof the city doesn't stop.
  - **Skyline:** moves out beyond it.

### District streaming

- **Loading:** each placeholder's own detail (sign, lights) is built when the camera comes within 90 m and disposed beyond 140 m. Each loaded district has its own materials and textures, freed when it unloads.
- **Always present:** streets, walls and surrounding buildings. They are simple batched geometry.
- **No game state:** placeholders hold none, so loading one again can't duplicate anything.
- **Adding a real district later:**
  1. Replace its `placeholder()` builder with the real one; it keeps the same load and unload rules.
  2. Give its state to the save system as usual (story flags), never to the streamed meshes.
- `VoidNeoChinatown.city` reports what's loaded, with load and unload counts.

## Flying taxis (`taxi-rules.js`, `city-taxi.js`)

- **Where:** only where a city registers a network, which for now means NeoChinatown ("NeoChinatown Sky Cabs"). Never in space or stations, inside the District, during a fight, or while a scene changes.
- **Calling:** HUD → Taxi / Transport. Each destination shows its fare (12 CR + 0.05 CR/m, up to 60 CR) or why it can't be chosen ("already there", "your ship is right here", "not enough credits"). Placeholder districts are marked PLACEHOLDER.
- **The trip:**
  1. The cab appears 220 m behind you, at 70 m (above every roof).
  2. It flies to the painted TAXI zone nearest you and descends vertically. If you're standing in the zone, it holds and asks you to step clear.
  3. It opens its door and waits up to two minutes. A TAXI marker shows its distance.
  4. BOARD TAXI (E): the camera moves into the front passenger seat and the door closes. The fare is charged now, once.
  5. It climbs, flies, and lands at the destination's zone. If the destination district isn't loaded yet, it holds over it.
  6. It opens; E (or controller A) gets you out beside it, on open street.
  7. The cab closes up, climbs and leaves, and is then disposed.
- **Cancelling** before boarding costs nothing. Cables are kept away from the taxi zones so cabs never come down through them.
- **Return to Ship:** uses the ship's real parked position from the location's layout, and lands at the zone nearest it: the passage beside the pad, about 18 m from the Kestrel.
- **Saves:** nothing about a trip is saved except the charged fare (`story.flags.taxiTrip`), which clears on arrival. A reload mid-trip puts you at the landing pad and refunds the fare once. There is never a duplicate cab and you can never be stuck in a vehicle.
- **The cab:** built from simple shapes (no external model):
  - passenger cabin with glass windows and a sliding door
  - two seats
  - four lift fans with thrust glow
  - head and tail lights
  - roof TAXI sign
  - a landing light pool on the ground

## Not done yet (future work)

- **Immersive warp and docking:** the existing loading and preparation screens for travel between locations are unchanged. Replacing them needs its own design and testing pass.
- **Elevators:** no elevator transitions.
- **Districts:** no final Milked, Corporate District or Container Settlement. The placeholders are signs, lights and empty plazas.
- **Destination changes:** you can't change the destination after boarding.
- **Cab model:** no imported vehicle; it's built from simple shapes.

## Tests

- **Unit tests:**
  - `tests/personal-hud.test.cjs`
  - `tests/city-taxi.test.cjs`: districts reachable on foot, the old layout intact, availability, fares, charge once and refund once.
- **Browser (Edge, local):**
  - HUD keyboard and controller navigation
  - the full taxi trip, with cancel, too few credits, Return to Ship and the refund
  - the District refusing taxis
  - districts streaming in and out
  - the NeoChinatown interaction regression
