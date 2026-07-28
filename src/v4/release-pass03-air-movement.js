import {
  RELEASE_PASS_GATES,
  TRAVERSAL_FORGIVENESS_CONTRACT,
  validateReleaseFoundation,
} from "./release-foundation.js";
import {
  M01_RELEASE_SPACE_DESIGNS,
  validateReleasePass01Design,
} from "./release-pass01-design.js";
import {
  RELEASE_PASS02_BUILD,
  validateReleasePass02Movement,
} from "./release-pass02-movement.js";
import {
  RESET_AIR_MOVEMENT,
  RESET_PASS03_BUILD,
  createResetAirPlayer,
  measureResetPass03AirMovement,
  stepResetAirPlayer,
  validateResetPass03AirMovement,
} from "./reset-pass03-air-movement.js";
import {
  RESET_GROUND_MOVEMENT,
} from "./reset-pass02-ground-movement.js";

const frozen = value => Object.freeze(value);

export const RELEASE_PASS03_BUILD = frozen({
  id: "coreless-v4-release-pass03-air-forgiveness",
  cycle: "v4-release-40pass",
  pass: 3,
  branch: "rebuild/mega-room-v4-40pass",
  parentCommit: "dc2ada7f0df3d3e99b02833492c6cbe2dd85cc78",
  scope:
    "variable jump, air control, coyote time, landing buffer, and reach budgets",
  reusedEvidence: RESET_PASS03_BUILD.id,
  finalArtIncluded: false,
});

export const RELEASE_PASS03_MOVEMENT = frozen({
  ...RESET_AIR_MOVEMENT,
  shortJumpHeightTarget: frozen({ minimum: 78, maximum: 98 }),
  fullJumpHeightTarget: frozen({ minimum: 138, maximum: 154 }),
  variableHeightDifferenceMinimum: 48,
  airReversalSecondsTarget: frozen({ minimum: 0.2, maximum: 0.36 }),
  coyoteAcceptedProbeSeconds: 0.065,
  coyoteRejectedProbeSeconds: 0.125,
  principle:
    "jump forgiveness absorbs near-miss input timing without adding hidden movement or completing the route automatically",
});

export const RELEASE_PASS03_ACCEPTANCE = frozen({
  actualKeyboardRequired: RELEASE_PASS_GATES.realKeyTestRequiredEveryImplementationPass,
  deterministicMeasurementRequired:
    RELEASE_PASS_GATES.deterministicTestRequiredEveryImplementationPass,
  browserInspectionRequired:
    RELEASE_PASS_GATES.browserInspectionRequiredEveryImplementationPass,
  requiredStates: frozen(["rise", "apex", "fall"]),
  requiredJumpSources: frozen(["ground", "coyote", "buffered-landing"]),
  ordinaryReachRatioMaximum:
    TRAVERSAL_FORGIVENESS_CONTRACT.requiredOrdinaryReachRatioMaximum,
  demandingReachRatioMaximum:
    TRAVERSAL_FORGIVENESS_CONTRACT.requiredDemandingReachRatioMaximum,
  doubleJumpAllowed: false,
  dashAllowed: false,
  hiddenPositionCorrectionAllowed:
    TRAVERSAL_FORGIVENESS_CONTRACT.hiddenPhysicsCorrectionAllowed,
});

const MEASUREMENT_FLOOR = frozen([frozen({
  id: "release-pass03-reach-floor",
  x: -1000,
  y: 730,
  width: 6000,
  height: 400,
})]);

