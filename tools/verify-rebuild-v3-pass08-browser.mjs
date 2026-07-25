import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  PASS08_PLAYABLE_BEATS,
  STORY_CORE,
  validatePass08Story,
} from "../src/v3/pass08-story.js";

const outputPath = process.env.CORELESS_V3_PASS08_BROWSER_RESULT ??
  "docs/rebuild-v3/pass-08-browser-results.json";
const routeResultPath = path.resolve("browser-artifacts/v3-pass08-route-result.json");
const child = spawnSync(
  process.execPath,
  ["tools/verify-rebuild-v3-pass07-browser.mjs"],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CORELESS_V3_PASS07_BROWSER_RESULT: routeResultPath,
      CORELESS_V3_BROWSER_ARTIFACT_DIR: "browser-artifacts/v3-pass08",
    },
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  },
);

if (child.status !== 0) {
  process.stdout.write(child.stdout);
  process.stderr.write(child.stderr);
  process.exit(child.status ?? 1);
}

const route = JSON.parse(fs.readFileSync(routeResultPath, "utf8"));
const storyAudit = validatePass08Story();
const expectedOrder = PASS08_PLAYABLE_BEATS.map(item => item.id);
const actualOrder = route.measurements.storyOrder;
const checks = [
  ["underlyingLayeredRoutePassed", route.passed],
  ["storyStructurePassed", storyAudit.passed],
  ["prologueWasDismissed", route.measurements.prologueDismissed],
  ["journalOpenedWithTab", route.measurements.journalOpened >= 1],
  ["allPlayableStoryBeatsDiscovered", route.measurements.storyBeatsDiscovered === PASS08_PLAYABLE_BEATS.length],
  ["storyBeatsDiscoveredInOrder", actualOrder.join(",") === expectedOrder.join(",")],
  ["storyBeginsWithCorelessGoal", PASS08_PLAYABLE_BEATS[0].text.includes("코어리스") && PASS08_PLAYABLE_BEATS[0].text.includes("원점 코어")],
  ["abilityExplainedAsRecoveredMemory", PASS08_PLAYABLE_BEATS.find(item => item.id === "resonanceWing")?.text.includes("잊고 있던 움직임")],
  ["firstMonsterClearlyForeshadowed", PASS08_PLAYABLE_BEATS.at(-1).text.includes("무언가 깨어 있다")],
  ["objectiveAdvancesAfterWarning", route.measurements.storyObjective === "서쪽의 깨어난 파수기 신호를 확인하라"],
  ["endingStillTargetsOriginCore", STORY_CORE.endingGoal.includes("원점 코어")],
  ["routeStillHasNoReset", route.measurements.resets === 0],
  ["routeStillVisitsFourRooms", route.measurements.roomTransitions === 3],
  ["liftStillConnectsTiers", route.measurements.liftTravel === 770 && route.measurements.tierTransitions === 1],
  ["noConsoleErrors", route.consoleErrors.length === 0],
  ["noPageErrors", route.pageErrors.length === 0],
].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

const result = {
  pass: 8,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    storyBeatsDiscovered: route.measurements.storyBeatsDiscovered,
    storyOrder: actualOrder,
    journalOpened: route.measurements.journalOpened,
    storyObjective: route.measurements.storyObjective,
    roomTransitions: route.measurements.roomTransitions,
    tierTransitions: route.measurements.tierTransitions,
    liftTravel: route.measurements.liftTravel,
    westwardRoomFourDistance: route.measurements.westwardRoomFourDistance,
    maximumGroundedPositionStep: route.measurements.maximumGroundedPositionStep,
    maximumCameraStep: route.measurements.maximumCameraStep,
    resets: route.measurements.resets,
    finalX: route.measurements.finalX,
    finalY: route.measurements.finalY,
  },
  consoleErrors: route.consoleErrors,
  pageErrors: route.pageErrors,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  passed: result.passed,
  passedCount: result.passedCount,
  totalCount: result.totalCount,
  failed: checks.filter(check => !check.passed).map(check => check.name),
  measurements: result.measurements,
}, null, 2));
if (!result.passed) process.exitCode = 1;
