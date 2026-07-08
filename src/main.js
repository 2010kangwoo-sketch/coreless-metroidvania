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
  speed: 4,
  jumpPower: -12,
  onGround: false
};

const gravity = 0.6;
const floorY = 420;

document.addEventListener("keydown", function(event) {
  keys[event.code] = true;
});

document.addEventListener("keyup", function(event) {
  keys[event.code] = false;
});

function updatePlayer() {
  player.vx = 0;

  if (keys["KeyA"]) {
    player.vx = -player.speed;
  }

  if (keys["KeyD"]) {
    player.vx = player.speed;
  }

  if (keys["Space"] && player.onGround) {
    player.vy = player.jumpPower;
    player.onGround = false;
  }

  player.vy += gravity;

  player.x += player.vx;
  player.y += player.vy;

  if (player.y + player.height >= floorY) {
    player.y = floorY - player.height;
    player.vy = 0;
    player.onGround = true;
  }

  if (player.x < 0) {
    player.x = 0;
  }

  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }
}

function drawMap() {
  ctx.fillStyle = "#444";
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
}

function drawPlayer() {
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("2단계: 파일 구조 분리 중", 20, 35);
}

function update() {
  updatePlayer();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap();
  drawPlayer();
  drawUI();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
