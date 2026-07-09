const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};
let frameCount = 0;

let hitStopTimer = 0;
let screenShakeTimer = 0;
let screenShakeMaxTimer = 0;
let screenShakePower = 0;
let lastPlayerAttackWallSparkId = -1;

const particles = [];
const projectiles = [];

const world = {
  width: 4500,
  height: 900
};

const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  shakeX: 0,
  shakeY: 0
};

const player = {
  x: 70,
  y: 300,
  width: 32,
  height: 48,

  vx: 0,
  vy: 0,

  acceleration: 0.6,
  friction: 0.82,
  maxSpeed: 5.5,

  jumpPower: -13,
  onGround: false,

  hasDoubleJump: false,
  canDoubleJump: false,
  doubleJumpUsed: false,

  facing: 1,

  isDashing: false,
  dashTimer: 0,
  dashDuration: 10,
  dashSpeed: 12,
  dashCooldown: 0,
  dashCooldownMax: 120,

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
  attackCooldownMax: 24,
  attackId: 0
};

const playerAnimation = {
  state: "idle",
  previousState: "idle",
  stateFrame: 0
};

const characterVisuals = {
  idle: {
    name: "정지",
    bobSpeed: 0.08,
    bobAmount: 0.7,
    bodyTop: 18,
    leftBottom: 1,
    rightBottom: 31,
    centerBottom: 16,
    headY: 0,
    coreRadius: 4,
    coreColor: "#7dd3fc",
    shadowWidth: 16
  },
  walk: {
    name: "걷기",
    bobSpeed: 0.25,
    bobAmount: 1.7,
    bodyTop: 18,
    leftBottom: 1,
    rightBottom: 31,
    centerBottom: 16,
    headY: 0,
    coreRadius: 4,
    coreColor: "#7dd3fc",
    shadowWidth: 17
  },
  jump: {
    name: "점프",
    bobSpeed: 0,
    bobAmount: 0,
    bodyTop: 19,
    leftBottom: 4,
    rightBottom: 28,
    centerBottom: 16,
    headY: -2,
    coreRadius: 4,
    coreColor: "#7dd3fc",
    shadowWidth: 12
  },
  fall: {
    name: "낙하",
    bobSpeed: 0,
    bobAmount: 0,
    bodyTop: 17,
    leftBottom: -1,
    rightBottom: 33,
    centerBottom: 16,
    headY: 2,
    coreRadius: 4,
    coreColor: "#7dd3fc",
    shadowWidth: 20
  },
  dash: {
    name: "대시",
    bobSpeed: 0,
    bobAmount: 0,
    bodyTop: 17,
    leftBottom: 1,
    rightBottom: 31,
    centerBottom: 16,
    headY: 0,
    coreRadius: 5,
    coreColor: "#fef08a",
    shadowWidth: 24
  },
  attack: {
    name: "공격",
    bobSpeed: 0,
    bobAmount: 0,
    bodyTop: 18,
    leftBottom: 2,
    rightBottom: 30,
    centerBottom: 16,
    headY: 0,
    coreRadius: 5,
    coreColor: "#e0f2fe",
    shadowWidth: 19
  },
  heal: {
    name: "회복",
    bobSpeed: 0.12,
    bobAmount: 0.5,
    bodyTop: 18,
    leftBottom: 2,
    rightBottom: 30,
    centerBottom: 16,
    headY: -1,
    coreRadius: 6,
    coreColor: "#86efac",
    shadowWidth: 18
  }
};

const startPosition = {
  x: 70,
  y: 300
};

const gravity = 0.65;

const gameState = {
  hasKey: false,
  message: "이중 점프 능력을 찾아 획득하세요."
};

const rooms = [
  { name: "방 1: 시작 구역", guide: "기본 이동과 점프", x: 0, width: 900, color: "#111827" },
  { name: "방 2: 근접 전투 구역", guide: "붉은 예고 공격을 보고 피하기", x: 900, width: 900, color: "#172033" },
  { name: "방 3: 능력 해금 구역", guide: "이중 점프 능력 획득", x: 1800, width: 900, color: "#1f1b2e" },
  { name: "방 4: 잠긴 통로 구역", guide: "열쇠가 있어야 문 통과 가능", x: 2700, width: 900, color: "#201a1a" },
  { name: "방 5: 이중 점프 활용 구역", guide: "투사체를 피하며 높은 발판 오르기", x: 3600, width: 900, color: "#10251f" }
];

const platforms = [
  { x: 0, y: 420, width: 840, height: 80 },
  { x: 150, y: 350, width: 180, height: 24 },
  { x: 450, y: 315, width: 180, height: 24 },

  { x: 920, y: 420, width: 820, height: 80 },
  { x: 1030, y: 350, width: 170, height: 24 },
  { x: 1260, y: 300, width: 150, height: 24 },
  { x: 1510, y: 350, width: 170, height: 24 },

  { x: 1820, y: 420, width: 260, height: 80 },
  { x: 2220, y: 420, width: 420, height: 80 },
  { x: 1890, y: 345, width: 130, height: 24 },
  { x: 2130, y: 360, width: 90, height: 24 },
  { x: 2320, y: 330, width: 150, height: 24 },

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

  { x: 760, y: 260, width: 40, height: 80 },
  { x: 1660, y: 300, width: 40, height: 120 },
  { x: 2500, y: 300, width: 40, height: 120 }
];

