# Dev Tools NPC Capability Audit

**Audit date:** 2026-11-18 / 2026-11-19 UTC  
**Repository:** `Smartsec916/the-darknet-district-site`  
**Audit baseline:** current `main` at the start of this audit, including the NPC placement, escort, schedule, appearance, voice, animation-index, Milked Studio View, Mission Editor and Developer Tools work already merged by Claude/Codex.

## Executive result

The editor already contains more capability detection than its category labels suggested. The most important unnecessary restriction found was the assumption that **every mission giver must have a walking-game TALK prompt**. That is only true for an **in-person offer**. The existing mission engine can already start a mission through Messages, Comms or a notification from any known NPC without a world TALK interaction.

This audit therefore unlocks **notification-started missions for any registered NPC** while preserving TALK requirements for mechanics that genuinely depend on a walking interaction: in-person offers, talk/deliver steps, hand-ins, and "when walked near" triggers.

The audit does **not** turn every NPC with a walk animation into a route-controlled NPC. Today only Reverie, Lace and the street cat have walking-world code that consumes Dev Tools placement plans and mission escort state. Exposing routes/following for other characters would create editor options that do not execute in the game, which violates the objective of this audit.

No NPC model, GLB/VRPAK, rig, animation asset, voice, default position, default behavior, mission, personality, save format, multiplayer protocol, or developer authentication rule is changed.

## Capability rules established by the audit

| Capability | Source of truth | Editor rule |
| --- | --- | --- |
| In-person mission offer | `mission-givers.js targets` / `canTalk` | Requires a real walking-game TALK interaction. |
| Notification / Messages / Comms mission owner | Known NPC in the mission roster | **Any registered roster NPC is allowed.** No TALK prompt is required. |
| Talk / deliver / hand-in step | Walking interaction | Requires `canTalk`. |
| "When walked near" trigger | Live interaction position | Requires `canTalk`; live code measures distance to an interaction target. |
| Authored speaker / notification sender / await-call | Known NPC identity | Any known roster NPC; existing voice availability remains separate. |
| Photo target | V1 camera subject registry | Only identities the camera can actually tag/validate. |
| Stay / route / daily schedule | Runtime consumes `content.npcs[id]` | Reverie, Lace, street cat only. |
| Follow / lead | `npc-escort.js` runtime | Reverie, Lace, street cat only. |
| Taxi together | `npc-escort.js` + taxi runtime | Reverie and Lace only; cat correctly excluded. |
| Placement locations | `npc-areas.js` geometry and scene hook | Reverie/Lace/cat: Avenue, Old Town, Far South, Outskirts, Port, District interior. Separate scenes such as Milked, NULL interior, Temple and Corporate District remain unavailable because the plan runtime is not loaded there. |
| Animation preview | Actual loaded GLB/VRPAK animation groups | Preview may show the model's own clips. |
| Added/shared animation on movable NPC | `npc-clip-index.json` + skeleton/rest-pose checks + animation library | Only clips verified compatible by skeleton/rest pose and existing content rules. Names alone are never enough. |
| Appearance edit | Existing appearance/skeleton/part metadata | Existing supported parts only; no asset rewrite. |
| Voice | Voice registry / existing ElevenLabs/import flow | Existing identity/voice rules unchanged. |

## Named NPC / mission roster audit

This is the complete mission/editor roster in the admin inventory at audit time. "Animations" below reports the model mapping the current editor/runtime exposes and the real clip index where available.

