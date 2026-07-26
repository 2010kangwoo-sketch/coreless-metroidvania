import {
  PLAYER_PHYSICS,
  createPlayer,
  stepPlayer,
} from "../v3/player-physics.js";
import {
  FIRST_MEGA_ROOM_ZONES,
  PASS01_BUILD,
  SCALE_CONTRACT,
  validatePass01ScaleLayout,
} from "./pass01-scale-layout.js";

export const PASS02_BUILD = Object.freeze({
  id: "rebuild-v4-pass02",
  pass: 2,
  branch: "rebuild/mega-room-v4-40pass",
  scope: "measured movement baseline and twenty-second space budget",
  finalArtIncluded: false,
});

export const MOVEMENT_LAB = Object.freeze({
  width: 3200,
  height: 900,
  floorY: 780,
  spawnX: 100,
  finishX: 2900,
  measuredDistance: 2800,
  fixedStep: 1 / 120,
});

export const BASIC_ATTACK = Object.freeze({
  input: "KeyB",
  startupSeconds: 0.07,
  activeSeconds: 0.09,
  recoverySeconds: 0.18,
  totalSeconds: 0.34,
  repeatIntervalSeconds: 0.42,
  movementSpeedFactor: 0.82,
  minimumTelegraphSeconds: 0.07,
});

export const TWENTY_SECOND_BUDGET = Object.freeze({
  targetSeconds: 20,
  parts: Object.freeze({
    directTraversal: "measured",
    terrainReading: 2.6,
    routeDecision: 2.2,
    interactionOrCombat: 5.3,
    recoveryMargin: 3.0,
  }),
  rule: "distance alone never supplies the missing time; use readable terrain, a real decision, or a distinct interaction",
});

const LAB_SOLIDS = Object.freeze([
  Object.freeze({
    id: "movement-lab-floor",
    x: -200,
    y: MOVEMENT_LAB.floorY,
    width: MOVEMENT_LAB.width + 400,
    height: 240,
    role: "terrain",
  }),
]);

function createLabPlayer() {
  const player = createPlayer(
    MOVEMENT_LAB.spawnX,
    MOVEMENT_LAB.floorY - PLAYER_PHYSICS.height,
  );
  player.grounded = true;
  return player;
}

export function stepPlayerWithAttack(current, input, dt, attackRemaining = 0) {
  const player = stepPlayer(current, input, dt, LAB_SOLIDS);
  if (attackRemaining > 0 && Math.abs(player.vx) > PLAYER_PHYSICS.runSpeed * BASIC_ATTACK.movementSpeedFactor) {
    player.vx =
      Math.sign(player.vx) *
      PLAYER_PHYSICS.runSpeed *
      BASIC_ATTACK.movementSpeedFactor;
  }
  return player;
}

function runFlatTraversal({ attacking = false } = {}) {
  let player = createLabPlayer();
  let elapsed = 0;
  let attackRemaining = 0;
  let nextAttack = 0;
  let attacks = 0;
  while (player.x < MOVEMENT_LAB.finishX && elapsed < 30) {
    if (attacking && elapsed >= nextAttack) {
      attackRemaining = BASIC_ATTACK.totalSeconds;
      nextAttack += BASIC_ATTACK.repeatIntervalSeconds;
      attacks += 1;
    }
    player = stepPlayerWithAttack(
      player,
      { left: false, right: true, jumpPressed: false, jumpHeld: false },
      MOVEMENT_LAB.fixedStep,
      attackRemaining,
    );
    attackRemaining = Math.max(0, attackRemaining - MOVEMENT_LAB.fixedStep);
    elapsed += MOVEMENT_LAB.fixedStep;
  }
  return Object.freeze({
    seconds: elapsed,
    distance: player.x - MOVEMENT_LAB.spawnX,
    averageSpeed: (player.x - MOVEMENT_LAB.spawnX) / elapsed,
    attacks,
    finishX: player.x,
  });
}

function runJumpProfile(holdSeconds) {
  let player = createLabPlayer();
  const startY = player.y;
  let minimumY = startY;
  let elapsed = 0;
  let started = false;
  while (elapsed < 3) {
    const jumpPressed = !started;
    if (jumpPressed) started = true;
    player = stepPlayer(
      player,
      {
        left: false,
        right: false,
        jumpPressed,
        jumpHeld: elapsed < holdSeconds,
      },
      MOVEMENT_LAB.fixedStep,
      LAB_SOLIDS,
    );
    minimumY = Math.min(minimumY, player.y);
    elapsed += MOVEMENT_LAB.fixedStep;
    if (started && elapsed > 0.15 && player.grounded) break;
  }
  return Object.freeze({
    holdSeconds,
    height: startY - minimumY,
    airtimeSeconds: elapsed,
  });
}

function runDirectionReversal() {
  let player = createLabPlayer();
  let elapsed = 0;
  while (elapsed < 2) {
    player = stepPlayer(
      player,
      { left: false, right: true, jumpPressed: false, jumpHeld: false },
      MOVEMENT_LAB.fixedStep,
      LAB_SOLIDS,
    );
    elapsed += MOVEMENT_LAB.fixedStep;
  }
  const startX = player.x;
  const startSpeed = player.vx;
  let reversalSeconds = 0;
  while (
    player.vx > -PLAYER_PHYSICS.runSpeed * 0.9 &&
    reversalSeconds < 2
  ) {
    player = stepPlayer(
      player,
      { left: true, right: false, jumpPressed: false, jumpHeld: false },
      MOVEMENT_LAB.fixedStep,
      LAB_SOLIDS,
    );
    reversalSeconds += MOVEMENT_LAB.fixedStep;
  }
  return Object.freeze({
    startSpeed,
    secondsToOppositeNinety: reversalSeconds,
    displacement: player.x - startX,
    endSpeed: player.vx,
  });
}

