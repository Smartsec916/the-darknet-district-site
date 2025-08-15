
// engine.js  (shared engine for Levels 1–3)
const W = 960, H = 720;
const TILE = 48;
const LEVEL_LEN = 2000;              // world width
const GRAV = 0.9, JUMP_V = -14, MAX_DX = 6, FRICTION = 0.8;
const HYPER_RELOAD_TAG = Date.now(); // dev bust cache

// ====== storage helpers (session for run; local for leaderboard) ======
export function getRunN(k,d=0){ return +(sessionStorage.getItem(k) ?? d) }
export function setRunN(k,v){ sessionStorage.setItem(k, String(v)) }
export function getRunO(k,d={}){ try{return JSON.parse(sessionStorage.getItem(k)||'null')??d}catch(e){return d} }
export function setRunO(k,o){ sessionStorage.setItem(k, JSON.stringify(o)) }
export function hardResetRun(){
  sessionStorage.clear();
  setRunN('playerBTC',0);
  setRunN('playerScore',0);
  setRunN('playerHealth',100);
  setRunO('playerUpgrades',{});
  setRunN('gameLevel',1);
}
export function goTo(href){ window.location.assign(href) }

function getLeaderboard(){ try{return JSON.parse(localStorage.getItem('leaderboard')||'[]')}catch(e){return[]} }
function setLeaderboard(list){ localStorage.setItem('leaderboard', JSON.stringify(list)) }
function postScore(score=0){
  const id = Math.random().toString(36).slice(2,10).toUpperCase();
  const lb = getLeaderboard();
  lb.push({id, score});
  lb.sort((a,b)=> (b.score|0)-(a.score|0));
  setLeaderboard(lb.slice(0,10));
}

// ====== assets ======
function IMG(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }) }

function bgURLsForLevel(lvl){
  const n = Math.max(1, Math.min(3, lvl|0));
  return {
    far:  `./assets/0${n}_bg_far.png?${HYPER_RELOAD_TAG}`,
    near: `./assets/0${n}_bg_near.png?${HYPER_RELOAD_TAG}`
  };
}

const LEVEL_ADS = {
  1: { list:[
    `./assets/4K.png?${HYPER_RELOAD_TAG}`,
    `./assets/Meat.png?${HYPER_RELOAD_TAG}`,
    `./assets/HoloCompanion.png?${HYPER_RELOAD_TAG}`,
    `./assets/Rent.png?${HYPER_RELOAD_TAG}`,
    `./assets/Drink_Oil_01.png?${HYPER_RELOAD_TAG}`,
    `./assets/Drink_Oil_02.png?${HYPER_RELOAD_TAG}`,
  ]},
  2: { list:[
    `./assets/Blackrock.png?${HYPER_RELOAD_TAG}`,
    `./assets/Downthere.png?${HYPER_RELOAD_TAG}`,
    `./assets/Oxygen.png?${HYPER_RELOAD_TAG}`,
    `./assets/Skinshift.png?${HYPER_RELOAD_TAG}`,
    `./assets/Zen.png?${HYPER_RELOAD_TAG}`,
  ]},
  3: { list:[
    `./assets/Bug.png?${HYPER_RELOAD_TAG}`,
    `./assets/Pill.png?${HYPER_RELOAD_TAG}`,
    `./assets/Plug.png?${HYPER_RELOAD_TAG}`,
    `./assets/Touchless.png?${HYPER_RELOAD_TAG}`,
    `./assets/Pinknoise.png?${HYPER_RELOAD_TAG}`,
  ]},
};

async function loadAdImagesFor(lvl){
  const pack = LEVEL_ADS[lvl] || LEVEL_ADS[1];
  return Promise.all(pack.list.map(src => IMG(src)));
}

// ====== core state objects ======
let C, ctx, off, octx, VW, VH;
let LEFT=0, RIGHT=0, UP=0;
let player, cameraX=0, platforms=[], coins=[], robots=[], drones=[], ads=[], exitDoor=null;
let BG={far:null, near:null}, AdImages=[];
let LVL=1, NEXT_HREF='./index.html';

