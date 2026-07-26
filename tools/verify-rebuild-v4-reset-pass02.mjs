import fs from "node:fs";
import path from "node:path";
import {
  RESET_GROUND_MOVEMENT,
  RESET_PASS02_BUILD,
  RESET_PASS02_LAB,
  validateResetPass02GroundMovement,
} from "../src/v4/reset-pass02-ground-movement.js";

const outputPath = process.env.CORELESS_V4_RESET_PASS02_RESULT ??
  "docs/rebuild-v4/reset-pass-02-results.json";
const requiredFiles = [
  "v4-reset-pass02.html",
  "v4-reset-pass02.css",
  "docs/rebuild-v4/reset-pass-02.md",
  "docs/rebuild-v4/reset-pass-02-browser-results.json",
  "docs/rebuild-v4/assets/reset-pass02-ground-lab.png",
];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
const audit = validateResetPass02GroundMovement();
const checks = [
  ...audit.checks,
  {
    name: "passTwoRuntimeAndEvidenceExist",
    passed: missingFiles.length === 0,
  },
];
const result = {
  build: RESET_PASS02_BUILD,
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
  measurements: audit.measurements,
  movement: RESET_GROUND_MOVEMENT,
  lab: RESET_PASS02_LAB,
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
