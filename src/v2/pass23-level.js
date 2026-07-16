import { WORLD } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS22_ZONE } from "./pass22-level.js";

const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({ id, x1, y1, x2, y2, lane, phase: 23, zone: 14 });
const solid = (id, x, y, width, height, role) => Object.freeze({ id, x, y, width, height, role, phase: 23 });

export const PASS23_ZONE = Object.freeze({
  id: "pass23_convergence_gauntlet",
  name: "CONVERGENCE GAUNTLET",
  bounds: Object.freeze({ x: 23800, y: 11200, width: 6100, height: 980 }),
  cameraBounds: Object.freeze({ x: 23600, y: 11000, width: 6500, height: 1200 }),
  entry: PASS22_ZONE.exit,
  exit: Object.freeze({ x: 24120, y: 12110 }),
  playerRoute: Object.freeze([
    [29400, 11824], [28720, 11880], [28020, 11870], [27540, 11930],
    [27020, 11780], [26320, 11810], [25320, 12020], [24120, 12110],
  ].map(([x, y]) => Object.freeze({ x, y }))),
  floors: Object.freeze([
    floor("pass23_entry_shelf", 28680, 11880, 29220, 11880, "entry"),
    floor("pass23_platform_departure", 28280, 11900, 28760, 11900, "platform_departure"),
    floor("pass23_combat_island", 27320, 11930, 27920, 11930, "combat"),
    floor("pass23_anchor_landing", 26040, 11980, 26660, 11980, "grapple_landing"),
    floor("pass23_spring_runway", 24960, 12020, 25720, 12020, "spring"),
    floor("pass23_exit_slope", 23920, 12130, 24520, 12070, "checkpoint"),
  ]),
  solids: Object.freeze([
    solid("pass23_exit_buttress", 23820, 11820, 80, 360, "pass23_exit_wall"),
  ]),
  movingPlatforms: Object.freeze([
    Object.freeze({ id: "pass23_chase_carriage", xMin: 27520, xMax: 28220, y: 11900, width: 220, height: 24, speed: 2.8, phase: 23 }),
  ]),
  enemies: Object.freeze([
    Object.freeze({ id: "pass23_sentinel_a", x: 27640, y: 11858, radius: 30, health: 1, order: 1 }),
    Object.freeze({ id: "pass23_sentinel_b", x: 26410, y: 11892, radius: 30, health: 1, order: 2 }),
  ]),
  anchors: Object.freeze([
    Object.freeze({ id: "pass23_anchor_four", x: 27020, y: 11630, order: 4, attachRadius: 610, ropeLength: 390 }),
    Object.freeze({ id: "pass23_anchor_five", x: 26280, y: 11670, order: 5, attachRadius: 610, ropeLength: 390 }),
  ]),
  spring: Object.freeze({
    id: "pass23_leftward_escape_spring", x: 25020, y: 11996, width: 130, height: 24,
    direction: "left", requiredInput: "KeyA", launchVx: -19, launchVy: -11,
    preserveFrames: 50, landingX1: 23920, landingX2: 24520,
  }),
  hazard: Object.freeze({ id: "pass23_lower_void", x1: 24520, x2: 24960, tipY: 12155, baseY: 12198 }),
  pursuer: Object.freeze({
    id: "pass23_aftershock_pursuer", spawnDelayFrames: 130, speed: 2.7, contactRadius: 68,
    route: Object.freeze([
      [29820, 11790], [29200, 11840], [28400, 11890], [27600, 11920],
      [26600, 11970], [25400, 12010], [24200, 12090],
    ].map(([x, y]) => Object.freeze({ x, y }))),
  }),
  milestones: Object.freeze({
    enteredX: 29200, platformX: 28180, combatX: 27680, grappleX: 26680,
    springX: 25220, completionX: 24320, completionY: 12070,
    requiredPlatformRides: 1, requiredEnemyDefeats: 2, requiredAnchors: 2,
    requiredSpringLaunches: 1, requiredSpringLandings: 1,
  }),
  checkpoint: Object.freeze({ id: "mega_stage_late_cp", screenId: "mega_23", requiredOrder: 23, x: 24120, y: 12110 }),
  palette: Object.freeze({
    background: "#071217", stone: "#314b4d", edge: "#9fc7c1", carriage: "#d8bc78",
    enemy: "#d97868", anchor: "#82d7c4", spring: "#efb96f", pursuer: "#d76755", checkpoint: "#e6d18a",
  }),
});

export const PASS23_LEVEL = Object.freeze({
  id: "pass23_mixed_system_convergence",
  bounds: Object.freeze({ x: 0, y: 300, width: 35000, height: 11900 }),
  cameraBounds: WORLD.cameraBounds,
  spawn: Object.freeze({ x: 600, y: 852 }),
  floors: PASS23_ZONE.floors,
  solids: PASS23_ZONE.solids,
  movingPlatforms: PASS23_ZONE.movingPlatforms,
  hazards: Object.freeze([PASS23_ZONE.hazard]),
  exit: PASS23_ZONE.exit,
});

