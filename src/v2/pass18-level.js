import { WORLD } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS15_ZONE } from "./pass15-level.js";

const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({
  id, x1, y1, x2, y2, lane, phase: 18, zone: 11,
});

const solid = (id, x, y, width, height, role) => Object.freeze({
  id, x, y, width, height, role, phase: 18,
});

const hazard = (id, x1, x2, tipY, baseY) => Object.freeze({
  id, x1, x2, tipY, baseY,
});

export const PASS18_ZONE = Object.freeze({
  id: "pass18_narrow_precision_grotto",
  name: "NARROW PRECISION GROTTO",
  bounds: Object.freeze({ x: 25100, y: 9000, width: 4900, height: 2000 }),
  cameraBounds: Object.freeze({ x: 24800, y: 8800, width: 5700, height: 2400 }),
  entry: Object.freeze({ x: PASS15_ZONE.exit.x, y: PASS15_ZONE.exit.y }),
  exit: Object.freeze({ x: 29400, y: 10520 }),
  playerRoute: Object.freeze([
    [25200, 9600], [25620, 9660], [25900, 9720], [26140, 9800],
    [26370, 9870], [26600, 9825], [26840, 9885], [27080, 9990],
    [27320, 9940], [27565, 10020], [27815, 10130], [28075, 10080],
    [28350, 10160], [28640, 10280], [29400, 10520],
  ].map(([x, y]) => Object.freeze({ x, y }))),
  floors: Object.freeze([
    floor("pass18_entry_slope", 25500, 9630, 25740, 9700, "entry"),
    floor("pass18_narrow_01", 25820, 9720, 25980, 9720, "narrow"),
    floor("pass18_narrow_02", 26070, 9800, 26210, 9800, "narrow"),
    floor("pass18_narrow_03", 26310, 9870, 26435, 9870, "narrow"),
    floor("pass18_narrow_04", 26545, 9825, 26665, 9825, "narrow"),
    floor("pass18_narrow_05", 26780, 9885, 26900, 9885, "narrow"),
    floor("pass18_narrow_06", 27020, 9990, 27140, 9990, "narrow"),
    floor("pass18_narrow_07", 27260, 9940, 27380, 9940, "narrow"),
    floor("pass18_narrow_08", 27505, 10020, 27625, 10020, "narrow"),
    floor("pass18_narrow_09", 27755, 10130, 27875, 10130, "narrow"),
    floor("pass18_narrow_10", 28010, 10080, 28140, 10080, "narrow"),
    floor("pass18_narrow_11", 28280, 10160, 28420, 10160, "narrow"),
    floor("pass18_narrow_12", 28565, 10280, 28715, 10280, "narrow"),
    floor("pass18_exit_slope", 28835, 10400, 29900, 10600, "checkpoint"),
  ]),
  solids: Object.freeze([
    solid("pass18_low_ceiling_01", 26120, 9592, 420, 90, "pass18_low_ceiling"),
    solid("pass18_low_ceiling_02", 25880, 9502, 150, 100, "pass18_low_ceiling"),
    solid("pass18_low_ceiling_03", 29000, 10220, 450, 110, "pass18_low_ceiling"),
    solid("pass18_exit_buttress", 29880, 10280, 80, 320, "pass18_exit_wall"),
  ]),
  hazards: Object.freeze([
    hazard("pass18_lower_spikes_a", 25740, 27440, 10420, 10880),
    hazard("pass18_lower_spikes_b", 27440, 28835, 10620, 10920),
  ]),
  milestones: Object.freeze({
    enteredX: 25520,
    completionX: 28920,
    completionY: 10400,
    requiredNarrowLandings: 12,
    requiredShortCuts: 2,
    requiredHeldJumps: 3,
    maximumCeilingBumps: 0,
  }),
  checkpoint: Object.freeze({ id: "pass18_precision_exit", x: 29400, y: 10520 }),
  palette: Object.freeze({
    background: "#071318", midground: "#12272c", terrain: "#24383a",
    edge: "#b7c7aa", hazard: "#b76655", checkpoint: "#dfc978",
  }),
});

export const PASS18_LEVEL = Object.freeze({
  id: "pass18_post_chase_narrow_platforming",
  bounds: Object.freeze({ x: 0, y: 300, width: 30000, height: 10700 }),
  cameraBounds: Object.freeze({ x: 0, y: 0, width: 30500, height: 11200 }),
  spawn: Object.freeze({ x: 600, y: 852 }),
  floors: PASS18_ZONE.floors,
  solids: PASS18_ZONE.solids,
  hazards: PASS18_ZONE.hazards,
  exit: PASS18_ZONE.exit,
});

const boundsInside = (inner, outer) => inner.x >= outer.x && inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
const floorInside = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width &&
  item.y1 >= bounds.y && item.y2 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 <= bounds.y + bounds.height;

