import {
  RESET_AIR_MOVEMENT,
  RESET_PASS03_BUILD,
  createResetAirPlayer,
  stepResetAirPlayer,
  validateResetPass03AirMovement,
} from "./reset-pass03-air-movement.js";
import {
  RESET_GROUND_MOVEMENT,
} from "./reset-pass02-ground-movement.js";

export const RESET_PASS04_BUILD = Object.freeze({
  id: "rebuild-v4-reset-pass04-collision",
  pass: 4,
  branch: "rebuild/mega-room-v4-40pass",
  scope: "smooth slopes, walls, ceilings, and corner collision",
  finalArtIncluded: false,
});

export const RESET_COLLISION_CONTRACT = Object.freeze({
  maximumWalkableSlopeDegrees: 32,
  maximumAdjacentSlopeChangeDegrees: 8,
  minimumSlopeSegmentLength: 140,
  slopeGroundSnapTolerance: 0.8,
  collisionEpsilon: 0.01,
  automaticWallClimbAllowed: false,
  automaticCornerVaultAllowed: false,
  wallJumpIncluded: false,
});

export const RESET_PASS04_LAB = Object.freeze({
  width: 3400,
  height: 900,
  viewportWidth: 1400,
  viewportHeight: 900,
  floorY: 720,
  spawnX: 90,
  finishX: 3290,
  leftBoundary: 20,
  rightBoundary: 3380,
});

const radians = degrees => degrees * Math.PI / 180;

const buildTerrain = () => {
  const specifications = [
    { id: "entry-flat", length: 200, angle: 0 },
    { id: "rise-08", length: 140, angle: -8 },
    { id: "rise-16", length: 140, angle: -16 },
    { id: "rise-24", length: 140, angle: -24 },
    { id: "rise-32", length: 140, angle: -32 },
    { id: "crest-soften-24", length: 140, angle: -24 },
    { id: "crest-soften-16", length: 140, angle: -16 },
    { id: "crest-soften-08", length: 140, angle: -8 },
    { id: "crest-flat", length: 140, angle: 0 },
    { id: "fall-08", length: 140, angle: 8 },
    { id: "fall-16", length: 140, angle: 16 },
    { id: "fall-24", length: 140, angle: 24 },
    { id: "fall-32", length: 140, angle: 32 },
    { id: "fall-soften-24", length: 140, angle: 24 },
    { id: "fall-soften-16", length: 140, angle: 16 },
    { id: "fall-soften-08", length: 140, angle: 8 },
    { id: "exit-flat", length: 1100, angle: 0 },
  ];
  let x = 0;
  let y = RESET_PASS04_LAB.floorY;
  return specifications.map(item => {
    const y2 = y + Math.tan(radians(item.angle)) * item.length;
    const segment = Object.freeze({
      id: item.id,
      x1: x,
      y1: y,
      x2: x + item.length,
      y2,
      length: item.length,
      angleDegrees: item.angle,
    });
    x += item.length;
    y = y2;
    return segment;
  });
};

export const RESET_PASS04_TERRAIN = Object.freeze(buildTerrain());

export const RESET_PASS04_SOLIDS = Object.freeze([
  Object.freeze({
    id: "wall-step",
    role: "wall-and-landing",
    x: 2550,
    y: 600,
    width: 220,
    height: 120,
    topWalkable: true,
  }),
  Object.freeze({
    id: "overhead-beam",
    role: "ceiling",
    x: 2920,
    y: 0,
    width: 320,
    height: 620,
    topWalkable: false,
  }),
]);

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

export function terrainSegmentAt(x) {
  if (x < RESET_PASS04_TERRAIN[0].x1 ||
    x > RESET_PASS04_TERRAIN.at(-1).x2) {
    return null;
  }
  return RESET_PASS04_TERRAIN.find((segment, index) =>
    x >= segment.x1 &&
    (
      x < segment.x2 ||
      (index === RESET_PASS04_TERRAIN.length - 1 &&
        x <= segment.x2)
    )) ?? null;
}

