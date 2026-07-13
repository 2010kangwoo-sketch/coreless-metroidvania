import { WORLD, ZONES } from "./blueprint.js";
import { PASS08_CHASE, PASS08_LEVEL } from "./pass08-level.js";

const point = (x, y) => Object.freeze({ x, y });
const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, zone: 7, lane });
const rect = (id, x, y, width, height, role, kind = role) => Object.freeze({ id, x, y, width, height, role, kind });
const frame = (id, x, y, width, height, kind) => Object.freeze({ id, x, y, width, height, kind });

export const PASS09_ZONE = Object.freeze({
  id: "pass09_first_internal_descent",
  entry: Object.freeze({ x: 9300, y: 5000 }),
  exit: Object.freeze({ x: 15200, y: 5500 }),
  surfaceCeilingY: 5000,
  upperFloors: Object.freeze([
    floor("internal_entry_surface", 9300, 5000, 9500, 5000, "upper"),
    floor("internal_upper_ramp", 9500, 5000, 9800, 5350, "upper"),
    floor("internal_upper_gallery", 9800, 5350, 11650, 5450, "upper"),
  ]),
  middleFloors: Object.freeze([
    floor("internal_middle_return", 10200, 6000, 12100, 5900, "middle"),
  ]),
  lowerFloors: Object.freeze([
    floor("internal_lower_landing", 9800, 6450, 10800, 6400, "lower"),
    floor("internal_lower_wave_a", 10800, 6400, 12000, 6500, "lower"),
    floor("internal_lower_wave_b", 12000, 6500, 13100, 6250, "lower"),
    floor("internal_lower_wave_c", 13100, 6250, 14100, 6400, "lower"),
    floor("internal_exit_rise", 14100, 6400, 15200, 5500, "lower"),
  ]),
  solids: Object.freeze([
    rect("internal_upper_ceiling", 9500, 4870, 2150, 80, "zone07_ceiling", "beam"),
    rect("internal_middle_ceiling", 10150, 5760, 1950, 90, "zone07_ceiling", "rib"),
    rect("internal_lower_ceiling", 10800, 6180, 2000, 80, "zone07_ceiling", "arch"),
  ]),
  frames: Object.freeze([
    frame("internal_frame_entry", 9300, 4900, 1250, 950, "entry_vault"),
    frame("internal_frame_drop_a", 10450, 4920, 1500, 980, "first_drop"),
    frame("internal_frame_return", 9900, 5200, 2100, 700, "return_gallery"),
    frame("internal_frame_lower_a", 11800, 5300, 1500, 650, "lower_vault"),
    frame("internal_frame_lower_b", 13200, 5200, 1500, 760, "exit_vault"),
  ]),
  boulderCorridor: Object.freeze({
    width: 380,
    points: Object.freeze([
      point(9300, 5000), point(9120, 5060), point(9000, 5200),
      point(9060, 5400), point(9300, 5520), point(10100, 5600),
      point(11200, 5700), point(12400, 5520), point(13600, 5800),
      point(14500, 5650), point(15200, 5500),
    ]),
  }),
  supportTargets: Object.freeze([
    rect("internal_support_entry", 9550, 5050, 90, 620, "boulder_support", "fork"),
    rect("internal_support_drop", 10450, 5100, 110, 690, "boulder_support", "split"),
    rect("internal_support_return", 11550, 5200, 90, 620, "boulder_support", "column"),
    rect("internal_support_lower_a", 12600, 5300, 120, 600, "boulder_support", "truss"),
    rect("internal_support_lower_b", 13750, 5300, 100, 590, "boulder_support", "arch"),
    rect("internal_support_exit", 14800, 5200, 90, 560, "boulder_support", "fork"),
  ]),
  milestones: Object.freeze({
    enteredX: 9450,
    upperTurnX: 11620,
    firstLandingY: 5890,
    middleTurnX: 10220,
    secondLandingY: 6380,
    lowerRunX: 10800,
    completionX: 15170,
    completionY: 5480,
  }),
});

const pathPoints = Object.freeze([
  ...PASS08_CHASE.path.points,
  ...PASS09_ZONE.boulderCorridor.points.slice(1),
]);
const cumulativeDistances = [0];
for (let index = 1; index < pathPoints.length; index += 1) {
  const previous = pathPoints[index - 1];
  const current = pathPoints[index];
  cumulativeDistances.push(cumulativeDistances.at(-1) + Math.hypot(current.x - previous.x, current.y - previous.y));
}

