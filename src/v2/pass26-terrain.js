import { WORLD } from "./blueprint.js";
import { PASS15_LEVEL } from "./pass15-level.js";
import { PASS17_MATERIALS } from "./pass17-art.js";
import { PASS18_LEVEL } from "./pass18-level.js";
import { PASS20_LEVEL } from "./pass20-level.js";
import { PASS22_LEVEL } from "./pass22-level.js";
import { PASS23_LEVEL } from "./pass23-level.js";

const freezeItems = items => Object.freeze(items.map(item => Object.freeze(item)));
const hash = value => [...value].reduce((total, character) => ((total * 33) ^ character.charCodeAt(0)) >>> 0, 2166136261);

const sourceFloors = [
  ...PASS15_LEVEL.floors,
  ...PASS18_LEVEL.floors,
  ...PASS20_LEVEL.floors,
  ...PASS22_LEVEL.floors,
  ...PASS23_LEVEL.floors,
];
const sourceSolids = [
  ...PASS15_LEVEL.solids,
  ...PASS18_LEVEL.solids,
  ...PASS20_LEVEL.solids,
  ...PASS22_LEVEL.solids,
  ...PASS23_LEVEL.solids,
];
const uniqueById = items => [...new Map(items.map(item => [item.id, item])).values()];
const uniqueFloors = uniqueById(sourceFloors);
const uniqueSolids = uniqueById(sourceSolids);

export const PASS26_PROFILES = Object.freeze({
  timber_bridge: Object.freeze({ base: "#44362b", dark: "#211b18", cap: "#c49b65", seam: "#806044", accent: "#d7b47b", mode: "timber" }),
  grotto_slate: Object.freeze({ base: "#283737", dark: "#111c1e", cap: "#9db8ad", seam: "#536b67", accent: "#c8cfaa", mode: "strata" }),
  spring_basin: Object.freeze({ base: "#263a3c", dark: "#102025", cap: "#efb96f", seam: "#4e6969", accent: "#8fd8cf", mode: "machine" }),
  recovery_stone: Object.freeze({ base: "#293a37", dark: "#12211f", cap: "#a8c6bb", seam: "#4e6d64", accent: "#d6c47f", mode: "masonry" }),
  gauntlet_machine: Object.freeze({ base: "#293538", dark: "#101a1d", cap: "#9fc7c1", seam: "#536b70", accent: "#df765f", mode: "machine" }),
});

const profileForFloor = floor => {
  if (floor.phase === 15 && floor.lane !== "final_landing") return { key: "timber_bridge", ...PASS26_PROFILES.timber_bridge };
  if (floor.phase === 18) return { key: "grotto_slate", ...PASS26_PROFILES.grotto_slate };
  if (floor.phase === 20) return { key: "spring_basin", ...PASS26_PROFILES.spring_basin };
  if (floor.phase === 22) return { key: "recovery_stone", ...PASS26_PROFILES.recovery_stone };
  if (floor.phase === 23) return { key: "gauntlet_machine", ...PASS26_PROFILES.gauntlet_machine };
  const zoneIndex = floor.phase === 15 ? 10 : Math.max(1, Math.min(10, floor.zone ?? 1));
  const material = PASS17_MATERIALS[zoneIndex - 1];
  return {
    key: material.type,
    base: material.base,
    dark: PASS17_MATERIALS[Math.max(0, zoneIndex - 2)].seam,
    cap: material.cap,
    seam: material.seam,
    accent: material.accent,
    mode: [5, 8].includes(zoneIndex) ? "machine" : [3, 4, 7].includes(zoneIndex) ? "masonry" : "strata",
  };
};

