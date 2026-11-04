/* Old VOID//RUNNER campaigns are retired (David, 2026-11-04: the only player with saved progress authorised it).
   Retired means: never loaded, never accepted by the cloud API, a copy kept in the browser, and nothing deleted anywhere else. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../void-runner/campaign.js'),read=f=>fs.readFileSync(f,'utf8');
const legacy=()=>{const s=JSON.parse(JSON.stringify(C.fresh()));delete s.story.flags.campaignEpoch;return s;};

test('every new campaign carries the epoch, and restores',()=>{
 for(const s of [C.fresh(),C.startDistrictCampaign(C.fresh())]){assert.equal(s.story.flags.campaignEpoch,C.campaignEpoch);assert(C.isCurrent(s));assert.equal(C.isLegacy(s),false);assert(C.restore(JSON.stringify(s)));}
 assert.equal(C.startDistrictCampaign(C.fresh()).story.flags.missionPool,'closed');
});
test('campaigns without the epoch are retired, whatever else they hold',()=>{
 const l=legacy();for(const edit of [s=>s,s=>{s.quest='open';s.credits=5000;s.completed=9;},s=>{s.location='rusthaven';s.contract=null;},s=>{s.version=1;}]){const s=legacy();edit(s);assert.equal(C.restore(JSON.stringify(s)),null);assert.equal(C.isLegacy(JSON.stringify(s)),true);}
 assert.equal(C.isLegacy(l),true);
});
test('anything that is not a campaign is neither restored nor mistaken for a retired one',()=>{
 for(const raw of [null,undefined,'','nonsense','[]','{}','{"a":1}','12','null','"text"'])assert.equal(C.isLegacy(raw),false,String(raw));
 assert.equal(C.restore('nonsense'),null);assert.equal(C.restore(null),null);
});
test('the epoch cannot be forged into a corrupt campaign',()=>{
 const bad=JSON.parse(JSON.stringify(C.fresh()));bad.credits=-5;assert.equal(C.restore(JSON.stringify(bad)),null);
 for(const e of ['1',true,1.5,0,-1,null])assert.equal(C.isCurrent({story:{flags:{campaignEpoch:e}}}),false,String(e));
});
test('the browser retires a local legacy campaign: copy kept, slot freed, notice raised; a current one loads untouched',()=>{
 const src=read('void-runner/game.js'),line=src.split('\n').find(l=>l.startsWith('try { const raw = localStorage.getItem(SAVE_KEY)'));assert(line,'startup load line');
 const run=raw=>{const store=raw===undefined?{}:{'void-runner-campaign-v1':raw},ctx={C,SAVE_KEY:'void-runner-campaign-v1',state:C.fresh(),hasSave:false,saveAvailable:true,legacyRetired:false,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}}};vm.runInNewContext(line,ctx);return {ctx,store};};
 const old=JSON.stringify(legacy()),a=run(old);assert.equal(a.ctx.hasSave,false);assert.equal(a.ctx.legacyRetired,true);assert.equal(a.store['void-runner-campaign-v1'],undefined);assert.equal(a.store['void-runner-campaign-v1.retired'],old);
 const first=run(old);first.store['void-runner-campaign-v1.retired']='EARLIER COPY';first.store['void-runner-campaign-v1']=old;vm.runInNewContext(line,{C,SAVE_KEY:'void-runner-campaign-v1',state:C.fresh(),hasSave:false,saveAvailable:true,legacyRetired:false,localStorage:{getItem:k=>first.store[k]??null,setItem:(k,v)=>{first.store[k]=v;},removeItem:k=>{delete first.store[k];}}});assert.equal(first.store['void-runner-campaign-v1.retired'],'EARLIER COPY','an earlier retired copy is never overwritten');
 const cur=JSON.stringify(C.startDistrictCampaign(C.fresh())),b=run(cur);assert.equal(b.ctx.hasSave,true);assert.equal(b.ctx.legacyRetired,false);assert.equal(b.store['void-runner-campaign-v1'],cur);assert.equal(b.store['void-runner-campaign-v1.retired'],undefined);
 const none=run(undefined);assert.equal(none.ctx.hasSave,false);assert.equal(none.ctx.legacyRetired,false);
 const junk=run('not json');assert.equal(junk.ctx.legacyRetired,false);assert.equal(junk.store['void-runner-campaign-v1'],'not json','unreadable data is left alone, not retired');
});
test('only the campaign slot is retired: preferences, voices, bindings and graphics keep their own keys',()=>{
 const src=read('void-runner/game.js');assert.equal((src.match(/removeItem\(/g)||[]).length,1,'game.js removes exactly one key');assert(src.includes("localStorage.removeItem(SAVE_KEY)"));
 for(const f of fs.readdirSync('void-runner').filter(f=>f.endsWith('.js')&&f!=='game.js'))assert(!/removeItem\(\s*SAVE_KEY/.test(read('void-runner/'+f)),f);
});
test('the main menu says so once, and starting a campaign clears it',()=>{
 assert(read('void-runner/menu.js').includes('Your earlier campaign was retired in the District reset'));assert(read('void-runner/game.js').includes('legacyRetired=false;state=C.fresh()'));
});
test('the account page and the cloud API treat a retired cloud save the same way, and never delete it',()=>{
 const a=read('void-runner/account.js');assert(a.includes('account.cloudRetired=data.retired===true')&&a.includes('has been retired'));
 const py=read('void_runner_api.py');assert(py.includes('def is_current_save(value)')&&py.includes('retired = saved.get'));assert(!/player_ref\([^)]*\)\.delete|DELETE_FIELD|firestore\.Increment/.test(py),'the API never deletes or edits a player record to retire a save; only the reset tool, run by hand, does');
});
test('retiring changes nothing about the archived missions, NPCs, voices or ship systems',()=>{
 const M=require('../void-runner/mission-log.js'),voices=JSON.parse(read('tools/audio/npc-voice-registry.json')).npcs;
 assert(Object.keys(M.definitions).length>=18);assert(fs.existsSync('docs/void-runner/mission-archive/2026-11-03/missions.json'));
 for(const who of ['mara','rook','admin','iris','elara','marcus'])assert(Object.keys(voices).join(' ').toLowerCase().includes(who),who);
 const S=require('../void-runner/ships.js');assert(S.ships.starter&&S.ships.ship2&&S.ships.ship3);assert(typeof C.grantShip==='function');
});
