# VOID//RUNNER design source documents

These are David's own design documents, copied word for word. They are the source material for the game. They are **not** all current: later decisions changed some of what they say. When a document conflicts with `VOID_RUNNER_HANDOFF.md` (repository root), the handoff wins. The handoff records the later decisions.

| File | What it is | Status |
|---|---|---|
| `01-master-plan-oct-2026.md` | Complete game vision and roadmap (October 2026). | Vision and principles still hold. **Superseded parts:** "Sol System" is now **Tessaly**; Earth / Sacramento / J Street / Old Sacramento are **removed for now**; the District is in **NeoChinatown, Tessaly**; the Mission Log key is **L**, not F1; "Mars" is being renamed (working name **Vantor**). |
| `02-world-expansion-design-brief.md` | How story and world design must be done: approval stages, the proposal format, giving options, and not implementing before approval. | **Current. Binding process rules.** |
| `03-darknet-district-universe.md` | The Darknet District as an organization; Admin, Iris; the District's role in the campaign. | Organization, Admin and Iris descriptions hold. **Superseded:** Part 2's location (Earth, Sacramento, J Street). It is now NeoChinatown, Tessaly. |
| `04-darknet-district-facility-layout.md` | Official layout of the District in NeoChinatown. | **Current canon.** Built in `void-runner/neochinatown.js` (PR #44). |
| `05-scene-admin-communion-natural-order.md` | Admin's scene introducing the Communion and the Natural Order, with two delivery contracts. | **Script written by David. Implemented** (`void-runner/faction-scenes.js`). Destinations approved: The Vigil (Cantor System) and Holdfast (Garrow System). |
| `06-scene-iris-return-for-payment.md` | Return to the District for payment; Iris replaces Admin at the counter and offers the remaining delivery. | **Script written by David. Implemented** (`void-runner/faction-scenes.js`). |
| `07-scene-faction-cargo-recipients.md` | The two delivery recipients: Dr. Elara Voss (Communion) and Marcus Vale (Natural Order). | **Script written by David. Implemented** (`void-runner/faction-scenes.js`). |
| `08-faction-ship-battles-brief.md` | Small Communion vs Natural Order battles the player witnesses on the way to each delivery; faction ship designs. | **Brief written by David. Requested feature; not built yet** (planned as the PR after the deliveries). |

`../mission-tree.html` is the mission tree planning sheet as of 2026-10-15. It is also published at https://claude.ai/artifact/4YHQ76xMzfKyMDVuS3AMer and is slightly behind the handoff doc. For example, it still shows Meet Admin as "Earth, Sol in game today", which is no longer true.