| ID | Name | Current / supported scene location | Movement capability | Verified animation/model capability | Mission/dialogue capability after audit | V1 photo target |
| --- | --- | --- | --- | --- | --- | --- |
| `admin` | Admin | The Darknet District store | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-admin: idle, talk, walk, look, shrug | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | Yes |
| `iris` | Iris | The Darknet District store | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-iris: idle, talk, walk, look, shrug | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | Yes |
| `attendant` | Arcade attendant | The Darknet District VR area | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `vr-ava` | Ava | VR companion bedroom/play experience | VR companion runtime only; no walking-world plan hook | vr-companion-ava: idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `bishop-hale` | Bishop Hale | The Darknet District hallway | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-bishop: idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `cade-moreno` | Cade Moreno | The Darknet District VR booth 1 | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | vr-player-a: idle, vr-aim, vr-aim-up, vr-aim-down, vr-shoot, vr-hit, vr-duck, walk | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `dax` | Dax | The Darknet District (own clock-driven schedule; sometimes away) | Own clock-driven walk/stay schedule only; no Dev Tools plan hook | npc-dax: idle, talk, look, watch, walk, glance-back, shrug | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `vr-base-m` | Dex | VR companion bedroom/play experience | VR companion runtime only; no walking-world plan hook | vr-companion-bm: idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline, dance-hiphop, dance-hiphop-2, dance-hiphop-3, dance-groove, dance-bass, dance-samba | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `bartender` | District bartender | The Darknet District bar/oxygen lounge | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `dj-vanta` | DJ Vanta | NULL nightclub | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `milked-eva` | Eva | Milked reception | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | ncz-neon: idle, talk, watch, walk, drunk-walk, drunk-idle, drunk-sway, laugh, smoke | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `vr-eva` | Eva | VR companion bedroom/play experience | VR companion runtime only; no walking-world plan hook | vr-companion-pg: idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `milked-fish` | Fish | Milked office | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-fish: idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | Yes |
| `halden-reyes` | Halden Reyes | NULL nightclub bar | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `jonah-pike` | Jonah Pike | The Darknet District bar/oxygen lounge | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-jonah: idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `juno-vex` | Juno Vex | NULL nightclub bar | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `vr-kai` | Kai | VR companion bedroom/play experience | VR companion runtime only; no walking-world plan hook | npc-kai: idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-m2, blow-kiss, head-tilt, laugh, glance-back, slow-dance, dance-samba, sit-relax, sit-wave, shrug, recline | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `kei-navarro` | Kei Navarro | The Darknet District hallway | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-kei: idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `ethereal-lace` | Lace | Editor-plan areas: The Avenue, Old Town, Far South, Outskirts, Port, District interior | Stay, route, daily schedule, wait-at, follow/lead, shared/taken cab where area supports it | npc-ethereal-lace: idle, idle-shift, idle-stretch, look, watch, walk, run, sit-enter, sit, sit-exit, sit-wave, dance-groove, dance-bop, talk, gesture, shrug | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `landing-terminal` | Landing terminal | The Port landing terminal | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `lumi-ashby` | Lumi Ashby | The Darknet District VR booth 2 | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | vr-player-b: idle, dance, pickup, interact, menu, menu-tap, talk, walk | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `mags-oduya` | Mags Oduya | The Darknet District hallway | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-mags: idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `vr-nadia` | Nadia | VR companion bedroom/play experience | VR companion runtime only; no walking-world plan hook | vr-companion-fc1: idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `nyx-district` | Nyx | The Darknet District bar/oxygen lounge | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-nyx: idle, talk, walk, look, watch, laugh, shrug, wipe | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | Yes |
| `grey-reverie` | Reverie | Editor-plan areas: The Avenue, Old Town, Far South, Outskirts, Port, District interior | Stay, route, daily schedule, wait-at, follow/lead, shared/taken cab where area supports it | npc-grey-reverie: idle, idle-shift, idle-stretch, look, watch, walk, run, sit-enter, sit, sit-exit, sit-wave, dance-groove, dance-bop, talk, gesture, shrug | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `rin-takeda` | Rin Takeda | The Darknet District bar/oxygen lounge | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-rin: idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `sable-quon` | Sable Quon | The Darknet District VR area | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-sable: idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `vr-seren` | Seren | VR companion registry (retired/replaced where applicable) | VR companion runtime only; no walking-world plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `street-cat` | Street cat | Editor-plan areas: The Avenue, Old Town, Far South, Outskirts, Port, District interior | Stay, route, daily schedule, follow/lead; procedural movement; no cab | Procedural cat pose/movement; no humanoid animation clips | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `tavi-rourke` | Tavi Rourke | The Darknet District hallway | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-tavi: idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | Yes |
| `vr-una` | Una | VR companion bedroom/play experience | VR companion runtime only; no walking-world plan hook | vr-companion-una: idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `v1-translator` | V1 translation | Player V1 translation device | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `vr-base-f` | Yuki | VR companion bedroom/play experience | VR companion runtime only; no walking-world plan hook | vr-companion-bf: idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `vr-zane` | Zane | VR companion bedroom/play experience | VR companion runtime only; no walking-world plan hook | npc-zane: idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-m2, blow-kiss, head-tilt, laugh, glance-back, slow-dance, dance-samba, sit-relax, sit-wave, shrug, recline | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `zen-zephyr` | Zen Zephyr | Zen Zephyr's Temple | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | npc-zen-zephyr: not in public clip index (scene/private asset controls playback) | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `mercer` | Daniel Mercer | Natural Order homeworld | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `kess` | Dr. Adrian Kess | The Nexus | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `elara` | Dr. Elara Voss | The Vigil | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `sol` | Dr. Sol | Kepler | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `elias` | Elias Ward | Vesper archive recording | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | Notification/device-started mission ownership and authored device/dialogue lines; no in-person talk/deliver/hand-in until a walking TALK interaction exists | No |
| `iona` | Iona Vale | Rusthaven Port | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `mara` | Mara | Vesper | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `marcus` | Marcus Vale | Holdfast | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `nyx` | Nyx | Meridian Station | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |
| `rook` | Rook | Meridian Station | Scene-owned/fixed behavior; no generic Dev Tools movement-plan hook | No model-to-clip-index mapping exposed to the NPC editor; scene owns presentation | In-person offer/talk/deliver/hand-in + notification/device starts; may speak in authored lines | No |

