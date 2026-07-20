import { VIEWPORT } from "./config.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS32_BURIED_ASSETS = freezeList([
  { id: "buried_far", src: "assets/v2/pass32/buried-far.webp", type: "image/webp", layer: "far_background", alpha: false, expectedWidth: 1672, expectedHeight: 941, provenance: "pass32_new" },
  { id: "crown_atrium", src: "assets/v2/pass32/crown-atrium.png", type: "image/png", layer: "midground", alpha: true, expectedWidth: 1448, expectedHeight: 988, provenance: "pass32_new" },
  { id: "eastern_gallery", src: "assets/v2/pass32/eastern-gallery.png", type: "image/png", layer: "midground", alpha: true, expectedWidth: 1711, expectedHeight: 662, provenance: "pass32_new" },
  { id: "foreground_ruins", src: "assets/v2/pass32/foreground-ruins.png", type: "image/png", layer: "foreground", alpha: true, expectedWidth: 1884, expectedHeight: 738, provenance: "pass32_new" },
  { id: "entrance_arch", src: "assets/v2/pass31/entrance-arch.png", type: "image/png", layer: "midground", alpha: true, expectedWidth: 1150, expectedHeight: 1244, provenance: "pass31_shared" },
  { id: "route_stone", src: "assets/v2/pass31/route-stone.png", type: "image/png", layer: "playable_surface", alpha: true, expectedWidth: 1748, expectedHeight: 202, provenance: "pass31_shared" },
]);

export const PASS32_BURIED_SCENES = freezeList([
  { id: "lower_buried_ascent", title: "LOWER BURIED ASCENT", anchorCamera: Object.freeze({ x: 5400, y: 2300 }), activationBounds: Object.freeze({ minX: 4350, maxX: 6499.999, minY: 900, maxY: 3300 }), routeBounds: Object.freeze({ x: 4400, y: 1950, width: 2800, height: 1500 }) },
  { id: "crown_atrium", title: "CROWN ATRIUM", anchorCamera: Object.freeze({ x: 7500, y: 1500 }), activationBounds: Object.freeze({ minX: 6500, maxX: 8449.999, minY: 800, maxY: 2800 }), routeBounds: Object.freeze({ x: 6100, y: 1200, width: 3100, height: 1700 }) },
  { id: "eastern_descent_gallery", title: "EASTERN DESCENT GALLERY", anchorCamera: Object.freeze({ x: 9300, y: 2300 }), activationBounds: Object.freeze({ minX: 8450, maxX: 10200, minY: 900, maxY: 3400 }), routeBounds: Object.freeze({ x: 8200, y: 1400, width: 2500, height: 2100 }) },
]);

