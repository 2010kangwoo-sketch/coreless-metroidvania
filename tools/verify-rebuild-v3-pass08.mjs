import fs from "node:fs";
import path from "node:path";
import { ABILITY_PROGRESSION } from "../src/v3/mega-room-gameplay.js";
import { ROOMS } from "../src/v3/mega-room-layout.js";
import {
  ABILITY_MEMORY_RELICS,
  ENEMY_ESCALATION,
  PASS08_PLAYABLE_BEATS,
  ROOM_STORY_BEATS,
  STORY_CHAPTERS,
  STORY_CORE,
  createPass08StoryProgress,
  validatePass08Story,
} from "../src/v3/pass08-story.js";

const structuralAudit = validatePass08Story();
const initialProgress = createPass08StoryProgress();
const roomOrder = ROOMS.map(room => room.id);
const chapterOrder = STORY_CHAPTERS.flatMap(chapter => chapter.rooms);
const storyOrder = ROOM_STORY_BEATS.map(item => item.room);
const memoryAbilities = ABILITY_MEMORY_RELICS.map(item => item.ability);
const gameplayAbilities = ABILITY_PROGRESSION
  .filter(item => !["move", "jump"].includes(item.ability))
  .map(item => item.ability);
const normalizedMemoryAbilities = memoryAbilities.flatMap(ability =>
  ability === "move_jump" ? ["move", "jump"] : [ability]);

const checks = [
  ...structuralAudit.checks,
  ["storyProgressStartsEmpty", Object.values(initialProgress).every(value => !value)],
  ["sixPlayableBeatsHaveUniqueIds", PASS08_PLAYABLE_BEATS.length === 6 && new Set(PASS08_PLAYABLE_BEATS.map(item => item.id)).size === 6],
  ["playableBeatOrderMatchesRoute", PASS08_PLAYABLE_BEATS.map(item => item.room).join(",") === "r01,r01,r02,r03,r04,r04"],
  ["chapterOrderMatchesRoomOrder", chapterOrder.join(",") === roomOrder.join(",")],
  ["roomStoryOrderMatchesRoomOrder", storyOrder.join(",") === roomOrder.join(",")],
  ["allGameplayAbilitiesHaveMemoryCause", gameplayAbilities.every(ability => normalizedMemoryAbilities.includes(ability))],
  ["memoryRelicsHaveUniqueRoomsExceptInnate", new Set(ABILITY_MEMORY_RELICS.slice(1).map(item => item.room)).size === ABILITY_MEMORY_RELICS.length - 1],
  ["enemyDifficultyNeverDecreases", ENEMY_ESCALATION.every((item, index) => index === 0 || item.tier > ENEMY_ESCALATION[index - 1].tier)],
  ["preCombatTierUsesAvoidance", ENEMY_ESCALATION[0].rooms.at(-1) === "r07" && ENEMY_ESCALATION[0].combatRule.includes("회피")],
  ["firstCombatRoomMatchesAttackMemory", ABILITY_MEMORY_RELICS.find(item => item.ability === "attack")?.room === ENEMY_ESCALATION[1].rooms[0]],
  ["finalStoryAndEnemyMeetAtRoom15", ROOM_STORY_BEATS.at(-1).room === "r15" && ENEMY_ESCALATION.at(-1).rooms[0] === "r15"],
  ["endingResolvesVisibleGoal", STORY_CORE.endingGoal.includes("원점 코어") && STORY_CORE.endingGoal.includes("안정화")],
].map(check => Array.isArray(check)
  ? { name: check[0], passed: Boolean(check[1]) }
  : check);

const result = {
  pass: 8,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    storyChapters: STORY_CHAPTERS.length,
    roomStoryBeats: ROOM_STORY_BEATS.length,
    abilityMemoryRelics: ABILITY_MEMORY_RELICS.length,
    enemyEscalationTiers: ENEMY_ESCALATION.length,
    playableStoryBeats: PASS08_PLAYABLE_BEATS.length,
    finalRoom: ROOM_STORY_BEATS.at(-1).room,
    finalEnemy: ENEMY_ESCALATION.at(-1).enemies[0],
    visibleGoal: STORY_CORE.visibleGoal,
    endingGoal: STORY_CORE.endingGoal,
  },
};

if (process.env.CORELESS_V3_PASS08_RESULT) {
  const output = path.resolve(process.env.CORELESS_V3_PASS08_RESULT);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
