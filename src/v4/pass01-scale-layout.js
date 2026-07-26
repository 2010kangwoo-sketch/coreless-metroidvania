export const PASS01_BUILD = Object.freeze({
  id: "rebuild-v4-pass01",
  pass: 1,
  branch: "rebuild/mega-room-v4-40pass",
  scope: "four-hour campaign scale and 36-space first mega-room blueprint",
  finalArtIncluded: false,
  playableRuntimeIncluded: false,
});

export const SCALE_CONTRACT = Object.freeze({
  viewport: Object.freeze({ width: 1400, height: 900 }),
  megaRoomCount: 20,
  spacesPerMegaRoom: 36,
  tiersPerMegaRoom: 6,
  spacesPerTier: 6,
  targetSecondsPerSpace: 20,
  targetSecondsPerMegaRoom: 720,
  targetCampaignSeconds: 14400,
  nominalWorld: Object.freeze({ width: 16800, height: 7400 }),
  routeRule: "six spaces per tier, alternating east and west, with a vertical connector at each tier end",
});

export const STARTING_ABILITIES = Object.freeze([
  "move",
  "variable_jump",
  "air_control",
  "basic_attack",
  "interact",
]);

export const SPACE_EXTENTS = Object.freeze({
  wide: Object.freeze({ width: 2800, height: 900, screenAreas: 2 }),
  tall: Object.freeze({ width: 1400, height: 1800, screenAreas: 2 }),
  arena: Object.freeze({ width: 2400, height: 1200, screenAreas: 2.29 }),
  junction: Object.freeze({ width: 2100, height: 1200, screenAreas: 2 }),
});

const zone = (
  id,
  name,
  category,
  extent,
  targetSeconds,
  intensity,
  primaryMechanic,
  decision,
  recovery,
  storyBeat,
  enemyRole = "없음",
  extras = {},
) => Object.freeze({
  id,
  sequence: Number(id.slice(1)),
  name,
  category,
  extent,
  targetSeconds,
  intensity,
  primaryMechanic,
  decision,
  recovery,
  storyBeat,
  enemyRole,
  checkpoint: false,
  unlock: null,
  ...extras,
});

