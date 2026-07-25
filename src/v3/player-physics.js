export const PLAYER_PHYSICS = Object.freeze({
  width: 38,
  height: 64,
  runSpeed: 420,
  groundAcceleration: 900,
  turnAcceleration: 1900,
  airAcceleration: 820,
  airTurnAcceleration: 1280,
  groundDeceleration: 3300,
  airDeceleration: 180,
  jumpSpeed: 720,
  doubleJumpSpeed: 690,
  gravity: 1900,
  apexGravityMultiplier: 0.86,
  fallingGravityMultiplier: 1.24,
  releasedJumpGravityMultiplier: 2.15,
  maximumFallSpeed: 1050,
  coyoteTime: 0.11,
  jumpBufferTime: 0.12,
  maximumEdgeCorrection: 10,
  wallProbeDistance: 3,
  wallSlideSpeed: 170,
  wallSlideAcceleration: 7200,
  wallJumpHorizontalSpeed: 390,
  wallJumpVerticalSpeed: 680,
  wallContactGraceTime: 0.1,
  wallReattachLockTime: 0.12,
  slopeSnapDistance: 8,
  slopeRestGrade: 0.32,
  slopeGroundDeceleration: 1400,
  slopeGravityAcceleration: 620,
  slopeMaximumSlideSpeed: 280,
  slopeUphillSpeedFactor: 0.82,
  slopeDownhillSpeedFactor: 1.05,
});

export const CAMERA_PHYSICS = Object.freeze({
  viewportWidth: 1200,
  viewportHeight: 680,
  followHalfLife: 0.1,
  verticalFollowHalfLife: 0.16,
  horizontalLookAhead: 115,
  verticalBias: 34,
  verticalDeadZone: 64,
});

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const approach = (value, target, amount) =>
  value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);

export function createPlayer(x, y) {
  return {
    x,
    y,
    previousX: x,
    previousY: y,
    vx: 0,
    vy: 0,
    grounded: false,
    coyoteRemaining: 0,
    jumpBufferRemaining: 0,
    jumpsUsed: 0,
    facing: 1,
    turning: false,
    landedThisFrame: false,
    edgeCorrectedThisFrame: false,
    wallSide: 0,
    lastWallSide: 0,
    wallContactRemaining: 0,
    wallReattachRemaining: 0,
    wallSliding: false,
    wallJumpedThisFrame: false,
    standingSlopeId: null,
    slopeGrade: 0,
    slopeLandedThisFrame: false,
    abilities: { doubleJump: false },
  };
}

const overlaps = (player, solid) =>
  player.x < solid.x + solid.width &&
  player.x + PLAYER_PHYSICS.width > solid.x &&
  player.y < solid.y + solid.height &&
  player.y + PLAYER_PHYSICS.height > solid.y;

const overlapsAt = (player, solid, x, y) =>
  x < solid.x + solid.width &&
  x + PLAYER_PHYSICS.width > solid.x &&
  y < solid.y + solid.height &&
  y + PLAYER_PHYSICS.height > solid.y;

export function slopeSurfaceYAt(slope, worldX) {
  const progress = clamp((worldX - slope.x) / slope.width, 0, 1);
  return slope.direction === "up-right"
    ? slope.y + slope.height * (1 - progress)
    : slope.y + slope.height * progress;
}

function slopeGradeOf(slope) {
  const grade = slope.height / slope.width;
  return slope.direction === "up-right" ? -grade : grade;
}

const isFlatGroundRole = role => role === "terrain" || role === "rest" || role === "exit";

function isFlatConnectedToSlope(solid, slope) {
  if (!slope || !isFlatGroundRole(solid.role)) return false;
  const leftConnected =
    Math.abs(solid.x + solid.width - slope.x) < 0.01 &&
    Math.abs(solid.y - slopeSurfaceYAt(slope, slope.x)) < 0.01;
  const rightConnected =
    Math.abs(solid.x - (slope.x + slope.width)) < 0.01 &&
    Math.abs(solid.y - slopeSurfaceYAt(slope, slope.x + slope.width)) < 0.01;
  return leftConnected || rightConnected;
}

function detectWallSide(player, solids) {
  const wallSolids = solids.filter(solid => solid.role === "wall");
  const probe = PLAYER_PHYSICS.wallProbeDistance;
  const touchesLeft = wallSolids.some(solid => overlapsAt(player, solid, player.x - probe, player.y));
  const touchesRight = wallSolids.some(solid => overlapsAt(player, solid, player.x + probe, player.y));
  if (touchesLeft === touchesRight) return 0;
  return touchesLeft ? -1 : 1;
}

