'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../admin/studio-model.js'),B=require('../void-runner/beginner.js'),N=require('../void-runner/neochinatown.js');
const interactions=new Set([...N.layout('interior').interactions,...N.layout('street').interactions].map(i=>i.id));
const reg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tools','audio','npc-voice-registry.json'),'utf8'));
const ctx={interactions,npcs:new Set(Object.values(reg.npcs).map(n=>n.displayName))};
const fresh=()=>S.clone(B.MISSIONS);
test('the shipped beginner campaign validates clean, can be simulated end to end, and every event the Studio offers is one the game fires',()=>{
 assert.deepEqual(S.validate(fresh(),ctx),[]);const sim=S.simulate(fresh());assert.deepEqual(sim.stuck,[]);assert.equal(sim.completed.length,6);assert.deepEqual(S.reachable(fresh()),[]);
 const src=fs.readFileSync(path.join(__dirname,'..','void-runner','beginner-integration.js'),'utf8');
 for(const ev of Object.keys(S.EVENTS))assert.ok(src.includes("'"+ev+"'"),'beginner-integration.js fires '+ev);
});
test('validation finds missing links, unknown speakers, bad references, loops and unreachable objectives',()=>{
 const bad=fresh();bad[1].prerequisites=['nope'];bad[2].objectives[0].on='nothing-fires-this';bad[3].objectives[1].requires=['ghost'];bad[4].objectives[0].interaction='not-a-place';bad[0].objectives[2].say[0].who='Somebody';bad[5].title='';
 const t=S.validate(bad,ctx).map(i=>i.where+' '+i.text).join('\n');for(const needle of ['Prerequisite "nope"','Unknown completion event','Requires "ghost"','does not exist in the District','Speaker "Somebody"','Title is required'])assert.match(t,new RegExp(needle.replace(/[()]/g,'\\$&')));
 const loop=fresh();loop[0].prerequisites=['first-departure'];assert.ok(S.validate(loop,ctx).some(i=>/loop/.test(i.text)));assert.ok(S.simulate(loop).stuck.length>0);
 const cyc=fresh();cyc[0].objectives[0].requires=['speak'];cyc[0].objectives[2].requires=['v1'];assert.ok(S.validate(cyc,ctx).some(i=>/can never be completed/.test(i.text)));
 const dup=fresh();dup.push(S.clone(dup[0]));assert.ok(S.validate(dup,ctx).some(i=>/Duplicate mission id/.test(i.text)));
 const badId=fresh();badId[0].id='Bad Id';assert.ok(S.validate(badId,ctx).some(i=>/lowercase/.test(i.text)));
 const reward=fresh();reward[1].rewards=-5;assert.ok(S.validate(reward,ctx).some(i=>/Reward/.test(i.text)));
});
test('flow layout puts each mission after its prerequisites; the dialogue graph shows the too-soon branch',()=>{
 const f=S.flow(fresh());assert.equal(f.levels,6);assert.equal(f.edges.length,5);assert.deepEqual(f.nodes.map(n=>n.level),[0,1,2,3,4,5]);
 const g=S.dialogueGraph(fresh().find(m=>m.id==='district-errand'));assert.ok(g.nodes.some(n=>n.id==='report:early'));assert.ok(g.edges.some(e=>e.label==='too soon'));assert.ok(g.edges.some(e=>e.label==='requires'&&e.to==='report'));
});
test('drafts: a diff lists exactly what changed, export is plainly marked as an unpublished draft, and the shipped data is never mutated',()=>{
 const base=fresh(),d=S.clone(base);d[1].rewards=150;d[2].title='A BETTER JOB';d.push({id:'extra',title:'EXTRA',type:'side',giver:'Admin',description:'',destination:'earth',rewards:0,prerequisites:[],objectives:[{id:'a',label:'x',on:'talk-admin',requires:[]}]});
 const c=S.diff(base,d);assert.equal(c.length,3);assert.ok(c.some(x=>x.field==='rewards'&&x.from===100&&x.to===150));assert.ok(c.some(x=>x.kind==='added'));
 const ex=S.exportDraft(d,'raise the errand reward',base);assert.equal(ex.status,'DRAFT · not published');assert.equal(ex.format,'darknet-district-studio-draft');assert.equal(ex.changes.length,3);assert.equal(B.MISSIONS[1].rewards,100,'shipped data untouched');
 assert.deepEqual(S.diff(base,base),[]);
});
test('the Studio page: no credentials in the browser, publishing disabled, honest tab status, same sign-in and server check as the atlas',()=>{
 const dir=path.join(__dirname,'..','admin'),html=fs.readFileSync(path.join(dir,'studio.html'),'utf8'),js=fs.readFileSync(path.join(dir,'studio.js'),'utf8');
 assert.match(js,/developer\/content/);assert.match(js,/firebase-auth\.js/);assert.doesNotMatch(js+html,/ghp_|github_pat_|api\.github\.com|Bearer [A-Za-z0-9]{20,}/);assert.match(js,/pub\.disabled=true/);
 for(const tab of ['Dashboard','Missions','NPCs','Dialogue','Characters','Animations','Locations & Maps','Asset Library','Stores & Items','Factions & Progression','Social & V1','Settings & Publishing'])assert.ok(js.includes("'"+tab+"'"),tab);
 assert.match(html,/noindex/);assert.match(html,/Content-Security-Policy/);assert.doesNotMatch(html,/unsafe-eval/);
});
