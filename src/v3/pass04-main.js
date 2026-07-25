import { PASS04_BUILD, PASS04_SOLIDS, PASS04_TARGETS, PASS04_TRIGGERS, PASS04_WORLD, validatePass04WallLevel } from "./pass04-wall-level.js";
import { PLAYER_PHYSICS } from "./player-physics.js";
import { Pass04WallRuntime } from "./pass04-wall-runtime.js";

const canvas = document.getElementById("wallCanvas");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("V3 Pass 04 could not find #wallCanvas.");

const structuralAudit = validatePass04WallLevel();
if (!structuralAudit.passed) throw new Error("V3 Pass 04 wall level audit failed.");

const runtime = new Pass04WallRuntime(canvas, {
  build: document.getElementById("wallBuildStatus"),
  audit: document.getElementById("wallAuditStatus"),
});
runtime.start();
runtime.draw();

document.documentElement.dataset.corelessV3WallReady = "true";
canvas.setAttribute("aria-busy", "false");

window.__corelessV3Wall = Object.freeze({
  build: PASS04_BUILD,
  world: PASS04_WORLD,
  solids: PASS04_SOLIDS,
  triggers: PASS04_TRIGGERS,
  targets: PASS04_TARGETS,
  playerPhysics: PLAYER_PHYSICS,
  structuralAudit,
  runtime,
});
