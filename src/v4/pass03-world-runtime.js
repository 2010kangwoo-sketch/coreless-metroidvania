import { PLAYER_PHYSICS, createPlayer, stepPlayer } from "../v3/player-physics.js";
import { SCALE_CONTRACT } from "./pass01-scale-layout.js";
import {
  PASS03_STREAMING,
  PASS03_TIERS,
  PASS03_VIEWPORT,
  PASS03_ZONES,
  cameraTargetForPlayer,
  stepPass03Camera,
  streamedZonesForCamera,
  zoneAtWorldPoint,
} from "./pass03-world-streaming.js";

const FIXED_STEP = 1 / 120;
const MAX_FRAME_DELTA = 1 / 15;
const EAST_CONNECTOR_X =
  PASS03_TIERS[0].connectorX - PLAYER_PHYSICS.width / 2;
const WEST_CONNECTOR_X =
  PASS03_TIERS[1].connectorX - PLAYER_PHYSICS.width / 2;

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

const tierFloor = tierNumber => PASS03_TIERS[tierNumber - 1];

export class Pass03WorldRuntime {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.keys = new Set();
    this.pendingInteract = false;
    this.running = false;
    this.accumulator = 0;
    this.lastTime = 0;
    this.boundFrame = timestamp => this.frame(timestamp);
    this.boundKeyDown = event => this.onKeyDown(event);
    this.boundKeyUp = event => this.onKeyUp(event);
    this.reset(false);
  }

  reset(countReset = true) {
    const resets = countReset ? (this.audit?.resets ?? 0) + 1 : 0;
    const firstTier = tierFloor(1);
    this.currentTier = 1;
    this.player = createPlayer(120, firstTier.floorY - PLAYER_PHYSICS.height);
    this.player.grounded = true;
    this.lift = null;
    this.started = false;
    this.completed = false;
    this.elapsed = 0;
    this.activeZoneIds = new Set();
    this.visitedZoneIds = new Set();
    this.streamedZoneIds = new Set();
    this.camera = cameraTargetForPlayer(this.player);
    this.audit = {
      fixedFrames: 0,
      resets,
      completed: false,
      completionSeconds: null,
      tierTransitions: 0,
      maximumPositionStep: 0,
      maximumCameraStep: 0,
      maximumHorizontalCameraStep: 0,
      maximumVerticalCameraStep: 0,
      peakActiveZones: 0,
      emptyStreamFrames: 0,
      streamLoads: 0,
      streamUnloads: 0,
      streamSamples: 0,
    };
    this.updateStreaming();
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

  pauseForAudit() {
    this.running = false;
  }

  stop() {
    this.running = false;
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
  }

  onKeyDown(event) {
    if (["KeyA", "KeyD", "ArrowLeft", "ArrowRight", "KeyE", "KeyR"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "KeyE" && !this.keys.has("KeyE")) this.pendingInteract = true;
    if (event.code === "KeyR") this.reset(true);
    this.keys.add(event.code);
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
  }

  currentFloorSolid() {
    const tier = tierFloor(this.currentTier);
    return [{
      id: `tier-${this.currentTier}-floor`,
      x: -200,
      y: tier.floorY,
      width: SCALE_CONTRACT.nominalWorld.width + 400,
      height: 260,
      role: "terrain",
    }];
  }

  routeDirection() {
    return tierFloor(this.currentTier).direction;
  }

  atConnector() {
    if (this.currentTier >= PASS03_TIERS.length) return false;
    return this.routeDirection() === "east"
      ? this.player.x >= EAST_CONNECTOR_X
      : this.player.x <= WEST_CONNECTOR_X;
  }

  startLift() {
    const fromTier = tierFloor(this.currentTier);
    const toTier = tierFloor(this.currentTier + 1);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.grounded = true;
    this.lift = {
      elapsed: 0,
      duration: PASS03_STREAMING.liftDurationSeconds,
      fromY: fromTier.floorY - PLAYER_PHYSICS.height,
      toY: toTier.floorY - PLAYER_PHYSICS.height,
    };
  }

  updateLift(dt) {
    this.lift.elapsed = Math.min(this.lift.duration, this.lift.elapsed + dt);
    const progress = this.lift.elapsed / this.lift.duration;
    this.player = {
      ...this.player,
      previousX: this.player.x,
      previousY: this.player.y,
      y: this.lift.fromY + (this.lift.toY - this.lift.fromY) * progress,
      vx: 0,
      vy: 0,
      grounded: true,
    };
    if (progress >= 1) {
      this.currentTier += 1;
      this.lift = null;
      this.audit.tierTransitions += 1;
    }
  }

  updateWalking(dt) {
    const input = {
      left: this.keys.has("KeyA") || this.keys.has("ArrowLeft"),
      right: this.keys.has("KeyD") || this.keys.has("ArrowRight"),
      jumpPressed: false,
      jumpHeld: false,
    };
    this.player = stepPlayer(this.player, input, dt, this.currentFloorSolid());
    this.player.x = clamp(
      this.player.x,
      0,
      SCALE_CONTRACT.nominalWorld.width - PLAYER_PHYSICS.width,
    );
    if (this.currentTier < PASS03_TIERS.length) {
      this.player.x = this.routeDirection() === "east"
        ? Math.min(this.player.x, EAST_CONNECTOR_X)
        : Math.max(this.player.x, WEST_CONNECTOR_X);
    }
    if (this.pendingInteract && this.atConnector()) this.startLift();
  }

  updateStreaming() {
    const activeZones = streamedZonesForCamera(this.camera);
    const nextIds = new Set(activeZones.map(zone => zone.id));
    for (const id of nextIds) {
      if (!this.activeZoneIds.has(id)) this.audit.streamLoads += 1;
      this.streamedZoneIds.add(id);
    }
    for (const id of this.activeZoneIds) {
      if (!nextIds.has(id)) this.audit.streamUnloads += 1;
    }
    this.activeZoneIds = nextIds;
    this.audit.streamSamples += 1;
    this.audit.peakActiveZones = Math.max(
      this.audit.peakActiveZones,
      this.activeZoneIds.size,
    );
    if (this.activeZoneIds.size === 0) this.audit.emptyStreamFrames += 1;
  }

  update(dt) {
    const hasMovement =
      this.keys.has("KeyA") ||
      this.keys.has("KeyD") ||
      this.keys.has("ArrowLeft") ||
      this.keys.has("ArrowRight") ||
      this.pendingInteract;
    if (!this.completed && hasMovement) this.started = true;
    const beforePlayer = this.player;
    const beforeCamera = this.camera;

    if (this.lift) this.updateLift(dt);
    else if (!this.completed) this.updateWalking(dt);

    this.pendingInteract = false;
    const playerStep = Math.hypot(
      this.player.x - beforePlayer.x,
      this.player.y - beforePlayer.y,
    );
    this.audit.maximumPositionStep = Math.max(
      this.audit.maximumPositionStep,
      playerStep,
    );

    const target = cameraTargetForPlayer(this.player);
    this.camera = stepPass03Camera(this.camera, target, dt);
    const horizontalCameraStep = Math.abs(this.camera.x - beforeCamera.x);
    const verticalCameraStep = Math.abs(this.camera.y - beforeCamera.y);
    this.audit.maximumHorizontalCameraStep = Math.max(
      this.audit.maximumHorizontalCameraStep,
      horizontalCameraStep,
    );
    this.audit.maximumVerticalCameraStep = Math.max(
      this.audit.maximumVerticalCameraStep,
      verticalCameraStep,
    );
    this.audit.maximumCameraStep = Math.max(
      this.audit.maximumCameraStep,
      Math.hypot(horizontalCameraStep, verticalCameraStep),
    );

    const zone = zoneAtWorldPoint(
      this.player.x + PLAYER_PHYSICS.width / 2,
      this.player.y + PLAYER_PHYSICS.height / 2,
    );
    if (zone) this.visitedZoneIds.add(zone.id);

    if (
      !this.completed &&
      this.currentTier === PASS03_TIERS.length &&
      !this.lift &&
      this.player.x <= WEST_CONNECTOR_X
    ) {
      this.completed = true;
      this.audit.completed = true;
      this.audit.completionSeconds = this.elapsed;
    }

    this.updateStreaming();
    this.audit.fixedFrames += 1;
    if (this.started && !this.completed) this.elapsed += dt;
  }

  advanceAuditFrames(frames) {
    for (let index = 0; index < frames; index += 1) this.update(FIXED_STEP);
    this.render();
    return this.snapshot();
  }

  frame(timestamp) {
    if (!this.running) return;
    const delta = Math.min(MAX_FRAME_DELTA, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    this.accumulator += delta;
    while (this.accumulator >= FIXED_STEP) {
      this.update(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }
    this.render();
    requestAnimationFrame(this.boundFrame);
  }

  drawParallaxLayer(ratioX, ratioY, spacingX, spacingY, color, width) {
    const context = this.context;
    const offsetX = -((this.camera.x * ratioX) % spacingX);
    const offsetY = -((this.camera.y * ratioY) % spacingY);
    context.strokeStyle = color;
    context.lineWidth = width;
    for (let x = offsetX - spacingX; x < PASS03_VIEWPORT.width + spacingX; x += spacingX) {
      context.beginPath();
      context.moveTo(x, -100);
      context.lineTo(x + 260, PASS03_VIEWPORT.height + 100);
      context.stroke();
    }
    for (let y = offsetY - spacingY; y < PASS03_VIEWPORT.height + spacingY; y += spacingY) {
      context.beginPath();
      context.moveTo(-100, y);
      context.lineTo(PASS03_VIEWPORT.width + 100, y);
      context.stroke();
    }
  }

  drawWorld() {
    const context = this.context;
    context.save();
    context.translate(-this.camera.x, -this.camera.y);

    for (const zone of PASS03_ZONES) {
      if (!this.activeZoneIds.has(zone.id)) continue;
      const isCurrent = this.visitedZoneIds.has(zone.id) &&
        zoneAtWorldPoint(
          this.player.x + PLAYER_PHYSICS.width / 2,
          this.player.y + PLAYER_PHYSICS.height / 2,
        )?.id === zone.id;
      context.fillStyle = zone.tier % 2 === 1
        ? "rgba(28, 55, 57, 0.62)"
        : "rgba(25, 47, 52, 0.62)";
      context.fillRect(
        zone.bounds.x,
        zone.bounds.y,
        zone.bounds.width,
        zone.bounds.height,
      );
      context.strokeStyle = isCurrent ? "#d8c57e" : "rgba(120, 158, 160, 0.46)";
      context.lineWidth = isCurrent ? 8 : 3;
      context.strokeRect(
        zone.bounds.x + 3,
        zone.bounds.y + 3,
        zone.bounds.width - 6,
        zone.bounds.height - 6,
      );
      context.fillStyle = "#244143";
      context.fillRect(
        zone.bounds.x,
        tierFloor(zone.tier).floorY,
        zone.bounds.width,
        260,
      );
      context.fillStyle = "#83a0a0";
      context.fillRect(
        zone.bounds.x,
        tierFloor(zone.tier).floorY,
        zone.bounds.width,
        5,
      );
    }

    for (const tier of PASS03_TIERS.slice(0, -1)) {
      const next = tierFloor(tier.tier + 1);
      context.strokeStyle = "rgba(216, 197, 126, 0.62)";
      context.lineWidth = 8;
      for (const offset of [-55, 55]) {
        context.beginPath();
        context.moveTo(tier.connectorX + offset, tier.floorY + 260);
        context.lineTo(tier.connectorX + offset, next.floorY - 260);
        context.stroke();
      }
    }

    context.fillStyle = this.completed ? "#e3cd78" : "#d2ded8";
    context.fillRect(
      this.player.x,
      this.player.y,
      PLAYER_PHYSICS.width,
      PLAYER_PHYSICS.height,
    );
    context.fillStyle = "#172426";
    const eyeX = this.player.facing > 0 ? this.player.x + 28 : this.player.x + 6;
    context.fillRect(eyeX, this.player.y + 17, 5, 5);
    context.restore();
  }

  drawMiniMap() {
    const context = this.context;
    const originX = 1130;
    const originY = 36;
    const cellWidth = 38;
    const cellHeight = 22;
    context.fillStyle = "rgba(3, 9, 13, 0.9)";
    context.fillRect(originX - 24, originY - 20, 270, 198);
    context.strokeStyle = "rgba(143, 181, 184, 0.48)";
    context.strokeRect(originX - 24, originY - 20, 270, 198);
    for (const zone of PASS03_ZONES) {
      const row = 6 - zone.tier;
      const column = zone.column - 1;
      context.fillStyle = this.activeZoneIds.has(zone.id)
        ? "#d8c57e"
        : this.visitedZoneIds.has(zone.id)
          ? "#66888a"
          : "#223638";
      context.fillRect(
        originX + column * cellWidth,
        originY + row * cellHeight,
        cellWidth - 4,
        cellHeight - 4,
      );
    }
    context.fillStyle = "#9eb5b5";
    context.font = "700 14px Arial";
    context.fillText(
      `ACTIVE ${this.activeZoneIds.size}/36`,
      originX,
      originY + 154,
    );
  }

  render() {
    const context = this.context;
    context.clearRect(0, 0, PASS03_VIEWPORT.width, PASS03_VIEWPORT.height);
    const gradient = context.createLinearGradient(0, 0, 0, PASS03_VIEWPORT.height);
    gradient.addColorStop(0, "#071116");
    gradient.addColorStop(1, "#0d191c");
    context.fillStyle = gradient;
    context.fillRect(0, 0, PASS03_VIEWPORT.width, PASS03_VIEWPORT.height);
    this.drawParallaxLayer(
      PASS03_STREAMING.farParallaxX,
      PASS03_STREAMING.farParallaxY,
      620,
      420,
      "rgba(42, 75, 79, 0.18)",
      24,
    );
    this.drawParallaxLayer(
      PASS03_STREAMING.midParallaxX,
      PASS03_STREAMING.midParallaxY,
      410,
      310,
      "rgba(69, 105, 108, 0.22)",
      11,
    );
    this.drawWorld();

    context.fillStyle = "rgba(3, 9, 13, 0.9)";
    context.fillRect(24, 24, 650, 152);
    context.strokeStyle = "rgba(143, 181, 184, 0.48)";
    context.strokeRect(24, 24, 650, 152);
    context.fillStyle = "#e9f0eb";
    context.font = "700 22px Arial";
    context.fillText("PASS 03 · LARGE-WORLD STREAMING", 44, 58);
    context.font = "16px Arial";
    context.fillStyle = "#a7bdbe";
    context.fillText("A/D MOVE · E USE END LIFT · R RESET", 44, 88);
    const zone = zoneAtWorldPoint(
      this.player.x + PLAYER_PHYSICS.width / 2,
      this.player.y + PLAYER_PHYSICS.height / 2,
    );
    context.fillStyle = "#d8c57e";
    context.fillText(
      `${zone?.id ?? "LIFT"} · TIER ${this.currentTier}/6 · CAMERA ${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)}`,
      44,
      120,
    );
    context.fillText(
      `STREAM ${this.activeZoneIds.size}/36 · VISITED ${this.visitedZoneIds.size}/36`,
      44,
      150,
    );

    if (this.atConnector() && !this.lift) {
      context.fillStyle = "rgba(6, 16, 20, 0.94)";
      context.fillRect(430, 650, 540, 80);
      context.strokeStyle = "#d8c57e";
      context.strokeRect(430, 650, 540, 80);
      context.fillStyle = "#ead892";
      context.font = "700 23px Arial";
      context.fillText("PRESS E · ASCEND AND REVERSE", 490, 700);
    }
    if (this.completed) {
      context.fillStyle = "rgba(6, 16, 20, 0.94)";
      context.fillRect(430, 638, 540, 92);
      context.strokeStyle = "#d8c57e";
      context.strokeRect(430, 638, 540, 92);
      context.fillStyle = "#ead892";
      context.font = "700 24px Arial";
      context.fillText("SIX-TIER STREAMING COMPLETE", 474, 683);
      context.fillStyle = "#b6c9c5";
      context.font = "16px Arial";
      context.fillText(`${this.audit.completionSeconds.toFixed(2)} simulated seconds`, 570, 710);
    }
    this.drawMiniMap();
  }

  snapshot() {
    return {
      player: { ...this.player, abilities: { ...this.player.abilities } },
      camera: { ...this.camera },
      currentTier: this.currentTier,
      direction: this.routeDirection(),
      atConnector: this.atConnector(),
      lift: this.lift ? { ...this.lift } : null,
      started: this.started,
      completed: this.completed,
      elapsed: this.elapsed,
      activeZoneIds: [...this.activeZoneIds],
      visitedZoneIds: [...this.visitedZoneIds],
      streamedZoneIds: [...this.streamedZoneIds],
      audit: { ...this.audit },
    };
  }
}
