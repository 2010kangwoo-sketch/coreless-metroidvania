const canvas = document.getElementById("gameCanvas");

if (!canvas) {
  throw new Error("gameCanvas 요소를 찾을 수 없습니다.");
}

const ctx = canvas.getContext("2d");

if (canvas.width < 900) {
  canvas.width = 900;
}

if (canvas.height < 520) {
  canvas.height = 520;
}

const keys = {};
let frameCount = 0;
let hitStopTimer = 0;
let screenShakeTimer = 0;
let screenShakeMaxTimer = 0;
let screenShakePower = 0;

const particles = [];
const projectiles = [];
const shardWarnings = [];
const floatingTexts = [];

const world = {
  width: 6300,
  height: 900
};

const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  shakeX: 0,
  shakeY: 0,
  bossFocusTimer: 0,
  smoothness: 0.12,
  lookAheadX: 90,
  lookDownY: 45
};

const gravity = 0.65;
const startPosition = { x: 70, y: 300 };

const player = {
  x: startPosition.x,
  y: startPosition.y,
  width: 32,
  height: 48,
  vx: 0,
  vy: 0,

  groundAcceleration: 0.72,
  airAcceleration: 0.42,
  groundFriction: 0.76,
  airFriction: 0.93,
  maxSpeed: 5.8,
  maxAirSpeed: 5.2,

  jumpPower: -13.1,
  onGround: false,
  wasOnGround: false,
  maxFallSpeed: 16,
  fallGravityMultiplier: 1.15,
  jumpCutMultiplier: 0.45,
  jumpBufferTimer: 0,
  jumpBufferMax: 8,
  coyoteTimer: 0,
  coyoteMax: 8,

  hasDoubleJump: false,
  canDoubleJump: false,
  doubleJumpUsed: false,

  // 11단계-3: 벽 미끄러짐과 벽 점프
  hasWallJump: true,
  isWallSliding: false,
  wallDirection: 0,
  wallSlideSpeed: 2.2,
  wallJumpPowerX: 7.6,
  wallJumpPowerY: -12.6,
  wallJumpLockTimer: 0,
  wallJumpLockMax: 12,

  facing: 1,

  isDashing: false,
  dashTimer: 0,
  dashDuration: 10,
  dashSpeed: 12,
  dashCooldown: 0,
  dashCooldownMax: 110,
  dashInvincibleTimer: 0,
  dashInvincibleMax: 8,
  dashEndLagTimer: 0,
  dashEndLagMax: 4,

  attackDirection: "side",
  attackRecoilX: 1.8,
  attackPogoPower: -9.5,
  attackFloatTimer: 0,

  maxHealth: 5,
  health: 5,
  invincibleTimer: 0,

  coreEnergy: 0,
  maxCoreEnergy: 6,
  healCost: 3,
  healTimer: 0,
  healDuration: 55,
  healingWillRestore: false,

  attackTimer: 0,
  attackDuration: 13,
  attackCooldown: 0,
  attackCooldownMax: 22,
  attackId: 0,
  lastWallSparkAttackId: -1
};

const playerAnimation = {
  state: "idle",
  previousState: "idle",
  stateFrame: 0
};

const characterVisuals = {
  idle: { name: "정지", bobSpeed: 0.08, bobAmount: 0.7, bodyTop: 18, leftBottom: 1, rightBottom: 31, centerBottom: 16, headY: 0, coreRadius: 4, coreColor: "#7dd3fc", shadowWidth: 16 },
  walk: { name: "걷기", bobSpeed: 0.25, bobAmount: 1.7, bodyTop: 18, leftBottom: 1, rightBottom: 31, centerBottom: 16, headY: 0, coreRadius: 4, coreColor: "#7dd3fc", shadowWidth: 17 },
  jump: { name: "점프", bobSpeed: 0, bobAmount: 0, bodyTop: 19, leftBottom: 4, rightBottom: 28, centerBottom: 16, headY: -2, coreRadius: 4, coreColor: "#7dd3fc", shadowWidth: 12 },
  fall: { name: "낙하", bobSpeed: 0, bobAmount: 0, bodyTop: 17, leftBottom: -1, rightBottom: 33, centerBottom: 16, headY: 2, coreRadius: 4, coreColor: "#7dd3fc", shadowWidth: 20 },
  wallSlide: { name: "벽 미끄러짐", bobSpeed: 0, bobAmount: 0, bodyTop: 17, leftBottom: 0, rightBottom: 32, centerBottom: 16, headY: 1, coreRadius: 4, coreColor: "#a7f3d0", shadowWidth: 18 },
  dash: { name: "대시", bobSpeed: 0, bobAmount: 0, bodyTop: 17, leftBottom: 1, rightBottom: 31, centerBottom: 16, headY: 0, coreRadius: 5, coreColor: "#fef08a", shadowWidth: 24 },
  attack: { name: "공격", bobSpeed: 0, bobAmount: 0, bodyTop: 18, leftBottom: 2, rightBottom: 30, centerBottom: 16, headY: 0, coreRadius: 5, coreColor: "#e0f2fe", shadowWidth: 19 },
  heal: { name: "회복", bobSpeed: 0.12, bobAmount: 0.5, bodyTop: 18, leftBottom: 2, rightBottom: 30, centerBottom: 16, headY: -1, coreRadius: 6, coreColor: "#86efac", shadowWidth: 18 }
};

const gameState = {
  hasKey: false,
  memoryFragments: 0,
  memoryCores: 0,
  originCores: 0,
  bossFightStarted: false,
  bossRoomLocked: false,
  bossDefeated: false,
  bossClearEffectTimer: 0,
  bossPhaseBannerTimer: 0,
  bossStartBannerTimer: 0,
  endingReached: false,
  endingFrame: 0,
  endingInputUnlocked: false,
  message: "11단계-2+3: 대시, 공격, 벽 점프, 카메라가 개선되었습니다."
};

const endingLines = [
  "나는 비어 있던 코어의 흔적을 따라 이곳까지 왔다.",
  "기억 조각은 흩어진 나의 기록이었고,",
  "기억 핵은 잃어버린 중심으로 향하는 열쇠였다.",
  "원점 코어가 깨어나며 멈춰 있던 세계가 다시 움직이기 시작한다.",
  "Coreless.",
  "중심을 잃은 존재가 다시 자신의 원점을 찾는 이야기."
];

const rooms = [
  { name: "방 1: 시작 구역", guide: "기본 이동과 점프", x: 0, width: 900, color: "#111827" },
  { name: "방 2: 근접 전투 구역", guide: "붉은 예고 공격을 보고 피하기", x: 900, width: 900, color: "#172033" },
  { name: "방 3: 능력 해금 구역", guide: "이중 점프 능력 획득", x: 1800, width: 900, color: "#1f1b2e" },
  { name: "방 4: 잠긴 통로 구역", guide: "열쇠가 있어야 문 통과 가능", x: 2700, width: 900, color: "#201a1a" },
  { name: "방 5: 기억의 문 구역", guide: "기억 조각으로 특수 문 열기", x: 3600, width: 900, color: "#10251f" },
  { name: "방 6: 기억 핵 구역", guide: "기억 핵 획득", x: 4500, width: 900, color: "#1a1328" },
  { name: "방 7: 최종 보스방", guide: "파편, 충격파, 내려찍기, 순간이동, 레이저 회피", x: 5400, width: 900, color: "#061520" }
];

const platforms = [
  { x: 0, y: 420, width: 840, height: 80 },
  { x: 150, y: 350, width: 180, height: 24 },
  { x: 450, y: 315, width: 180, height: 24 },
  { x: 630, y: 135, width: 110, height: 24, requiresDoubleJump: true },
  { x: 790, y: 105, width: 100, height: 24, requiresDoubleJump: true },
  { x: 930, y: 135, width: 110, height: 24, requiresDoubleJump: true },
  { x: 920, y: 420, width: 820, height: 80 },
  { x: 1030, y: 350, width: 170, height: 24 },
  { x: 1260, y: 300, width: 150, height: 24 },
  { x: 1510, y: 350, width: 170, height: 24 },
  { x: 1820, y: 420, width: 260, height: 80 },
  { x: 2220, y: 420, width: 420, height: 80 },
  { x: 1890, y: 345, width: 130, height: 24 },
  { x: 2130, y: 360, width: 90, height: 24 },
  { x: 2320, y: 330, width: 150, height: 24 },
  { x: 2475, y: 205, width: 34, height: 145, wallJumpTest: true },
  { x: 2605, y: 165, width: 34, height: 185, wallJumpTest: true },
  { x: 2700, y: 420, width: 820, height: 80 },
  { x: 2830, y: 350, width: 160, height: 24 },
  { x: 3060, y: 300, width: 160, height: 24 },
  { x: 3300, y: 350, width: 160, height: 24 },
  { x: 3600, y: 420, width: 900, height: 80 },
  { x: 3740, y: 340, width: 180, height: 24 },
  { x: 4000, y: 290, width: 180, height: 24 },
  { x: 4260, y: 340, width: 160, height: 24 },
  { x: 3860, y: 245, width: 130, height: 24 },
  { x: 4100, y: 215, width: 140, height: 24 },
  { x: 4350, y: 265, width: 110, height: 24 },
  { x: 4500, y: 420, width: 900, height: 80 },
  { x: 4620, y: 350, width: 160, height: 24 },
  { x: 4860, y: 305, width: 160, height: 24 },
  { x: 5100, y: 350, width: 160, height: 24 },
  { x: 5400, y: 420, width: 900, height: 80 },
  { x: 5480, y: 245, width: 120, height: 24 },
  { x: 5760, y: 225, width: 170, height: 24 },
  { x: 6110, y: 245, width: 120, height: 24 },
  { x: 760, y: 260, width: 40, height: 80 },
  { x: 1660, y: 300, width: 40, height: 120 },
  { x: 2500, y: 300, width: 40, height: 120 }
];

const doors = [
  { x: 860, y: 330, width: 40, height: 90, text: "문 1", locked: false, open: true },
  { x: 1760, y: 330, width: 40, height: 90, text: "문 2", locked: false, open: true },
  { x: 2660, y: 330, width: 40, height: 90, text: "문 3", locked: false, open: true },
  { x: 3560, y: 80, width: 40, height: 340, text: "잠긴 문", locked: true, open: false },
  { x: 4460, y: 80, width: 40, height: 340, text: "기억의 문", locked: true, open: false, requiresMemoryFragments: 1 },
  { x: 5360, y: 80, width: 40, height: 340, text: "최종 문", locked: true, open: false, requiresMemoryCores: 1 }
];

const bossArenaGates = [
  { x: 5408, y: 80, width: 34, height: 340, text: "보스전 봉인" }
];

const keyItem = { x: 3155, y: 260, width: 24, height: 24, collected: false };
const abilityItems = [
  { type: "doubleJump", name: "이중 점프", x: 2160, y: 320, width: 28, height: 28, collected: false }
];
const rewardItems = [
  { type: "memoryFragment", name: "기억 조각", x: 955, y: 95, width: 24, height: 24, collected: false },
  { type: "memoryCore", name: "기억 핵", x: 5120, y: 305, width: 28, height: 28, collected: false },
  { type: "originCore", name: "원점 코어", x: 6040, y: 372, width: 30, height: 30, collected: false, requiresBossDefeated: true }
];

const enemies = [
  createMeleeEnemy("그늘 벌레", 1130, 384, 34, 36, 990, 1600, 1.35, 3, 72, 95),
  createMeleeEnemy("균열 파수꾼", 2320, 384, 38, 36, 2220, 2620, 1.45, 4, 78, 105),
  createFlyingEnemy("공허 박쥐", 2030, 245),
  createShooterEnemy("균열 사수", 3920, 378)
];

const boss = {
  type: "boss",
  name: "기억 파수자",
  x: 5770,
  y: 348,
  baseY: 348,
  width: 72,
  height: 72,
  minX: 5475,
  maxX: 6210,
  vx: 0,
  speed: 1.25,
  facing: -1,
  maxHealth: 26,
  health: 26,
  alive: true,
  hitTimer: 0,
  hitByAttackId: -1,
  attackCooldown: 20,
  attackCooldownMax: 88,
  attackTimer: 0,
  attackDuration: 0,
  attackType: "none",
  attackFired: false,
  patternIndex: 0,
  startX: 5770,
  targetX: 5770,
  targetY: 348,
  slamHitDone: false,
  laserHitDone: false,
  laserY: 0,
  laserDirection: -1,
  hidden: false,
  alpha: 1,
  contactCooldown: 0,
  phaseTwoAnnounced: false,
  defeatStarted: false
};

function createMeleeEnemy(name, x, y, width, height, minX, maxX, speed, health, attackRange, attackCooldownMax) {
  return {
    type: "melee",
    name,
    x,
    y,
    width,
    height,
    minX,
    maxX,
    vx: speed,
    vy: 0,
    speed,
    patrolDirection: speed >= 0 ? 1 : -1,
    targetDirection: speed >= 0 ? 1 : -1,
    chaseRange: 390,
    aiDecisionTimer: 0,
    attackRange,
    attackCooldown: 0,
    attackCooldownMax,
    attackTimer: 0,
    attackDuration: 42,
    attackDirection: 1,
    attackHitPlayer: false,
    maxHealth: health,
    health,
    alive: true,
    hitTimer: 0,
    invincibleTimer: 0,
    hitByAttackId: -1
  };
}

function createFlyingEnemy(name, x, y) {
  return {
    type: "flying",
    name,
    x,
    y,
    width: 38,
    height: 28,
    minX: 1850,
    maxX: 2630,
    minY: 205,
    maxY: 420,
    vx: 1.1,
    vy: 0,
    speed: 1.65,
    verticalSpeed: 1.45,
    patrolDirection: 1,
    targetDirection: 1,
    chaseRange: 520,
    floatAngle: 0,
    aiDecisionTimer: 0,
    maxHealth: 3,
    health: 3,
    alive: true,
    hitTimer: 0,
    invincibleTimer: 0,
    hitByAttackId: -1
  };
}

function createShooterEnemy(name, x, y) {
  return {
    type: "shooter",
    name,
    x,
    y,
    width: 36,
    height: 42,
    minX: 3740,
    maxX: 4140,
    vx: 0,
    vy: 0,
    speed: 0.65,
    patrolDirection: -1,
    targetDirection: -1,
    chaseRange: 480,
    aiDecisionTimer: 0,
    shootRange: 520,
    shootVerticalRange: 130,
    shootCooldown: 50,
    shootCooldownMax: 120,
    shootTimer: 0,
    shootDuration: 40,
    shootDirection: -1,
    shootFired: false,
    maxHealth: 3,
    health: 3,
    alive: true,
    hitTimer: 0,
    invincibleTimer: 0,
    hitByAttackId: -1
  };
}

// 입력 처리

document.addEventListener("keydown", function(event) {
  keys[event.code] = true;

  if (gameState.endingReached && gameState.endingInputUnlocked && event.code === "KeyR") {
    location.reload();
    return;
  }

  if (gameState.endingReached) {
    return;
  }

  if (event.code === "Space") {
    if (!event.repeat) {
      requestJump();
    }
    event.preventDefault();
  }

  if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyK") {
    startDash();
    event.preventDefault();
  }

  if (event.code === "KeyJ") {
    startAttack();
    event.preventDefault();
  }

  if (event.code === "KeyL") {
    startHeal();
    event.preventDefault();
  }
});

