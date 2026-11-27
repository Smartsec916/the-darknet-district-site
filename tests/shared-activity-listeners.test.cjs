const test=require('node:test');
const assert=require('node:assert/strict');
const shared=require('../void-runner/shared-activities.js');
const entry=(id,requires='',speaker='neon')=>({id,locations:['store','bar'],behavior:{phase:'general',requires},lines:[{speaker,seconds:2,text:'Fixture'}]});
const rows=[entry('pn-neutral-a'),entry('pn-admin','admin'),entry('pn-observer','observer'),entry('pn-neutral-b')];
const ctx={venue:'store',elapsed:15,remaining:100,split:false,admin:true,iris:true,observer:true,approaching:false,completed:false};
test('public slots stay identical across local story and proximity state',()=>{
 for(let i=0;i<100;i++){
  const a=shared.conversationAt(rows,{},ctx,i*52,1);
  for(const other of [{...ctx,admin:false},{...ctx,observer:false},{...ctx,admin:false,observer:false}]){
   assert.deepEqual(shared.conversationAt(rows,{},other,i*52,1),a);
   assert.equal(shared.slotKey(other,i*52),shared.slotKey(ctx,i*52));
  }
 }
});
test('listener restrictions suppress rather than replace a public selection',()=>{
 let blocked=0;
 for(let i=0;i<100;i++){
  const other={...ctx,admin:false,observer:false};
  const beat=shared.conversationAt(rows,{},other,i*52,1);
  const normal=shared.conversationAt(rows,{},ctx,i*52,1);
  assert.equal(beat.entry.id,normal.entry.id);
  if(!shared.contextFits(beat.entry,beat.entry.behavior,other))blocked++;
 }
 assert.equal(blocked,50);
});
test('a local story or observer change does not reroll a slot mid-line or on late join',()=>{
 const later={...ctx,elapsed:17,remaining:98,admin:false,observer:false};
 for(let i=0;i<100;i++){
  const before=shared.conversationAt(rows,{},ctx,i*52,1);
  const after=shared.conversationAt(rows,{},later,i*52,1);
  assert.equal(before.entry.id,after.entry.id);
  assert.equal(after.time-before.time,2);
  assert.equal(shared.slotKey(later,i*52),shared.slotKey(ctx,i*52));
 }
});
test('reserved public beats remain reserved even when a listener cannot hear',()=>{
 for(const e of rows.slice(1,3)){
  const other={...ctx,admin:false,observer:false};
  assert.equal(shared.reservedAt(e,e.behavior,ctx,0),true);
  assert.equal(shared.reservedAt(e,e.behavior,other,0),true);
  assert.equal(shared.contextFits(e,e.behavior,other),false);
  assert.equal(shared.reservedAt(e,e.behavior,other,99),false);
 }
 assert.equal(shared.reservedAt(null,null,ctx,0),false);
});
test('shared venue, speaker and split restrictions still apply',()=>{
 const onlyAdmin=[rows[1]];
 assert.equal(shared.conversationAt(onlyAdmin,{}, {...ctx,venue:'bar'},0,1),null);
 assert.equal(shared.conversationAt([entry('pn-pixel','','pixel')],{}, {...ctx,split:true},0,1),null);
 assert.equal(shared.conversationAt(rows,{}, {...ctx,venue:'arcade'},0,1),null);
 assert.notEqual(shared.slotKey({...ctx,venue:'bar'},0),shared.slotKey(ctx,0));
});

test('late arrival before or after a reserved beat uses the same ambient candidate',()=>{
 const short={...entry('pn-short'),lines:[{speaker:'neon',seconds:3,text:'Fixture'}]};
 const long={...entry('pn-long'),lines:[{speaker:'neon',seconds:20,text:'Fixture'}]};
 const reserved={...entry('pn-reserved'),lines:[{speaker:'neon',seconds:5,text:'Fixture'}]};
 const library=[short,long];
 for(let seed=0;seed<100;seed++){
  for(const [early,late,end,decisionAt] of [[3,18,100,10],[55,73,130,64]]){
   const a=shared.ambientSlotContext({...ctx,elapsed:early,remaining:end-early},reserved,decisionAt);
   const b=shared.ambientSlotContext({...ctx,elapsed:late,remaining:end-late,admin:false,observer:false},reserved,decisionAt);
   const before=shared.conversationAt(library,{},a,seed*52,1);
   const after=shared.conversationAt(library,{},b,seed*52,1);
   assert.equal(before.entry.id,'pn-short');
   assert.equal(after.entry.id,before.entry.id);
  }
  for(const elapsed of [3,18]){
   const blocked=shared.ambientSlotContext({...ctx,elapsed,remaining:100-elapsed},reserved,3);
   assert.equal(shared.conversationAt(library,{},blocked,seed*52,1),null);
  }
 }
});
test('after-activity eligibility is frozen at the shared slot anchor',()=>{
 const after={...entry('pn-after'),behavior:{phase:'after'}};
 const library=[entry('pn-general'),after];
 for(let seed=0;seed<100;seed++){
  const early=shared.ambientSlotContext({...ctx,elapsed:3,remaining:37,completed:false},null,0);
  const late=shared.ambientSlotContext({...ctx,elapsed:35,remaining:5,completed:true},null,0);
  assert.equal(shared.conversationAt(library,{},early,seed*52,1).entry.id,'pn-general');
  assert.equal(shared.conversationAt(library,{},late,seed*52,1).entry.id,'pn-general');
  const eligible=shared.ambientSlotContext({...ctx,elapsed:55,remaining:30,completed:true},null,0);
  assert.equal(shared.conversationAt([after],{},eligible,seed*52,1).entry.id,'pn-after');
 }
});
