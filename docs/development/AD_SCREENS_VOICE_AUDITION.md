# Advertisement screens: voice audition plan

Written 16 Nov 2026 with build `2026-11-16-adscreens-1`. **Nothing in this file has been recorded.** No new voice is cast, no clip was generated, and no paid service (ElevenLabs or any other) was used. David picks by ear; this is what to play him and what gets recorded once he has picked.

## What David asked for

- "News broadcaster sounding voices, cheesy and over dramatic."
- More than one reader, including a female voice for other news, so it is not always the same voice.
- The screens are read aloud from where they stand; the WarFlying Leadership Board's voice says only #1.

## Where things stand today

| Slot (tools/audio/npc-voice-registry.json) | Today | Used on the street for |
|---|---|---|
| `commercial-announcer` | provisional, female | brand ads; David's five space-station ads (already recorded in this voice) |
| `police-recruiter` | provisional, male | David's two police recruitment ads (already recorded in this voice) |
| `news-anchor` | provisional, female | David's news reports (already recorded in this voice); government announcements (not recorded) |
| `warflying-host` | provisional, male | pro-WarFlying ads and the board's "#1" callout (not recorded) |

All four are provisional: they were stand-ins from 17 Oct 2026, not David's picks. The Function has no voice and is not part of this.

## Step 1: the audition (four short lines per candidate voice)

Play each candidate voice reading exactly these. They are David's own words, unchanged.

