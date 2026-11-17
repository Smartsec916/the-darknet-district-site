// Zen Zephyr's local conversation: the quotes (including the two exact lines), topic matching, fallback, no network, and an inactive provider hook.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Z=require('../void-runner/zen-chat.js');
const src=fs.readFileSync(path.join(__dirname,'../void-runner/zen-chat.js'),'utf8');
test('there are about twenty local quotes, each with an id, topics and a source, and no duplicates',()=>{
  assert.ok(Z.QUOTES.length>=20&&Z.QUOTES.length<=30,String(Z.QUOTES.length));assert.equal(new Set(Z.QUOTES.map(q=>q.id)).size,Z.QUOTES.length);assert.equal(new Set(Z.QUOTES.map(q=>q.text)).size,Z.QUOTES.length);
  for(const q of Z.QUOTES){assert.ok(q.text.length>20&&q.text.length<200,q.id);assert.ok(q.topics.length>=1);assert.ok(['owner','origins','placeholder'].includes(q.source));for(const t of q.topics)assert.ok(Z.TOPICS[t],q.id+' topic '+t);}
});
test('the two exact lines are present, word for word',()=>{
  const texts=Z.QUOTES.map(q=>q.text);assert.ok(texts.includes('In the network of complex codes, serenity lies in the simplest line.'));assert.ok(texts.includes('A mindful soul is like a processor; it understands, computes, and calmly executes.'));
  assert.deepEqual(Z.QUOTES.filter(q=>q.source==='owner').length,2);
});
test('every topic has at least two quotes, so matching can rotate',()=>{for(const t of Object.keys(Z.TOPICS))assert.ok(Z.QUOTES.filter(q=>q.topics.includes(t)).length>=2,t);});
test('keyword matching picks the topic, case and punctuation do not matter, and stems count',async()=>{
  const c=Z.create();for(const [ask,topic] of [['I am so AFRAID!','fear'],['how do I find serenity?','serenity'],['I keep thinking about my code','code'],['Tell me about the city and the rain','city'],['my network is down','network'],['I am tired and need rest','work'],['what about silence','silence']]){const r=await c.ask(ask);assert.equal(r.kind,'quote',ask);assert.ok(r.matched.includes(topic),ask+' -> '+r.matched);assert.ok(Z.QUOTES.some(q=>q.text===r.text));}
  assert.ok(Z.topicsOf('breathing slowly').some(t=>t.topic==='breath'),'breathing counts as breath');
});
test('the same question rotates through the matching quotes before repeating',async()=>{
  const c=Z.create(),pool=Z.QUOTES.filter(q=>q.topics.includes('fear')),seen=[];for(let i=0;i<pool.length;i++)seen.push((await c.ask('I am afraid')).text);assert.equal(new Set(seen).size,pool.length,'each once');const again=(await c.ask('I am afraid')).text;assert.ok(pool.some(q=>q.text===again),'then it starts over');
  const a=Z.create(),b=Z.create();assert.equal((await a.ask('fear')).text,(await b.ask('fear')).text,'deterministic');
});
test('greetings, farewells and thanks have their own short replies',async()=>{
  const c=Z.create();assert.equal((await c.ask('hello')).kind,'greeting');assert.equal((await c.ask('goodbye')).kind,'farewell');assert.equal((await c.ask('thanks')).kind,'thanks');
});
test('nothing matched: a calm fallback that invites a different question, never a claim to understand',async()=>{
  const c=Z.create();for(const t of ['','   ','xyzzy plugh','what is the airspeed of a laden swallow','🚀🚀']){const r=await c.ask(t);assert.equal(r.kind,'fallback',JSON.stringify(t));assert.ok(Z.FALLBACKS.includes(r.text));}
  for(const f of Z.FALLBACKS)assert.ok(!/I understand|as an AI|language model|I am an AI/i.test(f));
});
test('choosing a quote from the list says exactly that quote',()=>{
  const c=Z.create(),q=Z.QUOTES[5],r=c.choose(q.id);assert.equal(r.text,q.text);assert.equal(r.kind,'chosen');assert.equal(c.choose('nope'),null);
});
test('it does not pretend to be an AI: the label says so and no reply claims otherwise',async()=>{
  assert.match(Z.LABEL,/NOT AN AI/);const c=Z.create();for(const t of ['are you an AI','are you a person','do you think','who are you','are you alive']){const r=await c.ask(t);assert.ok(!/I am an AI|as a language model|I was trained/i.test(r.text),r.text);assert.equal(r.provider,'local');}
  for(const q of Z.QUOTES)assert.ok(!/I am an AI|language model|trained on/i.test(q.text),q.id);
});
test('everything is local: no network, storage or credential code in the module',()=>{
  const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');for(const bad of ['fetch(','XMLHttpRequest','WebSocket','sendBeacon','localStorage','sessionStorage','api_key','apiKey','Authorization','process.env','require('])assert.ok(!code.includes(bad),'no '+bad);
});
test('a future API provider can be registered but is OFF until switched on, and a failing one falls back',async()=>{
  const c=Z.create();let called=0;assert.throws(()=>c.registerProvider({id:'x'}));assert.throws(()=>c.registerProvider(null));
  c.registerProvider({id:'future-api',respond:async()=>{called++;return {text:'from the provider'};}});assert.equal(c.providerId,'future-api');assert.equal(c.providerOn,false);
  assert.notEqual((await c.ask('hello')).text,'from the provider');assert.equal(called,0,'registered but never called by default');
  assert.equal(c.enableProvider(true),true);const r=await c.ask('hello');assert.equal(r.text,'from the provider');assert.equal(r.provider,'future-api');assert.equal(called,1);
  const bad=Z.create();bad.registerProvider({id:'broken',respond:async()=>{throw new Error('offline');}});bad.enableProvider(true);const f=await bad.ask('I am afraid');assert.equal(f.provider,'local','falls back to the local answer');assert.equal(f.kind,'quote');
  assert.equal(Z.create().enableProvider(true),false,'cannot be enabled without a provider');
});