function measureRunningJumpReach(holdSeconds) {
  let player = createResetAirPlayer({ x: 0, floorY: 730 });
  player.vx = RESET_GROUND_MOVEMENT.maximumRunSpeed;
  player.state = "run-loop";
  const startX = player.x;
  let seconds = 0;
  let pressed = false;
  let apexX = player.x;
  let apexSeen = false;
  while (seconds < 2) {
    player = stepResetAirPlayer(
      player,
      {
        right: true,
        jumpPressed: !pressed,
        jumpHeld: seconds < holdSeconds,
      },
      RESET_GROUND_MOVEMENT.fixedStep,
      MEASUREMENT_FLOOR,
    );
    pressed = true;
    seconds += RESET_GROUND_MOVEMENT.fixedStep;
    if (!apexSeen && player.vy >= 0) {
      apexSeen = true;
      apexX = player.x;
    }
    if (player.landings > 0 && player.grounded) break;
  }
  return frozen({
    holdSeconds,
    horizontalReach: player.x - startX,
    apexHorizontalReach: apexX - startX,
    airtimeSeconds: seconds,
    landed: player.grounded && player.landings === 1,
  });
}

export function measureReleasePass03AirMovement() {
  const air = measureResetPass03AirMovement();
  const shortRunningJump = measureRunningJumpReach(0.06);
  const fullRunningJump = measureRunningJumpReach(0.42);
  const maximumOrdinaryDesignRatio = Math.max(
    ...M01_RELEASE_SPACE_DESIGNS
      .filter(space => !space.traversalBudget.demanding)
      .map(space => space.traversalBudget.reachRatio),
  );
  const maximumDemandingDesignRatio = Math.max(
    ...M01_RELEASE_SPACE_DESIGNS
      .filter(space => space.traversalBudget.demanding)
      .map(space => space.traversalBudget.reachRatio),
  );
  return frozen({
    air,
    shortRunningJump,
    fullRunningJump,
    ordinaryRequiredReachPixels:
      fullRunningJump.horizontalReach *
      RELEASE_PASS03_ACCEPTANCE.ordinaryReachRatioMaximum,
    demandingRequiredReachPixels:
      fullRunningJump.horizontalReach *
      RELEASE_PASS03_ACCEPTANCE.demandingReachRatioMaximum,
    reservedOrdinaryReachPixels:
      fullRunningJump.horizontalReach *
      (1 - RELEASE_PASS03_ACCEPTANCE.ordinaryReachRatioMaximum),
    reservedDemandingReachPixels:
      fullRunningJump.horizontalReach *
      (1 - RELEASE_PASS03_ACCEPTANCE.demandingReachRatioMaximum),
    maximumOrdinaryDesignRatio,
    maximumDemandingDesignRatio,
  });
}

