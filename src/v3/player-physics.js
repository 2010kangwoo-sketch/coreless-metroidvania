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
    abilities: { doubleJump: false },
  };
}

const overlaps = (player, solid) =>
  player.x < solid.x + solid.width &&
  player.x + PLAYER_PHYSICS.width > solid.x &&
  player.y < solid.y + solid.height &&
  player.y + PLAYER_PHYSICS.height > solid.y;

function moveHorizontal(player, solids, dt) {
  player.x += player.vx * dt;
  for (const solid of solids) {
    if (!overlaps(player, solid)) continue;
    const feetPenetration = player.y + PLAYER_PHYSICS.height - solid.y;
    const canCorrectEdge =
      solid.role !== "ceiling" &&
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
  for (const solid of solids) {
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

export function stepPlayer(current, input, dt, solids) {
  const player = {
    ...current,
    abilities: { ...current.abilities },
    previousX: current.x,
    previousY: current.y,
    landedThisFrame: false,
    edgeCorrectedThisFrame: false,
  };
  const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);

  if (axis !== 0) {
    if (player.vx !== 0 && Math.sign(player.vx) !== axis) player.turning = true;
    if (player.turning && Math.sign(player.vx) === axis && Math.abs(player.vx) >= PLAYER_PHYSICS.runSpeed * 0.9) {
      player.turning = false;
    }
    const acceleration = player.grounded
      ? (player.turning ? PLAYER_PHYSICS.turnAcceleration : PLAYER_PHYSICS.groundAcceleration)
      : (player.turning ? PLAYER_PHYSICS.airTurnAcceleration : PLAYER_PHYSICS.airAcceleration);
    player.vx = approach(player.vx, axis * PLAYER_PHYSICS.runSpeed, acceleration * dt);
    player.facing = axis;
  } else {
    player.turning = false;
    const deceleration = player.grounded ? PLAYER_PHYSICS.groundDeceleration : PLAYER_PHYSICS.airDeceleration;
    player.vx = approach(player.vx, 0, deceleration * dt);
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
    player.coyoteRemaining = 0;
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
