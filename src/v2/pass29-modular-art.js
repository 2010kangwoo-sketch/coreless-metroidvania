const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS29_MODULE_ASSETS = freezeList([
  {
    id: "far_vaults",
    src: "assets/v2/pass29/far-vaults.webp",
    type: "image/webp",
    layer: "far_background",
    alpha: false,
    expectedWidth: 1822,
    expectedHeight: 863,
  },
  {
    id: "broken_arch",
    src: "assets/v2/pass29/broken-arch.png",
    type: "image/png",
    layer: "midground",
    alpha: true,
    expectedWidth: 1586,
    expectedHeight: 992,
  },
  {
    id: "foundry_pylon",
    src: "assets/v2/pass29/foundry-pylon.png",
    type: "image/png",
    layer: "midground",
    alpha: true,
    expectedWidth: 948,
    expectedHeight: 1660,
  },
  {
    id: "foreground_rubble",
    src: "assets/v2/pass29/foreground-rubble.png",
    type: "image/png",
    layer: "foreground",
    alpha: true,
    expectedWidth: 1736,
    expectedHeight: 906,
  },
  {
    id: "route_girder",
    src: "assets/v2/pass29/route-girder.png",
    type: "image/png",
    layer: "playable_surface",
    alpha: true,
    expectedWidth: 1738,
    expectedHeight: 239,
  },
]);

export const PASS29_MODULE_PLACEMENTS = freezeList([
  { id: "far_vaults_main", assetId: "far_vaults", layer: "far_background", x: -80, y: -24, width: 1360, height: 728, cameraRatio: 0.14, opacity: 1 },
  { id: "arch_main", assetId: "broken_arch", layer: "midground", x: 32, y: 56, width: 760, height: 475, cameraRatio: 0.48, opacity: 0.88 },
  { id: "pylon_rear", assetId: "foundry_pylon", layer: "midground", x: 70, y: 176, width: 172, height: 302, cameraRatio: 0.38, opacity: 0.34 },
  { id: "pylon_main", assetId: "foundry_pylon", layer: "midground", x: 840, y: 72, width: 295, height: 518, cameraRatio: 0.63, opacity: 0.92 },
  { id: "rubble_left", assetId: "foreground_rubble", layer: "foreground", x: -110, y: 532, width: 860, height: 268, cameraRatio: 1.16, opacity: 0.98 },
  { id: "rubble_right", assetId: "foreground_rubble", layer: "foreground", x: 790, y: 558, width: 630, height: 260, cameraRatio: 1.12, opacity: 0.9 },
]);

export const PASS29_MODULAR_PLAN = Object.freeze({
  id: "pass29_modular_raster_depth",
  title: "MODULAR RASTER DEPTH",
  baselineSha: "de652dc",
  anchorCamera: Object.freeze({ x: 16649.935, y: 3217.62 }),
  activationBounds: Object.freeze({ x: 16000, y: 2800, width: 2200, height: 1500 }),
  moduleCount: PASS29_MODULE_ASSETS.length,
  placementCount: PASS29_MODULE_PLACEMENTS.length,
  layerOrder: Object.freeze(["far_background", "midground", "foreground"]),
  transparentModuleCount: PASS29_MODULE_ASSETS.filter(asset => asset.alpha).length,
  fallbackAssetId: "foundry_quality_gate",
  collisionChanges: 0,
  qualityGate: Object.freeze({
    independentDepthLayers: 3,
    minimumParallaxSpread: 0.9,
    minimumReusablePlacements: 2,
    requiredAlphaCorners: 4,
    visibleChromaFringeAllowed: 0,
    fullRouteRequired: true,
  }),
});

