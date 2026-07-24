import { WORLD, ZONES } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS06_LEVEL, PASS06_ZONE } from "./pass06-level.js";

const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, zone: 6, lane });
const point = (x, y) => Object.freeze({ x, y });
const frame = (x, y, width, height, kind) => Object.freeze({ x, y, width, height, kind });

export const PASS07_ZONE = Object.freeze({
  id: "pass07_giant_curve_dash_run",
  entry: Object.freeze({ x: 24800, y: 4400 }),
  exit: Object.freeze({ x: 9300, y: 5000 }),
  upperFloors: Object.freeze([
    floor("curve_approach", 25100, 4400, 25260, 4450, "upper"),
    floor("curve_bend", 25260, 4450, 25400, 4620, "upper"),
    floor("curve_drop_lip", 25400, 4620, 25480, 4850, "upper"),
  ]),
  lowerFloors: Object.freeze([
    floor("zone06_exit_rise", 9300, 5000, 10450, 4900, "lower"),
    floor("low_wave_a", 10450, 4900, 11700, 5200, "lower"),
    floor("low_wave_b", 11700, 5200, 13000, 4800, "lower"),
    floor("low_wave_c", 13000, 4800, 14350, 5150, "lower"),
    floor("west_dash_landing", 14350, 5150, 15720, 4850, "lower"),
    floor("mid_dash_takeoff", 15970, 4850, 17600, 5200, "lower"),
    floor("middle_wave", 17600, 5200, 19030, 4750, "lower"),
    floor("east_mid", 19290, 4750, 21000, 5100, "lower"),
    floor("east_wave", 21000, 5100, 22430, 4800, "lower"),
    floor("east_dash_takeoff", 22690, 4800, 24000, 5100, "lower"),
    floor("curve_runout", 24000, 5100, 24950, 5150, "lower"),
    floor("curve_landing", 24950, 5150, 26000, 5450, "lower"),
  ]),
  dashGaps: Object.freeze([
    Object.freeze({ id: "west_dash_gap", fromX: 15720, toX: 15970, width: 250 }),
    Object.freeze({ id: "middle_dash_gap", fromX: 19030, toX: 19290, width: 260 }),
    Object.freeze({ id: "east_dash_gap", fromX: 22430, toX: 22690, width: 260 }),
  ]),
  boulderCurve: Object.freeze({
    width: 420,
    activeBoulder: false,
    points: Object.freeze([
      point(24800, 4400), point(25100, 4400), point(25260, 4450),
      point(25400, 4620), point(25480, 4850), point(26000, 5450),
      point(24950, 5150), point(24000, 5100), point(22690, 4800),
      point(22430, 4800), point(21000, 5100), point(19290, 4750),
      point(19030, 4750), point(17600, 5200), point(15970, 4850),
      point(15720, 4850), point(14350, 5150), point(13000, 4800),
      point(11700, 5200), point(10450, 4900), point(9300, 5000),
    ]),
  }),
  frames: Object.freeze([
    frame(24600, 4050, 1400, 1500, "curve_chamber"),
    frame(22600, 4400, 2200, 950, "east_dash_vault"),
    frame(19300, 4300, 3100, 1100, "middle_dash_vault"),
    frame(16000, 4400, 3100, 1100, "west_dash_vault"),
    frame(12600, 4400, 3200, 1100, "wave_gallery"),
    frame(9200, 4500, 3200, 900, "zone06_exit_vault"),
  ]),
  milestones: Object.freeze({
    enteredX: 25100,
    curveCommittedX: 25420,
    landingY: 5400,
    eastGapX: 22430,
    middleGapX: 19030,
    westGapX: 15720,
    completionX: 9320,
    completionY: 4950,
  }),
});

export const PASS07_LEVEL = Object.freeze({
  id: "pass07_playable_zones_01_06",
  bounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 5500 }),
  cameraBounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 5500 }),
  spawn: PASS06_LEVEL.spawn,
  zone01Exit: PASS06_LEVEL.zone01Exit,
  zone02Exit: PASS06_LEVEL.zone02Exit,
  zone03Exit: PASS06_LEVEL.zone03Exit,
  zone04Exit: PASS06_LEVEL.zone04Exit,
  zone05Exit: PASS06_LEVEL.exit,
  exit: PASS07_ZONE.exit,
  floors: Object.freeze([...PASS06_LEVEL.floors, ...PASS07_ZONE.upperFloors, ...PASS07_ZONE.lowerFloors]),
  solids: PASS06_LEVEL.solids,
  gates: PASS06_LEVEL.gates,
  roof: PASS06_LEVEL.roof,
  frames: PASS06_LEVEL.frames,
  zone04Roof: PASS06_LEVEL.zone04Roof,
  zone04Frames: PASS06_LEVEL.zone04Frames,
  movingPlatforms: PASS06_LEVEL.movingPlatforms,
  zone05Roof: PASS06_LEVEL.zone05Roof,
  zone05Frames: PASS06_LEVEL.zone05Frames,
  breakables: PASS06_LEVEL.breakables,
  collapseCorridor: PASS06_LEVEL.collapseCorridor,
  corridorSupports: PASS06_LEVEL.corridorSupports,
  zone06Frames: PASS07_ZONE.frames,
  boulderCurve: PASS07_ZONE.boulderCurve,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
