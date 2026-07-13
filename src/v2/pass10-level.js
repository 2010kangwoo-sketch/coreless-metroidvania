import { WORLD, ZONES } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS09_CHASE, PASS09_LEVEL } from "./pass09-level.js";

const point = (x, y) => Object.freeze({ x, y });
const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, zone: 8, lane });
const rect = (id, x, y, width, height, role, kind = role) => Object.freeze({ id, x, y, width, height, role, kind });
const frame = (id, x, y, width, height, kind) => Object.freeze({ id, x, y, width, height, kind });

export const PASS10_ZONE = Object.freeze({
  id: "pass10_chase_double_wall",
  entry: Object.freeze({ x: 15200, y: 5500 }),
  exit: Object.freeze({ x: 23600, y: 5900 }),
  surfaceCeilingY: 5500,
  floors: Object.freeze([
    floor("double_wall_entry_slope", 15200, 5500, 15700, 5700, "entry"),
    floor("double_wall_pit_one", 15740, 6200, 15960, 6200, "shaft_one"),
    floor("double_wall_lip_one", 16000, 5840, 16500, 5900, "after_one"),
    floor("double_wall_connector", 16500, 5900, 17000, 6100, "connector"),
    floor("double_wall_pit_two", 17040, 6600, 17260, 6600, "shaft_two"),
    floor("double_wall_lip_two", 17300, 6200, 18400, 6250, "after_two"),
    floor("double_wall_lower_hall_a", 18400, 6250, 20100, 6350, "exit_hall"),
    floor("double_wall_lower_hall_b", 20100, 6350, 22000, 6250, "exit_hall"),
    floor("double_wall_exit_rise", 22000, 6250, 23600, 5900, "exit_hall"),
    floor("double_wall_exit_shelf", 23600, 5900, 24200, 5900, "exit_shelf"),
  ]),
  solids: Object.freeze([
    rect("double_wall_left_one", 15700, 5700, 40, 500, "zone08_wall", "ribbed_wall"),
    rect("double_wall_right_one", 15960, 5840, 40, 360, "zone08_wall", "broken_wall"),
    rect("double_wall_lip_mass_one", 16000, 5840, 500, 58, "zone08_ledge", "stone_lip"),
    rect("double_wall_left_two", 17000, 6100, 40, 500, "zone08_wall", "forked_wall"),
    rect("double_wall_right_two", 17260, 6200, 40, 400, "zone08_wall", "arched_wall"),
    rect("double_wall_lip_mass_two", 17300, 6200, 1100, 58, "zone08_ledge", "stone_lip"),
    rect("double_wall_low_ceiling_a", 18750, 5940, 1050, 100, "zone08_ceiling", "low_arch"),
    rect("double_wall_low_ceiling_b", 20500, 6000, 1200, 100, "zone08_ceiling", "split_arch"),
  ]),
  frames: Object.freeze([
    frame("double_wall_frame_entry", 15200, 5400, 1500, 980, "buried_entry"),
    frame("double_wall_frame_one", 15620, 5580, 1700, 900, "shaft_one"),
    frame("double_wall_frame_connector", 16650, 5600, 1800, 1000, "descending_connector"),
    frame("double_wall_frame_two", 17280, 5980, 1800, 980, "shaft_two"),
    frame("double_wall_frame_hall_a", 18500, 5880, 2800, 760, "lower_hall"),
    frame("double_wall_frame_hall_b", 21100, 5800, 2500, 760, "exit_hall"),
  ]),
  boulderCorridor: Object.freeze({
    width: 400,
    points: Object.freeze([
      point(15200, 5500), point(15600, 5600), point(15800, 5900),
      point(15950, 6250), point(16350, 6250), point(16800, 5950),
      point(17250, 6100), point(17550, 6500), point(17700, 6700),
      point(18150, 6600), point(18700, 6250), point(20500, 6350),
      point(22000, 6250), point(23600, 5900),
    ]),
  }),
  supportTargets: Object.freeze([
    rect("double_wall_support_entry", 15480, 5480, 90, 650, "boulder_support", "fork"),
    rect("double_wall_support_one_left", 15700, 5700, 100, 600, "boulder_support", "rib"),
    rect("double_wall_support_one_right", 15960, 5840, 110, 540, "boulder_support", "split"),
    rect("double_wall_support_connector", 16620, 5850, 100, 650, "boulder_support", "truss"),
    rect("double_wall_support_two_left", 17000, 6100, 110, 650, "boulder_support", "fork"),
    rect("double_wall_support_two_right", 17260, 6200, 120, 550, "boulder_support", "arch"),
    rect("double_wall_support_lower_hall", 19800, 6000, 120, 620, "boulder_support", "column"),
    rect("double_wall_support_exit", 22400, 5900, 110, 620, "boulder_support", "truss"),
  ]),
  milestones: Object.freeze({
    enteredX: 15320,
    shaftOneDropY: 6140,
    shaftOneExitX: 16000,
    shaftOneExitY: 5898,
    shaftTwoDropY: 6540,
    shaftTwoExitX: 17300,
    shaftTwoExitY: 6258,
    lowerHallX: 18400,
    completionX: 23570,
    completionY: 5880,
  }),
});

