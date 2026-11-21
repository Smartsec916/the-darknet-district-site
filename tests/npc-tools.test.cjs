/* Developer Tools > NPCs and the Mission Editor's "Giver waits at" (18 Nov 2026): placement rules (npc-paths.js), the street pair following a plan (ncz-street-pair.js),
   the content shape and its checks (mission-content.js), "waiting to be offered" (waitingAt), the "next required input" list (treeNeeds = treeBlockers), the import caps,
   and the server's copy of the rules (admin inventory). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js'));
 B.register(M);const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G,MS};}
const X=()=>require(R('void-runner/npc-paths.js')),SP=()=>require(R('void-runner/ncz-street-pair.js')),CR=()=>require(R('void-runner/crowd.js'));
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const doc=(x,extra={})=>({format:x.MC.FORMAT,version:x.MC.VERSION,...extra});
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;return s;};
const tree=(waitAt,extra={})=>({id:'draft-street',name:'Street',missions:[{id:'draft-street-m1',number:41,title:'A favour',type:'side',giver:'grey-reverie',start:{how:'person',accept:true},offer:[{who:'grey-reverie',text:'Got a minute?'}],
 objectives:[{id:'go',kind:'go',place:'port',label:'Go to the Port.'}],...(waitAt?{waitAt}:{}),...extra}]});

test('only Reverie, Lace, the street cat and the tea room host can be moved; their actions come from their own clip list (crowd.js) and never a banned clip',()=>{fresh();const P=X(),S=SP(),C=CR();
 assert.deepEqual(Object.keys(P.MOVABLE).sort(),['ethereal-lace','grey-reverie','street-cat','tea-host']);
 assert.deepEqual(P.actionsFor('street-cat').map(a=>a.id),P.CAT_ACTIONS);assert.deepEqual(P.libraryOffer('street-cat'),[]);   // the cat: its own procedural actions, no clips
 for(const id of Object.keys(P.MOVABLE).filter(k=>!P.MOVABLE[k].cat)){const have=new Set(C.clips[P.MOVABLE[id].asset]);assert.ok(have.size>10,id);
  for(const a of P.actionsFor(id)){assert.ok(have.has(a.clip),id+' '+a.id+' plays '+a.clip+' which is in the file');assert.doesNotMatch(a.id+' '+a.clip,S.BANNED,'not banned: '+a.id);for(const c of a.needs||[])assert.ok(have.has(c));}
  for(const want of P.MOVABLE[id].builtin?['wait','idle','look','watch','work','walk-on']:['wait','idle','look','scroll','selfie','sit','dance-groove','walk-on'])assert.ok(P.actionsFor(id).some(a=>a.id===want),id+' '+want);}
 assert.deepEqual(P.actionsFor('admin'),[]);
 // banned words are never offered as actions or library animations, even if somebody adds them to the list
 for(const o of P.libraryOffer('grey-reverie'))if((S.BANNED.test(o.id)||S.BANNED.test(o.title))&&!P.pairGameplay('grey-reverie',o.id))assert.equal(o.ok,false,o.id);
 assert.ok(P.libraryOffer('grey-reverie').every(o=>!o.ok||(!o.id.includes('sensual')&&!/kiss|hip/i.test(o.title))));
 assert.match(P.planProblems('grey-reverie',{mode:'stay',x:100,z:-6.5,yaw:0,actions:['dance-belly']}).join(),/not something she can do/);
 assert.match(P.planProblems('grey-reverie',{mode:'path',points:[{x:100,z:-6.5,action:'slow-dance',seconds:4},{x:110,z:-6.5,action:'idle',seconds:4}]}).join(),/not something she can do/);
 assert.match(P.planProblems('grey-reverie',{mode:'original',anims:['ac-sensual-dance-3']}).join(),/cannot be added/);});

test('spots: anywhere walkable (npc-areas.js), never the road, a gate, a taxi post or furniture; legs never cross them; sit only at a ledge',()=>{fresh();const P=X(),A=require(R('void-runner/npc-areas.js'));
 assert.deepEqual(P.spotProblems('grey-reverie',{x:100,z:-6.5}),[]);
 assert.match(P.spotProblems('grey-reverie',{x:100,z:-12}).join(),/road/,'the road');
 assert.deepEqual(P.spotProblems('grey-reverie',{x:100,z:-18.3}),[],'the south pavement (19 Nov 2026: anywhere walkable)');
 assert.match(P.spotProblems('grey-reverie',{x:5,z:-6.5}).join(),/Function Gate/,'the Function Gate');assert.match(P.spotProblems('grey-reverie',{x:148,z:-6.5}).join(),/East Gate/,'the East Gate');
 assert.match(P.spotProblems('grey-reverie',{x:40,z:-7.4}).join(),/taxi post|in /);
 const ob=A.get('avenue').obstacles.find(o=>o[1]-o[0]>.4&&A.areaOf({x:(o[0]+o[1])/2,z:(o[2]+o[3])/2})==='avenue');assert.ok(ob,'street furniture read from the built city');const mid={x:(ob[0]+ob[1])/2,z:(ob[2]+ob[3])/2};
 assert.match(P.spotProblems('grey-reverie',mid).join(),/ in /);assert.match(P.legProblems('grey-reverie',{x:mid.x-4,z:mid.z},{x:mid.x+4,z:mid.z}).join(),/goes through/);assert.match(P.spotProblems('grey-reverie',{x:NaN,z:-6}).join(),/no position/);
 assert.ok(P.ledgeAt({x:104.4,z:-5.9}));assert.equal(P.ledgeAt({x:98,z:-5.9}),null);
 assert.deepEqual(P.planProblems('grey-reverie',{mode:'stay',x:104.4,z:-5.9,yaw:Math.PI,actions:['idle','sit']}),[]);
 assert.match(P.planProblems('grey-reverie',{mode:'stay',x:98,z:-6,yaw:0,actions:['sit']}).join(),/needs a ledge/);
 assert.match(P.planProblems('grey-reverie',{mode:'path',points:[{x:100,z:-6,action:'look',seconds:200},{x:110,z:-6,action:'idle',seconds:4}]}).join(),/1 to 120/);
 assert.match(P.planProblems('grey-reverie',{mode:'path',points:[{x:100,z:-6,action:'look',seconds:5}]}).join(),/2 to 12 points/);
 assert.match(P.planProblems('grey-reverie',{mode:'path',points:[{x:100,z:-6,action:'walk-on',seconds:5},{x:110,z:-6,action:'walk-on',seconds:5}]}).join(),/at least one point/);
 assert.match(P.planProblems('admin',{mode:'stay',x:100,z:-6,yaw:0,actions:['idle']}).join(),/cannot be moved/);
 assert.match(P.checkAll({x:{},y:{},z:{}}).join(),/cannot be moved/);assert.deepEqual(P.checkAll(null),[]);
 // "Giver waits at": only a movable giver; unknown fields refused
 assert.deepEqual(P.waitAtProblems('grey-reverie',{x:104.4,z:-5.9,yaw:3.14}),[]);assert.match(P.waitAtProblems('admin',{x:1,z:1}).join(),/Reverie or Lace/);
 assert.match(P.waitAtProblems('ethereal-lace',{x:100,z:-6,speed:3}).join(),/unknown fields/);assert.match(P.waitAtProblems('ethereal-lace',{x:100,z:-14}).join(),/road/);});

test('what she does now: a waiting mission wins over a placement, which wins over her own routine',()=>{fresh();const P=X();
 const stay={mode:'stay',x:90,z:-6.2,yaw:0,actions:['look']};
 assert.equal(P.planNow('grey-reverie',{}),null);assert.equal(P.planNow('grey-reverie',{plan:{mode:'original',anims:[]}}),null);
 assert.equal(P.planNow('grey-reverie',{plan:stay}).why,'stay');
 const w=P.planNow('grey-reverie',{plan:stay,waiting:{x:104.4,z:-5.9,mission:'draft-street-m1'}});assert.equal(w.why,'waiting');assert.equal(w.x,104.4);assert.ok(w.actions.includes('sit'),'a spot in front of a ledge lets her sit');
 assert.ok(!P.planNow('grey-reverie',{waiting:{x:95,z:-6.6,mission:'m'}}).actions.includes('sit'));
 assert.notEqual(P.planNow('grey-reverie',{plan:stay}).key,P.planNow('grey-reverie',{plan:{...stay,x:91}}).key,'a changed plan has a new key');});

test('the street pair follows a stay and a route with real clips, sits at a ledge point, and walks back to her stretch afterwards (never jumps)',()=>{fresh();const P=X(),S=SP();
 const rnd=(()=>{let v=7;return ()=>(v=(v*16807)%2147483647)/2147483647;})();let s=S.routineStart(S.PAIR[0],rnd);
 const stay=P.planNow('grey-reverie',{waiting:{x:30,z:-6.5,mission:'m'}}),clips=new Set(CR().clips['npc-grey-reverie']);
 let lastX=s.x;for(let i=0;i<60*120;i++){S.routineStep(s,1/60,rnd,S.config,{plan:stay});assert.ok(Math.abs(s.x-lastX)<.2,'no jump');lastX=s.x;assert.ok(clips.has(s.clip),s.clip);}
 assert.ok(Math.hypot(s.x-30,s.z+6.5)<.05,'she stands at the spot');assert.ok(['plan-do','plan-go'].includes(s.mode));
 // back to her own routine: she walks back onto her stretch
 for(let i=0;i<60*100;i++){S.routineStep(s,1/60,rnd,S.config,{});assert.ok(Math.abs(s.x-lastX)<.2,'no jump back');lastX=s.x;}
 assert.ok(s.x>=S.STRETCH.x0-.7,'back on her stretch: '+s.x);
 const route=P.planNow('grey-reverie',{plan:{mode:'path',points:[{x:100,z:-6,action:'look',seconds:3},{x:104.4,z:-5.9,action:'sit',seconds:6},{x:110,z:-7,action:'scroll',seconds:4}]}});
 const seen=new Set();for(let i=0;i<60*150;i++){S.routineStep(s,1/60,rnd,S.config,{plan:route});seen.add(s.mode+':'+(s.pact||''));if(s.device)assert.ok(S.DEVICE.includes(s.device));assert.ok(clips.has(s.clip),s.clip);assert.ok(Number.isFinite(s.x+s.z+s.yaw));}
 for(const k of ['plan-do:look','sit:sit','plan-do:scroll','plan-go:look'])assert.ok(seen.has(k),k+' in '+[...seen].join(' '));});

test('a conversation still stops her while she follows a plan',()=>{fresh();const P=X(),S=SP();const s=S.routineStart(S.PAIR[1],()=>.5);const plan=P.planNow('ethereal-lace',{plan:{mode:'stay',x:100,z:-6.5,yaw:Math.PI,actions:['look']}});
 for(let i=0;i<60*30;i++)S.routineStep(s,1/60,Math.random,S.config,{plan});s.mode='stop';s.sub='chat';s.left=2;const x0=s.x;for(let i=0;i<30;i++)S.routineStep(s,1/60,Math.random,S.config,{plan});assert.equal(s.mode,'stop');assert.equal(s.x,x0);});

test('content: a mission’s waitAt and content.npcs are checked, kept by the export, refused when wrong',()=>{const x=env(),{MC}=x;
 assert.deepEqual(MC.check(doc(x,{trees:[tree({x:104.4,z:-5.9,yaw:3.14})]}),ctx(x)).errors,[]);
 assert.match(MC.check(doc(x,{trees:[tree({x:104.4,z:-14})]}),ctx(x)).errors.join(),/road/);
 const adminTree=tree({x:104.4,z:-5.9});adminTree.missions[0].giver='admin';adminTree.missions[0].offer=[{who:'admin',text:'Hi'}];assert.match(MC.check(doc(x,{trees:[adminTree]}),ctx(x)).errors.join(),/Reverie or Lace/);
 assert.deepEqual(MC.check(doc(x,{npcs:{'grey-reverie':{mode:'stay',x:100,z:-6.5,yaw:0,actions:['idle','look']}}}),ctx(x)).errors,[]);
 assert.match(MC.check(doc(x,{npcs:{admin:{mode:'stay',x:100,z:-6.5,yaw:0,actions:['idle']}}}),ctx(x)).errors.join(),/cannot be moved/);
 assert.match(MC.check(doc(x,{npcs:{'grey-reverie':{mode:'stay',x:100,z:-6.5,yaw:0,actions:['idle'],speed:2}}}),ctx(x)).errors.join(),/unknown fields/);
 // the export: treeStrip keeps waitAt (rounded), fromDrafts sends cleaned placements of movable NPCs only
 assert.deepEqual(MC.treeStrip({...tree({x:104.44,z:-5.91,yaw:3.14159}).missions[0]}).waitAt,{x:104.4,z:-5.9,yaw:3.14});
 const out=MC.fromDrafts({local:{trees:[tree({x:104.4,z:-5.9})],npcs:{'grey-reverie':{mode:'path',points:[{x:100.04,z:-6,action:'look',seconds:5.2},{x:110,z:-6,action:'idle',seconds:4}]},admin:{mode:'stay',x:1,z:1,yaw:0,actions:['idle']}}},givers:x.e.givers});
 assert.deepEqual(Object.keys(out.npcs),['grey-reverie']);assert.deepEqual(out.npcs['grey-reverie'].points[0],{x:100,z:-6,action:'look',seconds:5});assert.deepEqual(out.trees[0].missions[0].waitAt,{x:104.4,z:-5.9,yaw:0});
 assert.equal(MC.empty({format:MC.FORMAT,version:1,npcs:{'grey-reverie':{mode:'original',anims:[]}}}),false);
 // apply puts placements where the game reads them
 MC.apply(doc(x,{npcs:{'grey-reverie':{mode:'stay',x:100,z:-6.5,yaw:0,actions:['look']}}}),x.e,ctx(x));assert.equal(x.e.npcPlans['grey-reverie'].x,100);MC.apply(null,x.e);assert.deepEqual(x.e.npcPlans,{});});

test('“Giver waits at” holds her while that mission waits to be offered by her and while it runs (fix 19 Nov 2026: she no longer walks off once it is taken); once done she goes back',()=>{const x=env(),{MC}=x;
 MC.apply(doc(x,{trees:[tree({x:104.4,z:-5.9,yaw:3.14})]}),x.e,ctx(x));const s=player(x);
 assert.deepEqual(MC.waitingAt(s,x.e)['grey-reverie'],{x:104.4,z:-5.9,yaw:3.14,mission:'draft-street-m1'});
 assert.equal(MC.treeEvent(s,x.e,{type:'accept',mission:'draft-street-m1'},x.M,x.C).offered,true);assert.deepEqual(MC.waitingAt(s,x.e),{'grey-reverie':{x:104.4,z:-5.9,yaw:3.14,mission:'draft-street-m1',during:true}});
 s.universe.missions['draft-street-m1'].completed=true;assert.deepEqual(MC.waitingAt(s,x.e),{},'done: back to her own routine');
 // a later mission in the same tree waits until the earlier one is done
 const t2=tree(null);t2.missions.unshift({id:'draft-street-m0',number:40,title:'First',type:'side',giver:'admin',offer:[{who:'admin',text:'Hi'}],objectives:[{id:'go',kind:'go',place:'port',label:'Go.'}]});t2.missions[1].waitAt={x:100,z:-6.5,yaw:0};
 MC.apply(doc(x,{trees:[t2]}),x.e,ctx(x));assert.deepEqual(MC.waitingAt(player(x),x.e),{},'the earlier mission is not done');
 // a mission started by a notification from someone else does not hold her
 const t3=tree({x:100,z:-6.5,yaw:0},{start:{how:'notification',channel:'messages',from:'admin',header:'H',text:'T',when:{kind:'pod-exit'}}});delete t3.missions[0].offer;
 MC.apply(doc(x,{trees:[t3]}),x.e,ctx(x));assert.deepEqual(MC.waitingAt(player(x),x.e),{});});

test('the "next required input" list is the play / publish check (treeNeeds = treeBlockers), in on-screen order, each with its field',()=>{const x=env(),{MC}=x;
 const m={id:'draft-a-m1',title:'',giver:'',objectives:[{id:'s1',kind:'talk',label:''},{id:'s2',kind:'enter',label:'x'}]};
 const n=MC.treeNeeds(m,x.e.givers,new Set());assert.deepEqual(n.map(q=>q.text),MC.treeBlockers(m,x.e.givers,new Set()));
 assert.deepEqual(n.map(q=>q.field),['title','giver','step-npc','label','step-place']);assert.equal(n[2].step,'s1');
 const ok={id:'draft-a-m1',title:'A',giver:'admin',objectives:[{id:'s1',kind:'talk',npc:'iris',label:'Talk to Iris'}]};assert.deepEqual(MC.treeNeeds(ok,x.e.givers,new Set()),[]);
 const note={...ok,start:{how:'notification',channel:'messages',from:'',header:'',text:'',when:{kind:'flag'}}};assert.deepEqual(MC.treeNeeds(note,x.e.givers,new Set()).map(q=>q.field),['start-from','start-header','start-text','start-flag']);
 assert.equal(MC.treeNeeds({...ok,giver:'grey-reverie',waitAt:{x:1,z:1}},x.e.givers,new Set()).pop().field,'wait-at');});

test('import caps: over 50,000 triangles or 15 MB is refused; 20,000-50,000 is amber; big textures warned; rig recognised',()=>{fresh();const P=X();
 assert.equal(P.IMPORT.maxTriangles,50000);assert.equal(P.IMPORT.target,20000);assert.equal(P.IMPORT.maxBytes,15*1024*1024);assert.equal(P.IMPORT.texWarn,2048);
 const bones=require(R('void-runner/anim-library.js')).CORE.concat(['LeftToeBase','RightToeBase','LeftShoulder','RightShoulder','Spine0','Head_end']).map(b=>'mixamorig:'+b);
 const v=info=>P.importCheck({triangles:10000,bytes:1e6,textures:[{w:1024,h:1024}],bones,clips:['idle'],height:1.7,...info});
 assert.equal(v({}).ok,true);assert.ok(v({}).items.every(i=>i.level==='ok'),JSON.stringify(v({}).items));
 const big=v({triangles:50001});assert.equal(big.ok,false);assert.match(big.items[0].text,/This model has 50,001 triangles; the limit is 50,000\. Reduce it in Blender, or send it to Claude\/Codex to reduce\./);
 assert.equal(v({triangles:50000}).ok,true);assert.equal(v({triangles:30000}).items[0].level,'warn');assert.match(v({triangles:30000}).items[0].text,/above the 20,000 target/);
 assert.equal(v({bytes:16*1048576}).ok,false);assert.ok(v({textures:[{w:4096,h:4096}]}).items.some(i=>i.level==='warn'&&/4096/.test(i.text)));
 assert.ok(v({bones:[]}).items.some(i=>/No skeleton/.test(i.text)));assert.ok(v({}).items.some(i=>/24-joint/.test(i.text)));
 assert.deepEqual(P.importPlanProblems({mode:'stay',x:100,z:-6.5,actions:['idle']},['idle']),[]);assert.match(P.importPlanProblems({mode:'stay',x:100,z:-6.5,actions:['dance']},['idle']).join(),/not a clip/);
 // animation requests: licensed No AI models are local retarget only
 assert.equal(P.request('vr-companion-bm','vr-companion-bm','a wave').route,'local-retarget-only');assert.equal(P.request('grey-reverie','npc-grey-reverie','a wave').route,'retarget-or-library');
 assert.equal(P.noAI('studio-warrior'),true);assert.equal(P.noAI('npc-dax'),true);assert.equal(P.noAI('npc-fish','milked-fish'),false);});

test('staging accepts self-contained glTF and rejects external resources',()=>{fresh();const P=X(),base={asset:{version:'2.0'},meshes:[{}]},bytes=o=>Buffer.from(JSON.stringify(o));
 assert.deepEqual(P.importDocument(bytes(base),'.gltf'),base);
 assert.throws(()=>P.importDocument(bytes({...base,images:[{uri:'https://example.org/image.png'}]}),'.gltf'),/external/);
 assert.throws(()=>P.importDocument(bytes({...base,buffers:[{uri:'model.bin'}]}),'.gltf'),/external/);
 assert.throws(()=>P.importDocument(Buffer.alloc(20),'.glb'),/valid glTF/);
 assert.doesNotThrow(()=>P.importDocument(bytes({...base,buffers:[{uri:'data:application/octet-stream;base64,AA=='}]}),'.gltf'));
});
test('staged model candidate scan matches complete rest pose and joint count, not licensed files',()=>{fresh();const P=X(),L=require(R('void-runner/anim-library.js')),bones=L.CORE.slice(),rest=Object.fromEntries(bones.map(b=>[b,[0,0,0,1]])),f={public:true,mixamo:true,joints:bones.length,rest,clips:[['idle','idle']]};
 const idx={files:{'npc-demo':f,'npc-other':{...f,joints:999},'npc-private':{...f,public:false}}};
 assert.deepEqual(P.importClips({bones,rest},idx).map(x=>x.id),['npc-demo/idle']);
 assert.deepEqual(P.importClips({bones,rest:{}},idx),[]);
});

test('the server’s copy of the rules (admin inventory npcPaths) matches npc-paths.js',()=>{fresh();const P=X(),inv=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8')).npcPaths;
 assert.deepEqual(inv,JSON.parse(JSON.stringify(P.inventory())));assert.deepEqual(inv.import,{maxTriangles:50000,target:20000,maxBytes:15728640,texWarn:2048});
 for(const id of Object.keys(P.MOVABLE))for(const a of inv.movable[id].actions)assert.doesNotMatch(a,SP().BANNED);});

test('the editor files load in order and the NPCs tab is a Developer Tools section',()=>{const html=fs.readFileSync(R('void-runner.html'),'utf8'),i=html.indexOf('void-runner/ncz-street-pair.js'),j=html.indexOf('void-runner/npc-paths.js'),k=html.indexOf('void-runner/mission-content.js');
 assert.ok(i>0&&j>i&&k>j,'npc-paths.js after the street pair and before mission-content.js');const dt=fs.readFileSync(R('void-runner/dev-tools.js'),'utf8');assert.match(dt,/\['npcs','NPCs'\]/);
 for(const f of ['void-runner/editor-guide.js','void-runner/npc-map.js','void-runner/npc-preview.js','void-runner/npc-editor.js'])assert.ok(dt.includes("'"+f+"'"),f);
 assert.ok(dt.indexOf("'void-runner/mission-editor.js'")<dt.indexOf("'void-runner/npc-editor.js'"));
 // the NPCs tab never writes voices
 const ne=fs.readFileSync(R('void-runner/npc-editor.js'),'utf8');assert.doesNotMatch(ne,/npc-voice-registry\.json['"]\s*,\s*\{\s*method/);assert.doesNotMatch(ne,/voice\s*=\s*['"]/);});

test('every animation in the game is indexed from the real files; Reverie and Lace get compatible ordinary gameplay clips, with exact exceptions for verified shared motions',()=>{fresh();const P=X(),I=require(R('void-runner/npc-clip-index.json')),idx=require(R('tools/npc-clip-index.cjs'));
 assert.equal(JSON.stringify(idx.build())+'\n',fs.readFileSync(R('void-runner/npc-clip-index.json'),'utf8'),'npc-clip-index.json is current (node tools/npc-clip-index.cjs)');
 assert.equal(I.files['npc-grey-reverie'].joints,24);assert.ok(Object.keys(I.files).length>50);
 {const ok=P.libraryOffer('tea-host').filter(x=>x.ok);for(const x of ok)assert.equal(P.animAllowed('tea-host',x.id),'');}   // the tea room host's model (the old street cook) rests differently from most rigs: fewer shared clips
 for(const id of Object.keys(P.MOVABLE).filter(k=>!P.MOVABLE[k].cat&&!P.MOVABLE[k].builtin)){const o=P.libraryOffer(id),ok=o.filter(x=>x.ok);assert.ok(ok.length>20,id+' has shared clips');
  for(const x of ok){if(!P.pairGameplay(id,x.id)){assert.doesNotMatch(x.id+' '+x.title,SP().BANNED);assert.doesNotMatch(x.id,/smoke|drink|drunk|vr-|shoot/);assert.doesNotMatch(x.source,P.ADULT);}assert.equal(P.animAllowed(id,x.id),'');}
  assert.equal(P.animAllowed(id,'npc-kai/idle')==='',P.pairGameplay(id,'npc-kai/idle'));assert.notEqual(P.animAllowed(id,'npc-rin/smoke'),'');assert.notEqual(P.animAllowed(id,'npc-rin/walk'),'','her own walk is used');}
 // a different rig or rest pose is refused with the reason (offline retarget)
 const lace=P.libraryOffer('grey-reverie').find(x=>x.source==='npc-ethereal-lace'&&x.clip==='idle');assert.equal(lace.ok,false);assert.match(lace.why,/Request an animation/);
 const old=P.libraryOffer('grey-reverie').find(x=>x.source==='hacker-01');assert.match(old.why,/different skeleton/);
 assert.deepEqual(P.planProblems('grey-reverie',{mode:'stay',x:100,z:-6.5,yaw:0,actions:['npc-rin/laugh'],anims:['npc-rin/laugh']}),[]);
 assert.match(P.planProblems('grey-reverie',{mode:'stay',x:100,z:-6.5,yaw:0,actions:['npc-rin/laugh']}).join(),/not something/,'only once added');
 const inv=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8')).npcPaths.movable['grey-reverie'];assert.ok(inv.anims.includes('npc-rin/laugh'));assert.ok(!inv.anims.some(a=>/smoke|blow-kiss/.test(a)));});

 test('verified shared gameplay motions appear directly in mission gestures and photo is a native action',()=>{fresh();const P=X(),G=require(R('void-runner/npc-gestures.js')),S=SP();for(const id of ['grey-reverie','ethereal-lace']){assert.ok(P.actionsFor(id).some(a=>a.id==='photo'));assert.ok(P.PAIR_GAMEPLAY[id].every(c=>G.clipsFor(id).clips.some(x=>x.id===c)));assert.ok(P.animAllowed(id,'npc-kai/blow-kiss'));}assert.equal(P.animAllowed('grey-reverie','npc-security/vr-shoot'),'');assert.notEqual(P.animAllowed('ethereal-lace','npc-security/vr-shoot'),'');assert.equal(S.ACT.photo.device,'photo');});

 test('combat permission is independent of age classification; all verified shared motions are directly selectable',()=>{fresh();const P=X(),G=require(R('void-runner/npc-gestures.js'));for(const id of ['grey-reverie','ethereal-lace']){assert.equal(P.MOVABLE[id].combatAnimations,true);assert.equal(P.MOVABLE[id].youthful,true);const clips=P.libraryOffer(id).filter(o=>o.ok).map(o=>o.id);assert.deepEqual(P.missionClips(id),clips);const missions=new Set(G.clipsFor(id).clips.map(x=>x.id));assert.ok(clips.every(c=>missions.has(c)));assert.ok(P.animAllowed(id,'npc-kai/blow-kiss'));}assert.equal(P.animAllowed('grey-reverie','npc-security/vr-shoot'),'');assert.notEqual(P.animAllowed('ethereal-lace','npc-security/vr-shoot'),'');P.MOVABLE['grey-reverie'].combatAnimations=false;try{assert.notEqual(P.animAllowed('grey-reverie','npc-security/vr-shoot'),'');}finally{P.MOVABLE['grey-reverie'].combatAnimations=true;}});
