import fs from "node:fs";
import path from "node:path";
import {
  RESET_COLLISION_CONTRACT,
  RESET_PASS04_BUILD,
  RESET_PASS04_LAB,
  validateResetPass04Collision,
} from "../src/v4/reset-pass04-collision.js";

const outputPath = process.env.CORELESS_V4_RESET_PASS04_RESULT ??
  "docs/rebuild-v4/reset-pass-04-results.json";
const requiredFiles = [
  "v4-reset-pass04.html",
  "v4-reset-pass04.css",
  "docs/rebuild-v4/reset-pass-04.md",
  "docs/rebuild-v4/reset-pass-04-browser-results.json",
  "docs/rebuild-v4/assets/reset-pass04-collision-lab.png",
  "docs/rebuild-v4/assets/reset-pass04-wall-contact.png",
];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
const audit = validateResetPass04Collision();
const checks = [
  ...audit.checks,
  {
    name: "passFourRuntimeAndEvidenceExist",
    passed: missingFiles.length === 0,
  },
];
const result = {
  build: RESET_PASS04_BUILD,
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
  measurements: audit.measurements,
  contract: RESET_COLLISION_CONTRACT,
  lab: RESET_PASS04_LAB,
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
