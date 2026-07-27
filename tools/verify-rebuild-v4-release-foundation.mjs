import fs from "node:fs";
import path from "node:path";
import {
  RELEASE_FOUNDATION_BUILD,
  RELEASE_PASS_GATES,
  RELEASE_QUALITY_CONTRACT,
  RELEASE_SCOPE_CONTRACT,
  SPACE_SIGNATURE_AXES,
  SPATIAL_DIVERSITY_CONTRACT,
  TRAVERSAL_FORGIVENESS_CONTRACT,
  validateReleaseFoundation,
} from "../src/v4/release-foundation.js";

const outputPath = process.env.CORELESS_V4_RELEASE_FOUNDATION_RESULT ??
  "docs/rebuild-v4/release-cycle/foundation-results.json";
const audit = validateReleaseFoundation();
const result = {
  build: RELEASE_FOUNDATION_BUILD,
  generatedAt: new Date().toISOString(),
  passed: audit.passed,
  passedCount: audit.passedCount,
  totalCount: audit.totalCount,
  checks: audit.checks,
  measurements: audit.measurements,
  scope: RELEASE_SCOPE_CONTRACT,
  traversalForgiveness: TRAVERSAL_FORGIVENESS_CONTRACT,
  spaceSignatureAxes: SPACE_SIGNATURE_AXES,
  spatialDiversity: SPATIAL_DIVERSITY_CONTRACT,
  releaseQuality: RELEASE_QUALITY_CONTRACT,
  passGates: RELEASE_PASS_GATES,
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
