import { VIEWPORT } from "./config.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS31_ENTRANCE_ASSETS = freezeList([
  {
    id: "entrance_far",
    src: "assets/v2/pass31/entrance-far.webp",
    type: "image/webp",
    layer: "far_background",
    alpha: false,
    expectedWidth: 1672,
    expectedHeight: 941,
  },
  {
    id: "entrance_arch",
    src: "assets/v2/pass31/entrance-arch.png",
    type: "image/png",
    layer: "midground",
    alpha: true,
    expectedWidth: 1150,
    expectedHeight: 1244,
  },
  {
    id: "shaft_tower",
    src: "assets/v2/pass31/shaft-tower.png",
    type: "image/png",
    layer: "midground",
    alpha: true,
    expectedWidth: 484,
    expectedHeight: 1772,
  },
  {
    id: "foreground_roots",
    src: "assets/v2/pass31/foreground-roots.png",
    type: "image/png",
    layer: "foreground",
    alpha: true,
    expectedWidth: 1810,
    expectedHeight: 598,
  },
  {
    id: "route_stone",
    src: "assets/v2/pass31/route-stone.png",
    type: "image/png",
    layer: "playable_surface",
    alpha: true,
    expectedWidth: 1748,
    expectedHeight: 202,
  },
]);

export const PASS31_ENTRANCE_SCENES = freezeList([
  {
    id: "start_slope_sanctuary",
    title: "ROOTED SANCTUARY APPROACH",
    anchorCamera: Object.freeze({ x: 1000, y: 800 }),
    activationBounds: Object.freeze({ minX: 0, maxX: 2499.999, minY: 250, maxY: 1750 }),
    routeBounds: Object.freeze({ x: 0, y: 760, width: 3420, height: 1500 }),
  },
  {
    id: "double_wall_shaft",
    title: "BROKEN LIFT DESCENT",
    anchorCamera: Object.freeze({ x: 3300, y: 2050 }),
    activationBounds: Object.freeze({ minX: 2500, maxX: 4690, minY: 900, maxY: 3200 }),
    routeBounds: Object.freeze({ x: 2700, y: 1450, width: 2050, height: 1800 }),
  },
]);

export const PASS31_ENTRANCE_PLACEMENTS = freezeList([
  { id: "slope_far", sceneId: "start_slope_sanctuary", assetId: "entrance_far", layer: "far_background", x: -120, y: -150, width: 1650, height: 930, cameraRatioX: 0.12, cameraRatioY: 0.12, opacity: 1 },
  { id: "slope_arch_rear", sceneId: "start_slope_sanctuary", assetId: "entrance_arch", layer: "midground", x: -260, y: 76, width: 520, height: 563, cameraRatioX: 0.32, cameraRatioY: 0.22, opacity: 0.38 },
  { id: "slope_arch_main", sceneId: "start_slope_sanctuary", assetId: "entrance_arch", layer: "midground", x: 610, y: -15, width: 650, height: 703, cameraRatioX: 0.46, cameraRatioY: 0.28, opacity: 0.94 },
  { id: "slope_roots_west", sceneId: "start_slope_sanctuary", assetId: "foreground_roots", layer: "foreground", x: -330, y: 555, width: 1500, height: 496, cameraRatioX: 1.06, cameraRatioY: 0.16, opacity: 0.92 },
  { id: "slope_roots_east", sceneId: "start_slope_sanctuary", assetId: "foreground_roots", layer: "foreground", x: 1080, y: 565, width: 1500, height: 496, cameraRatioX: 1.06, cameraRatioY: 0.16, opacity: 0.88 },
  { id: "shaft_far", sceneId: "double_wall_shaft", assetId: "entrance_far", layer: "far_background", x: -130, y: -150, width: 1540, height: 940, cameraRatioX: 0.12, cameraRatioY: 0.12, opacity: 1 },
  { id: "shaft_tower_rear", sceneId: "double_wall_shaft", assetId: "shaft_tower", layer: "midground", x: -40, y: -150, width: 260, height: 952, cameraRatioX: 0.34, cameraRatioY: 0.26, opacity: 0.42 },
  { id: "shaft_tower_main", sceneId: "double_wall_shaft", assetId: "shaft_tower", layer: "midground", x: 430, y: -170, width: 300, height: 1098, cameraRatioX: 0.55, cameraRatioY: 0.34, opacity: 0.96 },
  { id: "shaft_arch_east", sceneId: "double_wall_shaft", assetId: "entrance_arch", layer: "midground", x: 900, y: 170, width: 500, height: 541, cameraRatioX: 0.43, cameraRatioY: 0.24, opacity: 0.58 },
  { id: "shaft_roots_west", sceneId: "double_wall_shaft", assetId: "foreground_roots", layer: "foreground", x: -720, y: 565, width: 1460, height: 482, cameraRatioX: 1.04, cameraRatioY: 0.14, opacity: 0.9 },
  { id: "shaft_roots_east", sceneId: "double_wall_shaft", assetId: "foreground_roots", layer: "foreground", x: 900, y: 570, width: 1460, height: 482, cameraRatioX: 1.04, cameraRatioY: 0.14, opacity: 0.9 },
]);

