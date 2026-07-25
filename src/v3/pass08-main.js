import { PLAYER_PHYSICS } from "./player-physics.js";
import { validatePass02Graybox } from "./pass02-graybox.js";
import { validatePass03Feel } from "./pass03-feel.js";
import { validatePass06Tutorial } from "./pass06-tutorial.js";
import {
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
import {
  ABILITY_MEMORY_RELICS,
  ENEMY_ESCALATION,
  PASS08_BUILD,
  PASS08_PLAYABLE_BEATS,
  ROOM_STORY_BEATS,
  STORY_CHAPTERS,
  STORY_CORE,
  validatePass08Story,
} from "./pass08-story.js";
import { Pass08StoryRuntime } from "./pass08-story-runtime.js";

const canvas = document.getElementById("v3Canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("V3 Pass 08 could not find #v3Canvas.");
}

const audits = Object.freeze({
  pass02: validatePass02Graybox(),
  pass03: validatePass03Feel(),
  pass06: validatePass06Tutorial(),
  pass07: validatePass07LayeredLevel(),
  pass08: validatePass08Story(),
});
if (Object.values(audits).some(audit => !audit.passed)) {
  throw new Error("V3 Pass 08 startup audit failed.");
}

const runtime = new Pass08StoryRuntime(canvas, {
  build: document.getElementById("v3BuildStatus"),
  audit: document.getElementById("v3AuditStatus"),
});
runtime.start();

document.documentElement.dataset.corelessV3Ready = "true";
canvas.setAttribute("aria-busy", "false");

window.__corelessV3 = Object.freeze({
  build: PASS08_BUILD,
  world: PASS07_WORLD,
  layer: PASS07_LAYER,
  rooms: PASS07_ROOM_SUMMARIES,
  solids: PASS07_SOLIDS,
  triggers: PASS07_TRIGGERS,
  checkpoints: PASS07_CHECKPOINTS,
  gate: PASS07_GATE,
  optionalReward: PASS07_OPTIONAL_REWARD,
  lift: PASS07_LIFT,
  targets: PASS07_TARGETS,
  parallax: runtime.config.parallax,
  playerPhysics: PLAYER_PHYSICS,
  story: Object.freeze({
    core: STORY_CORE,
    chapters: STORY_CHAPTERS,
    roomBeats: ROOM_STORY_BEATS,
    abilityRelics: ABILITY_MEMORY_RELICS,
    enemyEscalation: ENEMY_ESCALATION,
    playableBeats: PASS08_PLAYABLE_BEATS,
  }),
  audits,
  runtime,
});