document.addEventListener("keyup", function(event) {
  keys[event.code] = false;

  if (event.code === "Space") {
    cutJumpHeight();
  }
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function centerX(rect) {
  return rect.x + rect.width / 2;
}

function centerY(rect) {
  return rect.y + rect.height / 2;
}

function isColliding(rectA, rectB) {
  if (rectA.width <= 0 || rectA.height <= 0 || rectB.width <= 0 || rectB.height <= 0) {
    return false;
  }

  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

function isPlayerDamageInvincible() {
  return player.invincibleTimer > 0 || player.dashInvincibleTimer > 0;
}

function startHitStop(duration) {
  if (duration > hitStopTimer) {
    hitStopTimer = duration;
  }
}

function startScreenShake(duration, power) {
  screenShakeTimer = duration;
  screenShakeMaxTimer = duration;
  screenShakePower = power;
}

function updateScreenShake() {
  if (screenShakeTimer > 0) {
    screenShakeTimer -= 1;
    const ratio = screenShakeMaxTimer > 0 ? screenShakeTimer / screenShakeMaxTimer : 0;
    camera.shakeX = (Math.random() - 0.5) * screenShakePower * ratio;
    camera.shakeY = (Math.random() - 0.5) * screenShakePower * ratio;
  } else {
    camera.shakeX = 0;
    camera.shakeY = 0;
  }
}

function isBossGateActive() {
  return gameState.bossRoomLocked && boss.alive && !gameState.bossDefeated;
}

function getCurrentRoom() {
  const playerCenterX = centerX(player);

  for (const room of rooms) {
    if (playerCenterX >= room.x && playerCenterX < room.x + room.width) {
      return room;
    }
  }

  return rooms[0];
}

function getSolidObjects() {
  const solidObjects = [];

  for (const platform of platforms) {
    solidObjects.push(platform);
  }

  for (const door of doors) {
    if (door.locked && !door.open) {
      solidObjects.push(door);
    }
  }

  if (isBossGateActive()) {
    for (const gate of bossArenaGates) {
      solidObjects.push(gate);
    }
  }

  return solidObjects;
}

function isAttackBlockingObject(object) {
  return object.height >= 50 && object.width <= 90;
}

function getClippedHitboxByWalls(hitbox, owner, direction) {
  const clipped = {
    x: hitbox.x,
    y: hitbox.y,
    width: hitbox.width,
    height: hitbox.height
  };

  for (const object of getSolidObjects()) {
    if (!isAttackBlockingObject(object)) {
      continue;
    }

    if (!isColliding(hitbox, object)) {
      continue;
    }

    if (direction === 1) {
      if (object.x >= owner.x + owner.width - 2) {
        const newRight = Math.min(clipped.x + clipped.width, object.x);
        clipped.width = Math.max(0, newRight - clipped.x);
      }
    } else {
      const wallRight = object.x + object.width;

      if (wallRight <= owner.x + 2) {
        const oldRight = clipped.x + clipped.width;
        clipped.x = Math.max(clipped.x, wallRight);
        clipped.width = Math.max(0, oldRight - clipped.x);
      }
    }
  }

  return clipped;
}

function isHitboxClipped(original, clipped) {
  return Math.abs(original.x - clipped.x) > 0.1 || Math.abs(original.width - clipped.width) > 0.1;
}

function getWallSparkPoint(clipped, direction) {
  if (direction === 1) {
    return { x: clipped.x + clipped.width, y: clipped.y + clipped.height / 2 };
  }

  return { x: clipped.x, y: clipped.y + clipped.height / 2 };
}

function addFloatingText(text, x, y, color) {
  floatingTexts.push({
    text,
    x,
    y,
    vy: -0.45,
    life: 50,
    maxLife: 50,
    color
  });
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const text = floatingTexts[i];
    text.y += text.vy;
    text.life -= 1;

    if (text.life <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

function addDustParticle(x, y, vx, vy, width, height, life, color, rotation) {
  particles.push({
    type: "dust",
    x,
    y,
    vx,
    vy,
    width,
    height,
    life,
    maxLife: life,
    color,
    rotation,
    gravity: 0.025,
    growX: 0.35,
    growY: 0.015
  });
}

function addDashStreak(x, y, vx, vy, width, height, life, color, rotation) {
  particles.push({
    type: "dash",
    x,
    y,
    vx,
    vy,
    width,
    height,
    life,
    maxLife: life,
    color,
    rotation,
    gravity: 0,
    growX: -0.15,
    growY: -0.01
  });
}

function spawnWallSparkParticles(x, y, direction) {
  for (let i = 0; i < 12; i++) {
    addDashStreak(
      x,
      y + (Math.random() - 0.5) * 22,
      direction * (1.0 + Math.random() * 2.8),
      (Math.random() - 0.5) * 2.0,
      8 + Math.random() * 14,
      2 + Math.random() * 3,
      12 + Math.random() * 8,
      "rgba(251, 191, 36, 1)",
      (Math.random() - 0.5) * 0.6
    );
  }
}

function spawnJumpParticles() {
  for (let i = 0; i < 10; i++) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    addDustParticle(
      centerX(player) + (Math.random() - 0.5) * 10,
      player.y + player.height + 2,
      direction * (0.7 + Math.random() * 1.8),
      -0.15 + Math.random() * 0.45,
      9 + Math.random() * 12,
      2.5 + Math.random() * 2.5,
      20 + Math.random() * 10,
      "rgba(148, 163, 184, 1)",
      (Math.random() - 0.5) * 0.35
    );
  }
}

function spawnDoubleJumpParticles() {
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18;
    addDashStreak(
      centerX(player),
      centerY(player),
      Math.cos(angle) * (1.4 + Math.random() * 1.3),
      Math.sin(angle) * (1.0 + Math.random() * 1.1),
      10 + Math.random() * 14,
      2 + Math.random() * 3,
      16 + Math.random() * 8,
      "rgba(196, 181, 253, 1)",
      angle
    );
  }

  startScreenShake(4, 2);
}

function spawnLandingParticles(power) {
  const count = Math.min(24, 10 + Math.floor(power * 1.5));

  for (let i = 0; i < count; i++) {
    const direction = i % 2 === 0 ? -1 : 1;
    addDustParticle(
      centerX(player) + (Math.random() - 0.5) * 8,
      player.y + player.height + 2,
      direction * (1.0 + Math.random() * 3.0),
      -0.3 - Math.random() * 0.9,
      12 + Math.random() * 18,
      3 + Math.random() * 3,
      24 + Math.random() * 14,
      "rgba(148, 163, 184, 1)",
      direction * (0.05 + Math.random() * 0.25)
    );
  }
}

function spawnDashParticles() {
  for (let i = 0; i < 14; i++) {
    addDashStreak(
      centerX(player) - player.facing * (8 + Math.random() * 20),
      player.y + 12 + Math.random() * 28,
      -player.facing * (1.5 + Math.random() * 3.0),
      (Math.random() - 0.5) * 0.8,
      18 + Math.random() * 24,
      3 + Math.random() * 4,
      18 + Math.random() * 8,
      player.dashInvincibleTimer > 0 ? "rgba(254, 240, 138, 1)" : "rgba(125, 211, 252, 1)",
      (Math.random() - 0.5) * 0.18
    );
  }
}

function spawnHitParticles(x, y, direction) {
  for (let i = 0; i < 16; i++) {
    addDashStreak(
      x,
      y + (Math.random() - 0.5) * 18,
      direction * (1.8 + Math.random() * 3.6),
      (Math.random() - 0.5) * 1.4,
      14 + Math.random() * 24,
      2 + Math.random() * 4,
      14 + Math.random() * 8,
      "rgba(248, 113, 113, 1)",
      (Math.random() - 0.5) * 0.4
    );
  }
}

function spawnPlayerDamageParticles() {
  for (let i = 0; i < 22; i++) {
    const angle = (Math.PI * 2 * i) / 22;
    addDashStreak(
      centerX(player),
      centerY(player),
      Math.cos(angle) * (1.5 + Math.random() * 2.2),
      Math.sin(angle) * (1.5 + Math.random() * 2.2),
      10 + Math.random() * 16,
      2 + Math.random() * 4,
      16 + Math.random() * 10,
      "rgba(248, 113, 113, 1)",
      angle
    );
  }
}

function spawnHealParticles() {
  for (let i = 0; i < 3; i++) {
    addDashStreak(
      centerX(player) + (Math.random() - 0.5) * 18,
      player.y + player.height - 4,
      (Math.random() - 0.5) * 0.6,
      -1.2 - Math.random() * 1.2,
      8 + Math.random() * 10,
      2 + Math.random() * 3,
      18 + Math.random() * 8,
      "rgba(134, 239, 172, 1)",
      (Math.random() - 0.5) * 0.5
    );
  }
}

function spawnHealCompleteParticles() {
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20;
    addDashStreak(
      centerX(player),
      centerY(player),
      Math.cos(angle) * (1.2 + Math.random()),
      Math.sin(angle) * (1.2 + Math.random()),
      10 + Math.random() * 12,
      2 + Math.random() * 3,
      18 + Math.random() * 8,
      "rgba(134, 239, 172, 1)",
      angle
    );
  }
}

function spawnRewardBurst(item, color) {
  for (let i = 0; i < 32; i++) {
    const angle = (Math.PI * 2 * i) / 32;
    addDashStreak(
      centerX(item),
      centerY(item),
      Math.cos(angle) * (1.2 + Math.random() * 2.2),
      Math.sin(angle) * (1.2 + Math.random() * 2.2),
      10 + Math.random() * 16,
      2 + Math.random() * 3,
      22 + Math.random() * 10,
      color,
      angle
    );
  }
}

function spawnBossSlamParticles() {
  for (let i = 0; i < 34; i++) {
    const direction = i % 2 === 0 ? -1 : 1;
    addDashStreak(
      boss.x + boss.width / 2,
      boss.baseY + boss.height - 4,
      direction * (1.5 + Math.random() * 5.2),
      -0.5 - Math.random() * 1.9,
      14 + Math.random() * 26,
      3 + Math.random() * 5,
      18 + Math.random() * 10,
      "rgba(251, 113, 133, 1)",
      (Math.random() - 0.5) * 0.7
    );
  }
}

function spawnBossTeleportParticles(x, y) {
  for (let i = 0; i < 34; i++) {
    const angle = (Math.PI * 2 * i) / 34;
    addDashStreak(
      x,
      y,
      Math.cos(angle) * (1.2 + Math.random() * 2.7),
      Math.sin(angle) * (1.2 + Math.random() * 2.7),
      12 + Math.random() * 18,
      2 + Math.random() * 4,
      18 + Math.random() * 10,
      "rgba(216, 180, 254, 1)",
      angle
    );
  }
}

function spawnBossLaserParticles() {
  const hitbox = getBossLaserHitbox();

  for (let i = 0; i < 24; i++) {
    const x = hitbox.x + Math.random() * hitbox.width;
    const y = hitbox.y + Math.random() * hitbox.height;
    addDashStreak(
      x,
      y,
      (Math.random() - 0.5) * 2.2,
      (Math.random() - 0.5) * 0.8,
      12 + Math.random() * 18,
      2 + Math.random() * 3,
      12 + Math.random() * 8,
      "rgba(248, 113, 113, 1)",
      (Math.random() - 0.5) * 0.2
    );
  }
}

function spawnBossDefeatBurst() {
  for (let i = 0; i < 80; i++) {
    const angle = (Math.PI * 2 * i) / 80;
    addDashStreak(
      centerX(boss),
      centerY(boss),
      Math.cos(angle) * (1.5 + Math.random() * 4.0),
      Math.sin(angle) * (1.5 + Math.random() * 4.0),
      16 + Math.random() * 26,
      3 + Math.random() * 5,
      32 + Math.random() * 18,
      i % 2 === 0 ? "rgba(125, 211, 252, 1)" : "rgba(216, 180, 254, 1)",
      angle
    );
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.width += particle.growX;
    particle.height += particle.growY;

    if (particle.width < 1) {
      particle.width = 1;
    }

    if (particle.height < 1) {
      particle.height = 1;
    }

    particle.life -= 1;

    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function requestJump() {
  if (player.healTimer > 0) {
    return;
  }

  player.jumpBufferTimer = player.jumpBufferMax;
}

function updateJumpAssistTimers() {
  if (player.jumpBufferTimer > 0) {
    player.jumpBufferTimer -= 1;
  }

  if (player.onGround) {
    player.coyoteTimer = player.coyoteMax;
  } else if (player.coyoteTimer > 0) {
    player.coyoteTimer -= 1;
  }
}

function tryBufferedJump() {
  if (player.jumpBufferTimer <= 0) {
    return;
  }

  if (player.healTimer > 0) {
    player.jumpBufferTimer = 0;
    return;
  }

  const wallDirectionForJump = player.isWallSliding ? player.wallDirection : checkWallContact();

  if (player.hasWallJump && wallDirectionForJump !== 0 && !player.onGround && player.wallJumpLockTimer <= 0) {
    performWallJump(wallDirectionForJump);
    player.jumpBufferTimer = 0;
    return;
  }

  if (player.onGround || player.coyoteTimer > 0) {
    performGroundJump();
    player.jumpBufferTimer = 0;
    return;
  }

  if (player.hasDoubleJump && player.canDoubleJump && !player.doubleJumpUsed) {
    performDoubleJump();
    player.jumpBufferTimer = 0;
  }
}

function performGroundJump() {
  spawnJumpParticles();
  player.vy = player.jumpPower;
  player.onGround = false;
  player.coyoteTimer = 0;

  if (player.hasDoubleJump) {
    player.canDoubleJump = true;
    player.doubleJumpUsed = false;
  }
}

function performDoubleJump() {
  spawnDoubleJumpParticles();
  player.vy = player.jumpPower * 0.92;
  player.canDoubleJump = false;
  player.doubleJumpUsed = true;
  gameState.message = "이중 점프를 사용했습니다.";
}

function performWallJump(wallDirection) {
  player.isWallSliding = false;
  player.wallDirection = wallDirection;
  player.wallJumpLockTimer = player.wallJumpLockMax;
  player.vx = -wallDirection * player.wallJumpPowerX;
  player.vy = player.wallJumpPowerY;
  player.facing = -wallDirection;
  player.onGround = false;
  player.coyoteTimer = 0;

  if (player.hasDoubleJump) {
    player.canDoubleJump = true;
    player.doubleJumpUsed = false;
  }

  spawnWallJumpParticles(wallDirection);
  startScreenShake(5, 2.8);
  gameState.message = "벽 점프를 사용했습니다.";
}

function checkWallContact() {
  if (player.onGround || player.isDashing) {
    return 0;
  }

  const leftSensor = {
    x: player.x - 3,
    y: player.y + 6,
    width: 4,
    height: player.height - 12
  };

  const rightSensor = {
    x: player.x + player.width - 1,
    y: player.y + 6,
    width: 4,
    height: player.height - 12
  };

  for (const object of getSolidObjects()) {
    if (object.height < 38) {
      continue;
    }

    if (isColliding(leftSensor, object)) {
      return -1;
    }

    if (isColliding(rightSensor, object)) {
      return 1;
    }
  }

  return 0;
}

function updateWallSlide() {
  if (!player.hasWallJump || player.onGround || player.isDashing || player.wallJumpLockTimer > 0) {
    player.isWallSliding = false;
    player.wallDirection = 0;
    return;
  }

  const wallDirection = checkWallContact();

  if (wallDirection !== 0 && player.vy > 0) {
    player.isWallSliding = true;
    player.wallDirection = wallDirection;
    player.vy = Math.min(player.vy, player.wallSlideSpeed);

    if (frameCount % 5 === 0) {
      spawnWallSlideDust(wallDirection);
    }
  } else {
    player.isWallSliding = false;
    player.wallDirection = 0;
  }
}

function spawnWallJumpParticles(wallDirection) {
  const baseX = wallDirection === -1 ? player.x : player.x + player.width;

  for (let i = 0; i < 18; i++) {
    addDashStreak(
      baseX,
      player.y + 8 + Math.random() * 32,
      -wallDirection * (1.0 + Math.random() * 3.2),
      -1.2 + Math.random() * 2.4,
      10 + Math.random() * 16,
      2 + Math.random() * 3,
      16 + Math.random() * 10,
      "rgba(167, 243, 208, 1)",
      (Math.random() - 0.5) * 0.7
    );
  }
}

function spawnWallSlideDust(wallDirection) {
  const baseX = wallDirection === -1 ? player.x : player.x + player.width;

  addDustParticle(
    baseX,
    player.y + 12 + Math.random() * 28,
    -wallDirection * (0.3 + Math.random() * 0.8),
    0.6 + Math.random() * 0.8,
    6 + Math.random() * 8,
    2 + Math.random() * 2,
    14 + Math.random() * 8,
    "rgba(167, 243, 208, 1)",
    (Math.random() - 0.5) * 0.4
  );
}

function cutJumpHeight() {
  if (player.vy < -2.5) {
    player.vy *= player.jumpCutMultiplier;
  }
}

function startDash() {
  if (player.healTimer > 0) {
    return;
  }

  if (player.dashCooldown > 0) {
    return;
  }

  if (player.isDashing) {
    return;
  }

  player.isDashing = true;
  player.dashTimer = player.dashDuration;
  player.dashCooldown = player.dashCooldownMax;
  player.dashInvincibleTimer = player.dashInvincibleMax;
  player.dashEndLagTimer = 0;
  player.vy = 0;

  gameState.message = "대시를 사용했습니다. 대시 초반에는 피해를 피할 수 있습니다.";
  spawnDashParticles();
  startScreenShake(4, 2.5);
}

function updateDash() {
  if (player.dashCooldown > 0) {
    player.dashCooldown -= 1;
  }

  if (player.dashInvincibleTimer > 0) {
    player.dashInvincibleTimer -= 1;
  }

  if (player.dashEndLagTimer > 0) {
    player.dashEndLagTimer -= 1;
  }

  if (player.isDashing) {
    player.vx = player.facing * player.dashSpeed;
    player.dashTimer -= 1;

    if (frameCount % 2 === 0) {
      addDashStreak(
        centerX(player) - player.facing * 18,
        player.y + 12 + Math.random() * 28,
        -player.facing * (1.0 + Math.random() * 2.0),
        (Math.random() - 0.5) * 0.5,
        12 + Math.random() * 18,
        2 + Math.random() * 3,
        12 + Math.random() * 7,
        player.dashInvincibleTimer > 0 ? "rgba(254, 240, 138, 1)" : "rgba(125, 211, 252, 1)",
        (Math.random() - 0.5) * 0.15
      );
    }

    if (player.dashTimer <= 0) {
      player.isDashing = false;
      player.dashEndLagTimer = player.dashEndLagMax;
    }
  }
}

function getSelectedAttackDirection() {
  const upPressed = keys["KeyW"] || keys["ArrowUp"];
  const downPressed = keys["KeyS"] || keys["ArrowDown"];

  if (upPressed) {
    return "up";
  }

  if (downPressed && !player.onGround) {
    return "down";
  }

  return "side";
}

function startAttack() {
  if (player.healTimer > 0) {
    return;
  }

  if (player.attackCooldown > 0) {
    return;
  }

  player.attackDirection = getSelectedAttackDirection();
  player.attackTimer = player.attackDuration;
  player.attackCooldown = player.attackCooldownMax;
  player.attackId += 1;

  if (player.attackDirection === "up") {
    gameState.message = "위 공격을 사용했습니다.";
  } else if (player.attackDirection === "down") {
    gameState.message = "아래 공격을 사용했습니다.";
  } else {
    gameState.message = "공격했습니다.";
  }

  const hitbox = getAttackHitbox();
  spawnHitParticles(hitbox.x + hitbox.width / 2, hitbox.y + hitbox.height / 2, player.facing);
}

function getAttackHitbox() {
  if (player.attackDirection === "up") {
    return {
      x: player.x - 6,
      y: player.y - 42,
      width: player.width + 12,
      height: 48
    };
  }

  if (player.attackDirection === "down") {
    return {
      x: player.x - 6,
      y: player.y + player.height - 4,
      width: player.width + 12,
      height: 50
    };
  }

  const attackWidth = 54;
  const attackHeight = 38;

  return {
    x: player.facing === 1 ? player.x + player.width - 3 : player.x - attackWidth + 3,
    y: player.y + 6,
    width: attackWidth,
    height: attackHeight
  };
}

function applyAttackRecoilOnHit(target) {
  if (player.attackDirection === "down" && !player.onGround) {
    player.vy = player.attackPogoPower;
    player.canDoubleJump = player.hasDoubleJump;
    player.doubleJumpUsed = false;
    player.attackFloatTimer = 0;
    spawnDoubleJumpParticles();
    startScreenShake(5, 3);
    gameState.message = "아래 공격이 적중하여 튕겨 올랐습니다.";
    return;
  }

  if (player.attackDirection === "side") {
    player.vx -= player.facing * player.attackRecoilX;
    return;
  }

  if (player.attackDirection === "up") {
    player.vy = Math.min(player.vy, -2.2);
    player.attackFloatTimer = 5;
  }
}

function startHeal() {
  if (player.healTimer > 0) {
    return;
  }

  if (!player.onGround) {
    gameState.message = "회복은 땅 위에서만 할 수 있습니다.";
    return;
  }

  if (player.health >= player.maxHealth) {
    gameState.message = "이미 체력이 가득 차 있습니다.";
    return;
  }

  if (player.coreEnergy < player.healCost) {
    gameState.message = "코어 에너지가 부족합니다.";
    return;
  }

  if (player.isDashing || player.attackTimer > 0) {
    return;
  }

  player.coreEnergy -= player.healCost;
  player.healTimer = player.healDuration;
  player.healingWillRestore = true;
  player.vx = 0;
  gameState.message = "코어 에너지로 회복 중입니다. 맞으면 끊깁니다.";
}

function gainCoreEnergy(amount) {
  player.coreEnergy += amount;

  if (player.coreEnergy > player.maxCoreEnergy) {
    player.coreEnergy = player.maxCoreEnergy;
  }
}

function updatePlayerCombat() {
  if (player.attackTimer > 0) {
    player.attackTimer -= 1;
  }

  if (player.attackCooldown > 0) {
    player.attackCooldown -= 1;
  }

  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= 1;
  }

  if (player.attackFloatTimer > 0) {
    player.attackFloatTimer -= 1;
  }

  if (player.healTimer > 0) {
    player.healTimer -= 1;

    if (frameCount % 4 === 0) {
      spawnHealParticles();
    }

    if (player.healTimer <= 0 && player.healingWillRestore) {
      player.health += 1;

      if (player.health > player.maxHealth) {
        player.health = player.maxHealth;
      }

      player.healingWillRestore = false;
      gameState.message = "체력을 1 회복했습니다.";
      spawnHealCompleteParticles();
      startScreenShake(6, 3);
    }
  }
}

function updatePlayerHorizontalMove() {
  if (gameState.endingReached) {
    player.vx = 0;
    return;
  }

  if (player.healTimer > 0) {
    player.vx *= 0.6;

    if (Math.abs(player.vx) < 0.05) {
      player.vx = 0;
    }

    return;
  }

  if (player.isDashing) {
    return;
  }

  if (player.dashEndLagTimer > 0) {
    player.vx *= 0.92;
    return;
  }

  const acceleration = player.onGround ? player.groundAcceleration : player.airAcceleration;
  const friction = player.onGround ? player.groundFriction : player.airFriction;
  const currentMaxSpeed = player.onGround ? player.maxSpeed : player.maxAirSpeed;
  let moving = false;

  if (keys["KeyA"]) {
    if (player.vx > 0 && player.onGround) {
      player.vx *= 0.58;
    }

    player.vx -= acceleration;
    player.facing = -1;
    moving = true;
  }

  if (keys["KeyD"]) {
    if (player.vx < 0 && player.onGround) {
      player.vx *= 0.58;
    }

    player.vx += acceleration;
    player.facing = 1;
    moving = true;
  }

  if (!moving) {
    player.vx *= friction;
  }

  if (player.vx > currentMaxSpeed) {
    player.vx = currentMaxSpeed;
  }

  if (player.vx < -currentMaxSpeed) {
    player.vx = -currentMaxSpeed;
  }

  if (Math.abs(player.vx) < 0.05) {
    player.vx = 0;
  }
}

function updateGravity() {
  if (player.isDashing) {
    return;
  }

  if (player.attackFloatTimer > 0 && player.vy > 0) {
    player.vy *= 0.82;
  }

  let gravityToApply = gravity;

  if (player.vy > 0) {
    gravityToApply *= player.fallGravityMultiplier;
  }

  player.vy += gravityToApply;

  if (player.vy > player.maxFallSpeed) {
    player.vy = player.maxFallSpeed;
  }
}

function moveHorizontally() {
  player.x += player.vx;

  for (const object of getSolidObjects()) {
    if (!isColliding(player, object)) {
      continue;
    }

    if (object.locked && !object.open) {
      if (object.requiresMemoryCores) {
        if (gameState.memoryCores >= object.requiresMemoryCores) {
          object.open = true;
          gameState.message = "기억 핵이 반응하여 최종 문이 열렸습니다.";
          startScreenShake(14, 4);
          continue;
        }

        gameState.message = "최종 문입니다. 기억 핵 1개가 필요합니다.";
      } else if (object.requiresMemoryFragments) {
        if (gameState.memoryFragments >= object.requiresMemoryFragments) {
          object.open = true;
          gameState.message = "기억 조각이 반응하여 기억의 문이 열렸습니다.";
          startScreenShake(10, 3);
          continue;
        }

        gameState.message = "기억의 문입니다. 기억 조각 1개가 필요합니다.";
      } else if (gameState.hasKey) {
        object.open = true;
        gameState.message = "잠긴 문이 열렸습니다.";
        continue;
      } else {
        gameState.message = "잠긴 문입니다. 열쇠가 필요합니다.";
      }
    }

    if (isBossGateActive() && object.text === "보스전 봉인") {
      gameState.message = "보스를 쓰러뜨리기 전에는 보스방을 나갈 수 없습니다.";
    }

    if (player.vx > 0) {
      player.x = object.x - player.width;
    } else if (player.vx < 0) {
      player.x = object.x + object.width;
    }

    player.vx = 0;
    player.isDashing = false;
  }

  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }

  if (player.x + player.width > world.width) {
    player.x = world.width - player.width;
    player.vx = 0;
  }
}

function moveVertically(previousOnGround, previousVy) {
  player.y += player.vy;
  player.onGround = false;

  for (const object of getSolidObjects()) {
    if (!isColliding(player, object)) {
      continue;
    }

    if (player.vy > 0) {
      player.y = object.y - player.height;
      player.vy = 0;
      player.onGround = true;

      if (player.hasDoubleJump) {
        player.canDoubleJump = true;
        player.doubleJumpUsed = false;
      }

      if (!previousOnGround && previousVy > 4) {
        spawnLandingParticles(previousVy);
      }
    } else if (player.vy < 0) {
      player.y = object.y + object.height;
      player.vy = 0;
    }
  }
}

function updatePlayer() {
  const previousOnGround = player.onGround;
  const previousVy = player.vy;
  player.wasOnGround = player.onGround;

  if (player.wallJumpLockTimer > 0) {
    player.wallJumpLockTimer -= 1;
  }

  updateJumpAssistTimers();
  tryBufferedJump();
  updateDash();
  updatePlayerHorizontalMove();
  updateGravity();
  moveHorizontally();
  updateWallSlide();
  moveVertically(previousOnGround, previousVy);

  if (player.onGround) {
    player.coyoteTimer = player.coyoteMax;
  }

  checkKeyCollection();
  checkAbilityCollection();
  checkRewardCollection();
  checkFall();
}

function checkKeyCollection() {
  if (keyItem.collected) {
    return;
  }

  if (isColliding(player, keyItem)) {
    keyItem.collected = true;
    gameState.hasKey = true;
    gameState.message = "열쇠를 획득했습니다. 이제 잠긴 문을 열 수 있습니다.";
    spawnRewardBurst(keyItem, "rgba(250, 204, 21, 1)");
  }
}

function checkAbilityCollection() {
  for (const item of abilityItems) {
    if (item.collected) {
      continue;
    }

    if (!isColliding(player, item)) {
      continue;
    }

    item.collected = true;

    if (item.type === "doubleJump") {
      player.hasDoubleJump = true;
      player.canDoubleJump = true;
      player.doubleJumpUsed = false;
      gameState.message = "능력 획득: 이중 점프. 공중에서 Space를 한 번 더 누를 수 있습니다.";
      spawnRewardBurst(item, "rgba(196, 181, 253, 1)");
      startScreenShake(8, 3);
    }
  }
}

function checkRewardCollection() {
  for (const item of rewardItems) {
    if (item.collected) {
      continue;
    }

    if (item.requiresBossDefeated && !gameState.bossDefeated) {
      continue;
    }

    if (!isColliding(player, item)) {
      continue;
    }

    item.collected = true;

    if (item.type === "memoryFragment") {
      gameState.memoryFragments += 1;
      gameState.message = "기억 조각을 획득했습니다. 이제 기억의 문을 열 수 있습니다.";
      spawnRewardBurst(item, "rgba(251, 191, 36, 1)");
      startScreenShake(6, 2.5);
    }

    if (item.type === "memoryCore") {
      gameState.memoryCores += 1;
      gameState.message = "기억 핵을 획득했습니다. 이제 최종 문을 열 수 있습니다.";
      spawnRewardBurst(item, "rgba(216, 180, 254, 1)");
      startScreenShake(12, 4);
    }

    if (item.type === "originCore") {
      gameState.originCores += 1;
      gameState.endingReached = true;
      gameState.endingFrame = 0;
      gameState.endingInputUnlocked = false;
      gameState.message = "원점 코어를 획득했습니다. Coreless의 엔딩이 시작됩니다.";
      spawnRewardBurst(item, "rgba(125, 211, 252, 1)");
      startScreenShake(20, 6);
    }
  }
}

function checkFall() {
  if (player.y > world.height) {
    resetPlayer();
  }
}

function resetPlayer() {
  player.x = startPosition.x;
  player.y = startPosition.y;
  player.vx = 0;
  player.vy = 0;
  player.health = player.maxHealth;
  player.invincibleTimer = 90;
  player.dashInvincibleTimer = 0;
  player.dashEndLagTimer = 0;
  player.isDashing = false;
  player.attackTimer = 0;
  player.healTimer = 0;
  player.healingWillRestore = false;
  player.canDoubleJump = player.hasDoubleJump;
  player.doubleJumpUsed = false;
  player.jumpBufferTimer = 0;
  player.coyoteTimer = 0;
  player.attackFloatTimer = 0;
  gameState.bossRoomLocked = false;
  gameState.message = "시작 지점에서 다시 시작합니다.";
}

function respawnPlayer() {
  resetPlayer();
  gameState.message = "체력이 모두 줄어 시작 지점에서 다시 시작합니다.";
}

function updateEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type === "flying") {
      updateFlyingEnemy(enemy);
    } else if (enemy.type === "shooter") {
      updateShooterEnemy(enemy);
    } else {
      updateMeleeEnemy(enemy);
    }

    if (enemy.hitTimer > 0) {
      enemy.hitTimer -= 1;
    }

    if (enemy.invincibleTimer > 0) {
      enemy.invincibleTimer -= 1;
    }
  }
}

