import { Pass02Runtime } from "./pass02-runtime.js";
import {
  createCamera,
  rectangleIntersectsPlayer,
  stepCamera,
} from "./player-physics.js";
import {
  PASS07_BUILD,
  PASS07_CHECKPOINTS,
  PASS07_GATE,
  PASS07_LIFT,
  PASS07_OPTIONAL_REWARD,
  PASS07_ROOM_SUMMARIES,
  PASS07_SOLIDS,
  PASS07_TRIGGERS,
  PASS07_WORLD,
  pass07RoomAtPosition,
} from "./pass07-layered-level.js";
import { canFinishTutorial } from "./pass06-tutorial.js";

export class Pass07LayeredRuntime extends Pass02Runtime {
  constructor(canvas, statusNodes = {}) {
    super(canvas, statusNodes, {
      world: PASS07_WORLD,
      solids: PASS07_SOLIDS,
      triggers: PASS07_TRIGGERS,
      roomSummaries: PASS07_ROOM_SUMMARIES,
      roomResolver: pass07RoomAtPosition,
      checkpoints: PASS07_CHECKPOINTS,
      gate: PASS07_GATE,
      optionalReward: PASS07_OPTIONAL_REWARD,
      build: PASS07_BUILD,
      finishMessage: "V3 1~4번 방 층상 경로 완료",
    });
    this.liftActive = false;
    this.liftX = PASS07_LIFT.x;
    this.visitedSlopes = new Set();
    this.camera.y = PASS07_WORLD.height - 900;
    this.camera.targetY = this.camera.y;
    Object.assign(this.audit, {
      tierTransitions: 0,
      liftStarted: false,
      liftCompleted: false,
      liftFrames: 0,
      liftTravel: 0,
      maximumLiftStep: 0,
      maximumLiftCameraStep: 0,
      slopeContacts: 0,
      slopeFrames: 0,
      slopeSequence: [],
      westwardRoomFourDistance: 0,
    });
  }

  update(dt, overrideInput = null) {
    if (this.liftActive) {
      this.updateLift(dt);
      return;
    }

    const beforeX = this.player.x;
    super.update(dt, overrideInput);

    const tutorialFinish = PASS07_TRIGGERS.find(trigger => trigger.type === "tutorialFinish");
    if (
      !this.tutorialProgress.finish &&
      canFinishTutorial(this.tutorialProgress) &&
      rectangleIntersectsPlayer(tutorialFinish, this.player)
    ) {
      this.markTutorialLesson("finish");
      this.message = "기초 튜토리얼 완료 · 승강기를 타고 위층으로 이동합니다";
      this.messageTimer = 5;
      this.syncTutorialInstruction();
    }

    const liftTrigger = PASS07_TRIGGERS.find(trigger => trigger.type === "tierLift");
    if (
      !this.audit.liftStarted &&
      this.tutorialProgress.finish &&
      this.player.grounded &&
      this.player.y >= PASS07_LIFT.startY - 10 &&
      rectangleIntersectsPlayer(liftTrigger, this.player)
    ) {
      this.liftActive = true;
      this.liftX = this.player.x;
      this.audit.liftStarted = true;
      this.message = "동쪽 승강축 · 위층 4번 방으로 상승";
      this.messageTimer = 4;
    }

    if (this.player.standingSlopeId) {
      this.audit.slopeFrames += 1;
      if (!this.visitedSlopes.has(this.player.standingSlopeId)) {
        this.visitedSlopes.add(this.player.standingSlopeId);
        this.audit.slopeContacts += 1;
        this.audit.slopeSequence.push(this.player.standingSlopeId);
      }
    }
    if (this.currentRoom === "r04" && this.player.x < beforeX) {
      this.audit.westwardRoomFourDistance += beforeX - this.player.x;
    }
  }

