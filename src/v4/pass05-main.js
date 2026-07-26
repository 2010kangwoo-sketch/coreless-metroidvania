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
  PASS04_CHECKPOINTS,
  PASS04_SAVE,
  validatePass04Checkpoints,
} from "./pass04-checkpoints.js";
import {
  PASS05_BUILD,
  PASS05_GUIDANCE_UI,
  PASS05_OBJECTIVES,
  PASS05_PROLOGUE,
  PASS05_TIER_ARCS,
  PASS05_TUTORIAL_SEQUENCE,
  PASS05_ZONE_GUIDANCE,
  validatePass05StoryGuidance,
} from "./pass05-story-guidance.js";
import { Pass05StoryRuntime } from "./pass05-story-runtime.js";

const pass01Audit = validatePass01ScaleLayout();
const pass02Audit = validatePass02Movement();
const pass03Audit = validatePass03WorldStreaming();
const pass04Audit = validatePass04Checkpoints();
const audit = validatePass05StoryGuidance();
const runtimeCanvas = document.querySelector("#v4StoryLab");
const megaRoomCanvas = document.querySelector("#v4MegaRoomBlueprint");
const campaignCanvas = document.querySelector("#v4CampaignBlueprint");
const status = document.querySelector("#v4AuditStatus");

drawMegaRoomBlueprint(megaRoomCanvas);
drawCampaignBlueprint(campaignCanvas);

const runtime = new Pass05StoryRuntime(runtimeCanvas);
runtime.start();

status.textContent = audit.passed
  ? `STORY ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4 = Object.freeze({
  build: PASS05_BUILD,
  contract: SCALE_CONTRACT,
  zones: FIRST_MEGA_ROOM_ZONES,
  placement: FIRST_MEGA_ROOM_PLACEMENT,
  campaign: MEGA_ROOM_CAMPAIGN,
  pass01Audit,
  pass02Audit,
  pass03Audit,
  pass04Audit,
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
  story: Object.freeze({
    prologue: PASS05_PROLOGUE,
    objectives: PASS05_OBJECTIVES,
    tierArcs: PASS05_TIER_ARCS,
    tutorial: PASS05_TUTORIAL_SEQUENCE,
    zones: PASS05_ZONE_GUIDANCE,
    ui: PASS05_GUIDANCE_UI,
  }),
  runtime,
});
document.documentElement.dataset.corelessV4Ready = "true";
