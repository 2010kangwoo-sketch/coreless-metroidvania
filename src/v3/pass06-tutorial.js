import { PASS02_SOLIDS, PASS02_TRIGGERS, PASS02_WORLD } from "./pass02-graybox.js";

export const PASS06_BUILD = Object.freeze({
  id: "rebuild-v3-pass06",
  pass: 6,
  branch: "rebuild/mega-room-v3-40pass",
  scope: "canonical tutorial rooms 01-03",
  canonicalRooms: Object.freeze(["r01", "r02", "r03"]),
  finalArtIncluded: false,
  releaseMilestone: "tutorial integration",
});

export const PASS06_LESSONS = Object.freeze([
  Object.freeze({ id: "move", label: "이동", required: true }),
  Object.freeze({ id: "basicJumps", label: "기본 장애물 점프", required: true }),
  Object.freeze({ id: "shortJump", label: "짧은 점프", required: true }),
  Object.freeze({ id: "fullJump", label: "긴 점프", required: true }),
  Object.freeze({ id: "room2Gate", label: "도약 공방 통과", required: true }),
  Object.freeze({ id: "doubleJumpUnlock", label: "이중 점프 획득", required: true }),
  Object.freeze({ id: "doubleJumpUse", label: "이중 점프 사용", required: true }),
  Object.freeze({ id: "finish", label: "튜토리얼 완료", required: true }),
]);

export const PASS06_GATE = Object.freeze({
  id: "room2-learning-gate",
  x: 3140,
  y: 120,
  width: 60,
  height: 640,
  role: "tutorial-gate",
  purpose: "short and full jump confirmation before room 03",
});

export const PASS06_CHECKPOINTS = Object.freeze([
  Object.freeze({ id: "arrival", x: 170, y: 696, activateX: 0, room: "r01" }),
  Object.freeze({ id: "workshop", x: 1650, y: 696, activateX: 1600, room: "r02" }),
  Object.freeze({ id: "altar", x: 3260, y: 696, activateX: 3200, room: "r03" }),
]);

export const PASS06_OPTIONAL_REWARD = Object.freeze({
  id: "room2-mastery-seal",
  type: "optionalReward",
  x: 2780,
  y: 300,
  width: 90,
  height: 80,
  purpose: "reward the optional upper platform route without blocking beginners",
});

export const PASS06_JUMP_TARGETS = Object.freeze({
  shortHeight: Object.freeze([55, 115]),
  fullHeight: Object.freeze([125, 175]),
  roomOneMinimumJumps: 3,
  maximumRequiredPrecisionGap: 210,
});

export function createTutorialProgress() {
  return {
    move: false,
    basicJumps: false,
    shortJump: false,
    fullJump: false,
    room2Gate: false,
    doubleJumpUnlock: false,
    doubleJumpUse: false,
    finish: false,
  };
}

export function requiredLessonCount(progress) {
  return PASS06_LESSONS.filter(lesson => lesson.required && progress[lesson.id]).length;
}

export function roomTwoGateOpen(progress) {
  return progress.shortJump && progress.fullJump;
}

export function canFinishTutorial(progress) {
  return PASS06_LESSONS
    .filter(lesson => lesson.required && lesson.id !== "finish")
    .every(lesson => progress[lesson.id]);
}

