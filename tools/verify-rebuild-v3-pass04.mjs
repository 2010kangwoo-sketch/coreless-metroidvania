import fs from "node:fs";
import path from "node:path";
import {
  PASS04_SOLIDS,
  PASS04_TARGETS,
  PASS04_WORLD,
  validatePass04WallLevel,
} from "../src/v3/pass04-wall-level.js";
import {
  PLAYER_PHYSICS,
  createPlayer,
  stepPlayer,
} from "../src/v3/player-physics.js";

const DT = 1 / 120;
const neutral = Object.freeze({ left: false, right: false, jumpPressed: false, jumpHeld: false });
const within = (value, range) => value >= range[0] && value <= range[1];
const testWall = Object.freeze([
  Object.freeze({ id: "left-wall", x: 100, y: 0, width: 60, height: 1400, role: "wall" }),
]);

function contactLeftWall(y = 320, vy = 0) {
  let player = createPlayer(160, y);
  player.vy = vy;
  player = stepPlayer(player, neutral, DT, testWall);
  return player;
}

function measureWallSlide() {
  let player = contactLeftWall(240, 760);
  let maximumAfterSettling = 0;
  let minimumY = player.y;
  for (let frame = 0; frame < 75; frame += 1) {
    player = stepPlayer(player, { ...neutral, left: true }, DT, testWall);
    if (frame > 35) maximumAfterSettling = Math.max(maximumAfterSettling, player.vy);
    minimumY = Math.min(minimumY, player.y);
  }
  return {
    wallSide: player.wallSide,
    sliding: player.wallSliding,
    settledSpeed: player.vy,
    maximumAfterSettling,
    movedUpWithoutJump: minimumY < 240,
    finalY: player.y,
  };
}

function measureWallJump() {
  let player = contactLeftWall(420, 120);
  player = stepPlayer(player, { ...neutral, jumpPressed: true, jumpHeld: true }, DT, testWall);
  return {
    wallJumped: player.wallJumpedThisFrame,
    vx: player.vx,
    vy: player.vy,
    wallSide: player.wallSide,
    lockRemaining: player.wallReattachRemaining,
    lastWallSide: player.lastWallSide,
  };
}

function measureContactGrace() {
  const contacted = contactLeftWall(420, 0);
  const graceState = {
    ...contacted,
    x: 166,
    wallSide: 0,
    lastWallSide: -1,
    wallContactRemaining: 0.075,
  };
  const graceJump = stepPlayer(
    graceState,
    { ...neutral, jumpPressed: true, jumpHeld: true },
    DT,
    testWall,
  );
  const expiredState = {
    ...contacted,
    x: 166,
    wallSide: 0,
    lastWallSide: -1,
    wallContactRemaining: 0,
    coyoteRemaining: 0,
    jumpsUsed: 1,
  };
  const expiredJump = stepPlayer(
    expiredState,
    { ...neutral, jumpPressed: true, jumpHeld: true },
    DT,
    testWall,
  );
  return {
    graceWorked: graceJump.wallJumpedThisFrame,
    graceVx: graceJump.vx,
    expiredRejected: !expiredJump.wallJumpedThisFrame && expiredJump.vy > -300,
  };
}

function measureReattachLock() {
  let player = contactLeftWall(500, 80);
  player = stepPlayer(player, { ...neutral, jumpPressed: true, jumpHeld: true }, DT, testWall);
  let touchedSameWallDuringLock = false;
  let minimumDistanceFromWall = Infinity;
  for (let frame = 0; frame < 12; frame += 1) {
    player = stepPlayer(player, { ...neutral, left: true, jumpHeld: true }, DT, testWall);
    touchedSameWallDuringLock ||= player.wallSide === -1;
    minimumDistanceFromWall = Math.min(minimumDistanceFromWall, player.x - 160);
  }
  return {
    touchedSameWallDuringLock,
    minimumDistanceFromWall,
    remaining: player.wallReattachRemaining,
  };
}

function measureCeilingCollision() {
  const ceiling = [
    Object.freeze({ id: "ceiling", x: 0, y: 100, width: 360, height: 30, role: "ceiling" }),
  ];
  let player = createPlayer(140, 180);
  player.vy = -620;
  let minimumY = player.y;
  let headStopped = false;
  for (let frame = 0; frame < 80; frame += 1) {
    const beforeVy = player.vy;
    player = stepPlayer(player, { ...neutral, jumpHeld: true }, DT, ceiling);
    minimumY = Math.min(minimumY, player.y);
    if (beforeVy < 0 && player.vy >= 0) headStopped = true;
  }
  return {
    minimumY,
    ceilingBottom: 130,
    headStopped,
    didNotPassThrough: minimumY >= 130 - 0.01,
  };
}

function measureRecoveryPlatform() {
  const platform = [
    Object.freeze({ id: "recovery", x: 100, y: 300, width: 180, height: 22, role: "recovery" }),
  ];
  let player = createPlayer(160, 370);
  player.vy = -900;
  let passedUpward = false;
  let landedFromAbove = false;
  for (let frame = 0; frame < 180; frame += 1) {
    player = stepPlayer(player, { ...neutral, jumpHeld: true }, DT, platform);
    if (player.y + PLAYER_PHYSICS.height < 300) passedUpward = true;
    if (player.grounded && Math.abs(player.y - (300 - PLAYER_PHYSICS.height)) < 0.01) {
      landedFromAbove = true;
      break;
    }
  }
  return { passedUpward, landedFromAbove, finalY: player.y };
}

