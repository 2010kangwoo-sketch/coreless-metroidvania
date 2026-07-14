import { WORLD, ZONES } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS11_CHASE, PASS11_LEVEL, PASS11_ZONE } from "./pass11-level.js";

const point = (x, y) => Object.freeze({ x, y });
const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, zone: 9, phase: 12, lane });
const rect = (id, x, y, width, height, role, kind = role) => Object.freeze({ id, x, y, width, height, role, kind, phase: 12 });
const frame = (id, x, y, width, height, kind) => Object.freeze({ id, x, y, width, height, kind });

export const PASS12_ZONE = Object.freeze({
  id: "pass12_chase_air_dash_spikes",
  entry: PASS11_ZONE.exit,
  exit: Object.freeze({ x: 20300, y: 7200 }),
  surfaceCeilingY: PASS11_ZONE.exit.y,
  playerRoute: Object.freeze([
    point(22400, 6900),
    point(22000, 6900),
    point(21600, 7000),
    point(21300, 7100),
    point(20800, 7100),
    point(20300, 7200),
  ]),
  floors: Object.freeze([
    floor("dash_spike_takeoff", 21600, 7000, 22000, 6900, "takeoff"),
    floor("dash_spike_landing", 20800, 7100, 21300, 7100, "landing"),
    floor("dash_spike_exit_slope", 20300, 7200, 20800, 7100, "exit"),
  ]),
  spikeBed: Object.freeze({
    id: "dash_spike_long_bed",
    x1: 21300,
    x2: 21600,
    tipY: 7065,
    baseY: 7260,
    teeth: 12,
    ignoredByBoulder: true,
  }),
  solids: Object.freeze([
    rect("dash_spike_takeoff_arch", 21650, 6620, 900, 60, "zone09_dash_arch", "split_beam"),
    rect("dash_spike_exit_arch", 20250, 6760, 950, 60, "zone09_dash_arch", "low_rib"),
  ]),
  frames: Object.freeze([
    frame("dash_spike_frame_entry", 21700, 6500, 1800, 980, "entry_vault"),
    frame("dash_spike_frame_gap", 21150, 6700, 1600, 900, "spike_void"),
    frame("dash_spike_frame_landing", 20400, 6800, 1700, 760, "landing_vault"),
    frame("dash_spike_frame_exit", 19900, 6900, 1700, 700, "exit_vault"),
  ]),
  boulderCorridor: Object.freeze({
    width: 420,
    points: Object.freeze([
      point(22400, 6900),
      point(21900, 7000),
      point(21500, 7140),
      point(21100, 7230),
      point(20300, 7200),
    ]),
  }),
  boulderFloors: Object.freeze([
    floor("dash_spike_chute_a", 21900, 7260, 22400, 7160, "boulder_only"),
    floor("dash_spike_chute_b", 21500, 7400, 21900, 7260, "boulder_only"),
    floor("dash_spike_chute_c", 21100, 7490, 21500, 7400, "boulder_only"),
    floor("dash_spike_chute_d", 20300, 7460, 21100, 7490, "boulder_only"),
  ]),
  supportTargets: Object.freeze([
    rect("dash_spike_support_entry", 21840, 6760, 100, 650, "boulder_support", "fork"),
    rect("dash_spike_support_takeoff", 21400, 6870, 110, 720, "boulder_support", "split"),
    rect("dash_spike_support_landing", 21000, 6960, 120, 700, "boulder_support", "rib"),
    rect("dash_spike_support_exit", 20500, 6900, 110, 650, "boulder_support", "arch"),
  ]),
  milestones: Object.freeze({
    enteredX: 21980,
    takeoffX: 21640,
    landingX: 21290,
    completionX: 20340,
    completionY: 7180,
    requiredAirDashes: 1,
  }),
});

const pathPoints = Object.freeze([
  ...PASS11_CHASE.path.points,
  ...PASS12_ZONE.boulderCorridor.points.slice(1),
]);
const cumulativeDistances = [0];
for (let index = 1; index < pathPoints.length; index += 1) {
  const previous = pathPoints[index - 1];
  const current = pathPoints[index];
  cumulativeDistances.push(cumulativeDistances.at(-1) + Math.hypot(current.x - previous.x, current.y - previous.y));
}

