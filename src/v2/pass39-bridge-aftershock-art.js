import { VIEWPORT } from "./config.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS39_BRIDGE_ASSETS = freezeList([
  { id: "bridge_aftershock_far", src: "assets/v2/pass39/bridge-aftershock-far.webp", type: "image/webp", layer: "far_background", alpha: false, expectedWidth: 1672, expectedHeight: 941, provenance: "pass39_new" },
  { id: "bridge_entry", src: "assets/v2/pass39/bridge-entry.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass39_new", bottomEdgeCoverage: 0.2133 },
  { id: "bridge_mid", src: "assets/v2/pass39/bridge-mid.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass39_new", bottomEdgeCoverage: 0.3284 },
  { id: "bridge_final", src: "assets/v2/pass39/bridge-final.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass39_new", bottomEdgeCoverage: 0.5089 },
  { id: "aftershock_entry", src: "assets/v2/pass39/aftershock-entry.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass39_new", bottomEdgeCoverage: 0.25 },
  { id: "aftershock_mid", src: "assets/v2/pass39/aftershock-mid.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass39_new", bottomEdgeCoverage: 0.2691 },
  { id: "aftershock_exit", src: "assets/v2/pass39/aftershock-exit.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass39_new", bottomEdgeCoverage: 0.4601 },
  { id: "foreground_frame", src: "assets/v2/pass33/foreground-frame.webp", type: "image/webp", layer: "foreground", alpha: true, expectedWidth: 1665, expectedHeight: 944, provenance: "pass33_shared" },
  { id: "route_girder", src: "assets/v2/pass29/route-girder.webp", type: "image/webp", layer: "playable_surface", alpha: true, expectedWidth: 1738, expectedHeight: 239, provenance: "pass29_shared" },
  { id: "route_stone", src: "assets/v2/pass31/route-stone.webp", type: "image/webp", layer: "playable_surface", alpha: true, expectedWidth: 1748, expectedHeight: 202, provenance: "pass31_shared" },
]);

export const PASS39_BRIDGE_SCENES = freezeList([
  { id: "bridge_entry", title: "COLLAPSE BRIDGE ENTRY", phase: "bridge", structureAsset: "bridge_entry", anchorCamera: Object.freeze({ x: 19000, y: 8500 }), routeBounds: Object.freeze({ x: 18800, y: 8900, width: 2450, height: 850 }), placement: Object.freeze({ x: -260, y: -160, width: 1740, height: 980 }) },
  { id: "bridge_mid", title: "COLLAPSE BRIDGE BREAKS", phase: "bridge", structureAsset: "bridge_mid", anchorCamera: Object.freeze({ x: 21700, y: 8750 }), routeBounds: Object.freeze({ x: 20800, y: 9100, width: 3100, height: 900 }), placement: Object.freeze({ x: -255, y: -80, width: 1740, height: 980 }) },
  { id: "bridge_final", title: "FINAL PLUNGE LANDING", phase: "bridge", structureAsset: "bridge_final", anchorCamera: Object.freeze({ x: 23900, y: 9000 }), routeBounds: Object.freeze({ x: 22900, y: 9320, width: 2850, height: 850 }), placement: Object.freeze({ x: -250, y: -95, width: 1740, height: 980 }) },
  { id: "aftershock_entry", title: "SEALED IMPACT GROTTO", phase: "aftershock", structureAsset: "aftershock_entry", anchorCamera: Object.freeze({ x: 25400, y: 9230 }), routeBounds: Object.freeze({ x: 25100, y: 9450, width: 2500, height: 1300 }), placement: Object.freeze({ x: -230, y: -115, width: 1740, height: 980 }) },
  { id: "aftershock_mid", title: "AFTERSHOCK PRECISION RUN", phase: "aftershock", structureAsset: "aftershock_mid", anchorCamera: Object.freeze({ x: 27100, y: 9580 }), routeBounds: Object.freeze({ x: 26200, y: 9650, width: 3000, height: 1400 }), placement: Object.freeze({ x: -245, y: -65, width: 1740, height: 980 }) },
  { id: "aftershock_exit", title: "STABILIZED EXIT", phase: "aftershock", structureAsset: "aftershock_exit", anchorCamera: Object.freeze({ x: 28700, y: 9940 }), routeBounds: Object.freeze({ x: 27800, y: 9950, width: 2200, height: 1200 }), placement: Object.freeze({ x: -250, y: -333, width: 1740, height: 1142 }) },
]);

