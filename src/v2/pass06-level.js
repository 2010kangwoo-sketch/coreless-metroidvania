import { WORLD, ZONES } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS05_LEVEL, PASS05_ZONE } from "./pass05-level.js";

const floor = (id, x1, y1, x2, y2) => Object.freeze({ id, x1, y1, x2, y2, zone: 5 });
const rect = (id, x, y, width, height, role, shape = role) => Object.freeze({ id, x, y, width, height, role, shape });
const segment = (x1, y1, x2, y2) => Object.freeze({ x1, y1, x2, y2 });
const frame = (x, y, width, height, kind) => Object.freeze({ x, y, width, height, kind });
const point = (x, y) => Object.freeze({ x, y });

export const PASS06_ZONE = Object.freeze({
  id: "pass06_destruction_maze_foundation",
  entry: Object.freeze({ x: 13400, y: 3700 }),
  exit: Object.freeze({ x: 24800, y: 4400 }),
  floors: Object.freeze([
    floor("maze_entry_rise", 13650, 3700, 14200, 3500),
    floor("western_hall", 14200, 3500, 14900, 3500),
    floor("first_sink", 14900, 3500, 15600, 3900),
    floor("lower_hall", 15600, 3900, 16300, 3900),
    floor("first_rise", 16300, 3900, 17100, 3250),
    floor("western_ridge", 17100, 3250, 17900, 3250),
    floor("middle_descent", 17900, 3250, 18700, 3700),
    floor("middle_hall", 18700, 3700, 19500, 3700),
    floor("second_rise", 19500, 3700, 20400, 3100),
    floor("high_gallery", 20400, 3100, 21200, 3100),
    floor("eastern_descent", 21200, 3100, 22000, 3650),
    floor("eastern_hall", 22000, 3650, 22800, 3650),
    floor("final_rise", 22800, 3650, 23600, 3300),
    floor("eastern_ridge", 23600, 3300, 24200, 3300),
    floor("exit_drop", 24200, 3300, 24800, 4400),
    floor("zone05_exit", 24800, 4400, 25100, 4400),
  ]),
  breakables: Object.freeze([
    rect("west_braced_gate", 14700, 3320, 52, 180, "dash_gate", "cross_brace"),
    rect("middle_lattice_gate", 19300, 3520, 52, 180, "dash_gate", "lattice"),
    rect("east_split_gate", 23750, 3120, 52, 180, "dash_gate", "split_pillar"),
  ]),
  collapseCorridor: Object.freeze({
    width: 360,
    activeBoulder: false,
    points: Object.freeze([
      point(13400, 3900), point(14800, 4050), point(16100, 4300),
      point(17500, 3850), point(19000, 4200), point(20500, 3650),
      point(22000, 4150), point(23400, 3800), point(24400, 4050),
      point(24800, 4400),
    ]),
  }),
  corridorSupports: Object.freeze([
    rect("support_west_a", 15100, 3880, 90, 420, "boulder_support", "fork"),
    rect("support_west_b", 16600, 3780, 120, 500, "boulder_support", "arch"),
    rect("support_mid_a", 18150, 3700, 80, 510, "boulder_support", "column"),
    rect("support_mid_b", 19800, 3520, 130, 500, "boulder_support", "truss"),
    rect("support_east_a", 21400, 3600, 90, 520, "boulder_support", "fork"),
    rect("support_east_b", 22900, 3450, 120, 500, "boulder_support", "arch"),
    rect("support_exit", 24100, 3700, 100, 470, "boulder_support", "split"),
  ]),
  roof: Object.freeze([
    segment(13400, 3340, 14500, 3000),
    segment(14500, 3000, 15800, 3300),
    segment(15800, 3300, 17100, 2700),
    segment(17100, 2700, 18500, 3000),
    segment(18500, 3000, 20000, 2500),
    segment(20000, 2500, 21400, 2650),
    segment(21400, 2650, 22800, 3000),
    segment(22800, 3000, 24000, 2850),
    segment(24000, 2850, 24800, 3950),
    segment(24800, 3950, 25100, 4100),
  ]),
  frames: Object.freeze([
    frame(13500, 3180, 1450, 700, "west_vault"),
    frame(14900, 3220, 1500, 900, "first_sink_frame"),
    frame(16300, 2780, 1700, 900, "west_rise_frame"),
    frame(18000, 2920, 1700, 1000, "middle_hall_frame"),
    frame(19700, 2580, 1700, 850, "high_gallery_frame"),
    frame(21400, 2850, 1700, 1050, "east_hall_frame"),
    frame(23100, 3000, 1150, 700, "east_ridge_frame"),
    frame(24200, 3300, 900, 1250, "exit_drop_frame"),
  ]),
  milestones: Object.freeze({
    enteredX: 13650,
    westGateX: 14700,
    lowerHallX: 15600,
    middleGateX: 19300,
    highGalleryX: 20400,
    eastGateX: 23750,
    completionX: 24800,
    completionY: 4350,
  }),
});