### Interpretation of the roster table

A model having `walk`, `run`, `talk` or other clips is an **asset capability**, not proof of a walking-world control hook. Admin, Iris, Fish, Nyx, the District residents, Dax, companions and performers all have scene-specific controllers. Their defaults remain owned by those scenes.

For NPCs without a public model mapping in this table, the audit intentionally does not invent one. Earlier station characters and some scene-built figures are still usable wherever their existing interaction is registered, but their presentation is not routed through the generic NPC Editor model mapping.

## Placement and location audit

### Runtime-plan locations currently safe to expose

The existing `npc-areas.js` and `ncz-street-pair.js` runtime support Dev Tools plans for Reverie, Lace and the street cat in:

- The Avenue
- Old Town, including Main Street and the District alley where walkable
- Far South main-street walkable areas
- The Outskirts
- The Port
- The Darknet District interior's public walkable portions

The geometry validator deliberately excludes real obstacles, staff-only/private spaces, the security vestibule, pod room, bar interior, VR play room, arcade room, meeting room, stock cage, street furniture, landed ship space, and explicit scene/content boundaries.

### Locations intentionally not exposed as generic placement targets

- **NULL interior:** separate nightclub runtime; no generic `content.npcs` plan consumer.
- **Milked interior:** separate `milked-build.js` performer/staff runtime. Studio performers have their own animation request interface, not generic routes.
- **Temple:** separate Temple/monk runtime.
- **Corporate District:** separate scene and content boundary; no NPC-plan consumer.
- **VR companion bedrooms/experiences:** separate VR companion behavior runtime.
- **Meridian and other stations:** scene-owned station characters; no NPC-plan consumer.

These are legitimate runtime limitations, not arbitrary editor whitelists. Adding them would require a new cross-scene NPC placement/persistence mechanism, which this audit explicitly does not implement.

## Animation audit

The project already has a strong compatibility path in `npc-paths.js`:

1. `npc-clip-index.json` is generated from real model files and records skeleton joint count, Mixamo compatibility, rest pose and actual clips.
2. An embedded model clip is accepted only when it actually exists.
3. Shared/model-to-model clips are accepted only when skeleton/rest-pose compatibility passes the existing animation-library limit.
4. Root-motion, seated/floor, partner, prop-dependent and movement-transition clips are not offered as arbitrary standing waypoint actions.
5. Reverie/Lace retain their content rules; adult/club/smoking/drinking/drunk/combat clips are not exposed to them.
6. Licensed "No AI" models retain their local-retarget-only rule.