// ====== helpers ======
function groundY(){ return H - 64 }
function clamp(v,a,b){ return v<a?a:v>b?b:v }
function aabb(a,b){ return (a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y) }

// ====== background draw: scale by height, tile horizontally, mirror every tile ======
function drawParallax(img, speed){
  if(!img) return;
  const scale = VH / img.height;        // match height only
  const w = img.width * scale, h = VH;
  const cx = cameraX * speed;
  const first = Math.floor((cx)/w)-1;
  for(let i=first;i<first+5;i++){
    const x = Math.floor(-cx + i*w);
    const flip = (i&1);
    if(flip){
      octx.save(); octx.translate(x+w, 0); octx.scale(-1,1);
      octx.drawImage(img, 0, 0, w, h);
      octx.restore();
    } else {
      octx.drawImage(img, x, 0, w, h);
    }
  }
}

// ====== level content ======
function makePlatformsFor(lvl){
  const list=[];
  // Ground
  list.push({x:0, y:groundY(), w:LEVEL_LEN, h:999});
  // Simple ledges vary by level
  if(lvl===1){
    list.push({x:420, y:groundY()-120, w:200, h:12});
    list.push({x:760, y:groundY()-220, w:200, h:12});
  } else if(lvl===2){
    list.push({x:520, y:groundY()-160, w:200, h:12});
    list.push({x:980, y:groundY()-240, w:220, h:12});
  } else if(lvl===3){
    // Open promenade: mostly flat ground
  }
  return list;
}

function makeCoinsFor(lvl){
  const arr=[];
  function add(x,y){ arr.push({x,y,w:16,h:16,t:0,taken:false}) }
  if(lvl===1){ [200,280,350, 600,700, 1100].forEach((x,i)=>add(x, groundY()-80-(i%2)*40)) }
  if(lvl===2){ [180,260,340, 420,500, 820,900,980].forEach(x=>add(x, groundY()-20)) }
  if(lvl===3){ [160,260,360].forEach(x=>add(x, groundY()-20)) }
  return arr;
}

function makeRobotsFor(lvl){
  const arr=[];
  if(lvl>=1){
    arr.push({x:900, y:groundY()-32, w:28,h:32, dx:-1, dy:0, onGround:true, active:(lvl>=1)});
  }
  if(lvl>=2){
    arr.push({x:1300,y:groundY()-32, w:28,h:32, dx:1, dy:0, onGround:true, active:true});
  }
  return arr;
}

function makeDronesFor(lvl){
  const arr=[];
  if(lvl===2){
    // simple patrol drones
    arr.push({x:600, y:groundY()-300, w:32,h:16, dx:1.2, range:[520,820], alive:true, litW:140});
    arr.push({x:1000, y:groundY()-320, w:32,h:16, dx:-1.4, range:[900,1200], alive:true, litW:140});
  }
  return arr;
}

function makeAdsFor(){
  const arr=[];
  for(let i=0;i<8;i++){
    const ax = 180 + i*200 + (Math.random()*40-20);
    const ay = groundY()- (220 + Math.random()*80);
    const img = nextAdImage();
    arr.push({x:ax,y:ay,w:128,h:80,img,phase:Math.random()*6});
  }
  return arr;
}

function nextAdImage(){
  if(!AdImages.length) return null;
  nextAdImage.deck = (nextAdImage.deck && nextAdImage.deck.length) ? nextAdImage.deck : [...AdImages].sort(()=>Math.random()-0.5);
  return nextAdImage.deck.shift();
}

function placeExitDoor(){
  const DOOR_W=26, DOOR_H=60;
  const x=LEVEL_LEN-40, y=groundY()-DOOR_H;
  exitDoor={x,y,w:DOOR_W,h:DOOR_H};
}

// ====== player ======
function spawnPlayer(){
  return {x:40, y:groundY()-40, w:24, h:36, dx:0, dy:0, onGround:false, facing:1, alive:true}
}

