/* DEVELOPER TOOLS > GUIDE (the owner, 21 Nov 2026: "remake me a new mission editor guide and add it as a tab here next to Achievements"). A plain-words guide to the
   Mission Editor as it works today, for the owner (not a programmer). Browser: loaded on demand by dev-tools.js when the Guide tab opens (players never download it);
   Node: the sections and the quoted button labels for tests/editor-guide.test.cjs, which checks every [[LABEL]] still exists in the editor's code.
   Markup in the lines: [[LABEL]] is a button or box name exactly as on screen ([[shown|checked]] when the screen adds a name or a number to it); a line starting with
   "- " is a bullet, "1. " a numbered step, "## " a small heading, "> " a tip. No story or lore here: examples use placeholder words. */
(function(root){
 'use strict';
 const SECTIONS=[
  ['start','Start here',[
   'This guide explains the Mission Editor as it works today. Pick a section in the contents list, or type a word in the search box to show only the sections that mention it.',
   'Buttons and boxes are shown like this: [[PLAY THIS DRAFT]]. Look for the same words on screen.',
   '## Your first mission in five minutes',
   '1. Open Developer tools. On the [[Start]] tab press [[Make a mission]].',
   '2. Answer one question per page, then press [[MAKE MY MISSION]].',
   '3. Press [[PLAY IT NOW]] and play it in a practice game. Your real save is never touched.',
   '4. Press [[LEAVE DRAFT · BACK TO EDITOR]] at the top of the screen to come back, change what you want, and play again.',
   '5. When it is right, publish it (see "Publish, versions, UNDO and EXPORT MY EDITS").',
   '> The round [[?|Show me around]] button at the top right replays the short tour of the editor. [[UNDO]] (or Ctrl+Z) puts back your last change.']],
  ['draft','Drafts and publishing',[
   'Everything you make or change is a DRAFT. It is saved as you type, in this browser, and a copy is kept on the server too. Nobody else sees it.',
   '- [[PLAY THIS DRAFT]] tries your draft in a throwaway practice game. Your real save is never touched.',
   '- Players see nothing until you publish: [[PUBLISH TO ALL PLAYERS]], under [[Publish & versions]] in the Mission Editor.',
   '- The line at the top of the Mission Editor starting "How your edits reach the game" says whether publishing is switched on. Click it for details.',
   '- Basic and Advanced: the normal view hides things you rarely need (mission number, internal names, step kinds the game cannot run yet). Tick [[Advanced]] at the top to see everything. Your choice is remembered in this browser.',
   '- [[UNDO]] and [[REDO]] at the top right work on every change in the Mission Editor and the NPCs tab since Developer tools was opened, even a removed mission or step.']],
  ['wizard','Make a mission (the wizard)',[
   'On the [[Start]] tab press [[Make a mission]]. There is one question per page. [[NEXT]] goes on, [[BACK]] goes back. If something is missing, a yellow box says what and how to fix it.',
   '1. [[What kind of mission?]] Pick a template: [[Deliver something]], [[Meet someone]], [[Go somewhere]], [[Photograph something with the V1]] or [[Talk to someone]]. It fills in the first steps for you; you can change them.',
   '2. [[Who gives the mission?]] People players can meet in the game today are listed first.',
   '3. [[How does it start?]] [[When the player talks to them]], [[They ask, the player says ACCEPT or DENY]], [[When the player walks near them (starts automatically)]], [[When the player walks near them, they ask ACCEPT or DENY]], or [[A text message on the V1]] (it arrives when the player first leaves the Sleeping Pod; you write the message).',
   '4. [[What must the player do?]] Each step: what the player does, and who or where. The Mission Log line is filled in for you; type your own words if you like. [[+ ADD A STEP|ADD A STEP]] adds a step, the arrows move it, × removes it. Optional: [[An apartment for this mission (optional)]].',
   '5. [[What does the player get, or pay?]] [[Player gets]] or [[Player pays]], a quick amount or your own number, and [[Ask the player ACCEPT or DENY first?]] (always yes when the player pays).',
   '6. [[What is it called?]] The name, an optional description, what the giver says when offering it, and which tree it goes in ([[My missions]] unless you pick another).',
   'Then press [[MAKE MY MISSION]]. Next you can press [[PLAY IT NOW]], [[OPEN IT IN THE MISSION EDITOR]] (every setting) or [[MAKE ANOTHER]].',
   '> The wizard offers the common step kinds. The Mission Editor has all of them, plus extra start conditions, timers and the rest.',
   '[[Test my mission]] on the Start tab lists every mission in your draft: [[PLAY]] when it is ready, or what is still missing with [[OPEN TO FIX]].']],
  ['editor','The Mission Editor: trees, missions, Blocks and Form',[
   'Open the [[Mission Editor]] tab. On the left is the list of [[Mission trees]]. A tree is a chain of missions that run in order: finishing one opens the next.',
   '- New tree: [[+ NEW MISSION TREE]], type its name, [[CREATE TREE]].',
   '- New mission: open your tree and press [[+ NEW MISSION]]. It gets the next free mission number.',
   '- Each mission card has its [[Mission name]], [[Description (the V1 Mission Log shows it)]], [[Giver]], [[How this mission starts]], the steps, [[Where the mission ends]], [[What becomes available]], [[Checks]] and the play buttons.',
   '- [[▲]] / [[▼]] change the order of the missions; [[REMOVE MISSION]] takes one out (its number is never given to another mission).',
   '- Mission numbers: type one and press [[SET NUMBER]] or [[RENUMBER]]. Numbers are unique and never reused.',
   '## Blocks or Form',
   'Under the mission name there is a switch: [[Blocks]] | [[Form]]. Both show the same mission; a change in one is in the other at once.',
   '- Blocks reads top to bottom in the order it plays: START, one block per step, END. [[+ ADD A BLOCK]] asks [[What kind of block?]]. Drag the ⠿ handle to move a block, [[FOLD]] hides its details, ⧉ copies it, × deletes it (UNDO brings it back).',
   '- The coloured edge says WHO (the player is always blue); the header says WHAT (WORDS, ACTION, ITEM, TIME, ASK, APARTMENT).',
   '- Form shows every setting as boxes. [[+ STEP]] adds a step. A step the Blocks view cannot show yet is a grey block with [[EDIT IN FORM VIEW]].',
   '## Rewards and costs',
   '- Credits: [[Player gets]] or [[Player pays]]. For a cost, [[Charged]] says when (at ACCEPT, or when a step is done). Credits never go below 0; with too few, ACCEPT is greyed and says [[YOU NEED|YOU NEED]] and the amount.',
   '- [[What becomes available]]: pick a kind (credits, [[Story flag]], a place, [[Give the player a ship]], [[Add to the V1 contacts]], [[Start tree]] and more), pick when (when the mission is done, or at a step), then [[+ ADD]].',
   '- In Blocks, an ITEM block is given when the block above it is done; below END it is given when the mission is done.']],
  ['steps','Every kind of step',[
   'Pick the kind in each step (Form view: [[Kind of step]]; Blocks: [[+ ADD A BLOCK]]). Each step has its Mission Log words, optional lines [[What is said when this step is done]] and an optional [[Delay before this step starts]].',
   '## People and talking',
   '- [[Talk to someone]]: done when the player walks up and presses TALK.',
   '- [[Hear what they say]]: their lines show right after the talk step before it.',
   '- [[Deliver to someone]]: done when the player talks to the recipient after the earlier steps (no real parcel).',
   '- [[They call (a callback)]]: an incoming Comms call (or a message) right after the step before.',
   '- [[Wait for their call]]: done right after the step before; the call itself comes from a later mission.',
   '- [[Someone plays an animation]]: the person does an animation where they stand, then the mission waits the seconds you set.',
   '- [[Ask the player: ACCEPT or DENY]]: the mission stops and asks your question with two buttons.',
   '## Going places',
   '- [[Go to a place]], [[Enter a place]], [[Leave a place]], [[Leave the Sleeping Pod]].',
   '- [[Fly to / arrive at a place]] and [[Flight: board, take off, jump, dock]]: need a ship.',
   '- [[Follow them (they lead the way)]], [[They follow you]], [[They call a cab, you ride together]], [[You call a cab, they ride along]]: only with people who can walk with the player.',
   '## Inside places',
   '- [[Go into an apartment]], [[Use something in an apartment]], [[Hack the access point]], [[Leave a place of this mission]], [[Sneak past the guards]].',
   '- [[Copy evidence to the V1]] and [[Report / send evidence to someone]].',
   '## Watching and waiting',
   '- [[Watch someone (stay near them)]], [[Overhear a conversation (eavesdrop)]], [[Follow someone at a distance]], [[Watch a remote camera feed]].',
   '- [[Wait (a number of seconds)]] and [[Wait in-game time]].',
   '## Other',
   '- [[Buy an item]], [[Photograph someone]], [[Send a photo to someone]], [[Open an app on the V1]], [[The notification arrives]], [[Change zone (Friendly / Neutral / Hostile)]].',
   '> A few kinds are listed for planning only and say "needs a code change" ([[Win a fight]], [[Scan with WarFlying]], [[Escort someone]], [[Pick something up in the world]]). The game cannot run them yet; they are hidden in Basic.']],
  ['offer','How a mission is offered',[
   'Under [[How this mission starts]] (Form) or in the Start block (Blocks), choose [[Starts:]]',
   '- [[In person: the player talks to them]]: the player walks up and presses TALK; the giver says [[What is said when the mission is offered]].',
   '- [[In person: they ask ACCEPT / DENY]]: the same, then the player chooses ACCEPT or DENY.',
   '- [[Walk near them (starts automatically)]]: no talking needed; it starts when the player comes close.',
   '- [[Walk near them and they ask ACCEPT / DENY]]: when the player comes close, the giver asks.',
   '- [[By Messages (a text on the V1)]], [[By Comms call]] or [[Notification only (a banner)]]: it arrives on the V1 when its trigger happens: [[First exit from the Sleeping Pod]], [[After a mission is completed]], [[Entering a place]], [[Leaving a place]], [[A story flag is set]] or [[After in-game time]]. Fill in the sender, header and words.',
   '## ACCEPT and DENY',
   '- Tick [[Ask the player: ACCEPT or DENY]]. [[Buttons]] lets you use your own button words (empty: ACCEPT and DENY).',
   '- On DENY: [[Offer again after a number of minutes]], [[Offer again after the next pod exit]], [[Never offer again (remove it)]] or [[Start another mission]]. [[What is said after DENY]] is optional.',
   '- An offer that arrives on the device shows a banner, then the ACCEPT / DENY window. It never opens over a conversation or a menu.',
   '- In the middle of a conversation (Blocks view): [[+ PLAYER REPLY]], then tick [[Make this a choice: ACCEPT / DENY|Make this a choice: ]]. Each choice can give or take credits once.',
   '## Walk near: the banner is optional',
   'For a walk-near start the banner text is folded under [[Show the banner text]]. Leave it empty and the player sees only a short "NEW MISSION" line; the giver says the offer in person.',
   '> Testing a DENY: in PLAY THIS DRAFT the top banner shows [[SKIP THE WAIT]] while a denied offer is waiting.']],
  ['conditions','Start conditions: "…and only when"',[
   'A second trigger. The mission starts on its normal trigger AND only when every condition you add is true. Leave it empty and nothing changes.',
   '1. Open the mission. Find [[…and only when (optional)]] under How this mission starts (Form) or in the Start block (Blocks).',
   '2. Press [[+ ADD CONDITION]], choose the kind, fill in its boxes. Up to six. × removes one.',
   '3. The line above the list says the whole start in plain words, so you can check it reads right.',
   '## The kinds',
   '- [[No other people near someone]] (tick [[count the street crowd]] to count the crowd too, untick to count only placed people).',
   '- [[No other players near someone]] (multiplayer).',
   '- [[Time of day (street clock)]] (a range can go past midnight).',
   '- [[The player is in a place]], [[Another mission is finished / not finished]], [[A story flag is set / not set]].',
   '- [[The player has at least some credits]] (checked, never taken), [[The player has a ship / has no ship]].',
   '- [[The player is on foot (not in a taxi or a ship)]], [[The player has not drawn their weapon]], [[The zone where the player is]].',
   '## When a condition is not true at that moment',
   '- Walk near: the game keeps checking while the player stays in range and starts it the moment all are true.',
   '- In person: not offered this time; checked again at the next talk.',
   '- One-moment triggers (leaving the pod, entering or leaving a place): the game remembers the trigger happened and starts the mission once the conditions are true.',
   '> The wizard does not set conditions. Add them in the Mission Editor afterwards.']],
  ['feet','Distances are in feet',[
   'Every distance you see or type in the editor is in feet: the walk-near distance, "stays within", follow and lead distances, "too close", and the problem lists. Long distances show in miles.',
   '- Walk near: 16 ft if you leave the box empty (a few steps away); 4 to 98 ft allowed.',
   '- The game stores metres behind the scenes. You never need to convert anything.',
   '- Left in metres on purpose: map coordinates (the x / z boxes), speeds, and the Combat Balance numbers.']],
  ['givers','Mission givers and the Tea Room Host',[
   'The [[Giver]] is who offers the mission. Only people with a TALK prompt in the game can give missions. The line beside the list says whether players can reach them today.',
   '- Changing the giver also moves the offer lines to the new giver.',
   '- [[Giver waits at]] (for people the editor can move): pick a spot on the map. While the mission waits to be offered they go there; after it is accepted they go back to their routine. [[JUMP THERE]] opens a test at the spot; [[CLEAR (HER USUAL WALK)]] removes it.',
   '## The Tea Room Host',
   '- A built-in giver in The Underground: the tea room, behind the tea station. Players see [[TALK TO TEA ROOM HOST]].',
   '- Pick [[Tea Room Host]] as the Giver like anyone else. For example, a walk-near start with no banner text: everything is said in person.',
   '- He can be moved or placed elsewhere in Developer tools > NPCs.',
   '## Make your own giver',
   '1. On the Start tab press [[Create a mission giver]].',
   '2. Choose the [[Model]], type the name (required), tick [[This character is an adult (18+)]] only for a grown-up.',
   '3. Look ([[Show me in 3D to change the look]]), device, ship, items, voice and animations.',
   '4. Place: the area on the map, then [[Keep her at one spot]] or [[Make her walk a route]], and [[When are they there?]]',
   '5. Press [[Give them a mission]]. Your characters are listed under [[Made by you]] in the NPCs tab.']],
  ['npcs','Placing people and what they are doing',[
   'Open [[NPCs]] (or [[Place a character]] on the Start tab). Pick someone from the list, then:',
   '- [[Let her do her usual thing]], [[Keep her at one spot]] or [[Make her walk a route]]. Click the green ground on the map; a click on a road or furniture moves to the nearest spot they can stand on. A spot that is never allowed says why.',
   '- At a spot or a route point, tick what they do there, one after another: for example [[Look about]], [[Scroll her V1]], [[Work at a counter]], a shrug or a small dance. Only animations that person really has are listed.',
   '- Sitting: put the spot right in front of a seat (a ledge, a bench, an alcove chair in the tunnels) and tick the sit choice. Away from a seat it says it needs one.',
   '- [[Daily schedule]]: [[+ ADD A TIME BLOCK]], set From and To and what they do; [[EDIT ON THE MAP]] changes that block. [[Try a time]] and [[PLAY THIS DRAFT AT THIS TIME]] test it.',
   '- [[Add animation]]: every animation in the game, with [[Try it]] on the 3D preview. Missing one? [[Request an animation]].',
   '- Describe it in words: [[COPY CHATGPT PROMPT]], paste the answer into [[Paste behaviour]], [[CHECK IT]], then [[USE THIS BEHAVIOUR]].',
   '## People placed for one mission',
   'Under each mission, [[People for this mission]]: [[+ PERSON]], then the figure, the place, what they are [[Doing]], and from which step until which. [[+ EVIDENCE]] adds a document the player can collect.',
   '## Animations in conversations',
   '- Under a character\'s line: [[While saying this, |While saying this, ]]… pick an animation. They do it while the line is on screen.',
   '- [[Timing]] on each line: [[Wait before this line]], [[show for]] (goes on by itself) and [[animation lasts]].']],
  ['poses','Floor sitting poses',[
   'People can kneel or sit on the floor at the right seats: kneeling (seiza), cross-legged, or with the knees pulled up to the chest.',
   '- At a spot or route point, the sit choices are: [[Sit — pose: chair (ledge, bench, stool)]], [[Sit — pose: kneel (seiza)]], [[Sit — pose: cross-legged]], [[Sit — pose: knees to chest]].',
   '- Where each works: chair at a ledge, bench, crates or mahjong stool; kneel, cross-legged or knees to chest at a tea room cushion; cross-legged or knees to chest on a sleeping-room cot; knees to chest sideways along an alcove bench.',
   '- Put the spot where one steps onto the seat. A line under it says [[Pose at this seat: |Pose at this seat: ]]… with the poses that seat takes; tick the matching one.',
   '- Only people whose model has the poses get them (most street figures and residents do; the VR companions, licensed models, the street cat and a few others do not). The editor says so in plain words.',
   '- Mission cast: [[People for this mission]] › [[Doing]] also offers kneel on the floor, sit cross-legged and sit, knees to chest, only for figures that have them.']],
  ['interiors','Apartments and interiors',[
   'A mission can have its own apartments and buildings, open only to the player doing it.',
   '## A single apartment',
   '1. Above the steps find [[Apartments for this mission]] and press [[+ INSTANCE AN APARTMENT]].',
   '2. Choose its style (rundown, normal or luxury), then its street door: on the map ([[SHOW ON MAP]]) or from the list.',
   '3. Optional: the number on its door, when it opens, [[locked until hacked]], [[Lights start]] on or off.',
   '4. [[JUMP TO THE DOOR]] or [[JUMP INSIDE]] opens a throwaway test there. Nothing is saved.',
   '## A building from modules',
   '1. Under [[Add a location]] choose a category (Housing, Office, Server room, Hallways, Elevator, Other …), the module, then [[+ ADD]].',
   '2. Choose its street door. Add more modules on the card; they always fit together.',
   '3. On the plan, click a module: arrows move it, [[TURN]] turns it, [[REMOVE]] takes it out. [[MAKE ENTRANCE]] on a free door; [[+ FLOOR BELOW]] / [[+ FLOOR ABOVE]] after an elevator cab.',
   '4. The card says "Everything fits" or lists what to fix.',
   '## Steps for places',
   '- [[Go into an apartment]] (any room or one room), [[Use something in an apartment]] (computer, panel, safe, closet, light switch …), [[Hack the access point]] (the seconds it takes, whether it fails if they walk away, whether it opens the door), [[Leave a place of this mission]].',
   '- The places are listed by their real names, and the Mission Log words are written for you. Type your own and they are kept; [[USE THE AUTOMATIC WORDS]] puts the automatic ones back.']],
  ['voices','Voices and ElevenLabs tags',[
   'Each line is text. A voice is added by importing a recording, or by queueing it for re-voicing.',
   '## Import a voice file',
   '1. Type the line. Make it in ElevenLabs in the voice you want and download it (MP3 is best).',
   '2. Press [[IMPORT VOICE FILE]] under the line and pick the file. [[▶ PLAY]] lets you hear it. 40 seconds at most; big files are made smaller for you.',
   '3. [[REPLACE]] picks a new file, [[REMOVE]] takes it off. Change the words afterwards and it says [[text changed since the voice was imported]]: import a new one.',
   '4. PLAY THIS DRAFT uses it at once. PUBLISH uploads it, then players hear it. Until you publish, the file is only in the browser you imported it in.',
   '## Tags like [whispers]',
   '- In any line you can add ElevenLabs tags in square brackets, for example "[whispers] Placeholder line." or "[laughs]". Players never see them.',
   '- Use lowercase words in brackets. A broken bracket is refused in plain words.',
   '- Tags are used only by an ElevenLabs voice on a model that reads them, such as [[Eleven v4 (newest; supports voice tags — used for Zen Zephyr)|Eleven v4]] or [[Eleven v3 (supports voice tags)]]. A small warning shows when they will not be used.',
   '## Choosing a voice',
   '- The Voice box (under the Giver, or NPCs > [[Lines & voice]]) shows the current voice. [[Choose an ElevenLabs voice]]: paste the voice page link or its ID, name it, [[USE THIS VOICE]]. [[REMOVE MY CHOICE]] goes back.',
   '- Nothing is generated or paid from the editor. [[RE-VOICE]] puts a changed line in the re-voice queue; Claude records it only once you approve the spend.',
   '> Locked voices from the voice registry stay as they are and cannot be changed here.']],
  ['guideme','Guide me and the yellow mission arrow',[
   '## Guide me (in the editor)',
   '- The switch [[Guide me (highlight the next box to fill in)]] at the top is on unless you turn it off.',
   '- The next box you still have to fill in glows softly with a small "Next: …" tag. It uses the same rules as PLAY and PUBLISH, so they never disagree.',
   '- When everything required is filled in it says [[All required fields filled]] and points at PLAY THIS DRAFT. Optional boxes are never highlighted.',
   '## The yellow arrow (in the game)',
   '- While a mission is tracked, the yellow arrow leads the player to the current step: a person, a door, a place. The number under it is the distance in feet along the way.',
   '- It follows doorways and street corners instead of pointing through walls, fades when you are close, and moves on when the step changes.',
   '- Some steps have no arrow on purpose, for example a step done from the V1 Mission Log. The yellow hint line then says which key to press.']],
  ['play','Playing a draft',[
   'Every play button starts a throwaway practice game. Your real save is never touched.',
   '- [[PLAY THIS DRAFT]] (on a mission card): plays that mission from its start.',
   '- [[PLAY THIS DRAFT FROM HERE]] (on a step): starts the mission at that step.',
   '- [[PLAY FROM THE START OF THIS TREE]]: resets the whole tree and begins with its first mission, exactly as a player meets it.',
   '- A button is greyed while the mission cannot be played yet. Hover over it to read what is missing.',
   '## While playing',
   '- A banner at the top says [[PLAYING DRAFT]] and the mission name.',
   '- [[LEAVE DRAFT · BACK TO EDITOR]] ends the test and brings you back to the editor on the same mission. The editor never pops up by itself during a draft.',
   '- If a step fails (for example the hack is lost), it works as in the real game: try again in the game. The banner shows a short [[Draft: step failed|step failed]] note for about 25 seconds.',
   '## "PLAY could not start: …"',
   '- If a play button seems to do nothing, the status line under the Mission Editor\'s top buttons now says "PLAY could not start:" and the reason. Nothing was changed and your draft is safe.',
   '- Please send Claude that exact message so the cause can be fixed.',
   '- Other messages there: "Fix these first …" lists what to fill in (Guide me highlights each box).']],
  ['server','The server copy, sign-in and the server waking up',[
   'Your draft is saved in this browser and copied to the server, so another computer can pick it up. The small line under the top of the Mission Editor says how that copy is doing.',
   '- "Saved on the server" and a time: all good.',
   '- "Server waking up / retrying… next try in N s": the free server sleeps and takes up to a minute to wake. Keep working; it saves by itself once it answers. Your draft is safe in this browser.',
   '- "Server copy not available": the draft is only in this browser for now. Do not clear the browser data; use [[EXPORT MY EDITS]] if you want a backup file.',
   '## Two copies of your drafts',
   'If the server copy and this browser\'s copy differ, a box [[Two copies of your drafts]] appears. Nothing was overwritten. Choose one:',
   '- [[USE THE SERVER COPY (saved |USE THE SERVER COPY]]…: loads the server\'s version here (an export file of this browser\'s copy is made first).',
   '- [[KEEP THIS BROWSER’S COPY (saved |KEEP THIS BROWSER’S COPY]]…: this browser\'s copy replaces the server copy (the older one stays as a server revision).',
   '> Each button shows when that copy was saved and how many trees it has. Usually the newer one is the one you want.',
   '## The bar at the bottom',
   '- [[Sign-in expired|Sign-in expired]] with [[SIGN IN]]: your editor and draft stay open. Press SIGN IN; nothing closes.',
   '- [[Update ready|Update ready]] with [[APPLY UPDATE]]: a new version of the game is out. It applies only when you press it (your draft is saved first).',
   '- The editor stays open until you press [[CLOSE]], [[EXIT TO MAIN MENU]] or Escape. Escape inside a text box only leaves the box.']],
  ['publish','Publish, versions, UNDO and EXPORT MY EDITS',[
   'In the Mission Editor press [[Publish & versions]].',
   '1. [[Check before publishing]] lists [[Problems that block publishing]], what changes for players, and players part-way through a mission you changed.',
   '2. Optional: [[ASK THE SERVER TO CHECK]] runs the server\'s own check.',
   '3. Type a short note of what changed, then [[PUBLISH TO ALL PLAYERS]]. Players get it the next time their game loads. Imported voice files are uploaded first.',
   '- [[Published versions]] lists every version with its date and note. [[UNDO: PUT THE PREVIOUS VERSION BACK]] restores the version before for every player.',
   '- If publishing is switched off on the server, the page says so. Your draft is safe.',
   '## UNDO in the editor',
   '- [[UNDO]] / [[REDO]] at the top right (Ctrl+Z / Ctrl+Shift+Z when you are not typing) work on your draft. They do not change what players have; for that use the version UNDO above.',
   '## EXPORT MY EDITS',
   '- [[EXPORT MY EDITS]] (at the bottom of your tree) downloads a file of your whole draft. Use it as a backup, or send it to Claude or Codex for anything marked "needs a code change".']],
  ['faq','Common problems and fixes',[
   '## PLAY does nothing',
   'Look at the status line near the top for "PLAY could not start: …" and send Claude that message. If the button is greyed, hover over it: it says what is missing. Turn on Guide me to see the next box to fill in.',
   '## The mission does not start in the game',
   '- Check [[How this mission starts]]. For walk near, walk closer (16 ft if no distance is set).',
   '- Check [[…and only when (optional)]]: one condition not true holds it back (for example someone else standing nearby).',
   '- Missions in a tree run in order: the one before must be finished first.',
   '- Is the giver out right now? The giver line says whether players can reach them.',
   '## A step never finishes',
   'Read its Mission Log words and the help under its kind. For a place step, check you picked the right place. Use [[PLAY THIS DRAFT FROM HERE]] on that step to test it quickly.',
   '## The arrow points the wrong way or is missing',
   'Some steps have no arrow on purpose (things done on the V1). Otherwise note the step and where you stood, and send it to Claude.',
   '## "Two copies of your drafts" appeared',
   'Pick the copy with the newer date (see "The server copy, sign-in and the server waking up"). Nothing is lost either way.',
   '## The voice file is not used',
   'The words were changed after the import ([[text changed since the voice was imported]]). Import a new file, or put the words back. On another computer, import it again or publish from the first one.',
   '## My tag like [whispers] shows up in the game or is refused',
   'Use lowercase inside the brackets and close them. Tags are read only by an ElevenLabs voice on a model that supports tags.',
   '## Someone will not sit or stand at the spot I picked',
   'Put the spot right where one steps onto the seat. The editor says in red when a spot or an action does not work there, and why.',
   '## I changed something by mistake',
   'Press [[UNDO]] (Ctrl+Z). For something already published, [[UNDO: PUT THE PREVIOUS VERSION BACK]].']]];
 const LABEL=/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
 /* Every quoted label: {shown, check (the text that must exist in the editor's code), section}. */
 function labels(){const out=[];for(const [id,,lines] of SECTIONS)for(const l of lines)for(const m of l.matchAll(LABEL))out.push({shown:m[1],check:m[2]||m[1],section:id});return out;}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const inline=s=>esc(s).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(m,a)=>'<b class="mg-btn">'+a+'</b>');
 const plain=s=>String(s).replace(LABEL,(m,a)=>a);
 function body(lines){let h='',list=null;const close=()=>{if(list){h+='</'+list+'>';list=null;}};
  for(const l of lines){const b=/^- /.test(l),n=/^\d+\. /.exec(l);
   if(b){if(list!=='ul'){close();h+='<ul>';list='ul';}h+='<li>'+inline(l.slice(2))+'</li>';continue;}
   if(n){if(list!=='ol'){close();h+='<ol>';list='ol';}h+='<li>'+inline(l.slice(n[0].length))+'</li>';continue;}
   close();if(/^## /.test(l))h+='<h4>'+inline(l.slice(3))+'</h4>';else if(/^> /.test(l))h+='<p class="mg-tip">'+inline(l.slice(2))+'</p>';else h+='<p>'+inline(l)+'</p>';}
  close();return h;}
 function html(){const toc='<nav class="mg-toc" aria-label="Contents"><b>Contents</b><ol>'+SECTIONS.map(([id,t])=>'<li data-mg-toc="'+id+'"><a href="#mg-'+id+'" data-mg-jump="'+id+'">'+esc(t)+'</a></li>').join('')+'</ol></nav>';
  const secs=SECTIONS.map(([id,t,lines])=>'<section class="mg-sec" id="mg-'+id+'" data-mg-section="'+id+'"><h3>'+esc(t)+'</h3>'+body(lines)+'<a class="mg-top" href="#mg-top" data-mg-jump="top">Back to contents</a></section>').join('');
  return '<div class="mg-guide" id="mg-top" data-mg-guide="1"><div class="mg-head"><h3 class="mg-title">Mission Editor guide</h3><label class="mg-search">Search <input type="search" data-mg-filter placeholder="e.g. walk near, voice, feet" aria-label="Search the guide"></label><span class="mg-count" data-mg-count role="status"></span></div>'+
   '<div class="mg-cols">'+toc+'<div class="mg-body">'+secs+'<p class="mg-none" data-mg-none hidden>No section mentions that. Try a shorter word.</p></div></div></div>';}
 const words=SECTIONS.map(([id,t,lines])=>[id,(t+' '+lines.map(plain).join(' ')).toLowerCase()]);
 /* The sections that match a search (every word must appear; empty: all). */
 function match(q){const ws=String(q||'').toLowerCase().split(/\s+/).filter(Boolean);return words.filter(([,txt])=>ws.every(w=>txt.includes(w))).map(([id])=>id);}
 let query='';
 function render(panel,head){panel.innerHTML=head+html();const box=panel.querySelector('[data-mg-guide]'),input=box.querySelector('[data-mg-filter]');
  const apply=()=>{query=input.value;const ok=new Set(match(query));for(const s of box.querySelectorAll('[data-mg-section]'))s.hidden=!ok.has(s.dataset.mgSection);for(const li of box.querySelectorAll('[data-mg-toc]'))li.hidden=!ok.has(li.dataset.mgToc);
   box.querySelector('[data-mg-none]').hidden=ok.size>0;box.querySelector('[data-mg-count]').textContent=query.trim()?ok.size+' of '+SECTIONS.length+' sections':'';};
  input.value=query;input.addEventListener('input',apply);apply();
  box.addEventListener('click',e=>{const a=e.target.closest('[data-mg-jump]');if(!a)return;e.preventDefault();const t=a.dataset.mgJump==='top'?box:box.querySelector('#mg-'+a.dataset.mgJump);if(t)t.scrollIntoView({block:'start'});});}
 const api={SECTIONS,labels,html,match,render,plain};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.VoidMissionEditorGuide=api;
})(typeof globalThis!=='undefined'?globalThis:this);
