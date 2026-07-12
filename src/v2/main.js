import { BUILD } from "./config.js";
import { BOULDER_ROUTE, CHASE_FEATURES, PLAYER_ROUTE, WORLD, ZONES, validateBlueprint } from "./blueprint.js";
import { PASS03_LEVEL, PLAYER_PHYSICS, validatePass03Level } from "./pass03-level.js";
import { PASS04_LEVEL, PASS04_ZONE, validatePass04Level } from "./pass04-level.js";
import { Pass04Runtime } from "./runtime.js";

const canvas = document.getElementById("gameCanvas");
const buildStatus = document.getElementById("buildStatus");
const auditStatus = document.getElementById("auditStatus");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Coreless V2 could not find #gameCanvas.");
}

const runtime = new Pass04Runtime(canvas, {
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
  pass03: Object.freeze({
    level: PASS03_LEVEL,
    physics: PLAYER_PHYSICS,
    validate: validatePass03Level,
  }),
  pass04: Object.freeze({
    level: PASS04_LEVEL,
    zone: PASS04_ZONE,
    validate: validatePass04Level,
  }),
  runtime,
  audit: () => runtime.audit(),
  debug: () => runtime.getDebugState(),
});