export function validateReleasePass03AirMovement() {
  const foundation = validateReleaseFoundation();
  const pass01 = validateReleasePass01Design();
  const pass02 = validateReleasePass02Movement();
  const resetAir = validateResetPass03AirMovement();
  const measurements = measureReleasePass03AirMovement();
  const { air } = measurements;
  const states = new Set([
    ...air.shortJump.states,
    ...air.fullJump.states,
  ]);
  const checks = [
    ["releaseFoundationStillValid", foundation.passed],
    ["releasePass01StillValid", pass01.passed],
    ["releasePass02StillValid", pass02.passed],
    ["releasePassSequenceIsCorrect",
      RELEASE_PASS02_BUILD.pass === 2 && RELEASE_PASS03_BUILD.pass === 3],
    ["verifiedAirModuleStillValid", resetAir.passed],
    ["airModuleIsReusedWithoutRetuning",
      RELEASE_PASS03_BUILD.reusedEvidence === RESET_PASS03_BUILD.id &&
      RELEASE_PASS03_MOVEMENT.jumpSpeed === RESET_AIR_MOVEMENT.jumpSpeed],
    ["shortJumpHeightIsBounded",
      air.shortJump.height >=
        RELEASE_PASS03_MOVEMENT.shortJumpHeightTarget.minimum &&
      air.shortJump.height <=
        RELEASE_PASS03_MOVEMENT.shortJumpHeightTarget.maximum],
    ["fullJumpHeightIsBounded",
      air.fullJump.height >=
        RELEASE_PASS03_MOVEMENT.fullJumpHeightTarget.minimum &&
      air.fullJump.height <=
        RELEASE_PASS03_MOVEMENT.fullJumpHeightTarget.maximum],
    ["variableHeightIsMeaningful",
      air.fullJump.height - air.shortJump.height >=
        RELEASE_PASS03_MOVEMENT.variableHeightDifferenceMinimum],
    ["coyoteWindowIsOneTenthSecond",
      RELEASE_PASS03_MOVEMENT.coyoteSeconds === 0.1],
    ["coyoteInsideWindowWorks",
      air.coyoteAccepted.jumped &&
      air.coyoteAccepted.jumpSource === "coyote"],
    ["coyoteOutsideWindowFails",
      !air.coyoteRejected.jumped &&
      air.coyoteRejected.jumpSource === null],
    ["landingBufferIsTwelveHundredths",
      RELEASE_PASS03_MOVEMENT.jumpBufferSeconds === 0.12],
    ["landingBufferLaunchesExactlyOnce",
      air.bufferedLanding.jumpedOnLanding &&
      air.bufferedLanding.jumpCountChange === 1],
    ["landingBufferLaunchesUpward",
      air.bufferedLanding.verticalSpeed < -700],
    ["airDirectionCanReverse",
      air.airControl.speedBeforeTurn >= 240 &&
      air.airControl.speedAfterTurn <= -220 &&
      air.airControl.facing === -1],
    ["airReversalIsResponsiveNotInstant",
      air.airControl.turnSeconds >=
        RELEASE_PASS03_MOVEMENT.airReversalSecondsTarget.minimum &&
      air.airControl.turnSeconds <=
        RELEASE_PASS03_MOVEMENT.airReversalSecondsTarget.maximum],
    ["airReversalDriftIsBounded",
      Math.abs(air.airControl.displacementDuringTurn) <= 18],
    ["earlyAirPressCannotCreateDoubleJump",
      air.rejectedAirJump.firstJumpCount === 1 &&
      air.rejectedAirJump.finalJumpCount === 1 &&
      air.rejectedAirJump.bufferExpired],
    ["allAirStatesAreMeasured",
      RELEASE_PASS03_ACCEPTANCE.requiredStates.every(state =>
        states.has(state))],
    ["shortRunningJumpLands", measurements.shortRunningJump.landed],
    ["fullRunningJumpLands", measurements.fullRunningJump.landed],
    ["fullRunningJumpExceedsShortReach",
      measurements.fullRunningJump.horizontalReach >
        measurements.shortRunningJump.horizontalReach],
    ["ordinaryReachKeepsTwentyPercentReserve",
      measurements.maximumOrdinaryDesignRatio <=
        RELEASE_PASS03_ACCEPTANCE.ordinaryReachRatioMaximum &&
      measurements.reservedOrdinaryReachPixels > 0],
    ["demandingReachKeepsTenPercentReserve",
      measurements.maximumDemandingDesignRatio <=
        RELEASE_PASS03_ACCEPTANCE.demandingReachRatioMaximum &&
      measurements.reservedDemandingReachPixels > 0],
    ["realKeyboardEvidenceIsMandatory",
      RELEASE_PASS03_ACCEPTANCE.actualKeyboardRequired],
    ["deterministicEvidenceIsMandatory",
      RELEASE_PASS03_ACCEPTANCE.deterministicMeasurementRequired],
    ["browserInspectionIsMandatory",
      RELEASE_PASS03_ACCEPTANCE.browserInspectionRequired],
    ["hiddenPositionCorrectionIsForbidden",
      !RELEASE_PASS03_ACCEPTANCE.hiddenPositionCorrectionAllowed],
    ["doubleJumpAndDashRemainUnavailable",
      !RELEASE_PASS03_ACCEPTANCE.doubleJumpAllowed &&
      !RELEASE_PASS03_ACCEPTANCE.dashAllowed],
    ["noFinalArt", RELEASE_PASS03_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => frozen({ name, passed: Boolean(passed) }));

  return frozen({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: frozen(checks),
    measurements,
  });
}
