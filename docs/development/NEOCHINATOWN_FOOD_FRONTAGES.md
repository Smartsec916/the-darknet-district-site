# NeoChinatown food frontage audit

The rollback point is `dcc5a3c507847d8d14d2577fc78b7670eeb622ef`, after the editor and social taxi merges. The five surface counters share one layout in ncz-food-stands.js. Their vendor prompts, seat prompts, reserved customer stools and collision boxes derive from each stall transform. Nightlife and ad-screen exclusion read the same anchors. The underground modular stall and the disabled Port rebuild are separate.

## Existing conditions

The Avenue taxi centerline passes 0.45 m from the Jade Circuit stools. The 1.90 m wide cab overlaps the seating even on a straight segment. Nearest centerline distances to a stool elsewhere are 3.65 m in Old Town and Far South and 9.59 m at the Port. The Outskirts has no taxi network. The production mission content snapshot was version 3 and contained interaction overrides. Apartment registry inspection found 99 street entrances. Unknown local mission drafts and player-specific ownership are dependencies. Preserve every entrance, address, number, keycard ID, taxi stop, checkpoint, waypoint and street boundary.

The current counters greet players, offer three player stools and reserve one for a stationary customer. The existing food-stand browser suite checks greetings and player seating. The current catalog seed lists indoor counters and vending machines. The surface stalls do not have purchasing menus. Static seated figures also show arms extended in the baseline screenshots.

## Alternatives

| Approach | Visual result | Complexity and performance | Regression risk |
| --- | --- | --- | --- |
| Shift onto existing frontage | A fixed covered counter can meet a wall with a short return and serving ledge | Small transform and furnishing change | Low when both approaches to nearby doors stay open |
| Use an existing recess | Architecture encloses the business and leaves the carriageway clear | Reuses existing wall geometry and registries | Check alley width, stairs and collision |
| Repurpose vacant premises | Could provide an interior kitchen | Requires checking assignments and occupancy | Unknown local drafts and player ownership may depend on them |
| Expand individual buildings | More room for tables | Requires rebuilding facade mesh, collision and maps | Can change neighboring door and sidewalk clearance |
| Consolidate apartments | Creates a larger bay | Requires migrations and reconciliation of keys and residences | Disproportionate to the surface-space problem |
| Rebuild blocks | Allows new alleys and traffic geometry | Largest geometry and verification cost | Affects persistent routes and mission directions |

## Candidate placements

Docklight Noodles backs onto the north edge of the landing pad, away from the customs taxi spur. Lantern Kitchen meets the east frontage on Main Street. Jade Circuit fits on the western wall of the existing southeastern alley mouth, between the Avenue entrance and its yard. Southline Broth fits between the existing west-side doorways at z=-155 and -162. Last Light fits against the north wall of container 17, opposite its lean-to. Existing sidewalk space and the Avenue recess provide room without opening any apartment.

The V1 map currently starts from a single default-quarter layout, so quarter-specific vendor points need collection from each layout. The property editor reads the apartment registry independently. No apartment geometry or access migrations are needed. Taxi stop identities and network polylines remain authoritative. Before and after browser measurements use one low-quality Edge software-rendered scene at a time. Hardware-specific performance cannot be inferred from those timings.

## Implementation and verification

Each counter has a covered service bay, fixed plinth, kitchen platform, dining ledge and counter light. Static pieces share batches by material. Each diner approaches the reserved stool, sits, lifts a cup, stands and leaves. The seated movement combines the fixer's existing sit clip with left-arm keys sampled from the shipped regular-01 drinking animation. The three public stools retain their interaction IDs.

The physical vendor prompt opens the existing signed-in shop. The shipped catalog adds a street supper at 12 credits and the existing sprint tonic at 40 credits at each counter. These initial prices and stock can be edited by the developer. Existing published catalogs retain their own prices and assignments. Purchases use the game's transaction, inventory and stock APIs.

The five shop markers use physical counter coordinates. V1 shows the order point, and the shared NPC and property editor map shows the stall footprint. The stored address registry remains byte-identical across all 99 street entrances. Regression tests check the swept vehicle envelope around all seats, fixtures and customer routes. The Port has a taxi spur; the Outskirts has pedestrian access only.

Two independent local Edge accounts saw each other sit and stand at the Avenue stall using the repository's test hub. All five quarters loaded the vendor, diner, three available seats and the native seated cup animation in Babylon. Draw calls, frame times, geometry and time from travel start to both actors appearing were sampled from the actual browser. Software-rendered front views and paired fixed-view Radeon measurements are preserved under the isolated worktree's .test-temp directory. Crowds and background streaming vary between runs.

The next project in the owner's queue is the Visual Consumables Studio redesign. Start it after the street frontage release and outstanding merges are complete.
