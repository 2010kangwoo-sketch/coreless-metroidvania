import fs from "node:fs";
import path from "node:path";
import {
  PASS03_BUILD,
  PASS03_STREAMING,
  PASS03_TIERS,
  PASS03_VIEWPORT,
  PASS03_ZONES,
  validatePass03WorldStreaming,
} from "../src/v4/pass03-world-streaming.js";

const outputPath = process.env.CORELESS_V4_PASS03_RESULT ??
  "docs/rebuild-v4/pass-03-results.json";
const audit = validatePass03WorldStreaming();
const result = {
  pass: PASS03_BUILD.pass,
  generatedAt: new Date().toISOString(),
  passed: audit.passed,
  passedCount: audit.passedCount,
  totalCount: audit.totalCount,
  checks: audit.checks,
  measurements: audit.measurements,
  viewport: PASS03_VIEWPORT,
  streaming: PASS03_STREAMING,
  tiers: PASS03_TIERS,
  zones: PASS03_ZONES,
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
