/* Developer Tools > Guide (21 Nov 2026): the Mission Editor guide tab. Registered right after Achievements, every section present, and every button or box name the
   guide quotes ([[LABEL]]) still exists in the editor's code: a guard against the guide going stale when a label is renamed. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=f=>path.join(__dirname,'..',f),read=f=>fs.readFileSync(R(f),'utf8');
const G=require('../void-runner/mission-editor-guide.js');
const IDS=['start','draft','wizard','editor','steps','offer','conditions','feet','givers','npcs','poses','interiors','voices','guideme','play','server','publish','faq'];
/* Labels from branches that were not merged when the guide was written: checked only once the code has them (then they must match exactly). */
const PENDING={'Sit — pose: chair (ledge, bench, stool)':'floor-kneel','Sit — pose: kneel (seiza)':'floor-kneel','Sit — pose: cross-legged':'floor-kneel','Sit — pose: knees to chest':'floor-kneel','Pose at this seat: ':'floor-kneel'};
const code=()=>{const files=[...fs.readdirSync(R('void-runner')).filter(f=>f.endsWith('.js')&&f!=='mission-editor-guide.js').map(f=>'void-runner/'+f),...fs.readdirSync(R('admin')).filter(f=>f.endsWith('.js')).map(f=>'admin/'+f)];return files.map(read).join('\n');};

test('the Guide tab is registered right after Achievements, with its own icon, loaded only when opened',()=>{
 const dt=read('void-runner/dev-tools.js');assert.ok(dt.includes("['achievements','Achievements'],['guide','Guide']]"),'Guide comes right after Achievements');
 assert.match(dt,/achievements:'trophy',guide:'guide'\}/);assert.match(dt,/const DEV_ICON_PATHS=\{[^}]*guide:'/);
 assert.match(dt,/if\(this\.tab==='guide'\)\{[^\n]*VoidMissionEditorGuide\.render\(devPanel,head\)/);assert.ok(dt.includes("s.src='void-runner/mission-editor-guide.js'"));
 assert.ok(!dt.match(/editorScripts:\[[^\]]*mission-editor-guide/),'not part of the editor bundle');assert.ok(!read('void-runner.html').includes('mission-editor-guide.js'),'players never download it');
 assert.ok(read('void-runner/editor-home.js').includes("['guide','guide','Guide',"),'listed under More tools on the Start page');
 assert.match(read('void-runner/dev-tools.css'),/\.mg-guide\{/);
});
test('every section is there, in order, with a contents list and a search box',()=>{
 assert.deepEqual(G.SECTIONS.map(s=>s[0]),IDS);for(const [id,title,lines] of G.SECTIONS){assert.ok(title.length>3,id);assert.ok(lines.length>=3,id+' has content');}
 const h=G.html();for(const id of IDS){assert.ok(h.includes('data-mg-section="'+id+'"'),id);assert.ok(h.includes('data-mg-jump="'+id+'"'),'contents links to '+id);}
 assert.ok(h.includes('data-mg-filter'),'search box');assert.ok(!/\[\[|\]\]/.test(h),'no raw markup left');
});
test('search shows only the sections that mention every word',()=>{
 assert.equal(G.match('').length,IDS.length);assert.ok(G.match('whispers').includes('voices'));assert.ok(!G.match('whispers').includes('feet'));
 assert.ok(G.match('Tea Room Host').includes('givers'));assert.ok(G.match('play could not start').includes('play'));assert.deepEqual(G.match('zzqx'),[]);
});
test('the guide covers what the owner asked for',()=>{
 const all=G.SECTIONS.map(s=>G.plain(s[1]+' '+s[2].join(' '))).join(' ');
 for(const t of ['PLAY could not start','[whispers]','feet','Tea Room Host','LEAVE DRAFT · BACK TO EDITOR','step failed','Two copies of your drafts','Server waking up','SIGN IN','EXPORT MY EDITS','UNDO','…and only when','kneel','cross-legged','knees to chest','yellow arrow','Guide me','PLAY FROM THE START OF THIS TREE','ACCEPT','Messages','banner'])assert.ok(all.includes(t),t);
});
test('every quoted button or box name exists in the editor code (exactly)',()=>{
 const src=code(),missing=[];const ls=G.labels();assert.ok(ls.length>150,'labels quoted: '+ls.length);
 for(const l of ls){if(PENDING[l.check]&&!src.includes(PENDING[l.check]))continue;if(!src.includes(l.check))missing.push(l.section+': '+l.check);}
 assert.deepEqual(missing,[],'labels the code no longer has');
});
test('BUILD has the usual form',()=>{assert.match(read('void-runner-sw.js').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';$/);});
