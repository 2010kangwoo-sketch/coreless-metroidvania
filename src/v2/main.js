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
import { PASS13_CHASE, PASS13_LEVEL, PASS13_ZONE, validatePass13Level } from "./pass13-level.js";
import { PASS14_CHASE, PASS14_LEVEL, PASS14_ZONE, validatePass14Level } from "./pass14-level.js";
import { PASS15_CHASE, PASS15_LEVEL, PASS15_ZONE, validatePass15Level } from "./pass15-level.js";
import { PASS16_LIGHTS, PASS16_THEMES, PASS16_VISUALS, validatePass16Visuals } from "./pass16-visuals.js";
import { PASS17_ART, PASS17_MATERIALS, PASS17_REINFORCEMENTS, PASS17_SUPPORTS, PASS17_VEGETATION, validatePass17Art } from "./pass17-art.js";
import { PASS18_LEVEL, PASS18_ZONE, validatePass18Level } from "./pass18-level.js";
import { PASS19_DESTRUCTION, PASS19_LEVEL, validatePass19Level } from "./pass19-level.js";
import { PASS20_LEVEL, PASS20_ZONE, validatePass20Level } from "./pass20-level.js";
import { PASS21_PACING, getPass21DestructionMultiplier, getPass21TargetSpeed, validatePass21Pacing } from "./pass21-pacing.js";
import { PASS22_LEVEL, PASS22_ZONE, validatePass22Level } from "./pass22-level.js";
import { PASS23_LEVEL, PASS23_ZONE, validatePass23Level } from "./pass23-level.js";
import { PASS24_INTEGRATION, getPass24IntegrationState, validatePass24Integration } from "./pass24-integration.js";
import { PASS25_VISUAL_SLICE, validatePass25Visuals } from "./pass25-visuals.js";
import { PASS26_TERRAIN, validatePass26Terrain } from "./pass26-terrain.js";
import { Pass26Runtime } from "./runtime.js";

const canvas = document.getElementById("gameCanvas");
const buildStatus = document.getElementById("buildStatus");
const auditStatus = document.getElementById("auditStatus");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Coreless V2 could not find #gameCanvas.");
}

const runtime = new Pass26Runtime(canvas, {
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
  pass13: Object.freeze({
    level: PASS13_LEVEL,
    zone: PASS13_ZONE,
    chase: PASS13_CHASE,
    validate: validatePass13Level,
  }),
  pass14: Object.freeze({
    level: PASS14_LEVEL,
    zone: PASS14_ZONE,
    chase: PASS14_CHASE,
    validate: validatePass14Level,
  }),
  pass15: Object.freeze({
    level: PASS15_LEVEL,
    zone: PASS15_ZONE,
    chase: PASS15_CHASE,
    validate: validatePass15Level,
  }),
  pass16: Object.freeze({
    visuals: PASS16_VISUALS,
    themes: PASS16_THEMES,
    lights: PASS16_LIGHTS,
    validate: validatePass16Visuals,
  }),
  pass17: Object.freeze({
    art: PASS17_ART,
    materials: PASS17_MATERIALS,
    reinforcements: PASS17_REINFORCEMENTS,
    vegetation: PASS17_VEGETATION,
    supports: PASS17_SUPPORTS,
    validate: validatePass17Art,
  }),
  pass18: Object.freeze({
    level: PASS18_LEVEL,
    zone: PASS18_ZONE,
    validate: validatePass18Level,
  }),
  pass19: Object.freeze({
    level: PASS19_LEVEL,
    destruction: PASS19_DESTRUCTION,
    validate: validatePass19Level,
  }),
  pass20: Object.freeze({
    level: PASS20_LEVEL,
    zone: PASS20_ZONE,
    validate: validatePass20Level,
  }),
  pass21: Object.freeze({
    pacing: PASS21_PACING,
    targetSpeed: getPass21TargetSpeed,
    destructionMultiplier: getPass21DestructionMultiplier,
    validate: validatePass21Pacing,
  }),
  pass22: Object.freeze({ level: PASS22_LEVEL, zone: PASS22_ZONE, validate: validatePass22Level }),
  pass23: Object.freeze({ level: PASS23_LEVEL, zone: PASS23_ZONE, validate: validatePass23Level }),
  pass24: Object.freeze({ integration: PASS24_INTEGRATION, state: getPass24IntegrationState, validate: validatePass24Integration }),
  pass25: Object.freeze({ visuals: PASS25_VISUAL_SLICE, validate: validatePass25Visuals }),
  pass26: Object.freeze({ terrain: PASS26_TERRAIN, validate: validatePass26Terrain }),
  runtime,
  audit: () => runtime.audit(),
  debug: () => runtime.getDebugState(),
});
