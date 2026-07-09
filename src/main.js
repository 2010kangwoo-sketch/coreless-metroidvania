const canvas = document.getElementById("gameCanvas");
if (!canvas) throw new Error("gameCanvas 요소를 찾을 수 없습니다.");
const ctx = canvas.getContext("2d");
canvas.width = Math.max(canvas.width, 900);
canvas.height = Math.max(canvas.height, 520);

const keys = {};
let frame = 0;
let hitStop = 0;
let shakeTimer = 0;
let shakePower = 0;

const world = { width: 6300, height: 900 };
const camera = { x: 0, y: 0, sx: 0, sy: 0 };
const gravity = 0.65;
const particles = [];
const projectiles = [];
const shardWarnings = [];

const playerStart = { x: 70, y: 300 };
const player = {
  x: playerStart.x, y: playerStart.y, width: 32, height: 48,
  vx: 0, vy: 0, facing: 1, onGround: false,
  speed: 5.5, acceleration: 0.6, friction: 0.82, jumpPower: -13,
  hasDoubleJump: false, canDoubleJump: false, doubleJumpUsed: false,
  isDashing: false, dashTimer: 0, dashDuration: 10, dashSpeed: 12,
  dashCooldown: 0, dashCooldownMax: 120,
  maxHealth: 5, health: 5, invincibleTimer: 0,
  coreEnergy: 0, maxCoreEnergy: 6, healCost: 3,
  healTimer: 0, healDuration: 55, healingWillRestore: false,
  attackTimer: 0, attackDuration: 13, attackCooldown: 0, attackCooldownMax: 24, attackId: 0
};
const playerAnim = { state: "idle", frame: 0 };

const game = {
  hasKey: false, memoryFragments: 0, memoryCores: 0, originCores: 0,
  bossFightStarted: false, bossRoomLocked: false, bossDefeated: false,
  bossClearEffectTimer: 0, phaseBannerTimer: 0,
  ending: false, endingFrame: 0, endingInput: false,
  message: "최종 기억실의 보스를 쓰러뜨리세요."
};

const rooms = [
  { name: "방 1: 시작 구역", guide: "기본 이동과 점프", x: 0, width: 900, color: "#111827" },
  { name: "방 2: 근접 전투 구역", guide: "공격과 회피", x: 900, width: 900, color: "#172033" },
  { name: "방 3: 능력 해금 구역", guide: "이중 점프 획득", x: 1800, width: 900, color: "#1f1b2e" },
  { name: "방 4: 잠긴 통로 구역", guide: "열쇠 획득 후 통과", x: 2700, width: 900, color: "#201a1a" },
  { name: "방 5: 기억의 문 구역", guide: "기억 조각으로 문 열기", x: 3600, width: 900, color: "#10251f" },
  { name: "방 6: 기억 핵 구역", guide: "기억 핵 획득", x: 4500, width: 900, color: "#1a1328" },
  { name: "방 7: 최종 보스방", guide: "파란 표식이 생긴 뒤 기억 파편이 떨어짐", x: 5400, width: 900, color: "#061520" }
];

const platforms = [
  [0,420,840,80], [150,350,180,24], [450,315,180,24],
  [630,135,110,24,"double"], [790,105,100,24,"double"], [930,135,110,24,"double"],
  [920,420,820,80], [1030,350,170,24], [1260,300,150,24], [1510,350,170,24],
  [1820,420,260,80], [2220,420,420,80], [1890,345,130,24], [2130,360,90,24], [2320,330,150,24],
  [2700,420,820,80], [2830,350,160,24], [3060,300,160,24], [3300,350,160,24],
  [3600,420,900,80], [3740,340,180,24], [4000,290,180,24], [4260,340,160,24], [3860,245,130,24], [4100,215,140,24], [4350,265,110,24],
  [4500,420,900,80], [4620,350,160,24], [4860,305,160,24], [5100,350,160,24],
  [5400,420,900,80], [5480,245,120,24], [5760,225,170,24], [6110,245,120,24],
  [760,260,40,80], [1660,300,40,120], [2500,300,40,120]
].map(p => ({ x:p[0], y:p[1], width:p[2], height:p[3], requiresDoubleJump:p[4] === "double" }));

const doors = [
  { x: 860, y: 330, width: 40, height: 90, text: "문 1", locked: false, open: true },
  { x: 1760, y: 330, width: 40, height: 90, text: "문 2", locked: false, open: true },
  { x: 2660, y: 330, width: 40, height: 90, text: "문 3", locked: false, open: true },
  { x: 3560, y: 80, width: 40, height: 340, text: "잠긴 문", locked: true, open: false },
  { x: 4460, y: 80, width: 40, height: 340, text: "기억의 문", locked: true, open: false, requiresMemoryFragments: 1 },
  { x: 5360, y: 80, width: 40, height: 340, text: "최종 문", locked: true, open: false, requiresMemoryCores: 1 }
];

const bossGate = { x: 5408, y: 80, width: 34, height: 340, text: "보스전 봉인" };
const keyItem = { x: 3155, y: 260, width: 24, height: 24, collected: false };
const abilityItem = { x: 2160, y: 320, width: 28, height: 28, name: "이중 점프", collected: false };
const rewards = [
  { type:"memoryFragment", name:"기억 조각", x:955, y:95, width:24, height:24, collected:false },
  { type:"memoryCore", name:"기억 핵", x:5120, y:305, width:28, height:28, collected:false },
  { type:"originCore", name:"원점 코어", x:6040, y:372, width:30, height:30, collected:false, requiresBossDefeated:true }
];

function enemy(type, name, x, y, w, h, minX, maxX, hp, speed) {
  return { type, name, x, y, width:w, height:h, minX, maxX, minY:type==="flying"?205:y, maxY:type==="flying"?420:y+h,
    vx:type==="melee"?speed:type==="flying"?speed*0.7:0, vy:0, speed, verticalSpeed:1.45,
    patrol:type==="shooter"?-1:1, attackTimer:0, attackCooldown:0, attackDirection:1, attackHit:false,
    shootTimer:0, shootCooldown:50, shootDirection:-1, shootFired:false,
    maxHealth:hp, health:hp, alive:true, hitTimer:0, hitByAttackId:-1, float:0 };
}
const enemies = [
  enemy("melee","그늘 벌레",1130,384,34,36,990,1600,3,1.35),
  enemy("melee","균열 파수꾼",2320,384,38,36,2220,2620,4,1.45),
  enemy("flying","공허 박쥐",2030,245,38,28,1850,2630,3,1.65),
  enemy("shooter","균열 사수",3920,378,36,42,3740,4140,3,0.65)
];

const boss = {
  name:"기억 파수자", x:5770, y:348, baseY:348, width:72, height:72, minX:5475, maxX:6210,
  vx:0, speed:1.25, facing:-1, maxHealth:22, health:22, alive:true,
  phaseAnnounced:false, hitTimer:0, hitByAttackId:-1, contactCooldown:0,
  attackCooldown:35, attackCooldownMax:90, attackTimer:0, attackDuration:0, attackType:"none",
  attackFired:false, patternIndex:0, startX:5770, targetX:5770, slamHit:false
};

const endingLines = [
  "나는 비어 있던 코어의 흔적을 따라 이곳까지 왔다.",
  "기억 조각은 흩어진 나의 기록이었고,",
  "기억 핵은 잃어버린 중심으로 향하는 열쇠였다.",
  "원점 코어가 깨어나며 멈춰 있던 세계가 다시 움직이기 시작한다.",
  "Coreless.",
  "중심을 잃은 존재가 다시 자신의 원점을 찾는 이야기."
];

