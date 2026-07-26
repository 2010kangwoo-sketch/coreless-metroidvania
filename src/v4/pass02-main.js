import {
  FIRST_MEGA_ROOM_PLACEMENT,
  FIRST_MEGA_ROOM_ZONES,
  MEGA_ROOM_CAMPAIGN,
  SCALE_CONTRACT,
  validatePass01ScaleLayout,
} from "./pass01-scale-layout.js";
import {
  drawCampaignBlueprint,
  drawMegaRoomBlueprint,
} from "./pass01-blueprint.js";
import {
  BASIC_ATTACK,
  MOVEMENT_LAB,
  PASS02_BUILD,
  TWENTY_SECOND_BUDGET,
  measurePass02Movement,
  validatePass02Movement,
} from "./pass02-movement-benchmark.js";
import { Pass02MovementLabRuntime } from "./pass02-movement-lab-runtime.js";

const pass01Audit = validatePass01ScaleLayout();
const audit = validatePass02Movement();
const measurements = measurePass02Movement();
const movementCanvas = document.querySelector("#v4MovementLab");
const megaRoomCanvas = document.querySelector("#v4MegaRoomBlueprint");
const campaignCanvas = document.querySelector("#v4CampaignBlueprint");
const status = document.querySelector("#v4AuditStatus");

drawMegaRoomBlueprint(megaRoomCanvas);
drawCampaignBlueprint(campaignCanvas);

const runtime = new Pass02MovementLabRuntime(movementCanvas);
runtime.start();

status.textContent = audit.passed
  ? `MOVEMENT ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4 = Object.freeze({
  build: PASS02_BUILD,
  contract: SCALE_CONTRACT,
  zones: FIRST_MEGA_ROOM_ZONES,
  placement: FIRST_MEGA_ROOM_PLACEMENT,
  campaign: MEGA_ROOM_CAMPAIGN,
  pass01Audit,
  audit,
  movement: Object.freeze({
    lab: MOVEMENT_LAB,
    attack: BASIC_ATTACK,
    budget: TWENTY_SECOND_BUDGET,
    measurements,
  }),
  runtime,
});
document.documentElement.dataset.corelessV4Ready = "true";