export function terrainHeightAt(x) {
  const segment = terrainSegmentAt(x);
  if (!segment) return null;
  const ratio = (x - segment.x1) / (segment.x2 - segment.x1);
  return segment.y1 + (segment.y2 - segment.y1) * ratio;
}

const horizontalOverlap = (player, solid) =>
  player.x + RESET_GROUND_MOVEMENT.playerWidth > solid.x &&
  player.x < solid.x + solid.width;

const verticalOverlap = (player, solid) =>
  player.y + RESET_GROUND_MOVEMENT.playerHeight > solid.y &&
  player.y < solid.y + solid.height;

const createTerrainSupport = current => {
  const centerX = current.x + RESET_GROUND_MOVEMENT.playerWidth / 2;
  const segment = terrainSegmentAt(centerX);
  if (!segment) return null;
  const height = terrainHeightAt(centerX);
  const feet = current.y + RESET_GROUND_MOVEMENT.playerHeight;
  if (!current.grounded ||
    Math.abs(feet - height) >
      RESET_COLLISION_CONTRACT.slopeGroundSnapTolerance) {
    return null;
  }
  return {
    id: `terrain-support-${segment.id}`,
    x: segment.x1 - RESET_GROUND_MOVEMENT.playerWidth,
    y: feet,
    width:
      segment.x2 - segment.x1 +
      RESET_GROUND_MOVEMENT.playerWidth * 2,
    height: RESET_PASS04_LAB.height,
  };
};

const walkableSolids = RESET_PASS04_SOLIDS.filter(item =>
  item.topWalkable);

function launchBufferedJump(player) {
  player.vy = -RESET_AIR_MOVEMENT.jumpSpeed;
  player.grounded = false;
  player.coyoteRemaining = 0;
  player.jumpBufferRemaining = 0;
  player.minimumJumpHoldRemaining =
    RESET_AIR_MOVEMENT.minimumJumpHoldSeconds;
  player.jumpsStarted += 1;
  player.lastJumpSource = "buffered-landing";
  player.events.jumped = true;
  player.events.jumpSource = "buffered-landing";
}

export function createResetCollisionPlayer({
  x = RESET_PASS04_LAB.spawnX,
} = {}) {
  const floorY = terrainHeightAt(
    x + RESET_GROUND_MOVEMENT.playerWidth / 2,
  );
  return createResetAirPlayer({ x, floorY });
}