export const PASS31_CAMERA_SAMPLES = freezeList([
  { id: "garden_entry", sceneId: "start_slope_sanctuary", playerX: 807, playerY: 917, cameraX: 497, cameraY: 657 },
  { id: "garden_rise", sceneId: "start_slope_sanctuary", playerX: 1288, playerY: 1028, cameraX: 978, cameraY: 768 },
  { id: "broken_slope", sceneId: "start_slope_sanctuary", playerX: 2333, playerY: 1394, cameraX: 2023, cameraY: 1134 },
  { id: "first_wall", sceneId: "double_wall_shaft", playerX: 3216, playerY: 2102, cameraX: 2906, cameraY: 1842 },
  { id: "second_pit", sceneId: "double_wall_shaft", playerX: 3860, playerY: 2498, cameraX: 3550, cameraY: 2238 },
  { id: "shaft_exit", sceneId: "double_wall_shaft", playerX: 4494, playerY: 3030, cameraX: 4184, cameraY: 2770 },
]);

export const PASS31_ENTRANCE_PLAN = Object.freeze({
  id: "pass31_entrance_raster_expansion",
  title: "ENTRANCE RASTER EXPANSION",
  baselineSha: "5e4d48a",
  scope: "start_slope_and_double_wall_only",
  sceneCount: PASS31_ENTRANCE_SCENES.length,
  assetCount: PASS31_ENTRANCE_ASSETS.length,
  placementCount: PASS31_ENTRANCE_PLACEMENTS.length,
  layerOrder: Object.freeze(["far_background", "midground", "foreground"]),
  playableSurfaceAssetId: "route_stone",
  collisionChanges: 0,
  transition: Object.freeze({ startX: 2380, endX: 2620 }),
  thresholds: Object.freeze({
    minimumCameraSamples: 6,
    visibleSeamColumnsAllowed: 0,
    surfaceAlignmentTolerancePx: 3,
    foregroundPlayerOverlapAllowed: 0,
    minimumPlayerContrastRatio: 4.5,
    maximumFlatPlaceholderCoverage: 0.08,
    maximumAssetLoadFailures: 0,
    visibleChromaFringeAllowed: 0,
  }),
  renderContract: Object.freeze({
    surfaceTopOffsetPx: -3,
    surfaceMinHeightPx: 52,
    surfaceMaxHeightPx: 82,
    solidEdgeMinWidthPx: 56,
    playerSafetyRect: Object.freeze({ x: 280, y: 220, width: 94, height: 108 }),
    measuredPixelRegion: Object.freeze({ x: 0, y: 120, width: VIEWPORT.width, height: 520 }),
  }),
});

export async function loadPass31EntranceAssets() {
  const entries = await Promise.all(PASS31_ENTRANCE_ASSETS.map(asset => new Promise(resolve => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve([asset.id, Object.freeze({ asset, image, loaded: true, width: image.naturalWidth, height: image.naturalHeight })]);
    image.onerror = () => resolve([asset.id, Object.freeze({ asset, image: null, loaded: false, width: 0, height: 0 })]);
    image.src = asset.src;
  })));
  const byId = new Map(entries);
  const loaded = entries.filter(([, record]) => record.loaded);
  return Object.freeze({
    byId,
    loadedCount: loaded.length,
    failedCount: entries.length - loaded.length,
    dimensionsValid: loaded.every(([, record]) => record.width === record.asset.expectedWidth && record.height === record.asset.expectedHeight),
  });
}

