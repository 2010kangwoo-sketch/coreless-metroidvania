import {
  BASIC_ATTACK,
  LAB_SOLIDS,
  MOVEMENT_LAB,
  stepPlayerWithAttack,
} from "./pass02-movement-benchmark.js";
import { PLAYER_PHYSICS, createPlayer } from "../v3/player-physics.js";

const VIEWPORT = Object.freeze({ width: 1400, height: 900 });
const MAX_FRAME_DELTA = 1 / 15;
const CAMERA_HALF_LIFE = 0.1;

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

const approachCamera = (current, target, dt) => {
  const blend = 1 - Math.pow(0.5, dt / CAMERA_HALF_LIFE);
  return current + (target - current) * blend;
};

export class Pass02MovementLabRuntime {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.keys = new Set();
    this.pendingJump = false;
    this.pendingAttack = false;
    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.boundFrame = timestamp => this.frame(timestamp);
    this.boundKeyDown = event => this.onKeyDown(event);
    this.boundKeyUp = event => this.onKeyUp(event);
    this.reset(false);
  }

  reset(countReset = true) {
    const previousResets = countReset ? (this.audit?.resets ?? 0) + 1 : 0;
    this.player = createPlayer(
      MOVEMENT_LAB.spawnX,
      MOVEMENT_LAB.floorY - PLAYER_PHYSICS.height,
    );
    this.player.grounded = true;
    this.cameraX = 0;
    this.attackRemaining = 0;
    this.attackPulse = 0;
    this.started = false;
    this.completed = false;
    this.elapsed = 0;
    this.jumpStartY = this.player.y;
    this.audit = {
      fixedFrames: 0,
      completed: false,
      completionSeconds: null,
      attacks: 0,
      jumps: 0,
      resets: previousResets,
      maximumSpeed: 0,
      maximumJumpHeight: 0,
      maximumPositionStep: 0,
      maximumCameraStep: 0,
    };
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
    if (["KeyA", "KeyD", "ArrowLeft", "ArrowRight", "Space", "KeyB", "KeyR"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "Space" && !this.keys.has("Space")) this.pendingJump = true;
    if (event.code === "KeyB" && !this.keys.has("KeyB")) this.pendingAttack = true;
    if (event.code === "KeyR") this.reset(true);
    this.keys.add(event.code);
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
  }

  update(dt) {
    const moving =
      this.keys.has("KeyA") ||
      this.keys.has("KeyD") ||
      this.keys.has("ArrowLeft") ||
      this.keys.has("ArrowRight");
    if (!this.completed && (moving || this.pendingJump || this.pendingAttack)) this.started = true;

    if (this.pendingAttack && this.attackRemaining <= 0 && !this.completed) {
      this.attackRemaining = BASIC_ATTACK.totalSeconds;
      this.attackPulse = 1;
      this.audit.attacks += 1;
    }
    const input = {
      left: this.keys.has("KeyA") || this.keys.has("ArrowLeft"),
      right: this.keys.has("KeyD") || this.keys.has("ArrowRight"),
      jumpPressed: this.pendingJump,
      jumpHeld: this.keys.has("Space"),
    };
    this.pendingJump = false;
    this.pendingAttack = false;

    const before = this.player;
    this.player = stepPlayerWithAttack(
      this.player,
      input,
      dt,
      this.attackRemaining,
    );
    this.player.x = clamp(
      this.player.x,
      0,
      MOVEMENT_LAB.width - PLAYER_PHYSICS.width,
    );
    if (this.player.jumpsUsed > before.jumpsUsed) {
      this.audit.jumps += 1;
      this.jumpStartY = before.y;
    }
    this.audit.maximumJumpHeight = Math.max(
      this.audit.maximumJumpHeight,
      this.jumpStartY - this.player.y,
    );
    this.attackRemaining = Math.max(0, this.attackRemaining - dt);
    this.attackPulse = Math.max(0, this.attackPulse - dt * 6);

    const step = Math.hypot(this.player.x - before.x, this.player.y - before.y);
    this.audit.maximumPositionStep = Math.max(this.audit.maximumPositionStep, step);
    this.audit.maximumSpeed = Math.max(this.audit.maximumSpeed, Math.abs(this.player.vx));
    this.audit.fixedFrames += 1;
    if (this.started && !this.completed) this.elapsed += dt;

    if (!this.completed && this.player.x >= MOVEMENT_LAB.finishX) {
      this.completed = true;
      this.audit.completed = true;
      this.audit.completionSeconds = this.elapsed;
    }

    const lookAhead = clamp(this.player.vx * 0.3, -110, 110);
    const targetCameraX = clamp(
      this.player.x - 430 + lookAhead,
      0,
      MOVEMENT_LAB.width - VIEWPORT.width,
    );
    const beforeCamera = this.cameraX;
    this.cameraX = approachCamera(this.cameraX, targetCameraX, dt);
    this.audit.maximumCameraStep = Math.max(
      this.audit.maximumCameraStep,
      Math.abs(this.cameraX - beforeCamera),
    );
  }

  frame(timestamp) {
    if (!this.running) return;
    const delta = Math.min(MAX_FRAME_DELTA, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    this.accumulator += delta;
    while (this.accumulator >= MOVEMENT_LAB.fixedStep) {
      this.update(MOVEMENT_LAB.fixedStep);
      this.accumulator -= MOVEMENT_LAB.fixedStep;
    }
    this.render();
    requestAnimationFrame(this.boundFrame);
  }

  render() {
    const context = this.context;
    context.clearRect(0, 0, VIEWPORT.width, VIEWPORT.height);
    const gradient = context.createLinearGradient(0, 0, 0, VIEWPORT.height);
    gradient.addColorStop(0, "#09151a");
    gradient.addColorStop(1, "#111b1d");
    context.fillStyle = gradient;
    context.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

    context.save();
    context.translate(-this.cameraX, 0);
    context.fillStyle = "#1e3436";
    context.fillRect(-200, MOVEMENT_LAB.floorY, MOVEMENT_LAB.width + 400, 180);
    context.fillStyle = "#729091";
    context.fillRect(-200, MOVEMENT_LAB.floorY, MOVEMENT_LAB.width + 400, 5);

    for (const marker of [
      { x: MOVEMENT_LAB.spawnX, label: "START" },
      { x: MOVEMENT_LAB.spawnX + 1400, label: "1 SCREEN" },
      { x: MOVEMENT_LAB.finishX, label: "2 SCREENS" },
    ]) {
      context.strokeStyle = marker.x === MOVEMENT_LAB.finishX ? "#d8c57e" : "#527577";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(marker.x, 180);
      context.lineTo(marker.x, MOVEMENT_LAB.floorY);
      context.stroke();
      context.fillStyle = marker.x === MOVEMENT_LAB.finishX ? "#ead892" : "#8fb5b8";
      context.font = "700 22px Arial";
      context.fillText(marker.label, marker.x + 14, 215);
    }

    context.fillStyle = this.completed ? "#e3cd78" : "#cbd8d2";
    context.fillRect(this.player.x, this.player.y, PLAYER_PHYSICS.width, PLAYER_PHYSICS.height);
    context.fillStyle = "#1a2729";
    const eyeX = this.player.facing > 0 ? this.player.x + 28 : this.player.x + 7;
    context.fillRect(eyeX, this.player.y + 17, 5, 5);
    if (this.attackRemaining > 0) {
      context.strokeStyle = `rgba(224, 199, 113, ${0.45 + this.attackPulse * 0.45})`;
      context.lineWidth = 8;
      context.beginPath();
      const centerX = this.player.x + PLAYER_PHYSICS.width / 2;
      const centerY = this.player.y + 32;
      const start = this.player.facing > 0 ? -0.8 : Math.PI - 0.8;
      context.arc(centerX, centerY, 54, start, start + 1.6);
      context.stroke();
    }
    context.restore();

    context.fillStyle = "rgba(3, 9, 13, 0.88)";
    context.fillRect(22, 22, 560, 122);
    context.strokeStyle = "rgba(143, 181, 184, 0.5)";
    context.strokeRect(22, 22, 560, 122);
    context.fillStyle = "#e9f0eb";
    context.font = "700 22px Arial";
    context.fillText("PASS 02 · TWO-SCREEN MOVEMENT LAB", 42, 56);
    context.font = "16px Arial";
    context.fillStyle = "#a7bdbe";
    context.fillText("A/D MOVE · SPACE JUMP · B MOVING ATTACK · R RESET", 42, 86);
    context.fillStyle = "#d8c57e";
    const timeText = this.audit.completionSeconds ?? this.elapsed;
    context.fillText(
      `${timeText.toFixed(2)}s  ·  ${Math.max(0, this.player.x - MOVEMENT_LAB.spawnX).toFixed(0)} / 2800px  ·  ATTACK ${this.audit.attacks}`,
      42,
      118,
    );
    if (this.completed) {
      context.fillStyle = "rgba(6, 16, 20, 0.92)";
      context.fillRect(875, 36, 480, 90);
      context.strokeStyle = "#d8c57e";
      context.strokeRect(875, 36, 480, 90);
      context.fillStyle = "#ead892";
      context.font = "700 24px Arial";
      context.fillText(`FINISH ${this.audit.completionSeconds.toFixed(2)}s`, 905, 75);
      context.fillStyle = "#b8cac6";
      context.font = "16px Arial";
      context.fillText("Compare direct travel with the 20-second space target.", 905, 105);
    }
  }

  snapshot() {
    return {
      player: { ...this.player, abilities: { ...this.player.abilities } },
      cameraX: this.cameraX,
      elapsed: this.elapsed,
      started: this.started,
      completed: this.completed,
      attackRemaining: this.attackRemaining,
      audit: { ...this.audit },
    };
  }
}
