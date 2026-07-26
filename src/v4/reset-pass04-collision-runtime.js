import {
  RESET_COLLISION_CONTRACT,
  RESET_PASS04_LAB,
  RESET_PASS04_SOLIDS,
  RESET_PASS04_TERRAIN,
  createResetCollisionPlayer,
  stepResetCollisionPlayer,
  terrainHeightAt,
  terrainSegmentAt,
} from "./reset-pass04-collision.js";
import {
  RESET_GROUND_INPUTS,
  RESET_GROUND_MOVEMENT,
} from "./reset-pass02-ground-movement.js";

const INPUT_CODES = Object.freeze([
  ...RESET_GROUND_INPUTS,
  "Space",
]);
const MAX_FRAME_DELTA = 1 / 15;
const CAMERA_HALF_LIFE = 0.12;

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

const rounded = value => Number(value.toFixed(4));

const damp = (current, target, dt) => {
  const blend = 1 - Math.pow(0.5, dt / CAMERA_HALF_LIFE);
  return current + (target - current) * blend;
};

export class ResetPass04CollisionRuntime {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.keys = new Set();
    this.pendingJump = false;
    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.boundFrame = timestamp => this.frame(timestamp);
    this.boundKeyDown = event => this.onKeyDown(event);
    this.boundKeyUp = event => this.onKeyUp(event);
    this.reset(false);
  }

  reset(countReset = true) {
    const resets = countReset ? (this.audit?.resets ?? 0) + 1 : 0;
    this.player = createResetCollisionPlayer();
    this.keys.clear();
    this.pendingJump = false;
    this.simulationSeconds = 0;
    this.cameraX = 0;
    this.audit = {
      fixedFrames: 0,
      resets,
      keyDowns: 0,
      keyUps: 0,
      repeatedKeyDowns: 0,
      wallHits: 0,
      groundedWallHits: 0,
      ceilingHits: 0,
      slopeAdjustments: 0,
      maximumSlopeAdjustment: 0,
      maximumHorizontalStep: 0,
      maximumVerticalStep: 0,
      maximumPositionStep: 0,
      maximumGroundWallVerticalStep: 0,
      maximumCameraStep: 0,
      boundaryContacts: 0,
      solidOverlapFrames: 0,
      automaticVaults: 0,
      slopeAirborneFrames: 0,
      visitedTerrainSegments: [],
      landedOnWallTop: false,
      completed: false,
      keyEvents: [],
      stateSequence: ["idle"],
    };
    this.visitedSegments = new Set();
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
    if (!INPUT_CODES.includes(event.code)) return;
    event.preventDefault();
    if (event.code === "KeyR" && !event.repeat) {
      this.reset(true);
      return;
    }
    if (event.repeat || this.keys.has(event.code)) {
      this.audit.repeatedKeyDowns += 1;
      return;
    }
    this.keys.add(event.code);
    if (event.code === "Space") this.pendingJump = true;
    this.audit.keyDowns += 1;
    this.audit.keyEvents.push({
      type: "down",
      code: event.code,
      at: rounded(this.simulationSeconds),
      x: rounded(this.player.x),
      y: rounded(this.player.y),
      grounded: this.player.grounded,
    });
  }

  onKeyUp(event) {
    if (!INPUT_CODES.includes(event.code)) return;
    event.preventDefault();
    if (!this.keys.delete(event.code)) return;
    this.audit.keyUps += 1;
    this.audit.keyEvents.push({
      type: "up",
      code: event.code,
      at: rounded(this.simulationSeconds),
      x: rounded(this.player.x),
      y: rounded(this.player.y),
      grounded: this.player.grounded,
    });
  }

  currentInput() {
    return {
      left: this.keys.has("KeyA") || this.keys.has("ArrowLeft"),
      right: this.keys.has("KeyD") || this.keys.has("ArrowRight"),
      jumpPressed: this.pendingJump,
      jumpHeld: this.keys.has("Space"),
    };
  }

  update(dt) {
    const input = this.currentInput();
    const before = this.player;
    let next = stepResetCollisionPlayer(before, input, dt);
    this.pendingJump = false;
    const beforeX = next.x;
    next.x = clamp(
      next.x,
      RESET_PASS04_LAB.leftBoundary,
      RESET_PASS04_LAB.rightBoundary -
        RESET_GROUND_MOVEMENT.playerWidth,
    );
    if (beforeX !== next.x) {
      next.vx = 0;
      this.audit.boundaryContacts += 1;
    }

    const horizontalStep = Math.abs(next.x - before.x);
    const verticalStep = Math.abs(next.y - before.y);
    this.audit.maximumHorizontalStep = Math.max(
      this.audit.maximumHorizontalStep,
      horizontalStep,
    );
    this.audit.maximumVerticalStep = Math.max(
      this.audit.maximumVerticalStep,
      verticalStep,
    );
    this.audit.maximumPositionStep = Math.max(
      this.audit.maximumPositionStep,
      Math.hypot(horizontalStep, verticalStep),
    );
    if (next.events.slopeAdjusted) {
      this.audit.slopeAdjustments += 1;
      this.audit.maximumSlopeAdjustment = Math.max(
        this.audit.maximumSlopeAdjustment,
        Math.abs(next.events.slopeAdjustment),
      );
    }
    if (next.events.wallHit) {
      this.audit.wallHits += 1;
      if (before.grounded) {
        this.audit.groundedWallHits += 1;
        this.audit.maximumGroundWallVerticalStep = Math.max(
          this.audit.maximumGroundWallVerticalStep,
          verticalStep,
        );
      }
    }
    if (next.events.ceilingHit) this.audit.ceilingHits += 1;
    if (next.events.autoVaulted) this.audit.automaticVaults += 1;
    const overlapsSolid = RESET_PASS04_SOLIDS.some(solid =>
      next.x + RESET_GROUND_MOVEMENT.playerWidth > solid.x &&
      next.x < solid.x + solid.width &&
      next.y + RESET_GROUND_MOVEMENT.playerHeight > solid.y &&
      next.y < solid.y + solid.height);
    if (overlapsSolid) this.audit.solidOverlapFrames += 1;

    const centerX =
      next.x + RESET_GROUND_MOVEMENT.playerWidth / 2;
    const segment = terrainSegmentAt(centerX);
    if (segment) this.visitedSegments.add(segment.id);
    if (
      centerX <= RESET_PASS04_TERRAIN.at(-1).x2 &&
      !next.grounded &&
      !input.jumpPressed &&
      this.audit.wallHits === 0
    ) {
      this.audit.slopeAirborneFrames += 1;
    }

    const wall = RESET_PASS04_SOLIDS.find(item =>
      item.id === "wall-step");
    if (
      next.grounded &&
      next.x + RESET_GROUND_MOVEMENT.playerWidth > wall.x &&
      next.x < wall.x + wall.width &&
      Math.abs(
        next.y + RESET_GROUND_MOVEMENT.playerHeight - wall.y,
      ) <= 0.01
    ) {
      this.audit.landedOnWallTop = true;
    }
    if (next.x >= RESET_PASS04_LAB.finishX) {
      this.audit.completed = true;
    }
    if (this.audit.stateSequence.at(-1) !== next.state) {
      this.audit.stateSequence.push(next.state);
    }
    this.audit.fixedFrames += 1;
    this.simulationSeconds += dt;
    this.player = next;
    this.audit.visitedTerrainSegments = [...this.visitedSegments];

    const cameraTarget = clamp(
      next.x - 420,
      0,
      RESET_PASS04_LAB.width - RESET_PASS04_LAB.viewportWidth,
    );
    const beforeCamera = this.cameraX;
    this.cameraX = damp(this.cameraX, cameraTarget, dt);
    this.audit.maximumCameraStep = Math.max(
      this.audit.maximumCameraStep,
      Math.abs(this.cameraX - beforeCamera),
    );
  }

  frame(timestamp) {
    if (!this.running) return;
    const delta = Math.min(
      MAX_FRAME_DELTA,
      Math.max(0, (timestamp - this.lastTime) / 1000),
    );
    this.lastTime = timestamp;
    this.accumulator += delta;
    while (this.accumulator >= RESET_GROUND_MOVEMENT.fixedStep) {
      this.update(RESET_GROUND_MOVEMENT.fixedStep);
      this.accumulator -= RESET_GROUND_MOVEMENT.fixedStep;
    }
    this.render();
    requestAnimationFrame(this.boundFrame);
  }

  drawTerrain() {
    const context = this.context;
    context.beginPath();
    context.moveTo(
      RESET_PASS04_TERRAIN[0].x1,
      RESET_PASS04_TERRAIN[0].y1,
    );
    for (const segment of RESET_PASS04_TERRAIN) {
      context.lineTo(segment.x2, segment.y2);
    }
    context.lineTo(RESET_PASS04_LAB.width, RESET_PASS04_LAB.height);
    context.lineTo(0, RESET_PASS04_LAB.height);
    context.closePath();
    context.fillStyle = "#1c3235";
    context.fill();

    context.beginPath();
    context.moveTo(
      RESET_PASS04_TERRAIN[0].x1,
      RESET_PASS04_TERRAIN[0].y1,
    );
    for (const segment of RESET_PASS04_TERRAIN) {
      context.lineTo(segment.x2, segment.y2);
    }
    context.strokeStyle = "#82a5a3";
    context.lineWidth = 5;
    context.stroke();
  }

  drawStructures() {
    const context = this.context;
    const wall = RESET_PASS04_SOLIDS.find(item =>
      item.id === "wall-step");
    const ceiling = RESET_PASS04_SOLIDS.find(item =>
      item.id === "overhead-beam");
    context.fillStyle = "#273c41";
    context.fillRect(wall.x, wall.y, wall.width, wall.height);
    context.fillStyle = "#bdad6e";
    context.fillRect(wall.x, wall.y, wall.width, 5);
    context.fillStyle = "#22373b";
    context.fillRect(
      ceiling.x,
      ceiling.y,
      ceiling.width,
      ceiling.height,
    );
    context.fillStyle = "#729594";
    context.fillRect(
      ceiling.x,
      ceiling.y + ceiling.height - 5,
      ceiling.width,
      5,
    );
  }

  drawPlayer() {
    const context = this.context;
    const { x, y, facing, state } = this.player;
    const lean = Math.sign(this.player.vx) * Math.min(
      4,
      Math.abs(this.player.vx) / 100,
    );
    context.save();
    context.translate(
      x + RESET_GROUND_MOVEMENT.playerWidth / 2,
      y,
    );
    context.fillStyle = "#e6d47f";
    context.beginPath();
    context.roundRect(-15 + lean, 9, 30, 38, 10);
    context.fill();
    context.fillStyle = "#f1e4ad";
    context.beginPath();
    context.arc(lean, 9, 14, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#e6d47f";
    context.lineWidth = 7;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-8, 44);
    context.lineTo(-10, 61);
    context.moveTo(8, 44);
    context.lineTo(10, 61);
    context.stroke();
    context.fillStyle = "#102027";
    context.beginPath();
    context.arc(facing * 5 + lean, 7, 2.8, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.fillStyle = "#88a4a5";
    context.font =
      '14px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(state.toUpperCase(), x - 8, y - 18);
  }

  drawMarker(x, title, detail) {
    const context = this.context;
    const floorY = terrainHeightAt(x) ?? RESET_PASS04_LAB.floorY;
    context.strokeStyle = "rgba(108, 155, 157, 0.28)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, floorY - 180);
    context.lineTo(x, floorY);
    context.stroke();
    context.fillStyle = "#d3c27a";
    context.font =
      '700 16px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(title, x + 12, floorY - 145);
    context.fillStyle = "#78989a";
    context.font =
      '14px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(detail, x + 12, floorY - 118);
  }

  render() {
    const context = this.context;
    context.clearRect(0, 0, 1400, 900);
    const background = context.createLinearGradient(0, 0, 0, 900);
    background.addColorStop(0, "#071217");
    background.addColorStop(0.65, "#0c1b20");
    background.addColorStop(1, "#111a1d");
    context.fillStyle = background;
    context.fillRect(0, 0, 1400, 900);

    context.save();
    context.translate(-this.cameraX, 0);
    context.fillStyle = "rgba(70, 112, 114, 0.11)";
    for (let x = 40; x < RESET_PASS04_LAB.width; x += 190) {
      context.fillRect(x, 120, 72, 780);
    }
    this.drawTerrain();
    this.drawStructures();
    this.drawMarker(220, "완만한 경사 진입", "8°씩 변화");
    this.drawMarker(1160, "곡면 정상", "32°에서 평지까지 완화");
    this.drawMarker(2440, "벽·모서리", "자동 상승 없음");
    this.drawMarker(2980, "낮은 천장", "머리 충돌 후 낙하");
    this.drawPlayer();
    context.restore();

    context.fillStyle = "rgba(2, 8, 11, 0.92)";
    context.fillRect(30, 28, 590, 132);
    context.strokeStyle = "rgba(123, 177, 180, 0.5)";
    context.strokeRect(30, 28, 590, 132);
    context.fillStyle = "#edf3ed";
    context.font =
      '700 23px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText("RESET PASS 04 · COLLISION LAB", 52, 64);
    context.fillStyle = "#91adae";
    context.font =
      '16px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      "A/D 이동 · SPACE 점프 · R 초기화",
      52,
      95,
    );
    context.fillStyle = "#e6d47f";
    context.font =
      '700 17px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      `SLOPE ${this.audit.visitedTerrainSegments.length}/17 · ` +
      `WALL ${this.audit.wallHits} · CEILING ${this.audit.ceilingHits}`,
      52,
      130,
    );

    const cards = [
      ["경사 최대", `${RESET_COLLISION_CONTRACT.maximumWalkableSlopeDegrees}°`],
      ["경사 변화", `${RESET_COLLISION_CONTRACT.maximumAdjacentSlopeChangeDegrees}°`],
      ["강제 턱 넘기", `${this.audit.automaticVaults}회`],
    ];
    cards.forEach(([label, value], index) => {
      const x = 655 + index * 236;
      context.fillStyle = "rgba(7, 17, 21, 0.9)";
      context.fillRect(x, 32, 205, 88);
      context.strokeStyle = "#45666a";
      context.strokeRect(x, 32, 205, 88);
      context.fillStyle = "#78999b";
      context.font =
        '14px "Coreless Noto Sans KR", Arial, sans-serif';
      context.fillText(label, x + 16, 60);
      context.fillStyle = "#dce8df";
      context.font =
        '700 20px "Coreless Noto Sans KR", Arial, sans-serif';
      context.fillText(value, x + 16, 92);
    });
  }

  snapshot() {
    return {
      player: {
        ...this.player,
        events: { ...this.player.events },
      },
      cameraX: this.cameraX,
      simulationSeconds: this.simulationSeconds,
      audit: {
        ...this.audit,
        visitedTerrainSegments: [
          ...this.audit.visitedTerrainSegments,
        ],
        keyEvents: this.audit.keyEvents.map(item => ({ ...item })),
        stateSequence: [...this.audit.stateSequence],
      },
    };
  }
}