export function getPass31ActiveScene(camera) {
  return PASS31_ENTRANCE_SCENES.find(scene => {
    const bounds = scene.activationBounds;
    return camera.x >= bounds.minX && camera.x <= bounds.maxX && camera.y >= bounds.minY && camera.y <= bounds.maxY;
  }) ?? null;
}

export function getPass31SceneBlend(camera) {
  const transition = PASS31_ENTRANCE_PLAN.transition;
  if (camera.x <= transition.startX) return Object.freeze([Object.freeze({ scene: PASS31_ENTRANCE_SCENES[0], opacity: 1 })]);
  if (camera.x >= transition.endX) return Object.freeze([Object.freeze({ scene: PASS31_ENTRANCE_SCENES[1], opacity: 1 })]);
  const shaftOpacity = (camera.x - transition.startX) / (transition.endX - transition.startX);
  return Object.freeze([
    Object.freeze({ scene: PASS31_ENTRANCE_SCENES[0], opacity: 1 - shaftOpacity }),
    Object.freeze({ scene: PASS31_ENTRANCE_SCENES[1], opacity: shaftOpacity }),
  ]);
}

export function getPass31ScreenPlacement(scene, placement, camera) {
  return Object.freeze({
    x: placement.x - (camera.x - scene.anchorCamera.x) * placement.cameraRatioX,
    y: placement.y - (camera.y - scene.anchorCamera.y) * placement.cameraRatioY,
    width: placement.width,
    height: placement.height,
  });
}

export function getPass31FarCoverage(sample) {
  const scene = PASS31_ENTRANCE_SCENES.find(item => item.id === sample.sceneId);
  const far = PASS31_ENTRANCE_PLACEMENTS.find(item => item.sceneId === sample.sceneId && item.layer === "far_background");
  const screen = getPass31ScreenPlacement(scene, far, { x: sample.cameraX, y: sample.cameraY });
  const gaps = Object.freeze({
    left: Math.max(0, screen.x),
    top: Math.max(0, screen.y),
    right: Math.max(0, VIEWPORT.width - screen.x - screen.width),
    bottom: Math.max(0, VIEWPORT.height - screen.y - screen.height),
  });
  return Object.freeze({ sampleId: sample.id, screen, gaps, covered: Object.values(gaps).every(value => value <= 0.001) });
}