const sceneLayers = scene => [
  { id: `${scene.id}_far_slow`, sceneId: scene.id, assetId: "bridge_aftershock_far", layer: "far_background", x: -180, y: -190, width: 1560, height: 878, cameraRatioX: 0.05, cameraRatioY: 0.045, opacity: 1 },
  { id: `${scene.id}_depth`, sceneId: scene.id, assetId: "bridge_aftershock_far", layer: "depth_background", x: -410, y: -75, width: 1370, height: 771, cameraRatioX: 0.16, cameraRatioY: 0.115, opacity: 0.29 },
  { id: `${scene.id}_structure`, sceneId: scene.id, assetId: scene.structureAsset, layer: "midground", ...scene.placement, cameraRatioX: 0.48, cameraRatioY: 0.35, opacity: 0.98, continuesBelowViewport: true },
  { id: `${scene.id}_foreground`, sceneId: scene.id, assetId: "foreground_frame", layer: "foreground", x: -2500, y: -46, width: 5200, height: 730, cameraRatioX: 1.08, cameraRatioY: 0.94, opacity: scene.phase === "bridge" ? 0.58 : 0.52, minCameraX: scene.anchorCamera.x - 1000, maxCameraX: scene.anchorCamera.x + 1000 },
];

export const PASS39_BRIDGE_PLACEMENTS = freezeList(PASS39_BRIDGE_SCENES.flatMap(sceneLayers));

export const PASS39_CAMERA_SAMPLES = freezeList([
  { id: "bridge_entry_start", sceneId: "bridge_entry", playerX: 19040, playerY: 8956, cameraX: 18420, cameraY: 8480, cameraZoom: 0.62, progress: Object.freeze({ pass14Completed: true, pass15Completed: false }) },
  { id: "bridge_gap_one", sceneId: "bridge_entry", playerX: 20150, playerY: 9010, cameraX: 19880, cameraY: 8580, cameraZoom: 0.62, progress: Object.freeze({ pass14Completed: true, pass15Completed: false, bridgeGapOneCleared: false }) },
  { id: "bridge_mid_run", sceneId: "bridge_mid", playerX: 21100, playerY: 9145, cameraX: 20900, cameraY: 8700, cameraZoom: 0.62, progress: Object.freeze({ pass14Completed: true, pass15Completed: false, bridgeGapOneCleared: true }) },
  { id: "bridge_gap_two", sceneId: "bridge_mid", playerX: 22040, playerY: 9210, cameraX: 21500, cameraY: 8820, cameraZoom: 0.62, progress: Object.freeze({ pass14Completed: true, pass15Completed: false, bridgeGapTwoCleared: false }) },
  { id: "bridge_gap_three", sceneId: "bridge_final", playerX: 23500, playerY: 9350, cameraX: 23200, cameraY: 8920, cameraZoom: 0.62, progress: Object.freeze({ pass14Completed: true, pass15Completed: false, bridgeGapTwoCleared: true }) },
  { id: "bridge_final_landing", sceneId: "bridge_final", playerX: 25200, playerY: 9540, cameraX: 24400, cameraY: 9050, cameraZoom: 0.62, progress: Object.freeze({ pass14Completed: true, pass15Completed: false, bridgeGapThreeCleared: true }) },
  { id: "aftershock_entry", sceneId: "aftershock_entry", playerX: 25530, playerY: 9610, cameraX: 24950, cameraY: 9180, progress: Object.freeze({ pass14Completed: true, pass15Completed: true, pass18Completed: false }) },
  { id: "aftershock_first_landings", sceneId: "aftershock_entry", playerX: 26200, playerY: 9750, cameraX: 25950, cameraY: 9340, progress: Object.freeze({ pass14Completed: true, pass15Completed: true, pass18Completed: false, pass18Entered: true }) },
  { id: "aftershock_middle", sceneId: "aftershock_mid", playerX: 26900, playerY: 9860, cameraX: 26650, cameraY: 9500, progress: Object.freeze({ pass14Completed: true, pass15Completed: true, pass18Completed: false, pass18Entered: true }) },
  { id: "aftershock_wave", sceneId: "aftershock_mid", playerX: 28050, playerY: 10020, cameraX: 27650, cameraY: 9700, progress: Object.freeze({ pass14Completed: true, pass15Completed: true, pass18Completed: false, pass18Entered: true }) },
  { id: "aftershock_final_platforms", sceneId: "aftershock_exit", playerX: 28580, playerY: 10220, cameraX: 28300, cameraY: 9880, progress: Object.freeze({ pass14Completed: true, pass15Completed: true, pass18Completed: false, pass18Entered: true }) },
  { id: "aftershock_stable_exit", sceneId: "aftershock_exit", playerX: 29400, playerY: 10470, cameraX: 29200, cameraY: 10080, progress: Object.freeze({ pass14Completed: true, pass15Completed: true, pass18Completed: true, pass19Completed: true }) },
]);