function moveHorizontal(player, solids, dt) {
  player.x += player.vx * dt;
  const standingSlope = solids.find(solid =>
    solid.role === "slope" && solid.id === player.standingSlopeId);
  for (const solid of solids) {
    if (solid.role === "recovery" || solid.role === "slope") continue;
    if (isFlatConnectedToSlope(solid, standingSlope)) continue;
    if (!overlaps(player, solid)) continue;
    const feetPenetration = player.y + PLAYER_PHYSICS.height - solid.y;
    const canCorrectEdge =
      !player.standingSlopeId &&
      solid.role !== "ceiling" &&
      solid.role !== "wall" &&
      feetPenetration > 0 &&
      feetPenetration <= PLAYER_PHYSICS.maximumEdgeCorrection &&
      player.vy >= 0;
    if (canCorrectEdge) {
      player.y -= feetPenetration;
      player.grounded = true;
      player.jumpsUsed = 0;
      player.edgeCorrectedThisFrame = true;
      continue;
    }
    if (player.vx > 0) player.x = solid.x - PLAYER_PHYSICS.width;
    else if (player.vx < 0) player.x = solid.x + solid.width;
    player.vx = 0;
  }
}

function moveVertical(player, solids, dt) {
  player.grounded = false;
  player.y += player.vy * dt;
  const standingSlope = solids.find(solid =>
    solid.role === "slope" && solid.id === player.standingSlopeId);
  for (const solid of solids) {
    if (solid.role === "slope") continue;
    if (solid.role === "recovery" && player.vy < 0) continue;
    if (isFlatConnectedToSlope(solid, standingSlope)) continue;
    if (!overlaps(player, solid)) continue;
    if (player.vy >= 0 && player.previousY + PLAYER_PHYSICS.height <= solid.y + 3) {
      player.y = solid.y - PLAYER_PHYSICS.height;
      player.vy = 0;
      player.grounded = true;
      player.jumpsUsed = 0;
      player.landedThisFrame = true;
    } else if (player.vy < 0 && player.previousY >= solid.y + solid.height - 3) {
      player.y = solid.y + solid.height;
      player.vy = 0;
    }
  }
}

function resolveSlopes(player, current, solids) {
  if (player.vy < 0) {
    player.standingSlopeId = null;
    player.slopeGrade = 0;
    return;
  }
  const feetX = player.x + PLAYER_PHYSICS.width / 2;
  const previousFeetY = current.y + PLAYER_PHYSICS.height;
  const currentFeetY = player.y + PLAYER_PHYSICS.height;
  let candidate = null;
  for (const slope of solids) {
    if (slope.role !== "slope" || feetX < slope.x || feetX > slope.x + slope.width) continue;
    const surfaceY = slopeSurfaceYAt(slope, feetX);
    const wasStanding = current.standingSlopeId === slope.id;
    const crossedFromAbove = previousFeetY <= surfaceY + 2 && currentFeetY >= surfaceY;
    const walkedFromGround =
      current.grounded &&
      previousFeetY <= surfaceY + 2 &&
      currentFeetY >= surfaceY - PLAYER_PHYSICS.slopeSnapDistance;
    const followedSurface =
      wasStanding &&
      currentFeetY >= surfaceY - PLAYER_PHYSICS.slopeSnapDistance &&
      currentFeetY <= surfaceY + PLAYER_PHYSICS.slopeSnapDistance;
    if (!crossedFromAbove && !walkedFromGround && !followedSurface) continue;
    if (!candidate || surfaceY < candidate.surfaceY) candidate = { slope, surfaceY };
  }
  if (!candidate) {
    player.standingSlopeId = null;
    player.slopeGrade = 0;
    return;
  }
  player.y = candidate.surfaceY - PLAYER_PHYSICS.height;
  player.vy = 0;
  player.grounded = true;
  player.jumpsUsed = 0;
  player.slopeLandedThisFrame = current.standingSlopeId !== candidate.slope.id;
  player.landedThisFrame ||= player.slopeLandedThisFrame;
  player.standingSlopeId = candidate.slope.id;
  player.slopeGrade = slopeGradeOf(candidate.slope);
}

function resolveSlopeToFlatTransition(player, current, solids) {
  if (player.grounded || !current.grounded || !current.standingSlopeId) return;
  const feetX = player.x + PLAYER_PHYSICS.width / 2;
  const feetY = player.y + PLAYER_PHYSICS.height;
  const floor = solids.find(solid =>
    isFlatGroundRole(solid.role) &&
    feetX >= solid.x &&
    feetX <= solid.x + solid.width &&
    Math.abs(solid.y - feetY) <= PLAYER_PHYSICS.slopeSnapDistance);
  if (!floor) return;
  player.y = floor.y - PLAYER_PHYSICS.height;
  player.vy = 0;
  player.grounded = true;
  player.jumpsUsed = 0;
}

