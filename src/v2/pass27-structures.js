import { WORLD, ZONES } from "./blueprint.js";
import { PASS18_ZONE } from "./pass18-level.js";
import { PASS20_ZONE } from "./pass20-level.js";
import { PASS22_ZONE } from "./pass22-level.js";
import { PASS23_ZONE } from "./pass23-level.js";

const freezeItems = items => Object.freeze(items.map(item => Object.freeze(item)));
const structure = (id, sceneId, kind, x, y, width, height, palette, depth = 0.65) => Object.freeze({
  id, sceneId, kind, x, y, width, height, palette, depth, visualOnly: true,
});

export const PASS27_PALETTES = Object.freeze({
  verdigris: Object.freeze({ shadow: "#0b1618", mass: "#1c3031", edge: "#71918b", accent: "#b4c9b3", glow: "#80c8ba" }),
  buriedGold: Object.freeze({ shadow: "#111615", mass: "#343630", edge: "#a3956d", accent: "#d1bd84", glow: "#e2b86e" }),
  foundry: Object.freeze({ shadow: "#181311", mass: "#3c3029", edge: "#a77955", accent: "#d29a63", glow: "#e5774f" }),
  abyss: Object.freeze({ shadow: "#071115", mass: "#172a30", edge: "#547c83", accent: "#91afb0", glow: "#66bdc2" }),
  lateMachine: Object.freeze({ shadow: "#091315", mass: "#203335", edge: "#6f9994", accent: "#b4c7a4", glow: "#e2bb70" }),
});

const baseScenes = ZONES.map((zone, index) => Object.freeze({
  id: `scene_${String(index + 1).padStart(2, "0")}`,
  zoneId: zone.id,
  bounds: zone.bounds,
}));
export const PASS27_SCENES = Object.freeze([
  ...baseScenes,
  Object.freeze({ id: "scene_11", zoneId: PASS18_ZONE.id, bounds: PASS18_ZONE.bounds }),
  Object.freeze({ id: "scene_12", zoneId: PASS20_ZONE.id, bounds: PASS20_ZONE.bounds }),
  Object.freeze({ id: "scene_13", zoneId: PASS22_ZONE.id, bounds: PASS22_ZONE.bounds }),
  Object.freeze({ id: "scene_14", zoneId: PASS23_ZONE.id, bounds: PASS23_ZONE.bounds }),
]);

