# Docking and departure at stations (26 Nov 2026)

Branch `claude/station-graphics-overhaul`, build `2026-11-26-station-docking-2`. One shared system for all seven stations (Meridian, Kepler,
Rusthaven, the Foundry, the Belt Anchorage, the Vigil, Holdfast). Manual flight, combat, the jump, missions and the planets' landings are unchanged.

## Before (measured, `docs/development/station-graphics/docking-before.mp4`)
- **Departure:** the ship sat still for one second, then gained 9 m/s every second in a straight line to 18 m/s. When control came back, manual
  flight wanted 13.7 m/s, so the speed dropped from 18 to 13.7 at the hand-over. No rotation, no thrusters.
- **Docking:** when the jump ended the station slid toward the ship at a fixed 35 m/s for three seconds and stopped dead (13 m in one frame to
  nothing in the next), whatever the ship's own speed was. The ship's nose was pulled to zero by a fixed blend. Then the loading screen.

## After (`docking-after.mp4`)
- **Departure (about 8 s):** clamps release (1.2 s, a faint tremor, the release sound) → the ship creeps out under manoeuvring thrust, held to
  the station's limit (7 m/s) until it is 15 m past the mouth → the main engine comes up and the nose swings part of the way toward the route →
  control returns at exactly the speed and heading manual flight holds (13.7 m/s for the Kestrel at the launch throttle). Largest change of
  speed between two frames at 25 fps: 0.34 m/s.
- **Docking (about 18 s from the jump's end):** the station now comes up during the jump on a curve that ends at the ship's own speed, so
  there is no step when the approach begins. The ship keeps its velocity and attitude, turns the short way to face the hangar (no overshoot),
  closes at up to 34 m/s, brakes on a curve to 5 m/s outside the mouth, goes through the mouth at that speed or less, and settles on the pad
  with a critically damped stop (it does not pass the mark and come back). Clamps close (1.2 s), then the station loads behind the existing
  loading screen with the ship already at rest. Largest change in the station's frame-to-frame movement: 0.01 m.

## How it works
- `void-runner/docking.js` (`VoidDocking`, pure, unit-tested): the ship in the dock's frame with a position, velocity, a **quaternion** attitude
  and an angular velocity. Each 1/120 s step (so any frame rate gives the same flight): a desired velocity from a braking curve and a funnel onto
  the hangar's axis; thrust limited to `maxAcceleration` / `maxDeceleration`, and the thrust itself eases in and out; a torque-limited,
  critically damped turn. It reports what each thruster is doing from the acceleration the ship really has.
- `void-runner/docking-flight.js` (`VoidDockingFlight`): joins it to the game. The game keeps the ship at the centre and moves the world, so the
  station is drawn at the ship's place in the dock frame, reversed. It writes the flight's yaw, pitch, roll, rates and velocity, so the stars,
  rocks and traffic move with it.
- Three small call sites: `world-integration.js` (departure, in place of the fixed ramp), `cockpit.js` (arrival, in place of the three-second
  timer; planets and a build without the system keep that timer), `babylon-renderer.js` and `babylon-integration.js` (where the station stands).
- **Camera:** it rides the hull, so it turns and moves as smoothly as the ship. Added: a fraction of a degree of lag under thrust and a faint
  tremor as the clamps close or release, eased in and out and fading to nothing after control returns. No forced camera angle.
- **Thrusters:** eight pale jets ahead of the cockpit (left, right, up, down, two retro), each as bright as the thrust on its axis. No flame, no
  smoke. Engine sound follows the thrust through the game's own throttle value, which is put back where the pilot left it at the hand-over.
- **The hangar (Blender, `tools/assets/station-kit/build_station_kit.py`):** two new pieces, `dock_clamp` (352 triangles; four stand round the
  pad and lean in over the hull as the ship stops) and `guide_light` (46; rows in the deck and along the mouth's lip that run toward the pad:
  amber for a ship coming in, steady green once it is held, white as it leaves). The pad ring now sits under the docking point.
- **Sounds:** the game's existing events only (`cycle`, `door`, `boost`, `lock`, and `dock` from the existing arrival). No new audio files.
- **Meshy:** nothing new was generated for this part; the docking arms and thruster pods made for the hull overhaul are the Meshy assets in view.

## Configuration: `station-layouts.js` → `docking`
`defaults`, then `stations[id]`, then `ships[id]`; a hull's own flight figures (ships.js: acceleration, inertia, yaw rate) scale thrust and turning,
so the Spectre stops and turns sooner than the Kestrel.

| Value | Default | Meaning |
|---|---|---|
| `approachSpeed` | 34 m/s | fastest closing speed |
| `finalSpeed` | 5 m/s | through the mouth and onto the pad |
| `finalDistance` | 9 m | how far outside the mouth the final speed starts |
| `departureSpeed` | 7 m/s | limit inside and just outside the hangar |
| `maxAcceleration` / `maxDeceleration` | 9 / 11 m/s² | thrust limits |
| `maxRotationSpeed` | 0.6 rad/s | how fast it may turn itself |
| `alignmentTolerance` | 0.012 rad | how straight before the clamps close |
| `thrusterIntensity` | 1 | brightness of the manoeuvring jets |
| `safeDepartureDistance` | 15 m | past the mouth before the main engine |
| `cameraSmoothing` | 0.35 s | the view's lag |
| `transitionSeconds` | 1.2 s | how long the clamps take |
| `startDistance` | 130 m | where the approach begins, from the pad |

Per station: the Vigil is slower and more exact (34→30 m/s, final 4, tighter tolerance, quieter jets, slower clamps); Holdfast, the Foundry
and Rusthaven are rougher (brighter jets, quicker or slower clamps); the Belt Anchorage starts closer and slower. All seven share the hangar.

## Tests
`tests/docking.test.cjs` (9 tests): values present for every station; arrival keeps its starting position, velocity and attitude; ends at rest on
the mark, level, never more than half a metre past it, from five different angles and speeds (including flying away from the station and facing
backward); speed and attitude never change faster than the thrust allows; the same flight at 24, 30, 60 and 144 frames a second; departure
holds still while clamped, keeps the speed limit near the hangar, ends at the hand-over speed along the nose for three hulls at three stations,
and leaves the jump alignment to the pilot; the reveal ends at the approach's speed.
In the browser (software rendering, the animation clock stepped 40 ms a frame so the clips are true game time): a full departure, the end of a
jump and a docking at Low and at Medium, no page errors; the motion log has no step in speed, position or attitude.

## Not done / limits
- **Not flown on a real graphics card or with a real pilot's hands.** Timings are a first tuning; the table above is where to change them.
- Docking takes about 18 s and departure about 8 s (they were 3 s and 4 s). Shorter: raise `finalSpeed`, lower `startDistance`.
- The ship's own main-engine glow cannot be seen from the cockpit, which is the only flight view; only the manoeuvring jets are drawn.
- The second browser run asked for the Spectre but the test's save did not switch hulls, so both clips are the Kestrel. Three hulls are
  covered by the unit tests.
- Multiplayer: flight is single-player, so there is nothing to synchronise.
- In flight, Medium and High still apply the game's 0.3 brightness pass (the full range is used only aboard a station), so a hangar seen from
  the cockpit on Medium is darker than the same hangar on foot.
- A loading stall cannot move the ship: the station loads only after the ship is clamped and at rest.