window.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (game.ending && game.endingInput && e.code === "KeyR") location.reload();
  if (game.ending) return;
  if (e.code === "Space") { if (!e.repeat) jump(); e.preventDefault(); }
  if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "KeyK") { dash(); e.preventDefault(); }
  if (e.code === "KeyJ") { attack(); e.preventDefault(); }
  if (e.code === "KeyL") { heal(); e.preventDefault(); }
});
window.addEventListener("keyup", e => keys[e.code] = false);

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function cx(o) { return o.x + o.width / 2; }
function cy(o) { return o.y + o.height / 2; }
function hit(a,b) { return a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y; }
function shake(t,p) { shakeTimer = Math.max(shakeTimer,t); shakePower = Math.max(shakePower,p); }
function freeze(t) { hitStop = Math.max(hitStop,t); }
function phase2() { return boss.health <= boss.maxHealth / 2; }
function gateActive() { return game.bossRoomLocked && boss.alive && !game.bossDefeated; }
function currentRoom() { return rooms.find(r => cx(player) >= r.x && cx(player) < r.x+r.width) || rooms[0]; }
function solidObjects() { const s = platforms.slice(); doors.forEach(d => { if (d.locked && !d.open) s.push(d); }); if (gateActive()) s.push(bossGate); return s; }

function particle(type,x,y,vx,vy,w,h,life,color,rot=0) { particles.push({type,x,y,vx,vy,width:w,height:h,life,maxLife:life,color,rot}); }
function burst(x,y,color,count=18,speed=2.2) {
  for (let i=0;i<count;i++) { const a = Math.PI*2*i/count; particle("dash",x,y,Math.cos(a)*(1+Math.random()*speed),Math.sin(a)*(1+Math.random()*speed),10+Math.random()*16,2+Math.random()*3,18+Math.random()*14,color,a); }
}

function dash() {
  if (player.healTimer > 0 || player.dashCooldown > 0 || player.isDashing) return;
  player.isDashing = true; player.dashTimer = player.dashDuration; player.dashCooldown = player.dashCooldownMax; player.vy = 0;
  for (let i=0;i<14;i++) particle("dash",cx(player)-player.facing*(8+Math.random()*20),player.y+12+Math.random()*28,-player.facing*(1.5+Math.random()*3),(Math.random()-.5)*.8,18+Math.random()*24,3+Math.random()*4,18+Math.random()*8,"rgba(125,211,252,1)");
}
function jump() {
  if (player.healTimer > 0) return;
  if (player.onGround) {
    player.vy = player.jumpPower; player.onGround = false;
    if (player.hasDoubleJump) { player.canDoubleJump = true; player.doubleJumpUsed = false; }
    for (let i=0;i<10;i++) particle("dust",cx(player),player.y+player.height+2,(Math.random()-.5)*3,-.4+Math.random()*.6,12,3,22,"rgba(148,163,184,1)");
    return;
  }
  if (player.hasDoubleJump && player.canDoubleJump && !player.doubleJumpUsed) {
    player.vy = player.jumpPower * .92; player.canDoubleJump = false; player.doubleJumpUsed = true;
    game.message = "이중 점프를 사용했습니다."; burst(cx(player),cy(player),"rgba(196,181,253,1)",18,1.8); shake(4,2);
  }
}
function attack() {
  if (player.healTimer > 0 || player.attackCooldown > 0) return;
  player.attackTimer = player.attackDuration; player.attackCooldown = player.attackCooldownMax; player.attackId++;
  game.message = "공격했습니다."; const b = attackBox(); burst(cx(b),cy(b),"rgba(248,113,113,1)",10,2.4);
}
function heal() {
  if (player.healTimer > 0) return;
  if (!player.onGround) { game.message = "회복은 땅 위에서만 할 수 있습니다."; return; }
  if (player.health >= player.maxHealth) { game.message = "이미 체력이 가득 차 있습니다."; return; }
  if (player.coreEnergy < player.healCost) { game.message = "코어 에너지가 부족합니다."; return; }
  player.coreEnergy -= player.healCost; player.healTimer = player.healDuration; player.healingWillRestore = true; player.vx = 0;
  game.message = "코어 에너지로 회복 중입니다. 맞으면 끊깁니다.";
}
function attackBox() { return { x: player.facing===1 ? player.x+player.width-3 : player.x-49, y: player.y+6, width:52, height:38 }; }
function gainEnergy(n) { player.coreEnergy = clamp(player.coreEnergy+n,0,player.maxCoreEnergy); }

function updatePlayer() {
  if (player.dashCooldown > 0) player.dashCooldown--;
  if (player.isDashing) { player.vx = player.facing * player.dashSpeed; player.dashTimer--; if (player.dashTimer <= 0) player.isDashing = false; }

  if (game.ending) { player.vx = 0; player.vy = 0; return; }
  if (player.healTimer > 0) player.vx *= .6;
  else {
    let moving = false;
    if (keys.KeyA) { player.vx -= player.acceleration; player.facing = -1; moving = true; }
    if (keys.KeyD) { player.vx += player.acceleration; player.facing = 1; moving = true; }
    if (!moving && !player.isDashing) player.vx *= player.friction;
  }
  if (!player.isDashing) player.vx = clamp(player.vx,-player.speed,player.speed);
  if (Math.abs(player.vx) < .05) player.vx = 0;
  if (!player.isDashing) player.vy += gravity;

  const wasGround = player.onGround, oldVy = player.vy;
  moveX(player); moveY(player, wasGround, oldVy); checkItems();
  if (player.y > world.height) resetPlayer("낭떠러지에서 떨어져 시작 지점으로 돌아왔습니다.");
}
function moveX(o) {
  o.x += o.vx;
  if (o === player) {
    for (const s of solidObjects()) {
      if (!hit(player,s)) continue;
      if (s.locked && !s.open) {
        if (s.requiresMemoryCores) { if (game.memoryCores >= s.requiresMemoryCores) { s.open = true; game.message = "기억 핵이 반응하여 최종 문이 열렸습니다."; shake(12,4); continue; } else game.message = "최종 문입니다. 기억 핵 1개가 필요합니다."; }
        else if (s.requiresMemoryFragments) { if (game.memoryFragments >= s.requiresMemoryFragments) { s.open = true; game.message = "기억 조각이 반응하여 기억의 문이 열렸습니다."; shake(10,3); continue; } else game.message = "기억의 문입니다. 기억 조각 1개가 필요합니다."; }
        else if (game.hasKey) { s.open = true; game.message = "잠긴 문이 열렸습니다."; continue; }
        else game.message = "잠긴 문입니다. 열쇠가 필요합니다.";
      }
      if (s.text === "보스전 봉인") game.message = "보스를 쓰러뜨리기 전에는 보스방을 나갈 수 없습니다.";
      if (player.vx > 0) player.x = s.x-player.width; else if (player.vx < 0) player.x = s.x+s.width;
      player.vx = 0; player.isDashing = false;
    }
    player.x = clamp(player.x,0,world.width-player.width);
  }
}
function moveY(o, wasGround, oldVy) {
  o.y += o.vy; if (o === player) player.onGround = false;
  for (const s of solidObjects()) {
    if (!hit(o,s)) continue;
    if (o.vy > 0) {
      o.y = s.y-o.height; o.vy = 0;
      if (o === player) { player.onGround = true; if (player.hasDoubleJump) { player.canDoubleJump = true; player.doubleJumpUsed = false; } if (!wasGround && oldVy > 4) for (let i=0;i<12;i++) particle("dust",cx(player),player.y+player.height+2,(Math.random()-.5)*4,-.4-Math.random()*.6,14,3,25,"rgba(148,163,184,1)"); }
    } else if (o.vy < 0) { o.y = s.y+s.height; o.vy = 0; }
  }
}
function checkItems() {
  if (!keyItem.collected && hit(player,keyItem)) { keyItem.collected = true; game.hasKey = true; game.message = "열쇠를 획득했습니다."; burst(cx(keyItem),cy(keyItem),"rgba(250,204,21,1)"); }
  if (!abilityItem.collected && hit(player,abilityItem)) { abilityItem.collected = true; player.hasDoubleJump = true; player.canDoubleJump = true; game.message = "능력 획득: 이중 점프."; burst(cx(abilityItem),cy(abilityItem),"rgba(196,181,253,1)",28,2.2); }
  for (const r of rewards) {
    if (r.collected || (r.requiresBossDefeated && !game.bossDefeated) || !hit(player,r)) continue;
    r.collected = true;
    if (r.type === "memoryFragment") { game.memoryFragments++; game.message = "기억 조각을 획득했습니다."; burst(cx(r),cy(r),"rgba(251,191,36,1)"); }
    if (r.type === "memoryCore") { game.memoryCores++; game.message = "기억 핵을 획득했습니다."; burst(cx(r),cy(r),"rgba(216,180,254,1)",28,2.5); }
    if (r.type === "originCore") { game.originCores++; game.ending = true; game.endingFrame = 0; game.endingInput = false; game.message = "원점 코어를 획득했습니다."; burst(cx(r),cy(r),"rgba(125,211,252,1)",36,3); shake(18,6); }
  }
}
function resetPlayer(msg) { Object.assign(player,{x:playerStart.x,y:playerStart.y,vx:0,vy:0,health:player.maxHealth,invincibleTimer:90,isDashing:false,attackTimer:0,healTimer:0,healingWillRestore:false}); player.canDoubleJump = player.hasDoubleJump; game.bossRoomLocked = false; game.message = msg; }

