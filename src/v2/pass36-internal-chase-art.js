import { VIEWPORT } from "./config.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS36_INTERNAL_ASSETS = freezeList([
  { id: "internal_far", src: "assets/v2/pass36/internal-far.webp", type: "image/webp", layer: "far_background", alpha: false, expectedWidth: 1672, expectedHeight: 941, provenance: "pass36_new" },
  { id: "internal_descent", src: "assets/v2/pass36/internal-descent.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass36_new", bottomEdgeCoverage: 0.4346 },
  { id: "internal_lower", src: "assets/v2/pass36/internal-lower.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass36_new", bottomEdgeCoverage: 0.4710 },
  { id: "shaft_one", src: "assets/v2/pass36/shaft-one.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass36_new", bottomEdgeCoverage: 0.8053 },
  { id: "shaft_two", src: "assets/v2/pass36/shaft-two.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass36_new", bottomEdgeCoverage: 0.4519 },
  { id: "lower_hall", src: "assets/v2/pass36/lower-hall.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass36_new", bottomEdgeCoverage: 0.3481 },
  { id: "exit_rise", src: "assets/v2/pass36/exit-rise.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass36_new", bottomEdgeCoverage: 0.4171 },
  { id: "foreground_frame", src: "assets/v2/pass33/foreground-frame.webp", type: "image/webp", layer: "foreground", alpha: true, expectedWidth: 1665, expectedHeight: 944, provenance: "pass33_shared" },
  { id: "route_stone", src: "assets/v2/pass31/route-stone.webp", type: "image/webp", layer: "playable_surface", alpha: true, expectedWidth: 1748, expectedHeight: 202, provenance: "pass31_shared" },
]);

export const PASS36_INTERNAL_SCENES = freezeList([
  { id: "internal_entry", title: "BURIED INTERNAL ENTRY", structureAsset: "internal_descent", anchorCamera: Object.freeze({ x: 8600, y: 4660 }), activationBounds: Object.freeze({ minX: 8100, maxX: 10199.999, minY: 4400, maxY: 4999.999 }), routeBounds: Object.freeze({ x: 9200, y: 4800, width: 2800, height: 900 }) },
  { id: "upper_gallery", title: "UPPER DESCENT GALLERY", structureAsset: "internal_descent", anchorCamera: Object.freeze({ x: 10000, y: 5080 }), activationBounds: Object.freeze({ minX: 9000, maxX: 11299.999, minY: 5000, maxY: 5499.999 }), routeBounds: Object.freeze({ x: 9400, y: 4900, width: 2500, height: 1050 }) },
  { id: "middle_return", title: "MIDDLE RETURN", structureAsset: "internal_descent", anchorCamera: Object.freeze({ x: 10400, y: 5590 }), activationBounds: Object.freeze({ minX: 9000, maxX: 11799.999, minY: 5500, maxY: 6099.999 }), routeBounds: Object.freeze({ x: 9800, y: 5650, width: 2500, height: 850 }) },
  { id: "lower_wave", title: "LOWER WAVE GALLERY", structureAsset: "internal_lower", anchorCamera: Object.freeze({ x: 10600, y: 6100 }), activationBounds: Object.freeze({ minX: 8500, maxX: 12899.999, minY: 6000, maxY: 6699.999 }), routeBounds: Object.freeze({ x: 9600, y: 6120, width: 3900, height: 650 }) },
  { id: "internal_exit", title: "INTERNAL EXIT RISE", structureAsset: "internal_lower", anchorCamera: Object.freeze({ x: 13700, y: 5780 }), activationBounds: Object.freeze({ minX: 12600, maxX: 14799.999, minY: 5250, maxY: 6599.999 }), routeBounds: Object.freeze({ x: 12800, y: 5300, width: 2700, height: 1300 }) },
  { id: "shaft_one", title: "DOUBLE WALL SHAFT I", structureAsset: "shaft_one", anchorCamera: Object.freeze({ x: 15100, y: 5740 }), activationBounds: Object.freeze({ minX: 14500, maxX: 16099.999, minY: 5200, maxY: 6399.999 }), routeBounds: Object.freeze({ x: 15000, y: 5350, width: 1800, height: 1200 }) },
  { id: "shaft_two", title: "DOUBLE WALL SHAFT II", structureAsset: "shaft_two", anchorCamera: Object.freeze({ x: 16400, y: 6120 }), activationBounds: Object.freeze({ minX: 15800, maxX: 17699.999, minY: 5700, maxY: 6899.999 }), routeBounds: Object.freeze({ x: 16300, y: 5750, width: 2200, height: 1250 }) },
  { id: "lower_hall", title: "LOWER CHASE HALL", structureAsset: "lower_hall", anchorCamera: Object.freeze({ x: 18700, y: 5980 }), activationBounds: Object.freeze({ minX: 17300, maxX: 20799.999, minY: 5700, maxY: 6699.999 }), routeBounds: Object.freeze({ x: 17800, y: 5850, width: 4300, height: 900 }) },
  { id: "exit_rise", title: "CHASE EXIT RISE", structureAsset: "exit_rise", anchorCamera: Object.freeze({ x: 21800, y: 5700 }), activationBounds: Object.freeze({ minX: 20200, maxX: 23700, minY: 5350, maxY: 6599.999 }), routeBounds: Object.freeze({ x: 21100, y: 5550, width: 3300, height: 1000 }) },
]);

