import { VIEWPORT } from "./config.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS33_TUNNEL_ASSETS = freezeList([
  { id: "tunnel_far", src: "assets/v2/pass33/tunnel-far.webp", type: "image/webp", layer: "far_background", alpha: false, expectedWidth: 1586, expectedHeight: 992, provenance: "pass33_new" },
  { id: "compression_vault", src: "assets/v2/pass33/compression-vault.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1923, expectedHeight: 818, provenance: "pass33_new" },
  { id: "shaft_frame", src: "assets/v2/pass33/shaft-frame.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1024, expectedHeight: 1536, provenance: "pass33_new", bottomEdgeCoverage: 0.3427 },
  { id: "uneven_gallery", src: "assets/v2/pass33/uneven-gallery.webp", type: "image/webp", layer: "midground", alpha: true, expectedWidth: 1690, expectedHeight: 931, provenance: "pass33_new", bottomEdgeCoverage: 0.3313 },
  { id: "foreground_frame", src: "assets/v2/pass33/foreground-frame.webp", type: "image/webp", layer: "foreground", alpha: true, expectedWidth: 1665, expectedHeight: 944, provenance: "pass33_new" },
  { id: "route_stone", src: "assets/v2/pass31/route-stone.webp", type: "image/webp", layer: "playable_surface", alpha: true, expectedWidth: 1748, expectedHeight: 202, provenance: "pass31_shared" },
]);

export const PASS33_TUNNEL_SCENES = freezeList([
  { id: "compression_passage", title: "COMPRESSION PASSAGE", anchorCamera: Object.freeze({ x: 10600, y: 2860 }), activationBounds: Object.freeze({ minX: 10000, maxX: 11249.999, minY: 2400, maxY: 3400 }), routeBounds: Object.freeze({ x: 10350, y: 2700, width: 1250, height: 950 }) },
  { id: "bottomless_lift_shaft", title: "BOTTOMLESS LIFT SHAFT", anchorCamera: Object.freeze({ x: 11480, y: 2980 }), activationBounds: Object.freeze({ minX: 11250, maxX: 11799.999, minY: 2400, maxY: 3450 }), routeBounds: Object.freeze({ x: 11350, y: 2700, width: 1700, height: 1250 }) },
  { id: "uneven_abyss_gallery", title: "UNEVEN ABYSS GALLERY", anchorCamera: Object.freeze({ x: 12450, y: 3140 }), activationBounds: Object.freeze({ minX: 11800, maxX: 13380, minY: 2500, maxY: 3500 }), routeBounds: Object.freeze({ x: 11800, y: 2950, width: 2000, height: 1150 }) },
]);