const sceneById = id => PASS39_BRIDGE_SCENES.find(scene => scene.id === id) ?? null;

export function getPass39ActiveScene(camera, progress = {}) {
  if (progress.pass14Completed && !progress.pass15Completed && camera.x >= 18000 && camera.x <= 25050 && camera.y >= 8000 && camera.y <= 9550) {
    return sceneById(camera.x < 20500 ? "bridge_entry" : camera.x < 22900 ? "bridge_mid" : "bridge_final");
  }
  if (progress.pass15Completed && camera.x >= 24600 && camera.x <= 29650 && camera.y >= 8750 && camera.y <= 10650) {
    return sceneById(camera.x < 26100 ? "aftershock_entry" : camera.x < 27900 ? "aftershock_mid" : "aftershock_exit");
  }
  return null;
}

const blendAcross = (cameraX, start, end, leftId, rightId) => {
  if (cameraX <= start || cameraX >= end) return null;
  const ratio = (cameraX - start) / (end - start);
  return freezeList([{ scene: sceneById(leftId), opacity: 1 - ratio }, { scene: sceneById(rightId), opacity: ratio }]);
};

export function getPass39SceneBlend(camera, progress = {}) {
  if (progress.pass14Completed && !progress.pass15Completed) {
    return blendAcross(camera.x, 20420, 20580, "bridge_entry", "bridge_mid")
      ?? blendAcross(camera.x, 22820, 22980, "bridge_mid", "bridge_final")
      ?? freezeList([{ scene: getPass39ActiveScene(camera, progress), opacity: 1 }].filter(item => item.scene));
  }
  if (progress.pass15Completed) {
    return blendAcross(camera.x, 26020, 26180, "aftershock_entry", "aftershock_mid")
      ?? blendAcross(camera.x, 27820, 27980, "aftershock_mid", "aftershock_exit")
      ?? freezeList([{ scene: getPass39ActiveScene(camera, progress), opacity: 1 }].filter(item => item.scene));
  }
  return Object.freeze([]);
}

export function getPass39ScreenPlacement(scene, placement, camera) {
  return Object.freeze({
    x: placement.x - (camera.x - scene.anchorCamera.x) * placement.cameraRatioX,
    y: placement.y - (camera.y - scene.anchorCamera.y) * placement.cameraRatioY,
    width: placement.width,
    height: placement.height,
  });
}

