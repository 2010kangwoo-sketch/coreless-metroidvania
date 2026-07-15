import { WORLD, ZONES } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS12_CHASE, PASS12_LEVEL, PASS12_ZONE } from "./pass12-level.js";

const point = (x, y) => Object.freeze({ x, y });
const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, zone: 9, phase: 13, lane });
const rect = (id, x, y, width, height, role, kind = role) => Object.freeze({ id, x, y, width, height, role, kind, phase: 13 });
const frame = (id, x, y, width, height, kind) => Object.freeze({ id, x, y, width, height, kind });
const hazard = (id, x1, x2, tipY, baseY, teeth, kind) => Object.freeze({ id, x1, x2, tipY, baseY, teeth, kind, ignoredByBoulder: true });

export const PASS13_ZONE = Object.freeze({
  id: "pass13_chase_precision_parkour",
  entry: PASS12_ZONE.exit,
  exit: Object.freeze({ x: 19800, y: 7520 }),
  surfaceCeilingY: PASS12_ZONE.exit.y,
  playerRoute: Object.freeze([
    point(20300, 7200),
    point(19880, 7280),
    point(19780, 7310),
    point(19460, 7310),
    point(19000, 7430),
    point(18740, 7430),
    point(19000, 7430),
    point(19195, 7500),
    point(19580, 7500),
    point(19800, 7520),
  ]),
  floors: Object.freeze([
    floor("precision_entry_slope", 19880, 7280, 20300, 7200, "entry"),
    floor("precision_short_landing", 19460, 7310, 19780, 7310, "short_landing"),
    floor("precision_turn_descent", 19000, 7430, 19460, 7310, "turn_descent"),
    floor("precision_turn_launch", 18740, 7430, 19000, 7430, "turn_launch"),
    floor("precision_long_landing", 19195, 7500, 19580, 7500, "long_landing"),
    floor("precision_exit_slope", 19580, 7500, 19940, 7533, "exit"),
  ]),
  hazards: Object.freeze([
    hazard("precision_short_gap_spikes", 19780, 19880, 7310, 7410, 5, "short_gap"),
    hazard("precision_long_gap_spikes", 19000, 19195, 7550, 7790, 8, "long_gap"),
  ]),
  solids: Object.freeze([
    rect("precision_low_ceiling", 19410, 7090, 570, 70, "zone09_precision_ceiling", "low_broken_rib"),
    rect("precision_turn_wall", 18680, 7160, 60, 300, "zone09_precision_turn_wall", "curved_return_buttress"),
    rect("precision_exit_arch", 19480, 7100, 500, 60, "zone09_precision_arch", "split_exit_rib"),
  ]),
  frames: Object.freeze([
    frame("precision_frame_entry", 19800, 6950, 1900, 850, "descending_vault"),
    frame("precision_frame_short", 19350, 7040, 1700, 760, "low_ceiling_vault"),
    frame("precision_frame_turn", 18580, 7140, 1900, 650, "turning_pocket"),
    frame("precision_frame_long", 18850, 7280, 2300, 500, "long_jump_void"),
    frame("precision_frame_exit", 19350, 7250, 1800, 520, "lower_exit_vault"),
  ]),
  boulderCorridor: Object.freeze({
    width: 420,
    points: Object.freeze([
      point(20300, 7200),
      point(19900, 7280),
      point(19500, 7360),
      point(19100, 7440),
      point(18820, 7510),
      point(18740, 7550),
      point(18830, 7570),
      point(19120, 7560),
      point(19500, 7540),
      point(19800, 7640),
    ]),
  }),
  boulderFloors: Object.freeze([
    floor("precision_chute_a", 19900, 7500, 20300, 7420, "boulder_only"),
    floor("precision_chute_b", 19500, 7580, 19900, 7500, "boulder_only"),
    floor("precision_chute_c", 19100, 7660, 19500, 7580, "boulder_only"),
    floor("precision_chute_d", 18740, 7770, 19100, 7660, "boulder_only"),
    floor("precision_chute_e", 19120, 7780, 19500, 7760, "boulder_only"),
    floor("precision_chute_f", 19500, 7760, 19800, 7740, "boulder_only"),
  ]),
  supportTargets: Object.freeze([
    rect("precision_support_entry", 19920, 7180, 100, 560, "boulder_support", "fork"),
    rect("precision_support_short", 19510, 7240, 110, 520, "boulder_support", "rib"),
    rect("precision_support_turn", 18880, 7310, 120, 470, "boulder_support", "curved_truss"),
    rect("precision_support_return", 19180, 7350, 110, 430, "boulder_support", "split_column"),
    rect("precision_support_exit", 19600, 7300, 100, 470, "boulder_support", "arch"),
  ]),
  milestones: Object.freeze({
    enteredX: 20260,
    shortTakeoffX: 19895,
    shortLandingX: 19778,
    turnX: 18790,
    longTakeoffX: 18980,
    longLandingX: 19195,
    completionX: 19770,
    completionY: 7500,
    requiredDirectionChanges: 1,
    requiredShortJumps: 1,
    requiredLongJumps: 1,
    maximumCeilingBumps: 0,
  }),
});

