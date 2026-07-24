import { WORLD, ZONES } from "./blueprint.js";
import { PASS04_ZONE } from "./pass04-level.js";

const freezeItems = items => Object.freeze(items.map(item => Object.freeze(item)));

const zone = ZONES[2];

export const PASS25_PALETTE = Object.freeze({
  void: "#071013",
  deepStone: "#10191a",
  buriedStone: "#1b2625",
  dressedStone: "#2b3430",
  bronze: "#5d5948",
  bronzeEdge: "#a8986d",
  coldEdge: "#75908a",
  routeLight: "#e3bb72",
  routeCore: "#fff0b0",
  moss: "#496756",
  dust: "#c8b98f",
});

export const PASS25_FAR_VAULTS = freezeItems(Array.from({ length: 13 }, (_, index) => ({
  id: `far_vault_${String(index + 1).padStart(2, "0")}`,
  x: 4240 + index * 560,
  y: 890 + (index % 3) * 90,
  width: 430 + (index % 2) * 70,
  height: 2120 - (index % 4) * 130,
  depth: 0.22 + (index % 3) * 0.06,
})));

export const PASS25_BUTTRESSES = freezeItems(Array.from({ length: 11 }, (_, index) => ({
  id: `buttress_${String(index + 1).padStart(2, "0")}`,
  x: 4520 + index * 610,
  y: 1040 + (index % 3) * 105,
  width: 108 + (index % 2) * 28,
  height: 1780 - (index % 4) * 120,
  cap: index % 3 === 0,
})));

export const PASS25_RIBS = freezeItems(PASS04_ZONE.roof.map((segment, index) => ({
  id: `ceiling_rib_${String(index + 1).padStart(2, "0")}`,
  x: segment.x1 + 130,
  y: segment.y1 + 58,
  width: Math.max(280, segment.x2 - segment.x1 - 220),
  drop: 180 + (index % 3) * 80,
  angle: Math.atan2(segment.y2 - segment.y1, segment.x2 - segment.x1),
})));

export const PASS25_CHAINS = freezeItems([
  { id: "chain_01", x: 4920, y: 1280, length: 720, links: 14 },
  { id: "chain_02", x: 5660, y: 1040, length: 510, links: 10 },
  { id: "chain_03", x: 6410, y: 930, length: 860, links: 17 },
  { id: "chain_04", x: 8470, y: 880, length: 590, links: 12 },
  { id: "chain_05", x: 9180, y: 1120, length: 780, links: 15 },
  { id: "chain_06", x: 10020, y: 1640, length: 560, links: 11 },
]);

export const PASS25_LIGHT_SHAFTS = freezeItems([
  { id: "shaft_entry", x: 4720, y: 840, topWidth: 88, bottomWidth: 510, height: 2230, alpha: 0.12 },
  { id: "shaft_lower", x: 5750, y: 720, topWidth: 130, bottomWidth: 720, height: 1840, alpha: 0.15 },
  { id: "shaft_atrium", x: 7540, y: 590, topWidth: 210, bottomWidth: 980, height: 1510, alpha: 0.20 },
  { id: "shaft_gallery", x: 8290, y: 720, topWidth: 105, bottomWidth: 520, height: 970, alpha: 0.14 },
  { id: "shaft_exit", x: 10010, y: 1510, topWidth: 90, bottomWidth: 490, height: 1680, alpha: 0.13 },
]);

export const PASS25_ROUTE_LANTERNS = freezeItems([
  { id: "lantern_entry", x: 4840, y: 2910, radius: 190, role: "entry" },
  { id: "lantern_lower", x: 5790, y: 2420, radius: 175, role: "route" },
  { id: "lantern_atrium", x: 7450, y: 1910, radius: 210, role: "route" },
  { id: "lantern_apex", x: 8210, y: 1460, radius: 230, role: "apex" },
  { id: "lantern_descent", x: 9160, y: 1910, radius: 190, role: "route" },
  { id: "lantern_exit", x: 10260, y: 3110, radius: 210, role: "exit" },
]);

export const PASS25_SURFACE_MARKS = freezeItems(PASS04_ZONE.floors.flatMap((floor, floorIndex) => {
  const length = Math.hypot(floor.x2 - floor.x1, floor.y2 - floor.y1);
  const count = Math.max(2, Math.floor(length / 135));
  return Array.from({ length: count }, (_, index) => {
    const ratio = (index + 0.65) / (count + 0.3);
    return {
      id: `surface_${String(floorIndex + 1).padStart(2, "0")}_${String(index + 1).padStart(2, "0")}`,
      x: floor.x1 + (floor.x2 - floor.x1) * ratio,
      y: floor.y1 + (floor.y2 - floor.y1) * ratio,
      length: 35 + ((floorIndex * 13 + index * 17) % 54),
      moss: (floorIndex + index) % 3 === 0,
    };
  });
}));

export const PASS25_DUST = freezeItems(Array.from({ length: 72 }, (_, index) => ({
  id: `dust_${String(index + 1).padStart(2, "0")}`,
  x: zone.bounds.x + 80 + ((index * 887) % (zone.bounds.width - 160)),
  y: zone.bounds.y + 110 + ((index * 421) % (zone.bounds.height - 260)),
  radius: 1 + (index % 3),
  drift: 0.18 + (index % 5) * 0.07,
  phase: (index * 0.73) % (Math.PI * 2),
})));

export const PASS25_FOREGROUND = freezeItems([
  { id: "foreground_entry", x: 4380, y: 2380, width: 150, height: 850, side: "left" },
  { id: "foreground_atrium_left", x: 7040, y: 900, width: 120, height: 930, side: "left" },
  { id: "foreground_atrium_right", x: 8660, y: 920, width: 135, height: 780, side: "right" },
  { id: "foreground_exit", x: 10530, y: 2460, width: 170, height: 980, side: "right" },
]);