export const PASS06_LEVEL = Object.freeze({
  id: "pass06_playable_zones_01_05",
  bounds: Object.freeze({ x: 0, y: 300, width: 25200, height: 4700 }),
  cameraBounds: Object.freeze({ x: 0, y: 300, width: 25200, height: 4700 }),
  spawn: PASS05_LEVEL.spawn,
  zone01Exit: PASS05_LEVEL.zone01Exit,
  zone02Exit: PASS05_LEVEL.zone02Exit,
  zone03Exit: PASS05_LEVEL.zone03Exit,
  zone04Exit: PASS05_LEVEL.exit,
  exit: PASS06_ZONE.exit,
  floors: Object.freeze([...PASS05_LEVEL.floors, ...PASS06_ZONE.floors]),
  solids: PASS05_LEVEL.solids,
  gates: PASS05_LEVEL.gates,
  roof: PASS05_LEVEL.roof,
  frames: PASS05_LEVEL.frames,
  zone04Roof: PASS05_LEVEL.zone04Roof,
  zone04Frames: PASS05_LEVEL.zone04Frames,
  movingPlatforms: PASS05_LEVEL.movingPlatforms,
  zone05Roof: PASS06_ZONE.roof,
  zone05Frames: PASS06_ZONE.frames,
  breakables: PASS06_ZONE.breakables,
  collapseCorridor: PASS06_ZONE.collapseCorridor,
  corridorSupports: PASS06_ZONE.corridorSupports,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
const floorInBounds = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height;
const rectInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x + item.width <= bounds.x + bounds.width && item.y + item.height <= bounds.y + bounds.height;

export function validatePass06Level() {
  const level = PASS06_LEVEL;
  const zone = PASS06_ZONE;
  const jumpRise = (PLAYER_PHYSICS.jumpSpeed ** 2) / (2 * PLAYER_PHYSICS.gravity);
  const gateXs = zone.breakables.map(item => item.x);
  const checks = [
    { id: "combined_level_in_world", passed: pointInWorld(level.bounds) && pointInWorld({ x: level.bounds.x + level.bounds.width, y: level.bounds.y + level.bounds.height }) },
    { id: "camera_matches_level", passed: level.cameraBounds.width === level.bounds.width && level.cameraBounds.height === level.bounds.height },
    { id: "zone05_entry_matches_blueprint", passed: zone.entry.x === ZONES[4].entry.x && zone.entry.y === ZONES[4].entry.y },
    { id: "zone05_entry_matches_pass05", passed: zone.entry.x === PASS05_ZONE.exit.x && zone.entry.y === PASS05_ZONE.exit.y },
    { id: "zone05_exit_matches_blueprint", passed: zone.exit.x === ZONES[4].exit.x && zone.exit.y === ZONES[4].exit.y },
    { id: "zone05_exit_lower", passed: zone.exit.y > zone.entry.y },
    { id: "zone05_floor_count", passed: zone.floors.length === 16 },
    { id: "combined_floor_count", passed: level.floors.length === PASS05_LEVEL.floors.length + zone.floors.length },
    { id: "floors_ordered", passed: zone.floors.every(item => item.x2 > item.x1) },
    { id: "floors_in_bounds", passed: level.floors.every(item => floorInBounds(item, level.bounds)) },
    { id: "single_forward_route", passed: zone.floors.every((item, index) => index === 0 || item.x1 === zone.floors[index - 1].x2) },
    { id: "three_dash_gates", passed: zone.breakables.length === 3 && zone.breakables.every(item => item.role === "dash_gate") },
    { id: "gate_shapes_distinct", passed: new Set(zone.breakables.map(item => item.shape)).size === 3 },
    { id: "gates_ordered", passed: gateXs.every((x, index) => index === 0 || x > gateXs[index - 1]) },
    { id: "gates_in_bounds", passed: zone.breakables.every(item => rectInBounds(item, level.bounds)) },
    { id: "gates_exceed_normal_jump", passed: zone.breakables.every(item => item.height > jumpRise + PLAYER_PHYSICS.height) },
    { id: "collapse_corridor_inactive", passed: zone.collapseCorridor.activeBoulder === false },
    { id: "collapse_corridor_width", passed: zone.collapseCorridor.width >= 320 },
    { id: "collapse_corridor_points", passed: zone.collapseCorridor.points.length === 10 && zone.collapseCorridor.points.every(pointInWorld) },
    { id: "collapse_corridor_forward", passed: zone.collapseCorridor.points.every((item, index) => index === 0 || item.x > zone.collapseCorridor.points[index - 1].x) },
    { id: "corridor_same_structure", passed: zone.collapseCorridor.points[0].x === zone.entry.x && zone.collapseCorridor.points.at(-1).x === zone.exit.x },
    { id: "seven_corridor_supports", passed: zone.corridorSupports.length === 7 },
    { id: "supports_in_bounds", passed: zone.corridorSupports.every(item => rectInBounds(item, level.bounds)) },
    { id: "roof_continuity", passed: zone.roof.every((item, index) => index === 0 || item.x1 === zone.roof[index - 1].x2 && item.y1 === zone.roof[index - 1].y2) },
    { id: "roof_span", passed: zone.roof[0].x1 === zone.entry.x && zone.roof.at(-1).x2 >= zone.exit.x },
    { id: "eight_architecture_frames", passed: zone.frames.length === 8 && zone.frames.every(item => rectInBounds(item, level.bounds)) },
    { id: "milestone_order", passed: Object.values(zone.milestones).slice(0, 7).every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "pass05_geometry_retained", passed: level.roof === PASS05_LEVEL.roof && level.zone04Roof === PASS05_LEVEL.zone04Roof && level.movingPlatforms === PASS05_LEVEL.movingPlatforms && level.gates === PASS05_LEVEL.gates },
  ];

  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    jumpRise,
    checks: Object.freeze(checks),
  });
}
