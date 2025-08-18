// engine.js — shared engine for Levels 1–3 (ES module)

// ---------- Canvas + world ----------
const VW = 256, VH = 192;     // internal resolution (pixel art)
const CHUNK = 160, TILE = 16; // world chunk size / tile size
const LEVEL_LEN = 1600;       // distance to exit door
const DOOR_W = 24, DOOR_H = 32;
const CACHE_BUSTER = 'rev=' + Date.now();

// Canvas buffers
let screen, sctx; // on-screen canvas (from page), but we draw to an offscreen first
let off, ctx;     // offscreen buffer

// Level state
let LVL = 1, NEXT_HREF = './index.html';
let cameraX = 0, worldMaxX = 0, generatedUntil = 0;

// World arrays
let platforms=[], robots=[], drones=[], females=[], terminals=[], ads=[], coins=[];
let exitDoor=null;

// Player
let player=null, score=0, btc=0;

// ---------- Session/local storage helpers ----------
export function getRunN(k, d=0){ const n=parseInt(sessionStorage.getItem(k)||''); return Number.isFinite(n)?n:d; }
export function setRunN(k, v){ sessionStorage.setItem(k, String(v)); }
export function getRunO(k, d={}){ try{ return JSON.parse(sessionStorage.getItem(k)||'') || d }catch{ return d } }
export function setRunO(k, v){ sessionStorage.setItem(k, JSON.stringify(v)); }
export function hardResetRun(){
  try { sessionStorage.clear(); } catch {}
  sessionStorage.setItem('playerBTC','0');
  sessionStorage.setItem('playerScore','0');
  sessionStorage.setItem('playerHealth','100');
  sessionStorage.setItem('playerUpgrades','{}');
}
export function goTo(href){ location.href = href; }

// ---------- Image helpers ----------
function loadImg(url){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = () => {
      console.log('✓ Loaded:', url);
      resolve(img);
    };
    img.onerror = () => {
      console.error('✗ Failed to load:', url);
      console.error('Full path attempted:', img.src);
      reject(new Error('Image failed: ' + url));
    };
    img.src = url + (url.includes('?') ? '&' : '?') + CACHE_BUSTER;
  });
}

// ---------- Sprite registry (paths are case-sensitive) ----------
const SPRITES = {
  player: {
    fw: 48, fh: 48,
    states: {
      idle:  'assets/player_idle_48.png',
      run:   'assets/player_run_48.png',
      hurt:  'assets/player_hurt_48.png',
      dead:  'assets/player_dead_48.png',
      jump:  'assets/player_jump_48.png',
      fall:  'assets/player_fall_48.png'
    },
    fps: { idle:6, run:12, hurt:6, dead:8, jump:10, fall:10 }
  },
  // We map "robots" to your drone_* art files so filenames match your repo.
  robot: {
    fw: 32, fh: 32,
    states: {
      idle:   'assets/drone_idle_32.png',
      move:   'assets/drone_move_32.png',
      attack: 'assets/drone_attack_32.png',
      hurt:   'assets/drone_hurt_32.png',
      dead:   'assets/drone_dead_32.png'
    },
    fps: { idle:4, move:10, attack:12, hurt:6, dead:8 }
  },
  drone: {
    fw: 32, fh: 32,
    states: {
      idle:   'assets/drone_idle_32.png',
      hover:  'assets/drone_hover_32.png',
      move:   'assets/drone_move_32.png',
      attack: 'assets/drone_attack_32.png',
      hurt:   'assets/drone_hurt_32.png',
      dead:   'assets/drone_dead_32.png'
    },
    fps: { idle:3, hover:10, move:10, attack:12, hurt:6, dead:8 }
  },
  female: {
    fw: 48, fh: 48,
    states: {
      idle: 'assets/female_idle.png',
      run:  'assets/female_run.png'
    },
    fps: { idle:6, run:10 }
  }
};

