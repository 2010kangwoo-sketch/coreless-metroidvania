import {
  PASS05_BUILD,
  PASS05_SOLIDS,
  PASS05_TARGETS,
  PASS05_TRIGGERS,
  PASS05_WORLD,
  validatePass05SlopeLevel,
} from "./pass05-slope-level.js";
import { PLAYER_PHYSICS } from "./player-physics.js";
import { Pass05SlopeRuntime } from "./pass05-slope-runtime.js";

const canvas = document.getElementById("slopeCanvas");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("V3 Pass 05 could not find #slopeCanvas.");

const structuralAudit = validatePass05SlopeLevel();
if (!structuralAudit.passed) throw new Error("V3 Pass 05 slope level audit failed.");

const runtime = new Pass05SlopeRuntime(canvas, {
  build: document.getElementById("slopeBuildStatus"),
  audit: document.getElementById("slopeAuditStatus"),
});
runtime.start();
runtime.draw();

document.documentElement.dataset.corelessV3SlopeReady = "true";
canvas.setAttribute("aria-busy", "false");

window.__corelessV3Slope = Object.freeze({
  build: PASS05_BUILD,
  world: PASS05_WORLD,
  solids: PASS05_SOLIDS,
  triggers: PASS05_TRIGGERS,
  targets: PASS05_TARGETS,
  playerPhysics: PLAYER_PHYSICS,
  structuralAudit,
  runtime,
});
