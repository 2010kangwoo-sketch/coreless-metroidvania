import { WORLD } from "./blueprint.js";
import { PASS06_ZONE } from "./pass06-level.js";
import { PASS07_LEVEL, PASS07_ZONE } from "./pass07-level.js";

const point = (x, y) => Object.freeze({ x, y });

const routePoints = Object.freeze([
  ...PASS06_ZONE.collapseCorridor.points.map(item => point(item.x, item.y)),
  ...PASS07_ZONE.boulderCurve.points.slice(1).map(item => point(item.x, item.y)),
]);

const cumulativeDistances = [0];
for (let index = 1; index < routePoints.length; index += 1) {
  const previous = routePoints[index - 1];
  const current = routePoints[index];
  cumulativeDistances.push(cumulativeDistances.at(-1) + Math.hypot(current.x - previous.x, current.y - previous.y));
}

const nearestRouteDistance = (x, y, startSegment, endSegment) => {
  let best = { distance: Number.POSITIVE_INFINITY, pathDistance: 0 };
  for (let index = startSegment; index <= endSegment; index += 1) {
    const start = routePoints[index];
    const end = routePoints[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const ratio = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared));
    const nearestX = start.x + dx * ratio;
    const nearestY = start.y + dy * ratio;
    const distance = Math.hypot(x - nearestX, y - nearestY);
    if (distance < best.distance) {
      best = {
        distance,
        pathDistance: cumulativeDistances[index] + Math.hypot(nearestX - start.x, nearestY - start.y),
      };
    }
  }
  return best.pathDistance;
};

const collapsePanels = Object.freeze(PASS07_LEVEL.floors
  .filter(item => item.zone === 5 || item.zone === 6)
  .map(item => {
    const midpointX = (item.x1 + item.x2) * 0.5;
    const midpointY = (item.y1 + item.y2) * 0.5;
    const segmentRange = item.zone === 5
      ? [0, PASS06_ZONE.collapseCorridor.points.length - 2]
      : item.lane === "upper"
        ? [PASS06_ZONE.collapseCorridor.points.length - 1, 13]
        : [14, routePoints.length - 2];
    return Object.freeze({
      id: `collapse_${item.id}`,
      floorId: item.id,
      zone: item.zone,
      lane: item.lane ?? "main",
      triggerDistance: nearestRouteDistance(midpointX, midpointY, segmentRange[0], segmentRange[1]),
    });
  })
  .sort((a, b) => a.triggerDistance - b.triggerDistance));