The NPC preview may show a model's own embedded clips even when the NPC cannot be moved by Dev Tools. That is intentional: **preview playback** and **world-route control** are different runtime capabilities.

### Complete indexed NPC/model animation catalog

This is the generated clip index used by the compatibility system; it is included here so future work can audit a proposed selector against actual assets rather than animation names.

| Model | Asset visibility | Joints | Mixamo | Indexed clips |
| --- | --- | ---: | --- | --- |
| `communion-tech` | public | 52 | yes | idle, talk, work, watch, sit, walk |
| `communion-worker` | public | 52 | yes | idle, talk, work, watch, walk |
| `cyborg-01` | public | 52 | yes | idle, talk, work, watch, sit, walk, sit-enter, sit-exit, sit-talk, interact, look |
| `district-resident` | public | 52 | yes | idle, talk, sit, smoke, walk, drink, laugh, dance |
| `district-smuggler` | public | 52 | yes | idle, talk, sit, smoke, walk |
| `fixer-01` | public | 52 | yes | idle, talk, watch, sit, walk, sit-enter, sit-exit, sit-talk, interact, look |
| `hacker-01` | public | 52 | yes | idle, talk, sit, smoke, watch, walk, sit-enter, sit-exit, sit-talk, interact, look |
| `meridian-bartender` | public | 52 | yes | idle, talk, interact, pickup, wipe, walk |
| `ncz-neon` | public | 52 | yes | idle, talk, watch, walk, drunk-walk, drunk-idle, drunk-sway, laugh, smoke |
| `npc-admin` | public | 24 | yes | idle, talk, walk, look, shrug |
| `npc-bishop` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug |
| `npc-busker` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-casual-f` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-casual-m` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-club-f` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance, pickup, menu, menu-tap |
| `npc-club-m` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-cook-f` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-cook-old` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-courier` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-dax` | private/licensed | — | — | idle, talk, look, watch, walk, glance-back, shrug |
| `npc-elder-f` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-enforcer` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-ethereal-lace` | public | 24 | yes | idle, idle-shift, idle-stretch, look, watch, walk, run, sit-enter, sit, sit-exit, sit-wave, dance-groove, dance-bop, talk, gesture, shrug |
| `npc-executive` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-fish` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug |
| `npc-fixer` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-grey-reverie` | public | 24 | yes | idle, idle-shift, idle-stretch, look, watch, walk, run, sit-enter, sit, sit-exit, sit-wave, dance-groove, dance-bop, talk, gesture, shrug |
| `npc-hacker` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-iris` | public | 24 | yes | idle, talk, walk, look, shrug |
| `npc-jonah` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug |
| `npc-kai` | public | 24 | yes | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-m2, blow-kiss, head-tilt, laugh, glance-back, slow-dance, dance-samba, sit-relax, sit-wave, shrug, recline |
| `npc-kei` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug |
| `npc-lookout` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-mags` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug |
| `npc-medic` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-merc` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-milked-auburn` | public | 24 | yes | idle, dance, dance-allnight, dance-shake, dance-lovepop, dance-denim, dance-omg |
| `npc-monk-elder` | public | 24 | yes | idle, talk, walk, look, watch, sit |
| `npc-monk-grey` | public | 24 | yes | idle, talk, walk, look, watch, sit |
| `npc-monk-tech` | public | 24 | yes | idle, talk, walk, look, watch, sit |
| `npc-nyx` | public | 24 | yes | idle, talk, walk, look, watch, laugh, shrug, wipe |
| `npc-office-f` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-office-m` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-outskirts-f` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-outskirts-m` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-rin` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug |
| `npc-sable` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug |
| `npc-security` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance, vr-aim, vr-aim-up, vr-aim-down, vr-shoot, vr-hit, vr-duck |
| `npc-student` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-tavi` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug |
| `npc-tourist` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-vendor` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-veteran` | public | 24 | yes | idle, talk, walk, look, watch, sit, smoke, drink, laugh, shrug, sit-enter, sit-exit, sit-talk, interact, drunk-walk, drunk-idle, drunk-sway, dance |
| `npc-zane` | public | 24 | yes | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-m2, blow-kiss, head-tilt, laugh, glance-back, slow-dance, dance-samba, sit-relax, sit-wave, shrug, recline |
| `order-farmhand` | public | 52 | yes | idle, talk, work, watch, walk |
| `order-grower` | public | 52 | yes | idle, talk, work, watch, walk |
| `order-militia` | public | 52 | yes | idle, talk, work, watch, walk |
| `outlaw-01` | public | 52 | yes | idle, talk, sit, smoke, watch, walk, sit-enter, sit-exit, sit-talk, interact, look, laugh, drink |
| `regular-01` | public | 52 | yes | idle, talk, sit, watch, walk, sit-enter, sit-exit, sit-talk, interact, look, laugh, drink |
| `runner-02` | public | 52 | yes | idle, talk, watch, walk, drunk-walk, drunk-idle, drunk-sway, laugh |
| `studio-warrior` | private/licensed | — | — | slow-dance, dance, idle |
| `vesper-mechanic` | public | 52 | yes | idle, talk, work, watch, walk |
| `vesper-pilot` | public | 52 | yes | idle, talk, work, watch, sit, walk |
| `vesper-trader` | public | 52 | yes | idle, talk, work, watch, sit, walk, sit-enter, sit-exit, sit-talk, interact, look |
| `vr-companion-ava` | private/licensed | — | — | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline |
| `vr-companion-bf` | private/licensed | — | — | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline |
| `vr-companion-bm` | private/licensed | — | — | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline, dance-hiphop, dance-hiphop-2, dance-hiphop-3, dance-groove, dance-bass, dance-samba |
| `vr-companion-f` | public | 52 | yes | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline |
| `vr-companion-fc1` | private/licensed | — | — | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline |
| `vr-companion-m` | public | 52 | yes | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-m2, blow-kiss, head-tilt, laugh, glance-back, slow-dance, dance-samba, sit-relax, sit-wave, shrug, recline |
| `vr-companion-pg` | private/licensed | — | — | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline |
| `vr-companion-una` | private/licensed | — | — | idle, talk, walk, sit, sit-enter, sit-exit, sit-talk, dance, interact, idle-f2, walk-f, wave, blow-kiss, coy, head-tilt, hips, laugh, glance-back, slow-dance, dance-belly, sit-relax, sit-wave, shrug, recline |
| `vr-player-a` | public | 52 | yes | idle, vr-aim, vr-aim-up, vr-aim-down, vr-shoot, vr-hit, vr-duck, walk |
| `vr-player-b` | public | 52 | yes | idle, dance, pickup, interact, menu, menu-tap, talk, walk |