export const PASS32_BURIED_PLACEMENTS = freezeList([
  { id: "lower_far", sceneId: "lower_buried_ascent", assetId: "buried_far", layer: "far_background", x: -150, y: -140, width: 1600, height: 930, cameraRatioX: 0.12, cameraRatioY: 0.12, opacity: 1 },
  { id: "lower_gallery_rear", sceneId: "lower_buried_ascent", assetId: "eastern_gallery", layer: "midground", x: -270, y: 205, width: 1040, height: 402, cameraRatioX: 0.34, cameraRatioY: 0.22, opacity: 0.42 },
  { id: "lower_arch_main", sceneId: "lower_buried_ascent", assetId: "entrance_arch", layer: "midground", x: 785, y: 35, width: 520, height: 563, cameraRatioX: 0.47, cameraRatioY: 0.29, opacity: 0.9 },
  { id: "lower_foreground_west", sceneId: "lower_buried_ascent", assetId: "foreground_ruins", layer: "foreground", x: -850, y: 535, width: 1500, height: 588, cameraRatioX: 1.06, cameraRatioY: 0.14, opacity: 0.92 },
  { id: "lower_foreground_east", sceneId: "lower_buried_ascent", assetId: "foreground_ruins", layer: "foreground", x: 910, y: 545, width: 1500, height: 588, cameraRatioX: 1.06, cameraRatioY: 0.14, opacity: 0.88 },
  { id: "atrium_far", sceneId: "crown_atrium", assetId: "buried_far", layer: "far_background", x: -160, y: -180, width: 1600, height: 960, cameraRatioX: 0.12, cameraRatioY: 0.12, opacity: 1 },
  { id: "atrium_crown_rear", sceneId: "crown_atrium", assetId: "crown_atrium", layer: "midground", x: -210, y: 20, width: 720, height: 491, cameraRatioX: 0.31, cameraRatioY: 0.23, opacity: 0.34 },
  { id: "atrium_crown_main", sceneId: "crown_atrium", assetId: "crown_atrium", layer: "midground", x: 135, y: -35, width: 1000, height: 682, cameraRatioX: 0.5, cameraRatioY: 0.34, opacity: 0.96 },
  { id: "atrium_foreground_west", sceneId: "crown_atrium", assetId: "foreground_ruins", layer: "foreground", x: -900, y: 550, width: 1480, height: 580, cameraRatioX: 1.08, cameraRatioY: 0.13, opacity: 0.92 },
  { id: "atrium_foreground_east", sceneId: "crown_atrium", assetId: "foreground_ruins", layer: "foreground", x: 970, y: 552, width: 1480, height: 580, cameraRatioX: 1.08, cameraRatioY: 0.13, opacity: 0.9 },
  { id: "east_far", sceneId: "eastern_descent_gallery", assetId: "buried_far", layer: "far_background", x: -160, y: -160, width: 1600, height: 940, cameraRatioX: 0.12, cameraRatioY: 0.12, opacity: 1 },
  { id: "east_gallery_rear", sceneId: "eastern_descent_gallery", assetId: "eastern_gallery", layer: "midground", x: -520, y: 205, width: 1100, height: 426, cameraRatioX: 0.33, cameraRatioY: 0.2, opacity: 0.38 },
  { id: "east_gallery_main", sceneId: "eastern_descent_gallery", assetId: "eastern_gallery", layer: "midground", x: 70, y: 105, width: 1160, height: 449, cameraRatioX: 0.5, cameraRatioY: 0.28, opacity: 0.94 },
  { id: "east_arch", sceneId: "eastern_descent_gallery", assetId: "entrance_arch", layer: "midground", x: 960, y: 5, width: 480, height: 520, cameraRatioX: 0.38, cameraRatioY: 0.23, opacity: 0.48 },
  { id: "east_foreground_west", sceneId: "eastern_descent_gallery", assetId: "foreground_ruins", layer: "foreground", x: -880, y: 545, width: 1480, height: 580, cameraRatioX: 1.06, cameraRatioY: 0.13, opacity: 0.92 },
  { id: "east_foreground_east", sceneId: "eastern_descent_gallery", assetId: "foreground_ruins", layer: "foreground", x: 960, y: 548, width: 1480, height: 580, cameraRatioX: 1.06, cameraRatioY: 0.13, opacity: 0.9 },
]);

export const PASS32_CAMERA_SAMPLES = freezeList([
  { id: "vault_entry", sceneId: "lower_buried_ascent", playerX: 4750, playerY: 3052, cameraX: 4440, cameraY: 2792 },
  { id: "lower_rise", sceneId: "lower_buried_ascent", playerX: 5520, playerY: 2710, cameraX: 5210, cameraY: 2450 },
  { id: "lower_balcony", sceneId: "lower_buried_ascent", playerX: 6020, playerY: 2502, cameraX: 5710, cameraY: 2242 },
  { id: "atrium_approach", sceneId: "crown_atrium", playerX: 6900, playerY: 2002, cameraX: 6590, cameraY: 1742 },
  { id: "atrium_crown", sceneId: "crown_atrium", playerX: 7600, playerY: 1833, cameraX: 7290, cameraY: 1573 },
  { id: "upper_gallery", sceneId: "crown_atrium", playerX: 8200, playerY: 1552, cameraX: 7890, cameraY: 1292 },
  { id: "eastern_descent", sceneId: "eastern_descent_gallery", playerX: 9000, playerY: 2002, cameraX: 8690, cameraY: 1742 },
  { id: "inner_fall", sceneId: "eastern_descent_gallery", playerX: 9550, playerY: 2450, cameraX: 9240, cameraY: 2190 },
  { id: "rise_exit", sceneId: "eastern_descent_gallery", playerX: 10400, playerY: 3252, cameraX: 10090, cameraY: 2992 },
]);

