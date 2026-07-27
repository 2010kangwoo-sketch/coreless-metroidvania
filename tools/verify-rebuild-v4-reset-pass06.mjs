import fs from "node:fs";
import path from "node:path";
import {
  RESET_CAMERA_CONTRACT,
  RESET_PASS06_BUILD,
  RESET_PASS06_HAZARD,
  RESET_PASS06_LIFT,
  RESET_PASS06_WORLD,
  validateResetPass06Camera,
} from "../src/v4/reset-pass06-camera.js";

const outputPath = process.env.CORELESS_V4_RESET_PASS06_RESULT ??
  "docs/rebuild-v4/reset-pass-06-results.json";
const requiredFiles = [
  "v4-reset-pass06.html",
  "v4-reset-pass06.css",
  "src/v4/reset-pass06-camera-runtime.js",
  "docs/rebuild-v4/reset-pass-06.md",
  "docs/rebuild-v4/reset-pass-06-browser-results.json",
  "docs/rebuild-v4/assets/reset-pass06-camera-lab.png",
  "docs/rebuild-v4/assets/reset-pass06-lift-transition.png",
  "docs/rebuild-v4/assets/reset-pass06-hit-damping.png",
];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
const audit = validateResetPass06Camera();
const checks = [
  ...audit.checks,
  {
    name: "passSixRuntimeAndEvidenceExist",
    passed: missingFiles.length === 0,
  },
];
const result = {
  build: RESET_PASS06_BUILD,
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
  measurements: audit.measurements,
  contract: RESET_CAMERA_CONTRACT,
  world: RESET_PASS06_WORLD,
  lift: RESET_PASS06_LIFT,
  hazard: RESET_PASS06_HAZARD,
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
