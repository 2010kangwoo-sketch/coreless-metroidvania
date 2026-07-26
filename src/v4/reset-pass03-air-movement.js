import {
  RESET_GROUND_MOVEMENT,
  RESET_PASS02_BUILD,
  createResetGroundPlayer,
  resolveGroundDirection,
  stepResetGroundPlayer,
  validateResetPass02GroundMovement,
} from "./reset-pass02-ground-movement.js";

export const RESET_PASS03_BUILD = Object.freeze({
  id: "rebuild-v4-reset-pass03-air-movement",
  pass: 3,
  branch: "rebuild/mega-room-v4-40pass",
  scope:
    "single variable jump, air control, coyote time, and landing input buffer",
  finalArtIncluded: false,
});

export const RESET_AIR_MOVEMENT = Object.freeze({
  jumpSpeed: 820,
  gravity: 2300,
  releasedJumpGravityMultiplier: 2.7,
  fallGravity: 2500,
  maximumFallSpeed: 1050,
  coyoteSeconds: 0.1,
  jumpBufferSeconds: 0.12,
  minimumJumpHoldSeconds: 0.055,
  apexSpeedThreshold: 55,
  airMaximumSpeed: 380,
  airAcceleration: 1500,
  airTurnAcceleration: 2100,
  airNeutralDeceleration: 220,
  hardLandingSpeed: 760,
});

export const RESET_PASS03_LAB = Object.freeze({
  width: 1400,
  height: 900,
  upperFloorY: 690,
  upperFloorEndX: 560,
  lowerFloorY: 820,
  spawnX: 150,
  leftBoundary: 50,
  rightBoundary: 1350,
});

export const RESET_PASS03_SOLIDS = Object.freeze([
  Object.freeze({
    id: "upper-floor",
    x: 0,
    y: RESET_PASS03_LAB.upperFloorY,
    width: RESET_PASS03_LAB.upperFloorEndX,
    height: RESET_PASS03_LAB.height - RESET_PASS03_LAB.upperFloorY,
  }),
  Object.freeze({
    id: "lower-floor",
    x: 0,
    y: RESET_PASS03_LAB.lowerFloorY,
    width: RESET_PASS03_LAB.width,
    height: RESET_PASS03_LAB.height - RESET_PASS03_LAB.lowerFloorY,
  }),
]);

const approach = (value, target, maximumDelta) => {
  if (value < target) return Math.min(value + maximumDelta, target);
  if (value > target) return Math.max(value - maximumDelta, target);
  return value;
};

const overlapsHorizontally = (x, solid) =>
  x + RESET_GROUND_MOVEMENT.playerWidth > solid.x &&
  x < solid.x + solid.width;

const supportingSolid = (player, solids) => solids.find(solid =>
  overlapsHorizontally(player.x, solid) &&
  Math.abs(
    player.y + RESET_GROUND_MOVEMENT.playerHeight - solid.y,
  ) <= 0.6);

export function createResetAirPlayer({
  x = RESET_PASS03_LAB.spawnX,
  floorY = RESET_PASS03_LAB.upperFloorY,
} = {}) {
  return {
    ...createResetGroundPlayer(x),
    y: floorY - RESET_GROUND_MOVEMENT.playerHeight,
    vy: 0,
    grounded: true,
    coyoteRemaining: RESET_AIR_MOVEMENT.coyoteSeconds,
    jumpBufferRemaining: 0,
    minimumJumpHoldRemaining: 0,
    jumpsStarted: 0,
    landings: 0,
    lastJumpSource: null,
    lastLandingSpeed: 0,
    events: {
      jumped: false,
      jumpSource: null,
      landed: false,
      walkedOff: false,
      jumpPressedInAir: false,
    },
  };
}

function launchJump(player, source) {
  player.vy = -RESET_AIR_MOVEMENT.jumpSpeed;
  player.grounded = false;
  player.coyoteRemaining = 0;
  player.jumpBufferRemaining = 0;
  player.minimumJumpHoldRemaining =
    RESET_AIR_MOVEMENT.minimumJumpHoldSeconds;
  player.jumpsStarted += 1;
  player.lastJumpSource = source;
  player.events.jumped = true;
  player.events.jumpSource = source;
}

