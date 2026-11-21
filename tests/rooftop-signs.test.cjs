/* The rooftop letter signs (the owner, 20 Nov 2026; void-runner/ncz-rooftop-signs.js) and the blade signs' words (neochinatown.js). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../void-runner/ncz-rooftop-signs.js'),Q=require('../void-runner/ncz-quarters.js');
test('exactly the owner’s three, one in each street quarter, spelled as he gave them',()=>{
  assert.deepEqual(R.SIGNS.map(s=>[s.quarter,s.words.join(' / ')]),[['avenue','ГОРОД БЕЗ СНА'],['oldtown','НОЧНАЯ ЖИЗНЬ'],['far-south','НИРВАНА']]);
  for(const ch of R.letters())assert.match(ch,/^[А-ЯЁ]$/,'Cyrillic capitals only');
  for(const s of R.SIGNS){const L=R.layout(s),n=[...s.words.join(' ')].length;assert.equal(L.letters.length,s.words.join('').replace(/ /g,'').length);
   for(const i of [...s.dead,...s.flicker]){assert.ok(i<n&&s.words.join(' ')[i]!==' ','a dead or flickering letter is a letter: '+s.id);}
   assert.ok(s.dead.length>=1&&s.dead.length<=2,'one or two letters out');
   const [fx,fz]=R.FACE[s.face],mid=s.face==='s'||s.face==='n'?[s.mid,s.line+fz*4]:[s.line+fx*4,s.mid];assert.equal(Q.quarterAt(...mid),s.quarter,s.id+' stands in its quarter');}
  assert.equal(R.under(55,67,-5,7),'avenue-city');assert.equal(R.under(71,83,-50,-40),'oldtown-nightlife');assert.equal(R.under(40,51,-185,-175),'far-south-nirvana');assert.equal(R.under(100,110,-5,7),null);
  const w=Object.fromEntries(R.SIGNS.map(s=>[s.id,R.layout(s).width]));assert.ok(w['avenue-city']>=Math.max(...Object.values(w)),'the longest gets the widest roof');
});
test('blade signs: English, Simplified Chinese and Russian, real words from the agreed list; massage and cat cafe once or twice',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../void-runner/neochinatown.js'),'utf8'),m=src.match(/const bladeSets=(\{[\s\S]*?\});\n/);assert.ok(m);const sets=Function('return '+m[1])();
  const zh=new Set(['面馆','茶馆','旅馆','按摩','足疗按摩','药房','电子','电器','夜市','维修','麻将','洗衣','当铺','网吧','诊所','拉面','猫咖','猫咪咖啡']),ru=new Set(['РЕМОНТ','АПТЕКА','ГОСТИНИЦА','ТЕХНИКА','СВЯЗЬ','ЛАПША','ЧАЙ','ПРАЧЕЧНАЯ','КЛИНИКА']);
  const share={};for(const [q,list] of Object.entries(sets)){let c=0;for(const [w] of list){if(/[一-鿿]/.test(w)){assert.ok(zh.has(w),w);c++;}else if(/[Ѐ-ӿ]/.test(w))assert.ok(ru.has(w),w);else assert.match(w,/^[A-Z]+$/);}share[q]=c/list.length;}
  assert.ok(share.oldtown>share.avenue&&share.oldtown>share['far-south'],'Old Town the most Chinese');
  assert.ok(Object.values(sets).every(l=>l.some(([w])=>/[Ѐ-ӿ]/.test(w))),'Russian in every quarter');
  const all=Object.values(sets).flat();assert.ok(all.filter(([w])=>/按摩/.test(w)).every(e=>e[2]===1));assert.ok(all.filter(([w])=>/^猫/.test(w)).every(e=>e[2]===1));
  assert.match(src,/'猫咖'/,'the cat cafe by the street cat on the Avenue');
});