const doors = [
  { x: 860, y: 330, width: 40, height: 90, text: "문 1", locked: false, open: true },
  { x: 1760, y: 330, width: 40, height: 90, text: "문 2", locked: false, open: true },
  { x: 2660, y: 330, width: 40, height: 90, text: "문 3", locked: false, open: true },
  { x: 3560, y: 80, width: 40, height: 340, text: "잠긴 문", locked: true, open: false }
];

const keyItem = {
  x: 3155,
  y: 260,
  width: 24,
  height: 24,
  collected: false
};

const abilityItems = [
  {
    type: "doubleJump",
    name: "이중 점프",
    x: 2160,
    y: 320,
    width: 28,
    height: 28,
    collected: false
  }
];

const enemies = [
  {
    type: "melee",
    name: "그늘 벌레",
    x: 1130,
    y: 384,
    width: 34,
    height: 36,
    minX: 990,
    maxX: 1600,
    vx: 1.1,
    speed: 1.35,
    patrolDirection: 1,
    targetDirection: 1,
    chaseRange: 360,
    aiDecisionTimer: 0,

    attackRange: 72,
    attackCooldown: 0,
    attackCooldownMax: 95,
    attackTimer: 0,
    attackDuration: 42,
    attackDirection: 1,
    attackHitPlayer: false,
    attackWallSparked: false,

    maxHealth: 3,
    health: 3,
    alive: true,
    hitTimer: 0,
    invincibleTimer: 0,
    hitByAttackId: -1
  },
  {
    type: "melee",
    name: "균열 파수꾼",
    x: 2320,
    y: 384,
    width: 38,
    height: 36,
    minX: 2220,
    maxX: 2620,
    vx: -1.25,
    speed: 1.45,
    patrolDirection: -1,
    targetDirection: -1,
    chaseRange: 420,
    aiDecisionTimer: 0,

    attackRange: 78,
    attackCooldown: 0,
    attackCooldownMax: 105,
    attackTimer: 0,
    attackDuration: 44,
    attackDirection: -1,
    attackHitPlayer: false,
    attackWallSparked: false,

    maxHealth: 4,
    health: 4,
    alive: true,
    hitTimer: 0,
    invincibleTimer: 0,
    hitByAttackId: -1
  },
  {
    type: "flying",
    name: "공허 박쥐",
    x: 2030,
    y: 245,
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
  },
  {
    type: "shooter",
    name: "균열 사수",
    x: 3920,
    y: 378,
    width: 36,
    height: 42,
    minX: 3740,
    maxX: 4140,
    vx: 0,
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
  }
];

document.addEventListener("keydown", function(event) {
  keys[event.code] = true;

  if (event.code === "Space") {
    if (!event.repeat) {
      tryJump();
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
});

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

    const ratio = screenShakeTimer / screenShakeMaxTimer;
    camera.shakeX = (Math.random() - 0.5) * screenShakePower * ratio;
    camera.shakeY = (Math.random() - 0.5) * screenShakePower * ratio;
  } else {
    camera.shakeX = 0;
    camera.shakeY = 0;
  }
}

