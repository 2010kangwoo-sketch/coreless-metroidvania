import fs from "node:fs";
import path from "node:path";
import {
  PASS05_SOLIDS,
  PASS05_TARGETS,
  validatePass05SlopeLevel,
} from "../src/v3/pass05-slope-level.js";
import {
  PLAYER_PHYSICS,
  createPlayer,
  slopeSurfaceYAt,
  stepPlayer,
} from "../src/v3/player-physics.js";

const DT = 1 / 120;
const neutral = Object.freeze({ left: false, right: false, jumpPressed: false, jumpHeld: false });
const right = Object.freeze({ left: false, right: true, jumpPressed: false, jumpHeld: false });
const slopeById = id => PASS05_SOLIDS.find(item => item.id === id);

function createStartPlayer() {
  const player = createPlayer(120, 696);
  player.grounded = true;
  return player;
}

function measureGentleTraversal() {
  let player = createStartPlayer();
  let maximumGroundStep = 0;
  let maximumVerticalStep = 0;
  let slopeFrames = 0;
  let uphillYIncreased = false;
  let previousSlopeY = Infinity;
  for (let frame = 0; frame < 500 && player.x < 1000; frame += 1) {
    const before = player;
    player = stepPlayer(player, right, DT, PASS05_SOLIDS);
    if (player.grounded) {
      maximumGroundStep = Math.max(
        maximumGroundStep,
        Math.hypot(player.x - before.x, player.y - before.y),
      );
    }
    if (player.standingSlopeId === "gentle-climb") {
      slopeFrames += 1;
      maximumVerticalStep = Math.max(maximumVerticalStep, Math.abs(player.y - before.y));
      if (player.y > previousSlopeY + 0.01) uphillYIncreased = true;
      previousSlopeY = player.y;
    }
  }
  const releaseX = player.x;
  for (let frame = 0; frame < 120; frame += 1) {
    player = stepPlayer(player, neutral, DT, PASS05_SOLIDS);
  }
  return {
    maximumGroundStep,
    maximumVerticalStep,
    slopeFrames,
    uphillYIncreased,
    releaseTravel: player.x - releaseX,
    releasedSpeed: player.vx,
    stoppedOnCrest: player.grounded && player.y === 546,
  };
}

function measureSlopeJumpLanding() {
  const slope = slopeById("gentle-climb");
  const x = 500;
  let player = createPlayer(x, slopeSurfaceYAt(slope, x + PLAYER_PHYSICS.width / 2) - PLAYER_PHYSICS.height);
  player.grounded = true;
  player.standingSlopeId = slope.id;
  player.slopeGrade = -slope.height / slope.width;
  player = stepPlayer(
    player,
    { left: false, right: true, jumpPressed: true, jumpHeld: true },
    DT,
    PASS05_SOLIDS,
  );
  const detachedOnJump = !player.grounded && player.standingSlopeId === null && player.vy < 0;
  let landedOnSlope = false;
  let minimumY = player.y;
  for (let frame = 1; frame < 150; frame += 1) {
    player = stepPlayer(
      player,
      { left: false, right: true, jumpPressed: false, jumpHeld: frame < 38 },
      DT,
      PASS05_SOLIDS,
    );
    minimumY = Math.min(minimumY, player.y);
    if (player.slopeLandedThisFrame && player.standingSlopeId === slope.id) {
      landedOnSlope = true;
      break;
    }
  }
  return {
    detachedOnJump,
    landedOnSlope,
    minimumY,
    landingX: player.x,
    landingY: player.y,
  };
}

function measurePassFromBelow() {
  const slope = slopeById("gentle-climb");
  const x = 500;
  const surfaceY = slopeSurfaceYAt(slope, x + PLAYER_PHYSICS.width / 2);
  let player = createPlayer(x, surfaceY + 70);
  player.vy = -900;
  let attachedWhileRising = false;
  let passedAboveSurface = false;
  let landedAfterFalling = false;
  for (let frame = 0; frame < 180; frame += 1) {
    player = stepPlayer(player, { ...neutral, jumpHeld: true }, DT, PASS05_SOLIDS);
    if (player.vy < 0 && player.standingSlopeId) attachedWhileRising = true;
    if (player.y + PLAYER_PHYSICS.height < surfaceY) passedAboveSurface = true;
    if (player.slopeLandedThisFrame) {
      landedAfterFalling = true;
      break;
    }
  }
  return { attachedWhileRising, passedAboveSurface, landedAfterFalling };
}

function measureSteepRelease() {
  let player = createStartPlayer();
  for (let frame = 0; frame < 700 && player.x < 1240; frame += 1) {
    player = stepPlayer(player, right, DT, PASS05_SOLIDS);
  }
  const releaseX = player.x;
  let maximumVerticalStep = 0;
  let movedUpUnexpectedly = false;
  let previousY = player.y;
  for (let frame = 0; frame < 90; frame += 1) {
    const before = player;
    player = stepPlayer(player, neutral, DT, PASS05_SOLIDS);
    maximumVerticalStep = Math.max(maximumVerticalStep, Math.abs(player.y - before.y));
    if (player.y < previousY - 0.01) movedUpUnexpectedly = true;
    previousY = player.y;
  }
  return {
    travel: player.x - releaseX,
    finalSpeed: player.vx,
    maximumVerticalStep,
    movedUpUnexpectedly,
    stillGrounded: player.grounded,
    slopeId: player.standingSlopeId,
  };
}

