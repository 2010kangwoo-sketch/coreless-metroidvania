import fs from "node:fs";
import path from "node:path";
import {
  PASS05_BUILD,
  PASS05_GUIDANCE_UI,
  PASS05_OBJECTIVES,
  PASS05_PROLOGUE,
  PASS05_TIER_ARCS,
  PASS05_TUTORIAL_SEQUENCE,
  PASS05_ZONE_GUIDANCE,
  validatePass05StoryGuidance,
} from "../src/v4/pass05-story-guidance.js";

const outputPath = process.env.CORELESS_V4_PASS05_RESULT ??
  "docs/rebuild-v4/pass-05-results.json";
const audit = validatePass05StoryGuidance();
const result = {
  pass: PASS05_BUILD.pass,
  generatedAt: new Date().toISOString(),
  passed: audit.passed,
  passedCount: audit.passedCount,
  totalCount: audit.totalCount,
  checks: audit.checks,
  measurements: audit.measurements,
  prologue: PASS05_PROLOGUE,
  ui: PASS05_GUIDANCE_UI,
  objectives: PASS05_OBJECTIVES,
  tutorial: PASS05_TUTORIAL_SEQUENCE,
  tierArcs: PASS05_TIER_ARCS,
  zoneGuidance: PASS05_ZONE_GUIDANCE,
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
