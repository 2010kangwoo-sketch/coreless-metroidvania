import {
  FIRST_MEGA_ROOM_ZONES,
  MEGA_ROOM_CAMPAIGN,
  SCALE_CONTRACT,
  STARTING_ABILITIES,
} from "./pass01-scale-layout.js";
import {
  QUALITY_APPROVAL_GATES,
  ROOM_FRAMING_CONTRACT,
  TERRAIN_QUALITY_CONTRACT,
} from "./quality-foundation.js";
import { V4_ACCOUNT } from "./account-save.js";

const frozen = value => Object.freeze(value);

export const PREPASS_BUILD = frozen({
  id: "rebuild-v4-prepass-production-contract",
  stage: 0,
  branch: "rebuild/mega-room-v4-40pass",
  resetsPassNumbering: true,
  firstImplementationPass: 1,
  purpose:
    "lock the vertical-slice scope, story, radio logic, quality gates, reuse ledger, and forty-pass order before implementation restarts",
});

export const CANONICAL_DOCUMENTS = frozen([
  "docs/rebuild-v4/prepass-00.md",
  "docs/rebuild-v4/story-bible.md",
  "docs/rebuild-v4/roadmap-40pass-reset.md",
  "docs/rebuild-v4/quality-foundation.md",
  "docs/rebuild-v4/account-save-foundation.md",
  "docs/rebuild-v4/release-cycle/foundation.md",
]);

export const RELEASE_VERTICAL_SLICE = frozen({
  name: "CORELESS opening vertical slice",
  campaignMegaRooms: 20,
  campaignTargetMinutes: 240,
  firstFortyPassScope: frozen({
    openingTitleScreen: true,
    accountAndGuestSaveFoundation: true,
    prologue: true,
    tutorial: true,
    firstMegaRoom: "M01 빈 제련소",
    firstMegaRoomSpaces: 36,
    firstMegaRoomTiers: 6,
    firstMegaRoomTargetMinutes: 12,
    firstBoss: "제련 수호자",
    radioAcquisition: true,
    secondMegaRoomImplementation: false,
    browserDirectLaunch: true,
  }),
  scopeRule:
    "the reset forty passes finish the prologue, tutorial, and first mega-room at release-candidate quality; M02-M20 remain campaign specifications, not hidden unfinished runtime",
});

export const NARRATIVE_FOUNDATION = frozen({
  theme: "잃어버린 중심을 되찾는 일은 잃기 전으로 돌아가는 일이 아니다.",
  protagonist: "중심과 기억을 잃고 깨어난 최후의 원점 연결사 코어리스",
  origin:
    "사람의 기술과 기억을 도시 설비에 분배하던 원점 코어이자 코어리스에게서 분리된 중심",
  blackResonance:
    "철수자들의 마지막 공포, 도시를 지키라는 명령, 버려졌다는 중심의 원망과 그리움이 증폭된 공명",
  pastChoice:
    "코어리스는 도시 전체의 기억 융합 폭주를 멈추기 위해 자신의 중심 분리를 직접 승인했다.",
  endingChoice:
    "원점을 파괴하거나 기억을 지우지 않고, 결과와 기억을 남긴 채 자신의 중심과 다시 연결한다.",
  tone: frozen({
    targetAudience: "15세가 보아도 유치하지 않은 절제된 진지함",
    comicReliefDominates: false,
    chosenOneProphecy: false,
    singlePureEvilVillain: false,
    expositionDumpDuringPlay: false,
  }),
  voices: frozen({
    coreless: "현재를 살아 움직이는 주인공; 짧고 필요한 말부터 시작해 마지막에는 자신의 선택을 분명히 말한다.",
    maren: "폐쇄 구역 밖 관측소에서 현재 시점에 실시간 교신하는 관측원",
    ein: "폭주 당시 기록관리자가 남긴 손상된 과거 기록; 살아 있는 안내자가 아니다.",
    origin: "코어리스의 분리된 중심이 시설 방어망과 결합한 현재의 의식",
  }),
});

