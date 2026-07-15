import { WORLD, ZONES } from "./blueprint.js";

const theme = (zoneId, index, colors, motif) => Object.freeze({
  zoneId,
  index,
  motif,
  background: colors[0],
  midground: colors[1],
  terrain: colors[2],
  edge: colors[3],
  light: colors[4],
});

export const PASS16_THEMES = Object.freeze([
  theme("start_slope", 1, ["#0b2024", "#14343a", "#203f40", "#94beb1", "#d7c479"], "ruined_gate"),
  theme("double_wall_climb", 2, ["#0b1c22", "#183038", "#263c40", "#a7c1b8", "#d9bc73"], "vertical_well"),
  theme("buried_rise_structure", 3, ["#141d20", "#282e2f", "#343b3b", "#c1b58f", "#ddb878"], "buried_arches"),
  theme("uneven_tunnel", 4, ["#171c1e", "#2b2e2f", "#373a3a", "#c8ad82", "#e0a96f"], "compressed_tunnel"),
  theme("destruction_maze", 5, ["#1a1c1c", "#302d29", "#3c3934", "#d0a875", "#e28d61"], "fractured_foundry"),
  theme("dash_run", 6, ["#0c2023", "#17363a", "#294044", "#8fc5c2", "#76d1cc"], "giant_aqueduct"),
  theme("precision_parkour", 7, ["#171b1d", "#2d2e2d", "#393735", "#d0b27d", "#efba71"], "hanging_gallery"),
  theme("enemy_turret_hall", 8, ["#171a1d", "#302e2f", "#3e3937", "#d6b78a", "#e5a46c"], "siege_hall"),
  theme("long_descent_chase", 9, ["#0a1b20", "#143039", "#263b42", "#92c7c9", "#72d0d2"], "abyssal_descent"),
  theme("collapsing_bridge", 10, ["#1a1716", "#332923", "#49382d", "#d0a46b", "#f0c985"], "broken_bridge"),
]);

export const PASS16_LIGHTS = Object.freeze(ZONES.flatMap((zone, index) => {
  const themeItem = PASS16_THEMES[index];
  const y = Math.max(zone.bounds.y + 150, Math.min(zone.entry.y - 180, zone.bounds.y + zone.bounds.height - 180));
  return [0.28, 0.72].map((ratio, lightIndex) => Object.freeze({
    id: `route_light_${String(index + 1).padStart(2, "0")}_${lightIndex + 1}`,
    zoneId: zone.id,
    x: Math.round(zone.bounds.x + zone.bounds.width * ratio),
    y: y + lightIndex * 90,
    radius: 180 + (index % 3) * 35,
    color: themeItem.light,
  }));
}));

export const PASS16_VISUALS = Object.freeze({
  world: WORLD,
  themes: PASS16_THEMES,
  routeLights: PASS16_LIGHTS,
  collisionDebugVisible: false,
  layers: Object.freeze(["far_silhouette", "mid_architecture", "route_lights", "terrain_skin", "actors"]),
});

export function getPass16Theme(zoneIndex) {
  return PASS16_THEMES[Math.max(0, Math.min(PASS16_THEMES.length - 1, zoneIndex - 1))];
}

export function validatePass16Visuals() {
  const zoneIds = new Set(ZONES.map(zone => zone.id));
  const themeIds = PASS16_THEMES.map(item => item.zoneId);
  const lightsByZone = new Map(ZONES.map(zone => [zone.id, PASS16_LIGHTS.filter(light => light.zoneId === zone.id)]));
  const checks = [
    { id: "ten_zone_themes", passed: PASS16_THEMES.length === 10 },
    { id: "theme_ids_unique", passed: new Set(themeIds).size === 10 },
    { id: "theme_matches_blueprint", passed: ZONES.every((zone, index) => themeIds[index] === zone.id) },
    { id: "five_visual_layers", passed: PASS16_VISUALS.layers.length === 5 },
    { id: "collision_debug_hidden", passed: PASS16_VISUALS.collisionDebugVisible === false },
    { id: "two_lights_per_zone", passed: [...lightsByZone.values()].every(items => items.length === 2) },
    { id: "twenty_route_lights", passed: PASS16_LIGHTS.length === 20 },
    { id: "light_ids_unique", passed: new Set(PASS16_LIGHTS.map(light => light.id)).size === 20 },
    { id: "light_zone_refs", passed: PASS16_LIGHTS.every(light => zoneIds.has(light.zoneId)) },
    { id: "lights_in_world", passed: PASS16_LIGHTS.every(light => light.x >= 0 && light.y >= 0 && light.x <= WORLD.width && light.y <= WORLD.height) },
    { id: "theme_backgrounds", passed: PASS16_THEMES.every(item => /^#[0-9a-f]{6}$/i.test(item.background)) },
    { id: "theme_midgrounds", passed: PASS16_THEMES.every(item => /^#[0-9a-f]{6}$/i.test(item.midground)) },
    { id: "theme_terrain", passed: PASS16_THEMES.every(item => /^#[0-9a-f]{6}$/i.test(item.terrain)) },
    { id: "theme_edges", passed: PASS16_THEMES.every(item => /^#[0-9a-f]{6}$/i.test(item.edge)) },
    { id: "theme_lights", passed: PASS16_THEMES.every(item => /^#[0-9a-f]{6}$/i.test(item.light)) },
    { id: "motifs_unique", passed: new Set(PASS16_THEMES.map(item => item.motif)).size === 10 },
    { id: "theme_indices", passed: PASS16_THEMES.every((item, index) => item.index === index + 1) },
    { id: "light_radius", passed: PASS16_LIGHTS.every(light => light.radius >= 180 && light.radius <= 250) },
    { id: "world_reference", passed: PASS16_VISUALS.world === WORLD },
    { id: "actor_layer_last", passed: PASS16_VISUALS.layers.at(-1) === "actors" },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    checks: Object.freeze(checks),
  });
}
