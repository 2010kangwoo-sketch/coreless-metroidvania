import { PLAYER_PHYSICS } from "./player-physics.js";
import { validatePass02Graybox } from "./pass02-graybox.js";
import { validatePass03Feel } from "./pass03-feel.js";
import { validatePass06Tutorial } from "./pass06-tutorial.js";
import {
  PASS07_BUILD,
  PASS07_CHECKPOINTS,
  PASS07_GATE,
  PASS07_LAYER,
  PASS07_LIFT,
  PASS07_OPTIONAL_REWARD,
  PASS07_ROOM_SUMMARIES,
  PASS07_SOLIDS,
  PASS07_TARGETS,
  PASS07_TRIGGERS,
  PASS07_WORLD,
  validatePass07LayeredLevel,
} from "./pass07-layered-level.js";
import { Pass07LayeredRuntime } from "./pass07-layered-runtime.js";

const canvas = document.getElementById("v3Canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("V3 Pass 07 could not find #v3Canvas.");
}

const audits = Object.freeze({
  pass02: validatePass02Graybox(),
  pass03: validatePass03Feel(),
  pass06: validatePass06Tutorial(),
  pass07: validatePass07LayeredLevel(),
});
if (Object.values(audits).some(audit => !audit.passed)) {
  throw new Error("V3 Pass 07 startup audit failed.");
}

const runtime = new Pass07LayeredRuntime(canvas, {
  build: document.getElementById("v3BuildStatus"),
  audit: document.getElementById("v3AuditStatus"),
});
runtime.start();

document.documentElement.dataset.corelessV3Ready = "true";
canvas.setAttribute("aria-busy", "false");

window.__corelessV3 = Object.freeze({
  build: PASS07_BUILD,
  world: PASS07_WORLD,
  layer: PASS07_LAYER,
  rooms: PASS07_ROOM_SUMMARIES,
  solids: PASS07_SOLIDS,
  triggers: PASS07_TRIGGERS,
  checkpoints: PASS07_CHECKPOINTS,
  gate: PASS07_GATE,
  optionalReward: PASS07_OPTIONAL_REWARD,
  lift: PASS07_LIFT,
  parallax: runtime.config.parallax,
  targets: PASS07_TARGETS,
  playerPhysics: PLAYER_PHYSICS,
  audits,
  runtime,
});