function measureWholeRoute() {
  let player = createStartPlayer();
  const visited = new Set();
  let maximumGroundStep = 0;
  let leftGroundUnexpectedly = false;
  for (let frame = 0; frame < 1400 && player.x < 2750; frame += 1) {
    const before = player;
    player = stepPlayer(player, right, DT, PASS05_SOLIDS);
    if (player.standingSlopeId) visited.add(player.standingSlopeId);
    if (player.grounded) {
      maximumGroundStep = Math.max(
        maximumGroundStep,
        Math.hypot(player.x - before.x, player.y - before.y),
      );
    } else if (frame > 30) {
      leftGroundUnexpectedly = true;
    }
  }
  return {
    visited: [...visited],
    maximumGroundStep,
    leftGroundUnexpectedly,
    finalX: player.x,
    finalY: player.y,
    grounded: player.grounded,
  };
}

const structuralAudit = validatePass05SlopeLevel();
const gentle = measureGentleTraversal();
const jump = measureSlopeJumpLanding();
const below = measurePassFromBelow();
const steep = measureSteepRelease();
const route = measureWholeRoute();

const checks = [
  ...structuralAudit.checks,
  ["gentleSlopeStayedGrounded", gentle.slopeFrames > 120],
  ["gentleSlopeNeverMovedDownhillWhileClimbing", !gentle.uphillYIncreased],
  ["gentleSlopeStepBounded", gentle.maximumGroundStep <= PASS05_TARGETS.maximumGroundStep],
  ["gentleSlopeVerticalStepBounded", gentle.maximumVerticalStep < 3],
  ["gentleReleaseStops", Math.abs(gentle.releasedSpeed) <= PASS05_TARGETS.gentleReleaseStopSpeed],
  ["gentleReleaseTravelShort", gentle.releaseTravel < 80 && gentle.stoppedOnCrest],
  ["jumpDetachesFromSlope", jump.detachedOnJump],
  ["jumpLandsBackOnSlope", jump.landedOnSlope],
  ["jumpHasVisibleArc", jump.minimumY < 520],
  ["slopePassesPlayerFromBelow", below.passedAboveSurface && !below.attachedWhileRising],
  ["slopeCatchesPlayerFromAbove", below.landedAfterFalling],
  ["steepReleaseMovesDownhill", steep.travel >= PASS05_TARGETS.steepReleaseMinimumTravel],
  ["steepReleaseKeepsNaturalSlide", steep.finalSpeed >= 160 && steep.finalSpeed <= PASS05_TARGETS.maximumSteepSlideSpeed],
  ["steepDescentNeverMovesUp", !steep.movedUpUnexpectedly],
  ["steepDescentStepBounded", steep.maximumVerticalStep < 4 && steep.stillGrounded],
  ["wholeRouteVisitsAllPurposefulSlopes", route.visited.length === 3],
  ["wholeRouteNeverDropsGroundContact", !route.leftGroundUnexpectedly],
  ["wholeRouteEndsOnExit", route.grounded && route.finalX >= 2750 && route.finalY === 636],
].map(check => Array.isArray(check)
  ? { name: check[0], passed: Boolean(check[1]) }
  : check);

const result = {
  pass: 5,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    gentleMaximumGroundStep: Number(gentle.maximumGroundStep.toFixed(3)),
    gentleMaximumVerticalStep: Number(gentle.maximumVerticalStep.toFixed(3)),
    gentleReleasedSpeed: Number(gentle.releasedSpeed.toFixed(2)),
    gentleReleaseTravel: Number(gentle.releaseTravel.toFixed(2)),
    jumpLandingX: Number(jump.landingX.toFixed(2)),
    jumpLandingY: Number(jump.landingY.toFixed(2)),
    jumpMinimumY: Number(jump.minimumY.toFixed(2)),
    steepReleaseTravel: Number(steep.travel.toFixed(2)),
    steepReleaseFinalSpeed: Number(steep.finalSpeed.toFixed(2)),
    steepMaximumVerticalStep: Number(steep.maximumVerticalStep.toFixed(3)),
    visitedSlopes: route.visited,
    wholeRouteMaximumGroundStep: Number(route.maximumGroundStep.toFixed(3)),
    wholeRouteFinalX: Number(route.finalX.toFixed(2)),
    wholeRouteFinalY: Number(route.finalY.toFixed(2)),
  },
};

if (process.env.CORELESS_V3_PASS05_RESULT) {
  const output = path.resolve(process.env.CORELESS_V3_PASS05_RESULT);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