export function stepResetCollisionPlayer(current, input, dt) {
  const terrainSupport = createTerrainSupport(current);
  const baseSolids = terrainSupport
    ? [terrainSupport, ...walkableSolids]
    : walkableSolids;
  const before = current;
  let player = stepResetAirPlayer(
    current,
    input,
    dt,
    baseSolids,
  );
  player.events = {
    ...player.events,
    wallHit: null,
    ceilingHit: null,
    slopeAdjusted: false,
    slopeAdjustment: 0,
    autoVaulted: false,
  };

  for (const solid of RESET_PASS04_SOLIDS) {
    if (!verticalOverlap(player, solid)) continue;
    const beforeRight =
      before.x + RESET_GROUND_MOVEMENT.playerWidth;
    const nextRight =
      player.x + RESET_GROUND_MOVEMENT.playerWidth;
    if (
      player.vx > 0 &&
      beforeRight <= solid.x + RESET_COLLISION_CONTRACT.collisionEpsilon &&
      nextRight > solid.x
    ) {
      player.x = solid.x - RESET_GROUND_MOVEMENT.playerWidth;
      player.vx = 0;
      player.events.wallHit = solid.id;
    } else if (
      player.vx < 0 &&
      before.x >=
        solid.x + solid.width -
        RESET_COLLISION_CONTRACT.collisionEpsilon &&
      player.x < solid.x + solid.width
    ) {
      player.x = solid.x + solid.width;
      player.vx = 0;
      player.events.wallHit = solid.id;
    }
  }

  if (player.vy < 0) {
    for (const solid of RESET_PASS04_SOLIDS) {
      const ceilingBottom = solid.y + solid.height;
      if (
        horizontalOverlap(player, solid) &&
        before.y >=
          ceilingBottom -
          RESET_COLLISION_CONTRACT.collisionEpsilon &&
        player.y < ceilingBottom
      ) {
        player.y = ceilingBottom;
        player.vy = 0;
        player.state = "apex";
        player.events.ceilingHit = solid.id;
      }
    }
  }

  const beforeCenter =
    before.x + RESET_GROUND_MOVEMENT.playerWidth / 2;
  const nextCenter =
    player.x + RESET_GROUND_MOVEMENT.playerWidth / 2;
  const beforeTerrainHeight = terrainHeightAt(beforeCenter);
  const nextTerrainHeight = terrainHeightAt(nextCenter);
  const beforeFeet =
    before.y + RESET_GROUND_MOVEMENT.playerHeight;
  const nextFeet =
    player.y + RESET_GROUND_MOVEMENT.playerHeight;
  const wasOnTerrain =
    before.grounded &&
    beforeTerrainHeight !== null &&
    Math.abs(beforeFeet - beforeTerrainHeight) <=
      RESET_COLLISION_CONTRACT.slopeGroundSnapTolerance;

  if (player.grounded && wasOnTerrain && nextTerrainHeight !== null) {
    const targetY =
      nextTerrainHeight - RESET_GROUND_MOVEMENT.playerHeight;
    const adjustment = targetY - player.y;
    player.y = targetY;
    player.events.slopeAdjusted = Math.abs(adjustment) > 0.0001;
    player.events.slopeAdjustment = adjustment;
  } else if (
    !player.grounded &&
    player.vy >= 0 &&
    nextTerrainHeight !== null &&
    beforeFeet <=
      beforeTerrainHeight + RESET_COLLISION_CONTRACT.collisionEpsilon &&
    nextFeet >= nextTerrainHeight
  ) {
    const landingSpeed = player.vy;
    player.y =
      nextTerrainHeight - RESET_GROUND_MOVEMENT.playerHeight;
    player.vy = 0;
    player.grounded = true;
    player.coyoteRemaining = RESET_AIR_MOVEMENT.coyoteSeconds;
    player.landings += 1;
    player.lastLandingSpeed = landingSpeed;
    player.events.landed = true;
    if (player.jumpBufferRemaining > 0) {
      launchBufferedJump(player);
    } else {
      player.state = landingSpeed >= RESET_AIR_MOVEMENT.hardLandingSpeed
        ? "hard-land"
        : "soft-land";
    }
  } else if (
    player.grounded &&
    wasOnTerrain &&
    nextTerrainHeight === null
  ) {
    player.grounded = false;
    player.events.walkedOff = true;
  }

  player.x = clamp(
    player.x,
    RESET_PASS04_LAB.leftBoundary,
    RESET_PASS04_LAB.rightBoundary -
      RESET_GROUND_MOVEMENT.playerWidth,
  );
  player.lastPositionStep = Math.hypot(
    player.x - before.x,
    player.y - before.y,
  );
  return player;
}

function simulateSlopeTraversal() {
  let player = createResetCollisionPlayer({ x: 80 });
  let seconds = 0;
  let maximumVerticalStep = 0;
  let maximumPositionStep = 0;
  let airborneFrames = 0;
  let maximumAdjustment = 0;
  const visitedSegments = new Set();
  while (player.x < 2380 && seconds < 12) {
    const before = player;
    player = stepResetCollisionPlayer(
      player,
      { right: true },
      RESET_GROUND_MOVEMENT.fixedStep,
    );
    maximumVerticalStep = Math.max(
      maximumVerticalStep,
      Math.abs(player.y - before.y),
    );
    maximumPositionStep = Math.max(
      maximumPositionStep,
      player.lastPositionStep,
    );
    maximumAdjustment = Math.max(
      maximumAdjustment,
      Math.abs(player.events.slopeAdjustment),
    );
    if (!player.grounded) airborneFrames += 1;
    const segment = terrainSegmentAt(
      player.x + RESET_GROUND_MOVEMENT.playerWidth / 2,
    );
    if (segment) visitedSegments.add(segment.id);
    seconds += RESET_GROUND_MOVEMENT.fixedStep;
  }
  return Object.freeze({
    completed: player.x >= 2380,
    seconds,
    maximumVerticalStep,
    maximumPositionStep,
    maximumAdjustment,
    airborneFrames,
    visitedSegments: Object.freeze([...visitedSegments]),
    endY: player.y,
    endSpeed: player.vx,
  });
}