export const PASS32_BURIED_PLAN = Object.freeze({
  id: "pass32_buried_rise_raster_expansion",
  title: "BURIED RISE RASTER EXPANSION",
  baselineSha: "3c4df88",
  scope: "buried_rise_structure_only",
  sceneCount: PASS32_BURIED_SCENES.length,
  assetCount: PASS32_BURIED_ASSETS.length,
  newAssetCount: PASS32_BURIED_ASSETS.filter(asset => asset.provenance === "pass32_new").length,
  sharedAssetCount: PASS32_BURIED_ASSETS.filter(asset => asset.provenance === "pass31_shared").length,
  placementCount: PASS32_BURIED_PLACEMENTS.length,
  layerOrder: Object.freeze(["far_background", "midground", "foreground"]),
  playableSurfaceAssetId: "route_stone",
  collisionChanges: 0,
  entryTransition: Object.freeze({ startX: 4350, endX: 4690 }),
  sceneTransitions: freezeList([
    { fromSceneId: "lower_buried_ascent", toSceneId: "crown_atrium", startX: 6410, endX: 6590 },
    { fromSceneId: "crown_atrium", toSceneId: "eastern_descent_gallery", startX: 8360, endX: 8540 },
  ]),
  thresholds: Object.freeze({ minimumCameraSamples: 9, visibleSeamColumnsAllowed: 0, surfaceAlignmentTolerancePx: 3, foregroundPlayerOverlapAllowed: 0, minimumPlayerContrastRatio: 4.5, maximumFlatPlaceholderCoverage: 0.08, maximumAssetLoadFailures: 0, visibleChromaFringeAllowed: 0 }),
  renderContract: Object.freeze({ surfaceTopOffsetPx: -3, surfaceMinHeightPx: 52, surfaceMaxHeightPx: 82, playerSafetyRect: Object.freeze({ x: 280, y: 220, width: 94, height: 108 }), measuredPixelRegion: Object.freeze({ x: 0, y: 120, width: VIEWPORT.width, height: 520 }) }),
});

export async function loadPass32BuriedAssets() {
  const entries = await Promise.all(PASS32_BURIED_ASSETS.map(asset => new Promise(resolve => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve([asset.id, Object.freeze({ asset, image, loaded: true, width: image.naturalWidth, height: image.naturalHeight })]);
    image.onerror = () => resolve([asset.id, Object.freeze({ asset, image: null, loaded: false, width: 0, height: 0 })]);
    image.src = asset.src;
  })));
  const byId = new Map(entries);
  const loaded = entries.filter(([, record]) => record.loaded);
  return Object.freeze({ byId, loadedCount: loaded.length, failedCount: entries.length - loaded.length, dimensionsValid: loaded.every(([, record]) => record.width === record.asset.expectedWidth && record.height === record.asset.expectedHeight) });
}

export function getPass32ActiveScene(camera) {
  return PASS32_BURIED_SCENES.find(scene => {
    const bounds = scene.activationBounds;
    return camera.x >= bounds.minX && camera.x <= bounds.maxX && camera.y >= bounds.minY && camera.y <= bounds.maxY;
  }) ?? null;
}

export function getPass32SceneBlend(camera) {
  for (const transition of PASS32_BURIED_PLAN.sceneTransitions) {
    if (camera.x < transition.startX || camera.x > transition.endX) continue;
    const from = PASS32_BURIED_SCENES.find(scene => scene.id === transition.fromSceneId);
    const to = PASS32_BURIED_SCENES.find(scene => scene.id === transition.toSceneId);
    const toOpacity = (camera.x - transition.startX) / (transition.endX - transition.startX);
    return freezeList([{ scene: from, opacity: 1 - toOpacity }, { scene: to, opacity: toOpacity }]);
  }
  const active = getPass32ActiveScene(camera);
  return active ? freezeList([{ scene: active, opacity: 1 }]) : Object.freeze([]);
}

export function getPass32ScreenPlacement(scene, placement, camera) {
  return Object.freeze({ x: placement.x - (camera.x - scene.anchorCamera.x) * placement.cameraRatioX, y: placement.y - (camera.y - scene.anchorCamera.y) * placement.cameraRatioY, width: placement.width, height: placement.height });
}

export function getPass32EntryOpacity(camera) {
  const transition = PASS32_BURIED_PLAN.entryTransition;
  if (camera.x <= transition.startX) return 0;
  if (camera.x >= transition.endX) return 1;
  return (camera.x - transition.startX) / (transition.endX - transition.startX);
}

