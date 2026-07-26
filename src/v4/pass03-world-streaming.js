import {
  FIRST_MEGA_ROOM_PLACEMENT,
  FIRST_MEGA_ROOM_ZONES,
  SCALE_CONTRACT,
  validatePass01ScaleLayout,
} from "./pass01-scale-layout.js";
import { validatePass02Movement } from "./pass02-movement-benchmark.js";

export const PASS03_BUILD = Object.freeze({
  id: "rebuild-v4-pass03",
  pass: 3,
  branch: "rebuild/mega-room-v4-40pass",
  scope: "large-world camera, six-tier traversal, and bounded zone streaming",
  finalArtIncluded: false,
});

export const PASS03_VIEWPORT = Object.freeze({
  width: SCALE_CONTRACT.viewport.width,
  height: SCALE_CONTRACT.viewport.height,
});

export const PASS03_STREAMING = Object.freeze({
  zoneWidth: 2800,
  zoneHeight: 900,
  tierStride: 1200,
  firstTierTop: 6400,
  paddingX: 700,
  paddingY: 350,
  maximumActiveZones: 4,
  horizontalCameraHalfLife: 0.11,
  verticalCameraHalfLife: 0.16,
  horizontalLookAhead: 115,
  playerScreenY: 596,
  liftDurationSeconds: 1.4,
  farParallaxX: 0.12,
  farParallaxY: 0.08,
  midParallaxX: 0.28,
  midParallaxY: 0.18,
});

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

export const PASS03_TIERS = Object.freeze(
  Array.from({ length: SCALE_CONTRACT.tiersPerMegaRoom }, (_, index) => {
    const tier = index + 1;
    const top = PASS03_STREAMING.firstTierTop - index * PASS03_STREAMING.tierStride;
    return Object.freeze({
      tier,
      top,
      floorY: top + 760,
      direction: tier % 2 === 1 ? "east" : "west",
      connectorX: tier % 2 === 1
        ? SCALE_CONTRACT.nominalWorld.width - 160
        : 120,
    });
  }),
);

export const PASS03_ZONES = Object.freeze(
  FIRST_MEGA_ROOM_ZONES.map(zone => {
    const placement = FIRST_MEGA_ROOM_PLACEMENT.find(item => item.id === zone.id);
    const tier = PASS03_TIERS[placement.tier - 1];
    return Object.freeze({
      ...zone,
      tier: placement.tier,
      column: placement.column,
      direction: placement.direction,
      connector: placement.connector,
      bounds: Object.freeze({
        x: (placement.column - 1) * PASS03_STREAMING.zoneWidth,
        y: tier.top,
        width: PASS03_STREAMING.zoneWidth,
        height: PASS03_STREAMING.zoneHeight,
      }),
    });
  }),
);

const rectanglesOverlap = (a, b) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

export function cameraTargetForPlayer(player) {
  const lookAhead = clamp(
    player.vx * 0.3,
    -PASS03_STREAMING.horizontalLookAhead,
    PASS03_STREAMING.horizontalLookAhead,
  );
  return Object.freeze({
    x: clamp(
      player.x - PASS03_VIEWPORT.width * 0.5 + lookAhead,
      0,
      SCALE_CONTRACT.nominalWorld.width - PASS03_VIEWPORT.width,
    ),
    y: clamp(
      player.y - PASS03_STREAMING.playerScreenY,
      0,
      SCALE_CONTRACT.nominalWorld.height - PASS03_VIEWPORT.height,
    ),
  });
}

export function stepPass03Camera(camera, target, dt) {
  const horizontalBlend =
    1 - Math.pow(0.5, dt / PASS03_STREAMING.horizontalCameraHalfLife);
  const verticalBlend =
    1 - Math.pow(0.5, dt / PASS03_STREAMING.verticalCameraHalfLife);
  return Object.freeze({
    x: clamp(
      camera.x + (target.x - camera.x) * horizontalBlend,
      0,
      SCALE_CONTRACT.nominalWorld.width - PASS03_VIEWPORT.width,
    ),
    y: clamp(
      camera.y + (target.y - camera.y) * verticalBlend,
      0,
      SCALE_CONTRACT.nominalWorld.height - PASS03_VIEWPORT.height,
    ),
  });
}

export function streamedZonesForCamera(camera) {
  const streamBounds = {
    x: camera.x - PASS03_STREAMING.paddingX,
    y: camera.y - PASS03_STREAMING.paddingY,
    width: PASS03_VIEWPORT.width + PASS03_STREAMING.paddingX * 2,
    height: PASS03_VIEWPORT.height + PASS03_STREAMING.paddingY * 2,
  };
  return PASS03_ZONES.filter(zone => rectanglesOverlap(zone.bounds, streamBounds));
}

export function zoneAtWorldPoint(x, y) {
  return PASS03_ZONES.find(zone =>
    x >= zone.bounds.x &&
    x < zone.bounds.x + zone.bounds.width &&
    y >= zone.bounds.y &&
    y < zone.bounds.y + zone.bounds.height,
  ) ?? null;
}

