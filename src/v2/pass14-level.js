import { WORLD, ZONES } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS13_CHASE, PASS13_LEVEL, PASS13_ZONE } from "./pass13-level.js";

const point = (x, y) => Object.freeze({ x, y });
const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, zone: 9, phase: 14, lane });
const rect = (id, x, y, width, height, role, kind = role) => Object.freeze({ id, x, y, width, height, role, kind, phase: 14 });
const frame = (id, x, y, width, height, kind) => Object.freeze({ id, x, y, width, height, kind });

export const PASS14_ZONE = Object.freeze({
  id: "pass14_giant_curved_direction_change",
  entry: PASS13_ZONE.exit,
  exit: Object.freeze({ x: 19000, y: 9000 }),
  surfaceCeilingY: PASS13_ZONE.exit.y,
  playerRoute: Object.freeze([
    point(19800, 7520),
    point(18920, 7750),
    point(18800, 7800),
    point(18000, 8100),
    point(17300, 8400),
    point(16900, 8550),
    point(16700, 8800),
    point(17100, 8820),
    point(17800, 8920),
    point(19000, 9000),
  ]),
  floors: Object.freeze([
    floor("giant_curve_entry_slope", 18920, 7750, 19800, 7520, "upper_entry"),
    floor("giant_curve_upper_arc_a", 18000, 8100, 18800, 7800, "upper_survival"),
    floor("giant_curve_upper_arc_b", 17300, 8400, 18000, 8100, "upper_survival"),
    floor("giant_curve_drop_lip", 16900, 8550, 17300, 8400, "drop_lip"),
    floor("giant_curve_lower_landing", 16600, 8800, 17100, 8820, "lower_return"),
    floor("giant_curve_lower_roll_a", 17100, 8820, 17800, 8920, "lower_return"),
    floor("giant_curve_exit_slope", 17800, 8920, 19000, 9000, "bridge_handoff"),
  ]),
  upperGap: Object.freeze({
    id: "giant_curve_upper_survival_gap",
    x1: 18800,
    x2: 18920,
    width: 120,
    noLowerSafetyFloor: true,
    lowerRouteRequiresNaturalDrop: true,
  }),
  naturalDrop: Object.freeze({
    id: "giant_curve_natural_drop",
    lip: point(16900, 8550),
    landing: point(16700, 8800),
    minimumDrop: 220,
    maximumDrop: 300,
  }),
  lowerCollapseDelay: 420,
  solids: Object.freeze([
    rect("giant_curve_entry_rib", 19020, 7260, 680, 60, "zone09_curve_rib", "entry_split_beam"),
    rect("giant_curve_upper_rib", 17940, 7700, 80, 260, "zone09_curve_rib", "upper_broken_rib"),
    rect("giant_curve_drop_buttress", 16520, 8280, 70, 470, "zone09_curve_wall", "drop_buttress"),
    rect("giant_curve_exit_rib", 18300, 8620, 900, 60, "zone09_curve_rib", "bridge_handoff_beam"),
  ]),
  frames: Object.freeze([
    frame("giant_curve_frame_entry", 18750, 7200, 1700, 900, "gentle_entry_vault"),
    frame("giant_curve_frame_upper", 17700, 7500, 1800, 1050, "upper_survival_vault"),
    frame("giant_curve_frame_steep", 16900, 7900, 1800, 1150, "steepening_curve_vault"),
    frame("giant_curve_frame_drop", 16250, 8300, 1500, 1150, "natural_drop_void"),
    frame("giant_curve_frame_lower", 16600, 8550, 2700, 900, "opposite_lower_vault"),
    frame("giant_curve_frame_handoff", 18100, 8650, 1800, 700, "bridge_handoff_vault"),
  ]),
  boulderCorridor: Object.freeze({
    width: 420,
    floorOffset: 100,
    points: Object.freeze([
      point(19800, 7640),
      point(19400, 7720),
      point(19000, 7820),
      point(18600, 7970),
      point(18200, 8160),
      point(17850, 8380),
      point(17550, 8600),
      point(17250, 8780),
      point(16950, 8900),
      point(16750, 8960),
      point(16650, 8980),
      point(16720, 9050),
      point(16950, 9100),
      point(17400, 9120),
      point(18100, 9160),
      point(19000, 9270),
    ]),
  }),
  boulderFloors: Object.freeze([
    floor("giant_curve_chute_01", 19400, 7820, 19800, 7740, "boulder_only"),
    floor("giant_curve_chute_02", 19000, 7920, 19400, 7820, "boulder_only"),
    floor("giant_curve_chute_03", 18600, 8070, 19000, 7920, "boulder_only"),
    floor("giant_curve_chute_04", 18200, 8260, 18600, 8070, "boulder_only"),
    floor("giant_curve_chute_05", 17850, 8480, 18200, 8260, "boulder_only"),
    floor("giant_curve_chute_06", 17550, 8700, 17850, 8480, "boulder_only"),
    floor("giant_curve_chute_07", 17250, 8880, 17550, 8700, "boulder_only"),
    floor("giant_curve_chute_08", 16950, 9000, 17250, 8880, "boulder_only"),
    floor("giant_curve_chute_09", 16750, 9060, 16950, 9000, "boulder_only"),
    floor("giant_curve_chute_10", 16650, 9080, 16750, 9060, "boulder_only"),
    floor("giant_curve_lower_01", 16720, 9150, 16950, 9200, "boulder_only"),
    floor("giant_curve_lower_02", 16950, 9200, 17400, 9220, "boulder_only"),
    floor("giant_curve_lower_03", 17400, 9220, 18100, 9260, "boulder_only"),
    floor("giant_curve_lower_04", 18100, 9260, 19000, 9370, "boulder_only"),
  ]),
  supportTargets: Object.freeze([
    rect("giant_curve_support_entry", 19320, 7440, 100, 420, "boulder_support", "fork"),
    rect("giant_curve_support_gentle", 18780, 7600, 110, 520, "boulder_support", "rib"),
    rect("giant_curve_support_steep_a", 18080, 7850, 120, 620, "boulder_support", "curved_truss"),
    rect("giant_curve_support_steep_b", 17420, 8220, 120, 650, "boulder_support", "split_column"),
    rect("giant_curve_support_bottom", 16580, 8570, 130, 500, "boulder_support", "turn_cradle"),
    rect("giant_curve_support_return", 17280, 8690, 110, 520, "boulder_support", "lower_rib"),
    rect("giant_curve_support_handoff", 18480, 8780, 110, 480, "boulder_support", "bridge_arch"),
  ]),
  cameraOverview: Object.freeze({
    x: 18300,
    y: 8420,
    zoom: 0.38,
    enterX: 19700,
    exitX: 18850,
  }),
  milestones: Object.freeze({
    enteredX: 19720,
    upperGapTakeoffX: 18965,
    upperGapLandingX: 18810,
    steepCommitX: 17340,
    dropLipX: 16920,
    lowerLandingX: 17100,
    lowerLandingY: 8780,
    completionX: 18950,
    completionY: 8980,
    requiredUpperJumps: 1,
    requiredDirectionChanges: 1,
    requiredNaturalDrops: 1,
  }),
});

