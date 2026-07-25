export const ROOM_WIDTH = 1600;
export const ROOM_HEIGHT = 900;
export const COLUMN_GAP = 180;
export const TIER_GAP = 240;

const room = (id, order, tier, column, name, role, direction, mechanic, structures, enemies = [], checkpoint = false) =>
  Object.freeze({
    id,
    order,
    tier,
    column,
    name,
    role,
    direction,
    mechanic,
    structures: Object.freeze(structures),
    enemies: Object.freeze(enemies),
    checkpoint,
    bounds: Object.freeze({
      x: column * (ROOM_WIDTH + COLUMN_GAP),
      y: (4 - tier) * (ROOM_HEIGHT + TIER_GAP),
      width: ROOM_WIDTH,
      height: ROOM_HEIGHT,
    }),
  });

export const ROOMS = Object.freeze([
  room("r01", 1, 0, 0, "도착 전실", "safe_tutorial", "east", "move_and_jump",
    ["넓은 안전 바닥", "낮은 연습 단차", "입구 회귀 방지문", "휴식 등불"], [], true),
  room("r02", 2, 0, 1, "도약 공방", "tutorial", "east", "variable_jump",
    ["높이가 다른 세 발판", "천장 높이 비교 통로", "안전 낙하 웅덩이", "선택 보상 선반"]),
  room("r03", 3, 0, 2, "공명 날개 제단", "ability_room", "east", "double_jump",
    ["이중 점프 제단", "두 단계 상승벽", "착지 회복대", "동쪽 승강기"], [], true),
  room("r04", 4, 1, 2, "완경사 회랑", "traversal", "west", "slope_control",
    ["완만한 오르막", "짧은 내리막", "경사 정지대", "아래층 관찰창"], ["crawler"]),
  room("r05", 5, 1, 1, "진자 집게실", "traversal", "west", "grapple_release",
    ["천장 집게 레일", "세 개의 안전 착지대", "낮은 위험 바닥", "재도전 사다리"], ["flying_sentry"]),
  room("r06", 6, 1, 0, "대시 수문", "ability_test", "west", "dash_timing",
    ["간헐 수문 두 개", "대시 통과창", "실패 회수 통로", "서쪽 상승축"], [], true),
  room("r07", 7, 2, 0, "쌍벽 상승축", "vertical_traversal", "east", "wall_jump",
    ["폭이 일정한 쌍벽", "중간 휴식 홈", "낙하 회수 발판", "상단 출구턱"], ["hanging_ambusher"]),
  room("r08", 8, 2, 1, "파수꾼 조립실", "combat", "east", "arena_combat",
    ["낮은 엄폐벽", "상·하단 전투 발코니", "파괴 가능한 상자벽", "전투 종료문"],
    ["armored_guard", "flying_sentry", "crawler"], true),
  room("r09", 9, 2, 2, "심연 교량", "set_piece", "east", "bridge_crossing",
    ["세 구간 교량", "화면 아래로 이어지는 교각", "무너지는 중앙판", "우측 상승기"], ["ranged_turret"]),
  room("r10", 10, 3, 2, "압착 주조실", "hazard", "west", "crusher_timing",
    ["예고등 압착기 세 개", "안전 대기 홈", "상부 우회 선반", "재시작 발판"], ["crawler"]),
  room("r11", 11, 3, 1, "균형 승강고", "traversal", "west", "moving_platforms",
    ["균형추 승강기", "교차 이동 발판", "고정 안전대", "아래층 지름길 레버"], ["ranged_turret"], true),
  room("r12", 12, 3, 0, "회귀 집게실", "mastery", "west", "grapple_dash_combo",
    ["서로 다른 길이의 집게 두 개", "대시 착지창", "파괴 가능한 옆방", "서쪽 상승축"],
    ["flying_sentry", "hanging_ambusher"]),
  room("r13", 13, 4, 0, "추격 전실", "recovery", "east", "chase_warning",
    ["넓은 준비 바닥", "추격 경고문", "최종 체크포인트", "회복 샘"], [], true),
  room("r14", 14, 4, 1, "붕괴석 추격로", "chase", "east", "grounded_boulder_chase",
    ["연속 접지 경사", "짧은 점프턱", "파괴 지지대", "추격 종료 차단문"]),
  room("r15", 15, 4, 2, "상승 관문", "exit", "east", "guardian_and_exit",
    ["다층 출구대", "수호자 원형대", "완주 지름길 레버", "최종 광문"], ["room_guardian"], true),
]);

export const MAIN_ROUTE = Object.freeze(ROOMS.map(({ id }) => id));

export const ROUTE_LINKS = Object.freeze(ROOMS.slice(0, -1).map((from, index) => {
  const to = ROOMS[index + 1];
  const isAscent = from.tier !== to.tier;
  return Object.freeze({
    from: from.id,
    to: to.id,
    type: isAscent ? "ascent" : "room_door",
    side: isAscent ? (from.column === 2 ? "east" : "west") : from.direction,
  });
}));

export const OPTIONAL_ALCOVES = Object.freeze([
  Object.freeze({ id: "a01", parent: "r02", reward: "movement_lore", access: "precision_jump" }),
  Object.freeze({ id: "a02", parent: "r08", reward: "health_fragment", access: "breakable_wall" }),
  Object.freeze({ id: "a03", parent: "r12", reward: "chase_preview", access: "grapple_dash" }),
]);

export const UNLOCKABLE_SHORTCUTS = Object.freeze([
  Object.freeze({ id: "s01", from: "r05", to: "r08", unlockFrom: "r08" }),
  Object.freeze({ id: "s02", from: "r09", to: "r11", unlockFrom: "r11" }),
  Object.freeze({ id: "s03", from: "r13", to: "r15", unlockFrom: "r15" }),
]);

export const PASS01_TARGETS = Object.freeze({
  tiers: 5,
  roomsPerTier: 3,
  mainRooms: 15,
  optionalAlcoves: 3,
  shortcuts: 3,
  checkpoints: 7,
  minimumStructureFamilies: 12,
  criticalPathShape: "east-west alternating ascent",
  finalArtIncluded: false,
});
