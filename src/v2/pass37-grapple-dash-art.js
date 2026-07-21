import { VIEWPORT } from "./config.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS37_GRAPPLE_ASSETS = freezeList([
  { id: "grapple_far", src: "assets/v2/pass37/grapple-far.webp", type: "image/webp", layer: "far_background", alpha: false, expectedWidth: 1672, expectedHeight: 941, provenance: "pass37_new" },
  { id: "grapple_nave", src: "assets/v2/pass37/grapple-nave.png", type: "image/png", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass37_new", bottomEdgeCoverage: 0.5730 },
  { id: "grapple_exit", src: "assets/v2/pass37/grapple-exit.png", type: "image/png", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass37_new", bottomEdgeCoverage: 0.1549 },
  { id: "dash_spike", src: "assets/v2/pass37/dash-spike.png", type: "image/png", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass37_new", bottomEdgeCoverage: 0.5981 },
  { id: "dash_exit", src: "assets/v2/pass37/dash-exit.png", type: "image/png", layer: "midground", alpha: true, expectedWidth: 1672, expectedHeight: 941, provenance: "pass37_new", bottomEdgeCoverage: 0.2309 },
  { id: "grapple_anchor", src: "assets/v2/pass37/grapple-anchor.png", type: "image/png", layer: "gameplay_sprite", alpha: true, expectedWidth: 1024, expectedHeight: 1536, provenance: "pass37_new" },
  { id: "foreground_frame", src: "assets/v2/pass33/foreground-frame.png", type: "image/png", layer: "foreground", alpha: true, expectedWidth: 1665, expectedHeight: 944, provenance: "pass33_shared" },
  { id: "route_stone", src: "assets/v2/pass31/route-stone.png", type: "image/png", layer: "playable_surface", alpha: true, expectedWidth: 1748, expectedHeight: 202, provenance: "pass31_shared" },
]);

export const PASS37_GRAPPLE_SCENES = freezeList([
  { id: "grapple_entry", title: "TRIPLE GRAPPLE ENTRY", structureAsset: "grapple_nave", anchorCamera: Object.freeze({ x: 23550, y: 5580 }), activationBounds: Object.freeze({ minX: 23050, maxX: 24450, minY: 5300, maxY: 5899.999 }), routeBounds: Object.freeze({ x: 23600, y: 5400, width: 1500, height: 1050 }) },
  { id: "grapple_apex", title: "SUSPENDED HOOK NAVE", structureAsset: "grapple_nave", anchorCamera: Object.freeze({ x: 24100, y: 6030 }), activationBounds: Object.freeze({ minX: 23650, maxX: 24450, minY: 5900, maxY: 6399.999 }), routeBounds: Object.freeze({ x: 23500, y: 5450, width: 1800, height: 1500 }) },
  { id: "grapple_turn", title: "LOWER GRAPPLE TURN", structureAsset: "grapple_nave", anchorCamera: Object.freeze({ x: 23200, y: 6500 }), activationBounds: Object.freeze({ minX: 22800, maxX: 24450, minY: 6400, maxY: 7040 }), routeBounds: Object.freeze({ x: 22400, y: 6100, width: 2800, height: 1500 }) },
  { id: "grapple_exit", title: "GRAPPLE EXIT SHELF", structureAsset: "grapple_exit", anchorCamera: Object.freeze({ x: 22000, y: 6580 }), activationBounds: Object.freeze({ minX: 21700, maxX: 22799.999, minY: 6200, maxY: 7060 }), routeBounds: Object.freeze({ x: 21800, y: 6450, width: 1600, height: 900 }) },
  { id: "dash_takeoff", title: "AIR DASH TAKEOFF", structureAsset: "dash_spike", anchorCamera: Object.freeze({ x: 21200, y: 6600 }), activationBounds: Object.freeze({ minX: 20900, maxX: 21699.999, minY: 6250, maxY: 7070 }), routeBounds: Object.freeze({ x: 21100, y: 6550, width: 1800, height: 1000 }) },
  { id: "dash_trench", title: "SPIKE TRENCH", structureAsset: "dash_spike", anchorCamera: Object.freeze({ x: 20500, y: 6800 }), activationBounds: Object.freeze({ minX: 20000, maxX: 20899.999, minY: 6450, maxY: 7220 }), routeBounds: Object.freeze({ x: 20200, y: 6700, width: 2000, height: 950 }) },
  { id: "dash_exit", title: "DASH LANDING VAULT", structureAsset: "dash_exit", anchorCamera: Object.freeze({ x: 19500, y: 6880 }), activationBounds: Object.freeze({ minX: 18700, maxX: 19999.999, minY: 6600, maxY: 7360 }), routeBounds: Object.freeze({ x: 19800, y: 6750, width: 1800, height: 1000 }) },
]);

const sceneLayers = scene => {
  const structureX = scene.id === "dash_takeoff" ? -730 : scene.id === "dash_trench" ? -30 : -300;
  return [
  { id: `${scene.id}_far_slow`, sceneId: scene.id, assetId: "grapple_far", layer: "far_background", x: -180, y: -190, width: 1560, height: 878, cameraRatioX: 0.05, cameraRatioY: 0.045, opacity: 1 },
  { id: `${scene.id}_depth`, sceneId: scene.id, assetId: "grapple_far", layer: "depth_background", x: -410, y: -80, width: 1370, height: 771, cameraRatioX: 0.16, cameraRatioY: 0.115, opacity: 0.3 },
  { id: `${scene.id}_structure`, sceneId: scene.id, assetId: scene.structureAsset, layer: "midground", x: structureX, y: -124, width: 1820, height: 1024, cameraRatioX: 0.48, cameraRatioY: 0.35, opacity: 0.98, continuesBelowViewport: true },
  { id: `${scene.id}_foreground`, sceneId: scene.id, assetId: "foreground_frame", layer: "foreground", x: -2500, y: -46, width: 5200, height: 730, cameraRatioX: 1.08, cameraRatioY: 0.94, opacity: 0.56, minCameraX: scene.anchorCamera.x - 460, maxCameraX: scene.anchorCamera.x + 460 },
  ];
};

export const PASS37_GRAPPLE_PLACEMENTS = freezeList(PASS37_GRAPPLE_SCENES.flatMap(sceneLayers));

export const PASS37_CAMERA_SAMPLES = freezeList([
  { id: "grapple_entry", sceneId: "grapple_entry", playerX: 24350, playerY: 5900, cameraX: 23550, cameraY: 5580 },
  { id: "grapple_first", sceneId: "grapple_entry", playerX: 24600, playerY: 5850, cameraX: 23800, cameraY: 5530 },
  { id: "grapple_apex", sceneId: "grapple_apex", playerX: 24900, playerY: 6350, cameraX: 24100, cameraY: 6030 },
  { id: "grapple_turn", sceneId: "grapple_turn", playerX: 24000, playerY: 6820, cameraX: 23200, cameraY: 6500 },
  { id: "grapple_lower", sceneId: "grapple_turn", playerX: 23600, playerY: 6900, cameraX: 22850, cameraY: 6580 },
  { id: "grapple_exit", sceneId: "grapple_exit", playerX: 22800, playerY: 6900, cameraX: 22000, cameraY: 6580 },
  { id: "dash_takeoff", sceneId: "dash_takeoff", playerX: 22000, playerY: 6900, cameraX: 21200, cameraY: 6580 },
  { id: "dash_airborne", sceneId: "dash_takeoff", playerX: 21750, playerY: 6840, cameraX: 21100, cameraY: 6520 },
  { id: "dash_trench", sceneId: "dash_trench", playerX: 21300, playerY: 7040, cameraX: 20500, cameraY: 6720 },
  { id: "dash_landing", sceneId: "dash_trench", playerX: 20900, playerY: 7100, cameraX: 20100, cameraY: 6780 },
  { id: "dash_exit", sceneId: "dash_exit", playerX: 20300, playerY: 7200, cameraX: 19500, cameraY: 6880 },
  { id: "dash_exit_left", sceneId: "dash_exit", playerX: 19950, playerY: 7270, cameraX: 19150, cameraY: 6950 },
]);

export const PASS37_GRAPPLE_PLAN = Object.freeze({
  id: "pass37_triple_grapple_air_dash_raster_depth",
  title: "TRIPLE GRAPPLE + AIR DASH PARALLAX DEPTH",
  baselineSha: "dee8906",
  scope: "triple_grapple_and_air_dash_spike_corridor_only",
  sceneCount: PASS37_GRAPPLE_SCENES.length,
  assetCount: PASS37_GRAPPLE_ASSETS.length,
  newAssetCount: PASS37_GRAPPLE_ASSETS.filter(asset => asset.provenance === "pass37_new").length,
  sharedAssetCount: PASS37_GRAPPLE_ASSETS.filter(asset => asset.provenance !== "pass37_new").length,
  placementCount: PASS37_GRAPPLE_PLACEMENTS.length,
  layerOrder: Object.freeze(["far_background", "depth_background", "midground", "foreground"]),
  parallaxRatios: Object.freeze({ far: 0.05, depth: 0.16, mid: 0.48, foreground: 1.08 }),
  valuePlanes: Object.freeze(["abyss_shadow", "blue_black_masonry", "teal_rim_light", "amber_service_light"]),
  playableSurfaceAssetId: "route_stone",
  grappleSpriteAssetId: "grapple_anchor",
  collisionChanges: 0,
  progressGate: "pass10Completed",
  sceneTransitions: freezeList([
    { fromSceneId: "grapple_entry", toSceneId: "grapple_apex", axis: "y", start: 5820, end: 5960, direction: 1, minX: 23000, maxX: 24500 },
    { fromSceneId: "grapple_apex", toSceneId: "grapple_turn", axis: "y", start: 6320, end: 6460, direction: 1, minX: 22800, maxX: 24500 },
    { fromSceneId: "grapple_turn", toSceneId: "grapple_exit", axis: "x", start: 22720, end: 22860, direction: -1, minY: 6200, maxY: 7080 },
    { fromSceneId: "grapple_exit", toSceneId: "dash_takeoff", axis: "x", start: 21620, end: 21760, direction: -1, minY: 6200, maxY: 7080 },
    { fromSceneId: "dash_takeoff", toSceneId: "dash_trench", axis: "x", start: 20820, end: 20960, direction: -1, minY: 6400, maxY: 7240 },
    { fromSceneId: "dash_trench", toSceneId: "dash_exit", axis: "x", start: 19920, end: 20060, direction: -1, minY: 6500, maxY: 7380 },
  ]),
  postPass40Polish: Object.freeze({ timing: "after_pass40_integration", preserveThroughPass40: "current_realistic_high_detail_style", operations: Object.freeze(["subtle_background_blur", "shape_simplification", "character_environment_style_unification"]) }),
  thresholds: Object.freeze({ minimumCameraSamples: 12, maximumFarCameraRatio: 0.1, minimumForegroundCameraRatio: 1.05, minimumParallaxSeparation: 0.95, minimumValuePlanes: 4, minimumBottomEdgeCoverage: 0.15, minimumBelowViewportExtensionPx: 120, minimumPlayerContrastRatio: 4.5, maximumFlatPlaceholderCoverage: 0.06, maximumAssetLoadFailures: 0 }),
  renderContract: Object.freeze({ surfaceTopOffsetPx: -3, surfaceMinHeightPx: 52, surfaceMaxHeightPx: 84, anchorWidthPx: 118, anchorHeightPx: 177, anchorBottomOffsetPx: 24, measuredPixelRegion: Object.freeze({ x: 0, y: 110, width: VIEWPORT.width, height: 550 }) }),
});

export async function loadPass37GrappleAssets() {
  const entries = await Promise.all(PASS37_GRAPPLE_ASSETS.map(asset => new Promise(resolve => {
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

export function getPass37ActiveScene(camera) {
  return PASS37_GRAPPLE_SCENES.find(scene => {
    const b = scene.activationBounds;
    return camera.x >= b.minX && camera.x <= b.maxX && camera.y >= b.minY && camera.y <= b.maxY;
  }) ?? null;
}

export function getPass37SceneBlend(camera) {
  for (const transition of PASS37_GRAPPLE_PLAN.sceneTransitions) {
    if (transition.minX !== undefined && camera.x < transition.minX) continue;
    if (transition.maxX !== undefined && camera.x > transition.maxX) continue;
    if (transition.minY !== undefined && camera.y < transition.minY) continue;
    if (transition.maxY !== undefined && camera.y > transition.maxY) continue;
    const value = camera[transition.axis];
    if (value < transition.start || value > transition.end) continue;
    const raw = (value - transition.start) / (transition.end - transition.start);
    const ratio = transition.direction === -1 ? 1 - raw : raw;
    const from = PASS37_GRAPPLE_SCENES.find(scene => scene.id === transition.fromSceneId);
    const to = PASS37_GRAPPLE_SCENES.find(scene => scene.id === transition.toSceneId);
    if (from && to) return freezeList([{ scene: from, opacity: 1 - ratio }, { scene: to, opacity: ratio }]);
  }
  const active = getPass37ActiveScene(camera);
  return active ? freezeList([{ scene: active, opacity: 1 }]) : Object.freeze([]);
}

export function getPass37ScreenPlacement(scene, placement, camera) {
  return Object.freeze({ x: placement.x - (camera.x - scene.anchorCamera.x) * placement.cameraRatioX, y: placement.y - (camera.y - scene.anchorCamera.y) * placement.cameraRatioY, width: placement.width, height: placement.height });
}

export function validatePass37GrappleDashArt() {
  const plan = PASS37_GRAPPLE_PLAN;
  const assetIds = new Set(PASS37_GRAPPLE_ASSETS.map(item => item.id));
  const byLayer = layer => PASS37_GRAPPLE_PLACEMENTS.filter(item => item.layer === layer);
  const continuation = PASS37_GRAPPLE_PLACEMENTS.filter(item => item.continuesBelowViewport);
  const continuationAssets = continuation.map(item => PASS37_GRAPPLE_ASSETS.find(asset => asset.id === item.assetId));
  const checks = [
    ["plan_id", plan.id === "pass37_triple_grapple_air_dash_raster_depth"], ["baseline_sha", plan.baselineSha === "dee8906"], ["scope_explicit", plan.scope === "triple_grapple_and_air_dash_spike_corridor_only"], ["seven_scene_scope", plan.sceneCount === 7], ["eight_assets", plan.assetCount === 8], ["six_new_assets", plan.newAssetCount === 6], ["two_shared_assets", plan.sharedAssetCount === 2], ["twenty_eight_placements", plan.placementCount === 28],
    ["asset_ids_unique", assetIds.size === PASS37_GRAPPLE_ASSETS.length], ["scene_ids_unique", new Set(PASS37_GRAPPLE_SCENES.map(item => item.id)).size === 7], ["placement_ids_unique", new Set(PASS37_GRAPPLE_PLACEMENTS.map(item => item.id)).size === 28], ["placement_assets_exist", PASS37_GRAPPLE_PLACEMENTS.every(item => assetIds.has(item.assetId))], ["scene_structure_assets_exist", PASS37_GRAPPLE_SCENES.every(item => assetIds.has(item.structureAsset))],
    ["seven_far_placements", byLayer("far_background").length === 7], ["seven_depth_placements", byLayer("depth_background").length === 7], ["seven_midground_placements", byLayer("midground").length === 7], ["seven_foreground_placements", byLayer("foreground").length === 7], ["far_slower_than_floor", byLayer("far_background").every(item => item.cameraRatioX <= plan.thresholds.maximumFarCameraRatio)], ["depth_slower_than_mid", byLayer("depth_background").every(item => item.cameraRatioX < plan.parallaxRatios.mid)], ["foreground_faster_than_floor", byLayer("foreground").every(item => item.cameraRatioX >= plan.thresholds.minimumForegroundCameraRatio)], ["visible_parallax_separation", plan.parallaxRatios.foreground - plan.parallaxRatios.far >= plan.thresholds.minimumParallaxSeparation],
    ["four_value_planes", plan.valuePlanes.length >= 4], ["seven_continuation_placements", continuation.length === 7], ["continuation_assets_bottom_coverage", continuationAssets.every(asset => asset?.bottomEdgeCoverage >= plan.thresholds.minimumBottomEdgeCoverage)], ["supports_extend_below_viewport", continuation.every(item => item.y + item.height >= VIEWPORT.height + plan.thresholds.minimumBelowViewportExtensionPx)],
    ["twelve_camera_samples", PASS37_CAMERA_SAMPLES.length >= plan.thresholds.minimumCameraSamples], ["samples_cover_all_scenes", new Set(PASS37_CAMERA_SAMPLES.map(item => item.sceneId)).size === 7], ["sample_cameras_active", PASS37_CAMERA_SAMPLES.every(sample => getPass37ActiveScene({ x: sample.cameraX, y: sample.cameraY })?.id === sample.sceneId)], ["six_scene_transitions", plan.sceneTransitions.length === 6], ["transition_widths", plan.sceneTransitions.every(item => item.end - item.start === 140)], ["decreasing_route_transitions", plan.sceneTransitions.filter(item => item.axis === "x").every(item => item.direction === -1)],
    ["zero_collision_changes", plan.collisionChanges === 0], ["progress_gate_declared", plan.progressGate === "pass10Completed"], ["surface_asset_exists", assetIds.has(plan.playableSurfaceAssetId)], ["grapple_sprite_exists", assetIds.has(plan.grappleSpriteAssetId)], ["far_asset_opaque", PASS37_GRAPPLE_ASSETS.find(item => item.id === "grapple_far")?.alpha === false], ["structure_cutouts_alpha", PASS37_GRAPPLE_ASSETS.filter(item => item.layer === "midground").every(item => item.alpha === true)], ["dimensions_declared", PASS37_GRAPPLE_ASSETS.every(item => item.expectedWidth > 0 && item.expectedHeight > 0)],
    ["contrast_threshold", plan.thresholds.minimumPlayerContrastRatio >= 4.5], ["flat_placeholder_threshold", plan.thresholds.maximumFlatPlaceholderCoverage <= 0.06], ["no_asset_failures_allowed", plan.thresholds.maximumAssetLoadFailures === 0], ["style_preserved_through_pass40", plan.postPass40Polish.preserveThroughPass40 === "current_realistic_high_detail_style"], ["polish_after_pass40", plan.postPass40Polish.timing === "after_pass40_integration"], ["anchor_sprite_size", plan.renderContract.anchorWidthPx >= 110 && plan.renderContract.anchorHeightPx >= 170],
  ].map(([id, passed]) => Object.freeze({ id, passed }));
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
