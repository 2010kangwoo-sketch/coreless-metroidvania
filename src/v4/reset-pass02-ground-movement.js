import { validatePrepassProductionContract } from "./prepass-production-contract.js";
import {
  RESET_PASS01_BUILD,
  validateResetPass01RoomPlan,
} from "./reset-pass01-room-plan.js";

export const RESET_PASS02_BUILD = Object.freeze({
  id: "rebuild-v4-reset-pass02-ground-movement",
  pass: 2,
  branch: "rebuild/mega-room-v4-40pass",
  scope: "ground run, stop, and direction reversal baseline",
  finalArtIncluded: false,
});

export const RESET_GROUND_MOVEMENT = Object.freeze({
  fixedStep: 1 / 120,
  playerWidth: 40,
  playerHeight: 64,
  maximumRunSpeed: 400,
  groundAcceleration: 2400,
  groundStopDeceleration: 3200,
  groundTurnAcceleration: 4200,
  stopSpeedEpsilon: 0.5,
  runLoopSpeedRatio: 0.78,
  measuredSpeedRatio: 0.9,
  strideLength: 92,
});

export const RESET_PASS02_LAB = Object.freeze({
  width: 1400,
  height: 900,
  floorY: 730,
  spawnX: 680,
  leftBoundary: 80,
  rightBoundary: 1320,
  safeTestWidth: 1240,
});

export const RESET_GROUND_INPUTS = Object.freeze([
  "KeyA",
  "KeyD",
  "ArrowLeft",
  "ArrowRight",
  "KeyR",
]);

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

const approach = (value, target, maximumDelta) => {
  if (value < target) return Math.min(value + maximumDelta, target);
  if (value > target) return Math.max(value - maximumDelta, target);
  return value;
};

export function createResetGroundPlayer(x = RESET_PASS02_LAB.spawnX) {
  return {
    x,
    y: RESET_PASS02_LAB.floorY - RESET_GROUND_MOVEMENT.playerHeight,
    vx: 0,
    facing: 1,
    state: "idle",
    stateSeconds: 0,
    stridePhase: 0,
  };
}

export function resolveGroundDirection(input = {}) {
  const left = Boolean(input.left);
  const right = Boolean(input.right);
  if (left === right) return 0;
  return right ? 1 : -1;
}

export function stepResetGroundPlayer(current, input, dt) {
  const direction = resolveGroundDirection(input);
  const previousVelocity = current.vx;
  const previousSign = Math.sign(previousVelocity);
  let velocity = previousVelocity;
  let state = current.state;

  if (direction === 0) {
    velocity = approach(
      velocity,
      0,
      RESET_GROUND_MOVEMENT.groundStopDeceleration * dt,
    );
    if (Math.abs(velocity) <= RESET_GROUND_MOVEMENT.stopSpeedEpsilon) {
      velocity = 0;
      state = "idle";
    } else {
      state = "run-stop";
    }
  } else if (
    (previousSign !== 0 && direction !== previousSign) ||
    (
      current.state === "turn" &&
      Math.abs(previousVelocity) <
      RESET_GROUND_MOVEMENT.maximumRunSpeed *
      RESET_GROUND_MOVEMENT.runLoopSpeedRatio
    )
  ) {
    velocity = approach(
      velocity,
      direction * RESET_GROUND_MOVEMENT.maximumRunSpeed,
      RESET_GROUND_MOVEMENT.groundTurnAcceleration * dt,
    );
    state = "turn";
  } else {
    velocity = approach(
      velocity,
      direction * RESET_GROUND_MOVEMENT.maximumRunSpeed,
      RESET_GROUND_MOVEMENT.groundAcceleration * dt,
    );
    state = Math.abs(velocity) >=
      RESET_GROUND_MOVEMENT.maximumRunSpeed *
      RESET_GROUND_MOVEMENT.runLoopSpeedRatio
      ? "run-loop"
      : "run-start";
  }

  let facing = current.facing;
  if (
    direction !== 0 &&
    (previousVelocity === 0 || Math.sign(velocity) === direction)
  ) {
    facing = direction;
  }

  const distance = (previousVelocity + velocity) * 0.5 * dt;
  const x = current.x + distance;
  const stateSeconds = state === current.state
    ? current.stateSeconds + dt
    : 0;
  const stridePhase = ["run-start", "run-loop"].includes(state)
    ? (current.stridePhase + Math.abs(distance) /
      RESET_GROUND_MOVEMENT.strideLength) % 1
    : current.stridePhase;

  return {
    ...current,
    x,
    vx: velocity,
    facing,
    state,
    stateSeconds,
    stridePhase,
  };
}

