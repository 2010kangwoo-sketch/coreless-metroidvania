export const PASS08_BUILD = Object.freeze({
  id: "rebuild-v3-pass08",
  pass: 8,
  branch: "rebuild/mega-room-v3-40pass",
  scope: "story spine and playable prologue for rooms 01-04",
  finalArtIncluded: false,
  releaseMilestone: "narrative foundation",
});

export const STORY_CORE = Object.freeze({
  protagonist: "코어리스",
  startingState: "기억과 중심 코어가 분리된 채 폐쇄된 제련소의 도착 전실에서 깨어난다.",
  visibleGoal: "원점 코어가 보내는 신호를 따라가며 잃어버린 기억 조각과 시설 접근 권한을 회수한다.",
  conflict: "원점 코어에서 새어 나온 검은 공명이 관리 기계와 생체 잔재를 점점 강한 괴물로 변형한다.",
  progressionCause: "각 스킬은 과거의 코어리스가 원점 코어를 봉인할 때 분리해 둔 기능 기억이다.",
  finalTruth: "오염의 근원인 원점 코어는 제거해야 할 외부 물체가 아니라 코어리스에게서 분리된 중심 그 자체다.",
  endingGoal: "근원 수호자를 쓰러뜨리고 원점 코어에 도달해, 갇힌 기억을 지우지 않은 채 검은 공명의 역류를 안정화한다.",
});

export const STORY_CHAPTERS = Object.freeze([
  Object.freeze({
    id: "awakening",
    rooms: Object.freeze(["r01", "r02", "r03"]),
    name: "빈 중심의 각성",
    purpose: "주인공의 결핍과 원점 코어의 신호를 제시하고 첫 기능 기억을 회수한다.",
  }),
  Object.freeze({
    id: "locked_forge",
    rooms: Object.freeze(["r04", "r05", "r06"]),
    name: "잠긴 제련소",
    purpose: "오염의 흔적을 따라 집게와 대시 기억을 회수하고 깊은 구역의 봉쇄를 돌파한다.",
  }),
  Object.freeze({
    id: "hostile_records",
    rooms: Object.freeze(["r07", "r08", "r09"]),
    name: "적이 된 기록",
    purpose: "벽 이동과 공격 기억을 되찾고, 관리 기계가 괴물로 변한 원인을 처음 확인한다.",
  }),
  Object.freeze({
    id: "separation_truth",
    rooms: Object.freeze(["r10", "r11", "r12"]),
    name: "분리 명령의 진실",
    purpose: "모든 능력을 조합하며 코어 분리가 사고가 아니라 주인공 자신의 선택이었음을 밝힌다.",
  }),
  Object.freeze({
    id: "return_to_origin",
    rooms: Object.freeze(["r13", "r14", "r15"]),
    name: "원점으로의 귀환",
    purpose: "근원의 방어 반응을 돌파하고 수호자를 쓰러뜨린 뒤 원점 코어에 도달한다.",
  }),
]);

export const ABILITY_MEMORY_RELICS = Object.freeze([
  Object.freeze({
    ability: "move_jump",
    room: "r01",
    relic: "비상 기동 회로",
    storyReason: "중심 코어가 없어도 남아 있던 최소 생존 기능이 각성한다.",
  }),
  Object.freeze({
    ability: "double_jump",
    room: "r03",
    relic: "공명 날개",
    storyReason: "첫 기억 조각이 몸의 공명 출력을 두 단계로 나누는 법을 되돌려 준다.",
  }),
  Object.freeze({
    ability: "grapple",
    room: "r05",
    relic: "연결사 기억",
    storyReason: "과거 시설을 수리하던 연결 권한이 천장 레일과 다시 동기화된다.",
  }),
  Object.freeze({
    ability: "dash",
    room: "r06",
    relic: "맥동 추진기",
    storyReason: "봉쇄 수문을 통과하기 위해 압축 공명을 순간 방출하는 기억을 회수한다.",
  }),
  Object.freeze({
    ability: "wall_jump",
    room: "r07",
    relic: "벽면 고정각",
    storyReason: "상승축 유지보수 기록이 벽 접촉과 반동 제어를 복원한다.",
  }),
  Object.freeze({
    ability: "attack",
    room: "r08",
    relic: "절단 권한",
    storyReason: "관리 기계를 파괴하지 않으려 봉인했던 전투 권한을 첫 적대 조립체 앞에서 해제한다.",
  }),
]);

const beat = (
  room,
  id,
  title,
  revelation,
  gameplayCause,
  required = true,
) => Object.freeze({
  room,
  id,
  title,
  revelation,
  gameplayCause,
  required,
});