function updateMeleeEnemy(enemy) {
  updateMeleeEnemyAI(enemy);
  moveEnemyHorizontally(enemy);
  updateEnemyCombat(enemy);
}

function updateMeleeEnemyAI(enemy) {
  const distanceX = centerX(player) - centerX(enemy);
  const distanceY = centerY(player) - centerY(enemy);
  const playerIsClose = Math.abs(distanceX) <= enemy.chaseRange && Math.abs(distanceY) <= 160;

  if (enemy.aiDecisionTimer > 0) {
    enemy.aiDecisionTimer -= 1;
  }

  if (enemy.attackTimer > 0) {
    enemy.vx = 0;
    return;
  }

  if (canEnemyStartAttack(enemy, distanceX, distanceY)) {
    startEnemyAttack(enemy, distanceX);
    enemy.vx = 0;
    return;
  }

  if (playerIsClose) {
    if (enemy.aiDecisionTimer <= 0) {
      if (distanceX > 8) {
        enemy.targetDirection = 1;
      } else if (distanceX < -8) {
        enemy.targetDirection = -1;
      }

      enemy.patrolDirection = enemy.targetDirection;
      enemy.aiDecisionTimer = 14;
    }

    enemy.vx = enemy.targetDirection * enemy.speed;
  } else {
    enemy.vx = enemy.patrolDirection * enemy.speed * 0.7;
  }
}

function updateFlyingEnemy(enemy) {
  const distanceX = centerX(player) - centerX(enemy);
  const distanceY = centerY(player) - centerY(enemy);
  const playerIsClose = Math.abs(distanceX) <= enemy.chaseRange && Math.abs(distanceY) <= 260;
  enemy.floatAngle += 0.05;

  if (enemy.aiDecisionTimer > 0) {
    enemy.aiDecisionTimer -= 1;
  }

  if (playerIsClose) {
    if (enemy.aiDecisionTimer <= 0) {
      if (distanceX > 8) {
        enemy.targetDirection = 1;
      } else if (distanceX < -8) {
        enemy.targetDirection = -1;
      }

      enemy.aiDecisionTimer = 10;
    }

    if (Math.abs(distanceX) > 10) {
      enemy.vx = enemy.targetDirection * enemy.speed;
    } else {
      enemy.vx *= 0.82;
    }

    if (Math.abs(distanceY) > 10) {
      enemy.vy = distanceY > 0 ? enemy.verticalSpeed : -enemy.verticalSpeed;
    } else {
      enemy.vy *= 0.72;
    }
  } else {
    enemy.vx = enemy.patrolDirection * enemy.speed * 0.75;
    enemy.vy = Math.sin(enemy.floatAngle) * 0.7;
  }

  enemy.x += enemy.vx;
  enemy.y += enemy.vy;

  if (enemy.x < enemy.minX) {
    enemy.x = enemy.minX;
    enemy.patrolDirection = 1;
    enemy.targetDirection = 1;
  }

  if (enemy.x + enemy.width > enemy.maxX) {
    enemy.x = enemy.maxX - enemy.width;
    enemy.patrolDirection = -1;
    enemy.targetDirection = -1;
  }

  if (enemy.y < enemy.minY) {
    enemy.y = enemy.minY;
    enemy.vy = Math.abs(enemy.vy);
  }

  if (enemy.y + enemy.height > enemy.maxY) {
    enemy.y = enemy.maxY - enemy.height;
    enemy.vy = -Math.abs(enemy.vy);
  }
}