export const RADIO_CONTRACT = frozen({
  deviceName: "외곽망 현장 송수신기",
  liveSpeaker: "마렌",
  acquisition: frozen({
    silentZones: frozen(["S01", "S02", "S03", "S04"]),
    cabinetZone: "S05",
    firstContactZone: "S06",
    cabinetTask:
      "보조 전원을 연결하고 고장 난 감시장치를 제거한 뒤 유지보수실 비상 보관함을 연다.",
    firstContactSafety:
      "첫 교신은 적, 낙사, 움직이는 장애물이 없는 승강축 안전 발판에서 시작한다.",
  }),
  logic: frozen({
    marenLocation: "폐쇄 구역 밖 외곽 관측소",
    knowledgeLimit:
      "오래된 설계도와 외부 감지 자료만 볼 수 있어 내부 정답이나 과거의 전모를 알지 못한다.",
    transmissionMethod:
      "외곽 철수망과 시설 중계기를 사용하는 실시간 음성 통신이며 기억 재생이나 초능력 대화가 아니다.",
    deeperSignalRule:
      "원점에 가까워질수록 차폐와 검은 공명 때문에 연결이 약해지고 M19-M20에서는 실시간 교신이 끊긴다.",
  }),
  runtime: frozen({
    playerControlContinues: true,
    averageConversationsPerMegaRoom: frozen({ minimum: 2, maximum: 3 }),
    maximumSubtitleLines: 2,
    longDialogueDuringPrecisionTraversal: false,
    longDialogueDuringCombat: false,
    longDialogueDuringChase: false,
    unsafeDialogueQueuedUntilSafe: true,
    missedDialogueStoredInLog: true,
    repeatedAfterDeath: false,
    givesPuzzleSolutions: false,
  }),
  relationshipArc: frozen([
    frozen({ rooms: "M01-M04", stage: "unknown-survivor", summary: "마렌은 코어리스를 정체불명의 생존자로 대한다." }),
    frozen({ rooms: "M05-M08", stage: "suspicion", summary: "연결사 신원이 드러나며 감시와 불신이 커진다." }),
    frozen({ rooms: "M09-M12", stage: "conflict", summary: "원점 파괴 명령과 과거 선택의 진실을 두고 충돌한다." }),
    frozen({ rooms: "M13-M16", stage: "joint-judgment", summary: "둘은 사실을 확인한 뒤 파괴가 아닌 해결 가능성을 함께 판단한다." }),
    frozen({ rooms: "M17-M18", stage: "signal-loss", summary: "통신이 약해지고 작별이 아닌 귀환 약속을 남긴다." }),
    frozen({ rooms: "M19-M20", stage: "silence", summary: "마렌은 최종 선택에 개입하지 않으며 엔딩 뒤 다시 연결된다." }),
  ]),
});

export const STORY_DELIVERY_CONTRACT = frozen({
  openingPanels: 7,
  interMegaRoomScenes: 19,
  endingSequence: true,
  activeGameplay: frozen({
    modalExpositionAllowed: false,
    inputBlockingRadioAllowed: false,
    currentObjectiveAlwaysReadable: true,
    majorScenesAtSafeTransitionsOnly: true,
    firstViewSkippable: true,
    replayableFromArchive: true,
  }),
  speakerPresentation: frozen({
    coreless: "warm-neutral",
    maren: "cool-cyan-radio",
    ein: "desaturated-archive",
    origin: "dark-resonance",
  }),
  roomRule:
    "each mega-room reveals one materially new fact and leaves one concrete question or objective for the next room",
});

export const FIRST_MEGA_ROOM_STORY_ARC = frozen([
  frozen({
    tier: 1,
    zones: "S01-S06",
    beat: "각성·기본 이동·송수신기 획득·마렌과 첫 교신",
    question: "왜 원점이 중심 없는 코어리스에게만 반응하는가?",
  }),
  frozen({
    tier: 2,
    zones: "S07-S12",
    beat: "기본 공격 교정·첫 관리체·시설이 코어리스를 침입자로 판정",
    question: "시설은 왜 자신의 관리자를 공격하는가?",
  }),
  frozen({
    tier: 3,
    zones: "S13-S18",
    beat: "제련소의 실제 기능·철수 흔적·서로 역할이 다른 관리체",
    question: "작업자들은 마지막으로 무엇을 원점에 운반했는가?",
  }),
  frozen({
    tier: 4,
    zones: "S19-S24",
    beat: "다음 방의 공명 날개 예고·상승 기류·붕괴 교량·생체 오염",
    question: "검은 공명은 왜 생명과 시설을 함께 변화시키는가?",
  }),
  frozen({
    tier: 5,
    zones: "S25-S30",
    beat: "중심 분리의 첫 기억·복합 전투·보스 전 휴식",
    question: "누가 코어리스의 중심을 분리했는가?",
  }),
  frozen({
    tier: 6,
    zones: "S31-S36",
    beat: "보스 패턴 사전 학습·제련 수호자·자발적 분리 단서·냉각 수로 출구",
    question: "코어리스는 왜 자신의 중심을 남겨 두었는가?",
  }),
]);

