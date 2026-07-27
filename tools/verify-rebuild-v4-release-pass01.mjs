import fs from "node:fs";
import path from "node:path";
import {
  CAMPAIGN_RELEASE_PLAN,
  M01_RELEASE_SPACE_DESIGNS,
  RELEASE_PASS01_BUILD,
  validateReleasePass01Design,
} from "../src/v4/release-pass01-design.js";

const outputPath = process.env.CORELESS_V4_RELEASE_PASS01_RESULT ??
  "docs/rebuild-v4/release-cycle/pass-01-results.json";
const audit = validateReleasePass01Design();
const result = {
  build: RELEASE_PASS01_BUILD,
  generatedAt: new Date().toISOString(),
  passed: audit.passed,
  passedCount: audit.passedCount,
  totalCount: audit.totalCount,
  checks: audit.checks,
  measurements: audit.measurements,
  campaign: CAMPAIGN_RELEASE_PLAN,
  firstMegaRoomSpaces: M01_RELEASE_SPACE_DESIGNS,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

console.log(JSON.stringify({
  passed: result.passed,
  passedCount: result.passedCount,
  totalCount: result.totalCount,
  failed: result.checks.filter(check => !check.passed).map(check => check.name),
  measurements: result.measurements,
}, null, 2));

if (!result.passed) process.exitCode = 1;
