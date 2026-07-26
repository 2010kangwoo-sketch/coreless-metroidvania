import { FIRST_MEGA_ROOM_ZONES } from "./pass01-scale-layout.js";
import { PASS03_ZONES } from "./pass03-world-streaming.js";
import {
  PASS04_CHECKPOINTS,
  checkpointById,
  validatePass04Checkpoints,
} from "./pass04-checkpoints.js";

export const PASS05_BUILD = Object.freeze({
  id: "rebuild-v4-pass05",
  pass: 5,
  branch: "rebuild/mega-room-v4-40pass",
  scope: "prologue, persistent objectives, tutorial order, and non-blocking story guidance",
  finalArtIncluded: false,
});

export const PASS05_GUIDANCE_UI = Object.freeze({
  bannerSeconds: 5.25,
  fadeSeconds: 0.45,
  maximumQueueDepth: 3,
  maximumLogEntries: 6,
  objectiveAlwaysVisible: true,
  pausesGameplay: false,
  usesModalDialog: false,
  logKey: "Tab",
});

export const PASS05_PROLOGUE = Object.freeze({
  title: "중심 없이 깨어난 자",
  speaker: "시설 잔향",
  text: "기억도 코어도 없다. 그러나 멈춘 원점 코어가 당신에게만 맥동한다.",
  immediateGoal: "동쪽의 원점 신호를 따라 첫 승강축에 도달하라.",
  campaignPromise:
    "잃어버린 기능을 되찾고 강해지는 수호자들을 넘어, 검은 공명의 근원에 도달한다.",
});

const objective = (id, startSequence, title, detail) => Object.freeze({
  id,
  startSequence,
  title,
  detail,
});

export const PASS05_OBJECTIVES = Object.freeze([
  objective("wake", 1, "원점의 맥동을 따라가라", "동쪽 관측창과 첫 승강축을 찾는다."),
  objective("ascend-east", 6, "동부 승강축을 가동하라", "E로 승강기를 작동해 2층으로 오른다."),
  objective("recover-cut", 7, "절단 권한의 봉인을 찾아라", "서쪽으로 진행해 S08 권한실에 도달한다."),
  objective("test-cut", 8, "되찾은 절단 권한을 시험하라", "안전 표적 뒤 깨어난 관리체를 상대한다."),
  objective("trace-workers", 13, "철수 기록의 흔적을 추적하라", "주조장과 설비를 지나 기억 승강고로 향한다."),
  objective("recover-wings", 19, "공명 날개 기능을 복원하라", "이중 도약 기억을 회수하고 안전 우물에서 시험한다."),
  objective("find-last-memory", 25, "마지막 작업자 기억을 복원하라", "원점 봉인의 진실과 자신의 역할을 확인한다."),
  objective("prepare-guardian", 31, "제련 수호자의 규칙을 읽어라", "전실과 외곽 고리에서 공격 예고를 학습한다."),
  objective("defeat-guardian", 33, "제련 수호자를 멈춰라", "두 단계 공격을 견디고 원점 신호를 되찾는다."),
  objective("claim-record", 35, "수호자 기록과 지름길을 회수하라", "다음 거대 구역의 위치를 확보한다."),
  objective("leave-for-waterway", 36, "냉각 수로로 향하라", "서부 출구에서 다음 원점 신호를 추적한다."),
]);

export const PASS05_TIER_ARCS = Object.freeze([
  Object.freeze({
    tier: 1,
    title: "각성",
    spaces: "S01–S06",
    question: "왜 원점 코어가 중심 없는 존재에게만 반응하는가?",
    answer: "몸의 비상 기동 회로와 원점 신호가 아직 서로를 기억한다.",
  }),
  Object.freeze({
    tier: 2,
    title: "첫 권한",
    spaces: "S07–S12",
    question: "시설은 왜 코어리스를 침입자로 판정하는가?",
    answer: "코어리스가 스스로 봉인했던 절단 권한을 되찾자 휴면 파수기가 깨어난다.",
  }),
  Object.freeze({
    tier: 3,
    title: "철수 흔적",
    spaces: "S13–S18",
    question: "작업자들은 무엇을 원점 쪽으로 운반했는가?",
    answer: "마지막 운반물은 원점 봉인 장치였고, 기능 기억 하나가 위층에 격리됐다.",
  }),
  Object.freeze({
    tier: 4,
    title: "잃어버린 움직임",
    spaces: "S19–S24",
    question: "공명 날개는 새 장비인가?",
    answer: "이중 도약은 코어리스가 잃어버린 자신의 움직임이며 검은 공명이 관리체를 잠식했다.",
  }),
  Object.freeze({
    tier: 5,
    title: "자발적 분리",
    spaces: "S25–S30",
    question: "누가 코어를 분리했는가?",
    answer: "폭주를 막기 위해 코어리스 자신이 작업자들과 함께 중심을 분리했다.",
  }),
  Object.freeze({
    tier: 6,
    title: "첫 수호자",
    spaces: "S31–S36",
    question: "수호자는 왜 길을 막는가?",
    answer: "손상된 수호자는 코어리스를 폭주의 원인으로 기억하며, 패배 뒤 냉각 수로를 가리킨다.",
  }),
]);