function updateCombat() {
  if (player.attackTimer > 0) player.attackTimer--; if (player.attackCooldown > 0) player.attackCooldown--; if (player.invincibleTimer > 0) player.invincibleTimer--;
  if (player.healTimer > 0) { player.healTimer--; if (frame%4===0) particle("dash",cx(player)+(Math.random()-.5)*20,player.y+player.height-4,(Math.random()-.5)*.6,-1.2-Math.random(),9,3,20,"rgba(134,239,172,1)"); if (player.healTimer <= 0 && player.healingWillRestore) { player.health = clamp(player.health+1,0,player.maxHealth); player.healingWillRestore = false; game.message = "체력을 1 회복했습니다."; burst(cx(player),cy(player),"rgba(134,239,172,1)",20,1.5); } }
  if (player.attackTimer > 0) checkAttackHits();
}
function checkAttackHits() {
  const b = attackBox();
  for (const e of enemies) {
    if (!e.alive || e.hitByAttackId === player.attackId || !hit(b,e)) continue;
    e.hitByAttackId = player.attackId; e.health--; e.hitTimer = 18; e.x = clamp(e.x + player.facing*14,e.minX,e.maxX-e.width); gainEnergy(1); burst(cx(e),cy(e),"rgba(248,113,113,1)",12,2.5); freeze(4); shake(7,4);
    if (e.health <= 0) { e.alive = false; game.message = e.name + "를 쓰러뜨렸습니다."; } else game.message = e.name + "에게 공격이 맞았습니다.";
  }
  if (boss.alive && hit(b,boss)) damageBoss(player.facing);
}
function damagePlayer(src,msg) { if (player.invincibleTimer > 0) return; if (player.healTimer > 0) { player.healTimer = 0; player.healingWillRestore = false; } player.health--; player.invincibleTimer = 75; const dir = cx(player)<cx(src)?-1:1; player.vx = dir*7; player.vy = -7; player.facing = -dir; player.isDashing = false; burst(cx(player),cy(player),"rgba(248,113,113,1)",12,2.4); freeze(4); shake(10,6); if (player.health <= 0) resetPlayer("체력이 모두 줄어 시작 지점에서 다시 시작합니다."); else game.message = msg; }

function updateEnemies() {
  for (const e of enemies) {
    if (!e.alive) continue; if (e.hitTimer > 0) e.hitTimer--;
    if (e.type === "flying") updateFlying(e); else if (e.type === "shooter") updateShooter(e); else updateMelee(e);
  }
  checkEnemyDamage();
}
function updateMelee(e) {
  if (e.attackCooldown > 0) e.attackCooldown--; if (e.attackTimer > 0) { e.attackTimer--; e.vx = 0; return; }
  const dx = cx(player)-cx(e), dy = cy(player)-cy(e);
  if (Math.abs(dx)<78 && Math.abs(dy)<48 && e.attackCooldown<=0) { e.attackTimer=42; e.attackCooldown=100; e.attackHit=false; e.attackDirection=dx>=0?1:-1; game.message=e.name+"가 공격을 준비합니다."; return; }
  if (Math.abs(dx)<420 && Math.abs(dy)<160) { e.vx = Math.sign(dx||1)*e.speed; e.patrol = Math.sign(dx||1); } else e.vx = e.patrol*e.speed*.7;
  moveEnemyX(e);
}
function updateFlying(e) { const dx=cx(player)-cx(e), dy=cy(player)-cy(e); e.float += .05; if (Math.abs(dx)<520&&Math.abs(dy)<260) { e.vx=Math.sign(dx||1)*e.speed; e.vy=Math.sign(dy||1)*e.verticalSpeed; } else { e.vx=e.patrol*e.speed*.75; e.vy=Math.sin(e.float)*.7; } e.x+=e.vx; e.y+=e.vy; if(e.x<e.minX){e.x=e.minX;e.patrol=1;} if(e.x+e.width>e.maxX){e.x=e.maxX-e.width;e.patrol=-1;} e.y=clamp(e.y,e.minY,e.maxY-e.height); }
function updateShooter(e) { const dx=cx(player)-cx(e), dy=cy(player)-cy(e); e.shootDirection=dx>=0?1:-1; if(e.shootCooldown>0)e.shootCooldown--; if(e.shootTimer>0){const elapsed=40-e.shootTimer; e.shootTimer--; if(!e.shootFired&&elapsed>=24){projectiles.push({type:"enemyBullet",x:e.shootDirection===1?e.x+e.width:e.x-18,y:cy(e)-4,width:18,height:8,vx:e.shootDirection*4.6,vy:0,life:150}); e.shootFired=true; shake(5,2);} if(e.shootTimer<=0){e.shootCooldown=120;e.shootFired=false;} return;} if(Math.abs(dx)<520&&Math.abs(dy)<130&&e.shootCooldown<=0){e.shootTimer=40;e.shootFired=false;game.message=e.name+"가 원거리 공격을 준비합니다.";return;} e.vx=e.patrol*e.speed*.7; moveEnemyX(e); }
function moveEnemyX(e) { e.x += e.vx; if(e.x<e.minX){e.x=e.minX;e.patrol=1;} if(e.x+e.width>e.maxX){e.x=e.maxX-e.width;e.patrol=-1;} for(const s of solidObjects()){ if(!hit(e,s))continue; if(e.vx>0){e.x=s.x-e.width;e.patrol=-1;} else if(e.vx<0){e.x=s.x+s.width;e.patrol=1;} e.vx=0; } }
function enemyAttackBox(e) { return { x:e.attackDirection===1?e.x+e.width-2:e.x-52, y:e.y+2, width:54, height:34 }; }
function checkEnemyDamage() { if(player.invincibleTimer>0)return; for(const e of enemies){ if(!e.alive)continue; if(e.type==="melee"&&e.attackTimer>0){const elapsed=42-e.attackTimer; if(elapsed>=18&&elapsed<=30&&!e.attackHit&&hit(player,enemyAttackBox(e))){e.attackHit=true;damagePlayer(e,e.name+"의 공격에 맞았습니다.");return;} continue;} if(player.isDashing)continue; const box=e.type==="flying"?{x:e.x-6,y:e.y-8,width:e.width+12,height:e.height+18}:e; if(hit(player,box)){damagePlayer(e,e.name+"와 부딪혀 체력이 1 감소했습니다.");return;} } if(boss.alive&&player.x>5400&&boss.contactCooldown<=0&&!player.isDashing&&hit(player,boss)){boss.contactCooldown=45;damagePlayer(boss,"기억 파수자와 충돌했습니다.");} }