export function stepPlayer(current, input, dt, solids) {
  const player = {
    ...current,
    abilities: { ...current.abilities },
    previousX: current.x,
    previousY: current.y,
    landedThisFrame: false,
    edgeCorrectedThisFrame: false,
    wallJumpedThisFrame: false,
    slopeLandedThisFrame: false,
  };
  player.wallContactRemaining = Math.max(0, player.wallContactRemaining - dt);
  player.wallReattachRemaining = Math.max(0, player.wallReattachRemaining - dt);
  let axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (player.wallReattachRemaining > 0 && axis === player.lastWallSide) axis = 0;

  const standingSlope = solids.find(solid =>
    solid.role === "slope" && solid.id === current.standingSlopeId);
  const standingGrade = standingSlope ? slopeGradeOf(standingSlope) : 0;
  const standingSlopeIntensity = standingSlope
    ? clamp(
      (Math.abs(standingGrade) - PLAYER_PHYSICS.slopeRestGrade) /
        (0.72 - PLAYER_PHYSICS.slopeRestGrade),
      0,
      1,
    )
    : 0;
  if (axis !== 0) {
    if (player.vx !== 0 && Math.sign(player.vx) !== axis) player.turning = true;
    if (player.turning && Math.sign(player.vx) === axis && Math.abs(player.vx) >= PLAYER_PHYSICS.runSpeed * 0.9) {
      player.turning = false;
    }
    const acceleration = player.grounded
      ? (player.turning ? PLAYER_PHYSICS.turnAcceleration : PLAYER_PHYSICS.groundAcceleration)
      : (player.turning ? PLAYER_PHYSICS.airTurnAcceleration : PLAYER_PHYSICS.airAcceleration);
    const uphill = axis * standingGrade < 0;
    const downhill = axis * standingGrade > 0;
    const speedFactor = uphill
      ? PLAYER_PHYSICS.slopeUphillSpeedFactor
      : downhill
        ? PLAYER_PHYSICS.slopeDownhillSpeedFactor
        : 1;
    player.vx = approach(player.vx, axis * PLAYER_PHYSICS.runSpeed * speedFactor, acceleration * dt);
    player.facing = axis;
  } else {
    player.turning = false;
    if (player.grounded && standingSlopeIntensity > 0) {
      const downhillDirection = Math.sign(standingGrade);
      const slideTarget =
        downhillDirection *
        PLAYER_PHYSICS.slopeMaximumSlideSpeed *
        (0.45 + standingSlopeIntensity * 0.55);
      player.vx = approach(
        player.vx,
        slideTarget,
        PLAYER_PHYSICS.slopeGroundDeceleration * 0.6 * dt,
      );
    } else {
      const deceleration = player.grounded
        ? (standingSlope ? PLAYER_PHYSICS.slopeGroundDeceleration : PLAYER_PHYSICS.groundDeceleration)
        : PLAYER_PHYSICS.airDeceleration;
      player.vx = approach(player.vx, 0, deceleration * dt);
    }
  }
  if (standingSlope && standingSlopeIntensity > 0 && axis !== 0) {
    const downhillDirection = Math.sign(standingGrade);
    player.vx +=
      downhillDirection *
      PLAYER_PHYSICS.slopeGravityAcceleration *
      standingSlopeIntensity *
      dt;
    const slopeSpeedLimit = PLAYER_PHYSICS.runSpeed * PLAYER_PHYSICS.slopeDownhillSpeedFactor;
    player.vx = clamp(player.vx, -slopeSpeedLimit, slopeSpeedLimit);
  }

  player.coyoteRemaining = player.grounded
    ? PLAYER_PHYSICS.coyoteTime
    : Math.max(0, player.coyoteRemaining - dt);
  player.jumpBufferRemaining = input.jumpPressed
    ? PLAYER_PHYSICS.jumpBufferTime
    : Math.max(0, player.jumpBufferRemaining - dt);

  if (player.jumpBufferRemaining > 0 && (player.grounded || player.coyoteRemaining > 0)) {
    player.vy = -PLAYER_PHYSICS.jumpSpeed;
    player.grounded = false;
    player.standingSlopeId = null;
    player.slopeGrade = 0;
    player.coyoteRemaining = 0;
    player.jumpBufferRemaining = 0;
    player.jumpsUsed = 1;
  } else if (
    player.jumpBufferRemaining > 0 &&
    !player.grounded &&
    (player.wallSide !== 0 || player.wallContactRemaining > 0)
  ) {
    const jumpSide = player.wallSide || player.lastWallSide;
    player.vx = -jumpSide * PLAYER_PHYSICS.wallJumpHorizontalSpeed;
    player.vy = -PLAYER_PHYSICS.wallJumpVerticalSpeed;
    player.facing = -jumpSide;
    player.turning = false;
    player.wallSide = 0;
    player.lastWallSide = jumpSide;
    player.wallContactRemaining = 0;
    player.wallReattachRemaining = PLAYER_PHYSICS.wallReattachLockTime;
    player.wallSliding = false;
    player.wallJumpedThisFrame = true;
    player.jumpBufferRemaining = 0;
    player.jumpsUsed = 1;
  } else if (
    player.jumpBufferRemaining > 0 &&
    player.abilities.doubleJump &&
    !player.grounded &&
    player.jumpsUsed === 1
  ) {
    player.vy = -PLAYER_PHYSICS.doubleJumpSpeed;
    player.jumpBufferRemaining = 0;
    player.jumpsUsed = 2;
  }

  let gravityMultiplier = player.vy > 0 ? PLAYER_PHYSICS.fallingGravityMultiplier : 1;
  if (Math.abs(player.vy) < 80) gravityMultiplier *= PLAYER_PHYSICS.apexGravityMultiplier;
  if (player.vy < 0 && !input.jumpHeld) gravityMultiplier = PLAYER_PHYSICS.releasedJumpGravityMultiplier;
  player.vy = Math.min(
    PLAYER_PHYSICS.maximumFallSpeed,
    player.vy + PLAYER_PHYSICS.gravity * gravityMultiplier * dt,
  );

  moveHorizontal(player, solids, dt);
  moveVertical(player, solids, dt);
  resolveSlopeToFlatTransition(player, current, solids);
  resolveSlopes(player, current, solids);
  const detectedWallSide = player.wallReattachRemaining > 0 ? 0 : detectWallSide(player, solids);
  if (detectedWallSide !== 0) {
    player.wallSide = detectedWallSide;
    player.lastWallSide = detectedWallSide;
    player.wallContactRemaining = PLAYER_PHYSICS.wallContactGraceTime;
  } else {
    player.wallSide = 0;
  }
  player.wallSliding = false;
  if (!player.grounded && player.wallSide !== 0 && player.vy > 0) {
    player.vy = approach(
      player.vy,
      PLAYER_PHYSICS.wallSlideSpeed,
      PLAYER_PHYSICS.wallSlideAcceleration * dt,
    );
    player.wallSliding = true;
  }
  return player;
}

