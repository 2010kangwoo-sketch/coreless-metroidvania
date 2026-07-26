import { PLAYER_PHYSICS, createPlayer } from "../v3/player-physics.js";
import {
  PASS03_TIERS,
  PASS03_VIEWPORT,
  cameraTargetForPlayer,
  stepPass03Camera,
  zoneAtWorldPoint,
} from "./pass03-world-streaming.js";
import { Pass03WorldRuntime } from "./pass03-world-runtime.js";
import {
  PASS04_CHECKPOINTS,
  PASS04_SAVE,
  checkpointById,
  checkpointReached,
  checkpointRestoreState,
  createCheckpointStore,
} from "./pass04-checkpoints.js";

const FIXED_STEP = 1 / 120;

const routeProgress = (tier, x) => {
  const completedTierDistance = (tier - 1) * 16800;
  const direction = PASS03_TIERS[tier - 1].direction;
  return completedTierDistance + (direction === "east" ? x : 16800 - x);
};

export class Pass04WorldRuntime extends Pass03WorldRuntime {
  constructor(canvas, storage = window.localStorage) {
    super(canvas);
    this.checkpointStore = createCheckpointStore(storage);
    this.currentCheckpointId = "S01";
    this.recovery = null;
    this.checkpointFlash = 0;
    this.lastSaveStatus = "empty";
    this.initializePersistence();
  }

  initializePass04Audit() {
    this.audit = {
      ...this.audit,
      checkpointActivations: 0,
      checkpointWrites: 0,
      checkpointLoads: 0,
      invalidSaves: 0,
      persistenceFailures: 0,
      saveClears: 0,
      recoveryTriggers: 0,
      defeatRecoveries: 0,
      fallRecoveries: 0,
      manualRecoveries: 0,
      respawns: 0,
      recoveryFrames: 0,
      maximumRecoveryFallStep: 0,
      maximumReplayDistance: 0,
      cameraSnapsUnderFullFade: 0,
      activatedCheckpointIds: ["S01"],
    };
  }

  initializePersistence() {
    this.initializePass04Audit();
    const result = this.checkpointStore.read();
    this.lastSaveStatus = result.status;
    if (result.status === "ok") {
      this.audit.checkpointLoads += 1;
      this.currentCheckpointId = result.record.checkpointId;
      this.lastSaveStatus = "loaded";
    } else {
      this.currentCheckpointId = "S01";
      if (result.status === "invalid") this.audit.invalidSaves += 1;
      this.writeCheckpoint("S01", false);
    }
    this.placeAtCheckpoint(this.currentCheckpointId, { freshPage: true });
  }

  writeCheckpoint(checkpointId, countActivation = true) {
    const result = this.checkpointStore.write(checkpointId);
    this.audit.checkpointWrites += 1;
    if (!result.persisted) this.audit.persistenceFailures += 1;
    this.lastSaveStatus = result.persisted ? "persisted" : "memory-fallback";
    if (countActivation) this.audit.checkpointActivations += 1;
    return result;
  }

  placeAtCheckpoint(checkpointId, { freshPage = false } = {}) {
    const state = checkpointRestoreState(checkpointId);
    this.currentCheckpointId = state.checkpoint.id;
    this.currentTier = state.currentTier;
    this.player = createPlayer(state.player.x, state.player.y);
    this.player.grounded = true;
    this.lift = null;
    this.completed = false;
    if (freshPage) {
      this.started = false;
      this.elapsed = 0;
      this.streamedZoneIds = new Set();
    }
    this.activeZoneIds = new Set();
    this.visitedZoneIds = new Set(state.visitedZoneIds);
    this.camera = cameraTargetForPlayer(this.player);
    this.updateStreaming();
  }

  activateCheckpoint(checkpoint) {
    const current = checkpointById(this.currentCheckpointId);
    if (!checkpoint || checkpoint.order <= current.order) return false;
    this.currentCheckpointId = checkpoint.id;
    this.writeCheckpoint(checkpoint.id, true);
    this.audit.activatedCheckpointIds.push(checkpoint.id);
    this.checkpointFlash = 1.2;
    return true;
  }

