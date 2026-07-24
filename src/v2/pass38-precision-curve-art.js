import { VIEWPORT } from "./config.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS38_PRECISION_ASSETS = freezeList([
  { id: "precision_curve_far", src: "assets/v2/pass38/precision-curve-far.webp", type: "image/webp", layer: "far_background", alpha: false, expectedWidth: 1672, expectedHeight: 941, provenance: "pass38_new" },
  { id: "precision_entry", src: "assets/v2/pass38/precision-entry.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass38_new", bottomEdgeCoverage: 0.0903 },
  { id: "precision_return", src: "assets/v2/pass38/precision-return.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass38_new", bottomEdgeCoverage: 0.2598 },
  { id: "curve_upper", src: "assets/v2/pass38/curve-upper.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass38_new", bottomEdgeCoverage: 0.7129 },
  { id: "curve_drop", src: "assets/v2/pass38/curve-drop.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass38_new", bottomEdgeCoverage: 0.4503 },
  { id: "curve_lower", src: "assets/v2/pass38/curve-lower.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass38_new", bottomEdgeCoverage: 0.3460 },
  { id: "foreground_frame", src: "assets/v2/pass33/foreground-frame.webp", type: "image/webp", layer: "foreground", alpha: true, expectedWidth: 1665, expectedHeight: 944, provenance: "pass33_shared" },
  { id: "route_stone", src: "assets/v2/pass31/route-stone.webp", type: "image/webp", layer: "playable_surface", alpha: true, expectedWidth: 1748, expectedHeight: 202, provenance: "pass31_shared" },
]);

export const PASS38_PRECISION_SCENES = freezeList([
  { id: "precision_entry", title: "PRECISION ENTRY CUT", structureAssets: Object.freeze(["precision_entry"]), anchorCamera: Object.freeze({ x: 19500, y: 6880 }), routeBounds: Object.freeze({ x: 19400, y: 6900, width: 1100, height: 760 }) },
  { id: "precision_short", title: "SHORT-CUT LANDING", structureAssets: Object.freeze(["precision_entry"]), anchorCamera: Object.freeze({ x: 19000, y: 6940 }), routeBounds: Object.freeze({ x: 19280, y: 7000, width: 1300, height: 760 }) },
  { id: "precision_turn", title: "REVERSAL POCKET", structureAssets: Object.freeze(["precision_return"]), anchorCamera: Object.freeze({ x: 18150, y: 7050 }), routeBounds: Object.freeze({ x: 18550, y: 7100, width: 1350, height: 760 }) },
  { id: "precision_return", title: "LONG-HOLD RETURN", structureAssets: Object.freeze(["precision_return"]), anchorCamera: Object.freeze({ x: 18850, y: 7140 }), routeBounds: Object.freeze({ x: 18700, y: 7200, width: 1500, height: 700 }) },
  { id: "giant_curve_overview", title: "COLOSSAL U-TURN OVERVIEW", structureAssets: Object.freeze(["curve_upper", "curve_drop", "curve_lower"]), anchorCamera: Object.freeze({ x: 16721, y: 7525 }), routeBounds: Object.freeze({ x: 16350, y: 7350, width: 3800, height: 2100 }) },
]);

const commonLayers = scene => [
  { id: `${scene.id}_far_slow`, sceneId: scene.id, assetId: "precision_curve_far", layer: "far_background", x: -180, y: -190, width: 1560, height: 878, cameraRatioX: 0.05, cameraRatioY: 0.045, opacity: 1 },
  { id: `${scene.id}_depth`, sceneId: scene.id, assetId: "precision_curve_far", layer: "depth_background", x: -410, y: -80, width: 1370, height: 771, cameraRatioX: 0.16, cameraRatioY: 0.115, opacity: 0.3 },
];

const precisionStructure = Object.freeze({
  precision_entry: { x: -340, y: -240, width: 1820, height: 1024 },
  precision_short: { x: -250, y: -230, width: 1820, height: 1024 },
  precision_turn: { x: -150, y: -210, width: 1820, height: 1024 },
  precision_return: { x: -420, y: -215, width: 1820, height: 1024 },
});

