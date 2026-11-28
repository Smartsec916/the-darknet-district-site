/* Chrome fixture for actual scene entry, GLB import, placement clearance, and apartment persistence. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../void-runner/apartments.js'),E=require('../void-runner/npc-escort.js'),D=require('../void-runner/apartment-editor.js');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary'};
function wave(){
 const audio=Buffer.alloc(16044);
 audio.write('RIFF',0);audio.writeUInt32LE(audio.length-8,4);audio.write('WAVEfmt ',8);
 audio.writeUInt32LE(16,16);audio.writeUInt16LE(1,20);audio.writeUInt16LE(1,22);audio.writeUInt32LE(8000,24);
 audio.writeUInt32LE(16000,28);audio.writeUInt16LE(2,32);audio.writeUInt16LE(16,34);audio.write('data',36);audio.writeUInt32LE(16000,40);
 return audio;
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1400,height:880}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url()),file=path.resolve(root,'.'+url.pathname);
   if(url.pathname.includes('/api/'))return route.fulfill({json:{version:0,units:{}}});
   if(url.hostname!=='localhost'||!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
   return route.fulfill({path:file,contentType:mime[path.extname(file)]||'application/octet-stream'});
  });
  await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',v:2,chosen:true})));
  const panel=page.getByRole('dialog',{name:'Apartment Editor',exact:true});
  const entry=page.locator('.apt-editor-browser');
  async function open(doorId,slot,type='vacant'){
   await page.goto('http://localhost/void-runner.html');
   await page.waitForFunction(()=>VoidStartup?.started);
   await page.evaluate(()=>{
    VoidAccount.user={uid:'apartment-editor-fixture'};
    VoidDevTools.authorized=true;
    VoidDevTools.request=async key=>key==='developer/properties'?{units:{}}:{};
    VoidDevTools.tab='apartments';devPanel.hidden=false;VoidDevTools.render();
   });
   await page.waitForFunction(()=>!document.querySelector('.apt-editor-browser button')?.disabled);
   await entry.getByLabel('Apartment type').selectOption(type);
   if(type==='npc'){
    await entry.getByLabel('NPC home',{exact:true}).selectOption(D.roomId(doorId,slot));
    assert.equal(await entry.getByLabel('Street entrance').inputValue(),doorId);
   }else if(doorId){
    await entry.getByLabel('Neighborhood').selectOption(A.door(doorId).quarter);
    await entry.getByLabel('Street entrance').selectOption(doorId);
   }
   const door=await entry.getByLabel('Street entrance').inputValue();
   await entry.getByLabel('Apartment number').selectOption(String(slot));
   await page.getByRole('button',{name:'Go to street door'}).click();
   await page.waitForFunction(()=>VoidDevTest.active&&walkingLocation?.area==='street');
   await page.waitForFunction(id=>walkTarget?.action==='apt-door'&&walkTarget.door===id,door);
   await page.keyboard.press('KeyE');
   await page.waitForFunction(()=>walkingLocation?.part==='hall');
   const selected=await page.evaluate(()=>walkingLocation.open.find(r=>r.id.startsWith('apartment-design/')));
   assert.equal(selected.slot,slot);
   assert.equal(await page.evaluate(i=>walkingLocation.open.filter(r=>r.slot===i).length,slot),1);
   await page.evaluate(i=>{const it=walkingLocation.interactions.find(x=>x.id==='hall-door-'+i);
    walker.x=it.position[0];walker.z=it.position[2]-.45;walker.yaw=0;},slot);
   await page.waitForFunction(id=>walkTarget?.id===id,'hall-door-'+slot);
   await page.keyboard.press('KeyE');await panel.waitFor();
   return door;
  }
  const door=await open(null,1);
  console.log('Entered the selected apartment');
  await panel.getByText('Finishes and lighting',{exact:true}).click();
  await panel.getByRole('button',{name:'VR bedroom-inspired palette'}).click();
  assert.equal(await page.evaluate(()=>VoidBabylon.zone.finishColor('wall').toUpperCase()),'#A190A5');
  await panel.getByText('Import a Blender or Meshy asset',{exact:true}).click();
  await panel.getByLabel('GLB file').setInputFiles(path.join(root,'void-runner/assets/models/milked/milked-lucky-cat.glb'));
  await panel.getByRole('button',{name:'Add to Asset Finder'}).click();
  await panel.getByText('milked-lucky-cat added.').waitFor();
  await panel.getByRole('button',{name:'Place selected asset'}).click();
  await page.waitForFunction(()=>VoidBabylon.scene.transformNodes.some(n=>n.name.startsWith('apartment-placement-')&&n.getChildMeshes().length));
  const map=panel.locator('canvas');
  await map.click({position:{x:1,y:1}});
  await panel.getByRole('button',{name:'Save apartment'}).click();
  await panel.getByText('Move the red assets before saving.').waitFor();
  const def=A.layout('flat',A.door(door).style),guide=D.guideFor(A,E,def);
  let spot;
  for(let x=guide.limits.x[0]+.4;x<guide.limits.x[1]&&!spot;x+=.1){
   for(let z=guide.limits.z[0]+.4;z<guide.limits.z[1]&&!spot;z+=.1){
    if(!D.placementProblem({x,z,y:0,w:.48,h:.5,d:.48},guide.limits,guide.solids,guide.routes,[]))spot={x:Math.round(x*100)/100,z:Math.round(z*100)/100};
   }
  }
  assert.ok(spot,'found safe floor space');
  const transform=async(label,value)=>{
   await panel.getByLabel(label,{exact:true}).fill(String(value));
   await panel.getByLabel(label,{exact:true}).press('Tab');
  };
  await transform('Scale',.15);await transform('X, m',spot.x);await transform('Z, m',spot.z);
  await panel.getByText('Placement clear',{exact:true}).waitFor();
  await panel.getByText('Apartment music',{exact:true}).click();
  await panel.getByLabel('Riffusion audio export').setInputFiles({name:'room-track.wav',mimeType:'audio/wav',buffer:wave()});
  await page.waitForFunction(()=>VoidApartmentEditor.playing);
  await panel.getByRole('button',{name:'Save apartment'}).click();
  await panel.getByText('Apartment saved in this browser.').waitFor();
  if(process.env.SHOTS){
   fs.mkdirSync(process.env.SHOTS,{recursive:true});
   await panel.locator('canvas').scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(process.env.SHOTS,'apartment-editor.png')});
  }
  console.log('Verified GLB placement, red floor guide, music playback and save.');
  await open(door,1);
  await page.waitForFunction(()=>VoidBabylon.scene.transformNodes.some(n=>n.name.startsWith('apartment-placement-')&&n.getChildMeshes().length));
  assert.equal(await page.evaluate(()=>VoidBabylon.zone.finishColor('wall').toUpperCase()),'#A190A5');
  await panel.getByText('Apartment music',{exact:true}).click();
  await panel.getByText('room-track.wav',{exact:true}).waitFor();
  console.log('Saved palette, GLB and audio reopened after reload.');
  await open('apt-road-n-34',2,'npc');
  assert.deepEqual(await page.evaluate(()=>walkingLocation.residents),['pixel']);
  assert.equal(await page.evaluate(()=>walkingLocation.inst),'residence/apt-road-n-34/2');
  await panel.getByRole('button',{name:'Save apartment'}).click();
  await panel.getByText('Apartment saved in this browser.').waitFor();
  assert.deepEqual(errors,[]);console.log('Pixel’s assigned home opened as a single unit and saved privately.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
