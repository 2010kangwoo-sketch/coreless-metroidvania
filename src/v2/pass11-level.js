import { WORLD, ZONES } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS10_CHASE, PASS10_LEVEL } from "./pass10-level.js";

const point = (x, y) => Object.freeze({ x, y });
const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, zone: 9, lane });
const rect = (id, x, y, width, height, role, kind = role) => Object.freeze({ id, x, y, width, height, role, kind });
const frame = (id, x, y, width, height, kind) => Object.freeze({ id, x, y, width, height, kind });
const anchor = (id, order, x, y, attachRadius, ropeLength) => Object.freeze({ id, order, x, y, attachRadius, ropeLength });

export const PASS11_ZONE = Object.freeze({
  id: "pass11_chase_triple_grapple",
  entry: PASS10_LEVEL.exit,
  exit: Object.freeze({ x: 22400, y: 6900 }),
  surfaceCeilingY: PASS10_LEVEL.exit.y,
  playerRoute: Object.freeze([
    point(23600, 5900),
    point(24350, 6020),
    point(24850, 6300),
    point(24400, 6650),
    point(23550, 6800),
    point(22400, 6900),
  ]),
  floors: Object.freeze([
    floor("grapple_launch_ramp", 24200, 5900, 24440, 6040, "launch"),
    floor("grapple_exit_shelf", 22000, 6900, 22850, 6900, "exit_shelf"),
  ]),
  anchors: Object.freeze([
    anchor("grapple_anchor_one", 1, 24500, 5700, 690, 430),
    anchor("grapple_anchor_two", 2, 24900, 6150, 760, 500),
    anchor("grapple_anchor_three", 3, 23600, 6400, 1000, 520),
  ]),
  solids: Object.freeze([
    rect("grapple_launch_arch", 24000, 5480, 700, 60, "zone09_arch", "fractured_arch"),
    rect("grapple_exit_arch", 22000, 5700, 800, 70, "zone09_arch", "split_arch"),
  ]),
  frames: Object.freeze([
    frame("grapple_frame_launch", 23600, 5500, 1100, 900, "launch_vault"),
    frame("grapple_frame_high", 24200, 5480, 1800, 1050, "hanging_ribs"),
    frame("grapple_frame_turn", 24500, 5920, 1500, 1250, "turning_void"),
    frame("grapple_frame_lower", 23100, 6200, 2600, 1050, "lower_void"),
    frame("grapple_frame_exit", 21900, 6500, 1800, 760, "exit_vault"),
  ]),
  boulderCorridor: Object.freeze({
    width: 420,
    points: Object.freeze([
      point(23600, 5900),
      point(24200, 6020),
      point(24800, 6300),
      point(25050, 6700),
      point(24600, 7100),
      point(23600, 7200),
      point(22400, 6900),
    ]),
  }),
  boulderFloors: Object.freeze([
    floor("grapple_chute_a", 23600, 6160, 24200, 6280, "boulder_only"),
    floor("grapple_chute_b", 24200, 6280, 24800, 6560, "boulder_only"),
    floor("grapple_chute_c", 24800, 6560, 25050, 6960, "boulder_only"),
    floor("grapple_chute_d", 24600, 7360, 25050, 6960, "boulder_only"),
    floor("grapple_chute_e", 23600, 7460, 24600, 7360, "boulder_only"),
    floor("grapple_chute_f", 22400, 7160, 23600, 7460, "boulder_only"),
  ]),
  supportTargets: Object.freeze([
    rect("grapple_support_launch", 24040, 5840, 100, 620, "boulder_support", "fork"),
    rect("grapple_support_high", 24500, 6040, 110, 650, "boulder_support", "rib"),
    rect("grapple_support_apex", 24900, 6320, 120, 700, "boulder_support", "split"),
    rect("grapple_support_turn", 24600, 6800, 110, 620, "boulder_support", "truss"),
    rect("grapple_support_lower", 23600, 6900, 120, 650, "boulder_support", "column"),
    rect("grapple_support_exit", 22750, 6650, 100, 620, "boulder_support", "arch"),
  ]),
  milestones: Object.freeze({
    enteredX: 24210,
    launchEdgeX: 24420,
    completionX: 22440,
    completionY: 6880,
    minimumUniqueAnchors: 3,
  }),
});

const pathPoints = Object.freeze([
  ...PASS10_CHASE.path.points,
  ...PASS11_ZONE.boulderCorridor.points.slice(1),
]);
const cumulativeDistances = [0];
for (let index = 1; index < pathPoints.length; index += 1) {
  const previous = pathPoints[index - 1];
  const current = pathPoints[index];
  cumulativeDistances.push(cumulativeDistances.at(-1) + Math.hypot(current.x - previous.x, current.y - previous.y));
}