const pathPoints = Object.freeze([
  ...PASS09_CHASE.path.points,
  ...PASS10_ZONE.boulderCorridor.points.slice(1),
]);
const cumulativeDistances = [0];
for (let index = 1; index < pathPoints.length; index += 1) {
  const previous = pathPoints[index - 1];
  const current = pathPoints[index];
  cumulativeDistances.push(cumulativeDistances.at(-1) + Math.hypot(current.x - previous.x, current.y - previous.y));
}

const zone08StartIndex = PASS09_CHASE.path.points.length - 1;
const nearestZone08Distance = (x, y) => {
  let best = { gap: Number.POSITIVE_INFINITY, pathDistance: PASS09_CHASE.path.totalDistance };
  for (let index = zone08StartIndex; index < pathPoints.length - 1; index += 1) {
    const start = pathPoints[index];
    const end = pathPoints[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const ratio = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared));
    const nearestX = start.x + dx * ratio;
    const nearestY = start.y + dy * ratio;
    const gap = Math.hypot(x - nearestX, y - nearestY);
    if (gap < best.gap) {
      best = {
        gap,
        pathDistance: cumulativeDistances[index] + Math.hypot(nearestX - start.x, nearestY - start.y),
      };
    }
  }
  return best.pathDistance;
};

const zone08TriggerByFloorId = Object.freeze({
  double_wall_entry_slope: cumulativeDistances[42],
  double_wall_pit_one: cumulativeDistances[44],
  double_wall_lip_one: cumulativeDistances[47],
  double_wall_connector: cumulativeDistances[49],
  double_wall_pit_two: cumulativeDistances[51],
  double_wall_lip_two: cumulativeDistances[52],
  double_wall_lower_hall_a: cumulativeDistances[52],
  double_wall_lower_hall_b: cumulativeDistances[52],
  double_wall_exit_rise: cumulativeDistances[52],
  double_wall_exit_shelf: cumulativeDistances[52],
});

