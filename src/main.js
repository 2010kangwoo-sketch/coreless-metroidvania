const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};

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

// 발판 목록입니다.
// x, y는 발판의 왼쪽 위 좌표입니다.
// width는 가로 길이, height는 세로 높이입니다.
const platforms = [
  { x: 0, y: 420, width: 330, height: 80 },
  { x: 450, y: 420, width: 450, height: 80 },

  { x: 150, y: 340, width: 180, height: 24 },
  { x: 410, y: 285, width: 160, height: 24 },
  { x: 650, y: 340, width: 150, height: 24 },

  { x: 540, y: 210, width: 100, height: 24 },
  { x: 80, y: 250, width: 90, height: 24 },

  // 벽처럼 쓰는 장애물
  { x: 760, y: 260, width: 40, height: 80 }
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

  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
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
  if (player.y > canvas.height + 100) {
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

function drawBackground() {
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 420, canvas.width, canvas.height - 420);
}

function drawPlatforms() {
  for (const platform of platforms) {
    ctx.fillStyle = "#475569";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    ctx.fillStyle = "#64748b";
    ctx.fillRect(platform.x, platform.y, platform.width, 5);
  }
}

function drawGapWarning() {
  ctx.fillStyle = "#facc15";
  ctx.font = "14px Arial";
  ctx.fillText("낭떠러지", 355, 455);
}

function drawPlayer() {
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#e0f2fe";

  if (player.facing === 1) {
    ctx.fillRect(player.x + 20, player.y + 12, 6, 6);
  } else {
    ctx.fillRect(player.x + 6, player.y + 12, 6, 6);
  }

  if (player.isDashing) {
    ctx.fillStyle = "rgba(125, 211, 252, 0.35)";

    if (player.facing === 1) {
      ctx.fillRect(player.x - 28, player.y + 8, 24, 32);
    } else {
      ctx.fillRect(player.x + player.width + 4, player.y + 8, 24, 32);
    }
  }
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("3단계-2: 발판과 충돌 추가", 20, 35);

  ctx.font = "16px Arial";
  ctx.fillText("A/D: 이동 | Space: 점프 | Shift 또는 K: 대시", 20, 65);

  if (player.dashCooldown <= 0) {
    ctx.fillText("대시: 사용 가능", 20, 95);
  } else {
    const cooldownPercent = Math.ceil((player.dashCooldown / player.dashCooldownMax) * 100);
    ctx.fillText("대시 쿨타임: " + cooldownPercent + "%", 20, 95);
  }
}

function update() {
  updatePlayer();
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
