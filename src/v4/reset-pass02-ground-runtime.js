import {
  RESET_GROUND_INPUTS,
  RESET_GROUND_MOVEMENT,
  RESET_PASS02_LAB,
  createResetGroundPlayer,
  resolveGroundDirection,
  stepResetGroundPlayer,
} from "./reset-pass02-ground-movement.js";

const MAX_FRAME_DELTA = 1 / 15;

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

const rounded = value => Number(value.toFixed(4));

export class ResetPass02GroundRuntime {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.keys = new Set();
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
    this.player = createResetGroundPlayer();
    this.keys.clear();
    this.simulationSeconds = 0;
    this.lastDirection = 0;
    this.activeAcceleration = null;
    this.activeStop = null;
    this.activeReversal = null;
    this.audit = {
      fixedFrames: 0,
      resets,
      keyDowns: 0,
      keyUps: 0,
      repeatedKeyDowns: 0,
      maximumPositionStep: 0,
      boundaryContacts: 0,
      facingChanges: 0,
      stateSequence: ["idle"],
      keyEvents: [],
      accelerationSamples: [],
      stopSamples: [],
      reversalSamples: [],
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
    if (!RESET_GROUND_INPUTS.includes(event.code)) return;
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
    this.audit.keyDowns += 1;
    this.audit.keyEvents.push({
      type: "down",
      code: event.code,
      at: rounded(this.simulationSeconds),
      x: rounded(this.player.x),
      vx: rounded(this.player.vx),
    });
  }

  onKeyUp(event) {
    if (!RESET_GROUND_INPUTS.includes(event.code)) return;
    event.preventDefault();
    if (!this.keys.delete(event.code)) return;
    this.audit.keyUps += 1;
    this.audit.keyEvents.push({
      type: "up",
      code: event.code,
      at: rounded(this.simulationSeconds),
      x: rounded(this.player.x),
      vx: rounded(this.player.vx),
    });
  }

  currentInput() {
    return {
      left: this.keys.has("KeyA") || this.keys.has("ArrowLeft"),
      right: this.keys.has("KeyD") || this.keys.has("ArrowRight"),
    };
  }

  beginMeasurements(direction) {
    const speed = Math.abs(this.player.vx);
    const speedRatio = speed / RESET_GROUND_MOVEMENT.maximumRunSpeed;
    if (
      direction !== 0 &&
      this.lastDirection === 0 &&
      speed <= RESET_GROUND_MOVEMENT.stopSpeedEpsilon
    ) {
      this.activeAcceleration = {
        direction,
        startedAt: this.simulationSeconds,
        startX: this.player.x,
      };
    }
    if (
      direction === 0 &&
      this.lastDirection !== 0 &&
      speedRatio >= RESET_GROUND_MOVEMENT.runLoopSpeedRatio
    ) {
      this.activeStop = {
        direction: Math.sign(this.player.vx),
        startedAt: this.simulationSeconds,
        startX: this.player.x,
        startSpeed: speed,
      };
    }
    if (
      direction !== 0 &&
      this.lastDirection !== 0 &&
      direction !== this.lastDirection &&
      Math.sign(this.player.vx) === this.lastDirection &&
      speedRatio >= RESET_GROUND_MOVEMENT.runLoopSpeedRatio
    ) {
      this.activeStop = null;
      this.activeReversal = {
        direction,
        originalDirection: this.lastDirection,
        startedAt: this.simulationSeconds,
        startX: this.player.x,
        startSpeed: speed,
        furthestForwardX: this.player.x,
      };
    }
  }

