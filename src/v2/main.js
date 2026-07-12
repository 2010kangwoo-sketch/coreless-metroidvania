import { BUILD } from "./config.js";
import { BOULDER_ROUTE, CHASE_FEATURES, PLAYER_ROUTE, WORLD, ZONES, validateBlueprint } from "./blueprint.js";
import { BlueprintRuntime } from "./runtime.js";

const canvas = document.getElementById("gameCanvas");
const buildStatus = document.getElementById("buildStatus");
const auditStatus = document.getElementById("auditStatus");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Coreless V2 could not find #gameCanvas.");
}

const runtime = new BlueprintRuntime(canvas, {
  build: buildStatus,
  audit: auditStatus,
});

runtime.start();

requestAnimationFrame(() => {
  runtime.updateStatus();
});

window.__corelessV2 = Object.freeze({
  build: BUILD,
  blueprint: Object.freeze({
    world: WORLD,
    zones: ZONES,
    playerRoute: PLAYER_ROUTE,
    boulderRoute: BOULDER_ROUTE,
    chaseFeatures: CHASE_FEATURES,
    validate: validateBlueprint,
  }),
  runtime,
  audit: () => runtime.audit(),
});
