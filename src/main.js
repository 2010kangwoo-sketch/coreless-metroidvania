const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};

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
  // 방 1
  { x: 0, y: 420, width: 840, height: 80 },
  { x: 150, y: 350, width: 180, height: 24 },
  { x: 450, y: 315, width: 180, height: 24 },

  // 방 2
  { x: 920, y: 420, width: 820, height: 80 },
  { x: 1030, y: 350, width: 170, height: 24 },
  { x: 1260, y: 300, width: 150, height: 24 },
  { x: 1510, y: 350, width: 170, height: 24 },

  // 방 3
  { x: 1820, y: 420, width: 260, height: 80 },
  { x: 2220, y: 420, width: 420, height: 80 },
  { x: 1890, y: 345, width: 130, height: 24 },
  { x: 2130, y: 360, width: 90, height: 24 },
  { x: 2320, y: 330, width: 150, height: 24 },

  // 방 4
  { x: 2700, y: 420, width: 820, height: 80 },
  { x: 2830, y: 350, width: 160, height: 24 },
  { x: 3060, y: 300, width: 160, height: 24 },
  { x: 3300, y: 350, width: 160, height: 24 },

  // 방 5
  { x: 3600, y: 420, width: 900, height: 80 },
  { x: 3740, y: 340, width: 180, height: 24 },
  { x: 4000, y: 290, width: 180, height: 24 },
  { x: 4260, y: 340, width: 160, height: 24 },

  // 벽 장애물
  { x: 760, y: 260, width: 40, height: 80 },
  { x: 1660, y: 300, width: 40, height: 120 },
  { x: 2500, y: 300, width: 40, height: 120 }
];

const doors = [
  { x: 860, y: 330, width: 40, height: 90, text: "문 1", locked: false, open: true },
  { x: 1760, y: 330, width: 40, height: 90, text: "문 2", locked: false, open: true },
  { x: 2660, y: 330, width: 40, height: 90, text: "문 3", locked: false, open: true },
  { x: 3560, y: 300, width: 40, height: 120, text: "잠긴 문", locked: true, open: false }
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
  if (player.dashCooldown > 0) return;
  if (player.isDashing) return;

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
      if (player.vx > 0) {
        player.x = object.x - player.width;
      } else if (player.vx < 0) {
        player.x = object.x + object.width;
      }

      player.vx = 0;
      player.isDashing = false;

      if (object.locked && !object.open) {
        gameState.message = "잠긴 문입니다. 열쇠가 필요합니다.";
      }
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

function checkDoorUnlock() {
  for (const door of doors) {
    if (door.locked && !door.open && gameState.hasKey && isColliding(player, door)) {
      door.open = true;
      gameState.message = "잠긴 문이 열렸습니다.";
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
  gameState.message = "낭떠러지에서 떨어져 시작 지점으로 돌아왔습니다.";
}

function updatePlayer() {
  updateDash();
  updatePlayerHorizontalMove();
  updateGravity();

  moveHorizontally();
  moveVertically();

  checkKeyCollection();
  checkDoorUnlock();
  checkFall();
}

function updateCamera() {
  camera.x = player.x + player.width / 2 - camera.width / 2;
  camera.y = player.y + player.height / 2 - camera.height / 2;

  if (camera.x < 0) camera.x = 0;
  if (camera.y < 0) camera.y = 0;

  if (camera.x + camera.width > world.width) {
    camera.x = world.width - camera.width;
  }

  if (camera.y + camera.height > world.height) {
    camera.y = world.height - camera.height;
  }
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

function drawPlayer() {
  const screenX = player.x - camera.x;
  const screenY = player.y - camera.y;

  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(screenX, screenY, player.width, player.height);

  ctx.fillStyle = "#e0f2fe";

  if (player.facing === 1) {
    ctx.fillRect(screenX + 20, screenY + 12, 6, 6);
  } else {
    ctx.fillRect(screenX + 6, screenY + 12, 6, 6);
  }

  if (player.isDashing) {
    ctx.fillStyle = "rgba(125, 211, 252, 0.35)";

    if (player.facing === 1) {
      ctx.fillRect(screenX - 28, screenY + 8, 24, 32);
    } else {
      ctx.fillRect(screenX + player.width + 4, screenY + 8, 24, 32);
    }
  }
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

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("4단계-2: 열쇠와 잠긴 문 추가", 20, 35);

  ctx.font = "16px Arial";
  ctx.fillText("A/D: 이동 | Space: 점프 | Shift 또는 K: 대시", 20, 65);

  ctx.fillStyle = "#bfdbfe";
  ctx.fillText("현재 방: " + currentRoom.name, 20, 95);

  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("방 설명: " + currentRoom.guide, 20, 120);

  if (gameState.hasKey) {
    ctx.fillStyle = "#fef08a";
    ctx.fillText("열쇠: 보유 중", 20, 150);
  } else {
    ctx.fillStyle = "#fecaca";
    ctx.fillText("열쇠: 없음", 20, 150);
  }

  if (player.dashCooldown <= 0) {
    ctx.fillStyle = "#bbf7d0";
    ctx.fillText("대시: 사용 가능", 20, 180);
  } else {
    const cooldownPercent = Math.ceil((player.dashCooldown / player.dashCooldownMax) * 100);
    ctx.fillStyle = "#fde68a";
    ctx.fillText("대시 쿨타임: " + cooldownPercent + "%", 20, 180);
  }

  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("현재 위치 X: " + Math.floor(player.x) + " / " + world.width, 20, 210);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText(gameState.message, 20, 240);

  drawMiniMap();
}

function update() {
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