export const ROOM_STORY_BEATS = Object.freeze([
  beat("r01", "awakening_signal", "빈 중심의 기동", "코어리스는 원점 코어의 희미한 맥동을 듣고 깨어난다.", "안전한 이동으로 신호 방향을 확인한다."),
  beat("r02", "separation_record", "기록 01 · 분리", "누군가 코어리스를 원점 코어에서 의도적으로 분리했다는 기록이 남아 있다.", "두 점프 출력을 구분해 잠긴 학습문을 연다."),
  beat("r03", "resonance_wing", "기억 01 · 공명 날개", "공명 날개는 새 장비가 아니라 주인공이 잃어버린 기능 기억이다.", "이중 점프를 회수해 첫 상승축에 도달한다."),
  beat("r04", "black_resonance_trace", "검은 공명의 흔적", "상층 벽면의 긁힌 자국은 관리 생물이 이미 변형되었음을 보여준다.", "경사에서 속도를 제어하며 움직이는 흔적을 추적한다."),
  beat("r05", "tether_memory", "기억 02 · 연결사", "코어리스는 과거 이 제련소의 레일과 구조물을 직접 수리했다.", "집게 해제 시점을 조절해 기억 조각에 접근한다."),
  beat("r06", "lockdown_pulse", "기억 03 · 맥동 추진", "시설은 코어리스를 침입자로 판정하고 원점 구역을 봉쇄한다.", "대시 기억으로 수문의 짧은 통과창을 돌파한다."),
  beat("r07", "maintenance_warning", "기록 02 · 유지보수 경고", "원점 코어의 공명 농도가 높아질수록 관리체의 공격성이 증가했다.", "벽 이동을 복원하고 매복체를 피해 상승한다."),
  beat("r08", "combat_authority", "기억 04 · 절단 권한", "괴물은 외부 침입자가 아니라 검은 공명에 잠식된 관리 기계다.", "첫 전투 직전에 공격 권한을 회수하고 세 역할의 적을 상대한다."),
  beat("r09", "workers_last_route", "기록 03 · 마지막 철수", "작업자들은 심연 교량을 지나 원점 구역을 봉인했지만 모두 빠져나오지 못했다.", "포탑과 붕괴 교량을 돌파해 그들의 마지막 경로를 따른다."),
  beat("r10", "forge_taken", "검은 공명의 제어", "오염은 이제 생물뿐 아니라 압착기와 제련 장치의 주기까지 바꾼다.", "예고 신호를 읽으며 지배된 설비를 통과한다."),
  beat("r11", "chosen_separation", "기록 04 · 자발적 분리", "코어를 분리한 사람은 코어리스 자신이었으며 폭주를 막기 위한 선택이었다.", "균형추를 복원해 봉인 당시의 하부 기록을 연다."),
  beat("r12", "memory_reassembly", "기억 05 · 재조립", "흩어진 기능 기억들이 하나의 몸으로 다시 연결되기 시작한다.", "집게·대시·이중 점프를 조합해 근원 진입 권한을 완성한다."),
  beat("r13", "origin_truth", "근원 앞의 진실", "원점 코어에는 제련소 작업자들의 마지막 기억과 코어리스의 중심이 함께 갇혀 있다.", "추격 전 안전 구역에서 최종 선택과 규칙을 확인한다."),
  beat("r14", "origin_defense", "근원의 방어 반응", "붕괴석은 추격자가 아니라 원점 코어가 만들어 낸 거대한 자가 방어체다.", "모든 이동 능력으로 지면을 따르는 방어체를 따돌린다."),
  beat("r15", "return_to_origin", "원점으로의 귀환", "근원 수호자를 넘어야 코어와 기억에 손을 댈 수 있다.", "강화된 수호자를 쓰러뜨리고 원점 코어에 접속해 역류를 안정화한다."),
]);

export const ENEMY_ESCALATION = Object.freeze([
  Object.freeze({
    tier: 0,
    rooms: Object.freeze(["r04", "r05", "r06", "r07"]),
    enemies: Object.freeze(["긁힌 흔적", "휴면 파수기", "회피형 매복체"]),
    combatRule: "공격 획득 전에는 예고와 회피만 요구하며 필수 처치를 두지 않는다.",
  }),
  Object.freeze({
    tier: 1,
    rooms: Object.freeze(["r08"]),
    enemies: Object.freeze(["지상 크롤러"]),
    combatRule: "느린 돌진과 긴 예고로 기본 공격과 거리 조절을 가르친다.",
  }),
  Object.freeze({
    tier: 2,
    rooms: Object.freeze(["r08", "r09"]),
    enemies: Object.freeze(["비행 파수기", "고정 포탑"]),
    combatRule: "높이와 엄폐를 사용하게 하지만 화면 밖 공격은 금지한다.",
  }),
  Object.freeze({
    tier: 3,
    rooms: Object.freeze(["r08", "r10", "r11"]),
    enemies: Object.freeze(["장갑 경비체", "공명 강화 크롤러"]),
    combatRule: "정면 방어와 약점 노출 주기로 공격 순서 선택을 요구한다.",
  }),
  Object.freeze({
    tier: 4,
    rooms: Object.freeze(["r12", "r14"]),
    enemies: Object.freeze(["천장 매복체", "붕괴 방어체"]),
    combatRule: "여러 이동 능력을 사용하되 실패 회수 경로와 명확한 예고를 유지한다.",
  }),
  Object.freeze({
    tier: 5,
    rooms: Object.freeze(["r15"]),
    enemies: Object.freeze(["근원 수호자"]),
    combatRule: "모든 능력을 시험하지만 각 패턴 뒤 안전한 반격 창을 제공한다.",
  }),
]);

