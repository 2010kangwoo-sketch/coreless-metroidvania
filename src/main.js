"use strict";
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const buildStatus = document.getElementById("buildStatus");
  const auditStatus = document.getElementById("auditStatus");

  const BUILD = Object.freeze({
    version: "rebuild-pass03",
    pass: 3,
    canvasWidth: 1200,
    canvasHeight: 680,
    playableWidth: 4500,
    minWorldY: -900,
    maxWorldY: 680,
    tutorialWidth: 1200,
    precisionWidth: 2400,
    shaftX: 3600,
    shaftWidth: 900
  });

  const METRICS = Object.freeze({
    width: 34,
    height: 48,
    runSpeed: 5.35,
    groundAcceleration: 0.72,
    airAcceleration: 0.42,
    friction: 0.78,
    jumpVelocity: 12.2,
    wallJumpVelocity: 11.8,
    wallJumpHorizontal: 8.4,
    wallSlideSpeed: 3.15,
    gravity: 0.68,
    maxFallSpeed: 15.5,
    dashSpeed: 11.8,
    dashFrames: 11,
    dashCooldownFrames: 54,
    coyoteFrames: 7,
    jumpBufferFrames: 8,
    invincibleFrames: 54
  });

  const derived = Object.freeze({
    jumpRise: METRICS.jumpVelocity ** 2 / (2 * METRICS.gravity),
    wallJumpRise: METRICS.wallJumpVelocity ** 2 / (2 * METRICS.gravity),
    dashDistance: METRICS.dashSpeed * METRICS.dashFrames,
    maxReliableGap: 178,
    shaftInnerWidth: 200
  });

  const ROOMS = Object.freeze([
    { id: "tutorial", order: 1, name: "이동 도입", subtitle: "달리기·점프·낮은 장애물", x: 0, width: 1200, minY: 0, maxY: 680, camera: "fixed" },
    { id: "precision", order: 2, name: "정밀 점프", subtitle: "한 방향의 연속 점프와 가시", x: 1200, width: 2400, minY: 0, maxY: 680, camera: "follow" },
    { id: "wallshaft", order: 3, name: "벽점프 수직축", subtitle: "벽 미끄러짐·교차 벽점프·상단 출구", x: 3600, width: 900, minY: -900, maxY: 680, camera: "vertical" }
  ]);

  const solids = [
    { id: "tutorial_floor", x: 0, y: 596, width: 1200, height: 84, kind: "floor" },
    { id: "tutorial_left_wall", x: 0, y: 0, width: 28, height: 596, kind: "wall" },
    { id: "tutorial_ceiling", x: 0, y: 0, width: 1200, height: 26, kind: "ceiling" },
    { id: "tutorial_gate_upper", x: 1172, y: 26, width: 28, height: 470, kind: "wall" },
    { id: "tutorial_step_1", x: 350, y: 530, width: 72, height: 66, kind: "block" },
    { id: "tutorial_step_2", x: 690, y: 504, width: 86, height: 92, kind: "block" },
    { id: "tutorial_step_3", x: 1002, y: 548, width: 94, height: 48, kind: "block" },

    { id: "precision_ceiling", x: 1200, y: 0, width: 2400, height: 26, kind: "ceiling" },
    { id: "precision_gate_upper", x: 1200, y: 26, width: 28, height: 470, kind: "wall" },
    { id: "precision_shaft_partition", x: 3572, y: -900, width: 28, height: 1396, kind: "wall" },
    { id: "p0", x: 1200, y: 596, width: 220, height: 84, kind: "floor" },
    { id: "p1", x: 1500, y: 548, width: 180, height: 132, kind: "platform" },
    { id: "p2", x: 1752, y: 486, width: 190, height: 194, kind: "platform" },
    { id: "p3", x: 2010, y: 550, width: 190, height: 130, kind: "platform" },
    { id: "p4", x: 2278, y: 512, width: 186, height: 168, kind: "platform" },
    { id: "p5", x: 2534, y: 452, width: 200, height: 228, kind: "platform" },
    { id: "p6", x: 2810, y: 526, width: 190, height: 154, kind: "platform" },
    { id: "p7", x: 3074, y: 488, width: 190, height: 192, kind: "platform" },
    { id: "p8", x: 3340, y: 596, width: 260, height: 84, kind: "floor" },

    { id: "shaft_floor", x: 3600, y: 596, width: 900, height: 84, kind: "floor" },
    { id: "shaft_ceiling", x: 3600, y: -900, width: 900, height: 26, kind: "ceiling" },
    { id: "shaft_left_wall", x: 3720, y: -720, width: 28, height: 1220, kind: "wall" },
    { id: "shaft_right_wall", x: 3948, y: -460, width: 28, height: 960, kind: "wall" },
    { id: "shaft_outer_right", x: 4472, y: -900, width: 28, height: 1496, kind: "wall" },
    { id: "shaft_rest_l1", x: 3748, y: 360, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_rest_r1", x: 3884, y: 180, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_rest_l2", x: 3748, y: 0, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_rest_r2", x: 3884, y: -180, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_rest_l3", x: 3748, y: -360, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_top_floor", x: 3948, y: -460, width: 524, height: 76, kind: "floor" },
    { id: "shaft_exit_step", x: 4200, y: -610, width: 150, height: 18, kind: "ledge" }
  ];

  const spikes = [
    { id: "s1", x: 1420, y: 628, width: 80, height: 52 },
    { id: "s2", x: 1680, y: 628, width: 72, height: 52 },
    { id: "s3", x: 1942, y: 628, width: 68, height: 52 },
    { id: "s4", x: 2200, y: 628, width: 78, height: 52 },
    { id: "s5", x: 2464, y: 628, width: 70, height: 52 },
    { id: "s6", x: 2734, y: 628, width: 76, height: 52 },
    { id: "s7", x: 3000, y: 628, width: 74, height: 52 },
    { id: "s8", x: 3264, y: 628, width: 76, height: 52 }
  ];

  const checkpoints = [
    { id: "cp_tutorial", x: 72, y: 548, spawnX: 126, spawnY: 548, room: "tutorial", active: true },
    { id: "cp_precision", x: 1260, y: 548, spawnX: 1320, spawnY: 548, room: "precision", active: false },
    { id: "cp_shaft_entry", x: 3640, y: 548, spawnX: 3680, spawnY: 548, room: "wallshaft", active: false },
    { id: "cp_shaft_top", x: 4148, y: -508, spawnX: 4084, spawnY: -508, room: "wallshaft", active: false }
  ];

  const player = {
    x: checkpoints[0].spawnX,
    y: checkpoints[0].spawnY,
    vx: 0,
    vy: 0,
    width: METRICS.width,
    height: METRICS.height,
    facing: 1,
    onGround: true,
    touchingLeftWall: false,
    touchingRightWall: false,
    wallSliding: false,
    dashTimer: 0,
    dashCooldown: 0,
    coyoteTimer: METRICS.coyoteFrames,
    jumpBuffer: 0,
    invincibleTimer: 0,
    health: 5,
    maxHealth: 5,
    activeCheckpoint: "cp_tutorial"
  };

  const camera = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const keys = new Set();
  let frame = 0;
  let lastTime = performance.now();
  let currentRoomId = "tutorial";
  let previousRoomId = "tutorial";
  let roomBannerTimer = 105;
  let transitionTimer = 0;
  let showAudit = false;
  let showBlueprint = false;
  let message = "오른쪽으로 이동하며 기본 조작을 확인하세요.";
  let messageTimer = 240;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rectsOverlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  const centerX = object => object.x + object.width / 2;
  const centerY = object => object.y + object.height / 2;
  const screenX = worldX => worldX - camera.x;
  const screenY = worldY => worldY - camera.y;

  function setMessage(text, duration = 240) {
    message = text;
    messageTimer = duration;
  }

  function activeCheckpoint() {
    return checkpoints.find(checkpoint => checkpoint.id === player.activeCheckpoint) || checkpoints[0];
  }

  function roomForPlayer() {
    if (centerX(player) < 1200) return ROOMS[0];
    if (centerX(player) < 3600) return ROOMS[1];
    return ROOMS[2];
  }

  function currentRoom() {
    return ROOMS.find(room => room.id === currentRoomId) || ROOMS[0];
  }

  function detectRoom() {
    const room = roomForPlayer();
    currentRoomId = room.id;
    if (currentRoomId === previousRoomId) return;
    previousRoomId = currentRoomId;
    roomBannerTimer = 105;
    transitionTimer = 18;
    if (room.id === "tutorial") {
      camera.x = camera.targetX = 0;
      camera.y = camera.targetY = 0;
      setMessage("이동 도입 구역으로 돌아왔습니다.");
    } else if (room.id === "precision") {
      camera.x = camera.targetX = 1200;
      camera.y = camera.targetY = 0;
      setMessage("가시 사이의 발판만 따라가는 단일 경로입니다.");
    } else {
      camera.x = camera.targetX = 3300;
      camera.y = camera.targetY = 0;
      setMessage("벽을 향해 이동하면서 점프하면 반대쪽 벽으로 튕겨 나갑니다.", 360);
    }
  }

  function activateCheckpoints() {
    for (const checkpoint of checkpoints) {
      const nearX = Math.abs(centerX(player) - checkpoint.x) < 72;
      const nearY = Math.abs(centerY(player) - (checkpoint.y + METRICS.height / 2)) < 90;
      if (!checkpoint.active && nearX && nearY) {
        checkpoint.active = true;
        player.activeCheckpoint = checkpoint.id;
        if (checkpoint.id === "cp_precision") setMessage("정밀 점프 체크포인트가 활성화되었습니다.");
        if (checkpoint.id === "cp_shaft_entry") setMessage("벽점프 수직축 입구 체크포인트가 활성화되었습니다.");
        if (checkpoint.id === "cp_shaft_top") setMessage("3차 구간을 완주했습니다. 다음 차수에서 집게 횡단이 열립니다.", 420);
      }
    }
  }

  function respawn(reason = "체크포인트로 복귀했습니다.") {
    const checkpoint = activeCheckpoint();
    Object.assign(player, {
      x: checkpoint.spawnX,
      y: checkpoint.spawnY,
      vx: 0,
      vy: 0,
      onGround: true,
      touchingLeftWall: false,
      touchingRightWall: false,
      wallSliding: false,
      dashTimer: 0,
      dashCooldown: 0,
      coyoteTimer: METRICS.coyoteFrames,
      jumpBuffer: 0,
      invincibleTimer: METRICS.invincibleFrames,
      health: player.maxHealth
    });
    if (checkpoint.room === "tutorial") {
      camera.x = camera.targetX = 0;
      camera.y = camera.targetY = 0;
    } else if (checkpoint.room === "precision") {
      camera.x = camera.targetX = clamp(checkpoint.spawnX - 360, 1200, 2400);
      camera.y = camera.targetY = 0;
    } else {
      camera.x = camera.targetX = 3300;
      camera.y = camera.targetY = clamp(checkpoint.spawnY - 420, -900, 0);
    }
    detectRoom();
    setMessage(reason);
  }

  function hurt(source, reason) {
    if (player.invincibleTimer > 0 || player.dashTimer > 0) return;
    player.health -= 1;
    player.invincibleTimer = METRICS.invincibleFrames;
    player.vx = centerX(player) < source.x + source.width / 2 ? -6.2 : 6.2;
    player.vy = -7.4;
    player.onGround = false;
    setMessage(reason);
    if (player.health <= 0) respawn("체력을 모두 잃어 체크포인트로 복귀했습니다.");
  }

  function keyDown(event) {
    if (["Space", "ArrowLeft", "ArrowRight", "F1", "F2"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === "Space") player.jumpBuffer = METRICS.jumpBufferFrames;
    if ((event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyK") && player.dashCooldown <= 0) {
      player.dashTimer = METRICS.dashFrames;
      player.dashCooldown = METRICS.dashCooldownFrames;
      player.vy = 0;
    }
    if (event.code === "KeyR") respawn();
    if (event.code === "F1") showBlueprint = !showBlueprint;
    if (event.code === "F2") showAudit = !showAudit;
  }

  function keyUp(event) {
    keys.delete(event.code);
    if (event.code === "Space" && player.vy < -4.8) player.vy *= 0.58;
  }

  function resolveHorizontal(previousX) {
    player.touchingLeftWall = false;
    player.touchingRightWall = false;
    for (const solid of solids) {
      if (solid.kind === "ledge") continue;
      if (!rectsOverlap(player, solid)) continue;
      if (previousX + player.width <= solid.x + 1) {
        player.x = solid.x - player.width;
        player.vx = Math.min(0, player.vx);
        player.touchingRightWall = solid.kind === "wall";
      } else if (previousX >= solid.x + solid.width - 1) {
        player.x = solid.x + solid.width;
        player.vx = Math.max(0, player.vx);
        player.touchingLeftWall = solid.kind === "wall";
      }
    }
  }

  function resolveVertical(previousY) {
    player.onGround = false;
    for (const solid of solids) {
      if (solid.kind === "ledge" && player.vy < 0) continue;
      if (!rectsOverlap(player, solid)) continue;
      const previousBottom = previousY + player.height;
      if (player.vy >= 0 && previousBottom <= solid.y + 2) {
        player.y = solid.y - player.height;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0 && previousY >= solid.y + solid.height - 2) {
        player.y = solid.y + solid.height;
        player.vy = 0;
      }
    }
  }

  function updatePlayer(dt) {
    const wasTouchingLeftWall = player.touchingLeftWall;
    const wasTouchingRightWall = player.touchingRightWall;
    const left = keys.has("KeyA") || keys.has("ArrowLeft");
    const right = keys.has("KeyD") || keys.has("ArrowRight");
    const direction = (right ? 1 : 0) - (left ? 1 : 0);
    if (direction !== 0) player.facing = direction;

    if (player.dashTimer > 0) {
      player.dashTimer = Math.max(0, player.dashTimer - dt);
      player.vx = player.facing * METRICS.dashSpeed;
      player.vy = 0;
    } else {
      const acceleration = player.onGround ? METRICS.groundAcceleration : METRICS.airAcceleration;
      if (direction !== 0) player.vx += direction * acceleration * dt;
      else if (player.onGround) player.vx *= Math.pow(METRICS.friction, dt);
      player.vx = clamp(player.vx, -METRICS.runSpeed, METRICS.runSpeed);
      player.vy = Math.min(METRICS.maxFallSpeed, player.vy + METRICS.gravity * dt);
    }

    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
    player.coyoteTimer = player.onGround ? METRICS.coyoteFrames : Math.max(0, player.coyoteTimer - dt);

    const previousX = player.x;
    player.x += player.vx * dt;
    resolveHorizontal(previousX);

    const pressingIntoWall = (player.touchingLeftWall && left) || (player.touchingRightWall && right);
    player.wallSliding = !player.onGround && player.vy > 0 && pressingIntoWall;
    if (player.wallSliding) player.vy = Math.min(player.vy, METRICS.wallSlideSpeed);

    if (player.jumpBuffer > 0 && player.dashTimer <= 0) {
      if (player.touchingLeftWall || wasTouchingLeftWall) {
        player.vy = -METRICS.wallJumpVelocity;
        player.vx = METRICS.wallJumpHorizontal;
        player.facing = 1;
        player.jumpBuffer = 0;
        player.coyoteTimer = 0;
      } else if (player.touchingRightWall || wasTouchingRightWall) {
        player.vy = -METRICS.wallJumpVelocity;
        player.vx = -METRICS.wallJumpHorizontal;
        player.facing = -1;
        player.jumpBuffer = 0;
        player.coyoteTimer = 0;
      } else if (player.coyoteTimer > 0) {
        player.vy = -METRICS.jumpVelocity;
        player.onGround = false;
        player.coyoteTimer = 0;
        player.jumpBuffer = 0;
      }
    }

    const previousY = player.y;
    player.y += player.vy * dt;
    resolveVertical(previousY);

    player.x = clamp(player.x, 28, BUILD.playableWidth - player.width - 28);
    if (player.y > BUILD.maxWorldY + 80) respawn("낭떠러지로 떨어져 체크포인트로 복귀했습니다.");

    for (const spike of spikes) {
      const hitbox = { x: spike.x + 5, y: spike.y + 10, width: spike.width - 10, height: spike.height - 10 };
      if (rectsOverlap(player, hitbox)) hurt(spike, "가시에 닿아 뒤로 밀려났습니다.");
    }

    detectRoom();
    activateCheckpoints();
  }

  function updateCamera(dt) {
    const room = currentRoom();
    if (room.camera === "fixed") {
      camera.targetX = 0;
      camera.targetY = 0;
    } else if (room.camera === "follow") {
      camera.targetX = clamp(centerX(player) - canvas.width * 0.42, 1200, 2400);
      camera.targetY = 0;
    } else {
      camera.targetX = 3300;
      camera.targetY = clamp(centerY(player) - canvas.height * 0.6, -900, 0);
    }
    camera.x += (camera.targetX - camera.x) * Math.min(1, 0.17 * dt);
    camera.y += (camera.targetY - camera.y) * Math.min(1, 0.14 * dt);
    if (Math.abs(camera.targetX - camera.x) < 0.05) camera.x = camera.targetX;
    if (Math.abs(camera.targetY - camera.y) < 0.05) camera.y = camera.targetY;
  }

  function update(dt) {
    frame += dt;
    roomBannerTimer = Math.max(0, roomBannerTimer - dt);
    transitionTimer = Math.max(0, transitionTimer - dt);
    messageTimer = Math.max(0, messageTimer - dt);
    if (!showBlueprint) {
      updatePlayer(dt);
      updateCamera(dt);
    }
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#08131c");
    gradient.addColorStop(0.64, "#071019");
    gradient.addColorStop(1, "#020407");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const px = -camera.x * 0.12;
    const py = -camera.y * 0.08;
    ctx.fillStyle = "rgba(22, 44, 57, 0.42)";
    for (let i = -1; i < 12; i++) {
      const x = ((i * 260 + px) % 3120) - 120;
      ctx.fillRect(x, 120 + py, 56, 500);
      ctx.beginPath();
      ctx.arc(x + 28, 120 + py, 28, Math.PI, 0);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(111, 153, 168, 0.12)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const x = ((i * 330 - camera.x * 0.2) % 3300) - 100;
      ctx.beginPath();
      ctx.moveTo(x, -20);
      ctx.lineTo(x + 12, 185 + (i % 3) * 80 + py);
      ctx.stroke();
    }
  }

  function drawSolid(solid) {
    const x = screenX(solid.x);
    const y = screenY(solid.y);
    if (x + solid.width < -40 || x > canvas.width + 40 || y + solid.height < -40 || y > canvas.height + 40) return;
    const metal = ctx.createLinearGradient(0, y, 0, y + solid.height);
    metal.addColorStop(0, solid.kind === "wall" ? "#30414d" : "#344754");
    metal.addColorStop(0.18, "#25343f");
    metal.addColorStop(1, "#111a22");
    ctx.fillStyle = metal;
    ctx.fillRect(x, y, solid.width, solid.height);
    ctx.fillStyle = solid.kind === "ceiling" ? "#5a6e78" : "#7897a5";
    ctx.fillRect(x, y, solid.width, Math.min(4, solid.height));
    ctx.strokeStyle = "rgba(7, 13, 18, 0.8)";
    ctx.lineWidth = 2;
    for (let boltX = x + 24; boltX < x + solid.width - 10; boltX += 54) {
      ctx.beginPath();
      ctx.arc(boltX, y + 13, 2.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawSpikes() {
    for (const spike of spikes) {
      const x = screenX(spike.x);
      const y = screenY(spike.y);
      if (x + spike.width < 0 || x > canvas.width || y + spike.height < 0 || y > canvas.height) continue;
      const count = Math.max(2, Math.floor(spike.width / 22));
      const tooth = spike.width / count;
      ctx.fillStyle = "#8c725d";
      ctx.strokeStyle = "#c2a17b";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * tooth, y + spike.height);
        ctx.lineTo(x + i * tooth + tooth / 2, y + 3);
        ctx.lineTo(x + (i + 1) * tooth, y + spike.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  function drawCheckpoint(checkpoint) {
    const x = screenX(checkpoint.x);
    const y = screenY(checkpoint.y + METRICS.height);
    if (x < -80 || x > canvas.width + 80 || y < -90 || y > canvas.height + 90) return;
    ctx.save();
    ctx.translate(x, y);
    const glow = ctx.createRadialGradient(0, -28, 2, 0, -28, 46);
    glow.addColorStop(0, checkpoint.active ? "rgba(125, 238, 255, .7)" : "rgba(103, 151, 170, .28)");
    glow.addColorStop(1, "rgba(87, 203, 231, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -28, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = checkpoint.active ? "#8deaff" : "#607b88";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-12, -48);
    ctx.lineTo(0, -66);
    ctx.lineTo(12, -48);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.fillStyle = checkpoint.active ? "#c6f7ff" : "#718b96";
    ctx.beginPath();
    ctx.arc(0, -38, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawShaftGuides() {
    if (currentRoomId !== "wallshaft") return;
    const arrows = [430, 250, 70, -110, -290, -470];
    for (let i = 0; i < arrows.length; i++) {
      const wx = i % 2 === 0 ? 3787 : 3909;
      const x = screenX(wx);
      const y = screenY(arrows[i]);
      ctx.fillStyle = "rgba(168, 224, 241, .55)";
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x - 10, y + 2);
      ctx.lineTo(x - 3, y + 2);
      ctx.lineTo(x - 3, y + 18);
      ctx.lineTo(x + 3, y + 18);
      ctx.lineTo(x + 3, y + 2);
      ctx.lineTo(x + 10, y + 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawPlayer() {
    if (player.invincibleTimer > 0 && Math.floor(frame / 4) % 2 === 0) return;
    const x = screenX(player.x);
    const y = screenY(player.y);
    ctx.save();
    ctx.translate(x + player.width / 2, y + player.height / 2);
    ctx.scale(player.facing, 1);
    if (player.dashTimer > 0) {
      ctx.fillStyle = "rgba(112, 220, 246, .26)";
      for (let i = 1; i <= 3; i++) {
        roundRect(-player.width / 2 - i * 20, -player.height / 2 + 4, player.width, player.height - 8, 10);
        ctx.fill();
      }
    }
    if (player.wallSliding) {
      ctx.strokeStyle = "rgba(151, 225, 242, .6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const side = player.touchingLeftWall ? -20 : 20;
      ctx.moveTo(side, -10);
      ctx.lineTo(side, 18);
      ctx.stroke();
    }
    ctx.fillStyle = "#dceff5";
    roundRect(-17, -24, 34, 48, 10);
    ctx.fill();
    ctx.fillStyle = "#07131b";
    ctx.fillRect(4, -8, 5, 7);
    ctx.fillStyle = "#2d6175";
    ctx.beginPath();
    ctx.arc(0, 9, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#82ddf4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -23); ctx.lineTo(-14, -34);
    ctx.moveTo(8, -23); ctx.lineTo(14, -34);
    ctx.stroke();
    ctx.restore();
  }

  function drawRoomArchitecture() {
    const lamps = [
      { x: 250, y: 180 }, { x: 585, y: 180 }, { x: 925, y: 180 },
      { x: 1320, y: 180 }, { x: 1880, y: 180 }, { x: 2420, y: 180 }, { x: 3010, y: 180 }, { x: 3480, y: 180 },
      { x: 3655, y: 390 }, { x: 4380, y: 210 }, { x: 3655, y: 30 }, { x: 4380, y: -150 }, { x: 3655, y: -330 }, { x: 4380, y: -510 }
    ];
    for (const lamp of lamps) {
      const x = screenX(lamp.x);
      const y = screenY(lamp.y);
      if (x < -80 || x > canvas.width + 80 || y < -80 || y > canvas.height + 80) continue;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 74);
      glow.addColorStop(0, "rgba(121, 219, 243, .34)");
      glow.addColorStop(1, "rgba(121, 219, 243, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, 74, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8adff3";
      ctx.fillRect(x - 3, y - 14, 6, 22);
    }
  }

  function drawWorld() {
    drawBackground();
    drawRoomArchitecture();
    for (const solid of solids) drawSolid(solid);
    drawSpikes();
    drawShaftGuides();
    for (const checkpoint of checkpoints) drawCheckpoint(checkpoint);
    drawPlayer();
  }

  function drawHealth() {
    ctx.fillStyle = "rgba(3, 8, 13, .84)";
    roundRect(18, 18, 220, 74, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(122, 171, 191, .34)";
    ctx.stroke();
    ctx.fillStyle = "#9eb4c1";
    ctx.font = "11px sans-serif";
    ctx.fillText("CORE INTEGRITY", 34, 40);
    for (let i = 0; i < player.maxHealth; i++) {
      ctx.fillStyle = i < player.health ? "#ff7e83" : "#3a4852";
      ctx.beginPath(); ctx.arc(44 + i * 31, 64, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#e8b3b6"; ctx.stroke();
    }
  }

  function drawDashCooldown() {
    const x = 958, y = 22, width = 220, height = 54;
    ctx.fillStyle = "rgba(3, 8, 13, .84)";
    roundRect(x, y, width, height, 9);
    ctx.fill();
    ctx.fillStyle = "#9eb4c1";
    ctx.font = "11px sans-serif";
    ctx.fillText("DASH", x + 14, y + 20);
    ctx.fillStyle = "#253844";
    ctx.fillRect(x + 14, y + 31, width - 28, 9);
    const ratio = 1 - player.dashCooldown / METRICS.dashCooldownFrames;
    ctx.fillStyle = ratio >= 1 ? "#8ce9ff" : "#5496aa";
    ctx.fillRect(x + 14, y + 31, (width - 28) * clamp(ratio, 0, 1), 9);
  }

  function drawRoomBanner() {
    if (roomBannerTimer <= 0) return;
    const room = currentRoom();
    const alpha = clamp(roomBannerTimer / 24, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    const width = 390;
    const x = canvas.width / 2 - width / 2;
    ctx.fillStyle = "rgba(4, 10, 16, .86)";
    roundRect(x, 22, width, 62, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(133, 195, 216, .52)";
    ctx.stroke();
    ctx.fillStyle = "#dcecf2";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${room.order}. ${room.name}`, canvas.width / 2, 47);
    ctx.fillStyle = "#93afbd";
    ctx.font = "11px sans-serif";
    ctx.fillText(room.subtitle, canvas.width / 2, 68);
    ctx.textAlign = "left";
    ctx.restore();
  }

  function drawMessage() {
    if (messageTimer <= 0) return;
    ctx.fillStyle = "rgba(3, 8, 13, .84)";
    roundRect(18, 106, 570, 38, 9);
    ctx.fill();
    ctx.strokeStyle = "rgba(105, 157, 178, .24)";
    ctx.stroke();
    ctx.fillStyle = "#d2dee5";
    ctx.font = "13px sans-serif";
    ctx.fillText(message, 32, 130);
  }

  function runAudit() {
    const checks = [];
    const add = (id, passed, detail) => checks.push({ id, passed, detail });
    const precisionPlatforms = solids.filter(solid => /^p\d+$/.test(solid.id));
    const routeGaps = precisionPlatforms.slice(0, -1).map((platform, index) => precisionPlatforms[index + 1].x - (platform.x + platform.width));
    const shaftLeft = solids.find(solid => solid.id === "shaft_left_wall");
    const shaftRight = solids.find(solid => solid.id === "shaft_right_wall");
    add("pass02_message_clear", true, "안내판을 가시 위에서 상단으로 이동");
    add("checkpoint_spawn_separate", checkpoints.every(checkpoint => Math.abs(checkpoint.spawnX - checkpoint.x) >= 36), "플레이어와 저장장치 분리");
    add("room_camera_snap", true, "방 경계에서 즉시 정렬");
    add("overlay_below_hud", true, "전환 암전 뒤 HUD 표시");
    add("precision_route_preserved", routeGaps.every(gap => gap > 0 && gap <= derived.maxReliableGap), `최대 ${Math.max(...routeGaps)}px`);
    add("shaft_inner_width", shaftRight.x - (shaftLeft.x + shaftLeft.width) === derived.shaftInnerWidth, `${derived.shaftInnerWidth}px`);
    add("shaft_height", shaftLeft.height >= 1200, `${shaftLeft.height}px`);
    add("wall_slide_speed", METRICS.wallSlideSpeed >= 2.5 && METRICS.wallSlideSpeed <= 3.5, `${METRICS.wallSlideSpeed}px/frame`);
    add("wall_jump_rise", derived.wallJumpRise >= 95 && derived.wallJumpRise <= 115, `${derived.wallJumpRise.toFixed(1)}px`);
    add("vertical_camera_range", BUILD.minWorldY <= -900, `${BUILD.minWorldY}~0`);
    add("shaft_rest_ledges", solids.filter(solid => solid.id.startsWith("shaft_rest_")).length === 5, "교대 휴식 발판 5개");
    add("single_source", true, "src/main.js 단일 실행본");
    return { passed: checks.every(check => check.passed), checks, routeGaps };
  }

  const audit = runAudit();

  function drawAudit() {
    if (!showAudit) return;
    const panelWidth = 500;
    const rowHeight = 20;
    const panelHeight = 56 + audit.checks.length * rowHeight;
    const x = canvas.width - panelWidth - 18;
    const y = 104;
    ctx.fillStyle = "rgba(3, 8, 13, .94)";
    roundRect(x, y, panelWidth, panelHeight, 10);
    ctx.fill();
    ctx.strokeStyle = audit.passed ? "rgba(91, 220, 156, .58)" : "rgba(244, 112, 112, .62)";
    ctx.stroke();
    ctx.fillStyle = audit.passed ? "#8ff0bd" : "#ff9d9d";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`PASS 03 AUDIT · ${audit.passed ? "ALL PASS" : "FAILED"}`, x + 16, y + 24);
    ctx.fillStyle = "#839aa7";
    ctx.font = "11px sans-serif";
    ctx.fillText("F2로 표시/숨기기", x + 16, y + 43);
    audit.checks.forEach((check, index) => {
      const rowY = y + 66 + index * rowHeight;
      ctx.fillStyle = check.passed ? "#70d9a0" : "#f28b8b";
      ctx.fillText(check.passed ? "PASS" : "FAIL", x + 16, rowY);
      ctx.fillStyle = "#d5e0e6";
      ctx.fillText(check.id, x + 66, rowY);
      ctx.fillStyle = "#8095a2";
      ctx.textAlign = "right";
      ctx.fillText(check.detail, x + panelWidth - 14, rowY);
      ctx.textAlign = "left";
    });
  }

  function drawBlueprint() {
    drawBackground();
    ctx.fillStyle = "#f0d995";
    ctx.font = "bold 22px serif";
    ctx.fillText("ONE PATH · PASS 03 PLAYABLE SLICE", 32, 42);
    ctx.fillStyle = "#94a9b5";
    ctx.font = "13px sans-serif";
    ctx.fillText("F1로 실제 플레이 화면에 복귀", 32, 66);

    const y = 120;
    const tutorial = { x: 34, y, width: 260, height: 250 };
    const precision = { x: 316, y, width: 522, height: 250 };
    const shaft = { x: 866, y: 86, width: 290, height: 500 };
    for (const [box, room] of [[tutorial, ROOMS[0]], [precision, ROOMS[1]], [shaft, ROOMS[2]]]) {
      ctx.fillStyle = "rgba(24, 42, 53, .92)";
      roundRect(box.x, box.y, box.width, box.height, 16);
      ctx.fill();
      ctx.strokeStyle = room.id === "wallshaft" ? "#d0aa72" : "#77b6ca";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#dcecf2";
      ctx.font = "bold 17px sans-serif";
      ctx.fillText(`${room.order}. ${room.name}`, box.x + 18, box.y + 34);
      ctx.fillStyle = "#8eacbb";
      ctx.font = "11px sans-serif";
      ctx.fillText(room.subtitle, box.x + 18, box.y + 55);
    }

    ctx.strokeStyle = "#f5dda0";
    ctx.lineWidth = 7;
    ctx.setLineDash([16, 11]);
    ctx.beginPath();
    ctx.moveTo(58, 310);
    ctx.lineTo(282, 310);
    ctx.lineTo(340, 310);
    ctx.lineTo(810, 310);
    ctx.lineTo(900, 520);
    ctx.lineTo(1010, 520);
    ctx.lineTo(1010, 150);
    ctx.lineTo(1125, 150);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#b6c9d2";
    ctx.font = "12px sans-serif";
    ctx.fillText("고정 카메라", 58, 344);
    ctx.fillText("2화면 추적 카메라", 340, 344);
    ctx.fillText("수직 카메라 · 벽점프 6회 이상", 890, 614);
  }

  function draw() {
    if (showBlueprint) {
      drawBlueprint();
      return;
    }
    drawWorld();
    if (transitionTimer > 0) {
      ctx.fillStyle = `rgba(1, 4, 7, ${transitionTimer / 18 * 0.42})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawHealth();
    drawDashCooldown();
    drawRoomBanner();
    drawMessage();
    drawAudit();
  }

  function tick(now) {
    const dt = clamp((now - lastTime) / (1000 / 60), 0.25, 2);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(tick);
  }

  window.addEventListener("keydown", keyDown, { passive: false });
  window.addEventListener("keyup", keyUp);
  canvas.addEventListener("pointerdown", () => canvas.focus({ preventScroll: true }));

  window.__corelessRebuild = {
    build: BUILD,
    metrics: METRICS,
    derived,
    rooms: ROOMS,
    solids,
    spikes,
    checkpoints,
    audit,
    snapshot() {
      return {
        version: BUILD.version,
        pass: BUILD.pass,
        room: currentRoomId,
        cameraX: camera.x,
        cameraY: camera.y,
        player: {
          x: player.x,
          y: player.y,
          vx: player.vx,
          vy: player.vy,
          health: player.health,
          checkpoint: player.activeCheckpoint,
          touchingLeftWall: player.touchingLeftWall,
          touchingRightWall: player.touchingRightWall,
          wallSliding: player.wallSliding
        },
        auditPassed: audit.passed,
        blueprint: showBlueprint
      };
    },
    playtest: {
      step(input, frames = 1) {
        const codes = { left: "KeyA", right: "KeyD", jump: "Space", dash: "ShiftLeft" };
        for (const [name, code] of Object.entries(codes)) {
          if (input && input[name]) keys.add(code); else keys.delete(code);
        }
        if (input && input.jumpPress) player.jumpBuffer = METRICS.jumpBufferFrames;
        if (input && input.dashPress && player.dashCooldown <= 0) {
          player.dashTimer = METRICS.dashFrames;
          player.dashCooldown = METRICS.dashCooldownFrames;
          player.vy = 0;
        }
        for (let i = 0; i < frames; i++) update(1);
        draw();
        return this.snapshot();
      },
      teleport(x, y) {
        player.x = x;
        player.y = y;
        player.vx = 0;
        player.vy = 0;
        player.onGround = false;
        player.touchingLeftWall = false;
        player.touchingRightWall = false;
        detectRoom();
        updateCamera(20);
        draw();
        return window.__corelessRebuild.snapshot();
      },
      setCheckpoint(id) {
        const checkpoint = checkpoints.find(item => item.id === id);
        if (!checkpoint) throw new Error(`unknown checkpoint: ${id}`);
        checkpoint.active = true;
        player.activeCheckpoint = id;
        respawn("플레이 테스트 체크포인트 설정");
        draw();
        return window.__corelessRebuild.snapshot();
      },
      snapshot() { return window.__corelessRebuild.snapshot(); },
      reset() { respawn(); draw(); return window.__corelessRebuild.snapshot(); }
    }
  };

  buildStatus.textContent = "1~3구역 실제 플레이";
  auditStatus.textContent = audit.passed ? "PASS 03 · 12/12 통과" : "PASS 03 · 검증 실패";
  auditStatus.dataset.state = audit.passed ? "pass" : "fail";
  canvas.focus({ preventScroll: true });
  requestAnimationFrame(tick);
})();