const sceneLayers = scene => {
  const layers = commonLayers(scene);
  if (scene.id === "giant_curve_overview") {
    layers.push(
      { id: "giant_curve_upper_structure", sceneId: scene.id, assetId: "curve_upper", layer: "midground", x: 180, y: -140, width: 1635, height: 920, cameraRatioX: 0.46, cameraRatioY: 0.34, opacity: 0.97, continuesBelowViewport: true },
      { id: "giant_curve_drop_structure", sceneId: scene.id, assetId: "curve_drop", layer: "midground", x: -240, y: -80, width: 1528, height: 860, cameraRatioX: 0.48, cameraRatioY: 0.35, opacity: 0.91, continuesBelowViewport: true },
      { id: "giant_curve_lower_structure", sceneId: scene.id, assetId: "curve_lower", layer: "midground", x: -80, y: 115, width: 1360, height: 766, cameraRatioX: 0.5, cameraRatioY: 0.37, opacity: 0.96, continuesBelowViewport: true },
    );
  } else {
    const frame = precisionStructure[scene.id];
    layers.push({ id: `${scene.id}_structure`, sceneId: scene.id, assetId: scene.structureAssets[0], layer: "midground", ...frame, cameraRatioX: 0.48, cameraRatioY: 0.35, opacity: 0.98, continuesBelowViewport: true });
  }
  layers.push({ id: `${scene.id}_foreground`, sceneId: scene.id, assetId: "foreground_frame", layer: "foreground", x: -2500, y: -46, width: 5200, height: 730, cameraRatioX: 1.08, cameraRatioY: 0.94, opacity: 0.56, minCameraX: scene.anchorCamera.x - 900, maxCameraX: scene.anchorCamera.x + 900 });
  return layers;
};

export const PASS38_PRECISION_PLACEMENTS = freezeList(PASS38_PRECISION_SCENES.flatMap(sceneLayers));

export const PASS38_CAMERA_SAMPLES = freezeList([
  { id: "precision_entry", sceneId: "precision_entry", playerX: 20300, playerY: 7200, cameraX: 19500, cameraY: 6880, progress: Object.freeze({ pass13Completed: false, precisionTurnReached: false }) },
  { id: "precision_takeoff", sceneId: "precision_entry", playerX: 19880, playerY: 7280, cameraX: 19220, cameraY: 6910, progress: Object.freeze({ pass13Completed: false, precisionTurnReached: false }) },
  { id: "precision_short", sceneId: "precision_short", playerX: 19700, playerY: 7310, cameraX: 19000, cameraY: 6940, progress: Object.freeze({ pass13Completed: false, precisionTurnReached: false }) },
  { id: "precision_descent", sceneId: "precision_short", playerX: 19200, playerY: 7400, cameraX: 18680, cameraY: 7020, progress: Object.freeze({ pass13Completed: false, precisionTurnReached: false }) },
  { id: "precision_turn", sceneId: "precision_turn", playerX: 18740, playerY: 7430, cameraX: 18150, cameraY: 7050, progress: Object.freeze({ pass13Completed: false, precisionTurnReached: true }) },
  { id: "precision_turn_air", sceneId: "precision_turn", playerX: 19040, playerY: 7350, cameraX: 18380, cameraY: 7070, progress: Object.freeze({ pass13Completed: false, precisionTurnReached: true }) },
  { id: "precision_return", sceneId: "precision_return", playerX: 19400, playerY: 7500, cameraX: 18850, cameraY: 7140, progress: Object.freeze({ pass13Completed: false, precisionTurnReached: true }) },
  { id: "precision_exit", sceneId: "precision_return", playerX: 19800, playerY: 7520, cameraX: 19150, cameraY: 7160, progress: Object.freeze({ pass13Completed: false, precisionTurnReached: true }) },
  { id: "curve_entry", sceneId: "giant_curve_overview", playerX: 18800, playerY: 7800, cameraX: 17400, cameraY: 7300, cameraZoom: 0.62, progress: Object.freeze({ pass13Completed: true, pass14Completed: false }) },
  { id: "curve_upper", sceneId: "giant_curve_overview", playerX: 18500, playerY: 7900, cameraX: 16721, cameraY: 7525, cameraZoom: 0.38, progress: Object.freeze({ pass13Completed: true, pass14Completed: false }) },
  { id: "curve_drop", sceneId: "giant_curve_overview", playerX: 16900, playerY: 8550, cameraX: 16721, cameraY: 7525, cameraZoom: 0.38, progress: Object.freeze({ pass13Completed: true, pass14Completed: false }) },
  { id: "curve_lower", sceneId: "giant_curve_overview", playerX: 17800, playerY: 8920, cameraX: 16721, cameraY: 7525, cameraZoom: 0.38, progress: Object.freeze({ pass13Completed: true, pass14Completed: false }) },
]);

