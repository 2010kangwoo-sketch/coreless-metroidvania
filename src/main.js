const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};

const world = {
  width: 2600,
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

const platforms = [
  { x: 0, y: 420, width: 330, height: 80 },
  { x: 450, y: 420, width: 360, height: 80 },
  { x: 900, y: 420, width: 420, height: 80 },
  { x: 1450, y: 420, width: 500, height: 80 },
  { x: 2100, y: 420, width: 500, height: 80 },

  { x: 150, y: 340, width: 180, height: 24 },
  { x: 410, y: 285, width: 160, height: 24 },
  { x: 650, y: 340, width: 150, height: 24 },

  { x: 980, y: 330, width: 180, height: 24 },
  { x: 1220, y: 280, width: 150, height: 24 },
  { x: 1530, y: 340, width: 170, height: 24 },
  { x: 1780, y: 290, width: 160, height: 24 },

  { x: 2050, y: 340, width: 170, height: 24 },
  { x: 2300, y: 280, width: 190, height: 24 },

  // 벽처럼 쓰는 장애물
  { x: 760, y: 260, width: 40, height: 80 },
  { x: 1360, y: 300, width: 40, height: 120 },
  { x: 1960, y: 300, width: 40, height: 120 }
];

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

  for (const platform of platforms) {
    if (isColliding(player, platform)) {
      if (player.vx > 0) {
        player.x = platform.x - player.width;
      } else if (player.vx < 0) {
        player.x = platform.x + platform.width;
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

  for (const platform of platforms) {
    if (isColliding(player, platform)) {
      if (player.vy > 0) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = platform.y + platform.height;
        player.vy = 0;
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
}

function updatePlayer() {
  updateDash();
  updatePlayerHorizontalMove();
  updateGravity();

  moveHorizontally();
  moveVertically();

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

function drawBackground() {
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-camera.x, 420 - camera.y, world.width, world.height - 420);

  // 배경 기둥 장식
  for (let x = 200; x < world.width; x += 400) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x - camera.x, 120 - camera.y, 70, 300);
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

function drawGapWarning() {
  ctx.fillStyle = "#facc15";
  ctx.font = "14px Arial";

  const warnings = [
    { text: "낭떠러지", x: 355, y: 455 },
    { text: "넓은 맵 구간", x: 980, y: 390 },
    { text: "카메라 이동 테스트", x: 1750, y: 260 }
  ];

  for (const warning of warnings) {
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

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("3단계-3: 넓은 맵과 카메라 추가", 20, 35);

  ctx.font = "16px Arial";
  ctx.fillText("A/D: 이동 | Space: 점프 | Shift 또는 K: 대시", 20, 65);

  if (player.dashCooldown <= 0) {
    ctx.fillText("대시: 사용 가능", 20, 95);
  } else {
    const cooldownPercent = Math.ceil((player.dashCooldown / player.dashCooldownMax) * 100);
    ctx.fillText("대시 쿨타임: " + cooldownPercent + "%", 20, 95);
  }

  ctx.fillText("현재 위치 X: " + Math.floor(player.x) + " / " + world.width, 20, 125);
}

function update() {
  updatePlayer();
  updateCamera();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawPlatforms();
  drawGapWarning();
  drawPlayer();
  drawUI();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