export const PASS27_STRUCTURES = Object.freeze([
  structure("start_ruined_gate", "scene_01", "portal", 180, 420, 980, 1280, "verdigris", 0.72),
  structure("start_buried_viaduct", "scene_01", "aqueduct", 1380, 560, 1680, 1180, "verdigris", 0.54),
  structure("climb_west_tower", "scene_02", "tower", 2380, 1320, 940, 2120, "abyss", 0.76),
  structure("climb_east_tower", "scene_02", "tower", 3540, 1420, 1040, 2020, "abyss", 0.72),
  structure("buried_crown_frame", "scene_03", "crown", 5720, 820, 3460, 2460, "buriedGold", 0.48),
  structure("compressed_aqueduct", "scene_04", "aqueduct", 10120, 2380, 3380, 1540, "buriedGold", 0.68),
  structure("foundry_entry_press", "scene_05", "foundry_press", 13240, 1900, 2600, 2640, "foundry", 0.78),
  structure("foundry_core_furnace", "scene_05", "furnace", 15860, 2080, 3000, 2400, "foundry", 0.82),
  structure("foundry_great_gear", "scene_05", "gear", 19000, 1940, 2440, 2440, "foundry", 0.70),
  structure("foundry_split_gate", "scene_05", "portal", 22020, 2260, 2640, 2180, "foundry", 0.74),
  structure("curve_outer_aqueduct", "scene_06", "aqueduct", 21800, 3260, 3500, 2120, "verdigris", 0.62),
  structure("curve_return_truss", "scene_06", "truss", 14800, 3460, 4620, 1820, "verdigris", 0.58),
  structure("precision_hanging_gallery", "scene_07", "gallery", 9340, 4220, 5620, 1560, "buriedGold", 0.70),
  structure("siege_hall_press", "scene_08", "foundry_press", 15100, 3860, 3900, 2200, "foundry", 0.76),
  structure("siege_cannon_spine", "scene_08", "truss", 19940, 3900, 4300, 2140, "foundry", 0.66),
  structure("descent_east_spine", "scene_09", "descent_spine", 22100, 5480, 1880, 3500, "abyss", 0.82),
  structure("descent_center_spine", "scene_09", "descent_spine", 17040, 5920, 1760, 3160, "abyss", 0.78),
  structure("descent_west_spine", "scene_09", "descent_spine", 11020, 5800, 1860, 3060, "abyss", 0.74),
  structure("descent_buried_rotor", "scene_09", "gear", 4440, 5940, 2680, 2680, "abyss", 0.56),
  structure("bridge_entry_pylon", "scene_10", "bridge_pylon", 18520, 8500, 1760, 1240, "buriedGold", 0.76),
  structure("bridge_mid_pylon", "scene_10", "bridge_pylon", 21600, 8560, 1800, 1180, "buriedGold", 0.72),
  structure("bridge_exit_pylon", "scene_10", "bridge_pylon", 24400, 8660, 1420, 1080, "buriedGold", 0.78),
  structure("grotto_buried_vault", "scene_11", "gallery", 25240, 9040, 4540, 1820, "abyss", 0.64),
  structure("spring_launch_frame", "scene_12", "spring_frame", 29500, 9920, 2100, 1760, "lateMachine", 0.78),
  structure("spring_landing_frame", "scene_12", "spring_frame", 31620, 10000, 2440, 1700, "lateMachine", 0.72),
  structure("recovery_shaft_cage", "scene_13", "truss", 29000, 10740, 4980, 1360, "lateMachine", 0.72),
  structure("gauntlet_machine_nave", "scene_14", "truss", 25700, 11220, 3820, 900, "lateMachine", 0.76),
  structure("gauntlet_exit_gate", "scene_14", "portal", 23820, 11220, 1480, 900, "lateMachine", 0.82),
]);

export const PASS27_STRUCTURE_PLAN = Object.freeze({
  id: "pass27_monumental_structure_graphics",
  referenceIntent: "single_buried_megastructure_across_the_full_descent",
  scenes: PASS27_SCENES,
  structures: PASS27_STRUCTURES,
  layers: Object.freeze(["deep_mass", "structural_frame", "mechanical_landmark", "route_framing"]),
  collisionChanges: 0,
});

const inWorld = item => item.x >= 0 && item.y >= 0 && item.x + item.width <= WORLD.width && item.y + item.height <= WORLD.height;
const overlapsScene = item => {
  const scene = PASS27_SCENES.find(candidate => candidate.id === item.sceneId);
  if (!scene) return false;
  const a = item;
  const b = scene.bounds;
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
};

