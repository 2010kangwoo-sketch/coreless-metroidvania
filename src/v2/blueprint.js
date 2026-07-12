import { STAGE_SEQUENCE } from "./config.js";

export const WORLD = Object.freeze({
  width: 26000,
  height: 7800,
  cameraBounds: Object.freeze({ x: 0, y: 0, width: 26000, height: 7800 }),
});

const freezePoints = points => Object.freeze(
  points.map(([x, y]) => Object.freeze({ x, y })),
);

const zone = ({ id, name, bounds, entry, exit, route, direction }) => Object.freeze({
  id,
  name,
  bounds: Object.freeze(bounds),
  entry: Object.freeze({ x: entry[0], y: entry[1] }),
  exit: Object.freeze({ x: exit[0], y: exit[1] }),
  route: freezePoints(route),
  direction,
});

export const ZONES = Object.freeze([
  zone({
    id: "start_slope",
    name: "START SLOPE",
    bounds: { x: 0, y: 300, width: 3200, height: 1700 },
    entry: [600, 900],
    exit: [2800, 1700],
    route: [[600, 900], [1500, 1100], [2200, 1250], [2800, 1700]],
    direction: "right",
  }),
  zone({
    id: "double_wall_climb",
    name: "DOUBLE WALL CLIMB",
    bounds: { x: 2200, y: 1200, width: 2600, height: 2400 },
    entry: [2800, 1700],
    exit: [4400, 3100],
    route: [[2800, 1700], [2500, 2200], [2900, 2850], [3400, 2400], [3900, 3000], [4400, 3100]],
    direction: "down",
  }),
  zone({
    id: "buried_rise_structure",
    name: "BURIED RISE STRUCTURE",
    bounds: { x: 4000, y: 800, width: 6900, height: 3000 },
    entry: [4400, 3100],
    exit: [10400, 3300],
    route: [[4400, 3100], [4900, 2700], [5200, 2100], [6000, 1500], [7000, 1900], [8200, 1400], [9400, 2100], [10400, 3300]],
    direction: "right",
  }),
  zone({
    id: "uneven_tunnel",
    name: "UNEVEN TUNNEL",
    bounds: { x: 9900, y: 2300, width: 3900, height: 1800 },
    entry: [10400, 3300],
    exit: [13400, 3700],
    route: [[10400, 3300], [11200, 3000], [11900, 3600], [12700, 3200], [13400, 3700]],
    direction: "right",
  }),
  zone({
    id: "destruction_maze",
    name: "DESTRUCTION MAZE",
    bounds: { x: 13000, y: 1800, width: 12500, height: 3000 },
    entry: [13400, 3700],
    exit: [24800, 4400],
    route: [[13400, 3700], [14500, 3300], [15800, 3900], [17200, 3200], [18800, 3700], [20500, 3100], [22200, 3600], [23800, 3300], [24800, 4400]],
    direction: "right",
  }),
  zone({
    id: "dash_run",
    name: "GIANT CURVE / DASH RUN",
    bounds: { x: 6000, y: 3000, width: 19500, height: 2500 },
    entry: [24800, 4400],
    exit: [9300, 5000],
    route: [[24800, 4400], [25400, 4700], [25000, 5200], [23500, 5400], [21000, 5100], [18000, 4800], [15000, 5200], [12000, 4700], [9300, 5000]],
    direction: "left",
  }),
  zone({
    id: "precision_parkour",
    name: "PRECISION PARKOUR",
    bounds: { x: 9000, y: 4200, width: 6500, height: 1700 },
    entry: [9300, 5000],
    exit: [15200, 5500],
    route: [[9300, 5000], [10200, 4700], [11100, 5200], [12000, 4600], [13000, 5400], [14000, 4900], [15200, 5500]],
    direction: "right",
  }),
  zone({
    id: "enemy_turret_hall",
    name: "ENEMY / TURRET HALL",
    bounds: { x: 14800, y: 3800, width: 10200, height: 2400 },
    entry: [15200, 5500],
    exit: [23600, 5900],
    route: [[15200, 5500], [16500, 5100], [17800, 5600], [19000, 5000], [20500, 5500], [22000, 5100], [23600, 5900]],
    direction: "right",
  }),
  zone({
    id: "long_descent_chase",
    name: "LONG DESCENT CHASE",
    bounds: { x: 1000, y: 5400, width: 24000, height: 2200 },
    entry: [23600, 5900],
    exit: [11800, 6900],
    route: [[23600, 5900], [24800, 6300], [24200, 6900], [22000, 7200], [19000, 6900], [16000, 7300], [12500, 6800], [9000, 7200], [5500, 6700], [2500, 7000], [5000, 7400], [8000, 7000], [11800, 6900]],
    direction: "left_then_right",
  }),
  zone({
    id: "collapsing_bridge",
    name: "COLLAPSING BRIDGE",
    bounds: { x: 11000, y: 6200, width: 15000, height: 1500 },
    entry: [11800, 6900],
    exit: [25200, 7400],
    route: [[11800, 6900], [14000, 7100], [16000, 6800], [18000, 7200], [20500, 7000], [22600, 7350], [25200, 7400]],
    direction: "right",
  }),
]);

