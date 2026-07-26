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
  measurePass02Movement,
  validatePass02Movement,
} from "./pass02-movement-benchmark.js";
import {
  PASS03_BUILD,
  PASS03_STREAMING,
  PASS03_TIERS,
  PASS03_ZONES,
  validatePass03WorldStreaming,
} from "./pass03-world-streaming.js";
import { Pass03WorldRuntime } from "./pass03-world-runtime.js";

const pass01Audit = validatePass01ScaleLayout();
const pass02Audit = validatePass02Movement();
const audit = validatePass03WorldStreaming();
const streamingCanvas = document.querySelector("#v4StreamingLab");
const megaRoomCanvas = document.querySelector("#v4MegaRoomBlueprint");
const campaignCanvas = document.querySelector("#v4CampaignBlueprint");
const status = document.querySelector("#v4AuditStatus");

drawMegaRoomBlueprint(megaRoomCanvas);
drawCampaignBlueprint(campaignCanvas);

const runtime = new Pass03WorldRuntime(streamingCanvas);
runtime.start();

status.textContent = audit.passed
  ? `STREAMING ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4 = Object.freeze({
  build: PASS03_BUILD,
  contract: SCALE_CONTRACT,
  zones: FIRST_MEGA_ROOM_ZONES,
  placement: FIRST_MEGA_ROOM_PLACEMENT,
  campaign: MEGA_ROOM_CAMPAIGN,
  pass01Audit,
  pass02Audit,
  pass02Measurements: measurePass02Movement(),
  audit,
  streaming: Object.freeze({
    config: PASS03_STREAMING,
    tiers: PASS03_TIERS,
    zones: PASS03_ZONES,
  }),
  runtime,
});
document.documentElement.dataset.corelessV4Ready = "true";
