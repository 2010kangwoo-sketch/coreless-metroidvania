import {
  RESET_COLLISION_CONTRACT,
  RESET_PASS04_BUILD,
  RESET_PASS04_LAB,
  RESET_PASS04_SOLIDS,
  RESET_PASS04_TERRAIN,
  measureResetPass04Collision,
  validateResetPass04Collision,
} from "./reset-pass04-collision.js";
import {
  ResetPass04CollisionRuntime,
} from "./reset-pass04-collision-runtime.js";

const canvas = document.querySelector("#resetPass04CollisionLab");
const status = document.querySelector("#resetPass04AuditStatus");
const audit = validateResetPass04Collision();
const measurements = measureResetPass04Collision();

await document.fonts.load('700 16px "Coreless Noto Sans KR"');
const runtime = new ResetPass04CollisionRuntime(canvas);
runtime.start();

status.textContent = audit.passed
  ? `COLLISION ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4ResetPass04 = Object.freeze({
  build: RESET_PASS04_BUILD,
  contract: RESET_COLLISION_CONTRACT,
  lab: RESET_PASS04_LAB,
  terrain: RESET_PASS04_TERRAIN,
  solids: RESET_PASS04_SOLIDS,
  audit,
  measurements,
  runtime,
});
document.documentElement.dataset.corelessV4ResetPass04Ready = "true";