function startBossFight() { if(player.x<=5460)return; if(!boss.alive||game.bossDefeated){game.bossRoomLocked=false;return;} if(!game.bossFightStarted){game.bossFightStarted=true;game.bossRoomLocked=true;boss.patternIndex=0;boss.attackCooldown=15;game.message="보스방이 봉인되었습니다. 곧 기억 파편이 떨어집니다.";burst(cx(boss),cy(boss),"rgba(251,113,133,1)",40,3);shake(18,5);return;} if(!game.bossRoomLocked){game.bossRoomLocked=true;game.message="보스방이 다시 봉인되었습니다.";shake(10,3);} }
function updateBoss() { if(!boss.alive||player.x<=5400)return; if(boss.hitTimer>0)boss.hitTimer--; if(boss.contactCooldown>0)boss.contactCooldown--; if(boss.attackCooldown>0)boss.attackCooldown--; if(phase2()&&!boss.phaseAnnounced){boss.phaseAnnounced=true;game.phaseBannerTimer=120;game.message="기억 파수자가 2페이즈에 돌입했습니다.";shake(24,8);} boss.speed=phase2()?1.75:1.25; boss.attackCooldownMax=phase2()?66:88; const dx=cx(player)-cx(boss); boss.facing=dx>=0?1:-1; if(boss.attackTimer>0){ if(boss.attackType==="shardRain")updateShardRain(); else if(boss.attackType==="shockwave")updateShockwave(); else if(boss.attackType==="jumpSlam")updateJumpSlam(); return;} boss.y=boss.baseY; if(Math.abs(dx)<700&&boss.attackCooldown<=0){chooseBossPattern();boss.patternIndex++;return;} if(Math.abs(dx)>80)boss.vx=boss.facing*boss.speed; else boss.vx*=.8; boss.x=clamp(boss.x+boss.vx,boss.minX,boss.maxX-boss.width); }
function chooseBossPattern() { const order = phase2() ? ["shardRain","jumpSlam","shardRain","shockwave","shardRain"] : ["shardRain","shockwave","jumpSlam","shardRain","shockwave"]; startBossPattern(order[boss.patternIndex % order.length]); }
function startBossPattern(type) { boss.attackType=type; boss.attackFired=false; boss.slamHit=false; boss.vx=0; boss.y=boss.baseY; if(type==="shardRain"){boss.attackDuration=phase2()?105:125;boss.attackTimer=boss.attackDuration;game.message=phase2()?"2페이즈: 기억 파편이 빠르게 쏟아집니다.":"기억 파편 낙하가 시작됩니다. 바닥의 파란 표식을 피하세요.";shake(8,3);spawnShardWarning(cx(player)+(Math.random()-.5)*120,42);spawnShardWarning(5550+Math.random()*550,52);return;} if(type==="shockwave"){boss.attackDuration=phase2()?44:54;boss.attackTimer=boss.attackDuration;game.message=phase2()?"2페이즈: 빠른 충격파를 준비합니다.":"기억 파수자가 바닥 충격파를 준비합니다.";return;} if(type==="jumpSlam"){boss.attackDuration=phase2()?74:86;boss.attackTimer=boss.attackDuration;boss.startX=boss.x;boss.targetX=clamp(cx(player)-boss.width/2,boss.minX,boss.maxX-boss.width);game.message=phase2()?"2페이즈: 빠른 점프 내려찍기입니다.":"기억 파수자가 점프 내려찍기를 준비합니다.";} }
function updateShardRain() { const elapsed=boss.attackDuration-boss.attackTimer, interval=phase2()?8:11; if(elapsed>10&&elapsed<boss.attackDuration-10&&elapsed%interval===0){const x=Math.random()<.7?cx(player)+(Math.random()-.5)*190:5480+Math.random()*690;spawnShardWarning(x,phase2()?34:42);} boss.attackTimer--; if(boss.attackTimer<=0)finishBossAttack(); }
function spawnShardWarning(x,delay) { shardWarnings.push({x:clamp(x,5460,6215),y:420,timer:delay,maxTimer:delay}); }
function updateShardWarnings() { for(let i=shardWarnings.length-1;i>=0;i--){const w=shardWarnings[i]; w.timer--; if(w.timer<=0){projectiles.push({type:"memoryShard",x:w.x-10,y:130,width:20,height:28,vx:0,vy:phase2()?6.2:5.0,life:90});burst(w.x,150,"rgba(125,211,252,1)",6,1.2);shardWarnings.splice(i,1);} } }
function updateShockwave() { const elapsed=boss.attackDuration-boss.attackTimer, fireFrame=phase2()?22:28; if(!boss.attackFired&&elapsed>=fireFrame){boss.attackFired=true;const sp=phase2()?5.1:4.1; projectiles.push({type:"bossWave",x:boss.x-26,y:boss.baseY+boss.height-18,width:30,height:16,vx:-sp,vy:0,life:120}); projectiles.push({type:"bossWave",x:boss.x+boss.width-4,y:boss.baseY+boss.height-18,width:30,height:16,vx:sp,vy:0,life:120}); burst(cx(boss),boss.baseY+boss.height-4,"rgba(251,113,133,1)",30,3); game.message="기억 파수자가 충격파를 방출했습니다."; shake(16,6);} boss.attackTimer--; if(boss.attackTimer<=0)finishBossAttack(); }
function updateJumpSlam() { const elapsed=boss.attackDuration-boss.attackTimer, prep=phase2()?14:18, flight=phase2()?52:62; if(elapsed<prep){boss.x=boss.startX;boss.y=boss.baseY;} else if(elapsed<flight){const t=(elapsed-prep)/(flight-prep);boss.x=boss.startX+(boss.targetX-boss.startX)*t;boss.y=boss.baseY-Math.sin(t*Math.PI)*160;} else {boss.x=boss.targetX;boss.y=boss.baseY; if(!boss.slamHit){boss.slamHit=true;const slam={x:boss.x-35,y:boss.baseY+boss.height-38,width:boss.width+70,height:44}; if(!player.isDashing&&hit(player,slam))damagePlayer(boss,"보스의 내려찍기에 맞았습니다."); const sp=phase2()?5.1:4.1; projectiles.push({type:"bossWave",x:boss.x-26,y:boss.baseY+boss.height-18,width:30,height:16,vx:-sp,vy:0,life:110}); projectiles.push({type:"bossWave",x:boss.x+boss.width-4,y:boss.baseY+boss.height-18,width:30,height:16,vx:sp,vy:0,life:110}); shake(18,7); game.message="기억 파수자가 착지하며 충격파를 일으켰습니다.";} } boss.attackTimer--; if(boss.attackTimer<=0)finishBossAttack(); }
function finishBossAttack(){boss.attackType="none";boss.attackFired=false;boss.slamHit=false;boss.attackCooldown=boss.attackCooldownMax;boss.y=boss.baseY;}
function damageBoss(dir){ if(!boss.alive||boss.hitByAttackId===player.attackId)return; boss.hitByAttackId=player.attackId;boss.health--;boss.hitTimer=18;boss.x=clamp(boss.x+dir*8,boss.minX,boss.maxX-boss.width);gainEnergy(1);burst(cx(boss),cy(boss),"rgba(248,113,113,1)",16,2.5);freeze(6);shake(9,5); if(boss.health<=0){boss.alive=false;game.bossDefeated=true;game.bossRoomLocked=false;game.bossClearEffectTimer=130;game.message="기억 파수자를 쓰러뜨렸습니다. 원점 코어가 드러났습니다.";burst(cx(boss),cy(boss),"rgba(125,211,252,1)",64,3.4);shake(24,8);} else if(phase2())game.message="2페이즈입니다. 기억 파편이 더 자주 떨어집니다."; else game.message="기억 파수자에게 공격이 맞았습니다."; }