## Additional runtime NPCs and performers

### Milked performers

- **Studio 1:** the opposite member of the Reverie/Lace 12-hour street rotation. Both use their real rigged models and currently expose model-supported in-place requests through the existing translucent Studio View.
- **Studio 2:** licensed `studio-warrior`; animation requests are limited to animation groups actually loaded on that model.
- **Studio 3:** Dex / `vr-companion-bm`; its richer dance set is scene-owned and requestable only where actually loaded.
- **Studio 4:** Auburn / `npc-milked-auburn`; its embedded dance set is scene-owned and requestable through Studio View.
- These performers are not made generic route NPCs by this audit.

### Temple ambient monks

The Temple registers fixed/praying and aisle/courtyard walking monks using `npc-monk-elder`, `npc-monk-grey`, and `npc-monk-tech`. Their routes are Temple-owned. They are not mission roster identities and do not receive generic NPC Editor placement controls.

### Anonymous street crowd

The street crowd models and roles remain crowd-system owned. The model catalog above exposes their real clips for auditing/preview/compatible retarget decisions, but anonymous crowd instances do not become persistent named mission actors merely because their model can animate.

### Browser-local imported models

Imported GLB/glTF models remain **local test only**. The existing import audit checks triangle count, file size, texture dimensions, skeleton and embedded clips. A model without a skeleton can stand only. A compatible skeleton can try existing library clips. Publishing a new model still uses the established asset/package workflow; this audit does not upload or rewrite model assets.

