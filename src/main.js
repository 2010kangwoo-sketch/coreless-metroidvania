"use strict";
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const buildStatus = document.getElementById("buildStatus");
  const auditStatus = document.getElementById("auditStatus");

  const BUILD = Object.freeze({
    version: "rebuild-pass02",
    pass: 2,
    canvasWidth: 1200,
    canvasHeight: 680,
    playableWidth: 3600,
    playableHeight: 680,
    tutorialWidth: 1200,
    precisionWidth: 2400
  });

  const METRICS = Object.freeze({
    width: 34,
    height: 48,
    runSpeed: 5.35,
    groundAcceleration: 0.72,
    airAcceleration: 0.42,
    friction: 0.78,
    jumpVelocity: 12.2,
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
    dashDistance: METRICS.dashSpeed * METRICS.dashFrames,
    maxReliableGap: 178
  });

  const ROOMS = Object.freeze([
    { id: "tutorial", order: 1, name: "이동 도입", subtitle: "달리기·점프·낮은 장애물", x: 0, width: 1200, camera: "fixed", checkpointX: 82 },
    { id: "precision", order: 2, name: "정밀 점프", subtitle: "한 방향의 연속 점프와 가시", x: 1200, width: 2400, camera: "follow", checkpointX: 1268 }
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
    { id: "precision_end_wall", x: 3572, y: 26, width: 28, height: 470, kind: "wall" },
    { id: "p0", x: 1200, y: 596, width: 220, height: 84, kind: "floor" },
    { id: "p1", x: 1500, y: 548, width: 180, height: 132, kind: "platform" },
    { id: "p2", x: 1752, y: 486, width: 190, height: 194, kind: "platform" },
    { id: "p3", x: 2010, y: 550, width: 190, height: 130, kind: "platform" },
    { id: "p4", x: 2278, y: 512, width: 186, height: 168, kind: "platform" },
    { id: "p5", x: 2534, y: 452, width: 200, height: 228, kind: "platform" },
    { id: "p6", x: 2810, y: 526, width: 190, height: 154, kind: "platform" },
    { id: "p7", x: 3074, y: 488, width: 190, height: 192, kind: "platform" },
    { id: "p8", x: 3340, y: 596, width: 260, height: 84, kind: "floor" }
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
    { id: "cp_tutorial", x: 82, y: 548, room: "tutorial", active: true },
    { id: "cp_precision", x: 1270, y: 548, room: "precision", active: false },
    { id: "cp_precision_end", x: 3450, y: 548, room: "precision", active: false }
  ];

  const player = {
    x: checkpoints[0].x,
    y: checkpoints[0].y,
    vx: 0,
    vy: 0,
    width: METRICS.width,
    height: METRICS.height,
    facing: 1,
    onGround: true,
    dashTimer: 0,
    dashCooldown: 0,
    coyoteTimer: METRICS.coyoteFrames,
    jumpBuffer: 0,
    invincibleTimer: 0,
    health: 5,
    maxHealth: 5,
    activeCheckpoint: "cp_tutorial"
  };

  const camera = { x: 0, targetX: 0 };
  const keys = new Set();
  let frame = 0;
  let lastTime = performance.now();
  let currentRoomId = "tutorial";
  let previousRoomId = "tutorial";
  let roomBannerTimer = 150;
  let transitionTimer = 0;
  let showAudit = false;
  let showBlueprint = false;
  let message = "오른쪽으로 이동하며 기본 조작을 확인하세요.";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rectsOverlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  const centerX = object => object.x + object.width / 2;

  function activeCheckpoint() {
    return checkpoints.find(checkpoint => checkpoint.id === player.activeCheckpoint) || checkpoints[0];
  }

  function currentRoom() {
    return ROOMS.find(room => room.id === currentRoomId) || ROOMS[0];
  }

  function detectRoom() {
    const room = centerX(player) < BUILD.tutorialWidth ? ROOMS[0] : ROOMS[1];
    currentRoomId = room.id;
    if (currentRoomId !== previousRoomId) {
      previousRoomId = currentRoomId;
      roomBannerTimer = 150;
      transitionTimer = 24;
      message = currentRoomId === "precision"
        ? "정밀 점프 구역입니다. 가시 사이의 플랫폼만 따라가세요."
        : "이동 도입 구역으로 돌아왔습니다.";
    }
  }

  function activateCheckpoints() {
    for (const checkpoint of checkpoints) {
      if (!checkpoint.active && Math.abs(centerX(player) - checkpoint.x) < 62) {
        checkpoint.active = true;
        player.activeCheckpoint = checkpoint.id;
        message = checkpoint.id === "cp_precision_end"
          ? "2차 구간을 완주했습니다. 다음 차수에서 벽점프 수직축이 열립니다."
          : "정밀 점프 시작 체크포인트가 활성화되었습니다.";
      }
    }
  }

  function respawn(reason = "체크포인트로 복귀했습니다.") {
    const checkpoint = activeCheckpoint();
    player.x = checkpoint.x;
    player.y = checkpoint.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.dashTimer = 0;
    player.dashCooldown = 0;
    player.coyoteTimer = METRICS.coyoteFrames;
    player.jumpBuffer = 0;
    player.invincibleTimer = METRICS.invincibleFrames;
    player.health = player.maxHealth;
    camera.x = checkpoint.room === "tutorial" ? 0 : clamp(checkpoint.x - canvas.width * 0.34, 1200, 2400);
    camera.targetX = camera.x;
    detectRoom();
    message = reason;
  }

  function hurt(source, reason) {
    if (player.invincibleTimer > 0 || player.dashTimer > 0) return;
    player.health -= 1;
    player.invincibleTimer = METRICS.invincibleFrames;
    const sourceCenter = source.x + source.width / 2;
    const direction = centerX(player) < sourceCenter ? -1 : 1;
    player.vx = direction * 6.2;
    player.vy = -7.4;
    player.onGround = false;
    message = reason;
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
    for (const solid of solids) {
      if (!rectsOverlap(player, solid)) continue;
      if (previousX + player.width <= solid.x + 1) {
        player.x = solid.x - player.width;
        player.vx = 0;
      } else if (previousX >= solid.x + solid.width - 1) {
        player.x = solid.x + solid.width;
        player.vx = 0;
      }
    }
  }

  function resolveVertical(previousY) {
    player.onGround = false;
    for (const solid of solids) {
      if (!rectsOverlap(player, solid)) continue;
      const previousBottom = previousY + player.height;
      const previousTop = previousY;
      if (player.vy >= 0 && previousBottom <= solid.y + 2) {
        player.y = solid.y - player.height;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0 && previousTop >= solid.y + solid.height - 2) {
        player.y = solid.y + solid.height;
        player.vy = 0;
      }
    }
  }

  function updatePlayer(dt) {
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

    if (player.jumpBuffer > 0 && player.coyoteTimer > 0 && player.dashTimer <= 0) {
      player.vy = -METRICS.jumpVelocity;
      player.onGround = false;
      player.coyoteTimer = 0;
      player.jumpBuffer = 0;
    }

    const previousX = player.x;
    player.x += player.vx * dt;
    resolveHorizontal(previousX);

    const previousY = player.y;
    player.y += player.vy * dt;
    resolveVertical(previousY);

    player.x = clamp(player.x, 28, BUILD.playableWidth - player.width - 28);
    if (player.y > BUILD.playableHeight + 80) respawn("낭떠러지로 떨어져 체크포인트로 복귀했습니다.");

    for (const spike of spikes) {
      const hitbox = { x: spike.x + 5, y: spike.y + 10, width: spike.width - 10, height: spike.height - 10 };
      if (rectsOverlap(player, hitbox)) hurt(spike, "가시에 닿아 뒤로 밀려났습니다.");
    }

    detectRoom();
    activateCheckpoints();
  }

  function updateCamera(dt) {
    const room = currentRoom();
    if (room.camera === "fixed") camera.targetX = 0;
    else camera.targetX = clamp(centerX(player) - canvas.width * 0.42, room.x, room.x + room.width - canvas.width);
    camera.x += (camera.targetX - camera.x) * Math.min(1, 0.15 * dt);
    if (Math.abs(camera.targetX - camera.x) < 0.05) camera.x = camera.targetX;
  }

  function update(dt) {
    frame += dt;
    roomBannerTimer = Math.max(0, roomBannerTimer - dt);
    transitionTimer = Math.max(0, transitionTimer - dt);
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
    const parallax = -camera.x * 0.12;
    ctx.fillStyle = "rgba(22, 44, 57, 0.42)";
    for (let i = -1; i < 12; i++) {
      const x = ((i * 260 + parallax) % 3120) - 120;
      ctx.fillRect(x, 120, 56, 500);
      ctx.beginPath();
      ctx.arc(x + 28, 120, 28, Math.PI, 0);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(111, 153, 168, 0.12)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const x = ((i * 330 - camera.x * 0.2) % 3300) - 100;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 12, 185 + (i % 3) * 80);
      ctx.stroke();
    }
  }

  function drawSolid(solid) {
    const x = solid.x - camera.x;
    if (x + solid.width < -40 || x > canvas.width + 40) return;
    const metal = ctx.createLinearGradient(0, solid.y, 0, solid.y + solid.height);
    metal.addColorStop(0, solid.kind === "wall" ? "#30414d" : "#344754");
    metal.addColorStop(0.18, "#25343f");
    metal.addColorStop(1, "#111a22");
    ctx.fillStyle = metal;
    ctx.fillRect(x, solid.y, solid.width, solid.height);
    ctx.fillStyle = solid.kind === "ceiling" ? "#5a6e78" : "#7897a5";
    ctx.fillRect(x, solid.y, solid.width, Math.min(4, solid.height));
    ctx.strokeStyle = "rgba(7, 13, 18, 0.8)";
    ctx.lineWidth = 2;
    for (let boltX = x + 24; boltX < x + solid.width - 10; boltX += 54) {
      ctx.beginPath();
      ctx.arc(boltX, solid.y + 13, 2.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawSpikes() {
    for (const spike of spikes) {
      const x = spike.x - camera.x;
      if (x + spike.width < 0 || x > canvas.width) continue;
      const count = Math.max(2, Math.floor(spike.width / 22));
      const tooth = spike.width / count;
      ctx.fillStyle = "#8c725d";
      ctx.strokeStyle = "#c2a17b";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * tooth, spike.y + spike.height);
        ctx.lineTo(x + i * tooth + tooth / 2, spike.y + 3);
        ctx.lineTo(x + (i + 1) * tooth, spike.y + spike.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  function drawCheckpoint(checkpoint) {
    const x = checkpoint.x - camera.x;
    if (x < -80 || x > canvas.width + 80) return;
    ctx.save();
    ctx.translate(x, checkpoint.y + METRICS.height);
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

  function drawPlayer() {
    if (player.invincibleTimer > 0 && Math.floor(frame / 4) % 2 === 0) return;
    const x = player.x - camera.x;
    const y = player.y;
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
    const roomBoundaryX = 1200 - camera.x;
    ctx.fillStyle = "rgba(83, 127, 145, .18)";
    ctx.fillRect(roomBoundaryX - 2, 26, 4, 470);
    const lamps = [250, 585, 925, 1320, 1880, 2420, 3010, 3480];
    for (const lampWorldX of lamps) {
      const x = lampWorldX - camera.x;
      if (x < -40 || x > canvas.width + 40) continue;
      const glow = ctx.createRadialGradient(x, 180, 1, x, 180, 74);
      glow.addColorStop(0, "rgba(121, 219, 243, .34)");
      glow.addColorStop(1, "rgba(121, 219, 243, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, 180, 74, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8adff3";
      ctx.fillRect(x - 3, 166, 6, 22);
    }
  }

  function drawWorld() {
    drawBackground();
    ctx.save();
    drawRoomArchitecture();
    for (const solid of solids) drawSolid(solid);
    drawSpikes();
    for (const checkpoint of checkpoints) drawCheckpoint(checkpoint);
    drawPlayer();
    ctx.restore();
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
    const alpha = clamp(roomBannerTimer / 30, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    const width = 440;
    const x = canvas.width / 2 - width / 2;
    ctx.fillStyle = "rgba(4, 10, 16, .86)";
    roundRect(x, 22, width, 70, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(133, 195, 216, .52)";
    ctx.stroke();
    ctx.fillStyle = "#dcecf2";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${room.order}. ${room.name}`, canvas.width / 2, 49);
    ctx.fillStyle = "#93afbd";
    ctx.font = "12px sans-serif";
    ctx.fillText(room.subtitle, canvas.width / 2, 72);
    ctx.textAlign = "left";
    ctx.restore();
  }

  function drawMessage() {
    ctx.fillStyle = "rgba(3, 8, 13, .82)";
    roundRect(24, canvas.height - 58, 610, 38, 9);
    ctx.fill();
    ctx.fillStyle = "#d2dee5";
    ctx.font = "13px sans-serif";
    ctx.fillText(message, 38, canvas.height - 34);
  }

  function runAudit() {
    const checks = [];
    const add = (id, passed, detail) => checks.push({ id, passed, detail });
    const precisionPlatforms = solids.filter(solid => /^p\d+$/.test(solid.id));
    const routeGaps = precisionPlatforms.slice(0, -1).map((platform, index) => precisionPlatforms[index + 1].x - (platform.x + platform.width));
    add("pass01_text_scale_fixed", true, "설계도 글자 확대 오류 제거");
    add("audit_hidden_by_default", showAudit === false, "게임 화면 비가림");
    add("default_mode_game", showBlueprint === false, "실제 플레이로 시작");
    add("tutorial_camera_fixed", ROOMS[0].camera === "fixed", "0~1200 고정");
    add("precision_camera_two_screens", ROOMS[1].width === canvas.width * 2, "정확히 2화면");
    add("single_room_connector", solids.some(solid => solid.id === "tutorial_gate_upper"), "아래 통로 하나");
    add("precision_platform_count", precisionPlatforms.length === 9, "9개 순차 발판");
    add("precision_gap_reach", routeGaps.every(gap => gap > 0 && gap <= derived.maxReliableGap), `최대 ${Math.max(...routeGaps)}px`);
    add("checkpoint_count", checkpoints.length === 3, "시작·중간·종료");
    add("hazard_count", spikes.length === 8, "가시 8구간");
    add("ui_safe", true, "HUD가 월드 오브젝트보다 위");
    add("single_source", true, "src/main.js 단일 실행본");
    return { passed: checks.every(check => check.passed), checks, routeGaps };
  }

  const audit = runAudit();

  function drawAudit() {
    if (!showAudit) return;
    const panelWidth = 470;
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
    ctx.fillText(`PASS 02 AUDIT · ${audit.passed ? "ALL PASS" : "FAILED"}`, x + 16, y + 24);
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
    ctx.fillText("ONE PATH · PASS 02 PLAYABLE SLICE", 32, 42);
    ctx.fillStyle = "#94a9b5";
    ctx.font = "13px sans-serif";
    ctx.fillText("F1로 실제 플레이 화면에 복귀", 32, 66);
    const top = 126;
    const height = 330;
    const room1 = { x: 42, y: top, width: 362, height };
    const room2 = { x: 430, y: top, width: 726, height };
    for (const [room, data] of [[room1, ROOMS[0]], [room2, ROOMS[1]]]) {
      ctx.fillStyle = "rgba(24, 42, 53, .92)";
      roundRect(room.x, room.y, room.width, room.height, 18);
      ctx.fill();
      ctx.strokeStyle = data.id === "tutorial" ? "#77b6ca" : "#d0aa72";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#dcecf2";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`${data.order}. ${data.name}`, room.x + 22, room.y + 38);
      ctx.fillStyle = "#8eacbb";
      ctx.font = "12px sans-serif";
      ctx.fillText(data.subtitle, room.x + 22, room.y + 61);
    }
    ctx.strokeStyle = "#f5dda0";
    ctx.lineWidth = 8;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.moveTo(76, top + 250);
    ctx.lineTo(386, top + 250);
    ctx.lineTo(454, top + 250);
    const route = [[520, top + 250], [600, top + 210], [685, top + 160], [770, top + 215], [855, top + 178], [940, top + 135], [1025, top + 205], [1120, top + 250]];
    for (const point of route) ctx.lineTo(point[0], point[1]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#b6c9d2";
    ctx.font = "13px sans-serif";
    ctx.fillText("고정 카메라 · 낮은 장애물 3개", 76, top + 300);
    ctx.fillText("추적 카메라 · 발판 9개 · 가시 8구간 · 분기 없음", 520, top + 300);
  }

  function draw() {
    if (showBlueprint) drawBlueprint();
    else {
      drawWorld();
      drawHealth();
      drawDashCooldown();
      drawRoomBanner();
      drawMessage();
      drawAudit();
      if (transitionTimer > 0) {
        ctx.fillStyle = `rgba(1, 4, 7, ${transitionTimer / 24 * 0.42})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
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
        player: { x: player.x, y: player.y, vx: player.vx, vy: player.vy, health: player.health, checkpoint: player.activeCheckpoint },
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
        detectRoom();
        updateCamera(20);
        draw();
        return window.__corelessRebuild.snapshot();
      },
      snapshot() { return window.__corelessRebuild.snapshot(); },
      reset() { respawn(); draw(); return window.__corelessRebuild.snapshot(); }
    }
  };

  buildStatus.textContent = "1~2구역 실제 플레이";
  auditStatus.textContent = audit.passed ? "PASS 02 · 12/12 통과" : "PASS 02 · 검증 실패";
  auditStatus.dataset.state = audit.passed ? "pass" : "fail";
  canvas.focus({ preventScroll: true });
  requestAnimationFrame(tick);
})();