function updateProjectiles(){ for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i]; p.x+=p.vx;p.y+=p.vy;p.life--;let remove=p.life<=0||p.x<-100||p.x>world.width+100||p.y>460; if(p.type!=="memoryShard") for(const s of solidObjects()) if(hit(p,s)){remove=true;break;} if(remove){ if(p.type==="memoryShard")burst(cx(p),420,"rgba(125,211,252,1)",8,1.4); projectiles.splice(i,1); } } }
function checkProjectileDamage(){ if(player.invincibleTimer>0)return; for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i]; if(!hit(player,p))continue; projectiles.splice(i,1); if(p.type==="bossWave")damagePlayer(p,"보스의 충격파에 맞았습니다."); else if(p.type==="memoryShard")damagePlayer(p,"떨어지는 기억 파편에 맞았습니다."); else damagePlayer(p,"원거리 투사체에 맞았습니다."); return;} }
function updateParticles(){ for(let i=particles.length-1;i>=0;i--){const p=particles[i]; p.x+=p.vx;p.y+=p.vy;if(p.type==="dust")p.vy+=.025;p.life--;if(p.life<=0)particles.splice(i,1);} }
function updateCamera(){ camera.x=clamp(cx(player)-canvas.width/2,0,world.width-canvas.width); camera.y=clamp(cy(player)-canvas.height/2,0,world.height-canvas.height); if(shakeTimer>0){shakeTimer--;camera.sx=(Math.random()-.5)*shakePower*(shakeTimer/20);camera.sy=(Math.random()-.5)*shakePower*(shakeTimer/20);} else {camera.sx=0;camera.sy=0;shakePower=0;} }

function update(){ frame++; if(hitStop>0){hitStop--;updateParticles();updateCamera();return;} if(game.bossClearEffectTimer>0)game.bossClearEffectTimer--; if(game.phaseBannerTimer>0)game.phaseBannerTimer--; if(game.ending){game.endingFrame++;player.vx=0;player.vy=0; if(game.endingFrame>=760)game.endingInput=true; updateCamera(); return;} updatePlayer(); startBossFight(); playerAnim.state=getPlayerState(); playerAnim.frame++; updateCombat(); updateEnemies(); updateBoss(); updateShardWarnings(); updateProjectiles(); checkProjectileDamage(); updateParticles(); updateCamera(); }
function getPlayerState(){ if(player.isDashing)return"dash"; if(player.healTimer>0)return"heal"; if(player.attackTimer>0)return"attack"; if(!player.onGround&&player.vy<0)return"jump"; if(!player.onGround&&player.vy>=0)return"fall"; if(Math.abs(player.vx)>.25)return"walk"; return"idle"; }

function drawRoundedRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(camera.sx,camera.sy);drawWorld();ctx.restore();drawUI();drawPhaseBanner();drawEndingPanel();}
function drawWorld(){drawBackground();drawBossRoomDeco();drawRoomLabels();drawDoors();drawBossGate();drawPlatforms();drawItems();drawEnemies();drawBoss();drawEnemyWarnings();drawBossWarnings();drawShardWarnings();drawProjectiles();drawParticles();drawPlayer();drawAttack();drawBossClearEffect();}
function drawBackground(){for(const r of rooms){ctx.fillStyle=r.color;ctx.fillRect(r.x-camera.x,-camera.y,r.width,world.height);ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=2;ctx.strokeRect(r.x-camera.x,-camera.y,r.width,world.height);} for(let x=0;x<world.width;x+=120){ctx.fillStyle="rgba(255,255,255,.035)";ctx.fillRect(x-camera.x,-camera.y,2,world.height);}}
function drawBossRoomDeco(){ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle="#7dd3fc";ctx.lineWidth=2;for(let x=5480;x<=6200;x+=120){ctx.beginPath();ctx.moveTo(x-camera.x,80-camera.y);ctx.lineTo(x+35-camera.x,390-camera.y);ctx.stroke();}ctx.restore();}
function drawRoomLabels(){for(const r of rooms){ctx.fillStyle="rgba(255,255,255,.85)";ctx.font="22px Arial";ctx.fillText(r.name,r.x+35-camera.x,90-camera.y);ctx.fillStyle="rgba(203,213,225,.85)";ctx.font="15px Arial";ctx.fillText(r.guide,r.x+35-camera.x,118-camera.y);}}
function drawPlatforms(){for(const p of platforms){const x=p.x-camera.x,y=p.y-camera.y;if(p.requiresDoubleJump){ctx.fillStyle=player.hasDoubleJump?"#4c1d95":"rgba(76,29,149,.42)";ctx.fillRect(x,y,p.width,p.height);ctx.fillStyle=player.hasDoubleJump?"#a78bfa":"rgba(167,139,250,.45)";ctx.fillRect(x,y,p.width,5);ctx.strokeStyle="rgba(216,180,254,.75)";ctx.strokeRect(x,y,p.width,p.height);}else{ctx.fillStyle="#475569";ctx.fillRect(x,y,p.width,p.height);ctx.fillStyle="#64748b";ctx.fillRect(x,y,p.width,5);}}}
function drawDoors(){for(const d of doors){const x=d.x-camera.x,y=d.y-camera.y;if(d.locked&&!d.open){ctx.fillStyle=d.requiresMemoryCores?"rgba(14,116,144,.58)":d.requiresMemoryFragments?"rgba(126,34,206,.58)":"rgba(248,113,113,.55)";ctx.fillRect(x,y,d.width,d.height);ctx.strokeStyle=d.requiresMemoryCores?"#e0f2fe":d.requiresMemoryFragments?"#fef3c7":"#fecaca";ctx.lineWidth=3;ctx.strokeRect(x,y,d.width,d.height);ctx.fillStyle=ctx.strokeStyle;ctx.font="13px Arial";ctx.fillText(d.requiresMemoryCores?"기억 핵 1개 필요":d.requiresMemoryFragments?"기억 조각 1개 필요":d.text,x-42,y-8);}else{ctx.fillStyle=d.locked?"rgba(34,197,94,.28)":"rgba(56,189,248,.22)";ctx.fillRect(x,y,d.width,d.height);ctx.strokeStyle=d.locked?"#86efac":"#38bdf8";ctx.lineWidth=2;ctx.strokeRect(x,y,d.width,d.height);ctx.fillStyle="#e0f2fe";ctx.font="13px Arial";ctx.fillText(d.locked?"열린 문":d.text,x-3,y-8);}}}
function drawBossGate(){if(!gateActive())return;const x=bossGate.x-camera.x,y=bossGate.y-camera.y,p=.55+Math.sin(frame*.15)*.12;ctx.save();ctx.globalAlpha=p;ctx.fillStyle="#7f1d1d";ctx.fillRect(x,y,bossGate.width,bossGate.height);ctx.globalAlpha=1;ctx.strokeStyle="#fecdd3";ctx.lineWidth=3;ctx.strokeRect(x,y,bossGate.width,bossGate.height);ctx.fillStyle="#fecdd3";ctx.font="13px Arial";ctx.fillText("봉인",x-2,y-8);ctx.restore();}
function drawItems(){if(!keyItem.collected){const x=keyItem.x-camera.x,y=keyItem.y-camera.y;ctx.fillStyle="#facc15";ctx.fillRect(x,y+8,18,8);ctx.fillRect(x+14,y+4,8,16);ctx.fillRect(x+20,y+10,5,5);ctx.fillStyle="#fef08a";ctx.font="13px Arial";ctx.fillText("열쇠",x-4,y-8);} if(!abilityItem.collected)glowBox(abilityItem,"#312e81","#c4b5fd","이중 점프"); for(const r of rewards){if(r.collected||(r.requiresBossDefeated&&!game.bossDefeated))continue;glowBox(r,r.type==="memoryFragment"?"#78350f":r.type==="memoryCore"?"#581c87":"#0c4a6e",r.type==="memoryFragment"?"#fde68a":r.type==="memoryCore"?"#e9d5ff":"#e0f2fe",r.name);}}
function glowBox(o,fill,stroke,text){const x=o.x-camera.x,y=o.y-camera.y,p=Math.sin(frame*.12)*3;ctx.save();ctx.globalAlpha=.25;ctx.fillStyle=stroke;ctx.beginPath();ctx.arc(x+o.width/2,y+o.height/2,22+p,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=2;drawRoundedRect(x,y,o.width,o.height,7);ctx.fill();ctx.stroke();ctx.fillStyle=stroke;ctx.beginPath();ctx.arc(x+o.width/2,y+o.height/2,5,0,Math.PI*2);ctx.fill();ctx.font="13px Arial";ctx.fillText(text,x-14,y-10);ctx.restore();}
function drawEnemies(){for(const e of enemies){if(!e.alive)continue;const x=e.x-camera.x,y=e.y-camera.y;ctx.save();if(e.hitTimer>0){ctx.translate(Math.sin(e.hitTimer*2)*2,0);ctx.globalAlpha=.7;}ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(x+e.width/2,y+e.height+4,e.width/2,5,0,0,Math.PI*2);ctx.fill();if(e.type==="flying")drawFlying(e,x,y);else if(e.type==="shooter")drawShooter(e,x,y);else drawMelee(e,x,y);ctx.fillStyle="rgba(15,23,42,.85)";ctx.fillRect(x-1,y-13,38,5);ctx.fillStyle="#f87171";ctx.fillRect(x-1,y-13,38*(e.health/e.maxHealth),5);ctx.restore();}}
function drawMelee(e,x,y){ctx.fillStyle=e.attackTimer>0?"#3b1d1d":"#1f2937";ctx.strokeStyle=e.attackTimer>0?"#fca5a5":"#94a3b8";ctx.lineWidth=e.attackTimer>0?3:2;ctx.beginPath();ctx.ellipse(x+e.width/2,y+e.height/2,e.width/2,e.height/2,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=e.attackTimer>0?"#fecaca":"#38bdf8";const right=e.attackTimer>0?e.attackDirection===1:e.vx>=0;if(right){ctx.fillRect(x+20,y+12,4,6);ctx.fillRect(x+27,y+12,4,6);}else{ctx.fillRect(x+4,y+12,4,6);ctx.fillRect(x+11,y+12,4,6);}}
function drawFlying(e,x,y){const w=Math.sin(frame*.35)*6;ctx.fillStyle="#1e1b4b";ctx.strokeStyle="#c4b5fd";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+8,y+14);ctx.quadraticCurveTo(x-10,y+2+w,x-2,y+24);ctx.quadraticCurveTo(x+8,y+20,x+12,y+16);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x+e.width-8,y+14);ctx.quadraticCurveTo(x+e.width+10,y+2+w,x+e.width+2,y+24);ctx.quadraticCurveTo(x+e.width-8,y+20,x+e.width-12,y+16);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(x+e.width/2,y+e.height/2,e.width/2,e.height/2,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#fef08a";ctx.fillRect(x+11,y+11,4,5);ctx.fillRect(x+23,y+11,4,5);}
function drawShooter(e,x,y){ctx.fillStyle=e.shootTimer>0?"#3b1d1d":"#10251f";ctx.strokeStyle=e.shootTimer>0?"#fca5a5":"#86efac";ctx.lineWidth=e.shootTimer>0?3:2;drawRoundedRect(x+5,y+2,26,38,8);ctx.fill();ctx.stroke();ctx.fillStyle=e.shootTimer>0?"#fecaca":"#bbf7d0";ctx.beginPath();ctx.arc(x+18,y+18,e.shootTimer>0?7:5,0,Math.PI*2);ctx.fill();}
function drawEnemyWarnings(){for(const e of enemies){if(!e.alive)continue;if(e.type==="melee"&&e.attackTimer>0){const b=enemyAttackBox(e),active=42-e.attackTimer>=18&&42-e.attackTimer<=30;ctx.save();ctx.globalAlpha=active?.42:.24;ctx.fillStyle="#ef4444";drawRoundedRect(b.x-camera.x,b.y-camera.y,b.width,b.height,12);ctx.fill();ctx.restore();} if(e.type==="shooter"&&e.shootTimer>0){const sx=e.shootDirection===1?e.x+e.width:e.x,sy=cy(e);ctx.save();ctx.globalAlpha=.25+Math.sin(frame*.35)*.08;ctx.strokeStyle="#ef4444";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(sx-camera.x,sy-camera.y);ctx.lineTo(sx+e.shootDirection*180-camera.x,sy-camera.y);ctx.stroke();ctx.restore();}}}
function drawBoss(){if(!boss.alive)return;const x=boss.x-camera.x,y=boss.y-camera.y,p2=phase2(),pulse=Math.sin(frame*.08)*3;ctx.save();if(boss.hitTimer>0){ctx.translate(Math.sin(boss.hitTimer*2.5)*3,0);ctx.globalAlpha=.75;}ctx.fillStyle="rgba(0,0,0,.42)";ctx.beginPath();ctx.ellipse(x+boss.width/2,boss.baseY-camera.y+boss.height+6,boss.width/2,8,0,0,Math.PI*2);ctx.fill();if(boss.attackTimer>0){ctx.globalAlpha=.25;ctx.fillStyle=boss.attackType==="shardRain"?"#7dd3fc":boss.attackType==="jumpSlam"?"#facc15":"#fb7185";ctx.beginPath();ctx.arc(x+boss.width/2,y+boss.height/2,58+pulse,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}ctx.fillStyle=p2?"#4c0519":"#1e1b4b";ctx.strokeStyle=boss.attackTimer>0?"#fb7185":p2?"#fecdd3":"#c4b5fd";ctx.lineWidth=boss.attackTimer>0?4:3;drawRoundedRect(x+10,y+12,52,56,16);ctx.fill();ctx.stroke();ctx.fillStyle=p2?"#881337":"#312e81";ctx.strokeStyle="#e9d5ff";ctx.lineWidth=2;drawRoundedRect(x+14,y+2,44,32,12);ctx.fill();ctx.stroke();ctx.strokeStyle=p2?"#fecdd3":"#e9d5ff";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+19,y+7);ctx.quadraticCurveTo(x+8,y-12,x+4,y-24);ctx.moveTo(x+53,y+7);ctx.quadraticCurveTo(x+64,y-12,x+68,y-24);ctx.stroke();ctx.fillStyle="#fef3c7";if(boss.facing===1){ctx.fillRect(x+35,y+16,5,8);ctx.fillRect(x+47,y+16,5,8);}else{ctx.fillRect(x+20,y+16,5,8);ctx.fillRect(x+32,y+16,5,8);}ctx.strokeStyle=p2?"#fda4af":"#7dd3fc";ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+36,y+43,9+pulse*.3,0,Math.PI*2);ctx.stroke();ctx.restore();}
function drawBossWarnings(){if(!boss.alive||boss.attackTimer<=0)return;ctx.save();if(boss.attackType==="shardRain"){ctx.globalAlpha=.22+Math.sin(frame*.3)*.08;ctx.fillStyle="#7dd3fc";ctx.fillRect(5450-camera.x,70-camera.y,770,40);ctx.globalAlpha=.95;ctx.fillStyle="#e0f2fe";ctx.font="bold 22px Arial";ctx.fillText("기억 파편 낙하",boss.x-15-camera.x,boss.y-22-camera.y);} if(boss.attackType==="shockwave"){const elapsed=boss.attackDuration-boss.attackTimer,fire=phase2()?22:28;if(elapsed<fire){ctx.globalAlpha=.22+Math.sin(frame*.35)*.08;ctx.fillStyle="#fb7185";ctx.fillRect(boss.x-170-camera.x,boss.baseY+boss.height-18-camera.y,boss.width+340,18);}} if(boss.attackType==="jumpSlam"){ctx.globalAlpha=.25+Math.sin(frame*.4)*.08;ctx.fillStyle="#facc15";drawRoundedRect(boss.targetX-45-camera.x,boss.baseY+boss.height-28-camera.y,boss.width+90,28,10);ctx.fill();ctx.globalAlpha=.9;ctx.strokeStyle="#fde68a";ctx.lineWidth=3;drawRoundedRect(boss.targetX-45-camera.x,boss.baseY+boss.height-28-camera.y,boss.width+90,28,10);ctx.stroke();}ctx.restore();}
function drawShardWarnings(){for(const w of shardWarnings){const x=w.x-camera.x,y=w.y-camera.y,prog=1-w.timer/w.maxTimer;ctx.save();ctx.globalAlpha=.25+prog*.35;ctx.fillStyle="#7dd3fc";ctx.beginPath();ctx.ellipse(x,y,18+prog*12,7+prog*3,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.55+prog*.35;ctx.strokeStyle="#e0f2fe";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,130-camera.y);ctx.lineTo(x,y-5);ctx.stroke();ctx.fillStyle="#e0f2fe";ctx.font="16px Arial";ctx.fillText("!",x-4,120-camera.y);ctx.restore();}}
function drawProjectiles(){for(const p of projectiles){const x=p.x-camera.x,y=p.y-camera.y;ctx.save();if(p.type==="memoryShard"){ctx.fillStyle="rgba(125,211,252,.28)";drawRoundedRect(x-7,y-7,p.width+14,p.height+14,8);ctx.fill();ctx.fillStyle="#7dd3fc";ctx.beginPath();ctx.moveTo(x+p.width/2,y);ctx.lineTo(x+p.width,y+p.height-4);ctx.lineTo(x+p.width/2,y+p.height);ctx.lineTo(x,y+p.height-4);ctx.closePath();ctx.fill();ctx.strokeStyle="#e0f2fe";ctx.lineWidth=2;ctx.stroke();}else if(p.type==="bossWave"){ctx.fillStyle="rgba(251,113,133,.25)";drawRoundedRect(x-8,y-6,p.width+16,p.height+12,10);ctx.fill();ctx.fillStyle="#fb7185";drawRoundedRect(x,y,p.width,p.height,8);ctx.fill();ctx.fillStyle="#fecdd3";drawRoundedRect(x+4,y+4,p.width-8,p.height-8,4);ctx.fill();}else{ctx.fillStyle="rgba(239,68,68,.25)";drawRoundedRect(x-6,y-4,p.width+12,p.height+8,8);ctx.fill();ctx.fillStyle="#fca5a5";drawRoundedRect(x,y,p.width,p.height,5);ctx.fill();}ctx.restore();}}
function drawParticles(){for(const p of particles){const a=p.life/p.maxLife;ctx.save();ctx.globalAlpha=a;ctx.translate(p.x-camera.x,p.y-camera.y);ctx.rotate(p.rot||0);ctx.fillStyle=p.color;if(p.type==="dust"){ctx.beginPath();ctx.ellipse(0,0,p.width,p.height*a,0,0,Math.PI*2);ctx.fill();}else{drawRoundedRect(-p.width/2,-p.height/2,p.width,p.height,p.height/2);ctx.fill();}ctx.restore();}}
function drawAttack(){if(player.attackTimer<=0)return;const b=attackBox(),x=b.x-camera.x,y=b.y-camera.y,prog=1-player.attackTimer/player.attackDuration;ctx.save();ctx.lineCap="round";ctx.globalAlpha=.85;ctx.strokeStyle="#e0f2fe";ctx.lineWidth=5;ctx.beginPath();if(player.facing===1){ctx.moveTo(x+5,y+30);ctx.quadraticCurveTo(x+22+prog*10,y-8,x+b.width-2,y+12+prog*5);}else{ctx.moveTo(x+b.width-5,y+30);ctx.quadraticCurveTo(x+30-prog*10,y-8,x+2,y+12+prog*5);}ctx.stroke();ctx.globalAlpha=.45;ctx.strokeStyle="#38bdf8";ctx.lineWidth=12;ctx.stroke();ctx.restore();}
function drawPlayer(){const x=player.x-camera.x,y=player.y-camera.y,state=playerAnim.state,bob=state==="walk"?Math.sin(frame*.25)*1.7:state==="idle"?Math.sin(frame*.08)*.7:0,lean=state==="dash"?player.facing*4:state==="attack"?player.facing*3:0;if(state==="dash")drawAfterImages(x,y,bob);ctx.save();if(player.invincibleTimer>0&&frame%8<4)ctx.globalAlpha=.45;ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(x+16,y+51,state==="dash"?24:17,5,0,0,Math.PI*2);ctx.fill();if(state==="heal"){ctx.globalAlpha=.18;ctx.fillStyle="#86efac";ctx.beginPath();ctx.arc(x+16,y+25,30+Math.sin(frame*.2)*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}ctx.save();ctx.translate(lean,bob);ctx.fillStyle="#0f172a";ctx.strokeStyle=state==="heal"?"#86efac":"#38bdf8";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+7,y+18);ctx.lineTo(x+25,y+18);ctx.lineTo(x+31,y+44);ctx.lineTo(x+22,y+48);ctx.lineTo(x+16,y+43);ctx.lineTo(x+10,y+48);ctx.lineTo(x+1,y+44);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#1e293b";ctx.beginPath();ctx.moveTo(x+10,y+24);ctx.lineTo(x+22,y+24);ctx.lineTo(x+24,y+42);ctx.lineTo(x+16,y+38);ctx.lineTo(x+8,y+42);ctx.closePath();ctx.fill();ctx.strokeStyle=state==="dash"?"#fef08a":state==="heal"?"#86efac":"#7dd3fc";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+16,y+29,state==="heal"?6:state==="dash"?5:4,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#dbeafe";ctx.lineWidth=3;ctx.beginPath();if(state==="dash"){ctx.moveTo(x+9,y+8);ctx.quadraticCurveTo(x+3-player.facing*4,y,x+2-player.facing*7,y-5);ctx.moveTo(x+23,y+8);ctx.quadraticCurveTo(x+29-player.facing*4,y,x+30-player.facing*7,y-5);}else{ctx.moveTo(x+9,y+8);ctx.quadraticCurveTo(x+4,y,x+2,y-5);ctx.moveTo(x+23,y+8);ctx.quadraticCurveTo(x+28,y,x+30,y-5);}ctx.stroke();ctx.fillStyle="#dbeafe";ctx.strokeStyle=state==="heal"?"#86efac":"#f8fafc";ctx.lineWidth=2;drawRoundedRect(x+5,y+4,22,18,7);ctx.fill();ctx.stroke();ctx.fillStyle=state==="heal"?"#bbf7d0":"#bfdbfe";drawRoundedRect(x+7,y+13,18,7,4);ctx.fill();ctx.fillStyle="#020617";const eo=state==="dash"?player.facing*2:state==="attack"?player.facing:0;if(player.facing===1){ctx.fillRect(x+14+eo,y+11,3,5);ctx.fillRect(x+21+eo,y+11,3,5);}else{ctx.fillRect(x+8+eo,y+11,3,5);ctx.fillRect(x+15+eo,y+11,3,5);}ctx.restore();ctx.restore();}
function drawAfterImages(x,y,bob){ctx.save();for(let i=1;i<=4;i++){ctx.globalAlpha=.22-i*.04;ctx.fillStyle="#7dd3fc";drawRoundedRect(x-player.facing*i*14+4,y+7+bob,24,32,8);ctx.fill();ctx.fillStyle="#e0f2fe";drawRoundedRect(x-player.facing*i*14+8,y+4+bob,16,16,6);ctx.fill();}ctx.restore();}
function drawBossClearEffect(){if(game.bossClearEffectTimer<=0)return;const a=game.bossClearEffectTimer/130;ctx.save();ctx.globalAlpha=a*.26;ctx.fillStyle="#7dd3fc";ctx.fillRect(5400-camera.x,-camera.y,900,world.height);ctx.globalAlpha=a;ctx.fillStyle="#e0f2fe";ctx.font="bold 26px Arial";ctx.fillText("보스방 봉인이 해제되었습니다",5600-camera.x,190-camera.y);ctx.restore();}
function drawUI(){const r=currentRoom();ctx.fillStyle="white";ctx.font="20px Arial";ctx.fillText("10단계-1 수정본: 기억 파편 낙하 가시화",20,35);ctx.font="16px Arial";ctx.fillText("A/D: 이동 | Space: 점프/이중 점프 | Shift/K: 대시 | J: 공격 | L: 회복",20,65);ctx.fillStyle="#bfdbfe";ctx.fillText("현재 방: "+r.name,20,95);ctx.fillStyle="#cbd5e1";ctx.fillText("방 설명: "+r.guide,20,120);ctx.fillStyle="#fef08a";ctx.fillText("캐릭터 상태: "+stateName(playerAnim.state),20,150);ctx.fillStyle=game.hasKey?"#fef08a":"#fecaca";ctx.fillText(game.hasKey?"열쇠: 보유 중":"열쇠: 없음",20,180);ctx.fillStyle=player.dashCooldown<=0?"#bbf7d0":"#fde68a";ctx.fillText(player.dashCooldown<=0?"대시: 사용 가능":"대시 쿨타임: "+Math.ceil(player.dashCooldown/player.dashCooldownMax*100)+"%",20,210);ctx.fillStyle=player.hasDoubleJump?"#c4b5fd":"#cbd5e1";ctx.fillText(player.hasDoubleJump?"능력: 이중 점프 획득":"능력: 없음",20,240);ctx.fillStyle="#fef3c7";ctx.fillText("기억 조각: "+game.memoryFragments+"개",20,270);ctx.fillStyle="#e9d5ff";ctx.fillText("기억 핵: "+game.memoryCores+"개",20,300);ctx.fillStyle="#bae6fd";ctx.fillText("원점 코어: "+game.originCores+"개",20,330);drawHealth();drawEnergy();drawBossHealth();drawMiniMap();ctx.fillStyle="#e2e8f0";ctx.font="15px Arial";ctx.fillText(game.message,20,435);}
function stateName(s){return {idle:"정지",walk:"걷기",jump:"점프",fall:"낙하",dash:"대시",attack:"공격",heal:"회복"}[s]||"알 수 없음";}
function drawHealth(){ctx.fillStyle="#e2e8f0";ctx.font="15px Arial";ctx.fillText("체력",20,360);for(let i=0;i<player.maxHealth;i++){ctx.fillStyle=i<player.health?"#f87171":"rgba(148,163,184,.35)";ctx.beginPath();ctx.arc(65+i*24,347,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fecaca";ctx.stroke();}}
function drawEnergy(){ctx.fillStyle="#e2e8f0";ctx.font="15px Arial";ctx.fillText("코어 에너지",20,390);for(let i=0;i<player.maxCoreEnergy;i++){ctx.fillStyle=i<player.coreEnergy?"#86efac":"rgba(148,163,184,.3)";drawRoundedRect(110+i*18,377,12,12,4);ctx.fill();ctx.strokeStyle="#bbf7d0";ctx.stroke();}ctx.fillStyle="#cbd5e1";ctx.font="13px Arial";ctx.fillText("L 회복: 에너지 3칸 소모",20,412);}
function drawBossHealth(){if(!boss.alive||player.x<5300)return;const x=canvas.width/2-190,y=82,w=380,ratio=boss.health/boss.maxHealth;ctx.save();ctx.fillStyle="rgba(15,23,42,.88)";drawRoundedRect(x-12,y-28,w+24,58,12);ctx.fill();ctx.fillStyle=phase2()?"#fecdd3":"#e9d5ff";ctx.font="bold 16px Arial";ctx.textAlign="center";ctx.fillText(phase2()?"기억 파수자 - 2페이즈":"기억 파수자",canvas.width/2,y-8);ctx.textAlign="left";ctx.fillStyle="rgba(71,85,105,.9)";drawRoundedRect(x,y,w,18,8);ctx.fill();ctx.fillStyle=phase2()?"#f43f5e":"#fb7185";drawRoundedRect(x,y,w*ratio,18,8);ctx.fill();ctx.strokeStyle="#fecdd3";ctx.lineWidth=2;drawRoundedRect(x,y,w,18,8);ctx.stroke();ctx.restore();}
function drawMiniMap(){const x=canvas.width-270,y=25,w=230,h=34;ctx.fillStyle="rgba(15,23,42,.85)";ctx.fillRect(x-10,y-10,w+20,h+38);ctx.fillStyle="#cbd5e1";ctx.font="13px Arial";ctx.fillText("방 구조",x,y-16);for(const r of rooms){const rx=x+r.x/world.width*w,rw=r.width/world.width*w;ctx.fillStyle="rgba(148,163,184,.28)";ctx.fillRect(rx,y,rw-2,h);ctx.strokeStyle="rgba(226,232,240,.5)";ctx.strokeRect(rx,y,rw-2,h);}ctx.fillStyle="#7dd3fc";ctx.fillRect(x+player.x/world.width*w-2,y-4,4,h+8);}
function drawPhaseBanner(){if(game.phaseBannerTimer<=0)return;const a=Math.min(1,game.phaseBannerTimer/40);ctx.save();ctx.globalAlpha=a;ctx.fillStyle="rgba(2,6,23,.60)";ctx.fillRect(0,canvas.height/2-55,canvas.width,110);ctx.fillStyle="#fecdd3";ctx.font="bold 34px Arial";ctx.textAlign="center";ctx.fillText("2페이즈 진입",canvas.width/2,canvas.height/2-8);ctx.fillStyle="#e0f2fe";ctx.font="18px Arial";ctx.fillText("기억 파편 낙하 빈도 증가",canvas.width/2,canvas.height/2+28);ctx.textAlign="left";ctx.restore();}
function drawEndingPanel(){if(!game.ending)return;const n=clamp(Math.floor((game.endingFrame-60)/95)+1,0,endingLines.length);ctx.save();ctx.fillStyle="rgba(2,6,23,.86)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=.18+Math.sin(frame*.04)*.05;ctx.fillStyle="#7dd3fc";ctx.beginPath();ctx.arc(canvas.width/2,canvas.height/2-110,95,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.textAlign="center";ctx.fillStyle="#e0f2fe";ctx.font="bold 36px Arial";ctx.fillText("Coreless",canvas.width/2,105);ctx.fillStyle="#bae6fd";ctx.font="17px Arial";ctx.fillText("원점 코어가 반응합니다.",canvas.width/2,142);ctx.fillStyle="#e2e8f0";ctx.font="20px Arial";for(let i=0;i<n;i++)ctx.fillText(endingLines[i],canvas.width/2,210+i*42);ctx.fillStyle=game.endingInput?"#fef3c7":"#94a3b8";ctx.font="18px Arial";ctx.fillText(game.endingInput?"R 키를 누르면 다시 시작합니다.":"엔딩 진행 중"+".".repeat(Math.floor(frame/25)%4),canvas.width/2,canvas.height-65);ctx.textAlign="left";ctx.restore();}

function loop(){update();draw();requestAnimationFrame(loop);} loop();
