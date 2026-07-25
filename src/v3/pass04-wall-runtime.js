import {
  PASS04_BUILD,
  PASS04_SOLIDS,
  PASS04_TRIGGERS,
  PASS04_WORLD,
} from "./pass04-wall-level.js";
import {
  PLAYER_PHYSICS,
  createCamera,
  createPlayer,
  rectangleIntersectsPlayer,
  stepCamera,
  stepPlayer,
} from "./player-physics.js";

const FIXED_STEP = 1 / 120;
const MAX_FRAME_DELTA = 1 / 15;

function createTestCamera(player, canvas) {
  const camera = createCamera(player);
  const centeredX = Math.max(0, player.x + PLAYER_PHYSICS.width / 2 - canvas.width / 2);
  return {
    ...camera,
    x: centeredX,
    targetX: centeredX,
    y: PASS04_WORLD.height - canvas.height,
    targetY: PASS04_WORLD.height - canvas.height,
  };
}

export class Pass04WallRuntime {
  constructor(canvas, statusNodes = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.statusNodes = statusNodes;
    this.player = createPlayer(PASS04_WORLD.spawn.x, PASS04_WORLD.spawn.y);
    this.player.grounded = true;
    this.player.abilities.doubleJump = false;
    this.camera = createTestCamera(this.player, canvas);
    this.keys = new Set();
    this.pendingJump = false;
    this.running = false;
    this.accumulator = 0;
    this.lastTime = 0;
    this.message = "벽 방향으로 이동한 뒤 SPACE로 반대편 벽을 향해 점프하세요";
    this.messageTimer = 5;
    this.audit = {
      fixedFrames: 0,
      wallContacts: 0,
      wallSlideFrames: 0,
      wallJumps: 0,
      maximumWallSlideSpeed: 0,
      minimumWallJumpVx: Infinity,
      maximumCameraStep: 0,
      edgeCorrections: 0,
      resets: 0,
      finished: false,
    };
    this.boundFrame = timestamp => this.frame(timestamp);
    this.boundKeyDown = event => this.onKeyDown(event);
    this.boundKeyUp = event => this.onKeyUp(event);
  }

  start() {
    if (this.running) return;
    this.running = true;
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
    this.canvas.addEventListener("pointerdown", () => this.canvas.focus());
    this.canvas.focus();
    this.lastTime = performance.now();
    requestAnimationFrame(this.boundFrame);
  }

  stop() {
    this.running = false;
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
  }

