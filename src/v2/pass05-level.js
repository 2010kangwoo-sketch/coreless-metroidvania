import { WORLD, ZONES } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS04_LEVEL, PASS04_ZONE } from "./pass04-level.js";

const floor = (id, x1, y1, x2, y2) => Object.freeze({ id, x1, y1, x2, y2, zone: 4 });
const solid = (id, x, y, width, height, role) => Object.freeze({ id, x, y, width, height, role });
const segment = (x1, y1, x2, y2) => Object.freeze({ x1, y1, x2, y2 });
const frame = (x, y, width, height, kind) => Object.freeze({ x, y, width, height, kind });

export const PASS05_ZONE = Object.freeze({
  id: "pass05_uneven_tunnel",
  entry: Object.freeze({ x: 10400, y: 3300 }),
  exit: Object.freeze({ x: 13400, y: 3700 }),
  floors: Object.freeze([
    floor("tunnel_entry_rise", 10700, 3300, 11050, 3150),
    floor("compression_corridor", 11050, 3150, 11480, 3150),
    floor("shaft_landing", 11920, 3400, 12220, 3600),
    floor("inner_rise", 12220, 3600, 12500, 3450),
    floor("short_gap_landing", 12590, 3450, 12720, 3450),
    floor("short_gap_descent", 12720, 3450, 12800, 3700),
    floor("long_gap_landing", 12910, 3700, 13020, 3700),
    floor("long_gap_rise", 13020, 3700, 13120, 3500),
    floor("exit_descent", 13120, 3500, 13400, 3700),
    floor("zone04_exit", 13400, 3700, 13650, 3700),
  ]),
  gaps: Object.freeze([
    Object.freeze({ id: "moving_platform_shaft", fromX: 11480, toX: 11920, width: 440, requires: "moving_platform" }),
    Object.freeze({ id: "short_timing_gap", fromX: 12500, toX: 12590, width: 90, requires: "short_jump" }),
    Object.freeze({ id: "long_timing_gap", fromX: 12800, toX: 12910, width: 110, requires: "long_jump" }),
  ]),
  ceilings: Object.freeze([
    solid("compression_beam_a", 11050, 3000, 260, 70, "ceiling"),
    solid("compression_beam_b", 11320, 3020, 160, 60, "ceiling"),
  ]),
  movingPlatform: Object.freeze({
    id: "shaft_carriage",
    xMin: 11490,
    xMax: 11750,
    y: 3290,
    width: 180,
    height: 22,
    speed: 2.15,
  }),
  roof: Object.freeze([
    segment(10400, 2880, 10850, 2800),
    segment(10850, 2800, 11480, 2980),
    segment(11480, 2980, 11920, 3060),
    segment(11920, 3060, 12500, 3100),
    segment(12500, 3100, 12910, 3260),
    segment(12910, 3260, 13400, 3340),
    segment(13400, 3340, 13650, 3400),
  ]),
  frames: Object.freeze([
    frame(10500, 2860, 950, 500, "compression_vault"),
    frame(11450, 3000, 520, 580, "shaft_frame"),
    frame(11900, 3120, 1250, 720, "uneven_gallery"),
    frame(13050, 3260, 700, 600, "exit_frame"),
  ]),
  milestones: Object.freeze({
    enteredX: 10700,
    compressionX: 11050,
    shaftX: 11480,
    shaftExitX: 11920,
    unevenX: 12220,
    completionX: 13400,
    completionY: 3650,
  }),
});

export const PASS05_LEVEL = Object.freeze({
  id: "pass05_playable_zones_01_04",
  bounds: Object.freeze({ x: 0, y: 300, width: 13800, height: 3900 }),
  cameraBounds: Object.freeze({ x: 0, y: 300, width: 13800, height: 3900 }),
  spawn: PASS04_LEVEL.spawn,
  zone01Exit: PASS04_LEVEL.zone01Exit,
  zone02Exit: PASS04_LEVEL.zone02Exit,
  zone03Exit: PASS04_LEVEL.exit,
  exit: PASS05_ZONE.exit,
  floors: Object.freeze([...PASS04_LEVEL.floors, ...PASS05_ZONE.floors]),
  solids: Object.freeze([...PASS04_LEVEL.solids, ...PASS05_ZONE.ceilings]),
  gates: PASS04_LEVEL.gates,
  roof: PASS04_LEVEL.roof,
  frames: PASS04_LEVEL.frames,
  zone04Roof: PASS05_ZONE.roof,
  zone04Frames: PASS05_ZONE.frames,
  movingPlatforms: Object.freeze([PASS05_ZONE.movingPlatform]),
});

