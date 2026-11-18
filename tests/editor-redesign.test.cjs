/* Developer Tools beginner redesign (18 Nov 2026, queue item 0): the "Make a mission" wizard's templates build missions the game's own checks accept
   (mission-content.js treeNeeds / check, mission-trees.js validateTree), its plain-words problems, the Basic / Advanced mode switch and the session undo stack. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),T=require(R('void-runner/mission-trees.js')),W=require(R('void-runner/editor-wizard.js'));
 B.register(M);const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);const items=new Set(Object.keys(G.buyable(require(R('void-runner/progression.js')).modules)));
 return {e,MC,G,T,W,givers,items,ctx:{givers,places:G.placeIds(),subjects:new Set(G.photoSubjects(givers).map(g=>g.id))}};}
const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{m.set(k,String(v));}};};

function filled(x,id,start='person'){const a=x.W.fresh(id),subject=x.G.photoSubjects(x.givers).find(g=>g.canTalk&&g.draft)||x.G.photoSubjects(x.givers)[0];
 a.giver='admin';a.start=start;if(start!=='person'&&start!=='person-accept')a.message={header:'ADMIN // MESSAGE',text:'Come and see me.'};
 for(const s of a.steps){if(s.kind==='go')s.place='avenue';else if(s.kind==='photo')s.npc=subject.id;else s.npc='iris';}
 x.W.relabel(a,{name:i=>(x.givers.find(g=>g.id===i)||{}).name||i,place:i=>(x.G.PLACE.get(i)||{}).name||i});a.title='Test: '+id;a.rewards=75;return a;}

test('every template is made only of step kinds the game runs today, and the wizard asks one question per page',()=>{const x=env();
 const supported=new Set(x.G.STEP_KINDS.filter(k=>k.supported).map(k=>k.id));
 assert.deepEqual(x.W.TEMPLATES.map(t=>t.id),['deliver','meet','go','photo','talk']);
 for(const t of x.W.TEMPLATES){assert.ok(t.steps.length>=1);for(const k of t.steps){assert.ok(supported.has(k),t.id+': '+k);assert.ok(x.MC.STEP_KINDS.includes(k),k);}}
 for(const s of x.W.STEPS)assert.ok(supported.has(s.id),s.id);
 assert.deepEqual(x.W.PAGES.map(p=>p.id),['kind','giver','start','steps','reward','name']);
});

test('each template, with every way to start, builds a draft mission that passes the play / publish checks and the content check',()=>{const x=env();
 for(const t of x.W.TEMPLATES)for(const start of x.W.STARTS.map(s=>s.id)){const a=filled(x,t.id,start);
  assert.deepEqual(x.W.allProblems(a,x.ctx),[],t.id+'/'+start+' has no problems');
  const draft={version:1,trees:[],missions:{},lines:{}},{tree,mission:m}=x.W.build(draft,a,{T:x.T,number:401});
  assert.equal(tree.id,'draft-my-missions');assert.equal(m.number,401);assert.equal(m.title,'Test: '+t.id);assert.equal(m.rewards,75);assert.equal(m.giver,'admin');
  assert.deepEqual(m.objectives.map(o=>o.kind),t.steps);for(const o of m.objectives)assert.ok(o.label.trim(),'every step has a Mission Log line');
  assert.deepEqual(x.MC.treeNeeds(m,x.givers,x.items),[],t.id+'/'+start+': nothing is missing (Guide me and PLAY THIS DRAFT agree)');
  const c=x.MC.treesContent(draft.trees,{givers:x.givers,items:x.items});assert.equal(c.trees.length,1);assert.deepEqual(c.skipped,[]);
  const chk=x.MC.check({format:x.MC.FORMAT,version:x.MC.VERSION,trees:c.trees},{givers:new Map(x.givers.map(g=>[g.id,g])),places:x.G.placeIds(),subjects:x.ctx.subjects,items:x.items});
  assert.deepEqual(chk.errors,[],t.id+'/'+start+' passes mission-content.js check');
  assert.deepEqual(x.T.validateTree(tree,{givers:x.givers,items:x.items,trees:draft.trees}).filter(i=>i.level==='error'),[],t.id+'/'+start+' validateTree');}
});

test('a second wizard mission joins the same tree (or a tree the owner picked); ids are never reused',()=>{const x=env();
 const draft={version:1,trees:[]};const a=x.W.build(draft,filled(x,'talk'),{T:x.T,number:401}),b=x.W.build(draft,filled(x,'go'),{T:x.T,number:402});
 assert.equal(draft.trees.length,1);assert.notEqual(a.mission.id,b.mission.id);
 const own=x.T.newTree(draft.trees,{name:'Side jobs'});draft.trees.push(own);const ans=filled(x,'photo');ans.tree=own.id;assert.equal(x.W.build(draft,ans,{T:x.T,number:403}).tree.id,own.id);
 const ship={id:'main-storyline',shipped:true,missions:[]};draft.trees.push(ship);const s=filled(x,'talk');s.tree='main-storyline';assert.equal(x.W.build(draft,s,{T:x.T}).tree.id,'draft-my-missions','never into a shipped tree by the wizard');
});

test('problems say what is missing and how to fix it, page by page',()=>{const x=env(),a=x.W.fresh('');
 const p=page=>x.W.problems(a,page,x.ctx);
 assert.match(p('kind')[0],/Pick one of the cards/);x.W.setTemplate(a,'meet');assert.deepEqual(p('kind'),[]);assert.deepEqual(a.steps.map(s=>s.kind),['go','talk']);
 assert.match(p('giver')[0],/Choose who gives the mission: pick a name/);a.giver='juno-vex';assert.match(p('giver')[0],/cannot give missions.*Pick someone else/);a.giver='admin';assert.deepEqual(p('giver'),[]);
 a.start='messages';assert.match(p('start')[0],/type it in the box/);a.message.text='Hi';assert.deepEqual(p('start'),[]);
 const st=p('steps');assert.ok(st.some(s=>/Step 1: choose the place, from the list/.test(s)));assert.ok(st.some(s=>/Step 2: choose who/.test(s)));
 a.steps[0].place='port';a.steps[1].npc='iris';x.W.relabel(a,{});assert.deepEqual(p('steps'),[]);assert.equal(a.steps[1].label,'Talk to iris');
 a.steps[1].label='Meet Iris at the counter';a.steps[1].auto=false;a.steps[1].npc='admin';x.W.relabel(a,{});assert.equal(a.steps[1].label,'Meet Iris at the counter','a typed line is kept');
 x.W.setTemplate(a,'talk');assert.equal(a.steps.length,2,'filled-in steps are not thrown away by changing the template');
 for(const r of [-1,1.5,'x',100001]){a.rewards=r;assert.match(p('reward')[0],/whole number from 0 to 100000/);}a.rewards=0;assert.deepEqual(p('reward'),[]);
 assert.match(p('name')[0],/Give the mission a name/);
 a.steps=[];assert.match(p('steps')[0],/ADD A STEP/);
 for(const msg of x.W.allProblems(x.W.fresh(''),x.ctx))assert.match(msg,/(pick|choose|type|press|write|click)/i,'every problem says how to fix it: '+msg);
});

test('Basic is the default; Advanced is remembered per browser; a blocked storage never breaks it',()=>{const {W}=env(),s=memory();
 assert.equal(W.mode.read(s),'basic');assert.equal(W.mode.write(s,'advanced'),true);assert.equal(W.mode.read(s),'advanced');W.mode.write(s,'nonsense');assert.equal(W.mode.read(s),'basic');
 const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};assert.equal(W.mode.read(blocked),'basic');assert.equal(W.mode.write(blocked,'advanced'),false);assert.equal(W.mode.read(null),'basic');
 const dt=fs.readFileSync(R('void-runner/dev-tools.js'),'utf8');assert.ok(dt.includes("'"+W.MODE_KEY+"'"),'dev-tools.js reads the same key');
 for(const f of ['void-runner/editor-wizard.js','void-runner/editor-home.js'])assert.ok(dt.includes("'"+f+"'"),f+' loads with the editor');
 assert.ok(dt.indexOf("'void-runner/editor-wizard.js'")<dt.indexOf("'void-runner/editor-home.js'")&&dt.indexOf("'void-runner/npc-editor.js'")<dt.indexOf("'void-runner/editor-home.js'"));
});

test('undo: every save can be undone and redone; typing bursts in one box merge into one step; clicks never merge; a new edit clears redo',()=>{const {W}=env();let t=0;const u=W.createUndo({now:()=>t,limit:3});const box={};
 assert.equal(u.canUndo,false);assert.equal(u.undo(),null);assert.equal(u.record('k','a','a'),false,'no change, nothing recorded');
 u.record('k','a','b',box);t=500;u.record('k','b','c',box);assert.equal(u.size,1,'typing in one box within a moment is one undo step');
 t=5000;u.record('k','c','d');assert.equal(u.size,2);
 {const c=W.createUndo({now:()=>0});c.record('k','1','2');c.record('k','2','3');c.record('k','3','4',{});c.record('k','4','5',{});assert.equal(c.size,4,'clicks, and two different boxes, are separate steps');}
 assert.deepEqual(u.undo(),{key:'k',value:'c'});assert.deepEqual(u.undo(),{key:'k',value:'a'});assert.equal(u.canUndo,false);
 assert.deepEqual(u.redo(),{key:'k',value:'c'});assert.equal(u.canRedo,true);t=5100;u.record('k','c','x',box);assert.equal(u.canRedo,false,'a new edit clears redo');assert.equal(u.size,2,'a redone step never merges');
 t=9000;u.record('j',null,'1');t=20000;u.record('k','x','y');assert.equal(u.size,3,'limit');t=30000;u.record('k','y','z');assert.equal(u.size,3,'oldest dropped');
 const v=W.createUndo({now:()=>0});v.record('a','1','2',box);v.record('b','1','2',box);assert.equal(v.size,2,'different drafts never merge');
});