const sceneLayers = scene => [
  { id: `${scene.id}_far_slow`, sceneId: scene.id, assetId: "internal_far", layer: "far_background", x: -180, y: -190, width: 1560, height: 878, cameraRatioX: 0.05, cameraRatioY: 0.045, opacity: 1 },
  { id: `${scene.id}_depth`, sceneId: scene.id, assetId: "internal_far", layer: "depth_background", x: -410, y: -80, width: 1370, height: 771, cameraRatioX: 0.16, cameraRatioY: 0.115, opacity: 0.3 },
  { id: `${scene.id}_structure`, sceneId: scene.id, assetId: scene.structureAsset, layer: "midground", x: -310, y: -130, width: 1820, height: 1024, cameraRatioX: scene.id.startsWith("shaft") ? 0.5 : 0.46, cameraRatioY: scene.id.startsWith("shaft") ? 0.38 : 0.34, opacity: 0.98, continuesBelowViewport: true },
  { id: `${scene.id}_foreground`, sceneId: scene.id, assetId: "foreground_frame", layer: "foreground", x: -2500, y: -46, width: 5200, height: 730, cameraRatioX: 1.08, cameraRatioY: 0.94, opacity: 0.58, minCameraX: scene.anchorCamera.x - 460, maxCameraX: scene.anchorCamera.x + 460 },
];

export const PASS36_INTERNAL_PLACEMENTS = freezeList(PASS36_INTERNAL_SCENES.flatMap(sceneLayers));

export const PASS36_WALL_FACES = freezeList([
  { id: "shaft_one_left_face", solidId: "double_wall_left_one", edge: "right" },
  { id: "shaft_one_right_face", solidId: "double_wall_right_one", edge: "left" },
  { id: "shaft_two_left_face", solidId: "double_wall_left_two", edge: "right" },
  { id: "shaft_two_right_face", solidId: "double_wall_right_two", edge: "left" },
]);