export function stepResetAirPlayer(current, input, dt, solids) {
  const direction = resolveGroundDirection(input);
  const support = supportingSolid(current, solids);
  const startedGrounded = Boolean(current.grounded && support);
  const player = {
    ...current,
    events: {
      jumped: false,
      jumpSource: null,
      landed: false,
      walkedOff: false,
      jumpPressedInAir: Boolean(input.jumpPressed && !startedGrounded),
    },
  };
  player.jumpBufferRemaining = input.jumpPressed
    ? RESET_AIR_MOVEMENT.jumpBufferSeconds
    : Math.max(0, current.jumpBufferRemaining - dt);
  player.grounded = startedGrounded;
  player.coyoteRemaining = startedGrounded
    ? RESET_AIR_MOVEMENT.coyoteSeconds
    : Math.max(0, current.coyoteRemaining - dt);
  if (current.grounded && !startedGrounded) {
    player.events.walkedOff = true;
  }

  if (
    player.jumpBufferRemaining > 0 &&
    (player.grounded || player.coyoteRemaining > 0)
  ) {
    launchJump(player, player.grounded ? "ground" : "coyote");
  }

  const beforeX = player.x;
  const beforeY = player.y;
  const beforeVelocityY = player.vy;
  if (player.grounded) {
    const ground = stepResetGroundPlayer(player, input, dt);
    player.x = ground.x;
    player.vx = ground.vx;
    player.facing = ground.facing;
    player.stridePhase = ground.stridePhase;
    player.state = ground.state;
  } else {
    let acceleration = RESET_AIR_MOVEMENT.airAcceleration;
    if (
      direction !== 0 &&
      Math.sign(player.vx) !== 0 &&
      direction !== Math.sign(player.vx)
    ) {
      acceleration = RESET_AIR_MOVEMENT.airTurnAcceleration;
    }
    const targetVelocityX = direction === 0
      ? 0
      : direction * RESET_AIR_MOVEMENT.airMaximumSpeed;
    player.vx = approach(
      player.vx,
      targetVelocityX,
      (direction === 0
        ? RESET_AIR_MOVEMENT.airNeutralDeceleration
        : acceleration) * dt,
    );
    if (
      direction !== 0 &&
      (current.vx === 0 || Math.sign(player.vx) === direction)
    ) {
      player.facing = direction;
    }
    player.x += (current.vx + player.vx) * 0.5 * dt;

    const upward = player.vy < 0;
    const jumpStillHeld =
      input.jumpHeld || player.minimumJumpHoldRemaining > 0;
    const gravity = upward && !jumpStillHeld
      ? RESET_AIR_MOVEMENT.gravity *
        RESET_AIR_MOVEMENT.releasedJumpGravityMultiplier
      : upward
        ? RESET_AIR_MOVEMENT.gravity
        : RESET_AIR_MOVEMENT.fallGravity;
    player.vy = Math.min(
      player.vy + gravity * dt,
      RESET_AIR_MOVEMENT.maximumFallSpeed,
    );
    player.minimumJumpHoldRemaining = Math.max(
      0,
      player.minimumJumpHoldRemaining - dt,
    );
    player.y += (beforeVelocityY + player.vy) * 0.5 * dt;
  }

  const previousBottom = beforeY + RESET_GROUND_MOVEMENT.playerHeight;
  const nextBottom = player.y + RESET_GROUND_MOVEMENT.playerHeight;
  if (!player.grounded && player.vy >= 0) {
    const landingSolid = solids
      .filter(solid =>
        overlapsHorizontally(player.x, solid) &&
        previousBottom <= solid.y + 0.01 &&
        nextBottom >= solid.y)
      .sort((a, b) => a.y - b.y)[0];
    if (landingSolid) {
      const landingSpeed = player.vy;
      player.y =
        landingSolid.y - RESET_GROUND_MOVEMENT.playerHeight;
      player.vy = 0;
      player.grounded = true;
      player.coyoteRemaining = RESET_AIR_MOVEMENT.coyoteSeconds;
      player.landings += 1;
      player.lastLandingSpeed = landingSpeed;
      player.events.landed = true;
      if (player.jumpBufferRemaining > 0) {
        launchJump(player, "buffered-landing");
      } else {
        player.state = landingSpeed >= RESET_AIR_MOVEMENT.hardLandingSpeed
          ? "hard-land"
          : "soft-land";
      }
    }
  }

  if (!player.grounded) {
    player.state = player.vy < -RESET_AIR_MOVEMENT.apexSpeedThreshold
      ? "rise"
      : player.vy <= RESET_AIR_MOVEMENT.apexSpeedThreshold
        ? "apex"
        : "fall";
  }
  player.stateSeconds = player.state === current.state
    ? current.stateSeconds + dt
    : 0;
  player.lastPositionStep = Math.hypot(
    player.x - beforeX,
    player.y - beforeY,
  );
  return player;
}

