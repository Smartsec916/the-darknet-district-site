# NeoChinaTown food stands — draft branch

David requested one food stand inside each of the five checkpoint quarters, with **four seats per stand: three open to players and one occupied by a customer NPC**. This branch is isolated from Claude's Old Town, Port and playthrough branches. It is not merged or live.

| Quarter | Counter centre (x, z) | Faces |
| --- | ---: | --- |
| Port | 35.5, -87.8 | Pad |
| Old Town | 68.4, -87 | Main Street |
| Avenue | 86, -16.8 | Road |
| Far South | 68.4, -155 | Main Street |
| Outskirts | 86, -237 | Gravel route |

`void-runner/ncz-food-stands.js` owns the placement, meshes, one vendor and one seated customer in each quarter. The counters use existing crowd models and procedurally worn PBR materials; they introduce no licensed assets, paid generation or new voice. `ncz-food-interactions.js` makes the three empty stools usable in first person, with E or Space to stand. The vendor turns to a talk animation when addressed and gives one short line; the customer varies their seated animation. There is no purchase, inventory or save change. If the parked Port rebuild is enabled later, its own stand replaces this Port counter.

The static collider test checks all five carts and stools against the existing city solids and gate doors. `tests/ncz-food-stands-browser.cjs` loads the running game and checks the counter, worker and customer in every quarter; it also sits and stands in Old Town. The test is optional and uses a local web server plus Playwright. The work still needs a graphics review on real hardware, especially the workers' visibility and the food materials. Current counters add readable street activity but remain a step toward the permanent AAA art target, not the final modeled food venues.
