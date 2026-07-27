import {
  RELEASE_PASS02_ACCEPTANCE,
  RELEASE_PASS02_BUILD,
  RELEASE_PASS02_MOVEMENT,
  measureReleasePass02Movement,
  validateReleasePass02Movement,
} from "./release-pass02-movement.js";
import { RESET_PASS02_LAB } from "./reset-pass02-ground-movement.js";
import { ReleasePass02GroundRuntime } from "./release-pass02-runtime.js";

const canvas = document.querySelector("#releasePass02GroundLab");
const status = document.querySelector("#releasePass02AuditStatus");
const audit = validateReleasePass02Movement();
const measurements = measureReleasePass02Movement();

await document.fonts.load('700 16px "Coreless Noto Sans KR"');
const runtime = new ReleasePass02GroundRuntime(canvas);
runtime.start();

status.textContent = audit.passed
  ? `GROUND ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4ReleasePass02 = Object.freeze({
  build: RELEASE_PASS02_BUILD,
  movement: RELEASE_PASS02_MOVEMENT,
  acceptance: RELEASE_PASS02_ACCEPTANCE,
  lab: RESET_PASS02_LAB,
  audit,
  measurements,
  runtime,
});
document.documentElement.dataset.corelessV4ReleasePass02Ready = "true";