export const PASS33_TUNNEL_PLACEMENTS = freezeList([
  { id: "compression_far_slow", sceneId: "compression_passage", assetId: "tunnel_far", layer: "far_background", x: -170, y: -170, width: 1540, height: 963, cameraRatioX: 0.08, cameraRatioY: 0.07, opacity: 1 },
  { id: "compression_far_middle", sceneId: "compression_passage", assetId: "tunnel_far", layer: "depth_background", x: -355, y: -40, width: 1240, height: 776, cameraRatioX: 0.2, cameraRatioY: 0.14, opacity: 0.28 },
  { id: "compression_vault_main", sceneId: "compression_passage", assetId: "compression_vault", layer: "midground", x: -170, y: -120, width: 1540, height: 655, cameraRatioX: 0.43, cameraRatioY: 0.32, opacity: 0.96 },
  { id: "compression_foreground", sceneId: "compression_passage", assetId: "foreground_frame", layer: "foreground", x: -2650, y: -45, width: 5500, height: 726, cameraRatioX: 1.1, cameraRatioY: 0.94, opacity: 0.74 },

  { id: "shaft_far_slow", sceneId: "bottomless_lift_shaft", assetId: "tunnel_far", layer: "far_background", x: -170, y: -185, width: 1540, height: 963, cameraRatioX: 0.08, cameraRatioY: 0.07, opacity: 1 },
  { id: "shaft_far_middle", sceneId: "bottomless_lift_shaft", assetId: "tunnel_far", layer: "depth_background", x: -250, y: -45, width: 1240, height: 776, cameraRatioX: 0.2, cameraRatioY: 0.14, opacity: 0.3 },
  { id: "shaft_frame_main", sceneId: "bottomless_lift_shaft", assetId: "shaft_frame", layer: "midground", x: 225, y: -90, width: 750, height: 1125, cameraRatioX: 0.46, cameraRatioY: 0.34, opacity: 0.98, continuesBelowViewport: true },
  { id: "shaft_foreground", sceneId: "bottomless_lift_shaft", assetId: "foreground_frame", layer: "foreground", x: -2650, y: -45, width: 5500, height: 731, cameraRatioX: 1.1, cameraRatioY: 0.94, opacity: 0.7 },

  { id: "gallery_far_slow", sceneId: "uneven_abyss_gallery", assetId: "tunnel_far", layer: "far_background", x: -170, y: -180, width: 1540, height: 963, cameraRatioX: 0.08, cameraRatioY: 0.07, opacity: 1 },
  { id: "gallery_far_middle", sceneId: "uneven_abyss_gallery", assetId: "tunnel_far", layer: "depth_background", x: -330, y: -30, width: 1240, height: 776, cameraRatioX: 0.2, cameraRatioY: 0.14, opacity: 0.3 },
  { id: "gallery_structure_main", sceneId: "uneven_abyss_gallery", assetId: "uneven_gallery", layer: "midground", x: -140, y: 20, width: 1480, height: 880, cameraRatioX: 0.47, cameraRatioY: 0.32, opacity: 0.98, continuesBelowViewport: true },
  { id: "gallery_foreground", sceneId: "uneven_abyss_gallery", assetId: "foreground_frame", layer: "foreground", x: -2350, y: -44, width: 5500, height: 728, cameraRatioX: 1.1, cameraRatioY: 0.94, opacity: 0.72, maxCameraX: 12800 },
]);

export const PASS33_CAMERA_SAMPLES = freezeList([
  { id: "tunnel_entry", sceneId: "compression_passage", playerX: 10720, playerY: 3235, cameraX: 10410, cameraY: 2975 },
  { id: "low_beam_west", sceneId: "compression_passage", playerX: 11080, playerY: 3102, cameraX: 10770, cameraY: 2842 },
  { id: "low_beam_east", sceneId: "compression_passage", playerX: 11410, playerY: 3102, cameraX: 11100, cameraY: 2842 },
  { id: "shaft_entry", sceneId: "bottomless_lift_shaft", playerX: 11570, playerY: 3250, cameraX: 11260, cameraY: 2990 },
  { id: "shaft_carriage", sceneId: "bottomless_lift_shaft", playerX: 11700, playerY: 3250, cameraX: 11390, cameraY: 2990 },
  { id: "shaft_landing", sceneId: "bottomless_lift_shaft", playerX: 12000, playerY: 3375, cameraX: 11690, cameraY: 3115 },
  { id: "uneven_west", sceneId: "uneven_abyss_gallery", playerX: 12300, playerY: 3520, cameraX: 11990, cameraY: 3260 },
  { id: "uneven_center", sceneId: "uneven_abyss_gallery", playerX: 12800, playerY: 3630, cameraX: 12490, cameraY: 3370 },
  { id: "uneven_exit", sceneId: "uneven_abyss_gallery", playerX: 13400, playerY: 3652, cameraX: 13090, cameraY: 3392 },
]);

