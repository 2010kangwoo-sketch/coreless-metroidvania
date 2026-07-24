import { WORLD, ZONES } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS14_CHASE, PASS14_LEVEL, PASS14_ZONE } from "./pass14-level.js";

const point = (x, y) => Object.freeze({ x, y });
const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, zone: 10, phase: 15, lane });
const rect = (id, x, y, width, height, role, kind = role) => Object.freeze({ id, x, y, width, height, role, kind, phase: 15 });

export const PASS15_ZONE = Object.freeze({
  id: "pass15_collapsing_wooden_bridge_finale",
  entry: PASS14_ZONE.exit,
  exit: ZONES[9].exit,
  playerRoute: Object.freeze([
    point(19000, 9000), point(20100, 9100), point(20240, 9115), point(21800, 9260),
    point(21960, 9275), point(23400, 9400), point(23580, 9420), point(24700, 9530), point(25200, 9600),
  ]),
  floors: Object.freeze([
    floor("bridge_deck_01", 19000, 9000, 19550, 9050, "wood_deck"),
    floor("bridge_deck_02", 19550, 9050, 20100, 9100, "wood_deck"),
    floor("bridge_deck_03", 20240, 9115, 20800, 9165, "wood_deck"),
    floor("bridge_deck_04", 20800, 9165, 21450, 9225, "wood_deck"),
    floor("bridge_deck_05", 21450, 9225, 21800, 9260, "wood_deck"),
    floor("bridge_deck_06", 21960, 9275, 22500, 9320, "wood_deck"),
    floor("bridge_deck_07", 22500, 9320, 23150, 9380, "wood_deck"),
    floor("bridge_deck_08", 23150, 9380, 23400, 9400, "wood_deck"),
    floor("bridge_deck_09", 23580, 9420, 24150, 9475, "wood_deck"),
    floor("bridge_deck_10", 24150, 9475, 24700, 9530, "wood_deck"),
    floor("bridge_deck_11", 24700, 9530, 25100, 9585, "wood_deck"),
    floor("bridge_stone_landing", 25100, 9585, 25500, 9630, "final_landing"),
  ]),
  gaps: Object.freeze([
    Object.freeze({ id: "bridge_gap_01", x1: 20100, x2: 20240, width: 140 }),
    Object.freeze({ id: "bridge_gap_02", x1: 21800, x2: 21960, width: 160 }),
    Object.freeze({ id: "bridge_gap_03", x1: 23400, x2: 23580, width: 180 }),
  ]),
  supportTargets: Object.freeze([
    rect("bridge_support_01", 19380, 9060, 90, 430, "wood_bridge_support", "trestle"),
    rect("bridge_support_02", 19900, 9105, 90, 430, "wood_bridge_support", "split_trestle"),
    rect("bridge_support_03", 20580, 9170, 100, 430, "wood_bridge_support", "trestle"),
    rect("bridge_support_04", 21280, 9230, 100, 430, "wood_bridge_support", "split_trestle"),
    rect("bridge_support_05", 22320, 9330, 105, 420, "wood_bridge_support", "trestle"),
    rect("bridge_support_06", 23020, 9390, 105, 390, "wood_bridge_support", "split_trestle"),
    rect("bridge_support_07", 24020, 9480, 110, 310, "wood_bridge_support", "trestle"),
    rect("bridge_support_08", 24600, 9540, 110, 250, "wood_bridge_support", "last_trestle"),
  ]),
  boulderCorridor: Object.freeze({
    width: 420,
    points: Object.freeze([
      point(19000, 9270), point(19800, 9350), point(20600, 9430), point(21400, 9500),
      point(22200, 9580), point(23000, 9650), point(23800, 9700), point(24600, 9740), point(25200, 9800),
    ]),
  }),
  cameraFinale: Object.freeze({ zoom: 0.62, enterX: 19020, exitX: 25100, lead: 0.34 }),
  headStartFrames: 220,
  milestones: Object.freeze({
    enteredX: 19040,
    gapLandings: Object.freeze([20240, 21960, 23580]),
    completionX: 25150,
    completionY: 9570,
    requiredJumps: 3,
    requiredFinalAirDash: true,
  }),
});

const pathPoints = Object.freeze([...PASS14_CHASE.path.points, ...PASS15_ZONE.boulderCorridor.points.slice(1)]);
const cumulativeDistances = [0];
for (let index = 1; index < pathPoints.length; index += 1) {
  const previous = pathPoints[index - 1];
  const current = pathPoints[index];
  cumulativeDistances.push(cumulativeDistances.at(-1) + Math.hypot(current.x - previous.x, current.y - previous.y));
}