export function tutorialInstruction(progress, currentRoom) {
  if (!progress.move) {
    return Object.freeze({ id: "move", text: "A/D로 오른쪽 표식까지 이동하세요" });
  }
  if (!progress.basicJumps) {
    return Object.freeze({ id: "basicJumps", text: "SPACE를 눌러 세 개의 넓은 단차를 넘어가세요" });
  }
  if (currentRoom === "r02" && !progress.shortJump) {
    return Object.freeze({ id: "shortJump", text: "SPACE를 짧게 눌러 낮은 점프를 한 번 착지하세요" });
  }
  if (currentRoom === "r02" && !progress.fullJump) {
    return Object.freeze({ id: "fullJump", text: "SPACE를 길게 눌러 높은 점프를 한 번 착지하세요" });
  }
  if (!progress.room2Gate) {
    return Object.freeze({ id: "room2Gate", text: "두 점프를 확인했습니다 · 오른쪽 학습문으로 이동하세요" });
  }
  if (!progress.doubleJumpUnlock) {
    return Object.freeze({ id: "doubleJumpUnlock", text: "청록색 공명 제단에 닿아 이중 점프를 획득하세요" });
  }
  if (!progress.doubleJumpUse) {
    return Object.freeze({ id: "doubleJumpUse", text: "공중에서 SPACE를 한 번 더 눌러 높은 단차를 넘으세요" });
  }
  if (!progress.finish) {
    return Object.freeze({ id: "finish", text: "넓은 착지대를 거쳐 오른쪽 출구로 이동하세요" });
  }
  return Object.freeze({ id: "complete", text: "튜토리얼 완료" });
}

export function validatePass06Tutorial() {
  const practiceSteps = PASS02_SOLIDS.filter(item => item.role === "practice");
  const room2Platforms = PASS02_SOLIDS.filter(item => item.id.startsWith("room2-platform"));
  const finish = PASS02_TRIGGERS.find(item => item.type === "finish");
  const altar = PASS02_TRIGGERS.find(item => item.id === "double-jump-altar");
  const altarBase = PASS02_SOLIDS.find(item => item.id === "room3-altar-base");
  const firstAbilityLanding = PASS02_SOLIDS.find(item => item.id === "room3-rise-one");
  const checks = [
    ["canonicalFirstThreeRooms", PASS06_BUILD.canonicalRooms.join(",") === "r01,r02,r03"],
    ["tutorialMilestoneRecorded", PASS06_BUILD.releaseMilestone === "tutorial integration"],
    ["eightRequiredLessons", PASS06_LESSONS.length === 8 && PASS06_LESSONS.every(item => item.required)],
    ["safeMovementStart", PASS02_WORLD.spawn.x >= 120 && PASS02_WORLD.spawn.y === 696],
    ["threeWidePracticeSteps", practiceSteps.length >= 3 && practiceSteps.every(item => item.width >= 170)],
    ["roomTwoHasThreeRoutes", room2Platforms.length === 3],
    ["jumpPracticeOnContinuousFloor", PASS02_SOLIDS.some(item => item.id === "room2-floor" && item.width === 1600)],
    ["singlePurposefulGate", PASS06_GATE.purpose.includes("confirmation") && PASS06_GATE.width === 60],
    ["gateAfterPractice", PASS06_GATE.x > 3000 && PASS06_GATE.x < 3200],
    ["gateNeverCreatesFall", PASS06_GATE.y + PASS06_GATE.height === PASS02_WORLD.floorY],
    ["threeCheckpoints", PASS06_CHECKPOINTS.length === 3],
    ["checkpointsFollowRooms", PASS06_CHECKPOINTS.every((item, index) => item.room === `r0${index + 1}`)],
    ["optionalRewardIsNonBlocking", PASS06_OPTIONAL_REWARD.type === "optionalReward"],
    ["optionalRewardHasPurpose", PASS06_OPTIONAL_REWARD.purpose.includes("without blocking")],
    ["doubleJumpStillGranted", PASS02_TRIGGERS.some(item => item.ability === "doubleJump")],
    ["altarUnlocksBeforeItsBaseBlocks", altar.x <= altarBase.x - 38],
    ["firstAbilityLandingIsGenerous", firstAbilityLanding.width >= 320],
    ["finishStillPresent", Boolean(finish)],
    ["shortJumpTargetDistinct", PASS06_JUMP_TARGETS.shortHeight[1] < PASS06_JUMP_TARGETS.fullHeight[0]],
    ["noTutorialHazards", !PASS02_SOLIDS.some(item => item.role === "hazard")],
    ["noFinalArt", PASS06_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
  });
}