function updateShooterEnemy(enemy) {
  const distanceX = centerX(player) - centerX(enemy);
  const distanceY = centerY(player) - centerY(enemy);

  if (distanceX >= 0) {
    enemy.shootDirection = 1;
    enemy.targetDirection = 1;
  } else {
    enemy.shootDirection = -1;
    enemy.targetDirection = -1;
  }

  if (enemy.shootCooldown > 0) {
    enemy.shootCooldown -= 1;
  }

  if (enemy.shootTimer > 0) {
    const elapsed = enemy.shootDuration - enemy.shootTimer;
    enemy.vx = 0;
    enemy.shootTimer -= 1;

    if (!enemy.shootFired && elapsed >= 24) {
      spawnEnemyProjectile(enemy);
      enemy.shootFired = true;
      startScreenShake(5, 2.5);
    }

    if (enemy.shootTimer <= 0) {
      enemy.shootCooldown = enemy.shootCooldownMax;
      enemy.shootFired = false;
    }

    return;
  }

  const playerInShootRange = Math.abs(distanceX) <= enemy.shootRange && Math.abs(distanceY) <= enemy.shootVerticalRange;

  if (playerInShootRange && enemy.shootCooldown <= 0) {
    enemy.vx = 0;
    enemy.shootTimer = enemy.shootDuration;
    enemy.shootFired = false;
    gameState.message = enemy.name + "가 원거리 공격을 준비합니다.";
    return;
  }

  if (Math.abs(distanceX) <= enemy.chaseRange && Math.abs(distanceY) <= 180) {
    if (Math.abs(distanceX) < 210) {
      enemy.vx = -enemy.targetDirection * enemy.speed;
    } else if (Math.abs(distanceX) > 330) {
      enemy.vx = enemy.targetDirection * enemy.speed;
    } else {
      enemy.vx = enemy.patrolDirection * enemy.speed * 0.35;
    }
  } else {
    enemy.vx = enemy.patrolDirection * enemy.speed * 0.7;
  }

  moveEnemyHorizontally(enemy);
}

function canEnemyStartAttack(enemy, distanceX, distanceY) {
  if (enemy.attackCooldown > 0) {
    return false;
  }

  if (enemy.attackTimer > 0) {
    return false;
  }

  if (Math.abs(distanceX) > enemy.attackRange) {
    return false;
  }

  if (Math.abs(distanceY) > 48) {
    return false;
  }

  if (isPlayerDamageInvincible()) {
    return false;
  }

  return true;
}

function startEnemyAttack(enemy, distanceX) {
  enemy.attackTimer = enemy.attackDuration;
  enemy.attackCooldown = enemy.attackCooldownMax;
  enemy.attackHitPlayer = false;

  if (distanceX >= 0) {
    enemy.attackDirection = 1;
    enemy.targetDirection = 1;
    enemy.patrolDirection = 1;
  } else {
    enemy.attackDirection = -1;
    enemy.targetDirection = -1;
    enemy.patrolDirection = -1;
  }

  gameState.message = enemy.name + "가 공격을 준비합니다.";
}

function updateEnemyCombat(enemy) {
  if (enemy.attackCooldown > 0) {
    enemy.attackCooldown -= 1;
  }

  if (enemy.attackTimer > 0) {
    const previousAttackTimer = enemy.attackTimer;
    enemy.attackTimer -= 1;

    if (previousAttackTimer > 0 && enemy.attackTimer <= 0) {
      enemy.attackHitPlayer = false;
    }
  }
}

function isEnemyAttackActive(enemy) {
  if (enemy.attackTimer <= 0) {
    return false;
  }

  const elapsed = enemy.attackDuration - enemy.attackTimer;
  return elapsed >= 18 && elapsed <= 30;
}

function getEnemyAttackHitbox(enemy) {
  const attackWidth = 54;
  const attackHeight = 34;

  return {
    x: enemy.attackDirection === 1 ? enemy.x + enemy.width - 2 : enemy.x - attackWidth + 2,
    y: enemy.y + 2,
    width: attackWidth,
    height: attackHeight
  };
}

function getBlockedEnemyAttackHitbox(enemy) {
  const rawHitbox = getEnemyAttackHitbox(enemy);
  return getClippedHitboxByWalls(rawHitbox, enemy, enemy.attackDirection);
}

function getEnemyContactHitbox(enemy) {
  if (enemy.type === "flying") {
    return {
      x: enemy.x - 6,
      y: enemy.y - 8,
      width: enemy.width + 12,
      height: enemy.height + 18
    };
  }

  return enemy;
}

function moveEnemyHorizontally(enemy) {
  enemy.x += enemy.vx;

  if (enemy.x < enemy.minX) {
    enemy.x = enemy.minX;
    enemy.patrolDirection = 1;
    enemy.targetDirection = 1;
    enemy.vx = Math.abs(enemy.speed);
  }

  if (enemy.x + enemy.width > enemy.maxX) {
    enemy.x = enemy.maxX - enemy.width;
    enemy.patrolDirection = -1;
    enemy.targetDirection = -1;
    enemy.vx = -Math.abs(enemy.speed);
  }

  for (const object of getSolidObjects()) {
    if (!isColliding(enemy, object)) {
      continue;
    }

    if (enemy.vx > 0) {
      enemy.x = object.x - enemy.width;
      enemy.patrolDirection = -1;
      enemy.targetDirection = -1;
    } else if (enemy.vx < 0) {
      enemy.x = object.x + object.width;
      enemy.patrolDirection = 1;
      enemy.targetDirection = 1;
    }

    enemy.vx = 0;
    enemy.aiDecisionTimer = 16;
  }
}

function knockbackEnemy(enemy, direction, distance) {
  for (let i = 0; i < distance; i++) {
    enemy.x += direction;
    let blocked = false;

    if (enemy.x < enemy.minX) {
      enemy.x = enemy.minX;
      blocked = true;
    }

    if (enemy.x + enemy.width > enemy.maxX) {
      enemy.x = enemy.maxX - enemy.width;
      blocked = true;
    }

    for (const object of getSolidObjects()) {
      if (enemy.type !== "flying" && isColliding(enemy, object)) {
        enemy.x -= direction;
        blocked = true;
        break;
      }
    }

    if (blocked) {
      break;
    }
  }
}

function startBossFightIfNeeded() {
  const playerEnteredBossRoom = player.x > 5460;

  if (!playerEnteredBossRoom) {
    return;
  }

  if (!boss.alive || gameState.bossDefeated) {
    gameState.bossRoomLocked = false;
    return;
  }

  if (!gameState.bossFightStarted) {
    gameState.bossFightStarted = true;
    gameState.bossRoomLocked = true;
    gameState.bossStartBannerTimer = 120;
    boss.patternIndex = 0;
    boss.attackCooldown = 18;
    camera.bossFocusTimer = 100;
    gameState.message = "보스방이 봉인되었습니다. 기억 파수자와의 전투가 시작됩니다.";
    spawnBossIntroParticles();
    startScreenShake(22, 7);
    return;
  }

  if (!gameState.bossRoomLocked) {
    gameState.bossRoomLocked = true;
    gameState.message = "보스방이 다시 봉인되었습니다.";
    startScreenShake(10, 3);
  }
}

function spawnBossIntroParticles() {
  for (let i = 0; i < 50; i++) {
    const angle = (Math.PI * 2 * i) / 50;
    addDashStreak(
      centerX(boss),
      centerY(boss),
      Math.cos(angle) * (1.3 + Math.random() * 3.0),
      Math.sin(angle) * (1.3 + Math.random() * 3.0),
      12 + Math.random() * 22,
      2 + Math.random() * 4,
      24 + Math.random() * 18,
      i % 2 === 0 ? "rgba(251, 113, 133, 1)" : "rgba(125, 211, 252, 1)",
      angle
    );
  }
}

function isBossPhaseTwo() {
  return boss.health <= boss.maxHealth / 2;
}

function updateBoss() {
  if (!boss.alive) {
    return;
  }

  const playerInBossRoom = player.x > 5400;

  if (!playerInBossRoom) {
    return;
  }

  if (isBossPhaseTwo() && !boss.phaseTwoAnnounced) {
    boss.phaseTwoAnnounced = true;
    gameState.bossPhaseBannerTimer = 130;
    gameState.message = "기억 파수자가 2페이즈에 돌입했습니다. 패턴이 더 빠르고 촘촘해집니다.";
    startScreenShake(28, 9);
    spawnBossIntroParticles();
  }

  if (boss.hitTimer > 0) {
    boss.hitTimer -= 1;
  }

  if (boss.contactCooldown > 0) {
    boss.contactCooldown -= 1;
  }

  if (boss.attackCooldown > 0) {
    boss.attackCooldown -= 1;
  }

  boss.speed = isBossPhaseTwo() ? 1.85 : 1.25;
  boss.attackCooldownMax = isBossPhaseTwo() ? 58 : 78;
  boss.facing = centerX(player) >= centerX(boss) ? 1 : -1;

  if (boss.attackTimer > 0) {
    updateBossCurrentAttack();
    return;
  }

  boss.hidden = false;
  boss.alpha = 1;
  boss.y = boss.baseY;

  const distanceX = centerX(player) - centerX(boss);

  if (Math.abs(distanceX) < 740 && boss.attackCooldown <= 0) {
    chooseBossPattern();
    boss.patternIndex += 1;
    return;
  }

  if (Math.abs(distanceX) > 80) {
    boss.vx = boss.facing * boss.speed;
  } else {
    boss.vx *= 0.8;
  }

  boss.x += boss.vx;
  boss.x = clamp(boss.x, boss.minX, boss.maxX - boss.width);
}

function updateBossCurrentAttack() {
  if (boss.attackType === "shardRain") {
    updateBossShardRainAttack();
    return;
  }

  if (boss.attackType === "shockwave") {
    updateBossShockwaveAttack();
    return;
  }

  if (boss.attackType === "jumpSlam") {
    updateBossJumpSlamAttack();
    return;
  }

  if (boss.attackType === "teleportSlam") {
    updateBossTeleportSlamAttack();
    return;
  }

  if (boss.attackType === "laser") {
    updateBossLaserAttack();
  }
}

function chooseBossPattern() {
  if (isBossPhaseTwo()) {
    chooseBossPhaseTwoPattern();
  } else {
    chooseBossPhaseOnePattern();
  }
}

function chooseBossPhaseOnePattern() {
  const patternOrder = ["shardRain", "shockwave", "teleportSlam", "jumpSlam", "laser", "shardRain", "shockwave"];
  startBossPattern(patternOrder[boss.patternIndex % patternOrder.length]);
}

function chooseBossPhaseTwoPattern() {
  const patternOrder = ["shardRain", "teleportSlam", "laser", "jumpSlam", "shardRain", "shockwave", "teleportSlam", "laser"];
  startBossPattern(patternOrder[boss.patternIndex % patternOrder.length]);
}

function startBossPattern(patternType) {
  if (patternType === "shardRain") {
    startBossShardRainAttack();
    return;
  }

  if (patternType === "shockwave") {
    startBossShockwaveAttack();
    return;
  }

  if (patternType === "jumpSlam") {
    startBossJumpSlamAttack();
    return;
  }

  if (patternType === "teleportSlam") {
    startBossTeleportSlamAttack();
    return;
  }

  if (patternType === "laser") {
    startBossLaserAttack();
  }
}

function startBossShardRainAttack() {
  boss.attackType = "shardRain";
  boss.attackDuration = isBossPhaseTwo() ? 104 : 122;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.vx = 0;
  boss.y = boss.baseY;
  boss.hidden = false;
  boss.alpha = 1;
  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 기억 파편이 빠르게 쏟아집니다. 파란 표식을 피하세요."
    : "기억 파편 낙하가 시작됩니다. 바닥의 파란 표식을 피하세요.";
  startScreenShake(8, 3);
  spawnMemoryShardWarningNearPlayer(42);
  spawnMemoryShardWarningRandom(52);
}

function updateBossShardRainAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const interval = isBossPhaseTwo() ? 8 : 12;
  boss.vx = 0;
  boss.y = boss.baseY;

  if (elapsed > 10 && elapsed < boss.attackDuration - 12 && elapsed % interval === 0) {
    if (Math.random() < 0.72) {
      spawnMemoryShardWarningNearPlayer(isBossPhaseTwo() ? 32 : 40);
    } else {
      spawnMemoryShardWarningRandom(isBossPhaseTwo() ? 32 : 40);
    }
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function spawnMemoryShardWarningNearPlayer(delay) {
  const warningX = centerX(player) + (Math.random() - 0.5) * 190;
  spawnMemoryShardWarning(warningX, delay);
}

function spawnMemoryShardWarningRandom(delay) {
  const warningX = 5480 + Math.random() * 690;
  spawnMemoryShardWarning(warningX, delay);
}

function spawnMemoryShardWarning(x, delay) {
  shardWarnings.push({
    x: clamp(x, 5460, 6220),
    y: 420,
    timer: delay,
    maxTimer: delay
  });
}

function updateShardWarnings() {
  for (let i = shardWarnings.length - 1; i >= 0; i--) {
    const warning = shardWarnings[i];
    warning.timer -= 1;

    if (warning.timer <= 0) {
      spawnMemoryShardFromWarning(warning);
      shardWarnings.splice(i, 1);
    }
  }
}

function spawnMemoryShardFromWarning(warning) {
  projectiles.push({
    type: "memoryShard",
    x: warning.x - 10,
    y: 130,
    width: 20,
    height: 28,
    vx: 0,
    vy: isBossPhaseTwo() ? 6.3 : 5.1,
    life: 95,
    sourceName: boss.name
  });

  for (let i = 0; i < 6; i++) {
    addDashStreak(
      warning.x,
      150,
      (Math.random() - 0.5) * 1.2,
      0.5 + Math.random() * 1.2,
      8 + Math.random() * 8,
      2 + Math.random() * 2,
      18 + Math.random() * 8,
      "rgba(125, 211, 252, 1)",
      Math.random() * Math.PI
    );
  }
}

function startBossShockwaveAttack() {
  boss.attackType = "shockwave";
  boss.attackDuration = isBossPhaseTwo() ? 42 : 52;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.vx = 0;
  boss.y = boss.baseY;
  boss.hidden = false;
  boss.alpha = 1;
  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 기억 파수자가 빠르게 충격파를 준비합니다."
    : "기억 파수자가 바닥을 내려칠 준비를 합니다.";
}

function updateBossShockwaveAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const fireFrame = isBossPhaseTwo() ? 21 : 27;
  boss.vx = 0;
  boss.y = boss.baseY;

  if (!boss.attackFired && elapsed >= fireFrame) {
    boss.attackFired = true;
    spawnBossShockwaves();
    spawnBossSlamParticles();
    startScreenShake(isBossPhaseTwo() ? 16 : 14, isBossPhaseTwo() ? 6 : 5);
    gameState.message = "기억 파수자가 충격파를 방출했습니다.";
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function startBossJumpSlamAttack() {
  const playerCenterX = centerX(player);
  boss.attackType = "jumpSlam";
  boss.attackDuration = isBossPhaseTwo() ? 70 : 82;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.slamHitDone = false;
  boss.startX = boss.x;
  boss.targetX = clamp(playerCenterX - boss.width / 2, boss.minX, boss.maxX - boss.width);
  boss.vx = 0;
  boss.hidden = false;
  boss.alpha = 1;
  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 기억 파수자가 더 빠르게 내려찍기를 준비합니다."
    : "기억 파수자가 점프 내려찍기를 준비합니다.";
}

function updateBossJumpSlamAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const prepEnd = isBossPhaseTwo() ? 13 : 17;
  const flightEnd = isBossPhaseTwo() ? 49 : 59;

  if (elapsed < prepEnd) {
    boss.x = boss.startX;
    boss.y = boss.baseY;
  } else if (elapsed < flightEnd) {
    const t = (elapsed - prepEnd) / (flightEnd - prepEnd);
    boss.x = boss.startX + (boss.targetX - boss.startX) * t;
    boss.y = boss.baseY - Math.sin(t * Math.PI) * 165;
  } else {
    boss.x = boss.targetX;
    boss.y = boss.baseY;

    if (!boss.slamHitDone) {
      boss.slamHitDone = true;
      spawnBossShockwaves();
      spawnBossSlamParticles();
      startScreenShake(isBossPhaseTwo() ? 18 : 15, isBossPhaseTwo() ? 7 : 5.5);
      gameState.message = "기억 파수자가 착지하며 충격파를 일으켰습니다.";

      if (!isPlayerDamageInvincible() && isColliding(player, getBossSlamHitbox())) {
        takeDamage(boss, "보스의 내려찍기에 맞았습니다.");
      }
    }
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function startBossTeleportSlamAttack() {
  const playerCenterX = centerX(player);
  boss.attackType = "teleportSlam";
  boss.attackDuration = isBossPhaseTwo() ? 66 : 78;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.slamHitDone = false;
  boss.startX = boss.x;
  boss.targetX = clamp(playerCenterX - boss.width / 2, boss.minX, boss.maxX - boss.width);
  boss.targetY = boss.baseY;
  boss.vx = 0;
  boss.hidden = false;
  boss.alpha = 1;
  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 기억 파수자가 순간이동 내려찍기를 준비합니다."
    : "기억 파수자가 순간이동하려 합니다. 붉은 표식을 피하세요.";
  spawnBossTeleportParticles(centerX(boss), centerY(boss));
  startScreenShake(8, 3);
}

function updateBossTeleportSlamAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const vanishFrame = 12;
  const appearFrame = isBossPhaseTwo() ? 32 : 38;
  const impactFrame = isBossPhaseTwo() ? 40 : 48;

  if (elapsed < vanishFrame) {
    boss.alpha = 1 - elapsed / vanishFrame;
    boss.hidden = false;
  } else if (elapsed < appearFrame) {
    boss.alpha = 0.12;
    boss.hidden = true;
    boss.x = boss.startX;
    boss.y = boss.baseY;
  } else if (elapsed < impactFrame) {
    boss.hidden = false;
    boss.alpha = (elapsed - appearFrame) / (impactFrame - appearFrame);
    boss.x = boss.targetX;
    boss.y = boss.baseY - 160 + (elapsed - appearFrame) * 5;
  } else {
    boss.hidden = false;
    boss.alpha = 1;
    boss.x = boss.targetX;
    boss.y = boss.baseY;

    if (!boss.slamHitDone) {
      boss.slamHitDone = true;
      spawnBossTeleportParticles(centerX(boss), centerY(boss));
      spawnBossShockwaves();
      spawnBossSlamParticles();
      startScreenShake(isBossPhaseTwo() ? 20 : 17, isBossPhaseTwo() ? 8 : 6);
      gameState.message = "기억 파수자가 순간이동 후 내려찍었습니다.";

      if (!isPlayerDamageInvincible() && isColliding(player, getBossTeleportSlamHitbox())) {
        takeDamage(boss, "순간이동 내려찍기에 맞았습니다.");
      }
    }
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function startBossLaserAttack() {
  boss.attackType = "laser";
  boss.attackDuration = isBossPhaseTwo() ? 70 : 82;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.laserHitDone = false;
  boss.vx = 0;
  boss.hidden = false;
  boss.alpha = 1;
  boss.laserDirection = centerX(player) >= centerX(boss) ? 1 : -1;
  boss.facing = boss.laserDirection;
  boss.laserY = clamp(player.y + 16, 245, 392);
  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 보스가 빠르게 가로 레이저를 충전합니다."
    : "기억 파수자가 가로 레이저를 충전합니다. 높이를 보고 피하세요.";
  startScreenShake(6, 2.5);
}

function updateBossLaserAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const chargeEnd = isBossPhaseTwo() ? 32 : 40;
  const activeEnd = isBossPhaseTwo() ? 48 : 58;
  boss.vx = 0;
  boss.y = boss.baseY;

  if (elapsed === chargeEnd) {
    boss.attackFired = true;
    spawnBossLaserParticles();
    startScreenShake(isBossPhaseTwo() ? 18 : 15, isBossPhaseTwo() ? 7 : 6);
    gameState.message = "기억 파수자가 레이저를 발사했습니다.";
  }

  if (elapsed >= chargeEnd && elapsed <= activeEnd) {
    if (frameCount % 3 === 0) {
      spawnBossLaserParticles();
    }

    if (!boss.laserHitDone && !isPlayerDamageInvincible() && isColliding(player, getBossLaserHitbox())) {
      boss.laserHitDone = true;
      takeDamage(boss, "가로 레이저에 맞았습니다.");
    }
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function finishBossAttack() {
  boss.attackType = "none";
  boss.attackFired = false;
  boss.slamHitDone = false;
  boss.laserHitDone = false;
  boss.hidden = false;
  boss.alpha = 1;
  boss.attackCooldown = boss.attackCooldownMax;
  boss.y = boss.baseY;
}

function getBossSlamHitbox() {
  return {
    x: boss.x - 35,
    y: boss.baseY + boss.height - 38,
    width: boss.width + 70,
    height: 44
  };
}

function getBossTeleportSlamHitbox() {
  return {
    x: boss.targetX - 48,
    y: boss.baseY + boss.height - 45,
    width: boss.width + 96,
    height: 52
  };
}

function getBossLaserHitbox() {
  if (boss.laserDirection === 1) {
    return {
      x: boss.x + boss.width - 4,
      y: boss.laserY,
      width: boss.maxX - boss.x,
      height: isBossPhaseTwo() ? 30 : 26
    };
  }

  return {
    x: boss.minX,
    y: boss.laserY,
    width: boss.x - boss.minX + 4,
    height: isBossPhaseTwo() ? 30 : 26
  };
}

function spawnBossShockwaves() {
  const waveY = boss.baseY + boss.height - 18;
  const waveSpeed = isBossPhaseTwo() ? 5.2 : 4.2;
  const waveLife = isBossPhaseTwo() ? 120 : 110;

  projectiles.push({
    type: "bossWave",
    x: boss.x - 26,
    y: waveY,
    width: 30,
    height: 16,
    vx: -waveSpeed,
    vy: 0,
    life: waveLife,
    sourceName: boss.name
  });

  projectiles.push({
    type: "bossWave",
    x: boss.x + boss.width - 4,
    y: waveY,
    width: 30,
    height: 16,
    vx: waveSpeed,
    vy: 0,
    life: waveLife,
    sourceName: boss.name
  });
}

function damageBoss(direction) {
  if (!boss.alive) {
    return;
  }

  if (boss.hitByAttackId === player.attackId) {
    return;
  }

  boss.hitByAttackId = player.attackId;
  boss.health -= 1;
  boss.hitTimer = 18;
  boss.x += direction * 8;
  boss.x = clamp(boss.x, boss.minX, boss.maxX - boss.width);
  gainCoreEnergy(1);
  startHitStop(6);
  startScreenShake(9, 5);
  addFloatingText("-1", centerX(boss), boss.y - 10, "#fecdd3");
  spawnHitParticles(centerX(boss), centerY(boss), direction);

  if (boss.health <= 0) {
    defeatBoss();
  } else if (isBossPhaseTwo()) {
    gameState.message = "2페이즈입니다. 패턴이 더 빠르게 이어집니다.";
  } else {
    gameState.message = "기억 파수자에게 공격이 맞았습니다.";
  }
}

function defeatBoss() {
  boss.alive = false;
  boss.defeatStarted = true;
  gameState.bossDefeated = true;
  gameState.bossRoomLocked = false;
  gameState.bossClearEffectTimer = 150;
  gameState.message = "기억 파수자를 쓰러뜨렸습니다. 보스방 봉인이 풀리고 원점 코어가 드러났습니다.";
  shardWarnings.length = 0;

  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].type === "bossWave" || projectiles[i].type === "memoryShard") {
      projectiles.splice(i, 1);
    }
  }

  spawnBossDefeatBurst();
  startScreenShake(28, 10);
  addFloatingText("BOSS CLEAR", centerX(boss), boss.y - 28, "#e0f2fe");
}

function spawnEnemyProjectile(enemy) {
  const direction = enemy.shootDirection;

  projectiles.push({
    type: "enemyBullet",
    x: direction === 1 ? enemy.x + enemy.width : enemy.x - 18,
    y: enemy.y + enemy.height / 2 - 4,
    width: 18,
    height: 8,
    vx: direction * 4.6,
    vy: 0,
    life: 150,
    sourceName: enemy.name
  });

  gameState.message = enemy.name + "가 투사체를 발사했습니다.";
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.life -= 1;
    let removeProjectile = false;
    let hitWall = false;

    if (projectile.life <= 0) {
      removeProjectile = true;
    }

    if (projectile.x < -100 || projectile.x > world.width + 100) {
      removeProjectile = true;
    }

    if (projectile.type === "memoryShard" && projectile.y > 455) {
      removeProjectile = true;
    }

    if (projectile.type !== "memoryShard") {
      for (const object of getSolidObjects()) {
        if (isColliding(projectile, object)) {
          removeProjectile = true;
          hitWall = true;
          break;
        }
      }
    }

    if (removeProjectile) {
      if (projectile.type === "memoryShard") {
        spawnMemoryShardImpact(projectile);
      } else if (hitWall) {
        spawnWallSparkParticles(
          projectile.vx > 0 ? projectile.x + projectile.width : projectile.x,
          projectile.y + projectile.height / 2,
          projectile.vx > 0 ? -1 : 1
        );
        startScreenShake(3, 1.8);
      }

      projectiles.splice(i, 1);
    }
  }
}

function spawnMemoryShardImpact(projectile) {
  for (let i = 0; i < 10; i++) {
    addDashStreak(
      projectile.x + projectile.width / 2,
      420,
      (Math.random() - 0.5) * 2.2,
      -0.3 - Math.random() * 1.5,
      8 + Math.random() * 10,
      2 + Math.random() * 3,
      12 + Math.random() * 8,
      "rgba(125, 211, 252, 1)",
      Math.random() * Math.PI
    );
  }
}

function checkProjectileDamage() {
  if (isPlayerDamageInvincible()) {
    return;
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];

    if (!isColliding(projectile, player)) {
      continue;
    }

    const damageSource = { x: projectile.x, width: projectile.width };
    projectiles.splice(i, 1);

    if (projectile.type === "bossWave") {
      takeDamage(damageSource, "보스의 충격파에 맞았습니다.");
    } else if (projectile.type === "memoryShard") {
      takeDamage(damageSource, "떨어지는 기억 파편에 맞았습니다.");
    } else {
      takeDamage(damageSource, "원거리 투사체에 맞았습니다.");
    }

    return;
  }
}

function checkAttackHits() {
  if (player.attackTimer <= 0) {
    return;
  }

  const rawHitbox = getAttackHitbox();
  let hitbox = rawHitbox;

  if (player.attackDirection === "side") {
    hitbox = getClippedHitboxByWalls(rawHitbox, player, player.facing);
  }

  if (player.attackDirection === "side" && isHitboxClipped(rawHitbox, hitbox)) {
    if (player.lastWallSparkAttackId !== player.attackId) {
      player.lastWallSparkAttackId = player.attackId;
      const point = getWallSparkPoint(hitbox, player.facing);
      spawnWallSparkParticles(point.x, point.y, -player.facing);
      gameState.message = "공격이 벽에 막혔습니다.";
    }
  }

  if (hitbox.width <= 2 || hitbox.height <= 2) {
    return;
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.hitByAttackId === player.attackId) {
      continue;
    }

    if (isColliding(hitbox, enemy)) {
      enemy.hitByAttackId = player.attackId;
      enemy.health -= 1;
      enemy.hitTimer = 18;
      enemy.invincibleTimer = 12;
      gainCoreEnergy(1);

      if (player.attackDirection === "side") {
        knockbackEnemy(enemy, player.facing, 16);
      } else {
        knockbackEnemy(enemy, player.facing, 6);
      }

      applyAttackRecoilOnHit(enemy);
      startHitStop(5);
      startScreenShake(8, 5);
      addFloatingText("-1", centerX(enemy), enemy.y - 8, "#fecaca");
      spawnHitParticles(centerX(enemy), centerY(enemy), player.facing);

      if (enemy.health <= 0) {
        enemy.alive = false;
        gameState.message = enemy.name + "를 쓰러뜨렸습니다. 코어 에너지 획득.";
      } else if (player.attackDirection !== "down") {
        gameState.message = enemy.name + "에게 공격이 맞았습니다. 코어 에너지 +1";
      }
    }
  }

  if (boss.alive && !boss.hidden && isColliding(hitbox, boss)) {
    applyAttackRecoilOnHit(boss);
    damageBoss(player.facing);
  }
}

function checkEnemyAttackDamage() {
  if (isPlayerDamageInvincible()) {
    return;
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type !== "melee") {
      continue;
    }

    if (!isEnemyAttackActive(enemy)) {
      continue;
    }

    if (enemy.attackHitPlayer) {
      continue;
    }

    const hitbox = getBlockedEnemyAttackHitbox(enemy);

    if (isColliding(hitbox, player)) {
      enemy.attackHitPlayer = true;
      takeDamage(enemy, enemy.name + "의 공격에 맞았습니다.");
      return;
    }
  }
}

function checkPlayerEnemyDamage() {
  if (player.isDashing) {
    return;
  }

  if (isPlayerDamageInvincible()) {
    return;
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type === "melee" && enemy.attackTimer > 0) {
      continue;
    }

    const contactBox = getEnemyContactHitbox(enemy);

    if (isColliding(player, contactBox)) {
      takeDamage(enemy, enemy.name + "와 부딪혀 체력이 1 감소했습니다.");
      return;
    }
  }

  if (boss.alive && !boss.hidden && player.x > 5400 && boss.contactCooldown <= 0 && isColliding(player, boss)) {
    boss.contactCooldown = 45;
    takeDamage(boss, "기억 파수자와 충돌했습니다.");
  }
}

function takeDamage(source, message) {
  if (player.healTimer > 0) {
    player.healTimer = 0;
    player.healingWillRestore = false;
  }

  player.health -= 1;
  player.invincibleTimer = 75;
  player.dashInvincibleTimer = 0;
  const playerCenterX = centerX(player);
  const sourceCenterX = source.x + source.width / 2;

  if (playerCenterX < sourceCenterX) {
    player.vx = -7;
    player.facing = 1;
  } else {
    player.vx = 7;
    player.facing = -1;
  }

  player.vy = -7;
  player.isDashing = false;
  startHitStop(4);
  startScreenShake(12, 7);
  spawnPlayerDamageParticles();
  addFloatingText("-1", centerX(player), player.y - 10, "#fca5a5");

  if (player.health <= 0) {
    respawnPlayer();
  } else {
    gameState.message = message;
  }
}

function updateGameStateTimers() {
  if (gameState.bossClearEffectTimer > 0) {
    gameState.bossClearEffectTimer -= 1;
  }

  if (gameState.bossPhaseBannerTimer > 0) {
    gameState.bossPhaseBannerTimer -= 1;
  }

  if (gameState.bossStartBannerTimer > 0) {
    gameState.bossStartBannerTimer -= 1;
  }
}

function updateEndingSequence() {
  if (!gameState.endingReached) {
    return;
  }

  gameState.endingFrame += 1;
  player.vx = 0;
  player.vy = 0;
  player.isDashing = false;
  player.attackTimer = 0;
  player.healTimer = 0;
  player.healingWillRestore = false;

  if (gameState.endingFrame >= 760) {
    gameState.endingInputUnlocked = true;
  }
}

function getPlayerState() {
  if (player.isDashing) {
    return "dash";
  }

  if (player.healTimer > 0) {
    return "heal";
  }

  if (player.attackTimer > 0) {
    return "attack";
  }

  if (player.isWallSliding) {
    return "wallSlide";
  }

  if (!player.onGround && player.vy < 0) {
    return "jump";
  }

  if (!player.onGround && player.vy >= 0) {
    return "fall";
  }

  if (Math.abs(player.vx) > 0.25) {
    return "walk";
  }

  return "idle";
}

function getStateName(state) {
  return characterVisuals[state] ? characterVisuals[state].name : "알 수 없음";
}

function updatePlayerAnimation() {
  const nextState = getPlayerState();

  if (nextState !== playerAnimation.state) {
    playerAnimation.previousState = playerAnimation.state;
    playerAnimation.state = nextState;
    playerAnimation.stateFrame = 0;
  } else {
    playerAnimation.stateFrame += 1;
  }
}

function updateCamera() {
  let targetX = centerX(player) - camera.width / 2;
  let targetY = centerY(player) - camera.height / 2;

  if (Math.abs(player.vx) > 0.5) {
    targetX += player.facing * camera.lookAheadX;
  }

  if (player.vy > 5 && !player.onGround) {
    targetY += camera.lookDownY;
  }

  if (gameState.bossFightStarted && player.x > 5400 && boss.alive) {
    const bossRoomCenterX = 5850;
    targetX = bossRoomCenterX - camera.width / 2;
    targetY = 0;

    if (camera.bossFocusTimer > 0) {
      camera.bossFocusTimer -= 1;
    }
  }

  targetX = clamp(targetX, 0, world.width - camera.width);
  targetY = clamp(targetY, 0, world.height - camera.height);

  camera.x += (targetX - camera.x) * camera.smoothness;
  camera.y += (targetY - camera.y) * camera.smoothness;

  if (Math.abs(targetX - camera.x) < 0.05) {
    camera.x = targetX;
  }

  if (Math.abs(targetY - camera.y) < 0.05) {
    camera.y = targetY;
  }

  camera.x = clamp(camera.x, 0, world.width - camera.width);
  camera.y = clamp(camera.y, 0, world.height - camera.height);

  updateScreenShake();
}

