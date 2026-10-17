const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../void-runner/comms.js'),W=require('../void-runner/warflying.js'),X=require('../void-runner/warflying-scan.js');
const P=require('../void-runner/progression.js'),C=require('../void-runner/campaign.js'),R=require('../void-runner/relay.js');
const see=(db,id,t=1000,place='erebus',confidence='confirmed')=>W.observe(db,{sourceId:id,confidence,place},t);
const game=(extra={})=>({location:'meridian',universe:{currentSystem:'erebus'},story:{flags:{}},...extra});

// ---- Communications (doc 11 §12–§15) ----
test('the link is connected in every system and drops only in warp between systems',()=>{
  assert.equal(M.status(game()).state,'connected');
  assert.equal(M.status(game({location:'vigil',universe:{currentSystem:'communion'}})).state,'connected');
  assert.equal(M.status(game(),{route:{origin:'meridian',destination:'kepler',phase:'warp',progress:.5}}).state,'connected','local warp keeps the link');
  const between=M.status(game(),{route:{origin:'meridian',destination:'vigil',phase:'warp',progress:.5}});
  assert.equal(between.state,'disconnected');assert.equal(between.reason,'warp');
  assert.equal(M.status(game(),{route:{origin:'meridian',destination:'vigil',phase:'arrived',progress:1}}).state,'connected');
});
test('a future mission can change one region without touching the scanner, and restore it',()=>{
  const s=game();assert.ok(M.setRegion(s,'erebus','degraded'));
  assert.equal(M.status(s).state,'degraded');assert.equal(M.status(s).reason,'region');assert.ok(M.canUpload(M.status(s)));
  assert.equal(M.status(game({story:s.story,location:'vigil',universe:{currentSystem:'communion'}})).state,'connected','other regions are unaffected');
  assert.ok(M.setRegion(s,'erebus','unavailable'));assert.equal(M.canUpload(M.status(s)),false);
  assert.equal(M.setRegion(s,'nowhere','disconnected'),false);assert.equal(M.setRegion(s,'erebus','broken'),false);
  assert.ok(M.setRegion(s,'erebus',null));assert.equal(M.status(s).state,'connected');assert.equal(s.story.flags['comms-erebus'],undefined);
});
test('The Darknet District blocks broadcasts, collection and uploads, and nothing else',()=>{
  for(const a of ['relay','collection','uploads'])assert.equal(M.allows('earth',true,a),false,a);
  for(const a of ['music','arcade','pods','private','store','announcements'])assert.equal(M.allows('earth',true,a),true,a);
  assert.equal(M.allows('earth',false,'relay'),true,'in flight over NeoChinatown is not the premises');
  assert.equal(M.allows('meridian',true,'uploads'),true);
  assert.equal(M.status(game({location:'earth',universe:{currentSystem:'sol'}}),{onFoot:true}).state,'unavailable');
  // The Relay radio gives way on the premises.
  const r=R.create(),seg=[{id:'a',kind:'news',text:'x'}];
  assert.equal(R.step(r,9,{on:true,system:'sol',protected:!M.allows('earth',true,'relay')},seg),null);
});

