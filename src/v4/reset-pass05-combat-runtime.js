import {
  RESET_COMBAT_CONTRACT,
  RESET_PASS05_HAZARDS,
  RESET_PASS05_LAB,
  RESET_PASS05_TARGETS,
  attackHitboxFor,
  createResetCombatScenario,
  stepResetCombatScenario,
} from "./reset-pass05-combat.js";
import {
  RESET_GROUND_INPUTS,
  RESET_GROUND_MOVEMENT,
} from "./reset-pass02-ground-movement.js";

const INPUT_CODES = Object.freeze([
  ...RESET_GROUND_INPUTS,
  "Space",
  RESET_COMBAT_CONTRACT.attackInput,
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

export class ResetPass05CombatRuntime {
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
    const resets = countReset ? (this.audit?.resets ?? 0) + 1 : 0;
    this.scenario = createResetCombatScenario();
    this.keys.clear();
    this.pendingJump = false;
    this.pendingAttack = false;
    this.simulationSeconds = 0;
    this.cameraX = 0;
    this.audit = {
      fixedFrames: 0,
      resets,
      keyDowns: 0,
      keyUps: 0,
      repeatedKeyDowns: 0,
      attackStarts: 0,
      attackActivations: 0,
      attackRecoveries: 0,
      bufferedAttacksQueued: 0,
      bufferedAttacksStarted: 0,
      attackPressesIgnored: 0,
      jumpCancels: 0,
      activeJumpBlocks: 0,
      hitCancels: 0,
      targetHits: 0,
      targetsDestroyed: 0,
      gateBlocks: 0,
      gateOpened: false,
      damageTaken: 0,
      damageIgnored: 0,
      recoveredControl: false,
      maximumAttackSpeed: 0,
      maximumHorizontalStep: 0,
      maximumVerticalStep: 0,
      maximumPositionStep: 0,
      maximumCameraStep: 0,
      boundaryContacts: 0,
      completed: false,
      keyEvents: [],
      attackPhaseSequence: ["idle"],
      motionStateSequence: ["idle"],
      targetHitEvents: [],
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
    if (event.code === RESET_COMBAT_CONTRACT.attackInput) {
      this.pendingAttack = true;
    }
    this.audit.keyDowns += 1;
    this.audit.keyEvents.push({
      type: "down",
      code: event.code,
      at: rounded(this.simulationSeconds),
      x: rounded(this.scenario.player.x),
      y: rounded(this.scenario.player.y),
      attackPhase: this.scenario.player.attack.phase,
      health: this.scenario.player.health,
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
      x: rounded(this.scenario.player.x),
      y: rounded(this.scenario.player.y),
      attackPhase: this.scenario.player.attack.phase,
      health: this.scenario.player.health,
    });
  }

  currentInput() {
    return {
      left: this.keys.has("KeyA") || this.keys.has("ArrowLeft"),
      right: this.keys.has("KeyD") || this.keys.has("ArrowRight"),
      jumpPressed: this.pendingJump,
      jumpHeld: this.keys.has("Space"),
      attackPressed: this.pendingAttack,
      attackHeld: this.keys.has(RESET_COMBAT_CONTRACT.attackInput),
    };
  }

  update(dt) {
    const input = this.currentInput();
    const before = this.scenario;
    const beforePlayer = before.player;
    let next = stepResetCombatScenario(before, input, dt);
    this.pendingJump = false;
    this.pendingAttack = false;

    const unclampedX = next.player.x;
    next.player.x = clamp(
      next.player.x,
      RESET_PASS05_LAB.leftBoundary,
      RESET_PASS05_LAB.rightBoundary -
        RESET_GROUND_MOVEMENT.playerWidth,
    );
    if (unclampedX !== next.player.x) {
      next.player.vx = 0;
      this.audit.boundaryContacts += 1;
    }

    const events = next.player.events;
    if (events.attackStarted) this.audit.attackStarts += 1;
    if (events.attackActivated) this.audit.attackActivations += 1;
    if (events.attackRecovered) this.audit.attackRecoveries += 1;
    if (events.bufferedAttackQueued) {
      this.audit.bufferedAttacksQueued += 1;
    }
    if (events.bufferedAttackStarted) {
      this.audit.bufferedAttacksStarted += 1;
    }
    if (events.attackPressIgnored) {
      this.audit.attackPressesIgnored += 1;
    }
    if (
      events.attackCancelled === "jump-from-startup" ||
      events.attackCancelled === "jump-from-recovery"
    ) {
      this.audit.jumpCancels += 1;
    }
    if (events.jumpBlockedByActiveAttack) {
      this.audit.activeJumpBlocks += 1;
    }
    if (
      events.attackCancelled === "hit" ||
      (
        events.damageTaken &&
        beforePlayer.attack.phase !== "idle"
      )
    ) {
      this.audit.hitCancels += 1;
    }
    if (events.damageTaken) this.audit.damageTaken += 1;
    if (events.damageIgnored) this.audit.damageIgnored += 1;
    if (
      beforePlayer.hitstunRemaining > 0 &&
      next.player.hitstunRemaining <= 0
    ) {
      this.audit.recoveredControl = true;
    }
    if (next.player.attack.phase !== "idle") {
      this.audit.maximumAttackSpeed = Math.max(
        this.audit.maximumAttackSpeed,
        Math.abs(next.player.vx),
      );
    }
    if (next.events.gateBlocked) this.audit.gateBlocks += 1;
    if (next.events.gateOpened) this.audit.gateOpened = true;
    if (next.events.targetHits.length > 0) {
      this.audit.targetHitEvents.push(
        ...next.events.targetHits.map(event => ({
          ...event,
          at: rounded(this.simulationSeconds),
        })),
      );
    }
    this.audit.targetHits = next.targetHits;
    this.audit.targetsDestroyed = next.targetsDestroyed;
    this.audit.completed = next.completed;

    const horizontalStep = Math.abs(next.player.x - beforePlayer.x);
    const verticalStep = Math.abs(next.player.y - beforePlayer.y);
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
    if (
      this.audit.attackPhaseSequence.at(-1) !==
        next.player.attack.phase
    ) {
      this.audit.attackPhaseSequence.push(next.player.attack.phase);
    }
    if (
      this.audit.motionStateSequence.at(-1) !== next.player.state
    ) {
      this.audit.motionStateSequence.push(next.player.state);
    }

    this.audit.fixedFrames += 1;
    this.simulationSeconds += dt;
    this.scenario = next;
    const cameraTarget = clamp(
      next.player.x - 420,
      0,
      RESET_PASS05_LAB.width - RESET_PASS05_LAB.viewportWidth,
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

  drawFloor() {
    const context = this.context;
    context.fillStyle = "#1c3235";
    context.fillRect(
      0,
      RESET_PASS05_LAB.floorY,
      RESET_PASS05_LAB.width,
      RESET_PASS05_LAB.height - RESET_PASS05_LAB.floorY,
    );
    context.fillStyle = "#82a5a3";
    context.fillRect(
      0,
      RESET_PASS05_LAB.floorY,
      RESET_PASS05_LAB.width,
      5,
    );
  }

  drawTargets() {
    const context = this.context;
    const sourceTargets = new Map(
      RESET_PASS05_TARGETS.map(target => [target.id, target]),
    );
    for (const target of this.scenario.targets) {
      const source = sourceTargets.get(target.id);
      if (source.role === "high") {
        context.strokeStyle = "rgba(111, 151, 153, 0.48)";
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(
          target.x + target.width / 2,
          0,
        );
        context.lineTo(
          target.x + target.width / 2,
          target.y,
        );
        context.stroke();
      }
      if (target.health <= 0) {
        context.strokeStyle = "rgba(120, 156, 157, 0.4)";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(target.x, target.y + target.height);
        context.lineTo(
          target.x + target.width,
          target.y + target.height,
        );
        context.stroke();
        continue;
      }
      context.fillStyle = target.hitFlashRemaining > 0
        ? "#f3e7ad"
        : "#b8a867";
      context.beginPath();
      context.roundRect(
        target.x,
        target.y,
        target.width,
        target.height,
        10,
      );
      context.fill();
      context.strokeStyle = "#efe0a0";
      context.lineWidth = 3;
      context.stroke();
      context.fillStyle = "#102027";
      context.font =
        '700 14px "Coreless Noto Sans KR", Arial, sans-serif';
      context.fillText(
        `${target.health}/${target.maximumHealth}`,
        target.x + 8,
        target.y + target.height / 2 + 5,
      );
    }
  }

  drawGateAndHazard() {
    const context = this.context;
    if (!this.scenario.gateOpen) {
      context.fillStyle = "rgba(90, 123, 126, 0.78)";
      context.fillRect(
        RESET_PASS05_LAB.gateX,
        0,
        24,
        RESET_PASS05_LAB.floorY,
      );
      context.strokeStyle = "#d5c173";
      context.lineWidth = 3;
      for (let y = 70; y < RESET_PASS05_LAB.floorY; y += 60) {
        context.beginPath();
        context.moveTo(RESET_PASS05_LAB.gateX, y);
        context.lineTo(RESET_PASS05_LAB.gateX + 24, y + 24);
        context.stroke();
      }
    } else {
      context.fillStyle = "rgba(108, 173, 137, 0.45)";
      context.fillRect(
        RESET_PASS05_LAB.gateX,
        RESET_PASS05_LAB.floorY - 8,
        24,
        8,
      );
    }
    for (const hazard of RESET_PASS05_HAZARDS) {
      context.fillStyle = "#6e3237";
      context.fillRect(
        hazard.x,
        hazard.y,
        hazard.width,
        hazard.height,
      );
      context.fillStyle = "#ce7774";
      for (let x = hazard.x + 8; x < hazard.x + hazard.width; x += 22) {
        context.beginPath();
        context.moveTo(x, hazard.y);
        context.lineTo(x + 7, hazard.y - 10);
        context.lineTo(x + 14, hazard.y);
        context.closePath();
        context.fill();
      }
    }
  }

  drawPlayer() {
    const context = this.context;
    const player = this.scenario.player;
    const { x, y, facing, state } = player;
    const flashing =
      player.invulnerabilityRemaining > 0 &&
      Math.floor(player.invulnerabilityRemaining * 20) % 2 === 0;
    const lean = Math.sign(player.vx) * Math.min(
      4,
      Math.abs(player.vx) / 100,
    );
    context.save();
    context.globalAlpha = flashing ? 0.38 : 1;
    context.translate(
      x + RESET_GROUND_MOVEMENT.playerWidth / 2,
      y,
    );
    context.fillStyle = state === "hit" ? "#ef9a82" : "#e6d47f";
    context.beginPath();
    context.roundRect(-15 + lean, 9, 30, 38, 10);
    context.fill();
    context.fillStyle = "#f1e4ad";
    context.beginPath();
    context.arc(lean, 9, 14, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = state === "hit" ? "#ef9a82" : "#e6d47f";
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

    if (player.attack.phase !== "idle") {
      const colors = {
        startup: "rgba(207, 190, 116, 0.35)",
        active: "rgba(247, 224, 129, 0.95)",
        recovery: "rgba(117, 160, 161, 0.38)",
      };
      context.strokeStyle = colors[player.attack.phase];
      context.lineWidth = player.attack.phase === "active" ? 7 : 4;
      context.beginPath();
      const centerX = x + RESET_GROUND_MOVEMENT.playerWidth / 2;
      context.arc(
        centerX,
        y + 31,
        62,
        facing > 0 ? -1.1 : Math.PI - 1.1,
        facing > 0 ? 1.1 : Math.PI + 1.1,
        facing < 0,
      );
      context.stroke();
    }

    const hitbox = attackHitboxFor(player);
    if (hitbox) {
      context.strokeStyle = "rgba(245, 224, 132, 0.28)";
      context.lineWidth = 2;
      context.strokeRect(
        hitbox.x,
        hitbox.y,
        hitbox.width,
        hitbox.height,
      );
    }
    context.fillStyle = "#88a4a5";
    context.font =
      '14px "Coreless Noto Sans KR", Arial, sans-serif';
    const label = player.hitstunRemaining > 0
      ? "HIT"
      : player.attack.phase.toUpperCase();
    context.fillText(label, x - 8, y - 18);
  }

  drawMarker(x, title, detail) {
    const context = this.context;
    context.strokeStyle = "rgba(108, 155, 157, 0.28)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, RESET_PASS05_LAB.floorY - 180);
    context.lineTo(x, RESET_PASS05_LAB.floorY);
    context.stroke();
    context.fillStyle = "#d3c27a";
    context.font =
      '700 16px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(title, x + 12, RESET_PASS05_LAB.floorY - 145);
    context.fillStyle = "#78989a";
    context.font =
      '14px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(detail, x + 12, RESET_PASS05_LAB.floorY - 118);
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
    for (let x = 40; x < RESET_PASS05_LAB.width; x += 190) {
      context.fillRect(x, 120, 72, 780);
    }
    this.drawFloor();
    this.drawTargets();
    this.drawGateAndHazard();
    this.drawMarker(550, "낮은 교정 표적", "B · 두 번 적중");
    this.drawMarker(1120, "높은 교정 표적", "점프 중 B");
    this.drawMarker(1450, "과제 잠금문", "표적을 모두 제거해야 개방");
    this.drawMarker(1760, "피격 시험대", "경직 후 조작 회복");
    this.drawPlayer();
    context.restore();

    context.fillStyle = "rgba(2, 8, 11, 0.92)";
    context.fillRect(30, 28, 610, 132);
    context.strokeStyle = "rgba(123, 177, 180, 0.5)";
    context.strokeRect(30, 28, 610, 132);
    context.fillStyle = "#edf3ed";
    context.font =
      '700 23px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText("RESET PASS 05 · COMBAT LAB", 52, 64);
    context.fillStyle = "#91adae";
    context.font =
      '16px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      "A/D 이동 · SPACE 점프 · B 공격 · R 초기화",
      52,
      95,
    );
    context.fillStyle = "#e6d47f";
    context.font =
      '700 17px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      `TARGET ${this.audit.targetsDestroyed}/2 · ` +
      `HIT ${this.audit.damageTaken} · ` +
      `HP ${this.scenario.player.health}/4`,
      52,
      130,
    );

    const player = this.scenario.player;
    const cards = [
      ["공격 단계", player.attack.phase.toUpperCase()],
      ["피격 경직", `${RESET_COMBAT_CONTRACT.hitstunSeconds.toFixed(2)}s`],
      ["무적 시간", player.invulnerabilityRemaining > 0
        ? `${player.invulnerabilityRemaining.toFixed(2)}s`
        : `${RESET_COMBAT_CONTRACT.invulnerabilitySeconds.toFixed(2)}s`],
    ];
    cards.forEach(([label, value], index) => {
      const x = 665 + index * 236;
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
      scenario: {
        ...this.scenario,
        player: {
          ...this.scenario.player,
          attack: { ...this.scenario.player.attack },
          events: { ...this.scenario.player.events },
        },
        targets: this.scenario.targets.map(target => ({ ...target })),
        events: {
          ...this.scenario.events,
          targetHits: this.scenario.events.targetHits.map(
            event => ({ ...event }),
          ),
        },
      },
      cameraX: this.cameraX,
      simulationSeconds: this.simulationSeconds,
      audit: {
        ...this.audit,
        keyEvents: this.audit.keyEvents.map(item => ({ ...item })),
        attackPhaseSequence: [...this.audit.attackPhaseSequence],
        motionStateSequence: [...this.audit.motionStateSequence],
        targetHitEvents: this.audit.targetHitEvents.map(
          event => ({ ...event }),
        ),
      },
    };
  }
}