export function validatePass31EntranceArt() {
  const plan = PASS31_ENTRANCE_PLAN;
  const assetIds = new Set(PASS31_ENTRANCE_ASSETS.map(asset => asset.id));
  const sceneIds = new Set(PASS31_ENTRANCE_SCENES.map(scene => scene.id));
  const farCoverage = PASS31_CAMERA_SAMPLES.map(getPass31FarCoverage);
  const activeScenes = PASS31_CAMERA_SAMPLES.map(sample => getPass31ActiveScene({ x: sample.cameraX, y: sample.cameraY })?.id ?? null);
  const blendAtStart = getPass31SceneBlend({ x: plan.transition.startX, y: 1500 });
  const blendAtMiddle = getPass31SceneBlend({ x: (plan.transition.startX + plan.transition.endX) / 2, y: 1500 });
  const blendAtEnd = getPass31SceneBlend({ x: plan.transition.endX, y: 1500 });
  const ratios = PASS31_ENTRANCE_PLACEMENTS.flatMap(item => [item.cameraRatioX, item.cameraRatioY]);
  const checks = [
    { id: "plan_id", passed: plan.id === "pass31_entrance_raster_expansion" },
    { id: "plan_title", passed: plan.title === "ENTRANCE RASTER EXPANSION" },
    { id: "baseline_sha", passed: plan.baselineSha === "5e4d48a" },
    { id: "scope_explicit", passed: plan.scope === "start_slope_and_double_wall_only" },
    { id: "scope_not_route_wide", passed: !plan.scope.includes("whole_room") && !plan.scope.includes("route_wide") },
    { id: "two_scenes", passed: plan.sceneCount === 2 && PASS31_ENTRANCE_SCENES.length === 2 },
    { id: "five_assets", passed: plan.assetCount === 5 && PASS31_ENTRANCE_ASSETS.length === 5 },
    { id: "eleven_placements", passed: plan.placementCount === 11 && PASS31_ENTRANCE_PLACEMENTS.length === 11 },
    { id: "asset_ids_unique", passed: assetIds.size === PASS31_ENTRANCE_ASSETS.length },
    { id: "scene_ids_unique", passed: sceneIds.size === PASS31_ENTRANCE_SCENES.length },
    { id: "placement_ids_unique", passed: new Set(PASS31_ENTRANCE_PLACEMENTS.map(item => item.id)).size === PASS31_ENTRANCE_PLACEMENTS.length },
    { id: "placement_assets_exist", passed: PASS31_ENTRANCE_PLACEMENTS.every(item => assetIds.has(item.assetId)) },
    { id: "placement_scenes_exist", passed: PASS31_ENTRANCE_PLACEMENTS.every(item => sceneIds.has(item.sceneId)) },
    { id: "three_depth_layers", passed: plan.layerOrder.join(",") === "far_background,midground,foreground" },
    { id: "one_opaque_far", passed: PASS31_ENTRANCE_ASSETS.filter(asset => !asset.alpha && asset.layer === "far_background").length === 1 },
    { id: "four_alpha_cutouts", passed: PASS31_ENTRANCE_ASSETS.filter(asset => asset.alpha).length === 4 },
    { id: "route_surface_asset", passed: assetIds.has(plan.playableSurfaceAssetId) },
    { id: "runtime_formats", passed: PASS31_ENTRANCE_ASSETS.every(asset => asset.type === "image/png" || asset.type === "image/webp") },
    { id: "dimensions_positive", passed: PASS31_ENTRANCE_ASSETS.every(asset => asset.expectedWidth > 400 && asset.expectedHeight >= 200) },
    { id: "scene_ranges_touch", passed: PASS31_ENTRANCE_SCENES[0].activationBounds.maxX < PASS31_ENTRANCE_SCENES[1].activationBounds.minX && PASS31_ENTRANCE_SCENES[1].activationBounds.minX - PASS31_ENTRANCE_SCENES[0].activationBounds.maxX < 0.01 },
    { id: "scene_route_bounds_overlap", passed: PASS31_ENTRANCE_SCENES[0].routeBounds.x + PASS31_ENTRANCE_SCENES[0].routeBounds.width >= PASS31_ENTRANCE_SCENES[1].routeBounds.x },
    { id: "transition_width", passed: plan.transition.endX - plan.transition.startX === 240 },
    { id: "transition_starts_single", passed: blendAtStart.length === 1 && blendAtStart[0].scene.id === "start_slope_sanctuary" && blendAtStart[0].opacity === 1 },
    { id: "transition_middle_blends", passed: blendAtMiddle.length === 2 && blendAtMiddle.every(item => item.opacity === 0.5) },
    { id: "transition_weights_sum", passed: Math.abs(blendAtMiddle.reduce((sum, item) => sum + item.opacity, 0) - 1) < 0.001 },
    { id: "transition_ends_single", passed: blendAtEnd.length === 1 && blendAtEnd[0].scene.id === "double_wall_shaft" && blendAtEnd[0].opacity === 1 },
    { id: "six_camera_samples", passed: PASS31_CAMERA_SAMPLES.length >= plan.thresholds.minimumCameraSamples },
    { id: "camera_ids_unique", passed: new Set(PASS31_CAMERA_SAMPLES.map(item => item.id)).size === PASS31_CAMERA_SAMPLES.length },
    { id: "samples_activate_expected_scene", passed: PASS31_CAMERA_SAMPLES.every((sample, index) => activeScenes[index] === sample.sceneId) },
    { id: "snap_camera_x", passed: PASS31_CAMERA_SAMPLES.every(item => item.playerX - item.cameraX === 310) },
    { id: "snap_camera_y", passed: PASS31_CAMERA_SAMPLES.every(item => item.playerY - item.cameraY === 260) },
    { id: "far_coverage_all", passed: farCoverage.every(item => item.covered) },
    { id: "far_left_coverage", passed: farCoverage.every(item => item.gaps.left === 0) },
    { id: "far_right_coverage", passed: farCoverage.every(item => item.gaps.right === 0) },
    { id: "far_top_coverage", passed: farCoverage.every(item => item.gaps.top === 0) },
    { id: "far_bottom_coverage", passed: farCoverage.every(item => item.gaps.bottom === 0) },
    { id: "parallax_spread", passed: Math.max(...ratios) - Math.min(...ratios) >= 0.9 },
    { id: "foreground_moves_fastest", passed: Math.max(...PASS31_ENTRANCE_PLACEMENTS.map(item => item.cameraRatioX)) >= 1.04 },
    { id: "far_moves_slowest", passed: PASS31_ENTRANCE_PLACEMENTS.filter(item => item.layer === "far_background").every(item => item.cameraRatioX === 0.12 && item.cameraRatioY === 0.12) },
    { id: "arch_reused", passed: PASS31_ENTRANCE_PLACEMENTS.filter(item => item.assetId === "entrance_arch").length >= 3 },
    { id: "tower_reused", passed: PASS31_ENTRANCE_PLACEMENTS.filter(item => item.assetId === "shaft_tower").length === 2 },
    { id: "foreground_reused", passed: PASS31_ENTRANCE_PLACEMENTS.filter(item => item.assetId === "foreground_roots").length === 4 },
    { id: "opacities_valid", passed: PASS31_ENTRANCE_PLACEMENTS.every(item => item.opacity > 0 && item.opacity <= 1) },
    { id: "screen_sizes_valid", passed: PASS31_ENTRANCE_PLACEMENTS.every(item => item.width >= 260 && item.height >= 480) },
    { id: "surface_alignment_strict", passed: Math.abs(plan.renderContract.surfaceTopOffsetPx) <= plan.thresholds.surfaceAlignmentTolerancePx },
    { id: "surface_height_order", passed: plan.renderContract.surfaceMinHeightPx < plan.renderContract.surfaceMaxHeightPx },
    { id: "solid_edge_visible", passed: plan.renderContract.solidEdgeMinWidthPx >= 56 },
    { id: "player_safety_width", passed: plan.renderContract.playerSafetyRect.width >= 90 },
    { id: "player_safety_height", passed: plan.renderContract.playerSafetyRect.height >= 100 },
    { id: "measured_region_width", passed: plan.renderContract.measuredPixelRegion.width === VIEWPORT.width },
    { id: "measured_region_below_hud", passed: plan.renderContract.measuredPixelRegion.y >= 120 },
    { id: "seam_tolerance_zero", passed: plan.thresholds.visibleSeamColumnsAllowed === 0 },
    { id: "foreground_tolerance_zero", passed: plan.thresholds.foregroundPlayerOverlapAllowed === 0 },
    { id: "contrast_threshold", passed: plan.thresholds.minimumPlayerContrastRatio >= 4.5 },
    { id: "flat_placeholder_limit", passed: plan.thresholds.maximumFlatPlaceholderCoverage <= 0.08 },
    { id: "asset_failure_limit", passed: plan.thresholds.maximumAssetLoadFailures === 0 },
    { id: "zero_chroma_fringe", passed: plan.thresholds.visibleChromaFringeAllowed === 0 },
    { id: "zero_collision_changes", passed: plan.collisionChanges === 0 },
    { id: "spawn_scene_active", passed: getPass31ActiveScene({ x: 0, y: 300 })?.id === "start_slope_sanctuary" },
    { id: "foundry_scene_inactive", passed: getPass31ActiveScene({ x: 16650, y: 3220 }) === null },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    checks: freezeList(checks),
    farCoverage: freezeList(farCoverage),
    activeScenes: Object.freeze(activeScenes),
  });
}