function simulateUntil({
  player,
  input,
  predicate,
  limitSeconds,
}) {
  let current = { ...player };
  let seconds = 0;
  let maximumStep = 0;
  const states = new Set([current.state]);
  while (!predicate(current) && seconds < limitSeconds) {
    const beforeX = current.x;
    current = stepResetGroundPlayer(
      current,
      input,
      RESET_GROUND_MOVEMENT.fixedStep,
    );
    maximumStep = Math.max(maximumStep, Math.abs(current.x - beforeX));
    states.add(current.state);
    seconds += RESET_GROUND_MOVEMENT.fixedStep;
  }
  return {
    player: current,
    seconds,
    distance: current.x - player.x,
    maximumStep,
    states: [...states],
  };
}

export function measureResetPass02GroundMovement() {
  const player = createResetGroundPlayer(0);
  const ninetyPercent =
    RESET_GROUND_MOVEMENT.maximumRunSpeed *
    RESET_GROUND_MOVEMENT.measuredSpeedRatio;
  const acceleration = simulateUntil({
    player,
    input: { right: true },
    predicate: current => current.vx >= ninetyPercent,
    limitSeconds: 1,
  });
  const fullSpeed = simulateUntil({
    player: acceleration.player,
    input: { right: true },
    predicate: current =>
      current.vx >= RESET_GROUND_MOVEMENT.maximumRunSpeed,
    limitSeconds: 1,
  });
  const stop = simulateUntil({
    player: fullSpeed.player,
    input: {},
    predicate: current => current.state === "idle",
    limitSeconds: 1,
  });
  const reversal = simulateUntil({
    player: fullSpeed.player,
    input: { left: true },
    predicate: current => current.vx <= -ninetyPercent,
    limitSeconds: 1,
  });
  const reversalSamples = [];
  let reversalPlayer = { ...fullSpeed.player };
  let reversalSeconds = 0;
  while (reversalPlayer.vx > -ninetyPercent && reversalSeconds < 1) {
    reversalSamples.push(reversalPlayer.x);
    reversalPlayer = stepResetGroundPlayer(
      reversalPlayer,
      { left: true },
      RESET_GROUND_MOVEMENT.fixedStep,
    );
    reversalSeconds += RESET_GROUND_MOVEMENT.fixedStep;
  }
  reversalSamples.push(reversalPlayer.x);
  const forwardOvershoot = Math.max(...reversalSamples) - fullSpeed.player.x;
  const bothKeys = stepResetGroundPlayer(
    fullSpeed.player,
    { left: true, right: true },
    RESET_GROUND_MOVEMENT.fixedStep,
  );

  return Object.freeze({
    acceleration: Object.freeze({
      secondsToNinety: acceleration.seconds,
      distanceToNinety: acceleration.distance,
      maximumStep: acceleration.maximumStep,
      states: Object.freeze(acceleration.states),
    }),
    stop: Object.freeze({
      startSpeed: fullSpeed.player.vx,
      seconds: stop.seconds,
      distance: stop.distance,
      maximumStep: stop.maximumStep,
      states: Object.freeze(stop.states),
    }),
    reversal: Object.freeze({
      startSpeed: fullSpeed.player.vx,
      secondsToOppositeNinety: reversal.seconds,
      netDisplacement: reversal.distance,
      forwardOvershoot,
      maximumStep: reversal.maximumStep,
      endSpeed: reversal.player.vx,
      endFacing: reversal.player.facing,
      states: Object.freeze(reversal.states),
    }),
    bothKeys: Object.freeze({
      velocityBefore: fullSpeed.player.vx,
      velocityAfter: bothKeys.vx,
      resolvedDirection: resolveGroundDirection({
        left: true,
        right: true,
      }),
    }),
  });
}