  onKeyDown(event) {
    if (["KeyA", "KeyD", "ArrowLeft", "ArrowRight", "Space", "KeyR"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "Space" && !this.keys.has("Space")) this.pendingJump = true;
    if (event.code === "KeyR") this.reset("수동 재시작");
    this.keys.add(event.code);
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
  }

  update(dt, overrideInput = null) {
    const input = overrideInput ?? {
      left: this.keys.has("KeyA") || this.keys.has("ArrowLeft"),
      right: this.keys.has("KeyD") || this.keys.has("ArrowRight"),
      jumpPressed: this.pendingJump,
      jumpHeld: this.keys.has("Space"),
    };
    this.pendingJump = false;
    const before = this.player;
    const beforeCamera = this.camera;
    this.player = stepPlayer(this.player, input, dt, PASS04_SOLIDS);

    if (before.wallSide === 0 && this.player.wallSide !== 0) this.audit.wallContacts += 1;
    if (this.player.wallSliding) {
      this.audit.wallSlideFrames += 1;
      this.audit.maximumWallSlideSpeed = Math.max(
        this.audit.maximumWallSlideSpeed,
        this.player.vy,
      );
    }
    if (this.player.wallJumpedThisFrame) {
      this.audit.wallJumps += 1;
      this.audit.minimumWallJumpVx = Math.min(
        this.audit.minimumWallJumpVx,
        Math.abs(this.player.vx),
      );
      this.message = `${this.audit.wallJumps}번째 벽 점프 · 반대 벽을 바라보세요`;
      this.messageTimer = 1.3;
    }
    if (this.player.edgeCorrectedThisFrame) this.audit.edgeCorrections += 1;

    const finish = PASS04_TRIGGERS.find(trigger => trigger.type === "finish");
    const playerCenterX = this.player.x + PLAYER_PHYSICS.width / 2;
    if (
      !this.audit.finished &&
      rectangleIntersectsPlayer(finish, this.player) &&
      playerCenterX >= finish.x
    ) {
      this.audit.finished = true;
      this.message = "V3 4차 벽 이동 시험 완료";
      this.messageTimer = 8;
    }

    this.camera = stepCamera(this.camera, this.player, dt, PASS04_WORLD);
    this.audit.maximumCameraStep = Math.max(
      this.audit.maximumCameraStep,
      Math.hypot(this.camera.x - beforeCamera.x, this.camera.y - beforeCamera.y),
    );
    this.audit.fixedFrames += 1;
    this.messageTimer = Math.max(0, this.messageTimer - dt);
  }

  reset(reason = "재시작") {
    this.player = createPlayer(PASS04_WORLD.spawn.x, PASS04_WORLD.spawn.y);
    this.player.grounded = true;
    this.camera = createTestCamera(this.player, this.canvas);
    this.audit.resets += 1;
    this.message = reason;
    this.messageTimer = 2;
  }

  frame(timestamp) {
    if (!this.running) return;
    const frameDelta = Math.min(MAX_FRAME_DELTA, Math.max(0, (timestamp - this.lastTime) / 1000));
    this.lastTime = timestamp;
    this.accumulator += frameDelta;
    while (this.accumulator >= FIXED_STEP) {
      this.update(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }
    this.draw();
    requestAnimationFrame(this.boundFrame);
  }

  drawBackground() {
    const context = this.context;
    const gradient = context.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#071116");
    gradient.addColorStop(1, "#0c1d24");
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const offsetY = -(this.camera.y * 0.2) % 210;
    context.strokeStyle = "rgba(111, 157, 166, 0.14)";
    context.lineWidth = 3;
    for (let y = offsetY - 210; y < this.canvas.height + 210; y += 210) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(this.canvas.width, y + 80);
      context.stroke();
    }
  }

  drawWorld() {
    const context = this.context;
    context.save();
    context.translate(-this.camera.x, -this.camera.y);

    context.fillStyle = "rgba(140, 194, 203, 0.08)";
    context.fillRect(440, 100, 860, 1260);
    context.strokeStyle = "rgba(141, 194, 204, 0.23)";
    context.lineWidth = 3;
    context.strokeRect(440, 100, 860, 1260);
    context.fillStyle = "rgba(190, 214, 216, 0.55)";
    context.font = "700 24px Arial, sans-serif";
    context.fillText("비정규 개발 시험실 · 수직 이동", 470, 145);

    for (const solid of PASS04_SOLIDS) {
      if (solid.role === "boundary") continue;
      const colors = {
        wall: ["#485d66", "#a2bec4"],
        recovery: ["#4a665d", "#9ac7aa"],
        exit: ["#67604b", "#dfc77c"],
        ceiling: ["#4a5054", "#969fa3"],
        terrain: ["#40555d", "#849fa6"],
      };
      const [fill, edge] = colors[solid.role] ?? colors.terrain;
      context.fillStyle = fill;
      context.fillRect(solid.x, solid.y, solid.width, solid.height);
      context.fillStyle = edge;
      context.fillRect(solid.x, solid.y, solid.width, Math.min(7, solid.height));
      context.strokeStyle = "rgba(7, 16, 20, 0.55)";
      context.lineWidth = 2;
      for (let y = solid.y + 30; y < solid.y + solid.height; y += 70) {
        context.beginPath();
        context.moveTo(solid.x + 8, y);
        context.lineTo(solid.x + solid.width - 8, Math.min(y + 24, solid.y + solid.height));
        context.stroke();
      }
    }

    const finish = PASS04_TRIGGERS[0];
    context.fillStyle = this.audit.finished ? "rgba(224, 201, 124, 0.28)" : "rgba(224, 201, 124, 0.1)";
    context.fillRect(finish.x, finish.y, finish.width, finish.height);
    context.strokeStyle = "#dfc77c";
    context.lineWidth = 4;
    context.strokeRect(finish.x + 15, finish.y + 15, finish.width - 30, finish.height - 30);

    const centerX = this.player.x + PLAYER_PHYSICS.width / 2;
    const centerY = this.player.y + PLAYER_PHYSICS.height / 2;
    context.save();
    context.translate(centerX, centerY);
    if (this.player.wallSliding) context.scale(0.92, 1.08);
    context.fillStyle = "#eff5ef";
    context.fillRect(
      -PLAYER_PHYSICS.width / 2,
      -PLAYER_PHYSICS.height / 2,
      PLAYER_PHYSICS.width,
      PLAYER_PHYSICS.height,
    );
    context.fillStyle = this.player.wallSide !== 0 ? "#e2c878" : "#9de1df";
    const contactX = this.player.wallSide < 0 ? -PLAYER_PHYSICS.width / 2 - 5 : PLAYER_PHYSICS.width / 2;
    context.fillRect(contactX, -18, 5, 36);
    context.fillStyle = "#132129";
    context.fillRect(this.player.facing > 0 ? 7 : -12, -14, 5, 5);
    context.restore();
    context.restore();
  }

  drawHud() {
    const context = this.context;
    context.fillStyle = "rgba(3, 9, 13, 0.86)";
    context.fillRect(20, this.canvas.height - 58, 600, 38);
    context.fillStyle = "#b9c9cc";
    context.font = "650 12px Arial, sans-serif";
    context.fillText(
      `A/D 이동 · SPACE 벽 점프 · R 재시작 · 벽 ${this.player.wallSide || "-"} · 점프 ${this.audit.wallJumps}`,
      38,
      this.canvas.height - 34,
    );
    if (this.messageTimer > 0) {
      const width = Math.min(760, Math.max(390, this.message.length * 17));
      context.fillStyle = "rgba(4, 12, 16, 0.91)";
      context.fillRect(this.canvas.width / 2 - width / 2, 120, width, 44);
      context.strokeStyle = "rgba(218, 196, 122, 0.55)";
      context.strokeRect(this.canvas.width / 2 - width / 2, 120, width, 44);
      context.fillStyle = "#e9e2c8";
      context.font = "700 15px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText(this.message, this.canvas.width / 2, 148);
      context.textAlign = "left";
    }
  }

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawWorld();
    this.drawHud();
    if (this.statusNodes.build) this.statusNodes.build.textContent = PASS04_BUILD.id.toUpperCase();
    if (this.statusNodes.audit) {
      this.statusNodes.audit.textContent = this.audit.finished ? "WALL TEST COMPLETE" : "WALL PHYSICS ACTIVE";
      this.statusNodes.audit.dataset.state = this.audit.finished ? "pass" : "active";
    }
  }
}
