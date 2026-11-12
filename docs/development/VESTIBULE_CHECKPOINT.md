# The security vestibule checkpoint

The vestibule joins NeoChinatown's street and The Darknet District's interior. It is built in both environments, so a player stands in the same place before and after the exchange. Code: `void-runner/district-transition.js` (the sequence), `void-runner/district-area.js` (zones), `void-runner/neochinatown.js` (doors and their sensors), `void-runner/district-transition.css` (the scan).

## What the player experiences (both directions are the same)

1. Walk up to the door. It opens by itself; no key press.
2. Walk into the vestibule. Nothing happens until the middle is reached.
3. In the middle, both doors close. The player can still move; stepping back out calls it off.
4. When the door sensors report both doors shut, the scan covers the view. Only now is the other environment loaded.
5. The scan clears with the player in exactly the same spot, facing the same way.
6. The far door opens. The door behind stays shut.

## Rules

| Rule | How it is enforced |
|---|---|
| Loading only in the middle | `VoidDistrictArea.CENTRE` (local z 21.8 to 24.2, clear of both doorways). |
| Loading only with both doors shut | `doors.closed()`: every panel fully shut and its collision in place. The sequence waits on this, not on a timer. |
| Never both doors open | In the street environment the inner door cannot open; in the interior the outer door cannot open (`isOpenable`). New doors built during a transfer start sealed. |
| No trapped player | Doors that stop moving for 9 seconds, a failed load or any error end in RECOVERY: the player is put back and the door they came through is held open. |
| No immediate return trip | After a transfer the player must leave the vestibule before the checkpoint arms again. |
| No fake progress | The status lines change when the real steps happen; there is no percentage and no timed bar. |
| Wording | Security checkpoint terms only. |

## States (`VoidDistrict.state`, `VoidDistrict.history`)

`IDLE` → `ENTRY_DOOR_OPEN` (player is in the vestibule) → `ENTRY_DOOR_CLOSING` → `VESTIBULE_SECURED` → `SECURITY_SCAN` → `DESTINATION_LOADING` → `DESTINATION_READY` → `EXIT_DOOR_OPEN` → `COMPLETE`; `RECOVERY` on any failure. `VoidDistrict.sealed` holds what the door sensors reported when the vestibule was declared sealed.

## Door controls (`VoidBabylon.district.doors`)

`secure(on)`, `closed()`, `openness()`, `release(id, seconds)`, `state()`. A sealed door still never closes on someone standing in the doorway.

## Multiplayer

The street is single-player; the interior is the shared room. Entering connects the player after the scan; leaving drops the connection a few seconds after the street loads. Other players are not shown the scan.

## Tests

- `tests/district-transition.test.cjs`: the sequence with fake doors (sensors, stuck doors, turning back, failed load, re-arming).
- `tests/vestibule-checkpoint-browser.cjs`: a real browser, watching every frame for a scan with an open door or two open doors.
- `tests/district-transition-browser.cjs`: that only one environment is ever loaded and nothing accumulates over repeated trips.

## Known limits

- The scan shows a still picture of the vestibule taken when the doors sealed, not live 3D, because the 3D scene is being replaced underneath.
- Verified with a software renderer only; door timing on real hardware is faster.