const zone09StartIndex = PASS10_CHASE.path.points.length - 1;
const nearestZone09Distance = (x, y) => {
  let best = { gap: Number.POSITIVE_INFINITY, pathDistance: PASS10_CHASE.path.totalDistance };
  for (let index = zone09StartIndex; index < pathPoints.length - 1; index += 1) {
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
  ...PASS10_CHASE.collapsePanels,
  ...PASS11_ZONE.floors.map(item => Object.freeze({
    id: `collapse_${item.id}`,
    floorId: item.id,
    zone: 9,
    lane: item.lane,
    triggerDistance: nearestZone09Distance((item.x1 + item.x2) * 0.5, (item.y1 + item.y2) * 0.5),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

const supportTargets = Object.freeze([
  ...PASS10_CHASE.supportTargets,
  ...PASS11_ZONE.supportTargets.map(item => Object.freeze({
    ...item,
    triggerDistance: nearestZone09Distance(item.x + item.width * 0.5, item.y + item.height * 0.5),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

export const PASS11_CHASE = Object.freeze({
  id: "pass11_chase_through_triple_grapple",
  activeBoulder: true,
  path: Object.freeze({
    points: pathPoints,
    cumulativeDistances: Object.freeze(cumulativeDistances),
    totalDistance: cumulativeDistances.at(-1),
    pass10EndDistance: PASS10_CHASE.path.totalDistance,
    pass09EndDistance: PASS10_CHASE.path.pass09EndDistance,
    pass08EndDistance: PASS10_CHASE.path.pass08EndDistance,
    zone05EndDistance: PASS10_CHASE.path.zone05EndDistance,
    curveApexDistance: PASS10_CHASE.path.curveApexDistance,
  }),
  boulder: Object.freeze({
    ...PASS10_CHASE.boulder,
    internalBreakpoints: Object.freeze([
      ...PASS10_CHASE.boulder.internalBreakpoints,
      Object.freeze({ distance: cumulativeDistances[53], delayFrames: 90 }),
      Object.freeze({ distance: cumulativeDistances[55], delayFrames: 45 }),
      Object.freeze({ distance: cumulativeDistances[57], delayFrames: 75 }),
    ]),
  }),
  collapsePanels,
  supportTargets,
  completion: Object.freeze({
    playerX: PASS11_ZONE.milestones.completionX,
    playerY: PASS11_ZONE.milestones.completionY,
    minimumBoulderProgress: 0.965,
  }),
});

export const PASS11_LEVEL = Object.freeze({
  ...PASS10_LEVEL,
  id: "pass11_playable_chase_triple_grapple",
  exit: PASS11_ZONE.exit,
  floors: Object.freeze([...PASS10_LEVEL.floors, ...PASS11_ZONE.floors]),
  solids: Object.freeze([...PASS10_LEVEL.solids, ...PASS11_ZONE.solids]),
  zone09Frames: PASS11_ZONE.frames,
  zone09Anchors: PASS11_ZONE.anchors,
  zone09BoulderCorridor: PASS11_ZONE.boulderCorridor,
  zone09BoulderFloors: PASS11_ZONE.boulderFloors,
  zone09Supports: PASS11_ZONE.supportTargets,
  activeChase: PASS11_CHASE,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
const pointInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x <= bounds.x + bounds.width && item.y <= bounds.y + bounds.height;
const floorInBounds = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height;
const rectInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x + item.width <= bounds.x + bounds.width && item.y + item.height <= bounds.y + bounds.height;

export function validatePass11Level() {
  const zone = PASS11_ZONE;
  const chase = PASS11_CHASE;
  const zone09 = ZONES[8];
  const directHorizontalGap = zone.entry.x - zone.floors[1].x2;
  const dashDistance = PLAYER_PHYSICS.dashSpeed * PLAYER_PHYSICS.dashFrames;
  const noGrappleAirReach = PLAYER_PHYSICS.runSpeed * 60 + dashDistance;
  const chaseFloorIds = PASS11_LEVEL.floors.filter(item => item.zone >= 5 && item.zone <= 9).map(item => item.id);
  const panelIds = new Set(chase.collapsePanels.map(item => item.floorId));
  const extension = chase.path.points.slice(zone09StartIndex);
  const checks = [
    { id: "pass10_level_retained", passed: PASS11_LEVEL.zone08Frames === PASS10_LEVEL.zone08Frames && PASS11_LEVEL.roof === PASS10_LEVEL.roof },
    { id: "entry_matches_pass10", passed: zone.entry.x === PASS10_LEVEL.exit.x && zone.entry.y === PASS10_LEVEL.exit.y },
    { id: "entry_matches_zone09", passed: zone.entry.x === zone09.entry.x && zone.entry.y === zone09.entry.y },
    { id: "exit_inside_zone09", passed: pointInBounds(zone.exit, zone09.bounds) },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "surface_ceiling_matches_entry", passed: zone.surfaceCeilingY === zone.entry.y },
    { id: "six_player_route_points", passed: zone.playerRoute.length === 6 && zone.playerRoute.every(pointInWorld) },
    { id: "route_matches_endpoints", passed: zone.playerRoute[0].x === zone.entry.x && zone.playerRoute[0].y === zone.entry.y && zone.playerRoute.at(-1).x === zone.exit.x && zone.playerRoute.at(-1).y === zone.exit.y },
    { id: "two_player_floors", passed: zone.floors.length === 2 && zone.floors.every(item => floorInBounds(item, PASS11_LEVEL.bounds)) },
    { id: "no_direct_floor_bridge", passed: directHorizontalGap >= 700 && directHorizontalGap > noGrappleAirReach },
    { id: "three_ordered_anchors", passed: zone.anchors.length === 3 && zone.anchors.every((item, index) => item.order === index + 1) },
    { id: "unique_anchor_ids", passed: new Set(zone.anchors.map(item => item.id)).size === 3 },
    { id: "anchors_inside_zone", passed: zone.anchors.every(item => pointInBounds(item, zone09.bounds)) },
    { id: "anchor_ranges", passed: zone.anchors.every(item => item.attachRadius >= 650 && item.attachRadius <= 1200 && item.ropeLength >= 400 && item.ropeLength <= 540) },
    { id: "first_anchor_reachable_from_launch", passed: Math.hypot(zone.anchors[0].x - zone.floors[0].x2, zone.anchors[0].y - zone.floors[0].y2) < zone.anchors[0].attachRadius },
    { id: "anchor_chain_overlaps", passed: zone.anchors.slice(1).every((item, index) => Math.hypot(item.x - zone.anchors[index].x, item.y - zone.anchors[index].y) < item.attachRadius + zone.anchors[index].ropeLength) },
    { id: "two_arch_solids", passed: zone.solids.length === 2 && zone.solids.every(item => rectInBounds(item, PASS11_LEVEL.bounds)) },
    { id: "five_architecture_frames", passed: zone.frames.length === 5 && zone.frames.every(item => rectInBounds(item, PASS11_LEVEL.bounds)) },
    { id: "wide_boulder_corridor", passed: zone.boulderCorridor.width >= 420 && zone.boulderCorridor.width > chase.boulder.radius * 2 },
    { id: "seven_corridor_points", passed: zone.boulderCorridor.points.length === 7 && zone.boulderCorridor.points.every(pointInWorld) },
    { id: "corridor_matches_entry_exit", passed: zone.boulderCorridor.points[0].x === zone.entry.x && zone.boulderCorridor.points.at(-1).x === zone.exit.x && zone.boulderCorridor.points.at(-1).y === zone.exit.y },
    { id: "smooth_corridor_segments", passed: extension.slice(1).every((item, index) => Math.hypot(item.x - extension[index].x, item.y - extension[index].y) < 1500) },
    { id: "six_visible_chute_floors", passed: zone.boulderFloors.length === 6 && zone.boulderFloors.every(item => floorInBounds(item, PASS11_LEVEL.bounds)) },
    { id: "six_destructible_supports", passed: zone.supportTargets.length === 6 && zone.supportTargets.every(item => rectInBounds(item, PASS11_LEVEL.bounds)) },
    { id: "extended_chase_path", passed: chase.path.points.length === 59 && chase.path.totalDistance > PASS10_CHASE.path.totalDistance + 4000 },
    { id: "strict_chase_distances", passed: chase.path.cumulativeDistances.every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "all_player_floors_collapsible", passed: chase.collapsePanels.length === chaseFloorIds.length && chaseFloorIds.every(id => panelIds.has(id)) },
    { id: "thirty_three_supports", passed: chase.supportTargets.length === 33 },
    { id: "three_new_breakpoints", passed: chase.boulder.internalBreakpoints.length === 10 && chase.boulder.internalBreakpoints.slice(-3).every(item => item.distance > PASS10_CHASE.path.totalDistance) },
    { id: "completion_requires_three_anchors", passed: zone.milestones.minimumUniqueAnchors === 3 && chase.completion.minimumBoulderProgress >= 0.96 },
    { id: "level_inside_world", passed: PASS11_LEVEL.bounds.x >= WORLD.cameraBounds.x && PASS11_LEVEL.bounds.y >= WORLD.cameraBounds.y && PASS11_LEVEL.bounds.x + PASS11_LEVEL.bounds.width <= WORLD.cameraBounds.x + WORLD.cameraBounds.width && PASS11_LEVEL.bounds.y + PASS11_LEVEL.bounds.height <= WORLD.cameraBounds.y + WORLD.cameraBounds.height },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    directHorizontalGap,
    noGrappleAirReach,
    totalDistance: chase.path.totalDistance,
    extensionDistance: chase.path.totalDistance - PASS10_CHASE.path.totalDistance,
    collapsePanelCount: chase.collapsePanels.length,
    supportTargetCount: chase.supportTargets.length,
    checks: Object.freeze(checks),
  });
}
