import fs from "node:fs";
import path from "node:path";
import {
  RESET_AIR_MOVEMENT,
  RESET_PASS03_BUILD,
  RESET_PASS03_LAB,
  validateResetPass03AirMovement,
} from "../src/v4/reset-pass03-air-movement.js";

const outputPath = process.env.CORELESS_V4_RESET_PASS03_RESULT ??
  "docs/rebuild-v4/reset-pass-03-results.json";
const requiredFiles = [
  "v4-reset-pass03.html",
  "v4-reset-pass03.css",
  "docs/rebuild-v4/reset-pass-03.md",
  "docs/rebuild-v4/reset-pass-03-browser-results.json",
  "docs/rebuild-v4/assets/reset-pass03-air-lab.png",
];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
const audit = validateResetPass03AirMovement();
const checks = [
  ...audit.checks,
  {
    name: "passThreeRuntimeAndEvidenceExist",
    passed: missingFiles.length === 0,
  },
];
const result = {
  build: RESET_PASS03_BUILD,
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
  measurements: audit.measurements,
  movement: RESET_AIR_MOVEMENT,
  lab: RESET_PASS03_LAB,
  missingFiles,
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
