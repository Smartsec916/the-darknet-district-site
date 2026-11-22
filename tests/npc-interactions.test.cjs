const test=require('node:test'),assert=require('node:assert/strict');
const MC=require('../void-runner/mission-content.js');
const G=require('../void-runner/mission-givers.js');
const givers=new Map(G.roster({}).map(g=>[g.id,g]));
const interaction={near:'Welcome.\nGood to see you.\nTea?',talk:'What can I get you?',choice:'Tea, please',reply:'Of course.',distance:3,cooldown:60};
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
