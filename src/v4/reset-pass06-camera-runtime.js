import {
  RESET_COMBAT_CONTRACT,
  attackHitboxFor,
  createResetCombatPlayer,
  stepResetCombatPlayer,
} from "./reset-pass05-combat.js";
import {
  RESET_GROUND_INPUTS,
  RESET_GROUND_MOVEMENT,
} from "./reset-pass02-ground-movement.js";
import {
  RESET_CAMERA_CONTRACT,
  RESET_PASS06_HAZARD,
  RESET_PASS06_LIFT,
  RESET_PASS06_STATIC_SOLIDS,
  RESET_PASS06_WORLD,
  cameraShakeOffset,
  createResetCamera,
  parallaxOffset,
  stepResetCamera,
} from "./reset-pass06-camera.js";

const INPUT_CODES = Object.freeze([
  ...RESET_GROUND_INPUTS,
  "Space",
  RESET_COMBAT_CONTRACT.attackInput,
]);
const MAX_FRAME_DELTA = 1 / 15;

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

const rounded = value => Number(value.toFixed(4));

const overlaps = (one, two) =>
  one.x < two.x + two.width &&
  one.x + one.width > two.x &&
  one.y < two.y + two.height &&
  one.y + one.height > two.y;

export class ResetPass06CameraRuntime {
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
    this.player = createResetCombatPlayer({
      x: RESET_PASS06_WORLD.spawnX,
      floorY: RESET_PASS06_WORLD.lowerFloorY,
    });
    this.lift = {
      y: RESET_PASS06_LIFT.startY,
      active: false,
      arrived: false,
    };
    this.camera = createResetCamera(this.player);
    this.keys.clear();
    this.pendingJump = false;
    this.pendingAttack = false;
    this.simulationSeconds = 0;
    this.lastDamageSerial = 0;
    this.audit = {
      fixedFrames: 0,
      resets,
      keyDowns: 0,
      keyUps: 0,
      repeatedKeyDowns: 0,
      maximumHorizontalCameraStep: 0,
      maximumVerticalCameraStep: 0,
      maximumCameraStep: 0,
      maximumPlayerStep: 0,
      maximumPositiveLead: 0,
      maximumNegativeLead: 0,
      horizontalTravel: 0,
      verticalTravel: 0,
      liftActivated: false,
      liftArrived: false,
      upperDeckReached: false,
      directionReversals: 0,
      lastTurnIntent: 0,
      damageTaken: 0,
      damageIgnored: 0,
      cameraHitStep: 0,
      cameraShakeMaximum: 0,
      cameraOutOfBoundsFrames: 0,
      boundaryContacts: 0,
      completed: false,
      keyEvents: [],
      cameraSamples: [],
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
      playerX: rounded(this.player.x),
      playerY: rounded(this.player.y),
      cameraX: rounded(this.camera.x),
      cameraY: rounded(this.camera.y),
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
      playerX: rounded(this.player.x),
      playerY: rounded(this.player.y),
      cameraX: rounded(this.camera.x),
      cameraY: rounded(this.camera.y),
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

  liftSolid() {
    return {
      id: RESET_PASS06_LIFT.id,
      x: RESET_PASS06_LIFT.x,
      y: this.lift.y,
      width: RESET_PASS06_LIFT.width,
      height: RESET_PASS06_LIFT.height,
    };
  }

  playerStandsOnLift() {
    const feet = this.player.y + RESET_GROUND_MOVEMENT.playerHeight;
    return this.player.grounded &&
      this.player.x + RESET_GROUND_MOVEMENT.playerWidth >
        RESET_PASS06_LIFT.x + RESET_PASS06_LIFT.activationInset &&
      this.player.x <
        RESET_PASS06_LIFT.x + RESET_PASS06_LIFT.width -
        RESET_PASS06_LIFT.activationInset &&
      Math.abs(feet - this.lift.y) <= 1;
  }

  updateLift(dt) {
    if (!this.lift.active && this.playerStandsOnLift()) {
      this.lift.active = true;
      this.audit.liftActivated = true;
    }
    if (!this.lift.active || this.lift.arrived) return;
    const carryingPlayer = this.playerStandsOnLift();
    const beforeY = this.lift.y;
    this.lift.y = Math.max(
      RESET_PASS06_LIFT.endY,
      this.lift.y - RESET_PASS06_LIFT.speed * dt,
    );
    const deltaY = this.lift.y - beforeY;
    if (carryingPlayer) {
      this.player.y += deltaY;
    }
    if (this.lift.y <= RESET_PASS06_LIFT.endY) {
      this.lift.arrived = true;
      this.audit.liftArrived = true;
    }
  }

  update(dt) {
    const beforePlayer = this.player;
    const beforeCamera = this.camera;
    const beforeLiftY = this.lift.y;
    this.updateLift(dt);
    const hitbox = {
      x: beforePlayer.x,
      y: beforePlayer.y,
      width: RESET_GROUND_MOVEMENT.playerWidth,
      height: RESET_GROUND_MOVEMENT.playerHeight,
    };
    const touchingHazard = overlaps(hitbox, RESET_PASS06_HAZARD);
    const incomingHit = touchingHazard &&
      (
        this.lastDamageSerial === 0 ||
        beforePlayer.invulnerabilityRemaining > 0
      )
      ? {
          sourceX: RESET_PASS06_HAZARD.sourceX,
          damage: RESET_PASS06_HAZARD.damage,
        }
      : null;
    const input = this.currentInput();
    const intendedDirection = input.left === input.right
      ? 0
      : input.left
        ? -1
        : 1;
    if (
      intendedDirection !== 0 &&
      Math.sign(beforePlayer.vx) !== 0 &&
      intendedDirection !== Math.sign(beforePlayer.vx) &&
      this.audit.lastTurnIntent !== intendedDirection
    ) {
      this.audit.directionReversals += 1;
      this.audit.lastTurnIntent = intendedDirection;
    }
    if (
      intendedDirection !== 0 &&
      intendedDirection === Math.sign(beforePlayer.vx)
    ) {
      this.audit.lastTurnIntent = 0;
    }
    this.player = stepResetCombatPlayer(
      this.player,
      input,
      dt,
      incomingHit,
      {
        solids: [...RESET_PASS06_STATIC_SOLIDS, this.liftSolid()],
        leftBoundary: RESET_PASS06_WORLD.leftBoundary,
        rightBoundary: RESET_PASS06_WORLD.rightBoundary,
      },
    );
    this.pendingJump = false;
    this.pendingAttack = false;
    if (this.player.events.damageTaken) {
      this.audit.damageTaken += 1;
      this.lastDamageSerial += 1;
    }
    if (this.player.events.damageIgnored) {
      this.audit.damageIgnored += 1;
    }
    this.camera = stepResetCamera(this.camera, this.player, dt, {
      hitStarted: this.player.events.damageTaken,
    });
    const cameraStepX = Math.abs(this.camera.x - beforeCamera.x);
    const cameraStepY = Math.abs(this.camera.y - beforeCamera.y);
    const cameraStep = Math.hypot(cameraStepX, cameraStepY);
    const playerStep = Math.hypot(
      this.player.x - beforePlayer.x,
      this.player.y - beforePlayer.y,
    );
    this.audit.maximumHorizontalCameraStep = Math.max(
      this.audit.maximumHorizontalCameraStep,
      cameraStepX,
    );
    this.audit.maximumVerticalCameraStep = Math.max(
      this.audit.maximumVerticalCameraStep,
      cameraStepY,
    );
    this.audit.maximumCameraStep = Math.max(
      this.audit.maximumCameraStep,
      cameraStep,
    );
    this.audit.maximumPlayerStep = Math.max(
      this.audit.maximumPlayerStep,
      playerStep,
    );
    this.audit.maximumPositiveLead = Math.max(
      this.audit.maximumPositiveLead,
      this.camera.lookAheadX,
    );
    this.audit.maximumNegativeLead = Math.min(
      this.audit.maximumNegativeLead,
      this.camera.lookAheadX,
    );
    this.audit.horizontalTravel = Math.max(
      this.audit.horizontalTravel,
      this.camera.x,
    );
    this.audit.verticalTravel = Math.max(
      this.audit.verticalTravel,
      RESET_PASS06_WORLD.height -
        RESET_PASS06_WORLD.viewportHeight -
        this.camera.y,
    );
    if (this.player.events.damageTaken) {
      this.audit.cameraHitStep = cameraStep;
    }
    const shake = cameraShakeOffset(this.camera);
    this.audit.cameraShakeMaximum = Math.max(
      this.audit.cameraShakeMaximum,
      Math.hypot(shake.x, shake.y),
    );
    if (
      this.camera.x < 0 ||
      this.camera.y < 0 ||
      this.camera.x >
        RESET_PASS06_WORLD.width - RESET_PASS06_WORLD.viewportWidth ||
      this.camera.y >
        RESET_PASS06_WORLD.height - RESET_PASS06_WORLD.viewportHeight
    ) {
      this.audit.cameraOutOfBoundsFrames += 1;
    }
    if (
      this.player.y + RESET_GROUND_MOVEMENT.playerHeight <=
        RESET_PASS06_WORLD.upperFloorY + 1 &&
      this.player.x >= RESET_PASS06_LIFT.x
    ) {
      this.audit.upperDeckReached = true;
    }
    if (this.player.x >= RESET_PASS06_WORLD.finishX) {
      this.audit.completed = true;
    }
    if (
      beforeLiftY !== this.lift.y &&
      this.audit.fixedFrames % 24 === 0
    ) {
      this.audit.cameraSamples.push({
        phase: "lift",
        playerY: rounded(this.player.y),
        cameraY: rounded(this.camera.y),
      });
    }
    if (this.audit.fixedFrames % 30 === 0) {
      this.audit.cameraSamples.push({
        phase: this.player.hitstunRemaining > 0
          ? "hit"
          : this.lift.arrived
            ? "upper"
            : "lower",
        playerX: rounded(this.player.x),
        playerY: rounded(this.player.y),
        cameraX: rounded(this.camera.x),
        cameraY: rounded(this.camera.y),
        lookAheadX: rounded(this.camera.lookAheadX),
      });
    }
    this.audit.fixedFrames += 1;
    this.simulationSeconds += dt;
  }

  frame(timestamp) {
    if (!this.running) return;
    const elapsed = Math.min(
      MAX_FRAME_DELTA,
      Math.max(0, (timestamp - this.lastTime) / 1000),
    );
    this.lastTime = timestamp;
    this.accumulator += elapsed;
    while (this.accumulator >= RESET_GROUND_MOVEMENT.fixedStep) {
      this.update(RESET_GROUND_MOVEMENT.fixedStep);
      this.accumulator -= RESET_GROUND_MOVEMENT.fixedStep;
    }
    this.render();
    requestAnimationFrame(this.boundFrame);
  }

  drawParallaxLayer(layer, color, spacing, height, yBase) {
    const context = this.context;
    const offset = parallaxOffset(this.camera, layer);
    context.save();
    context.translate(offset.x, offset.y);
    context.fillStyle = color;
    for (let x = -spacing; x < RESET_PASS06_WORLD.width + spacing; x += spacing) {
      context.fillRect(x, yBase, spacing * 0.42, height);
      context.beginPath();
      context.moveTo(x - spacing * 0.15, yBase);
      context.lineTo(x + spacing * 0.21, yBase - height * 0.24);
      context.lineTo(x + spacing * 0.55, yBase);
      context.closePath();
      context.fill();
    }
    context.restore();
  }

  drawWorld() {
    const context = this.context;
    for (const solid of RESET_PASS06_STATIC_SOLIDS) {
      context.fillStyle = solid.id === "lower-floor"
        ? "#26363a"
        : "#304146";
      context.fillRect(solid.x, solid.y, solid.width, solid.height);
      context.fillStyle = "#5c7778";
      context.fillRect(solid.x, solid.y, solid.width, 10);
    }
    const lift = this.liftSolid();
    context.fillStyle = "#4d6264";
    context.fillRect(lift.x, lift.y, lift.width, lift.height);
    context.fillStyle = "#b3a768";
    context.fillRect(lift.x, lift.y, lift.width, 8);
    context.strokeStyle = "rgba(119, 154, 155, 0.55)";
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(lift.x + 50, 0);
    context.lineTo(lift.x + 50, lift.y);
    context.moveTo(lift.x + lift.width - 50, 0);
    context.lineTo(lift.x + lift.width - 50, lift.y);
    context.stroke();

    context.fillStyle = "#6e3237";
    context.fillRect(
      RESET_PASS06_HAZARD.x,
      RESET_PASS06_HAZARD.y,
      RESET_PASS06_HAZARD.width,
      RESET_PASS06_HAZARD.height,
    );
    context.fillStyle = "#ce7774";
    for (
      let x = RESET_PASS06_HAZARD.x + 8;
      x < RESET_PASS06_HAZARD.x + RESET_PASS06_HAZARD.width;
      x += 22
    ) {
      context.beginPath();
      context.moveTo(x, RESET_PASS06_HAZARD.y);
      context.lineTo(x + 7, RESET_PASS06_HAZARD.y - 10);
      context.lineTo(x + 14, RESET_PASS06_HAZARD.y);
      context.closePath();
      context.fill();
    }
    this.drawMarker(800, RESET_PASS06_WORLD.lowerFloorY, "수평 추적");
    this.drawMarker(1960, this.lift.y, "수직 전환");
    this.drawMarker(3040, RESET_PASS06_WORLD.upperFloorY, "선행 시야");
    this.drawMarker(3700, RESET_PASS06_WORLD.upperFloorY, "피격 완충");
    this.drawMarker(4860, RESET_PASS06_WORLD.upperFloorY, "출구");
    this.drawPlayer();
  }

  drawMarker(x, floorY, label) {
    const context = this.context;
    context.strokeStyle = "rgba(111, 154, 155, 0.28)";
    context.beginPath();
    context.moveTo(x, floorY - 150);
    context.lineTo(x, floorY);
    context.stroke();
    context.fillStyle = "#d5c77d";
    context.font =
      '700 17px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(label, x + 14, floorY - 112);
  }

  drawPlayer() {
    const context = this.context;
    const player = this.player;
    const flashing =
      player.invulnerabilityRemaining > 0 &&
      Math.floor(player.invulnerabilityRemaining * 20) % 2 === 0;
    context.save();
    context.globalAlpha = flashing ? 0.38 : 1;
    context.translate(
      player.x + RESET_GROUND_MOVEMENT.playerWidth / 2,
      player.y,
    );
    context.fillStyle = player.state === "hit" ? "#ef9a82" : "#e6d47f";
    context.beginPath();
    context.roundRect(-15, 9, 30, 38, 10);
    context.fill();
    context.fillStyle = "#f1e4ad";
    context.beginPath();
    context.arc(0, 9, 14, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = player.state === "hit" ? "#ef9a82" : "#e6d47f";
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
    context.arc(player.facing * 5, 7, 2.8, 0, Math.PI * 2);
    context.fill();
    context.restore();
    if (player.attack.phase !== "idle") {
      context.strokeStyle = player.attack.phase === "active"
        ? "rgba(247, 224, 129, 0.95)"
        : "rgba(117, 160, 161, 0.5)";
      context.lineWidth = player.attack.phase === "active" ? 7 : 4;
      context.beginPath();
      context.arc(
        player.x + RESET_GROUND_MOVEMENT.playerWidth / 2,
        player.y + 31,
        62,
        player.facing > 0 ? -1.1 : Math.PI - 1.1,
        player.facing > 0 ? 1.1 : Math.PI + 1.1,
        player.facing < 0,
      );
      context.stroke();
    }
    const attack = attackHitboxFor(player);
    if (attack) {
      context.strokeStyle = "rgba(245, 224, 132, 0.28)";
      context.strokeRect(attack.x, attack.y, attack.width, attack.height);
    }
  }

  render() {
    const context = this.context;
    const background = context.createLinearGradient(0, 0, 0, 900);
    background.addColorStop(0, "#061116");
    background.addColorStop(1, "#101b1d");
    context.fillStyle = background;
    context.fillRect(0, 0, 1400, 900);
    this.drawParallaxLayer(
      "far",
      "rgba(53, 85, 91, 0.18)",
      470,
      1050,
      560,
    );
    this.drawParallaxLayer(
      "middle",
      "rgba(67, 101, 105, 0.22)",
      350,
      1280,
      390,
    );
    this.drawParallaxLayer(
      "near",
      "rgba(79, 112, 113, 0.16)",
      260,
      1420,
      250,
    );
    const shake = cameraShakeOffset(this.camera);
    context.save();
    context.translate(
      -this.camera.x + shake.x,
      -this.camera.y + shake.y,
    );
    this.drawWorld();
    context.restore();

    context.fillStyle = "rgba(2, 8, 11, 0.92)";
    context.fillRect(28, 26, 665, 138);
    context.strokeStyle = "rgba(123, 177, 180, 0.5)";
    context.strokeRect(28, 26, 665, 138);
    context.fillStyle = "#edf3ed";
    context.font =
      '700 23px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText("RESET PASS 06 · LARGE WORLD CAMERA", 50, 62);
    context.fillStyle = "#91adae";
    context.font =
      '16px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      "A/D 이동 · SPACE 점프 · B 공격 · R 초기화",
      50,
      94,
    );
    context.fillStyle = "#e6d47f";
    context.font =
      '700 16px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText(
      `CAM ${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)} · ` +
      `LEAD ${this.camera.lookAheadX.toFixed(0)} · ` +
      `HP ${this.player.health}/4`,
      50,
      130,
    );

    const cards = [
      ["수평 반감기", `${RESET_CAMERA_CONTRACT.horizontalHalfLifeSeconds}s`],
      ["수직 반감기", `${RESET_CAMERA_CONTRACT.verticalHalfLifeSeconds}s`],
      ["선행 시야", `±${RESET_CAMERA_CONTRACT.lookAheadDistancePx}px`],
    ];
    cards.forEach(([label, value], index) => {
      const x = 720 + index * 220;
      context.fillStyle = "rgba(7, 17, 21, 0.9)";
      context.fillRect(x, 30, 194, 90);
      context.strokeStyle = "#45666a";
      context.strokeRect(x, 30, 194, 90);
      context.fillStyle = "#78999b";
      context.font =
        '14px "Coreless Noto Sans KR", Arial, sans-serif';
      context.fillText(label, x + 15, 59);
      context.fillStyle = "#dce8df";
      context.font =
        '700 20px "Coreless Noto Sans KR", Arial, sans-serif';
      context.fillText(value, x + 15, 91);
    });
  }

  snapshot() {
    return {
      player: {
        ...this.player,
        attack: { ...this.player.attack },
        events: { ...this.player.events },
      },
      lift: { ...this.lift },
      camera: { ...this.camera },
      simulationSeconds: this.simulationSeconds,
      audit: {
        ...this.audit,
        keyEvents: this.audit.keyEvents.map(item => ({ ...item })),
        cameraSamples: this.audit.cameraSamples.map(item => ({ ...item })),
      },
    };
  }
}
