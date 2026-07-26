import fs from "node:fs";
import path from "node:path";
import {
  CHASE_CONTRACT,
  ENEMY_MOTION_REQUIREMENTS,
  MANDATORY_ROOM_TASKS,
  MOTION_AND_EFFECT_CONTRACT,
  OBJECT_FAMILIES,
  OBJECT_PURPOSE_RULE,
  PLAYER_MOTION_STATES,
  QUALITY_APPROVAL_GATES,
  QUALITY_FOUNDATION_BUILD,
  ROOM_FRAMING_CONTRACT,
  TERRAIN_QUALITY_CONTRACT,
  validateQualityFoundation,
} from "../src/v4/quality-foundation.js";

const outputPath = process.env.CORELESS_V4_QUALITY_RESULT ??
  "docs/rebuild-v4/quality-foundation-results.json";
const audit = validateQualityFoundation();
const result = {
  build: QUALITY_FOUNDATION_BUILD,
  generatedAt: new Date().toISOString(),
  passed: audit.passed,
  passedCount: audit.passedCount,
  totalCount: audit.totalCount,
  checks: audit.checks,
  measurements: audit.measurements,
  roomTasks: MANDATORY_ROOM_TASKS,
  roomFraming: ROOM_FRAMING_CONTRACT,
  terrain: TERRAIN_QUALITY_CONTRACT,
  motionAndEffects: MOTION_AND_EFFECT_CONTRACT,
  playerMotionStates: PLAYER_MOTION_STATES,
  enemyMotionRequirements: ENEMY_MOTION_REQUIREMENTS,
  objectFamilies: OBJECT_FAMILIES,
  objectPurpose: OBJECT_PURPOSE_RULE,
  chase: CHASE_CONTRACT,
  approval: QUALITY_APPROVAL_GATES,
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