const IMAGES = Object.create(null); // IMAGES['family_state'] = HTMLImageElement

function getSprite(family, state){ return IMAGES[`${family}_${state}`] || null; }

function setAnim(entity, family, state){
  entity.anim ??= {};
  if (entity.anim.family === family && entity.anim.state === state && entity.anim.runner) return;
  const img = getSprite(family, state);
  if (!img) { entity.anim = { family, state, runner: null, fw:0, fh:0, ix:0, iy:0, cols:1, frames:1, acc:0, fps:8 }; return; }
  const fw = SPRITES[family].fw, fh = SPRITES[family].fh;
  const cols = Math.max(1, (img.naturalWidth / fw)|0);
  const rows = Math.max(1, (img.naturalHeight / fh)|0);
  const frames = Math.max(1, cols * rows);
  const fps = SPRITES[family].fps[state] ?? 8;
  entity.anim = { family, state, img, fw, fh, cols, frames, fps, ix:0, iy:0, f:0, acc:0, runner:true };
}

function stepAnim(entity, dt){
  const a = entity.anim; if (!a || !a.runner || !a.img) return;
  a.acc += dt / (1000 / a.fps);
  const step = a.acc|0;
  if (step > 0){
    a.f = (a.f + step) % a.frames; a.acc = 0;
    a.ix = (a.f % a.cols) * a.fw; a.iy = ((a.f / a.cols)|0) * a.fh;
  }
}

function drawAnim(entity, dx, dy, flip=false, alpha=1){
  const a = entity.anim; if (!a || !a.img) return;
  ctx.save();
  const prevA = ctx.globalAlpha; ctx.globalAlpha = alpha;
  if (flip){
    ctx.scale(-1, 1);
    ctx.drawImage(a.img, a.ix, a.iy, a.fw, a.fh, -(dx + a.fw), dy, a.fw, a.fh);
  } else {
    ctx.drawImage(a.img, a.ix, a.iy, a.fw, a.fh, dx, dy, a.fw, a.fh);
  }
  ctx.globalAlpha = prevA; ctx.restore();
}

// Preload all sprites once
async function preloadSprites(){
  if (IMAGES.__ready) return;
  const jobs = [];
  for (const [fam, spec] of Object.entries(SPRITES)){
    for (const [state, url] of Object.entries(spec.states)){
      const key = `${fam}_${state}`;
      jobs.push(loadImg(url).then(img => { IMAGES[key] = img; }));
    }
  }
  await Promise.all(jobs);
  IMAGES.__ready = true;
}

// ---------- Backgrounds / tiles / ads ----------
let bgFarImg=null, bgNearImg=null, coinImg=null, doorImg=null, platformImg=null, platformRailImg=null, terminalA=null, terminalB=null;

function bgURLsForLevel(lvl){
  if (lvl===1) return { far:'assets/01_bg_far.png', near:'assets/01_bg_near.png' };
  if (lvl===2) return { far:'assets/02_bg_far.png', near:'assets/02_bg_near.png' };
  return { far:'assets/03_bg_far.png', near:'assets/03_bg_near.png' };
}

async function loadBackgrounds(level){
  const {far, near} = bgURLsForLevel(level);
  [bgFarImg, bgNearImg] = await Promise.all([loadImg(far), loadImg(near)]);
}
async function loadTiles(){
  [coinImg, doorImg, platformImg, platformRailImg, terminalA, terminalB] = await Promise.all([
    loadImg('assets/btc_glow.png'),
    loadImg('assets/shop_door_neon.png').catch(err => {
      console.error('Door image failed to load, using fallback');
      return null;
    }),
    loadImg('assets/platform_industrial.png').catch(()=>null),      // optional
    loadImg('assets/platform_rail.png').catch(()=>null), // optional
    loadImg('assets/hacker_terminal_frame1.png').catch(()=>null),       // optional
    loadImg('assets/hacker_terminal_frame2.png').catch(()=>null)        // optional
  ]);
}

