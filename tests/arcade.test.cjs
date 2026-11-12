/* The arcade's data: a small room with about five cabinets, one playable, every cabinet on open floor against the wall, and the play prompt in reach. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),A=require('../void-runner/district-arcade.js');
const interior=N.layout('interior'),local=p=>N.toWorld(p[0],p[2]);
test('a small room: five cabinets, exactly one playable, and every playable game has a page',()=>{
 assert.equal(N.arcade.length,5);const playable=N.arcade.filter(c=>c.playable);assert.equal(playable.length,1);assert.equal(playable[0].game,'blackout-protocol');
 for(const c of playable){assert(A.GAMES[c.game],c.game+' is registered as playable');assert(fs.existsSync(A.GAMES[c.game].page),'its page exists: '+A.GAMES[c.game].page);}
 assert.equal(new Set(N.arcade.map(c=>c.game)).size,5,'five different games');assert.equal(new Set(N.arcade.map(c=>c.id)).size,5);
});
test('the room is small and opens onto the hallway; the cabinets stand inside it against the back wall',()=>{
 const w=id=>interior.solids.find(s=>s.id===id),n=local(w('arc-north').position)[1],s=local(w('arc-south').position)[1],west=local(w('arc-west').position)[0];
 assert(Math.abs(n-s)<=10&&Math.abs(-3-west)<=8,'no bigger than about 8 by 10 metres');
 for(const c of N.arcade){assert(c.x>west&&c.x<-3&&c.z>Math.min(n,s)&&c.z<Math.max(n,s),c.id+' is inside the room');assert(c.x-west<1,c.id+' is against the back wall');}
 const [dx,dz]=N.toWorld(-2,62);assert(!E.blocked(dx,dz,interior),'the doorway is open');const [ix,iz]=N.toWorld(-6,62);assert(!E.blocked(ix,iz,interior),'the floor inside is open');
});
test('the prompts: one to play, standing on open floor in front of that cabinet; the others say coming soon',()=>{
 const play=interior.interactions.find(i=>i.id==='district-arcade-blackout'),cab=N.arcade.find(c=>c.playable),[lx,lz]=local(play.position);
 assert.equal(play.action,'district-arcade');assert.equal(play.game,'blackout-protocol');assert(!E.blocked(play.position[0],play.position[2],interior));assert(Math.hypot(lx-cab.x,lz-cab.z)<1.6,'the prompt is at the playable cabinet');
 const soon=interior.interactions.filter(i=>i.action==='district-arcade-soon');assert.equal(soon.length,2);for(const i of soon){assert.match(i.label,/COMING SOON/);assert(!E.blocked(i.position[0],i.position[2],interior));}
});
test('the cabinet runs the real game page in a frame and never reaches into it; the script ships in both copies of the page',()=>{
 const src=fs.readFileSync('void-runner/district-arcade.js','utf8');assert.match(src,/createElement\('iframe'\)/);assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g,''),/contentDocument|postMessage|localStorage/);
 for(const f of ['void-runner.html','static/void-runner.html'])assert.match(fs.readFileSync(f,'utf8'),/<script type="text\/tdd-game" src="void-runner\/district-arcade\.js">/);
 assert.match(fs.readFileSync('void-runner/remote-players.js','utf8'),/'arcade'/,'a player at a cabinet stays connected to the District');
});
