/* ZEN ZEPHYR: the local conversation. Pure (runs in Node and the browser); tests/zen-chat.test.cjs. docs/development/TEMPLE.md.
   This is NOT an AI model and does not pretend to be one. It recites a fixed set of provisional quotes chosen by simple keyword and topic matching, with a fallback.
   The lines are placeholders for David to approve or replace; two are the exact lines he specified, two are taken from the Zen Zephyr scenes of the Origins page
   (origins/index.html, scene zen_wisdom and sanctum_introduction; mood only, not canon). Everything stays on the device: no network, no credentials, no cost.
   A future API-powered dialogue can plug in through the provider interface at the bottom; it is OFF by default and nothing here ever calls it unless it is registered AND enabled. */
(function(root){
 'use strict';
 // id, text, topics (what the quote is about), source ('david' exact line | 'origins' | 'placeholder'). Selectable in the panel's list as well as chosen by matching.
 const QUOTES=[
  {id:'q01',text:'In the network of complex codes, serenity lies in the simplest line.',topics:['serenity','code'],source:'david'},
  {id:'q02',text:'A mindful soul is like a processor; it understands, computes, and calmly executes.',topics:['mind','serenity'],source:'david'},
  {id:'q03',text:'The circuit board and the lotus flower differ only in the observer\'s perception.',topics:['machines','mind'],source:'origins'},
  {id:'q04',text:'Technology alone will not keep a sanctuary alive. Find the people who know why it matters.',topics:['sanctuary','network'],source:'origins'},
  {id:'q05',text:'Before you run the next process, let the last one finish.',topics:['work','mind','serenity'],source:'placeholder'},
  {id:'q06',text:'A signal carried in a hurry arrives damaged. Slow the breath and the message clears.',topics:['breath','network','fear'],source:'placeholder'},
  {id:'q07',text:'Fear is only a loop with no exit condition. Name it and it ends.',topics:['fear','code'],source:'placeholder'},
  {id:'q08',text:'The server hums because it has nothing to prove. Sit, and hum with it.',topics:['serenity','machines','breath'],source:'placeholder'},
  {id:'q09',text:'Every cable here carries a thought somewhere. None of them are in a hurry.',topics:['network','serenity'],source:'placeholder'},
  {id:'q10',text:'You cannot debug a storm. You can only keep your own code clean while it passes.',topics:['fear','code','city'],source:'placeholder'},
  {id:'q11',text:'Rain does not argue with the city. It falls, and the city is washed.',topics:['city','serenity','change'],source:'placeholder'},
  {id:'q12',text:'The oldest backup is silence. Return to it when the rest is corrupted.',topics:['silence','breath','mind'],source:'placeholder'},
  {id:'q13',text:'What you call flesh and what you call code are both patterns that agreed to stay together for a while.',topics:['machines','change'],source:'placeholder'},
  {id:'q14',text:'A road is made by the next step, not by the map. Take the step.',topics:['change','work'],source:'placeholder'},
  {id:'q15',text:'Rest is not a failure of the system. It is part of its design.',topics:['work','serenity'],source:'placeholder'},
  {id:'q16',text:'The flame burns blue when nothing is wasted. Waste less, and burn clearer.',topics:['serenity','work','change'],source:'placeholder'},
  {id:'q17',text:'Loneliness is a connection waiting for a handshake. Offer yours first.',topics:['sanctuary','network','fear'],source:'placeholder'},
  {id:'q18',text:'Delete what you carry only because you have always carried it.',topics:['change','work','fear'],source:'placeholder'},
  {id:'q19',text:'The city is loud so that you will learn where your own quiet is.',topics:['city','silence','serenity'],source:'placeholder'},
  {id:'q20',text:'Listen to the hum beneath the hum. That is where the answer keeps its place.',topics:['silence','network','mind'],source:'placeholder'},
  {id:'q21',text:'No one is made to run forever. Even the brightest tower sleeps in the small hours.',topics:['work','city','serenity'],source:'placeholder'},
  {id:'q22',text:'Ask smaller. The simplest question has the longest answer.',topics:['code','mind','serenity'],source:'placeholder'}];
 // What each topic listens for. Words are matched whole, lower case, after a little cleaning ("breathing" counts as "breath").
 const TOPICS={
  serenity:['serenity','peace','peaceful','calm','quiet','still','stillness','relax','tranquil','serene','gentle'],
  code:['code','simple','simplest','program','script','line','bug','debug','compile','logic','loop','algorithm'],
  mind:['mind','mindful','think','thought','thoughts','processor','compute','understand','focus','soul','wisdom','learn','know'],
  network:['network','connect','connection','signal','internet','grid','link','data','server','cable','online','message'],
  fear:['fear','afraid','worry','worried','anxious','anxiety','scared','stress','stressed','panic','nervous','dread'],
  change:['change','future','tomorrow','begin','beginning','start','path','journey','new','grow','growth','lost'],
  breath:['breath','breathe','breathing','inhale','exhale','air'],
  silence:['silence','silent','listen','listening','sound','noise','meditate','meditation','pray','prayer'],
  machines:['machine','machines','robot','human','humans','flesh','android','synthetic','alive','conscious','consciousness','body'],
  city:['city','neon','rain','street','streets','crowd','tower','towers','light','lights','night','home'],
  sanctuary:['help','sanctuary','safe','people','friend','friends','together','resist','resistance','function','alone','lonely','loneliness'],
  work:['work','tired','sleep','rest','burnout','busy','time','hurry','job','duty']};
 const GREETING=['hello','hi','hey','greetings','welcome','zephyr','sanctum','who'],FAREWELL=['bye','goodbye','farewell','leave','leaving'],THANKS=['thanks','thank','grateful'];
 const GREETING_LINES=['Be welcome. The servers have been expecting you, in their way.','You came up the hill in the rain. Sit, if you like. Ask what you will.'];
 const FAREWELL_LINES=['Go gently. The hill will keep the quiet for you.','Return when the city is too loud.'];
 const THANKS_LINES=['Nothing was given that was not already yours.'];
 // When nothing matches: still a calm, honest answer, and an invitation to ask differently. Never a claim to understand what was not understood.
 const FALLBACKS=['The line is quiet. Say it again with fewer words.','I recite what I know, and this is not in it. Try asking about code, fear, silence, the city or rest.','Not every question has a quote waiting. Breathe, and ask it smaller.','The altar has nothing written for that. Choose a teaching from the list, or ask about serenity.'];
 const words=t=>String(t||'').toLowerCase().replace(/[^a-z\s']/g,' ').split(/\s+/).filter(Boolean);
 const stem=w=>w.replace(/(ing|ed|es|s)$/,'');
 // Which topics does the text touch? Returns [{topic, hits}] best first.
 function topicsOf(text){const ws=words(text),stems=new Set(ws.map(stem)),found=[];
  for(const [topic,keys] of Object.entries(TOPICS)){let hits=0;for(const k of keys)if(ws.includes(k)||stems.has(stem(k)))hits++;if(hits)found.push({topic,hits});}
  return found.sort((a,b)=>b.hits-a.hits);}
 const has=(text,list)=>{const ws=words(text);return list.some(k=>ws.includes(k));};

 // A conversation. Deterministic: it rotates through the matching quotes and prefers ones not yet said.
 function create(opts={}){
  const said=new Set(),log=[];let n=0,provider=null,providerOn=false;
  // The first quote of the topic not yet said, in the list's order; when all have been said the topic starts again from its first. (Not tied to a shared counter, so a greeting does not change which line comes first.)
  const pick=list=>{let fresh=list.filter(q=>!said.has(q.id));if(!fresh.length){for(const q of list)said.delete(q.id);fresh=list.slice();}const choice=fresh[0];said.add(choice.id);return choice;};
  function local(text){
   const t=String(text||'').trim();if(!t)return {text:FALLBACKS[0],quote:null,topic:null,matched:[],kind:'fallback',provider:'local'};
   const tp=topicsOf(t);
   if(has(t,FAREWELL))return {text:FAREWELL_LINES[(n++)%FAREWELL_LINES.length],quote:null,topic:'farewell',matched:[],kind:'farewell',provider:'local'};
   if(has(t,THANKS)&&!tp.length)return {text:THANKS_LINES[0],quote:null,topic:'thanks',matched:[],kind:'thanks',provider:'local'};
   if(has(t,GREETING)&&!tp.length)return {text:GREETING_LINES[(n++)%GREETING_LINES.length],quote:null,topic:'greeting',matched:[],kind:'greeting',provider:'local'};
   if(tp.length){const top=tp[0].topic,pool=QUOTES.filter(q=>q.topics.includes(top)),q=pick(pool);return {text:q.text,quote:q.id,topic:top,matched:tp.map(x=>x.topic),kind:'quote',provider:'local'};}
   return {text:FALLBACKS[(n++)%FALLBACKS.length],quote:null,topic:null,matched:[],kind:'fallback',provider:'local'};}
  // The panel's list: choosing a quote just says it.
  function choose(id){const q=QUOTES.find(x=>x.id===id);if(!q)return null;said.add(q.id);return {text:q.text,quote:q.id,topic:q.topics[0],matched:q.topics.slice(),kind:'chosen',provider:'local'};}
  // ask(): always answers locally unless a provider has been registered AND switched on; a failing provider falls back to the local answer.
  async function ask(text){let r;
   if(provider&&providerOn){try{const out=await provider.respond(String(text||''),{history:log.slice(-8)});if(out&&typeof out.text==='string'&&out.text.trim())r={text:out.text.trim(),quote:null,topic:null,matched:[],kind:'provider',provider:provider.id};}catch{}}
   if(!r)r=local(text);log.push({you:String(text||''),zen:r.text});if(log.length>200)log.shift();return r;}
  // The future API hook. provider: {id:string, respond(text,{history})->Promise<{text}>}. Registering does NOT switch it on.
  function registerProvider(p){if(!p||typeof p.id!=='string'||typeof p.respond!=='function')throw new Error('A dialogue provider needs an id and a respond(text, context) function.');provider=p;providerOn=false;return true;}
  const enableProvider=on=>{providerOn=!!on&&!!provider;return providerOn;};
  return {ask,local,choose,registerProvider,enableProvider,get providerOn(){return providerOn;},get providerId(){return provider?.id||null;},get log(){return log.slice();},get said(){return [...said];}};
 }
 const api={QUOTES,TOPICS,FALLBACKS,GREETING_LINES,topicsOf,create,words,LABEL:'LOCAL RECITATION · NOT AN AI'};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidZenChat=api;
})(typeof globalThis!=='undefined'?globalThis:this);