// Level-specific ads (by filename in /assets)
const AdSets = {
  1: ['4K','btc_glow','Drink_Oil_01','Drink_Oil_02'],
  2: ['Blackrock','Downthere','Oxygen','Skinshift','Zen'],
  3: ['Bug','Pill','Plug','Touchless','Pinknoise']
};
const AdImgs = Object.create(null);

async function loadAdImages(level){
  const names = AdSets[level] || [];
  const jobs = names.map(n => loadImg(`assets/${n}.png`).then(img => { AdImgs[n]=img; }));
  await Promise.all(jobs);
}
function pickAdKind(){ const arr = AdSets[LVL]||[]; return arr[(Math.random()*arr.length)|0] || null; }

// ---------- Utility ----------
function groundY(){ return VH - TILE; }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function rects(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

// ---------- World gen ----------
function pushGroundRow(fromX, toX){
  const y = groundY();
  for (let x=fromX; x<toX; x+=TILE) platforms.push({x, y, w:TILE, h:TILE});
}

function genChunk(startX){
  const endX = startX + CHUNK;
  const firstScreen = startX < VW;

  pushGroundRow(startX, endX);

  // platforms / rails
  const allowStruct = (!firstScreen) && (startX >= 300);
  if (allowStruct){
    // two platforms
    const lowX = startX + 24 + Math.random()*80;
    const lowW = 48 + ((Math.random()*64)|0);
    const lowY = VH - TILE*3 - ((Math.random()*12)|0);
    platforms.push({x: lowX|0, y: lowY|0, w: lowW|0, h: TILE|0});

    const highX = startX + CHUNK - (80 + Math.random()*60);
    const highW = 48 + ((Math.random()*60)|0);
    const highY = VH - TILE*4 - ((Math.random()*18)|0);
    platforms.push({x: highX|0, y: highY|0, w: highW|0, h: TILE|0});

    // rail lines (drawn on top)
    platforms.push({x: lowX|0,  y: (lowY-3)|0,  w: lowW|0,  h:3, rail:true});
    platforms.push({x: highX|0, y: (highY-3)|0, w: highW|0, h:3, rail:true});

    // coins near platforms
    const above = [
      {x: lowX + 8 + Math.random()*Math.max(16, lowW-16),  y: lowY - 20},
      {x: highX + 8 + Math.random()*Math.max(16, highW-16), y: highY - 20},
      {x: (lowX + highX)/2, y: Math.min(lowY, highY) - 26}
    ];
    for (const p of above){ coins.push({x:p.x|0, y:Math.max(40, Math.min(VH-24, p.y))|0, r:10, taken:false}); }

    // terminals
    if (Math.random() < 0.5){
      const tx = startX + 40 + Math.random()*(CHUNK-80);
      let ty = VH - TILE*2;
      for(const p of platforms){ if(tx >= p.x-4 && tx <= p.x+p.w+4) ty = Math.min(ty, p.y - TILE); }
      terminals.push({x:tx|0, y:ty|0, w:12, h:16, cooldown:0});
    }

    // ads (crisp, legible)
    if (Math.random() < 0.7){
      const ax = startX + 80 + Math.random()*(CHUNK-160);
      const ay = VH - (140 + ((Math.random()*60)|0));
      const kind = pickAdKind(); if (kind) ads.push({x:ax|0, y:ay|0, kind, phase:Math.random()*6});
    }
  }

  // Level-specific enemies/NPCs
  if (LVL === 1 && startX >= 300){
    const count = 1 + ((Math.random()*2)|0);
    for (let i=0;i<count;i++){
      const rx = startX + 64 + Math.random()*(CHUNK-128);
      robots.push({
        type:'robot', x:rx|0, y:VH - TILE*2, w:18, h:24,
        dir: Math.random()<0.5?-1:1, speed:0.66, hp:3,
        active:false, patrolL:rx-40, patrolR:rx+40,
        hitUntil:0, state:'patrol', anim:null
      });
      setAnim(robots[robots.length-1], 'robot', 'idle');
    }
  }

  if (LVL === 2 && startX >= 300){
    if (Math.random() < 0.6){
      const dx = startX + 80 + Math.random()*(CHUNK-160);
      const dy = 60 + Math.random()*80;
      drones.push({
        type:'drone', x:dx|0, y:dy|0, w:18, h:14,
        dir: Math.random()<0.5?-1:1, speed:0.8, phase:Math.random()*6,
        active:false, disabled:false, anim:null
      });
      setAnim(drones[drones.length-1], 'drone', 'move');
    }
  }

  if (LVL === 3 && startX >= 300){
    // more coins
    for (let i=0; i<5; i++){
      const cx = startX + 30 + Math.random()*(CHUNK-60);
      coins.push({x:cx|0, y:(groundY()-24)|0, r:10, taken:false});
    }
    // ads
    const variety = 1 + ((Math.random()*2)|0);
    for (let i=0;i<variety;i++){
      const ax = startX + 80 + Math.random()*(CHUNK-160);
      const ay = VH - (100 + ((Math.random()*60)|0));
      const kind = pickAdKind(); if (kind) ads.push({x:ax|0, y:ay|0, kind, phase:Math.random()*6});
    }
    // females — spawn inactive so they use same activation as robots
    const fc = 2 + ((Math.random()*2)|0);
    for (let i=0;i<fc;i++){
      const fx = startX + 64 + Math.random()*(CHUNK-128);
      females.push({
        type:'female', x:fx|0, y:VH - TILE*2, w:18, h:28,
        dir: Math.random()<0.5?-1:1, speed:0.66, hp:1,
        active:false, patrolL:fx-50, patrolR:fx+50,
        hitUntil:0, state:'patrol', hasTaken:false, anim:null
      });
      setAnim(females[females.length-1], 'female', 'idle');
    }
  }

  generatedUntil = endX;
  worldMaxX = Math.max(worldMaxX, endX);
}

function placeExit(){ exitDoor = {x: LEVEL_LEN - 40, y: VH - TILE*3, w: DOOR_W, h: DOOR_H}; }

// ---------- Input ----------
let LEFT=false, RIGHT=false, JUMP=false, ENTER=false, EKEY=false, ESC=false;
function bindInput(){
  const set=(k,v)=>{ if(k==='ArrowLeft'||k==='a') LEFT=v; if(k==='ArrowRight'||k==='d') RIGHT=v; if(k===' '||k==='ArrowUp'||k==='w') JUMP=v; if(k==='Enter') ENTER=v; if(k==='e'||k==='E') EKEY=v; if(k==='Escape') ESC=v; };
  addEventListener('keydown',e=>set(e.key,true));
  addEventListener('keyup',e=>set(e.key,false));
}

// ---------- Collisions / helpers ----------
function damagePlayer(n){
  if (player.hp <= 0) return;
  player.hp = Math.max(0, player.hp - n);
  setRunN('playerHealth', player.hp);
  player.hitUntil = performance.now() + 300;
}

function collide(a){
  const body = {x:a.x, y:a.y, w:a.w, h:a.h, vx:a.vx, vy:a.vy, onGround:false};

  // vertical
  body.y += body.vy;
  for (const p of platforms){
    if (!rects(body, p)) continue;
    if (body.vy > 0){ body.y = p.y - body.h; body.onGround = true; body.vy = 0; }
    else if (body.vy < 0){ body.y = p.y + p.h; body.vy = 0; }
  }
  // horizontal
  body.x += body.vx;
  for (const p of platforms){
    if (!rects(body, p)) continue;
    if (body.vx > 0) body.x = p.x - body.w;
    else if (body.vx < 0) body.x = p.x + p.w;
    body.vx = 0;
  }

  a.x=body.x; a.y=body.y; a.vx=body.vx; a.vy=body.vy; a.onGround=body.onGround;

  // enemy touches
  for (const r of robots){
    if (!r.active) continue;
    if (rects(a, {x:r.x-10,y:r.y-18,w:20,h:22})) damagePlayer(20);
  }
  for (const d of drones){
    if (!d.active || d.disabled) continue;
    if (rects(a, {x:d.x-8,y:d.y-6,w:16,h:12})) damagePlayer(15);
  }
  for (const f of females){
    if (!f.active) continue;
    if (rects(a, {x:f.x-10,y:f.y-18,w:20,h:22}) && !f.hasTaken){
      const have = getRunN('playerBTC', 0);
      const take = Math.min(5, have);
      setRunN('playerBTC', have - take);
      btc = getRunN('playerBTC', 0);
      f.hasTaken = true;
      setAnim(f, 'female', 'idle');
    }
  }
}

// ---------- Update / draw ----------
let lastTime = 0, gameState = 'playing';

function activateByProgress(){
  // Everything wakes up once player has moved forward a bit (same rule for all)
  const gate = 400;
  const visRight = cameraX + VW + 64;

  for (const r of robots){
    if (!r.active && r.x < visRight && player.x >= gate) r.active = true;
  }
  for (const d of drones){
    if (!d.active && d.x < visRight && player.x >= gate) d.active = true;
  }
  for (const f of females){
    if (!f.active && f.x < visRight && player.x >= gate){
      f.active = true;
      if (!f.anim || !f.anim.img) setAnim(f, 'female', 'run');
    }
  }
}

function pickupCoins(){
  for (const c of coins){
    if (c.taken) continue;
    const dx = Math.abs(player.x - c.x), dy = Math.abs(player.y - c.y);
    if (dx < 14 && dy < 18){ c.taken = true; btc += 1; setRunN('playerBTC', btc); }
  }
}

function drawBackgrounds(){
  const farX = -((cameraX) * 0.18)|0;
  const nearX = -((cameraX) * 0.55)|0;
  if (bgFarImg)  ctx.drawImage(bgFarImg,  farX, 0);
  if (bgNearImg) ctx.drawImage(bgNearImg, nearX, 0);
}
function drawTiles(){
  for (const p of platforms){
    if (p.rail) continue;
    const x = (p.x - cameraX)|0, y = p.y|0;
    if (x + p.w < 0 || x > VW) continue;
    if (platformImg) ctx.drawImage(platformImg, x, y-(TILE-3), p.w, TILE);
    else { ctx.fillStyle='#333'; ctx.fillRect(x, y-(TILE-3), p.w, TILE); }
  }
}
function drawRails(){
  for (const p of platforms){
    if (!p.rail) continue;
    const x = (p.x - cameraX)|0, y = p.y|0;
    if (x + p.w < 0 || x > VW) continue;
    if (platformRailImg) ctx.drawImage(platformRailImg, x, y, p.w, p.h);
  }
}
function drawTerminals(){
  const frame = (Math.floor(performance.now()/400)%2===0) ? terminalA : terminalB;
  if (!frame) return;
  for (const t of terminals){
    const x = (t.x - cameraX)|0, y = (t.y - 12)|0;
    if (x + 16 < 0 || x > VW) continue;
    ctx.drawImage(frame, x-4, y-4, 20, 20);
  }
}
function drawAds(){
  for (const a of ads){
    const x = (a.x - cameraX)|0, y = a.y|0;
    if (x + 60 < 0 || x > VW) continue;
    a.phase = (a.phase || 0) + 0.004;
    const img = AdImgs[a.kind];
    if (!img) continue;
    const targetW = 64;
    const ratio = img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
    const w = targetW, h = Math.max(16, Math.round(targetW / ratio));
    const dx = x - (w>>1), dy = y - (h>>1) + Math.sin(a.phase)*0.5;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(6,10,14,0.88)';
    ctx.fillRect(dx-3, dy-3, w+6, h+6);
    ctx.strokeStyle = 'rgba(0,255,157,0.55)';
    ctx.strokeRect(dx-3, dy-3, w+6, h+6);
    ctx.drawImage(img, dx, dy, w, h);
    ctx.restore();
  }
}
function drawCoins(){
  for (const c of coins){
    if (c.taken) continue;
    const x = (c.x - cameraX)|0, y = c.y|0;
    if (x + 16 < 0 || x > VW) continue;
    ctx.drawImage(coinImg, x-6, y-6, 12, 12);
  }
}
function drawEntities(){
  for (const r of robots){
    const x = (r.x - cameraX)|0, y = r.y|0;
    if (x + 32 < 0 || x > VW) continue;
    setAnim(r, 'robot', r.active ? 'move' : 'idle');
    stepAnim(r, 16);
    drawAnim(r, x-12, y-16, (player.x < r.x), 1);
  }
  for (const d of drones){
    const x = (d.x - cameraX)|0, y = d.y|0;
    if (x + 32 < 0 || x > VW) continue;
    setAnim(d, 'drone', d.active ? 'move' : 'idle');
    stepAnim(d, 16);
    drawAnim(d, x-8, y-8, false, d.disabled ? 0.7 : 1);
  }
  for (const f of females){
    const x = (f.x - cameraX)|0, y = f.y|0;
    if (x + 48 < 0 || x > VW) continue;
    setAnim(f, 'female', f.active ? 'run' : 'idle');
    stepAnim(f, 16);
    drawAnim(f, x-15, y-22, (player.x < f.x), 1);
  }
  // player
  const px = (player.x - cameraX)|0, py = player.y|0;
  stepAnim(player, 16);
  drawAnim(player, px-15, py-22, player.facing===-1, performance.now() < player.hitUntil ? 0.85 : 1);
}
function drawExit(){
  if (!exitDoor) return;
  const x = (exitDoor.x - cameraX)|0, y = exitDoor.y|0;
  if (x > VW || x + exitDoor.w < 0) return;
  if (doorImg && doorImg.complete && doorImg.naturalWidth){
    ctx.save(); ctx.shadowColor='#ff1493'; ctx.shadowBlur=6;
    ctx.drawImage(doorImg, x, y, exitDoor.w, exitDoor.h);
    ctx.restore();
  } else { ctx.fillStyle='#d16'; ctx.fillRect(x, y, exitDoor.w, exitDoor.h); }
}

function drawUI(){
  ctx.fillStyle='rgba(0,0,0,.78)'; ctx.fillRect(0,0,VW,18);
  ctx.fillStyle='#cfd6df'; ctx.font='9px monospace';
  ctx.fillText(`HP:${Math.max(0, player.hp)}  L:${LVL}  SC:${score}  BTC:${btc}`, 6, 4);
  ctx.fillStyle='#7dff9a';
  ctx.fillText(`DIST:${player.dist|0}  DOOR@:${(LEVEL_LEN-40)|0}`, 120, 4);
}

function update(dt, now){
  if (gameState !== 'playing') return;

  // Input → velocity
  const accelG = 0.23, accelA = 0.12, dragG=0.84, dragA=0.92, jumpV=3.35;
  const accel = player.onGround ? accelG : accelA;
  const drag  = player.onGround ? dragG : dragA;

  if (LEFT){  player.vx = Math.max(player.vx - accel, -1.3); player.facing = -1; }
  if (RIGHT){ player.vx = Math.min(player.vx + accel,  1.3); player.facing =  1; }
  if (!LEFT && !RIGHT) player.vx *= drag;

  // Simple jump (coyote omitted for brevity)
  if (JUMP && player.onGround){ player.vy = -jumpV; player.onGround=false; }

  // gravity
  player.vy += 0.18; if (player.vy > 3.7) player.vy = 3.7;

  // collide/move
  collide(player);

  // anim state
  if (player.hp <= 0) setAnim(player, 'player', 'dead');
  else if (!player.onGround) setAnim(player, 'player', player.vy<0 ? 'jump' : 'fall');
  else {
    const s = Math.abs(player.vx);
    setAnim(player, 'player', s > 0.8 ? 'run' : 'idle');
  }

  // ensure enough world ahead
  const need = cameraX + VW + CHUNK*2;
  while (generatedUntil < need) genChunk(generatedUntil);

  // activation parity
  activateByProgress();

  // simple AI
  for (const r of robots){
    if (!r.active) continue;
    r.x += r.dir * r.speed * 0.9;
    if (r.x < r.patrolL || r.x > r.patrolR) r.dir *= -1;
  }
  for (const d of drones){
    if (!d.active || d.disabled) continue;
    d.x += d.dir * d.speed;
    if (d.x < 32) d.dir = 1;
    if (d.x > worldMaxX - 32) d.dir = -1;
  }
  for (const f of females){
    if (!f.active) continue;
    f.x += f.dir * f.speed * 0.9;
    if (f.x < f.patrolL || f.x > f.patrolR) f.dir *= -1;
  }

  pickupCoins();

  // camera
  cameraX = clamp(player.x - VW/2, 0, Math.max(0, worldMaxX - VW));
  player.dist = Math.max(player.dist, player.x);

  // exit door
  if (!exitDoor && player.dist > LEVEL_LEN - 220) placeExit();
  if (exitDoor && rects(player, exitDoor)){
    setRunN('playerHealth', Math.max(1, player.hp));
    setRunN('playerBTC', btc);
    setRunN('playerScore', score + 50);
    location.href = NEXT_HREF;
  }
}

function loop(now){
  const dt = now - lastTime; lastTime = now;
  update(dt, now);

  // clear & draw
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,VW,VH);
  drawBackgrounds();
  drawTiles();
  drawTerminals();
  drawAds();
  drawCoins();
  drawExit();
  drawEntities();
  drawRails();
  drawUI();

  // blit offscreen → on-screen
  const dctx = screen.getContext('2d');
  dctx.imageSmoothingEnabled = false;
  dctx.drawImage(off, 0, 0, VW, VH, 0, 0, screen.width, screen.height);

  requestAnimationFrame(loop);
}