function simulateWallBlock() {
  let player = createResetCollisionPlayer({ x: 2390 });
  player.vx = RESET_GROUND_MOVEMENT.maximumRunSpeed;
  player.state = "run-loop";
  const startY = player.y;
  let wallHits = 0;
  let maximumYChange = 0;
  for (let frame = 0; frame < 180; frame += 1) {
    player = stepResetCollisionPlayer(
      player,
      { right: true },
      RESET_GROUND_MOVEMENT.fixedStep,
    );
    if (player.events.wallHit === "wall-step") wallHits += 1;
    maximumYChange = Math.max(
      maximumYChange,
      Math.abs(player.y - startY),
    );
  }
  return Object.freeze({
    wallHits,
    x: player.x,
    y: player.y,
    startY,
    maximumYChange,
    verticalSpeed: player.vy,
    grounded: player.grounded,
  });
}

function simulateCeilingBlock() {
  let player = createResetCollisionPlayer({ x: 3000 });
  let ceilingHits = 0;
  let minimumY = player.y;
  let pressed = false;
  let frames = 0;
  while (frames < 180 && player.landings < 1) {
    player = stepResetCollisionPlayer(
      player,
      {
        jumpPressed: !pressed,
        jumpHeld: frames < 80,
      },
      RESET_GROUND_MOVEMENT.fixedStep,
    );
    pressed = true;
    if (player.events.ceilingHit === "overhead-beam") {
      ceilingHits += 1;
    }
    minimumY = Math.min(minimumY, player.y);
    frames += 1;
  }
  return Object.freeze({
    ceilingHits,
    minimumY,
    ceilingBottom:
      RESET_PASS04_SOLIDS.find(item =>
        item.id === "overhead-beam").height,
    grounded: player.grounded,
    landings: player.landings,
  });
}

function simulateRestOnSlope() {
  let player = createResetCollisionPlayer({ x: 720 });
  const startX = player.x;
  const startY = player.y;
  for (let frame = 0; frame < 240; frame += 1) {
    player = stepResetCollisionPlayer(
      player,
      {},
      RESET_GROUND_MOVEMENT.fixedStep,
    );
  }
  return Object.freeze({
    xDrift: player.x - startX,
    yDrift: player.y - startY,
    grounded: player.grounded,
  });
}

export function measureResetPass04Collision() {
  const adjacentAngleChanges = RESET_PASS04_TERRAIN
    .slice(1)
    .map((segment, index) => Math.abs(
      segment.angleDegrees -
      RESET_PASS04_TERRAIN[index].angleDegrees,
    ));
  return Object.freeze({
    slopeTraversal: simulateSlopeTraversal(),
    wallBlock: simulateWallBlock(),
    ceilingBlock: simulateCeilingBlock(),
    restOnSlope: simulateRestOnSlope(),
    terrain: Object.freeze({
      segments: RESET_PASS04_TERRAIN.length,
      maximumAbsoluteAngle: Math.max(
        ...RESET_PASS04_TERRAIN.map(item =>
          Math.abs(item.angleDegrees)),
      ),
      maximumAdjacentAngleChange: Math.max(...adjacentAngleChanges),
      minimumSegmentLength: Math.min(
        ...RESET_PASS04_TERRAIN.map(item => item.length),
      ),
      finalHeight: RESET_PASS04_TERRAIN.at(-1).y2,
    }),
  });
}

