import {
  FIRST_MEGA_ROOM_ZONES,
  MEGA_ROOM_CAMPAIGN,
  STARTING_ABILITIES,
} from "./pass01-scale-layout.js";
import {
  RESET_PASS01_ROOMS,
  RESET_PASS01_TIER_BUDGETS,
} from "./reset-pass01-room-plan.js";
import {
  RELEASE_SCOPE_CONTRACT,
  SPACE_SIGNATURE_AXES,
  SPATIAL_DIVERSITY_CONTRACT,
  TRAVERSAL_FORGIVENESS_CONTRACT,
  validateReleaseFoundation,
} from "./release-foundation.js";

const frozen = value => Object.freeze(value);

export const RELEASE_PASS01_BUILD = frozen({
  id: "coreless-v4-release-pass01-design",
  cycle: "v4-release-40pass",
  pass: 1,
  branch: "rebuild/mega-room-v4-40pass",
  parent: "5e3705981dfe0ab6d09b032cb08b12007e7780a3",
  scope:
    "lock twenty-mega-room progression and the eight-axis, forgiving 36-space M01 design before runtime implementation",
  runtimeChanged: false,
  finalArtChanged: false,
});

const campaignRoom = ({
  id,
  purpose,
  requires = [],
  rewardId = null,
  rewardName = null,
  teaches,
  visualIdentity,
  climaxType,
  storyReveal,
  exitObjective,
}) => frozen({
  id,
  purpose,
  requires: frozen(requires),
  reward: rewardId === null ? null : frozen({ id: rewardId, name: rewardName }),
  teaches: frozen(teaches),
  visualIdentity,
  climaxType,
  storyReveal,
  exitObjective,
});

