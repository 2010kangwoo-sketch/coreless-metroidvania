import fs from "node:fs";
import path from "node:path";
import {
  BASIC_ATTACK,
  MOVEMENT_LAB,
  PASS02_BUILD,
  TWENTY_SECOND_BUDGET,
  validatePass02Movement,
} from "../src/v4/pass02-movement-benchmark.js";

const outputPath = process.env.CORELESS_V4_PASS02_RESULT ??
  "docs/rebuild-v4/pass-02-results.json";
const audit = validatePass02Movement();
const result = {
  pass: PASS02_BUILD.pass,
  generatedAt: new Date().toISOString(),
  passed: audit.passed,
  passedCount: audit.passedCount,
  totalCount: audit.totalCount,
  checks: audit.checks,
  measurements: audit.measurements,
  movementLab: MOVEMENT_LAB,
  basicAttack: BASIC_ATTACK,
  twentySecondBudget: TWENTY_SECOND_BUDGET,
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