const pointInWorld = point => point.x >= 0 && point.y >= 0 && point.x <= WORLD.width && point.y <= WORLD.height;
const floorInBounds = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height;
const rectInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x + item.width <= bounds.x + bounds.width && item.y + item.height <= bounds.y + bounds.height;

export function validatePass05Level() {
  const level = PASS05_LEVEL;
  const zone = PASS05_ZONE;
  const platform = zone.movingPlatform;
  const normalJumpRise = (PLAYER_PHYSICS.jumpSpeed ** 2) / (2 * PLAYER_PHYSICS.gravity);
  const ceilingClearances = zone.ceilings.map(item => 3150 - (item.y + item.height));
  const checks = [
    { id: "combined_level_in_world", passed: pointInWorld(level.bounds) && pointInWorld({ x: level.bounds.x + level.bounds.width, y: level.bounds.y + level.bounds.height }) },
    { id: "camera_matches_level", passed: level.cameraBounds.width === level.bounds.width && level.cameraBounds.height === level.bounds.height },
    { id: "zone04_entry_matches_blueprint", passed: zone.entry.x === ZONES[3].entry.x && zone.entry.y === ZONES[3].entry.y },
    { id: "zone04_entry_matches_pass04", passed: zone.entry.x === PASS04_ZONE.exit.x && zone.entry.y === PASS04_ZONE.exit.y },
    { id: "zone04_exit_matches_blueprint", passed: zone.exit.x === ZONES[3].exit.x && zone.exit.y === ZONES[3].exit.y },
    { id: "zone04_exit_lower", passed: zone.exit.y > zone.entry.y },
    { id: "zone04_floor_count", passed: zone.floors.length === 10 },
    { id: "combined_floor_count", passed: level.floors.length === PASS04_LEVEL.floors.length + zone.floors.length },
    { id: "floors_ordered", passed: zone.floors.every(item => item.x2 > item.x1) },
    { id: "floors_in_bounds", passed: level.floors.every(item => floorInBounds(item, level.bounds)) },
    { id: "single_forward_route", passed: zone.floors.every((item, index) => index === 0 || item.x1 >= zone.floors[index - 1].x2) },
    { id: "three_distinct_gaps", passed: zone.gaps.length === 3 && new Set(zone.gaps.map(item => item.requires)).size === 3 },
    { id: "precision_gap_widths", passed: zone.gaps.slice(1).every(item => item.width >= PLAYER_PHYSICS.width * 2 && item.width <= PLAYER_PHYSICS.dashSpeed * PLAYER_PHYSICS.dashFrames) },
    { id: "shaft_requires_platform", passed: zone.gaps[0].width > PLAYER_PHYSICS.runSpeed * 38 + PLAYER_PHYSICS.dashSpeed * PLAYER_PHYSICS.dashFrames },
    { id: "one_moving_platform", passed: level.movingPlatforms.length === 1 },
    { id: "platform_spans_shaft", passed: platform.xMin <= zone.gaps[0].fromX + PLAYER_PHYSICS.width && platform.xMax + platform.width >= zone.gaps[0].toX },
    { id: "platform_travel", passed: platform.xMax - platform.xMin >= 250 && platform.speed > 0 && platform.speed < PLAYER_PHYSICS.runSpeed },
    { id: "two_low_ceiling_beams", passed: zone.ceilings.length === 2 },
    { id: "low_ceiling_clearance", passed: ceilingClearances.every(value => value > PLAYER_PHYSICS.height && value < normalJumpRise) },
    { id: "solids_in_bounds", passed: level.solids.every(item => rectInBounds(item, level.bounds)) },
    { id: "roof_continuity", passed: zone.roof.every((item, index) => index === 0 || item.x1 === zone.roof[index - 1].x2 && item.y1 === zone.roof[index - 1].y2) },
    { id: "roof_span", passed: zone.roof[0].x1 === zone.entry.x && zone.roof.at(-1).x2 >= zone.exit.x },
    { id: "four_architecture_frames", passed: zone.frames.length === 4 && zone.frames.every(item => rectInBounds(item, level.bounds)) },
    { id: "milestone_order", passed: Object.values(zone.milestones).slice(0, 6).every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "pass04_geometry_retained", passed: level.roof === PASS04_LEVEL.roof && level.frames === PASS04_LEVEL.frames && level.gates === PASS04_LEVEL.gates },
  ];

  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    normalJumpRise,
    ceilingClearances: Object.freeze(ceilingClearances),
    checks: Object.freeze(checks),
  });
}