export const CAMPAIGN_RELEASE_PLAN = frozen([
  campaignRoom({
    id: "M01",
    purpose: "기본 조작과 세계 규칙을 신뢰하게 만들고 원점 신호를 추적할 첫 이유를 제공",
    teaches: ["variable_jump", "air_control", "basic_attack", "room_task"],
    visualIdentity: "비어 있는 제련소·청록 공명광·거대한 갈비형 지지대",
    climaxType: "guardian-duel",
    storyReveal: "시설은 코어리스를 기억하지만 침입자로 판정한다.",
    exitObjective: "냉각 수로에서 반응하는 공명 날개 잔향을 추적한다.",
  }),
  campaignRoom({
    id: "M02",
    purpose: "첫 신규 이동 능력을 안전하게 익히고 수직 탐색의 범위를 확장",
    requires: ["variable_jump", "air_control"],
    rewardId: "resonance_wings",
    rewardName: "공명 날개",
    teaches: ["resonance_wings", "vertical-route-choice"],
    visualIdentity: "침수 냉각 수로·푸른 압력광·수직 수문",
    climaxType: "flood-escape",
    storyReveal: "검은 공명은 원점에서 설비 전체로 흐르고 있다.",
    exitObjective: "수로 위 유리 온실의 생체 오염 근원을 조사한다.",
  }),
  campaignRoom({
    id: "M03",
    purpose: "벽면 고정과 공명 날개를 결합해 복수 높이의 길을 선택",
    requires: ["resonance_wings"],
    rewardId: "wall_anchor",
    rewardName: "벽면 고정각",
    teaches: ["wall_anchor", "multi-height-navigation"],
    visualIdentity: "파열된 유리 온실·황록 생체광·휘어진 성장 지지대",
    climaxType: "containment-break",
    storyReveal: "생체 잔재도 원점의 기억을 흡수하며 변형된다.",
    exitObjective: "온실을 감시하던 파수기 첨탑의 봉쇄망을 해제한다.",
  }),
  campaignRoom({
    id: "M04",
    purpose: "1막 능력을 조합하고 첫 장거리 봉쇄망을 해제",
    requires: ["resonance_wings", "wall_anchor"],
    teaches: ["vertical-combat", "guardian-routing"],
    visualIdentity: "높은 파수기 첨탑·백색 탐조광·비대칭 감시교",
    climaxType: "vertical-siege",
    storyReveal: "원점 방어망은 도시 전체를 하나의 침입 감지기로 사용한다.",
    exitObjective: "철수대의 마지막 운행 기록을 따라 폐철도로 진입한다.",
  }),
  campaignRoom({
    id: "M05",
    purpose: "지상 속도 변화와 공간 관성을 이용하는 빠른 횡단을 도입",
    requires: ["resonance_wings", "wall_anchor"],
    rewardId: "pulse_dash",
    rewardName: "맥동 대시",
    teaches: ["pulse_dash", "momentum-control"],
    visualIdentity: "폐철도 심장부·적동 경고광·거대 왕복 레일",
    climaxType: "train-chase",
    storyReveal: "철수대는 원점에서 멀어지는 대신 특정 물체를 안쪽으로 운반했다.",
    exitObjective: "침수된 종착역에서 운반 화물의 행방을 찾는다.",
  }),
  campaignRoom({
    id: "M06",
    purpose: "대시의 수평 관성과 연결사 집게의 곡선 이동을 결합",
    requires: ["pulse_dash", "resonance_wings"],
    rewardId: "linker_grapple",
    rewardName: "연결사 집게",
    teaches: ["linker_grapple", "swing-release"],
    visualIdentity: "침수 정거장·남청 반사광·매달린 객차 골격",
    climaxType: "submerged-pursuit",
    storyReveal: "코어리스는 시설을 통과한 생존자가 아니라 시설을 정비한 연결사였다.",
    exitObjective: "집게에 남은 작업 좌표를 따라 공명 채석장으로 이동한다.",
  }),
  campaignRoom({
    id: "M07",
    purpose: "대시와 집게를 넓은 파괴 지형에서 조합하고 경로 판단을 강화",
    requires: ["pulse_dash", "linker_grapple"],
    teaches: ["destructible-route", "grapple-dash-combination"],
    visualIdentity: "공명 채석장·자주 결정광·원호형 절단면",
    climaxType: "colossus-collapse",
    storyReveal: "검은 공명이 우발적으로 샌 것이 아니라 방어 목적으로 방출된 흔적이 있다.",
    exitObjective: "방출 명령의 주체를 확인하기 위해 봉인 기록고를 연다.",
  }),
  campaignRoom({
    id: "M08",
    purpose: "기억 투시로 보이지 않던 경로와 과거 사건을 함께 해석",
    requires: ["linker_grapple", "pulse_dash"],
    rewardId: "memory_sight",
    rewardName: "기억 투시",
    teaches: ["memory_sight", "past-present-route"],
    visualIdentity: "봉인 기록고·회백 기록광·접히는 서고층",
    climaxType: "archive-defense",
    storyReveal: "코어 분리는 외부 명령이 아니라 코어리스 자신의 승인으로 시작됐다.",
    exitObjective: "분리 장치의 생체 부품이 제작된 유기 제련로를 조사한다.",
  }),
  campaignRoom({
    id: "M09",
    purpose: "낙하 공격으로 수직 이동과 전투의 방향을 연결",
    requires: ["memory_sight", "resonance_wings"],
    rewardId: "falling_cut",
    rewardName: "낙하 절단",
    teaches: ["falling_cut", "downward-combat-route"],
    visualIdentity: "유기 제련로·주홍 용광광·살아 움직이는 금속 늑골",
    climaxType: "furnace-organism",
    storyReveal: "관리 기계와 생체 조직의 융합은 원점 봉인 실험의 부산물이었다.",
    exitObjective: "원점이 되비추는 기억을 확인하기 위해 거울 저수지로 간다.",
  }),
  campaignRoom({
    id: "M10",
    purpose: "공격을 피하는 것에 더해 읽고 되돌리는 전투 판단을 도입",
    requires: ["memory_sight", "falling_cut"],
    rewardId: "resonance_counter",
    rewardName: "공명 반격",
    teaches: ["resonance_counter", "telegraph-reading"],
    visualIdentity: "거울 저수지·은청 반사광·상하 대칭 수면",
    climaxType: "reflection-trial",
    storyReveal: "원점 코어는 코어리스의 기억을 공격이 아니라 질문의 형태로 되돌린다.",
    exitObjective: "철수대 봉인의 실패 지점인 터빈 묘지로 이동한다.",
  }),
  campaignRoom({
    id: "M11",
    purpose: "공중 대시로 긴 공백을 건너며 기존 수직 능력과 속도를 통합",
    requires: ["pulse_dash", "resonance_wings", "resonance_counter"],
    rewardId: "air_dash",
    rewardName: "공중 대시",
    teaches: ["air_dash", "air-route-commitment"],
    visualIdentity: "터빈 묘지·회청 폭풍광·다층 회전날개",
    climaxType: "storm-chase",
    storyReveal: "철수대는 원점 봉인을 완성하지 못했고 코어리스만 안쪽에 남았다.",
    exitObjective: "왜 혼자 남았는지 확인하기 위해 기억 감옥에 진입한다.",
  }),
  campaignRoom({
    id: "M12",
    purpose: "3막의 이동·전투 능력을 기억 선택과 결합해 분리의 진실을 확정",
    requires: ["memory_sight", "air_dash", "resonance_counter"],
    teaches: ["memory-gauntlet", "truth-choice"],
    visualIdentity: "기억 감옥·무채색 봉인광·반복이 끊기는 감방 고리",
    climaxType: "memory-gauntlet",
    storyReveal: "코어리스는 폭주를 멈추기 위해 스스로 자신의 중심을 분리했다.",
    exitObjective: "분리 이후 검게 변한 방어체의 제작소를 추적한다.",
  }),
  campaignRoom({
    id: "M13",
    purpose: "공명 파쇄로 장갑·벽·방어 규칙을 능동적으로 바꿈",
    requires: ["air_dash", "resonance_counter"],
    rewardId: "resonance_break",
    rewardName: "공명 파쇄",
    teaches: ["resonance_break", "armor-and-route-break"],
    visualIdentity: "검은 주조소·암적 공명광·겹쳐진 장갑판",
    climaxType: "armored-forgemaster",
    storyReveal: "검은 공명은 기억을 먹을수록 방어체를 더 단단하게 만든다.",
    exitObjective: "주조소가 움직이기 시작한 붕괴 도시를 통과한다.",
  }),
  campaignRoom({
    id: "M14",
    purpose: "무너지는 대도시에서 집게 실패를 회수하며 긴 추격을 해결",
    requires: ["linker_grapple", "air_dash", "resonance_break"],
    rewardId: "grapple_recall",
    rewardName: "집게 회수 강화",
    teaches: ["grapple_recall", "destruction-chase"],
    visualIdentity: "붕괴 도시·모래빛 역광·기울어진 거대 건축",
    climaxType: "city-collapse-chase",
    storyReveal: "원점 방어 의식은 설비뿐 아니라 도시 구조 자체를 움직인다.",
    exitObjective: "모든 수호자를 연결하는 방어 신경망에 접속한다.",
  }),
  campaignRoom({
    id: "M15",
    purpose: "연속 대시를 통해 여러 짧은 판단을 하나의 속도 흐름으로 연결",
    requires: ["pulse_dash", "air_dash", "grapple_recall"],
    rewardId: "chain_dash",
    rewardName: "연속 대시",
    teaches: ["chain_dash", "route-sequencing"],
    visualIdentity: "방어 신경망·전기 청백광·갈라지는 신경 통로",
    climaxType: "network-assault",
    storyReveal: "서로 다른 수호자들은 원점 코어의 하나의 방어 의식을 나눠 가진다.",
    exitObjective: "신경망이 보여 주는 거짓 원점을 확인한다.",
  }),
  campaignRoom({
    id: "M16",
    purpose: "능력으로 길을 여는 것과 거짓 목표를 거부하는 판단을 결합",
    requires: ["memory_sight", "resonance_break", "chain_dash"],
    teaches: ["false-route-rejection", "full-kit-choice"],
    visualIdentity: "거짓 원점·백색 무중력광·완벽해 보이는 대칭 구조",
    climaxType: "false-core-decision",
    storyReveal: "누군가 코어리스를 파괴로 유도하기 위해 원점의 기억을 모방했다.",
    exitObjective: "모방 신호를 버리고 실제 근원 접근로로 향한다.",
  }),
  campaignRoom({
    id: "M17",
    purpose: "모든 핵심 능력을 넓은 전장과 다중 경로에서 독립적으로 선택",
    requires: ["chain_dash", "grapple_recall", "resonance_break"],
    teaches: ["full-kit-siege", "resource-priority"],
    visualIdentity: "근원 접근로·검푸른 심층광·끝이 보이지 않는 방어교",
    climaxType: "multi-sentinel-siege",
    storyReveal: "원점 코어는 외부 장치가 아니라 코어리스에게서 분리된 중심이다.",
    exitObjective: "자가 방어가 폭주한 방어 나선의 중심으로 내려간다.",
  }),
  campaignRoom({
    id: "M18",
    purpose: "완성된 이동 능력을 실제 지형을 따라오는 대형 추격체와 대조",
    requires: ["chain_dash", "grapple_recall", "air_dash"],
    teaches: ["terrain-bound-pursuit", "full-kit-chase"],
    visualIdentity: "방어 나선·암청 낙하광·거대한 원호형 하강 구조",
    climaxType: "spiral-boulder-chase",
    storyReveal: "근원의 자가 방어체는 코어리스의 귀환을 재결합 위험으로 판단한다.",
    exitObjective: "수호자가 만들어진 내부 공간으로 진입한다.",
  }),
  campaignRoom({
    id: "M19",
    purpose: "최종전 직전 모든 전투 규칙을 짧고 명확한 조합으로 재확인",
    requires: ["memory_sight", "resonance_counter", "resonance_break"],
    teaches: ["guardian-origin", "final-combat-rehearsal"],
    visualIdentity: "수호자의 태내·어두운 적자광·맥동하는 방어막 층",
    climaxType: "guardian-prelude",
    storyReveal: "수호자는 코어리스를 미워해서가 아니라 중심을 다시 잃을까 두려워 태어났다.",
    exitObjective: "실시간 교신이 끊긴 채 원점 코어에 홀로 진입한다.",
  }),
  campaignRoom({
    id: "M20",
    purpose: "기억을 지우거나 중심을 파괴하지 않고 전체 능력과 선택을 결산",
    requires: ["chain_dash", "grapple_recall", "resonance_break", "memory_sight"],
    teaches: ["final-integration", "reconnection-choice"],
    visualIdentity: "원점 코어·흑백에서 청록으로 회복되는 광원·겹쳐지는 기억 공간",
    climaxType: "root-guardian-and-reconnection",
    storyReveal: "중심을 되찾는 것은 과거로 돌아가는 일이 아니라 결과를 안고 다시 연결되는 일이다.",
    exitObjective: "안정화된 도시와 다시 연결된 마렌의 신호로 엔딩을 완성한다.",
  }),
]);