const lesson = (
  zoneId,
  id,
  action,
  prompt,
  success,
  mandatoryFrom,
) => Object.freeze({
  zoneId,
  id,
  action,
  prompt,
  success,
  mandatoryFrom,
});

export const PASS05_TUTORIAL_SEQUENCE = Object.freeze([
  lesson("S01", "move", "move", "A/D로 원점 맥동을 향해 이동", "좌우 이동 입력 감지", "S01"),
  lesson("S02", "variable-jump", "jump", "Space 길이로 낮은·높은 점프 비교", "두 점프 높이 구간 통과", "S02"),
  lesson("S03", "release-jump", "jump-release", "천장 아래에서는 Space를 일찍 놓기", "낮은 천장에 걸리지 않고 통과", "S03"),
  lesson("S04", "safe-fall", "air-control", "낙하 중 A/D로 안전 발판에 착지", "회수 바닥 또는 중간 발판 착지", "S04"),
  lesson("S05", "read-signal", "observe", "금빛 맥동이 가리키는 출구 확인", "동부 승강축 방향 확인", "S05"),
  lesson("S06", "use-lift", "interact", "승강축 앞에서 E로 상승", "2층 도착", "S07"),
]);

const SHORT_CUES = Object.freeze({
  S01: "기억도 중심도 없지만, 정지한 원점 코어가 당신에게만 반응한다.",
  S02: "몸의 비상 기동 회로는 기억보다 먼저 움직임을 되찾는다.",
  S03: "점프 출력 기록은 손상됐지만 높이는 여전히 조절할 수 있다.",
  S04: "낙하한 아래층에서도 원점의 맥동은 끊어지지 않는다.",
  S05: "관측창의 금빛 파형이 동쪽 승강축을 반복해서 가리킨다.",
  S06: "상층에서 코어리스가 직접 봉인한 절단 권한이 감지된다.",
  S07: "진행 방향이 뒤집히자 휴면 파수기가 처음으로 고개를 든다.",
  S08: "관리체를 해치지 않으려 스스로 잠근 절단 권한을 회수한다.",
  S09: "검은 공명이 휴면 관리체를 강제로 깨운다.",
  S10: "멈춘 제련소에서도 운반대는 원점 쪽으로 자재를 옮긴다.",
  S11: "방패 파수기는 코어리스를 시설 침입자로 분류한다.",
  S12: "첫 철수 기록은 파손 주조장과 위층 기억고를 가리킨다.",
  S13: "작업대마다 코어리스 자신의 오래된 정비 표식이 남아 있다.",
  S14: "오염된 크롤러는 시야가 아니라 소리와 열을 추적한다.",
  S15: "기중기의 마지막 화물은 원점 봉인용 부품이었다.",
  S16: "검은 공명이 안정적이던 증기 주기를 뒤틀고 있다.",
  S17: "서로 다른 파수기들이 하나의 공명 명령을 공유하기 시작한다.",
  S18: "격리된 기능 기억 하나가 바로 위 제단에서 응답한다.",
  S19: "공명 날개는 장비가 아니라 잃어버린 자신의 움직임이다.",
  S20: "복원된 기억이 공중 출력을 두 단계로 나눈다.",
  S21: "안전한 아래 길과 빠른 위 길이 서로 다른 기록을 품고 있다.",
  S22: "생체 온실의 관리 드론까지 검은 공명에 잠식됐다.",
  S23: "철수대는 원점 구역을 봉쇄하며 뒤쪽 교량을 끊었다.",
  S24: "마지막 철수자의 기억 신호가 다음 층에서 기다린다.",
  S25: "작업자들은 코어리스가 원점 코어를 분리하도록 도왔다.",
  S26: "시설 방어가 이제 코어리스를 알아보고 직접 길을 막는다.",
  S27: "용광로 골격은 원점 수호자의 구조와 닮아 있다.",
  S28: "봉인 부품이 원점이 아니라 바깥쪽으로 역행하고 있다.",
  S29: "검은 공명이 모든 관리체를 하나의 전투군으로 묶는다.",
  S30: "제련 수호자가 원점 신호를 가로막고 있음이 확인된다.",
  S31: "수호자는 코어리스를 기억하지만 여전히 침입자로 판정한다.",
  S32: "외곽 방어체가 수호자의 돌진과 내려찍기 리듬을 예고한다.",
  S33: "수호자는 코어리스를 원점 폭주의 원인으로 기억한다.",
  S34: "손상 기록은 코어 분리가 강제가 아니라 자발적 선택이었다고 말한다.",
  S35: "첫 수호자의 기록이 다음 거대 구역인 냉각 수로를 가리킨다.",
  S36: "근원까지 열아홉 구역. 첫 번째 원점 신호가 다시 이어진다.",
});

