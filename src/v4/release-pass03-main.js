import {
  RELEASE_PASS03_ACCEPTANCE,
  RELEASE_PASS03_BUILD,
  RELEASE_PASS03_MOVEMENT,
  measureReleasePass03AirMovement,
  validateReleasePass03AirMovement,
} from "./release-pass03-air-movement.js";
import { RESET_PASS03_LAB } from "./reset-pass03-air-movement.js";
import { ReleasePass03AirRuntime } from "./release-pass03-runtime.js";

const canvas = document.querySelector("#releasePass03AirLab");
const status = document.querySelector("#releasePass03AuditStatus");
const audit = validateReleasePass03AirMovement();
const measurements = measureReleasePass03AirMovement();

await document.fonts.load('700 16px "Coreless Noto Sans KR"');
const runtime = new ReleasePass03AirRuntime(canvas);
runtime.start();

status.textContent = audit.passed
  ? `AIR ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4ReleasePass03 = Object.freeze({
  build: RELEASE_PASS03_BUILD,
  movement: RELEASE_PASS03_MOVEMENT,
  acceptance: RELEASE_PASS03_ACCEPTANCE,
  lab: RESET_PASS03_LAB,
  audit,
  measurements,
  runtime,
});
document.documentElement.dataset.corelessV4ReleasePass03Ready = "true";
