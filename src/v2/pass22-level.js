import { WORLD } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS20_ZONE } from "./pass20-level.js";

const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, lane, phase: 22, zone: 13 });
const solid = (id, x, y, width, height, role) => Object.freeze({ id, x, y, width, height, role, phase: 22 });

export const PASS22_ZONE = Object.freeze({
  id: "pass22_winding_recovery_shaft",
  name: "WINDING RECOVERY SHAFT",
  bounds: Object.freeze({ x: 28800, y: 10720, width: 5400, height: 1420 }),
  cameraBounds: Object.freeze({ x: 28600, y: 10520, width: 5800, height: 1680 }),
  entry: PASS20_ZONE.exit,
  exit: Object.freeze({ x: 29400, y: 11824 }),
  playerRoute: Object.freeze([
    [33700, 11160], [32500, 11020], [31520, 10880], [31120, 11400], [30380, 11600], [29400, 11824],
  ].map(([x, y]) => Object.freeze({ x, y }))),
  floors: Object.freeze([
    floor("pass22_west_step", 30800, 11400, 31440, 11400, "step"),
    floor("pass22_lower_shelf", 30080, 11600, 30700, 11600, "shelf"),
    floor("pass22_exit_slope", 29150, 11800, 30000, 11880, "checkpoint"),
  ]),
  solids: Object.freeze([
    solid("pass22_east_wall", 34060, 10820, 90, 420, "east_retaining_wall"),
    solid("pass22_west_buttress", 28880, 11540, 90, 420, "west_retaining_wall"),
  ]),
  milestones: Object.freeze({ enteredX: 31480, firstLandingX: 31120, secondLandingX: 30380, completionX: 29520, completionY: 11810, requiredLandings: 3 }),
  checkpoint: Object.freeze({ id: "pass22_shaft_exit", x: 29400, y: 11824 }),
  palette: Object.freeze({ edge: "#a8c6bb", stone: "#385b59", recess: "#172b31", checkpoint: "#e4ca82", guide: "#8bb7a8" }),
});

export const PASS22_LEVEL = Object.freeze({
  id: "pass22_winding_recovery_shaft",
  bounds: Object.freeze({ x: 0, y: 300, width: 34500, height: 11600 }),
  cameraBounds: WORLD.cameraBounds,
  spawn: PASS20_ZONE.entry,
  floors: PASS22_ZONE.floors,
  solids: PASS22_ZONE.solids,
  exit: PASS22_ZONE.exit,
});

const inBounds = item => item.x1 >= PASS22_ZONE.bounds.x && item.x2 <= PASS22_ZONE.bounds.x + PASS22_ZONE.bounds.width && item.y1 >= PASS22_ZONE.bounds.y && item.y2 <= PASS22_ZONE.bounds.y + PASS22_ZONE.bounds.height;

export function validatePass22Level() {
  const zone = PASS22_ZONE;
  const drops = zone.playerRoute.slice(3).every((point, index) => point.y > zone.playerRoute[index + 2].y);
  const checks = [
    { id: "zone_in_world", passed: zone.bounds.x >= 0 && zone.bounds.y >= 0 && zone.bounds.x + zone.bounds.width <= WORLD.width && zone.bounds.y + zone.bounds.height <= WORLD.height },
    { id: "entry_matches_pass20", passed: zone.entry.x === PASS20_ZONE.exit.x && zone.entry.y === PASS20_ZONE.exit.y },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "route_endpoints", passed: zone.playerRoute[0].x === zone.entry.x && zone.playerRoute.at(-1).x === zone.exit.x },
    { id: "route_descends_after_handoff", passed: drops && zone.exit.y > zone.entry.y },
    { id: "three_landing_surfaces", passed: zone.floors.length === 3 && zone.floors.every(inBounds) },
    { id: "single_leftward_route", passed: zone.playerRoute.slice(1).every((point, index) => point.x < zone.playerRoute[index].x) },
    { id: "gaps_are_jumpable", passed: zone.floors.slice(1).every((item, index) => zone.floors[index].x1 - item.x2 <= PLAYER_PHYSICS.runSpeed * 20) },
    { id: "walls_bound_shaft", passed: zone.solids.length === 2 && zone.solids.every(item => item.x >= zone.bounds.x && item.x + item.width <= zone.bounds.x + zone.bounds.width) },
    { id: "checkpoint_at_exit", passed: zone.checkpoint.x === zone.exit.x && zone.checkpoint.y === zone.exit.y },
    { id: "three_required_landings", passed: zone.milestones.requiredLandings === zone.floors.length },
    { id: "palette_complete", passed: ["edge", "stone", "recess", "checkpoint", "guide"].every(key => typeof zone.palette[key] === "string") },
  ];
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