export function validateResetPass02GroundMovement() {
  const prepass = validatePrepassProductionContract();
  const pass01 = validateResetPass01RoomPlan();
  const measurements = measureResetPass02GroundMovement();
  const allMeasuredStates = new Set([
    "idle",
    ...measurements.acceleration.states,
    ...measurements.stop.states,
    ...measurements.reversal.states,
  ]);
  const maximumMeasuredStep = Math.max(
    measurements.acceleration.maximumStep,
    measurements.stop.maximumStep,
    measurements.reversal.maximumStep,
  );
  const checks = [
    ["prepassStillValid", prepass.passed],
    ["resetPass01StillValid", pass01.passed],
    ["passSequenceIsCorrect",
      RESET_PASS01_BUILD.pass === 1 && RESET_PASS02_BUILD.pass === 2],
    ["fixedStepIsOneTwenty",
      RESET_GROUND_MOVEMENT.fixedStep === 1 / 120],
    ["runSpeedIsBounded",
      RESET_GROUND_MOVEMENT.maximumRunSpeed >= 360 &&
      RESET_GROUND_MOVEMENT.maximumRunSpeed <= 440],
    ["accelerationIsDistinctFromTurn",
      RESET_GROUND_MOVEMENT.groundAcceleration <
      RESET_GROUND_MOVEMENT.groundTurnAcceleration],
    ["stopIsFasterThanAcceleration",
      RESET_GROUND_MOVEMENT.groundStopDeceleration >
      RESET_GROUND_MOVEMENT.groundAcceleration],
    ["turnIsFastestGroundResponse",
      RESET_GROUND_MOVEMENT.groundTurnAcceleration >
      RESET_GROUND_MOVEMENT.groundStopDeceleration],
    ["reachesNinetyWithinResponsiveWindow",
      measurements.acceleration.secondsToNinety >= 0.12 &&
      measurements.acceleration.secondsToNinety <= 0.2],
    ["accelerationDistanceIsBounded",
      measurements.acceleration.distanceToNinety >= 24 &&
      measurements.acceleration.distanceToNinety <= 36],
    ["stopCompletesWithinWindow",
      measurements.stop.seconds >= 0.1 &&
      measurements.stop.seconds <= 0.16],
    ["stopDistanceIsBounded",
      measurements.stop.distance >= 20 &&
      measurements.stop.distance <= 30],
    ["reversalCompletesWithinWindow",
      measurements.reversal.secondsToOppositeNinety >= 0.16 &&
      measurements.reversal.secondsToOppositeNinety <= 0.24],
    ["reversalOvershootIsBounded",
      measurements.reversal.forwardOvershoot >= 15 &&
      measurements.reversal.forwardOvershoot <= 24],
    ["reversalEndsFacingInput",
      measurements.reversal.endFacing === -1 &&
      measurements.reversal.endSpeed < 0],
    ["bothDirectionsResolveNeutral",
      measurements.bothKeys.resolvedDirection === 0 &&
      measurements.bothKeys.velocityAfter <
      measurements.bothKeys.velocityBefore],
    ["positionStepCannotTeleport", maximumMeasuredStep <= 3.4],
    ["idleStateObserved", allMeasuredStates.has("idle")],
    ["runStartStateObserved", allMeasuredStates.has("run-start")],
    ["runLoopStateObserved", allMeasuredStates.has("run-loop")],
    ["runStopStateObserved", allMeasuredStates.has("run-stop")],
    ["turnStateObserved", allMeasuredStates.has("turn")],
    ["labLeavesWideRecoverySpace",
      RESET_PASS02_LAB.safeTestWidth >=
      RESET_GROUND_MOVEMENT.maximumRunSpeed * 3],
    ["onlyGroundInputsExposed",
      RESET_GROUND_INPUTS.every(code =>
        ["KeyA", "KeyD", "ArrowLeft", "ArrowRight", "KeyR"].includes(code))],
    ["jumpNotImplementedInPassTwo",
      !RESET_GROUND_INPUTS.includes("Space")],
    ["dashNotImplementedInPassTwo",
      !RESET_GROUND_INPUTS.includes("ShiftLeft") &&
      !RESET_GROUND_INPUTS.includes("ShiftRight")],
    ["noFinalArt", RESET_PASS02_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => Object.freeze({
    name,
    passed: Boolean(passed),
  }));

  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements,
  });
}