export function objectiveForSequence(sequence) {
  return PASS05_OBJECTIVES
    .filter(item => item.startSequence <= sequence)
    .at(-1) ?? PASS05_OBJECTIVES[0];
}

export function tutorialForZone(zoneId) {
  return PASS05_TUTORIAL_SEQUENCE.find(item => item.zoneId === zoneId) ?? null;
}

export const PASS05_ZONE_GUIDANCE = Object.freeze(
  PASS03_ZONES.map(zone => Object.freeze({
    zoneId: zone.id,
    sequence: zone.sequence,
    tier: zone.tier,
    zoneName: zone.name,
    objectiveId: objectiveForSequence(zone.sequence).id,
    cue: SHORT_CUES[zone.id],
    tutorialId: tutorialForZone(zone.id)?.id ?? null,
    durationSeconds: PASS05_GUIDANCE_UI.bannerSeconds,
    dismissRule: "time-or-next-higher-priority",
    blocksInput: false,
    pausesSimulation: false,
  })),
);

export function guidanceForZone(zoneId) {
  return PASS05_ZONE_GUIDANCE.find(item => item.zoneId === zoneId) ?? null;
}

export function restoredGuidanceState(checkpointId) {
  const checkpoint = checkpointById(checkpointId) ?? PASS04_CHECKPOINTS[0];
  const seenZoneIds = PASS05_ZONE_GUIDANCE
    .filter(item => item.sequence < checkpoint.sequence)
    .map(item => item.zoneId);
  const unlockedObjectives = PASS05_OBJECTIVES
    .filter(item => item.startSequence <= checkpoint.sequence);
  return Object.freeze({
    checkpointId: checkpoint.id,
    currentZoneId: checkpoint.id,
    seenZoneIds: Object.freeze(seenZoneIds),
    objective: objectiveForSequence(checkpoint.sequence),
    logEntries: Object.freeze(
      unlockedObjectives
        .slice(-PASS05_GUIDANCE_UI.maximumLogEntries)
        .map(item => Object.freeze({
          id: item.id,
          title: item.title,
          detail: item.detail,
        })),
    ),
  });
}

