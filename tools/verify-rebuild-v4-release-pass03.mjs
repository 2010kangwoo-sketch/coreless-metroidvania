import fs from "node:fs";
import path from "node:path";
import {
  RELEASE_PASS03_ACCEPTANCE,
  RELEASE_PASS03_BUILD,
  RELEASE_PASS03_MOVEMENT,
  validateReleasePass03AirMovement,
} from "../src/v4/release-pass03-air-movement.js";

const outputPath = process.env.CORELESS_V4_RELEASE_PASS03_RESULT ??
  "docs/rebuild-v4/release-cycle/pass-03-results.json";
const requiredFiles = [
  "v4-release-pass03.html",
  "v4-release-pass03.css",
  "src/v4/release-pass03-main.js",
  "src/v4/release-pass03-runtime.js",
  "docs/rebuild-v4/release-cycle/pass-03.md",
  "docs/rebuild-v4/release-cycle/pass-03-browser-results.json",
  "docs/rebuild-v4/assets/release-pass03-air-lab.png",
];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
const audit = validateReleasePass03AirMovement();
const checks = [
  ...audit.checks,
  {
    name: "releasePassThreeRuntimeAndEvidenceExist",
    passed: missingFiles.length === 0,
  },
];
const result = {
  build: RELEASE_PASS03_BUILD,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: audit.measurements,
  movement: RELEASE_PASS03_MOVEMENT,
  acceptance: RELEASE_PASS03_ACCEPTANCE,
  missingFiles,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  passed: result.passed,
  passedCount: result.passedCount,
  totalCount: result.totalCount,
  failed: checks.filter(check => !check.passed).map(check => check.name),
  missingFiles,
  measurements: result.measurements,
}, null, 2));

if (!result.passed) process.exitCode = 1;