function runGroundStop() {
  let player = createLabPlayer();
  let elapsed = 0;
  while (elapsed < 2) {
    player = stepPlayer(
      player,
      { left: false, right: true, jumpPressed: false, jumpHeld: false },
      MOVEMENT_LAB.fixedStep,
      LAB_SOLIDS,
    );
    elapsed += MOVEMENT_LAB.fixedStep;
  }
  const startX = player.x;
  const startSpeed = player.vx;
  let stopSeconds = 0;
  while (Math.abs(player.vx) > 0.01 && stopSeconds < 1) {
    player = stepPlayer(
      player,
      { left: false, right: false, jumpPressed: false, jumpHeld: false },
      MOVEMENT_LAB.fixedStep,
      LAB_SOLIDS,
    );
    stopSeconds += MOVEMENT_LAB.fixedStep;
  }
  return Object.freeze({
    startSpeed,
    stopSeconds,
    stopDistance: player.x - startX,
  });
}

export function measurePass02Movement() {
  const sprint = runFlatTraversal();
  const attackRun = runFlatTraversal({ attacking: true });
  const shortJump = runJumpProfile(0.065);
  const fullJump = runJumpProfile(0.42);
  const reversal = runDirectionReversal();
  const stop = runGroundStop();
  const minimumAuthoredSeconds =
    TWENTY_SECOND_BUDGET.parts.terrainReading +
    TWENTY_SECOND_BUDGET.parts.routeDecision +
    TWENTY_SECOND_BUDGET.parts.interactionOrCombat +
    TWENTY_SECOND_BUDGET.parts.recoveryMargin;
  return Object.freeze({
    sprint,
    attackRun,
    shortJump,
    fullJump,
    reversal,
    stop,
    spaceBudget: Object.freeze({
      targetSeconds: TWENTY_SECOND_BUDGET.targetSeconds,
      measuredDirectSeconds: sprint.seconds,
      requiredAuthoredSeconds:
        TWENTY_SECOND_BUDGET.targetSeconds - sprint.seconds,
      modeledAuthoredSeconds: minimumAuthoredSeconds,
      distanceShare: sprint.seconds / TWENTY_SECOND_BUDGET.targetSeconds,
    }),
  });
}

export function validatePass02Movement() {
  const pass01Audit = validatePass01ScaleLayout();
  const measurements = measurePass02Movement();
  const checks = [
    ["pass01ScaleStillValid", pass01Audit.passed],
    ["pass01PrecedesPass02", PASS01_BUILD.pass === 1 && PASS02_BUILD.pass === 2],
    ["measuredDistanceIsTwoViewports", MOVEMENT_LAB.measuredDistance === SCALE_CONTRACT.viewport.width * 2],
    ["labWiderThanMeasuredSpace", MOVEMENT_LAB.width > MOVEMENT_LAB.measuredDistance],
    ["fixedStepIsOneTwenty", MOVEMENT_LAB.fixedStep === 1 / 120],
    ["runSpeedPreserved", PLAYER_PHYSICS.runSpeed === 420],
    ["sprintCompletes", measurements.sprint.finishX >= MOVEMENT_LAB.finishX],
    ["sprintTakesMoreThanSixSeconds", measurements.sprint.seconds > 6],
    ["sprintTakesLessThanSevenPointFiveSeconds", measurements.sprint.seconds < 7.5],
    ["distanceDoesNotPretendToFillTwentySeconds", measurements.sprint.seconds < 10],
    ["attackAllowsMovement", BASIC_ATTACK.movementSpeedFactor >= 0.75],
    ["attackRunSlowerThanSprint", measurements.attackRun.seconds > measurements.sprint.seconds],
    ["attackRunNotAForcedStop", measurements.attackRun.seconds < measurements.sprint.seconds * 1.35],
    ["attackCycleIsResponsive", BASIC_ATTACK.totalSeconds <= 0.36],
    ["attackHasReadableActiveWindow", BASIC_ATTACK.activeSeconds >= 0.08],
    ["shortJumpAboveSixty", measurements.shortJump.height >= 60],
    ["shortJumpBelowOneHundred", measurements.shortJump.height < 100],
    ["fullJumpAboveOneHundredTwenty", measurements.fullJump.height >= 120],
    ["fullJumpBelowOneHundredFifty", measurements.fullJump.height <= 150],
    ["jumpProfilesAreMeaningfullyDifferent", measurements.fullJump.height - measurements.shortJump.height >= 35],
    ["reversalResponsive", measurements.reversal.secondsToOppositeNinety <= 0.55],
    ["reversalDoesNotTeleport", Math.abs(measurements.reversal.displacement) <= 65],
    ["groundStopUnderOneFifthSecond", measurements.stop.stopSeconds <= 0.2],
    ["groundStopDistanceBounded", measurements.stop.stopDistance <= 32],
    ["authoredTimeRequired", measurements.spaceBudget.requiredAuthoredSeconds > 12],
    ["budgetModelMatchesMissingTime", Math.abs(
      measurements.spaceBudget.modeledAuthoredSeconds -
      measurements.spaceBudget.requiredAuthoredSeconds
    ) <= 0.15],
    ["distanceShareUnderFortyPercent", measurements.spaceBudget.distanceShare < 0.4],
    ["allThirtySixZonesRetainTimeTargets", FIRST_MEGA_ROOM_ZONES.every(item => item.targetSeconds >= 12 && item.targetSeconds <= 38)],
    ["noFinalArt", PASS02_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements,
  });
}

export { LAB_SOLIDS };
