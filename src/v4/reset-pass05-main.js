import {
  RESET_COMBAT_CONTRACT,
  RESET_PASS05_BUILD,
  RESET_PASS05_HAZARDS,
  RESET_PASS05_LAB,
  RESET_PASS05_TARGETS,
  measureResetPass05Combat,
  validateResetPass05Combat,
} from "./reset-pass05-combat.js";
import {
  ResetPass05CombatRuntime,
} from "./reset-pass05-combat-runtime.js";

const canvas = document.querySelector("#resetPass05CombatLab");
const status = document.querySelector("#resetPass05AuditStatus");
const audit = validateResetPass05Combat();
const measurements = measureResetPass05Combat();

await document.fonts.load('700 16px "Coreless Noto Sans KR"');
const runtime = new ResetPass05CombatRuntime(canvas);
runtime.start();

status.textContent = audit.passed
  ? `COMBAT ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4ResetPass05 = Object.freeze({
  build: RESET_PASS05_BUILD,
  contract: RESET_COMBAT_CONTRACT,
  lab: RESET_PASS05_LAB,
  targets: RESET_PASS05_TARGETS,
  hazards: RESET_PASS05_HAZARDS,
  audit,
  measurements,
  runtime,
});
document.documentElement.dataset.corelessV4ResetPass05Ready = "true";