const pathPoints = Object.freeze([
  ...PASS13_CHASE.path.points,
  ...PASS14_ZONE.boulderCorridor.points.slice(1),
]);
const cumulativeDistances = [0];
for (let index = 1; index < pathPoints.length; index += 1) {
  const previous = pathPoints[index - 1];
  const current = pathPoints[index];
  cumulativeDistances.push(cumulativeDistances.at(-1) + Math.hypot(current.x - previous.x, current.y - previous.y));
}

const zone14StartIndex = PASS13_CHASE.path.points.length - 1;
const nearestPass14Distance = (x, y) => {
  let best = { gap: Number.POSITIVE_INFINITY, pathDistance: PASS13_CHASE.path.totalDistance };
  for (let index = zone14StartIndex; index < pathPoints.length - 1; index += 1) {
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

const collapsePanels = Object.freeze([
  ...PASS13_CHASE.collapsePanels,
  ...PASS14_ZONE.floors.map(item => Object.freeze({
    id: `collapse_${item.id}`,
    floorId: item.id,
    zone: 9,
    lane: item.lane,
    triggerDistance: nearestPass14Distance((item.x1 + item.x2) * 0.5, (item.y1 + item.y2) * 0.5) +
      (item.lane === "lower_return" ? PASS14_ZONE.lowerCollapseDelay : 0),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

const supportTargets = Object.freeze([
  ...PASS13_CHASE.supportTargets,
  ...PASS14_ZONE.supportTargets.map(item => Object.freeze({
    ...item,
    triggerDistance: nearestPass14Distance(item.x + item.width * 0.5, item.y + item.height * 0.5),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

export const PASS14_CHASE = Object.freeze({
  id: "pass14_chase_through_giant_curve_turn",
  activeBoulder: true,
  path: Object.freeze({
    points: pathPoints,
    cumulativeDistances: Object.freeze(cumulativeDistances),
    totalDistance: cumulativeDistances.at(-1),
    pass13EndDistance: PASS13_CHASE.path.totalDistance,
    pass12EndDistance: PASS13_CHASE.path.pass12EndDistance,
    pass11EndDistance: PASS13_CHASE.path.pass11EndDistance,
    pass10EndDistance: PASS13_CHASE.path.pass10EndDistance,
    pass09EndDistance: PASS13_CHASE.path.pass09EndDistance,
    pass08EndDistance: PASS13_CHASE.path.pass08EndDistance,
    zone05EndDistance: PASS13_CHASE.path.zone05EndDistance,
    curveApexDistance: PASS13_CHASE.path.curveApexDistance,
    giantCurveBottomDistance: cumulativeDistances[81],
    giantCurveLandingDistance: cumulativeDistances[83],
  }),
  boulder: Object.freeze({
    ...PASS13_CHASE.boulder,
    internalBreakpoints: Object.freeze([
      ...PASS13_CHASE.boulder.internalBreakpoints,
      Object.freeze({ distance: cumulativeDistances[72], delayFrames: 100 }),
      Object.freeze({ distance: cumulativeDistances[80], delayFrames: 80 }),
      Object.freeze({ distance: cumulativeDistances[83], delayFrames: 60 }),
    ]),
  }),
  collapsePanels,
  supportTargets,
  completion: Object.freeze({
    playerX: PASS14_ZONE.milestones.completionX,
    playerY: PASS14_ZONE.milestones.completionY,
    minimumBoulderProgress: 0.99,
  }),
});

export const PASS14_LEVEL = Object.freeze({
  ...PASS13_LEVEL,
  id: "pass14_playable_giant_curved_direction_change",
  bounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 9500 }),
  cameraBounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 9500 }),
  exit: PASS14_ZONE.exit,
  floors: Object.freeze([...PASS13_LEVEL.floors, ...PASS14_ZONE.floors]),
  solids: Object.freeze([...PASS13_LEVEL.solids, ...PASS14_ZONE.solids]),
  zone09GiantCurveFrames: PASS14_ZONE.frames,
  zone09GiantCurveCorridor: PASS14_ZONE.boulderCorridor,
  zone09GiantCurveBoulderFloors: PASS14_ZONE.boulderFloors,
  zone09GiantCurveSupports: PASS14_ZONE.supportTargets,
  activeChase: PASS14_CHASE,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
const pointInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x <= bounds.x + bounds.width && item.y <= bounds.y + bounds.height;
const floorInBounds = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height;
const rectInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x + item.width <= bounds.x + bounds.width && item.y + item.height <= bounds.y + bounds.height;

export function validatePass14Level() {
  const zone = PASS14_ZONE;
  const chase = PASS14_CHASE;
  const zone09 = ZONES[8];
  const bridge = ZONES[9];
  const upperGap = zone.upperGap.x2 - zone.upperGap.x1;
  const jumpFlight = (PLAYER_PHYSICS.jumpSpeed * 2) / PLAYER_PHYSICS.gravity;
  const fullJumpReach = PLAYER_PHYSICS.runSpeed * jumpFlight + PLAYER_PHYSICS.width;
  const dropHeight = zone.naturalDrop.landing.y - zone.naturalDrop.lip.y;
  const extension = chase.path.points.slice(zone14StartIndex);
  const descendingSlopes = extension.slice(1, 7).map((item, index) => Math.abs((item.y - extension[index].y) / (item.x - extension[index].x)));
  const playerDirections = zone.playerRoute.slice(1).map((item, index) => Math.sign(item.x - zone.playerRoute[index].x));
  const corridorDirections = zone.boulderCorridor.points.slice(1).map((item, index) => Math.sign(item.x - zone.boulderCorridor.points[index].x));
  const chaseFloorIds = PASS14_LEVEL.floors.filter(item => item.zone >= 5 && item.zone <= 9).map(item => item.id);
  const panelIds = new Set(chase.collapsePanels.map(item => item.floorId));
  const checks = [
    { id: "pass13_level_retained", passed: PASS14_LEVEL.zone09PrecisionHazards === PASS13_LEVEL.zone09PrecisionHazards && PASS14_LEVEL.zone09DashSpikeBed === PASS13_LEVEL.zone09DashSpikeBed },
    { id: "entry_matches_pass13", passed: zone.entry.x === PASS13_LEVEL.exit.x && zone.entry.y === PASS13_LEVEL.exit.y },
    { id: "entry_inside_zone09", passed: pointInBounds(zone.entry, zone09.bounds) },
    { id: "exit_matches_zone09_blueprint", passed: zone.exit.x === zone09.exit.x && zone.exit.y === zone09.exit.y },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "ten_player_route_points", passed: zone.playerRoute.length === 10 && zone.playerRoute.every(pointInWorld) },
    { id: "player_route_matches_endpoints", passed: zone.playerRoute[0].x === zone.entry.x && zone.playerRoute[0].y === zone.entry.y && zone.playerRoute.at(-1).x === zone.exit.x && zone.playerRoute.at(-1).y === zone.exit.y },
    { id: "player_route_reverses_once", passed: playerDirections.filter((direction, index) => index > 0 && direction !== playerDirections[index - 1]).length === 1 },
    { id: "seven_player_floors", passed: zone.floors.length === 7 && zone.floors.every(item => floorInBounds(item, PASS14_LEVEL.bounds)) },
    { id: "one_hundred_twenty_pixel_upper_gap", passed: upperGap === 120 },
    { id: "normal_jump_clears_upper_gap", passed: fullJumpReach > upperGap + 50 },
    { id: "upper_gap_has_no_safety_floor", passed: zone.upperGap.noLowerSafetyFloor && zone.upperGap.lowerRouteRequiresNaturalDrop && !zone.floors.slice(0, 4).some(item => item.x1 <= 18860 && item.x2 >= 18860) },
    { id: "upper_route_continuously_descends", passed: zone.floors.slice(0, 4).every(item => item.y1 > item.y2) },
    { id: "natural_drop_in_range", passed: dropHeight >= zone.naturalDrop.minimumDrop && dropHeight <= zone.naturalDrop.maximumDrop },
    { id: "lower_landing_below_lip", passed: zone.floors[4].y1 > zone.floors[3].y1 && zone.floors[4].x1 < zone.naturalDrop.lip.x },
    { id: "lower_route_rolls_right_and_down", passed: zone.floors.slice(4).every(item => item.x2 > item.x1 && item.y2 >= item.y1) },
    { id: "lower_route_collapse_delayed", passed: zone.lowerCollapseDelay === 420 },
    { id: "no_indefinite_high_ledge", passed: zone.floors.slice(0, 4).every(item => item.y1 !== item.y2 && item.x2 - item.x1 <= 880) },
    { id: "four_architecture_solids", passed: zone.solids.length === 4 && zone.solids.every(item => rectInBounds(item, PASS14_LEVEL.bounds)) },
    { id: "six_architecture_frames", passed: zone.frames.length === 6 && zone.frames.every(item => rectInBounds(item, PASS14_LEVEL.bounds)) },
    { id: "wide_visible_boulder_corridor", passed: zone.boulderCorridor.width === 420 && zone.boulderCorridor.width > chase.boulder.radius * 2 },
    { id: "sixteen_corridor_points", passed: zone.boulderCorridor.points.length === 16 && zone.boulderCorridor.points.every(pointInWorld) },
    { id: "corridor_starts_below_shared_entry", passed: zone.boulderCorridor.points[0].x === zone.entry.x && zone.boulderCorridor.points[0].y - zone.entry.y === 120 },
    { id: "corridor_finishes_below_player_exit", passed: zone.boulderCorridor.points.at(-1).x === zone.exit.x && zone.boulderCorridor.points.at(-1).y > zone.exit.y },
    { id: "smooth_corridor_segments", passed: extension.slice(1).every((item, index) => Math.hypot(item.x - extension[index].x, item.y - extension[index].y) < 950) },
    { id: "curve_progressively_steepens", passed: descendingSlopes.slice(1).every((slope, index) => slope > descendingSlopes[index]) },
    { id: "corridor_direction_reverses_once", passed: corridorDirections.filter((direction, index) => index > 0 && direction !== corridorDirections[index - 1]).length === 1 },
    { id: "short_visible_boulder_fall", passed: Math.abs(zone.boulderCorridor.points[11].x - zone.boulderCorridor.points[10].x) <= 80 && zone.boulderCorridor.points[11].y - zone.boulderCorridor.points[10].y === 70 },
    { id: "lower_boulder_lane_rolls_right", passed: zone.boulderCorridor.points.slice(11).every((item, index, items) => index === 0 || (item.x > items[index - 1].x && item.y >= items[index - 1].y)) },
    { id: "fourteen_visible_boulder_floors", passed: zone.boulderFloors.length === 14 && zone.boulderFloors.every(item => floorInBounds(item, PASS14_LEVEL.bounds)) },
    { id: "boulder_floor_gap_matches_fall", passed: zone.boulderFloors[9].x1 === 16650 && zone.boulderFloors[10].x1 === 16720 && zone.boulderFloors[10].y1 - zone.boulderFloors[9].y1 === 70 },
    { id: "boulder_floor_offset_matches_radius", passed: zone.boulderCorridor.floorOffset >= chase.boulder.radius && zone.boulderCorridor.floorOffset <= chase.boulder.radius + 12 },
    { id: "seven_destructible_supports", passed: zone.supportTargets.length === 7 && zone.supportTargets.every(item => rectInBounds(item, PASS14_LEVEL.bounds)) },
    { id: "extended_chase_path", passed: chase.path.points.length === 87 && chase.path.totalDistance > PASS13_CHASE.path.totalDistance + 5000 },
    { id: "strict_chase_distances", passed: chase.path.cumulativeDistances.every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "all_player_floors_collapsible", passed: chase.collapsePanels.length === chaseFloorIds.length && chaseFloorIds.every(id => panelIds.has(id)) },
    { id: "sixty_eight_collapse_panels", passed: chase.collapsePanels.length === 68 },
    { id: "forty_nine_supports", passed: chase.supportTargets.length === 49 },
    { id: "three_new_curve_breakpoints", passed: chase.boulder.internalBreakpoints.length === 18 && chase.boulder.internalBreakpoints.slice(-3).every(item => item.distance > PASS13_CHASE.path.totalDistance) },
    { id: "completion_requires_full_curve_sequence", passed: zone.milestones.requiredUpperJumps === 1 && zone.milestones.requiredNaturalDrops === 1 && zone.milestones.requiredDirectionChanges === 1 && chase.completion.minimumBoulderProgress >= 0.99 },
    { id: "camera_has_wide_curve_overview", passed: zone.cameraOverview.zoom <= 0.4 && zone.cameraOverview.x > 17000 && zone.cameraOverview.y > 8000 },
    { id: "bridge_handoff_matches_zone10", passed: bridge.entry.x === zone.exit.x && bridge.entry.y === zone.exit.y },
    { id: "level_inside_world", passed: PASS14_LEVEL.bounds.x >= WORLD.cameraBounds.x && PASS14_LEVEL.bounds.y >= WORLD.cameraBounds.y && PASS14_LEVEL.bounds.x + PASS14_LEVEL.bounds.width <= WORLD.cameraBounds.x + WORLD.cameraBounds.width && PASS14_LEVEL.bounds.y + PASS14_LEVEL.bounds.height <= WORLD.cameraBounds.y + WORLD.cameraBounds.height },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    upperGap,
    fullJumpReach,
    dropHeight,
    descendingSlopes: Object.freeze(descendingSlopes),
    totalDistance: chase.path.totalDistance,
    extensionDistance: chase.path.totalDistance - PASS13_CHASE.path.totalDistance,
    collapsePanelCount: chase.collapsePanels.length,
    supportTargetCount: chase.supportTargets.length,
    checks: Object.freeze(checks),
  });
}