  finishMeasurements() {
    const measuredSpeed =
      RESET_GROUND_MOVEMENT.maximumRunSpeed *
      RESET_GROUND_MOVEMENT.measuredSpeedRatio;
    if (
      this.activeAcceleration &&
      Math.sign(this.player.vx) === this.activeAcceleration.direction &&
      Math.abs(this.player.vx) >= measuredSpeed
    ) {
      this.audit.accelerationSamples.push({
        seconds: rounded(
          this.simulationSeconds - this.activeAcceleration.startedAt,
        ),
        distance: rounded(
          Math.abs(this.player.x - this.activeAcceleration.startX),
        ),
        endSpeed: rounded(Math.abs(this.player.vx)),
      });
      this.activeAcceleration = null;
    }
    if (this.activeStop && this.player.state === "idle") {
      this.audit.stopSamples.push({
        seconds: rounded(this.simulationSeconds - this.activeStop.startedAt),
        distance: rounded(
          Math.abs(this.player.x - this.activeStop.startX),
        ),
        startSpeed: rounded(this.activeStop.startSpeed),
      });
      this.activeStop = null;
    }
    if (this.activeReversal) {
      const signedPosition =
        this.player.x * this.activeReversal.originalDirection;
      const signedFurthest =
        this.activeReversal.furthestForwardX *
        this.activeReversal.originalDirection;
      if (signedPosition > signedFurthest) {
        this.activeReversal.furthestForwardX = this.player.x;
      }
      if (
        Math.sign(this.player.vx) === this.activeReversal.direction &&
        Math.abs(this.player.vx) >= measuredSpeed
      ) {
        this.audit.reversalSamples.push({
          seconds: rounded(
            this.simulationSeconds - this.activeReversal.startedAt,
          ),
          forwardOvershoot: rounded(Math.abs(
            this.activeReversal.furthestForwardX -
            this.activeReversal.startX,
          )),
          netDisplacement: rounded(
            this.player.x - this.activeReversal.startX,
          ),
          startSpeed: rounded(this.activeReversal.startSpeed),
          endSpeed: rounded(this.player.vx),
        });
        this.activeReversal = null;
      }
    }
  }

