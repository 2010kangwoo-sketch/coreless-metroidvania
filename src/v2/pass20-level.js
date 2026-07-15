import { WORLD } from "./blueprint.js";
import { PLAYER_PHYSICS } from "./pass03-level.js";
import { PASS18_ZONE } from "./pass18-level.js";
import { PASS19_LEVEL } from "./pass19-level.js";

const floor = (id, x1, y1, x2, y2, lane) => Object.freeze({
  id, x1, y1, x2, y2, lane, phase: 20, zone: 12,
});

const solid = (id, x, y, width, height, role) => Object.freeze({
  id, x, y, width, height, role, phase: 20,
});

export const PASS20_ZONE = Object.freeze({
  id: "pass20_chase_spring_flight",
  name: "CHASE SPRING FLIGHT",
  bounds: Object.freeze({ x: 29400, y: 9900, width: 5000, height: 1900 }),
  cameraBounds: Object.freeze({ x: 29100, y: 9700, width: 5600, height: 2300 }),
  entry: PASS18_ZONE.exit,
  exit: Object.freeze({ x: 33700, y: 11160 }),
  playerRoute: Object.freeze([
    [29400, 10520], [29980, 10600], [30275, 10600], [30720, 10390],
    [31200, 10470], [31620, 10880], [32400, 10995], [33700, 11160],
  ].map(([x, y]) => Object.freeze({ x, y }))),
  floors: Object.freeze([
    floor("pass20_spring_runway", 29880, 10600, 30380, 10600, "launch"),
    floor("pass20_landing_basin", 31520, 10880, 32500, 11020, "landing"),
    floor("pass20_exit_slope", 32500, 11020, 34100, 11220, "checkpoint"),
  ]),
  solids: Object.freeze([
    solid("pass20_exit_buttress", 34080, 10820, 90, 400, "pass20_exit_wall"),
  ]),
  hazard: Object.freeze({
    id: "pass20_spring_chasm",
    x1: 30380,
    x2: 31520,
    tipY: 11320,
    baseY: 11900,
  }),
  spring: Object.freeze({
    id: "pass20_horizontal_chase_spring",
    x: 30210,
    y: 10576,
    width: 130,
    height: 24,
    direction: "right",
    launchVx: 22,
    launchVy: -16.8,
    preserveFrames: 68,
    requiredInput: "KeyD",
    landingX1: 31520,
    landingX2: 32180,
  }),
  milestones: Object.freeze({
    enteredX: 29920,
    readyX: 30160,
    apexBottomY: 10430,
    chasmClearX: 31520,
    landingX1: 31520,
    landingX2: 32500,
    completionX: 33680,
    completionY: 11120,
    requiredLaunches: 1,
    requiredLandings: 1,
  }),
  checkpoint: Object.freeze({ id: "pass20_spring_exit", x: 33700, y: 11160 }),
  cameraFlight: Object.freeze({ x: 31060, y: 10620, zoom: 0.78 }),
  palette: Object.freeze({
    spring: "#efb96f",
    springCore: "#f7e4a8",
    trajectory: "#dce9c0",
    hazard: "#b85f56",
    landing: "#8fd4b1",
    checkpoint: "#e3cb7b",
  }),
});

export const PASS20_LEVEL = Object.freeze({
  id: "pass20_directional_chase_spring",
  bounds: Object.freeze({ x: 0, y: 300, width: 34500, height: 11600 }),
  cameraBounds: WORLD.cameraBounds,
  spawn: PASS19_LEVEL.spawn,
  floors: PASS20_ZONE.floors,
  solids: PASS20_ZONE.solids,
  hazards: Object.freeze([PASS20_ZONE.hazard]),
  exit: PASS20_ZONE.exit,
});

const boundsInside = (inner, outer) => inner.x >= outer.x && inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
const floorInside = (item, bounds) => item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width &&
  item.y1 >= bounds.y && item.y2 >= bounds.y && item.y1 <= bounds.y + bounds.height && item.y2 <= bounds.y + bounds.height;

