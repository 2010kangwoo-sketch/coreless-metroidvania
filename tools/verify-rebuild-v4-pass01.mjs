import fs from "node:fs";
import path from "node:path";
import {
  FIRST_MEGA_ROOM_PLACEMENT,
  FIRST_MEGA_ROOM_ZONES,
  MEGA_ROOM_CAMPAIGN,
  PASS01_BUILD,
  SCALE_CONTRACT,
  SPACE_EXTENTS,
  validatePass01ScaleLayout,
} from "../src/v4/pass01-scale-layout.js";

const outputPath = process.env.CORELESS_V4_PASS01_RESULT ??
  "docs/rebuild-v4/pass-01-results.json";
const audit = validatePass01ScaleLayout();

const result = {
  pass: PASS01_BUILD.pass,
  generatedAt: new Date().toISOString(),
  passed: audit.passed,
  passedCount: audit.passedCount,
  totalCount: audit.totalCount,
  checks: audit.checks,
  measurements: audit.measurements,
  contract: SCALE_CONTRACT,
  extentTypes: SPACE_EXTENTS,
  firstMegaRoom: FIRST_MEGA_ROOM_ZONES,
  placement: FIRST_MEGA_ROOM_PLACEMENT,
  campaign: MEGA_ROOM_CAMPAIGN,
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