  update(dt) {
    const input = this.currentInput();
    const direction = resolveGroundDirection(input);
    this.beginMeasurements(direction);
    const before = this.player;
    const next = stepResetGroundPlayer(before, input, dt);
    const minimumX = RESET_PASS02_LAB.leftBoundary;
    const maximumX =
      RESET_PASS02_LAB.rightBoundary - RESET_GROUND_MOVEMENT.playerWidth;
    const clampedX = clamp(next.x, minimumX, maximumX);
    if (clampedX !== next.x) {
      next.x = clampedX;
      next.vx = 0;
      next.state = "idle";
      this.audit.boundaryContacts += 1;
    }
    this.player = next;
    if (before.facing !== next.facing) this.audit.facingChanges += 1;
    if (this.audit.stateSequence.at(-1) !== next.state) {
      this.audit.stateSequence.push(next.state);
    }
    this.audit.maximumPositionStep = Math.max(
      this.audit.maximumPositionStep,
      Math.abs(next.x - before.x),
    );
    this.audit.fixedFrames += 1;
    this.simulationSeconds += dt;
    this.finishMeasurements();
    this.lastDirection = direction;
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

  drawGuide(x, title, detail) {
    const context = this.context;
    context.strokeStyle = "rgba(122, 177, 180, 0.28)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, 280);
    context.lineTo(x, RESET_PASS02_LAB.floorY);
    context.stroke();
    context.fillStyle = "#b4cdca";
    context.font = '700 18px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(title, x + 14, 318);
    context.fillStyle = "#6f9294";
    context.font = '15px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(detail, x + 14, 344);
  }

  renderPlayer() {
    const context = this.context;
    const { x, y, facing, state, stridePhase } = this.player;
    const stride = state === "run-loop"
      ? Math.sin(stridePhase * Math.PI * 2) * 6
      : 0;
    const lean = state === "turn"
      ? -facing * 5
      : state === "run-start"
        ? facing * 3
        : 0;
    context.save();
    context.translate(x + RESET_GROUND_MOVEMENT.playerWidth / 2, y);
    context.fillStyle = "#e6d47f";
    context.beginPath();
    context.roundRect(-15 + lean, 8, 30, 38, 10);
    context.fill();
    context.fillStyle = "#f1e4ad";
    context.beginPath();
    context.arc(lean, 8, 14, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#e6d47f";
    context.lineWidth = 7;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-8, 43);
    context.lineTo(-9 + stride, 61);
    context.moveTo(8, 43);
    context.lineTo(9 - stride, 61);
    context.stroke();
    context.fillStyle = "#102027";
    context.beginPath();
    context.arc(facing * 5 + lean, 6, 2.8, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  render() {
    const context = this.context;
    context.clearRect(0, 0, RESET_PASS02_LAB.width, RESET_PASS02_LAB.height);
    const background = context.createLinearGradient(
      0,
      0,
      0,
      RESET_PASS02_LAB.height,
    );
    background.addColorStop(0, "#071217");
    background.addColorStop(0.58, "#0c1b20");
    background.addColorStop(1, "#10191c");
    context.fillStyle = background;
    context.fillRect(0, 0, RESET_PASS02_LAB.width, RESET_PASS02_LAB.height);

    context.fillStyle = "rgba(69, 111, 113, 0.12)";
    for (let x = 90; x < 1400; x += 190) {
      context.fillRect(x, 170, 74, RESET_PASS02_LAB.floorY - 170);
    }
    this.drawGuide(250, "01 ACCELERATE", "정지에서 달리기");
    this.drawGuide(610, "02 RELEASE", "입력을 놓고 정지");
    this.drawGuide(970, "03 REVERSE", "반대 입력으로 전환");

    context.fillStyle = "#1d3235";
    context.fillRect(0, RESET_PASS02_LAB.floorY, 1400, 170);
    context.fillStyle = "#82a4a2";
    context.fillRect(0, RESET_PASS02_LAB.floorY, 1400, 5);
    context.fillStyle = "rgba(216, 197, 126, 0.13)";
    for (let x = 80; x < 1320; x += 92) {
      context.fillRect(x, RESET_PASS02_LAB.floorY + 18, 46, 3);
    }

    this.renderPlayer();

    context.fillStyle = "rgba(2, 8, 11, 0.9)";
    context.fillRect(32, 30, 580, 128);
    context.strokeStyle = "rgba(123, 177, 180, 0.5)";
    context.strokeRect(32, 30, 580, 128);
    context.fillStyle = "#edf3ed";
    context.font = '700 23px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText("RESET PASS 02 · GROUND MOVEMENT", 54, 66);
    context.fillStyle = "#91adae";
    context.font = '16px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText("A / D 이동 · 반대 방향 전환 · R 초기화", 54, 96);
    context.fillStyle = "#e6d47f";
    context.font = '700 18px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      `${this.player.state.toUpperCase()}  ·  ${this.player.vx.toFixed(1)} px/s`,
      54,
      130,
    );

    const labels = [
      ["가속", this.audit.accelerationSamples.at(-1), "seconds"],
      ["정지", this.audit.stopSamples.at(-1), "seconds"],
      ["전환", this.audit.reversalSamples.at(-1), "seconds"],
    ];
    labels.forEach(([label, sample, key], index) => {
      const x = 660 + index * 224;
      context.fillStyle = "rgba(7, 17, 21, 0.88)";
      context.fillRect(x, 34, 196, 88);
      context.strokeStyle = sample ? "#78c4aa" : "#344b50";
      context.strokeRect(x, 34, 196, 88);
      context.fillStyle = "#77989b";
      context.font = '15px "Coreless Noto Sans KR", Arial, sans-serif';
      context.fillText(label, x + 16, 62);
      context.fillStyle = sample ? "#dbe9df" : "#536d70";
      context.font = '700 21px "Coreless Noto Sans KR", Arial, sans-serif';
      context.fillText(
        sample ? `${sample[key].toFixed(3)}s` : "측정 대기",
        x + 16,
        94,
      );
    });
  }

  snapshot() {
    return {
      player: { ...this.player },
      simulationSeconds: this.simulationSeconds,
      direction: resolveGroundDirection(this.currentInput()),
      audit: {
        ...this.audit,
        stateSequence: [...this.audit.stateSequence],
        keyEvents: this.audit.keyEvents.map(item => ({ ...item })),
        accelerationSamples: this.audit.accelerationSamples.map(item => ({
          ...item,
        })),
        stopSamples: this.audit.stopSamples.map(item => ({ ...item })),
        reversalSamples: this.audit.reversalSamples.map(item => ({
          ...item,
        })),
      },
    };
  }
}