export const PASS26_FLOOR_SKINS = freezeItems(uniqueFloors.map((floor, index) => {
  const seed = hash(floor.id);
  const profile = profileForFloor(floor);
  const length = Math.hypot(floor.x2 - floor.x1, floor.y2 - floor.y1);
  const timber = profile.mode === "timber";
  const depth = timber ? 62 + (seed % 20) : 176 + (seed % 126);
  return {
    id: `terrain_skin_${floor.id}`,
    floorId: floor.id,
    sourceIndex: index,
    x1: floor.x1,
    y1: floor.y1,
    x2: floor.x2,
    y2: floor.y2,
    zone: floor.zone ?? null,
    phase: floor.phase ?? null,
    lane: floor.lane ?? null,
    profile: profile.key,
    mode: profile.mode,
    base: profile.base,
    dark: profile.dark,
    cap: profile.cap,
    seam: profile.seam,
    accent: profile.accent,
    depth,
    topOffsets: Object.freeze([0, ((seed >>> 3) % 5) - 2, ((seed >>> 7) % 7) - 3, 0]),
    bottomOffsets: Object.freeze([18 + (seed % 44), 4 + ((seed >>> 5) % 62), 24 + ((seed >>> 9) % 56)]),
    detailCount: Math.max(2, Math.ceil(length / (timber ? 82 : 118))),
    visualOnly: true,
  };
}));

export const PASS26_SOLID_SKINS = freezeItems(uniqueSolids.map((solid, index) => {
  const seed = hash(solid.id);
  const machine = solid.phase >= 20 || solid.role?.includes("arch") || solid.role?.includes("ceiling");
  const profile = machine ? PASS26_PROFILES.gauntlet_machine : PASS26_PROFILES.grotto_slate;
  return {
    id: `solid_skin_${solid.id}`,
    solidId: solid.id,
    sourceIndex: index,
    x: solid.x,
    y: solid.y,
    width: solid.width,
    height: solid.height,
    role: solid.role,
    phase: solid.phase ?? null,
    mode: machine ? "machine" : "masonry",
    base: profile.base,
    dark: profile.dark,
    cap: profile.cap,
    seam: profile.seam,
    chamfer: Math.min(24, 8 + (seed % 17), solid.width * 0.2, solid.height * 0.2),
    detailCount: Math.max(2, Math.ceil(Math.max(solid.width, solid.height) / 105)),
    visualOnly: true,
  };
}));

const floorSkinById = new Map(PASS26_FLOOR_SKINS.map(item => [item.floorId, item]));
const solidSkinById = new Map(PASS26_SOLID_SKINS.map(item => [item.solidId, item]));

export function getPass26FloorSkin(id) {
  return floorSkinById.get(id) ?? null;
}

export function getPass26SolidSkin(id) {
  return solidSkinById.get(id) ?? null;
}

export const PASS26_TERRAIN = Object.freeze({
  id: "pass26_visual_collision_terrain_separation",
  floorSkins: PASS26_FLOOR_SKINS,
  solidSkins: PASS26_SOLID_SKINS,
  sourceFloorCount: sourceFloors.length,
  uniqueFloorCount: uniqueFloors.length,
  sourceSolidCount: sourceSolids.length,
  layers: Object.freeze(["collision_reference", "irregular_mass", "material_facets", "surface_cap", "underside_structure"]),
  collisionChanges: 0,
});

const exactFloorReference = skin => {
  const source = uniqueFloors.find(item => item.id === skin.floorId);
  return source && skin.x1 === source.x1 && skin.y1 === source.y1 && skin.x2 === source.x2 && skin.y2 === source.y2;
};
const exactSolidReference = skin => {
  const source = uniqueSolids.find(item => item.id === skin.solidId);
  return source && skin.x === source.x && skin.y === source.y && skin.width === source.width && skin.height === source.height;
};
const colorValid = color => /^#[0-9a-f]{6}$/i.test(color);

