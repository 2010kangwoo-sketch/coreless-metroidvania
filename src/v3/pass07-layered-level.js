import {
  PASS02_SOLIDS,
  PASS02_TRIGGERS,
  PASS02_WORLD,
} from "./pass02-graybox.js";
import {
  ROOM_HEIGHT,
  ROOM_WIDTH,
  TIER_GAP,
  ROOMS,
} from "./mega-room-layout.js";
import {
  PASS06_CHECKPOINTS,
  PASS06_GATE,
  PASS06_OPTIONAL_REWARD,
} from "./pass06-tutorial.js";

export const PASS07_BUILD = Object.freeze({
  id: "rebuild-v3-pass07",
  pass: 7,
  branch: "rebuild/mega-room-v3-40pass",
  scope: "canonical layered rooms 01-04",
  canonicalRooms: Object.freeze(["r01", "r02", "r03", "r04"]),
  finalArtIncluded: false,
  releaseMilestone: "first real tier turn",
});

export const PASS07_LAYER = Object.freeze({
  upperY: 0,
  lowerY: ROOM_HEIGHT + TIER_GAP,
  tierGap: TIER_GAP,
  lowerDirection: "east",
  upperDirection: "west",
});

export const PASS07_WORLD = Object.freeze({
  width: ROOM_WIDTH * 3,
  height: ROOM_HEIGHT * 2 + TIER_GAP,
  spawn: Object.freeze({
    x: PASS02_WORLD.spawn.x,
    y: PASS02_WORLD.spawn.y + PASS07_LAYER.lowerY,
  }),
});

const translate = (item, yOffset) => Object.freeze({
  ...item,
  y: item.y + yOffset,
});
const solid = (id, x, y, width, height, role, purpose = "") =>
  Object.freeze({ id, x, y, width, height, role, purpose });
const slope = (id, x, y, width, height, direction, purpose) =>
  Object.freeze({ id, x, y, width, height, direction, role: "slope", purpose });

const lowerSolids = PASS02_SOLIDS
  .filter(item => item.role !== "boundary")
  .map(item => translate(item, PASS07_LAYER.lowerY));

export const PASS07_SOLIDS = Object.freeze([
  solid("world-left", -80, 0, 80, PASS07_WORLD.height, "boundary"),
  solid("world-right", PASS07_WORLD.width, 0, 80, PASS07_WORLD.height, "boundary"),
  ...lowerSolids,
  solid(
    "room3-lift-recovery-low",
    4430,
    1760,
    170,
    24,
    "recovery",
    "first one-way recovery step after a missed upper landing",
  ),
  solid(
    "room3-lift-recovery-mid",
    4250,
    1620,
    170,
    24,
    "recovery",
    "second one-way recovery step returning to the ability route",
  ),

  solid(
    "room4-west-brake-exit",
    3200,
    760,
    260,
    ROOM_HEIGHT - 760,
    "exit",
    "wide recovery and westward exit after the steep descent",
  ),
  slope(
    "room4-steep-descent",
    3460,
    580,
    300,
    180,
    "up-right",
    "teach a readable released-input descent while travelling west",
  ),
  solid(
    "room4-crest-stop",
    3760,
    580,
    240,
    ROOM_HEIGHT - 580,
    "rest",
    "let the player stop and read the downhill route",
  ),
  slope(
    "room4-gentle-climb",
    4000,
    580,
    480,
    120,
    "down-right",
    "introduce controlled uphill movement while travelling west",
  ),
  solid(
    "room4-east-arrival",
    4480,
    700,
    320,
    ROOM_HEIGHT - 700,
    "rest",
    "safe elevator arrival and direction-change platform",
  ),
  solid(
    "room4-west-stop",
    3120,
    0,
    80,
    900,
    "boundary",
    "prevent leaving the authored upper tier before the exit trigger",
  ),
  solid(
    "room3-room4-lift-left-rail",
    4440,
    700,
    24,
    1200,
    "noncollision",
    "visually connect the lower and upper tiers without a cut-off support",
  ),
  solid(
    "room3-room4-lift-right-rail",
    4776,
    700,
    24,
    1200,
    "noncollision",
    "visually connect the lower and upper tiers without a cut-off support",
  ),
]);

const lowerTriggers = PASS02_TRIGGERS
  .filter(item => item.type === "ability")
  .map(item => translate(item, PASS07_LAYER.lowerY));

export const PASS07_TRIGGERS = Object.freeze([
  ...lowerTriggers,
  Object.freeze({
    id: "pass07-tutorial-finish",
    type: "tutorialFinish",
    x: 4580,
    y: 1360,
    width: 180,
    height: 150,
  }),
  Object.freeze({
    id: "pass07-tier-lift",
    type: "tierLift",
    x: 4580,
    y: 1360,
    width: 180,
    height: 150,
  }),
  Object.freeze({
    id: "pass07-finish",
    type: "finish",
    x: 3200,
    y: 560,
    width: 80,
    height: 200,
  }),
]);

export const PASS07_GATE = translate(PASS06_GATE, PASS07_LAYER.lowerY);
export const PASS07_OPTIONAL_REWARD = translate(
  PASS06_OPTIONAL_REWARD,
  PASS07_LAYER.lowerY,
);

export const PASS07_CHECKPOINTS = Object.freeze([
  ...PASS06_CHECKPOINTS.map(checkpoint => Object.freeze({
    ...checkpoint,
    y: checkpoint.y + PASS07_LAYER.lowerY,
    activateYMin: PASS07_LAYER.lowerY,
  })),
  Object.freeze({
    id: "upper-arrival",
    x: 4620,
    y: 636,
    activateX: 4480,
    activateYMax: 760,
    room: "r04",
  }),
]);