const FULL_FLOOR = Object.freeze([
  Object.freeze({
    id: "measurement-floor",
    x: -1000,
    y: 730,
    width: 4000,
    height: 300,
  }),
]);

function simulateJumpProfile(holdSeconds) {
  let player = createResetAirPlayer({ x: 0, floorY: 730 });
  const startY = player.y;
  let minimumY = startY;
  let seconds = 0;
  let pressed = false;
  let maximumStep = 0;
  const states = new Set([player.state]);
  while (seconds < 2) {
    const before = player;
    player = stepResetAirPlayer(
      player,
      {
        jumpPressed: !pressed,
        jumpHeld: seconds < holdSeconds,
      },
      RESET_GROUND_MOVEMENT.fixedStep,
      FULL_FLOOR,
    );
    pressed = true;
    minimumY = Math.min(minimumY, player.y);
    maximumStep = Math.max(maximumStep, player.lastPositionStep);
    states.add(player.state);
    seconds += RESET_GROUND_MOVEMENT.fixedStep;
    if (player.landings > 0 && player.grounded) break;
  }
  return Object.freeze({
    holdSeconds,
    height: startY - minimumY,
    airtimeSeconds: seconds,
    maximumStep,
    states: Object.freeze([...states]),
  });
}

function simulateCoyote(delayAfterEdgeSeconds) {
  const ledge = Object.freeze([Object.freeze({
    id: "coyote-ledge",
    x: -1000,
    y: 730,
    width: 1000,
    height: 300,
  })]);
  let player = createResetAirPlayer({ x: -44, floorY: 730 });
  player.vx = RESET_GROUND_MOVEMENT.maximumRunSpeed;
  player.state = "run-loop";
  let secondsAfterEdge = 0;
  let leftEdge = false;
  let pressed = false;
  while (secondsAfterEdge < delayAfterEdgeSeconds ||
    (!pressed && !leftEdge)) {
    const beforeGrounded = player.grounded;
    player = stepResetAirPlayer(
      player,
      { right: true, jumpPressed: false, jumpHeld: false },
      RESET_GROUND_MOVEMENT.fixedStep,
      ledge,
    );
    if (beforeGrounded && !player.grounded) leftEdge = true;
    if (leftEdge) secondsAfterEdge += RESET_GROUND_MOVEMENT.fixedStep;
  }
  player = stepResetAirPlayer(
    player,
    { right: true, jumpPressed: true, jumpHeld: true },
    RESET_GROUND_MOVEMENT.fixedStep,
    ledge,
  );
  pressed = true;
  return Object.freeze({
    requestedDelay: delayAfterEdgeSeconds,
    actualDelay: secondsAfterEdge,
    jumped: player.events.jumped,
    jumpSource: player.events.jumpSource,
    verticalSpeed: player.vy,
    pressed,
  });
}