export function validatePass18Level() {
  const zone = PASS18_ZONE;
  const floors = zone.floors;
  const narrow = floors.filter(item => item.lane === "narrow");
  const gaps = floors.slice(0, -1).map((item, index) => floors[index + 1].x1 - item.x2);
  const widths = narrow.map(item => item.x2 - item.x1);
  const ceilingClearances = zone.solids.filter(item => item.role === "pass18_low_ceiling").map(ceiling => {
    const floorBelow = floors.filter(item => item.x2 >= ceiling.x && item.x1 <= ceiling.x + ceiling.width)
      .reduce((lowest, item) => Math.min(lowest, item.y1, item.y2), Number.POSITIVE_INFINITY);
    return floorBelow - (ceiling.y + ceiling.height);
  });
  const routeInWorld = zone.playerRoute.every(point => point.x >= 0 && point.y >= 0 && point.x <= WORLD.width && point.y <= WORLD.height);
  const checks = [
    { id: "world_extended", passed: WORLD.width === 30500 && WORLD.height === 11200 },
    { id: "zone_in_world", passed: boundsInside(zone.bounds, WORLD.cameraBounds) },
    { id: "camera_in_world", passed: boundsInside(zone.cameraBounds, WORLD.cameraBounds) },
    { id: "entry_matches_bridge", passed: zone.entry.x === PASS15_ZONE.exit.x && zone.entry.y === PASS15_ZONE.exit.y },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "single_forward_route", passed: zone.playerRoute.every((point, index) => index === 0 || point.x > zone.playerRoute[index - 1].x) },
    { id: "route_in_world", passed: routeInWorld },
    { id: "route_endpoints", passed: zone.playerRoute[0].x === zone.entry.x && zone.playerRoute.at(-1).x === zone.exit.x },
    { id: "fourteen_floor_segments", passed: floors.length === 14 },
    { id: "twelve_narrow_platforms", passed: narrow.length === 12 },
    { id: "narrow_widths", passed: widths.every(width => width >= 120 && width <= 160) },
    { id: "floors_ordered", passed: floors.every(item => item.x2 > item.x1) },
    { id: "floors_in_zone", passed: floors.every(item => floorInside(item, zone.bounds)) },
    { id: "gaps_ordered", passed: gaps.every(gap => gap > 0) },
    { id: "precision_gap_range", passed: Math.min(...gaps) === 80 && Math.max(...gaps) === 145 },
    { id: "gaps_within_jump_reach", passed: gaps.every(gap => gap < (PLAYER_PHYSICS.runSpeed * PLAYER_PHYSICS.jumpSpeed * 2) / PLAYER_PHYSICS.gravity) },
    { id: "three_low_ceilings", passed: zone.solids.filter(item => item.role === "pass18_low_ceiling").length === 3 },
    { id: "ceiling_clearance", passed: ceilingClearances.every(clearance => clearance >= PLAYER_PHYSICS.height + 18 && clearance <= 180) },
    { id: "solids_in_zone", passed: zone.solids.every(item => boundsInside(item, zone.bounds)) },
    { id: "two_hazard_beds", passed: zone.hazards.length === 2 },
    { id: "hazards_cover_gaps", passed: zone.hazards[0].x1 === floors[0].x2 && zone.hazards.at(-1).x2 === floors.at(-1).x1 },
    { id: "hazards_below_route", passed: zone.hazards.every(item => item.tipY > 10400 && item.baseY <= zone.bounds.y + zone.bounds.height) },
    { id: "unique_floor_ids", passed: new Set(floors.map(item => item.id)).size === floors.length },
    { id: "unique_solid_ids", passed: new Set(zone.solids.map(item => item.id)).size === zone.solids.length },
    { id: "unique_hazard_ids", passed: new Set(zone.hazards.map(item => item.id)).size === zone.hazards.length },
    { id: "phase_18_collision", passed: [...floors, ...zone.solids].every(item => item.phase === 18) },
    { id: "completion_requirements", passed: zone.milestones.requiredNarrowLandings === 12 && zone.milestones.requiredShortCuts === 2 && zone.milestones.requiredHeldJumps === 3 },
    { id: "zero_ceiling_bumps", passed: zone.milestones.maximumCeilingBumps === 0 },
    { id: "checkpoint_at_exit", passed: zone.checkpoint.x === zone.exit.x && zone.checkpoint.y === zone.exit.y },
    { id: "level_bounds_in_world", passed: boundsInside(PASS18_LEVEL.bounds, WORLD.cameraBounds) },
    { id: "level_camera_matches_world", passed: PASS18_LEVEL.cameraBounds.width === WORLD.width && PASS18_LEVEL.cameraBounds.height === WORLD.height },
    { id: "spawn_retained", passed: PASS18_LEVEL.spawn.x === 600 && PASS18_LEVEL.spawn.y === 852 },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length,
    total: checks.length, gaps: Object.freeze(gaps), widths: Object.freeze(widths), ceilingClearances: Object.freeze(ceilingClearances), checks: Object.freeze(checks),
  });
}