// ====== input ======
addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW'].includes(e.code)) e.preventDefault();
  if(e.code==='ArrowLeft'||e.code==='KeyA') LEFT=1;
  if(e.code==='ArrowRight'||e.code==='KeyD') RIGHT=1;
  if(e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Space') UP=1;
});
addEventListener('keyup',e=>{
  if(e.code==='ArrowLeft'||e.code==='KeyA') LEFT=0;
  if(e.code==='ArrowRight'||e.code==='KeyD') RIGHT=0;
  if(e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Space') UP=0;
});

// ====== physics ======
function physics(){
  // horizontal
  if(LEFT) player.dx = clamp(player.dx-0.8, -MAX_DX, MAX_DX);
  if(RIGHT) player.dx = clamp(player.dx+0.8, -MAX_DX, MAX_DX);
  if(!LEFT && !RIGHT) player.dx *= FRICTION;

  // jump
  if(UP && player.onGround){ player.dy = JUMP_V; player.onGround=false }

  // gravity
  player.dy += GRAV;

  // integrate
  player.x += player.dx;
  player.y += player.dy;

  // collide with platforms
  player.onGround=false;
  for(const p of platforms){
    // vertical resolution
    if(aabb(player,{x:p.x,y:p.y-1000,w:p.w,h:1000}) && player.dy>0 && player.y+player.h>p.y && player.y<p.y){
      // above ground
    }
    // resolve floor
    if(aabb(player,p)){
      if(player.dy>0 && (player.y+player.h - p.y) < 40){
        player.y = p.y - player.h; player.dy=0; player.onGround=true;
      } else {
        // simple side resolve
        if(player.dx>0) player.x = p.x - player.w;
        else if(player.dx<0) player.x = p.x + p.w;
        player.dx=0;
      }
    }
  }

  // world bounds
  player.x = clamp(player.x, 0, LEVEL_LEN - player.w);
  if(player.y>H+200){ // fell
    killPlayer();
  }

  cameraX = clamp(player.x - W*0.35, 0, LEVEL_LEN - W);
}

function killPlayer(){
  if(!player.alive) return;
  player.alive=false;
  // Score = BTC for now
  postScore(getRunN('playerBTC',0));
  // wipe run state (only keep leaderboard)
  setTimeout(()=>goTo('./index.html'), 800);
}

// ====== coins, robots, drones ======
function updateWorld(){
  // coins
  const u=getRunO('playerUpgrades',{});
  for(const c of coins){
    if(c.taken) continue;
    // magnet
    if(u.coinMagnet){
      const dx=(player.x - c.x)*0.04, dy=(player.y - c.y)*0.04;
      c.x += dx; c.y += dy;
    }
    // collect
    if(aabb(player,c)){
      c.taken=true;
      setRunN('playerBTC', getRunN('playerBTC',0)+1);
    }
    c.t += 0.1;
  }

  // robots simple patrol + bounce
  for(const r of robots){
    if(!r.active) continue;
    r.x += r.dx;
    // ground clamp
    r.y = groundY()-32;
    if(r.x<0 || r.x>LEVEL_LEN-28) r.dx*=-1;

    // contact damage (not in L3)
    if(LVL!==3 && aabb(player,r)){
      killPlayer();
    }
  }

  // drones patrol (L2). When alive, show down light cone; if EMP used later, they would fall.
  for(const d of drones){
    if(!d.alive) continue;
    d.x += d.dx;
    if(d.x<d.range[0]||d.x>d.range[1]) d.dx*=-1;

    // simple "lit jump" rule: if player is above a robot and within cone X-range, push one robot upward slightly
    const coneL = d.x - d.litW/2;
    const coneR = d.x + d.litW/2;
    if(player.x>coneL && player.x<coneR){
      for(const r of robots){
        if(player.y < r.y && Math.abs((player.x+player.w/2)-(r.x+r.w/2))<120){
          // temporary assisted hop
          r.y -= 0.6;
        }
      }
    }
  }

  // exit door
  if(exitDoor && aabb(player, exitDoor)){
    // Persist and go to shop
    setRunN('playerHealth', 100);
    goTo(NEXT_HREF);
  }
}

// ====== draw ======
function draw(){
  // backgrounds
  drawParallax(BG.far, 0.25);
  drawParallax(BG.near, 0.5);

  // platforms
  octx.fillStyle='#38444c';
  for(const p of platforms){
    const x=p.x-cameraX;
    if(x+p.w<0||x>W) continue;
    octx.fillRect(x, p.y, p.w, 6);
  }

  // ads (hologram vibe)
  for(const a of ads){
    const x=a.x-cameraX, y=a.y;
    if(x+a.w<0||x>W) continue;
    if(a.img) octx.drawImage(a.img, x, y, a.w, a.h);
    // glow sweep
    octx.globalAlpha=0.12;
    octx.fillStyle='#9cf';
    octx.fillRect(x, y + (Math.sin(a.phase+=0.02)*0.5+0.5)*a.h, a.w, 3);
    octx.globalAlpha=1;
  }

  // coins
  for(const c of coins){
    if(c.taken) continue;
    const x=c.x-cameraX, y=c.y + Math.sin(c.t)*2;
    if(x+16<0||x>W) continue;
    octx.fillStyle='#ffd966';
    octx.beginPath(); octx.arc(x+8,y+8,7,0,Math.PI*2); octx.fill();
    octx.fillStyle='#b28f2c';
    octx.fillRect(x+6,y+4,4,8);
  }

  // robots
  octx.fillStyle='#9ad';
  for(const r of robots){
    const x=r.x-cameraX;
    if(x+r.w<0||x>W) continue;
    octx.fillRect(x, r.y, r.w, r.h);
  }

  // drones
  for(const d of drones){
    if(!d.alive) continue;
    const x=d.x-cameraX;
    if(x+d.w<0||x>W) continue;
    // body
    octx.fillStyle='#ccc';
    octx.fillRect(x, d.y, d.w, d.h);
    // down cone (simple)
    octx.globalAlpha=0.08;
    octx.fillStyle='#9cf';
    octx.fillRect(x - d.litW/2 + d.w/2, d.y+d.h, d.litW, H);
    octx.globalAlpha=1;
  }

  // exit door
  if(exitDoor){
    const x=exitDoor.x-cameraX, y=exitDoor.y;
    octx.fillStyle='#0f0';
    octx.fillRect(x, y, exitDoor.w, exitDoor.h);
  }

  // player
  octx.fillStyle='#fff';
  octx.fillRect(player.x-cameraX, player.y, player.w, player.h);

  // HUD
  octx.fillStyle='#cfd6df';
  octx.font='12px monospace';
  const btc = getRunN('playerBTC',0);
  const hp  = getRunN('playerHealth',100);
  const u = getRunO('playerUpgrades',{});
  let hud=`HP ${hp}  L${LVL}  BTC ${btc}`;
  if(u.mobileEMPOwned) hud+=`  Charges:${u.mobileEMP|0}`;
  octx.fillText(hud, 8, 16);
}

function blit(){ ctx.clearRect(0,0,VW,VH); ctx.drawImage(off,0,0,VW,VH) }

function loop(){
  physics();
  updateWorld();
  octx.clearRect(0,0,W,H);
  draw();
  blit();
  requestAnimationFrame(loop);
}

// ====== public entry point ======
export async function bootLevel(levelNumber, opts={}){
  const canvas = document.getElementById('game');
  C = canvas; ctx = C.getContext('2d');
  VW = C.width; VH = C.height;
  off = document.createElement('canvas'); off.width=W; off.height=H; octx=off.getContext('2d');

  LVL = levelNumber|0;
  NEXT_HREF = opts.nextHref || './index.html';

  // load backgrounds + ads
  const bgU = bgURLsForLevel(LVL);
  [BG.far, BG.near] = await Promise.all([IMG(bgU.far), IMG(bgU.near)]);
  AdImages = await loadAdImagesFor(LVL);

  // build level
  player = spawnPlayer();
  cameraX = 0;
  platforms = makePlatformsFor(LVL);
  coins = makeCoinsFor(LVL);
  robots = makeRobotsFor(LVL);
  drones = makeDronesFor(LVL);
  ads = makeAdsFor();
  placeExitDoor();

  // controls reset per page
  LEFT=RIGHT=UP=0;

  // start loop
  loop();
}
