/* Data scenes use the existing typewriter, portraits, speech and campaign. */
let storyScene = null;

function workshopOpening() {
  storyScene = null;
  speech = null;
  mode = 'title';
  view = 'workshop';
  clearInput();
  flightUI(false);
  scene('vesper');
  screen.classList.remove('hidden');
  screen.innerHTML =
    '<section class="cinematic-space"><div class="opening-card"><p>Mara is waiting outside your old workshop.</p>' +
    button('MEET MARA', 'story-intro') + '</div></section>';
}

function playStoryScene(id, nodeId) {
  const def = VoidStoryContent.dialogue[id];
  if (!def) return false;
  const node = def.nodes[nodeId || def.start];
  if (!node || !VoidStory.matches(state, node.when)) return false;
  storyScene = {
    id,
    nodeId: nodeId || def.start
  };
  state.story.cursor = {scene:id,node:storyScene.nodeId,choices:false};
  save();
  talk(def.background, [{
    who: node.character,
    text: node.text
  }], () => {
    if (node.choices) {
      renderStoryChoices(node);
      return;
    }
    VoidStory.apply(state, node.effects);
    save();
    if (node.next) playStoryScene(id, node.next);
    else {
      state.story.cursor = null;
      state.story.pending = state.story.pending.filter(x => x !== id);
      save();
      storyScene = null;
      if (node.end === 'beginJourney') {
        state.story.pending = state.story.pending.filter(x => x !== id);
        C.beginJourney(state);
        save();
        launch();
      } else dock();
    }
  }, node.choices ? 'RESPOND →' : node.label || 'CONTINUE →', def.heading || '');
  return true;
}

function renderStoryChoices(node) {
  mode = 'dialogue';
  if(speech){speech.shown=node.text.length;updateSpeech(0);speech=null;VoidAudio.cancel();}
  state.story.cursor = {scene:storyScene.id,node:storyScene.nodeId,choices:true};
  save();
  const controls = screen.querySelector('.speech-controls');
  controls.innerHTML = node.choices.map((c, i) => VoidStory.matches(state, c.when) ? button(escapeText(c
    .text), 'story-choice:' + i) : '').join('');
}
function resumeStoryScene(){
  const cursor=state.story.cursor;if(!cursor)return false;
  if(!playStoryScene(cursor.scene,cursor.node))return false;
  if(cursor.choices)renderStoryChoices(VoidStoryContent.dialogue[cursor.scene].nodes[cursor.node]);
  return true;
}
screen.addEventListener('click', e => {
  const a = e.target.closest('button')?.dataset.action;
  if (a === 'story-intro') playStoryScene('mara_workshop_intro');
  if (a?.startsWith('story-choice:') && storyScene) {
    const {
      id,
      nodeId
    } = storyScene, choice = VoidStoryContent.dialogue[id].nodes[nodeId].choices[Number(a.split(':')[1])];
    if (!choice || !VoidStory.matches(state, choice.when)) return;
    VoidStory.apply(state, choice.effects);
    save();
    playStoryScene(id, choice.next);
  }
});
const storyDock = dock;
dock = function(tab = 'dock') {
  storyScene = null;
  if (tab === 'dock') {
    const pending = state.story.pending.find(id => id !== 'mara_workshop_intro' && VoidStoryContent
      .dialogue[id]);
    if (pending) {
      playStoryScene(pending);
      return;
    }
  }
  storyDock(tab);
  if (view === 'dock' && state.quest === 'open') screen.querySelector('.actions')?.insertAdjacentHTML(
    'beforeend', button('MISSION BOARD', 'campaign', true));
};
const storyLaunch = launch;
launch = function() {
  leaveMenu();
  VoidStory.emit(state, 'undock', state.location);
  VoidStory.emit(state, 'leaveLocation', state.location);
  storyLaunch();
};

function spawnStoryEncounter(id) {
  const def = VoidStoryContent.encounters[id];
  if (!def || !VoidStory.matches(state, def.when)) return [];
  return def.ships.map((id, i) => {
    const s = VoidStoryContent.ships[id];
    if (!s || state.story.characters[s.owner] === 'dead') return null;
    const e = {
      ...spawnAhead(100, i * 18, 12),
      contentId: id,
      owner: s.owner,
      relationship: s.relationship || s.allegiance,
      className: s.shipClass,
      portrait: s.art && s.art !== 'art/ships.png' ? texture(s.art.replace(/^art\//,'')) : null,
      size: 1,
      armor: 20,
      maxArmor: 20,
      shield: 0,
      maxShield: 0,
      age: 0,
      fire: 2,
      phase: 0,
      velocity: {
        x: 0,
        y: 0,
        z: 0
      },
      interactions: [def.interaction].filter(Boolean)
    };
    enemies.push(e);
    if (VoidStory.hostile(e)) {
      VoidEnemyPilots.init(e, 'rookie', spawned++);
      current.enemies++;
    }
    return e;
  }).filter(Boolean);
}

const encounterUpdate = update;
update = function(dt) {
  encounterUpdate(dt);
  if (mode === 'play' && (!flight.route || flight.route.phase === 'encounter')) {
    for (const id of [...state.story.encounters]) {
      spawnStoryEncounter(id);
      state.story.encounters = state.story.encounters.filter(x => x !== id);
      save();
    }
  }
};
