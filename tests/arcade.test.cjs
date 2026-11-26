/* The arcade's data: a small room with about five cabinets, one playable, every cabinet on open floor against the wall, and the play prompt in reach. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),A=require('../void-runner/district-arcade.js');
const interior=N.layout('interior'),local=p=>N.toWorld(p[0],p[2]);
test('a small room: five playable cabinets, and every playable game has a page',()=>{
 assert.equal(N.arcade.length,5);const playable=N.arcade.filter(c=>c.playable);assert.deepEqual(playable.map(c=>c.game),['metashift','hotel-headshots','blackout-protocol','corporate-zombies','underground-overdrive']);
 for(const c of playable){assert(A.GAMES[c.game],c.game+' is registered as playable');assert(fs.existsSync(A.GAMES[c.game].page),'its page exists: '+A.GAMES[c.game].page);}
 assert.equal(new Set(N.arcade.map(c=>c.game)).size,5,'five different games');assert.equal(new Set(N.arcade.map(c=>c.id)).size,5);
});
test('the room is small and opens onto the hallway; the cabinets stand inside it against the back wall',()=>{
 const w=id=>interior.solids.find(s=>s.id===id),n=local(w('arc-north').position)[1],s=local(w('arc-south').position)[1],west=local(w('arc-west').position)[0];
 assert(Math.abs(n-s)<=10&&Math.abs(-3-west)<=8,'no bigger than about 8 by 10 metres');
 for(const c of N.arcade){assert(c.x>west&&c.x<-3&&c.z>Math.min(n,s)&&c.z<Math.max(n,s),c.id+' is inside the room');assert(c.x-west<1,c.id+' is against the back wall');}
 const [dx,dz]=N.toWorld(-2,62);assert(!E.blocked(dx,dz,interior),'the doorway is open');const [ix,iz]=N.toWorld(-6,62);assert(!E.blocked(ix,iz,interior),'the floor inside is open');
});
test('the prompts: each playable cabinet has its own, standing on open floor in front of it; the rest say coming soon',()=>{
 for(const c of N.arcade.filter(c=>c.playable)){const p=interior.interactions.find(i=>i.action==='district-arcade'&&i.game===c.game);assert(p,c.game);const [px,pz]=local(p.position);assert(Math.hypot(px-c.x,pz-c.z)<1.6,c.game);assert(!E.blocked(p.position[0],p.position[2],interior),c.game);assert(A.GAMES[c.game]&&fs.existsSync(A.GAMES[c.game].page),c.game+' page exists');}
 const play=interior.interactions.find(i=>i.id==='district-arcade-blackout'),cab=N.arcade.find(c=>c.game==='blackout-protocol'),[lx,lz]=local(play.position);
 assert.equal(play.action,'district-arcade');assert.equal(play.game,'blackout-protocol');assert(!E.blocked(play.position[0],play.position[2],interior));assert(Math.hypot(lx-cab.x,lz-cab.z)<1.6,'the prompt is at the playable cabinet');
 const soon=interior.interactions.filter(i=>i.action==='district-arcade-soon');assert.equal(soon.length,0);for(const i of soon){assert.match(i.label,/COMING SOON/);assert(!E.blocked(i.position[0],i.position[2],interior));}
});
test('the cabinet runs the real game page in a frame and never reaches into it; the script ships in both copies of the page',()=>{
 const src=fs.readFileSync('void-runner/district-arcade.js','utf8');assert.match(src,/createElement\('iframe'\)/);assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g,''),/contentDocument|postMessage|localStorage/);
 for(const f of ['void-runner.html','static/void-runner.html'])assert.match(fs.readFileSync(f,'utf8'),/<script type="text\/tdd-game" src="void-runner\/district-arcade\.js">/);
 assert.match(fs.readFileSync('void-runner/remote-players.js','utf8'),/'arcade'/,'a player at a cabinet stays connected to the District');
});
test('every game page offers a way back to the website, and inside the District arcade the way out is EXIT GAME',()=>{
 const ret=fs.readFileSync('site-return.js','utf8');assert.match(ret,/games-list\.html/);assert.match(ret,/window\.top!==window\.self/,'nothing is shown inside the arcade frame');
 for(const f of ['hotel-headshots/index.html','blackout-protocol/index.html','corporate-zombies/index.html','underground-overdrive/index.html','origins/index.html','raven.html','void-runner.html'])assert.match(fs.readFileSync(f,'utf8'),/site-return\.js/,f);
 assert.match(fs.readFileSync('void-runner/district-arcade.js','utf8'),/>EXIT GAME · RETURN TO THE DARKNET DISTRICT</);assert.match(fs.readFileSync('site-return.js','utf8'),/RETURN TO THE DARKNET DISTRICT/);assert.match(fs.readFileSync('games-list.html','utf8'),/href="void-runner\.html">\s*<h3>Void Runner<\/h3>/);
});

test('a working cabinet shows its own game: an attract strip and a poster picture exist for every playable game, and the light-gun game has guns',()=>{
 const {GAMES}=require('../void-runner/district-arcade.js'),src=fs.readFileSync('void-runner/neochinatown.js','utf8');
 const art=/const ART=new Set\(\[([^\]]+)\]\)/.exec(src)[1].split(',').map(s=>s.trim().replace(/'/g,''));assert.deepEqual(art.sort(),Object.keys(GAMES).sort(),'every playable game, and only those');
 for(const g of art)for(const kind of ['attract','poster']){const st=fs.statSync('void-runner/art/arcade/'+g+'-'+kind+'.jpg');assert.ok(st.size>8000&&st.size<200000,g+' '+kind);}
 assert.match(src,/if\(key==='corporate-zombies'\)\{[^\n]*\n[^\n]*arcade-cab-gun'/,'Corporate Zombies has light guns on its panel');
 assert.match(fs.readFileSync('void-runner/remote-players.js','utf8'),/ROOM_MODES=new Set\(\[[^\]]*'arcade'/,'a player at a cabinet stays in the room, where others still see them');
});
