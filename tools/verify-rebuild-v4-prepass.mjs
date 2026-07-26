import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL_DOCUMENTS,
  FIRST_MEGA_ROOM_STORY_ARC,
  NARRATIVE_FOUNDATION,
  PREPASS_APPROVAL_GATES,
  PREPASS_BUILD,
  RADIO_CONTRACT,
  RELEASE_VERTICAL_SLICE,
  RESET_FORTY_PASS_ROADMAP,
  REUSE_LEDGER,
  STORY_DELIVERY_CONTRACT,
  validatePrepassProductionContract,
} from "../src/v4/prepass-production-contract.js";

const outputPath = process.env.CORELESS_V4_PREPASS_RESULT ??
  "docs/rebuild-v4/prepass-00-results.json";
const audit = validatePrepassProductionContract();
const missingDocuments = CANONICAL_DOCUMENTS.filter(file => !fs.existsSync(file));
const checks = [
  ...audit.checks,
  {
    name: "canonicalDocumentsExist",
    passed: missingDocuments.length === 0,
  },
];
const result = {
  build: PREPASS_BUILD,
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
  measurements: audit.measurements,
  missingDocuments,
  releaseVerticalSlice: RELEASE_VERTICAL_SLICE,
  narrative: NARRATIVE_FOUNDATION,
  radio: RADIO_CONTRACT,
  storyDelivery: STORY_DELIVERY_CONTRACT,
  firstMegaRoomStoryArc: FIRST_MEGA_ROOM_STORY_ARC,
  reuseLedger: REUSE_LEDGER,
  approvalGates: PREPASS_APPROVAL_GATES,
  roadmap: RESET_FORTY_PASS_ROADMAP,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  passed: result.passed,
  passedCount: result.passedCount,
  totalCount: result.totalCount,
  failed: checks.filter(item => !item.passed).map(item => item.name),
  missingDocuments,
  measurements: result.measurements,
}, null, 2));
if (!result.passed) process.exitCode = 1;