export const PASS07_ROOM_SUMMARIES = Object.freeze([
  ...ROOMS.slice(0, 3).map((room, index) => Object.freeze({
    id: room.id,
    name: room.name,
    mechanic: room.mechanic,
    x: index * ROOM_WIDTH,
    y: PASS07_LAYER.lowerY,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    tier: 0,
    direction: "east",
  })),
  Object.freeze({
    id: ROOMS[3].id,
    name: ROOMS[3].name,
    mechanic: ROOMS[3].mechanic,
    x: ROOM_WIDTH * 2,
    y: PASS07_LAYER.upperY,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    tier: 1,
    direction: "west",
  }),
]);

export const PASS07_LIFT = Object.freeze({
  id: "east-tier-lift",
  x: 4660,
  startY: 1406,
  endY: 636,
  speed: 260,
  purpose: "make the first tier change visible, continuous, and playable",
});

export const PASS07_TARGETS = Object.freeze({
  playableTiers: 2,
  lowerRooms: 3,
  upperRooms: 1,
  minimumVerticalSeparation: TIER_GAP,
  liftDurationSeconds: Object.freeze([2.7, 3.4]),
  gentleGrade: Object.freeze([0.2, 0.3]),
  steepGrade: Object.freeze([0.55, 0.65]),
  minimumArrivalWidth: 300,
  minimumBrakeWidth: 240,
  maximumGroundedPositionStep: 5,
});

export function pass07RoomAtPosition(position) {
  if (
    position.y < ROOM_HEIGHT &&
    position.x >= ROOM_WIDTH * 2
  ) {
    return PASS07_ROOM_SUMMARIES[3];
  }
  const lowerIndex = Math.max(
    0,
    Math.min(2, Math.floor(position.x / ROOM_WIDTH)),
  );
  return PASS07_ROOM_SUMMARIES[lowerIndex];
}

const gradeOf = item => item.height / item.width;

export function validatePass07LayeredLevel() {
  const lowerRooms = PASS07_ROOM_SUMMARIES.filter(room => room.tier === 0);
  const upperRooms = PASS07_ROOM_SUMMARIES.filter(room => room.tier === 1);
  const gentle = PASS07_SOLIDS.find(item => item.id === "room4-gentle-climb");
  const steep = PASS07_SOLIDS.find(item => item.id === "room4-steep-descent");
  const arrival = PASS07_SOLIDS.find(item => item.id === "room4-east-arrival");
  const brake = PASS07_SOLIDS.find(item => item.id === "room4-west-brake-exit");
  const rails = PASS07_SOLIDS.filter(item => item.id.includes("lift") && item.id.includes("rail"));
  const liftRecovery = PASS07_SOLIDS.filter(item => item.id.startsWith("room3-lift-recovery"));
  const finalTutorialLanding = PASS07_SOLIDS.find(item => item.id === "room3-landing");
  const checks = [
    ["fourCanonicalRooms", PASS07_BUILD.canonicalRooms.join(",") === "r01,r02,r03,r04"],
    ["worldContainsTwoTiers", PASS07_WORLD.height === ROOM_HEIGHT * 2 + TIER_GAP],
    ["threeLowerRooms", lowerRooms.length === PASS07_TARGETS.lowerRooms],
    ["oneUpperRoom", upperRooms.length === PASS07_TARGETS.upperRooms],
    ["upperRoomActuallyAboveLowerRooms", upperRooms.every(upper => upper.y + upper.height <= lowerRooms[0].y - TIER_GAP)],
    ["roomFourStacksAboveRoomThree", upperRooms[0].x === lowerRooms[2].x],
    ["tierGapPreserved", lowerRooms[0].y - (upperRooms[0].y + upperRooms[0].height) === TIER_GAP],
    ["routeTurnsWestOnUpperTier", lowerRooms.every(room => room.direction === "east") && upperRooms[0].direction === "west"],
    ["continuousLiftHasPurpose", PASS07_LIFT.purpose.includes("continuous")],
    ["liftTravelsFullTierChange", PASS07_LIFT.startY - PASS07_LIFT.endY >= 700],
    ["liftDurationInTarget", (PASS07_LIFT.startY - PASS07_LIFT.endY) / PASS07_LIFT.speed >= 2.7 && (PASS07_LIFT.startY - PASS07_LIFT.endY) / PASS07_LIFT.speed <= 3.4],
    ["liftRailsContinueBetweenFloors", rails.length === 2 && rails.every(rail => rail.y === 700 && rail.y + rail.height === 1900)],
    ["missedLiftHasRecoveryRoute", liftRecovery.length === 2 && liftRecovery.every(item => item.role === "recovery" && item.purpose.includes("recovery"))],
    ["finalTutorialLandingIsGenerous", finalTutorialLanding.width >= 360],
    ["gentleSlopePurposeful", gentle.purpose.includes("uphill")],
    ["gentleGradeInTarget", gradeOf(gentle) >= 0.2 && gradeOf(gentle) <= 0.3],
    ["steepSlopePurposeful", steep.purpose.includes("descent")],
    ["steepGradeInTarget", gradeOf(steep) >= 0.55 && gradeOf(steep) <= 0.65],
    ["wideArrivalPlatform", arrival.width >= PASS07_TARGETS.minimumArrivalWidth],
    ["wideBrakeExit", brake.width >= PASS07_TARGETS.minimumBrakeWidth],
    ["noDamageHazardsInFirstTierTurn", !PASS07_SOLIDS.some(item => item.role === "hazard")],
    ["noFinalArt", PASS07_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
  });
}
