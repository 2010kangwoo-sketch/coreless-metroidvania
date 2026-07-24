const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));

export const PASS28_PALETTE = Object.freeze({
  void: "#02080a",
  deepTeal: "#081d22",
  oxidizedTeal: "#183a3c",
  coldLight: "#8dcbd0",
  soot: "#111718",
  agedIron: "#29302d",
  antiqueGold: "#9a6f32",
  furnaceAmber: "#d88335",
  playerSilhouette: "#e8f2e7",
});

export const PASS28_ART_LAYERS = freezeList([
  { id: "far_background", order: 10, cameraRatio: 0.16, purpose: "remote ruined vaults and depth haze" },
  { id: "midground", order: 20, cameraRatio: 0.52, purpose: "monumental machinery and broken architecture" },
  { id: "raster_backplate", order: 30, cameraRatio: 1, purpose: "painted quality-gate scene locked to world geometry" },
  { id: "playable_terrain", order: 40, cameraRatio: 1, purpose: "exact retained collision route and readable edge" },
  { id: "foreground_atmosphere", order: 50, cameraRatio: 1.18, purpose: "chains, dust, mist and close silhouettes" },
]);

export const PASS28_RASTER_ASSETS = freezeList([
  {
    id: "foundry_quality_gate",
    src: "assets/v2/pass28/foundry-quality-gate.webp",
    type: "image/webp",
    sceneId: "destruction_maze_foundry",
    role: "quality_benchmark_backplate",
    x: 16480,
    y: 3050,
    width: 1586,
    height: 992,
    opacity: 1,
    collision: false,
    expectedWidth: 1586,
    expectedHeight: 992,
  },
]);

export const PASS28_ART_DIRECTION = Object.freeze({
  id: "pass28_raster_art_quality_gate",
  title: "RASTER ART QUALITY GATE",
  baselineSha: "d694e84",
  target: Object.freeze({
    environment: "dark ruined mechanical sanctuary",
    composition: "complex but readable single route in a monumental chamber",
    scale: "small player against architecture several screens tall",
    lighting: "cold blue-green ambient light with restrained amber furnace accents",
    atmosphere: "volumetric shafts, dust, mist and depth falloff",
    materials: "irregular rock, worn carved stone, oxidized iron, brass, soot and subtle growth",
  }),
  invariants: freezeList([
    { id: "final_blueprint", rule: "The retained room layout and height flow are the final blueprint, not an optional reference." },
    { id: "no_simplification", rule: "Do not replace the connected mega chamber with independent boxes or simplified rooms." },
    { id: "readable_route", rule: "Detail may frame the route but must not hide collision edges, hazards or the player silhouette." },
    { id: "collision_retained", rule: "Raster art never changes floor, wall, hazard or completion collision." },
    { id: "asset_consistency", rule: "All later modules inherit this palette, material language, light direction and density target." },
  ]),
  qualityGate: Object.freeze({
    representativeScene: "destruction_maze_foundry",
    approvalPass: 30,
    requiredLayers: 5,
    maxFlatPlaceholderCoverage: 0.08,
    minMonumentalLandmarks: 1,
    minMaterialFamilies: 4,
    playerContrastRequired: true,
    visibleSeamsAllowed: 0,
    collisionChangesAllowed: 0,
  }),
  assetCount: PASS28_RASTER_ASSETS.length,
  collisionChanges: 0,
});