// ---- Uploads (§13–§14, §38) ----
test('new sightings and identifications queue; points never depend on uploading',()=>{
  const db=W.fresh();see(db,'beacon:erebus-1');see(db,'ship:erebus-cargo-1',1000,'erebus','partial');
  assert.deepEqual(W.queue(db).sort(),['beacon:erebus-1','ship:erebus-cargo-1']);assert.equal(W.points(db),1);
  const batch=W.beginUpload(db,10);assert.equal(batch.length,2);assert.equal(W.finishUpload(db,batch),2);
  assert.equal(W.queue(db).length,0);assert.equal(W.points(db),1,'uploading earns nothing and costs nothing');
  assert.equal(W.finishUpload(db,batch),0,'the same batch can never be sent twice');
  see(db,'beacon:erebus-1',1000+W.limits.sightingGap,'kepler');assert.deepEqual(W.queue(db),['beacon:erebus-1'],'a new sighting queues the record again');
  see(db,'ship:erebus-cargo-1',1500);assert.ok(W.queue(db).includes('ship:erebus-cargo-1'),'an identification queues it');
});
test('an interrupted upload loses nothing and sends nothing twice',()=>{
  const db=W.fresh();for(const id of ['beacon:erebus-1','beacon:erebus-2','beacon:erebus-3','satellite:erebus-1'])see(db,id);
  W.beginUpload(db,10);// the link drops: the batch is never finished
  assert.equal(W.queue(db).length,4,'still queued');
  const batch=W.beginUpload(db,10);see(db,'beacon:erebus-2',1000+W.limits.sightingGap,'kepler');
  assert.equal(W.finishUpload(db,batch),3,'the record that changed in transit waits for the next upload');
  assert.deepEqual(W.queue(db),['beacon:erebus-2']);
  assert.equal(W.beginUpload(db,0).length,0);
});
test('the queue, the auto-upload choice and the trail survive saving and reloading',()=>{
  const s=C.fresh();s.warflying.autoUpload=false;see(s.warflying,'beacon:sol-1');see(s.warflying,'beacon:sol-2');
  W.finishUpload(s.warflying,W.beginUpload(s.warflying,1));
  W.noteSighting(s.warflying,{place:'erebus:meridian>kepler',time:5,scrambled:false});
  const back=C.restore(JSON.stringify(s)).warflying;
  assert.equal(back.autoUpload,false);assert.equal(W.queue(back).length,1);assert.equal(Object.values(back.records).filter(r=>r.u==='uploaded').length,1);
  assert.deepEqual(back.trail,{linked:1,unlinked:0,recent:[{t:5,place:'erebus:meridian>kepler',linked:1}]});
  assert.equal(W.points(back),2);
});
test('records saved before uploads existed join the queue',()=>{
  const db=W.restore({records:{'beacon:sol-1':{conf:'confirmed',p:1,f:1,l:2,k:1,places:['sol'],u:'local'},'beacon:sol-2':{conf:'confirmed',p:1,f:1,l:2,k:1,places:['sol'],u:'uploaded'}}});
  assert.deepEqual(W.queue(db),['beacon:sol-1']);assert.deepEqual(db.trail,{linked:0,unlinked:0,recent:[]});
});

// ---- The scrambler (§25) ----
test('with a scrambler, new sightings of your ship are unidentified; earlier ones stay as they were',()=>{
  const db=W.fresh();
  W.noteSighting(db,{place:'erebus:meridian>kepler',time:1,scrambled:false});W.noteSighting(db,{place:'sol:earth>sol-belt',time:2,scrambled:false});
  W.noteSighting(db,{place:'erebus:kepler>meridian',time:3,scrambled:true});
  assert.equal(db.trail.linked,2,'never erased or rewritten');assert.equal(db.trail.unlinked,1);
  assert.deepEqual(db.trail.recent.map(e=>e.linked),[1,1,0]);
  for(let i=0;i<20;i++)W.noteSighting(db,{place:'erebus',time:10+i,scrambled:true});
  assert.equal(db.trail.recent.length,W.limits.trail,'bounded');assert.equal(db.trail.unlinked,21);
});
test('other pilots notice you on about half of your routes, unpredictably but repeatably',()=>{
  let hits=0;for(let i=0;i<2000;i++)if(X.noticed('meridian','kepler',i))hits++;
  assert.ok(hits>900&&hits<1300,String(hits));assert.equal(X.noticed('meridian','vigil',77),X.noticed('meridian','vigil',77));
});
test('scanner and scrambler share the one Utility slot and stay owned when swapped',()=>{
  const s=C.fresh();s.credits=5000;s.activeShip='starter';
  assert.equal(P.buy(s,'warflying-scrambler'),false,'not sold at outfitters');
  assert.equal(P.buy(s,'warflying-module','admin'),false,'Admin sells only the scrambler');
  assert.ok(P.buy(s,'warflying-scrambler','admin'));assert.ok(P.buy(s,'warflying-module'));
  assert.equal(P.buy(s,'warflying-scrambler','admin'),false,'never bought twice');
  assert.equal(P.utility(s),null,'buying never fits anything');
  assert.ok(P.install(s,'signal','warflying-scrambler'));assert.equal(P.utility(s),'warflying-scrambler');
  assert.ok(P.install(s,'signal','warflying-module'));assert.equal(P.utility(s),'warflying-module','one replaces the other');
  assert.deepEqual(s.progression.equipment.owned.filter(id=>id.startsWith('warflying')).sort(),['warflying-module','warflying-scrambler']);
  assert.equal(P.buy(s,'signal-tracker','admin'),false);assert.equal(P.install(s,'signal','signal-tracker'),false);
});
test('the sealed delivery stays trouble-free and its contents stay unknown',()=>{
  assert.equal(C.sealedCargo.name,'Don’t Ask Questions');assert.equal(C.sealedCargo.enemies,0);
  assert.match(C.sealedCargo.cargo,/undisclosed/);
});
