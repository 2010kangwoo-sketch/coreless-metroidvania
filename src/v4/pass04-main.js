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
import { validatePass02Movement } from "./pass02-movement-benchmark.js";
import {
  PASS03_STREAMING,
  PASS03_TIERS,
  PASS03_ZONES,
  validatePass03WorldStreaming,
} from "./pass03-world-streaming.js";
import {
  PASS04_BUILD,
  PASS04_CHECKPOINTS,
  PASS04_SAVE,
  validatePass04Checkpoints,
} from "./pass04-checkpoints.js";
import { Pass04WorldRuntime } from "./pass04-world-runtime.js";

const pass01Audit = validatePass01ScaleLayout();
const pass02Audit = validatePass02Movement();
const pass03Audit = validatePass03WorldStreaming();
const audit = validatePass04Checkpoints();
const runtimeCanvas = document.querySelector("#v4CheckpointLab");
const megaRoomCanvas = document.querySelector("#v4MegaRoomBlueprint");
const campaignCanvas = document.querySelector("#v4CampaignBlueprint");
const status = document.querySelector("#v4AuditStatus");

drawMegaRoomBlueprint(megaRoomCanvas);
drawCampaignBlueprint(campaignCanvas);

const runtime = new Pass04WorldRuntime(runtimeCanvas);
runtime.start();

status.textContent = audit.passed
  ? `SAVE ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4 = Object.freeze({
  build: PASS04_BUILD,
  contract: SCALE_CONTRACT,
  zones: FIRST_MEGA_ROOM_ZONES,
  placement: FIRST_MEGA_ROOM_PLACEMENT,
  campaign: MEGA_ROOM_CAMPAIGN,
  pass01Audit,
  pass02Audit,
  pass03Audit,
  audit,
  streaming: Object.freeze({
    config: PASS03_STREAMING,
    tiers: PASS03_TIERS,
    zones: PASS03_ZONES,
  }),
  persistence: Object.freeze({
    config: PASS04_SAVE,
    checkpoints: PASS04_CHECKPOINTS,
  }),
  runtime,
});
document.documentElement.dataset.corelessV4Ready = "true";