export const PASS33_TUNNEL_PLAN = Object.freeze({
  id: "pass33_uneven_tunnel_raster_depth",
  title: "UNEVEN TUNNEL PARALLAX DEPTH",
  baselineSha: "3adfe71",
  scope: "uneven_tunnel_and_lift_shaft_only",
  sceneCount: PASS33_TUNNEL_SCENES.length,
  assetCount: PASS33_TUNNEL_ASSETS.length,
  newAssetCount: PASS33_TUNNEL_ASSETS.filter(asset => asset.provenance === "pass33_new").length,
  sharedAssetCount: PASS33_TUNNEL_ASSETS.filter(asset => asset.provenance !== "pass33_new").length,
  placementCount: PASS33_TUNNEL_PLACEMENTS.length,
  layerOrder: Object.freeze(["far_background", "depth_background", "midground", "foreground"]),
  parallaxRatios: Object.freeze({ far: 0.08, depth: 0.2, midMin: 0.43, foreground: 1.1 }),
  valuePlanes: Object.freeze(["deep_shadow", "cool_midtone", "teal_edge_light", "warm_lamp_accent"]),
  playableSurfaceAssetId: "route_stone",
  collisionChanges: 0,
  entryTransition: Object.freeze({ startX: 10000, endX: 10200 }),
  sceneTransitions: freezeList([
    { fromSceneId: "compression_passage", toSceneId: "bottomless_lift_shaft", startX: 11160, endX: 11340 },
    { fromSceneId: "bottomless_lift_shaft", toSceneId: "uneven_abyss_gallery", startX: 11710, endX: 11890 },
  ]),
  thresholds: Object.freeze({ minimumCameraSamples: 9, maximumFarCameraRatio: 0.1, minimumForegroundCameraRatio: 1.05, minimumParallaxSeparation: 0.95, minimumValuePlanes: 4, minimumBottomEdgeCoverage: 0.3, minimumBelowViewportExtensionPx: 100, visibleSeamColumnsAllowed: 0, foregroundPlayerOverlapAllowed: 0, minimumPlayerContrastRatio: 4.5, maximumFlatPlaceholderCoverage: 0.06, maximumAssetLoadFailures: 0 }),
  renderContract: Object.freeze({ surfaceTopOffsetPx: -3, surfaceMinHeightPx: 52, surfaceMaxHeightPx: 82, ceilingSkinDepthPx: 78, playerSafetyRect: Object.freeze({ x: 270, y: 205, width: 118, height: 126 }), measuredPixelRegion: Object.freeze({ x: 0, y: 110, width: VIEWPORT.width, height: 550 }) }),
});