const supportTargets = Object.freeze([
  ...PASS06_ZONE.corridorSupports.map(item => Object.freeze({
    id: item.id,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    kind: item.shape,
    triggerDistance: nearestRouteDistance(item.x + item.width * 0.5, item.y + item.height * 0.5, 0, 8),
  })),
  ...PASS07_ZONE.frames.map((item, index) => {
    const range = index === 0 ? [9, 14] : [14, routePoints.length - 2];
    return Object.freeze({
      id: `curve_support_${index + 1}`,
      x: item.x + item.width * 0.45,
      y: item.y + item.height * 0.2,
      width: Math.max(82, Math.min(150, item.width * 0.07)),
      height: Math.max(260, item.height * 0.62),
      kind: item.kind,
      triggerDistance: nearestRouteDistance(item.x + item.width * 0.5, item.y + item.height * 0.6, range[0], range[1]),
    });
  }),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

export const PASS08_CHASE = Object.freeze({
  id: "pass08_active_boulder_chase",
  activeBoulder: true,
  path: Object.freeze({
    points: routePoints,
    cumulativeDistances: Object.freeze(cumulativeDistances),
    totalDistance: cumulativeDistances.at(-1),
    zone05EndDistance: cumulativeDistances[PASS06_ZONE.collapseCorridor.points.length - 1],
    curveApexDistance: cumulativeDistances[14],
  }),
  boulder: Object.freeze({
    radius: 92,
    spawnDelayFrames: 220,
    baseSpeed: 5.6,
    maximumSpeed: 6.05,
    accelerationPerFrame: 0.000085,
    contactPadding: 14,
    floorCollapseLag: 175,
    supportBreakLag: 30,
  }),
  collapsePanels,
  supportTargets,
  completion: Object.freeze({
    playerX: PASS07_ZONE.milestones.completionX,
    playerY: PASS07_ZONE.milestones.completionY,
    minimumBoulderProgress: 0.88,
  }),
});

export const PASS08_LEVEL = Object.freeze({
  ...PASS07_LEVEL,
  id: "pass08_playable_active_chase",
  activeChase: PASS08_CHASE,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;

export function validatePass08Level() {
  const chase = PASS08_CHASE;
  const points = chase.path.points;
  const distances = chase.path.cumulativeDistances;
  const panelIds = new Set(chase.collapsePanels.map(item => item.floorId));
  const chaseFloorIds = PASS08_LEVEL.floors.filter(item => item.zone === 5 || item.zone === 6).map(item => item.id);
  const checks = [
    { id: "pass07_level_retained", passed: PASS08_LEVEL.floors === PASS07_LEVEL.floors && PASS08_LEVEL.boulderCurve === PASS07_LEVEL.boulderCurve },
    { id: "active_boulder", passed: chase.activeBoulder === true },
    { id: "single_combined_path", passed: points.length === 30 },
    { id: "path_points_in_world", passed: points.every(pointInWorld) },
    { id: "zone05_to_zone06_join", passed: points[9].x === PASS07_ZONE.entry.x && points[9].y === PASS07_ZONE.entry.y },
    { id: "path_starts_on_zone05_floor", passed: points[0].x === PASS06_ZONE.entry.x },
    { id: "path_ends_at_zone06_exit", passed: points.at(-1).x === PASS07_ZONE.exit.x && points.at(-1).y === PASS07_ZONE.exit.y },
    { id: "strict_cumulative_distance", passed: distances.length === points.length && distances.every((value, index) => index === 0 || value > distances[index - 1]) },
    { id: "long_chase_route", passed: chase.path.totalDistance > 30000 },
    { id: "physical_curve_apex", passed: points[14].x === 26000 && points[14].y === 5450 },
    { id: "one_direction_change", passed: points.slice(1, 15).every((item, index) => item.x >= points[index].x) && points.slice(15).every((item, index) => item.x < points[index + 14].x) },
    { id: "boulder_radius_fits_corridors", passed: chase.boulder.radius * 2 < PASS06_ZONE.collapseCorridor.width && chase.boulder.radius * 2 < PASS07_ZONE.boulderCurve.width },
    { id: "bounded_spawn_delay", passed: chase.boulder.spawnDelayFrames >= 180 && chase.boulder.spawnDelayFrames <= 260 },
    { id: "bounded_speed", passed: chase.boulder.baseSpeed > 5 && chase.boulder.maximumSpeed < 6.5 && chase.boulder.baseSpeed < chase.boulder.maximumSpeed },
    { id: "all_chase_floors_collapsible", passed: chase.collapsePanels.length === chaseFloorIds.length && chaseFloorIds.every(id => panelIds.has(id)) },
    { id: "collapse_triggers_ordered", passed: chase.collapsePanels.every((item, index) => index === 0 || item.triggerDistance >= chase.collapsePanels[index - 1].triggerDistance) },
    { id: "thirteen_support_targets", passed: chase.supportTargets.length === 13 },
    { id: "support_triggers_ordered", passed: chase.supportTargets.every((item, index) => index === 0 || item.triggerDistance >= chase.supportTargets[index - 1].triggerDistance) },
    { id: "supports_before_route_end", passed: chase.supportTargets.every(item => item.triggerDistance >= 0 && item.triggerDistance < chase.path.totalDistance) },
    { id: "completion_near_route_end", passed: chase.completion.minimumBoulderProgress >= 0.85 && chase.completion.minimumBoulderProgress < 1 },
    { id: "completion_matches_pass07", passed: chase.completion.playerX === PASS07_ZONE.milestones.completionX && chase.completion.playerY === PASS07_ZONE.milestones.completionY },
    { id: "gaps_remain_physical", passed: PASS07_ZONE.dashGaps.length === 3 && points.some(item => item.x === 22430) && points.some(item => item.x === 19030) && points.some(item => item.x === 15720) },
    { id: "no_teleport_segments", passed: points.slice(1).every((item, index) => Math.hypot(item.x - points[index].x, item.y - points[index].y) < 1900) },
    { id: "reserved_flags_unchanged", passed: PASS06_ZONE.collapseCorridor.activeBoulder === false && PASS07_ZONE.boulderCurve.activeBoulder === false },
  ];

  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    totalDistance: chase.path.totalDistance,
    collapsePanelCount: chase.collapsePanels.length,
    supportTargetCount: chase.supportTargets.length,
    checks: Object.freeze(checks),
  });
}
