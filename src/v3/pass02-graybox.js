import { ROOM_HEIGHT, ROOM_WIDTH, ROOMS } from "./mega-room-layout.js";

export const PASS02_BUILD = Object.freeze({
  id: "rebuild-v3-pass02",
  pass: 2,
  branch: "rebuild/mega-room-v3-40pass",
  finalArtIncluded: false,
  playableRooms: Object.freeze(["r01", "r02", "r03"]),
});

export const PASS02_WORLD = Object.freeze({
  width: ROOM_WIDTH * 3,
  height: ROOM_HEIGHT,
  floorY: 760,
  spawn: Object.freeze({ x: 170, y: 696 }),
});

const solid = (id, x, y, width, height, role = "terrain") =>
  Object.freeze({ id, x, y, width, height, role });

export const PASS02_SOLIDS = Object.freeze([
  solid("world-left", -80, 0, 80, PASS02_WORLD.height, "boundary"),
  solid("world-right", PASS02_WORLD.width, 0, 80, PASS02_WORLD.height, "boundary"),
  solid("room1-floor", 0, 760, 1600, 140),
  solid("room1-step-low", 500, 700, 190, 60, "practice"),
  solid("room1-step-mid", 820, 640, 190, 120, "practice"),
  solid("room1-step-high", 1120, 570, 210, 190, "practice"),
  solid("room1-exit-lip", 1430, 720, 170, 40, "threshold"),

  solid("room2-floor", 1600, 760, 1600, 140),
  solid("room2-platform-low", 1790, 675, 190, 24, "recovery"),
  solid("room2-platform-mid", 2090, 585, 190, 24, "recovery"),
  solid("room2-platform-high", 2410, 480, 190, 24, "recovery"),
  solid("room2-reward-shelf", 2710, 380, 260, 24, "optional"),
  solid("room2-ceiling-gauge", 2130, 260, 560, 24, "ceiling"),
  solid("room2-recovery-step", 2920, 650, 180, 110, "recovery"),

  solid("room3-floor", 3200, 760, 1600, 140),
  solid("room3-altar-base", 3390, 710, 300, 50, "ability"),
  solid("room3-rise-one", 3740, 610, 360, 150, "ability-test"),
  solid("room3-rise-two", 4130, 455, 230, 305, "ability-test"),
  solid("room3-landing", 4410, 330, 366, 24, "recovery"),
  solid("room3-exit-floor", 4470, 720, 330, 40, "threshold"),
]);

export const PASS02_TRIGGERS = Object.freeze([
  Object.freeze({
    id: "double-jump-altar",
    type: "ability",
    ability: "doubleJump",
    x: 3330,
    y: 620,
    width: 335,
    height: 140,
  }),
  Object.freeze({
    id: "pass02-finish",
    type: "finish",
    x: 4600,
    y: 250,
    width: 150,
    height: 510,
  }),
]);

export const PASS02_ROOM_SUMMARIES = Object.freeze(ROOMS.slice(0, 3).map((room, index) =>
  Object.freeze({
    id: room.id,
    name: room.name,
    mechanic: room.mechanic,
    x: index * ROOM_WIDTH,
    width: ROOM_WIDTH,
    checkpoint: room.checkpoint,
  })));

export const PASS02_TUNING_TARGETS = Object.freeze({
  horizontalTopSpeed: Object.freeze([390, 430]),
  timeToNinetyPercentSpeed: Object.freeze([0.38, 0.65]),
  groundStopTime: Object.freeze([0.08, 0.22]),
  fullJumpHeight: Object.freeze([125, 175]),
  shortJumpHeight: Object.freeze([55, 115]),
  doubleJumpAdditionalHeight: Object.freeze([100, 170]),
  coyoteTimeSeconds: Object.freeze([0.08, 0.13]),
  jumpBufferSeconds: Object.freeze([0.09, 0.15]),
  cameraFollowHalfLifeSeconds: Object.freeze([0.07, 0.14]),
});

export function roomAtX(x) {
  const index = Math.max(0, Math.min(PASS02_ROOM_SUMMARIES.length - 1, Math.floor(x / ROOM_WIDTH)));
  return PASS02_ROOM_SUMMARIES[index];
}

export function validatePass02Graybox() {
  const checks = [
    ["threePlayableRooms", PASS02_ROOM_SUMMARIES.length === 3],
    ["roomsMatchPass01", PASS02_ROOM_SUMMARIES.every((room, index) => room.id === ROOMS[index].id)],
    ["worldMatchesThreeRooms", PASS02_WORLD.width === ROOM_WIDTH * 3 && PASS02_WORLD.height === ROOM_HEIGHT],
    ["spawnAboveFloor", PASS02_WORLD.spawn.y < PASS02_WORLD.floorY],
    ["continuousFloors", ["room1-floor", "room2-floor", "room3-floor"].every(id => PASS02_SOLIDS.some(item => item.id === id))],
    ["variableJumpPlatforms", PASS02_SOLIDS.filter(item => item.id.startsWith("room2-platform")).length === 3],
    ["safeRecoveryStep", PASS02_SOLIDS.some(item => item.id === "room2-recovery-step")],
    ["doubleJumpPickup", PASS02_TRIGGERS.some(item => item.ability === "doubleJump")],
    ["twoStageRise", PASS02_SOLIDS.some(item => item.id === "room3-rise-one") && PASS02_SOLIDS.some(item => item.id === "room3-rise-two")],
    ["finishTrigger", PASS02_TRIGGERS.some(item => item.type === "finish")],
    ["noFinalArt", PASS02_BUILD.finalArtIncluded === false],
    ["allSolidsPositive", PASS02_SOLIDS.every(item => item.width > 0 && item.height > 0)],
    ["allGameplayInsideWorld", PASS02_SOLIDS.filter(item => item.role !== "boundary").every(item => item.x >= 0 && item.x + item.width <= PASS02_WORLD.width)],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
  });
}
