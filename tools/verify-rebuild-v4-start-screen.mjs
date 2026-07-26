import fs from "node:fs";
import path from "node:path";
import {
  V4_START_SCREEN,
  inspectStartScreenSave,
  validateV4StartScreen,
} from "../src/v4/start-screen.js";
import {
  PASS04_SAVE,
  createMemoryStorage,
  createSaveRecord,
} from "../src/v4/pass04-checkpoints.js";

const outputPath = process.env.CORELESS_V4_START_SCREEN_RESULT ??
  "docs/rebuild-v4/start-screen-results.json";
const emptyStorage = createMemoryStorage();
const validStorage = createMemoryStorage({
  [PASS04_SAVE.key]: JSON.stringify(createSaveRecord("S24")),
});
const invalidStorage = createMemoryStorage({
  [PASS04_SAVE.key]: "{broken",
});
const baseAudit = validateV4StartScreen();
const empty = inspectStartScreenSave(emptyStorage);
const valid = inspectStartScreenSave(validStorage);
const invalid = inspectStartScreenSave(invalidStorage);
const extraChecks = [
  ["emptySaveDisablesContinue", !empty.hasSave &&
    empty.label === "저장 기록 없음"],
  ["validSaveShowsCheckpoint", valid.hasSave &&
    valid.checkpointId === "S24" &&
    valid.checkpointTier === 4 &&
    valid.label.includes("S24")],
  ["invalidSaveDisablesContinue", !invalid.hasSave &&
    invalid.status === "invalid"],
].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
const checks = [...baseAudit.checks, ...extraChecks];
const result = {
  build: V4_START_SCREEN,
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    ...baseAudit.measurements,
    emptySave: empty,
    validSave: valid,
    invalidSave: invalid,
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  passed: result.passed,
  passedCount: result.passedCount,
  totalCount: result.totalCount,
  failed: result.checks.filter(item => !item.passed).map(item => item.name),
  measurements: result.measurements,
}, null, 2));

if (!result.passed) process.exitCode = 1;