const pathPoints = Object.freeze([
  ...PASS12_CHASE.path.points,
  ...PASS13_ZONE.boulderCorridor.points.slice(1),
]);
const cumulativeDistances = [0];
for (let index = 1; index < pathPoints.length; index += 1) {
  const previous = pathPoints[index - 1];
  const current = pathPoints[index];
  cumulativeDistances.push(cumulativeDistances.at(-1) + Math.hypot(current.x - previous.x, current.y - previous.y));
}

const zone13StartIndex = PASS12_CHASE.path.points.length - 1;
const nearestPass13Distance = (x, y) => {
  let best = { gap: Number.POSITIVE_INFINITY, pathDistance: PASS12_CHASE.path.totalDistance };
  for (let index = zone13StartIndex; index < pathPoints.length - 1; index += 1) {
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
  ...PASS12_CHASE.collapsePanels,
  ...PASS13_ZONE.floors.map(item => Object.freeze({
    id: `collapse_${item.id}`,
    floorId: item.id,
    zone: 9,
    lane: item.lane,
    triggerDistance: nearestPass13Distance((item.x1 + item.x2) * 0.5, (item.y1 + item.y2) * 0.5),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

const supportTargets = Object.freeze([
  ...PASS12_CHASE.supportTargets,
  ...PASS13_ZONE.supportTargets.map(item => Object.freeze({
    ...item,
    triggerDistance: nearestPass13Distance(item.x + item.width * 0.5, item.y + item.height * 0.5),
  })),
].sort((a, b) => a.triggerDistance - b.triggerDistance));

export const PASS13_CHASE = Object.freeze({
  id: "pass13_chase_through_precision_parkour",
  activeBoulder: true,
  path: Object.freeze({
    points: pathPoints,
    cumulativeDistances: Object.freeze(cumulativeDistances),
    totalDistance: cumulativeDistances.at(-1),
    pass12EndDistance: PASS12_CHASE.path.totalDistance,
    pass11EndDistance: PASS12_CHASE.path.pass11EndDistance,
    pass10EndDistance: PASS12_CHASE.path.pass10EndDistance,
    pass09EndDistance: PASS12_CHASE.path.pass09EndDistance,
    pass08EndDistance: PASS12_CHASE.path.pass08EndDistance,
    zone05EndDistance: PASS12_CHASE.path.zone05EndDistance,
    curveApexDistance: PASS12_CHASE.path.curveApexDistance,
  }),
  boulder: Object.freeze({
    ...PASS12_CHASE.boulder,
    internalBreakpoints: Object.freeze([
      ...PASS12_CHASE.boulder.internalBreakpoints,
      Object.freeze({ distance: PASS12_CHASE.path.totalDistance + 50, delayFrames: 100 }),
      Object.freeze({ distance: PASS12_CHASE.path.totalDistance + 760, delayFrames: 150 }),
      Object.freeze({ distance: cumulativeDistances[70], delayFrames: 45 }),
    ]),
  }),
  collapsePanels,
  supportTargets,
  completion: Object.freeze({
    playerX: PASS13_ZONE.milestones.completionX,
    playerY: PASS13_ZONE.milestones.completionY,
    minimumBoulderProgress: 1,
  }),
});

export const PASS13_LEVEL = Object.freeze({
  ...PASS12_LEVEL,
  id: "pass13_playable_chase_precision_parkour",
  exit: PASS13_ZONE.exit,
  floors: Object.freeze([...PASS12_LEVEL.floors, ...PASS13_ZONE.floors]),
  solids: Object.freeze([...PASS12_LEVEL.solids, ...PASS13_ZONE.solids]),
  zone09PrecisionFrames: PASS13_ZONE.frames,
  zone09PrecisionHazards: PASS13_ZONE.hazards,
  zone09PrecisionBoulderCorridor: PASS13_ZONE.boulderCorridor,
  zone09PrecisionBoulderFloors: PASS13_ZONE.boulderFloors,
  zone09PrecisionSupports: PASS13_ZONE.supportTargets,
  activeChase: PASS13_CHASE,
});

const pointInWorld = item => item.x >= 0 && item.y >= 0 && item.x <= WORLD.width && item.y <= WORLD.height;
const pointInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x <= bounds.x + bounds.width && item.y <= bounds.y + bounds.height;
const floorInBounds = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height;
const rectInBounds = (item, bounds) => item.x >= bounds.x && item.y >= bounds.y && item.x + item.width <= bounds.x + bounds.width && item.y + item.height <= bounds.y + bounds.height;

export function validatePass13Level() {
  const zone = PASS13_ZONE;
  const chase = PASS13_CHASE;
  const zone09 = ZONES[8];
  const entry = zone.floors[0];
  const shortLanding = zone.floors[1];
  const turnLaunch = zone.floors[3];
  const longLanding = zone.floors[4];
  const exitFloor = zone.floors[5];
  const shortGap = entry.x1 - shortLanding.x2;
  const longGap = longLanding.x1 - turnLaunch.x2;
  const shortLandingDrop = shortLanding.y2 - entry.y1;
  const longLandingDrop = longLanding.y1 - turnLaunch.y2;
  const cutFrames = 2;
  const riseBeforeCut = PLAYER_PHYSICS.jumpSpeed * cutFrames - 0.5 * PLAYER_PHYSICS.gravity * cutFrames ** 2;
  const speedAfterCut = (PLAYER_PHYSICS.jumpSpeed - PLAYER_PHYSICS.gravity * cutFrames) * PLAYER_PHYSICS.jumpCutMultiplier;
  const shortCutRise = riseBeforeCut + speedAfterCut ** 2 / (2 * PLAYER_PHYSICS.gravity);
  const cutFlightTime = drop => cutFrames + (speedAfterCut + Math.sqrt(speedAfterCut ** 2 + 2 * PLAYER_PHYSICS.gravity * (drop + riseBeforeCut))) / PLAYER_PHYSICS.gravity;
  const shortCutReach = PLAYER_PHYSICS.runSpeed * cutFlightTime(shortLandingDrop);
  const shortCutLongReach = PLAYER_PHYSICS.runSpeed * cutFlightTime(longLandingDrop);
  const fullJumpRise = PLAYER_PHYSICS.jumpSpeed ** 2 / (2 * PLAYER_PHYSICS.gravity);
  const fullLongFlightTime = (PLAYER_PHYSICS.jumpSpeed + Math.sqrt(PLAYER_PHYSICS.jumpSpeed ** 2 + 2 * PLAYER_PHYSICS.gravity * longLandingDrop)) / PLAYER_PHYSICS.gravity;
  const fullLongReach = PLAYER_PHYSICS.runSpeed * fullLongFlightTime;
  const lowCeiling = zone.solids.find(item => item.role === "zone09_precision_ceiling");
  const ceilingHeadroom = entry.y1 - (lowCeiling.y + lowCeiling.height) - PLAYER_PHYSICS.height;
  const exitRunout = exitFloor.x2 - zone.exit.x;
  const exitMarkerRatio = (zone.exit.x - exitFloor.x1) / (exitFloor.x2 - exitFloor.x1);
  const exitFloorYAtMarker = exitFloor.y1 + (exitFloor.y2 - exitFloor.y1) * exitMarkerRatio;
  const chaseFloorIds = PASS13_LEVEL.floors.filter(item => item.zone >= 5 && item.zone <= 9).map(item => item.id);
  const panelIds = new Set(chase.collapsePanels.map(item => item.floorId));
  const extension = chase.path.points.slice(zone13StartIndex);
  const checks = [
    { id: "pass12_level_retained", passed: PASS13_LEVEL.zone09DashSpikeBed === PASS12_LEVEL.zone09DashSpikeBed && PASS13_LEVEL.zone09Anchors === PASS12_LEVEL.zone09Anchors },
    { id: "entry_matches_pass12", passed: zone.entry.x === PASS12_LEVEL.exit.x && zone.entry.y === PASS12_LEVEL.exit.y },
    { id: "entry_inside_zone09", passed: pointInBounds(zone.entry, zone09.bounds) },
    { id: "exit_inside_zone09", passed: pointInBounds(zone.exit, zone09.bounds) },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "ten_player_route_points", passed: zone.playerRoute.length === 10 && zone.playerRoute.every(pointInWorld) },
    { id: "route_matches_endpoints", passed: zone.playerRoute[0].x === zone.entry.x && zone.playerRoute[0].y === zone.entry.y && zone.playerRoute.at(-1).x === zone.exit.x && zone.playerRoute.at(-1).y === zone.exit.y },
    { id: "route_contains_direction_reversal", passed: zone.playerRoute.some((item, index, items) => index > 0 && index < items.length - 1 && Math.sign(item.x - items[index - 1].x) !== Math.sign(items[index + 1].x - item.x)) },
    { id: "six_player_floors", passed: zone.floors.length === 6 && zone.floors.every(item => floorInBounds(item, PASS13_LEVEL.bounds)) },
    { id: "exit_has_safe_runout", passed: exitRunout >= PLAYER_PHYSICS.width * 3 && Math.abs(exitFloorYAtMarker - zone.exit.y) <= 1 },
    { id: "one_hundred_pixel_short_gap", passed: shortGap === 100 },
    { id: "short_cut_clears_short_gap", passed: shortGap < shortCutReach + PLAYER_PHYSICS.width - 20 },
    { id: "one_hundred_ninety_five_pixel_long_gap", passed: longGap === 195 },
    { id: "short_cut_cannot_clear_long_gap", passed: longGap > shortCutLongReach + PLAYER_PHYSICS.width + 8 },
    { id: "full_jump_clears_long_gap", passed: longGap < fullLongReach + PLAYER_PHYSICS.width - 20 },
    { id: "low_ceiling_requires_jump_cut", passed: shortCutRise < ceilingHeadroom && fullJumpRise > ceilingHeadroom + 25 },
    { id: "two_gap_hazards", passed: zone.hazards.length === 2 && zone.hazards.every(item => item.ignoredByBoulder && item.x2 > item.x1 && item.baseY <= PASS13_LEVEL.bounds.y + PASS13_LEVEL.bounds.height) },
    { id: "hazards_exactly_fill_gaps", passed: zone.hazards[0].x1 === shortLanding.x2 && zone.hazards[0].x2 === entry.x1 && zone.hazards[1].x1 === turnLaunch.x2 && zone.hazards[1].x2 === longLanding.x1 },
    { id: "three_architecture_solids", passed: zone.solids.length === 3 && zone.solids.every(item => rectInBounds(item, PASS13_LEVEL.bounds)) },
    { id: "five_architecture_frames", passed: zone.frames.length === 5 && zone.frames.every(item => rectInBounds(item, PASS13_LEVEL.bounds)) },
    { id: "wide_boulder_corridor", passed: zone.boulderCorridor.width >= 420 && zone.boulderCorridor.width > chase.boulder.radius * 2 },
    { id: "ten_corridor_points", passed: zone.boulderCorridor.points.length === 10 && zone.boulderCorridor.points.every(pointInWorld) },
    { id: "corridor_rejoins_below_player_exit", passed: zone.boulderCorridor.points[0].x === zone.entry.x && zone.boulderCorridor.points.at(-1).x === zone.exit.x && zone.boulderCorridor.points.at(-1).y - zone.exit.y === 120 },
    { id: "smooth_corridor_segments", passed: extension.slice(1).every((item, index) => Math.hypot(item.x - extension[index].x, item.y - extension[index].y) < 500) },
    { id: "corridor_has_rounded_return", passed: zone.boulderCorridor.points.slice(4, 8).every((item, index, items) => index === 0 || Math.hypot(item.x - items[index - 1].x, item.y - items[index - 1].y) < 300) },
    { id: "six_visible_chute_floors", passed: zone.boulderFloors.length === 6 && zone.boulderFloors.every(item => floorInBounds(item, PASS13_LEVEL.bounds)) },
    { id: "five_destructible_supports", passed: zone.supportTargets.length === 5 && zone.supportTargets.every(item => rectInBounds(item, PASS13_LEVEL.bounds)) },
    { id: "extended_chase_path", passed: chase.path.points.length === 72 && chase.path.totalDistance > PASS12_CHASE.path.totalDistance + 2500 },
    { id: "strict_chase_distances", passed: chase.path.cumulativeDistances.every((value, index, values) => index === 0 || value > values[index - 1]) },
    { id: "all_player_floors_collapsible", passed: chase.collapsePanels.length === chaseFloorIds.length && chaseFloorIds.every(id => panelIds.has(id)) },
    { id: "sixty_one_collapse_panels", passed: chase.collapsePanels.length === 61 },
    { id: "forty_two_supports", passed: chase.supportTargets.length === 42 },
    { id: "three_new_breakpoints", passed: chase.boulder.internalBreakpoints.length === 15 && chase.boulder.internalBreakpoints.slice(-3).every(item => item.distance > PASS12_CHASE.path.totalDistance) },
    { id: "completion_requires_precision_sequence", passed: zone.milestones.requiredShortJumps === 1 && zone.milestones.requiredLongJumps === 1 && zone.milestones.requiredDirectionChanges === 1 && zone.milestones.maximumCeilingBumps === 0 },
    { id: "completion_requires_boulder", passed: chase.completion.minimumBoulderProgress >= 0.99 },
    { id: "extension_stays_in_zone09", passed: zone.floors.every(item => item.x1 >= zone09.bounds.x && item.x2 <= zone09.bounds.x + zone09.bounds.width && item.y1 <= zone09.bounds.y + zone09.bounds.height && item.y2 <= zone09.bounds.y + zone09.bounds.height) },
    { id: "level_inside_world", passed: PASS13_LEVEL.bounds.x >= WORLD.cameraBounds.x && PASS13_LEVEL.bounds.y >= WORLD.cameraBounds.y && PASS13_LEVEL.bounds.x + PASS13_LEVEL.bounds.width <= WORLD.cameraBounds.x + WORLD.cameraBounds.width && PASS13_LEVEL.bounds.y + PASS13_LEVEL.bounds.height <= WORLD.cameraBounds.y + WORLD.cameraBounds.height },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    shortGap,
    longGap,
    ceilingHeadroom,
    exitRunout,
    exitFloorYAtMarker,
    shortCutRise,
    fullJumpRise,
    shortCutReach,
    shortCutLongReach,
    fullLongReach,
    totalDistance: chase.path.totalDistance,
    extensionDistance: chase.path.totalDistance - PASS12_CHASE.path.totalDistance,
    collapsePanelCount: chase.collapsePanels.length,
    supportTargetCount: chase.supportTargets.length,
    checks: Object.freeze(checks),
  });
}
