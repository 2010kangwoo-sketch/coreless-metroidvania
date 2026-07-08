const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};
let frameCount = 0;

const particles = [];

const world = {
  width: 4500,
  height: 900
};

const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height
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

  facing: 1,

  isDashing: false,
  dashTimer: 0,
  dashDuration: 10,
  dashSpeed: 12,
  dashCooldown: 0,
  dashCooldownMax: 120
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
    bobAmount: 0.6,
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
    bobAmount: 1.5,
    bodyTop: 18,
    leftBottom: 1,
    rightBottom: 31,
    centerBottom: 16,
    headY: 0,
    coreRadius: 4,
    coreColor: "#7dd3fc",
    shadowWidth: 16
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
  }
};

const startPosition = {
  x: 70,
  y: 300
};

const gravity = 0.65;

const gameState = {
  hasKey: false,
  message: "열쇠를 찾아 잠긴 문을 열어보세요."
};

const rooms = [
  { name: "방 1: 시작 구역", guide: "기본 이동과 점프", x: 0, width: 900, color: "#111827" },
  { name: "방 2: 점프 연습 구역", guide: "발판을 밟고 위로 이동", x: 900, width: 900, color: "#172033" },
  { name: "방 3: 대시 연습 구역", guide: "넓은 틈을 대시로 넘기", x: 1800, width: 900, color: "#1f1b2e" },
  { name: "방 4: 잠긴 통로 구역", guide: "열쇠가 있어야 문 통과 가능", x: 2700, width: 900, color: "#201a1a" },
  { name: "방 5: 다음 지역 입구", guide: "다음 단계 연결 예정", x: 3600, width: 900, color: "#10251f" }
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

document.addEventListener("keydown", function(event) {
  keys[event.code] = true;

  if (event.code === "Space") {
    tryJump();
    event.preventDefault();
  }

  if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyK") {
    startDash();
    event.preventDefault();
  }
});

document.addEventListener("keyup", function(event) {
  keys[event.code] = false;
});

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

  for (let i = 0; i < 4; i++) {
    addDustParticle(
      player.x + player.width / 2 + (Math.random() - 0.5) * 14,
      player.y + player.height + 3,
      (Math.random() - 0.5) * 0.6,
      -0.1,
      18 + Math.random() * 18,
      3 + Math.random() * 2,
      18 + Math.random() * 8,
      "rgba(203, 213, 225, 1)",
      (Math.random() - 0.5) * 0.2
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

function drawParticles() {
  ctx.save();

  for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;
    const screenX = particle.x - camera.x;
    const screenY = particle.y - camera.y;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (particle.type === "dust") {
      ctx.translate(screenX, screenY);
      ctx.rotate(particle.rotation);

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

      ctx.globalAlpha = alpha * 0.25;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        particle.width * 1.5,
        particle.height * 1.2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    if (particle.type === "dash") {
      ctx.translate(screenX, screenY);
      ctx.rotate(particle.rotation);

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

function startDash() {
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

function tryJump() {
  if (player.onGround) {
    spawnJumpParticles();

    player.vy = player.jumpPower;
    player.onGround = false;
  }
}

function updatePlayerHorizontalMove() {
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

function checkKeyCollection() {
  if (!keyItem.collected && isColliding(player, keyItem)) {
    keyItem.collected = true;
    gameState.hasKey = true;
    gameState.message = "열쇠를 획득했습니다. 이제 잠긴 문을 열 수 있습니다.";
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
  gameState.message = "낭떠러지에서 떨어져 시작 지점으로 돌아왔습니다.";

  for (let i = 0; i < 16; i++) {
    const direction = i % 2 === 0 ? -1 : 1;

    addDustParticle(
      player.x + player.width / 2,
      player.y + player.height + 2,
      direction * (1.2 + Math.random() * 2.2),
      -0.5 - Math.random() * 1.2,
      12 + Math.random() * 18,
      3 + Math.random() * 3,
      26 + Math.random() * 10,
      "rgba(125, 211, 252, 1)",
      direction * (0.05 + Math.random() * 0.2)
    );
  }
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
    { text: "점프 구간", x: 1210, y: 270 },
    { text: "대시 필요", x: 2070, y: 455 },
    { text: "열쇠 획득 구간", x: 3040, y: 250 },
    { text: "열쇠 없이는 통과 불가", x: 3450, y: 280 },
    { text: "다음 지역 입구", x: 4040, y: 260 }
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

function drawCharacterBody(state, visual, bob) {
  const walkCycle = state === "walk" ? Math.sin(playerAnimation.stateFrame * 0.35) : 0;

  ctx.save();
  ctx.translate(visual.lean, bob);

  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = "#38bdf8";
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

  if (state === "dash") {
    ctx.beginPath();
    ctx.moveTo(9, 8);
    ctx.quadraticCurveTo(3 - player.facing * 4, 0, 2 - player.facing * 7, -5);
    ctx.moveTo(23, 8);
    ctx.quadraticCurveTo(29 - player.facing * 4, 0, 30 - player.facing * 7, -5);
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
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2;
  drawRoundedRect(5, 4, 22, 18, 7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#bfdbfe";
  drawRoundedRect(7, 13, 18, 7, 4);
  ctx.fill();

  ctx.fillStyle = "#020617";

  let eyeOffset = 0;

  if (state === "dash") {
    eyeOffset = player.facing * 2;
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
  drawVectorCharacter(screenX, screenY, state, visual, bob);
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

function drawUI() {
  const currentRoom = getCurrentRoom();
  const playerState = playerAnimation.state;

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("5단계-4: 캐릭터 그래픽 구조 정리", 20, 35);

  ctx.font = "16px Arial";
  ctx.fillText("A/D: 이동 | Space: 점프 | Shift 또는 K: 대시", 20, 65);

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

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText(gameState.message, 20, 270);

  drawMiniMap();
}

function update() {
  frameCount += 1;

  updatePlayer();
  updatePlayerAnimation();
  updateParticles();
  updateCamera();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRoomBackgrounds();
  drawBackgroundDecorations();
  drawRoomLabels();
  drawDoors();
  drawPlatforms();
  drawKeyItem();
  drawWarnings();
  drawParticles();
  drawPlayer();
  drawUI();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
