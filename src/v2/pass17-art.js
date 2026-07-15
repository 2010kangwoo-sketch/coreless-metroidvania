import { WORLD, ZONES } from "./blueprint.js";
import { PASS16_THEMES } from "./pass16-visuals.js";
import { PASS15_LEVEL } from "./pass15-level.js";

const MATERIAL_TYPES = Object.freeze([
  "moss_stone", "wet_masonry", "buried_limestone", "compressed_shale", "fractured_bronze",
  "oxidized_aqueduct", "hanging_sandstone", "reinforced_iron", "abyssal_slate", "weathered_wood",
]);

export const PASS17_MATERIALS = Object.freeze(ZONES.map((zone, index) => Object.freeze({
  zoneId: zone.id,
  type: MATERIAL_TYPES[index],
  base: PASS16_THEMES[index].terrain,
  cap: PASS16_THEMES[index].edge,
  seam: PASS16_THEMES[index].midground,
  accent: PASS16_THEMES[index].light,
  capWidth: 9 + (index % 3) * 2,
  seamSpacing: 86 + (index % 4) * 18,
})));

const floorPoint = (zoneIndex, ratio) => {
  const floors = PASS15_LEVEL.floors.filter(item => (item.phase === 15 ? 10 : item.zone) === zoneIndex);
  const index = Math.min(floors.length - 1, Math.max(0, Math.round((floors.length - 1) * ratio)));
  const floor = floors[index];
  const local = 0.5;
  return Object.freeze({
    x: Math.round(floor.x1 + (floor.x2 - floor.x1) * local),
    y: Math.round(floor.y1 + (floor.y2 - floor.y1) * local),
  });
};

export const PASS17_REINFORCEMENTS = Object.freeze(ZONES.flatMap((zone, index) => [0.2, 0.55, 0.84].map((ratio, itemIndex) => {
  const point = floorPoint(index + 1, ratio);
  const width = 54 + (index % 3) * 12;
  const height = 220 + ((index + itemIndex) % 4) * 70;
  return Object.freeze({
    id: `reinforcement_${String(index + 1).padStart(2, "0")}_${itemIndex + 1}`,
    zoneId: zone.id,
    x: point.x - Math.round(width * 0.5),
    y: point.y - height,
    width,
    height,
    color: PASS16_THEMES[index].edge,
  });
})));

export const PASS17_VEGETATION = Object.freeze(ZONES.flatMap((zone, index) => {
  if ([4, 5, 8, 10].includes(index + 1)) return [];
  return [0.3, 0.68].map((ratio, itemIndex) => {
    const point = floorPoint(index + 1, ratio);
    return Object.freeze({
      id: `vegetation_${String(index + 1).padStart(2, "0")}_${itemIndex + 1}`,
      zoneId: zone.id,
      x: point.x - 45,
      y: point.y - 4,
      width: 90 + (index % 3) * 24,
      height: 36 + ((index + itemIndex) % 3) * 12,
      color: index < 3 ? "#557c68" : "#486c62",
    });
  });
}));

export const PASS17_SUPPORTS = Object.freeze(ZONES.flatMap((zone, index) => [0.36, 0.74].map((ratio, itemIndex) => {
  const point = floorPoint(index + 1, ratio);
  return Object.freeze({
    id: `visual_support_${String(index + 1).padStart(2, "0")}_${itemIndex + 1}`,
    zoneId: zone.id,
    x: point.x - 20,
    y: point.y + 18,
    width: 42 + (index % 2) * 14,
    height: 240 + (index % 4) * 55,
    color: PASS16_THEMES[index].midground,
  });
})));

export const PASS17_ART = Object.freeze({
  materials: PASS17_MATERIALS,
  reinforcements: PASS17_REINFORCEMENTS,
  vegetation: PASS17_VEGETATION,
  supports: PASS17_SUPPORTS,
  rawCollisionOutlines: false,
  depthLayers: Object.freeze(["deep_fog", "material_facade", "surface_caps", "structural_details", "route_readability"]),
});

export function getPass17Material(zoneIndex) {
  return PASS17_MATERIALS[Math.max(0, Math.min(PASS17_MATERIALS.length - 1, zoneIndex - 1))];
}

export function validatePass17Art() {
  const zoneIds = new Set(ZONES.map(zone => zone.id));
  const inWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
  const featureIds = [...PASS17_REINFORCEMENTS, ...PASS17_VEGETATION, ...PASS17_SUPPORTS].map(item => item.id);
  const checks = [
    { id: "ten_material_profiles", passed: PASS17_MATERIALS.length === 10 },
    { id: "material_zone_order", passed: PASS17_MATERIALS.every((item, index) => item.zoneId === ZONES[index].id) },
    { id: "material_types_unique", passed: new Set(PASS17_MATERIALS.map(item => item.type)).size === 10 },
    { id: "material_colors", passed: PASS17_MATERIALS.every(item => [item.base, item.cap, item.seam, item.accent].every(color => /^#[0-9a-f]{6}$/i.test(color))) },
    { id: "cap_widths", passed: PASS17_MATERIALS.every(item => item.capWidth >= 9 && item.capWidth <= 13) },
    { id: "seam_spacing", passed: PASS17_MATERIALS.every(item => item.seamSpacing >= 86 && item.seamSpacing <= 140) },
    { id: "thirty_reinforcements", passed: PASS17_REINFORCEMENTS.length === 30 },
    { id: "reinforcement_zone_coverage", passed: ZONES.every(zone => PASS17_REINFORCEMENTS.filter(item => item.zoneId === zone.id).length === 3) },
    { id: "reinforcements_in_world", passed: PASS17_REINFORCEMENTS.every(inWorld) },
    { id: "reinforcement_dimensions", passed: PASS17_REINFORCEMENTS.every(item => item.width >= 54 && item.height >= 220) },
    { id: "twelve_vegetation_clusters", passed: PASS17_VEGETATION.length === 12 },
    { id: "vegetation_noncollision_zones", passed: PASS17_VEGETATION.every(item => !["uneven_tunnel", "destruction_maze", "enemy_turret_hall", "collapsing_bridge"].includes(item.zoneId)) },
    { id: "vegetation_in_world", passed: PASS17_VEGETATION.every(inWorld) },
    { id: "twenty_visual_supports", passed: PASS17_SUPPORTS.length === 20 },
    { id: "support_zone_coverage", passed: ZONES.every(zone => PASS17_SUPPORTS.filter(item => item.zoneId === zone.id).length === 2) },
    { id: "supports_in_world", passed: PASS17_SUPPORTS.every(inWorld) },
    { id: "feature_ids_unique", passed: new Set(featureIds).size === featureIds.length },
    { id: "feature_zone_refs", passed: [...PASS17_REINFORCEMENTS, ...PASS17_VEGETATION, ...PASS17_SUPPORTS].every(item => zoneIds.has(item.zoneId)) },
    { id: "raw_collision_hidden", passed: PASS17_ART.rawCollisionOutlines === false },
    { id: "five_depth_layers", passed: PASS17_ART.depthLayers.length === 5 },
    { id: "surface_cap_layer", passed: PASS17_ART.depthLayers.includes("surface_caps") },
    { id: "route_readability_last", passed: PASS17_ART.depthLayers.at(-1) === "route_readability" },
    { id: "materials_reference", passed: PASS17_ART.materials === PASS17_MATERIALS },
    { id: "visual_only_features", passed: [...PASS17_REINFORCEMENTS, ...PASS17_VEGETATION, ...PASS17_SUPPORTS].every(item => !("collision" in item)) },
  ];
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