// ---------- Player factory ----------
function makePlayer(){
  return {
    x: 40, y: VH - TILE*2, w:16, h:24,
    vx:0, vy:0, facing:1, onGround:false,
    hp: getRunN('playerHealth', 100),
    hitUntil: 0,
    dist: 0,
    anim: null
  };
}

// ---------- Public entry ----------
export async function bootLevel(levelNumber, opts = {}){
  // find canvas #game on the level page
  screen = document.getElementById('game');
  if (!screen) throw new Error('Canvas #game not found');

  // offscreen buffer matches internal res
  off = document.createElement('canvas');
  off.width = VW; off.height = VH;
  ctx = off.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // on-screen context sizing is controlled by the page’s CSS
  sctx = screen.getContext('2d');

  LVL = levelNumber|0;
  NEXT_HREF = opts.nextHref || './index.html';

  // load assets
  await preloadSprites();
  await Promise.all([loadBackgrounds(LVL), loadTiles(), loadAdImages(LVL)]);

  // reset world
  cameraX = 0; worldMaxX = 0; generatedUntil = 0;
  platforms=[]; robots=[]; drones=[]; females=[]; terminals=[]; ads=[]; coins=[];
  exitDoor=null;

  // player
  player = makePlayer();
  setAnim(player, 'player', 'idle');

  // initial chunks
  for (let x=0;x<VW + CHUNK*2;x+=CHUNK) genChunk(x);
  placeExit();

  // carry-over values
  score = getRunN('playerScore', 0);
  btc   = getRunN('playerBTC', 0);
  gameState = 'playing';

  bindInput();
  lastTime = performance.now();
  requestAnimationFrame(loop);
}