## Mission flexibility: newly exposed vs already available

### Newly exposed

- Any registered NPC can be selected as the owner/giver of a mission that starts by **Messages, Comms, or notification**.
- The NPC tab's existing **Give them a mission** button is available for no-TALK roster NPCs. For those NPCs it creates a notification-started draft automatically, then opens the existing Mission Editor for the author to fill in the notification text/trigger.
- Category labels now describe capabilities rather than implying category-wide bans.

### Already supported and retained

- Any known NPC can be an authored line speaker.
- Any known NPC can be a notification sender.
- Any known NPC can be used for an await-call identity.
- Send-photo recipients use known NPC identities.
- Reputation/contact/follow unlock selectors use the existing known-NPC validation.
- Camera subjects remain limited to identities the V1 camera can actually recognize.
- Talk/deliver/hand-in remain limited to actual walking TALK interactions.
- Mission escort steps remain limited to characters whose runtime actually follows mission path state.
- Existing travel-location characters can participate through their existing interactions when the player can reach/unlock their location.

## Restrictions retained and why

| Restriction | Why it remains |
| --- | --- |
| No generic route/follow for Admin, Iris, Eva, Fish, Dax, District residents, companions, performers or station NPCs | Their scene controllers do not read generic NPC plans/escort state. A walk clip is insufficient. |
| No generic placement into NULL/Milked/Temple/Corporate/VR/stations | Separate scene runtimes do not instantiate `content.npcs` plans there. |
| No in-person mission offer for no-TALK NPC | There is no interaction event for the mission engine to intercept. |
| No "when walked near" for no-TALK NPC | The existing live trigger measures the NPC's interaction position. |
| No arbitrary photo target | Mission validation must match the V1 camera's actual subject identification. |
| No incompatible shared animation | Existing skeleton, rest-pose, root-motion, prop/partner and content-rule checks are authoritative. |
| No model/rig asset changes | Explicit audit constraint; incompatible clips are documented for offline retarget instead. |
| No imported-model live publishing directly from browser | Existing package/asset workflow and licensing/security checks remain authoritative. |
| No Dev Tools auth changes | Server-confirmed developer identity remains required; UI visibility is not authorization. |

## Files changed by this audit

- `void-runner/mission-content.js` — capability-aware mission-owner validation.
- `void_runner_live_content.py` — server-side mirror of the same rule.
- `void-runner/mission-editor.js` — contextual giver guidance and notification-draft creation.
- `void-runner/editor-wizard.js` — wizard accepts any registered NPC, then validates the chosen start method.
- `void-runner/npc-editor.js` — descriptive capability categories and no-TALK "Give them a mission" path.
- `void-runner/mission-givers.js` — registry documentation/status now distinguishes TALK from notification mission ownership.
- Tests and documentation listed in the final verification section below.
- `void_runner_admin_inventory.json` must be regenerated after source changes so server fingerprints stay deterministic.

## Verification requirements

Before merge/live deployment, the branch must pass:

- Node unit tests, including Mission Editor, NPC tools, animation index and movement rules.
- Python live-content/server validation tests.
- Browser stabilization smoke.
- Mission Editor browser checks.
- NPC tools browser checks where CI invokes them.
- Admin inventory deterministic projection check.
- Existing auth tests and save/live-content checks.

The audit deliberately does not claim an option works merely because it appears in a dropdown. Every newly unlocked option in code is backed by an existing execution path: device-triggered mission start.

## Future improvements that require new mechanics and are therefore not implemented

- A generic scene-independent NPC placement component consumed by Admin/Iris/District residents/Dax/Milked/Temple/VR/station scenes.
- Cross-scene NPC persistence and navigation.
- Generic mission "perform animation" stage for arbitrary scene-owned NPCs.
- Generic TALK interaction injection for existing no-TALK residents/companions.
- Generic V1 camera subject registration for every named character in every scene.
- Runtime retarget/asset modification for incompatible skeletons.

Those are valid future projects, but implementing them here would rebuild underlying game systems rather than unlock existing potential.
