const test=require('node:test'),assert=require('node:assert/strict');
const MC=require('../void-runner/mission-content.js');
const G=require('../void-runner/mission-givers.js');
const givers=new Map(G.roster({}).map(g=>[g.id,g]));
const interaction={near:'Welcome.\nGood to see you.\nTea?',talk:'What can I get you?',choice:'Tea, please',reply:'Of course.',distance:3,cooldown:60};
test('dialogue pools accept 100 independently bounded alternatives rather than 500 characters total',()=>{
 const many=Array.from({length:100},(_,i)=>'Greeting '+i+' '+ 'x'.repeat(100)).join('\n');
 for(const pool of ['near','talk','reply']){const value={...interaction,[pool]:many};assert.equal(MC.interactionProblems({'tea-host':value},givers).length,0);assert.equal(MC.interactionProblems({'tea-host':{...value,[pool]:many+'\nExtra'}},givers).length,1);assert.equal(MC.interactionProblems({'tea-host':{...value,[pool]:'x'.repeat(501)}},givers).length,1);}
 assert.equal(MC.interactionProblems({'tea-host':{...interaction,near:'x'.repeat(500)}},givers).length,0);assert.equal(MC.interactionProblems({'tea-host':{...interaction,choice:'x'.repeat(61)}},givers).length,1);
});
test('audio filenames match exact words independently of ordering and exclude player choice',()=>{
 const rows=MC.interactionRows('tea-host',interaction);assert.equal(rows.length,5);assert.equal(new Set(rows.map(r=>r.file)).size,5);assert.equal(rows.some(r=>r.text===interaction.choice),false);
 assert.equal(MC.interactionRows('tea-host',{near:'Tea?\nWelcome.'})[1].file,rows[0].file);assert.notEqual(MC.interactionRows('tea-host',{near:'Welcome!'})[0].file,rows[0].file);
 const c={who:'tea-host',text:'Welcome.',hash:'a'.repeat(64),type:'audio/mpeg',duration:1,bytes:100};assert.deepEqual(MC.interactionProblems({'tea-host':{...interaction,clips:[c]}},givers),[]);
 for(const bad of [{...c,who:'admin'},{...c,text:'Other words'},{...c,hash:'invalid'}])assert.ok(MC.interactionProblems({'tea-host':{...interaction,clips:[bad]}},givers).length);
 assert.ok(MC.interactionProblems({'tea-host':{...interaction,clips:[c,c]}},givers).length);
 const env={lineMap:new Map([['tea-host|Welcome.','Mission words']])};assert.equal(MC.mapLine(env,{who:'tea-host',text:'Welcome.',ambient:true}).text,'Welcome.');
});
test('ordinary interactions are checked independently of missions',()=>{
 const c={format:MC.FORMAT,version:1,interactions:{'tea-host':interaction}};
 assert.equal(MC.check(c,{givers}).ok,true);
 for(const bad of [{...interaction,distance:9},{...interaction,cooldown:0},{...interaction,near:'<script>'},{...interaction,reply:''}])assert.equal(MC.check({...c,interactions:{'tea-host':bad}},{givers}).ok,false);
 assert.equal(MC.check({...c,interactions:{unknown:interaction}},{givers}).ok,false);
 const draft=MC.fromDrafts({local:{interactions:c.interactions}});assert.deepEqual(draft.interactions,c.interactions);assert.equal(draft.trees,undefined);
 const env={givers:[...givers.values()]};MC.apply(c,env,{givers});assert.deepEqual(env.interactions,c.interactions);MC.apply(null,env);assert.deepEqual(env.interactions,{});
});
test('greetings alternate, never repeat while standing nearby, and obey cooldown and mission blocking',()=>{
 const p={inside:false,last:-Infinity};assert.equal(MC.interactionDue(interaction,p,2,0,true),false);assert.equal(MC.interactionDue(interaction,p,2,0),true);p.last=0;
 assert.equal(MC.interactionDue(interaction,p,2,70000),false);assert.equal(MC.interactionDue(interaction,p,4,70000),false);assert.equal(MC.interactionDue(interaction,p,2,70000),true);p.last=70000;
 MC.interactionDue(interaction,p,4,71000);assert.equal(MC.interactionDue(interaction,p,2,71000),false);
 assert.deepEqual([0,1,2,3].map(i=>MC.interactionLine(interaction.near,i)),['Welcome.','Good to see you.','Tea?','Welcome.']);
});