export const PASS38_PRECISION_PLAN = Object.freeze({
  id: "pass38_precision_parkour_giant_turn_raster_depth",
  title: "PRECISION PARKOUR + COLOSSAL U-TURN PARALLAX DEPTH",
  baselineSha: "0cc8de8",
  scope: "precision_parkour_and_giant_direction_turn_only",
  sceneCount: PASS38_PRECISION_SCENES.length,
  assetCount: PASS38_PRECISION_ASSETS.length,
  newAssetCount: PASS38_PRECISION_ASSETS.filter(asset => asset.provenance === "pass38_new").length,
  sharedAssetCount: PASS38_PRECISION_ASSETS.filter(asset => asset.provenance !== "pass38_new").length,
  placementCount: PASS38_PRECISION_PLACEMENTS.length,
  layerOrder: Object.freeze(["far_background", "depth_background", "midground", "foreground"]),
  parallaxRatios: Object.freeze({ far: 0.05, depth: 0.16, mid: 0.48, foreground: 1.08 }),
  valuePlanes: Object.freeze(["abyss_shadow", "blue_black_masonry", "oxidized_teal_rim", "amber_service_light"]),
  playableSurfaceAssetId: "route_stone",
  collisionChanges: 0,
  progressGate: "pass12Completed",
  authoredTransitions: freezeList([
    { fromSceneId: "precision_entry", toSceneId: "precision_short", trigger: "camera_x_decreasing_below_19100" },
    { fromSceneId: "precision_short", toSceneId: "precision_turn", trigger: "precision_turn_reached" },
    { fromSceneId: "precision_turn", toSceneId: "precision_return", trigger: "camera_x_increasing_above_18400" },
    { fromSceneId: "precision_return", toSceneId: "giant_curve_overview", trigger: "pass13_completed" },
  ]),
  postPass40Polish: Object.freeze({ timing: "after_pass40_integration", preserveThroughPass40: "current_realistic_high_detail_style", operations: Object.freeze(["subtle_background_blur", "shape_simplification", "character_environment_style_unification"]) }),
  thresholds: Object.freeze({ minimumCameraSamples: 12, maximumFarCameraRatio: 0.1, minimumForegroundCameraRatio: 1.05, minimumParallaxSeparation: 0.95, minimumValuePlanes: 4, minimumBottomEdgeCoverage: 0.08, minimumBelowViewportExtensionPx: 80, minimumPlayerContrastRatio: 4.5, maximumFlatPlaceholderCoverage: 0.06, maximumChromaLeakRatio: 0.0001, maximumAssetLoadFailures: 0 }),
  renderContract: Object.freeze({ surfaceTopOffsetPx: -3, surfaceMinHeightPx: 52, surfaceMaxHeightPx: 84, measuredPixelRegion: Object.freeze({ x: 0, y: 110, width: VIEWPORT.width, height: 550 }) }),
});

