import { BUILD } from "./config.js";
import { BOULDER_ROUTE, CHASE_FEATURES, PLAYER_ROUTE, WORLD, ZONES, validateBlueprint } from "./blueprint.js";
import { PASS03_LEVEL, PLAYER_PHYSICS, validatePass03Level } from "./pass03-level.js";
import { PASS04_LEVEL, PASS04_ZONE, validatePass04Level } from "./pass04-level.js";
import { PASS05_LEVEL, PASS05_ZONE, validatePass05Level } from "./pass05-level.js";
import { PASS06_LEVEL, PASS06_ZONE, validatePass06Level } from "./pass06-level.js";
import { PASS07_LEVEL, PASS07_ZONE, validatePass07Level } from "./pass07-level.js";
import { PASS08_CHASE, PASS08_LEVEL, validatePass08Level } from "./pass08-level.js";
import { PASS09_CHASE, PASS09_LEVEL, PASS09_ZONE, validatePass09Level } from "./pass09-level.js";
import { PASS10_CHASE, PASS10_LEVEL, PASS10_ZONE, validatePass10Level } from "./pass10-level.js";
import { PASS11_CHASE, PASS11_LEVEL, PASS11_ZONE, validatePass11Level } from "./pass11-level.js";
import { PASS12_CHASE, PASS12_LEVEL, PASS12_ZONE, validatePass12Level } from "./pass12-level.js";
import { Pass12Runtime } from "./runtime.js";

const canvas = document.getElementById("gameCanvas");
const buildStatus = document.getElementById("buildStatus");
const auditStatus = document.getElementById("auditStatus");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Coreless V2 could not find #gameCanvas.");
}

const runtime = new Pass12Runtime(canvas, {
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
  pass05: Object.freeze({
    level: PASS05_LEVEL,
    zone: PASS05_ZONE,
    validate: validatePass05Level,
  }),
  pass06: Object.freeze({
    level: PASS06_LEVEL,
    zone: PASS06_ZONE,
    validate: validatePass06Level,
  }),
  pass07: Object.freeze({
    level: PASS07_LEVEL,
    zone: PASS07_ZONE,
    validate: validatePass07Level,
  }),
  pass08: Object.freeze({
    level: PASS08_LEVEL,
    chase: PASS08_CHASE,
    validate: validatePass08Level,
  }),
  pass09: Object.freeze({
    level: PASS09_LEVEL,
    zone: PASS09_ZONE,
    chase: PASS09_CHASE,
    validate: validatePass09Level,
  }),
  pass10: Object.freeze({
    level: PASS10_LEVEL,
    zone: PASS10_ZONE,
    chase: PASS10_CHASE,
    validate: validatePass10Level,
  }),
  pass11: Object.freeze({
    level: PASS11_LEVEL,
    zone: PASS11_ZONE,
    chase: PASS11_CHASE,
    validate: validatePass11Level,
  }),
  pass12: Object.freeze({
    level: PASS12_LEVEL,
    zone: PASS12_ZONE,
    chase: PASS12_CHASE,
    validate: validatePass12Level,
  }),
  runtime,
  audit: () => runtime.audit(),
  debug: () => runtime.getDebugState(),
});
