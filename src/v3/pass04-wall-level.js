import { PLAYER_PHYSICS } from "./player-physics.js";

export const PASS04_BUILD = Object.freeze({
  id: "rebuild-v3-pass04",
  pass: 4,
  branch: "rebuild/mega-room-v3-40pass",
  scope: "isolated wall movement test",
  canonicalRoom: false,
  finalArtIncluded: false,
});

export const PASS04_WORLD = Object.freeze({
  width: 1600,
  height: 1400,
  floorY: 1300,
  spawn: Object.freeze({ x: 620, y: 1236 }),
});

const solid = (id, x, y, width, height, role) =>
  Object.freeze({ id, x, y, width, height, role });

export const PASS04_SOLIDS = Object.freeze([
  solid("world-left", -80, 0, 80, 1400, "boundary"),
  solid("world-right", 1600, 0, 80, 1400, "boundary"),
  solid("test-floor", 0, 1300, 1600, 100, "terrain"),
  solid("shaft-left-wall", 500, 260, 60, 1040, "wall"),
  solid("shaft-right-wall", 760, 210, 60, 1090, "wall"),
  solid("left-rest-ledge", 560, 1040, 92, 22, "recovery"),
  solid("right-rest-ledge", 668, 805, 92, 22, "recovery"),
  solid("left-rest-ledge-high", 560, 570, 92, 22, "recovery"),
  solid("exit-platform", 820, 270, 360, 30, "exit"),
  solid("test-ceiling", 1120, 80, 220, 30, "ceiling"),
]);

export const PASS04_TRIGGERS = Object.freeze([
  Object.freeze({
    id: "wall-test-finish",
    type: "finish",
    x: 840,
    y: 120,
    width: 325,
    height: 180,
  }),
]);

export const PASS04_TARGETS = Object.freeze({
  wallSlideSpeed: Object.freeze([150, 190]),
  wallJumpHorizontalSpeed: Object.freeze([360, 410]),
  wallJumpVerticalSpeed: Object.freeze([640, 710]),
  wallContactGraceSeconds: Object.freeze([0.08, 0.12]),
  wallReattachLockSeconds: Object.freeze([0.1, 0.15]),
  minimumWallJumpsToExit: 7,
  maximumWallJumpsToExit: 14,
});

export function validatePass04WallLevel() {
  const left = PASS04_SOLIDS.find(item => item.id === "shaft-left-wall");
  const right = PASS04_SOLIDS.find(item => item.id === "shaft-right-wall");
  const checks = [
    ["isolatedNonCanonicalRoom", PASS04_BUILD.canonicalRoom === false],
    ["noFinalArt", PASS04_BUILD.finalArtIncluded === false],
    ["twoVerticalWalls", Boolean(left && right)],
    ["shaftWideEnough", right.x - (left.x + left.width) >= PLAYER_PHYSICS.width * 5],
    ["shaftNarrowEnoughForWallJump", right.x - (left.x + left.width) <= 320],
    ["leftWallLowerAtTop", left.y > right.y],
    ["threeRecoveryLedges", PASS04_SOLIDS.filter(item => item.role === "recovery").length === 3],
    ["exitOutsideShaft", PASS04_SOLIDS.some(item => item.id === "exit-platform" && item.x >= right.x + right.width)],
    ["ceilingTestIncluded", PASS04_SOLIDS.some(item => item.role === "ceiling")],
    ["finishTriggerIncluded", PASS04_TRIGGERS.some(item => item.type === "finish")],
    ["spawnInsideShaft", PASS04_WORLD.spawn.x > left.x + left.width && PASS04_WORLD.spawn.x < right.x],
    ["wallSlideTargetSafe", PLAYER_PHYSICS.wallSlideSpeed >= 150 && PLAYER_PHYSICS.wallSlideSpeed <= 190],
    ["wallGraceShort", PLAYER_PHYSICS.wallContactGraceTime <= 0.12],
    ["reattachLockShort", PLAYER_PHYSICS.wallReattachLockTime <= 0.15],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
  });
}
