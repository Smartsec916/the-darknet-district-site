# Walking navigation audit · November 24, 2026

The production content manifest was version 3. It supplied interaction overrides and no replacement mission trees. The published story contains twelve missions. Flight directions, camera framing and device-only instructions use their own controls.

| Mission | Walking objective or transfer checked |
| --- | --- |
| 001 Awakening | Sleeping pod, District corridor, Admin's counter |
| 002 Eyes on the Street | District vestibule, Old Town street, NULL entrance, Juno and return to Admin |
| 003 Corporate Connections | Quarter pedestrian gates, Milked vestibule, Eva, Fish's office |
| 004 A Promising Investment | Underground entrance, checkpoint lane, tea room, return to Fish |
| 005 Behind Closed Doors | Avenue apartment, Reyes hallway access point, unlocked flat and street exit |
| 006 Hostile Takeover | Veyra lobby, lift to the offices, furniture clearance and return |
| 007 The House Always Wins | Underground fight pit, mission-specific cast, Far South tail and Blackrock entrance |
| 008 Private Network | Blackrock access point and contractor rooms |
| 009 Ghost in the Network | Corporate pedestrian gate, maintenance door and server facility |
| 010 The Price of Admission | Return to the District. The remote feed uses the device. |
| 011 Leverage | District meeting room and Admin. Waiting and calls keep their existing timers. |
| 012 First Cargo Delivery | Port, landing pad and station arrival. Boarding, flight and the ship app have separate guidance. |

## Reproducing the route checks

Run `node --test tests/guide-route*.test.cjs tests/underground-navigation.test.cjs tests/underground.test.cjs tests/awakening-qa.test.cjs`. The underground regression starts in Old Town at (15, −75), the Avenue at (25, 6), and Far South at (36, −190). For each start it walks to the underground tea room, then separately walks back from the tea room. It uses the game's player collision radius, forward movement and smoothed arrow bearing. Runtime tests also cover alternate starts, backtracking, a changed objective, closed and unlocked apartment doors, an elevator floor change, and a barrier that increases the indicated walking distance.

To reproduce in the game, track the tea room step in mission 004. Approach one entrance from the side of its railing. Follow the arrow around the railing and down the steps, use the landing door, and continue through the checkpoint lane to the tea room. Repeat from the other two streets. Track a surface goal from inside and use the return door. For mission 005, observe the hallway keypad before the hack and the apartment entrance after it. For mission 006, follow the arrow into the elevator cab and select the office floor.

All three stair flights were rendered in Chromium, looking up and down, on Low, Medium, High and Ultra. In the same night scene the sampled center foreground on Low rose from 44 to 73 looking down and 37 to 68 looking up (sRGB luminance on a 0–255 scale). There were no additional dynamic lights or shadows. The checkpoint opening retains the adjacent fence collider. Only the visual leaf across the public walking lane was removed.

## Coverage boundaries

The six underground legs use the game runtime and real door/zone handoffs in Chromium. The named place and modular-room suites exercise other approaches with the route planner and collision controller. The campaign browser harness advances movement-heavy steps with mission events. An uninterrupted, arrow-only human playthrough of all twelve missions, every alternate decision and every generated freight contract has not been verified. The distance label estimates the remaining walking route along known doors and waypoints, refined against obstacles in the loaded leg. Unknown geometry in an unloaded scene can change the estimate after transfer.
