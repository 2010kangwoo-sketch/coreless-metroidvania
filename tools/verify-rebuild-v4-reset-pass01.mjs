import fs from "node:fs";
import path from "node:path";
import {
  ENEMY_ROLES,
  RESET_PASS01_BUILD,
  RESET_PASS01_ROOMS,
  RESET_PASS01_TIER_BUDGETS,
  validateResetPass01RoomPlan,
} from "../src/v4/reset-pass01-room-plan.js";

const outputPath = process.env.CORELESS_V4_RESET_PASS01_RESULT ??
  "docs/rebuild-v4/reset-pass-01-results.json";
const audit = validateResetPass01RoomPlan();
const requiredFiles = [
  "docs/rebuild-v4/reset-pass-01.md",
  "docs/rebuild-v4/assets/reset-pass01-room-plan.svg",
  "docs/rebuild-v4/assets/reset-pass01-room-plan.png",
];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
const checks = [
  ...audit.checks,
  {
    name: "passOneDocumentsAndBlueprintExist",
    passed: missingFiles.length === 0,
  },
];
const result = {
  build: RESET_PASS01_BUILD,
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
  measurements: audit.measurements,
  missingFiles,
  tierBudgets: RESET_PASS01_TIER_BUDGETS,
  enemyRoles: ENEMY_ROLES,
  rooms: RESET_PASS01_ROOMS,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  passed: result.passed,
  passedCount: result.passedCount,
  totalCount: result.totalCount,
  failed: checks.filter(item => !item.passed).map(item => item.name),
  missingFiles,
  measurements: result.measurements,
}, null, 2));
if (!result.passed) process.exitCode = 1;