export function validatePass27Structures() {
  const ids = PASS27_STRUCTURES.map(item => item.id);
  const sceneIds = PASS27_SCENES.map(item => item.id);
  const kinds = new Set(PASS27_STRUCTURES.map(item => item.kind));
  const paletteKeys = new Set(Object.keys(PASS27_PALETTES));
  const checks = [
    { id: "fourteen_scenes", passed: PASS27_SCENES.length === 14 },
    { id: "scene_ids_unique", passed: new Set(sceneIds).size === 14 },
    { id: "ten_blueprint_scenes", passed: PASS27_SCENES.slice(0, 10).every((item, index) => item.zoneId === ZONES[index].id) },
    { id: "four_extension_scenes", passed: PASS27_SCENES.slice(10).map(item => item.zoneId).join(",") === [PASS18_ZONE.id, PASS20_ZONE.id, PASS22_ZONE.id, PASS23_ZONE.id].join(",") },
    { id: "twenty_eight_structures", passed: PASS27_STRUCTURES.length === 28 },
    { id: "structure_ids_unique", passed: new Set(ids).size === ids.length },
    { id: "all_scenes_covered", passed: PASS27_SCENES.every(scene => PASS27_STRUCTURES.some(item => item.sceneId === scene.id)) },
    { id: "structure_scene_refs", passed: PASS27_STRUCTURES.every(item => sceneIds.includes(item.sceneId)) },
    { id: "structure_scene_overlap", passed: PASS27_STRUCTURES.every(overlapsScene) },
    { id: "structures_in_world", passed: PASS27_STRUCTURES.every(inWorld) },
    { id: "monumental_width", passed: PASS27_STRUCTURES.every(item => item.width >= 900) },
    { id: "monumental_height", passed: PASS27_STRUCTURES.every(item => item.height >= 900) },
    { id: "at_least_ten_structure_kinds", passed: kinds.size >= 10 },
    { id: "five_palettes", passed: Object.keys(PASS27_PALETTES).length === 5 },
    { id: "palette_references", passed: PASS27_STRUCTURES.every(item => paletteKeys.has(item.palette)) },
    { id: "palette_colors", passed: Object.values(PASS27_PALETTES).every(palette => Object.values(palette).every(color => /^#[0-9a-f]{6}$/i.test(color))) },
    { id: "depth_range", passed: PASS27_STRUCTURES.every(item => item.depth >= 0.45 && item.depth <= 0.85) },
    { id: "all_visual_only", passed: PASS27_STRUCTURES.every(item => item.visualOnly) },
    { id: "zero_collision_changes", passed: PASS27_STRUCTURE_PLAN.collisionChanges === 0 },
    { id: "four_visual_layers", passed: PASS27_STRUCTURE_PLAN.layers.length === 4 },
    { id: "deep_mass_first", passed: PASS27_STRUCTURE_PLAN.layers[0] === "deep_mass" },
    { id: "route_framing_last", passed: PASS27_STRUCTURE_PLAN.layers.at(-1) === "route_framing" },
    { id: "two_start_landmarks", passed: PASS27_STRUCTURES.filter(item => item.sceneId === "scene_01").length === 2 },
    { id: "two_climb_towers", passed: PASS27_STRUCTURES.filter(item => item.sceneId === "scene_02" && item.kind === "tower").length === 2 },
    { id: "buried_crown_retained", passed: PASS27_STRUCTURES.some(item => item.id === "buried_crown_frame" && item.depth < 0.5) },
    { id: "four_foundry_landmarks", passed: PASS27_STRUCTURES.filter(item => item.sceneId === "scene_05").length === 4 },
    { id: "foundry_mechanical_variety", passed: ["foundry_press", "furnace", "gear", "portal"].every(kind => PASS27_STRUCTURES.some(item => item.sceneId === "scene_05" && item.kind === kind)) },
    { id: "curve_two_landmarks", passed: PASS27_STRUCTURES.filter(item => item.sceneId === "scene_06").length === 2 },
    { id: "three_descent_spines", passed: PASS27_STRUCTURES.filter(item => item.kind === "descent_spine").length === 3 },
    { id: "descent_rotor", passed: PASS27_STRUCTURES.some(item => item.id === "descent_buried_rotor" && item.width >= 2600) },
    { id: "three_bridge_pylons", passed: PASS27_STRUCTURES.filter(item => item.kind === "bridge_pylon").length === 3 },
    { id: "two_spring_frames", passed: PASS27_STRUCTURES.filter(item => item.kind === "spring_frame").length === 2 },
    { id: "late_scene_coverage", passed: ["scene_11", "scene_12", "scene_13", "scene_14"].every(sceneId => PASS27_STRUCTURES.some(item => item.sceneId === sceneId)) },
    { id: "reference_intent", passed: PASS27_STRUCTURE_PLAN.referenceIntent === "single_buried_megastructure_across_the_full_descent" },
    { id: "scene_bounds_reference", passed: PASS27_SCENES.slice(0, 10).every((scene, index) => scene.bounds === ZONES[index].bounds) },
    { id: "largest_structure", passed: Math.max(...PASS27_STRUCTURES.map(item => item.width)) >= 4900 },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    kindCount: kinds.size,
    checks: Object.freeze(checks),
  });
}