export async function loadPass38PrecisionAssets() {
  const entries = await Promise.all(PASS38_PRECISION_ASSETS.map(asset => new Promise(resolve => {
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

export function getPass38ActiveScene(camera, progress = {}) {
  if (camera.x < 16200 || camera.x > 20250 || camera.y < 6500 || camera.y > 8050) return null;
  if (progress.pass13Completed && !progress.pass14Completed) return PASS38_PRECISION_SCENES.find(scene => scene.id === "giant_curve_overview") ?? null;
  if (progress.pass13Completed || progress.pass14Completed) return null;
  if (progress.precisionTurnReached) {
    const id = camera.x < 18400 ? "precision_turn" : "precision_return";
    return PASS38_PRECISION_SCENES.find(scene => scene.id === id) ?? null;
  }
  const id = camera.x >= 19100 ? "precision_entry" : "precision_short";
  return PASS38_PRECISION_SCENES.find(scene => scene.id === id) ?? null;
}

export function getPass38SceneBlend(camera, progress = {}) {
  const active = getPass38ActiveScene(camera, progress);
  return active ? freezeList([{ scene: active, opacity: 1 }]) : Object.freeze([]);
}

export function getPass38ScreenPlacement(scene, placement, camera) {
  return Object.freeze({ x: placement.x - (camera.x - scene.anchorCamera.x) * placement.cameraRatioX, y: placement.y - (camera.y - scene.anchorCamera.y) * placement.cameraRatioY, width: placement.width, height: placement.height });
}

export function validatePass38PrecisionCurveArt() {
  const plan = PASS38_PRECISION_PLAN;
  const assetIds = new Set(PASS38_PRECISION_ASSETS.map(item => item.id));
  const byLayer = layer => PASS38_PRECISION_PLACEMENTS.filter(item => item.layer === layer);
  const continuation = PASS38_PRECISION_PLACEMENTS.filter(item => item.continuesBelowViewport);
  const continuationAssets = continuation.map(item => PASS38_PRECISION_ASSETS.find(asset => asset.id === item.assetId));
  const checks = [
    ["plan_id", plan.id === "pass38_precision_parkour_giant_turn_raster_depth"], ["baseline_sha", plan.baselineSha === "0cc8de8"], ["scope_explicit", plan.scope === "precision_parkour_and_giant_direction_turn_only"], ["five_scene_scope", plan.sceneCount === 5], ["eight_assets", plan.assetCount === 8], ["six_new_assets", plan.newAssetCount === 6], ["two_shared_assets", plan.sharedAssetCount === 2], ["twenty_two_placements", plan.placementCount === 22],
    ["asset_ids_unique", assetIds.size === PASS38_PRECISION_ASSETS.length], ["scene_ids_unique", new Set(PASS38_PRECISION_SCENES.map(item => item.id)).size === 5], ["placement_ids_unique", new Set(PASS38_PRECISION_PLACEMENTS.map(item => item.id)).size === 22], ["placement_assets_exist", PASS38_PRECISION_PLACEMENTS.every(item => assetIds.has(item.assetId))], ["scene_structure_assets_exist", PASS38_PRECISION_SCENES.every(scene => scene.structureAssets.every(id => assetIds.has(id)))],
    ["five_far_placements", byLayer("far_background").length === 5], ["five_depth_placements", byLayer("depth_background").length === 5], ["seven_midground_placements", byLayer("midground").length === 7], ["five_foreground_placements", byLayer("foreground").length === 5], ["far_slower_than_floor", byLayer("far_background").every(item => item.cameraRatioX <= plan.thresholds.maximumFarCameraRatio)], ["depth_slower_than_mid", byLayer("depth_background").every(item => item.cameraRatioX < plan.parallaxRatios.mid)], ["foreground_faster_than_floor", byLayer("foreground").every(item => item.cameraRatioX >= plan.thresholds.minimumForegroundCameraRatio)], ["visible_parallax_separation", plan.parallaxRatios.foreground - plan.parallaxRatios.far >= plan.thresholds.minimumParallaxSeparation],
    ["four_value_planes", plan.valuePlanes.length >= 4], ["seven_continuation_placements", continuation.length === 7], ["continuation_assets_bottom_coverage", continuationAssets.every(asset => asset?.bottomEdgeCoverage >= plan.thresholds.minimumBottomEdgeCoverage)], ["supports_extend_below_viewport", continuation.every(item => item.y + item.height >= VIEWPORT.height + plan.thresholds.minimumBelowViewportExtensionPx)],
    ["twelve_camera_samples", PASS38_CAMERA_SAMPLES.length >= plan.thresholds.minimumCameraSamples], ["samples_cover_all_scenes", new Set(PASS38_CAMERA_SAMPLES.map(item => item.sceneId)).size === 5], ["sample_cameras_active", PASS38_CAMERA_SAMPLES.every(sample => getPass38ActiveScene({ x: sample.cameraX, y: sample.cameraY, zoom: sample.cameraZoom ?? 1 }, sample.progress)?.id === sample.sceneId)], ["four_authored_transitions", plan.authoredTransitions.length === 4], ["transitions_chain_all_scenes", plan.authoredTransitions.every((item, index) => item.fromSceneId === PASS38_PRECISION_SCENES[index].id && item.toSceneId === PASS38_PRECISION_SCENES[index + 1].id)],
    ["zero_collision_changes", plan.collisionChanges === 0], ["progress_gate_declared", plan.progressGate === "pass12Completed"], ["surface_asset_exists", assetIds.has(plan.playableSurfaceAssetId)], ["far_asset_opaque", PASS38_PRECISION_ASSETS.find(item => item.id === "precision_curve_far")?.alpha === false], ["structure_cutouts_alpha", PASS38_PRECISION_ASSETS.filter(item => item.layer === "midground").every(item => item.alpha === true)], ["dimensions_declared", PASS38_PRECISION_ASSETS.every(item => item.expectedWidth > 0 && item.expectedHeight > 0)],
    ["contrast_threshold", plan.thresholds.minimumPlayerContrastRatio >= 4.5], ["flat_placeholder_threshold", plan.thresholds.maximumFlatPlaceholderCoverage <= 0.06], ["chroma_leak_threshold", plan.thresholds.maximumChromaLeakRatio <= 0.0001], ["no_asset_failures_allowed", plan.thresholds.maximumAssetLoadFailures === 0], ["style_preserved_through_pass40", plan.postPass40Polish.preserveThroughPass40 === "current_realistic_high_detail_style"], ["polish_after_pass40", plan.postPass40Polish.timing === "after_pass40_integration"], ["overview_composes_three_structures", PASS38_PRECISION_SCENES.at(-1).structureAssets.length === 3], ["precision_scenes_separate_short_and_long", PASS38_PRECISION_SCENES.slice(0, 4).map(scene => scene.id).join(",") === "precision_entry,precision_short,precision_turn,precision_return"], ["bottom_coverage_threshold_declared", plan.thresholds.minimumBottomEdgeCoverage >= 0.08],
  ].map(([id, passed]) => Object.freeze({ id, passed }));
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
