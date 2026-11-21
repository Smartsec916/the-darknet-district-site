# NeoChinaTown food stands — draft branch

David requested one food stand inside each of the five checkpoint quarters, with **four seats per stand: three open to players and one occupied by a customer NPC**. This branch is isolated from Claude's Old Town, Port and playthrough branches. It is not merged or live.

| Quarter | Stand name | Counter centre (x, z) | Faces |
| --- | --- | ---: | --- |
| Port | Docklight Noodles | 32.5, -89.5 | Pad |
| Old Town | Lantern Kitchen | 68.4, -104.5 | Main Street (moved to clear the current building corner) |
| Avenue | Jade Circuit Dumplings | 110, -16.8 | Road |
| Far South | Southline Broth | 53.6, -155 | Main Street |
| Outskirts | Last Light Rice & Tea | 73, -241 | Gravel plaza |

Each stand's name appears on its sign above the food type and in its interaction prompts.

`void-runner/ncz-food-stands.js` owns the placement, meshes, one vendor and one seated customer in each quarter. The counters use existing crowd models and procedurally worn PBR materials; they introduce no licensed assets, paid generation or new voice. `street-gear.js` now dresses food workers in a fitted work apron instead of a thigh rig and bracer. `ncz-food-interactions.js` makes the three empty stools usable in first person, with E or Space to stand. The vendor turns to a talk animation when addressed and gives one short line; the customer holds a seated pose. There is no purchase, inventory or save change. If the parked Port rebuild is enabled later, its own stand replaces this Port counter.

Street walkers and standing groups in `ncz-nightlife.js` now keep the counters clear. The street cast now preloads and uses two existing measured models, `regular-01` and `cyborg-01`, alongside its original four; headcount stays the same. This is a limited visual variety pass. The larger replacement of the blocky street character models remains open.

The static collider test checks all five carts and stools against the existing city solids and gate doors. `tests/ncz-food-stands-browser.cjs` loads the running game and checks the counter, worker and customer in every quarter; it also sits and stands in Old Town and checks that ad screens stay at least 6 m from each cart. The test is optional and uses a local web server plus Playwright. The work still needs a graphics review on real hardware, especially the workers' visibility and the food materials. Current counters add readable street activity but remain a step toward the permanent AAA art target, not the final modeled food venues.

The 17 Nov release clearance pass moved the Port stand away from the pad's building corner and moved the Outskirts stand away from Kai's home and a container stairway. The full canopy and stool footprint now clears the nearest fixed collision surface by **2.81 m (Port), 1.91 m (Old Town), 2.50 m (Avenue), 1.91 m (Far South), and 3.38 m (Outskirts)**. The test also requires at least 3 m from building corners, 6 m from named destination doors and taxi stops, and 8 m from checkpoint rectangles. The Outskirts placement clears its nearby resident positions; the Port stand leaves the ship, boarding point, terminal, and passage clear. These distances come from the game's collision plan and are checked in `tests/ncz-food-stands.test.cjs`.

Player-eye captures from the original local low-graphics browser run: [Port](ncz-food-stands/port-street.png), [Old Town](ncz-food-stands/oldtown-street.png), [Old Town seated](ncz-food-stands/oldtown-seated.png), [Avenue](ncz-food-stands/avenue-street.png), [Far South](ncz-food-stands/far-south-street.png), and [Outskirts](ncz-food-stands/outskirts-street.png). These are historical, not production renders; Old Town has since moved to clear updated geometry. The 21 November V27 integration passed 60 focused unit tests, but needs a new browser/visual check before release.
