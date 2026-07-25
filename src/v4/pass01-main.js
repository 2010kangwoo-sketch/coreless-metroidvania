import {
  FIRST_MEGA_ROOM_PLACEMENT,
  FIRST_MEGA_ROOM_ZONES,
  MEGA_ROOM_CAMPAIGN,
  PASS01_BUILD,
  SCALE_CONTRACT,
  validatePass01ScaleLayout,
} from "./pass01-scale-layout.js";
import {
  drawCampaignBlueprint,
  drawMegaRoomBlueprint,
} from "./pass01-blueprint.js";

const audit = validatePass01ScaleLayout();
const megaRoomCanvas = document.querySelector("#v4MegaRoomBlueprint");
const campaignCanvas = document.querySelector("#v4CampaignBlueprint");
const status = document.querySelector("#v4AuditStatus");

drawMegaRoomBlueprint(megaRoomCanvas);
drawCampaignBlueprint(campaignCanvas);

status.textContent = audit.passed
  ? `STRUCTURE ${audit.passedCount}/${audit.totalCount}`
  : `FAILED ${audit.passedCount}/${audit.totalCount}`;
status.dataset.state = audit.passed ? "pass" : "fail";

window.__corelessV4 = Object.freeze({
  build: PASS01_BUILD,
  contract: SCALE_CONTRACT,
  zones: FIRST_MEGA_ROOM_ZONES,
  placement: FIRST_MEGA_ROOM_PLACEMENT,
  campaign: MEGA_ROOM_CAMPAIGN,
  audit,
});
document.documentElement.dataset.corelessV4Ready = "true";
