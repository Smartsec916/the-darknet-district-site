const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../void-runner/campaign.js');
const P = require('../void-runner/progression.js');
const Story = require('../void-runner/story.js');
const root = path.resolve(__dirname, '../void-runner');
const source = fs.readFileSync(path.join(root, 'cockpit.js'), 'utf8');
const currentHit = source.slice(source.indexOf('const campaignEnemyHitConsequences='), source.indexOf('function cockpitEquipment'));
// Frozen pre-refactor behavior from upstream 1484d26, retained as an equivalence oracle.
const originalHit = `function hitEnemy(e,damage){if(!VoidStory.hostile(e))return;if(typeof state.progression!=='undefined')VoidProgression.mark(state,'laserCombat');if(!e.generator&&enemies.some(q=>q.generator&&!q.dead))return;const absorbed=Math.min(e.shield||0,damage);e.shield=(e.shield||0)-absorbed;e.armor-=damage-absorbed;VoidCombatEffects.explode(e,'impact');if(e.armor<=0){e.dead=true;resolved++;burst(e,e.boss?'#ff795f':'#ffbd69',e.boss?'large':'ship');VoidStory.emit(state,'destroyTarget',e.contentId||e.className);if(e.owner)state.story.characters[e.owner]='dead';save();}}`;
const copy = value => JSON.parse(JSON.stringify(value));

function run(implementation, options = {}) {
  const trace = [], saves = [];
  const state = C.fresh();
  if (options.noProgression) delete state.progression;
  const enemy = {className:'raider', armor:10, shield:0, ...options.enemy};
  const enemies = [enemy, ...(options.blocker ? [{generator:true, dead:false}] : [])];
  let context;
  const snapshot = () => copy({state:context.state, enemy, resolved:context.resolved});
  const record = name => trace.push({name, ...snapshot()});
  const progression = {...P, mark(s, flag) { record('tutorial'); return P.mark(s, flag); }};
  const story = {...Story, emit(s, type, id) { record('story:'+type+':'+id); return Story.emit(s,type,id); }};
  const module = {exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'campaign.js'),'utf8'), {
    module, require(id) { return id === './progression.js' ? progression : id === './story.js' ? story : require(path.join(root,id)); }
  });
  context = vm.createContext({
    C:module.exports, state, enemies, resolved:0,
    VoidProgression:progression, VoidStory:story,
    VoidCombatEffects:{explode(e,kind){record('effect:'+kind);}},
    burst(e,color,kind){record('burst:'+color+':'+kind);},
    save(){record('save');saves.push(copy(context.state));}
  });
  vm.runInContext(implementation, context);
  if (options.replaceState) context.state = C.fresh();
  for (let i=0;i<(options.hits||1);i++) {
    if (options.neutral) context.hitEnemy(enemy,options.damage??4,null);
    else context.hitEnemy(enemy,options.damage??4);
  }
  return {trace,saves,...snapshot()};
}

const cases = [
  ['shield-only hit',{enemy:{shield:8},damage:4},['tutorial','effect:impact']],
  ['surviving hull hit',{enemy:{shield:2},damage:5},['tutorial','effect:impact']],
  ['lethal hit processed once',{damage:10,hits:2},['tutorial','effect:impact','burst:#ffbd69:ship','story:destroyTarget:raider','save']],
  ['blocked hit marks tutorial before returning',{blocker:true},['tutorial']],
  ['generator can be damaged through protection',{blocker:true,enemy:{generator:true}},['tutorial','effect:impact']],
  ['named boss dies once after its story event',{enemy:{owner:'rook',contentId:'named-target',boss:true},damage:20,hits:2},['tutorial','effect:impact','burst:#ff795f:large','story:destroyTarget:named-target','save']],
  ['friendly target has no effects',{enemy:{relationship:'friendly'}},[]],
  ['already dead target has no effects',{enemy:{dead:true}},[]],
  ['missing progression retains old behavior',{noProgression:true,damage:10},['effect:impact','burst:#ffbd69:ship','story:destroyTarget:raider','save']],
  ['handler follows replacement Campaign state',{replaceState:true,damage:10},['tutorial','effect:impact','burst:#ffbd69:ship','story:destroyTarget:raider','save']]
];
for (const [name,options,order] of cases) test('enemy-hit equivalence: '+name,()=>{
  const actual=run(currentHit,options),previous=run(originalHit,options);
  assert.deepEqual(actual,previous);
  assert.deepEqual(actual.trace.map(e=>e.name),order);
  assert.equal(actual.saves.length,order.includes('save')?1:0);
  if(order.includes('save')) assert.equal(actual.resolved,1);
  if(options.enemy?.owner){
    assert.equal(actual.trace.find(e=>e.name.startsWith('story:')).state.story.characters.rook,undefined);
    assert.equal(actual.saves[0].story.characters.rook,'dead');
  }
});

test('neutral consequence policy retains combat without Campaign mutation or saves',()=>{
  const actual=run(currentHit,{neutral:true,damage:20,enemy:{owner:'rook'},hits:2});
  assert.deepEqual(actual.state,C.fresh());
  assert.deepEqual(actual.saves,[]);
  assert.deepEqual(actual.trace.map(e=>e.name),['effect:impact','burst:#ffbd69:ship']);
  assert.equal(actual.enemy.dead,true);
  assert.equal(actual.resolved,1);
});

test('Campaign consequences preserve story-trigger processing with a test-only event',()=>{
  // Shipped content currently has no destroyTarget event; exercise the real story
  // processor with an in-memory fixture without adding or changing game content.
  Story.content.events.push({id:'test-destruction',trigger:{type:'destroyTarget',subject:'test-target'},effects:{flags:{testDestroyed:true}}});
  try {
    const options={enemy:{contentId:'test-target'},damage:20};
    const actual=run(currentHit,options);
    assert.deepEqual(actual,run(originalHit,options));
    assert.equal(actual.saves[0].story.flags.testDestroyed,true);
    assert.equal(actual.saves[0].story.events.filter(id=>id==='test-destruction').length,1);
  } finally { Story.content.events.pop(); }
});