export const PLAYER_ROUTE = Object.freeze(
  ZONES.flatMap((item, index) => index === 0 ? item.route : item.route.slice(1)),
);

export const BOULDER_ROUTE = freezePoints([
  [500, 850], [1700, 1100], [2800, 1700], [3200, 2700], [4400, 3100],
  [6500, 2500], [8400, 2000], [10400, 3300], [13400, 3700], [16500, 3600],
  [20500, 3400], [23800, 3600], [25000, 4500], [25200, 5150], [22000, 5250],
  [18000, 5000], [15000, 5300], [12000, 4950], [9300, 5000], [12000, 5300],
  [15200, 5500], [19000, 5350], [23600, 5900], [24700, 6450], [23500, 7100],
  [19000, 7050], [14000, 7100], [9000, 7200], [4000, 7100], [8000, 7200],
  [11800, 6900], [17000, 7100], [22000, 7200], [24700, 7550],
]);

const feature = (id, label, zoneId, bounds, pass) => Object.freeze({
  id,
  label,
  zoneId,
  pass,
  bounds: Object.freeze(bounds),
});

export const CHASE_FEATURES = Object.freeze([
  feature("buried_structure", "BURIED STRUCTURE", "destruction_maze", { x: 13600, y: 2450, width: 2300, height: 1500 }, 8),
  feature("spike_steps", "SPIKE STEPS", "destruction_maze", { x: 15800, y: 3450, width: 1800, height: 650 }, 8),
  feature("dash_gap", "JUMP + DASH", "destruction_maze", { x: 17700, y: 3000, width: 2100, height: 1050 }, 8),
  feature("giant_curve", "GIANT CURVE", "dash_run", { x: 23200, y: 4050, width: 2200, height: 1350 }, 8),
  feature("dual_grapple", "DUAL GRAPPLE", "dash_run", { x: 11900, y: 4350, width: 3000, height: 950 }, 8),
  feature("spike_ramp", "SPIKE RAMP", "precision_parkour", { x: 9300, y: 5050, width: 2600, height: 650 }, 8),
]);

const samePoint = (a, b) => a.x === b.x && a.y === b.y;
const pointInWorld = point => (
  point.x >= 0 && point.y >= 0 && point.x <= WORLD.width && point.y <= WORLD.height
);
const pointInBounds = (point, bounds) => (
  point.x >= bounds.x && point.y >= bounds.y &&
  point.x <= bounds.x + bounds.width && point.y <= bounds.y + bounds.height
);
const boundsInWorld = bounds => (
  bounds.x >= 0 && bounds.y >= 0 &&
  bounds.x + bounds.width <= WORLD.width &&
  bounds.y + bounds.height <= WORLD.height
);

export function validateBlueprint() {
  const connections = ZONES.slice(0, -1).every((item, index) => (
    samePoint(item.exit, ZONES[index + 1].entry)
  ));
  const routeJoins = ZONES.every(item => (
    samePoint(item.route[0], item.entry) &&
    samePoint(item.route[item.route.length - 1], item.exit)
  ));
  const zoneIds = ZONES.map(item => item.id);
  const checks = [
    { id: "world_width", passed: WORLD.width === 26000 },
    { id: "world_height", passed: WORLD.height === 7800 },
    { id: "camera_bounds", passed: boundsInWorld(WORLD.cameraBounds) && WORLD.cameraBounds.width === WORLD.width && WORLD.cameraBounds.height === WORLD.height },
    { id: "zone_count", passed: ZONES.length === 10 },
    { id: "zone_ids_unique", passed: new Set(zoneIds).size === ZONES.length },
    { id: "stage_order", passed: STAGE_SEQUENCE.every((id, index) => id === zoneIds[index]) },
    { id: "zone_bounds", passed: ZONES.every(item => boundsInWorld(item.bounds)) },
    { id: "entries_in_zone", passed: ZONES.every(item => pointInBounds(item.entry, item.bounds)) },
    { id: "exits_in_zone", passed: ZONES.every(item => pointInBounds(item.exit, item.bounds)) },
    { id: "exact_connections", passed: connections },
    { id: "macro_descent", passed: ZONES.every(item => item.exit.y > item.entry.y) },
    { id: "zone_route_joins", passed: routeJoins },
    { id: "player_route_world", passed: PLAYER_ROUTE.every(pointInWorld) },
    { id: "player_route_endpoints", passed: samePoint(PLAYER_ROUTE[0], ZONES[0].entry) && samePoint(PLAYER_ROUTE[PLAYER_ROUTE.length - 1], ZONES.at(-1).exit) },
    { id: "boulder_route_world", passed: BOULDER_ROUTE.every(pointInWorld) },
    { id: "chase_feature_count", passed: CHASE_FEATURES.length === 6 },
    { id: "chase_features_reserved_for_pass08", passed: CHASE_FEATURES.every(item => item.pass === 8 && zoneIds.includes(item.zoneId)) },
    { id: "chase_feature_bounds", passed: CHASE_FEATURES.every(item => boundsInWorld(item.bounds)) },
  ];

  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    checks: Object.freeze(checks),
  });
}
