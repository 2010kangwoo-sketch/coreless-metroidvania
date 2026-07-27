import {
  RELEASE_FOUNDATION_BUILD,
  RELEASE_PASS_GATES,
  TRAVERSAL_FORGIVENESS_CONTRACT,
  validateReleaseFoundation,
} from "./release-foundation.js";
import {
  M01_RELEASE_SPACE_DESIGNS,
  RELEASE_PASS01_BUILD,
  validateReleasePass01Design,
} from "./release-pass01-design.js";
import {
  RESET_GROUND_MOVEMENT,
  RESET_PASS02_BUILD,
  RESET_PASS02_LAB,
  measureResetPass02GroundMovement,
  validateResetPass02GroundMovement,
} from "./reset-pass02-ground-movement.js";

const frozen = value => Object.freeze(value);

export const RELEASE_PASS02_BUILD = frozen({
  id: "coreless-v4-release-pass02-ground-baseline",
  cycle: RELEASE_FOUNDATION_BUILD.cycle,
  pass: 2,
  branch: RELEASE_FOUNDATION_BUILD.branch,
  parentCommit: "bcf5317970a59b087263cccc039cfa85731aa71f",
  scope: "release ground movement baseline with real-key evidence",
  reusedEvidence: RESET_PASS02_BUILD.id,
  finalArtIncluded: false,
});

export const RELEASE_PASS02_MOVEMENT = frozen({
  fixedStep: RESET_GROUND_MOVEMENT.fixedStep,
  playerWidth: RESET_GROUND_MOVEMENT.playerWidth,
  playerHeight: RESET_GROUND_MOVEMENT.playerHeight,
  maximumRunSpeed: RESET_GROUND_MOVEMENT.maximumRunSpeed,
  groundAcceleration: RESET_GROUND_MOVEMENT.groundAcceleration,
  groundStopDeceleration: RESET_GROUND_MOVEMENT.groundStopDeceleration,
  groundTurnAcceleration: RESET_GROUND_MOVEMENT.groundTurnAcceleration,
  targetSecondsToNinety: frozen({ minimum: 0.12, maximum: 0.2 }),
  targetStopSeconds: frozen({ minimum: 0.1, maximum: 0.16 }),
  targetStopDistance: frozen({ minimum: 20, maximum: 30 }),
  targetReversalSeconds: frozen({ minimum: 0.16, maximum: 0.24 }),
  targetReversalOvershoot: frozen({ minimum: 15, maximum: 24 }),
  directionTurnClearancePlayerBodiesMinimum: 3,
  principle:
    "direction changes remain deliberate but never consume the whole landing or trap the player against nearby terrain",
});

export const RELEASE_PASS02_ACCEPTANCE = frozen({
  actualKeyboardRequired: RELEASE_PASS_GATES.realKeyTestRequiredEveryImplementationPass,
  deterministicMeasurementRequired:
    RELEASE_PASS_GATES.deterministicTestRequiredEveryImplementationPass,
  browserInspectionRequired:
    RELEASE_PASS_GATES.browserInspectionRequiredEveryImplementationPass,
  ordinaryRequiredReachRatioMaximum:
    TRAVERSAL_FORGIVENESS_CONTRACT.requiredOrdinaryReachRatioMaximum,
  testInputs: frozen(["KeyA", "KeyD", "ArrowLeft", "ArrowRight"]),
  requiredStates: frozen([
    "idle",
    "run-start",
    "run-loop",
    "run-stop",
    "turn",
  ]),
  forbiddenInThisPass: frozen([
    "jump tuning completion",
    "collision correction",
    "camera tuning",
    "final environment art",
  ]),
});

export function measureReleasePass02Movement() {
  const ground = measureResetPass02GroundMovement();
  const ordinarySpaces = M01_RELEASE_SPACE_DESIGNS.filter(
    space => !space.traversalBudget.demanding,
  );
  const maximumOrdinaryReachRatio = Math.max(
    ...ordinarySpaces.map(space => space.traversalBudget.reachRatio),
  );
  const minimumOrdinaryLandingBodies = Math.min(
    ...ordinarySpaces
      .filter(space => !space.traversalBudget.precisionLandings)
      .map(space => space.traversalBudget.landingWidthBodies),
  );
  const directionTurnClearancePixels =
    RELEASE_PASS02_MOVEMENT.playerWidth *
    RELEASE_PASS02_MOVEMENT.directionTurnClearancePlayerBodiesMinimum;
  const reversalRecoveryMarginPixels =
    directionTurnClearancePixels - ground.reversal.forwardOvershoot;

  return frozen({
    ground,
    maximumOrdinaryReachRatio,
    minimumOrdinaryLandingBodies,
    directionTurnClearancePixels,
    reversalRecoveryMarginPixels,
    labRecoveryWidthPixels: RESET_PASS02_LAB.safeTestWidth,
  });
}

