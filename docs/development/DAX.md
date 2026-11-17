# Dax

The owner's brief (15 Nov 2026): Dax is a Tier 3 advanced autonomous NPC, a bounty hunter and mercenary who lives on her own in NeoChinatown and The Darknet District. There is only one. She uses a V3 // Shadow. Her model is the purchased "Realistic Cyberpunk Girl" in the black outfit.

## What exists now (stage 1)

- **Her model in the game.** 57,000 triangles (from 315,000), 78 joints with the game's 52 named ones, seven clips (idle, talk, look, watch, walk, glance-back, shrug), textures at 1024 and below, 5.7 MB. It lives only in the private repository as `void-runner/assets/models/crowd/npc-dax.vrpak` and is encrypted and published with the site by the Pages workflow. It is not in this repository and must never be.
- **A life of her own in the District** (`void-runner/dax.js`). She moves between the bar, the store, the VR area, the arcade, the vending machines, the hallway and the pods end, stays a while, watches and looks about, uses her V3 (her left eye glows green: `street-gear.js` `eye()`), and about a fifth of the time is away from the District (she walks out through the vestibule and comes back the same way).
- **No server.** Where she is comes from the clock alone (`schedule(seconds)`), so every player sees her in the same place, and nothing is simulated while nobody is there. `tests/dax.test.cjs` checks that no route crosses a wall, that each hour starts where the last ended, and that she never jumps.
- **A profile** in the Players list and Social app (`district-people.js`): Bounty Hunter, Mercenary; the place line says where she is at that moment. Her picture is a labelled silhouette for now.
- **On a machine without her file** (any local checkout) she does not appear and the console says why once. Nobody stands in for her.

## How she was built (to repeat or change it)

1. `tools/animation-pipeline/prepare_dax.py` (Blender, on the PC that has the purchase): keeps her seven meshes, cuts the Rigify rig down to its deform bones, folds the 98 face bones into the head, rebuilds the materials, shrinks the images. Never saves over the source.
2. `tools/animation-pipeline/build_imported_character.py` with `characters/npc-dax.json`: cuts the triangle counts, removes skin hidden under the suit, thins hair and brows strand by strand, retargets the clips. The walk comes from a character the game already ships (`--crowd`, clip `walk-game` in `clips.json`), because the UAL library is not on the owner's PC.
3. `tools/assets/optimize-textures.cjs` (1024), then `tools/assets/pack-model.cjs`, then commit the `.vrpak` to the private repository.

Both Blender steps were run as separate background Blender processes through the Blender bridge, so the owner's open scene was never touched.

## Not done (each needs the owner)

| Part of the brief | What it needs |
|---|---|
| Talking to her; humour, declining, ending conversations | Her words and her **voice** (a new voice identity needs the owner's approval). Then lines, or the Iris API used sparingly with replies checked against an allowed list. |
| Memory of players, trust and suspicion, recruiting or hunting | A design for what she remembers and where it is stored (a save flag per player is enough for one-to-one memory; anything shared between players needs the server). Story weight: the owner decides. |
| Life outside the interior (streets, noodle stands, NULL) | Routes in the street scene, which loads separately from the interior; the same clock can drive it. |
| Social posts, selfies, tagging | The Social app has no posts yet; needs that feature first. |
| Other outfits | The purchase includes a white outfit (texture set only). |
| Facial expression and blinking | The model has face bones but no blink shapes; stage 1 folds the face into the head. |
| NPC editor entry | After the above exist to configure. |
| Subtle fashion rather than armour (brief, section 2) | The chosen model is armoured. The owner chose it; noted here because the brief says otherwise. |
| Her profile picture | Drawn from her own model once portraits can load a licensed model. |

## Licence

Royalty Free License (no AI), confirmed by the owner on 15 Nov 2026 from the listing: see `docs/VOID_RUNNER_ASSET_LICENSES.md`, "Dax". Her model must never be given to an AI generator (for example as a Meshy image or model input) or used for training.