const nearestExtensionDistance = (x, y) => {
  let best = { gap: Number.POSITIVE_INFINITY, pathDistance: PASS08_CHASE.path.totalDistance };
  const firstSegment = PASS08_CHASE.path.points.length - 1;
  for (let index = firstSegment; index < pathPoints.length - 1; index += 1) {
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

const zone07Floors = Object.freeze([
  ...PASS09_ZONE.upperFloors,
  ...PASS09_ZONE.middleFloors,
  ...PASS09_ZONE.lowerFloors,
]);

const zone07CollapseTriggerByFloorId = Object.freeze({
  internal_entry_surface: cumulativeDistances[30],
  internal_upper_ramp: cumulativeDistances[33],
  internal_upper_gallery: cumulativeDistances[35],
  internal_middle_return: cumulativeDistances[36],
  internal_lower_landing: cumulativeDistances[37],
  internal_lower_wave_a: cumulativeDistances[38],
  internal_lower_wave_b: cumulativeDistances[39] - 300,
  internal_lower_wave_c: cumulativeDistances[39] - 120,
  internal_exit_rise: cumulativeDistances[39],
});

const collapsePanels = Object.freeze([
  ...PASS08_CHASE.collapsePanels,
  ...zone07Floors.map(item => Object.freeze({
    id: `collapse_${item.id}`,
    floorId: item.id,
    zone: 7,
    lane: item.lane,
    triggerDistance: zone07CollapseTriggerByFloorId[item.id],
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

const supportTargets = Object.freeze([
  ...PASS08_CHASE.supportTargets,
  ...PASS09_ZONE.supportTargets.map(item => Object.freeze({
    ...item,
    triggerDistance: nearestExtensionDistance(item.x + item.width * 0.5, item.y + item.height * 0.5),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

export const PASS09_CHASE = Object.freeze({
  id: "pass09_chase_through_first_internal_descent",
  activeBoulder: true,
  path: Object.freeze({
    points: pathPoints,
    cumulativeDistances: Object.freeze(cumulativeDistances),
    totalDistance: cumulativeDistances.at(-1),
    pass08EndDistance: PASS08_CHASE.path.totalDistance,
    zone05EndDistance: PASS08_CHASE.path.zone05EndDistance,
    curveApexDistance: PASS08_CHASE.path.curveApexDistance,
  }),
  boulder: Object.freeze({
    ...PASS08_CHASE.boulder,
    breachDelayFrames: 220,
    internalBreakpoints: Object.freeze([
      Object.freeze({ distance: cumulativeDistances[35], delayFrames: 160 }),
      Object.freeze({ distance: cumulativeDistances[37], delayFrames: 160 }),
      Object.freeze({ distance: cumulativeDistances[38], delayFrames: 240 }),
    ]),
  }),
  collapsePanels,
  supportTargets,
  completion: Object.freeze({
    playerX: PASS09_ZONE.milestones.completionX,
    playerY: PASS09_ZONE.milestones.completionY,
    minimumBoulderProgress: 0.90,
  }),
});

export const PASS09_LEVEL = Object.freeze({
  ...PASS08_LEVEL,
  id: "pass09_playable_first_internal_descent",
  bounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 6600 }),
  cameraBounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 6600 }),
  exit: PASS09_ZONE.exit,
  floors: Object.freeze([...PASS08_LEVEL.floors, ...zone07Floors]),
  solids: Object.freeze([...PASS08_LEVEL.solids, ...PASS09_ZONE.solids]),
  zone07Frames: PASS09_ZONE.frames,
  zone07BoulderCorridor: PASS09_ZONE.boulderCorridor,
  zone07Supports: PASS09_ZONE.supportTargets,
  activeChase: PASS09_CHASE,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
const floorInBounds = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height;
const rectInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x + item.width <= bounds.x + bounds.width && item.y + item.height <= bounds.y + bounds.height;

export function validatePass09Level() {
  const zone = PASS09_ZONE;
  const chase = PASS09_CHASE;
  const extensionStart = PASS08_CHASE.path.points.length - 1;
  const extension = chase.path.points.slice(extensionStart);
  const apexIndex = extension.findIndex(item => item.x === 9000 && item.y === 5200);
  const chaseFloorIds = PASS09_LEVEL.floors.filter(item => item.zone >= 5 && item.zone <= 7).map(item => item.id);
  const panelIds = new Set(chase.collapsePanels.map(item => item.floorId));
  const checks = [
    { id: "pass08_level_retained", passed: PASS09_LEVEL.roof === PASS08_LEVEL.roof && PASS09_LEVEL.boulderCurve === PASS08_LEVEL.boulderCurve },
    { id: "entry_matches_blueprint", passed: zone.entry.x === ZONES[6].entry.x && zone.entry.y === ZONES[6].entry.y },
    { id: "entry_matches_pass08", passed: zone.entry.x === PASS08_LEVEL.exit.x && zone.entry.y === PASS08_LEVEL.exit.y },
    { id: "exit_matches_blueprint", passed: zone.exit.x === ZONES[6].exit.x && zone.exit.y === ZONES[6].exit.y },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "surface_ceiling_matches_entry", passed: zone.surfaceCeilingY === zone.entry.y },
    { id: "three_upper_floors", passed: zone.upperFloors.length === 3 && zone.upperFloors.every(item => item.lane === "upper") },
    { id: "one_middle_return", passed: zone.middleFloors.length === 1 && zone.middleFloors[0].lane === "middle" },
    { id: "five_lower_floors", passed: zone.lowerFloors.length === 5 && zone.lowerFloors.every(item => item.lane === "lower") },
    { id: "floors_in_bounds", passed: zone07Floors.every(item => floorInBounds(item, PASS09_LEVEL.bounds)) },
    { id: "upper_route_connected", passed: zone.upperFloors.every((item, index) => index === 0 || item.x1 === zone.upperFloors[index - 1].x2 && item.y1 === zone.upperFloors[index - 1].y2) },
    { id: "lower_route_connected", passed: zone.lowerFloors.every((item, index) => index === 0 || item.x1 === zone.lowerFloors[index - 1].x2 && item.y1 === zone.lowerFloors[index - 1].y2) },
    { id: "two_physical_drops", passed: zone.middleFloors[0].y2 - zone.upperFloors.at(-1).y2 >= 150 && zone.lowerFloors[0].y1 - zone.middleFloors[0].y1 >= 200 },
    { id: "single_player_route", passed: zone.upperFloors.at(-1).x2 <= zone.middleFloors[0].x2 && zone.middleFloors[0].x1 >= zone.lowerFloors[0].x1 },
    { id: "three_ceiling_solids", passed: zone.solids.length === 3 && zone.solids.every(item => rectInBounds(item, PASS09_LEVEL.bounds)) },
    { id: "five_architecture_frames", passed: zone.frames.length === 5 && zone.frames.every(item => rectInBounds(item, PASS09_LEVEL.bounds)) },
    { id: "wide_boulder_corridor", passed: zone.boulderCorridor.width >= 360 && zone.boulderCorridor.width > 34 * 5 },
    { id: "eleven_corridor_points", passed: zone.boulderCorridor.points.length === 11 && zone.boulderCorridor.points.every(pointInWorld) },
    { id: "physical_u_turn", passed: apexIndex === 2 && extension.slice(1, apexIndex + 1).every((item, index) => item.x < extension[index].x) && extension.slice(apexIndex + 1).every((item, index) => item.x > extension[apexIndex + index].x) },
    { id: "corridor_starts_at_entry", passed: zone.boulderCorridor.points[0].x === zone.entry.x && zone.boulderCorridor.points[0].y === zone.entry.y },
    { id: "corridor_ends_at_exit", passed: zone.boulderCorridor.points.at(-1).x === zone.exit.x && zone.boulderCorridor.points.at(-1).y === zone.exit.y },
    { id: "six_internal_supports", passed: zone.supportTargets.length === 6 && zone.supportTargets.every(item => rectInBounds(item, PASS09_LEVEL.bounds)) },
    { id: "extended_chase_path", passed: chase.path.points.length === 40 && chase.path.totalDistance > PASS08_CHASE.path.totalDistance + 6500 },
    { id: "strict_chase_distances", passed: chase.path.cumulativeDistances.every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "all_floors_collapsible", passed: chase.collapsePanels.length === chaseFloorIds.length && chaseFloorIds.every(id => panelIds.has(id)) },
    { id: "nineteen_supports", passed: chase.supportTargets.length === 19 },
    { id: "breach_delay", passed: chase.boulder.breachDelayFrames === 220 },
    { id: "milestone_order", passed: zone.milestones.enteredX < zone.milestones.middleTurnX && zone.milestones.middleTurnX < zone.milestones.upperTurnX && zone.milestones.lowerRunX < zone.milestones.completionX },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    totalDistance: chase.path.totalDistance,
    extensionDistance: chase.path.totalDistance - PASS08_CHASE.path.totalDistance,
    collapsePanelCount: chase.collapsePanels.length,
    supportTargetCount: chase.supportTargets.length,
    checks: Object.freeze(checks),
  });
}