const boundsInside = (inner, outer) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
const floorInside = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width && item.y1 >= bounds.y && item.y2 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 <= bounds.y + bounds.height;

export function validatePass23Level() {
  const zone = PASS23_ZONE;
  const spring = zone.spring;
  const springFloor = zone.floors.find(item => item.lane === "spring");
  const exitFloor = zone.floors.find(item => item.lane === "checkpoint");
  const flightFrames = (Math.abs(spring.launchVy) + Math.sqrt(spring.launchVy ** 2 + 2 * PLAYER_PHYSICS.gravity * (exitFloor.y2 - springFloor.y1))) / PLAYER_PHYSICS.gravity;
  const projectedLandingX = spring.x + spring.launchVx * flightFrames;
  const checks = [
    { id: "zone_in_world", passed: boundsInside(zone.bounds, WORLD.cameraBounds) },
    { id: "camera_in_world", passed: boundsInside(zone.cameraBounds, WORLD.cameraBounds) },
    { id: "entry_matches_pass22", passed: zone.entry.x === PASS22_ZONE.exit.x && zone.entry.y === PASS22_ZONE.exit.y },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "single_leftward_route", passed: zone.playerRoute.slice(1).every((point, index) => point.x < zone.playerRoute[index].x) },
    { id: "route_endpoints", passed: zone.playerRoute[0].x === zone.entry.x && zone.playerRoute.at(-1).x === zone.exit.x },
    { id: "route_in_world", passed: zone.playerRoute.every(point => point.x >= 0 && point.y >= 0 && point.x <= WORLD.width && point.y <= WORLD.height) },
    { id: "six_floor_segments", passed: zone.floors.length === 6 && zone.floors.every(item => floorInside(item, zone.bounds)) },
    { id: "unique_collision_ids", passed: new Set([...zone.floors, ...zone.solids].map(item => item.id)).size === zone.floors.length + zone.solids.length },
    { id: "one_moving_platform", passed: zone.movingPlatforms.length === 1 && zone.movingPlatforms[0].xMax > zone.movingPlatforms[0].xMin },
    { id: "platform_bridges_gap", passed: zone.movingPlatforms[0].xMin + zone.movingPlatforms[0].width >= zone.floors[2].x1 && zone.movingPlatforms[0].xMax <= zone.floors[1].x2 },
    { id: "two_ordered_enemies", passed: zone.enemies.length === 2 && zone.enemies.every((item, index) => item.order === index + 1 && item.health === 1) },
    { id: "two_followup_anchors", passed: zone.anchors.length === 2 && zone.anchors.map(item => item.order).join(",") === "4,5" },
    { id: "anchors_reachable", passed: zone.anchors.every(item => item.attachRadius >= 500 && item.ropeLength >= 340) },
    { id: "leftward_spring", passed: spring.direction === "left" && spring.requiredInput === "KeyA" && spring.launchVx <= -18 },
    { id: "spring_on_runway", passed: spring.x >= springFloor.x1 && spring.x + spring.width <= springFloor.x2 && spring.y + spring.height === springFloor.y1 },
    { id: "spring_projected_landing", passed: projectedLandingX >= spring.landingX1 && projectedLandingX <= spring.landingX2 },
    { id: "hazard_covers_escape_gap", passed: zone.hazard.x1 === exitFloor.x2 && zone.hazard.x2 === springFloor.x1 },
    { id: "pursuer_route_leftward", passed: zone.pursuer.route.slice(1).every((point, index) => point.x < zone.pursuer.route[index].x) },
    { id: "pursuer_fair_delay", passed: zone.pursuer.spawnDelayFrames >= 100 && zone.pursuer.speed < PLAYER_PHYSICS.runSpeed },
    { id: "mixed_requirements", passed: zone.milestones.requiredPlatformRides === 1 && zone.milestones.requiredEnemyDefeats === 2 && zone.milestones.requiredAnchors === 2 && zone.milestones.requiredSpringLaunches === 1 },
    { id: "late_checkpoint_identity", passed: zone.checkpoint.id === "mega_stage_late_cp" && zone.checkpoint.screenId === "mega_23" && zone.checkpoint.requiredOrder === 23 },
    { id: "level_fills_world", passed: boundsInside(PASS23_LEVEL.bounds, WORLD.cameraBounds) && PASS23_LEVEL.bounds.height === WORLD.height - PASS23_LEVEL.bounds.y },
    { id: "palette_complete", passed: ["background", "stone", "edge", "carriage", "enemy", "anchor", "spring", "pursuer", "checkpoint"].every(key => typeof zone.palette[key] === "string") },
  ];
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, flightFrames, projectedLandingX, checks: Object.freeze(checks) });
}
