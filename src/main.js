const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};
let frameCount = 0;

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
  if (state === "idle") return "정지";
  if (state === "walk") return "걷기";
  if (state === "jump") return "점프";
  if (state === "fall") return "낙하";
  if (state === "dash") return "대시";

  return "알 수 없음";
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
}

function updateDash() {
  if (player.dashCooldown > 0) {
    player.dashCooldown -= 1;
  }

  if (player.isDashing) {
    player.vx = player.facing * player.dashSpeed;
    player.dashTimer -= 1;

    if (player.dashTimer <= 0) {
      player.isDashing = false;
    }
  }
}

function tryJump() {
  if (player.onGround) {
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

function moveVertically() {
  player.y += player.vy;
  player.onGround = false;

  for (const object of getSolidObjects()) {
    if (isColliding(player, object)) {
      if (player.vy > 0) {
        player.y = object.y - player.height;
        player.vy = 0;
        player.onGround = true;
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
}

function updatePlayer() {
  updateDash();
  updatePlayerHorizontalMove();
  updateGravity();

  moveHorizontally();
  moveVertically();

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

function drawPlayerShadow(screenX, screenY, state) {
  ctx.save();

  let shadowWidth = 16;

  if (state === "jump") {
    shadowWidth = 12;
  }

  if (state === "fall") {
    shadowWidth = 20;
  }

  if (state === "dash") {
    shadowWidth = 24;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(screenX + player.width / 2, screenY + player.height + 3, shadowWidth, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPlayerBody(state, bob) {
  const walkCycle = state === "walk" ? Math.sin(frameCount * 0.35) : 0;

  let lean = 0;
  let bodyTop = 18;
  let leftBottom = 1;
  let rightBottom = 31;
  let centerBottom = 16;

  if (state === "dash") {
    lean = player.facing * 4;
    bodyTop = 17;
    leftBottom = player.facing === 1 ? -2 : 3;
    rightBottom = player.facing === 1 ? 29 : 34;
    centerBottom = player.facing === 1 ? 18 : 14;
  }

  if (state === "jump") {
    bodyTop = 19;
    leftBottom = 4;
    rightBottom = 28;
    centerBottom = 16;
  }

  if (state === "fall") {
    bodyTop = 17;
    leftBottom = -1;
    rightBottom = 33;
    centerBottom = 16;
  }

  ctx.save();
  ctx.translate(lean, bob);

  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(7, bodyTop);
  ctx.lineTo(25, bodyTop);
  ctx.lineTo(rightBottom, 44);
  ctx.lineTo(22, 48);
  ctx.lineTo(centerBottom, 43);
  ctx.lineTo(10, 48);
  ctx.lineTo(leftBottom, 44);
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

  ctx.strokeStyle = state === "dash" ? "#fef08a" : "#7dd3fc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(16, 29, state === "dash" ? 5 : 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawPlayerHead(state, bob) {
  let lean = 0;
  let headY = 0;

  if (state === "dash") {
    lean = player.facing * 4;
  }

  if (state === "jump") {
    headY = -2;
  }

  if (state === "fall") {
    headY = 2;
  }

  ctx.save();
  ctx.translate(lean, bob + headY);

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

function drawPlayer() {
  const screenX = player.x - camera.x;
  const screenY = player.y - camera.y;
  const state = getPlayerState();

  let bob = 0;

  if (state === "walk") {
    bob = Math.sin(frameCount * 0.25) * 1.5;
  }

  if (state === "idle") {
    bob = Math.sin(frameCount * 0.08) * 0.6;
  }

  if (state === "dash") {
    drawDashAfterImages(screenX, screenY, bob);
  }

  drawStateEffects(screenX, screenY, state);
  drawPlayerShadow(screenX, screenY, state);

  ctx.save();
  ctx.translate(screenX, screenY);
  drawPlayerBody(state, bob);
  drawPlayerHead(state, bob);
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

function drawUI() {
  const currentRoom = getCurrentRoom();
  const playerState = getPlayerState();

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("5단계-2: 행동 상태별 자세 구분", 20, 35);

  ctx.font = "16px Arial";
  ctx.fillText("A/D: 이동 | Space: 점프 | Shift 또는 K: 대시", 20, 65);

  ctx.fillStyle = "#bfdbfe";
  ctx.fillText("현재 방: " + currentRoom.name, 20, 95);

  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("방 설명: " + currentRoom.guide, 20, 120);

  ctx.fillStyle = "#fef08a";
  ctx.fillText("캐릭터 상태: " + getStateName(playerState), 20, 150);

  if (gameState.hasKey) {
    ctx.fillStyle = "#fef08a";
    ctx.fillText("열쇠: 보유 중", 20, 180);
  } else {
    ctx.fillStyle = "#fecaca";
    ctx.fillText("열쇠: 없음", 20, 180);
  }

  if (player.dashCooldown <= 0) {
    ctx.fillStyle = "#bbf7d0";
    ctx.fillText("대시: 사용 가능", 20, 210);
  } else {
    const cooldownPercent = Math.ceil((player.dashCooldown / player.dashCooldownMax) * 100);
    ctx.fillStyle = "#fde68a";
    ctx.fillText("대시 쿨타임: " + cooldownPercent + "%", 20, 210);
  }

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText(gameState.message, 20, 240);

  drawMiniMap();
}

function update() {
  frameCount += 1;
  updatePlayer();
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
  drawPlayer();
  drawUI();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