export function createCamera(player) {
  const x = Math.max(0, player.x - 260);
  const y = 120;
  return { x, y, targetX: x, targetY: y };
}

export function stepCamera(current, player, dt, world) {
  const velocityRatio = clamp(player.vx / PLAYER_PHYSICS.runSpeed, -1, 1);
  const targetX = clamp(
    player.x + PLAYER_PHYSICS.width / 2 - CAMERA_PHYSICS.viewportWidth / 2 +
      velocityRatio * CAMERA_PHYSICS.horizontalLookAhead,
    0,
    Math.max(0, world.width - CAMERA_PHYSICS.viewportWidth),
  );
  const desiredScreenY = CAMERA_PHYSICS.viewportHeight / 2 - CAMERA_PHYSICS.verticalBias;
  const playerCenterY = player.y + PLAYER_PHYSICS.height / 2;
  const playerScreenY = playerCenterY - current.y;
  let targetY = current.targetY ?? current.y;
  if (playerScreenY < desiredScreenY - CAMERA_PHYSICS.verticalDeadZone) {
    targetY = playerCenterY - (desiredScreenY - CAMERA_PHYSICS.verticalDeadZone);
  } else if (playerScreenY > desiredScreenY + CAMERA_PHYSICS.verticalDeadZone) {
    targetY = playerCenterY - (desiredScreenY + CAMERA_PHYSICS.verticalDeadZone);
  }
  targetY = clamp(targetY, 0, Math.max(0, world.height - CAMERA_PHYSICS.viewportHeight));
  const horizontalBlend = 1 - 2 ** (-dt / CAMERA_PHYSICS.followHalfLife);
  const verticalBlend = 1 - 2 ** (-dt / CAMERA_PHYSICS.verticalFollowHalfLife);
  return {
    x: current.x + (targetX - current.x) * horizontalBlend,
    y: current.y + (targetY - current.y) * verticalBlend,
    targetX,
    targetY,
  };
}

export function rectangleIntersectsPlayer(rectangle, player) {
  return overlaps(player, rectangle);
}
