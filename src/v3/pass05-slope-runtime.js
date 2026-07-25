import {
  PASS05_BUILD,
  PASS05_SOLIDS,
  PASS05_TRIGGERS,
  PASS05_WORLD,
} from "./pass05-slope-level.js";
import {
  PLAYER_PHYSICS,
  createCamera,
  createPlayer,
  rectangleIntersectsPlayer,
  slopeSurfaceYAt,
  stepCamera,
  stepPlayer,
} from "./player-physics.js";

const FIXED_STEP = 1 / 120;
const MAX_FRAME_DELTA = 1 / 15;

export class Pass05SlopeRuntime {
  constructor(canvas, statusNodes = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.statusNodes = statusNodes;
    this.player = createPlayer(PASS05_WORLD.spawn.x, PASS05_WORLD.spawn.y);
    this.player.grounded = true;
    this.camera = { ...createCamera(this.player), y: 250, targetY: 250 };
    this.keys = new Set();
    this.pendingJump = false;
    this.running = false;
    this.accumulator = 0;
    this.lastTime = 0;
    this.message = "완경사에서는 이동과 정지, 급경사에서는 입력 해제 미끄럼을 확인하세요";
    this.messageTimer = 6;
    this.visitedSlopes = new Set();
    this.audit = {
      fixedFrames: 0,
      slopeContacts: 0,
      slopeLandings: 0,
      slopeFrames: 0,
      jumps: 0,
      resets: 0,
      edgeCorrections: 0,
      maximumPositionStep: 0,
      maximumGroundedPositionStep: 0,
      maximumVerticalStepOnSlope: 0,
      maximumCameraStep: 0,
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
    if (event.code === "KeyR" && !event.repeat) this.reset("수동 재시작");
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
    this.player = stepPlayer(this.player, input, dt, PASS05_SOLIDS);
    const positionStep = Math.hypot(this.player.x - before.x, this.player.y - before.y);
    this.audit.maximumPositionStep = Math.max(this.audit.maximumPositionStep, positionStep);
    if (before.grounded && this.player.grounded) {
      this.audit.maximumGroundedPositionStep = Math.max(
        this.audit.maximumGroundedPositionStep,
        positionStep,
      );
    }
    if (this.player.standingSlopeId) {
      this.audit.slopeFrames += 1;
      this.audit.maximumVerticalStepOnSlope = Math.max(
        this.audit.maximumVerticalStepOnSlope,
        Math.abs(this.player.y - before.y),
      );
      if (!this.visitedSlopes.has(this.player.standingSlopeId)) {
        this.visitedSlopes.add(this.player.standingSlopeId);
        this.audit.slopeContacts += 1;
      }
    }
    if (this.player.slopeLandedThisFrame) this.audit.slopeLandings += 1;
    if (before.grounded && !this.player.grounded && this.player.vy < 0) this.audit.jumps += 1;
    if (this.player.edgeCorrectedThisFrame) this.audit.edgeCorrections += 1;

    const finish = PASS05_TRIGGERS[0];
    if (
      !this.audit.finished &&
      rectangleIntersectsPlayer(finish, this.player) &&
      this.player.x + PLAYER_PHYSICS.width / 2 >= finish.x
    ) {
      this.audit.finished = true;
      this.message = "V3 5차 경사 이동 시험 완료";
      this.messageTimer = 8;
    }

    this.camera = stepCamera(this.camera, this.player, dt, PASS05_WORLD);
    this.audit.maximumCameraStep = Math.max(
      this.audit.maximumCameraStep,
      Math.hypot(this.camera.x - beforeCamera.x, this.camera.y - beforeCamera.y),
    );
    this.audit.fixedFrames += 1;
    this.messageTimer = Math.max(0, this.messageTimer - dt);
  }

  reset(reason = "재시작") {
    this.player = createPlayer(PASS05_WORLD.spawn.x, PASS05_WORLD.spawn.y);
    this.player.grounded = true;
    this.camera = { ...createCamera(this.player), y: 250, targetY: 250 };
    this.visitedSlopes.clear();
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
    const offsetX = -(this.camera.x * 0.18) % 260;
    context.strokeStyle = "rgba(111, 157, 166, 0.14)";
    context.lineWidth = 3;
    for (let x = offsetX - 260; x < this.canvas.width + 260; x += 260) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + 110, this.canvas.height);
      context.stroke();
    }
  }

  drawSlope(item) {
    const context = this.context;
    const leftY = slopeSurfaceYAt(item, item.x);
    const rightY = slopeSurfaceYAt(item, item.x + item.width);
    context.beginPath();
    context.moveTo(item.x, leftY);
    context.lineTo(item.x + item.width, rightY);
    context.lineTo(item.x + item.width, PASS05_WORLD.height);
    context.lineTo(item.x, PASS05_WORLD.height);
    context.closePath();
    context.fillStyle = item.id === "steep-descent" ? "#5a5a50" : "#455e63";
    context.fill();
    context.strokeStyle = item.id === "steep-descent" ? "#d6bd72" : "#9fc2c7";
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(item.x, leftY);
    context.lineTo(item.x + item.width, rightY);
    context.stroke();
  }

  drawWorld() {
    const context = this.context;
    context.save();
    context.translate(-this.camera.x, -this.camera.y);
    context.fillStyle = "rgba(140, 194, 203, 0.07)";
    context.fillRect(0, 420, PASS05_WORLD.width, 550);
    context.fillStyle = "rgba(190, 214, 216, 0.52)";
    context.font = "700 24px Arial, sans-serif";
    context.fillText("비정규 개발 시험실 · 경사 접지와 제동", 75, 475);

    for (const item of PASS05_SOLIDS) {
      if (item.role === "boundary") continue;
      if (item.role === "slope") {
        this.drawSlope(item);
        continue;
      }
      const colors = {
        terrain: ["#40555d", "#849fa6"],
        rest: ["#4a665d", "#9ac7aa"],
        exit: ["#67604b", "#dfc77c"],
      };
      const [fill, edge] = colors[item.role] ?? colors.terrain;
      context.fillStyle = fill;
      context.fillRect(item.x, item.y, item.width, item.height);
      context.fillStyle = edge;
      context.fillRect(item.x, item.y, item.width, 7);
    }

    const finish = PASS05_TRIGGERS[0];
    context.fillStyle = this.audit.finished ? "rgba(224, 201, 124, 0.28)" : "rgba(224, 201, 124, 0.1)";
    context.fillRect(finish.x, finish.y, finish.width, finish.height);
    context.strokeStyle = "#dfc77c";
    context.lineWidth = 4;
    context.strokeRect(finish.x + 12, finish.y + 12, finish.width - 24, finish.height - 24);

    const centerX = this.player.x + PLAYER_PHYSICS.width / 2;
    const centerY = this.player.y + PLAYER_PHYSICS.height / 2;
    context.save();
    context.translate(centerX, centerY);
    if (this.player.standingSlopeId) context.rotate(Math.atan(this.player.slopeGrade) * 0.28);
    context.fillStyle = "#eff5ef";
    context.fillRect(
      -PLAYER_PHYSICS.width / 2,
      -PLAYER_PHYSICS.height / 2,
      PLAYER_PHYSICS.width,
      PLAYER_PHYSICS.height,
    );
    context.fillStyle = this.player.standingSlopeId ? "#e2c878" : "#9de1df";
    context.fillRect(-PLAYER_PHYSICS.width / 2, PLAYER_PHYSICS.height / 2 - 6, PLAYER_PHYSICS.width, 6);
    context.fillStyle = "#132129";
    context.fillRect(this.player.facing > 0 ? 7 : -12, -14, 5, 5);
    context.restore();
    context.restore();
  }

  drawHud() {
    const context = this.context;
    context.fillStyle = "rgba(3, 9, 13, 0.86)";
    context.fillRect(20, this.canvas.height - 58, 760, 38);
    context.fillStyle = "#b9c9cc";
    context.font = "650 12px Arial, sans-serif";
    const slopeLabel = this.player.standingSlopeId ?? "평지/공중";
    context.fillText(
      `A/D 이동 · SPACE 점프 · R 재시작 · 접지 ${slopeLabel} · 속도 ${Math.round(this.player.vx)}`,
      38,
      this.canvas.height - 34,
    );
    if (this.messageTimer > 0) {
      const width = Math.min(820, Math.max(430, this.message.length * 17));
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
    if (this.statusNodes.build) this.statusNodes.build.textContent = PASS05_BUILD.id.toUpperCase();
    if (this.statusNodes.audit) {
      this.statusNodes.audit.textContent = this.audit.finished ? "SLOPE TEST COMPLETE" : "SLOPE PHYSICS ACTIVE";
      this.statusNodes.audit.dataset.state = this.audit.finished ? "pass" : "active";
    }
  }
}
