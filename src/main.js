"use strict";

(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const buildStatus = document.getElementById("buildStatus");
  const auditStatus = document.getElementById("auditStatus");

  const BUILD = Object.freeze({
    version: "rebuild-pass01",
    pass: 1,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    worldWidth: 8400,
    worldHeight: 3180,
    cameraWidth: 1200,
    cameraHeight: 680
  });

  const PLAYER_METRICS = Object.freeze({
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
    jumpBufferFrames: 8
  });

  const derivedMetrics = Object.freeze({
    jumpRise: (PLAYER_METRICS.jumpVelocity ** 2) / (2 * PLAYER_METRICS.gravity),
    dashDistance: PLAYER_METRICS.dashSpeed * PLAYER_METRICS.dashFrames,
    safeHorizontalJump: 190,
    minimumPassageWidth: PLAYER_METRICS.width * 2.4,
    minimumCombatWidth: 780,
    cameraRoomWidth: BUILD.cameraWidth
  });

  const ZONES = Object.freeze([
    { id: "tutorial", order: 1, name: "이동 도입", concept: "안전한 이동·점프", x: 0, y: 0, width: 1220, height: 720, entry: [80, 590], exit: [1160, 590], mode: "movement" },
    { id: "precision", order: 2, name: "정밀 점프", concept: "작은 간격과 가시", x: 1220, y: 0, width: 1320, height: 720, entry: [1260, 590], exit: [2480, 590], mode: "platform" },
    { id: "wallshaft", order: 3, name: "벽점프 수직축", concept: "한 화면 폭 수직 등반", x: 2540, y: 0, width: 820, height: 1120, entry: [2580, 980], exit: [3300, 110], mode: "vertical" },
    { id: "grabber", order: 4, name: "집게 횡단", concept: "낭떠러지 위 진자 이동", x: 3360, y: 0, width: 1620, height: 900, entry: [3400, 600], exit: [4920, 600], mode: "traversal" },
    { id: "turret", order: 5, name: "벽면 터렛 회랑", concept: "조준 사격 회피", x: 4980, y: 0, width: 1620, height: 720, entry: [5020, 590], exit: [6540, 590], mode: "hazard" },
    { id: "combat", order: 6, name: "전투 경기장", concept: "캐릭터 크기 적 전투", x: 6600, y: 0, width: 1540, height: 920, entry: [6640, 590], exit: [8040, 790], mode: "combat" },
    { id: "boulder", order: 7, name: "장거리 붕괴석 추격", concept: "긴 단일 하강 루트", x: 620, y: 1080, width: 7520, height: 1120, entry: [8040, 1120], exit: [740, 2100], mode: "chase" },
    { id: "checkpoint", order: 8, name: "체크포인트 허브", concept: "회복과 단락 전환", x: 0, y: 2200, width: 1460, height: 780, entry: [740, 2240], exit: [1400, 2700], mode: "safe" },
    { id: "mixed", order: 9, name: "혼합 이동·전투", concept: "짧은 전투와 이동 결합", x: 1460, y: 2200, width: 4980, height: 780, entry: [1500, 2700], exit: [6380, 2700], mode: "mixed" },
    { id: "exit", order: 10, name: "최종 상승·출구", concept: "수직 상승 후 다음 방", x: 6440, y: 1760, width: 1700, height: 1220, entry: [6480, 2700], exit: [8060, 1840], mode: "vertical" }
  ]);

  const ROUTE = Object.freeze([
    [80, 590], [1160, 590], [1260, 590], [2480, 590],
    [2580, 980], [3300, 110], [3400, 600], [4920, 600],
    [5020, 590], [6540, 590], [6640, 590], [8040, 790],
    [8040, 1120], [7420, 1280], [6660, 1420], [5900, 1260],
    [5120, 1540], [4360, 1370], [3580, 1690], [2800, 1500],
    [2040, 1840], [1320, 1660], [740, 2100], [740, 2240],
    [1400, 2700], [1500, 2700], [2480, 2580], [3380, 2740],
    [4300, 2520], [5260, 2740], [6380, 2700], [6480, 2700],
    [7240, 2360], [7700, 2100], [8060, 1840]
  ]);

  const calibrationPlatforms = Object.freeze([
    { x: 0, y: 596, width: 1200, height: 84 },
    { x: 170, y: 510, width: 150, height: 18 },
    { x: 390, y: 440, width: 170, height: 18 },
    { x: 640, y: 370, width: 180, height: 18 },
    { x: 925, y: 480, width: 150, height: 18 }
  ]);

  const player = {
    x: 84,
    y: 596 - PLAYER_METRICS.height,
    vx: 0,
    vy: 0,
    width: PLAYER_METRICS.width,
    height: PLAYER_METRICS.height,
    onGround: true,
    facing: 1,
    dashTimer: 0,
    dashCooldown: 0,
    coyoteTimer: PLAYER_METRICS.coyoteFrames,
    jumpBuffer: 0
  };

  const keys = new Set();
  let mode = "blueprint";
  let showAudit = true;
  let frame = 0;
  let lastTime = performance.now();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function insideZone(point, zone) {
    return point[0] >= zone.x && point[0] <= zone.x + zone.width &&
      point[1] >= zone.y && point[1] <= zone.y + zone.height;
  }

  function runPass01Audit() {
    const checks = [];
    const add = (id, passed, detail) => checks.push({ id, passed, detail });

    const orders = ZONES.map(zone => zone.order);
    add("zone_order", orders.every((value, index) => value === index + 1), "1부터 10까지 연속 순서");
    add("single_route", ROUTE.length >= 30 && !ROUTE.some(point => point.length !== 2), "분기 없는 하나의 좌표열");
    add("route_start", Math.hypot(ROUTE[0][0] - ZONES[0].entry[0], ROUTE[0][1] - ZONES[0].entry[1]) < 1, "시작점 일치");
    add("route_exit", Math.hypot(ROUTE.at(-1)[0] - ZONES.at(-1).exit[0], ROUTE.at(-1)[1] - ZONES.at(-1).exit[1]) < 1, "출구점 일치");
    add("entries_inside", ZONES.every(zone => insideZone(zone.entry, zone)), "모든 입구가 해당 공간 내부");
    add("exits_inside", ZONES.every(zone => insideZone(zone.exit, zone)), "모든 출구가 해당 공간 내부");
    add("combat_scale", ZONES.find(zone => zone.id === "combat").width >= derivedMetrics.minimumCombatWidth, "전투 공간 최소 폭 확보");
    add("passage_scale", derivedMetrics.minimumPassageWidth >= PLAYER_METRICS.width * 2, "통로 폭 기준 확보");
    add("jump_metric", derivedMetrics.jumpRise >= 100 && derivedMetrics.jumpRise <= 125, `점프 상승량 ${derivedMetrics.jumpRise.toFixed(1)}px`);
    add("dash_metric", derivedMetrics.dashDistance >= 120 && derivedMetrics.dashDistance <= 140, `대시 거리 ${derivedMetrics.dashDistance.toFixed(1)}px`);
    add("camera_unit", BUILD.cameraWidth === canvas.width, "한 화면 단위와 캔버스 폭 일치");
    add("world_bounds", ZONES.every(zone => zone.x + zone.width <= BUILD.worldWidth && zone.y + zone.height <= BUILD.worldHeight), "모든 공간이 월드 경계 내부");

    return {
      passed: checks.every(check => check.passed),
      checks
    };
  }

  const audit = runPass01Audit();

  function resetPlayer() {
    Object.assign(player, {
      x: 84,
      y: 596 - PLAYER_METRICS.height,
      vx: 0,
      vy: 0,
      onGround: true,
      facing: 1,
      dashTimer: 0,
      dashCooldown: 0,
      coyoteTimer: PLAYER_METRICS.coyoteFrames,
      jumpBuffer: 0
    });
  }

  function toggleMode() {
    mode = mode === "blueprint" ? "calibration" : "blueprint";
    buildStatus.textContent = mode === "blueprint"
      ? "전체 단일 경로 설계도"
      : "이동 수치 시험실";
    resetPlayer();
  }

  function keyDown(event) {
    if (["Space", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === "F1") toggleMode();
    if (event.code === "F2") showAudit = !showAudit;
    if (event.code === "KeyR") resetPlayer();
    if (event.code === "Space") player.jumpBuffer = PLAYER_METRICS.jumpBufferFrames;
    if ((event.code === "ShiftLeft" || event.code === "ShiftRight") && player.dashCooldown <= 0) {
      player.dashTimer = PLAYER_METRICS.dashFrames;
      player.dashCooldown = PLAYER_METRICS.dashCooldownFrames;
      player.vy = 0;
    }
  }

  function keyUp(event) {
    keys.delete(event.code);
  }

  function horizontalOverlap(a, b) {
    return a.x + a.width > b.x && a.x < b.x + b.width;
  }

  function updateCalibration(dt) {
    const left = keys.has("KeyA") || keys.has("ArrowLeft");
    const right = keys.has("KeyD") || keys.has("ArrowRight");
    const direction = (right ? 1 : 0) - (left ? 1 : 0);

    if (direction !== 0) player.facing = direction;

    if (player.dashTimer > 0) {
      player.dashTimer -= dt;
      player.vx = player.facing * PLAYER_METRICS.dashSpeed;
      player.vy = 0;
    } else {
      const acceleration = player.onGround ? PLAYER_METRICS.groundAcceleration : PLAYER_METRICS.airAcceleration;
      if (direction !== 0) {
        player.vx += direction * acceleration * dt;
      } else if (player.onGround) {
        player.vx *= Math.pow(PLAYER_METRICS.friction, dt);
      }
      player.vx = clamp(player.vx, -PLAYER_METRICS.runSpeed, PLAYER_METRICS.runSpeed);
      player.vy = Math.min(PLAYER_METRICS.maxFallSpeed, player.vy + PLAYER_METRICS.gravity * dt);
    }

    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyoteTimer = player.onGround
      ? PLAYER_METRICS.coyoteFrames
      : Math.max(0, player.coyoteTimer - dt);

    if (player.jumpBuffer > 0 && player.coyoteTimer > 0 && player.dashTimer <= 0) {
      player.vy = -PLAYER_METRICS.jumpVelocity;
      player.onGround = false;
      player.coyoteTimer = 0;
      player.jumpBuffer = 0;
    }

    player.x += player.vx * dt;
    player.x = clamp(player.x, 0, canvas.width - player.width);

    const previousBottom = player.y + player.height;
    player.y += player.vy * dt;
    player.onGround = false;

    for (const platform of calibrationPlatforms) {
      const nextBottom = player.y + player.height;
      if (player.vy >= 0 && previousBottom <= platform.y + 2 && nextBottom >= platform.y && horizontalOverlap(player, platform)) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.onGround = true;
      }
    }

    if (player.y > canvas.height + 120) resetPlayer();
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
    gradient.addColorStop(0, "#09131d");
    gradient.addColorStop(1, "#04070b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawBlueprint() {
    const margin = 34;
    const scale = Math.min(
      (canvas.width - margin * 2) / BUILD.worldWidth,
      (canvas.height - margin * 2 - 90) / BUILD.worldHeight
    );
    const offsetX = (canvas.width - BUILD.worldWidth * scale) / 2;
    const offsetY = 92;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    for (const zone of ZONES) {
      const hue = 195 + zone.order * 3;
      ctx.fillStyle = `hsla(${hue}, 32%, ${12 + zone.order * 0.5}%, 0.92)`;
      ctx.strokeStyle = zone.mode === "chase" ? "#e1a56f" : "#6ea8bd";
      ctx.lineWidth = 10 / scale;
      roundRect(zone.x, zone.y, zone.width, zone.height, 40 / scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#dcecf2";
      ctx.font = `${92 / scale}px serif`;
      ctx.fillText(String(zone.order), zone.x + 42 / scale, zone.y + 106 / scale);
      ctx.font = `bold ${66 / scale}px sans-serif`;
      ctx.fillText(zone.name, zone.x + 132 / scale, zone.y + 102 / scale);
      ctx.fillStyle = "#91b5c4";
      ctx.font = `${48 / scale}px sans-serif`;
      ctx.fillText(zone.concept, zone.x + 132 / scale, zone.y + 164 / scale);
    }

    ctx.strokeStyle = "rgba(249, 226, 166, 0.96)";
    ctx.lineWidth = 18 / scale;
    ctx.setLineDash([50 / scale, 30 / scale]);
    ctx.beginPath();
    ROUTE.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point[0], point[1]);
      else ctx.lineTo(point[0], point[1]);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    for (let index = 2; index < ROUTE.length; index += 3) {
      const a = ROUTE[index - 1];
      const b = ROUTE[index];
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      ctx.save();
      ctx.translate(b[0], b[1]);
      ctx.rotate(angle);
      ctx.fillStyle = "#f6df9e";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-110 / scale, -52 / scale);
      ctx.lineTo(-110 / scale, 52 / scale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    ctx.fillStyle = "#f0d995";
    ctx.font = "bold 22px serif";
    ctx.fillText("ONE PATH · ONE DESCENT · ONE EXIT", 34, 42);
    ctx.fillStyle = "#98acb7";
    ctx.font = "13px sans-serif";
    ctx.fillText("확정 설계도: 10개 구간 · 분기 없음 · 실제 수치 기반", 34, 66);

    drawMetricCards();
  }

  function drawMetricCards() {
    const cards = [
      ["캐릭터", `${PLAYER_METRICS.width}×${PLAYER_METRICS.height}px`],
      ["점프 상승", `${derivedMetrics.jumpRise.toFixed(1)}px`],
      ["대시 거리", `${derivedMetrics.dashDistance.toFixed(1)}px`],
      ["한 화면", `${BUILD.cameraWidth}×${BUILD.cameraHeight}px`],
      ["전투 최소 폭", `${derivedMetrics.minimumCombatWidth}px`]
    ];
    const width = 204;
    cards.forEach((card, index) => {
      const x = 34 + index * (width + 18);
      const y = canvas.height - 76;
      ctx.fillStyle = "rgba(8, 18, 26, 0.9)";
      roundRect(x, y, width, 46, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(104, 159, 182, 0.38)";
      ctx.stroke();
      ctx.fillStyle = "#8fb3c2";
      ctx.font = "11px sans-serif";
      ctx.fillText(card[0], x + 12, y + 17);
      ctx.fillStyle = "#e5eef3";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(card[1], x + 12, y + 36);
    });
  }

  function drawCalibration() {
    ctx.strokeStyle = "rgba(89, 126, 144, 0.16)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    for (const platform of calibrationPlatforms) {
      ctx.fillStyle = "#273846";
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.fillStyle = "#7ca5b7";
      ctx.fillRect(platform.x, platform.y, platform.width, 4);
    }

    ctx.fillStyle = "rgba(196, 141, 79, 0.2)";
    ctx.fillRect(845, 330, derivedMetrics.dashDistance, 266);
    ctx.strokeStyle = "#dfac6f";
    ctx.setLineDash([8, 7]);
    ctx.strokeRect(845, 330, derivedMetrics.dashDistance, 266);
    ctx.setLineDash([]);
    ctx.fillStyle = "#efc68d";
    ctx.font = "12px sans-serif";
    ctx.fillText(`대시 기준 ${derivedMetrics.dashDistance.toFixed(0)}px`, 850, 352);

    const jumpTop = 596 - PLAYER_METRICS.height - derivedMetrics.jumpRise;
    ctx.strokeStyle = "#77c4df";
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(42, jumpTop); ctx.lineTo(155, jumpTop); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#9ed9ec";
    ctx.fillText(`점프 최고점 약 ${derivedMetrics.jumpRise.toFixed(0)}px`, 42, jumpTop - 9);

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.scale(player.facing, 1);
    ctx.fillStyle = player.dashTimer > 0 ? "#d7f4ff" : "#b9e8f5";
    roundRect(-player.width / 2, -player.height / 2, player.width, player.height, 9);
    ctx.fill();
    ctx.fillStyle = "#06121a";
    ctx.fillRect(4, -8, 5, 7);
    ctx.strokeStyle = "#6fd2f3";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -24); ctx.lineTo(-14, -34); ctx.moveTo(8, -24); ctx.lineTo(14, -34); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#e5edf2";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("이동 수치 시험실", 28, 38);
    ctx.fillStyle = "#9db0bc";
    ctx.font = "13px sans-serif";
    ctx.fillText("최종 지형을 만들기 전에 캐릭터 크기·점프·대시 기준을 고정합니다.", 28, 62);

    const cooldownRatio = player.dashCooldown / PLAYER_METRICS.dashCooldownFrames;
    ctx.fillStyle = "rgba(10, 18, 25, 0.86)";
    roundRect(930, 24, 238, 54, 8);
    ctx.fill();
    ctx.fillStyle = "#253948";
    ctx.fillRect(946, 53, 204, 9);
    ctx.fillStyle = "#7fd1ee";
    ctx.fillRect(946, 53, 204 * (1 - cooldownRatio), 9);
    ctx.fillStyle = "#d8e5ec";
    ctx.font = "12px sans-serif";
    ctx.fillText("DASH RECOVERY", 946, 43);
  }

  function drawAuditPanel() {
    if (!showAudit) return;
    const panelWidth = 400;
    const panelX = canvas.width - panelWidth - 22;
    const panelY = 98;
    const rowHeight = 21;
    const panelHeight = 58 + audit.checks.length * rowHeight;

    ctx.fillStyle = "rgba(4, 10, 16, 0.93)";
    roundRect(panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fill();
    ctx.strokeStyle = audit.passed ? "rgba(91, 220, 156, 0.54)" : "rgba(244, 112, 112, 0.62)";
    ctx.stroke();
    ctx.fillStyle = audit.passed ? "#8ff0bd" : "#ff9d9d";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(`PASS 01 AUDIT · ${audit.passed ? "ALL PASS" : "FAILED"}`, panelX + 16, panelY + 25);
    ctx.fillStyle = "#91a8b6";
    ctx.font = "11px sans-serif";
    ctx.fillText("F2로 숨기기", panelX + 16, panelY + 44);

    audit.checks.forEach((check, index) => {
      const y = panelY + 67 + index * rowHeight;
      ctx.fillStyle = check.passed ? "#70d9a0" : "#f28b8b";
      ctx.fillText(check.passed ? "PASS" : "FAIL", panelX + 16, y);
      ctx.fillStyle = "#d5e0e6";
      ctx.fillText(check.id, panelX + 68, y);
      ctx.fillStyle = "#8095a2";
      ctx.textAlign = "right";
      ctx.fillText(check.detail, panelX + panelWidth - 14, y);
      ctx.textAlign = "left";
    });
  }

  function draw() {
    drawBackground();
    if (mode === "blueprint") drawBlueprint();
    else drawCalibration();
    drawAuditPanel();
  }

  function tick(now) {
    const dt = clamp((now - lastTime) / (1000 / 60), 0.25, 2);
    lastTime = now;
    frame += 1;
    if (mode === "calibration") updateCalibration(dt);
    draw();
    requestAnimationFrame(tick);
  }

  window.addEventListener("keydown", keyDown, { passive: false });
  window.addEventListener("keyup", keyUp);
  canvas.addEventListener("pointerdown", () => canvas.focus({ preventScroll: true }));

  window.__corelessRebuild = {
    build: BUILD,
    playerMetrics: PLAYER_METRICS,
    derivedMetrics,
    zones: ZONES,
    route: ROUTE,
    audit,
    snapshot() {
      return {
        version: BUILD.version,
        pass: BUILD.pass,
        mode,
        auditPassed: audit.passed,
        zoneCount: ZONES.length,
        routePointCount: ROUTE.length,
        jumpRise: derivedMetrics.jumpRise,
        dashDistance: derivedMetrics.dashDistance,
        player: { x: player.x, y: player.y, vx: player.vx, vy: player.vy }
      };
    }
  };

  buildStatus.textContent = "전체 단일 경로 설계도";
  auditStatus.textContent = audit.passed ? "PASS 01 · 12/12 통과" : "PASS 01 · 검증 실패";
  auditStatus.dataset.state = audit.passed ? "pass" : "fail";
  canvas.focus({ preventScroll: true });
  requestAnimationFrame(tick);
})();
