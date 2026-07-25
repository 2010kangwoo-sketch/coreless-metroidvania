import {
  PASS02_BUILD,
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
    this.message = "A/D로 이동하고 SPACE로 점프하세요";
    this.messageTimer = 4;
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
    this.player = stepPlayer(this.player, input, dt, PASS02_SOLIDS);

    if (this.player.jumpsUsed > before.jumpsUsed) {
      this.audit.jumps += 1;
      if (this.player.jumpsUsed === 2) this.audit.doubleJumps += 1;
    }
    if (this.player.landedThisFrame && !before.grounded) this.audit.landings += 1;

    for (const trigger of PASS02_TRIGGERS) {
      if (!rectangleIntersectsPlayer(trigger, this.player)) continue;
      if (trigger.type === "ability" && !this.player.abilities.doubleJump) {
        this.player.abilities.doubleJump = true;
        this.audit.doubleJumpUnlocked = true;
        this.message = "공명 날개 획득 · 공중에서 SPACE를 한 번 더 누르세요";
        this.messageTimer = 5;
      }
      if (trigger.type === "finish" && !this.audit.finished) {
        this.audit.finished = true;
        this.message = "V3 2차 회색박스 도착 · 첫 조작 구간 완료";
        this.messageTimer = 8;
      }
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

    this.camera = stepCamera(this.camera, this.player, dt, PASS02_WORLD);
    const cameraStep = Math.hypot(this.camera.x - beforeCamera.x, this.camera.y - beforeCamera.y);
    this.audit.maximumCameraStep = Math.max(this.audit.maximumCameraStep, cameraStep);
    this.audit.maximumHorizontalSpeed = Math.max(this.audit.maximumHorizontalSpeed, Math.abs(this.player.vx));
    this.audit.fixedFrames += 1;
    this.messageTimer = Math.max(0, this.messageTimer - dt);
  }

  reset(reason = "재시작") {
    const keepAbility = this.player.abilities.doubleJump;
    const spawn = this.currentRoom === "r03"
      ? { x: 3260, y: PASS02_WORLD.spawn.y }
      : PASS02_WORLD.spawn;
    this.player = createPlayer(spawn.x, spawn.y);
    this.player.grounded = true;
    this.player.abilities.doubleJump = keepAbility;
    this.camera = createCamera(this.player);
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
    context.save();
    context.translate(playerCenterX, playerCenterY);
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
    context.fillRect(20, this.canvas.height - 54, 485, 34);
    context.fillStyle = "#b9c9cc";
    context.font = "650 12px Arial, sans-serif";
    context.fillText("A/D 이동 · SPACE 가변 점프/이중 점프 · R 재시작", 36, this.canvas.height - 32);

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
    if (this.statusNodes.build) this.statusNodes.build.textContent = `${PASS02_BUILD.id.toUpperCase()} · ${this.currentRoom.toUpperCase()}`;
    if (this.statusNodes.audit) {
      this.statusNodes.audit.textContent = this.audit.finished ? "FIRST CHAPTER COMPLETE" : "PHYSICS ACTIVE";
      this.statusNodes.audit.dataset.state = this.audit.finished ? "pass" : "active";
    }
  }
}