const zone15StartIndex = PASS14_CHASE.path.points.length - 1;
const nearestPass15Distance = (x, y) => {
  let best = { gap: Number.POSITIVE_INFINITY, pathDistance: PASS14_CHASE.path.totalDistance };
  for (let index = zone15StartIndex; index < pathPoints.length - 1; index += 1) {
    const start = pathPoints[index];
    const end = pathPoints[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const ratio = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared));
    const nearestX = start.x + dx * ratio;
    const nearestY = start.y + dy * ratio;
    const gap = Math.hypot(x - nearestX, y - nearestY);
    if (gap < best.gap) best = { gap, pathDistance: cumulativeDistances[index] + Math.hypot(nearestX - start.x, nearestY - start.y) };
  }
  return best.pathDistance;
};

const bridgePanels = PASS15_ZONE.floors.filter(item => item.lane === "wood_deck").map(item => Object.freeze({
  id: `collapse_${item.id}`,
  floorId: item.id,
  zone: 10,
  lane: item.lane,
  triggerDistance: nearestPass15Distance((item.x1 + item.x2) * 0.5, (item.y1 + item.y2) * 0.5) + 520,
}));

const collapsePanels = Object.freeze([...PASS14_CHASE.collapsePanels, ...bridgePanels].sort((a, b) => a.triggerDistance - b.triggerDistance));
const supportTargets = Object.freeze([
  ...PASS14_CHASE.supportTargets,
  ...PASS15_ZONE.supportTargets.map(item => Object.freeze({ ...item, triggerDistance: nearestPass15Distance(item.x + item.width * 0.5, item.y) + 380 })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

export const PASS15_CHASE = Object.freeze({
  id: "pass15_final_bridge_collapse_chase",
  activeBoulder: true,
  path: Object.freeze({
    ...PASS14_CHASE.path,
    points: pathPoints,
    cumulativeDistances: Object.freeze(cumulativeDistances),
    totalDistance: cumulativeDistances.at(-1),
    pass14EndDistance: PASS14_CHASE.path.totalDistance,
    bridgePlungeDistance: cumulativeDistances.at(-2),
  }),
  boulder: Object.freeze({
    ...PASS14_CHASE.boulder,
    internalBreakpoints: Object.freeze([
      ...PASS14_CHASE.boulder.internalBreakpoints,
      Object.freeze({ distance: cumulativeDistances[89], delayFrames: 45 }),
      Object.freeze({ distance: cumulativeDistances[92], delayFrames: 30 }),
    ]),
  }),
  collapsePanels,
  supportTargets,
  completion: Object.freeze({ playerX: PASS15_ZONE.milestones.completionX, playerY: PASS15_ZONE.milestones.completionY, minimumBoulderProgress: 0.995 }),
});

export const PASS15_LEVEL = Object.freeze({
  ...PASS14_LEVEL,
  id: "pass15_playable_collapsing_wooden_bridge_finale",
  bounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 9500 }),
  cameraBounds: Object.freeze({ x: 0, y: 300, width: 26000, height: 9500 }),
  exit: PASS15_ZONE.exit,
  floors: Object.freeze([...PASS14_LEVEL.floors, ...PASS15_ZONE.floors]),
  zone10BridgeFloors: PASS15_ZONE.floors,
  zone10BridgeSupports: PASS15_ZONE.supportTargets,
  zone10BoulderCorridor: PASS15_ZONE.boulderCorridor,
  activeChase: PASS15_CHASE,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
const floorInBounds = item => item.x1 >= 0 && item.x2 <= WORLD.width && item.y1 >= 300 && item.y2 <= WORLD.height;
const rectInBounds = item => item.x >= 0 && item.y >= 300 && item.x + item.width <= WORLD.width && item.y + item.height <= WORLD.height;

export function validatePass15Level() {
  const zone = PASS15_ZONE;
  const chase = PASS15_CHASE;
  const bridge = ZONES[9];
  const jumpFlight = (PLAYER_PHYSICS.jumpSpeed * 2) / PLAYER_PHYSICS.gravity;
  const fullJumpReach = PLAYER_PHYSICS.runSpeed * jumpFlight + PLAYER_PHYSICS.width;
  const bridgeFloorIds = zone.floors.filter(item => item.lane === "wood_deck").map(item => item.id);
  const panelIds = new Set(chase.collapsePanels.map(item => item.floorId));
  const checks = [
    { id: "pass14_level_retained", passed: PASS15_LEVEL.zone09GiantCurveCorridor === PASS14_LEVEL.zone09GiantCurveCorridor },
    { id: "entry_matches_pass14", passed: zone.entry.x === PASS14_LEVEL.exit.x && zone.entry.y === PASS14_LEVEL.exit.y },
    { id: "exit_matches_blueprint", passed: zone.exit.x === bridge.exit.x && zone.exit.y === bridge.exit.y },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "nine_route_points", passed: zone.playerRoute.length === 9 && zone.playerRoute.every(pointInWorld) },
    { id: "route_matches_endpoints", passed: zone.playerRoute[0].x === zone.entry.x && zone.playerRoute[0].y === zone.entry.y && zone.playerRoute.at(-1).x === zone.exit.x && zone.playerRoute.at(-1).y === zone.exit.y },
    { id: "twelve_bridge_floors", passed: zone.floors.length === 12 && zone.floors.every(floorInBounds) },
    { id: "eleven_wood_decks", passed: bridgeFloorIds.length === 11 },
    { id: "stone_final_landing", passed: zone.floors.at(-1).lane === "final_landing" && zone.floors.at(-1).x1 <= zone.exit.x && zone.floors.at(-1).x2 > zone.exit.x },
    { id: "three_broken_gaps", passed: zone.gaps.length === 3 && zone.gaps.map(item => item.width).join(",") === "140,160,180" },
    { id: "all_gaps_jumpable", passed: zone.gaps.every(item => item.width + 40 < fullJumpReach) },
    { id: "gaps_increase_toward_finale", passed: zone.gaps.every((item, index, items) => index === 0 || item.width > items[index - 1].width) },
    { id: "no_safety_floor_under_gaps", passed: zone.gaps.every(gap => !zone.floors.some(item => item.x1 < gap.x2 && item.x2 > gap.x1)) },
    { id: "eight_wood_supports", passed: zone.supportTargets.length === 8 && zone.supportTargets.every(rectInBounds) },
    { id: "wide_boulder_corridor", passed: zone.boulderCorridor.width === 420 && zone.boulderCorridor.width > chase.boulder.radius * 2 },
    { id: "nine_boulder_points", passed: zone.boulderCorridor.points.length === 9 && zone.boulderCorridor.points.every(pointInWorld) },
    { id: "corridor_continuous_from_pass14", passed: zone.boulderCorridor.points[0].x === PASS14_CHASE.path.points.at(-1).x && zone.boulderCorridor.points[0].y === PASS14_CHASE.path.points.at(-1).y },
    { id: "corridor_runs_below_bridge", passed: zone.boulderCorridor.points.every((item, index) => index === 0 || item.y >= zone.playerRoute[Math.min(index, zone.playerRoute.length - 1)].y + 120) },
    { id: "final_boulder_plunge", passed: zone.boulderCorridor.points.at(-1).y === PASS15_LEVEL.bounds.y + PASS15_LEVEL.bounds.height && zone.boulderCorridor.points.at(-1).x === zone.exit.x },
    { id: "extended_chase_path", passed: chase.path.points.length === 95 && chase.path.totalDistance > PASS14_CHASE.path.totalDistance + 6000 },
    { id: "strict_chase_distances", passed: chase.path.cumulativeDistances.every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "all_wood_decks_collapsible", passed: bridgeFloorIds.every(id => panelIds.has(id)) },
    { id: "seventy_nine_collapse_panels", passed: chase.collapsePanels.length === 79 },
    { id: "fifty_seven_supports", passed: chase.supportTargets.length === 57 },
    { id: "two_bridge_breakpoints", passed: chase.boulder.internalBreakpoints.length === 20 && chase.boulder.internalBreakpoints.slice(-2).every(item => item.distance > PASS14_CHASE.path.totalDistance) },
    { id: "bridge_head_start", passed: zone.headStartFrames >= 180 },
    { id: "completion_requires_three_jumps_and_final_dash", passed: zone.milestones.requiredJumps === 3 && zone.milestones.requiredFinalAirDash && chase.completion.minimumBoulderProgress >= 0.995 },
    { id: "finale_camera", passed: zone.cameraFinale.zoom >= 0.55 && zone.cameraFinale.zoom <= 0.7 },
    { id: "level_inside_world", passed: PASS15_LEVEL.bounds.x + PASS15_LEVEL.bounds.width <= WORLD.width && PASS15_LEVEL.bounds.y + PASS15_LEVEL.bounds.height <= WORLD.height },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length,
    fullJumpReach, totalDistance: chase.path.totalDistance, extensionDistance: chase.path.totalDistance - PASS14_CHASE.path.totalDistance,
    collapsePanelCount: chase.collapsePanels.length, supportTargetCount: chase.supportTargets.length, checks: Object.freeze(checks),
  });
}
