import fs from "node:fs";
import path from "node:path";
import {
  RELEASE_PASS02_ACCEPTANCE,
  RELEASE_PASS02_BUILD,
  RELEASE_PASS02_MOVEMENT,
  validateReleasePass02Movement,
} from "../src/v4/release-pass02-movement.js";

const outputPath = process.env.CORELESS_V4_RELEASE_PASS02_RESULT ??
  "docs/rebuild-v4/release-cycle/pass-02-results.json";
const requiredFiles = [
  "v4-release-pass02.html",
  "v4-release-pass02.css",
  "src/v4/release-pass02-main.js",
  "src/v4/release-pass02-runtime.js",
  "docs/rebuild-v4/release-cycle/pass-02.md",
  "docs/rebuild-v4/release-cycle/pass-02-browser-results.json",
  "docs/rebuild-v4/assets/release-pass02-ground-lab.png",
];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
const audit = validateReleasePass02Movement();
const checks = [
  ...audit.checks,
  {
    name: "releasePassTwoRuntimeAndEvidenceExist",
    passed: missingFiles.length === 0,
  },
];
const result = {
  build: RELEASE_PASS02_BUILD,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: audit.measurements,
  movement: RELEASE_PASS02_MOVEMENT,
  acceptance: RELEASE_PASS02_ACCEPTANCE,
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