export const FIRST_MEGA_ROOM_ZONES = Object.freeze([
  zone("S01", "빈 도착실", "story", "wide", 12, 1, "안전한 이동과 목표 확인", "동쪽의 원점 신호를 따라갈지 정지해 기록을 읽을지 선택", "낙하·피해 요소가 없는 시작 바닥", "코어리스가 기억과 중심 없이 깨어난다.", "없음", { checkpoint: true }),
  zone("S02", "부서진 계단", "navigation", "wide", 15, 1, "짧은 점프와 긴 점프 높이 비교", "낮은 계단과 높은 발판 중 진입 높이를 선택", "모든 틈 아래에 연속된 회수 바닥", "비상 기동 회로가 아직 작동함을 확인한다."),
  zone("S03", "낮은 천장 통로", "navigation", "wide", 16, 2, "점프 버튼 조기 해제로 머리 높이 제어", "낮은 길과 위쪽 기억 파편 길 중 선택", "천장 충돌 뒤 같은 바닥에 착지", "몸이 점프 출력을 기억하지만 제어 기록은 손상되어 있다."),
  zone("S04", "회수 우물", "recovery", "tall", 17, 2, "낙하 중 방향 전환과 안전 착지", "중간 발판으로 내려갈지 곧장 바닥으로 낙하할지 선택", "우물 전체가 즉사 없는 완충 바닥으로 연결", "아래층에서도 원점 신호가 계속 들린다."),
  zone("S05", "맥동 관측창", "story", "wide", 16, 1, "배경 신호와 진행 방향 읽기", "기록 단말을 읽거나 바로 승강축으로 이동", "적과 움직이는 장애물이 없는 관찰 구간", "원점 코어의 맥동이 코어리스에게만 반응한다."),
  zone("S06", "동부 승강축", "transition", "tall", 18, 2, "첫 수직 이동과 카메라 추종", "빠른 승강기와 느린 발판 계단 중 선택", "승강기 아래 고정 안전대와 즉시 재호출 장치", "상층에서 비상 절단 회로의 오래된 교정 기록이 감지된다.", "없음", { checkpoint: true }),

  zone("S07", "잔향 회랑", "navigation", "wide", 16, 2, "진행 방향이 서쪽으로 뒤집히는 첫 지그재그", "바닥의 안전 길과 위쪽 빠른 길 중 선택", "양쪽 길이 같은 출구 앞에서 합류", "뒤쪽에서 휴면 파수기의 움직임이 처음 보인다.", "처치 불필요 휴면 파수기"),
  zone("S08", "절단 교정실", "tutorial", "wide", 18, 1, "시작부터 보유한 기본 공격을 정지 표적에 교정", "가까운 표적과 높은 표적 중 먼저 시험", "두 표적 교정이 끝날 때까지 안전실 출구가 잠기며 피해 요소는 없음", "코어리스의 비상 절단 회로가 원점 신호에 맞춰 다시 교정된다.", "고정형 무해 표적"),
  zone("S09", "휴면 표적실", "combat", "arena", 18, 2, "긴 예고 뒤 한 번 돌진하는 첫 적", "후퇴 공간에서 기다리거나 먼저 접근해 공격", "적이 방 밖으로 나오지 않고 패배 시 입구에서 재시작", "검은 공명이 휴면 관리체를 강제로 깨운다.", "지상 크롤러 1체"),
  zone("S10", "왕복 운반대", "navigation", "wide", 20, 2, "움직이는 바닥 위 위치 유지", "느린 고정 발판과 빠른 운반대 중 선택", "운반대 아래 전체 길이의 고정 회수 통로", "제련소 운반 장치가 여전히 원점 방향으로 자재를 옮긴다."),
  zone("S11", "방패 파수기 둥지", "combat", "arena", 22, 3, "정면 방어와 등 뒤 약점", "위 발판으로 돌아가거나 돌진 뒤를 노려 반격", "좌우 후퇴대와 공격 없는 재정비 구역", "파수기가 코어리스를 시설 침입자로 분류한다.", "방패 파수기 1체"),
  zone("S12", "서부 정비축", "transition", "tall", 18, 2, "서쪽 끝에서 위층으로 방향 전환", "벽면 발판과 중앙 승강판 중 선택", "중간 높이마다 고정 휴식 홈 배치", "작업자 철수 기록의 첫 조각이 위층을 가리킨다.", "없음", { checkpoint: true }),

  zone("S13", "파손 주조장", "navigation", "wide", 18, 2, "높이가 다른 세 작업대 횡단", "짧은 안전 점프와 긴 지름길 점프 중 선택", "모든 간격 아래 경사형 회수 바닥", "작업대에 코어리스의 정비 표식이 남아 있다."),
  zone("S14", "환기 크롤러실", "combat", "arena", 18, 3, "낮은 환기구에서 나오는 적의 소리 예고", "환기구를 먼저 봉쇄하거나 넓은 바닥에서 상대", "적 최대 2체, 출구 쪽 안전 발판 보장", "오염체는 소리와 열을 따라 움직인다.", "지상 크롤러 2체"),
  zone("S15", "매달린 기중기", "navigation", "tall", 20, 3, "수직·수평 이동 발판의 교차 타이밍", "한 번에 건너거나 중간 고정 보에 대기", "움직이는 발판 아래 두 층의 고정 안전대", "기중기가 원점 봉인용 부품을 마지막으로 운반했다."),
  zone("S16", "노출 증기관", "hazard", "wide", 22, 3, "빛과 소리로 예고되는 주기형 증기", "짧은 창을 연속 통과하거나 안전 홈마다 정지", "각 분사기 사이에 캐릭터 두 명 폭의 안전 홈", "검은 공명이 설비 주기를 불규칙하게 흔든다."),
  zone("S17", "세 갈래 전투뜰", "combat", "arena", 24, 4, "높이별 적을 공격 순서로 정리", "포탑 전원·크롤러·방패 파수기 중 첫 목표 선택", "후퇴 엄폐물 두 개, 동시 활성 적 최대 3체", "파수기들이 하나의 공명 명령을 공유하기 시작한다.", "크롤러·방패 파수기·비활성 포탑"),
  zone("S18", "동부 기억 승강고", "transition", "tall", 18, 2, "전투 뒤 호흡 회복과 세 번째 층 전환", "기록 재생 중 이동하거나 끝까지 들을지 선택", "적이 진입하지 못하는 체크포인트 승강고", "기능 기억 하나가 위층 제단에 격리되었다.", "없음", { checkpoint: true }),

  zone("S19", "공명 잔향 제단", "story", "junction", 12, 1, "다음 구역에서 응답하는 공명 날개 신호 분석", "즉시 상승 우물로 가거나 잔향 기록을 확인", "피해와 낙사가 없는 완전 안전 분석실", "공명 날개 기억은 아직 잠겨 있으며 냉각 수로에서 처음 해제할 수 있다."),
  zone("S20", "상승 기류 우물", "navigation", "tall", 16, 2, "단일 점프와 상승 기류를 조합한 높이 제어", "넓은 중간 발판과 기류 직행 발판 중 선택", "실패하면 우물 바닥의 기류에서 즉시 다시 시도", "냉각 수로 쪽 압력 변화가 제련소의 기류까지 흔든다."),
  zone("S21", "상하 분기 공방", "choice", "junction", 20, 3, "운반 발판을 이용한 두 경로 비교", "아래 안전 전투 길과 위쪽 빠른 이동 발판 길 중 선택", "두 길 모두 중앙 회수 공간으로 연결", "작업자 기록과 공명 잔향 중 무엇을 먼저 볼지 선택한다.", "아래 길 크롤러 1체"),
  zone("S22", "비행 파수기 온실", "combat", "arena", 20, 3, "높이를 바꾸는 비행 적과 공중 공격", "낮은 엄폐물 뒤에서 유인하거나 위 발판에서 선제 공격", "비행 적은 방 경계와 화면 밖에서 공격 불가", "생체 온실의 관리 드론까지 검은 공명에 잠식되었다.", "비행 파수기 1체"),
  zone("S23", "무너지는 교량", "setpiece", "wide", 22, 4, "밟은 뒤 늦게 붕괴하는 넓은 다리", "속도를 유지하거나 중간 지지탑에서 기다림", "다리 아래 연속 회수 통로와 재상승 승강판", "철수대가 원점 구역을 봉쇄하며 일부 교량을 끊었다."),
  zone("S24", "서부 수직 회수로", "transition", "tall", 20, 2, "붕괴 구간 뒤 안전한 수직 회복", "승강추를 작동하거나 측면 완만 발판으로 상승", "중간 휴식대 세 개와 낙하 완충 바닥", "위층에 마지막 철수자의 기억 신호가 남아 있다.", "없음", { checkpoint: true }),

  zone("S25", "작업자 기억못", "story", "wide", 14, 1, "직전 긴장 해소와 기억 재생", "세 기록 중 하나를 먼저 복원", "전투·함정이 없는 완전 안전 구간", "작업자들은 코어리스가 원점 코어를 분리하는 일을 도왔다."),
  zone("S26", "교차 압착기실", "hazard", "wide", 20, 3, "서로 어긋난 압착기 예고 읽기", "한 주기를 기다리거나 빠른 위쪽 길로 우회", "각 압착기 전후 고정 안전대와 비치명 피해", "시설 방어가 코어리스의 진행을 직접 막기 시작한다."),
  zone("S27", "용광로 갈비뼈", "navigation", "tall", 22, 3, "곡선 지지대 사이의 상승·하강", "내부의 짧은 길과 외곽의 넓은 길 중 선택", "아래쪽 경사 회수면이 시작점으로 연결", "거대한 용광로의 형태가 원점 수호자의 골격과 닮아 있다."),
  zone("S28", "역행 운반 회랑", "setpiece", "wide", 24, 4, "진행 반대 방향으로 움직이는 대형 운반대", "운반대 위를 달리거나 아래 보수 통로로 우회", "아래 통로는 느리지만 피해 없이 출구에 도달", "봉인 부품이 이제 원점 쪽이 아니라 바깥쪽으로 밀려난다."),
  zone("S29", "혼성 조립 경기장", "combat", "arena", 26, 4, "세 역할의 적과 높이 선택", "포탑 전원 차단·비행 적·방패 적의 처리 순서 선택", "엄폐물 세 곳, 동시 활성 적 최대 3체, 입구 후퇴 가능", "공명 명령이 서로 다른 관리체를 하나의 전투군으로 묶는다.", "방패 파수기·비행 파수기·고정 포탑"),
  zone("S30", "동부 휴식 승강고", "rest", "tall", 18, 1, "최종 층 전 회복·저장·목표 확인", "체력 회복과 기록 열람 순서 선택", "완전 안전 체크포인트와 즉시 승강기 재호출", "제련 수호자가 원점 신호를 가로막고 있음이 확인된다.", "없음", { checkpoint: true }),

  zone("S31", "고요한 근원 전실", "story", "wide", 12, 1, "보스 전 규칙과 약점 예고", "돌진 예고와 내려찍기 예고 중 먼저 확인할 표적 선택", "두 예고를 확인해야 열리는 안전 준비실이며 피해 요소 없음", "수호자는 코어리스를 기억하지만 침입자로 판정한다."),
  zone("S32", "수호자 외곽 고리", "combat", "arena", 28, 3, "보스의 두 핵심 공격을 약한 형태로 학습", "낮은 엄폐와 단일 점프 회피 중 선택", "피해 뒤 넓은 회복 창과 퇴장 가능한 입구", "외곽 방어체가 수호자의 공격 리듬을 전달한다.", "외곽 방어체 2체"),
  zone("S33", "제련 수호자 1막", "boss", "arena", 36, 5, "돌진·내려찍기 뒤 반격 창", "지상 거리 조절과 단일 점프 회피를 상황에 맞게 선택", "각 패턴 뒤 최소 1.2초 안전 반격 창", "수호자는 코어리스를 원점 폭주의 원인으로 기억한다.", "제련 수호자"),
  zone("S34", "제련 수호자 2막", "boss", "arena", 38, 5, "지형을 바꾸는 공명파와 약점 노출", "상층 발판을 유지하거나 아래 넓은 바닥으로 이동", "낙하 시 전투 바닥 복귀, 즉사 구덩이 없음", "수호자의 손상된 기록에서 코어 분리가 자발적이었다는 단서가 나온다.", "강화 제련 수호자"),
  zone("S35", "공명 회수실", "reward", "wide", 24, 1, "보상·회복·귀환 지름길 개방", "기억 기록과 다음 지역 지도 중 먼저 확인", "체크포인트·회복 장치·입구 귀환 승강기", "첫 수호자 기록이 다음 초대형 방의 냉각 수로를 가리킨다.", "없음", { checkpoint: true, unlock: "forge_access" }),
  zone("S36", "서부 전망 출구", "exit", "wide", 22, 1, "완주 경로 조망과 다음 목표 확인", "바로 나가거나 열린 지름길로 이전 층을 재탐색", "적과 피해 없는 출구 및 영구 지름길", "코어리스는 원점 코어까지 아직 열아홉 개의 거대 구역이 남았음을 본다."),
]);