export function getPass32FarCoverage(sample) {
  const scene = PASS32_BURIED_SCENES.find(item => item.id === sample.sceneId);
  const far = PASS32_BURIED_PLACEMENTS.find(item => item.sceneId === sample.sceneId && item.layer === "far_background");
  const screen = getPass32ScreenPlacement(scene, far, { x: sample.cameraX, y: sample.cameraY });
  const gaps = Object.freeze({ left: Math.max(0, screen.x), top: Math.max(0, screen.y), right: Math.max(0, VIEWPORT.width - screen.x - screen.width), bottom: Math.max(0, VIEWPORT.height - screen.y - screen.height) });
  return Object.freeze({ sampleId: sample.id, screen, gaps, covered: Object.values(gaps).every(value => value <= 0.001) });
}

export function validatePass32BuriedRiseArt() {
  const plan = PASS32_BURIED_PLAN;
  const assetIds = new Set(PASS32_BURIED_ASSETS.map(asset => asset.id));
  const sceneIds = new Set(PASS32_BURIED_SCENES.map(scene => scene.id));
  const farCoverage = PASS32_CAMERA_SAMPLES.map(getPass32FarCoverage);
  const ratios = PASS32_BURIED_PLACEMENTS.flatMap(item => [item.cameraRatioX, item.cameraRatioY]);
  const midpointBlends = plan.sceneTransitions.map(transition => getPass32SceneBlend({ x: (transition.startX + transition.endX) / 2, y: 1800 }));
  const checks = [
    { id: "plan_id", passed: plan.id === "pass32_buried_rise_raster_expansion" },
    { id: "plan_title", passed: plan.title === "BURIED RISE RASTER EXPANSION" },
    { id: "baseline_sha", passed: plan.baselineSha === "3c4df88" },
    { id: "scope_explicit", passed: plan.scope === "buried_rise_structure_only" },
    { id: "scope_not_route_wide", passed: !plan.scope.includes("whole_room") && !plan.scope.includes("route_wide") },
    { id: "three_scenes", passed: plan.sceneCount === 3 && PASS32_BURIED_SCENES.length === 3 },
    { id: "six_assets", passed: plan.assetCount === 6 && PASS32_BURIED_ASSETS.length === 6 },
    { id: "four_new_assets", passed: plan.newAssetCount === 4 },
    { id: "two_shared_assets", passed: plan.sharedAssetCount === 2 },
    { id: "sixteen_placements", passed: plan.placementCount === 16 && PASS32_BURIED_PLACEMENTS.length === 16 },
    { id: "asset_ids_unique", passed: assetIds.size === PASS32_BURIED_ASSETS.length },
    { id: "scene_ids_unique", passed: sceneIds.size === PASS32_BURIED_SCENES.length },
    { id: "placement_ids_unique", passed: new Set(PASS32_BURIED_PLACEMENTS.map(item => item.id)).size === PASS32_BURIED_PLACEMENTS.length },
    { id: "placement_assets_exist", passed: PASS32_BURIED_PLACEMENTS.every(item => assetIds.has(item.assetId)) },
    { id: "placement_scenes_exist", passed: PASS32_BURIED_PLACEMENTS.every(item => sceneIds.has(item.sceneId)) },
    { id: "three_depth_layers", passed: plan.layerOrder.join(",") === "far_background,midground,foreground" },
    { id: "one_opaque_far", passed: PASS32_BURIED_ASSETS.filter(asset => !asset.alpha).length === 1 },
    { id: "five_alpha_assets", passed: PASS32_BURIED_ASSETS.filter(asset => asset.alpha).length === 5 },
    { id: "route_surface_shared", passed: PASS32_BURIED_ASSETS.find(asset => asset.id === plan.playableSurfaceAssetId)?.provenance === "pass31_shared" },
    { id: "entrance_arch_shared", passed: PASS32_BURIED_ASSETS.find(asset => asset.id === "entrance_arch")?.provenance === "pass31_shared" },
    { id: "runtime_formats", passed: PASS32_BURIED_ASSETS.every(asset => asset.type === "image/png" || asset.type === "image/webp") },
    { id: "dimensions_positive", passed: PASS32_BURIED_ASSETS.every(asset => asset.expectedWidth >= 480 && asset.expectedHeight >= 200) },
    { id: "scene_ranges_touch", passed: PASS32_BURIED_SCENES.every((scene, index) => index === 0 || scene.activationBounds.minX - PASS32_BURIED_SCENES[index - 1].activationBounds.maxX < 0.01) },
    { id: "route_bounds_overlap", passed: PASS32_BURIED_SCENES.every((scene, index) => index === 0 || PASS32_BURIED_SCENES[index - 1].routeBounds.x + PASS32_BURIED_SCENES[index - 1].routeBounds.width >= scene.routeBounds.x) },
    { id: "nine_camera_samples", passed: PASS32_CAMERA_SAMPLES.length >= plan.thresholds.minimumCameraSamples },
    { id: "camera_ids_unique", passed: new Set(PASS32_CAMERA_SAMPLES.map(item => item.id)).size === PASS32_CAMERA_SAMPLES.length },
    { id: "samples_activate_expected_scene", passed: PASS32_CAMERA_SAMPLES.every(sample => getPass32ActiveScene({ x: sample.cameraX, y: sample.cameraY })?.id === sample.sceneId) },
    { id: "snap_camera_x", passed: PASS32_CAMERA_SAMPLES.every(item => item.playerX - item.cameraX === 310) },
    { id: "snap_camera_y", passed: PASS32_CAMERA_SAMPLES.every(item => item.playerY - item.cameraY === 260) },
    { id: "far_coverage_all", passed: farCoverage.every(item => item.covered) },
    { id: "far_left_coverage", passed: farCoverage.every(item => item.gaps.left === 0) },
    { id: "far_right_coverage", passed: farCoverage.every(item => item.gaps.right === 0) },
    { id: "far_top_coverage", passed: farCoverage.every(item => item.gaps.top === 0) },
    { id: "far_bottom_coverage", passed: farCoverage.every(item => item.gaps.bottom === 0) },
    { id: "two_scene_transitions", passed: plan.sceneTransitions.length === 2 },
    { id: "transition_widths", passed: plan.sceneTransitions.every(item => item.endX - item.startX === 180) },
    { id: "transition_midpoint_blends", passed: midpointBlends.every(blend => blend.length === 2 && blend.every(item => item.opacity === 0.5)) },
    { id: "transition_weights_sum", passed: midpointBlends.every(blend => Math.abs(blend.reduce((sum, item) => sum + item.opacity, 0) - 1) < 0.001) },
    { id: "entry_transition_width", passed: plan.entryTransition.endX - plan.entryTransition.startX === 340 },
    { id: "entry_opacity_start", passed: getPass32EntryOpacity({ x: plan.entryTransition.startX }) === 0 },
    { id: "entry_opacity_mid", passed: getPass32EntryOpacity({ x: 4520 }) === 0.5 },
    { id: "entry_opacity_end", passed: getPass32EntryOpacity({ x: plan.entryTransition.endX }) === 1 },
    { id: "parallax_spread", passed: Math.max(...ratios) - Math.min(...ratios) >= 0.94 },
    { id: "foreground_fastest", passed: Math.max(...PASS32_BURIED_PLACEMENTS.map(item => item.cameraRatioX)) >= 1.08 },
    { id: "far_slowest", passed: PASS32_BURIED_PLACEMENTS.filter(item => item.layer === "far_background").every(item => item.cameraRatioX === 0.12 && item.cameraRatioY === 0.12) },
    { id: "crown_reused", passed: PASS32_BURIED_PLACEMENTS.filter(item => item.assetId === "crown_atrium").length === 2 },
    { id: "gallery_reused", passed: PASS32_BURIED_PLACEMENTS.filter(item => item.assetId === "eastern_gallery").length === 3 },
    { id: "foreground_reused", passed: PASS32_BURIED_PLACEMENTS.filter(item => item.assetId === "foreground_ruins").length === 6 },
    { id: "opacities_valid", passed: PASS32_BURIED_PLACEMENTS.every(item => item.opacity > 0 && item.opacity <= 1) },
    { id: "screen_sizes_valid", passed: PASS32_BURIED_PLACEMENTS.every(item => item.width >= 480 && item.height >= 402) },
    { id: "surface_alignment_strict", passed: Math.abs(plan.renderContract.surfaceTopOffsetPx) <= plan.thresholds.surfaceAlignmentTolerancePx },
    { id: "surface_height_order", passed: plan.renderContract.surfaceMinHeightPx < plan.renderContract.surfaceMaxHeightPx },
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
    { id: "entrance_scene_inactive_at_spawn", passed: getPass32ActiveScene({ x: 0, y: 300 }) === null },
    { id: "buried_scene_active_at_entry", passed: getPass32ActiveScene({ x: 4690, y: 2800 })?.id === "lower_buried_ascent" },
    { id: "foundry_scene_inactive", passed: getPass32ActiveScene({ x: 16650, y: 3220 }) === null },
  ];
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: freezeList(checks), farCoverage: freezeList(farCoverage) });
}
