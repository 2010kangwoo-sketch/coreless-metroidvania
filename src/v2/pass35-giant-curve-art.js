import { VIEWPORT } from "./config.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS35_CURVE_ASSETS = freezeList([
  { id: "dash_far", src: "assets/v2/pass35/dash-far.webp", type: "image/webp", layer: "far_background", alpha: false, expectedWidth: 1672, expectedHeight: 941, provenance: "pass35_new" },
  { id: "curve_chamber", src: "assets/v2/pass35/curve-chamber.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1402, expectedHeight: 1122, provenance: "pass35_new", bottomEdgeCoverage: 0.5094 },
  { id: "east_dash_vault", src: "assets/v2/pass35/east-dash-vault.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1691, expectedHeight: 930, provenance: "pass35_new", bottomEdgeCoverage: 0.425 },
  { id: "middle_dash_vault", src: "assets/v2/pass35/middle-dash-vault.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1719, expectedHeight: 915, provenance: "pass35_new", bottomEdgeCoverage: 0.4137 },
  { id: "west_dash_vault", src: "assets/v2/pass35/west-dash-vault.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1693, expectedHeight: 929, provenance: "pass35_new", bottomEdgeCoverage: 0.4086 },
  { id: "wave_gallery", src: "assets/v2/pass35/wave-gallery.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1693, expectedHeight: 929, provenance: "pass35_new", bottomEdgeCoverage: 0.6141 },
  { id: "exit_vault", src: "assets/v2/pass35/exit-vault.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1694, expectedHeight: 928, provenance: "pass35_new", bottomEdgeCoverage: 0.4184 },
  { id: "dash_gap_ends", src: "assets/v2/pass35/dash-gap-ends.webp", type: "image/webp", layer: "interactive_structure", alpha: true, expectedWidth: 1536, expectedHeight: 1024, provenance: "pass35_new" },
  { id: "foreground_frame", src: "assets/v2/pass33/foreground-frame.webp", type: "image/webp", layer: "foreground", alpha: true, expectedWidth: 1665, expectedHeight: 944, provenance: "pass33_shared" },
  { id: "route_stone", src: "assets/v2/pass31/route-stone.webp", type: "image/webp", layer: "playable_surface", alpha: true, expectedWidth: 1748, expectedHeight: 202, provenance: "pass31_shared" },
]);

export const PASS35_CURVE_SCENES = freezeList([
  { id: "exit_vault", title: "LEFT EXIT VAULT", anchorCamera: Object.freeze({ x: 10000, y: 4680 }), activationBounds: Object.freeze({ minX: 8300, maxX: 11749.999, minY: 3950, maxY: 5200 }), routeBounds: Object.freeze({ x: 9000, y: 4450, width: 3600, height: 1100 }) },
  { id: "wave_gallery", title: "WAVE GALLERY", anchorCamera: Object.freeze({ x: 13450, y: 4700 }), activationBounds: Object.freeze({ minX: 11750, maxX: 15149.999, minY: 3950, maxY: 5200 }), routeBounds: Object.freeze({ x: 12200, y: 4300, width: 3900, height: 1400 }) },
  { id: "west_dash_vault", title: "WEST DASH VAULT", anchorCamera: Object.freeze({ x: 16800, y: 4700 }), activationBounds: Object.freeze({ minX: 15150, maxX: 18449.999, minY: 3950, maxY: 5200 }), routeBounds: Object.freeze({ x: 15400, y: 4300, width: 3900, height: 1400 }) },
  { id: "middle_dash_vault", title: "MIDDLE DASH VAULT", anchorCamera: Object.freeze({ x: 20100, y: 4680 }), activationBounds: Object.freeze({ minX: 18450, maxX: 21749.999, minY: 3950, maxY: 5200 }), routeBounds: Object.freeze({ x: 18800, y: 4200, width: 3900, height: 1500 }) },
  { id: "east_dash_vault", title: "EAST DASH VAULT", anchorCamera: Object.freeze({ x: 23000, y: 4680 }), activationBounds: Object.freeze({ minX: 21750, maxX: 24199.999, minY: 3950, maxY: 5200 }), routeBounds: Object.freeze({ x: 22200, y: 4250, width: 3100, height: 1500 }) },
  { id: "giant_curve_chamber", title: "GIANT CURVE CHAMBER", anchorCamera: Object.freeze({ x: 24700, y: 4550 }), activationBounds: Object.freeze({ minX: 24200, maxX: 24800, minY: 3900, maxY: 5250 }), routeBounds: Object.freeze({ x: 24400, y: 3950, width: 1600, height: 1800 }) },
]);

const sceneLayers = (prefix, sceneId, structureAsset, options = {}) => [
  { id: `${prefix}_far_slow`, sceneId, assetId: "dash_far", layer: "far_background", x: -180, y: -190, width: 1560, height: 878, cameraRatioX: 0.06, cameraRatioY: 0.055, opacity: 1 },
  { id: `${prefix}_depth`, sceneId, assetId: "dash_far", layer: "depth_background", x: -380, y: -70, width: 1320, height: 743, cameraRatioX: 0.17, cameraRatioY: 0.12, opacity: 0.28 },
  { id: `${prefix}_structure`, sceneId, assetId: structureAsset, layer: "midground", x: options.x ?? -350, y: options.y ?? -125, width: options.width ?? 1900, height: options.height ?? 1060, cameraRatioX: options.ratio ?? 0.45, cameraRatioY: 0.32, opacity: 0.98, continuesBelowViewport: true },
  { id: `${prefix}_foreground`, sceneId, assetId: "foreground_frame", layer: "foreground", x: -2500, y: -44, width: 5200, height: 730, cameraRatioX: 1.07, cameraRatioY: 0.93, opacity: 0.66, minCameraX: options.foregroundMin, maxCameraX: options.foregroundMax },
];

export const PASS35_CURVE_PLACEMENTS = freezeList([
  ...sceneLayers("exit", "exit_vault", "exit_vault", { foregroundMin: 9500, foregroundMax: 10500 }),
  ...sceneLayers("wave", "wave_gallery", "wave_gallery", { foregroundMin: 12950, foregroundMax: 13950 }),
  ...sceneLayers("west", "west_dash_vault", "west_dash_vault", { foregroundMin: 16300, foregroundMax: 17300 }),
  ...sceneLayers("middle", "middle_dash_vault", "middle_dash_vault", { foregroundMin: 19600, foregroundMax: 20600 }),
  ...sceneLayers("east", "east_dash_vault", "east_dash_vault", { foregroundMin: 22500, foregroundMax: 23500 }),
  ...sceneLayers("curve", "giant_curve_chamber", "curve_chamber", { x: 35, y: -160, width: 1160, height: 1120, ratio: 0.49, foregroundMin: 24300, foregroundMax: 24800 }),
]);

export const PASS35_DASH_GAP_SPRITES = freezeList([
  { id: "west_dash_gap_art", gapId: "west_dash_gap", left: Object.freeze({ sx: 60, sy: 62, sw: 520, sh: 250 }), right: Object.freeze({ sx: 910, sy: 62, sw: 520, sh: 250 }), height: 116 },
  { id: "middle_dash_gap_art", gapId: "middle_dash_gap", left: Object.freeze({ sx: 60, sy: 368, sw: 520, sh: 250 }), right: Object.freeze({ sx: 910, sy: 368, sw: 520, sh: 250 }), height: 120 },
  { id: "east_dash_gap_art", gapId: "east_dash_gap", left: Object.freeze({ sx: 60, sy: 690, sw: 520, sh: 260 }), right: Object.freeze({ sx: 910, sy: 690, sw: 520, sh: 260 }), height: 124 },
]);

export const PASS35_CAMERA_SAMPLES = freezeList([
  { id: "curve_entry", sceneId: "giant_curve_chamber", playerX: 24860, playerY: 4380, cameraX: 24480, cameraY: 4050 },
  { id: "curve_apex", sceneId: "giant_curve_chamber", playerX: 25740, playerY: 4780, cameraX: 24800, cameraY: 4400 },
  { id: "curve_landing", sceneId: "giant_curve_chamber", playerX: 25720, playerY: 5340, cameraX: 24800, cameraY: 5000 },
  { id: "east_runout", sceneId: "east_dash_vault", playerX: 24600, playerY: 5080, cameraX: 23800, cameraY: 4680 },
  { id: "east_gap", sceneId: "east_dash_vault", playerX: 22690, playerY: 4752, cameraX: 21900, cameraY: 4440 },
  { id: "east_wave", sceneId: "middle_dash_vault", playerX: 21800, playerY: 4860, cameraX: 21000, cameraY: 4550 },
  { id: "middle_gap", sceneId: "middle_dash_vault", playerX: 19290, playerY: 4702, cameraX: 18500, cameraY: 4390 },
  { id: "middle_wave", sceneId: "west_dash_vault", playerX: 18000, playerY: 4970, cameraX: 17200, cameraY: 4660 },
  { id: "west_gap", sceneId: "west_dash_vault", playerX: 15970, playerY: 4802, cameraX: 15170, cameraY: 4490 },
  { id: "west_landing", sceneId: "wave_gallery", playerX: 14900, playerY: 4976, cameraX: 14100, cameraY: 4660 },
  { id: "wave_center", sceneId: "wave_gallery", playerX: 13200, playerY: 4820, cameraX: 12400, cameraY: 4510 },
  { id: "exit_rise", sceneId: "exit_vault", playerX: 10500, playerY: 4872, cameraX: 9700, cameraY: 4560 },
]);

export const PASS35_CURVE_PLAN = Object.freeze({
  id: "pass35_giant_curve_dash_raster_depth",
  title: "GIANT CURVE DASH PARALLAX DEPTH",
  baselineSha: "46066d9",
  scope: "giant_curve_and_dash_run_only",
  sceneCount: PASS35_CURVE_SCENES.length,
  assetCount: PASS35_CURVE_ASSETS.length,
  newAssetCount: PASS35_CURVE_ASSETS.filter(asset => asset.provenance === "pass35_new").length,
  sharedAssetCount: PASS35_CURVE_ASSETS.filter(asset => asset.provenance !== "pass35_new").length,
  placementCount: PASS35_CURVE_PLACEMENTS.length,
  dashGapSpriteCount: PASS35_DASH_GAP_SPRITES.length,
  layerOrder: Object.freeze(["far_background", "depth_background", "midground", "foreground"]),
  parallaxRatios: Object.freeze({ far: 0.06, depth: 0.17, midMin: 0.45, foreground: 1.07 }),
  valuePlanes: Object.freeze(["deep_shadow", "cool_midtone", "teal_edge_light", "warm_furnace_accent"]),
  playableSurfaceAssetId: "route_stone",
  dashGapAssetId: "dash_gap_ends",
  collisionChanges: 0,
  entryTransition: Object.freeze({ startY: 3900, endY: 4250 }),
  sceneTransitions: freezeList([
    { fromSceneId: "exit_vault", toSceneId: "wave_gallery", startX: 11660, endX: 11840 },
    { fromSceneId: "wave_gallery", toSceneId: "west_dash_vault", startX: 15060, endX: 15240 },
    { fromSceneId: "west_dash_vault", toSceneId: "middle_dash_vault", startX: 18360, endX: 18540 },
    { fromSceneId: "middle_dash_vault", toSceneId: "east_dash_vault", startX: 21660, endX: 21840 },
    { fromSceneId: "east_dash_vault", toSceneId: "giant_curve_chamber", startX: 24110, endX: 24290 },
  ]),
  postPass40Polish: Object.freeze({ timing: "after_pass40_integration", preserveThroughPass40: "current_realistic_high_detail_style", operations: Object.freeze(["subtle_background_blur", "shape_simplification", "character_environment_style_unification"]) }),
  thresholds: Object.freeze({ minimumCameraSamples: 12, maximumFarCameraRatio: 0.1, minimumForegroundCameraRatio: 1.05, minimumParallaxSeparation: 0.95, minimumValuePlanes: 4, minimumBottomEdgeCoverage: 0.4, minimumBelowViewportExtensionPx: 100, visibleSeamColumnsAllowed: 0, foregroundPlayerOverlapAllowed: 0, minimumPlayerContrastRatio: 4.5, maximumFlatPlaceholderCoverage: 0.06, maximumAssetLoadFailures: 0 }),
  renderContract: Object.freeze({ surfaceTopOffsetPx: -3, surfaceMinHeightPx: 52, surfaceMaxHeightPx: 84, playerSafetyRect: Object.freeze({ x: 730, y: 205, width: 118, height: 126 }), measuredPixelRegion: Object.freeze({ x: 0, y: 110, width: VIEWPORT.width, height: 550 }) }),
});

export async function loadPass35CurveAssets() {
  const entries = await Promise.all(PASS35_CURVE_ASSETS.map(asset => new Promise(resolve => {
    const image = new Image(); image.decoding = "async";
    image.onload = () => resolve([asset.id, Object.freeze({ asset, image, loaded: true, width: image.naturalWidth, height: image.naturalHeight })]);
    image.onerror = () => resolve([asset.id, Object.freeze({ asset, image: null, loaded: false, width: 0, height: 0 })]);
    image.src = asset.src;
  })));
  const byId = new Map(entries);
  const loaded = entries.filter(([, record]) => record.loaded);
  return Object.freeze({ byId, loadedCount: loaded.length, failedCount: entries.length - loaded.length, dimensionsValid: loaded.every(([, record]) => record.width === record.asset.expectedWidth && record.height === record.asset.expectedHeight) });
}

export function getPass35ActiveScene(camera) {
  return PASS35_CURVE_SCENES.find(scene => { const b = scene.activationBounds; return camera.x >= b.minX && camera.x <= b.maxX && camera.y >= b.minY && camera.y <= b.maxY; }) ?? null;
}

export function getPass35SceneBlend(camera) {
  for (const transition of PASS35_CURVE_PLAN.sceneTransitions) {
    if (camera.x < transition.startX || camera.x > transition.endX) continue;
    const from = PASS35_CURVE_SCENES.find(scene => scene.id === transition.fromSceneId);
    const to = PASS35_CURVE_SCENES.find(scene => scene.id === transition.toSceneId);
    const toOpacity = (camera.x - transition.startX) / (transition.endX - transition.startX);
    return freezeList([{ scene: from, opacity: 1 - toOpacity }, { scene: to, opacity: toOpacity }]);
  }
  const active = getPass35ActiveScene(camera);
  return active ? freezeList([{ scene: active, opacity: 1 }]) : Object.freeze([]);
}

export function getPass35ScreenPlacement(scene, placement, camera) {
  return Object.freeze({ x: placement.x - (camera.x - scene.anchorCamera.x) * placement.cameraRatioX, y: placement.y - (camera.y - scene.anchorCamera.y) * placement.cameraRatioY, width: placement.width, height: placement.height });
}

export function getPass35EntryOpacity(camera) {
  const t = PASS35_CURVE_PLAN.entryTransition;
  if (camera.y <= t.startY) return 0;
  if (camera.y >= t.endY) return 1;
  return (camera.y - t.startY) / (t.endY - t.startY);
}

export function validatePass35GiantCurveArt() {
  const plan = PASS35_CURVE_PLAN;
  const assetIds = new Set(PASS35_CURVE_ASSETS.map(asset => asset.id));
  const sceneIds = new Set(PASS35_CURVE_SCENES.map(scene => scene.id));
  const byLayer = layer => PASS35_CURVE_PLACEMENTS.filter(item => item.layer === layer);
  const continuation = PASS35_CURVE_PLACEMENTS.filter(item => item.continuesBelowViewport);
  const continuationAssets = continuation.map(item => PASS35_CURVE_ASSETS.find(asset => asset.id === item.assetId));
  const midpointBlends = plan.sceneTransitions.map(t => getPass35SceneBlend({ x: (t.startX + t.endX) / 2, y: 4600 }));
  const checks = [
    ["plan_id", plan.id === "pass35_giant_curve_dash_raster_depth"], ["baseline_sha", plan.baselineSha === "46066d9"], ["scope_explicit", plan.scope === "giant_curve_and_dash_run_only"], ["six_scene_scope", plan.sceneCount === 6], ["ten_assets", plan.assetCount === 10], ["eight_new_assets", plan.newAssetCount === 8], ["two_shared_assets", plan.sharedAssetCount === 2], ["twenty_four_placements", plan.placementCount === 24], ["three_dash_gap_sprites", plan.dashGapSpriteCount === 3],
    ["asset_ids_unique", assetIds.size === PASS35_CURVE_ASSETS.length], ["scene_ids_unique", sceneIds.size === PASS35_CURVE_SCENES.length], ["placement_ids_unique", new Set(PASS35_CURVE_PLACEMENTS.map(item => item.id)).size === PASS35_CURVE_PLACEMENTS.length], ["placement_assets_exist", PASS35_CURVE_PLACEMENTS.every(item => assetIds.has(item.assetId))], ["placement_scenes_exist", PASS35_CURVE_PLACEMENTS.every(item => sceneIds.has(item.sceneId))], ["positive_placement_sizes", PASS35_CURVE_PLACEMENTS.every(item => item.width > 0 && item.height > 0)],
    ["six_far_placements", byLayer("far_background").length === 6], ["six_depth_placements", byLayer("depth_background").length === 6], ["six_mid_placements", byLayer("midground").length === 6], ["six_foreground_placements", byLayer("foreground").length === 6], ["far_slower_than_floor", byLayer("far_background").every(item => item.cameraRatioX <= plan.thresholds.maximumFarCameraRatio)], ["depth_slower_than_mid", byLayer("depth_background").every(item => item.cameraRatioX < Math.min(...byLayer("midground").map(mid => mid.cameraRatioX)))], ["foreground_faster_than_floor", byLayer("foreground").every(item => item.cameraRatioX >= plan.thresholds.minimumForegroundCameraRatio)], ["visible_parallax_separation", Math.min(...byLayer("foreground").map(item => item.cameraRatioX)) - Math.max(...byLayer("far_background").map(item => item.cameraRatioX)) >= plan.thresholds.minimumParallaxSeparation],
    ["four_value_planes", plan.valuePlanes.length >= 4], ["six_continuation_placements", continuation.length === 6], ["continuation_assets_bottom_coverage", continuationAssets.every(asset => asset?.bottomEdgeCoverage >= plan.thresholds.minimumBottomEdgeCoverage)], ["supports_extend_below_viewport", continuation.every(item => item.y + item.height >= VIEWPORT.height + plan.thresholds.minimumBelowViewportExtensionPx)],
    ["twelve_camera_samples", PASS35_CAMERA_SAMPLES.length >= plan.thresholds.minimumCameraSamples], ["samples_cover_all_scenes", new Set(PASS35_CAMERA_SAMPLES.map(item => item.sceneId)).size === 6], ["sample_cameras_active", PASS35_CAMERA_SAMPLES.every(sample => getPass35ActiveScene({ x: sample.cameraX, y: sample.cameraY })?.id === sample.sceneId)], ["five_scene_transitions", plan.sceneTransitions.length === 5], ["transition_widths", plan.sceneTransitions.every(item => item.endX - item.startX === 180)], ["midpoint_crossfades", midpointBlends.every(items => items.length === 2 && items.every(item => Math.abs(item.opacity - 0.5) < 0.001))],
    ["entry_crossfade_height", plan.entryTransition.endY - plan.entryTransition.startY === 350], ["entry_opacity_start", getPass35EntryOpacity({ y: 3900 }) === 0], ["entry_opacity_mid", getPass35EntryOpacity({ y: 4075 }) === 0.5], ["entry_opacity_end", getPass35EntryOpacity({ y: 4250 }) === 1], ["zero_collision_changes", plan.collisionChanges === 0],
    ["surface_asset_exists", assetIds.has(plan.playableSurfaceAssetId)], ["gap_asset_exists", assetIds.has(plan.dashGapAssetId)], ["gap_ids_unique", new Set(PASS35_DASH_GAP_SPRITES.map(item => item.gapId)).size === 3], ["gap_crops_positive", PASS35_DASH_GAP_SPRITES.every(item => item.left.sw > 0 && item.right.sw > 0 && item.height > 0)], ["far_asset_opaque", PASS35_CURVE_ASSETS.find(item => item.id === "dash_far")?.alpha === false], ["structure_cutouts_alpha", PASS35_CURVE_ASSETS.filter(item => item.layer === "midground").every(item => item.alpha === true)], ["dimensions_declared", PASS35_CURVE_ASSETS.every(item => item.expectedWidth > 0 && item.expectedHeight > 0)],
    ["contrast_threshold", plan.thresholds.minimumPlayerContrastRatio >= 4.5], ["flat_placeholder_threshold", plan.thresholds.maximumFlatPlaceholderCoverage <= 0.06], ["no_asset_failures_allowed", plan.thresholds.maximumAssetLoadFailures === 0], ["style_preserved_through_pass40", plan.postPass40Polish.preserveThroughPass40 === "current_realistic_high_detail_style"], ["polish_after_pass40", plan.postPass40Polish.timing === "after_pass40_integration"],
  ].map(([id, passed]) => Object.freeze({ id, passed }));
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