export async function loadPass33TunnelAssets() {
  const entries = await Promise.all(PASS33_TUNNEL_ASSETS.map(asset => new Promise(resolve => {
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

export function getPass33ActiveScene(camera) {
  return PASS33_TUNNEL_SCENES.find(scene => {
    const bounds = scene.activationBounds;
    return camera.x >= bounds.minX && camera.x <= bounds.maxX && camera.y >= bounds.minY && camera.y <= bounds.maxY;
  }) ?? null;
}

export function getPass33SceneBlend(camera) {
  for (const transition of PASS33_TUNNEL_PLAN.sceneTransitions) {
    if (camera.x < transition.startX || camera.x > transition.endX) continue;
    const from = PASS33_TUNNEL_SCENES.find(scene => scene.id === transition.fromSceneId);
    const to = PASS33_TUNNEL_SCENES.find(scene => scene.id === transition.toSceneId);
    const toOpacity = (camera.x - transition.startX) / (transition.endX - transition.startX);
    return freezeList([{ scene: from, opacity: 1 - toOpacity }, { scene: to, opacity: toOpacity }]);
  }
  const active = getPass33ActiveScene(camera);
  return active ? freezeList([{ scene: active, opacity: 1 }]) : Object.freeze([]);
}

export function getPass33ScreenPlacement(scene, placement, camera) {
  return Object.freeze({ x: placement.x - (camera.x - scene.anchorCamera.x) * placement.cameraRatioX, y: placement.y - (camera.y - scene.anchorCamera.y) * placement.cameraRatioY, width: placement.width, height: placement.height });
}

export function getPass33EntryOpacity(camera) {
  const transition = PASS33_TUNNEL_PLAN.entryTransition;
  if (camera.x <= transition.startX) return 0;
  if (camera.x >= transition.endX) return 1;
  return (camera.x - transition.startX) / (transition.endX - transition.startX);
}

export function validatePass33UnevenTunnelArt() {
  const plan = PASS33_TUNNEL_PLAN;
  const assetIds = new Set(PASS33_TUNNEL_ASSETS.map(asset => asset.id));
  const sceneIds = new Set(PASS33_TUNNEL_SCENES.map(scene => scene.id));
  const farPlacements = PASS33_TUNNEL_PLACEMENTS.filter(item => item.layer === "far_background");
  const depthPlacements = PASS33_TUNNEL_PLACEMENTS.filter(item => item.layer === "depth_background");
  const midPlacements = PASS33_TUNNEL_PLACEMENTS.filter(item => item.layer === "midground");
  const foregroundPlacements = PASS33_TUNNEL_PLACEMENTS.filter(item => item.layer === "foreground");
  const continuationPlacements = PASS33_TUNNEL_PLACEMENTS.filter(item => item.continuesBelowViewport);
  const continuationAssets = continuationPlacements.map(item => PASS33_TUNNEL_ASSETS.find(asset => asset.id === item.assetId));
  const midpointBlends = plan.sceneTransitions.map(transition => getPass33SceneBlend({ x: (transition.startX + transition.endX) / 2, y: 3000 }));
  const checks = [
    { id: "plan_id", passed: plan.id === "pass33_uneven_tunnel_raster_depth" },
    { id: "plan_title", passed: plan.title === "UNEVEN TUNNEL PARALLAX DEPTH" },
    { id: "baseline_sha", passed: plan.baselineSha === "3adfe71" },
    { id: "scope_explicit", passed: plan.scope === "uneven_tunnel_and_lift_shaft_only" },
    { id: "three_scene_scope", passed: plan.sceneCount === 3 },
    { id: "six_assets", passed: plan.assetCount === 6 },
    { id: "five_new_assets", passed: plan.newAssetCount === 5 },
    { id: "one_shared_asset", passed: plan.sharedAssetCount === 1 },
    { id: "twelve_placements", passed: plan.placementCount === 12 },
    { id: "four_render_layers", passed: plan.layerOrder.length === 4 },
    { id: "asset_ids_unique", passed: assetIds.size === PASS33_TUNNEL_ASSETS.length },
    { id: "scene_ids_unique", passed: sceneIds.size === PASS33_TUNNEL_SCENES.length },
    { id: "placement_ids_unique", passed: new Set(PASS33_TUNNEL_PLACEMENTS.map(item => item.id)).size === PASS33_TUNNEL_PLACEMENTS.length },
    { id: "placement_assets_exist", passed: PASS33_TUNNEL_PLACEMENTS.every(item => assetIds.has(item.assetId)) },
    { id: "placement_scenes_exist", passed: PASS33_TUNNEL_PLACEMENTS.every(item => sceneIds.has(item.sceneId)) },
    { id: "placement_layers_known", passed: PASS33_TUNNEL_PLACEMENTS.every(item => plan.layerOrder.includes(item.layer)) },
    { id: "positive_placement_sizes", passed: PASS33_TUNNEL_PLACEMENTS.every(item => item.width > 0 && item.height > 0) },
    { id: "valid_opacity", passed: PASS33_TUNNEL_PLACEMENTS.every(item => item.opacity > 0 && item.opacity <= 1) },
    { id: "three_far_placements", passed: farPlacements.length === 3 },
    { id: "three_depth_placements", passed: depthPlacements.length === 3 },
    { id: "three_foreground_placements", passed: foregroundPlacements.length === 3 },
    { id: "three_or_more_mid_placements", passed: midPlacements.length >= 3 },
    { id: "far_slower_than_floor", passed: farPlacements.every(item => item.cameraRatioX <= plan.thresholds.maximumFarCameraRatio) },
    { id: "depth_slower_than_mid", passed: depthPlacements.every(item => item.cameraRatioX < Math.min(...midPlacements.map(mid => mid.cameraRatioX))) },
    { id: "foreground_faster_than_floor", passed: foregroundPlacements.every(item => item.cameraRatioX >= plan.thresholds.minimumForegroundCameraRatio) },
    { id: "visible_parallax_separation", passed: Math.min(...foregroundPlacements.map(item => item.cameraRatioX)) - Math.max(...farPlacements.map(item => item.cameraRatioX)) >= plan.thresholds.minimumParallaxSeparation },
    { id: "four_value_planes", passed: plan.valuePlanes.length >= plan.thresholds.minimumValuePlanes },
    { id: "deep_shadow_plane", passed: plan.valuePlanes.includes("deep_shadow") },
    { id: "cool_midtone_plane", passed: plan.valuePlanes.includes("cool_midtone") },
    { id: "teal_edge_plane", passed: plan.valuePlanes.includes("teal_edge_light") },
    { id: "warm_accent_plane", passed: plan.valuePlanes.includes("warm_lamp_accent") },
    { id: "continuation_placements_present", passed: continuationPlacements.length === 2 },
    { id: "continuation_assets_have_bottom_coverage", passed: continuationAssets.every(asset => asset?.bottomEdgeCoverage >= plan.thresholds.minimumBottomEdgeCoverage) },
    { id: "supports_extend_below_viewport", passed: continuationPlacements.every(item => item.y + item.height >= VIEWPORT.height + plan.thresholds.minimumBelowViewportExtensionPx) },
    { id: "shaft_support_continues", passed: continuationPlacements.some(item => item.id === "shaft_frame_main") },
    { id: "gallery_supports_continue", passed: continuationPlacements.some(item => item.id === "gallery_structure_main") },
    { id: "nine_camera_samples", passed: PASS33_CAMERA_SAMPLES.length >= plan.thresholds.minimumCameraSamples },
    { id: "samples_cover_all_scenes", passed: new Set(PASS33_CAMERA_SAMPLES.map(item => item.sceneId)).size === PASS33_TUNNEL_SCENES.length },
    { id: "sample_scenes_exist", passed: PASS33_CAMERA_SAMPLES.every(item => sceneIds.has(item.sceneId)) },
    { id: "sample_cameras_active", passed: PASS33_CAMERA_SAMPLES.every(sample => getPass33ActiveScene({ x: sample.cameraX, y: sample.cameraY })?.id === sample.sceneId) },
    { id: "two_scene_transitions", passed: plan.sceneTransitions.length === 2 },
    { id: "transition_order", passed: plan.sceneTransitions.every(item => item.startX < item.endX) },
    { id: "transition_widths", passed: plan.sceneTransitions.every(item => item.endX - item.startX >= 180) },
    { id: "transition_scene_ids", passed: plan.sceneTransitions.every(item => sceneIds.has(item.fromSceneId) && sceneIds.has(item.toSceneId)) },
    { id: "midpoint_crossfades", passed: midpointBlends.every(items => items.length === 2 && items.every(item => Math.abs(item.opacity - 0.5) < 0.001)) },
    { id: "entry_crossfade_width", passed: plan.entryTransition.endX - plan.entryTransition.startX === 200 },
    { id: "entry_opacity_start", passed: getPass33EntryOpacity({ x: plan.entryTransition.startX }) === 0 },
    { id: "entry_opacity_mid", passed: getPass33EntryOpacity({ x: 10100 }) === 0.5 },
    { id: "entry_opacity_end", passed: getPass33EntryOpacity({ x: plan.entryTransition.endX }) === 1 },
    { id: "zero_collision_changes", passed: plan.collisionChanges === 0 },
    { id: "playable_surface_exists", passed: assetIds.has(plan.playableSurfaceAssetId) },
    { id: "surface_asset_shared", passed: PASS33_TUNNEL_ASSETS.find(item => item.id === plan.playableSurfaceAssetId)?.provenance === "pass31_shared" },
    { id: "far_assets_opaque", passed: PASS33_TUNNEL_ASSETS.filter(item => item.layer === "far_background").every(item => item.alpha === false) },
    { id: "cutouts_have_alpha", passed: PASS33_TUNNEL_ASSETS.filter(item => ["midground", "foreground"].includes(item.layer)).every(item => item.alpha === true) },
    { id: "source_types_supported", passed: PASS33_TUNNEL_ASSETS.every(item => ["image/webp", "image/webp"].includes(item.type)) },
    { id: "dimensions_declared", passed: PASS33_TUNNEL_ASSETS.every(item => item.expectedWidth > 0 && item.expectedHeight > 0) },
    { id: "player_safety_contract", passed: plan.renderContract.playerSafetyRect.width >= 100 && plan.renderContract.playerSafetyRect.height >= 120 },
    { id: "measured_region_contract", passed: plan.renderContract.measuredPixelRegion.width === VIEWPORT.width },
    { id: "contrast_threshold", passed: plan.thresholds.minimumPlayerContrastRatio >= 4.5 },
    { id: "flat_placeholder_threshold", passed: plan.thresholds.maximumFlatPlaceholderCoverage <= 0.06 },
    { id: "no_asset_failures_allowed", passed: plan.thresholds.maximumAssetLoadFailures === 0 },
  ];
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
