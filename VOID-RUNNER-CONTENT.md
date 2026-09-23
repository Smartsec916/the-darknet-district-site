# VOID//RUNNER content and presentation guide

The existing campaign, flight, equipment, ownership and network systems remain the engine. The new front end uses them; it does not maintain a second campaign. `content.js` remains the mission/gear source and `ships.js` remains the playable ship source. `story-content.js` contains characters, voices, locations, dialogue, recurring NPC ships, encounters, factions and story events. `story.js` provides deterministic conditions/effects. `story-scenes.js` adapts that data to the existing dialogue renderer and flight simulation.

## Run and synchronize

Static preview: `python -m http.server 5000`, then open `/void-runner.html`. For the existing backend, install `requirements-void-runner.txt` and run `python server.py`. Optional identity, purchases and cloud saves still require the existing Firebase/Stripe deployment configuration. Local play works without them.

After changing entry pages or mission/location definitions, run `node scripts/sync-void-runner.cjs`. This preserves the existing shared-page copies into `static/` and generates `void-runner/save-manifest.json` for Python save validation. Commit the generated manifest. Game modules/assets continue using the existing Flask `/void-runner/` route; do not create a second static asset tree.

## Add a character and voice

Add a record to `characters` in `story-content.js`, using Mara as the reference:

```js
engineer: {
  name: 'Tess', role: 'RUSTHAVEN MECHANIC', cell: '0% 100%',
  faction: 'independent', biography: 'Repairs salvaged navigation arrays.',
  tags: ['mechanic'], voiceProfile: 'engineer'
}
```

The registry adds `id`, `portrait` and `relationshipDefault`. The current art is a six-person atlas; `cell` selects an existing portrait. Supply new portrait art when introducing a visually distinct character. Set `portrait:'art/your-character.png'` and omit `cell` to use a standalone portrait; do not label an existing face as a newly created asset.

Add `voices.engineer = {voiceId:'', pitch:1, rate:.97, volume:.8, variant:1, presentation:'feminine', style:'measured'}` inside the definitions. `voiceId` can pin a installed browser voice by URI/name. Otherwise the audio manager selects a stable, sorted local English voice pool. Presentation/style are author metadata, not guarantees from browser speech engines. The displayed line is passed directly to `VoidAudio.speak(characterId, text)`; do not maintain a separate speech script.

## Add a scene and branching choice

`mara_workshop_intro` is a working example with a choice, relationship change and a campaign transition. Add another entry to `dialogue`:

```js
repair_offer: {
  background: 'dock', heading: 'A familiar face.', start: 'hello',
  nodes: {
    hello: {
      character: 'engineer', text: 'You brought the filters through Kepler.',
      choices: [
        {text: 'Can you help with my ship?', next: 'help',
         effects: {flags: {askedEngineer:true}, relationships:{engineer:1}}},
        {text: 'Another time.', next: 'later'}
      ]
    },
    help: {character:'engineer', text:'Meet me after the next delivery.'},
    later: {character:'engineer', text:'I’ll be here.'}
  }
}
```

`next` names another node. A terminal node returns to the dock. `end:'beginJourney'` is reserved for the existing workshop-to-first-flight transition. Choices can have `when` conditions. Terminal node effects and choice effects use the same effect helper. Keep rewards in once-only events when a conversation may be revisited. Nodes are rendered through the existing typewriter, portrait, voice and advance controls.

## Flags, relationships, continuity and events

All continuity is under `campaign.story`, in the existing campaign save: `flags`, `met`, `events`, `relationships`, character alive/dead/removed state, unlocked locations, chapter, pending scenes and pending encounters. Saves remain version 2; older v1/v2 campaigns migrate and infer the already-known opening characters. Story data cannot grant verified premium ownership.

Example location event, added to the `events` array:

```js
{
  id:'engineer_after_filters',
  trigger:{type:'dock',subject:'undertow'},
  when:{flags:{rookIntroduced:true}, events:['rusthaven_unlocked']},
  scene:'repair_offer',
  effects:{flags:{engineerAvailable:true}}
}
```

Each event fires once, with its ID saved before effects. Conditions support exact flag values, completed chapter mission IDs, previous event IDs, known characters, alive characters, owned campaign ship/item, and quest. Use `when.completed:['belt-2']` for the second Ghost Belt mission. There are not currently two Mara missions; add those missions before referring to them. Nyx already exists as the Meridian bartender, so use a distinct ID for a new mechanic or intentionally extend that character’s biography.

Wired triggers are `campaignStart`, `arriveLocation`, `leaveLocation`, `dock`, `undock`, `missionAccepted`, `missionComplete`, `talk`, `destroyTarget`, `acquireItem`, `ownShip`, `enterCombat`, `reachFlag`, and `eventComplete`. The subject is a location, mission, character, item, ship, flag or event ID as appropriate. A `reachFlag` event should also test the desired value with `when.flags`.

Effects support `flags`, relationship deltas clamped to -100…100, character status changes, `unlock`, `chapter`, and nonnegative campaign `credits`. Use `VoidStory.apply(state, effects)` and save for custom interactions; do not introduce separate localStorage flags. New campaign resets all story state. Explicit replay of old cargo missions remains supported by the existing mission board; cleared mission IDs stay cleared.

## Missions and chains

Add a tuple to `definitions` in `content.js` following `belt-1`:

```js
['belt-5','Quiet delivery','belt','escort','kepler',8,2,44,1200,
 'Protect the shuttle until it reaches Kepler.']
```

