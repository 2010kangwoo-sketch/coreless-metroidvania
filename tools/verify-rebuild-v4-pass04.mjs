import fs from "node:fs";
import path from "node:path";
import {
  PASS04_BUILD,
  PASS04_CHECKPOINTS,
  PASS04_SAVE,
  validatePass04Checkpoints,
} from "../src/v4/pass04-checkpoints.js";

const outputPath = process.env.CORELESS_V4_PASS04_RESULT ??
  "docs/rebuild-v4/pass-04-results.json";
const audit = validatePass04Checkpoints();
const result = {
  pass: PASS04_BUILD.pass,
  generatedAt: new Date().toISOString(),
  passed: audit.passed,
  passedCount: audit.passedCount,
  totalCount: audit.totalCount,
  checks: audit.checks,
  measurements: audit.measurements,
  save: PASS04_SAVE,
  checkpoints: PASS04_CHECKPOINTS,
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