export async function loadPass28RasterAssets() {
  const entries = await Promise.all(PASS28_RASTER_ASSETS.map(asset => new Promise(resolve => {
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

export function validatePass28ArtDirection() {
  const direction = PASS28_ART_DIRECTION;
  const asset = PASS28_RASTER_ASSETS[0];
  const targetKeys = ["environment", "composition", "scale", "lighting", "atmosphere", "materials"];
  const paletteKeys = ["void", "deepTeal", "oxidizedTeal", "coldLight", "soot", "agedIron", "antiqueGold", "furnaceAmber", "playerSilhouette"];
  const checks = [
    { id: "direction_id", passed: direction.id === "pass28_raster_art_quality_gate" },
    { id: "direction_title", passed: direction.title === "RASTER ART QUALITY GATE" },
    { id: "baseline_sha", passed: direction.baselineSha === "d694e84" },
    { id: "target_complete", passed: targetKeys.every(key => direction.target[key]?.length >= 12) },
    { id: "dark_ruin_target", passed: direction.target.environment.includes("dark ruined") },
    { id: "mechanical_target", passed: direction.target.environment.includes("mechanical") },
    { id: "readable_composition", passed: direction.target.composition.includes("readable") },
    { id: "monumental_scale", passed: direction.target.scale.includes("small player") },
    { id: "cold_warm_lighting", passed: direction.target.lighting.includes("blue-green") && direction.target.lighting.includes("amber") },
    { id: "depth_atmosphere", passed: direction.target.atmosphere.includes("depth") },
    { id: "material_variety", passed: ["rock", "stone", "iron", "brass"].every(value => direction.target.materials.includes(value)) },
    { id: "five_invariants", passed: direction.invariants.length === 5 },
    { id: "invariant_ids_unique", passed: new Set(direction.invariants.map(item => item.id)).size === 5 },
    { id: "final_blueprint_locked", passed: direction.invariants.some(item => item.id === "final_blueprint") },
    { id: "simplification_forbidden", passed: direction.invariants.some(item => item.id === "no_simplification") },
    { id: "route_readability_locked", passed: direction.invariants.some(item => item.id === "readable_route") },
    { id: "collision_invariant", passed: direction.invariants.some(item => item.id === "collision_retained") },
    { id: "asset_consistency_invariant", passed: direction.invariants.some(item => item.id === "asset_consistency") },
    { id: "five_layers", passed: PASS28_ART_LAYERS.length === 5 },
    { id: "layer_ids_unique", passed: new Set(PASS28_ART_LAYERS.map(item => item.id)).size === 5 },
    { id: "layer_order", passed: PASS28_ART_LAYERS.every((item, index) => index === 0 || item.order > PASS28_ART_LAYERS[index - 1].order) },
    { id: "parallax_depth", passed: PASS28_ART_LAYERS[0].cameraRatio < PASS28_ART_LAYERS[1].cameraRatio && PASS28_ART_LAYERS.at(-1).cameraRatio > 1 },
    { id: "single_quality_asset", passed: PASS28_RASTER_ASSETS.length === 1 && direction.assetCount === 1 },
    { id: "webp_runtime_asset", passed: asset.type === "image/webp" && asset.src.endsWith(".webp") },
    { id: "foundry_scene", passed: asset.sceneId === direction.qualityGate.representativeScene },
    { id: "quality_role", passed: asset.role === "quality_benchmark_backplate" },
    { id: "asset_world_scale", passed: asset.width >= 1500 && asset.height >= 900 },
    { id: "asset_dimensions_locked", passed: asset.width === asset.expectedWidth && asset.height === asset.expectedHeight },
    { id: "asset_non_collision", passed: asset.collision === false },
    { id: "pass30_approval_gate", passed: direction.qualityGate.approvalPass === 30 },
    { id: "quality_layers_required", passed: direction.qualityGate.requiredLayers === 5 },
    { id: "placeholder_limit", passed: direction.qualityGate.maxFlatPlaceholderCoverage <= 0.08 },
    { id: "landmark_required", passed: direction.qualityGate.minMonumentalLandmarks >= 1 },
    { id: "materials_required", passed: direction.qualityGate.minMaterialFamilies >= 4 },
    { id: "player_contrast_required", passed: direction.qualityGate.playerContrastRequired === true },
    { id: "zero_seams", passed: direction.qualityGate.visibleSeamsAllowed === 0 },
    { id: "zero_collision_changes", passed: direction.collisionChanges === 0 && direction.qualityGate.collisionChangesAllowed === 0 },
    { id: "palette_complete", passed: paletteKeys.every(key => /^#/.test(PASS28_PALETTE[key])) },
  ];
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: freezeList(checks) });
}