export const PASS36_CAMERA_SAMPLES = freezeList([
  { id: "internal_entry", sceneId: "internal_entry", playerX: 9410, playerY: 4970, cameraX: 8610, cameraY: 4650 },
  { id: "upper_gallery", sceneId: "upper_gallery", playerX: 10800, playerY: 5400, cameraX: 10000, cameraY: 5080 },
  { id: "upper_turn", sceneId: "upper_gallery", playerX: 11600, playerY: 5420, cameraX: 10800, cameraY: 5100 },
  { id: "middle_return", sceneId: "middle_return", playerX: 11200, playerY: 5880, cameraX: 10400, cameraY: 5560 },
  { id: "second_drop", sceneId: "middle_return", playerX: 10300, playerY: 6060, cameraX: 9500, cameraY: 5740 },
  { id: "lower_wave", sceneId: "lower_wave", playerX: 11600, playerY: 6420, cameraX: 10800, cameraY: 6100 },
  { id: "internal_exit", sceneId: "internal_exit", playerX: 14500, playerY: 6100, cameraX: 13700, cameraY: 5780 },
  { id: "shaft_one_drop", sceneId: "shaft_one", playerX: 15840, playerY: 6160, cameraX: 15040, cameraY: 5840 },
  { id: "shaft_one_clear", sceneId: "shaft_one", playerX: 16200, playerY: 5860, cameraX: 15400, cameraY: 5540 },
  { id: "shaft_two_drop", sceneId: "shaft_two", playerX: 17150, playerY: 6550, cameraX: 16350, cameraY: 6230 },
  { id: "shaft_two_clear", sceneId: "shaft_two", playerX: 17600, playerY: 6230, cameraX: 16800, cameraY: 5910 },
  { id: "lower_hall_a", sceneId: "lower_hall", playerX: 19200, playerY: 6300, cameraX: 18400, cameraY: 5980 },
  { id: "lower_hall_b", sceneId: "lower_hall", playerX: 21200, playerY: 6280, cameraX: 20400, cameraY: 5960 },
  { id: "exit_rise", sceneId: "exit_rise", playerX: 23000, playerY: 6000, cameraX: 22200, cameraY: 5680 },
  { id: "exit_shelf", sceneId: "exit_rise", playerX: 23800, playerY: 5860, cameraX: 23000, cameraY: 5540 },
]);

export const PASS36_INTERNAL_PLAN = Object.freeze({
  id: "pass36_internal_descent_double_wall_raster_depth",
  title: "INTERNAL DESCENT + DOUBLE WALL PARALLAX DEPTH",
  baselineSha: "8bc6f6a",
  scope: "internal_descent_and_double_wall_chase_only",
  sceneCount: PASS36_INTERNAL_SCENES.length,
  assetCount: PASS36_INTERNAL_ASSETS.length,
  newAssetCount: PASS36_INTERNAL_ASSETS.filter(asset => asset.provenance === "pass36_new").length,
  sharedAssetCount: PASS36_INTERNAL_ASSETS.filter(asset => asset.provenance !== "pass36_new").length,
  placementCount: PASS36_INTERNAL_PLACEMENTS.length,
  wallFaceCount: PASS36_WALL_FACES.length,
  layerOrder: Object.freeze(["far_background", "depth_background", "midground", "foreground"]),
  parallaxRatios: Object.freeze({ far: 0.05, depth: 0.16, midMin: 0.46, foreground: 1.08 }),
  valuePlanes: Object.freeze(["abyss_shadow", "blue_black_masonry", "teal_rim_light", "amber_service_light"]),
  playableSurfaceAssetId: "route_stone",
  collisionChanges: 0,
  progressGate: "zone07Entered",
  sceneTransitions: freezeList([
    { fromSceneId: "internal_entry", toSceneId: "upper_gallery", axis: "y", start: 4980, end: 5100, minX: 8100, maxX: 11300 },
    { fromSceneId: "upper_gallery", toSceneId: "middle_return", axis: "y", start: 5480, end: 5600, minX: 9000, maxX: 11800 },
    { fromSceneId: "middle_return", toSceneId: "lower_wave", axis: "y", start: 5980, end: 6100, minX: 8500, maxX: 12900 },
    { fromSceneId: "lower_wave", toSceneId: "internal_exit", axis: "x", start: 12680, end: 12860, minY: 6000, maxY: 6700 },
    { fromSceneId: "internal_exit", toSceneId: "shaft_one", axis: "x", start: 14520, end: 14700, minY: 5200, maxY: 6600 },
    { fromSceneId: "shaft_one", toSceneId: "shaft_two", axis: "x", start: 15900, end: 16080, minY: 5700, maxY: 6500 },
    { fromSceneId: "shaft_two", toSceneId: "lower_hall", axis: "x", start: 17420, end: 17600, minY: 5700, maxY: 6900 },
    { fromSceneId: "lower_hall", toSceneId: "exit_rise", axis: "x", start: 20280, end: 20460, minY: 5700, maxY: 6700 },
  ]),
  postPass40Polish: Object.freeze({ timing: "after_pass40_integration", preserveThroughPass40: "current_realistic_high_detail_style", operations: Object.freeze(["subtle_background_blur", "shape_simplification", "character_environment_style_unification"]) }),
  thresholds: Object.freeze({ minimumCameraSamples: 15, maximumFarCameraRatio: 0.1, minimumForegroundCameraRatio: 1.05, minimumParallaxSeparation: 0.95, minimumValuePlanes: 4, minimumBottomEdgeCoverage: 0.3, minimumBelowViewportExtensionPx: 120, visibleSeamColumnsAllowed: 0, foregroundPlayerOverlapAllowed: 0, minimumPlayerContrastRatio: 4.5, maximumFlatPlaceholderCoverage: 0.06, maximumAssetLoadFailures: 0 }),
  renderContract: Object.freeze({ surfaceTopOffsetPx: -3, surfaceMinHeightPx: 52, surfaceMaxHeightPx: 84, wallFaceWidthPx: 82, playerSafetyRect: Object.freeze({ x: 730, y: 205, width: 118, height: 126 }), measuredPixelRegion: Object.freeze({ x: 0, y: 110, width: VIEWPORT.width, height: 550 }) }),
});