const floorInBounds = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height;
const rectInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x + item.width <= bounds.x + bounds.width && item.y + item.height <= bounds.y + bounds.height;

export function validatePass07Level() {
  const level = PASS07_LEVEL;
  const zone = PASS07_ZONE;
  const jumpRise = (PLAYER_PHYSICS.jumpSpeed ** 2) / (2 * PLAYER_PHYSICS.gravity);
  const jumpAirFrames = (PLAYER_PHYSICS.jumpSpeed * 2) / PLAYER_PHYSICS.gravity;
  const runOnlyDistance = PLAYER_PHYSICS.runSpeed * jumpAirFrames;
  const dashDistance = PLAYER_PHYSICS.dashSpeed * PLAYER_PHYSICS.dashFrames;
  const curvePoints = zone.boulderCurve.points;
  const apexIndex = curvePoints.findIndex(item => item.x === 26000);
  const beforeApex = curvePoints.slice(1, apexIndex + 1).every((item, index) => item.x >= curvePoints[index].x);
  const afterApex = curvePoints.slice(apexIndex + 1).every((item, index) => item.x < curvePoints[apexIndex + index].x);
  const checks = [
    { id: "combined_level_in_world", passed: pointInWorld(level.bounds) && pointInWorld({ x: level.bounds.x + level.bounds.width, y: level.bounds.y + level.bounds.height }) },
    { id: "camera_matches_level", passed: level.cameraBounds.width === level.bounds.width && level.cameraBounds.height === level.bounds.height },
    { id: "zone06_entry_matches_blueprint", passed: zone.entry.x === ZONES[5].entry.x && zone.entry.y === ZONES[5].entry.y },
    { id: "zone06_entry_matches_pass06", passed: zone.entry.x === PASS06_ZONE.exit.x && zone.entry.y === PASS06_ZONE.exit.y },
    { id: "zone06_exit_matches_blueprint", passed: zone.exit.x === ZONES[5].exit.x && zone.exit.y === ZONES[5].exit.y },
    { id: "zone06_exit_lower", passed: zone.exit.y > zone.entry.y },
    { id: "upper_floor_count", passed: zone.upperFloors.length === 3 },
    { id: "lower_floor_count", passed: zone.lowerFloors.length === 12 },
    { id: "combined_floor_count", passed: level.floors.length === PASS06_LEVEL.floors.length + 15 },
    { id: "floor_lanes", passed: zone.upperFloors.every(item => item.lane === "upper") && zone.lowerFloors.every(item => item.lane === "lower") },
    { id: "floors_ordered", passed: [...zone.upperFloors, ...zone.lowerFloors].every(item => item.x2 > item.x1) },
    { id: "floors_in_bounds", passed: level.floors.every(item => floorInBounds(item, level.bounds)) },
    { id: "upper_route_connected", passed: zone.upperFloors.every((item, index) => index === 0 || item.x1 === zone.upperFloors[index - 1].x2 && item.y1 === zone.upperFloors[index - 1].y2) },
    { id: "lower_route_endpoints", passed: zone.lowerFloors[0].x1 === zone.exit.x && zone.lowerFloors.at(-1).x2 === 26000 },
    { id: "three_dash_gaps", passed: zone.dashGaps.length === 3 },
    { id: "dash_gap_widths", passed: zone.dashGaps.every(item => item.width > runOnlyDistance && item.width < runOnlyDistance + dashDistance) },
    { id: "dash_gaps_match_floors", passed: zone.dashGaps.every(item => !zone.lowerFloors.some(floorItem => floorItem.x1 < item.toX && floorItem.x2 > item.fromX)) },
    { id: "curve_corridor_inactive", passed: zone.boulderCurve.activeBoulder === false },
    { id: "curve_corridor_width", passed: zone.boulderCurve.width >= 400 },
    { id: "curve_points_in_world", passed: curvePoints.length === 21 && curvePoints.every(pointInWorld) },
    { id: "single_direction_change", passed: apexIndex === 5 && beforeApex && afterApex },
    { id: "curve_starts_at_entry", passed: curvePoints[0].x === zone.entry.x && curvePoints[0].y === zone.entry.y },
    { id: "curve_ends_at_exit", passed: curvePoints.at(-1).x === zone.exit.x && curvePoints.at(-1).y === zone.exit.y },
    { id: "visible_vertical_drop", passed: curvePoints[5].y - curvePoints[4].y >= 400 },
    { id: "landing_below_lip", passed: zone.lowerFloors.at(-1).y2 - zone.upperFloors.at(-1).y2 >= 400 },
    { id: "six_architecture_frames", passed: zone.frames.length === 6 && zone.frames.every(item => rectInBounds(item, level.bounds)) },
    { id: "milestone_coordinates", passed: zone.milestones.enteredX < zone.milestones.curveCommittedX && zone.milestones.eastGapX > zone.milestones.middleGapX && zone.milestones.middleGapX > zone.milestones.westGapX && zone.milestones.westGapX > zone.milestones.completionX },
    { id: "pass06_geometry_retained", passed: level.zone05Roof === PASS06_LEVEL.zone05Roof && level.breakables === PASS06_LEVEL.breakables && level.collapseCorridor === PASS06_LEVEL.collapseCorridor && level.gates === PASS06_LEVEL.gates },
  ];

  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    jumpRise,
    runOnlyDistance,
    dashDistance,
    checks: Object.freeze(checks),
  });
}