  updateLift(dt) {
    const beforeY = this.player.y;
    const beforeCamera = this.camera;
    this.pendingJump = false;
    this.player.x = this.liftX;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.grounded = true;
    this.player.standingSlopeId = null;
    this.player.y = Math.max(PASS07_LIFT.endY, this.player.y - PASS07_LIFT.speed * dt);

    const liftStep = Math.abs(this.player.y - beforeY);
    this.audit.liftFrames += 1;
    this.audit.liftTravel += liftStep;
    this.audit.maximumLiftStep = Math.max(this.audit.maximumLiftStep, liftStep);
    this.audit.maximumPositionStep = Math.max(this.audit.maximumPositionStep, liftStep);
    this.audit.maximumGroundedPositionStep = Math.max(
      this.audit.maximumGroundedPositionStep,
      liftStep,
    );

    const nextRoom = pass07RoomAtPosition({
      x: this.player.x + 19,
      y: this.player.y + 32,
    }).id;
    if (nextRoom !== this.currentRoom) {
      this.currentRoom = nextRoom;
      this.audit.roomTransitions += 1;
    }

    this.camera = stepCamera(this.camera, this.player, dt, PASS07_WORLD);
    const cameraStep = Math.hypot(
      this.camera.x - beforeCamera.x,
      this.camera.y - beforeCamera.y,
    );
    this.audit.maximumCameraStep = Math.max(this.audit.maximumCameraStep, cameraStep);
    this.audit.maximumLiftCameraStep = Math.max(
      this.audit.maximumLiftCameraStep,
      cameraStep,
    );
    this.audit.maximumVerticalCameraStep = Math.max(
      this.audit.maximumVerticalCameraStep,
      Math.abs(this.camera.y - beforeCamera.y),
    );
    this.audit.fixedFrames += 1;
    this.messageTimer = Math.max(0, this.messageTimer - dt);

    if (this.player.y <= PASS07_LIFT.endY) {
      this.player.y = PASS07_LIFT.endY;
      this.player.grounded = true;
      this.liftActive = false;
      this.audit.liftCompleted = true;
      this.audit.tierTransitions += 1;
      if (this.currentCheckpointId !== "upper-arrival") {
        this.currentCheckpointId = "upper-arrival";
        this.audit.checkpointActivations += 1;
      }
      this.currentRoom = "r04";
      this.message = "4번 방 · 왼쪽 완경사에서 속도와 제동을 확인하세요";
      this.messageTimer = 5;
    }
  }

  reset(reason = "재시작") {
    super.reset(reason);
    this.liftActive = false;
    this.liftX = this.player.x;
    this.camera = createCamera(this.player);
    if (this.currentCheckpointId === "upper-arrival") {
      this.camera.y = 0;
      this.camera.targetY = 0;
      this.currentRoom = "r04";
    } else {
      this.camera.y = PASS07_WORLD.height - 900;
      this.camera.targetY = this.camera.y;
    }
  }

  drawWorld() {
    super.drawWorld();
    const context = this.context;
    context.save();
    context.translate(-this.camera.x, -this.camera.y);
    const liftY = this.liftActive ? this.player.y + 64 : (
      this.audit.liftCompleted ? PASS07_LIFT.endY + 64 : PASS07_LIFT.startY + 64
    );
    context.fillStyle = "#4b6068";
    context.fillRect(this.liftX - 24, liftY, 116, 18);
    context.fillStyle = "#9fb9bd";
    context.fillRect(this.liftX - 24, liftY, 116, 5);
    context.strokeStyle = "rgba(221, 199, 123, 0.75)";
    context.lineWidth = 3;
    context.strokeRect(this.liftX - 20, liftY + 5, 108, 38);
    context.restore();
  }

  drawHud() {
    super.drawHud();
    const context = this.context;
    context.fillStyle = "rgba(3, 9, 13, 0.82)";
    context.fillRect(20, 20, 205, 32);
    context.fillStyle = "#9de1df";
    context.font = "700 12px Arial, sans-serif";
    const tier = this.currentRoom === "r04" ? "상층 2/5" : "하층 1/5";
    context.fillText(`${tier} · 진행 ${this.currentRoom.toUpperCase()}`, 34, 41);
  }

  draw() {
    super.draw();
    if (this.statusNodes.audit && !this.audit.finished) {
      this.statusNodes.audit.textContent = this.liftActive
        ? "TIER ASCENT ACTIVE"
        : "LAYERED ROUTE ACTIVE";
    }
  }
}
