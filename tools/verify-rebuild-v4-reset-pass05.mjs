import fs from "node:fs";
import path from "node:path";
import {
  RESET_COMBAT_CONTRACT,
  RESET_PASS05_BUILD,
  RESET_PASS05_HAZARDS,
  RESET_PASS05_LAB,
  RESET_PASS05_TARGETS,
  validateResetPass05Combat,
} from "../src/v4/reset-pass05-combat.js";

const outputPath = process.env.CORELESS_V4_RESET_PASS05_RESULT ??
  "docs/rebuild-v4/reset-pass-05-results.json";
const requiredFiles = [
  "v4-reset-pass05.html",
  "v4-reset-pass05.css",
  "docs/rebuild-v4/reset-pass-05.md",
  "docs/rebuild-v4/reset-pass-05-browser-results.json",
  "docs/rebuild-v4/assets/reset-pass05-combat-lab.png",
  "docs/rebuild-v4/assets/reset-pass05-attack-active.png",
  "docs/rebuild-v4/assets/reset-pass05-hit-recovery.png",
];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
const audit = validateResetPass05Combat();
const checks = [
  ...audit.checks,
  {
    name: "passFiveRuntimeAndEvidenceExist",
    passed: missingFiles.length === 0,
  },
];
const result = {
  build: RESET_PASS05_BUILD,
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
  measurements: audit.measurements,
  contract: RESET_COMBAT_CONTRACT,
  lab: RESET_PASS05_LAB,
  targets: RESET_PASS05_TARGETS,
  hazards: RESET_PASS05_HAZARDS,
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
