import { CAMERA_PHYSICS, PLAYER_PHYSICS } from "./player-physics.js";

export const PASS03_BUILD = Object.freeze({
  id: "rebuild-v3-pass03",
  pass: 3,
  branch: "rebuild/mega-room-v3-40pass",
  scope: "movement feel lock",
  finalArtIncluded: false,
});

export const PASS03_FEEL_TARGETS = Object.freeze({
  reversalToOppositeNinetySeconds: Object.freeze([0.36, 0.56]),
  airMomentumRetentionAfterHalfSecond: Object.freeze([0.72, 0.9]),
  airDirectionChangeAfterQuarterSecond: Object.freeze([280, 350]),
  maximumEdgeCorrectionPixels: Object.freeze([6, 10]),
  verticalCameraDeadZonePixels: Object.freeze([52, 76]),
  verticalCameraHalfLifeSeconds: Object.freeze([0.13, 0.2]),
  landingVisualRecoverySeconds: Object.freeze([0.1, 0.2]),
});

export const PASS03_MOTION_VISUAL = Object.freeze({
  landingRecoverySeconds: 0.14,
  takeoffRecoverySeconds: 0.12,
  landingSquash: 0.14,
  takeoffStretch: 0.1,
  fallingStretch: 0.06,
});

export function validatePass03Feel() {
  const checks = [
    ["separateTurnAcceleration", PLAYER_PHYSICS.turnAcceleration > PLAYER_PHYSICS.groundAcceleration],
    ["airTurnStrongerThanAirAcceleration", PLAYER_PHYSICS.airTurnAcceleration > PLAYER_PHYSICS.airAcceleration],
    ["airMomentumPreserved", PLAYER_PHYSICS.airDeceleration < PLAYER_PHYSICS.groundDeceleration * 0.1],
    ["edgeCorrectionStrictlyLimited", PLAYER_PHYSICS.maximumEdgeCorrection <= 10],
    ["apexGravityIsGentle", PLAYER_PHYSICS.apexGravityMultiplier > 0.75 && PLAYER_PHYSICS.apexGravityMultiplier < 1],
    ["verticalCameraSlowerThanHorizontal", CAMERA_PHYSICS.verticalFollowHalfLife > CAMERA_PHYSICS.followHalfLife],
    ["verticalDeadZoneDefined", CAMERA_PHYSICS.verticalDeadZone >= 52],
    ["landingVisualShort", PASS03_MOTION_VISUAL.landingRecoverySeconds <= 0.2],
    ["takeoffVisualShort", PASS03_MOTION_VISUAL.takeoffRecoverySeconds <= 0.16],
    ["noFinalArt", PASS03_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
  });
}