export const FIRST_MEGA_ROOM_PLACEMENT = Object.freeze(
  FIRST_MEGA_ROOM_ZONES.map(item => {
    const tier = Math.floor((item.sequence - 1) / SCALE_CONTRACT.spacesPerTier) + 1;
    const indexInTier = (item.sequence - 1) % SCALE_CONTRACT.spacesPerTier;
    const direction = tier % 2 === 1 ? "east" : "west";
    const column = direction === "east"
      ? indexInTier + 1
      : SCALE_CONTRACT.spacesPerTier - indexInTier;
    return Object.freeze({
      id: item.id,
      tier,
      column,
      direction,
      connector: indexInTier === SCALE_CONTRACT.spacesPerTier - 1 && tier < SCALE_CONTRACT.tiersPerMegaRoom,
    });
  }),
);

const megaRoom = (number, act, name, skillRewards, enemyTier, climax, storyBeat) => Object.freeze({
  id: `M${String(number).padStart(2, "0")}`,
  number,
  act,
  name,
  spaces: 36,
  targetSeconds: 720,
  skillRewards: Object.freeze(skillRewards),
  enemyTier,
  climax,
  storyBeat,
});

export const MEGA_ROOM_CAMPAIGN = Object.freeze([
  megaRoom(1, 1, "빈 제련소", [], 1, "제련 수호자", "코어리스가 기본 몸의 반응을 되찾고 원점 코어의 신호를 처음 추적한다."),
  megaRoom(2, 1, "냉각 수로", ["공명 날개"], 1, "수문 탈출", "첫 신규 이동 기능을 되찾고 검은 공명이 시설 전체로 흐르고 있음을 확인한다."),
  megaRoom(3, 1, "유리 온실", ["벽면 고정각"], 1, "생체 온실체", "생체 잔재도 공명에 변형된다는 사실이 드러난다."),
  megaRoom(4, 1, "파수기 첨탑", [], 2, "첨탑 감독관", "원점으로 가는 첫 봉쇄망을 해제한다."),
  megaRoom(5, 2, "폐철도 심장부", ["맥동 대시"], 2, "폭주 기관차", "철수대의 마지막 이동 경로를 따라간다."),
  megaRoom(6, 2, "침수 정거장", ["연결사 집게"], 2, "수몰 추격", "코어리스가 시설 정비자였다는 기록을 얻는다."),
  megaRoom(7, 2, "공명 채석장", [], 2, "채굴 거신", "검은 공명이 원점에서 의도적으로 방출된 흔적을 찾는다."),
  megaRoom(8, 2, "봉인 기록고", ["기억 투시"], 3, "기록 감시자", "누군가의 명령이 아니라 코어리스의 명령으로 코어가 분리됐음을 암시한다."),
  megaRoom(9, 3, "유기 제련로", ["낙하 절단"], 3, "용광 생체체", "관리 기계와 생체 조직의 융합이 시작된다."),
  megaRoom(10, 3, "거울 저수지", ["공명 반격"], 3, "반사 수호자", "원점 코어가 코어리스의 기억을 되비춘다."),
  megaRoom(11, 3, "터빈 묘지", ["공중 대시"], 3, "폭풍 추격", "철수대가 원점 봉인에 실패한 이유를 확인한다."),
  megaRoom(12, 3, "기억 감옥", [], 4, "기억 간수", "코어리스가 폭주를 막기 위해 스스로 중심을 버렸음이 확정된다."),
  megaRoom(13, 4, "검은 주조소", ["공명 파쇄"], 4, "장갑 주조왕", "검은 공명이 기억을 먹어 방어체를 강화한다."),
  megaRoom(14, 4, "붕괴 도시", ["집게 회수 강화"], 4, "도시 붕괴 추격", "원점 방어가 주변 도시 구조까지 움직이기 시작한다."),
  megaRoom(15, 4, "방어 신경망", ["연속 대시"], 4, "신경망 핵", "모든 수호자가 원점 코어의 한 방어 의식임을 안다."),
  megaRoom(16, 4, "거짓 원점", [], 5, "가짜 코어", "코어리스가 파괴를 선택하도록 유도한 거짓 근원을 거부한다."),
  megaRoom(17, 5, "근원 접근로", [], 5, "다중 파수기 공성", "원점 코어가 외부 물체가 아니라 자신의 중심임을 확인한다."),
  megaRoom(18, 5, "방어 나선", [], 5, "나선 붕괴석", "근원의 자가 방어체가 지면 전체를 뒤틀기 시작한다."),
  megaRoom(19, 5, "수호자의 태내", [], 5, "근원 수호자 전초전", "제련소의 마지막 기억들과 수호자의 탄생 이유를 회수한다."),
  megaRoom(20, 5, "원점 코어", [], 5, "근원 수호자·최종 접속", "근원 수호자를 넘어 기억을 지우지 않은 채 검은 공명의 역류를 안정화한다."),
]);