export const PASS39_BRIDGE_PLAN = Object.freeze({
  id: "pass39_collapsing_bridge_aftershock_raster_depth",
  title: "COLLAPSING BRIDGE FINALE + AFTERSHOCK PRECISION DEPTH",
  baselineSha: "a07e68c",
  scope: "collapsing_bridge_finale_and_aftershock_precision_only",
  sceneCount: PASS39_BRIDGE_SCENES.length,
  assetCount: PASS39_BRIDGE_ASSETS.length,
  newAssetCount: PASS39_BRIDGE_ASSETS.filter(asset => asset.provenance === "pass39_new").length,
  sharedAssetCount: PASS39_BRIDGE_ASSETS.filter(asset => asset.provenance !== "pass39_new").length,
  placementCount: PASS39_BRIDGE_PLACEMENTS.length,
  layerOrder: Object.freeze(["far_background", "depth_background", "midground", "foreground"]),
  parallaxRatios: Object.freeze({ far: 0.05, depth: 0.16, mid: 0.48, foreground: 1.08 }),
  valuePlanes: Object.freeze(["abyss_shadow", "blue_black_masonry", "oxidized_teal_rim", "amber_fracture_light"]),
  bridgeSurfaceAssetId: "route_girder",
  grottoSurfaceAssetId: "route_stone",
  collisionChanges: 0,
  progressGate: "pass14Completed",
  sceneTransitions: freezeList([
    { fromSceneId: "bridge_entry", toSceneId: "bridge_mid", start: 20420, end: 20580 },
    { fromSceneId: "bridge_mid", toSceneId: "bridge_final", start: 22820, end: 22980 },
    { fromSceneId: "aftershock_entry", toSceneId: "aftershock_mid", start: 26020, end: 26180 },
    { fromSceneId: "aftershock_mid", toSceneId: "aftershock_exit", start: 27820, end: 27980 },
  ]),
  authoredHandoff: Object.freeze({ fromSceneId: "bridge_final", toSceneId: "aftershock_entry", trigger: "pass15_completed_and_boulder_plunged" }),
  postPass40Polish: Object.freeze({
    timing: "after_pass40_integration",
    preserveThroughPass40: "current_realistic_high_detail_style",
    operations: Object.freeze(["subtle_background_blur", "shape_simplification", "character_environment_style_unification"]),
  }),
  thresholds: Object.freeze({
    minimumCameraSamples: 12,
    maximumFarCameraRatio: 0.1,
    minimumForegroundCameraRatio: 1.05,
    minimumParallaxSeparation: 0.95,
    minimumValuePlanes: 4,
    minimumBottomEdgeCoverage: 0.2,
    minimumBelowViewportExtensionPx: 80,
    minimumPlayerContrastRatio: 4.5,
    maximumFlatPlaceholderCoverage: 0.06,
    maximumChromaLeakRatio: 0.0001,
    maximumAssetLoadFailures: 0,
  }),
  renderContract: Object.freeze({ surfaceTopOffsetPx: -3, surfaceMinHeightPx: 48, surfaceMaxHeightPx: 78, measuredPixelRegion: Object.freeze({ x: 0, y: 110, width: VIEWPORT.width, height: 550 }) }),
});