const spaceDesign = (
  id,
  silhouette,
  elevationPattern,
  anchorStructure,
  traversalRhythm,
  hazardOrEnemyRole,
  lightingDepth,
  storyPurpose,
  reachRatio,
  landingWidthBodies,
  precisionLandings,
  recoveryType,
  demanding = false,
) => frozen({
  id,
  signature: frozen({
    silhouette,
    primaryDirection: RESET_PASS01_ROOMS.find(room => room.id === id)?.direction,
    elevationPattern,
    anchorStructure,
    traversalRhythm,
    hazardOrEnemyRole,
    lightingDepth,
    storyPurpose,
  }),
  traversalBudget: frozen({
    reachRatio,
    landingWidthBodies,
    precisionLandings,
    recoveryType,
    demanding,
    destinationVisible: true,
    requiredRoute: true,
  }),
});

export const M01_RELEASE_SPACE_DESIGNS = frozen([
  spaceDesign("S01", "낮고 넓은 비대칭 도착실", "평지와 얕은 단차", "꺼진 원점 제단", "관찰 후 이동", "위험 없음", "동쪽 청록 맥동의 깊은 원근", "각성과 첫 목표", 0.55, 3.4, 0, "위험 없는 연속 시작 바닥"),
  spaceDesign("S02", "부서진 계단 테라스", "두 높이의 완만한 상승", "갈라진 제련 계단", "짧은 점프와 긴 점프 비교", "위험 없음", "계단 아래 따뜻한 하부광", "몸의 기본 반응 확인", 0.72, 2.8, 0, "연속 회수 바닥"),
  spaceDesign("S03", "압축된 갈비 통로", "낮은 천장 아래 수평", "휘어진 보수 갈비", "점프 높이 절제", "천장 접촉", "좁은 측광과 먼 배경 틈", "제어 기록 손상", 0.64, 2.6, 0, "동일 높이 안전 바닥"),
  spaceDesign("S04", "세로로 열린 완충 우물", "단계적 하강", "매달린 회수대", "낙하 중 방향 선택", "비치명 낙하", "아래에서 올라오는 부드러운 광원", "원점 신호 지속", 0.68, 3.1, 0, "우물 전체 연속 완충 바닥"),
  spaceDesign("S05", "분리된 유지보수 작업실", "낮은 작업대 순환", "송수신기 보관함", "관찰·전원·분리·획득", "고장 감시장치", "보관함의 좁은 작업등", "무전기 획득", 0.58, 3.0, 0, "잠금 없는 작업 바닥"),
  spaceDesign("S06", "높은 평형추 승강축", "수직 상승", "쌍중량 승강기", "이동하며 첫 교신", "승강기 낙하 방지", "상하로 길게 이어지는 중계광", "마렌과 첫 교신", 0.62, 2.8, 0, "승강기 아래 고정 안전대"),

  spaceDesign("S07", "상하가 어긋난 갈비 회랑", "아래 안전길·위 빠른길", "기울어진 제련 늑골", "경로 비교", "휴면 실루엣", "서쪽 역광과 상층 그림자", "침입자 판정 예고", 0.76, 2.4, 0, "출구 전 재합류"),
  spaceDesign("S08", "원형 절단 교정실", "낮은 표적과 높은 표적", "회전 교정 고리", "정지·공격·확인", "무해 표적", "중앙 집중광과 어두운 외곽", "기본 공격 교정", 0.60, 3.2, 0, "적과 피해가 없는 완전 안전실"),
  spaceDesign("S09", "움푹 팬 화덕 둥지", "중앙 저지대와 후퇴대", "꺼진 화덕", "예고·회피·반격", "크롤러", "화덕 잔광과 적 실루엣", "첫 활성 관리체", 0.72, 2.7, 0, "적이 넘지 못하는 입구 후퇴대"),
  spaceDesign("S10", "길게 열린 왕복 운반교", "수평 이동 바닥과 하부 길", "이중 운반대", "탑승·위치 유지·하차", "이동 플랫폼", "멀어지는 레일 점광", "시설 기능 관찰", 0.78, 2.3, 0, "하부 고정 보수교"),
  spaceDesign("S11", "방패형 반원 전투 둥지", "낮은 중앙과 상층 우회", "파수기 방패벽", "유도·우회·후방 반격", "방패 파수기", "정면 냉광과 후방 약점광", "시설의 적대 확정", 0.79, 2.4, 0, "공격이 닿지 않는 좌우 재정비대", true),
  spaceDesign("S12", "서쪽으로 접힌 정비축", "단계적 수직 상승", "중앙 평형추", "오르기·대기·층 전환", "움직이는 승강판", "위층을 먼저 보여주는 수직광", "철수 기록 발견", 0.74, 2.6, 0, "각 높이에 배치된 중간 휴식 홈"),

  spaceDesign("S13", "비대칭 작업대 주조장", "서로 다른 세 높이", "파손된 주조대", "안전 연속 점프 또는 지름길", "낙하 가능", "용광로 잔광과 깊은 작업 배경", "코어리스 정비 표식", 0.80, 2.2, 0, "완만한 경사 회수면"),
  spaceDesign("S14", "낮고 넓은 환기실", "환기구와 중앙 전투면", "차단 가능한 환기구", "소리 관찰·봉쇄·전투", "크롤러 2체", "환기 경고등과 낮은 안개층", "오염체의 감각", 0.75, 2.6, 0, "출구 안전 발판"),
  spaceDesign("S15", "십자형 기중기 교차장", "수평·수직 발판 교차", "매달린 대형 기중기", "주기 관찰·탑승·중간 대기", "교차 이동 발판", "상부 역광과 하부 깊은 낙차", "봉인 부품 운반", 0.84, 1.75, 2, "낙하 경로 아래 두 층 고정 안전대", true),
  spaceDesign("S16", "들쭉날쭉한 증기 수로", "낮은 홈이 반복되는 수평", "노출 증기관", "짧은 이동·정지·재이동", "비치명 증기", "예고등과 증기 사이 명암", "불규칙해진 설비", 0.76, 2.3, 0, "각 분사기 사이 안전 홈"),
  spaceDesign("S17", "세 갈래 높이 전투뜰", "상·중·하 전투 위치", "세 방향 전원주", "우선순위 선택·후퇴·재진입", "세 역할 적", "적 역할별 높이 조명", "공유 공명 명령", 0.80, 2.3, 0, "엄폐물과 입구 후퇴"),
  spaceDesign("S18", "기억층이 감긴 승강고", "느린 수직 상승", "기억 기록 승강기", "호흡·기록·전환", "위험 없음", "기억 잔상이 층별로 이동", "격리된 기능 기억", 0.60, 3.0, 0, "안전 체크포인트"),

  spaceDesign("S19", "열린 공명 제단 전망실", "평평한 조망대", "공명 날개 잔향 제단", "정지·분석·다음 목표 확인", "위험 없음", "냉각 수로 쪽 청백 신호", "M02 능력 예고", 0.52, 3.5, 0, "피해와 낙사가 없는 완전 안전실"),
  spaceDesign("S20", "돛형 발판의 상승 우물", "기류를 타는 큰 수직 상승", "공명 돛 발판", "점프·부유·착지", "상승 기류", "아래에서 위로 흐르는 입자광", "냉각 압력 변화", 0.78, 2.5, 0, "우물 바닥 재상승 기류"),
  spaceDesign("S21", "상하로 갈라진 공방", "위 빠른길·아래 전투길", "중앙 재합류 작업대", "경로 선택·재합류", "선택형 크롤러", "위 밝음·아래 따뜻한 작업광", "기록과 잔향의 선택", 0.80, 2.2, 0, "중앙 회수 공간"),
  spaceDesign("S22", "돔형 생체 온실", "낮은 엄폐와 높은 선제대", "파열된 온실 돔", "유인·고도 변경·공격", "비행 파수기", "황록 생체광과 낮은 그림자", "생체 오염 확장", 0.80, 2.3, 0, "양쪽 넓은 착지면"),
  spaceDesign("S23", "길고 처진 지지탑 교량", "완만한 하강과 붕괴", "세 개의 하부 지지탑", "예고 확인·달리기·짧은 대기", "지연 붕괴", "뒤에서 꺼지는 교량 조명", "철수대의 봉쇄", 0.86, 1.65, 1, "아래 보수 통로", true),
  spaceDesign("S24", "서쪽 지그재그 회수로", "완만한 다단 상승", "평형추 회수문", "속도 완화·안전 상승", "낙하 가능", "상층 기억 신호의 유도광", "마지막 철수자 예고", 0.72, 2.7, 0, "세 개 중간 휴식대"),

  spaceDesign("S25", "잔잔한 작업자 기억못", "평지와 얕은 수면 단차", "세 갈래 기억 기둥", "선택·기억 재생·회복", "위험 없음", "수면 반사와 낮은 기억광", "중심 분리의 첫 단서", 0.50, 3.6, 0, "완전 안전 구간"),
  spaceDesign("S26", "엇갈린 압착기 회랑", "위 빠른길·아래 안전길", "세 쌍의 압착기", "예고 관찰·통과·대기", "비치명 압착", "경고광이 시간차로 이동", "직접적인 시설 방어", 0.84, 1.70, 2, "압착기 전후 안전대", true),
  spaceDesign("S27", "거대한 갈비뼈형 용광로", "곡선 상승과 하강", "용광로 외곽 늑골", "곡선 이동·내외곽 선택", "열기 경계", "주홍 중심광과 어두운 외곽", "수호자 형태의 암시", 0.79, 2.25, 0, "하부 경사 회수면"),
  spaceDesign("S28", "역류하는 다층 운반 회랑", "반대 이동대와 하부 통로", "대형 역행 운반대", "달리기·관성 보정·우회", "역방향 이동 지형", "바깥쪽으로 흐르는 적동광", "봉인 부품의 역류", 0.85, 1.70, 1, "하부 무피해 보수로", true),
  spaceDesign("S29", "타원형 혼성 조립 경기장", "세 높이의 전투 구역", "분리 가능한 포탑 전원", "우선순위·엄폐·고도 변경", "방패·비행·포탑", "각 적 역할을 분리하는 조명", "통합된 공명 전투군", 0.80, 2.35, 0, "세 곳 엄폐와 입구 후퇴"),
  spaceDesign("S30", "동쪽으로 열린 휴식 승강고", "안전 평지와 최종 상승", "회복 장치·기록·승강기", "회복·저장·목표 확인", "위험 없음", "수호자 문양을 비추는 상부광", "최종 목표 확인", 0.55, 3.4, 0, "안전 체크포인트"),

  spaceDesign("S31", "고요한 장축 전실", "넓은 평지와 관찰대", "두 개의 패턴 모형", "관찰·비교·확인", "무해한 보스 예고", "수호자실에서 새어 나오는 역광", "수호자의 기억", 0.55, 3.8, 0, "완전 안전 준비실"),
  spaceDesign("S32", "원형 외곽 방어 고리", "낮은 엄폐와 단일 점프대", "수호자 외곽 링", "예고·회피·반격 예행", "외곽 방어체", "회전하는 두 방향 경고광", "보스 리듬 학습", 0.78, 2.5, 0, "넓은 후퇴 입구"),
  spaceDesign("S33", "긴 타원형 제련 심장실", "평지 중심과 파괴 가능 기둥", "제련 수호자 외피", "거리 조절·단일 점프·반격", "수호자 1막", "돌진선을 읽는 측광", "원점 폭주에 대한 오해", 0.84, 2.45, 0, "패턴 뒤 1.2초 반격 창", true),
  spaceDesign("S34", "상하가 벌어진 공명 격실", "상층 반격대·하층 안전 바닥", "노출되는 수호자 핵", "고도 선택·공명파 회피·반격", "수호자 2막", "약점 노출 때만 켜지는 핵광", "자발적 분리 단서", 0.88, 1.65, 2, "즉사 없는 하부 전투 바닥", true),
  spaceDesign("S35", "부채꼴 공명 회수실", "평지와 되돌아가는 지름길", "기억 기록·회복 장치", "보상·기록·선택", "위험 없음", "냉각 수로 방향의 밝은 조망광", "수호자 기록 회수", 0.50, 3.6, 0, "체크포인트와 지름길"),
  spaceDesign("S36", "서쪽 절벽 전망 출구", "넓은 출구와 멀리 보이는 하강", "냉각 수로 관문", "조망·목표 확인·이탈", "위험 없음", "다음 메가룸의 푸른 원경", "M02 진입 동기", 0.48, 4.0, 0, "영구 안전 출구"),
]);