function measureAlternatingClimb() {
  const solids = [
    Object.freeze({ id: "floor", x: 0, y: 1300, width: 600, height: 100, role: "terrain" }),
    Object.freeze({ id: "left", x: 100, y: 0, width: 60, height: 1300, role: "wall" }),
    Object.freeze({ id: "right", x: 420, y: 0, width: 60, height: 1300, role: "wall" }),
  ];
  let player = createPlayer(220, 1236);
  player.grounded = true;
  let direction = -1;
  let wallJumps = 0;
  let lastJumpFrame = -100;
  let holdUntilFrame = 42;
  let minimumY = player.y;
  let maximumSlideSpeed = 0;
  for (let frame = 0; frame < 900; frame += 1) {
    const initialJump = frame === 0;
    const wallJump = player.wallSide !== 0 && frame - lastJumpFrame > 12;
    if (wallJump) {
      direction = -player.wallSide;
      lastJumpFrame = frame;
      holdUntilFrame = frame + 38;
    }
    player = stepPlayer(player, {
      left: direction < 0,
      right: direction > 0,
      jumpPressed: initialJump || wallJump,
      jumpHeld: frame <= holdUntilFrame,
    }, DT, solids);
    if (player.wallJumpedThisFrame) wallJumps += 1;
    if (player.wallSliding) maximumSlideSpeed = Math.max(maximumSlideSpeed, player.vy);
    minimumY = Math.min(minimumY, player.y);
    if (minimumY < 380) break;
  }
  return {
    wallJumps,
    climbedHeight: 1236 - minimumY,
    minimumY,
    maximumSlideSpeed,
    finalX: player.x,
    finalY: player.y,
  };
}

const structuralAudit = validatePass04WallLevel();
const slide = measureWallSlide();
const jump = measureWallJump();
const grace = measureContactGrace();
const lock = measureReattachLock();
const ceiling = measureCeilingCollision();
const recovery = measureRecoveryPlatform();
const climb = measureAlternatingClimb();

const checks = [
  ...structuralAudit.checks,
  ["wallSlideDetected", slide.wallSide === -1 && slide.sliding],
  ["wallSlideSpeedInTarget", within(slide.settledSpeed, PASS04_TARGETS.wallSlideSpeed)],
  ["wallSlideDoesNotAccelerateForever", slide.maximumAfterSettling <= PASS04_TARGETS.wallSlideSpeed[1]],
  ["wallHoldDoesNotClimb", !slide.movedUpWithoutJump && slide.finalY > 240],
  ["wallJumpTriggered", jump.wallJumped],
  ["wallJumpMovesAway", within(jump.vx, PASS04_TARGETS.wallJumpHorizontalSpeed)],
  ["wallJumpMovesUp", within(-jump.vy, PASS04_TARGETS.wallJumpVerticalSpeed)],
  ["wallJumpClearsContact", jump.wallSide === 0 && jump.lastWallSide === -1],
  ["reattachLockSet", within(jump.lockRemaining, [0.1, PLAYER_PHYSICS.wallReattachLockTime])],
  ["contactGraceWorks", grace.graceWorked && grace.graceVx > 350],
  ["expiredContactGraceRejected", grace.expiredRejected],
  ["sameWallReattachBlocked", !lock.touchedSameWallDuringLock],
  ["wallJumpCreatesSeparation", lock.minimumDistanceFromWall > 0],
  ["ceilingStopsHead", ceiling.headStopped && ceiling.didNotPassThrough],
  ["recoveryPlatformPassesFromBelow", recovery.passedUpward],
  ["recoveryPlatformCatchesFromAbove", recovery.landedFromAbove],
  ["alternatingClimbReachesTarget", climb.climbedHeight > 800],
  ["alternatingClimbJumpCountReasonable", climb.wallJumps >= 7 && climb.wallJumps <= 14],
].map(check => Array.isArray(check)
  ? { name: check[0], passed: Boolean(check[1]) }
  : check);

const result = {
  pass: 4,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    wallSlideSettledSpeed: Number(slide.settledSpeed.toFixed(2)),
    wallJumpVx: Number(jump.vx.toFixed(2)),
    wallJumpVy: Number(jump.vy.toFixed(2)),
    contactGraceWorked: grace.graceWorked,
    expiredGraceRejected: grace.expiredRejected,
    sameWallTouchedDuringLock: lock.touchedSameWallDuringLock,
    ceilingMinimumY: Number(ceiling.minimumY.toFixed(2)),
    recoveryPlatformPassedUpward: recovery.passedUpward,
    recoveryPlatformLandedFromAbove: recovery.landedFromAbove,
    alternatingWallJumps: climb.wallJumps,
    alternatingClimbHeight: Number(climb.climbedHeight.toFixed(2)),
    alternatingMaximumSlideSpeed: Number(climb.maximumSlideSpeed.toFixed(2)),
  },
};

if (process.env.CORELESS_V3_PASS04_RESULT) {
  const output = path.resolve(process.env.CORELESS_V3_PASS04_RESULT);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
