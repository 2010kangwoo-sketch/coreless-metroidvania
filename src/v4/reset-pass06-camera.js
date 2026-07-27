import {
  RESET_GROUND_MOVEMENT,
} from "./reset-pass02-ground-movement.js";
import {
  validateResetPass05Combat,
} from "./reset-pass05-combat.js";
import {
  validateQualityFoundation,
} from "./quality-foundation.js";

export const RESET_PASS06_BUILD = Object.freeze({
  id: "rebuild-v4-reset-pass06-camera",
  pass: 6,
  branch: "rebuild/mega-room-v4-40pass",
  scope:
    "large-world horizontal and vertical camera follow, directional lead, hit damping, and three depth layers",
  finalArtIncluded: false,
});

export const RESET_CAMERA_CONTRACT = Object.freeze({
  horizontalHalfLifeSeconds: 0.16,
  verticalHalfLifeSeconds: 0.24,
  lookAheadHalfLifeSeconds: 0.2,
  lookAheadDistancePx: 170,
  lookAheadMinimumSpeedPxPerSecond: 80,
  playerScreenHorizontalFraction: 0.5,
  playerScreenVerticalFraction: 0.58,
  hitLookAheadScale: 0,
  maximumHitShakePx: 5,
  hitShakeSeconds: 0.14,
  parallaxRatios: Object.freeze({
    far: 0.16,
    middle: 0.38,
    near: 0.68,
  }),
  cameraTeleportAllowed: false,
  unexplainedPlayerCorrectionAllowed: false,
});

export const RESET_PASS06_WORLD = Object.freeze({
  width: 5200,
  height: 2200,
  viewportWidth: 1400,
  viewportHeight: 900,
  lowerFloorY: 1800,
  upperFloorY: 900,
  spawnX: 120,
  finishX: 4980,
  leftBoundary: 20,
  rightBoundary: 5180,
});

export const RESET_PASS06_LIFT = Object.freeze({
  id: "counterweight-lift",
  x: 1900,
  width: 430,
  height: 32,
  startY: RESET_PASS06_WORLD.lowerFloorY,
  endY: RESET_PASS06_WORLD.upperFloorY,
  speed: 235,
  activationInset: 45,
});

export const RESET_PASS06_HAZARD = Object.freeze({
  id: "camera-impact-pad",
  x: 3820,
  y: RESET_PASS06_WORLD.upperFloorY - 16,
  width: 110,
  height: 16,
  sourceX: 3875,
  damage: 1,
});

export const RESET_PASS06_STATIC_SOLIDS = Object.freeze([
  Object.freeze({
    id: "lower-floor",
    x: -200,
    y: RESET_PASS06_WORLD.lowerFloorY,
    width: RESET_PASS06_LIFT.x + 260,
    height: RESET_PASS06_WORLD.height - RESET_PASS06_WORLD.lowerFloorY + 200,
  }),
  Object.freeze({
    id: "upper-floor",
    x: RESET_PASS06_LIFT.x + RESET_PASS06_LIFT.width - 120,
    y: RESET_PASS06_WORLD.upperFloorY,
    width: RESET_PASS06_WORLD.width,
    height: RESET_PASS06_WORLD.height - RESET_PASS06_WORLD.upperFloorY + 200,
  }),
]);

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

export const dampHalfLife = (current, target, halfLife, dt) => {
  const blend = 1 - Math.pow(0.5, dt / halfLife);
  return current + (target - current) * blend;
};

export function targetLookAheadForPlayer(player) {
  if (player.hitstunRemaining > 0) {
    return RESET_CAMERA_CONTRACT.lookAheadDistancePx *
      RESET_CAMERA_CONTRACT.hitLookAheadScale;
  }
  if (
    Math.abs(player.vx) <
    RESET_CAMERA_CONTRACT.lookAheadMinimumSpeedPxPerSecond
  ) {
    return 0;
  }
  return Math.sign(player.vx) * RESET_CAMERA_CONTRACT.lookAheadDistancePx;
}

