import {
  RESET_AIR_MOVEMENT,
  RESET_PASS03_BUILD,
  RESET_PASS03_LAB,
  measureResetPass03AirMovement,
  validateResetPass03AirMovement,
} from "./reset-pass03-air-movement.js";
import { ResetPass03AirRuntime } from "./reset-pass03-air-runtime.js";

const canvas = document.querySelector("#resetPass03AirLab");
const status = document.querySelector("#resetPass03AuditStatus");
const audit = validateResetPass03AirMovement();
const measurements = measureResetPass03AirMovement();

await document.fonts.load('700 16px "Coreless Noto Sans KR"');
const runtime = new ResetPass03AirRuntime(canvas);
runtime.start();

status.textContent = audit.passed
  ? `AIR ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4ResetPass03 = Object.freeze({
  build: RESET_PASS03_BUILD,
  movement: RESET_AIR_MOVEMENT,
  lab: RESET_PASS03_LAB,
  audit,
  measurements,
  runtime,
});
document.documentElement.dataset.corelessV4ResetPass03Ready = "true";
