const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};

const player = {
  x: 100,
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

const gravity = 0.65;
const floorY = 420;

document.addEventListener("keydown", function(event) {
  keys[event.code] = true;

  if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
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

  if (keys["ShiftLeft"] || keys["ShiftRight"] || keys["KeyK"]) {
    startDash();
  }

  if (player.isDashing) {
    player.vx = player.facing * player.dashSpeed;
    player.dashTimer -= 1;

    if (player.dashTimer <= 0) {
      player.isDashing = false;
    }
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

function updatePlayerJump() {
  if (keys["Space"] && player.onGround) {
    player.vy = player.jumpPower;
    player.onGround = false;
  }
}

function updateGravity() {
  if (!player.isDashing) {
    player.vy += gravity;
  }
}

function updatePlayerPosition() {
  player.x += player.vx;
  player.y += player.vy;
}

function checkFloorCollision() {
  if (player.y + player.height >= floorY) {
    player.y = floorY - player.height;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }
}

function checkWallCollision() {
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }

  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
    player.vx = 0;
  }
}

function updatePlayer() {
  updateDash();
  updatePlayerHorizontalMove();
  updatePlayerJump();
  updateGravity();
  updatePlayerPosition();
  checkFloorCollision();
  checkWallCollision();
}

function drawBackground() {
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
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
  ctx.fillText("3단계: 이동감 개선 + 대시 추가", 20, 35);

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
  drawPlayer();
  drawUI();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