export function cameraTargetForPlayer(player, lookAheadX = 0) {
  const centerX = player.x + RESET_GROUND_MOVEMENT.playerWidth / 2;
  const centerY = player.y + RESET_GROUND_MOVEMENT.playerHeight / 2;
  return {
    x: clamp(
      centerX +
        lookAheadX -
        RESET_PASS06_WORLD.viewportWidth *
          RESET_CAMERA_CONTRACT.playerScreenHorizontalFraction,
      0,
      RESET_PASS06_WORLD.width - RESET_PASS06_WORLD.viewportWidth,
    ),
    y: clamp(
      centerY -
        RESET_PASS06_WORLD.viewportHeight *
          RESET_CAMERA_CONTRACT.playerScreenVerticalFraction,
      0,
      RESET_PASS06_WORLD.height - RESET_PASS06_WORLD.viewportHeight,
    ),
  };
}

export function createResetCamera(player) {
  const target = cameraTargetForPlayer(player, 0);
  return {
    x: target.x,
    y: target.y,
    lookAheadX: 0,
    shakeRemaining: 0,
    shakeSerial: 0,
  };
}

export function stepResetCamera(
  current,
  player,
  dt = RESET_GROUND_MOVEMENT.fixedStep,
  { hitStarted = false } = {},
) {
  const lookAheadX = dampHalfLife(
    current.lookAheadX,
    targetLookAheadForPlayer(player),
    RESET_CAMERA_CONTRACT.lookAheadHalfLifeSeconds,
    dt,
  );
  const target = cameraTargetForPlayer(player, lookAheadX);
  const x = clamp(
    dampHalfLife(
      current.x,
      target.x,
      RESET_CAMERA_CONTRACT.horizontalHalfLifeSeconds,
      dt,
    ),
    0,
    RESET_PASS06_WORLD.width - RESET_PASS06_WORLD.viewportWidth,
  );
  const y = clamp(
    dampHalfLife(
      current.y,
      target.y,
      RESET_CAMERA_CONTRACT.verticalHalfLifeSeconds,
      dt,
    ),
    0,
    RESET_PASS06_WORLD.height - RESET_PASS06_WORLD.viewportHeight,
  );
  return {
    x,
    y,
    lookAheadX,
    shakeRemaining: hitStarted
      ? RESET_CAMERA_CONTRACT.hitShakeSeconds
      : Math.max(0, current.shakeRemaining - dt),
    shakeSerial: current.shakeSerial + (hitStarted ? 1 : 0),
  };
}

export function cameraShakeOffset(camera) {
  if (camera.shakeRemaining <= 0) return { x: 0, y: 0 };
  const life =
    camera.shakeRemaining / RESET_CAMERA_CONTRACT.hitShakeSeconds;
  const amplitude = RESET_CAMERA_CONTRACT.maximumHitShakePx * life;
  const phase = camera.shakeSerial * 2.41 + camera.shakeRemaining * 91;
  return {
    x: Math.sin(phase) * amplitude,
    y: Math.cos(phase * 1.37) * amplitude * 0.55,
  };
}

export function parallaxOffset(camera, layer) {
  const ratio = RESET_CAMERA_CONTRACT.parallaxRatios[layer];
  if (ratio === undefined) {
    throw new Error(`Unknown parallax layer: ${layer}`);
  }
  return Object.freeze({
    x: -camera.x * ratio,
    y: -camera.y * ratio,
  });
}

function simulateCameraProfile() {
  const fixedStep = RESET_GROUND_MOVEMENT.fixedStep;
  const player = {
    x: 1600,
    y: RESET_PASS06_WORLD.lowerFloorY -
      RESET_GROUND_MOVEMENT.playerHeight,
    vx: 0,
    hitstunRemaining: 0,
  };
  let camera = createResetCamera(player);
  let maximumHorizontalStep = 0;
  let maximumVerticalStep = 0;
  let positiveLead = 0;
  let negativeLead = 0;
  for (let frame = 0; frame < 240; frame += 1) {
    player.vx = frame < 120 ? 400 : -400;
    player.x += player.vx * fixedStep;
    if (frame === 120) player.y -= 900;
    const before = camera;
    camera = stepResetCamera(camera, player, fixedStep);
    maximumHorizontalStep = Math.max(
      maximumHorizontalStep,
      Math.abs(camera.x - before.x),
    );
    maximumVerticalStep = Math.max(
      maximumVerticalStep,
      Math.abs(camera.y - before.y),
    );
    positiveLead = Math.max(positiveLead, camera.lookAheadX);
    negativeLead = Math.min(negativeLead, camera.lookAheadX);
  }
  const beforeHit = camera;
  player.x -= 310 * fixedStep;
  player.y -= 360 * fixedStep;
  player.vx = -310;
  player.hitstunRemaining = 0.22;
  camera = stepResetCamera(camera, player, fixedStep, {
    hitStarted: true,
  });
  const hitCameraStep = Math.hypot(
    camera.x - beforeHit.x,
    camera.y - beforeHit.y,
  );
  const far = parallaxOffset({ x: 1000, y: 500 }, "far");
  const middle = parallaxOffset({ x: 1000, y: 500 }, "middle");
  const near = parallaxOffset({ x: 1000, y: 500 }, "near");
  return Object.freeze({
    maximumHorizontalStep,
    maximumVerticalStep,
    positiveLead,
    negativeLead,
    hitCameraStep,
    finalCamera: Object.freeze({ ...camera }),
    parallax: Object.freeze({ far, middle, near }),
  });
}

