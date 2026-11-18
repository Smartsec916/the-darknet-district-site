# Location names: review sheet for the owner

The owner (18 Nov 2026): *"every location needs a name whether it's just an area, venue, etc"*, and a trigger's place is picked as **System › Planet › City › Area › Exact location**. This sheet lists every named place in the game today, one row each. Generated from `void-runner/places.js` by `node tools/location-names.cjs` (rerun after a change).

- **168 places**: **147** use a name the game already has (signs, menus, the map, the game's own data: the "Source" column says where), and **21** have a short **PROPOSED** working name because the game does not name that spot. Nothing PROPOSED is canon.
- **Your name:** write the name you want in the last column (or "keep"). Only the name changes; the ID number and the internal id stay, so missions keep working.
- **Planet:** the game shows "NeoChinatown" for the planet as well as the city (internal id `earth`). The planet's own name is not settled: it is row 2, PROPOSED.
- **Venue** is a building with rooms (The Darknet District, NULL, Milked). An exact location can hold smaller ones (a shopfront or a taxi stop on a stretch of street): the smallest one you stand in is what a photo's LOCATION shows.
- **Shopfronts** are the neon shop signs on the street walls, named by the sign's own words (several signs repeat, so the street name tells them apart). They are facades: no shop interiors exist yet.
- **The map:** [`location-names-map.png`](location-names-map.png) shows the city from above with each area and exact location labelled by the number in the first column (the separate scenes, the Corporate District, the Temple and the VR rooms, are listed here only).
- A photo's METADATA shows the chain most specific first, e.g. "The Bar · The Darknet District · Old Town · NeoChinatown · Tessaly System".

## The system, the planet and the city

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 1 | System | Tessaly System | Tessaly System | universe.js (system "sol") | The star system. |  |
| 2 | Planet | Tessaly System › NeoChinatown | **PROPOSED:** NeoChinatown | universe.js shows "NeoChinatown" for the planet (id earth) | The planet. Its own name is not settled: the city's name stands in. |  |
| 3 | City | Tessaly System › NeoChinatown › NeoChinatown | NeoChinatown | universe.js, signs | The city. |  |

## Areas

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 4 | Area | Tessaly System › NeoChinatown › NeoChinatown › The Port | The Port | ncz-quarters.js | The landing pad and the passage north of Port Customs. |  |
| 5 | Area | Tessaly System › NeoChinatown › NeoChinatown › Old Town | Old Town | ncz-quarters.js | Main Street between the North and South Gates, the alley, the access road; the District and NULL. |  |
| 6 | Area | Tessaly System › NeoChinatown › NeoChinatown › The Avenue | The Avenue | ncz-quarters.js | The wide road across the top, Function Gate to East Gate. |  |
| 7 | Area | Tessaly System › NeoChinatown › NeoChinatown › Far South | Far South | ncz-quarters.js | Main Street south of the South Gate: Milked, its side street and service alley. |  |
| 8 | Area | Tessaly System › NeoChinatown › NeoChinatown › The Outskirts | The Outskirts | ncz-quarters.js | Past the Far South Gate: container homes on gravel. |  |
| 9 | Area | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District | The Corporate District | corporate.js, gate sign | Its own scene, through the Function Gate. |  |
| 10 | Area | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple | Zen Zephyr’s Temple | temple.js | Its own hilltop scene, through the East Gate. |  |
| 11 | Area (group) | Tessaly System › NeoChinatown › NeoChinatown › Gates and checkpoints | Gates and checkpoints | ncz-quarters.js | The six checkpoint buildings between the quarters. |  |
| 12 | Area (group) | Tessaly System › NeoChinatown › NeoChinatown › VR | VR | the owner ("each VR room under VR") | The simulations entered from the District's VR play area. |  |

## The Port

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 13 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Port › Landing pad | Landing pad | neochinatown.js (landing-pad) | The pad itself, west of the passage. |  |
| 14 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Port › Landing pad › Landing terminal | Landing terminal | terminal screen "LANDING TERMINAL" | The terminal at the pad's south-east corner. |  |
| 15 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Port › The passage by the landing pad | The passage by the landing pad | neochinatown.js (old taxi zone name) | The passage from Port Customs north to the pad. |  |
| 16 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Port › The passage by the landing pad › Taxi stop · The Port | Taxi stop · The Port | ncz-quarters.js STOPS | The taxi pole on the passage. |  |

## Old Town

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 17 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — north end | **PROPOSED:** Main Street — north end | — | Main Street from the North Gate down to just before NULL. |  |
| 18 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — outside NULL | **PROPOSED:** Main Street — outside NULL | — | Main Street in front of NULL, where the District alley opens on the east side. |  |
| 19 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — outside NULL › Taxi stop · NULL / the alley | Taxi stop · NULL / the alley | ncz-quarters.js STOPS | The taxi pole south of the alley mouth. |  |
| 20 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — middle | **PROPOSED:** Main Street — middle | — | Main Street between NULL and the south end, with the Main Street taxi stop. |  |
| 21 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — middle › Taxi stop · Main Street | Taxi stop · Main Street | ncz-quarters.js STOPS | The taxi pole on Main Street's east side. |  |
| 22 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — south end | **PROPOSED:** Main Street — south end | — | Main Street's south end, up to the South Gate; the access road joins on the west. |  |
| 23 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — south end › Main Street / access road corner | **PROPOSED:** Main Street / access road corner | — | Where the access road meets Main Street. |  |
| 24 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Access road | **PROPOSED:** Access road | — | The road west from Main Street towards the Port passage. |  |
| 25 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Passage to Port Customs | **PROPOSED:** Passage to Port Customs | — | The short passage from the access road up to Port Customs. |  |
| 26 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The District alley | The District alley | places.js (Mission 002), music zone "alley" | The alley east off Main Street to the District's door. |  |
| 27 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The District alley › Outside the District door | Outside the District door | map point "Darknet District entrance" | The alley's east end, at the District's door and its taxi pole. |  |
| 28 | Venue | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District | The Darknet District | signs, universe.js | The building at the alley's east end. |  |
| 29 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › The District security vestibule | The District security vestibule | places.js, map "Security vestibule" | Between the street door and the inner door. |  |
| 30 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › The District hallway | The District hallway | places.js | The long hallway from the vestibule to the pod room. |  |
| 31 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › Sleeping Pod room | Sleeping Pod room | pod prompts "SLEEPING POD" | The back room: the ten pods, the wardrobe, the stairs. |  |
| 32 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › VR play area | VR play area | places.js, prompt "ACCESS VR EXPERIENCES" | First room on the left: the booths and the VR terminal. |  |
| 33 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › Vending alcove | Vending alcove | neochinatown.js, prompt "VENDING MACHINES" | The small alcove on the left with the three machines. |  |
| 34 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › The Arcade | The Arcade | places.js, arcade cabinets | The small room on the left with five cabinets. |  |
| 35 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › The Store (Admin and Iris) | The Store (Admin and Iris) | places.js, prompt "BROWSE THE SHOP" | Second room on the right: Admin and Iris at the counter. |  |
| 36 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › The Bar | The Bar | universe.js "bar", prompt "TALK TO THE BARTENDER" | First room on the right: the bar and the oxygen bar. |  |
| 37 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › The meeting room | The meeting room | places.js | Third room on the right, its door kept shut unless Admin opens it. |  |
| 38 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › Smoking terrace | Smoking terrace | map building "Smoking terrace" | The open roof up the stairs from the pod room. |  |
| 39 | Venue | Tessaly System › NeoChinatown › NeoChinatown › Old Town › NULL | NULL | club sign "NULL" | The nightclub on Main Street's west side. |  |
| 40 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › NULL › NULL entrance | NULL entrance | places.js (Mission 002) | The entry passage from Main Street. |  |
| 41 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › NULL › Main floor | Main floor | the owner's list (entrance, main floor, bar, DJ, VIP) | The dance floor and the tables: the club apart from the bar, the DJ and the VIP corner. |  |
| 42 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › NULL › Bar | Bar | ncz-nightclub.js (bar, bartender) | Along the north wall; Juno Vex sits at its east end. |  |
| 43 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › NULL › DJ booth | DJ booth | ncz-nightclub.js (DJ desk) | The DJ desk and riser at the west end. |  |
| 44 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › NULL › VIP corner | VIP corner | ncz-nightclub.js (VIP corner) | The sofa and table on the south wall. |  |
| 139 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — south end › DRAGON NOODLES shopfront | DRAGON NOODLES shopfront | shop sign "DRAGON NOODLES" | Shopfront on Main Street — south end, west side (a facade; no interior). |  |
| 140 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — middle › ELECTRONICS shopfront | ELECTRONICS shopfront | shop sign "ELECTRONICS" | Shopfront on Main Street — middle, west side (a facade; no interior). |  |
| 141 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — middle › PHARMACY 24H shopfront | PHARMACY 24H shopfront | shop sign "PHARMACY 24H" | Shopfront on Main Street — middle, west side (a facade; no interior). |  |
| 142 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — outside NULL › TEA HOUSE shopfront | TEA HOUSE shopfront | shop sign "TEA HOUSE" | Shopfront on Main Street — outside NULL, west side (a facade; no interior). |  |
| 143 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — north end › TACOS · 24H shopfront | TACOS · 24H shopfront | shop sign "TACOS · 24H" | Shopfront on Main Street — north end, west side (a facade; no interior). |  |
| 144 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — north end › RAMEN · BAR shopfront | RAMEN · BAR shopfront | shop sign "RAMEN · BAR" | Shopfront on Main Street — north end, west side (a facade; no interior). |  |
| 145 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — north end › REPAIR · 修理 shopfront | REPAIR · 修理 shopfront | shop sign "REPAIR · 修理" | Shopfront on Main Street — north end, west side (a facade; no interior). |  |
| 146 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — south end › LAUNDRY shopfront | LAUNDRY shopfront | shop sign "LAUNDRY" | Shopfront on Main Street — south end, east side (a facade; no interior). |  |
| 147 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — middle › BIO-CLINIC shopfront | BIO-CLINIC shopfront | shop sign "BIO-CLINIC" | Shopfront on Main Street — middle, east side (a facade; no interior). |  |
| 148 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — middle › CHAI · 茶 shopfront | CHAI · 茶 shopfront | shop sign "CHAI · 茶" | Shopfront on Main Street — middle, east side (a facade; no interior). |  |
| 149 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — outside NULL › NOODLES shopfront | NOODLES shopfront | shop sign "NOODLES" | Shopfront on Main Street — outside NULL, east side (a facade; no interior). |  |
| 150 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — outside NULL › NIGHT MARKET shopfront | NIGHT MARKET shopfront | shop sign "NIGHT MARKET" | Shopfront on Main Street — outside NULL, east side (a facade; no interior). |  |
| 151 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — outside NULL › DRAGON NOODLES shopfront | DRAGON NOODLES shopfront | shop sign "DRAGON NOODLES" | Shopfront on Main Street — outside NULL, east side (a facade; no interior). |  |
| 152 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — north end › ELECTRONICS shopfront | ELECTRONICS shopfront | shop sign "ELECTRONICS" | Shopfront on Main Street — north end, east side (a facade; no interior). |  |
| 153 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Old Town › Main Street — north end › PHARMACY 24H shopfront | PHARMACY 24H shopfront | shop sign "PHARMACY 24H" | Shopfront on Main Street — north end, east side (a facade; no interior). |  |

## The Avenue

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 45 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — west end | **PROPOSED:** The Avenue — west end | — | From the Function Gate to the North Gate junction. |  |
| 46 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — west end › Taxi stop · Function Gate | Taxi stop · Function Gate | ncz-quarters.js STOPS | The taxi pole near the Function Gate. |  |
| 47 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — west end › Taxi stop · The Avenue | Taxi stop · The Avenue | ncz-quarters.js STOPS | The taxi pole west of the North Gate. |  |
| 48 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — at the North Gate | **PROPOSED:** The Avenue — at the North Gate | — | Where the North Gate opens onto the Avenue. |  |
| 49 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — middle | **PROPOSED:** The Avenue — middle | — | The Avenue east of the North Gate. |  |
| 50 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — east end | **PROPOSED:** The Avenue — east end | — | The Avenue up to the East Gate. |  |
| 51 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — east end › Taxi stop · East Gate | Taxi stop · East Gate | ncz-quarters.js STOPS | The taxi pole near the East Gate. |  |
| 119 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — west end › DRAGON NOODLES shopfront | DRAGON NOODLES shopfront | shop sign "DRAGON NOODLES" | Shopfront on The Avenue — west end, north side (a facade; no interior). |  |
| 120 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — west end › ELECTRONICS shopfront | ELECTRONICS shopfront | shop sign "ELECTRONICS" | Shopfront on The Avenue — west end, north side (a facade; no interior). |  |
| 121 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — west end › PHARMACY 24H shopfront | PHARMACY 24H shopfront | shop sign "PHARMACY 24H" | Shopfront on The Avenue — west end, north side (a facade; no interior). |  |
| 122 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — at the North Gate › TEA HOUSE shopfront | TEA HOUSE shopfront | shop sign "TEA HOUSE" | Shopfront on The Avenue — at the North Gate, north side (a facade; no interior). |  |
| 123 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — at the North Gate › TACOS · 24H shopfront | TACOS · 24H shopfront | shop sign "TACOS · 24H" | Shopfront on The Avenue — at the North Gate, north side (a facade; no interior). |  |
| 124 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — at the North Gate › RAMEN · BAR shopfront | RAMEN · BAR shopfront | shop sign "RAMEN · BAR" | Shopfront on The Avenue — at the North Gate, north side (a facade; no interior). |  |
| 125 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — middle › REPAIR · 修理 shopfront | REPAIR · 修理 shopfront | shop sign "REPAIR · 修理" | Shopfront on The Avenue — middle, north side (a facade; no interior). |  |
| 126 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — middle › LAUNDRY shopfront | LAUNDRY shopfront | shop sign "LAUNDRY" | Shopfront on The Avenue — middle, north side (a facade; no interior). |  |
| 127 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — east end › BIO-CLINIC shopfront | BIO-CLINIC shopfront | shop sign "BIO-CLINIC" | Shopfront on The Avenue — east end, north side (a facade; no interior). |  |
| 128 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — east end › CHAI · 茶 shopfront | CHAI · 茶 shopfront | shop sign "CHAI · 茶" | Shopfront on The Avenue — east end, north side (a facade; no interior). |  |
| 129 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — west end › DRAGON NOODLES shopfront | DRAGON NOODLES shopfront | shop sign "DRAGON NOODLES" | Shopfront on The Avenue — west end, south side (a facade; no interior). |  |
| 130 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — west end › ELECTRONICS shopfront | ELECTRONICS shopfront | shop sign "ELECTRONICS" | Shopfront on The Avenue — west end, south side (a facade; no interior). |  |
| 131 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — west end › PHARMACY 24H shopfront | PHARMACY 24H shopfront | shop sign "PHARMACY 24H" | Shopfront on The Avenue — west end, south side (a facade; no interior). |  |
| 132 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — middle › TEA HOUSE shopfront | TEA HOUSE shopfront | shop sign "TEA HOUSE" | Shopfront on The Avenue — middle, south side (a facade; no interior). |  |
| 133 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — middle › TACOS · 24H shopfront | TACOS · 24H shopfront | shop sign "TACOS · 24H" | Shopfront on The Avenue — middle, south side (a facade; no interior). |  |
| 134 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — middle › RAMEN · BAR shopfront | RAMEN · BAR shopfront | shop sign "RAMEN · BAR" | Shopfront on The Avenue — middle, south side (a facade; no interior). |  |
| 135 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — middle › REPAIR · 修理 shopfront | REPAIR · 修理 shopfront | shop sign "REPAIR · 修理" | Shopfront on The Avenue — middle, south side (a facade; no interior). |  |
| 136 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — middle › LAUNDRY shopfront | LAUNDRY shopfront | shop sign "LAUNDRY" | Shopfront on The Avenue — middle, south side (a facade; no interior). |  |
| 137 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — east end › BIO-CLINIC shopfront | BIO-CLINIC shopfront | shop sign "BIO-CLINIC" | Shopfront on The Avenue — east end, south side (a facade; no interior). |  |
| 138 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Avenue › The Avenue — east end › CHAI · 茶 shopfront | CHAI · 茶 shopfront | shop sign "CHAI · 茶" | Shopfront on The Avenue — east end, south side (a facade; no interior). |  |

## Far South

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 52 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — north end | **PROPOSED:** Far South Main Street — north end | — | Main Street just south of the South Gate. |  |
| 53 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — middle | **PROPOSED:** Far South Main Street — middle | — | Main Street between the South Gate and Milked. |  |
| 54 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked corner | Milked corner | ncz-quarters.js STOPS (taxi stop name) | Main Street in front of Milked, where its side street and service alley open. |  |
| 55 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked corner › Taxi stop · Milked corner | Taxi stop · Milked corner | ncz-quarters.js STOPS | The taxi pole on the east side. |  |
| 56 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — south end | **PROPOSED:** Far South Main Street — south end | — | Main Street down to the Far South Gate. |  |
| 57 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked side street | **PROPOSED:** Milked side street | — | The quiet dead-end side street to Milked's front door. |  |
| 58 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked service alley | Milked service alley | milked.js "rear door (service alley)" | The alley behind Milked, at its rear door. |  |
| 59 | Venue | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked | Milked | sign "MILKED" | The studio building off Far South's Main Street. |  |
| 60 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Security vestibule | Security vestibule | milked.js ROOMS | Inside the front door. |  |
| 61 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Reception | Reception | milked.js ROOMS | Eva's desk and the waiting area. |  |
| 62 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Studio hallway | Studio hallway | milked.js ROOMS | Between the four studios; the STAFF ONLY door at its far end. |  |
| 63 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Studio 1 | Studio 1 | milked.js ROOMS | Studio, north-west (closed). |  |
| 64 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Studio 2 | Studio 2 | milked.js ROOMS | Studio, north-east (closed). |  |
| 65 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Studio 3 | Studio 3 | milked.js ROOMS | Studio, south-west (closed). |  |
| 66 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Studio 4 | Studio 4 | milked.js ROOMS | Studio, south-east (closed). |  |
| 67 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Fish's office | Fish's office | milked.js ROOMS | Fish's office, staff only. |  |
| 68 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Staff corridor | Staff corridor | milked.js ROOMS | From the STAFF ONLY door to the rear lobby. |  |
| 69 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Rear lobby | Rear lobby | milked.js ROOMS | Inside the rear door from the service alley. |  |
| 70 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Rear corridor | Rear corridor | milked.js ROOMS | Along the back of the building. |  |
| 71 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Dressing room A | Dressing room A | milked.js ROOMS | Behind reception. |  |
| 72 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Dressing room B | Dressing room B | milked.js ROOMS | Behind reception (closed). |  |
| 73 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Staff restroom 1 | Staff restroom 1 | milked.js ROOMS | Staff restroom (closed). |  |
| 74 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked › Staff restroom 2 | Staff restroom 2 | milked.js ROOMS | Staff restroom (closed). |  |
| 154 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — south end › TACOS · 24H shopfront | TACOS · 24H shopfront | shop sign "TACOS · 24H" | Shopfront on Far South Main Street — south end, west side (a facade; no interior). |  |
| 155 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — south end › RAMEN · BAR shopfront | RAMEN · BAR shopfront | shop sign "RAMEN · BAR" | Shopfront on Far South Main Street — south end, west side (a facade; no interior). |  |
| 156 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked corner › REPAIR · 修理 shopfront | REPAIR · 修理 shopfront | shop sign "REPAIR · 修理" | Shopfront on Milked corner, west side (a facade; no interior). |  |
| 157 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — middle › LAUNDRY shopfront | LAUNDRY shopfront | shop sign "LAUNDRY" | Shopfront on Far South Main Street — middle, west side (a facade; no interior). |  |
| 158 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — middle › BIO-CLINIC shopfront | BIO-CLINIC shopfront | shop sign "BIO-CLINIC" | Shopfront on Far South Main Street — middle, west side (a facade; no interior). |  |
| 159 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — north end › CHAI · 茶 shopfront | CHAI · 茶 shopfront | shop sign "CHAI · 茶" | Shopfront on Far South Main Street — north end, west side (a facade; no interior). |  |
| 160 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — north end › NOODLES shopfront | NOODLES shopfront | shop sign "NOODLES" | Shopfront on Far South Main Street — north end, west side (a facade; no interior). |  |
| 161 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — north end › NIGHT MARKET shopfront | NIGHT MARKET shopfront | shop sign "NIGHT MARKET" | Shopfront on Far South Main Street — north end, west side (a facade; no interior). |  |
| 162 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — south end › DRAGON NOODLES shopfront | DRAGON NOODLES shopfront | shop sign "DRAGON NOODLES" | Shopfront on Far South Main Street — south end, east side (a facade; no interior). |  |
| 163 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — south end › ELECTRONICS shopfront | ELECTRONICS shopfront | shop sign "ELECTRONICS" | Shopfront on Far South Main Street — south end, east side (a facade; no interior). |  |
| 164 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked corner › PHARMACY 24H shopfront | PHARMACY 24H shopfront | shop sign "PHARMACY 24H" | Shopfront on Milked corner, east side (a facade; no interior). |  |
| 165 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Milked corner › TEA HOUSE shopfront | TEA HOUSE shopfront | shop sign "TEA HOUSE" | Shopfront on Milked corner, east side (a facade; no interior). |  |
| 166 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — middle › TACOS · 24H shopfront | TACOS · 24H shopfront | shop sign "TACOS · 24H" | Shopfront on Far South Main Street — middle, east side (a facade; no interior). |  |
| 167 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — north end › RAMEN · BAR shopfront | RAMEN · BAR shopfront | shop sign "RAMEN · BAR" | Shopfront on Far South Main Street — north end, east side (a facade; no interior). |  |
| 168 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Far South › Far South Main Street — north end › REPAIR · 修理 shopfront | REPAIR · 修理 shopfront | shop sign "REPAIR · 修理" | Shopfront on Far South Main Street — north end, east side (a facade; no interior). |  |

## The Outskirts

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 75 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Outskirts › Container yard — north | **PROPOSED:** Container yard — north | — | The gravel hub just inside the Far South Gate. |  |
| 76 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Outskirts › Container yard — north › Kai Kryptos’ home | Kai Kryptos’ home | ncz-containers.js KAI_HOME | In front of the door of the container reserved for Kai (east side of the hub). |  |
| 77 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Outskirts › Container yard — south | **PROPOSED:** Container yard — south | — | The winding walkways at the back of the hub. |  |
| 78 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Outskirts › West lane | **PROPOSED:** West lane | — | The lane west off the hub, ending at a container. |  |
| 79 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Outskirts › East lane | **PROPOSED:** East lane | — | The lane east off the hub, ending at a container. |  |

## The Corporate District

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 86 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › Main Boulevard | Main Boulevard | corporate.js map | A street of the Corporate District. |  |
| 87 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › North Plaza | North Plaza | corporate.js map | A plaza of the Corporate District. |  |
| 88 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › South Plaza | South Plaza | corporate.js map | A plaza of the Corporate District. |  |
| 89 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › West Cross Street | West Cross Street | corporate.js map | A street of the Corporate District. |  |
| 90 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › Checkpoint Street | Checkpoint Street | corporate.js map | A street of the Corporate District. |  |
| 91 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › East Cross Street | East Cross Street | corporate.js map | A street of the Corporate District. |  |
| 92 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › North Service Road | North Service Road | corporate.js map | A street of the Corporate District. |  |
| 93 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › Narrow Alley A | Narrow Alley A | corporate.js map | A alley of the Corporate District. |  |
| 94 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › Narrow Alley B | Narrow Alley B | corporate.js map | A alley of the Corporate District. |  |
| 95 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › Narrow Alley C | Narrow Alley C | corporate.js map | A alley of the Corporate District. |  |
| 96 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › South Street | South Street | corporate.js map | A street of the Corporate District. |  |
| 97 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › Back Alley | Back Alley | corporate.js map | A alley of the Corporate District. |  |
| 98 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › South Plaza › Taxi pad | Taxi pad | prompt "TAXI · RETURN TO NEOCHINATOWN" | Where the taxi sets down and the walk to the Function Gate starts. |  |
| 99 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › South Plaza › Function Gate (walk to NeoChinatown) | Function Gate (walk to NeoChinatown) | prompt "FUNCTION GATE · WALK TO NEOCHINATOWN" | The way back on foot. |  |
| 100 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › Checkpoint Street › Security checkpoint | Security checkpoint | prompt "SECURITY CHECKPOINT" | The checkpoint on Checkpoint Street. |  |
| 101 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › The Corporate District › North Plaza › Headquarters entrance | Headquarters entrance | prompt "HEADQUARTERS ENTRANCE" | The guarded door of the headquarters tower. |  |

## Zen Zephyr’s Temple

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 102 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Temple grounds | **PROPOSED:** Temple grounds | — | The rest of the hilltop plateau inside the parapet. |  |
| 103 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Arrival terrace | Arrival terrace | temple.js map | Part of the Temple grounds (plaza). |  |
| 104 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Approach | Approach | temple.js map | Part of the Temple grounds (street). |  |
| 105 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Courtyard | Courtyard | temple.js map | Part of the Temple grounds (plaza). |  |
| 106 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Overlook | Overlook | temple.js map | Part of the Temple grounds (plaza). |  |
| 107 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Main chamber | Main chamber | temple.js map | Part of the Temple grounds (street). |  |
| 108 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Arrival terrace › Taxi stop | Taxi stop | temple.js map "Taxi stop" | Where the taxi sets down. |  |
| 109 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Approach › Courtyard gate | Courtyard gate | temple.js map "Courtyard gate" | The gate between the terrace and the courtyard. |  |
| 110 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Main chamber › Zen Zephyr’s dais | Zen Zephyr’s dais | temple.js map | In front of the monk's dais. |  |
| 111 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Main chamber › Data altar 1 | Data altar 1 | altar text "DATA ALTAR 1" | Beside data altar 1. |  |
| 112 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Main chamber › Data altar 2 | Data altar 2 | altar text "DATA ALTAR 2" | Beside data altar 2. |  |
| 113 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Main chamber › Data altar 3 | Data altar 3 | altar text "DATA ALTAR 3" | Beside data altar 3. |  |
| 114 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Zen Zephyr’s Temple › Main chamber › Data altar 4 | Data altar 4 | altar text "DATA ALTAR 4" | Beside data altar 4. |  |

## Gates and checkpoints

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 80 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Gates and checkpoints › Port Customs (A1) | Port Customs (A1) | gate sign "CUSTOMS" | Checkpoint between Old Town and The Port. |  |
| 81 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Gates and checkpoints › North Gate (A2) | North Gate (A2) | gate sign "NORTH GATE" | Checkpoint between Old Town and The Avenue. |  |
| 82 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Gates and checkpoints › Function Gate (A3) | Function Gate (A3) | gate sign "FUNCTION GATE" | Checkpoint between the Corporate District and The Avenue. |  |
| 83 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Gates and checkpoints › East Gate (A4) | East Gate (A4) | gate sign "EAST GATE" | Checkpoint between The Avenue and the Temple. |  |
| 84 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Gates and checkpoints › South Gate (A5) | South Gate (A5) | gate sign "SOUTH GATE" | Checkpoint between Far South and Old Town. |  |
| 85 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › Gates and checkpoints › Far South Gate (A6) | Far South Gate (A6) | gate sign "FAR SOUTH GATE" | Checkpoint between The Outskirts and Far South. |  |

## VR

| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner's name |
|---|---|---|---|---|---|---|
| 115 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › VR › Play in a Bedroom | Play in a Bedroom | VR menu title | The bedroom suite simulation. |  |
| 116 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › VR › Tropical Escape | Tropical Escape | VR menu title | The beach simulation. |  |
| 117 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › VR › Relax in a Forest | Relax in a Forest | VR menu title | The forest simulation. |  |
| 118 | Exact location | Tessaly System › NeoChinatown › NeoChinatown › VR › Combat Simulator | Combat Simulator | VR title | The combat range (not listed in the VR menu). |  |

## For Claude and Codex

`void-runner/places.js` is the registry (`NODES`, `chain()`, `deepest()`, `options()`), tested by `tests/places-names.test.cjs` (a 1 m grid over every walkable area resolves to a named exact location). When the owner fills in a name, change `name` (and drop `proposed`) in places.js; never change an `id`. Then rerun this tool and the map script.