function simulateBufferedLanding() {
  let player = createResetAirPlayer({ x: 0, floorY: 730 });
  player.y -= 150;
  player.vy = 620;
  player.grounded = false;
  player.coyoteRemaining = 0;
  let pressed = false;
  let pressHeight = null;
  let seconds = 0;
  let jumpsBeforePress = player.jumpsStarted;
  while (seconds < 1.5 && player.lastJumpSource !== "buffered-landing") {
    const distanceToFloor =
      730 - (player.y + RESET_GROUND_MOVEMENT.playerHeight);
    const shouldPress = !pressed && distanceToFloor <= 62;
    if (shouldPress) {
      pressed = true;
      pressHeight = distanceToFloor;
      jumpsBeforePress = player.jumpsStarted;
    }
    player = stepResetAirPlayer(
      player,
      {
        jumpPressed: shouldPress,
        jumpHeld: pressed,
      },
      RESET_GROUND_MOVEMENT.fixedStep,
      FULL_FLOOR,
    );
    seconds += RESET_GROUND_MOVEMENT.fixedStep;
  }
  return Object.freeze({
    pressed,
    pressHeight,
    jumpedOnLanding: player.lastJumpSource === "buffered-landing",
    jumpCountChange: player.jumpsStarted - jumpsBeforePress,
    verticalSpeed: player.vy,
    seconds,
  });
}

function simulateAirControl() {
  let player = createResetAirPlayer({ x: 0, floorY: 730 });
  player = stepResetAirPlayer(
    player,
    { right: true, jumpPressed: true, jumpHeld: true },
    RESET_GROUND_MOVEMENT.fixedStep,
    FULL_FLOOR,
  );
  let seconds = RESET_GROUND_MOVEMENT.fixedStep;
  while (seconds < 0.18) {
    player = stepResetAirPlayer(
      player,
      { right: true, jumpHeld: true },
      RESET_GROUND_MOVEMENT.fixedStep,
      FULL_FLOOR,
    );
    seconds += RESET_GROUND_MOVEMENT.fixedStep;
  }
  const speedBeforeTurn = player.vx;
  const turnX = player.x;
  let turnSeconds = 0;
  while (player.vx >= -220 && turnSeconds < 0.5) {
    player = stepResetAirPlayer(
      player,
      { left: true, jumpHeld: true },
      RESET_GROUND_MOVEMENT.fixedStep,
      FULL_FLOOR,
    );
    turnSeconds += RESET_GROUND_MOVEMENT.fixedStep;
  }
  return Object.freeze({
    speedBeforeTurn,
    speedAfterTurn: player.vx,
    turnSeconds,
    displacementDuringTurn: player.x - turnX,
    facing: player.facing,
  });
}

function simulateRejectedAirJump() {
  let player = createResetAirPlayer({ x: 0, floorY: 730 });
  player = stepResetAirPlayer(
    player,
    { jumpPressed: true, jumpHeld: true },
    RESET_GROUND_MOVEMENT.fixedStep,
    FULL_FLOOR,
  );
  const firstJumpCount = player.jumpsStarted;
  let seconds = RESET_GROUND_MOVEMENT.fixedStep;
  let secondPressed = false;
  while (seconds < 0.42) {
    const pressNow = !secondPressed && seconds >= 0.16;
    player = stepResetAirPlayer(
      player,
      {
        jumpPressed: pressNow,
        jumpHeld: seconds < 0.28,
      },
      RESET_GROUND_MOVEMENT.fixedStep,
      FULL_FLOOR,
    );
    if (pressNow) secondPressed = true;
    seconds += RESET_GROUND_MOVEMENT.fixedStep;
  }
  return Object.freeze({
    firstJumpCount,
    finalJumpCount: player.jumpsStarted,
    secondPressed,
    bufferExpired: player.jumpBufferRemaining === 0,
    stillAirborne: !player.grounded,
  });
}

export function measureResetPass03AirMovement() {
  return Object.freeze({
    shortJump: simulateJumpProfile(0.06),
    fullJump: simulateJumpProfile(0.42),
    coyoteAccepted: simulateCoyote(0.065),
    coyoteRejected: simulateCoyote(0.125),
    bufferedLanding: simulateBufferedLanding(),
    airControl: simulateAirControl(),
    rejectedAirJump: simulateRejectedAirJump(),
  });
}