export const REUSE_LEDGER = frozen({
  keepAndRevalidate: frozen([
    "36-space and 6-tier scale data",
    "large-world streaming and damped camera experiments",
    "checkpoint schema and deterministic room restore",
    "guest identity and local save",
    "OAuth server foundation with providers disabled until deployment configuration exists",
    "manual-playtest and terrain quality constraints",
  ]),
  rewriteDuringResetPasses: frozen([
    "old pass numbering and completion claims",
    "prologue and all zone story cues",
    "S05-S06 radio acquisition and first contact",
    "tutorial geometry and final movement tuning",
    "all room geometry, encounters, enemy behavior, boss behavior, and final art",
  ]),
  archiveOnly: frozen([
    "V2 and V3 routes",
    "old 40-pass final-art corridor",
    "evidence that only proves obsolete layouts",
  ]),
  reuseRule:
    "no prototype is accepted because it already exists; every reused system must pass the reset contract and a current manual playtest",
});

const pass = (number, phase, title, acceptance) => frozen({
  number,
  phase,
  title,
  acceptance,
});

export const RESET_FORTY_PASS_ROADMAP = frozen([
  pass(1, "design", "전체 캠페인·M01 36공간 설계 확정", "M02-M20의 역할·능력·서사 의존성과 S01-S36 각각의 목적·시간·선택·회수·과제·적·서사·무전 표를 함께 승인한다."),
  pass(2, "movement", "기본 이동 기준선", "달리기·정지·방향 전환이 실제 키 입력에서 끊김 없이 작동한다."),
  pass(3, "movement", "가변 점프와 공중 제어", "짧은·긴 점프, 코요테 타임, 입력 버퍼가 안전 실험실에서 검증된다."),
  pass(4, "movement", "경사·벽·모서리 충돌", "자동 벽타기·수직 솟구침·급경사 순간 이동이 재현되지 않는다."),
  pass(5, "combat", "기본 공격·피격·회복", "공격 3단계, 넉백, 무적 시간, 취소 규칙이 읽기 쉽게 작동한다."),
  pass(6, "camera", "대형 월드 카메라", "수평·수직 전환과 선행 시야가 순간 이동 없이 이어진다."),
  pass(7, "camera", "공간 프레이밍·스트리밍", "천장 6-12%, 경계, 하부 지지대, 최대 활성 공간 수가 검증된다."),
  pass(8, "opening", "시작 화면·설정·이어하기", "신규·이어하기·계정·설정 흐름이 키보드와 포인터로 작동한다."),
  pass(9, "story", "프롤로그 연출", "7개 도입 패널이 건너뛰기·기록 재생과 함께 정상 동작한다."),
  pass(10, "tutorial", "S01-S04 고독한 튜토리얼", "위험 없이 이동·점프·공중 제어를 배우며 첫 수동 승인을 받는다."),
  pass(11, "radio", "S05 송수신기 획득", "필수 작업 뒤 장비를 얻고 이전 공간에서 조기 획득할 수 없다."),
  pass(12, "radio", "S06 첫 교신·자막 시스템", "조작을 유지한 채 2줄 자막·대화 기록·사망 반복 방지가 작동한다."),
  pass(13, "world", "1층 연결 완성", "S01-S06이 하나의 자연스러운 동쪽 진행 층으로 완주된다."),
  pass(14, "world", "S07-S09 공격 교정과 첫 적", "안전 표적 뒤 긴 예고의 첫 적을 만나며 출구 우회가 불가능하다."),
  pass(15, "world", "S10-S12 운반대·방패 적·서부 승강", "느린 안전길과 빠른 숙련길이 모두 의미 있게 합류한다."),
  pass(16, "enemy", "적 AI 공정성 기반", "발견·예고·공격·회복·피격·패배 상태와 화면 밖 공격 금지를 검증한다."),
  pass(17, "world", "S13-S15 주조장·기중기", "같은 지형 서명 없이 작업 시설 기능과 이동 선택이 연결된다."),
  pass(18, "world", "S16-S18 증기·복합 전투·승강", "최대 3체와 역할 우선순위, 엄폐, 호흡 구간이 작동한다."),
  pass(19, "enemy", "일반 몬스터 다양성", "지상 돌진형·방패형·공중형·지원형이 실루엣과 판단에서 구분된다."),
  pass(20, "approval", "1~3층 실제 플레이 승인", "실제 키로 막힘·반복·빡빡함·무의미한 구조물 없이 두 번째 수동 승인을 받는다."),
  pass(21, "world", "S19-S21 공명 날개 예고·상승 기류", "M01에서 신규 스킬을 주지 않으면서 M02 성장 기대를 만든다."),
  pass(22, "world", "S22-S24 비행 적·붕괴 교량·회수축", "붕괴는 예고되고 실패해도 긴 재이동 없이 회복한다."),
  pass(23, "world", "S25-S27 기억못·압착기·용광 골격", "이야기 휴식과 비치명 위험, 유기적 지형이 서로 다른 리듬을 만든다."),
  pass(24, "world", "S28-S30 역행 운반대·혼성 전투·휴식", "후퇴 공간과 체크포인트를 포함한 후반 상승 곡선을 완성한다."),
  pass(25, "boss", "S31 보스 규칙 예고", "최종전의 핵심 공격 두 가지를 무해한 형태로 미리 학습한다."),
  pass(26, "boss", "S32 외곽 방어체", "보스 규칙을 약한 실전 형태로 확인하고 실패 원인을 읽을 수 있다."),
  pass(27, "boss", "S33 제련 수호자 1막", "기본 이동과 단일 점프로 회피 가능하며 각 패턴 뒤 반격 창이 있다."),
  pass(28, "boss", "S34 제련 수호자 2막", "난도는 패턴 조합으로 높이고 체력 부풀리기와 즉사 구덩이를 쓰지 않는다."),
  pass(29, "ending", "S35-S36 보상·지름길·방 사이 장면", "기록·저장·영구 지름길·냉각 수로 예고가 하나의 출구 흐름으로 이어진다."),
  pass(30, "approval", "36공간 회색박스 전체 승인", "실제 키 무중단 완주와 11-14분 첫 플레이 범위로 세 번째 수동 승인을 받는다."),
  pass(31, "balance", "공간별 시간·난도 재조정", "10-35초 일반 공간 범위와 고강도 3연속 금지를 만족한다."),
  pass(32, "motion", "플레이어·적 모션 완성", "정지·회전·상승·정점·낙하·착지·공격·피격이 구분된다."),
  pass(33, "effects", "먼지·충돌·파괴·화면 반응", "모든 효과가 실제 물리 사건의 위치·방향·강도와 일치한다."),
  pass(34, "art-direction", "단순화된 고품질 2D 기준", "실사 과잉 없이 실루엣·재질·명암·색상 언어를 고정한다."),
  pass(35, "art", "1~2층 환경 아트", "전경·중경·원경 시차와 아래로 이어지는 지지 구조를 확인한다."),
  pass(36, "art", "3~4층 환경 아트", "각 공간은 구분되지만 같은 세계의 재질과 공명 규칙을 공유한다."),
  pass(37, "art", "5~6층·보스 환경 아트", "보스 판정과 이동 목표가 장식에 가려지지 않는다."),
  pass(38, "audio-ui", "음향·무전·자막·접근성", "교신 우선순위, 음량, 자막 기록, 키 변경, 시각 경고가 통합된다."),
  pass(39, "release", "저장·계정·성능·브라우저 후보", "게스트 저장·복구·로그인 준비 상태와 목표 성능을 전체 경로에서 검증한다."),
  pass(40, "release", "사이트 즉시 실행·최종 수동 승인", "시작 화면부터 M01 출구까지 오류 0, 실제 키 완주, 최종 사용자 승인을 모두 충족한다."),
]);

