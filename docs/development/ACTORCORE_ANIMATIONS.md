# ActorCore motion capture and the shared animation library

The owner bought ActorCore (Reallusion) motion capture and sent two downloads on 16 Nov 2026 (Blender preset, 60 fps, CC3+ skeleton, 101 bones). His brief: use them for VR companions, the Milked dancers and general NPCs; support group and synchronised interactions; build a reusable library; keep the originals out of the public repository; **check the licence before publishing**.

## STATUS: PUBLISHED on 16 Nov 2026. The owner decided: "Publish with the existing protection" (the same packing and encryption as the other licensed models). The library file is in the private asset repository (`void-runner/assets/models/anim/anim-actorcore.vrpak`) and is sealed into the site at the Pages build.

## Inventory (14 motions)

| Library clip id | Source file | Length | Use |
|---|---|---|---|
| `ac-sit-bench-1` | sit_bench01_208690.fbx | 27.7 s | sitting on a bench |
| `ac-sit-bench-4` | sit_bench04_208684.fbx | 26.5 s | sitting on a bench |
| `ac-stand-curve-2` | stand_curve02_208701.fbx | 12.4 s | standing pose |
| `ac-stand-curve-3` | stand_curve03_208702.fbx | 10.3 s | standing pose |
| `ac-ground-pose-2` | ground_pose02_208677.fbx | 21.2 s | floor pose |
| `ac-ground-pose-3` | ground_pose03_208678.fbx | 20.1 s | floor pose |
| `ac-ground-pose-4` | ground_pose04_208679.fbx | 18.4 s | floor pose |
| `ac-sensual-dance-3` | sensual-dance-03.fbx | 9.2 s | slow dance |
| `ac-sensual-movement-1` | sensual-movement-01.fbx | 24.0 s | slow movement |
| `ac-3sit-chat-g1-f1` | 3sit-chat-g1-f1.fbx | 17.9 s | three seated, set 1, seat 1 |
| `ac-3sit-chat-drink-g2-f2` | 3sit-chat-drink-g2-f2.fbx | 17.6 s | three seated with drinks, set 2, seat 2 |
| `ac-3sit-chat-drink-g2-f3` | 3sit-chat-drink-g2-f3.fbx | 17.6 s | three seated with drinks, set 2, seat 3 |
| `ac-cuddle-kiss-f` | cuddle-kiss-f.fbx | 19.0 s | cuddle and kiss, her part |
| `ac-sit-cuddle-hug-f` | sit-cuddle-hug-f.fbx | 12.0 s | seated cuddle and hug, her part |

**Missing partners (do not force mismatched parts together):** set 1 has only seat 1 (seats 2 and 3 missing); set 2 has seats 2 and 3 (seat 1 missing); both cuddle clips are the woman's half only. `VoidAnimLibrary.groups()` reports this. The missing parts must either be bought or made in Blender to fit.

Originals: the two zips the owner uploaded, unpacked in the cloud session at `/home/user/actorcore/` (outside the repository; gone when the session ends) and on the owner's PC wherever he downloaded them. They are never committed.

## Licence position (read before publishing)

- Reallusion's current content licence policy says exportable content bought with the Standard License can be exported to any engine and used in games and interactive services.
- A Reallusion staff forum reply (2021) adds the condition that the end user of the game must not be able to download or extract the actual Reallusion content (characters, textures or animations). That is a forum statement, not licence text; the licence page itself could not be opened from the cloud session (the reallusion.com host is not on the session's allowed list).
- A browser game sends its files to the player's browser. Ours are retargeted onto our own skeleton, stored without any Reallusion mesh, packed (`.vrpak`) and encrypted at the Pages build like the other licensed models. That stops casual downloading; it cannot stop a determined person, because the game itself must be able to read the file.
- **So the question for the owner (or Reallusion support): is the protection we use for the other licensed assets acceptable for these animations?** Until he says yes, the library file is not put in the private asset repository and not deployed. The public repository only has the code.

## How it works

1. `tools/animation-pipeline/retarget_library.py <character.glb> <library.json> <out.glb>` (Blender, or `pip install bpy`): reads each FBX, maps CC3 / Mixamo / HumanIK / Unreal bone names to our Mixamo-named bones, re-aims each limb bone from our rest pose to the source's, copies world rotations, scales the hips' movement to our hip height, blends the loop seam, samples at 30 fps, and writes a skeleton-only GLB (no mesh). `root: inplace` keeps the hips over the start point (dances, standing poses); `root: free` keeps the recorded travel (sitting, floor poses).
2. `node tools/assets/pack-model.cjs out.glb void-runner/assets/models/anim/anim-actorcore.vrpak` (6.5 MB for the 14 clips).
3. `void-runner/anim-library.js` (`VoidAnimLibrary`): `CLIPS` is the catalogue (id, title, category, length, loop, group, part); `apply(node, look)` gives a figure the clips as ordinary animation groups named `<look>-<clip>` and adds them to `VoidCrowd.clips[look]`, so existing code plays them by name. Where the file is missing nothing happens.
4. The VR companions call `apply` when they are created (`vr-suite.js`).

To add a future purchase: put the FBX outside the repository, add a line to the library json and to `CLIPS`, rerun steps 1 and 2.

## Checked

In a browser, on Kai (MakeHuman male) in the companion room: standing pose, slow dance, bench sitting, floor pose, group seat and seated cuddle all read correctly (first attempt had arms out and bodies sinking; fixed by aiming each bone at the next bone of its limb). The library was retargeted on the female MakeHuman skeleton and applied to the male one.

## In use (16 Nov 2026)

- **VR companions** (`vr-suite.js`): a companion whose figure takes the library gets three more choices in the Together group: "Dance for me" (the two slow dances), "Strike a pose" (the two standing poses) and "Relax on the floor" (the three floor poses). They hold until the player chooses Stop. "Dance together" now sometimes picks a motion-capture dance. Checked on the new Kai (a Meshy 24-joint figure): a standing pose, the slow movement and two floor poses.
- The owner's idea for the group clips whose partners are missing (16 Nov): use the single seats where the other people are PLAYERS (two players and one companion: the companion plays her recorded seat and the players sit as themselves), or he may look for the missing parts. Not built yet.

## NOT done yet (the rest of the owner's brief)

- No bench or bar NPC uses them yet; the Milked dancers are part of the Milked redesign (in progress).
- Purchased companions (Ava, Eva, Yuki, Dex) and Nadia have their own skeletons; whether the library fits them has not been checked. The Meshy residents (24-joint rigs, no fingers) should take them but are unchecked.
- Group synchronisation, consent and exit for players, furniture alignment, transitions between activities, the NPC Editor listing, ElevenLabs companion voices, and the companion interaction UI are not started.
- Feet are not pinned (no inverse kinematics pass); some sliding or sinking is expected on figures of a different height.