const zone12StartIndex = PASS11_CHASE.path.points.length - 1;
const nearestPass12Distance = (x, y) => {
  let best = { gap: Number.POSITIVE_INFINITY, pathDistance: PASS11_CHASE.path.totalDistance };
  for (let index = zone12StartIndex; index < pathPoints.length - 1; index += 1) {
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
  ...PASS11_CHASE.collapsePanels,
  ...PASS12_ZONE.floors.map(item => Object.freeze({
    id: `collapse_${item.id}`,
    floorId: item.id,
    zone: 9,
    lane: item.lane,
    triggerDistance: nearestPass12Distance((item.x1 + item.x2) * 0.5, (item.y1 + item.y2) * 0.5),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

const supportTargets = Object.freeze([
  ...PASS11_CHASE.supportTargets,
  ...PASS12_ZONE.supportTargets.map(item => Object.freeze({
    ...item,
    triggerDistance: nearestPass12Distance(item.x + item.width * 0.5, item.y + item.height * 0.5),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

export const PASS12_CHASE = Object.freeze({
  id: "pass12_chase_through_air_dash_spikes",
  activeBoulder: true,
  path: Object.freeze({
    points: pathPoints,
    cumulativeDistances: Object.freeze(cumulativeDistances),
    totalDistance: cumulativeDistances.at(-1),
    pass11EndDistance: PASS11_CHASE.path.totalDistance,
    pass10EndDistance: PASS11_CHASE.path.pass10EndDistance,
    pass09EndDistance: PASS11_CHASE.path.pass09EndDistance,
    pass08EndDistance: PASS11_CHASE.path.pass08EndDistance,
    zone05EndDistance: PASS11_CHASE.path.zone05EndDistance,
    curveApexDistance: PASS11_CHASE.path.curveApexDistance,
  }),
  boulder: Object.freeze({
    ...PASS11_CHASE.boulder,
    internalBreakpoints: Object.freeze([
      ...PASS11_CHASE.boulder.internalBreakpoints,
      Object.freeze({ distance: cumulativeDistances[59], delayFrames: 45 }),
      Object.freeze({ distance: cumulativeDistances[61], delayFrames: 60 }),
    ]),
  }),
  collapsePanels,
  supportTargets,
  completion: Object.freeze({
    playerX: PASS12_ZONE.milestones.completionX,
    playerY: PASS12_ZONE.milestones.completionY,
    minimumBoulderProgress: 0.99,
  }),
});

export const PASS12_LEVEL = Object.freeze({
  ...PASS11_LEVEL,
  id: "pass12_playable_chase_air_dash_spikes",
  exit: PASS12_ZONE.exit,
  floors: Object.freeze([...PASS11_LEVEL.floors, ...PASS12_ZONE.floors]),
  solids: Object.freeze([...PASS11_LEVEL.solids, ...PASS12_ZONE.solids]),
  zone09DashFrames: PASS12_ZONE.frames,
  zone09DashSpikeBed: PASS12_ZONE.spikeBed,
  zone09DashBoulderCorridor: PASS12_ZONE.boulderCorridor,
  zone09DashBoulderFloors: PASS12_ZONE.boulderFloors,
  zone09DashSupports: PASS12_ZONE.supportTargets,
  activeChase: PASS12_CHASE,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
const pointInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x <= bounds.x + bounds.width && item.y <= bounds.y + bounds.height;
const floorInBounds = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height;
const rectInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x + item.width <= bounds.x + bounds.width && item.y + item.height <= bounds.y + bounds.height;

export function validatePass12Level() {
  const zone = PASS12_ZONE;
  const chase = PASS12_CHASE;
  const zone09 = ZONES[8];
  const takeoff = zone.floors[0];
  const landing = zone.floors[1];
  const horizontalGap = takeoff.x1 - landing.x2;
  const landingDrop = landing.y2 - takeoff.y1;
  const airTime = (PLAYER_PHYSICS.jumpSpeed + Math.sqrt(PLAYER_PHYSICS.jumpSpeed ** 2 + 2 * PLAYER_PHYSICS.gravity * landingDrop)) / PLAYER_PHYSICS.gravity;
  const jumpOnlyReach = PLAYER_PHYSICS.runSpeed * airTime;
  const jumpDashReach = jumpOnlyReach + (PLAYER_PHYSICS.dashSpeed - PLAYER_PHYSICS.runSpeed) * PLAYER_PHYSICS.dashFrames;
  const chaseFloorIds = PASS12_LEVEL.floors.filter(item => item.zone >= 5 && item.zone <= 9).map(item => item.id);
  const panelIds = new Set(chase.collapsePanels.map(item => item.floorId));
  const extension = chase.path.points.slice(zone12StartIndex);
  const checks = [
    { id: "pass11_level_retained", passed: PASS12_LEVEL.zone09Anchors === PASS11_LEVEL.zone09Anchors && PASS12_LEVEL.roof === PASS11_LEVEL.roof },
    { id: "entry_matches_pass11", passed: zone.entry.x === PASS11_LEVEL.exit.x && zone.entry.y === PASS11_LEVEL.exit.y },
    { id: "entry_inside_zone09", passed: pointInBounds(zone.entry, zone09.bounds) },
    { id: "exit_inside_zone09", passed: pointInBounds(zone.exit, zone09.bounds) },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "surface_ceiling_matches_entry", passed: zone.surfaceCeilingY === zone.entry.y },
    { id: "six_player_route_points", passed: zone.playerRoute.length === 6 && zone.playerRoute.every(pointInWorld) },
    { id: "route_matches_endpoints", passed: zone.playerRoute[0].x === zone.entry.x && zone.playerRoute[0].y === zone.entry.y && zone.playerRoute.at(-1).x === zone.exit.x && zone.playerRoute.at(-1).y === zone.exit.y },
    { id: "three_player_floors", passed: zone.floors.length === 3 && zone.floors.every(item => floorInBounds(item, PASS12_LEVEL.bounds)) },
    { id: "three_hundred_pixel_gap", passed: horizontalGap === 300 },
    { id: "jump_alone_cannot_clear", passed: horizontalGap > jumpOnlyReach + PLAYER_PHYSICS.width },
    { id: "jump_dash_can_clear", passed: horizontalGap < jumpDashReach + PLAYER_PHYSICS.width && horizontalGap > jumpOnlyReach + PLAYER_PHYSICS.width + 20 },
    { id: "no_floor_bridge_over_spikes", passed: takeoff.x1 === zone.spikeBed.x2 && landing.x2 === zone.spikeBed.x1 },
    { id: "single_long_spike_bed", passed: zone.spikeBed.x2 - zone.spikeBed.x1 === 300 && zone.spikeBed.teeth >= 10 },
    { id: "spikes_ignored_by_boulder", passed: zone.spikeBed.ignoredByBoulder === true },
    { id: "two_arch_solids", passed: zone.solids.length === 2 && zone.solids.every(item => rectInBounds(item, PASS12_LEVEL.bounds)) },
    { id: "four_architecture_frames", passed: zone.frames.length === 4 && zone.frames.every(item => rectInBounds(item, PASS12_LEVEL.bounds)) },
    { id: "wide_boulder_corridor", passed: zone.boulderCorridor.width >= 420 && zone.boulderCorridor.width > chase.boulder.radius * 2 },
    { id: "five_corridor_points", passed: zone.boulderCorridor.points.length === 5 && zone.boulderCorridor.points.every(pointInWorld) },
    { id: "corridor_matches_entry_exit", passed: zone.boulderCorridor.points[0].x === zone.entry.x && zone.boulderCorridor.points.at(-1).x === zone.exit.x && zone.boulderCorridor.points.at(-1).y === zone.exit.y },
    { id: "smooth_corridor_segments", passed: extension.slice(1).every((item, index) => Math.hypot(item.x - extension[index].x, item.y - extension[index].y) < 1000) },
    { id: "four_visible_chute_floors", passed: zone.boulderFloors.length === 4 && zone.boulderFloors.every(item => floorInBounds(item, PASS12_LEVEL.bounds)) },
    { id: "four_destructible_supports", passed: zone.supportTargets.length === 4 && zone.supportTargets.every(item => rectInBounds(item, PASS12_LEVEL.bounds)) },
    { id: "extended_chase_path", passed: chase.path.points.length === 63 && chase.path.totalDistance > PASS11_CHASE.path.totalDistance + 2000 },
    { id: "strict_chase_distances", passed: chase.path.cumulativeDistances.every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "all_player_floors_collapsible", passed: chase.collapsePanels.length === chaseFloorIds.length && chaseFloorIds.every(id => panelIds.has(id)) },
    { id: "fifty_five_collapse_panels", passed: chase.collapsePanels.length === 55 },
    { id: "thirty_seven_supports", passed: chase.supportTargets.length === 37 },
    { id: "two_new_breakpoints", passed: chase.boulder.internalBreakpoints.length === 12 && chase.boulder.internalBreakpoints.slice(-2).every(item => item.distance > PASS11_CHASE.path.totalDistance) },
    { id: "completion_requires_air_dash", passed: zone.milestones.requiredAirDashes === 1 && chase.completion.minimumBoulderProgress >= 0.99 },
    { id: "extension_stays_in_zone09", passed: zone.floors.every(item => item.x1 >= zone09.bounds.x && item.x2 <= zone09.bounds.x + zone09.bounds.width) },
    { id: "level_inside_world", passed: PASS12_LEVEL.bounds.x >= WORLD.cameraBounds.x && PASS12_LEVEL.bounds.y >= WORLD.cameraBounds.y && PASS12_LEVEL.bounds.x + PASS12_LEVEL.bounds.width <= WORLD.cameraBounds.x + WORLD.cameraBounds.width && PASS12_LEVEL.bounds.y + PASS12_LEVEL.bounds.height <= WORLD.cameraBounds.y + WORLD.cameraBounds.height },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    horizontalGap,
    landingDrop,
    airTime,
    jumpOnlyReach,
    jumpDashReach,
    totalDistance: chase.path.totalDistance,
    extensionDistance: chase.path.totalDistance - PASS11_CHASE.path.totalDistance,
    collapsePanelCount: chase.collapsePanels.length,
    supportTargetCount: chase.supportTargets.length,
    checks: Object.freeze(checks),
  });
}