export function validatePass20Level() {
  const zone = PASS20_ZONE;
  const spring = zone.spring;
  const floors = zone.floors;
  const launchFloor = floors.find(item => item.lane === "launch");
  const landingFloor = floors.find(item => item.lane === "landing");
  const ordinaryJumpReach = (PLAYER_PHYSICS.runSpeed * PLAYER_PHYSICS.jumpSpeed * 2) / PLAYER_PHYSICS.gravity + PLAYER_PHYSICS.dashSpeed * PLAYER_PHYSICS.dashFrames;
  const gapWidth = landingFloor.x1 - launchFloor.x2;
  const flightToLandingFrames = (Math.abs(spring.launchVy) + Math.sqrt(spring.launchVy ** 2 + 2 * PLAYER_PHYSICS.gravity * (landingFloor.y1 - launchFloor.y1))) / PLAYER_PHYSICS.gravity;
  const projectedLandingX = spring.x + spring.launchVx * flightToLandingFrames;
  const checks = [
    { id: "world_extended_width", passed: WORLD.width === 35000 },
    { id: "world_extended_height", passed: WORLD.height === 12200 },
    { id: "zone_in_world", passed: boundsInside(zone.bounds, WORLD.cameraBounds) },
    { id: "camera_in_world", passed: boundsInside(zone.cameraBounds, WORLD.cameraBounds) },
    { id: "entry_matches_pass19", passed: zone.entry.x === PASS19_LEVEL.exit.x && zone.entry.y === PASS19_LEVEL.exit.y },
    { id: "exit_lower_than_entry", passed: zone.exit.y > zone.entry.y },
    { id: "single_forward_route", passed: zone.playerRoute.every((point, index) => index === 0 || point.x > zone.playerRoute[index - 1].x) },
    { id: "route_endpoints", passed: zone.playerRoute[0].x === zone.entry.x && zone.playerRoute.at(-1).x === zone.exit.x },
    { id: "route_in_world", passed: zone.playerRoute.every(point => point.x >= 0 && point.y >= 0 && point.x <= WORLD.width && point.y <= WORLD.height) },
    { id: "three_floor_segments", passed: floors.length === 3 },
    { id: "floors_in_zone", passed: floors.every(item => floorInside(item, zone.bounds)) },
    { id: "floors_ordered", passed: floors.every(item => item.x2 > item.x1) },
    { id: "phase_20_floors", passed: floors.every(item => item.phase === 20) },
    { id: "unique_floor_ids", passed: new Set(floors.map(item => item.id)).size === floors.length },
    { id: "one_launch_floor", passed: floors.filter(item => item.lane === "launch").length === 1 },
    { id: "one_landing_floor", passed: floors.filter(item => item.lane === "landing").length === 1 },
    { id: "long_chasm", passed: gapWidth === 1140 },
    { id: "ordinary_move_insufficient", passed: gapWidth > ordinaryJumpReach * 2 },
    { id: "spring_on_runway", passed: spring.x >= launchFloor.x1 && spring.x + spring.width <= launchFloor.x2 && spring.y + spring.height === launchFloor.y1 },
    { id: "directional_right", passed: spring.direction === "right" && spring.requiredInput === "KeyD" },
    { id: "horizontal_launch_speed", passed: spring.launchVx >= 20 && spring.launchVx <= 24 },
    { id: "vertical_launch_speed", passed: spring.launchVy <= -15 && spring.launchVy >= -19 },
    { id: "inertia_window", passed: spring.preserveFrames >= 56 && spring.preserveFrames <= 76 },
    { id: "projected_landing", passed: projectedLandingX >= spring.landingX1 && projectedLandingX <= spring.landingX2 },
    { id: "landing_target_matches_floor", passed: spring.landingX1 === landingFloor.x1 && spring.landingX2 <= landingFloor.x2 },
    { id: "hazard_covers_chasm", passed: zone.hazard.x1 === launchFloor.x2 && zone.hazard.x2 === landingFloor.x1 },
    { id: "hazard_below_arc", passed: zone.hazard.tipY > landingFloor.y1 && zone.hazard.baseY <= PASS20_LEVEL.bounds.y + PASS20_LEVEL.bounds.height },
    { id: "single_exit_wall", passed: zone.solids.length === 1 && zone.solids[0].role === "pass20_exit_wall" },
    { id: "solid_in_zone", passed: zone.solids.every(item => boundsInside(item, zone.bounds)) },
    { id: "completion_requirements", passed: zone.milestones.requiredLaunches === 1 && zone.milestones.requiredLandings === 1 },
    { id: "checkpoint_at_exit", passed: zone.checkpoint.x === zone.exit.x && zone.checkpoint.y === zone.exit.y },
    { id: "flight_camera_wide", passed: zone.cameraFlight.zoom >= 0.72 && zone.cameraFlight.zoom <= 0.84 },
    { id: "level_bounds_in_world", passed: boundsInside(PASS20_LEVEL.bounds, WORLD.cameraBounds) },
    { id: "level_camera_matches_world", passed: PASS20_LEVEL.cameraBounds === WORLD.cameraBounds },
    { id: "spawn_retained", passed: PASS20_LEVEL.spawn === PASS19_LEVEL.spawn },
    { id: "palette_complete", passed: ["spring", "springCore", "trajectory", "hazard", "landing", "checkpoint"].every(key => typeof zone.palette[key] === "string") },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    gapWidth,
    ordinaryJumpReach,
    flightToLandingFrames,
    projectedLandingX,
    checks: Object.freeze(checks),
  });
}