  syncCheckpoint() {
    for (const checkpoint of PASS04_CHECKPOINTS) {
      if (
        checkpoint.order > checkpointById(this.currentCheckpointId).order &&
        checkpointReached(checkpoint, this.player, this.currentTier)
      ) {
        this.activateCheckpoint(checkpoint);
      }
    }
  }

  triggerRecovery(reason) {
    if (this.recovery || this.completed) return false;
    this.keys.delete("KeyA");
    this.keys.delete("KeyD");
    this.keys.delete("ArrowLeft");
    this.keys.delete("ArrowRight");
    this.player.vx = 0;
    this.player.vy = 0;
    this.recovery = {
      reason,
      phase: "fade-in",
      elapsed: 0,
      originTier: this.currentTier,
      originX: this.player.x,
      originY: this.player.y,
    };
    this.audit.recoveryTriggers += 1;
    if (reason === "defeat") this.audit.defeatRecoveries += 1;
    if (reason === "fall") this.audit.fallRecoveries += 1;
    if (reason === "manual") this.audit.manualRecoveries += 1;
    return true;
  }

  completeRecoveryRespawn() {
    const checkpoint = checkpointById(this.currentCheckpointId);
    const originProgress = routeProgress(
      this.recovery.originTier,
      this.recovery.originX,
    );
    const checkpointProgress = routeProgress(
      checkpoint.tier,
      checkpoint.position.x,
    );
    this.audit.maximumReplayDistance = Math.max(
      this.audit.maximumReplayDistance,
      Math.max(0, originProgress - checkpointProgress),
    );
    this.placeAtCheckpoint(this.currentCheckpointId);
    this.recovery.phase = "fade-out";
    this.recovery.elapsed = 0;
    this.audit.respawns += 1;
    this.audit.cameraSnapsUnderFullFade += 1;
  }

  updateRecovery(dt) {
    this.audit.fixedFrames += 1;
    this.audit.recoveryFrames += 1;
    if (this.recovery.phase === "fade-in") {
      this.recovery.elapsed += dt;
      if (this.recovery.reason === "fall") {
        const beforeY = this.player.y;
        this.player.y += 700 * dt;
        this.audit.maximumRecoveryFallStep = Math.max(
          this.audit.maximumRecoveryFallStep,
          this.player.y - beforeY,
        );
        const target = cameraTargetForPlayer(this.player);
        this.camera = stepPass03Camera(this.camera, target, dt);
        this.updateStreaming();
      }
      if (this.recovery.elapsed >= PASS04_SAVE.recoveryFadeInSeconds) {
        this.completeRecoveryRespawn();
      }
    } else {
      this.recovery.elapsed += dt;
      if (this.recovery.elapsed >= PASS04_SAVE.recoveryFadeOutSeconds) {
        this.recovery = null;
      }
    }
  }

  clearProgress() {
    if (!this.checkpointStore.clear()) this.audit.persistenceFailures += 1;
    this.audit.saveClears += 1;
    this.currentCheckpointId = "S01";
    this.audit.activatedCheckpointIds = ["S01"];
    this.writeCheckpoint("S01", false);
    this.placeAtCheckpoint("S01");
    this.recovery = null;
    this.checkpointFlash = 0;
  }

  onKeyDown(event) {
    if (["KeyK", "KeyF", "KeyC"].includes(event.code)) event.preventDefault();
    if (event.code === "KeyK" && !this.keys.has("KeyK")) {
      this.triggerRecovery("defeat");
    } else if (event.code === "KeyF" && !this.keys.has("KeyF")) {
      this.triggerRecovery("fall");
    } else if (event.code === "KeyR" && !this.keys.has("KeyR")) {
      event.preventDefault();
      this.triggerRecovery("manual");
    } else if (event.code === "KeyC" && !this.keys.has("KeyC")) {
      this.clearProgress();
    } else {
      super.onKeyDown(event);
      return;
    }
    this.keys.add(event.code);
  }

  update(dt) {
    if (this.recovery) {
      this.updateRecovery(dt);
      return;
    }
    super.update(dt);
    this.syncCheckpoint();
    this.checkpointFlash = Math.max(0, this.checkpointFlash - dt);
  }