The existing conversion creates the mission object. The optional eleventh tuple field is `requires`: append `'belt-4'` to depend on that mission, or `null` to start a separate chain. If omitted, it depends on the preceding tuple, matching the existing campaign. Existing mechanics are cargo/combat, salvage, hazard, escort, generator and boss. New mechanics require engine work; new stories using those mechanics do not. Add chapter title/color metadata to the existing `chapters` array. Run the sync script so server validation recognizes new mission IDs. Keep IDs stable after release so old saves retain completion.

Locations live in `story-content.js.locations` and are consumed by the campaign. The four current location IDs are `meridian`, `kepler`, `undertow` (Rusthaven), and `foundry`. A new playable destination also needs its sky/station/interior art and the corresponding existing world/warp presentation mappings; adding a story event at an existing station needs none of that work.

## Friendly, neutral and hostile ships / encounters

`ships.mara_courier` and `ships.lane_raider` are reusable NPC definitions, separate from purchasable player hulls. Each names an owner/faction, sprite class, allegiance, loadout metadata and behavior metadata. Use `allegiance:'friendly'`, `'neutral'`, or `'hostile'`. Combat and lock filters exclude friendly/neutral objects; their HUD markers use different colors. Player missiles cannot acquire or damage them. Hostile objects retain the existing AI and combat path.

```js
encounters.workshop_rendezvous = {
  ships:['mara_courier'], when:{flags:{maraPromise:true}}, interaction:'hail'
};
events.push({id:'workshop_rendezvous',
  trigger:{type:'enterCombat',subject:'legal-run'},
  when:{flags:{maraPromise:true}}, encounter:'workshop_rendezvous'});
```

Declare these entries inside their respective objects/array. An event queues an encounter, then `spawnStoryEncounter(id)` instantiates it during flight combat. Friendly/neutral ships do not count toward hostile route clearance or fire the hostile AI. `interaction` and behavior/loadout metadata are extension points: hail UI, escort following, cargo transfer and persistent NPC combat loadouts are not implemented by naming those fields alone. Existing escort missions keep their working mechanics. Queued encounters are consumed once; they are not a checkpointed persistent fleet simulation.

## Music, ambience and effects

`ship-audio.js` is the only audio manager and AudioContext owner. It owns master/music/effects/voice gain buses, engine voices, procedural chord beds, rhythmic tension, low-health cues, filtered noise transients, distance attenuation and stereo panning. Music profiles cover menu, flight, each station and the bar. Frequencies, low-pass filtering and gain changes transition smoothly; combat/danger add layers to the existing bed. Pausing stops simulation/engine activity and selects menu music. Page hiding suspends audio. A real pointer/key interaction unlocks it.

Add a profile to `musicProfiles` using `undertow` as a reference: `{root:46.25,chord:[1,1.189,1.5],pulse:1.3,wave:'sawtooth',ambient:29}`. `VoidAudio.scene(profileId, combat, danger)` selects it. Add an effect to `effects` as `[frequency,duration,wave,level]`, then call `VoidAudio.event(name, ship, relativeWorldPosition, cameraBasis)` at the actual event. Omit position for UI/cockpit sounds. An event at 100 world units is audible; at 2,000 it is silent. Stereo uses the camera’s right vector. Do not construct another AudioContext or scatter `new Audio()` calls.

Music/effects/voice sliders and mute persist under the existing `void-runner-audio-v1` key. Keybindings use `void-runner-controls-v1`. Browser storage failure leaves the session playable. Voice zero cancels current speech. A new line, menu, scene change or early dialogue advance cancels the previous line.

For consistent production voices across devices, an optional server-side service such as ElevenLabs is worth evaluating. Its [speech endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert) accepts a voice ID; [authentication](https://elevenlabs.io/docs/api-reference/authentication) uses a secret API key. This is a recommendation based on that integration model, not an audition or a guarantee of acting quality. No paid integration is enabled. It would require an ElevenLabs account/API key, selected licensed voice IDs, a server proxy or offline generation/caching pipeline, and a playback adapter. Keep credentials server-side. Cache by character, exact dialogue text and voice profile version.

The adapter interface is `VoidAudio.setVoiceProvider({speak({characterId,text,profile,volume,bus}),cancel()})`. `speak` returns a promise covering playback; `cancel` must abort pending fetch and playback. Connect Web Audio playback to the supplied voice bus. Without an adapter, browser SpeechSynthesis remains functional where supported; without either, dialogue remains text-only. Browser voice names and availability vary by OS.

## Controls and missiles

W/S pitch, A/D yaw, Q/R roll, Shift/X thrust, E equipment drive, Space primary, F missile, T nearest hostile, Tab next, G previous, C clear, L reacquire lock, Escape menu. Arrow keys/either Shift remain aliases while the corresponding defaults are unchanged. Mouse aim/left-click primary/right-click missile and touch controls remain available. There is no invented reverse, manual docking or in-flight weapon cycling: docking is automatic and loadouts change in the Hangar.

The prior launcher was functional but only exposed right-click/touch firing and silently refused an incomplete lock. It also did not range-check acquisition. F now uses that same missile launch path, and the HUD explains no launcher, unequipped, no target, lock off, out of range, acquiring/locked, cooldown and empty states. Acquire a target in the central ring continuously before firing. Ammo still refills per launched route, matching the existing game; there is no new consumable inventory economy.

## Tests

Run `node --test tests/*.test.cjs` and `python -m unittest discover -s tests -p 'test_*.py'`. Browser scripts use Playwright with Edge and local port 5000. Relevant suites: `menu-browser.cjs`, `account-menu-browser.cjs`, `audio-browser.cjs`, `overhaul-browser.cjs`, `hangar-hud-browser.cjs`, `piloted-browser.cjs`, `travel-browser.cjs`, and `startup-speed.cjs`. Account tests use fixtures, never real purchases or account credentials. Historical browser scripts referencing the removed global navigation need their scenario entry paths updated before reuse.