function updateProjectilesAndDamage() {
  updateProjectiles();
  checkProjectileDamage();
}

function update() {
  frameCount += 1;

  if (hitStopTimer > 0) {
    hitStopTimer -= 1;
    updateParticles();
    updateFloatingTexts();
    updateCamera();
    return;
  }

  updateGameStateTimers();

  if (gameState.endingReached) {
    updateEndingSequence();
    updatePlayerAnimation();
    updateParticles();
    updateFloatingTexts();
    updateCamera();
    return;
  }

  updatePlayer();
  startBossFightIfNeeded();
  updatePlayerAnimation();
  updatePlayerCombat();
  updateEnemies();
  updateBoss();
  updateShardWarnings();
  updateProjectilesAndDamage();
  checkAttackHits();
  checkEnemyAttackDamage();
  checkPlayerEnemyDamage();
  updateParticles();
  updateFloatingTexts();
  updateCamera();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawRoomBackgrounds() {
  for (const room of rooms) {
    ctx.fillStyle = room.color;
    ctx.fillRect(room.x - camera.x, 0 - camera.y, room.width, world.height);
  }

  for (const room of rooms) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x - camera.x, 0 - camera.y, room.width, world.height);
  }
}

function drawBackgroundDecorations() {
  for (let x = 180; x < world.width; x += 360) {
    ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
    ctx.fillRect(x - camera.x, 120 - camera.y, 70, 300);
  }

  for (let x = 0; x < world.width; x += 120) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(x - camera.x, 0 - camera.y, 2, world.height);
  }
}