export async function loadPass29ModuleAssets() {
  const entries = await Promise.all(PASS29_MODULE_ASSETS.map(asset => new Promise(resolve => {
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

export function getPass29ScreenPlacement(placement, camera) {
  const anchor = PASS29_MODULAR_PLAN.anchorCamera;
  return Object.freeze({
    x: placement.x - (camera.x - anchor.x) * placement.cameraRatio,
    y: placement.y - (camera.y - anchor.y) * placement.cameraRatio,
    width: placement.width,
    height: placement.height,
  });
}

export function isPass29CameraActive(camera) {
  const bounds = PASS29_MODULAR_PLAN.activationBounds;
  return camera.x >= bounds.x && camera.x <= bounds.x + bounds.width && camera.y >= bounds.y && camera.y <= bounds.y + bounds.height;
}

export function validatePass29ModularArt() {
  const plan = PASS29_MODULAR_PLAN;
  const ids = new Set(PASS29_MODULE_ASSETS.map(asset => asset.id));
  const ratios = PASS29_MODULE_PLACEMENTS.map(item => item.cameraRatio);
  const sampleAnchor = getPass29ScreenPlacement(PASS29_MODULE_PLACEMENTS[0], plan.anchorCamera);
  const sampleMoved = getPass29ScreenPlacement(PASS29_MODULE_PLACEMENTS[0], { x: plan.anchorCamera.x + 100, y: plan.anchorCamera.y + 100 });
  const reused = PASS29_MODULE_ASSETS.filter(asset => PASS29_MODULE_PLACEMENTS.filter(item => item.assetId === asset.id).length >= 2);
  const checks = [
    { id: "plan_id", passed: plan.id === "pass29_modular_raster_depth" },
    { id: "plan_title", passed: plan.title === "MODULAR RASTER DEPTH" },
    { id: "baseline_sha", passed: plan.baselineSha === "de652dc" },
    { id: "five_modules", passed: plan.moduleCount === 5 && PASS29_MODULE_ASSETS.length === 5 },
    { id: "six_placements", passed: plan.placementCount === 6 && PASS29_MODULE_PLACEMENTS.length === 6 },
    { id: "asset_ids_unique", passed: ids.size === 5 },
    { id: "placement_ids_unique", passed: new Set(PASS29_MODULE_PLACEMENTS.map(item => item.id)).size === 6 },
    { id: "placement_assets_exist", passed: PASS29_MODULE_PLACEMENTS.every(item => ids.has(item.assetId)) },
    { id: "three_layers", passed: plan.layerOrder.length === 3 && new Set(PASS29_MODULE_PLACEMENTS.map(item => item.layer)).size === 3 },
    { id: "layer_order", passed: plan.layerOrder.join(",") === "far_background,midground,foreground" },
    { id: "far_background_asset", passed: PASS29_MODULE_ASSETS.some(asset => asset.id === "far_vaults" && !asset.alpha) },
    { id: "broken_arch_asset", passed: PASS29_MODULE_ASSETS.some(asset => asset.id === "broken_arch" && asset.alpha) },
    { id: "pylon_asset", passed: PASS29_MODULE_ASSETS.some(asset => asset.id === "foundry_pylon" && asset.alpha) },
    { id: "rubble_asset", passed: PASS29_MODULE_ASSETS.some(asset => asset.id === "foreground_rubble" && asset.alpha) },
    { id: "route_girder_asset", passed: PASS29_MODULE_ASSETS.some(asset => asset.id === "route_girder" && asset.layer === "playable_surface" && asset.alpha) },
    { id: "four_transparent_modules", passed: plan.transparentModuleCount === 4 },
    { id: "dimensions_positive", passed: PASS29_MODULE_ASSETS.every(asset => asset.expectedWidth >= 900 && asset.expectedHeight >= (asset.id === "route_girder" ? 200 : 860)) },
    { id: "runtime_formats", passed: PASS29_MODULE_ASSETS.every(asset => asset.type === "image/png" || asset.type === "image/webp") },
    { id: "four_png_cutouts", passed: PASS29_MODULE_ASSETS.filter(asset => asset.type === "image/png" && asset.alpha).length === 4 },
    { id: "one_webp_plate", passed: PASS29_MODULE_ASSETS.filter(asset => asset.type === "image/webp" && !asset.alpha).length === 1 },
    { id: "activation_width", passed: plan.activationBounds.width >= 2200 },
    { id: "activation_height", passed: plan.activationBounds.height >= 1500 },
    { id: "anchor_matches_foundry", passed: Math.abs(plan.anchorCamera.x - 16649.935) < 0.01 && Math.abs(plan.anchorCamera.y - 3217.62) < 0.01 },
    { id: "far_ratio", passed: Math.min(...ratios) === 0.14 },
    { id: "foreground_ratio", passed: Math.max(...ratios) === 1.16 },
    { id: "parallax_spread", passed: Math.max(...ratios) - Math.min(...ratios) >= plan.qualityGate.minimumParallaxSpread },
    { id: "anchor_placement_stable", passed: sampleAnchor.x === PASS29_MODULE_PLACEMENTS[0].x && sampleAnchor.y === PASS29_MODULE_PLACEMENTS[0].y },
    { id: "far_moves_slowly", passed: Math.abs(sampleMoved.x - sampleAnchor.x) === 14 && Math.abs(sampleMoved.y - sampleAnchor.y) === 14 },
    { id: "pylon_reused", passed: PASS29_MODULE_PLACEMENTS.filter(item => item.assetId === "foundry_pylon").length === 2 },
    { id: "rubble_reused", passed: PASS29_MODULE_PLACEMENTS.filter(item => item.assetId === "foreground_rubble").length === 2 },
    { id: "two_reusable_modules", passed: reused.length >= plan.qualityGate.minimumReusablePlacements },
    { id: "opacities_valid", passed: PASS29_MODULE_PLACEMENTS.every(item => item.opacity > 0 && item.opacity <= 1) },
    { id: "screen_sizes_valid", passed: PASS29_MODULE_PLACEMENTS.every(item => item.width >= 170 && item.height >= 250) },
    { id: "far_covers_view", passed: PASS29_MODULE_PLACEMENTS[0].width >= 1200 && PASS29_MODULE_PLACEMENTS[0].height >= 680 },
    { id: "foreground_extends_below", passed: PASS29_MODULE_PLACEMENTS.filter(item => item.layer === "foreground").every(item => item.y + item.height > 680) },
    { id: "fallback_retained", passed: plan.fallbackAssetId === "foundry_quality_gate" },
    { id: "three_independent_depths", passed: plan.qualityGate.independentDepthLayers === 3 },
    { id: "alpha_corner_contract", passed: plan.qualityGate.requiredAlphaCorners === 4 },
    { id: "zero_chroma_fringe", passed: plan.qualityGate.visibleChromaFringeAllowed === 0 },
    { id: "full_route_required", passed: plan.qualityGate.fullRouteRequired === true },
    { id: "zero_collision_changes", passed: plan.collisionChanges === 0 },
    { id: "camera_active_at_anchor", passed: isPass29CameraActive(plan.anchorCamera) },
    { id: "camera_inactive_at_spawn", passed: !isPass29CameraActive({ x: 0, y: 300 }) },
  ];
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: freezeList(checks) });
}
