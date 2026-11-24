const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../void-runner/ncz-street-pair.js');
test('the cat goes home or greets a nearby player after its cooldown',()=>{
 const cat={x:100,z:-6},player={x:101,z:-6};
 assert.equal(S.catTarget({cat}).kind,'home');
 assert.equal(S.catTarget({cat,player,chance:0}).kind,'player');
 assert.equal(S.catTarget({cat,player,chance:.99}).kind,'home');
 assert.equal(S.catTarget({cat,player,clock:10,until:30}).kind,'home');
});
test('the Avenue loads the cat and releases the scene without either retired actor',()=>{
 const vm=require('node:vm'),B=require('../void-runner/vendor/babylon-8.26.0.js');
 const engine=new B.NullEngine(),scene=new B.Scene(engine),parent=new B.TransformNode('area',scene),requested=[];
 const context={BABYLON:B,performance,setInterval:()=>0,mode:'walking',VoidAssets:{container:()=>true,instance(key){requested.push(key);return new B.TransformNode(key,scene);}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../void-runner/ncz-street-pair.js'),'utf8'),context);
 const runtime=context.VoidStreetPair.start({scene,parent,quality:'low'});
 try{for(let i=0;i<300;i++)runtime.tick(.016);assert.ok(runtime.stats().cat);assert.deepEqual(requested,['crowd:npc-street-cat']);}
 finally{runtime.dispose();scene.dispose();engine.dispose();}
});
test('wired into the page and the street (after the alley, before neochinatown.js)',()=>{
 for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(path.join(__dirname,'..',f),'utf8');assert.match(h,/src="void-runner\/ncz-street-pair\.js"/);assert.ok(h.indexOf('ncz-street-pair.js')<h.indexOf('void-runner/neochinatown.js'));}
 const n=fs.readFileSync(path.join(__dirname,'../void-runner/neochinatown.js'),'utf8');assert.match(n,/VoidStreetPair\.start/);assert.match(n,/streetPair\?\.tick\(dt\)/);assert.match(n,/streetPair\?\.dispose\(\)/);
});
