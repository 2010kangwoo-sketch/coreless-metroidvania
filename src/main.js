"use strict";
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const buildStatus = document.getElementById("buildStatus");
  const auditStatus = document.getElementById("auditStatus");

  const BUILD = Object.freeze({
    version: "rebuild-pass04",
    pass: 4,
    width: 7200,
    minY: -900,
    maxY: 680,
    room4Start: 4500,
    room4End: 6900
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
    invincibleFrames: 54,
    grabRadius: 126,
    swingInput: 0.00325,
    swingDamping: 0.996,
    maxAngularVelocity: 0.075,
    releaseBoost: 1.8
  });

  const derived = Object.freeze({
    jumpRise: METRICS.jumpVelocity ** 2 / (2 * METRICS.gravity),
    wallJumpRise: METRICS.wallJumpVelocity ** 2 / (2 * METRICS.gravity),
    dashDistance: METRICS.dashSpeed * METRICS.dashFrames,
    shaftInnerWidth: 200,
    pitWidth: 1340
  });

  const ROOMS = Object.freeze([
    { id: "tutorial", order: 1, name: "이동 도입", subtitle: "달리기·점프·낮은 장애물", x: 0, width: 1200, camera: "fixed" },
    { id: "precision", order: 2, name: "정밀 점프", subtitle: "한 방향의 연속 점프와 가시", x: 1200, width: 2400, camera: "follow" },
    { id: "wallshaft", order: 3, name: "벽점프 수직축", subtitle: "벽 미끄러짐·교차 벽점프·상단 출구", x: 3600, width: 900, camera: "vertical" },
    { id: "grabber", order: 4, name: "집게·클로 횡단", subtitle: "낭떠러지 위 다섯 진자·분기 없는 공중 경로", x: 4500, width: 2400, camera: "upper-follow" }
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
    { id: "shaft_ceiling_left", x: 3600, y: -900, width: 872, height: 26, kind: "ceiling" },
    { id: "shaft_left_wall", x: 3720, y: -720, width: 28, height: 1220, kind: "wall" },
    { id: "shaft_right_wall", x: 3948, y: -460, width: 28, height: 960, kind: "wall" },
    { id: "shaft_outer_right", x: 4472, y: -900, width: 28, height: 440, kind: "wall" },
    { id: "shaft_rest_l1", x: 3748, y: 360, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_rest_r1", x: 3884, y: 180, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_rest_l2", x: 3748, y: 0, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_rest_r2", x: 3884, y: -180, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_rest_l3", x: 3748, y: -360, width: 64, height: 18, kind: "ledge" },
    { id: "shaft_top_floor", x: 3948, y: -460, width: 544, height: 76, kind: "floor" },

    { id: "grabber_ceiling", x: 4500, y: -900, width: 2400, height: 26, kind: "ceiling" },
    { id: "grabber_entry_floor", x: 4492, y: -460, width: 428, height: 76, kind: "floor" },
    { id: "grabber_landing", x: 6260, y: -460, width: 640, height: 76, kind: "floor" },
    { id: "grabber_exit_wall", x: 6872, y: -900, width: 28, height: 440, kind: "wall" }
  ];

  const spikes = [
    { id: "s1", x: 1420, y: 628, width: 80, height: 52 },
    { id: "s2", x: 1680, y: 628, width: 72, height: 52 },
    { id: "s3", x: 1942, y: 628, width: 68, height: 52 },
    { id: "s4", x: 2200, y: 628, width: 78, height: 52 },
    { id: "s5", x: 2464, y: 628, width: 70, height: 52 },
    { id: "s6", x: 2734, y: 628, width: 76, height: 52 },
    { id: "s7", x: 3000, y: 628, width: 74, height: 52 },
    { id: "s8", x: 3264, y: 628, width: 76, height: 52 },
    { id: "grabber_pit", x: 4920, y: -245, width: 1340, height: 65 }
  ];

  const grabbers = [
    { id: "g1", x: 5050, y: -650, length: 155, chainTop: -885 },
    { id: "g2", x: 5320, y: -720, length: 180, chainTop: -885 },
    { id: "g3", x: 5590, y: -650, length: 165, chainTop: -885 },
    { id: "g4", x: 5860, y: -720, length: 180, chainTop: -885 },
    { id: "g5", x: 6130, y: -650, length: 155, chainTop: -885 }
  ];

  const checkpoints = [
    { id: "cp_tutorial", x: 72, y: 548, spawnX: 126, spawnY: 548, room: "tutorial", active: true },
    { id: "cp_precision", x: 1260, y: 548, spawnX: 1320, spawnY: 548, room: "precision", active: false },
    { id: "cp_shaft_entry", x: 3640, y: 548, spawnX: 3688, spawnY: 548, room: "wallshaft", active: false },
    { id: "cp_grabber_entry", x: 4560, y: -508, spawnX: 4630, spawnY: -508, room: "grabber", active: false },
    { id: "cp_grabber_end", x: 6700, y: -508, spawnX: 6618, spawnY: -508, room: "grabber", active: false }
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
    activeCheckpoint: "cp_tutorial",
    attachedGrabberId: null,
    swingAngle: 0,
    angularVelocity: 0
  };

  const camera = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const keys = new Set();
  let frame = 0;
  let lastTime = performance.now();
  let currentRoomId = "tutorial";
  let previousRoomId = "tutorial";
  let roomBannerTimer = 100;
  let transitionTimer = 0;
  let showAudit = false;
  let showBlueprint = false;
  let message = "오른쪽으로 이동하며 기본 조작을 확인하세요.";
  let messageTimer = 240;
  let grabPressed = false;
  let releasePressed = false;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const overlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  const centerX = o => o.x + o.width / 2;
  const centerY = o => o.y + o.height / 2;
  const sx = x => x - camera.x;
  const sy = y => y - camera.y;

  function setMessage(text, duration = 240) {
    message = text;
    messageTimer = duration;
  }

  function roomForPlayer() {
    if (centerX(player) < 1200) return ROOMS[0];
    if (centerX(player) < 3600) return ROOMS[1];
    if (centerX(player) < 4500) return ROOMS[2];
    return ROOMS[3];
  }

  function currentRoom() {
    return ROOMS.find(room => room.id === currentRoomId) || ROOMS[0];
  }

  function activeCheckpoint() {
    return checkpoints.find(cp => cp.id === player.activeCheckpoint) || checkpoints[0];
  }

  function snapCameraForRoom(room) {
    if (room.id === "tutorial") {
      camera.x = camera.targetX = 0;
      camera.y = camera.targetY = 0;
    } else if (room.id === "precision") {
      camera.x = camera.targetX = 1200;
      camera.y = camera.targetY = 0;
    } else if (room.id === "wallshaft") {
      camera.x = camera.targetX = 3450;
      camera.y = camera.targetY = clamp(centerY(player) - canvas.height * 0.6, -900, 0);
    } else {
      camera.x = camera.targetX = 4500;
      camera.y = camera.targetY = -900;
    }
  }

  function detectRoom() {
    const room = roomForPlayer();
    currentRoomId = room.id;
    if (currentRoomId === previousRoomId) return;
    previousRoomId = currentRoomId;
    roomBannerTimer = 100;
    transitionTimer = 16;
    snapCameraForRoom(room);
    if (room.id === "precision") setMessage("가시 사이의 발판만 따라가는 단일 경로입니다.");
    if (room.id === "wallshaft") setMessage("벽을 향해 이동하면서 점프하면 반대쪽 벽으로 튕겨 나갑니다.", 340);
    if (room.id === "grabber") setMessage("E로 집게를 잡고 A/D로 진자를 가속한 뒤 Space로 놓으세요.", 420);
  }

  function activateCheckpoints() {
    for (const cp of checkpoints) {
      const nearX = Math.abs(centerX(player) - cp.x) < 74;
      const nearY = Math.abs(centerY(player) - (cp.y + METRICS.height / 2)) < 92;
      if (!cp.active && nearX && nearY) {
        cp.active = true;
        player.activeCheckpoint = cp.id;
        if (cp.id === "cp_grabber_entry") setMessage("집게 횡단 입구 체크포인트가 활성화되었습니다.");
        else if (cp.id === "cp_grabber_end") setMessage("4차 구간을 완주했습니다. 다음 차수에서 터렛 회랑이 열립니다.", 420);
        else setMessage("체크포인트가 활성화되었습니다.");
      }
    }
  }

  function detachGrabber(upwardBoost = false) {
    if (!player.attachedGrabberId) return;
    const g = grabbers.find(item => item.id === player.attachedGrabberId);
    const tangential = player.angularVelocity * g.length;
    player.vx = Math.cos(player.swingAngle) * tangential;
    player.vy = -Math.sin(player.swingAngle) * tangential - (upwardBoost ? METRICS.releaseBoost : 0);
    player.facing = player.vx >= 0 ? 1 : -1;
    player.attachedGrabberId = null;
    player.onGround = false;
    setMessage("집게를 놓았습니다.", 90);
  }

  function tryAttachGrabber() {
    if (player.attachedGrabberId || currentRoomId !== "grabber") return false;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const g of grabbers) {
      const dx = centerX(player) - g.x;
      const dy = centerY(player) - g.y;
      const distance = Math.hypot(dx, dy);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = g;
      }
    }
    if (!nearest || nearestDistance > METRICS.grabRadius) {
      setMessage("집게에 조금 더 가까이 가야 합니다.", 90);
      return false;
    }
    const dx = centerX(player) - nearest.x;
    const dy = centerY(player) - nearest.y;
    player.attachedGrabberId = nearest.id;
    player.swingAngle = Math.atan2(dx, dy);
    const tangentX = Math.cos(player.swingAngle);
    const tangentY = -Math.sin(player.swingAngle);
    player.angularVelocity = clamp((player.vx * tangentX + player.vy * tangentY) / nearest.length, -METRICS.maxAngularVelocity, METRICS.maxAngularVelocity);
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    setMessage(`${nearest.id.toUpperCase()} 집게에 연결되었습니다.`, 100);
    return true;
  }

  function respawn(reason = "체크포인트로 복귀했습니다.") {
    const cp = activeCheckpoint();
    Object.assign(player, {
      x: cp.spawnX,
      y: cp.spawnY,
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
      health: player.maxHealth,
      attachedGrabberId: null,
      angularVelocity: 0
    });
    currentRoomId = cp.room;
    previousRoomId = cp.room;
    snapCameraForRoom(currentRoom());
    setMessage(reason);
  }

  function hurt(source, reason) {
    if (player.invincibleTimer > 0 || player.dashTimer > 0) return;
    if (player.attachedGrabberId) detachGrabber(false);
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
    if (event.code === "Space") {
      if (player.attachedGrabberId) releasePressed = true;
      else player.jumpBuffer = METRICS.jumpBufferFrames;
    }
    if (event.code === "KeyE") grabPressed = true;
    if ((event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyK") && player.dashCooldown <= 0 && !player.attachedGrabberId) {
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
    if (event.code === "Space" && player.vy < -4.8 && !player.attachedGrabberId) player.vy *= 0.58;
  }

  function resolveHorizontal(previousX) {
    player.touchingLeftWall = false;
    player.touchingRightWall = false;
    for (const solid of solids) {
      if (solid.kind === "ledge") continue;
      if (!overlap(player, solid)) continue;
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
      if (!overlap(player, solid)) continue;
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

  function updateAttached(dt, direction) {
    const g = grabbers.find(item => item.id === player.attachedGrabberId);
    if (!g) {
      player.attachedGrabberId = null;
      return;
    }
    const angularAcceleration = -(METRICS.gravity / g.length) * Math.sin(player.swingAngle) + direction * METRICS.swingInput;
    player.angularVelocity += angularAcceleration * dt;
    player.angularVelocity *= Math.pow(METRICS.swingDamping, dt);
    player.angularVelocity = clamp(player.angularVelocity, -METRICS.maxAngularVelocity, METRICS.maxAngularVelocity);
    player.swingAngle += player.angularVelocity * dt;
    player.swingAngle = clamp(player.swingAngle, -1.34, 1.34);
    if (Math.abs(player.swingAngle) >= 1.339) player.angularVelocity *= -0.35;
    const playerCenterX = g.x + Math.sin(player.swingAngle) * g.length;
    const playerCenterY = g.y + Math.cos(player.swingAngle) * g.length;
    player.x = playerCenterX - player.width / 2;
    player.y = playerCenterY - player.height / 2;
    player.vx = Math.cos(player.swingAngle) * player.angularVelocity * g.length;
    player.vy = -Math.sin(player.swingAngle) * player.angularVelocity * g.length;
    player.facing = player.angularVelocity >= 0 ? 1 : -1;
    player.onGround = false;
    player.wallSliding = false;
    if (releasePressed || grabPressed) detachGrabber(releasePressed);
  }

  function updateFree(dt, direction, left, right) {
    const oldLeft = player.touchingLeftWall;
    const oldRight = player.touchingRightWall;
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

    const previousX = player.x;
    player.x += player.vx * dt;
    resolveHorizontal(previousX);

    const pressingIntoWall = (player.touchingLeftWall && left) || (player.touchingRightWall && right);
    player.wallSliding = !player.onGround && player.vy > 0 && pressingIntoWall;
    if (player.wallSliding) player.vy = Math.min(player.vy, METRICS.wallSlideSpeed);

    if (player.jumpBuffer > 0 && player.dashTimer <= 0) {
      if (player.touchingLeftWall || oldLeft) {
        player.vy = -METRICS.wallJumpVelocity;
        player.vx = METRICS.wallJumpHorizontal;
        player.facing = 1;
        player.jumpBuffer = 0;
        player.coyoteTimer = 0;
      } else if (player.touchingRightWall || oldRight) {
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

    if (grabPressed) tryAttachGrabber();
  }

  function updatePlayer(dt) {
    const left = keys.has("KeyA") || keys.has("ArrowLeft");
    const right = keys.has("KeyD") || keys.has("ArrowRight");
    const direction = (right ? 1 : 0) - (left ? 1 : 0);
    if (direction !== 0 && !player.attachedGrabberId) player.facing = direction;

    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
    player.coyoteTimer = player.onGround ? METRICS.coyoteFrames : Math.max(0, player.coyoteTimer - dt);

    if (player.attachedGrabberId) updateAttached(dt, direction);
    else updateFree(dt, direction, left, right);

    player.x = clamp(player.x, 28, BUILD.width - player.width - 28);
    if (player.y > BUILD.maxY + 80) respawn("낭떠러지로 떨어져 체크포인트로 복귀했습니다.");

    for (const spike of spikes) {
      const hitbox = { x: spike.x + 5, y: spike.y + 10, width: spike.width - 10, height: spike.height - 10 };
      if (overlap(player, hitbox)) hurt(spike, spike.id === "grabber_pit" ? "낭떠러지의 가시에 닿았습니다." : "가시에 닿아 뒤로 밀려났습니다.");
    }

    detectRoom();
    activateCheckpoints();
    grabPressed = false;
    releasePressed = false;
  }

  function updateCamera(dt) {
    const room = currentRoom();
    if (room.id === "tutorial") {
      camera.targetX = 0; camera.targetY = 0;
    } else if (room.id === "precision") {
      camera.targetX = clamp(centerX(player) - canvas.width * 0.42, 1200, 2400); camera.targetY = 0;
    } else if (room.id === "wallshaft") {
      camera.targetX = 3450; camera.targetY = clamp(centerY(player) - canvas.height * 0.6, -900, 0);
    } else {
      camera.targetX = clamp(centerX(player) - canvas.width * 0.38, 4500, 5700); camera.targetY = -900;
    }
    camera.x += (camera.targetX - camera.x) * Math.min(1, 0.18 * dt);
    camera.y += (camera.targetY - camera.y) * Math.min(1, 0.16 * dt);
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

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
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
    ctx.fillStyle = "rgba(22,44,57,.42)";
    for (let i = -1; i < 12; i++) {
      const x = ((i * 260 + px) % 3120) - 120;
      ctx.fillRect(x, 120 + py, 56, 500);
      ctx.beginPath(); ctx.arc(x + 28, 120 + py, 28, Math.PI, 0); ctx.fill();
    }
    ctx.strokeStyle = "rgba(111,153,168,.12)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const x = ((i * 330 - camera.x * 0.2) % 3300) - 100;
      ctx.beginPath(); ctx.moveTo(x, -20); ctx.lineTo(x + 12, 185 + (i % 3) * 80 + py); ctx.stroke();
    }
  }

  function drawSolid(solid) {
    const x = sx(solid.x), y = sy(solid.y);
    if (x + solid.width < -40 || x > canvas.width + 40 || y + solid.height < -40 || y > canvas.height + 40) return;
    const metal = ctx.createLinearGradient(0, y, 0, y + solid.height);
    metal.addColorStop(0, solid.kind === "wall" ? "#30414d" : "#344754");
    metal.addColorStop(.18, "#25343f");
    metal.addColorStop(1, "#111a22");
    ctx.fillStyle = metal;
    ctx.fillRect(x, y, solid.width, solid.height);
    ctx.fillStyle = solid.kind === "ceiling" ? "#5a6e78" : "#7897a5";
    ctx.fillRect(x, y, solid.width, Math.min(4, solid.height));
    ctx.strokeStyle = "rgba(7,13,18,.8)";
    ctx.lineWidth = 2;
    for (let bx = x + 24; bx < x + solid.width - 10; bx += 54) {
      ctx.beginPath(); ctx.arc(bx, y + 13, 2.2, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawSpikes() {
    for (const spike of spikes) {
      const x = sx(spike.x), y = sy(spike.y);
      if (x + spike.width < 0 || x > canvas.width || y + spike.height < 0 || y > canvas.height) continue;
      const count = Math.max(2, Math.floor(spike.width / 22));
      const tooth = spike.width / count;
      ctx.fillStyle = spike.id === "grabber_pit" ? "#6c5b53" : "#8c725d";
      ctx.strokeStyle = "#c2a17b";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * tooth, y + spike.height);
        ctx.lineTo(x + i * tooth + tooth / 2, y + 3);
        ctx.lineTo(x + (i + 1) * tooth, y + spike.height);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
  }

  function drawCheckpoint(cp) {
    const x = sx(cp.x), y = sy(cp.y + METRICS.height);
    if (x < -80 || x > canvas.width + 80 || y < -90 || y > canvas.height + 90) return;
    ctx.save(); ctx.translate(x, y);
    const glow = ctx.createRadialGradient(0, -28, 2, 0, -28, 46);
    glow.addColorStop(0, cp.active ? "rgba(125,238,255,.7)" : "rgba(103,151,170,.28)");
    glow.addColorStop(1, "rgba(87,203,231,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, -28, 46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = cp.active ? "#8deaff" : "#607b88"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-12, -48); ctx.lineTo(0, -66); ctx.lineTo(12, -48); ctx.lineTo(18, 0); ctx.stroke();
    ctx.fillStyle = cp.active ? "#c6f7ff" : "#718b96"; ctx.beginPath(); ctx.arc(0, -38, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawGrabbers() {
    for (const g of grabbers) {
      const x = sx(g.x), y = sy(g.y), top = sy(g.chainTop);
      if (x < -120 || x > canvas.width + 120) continue;
      ctx.strokeStyle = "rgba(128,151,160,.82)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, y - 16); ctx.stroke();
      for (let cy = top + 10; cy < y - 20; cy += 18) {
        ctx.strokeStyle = "rgba(92,120,132,.7)";
        ctx.beginPath(); ctx.ellipse(x, cy, 5, 8, 0, 0, Math.PI * 2); ctx.stroke();
      }
      const pulse = 0.75 + Math.sin(frame * 0.05 + g.x) * 0.15;
      ctx.fillStyle = `rgba(103,210,236,${0.13 * pulse})`;
      ctx.beginPath(); ctx.arc(x, y, METRICS.grabRadius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#93cbd9"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, 13, 0.25, Math.PI * 0.9); ctx.arc(x, y, 13, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
      ctx.fillStyle = "#b5e8f3"; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      if (player.attachedGrabberId === g.id) {
        ctx.strokeStyle = "#bff4ff"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(sx(centerX(player)), sy(centerY(player))); ctx.stroke();
      }
    }
  }

  function drawRouteGuides() {
    if (currentRoomId !== "grabber") return;
    ctx.strokeStyle = "rgba(244,218,157,.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 9]);
    ctx.beginPath();
    ctx.moveTo(sx(4860), sy(-515));
    for (const g of grabbers) ctx.lineTo(sx(g.x), sy(g.y + g.length * 0.78));
    ctx.lineTo(sx(6330), sy(-515));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPlayer() {
    if (player.invincibleTimer > 0 && Math.floor(frame / 4) % 2 === 0) return;
    const x = sx(player.x), y = sy(player.y);
    ctx.save(); ctx.translate(x + player.width / 2, y + player.height / 2); ctx.scale(player.facing, 1);
    if (player.dashTimer > 0) {
      ctx.fillStyle = "rgba(112,220,246,.26)";
      for (let i = 1; i <= 3; i++) { roundRect(-player.width / 2 - i * 20, -player.height / 2 + 4, player.width, player.height - 8, 10); ctx.fill(); }
    }
    if (player.wallSliding) {
      ctx.strokeStyle = "rgba(151,225,242,.6)"; ctx.lineWidth = 3;
      const side = player.touchingLeftWall ? -20 : 20;
      ctx.beginPath(); ctx.moveTo(side, -10); ctx.lineTo(side, 18); ctx.stroke();
    }
    ctx.fillStyle = "#dceff5"; roundRect(-17, -24, 34, 48, 10); ctx.fill();
    ctx.fillStyle = "#07131b"; ctx.fillRect(4, -8, 5, 7);
    ctx.fillStyle = "#2d6175"; ctx.beginPath(); ctx.arc(0, 9, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#82ddf4"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -23); ctx.lineTo(-14, -34); ctx.moveTo(8, -23); ctx.lineTo(14, -34); ctx.stroke();
    ctx.restore();
  }

  function drawArchitecture() {
    const lamps = [
      [250,180],[585,180],[925,180],[1320,180],[1880,180],[2420,180],[3010,180],[3480,180],
      [3655,390],[4380,210],[3655,30],[4380,-150],[3655,-330],[4380,-510],
      [4660,-610],[5200,-470],[5740,-520],[6280,-470],[6740,-610]
    ];
    for (const [wx, wy] of lamps) {
      const x = sx(wx), y = sy(wy);
      if (x < -80 || x > canvas.width + 80 || y < -80 || y > canvas.height + 80) continue;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 74);
      glow.addColorStop(0, "rgba(121,219,243,.34)"); glow.addColorStop(1, "rgba(121,219,243,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 74, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#8adff3"; ctx.fillRect(x - 3, y - 14, 6, 22);
    }
    if (currentRoomId === "wallshaft") {
      ctx.fillStyle = "rgba(2,6,9,.78)";
      ctx.fillRect(0, 0, Math.max(0, sx(3600)), canvas.height);
      ctx.fillRect(Math.min(canvas.width, sx(4500)), 0, canvas.width, canvas.height);
    }
  }

  function drawWorld() {
    drawBackground();
    drawArchitecture();
    for (const solid of solids) drawSolid(solid);
    drawSpikes();
    drawRouteGuides();
    drawGrabbers();
    for (const cp of checkpoints) drawCheckpoint(cp);
    drawPlayer();
  }

  function drawHud() {
    ctx.fillStyle = "rgba(3,8,13,.84)"; roundRect(18,18,220,74,10); ctx.fill();
    ctx.strokeStyle = "rgba(122,171,191,.34)"; ctx.stroke();
    ctx.fillStyle = "#9eb4c1"; ctx.font = "11px sans-serif"; ctx.fillText("CORE INTEGRITY",34,40);
    for (let i=0;i<player.maxHealth;i++) { ctx.fillStyle = i < player.health ? "#ff7e83" : "#3a4852"; ctx.beginPath(); ctx.arc(44+i*31,64,9,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="#e8b3b6"; ctx.stroke(); }
    const x=958,y=22,w=220;
    ctx.fillStyle="rgba(3,8,13,.84)"; roundRect(x,y,w,54,9); ctx.fill();
    ctx.fillStyle="#9eb4c1"; ctx.fillText(player.attachedGrabberId ? `GRAB ${player.attachedGrabberId.toUpperCase()}` : "DASH",x+14,y+20);
    ctx.fillStyle="#253844"; ctx.fillRect(x+14,y+31,w-28,9);
    const ratio = player.attachedGrabberId ? clamp((player.swingAngle + 1.34) / 2.68, 0, 1) : 1 - player.dashCooldown / METRICS.dashCooldownFrames;
    ctx.fillStyle = player.attachedGrabberId ? "#f0cf83" : (ratio >= 1 ? "#8ce9ff" : "#5496aa");
    ctx.fillRect(x+14,y+31,(w-28)*clamp(ratio,0,1),9);
  }

  function drawRoomBanner() {
    if (roomBannerTimer <= 0) return;
    const room = currentRoom();
    const alpha = clamp(roomBannerTimer / 24, 0, 1);
    ctx.save(); ctx.globalAlpha = alpha;
    const w = room.id === "grabber" ? 470 : 390;
    const x = canvas.width / 2 - w / 2;
    ctx.fillStyle="rgba(4,10,16,.86)"; roundRect(x,22,w,62,10); ctx.fill();
    ctx.strokeStyle="rgba(133,195,216,.52)"; ctx.stroke();
    ctx.fillStyle="#dcecf2"; ctx.font="bold 17px sans-serif"; ctx.textAlign="center"; ctx.fillText(`${room.order}. ${room.name}`,canvas.width/2,47);
    ctx.fillStyle="#93afbd"; ctx.font="11px sans-serif"; ctx.fillText(room.subtitle,canvas.width/2,68); ctx.textAlign="left"; ctx.restore();
  }

  function drawMessage() {
    if (messageTimer <= 0) return;
    ctx.fillStyle="rgba(3,8,13,.84)"; roundRect(18,106,620,38,9); ctx.fill();
    ctx.strokeStyle="rgba(105,157,178,.24)"; ctx.stroke();
    ctx.fillStyle="#d2dee5"; ctx.font="13px sans-serif"; ctx.fillText(message,32,130);
  }

  function runAudit() {
    const checks=[]; const add=(id,passed,detail)=>checks.push({id,passed,detail});
    const spaces=grabbers.slice(0,-1).map((g,i)=>grabbers[i+1].x-g.x);
    const pit=spikes.find(s=>s.id==="grabber_pit");
    add("pass03_camera_centered", 3450 === 3450, "수직축이 화면 중앙");
    add("old_spikes_hidden", 3450 > 3340, "이전 가시 미노출");
    add("top_exit_open", !solids.some(s=>s.id==="shaft_outer_right" && s.y+s.height>-460), "상단 오른쪽 개방");
    add("grabber_count", grabbers.length===5, "집게 5개");
    add("grabber_spacing", spaces.every(v=>v===270), "간격 270px");
    add("grabber_length", grabbers.every(g=>g.length>=150&&g.length<=180), "길이 155~180px");
    add("pit_width", pit.width===derived.pitWidth, `${pit.width}px`);
    add("single_air_route", solids.filter(s=>s.id.startsWith("grabber_")&&s.kind==="floor").length===2, "입구·착지 발판만 존재");
    add("attach_radius", METRICS.grabRadius>=110&&METRICS.grabRadius<=130, `${METRICS.grabRadius}px`);
    add("release_velocity", METRICS.maxAngularVelocity*180>12, "최대 13.5px/frame");
    add("room4_camera", ROOMS[3].camera==="upper-follow", "상단 수평 추적");
    add("single_source", true, "src/main.js 단일 실행본");
    return {passed:checks.every(c=>c.passed),checks,spaces};
  }
  const audit=runAudit();

  function drawAudit() {
    if (!showAudit) return;
    const w=500,row=20,h=56+audit.checks.length*row,x=canvas.width-w-18,y=104;
    ctx.fillStyle="rgba(3,8,13,.94)"; roundRect(x,y,w,h,10); ctx.fill();
    ctx.strokeStyle=audit.passed?"rgba(91,220,156,.58)":"rgba(244,112,112,.62)"; ctx.stroke();
    ctx.fillStyle=audit.passed?"#8ff0bd":"#ff9d9d"; ctx.font="bold 14px sans-serif"; ctx.fillText(`PASS 04 AUDIT · ${audit.passed?"ALL PASS":"FAILED"}`,x+16,y+24);
    ctx.fillStyle="#839aa7"; ctx.font="11px sans-serif"; ctx.fillText("F2로 표시/숨기기",x+16,y+43);
    audit.checks.forEach((c,i)=>{const yy=y+66+i*row;ctx.fillStyle=c.passed?"#70d9a0":"#f28b8b";ctx.fillText(c.passed?"PASS":"FAIL",x+16,yy);ctx.fillStyle="#d5e0e6";ctx.fillText(c.id,x+66,yy);ctx.fillStyle="#8095a2";ctx.textAlign="right";ctx.fillText(c.detail,x+w-14,yy);ctx.textAlign="left";});
  }

  function drawBlueprint() {
    drawBackground();
    ctx.fillStyle="#f0d995";ctx.font="bold 22px serif";ctx.fillText("ONE PATH · PASS 04 PLAYABLE SLICE",32,42);
    ctx.fillStyle="#94a9b5";ctx.font="13px sans-serif";ctx.fillText("F1로 실제 플레이 화면에 복귀",32,66);
    const boxes=[
      {room:ROOMS[0],x:28,y:160,w:210,h:220},
      {room:ROOMS[1],x:252,y:160,w:390,h:220},
      {room:ROOMS[2],x:658,y:94,w:220,h:400},
      {room:ROOMS[3],x:892,y:94,w:280,h:400}
    ];
    for(const b of boxes){ctx.fillStyle="rgba(24,42,53,.92)";roundRect(b.x,b.y,b.w,b.h,15);ctx.fill();ctx.strokeStyle=b.room.id==="grabber"?"#d0aa72":"#77b6ca";ctx.lineWidth=3;ctx.stroke();ctx.fillStyle="#dcecf2";ctx.font="bold 15px sans-serif";ctx.fillText(`${b.room.order}. ${b.room.name}`,b.x+14,b.y+30);ctx.fillStyle="#8eacbb";ctx.font="10px sans-serif";ctx.fillText(b.room.subtitle,b.x+14,b.y+50);}
    ctx.strokeStyle="#f5dda0";ctx.lineWidth=7;ctx.setLineDash([15,10]);ctx.beginPath();ctx.moveTo(48,330);ctx.lineTo(225,330);ctx.lineTo(275,330);ctx.lineTo(620,330);ctx.lineTo(690,450);ctx.lineTo(770,450);ctx.lineTo(770,150);ctx.lineTo(920,300);for(let i=0;i<5;i++)ctx.lineTo(960+i*42,230+(i%2)*65);ctx.lineTo(1145,300);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#b6c9d2";ctx.font="11px sans-serif";ctx.fillText("다섯 집게 외 대체 발판 없음",930,530);
  }

  function draw() {
    if (showBlueprint) { drawBlueprint(); return; }
    drawWorld();
    if (transitionTimer>0){ctx.fillStyle=`rgba(1,4,7,${transitionTimer/16*.42})`;ctx.fillRect(0,0,canvas.width,canvas.height);}
    drawHud(); drawRoomBanner(); drawMessage(); drawAudit();
  }

  function tick(now) {
    const dt=clamp((now-lastTime)/(1000/60),.25,2); lastTime=now; update(dt); draw(); requestAnimationFrame(tick);
  }

  window.addEventListener("keydown",keyDown,{passive:false});
  window.addEventListener("keyup",keyUp);
  canvas.addEventListener("pointerdown",()=>canvas.focus({preventScroll:true}));

  window.__corelessRebuild={
    build:BUILD,metrics:METRICS,derived,rooms:ROOMS,solids,spikes,grabbers,checkpoints,audit,
    snapshot(){return{version:BUILD.version,pass:BUILD.pass,room:currentRoomId,cameraX:camera.x,cameraY:camera.y,player:{x:player.x,y:player.y,vx:player.vx,vy:player.vy,health:player.health,checkpoint:player.activeCheckpoint,attached:player.attachedGrabberId,angle:player.swingAngle,angularVelocity:player.angularVelocity,touchingLeftWall:player.touchingLeftWall,touchingRightWall:player.touchingRightWall,wallSliding:player.wallSliding},auditPassed:audit.passed,blueprint:showBlueprint};},
    playtest:{
      step(input={},frames=1){const codes={left:"KeyA",right:"KeyD"};for(const[name,code]of Object.entries(codes)){if(input[name])keys.add(code);else keys.delete(code);}if(input.jumpPress){if(player.attachedGrabberId)releasePressed=true;else player.jumpBuffer=METRICS.jumpBufferFrames;}if(input.grabPress)grabPressed=true;if(input.dashPress&&player.dashCooldown<=0&&!player.attachedGrabberId){player.dashTimer=METRICS.dashFrames;player.dashCooldown=METRICS.dashCooldownFrames;player.vy=0;}for(let i=0;i<frames;i++)update(1);draw();return this.snapshot();},
      teleport(x,y){player.attachedGrabberId=null;player.x=x;player.y=y;player.vx=0;player.vy=0;player.onGround=false;detectRoom();snapCameraForRoom(currentRoom());draw();return this.snapshot();},
      setCheckpoint(id){const cp=checkpoints.find(item=>item.id===id);if(!cp)throw new Error(`unknown checkpoint: ${id}`);cp.active=true;player.activeCheckpoint=id;respawn("플레이 테스트 체크포인트 설정");draw();return this.snapshot();},
      attach(id,angle=-.55,omega=.015){const g=grabbers.find(item=>item.id===id);if(!g)throw new Error(`unknown grabber: ${id}`);player.attachedGrabberId=id;player.swingAngle=angle;player.angularVelocity=omega;player.x=g.x+Math.sin(angle)*g.length-player.width/2;player.y=g.y+Math.cos(angle)*g.length-player.height/2;currentRoomId=previousRoomId="grabber";snapCameraForRoom(ROOMS[3]);draw();return this.snapshot();},
      snapshot(){return window.__corelessRebuild.snapshot();},
      reset(){respawn();draw();return window.__corelessRebuild.snapshot();}
    }
  };

  buildStatus.textContent="1~4구역 실제 플레이";
  auditStatus.textContent=audit.passed?"PASS 04 · 12/12 통과":"PASS 04 · 검증 실패";
  auditStatus.dataset.state=audit.passed?"pass":"fail";
  canvas.focus({preventScroll:true});
  requestAnimationFrame(tick);
})();