export function validatePass05StoryGuidance() {
  const pass04 = validatePass04Checkpoints();
  const tutorialZones = PASS05_TUTORIAL_SEQUENCE.map(item => item.zoneId);
  const objectiveSequences = PASS05_OBJECTIVES.map(item => item.startSequence);
  const restoreSamples = PASS04_CHECKPOINTS.map(item =>
    restoredGuidanceState(item.id));
  const checks = [
    ["pass04StillValid", pass04.passed],
    ["passSequence", PASS05_BUILD.pass === 5],
    ["explicitProtagonistState", PASS05_PROLOGUE.text.includes("기억도 코어도 없다")],
    ["originCoreIsImmediateMystery", PASS05_PROLOGUE.text.includes("원점 코어")],
    ["campaignGoalIsExplicit", PASS05_PROLOGUE.campaignPromise.includes("근원")],
    ["thirtySixZoneGuides", PASS05_ZONE_GUIDANCE.length === 36],
    ["allZoneIdsMatch", PASS05_ZONE_GUIDANCE.every((item, index) =>
      item.zoneId === `S${String(index + 1).padStart(2, "0")}`)],
    ["allSourceZonesCovered", FIRST_MEGA_ROOM_ZONES.every(zone =>
      PASS05_ZONE_GUIDANCE.some(item => item.zoneId === zone.id))],
    ["allGuidesHaveCue", PASS05_ZONE_GUIDANCE.every(item => item.cue.length >= 18)],
    ["allCuesRemainShort", PASS05_ZONE_GUIDANCE.every(item => item.cue.length <= 48)],
    ["allGuidesHaveObjective", PASS05_ZONE_GUIDANCE.every(item =>
      PASS05_OBJECTIVES.some(objectiveItem => objectiveItem.id === item.objectiveId))],
    ["allGuidesNonBlocking", PASS05_ZONE_GUIDANCE.every(item =>
      item.blocksInput === false && item.pausesSimulation === false)],
    ["noModalDialog", PASS05_GUIDANCE_UI.usesModalDialog === false],
    ["guidanceDoesNotPause", PASS05_GUIDANCE_UI.pausesGameplay === false],
    ["objectiveAlwaysVisible", PASS05_GUIDANCE_UI.objectiveAlwaysVisible],
    ["queueIsBounded", PASS05_GUIDANCE_UI.maximumQueueDepth === 3],
    ["bannerIsBrief", PASS05_GUIDANCE_UI.bannerSeconds >= 4 &&
      PASS05_GUIDANCE_UI.bannerSeconds <= 6],
    ["fadeFitsBanner", PASS05_GUIDANCE_UI.fadeSeconds <
      PASS05_GUIDANCE_UI.bannerSeconds / 2],
    ["sixTierArcs", PASS05_TIER_ARCS.length === 6],
    ["tierArcsOrdered", PASS05_TIER_ARCS.every((item, index) =>
      item.tier === index + 1)],
    ["tierArcsAskAndAnswer", PASS05_TIER_ARCS.every(item =>
      item.question.length >= 12 && item.answer.length >= 28)],
    ["sixTutorialLessons", PASS05_TUTORIAL_SEQUENCE.length === 6],
    ["tutorialCoversS01ToS06", tutorialZones.join(",") ===
      "S01,S02,S03,S04,S05,S06"],
    ["tutorialStartsWithMovement", PASS05_TUTORIAL_SEQUENCE[0].action === "move"],
    ["variableJumpBeforeLowCeiling", PASS05_TUTORIAL_SEQUENCE.findIndex(item =>
      item.id === "variable-jump") < PASS05_TUTORIAL_SEQUENCE.findIndex(item =>
      item.id === "release-jump")],
    ["safeFallBeforeLift", PASS05_TUTORIAL_SEQUENCE.findIndex(item =>
      item.id === "safe-fall") < PASS05_TUTORIAL_SEQUENCE.findIndex(item =>
      item.id === "use-lift")],
    ["signalReadBeforeLift", PASS05_TUTORIAL_SEQUENCE.findIndex(item =>
      item.id === "read-signal") < PASS05_TUTORIAL_SEQUENCE.findIndex(item =>
      item.id === "use-lift")],
    ["tutorialHasSuccessRules", PASS05_TUTORIAL_SEQUENCE.every(item =>
      item.success.length >= 5)],
    ["objectivesOrdered", objectiveSequences.every((sequence, index) =>
      index === 0 || sequence > objectiveSequences[index - 1])],
    ["objectiveBeginsAtS01", PASS05_OBJECTIVES[0].startSequence === 1],
    ["attackObjectiveBeforeCombat", objectiveForSequence(8).id === "test-cut" &&
      objectiveForSequence(9).id === "test-cut"],
    ["doubleJumpObjectiveBeforeTest", objectiveForSequence(19).id ===
      "recover-wings" && objectiveForSequence(20).id === "recover-wings"],
    ["guardianObjectiveBeforeBoss", objectiveForSequence(31).id ===
      "prepare-guardian" && objectiveForSequence(33).id === "defeat-guardian"],
    ["exitObjectiveAtS36", objectiveForSequence(36).id ===
      "leave-for-waterway"],
    ["allCheckpointsRestoreGuidance", restoreSamples.every(sample =>
      sample.currentZoneId === sample.checkpointId && sample.objective)],
    ["restoreDoesNotReplayPastZones", restoreSamples.every((sample, index) =>
      sample.seenZoneIds.length === PASS04_CHECKPOINTS[index].sequence - 1)],
    ["restoredLogIsBounded", restoreSamples.every(sample =>
      sample.logEntries.length <= PASS05_GUIDANCE_UI.maximumLogEntries)],
    ["finalCheckpointRestoresRewardObjective",
      restoredGuidanceState("S35").objective.id === "claim-record"],
    ["storyRevealsVoluntarySeparation", guidanceForZone("S34").cue.includes("자발적")],
    ["nextMegaRoomIsNamed", guidanceForZone("S35").cue.includes("냉각 수로")],
    ["noFinalArt", PASS05_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements: Object.freeze({
      zoneGuides: PASS05_ZONE_GUIDANCE.length,
      objectiveStages: PASS05_OBJECTIVES.length,
      tutorialLessons: PASS05_TUTORIAL_SEQUENCE.length,
      tierArcs: PASS05_TIER_ARCS.length,
      bannerSeconds: PASS05_GUIDANCE_UI.bannerSeconds,
      maximumQueueDepth: PASS05_GUIDANCE_UI.maximumQueueDepth,
      maximumLogEntries: PASS05_GUIDANCE_UI.maximumLogEntries,
    }),
  });
}
