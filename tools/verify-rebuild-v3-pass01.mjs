import fs from "node:fs";
import path from "node:path";
import {
  ROOM_WIDTH,
  ROOM_HEIGHT,
  ROOMS,
  MAIN_ROUTE,
  ROUTE_LINKS,
  OPTIONAL_ALCOVES,
  UNLOCKABLE_SHORTCUTS,
  PASS01_TARGETS,
} from "../src/v3/mega-room-layout.js";
import {
  PACING_CHAPTERS,
  ROOM_GAMEPLAY_DETAIL,
  ABILITY_PROGRESSION,
  ENCOUNTER_RULES,
  ANTI_REPETITION_RULES,
  PRIMARY_STRUCTURE_FUNCTIONS,
  EXPECTED_PLAYTIME_SECONDS,
} from "../src/v3/mega-room-gameplay.js";

const roomById = new Map(ROOMS.map(room => [room.id, room]));
const detail = id => ROOM_GAMEPLAY_DETAIL[id];
const unique = values => new Set(values).size;
const ascentLinks = ROUTE_LINKS.filter(link => link.type === "ascent");
const enemies = [...new Set(ROOMS.flatMap(room => room.enemies))];
const structures = [...new Set(ROOMS.flatMap(room => room.structures))];

const longestHighTensionRun = (() => {
  let longest = 0;
  let current = 0;
  for (const room of ROOMS) {
    current = detail(room.id).tension >= ANTI_REPETITION_RULES.highTensionThreshold ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
})();

const checks = [
  ["fifteenMainRooms", ROOMS.length === 15],
  ["uniqueRoomIds", unique(ROOMS.map(room => room.id)) === ROOMS.length],
  ["uniqueRoomOrders", unique(ROOMS.map(room => room.order)) === ROOMS.length],
  ["contiguousOrders", ROOMS.every((room, index) => room.order === index + 1)],
  ["fiveTiers", unique(ROOMS.map(room => room.tier)) === 5],
  ["threeRoomsPerTier", [0, 1, 2, 3, 4].every(tier => ROOMS.filter(room => room.tier === tier).length === 3)],
  ["fixedRoomDimensions", ROOMS.every(room => room.bounds.width === ROOM_WIDTH && room.bounds.height === ROOM_HEIGHT)],
  ["threeColumnsPerTier", ROOMS.every(room => room.column >= 0 && room.column <= 2)],
  ["alternatingTierDirections", [0, 1, 2, 3, 4].every((tier, index) =>
    [...new Set(ROOMS.filter(room => room.tier === tier).map(room => room.direction))][0] === ["east", "west", "east", "west", "east"][index])],
  ["mainRouteCoversEveryRoom", MAIN_ROUTE.join(",") === ROOMS.map(room => room.id).join(",")],
  ["routeLinksContiguous", ROUTE_LINKS.length === 14 && ROUTE_LINKS.every((link, index) => link.from === MAIN_ROUTE[index] && link.to === MAIN_ROUTE[index + 1])],
  ["fourAlternatingAscents", ascentLinks.length === 4 && ascentLinks.map(link => link.side).join(",") === "east,west,east,west"],
  ["roomRolesVaried", unique(ROOMS.map(room => room.role)) >= 10],
  ["mechanicsUnique", unique(ROOMS.map(room => room.mechanic)) === ROOMS.length],
  ["everyRoomHasStructures", ROOMS.every(room => room.structures.length >= 4)],
  ["structureVariety", structures.length >= PASS01_TARGETS.minimumStructureFamilies],
  ["enemyVariety", enemies.length >= 6],
  ["checkpointCount", ROOMS.filter(room => room.checkpoint).length === PASS01_TARGETS.checkpoints],
  ["threeOptionalAlcoves", OPTIONAL_ALCOVES.length === PASS01_TARGETS.optionalAlcoves],
  ["threeUnlockableShortcuts", UNLOCKABLE_SHORTCUTS.length === PASS01_TARGETS.shortcuts],
  ["startsSafe", ROOMS[0].role === "safe_tutorial" && ROOMS[0].enemies.length === 0],
  ["endsAtExit", ROOMS.at(-1).role === "exit"],
  ["boulderGroundedByDesign", roomById.get("r14").structures.includes("연속 접지 경사")],
  ["bridgeSupportsSpecified", roomById.get("r09").structures.includes("화면 아래로 이어지는 교각")],
  ["noFinalArtInPass01", PASS01_TARGETS.finalArtIncluded === false],
  ["gameplayDetailForEveryRoom", ROOMS.every(room => Boolean(detail(room.id)))],
  ["threeBeatsPerRoom", ROOMS.every(room => detail(room.id).beats.length === 3)],
  ["noAdjacentRhythmRepeat", ROOMS.slice(1).every((room, index) => detail(room.id).rhythm !== detail(ROOMS[index].id).rhythm)],
  ["roomDurationsReasonable", ROOMS.every(room => detail(room.id).expectedSeconds >= 45 && detail(room.id).expectedSeconds <= 125)],
  ["targetPlaytimeFifteenToTwentyMinutes", EXPECTED_PLAYTIME_SECONDS >= 900 && EXPECTED_PLAYTIME_SECONDS <= 1200],
  ["tensionValuesValid", ROOMS.every(room => detail(room.id).tension >= 1 && detail(room.id).tension <= 5)],
  ["limitedHighTensionRun", longestHighTensionRun <= ANTI_REPETITION_RULES.maxConsecutiveHighTensionRooms],
  ["recoveryAfterEarlyPeaks", detail("r07").tension < detail("r06").tension && detail("r09").tension < detail("r08").tension && detail("r13").tension < detail("r12").tension],
  ["calmBeforeChase", detail("r13").rhythm === "calm_preparation" && detail("r13").tension <= 2],
  ["chaseIsTensionPeak", detail("r14").tension === Math.max(...ROOMS.map(room => detail(room.id).tension))],
  ["finaleChangesRhythm", detail("r15").rhythm !== detail("r14").rhythm && detail("r15").tension < detail("r14").tension],
  ["fivePacingChapters", PACING_CHAPTERS.length === 5],
  ["chaptersCoverRouteOnce", PACING_CHAPTERS.flatMap(chapter => chapter.rooms).join(",") === MAIN_ROUTE.join(",")],
  ["chapterShapesUnique", unique(PACING_CHAPTERS.map(chapter => chapter.shape)) === PACING_CHAPTERS.length],
  ["everyRoomHasChoice", ROOMS.every(room => detail(room.id).playerChoice.length >= 20)],
  ["everyRoomHasRecovery", ROOMS.every(room => detail(room.id).failureRecovery.length >= 20)],
  ["everyRoomForeshadows", ROOMS.every(room => detail(room.id).foreshadow.length >= 20)],
  ["abilityProgressionValid", ABILITY_PROGRESSION.every(item => {
    const introducedOrder = roomById.get(item.introduced)?.order ?? Infinity;
    return item.callbacks.length >= 2 && item.callbacks.every(id => (roomById.get(id)?.order ?? 0) > introducedOrder);
  })],
  ["sevenAbilityProgressions", ABILITY_PROGRESSION.length === 7],
  ["structureFunctionsCoverEveryStructure", structures.every(name => PRIMARY_STRUCTURE_FUNCTIONS[name])],
  ["structurePurposesAreMeaningful", Object.entries(PRIMARY_STRUCTURE_FUNCTIONS).every(([name, value]) => name.length >= 3 && value.purpose.length >= 18)],
  ["encounterCapIsReadable", ENCOUNTER_RULES.maxActiveEnemies <= 3],
  ["attackTelegraphIsReadable", ENCOUNTER_RULES.minimumAttackTelegraphMs >= 450],
  ["newMechanicStartsSafe", ENCOUNTER_RULES.firstMechanicAttemptIsSafe],
  ["noUnfairEnemyRules", ENCOUNTER_RULES.noOffscreenAttacks && ENCOUNTER_RULES.noEnemyOnBlindLanding && ENCOUNTER_RULES.retreatSpaceRequired && !ENCOUNTER_RULES.enemyHealthScalingOnly],
  ["antiRepetitionRulesActive", Object.values(ANTI_REPETITION_RULES).every(Boolean)],
].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

const result = {
  pass: 1,
  branch: "rebuild/mega-room-v3-40pass",
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    rooms: ROOMS.length,
    tiers: unique(ROOMS.map(room => room.tier)),
    requiredLinks: ROUTE_LINKS.length,
    ascents: ascentLinks.length,
    optionalAlcoves: OPTIONAL_ALCOVES.length,
    shortcuts: UNLOCKABLE_SHORTCUTS.length,
    checkpoints: ROOMS.filter(room => room.checkpoint).length,
    roomRoles: unique(ROOMS.map(room => room.role)),
    uniqueMechanics: unique(ROOMS.map(room => room.mechanic)),
    structureFamilies: structures.length,
    enemyRoles: enemies,
    meaningfulStructureFunctions: Object.keys(PRIMARY_STRUCTURE_FUNCTIONS).length,
    abilityProgressions: ABILITY_PROGRESSION.length,
    expectedPlaytimeSeconds: EXPECTED_PLAYTIME_SECONDS,
    expectedPlaytimeMinutes: Number((EXPECTED_PLAYTIME_SECONDS / 60).toFixed(2)),
    tensionCurve: ROOMS.map(room => detail(room.id).tension),
    rhythms: ROOMS.map(room => detail(room.id).rhythm),
    longestHighTensionRun,
  },
};

if (process.env.CORELESS_V3_PASS01_RESULT) {
  const output = path.resolve(process.env.CORELESS_V3_PASS01_RESULT);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;