export function validateReleasePass02Movement() {
  const foundation = validateReleaseFoundation();
  const pass01 = validateReleasePass01Design();
  const resetGround = validateResetPass02GroundMovement();
  const measurements = measureReleasePass02Movement();
  const { ground } = measurements;
  const states = new Set([
    ...ground.acceleration.states,
    ...ground.stop.states,
    ...ground.reversal.states,
  ]);
  const checks = [
    ["releaseFoundationStillValid", foundation.passed],
    ["releasePass01StillValid", pass01.passed],
    ["releasePassSequenceIsCorrect",
      RELEASE_PASS01_BUILD.pass === 1 && RELEASE_PASS02_BUILD.pass === 2],
    ["verifiedGroundModuleStillValid", resetGround.passed],
    ["groundModuleIsReusedWithoutRetuning",
      RELEASE_PASS02_BUILD.reusedEvidence === RESET_PASS02_BUILD.id &&
      RELEASE_PASS02_MOVEMENT.maximumRunSpeed ===
        RESET_GROUND_MOVEMENT.maximumRunSpeed],
    ["fixedStepRemainsDeterministic",
      RELEASE_PASS02_MOVEMENT.fixedStep === 1 / 120],
    ["accelerationReachesNinetyInWindow",
      ground.acceleration.secondsToNinety >=
        RELEASE_PASS02_MOVEMENT.targetSecondsToNinety.minimum &&
      ground.acceleration.secondsToNinety <=
        RELEASE_PASS02_MOVEMENT.targetSecondsToNinety.maximum],
    ["accelerationDistanceLeavesControl",
      ground.acceleration.distanceToNinety >= 24 &&
      ground.acceleration.distanceToNinety <= 36],
    ["releaseStopsInTimeWindow",
      ground.stop.seconds >=
        RELEASE_PASS02_MOVEMENT.targetStopSeconds.minimum &&
      ground.stop.seconds <=
        RELEASE_PASS02_MOVEMENT.targetStopSeconds.maximum],
    ["releaseStopsInDistanceWindow",
      ground.stop.distance >=
        RELEASE_PASS02_MOVEMENT.targetStopDistance.minimum &&
      ground.stop.distance <=
        RELEASE_PASS02_MOVEMENT.targetStopDistance.maximum],
    ["releaseReversesInTimeWindow",
      ground.reversal.secondsToOppositeNinety >=
        RELEASE_PASS02_MOVEMENT.targetReversalSeconds.minimum &&
      ground.reversal.secondsToOppositeNinety <=
        RELEASE_PASS02_MOVEMENT.targetReversalSeconds.maximum],
    ["releaseReversalOvershootIsBounded",
      ground.reversal.forwardOvershoot >=
        RELEASE_PASS02_MOVEMENT.targetReversalOvershoot.minimum &&
      ground.reversal.forwardOvershoot <=
        RELEASE_PASS02_MOVEMENT.targetReversalOvershoot.maximum],
    ["turnClearanceIsAtLeastThreeBodies",
      measurements.directionTurnClearancePixels >=
        RELEASE_PASS02_MOVEMENT.playerWidth * 3],
    ["turnClearanceLeavesTwoBodyRecoveryAfterOvershoot",
      measurements.reversalRecoveryMarginPixels >=
        RELEASE_PASS02_MOVEMENT.playerWidth * 2],
    ["allRequiredGroundStatesAreMeasured",
      RELEASE_PASS02_ACCEPTANCE.requiredStates.every(state =>
        states.has(state))],
    ["ordinaryTraversalStillKeepsTwentyPercentMargin",
      measurements.maximumOrdinaryReachRatio <=
        RELEASE_PASS02_ACCEPTANCE.ordinaryRequiredReachRatioMaximum],
    ["ordinaryLandingStillExceedsTwoBodyWidths",
      measurements.minimumOrdinaryLandingBodies >= 2.2],
    ["testLabCannotForceBoundaryCorrection",
      measurements.labRecoveryWidthPixels >=
        RELEASE_PASS02_MOVEMENT.maximumRunSpeed * 3],
    ["realKeyboardEvidenceIsMandatory",
      RELEASE_PASS02_ACCEPTANCE.actualKeyboardRequired &&
      RELEASE_PASS02_ACCEPTANCE.testInputs.length === 4],
    ["deterministicEvidenceIsMandatory",
      RELEASE_PASS02_ACCEPTANCE.deterministicMeasurementRequired],
    ["browserInspectionIsMandatory",
      RELEASE_PASS02_ACCEPTANCE.browserInspectionRequired],
    ["airMovementDoesNotCountAsPassTwo",
      RELEASE_PASS02_ACCEPTANCE.forbiddenInThisPass.includes(
        "jump tuning completion",
      )],
    ["noFinalArt", RELEASE_PASS02_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => frozen({ name, passed: Boolean(passed) }));

  return frozen({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: frozen(checks),
    measurements,
  });
}