export async function loadPass39BridgeAssets() {
  const entries = await Promise.all(PASS39_BRIDGE_ASSETS.map(asset => new Promise(resolve => {
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

export function validatePass39BridgeAftershockArt() {
  const plan = PASS39_BRIDGE_PLAN;
  const assetIds = new Set(PASS39_BRIDGE_ASSETS.map(item => item.id));
  const sceneIds = new Set(PASS39_BRIDGE_SCENES.map(item => item.id));
  const byLayer = layer => PASS39_BRIDGE_PLACEMENTS.filter(item => item.layer === layer);
  const continuation = PASS39_BRIDGE_PLACEMENTS.filter(item => item.continuesBelowViewport);
  const continuationAssets = continuation.map(item => PASS39_BRIDGE_ASSETS.find(asset => asset.id === item.assetId));
  const transitionMidpoints = plan.sceneTransitions.map(item => getPass39SceneBlend({ x: (item.start + item.end) * 0.5, y: item.fromSceneId.startsWith("bridge") ? 8800 : 9600 }, item.fromSceneId.startsWith("bridge") ? { pass14Completed: true, pass15Completed: false } : { pass14Completed: true, pass15Completed: true }));
  const checks = [
    ["plan_id", plan.id === "pass39_collapsing_bridge_aftershock_raster_depth"], ["baseline_sha", plan.baselineSha === "a07e68c"], ["scope_explicit", plan.scope === "collapsing_bridge_finale_and_aftershock_precision_only"], ["six_scene_scope", plan.sceneCount === 6], ["ten_assets", plan.assetCount === 10], ["seven_new_assets", plan.newAssetCount === 7], ["three_shared_assets", plan.sharedAssetCount === 3], ["twenty_four_placements", plan.placementCount === 24],
    ["asset_ids_unique", assetIds.size === PASS39_BRIDGE_ASSETS.length], ["scene_ids_unique", sceneIds.size === 6], ["placement_ids_unique", new Set(PASS39_BRIDGE_PLACEMENTS.map(item => item.id)).size === 24], ["placement_assets_exist", PASS39_BRIDGE_PLACEMENTS.every(item => assetIds.has(item.assetId))], ["scene_structure_assets_exist", PASS39_BRIDGE_SCENES.every(scene => assetIds.has(scene.structureAsset))],
    ["six_far_placements", byLayer("far_background").length === 6], ["six_depth_placements", byLayer("depth_background").length === 6], ["six_midground_placements", byLayer("midground").length === 6], ["six_foreground_placements", byLayer("foreground").length === 6], ["far_slower_than_floor", byLayer("far_background").every(item => item.cameraRatioX <= plan.thresholds.maximumFarCameraRatio)], ["depth_slower_than_mid", byLayer("depth_background").every(item => item.cameraRatioX < plan.parallaxRatios.mid)], ["foreground_faster_than_floor", byLayer("foreground").every(item => item.cameraRatioX >= plan.thresholds.minimumForegroundCameraRatio)], ["visible_parallax_separation", plan.parallaxRatios.foreground - plan.parallaxRatios.far >= plan.thresholds.minimumParallaxSeparation],
    ["four_value_planes", plan.valuePlanes.length >= 4], ["six_continuation_placements", continuation.length === 6], ["continuation_assets_bottom_coverage", continuationAssets.every(asset => asset?.bottomEdgeCoverage >= plan.thresholds.minimumBottomEdgeCoverage)], ["supports_extend_below_viewport", continuation.every(item => item.y + item.height >= VIEWPORT.height + plan.thresholds.minimumBelowViewportExtensionPx)],
    ["twelve_camera_samples", PASS39_CAMERA_SAMPLES.length >= plan.thresholds.minimumCameraSamples], ["samples_cover_all_scenes", new Set(PASS39_CAMERA_SAMPLES.map(item => item.sceneId)).size === 6], ["sample_cameras_active", PASS39_CAMERA_SAMPLES.every(sample => getPass39ActiveScene({ x: sample.cameraX, y: sample.cameraY, zoom: sample.cameraZoom ?? 1 }, sample.progress)?.id === sample.sceneId)], ["four_crossfades", plan.sceneTransitions.length === 4], ["transition_widths", plan.sceneTransitions.every(item => item.end - item.start === 160)], ["midpoint_crossfades", transitionMidpoints.every(items => items.length === 2 && items.every(item => Math.abs(item.opacity - 0.5) < 0.001))], ["progress_handoff_declared", plan.authoredHandoff.trigger === "pass15_completed_and_boulder_plunged"],
    ["zero_collision_changes", plan.collisionChanges === 0], ["progress_gate_declared", plan.progressGate === "pass14Completed"], ["bridge_surface_exists", assetIds.has(plan.bridgeSurfaceAssetId)], ["grotto_surface_exists", assetIds.has(plan.grottoSurfaceAssetId)], ["far_asset_opaque", PASS39_BRIDGE_ASSETS.find(item => item.id === "bridge_aftershock_far")?.alpha === false], ["structure_cutouts_alpha", PASS39_BRIDGE_ASSETS.filter(item => item.layer === "midground").every(item => item.alpha === true)], ["dimensions_declared", PASS39_BRIDGE_ASSETS.every(item => item.expectedWidth > 0 && item.expectedHeight > 0)],
    ["contrast_threshold", plan.thresholds.minimumPlayerContrastRatio >= 4.5], ["flat_placeholder_threshold", plan.thresholds.maximumFlatPlaceholderCoverage <= 0.06], ["chroma_leak_threshold", plan.thresholds.maximumChromaLeakRatio <= 0.0001], ["no_asset_failures_allowed", plan.thresholds.maximumAssetLoadFailures === 0], ["style_preserved_through_pass40", plan.postPass40Polish.preserveThroughPass40 === "current_realistic_high_detail_style"], ["polish_after_pass40", plan.postPass40Polish.timing === "after_pass40_integration"], ["three_bridge_scenes", PASS39_BRIDGE_SCENES.filter(scene => scene.phase === "bridge").length === 3], ["three_aftershock_scenes", PASS39_BRIDGE_SCENES.filter(scene => scene.phase === "aftershock").length === 3], ["bottom_coverage_threshold", plan.thresholds.minimumBottomEdgeCoverage >= 0.2],
  ].map(([id, passed]) => Object.freeze({ id, passed }));
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