function drawBossRoomDecorations() {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#7dd3fc";
  ctx.lineWidth = 2;

  for (let x = 5480; x <= 6220; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x - camera.x, 80 - camera.y);
    ctx.lineTo(x + 35 - camera.x, 390 - camera.y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#38bdf8";

  for (let x = 5520; x <= 6180; x += 160) {
    ctx.beginPath();
    ctx.arc(x - camera.x, 155 - camera.y, 22 + Math.sin(frameCount * 0.04 + x) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.arc(5850 - camera.x, 250 - camera.y, 120 + Math.sin(frameCount * 0.035) * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlatforms() {
  for (const platform of platforms) {
    const screenX = platform.x - camera.x;
    const screenY = platform.y - camera.y;

    if (platform.wallJumpTest) {
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(screenX, screenY, platform.width, platform.height);
      ctx.fillStyle = "rgba(167, 243, 208, 0.65)";
      ctx.fillRect(screenX, screenY, 5, platform.height);
      ctx.fillRect(screenX + platform.width - 5, screenY, 5, platform.height);
      ctx.strokeStyle = "rgba(167, 243, 208, 0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, platform.width, platform.height);
    } else if (platform.requiresDoubleJump) {
      ctx.fillStyle = player.hasDoubleJump ? "#4c1d95" : "rgba(76, 29, 149, 0.42)";
      ctx.fillRect(screenX, screenY, platform.width, platform.height);
      ctx.fillStyle = player.hasDoubleJump ? "#a78bfa" : "rgba(167, 139, 250, 0.45)";
      ctx.fillRect(screenX, screenY, platform.width, 5);
      ctx.strokeStyle = "rgba(216, 180, 254, 0.75)";
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, platform.width, platform.height);
    } else {
      ctx.fillStyle = "#475569";
      ctx.fillRect(screenX, screenY, platform.width, platform.height);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(screenX, screenY, platform.width, 5);
    }
  }
}

function drawDoors() {
  for (const door of doors) {
    const screenX = door.x - camera.x;
    const screenY = door.y - camera.y;

    if (door.requiresMemoryCores) {
      drawMemoryCoreDoor(door, screenX, screenY);
      continue;
    }

    if (door.requiresMemoryFragments) {
      drawMemoryFragmentDoor(door, screenX, screenY);
      continue;
    }

    drawNormalDoor(door, screenX, screenY);
  }
}

function drawMemoryCoreDoor(door, screenX, screenY) {
  if (door.open) {
    ctx.fillStyle = "rgba(14, 165, 233, 0.22)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "13px Arial";
    ctx.fillText("열린 최종 문", screenX - 26, screenY - 8);
  } else {
    ctx.fillStyle = "rgba(14, 116, 144, 0.58)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "13px Arial";
    ctx.fillText("기억 핵 1개 필요", screenX - 40, screenY - 8);
  }
}

function drawMemoryFragmentDoor(door, screenX, screenY) {
  if (door.open) {
    ctx.fillStyle = "rgba(168, 85, 247, 0.22)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#c4b5fd";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#ddd6fe";
    ctx.font = "13px Arial";
    ctx.fillText("열린 기억의 문", screenX - 28, screenY - 8);
  } else {
    ctx.fillStyle = "rgba(126, 34, 206, 0.58)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#fef3c7";
    ctx.font = "13px Arial";
    ctx.fillText("기억 조각 1개 필요", screenX - 44, screenY - 8);
  }
}

function drawNormalDoor(door, screenX, screenY) {
  if (door.locked && !door.open) {
    ctx.fillStyle = "rgba(248, 113, 113, 0.55)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#fee2e2";
    ctx.font = "13px Arial";
    ctx.fillText(door.text, screenX - 10, screenY - 8);
  } else if (door.locked && door.open) {
    ctx.fillStyle = "rgba(34, 197, 94, 0.28)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#86efac";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#bbf7d0";
    ctx.font = "13px Arial";
    ctx.fillText("열린 문", screenX - 7, screenY - 8);
  } else {
    ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "13px Arial";
    ctx.fillText(door.text, screenX - 3, screenY - 8);
  }
}

function drawBossArenaGates() {
  if (!isBossGateActive()) {
    return;
  }

  for (const gate of bossArenaGates) {
    const screenX = gate.x - camera.x;
    const screenY = gate.y - camera.y;
    const pulse = Math.sin(frameCount * 0.15) * 0.12 + 0.58;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(screenX, screenY, gate.width, gate.height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#fecdd3";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, gate.width, gate.height);
    ctx.fillStyle = "#fecdd3";
    ctx.font = "13px Arial";
    ctx.fillText("봉인", screenX - 2, screenY - 8);
    ctx.restore();
  }
}

function drawKeyItem() {
  if (keyItem.collected) {
    return;
  }

  const screenX = keyItem.x - camera.x;
  const screenY = keyItem.y - camera.y;
  ctx.fillStyle = "#facc15";
  ctx.fillRect(screenX, screenY + 8, 18, 8);
  ctx.fillRect(screenX + 14, screenY + 4, 8, 16);
  ctx.fillRect(screenX + 20, screenY + 10, 5, 5);
  ctx.fillStyle = "#fef08a";
  ctx.font = "13px Arial";
  ctx.fillText("열쇠", screenX - 4, screenY - 8);
}

function drawAbilityItems() {
  for (const item of abilityItems) {
    if (item.collected) {
      continue;
    }

    const screenX = item.x - camera.x;
    const screenY = item.y - camera.y;
    const pulse = Math.sin(frameCount * 0.12) * 3;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#c4b5fd";
    ctx.beginPath();
    ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 22 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#312e81";
    ctx.strokeStyle = "#c4b5fd";
    ctx.lineWidth = 2;
    drawRoundedRect(screenX, screenY, item.width, item.height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#e9d5ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY + 18);
    ctx.quadraticCurveTo(screenX + 14, screenY + 7, screenX + 20, screenY + 18);
    ctx.stroke();
    ctx.fillStyle = "#ede9fe";
    ctx.font = "13px Arial";
    ctx.fillText(item.name, screenX - 12, screenY - 10);
    ctx.restore();
  }
}

function drawRewardItems() {
  for (const item of rewardItems) {
    if (item.collected) {
      continue;
    }

    if (item.requiresBossDefeated && !gameState.bossDefeated) {
      continue;
    }

    const screenX = item.x - camera.x;
    const screenY = item.y - camera.y;
    const pulse = Math.sin(frameCount * 0.14) * 3;
    ctx.save();

    if (item.type === "originCore") {
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = "#7dd3fc";
      ctx.beginPath();
      ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 28 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#0c4a6e";
      ctx.strokeStyle = "#e0f2fe";
    } else if (item.type === "memoryCore") {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#c4b5fd";
      ctx.beginPath();
      ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 24 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#581c87";
      ctx.strokeStyle = "#e9d5ff";
    } else {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 20 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#78350f";
      ctx.strokeStyle = "#fde68a";
    }

    ctx.lineWidth = 2;
    drawRoundedRect(screenX, screenY, item.width, item.height, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = item.type === "originCore" ? "#e0f2fe" : item.type === "memoryCore" ? "#f5d0fe" : "#fef3c7";
    ctx.beginPath();
    ctx.arc(screenX + item.width / 2, screenY + item.height / 2, item.type === "originCore" ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "13px Arial";
    ctx.fillText(item.name, screenX - 14, screenY - 10);
    ctx.restore();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type === "flying") {
      drawFlyingEnemy(enemy);
    } else if (enemy.type === "shooter") {
      drawShooterEnemy(enemy);
    } else {
      drawMeleeEnemy(enemy);
    }
  }
}

function drawEnemyHealthBar(enemy, screenX, screenY) {
  const barWidth = 38;
  const barHeight = 5;
  const healthRatio = enemy.health / enemy.maxHealth;
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(screenX - 1, screenY - 13, barWidth, barHeight);
  ctx.fillStyle = "#f87171";
  ctx.fillRect(screenX - 1, screenY - 13, barWidth * healthRatio, barHeight);
}

function drawMeleeEnemy(enemy) {
  const screenX = enemy.x - camera.x;
  const screenY = enemy.y - camera.y;
  const facing = enemy.attackTimer > 0 ? enemy.attackDirection : enemy.vx >= 0 ? 1 : -1;
  ctx.save();

  if (enemy.hitTimer > 0) {
    ctx.translate(Math.sin(enemy.hitTimer * 2) * 2, 0);
    ctx.globalAlpha = 0.65;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(screenX + enemy.width / 2, screenY + enemy.height + 4, enemy.width / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.attackTimer > 0 ? "#3b1d1d" : enemy.hitTimer > 0 ? "#3f1f2a" : "#1f2937";
  ctx.strokeStyle = enemy.attackTimer > 0 ? "#fca5a5" : enemy.hitTimer > 0 ? "#fecaca" : "#94a3b8";
  ctx.lineWidth = enemy.attackTimer > 0 || enemy.hitTimer > 0 ? 3 : 2;
  ctx.beginPath();
  ctx.ellipse(screenX + enemy.width / 2, screenY + enemy.height / 2, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = enemy.attackTimer > 0 ? "#fecaca" : "#38bdf8";

  if (facing === 1) {
    ctx.fillRect(screenX + 20, screenY + 12, 4, 6);
    ctx.fillRect(screenX + 27, screenY + 12, 4, 6);
  } else {
    ctx.fillRect(screenX + 4, screenY + 12, 4, 6);
    ctx.fillRect(screenX + 11, screenY + 12, 4, 6);
  }

  drawEnemyHealthBar(enemy, screenX, screenY);
  ctx.restore();
}

function drawFlyingEnemy(enemy) {
  const screenX = enemy.x - camera.x;
  const screenY = enemy.y - camera.y;
  const wing = Math.sin(frameCount * 0.35) * 6;
  ctx.save();

  if (enemy.hitTimer > 0) {
    ctx.translate(Math.sin(enemy.hitTimer * 2) * 2, 0);
    ctx.globalAlpha = 0.65;
  }

  ctx.fillStyle = enemy.hitTimer > 0 ? "#4c1d2d" : "#1e1b4b";
  ctx.strokeStyle = enemy.hitTimer > 0 ? "#fecaca" : "#c4b5fd";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screenX + 8, screenY + 14);
  ctx.quadraticCurveTo(screenX - 10, screenY + 2 + wing, screenX - 2, screenY + 24);
  ctx.quadraticCurveTo(screenX + 8, screenY + 20, screenX + 12, screenY + 16);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(screenX + enemy.width - 8, screenY + 14);
  ctx.quadraticCurveTo(screenX + enemy.width + 10, screenY + 2 + wing, screenX + enemy.width + 2, screenY + 24);
  ctx.quadraticCurveTo(screenX + enemy.width - 8, screenY + 20, screenX + enemy.width - 12, screenY + 16);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(screenX + enemy.width / 2, screenY + enemy.height / 2, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(screenX + 11, screenY + 11, 4, 5);
  ctx.fillRect(screenX + 23, screenY + 11, 4, 5);
  drawEnemyHealthBar(enemy, screenX, screenY);
  ctx.restore();
}

function drawShooterEnemy(enemy) {
  const screenX = enemy.x - camera.x;
  const screenY = enemy.y - camera.y;
  const facing = enemy.shootDirection;
  ctx.save();

  if (enemy.hitTimer > 0) {
    ctx.translate(Math.sin(enemy.hitTimer * 2) * 2, 0);
    ctx.globalAlpha = 0.65;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(screenX + enemy.width / 2, screenY + enemy.height + 4, enemy.width / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.shootTimer > 0 ? "#3b1d1d" : "#10251f";
  ctx.strokeStyle = enemy.shootTimer > 0 ? "#fca5a5" : "#86efac";
  ctx.lineWidth = enemy.shootTimer > 0 ? 3 : 2;
  drawRoundedRect(screenX + 5, screenY + 2, 26, 38, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = enemy.shootTimer > 0 ? "#fecaca" : "#bbf7d0";
  ctx.beginPath();
  ctx.arc(screenX + 18, screenY + 18, enemy.shootTimer > 0 ? 7 : 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#020617";

  if (facing === 1) {
    ctx.fillRect(screenX + 22, screenY + 15, 4, 6);
  } else {
    ctx.fillRect(screenX + 10, screenY + 15, 4, 6);
  }

  drawEnemyHealthBar(enemy, screenX, screenY);
  ctx.restore();
}

function drawBoss() {
  if (!boss.alive) {
    return;
  }

  const screenX = boss.x - camera.x;
  const screenY = boss.y - camera.y;
  const pulse = Math.sin(frameCount * 0.08) * 3;
  const phaseTwo = isBossPhaseTwo();
  ctx.save();
  ctx.globalAlpha = boss.alpha;

  if (boss.hitTimer > 0) {
    ctx.translate(Math.sin(boss.hitTimer * 2.5) * 3, 0);
    ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.75);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.ellipse(screenX + boss.width / 2, boss.baseY - camera.y + boss.height + 6, boss.width / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (boss.attackTimer > 0) {
    ctx.globalAlpha = Math.min(0.35, boss.alpha);
    ctx.fillStyle = boss.attackType === "laser" ? "#fb7185" : boss.attackType === "teleportSlam" ? "#c4b5fd" : boss.attackType === "jumpSlam" ? "#facc15" : "#7dd3fc";
    ctx.beginPath();
    ctx.arc(screenX + boss.width / 2, screenY + boss.height / 2, 58 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = boss.alpha;
  }

  ctx.fillStyle = boss.hitTimer > 0 ? "#7f1d1d" : phaseTwo ? "#4c0519" : "#1e1b4b";
  ctx.strokeStyle = boss.attackTimer > 0 ? "#fb7185" : phaseTwo ? "#fecdd3" : "#c4b5fd";
  ctx.lineWidth = boss.attackTimer > 0 ? 4 : 3;
  drawRoundedRect(screenX + 10, screenY + 12, 52, 56, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = phaseTwo ? "#881337" : "#312e81";
  ctx.strokeStyle = "#e9d5ff";
  ctx.lineWidth = 2;
  drawRoundedRect(screenX + 14, screenY + 2, 44, 32, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = phaseTwo ? "#fecdd3" : "#e9d5ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(screenX + 19, screenY + 7);
  ctx.quadraticCurveTo(screenX + 8, screenY - 12, screenX + 4, screenY - 24);
  ctx.moveTo(screenX + 53, screenY + 7);
  ctx.quadraticCurveTo(screenX + 64, screenY - 12, screenX + 68, screenY - 24);
  ctx.stroke();
  ctx.fillStyle = boss.attackType === "laser" ? "#fecaca" : "#fef3c7";

  if (boss.facing === 1) {
    ctx.fillRect(screenX + 35, screenY + 16, 5, 8);
    ctx.fillRect(screenX + 47, screenY + 16, 5, 8);
  } else {
    ctx.fillRect(screenX + 20, screenY + 16, 5, 8);
    ctx.fillRect(screenX + 32, screenY + 16, 5, 8);
  }

  ctx.strokeStyle = phaseTwo ? "#fda4af" : "#7dd3fc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(screenX + 36, screenY + 43, 9 + pulse * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyAttacks() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type === "melee") {
      drawMeleeEnemyAttack(enemy);
    }

    if (enemy.type === "shooter") {
      drawShooterCharge(enemy);
    }
  }

  drawBossAttackWarning();
}

function drawMeleeEnemyAttack(enemy) {
  if (enemy.attackTimer <= 0) {
    return;
  }

  const hitbox = getBlockedEnemyAttackHitbox(enemy);

  if (hitbox.width <= 2) {
    return;
  }

  const screenX = hitbox.x - camera.x;
  const screenY = hitbox.y - camera.y;
  const active = isEnemyAttackActive(enemy);
  ctx.save();

  if (!active) {
    ctx.globalAlpha = 0.24 + Math.sin(frameCount * 0.35) * 0.08;
    ctx.fillStyle = "#ef4444";
    drawRoundedRect(screenX, screenY, hitbox.width, hitbox.height, 12);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "#fca5a5";
    ctx.lineWidth = 2;
    drawRoundedRect(screenX, screenY, hitbox.width, hitbox.height, 12);
    ctx.stroke();
    ctx.fillStyle = "#fecaca";
    ctx.font = "18px Arial";
    ctx.fillText("!", screenX + hitbox.width / 2 - 4, screenY - 6);
  } else {
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = "#ef4444";
    drawRoundedRect(screenX, screenY, hitbox.width, hitbox.height, 14);
    ctx.fill();
  }

  ctx.restore();
}

function drawShooterCharge(enemy) {
  if (enemy.shootTimer <= 0) {
    return;
  }

  const startX = enemy.shootDirection === 1 ? enemy.x + enemy.width : enemy.x;
  const startY = enemy.y + enemy.height / 2;
  const screenX = startX - camera.x;
  const screenY = startY - camera.y;
  ctx.save();
  ctx.globalAlpha = 0.25 + Math.sin(frameCount * 0.35) * 0.08;
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + enemy.shootDirection * 180, screenY);
  ctx.stroke();
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = "#fecaca";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + enemy.shootDirection * 180, screenY);
  ctx.stroke();
  ctx.fillStyle = "#fecaca";
  ctx.font = "18px Arial";
  ctx.fillText("!", screenX - 4, screenY - 18);
  ctx.restore();
}

function drawBossAttackWarning() {
  if (!boss.alive || boss.attackTimer <= 0) {
    return;
  }

  ctx.save();

  if (boss.attackType === "shardRain") {
    drawBossShardRainWarning();
  } else if (boss.attackType === "shockwave") {
    drawBossShockwaveWarning();
  } else if (boss.attackType === "jumpSlam") {
    drawBossJumpSlamWarning();
  } else if (boss.attackType === "teleportSlam") {
    drawBossTeleportSlamWarning();
  } else if (boss.attackType === "laser") {
    drawBossLaserWarning();
  }

  ctx.restore();
}

function drawBossShardRainWarning() {
  const screenX = boss.x - camera.x;
  const screenY = boss.y - camera.y;
  ctx.globalAlpha = 0.22 + Math.sin(frameCount * 0.3) * 0.08;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(5450 - camera.x, 70 - camera.y, 770, 40);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 22px Arial";
  ctx.fillText("기억 파편 낙하", screenX - 20, screenY - 22);
}

function drawBossShockwaveWarning() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const fireFrame = isBossPhaseTwo() ? 21 : 27;
  const screenX = boss.x - camera.x;
  const screenY = boss.baseY - camera.y;

  if (elapsed < fireFrame) {
    ctx.globalAlpha = 0.2 + Math.sin(frameCount * 0.35) * 0.08;
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(screenX - 170, screenY + boss.height - 18, boss.width + 340, 18);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#fecdd3";
    ctx.font = "22px Arial";
    ctx.fillText("!", screenX + boss.width / 2 - 5, screenY - 14);
  }
}

function drawBossJumpSlamWarning() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const prepEnd = isBossPhaseTwo() ? 13 : 17;
  const screenX = boss.targetX - camera.x;
  const screenY = boss.baseY - camera.y;
  ctx.globalAlpha = elapsed < prepEnd ? 0.24 + Math.sin(frameCount * 0.4) * 0.08 : 0.16 + Math.sin(frameCount * 0.4) * 0.06;
  ctx.fillStyle = "#facc15";
  drawRoundedRect(screenX - 45, screenY + boss.height - 28, boss.width + 90, 28, 10);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 3;
  drawRoundedRect(screenX - 45, screenY + boss.height - 28, boss.width + 90, 28, 10);
  ctx.stroke();
  ctx.fillStyle = "#fef3c7";
  ctx.font = "22px Arial";
  ctx.fillText("!", screenX + boss.width / 2 - 5, screenY - 18);
}

function drawBossTeleportSlamWarning() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const appearFrame = isBossPhaseTwo() ? 32 : 38;
  const screenX = boss.targetX + boss.width / 2 - camera.x;
  const groundY = boss.baseY + boss.height - camera.y;
  const progress = Math.min(1, elapsed / appearFrame);
  ctx.globalAlpha = 0.25 + progress * 0.45;
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.ellipse(screenX, groundY - 10, 42 + progress * 18, 12 + progress * 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#fecdd3";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(screenX, groundY - 10, 30 + progress * 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#fecdd3";
  ctx.font = "bold 20px Arial";
  ctx.fillText("순간이동", screenX - 38, groundY - 44);
}

function drawBossLaserWarning() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const chargeEnd = isBossPhaseTwo() ? 32 : 40;
  const activeEnd = isBossPhaseTwo() ? 48 : 58;
  const hitbox = getBossLaserHitbox();
  const screenX = hitbox.x - camera.x;
  const screenY = hitbox.y - camera.y;

  if (elapsed < chargeEnd) {
    const progress = elapsed / chargeEnd;
    ctx.globalAlpha = 0.22 + progress * 0.35;
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(screenX, screenY + hitbox.height / 2 - 3, hitbox.width, 6);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY + hitbox.height / 2);
    ctx.lineTo(screenX + hitbox.width, screenY + hitbox.height / 2);
    ctx.stroke();
    ctx.fillStyle = "#fecaca";
    ctx.font = "bold 18px Arial";
    ctx.fillText("레이저 충전", boss.x - camera.x - 30, boss.y - camera.y - 18);
  } else if (elapsed <= activeEnd) {
    ctx.globalAlpha = 0.48 + Math.sin(frameCount * 0.6) * 0.12;
    ctx.fillStyle = "#ef4444";
    drawRoundedRect(screenX, screenY, hitbox.width, hitbox.height, 12);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#fecaca";
    drawRoundedRect(screenX, screenY + hitbox.height / 2 - 4, hitbox.width, 8, 4);
    ctx.fill();
  }
}

function drawShardWarnings() {
  for (const warning of shardWarnings) {
    const screenX = warning.x - camera.x;
    const groundY = warning.y - camera.y;
    const progress = 1 - warning.timer / warning.maxTimer;
    const ringRadiusX = 18 + progress * 12;
    const ringRadiusY = 7 + progress * 3;
    ctx.save();
    ctx.globalAlpha = 0.25 + progress * 0.35;
    ctx.fillStyle = "#7dd3fc";
    ctx.beginPath();
    ctx.ellipse(screenX, groundY, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55 + progress * 0.35;
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX, 130 - camera.y);
    ctx.lineTo(screenX, groundY - 5);
    ctx.stroke();
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "16px Arial";
    ctx.fillText("!", screenX - 4, 120 - camera.y);
    ctx.restore();
  }
}

function drawProjectiles() {
  for (const projectile of projectiles) {
    const screenX = projectile.x - camera.x;
    const screenY = projectile.y - camera.y;
    ctx.save();

    if (projectile.type === "memoryShard") {
      drawMemoryShardProjectile(projectile, screenX, screenY);
      ctx.restore();
      continue;
    }

    if (projectile.type === "bossWave") {
      drawBossWaveProjectile(projectile, screenX, screenY);
    } else {
      drawEnemyBulletProjectile(projectile, screenX, screenY);
    }

    ctx.restore();
  }
}

function drawMemoryShardProjectile(projectile, screenX, screenY) {
  ctx.fillStyle = "rgba(125, 211, 252, 0.28)";
  drawRoundedRect(screenX - 7, screenY - 7, projectile.width + 14, projectile.height + 14, 8);
  ctx.fill();
  ctx.fillStyle = "#7dd3fc";
  ctx.beginPath();
  ctx.moveTo(screenX + projectile.width / 2, screenY);
  ctx.lineTo(screenX + projectile.width, screenY + projectile.height - 4);
  ctx.lineTo(screenX + projectile.width / 2, screenY + projectile.height);
  ctx.lineTo(screenX, screenY + projectile.height - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e0f2fe";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBossWaveProjectile(projectile, screenX, screenY) {
  ctx.fillStyle = "rgba(251, 113, 133, 0.25)";
  drawRoundedRect(screenX - 8, screenY - 6, projectile.width + 16, projectile.height + 12, 10);
  ctx.fill();
  ctx.fillStyle = "#fb7185";
  drawRoundedRect(screenX, screenY, projectile.width, projectile.height, 8);
  ctx.fill();
  ctx.fillStyle = "#fecdd3";
  drawRoundedRect(screenX + 4, screenY + 4, projectile.width - 8, projectile.height - 8, 4);
  ctx.fill();
}

function drawEnemyBulletProjectile(projectile, screenX, screenY) {
  ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
  drawRoundedRect(screenX - 6, screenY - 4, projectile.width + 12, projectile.height + 8, 8);
  ctx.fill();
  ctx.fillStyle = "#fca5a5";
  drawRoundedRect(screenX, screenY, projectile.width, projectile.height, 5);
  ctx.fill();
  ctx.fillStyle = "#fee2e2";
  drawRoundedRect(screenX + 3, screenY + 2, projectile.width - 6, projectile.height - 4, 3);
  ctx.fill();
}

function drawParticles() {
  ctx.save();

  for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;
    const screenX = particle.x - camera.x;
    const screenY = particle.y - camera.y;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(screenX, screenY);
    ctx.rotate(particle.rotation);

    if (particle.type === "dust") {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, particle.width * (1 + (1 - alpha) * 0.6), particle.height * alpha, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (particle.type === "dash") {
      ctx.fillStyle = particle.color;
      drawRoundedRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height, particle.height / 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = "#e0f2fe";
      drawRoundedRect(-particle.width / 2, -particle.height / 4, particle.width * 0.8, particle.height / 2, particle.height / 4);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

function drawFloatingTexts() {
  ctx.save();

  for (const text of floatingTexts) {
    const alpha = text.life / text.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = text.color;
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text.text, text.x - camera.x, text.y - camera.y);
  }

  ctx.textAlign = "left";
  ctx.restore();
}

function drawRoomLabels() {
  for (const room of rooms) {
    const screenX = room.x + 35 - camera.x;
    const screenY = 90 - camera.y;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "22px Arial";
    ctx.fillText(room.name, screenX, screenY);
    ctx.fillStyle = "rgba(203, 213, 225, 0.85)";
    ctx.font = "15px Arial";
    ctx.fillText(room.guide, screenX, screenY + 28);
  }
}

function drawWarnings() {
  const warnings = [
    { text: "낭떠러지", x: 845, y: 455 },
    { text: "이중 점프 후 돌아오면 진입 가능", x: 610, y: 115 },
    { text: "숨겨진 기억 조각", x: 910, y: 82 },
    { text: "근접 적", x: 1090, y: 370 },
    { text: "J 공격 / W+J 위 공격 / 공중 S+J 아래 공격", x: 1270, y: 270 },
    { text: "비행 적", x: 2010, y: 215 },
    { text: "이중 점프 능력", x: 2125, y: 305 },
    { text: "벽 미끄러짐 / 벽 점프 테스트", x: 2425, y: 178 },
    { text: "벽에 붙고 Space를 누르면 반대쪽으로 튕김", x: 2390, y: 195 },
    { text: "대시 필요", x: 2070, y: 455 },
    { text: "두 번째 근접 적", x: 2300, y: 370 },
    { text: "열쇠 획득 구간", x: 3040, y: 250 },
    { text: "열쇠 없이는 통과 불가", x: 3450, y: 280 },
    { text: "이중 점프 구간", x: 3860, y: 225 },
    { text: "원거리 적", x: 3890, y: 360 },
    { text: "기억 조각 1개 필요", x: 4390, y: 70 },
    { text: "기억 핵", x: 5085, y: 290 },
    { text: "기억 핵 1개 필요", x: 5300, y: 70 },
    { text: "보스방 입장 시 봉인", x: 5448, y: 325 },
    { text: "최종 보스: 파편 / 충격파 / 내려찍기 / 순간이동 / 레이저", x: 5580, y: 255 },
    { text: "보스를 쓰러뜨리면 원점 코어 출현", x: 5850, y: 270 }
  ];

  for (const warning of warnings) {
    ctx.fillStyle = "#facc15";
    ctx.font = "14px Arial";
    ctx.fillText(warning.text, warning.x - camera.x, warning.y - camera.y);
  }
}

function drawDashAfterImages(screenX, screenY, bob) {
  ctx.save();

  for (let i = 1; i <= 4; i++) {
    const offsetX = screenX - player.facing * i * 14;
    const alpha = 0.22 - i * 0.04;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = player.dashInvincibleTimer > 0 ? "#fef08a" : "#7dd3fc";
    drawRoundedRect(offsetX + 4, screenY + 7 + bob, 24, 32, 8);
    ctx.fill();
    ctx.fillStyle = "#e0f2fe";
    drawRoundedRect(offsetX + 8, screenY + 4 + bob, 16, 16, 6);
    ctx.fill();
  }

  ctx.restore();
}

function drawAttack() {
  if (player.attackTimer <= 0) {
    return;
  }

  const rawHitbox = getAttackHitbox();
  let hitbox = rawHitbox;

  if (player.attackDirection === "side") {
    hitbox = getClippedHitboxByWalls(rawHitbox, player, player.facing);
  }

  if (hitbox.width <= 2 || hitbox.height <= 2) {
    return;
  }

  const screenX = hitbox.x - camera.x;
  const screenY = hitbox.y - camera.y;
  const progress = player.attackTimer / player.attackDuration;
  const sweep = 1 - progress;
  ctx.save();
  ctx.lineCap = "round";

  if (player.attackDirection === "up") {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(screenX + 4, screenY + hitbox.height - 2);
    ctx.quadraticCurveTo(screenX + hitbox.width / 2, screenY - 10, screenX + hitbox.width - 4, screenY + hitbox.height - 2);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY + hitbox.height - 4);
    ctx.quadraticCurveTo(screenX + hitbox.width / 2, screenY - 4, screenX + hitbox.width - 8, screenY + hitbox.height - 4);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (player.attackDirection === "down") {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(screenX + 4, screenY + 2);
    ctx.quadraticCurveTo(screenX + hitbox.width / 2, screenY + hitbox.height + 8, screenX + hitbox.width - 4, screenY + 2);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY + 4);
    ctx.quadraticCurveTo(screenX + hitbox.width / 2, screenY + hitbox.height + 2, screenX + hitbox.width - 8, screenY + 4);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = "#e0f2fe";
  ctx.lineWidth = 5;
  ctx.beginPath();

  if (player.facing === 1) {
    ctx.moveTo(screenX + 5, screenY + 30);
    ctx.quadraticCurveTo(screenX + 22 + sweep * 10, screenY - 8, screenX + hitbox.width - 2, screenY + 12 + sweep * 5);
  } else {
    ctx.moveTo(screenX + hitbox.width - 5, screenY + 30);
    ctx.quadraticCurveTo(screenX + 30 - sweep * 10, screenY - 8, screenX + 2, screenY + 12 + sweep * 5);
  }

  ctx.stroke();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 12;
  ctx.beginPath();

  if (player.facing === 1) {
    ctx.moveTo(screenX + 2, screenY + 32);
    ctx.quadraticCurveTo(screenX + 28 + sweep * 8, screenY - 10, screenX + hitbox.width, screenY + 18);
  } else {
    ctx.moveTo(screenX + hitbox.width - 2, screenY + 32);
    ctx.quadraticCurveTo(screenX + 24 - sweep * 8, screenY - 10, screenX, screenY + 18);
  }

  ctx.stroke();
  ctx.restore();
}

function getCharacterVisual(state) {
  const visual = Object.assign({}, characterVisuals[state] || characterVisuals.idle);

  if (state === "dash") {
    visual.lean = player.facing * 4;
    visual.leftBottom = player.facing === 1 ? -2 : 3;
    visual.rightBottom = player.facing === 1 ? 29 : 34;
    visual.centerBottom = player.facing === 1 ? 18 : 14;
  } else if (state === "attack") {
    if (player.attackDirection === "up") {
      visual.lean = 0;
      visual.headY = -2;
    } else if (player.attackDirection === "down") {
      visual.lean = 0;
      visual.headY = 2;
    } else {
      visual.lean = player.facing * 3;
    }

    visual.leftBottom = player.facing === 1 ? 0 : 4;
    visual.rightBottom = player.facing === 1 ? 28 : 32;
    visual.centerBottom = player.facing === 1 ? 18 : 14;
  } else {
    visual.lean = 0;
  }

  return visual;
}

function getCharacterBob(visual) {
  if (visual.bobSpeed === 0 || visual.bobAmount === 0) {
    return 0;
  }

  return Math.sin(frameCount * visual.bobSpeed) * visual.bobAmount;
}

function drawStateEffects(screenX, screenY, state) {
  ctx.save();

  if (state === "jump") {
    ctx.strokeStyle = "rgba(125, 211, 252, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX + 6, screenY + 52);
    ctx.lineTo(screenX + 2, screenY + 62);
    ctx.moveTo(screenX + 16, screenY + 54);
    ctx.lineTo(screenX + 16, screenY + 65);
    ctx.moveTo(screenX + 26, screenY + 52);
    ctx.lineTo(screenX + 31, screenY + 62);
    ctx.stroke();
  }

  if (state === "wallSlide") {
    ctx.strokeStyle = "rgba(167, 243, 208, 0.5)";
    ctx.lineWidth = 3;
    const wallX = player.wallDirection === -1 ? screenX - 4 : screenX + player.width + 4;
    ctx.beginPath();
    ctx.moveTo(wallX, screenY + 2);
    ctx.lineTo(wallX, screenY + player.height - 2);
    ctx.stroke();
  }

  if (state === "fall") {
    ctx.strokeStyle = "rgba(203, 213, 225, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX + 2, screenY - 8);
    ctx.lineTo(screenX + 2, screenY + 5);
    ctx.moveTo(screenX + 30, screenY - 6);
    ctx.lineTo(screenX + 30, screenY + 8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlayerShadow(screenX, screenY, visual) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(screenX + player.width / 2, screenY + player.height + 3, visual.shadowWidth, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHealAura(screenX, screenY) {
  if (player.healTimer <= 0) {
    return;
  }

  const progress = 1 - player.healTimer / player.healDuration;
  const radius = 18 + progress * 12;
  const pulse = Math.sin(frameCount * 0.25) * 4;
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#86efac";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(screenX + player.width / 2, screenY + player.height / 2, radius + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#86efac";
  ctx.beginPath();
  ctx.arc(screenX + player.width / 2, screenY + player.height / 2, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCharacterBody(state, visual, bob) {
  const walkCycle = state === "walk" ? Math.sin(playerAnimation.stateFrame * 0.35) : 0;
  ctx.save();
  ctx.translate(visual.lean, bob);
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = state === "heal" ? "#86efac" : player.dashInvincibleTimer > 0 ? "#fef08a" : "#38bdf8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(7, visual.bodyTop);
  ctx.lineTo(25, visual.bodyTop);
  ctx.lineTo(visual.rightBottom, 44);
  ctx.lineTo(22, 48);
  ctx.lineTo(visual.centerBottom, 43);
  ctx.lineTo(10, 48);
  ctx.lineTo(visual.leftBottom, 44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(10, 24);
  ctx.lineTo(22, 24);
  ctx.lineTo(24, 42);
  ctx.lineTo(16, 38);
  ctx.lineTo(8, 42);
  ctx.closePath();
  ctx.fill();

  if (state === "attack") {
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 3;
    ctx.beginPath();

    if (player.attackDirection === "up") {
      ctx.moveTo(16, 24);
      ctx.lineTo(16, 10);
    } else if (player.attackDirection === "down") {
      ctx.moveTo(16, 34);
      ctx.lineTo(16, 51);
    } else if (player.facing === 1) {
      ctx.moveTo(23, 25);
      ctx.lineTo(34, 20);
    } else {
      ctx.moveTo(9, 25);
      ctx.lineTo(-2, 20);
    }

    ctx.stroke();
  }

  ctx.fillStyle = "#020617";

  if (state === "walk") {
    ctx.fillRect(8, 43 + walkCycle, 7, 5);
    ctx.fillRect(18, 43 - walkCycle, 7, 5);
  } else {
    ctx.fillRect(8, 43, 7, 5);
    ctx.fillRect(18, 43, 7, 5);
  }

  ctx.strokeStyle = visual.coreColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(16, 29, visual.coreRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCharacterHead(state, visual, bob) {
  ctx.save();
  ctx.translate(visual.lean, bob + visual.headY);
  ctx.strokeStyle = "#dbeafe";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(9, 8);
  ctx.quadraticCurveTo(4 - (state === "dash" ? player.facing * 4 : 0), 0, 2 - (state === "dash" ? player.facing * 7 : 0), -5);
  ctx.moveTo(23, 8);
  ctx.quadraticCurveTo(28 - (state === "dash" ? player.facing * 4 : 0), 0, 30 - (state === "dash" ? player.facing * 7 : 0), -5);
  ctx.stroke();
  ctx.fillStyle = "#dbeafe";
  ctx.strokeStyle = state === "heal" ? "#86efac" : player.dashInvincibleTimer > 0 ? "#fef08a" : "#f8fafc";
  ctx.lineWidth = 2;
  drawRoundedRect(5, 4, 22, 18, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = state === "heal" ? "#bbf7d0" : "#bfdbfe";
  drawRoundedRect(7, 13, 18, 7, 4);
  ctx.fill();
  ctx.fillStyle = "#020617";
  let eyeOffset = state === "dash" ? player.facing * 2 : state === "attack" && player.attackDirection === "side" ? player.facing : 0;

  if (player.facing === 1) {
    ctx.fillRect(14 + eyeOffset, 11, 3, 5);
    ctx.fillRect(21 + eyeOffset, 11, 3, 5);
  } else {
    ctx.fillRect(8 + eyeOffset, 11, 3, 5);
    ctx.fillRect(15 + eyeOffset, 11, 3, 5);
  }

  ctx.restore();
}

function drawVectorCharacter(screenX, screenY, state, visual, bob) {
  ctx.save();
  ctx.translate(screenX, screenY);
  drawCharacterBody(state, visual, bob);
  drawCharacterHead(state, visual, bob);
  ctx.restore();
}

function drawPlayer() {
  const screenX = player.x - camera.x;
  const screenY = player.y - camera.y;
  const state = playerAnimation.state;
  const visual = getCharacterVisual(state);
  const bob = getCharacterBob(visual);

  if (state === "dash") {
    drawDashAfterImages(screenX, screenY, bob);
  }

  drawStateEffects(screenX, screenY, state);
  drawPlayerShadow(screenX, screenY, visual);
  drawHealAura(screenX, screenY);
  ctx.save();

  if (player.dashInvincibleTimer > 0) {
    ctx.globalAlpha = 0.78;
  } else if (player.invincibleTimer > 0 && frameCount % 8 < 4) {
    ctx.globalAlpha = 0.45;
  }

  drawVectorCharacter(screenX, screenY, state, visual, bob);
  ctx.restore();
}

function drawMiniMap() {
  const mapX = canvas.width - 270;
  const mapY = 25;
  const mapWidth = 230;
  const mapHeight = 34;
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(mapX - 10, mapY - 10, mapWidth + 20, mapHeight + 38);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "13px Arial";
  ctx.fillText("방 구조", mapX, mapY - 16);

  for (const room of rooms) {
    const roomX = mapX + (room.x / world.width) * mapWidth;
    const roomW = (room.width / world.width) * mapWidth;
    ctx.fillStyle = "rgba(148, 163, 184, 0.28)";
    ctx.fillRect(roomX, mapY, roomW - 2, mapHeight);
    ctx.strokeStyle = "rgba(226, 232, 240, 0.5)";
    ctx.strokeRect(roomX, mapY, roomW - 2, mapHeight);
  }

  const playerMarkerX = mapX + (player.x / world.width) * mapWidth;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(playerMarkerX - 2, mapY - 4, 4, mapHeight + 8);
}

function drawHealthUI() {
  const startX = 20;
  const startY = 360;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText("체력", startX, startY);

  for (let i = 0; i < player.maxHealth; i++) {
    const x = startX + 45 + i * 24;
    const y = startY - 13;
    ctx.fillStyle = i < player.health ? "#f87171" : "rgba(148, 163, 184, 0.35)";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawCoreEnergyUI() {
  const startX = 20;
  const startY = 390;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText("코어 에너지", startX, startY);

  for (let i = 0; i < player.maxCoreEnergy; i++) {
    const x = startX + 90 + i * 18;
    const y = startY - 13;
    ctx.fillStyle = i < player.coreEnergy ? "#86efac" : "rgba(148, 163, 184, 0.3)";
    drawRoundedRect(x, y, 12, 12, 4);
    ctx.fill();
    ctx.strokeStyle = "#bbf7d0";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "13px Arial";
  ctx.fillText("L 회복: 에너지 3칸 소모", startX, startY + 22);
}

function drawBossHealthBar() {
  if (!boss.alive || player.x < 5300) {
    return;
  }

  const barX = canvas.width / 2 - 190;
  const barY = 82;
  const barWidth = 380;
  const barHeight = 18;
  const ratio = boss.health / boss.maxHealth;
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
  drawRoundedRect(barX - 12, barY - 28, barWidth + 24, 58, 12);
  ctx.fill();
  ctx.fillStyle = isBossPhaseTwo() ? "#fecdd3" : "#e9d5ff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(isBossPhaseTwo() ? "기억 파수자 - 2페이즈" : "기억 파수자", canvas.width / 2, barY - 8);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(71, 85, 105, 0.9)";
  drawRoundedRect(barX, barY, barWidth, barHeight, 8);
  ctx.fill();
  ctx.fillStyle = isBossPhaseTwo() ? "#f43f5e" : "#fb7185";
  drawRoundedRect(barX, barY, barWidth * ratio, barHeight, 8);
  ctx.fill();
  ctx.strokeStyle = "#fecdd3";
  ctx.lineWidth = 2;
  drawRoundedRect(barX, barY, barWidth, barHeight, 8);
  ctx.stroke();
  ctx.restore();
}

function drawBossClearEffect() {
  if (gameState.bossClearEffectTimer <= 0) {
    return;
  }

  const alpha = gameState.bossClearEffectTimer / 150;
  ctx.save();
  ctx.globalAlpha = alpha * 0.26;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(5400 - camera.x, 0 - camera.y, 900, world.height);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 26px Arial";
  ctx.fillText("보스방 봉인이 해제되었습니다", 5600 - camera.x, 190 - camera.y);
  ctx.restore();
}

function drawBossPhaseBanner() {
  if (gameState.bossPhaseBannerTimer <= 0) {
    return;
  }

  const alpha = Math.min(1, gameState.bossPhaseBannerTimer / 45);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2, 6, 23, 0.62)";
  ctx.fillRect(0, canvas.height / 2 - 55, canvas.width, 110);
  ctx.fillStyle = "#fecdd3";
  ctx.font = "bold 34px Arial";
  ctx.textAlign = "center";
  ctx.fillText("2페이즈 진입", canvas.width / 2, canvas.height / 2 - 8);
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "18px Arial";
  ctx.fillText("순간이동, 레이저, 기억 파편 빈도 증가", canvas.width / 2, canvas.height / 2 + 28);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawBossStartBanner() {
  if (gameState.bossStartBannerTimer <= 0) {
    return;
  }

  const alpha = Math.min(1, gameState.bossStartBannerTimer / 45);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
  ctx.fillRect(0, canvas.height / 2 - 55, canvas.width, 110);
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 34px Arial";
  ctx.textAlign = "center";
  ctx.fillText("기억 파수자", canvas.width / 2, canvas.height / 2 - 8);
  ctx.fillStyle = "#fecdd3";
  ctx.font = "18px Arial";
  ctx.fillText("최종 보스전 시작", canvas.width / 2, canvas.height / 2 + 28);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawEndingPanel() {
  if (!gameState.endingReached) {
    return;
  }

  const frame = gameState.endingFrame;
  const lineCount = clamp(Math.floor((frame - 60) / 95) + 1, 0, endingLines.length);
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 23, 0.86)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const glow = 0.18 + Math.sin(frameCount * 0.04) * 0.05;
  ctx.globalAlpha = glow;
  ctx.fillStyle = "#7dd3fc";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 - 110, 95, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Coreless", canvas.width / 2, 105);
  ctx.fillStyle = "#bae6fd";
  ctx.font = "17px Arial";
  ctx.fillText("원점 코어가 반응합니다.", canvas.width / 2, 142);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "20px Arial";

  for (let i = 0; i < lineCount; i++) {
    ctx.fillText(endingLines[i], canvas.width / 2, 210 + i * 42);
  }

  if (gameState.endingInputUnlocked) {
    ctx.fillStyle = "#fef3c7";
    ctx.font = "18px Arial";
    ctx.fillText("R 키를 누르면 다시 시작합니다.", canvas.width / 2, canvas.height - 65);
  } else {
    const dots = ".".repeat(Math.floor(frameCount / 25) % 4);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Arial";
    ctx.fillText("엔딩 진행 중" + dots, canvas.width / 2, canvas.height - 65);
  }

  ctx.textAlign = "left";
  ctx.restore();
}

function drawUI() {
  const currentRoom = getCurrentRoom();
  const playerState = playerAnimation.state;
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("11단계-2+3: 대시/공격/벽 점프/카메라 통합", 20, 35);
  ctx.font = "16px Arial";
  ctx.fillText("A/D 이동 | Space 점프/벽점프 | Shift/K 대시 | J 공격 | W+J 위 | 공중 S+J 아래 | L 회복", 20, 65);
  ctx.fillStyle = "#bfdbfe";
  ctx.fillText("현재 방: " + currentRoom.name, 20, 95);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("방 설명: " + currentRoom.guide, 20, 120);
  ctx.fillStyle = "#fef08a";
  ctx.fillText("캐릭터 상태: " + getStateName(playerState), 20, 150);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("대시 무적 + 방향 공격 + 벽 미끄러짐/벽 점프 + 부드러운 카메라", 20, 180);
  ctx.fillStyle = gameState.hasKey ? "#fef08a" : "#fecaca";
  ctx.fillText(gameState.hasKey ? "열쇠: 보유 중" : "열쇠: 없음", 20, 210);

  if (player.dashCooldown <= 0) {
    ctx.fillStyle = "#bbf7d0";
    ctx.fillText("대시: 사용 가능", 20, 240);
  } else {
    const cooldownPercent = Math.ceil((player.dashCooldown / player.dashCooldownMax) * 100);
    ctx.fillStyle = player.dashInvincibleTimer > 0 ? "#fef08a" : "#fde68a";
    ctx.fillText(player.dashInvincibleTimer > 0 ? "대시 무적 중" : "대시 쿨타임: " + cooldownPercent + "%", 20, 240);
  }

  ctx.fillStyle = player.hasDoubleJump ? "#c4b5fd" : "#cbd5e1";
  ctx.fillText(player.hasDoubleJump ? "능력: 이중 점프 획득" : "능력: 없음", 20, 265);
  if (player.isWallSliding) {
    ctx.fillStyle = "#a7f3d0";
    ctx.fillText("벽 상태: 미끄러짐 중", 180, 265);
  } else if (player.hasWallJump) {
    ctx.fillStyle = "#86efac";
    ctx.fillText("벽 점프: 사용 가능", 180, 265);
  }
  ctx.fillStyle = "#fef3c7";
  ctx.fillText("기억 조각: " + gameState.memoryFragments + "개", 20, 290);
  ctx.fillStyle = "#e9d5ff";
  ctx.fillText("기억 핵: " + gameState.memoryCores + "개", 20, 315);
  ctx.fillStyle = "#bae6fd";
  ctx.fillText("원점 코어: " + gameState.originCores + "개", 20, 340);
  drawHealthUI();
  drawCoreEnergyUI();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText(gameState.message, 20, 435);
  drawBossHealthBar();
  drawMiniMap();
}

function drawWorld() {
  ctx.save();
  ctx.translate(camera.shakeX, camera.shakeY);
  drawRoomBackgrounds();
  drawBackgroundDecorations();
  drawBossRoomDecorations();
  drawRoomLabels();
  drawDoors();
  drawBossArenaGates();
  drawPlatforms();
  drawKeyItem();
  drawAbilityItems();
  drawRewardItems();
  drawWarnings();
  drawEnemies();
  drawBoss();
  drawEnemyAttacks();
  drawShardWarnings();
  drawProjectiles();
  drawParticles();
  drawFloatingTexts();
  drawPlayer();
  drawAttack();
  drawBossClearEffect();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWorld();
  drawUI();
  drawBossStartBanner();
  drawBossPhaseBanner();
  drawEndingPanel();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