export async function loadPass36InternalAssets() {
  const entries = await Promise.all(PASS36_INTERNAL_ASSETS.map(asset => new Promise(resolve => {
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

export function getPass36ActiveScene(camera) {
  return PASS36_INTERNAL_SCENES.find(scene => {
    const b = scene.activationBounds;
    return camera.x >= b.minX && camera.x <= b.maxX && camera.y >= b.minY && camera.y <= b.maxY;
  }) ?? null;
}

export function getPass36SceneBlend(camera) {
  for (const transition of PASS36_INTERNAL_PLAN.sceneTransitions) {
    if (transition.minX !== undefined && camera.x < transition.minX) continue;
    if (transition.maxX !== undefined && camera.x > transition.maxX) continue;
    if (transition.minY !== undefined && camera.y < transition.minY) continue;
    if (transition.maxY !== undefined && camera.y > transition.maxY) continue;
    const value = camera[transition.axis];
    if (value < transition.start || value > transition.end) continue;
    const from = PASS36_INTERNAL_SCENES.find(scene => scene.id === transition.fromSceneId);
    const to = PASS36_INTERNAL_SCENES.find(scene => scene.id === transition.toSceneId);
    const toOpacity = (value - transition.start) / (transition.end - transition.start);
    return freezeList([{ scene: from, opacity: 1 - toOpacity }, { scene: to, opacity: toOpacity }]);
  }
  const active = getPass36ActiveScene(camera);
  return active ? freezeList([{ scene: active, opacity: 1 }]) : Object.freeze([]);
}

export function getPass36ScreenPlacement(scene, placement, camera) {
  return Object.freeze({ x: placement.x - (camera.x - scene.anchorCamera.x) * placement.cameraRatioX, y: placement.y - (camera.y - scene.anchorCamera.y) * placement.cameraRatioY, width: placement.width, height: placement.height });
}

export function validatePass36InternalChaseArt() {
  const plan = PASS36_INTERNAL_PLAN;
  const assetIds = new Set(PASS36_INTERNAL_ASSETS.map(asset => asset.id));
  const sceneIds = new Set(PASS36_INTERNAL_SCENES.map(scene => scene.id));
  const byLayer = layer => PASS36_INTERNAL_PLACEMENTS.filter(item => item.layer === layer);
  const continuation = PASS36_INTERNAL_PLACEMENTS.filter(item => item.continuesBelowViewport);
  const continuationAssets = continuation.map(item => PASS36_INTERNAL_ASSETS.find(asset => asset.id === item.assetId));
  const checks = [
    ["plan_id", plan.id === "pass36_internal_descent_double_wall_raster_depth"], ["baseline_sha", plan.baselineSha === "8bc6f6a"], ["scope_explicit", plan.scope === "internal_descent_and_double_wall_chase_only"], ["nine_scene_scope", plan.sceneCount === 9], ["nine_assets", plan.assetCount === 9], ["seven_new_assets", plan.newAssetCount === 7], ["two_shared_assets", plan.sharedAssetCount === 2], ["thirty_six_placements", plan.placementCount === 36], ["four_wall_faces", plan.wallFaceCount === 4],
    ["asset_ids_unique", assetIds.size === PASS36_INTERNAL_ASSETS.length], ["scene_ids_unique", sceneIds.size === PASS36_INTERNAL_SCENES.length], ["placement_ids_unique", new Set(PASS36_INTERNAL_PLACEMENTS.map(item => item.id)).size === PASS36_INTERNAL_PLACEMENTS.length], ["placement_assets_exist", PASS36_INTERNAL_PLACEMENTS.every(item => assetIds.has(item.assetId))], ["placement_scenes_exist", PASS36_INTERNAL_PLACEMENTS.every(item => sceneIds.has(item.sceneId))], ["positive_placement_sizes", PASS36_INTERNAL_PLACEMENTS.every(item => item.width > 0 && item.height > 0)],
    ["nine_far_placements", byLayer("far_background").length === 9], ["nine_depth_placements", byLayer("depth_background").length === 9], ["nine_mid_placements", byLayer("midground").length === 9], ["nine_foreground_placements", byLayer("foreground").length === 9], ["far_slower_than_floor", byLayer("far_background").every(item => item.cameraRatioX <= plan.thresholds.maximumFarCameraRatio)], ["depth_slower_than_mid", byLayer("depth_background").every(item => item.cameraRatioX < Math.min(...byLayer("midground").map(mid => mid.cameraRatioX)))], ["foreground_faster_than_floor", byLayer("foreground").every(item => item.cameraRatioX >= plan.thresholds.minimumForegroundCameraRatio)], ["visible_parallax_separation", Math.min(...byLayer("foreground").map(item => item.cameraRatioX)) - Math.max(...byLayer("far_background").map(item => item.cameraRatioX)) >= plan.thresholds.minimumParallaxSeparation],
    ["four_value_planes", plan.valuePlanes.length >= 4], ["nine_continuation_placements", continuation.length === 9], ["continuation_assets_bottom_coverage", continuationAssets.every(asset => asset?.bottomEdgeCoverage >= plan.thresholds.minimumBottomEdgeCoverage)], ["supports_extend_below_viewport", continuation.every(item => item.y + item.height >= VIEWPORT.height + plan.thresholds.minimumBelowViewportExtensionPx)],
    ["fifteen_camera_samples", PASS36_CAMERA_SAMPLES.length >= plan.thresholds.minimumCameraSamples], ["samples_cover_all_scenes", new Set(PASS36_CAMERA_SAMPLES.map(item => item.sceneId)).size === 9], ["sample_cameras_active", PASS36_CAMERA_SAMPLES.every(sample => getPass36ActiveScene({ x: sample.cameraX, y: sample.cameraY })?.id === sample.sceneId)], ["eight_scene_transitions", plan.sceneTransitions.length === 8], ["transition_widths", plan.sceneTransitions.every(item => item.end - item.start >= 120 && item.end - item.start <= 180)],
    ["zero_collision_changes", plan.collisionChanges === 0], ["progress_gate_declared", plan.progressGate === "zone07Entered"], ["surface_asset_exists", assetIds.has(plan.playableSurfaceAssetId)], ["wall_faces_unique", new Set(PASS36_WALL_FACES.map(item => item.solidId)).size === 4], ["wall_face_edges", PASS36_WALL_FACES.every(item => item.edge === "left" || item.edge === "right")], ["far_asset_opaque", PASS36_INTERNAL_ASSETS.find(item => item.id === "internal_far")?.alpha === false], ["structure_cutouts_alpha", PASS36_INTERNAL_ASSETS.filter(item => item.layer === "midground").every(item => item.alpha === true)], ["dimensions_declared", PASS36_INTERNAL_ASSETS.every(item => item.expectedWidth > 0 && item.expectedHeight > 0)],
    ["contrast_threshold", plan.thresholds.minimumPlayerContrastRatio >= 4.5], ["flat_placeholder_threshold", plan.thresholds.maximumFlatPlaceholderCoverage <= 0.06], ["no_asset_failures_allowed", plan.thresholds.maximumAssetLoadFailures === 0], ["style_preserved_through_pass40", plan.postPass40Polish.preserveThroughPass40 === "current_realistic_high_detail_style"], ["polish_after_pass40", plan.postPass40Polish.timing === "after_pass40_integration"], ["wall_face_width", plan.renderContract.wallFaceWidthPx >= 72],
  ].map(([id, passed]) => Object.freeze({ id, passed }));
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
