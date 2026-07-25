import {
  PASS02_ROOM_SUMMARIES,
  PASS02_SOLIDS,
  PASS02_TRIGGERS,
  PASS02_WORLD,
  roomAtX,
} from "./pass02-graybox.js";
import {
  CAMERA_PHYSICS,
  PLAYER_PHYSICS,
  createCamera,
  createPlayer,
  rectangleIntersectsPlayer,
  stepCamera,
  stepPlayer,
} from "./player-physics.js";
import { PASS03_MOTION_VISUAL } from "./pass03-feel.js";
import {
  PASS06_BUILD,
  PASS06_CHECKPOINTS,
  PASS06_GATE,
  PASS06_JUMP_TARGETS,
  PASS06_LESSONS,
  PASS06_OPTIONAL_REWARD,
  canFinishTutorial,
  createTutorialProgress,
  requiredLessonCount,
  roomTwoGateOpen,
  tutorialInstruction,
} from "./pass06-tutorial.js";

const FIXED_STEP = 1 / 120;
const MAX_FRAME_DELTA = 1 / 15;

export class Pass02Runtime {
  constructor(canvas, statusNodes = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.statusNodes = statusNodes;
    this.player = createPlayer(PASS02_WORLD.spawn.x, PASS02_WORLD.spawn.y);
    this.player.grounded = true;
    this.camera = createCamera(this.player);
    this.keys = new Set();
    this.pendingJump = false;
    this.running = false;
    this.accumulator = 0;
    this.lastTime = 0;
    this.currentRoom = "r01";
    this.tutorialProgress = createTutorialProgress();
    this.currentCheckpointId = "arrival";
    this.activeJumpProfile = null;
    this.currentInstructionId = "move";
    this.optionalRewardCollected = false;
    this.finishBlockLatched = false;
    this.message = tutorialInstruction(this.tutorialProgress, this.currentRoom).text;
    this.messageTimer = 4;
    this.motionVisual = { landing: 0, takeoff: 0 };
    this.audit = {
      fixedFrames: 0,
      maximumHorizontalSpeed: 0,
      maximumCameraStep: 0,
      landings: 0,
      jumps: 0,
      doubleJumps: 0,
      roomTransitions: 0,
      resets: 0,
      doubleJumpUnlocked: false,
      finished: false,
      directionReversals: 0,
      edgeCorrections: 0,
      tutorialLessonsCompleted: 0,
      tutorialPromptsShown: 1,
      checkpointActivations: 0,
      gateOpened: false,
      shortJumpHeight: null,
      fullJumpHeight: null,
      optionalRewardCollected: false,
      finishBlocked: 0,
      maximumPositionStep: 0,
      maximumGroundedPositionStep: 0,
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

  activeSolids() {
    return roomTwoGateOpen(this.tutorialProgress)
      ? PASS02_SOLIDS
      : [...PASS02_SOLIDS, PASS06_GATE];
  }

  markTutorialLesson(id) {
    if (this.tutorialProgress[id]) return false;
    this.tutorialProgress[id] = true;
    this.audit.tutorialLessonsCompleted = requiredLessonCount(this.tutorialProgress);
    return true;
  }

  syncTutorialInstruction() {
    const instruction = tutorialInstruction(this.tutorialProgress, this.currentRoom);
    if (instruction.id === this.currentInstructionId) return;
    this.currentInstructionId = instruction.id;
    this.audit.tutorialPromptsShown += 1;
    this.message = instruction.text;
    this.messageTimer = instruction.id === "complete" ? 8 : 4.5;
  }

  activateCheckpoint() {
    for (const checkpoint of PASS06_CHECKPOINTS) {
      if (this.player.x < checkpoint.activateX || checkpoint.id === this.currentCheckpointId) continue;
      const currentIndex = PASS06_CHECKPOINTS.findIndex(item => item.id === this.currentCheckpointId);
      const nextIndex = PASS06_CHECKPOINTS.findIndex(item => item.id === checkpoint.id);
      if (nextIndex <= currentIndex) continue;
      if (checkpoint.id === "altar" && !this.tutorialProgress.room2Gate) continue;
      this.currentCheckpointId = checkpoint.id;
      this.audit.checkpointActivations += 1;
    }
  }

  inputSnapshot(override = null) {
    if (override) return override;
    return {
      left: this.keys.has("KeyA") || this.keys.has("ArrowLeft"),
      right: this.keys.has("KeyD") || this.keys.has("ArrowRight"),
      jumpPressed: this.pendingJump,
      jumpHeld: this.keys.has("Space"),
    };
  }

  update(dt, overrideInput = null) {
    const input = this.inputSnapshot(overrideInput);
    this.pendingJump = false;
    const before = this.player;
    const beforeCamera = this.camera;
    this.player = stepPlayer(this.player, input, dt, this.activeSolids());
    const positionStep = Math.hypot(
      this.player.x - before.x,
      this.player.y - before.y,
    );
    this.audit.maximumPositionStep = Math.max(
      this.audit.maximumPositionStep,
      positionStep,
    );
    if (before.grounded && this.player.grounded) {
      this.audit.maximumGroundedPositionStep = Math.max(
        this.audit.maximumGroundedPositionStep,
        positionStep,
      );
    }

    if (this.player.jumpsUsed > before.jumpsUsed) {
      this.audit.jumps += 1;
      if (this.player.jumpsUsed === 2) this.audit.doubleJumps += 1;
      this.motionVisual.takeoff = 1;
      if (this.player.jumpsUsed === 1) {
        this.activeJumpProfile = {
          room: this.currentRoom,
          startY: before.y,
          minimumY: this.player.y,
        };
      }
      if (this.player.jumpsUsed === 2 && this.player.abilities.doubleJump) {
        this.markTutorialLesson("doubleJumpUse");
      }
    }
    if (this.activeJumpProfile) {
      this.activeJumpProfile.minimumY = Math.min(
        this.activeJumpProfile.minimumY,
        this.player.y,
      );
    }
    if (this.player.landedThisFrame && !before.grounded) {
      this.audit.landings += 1;
      this.motionVisual.landing = 1;
      if (this.activeJumpProfile?.room === "r02") {
        const jumpHeight = this.activeJumpProfile.startY - this.activeJumpProfile.minimumY;
        if (
          jumpHeight >= PASS06_JUMP_TARGETS.shortHeight[0] &&
          jumpHeight <= PASS06_JUMP_TARGETS.shortHeight[1]
        ) {
          this.audit.shortJumpHeight = jumpHeight;
          this.markTutorialLesson("shortJump");
        }
        if (
          jumpHeight >= PASS06_JUMP_TARGETS.fullHeight[0] &&
          jumpHeight <= PASS06_JUMP_TARGETS.fullHeight[1]
        ) {
          this.audit.fullJumpHeight = jumpHeight;
          this.markTutorialLesson("fullJump");
        }
      }
      this.activeJumpProfile = null;
    }
    if (this.player.edgeCorrectedThisFrame) this.audit.edgeCorrections += 1;
    const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (axis !== 0 && before.vx !== 0 && Math.sign(before.vx) !== axis && Math.sign(this.player.vx) === axis) {
      this.audit.directionReversals += 1;
    }
    this.motionVisual.landing = Math.max(
      0,
      this.motionVisual.landing - dt / PASS03_MOTION_VISUAL.landingRecoverySeconds,
    );
    this.motionVisual.takeoff = Math.max(
      0,
      this.motionVisual.takeoff - dt / PASS03_MOTION_VISUAL.takeoffRecoverySeconds,
    );

    for (const trigger of PASS02_TRIGGERS) {
      if (!rectangleIntersectsPlayer(trigger, this.player)) continue;
      if (trigger.type === "ability" && !this.player.abilities.doubleJump) {
        this.player.abilities.doubleJump = true;
        this.audit.doubleJumpUnlocked = true;
        this.markTutorialLesson("doubleJumpUnlock");
        this.message = "공명 날개 획득 · 공중에서 SPACE를 한 번 더 누르세요";
        this.messageTimer = 5;
      }
      if (trigger.type === "finish" && !this.audit.finished) {
        if (canFinishTutorial(this.tutorialProgress)) {
          this.markTutorialLesson("finish");
          this.audit.finished = true;
          this.message = "V3 튜토리얼 1~3번 방 완료";
          this.messageTimer = 8;
        } else if (!this.finishBlockLatched) {
          this.finishBlockLatched = true;
          this.audit.finishBlocked += 1;
          this.message = tutorialInstruction(this.tutorialProgress, this.currentRoom).text;
          this.messageTimer = 4;
        }
      }
    }

    if (
      !this.optionalRewardCollected &&
      rectangleIntersectsPlayer(PASS06_OPTIONAL_REWARD, this.player)
    ) {
      this.optionalRewardCollected = true;
      this.audit.optionalRewardCollected = true;
      this.message = "숙련의 인장 획득 · 필수 진행과 무관한 선택 보상";
      this.messageTimer = 4;
    }

    if (this.player.x >= 430) this.markTutorialLesson("move");
    if (
      this.player.x >= 1450 &&
      this.audit.jumps >= PASS06_JUMP_TARGETS.roomOneMinimumJumps
    ) {
      this.markTutorialLesson("basicJumps");
    }
    this.audit.gateOpened = roomTwoGateOpen(this.tutorialProgress);
    if (this.player.x >= 3200 && this.audit.gateOpened) {
      this.markTutorialLesson("room2Gate");
    }

    if (this.player.y > PASS02_WORLD.height + 180) this.reset("낙하 회수");

    const nextRoom = roomAtX(this.player.x + PLAYER_PHYSICS.width / 2).id;
    if (nextRoom !== this.currentRoom) {
      this.currentRoom = nextRoom;
      this.audit.roomTransitions += 1;
      const summary = PASS02_ROOM_SUMMARIES.find(room => room.id === nextRoom);
      this.message = `${summary.name} · ${summary.mechanic}`;
      this.messageTimer = 3;
    }
    this.activateCheckpoint();
    this.syncTutorialInstruction();

    this.camera = stepCamera(this.camera, this.player, dt, PASS02_WORLD);
    const cameraStep = Math.hypot(this.camera.x - beforeCamera.x, this.camera.y - beforeCamera.y);
    this.audit.maximumCameraStep = Math.max(this.audit.maximumCameraStep, cameraStep);
    this.audit.maximumHorizontalSpeed = Math.max(this.audit.maximumHorizontalSpeed, Math.abs(this.player.vx));
    this.audit.fixedFrames += 1;
    this.messageTimer = Math.max(0, this.messageTimer - dt);
  }

  reset(reason = "재시작") {
    const keepAbility = this.player.abilities.doubleJump;
    const checkpoint = PASS06_CHECKPOINTS.find(item => item.id === this.currentCheckpointId) ??
      PASS06_CHECKPOINTS[0];
    this.player = createPlayer(checkpoint.x, checkpoint.y);
    this.player.grounded = true;
    this.player.abilities.doubleJump = keepAbility;
    this.camera = createCamera(this.player);
    this.currentRoom = checkpoint.room;
    this.activeJumpProfile = null;
    this.finishBlockLatched = false;
    this.audit.resets += 1;
    this.message = reason;
    this.messageTimer = 2;
  }

  advance(seconds, inputProvider = null) {
    const frames = Math.max(0, Math.round(seconds / FIXED_STEP));
    for (let index = 0; index < frames; index += 1) {
      const input = inputProvider
        ? inputProvider(index, this.player)
        : { left: false, right: false, jumpPressed: false, jumpHeld: false };
      this.update(FIXED_STEP, input);
    }
    this.draw();
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

  drawParallax() {
    const context = this.context;
    const cameraX = this.camera.x;
    const gradient = context.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#0b1820");
    gradient.addColorStop(1, "#071015");
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    context.save();
    context.translate(-(cameraX * 0.12) % 360, 0);
    context.fillStyle = "#10242c";
    for (let x = -360; x < this.canvas.width + 720; x += 360) {
      context.fillRect(x + 40, 150, 190, 530);
      context.fillStyle = "#132c35";
      context.fillRect(x + 72, 215, 126, 390);
      context.fillStyle = "#10242c";
    }
    context.restore();

    context.save();
    context.translate(-(cameraX * 0.28) % 270, 0);
    context.strokeStyle = "rgba(104, 145, 154, 0.2)";
    context.lineWidth = 2;
    for (let x = -270; x < this.canvas.width + 540; x += 270) {
      context.beginPath();
      context.moveTo(x, 90);
      context.lineTo(x + 75, 680);
      context.stroke();
    }
    context.restore();
  }

  drawWorld() {
    const context = this.context;
    context.save();
    context.translate(-this.camera.x, -this.camera.y);

    for (const room of PASS02_ROOM_SUMMARIES) {
      context.strokeStyle = "rgba(141, 194, 204, 0.22)";
      context.lineWidth = 3;
      context.strokeRect(room.x + 2, 2, room.width - 4, PASS02_WORLD.height - 4);
      context.fillStyle = "rgba(144, 190, 198, 0.08)";
      context.font = "700 28px Arial, sans-serif";
      context.fillText(`${room.id.toUpperCase()} · ${room.name}`, room.x + 48, 95);
      context.font = "600 15px Arial, sans-serif";
      context.fillStyle = "rgba(170, 205, 210, 0.45)";
      context.fillText(room.mechanic, room.x + 50, 122);
    }

    for (const solid of PASS02_SOLIDS) {
      if (solid.role === "boundary") continue;
      const roleColors = {
        practice: ["#536b72", "#a8c3c7"],
        optional: ["#5f5c4e", "#d8c57e"],
        ability: ["#355b62", "#9ce1df"],
        "ability-test": ["#4d6570", "#b3d8df"],
        recovery: ["#526960", "#9bc6ab"],
        threshold: ["#5b625f", "#b8c5c0"],
        ceiling: ["#394d55", "#728e96"],
        terrain: ["#40555d", "#849fa6"],
      };
      const [fill, edge] = roleColors[solid.role] ?? roleColors.terrain;
      context.fillStyle = fill;
      context.fillRect(solid.x, solid.y, solid.width, solid.height);
      context.fillStyle = edge;
      context.fillRect(solid.x, solid.y, solid.width, Math.min(7, solid.height));
      context.strokeStyle = "rgba(9, 20, 25, 0.55)";
      context.lineWidth = 2;
      for (let x = solid.x + 24; x < solid.x + solid.width; x += 56) {
        context.beginPath();
        context.moveTo(x, solid.y + 10);
        context.lineTo(Math.min(x + 26, solid.x + solid.width), solid.y + Math.min(36, solid.height));
        context.stroke();
      }
    }

    if (!roomTwoGateOpen(this.tutorialProgress)) {
      context.fillStyle = "rgba(77, 93, 99, 0.92)";
      context.fillRect(PASS06_GATE.x, PASS06_GATE.y, PASS06_GATE.width, PASS06_GATE.height);
      context.fillStyle = "#d8c57e";
      for (let y = PASS06_GATE.y + 34; y < PASS06_GATE.y + PASS06_GATE.height; y += 70) {
        context.fillRect(PASS06_GATE.x + 8, y, PASS06_GATE.width - 16, 6);
      }
      context.fillStyle = "#e8dfbf";
      context.font = "700 14px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText("점프 확인문", PASS06_GATE.x + PASS06_GATE.width / 2, PASS06_GATE.y + 26);
      context.textAlign = "left";
    }

    if (!this.optionalRewardCollected) {
      const reward = PASS06_OPTIONAL_REWARD;
      context.fillStyle = "rgba(226, 199, 112, 0.24)";
      context.fillRect(reward.x, reward.y, reward.width, reward.height);
      context.strokeStyle = "#dfc77c";
      context.lineWidth = 4;
      context.strokeRect(reward.x + 10, reward.y + 10, reward.width - 20, reward.height - 20);
      context.fillStyle = "#f0df9c";
      context.font = "700 13px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText("숙련 인장", reward.x + reward.width / 2, reward.y + 47);
      context.textAlign = "left";
    }

    const altar = PASS02_TRIGGERS.find(trigger => trigger.type === "ability");
    context.fillStyle = this.player.abilities.doubleJump ? "rgba(115, 181, 179, 0.2)" : "rgba(157, 225, 221, 0.34)";
    context.fillRect(altar.x, altar.y, altar.width, altar.height);
    context.strokeStyle = "#9de1df";
    context.lineWidth = 4;
    context.strokeRect(altar.x + 35, altar.y + 28, altar.width - 70, altar.height - 45);
    context.fillStyle = "#dff7f2";
    context.font = "700 18px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(this.player.abilities.doubleJump ? "공명 완료" : "공명 날개", altar.x + altar.width / 2, altar.y + 88);
    context.textAlign = "left";

    const finish = PASS02_TRIGGERS.find(trigger => trigger.type === "finish");
    context.fillStyle = this.audit.finished ? "rgba(225, 201, 122, 0.28)" : "rgba(225, 201, 122, 0.12)";
    context.fillRect(finish.x, finish.y, finish.width, finish.height);
    context.strokeStyle = "#dfc77c";
    context.lineWidth = 4;
    context.strokeRect(finish.x + 30, finish.y + 20, finish.width - 60, finish.height - 40);

    const playerCenterX = this.player.x + PLAYER_PHYSICS.width / 2;
    const playerCenterY = this.player.y + PLAYER_PHYSICS.height / 2;
    const airborneStretch = this.player.grounded
      ? 0
      : Math.min(1, Math.abs(this.player.vy) / PLAYER_PHYSICS.maximumFallSpeed) *
        PASS03_MOTION_VISUAL.fallingStretch;
    const scaleX =
      1 +
      this.motionVisual.landing * PASS03_MOTION_VISUAL.landingSquash -
      this.motionVisual.takeoff * PASS03_MOTION_VISUAL.takeoffStretch -
      airborneStretch * 0.45;
    const scaleY =
      1 -
      this.motionVisual.landing * PASS03_MOTION_VISUAL.landingSquash +
      this.motionVisual.takeoff * PASS03_MOTION_VISUAL.takeoffStretch +
      airborneStretch;
    context.save();
    context.translate(playerCenterX, playerCenterY);
    context.scale(scaleX, scaleY);
    context.fillStyle = "#eff5ef";
    context.fillRect(-PLAYER_PHYSICS.width / 2, -PLAYER_PHYSICS.height / 2, PLAYER_PHYSICS.width, PLAYER_PHYSICS.height);
    context.fillStyle = "#132129";
    context.fillRect(this.player.facing > 0 ? 7 : -12, -14, 5, 5);
    context.fillStyle = this.player.abilities.doubleJump ? "#9de1df" : "#82959a";
    context.fillRect(-PLAYER_PHYSICS.width / 2 - 5, 8, PLAYER_PHYSICS.width + 10, 8);
    context.restore();
    context.restore();
  }

  drawHud() {
    const context = this.context;
    context.fillStyle = "rgba(3, 9, 13, 0.82)";
    context.fillRect(20, this.canvas.height - 54, 520, 34);
    context.fillStyle = "#b9c9cc";
    context.font = "650 12px Arial, sans-serif";
    context.fillText("A/D 이동 · SPACE 가변 점프/이중 점프 · R 재시작", 36, this.canvas.height - 32);
    const lessonCount = requiredLessonCount(this.tutorialProgress);
    context.fillStyle = "rgba(3, 9, 13, 0.82)";
    context.fillRect(this.canvas.width - 230, this.canvas.height - 54, 210, 34);
    context.fillStyle = "#d8c57e";
    context.textAlign = "center";
    context.fillText(
      `튜토리얼 ${lessonCount}/${PASS06_LESSONS.length} · 체크포인트 ${this.currentCheckpointId}`,
      this.canvas.width - 125,
      this.canvas.height - 32,
    );
    context.textAlign = "left";

    if (this.messageTimer > 0) {
      const width = Math.min(680, Math.max(330, this.message.length * 17));
      context.fillStyle = "rgba(4, 12, 16, 0.9)";
      context.fillRect(this.canvas.width / 2 - width / 2, 130, width, 44);
      context.strokeStyle = "rgba(218, 196, 122, 0.55)";
      context.strokeRect(this.canvas.width / 2 - width / 2, 130, width, 44);
      context.fillStyle = "#e9e2c8";
      context.font = "700 15px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText(this.message, this.canvas.width / 2, 158);
      context.textAlign = "left";
    }
  }

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawParallax();
    this.drawWorld();
    this.drawHud();
    if (this.statusNodes.build) this.statusNodes.build.textContent = `${PASS06_BUILD.id.toUpperCase()} · ${this.currentRoom.toUpperCase()}`;
    if (this.statusNodes.audit) {
      this.statusNodes.audit.textContent = this.audit.finished ? "TUTORIAL COMPLETE" : "CANONICAL TUTORIAL ACTIVE";
      this.statusNodes.audit.dataset.state = this.audit.finished ? "pass" : "active";
    }
  }
}