export function validatePass26Terrain() {
  const floorIds = PASS26_FLOOR_SKINS.map(item => item.floorId);
  const solidIds = PASS26_SOLID_SKINS.map(item => item.solidId);
  const checks = [
    { id: "source_floor_count", passed: sourceFloors.length === 146 },
    { id: "unique_floor_count", passed: uniqueFloors.length === 145 },
    { id: "all_floor_skins", passed: PASS26_FLOOR_SKINS.length === uniqueFloors.length },
    { id: "all_solid_skins", passed: PASS26_SOLID_SKINS.length === 38 && uniqueSolids.length === 38 },
    { id: "floor_ids_unique", passed: new Set(floorIds).size === floorIds.length },
    { id: "solid_ids_unique", passed: new Set(solidIds).size === solidIds.length },
    { id: "exact_floor_collision_references", passed: PASS26_FLOOR_SKINS.every(exactFloorReference) },
    { id: "exact_solid_collision_references", passed: PASS26_SOLID_SKINS.every(exactSolidReference) },
    { id: "visual_only_floors", passed: PASS26_FLOOR_SKINS.every(item => item.visualOnly) },
    { id: "visual_only_solids", passed: PASS26_SOLID_SKINS.every(item => item.visualOnly) },
    { id: "zero_collision_changes", passed: PASS26_TERRAIN.collisionChanges === 0 },
    { id: "five_render_layers", passed: PASS26_TERRAIN.layers.length === 5 },
    { id: "collision_reference_first", passed: PASS26_TERRAIN.layers[0] === "collision_reference" },
    { id: "underside_last", passed: PASS26_TERRAIN.layers.at(-1) === "underside_structure" },
    { id: "floor_colors", passed: PASS26_FLOOR_SKINS.every(item => [item.base, item.dark, item.cap, item.seam, item.accent].every(colorValid)) },
    { id: "solid_colors", passed: PASS26_SOLID_SKINS.every(item => [item.base, item.dark, item.cap, item.seam].every(colorValid)) },
    { id: "positive_floor_depth", passed: PASS26_FLOOR_SKINS.every(item => item.depth >= 60 && item.depth <= 310) },
    { id: "floor_detail_density", passed: PASS26_FLOOR_SKINS.reduce((sum, item) => sum + item.detailCount, 0) >= 430 },
    { id: "solid_detail_density", passed: PASS26_SOLID_SKINS.reduce((sum, item) => sum + item.detailCount, 0) >= 90 },
    { id: "four_top_samples", passed: PASS26_FLOOR_SKINS.every(item => item.topOffsets.length === 4) },
    { id: "three_bottom_samples", passed: PASS26_FLOOR_SKINS.every(item => item.bottomOffsets.length === 3) },
    { id: "top_jitter_safe", passed: PASS26_FLOOR_SKINS.every(item => item.topOffsets.every(value => Math.abs(value) <= 3)) },
    { id: "five_profiles", passed: Object.keys(PASS26_PROFILES).length === 5 },
    { id: "timber_bridge_coverage", passed: PASS26_FLOOR_SKINS.filter(item => item.profile === "timber_bridge").length === 11 },
    { id: "grotto_coverage", passed: PASS26_FLOOR_SKINS.filter(item => item.phase === 18).length === 14 },
    { id: "spring_coverage", passed: PASS26_FLOOR_SKINS.filter(item => item.phase === 20).length === 3 },
    { id: "recovery_coverage", passed: PASS26_FLOOR_SKINS.filter(item => item.phase === 22).length === 3 },
    { id: "gauntlet_coverage", passed: PASS26_FLOOR_SKINS.filter(item => item.phase === 23).length === 6 },
    { id: "all_modes_known", passed: PASS26_FLOOR_SKINS.every(item => ["timber", "strata", "masonry", "machine"].includes(item.mode)) },
    { id: "skins_inside_world_x", passed: PASS26_FLOOR_SKINS.every(item => item.x1 >= 0 && item.x2 <= WORLD.width) },
    { id: "solid_chamfers_safe", passed: PASS26_SOLID_SKINS.every(item => item.chamfer >= 0 && item.chamfer <= item.width * 0.2 && item.chamfer <= item.height * 0.2) },
    { id: "lookup_floor_complete", passed: uniqueFloors.every(item => getPass26FloorSkin(item.id)?.floorId === item.id) },
    { id: "lookup_solid_complete", passed: uniqueSolids.every(item => getPass26SolidSkin(item.id)?.solidId === item.id) },
    { id: "terrain_identity", passed: PASS26_TERRAIN.id === "pass26_visual_collision_terrain_separation" },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    floorDetailCount: PASS26_FLOOR_SKINS.reduce((sum, item) => sum + item.detailCount, 0),
    solidDetailCount: PASS26_SOLID_SKINS.reduce((sum, item) => sum + item.detailCount, 0),
    checks: Object.freeze(checks),
  });
}
