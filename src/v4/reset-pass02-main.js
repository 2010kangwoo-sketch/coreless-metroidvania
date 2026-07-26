import {
  RESET_GROUND_MOVEMENT,
  RESET_PASS02_BUILD,
  RESET_PASS02_LAB,
  measureResetPass02GroundMovement,
  validateResetPass02GroundMovement,
} from "./reset-pass02-ground-movement.js";
import { ResetPass02GroundRuntime } from "./reset-pass02-ground-runtime.js";

const canvas = document.querySelector("#resetPass02GroundLab");
const status = document.querySelector("#resetPass02AuditStatus");
const audit = validateResetPass02GroundMovement();
const measurements = measureResetPass02GroundMovement();
await document.fonts.load('700 16px "Coreless Noto Sans KR"');
const runtime = new ResetPass02GroundRuntime(canvas);

runtime.start();
status.textContent = audit.passed
  ? `GROUND ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4ResetPass02 = Object.freeze({
  build: RESET_PASS02_BUILD,
  movement: RESET_GROUND_MOVEMENT,
  lab: RESET_PASS02_LAB,
  audit,
  measurements,
  runtime,
});
document.documentElement.dataset.corelessV4ResetPass02Ready = "true";
