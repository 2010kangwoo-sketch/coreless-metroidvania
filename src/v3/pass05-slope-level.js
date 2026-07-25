import { PLAYER_PHYSICS, slopeSurfaceYAt } from "./player-physics.js";

export const PASS05_BUILD = Object.freeze({
  id: "rebuild-v3-pass05",
  pass: 5,
  branch: "rebuild/mega-room-v3-40pass",
  scope: "isolated slope movement test",
  canonicalRoom: false,
  finalArtIncluded: false,
  releasePurpose: "room 04 slope control foundation",
});

export const PASS05_WORLD = Object.freeze({
  width: 3100,
  height: 1000,
  floorY: 760,
  spawn: Object.freeze({ x: 120, y: 696 }),
});

const solid = (id, x, y, width, height, role) =>
  Object.freeze({ id, x, y, width, height, role });
const slope = (id, x, y, width, height, direction, purpose) =>
  Object.freeze({ id, x, y, width, height, direction, role: "slope", purpose });

export const PASS05_SOLIDS = Object.freeze([
  solid("world-left", -80, 0, 80, 1000, "boundary"),
  solid("world-right", 3100, 0, 80, 1000, "boundary"),
  solid("start-floor", 0, 760, 280, 240, "terrain"),
  slope("gentle-climb", 280, 610, 600, 150, "up-right", "teach controlled uphill movement"),
  solid("crest-stop", 880, 610, 300, 390, "rest"),
  slope("steep-descent", 1180, 610, 400, 240, "down-right", "teach released-input downhill slide"),
  solid("lower-brake-zone", 1580, 850, 420, 150, "rest"),
  slope("gentle-recovery", 2000, 700, 600, 150, "up-right", "confirm predictable second climb"),
  solid("exit-plateau", 2600, 700, 420, 300, "exit"),
]);

export const PASS05_TRIGGERS = Object.freeze([
  Object.freeze({
    id: "slope-test-finish",
    type: "finish",
    x: 2700,
    y: 520,
    width: 260,
    height: 180,
  }),
]);

export const PASS05_TARGETS = Object.freeze({
  gentleGrade: Object.freeze([0.2, 0.3]),
  steepGrade: Object.freeze([0.55, 0.65]),
  maximumGroundStep: 5,
  gentleReleaseStopSpeed: 30,
  steepReleaseMinimumTravel: 45,
  maximumSteepSlideSpeed: PLAYER_PHYSICS.slopeMaximumSlideSpeed,
  minimumSlopeLandings: 1,
});

const gradeOf = item => item.height / item.width;
const endpoint = (item, side) => slopeSurfaceYAt(item, side === "left" ? item.x : item.x + item.width);

export function validatePass05SlopeLevel() {
  const slopes = PASS05_SOLIDS.filter(item => item.role === "slope");
  const gentle = slopes.find(item => item.id === "gentle-climb");
  const steep = slopes.find(item => item.id === "steep-descent");
  const recovery = slopes.find(item => item.id === "gentle-recovery");
  const checks = [
    ["isolatedNonCanonicalRoom", PASS05_BUILD.canonicalRoom === false],
    ["releasePurposeRecorded", PASS05_BUILD.releasePurpose.includes("room 04")],
    ["noFinalArt", PASS05_BUILD.finalArtIncluded === false],
    ["threePurposefulSlopes", slopes.length === 3 && slopes.every(item => item.purpose.length > 20)],
    ["gentleGradeInTarget", gentle && gradeOf(gentle) >= 0.2 && gradeOf(gentle) <= 0.3],
    ["steepGradeInTarget", steep && gradeOf(steep) >= 0.55 && gradeOf(steep) <= 0.65],
    ["recoveryGradeMatchesLesson", recovery && gradeOf(recovery) === gradeOf(gentle)],
    ["startSeamContinuous", gentle && endpoint(gentle, "left") === 760],
    ["crestSeamContinuous", gentle && endpoint(gentle, "right") === 610],
    ["descentStartsAtCrest", steep && endpoint(steep, "left") === 610],
    ["descentEndsAtBrakeZone", steep && endpoint(steep, "right") === 850],
    ["recoveryStartsAtLowerFloor", recovery && endpoint(recovery, "left") === 850],
    ["recoveryEndsAtExit", recovery && endpoint(recovery, "right") === 700],
    ["wideBrakeZone", PASS05_SOLIDS.some(item => item.id === "lower-brake-zone" && item.width >= 400)],
    ["noHazardsInFirstLesson", !PASS05_SOLIDS.some(item => item.role === "hazard")],
    ["finishOnWidePlateau", PASS05_SOLIDS.some(item => item.id === "exit-plateau" && item.width >= 400)],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
  });
}
