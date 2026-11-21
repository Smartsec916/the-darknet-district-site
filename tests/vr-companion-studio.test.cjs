const test=require('node:test'),assert=require('node:assert/strict');
const studio=require('../void-runner/vr-companion-studio.js'),C=require('../void-runner/vr-companions.js');
test('all shipped pools are supported and the editor preserves the existing behavior fields',()=>{
 for(const e of C.companions.values())assert.deepEqual(studio.profile({about:e.about,dialogue:e.dialogue}).dialogue,e.dialogue);
});
test('ChatGPT profiles accept bounded behavior and reject unknown pools or settings',()=>{
 assert.deepEqual(studio.profile({personality:{initiative:.8},dialogue:{greet:[' Hello. ']}}),{about:'',personality:{initiative:.8},dialogue:{greet:['Hello.']}});
 for(const p of [{personality:{walkSpeed:100}},{personality:{__proto__:null,unknown:1}},{dialogue:{fake:['Hi']}},{dialogue:{greet:['<script>']}}])assert.throws(()=>studio.profile(p));
});
test('local drafts are not offered to ordinary players',()=>assert.equal(!!C.offered({localDraft:true},'localhost'),false));
test('mission giver drafts share the shipped model and copy only still-matching voice recordings without mutating the original draft',()=>{
 const e={name:'Luna',model:'npc-luna',about:'A dancer',dialogue:{greet:['Hello']}};const clips={one:{who:'luna',text:'Hello',hash:'a'.repeat(64)},old:{who:'luna',text:'Old words',hash:'b'.repeat(64)}};const old={characters:{other:{name:'Other'}},clips:{existing:{who:'other'}}};const d=studio.giverDraft(e,clips,old,'luna-world');assert.deepEqual(d.characters['luna-world'],{name:'Luna',model:'npc-luna',role:'A dancer',adult:true});assert.equal(d.clips['companion:luna-world:0'].who,'luna-world');assert.equal(d.clips['companion:luna-world:1'],undefined);assert.deepEqual(Object.keys(old.characters),['other']);assert.deepEqual(Object.keys(old.clips),['existing']);
});
test('the studio exposes each numbered section and its in-editor guide',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 class Element{constructor(tag,text=''){this.tag=tag;this.textContent=text;this.children=[];this.style={};this.value='';this.files=[];}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}setAttribute(k,v){this[k]=v;}get options(){return this.children;}}
 const panel=new Element('main'),context={document:{createElement:t=>new Element(t)},Option:function(title,value){const e=new Element('option',title);e.value=value;return e;},VoidVRCompanions:C,VoidDevTools:{authorized:true,request:()=>{},uid:'test'},VoidVoiceImports:{keyOf:(id,t)=>id+'|'+t},VoidMadeNPCs:{models:()=>[]}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../void-runner/vr-companion-studio.js'),'utf8'),context);const heading=()=>new Element('header');context.VoidVRCompanionStudio.render(panel,heading);
 const all=n=>[n,...n.children.flatMap(all)],button=t=>all(panel).find(n=>n.tag==='button'&&n.textContent===t);
 for(const t of ['1. Model','2. Personality','3. Voice lines','4. Animations','5. Mission giver','Guide'])assert.ok(button(t),t);
 await button('Guide').onclick();for(const t of ['1. Import a companion','2. Give them a personality','3. Import voice lines','4. Add a motion','5. Create a mission giver','6. What is local and what is live?','7. Edit on your phone, test on PC'])assert.ok(all(panel).some(n=>n.tag==='summary'&&n.textContent===t),t);
});
test('portable companion file preserves the metadata and binary attachments without base64 and rejects truncation',async()=>{
 const meta={id:'luna',name:'Luna',sex:'female',dialogue:{greet:['Hello.']}},parts=[{meta:{kind:'model'},blob:new Blob([new Uint8Array([1,2,3])])},{meta:{kind:'voice',record:{text:'Hello.'}},blob:new Blob(['voice'])}];const file=studio.packTransfer(meta,parts),out=await studio.unpackTransfer(file);assert.deepEqual(out.meta,meta);assert.deepEqual([...new Uint8Array(await out.parts[0].blob.arrayBuffer())],[1,2,3]);assert.equal(await out.parts[1].blob.text(),'voice');await assert.rejects(studio.unpackTransfer(file.slice(0,-1)));await assert.rejects(studio.unpackTransfer(new Blob(['not a transfer file'])));
});
test('mobile page is independent of the game and checks existing server authorization before loading editor scripts',()=>{
 const fs=require('node:fs'),html=fs.readFileSync('vr-companion-studio.html','utf8'),js=fs.readFileSync('void-runner/companion-mobile.js','utf8');assert.match(html,/id="companion-standalone" hidden/);assert.match(html,/viewport/);assert.match(html,/companion-mobile\.js/);assert.doesNotMatch(html,/device-gate\.js|void-runner\/game\.js/);assert.match(js,/\/api\/void-runner\/developer\/balance/);assert.match(js,/getIdToken\(true\)/);assert.match(js,/await check\(user,epoch\);await load\(\)/);assert.match(js,/D\.authorized=false/);assert.doesNotMatch(js,/localStorage.*token|developer\/balance.*POST/);
});
test('standalone editor scripts initialize without the game runtime or interaction polling',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),ctx={URL,TextEncoder,TextDecoder,Blob,document:{currentScript:{src:'https://thedarknetdistrict.com/void-runner/asset-pipeline.js'}},location:{hostname:'thedarknetdistrict.com'},VoidDevTools:{standalone:true},setInterval(){throw Error('Unexpected game runtime timer')},console};vm.createContext(ctx);for(const f of ['network','asset-pipeline','crowd','npc-paths','npc-voices','vr-companions','npc-made','anim-library','voice-imports','vr-companion-studio'])vm.runInContext(fs.readFileSync('void-runner/'+f+'.js','utf8'),ctx);assert.ok(ctx.VoidVRCompanions.get('luna'));assert.ok(ctx.VoidMadeNPCs.models().some(m=>m.asset==='npc-luna'));assert.ok(ctx.VoidVRCompanionStudio.render);
});
