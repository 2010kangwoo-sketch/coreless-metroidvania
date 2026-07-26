import {
  RESET_AIR_MOVEMENT,
  RESET_PASS03_LAB,
  RESET_PASS03_SOLIDS,
  createResetAirPlayer,
  stepResetAirPlayer,
} from "./reset-pass03-air-movement.js";
import {
  RESET_GROUND_INPUTS,
  RESET_GROUND_MOVEMENT,
} from "./reset-pass02-ground-movement.js";

const MAX_FRAME_DELTA = 1 / 15;
const INPUT_CODES = Object.freeze([
  ...RESET_GROUND_INPUTS,
  "Space",
]);

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

const rounded = value => Number(value.toFixed(4));

export class ResetPass03AirRuntime {
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
    this.player = createResetAirPlayer();
    this.keys.clear();
    this.pendingJump = false;
    this.simulationSeconds = 0;
    this.activeJump = null;
    this.audit = {
      fixedFrames: 0,
      resets,
      keyDowns: 0,
      keyUps: 0,
      repeatedKeyDowns: 0,
      maximumPositionStep: 0,
      maximumHorizontalStep: 0,
      maximumVerticalStep: 0,
      boundaryContacts: 0,
      jumpStarts: 0,
      landings: 0,
      coyoteJumps: 0,
      bufferedLandingJumps: 0,
      airJumpPresses: 0,
      stateSequence: ["idle"],
      keyEvents: [],
      jumpProfiles: [],
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
      vx: rounded(this.player.vx),
      vy: rounded(this.player.vy),
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
      vx: rounded(this.player.vx),
      vy: rounded(this.player.vy),
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

  finishActiveJump(landingX, landingY) {
    if (!this.activeJump) return;
    this.audit.jumpProfiles.push({
      source: this.activeJump.source,
      height: rounded(this.activeJump.startY - this.activeJump.minimumY),
      airtimeSeconds: rounded(
        this.simulationSeconds - this.activeJump.startedAt,
      ),
      horizontalDistance: rounded(
        landingX - this.activeJump.startX,
      ),
      landingY: rounded(landingY),
    });
    this.activeJump = null;
  }

  beginJump(source, player) {
    this.activeJump = {
      source,
      startedAt: this.simulationSeconds,
      startX: player.x,
      startY: player.y,
      minimumY: player.y,
    };
    this.audit.jumpStarts += 1;
    if (source === "coyote") this.audit.coyoteJumps += 1;
    if (source === "buffered-landing") {
      this.audit.bufferedLandingJumps += 1;
    }
  }

  update(dt) {
    const input = this.currentInput();
    const before = this.player;
    let next = stepResetAirPlayer(
      before,
      input,
      dt,
      RESET_PASS03_SOLIDS,
    );
    this.pendingJump = false;

    if (next.events.jumpPressedInAir) {
      this.audit.airJumpPresses += 1;
    }
    if (next.events.landed) {
      this.audit.landings += 1;
      this.finishActiveJump(next.x, next.y);
    }
    if (next.events.jumped) {
      this.beginJump(next.events.jumpSource, next);
    }
    if (this.activeJump) {
      this.activeJump.minimumY = Math.min(
        this.activeJump.minimumY,
        next.y,
      );
    }

    const minimumX = RESET_PASS03_LAB.leftBoundary;
    const maximumX =
      RESET_PASS03_LAB.rightBoundary - RESET_GROUND_MOVEMENT.playerWidth;
    const clampedX = clamp(next.x, minimumX, maximumX);
    if (clampedX !== next.x) {
      next = { ...next, x: clampedX, vx: 0 };
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
    if (this.audit.stateSequence.at(-1) !== next.state) {
      this.audit.stateSequence.push(next.state);
    }
    this.audit.fixedFrames += 1;
    this.simulationSeconds += dt;
    this.player = next;
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

  drawHeightGuide(height, label, color) {
    const context = this.context;
    const y = RESET_PASS03_LAB.upperFloorY -
      RESET_GROUND_MOVEMENT.playerHeight - height;
    context.strokeStyle = color;
    context.setLineDash([8, 8]);
    context.beginPath();
    context.moveTo(72, y);
    context.lineTo(520, y);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = color;
    context.font =
      '700 15px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(label, 76, y - 10);
  }

  renderPlayer() {
    const context = this.context;
    const { x, y, facing, state, vy } = this.player;
    const verticalStretch = state === "rise"
      ? 4
      : state === "fall"
        ? -3
        : 0;
    const lean = Math.sign(this.player.vx) * Math.min(
      4,
      Math.abs(this.player.vx) / 100,
    );
    context.save();
    context.translate(
      x + RESET_GROUND_MOVEMENT.playerWidth / 2,
      y - verticalStretch / 2,
    );
    context.fillStyle = "#e6d47f";
    context.beginPath();
    context.roundRect(
      -15 + lean,
      9,
      30,
      38 + verticalStretch,
      10,
    );
    context.fill();
    context.fillStyle = "#f1e4ad";
    context.beginPath();
    context.arc(lean, 9, 14, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#e6d47f";
    context.lineWidth = 7;
    context.lineCap = "round";
    const legLift = state === "rise"
      ? 5
      : state === "fall"
        ? -2
        : Math.sin(this.player.stridePhase * Math.PI * 2) * 4;
    context.beginPath();
    context.moveTo(-8, 44 + verticalStretch);
    context.lineTo(-9 + legLift, 61 + verticalStretch);
    context.moveTo(8, 44 + verticalStretch);
    context.lineTo(9 - legLift, 61 + verticalStretch);
    context.stroke();
    context.fillStyle = "#102027";
    context.beginPath();
    context.arc(facing * 5 + lean, 7, 2.8, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.fillStyle = "#789699";
    context.font = '14px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      `${state.toUpperCase()} · ${vy.toFixed(0)}px/s`,
      x - 20,
      y - 18,
    );
  }

  render() {
    const context = this.context;
    context.clearRect(0, 0, RESET_PASS03_LAB.width, RESET_PASS03_LAB.height);
    const background = context.createLinearGradient(
      0,
      0,
      0,
      RESET_PASS03_LAB.height,
    );
    background.addColorStop(0, "#071217");
    background.addColorStop(0.62, "#0b1b20");
    background.addColorStop(1, "#111a1d");
    context.fillStyle = background;
    context.fillRect(0, 0, RESET_PASS03_LAB.width, RESET_PASS03_LAB.height);

    context.fillStyle = "rgba(72, 115, 116, 0.12)";
    for (let x = 50; x < 1400; x += 185) {
      context.fillRect(x, 170, 68, 650);
    }
    this.drawHeightGuide(85, "짧은 점프 약 85px", "#6fa6a7");
    this.drawHeightGuide(146, "긴 점프 약 146px", "#d6c477");

    context.fillStyle = "#20363a";
    context.fillRect(
      0,
      RESET_PASS03_LAB.upperFloorY,
      RESET_PASS03_LAB.upperFloorEndX,
      RESET_PASS03_LAB.lowerFloorY - RESET_PASS03_LAB.upperFloorY,
    );
    context.fillStyle = "#739493";
    context.fillRect(
      0,
      RESET_PASS03_LAB.upperFloorY,
      RESET_PASS03_LAB.upperFloorEndX,
      5,
    );
    context.fillStyle = "#1b3033";
    context.fillRect(
      0,
      RESET_PASS03_LAB.lowerFloorY,
      RESET_PASS03_LAB.width,
      RESET_PASS03_LAB.height - RESET_PASS03_LAB.lowerFloorY,
    );
    context.fillStyle = "#83a3a1";
    context.fillRect(
      0,
      RESET_PASS03_LAB.lowerFloorY,
      RESET_PASS03_LAB.width,
      5,
    );

    context.fillStyle = "rgba(216, 197, 126, 0.2)";
    context.beginPath();
    context.moveTo(530, RESET_PASS03_LAB.upperFloorY - 18);
    context.lineTo(560, RESET_PASS03_LAB.upperFloorY - 3);
    context.lineTo(530, RESET_PASS03_LAB.upperFloorY + 12);
    context.closePath();
    context.fill();
    context.fillStyle = "#a6945d";
    context.font =
      '700 15px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText("코요테 경계", 430, RESET_PASS03_LAB.upperFloorY - 28);

    this.renderPlayer();

    context.fillStyle = "rgba(2, 8, 11, 0.91)";
    context.fillRect(32, 28, 575, 130);
    context.strokeStyle = "rgba(123, 177, 180, 0.5)";
    context.strokeRect(32, 28, 575, 130);
    context.fillStyle = "#edf3ed";
    context.font =
      '700 23px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText("RESET PASS 03 · VARIABLE JUMP", 54, 64);
    context.fillStyle = "#91adae";
    context.font =
      '16px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      "A/D 이동 · SPACE 길이로 높이 조절 · R 초기화",
      54,
      95,
    );
    context.fillStyle = "#e6d47f";
    context.font =
      '700 17px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      `JUMP ${this.audit.jumpStarts} · LAND ${this.audit.landings} · ` +
      `COYOTE ${this.audit.coyoteJumps} · BUFFER ${this.audit.bufferedLandingJumps}`,
      54,
      129,
    );

    const profile = this.audit.jumpProfiles.at(-1);
    const cards = [
      ["최근 높이", profile ? `${profile.height.toFixed(1)}px` : "측정 대기"],
      ["공중 시간", profile
        ? `${profile.airtimeSeconds.toFixed(3)}s`
        : "측정 대기"],
      ["공중 재입력", `${this.audit.airJumpPresses}회`],
    ];
    cards.forEach(([label, value], index) => {
      const x = 650 + index * 238;
      context.fillStyle = "rgba(7, 17, 21, 0.9)";
      context.fillRect(x, 32, 208, 88);
      context.strokeStyle = "#45666a";
      context.strokeRect(x, 32, 208, 88);
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
      simulationSeconds: this.simulationSeconds,
      audit: {
        ...this.audit,
        stateSequence: [...this.audit.stateSequence],
        keyEvents: this.audit.keyEvents.map(item => ({ ...item })),
        jumpProfiles: this.audit.jumpProfiles.map(item => ({ ...item })),
      },
    };
  }
}