function measureCameraTransition() {
  const tierOne = PASS03_TIERS[0];
  const tierTwo = PASS03_TIERS[1];
  const fixedStep = 1 / 120;
  const frames = Math.ceil(PASS03_STREAMING.liftDurationSeconds / fixedStep);
  let camera = cameraTargetForPlayer({
    x: tierOne.connectorX,
    y: tierOne.floorY - 64,
    vx: 0,
  });
  let maximumStep = 0;
  let maximumVerticalStep = 0;
  for (let frame = 1; frame <= frames; frame += 1) {
    const progress = Math.min(1, frame / frames);
    const player = {
      x: tierOne.connectorX,
      y:
        tierOne.floorY -
        64 +
        (tierTwo.floorY - tierOne.floorY) * progress,
      vx: 0,
    };
    const next = stepPass03Camera(camera, cameraTargetForPlayer(player), fixedStep);
    const step = Math.hypot(next.x - camera.x, next.y - camera.y);
    maximumStep = Math.max(maximumStep, step);
    maximumVerticalStep = Math.max(maximumVerticalStep, Math.abs(next.y - camera.y));
    camera = next;
  }
  return Object.freeze({ maximumStep, maximumVerticalStep, finalCamera: camera });
}

export function validatePass03WorldStreaming() {
  const pass01 = validatePass01ScaleLayout();
  const pass02 = validatePass02Movement();
  const samples = PASS03_ZONES.map(zone => {
    const player = {
      x: zone.bounds.x + zone.bounds.width / 2,
      y: PASS03_TIERS[zone.tier - 1].floorY - 64,
      vx: zone.direction === "east" ? 420 : -420,
    };
    const camera = cameraTargetForPlayer(player);
    const active = streamedZonesForCamera(camera);
    return { zone, camera, active };
  });
  const transition = measureCameraTransition();
  const checks = [
    ["pass01StillValid", pass01.passed],
    ["pass02StillValid", pass02.passed],
    ["passSequence", PASS03_BUILD.pass === 3],
    ["worldWidthPreserved", SCALE_CONTRACT.nominalWorld.width === 16800],
    ["worldHeightPreserved", SCALE_CONTRACT.nominalWorld.height === 7400],
    ["viewportPreserved", PASS03_VIEWPORT.width === 1400 && PASS03_VIEWPORT.height === 900],
    ["sixTiers", PASS03_TIERS.length === 6],
    ["thirtySixZones", PASS03_ZONES.length === 36],
    ["sixZonesPerTier", PASS03_TIERS.every(tier => PASS03_ZONES.filter(zone => zone.tier === tier.tier).length === 6)],
    ["tierDirectionsAlternate", PASS03_TIERS.map(tier => tier.direction).join(",") === "east,west,east,west,east,west"],
    ["tierSpacingConsistent", PASS03_TIERS.every((tier, index) => index === 0 || PASS03_TIERS[index - 1].top - tier.top === 1200)],
    ["topTierInsideWorld", PASS03_TIERS.at(-1).top >= 0],
    ["bottomTierInsideWorld", PASS03_TIERS[0].floorY < SCALE_CONTRACT.nominalWorld.height],
    ["zonesCoverFullTierWidth", PASS03_TIERS.every(tier => {
      const zones = PASS03_ZONES.filter(zone => zone.tier === tier.tier).sort((a, b) => a.bounds.x - b.bounds.x);
      return zones[0].bounds.x === 0 &&
        zones.at(-1).bounds.x + zones.at(-1).bounds.width === SCALE_CONTRACT.nominalWorld.width &&
        zones.every((zone, index) => index === 0 || zone.bounds.x === zones[index - 1].bounds.x + zones[index - 1].bounds.width);
    })],
    ["allZoneCentersStream", samples.every(sample => sample.active.some(zone => zone.id === sample.zone.id))],
    ["streamSetNeverEmpty", samples.every(sample => sample.active.length > 0)],
    ["streamSetIsBounded", samples.every(sample => sample.active.length <= PASS03_STREAMING.maximumActiveZones)],
    ["streamingDoesNotActivateAllZones", samples.every(sample => sample.active.length < PASS03_ZONES.length)],
    ["cameraXWithinWorld", samples.every(sample => sample.camera.x >= 0 && sample.camera.x <= 15400)],
    ["cameraYWithinWorld", samples.every(sample => sample.camera.y >= 0 && sample.camera.y <= 6500)],
    ["cameraHalfLivesDiffer", PASS03_STREAMING.verticalCameraHalfLife > PASS03_STREAMING.horizontalCameraHalfLife],
    ["liftIsNotInstant", PASS03_STREAMING.liftDurationSeconds >= 1.2],
    ["liftCameraStepBounded", transition.maximumStep < 8],
    ["liftVerticalCameraStepBounded", transition.maximumVerticalStep < 8],
    ["farParallaxSlowerThanMid", PASS03_STREAMING.farParallaxX < PASS03_STREAMING.midParallaxX],
    ["midParallaxSlowerThanTerrain", PASS03_STREAMING.midParallaxX < 1],
    ["verticalParallaxLayered", PASS03_STREAMING.farParallaxY < PASS03_STREAMING.midParallaxY],
    ["connectorsAlternateSides", PASS03_TIERS.slice(0, -1).map(tier => tier.connectorX < 1000 ? "west" : "east").join(",") === "east,west,east,west,east"],
    ["allIdsPreserved", PASS03_ZONES.every((zone, index) => zone.id === `S${String(index + 1).padStart(2, "0")}`)],
    ["noFinalArt", PASS03_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements: Object.freeze({
      worldWidth: SCALE_CONTRACT.nominalWorld.width,
      worldHeight: SCALE_CONTRACT.nominalWorld.height,
      zones: PASS03_ZONES.length,
      tiers: PASS03_TIERS.length,
      maximumSampledActiveZones: Math.max(...samples.map(sample => sample.active.length)),
      minimumSampledActiveZones: Math.min(...samples.map(sample => sample.active.length)),
      liftCameraMaximumStep: transition.maximumStep,
      liftCameraMaximumVerticalStep: transition.maximumVerticalStep,
    }),
  });
}
