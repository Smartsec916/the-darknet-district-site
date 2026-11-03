/* Opens every share link in Chromium and checks what the guest holds and that the visitor's own save is untouched.
   Run: node tests/serve-modern.cjs &  then  node tests/share-policy-browser.cjs [id ...]   (Playwright, software GL is fine) */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:5187/void-runner.html',SENTINEL='REAL-SAVE-SENTINEL-DO-NOT-TOUCH';
const LINKS=[['neochinatown','visit'],['darknet-district','visit'],['meridian','visit'],['kepler','visit'],['rusthaven','visit'],['foundry','visit'],['tessaly-belt','visit'],
 ['station-arrival','scenario'],['district-night','scenario'],['meridian-departure','scenario'],['vr-forest','scenario'],['vr-tropical','scenario'],['vr-bedroom','scenario']];
const only=process.argv.slice(2);
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});let failed=0;
 for(const [id,key] of LINKS){if(only.length&&!only.includes(id))continue;
  const ctx=await b.newContext({viewport:{width:1100,height:640}}),pg=await ctx.newPage(),apiWrites=[],errors=[];
  pg.on('pageerror',e=>errors.push(e.message));
  await pg.route('**/api/**',r=>{if(r.request().method()!=='GET')apiWrites.push(r.request().method()+' '+r.request().url());r.fulfill({status:503,body:'{}'});});
  await pg.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await pg.addInitScript(sentinel=>{try{localStorage.setItem('void-runner-campaign-v1',sentinel);}catch(e){}
   window.__saveWrites=[];const set=Storage.prototype.setItem,del=Storage.prototype.removeItem;
   Storage.prototype.setItem=function(k,v){if(/campaign|save/i.test(k)&&v!==sentinel)window.__saveWrites.push(k);return set.apply(this,arguments);};
   Storage.prototype.removeItem=function(k){if(/campaign|save/i.test(k))window.__saveWrites.push('remove '+k);return del.apply(this,arguments);};},SENTINEL);
  try{
   await pg.goto(BASE+'?'+key+'='+id+'&v=1');
   await pg.waitForFunction(()=>window.VoidGuest&&(VoidGuest.phase==='ready'||VoidGuest.phase==='error'),null,{timeout:240000});
   await pg.waitForTimeout(2500);
   const r=await pg.evaluate(()=>({phase:VoidGuest.phase,err:VoidGuest.error&&VoidGuest.error.message,mode,hasShip:VoidShips.hasShip(state),weapon:state.progression.personal.weapon,pistol:state.progression.opening.pistol,
    missions:VoidMissions.all(state,C).length,save:localStorage.getItem('void-runner-campaign-v1'),saveWrites:window.__saveWrites,loc:walkingLocation&&walkingLocation.id,
    hull:(walkingLocation?.solids||[]).filter(s=>s.shipHull).map(s=>s.open),boardShown:(walkingLocation?.interactions||[]).filter(i=>i.action==='board').map(i=>!i.when||VoidStory.matches(state,i.when))}));
   const preview=id==='meridian-departure';
   assert.equal(r.phase,'ready',id+' opens: '+r.err);assert.equal(r.hasShip,preview,id+' ship access');assert.equal(r.weapon,null,id+' no pistol');assert.equal(r.pistol,false);assert.equal(r.missions,0,id+' no missions');
   assert.equal(r.save,SENTINEL,id+' real save is byte-identical');assert.deepEqual(r.saveWrites,[],id+' wrote no save key');assert.deepEqual(apiWrites,[],id+' made no cloud writes');
   if(preview)assert.equal(r.mode,'play','the flight preview is flying');
   if(r.loc==='neochinatown'){assert.deepEqual(r.hull,[true],id+' no invisible ship box');assert.deepEqual(r.boardShown,[false],id+' no boarding prompt');}
   if(r.loc&&r.loc!=='neochinatown')assert(r.boardShown.every(v=>v===false),id+' boarding prompts hidden');
   assert.deepEqual(errors,[],id+' page errors');
   console.log('ok  ',id,JSON.stringify({mode:r.mode,loc:r.loc,ship:r.hasShip}));
  }catch(e){failed++;console.log('FAIL',id,e.message.split('\n')[0]);}
  await ctx.close();}
 await b.close();process.exit(failed?1:0);
})();
