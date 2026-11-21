/* Walking conversations (the owner, 17 Nov 2026): Admin's recorded lines for Missions 001 and 002 match their clips word for word (so every clip plays), the 002 call
   with the zoom line, an untouched editor draft taking the new shipped call, the larger "Talk to" area and the head turn's limits. The automatic line flow itself runs
   in the browser: tests/talk-flow-browser.cjs. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const extra=()=>JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/extra/manifest.json'),'utf8')).lines;
const ZOOM='You can also zoom with the camera by using the mouse wheel';
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,MS};}
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);

test('Mission 002 call: the zoom line comes right after "Left click will take a picture", exact text, no trailing period',()=>{
 const {MS}=env(),o=MS.EYES.objectives.find(o=>o.id==='enter-null'),t=o.say.map(l=>l.text);
 assert.deepEqual(t,['Your V1 has a camera. Press L to open your device, then select the Camera app.','Point it at the target. Your device should identify them automatically.','Left click will take a picture',ZOOM,'Once you\'ve taken the photograph, open Messages, select my conversation, attach the photograph, and send it to me.','Nothing complicated. Just keep your eyes open.']);
 assert.ok(o.say.every(l=>l.who==='admin'));});

test('the call the game builds (stepMessage) equals the re-recorded clip\'s manifest text byte for byte',()=>{
 const x=env(),s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;
 ev(x,s,{type:'pod-exit',at:Date.UTC(2026,10,17,12)});ev(x,s,{type:'talk',npcs:['admin']});ev(x,s,{type:'talk',npcs:['admin']});ev(x,s,{type:'accept',mission:'m002-eyes-on-the-street'});
 const r=ev(x,s,{type:'place',places:['null'],at:Date.UTC(2026,10,17,13)}),m=extra()['admin-m002-call'];
 assert.equal(r.messages.length,1);assert.equal(Buffer.compare(Buffer.from(r.messages[0].text),Buffer.from(m.text)),0,'byte for byte');
 assert.equal(m.file,'extra/admin-m002-call.ogg');assert.ok(fs.statSync(R('void-runner/assets/audio/voice/'+m.file)).size>1000);assert.match(m.note,/Re-recorded 17 Nov 2026 with the zoom line \(402 credits\)/);});

test('every Admin line of Missions 001 and 002 that has a clip matches its manifest text exactly (in person: one line; a call or message: the lines joined with \\n)',()=>{
 const {MS}=env(),texts=new Set(),joined=[];
 const whoOf=new Map();   // text -> speaker (Mission 003 adds Eva, Fish and the V1 translator: tests/mission-003.test.cjs)
 for(const m of [MS.AWAKENING,MS.EYES,MS.CORPORATE]){const lines=[...(m.offer||[]),...(m.ending?.say||[])];if(m.start?.text)joined.push(m.start.text);
  for(const o of m.objectives){lines.push(...(o.say||[]),...(o.wrong||[]));const own=(o.say||[]).filter(l=>l&&l.who!=='You');if(o.via&&own.length){joined.push(own.map(l=>l.text).join('\n'));}}
  lines.forEach((l,i)=>{if(l&&l.who!=='You'){texts.add(l.text);whoOf.set(l.text,l.who==='v1-translator'&&lines[i-1]?lines[i-1].who:l.who);}});}   // a V1 translation is in the speaker's own voice
 for(const j of joined){texts.add(j);whoOf.set(j,'admin');}
 const clips=Object.entries(extra()).filter(([,l])=>/^main-story\.js \(00[1-3]\b/.test(l.source||''));assert.ok(clips.length>=16);   // Missions 001-003 (004 onward: tests/awakening-voices.test.cjs)
 for(const [id,l] of clips){assert.ok(texts.has(l.text),id+' matches a line in main-story.js exactly: '+JSON.stringify(l.text));assert.equal(l.speaker,whoOf.get(l.text),id+' speaker');}
 // and every call or message has its clip
 const have=new Set(clips.map(([,l])=>l.text));for(const j of joined)assert.ok(have.has(j),'a clip for '+JSON.stringify(j.slice(0,60)));});

test('an editor draft that still holds the old five-line call takes the shipped six lines; a call the owner edited himself is kept',()=>{
 const {MS}=env(),copy=()=>JSON.parse(JSON.stringify(MS.TREE));
 const old=copy(),o=old.missions[1].objectives[0];o.say=o.say.filter(l=>l.text!==ZOOM);assert.equal(o.say.length,5);
 assert.equal(MS.refreshShipped(old),1);assert.deepEqual(old.missions[1].objectives[0].say,MS.EYES.objectives[0].say);
 const mine=copy(),p=mine.missions[1].objectives[0];p.say=p.say.filter(l=>l.text!==ZOOM);p.say[0]={who:'admin',text:'My own words.'};
 assert.equal(MS.refreshShipped(mine),0);assert.equal(mine.missions[1].objectives[0].say[0].text,'My own words.');
 assert.equal(MS.refreshShipped(copy()),0,'the current text is left alone');});

test('the "Talk to" area: 1.5x the reach and a wider look for people; the one nearest the view centre wins; never through a wall; objects unchanged',()=>{
 fresh();const E=require(R('void-runner/exploration-controller.js'));
 const loc=(solids=[])=>({bounds:[50,50],solids,interactions:[{id:'admin',label:'SPEAK WITH ADMIN',position:[0,1.7,0],range:3},{id:'iris',label:'SPEAK WITH IRIS',position:[4.5,1.7,0],range:3},{id:'vend',label:'VENDING MACHINES',position:[0,1.7,-6],range:2.6}]});
 const at=(x,z,tx,tz,l=loc())=>E.select({x,z,yaw:Math.atan2(tx-x,tz-z)},l)?.id||null;
 assert.equal(E.isTalk({label:'TALK TO THE BARTENDER'}),true);assert.equal(E.isTalk({label:'TALK / ROOK'}),true);assert.equal(E.isTalk({label:'TALK YOUR WAY OUT'}),false);assert.equal(E.isTalk({label:'BROWSE THE SHOP'}),false);
 assert.equal(at(0,4.2,0,0),'admin','4.2 m away (was out of reach at 3 m)');assert.equal(at(0,4.6,0,0),null,'not beyond 4.5 m');
 // a step to the side, looking a little past him (about 65 degrees off centre)
 assert.equal(E.select({x:0,z:2,yaw:Math.atan2(0,-2)+65*Math.PI/180},loc())?.id,'admin','a wider look');
 assert.equal(E.select({x:0,z:2,yaw:Math.atan2(0,-2)+80*Math.PI/180},loc())?.id,undefined,'but not from behind the shoulder');
 // between Admin and Iris: the one in the middle of the view, not the nearer
 assert.equal(at(1.6,2.5,4.5,0),'iris','looking at Iris from nearer Admin gives Iris');assert.equal(at(2.9,2.5,0,0),'admin');
 // a wall between: never
 assert.equal(at(0,3.5,0,0,loc([{position:[0,1,1.8],size:[4,2,.2]}])),null,'not through a wall');
 // objects keep their reach
 assert.equal(at(0,-6+2.9,0,-6),null,'an object\'s reach is unchanged (2.6 m)');assert.equal(at(0,-6+2.4,0,-6),'vend');});

test('the head turn: clamped to about 70 degrees of yaw and 30 of pitch; the body turns only past 60 degrees, by at most 25',()=>{
 fresh();const L=require(R('void-runner/npc-look.js')),D=Math.PI/180,head={x:0,y:1.7,z:0};
 let a=L.aim(0,head,{x:0,y:1.7,z:2});assert.ok(Math.abs(a.yaw)<1e-9&&Math.abs(a.pitch)<1e-9&&a.body===0,'straight ahead');
 a=L.aim(0,head,{x:2,y:1.7,z:2});assert.ok(Math.abs(a.yaw-45*D)<1e-9);assert.equal(a.body,0);
 a=L.aim(0,head,{x:2,y:1.7,z:-.1});assert.ok(a.body>0&&a.body<=25*D+1e-9,'the body turns a little');assert.ok(a.yaw<=70*D+1e-9);
 a=L.aim(0,head,{x:0,y:1.7,z:-2});assert.ok(Math.abs(a.yaw)<=70*D+1e-9&&Math.abs(a.body)<=25*D+1e-9,'behind: clamped');
 a=L.aim(0,head,{x:0,y:4,z:1});assert.ok(Math.abs(a.pitch-30*D)<1e-9,'up: 30 degrees at most');a=L.aim(0,head,{x:0,y:-2,z:1});assert.ok(Math.abs(a.pitch+30*D)<1e-9);
 assert.equal(L.ease(0,1,4,.1),.4);assert.equal(L.ease(0,1,4,1),1,'never overshoots');});