function getCurrentRoom() {
  const playerCenterX = player.x + player.width / 2;

  for (const room of rooms) {
    if (playerCenterX >= room.x && playerCenterX < room.x + room.width) {
      return room;
    }
  }

  return rooms[0];
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
  if (characterVisuals[state]) {
    return characterVisuals[state].name;
  }

  return "알 수 없음";
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

function getCharacterVisual(state) {
  const visual = Object.assign({}, characterVisuals[state] || characterVisuals.idle);

  if (state === "dash") {
    visual.lean = player.facing * 4;
    visual.leftBottom = player.facing === 1 ? -2 : 3;
    visual.rightBottom = player.facing === 1 ? 29 : 34;
    visual.centerBottom = player.facing === 1 ? 18 : 14;
  } else if (state === "attack") {
    visual.lean = player.facing * 3;
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

function getSolidObjects() {
  const solidObjects = [...platforms];

  for (const door of doors) {
    if (door.locked && !door.open) {
      solidObjects.push(door);
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
      const wallIsInFront = object.x >= owner.x + owner.width - 2;

      if (wallIsInFront) {
        const newRight = Math.min(clipped.x + clipped.width, object.x);
        clipped.width = Math.max(0, newRight - clipped.x);
      }
    } else {
      const wallRight = object.x + object.width;
      const wallIsInFront = wallRight <= owner.x + 2;

      if (wallIsInFront) {
        const oldRight = clipped.x + clipped.width;
        clipped.x = Math.max(clipped.x, wallRight);
        clipped.width = Math.max(0, oldRight - clipped.x);
      }
    }
  }

  return clipped;
}

function isHitboxClipped(original, clipped) {
  return (
    Math.abs(original.x - clipped.x) > 0.1 ||
    Math.abs(original.width - clipped.width) > 0.1
  );
}

function getWallSparkPoint(clipped, direction) {
  if (direction === 1) {
    return {
      x: clipped.x + clipped.width,
      y: clipped.y + clipped.height / 2
    };
  }

  return {
    x: clipped.x,
    y: clipped.y + clipped.height / 2
  };
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

function checkPlayerAttackWallSpark(originalHitbox, clippedHitbox) {
  if (!isHitboxClipped(originalHitbox, clippedHitbox)) {
    return;
  }

  if (lastPlayerAttackWallSparkId === player.attackId) {
    return;
  }

  lastPlayerAttackWallSparkId = player.attackId;

  const point = getWallSparkPoint(clippedHitbox, player.facing);

  spawnWallSparkParticles(point.x, point.y, -player.facing);
  startScreenShake(4, 2);
  gameState.message = "공격이 벽에 막혔습니다.";
}

function getBlockedEnemyAttackHitbox(enemy) {
  const rawHitbox = getEnemyAttackHitbox(enemy);
  return getClippedHitboxByWalls(rawHitbox, enemy, enemy.attackDirection);
}

function checkEnemyAttackWallSpark(enemy) {
  const rawHitbox = getEnemyAttackHitbox(enemy);
  const clippedHitbox = getBlockedEnemyAttackHitbox(enemy);

  if (!isHitboxClipped(rawHitbox, clippedHitbox)) {
    return;
  }

  if (enemy.attackWallSparked) {
    return;
  }

  enemy.attackWallSparked = true;

  const point = getWallSparkPoint(clippedHitbox, enemy.attackDirection);

  spawnWallSparkParticles(point.x, point.y, -enemy.attackDirection);
  startScreenShake(4, 2);
}

function addDustParticle(x, y, vx, vy, width, height, life, color, rotation) {
  particles.push({
    type: "dust",
    x: x,
    y: y,
    vx: vx,
    vy: vy,
    width: width,
    height: height,
    life: life,
    maxLife: life,
    color: color,
    rotation: rotation,
    gravity: 0.025,
    growX: 0.35,
    growY: 0.015
  });
}

function addDashStreak(x, y, vx, vy, width, height, life, color, rotation) {
  particles.push({
    type: "dash",
    x: x,
    y: y,
    vx: vx,
    vy: vy,
    width: width,
    height: height,
    life: life,
    maxLife: life,
    color: color,
    rotation: rotation,
    gravity: 0,
    growX: -0.15,
    growY: -0.01
  });
}

function spawnJumpParticles() {
  for (let i = 0; i < 10; i++) {
    const direction = Math.random() < 0.5 ? -1 : 1;

    addDustParticle(
      player.x + player.width / 2 + (Math.random() - 0.5) * 10,
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
      player.x + player.width / 2,
      player.y + player.height / 2,
      Math.cos(angle) * (1.4 + Math.random() * 1.3),
      Math.sin(angle) * (1.0 + Math.random() * 1.1),
      10 + Math.random() * 14,
      2 + Math.random() * 3,
      16 + Math.random() * 8,
      "rgba(196, 181, 253, 1)",
      angle
    );
  }

  for (let i = 0; i < 8; i++) {
    addDustParticle(
      player.x + player.width / 2 + (Math.random() - 0.5) * 16,
      player.y + player.height + 2,
      (Math.random() - 0.5) * 2.2,
      0.4 + Math.random() * 1.2,
      10 + Math.random() * 16,
      3 + Math.random() * 3,
      18 + Math.random() * 8,
      "rgba(196, 181, 253, 1)",
      (Math.random() - 0.5) * 0.5
    );
  }

  startScreenShake(4, 2);
}

function spawnLandingParticles(power) {
  const count = Math.min(24, 10 + Math.floor(power * 1.5));

  for (let i = 0; i < count; i++) {
    const direction = i % 2 === 0 ? -1 : 1;

    addDustParticle(
      player.x + player.width / 2 + (Math.random() - 0.5) * 8,
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
      player.x + player.width / 2 - player.facing * (8 + Math.random() * 20),
      player.y + 12 + Math.random() * 28,
      -player.facing * (1.5 + Math.random() * 3.0),
      (Math.random() - 0.5) * 0.8,
      18 + Math.random() * 24,
      3 + Math.random() * 4,
      18 + Math.random() * 8,
      "rgba(125, 211, 252, 1)",
      (Math.random() - 0.5) * 0.18
    );
  }
}

function spawnHitParticles(x, y, direction) {
  for (let i = 0; i < 12; i++) {
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

function spawnHealParticles() {
  for (let i = 0; i < 3; i++) {
    addDashStreak(
      player.x + player.width / 2 + (Math.random() - 0.5) * 18,
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
      player.x + player.width / 2,
      player.y + player.height / 2,
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

function spawnEnemyAttackParticles(enemy) {
  const hitbox = getBlockedEnemyAttackHitbox(enemy);

  if (hitbox.width <= 2) {
    return;
  }

  for (let i = 0; i < 5; i++) {
    addDashStreak(
      hitbox.x + hitbox.width / 2,
      hitbox.y + Math.random() * hitbox.height,
      enemy.attackDirection * (1.2 + Math.random() * 2.2),
      (Math.random() - 0.5) * 1.0,
      12 + Math.random() * 18,
      2 + Math.random() * 3,
      12 + Math.random() * 6,
      "rgba(248, 113, 113, 1)",
      (Math.random() - 0.5) * 0.35
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
  player.vy = 0;

  spawnDashParticles();
}

function updateDash() {
  if (player.dashCooldown > 0) {
    player.dashCooldown -= 1;
  }

  if (player.isDashing) {
    player.vx = player.facing * player.dashSpeed;
    player.dashTimer -= 1;

    if (frameCount % 2 === 0) {
      addDashStreak(
        player.x + player.width / 2 - player.facing * 18,
        player.y + 12 + Math.random() * 28,
        -player.facing * (1.0 + Math.random() * 2.0),
        (Math.random() - 0.5) * 0.5,
        12 + Math.random() * 18,
        2 + Math.random() * 3,
        12 + Math.random() * 7,
        "rgba(125, 211, 252, 1)",
        (Math.random() - 0.5) * 0.15
      );
    }

    if (player.dashTimer <= 0) {
      player.isDashing = false;
    }
  }
}

function startAttack() {
  if (player.healTimer > 0) {
    return;
  }

  if (player.attackCooldown > 0) {
    return;
  }

  player.attackTimer = player.attackDuration;
  player.attackCooldown = player.attackCooldownMax;
  player.attackId += 1;

  gameState.message = "공격했습니다.";

  const hitbox = getAttackHitbox();

  spawnHitParticles(
    hitbox.x + hitbox.width / 2,
    hitbox.y + hitbox.height / 2,
    player.facing
  );
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

function getAttackHitbox() {
  const attackWidth = 52;
  const attackHeight = 38;

  return {
    x: player.facing === 1 ? player.x + player.width - 3 : player.x - attackWidth + 3,
    y: player.y + 6,
    width: attackWidth,
    height: attackHeight
  };
}

function tryJump() {
  if (player.healTimer > 0) {
    return;
  }

  if (player.onGround) {
    spawnJumpParticles();

    player.vy = player.jumpPower;
    player.onGround = false;

    if (player.hasDoubleJump) {
      player.canDoubleJump = true;
      player.doubleJumpUsed = false;
    }

    return;
  }

  if (player.hasDoubleJump && player.canDoubleJump && !player.doubleJumpUsed) {
    spawnDoubleJumpParticles();

    player.vy = player.jumpPower * 0.92;
    player.canDoubleJump = false;
    player.doubleJumpUsed = true;

    gameState.message = "이중 점프를 사용했습니다.";
  }
}

function updatePlayerHorizontalMove() {
  if (player.healTimer > 0) {
    player.vx *= 0.6;

    if (Math.abs(player.vx) < 0.05) {
      player.vx = 0;
    }

    return;
  }

  let moving = false;

  if (keys["KeyA"]) {
    player.vx -= player.acceleration;
    player.facing = -1;
    moving = true;
  }

  if (keys["KeyD"]) {
    player.vx += player.acceleration;
    player.facing = 1;
    moving = true;
  }

  if (!moving && !player.isDashing) {
    player.vx *= player.friction;
  }

  if (player.vx > player.maxSpeed && !player.isDashing) {
    player.vx = player.maxSpeed;
  }

  if (player.vx < -player.maxSpeed && !player.isDashing) {
    player.vx = -player.maxSpeed;
  }

  if (Math.abs(player.vx) < 0.05) {
    player.vx = 0;
  }
}

function updateGravity() {
  if (!player.isDashing) {
    player.vy += gravity;
  }
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

function moveHorizontally() {
  player.x += player.vx;

  for (const object of getSolidObjects()) {
    if (isColliding(player, object)) {
      if (object.locked && !object.open) {
        if (gameState.hasKey) {
          object.open = true;
          gameState.message = "잠긴 문이 열렸습니다.";
          continue;
        } else {
          gameState.message = "잠긴 문입니다. 열쇠가 필요합니다.";
        }
      }

      if (player.vx > 0) {
        player.x = object.x - player.width;
      } else if (player.vx < 0) {
        player.x = object.x + object.width;
      }

      player.vx = 0;
      player.isDashing = false;
    }
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
    if (isColliding(player, object)) {
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
  const enemyCenterX = enemy.x + enemy.width / 2;
  const enemyCenterY = enemy.y + enemy.height / 2;

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  const distanceX = playerCenterX - enemyCenterX;
  const distanceY = playerCenterY - enemyCenterY;

  const playerIsClose =
    Math.abs(distanceX) <= enemy.chaseRange &&
    Math.abs(distanceY) <= 160;

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
    const playerIsAboveEnemy = playerCenterY < enemyCenterY - 38;
    const playerIsAlmostSameX = Math.abs(distanceX) < 42;

    if (playerIsAboveEnemy && playerIsAlmostSameX) {
      enemy.vx *= 0.82;

      if (Math.abs(enemy.vx) < 0.08) {
        enemy.vx = 0;
      }

      return;
    }

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
  const enemyCenterX = enemy.x + enemy.width / 2;
  const enemyCenterY = enemy.y + enemy.height / 2;

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  const distanceX = playerCenterX - enemyCenterX;
  const distanceY = playerCenterY - enemyCenterY;

  const playerIsClose =
    Math.abs(distanceX) <= enemy.chaseRange &&
    Math.abs(distanceY) <= 260;

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
  const enemyCenterX = enemy.x + enemy.width / 2;
  const enemyCenterY = enemy.y + enemy.height / 2;

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  const distanceX = playerCenterX - enemyCenterX;
  const distanceY = playerCenterY - enemyCenterY;

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

  const playerInShootRange =
    Math.abs(distanceX) <= enemy.shootRange &&
    Math.abs(distanceY) <= enemy.shootVerticalRange;

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

  if (player.invincibleTimer > 0) {
    return false;
  }

  return true;
}

function startEnemyAttack(enemy, distanceX) {
  enemy.attackTimer = enemy.attackDuration;
  enemy.attackCooldown = enemy.attackCooldownMax;
  enemy.attackHitPlayer = false;
  enemy.attackWallSparked = false;

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

    if (isEnemyAttackActive(enemy)) {
      checkEnemyAttackWallSpark(enemy);

      if (frameCount % 5 === 0) {
        spawnEnemyAttackParticles(enemy);
      }
    }

    if (previousAttackTimer > 0 && enemy.attackTimer <= 0) {
      enemy.attackHitPlayer = false;
      enemy.attackWallSparked = false;
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
    if (isColliding(enemy, object)) {
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

function spawnEnemyProjectile(enemy) {
  const direction = enemy.shootDirection;

  projectiles.push({
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

    if (projectile.x < 0 || projectile.x > world.width) {
      removeProjectile = true;
    }

    for (const object of getSolidObjects()) {
      if (isColliding(projectile, object)) {
        removeProjectile = true;
        hitWall = true;
        break;
      }
    }

    if (removeProjectile) {
      if (hitWall) {
        const direction = projectile.vx > 0 ? -1 : 1;

        spawnWallSparkParticles(
          projectile.vx > 0 ? projectile.x + projectile.width : projectile.x,
          projectile.y + projectile.height / 2,
          direction
        );

        startScreenShake(3, 1.8);
      }

      projectiles.splice(i, 1);
    }
  }
}

function checkAttackHits() {
  if (player.attackTimer <= 0) {
    return;
  }

  const rawHitbox = getAttackHitbox();
  const hitbox = getClippedHitboxByWalls(rawHitbox, player, player.facing);

  checkPlayerAttackWallSpark(rawHitbox, hitbox);

  if (hitbox.width <= 2) {
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
      knockbackEnemy(enemy, player.facing, 16);

      startHitStop(5);
      startScreenShake(8, 5);

      spawnHitParticles(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        player.facing
      );

      if (enemy.health <= 0) {
        enemy.alive = false;
        gameState.message = enemy.name + "를 쓰러뜨렸습니다. 코어 에너지 획득.";
      } else {
        gameState.message = enemy.name + "에게 공격이 맞았습니다. 코어 에너지 +1";
      }
    }
  }
}

function checkEnemyAttackDamage() {
  if (player.invincibleTimer > 0) {
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

function checkProjectileDamage() {
  if (player.invincibleTimer > 0) {
    return;
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];

    if (isColliding(projectile, player)) {
      const damageSource = {
        x: projectile.x,
        width: projectile.width
      };

      projectiles.splice(i, 1);
      takeDamage(damageSource, "원거리 투사체에 맞았습니다.");
      return;
    }
  }
}

function checkPlayerEnemyDamage() {
  if (player.invincibleTimer > 0) {
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
}

function takeDamage(source, message) {
  if (player.healTimer > 0) {
    player.healTimer = 0;
    player.healingWillRestore = false;
  }

  player.health -= 1;
  player.invincibleTimer = 75;

  const playerCenterX = player.x + player.width / 2;
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
  startScreenShake(10, 6);

  spawnHitParticles(
    player.x + player.width / 2,
    player.y + player.height / 2,
    playerCenterX < sourceCenterX ? -1 : 1
  );

  if (player.health <= 0) {
    respawnPlayer();
  } else {
    gameState.message = message;
  }
}

function respawnPlayer() {
  player.x = startPosition.x;
  player.y = startPosition.y;
  player.vx = 0;
  player.vy = 0;
  player.health = player.maxHealth;
  player.invincibleTimer = 90;
  player.isDashing = false;
  player.attackTimer = 0;
  player.healTimer = 0;
  player.healingWillRestore = false;
  player.canDoubleJump = player.hasDoubleJump;
  player.doubleJumpUsed = false;

  gameState.message = "체력이 모두 줄어 시작 지점에서 다시 시작합니다.";
}

function checkKeyCollection() {
  if (!keyItem.collected && isColliding(player, keyItem)) {
    keyItem.collected = true;
    gameState.hasKey = true;
    gameState.message = "열쇠를 획득했습니다. 이제 잠긴 문을 열 수 있습니다.";
  }
}

function checkAbilityCollection() {
  for (const item of abilityItems) {
    if (item.collected) {
      continue;
    }

    if (isColliding(player, item)) {
      item.collected = true;

      if (item.type === "doubleJump") {
        player.hasDoubleJump = true;
        player.canDoubleJump = true;
        player.doubleJumpUsed = false;

        gameState.message = "능력 획득: 이중 점프. 공중에서 Space를 한 번 더 누를 수 있습니다.";

        for (let i = 0; i < 26; i++) {
          const angle = (Math.PI * 2 * i) / 26;

          addDashStreak(
            item.x + item.width / 2,
            item.y + item.height / 2,
            Math.cos(angle) * (1.5 + Math.random() * 1.8),
            Math.sin(angle) * (1.5 + Math.random() * 1.8),
            12 + Math.random() * 16,
            2 + Math.random() * 3,
            22 + Math.random() * 10,
            "rgba(196, 181, 253, 1)",
            angle
          );
        }

        startScreenShake(8, 3);
      }
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
  player.isDashing = false;
  player.dashTimer = 0;
  player.invincibleTimer = 75;
  player.healTimer = 0;
  player.healingWillRestore = false;
  player.canDoubleJump = player.hasDoubleJump;
  player.doubleJumpUsed = false;

  gameState.message = "낭떠러지에서 떨어져 시작 지점으로 돌아왔습니다.";
}

function updatePlayer() {
  const previousOnGround = player.onGround;
  const previousVy = player.vy;

  updateDash();
  updatePlayerHorizontalMove();
  updateGravity();

  moveHorizontally();
  moveVertically(previousOnGround, previousVy);

  checkKeyCollection();
  checkAbilityCollection();
  checkFall();
}

function updateCamera() {
  camera.x = player.x + player.width / 2 - camera.width / 2;
  camera.y = player.y + player.height / 2 - camera.height / 2;

  if (camera.x < 0) {
    camera.x = 0;
  }

  if (camera.y < 0) {
    camera.y = 0;
  }

  if (camera.x + camera.width > world.width) {
    camera.x = world.width - camera.width;
  }

  if (camera.y + camera.height > world.height) {
    camera.y = world.height - camera.height;
  }

  updateScreenShake();
}

function updateProjectilesAndDamage() {
  updateProjectiles();
  checkProjectileDamage();
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

function drawPlatforms() {
  for (const platform of platforms) {
    const screenX = platform.x - camera.x;
    const screenY = platform.y - camera.y;

    ctx.fillStyle = "#475569";
    ctx.fillRect(screenX, screenY, platform.width, platform.height);

    ctx.fillStyle = "#64748b";
    ctx.fillRect(screenX, screenY, platform.width, 5);
  }
}

function drawDoors() {
  for (const door of doors) {
    const screenX = door.x - camera.x;
    const screenY = door.y - camera.y;

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
    ctx.arc(
      screenX + item.width / 2,
      screenY + item.height / 2,
      22 + pulse,
      0,
      Math.PI * 2
    );
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

  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(screenX + enemy.width / 2, screenY + enemy.height + 12, enemy.width / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = enemy.hitTimer > 0 ? "#3f1f2a" : "#111827";
  ctx.strokeStyle = enemy.hitTimer > 0 ? "#fecaca" : "#a78bfa";
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

  ctx.fillStyle = enemy.hitTimer > 0 ? "#4c1d2d" : "#1e1b4b";
  ctx.strokeStyle = enemy.hitTimer > 0 ? "#fecaca" : "#c4b5fd";
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
    const warningAlpha = 0.18 + Math.sin(frameCount * 0.35) * 0.08;

    ctx.globalAlpha = warningAlpha;
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

    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();

    if (enemy.attackDirection === 1) {
      ctx.moveTo(screenX + 4, screenY + 28);
      ctx.quadraticCurveTo(screenX + 26, screenY - 8, screenX + hitbox.width - 2, screenY + 16);
    } else {
      ctx.moveTo(screenX + hitbox.width - 4, screenY + 28);
      ctx.quadraticCurveTo(screenX + 28, screenY - 8, screenX + 2, screenY + 16);
    }

    ctx.stroke();
  }

  ctx.restore();
}

function getShooterChargeLength(enemy, maxLength) {
  const startX = enemy.shootDirection === 1 ? enemy.x + enemy.width : enemy.x;
  const startY = enemy.y + enemy.height / 2;

  let length = maxLength;

  for (const object of getSolidObjects()) {
    if (!isAttackBlockingObject(object)) {
      continue;
    }

    if (startY < object.y || startY > object.y + object.height) {
      continue;
    }

    if (enemy.shootDirection === 1) {
      if (object.x >= startX) {
        const distance = object.x - startX;

        if (distance < length) {
          length = distance;
        }
      }
    } else {
      const wallRight = object.x + object.width;

      if (wallRight <= startX) {
        const distance = startX - wallRight;

        if (distance < length) {
          length = distance;
        }
      }
    }
  }

  return Math.max(0, length);
}

function drawShooterCharge(enemy) {
  if (enemy.shootTimer <= 0) {
    return;
  }

  const startX = enemy.shootDirection === 1 ? enemy.x + enemy.width : enemy.x;
  const startY = enemy.y + enemy.height / 2;

  const screenX = startX - camera.x;
  const screenY = startY - camera.y;

  const length = getShooterChargeLength(enemy, 180);

  ctx.save();

  const alpha = 0.2 + Math.sin(frameCount * 0.35) * 0.08;

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + enemy.shootDirection * length, screenY);
  ctx.stroke();

  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = "#fecaca";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + enemy.shootDirection * length, screenY);
  ctx.stroke();

  ctx.fillStyle = "#fecaca";
  ctx.font = "18px Arial";
  ctx.fillText("!", screenX - 4, screenY - 18);

  ctx.restore();
}

function drawProjectiles() {
  for (const projectile of projectiles) {
    const screenX = projectile.x - camera.x;
    const screenY = projectile.y - camera.y;

    ctx.save();

    ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
    drawRoundedRect(screenX - 6, screenY - 4, projectile.width + 12, projectile.height + 8, 8);
    ctx.fill();

    ctx.fillStyle = "#fca5a5";
    drawRoundedRect(screenX, screenY, projectile.width, projectile.height, 5);
    ctx.fill();

    ctx.fillStyle = "#fee2e2";
    drawRoundedRect(screenX + 3, screenY + 2, projectile.width - 6, projectile.height - 4, 3);
    ctx.fill();

    ctx.restore();
  }
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
      ctx.ellipse(
        0,
        0,
        particle.width * (1 + (1 - alpha) * 0.6),
        particle.height * alpha,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    if (particle.type === "dash") {
      ctx.fillStyle = particle.color;
      drawRoundedRect(
        -particle.width / 2,
        -particle.height / 2,
        particle.width,
        particle.height,
        particle.height / 2
      );
      ctx.fill();

      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = "#e0f2fe";
      drawRoundedRect(
        -particle.width / 2,
        -particle.height / 4,
        particle.width * 0.8,
        particle.height / 2,
        particle.height / 4
      );
      ctx.fill();
    }

    ctx.restore();
  }

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
    { text: "근접 적", x: 1090, y: 370 },
    { text: "J 공격 / L 회복", x: 1270, y: 270 },
    { text: "비행 적", x: 2010, y: 215 },
    { text: "이중 점프 능력", x: 2125, y: 305 },
    { text: "대시 필요", x: 2070, y: 455 },
    { text: "두 번째 근접 적", x: 2300, y: 370 },
    { text: "열쇠 획득 구간", x: 3040, y: 250 },
    { text: "열쇠 없이는 통과 불가", x: 3450, y: 280 },
    { text: "이중 점프 구간", x: 3860, y: 225 },
    { text: "원거리 적", x: 3890, y: 360 }
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
    ctx.fillStyle = "#7dd3fc";
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
  const hitbox = getClippedHitboxByWalls(rawHitbox, player, player.facing);

  if (hitbox.width <= 2) {
    return;
  }

  const screenX = hitbox.x - camera.x;
  const screenY = hitbox.y - camera.y;
  const progress = player.attackTimer / player.attackDuration;
  const sweep = 1 - progress;

  ctx.save();
  ctx.lineCap = "round";

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
  ctx.ellipse(
    screenX + player.width / 2,
    screenY + player.height + 3,
    visual.shadowWidth,
    5,
    0,
    0,
    Math.PI * 2
  );
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
  ctx.strokeStyle = state === "heal" ? "#86efac" : "#38bdf8";
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

    if (player.facing === 1) {
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
  } else if (state === "jump") {
    ctx.fillRect(8, 42, 7, 5);
    ctx.fillRect(18, 42, 7, 5);
  } else if (state === "fall") {
    ctx.fillRect(7, 44, 8, 5);
    ctx.fillRect(18, 44, 8, 5);
  } else if (state === "dash") {
    ctx.fillRect(7 - player.facing * 2, 43, 8, 5);
    ctx.fillRect(18 - player.facing * 2, 43, 8, 5);
  } else if (state === "attack") {
    ctx.fillRect(7 - player.facing, 43, 8, 5);
    ctx.fillRect(18 - player.facing, 43, 8, 5);
  } else {
    ctx.fillRect(8, 43, 7, 5);
    ctx.fillRect(18, 43, 7, 5);
  }

  ctx.strokeStyle = visual.coreColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(16, 29, visual.coreRadius, 0, Math.PI * 2);
  ctx.stroke();

  if (state === "heal") {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#86efac";
    ctx.beginPath();
    ctx.arc(16, 29, 10 + Math.sin(frameCount * 0.25) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawCharacterHead(state, visual, bob) {
  ctx.save();
  ctx.translate(visual.lean, bob + visual.headY);

  ctx.strokeStyle = "#dbeafe";
  ctx.lineWidth = 3;

  if (state === "dash") {
    ctx.beginPath();
    ctx.moveTo(9, 8);
    ctx.quadraticCurveTo(3 - player.facing * 4, 0, 2 - player.facing * 7, -5);
    ctx.moveTo(23, 8);
    ctx.quadraticCurveTo(29 - player.facing * 4, 0, 30 - player.facing * 7, -5);
    ctx.stroke();
  } else if (state === "attack") {
    ctx.beginPath();
    ctx.moveTo(9, 8);
    ctx.quadraticCurveTo(4 - player.facing * 2, 0, 2 - player.facing * 3, -5);
    ctx.moveTo(23, 8);
    ctx.quadraticCurveTo(28 - player.facing * 2, 0, 30 - player.facing * 3, -5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(9, 8);
    ctx.quadraticCurveTo(4, 0, 2, -5);
    ctx.moveTo(23, 8);
    ctx.quadraticCurveTo(28, 0, 30, -5);
    ctx.stroke();
  }

  ctx.fillStyle = "#dbeafe";
  ctx.strokeStyle = state === "heal" ? "#86efac" : "#f8fafc";
  ctx.lineWidth = 2;
  drawRoundedRect(5, 4, 22, 18, 7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = state === "heal" ? "#bbf7d0" : "#bfdbfe";
  drawRoundedRect(7, 13, 18, 7, 4);
  ctx.fill();

  ctx.fillStyle = "#020617";

  let eyeOffset = 0;

  if (state === "dash") {
    eyeOffset = player.facing * 2;
  }

  if (state === "attack") {
    eyeOffset = player.facing * 1;
  }

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

  if (player.invincibleTimer > 0 && frameCount % 8 < 4) {
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
  const startY = 285;

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
  const startY = 315;

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

function drawUI() {
  const currentRoom = getCurrentRoom();
  const playerState = playerAnimation.state;

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("7단계-1: 능력 해금 시스템 - 이중 점프", 20, 35);

  ctx.font = "16px Arial";
  ctx.fillText("A/D: 이동 | Space: 점프/이중 점프 | Shift 또는 K: 대시 | J: 공격 | L: 회복", 20, 65);

  ctx.fillStyle = "#bfdbfe";
  ctx.fillText("현재 방: " + currentRoom.name, 20, 95);

  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("방 설명: " + currentRoom.guide, 20, 120);

  ctx.fillStyle = "#fef08a";
  ctx.fillText("캐릭터 상태: " + getStateName(playerState), 20, 150);

  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("상태 프레임: " + playerAnimation.stateFrame, 20, 180);

  if (gameState.hasKey) {
    ctx.fillStyle = "#fef08a";
    ctx.fillText("열쇠: 보유 중", 20, 210);
  } else {
    ctx.fillStyle = "#fecaca";
    ctx.fillText("열쇠: 없음", 20, 210);
  }

  if (player.dashCooldown <= 0) {
    ctx.fillStyle = "#bbf7d0";
    ctx.fillText("대시: 사용 가능", 20, 240);
  } else {
    const cooldownPercent = Math.ceil((player.dashCooldown / player.dashCooldownMax) * 100);
    ctx.fillStyle = "#fde68a";
    ctx.fillText("대시 쿨타임: " + cooldownPercent + "%", 20, 240);
  }

  if (player.hasDoubleJump) {
    ctx.fillStyle = "#c4b5fd";
    ctx.fillText("능력: 이중 점프 획득", 20, 265);
  } else {
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("능력: 없음", 20, 265);
  }

  drawHealthUI();
  drawCoreEnergyUI();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText(gameState.message, 20, 360);

  drawMiniMap();
}

function update() {
  frameCount += 1;

  if (hitStopTimer > 0) {
    hitStopTimer -= 1;
    updateParticles();
    updateCamera();
    return;
  }

  updatePlayer();
  updatePlayerAnimation();
  updatePlayerCombat();
  updateEnemies();
  updateProjectilesAndDamage();
  checkAttackHits();
  checkEnemyAttackDamage();
  checkPlayerEnemyDamage();
  updateParticles();
  updateCamera();
}

function drawWorld() {
  ctx.save();
  ctx.translate(camera.shakeX, camera.shakeY);

  drawRoomBackgrounds();
  drawBackgroundDecorations();
  drawRoomLabels();
  drawDoors();
  drawPlatforms();
  drawKeyItem();
  drawAbilityItems();
  drawWarnings();
  drawEnemies();
  drawEnemyAttacks();
  drawProjectiles();
  drawParticles();
  drawPlayer();
  drawAttack();

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawWorld();
  drawUI();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