export function validateResetPass04Collision() {
  const pass03 = validateResetPass03AirMovement();
  const measurements = measureResetPass04Collision();
  const wall = RESET_PASS04_SOLIDS.find(item =>
    item.id === "wall-step");
  const ceiling = RESET_PASS04_SOLIDS.find(item =>
    item.id === "overhead-beam");
  const checks = [
    ["resetPass03StillValid", pass03.passed],
    ["passSequenceIsCorrect",
      RESET_PASS03_BUILD.pass === 3 && RESET_PASS04_BUILD.pass === 4],
    ["slopeTraversalCompletes",
      measurements.slopeTraversal.completed],
    ["allSlopeSegmentsVisited",
      measurements.slopeTraversal.visitedSegments.length ===
      RESET_PASS04_TERRAIN.length],
    ["slopeTraversalNeverBecomesAirborne",
      measurements.slopeTraversal.airborneFrames === 0],
    ["maximumSlopeBounded",
      measurements.terrain.maximumAbsoluteAngle <=
      RESET_COLLISION_CONTRACT.maximumWalkableSlopeDegrees],
    ["adjacentSlopeChangeBounded",
      measurements.terrain.maximumAdjacentAngleChange <=
      RESET_COLLISION_CONTRACT.maximumAdjacentSlopeChangeDegrees],
    ["slopeBlendLengthBounded",
      measurements.terrain.minimumSegmentLength >=
      RESET_COLLISION_CONTRACT.minimumSlopeSegmentLength],
    ["slopeRouteReturnsToFloor",
      Math.abs(
        measurements.terrain.finalHeight -
        RESET_PASS04_LAB.floorY,
      ) <= 0.001],
    ["slopeVerticalStepBounded",
      measurements.slopeTraversal.maximumVerticalStep <= 2.1],
    ["slopeCombinedStepBounded",
      measurements.slopeTraversal.maximumPositionStep <= 4],
    ["slopeAdjustmentBounded",
      measurements.slopeTraversal.maximumAdjustment <= 2.1],
    ["restingPlayerDoesNotSlide",
      Math.abs(measurements.restOnSlope.xDrift) <= 0.001 &&
      Math.abs(measurements.restOnSlope.yDrift) <= 0.001],
    ["restingPlayerStaysGrounded",
      measurements.restOnSlope.grounded],
    ["wallBlocksRepeatedInput",
      measurements.wallBlock.wallHits >= 1 &&
      Math.abs(
        measurements.wallBlock.x -
        (wall.x - RESET_GROUND_MOVEMENT.playerWidth),
      ) <= 0.001],
    ["wallNeverMovesPlayerUp",
      measurements.wallBlock.maximumYChange <= 0.001 &&
      measurements.wallBlock.y === measurements.wallBlock.startY],
    ["wallLeavesVerticalVelocityZero",
      measurements.wallBlock.verticalSpeed === 0 &&
      measurements.wallBlock.grounded],
    ["ceilingCollisionObserved",
      measurements.ceilingBlock.ceilingHits >= 1],
    ["ceilingCannotBeCrossed",
      measurements.ceilingBlock.minimumY >=
      measurements.ceilingBlock.ceilingBottom],
    ["ceilingJumpReturnsToGround",
      measurements.ceilingBlock.grounded &&
      measurements.ceilingBlock.landings === 1],
    ["wallHasMeaningfulLandingTop",
      wall.role === "wall-and-landing" && wall.topWalkable],
    ["ceilingContinuesOutOfView",
      ceiling.y === 0 && !ceiling.topWalkable],
    ["automaticWallClimbForbidden",
      !RESET_COLLISION_CONTRACT.automaticWallClimbAllowed],
    ["automaticCornerVaultForbidden",
      !RESET_COLLISION_CONTRACT.automaticCornerVaultAllowed],
    ["wallJumpDeferred",
      !RESET_COLLISION_CONTRACT.wallJumpIncluded],
    ["noFinalArt", RESET_PASS04_BUILD.finalArtIncluded === false],
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
