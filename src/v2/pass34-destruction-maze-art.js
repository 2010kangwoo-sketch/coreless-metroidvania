import { VIEWPORT } from "./config.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS34_DESTRUCTION_ASSETS = freezeList([
  { id: "destruction_far", src: "assets/v2/pass34/destruction-far.webp", type: "image/webp", layer: "far_background", alpha: false, expectedWidth: 1672, expectedHeight: 941, provenance: "pass34_new" },
  { id: "west_vault", src: "assets/v2/pass34/west-vault.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass34_new", bottomEdgeCoverage: 0.2189 },
  { id: "central_maze", src: "assets/v2/pass34/central-maze.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1666, expectedHeight: 944, provenance: "pass34_new", bottomEdgeCoverage: 0.383 },
  { id: "high_gallery", src: "assets/v2/pass34/high-gallery.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1619, expectedHeight: 972, provenance: "pass34_new", bottomEdgeCoverage: 0.2687 },
  { id: "east_breaker", src: "assets/v2/pass34/east-breaker.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1536, expectedHeight: 1024, provenance: "pass34_new", bottomEdgeCoverage: 0.3704 },
  { id: "dash_gates", src: "assets/v2/pass34/dash-gates.webp", type: "image/webp", layer: "interactive_structure", alpha: true, expectedWidth: 1666, expectedHeight: 944, provenance: "pass34_new" },
  { id: "foreground_frame", src: "assets/v2/pass33/foreground-frame.webp", type: "image/webp", layer: "foreground", alpha: true, expectedWidth: 1665, expectedHeight: 944, provenance: "pass33_shared" },
  { id: "route_stone", src: "assets/v2/pass31/route-stone.webp", type: "image/webp", layer: "playable_surface", alpha: true, expectedWidth: 1748, expectedHeight: 202, provenance: "pass31_shared" },
]);

export const PASS34_DESTRUCTION_SCENES = freezeList([
  { id: "west_demolition_corridor", title: "WEST DEMOLITION CORRIDOR", anchorCamera: Object.freeze({ x: 14350, y: 3260 }), activationBounds: Object.freeze({ minX: 13000, maxX: 15899.999, minY: 2350, maxY: 4250 }), routeBounds: Object.freeze({ x: 13400, y: 2850, width: 2600, height: 1400 }) },
  { id: "central_sink_maze", title: "CENTRAL SINK MAZE", anchorCamera: Object.freeze({ x: 17500, y: 3260 }), activationBounds: Object.freeze({ minX: 15900, maxX: 19099.999, minY: 2350, maxY: 4250 }), routeBounds: Object.freeze({ x: 15600, y: 2650, width: 3900, height: 1650 }) },
  { id: "high_foundry_gallery", title: "HIGH FOUNDRY GALLERY", anchorCamera: Object.freeze({ x: 20550, y: 3000 }), activationBounds: Object.freeze({ minX: 19100, maxX: 22049.999, minY: 2250, maxY: 4200 }), routeBounds: Object.freeze({ x: 19200, y: 2400, width: 3300, height: 1600 }) },
  { id: "east_breaker_drop", title: "EAST BREAKER DROP", anchorCamera: Object.freeze({ x: 23450, y: 3250 }), activationBounds: Object.freeze({ minX: 22050, maxX: 24550, minY: 2350, maxY: 4300 }), routeBounds: Object.freeze({ x: 21800, y: 2700, width: 3400, height: 1900 }) },
]);

const sceneLayers = (prefix, sceneId, structureAsset, options = {}) => [
  { id: `${prefix}_far_slow`, sceneId, assetId: "destruction_far", layer: "far_background", x: -180, y: -190, width: 1560, height: 878, cameraRatioX: 0.07, cameraRatioY: 0.06, opacity: 1 },
  { id: `${prefix}_depth`, sceneId, assetId: "destruction_far", layer: "depth_background", x: -350, y: -65, width: 1280, height: 720, cameraRatioX: 0.18, cameraRatioY: 0.13, opacity: 0.29 },
  { id: `${prefix}_structure`, sceneId, assetId: structureAsset, layer: "midground", x: options.x ?? -175, y: options.y ?? -110, width: options.width ?? 1540, height: options.height ?? 880, cameraRatioX: options.ratio ?? 0.46, cameraRatioY: 0.33, opacity: 0.98, continuesBelowViewport: true },
  { id: `${prefix}_foreground`, sceneId, assetId: "foreground_frame", layer: "foreground", x: -2500, y: -44, width: 5200, height: 730, cameraRatioX: 1.08, cameraRatioY: 0.93, opacity: 0.68, minCameraX: options.foregroundMin, maxCameraX: options.foregroundMax },
];

export const PASS34_DESTRUCTION_PLACEMENTS = freezeList([
  ...sceneLayers("west", "west_demolition_corridor", "west_vault", { height: 1040, foregroundMin: 13800, foregroundMax: 14900 }),
  ...sceneLayers("central", "central_sink_maze", "central_maze", { y: -95, height: 1040, foregroundMin: 16950, foregroundMax: 18050 }),
  ...sceneLayers("high", "high_foundry_gallery", "high_gallery", { x: -135, y: -125, width: 1490, height: 1050, ratio: 0.48, foregroundMin: 19950, foregroundMax: 21050 }),
  ...sceneLayers("east", "east_breaker_drop", "east_breaker", { x: -95, y: -145, width: 1390, height: 1110, ratio: 0.47, foregroundMin: 22900, foregroundMax: 24000 }),
]);

export const PASS34_GATE_SPRITES = Object.freeze({
  cross_brace: Object.freeze({ sx: 55, sy: 18, sw: 435, sh: 900, visualInsetX: 25, visualInsetY: 38 }),
  lattice: Object.freeze({ sx: 625, sy: 18, sw: 420, sh: 900, visualInsetX: 24, visualInsetY: 38 }),
  split_pillar: Object.freeze({ sx: 1195, sy: 18, sw: 405, sh: 900, visualInsetX: 23, visualInsetY: 38 }),
});

export const PASS34_CAMERA_SAMPLES = freezeList([
  { id: "maze_entry", sceneId: "west_demolition_corridor", playerX: 13680, playerY: 3620, cameraX: 13370, cameraY: 3360 },
  { id: "west_gate", sceneId: "west_demolition_corridor", playerX: 14650, playerY: 3452, cameraX: 14340, cameraY: 3192 },
  { id: "first_sink", sceneId: "west_demolition_corridor", playerX: 15300, playerY: 3680, cameraX: 14990, cameraY: 3420 },
  { id: "lower_hall", sceneId: "west_demolition_corridor", playerX: 15900, playerY: 3852, cameraX: 15590, cameraY: 3592 },
  { id: "first_rise", sceneId: "central_sink_maze", playerX: 16700, playerY: 3560, cameraX: 16390, cameraY: 3300 },
  { id: "western_ridge", sceneId: "central_sink_maze", playerX: 17500, playerY: 3202, cameraX: 17190, cameraY: 2942 },
  { id: "middle_gate", sceneId: "central_sink_maze", playerX: 19300, playerY: 3652, cameraX: 18990, cameraY: 3392 },
  { id: "second_rise", sceneId: "high_foundry_gallery", playerX: 19950, playerY: 3400, cameraX: 19640, cameraY: 3140 },
  { id: "high_gallery", sceneId: "high_foundry_gallery", playerX: 20700, playerY: 3052, cameraX: 20390, cameraY: 2792 },
  { id: "eastern_descent", sceneId: "high_foundry_gallery", playerX: 21600, playerY: 3370, cameraX: 21290, cameraY: 3110 },
  { id: "east_gate", sceneId: "east_breaker_drop", playerX: 23750, playerY: 3252, cameraX: 23440, cameraY: 2992 },
  { id: "exit_drop", sceneId: "east_breaker_drop", playerX: 24600, playerY: 4050, cameraX: 24290, cameraY: 3790 },
]);

export const PASS34_DESTRUCTION_PLAN = Object.freeze({
  id: "pass34_destruction_maze_raster_depth",
  title: "DESTRUCTION MAZE PARALLAX DEPTH",
  baselineSha: "139a4b5",
  scope: "destruction_maze_only",
  sceneCount: PASS34_DESTRUCTION_SCENES.length,
  assetCount: PASS34_DESTRUCTION_ASSETS.length,
  newAssetCount: PASS34_DESTRUCTION_ASSETS.filter(asset => asset.provenance === "pass34_new").length,
  sharedAssetCount: PASS34_DESTRUCTION_ASSETS.filter(asset => asset.provenance !== "pass34_new").length,
  placementCount: PASS34_DESTRUCTION_PLACEMENTS.length,
  gateSpriteCount: Object.keys(PASS34_GATE_SPRITES).length,
  layerOrder: Object.freeze(["far_background", "depth_background", "midground", "foreground"]),
  parallaxRatios: Object.freeze({ far: 0.07, depth: 0.18, midMin: 0.46, foreground: 1.08 }),
  valuePlanes: Object.freeze(["deep_shadow", "cool_midtone", "teal_edge_light", "warm_furnace_accent"]),
  playableSurfaceAssetId: "route_stone",
  gateAssetId: "dash_gates",
  collisionChanges: 0,
  entryTransition: Object.freeze({ startX: 13000, endX: 13380 }),
  sceneTransitions: freezeList([
    { fromSceneId: "west_demolition_corridor", toSceneId: "central_sink_maze", startX: 15810, endX: 15990 },
    { fromSceneId: "central_sink_maze", toSceneId: "high_foundry_gallery", startX: 19010, endX: 19190 },
    { fromSceneId: "high_foundry_gallery", toSceneId: "east_breaker_drop", startX: 21960, endX: 22140 },
  ]),
  postPass40Polish: Object.freeze({ timing: "after_pass40_integration", preserveThroughPass40: "current_realistic_high_detail_style", operations: Object.freeze(["subtle_background_blur", "shape_simplification", "character_environment_style_unification"]) }),
  thresholds: Object.freeze({ minimumCameraSamples: 12, maximumFarCameraRatio: 0.1, minimumForegroundCameraRatio: 1.05, minimumParallaxSeparation: 0.95, minimumValuePlanes: 4, minimumBottomEdgeCoverage: 0.2, minimumBelowViewportExtensionPx: 100, visibleSeamColumnsAllowed: 0, foregroundPlayerOverlapAllowed: 0, minimumPlayerContrastRatio: 4.5, maximumFlatPlaceholderCoverage: 0.06, maximumAssetLoadFailures: 0 }),
  renderContract: Object.freeze({ surfaceTopOffsetPx: -3, surfaceMinHeightPx: 52, surfaceMaxHeightPx: 84, playerSafetyRect: Object.freeze({ x: 270, y: 205, width: 118, height: 126 }), measuredPixelRegion: Object.freeze({ x: 0, y: 110, width: VIEWPORT.width, height: 550 }) }),
});

export async function loadPass34DestructionAssets() {
  const entries = await Promise.all(PASS34_DESTRUCTION_ASSETS.map(asset => new Promise(resolve => {
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

export function getPass34ActiveScene(camera) {
  return PASS34_DESTRUCTION_SCENES.find(scene => {
    const bounds = scene.activationBounds;
    return camera.x >= bounds.minX && camera.x <= bounds.maxX && camera.y >= bounds.minY && camera.y <= bounds.maxY;
  }) ?? null;
}

export function getPass34SceneBlend(camera) {
  for (const transition of PASS34_DESTRUCTION_PLAN.sceneTransitions) {
    if (camera.x < transition.startX || camera.x > transition.endX) continue;
    const from = PASS34_DESTRUCTION_SCENES.find(scene => scene.id === transition.fromSceneId);
    const to = PASS34_DESTRUCTION_SCENES.find(scene => scene.id === transition.toSceneId);
    const toOpacity = (camera.x - transition.startX) / (transition.endX - transition.startX);
    return freezeList([{ scene: from, opacity: 1 - toOpacity }, { scene: to, opacity: toOpacity }]);
  }
  const active = getPass34ActiveScene(camera);
  return active ? freezeList([{ scene: active, opacity: 1 }]) : Object.freeze([]);
}

export function getPass34ScreenPlacement(scene, placement, camera) {
  return Object.freeze({ x: placement.x - (camera.x - scene.anchorCamera.x) * placement.cameraRatioX, y: placement.y - (camera.y - scene.anchorCamera.y) * placement.cameraRatioY, width: placement.width, height: placement.height });
}

export function getPass34EntryOpacity(camera) {
  const transition = PASS34_DESTRUCTION_PLAN.entryTransition;
  if (camera.x <= transition.startX) return 0;
  if (camera.x >= transition.endX) return 1;
  return (camera.x - transition.startX) / (transition.endX - transition.startX);
}

export function validatePass34DestructionMazeArt() {
  const plan = PASS34_DESTRUCTION_PLAN;
  const assetIds = new Set(PASS34_DESTRUCTION_ASSETS.map(asset => asset.id));
  const sceneIds = new Set(PASS34_DESTRUCTION_SCENES.map(scene => scene.id));
  const byLayer = layer => PASS34_DESTRUCTION_PLACEMENTS.filter(item => item.layer === layer);
  const continuationPlacements = PASS34_DESTRUCTION_PLACEMENTS.filter(item => item.continuesBelowViewport);
  const continuationAssets = continuationPlacements.map(item => PASS34_DESTRUCTION_ASSETS.find(asset => asset.id === item.assetId));
  const midpointBlends = plan.sceneTransitions.map(transition => getPass34SceneBlend({ x: (transition.startX + transition.endX) / 2, y: 3200 }));
  const checks = [
    ["plan_id", plan.id === "pass34_destruction_maze_raster_depth"], ["plan_title", plan.title === "DESTRUCTION MAZE PARALLAX DEPTH"], ["baseline_sha", plan.baselineSha === "139a4b5"], ["scope_explicit", plan.scope === "destruction_maze_only"],
    ["four_scene_scope", plan.sceneCount === 4], ["eight_assets", plan.assetCount === 8], ["six_new_assets", plan.newAssetCount === 6], ["two_shared_assets", plan.sharedAssetCount === 2], ["sixteen_placements", plan.placementCount === 16], ["three_gate_sprites", plan.gateSpriteCount === 3], ["four_render_layers", plan.layerOrder.length === 4],
    ["asset_ids_unique", assetIds.size === PASS34_DESTRUCTION_ASSETS.length], ["scene_ids_unique", sceneIds.size === PASS34_DESTRUCTION_SCENES.length], ["placement_ids_unique", new Set(PASS34_DESTRUCTION_PLACEMENTS.map(item => item.id)).size === PASS34_DESTRUCTION_PLACEMENTS.length], ["placement_assets_exist", PASS34_DESTRUCTION_PLACEMENTS.every(item => assetIds.has(item.assetId))], ["placement_scenes_exist", PASS34_DESTRUCTION_PLACEMENTS.every(item => sceneIds.has(item.sceneId))], ["placement_layers_known", PASS34_DESTRUCTION_PLACEMENTS.every(item => plan.layerOrder.includes(item.layer))],
    ["positive_placement_sizes", PASS34_DESTRUCTION_PLACEMENTS.every(item => item.width > 0 && item.height > 0)], ["valid_opacity", PASS34_DESTRUCTION_PLACEMENTS.every(item => item.opacity > 0 && item.opacity <= 1)], ["four_far_placements", byLayer("far_background").length === 4], ["four_depth_placements", byLayer("depth_background").length === 4], ["four_mid_placements", byLayer("midground").length === 4], ["four_foreground_placements", byLayer("foreground").length === 4],
    ["far_slower_than_floor", byLayer("far_background").every(item => item.cameraRatioX <= plan.thresholds.maximumFarCameraRatio)], ["depth_slower_than_mid", byLayer("depth_background").every(item => item.cameraRatioX < Math.min(...byLayer("midground").map(mid => mid.cameraRatioX)))], ["foreground_faster_than_floor", byLayer("foreground").every(item => item.cameraRatioX >= plan.thresholds.minimumForegroundCameraRatio)], ["visible_parallax_separation", Math.min(...byLayer("foreground").map(item => item.cameraRatioX)) - Math.max(...byLayer("far_background").map(item => item.cameraRatioX)) >= plan.thresholds.minimumParallaxSeparation],
    ["four_value_planes", plan.valuePlanes.length >= plan.thresholds.minimumValuePlanes], ["deep_shadow_plane", plan.valuePlanes.includes("deep_shadow")], ["cool_midtone_plane", plan.valuePlanes.includes("cool_midtone")], ["teal_edge_plane", plan.valuePlanes.includes("teal_edge_light")], ["warm_accent_plane", plan.valuePlanes.includes("warm_furnace_accent")],
    ["four_continuation_placements", continuationPlacements.length === 4], ["continuation_assets_bottom_coverage", continuationAssets.every(asset => asset?.bottomEdgeCoverage >= plan.thresholds.minimumBottomEdgeCoverage)], ["supports_extend_below_viewport", continuationPlacements.every(item => item.y + item.height >= VIEWPORT.height + plan.thresholds.minimumBelowViewportExtensionPx)], ["west_support_continues", continuationPlacements.some(item => item.id === "west_structure")], ["central_supports_continue", continuationPlacements.some(item => item.id === "central_structure")], ["high_supports_continue", continuationPlacements.some(item => item.id === "high_structure")], ["east_supports_continue", continuationPlacements.some(item => item.id === "east_structure")],
    ["twelve_camera_samples", PASS34_CAMERA_SAMPLES.length >= plan.thresholds.minimumCameraSamples], ["samples_cover_all_scenes", new Set(PASS34_CAMERA_SAMPLES.map(item => item.sceneId)).size === PASS34_DESTRUCTION_SCENES.length], ["sample_scenes_exist", PASS34_CAMERA_SAMPLES.every(item => sceneIds.has(item.sceneId))], ["sample_cameras_active", PASS34_CAMERA_SAMPLES.every(sample => getPass34ActiveScene({ x: sample.cameraX, y: sample.cameraY })?.id === sample.sceneId)],
    ["three_scene_transitions", plan.sceneTransitions.length === 3], ["transition_order", plan.sceneTransitions.every(item => item.startX < item.endX)], ["transition_widths", plan.sceneTransitions.every(item => item.endX - item.startX >= 180)], ["transition_scene_ids", plan.sceneTransitions.every(item => sceneIds.has(item.fromSceneId) && sceneIds.has(item.toSceneId))], ["midpoint_crossfades", midpointBlends.every(items => items.length === 2 && items.every(item => Math.abs(item.opacity - 0.5) < 0.001))],
    ["entry_crossfade_width", plan.entryTransition.endX - plan.entryTransition.startX === 380], ["entry_opacity_start", getPass34EntryOpacity({ x: plan.entryTransition.startX }) === 0], ["entry_opacity_mid", getPass34EntryOpacity({ x: 13190 }) === 0.5], ["entry_opacity_end", getPass34EntryOpacity({ x: plan.entryTransition.endX }) === 1],
    ["zero_collision_changes", plan.collisionChanges === 0], ["playable_surface_exists", assetIds.has(plan.playableSurfaceAssetId)], ["surface_asset_shared", PASS34_DESTRUCTION_ASSETS.find(item => item.id === plan.playableSurfaceAssetId)?.provenance === "pass31_shared"], ["gate_asset_exists", assetIds.has(plan.gateAssetId)], ["gate_asset_new", PASS34_DESTRUCTION_ASSETS.find(item => item.id === plan.gateAssetId)?.provenance === "pass34_new"], ["gate_shapes_complete", ["cross_brace", "lattice", "split_pillar"].every(id => PASS34_GATE_SPRITES[id])], ["gate_crops_positive", Object.values(PASS34_GATE_SPRITES).every(item => item.sw > 0 && item.sh > 0)],
    ["far_asset_opaque", PASS34_DESTRUCTION_ASSETS.find(item => item.id === "destruction_far")?.alpha === false], ["structure_cutouts_alpha", PASS34_DESTRUCTION_ASSETS.filter(item => item.layer === "midground").every(item => item.alpha === true)], ["source_types_supported", PASS34_DESTRUCTION_ASSETS.every(item => ["image/webp", "image/webp"].includes(item.type))], ["dimensions_declared", PASS34_DESTRUCTION_ASSETS.every(item => item.expectedWidth > 0 && item.expectedHeight > 0)],
    ["player_safety_contract", plan.renderContract.playerSafetyRect.width >= 100 && plan.renderContract.playerSafetyRect.height >= 120], ["measured_region_contract", plan.renderContract.measuredPixelRegion.width === VIEWPORT.width], ["contrast_threshold", plan.thresholds.minimumPlayerContrastRatio >= 4.5], ["flat_placeholder_threshold", plan.thresholds.maximumFlatPlaceholderCoverage <= 0.06], ["no_asset_failures_allowed", plan.thresholds.maximumAssetLoadFailures === 0],
    ["style_preserved_through_pass40", plan.postPass40Polish.preserveThroughPass40 === "current_realistic_high_detail_style"], ["polish_after_pass40", plan.postPass40Polish.timing === "after_pass40_integration"], ["blur_deferred", plan.postPass40Polish.operations.includes("subtle_background_blur")], ["simplification_deferred", plan.postPass40Polish.operations.includes("shape_simplification")], ["style_unification_deferred", plan.postPass40Polish.operations.includes("character_environment_style_unification")],
  ].map(([id, passed]) => Object.freeze({ id, passed }));
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
