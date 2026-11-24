/* Mission Editor, 18 Nov 2026 (the owner: two separate features). (1) Reverie and Lace, the Avenue's street pair, are mission givers: in the roster, talkable on
   The Avenue, their missions offered only while that one is out on the street (UTC: hours 0-11 Reverie, 12-23 Lace, nobody for the first 90 s of a shift).
   (2) The start trigger "When walked near": a distance in metres (default 5, 1..30), any giver; it starts once, in tree order, checked by the game and the server. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G,MS};}
const at=(h,m=0,s=0)=>Date.UTC(2026,10,18,h,m,s);
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;return s;};
const doc=(x,...trees)=>({format:x.MC.FORMAT,version:x.MC.VERSION,trees:[...x.MC.treesContent(x.MS.trees(),{givers:x.e.givers}).trees,...trees]});
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const STORY_ID=/^[a-zA-Z][\w-]{0,63}$/;   // void_runner_api.py clean_save story_id (story.met, relationships, ...)

test('retired NPCs have no mission giver entries',()=>{
 const ids=env().e.givers.map(g=>g.id);
 for(const id of ['grey-reverie','ethereal-lace'])assert.ok(!ids.includes(id));
});

const nearTree=(npc,distance,giver='admin')=>({id:'draft-near',name:'Near',missions:[
 {id:'draft-near-m1',number:42,title:'Walk by',type:'side',giver,start:{how:'notification',channel:'notify',from:giver,text:'Over here.',when:{kind:'near',...(npc?{npc}:{}),...(distance===undefined?{}:{distance})}},objectives:[{id:'see',kind:'talk',npc:giver,label:'Talk to them.'}]},
 {id:'draft-near-m2',number:43,title:'Walk by again',type:'side',giver,start:{how:'notification',channel:'notify',from:giver,text:'Again.',when:{kind:'near',npc:npc||giver,distance:2}},objectives:[{id:'see2',kind:'talk',npc:giver,label:'Talk again.'}]}]});

test('"When walked near": in the editor\'s trigger list; distance default 5 m, clamped to 1..30; checked by the game (and kept by the editor\'s export)',()=>{
 const x=env(),{MC,G}=x;
 assert.ok(G.START_WHEN.some(w=>w.id==='near'&&w.name==='When walked near'));assert.ok(MC.WHEN.includes('near'));
 assert.deepEqual([G.NEAR.min,G.NEAR.max,G.NEAR.def],[1,30,5]);
 for(const [v,want] of [[undefined,5],[null,5],['',5],['abc',5],[NaN,5],[5,5],[0,1],[-3,1],[0.4,1],[31,30],[1000,30],['12',12],[7.25,7.3],[2.5,2.5]])assert.equal(G.nearMetres(v),want,String(v));assert.equal(MC.nearMetres(),5);
 assert.equal(MC.nearHit(4.99,undefined),true);assert.equal(MC.nearHit(5,undefined),true);assert.equal(MC.nearHit(5.01,undefined),false);assert.equal(MC.nearHit(Infinity,30),false);assert.equal(MC.nearHit(undefined,5),false);assert.equal(MC.nearHit(0.5,0),true,'clamped up to 1 m');assert.equal(MC.nearHit(29,100),true);assert.equal(MC.nearHit(31,100),false,'clamped to 30 m');
 assert.deepEqual(MC.check(doc(x,nearTree('admin',5)),ctx(x)).errors,[]);assert.deepEqual(MC.check(doc(x,nearTree(null,undefined)),ctx(x)).errors,[],'npc and distance may be left out (the giver, 5 m)');
 for(const d of [0,31,'5',NaN])assert.ok(MC.check(doc(x,nearTree('admin',d)),ctx(x)).errors.length,'distance '+String(d));
 assert.ok(MC.check(doc(x,nearTree('juno-vex',5)),ctx(x)).errors.length,'someone without a TALK prompt cannot be measured');
 const bad=nearTree('admin',5);bad.missions[0].start.when={kind:'place',place:'port',distance:5};assert.ok(MC.check(doc(x,bad),ctx(x)).errors.length,'distance only on near');
 // the editor's export (treeStrip) keeps who and how far, filling the defaults
 const st=MC.treeStrip({...nearTree(null,undefined).missions[0]});assert.deepEqual(st.start.when,{kind:'near',npc:'admin',distance:5});
 assert.deepEqual(MC.treeStrip({...nearTree('iris',12).missions[0]}).start.when,{kind:'near',npc:'iris',distance:12});
 assert.deepEqual(MC.treeStrip({...nearTree('iris',99).missions[0]}).start.when.distance,30);
 // (the same export now also keeps "after in-game time"'s mission and minutes)
 assert.deepEqual(MC.treeStrip({id:'draft-x-m1',title:'X',giver:'admin',start:{how:'notification',channel:'notify',from:'admin',text:'x',when:{kind:'game-time',mission:'m001-awakening',value:90}},objectives:[]}).start.when,{kind:'game-time',mission:'m001-awakening',value:90});
 assert.deepEqual(MC.nearList(MC.treesContent([nearTree(null,undefined)],{givers:x.e.givers}).trees).map(n=>[n.mission,n.npc,n.metres]),[['draft-near-m1','admin',5],['draft-near-m2','admin',2]]);
 assert.deepEqual(MC.treeBlockers({...nearTree('juno-vex',5).missions[0]},x.e.givers).filter(b=>/walked near/.test(b)).length,1);
});

test('"When walked near" starts the mission once, at the distance set, in tree order (the next one waits); with Reverie only while she is out',()=>{
 const x=env(),{MC}=x;MC.apply({format:MC.FORMAT,version:MC.VERSION,trees:[nearTree('admin',undefined)]},x.e);const s=player(x),near=d=>ev(x,s,{type:'near',near:{admin:d},at:at(6)});
 assert.equal(near(5.2).offered,false,'beyond 5 m');assert.equal(near(Infinity).offered,false,'not in this scene');assert.equal(ev(x,s,{type:'talk',npcs:['admin']}).offered,false,'talking does not start a "walked near" mission');
 assert.equal(s.universe.missions['draft-near-m1'],undefined);
 const r=near(4.8);assert.equal(r.offered,true);assert.equal(r.mission,'draft-near-m1');assert.equal(r.messages[0].channel,'notify');assert.equal(s.universe.trackedMission,'draft-near-m1');
 assert.equal(near(1).offered,false,'once');assert.equal(near(1).mission!=='draft-near-m1'||!near(1).offered,true);
 assert.equal(s.universe.missions['draft-near-m2'],undefined,'the next mission waits for the first to be done (prerequisites respected)');
 ev(x,s,{type:'talk',npcs:['admin']});assert.equal(s.universe.missions['draft-near-m1'].completed,true);
 assert.equal(near(2.5).offered,false,'its own distance is 2 m');assert.equal(near(1.9).mission,'draft-near-m2');

});

test('the server checks "when walked near" the same way (void_runner_live_content.py) and the browser watches it without allocating per tick',()=>{
 const py=fs.readFileSync(R('void_runner_live_content.py'),'utf8');assert.match(py,/WHEN = \[[^\]]*'near'\]/);assert.match(py,/'npc', 'distance'\]/);assert.match(py,/NEAR_MIN, NEAR_MAX = 1, 30/);
 const lc=fs.readFileSync(R('void-runner/live-content.js'),'utf8');assert.match(lc,/setInterval\(nearTick,250\)/);
 for(const k of ["mode!=='walking'",'VoidConversationUI?.isOpen','podWakePending===true','VoidCharacterCreator?.isOpen','VoidKeyMapUI?.open'])assert.ok(lc.includes(k),'near waits: '+k);
 const ed=fs.readFileSync(R('void-runner/mission-editor.js'),'utf8');assert.match(ed,/data-me-start-distance/);assert.match(ed,/data-me-start-near/);assert.doesNotMatch(ed,/VoidStreetPair\.force/);
});
