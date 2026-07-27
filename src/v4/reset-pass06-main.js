import {
  RESET_CAMERA_CONTRACT,
  RESET_PASS06_BUILD,
  RESET_PASS06_WORLD,
  measureResetPass06Camera,
  validateResetPass06Camera,
} from "./reset-pass06-camera.js";
import {
  ResetPass06CameraRuntime,
} from "./reset-pass06-camera-runtime.js";

const canvas = document.querySelector("#resetPass06CameraLab");
const status = document.querySelector("#resetPass06AuditStatus");
const audit = validateResetPass06Camera();
const measurements = measureResetPass06Camera();

await document.fonts.load('700 16px "Coreless Noto Sans KR"');
const runtime = new ResetPass06CameraRuntime(canvas);
runtime.start();

status.textContent = audit.passed
  ? `CAMERA ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4ResetPass06 = Object.freeze({
  build: RESET_PASS06_BUILD,
  contract: RESET_CAMERA_CONTRACT,
  world: RESET_PASS06_WORLD,
  audit,
  measurements,
  runtime,
});
document.documentElement.dataset.corelessV4ResetPass06Ready = "true";