1. Ad: `Real-ish Chicken™ — Genetically convinced it's chicken.`
2. Ad: `DeathCab — We guarantee arrival. Not necessarily yours.`
3. Government announcement: `Attention citizens: Unauthorized happiness may indicate illegal substance use.`
4. Board callout: `GlitchBitch` and then `a new number one` (two short clips; the first is one of his handles, the second is what is said when a real player takes #1).

How to run it: the audition tool (`tools/audio/audition/server.py`, see `docs/VOID_RUNNER_VOICE_PRODUCTION.md`) on the machine that has the Kokoro models (they are not on the cloud machine this was written on). Put the four lines in as the sample text for each candidate and listen. Audition samples are never committed.

Suggested shape of the audition (suggestions only; the choice is David's):
- Three or four male and three or four female candidates, each tried at normal speed and about 10% faster, since "cheesy and over dramatic" usually needs the pace up.
- Listen for at least three winners: an ad reader, a second news/announcement reader of the other sex, and the WarFlying board announcer (he may want the board announcer to stay the sports-commentator type the radio already uses).
- If Kokoro cannot do "over dramatic" well enough, say so and decide then whether to try another engine. That would be a new decision about cost; nothing paid was tried here.

## Step 2: David's picks (fill in)

| Role | Voice picked | Speed | Notes |
|---|---|---|---|
| Ad reader (brand ads) | | | |
| Second ad reader, if he wants ads to alternate | | | |
| Government announcements | | | |
| News, first reader | | | |
| News, second reader ("a female voice for other news") | | | |
| WarFlying Leadership Board and pro-WarFlying ads | | | |

Which category each voice reads is one word per category in `void-runner/ad-screens-data.js` (`CATEGORIES`, the `speaker` field). A second reader for the same category needs a small code change (alternate by ad); it is not built because no second voice exists yet.

## Step 3: recording, once he has picked

1. Record the picks in the registry through the audition tool (never by hand-editing an approved voice).
2. In `void-runner/ad-screens-data.js` set `RECORD={ads:true,board:true}`.
3. `node tools/audio/extract-lines.cjs`, then `python tools/audio/generate.py --models <folder> --dry-run`, then without `--dry-run`. Ask David before the bulk run: it is 74 ad lines plus 58 board clips.
   - Note: on 16 Nov 2026 `extract-lines.cjs` run on unchanged `main` rewrites the manifest and drops about 60 older entries (it has drifted from the game's dialogue files). That is not part of this work and was not committed; look at the diff before committing a manifest.
4. The game needs no change: a line plays its recording as soon as the manifest lists one, and stays a silent caption until then.

Things the text-to-speech step will need to handle (the words on screen stay exactly David's): the trademark sign in a brand name is not spoken; the long dash between brand and tagline is a pause; `TOFU.EXE`, `Divorce.exe`, `CyberEyes 4K`, `#1` and handles such as `DirtyRAM` and `GlitchedGSpot` may need a pronunciation hint.

## The clip list

### Already recorded (provisional voices), playing on the street now: 36 lines

David's seven space-station ads, line by line (`void-runner/relay-content.json`):

- `commercial-announcer` · Out here, nobody remembers what you wore to your last firefight.
- `commercial-announcer` · Unless you survived it.
- `commercial-announcer` · The Darknet District. Apparel for people who prefer their privacy with a little style.
- `commercial-announcer` · Visit participating retailers for details.
- `commercial-announcer` · Is your ship turning like a loaded cargo hauler?
- `commercial-announcer` · Are pirates completing entire conversations while you attempt to maneuver?
- `commercial-announcer` · Ask your local equipment dealer about upgraded maneuvering thrusters!
- `commercial-announcer` · Because eventually, you should be facing the thing shooting at you!
- `commercial-announcer` · Shields taking a beating?
- `commercial-announcer` · Your hull wasn’t designed to negotiate with incoming laser fire!
- `commercial-announcer` · Upgrade your defensive systems today!
- `commercial-announcer` · Remember: repairs cost money. Explosions cost everything!
- `commercial-announcer` · Still trying to hit moving targets the old-fashioned way?
- `commercial-announcer` · Discover the convenience of missile lock-on technology!
- `commercial-announcer` · Acquire. Lock. Launch.
- `commercial-announcer` · Because sometimes the problem is moving faster than your patience!
- `commercial-announcer` · Exploring an abandoned station?
- `commercial-announcer` · Meeting strangers in poorly lit corridors?
- `commercial-announcer` · Consider reliable personal defense equipment!
- `commercial-announcer` · Available from participating licensed equipment dealers.
- `commercial-announcer` · Because the universe is a dangerous place, and harsh language has limited stopping power!
- `police-recruiter` · TIRED OF YOUR BORING JOB?
- `police-recruiter` · LOOKING FOR ADVENTURE?
- `police-recruiter` · JOIN THE POLICE FORCE!
- `police-recruiter` · MEET INTERESTING PEOPLE!
- `police-recruiter` · VISIT EXOTIC SPACE STATIONS!
- `police-recruiter` · ASK COMPLETE STRANGERS WHAT THEY’RE CARRYING IN THEIR CARGO HOLDS!
- `police-recruiter` · LAW ENFORCEMENT!
- `police-recruiter` · IT’S NOT JUST A CAREER!
- `police-recruiter` · IT’S A REASON TO ASK FOR IDENTIFICATION!
- `police-recruiter` · Do you enjoy authority?
- `police-recruiter` · Do you appreciate paperwork?
- `police-recruiter` · Have you ever looked at a perfectly ordinary cargo ship and thought, ‘That deserves an inspection’?
- `police-recruiter` · THEN WE HAVE A CAREER FOR YOU!
- `police-recruiter` · JOIN THE POLICE FORCE TODAY!
- `police-recruiter` · Uniforms provided. Enthusiasm mandatory.

His three news reports are also already recorded (`news-anchor`, 11 lines) and play when a news slide comes round.

### To record: 74 ad and announcement lines

**Food & beverages** (food; today's slot: `commercial-announcer`)

- Real-ish Chicken™ — Genetically convinced it's chicken.
- NULL Energy — Sleep is a subscription you can't afford.
- Mama's Synthetic Noodles — Just like your mother used to download.
- Corporate Cola — Taste the exploitation.
- TOFU.EXE — Now with downloadable flavors.
- Yesterday's Sushi — Tomorrow's medical emergency.
- Barely Beef™ — 12% cow. 100% attitude.
- Emergency Ramen — Just add contaminated water.

**Dating & entertainment** (dating; today's slot: `commercial-announcer`)

- Rent-A-Soulmate — True love starts at 49 credits per hour.
- Milked — Come for the atmosphere. Stay because your tab is enormous.
- CyberBride™ — Compatible with most major operating systems.
- Divorce.exe — End your marriage without restarting.
- NULL Nightclub — Lose your inhibitions. Possibly your wallet.
- Ex-B-Gone™ — Emotional uninstall services.
- VR Paradise — Reality is a known software defect.

**Cybernetic enhancements** (cyber; today's slot: `commercial-announcer`)

- Second Chances™ — Lost an arm? Upgrade your poor decisions.
- ChromeDaddy — Be the man your warranty says you are.
- MemoryWipe™ — Forget your ex. Financing available.
- CyberEyes 4K — See red flags in unprecedented detail.
- QuietBrain™ — Now with 80% fewer intrusive advertisements.
- Budget Bionics — An arm and a leg for less than an arm and a leg.
- EgoBoost Implants — Confidence sold separately.

**Technology & black-market services** (tech; today's slot: `commercial-announcer`)

- HackMart — Probably legal since 2187.
- Privacy Pro™ — We know how much privacy means to you.
- AdBlock Basic — Watch this advertisement to block advertisements.
- Identity Outlet — New you. No questions.
- Totally Legit Cybernetics — Ignore the screaming downstairs.
- DataBrokers Inc. — We know what you did last Tuesday.
- Free Public Wi-Fi — Your passwords are our passwords.

**Housing & transportation** (housing; today's slot: `commercial-announcer`)

- Coffin Suites — Technically a bedroom.
- MicroLiving™ — Now with enough space to have one regret.
- NeoChinatown Apartments — Stunning views of other apartments.
- SleepBox — Because homelessness looks bad on your profile.

**Housing & transportation** (transport; today's slot: `commercial-announcer`)

- DeathCab — We guarantee arrival. Not necessarily yours.

**Healthcare** (health; today's slot: `commercial-announcer`)

- Medix Express — Your survival is our secondary priority.
- TraumaLite — Affordable coverage for non-fatal emergencies.
- Organ Overstock — Everything must go!
- Respira™ — Breathing is free for the first 30 days.
- Dr. Patch — Have you tried turning yourself off and on again?
- ImmortaLife — Live forever. Pay monthly.

**Corporate propaganda** (corporate; today's slot: `commercial-announcer`)

- WorkLife Industries — Your life. Our property.
- Obey™ — Independent thinking was never good for productivity.
- Corporate Security — Protecting shareholders from people like you.
- Freedom Plus — Upgrade to premium citizenship today.
- TrustCorp — If we were evil, would we have such a friendly logo?
- Employee Wellness Program — Crying breaks are now billable.
- Rent Your Future™ — Ownership is an outdated concept.

**Government announcements** (government; today's slot: `news-anchor`)

- Missing a kidney? Report unauthorized harvesting to your local authorities.
- Remember: Surveillance is just another word for caring.
- Unemployment is a choice. Forced employment is not.
- See something? Say something. Earn 5 credits per reported neighbor.
- Public executions have been postponed due to technical difficulties.
- Your dissatisfaction has been recorded for quality assurance.
- Attention citizens: Unauthorized happiness may indicate illegal substance use.

**Pro-WarFlying advertisements** (warflying; today's slot: `warflying-host`)

- WARFLYING — THE GALAXY IS YOUR PLAYGROUND!
- Think you're the best scanner in the Tessaly System?
- Prove it!
- Download WarFlying from the App Store.
- Launch your ship and start scanning.
- Hit SUBMIT SCANS to upload your discoveries.
- Climb the WarFlying Leaderboard!
- GET SCANNING. GET RANKED. GET LEGENDARY.
- SCAN. SUBMIT. DOMINATE.
- Join the Tessaly System's fastest-growing WarFlying community!
- Install the WarFlying App from the App Store, explore uncharted frequencies, and submit your scans to climb the global leaderboard.
- Who's watching the watchers?
- YOU ARE.
- PRIVATE FREQUENCIES. PUBLIC GLORY.
- Think you've got what it takes to become the Tessaly System's #1 WarFlyer?
- DOWNLOAD. FLY. SCAN. SUBMIT.
- Thousands of signals.
- Hundreds of competitors.
- One top spot.
- Install WarFlying from your App Store today!

### To record: the board, 58 clips (today's slot: `warflying-host`)

Every one of David's handles (both of his lists, repeats removed), because #1 is always one of them and #1 is the only name ever said:

- GlitchBitch
- ChromeSlut
- DeepSocket
- RustyProbe
- DirtyCircuit
- WetwareWhore
- NeonNasty
- FilthyFirmware
- CyberPerv
- DeadInside
- SinDealer
- ChromeDaddy
- FleshGlitch
- MalwareMama
- DirtyRAM
- DirtyCircuits
- RustyOrifice
- CyberPimp
- NeonSinner
- BrokenCondom
- ShadyBytes
- SyntheticVice
- DirtySocket
- DaddysFirmware
- NastyGlitch
- BootyProtocol
- FleshFirmware
- EmotionalDamage
- CorruptedVirgin
- BarelyHuman
- HappyEnding
- HardDrive
- ForbiddenPlug
- MaliciousIntent
- GlitchedGSpot
- DirtyMotherboard
- MorningAfter
- QuestionableUpgrade
- MoistCircuit
- SiliconeSinner
- UnethicalPleasure
- FatalAttraction
- ScreamingImplant
- BadDecisions
- ConsentError
- BlackMass
- OrganDonor
- HumanError
- LastBadIdea
- UnholyHardware
- CorporateBastard
- CheapFlesh
- DisposableHuman
- TerminalPleasure
- BeautifulMalfunction
- NoRefunds
- FactoryDefect

And, for when a real player is #1:

- a new number one

Places #2 to #5 are never spoken, so generated handles need no recording.

### Not recorded, on purpose

- News headlines on the street screens (shown, not read; the report's lines are read).
- David's radio commentary lines with a name in them (`{name} moves into {rank} place`): they are filled in at play time, so they stay captions.
- Anything for The Function.