export const PREPASS_APPROVAL_GATES = frozen({
  passNumbersCannotAdvanceWithoutAcceptance: true,
  automatedChecksCannotReplaceManualPlay: true,
  noCoordinateInjectionInFullRuns: true,
  requiredManualPasses: frozen([10, 20, 30, 40]),
  firstRoomFirstPlayMinutes: frozen({ minimum: 11, maximum: 14 }),
  finalRoomCount: 20,
  finalCampaignMinutes: 240,
  firstRoomAddsNewSkill: false,
  secondRoomStartsSkillGrowth: true,
  productionOAuthRequiresFinalOriginAndSecrets: true,
  blockers: frozen([
    "mandatory task can be bypassed",
    "unreachable or purposeless collision surface exists",
    "camera or collision applies unexplained position correction",
    "chase pursuer spawns below terrain or traps the player",
    "radio blocks precision traversal, combat, or chase input",
    "a reused prototype has not been revalidated",
    "console or page errors occur",
  ]),
});

export function validatePrepassProductionContract() {
  const passNumbers = RESET_FORTY_PASS_ROADMAP.map(item => item.number);
  const phases = new Set(RESET_FORTY_PASS_ROADMAP.map(item => item.phase));
  const checks = [
    ["stageZero", PREPASS_BUILD.stage === 0],
    ["passNumberingResets", PREPASS_BUILD.resetsPassNumbering],
    ["fortyPasses", RESET_FORTY_PASS_ROADMAP.length === 40],
    ["passNumbersContiguous", passNumbers.every((value, index) => value === index + 1)],
    ["multipleDisciplinesCovered", phases.size >= 10],
    ["twentyRoomCampaign", RELEASE_VERTICAL_SLICE.campaignMegaRooms === 20 &&
      MEGA_ROOM_CAMPAIGN.length === 20],
    ["fourHourCampaign", RELEASE_VERTICAL_SLICE.campaignTargetMinutes === 240 &&
      SCALE_CONTRACT.targetCampaignSeconds === 14400],
    ["firstRoomIsThirtySixSpaces",
      RELEASE_VERTICAL_SLICE.firstFortyPassScope.firstMegaRoomSpaces === 36 &&
      FIRST_MEGA_ROOM_ZONES.length === 36],
    ["firstRoomIsSixTiers",
      RELEASE_VERTICAL_SLICE.firstFortyPassScope.firstMegaRoomTiers === 6 &&
      SCALE_CONTRACT.tiersPerMegaRoom === 6],
    ["firstRoomTargetsTwelveMinutes",
      RELEASE_VERTICAL_SLICE.firstFortyPassScope.firstMegaRoomTargetMinutes === 12 &&
      SCALE_CONTRACT.targetSecondsPerMegaRoom === 720],
    ["m02IsNotPretendedComplete",
      RELEASE_VERTICAL_SLICE.firstFortyPassScope.secondMegaRoomImplementation === false],
    ["fiveStartingAbilities", STARTING_ABILITIES.length === 5],
    ["firstRoomHasNoNewSkill", PREPASS_APPROVAL_GATES.firstRoomAddsNewSkill === false &&
      MEGA_ROOM_CAMPAIGN[0].skillRewards.length === 0],
    ["secondRoomStartsGrowth", PREPASS_APPROVAL_GATES.secondRoomStartsSkillGrowth &&
      MEGA_ROOM_CAMPAIGN[1].skillRewards.length > 0],
    ["storyHasMoralConflict",
      NARRATIVE_FOUNDATION.pastChoice.includes("직접 승인") &&
      NARRATIVE_FOUNDATION.endingChoice.includes("기억을 지우지")],
    ["toneRejectsSimpleVillain",
      !NARRATIVE_FOUNDATION.tone.singlePureEvilVillain &&
      !NARRATIVE_FOUNDATION.tone.chosenOneProphecy],
    ["fourVoicesSeparated",
      Object.keys(NARRATIVE_FOUNDATION.voices).sort().join(",") ===
      "coreless,ein,maren,origin"],
    ["radioObtainedAfterSilence",
      RADIO_CONTRACT.acquisition.silentZones.join(",") === "S01,S02,S03,S04" &&
      RADIO_CONTRACT.acquisition.cabinetZone === "S05" &&
      RADIO_CONTRACT.acquisition.firstContactZone === "S06"],
    ["radioIsLiveAndPhysical",
      RADIO_CONTRACT.logic.transmissionMethod.includes("실시간") &&
      RADIO_CONTRACT.logic.transmissionMethod.includes("초능력 대화가 아니다")],
    ["marenIsNotOmniscient",
      RADIO_CONTRACT.logic.knowledgeLimit.includes("알지 못한다")],
    ["radioNeverBlocksControl",
      RADIO_CONTRACT.runtime.playerControlContinues &&
      !RADIO_CONTRACT.runtime.longDialogueDuringPrecisionTraversal &&
      !RADIO_CONTRACT.runtime.longDialogueDuringCombat &&
      !RADIO_CONTRACT.runtime.longDialogueDuringChase],
    ["radioDoesNotSolvePuzzles", !RADIO_CONTRACT.runtime.givesPuzzleSolutions],
    ["radioArcCoversCampaign", RADIO_CONTRACT.relationshipArc.length === 6 &&
      RADIO_CONTRACT.relationshipArc[0].rooms === "M01-M04" &&
      RADIO_CONTRACT.relationshipArc.at(-1).rooms === "M19-M20"],
    ["sixTierStoryArc", FIRST_MEGA_ROOM_STORY_ARC.length === 6 &&
      FIRST_MEGA_ROOM_STORY_ARC.every((item, index) => item.tier === index + 1)],
    ["storyScenesAreReplayableAndSkippable",
      STORY_DELIVERY_CONTRACT.activeGameplay.firstViewSkippable &&
      STORY_DELIVERY_CONTRACT.activeGameplay.replayableFromArchive],
    ["noModalGameplayExposition",
      !STORY_DELIVERY_CONTRACT.activeGameplay.modalExpositionAllowed &&
      !STORY_DELIVERY_CONTRACT.activeGameplay.inputBlockingRadioAllowed],
    ["prototypeReuseRequiresValidation",
      REUSE_LEDGER.reuseRule.includes("must pass")],
    ["manualGatesMatchQualityFoundation",
      PREPASS_APPROVAL_GATES.requiredManualPasses.join(",") ===
      QUALITY_APPROVAL_GATES.requiredManualPlaytestPasses.join(",")],
    ["roomTimingMatchesQualityFoundation",
      PREPASS_APPROVAL_GATES.firstRoomFirstPlayMinutes.minimum ===
      QUALITY_APPROVAL_GATES.firstPlayMinutes.minimum &&
      PREPASS_APPROVAL_GATES.firstRoomFirstPlayMinutes.maximum ===
      QUALITY_APPROVAL_GATES.firstPlayMinutes.maximum],
    ["ceilingFramingRetained",
      ROOM_FRAMING_CONTRACT.visibleCeilingFraction.minimum === 0.06 &&
      ROOM_FRAMING_CONTRACT.visibleCeilingFraction.maximum === 0.12],
    ["terrainSafetyRetained",
      TERRAIN_QUALITY_CONTRACT.maximumSustainedWalkableSlopeDegrees <= 32 &&
      !TERRAIN_QUALITY_CONTRACT.automaticWallVaultAllowed],
    ["guestAndFourProvidersRetained",
      V4_ACCOUNT.guestIsDeviceLocal && V4_ACCOUNT.providers.length === 4],
    ["oauthWaitsForDeployment",
      PREPASS_APPROVAL_GATES.productionOAuthRequiresFinalOriginAndSecrets],
    ["completionBlockersDefined", PREPASS_APPROVAL_GATES.blockers.length >= 7],
    ["canonicalDocumentsDefined", CANONICAL_DOCUMENTS.length >= 5],
  ].map(([name, passed]) => frozen({ name, passed: Boolean(passed) }));

  return frozen({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: frozen(checks),
    measurements: frozen({
      roadmapPasses: RESET_FORTY_PASS_ROADMAP.length,
      campaignMegaRooms: RELEASE_VERTICAL_SLICE.campaignMegaRooms,
      campaignMinutes: RELEASE_VERTICAL_SLICE.campaignTargetMinutes,
      firstRoomSpaces: RELEASE_VERTICAL_SLICE.firstFortyPassScope.firstMegaRoomSpaces,
      firstRoomTiers: RELEASE_VERTICAL_SLICE.firstFortyPassScope.firstMegaRoomTiers,
      firstRoomMinutes: RELEASE_VERTICAL_SLICE.firstFortyPassScope.firstMegaRoomTargetMinutes,
      silentOpeningZones: RADIO_CONTRACT.acquisition.silentZones.length,
      radioArcStages: RADIO_CONTRACT.relationshipArc.length,
      firstRoomStoryTiers: FIRST_MEGA_ROOM_STORY_ARC.length,
      completionBlockers: PREPASS_APPROVAL_GATES.blockers.length,
    }),
  });
}