  drawCheckpointMarker() {
    const checkpoint = checkpointById(this.currentCheckpointId);
    const screenX = checkpoint.position.x - this.camera.x + PLAYER_PHYSICS.width / 2;
    const screenY = checkpoint.position.y - this.camera.y - 36;
    if (
      screenX < -60 ||
      screenX > PASS03_VIEWPORT.width + 60 ||
      screenY < -80 ||
      screenY > PASS03_VIEWPORT.height + 80
    ) {
      return;
    }
    const context = this.context;
    const pulse = this.checkpointFlash > 0
      ? 1 + Math.sin(this.checkpointFlash * 20) * 0.12
      : 1;
    context.save();
    context.translate(screenX, screenY);
    context.scale(pulse, pulse);
    context.rotate(Math.PI / 4);
    context.fillStyle = "#d8c57e";
    context.fillRect(-13, -13, 26, 26);
    context.fillStyle = "#172426";
    context.fillRect(-6, -6, 12, 12);
    context.restore();
  }

  recoveryAlpha() {
    if (!this.recovery) return 0;
    if (this.recovery.phase === "fade-in") {
      return Math.min(1, this.recovery.elapsed / PASS04_SAVE.recoveryFadeInSeconds);
    }
    return Math.max(0, 1 - this.recovery.elapsed / PASS04_SAVE.recoveryFadeOutSeconds);
  }

  render() {
    super.render();
    this.drawCheckpointMarker();
    const context = this.context;
    context.fillStyle = "#03090d";
    context.fillRect(24, 24, 690, 190);
    context.strokeStyle = "rgba(143, 181, 184, 0.55)";
    context.strokeRect(24, 24, 690, 190);
    context.fillStyle = "#e9f0eb";
    context.font = "700 22px Arial";
    context.fillText("PASS 04 · CHECKPOINT AND SAVE", 44, 58);
    context.font = "16px Arial";
    context.fillStyle = "#a7bdbe";
    context.fillText("A/D MOVE · E LIFT · K DEFEAT · F FALL · R RETRY · C CLEAR", 44, 88);
    context.fillStyle = "#d8c57e";
    context.fillText(
      `CHECKPOINT ${this.currentCheckpointId} · TIER ${this.currentTier}/6 · ${this.lastSaveStatus.toUpperCase()}`,
      44,
      120,
    );
    context.fillText(
      `RESTORES ${this.audit.respawns} · SAVES ${this.audit.checkpointWrites} · ACTIVE ${this.activeZoneIds.size}/36`,
      44,
      150,
    );
    const currentZone = zoneAtWorldPoint(
      this.player.x + PLAYER_PHYSICS.width / 2,
      this.player.y + PLAYER_PHYSICS.height / 2,
    );
    context.fillStyle = "#8fa9aa";
    context.fillText(
      `${currentZone?.id ?? "RECOVERY"} · VISITED ${this.visitedZoneIds.size}/36`,
      44,
      180,
    );

    const alpha = this.recoveryAlpha();
    if (alpha > 0) {
      context.fillStyle = `rgba(2, 7, 10, ${alpha})`;
      context.fillRect(0, 0, PASS03_VIEWPORT.width, PASS03_VIEWPORT.height);
      if (alpha > 0.55) {
        context.fillStyle = `rgba(234, 216, 146, ${Math.min(1, alpha * 1.2)})`;
        context.font = "700 28px Arial";
        const label = this.recovery.reason === "fall"
          ? "RECOVERING FROM FALL"
          : this.recovery.reason === "defeat"
            ? "RECOVERING FROM DEFEAT"
            : "RETURNING TO CHECKPOINT";
        context.fillText(label, 500, 430);
        context.fillStyle = `rgba(185, 204, 200, ${Math.min(1, alpha * 1.2)})`;
        context.font = "18px Arial";
        context.fillText(`SAFE RETURN · ${this.currentCheckpointId}`, 590, 465);
      }
    }
  }

  snapshot() {
    const base = super.snapshot();
    return {
      ...base,
      checkpointId: this.currentCheckpointId,
      checkpoint: checkpointById(this.currentCheckpointId),
      recovery: this.recovery ? { ...this.recovery } : null,
      saveStatus: this.lastSaveStatus,
      saveRecord: this.checkpointStore.read().record,
      audit: { ...this.audit },
    };
  }
}
