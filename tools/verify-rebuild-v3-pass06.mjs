import fs from "node:fs";
import path from "node:path";
import { PASS02_SOLIDS } from "../src/v3/pass02-graybox.js";
import { createPlayer, stepPlayer } from "../src/v3/player-physics.js";
import {
  PASS06_CHECKPOINTS,
  PASS06_GATE,
  PASS06_JUMP_TARGETS,
  PASS06_LESSONS,
  PASS06_OPTIONAL_REWARD,
  canFinishTutorial,
  createTutorialProgress,
  requiredLessonCount,
  roomTwoGateOpen,
  tutorialInstruction,
  validatePass06Tutorial,
} from "../src/v3/pass06-tutorial.js";

const DT = 1 / 120;
const neutral = Object.freeze({ left: false, right: false, jumpPressed: false, jumpHeld: false });
const right = Object.freeze({ left: false, right: true, jumpPressed: false, jumpHeld: false });

function measureJumpHeight(holdFrames) {
  let player = createPlayer(1700, 696);
  player.grounded = true;
  let minimumY = player.y;
  for (let frame = 0; frame < 240; frame += 1) {
    player = stepPlayer(player, {
      ...neutral,
      jumpPressed: frame === 0,
      jumpHeld: frame < holdFrames,
    }, DT, PASS02_SOLIDS);
    minimumY = Math.min(minimumY, player.y);
    if (frame > 1 && player.grounded) break;
  }
  return 696 - minimumY;
}

function measureGateCollision(includeGate) {
  const solids = includeGate ? [...PASS02_SOLIDS, PASS06_GATE] : PASS02_SOLIDS;
  let player = createPlayer(3000, 696);
  player.grounded = true;
  let maximumX = player.x;
  for (let frame = 0; frame < 240; frame += 1) {
    player = stepPlayer(player, right, DT, solids);
    maximumX = Math.max(maximumX, player.x);
  }
  return { maximumX, finalX: player.x, grounded: player.grounded };
}

function measureLessonSequence() {
  const progress = createTutorialProgress();
  const sequence = [tutorialInstruction(progress, "r01").id];
  for (const id of ["move", "basicJumps"]) {
    progress[id] = true;
    sequence.push(tutorialInstruction(progress, id === "move" ? "r01" : "r02").id);
  }
  progress.shortJump = true;
  sequence.push(tutorialInstruction(progress, "r02").id);
  const gateBeforeFull = roomTwoGateOpen(progress);
  progress.fullJump = true;
  sequence.push(tutorialInstruction(progress, "r02").id);
  const gateAfterFull = roomTwoGateOpen(progress);
  for (const id of ["room2Gate", "doubleJumpUnlock", "doubleJumpUse"]) {
    progress[id] = true;
    sequence.push(tutorialInstruction(progress, "r03").id);
  }
  const canFinishBeforeMark = canFinishTutorial(progress);
  progress.finish = true;
  sequence.push(tutorialInstruction(progress, "r03").id);
  return {
    sequence,
    gateBeforeFull,
    gateAfterFull,
    canFinishBeforeMark,
    completedCount: requiredLessonCount(progress),
  };
}

const structuralAudit = validatePass06Tutorial();
const shortHeight = measureJumpHeight(8);
const fullHeight = measureJumpHeight(48);
const lockedGate = measureGateCollision(true);
const openGate = measureGateCollision(false);
const lessons = measureLessonSequence();

const checks = [
  ...structuralAudit.checks,
  ["shortJumpPhysicsInTarget", shortHeight >= PASS06_JUMP_TARGETS.shortHeight[0] && shortHeight <= PASS06_JUMP_TARGETS.shortHeight[1]],
  ["fullJumpPhysicsInTarget", fullHeight >= PASS06_JUMP_TARGETS.fullHeight[0] && fullHeight <= PASS06_JUMP_TARGETS.fullHeight[1]],
  ["jumpProfilesSeparated", fullHeight - shortHeight >= 40],
  ["closedGateStopsPlayer", lockedGate.grounded && lockedGate.maximumX <= PASS06_GATE.x - 38 + 0.01],
  ["openGateLetsPlayerPass", openGate.grounded && openGate.maximumX > 3200],
  ["oneJumpDoesNotOpenGate", !lessons.gateBeforeFull],
  ["twoProfilesOpenGate", lessons.gateAfterFull],
  ["allPrerequisitesAllowFinish", lessons.canFinishBeforeMark],
  ["allLessonsCounted", lessons.completedCount === PASS06_LESSONS.length],
  ["instructionOrderComplete", lessons.sequence.join(",") === "move,basicJumps,shortJump,fullJump,room2Gate,doubleJumpUnlock,doubleJumpUse,finish,complete"],
  ["checkpointSpawnsOnSafeFloor", PASS06_CHECKPOINTS.every(item => item.y === 696)],
  ["optionalRewardAboveRequiredFloor", PASS06_OPTIONAL_REWARD.y + PASS06_OPTIONAL_REWARD.height < 760],
].map(check => Array.isArray(check)
  ? { name: check[0], passed: Boolean(check[1]) }
  : check);

const result = {
  pass: 6,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    shortJumpHeight: Number(shortHeight.toFixed(2)),
    fullJumpHeight: Number(fullHeight.toFixed(2)),
    lockedGateMaximumX: Number(lockedGate.maximumX.toFixed(2)),
    openGateMaximumX: Number(openGate.maximumX.toFixed(2)),
    lessonSequence: lessons.sequence,
    checkpoints: PASS06_CHECKPOINTS.map(item => item.id),
  },
};

if (process.env.CORELESS_V3_PASS06_RESULT) {
  const output = path.resolve(process.env.CORELESS_V3_PASS06_RESULT);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