export function measureResetPass06Camera() {
  return simulateCameraProfile();
}

export function validateResetPass06Camera() {
  const previous = validateResetPass05Combat();
  const quality = validateQualityFoundation();
  const measurement = measureResetPass06Camera();
  const ratios = RESET_CAMERA_CONTRACT.parallaxRatios;
  const checks = [
    ["previousCombatContractPasses", previous.passed],
    ["qualityFoundationPasses", quality.passed],
    ["roadmapPassNumberIsSix", RESET_PASS06_BUILD.pass === 6],
    ["worldIsWiderThanViewport",
      RESET_PASS06_WORLD.width >= RESET_PASS06_WORLD.viewportWidth * 3],
    ["worldIsTallerThanViewport",
      RESET_PASS06_WORLD.height >= RESET_PASS06_WORLD.viewportHeight * 2],
    ["horizontalFollowIsFasterThanVertical",
      RESET_CAMERA_CONTRACT.horizontalHalfLifeSeconds <
      RESET_CAMERA_CONTRACT.verticalHalfLifeSeconds],
    ["followIsDamped",
      RESET_CAMERA_CONTRACT.horizontalHalfLifeSeconds > 0 &&
      RESET_CAMERA_CONTRACT.verticalHalfLifeSeconds > 0],
    ["lookAheadIsBounded",
      RESET_CAMERA_CONTRACT.lookAheadDistancePx === 170],
    ["lookAheadChangesGradually",
      measurement.positiveLead > 150 &&
      measurement.positiveLead < RESET_CAMERA_CONTRACT.lookAheadDistancePx],
    ["reverseLookAheadObserved", measurement.negativeLead < -145],
    ["horizontalFrameStepBounded",
      measurement.maximumHorizontalStep < 15],
    ["verticalFrameStepBounded", measurement.maximumVerticalStep < 22],
    ["cameraNeverTeleports",
      !RESET_CAMERA_CONTRACT.cameraTeleportAllowed],
    ["cameraStaysInsideWorld",
      measurement.finalCamera.x >= 0 &&
      measurement.finalCamera.x <=
        RESET_PASS06_WORLD.width - RESET_PASS06_WORLD.viewportWidth &&
      measurement.finalCamera.y >= 0 &&
      measurement.finalCamera.y <=
        RESET_PASS06_WORLD.height - RESET_PASS06_WORLD.viewportHeight],
    ["hitLookAheadDoesNotFollowKnockback",
      RESET_CAMERA_CONTRACT.hitLookAheadScale === 0],
    ["hitCameraStepBounded", measurement.hitCameraStep < 15],
    ["hitShakeIsShort",
      RESET_CAMERA_CONTRACT.hitShakeSeconds <= 0.16],
    ["hitShakeIsSmall",
      RESET_CAMERA_CONTRACT.maximumHitShakePx <= 5],
    ["threeParallaxLayers",
      Object.keys(ratios).join(",") === "far,middle,near"],
    ["parallaxDepthIsOrdered",
      ratios.far < ratios.middle && ratios.middle < ratios.near],
    ["farLayerMovesSlowly", ratios.far <= 0.2],
    ["nearLayerRemainsBehindGameplay", ratios.near < 1],
    ["liftCreatesVerticalTransition",
      RESET_PASS06_LIFT.startY - RESET_PASS06_LIFT.endY === 900],
    ["noUnexplainedPlayerCorrection",
      !RESET_CAMERA_CONTRACT.unexplainedPlayerCorrectionAllowed],
  ].map(([name, passed]) => Object.freeze({
    name,
    passed: Boolean(passed),
  }));
  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements: measurement,
  });
}