export const PASS25_VISUAL_SLICE = Object.freeze({
  id: "pass25_buried_mega_room_visual_slice",
  zoneId: zone.id,
  bounds: zone.bounds,
  referenceIntent: "dark_mechanical_ruin_mountain_burial",
  layers: Object.freeze([
    "far_vault_silhouette",
    "monumental_mechanism",
    "buried_architecture",
    "volumetric_route_light",
    "material_surface",
    "animated_atmosphere",
    "foreground_occlusion",
  ]),
  monument: Object.freeze({ id: "atrium_seal", x: 7590, y: 1430, outerRadius: 610, innerRadius: 390, spokes: 12 }),
  palette: PASS25_PALETTE,
  farVaults: PASS25_FAR_VAULTS,
  buttresses: PASS25_BUTTRESSES,
  ribs: PASS25_RIBS,
  chains: PASS25_CHAINS,
  lightShafts: PASS25_LIGHT_SHAFTS,
  routeLanterns: PASS25_ROUTE_LANTERNS,
  surfaceMarks: PASS25_SURFACE_MARKS,
  dust: PASS25_DUST,
  foreground: PASS25_FOREGROUND,
  collisionChanges: 0,
});

const inBounds = item => item.x >= zone.bounds.x && item.y >= zone.bounds.y && item.x <= zone.bounds.x + zone.bounds.width && item.y <= zone.bounds.y + zone.bounds.height;

export function validatePass25Visuals() {
  const allIds = [
    ...PASS25_FAR_VAULTS, ...PASS25_BUTTRESSES, ...PASS25_RIBS, ...PASS25_CHAINS,
    ...PASS25_LIGHT_SHAFTS, ...PASS25_ROUTE_LANTERNS, ...PASS25_SURFACE_MARKS,
    ...PASS25_DUST, ...PASS25_FOREGROUND,
  ].map(item => item.id);
  const checks = [
    { id: "correct_zone", passed: PASS25_VISUAL_SLICE.zoneId === "buried_rise_structure" },
    { id: "blueprint_bounds_reference", passed: PASS25_VISUAL_SLICE.bounds === zone.bounds },
    { id: "seven_depth_layers", passed: PASS25_VISUAL_SLICE.layers.length === 7 },
    { id: "foreground_last", passed: PASS25_VISUAL_SLICE.layers.at(-1) === "foreground_occlusion" },
    { id: "thirteen_far_vaults", passed: PASS25_FAR_VAULTS.length === 13 },
    { id: "eleven_buttresses", passed: PASS25_BUTTRESSES.length === 11 },
    { id: "roof_rib_coverage", passed: PASS25_RIBS.length === PASS04_ZONE.roof.length },
    { id: "six_chains", passed: PASS25_CHAINS.length === 6 },
    { id: "five_light_shafts", passed: PASS25_LIGHT_SHAFTS.length === 5 },
    { id: "six_route_lanterns", passed: PASS25_ROUTE_LANTERNS.length === 6 },
    { id: "entry_exit_lanterns", passed: PASS25_ROUTE_LANTERNS[0].role === "entry" && PASS25_ROUTE_LANTERNS.at(-1).role === "exit" },
    { id: "dense_surface_marks", passed: PASS25_SURFACE_MARKS.length >= 30 },
    { id: "seventy_two_dust_motes", passed: PASS25_DUST.length === 72 },
    { id: "four_foreground_occluders", passed: PASS25_FOREGROUND.length === 4 },
    { id: "monumental_scale", passed: PASS25_VISUAL_SLICE.monument.outerRadius >= 600 },
    { id: "twelve_spoke_seal", passed: PASS25_VISUAL_SLICE.monument.spokes === 12 },
    { id: "warm_route_light", passed: PASS25_PALETTE.routeLight === "#e3bb72" },
    { id: "dark_void", passed: PASS25_PALETTE.void === "#071013" },
    { id: "all_ids_unique", passed: new Set(allIds).size === allIds.length },
    { id: "dust_inside_zone", passed: PASS25_DUST.every(inBounds) },
    { id: "lanterns_inside_zone", passed: PASS25_ROUTE_LANTERNS.every(inBounds) },
    { id: "surface_inside_world", passed: PASS25_SURFACE_MARKS.every(item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height) },
    { id: "positive_vault_dimensions", passed: PASS25_FAR_VAULTS.every(item => item.width > 0 && item.height > 0) },
    { id: "positive_buttress_dimensions", passed: PASS25_BUTTRESSES.every(item => item.width > 0 && item.height > 0) },
    { id: "chain_link_density", passed: PASS25_CHAINS.every(item => item.links >= 10) },
    { id: "shaft_shape", passed: PASS25_LIGHT_SHAFTS.every(item => item.bottomWidth > item.topWidth && item.height > 900) },
    { id: "route_light_scale", passed: PASS25_ROUTE_LANTERNS.every(item => item.radius >= 170 && item.radius <= 230) },
    { id: "visual_only", passed: PASS25_VISUAL_SLICE.collisionChanges === 0 },
    { id: "reference_intent", passed: PASS25_VISUAL_SLICE.referenceIntent === "dark_mechanical_ruin_mountain_burial" },
    { id: "single_forward_route_retained", passed: PASS04_ZONE.floors.every((item, index, items) => index === 0 || item.x1 >= items[index - 1].x2) },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    checks: Object.freeze(checks),
  });
}