export function validateResetPass03AirMovement() {
  const pass02 = validateResetPass02GroundMovement();
  const measurements = measureResetPass03AirMovement();
  const states = new Set([
    ...measurements.shortJump.states,
    ...measurements.fullJump.states,
  ]);
  const checks = [
    ["resetPass02StillValid", pass02.passed],
    ["passSequenceIsCorrect",
      RESET_PASS02_BUILD.pass === 2 && RESET_PASS03_BUILD.pass === 3],
    ["singleJumpOnly",
      measurements.rejectedAirJump.firstJumpCount === 1 &&
      measurements.rejectedAirJump.finalJumpCount === 1],
    ["earlyAirPressIsNotDoubleJump",
      measurements.rejectedAirJump.secondPressed &&
      measurements.rejectedAirJump.bufferExpired &&
      measurements.rejectedAirJump.stillAirborne],
    ["shortJumpHeightBounded",
      measurements.shortJump.height >= 78 &&
      measurements.shortJump.height <= 98],
    ["fullJumpHeightBounded",
      measurements.fullJump.height >= 138 &&
      measurements.fullJump.height <= 154],
    ["variableJumpDifferenceMeaningful",
      measurements.fullJump.height -
      measurements.shortJump.height >= 48],
    ["shortJumpAirtimeBounded",
      measurements.shortJump.airtimeSeconds >= 0.42 &&
      measurements.shortJump.airtimeSeconds <= 0.58],
    ["fullJumpAirtimeBounded",
      measurements.fullJump.airtimeSeconds >= 0.65 &&
      measurements.fullJump.airtimeSeconds <= 0.82],
    ["coyoteWindowIsShort",
      RESET_AIR_MOVEMENT.coyoteSeconds >= 0.08 &&
      RESET_AIR_MOVEMENT.coyoteSeconds <= 0.12],
    ["coyoteInsideWindowAccepted",
      measurements.coyoteAccepted.jumped &&
      measurements.coyoteAccepted.jumpSource === "coyote"],
    ["coyoteOutsideWindowRejected",
      !measurements.coyoteRejected.jumped &&
      measurements.coyoteRejected.jumpSource === null],
    ["jumpBufferWindowIsShort",
      RESET_AIR_MOVEMENT.jumpBufferSeconds >= 0.09 &&
      RESET_AIR_MOVEMENT.jumpBufferSeconds <= 0.14],
    ["minimumHoldPreventsBufferedMicroHop",
      RESET_AIR_MOVEMENT.minimumJumpHoldSeconds >= 0.045 &&
      RESET_AIR_MOVEMENT.minimumJumpHoldSeconds <= 0.07],
    ["landingBufferAccepted",
      measurements.bufferedLanding.pressed &&
      measurements.bufferedLanding.jumpedOnLanding],
    ["landingBufferCreatesExactlyOneJump",
      measurements.bufferedLanding.jumpCountChange === 1],
    ["bufferedJumpLaunchesUpward",
      measurements.bufferedLanding.verticalSpeed < -700],
    ["airControlAccelerates",
      measurements.airControl.speedBeforeTurn >= 240],
    ["airDirectionCanReverse",
      measurements.airControl.speedAfterTurn <= -220 &&
      measurements.airControl.facing === -1],
    ["airReversalIsNotInstant",
      measurements.airControl.turnSeconds >= 0.2 &&
      measurements.airControl.turnSeconds <= 0.36],
    ["airReversalDriftIsBounded",
      Math.abs(measurements.airControl.displacementDuringTurn) <= 18],
    ["riseStateObserved", states.has("rise")],
    ["apexStateObserved", states.has("apex")],
    ["fallStateObserved", states.has("fall")],
    ["shortJumpStepIsBounded",
      measurements.shortJump.maximumStep <= 8.7],
    ["fullJumpStepIsBounded",
      measurements.fullJump.maximumStep <= 8.7],
    ["fallSpeedIsBounded",
      RESET_AIR_MOVEMENT.maximumFallSpeed <= 1100],
    ["airSpeedBelowGroundSpeed",
      RESET_AIR_MOVEMENT.airMaximumSpeed <
      RESET_GROUND_MOVEMENT.maximumRunSpeed],
    ["noDoubleJumpConfiguration",
      !Object.hasOwn(RESET_AIR_MOVEMENT, "doubleJumpSpeed")],
    ["noDashConfiguration",
      !Object.hasOwn(RESET_AIR_MOVEMENT, "dashSpeed")],
    ["noFinalArt", RESET_PASS03_BUILD.finalArtIncluded === false],
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