const collapsePanels = Object.freeze([
  ...PASS09_CHASE.collapsePanels,
  ...PASS10_ZONE.floors.map(item => Object.freeze({
    id: `collapse_${item.id}`,
    floorId: item.id,
    zone: 8,
    lane: item.lane,
    triggerDistance: zone08TriggerByFloorId[item.id],
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

const supportTargets = Object.freeze([
  ...PASS09_CHASE.supportTargets,
  ...PASS10_ZONE.supportTargets.map(item => Object.freeze({
    ...item,
    triggerDistance: nearestZone08Distance(item.x + item.width * 0.5, item.y + item.height * 0.5),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

export const PASS10_CHASE = Object.freeze({
  id: "pass10_chase_through_double_wall",
  activeBoulder: true,
  path: Object.freeze({
    points: pathPoints,
    cumulativeDistances: Object.freeze(cumulativeDistances),
    totalDistance: cumulativeDistances.at(-1),
    pass09EndDistance: PASS09_CHASE.path.totalDistance,
    pass08EndDistance: PASS09_CHASE.path.pass08EndDistance,
    zone05EndDistance: PASS09_CHASE.path.zone05EndDistance,
    curveApexDistance: PASS09_CHASE.path.curveApexDistance,
  }),
  boulder: Object.freeze({
    ...PASS09_CHASE.boulder,
    internalBreakpoints: Object.freeze([
      ...PASS09_CHASE.boulder.internalBreakpoints,
      Object.freeze({ distance: cumulativeDistances[40], delayFrames: 1800 }),
      Object.freeze({ distance: cumulativeDistances[43], delayFrames: 260 }),
      Object.freeze({ distance: cumulativeDistances[45], delayFrames: 600 }),
      Object.freeze({ distance: cumulativeDistances[51], delayFrames: 900 }),
    ]),
  }),
  collapsePanels,
  supportTargets,
  completion: Object.freeze({
    playerX: PASS10_ZONE.milestones.completionX,
    playerY: PASS10_ZONE.milestones.completionY,
    minimumBoulderProgress: 0.95,
  }),
});

export const PASS10_LEVEL = Object.freeze({
  ...PASS09_LEVEL,
  id: "pass10_playable_chase_double_wall",
  bounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 7500 }),
  cameraBounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 7500 }),
  exit: PASS10_ZONE.exit,
  floors: Object.freeze([...PASS09_LEVEL.floors, ...PASS10_ZONE.floors]),
  solids: Object.freeze([...PASS09_LEVEL.solids, ...PASS10_ZONE.solids]),
  zone08Frames: PASS10_ZONE.frames,
  zone08BoulderCorridor: PASS10_ZONE.boulderCorridor,
  zone08Supports: PASS10_ZONE.supportTargets,
  activeChase: PASS10_CHASE,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
const floorInBounds = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height;
const rectInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x + item.width <= bounds.x + bounds.width && item.y + item.height <= bounds.y + bounds.height;

export function validatePass10Level() {
  const zone = PASS10_ZONE;
  const chase = PASS10_CHASE;
  const theoreticalJumpRise = (PLAYER_PHYSICS.jumpSpeed * PLAYER_PHYSICS.jumpSpeed) / (2 * PLAYER_PHYSICS.gravity);
  const shaftOneRise = 6200 - 5840;
  const shaftTwoRise = 6600 - 6200;
  const chaseFloorIds = PASS10_LEVEL.floors.filter(item => item.zone >= 5 && item.zone <= 8).map(item => item.id);
  const panelIds = new Set(chase.collapsePanels.map(item => item.floorId));
  const extension = chase.path.points.slice(zone08StartIndex);
  const checks = [
    { id: "pass09_level_retained", passed: PASS10_LEVEL.roof === PASS09_LEVEL.roof && PASS10_LEVEL.zone07Frames === PASS09_LEVEL.zone07Frames },
    { id: "entry_matches_blueprint", passed: zone.entry.x === ZONES[7].entry.x && zone.entry.y === ZONES[7].entry.y },
    { id: "entry_matches_pass09", passed: zone.entry.x === PASS09_LEVEL.exit.x && zone.entry.y === PASS09_LEVEL.exit.y },
    { id: "exit_matches_blueprint", passed: zone.exit.x === ZONES[7].exit.x && zone.exit.y === ZONES[7].exit.y },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "surface_ceiling_matches_entry", passed: zone.surfaceCeilingY === zone.entry.y },
    { id: "ten_player_floors", passed: zone.floors.length === 10 },
    { id: "floors_in_bounds", passed: zone.floors.every(item => floorInBounds(item, PASS10_LEVEL.bounds)) },
    { id: "eight_solids", passed: zone.solids.length === 8 && zone.solids.every(item => rectInBounds(item, PASS10_LEVEL.bounds)) },
    { id: "two_complete_wall_pairs", passed: zone.solids.filter(item => item.role === "zone08_wall").length === 4 },
    { id: "two_forced_shafts", passed: zone.floors.filter(item => item.lane.startsWith("shaft_")).length === 2 },
    { id: "shaft_one_requires_walljumps", passed: shaftOneRise > theoreticalJumpRise * 3 },
    { id: "shaft_two_requires_walljumps", passed: shaftTwoRise > theoreticalJumpRise * 3.4 },
    { id: "wall_corridor_widths", passed: 15960 - 15740 >= PLAYER_PHYSICS.width * 6 && 17260 - 17040 >= PLAYER_PHYSICS.width * 6 },
    { id: "second_shaft_after_first_lip", passed: zone.milestones.shaftOneExitX < 17000 && zone.milestones.shaftTwoExitX > 17260 },
    { id: "no_bypass_floor", passed: !zone.floors.some(item => item.x1 < 15740 && item.x2 > 15960) && !zone.floors.some(item => item.x1 < 17040 && item.x2 > 17260) },
    { id: "six_architecture_frames", passed: zone.frames.length === 6 && zone.frames.every(item => rectInBounds(item, PASS10_LEVEL.bounds)) },
    { id: "wide_boulder_corridor", passed: zone.boulderCorridor.width >= 400 && zone.boulderCorridor.width > PASS10_CHASE.boulder.radius * 2 },
    { id: "fourteen_corridor_points", passed: zone.boulderCorridor.points.length === 14 && zone.boulderCorridor.points.every(pointInWorld) },
    { id: "corridor_matches_player_endpoints", passed: zone.boulderCorridor.points[0].x === zone.entry.x && zone.boulderCorridor.points[0].y === zone.entry.y && zone.boulderCorridor.points.at(-1).x === zone.exit.x && zone.boulderCorridor.points.at(-1).y === zone.exit.y },
    { id: "corridor_descends_through_both_shafts", passed: extension.some(item => item.y >= 6250) && extension.some(item => item.y >= 6700) },
    { id: "no_teleport_segments", passed: extension.slice(1).every((item, index) => Math.hypot(item.x - extension[index].x, item.y - extension[index].y) < 1900) },
    { id: "eight_destructible_supports", passed: zone.supportTargets.length === 8 && zone.supportTargets.every(item => rectInBounds(item, PASS10_LEVEL.bounds)) },
    { id: "extended_chase_path", passed: chase.path.points.length === 53 && chase.path.totalDistance > PASS09_CHASE.path.totalDistance + 9000 },
    { id: "strict_chase_distances", passed: chase.path.cumulativeDistances.every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "all_floors_collapsible", passed: chase.collapsePanels.length === chaseFloorIds.length && chaseFloorIds.every(id => panelIds.has(id)) },
    { id: "twenty_seven_supports", passed: chase.supportTargets.length === 27 },
    { id: "four_new_breakpoints", passed: chase.boulder.internalBreakpoints.length === 7 && chase.boulder.internalBreakpoints.slice(-4).every(item => item.distance > PASS09_CHASE.path.totalDistance) },
    { id: "milestones_force_two_successes", passed: zone.milestones.shaftOneDropY < zone.milestones.shaftTwoDropY && zone.milestones.shaftOneExitX < zone.milestones.shaftTwoExitX && zone.milestones.shaftTwoExitX < zone.milestones.completionX },
    { id: "level_inside_world", passed: PASS10_LEVEL.bounds.x >= WORLD.cameraBounds.x && PASS10_LEVEL.bounds.y >= WORLD.cameraBounds.y && PASS10_LEVEL.bounds.x + PASS10_LEVEL.bounds.width <= WORLD.cameraBounds.x + WORLD.cameraBounds.width && PASS10_LEVEL.bounds.y + PASS10_LEVEL.bounds.height <= WORLD.cameraBounds.y + WORLD.cameraBounds.height },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    theoreticalJumpRise,
    totalDistance: chase.path.totalDistance,
    extensionDistance: chase.path.totalDistance - PASS09_CHASE.path.totalDistance,
    collapsePanelCount: chase.collapsePanels.length,
    supportTargetCount: chase.supportTargets.length,
    checks: Object.freeze(checks),
  });
}
