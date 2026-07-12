import { WORLD, ZONES } from "./blueprint.js";

export const PLAYER_PHYSICS = Object.freeze({
  width: 34,
  height: 48,
  runSpeed: 5.35,
  groundAcceleration: 0.72,
  airAcceleration: 0.42,
  groundFriction: 0.78,
  airFriction: 0.96,
  gravity: 0.68,
  maxFallSpeed: 15.5,
  jumpSpeed: 12.5,
  jumpCutMultiplier: 0.48,
  wallSlideSpeed: 3.15,
  wallJumpX: 8.4,
  wallJumpY: 12.8,
  dashSpeed: 12.4,
  dashFrames: 11,
  dashCooldownFrames: 42,
});

const floor = (id, x1, y1, x2, y2, zone) => Object.freeze({
  id,
  x1,
  y1,
  x2,
  y2,
  zone,
});

const solid = (id, x, y, width, height, role) => Object.freeze({
  id,
  x,
  y,
  width,
  height,
  role,
});

export const PASS03_LEVEL = Object.freeze({
  id: "pass03_start_and_double_climb",
  bounds: Object.freeze({ x: 0, y: 300, width: 4800, height: 3200 }),
  cameraBounds: Object.freeze({ x: 0, y: 300, width: 4800, height: 3200 }),
  spawn: Object.freeze({ x: 600, y: 852 }),
  zone01Exit: Object.freeze({ x: 2800, y: 1700 }),
  exit: Object.freeze({ x: 4400, y: 3100 }),
  floors: Object.freeze([
    floor("start_flat", 0, 900, 650, 900, 1),
    floor("garden_descent_a", 650, 900, 1180, 1100, 1),
    floor("garden_rise", 1180, 1100, 1500, 1040, 1),
    floor("garden_descent_b", 1500, 1040, 2030, 1320, 1),
    floor("broken_slope", 2030, 1320, 2450, 1480, 1),
    floor("zone01_exit_slope", 2450, 1480, 2800, 1700, 1),
    floor("first_drop_lip", 2800, 1700, 2860, 1700, 2),
    floor("first_pit_floor", 2860, 2150, 3250, 2150, 2),
    floor("first_exit_ledge", 3290, 1950, 3500, 1950, 2),
    floor("between_climbs_a", 3500, 1950, 3580, 2080, 2),
    floor("between_climbs_b", 3580, 2080, 3650, 2280, 2),
    floor("second_pit_floor", 3650, 2650, 4010, 2650, 2),
    floor("second_exit_ledge", 4050, 2410, 4210, 2410, 2),
    floor("exit_descent_a", 4210, 2410, 4280, 2600, 2),
    floor("exit_descent_b", 4280, 2600, 4340, 2850, 2),
    floor("exit_descent_c", 4340, 2850, 4400, 3100, 2),
    floor("pass03_exit", 4400, 3100, 4750, 3100, 2),
  ]),
  solids: Object.freeze([
    solid("first_overhang", 3000, 1550, 40, 430, "baffle"),
    solid("first_climb_right", 3250, 1950, 40, 200, "wall"),
    solid("first_ledge_mass", 3290, 1950, 210, 54, "ledge"),
    solid("second_overhang", 3760, 2050, 40, 420, "baffle"),
    solid("second_climb_right", 4010, 2410, 40, 240, "wall"),
    solid("second_ledge_mass", 4050, 2410, 160, 54, "ledge"),
  ]),
  gates: Object.freeze({
    firstDropY: 2100,
    firstExitX: 3290,
    firstExitY: 2005,
    secondDropY: 2600,
    secondExitX: 4050,
    secondExitY: 2465,
    completionX: 4400,
    completionY: 3020,
  }),
});

const boundsInside = (inner, outer) => (
  inner.x >= outer.x && inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height
);

const floorInside = (item, bounds) => (
  item.x1 >= bounds.x && item.x2 <= bounds.x + bounds.width &&
  item.y1 >= bounds.y && item.y1 <= bounds.y + bounds.height &&
  item.y2 >= bounds.y && item.y2 <= bounds.y + bounds.height
);

export function validatePass03Level() {
  const p = PLAYER_PHYSICS;
  const level = PASS03_LEVEL;
  const theoreticalJumpRise = (p.jumpSpeed * p.jumpSpeed) / (2 * p.gravity);
  const firstWallHeight = 2150 - 1950;
  const secondWallHeight = 2650 - 2410;
  const firstUnderpass = 2150 - (1550 + 430);
  const secondUnderpass = 2650 - (2050 + 420);
  const checks = [
    { id: "world_contains_level", passed: boundsInside(level.bounds, WORLD.cameraBounds) },
    { id: "camera_contains_level", passed: boundsInside(level.bounds, level.cameraBounds) },
    { id: "spawn_matches_blueprint", passed: level.spawn.x === ZONES[0].entry.x && level.spawn.y + p.height === ZONES[0].entry.y },
    { id: "zone01_exit_matches_blueprint", passed: level.zone01Exit.x === ZONES[0].exit.x && level.zone01Exit.y === ZONES[0].exit.y },
    { id: "pass03_exit_matches_blueprint", passed: level.exit.x === ZONES[1].exit.x && level.exit.y === ZONES[1].exit.y },
    { id: "floor_count", passed: level.floors.length === 17 },
    { id: "floors_ordered", passed: level.floors.every(item => item.x2 > item.x1) },
    { id: "floors_in_bounds", passed: level.floors.every(item => floorInside(item, level.bounds)) },
    { id: "solids_in_bounds", passed: level.solids.every(item => boundsInside(item, level.bounds)) },
    { id: "two_baffles", passed: level.solids.filter(item => item.role === "baffle").length === 2 },
    { id: "two_climb_walls", passed: level.solids.filter(item => item.role === "wall").length === 2 },
    { id: "first_underpass_clearance", passed: firstUnderpass >= p.height * 2 },
    { id: "second_underpass_clearance", passed: secondUnderpass >= p.height * 2 },
    { id: "first_requires_walljump", passed: firstWallHeight > theoreticalJumpRise * 1.5 },
    { id: "second_requires_walljump", passed: secondWallHeight > theoreticalJumpRise * 1.8 },
    { id: "walljump_corridor_width", passed: 3250 - 3040 >= p.width * 6 && 4010 - 3800 >= p.width * 6 },
    { id: "macro_exit_lower", passed: level.exit.y > level.zone01Exit.y },
    { id: "run_speed", passed: p.runSpeed === 5.35 },
    { id: "variable_jump", passed: p.jumpCutMultiplier > 0 && p.jumpCutMultiplier < 1 },
    { id: "air_dash", passed: p.dashFrames === 11 && p.dashSpeed > p.runSpeed * 2 },
  ];

  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    theoreticalJumpRise,
    checks: Object.freeze(checks),
  });
}