const signatureValues = design => [
  design.signature.silhouette,
  design.signature.primaryDirection,
  design.signature.elevationPattern,
  design.signature.anchorStructure,
  design.signature.traversalRhythm,
  design.signature.hazardOrEnemyRole,
  design.signature.lightingDepth,
  design.signature.storyPurpose,
];

const signatureDifference = (left, right) =>
  signatureValues(left).filter((value, index) =>
    value !== signatureValues(right)[index]).length;

export function validateReleasePass01Design() {
  const foundation = validateReleaseFoundation();
  const campaignById = new Map(MEGA_ROOM_CAMPAIGN.map(room => [room.id, room]));
  const resetRoomsById = new Map(RESET_PASS01_ROOMS.map(room => [room.id, room]));
  const zonesById = new Map(FIRST_MEGA_ROOM_ZONES.map(zone => [zone.id, zone]));
  const acquired = new Set(STARTING_ABILITIES);
  const unresolvedRequirements = [];
  CAMPAIGN_RELEASE_PLAN.forEach(room => {
    room.requires.forEach(ability => {
      if (!acquired.has(ability)) unresolvedRequirements.push(`${room.id}:${ability}`);
    });
    if (room.reward) acquired.add(room.reward.id);
  });

  const adjacentDifferences = M01_RELEASE_SPACE_DESIGNS.slice(1).map(
    (design, index) => signatureDifference(
      M01_RELEASE_SPACE_DESIGNS[index],
      design,
    ),
  );
  const uniqueSignatures = new Set(M01_RELEASE_SPACE_DESIGNS.map(design =>
    JSON.stringify(signatureValues(design))));
  const tierDiversity = RESET_PASS01_TIER_BUDGETS.map(tier => {
    const designs = M01_RELEASE_SPACE_DESIGNS.filter(design =>
      resetRoomsById.get(design.id)?.tier === tier.tier);
    return frozen({
      tier: tier.tier,
      silhouettes: new Set(designs.map(design =>
        design.signature.silhouette)).size,
      rhythms: new Set(designs.map(design =>
        design.signature.traversalRhythm)).size,
      anchors: new Set(designs.map(design =>
        design.signature.anchorStructure)).size,
    });
  });

  const checks = [
    ["releaseFoundationStillValid", foundation.passed],
    ["releasePassOne", RELEASE_PASS01_BUILD.pass === 1],
    ["designOnlyPass",
      !RELEASE_PASS01_BUILD.runtimeChanged && !RELEASE_PASS01_BUILD.finalArtChanged],
    ["twentyCampaignRooms", CAMPAIGN_RELEASE_PLAN.length === 20],
    ["campaignIdsAreContinuous", CAMPAIGN_RELEASE_PLAN.every((room, index) =>
      room.id === `M${String(index + 1).padStart(2, "0")}`)],
    ["campaignNamesRemainCanonical", CAMPAIGN_RELEASE_PLAN.every(room =>
      campaignById.has(room.id))],
    ["campaignDependenciesAreResolved", unresolvedRequirements.length === 0],
    ["firstRoomGrantsNoAbility", CAMPAIGN_RELEASE_PLAN[0].reward === null],
    ["firstAbilityIsInM02",
      CAMPAIGN_RELEASE_PLAN[1].reward?.id === "resonance_wings"],
    ["everyCampaignRoomHasPurpose", CAMPAIGN_RELEASE_PLAN.every(room =>
      room.purpose.length >= 24)],
    ["everyCampaignRoomHasDistinctVisualIdentity",
      new Set(CAMPAIGN_RELEASE_PLAN.map(room => room.visualIdentity)).size === 20],
    ["campaignUsesVariedClimaxes",
      new Set(CAMPAIGN_RELEASE_PLAN.map(room => room.climaxType)).size >= 12],
    ["everyCampaignRoomChangesObjective", CAMPAIGN_RELEASE_PLAN.every(room =>
      room.exitObjective.length >= 20)],
    ["thirtySixM01SpaceDesigns", M01_RELEASE_SPACE_DESIGNS.length === 36],
    ["m01IdsAreContinuous", M01_RELEASE_SPACE_DESIGNS.every((design, index) =>
      design.id === `S${String(index + 1).padStart(2, "0")}`)],
    ["m01DesignsMatchCanonicalRooms", M01_RELEASE_SPACE_DESIGNS.every(design =>
      resetRoomsById.has(design.id) && zonesById.has(design.id))],
    ["spaceSignatureUsesEightAxes", M01_RELEASE_SPACE_DESIGNS.every(design =>
      signatureValues(design).length === SPACE_SIGNATURE_AXES.length &&
      signatureValues(design).every(Boolean))],
    ["allM01SignaturesAreUnique",
      uniqueSignatures.size === SPATIAL_DIVERSITY_CONTRACT
        .uniqueSpaceSignaturesRequired],
    ["adjacentSpacesChangeAtLeastThreeAxes",
      Math.min(...adjacentDifferences) >=
      SPATIAL_DIVERSITY_CONTRACT.adjacentAxesDifferentMinimum],
    ["eachTierHasEnoughSilhouettes", tierDiversity.every(tier =>
      tier.silhouettes >= SPATIAL_DIVERSITY_CONTRACT.silhouettesPerTierMinimum)],
    ["eachTierHasEnoughRhythms", tierDiversity.every(tier =>
      tier.rhythms >= SPATIAL_DIVERSITY_CONTRACT.traversalRhythmsPerTierMinimum)],
    ["eachTierHasEnoughAnchors", tierDiversity.every(tier =>
      tier.anchors >= SPATIAL_DIVERSITY_CONTRACT.anchorStructuresPerTierMinimum)],
    ["ordinaryRoutesStayWithinEightyPercent",
      M01_RELEASE_SPACE_DESIGNS.filter(design =>
        !design.traversalBudget.demanding).every(design =>
        design.traversalBudget.reachRatio <=
        TRAVERSAL_FORGIVENESS_CONTRACT.requiredOrdinaryReachRatioMaximum)],
    ["demandingRoutesStayWithinNinetyPercent",
      M01_RELEASE_SPACE_DESIGNS.filter(design =>
        design.traversalBudget.demanding).every(design =>
        design.traversalBudget.reachRatio <=
        TRAVERSAL_FORGIVENESS_CONTRACT.requiredDemandingReachRatioMaximum)],
    ["ordinaryLandingsRemainWide",
      M01_RELEASE_SPACE_DESIGNS.filter(design =>
        design.traversalBudget.precisionLandings === 0).every(design =>
        design.traversalBudget.landingWidthBodies >=
        TRAVERSAL_FORGIVENESS_CONTRACT.ordinaryLandingWidthPlayerBodiesMinimum)],
    ["precisionLandingsRespectMinimum",
      M01_RELEASE_SPACE_DESIGNS.filter(design =>
        design.traversalBudget.precisionLandings > 0).every(design =>
        design.traversalBudget.landingWidthBodies >=
        TRAVERSAL_FORGIVENESS_CONTRACT.precisionLandingWidthPlayerBodiesMinimum)],
    ["precisionChainsAreBounded", M01_RELEASE_SPACE_DESIGNS.every(design =>
      design.traversalBudget.precisionLandings <=
      TRAVERSAL_FORGIVENESS_CONTRACT.consecutivePrecisionLandingsMaximum)],
    ["allRequiredDestinationsAreVisible", M01_RELEASE_SPACE_DESIGNS.every(design =>
      design.traversalBudget.destinationVisible)],
    ["allSpacesHaveRecovery", M01_RELEASE_SPACE_DESIGNS.every(design =>
      design.traversalBudget.recoveryType.length >= 8)],
    ["firstRoomScaleMatchesReleaseScope",
      RELEASE_SCOPE_CONTRACT.firstMegaRoomSpaces ===
      M01_RELEASE_SPACE_DESIGNS.length],
  ].map(([name, passed]) => frozen({ name, passed: Boolean(passed) }));

  return frozen({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: frozen(checks),
    measurements: frozen({
      campaignRooms: CAMPAIGN_RELEASE_PLAN.length,
      campaignAbilityRewards: CAMPAIGN_RELEASE_PLAN.filter(room =>
        room.reward).length,
      campaignClimaxTypes: new Set(CAMPAIGN_RELEASE_PLAN.map(room =>
        room.climaxType)).size,
      m01Spaces: M01_RELEASE_SPACE_DESIGNS.length,
      m01UniqueSignatures: uniqueSignatures.size,
      minimumAdjacentAxesDifferent: Math.min(...adjacentDifferences),
      maximumRequiredReachRatio: Math.max(...M01_RELEASE_SPACE_DESIGNS.map(
        design => design.traversalBudget.reachRatio)),
      minimumLandingWidthBodies: Math.min(...M01_RELEASE_SPACE_DESIGNS.map(
        design => design.traversalBudget.landingWidthBodies)),
      maximumPrecisionLandingChain: Math.max(...M01_RELEASE_SPACE_DESIGNS.map(
        design => design.traversalBudget.precisionLandings)),
      tierDiversity: frozen(tierDiversity),
      unresolvedRequirements: frozen(unresolvedRequirements),
    }),
  });
}
