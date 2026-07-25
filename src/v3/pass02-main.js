import { PASS02_SOLIDS, PASS02_TRIGGERS, PASS02_WORLD, validatePass02Graybox } from "./pass02-graybox.js";
import { CAMERA_PHYSICS, PLAYER_PHYSICS } from "./player-physics.js";
import { Pass02Runtime } from "./pass02-runtime.js";
import { PASS03_FEEL_TARGETS, PASS03_MOTION_VISUAL, validatePass03Feel } from "./pass03-feel.js";
import {
  PASS06_BUILD,
  PASS06_CHECKPOINTS,
  PASS06_GATE,
  PASS06_JUMP_TARGETS,
  PASS06_LESSONS,
  PASS06_OPTIONAL_REWARD,
  validatePass06Tutorial,
} from "./pass06-tutorial.js";

const canvas = document.getElementById("v3Canvas");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("V3 Pass 02 could not find #v3Canvas.");

const structuralAudit = validatePass02Graybox();
if (!structuralAudit.passed) throw new Error("V3 Pass 02 structural audit failed.");
const feelAudit = validatePass03Feel();
if (!feelAudit.passed) throw new Error("V3 Pass 03 feel audit failed.");
const tutorialAudit = validatePass06Tutorial();
if (!tutorialAudit.passed) throw new Error("V3 Pass 06 tutorial audit failed.");

const runtime = new Pass02Runtime(canvas, {
  build: document.getElementById("v3BuildStatus"),
  audit: document.getElementById("v3AuditStatus"),
});
runtime.start();
runtime.draw();

document.documentElement.dataset.corelessV3Ready = "true";
canvas.setAttribute("aria-busy", "false");

window.__corelessV3 = Object.freeze({
  build: PASS06_BUILD,
  world: PASS02_WORLD,
  solids: PASS02_SOLIDS,
  triggers: PASS02_TRIGGERS,
  playerPhysics: PLAYER_PHYSICS,
  cameraPhysics: CAMERA_PHYSICS,
  structuralAudit,
  feel: Object.freeze({
    targets: PASS03_FEEL_TARGETS,
    motionVisual: PASS03_MOTION_VISUAL,
    audit: feelAudit,
  }),
  tutorial: Object.freeze({
    lessons: PASS06_LESSONS,
    checkpoints: PASS06_CHECKPOINTS,
    gate: PASS06_GATE,
    optionalReward: PASS06_OPTIONAL_REWARD,
    jumpTargets: PASS06_JUMP_TARGETS,
    audit: tutorialAudit,
  }),
  runtime,
});
