/* "Follow them" with the mission's giver (fix, 19 Nov 2026; the owner: "the giver is either not at the mission giving location to start with, or after saying their first
   line they shoot off in the direction of where they're supposed to lead you and disappear ... I can never find them after the first line"). The browser walkthrough is
   tests/follow-giver-browser.cjs; these are the rules behind it:
   - mission-content.js waitingAt / holdOf: once taken, her mission holds her (her "Giver waits at" spot, the spot of her last finished follow step, else where she stood),
     until it is done; before, she went back to her routine (walked off, or vanished when the spot was in another quarter);
   - live-content.js plans(): the hold (why:'mission'), the remembered spot, the follow plan's `from`;
   - ncz-street-pair.js / npc-made.js: never popped in or out while seen (main's hold); held during a conversation that has her lines; she appears at `from`, never at her routine's spot;
   - npc-escort.js walkRoute: along the pavements (a road crossed straight over only where it must be), and lead() at walking pace, waiting for the player. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js'));
 B.register(M);const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G};}
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;return s;};
// the owner's mission: starts when the player walks near her (automatic), she says one line (a talk step), then "Follow them" to a spot about 35 m away
const tree=(who,waitAt,to)=>({id:'draft-follow',name:'Follow',missions:[{id:'draft-follow-m1',number:51,title:'Follow her',type:'side',giver:who,
 start:{how:'notification',channel:'notify',from:who,header:'TEST',text:'TEST: over here.',when:{kind:'near',npc:who,distance:5}},
 objectives:[{id:'step-1',kind:'talk',npc:who,label:'Talk to her.',say:[{who,text:'TEST LINE: follow me.'}]},{id:'step-2',kind:'follow-them',npc:who,label:'Follow her.',to},{id:'step-3',kind:'talk',npc:who,label:'Talk to her there.'}],...(waitAt?{waitAt}:{})}]});
const load=(x,t)=>{const r=x.MC.check({format:x.MC.FORMAT,version:x.MC.VERSION,trees:[t]},ctx(x));assert.deepEqual(r.errors,[]);x.MC.apply({format:x.MC.FORMAT,version:x.MC.VERSION,trees:[t]},x.e,ctx(x));};
const AT={'grey-reverie':Date.UTC(2026,10,19,3,0),'ethereal-lace':Date.UTC(2026,10,19,15,0),'street-cat':Date.UTC(2026,10,19,3,0)};   // inside her shift (ncz-street-pair.js TEST hours)
const near=(x,s,who,d=3)=>x.MC.treeEvent(s,x.e,{type:'near',near:{[who]:d},at:AT[who]},x.M,x.C);
const talk=(x,s,who)=>x.MC.treeEvent(s,x.e,{type:'talk',npcs:[who]},x.M,x.C);

test('she stays at her "Giver waits at" spot from before the walked-near start until the follow step starts, then at its spot until the mission is done',()=>{const x=env(),{MC}=x;
 for(const [who,wait,to] of [['grey-reverie',{x:104,z:-6.4,yaw:3.14},{x:68.5,z:-6.4}],['grey-reverie',{x:69.5,z:-85.5,yaw:3.14},{x:69.5,z:-50.5}],['ethereal-lace',{x:52.5,z:-85.5,yaw:0},{x:52.5,z:-113.5}],['street-cat',{x:104,z:-6.4,yaw:3.14},{x:75.5,z:-6.4}]]){
  load(x,tree(who,wait,to));const s=player(x),hold={...wait,mission:'draft-follow-m1'};
  assert.deepEqual(MC.waitingAt(s,x.e)[who],hold,who+': waiting to be offered');
  assert.equal(near(x,s,who).offered,true,'walked near: started, no click');assert.deepEqual(MC.waitingAt(s,x.e)[who],{...hold,during:true},who+': still there once taken (was: gone)');
  const r=talk(x,s,who);assert.deepEqual(r.done,['step-1']);assert.ok(r.lines.some(l=>/follow me/.test(l.text)),'her line');
  assert.equal(MC.escortNow(s,x.e)[who].kind,'follow-them','the follow step runs (the escort plan takes over from the hold)');
  assert.deepEqual(MC.waitingAt(s,x.e)[who],{...hold,during:true},'the hold is still there underneath (if the step cannot start yet)');
  MC.treeEvent(s,x.e,{type:'escort',step:'draft-follow-m1/step-2'},x.M,x.C);assert.deepEqual(MC.escortNow(s,x.e),{});
  assert.deepEqual(MC.waitingAt(s,x.e)[who],{x:to.x,z:to.z,mission:'draft-follow-m1',during:true},who+': at the follow spot for the rest of the mission (never walking back)');
  talk(x,s,who);assert.equal(s.universe.missions['draft-follow-m1'].completed,true);assert.deepEqual(MC.waitingAt(s,x.e),{},'done: her own routine again');}});

test('with no "Giver waits at" she stays where she stood when it started (here:true; live-content.js remembers the spot)',()=>{const x=env(),{MC}=x;
 load(x,tree('grey-reverie',null,{x:68.5,z:-6.4}));const s=player(x);assert.deepEqual(MC.waitingAt(s,x.e),{});
 near(x,s,'grey-reverie');assert.deepEqual(MC.waitingAt(s,x.e)['grey-reverie'],{mission:'draft-follow-m1',during:true,here:true});
 const lc=fs.readFileSync(R('void-runner/live-content.js'),'utf8');
 assert.match(lc,/if\(w&&w\.here\)\{const h=holdAt\[id\];/);assert.match(lc,/if\(w&&w\.during\)p\.why='mission';const old=planCache\[id\];if\(old&&old\.key===p\.key\)old\.why=p\.why;/);assert.match(lc,/resume:saved&&saved\.key===e\.key\?saved:null,from\}/);
 assert.match(lc,/escOn\.clear\(\);for\(const k of Object\.keys\(holdAt\)\)delete holdAt\[k\];/,'a new draft session forgets the spots');});

test('the figures: kept out for her mission, held while the conversation has her lines, never popped in or out while seen (the hold from main), and appear where the step started',()=>{
 const sp=fs.readFileSync(R('void-runner/ncz-street-pair.js'),'utf8'),md=fs.readFileSync(R('void-runner/npc-made.js'),'utf8');
 assert.match(sp,/if\(P&&\(P\.mode==='escort'\|\|P\.why==='mission'\)\)return her\.p;/);
 assert.match(sp,/speech\.lines\.some\(l=>l&&l\.who===id\)/);assert.match(sp,/walkTarget===talkItems\[her\.p\.id\]\)\|\|speaks\(her\.p\.id\)/);
 // never popped in or out in front of the player: main's hold (holdCheck / p.going, 19 Nov 2026) is kept; a follow step is never held
 assert.match(sp,/function holdCheck\(/);assert.match(sp,/if\(k===body\.key\|\|\(R&&R\.mode==='escort'\)\|\|!seen\)return false;/,'a follow step starts at once; the end of one is held while seen');
 assert.match(sp,/P\.mode==='escort'\?ok\(P\.resume\)\|\|ok\(P\.from\):planSpot\(P\)/);assert.match(sp,/t=appearAt\(P\);if\(t\)\{her\.s\.x=t\.x/);assert.match(sp,/const P=planOf\(CAT_ID\),t=appearAt\(P\)/);
 assert.match(md,/ok\(P\.resume\)\|\|ok\(P\.from\)\|\|ok\(P\.to\)/);assert.match(md,/chatWho=t&&t\.action===ACTION\?t\.character:speaker\(\);/);
 assert.match(fs.readFileSync(R('void-runner-sw.js'),'utf8'),/const BUILD='20\d\d-\d\d-\d\d-[a-z0-9-]+'/);});

test('walkRoute: along the pavements, in her area, the road crossed only where it must be, never through a building',()=>{fresh();const E=require(R('void-runner/npc-escort.js')),A=require(R('void-runner/npc-areas.js'));
 const cases=[[{x:52.5,z:-113.5},{x:69.5,z:-64.5},'oldtown'],[{x:104,z:-6.4},{x:96.5,z:-18.3},'avenue'],[{x:30,z:-18.3},{x:90,z:-18.3},'avenue'],[{x:69.5,z:-85.5},{x:69.5,z:-50.5},'oldtown']];
 for(const [a,b,area] of cases){const r=E.route(a,b,area);assert.deepEqual(r[r.length-1],b,'ends at the spot');let p=a,road=0,len=0;
  for(const q of r){const d=Math.hypot(q.x-p.x,q.z-p.z),n=Math.ceil(d/.2);for(let k=0;k<=n;k++){const t={x:p.x+(q.x-p.x)*k/n,z:p.z+(q.z-p.z)*k/n},c=A.check(t,area);
    assert.ok((c.ok&&c.area===area)||c.kind==='road'||c.kind==='blocked'&&!/building|inside/.test(c.why),area+' '+JSON.stringify(t)+' '+c.kind+' '+c.why);if(!c.ok)road+=d/n;}len+=d;p=q;}
  assert.ok(len<Math.hypot(b.x-a.x,b.z-a.z)*1.6+16,'no long detour: '+len.toFixed(1));assert.ok(road<30,'road walked: '+road.toFixed(1));}
 // the old fallback (one straight line across the road and through the shopfronts) is gone
 const r=E.route({x:52.5,z:-113.5},{x:69.5,z:-64.5},'oldtown');assert.ok(r.length>1);});

test('lead(): walking pace, she waits when the player falls behind, never jumps, done at the spot',()=>{fresh();const E=require(R('void-runner/npc-escort.js'));
 for(const [a,to,area] of [[{x:104,z:-6.4},{x:68.5,z:-6.4},'avenue'],[{x:69.5,z:-85.5},{x:69.5,z:-50.5},'oldtown'],[{x:52.5,z:-113.5},{x:69.5,z:-80},'oldtown']]){
  const st={x:a.x,z:a.z,yaw:0,phase:null},me={x:a.x+1.5,z:a.z},dt=1/60;let t=0,max=0,waited=false,done=false;
  for(let i=0;i<60*240&&!done;i++){t+=dt;const x0=st.x,z0=st.z,stop=t>20&&t<26;   // the player stops for 6 s: she must wait
   const ev=E.lead(st,{me,to,set:{},dt,area});if(ev==='wait')waited=true;if(ev==='done')done=true;max=Math.max(max,Math.hypot(st.x-x0,st.z-z0));
   const d=Math.hypot(st.x-me.x,st.z-me.z);if(!stop&&d>3){const v=Math.min(d-3,3.9*dt);me.x+=(st.x-me.x)/d*v;me.z+=(st.z-me.z)/d*v;}if(st.phase==='there'){const e=Math.hypot(to.x-me.x,to.z-me.z);if(e>.1){const v=Math.min(e,3.9*dt);me.x+=(to.x-me.x)/e*v;me.z+=(to.z-me.z)/e*v;}}}
  assert.ok(done,'done at the spot '+JSON.stringify(to));assert.ok(waited,'she waited for the player');assert.ok(max<=E.SPEED.lead*dt+.025,'never more than a walking step per frame (2 cm snap onto a corner): '+max);
  assert.ok(Math.hypot(st.x-to.x,st.z-to.z)<.05);}});

test('the changed game files parse (a // comment in a one-line statement once hid the rest of live-content.js plans())',()=>{const vm=require('node:vm');
 for(const f of ['live-content.js','ncz-street-pair.js','npc-made.js','npc-escort.js','mission-content.js'])assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(R('void-runner/'+f),'utf8'),{filename:f}),f);
 assert.match(fs.readFileSync(R('void-runner/live-content.js'),'utf8'),/old\.why=p\.why;out\[id\]=old&&old\.key===p\.key\?old:p;\}\}\/\*[^\n]*\*\/planCache=out;return out;\}/);});
