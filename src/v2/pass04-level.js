import { WORLD, ZONES } from "./blueprint.js";
import { PASS03_LEVEL, PLAYER_PHYSICS } from "./pass03-level.js";

const floor = (id, x1, y1, x2, y2) => Object.freeze({
  id,
  x1,
  y1,
  x2,
  y2,
  zone: 3,
});

const segment = (x1, y1, x2, y2) => Object.freeze({ x1, y1, x2, y2 });
const frame = (x, y, width, height, kind) => Object.freeze({ x, y, width, height, kind });

export const PASS04_ZONE = Object.freeze({
  id: "pass04_buried_rise_structure",
  entry: Object.freeze({ x: 4400, y: 3100 }),
  exit: Object.freeze({ x: 10400, y: 3300 }),
  highestFloorY: 1600,
  floors: Object.freeze([
    floor("vault_entry", 4750, 3100, 5200, 3000),
    floor("lower_rise", 5200, 3000, 5750, 2550),
    floor("lower_balcony", 5750, 2550, 6150, 2550),
    floor("broken_step_landing", 6240, 2550, 6900, 2050),
    floor("middle_balcony", 6900, 2050, 7250, 2050),
    floor("atrium_landing", 7360, 2050, 8000, 1600),
    floor("upper_gallery", 8000, 1600, 8500, 1600),
    floor("upper_descent", 8500, 1600, 9000, 2050),
    floor("east_balcony", 9000, 2050, 9300, 2050),
    floor("inner_fall", 9300, 2050, 9700, 2700),
    floor("lower_gallery", 9700, 2700, 9950, 2700),
    floor("exit_descent", 9950, 2700, 10400, 3300),
    floor("zone03_exit", 10400, 3300, 10700, 3300),
  ]),
  gaps: Object.freeze([
    Object.freeze({ id: "lower_gap", fromX: 6150, toX: 6240, width: 90 }),
    Object.freeze({ id: "atrium_gap", fromX: 7250, toX: 7360, width: 110 }),
  ]),
  roof: Object.freeze([
    segment(4400, 2790, 5000, 2640),
    segment(5000, 2640, 5900, 1900),
    segment(5900, 1900, 7000, 1350),
    segment(7000, 1350, 8200, 1100),
    segment(8200, 1100, 9300, 1550),
    segment(9300, 1550, 10400, 2880),
    segment(10400, 2880, 10700, 3000),
  ]),
  frames: Object.freeze([
    frame(4770, 2690, 760, 430, "entry_vault"),
    frame(5570, 2040, 1180, 610, "lower_hall"),
    frame(6800, 1450, 1250, 660, "atrium"),
    frame(7950, 1200, 1050, 500, "upper_gallery"),
    frame(8950, 1750, 1050, 1050, "descent_hall"),
    frame(9880, 2600, 650, 780, "exit_vault"),
  ]),
  milestones: Object.freeze({
    enteredX: 4750,
    lowerRiseX: 6240,
    atriumX: 7360,
    upperGalleryX: 8000,
    descentX: 9000,
    completionX: 10400,
    completionY: 3250,
  }),
});

export const PASS04_LEVEL = Object.freeze({
  id: "pass04_playable_zones_01_03",
  bounds: Object.freeze({ x: 0, y: 300, width: 10800, height: 3500 }),
  cameraBounds: Object.freeze({ x: 0, y: 300, width: 10800, height: 3500 }),
  spawn: PASS03_LEVEL.spawn,
  zone01Exit: PASS03_LEVEL.zone01Exit,
  zone02Exit: PASS03_LEVEL.exit,
  exit: PASS04_ZONE.exit,
  floors: Object.freeze([...PASS03_LEVEL.floors, ...PASS04_ZONE.floors]),
  solids: PASS03_LEVEL.solids,
  gates: PASS03_LEVEL.gates,
  roof: PASS04_ZONE.roof,
  frames: PASS04_ZONE.frames,
});

const pointInWorld = point => (
  point.x >= 0 && point.y >= 0 && point.x <= WORLD.width && point.y <= WORLD.height
);
const floorInBounds = (item, bounds) => (
  item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width &&
  item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height &&
  item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height
);
const frameInBounds = (item, bounds) => (
  item.x >= bounds.x && item.y >= bounds.y &&
  item.x + item.width <= bounds.x + bounds.width &&
  item.y + item.height <= bounds.y + bounds.height
);

export function validatePass04Level() {
  const level = PASS04_LEVEL;
  const zone = PASS04_ZONE;
  const zone03Floors = zone.floors;
  const highestFloor = Math.min(...zone03Floors.flatMap(item => [item.y1, item.y2]));
  const lowestRoof = Math.min(...zone.roof.flatMap(item => [item.y1, item.y2]));
  const checks = [
    { id: "combined_level_in_world", passed: pointInWorld({ x: level.bounds.x, y: level.bounds.y }) && pointInWorld({ x: level.bounds.x + level.bounds.width, y: level.bounds.y + level.bounds.height }) },
    { id: "camera_matches_level", passed: level.cameraBounds.width === level.bounds.width && level.cameraBounds.height === level.bounds.height },
    { id: "zone03_entry_matches_blueprint", passed: zone.entry.x === ZONES[2].entry.x && zone.entry.y === ZONES[2].entry.y },
    { id: "zone03_exit_matches_blueprint", passed: zone.exit.x === ZONES[2].exit.x && zone.exit.y === ZONES[2].exit.y },
    { id: "zone03_exit_lower", passed: zone.exit.y > zone.entry.y },
    { id: "combined_floor_count", passed: level.floors.length === PASS03_LEVEL.floors.length + 13 },
    { id: "zone03_floor_count", passed: zone03Floors.length === 13 },
    { id: "floors_ordered", passed: level.floors.every(item => item.x2 > item.x1) },
    { id: "floors_in_bounds", passed: level.floors.every(item => floorInBounds(item, level.bounds)) },
    { id: "zone03_single_forward_route", passed: zone03Floors.every((item, index) => index === 0 || item.x1 >= zone03Floors[index - 1].x2) },
    { id: "two_jump_gaps", passed: zone.gaps.length === 2 },
    { id: "gap_widths", passed: zone.gaps.every(item => item.width >= PLAYER_PHYSICS.width * 2 && item.width <= PLAYER_PHYSICS.dashSpeed * PLAYER_PHYSICS.dashFrames) },
    { id: "rise_height", passed: zone.entry.y - highestFloor >= 1400 },
    { id: "highest_floor_recorded", passed: highestFloor === zone.highestFloorY },
    { id: "buried_below_roof", passed: highestFloor - lowestRoof >= 450 },
    { id: "roof_continuity", passed: zone.roof.every((item, index) => index === 0 || item.x1 === zone.roof[index - 1].x2 && item.y1 === zone.roof[index - 1].y2) },
    { id: "roof_span", passed: zone.roof[0].x1 === zone.entry.x && zone.roof.at(-1).x2 >= zone.exit.x },
    { id: "six_architecture_frames", passed: zone.frames.length === 6 },
    { id: "frames_in_bounds", passed: zone.frames.every(item => frameInBounds(item, level.bounds)) },
    { id: "milestone_order", passed: Object.values(zone.milestones).slice(0, 6).every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "spawn_retained", passed: level.spawn.x === PASS03_LEVEL.spawn.x && level.spawn.y === PASS03_LEVEL.spawn.y },
    { id: "pass03_geometry_retained", passed: level.solids === PASS03_LEVEL.solids && level.gates === PASS03_LEVEL.gates },
  ];

  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    highestFloor,
    lowestRoof,
    checks: Object.freeze(checks),
  });
}