export const PASS08_PLAYABLE_BEATS = Object.freeze([
  Object.freeze({
    id: "prologue",
    room: "r01",
    title: "중심 신호 감지",
    text: "당신은 기억도 중심도 없는 코어리스입니다. 위쪽 원점 코어의 신호를 따라가세요.",
  }),
  Object.freeze({
    id: "awakeningEcho",
    room: "r01",
    title: "잔향 01",
    text: "이 몸은 비어 있다. 하지만 저 신호는 나를 알고 있다.",
  }),
  Object.freeze({
    id: "separationRecord",
    room: "r02",
    title: "기록 01 · 분리",
    text: "분리 명령 확인. 기능 기억을 각 구역에 봉인한다.",
  }),
  Object.freeze({
    id: "resonanceWing",
    room: "r03",
    title: "기억 01 · 공명 날개",
    text: "새 힘이 아니다. 내가 잊고 있던 움직임이 돌아왔다.",
  }),
  Object.freeze({
    id: "upperSignal",
    room: "r04",
    title: "원점 신호 증폭",
    text: "위층에서 같은 맥동이 더 강하게 들린다.",
  }),
  Object.freeze({
    id: "hunterWarning",
    room: "r04",
    title: "검은 공명의 흔적",
    text: "벽의 긁힌 자국이 서쪽으로 이어진다. 다음 구역에는 무언가 깨어 있다.",
  }),
]);

export function createPass08StoryProgress() {
  return Object.fromEntries(PASS08_PLAYABLE_BEATS.map(item => [item.id, false]));
}

export function validatePass08Story() {
  const roomIds = ROOM_STORY_BEATS.map(item => item.room);
  const chapterRooms = STORY_CHAPTERS.flatMap(chapter => chapter.rooms);
  const abilityRooms = ABILITY_MEMORY_RELICS.map(item => item.room);
  const enemyTiers = ENEMY_ESCALATION.map(item => item.tier);
  const checks = [
    ["clearProtagonistIdentity", STORY_CORE.protagonist === "코어리스"],
    ["clearStartingState", STORY_CORE.startingState.includes("기억") && STORY_CORE.startingState.includes("중심 코어")],
    ["clearVisibleGoal", STORY_CORE.visibleGoal.includes("원점 코어") && STORY_CORE.visibleGoal.includes("기억 조각")],
    ["clearConflict", STORY_CORE.conflict.includes("괴물") && STORY_CORE.conflict.includes("검은 공명")],
    ["skillsHaveNarrativeCause", STORY_CORE.progressionCause.includes("기능 기억")],
    ["rootIsFinalDestination", STORY_CORE.finalTruth.includes("원점 코어") && STORY_CORE.endingGoal.includes("근원 수호자")],
    ["fiveStoryChapters", STORY_CHAPTERS.length === 5],
    ["chaptersCoverAllRooms", chapterRooms.join(",") === Array.from({ length: 15 }, (_, index) => `r${String(index + 1).padStart(2, "0")}`).join("," )],
    ["everyRoomHasOneRequiredBeat", roomIds.length === 15 && new Set(roomIds).size === 15 && ROOM_STORY_BEATS.every(item => item.required)],
    ["storyBeatsCauseGameplay", ROOM_STORY_BEATS.every(item => item.gameplayCause.length >= 18)],
    ["sixAbilityMemories", ABILITY_MEMORY_RELICS.length === 6],
    ["abilitiesIntroducedInOrder", abilityRooms.join(",") === "r01,r03,r05,r06,r07,r08"],
    ["combatStartsWithAttackAuthority", ROOM_STORY_BEATS.find(item => item.room === "r08")?.id === "combat_authority"],
    ["enemyEscalationHasSixTiers", ENEMY_ESCALATION.length === 6],
    ["enemyTiersStrictlyIncrease", enemyTiers.every((tier, index) => tier === index)],
    ["noMandatoryCombatBeforeAttack", ENEMY_ESCALATION[0].combatRule.includes("필수 처치")],
    ["finalEnemyIsRootGuardian", ENEMY_ESCALATION.at(-1).enemies.includes("근원 수호자")],
    ["playableStoryCoversRoomsOneToFour", new Set(PASS08_PLAYABLE_BEATS.map(item => item.room)).size === 4],
    ["playableStoryStartsWithGoal", PASS08_PLAYABLE_BEATS[0].text.includes("원점 코어")],
    ["playableStoryEndsWithThreatForeshadow", PASS08_PLAYABLE_BEATS.at(-1).text.includes("깨어 있다")],
    ["noFinalArt", PASS08_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
  });
}