export function validatePass01ScaleLayout() {
  const placements = new Map(FIRST_MEGA_ROOM_PLACEMENT.map(item => [item.id, item]));
  const totalSeconds = FIRST_MEGA_ROOM_ZONES.reduce((sum, item) => sum + item.targetSeconds, 0);
  const categories = new Set(FIRST_MEGA_ROOM_ZONES.map(item => item.category));
  const extents = FIRST_MEGA_ROOM_ZONES.map(item => SPACE_EXTENTS[item.extent]);
  const highIntensityRuns = [];
  let currentRun = 0;
  FIRST_MEGA_ROOM_ZONES.forEach(item => {
    currentRun = item.intensity >= 4 ? currentRun + 1 : 0;
    highIntensityRuns.push(currentRun);
  });
  const checks = [
    ["twentyMegaRooms", MEGA_ROOM_CAMPAIGN.length === 20],
    ["thirtySixSpacesPerMegaRoom", MEGA_ROOM_CAMPAIGN.every(item => item.spaces === 36)],
    ["campaignHasSevenHundredTwentySpaces", MEGA_ROOM_CAMPAIGN.reduce((sum, item) => sum + item.spaces, 0) === 720],
    ["campaignTargetsFourHours", MEGA_ROOM_CAMPAIGN.reduce((sum, item) => sum + item.targetSeconds, 0) === 14400],
    ["firstMegaRoomHasThirtySixSpaces", FIRST_MEGA_ROOM_ZONES.length === 36],
    ["sixTiers", new Set(FIRST_MEGA_ROOM_PLACEMENT.map(item => item.tier)).size === 6],
    ["sixSpacesPerTier", Array.from({ length: 6 }, (_, index) => FIRST_MEGA_ROOM_PLACEMENT.filter(item => item.tier === index + 1).length).every(count => count === 6)],
    ["twelveMinuteFirstRoom", totalSeconds === 720],
    ["twentySecondAverage", totalSeconds / FIRST_MEGA_ROOM_ZONES.length === 20],
    ["spacesNearTwoScreens", extents.every(item => item.screenAreas >= 2 && item.screenAreas <= 2.3)],
    ["zigzagDirectionsAlternate", Array.from({ length: 6 }, (_, index) => FIRST_MEGA_ROOM_PLACEMENT.find(item => item.tier === index + 1)?.direction).join(",") === "east,west,east,west,east,west"],
    ["routeColumnsAreContiguous", FIRST_MEGA_ROOM_PLACEMENT.every((item, index) => index === 0 || item.tier !== FIRST_MEGA_ROOM_PLACEMENT[index - 1].tier || Math.abs(item.column - FIRST_MEGA_ROOM_PLACEMENT[index - 1].column) === 1)],
    ["fiveAlternatingVerticalConnectors", FIRST_MEGA_ROOM_PLACEMENT.filter(item => item.connector).map(item => item.column).join(",") === "6,1,6,1,6"],
    ["allZonesHavePurpose", FIRST_MEGA_ROOM_ZONES.every(item => item.primaryMechanic.length >= 12)],
    ["allZonesHaveDecision", FIRST_MEGA_ROOM_ZONES.every(item => item.decision.length >= 15)],
    ["allZonesHaveRecovery", FIRST_MEGA_ROOM_ZONES.every(item => item.recovery.length >= 14)],
    ["allZonesAdvanceStory", FIRST_MEGA_ROOM_ZONES.every(item => item.storyBeat.length >= 15)],
    ["atLeastTenRoomCategories", categories.size >= 10],
    ["noThreeHighIntensitySpacesInRow", Math.max(...highIntensityRuns) <= 2],
    ["checkpointsAtEveryTierBoundary", ["S01", "S06", "S12", "S18", "S24", "S30", "S35"].every(id => FIRST_MEGA_ROOM_ZONES.find(item => item.id === id)?.checkpoint)],
    ["basicAttackIsAStartingAbility", STARTING_ABILITIES.includes("basic_attack")],
    ["firstMegaRoomHasNoSkillUnlock", FIRST_MEGA_ROOM_ZONES.every(item =>
      item.unlock === null || item.unlock === "forge_access")],
    ["firstMegaRoomCampaignRewardIsEmpty", MEGA_ROOM_CAMPAIGN[0].skillRewards.length === 0],
    ["skillAcquisitionBeginsInSecondMegaRoom", MEGA_ROOM_CAMPAIGN[1].skillRewards.length > 0],
    ["firstMegaRoomDoesNotRequireDoubleJump", FIRST_MEGA_ROOM_ZONES.every(item =>
      !`${item.primaryMechanic} ${item.decision} ${item.recovery}`.includes("이중 점프"))],
    ["noPreAttackEnemyFight", FIRST_MEGA_ROOM_ZONES.slice(0, 7).every(item => !["combat", "boss"].includes(item.category))],
    ["firstBossHasTwoReadablePhases", FIRST_MEGA_ROOM_ZONES.filter(item => item.category === "boss").length === 2],
    ["campaignActsCoverFourRoomsEach", Array.from({ length: 5 }, (_, index) => MEGA_ROOM_CAMPAIGN.filter(item => item.act === index + 1).length).every(count => count === 4)],
    ["enemyTiersNeverDecrease", MEGA_ROOM_CAMPAIGN.every((item, index) => index === 0 || item.enemyTier >= MEGA_ROOM_CAMPAIGN[index - 1].enemyTier)],
    ["skillsSpreadAcrossCampaign", MEGA_ROOM_CAMPAIGN.filter(item => item.skillRewards.length > 0).length >= 10],
    ["finalRoomIsOriginCore", MEGA_ROOM_CAMPAIGN.at(-1).name === "원점 코어"],
    ["finalRoomHasRootGuardian", MEGA_ROOM_CAMPAIGN.at(-1).climax.includes("근원 수호자")],
    ["everyCampaignRoomHasStoryBeat", MEGA_ROOM_CAMPAIGN.every(item => item.storyBeat.length >= 18)],
    ["placementIdsMatchZones", FIRST_MEGA_ROOM_ZONES.every(item => placements.has(item.id))],
    ["sequenceIsContinuous", FIRST_MEGA_ROOM_ZONES.every((item, index) => item.sequence === index + 1)],
    ["nominalWorldIsMassive", SCALE_CONTRACT.nominalWorld.width >= 12 * SCALE_CONTRACT.viewport.width && SCALE_CONTRACT.nominalWorld.height >= 8 * SCALE_CONTRACT.viewport.height],
    ["layoutBeforeFinalArt", PASS01_BUILD.finalArtIncluded === false],
    ["layoutBeforeRuntime", PASS01_BUILD.playableRuntimeIncluded === false],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements: Object.freeze({
      megaRooms: MEGA_ROOM_CAMPAIGN.length,
      spacesPerMegaRoom: FIRST_MEGA_ROOM_ZONES.length,
      campaignSpaces: MEGA_ROOM_CAMPAIGN.reduce((sum, item) => sum + item.spaces, 0),
      firstMegaRoomSeconds: totalSeconds,
      campaignSeconds: MEGA_ROOM_CAMPAIGN.reduce((sum, item) => sum + item.targetSeconds, 0),
      averageSpaceSeconds: totalSeconds / FIRST_MEGA_ROOM_ZONES.length,
      tiers: new Set(FIRST_MEGA_ROOM_PLACEMENT.map(item => item.tier)).size,
      categories: categories.size,
      checkpoints: FIRST_MEGA_ROOM_ZONES.filter(item => item.checkpoint).length,
      nominalWorldWidth: SCALE_CONTRACT.nominalWorld.width,
      nominalWorldHeight: SCALE_CONTRACT.nominalWorld.height,
    }),
  });
}
