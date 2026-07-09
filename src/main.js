const canvas = document.getElementById("gameCanvas");

if (!canvas) {
  throw new Error("gameCanvas 요소를 찾을 수 없습니다.");
}

const ctx = canvas.getContext("2d");

// v56: 13단계-2 1차 제작 보강. 튜토리얼 소형 방, 카메라 기믹, 초대형 방 체크포인트 추가

if (canvas.width < 900) {
  canvas.width = 900;
}

if (canvas.height < 520) {
  canvas.height = 520;
}

const keys = {};
let frameCount = 0;
let hitStopTimer = 0;
let screenShakeTimer = 0;
let screenShakeMaxTimer = 0;
let screenShakePower = 0;

const particles = [];
const projectiles = [];
const shardWarnings = [];
const floatingTexts = [];

const world = {
  width: 44000,
  height: 8200
};

const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  shakeX: 0,
  shakeY: 0,
  bossFocusTimer: 0,

  // v44: 캐릭터 중앙 고정 카메라. 방향 전환용 look-ahead를 제거해 카메라 튐을 줄임
  smoothnessX: 0.18,
  smoothnessY: 0.12,
  snapDistanceX: 260,
  snapDistanceY: 180,
  currentLookAheadX: 0,
  currentLookDownY: 0
};

const gravity = 0.65;
const startPosition = { x: 90, y: 540 };

const player = {
  x: startPosition.x,
  y: startPosition.y,
  width: 32,
  height: 48,
  vx: 0,
  vy: 0,

  // v44: 방향 전환 시 먼저 감속한 뒤 반대 방향으로 가속되도록 조정
  groundAcceleration: 0.54,
  airAcceleration: 0.30,
  groundDeceleration: 0.56,
  airDeceleration: 0.26,
  turnDeceleration: 0.78,
  turnThreshold: 0.72,
  groundFriction: 0.89,
  airFriction: 0.965,
  maxSpeed: 6.05,
  maxAirSpeed: 5.35,

  jumpPower: -13.1,
  onGround: false,
  wasOnGround: false,
  maxFallSpeed: 16,
  fallGravityMultiplier: 1.15,
  jumpCutMultiplier: 0.45,
  jumpBufferTimer: 0,
  jumpBufferMax: 8,
  coyoteTimer: 0,
  coyoteMax: 8,

  hasDoubleJump: false,
  canDoubleJump: false,
  doubleJumpUsed: false,

  // 11단계-3: 벽 미끄러짐과 벽 점프
  hasWallJump: true,
  isWallSliding: false,
  wallDirection: 0,
  wallSlideSpeed: 2.2,
  wallJumpPowerX: 8.0,
  wallJumpPowerY: -12.6,
  wallJumpLockTimer: 0,
  wallJumpLockMax: 12,

  facing: 1,

  isDashing: false,
  dashTimer: 0,
  dashDuration: 10,
  dashSpeed: 12.8,
  dashCooldown: 0,
  dashCooldownMax: 110,
  dashInvincibleTimer: 0,
  dashInvincibleMax: 14,
  dashEndLagTimer: 0,
  dashEndLagMax: 4,

  attackDirection: "side",
  attackRecoilX: 1.8,
  attackPogoPower: -9.5,
  attackFloatTimer: 0,

  maxHealth: 5,
  health: 5,
  invincibleTimer: 0,

  coreEnergy: 0,
  maxCoreEnergy: 6,
  healCost: 3,
  healTimer: 0,
  healDuration: 55,
  healingWillRestore: false,

  attackTimer: 0,
  attackDuration: 13,
  attackCooldown: 0,
  attackCooldownMax: 22,
  attackId: 0,
  lastWallSparkAttackId: -1
};

const playerAnimation = {
  state: "idle",
  previousState: "idle",
  stateFrame: 0
};

const characterVisuals = {
  idle: { name: "정지", bobSpeed: 0.08, bobAmount: 0.7, bodyTop: 18, leftBottom: 1, rightBottom: 31, centerBottom: 16, headY: 0, coreRadius: 4, coreColor: "#7dd3fc", shadowWidth: 16 },
  walk: { name: "걷기", bobSpeed: 0.25, bobAmount: 1.7, bodyTop: 18, leftBottom: 1, rightBottom: 31, centerBottom: 16, headY: 0, coreRadius: 4, coreColor: "#7dd3fc", shadowWidth: 17 },
  jump: { name: "점프", bobSpeed: 0, bobAmount: 0, bodyTop: 19, leftBottom: 4, rightBottom: 28, centerBottom: 16, headY: -2, coreRadius: 4, coreColor: "#7dd3fc", shadowWidth: 12 },
  fall: { name: "낙하", bobSpeed: 0, bobAmount: 0, bodyTop: 17, leftBottom: -1, rightBottom: 33, centerBottom: 16, headY: 2, coreRadius: 4, coreColor: "#7dd3fc", shadowWidth: 20 },
  wallSlide: { name: "벽 미끄러짐", bobSpeed: 0, bobAmount: 0, bodyTop: 17, leftBottom: 0, rightBottom: 32, centerBottom: 16, headY: 1, coreRadius: 4, coreColor: "#a7f3d0", shadowWidth: 18 },
  dash: { name: "대시", bobSpeed: 0, bobAmount: 0, bodyTop: 17, leftBottom: 1, rightBottom: 31, centerBottom: 16, headY: 0, coreRadius: 5, coreColor: "#fef08a", shadowWidth: 24 },
  attack: { name: "공격", bobSpeed: 0, bobAmount: 0, bodyTop: 18, leftBottom: 2, rightBottom: 30, centerBottom: 16, headY: 0, coreRadius: 5, coreColor: "#e0f2fe", shadowWidth: 19 },
  heal: { name: "회복", bobSpeed: 0.12, bobAmount: 0.5, bodyTop: 18, leftBottom: 2, rightBottom: 30, centerBottom: 16, headY: -1, coreRadius: 6, coreColor: "#86efac", shadowWidth: 18 }
};

const gameState = {
  hasKey: false,
  memoryFragments: 0,
  memoryCores: 0,
  originCores: 0,
  bossFightStarted: false,
  bossRoomLocked: false,
  bossDefeated: false,
  bossClearEffectTimer: 0,
  bossPhaseBannerTimer: 0,
  bossStartBannerTimer: 0,
  endingReached: false,
  endingFrame: 0,
  endingInputUnlocked: false,
  message: "13단계-2 v56 1차 보강 수정: 무빙 속도 회복, 바닥형 표지판 가시성 개선, 체크포인트를 유지했습니다.",
  hiddenRewards: 0
};


const checkpoints = [
  { id: "tutorial_start", name: "튜토리얼 시작점", x: 110, y: 620, width: 34, height: 58, spawnX: 90, spawnY: 540, activated: true, roomId: "tutorial_zone_blockout" },
  { id: "entry_cliff_cp", name: "진입 절벽 체크포인트", x: 8720, y: 1018, width: 36, height: 62, spawnX: 8660, spawnY: 990, activated: false, roomId: "entry_cliff_blockout" },
  { id: "central_cavern_cp", name: "중앙 대공동 체크포인트", x: 13680, y: 1236, width: 36, height: 62, spawnX: 13620, spawnY: 1210, activated: false, roomId: "central_cavern_blockout" },
  { id: "lower_ruins_cp", name: "하층 폐허 체크포인트", x: 21680, y: 2436, width: 36, height: 62, spawnX: 21620, spawnY: 2410, activated: false, roomId: "lower_ruins_blockout" },
  { id: "long_corridor_cp", name: "긴 폐허 회랑 체크포인트", x: 27680, y: 1116, width: 36, height: 62, spawnX: 27620, spawnY: 1090, activated: false, roomId: "long_ruin_corridor_blockout" },
  { id: "vertical_ascent_cp", name: "세로 상승 폐허 체크포인트", x: 34200, y: 4036, width: 36, height: 62, spawnX: 34140, spawnY: 4010, activated: false, roomId: "vertical_ascent_blockout" },
  { id: "sealed_gate_cp", name: "봉인 관문 체크포인트", x: 39180, y: 1116, width: 36, height: 62, spawnX: 39120, spawnY: 1090, activated: false, roomId: "sealed_gate_blockout" }
];

let activeCheckpoint = checkpoints[0];

const endingLines = [
  "나는 비어 있던 코어의 흔적을 따라 이곳까지 왔다.",
  "기억 조각은 흩어진 나의 기록이었고,",
  "기억 핵은 잃어버린 중심으로 향하는 열쇠였다.",
  "원점 코어가 깨어나며 멈춰 있던 세계가 다시 움직이기 시작한다.",
  "Coreless.",
  "중심을 잃은 존재가 다시 자신의 원점을 찾는 이야기."
];

const roomBlueprints = [
  {
    id: "tutorial_zone_blockout",
    name: "튜토리얼 구역 - 기능 학습 복도",
    guide: "좁은 방 여러 개로 나눌 예정인 튜토리얼 구역. 이번 v56에서는 전체 위치와 길이만 먼저 잡는다.",
    role: "tutorial_zone_blockout",
    bounds: { x: 0, y: 0, width: 8500, height: 8200 },
    cameraBounds: { x: 0, y: 0, width: 8500, height: 1600 },
    color: "#111827",
    requiredAbilities: [],
    mainPath: "이동, 점프, 공격, 대시, 벽 점프, 아래 공격 튕김을 각각 작은 방에서 배우도록 분리할 예정. 이번 단계는 전체 구간 길이와 기본 바닥만 확정한다.",
    connections: { right: "entry_cliff_blockout" },
    tags: ["tutorial", "blockout", "signs_later", "separated_rooms_later"]
  },
  {
    id: "entry_cliff_blockout",
    name: "지역 1-1: 진입 절벽",
    guide: "튜토리얼 직후 처음 만나는 초대형 방. 갑자기 공간이 넓어졌다는 인상을 주기 위한 첫 진입 구간이다.",
    role: "mega_room_1_entry_cliff",
    bounds: { x: 8500, y: 0, width: 5000, height: 8200 },
    cameraBounds: { x: 8500, y: 0, width: 5000, height: 3600 },
    color: "#142033",
    requiredAbilities: [],
    mainPath: "넓은 바닥, 높은 벽, 위쪽에 보이는 보상 공간, 아래쪽이 아닌 옆쪽으로 이어지는 안정적 진입 흐름을 만든다.",
    connections: { left: "tutorial_zone_blockout", right: "central_cavern_blockout" },
    tags: ["first_area", "mega_room", "entry", "vertical_hint"]
  },
  {
    id: "central_cavern_blockout",
    name: "지역 1-2: 중앙 대공동",
    guide: "첫 번째 지역의 핵심 허브. 상층, 중층, 하층 흐름이 한 방 안에서 보이는 가장 큰 공간이다.",
    role: "mega_room_2_main_hub",
    bounds: { x: 13500, y: 0, width: 8000, height: 8200 },
    cameraBounds: { x: 13500, y: 0, width: 8000, height: 6200 },
    color: "#172033",
    requiredAbilities: ["dash"],
    mainPath: "주 진행로는 중층으로 두고, 상층 보상 루트와 하층 선택 루트가 한눈에 느껴지도록 공간만 크게 잡는다.",
    connections: { left: "entry_cliff_blockout", right: "lower_ruins_blockout", up: "vertical_ascent_blockout" },
    tags: ["first_area", "mega_room", "hub", "multi_layer", "blockout"]
  },
  {
    id: "lower_ruins_blockout",
    name: "지역 1-3: 하층 폐허",
    guide: "구멍으로 강제 낙하하지 않고, 플레이어가 직접 선택해서 내려가는 하층 탐험 구역이다.",
    role: "mega_room_3_lower_ruins",
    bounds: { x: 21500, y: 0, width: 6000, height: 8200 },
    cameraBounds: { x: 21500, y: 1800, width: 6000, height: 5200 },
    color: "#0f1f1f",
    requiredAbilities: [],
    mainPath: "낮은 천장과 넓은 하층 바닥을 중심으로, 나중에 위험하지만 보상이 있는 구간으로 다듬는다.",
    connections: { left: "central_cavern_blockout", right: "long_ruin_corridor_blockout" },
    tags: ["first_area", "mega_room", "lower_route", "optional_descent", "no_forced_pit"]
  },
  {
    id: "long_ruin_corridor_blockout",
    name: "지역 1-4: 긴 폐허 회랑",
    guide: "가로로 긴 방이지만 단순 평지가 되지 않도록, 위아래 단차와 우회 발판을 넣을 예정인 주 진행로이다.",
    role: "mega_room_4_horizontal_complexity",
    bounds: { x: 27500, y: 0, width: 6500, height: 8200 },
    cameraBounds: { x: 27500, y: 0, width: 6500, height: 4200 },
    color: "#191c2b",
    requiredAbilities: [],
    mainPath: "가로 진행 속에 낮은 천장, 높은 천장, 위쪽 우회로, 아래쪽 보상 틈을 넣기 위한 초안 공간이다.",
    connections: { left: "lower_ruins_blockout", right: "vertical_ascent_blockout" },
    tags: ["first_area", "mega_room", "horizontal", "route_variation"]
  },
  {
    id: "vertical_ascent_blockout",
    name: "지역 1-5: 세로 상승 폐허",
    guide: "세로로 긴 맵에서 위로 복잡하게 올라가는 핵심 구역. 벽타기 기둥 난사가 아니라 큰 지형 자체를 타고 오르는 방향으로 만든다.",
    role: "mega_room_5_vertical_ascent",
    bounds: { x: 34000, y: 0, width: 5000, height: 8200 },
    cameraBounds: { x: 34000, y: 0, width: 5000, height: 8200 },
    color: "#211b33",
    requiredAbilities: ["wallJump", "doubleJump"],
    mainPath: "높은 좌우 벽, 중간 쉼터, 파인 착지 공간, 대각선 상승 루트가 들어갈 초대형 세로 방이다.",
    connections: { left: "long_ruin_corridor_blockout", right: "sealed_gate_blockout" },
    tags: ["first_area", "mega_room", "vertical", "ascent", "dynamic_space"]
  },
  {
    id: "sealed_gate_blockout",
    name: "지역 1-6: 봉인 관문",
    guide: "첫 번째 지역의 끝이자 두 번째 지역 입구를 예고하는 초대형 마무리 방이다.",
    role: "mega_room_6_next_region_gate",
    bounds: { x: 39000, y: 0, width: 5000, height: 8200 },
    cameraBounds: { x: 39000, y: 0, width: 5000, height: 4200 },
    color: "#241a1a",
    requiredAbilities: ["futureAbility"],
    mainPath: "큰 봉인문과 넓은 마지막 공간을 배치하고, 두 번째 지역은 아직 열지 않는다.",
    connections: { left: "vertical_ascent_blockout" },
    tags: ["first_area", "mega_room", "gate", "future_region"]
  }
]

const rooms = roomBlueprints.map(function(room) {
  return {
    id: room.id,
    name: room.name,
    guide: room.guide,
    role: room.role,
    x: room.bounds.x,
    y: room.bounds.y,
    width: room.bounds.width,
    height: room.bounds.height,
    color: room.color,
    cameraBounds: room.cameraBounds,
    requiredAbilities: room.requiredAbilities,
    connections: room.connections,
    tags: room.tags
  };
});


const tutorialRooms = [
  { id: "tutorial_move_room", title: "튜토리얼 1: 이동", x: 0, y: 240, width: 900, height: 560, cameraMode: "fixed", cameraX: 0, cameraY: 260, signTitle: "A / D : 이동", signLines: ["왼쪽과 오른쪽으로 움직입니다.", "첫 방은 화면을 고정해 조작에만 집중합니다."] },
  { id: "tutorial_jump_room", title: "튜토리얼 2: 점프", x: 900, y: 240, width: 900, height: 560, cameraMode: "fixed", cameraX: 900, cameraY: 260, signTitle: "Space : 점프", signLines: ["짧게 누르면 낮게, 길게 누르면 높게 뜁니다.", "낮은 발판을 밟으며 감각을 익힙니다."] },
  { id: "tutorial_attack_room", title: "튜토리얼 3: 공격", x: 1800, y: 240, width: 900, height: 560, cameraMode: "fixed", cameraX: 1800, cameraY: 260, signTitle: "J : 공격", signLines: ["앞의 약한 적을 공격합니다.", "W+J는 위 공격입니다."] },
  { id: "tutorial_dash_room", title: "튜토리얼 4: 대시", x: 2700, y: 220, width: 1800, height: 600, cameraMode: "follow", cameraY: 250, signTitle: "Shift / K : 대시", signLines: ["화면 두 개 길이의 방입니다.", "카메라가 따라오며 긴 공간 이동을 익힙니다."] },
  { id: "tutorial_wall_room", title: "튜토리얼 5: 벽 점프", x: 4500, y: 160, width: 1800, height: 860, cameraMode: "follow", cameraY: 120, signTitle: "벽 + Space : 벽 점프", signLines: ["벽에 붙은 뒤 Space를 누르면 반대 방향으로 튑니다.", "기둥 난사가 아니라 짧은 세로 훈련 방으로 제한합니다."] },
  { id: "tutorial_pogo_room", title: "튜토리얼 6: 아래 공격 튕김", x: 6300, y: 220, width: 1600, height: 640, cameraMode: "follow", cameraY: 240, signTitle: "공중 S + J : 아래 공격", signLines: ["아래 대상을 공격하면 위로 튕겨 오릅니다.", "첫 지역의 상층 탐험 전에 필요한 감각입니다."] },
  { id: "tutorial_exit_room", title: "튜토리얼 7: 첫 지역 진입", x: 7900, y: 240, width: 600, height: 560, cameraMode: "fixed", cameraX: 7600, cameraY: 260, signTitle: "튜토리얼 종료", signLines: ["이후부터는 초대형 방 6개로 이루어진 첫 번째 지역입니다.", "각 초대형 방에는 체크포인트가 있습니다."] }
];

const tutorialRoomFrames = tutorialRooms.map(function(room) {
  return { x: room.x, y: room.y, width: room.width, height: room.height, mode: room.cameraMode, title: room.title };
});

const tutorialSigns = tutorialRooms.map(function(room) {
  const signWidth = Math.min(540, room.width - 150);
  const signHeight = 128;
  return {
    x: room.x + 80,
    y: room.y + room.height - 230,
    width: signWidth,
    height: signHeight,
    title: room.signTitle,
    lines: room.signLines,
    roomId: room.id
  };
});

const platforms = [
  // 13-2-1 v56: 전체 블록아웃. 세부 장식보다 튜토리얼 구역과 초대형 방 6개의 큰 뼈대를 먼저 확정한다.
  // 튜토리얼 구역: 이후 v57에서 표지판과 작은 기능별 방으로 세분화 예정
  { x: 0, y: 680, width: 1200, height: 110, area: "tutorial_move_room" },
  { x: 1200, y: 680, width: 1200, height: 110, area: "tutorial_jump_room" },
  { x: 2400, y: 680, width: 1200, height: 110, area: "tutorial_attack_room" },
  { x: 3600, y: 680, width: 1200, height: 110, area: "tutorial_dash_room" },
  { x: 4800, y: 680, width: 1200, height: 110, area: "tutorial_wall_room" },
  { x: 6000, y: 680, width: 1250, height: 110, area: "tutorial_down_attack_room" },
  { x: 7250, y: 680, width: 1250, height: 110, area: "tutorial_exit_room" },
  { x: 1500, y: 555, width: 260, height: 28, area: "tutorial_jump_hint" },
  { x: 1900, y: 500, width: 260, height: 28, area: "tutorial_jump_hint" },
  { x: 3900, y: 565, width: 340, height: 28, area: "tutorial_dash_hint" },
  { x: 5150, y: 560, width: 260, height: 30, area: "tutorial_wall_hint" },
  { x: 5560, y: 495, width: 260, height: 30, area: "tutorial_wall_hint" },
  { x: 6420, y: 555, width: 300, height: 28, area: "tutorial_pogo_hint" },

  // 초대형 방 1: 진입 절벽. 넓은 세계로 들어오는 감각을 주는 기본 골격
  { x: 8500, y: 1080, width: 1100, height: 120, area: "entry_cliff_floor" },
  { x: 9600, y: 1080, width: 1000, height: 120, area: "entry_cliff_floor" },
  { x: 10600, y: 1080, width: 1100, height: 120, area: "entry_cliff_floor" },
  { x: 11700, y: 1080, width: 900, height: 120, area: "entry_cliff_floor" },
  { x: 12450, y: 930, width: 720, height: 70, area: "entry_cliff_rise" },
  { x: 8900, y: 820, width: 520, height: 46, area: "entry_cliff_upper_visible" },
  { x: 9650, y: 650, width: 480, height: 46, area: "entry_cliff_upper_visible" },
  { x: 10450, y: 500, width: 460, height: 46, area: "entry_cliff_upper_visible", secretRoute: "진입 절벽 상층 보상 후보" },

  // 초대형 방 2: 중앙 대공동. 첫 지역의 허브가 될 가장 큰 공간의 기본 골격
  { x: 13500, y: 1300, width: 1300, height: 130, area: "central_cavern_main_floor" },
  { x: 14800, y: 1300, width: 1300, height: 130, area: "central_cavern_main_floor" },
  { x: 16100, y: 1300, width: 1300, height: 130, area: "central_cavern_main_floor" },
  { x: 17400, y: 1300, width: 1300, height: 130, area: "central_cavern_main_floor" },
  { x: 18700, y: 1300, width: 1300, height: 130, area: "central_cavern_main_floor" },
  { x: 20000, y: 1300, width: 1500, height: 130, area: "central_cavern_main_floor" },
  { x: 13900, y: 1080, width: 520, height: 50, area: "central_cavern_mid_shelf" },
  { x: 14880, y: 930, width: 520, height: 50, area: "central_cavern_mid_shelf" },
  { x: 15960, y: 810, width: 560, height: 50, area: "central_cavern_mid_shelf" },
  { x: 17150, y: 720, width: 560, height: 50, area: "central_cavern_upper_hint" },
  { x: 18400, y: 610, width: 560, height: 50, area: "central_cavern_upper_hint", requiresDoubleJump: true },
  { x: 19700, y: 520, width: 600, height: 50, area: "central_cavern_upper_hint", requiresDoubleJump: true, secretRoute: "중앙 대공동 상층 보상 후보" },
  { x: 14400, y: 1900, width: 1150, height: 110, area: "central_cavern_lower_preview" },
  { x: 16050, y: 2100, width: 1100, height: 110, area: "central_cavern_lower_preview" },
  { x: 17850, y: 1950, width: 1250, height: 110, area: "central_cavern_lower_preview" },

  // 초대형 방 3: 하층 폐허. 강제 낙하가 아니라 선택적으로 내려가는 넓은 하층 골격
  { x: 21500, y: 2500, width: 1200, height: 130, area: "lower_ruins_floor" },
  { x: 22700, y: 2500, width: 1200, height: 130, area: "lower_ruins_floor" },
  { x: 23900, y: 2500, width: 1200, height: 130, area: "lower_ruins_floor" },
  { x: 25100, y: 2500, width: 1200, height: 130, area: "lower_ruins_floor" },
  { x: 26300, y: 2500, width: 1200, height: 130, area: "lower_ruins_floor" },
  { x: 21850, y: 2260, width: 520, height: 54, area: "lower_ruins_shelf" },
  { x: 22950, y: 2140, width: 560, height: 54, area: "lower_ruins_shelf" },
  { x: 24200, y: 2220, width: 560, height: 54, area: "lower_ruins_shelf" },
  { x: 25550, y: 2060, width: 600, height: 54, area: "lower_ruins_shelf", secretRoute: "하층 폐허 보상 후보" },

  // 초대형 방 4: 긴 폐허 회랑. 가로로 길지만 높낮이 변화가 들어갈 기본 골격
  { x: 27500, y: 1180, width: 1300, height: 120, area: "long_corridor_floor" },
  { x: 28800, y: 1240, width: 1300, height: 120, area: "long_corridor_floor" },
  { x: 30100, y: 1100, width: 1300, height: 120, area: "long_corridor_floor" },
  { x: 31400, y: 1200, width: 1300, height: 120, area: "long_corridor_floor" },
  { x: 32700, y: 1120, width: 1300, height: 120, area: "long_corridor_floor" },
  { x: 28100, y: 940, width: 560, height: 50, area: "long_corridor_upper_bypass" },
  { x: 29250, y: 830, width: 560, height: 50, area: "long_corridor_upper_bypass" },
  { x: 30500, y: 760, width: 580, height: 50, area: "long_corridor_upper_bypass" },
  { x: 31850, y: 900, width: 600, height: 50, area: "long_corridor_upper_bypass", secretRoute: "긴 회랑 상층 보상 후보" },

  // 초대형 방 5: 세로 상승 폐허. 이후 복잡한 상승 구조를 만들기 위한 큰 벽과 쉼터 골격
  { x: 34000, y: 4100, width: 1000, height: 140, area: "vertical_ascent_base" },
  { x: 35000, y: 4100, width: 950, height: 140, area: "vertical_ascent_base" },
  { x: 35950, y: 4100, width: 1050, height: 140, area: "vertical_ascent_base" },
  { x: 37000, y: 4100, width: 1000, height: 140, area: "vertical_ascent_base" },
  { x: 38000, y: 4100, width: 1000, height: 140, area: "vertical_ascent_base" },
  { x: 34300, y: 3550, width: 620, height: 58, area: "vertical_ascent_shelf" },
  { x: 35200, y: 3160, width: 620, height: 58, area: "vertical_ascent_shelf" },
  { x: 36200, y: 2740, width: 640, height: 58, area: "vertical_ascent_shelf" },
  { x: 37300, y: 2320, width: 650, height: 58, area: "vertical_ascent_shelf" },
  { x: 35700, y: 1900, width: 600, height: 58, area: "vertical_ascent_shelf", requiresDoubleJump: true },
  { x: 34600, y: 1500, width: 620, height: 58, area: "vertical_ascent_shelf", requiresDoubleJump: true, secretRoute: "세로 상승 상층 보상 후보" },
  { x: 38100, y: 1120, width: 620, height: 58, area: "vertical_ascent_top_exit", requiresDoubleJump: true },

  // 초대형 방 6: 봉인 관문. 두 번째 지역을 예고하는 마무리 공간
  { x: 39000, y: 1180, width: 1200, height: 130, area: "sealed_gate_floor" },
  { x: 40200, y: 1180, width: 1200, height: 130, area: "sealed_gate_floor" },
  { x: 41400, y: 1180, width: 1200, height: 130, area: "sealed_gate_floor" },
  { x: 42600, y: 1180, width: 1400, height: 130, area: "sealed_gate_floor" },
  { x: 39800, y: 930, width: 560, height: 54, area: "sealed_gate_overlook" },
  { x: 40950, y: 800, width: 580, height: 54, area: "sealed_gate_overlook" },
  { x: 42250, y: 680, width: 620, height: 54, area: "sealed_gate_overlook", secretRoute: "봉인 관문 전망대 후보" }
];

const doors = [
  { x: 8460, y: 500, width: 44, height: 300, text: "진입 절벽", locked: false, open: true },
  { x: 13460, y: 850, width: 44, height: 360, text: "중앙 대공동", locked: false, open: true },
  { x: 21460, y: 2180, width: 44, height: 360, text: "하층 폐허", locked: false, open: true },
  { x: 27460, y: 900, width: 44, height: 360, text: "긴 폐허 회랑", locked: false, open: true },
  { x: 33960, y: 3650, width: 44, height: 420, text: "세로 상승 폐허", locked: false, open: true },
  { x: 38960, y: 820, width: 44, height: 420, text: "봉인 관문", locked: false, open: true },
  { x: 43380, y: 660, width: 80, height: 560, text: "두 번째 지역", locked: true, open: false, requiresMemoryCores: 1 }
];

const bossArenaGates = [];

const keyItem = { x: 42300, y: 640, width: 24, height: 24, collected: false };
const abilityItems = [
  { type: "doubleJump", name: "이중 점프", x: 15020, y: 892, width: 28, height: 28, collected: false }
];
const rewardItems = [
  { type: "memoryFragment", name: "진입 절벽 상층 기억 조각", x: 10495, y: 462, width: 24, height: 24, collected: false, hiddenReward: true },
  { type: "memoryFragment", name: "중앙 대공동 상층 기억 조각", x: 19750, y: 482, width: 24, height: 24, collected: false, hiddenReward: true },
  { type: "coreCapacity", name: "하층 폐허 코어 용량", x: 25600, y: 2022, width: 26, height: 26, collected: false, hiddenReward: true },
  { type: "memoryFragment", name: "긴 회랑 상층 기억 조각", x: 31920, y: 862, width: 24, height: 24, collected: false, hiddenReward: true },
  { type: "healthCore", name: "세로 상승 체력 코어", x: 34650, y: 1462, width: 26, height: 26, collected: false, hiddenReward: true },
  { type: "memoryFragment", name: "봉인 관문 전망대 기억 조각", x: 42310, y: 642, width: 24, height: 24, collected: false, hiddenReward: true }
];

const dashHazards = [];

const enemies = [
  createMeleeEnemy("튜토리얼 그림자", 2850, 644, 32, 34, 2450, 3400, 1.0, 2, 68, 100),
  createMeleeEnemy("진입 절벽 벌레", 11100, 1044, 36, 36, 9300, 12400, 1.1, 3, 72, 105),
  createMeleeEnemy("중앙 폐허 파수꾼", 16750, 1264, 38, 36, 14000, 21000, 1.15, 4, 78, 112),
  createMeleeEnemy("하층 폐허 벌레", 24100, 2464, 38, 36, 21800, 27200, 1.15, 4, 78, 112),
  createMeleeEnemy("회랑 파수꾼", 30600, 1064, 38, 36, 27800, 33500, 1.15, 4, 78, 112),
  createMeleeEnemy("봉인 관문 파수꾼", 41700, 1144, 40, 38, 39200, 43700, 1.1, 4, 78, 112),
  createFlyingEnemy("진입 절벽 박쥐", 10200, 760),
  createFlyingEnemy("중앙 대공동 박쥐", 18100, 800),
  createFlyingEnemy("하층 폐허 박쥐", 25200, 2160),
  createFlyingEnemy("세로 상승 박쥐", 36500, 2450),
  createShooterEnemy("중앙 대공동 사수", 19950, 1260),
  createShooterEnemy("봉인 관문 사수", 42400, 1140)
];

const boss = {
  type: "boss",
  name: "기억 파수자",
  x: 42800,
  y: 1108,
  baseY: 1108,
  width: 72,
  height: 72,
  minX: 41800,
  maxX: 43600,
  vx: 0,
  speed: 1.25,
  facing: -1,
  maxHealth: 26,
  health: 26,
  alive: false,
  hitTimer: 0,
  hitByAttackId: -1,
  attackCooldown: 20,
  attackCooldownMax: 88,
  attackTimer: 0,
  attackDuration: 0,
  attackType: "none",
  attackFired: false,
  patternIndex: 0,
  startX: 42800,
  targetX: 42800,
  targetY: 1108,
  slamHitDone: false,
  laserHitDone: false,
  laserY: 0,
  laserDirection: -1,
  hidden: false,
  alpha: 1,
  contactCooldown: 0,
  phaseTwoAnnounced: false,
  defeatStarted: false
};

function getRoomBlueprintForX(x) {
  for (const room of roomBlueprints) {
    if (x >= room.bounds.x && x < room.bounds.x + room.bounds.width) {
      return room;
    }
  }

  return roomBlueprints[0];
}

function getObjectCenterForMapIndex(object) {
  const width = object.width || 0;
  return object.x + width / 2;
}

function createMapObjectSummary(object, category) {
  return {
    category,
    type: object.type || object.text || object.name || category,
    name: object.name || object.text || object.type || category,
    x: object.x,
    y: object.y,
    width: object.width || 0,
    height: object.height || 0,
    requiresDoubleJump: !!object.requiresDoubleJump,
    requiresMemoryFragments: object.requiresMemoryFragments || 0,
    requiresMemoryCores: object.requiresMemoryCores || 0,
    hiddenReward: !!object.hiddenReward,
    locked: !!object.locked
  };
}

function addObjectsToRoomIndex(index, objects, category) {
  for (const object of objects) {
    const room = getRoomBlueprintForX(getObjectCenterForMapIndex(object));
    index[room.id][category].push(createMapObjectSummary(object, category));
  }
}

function buildRoomObjectIndex() {
  const index = {};

  for (const room of roomBlueprints) {
    index[room.id] = {
      platforms: [],
      doors: [],
      enemies: [],
      rewards: [],
      hazards: [],
      keyItems: [],
      abilityItems: [],
      bossObjects: [],
      checkpoints: []
    };
  }

  addObjectsToRoomIndex(index, platforms, "platforms");
  addObjectsToRoomIndex(index, doors, "doors");
  addObjectsToRoomIndex(index, enemies, "enemies");
  addObjectsToRoomIndex(index, rewardItems, "rewards");
  addObjectsToRoomIndex(index, dashHazards, "hazards");
  addObjectsToRoomIndex(index, [keyItem], "keyItems");
  addObjectsToRoomIndex(index, abilityItems, "abilityItems");
  addObjectsToRoomIndex(index, [boss], "bossObjects");
  addObjectsToRoomIndex(index, checkpoints, "checkpoints");

  return index;
}

const mapData = {
  version: "v56",
  stage: "13-2-1",
  purpose: "튜토리얼 소형 방, 카메라 고정/추적 기믹, 초대형 방 6개의 체크포인트를 포함한 v56 블록아웃을 만든다.",
  roomCount: roomBlueprints.length,
  worldBounds: world,
  rooms: roomBlueprints,
  roomObjectIndex: buildRoomObjectIndex()
};

function getCurrentRoomData() {
  const currentRoom = getCurrentRoom();
  return mapData.roomObjectIndex[currentRoom.id] || null;
}


function createMeleeEnemy(name, x, y, width, height, minX, maxX, speed, health, attackRange, attackCooldownMax) {
  return {
    type: "melee",
    name,
    x,
    y,
    width,
    height,
    minX,
    maxX,
    vx: speed,
    vy: 0,
    speed,
    patrolDirection: speed >= 0 ? 1 : -1,
    targetDirection: speed >= 0 ? 1 : -1,
    chaseRange: 390,
    aiDecisionTimer: 0,
    attackRange,
    attackCooldown: 0,
    attackCooldownMax,
    attackTimer: 0,
    attackDuration: 42,
    attackDirection: 1,
    attackHitPlayer: false,
    maxHealth: health,
    health,
    alive: true,
    hitTimer: 0,
    invincibleTimer: 0,
    hitByAttackId: -1
  };
}

function createFlyingEnemy(name, x, y) {
  return {
    type: "flying",
    name,
    x,
    y,
    width: 38,
    height: 28,
    minX: Math.max(0, x - 700),
    maxX: Math.min(world.width, x + 760),
    minY: 90,
    maxY: 1250,
    vx: 1.1,
    vy: 0,
    speed: 1.78,
    verticalSpeed: 1.75,
    patrolDirection: 1,
    targetDirection: 1,
    chaseRange: 780,
    verticalChaseRange: 820,
    floatAngle: 0,
    aiDecisionTimer: 0,
    maxHealth: 3,
    health: 3,
    alive: true,
    hitTimer: 0,
    invincibleTimer: 0,
    hitByAttackId: -1
  };
}

function createShooterEnemy(name, x, y) {
  return {
    type: "shooter",
    name,
    x,
    y,
    width: 36,
    height: 42,
    minX: Math.max(0, x - 420),
    maxX: Math.min(world.width, x + 420),
    vx: 0,
    vy: 0,
    speed: 0.65,
    patrolDirection: -1,
    targetDirection: -1,
    chaseRange: 480,
    aiDecisionTimer: 0,
    shootRange: 520,
    shootVerticalRange: 130,
    shootCooldown: 50,
    shootCooldownMax: 120,
    shootTimer: 0,
    shootDuration: 40,
    shootDirection: -1,
    shootFired: false,
    maxHealth: 3,
    health: 3,
    alive: true,
    hitTimer: 0,
    invincibleTimer: 0,
    hitByAttackId: -1
  };
}

// 입력 처리

document.addEventListener("keydown", function(event) {
  keys[event.code] = true;

  if (gameState.endingReached && gameState.endingInputUnlocked && event.code === "KeyR") {
    location.reload();
    return;
  }

  if (gameState.endingReached) {
    return;
  }

  if (event.code === "Space") {
    if (!event.repeat) {
      requestJump();
    }
    event.preventDefault();
  }

  if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "KeyK") {
    startDash();
    event.preventDefault();
  }

  if (event.code === "KeyJ") {
    startAttack();
    event.preventDefault();
  }

  if (event.code === "KeyL") {
    startHeal();
    event.preventDefault();
  }
});

document.addEventListener("keyup", function(event) {
  keys[event.code] = false;

  if (event.code === "Space") {
    cutJumpHeight();
  }
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function approach(current, target, amount) {
  if (current < target) {
    return Math.min(current + amount, target);
  }

  if (current > target) {
    return Math.max(current - amount, target);
  }

  return target;
}

function centerX(rect) {
  return rect.x + rect.width / 2;
}

function centerY(rect) {
  return rect.y + rect.height / 2;
}

function isColliding(rectA, rectB) {
  if (rectA.width <= 0 || rectA.height <= 0 || rectB.width <= 0 || rectB.height <= 0) {
    return false;
  }

  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

function isPlayerDamageInvincible() {
  return player.invincibleTimer > 0 || player.dashInvincibleTimer > 0;
}

function startHitStop(duration) {
  if (duration > hitStopTimer) {
    hitStopTimer = duration;
  }
}

function startScreenShake(duration, power) {
  screenShakeTimer = duration;
  screenShakeMaxTimer = duration;
  screenShakePower = power;
}

function updateScreenShake() {
  if (screenShakeTimer > 0) {
    screenShakeTimer -= 1;
    const ratio = screenShakeMaxTimer > 0 ? screenShakeTimer / screenShakeMaxTimer : 0;
    camera.shakeX = (Math.random() - 0.5) * screenShakePower * ratio;
    camera.shakeY = (Math.random() - 0.5) * screenShakePower * ratio;
  } else {
    camera.shakeX = 0;
    camera.shakeY = 0;
  }
}

function isBossGateActive() {
  return gameState.bossRoomLocked && boss.alive && !gameState.bossDefeated;
}

function getCurrentRoom() {
  const playerCenterX = centerX(player);

  for (const room of rooms) {
    if (playerCenterX >= room.x && playerCenterX < room.x + room.width) {
      return room;
    }
  }

  return rooms[0];
}

function getSolidObjects() {
  const solidObjects = [];

  for (const platform of platforms) {
    solidObjects.push(platform);
  }

  for (const door of doors) {
    if (door.locked && !door.open) {
      solidObjects.push(door);
    }
  }

  if (isBossGateActive()) {
    for (const gate of bossArenaGates) {
      solidObjects.push(gate);
    }
  }

  return solidObjects;
}

function isAttackBlockingObject(object) {
  return object.height >= 50 && object.width <= 90;
}

function getClippedHitboxByWalls(hitbox, owner, direction) {
  const clipped = {
    x: hitbox.x,
    y: hitbox.y,
    width: hitbox.width,
    height: hitbox.height
  };

  for (const object of getSolidObjects()) {
    if (!isAttackBlockingObject(object)) {
      continue;
    }

    if (!isColliding(hitbox, object)) {
      continue;
    }

    if (direction === 1) {
      if (object.x >= owner.x + owner.width - 2) {
        const newRight = Math.min(clipped.x + clipped.width, object.x);
        clipped.width = Math.max(0, newRight - clipped.x);
      }
    } else {
      const wallRight = object.x + object.width;

      if (wallRight <= owner.x + 2) {
        const oldRight = clipped.x + clipped.width;
        clipped.x = Math.max(clipped.x, wallRight);
        clipped.width = Math.max(0, oldRight - clipped.x);
      }
    }
  }

  return clipped;
}

function isHitboxClipped(original, clipped) {
  return Math.abs(original.x - clipped.x) > 0.1 || Math.abs(original.width - clipped.width) > 0.1;
}

function getWallSparkPoint(clipped, direction) {
  if (direction === 1) {
    return { x: clipped.x + clipped.width, y: clipped.y + clipped.height / 2 };
  }

  return { x: clipped.x, y: clipped.y + clipped.height / 2 };
}

function addFloatingText(text, x, y, color) {
  floatingTexts.push({
    text,
    x,
    y,
    vy: -0.45,
    life: 50,
    maxLife: 50,
    color
  });
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const text = floatingTexts[i];
    text.y += text.vy;
    text.life -= 1;

    if (text.life <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

function addDustParticle(x, y, vx, vy, width, height, life, color, rotation) {
  particles.push({
    type: "dust",
    x,
    y,
    vx,
    vy,
    width,
    height,
    life,
    maxLife: life,
    color,
    rotation,
    gravity: 0.025,
    growX: 0.35,
    growY: 0.015
  });
}

function addDashStreak(x, y, vx, vy, width, height, life, color, rotation) {
  particles.push({
    type: "dash",
    x,
    y,
    vx,
    vy,
    width,
    height,
    life,
    maxLife: life,
    color,
    rotation,
    gravity: 0,
    growX: -0.15,
    growY: -0.01
  });
}

function spawnWallSparkParticles(x, y, direction) {
  for (let i = 0; i < 12; i++) {
    addDashStreak(
      x,
      y + (Math.random() - 0.5) * 22,
      direction * (1.0 + Math.random() * 2.8),
      (Math.random() - 0.5) * 2.0,
      8 + Math.random() * 14,
      2 + Math.random() * 3,
      12 + Math.random() * 8,
      "rgba(251, 191, 36, 1)",
      (Math.random() - 0.5) * 0.6
    );
  }
}

function spawnJumpParticles() {
  for (let i = 0; i < 10; i++) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    addDustParticle(
      centerX(player) + (Math.random() - 0.5) * 10,
      player.y + player.height + 2,
      direction * (0.7 + Math.random() * 1.8),
      -0.15 + Math.random() * 0.45,
      9 + Math.random() * 12,
      2.5 + Math.random() * 2.5,
      20 + Math.random() * 10,
      "rgba(148, 163, 184, 1)",
      (Math.random() - 0.5) * 0.35
    );
  }
}

function spawnDoubleJumpParticles() {
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18;
    addDashStreak(
      centerX(player),
      centerY(player),
      Math.cos(angle) * (1.4 + Math.random() * 1.3),
      Math.sin(angle) * (1.0 + Math.random() * 1.1),
      10 + Math.random() * 14,
      2 + Math.random() * 3,
      16 + Math.random() * 8,
      "rgba(196, 181, 253, 1)",
      angle
    );
  }

  startScreenShake(4, 2);
}

function spawnLandingParticles(power) {
  const count = Math.min(24, 10 + Math.floor(power * 1.5));

  for (let i = 0; i < count; i++) {
    const direction = i % 2 === 0 ? -1 : 1;
    addDustParticle(
      centerX(player) + (Math.random() - 0.5) * 8,
      player.y + player.height + 2,
      direction * (1.0 + Math.random() * 3.0),
      -0.3 - Math.random() * 0.9,
      12 + Math.random() * 18,
      3 + Math.random() * 3,
      24 + Math.random() * 14,
      "rgba(148, 163, 184, 1)",
      direction * (0.05 + Math.random() * 0.25)
    );
  }
}

function spawnDashParticles() {
  for (let i = 0; i < 14; i++) {
    addDashStreak(
      centerX(player) - player.facing * (8 + Math.random() * 20),
      player.y + 12 + Math.random() * 28,
      -player.facing * (1.5 + Math.random() * 3.0),
      (Math.random() - 0.5) * 0.8,
      18 + Math.random() * 24,
      3 + Math.random() * 4,
      18 + Math.random() * 8,
      player.dashInvincibleTimer > 0 ? "rgba(254, 240, 138, 1)" : "rgba(125, 211, 252, 1)",
      (Math.random() - 0.5) * 0.18
    );
  }
}

function spawnHitParticles(x, y, direction) {
  for (let i = 0; i < 16; i++) {
    addDashStreak(
      x,
      y + (Math.random() - 0.5) * 18,
      direction * (1.8 + Math.random() * 3.6),
      (Math.random() - 0.5) * 1.4,
      14 + Math.random() * 24,
      2 + Math.random() * 4,
      14 + Math.random() * 8,
      "rgba(248, 113, 113, 1)",
      (Math.random() - 0.5) * 0.4
    );
  }
}

function spawnPlayerDamageParticles() {
  for (let i = 0; i < 22; i++) {
    const angle = (Math.PI * 2 * i) / 22;
    addDashStreak(
      centerX(player),
      centerY(player),
      Math.cos(angle) * (1.5 + Math.random() * 2.2),
      Math.sin(angle) * (1.5 + Math.random() * 2.2),
      10 + Math.random() * 16,
      2 + Math.random() * 4,
      16 + Math.random() * 10,
      "rgba(248, 113, 113, 1)",
      angle
    );
  }
}

function spawnHealParticles() {
  for (let i = 0; i < 3; i++) {
    addDashStreak(
      centerX(player) + (Math.random() - 0.5) * 18,
      player.y + player.height - 4,
      (Math.random() - 0.5) * 0.6,
      -1.2 - Math.random() * 1.2,
      8 + Math.random() * 10,
      2 + Math.random() * 3,
      18 + Math.random() * 8,
      "rgba(134, 239, 172, 1)",
      (Math.random() - 0.5) * 0.5
    );
  }
}

function spawnHealCompleteParticles() {
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20;
    addDashStreak(
      centerX(player),
      centerY(player),
      Math.cos(angle) * (1.2 + Math.random()),
      Math.sin(angle) * (1.2 + Math.random()),
      10 + Math.random() * 12,
      2 + Math.random() * 3,
      18 + Math.random() * 8,
      "rgba(134, 239, 172, 1)",
      angle
    );
  }
}

function spawnRewardBurst(item, color) {
  for (let i = 0; i < 32; i++) {
    const angle = (Math.PI * 2 * i) / 32;
    addDashStreak(
      centerX(item),
      centerY(item),
      Math.cos(angle) * (1.2 + Math.random() * 2.2),
      Math.sin(angle) * (1.2 + Math.random() * 2.2),
      10 + Math.random() * 16,
      2 + Math.random() * 3,
      22 + Math.random() * 10,
      color,
      angle
    );
  }
}

function spawnBossSlamParticles() {
  for (let i = 0; i < 34; i++) {
    const direction = i % 2 === 0 ? -1 : 1;
    addDashStreak(
      boss.x + boss.width / 2,
      boss.baseY + boss.height - 4,
      direction * (1.5 + Math.random() * 5.2),
      -0.5 - Math.random() * 1.9,
      14 + Math.random() * 26,
      3 + Math.random() * 5,
      18 + Math.random() * 10,
      "rgba(251, 113, 133, 1)",
      (Math.random() - 0.5) * 0.7
    );
  }
}

function spawnBossTeleportParticles(x, y) {
  for (let i = 0; i < 34; i++) {
    const angle = (Math.PI * 2 * i) / 34;
    addDashStreak(
      x,
      y,
      Math.cos(angle) * (1.2 + Math.random() * 2.7),
      Math.sin(angle) * (1.2 + Math.random() * 2.7),
      12 + Math.random() * 18,
      2 + Math.random() * 4,
      18 + Math.random() * 10,
      "rgba(216, 180, 254, 1)",
      angle
    );
  }
}

function spawnBossLaserParticles() {
  const hitbox = getBossLaserHitbox();

  for (let i = 0; i < 24; i++) {
    const x = hitbox.x + Math.random() * hitbox.width;
    const y = hitbox.y + Math.random() * hitbox.height;
    addDashStreak(
      x,
      y,
      (Math.random() - 0.5) * 2.2,
      (Math.random() - 0.5) * 0.8,
      12 + Math.random() * 18,
      2 + Math.random() * 3,
      12 + Math.random() * 8,
      "rgba(248, 113, 113, 1)",
      (Math.random() - 0.5) * 0.2
    );
  }
}

function spawnBossDefeatBurst() {
  for (let i = 0; i < 80; i++) {
    const angle = (Math.PI * 2 * i) / 80;
    addDashStreak(
      centerX(boss),
      centerY(boss),
      Math.cos(angle) * (1.5 + Math.random() * 4.0),
      Math.sin(angle) * (1.5 + Math.random() * 4.0),
      16 + Math.random() * 26,
      3 + Math.random() * 5,
      32 + Math.random() * 18,
      i % 2 === 0 ? "rgba(125, 211, 252, 1)" : "rgba(216, 180, 254, 1)",
      angle
    );
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.width += particle.growX;
    particle.height += particle.growY;

    if (particle.width < 1) {
      particle.width = 1;
    }

    if (particle.height < 1) {
      particle.height = 1;
    }

    particle.life -= 1;

    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function requestJump() {
  if (player.healTimer > 0) {
    return;
  }

  player.jumpBufferTimer = player.jumpBufferMax;
}

function updateJumpAssistTimers() {
  if (player.jumpBufferTimer > 0) {
    player.jumpBufferTimer -= 1;
  }

  if (player.onGround) {
    player.coyoteTimer = player.coyoteMax;
  } else if (player.coyoteTimer > 0) {
    player.coyoteTimer -= 1;
  }
}

function tryBufferedJump() {
  if (player.jumpBufferTimer <= 0) {
    return;
  }

  if (player.healTimer > 0) {
    player.jumpBufferTimer = 0;
    return;
  }

  const wallDirectionForJump = player.isWallSliding ? player.wallDirection : checkWallContact();

  if (player.hasWallJump && wallDirectionForJump !== 0 && !player.onGround && player.wallJumpLockTimer <= 0) {
    performWallJump(wallDirectionForJump);
    player.jumpBufferTimer = 0;
    return;
  }

  if (player.onGround || player.coyoteTimer > 0) {
    performGroundJump();
    player.jumpBufferTimer = 0;
    return;
  }

  if (player.hasDoubleJump && player.canDoubleJump && !player.doubleJumpUsed) {
    performDoubleJump();
    player.jumpBufferTimer = 0;
  }
}

function performGroundJump() {
  spawnJumpParticles();
  player.vy = player.jumpPower;
  player.onGround = false;
  player.coyoteTimer = 0;

  if (player.hasDoubleJump) {
    player.canDoubleJump = true;
    player.doubleJumpUsed = false;
  }
}

function performDoubleJump() {
  spawnDoubleJumpParticles();
  player.vy = player.jumpPower * 0.92;
  player.canDoubleJump = false;
  player.doubleJumpUsed = true;
  gameState.message = "이중 점프를 사용했습니다.";
}

function performWallJump(wallDirection) {
  player.isWallSliding = false;
  player.wallDirection = wallDirection;
  player.wallJumpLockTimer = player.wallJumpLockMax;
  player.vx = -wallDirection * player.wallJumpPowerX;
  player.vy = player.wallJumpPowerY;
  player.facing = -wallDirection;
  player.onGround = false;
  player.coyoteTimer = 0;

  if (player.hasDoubleJump) {
    player.canDoubleJump = true;
    player.doubleJumpUsed = false;
  }

  spawnWallJumpParticles(wallDirection);
  startScreenShake(5, 2.8);
  gameState.message = "벽 점프를 사용했습니다.";
}

function checkWallContact() {
  if (player.onGround || player.isDashing) {
    return 0;
  }

  const leftSensor = {
    x: player.x - 3,
    y: player.y + 6,
    width: 4,
    height: player.height - 12
  };

  const rightSensor = {
    x: player.x + player.width - 1,
    y: player.y + 6,
    width: 4,
    height: player.height - 12
  };

  for (const object of getSolidObjects()) {
    if (object.height < 38) {
      continue;
    }

    if (isColliding(leftSensor, object)) {
      return -1;
    }

    if (isColliding(rightSensor, object)) {
      return 1;
    }
  }

  return 0;
}

function updateWallSlide() {
  if (!player.hasWallJump || player.onGround || player.isDashing || player.wallJumpLockTimer > 0) {
    player.isWallSliding = false;
    player.wallDirection = 0;
    return;
  }

  const wallDirection = checkWallContact();

  if (wallDirection !== 0 && player.vy > 0) {
    player.isWallSliding = true;
    player.wallDirection = wallDirection;
    player.vy = Math.min(player.vy, player.wallSlideSpeed);

    if (frameCount % 5 === 0) {
      spawnWallSlideDust(wallDirection);
    }
  } else {
    player.isWallSliding = false;
    player.wallDirection = 0;
  }
}

function spawnWallJumpParticles(wallDirection) {
  const baseX = wallDirection === -1 ? player.x : player.x + player.width;

  for (let i = 0; i < 18; i++) {
    addDashStreak(
      baseX,
      player.y + 8 + Math.random() * 32,
      -wallDirection * (1.0 + Math.random() * 3.2),
      -1.2 + Math.random() * 2.4,
      10 + Math.random() * 16,
      2 + Math.random() * 3,
      16 + Math.random() * 10,
      "rgba(167, 243, 208, 1)",
      (Math.random() - 0.5) * 0.7
    );
  }
}

function spawnWallSlideDust(wallDirection) {
  const baseX = wallDirection === -1 ? player.x : player.x + player.width;

  addDustParticle(
    baseX,
    player.y + 12 + Math.random() * 28,
    -wallDirection * (0.3 + Math.random() * 0.8),
    0.6 + Math.random() * 0.8,
    6 + Math.random() * 8,
    2 + Math.random() * 2,
    14 + Math.random() * 8,
    "rgba(167, 243, 208, 1)",
    (Math.random() - 0.5) * 0.4
  );
}

function cutJumpHeight() {
  if (player.vy < -2.5) {
    player.vy *= player.jumpCutMultiplier;
  }
}

function startDash() {
  if (player.healTimer > 0) {
    return;
  }

  if (player.dashCooldown > 0) {
    return;
  }

  if (player.isDashing) {
    return;
  }

  player.isDashing = true;
  player.dashTimer = player.dashDuration;
  player.dashCooldown = player.dashCooldownMax;
  player.dashInvincibleTimer = player.dashInvincibleMax;
  player.dashEndLagTimer = 0;
  player.vy = 0;

  gameState.message = "대시를 사용했습니다. 대시 초반에는 피해를 피할 수 있습니다.";
  spawnDashParticles();
  startScreenShake(4, 2.5);
}

function updateDash() {
  if (player.dashCooldown > 0) {
    player.dashCooldown -= 1;
  }

  if (player.dashInvincibleTimer > 0) {
    player.dashInvincibleTimer -= 1;
  }

  if (player.dashEndLagTimer > 0) {
    player.dashEndLagTimer -= 1;
  }

  if (player.isDashing) {
    player.vx = player.facing * player.dashSpeed;
    player.dashTimer -= 1;

    if (frameCount % 2 === 0) {
      addDashStreak(
        centerX(player) - player.facing * 18,
        player.y + 12 + Math.random() * 28,
        -player.facing * (1.0 + Math.random() * 2.0),
        (Math.random() - 0.5) * 0.5,
        12 + Math.random() * 18,
        2 + Math.random() * 3,
        12 + Math.random() * 7,
        player.dashInvincibleTimer > 0 ? "rgba(254, 240, 138, 1)" : "rgba(125, 211, 252, 1)",
        (Math.random() - 0.5) * 0.15
      );
    }

    if (player.dashTimer <= 0) {
      player.isDashing = false;
      player.dashEndLagTimer = player.dashEndLagMax;
    }
  }
}

function getSelectedAttackDirection() {
  const upPressed = keys["KeyW"] || keys["ArrowUp"];
  const downPressed = keys["KeyS"] || keys["ArrowDown"];

  if (upPressed) {
    return "up";
  }

  if (downPressed && !player.onGround) {
    return "down";
  }

  return "side";
}

function startAttack() {
  if (player.healTimer > 0) {
    return;
  }

  if (player.attackCooldown > 0) {
    return;
  }

  player.attackDirection = getSelectedAttackDirection();
  player.attackTimer = player.attackDuration;
  player.attackCooldown = player.attackCooldownMax;
  player.attackId += 1;

  if (player.attackDirection === "up") {
    gameState.message = "위 공격을 사용했습니다.";
  } else if (player.attackDirection === "down") {
    gameState.message = "아래 공격을 사용했습니다.";
  } else {
    gameState.message = "공격했습니다.";
  }

  const hitbox = getAttackHitbox();
  spawnHitParticles(hitbox.x + hitbox.width / 2, hitbox.y + hitbox.height / 2, player.facing);
}

function getAttackHitbox() {
  if (player.attackDirection === "up") {
    return {
      x: player.x - 6,
      y: player.y - 42,
      width: player.width + 12,
      height: 48
    };
  }

  if (player.attackDirection === "down") {
    return {
      x: player.x - 6,
      y: player.y + player.height - 4,
      width: player.width + 12,
      height: 50
    };
  }

  const attackWidth = 54;
  const attackHeight = 38;

  return {
    x: player.facing === 1 ? player.x + player.width - 3 : player.x - attackWidth + 3,
    y: player.y + 6,
    width: attackWidth,
    height: attackHeight
  };
}

function applyAttackRecoilOnHit(target) {
  if (player.attackDirection === "down" && !player.onGround) {
    player.vy = player.attackPogoPower;
    player.canDoubleJump = player.hasDoubleJump;
    player.doubleJumpUsed = false;
    player.attackFloatTimer = 0;
    spawnDoubleJumpParticles();
    startScreenShake(5, 3);
    gameState.message = "아래 공격이 적중하여 튕겨 올랐습니다.";
    return;
  }

  if (player.attackDirection === "side") {
    player.vx -= player.facing * player.attackRecoilX;
    return;
  }

  if (player.attackDirection === "up") {
    player.vy = Math.min(player.vy, -2.2);
    player.attackFloatTimer = 5;
  }
}

function startHeal() {
  if (player.healTimer > 0) {
    return;
  }

  if (!player.onGround) {
    gameState.message = "회복은 땅 위에서만 할 수 있습니다.";
    return;
  }

  if (player.health >= player.maxHealth) {
    gameState.message = "이미 체력이 가득 차 있습니다.";
    return;
  }

  if (player.coreEnergy < player.healCost) {
    gameState.message = "코어 에너지가 부족합니다.";
    return;
  }

  if (player.isDashing || player.attackTimer > 0) {
    return;
  }

  player.coreEnergy -= player.healCost;
  player.healTimer = player.healDuration;
  player.healingWillRestore = true;
  player.vx = 0;
  gameState.message = "코어 에너지로 회복 중입니다. 맞으면 끊깁니다.";
}

function gainCoreEnergy(amount) {
  player.coreEnergy += amount;

  if (player.coreEnergy > player.maxCoreEnergy) {
    player.coreEnergy = player.maxCoreEnergy;
  }
}

function updatePlayerCombat() {
  if (player.attackTimer > 0) {
    player.attackTimer -= 1;
  }

  if (player.attackCooldown > 0) {
    player.attackCooldown -= 1;
  }

  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= 1;
  }

  if (player.attackFloatTimer > 0) {
    player.attackFloatTimer -= 1;
  }

  if (player.healTimer > 0) {
    player.healTimer -= 1;

    if (frameCount % 4 === 0) {
      spawnHealParticles();
    }

    if (player.healTimer <= 0 && player.healingWillRestore) {
      player.health += 1;

      if (player.health > player.maxHealth) {
        player.health = player.maxHealth;
      }

      player.healingWillRestore = false;
      gameState.message = "체력을 1 회복했습니다.";
      spawnHealCompleteParticles();
      startScreenShake(6, 3);
    }
  }
}

function updatePlayerHorizontalMove() {
  if (gameState.endingReached) {
    player.vx = approach(player.vx, 0, 0.45);
    return;
  }

  if (player.healTimer > 0) {
    player.vx = approach(player.vx, 0, 0.34);
    return;
  }

  if (player.isDashing) {
    return;
  }

  if (player.dashEndLagTimer > 0) {
    player.vx = approach(player.vx, 0, 0.18);
    return;
  }

  let inputDirection = 0;

  if (keys["KeyA"]) {
    inputDirection -= 1;
  }

  if (keys["KeyD"]) {
    inputDirection += 1;
  }

  const currentMaxSpeed = player.onGround ? player.maxSpeed : player.maxAirSpeed;
  const acceleration = player.onGround ? player.groundAcceleration : player.airAcceleration;
  const deceleration = player.onGround ? player.groundDeceleration : player.airDeceleration;

  if (inputDirection !== 0) {
    const isTurning = Math.abs(player.vx) > player.turnThreshold && Math.sign(player.vx) !== inputDirection;

    // v44: 반대 방향 입력이 들어와도 속도를 즉시 뒤집지 않고, 먼저 0에 가깝게 감속한다.
    // 이렇게 해야 방향 전환이 부드러우면서도 게임 진행에 지장이 없을 정도로 반응성이 유지된다.
    if (isTurning) {
      const turnSlowdown = player.onGround ? player.turnDeceleration : player.airDeceleration;
      player.vx = approach(player.vx, 0, turnSlowdown);
    } else {
      const targetVelocity = inputDirection * currentMaxSpeed;
      player.vx = approach(player.vx, targetVelocity, acceleration);
    }

    player.facing = inputDirection;
  } else {
    player.vx = approach(player.vx, 0, deceleration);
  }

  if (Math.abs(player.vx) < 0.03) {
    player.vx = 0;
  }
}

function updateGravity() {
  if (player.isDashing) {
    return;
  }

  if (player.attackFloatTimer > 0 && player.vy > 0) {
    player.vy *= 0.82;
  }

  let gravityToApply = gravity;

  if (player.vy > 0) {
    gravityToApply *= player.fallGravityMultiplier;
  }

  player.vy += gravityToApply;

  if (player.vy > player.maxFallSpeed) {
    player.vy = player.maxFallSpeed;
  }
}

function moveHorizontally() {
  player.x += player.vx;

  for (const object of getSolidObjects()) {
    if (!isColliding(player, object)) {
      continue;
    }

    if (object.locked && !object.open) {
      if (object.requiresMemoryCores) {
        if (gameState.memoryCores >= object.requiresMemoryCores) {
          object.open = true;
          gameState.message = "기억 핵이 반응하여 최종 문이 열렸습니다.";
          startScreenShake(14, 4);
          continue;
        }

        gameState.message = "최종 문입니다. 기억 핵 1개가 필요합니다.";
      } else if (object.requiresMemoryFragments) {
        if (gameState.memoryFragments >= object.requiresMemoryFragments) {
          object.open = true;
          gameState.message = "기억 조각이 반응하여 기억의 문이 열렸습니다.";
          startScreenShake(10, 3);
          continue;
        }

        gameState.message = "기억의 문입니다. 기억 조각 1개가 필요합니다.";
      } else if (gameState.hasKey) {
        object.open = true;
        gameState.message = "잠긴 문이 열렸습니다.";
        continue;
      } else {
        gameState.message = "잠긴 문입니다. 열쇠가 필요합니다.";
      }
    }

    if (isBossGateActive() && object.text === "보스전 봉인") {
      gameState.message = "보스를 쓰러뜨리기 전에는 보스방을 나갈 수 없습니다.";
    }

    if (player.vx > 0) {
      player.x = object.x - player.width;
    } else if (player.vx < 0) {
      player.x = object.x + object.width;
    }

    player.vx = 0;
    player.isDashing = false;
  }

  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }

  if (player.x + player.width > world.width) {
    player.x = world.width - player.width;
    player.vx = 0;
  }
}

function moveVertically(previousOnGround, previousVy) {
  player.y += player.vy;
  player.onGround = false;

  for (const object of getSolidObjects()) {
    if (!isColliding(player, object)) {
      continue;
    }

    if (player.vy > 0) {
      player.y = object.y - player.height;
      player.vy = 0;
      player.onGround = true;

      if (player.hasDoubleJump) {
        player.canDoubleJump = true;
        player.doubleJumpUsed = false;
      }

      if (!previousOnGround && previousVy > 4) {
        spawnLandingParticles(previousVy);
      }
    } else if (player.vy < 0) {
      player.y = object.y + object.height;
      player.vy = 0;
    }
  }
}

function updatePlayer() {
  const previousOnGround = player.onGround;
  const previousVy = player.vy;
  player.wasOnGround = player.onGround;

  if (player.wallJumpLockTimer > 0) {
    player.wallJumpLockTimer -= 1;
  }

  updateJumpAssistTimers();
  tryBufferedJump();
  updateDash();
  updatePlayerHorizontalMove();
  updateGravity();
  moveHorizontally();
  updateWallSlide();
  moveVertically(previousOnGround, previousVy);

  if (player.onGround) {
    player.coyoteTimer = player.coyoteMax;
  }

  checkKeyCollection();
  checkAbilityCollection();
  checkRewardCollection();
  checkDashHazardDamage();
  checkCheckpointActivation();
  checkFall();
}

function checkKeyCollection() {
  if (keyItem.collected) {
    return;
  }

  if (isColliding(player, keyItem)) {
    keyItem.collected = true;
    gameState.hasKey = true;
    gameState.message = "열쇠를 획득했습니다. 이제 잠긴 문을 열 수 있습니다.";
    spawnRewardBurst(keyItem, "rgba(250, 204, 21, 1)");
  }
}

function checkAbilityCollection() {
  for (const item of abilityItems) {
    if (item.collected) {
      continue;
    }

    if (!isColliding(player, item)) {
      continue;
    }

    item.collected = true;

    if (item.type === "doubleJump") {
      player.hasDoubleJump = true;
      player.canDoubleJump = true;
      player.doubleJumpUsed = false;
      gameState.message = "능력 획득: 이중 점프. 공중에서 Space를 한 번 더 누를 수 있습니다.";
      spawnRewardBurst(item, "rgba(196, 181, 253, 1)");
      startScreenShake(8, 3);
    }
  }
}

function checkRewardCollection() {
  for (const item of rewardItems) {
    if (item.collected) {
      continue;
    }

    if (item.requiresBossDefeated && !gameState.bossDefeated) {
      continue;
    }

    if (!isColliding(player, item)) {
      continue;
    }

    item.collected = true;

    if (item.type === "memoryFragment") {
      gameState.memoryFragments += 1;

      if (item.hiddenReward) {
        gameState.hiddenRewards += 1;
        gameState.message = "숨겨진 기억 조각을 획득했습니다. 되돌아가기 탐험이 보상으로 이어졌습니다.";
      } else {
        gameState.message = "기억 조각을 획득했습니다. 이제 기억의 문을 열 수 있습니다.";
      }

      spawnRewardBurst(item, "rgba(251, 191, 36, 1)");
      startScreenShake(6, 2.5);
    }

    if (item.type === "healthCore") {
      player.maxHealth += 1;
      player.health = player.maxHealth;
      gameState.hiddenRewards += 1;
      gameState.message = "숨겨진 체력 코어를 획득했습니다. 최대 체력이 1 증가했습니다.";
      spawnRewardBurst(item, "rgba(248, 113, 113, 1)");
      startScreenShake(10, 4);
    }

    if (item.type === "coreCapacity") {
      player.maxCoreEnergy += 1;
      player.coreEnergy = player.maxCoreEnergy;
      gameState.hiddenRewards += 1;
      gameState.message = "숨겨진 코어 용량을 획득했습니다. 최대 코어 에너지가 1 증가했습니다.";
      spawnRewardBurst(item, "rgba(134, 239, 172, 1)");
      startScreenShake(10, 4);
    }

    if (item.type === "memoryCore") {
      gameState.memoryCores += 1;
      gameState.message = "기억 핵을 획득했습니다. 이제 최종 문을 열 수 있습니다.";
      spawnRewardBurst(item, "rgba(216, 180, 254, 1)");
      startScreenShake(12, 4);
    }

    if (item.type === "originCore") {
      gameState.originCores += 1;
      gameState.endingReached = true;
      gameState.endingFrame = 0;
      gameState.endingInputUnlocked = false;
      gameState.message = "원점 코어를 획득했습니다. Coreless의 엔딩이 시작됩니다.";
      spawnRewardBurst(item, "rgba(125, 211, 252, 1)");
      startScreenShake(20, 6);
    }
  }
}

function getDashHazardDamageBox(hazard) {
  return {
    x: hazard.x + hazard.width * 0.28,
    y: hazard.y + 12,
    width: hazard.width * 0.44,
    height: hazard.height - 24
  };
}

function canPassDashHazard() {
  return player.isDashing || player.dashInvincibleTimer > 0 || player.dashEndLagTimer > 0;
}

function checkDashHazardDamage() {
  for (const hazard of dashHazards) {
    const damageBox = getDashHazardDamageBox(hazard);

    if (!isColliding(player, damageBox)) {
      continue;
    }

    if (canPassDashHazard()) {
      gameState.message = hazard.name + "을 대시로 통과했습니다.";
      continue;
    }

    if (isPlayerDamageInvincible()) {
      continue;
    }

    takeDamage(hazard, hazard.name + "에 닿았습니다. Shift/K 대시로 통과해 보세요.");
  }
}

function getFallLimitForCurrentRoom() {
  const currentRoom = getCurrentRoom();
  const bounds = currentRoom.cameraBounds;

  if (bounds) {
    return bounds.y + bounds.height + 620;
  }

  return world.height + 200;
}

function checkFall() {
  if (player.y > getFallLimitForCurrentRoom()) {
    respawnAtCheckpoint("낙하했습니다. 마지막 체크포인트에서 다시 시작합니다.");
  }
}

function restorePlayerStateAfterRespawn() {
  player.vx = 0;
  player.vy = 0;
  player.invincibleTimer = 90;
  player.dashInvincibleTimer = 0;
  player.dashEndLagTimer = 0;
  player.isDashing = false;
  player.attackTimer = 0;
  player.healTimer = 0;
  player.healingWillRestore = false;
  player.canDoubleJump = player.hasDoubleJump;
  player.doubleJumpUsed = false;
  player.jumpBufferTimer = 0;
  player.coyoteTimer = 0;
  player.attackFloatTimer = 0;
  gameState.bossRoomLocked = false;
}

function resetPlayer() {
  player.x = startPosition.x;
  player.y = startPosition.y;
  player.health = player.maxHealth;
  activeCheckpoint = checkpoints[0];
  restorePlayerStateAfterRespawn();
  gameState.message = "시작 지점에서 다시 시작합니다.";
}

function respawnAtCheckpoint(message) {
  const checkpoint = activeCheckpoint || checkpoints[0];
  player.x = checkpoint.spawnX;
  player.y = checkpoint.spawnY;
  restorePlayerStateAfterRespawn();
  gameState.message = message || checkpoint.name + "에서 다시 시작합니다.";
}

function respawnPlayer() {
  player.health = player.maxHealth;
  respawnAtCheckpoint("체력이 모두 줄어 마지막 체크포인트에서 다시 시작합니다.");
}

function checkCheckpointActivation() {
  for (const checkpoint of checkpoints) {
    if (isColliding(player, checkpoint)) {
      if (activeCheckpoint !== checkpoint) {
        activeCheckpoint = checkpoint;
        checkpoint.activated = true;
        gameState.message = checkpoint.name + "를 활성화했습니다.";
        addFloatingText("CHECK", checkpoint.x + checkpoint.width / 2, checkpoint.y - 10, "#bae6fd");
      }
      return;
    }
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type === "flying") {
      updateFlyingEnemy(enemy);
    } else if (enemy.type === "shooter") {
      updateShooterEnemy(enemy);
    } else {
      updateMeleeEnemy(enemy);
    }

    if (enemy.hitTimer > 0) {
      enemy.hitTimer -= 1;
    }

    if (enemy.invincibleTimer > 0) {
      enemy.invincibleTimer -= 1;
    }
  }
}

function updateMeleeEnemy(enemy) {
  updateMeleeEnemyAI(enemy);
  moveEnemyHorizontally(enemy);
  updateEnemyCombat(enemy);
}

function updateMeleeEnemyAI(enemy) {
  const distanceX = centerX(player) - centerX(enemy);
  const distanceY = centerY(player) - centerY(enemy);
  const playerIsClose = Math.abs(distanceX) <= enemy.chaseRange && Math.abs(distanceY) <= 160;

  if (enemy.aiDecisionTimer > 0) {
    enemy.aiDecisionTimer -= 1;
  }

  if (enemy.attackTimer > 0) {
    enemy.vx = 0;
    return;
  }

  if (canEnemyStartAttack(enemy, distanceX, distanceY)) {
    startEnemyAttack(enemy, distanceX);
    enemy.vx = 0;
    return;
  }

  if (playerIsClose) {
    if (enemy.aiDecisionTimer <= 0) {
      if (distanceX > 8) {
        enemy.targetDirection = 1;
      } else if (distanceX < -8) {
        enemy.targetDirection = -1;
      }

      enemy.patrolDirection = enemy.targetDirection;
      enemy.aiDecisionTimer = 14;
    }

    enemy.vx = enemy.targetDirection * enemy.speed;
  } else {
    enemy.vx = enemy.patrolDirection * enemy.speed * 0.7;
  }
}

function updateFlyingEnemy(enemy) {
  const distanceX = centerX(player) - centerX(enemy);
  const distanceY = centerY(player) - centerY(enemy);
  const playerIsClose = Math.abs(distanceX) <= enemy.chaseRange && Math.abs(distanceY) <= enemy.verticalChaseRange;
  enemy.floatAngle += 0.05;

  if (enemy.aiDecisionTimer > 0) {
    enemy.aiDecisionTimer -= 1;
  }

  if (playerIsClose) {
    if (enemy.aiDecisionTimer <= 0) {
      if (distanceX > 8) {
        enemy.targetDirection = 1;
      } else if (distanceX < -8) {
        enemy.targetDirection = -1;
      }

      enemy.aiDecisionTimer = 8;
    }

    const targetVx = Math.abs(distanceX) > 12 ? enemy.targetDirection * enemy.speed : 0;
    const targetVy = Math.abs(distanceY) > 12 ? Math.sign(distanceY) * enemy.verticalSpeed : 0;

    enemy.vx = approach(enemy.vx, targetVx, 0.16);
    enemy.vy = approach(enemy.vy, targetVy, 0.16);
  } else {
    enemy.vx = approach(enemy.vx, enemy.patrolDirection * enemy.speed * 0.75, 0.08);
    enemy.vy = Math.sin(enemy.floatAngle) * 0.7;
  }

  enemy.x += enemy.vx;
  enemy.y += enemy.vy;

  if (enemy.x < enemy.minX) {
    enemy.x = enemy.minX;
    enemy.patrolDirection = 1;
    enemy.targetDirection = 1;
  }

  if (enemy.x + enemy.width > enemy.maxX) {
    enemy.x = enemy.maxX - enemy.width;
    enemy.patrolDirection = -1;
    enemy.targetDirection = -1;
  }

  if (enemy.y < enemy.minY) {
    enemy.y = enemy.minY;
    enemy.vy = Math.abs(enemy.vy);
  }

  if (enemy.y + enemy.height > enemy.maxY) {
    enemy.y = enemy.maxY - enemy.height;
    enemy.vy = -Math.abs(enemy.vy);
  }
}

function updateShooterEnemy(enemy) {
  const distanceX = centerX(player) - centerX(enemy);
  const distanceY = centerY(player) - centerY(enemy);

  if (distanceX >= 0) {
    enemy.shootDirection = 1;
    enemy.targetDirection = 1;
  } else {
    enemy.shootDirection = -1;
    enemy.targetDirection = -1;
  }

  if (enemy.shootCooldown > 0) {
    enemy.shootCooldown -= 1;
  }

  if (enemy.shootTimer > 0) {
    const elapsed = enemy.shootDuration - enemy.shootTimer;
    enemy.vx = 0;
    enemy.shootTimer -= 1;

    if (!enemy.shootFired && elapsed >= 24) {
      spawnEnemyProjectile(enemy);
      enemy.shootFired = true;
      startScreenShake(5, 2.5);
    }

    if (enemy.shootTimer <= 0) {
      enemy.shootCooldown = enemy.shootCooldownMax;
      enemy.shootFired = false;
    }

    return;
  }

  const playerInShootRange = Math.abs(distanceX) <= enemy.shootRange && Math.abs(distanceY) <= enemy.shootVerticalRange;

  if (playerInShootRange && enemy.shootCooldown <= 0) {
    enemy.vx = 0;
    enemy.shootTimer = enemy.shootDuration;
    enemy.shootFired = false;
    gameState.message = enemy.name + "가 원거리 공격을 준비합니다.";
    return;
  }

  if (Math.abs(distanceX) <= enemy.chaseRange && Math.abs(distanceY) <= 180) {
    if (Math.abs(distanceX) < 210) {
      enemy.vx = -enemy.targetDirection * enemy.speed;
    } else if (Math.abs(distanceX) > 330) {
      enemy.vx = enemy.targetDirection * enemy.speed;
    } else {
      enemy.vx = enemy.patrolDirection * enemy.speed * 0.35;
    }
  } else {
    enemy.vx = enemy.patrolDirection * enemy.speed * 0.7;
  }

  moveEnemyHorizontally(enemy);
}

function canEnemyStartAttack(enemy, distanceX, distanceY) {
  if (enemy.attackCooldown > 0) {
    return false;
  }

  if (enemy.attackTimer > 0) {
    return false;
  }

  if (Math.abs(distanceX) > enemy.attackRange) {
    return false;
  }

  if (Math.abs(distanceY) > 48) {
    return false;
  }

  if (isPlayerDamageInvincible()) {
    return false;
  }

  return true;
}

function startEnemyAttack(enemy, distanceX) {
  enemy.attackTimer = enemy.attackDuration;
  enemy.attackCooldown = enemy.attackCooldownMax;
  enemy.attackHitPlayer = false;

  if (distanceX >= 0) {
    enemy.attackDirection = 1;
    enemy.targetDirection = 1;
    enemy.patrolDirection = 1;
  } else {
    enemy.attackDirection = -1;
    enemy.targetDirection = -1;
    enemy.patrolDirection = -1;
  }

  gameState.message = enemy.name + "가 공격을 준비합니다.";
}

function updateEnemyCombat(enemy) {
  if (enemy.attackCooldown > 0) {
    enemy.attackCooldown -= 1;
  }

  if (enemy.attackTimer > 0) {
    const previousAttackTimer = enemy.attackTimer;
    enemy.attackTimer -= 1;

    if (previousAttackTimer > 0 && enemy.attackTimer <= 0) {
      enemy.attackHitPlayer = false;
    }
  }
}

function isEnemyAttackActive(enemy) {
  if (enemy.attackTimer <= 0) {
    return false;
  }

  const elapsed = enemy.attackDuration - enemy.attackTimer;
  return elapsed >= 18 && elapsed <= 30;
}

function getEnemyAttackHitbox(enemy) {
  const attackWidth = 54;
  const attackHeight = 34;

  return {
    x: enemy.attackDirection === 1 ? enemy.x + enemy.width - 2 : enemy.x - attackWidth + 2,
    y: enemy.y + 2,
    width: attackWidth,
    height: attackHeight
  };
}

function getBlockedEnemyAttackHitbox(enemy) {
  const rawHitbox = getEnemyAttackHitbox(enemy);
  return getClippedHitboxByWalls(rawHitbox, enemy, enemy.attackDirection);
}

function getEnemyContactHitbox(enemy) {
  if (enemy.type === "flying") {
    return {
      x: enemy.x - 6,
      y: enemy.y - 8,
      width: enemy.width + 12,
      height: enemy.height + 18
    };
  }

  return enemy;
}

function isGroundLikePlatform(object) {
  if (!object) {
    return false;
  }

  if (object.width < 70) {
    return false;
  }

  if (object.height > 100 && object.width < 120) {
    return false;
  }

  return true;
}

function hasGroundAhead(enemy, direction) {
  const probe = {
    x: direction === 1 ? enemy.x + enemy.width + 8 : enemy.x - 18,
    y: enemy.y + enemy.height + 2,
    width: 18,
    height: 18
  };

  for (const platform of platforms) {
    if (!isGroundLikePlatform(platform)) {
      continue;
    }

    if (isColliding(probe, platform)) {
      return true;
    }
  }

  return false;
}

function reverseGroundEnemyAtEdge(enemy) {
  enemy.patrolDirection *= -1;
  enemy.targetDirection = enemy.patrolDirection;
  enemy.vx = enemy.patrolDirection * Math.abs(enemy.speed) * 0.7;
  enemy.aiDecisionTimer = 18;
}

function moveEnemyHorizontally(enemy) {
  if (enemy.type !== "flying" && Math.abs(enemy.vx) > 0.05) {
    const moveDirection = enemy.vx > 0 ? 1 : -1;

    if (!hasGroundAhead(enemy, moveDirection)) {
      reverseGroundEnemyAtEdge(enemy);
      return;
    }
  }

  enemy.x += enemy.vx;

  if (enemy.x < enemy.minX) {
    enemy.x = enemy.minX;
    enemy.patrolDirection = 1;
    enemy.targetDirection = 1;
    enemy.vx = Math.abs(enemy.speed);
  }

  if (enemy.x + enemy.width > enemy.maxX) {
    enemy.x = enemy.maxX - enemy.width;
    enemy.patrolDirection = -1;
    enemy.targetDirection = -1;
    enemy.vx = -Math.abs(enemy.speed);
  }

  for (const object of getSolidObjects()) {
    if (!isColliding(enemy, object)) {
      continue;
    }

    if (enemy.vx > 0) {
      enemy.x = object.x - enemy.width;
      enemy.patrolDirection = -1;
      enemy.targetDirection = -1;
    } else if (enemy.vx < 0) {
      enemy.x = object.x + object.width;
      enemy.patrolDirection = 1;
      enemy.targetDirection = 1;
    }

    enemy.vx = 0;
    enemy.aiDecisionTimer = 16;
  }
}

function knockbackEnemy(enemy, direction, distance) {
  for (let i = 0; i < distance; i++) {
    enemy.x += direction;
    let blocked = false;

    if (enemy.x < enemy.minX) {
      enemy.x = enemy.minX;
      blocked = true;
    }

    if (enemy.x + enemy.width > enemy.maxX) {
      enemy.x = enemy.maxX - enemy.width;
      blocked = true;
    }

    for (const object of getSolidObjects()) {
      if (enemy.type !== "flying" && isColliding(enemy, object)) {
        enemy.x -= direction;
        blocked = true;
        break;
      }
    }

    if (blocked) {
      break;
    }
  }
}

function startBossFightIfNeeded() {
  const playerEnteredBossRoom = false;

  if (!playerEnteredBossRoom) {
    return;
  }

  if (!boss.alive || gameState.bossDefeated) {
    gameState.bossRoomLocked = false;
    return;
  }

  if (!gameState.bossFightStarted) {
    gameState.bossFightStarted = true;
    gameState.bossRoomLocked = true;
    gameState.bossStartBannerTimer = 120;
    boss.patternIndex = 0;
    boss.attackCooldown = 18;
    camera.bossFocusTimer = 0;
    gameState.message = "보스방이 봉인되었습니다. 기억 파수자와의 전투가 시작됩니다.";
    spawnBossIntroParticles();
    startScreenShake(22, 7);
    return;
  }

  if (!gameState.bossRoomLocked) {
    gameState.bossRoomLocked = true;
    gameState.message = "보스방이 다시 봉인되었습니다.";
    startScreenShake(10, 3);
  }
}

function spawnBossIntroParticles() {
  for (let i = 0; i < 50; i++) {
    const angle = (Math.PI * 2 * i) / 50;
    addDashStreak(
      centerX(boss),
      centerY(boss),
      Math.cos(angle) * (1.3 + Math.random() * 3.0),
      Math.sin(angle) * (1.3 + Math.random() * 3.0),
      12 + Math.random() * 22,
      2 + Math.random() * 4,
      24 + Math.random() * 18,
      i % 2 === 0 ? "rgba(251, 113, 133, 1)" : "rgba(125, 211, 252, 1)",
      angle
    );
  }
}

function isBossPhaseTwo() {
  return boss.health <= boss.maxHealth / 2;
}

function updateBoss() {
  if (!boss.alive) {
    return;
  }

  const playerInBossRoom = false;

  if (!playerInBossRoom) {
    return;
  }

  if (isBossPhaseTwo() && !boss.phaseTwoAnnounced) {
    boss.phaseTwoAnnounced = true;
    gameState.bossPhaseBannerTimer = 130;
    gameState.message = "기억 파수자가 2페이즈에 돌입했습니다. 패턴이 더 빠르고 촘촘해집니다.";
    startScreenShake(28, 9);
    spawnBossIntroParticles();
  }

  if (boss.hitTimer > 0) {
    boss.hitTimer -= 1;
  }

  if (boss.contactCooldown > 0) {
    boss.contactCooldown -= 1;
  }

  if (boss.attackCooldown > 0) {
    boss.attackCooldown -= 1;
  }

  boss.speed = isBossPhaseTwo() ? 1.85 : 1.25;
  boss.attackCooldownMax = isBossPhaseTwo() ? 58 : 78;
  boss.facing = centerX(player) >= centerX(boss) ? 1 : -1;

  if (boss.attackTimer > 0) {
    updateBossCurrentAttack();
    return;
  }

  boss.hidden = false;
  boss.alpha = 1;
  boss.y = boss.baseY;

  const distanceX = centerX(player) - centerX(boss);

  if (Math.abs(distanceX) < 740 && boss.attackCooldown <= 0) {
    chooseBossPattern();
    boss.patternIndex += 1;
    return;
  }

  if (Math.abs(distanceX) > 80) {
    boss.vx = boss.facing * boss.speed;
  } else {
    boss.vx *= 0.8;
  }

  boss.x += boss.vx;
  boss.x = clamp(boss.x, boss.minX, boss.maxX - boss.width);
}

function updateBossCurrentAttack() {
  if (boss.attackType === "shardRain") {
    updateBossShardRainAttack();
    return;
  }

  if (boss.attackType === "shockwave") {
    updateBossShockwaveAttack();
    return;
  }

  if (boss.attackType === "jumpSlam") {
    updateBossJumpSlamAttack();
    return;
  }

  if (boss.attackType === "teleportSlam") {
    updateBossTeleportSlamAttack();
    return;
  }

  if (boss.attackType === "laser") {
    updateBossLaserAttack();
  }
}

function chooseBossPattern() {
  if (isBossPhaseTwo()) {
    chooseBossPhaseTwoPattern();
  } else {
    chooseBossPhaseOnePattern();
  }
}

function chooseBossPhaseOnePattern() {
  const patternOrder = ["shardRain", "shockwave", "teleportSlam", "jumpSlam", "laser", "shardRain", "shockwave"];
  startBossPattern(patternOrder[boss.patternIndex % patternOrder.length]);
}

function chooseBossPhaseTwoPattern() {
  const patternOrder = ["shardRain", "teleportSlam", "laser", "jumpSlam", "shardRain", "shockwave", "teleportSlam", "laser"];
  startBossPattern(patternOrder[boss.patternIndex % patternOrder.length]);
}

function startBossPattern(patternType) {
  if (patternType === "shardRain") {
    startBossShardRainAttack();
    return;
  }

  if (patternType === "shockwave") {
    startBossShockwaveAttack();
    return;
  }

  if (patternType === "jumpSlam") {
    startBossJumpSlamAttack();
    return;
  }

  if (patternType === "teleportSlam") {
    startBossTeleportSlamAttack();
    return;
  }

  if (patternType === "laser") {
    startBossLaserAttack();
  }
}

function startBossShardRainAttack() {
  boss.attackType = "shardRain";
  boss.attackDuration = isBossPhaseTwo() ? 104 : 122;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.vx = 0;
  boss.y = boss.baseY;
  boss.hidden = false;
  boss.alpha = 1;
  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 기억 파편이 빠르게 쏟아집니다. 파란 표식을 피하세요."
    : "기억 파편 낙하가 시작됩니다. 바닥의 파란 표식을 피하세요.";
  startScreenShake(8, 3);
  spawnMemoryShardWarningNearPlayer(42);
  spawnMemoryShardWarningRandom(52);
}

function updateBossShardRainAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const interval = isBossPhaseTwo() ? 8 : 12;
  boss.vx = 0;
  boss.y = boss.baseY;

  if (elapsed > 10 && elapsed < boss.attackDuration - 12 && elapsed % interval === 0) {
    if (Math.random() < 0.72) {
      spawnMemoryShardWarningNearPlayer(isBossPhaseTwo() ? 32 : 40);
    } else {
      spawnMemoryShardWarningRandom(isBossPhaseTwo() ? 32 : 40);
    }
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function spawnMemoryShardWarningNearPlayer(delay) {
  const warningX = centerX(player) + (Math.random() - 0.5) * 190;
  spawnMemoryShardWarning(warningX, delay);
}

function spawnMemoryShardWarningRandom(delay) {
  const warningX = 10920 + Math.random() * 1350;
  spawnMemoryShardWarning(warningX, delay);
}

function spawnMemoryShardWarning(x, delay) {
  shardWarnings.push({
    x: clamp(x, 10920, 12300),
    y: 620,
    timer: delay,
    maxTimer: delay
  });
}

function updateShardWarnings() {
  for (let i = shardWarnings.length - 1; i >= 0; i--) {
    const warning = shardWarnings[i];
    warning.timer -= 1;

    if (warning.timer <= 0) {
      spawnMemoryShardFromWarning(warning);
      shardWarnings.splice(i, 1);
    }
  }
}

function spawnMemoryShardFromWarning(warning) {
  const spawnY = warning.y - 620;

  projectiles.push({
    type: "memoryShard",
    x: warning.x - 10,
    y: spawnY,
    width: 20,
    height: 28,
    vx: 0,
    vy: isBossPhaseTwo() ? 8.8 : 7.4,
    life: 150,
    groundY: warning.y,
    sourceName: boss.name
  });

  for (let i = 0; i < 6; i++) {
    addDashStreak(
      warning.x,
      spawnY + 20,
      (Math.random() - 0.5) * 1.2,
      0.5 + Math.random() * 1.2,
      8 + Math.random() * 8,
      2 + Math.random() * 2,
      18 + Math.random() * 8,
      "rgba(125, 211, 252, 1)",
      Math.random() * Math.PI
    );
  }
}

function startBossShockwaveAttack() {
  boss.attackType = "shockwave";
  boss.attackDuration = isBossPhaseTwo() ? 42 : 52;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.vx = 0;
  boss.y = boss.baseY;
  boss.hidden = false;
  boss.alpha = 1;
  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 기억 파수자가 빠르게 충격파를 준비합니다."
    : "기억 파수자가 바닥을 내려칠 준비를 합니다.";
}

function updateBossShockwaveAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const fireFrame = isBossPhaseTwo() ? 21 : 27;
  boss.vx = 0;
  boss.y = boss.baseY;

  if (!boss.attackFired && elapsed >= fireFrame) {
    boss.attackFired = true;
    spawnBossShockwaves();
    spawnBossSlamParticles();
    startScreenShake(isBossPhaseTwo() ? 16 : 14, isBossPhaseTwo() ? 6 : 5);
    gameState.message = "기억 파수자가 충격파를 방출했습니다.";
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function startBossJumpSlamAttack() {
  const playerCenterX = centerX(player);
  boss.attackType = "jumpSlam";
  boss.attackDuration = isBossPhaseTwo() ? 70 : 82;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.slamHitDone = false;
  boss.startX = boss.x;
  boss.targetX = clamp(playerCenterX - boss.width / 2, boss.minX, boss.maxX - boss.width);
  boss.vx = 0;
  boss.hidden = false;
  boss.alpha = 1;
  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 기억 파수자가 더 빠르게 내려찍기를 준비합니다."
    : "기억 파수자가 점프 내려찍기를 준비합니다.";
}

function updateBossJumpSlamAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const prepEnd = isBossPhaseTwo() ? 13 : 17;
  const flightEnd = isBossPhaseTwo() ? 49 : 59;

  if (elapsed < prepEnd) {
    boss.x = boss.startX;
    boss.y = boss.baseY;
  } else if (elapsed < flightEnd) {
    const t = (elapsed - prepEnd) / (flightEnd - prepEnd);
    boss.x = boss.startX + (boss.targetX - boss.startX) * t;
    boss.y = boss.baseY - Math.sin(t * Math.PI) * 165;
  } else {
    boss.x = boss.targetX;
    boss.y = boss.baseY;

    if (!boss.slamHitDone) {
      boss.slamHitDone = true;
      spawnBossShockwaves();
      spawnBossSlamParticles();
      startScreenShake(isBossPhaseTwo() ? 18 : 15, isBossPhaseTwo() ? 7 : 5.5);
      gameState.message = "기억 파수자가 착지하며 충격파를 일으켰습니다.";

      if (!isPlayerDamageInvincible() && isColliding(player, getBossSlamHitbox())) {
        takeDamage(boss, "보스의 내려찍기에 맞았습니다.");
      }
    }
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function startBossTeleportSlamAttack() {
  const playerCenterX = centerX(player);
  boss.attackType = "teleportSlam";
  boss.attackDuration = isBossPhaseTwo() ? 66 : 78;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.slamHitDone = false;
  boss.startX = boss.x;
  boss.targetX = clamp(playerCenterX - boss.width / 2, boss.minX, boss.maxX - boss.width);
  boss.targetY = boss.baseY;
  boss.vx = 0;
  boss.hidden = false;
  boss.alpha = 1;
  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 기억 파수자가 순간이동 내려찍기를 준비합니다."
    : "기억 파수자가 순간이동하려 합니다. 붉은 표식을 피하세요.";
  spawnBossTeleportParticles(centerX(boss), centerY(boss));
  startScreenShake(8, 3);
}

function updateBossTeleportSlamAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const vanishFrame = 12;
  const appearFrame = isBossPhaseTwo() ? 32 : 38;
  const impactFrame = isBossPhaseTwo() ? 40 : 48;

  if (elapsed < vanishFrame) {
    boss.alpha = 1 - elapsed / vanishFrame;
    boss.hidden = false;
  } else if (elapsed < appearFrame) {
    boss.alpha = 0.12;
    boss.hidden = true;
    boss.x = boss.startX;
    boss.y = boss.baseY;
  } else if (elapsed < impactFrame) {
    boss.hidden = false;
    boss.alpha = (elapsed - appearFrame) / (impactFrame - appearFrame);
    boss.x = boss.targetX;
    boss.y = boss.baseY - 160 + (elapsed - appearFrame) * 5;
  } else {
    boss.hidden = false;
    boss.alpha = 1;
    boss.x = boss.targetX;
    boss.y = boss.baseY;

    if (!boss.slamHitDone) {
      boss.slamHitDone = true;
      spawnBossTeleportParticles(centerX(boss), centerY(boss));
      spawnBossShockwaves();
      spawnBossSlamParticles();
      startScreenShake(isBossPhaseTwo() ? 20 : 17, isBossPhaseTwo() ? 8 : 6);
      gameState.message = "기억 파수자가 순간이동 후 내려찍었습니다.";

      if (!isPlayerDamageInvincible() && isColliding(player, getBossTeleportSlamHitbox())) {
        takeDamage(boss, "순간이동 내려찍기에 맞았습니다.");
      }
    }
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function startBossLaserAttack() {
  boss.attackType = "laser";
  boss.attackDuration = isBossPhaseTwo() ? 70 : 82;
  boss.attackTimer = boss.attackDuration;
  boss.attackFired = false;
  boss.laserHitDone = false;
  boss.vx = 0;
  boss.hidden = false;
  boss.alpha = 1;
  boss.laserDirection = centerX(player) >= centerX(boss) ? 1 : -1;
  boss.facing = boss.laserDirection;

  const laserHeight = isBossPhaseTwo() ? 30 : 26;
  const bossFloorY = 620;
  boss.laserY = clamp(centerY(player) - laserHeight / 2, 220, bossFloorY - laserHeight - 2);

  gameState.message = isBossPhaseTwo()
    ? "2페이즈: 보스가 빠르게 가로 레이저를 충전합니다."
    : "기억 파수자가 가로 레이저를 충전합니다. 높이를 보고 피하세요.";
  startScreenShake(6, 2.5);
}

function updateBossLaserAttack() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const chargeEnd = isBossPhaseTwo() ? 32 : 40;
  const activeEnd = isBossPhaseTwo() ? 48 : 58;
  boss.vx = 0;
  boss.y = boss.baseY;

  if (elapsed === chargeEnd) {
    boss.attackFired = true;
    spawnBossLaserParticles();
    startScreenShake(isBossPhaseTwo() ? 18 : 15, isBossPhaseTwo() ? 7 : 6);
    gameState.message = "기억 파수자가 레이저를 발사했습니다.";
  }

  if (elapsed >= chargeEnd && elapsed <= activeEnd) {
    if (frameCount % 3 === 0) {
      spawnBossLaserParticles();
    }

    if (!boss.laserHitDone && !isPlayerDamageInvincible() && isColliding(player, getBossLaserHitbox())) {
      boss.laserHitDone = true;
      takeDamage(boss, "가로 레이저에 맞았습니다.");
    }
  }

  boss.attackTimer -= 1;

  if (boss.attackTimer <= 0) {
    finishBossAttack();
  }
}

function finishBossAttack() {
  boss.attackType = "none";
  boss.attackFired = false;
  boss.slamHitDone = false;
  boss.laserHitDone = false;
  boss.hidden = false;
  boss.alpha = 1;
  boss.attackCooldown = boss.attackCooldownMax;
  boss.y = boss.baseY;
}

function getBossSlamHitbox() {
  return {
    x: boss.x - 35,
    y: boss.baseY + boss.height - 38,
    width: boss.width + 70,
    height: 44
  };
}

function getBossTeleportSlamHitbox() {
  return {
    x: boss.targetX - 48,
    y: boss.baseY + boss.height - 45,
    width: boss.width + 96,
    height: 52
  };
}

function getBossLaserHitbox() {
  if (boss.laserDirection === 1) {
    return {
      x: boss.x + boss.width - 4,
      y: boss.laserY,
      width: boss.maxX - boss.x,
      height: isBossPhaseTwo() ? 30 : 26
    };
  }

  return {
    x: boss.minX,
    y: boss.laserY,
    width: boss.x - boss.minX + 4,
    height: isBossPhaseTwo() ? 30 : 26
  };
}

function spawnBossShockwaves() {
  const waveY = boss.baseY + boss.height - 18;
  const waveSpeed = isBossPhaseTwo() ? 5.2 : 4.2;
  const waveLife = isBossPhaseTwo() ? 120 : 110;

  projectiles.push({
    type: "bossWave",
    x: boss.x - 26,
    y: waveY,
    width: 30,
    height: 16,
    vx: -waveSpeed,
    vy: 0,
    life: waveLife,
    sourceName: boss.name
  });

  projectiles.push({
    type: "bossWave",
    x: boss.x + boss.width - 4,
    y: waveY,
    width: 30,
    height: 16,
    vx: waveSpeed,
    vy: 0,
    life: waveLife,
    sourceName: boss.name
  });
}

function damageBoss(direction) {
  if (!boss.alive) {
    return;
  }

  if (boss.hitByAttackId === player.attackId) {
    return;
  }

  boss.hitByAttackId = player.attackId;
  boss.health -= 1;
  boss.hitTimer = 18;
  boss.x += direction * 8;
  boss.x = clamp(boss.x, boss.minX, boss.maxX - boss.width);
  gainCoreEnergy(1);
  startHitStop(6);
  startScreenShake(9, 5);
  addFloatingText("-1", centerX(boss), boss.y - 10, "#fecdd3");
  spawnHitParticles(centerX(boss), centerY(boss), direction);

  if (boss.health <= 0) {
    defeatBoss();
  } else if (isBossPhaseTwo()) {
    gameState.message = "2페이즈입니다. 패턴이 더 빠르게 이어집니다.";
  } else {
    gameState.message = "기억 파수자에게 공격이 맞았습니다.";
  }
}

function defeatBoss() {
  boss.alive = false;
  boss.defeatStarted = true;
  gameState.bossDefeated = true;
  gameState.bossRoomLocked = false;
  gameState.bossClearEffectTimer = 150;
  gameState.message = "기억 파수자를 쓰러뜨렸습니다. 보스방 봉인이 풀리고 원점 코어가 드러났습니다.";
  shardWarnings.length = 0;

  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].type === "bossWave" || projectiles[i].type === "memoryShard") {
      projectiles.splice(i, 1);
    }
  }

  spawnBossDefeatBurst();
  startScreenShake(28, 10);
  addFloatingText("BOSS CLEAR", centerX(boss), boss.y - 28, "#e0f2fe");
}

function spawnEnemyProjectile(enemy) {
  const direction = enemy.shootDirection;

  projectiles.push({
    type: "enemyBullet",
    x: direction === 1 ? enemy.x + enemy.width : enemy.x - 18,
    y: enemy.y + enemy.height / 2 - 4,
    width: 18,
    height: 8,
    vx: direction * 4.6,
    vy: 0,
    life: 150,
    sourceName: enemy.name
  });

  gameState.message = enemy.name + "가 투사체를 발사했습니다.";
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.life -= 1;
    let removeProjectile = false;
    let hitWall = false;

    if (projectile.life <= 0) {
      removeProjectile = true;
    }

    if (projectile.x < -100 || projectile.x > world.width + 100) {
      removeProjectile = true;
    }

    if (projectile.type === "memoryShard" && projectile.y > (projectile.groundY || 620) + 42) {
      removeProjectile = true;
    }

    if (projectile.type !== "memoryShard") {
      for (const object of getSolidObjects()) {
        if (isColliding(projectile, object)) {
          removeProjectile = true;
          hitWall = true;
          break;
        }
      }
    }

    if (removeProjectile) {
      if (projectile.type === "memoryShard") {
        spawnMemoryShardImpact(projectile);
      } else if (hitWall) {
        spawnWallSparkParticles(
          projectile.vx > 0 ? projectile.x + projectile.width : projectile.x,
          projectile.y + projectile.height / 2,
          projectile.vx > 0 ? -1 : 1
        );
        startScreenShake(3, 1.8);
      }

      projectiles.splice(i, 1);
    }
  }
}

function spawnMemoryShardImpact(projectile) {
  const impactY = projectile.groundY || projectile.y;

  for (let i = 0; i < 10; i++) {
    addDashStreak(
      projectile.x + projectile.width / 2,
      impactY,
      (Math.random() - 0.5) * 2.2,
      -0.3 - Math.random() * 1.5,
      8 + Math.random() * 10,
      2 + Math.random() * 3,
      12 + Math.random() * 8,
      "rgba(125, 211, 252, 1)",
      Math.random() * Math.PI
    );
  }
}

function checkProjectileDamage() {
  if (isPlayerDamageInvincible()) {
    return;
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];

    if (!isColliding(projectile, player)) {
      continue;
    }

    const damageSource = { x: projectile.x, width: projectile.width };
    projectiles.splice(i, 1);

    if (projectile.type === "bossWave") {
      takeDamage(damageSource, "보스의 충격파에 맞았습니다.");
    } else if (projectile.type === "memoryShard") {
      takeDamage(damageSource, "떨어지는 기억 파편에 맞았습니다.");
    } else {
      takeDamage(damageSource, "원거리 투사체에 맞았습니다.");
    }

    return;
  }
}

function checkAttackHits() {
  if (player.attackTimer <= 0) {
    return;
  }

  const rawHitbox = getAttackHitbox();
  let hitbox = rawHitbox;

  if (player.attackDirection === "side") {
    hitbox = getClippedHitboxByWalls(rawHitbox, player, player.facing);
  }

  if (player.attackDirection === "side" && isHitboxClipped(rawHitbox, hitbox)) {
    if (player.lastWallSparkAttackId !== player.attackId) {
      player.lastWallSparkAttackId = player.attackId;
      const point = getWallSparkPoint(hitbox, player.facing);
      spawnWallSparkParticles(point.x, point.y, -player.facing);
      gameState.message = "공격이 벽에 막혔습니다.";
    }
  }

  if (hitbox.width <= 2 || hitbox.height <= 2) {
    return;
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.hitByAttackId === player.attackId) {
      continue;
    }

    if (isColliding(hitbox, enemy)) {
      enemy.hitByAttackId = player.attackId;
      enemy.health -= 1;
      enemy.hitTimer = 18;
      enemy.invincibleTimer = 12;
      gainCoreEnergy(1);

      if (player.attackDirection === "side") {
        knockbackEnemy(enemy, player.facing, 16);
      } else {
        knockbackEnemy(enemy, player.facing, 6);
      }

      applyAttackRecoilOnHit(enemy);
      startHitStop(5);
      startScreenShake(8, 5);
      addFloatingText("-1", centerX(enemy), enemy.y - 8, "#fecaca");
      spawnHitParticles(centerX(enemy), centerY(enemy), player.facing);

      if (enemy.health <= 0) {
        enemy.alive = false;
        gameState.message = enemy.name + "를 쓰러뜨렸습니다. 코어 에너지 획득.";
      } else if (player.attackDirection !== "down") {
        gameState.message = enemy.name + "에게 공격이 맞았습니다. 코어 에너지 +1";
      }
    }
  }

  if (boss.alive && !boss.hidden && isColliding(hitbox, boss)) {
    applyAttackRecoilOnHit(boss);
    damageBoss(player.facing);
  }
}

function checkEnemyAttackDamage() {
  if (isPlayerDamageInvincible()) {
    return;
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type !== "melee") {
      continue;
    }

    if (!isEnemyAttackActive(enemy)) {
      continue;
    }

    if (enemy.attackHitPlayer) {
      continue;
    }

    const hitbox = getBlockedEnemyAttackHitbox(enemy);

    if (isColliding(hitbox, player)) {
      enemy.attackHitPlayer = true;
      takeDamage(enemy, enemy.name + "의 공격에 맞았습니다.");
      return;
    }
  }
}

function checkPlayerEnemyDamage() {
  if (player.isDashing) {
    return;
  }

  if (isPlayerDamageInvincible()) {
    return;
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type === "melee" && enemy.attackTimer > 0) {
      continue;
    }

    const contactBox = getEnemyContactHitbox(enemy);

    if (isColliding(player, contactBox)) {
      takeDamage(enemy, enemy.name + "와 부딪혀 체력이 1 감소했습니다.");
      return;
    }
  }

  if (boss.alive && !boss.hidden && player.x > 19500 && boss.contactCooldown <= 0 && isColliding(player, boss)) {
    boss.contactCooldown = 45;
    takeDamage(boss, "기억 파수자와 충돌했습니다.");
  }
}

function takeDamage(source, message) {
  if (player.healTimer > 0) {
    player.healTimer = 0;
    player.healingWillRestore = false;
  }

  player.health -= 1;
  player.invincibleTimer = 75;
  player.dashInvincibleTimer = 0;
  const playerCenterX = centerX(player);
  const sourceCenterX = source.x + source.width / 2;

  if (playerCenterX < sourceCenterX) {
    player.vx = -7;
    player.facing = 1;
  } else {
    player.vx = 7;
    player.facing = -1;
  }

  player.vy = -7;
  player.isDashing = false;
  startHitStop(4);
  startScreenShake(12, 7);
  spawnPlayerDamageParticles();
  addFloatingText("-1", centerX(player), player.y - 10, "#fca5a5");

  if (player.health <= 0) {
    respawnPlayer();
  } else {
    gameState.message = message;
  }
}

function updateGameStateTimers() {
  if (gameState.bossClearEffectTimer > 0) {
    gameState.bossClearEffectTimer -= 1;
  }

  if (gameState.bossPhaseBannerTimer > 0) {
    gameState.bossPhaseBannerTimer -= 1;
  }

  if (gameState.bossStartBannerTimer > 0) {
    gameState.bossStartBannerTimer -= 1;
  }
}

function updateEndingSequence() {
  if (!gameState.endingReached) {
    return;
  }

  gameState.endingFrame += 1;
  player.vx = 0;
  player.vy = 0;
  player.isDashing = false;
  player.attackTimer = 0;
  player.healTimer = 0;
  player.healingWillRestore = false;

  if (gameState.endingFrame >= 760) {
    gameState.endingInputUnlocked = true;
  }
}

function getPlayerState() {
  if (player.isDashing) {
    return "dash";
  }

  if (player.healTimer > 0) {
    return "heal";
  }

  if (player.attackTimer > 0) {
    return "attack";
  }

  if (player.isWallSliding) {
    return "wallSlide";
  }

  if (!player.onGround && player.vy < 0) {
    return "jump";
  }

  if (!player.onGround && player.vy >= 0) {
    return "fall";
  }

  if (Math.abs(player.vx) > 0.25) {
    return "walk";
  }

  return "idle";
}

function getStateName(state) {
  return characterVisuals[state] ? characterVisuals[state].name : "알 수 없음";
}

function updatePlayerAnimation() {
  const nextState = getPlayerState();

  if (nextState !== playerAnimation.state) {
    playerAnimation.previousState = playerAnimation.state;
    playerAnimation.state = nextState;
    playerAnimation.stateFrame = 0;
  } else {
    playerAnimation.stateFrame += 1;
  }
}

function getCurrentTutorialRoom() {
  const px = centerX(player);

  for (const room of tutorialRooms) {
    if (px >= room.x && px < room.x + room.width) {
      return room;
    }
  }

  return null;
}

function clampCameraToBounds(targetX, targetY, bounds) {
  const minX = bounds.x;
  const maxX = Math.max(bounds.x, bounds.x + bounds.width - camera.width);
  const minY = bounds.y;
  const maxY = Math.max(bounds.y, bounds.y + bounds.height - camera.height);

  return {
    x: clamp(targetX, minX, maxX),
    y: clamp(targetY, minY, maxY)
  };
}

function updateCamera() {
  // v56 보강: 튜토리얼 1화면 방은 카메라를 고정하고, 2화면 방은 같은 방 안에서만 따라오도록 제한한다.
  let targetX = centerX(player) - camera.width / 2;
  let targetY = centerY(player) - camera.height / 2;

  const tutorialRoom = getCurrentTutorialRoom();

  if (tutorialRoom) {
    if (tutorialRoom.cameraMode === "fixed") {
      targetX = tutorialRoom.cameraX;
      targetY = tutorialRoom.cameraY;
    } else {
      const bounds = {
        x: tutorialRoom.x,
        y: tutorialRoom.cameraY,
        width: tutorialRoom.width,
        height: Math.max(camera.height, tutorialRoom.height)
      };
      const clamped = clampCameraToBounds(targetX, targetY, bounds);
      targetX = clamped.x;
      targetY = clamped.y;
    }
  } else if (gameState.bossFightStarted && player.x > 10800 && boss.alive) {
    const midpointX = (centerX(player) + centerX(boss)) / 2;
    const midpointY = (centerY(player) + centerY(boss)) / 2;

    targetX = midpointX - camera.width / 2;
    targetY = midpointY - camera.height / 2 + 35;
    targetX = clamp(targetX, 10800, 12600 - camera.width);

    if (camera.bossFocusTimer > 0) {
      camera.bossFocusTimer -= 1;
    }
  } else {
    const currentRoom = getCurrentRoom();

    if (currentRoom && currentRoom.cameraBounds) {
      const clamped = clampCameraToBounds(targetX, targetY, currentRoom.cameraBounds);
      targetX = clamped.x;
      targetY = clamped.y;
    }
  }

  targetX = clamp(targetX, 0, world.width - camera.width);
  targetY = clamp(targetY, 0, world.height - camera.height);

  const distanceX = targetX - camera.x;
  const distanceY = targetY - camera.y;
  const smoothX = Math.abs(distanceX) > camera.snapDistanceX ? 0.32 : camera.smoothnessX;
  const smoothY = Math.abs(distanceY) > camera.snapDistanceY ? 0.24 : camera.smoothnessY;

  camera.x += distanceX * smoothX;
  camera.y += distanceY * smoothY;

  if (tutorialRoom && tutorialRoom.cameraMode === "fixed") {
    camera.x = targetX;
    camera.y = targetY;
  }

  camera.x = Math.round(clamp(camera.x, 0, world.width - camera.width) * 100) / 100;
  camera.y = Math.round(clamp(camera.y, 0, world.height - camera.height) * 100) / 100;

  updateScreenShake();
}

function updateProjectilesAndDamage() {
  updateProjectiles();
  checkProjectileDamage();
}

function update() {
  frameCount += 1;

  if (hitStopTimer > 0) {
    hitStopTimer -= 1;
    updateParticles();
    updateFloatingTexts();
    updateCamera();
    return;
  }

  updateGameStateTimers();

  if (gameState.endingReached) {
    updateEndingSequence();
    updatePlayerAnimation();
    updateParticles();
    updateFloatingTexts();
    updateCamera();
    return;
  }

  updatePlayer();
  startBossFightIfNeeded();
  updatePlayerAnimation();
  updatePlayerCombat();
  updateEnemies();
  updateBoss();
  updateShardWarnings();
  updateProjectilesAndDamage();
  checkAttackHits();
  checkEnemyAttackDamage();
  checkPlayerEnemyDamage();
  updateParticles();
  updateFloatingTexts();
  updateCamera();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawTutorialRoomFrames() {
  for (const room of tutorialRoomFrames) {
    const screenX = room.x - camera.x;
    const screenY = room.y - camera.y;

    ctx.save();
    ctx.globalAlpha = 0.44;
    ctx.strokeStyle = room.mode === "fixed" ? "#93c5fd" : "#a78bfa";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, room.width, room.height);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = room.mode === "fixed" ? "#1d4ed8" : "#6d28d9";
    ctx.fillRect(screenX, screenY, room.width, room.height);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#dbeafe";
    ctx.font = "bold 17px Arial";
    ctx.fillText(room.title, screenX + 28, screenY + 34);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px Arial";
    ctx.fillText(room.mode === "fixed" ? "고정 카메라 방" : "추적 카메라 방", screenX + 28, screenY + 56);
    ctx.restore();
  }
}

function drawTutorialSigns() {
  for (const sign of tutorialSigns) {
    const screenX = sign.x - camera.x;
    const screenY = sign.y - camera.y;

    // 표지판은 공중 안내문이 아니라 바닥에 세워진 오브젝트처럼 보이게 그린다.
    ctx.save();
    ctx.fillStyle = "rgba(30, 41, 59, 0.92)";
    ctx.fillRect(screenX + 22, screenY + sign.height - 6, 12, 52);
    ctx.fillRect(screenX + sign.width - 34, screenY + sign.height - 6, 12, 52);

    ctx.fillStyle = "rgba(15, 23, 42, 0.96)";
    drawRoundedRect(screenX, screenY, sign.width, sign.height, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(250, 204, 21, 0.95)";
    ctx.lineWidth = 2.5;
    drawRoundedRect(screenX, screenY, sign.width, sign.height, 10);
    ctx.stroke();

    ctx.fillStyle = "rgba(250, 204, 21, 0.18)";
    ctx.fillRect(screenX + 12, screenY + 40, sign.width - 24, 2);

    ctx.fillStyle = "#fef3c7";
    ctx.font = "bold 18px Arial";
    ctx.fillText(sign.title, screenX + 18, screenY + 29);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "14px Arial";

    for (let i = 0; i < sign.lines.length; i++) {
      ctx.fillText(sign.lines[i], screenX + 18, screenY + 61 + i * 23);
    }

    ctx.restore();
  }
}

function drawCheckpoints() {
  for (const checkpoint of checkpoints) {
    const screenX = checkpoint.x - camera.x;
    const screenY = checkpoint.y - camera.y;
    const isActive = activeCheckpoint === checkpoint;
    const pulse = 0.5 + Math.sin(frameCount * 0.08) * 0.15;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = isActive ? "#38bdf8" : "#475569";
    ctx.fillRect(screenX + 11, screenY + 12, 14, checkpoint.height - 12);
    ctx.fillStyle = isActive ? "rgba(125, 211, 252, 0.55)" : "rgba(148, 163, 184, 0.35)";
    ctx.beginPath();
    ctx.arc(screenX + checkpoint.width / 2, screenY + 12, 15 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isActive ? "#e0f2fe" : "#94a3b8";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, checkpoint.width, checkpoint.height);
    ctx.fillStyle = isActive ? "#e0f2fe" : "#cbd5e1";
    ctx.font = "12px Arial";
    ctx.fillText(isActive ? "활성" : "저장", screenX - 2, screenY - 8);
    ctx.restore();
  }
}

function drawRoomBackgrounds() {
  for (const room of rooms) {
    ctx.fillStyle = room.color;
    ctx.fillRect(room.x - camera.x, 0 - camera.y, room.width, world.height);
  }

  for (const room of rooms) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x - camera.x, 0 - camera.y, room.width, world.height);
  }
}

function drawBackgroundDecorations() {
  for (let x = 180; x < world.width; x += 360) {
    ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
    ctx.fillRect(x - camera.x, 120 - camera.y, 70, 300);
  }

  for (let x = 0; x < world.width; x += 120) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(x - camera.x, 0 - camera.y, 2, world.height);
  }
}

function drawBossRoomDecorations() {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#7dd3fc";
  ctx.lineWidth = 2;

  for (let x = 10920; x <= 12300; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x - camera.x, 80 - camera.y);
    ctx.lineTo(x + 35 - camera.x, 390 - camera.y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#38bdf8";

  for (let x = 10980; x <= 12240; x += 220) {
    ctx.beginPath();
    ctx.arc(x - camera.x, 155 - camera.y, 22 + Math.sin(frameCount * 0.04 + x) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.arc(11700 - camera.x, 420 - camera.y, 170 + Math.sin(frameCount * 0.035) * 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDashHazards() {
  for (const hazard of dashHazards) {
    const screenX = hazard.x - camera.x;
    const screenY = hazard.y - camera.y;
    const pulse = 0.42 + Math.sin(frameCount * 0.12) * 0.12;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#7c2d12";
    drawRoundedRect(screenX, screenY, hazard.width, hazard.height, 10);
    ctx.fill();

    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = 2;
    drawRoundedRect(screenX, screenY, hazard.width, hazard.height, 10);
    ctx.stroke();

    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#fed7aa";
    ctx.fillRect(screenX + hazard.width * 0.28, screenY + 12, hazard.width * 0.44, hazard.height - 24);

    ctx.globalAlpha = 0.38;
    ctx.fillStyle = "#facc15";
    for (let y = 12; y < hazard.height; y += 38) {
      ctx.fillRect(screenX + 9, screenY + y, hazard.width - 18, 8);
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fef3c7";
    ctx.font = "12px Arial";
    ctx.fillText("대시", screenX - 2, screenY - 8);
    ctx.restore();
  }
}

function drawPlatforms() {
  for (const platform of platforms) {
    const screenX = platform.x - camera.x;
    const screenY = platform.y - camera.y;

    if (platform.wallJumpTest) {
      ctx.fillStyle = platform.abilityChallenge === "wallJump" ? "#1e3a5f" : "#1e293b";
      ctx.fillRect(screenX, screenY, platform.width, platform.height);
      ctx.fillStyle = platform.abilityChallenge === "wallJump" ? "#7dd3fc" : "rgba(125, 211, 252, 0.55)";
      ctx.fillRect(screenX, screenY, 5, platform.height);
      ctx.fillRect(screenX + platform.width - 5, screenY, 5, platform.height);
      ctx.strokeStyle = "rgba(125, 211, 252, 0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, platform.width, platform.height);
    } else if (platform.abilityChallenge === "dash") {
      ctx.fillStyle = "#3f2a16";
      ctx.fillRect(screenX, screenY, platform.width, platform.height);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(screenX, screenY, platform.width, 5);
      ctx.strokeStyle = "rgba(253, 230, 138, 0.72)";
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, platform.width, platform.height);
    } else if (platform.abilityChallenge === "pogo") {
      ctx.fillStyle = "#16332a";
      ctx.fillRect(screenX, screenY, platform.width, platform.height);
      ctx.fillStyle = "#86efac";
      ctx.fillRect(screenX, screenY, platform.width, 5);
      ctx.strokeStyle = "rgba(187, 247, 208, 0.72)";
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, platform.width, platform.height);
    } else if (platform.requiresDoubleJump) {
      ctx.fillStyle = player.hasDoubleJump ? "#4c1d95" : "rgba(76, 29, 149, 0.42)";
      ctx.fillRect(screenX, screenY, platform.width, platform.height);
      ctx.fillStyle = player.hasDoubleJump ? "#a78bfa" : "rgba(167, 139, 250, 0.45)";
      ctx.fillRect(screenX, screenY, platform.width, 5);
      ctx.strokeStyle = "rgba(216, 180, 254, 0.75)";
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, platform.width, platform.height);
    } else {
      ctx.fillStyle = "#475569";
      ctx.fillRect(screenX, screenY, platform.width, platform.height);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(screenX, screenY, platform.width, 5);
    }
  }
}

function drawDoors() {
  for (const door of doors) {
    const screenX = door.x - camera.x;
    const screenY = door.y - camera.y;

    if (door.requiresMemoryCores) {
      drawMemoryCoreDoor(door, screenX, screenY);
      continue;
    }

    if (door.requiresMemoryFragments) {
      drawMemoryFragmentDoor(door, screenX, screenY);
      continue;
    }

    drawNormalDoor(door, screenX, screenY);
  }
}

function drawMemoryCoreDoor(door, screenX, screenY) {
  if (door.open) {
    ctx.fillStyle = "rgba(14, 165, 233, 0.22)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "13px Arial";
    ctx.fillText("열린 최종 문", screenX - 26, screenY - 8);
  } else {
    ctx.fillStyle = "rgba(14, 116, 144, 0.58)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "13px Arial";
    ctx.fillText("기억 핵 1개 필요", screenX - 40, screenY - 8);
  }
}

function drawMemoryFragmentDoor(door, screenX, screenY) {
  if (door.open) {
    ctx.fillStyle = "rgba(168, 85, 247, 0.22)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#c4b5fd";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#ddd6fe";
    ctx.font = "13px Arial";
    ctx.fillText("열린 기억의 문", screenX - 28, screenY - 8);
  } else {
    ctx.fillStyle = "rgba(126, 34, 206, 0.58)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#fef3c7";
    ctx.font = "13px Arial";
    ctx.fillText("기억 조각 1개 필요", screenX - 44, screenY - 8);
  }
}

function drawNormalDoor(door, screenX, screenY) {
  if (door.locked && !door.open) {
    ctx.fillStyle = "rgba(248, 113, 113, 0.55)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#fee2e2";
    ctx.font = "13px Arial";
    ctx.fillText(door.text, screenX - 10, screenY - 8);
  } else if (door.locked && door.open) {
    ctx.fillStyle = "rgba(34, 197, 94, 0.28)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#86efac";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#bbf7d0";
    ctx.font = "13px Arial";
    ctx.fillText("열린 문", screenX - 7, screenY - 8);
  } else {
    ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
    ctx.fillRect(screenX, screenY, door.width, door.height);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, door.width, door.height);
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "13px Arial";
    ctx.fillText(door.text, screenX - 3, screenY - 8);
  }
}

function drawBossArenaGates() {
  if (!isBossGateActive()) {
    return;
  }

  for (const gate of bossArenaGates) {
    const screenX = gate.x - camera.x;
    const screenY = gate.y - camera.y;
    const pulse = Math.sin(frameCount * 0.15) * 0.12 + 0.58;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(screenX, screenY, gate.width, gate.height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#fecdd3";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, screenY, gate.width, gate.height);
    ctx.fillStyle = "#fecdd3";
    ctx.font = "13px Arial";
    ctx.fillText("봉인", screenX - 2, screenY - 8);
    ctx.restore();
  }
}

function drawKeyItem() {
  if (keyItem.collected) {
    return;
  }

  const screenX = keyItem.x - camera.x;
  const screenY = keyItem.y - camera.y;
  ctx.fillStyle = "#facc15";
  ctx.fillRect(screenX, screenY + 8, 18, 8);
  ctx.fillRect(screenX + 14, screenY + 4, 8, 16);
  ctx.fillRect(screenX + 20, screenY + 10, 5, 5);
  ctx.fillStyle = "#fef08a";
  ctx.font = "13px Arial";
  ctx.fillText("열쇠", screenX - 4, screenY - 8);
}

function drawAbilityItems() {
  for (const item of abilityItems) {
    if (item.collected) {
      continue;
    }

    const screenX = item.x - camera.x;
    const screenY = item.y - camera.y;
    const pulse = Math.sin(frameCount * 0.12) * 3;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#c4b5fd";
    ctx.beginPath();
    ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 22 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#312e81";
    ctx.strokeStyle = "#c4b5fd";
    ctx.lineWidth = 2;
    drawRoundedRect(screenX, screenY, item.width, item.height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#e9d5ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY + 18);
    ctx.quadraticCurveTo(screenX + 14, screenY + 7, screenX + 20, screenY + 18);
    ctx.stroke();
    ctx.fillStyle = "#ede9fe";
    ctx.font = "13px Arial";
    ctx.fillText(item.name, screenX - 12, screenY - 10);
    ctx.restore();
  }
}

function drawRewardItems() {
  for (const item of rewardItems) {
    if (item.collected) {
      continue;
    }

    if (item.requiresBossDefeated && !gameState.bossDefeated) {
      continue;
    }

    const screenX = item.x - camera.x;
    const screenY = item.y - camera.y;
    const pulse = Math.sin(frameCount * 0.14) * 3;
    ctx.save();

    if (item.type === "originCore") {
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = "#7dd3fc";
      ctx.beginPath();
      ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 28 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#0c4a6e";
      ctx.strokeStyle = "#e0f2fe";
    } else if (item.type === "memoryCore") {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#c4b5fd";
      ctx.beginPath();
      ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 24 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#581c87";
      ctx.strokeStyle = "#e9d5ff";
    } else if (item.type === "healthCore") {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 22 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#7f1d1d";
      ctx.strokeStyle = "#fecdd3";
    } else if (item.type === "coreCapacity") {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#86efac";
      ctx.beginPath();
      ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 22 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#14532d";
      ctx.strokeStyle = "#bbf7d0";
    } else {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(screenX + item.width / 2, screenY + item.height / 2, 20 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#78350f";
      ctx.strokeStyle = "#fde68a";
    }

    ctx.lineWidth = 2;
    drawRoundedRect(screenX, screenY, item.width, item.height, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = item.type === "originCore" ? "#e0f2fe" : item.type === "memoryCore" ? "#f5d0fe" : item.type === "healthCore" ? "#fecdd3" : item.type === "coreCapacity" ? "#bbf7d0" : "#fef3c7";
    ctx.beginPath();
    ctx.arc(screenX + item.width / 2, screenY + item.height / 2, item.type === "originCore" ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "13px Arial";
    ctx.fillText(item.name, screenX - 14, screenY - 10);
    ctx.restore();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type === "flying") {
      drawFlyingEnemy(enemy);
    } else if (enemy.type === "shooter") {
      drawShooterEnemy(enemy);
    } else {
      drawMeleeEnemy(enemy);
    }
  }
}

function drawEnemyHealthBar(enemy, screenX, screenY) {
  const barWidth = 38;
  const barHeight = 5;
  const healthRatio = enemy.health / enemy.maxHealth;
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(screenX - 1, screenY - 13, barWidth, barHeight);
  ctx.fillStyle = "#f87171";
  ctx.fillRect(screenX - 1, screenY - 13, barWidth * healthRatio, barHeight);
}

function drawMeleeEnemy(enemy) {
  const screenX = enemy.x - camera.x;
  const screenY = enemy.y - camera.y;
  const facing = enemy.attackTimer > 0 ? enemy.attackDirection : enemy.vx >= 0 ? 1 : -1;
  ctx.save();

  if (enemy.hitTimer > 0) {
    ctx.translate(Math.sin(enemy.hitTimer * 2) * 2, 0);
    ctx.globalAlpha = 0.65;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(screenX + enemy.width / 2, screenY + enemy.height + 4, enemy.width / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.attackTimer > 0 ? "#3b1d1d" : enemy.hitTimer > 0 ? "#3f1f2a" : "#1f2937";
  ctx.strokeStyle = enemy.attackTimer > 0 ? "#fca5a5" : enemy.hitTimer > 0 ? "#fecaca" : "#94a3b8";
  ctx.lineWidth = enemy.attackTimer > 0 || enemy.hitTimer > 0 ? 3 : 2;
  ctx.beginPath();
  ctx.ellipse(screenX + enemy.width / 2, screenY + enemy.height / 2, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = enemy.attackTimer > 0 ? "#fecaca" : "#38bdf8";

  if (facing === 1) {
    ctx.fillRect(screenX + 20, screenY + 12, 4, 6);
    ctx.fillRect(screenX + 27, screenY + 12, 4, 6);
  } else {
    ctx.fillRect(screenX + 4, screenY + 12, 4, 6);
    ctx.fillRect(screenX + 11, screenY + 12, 4, 6);
  }

  drawEnemyHealthBar(enemy, screenX, screenY);
  ctx.restore();
}

function drawFlyingEnemy(enemy) {
  const screenX = enemy.x - camera.x;
  const screenY = enemy.y - camera.y;
  const wing = Math.sin(frameCount * 0.35) * 6;
  ctx.save();

  if (enemy.hitTimer > 0) {
    ctx.translate(Math.sin(enemy.hitTimer * 2) * 2, 0);
    ctx.globalAlpha = 0.65;
  }

  ctx.fillStyle = enemy.hitTimer > 0 ? "#4c1d2d" : "#1e1b4b";
  ctx.strokeStyle = enemy.hitTimer > 0 ? "#fecaca" : "#c4b5fd";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screenX + 8, screenY + 14);
  ctx.quadraticCurveTo(screenX - 10, screenY + 2 + wing, screenX - 2, screenY + 24);
  ctx.quadraticCurveTo(screenX + 8, screenY + 20, screenX + 12, screenY + 16);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(screenX + enemy.width - 8, screenY + 14);
  ctx.quadraticCurveTo(screenX + enemy.width + 10, screenY + 2 + wing, screenX + enemy.width + 2, screenY + 24);
  ctx.quadraticCurveTo(screenX + enemy.width - 8, screenY + 20, screenX + enemy.width - 12, screenY + 16);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(screenX + enemy.width / 2, screenY + enemy.height / 2, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(screenX + 11, screenY + 11, 4, 5);
  ctx.fillRect(screenX + 23, screenY + 11, 4, 5);
  drawEnemyHealthBar(enemy, screenX, screenY);
  ctx.restore();
}

function drawShooterEnemy(enemy) {
  const screenX = enemy.x - camera.x;
  const screenY = enemy.y - camera.y;
  const facing = enemy.shootDirection;
  ctx.save();

  if (enemy.hitTimer > 0) {
    ctx.translate(Math.sin(enemy.hitTimer * 2) * 2, 0);
    ctx.globalAlpha = 0.65;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(screenX + enemy.width / 2, screenY + enemy.height + 4, enemy.width / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.shootTimer > 0 ? "#3b1d1d" : "#10251f";
  ctx.strokeStyle = enemy.shootTimer > 0 ? "#fca5a5" : "#86efac";
  ctx.lineWidth = enemy.shootTimer > 0 ? 3 : 2;
  drawRoundedRect(screenX + 5, screenY + 2, 26, 38, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = enemy.shootTimer > 0 ? "#fecaca" : "#bbf7d0";
  ctx.beginPath();
  ctx.arc(screenX + 18, screenY + 18, enemy.shootTimer > 0 ? 7 : 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#020617";

  if (facing === 1) {
    ctx.fillRect(screenX + 22, screenY + 15, 4, 6);
  } else {
    ctx.fillRect(screenX + 10, screenY + 15, 4, 6);
  }

  drawEnemyHealthBar(enemy, screenX, screenY);
  ctx.restore();
}

function drawBoss() {
  if (!boss.alive) {
    return;
  }

  const screenX = boss.x - camera.x;
  const screenY = boss.y - camera.y;
  const pulse = Math.sin(frameCount * 0.08) * 3;
  const phaseTwo = isBossPhaseTwo();
  ctx.save();
  ctx.globalAlpha = boss.alpha;

  if (boss.hitTimer > 0) {
    ctx.translate(Math.sin(boss.hitTimer * 2.5) * 3, 0);
    ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.75);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.ellipse(screenX + boss.width / 2, boss.baseY - camera.y + boss.height + 6, boss.width / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (boss.attackTimer > 0) {
    ctx.globalAlpha = Math.min(0.35, boss.alpha);
    ctx.fillStyle = boss.attackType === "laser" ? "#fb7185" : boss.attackType === "teleportSlam" ? "#c4b5fd" : boss.attackType === "jumpSlam" ? "#facc15" : "#7dd3fc";
    ctx.beginPath();
    ctx.arc(screenX + boss.width / 2, screenY + boss.height / 2, 58 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = boss.alpha;
  }

  ctx.fillStyle = boss.hitTimer > 0 ? "#7f1d1d" : phaseTwo ? "#4c0519" : "#1e1b4b";
  ctx.strokeStyle = boss.attackTimer > 0 ? "#fb7185" : phaseTwo ? "#fecdd3" : "#c4b5fd";
  ctx.lineWidth = boss.attackTimer > 0 ? 4 : 3;
  drawRoundedRect(screenX + 10, screenY + 12, 52, 56, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = phaseTwo ? "#881337" : "#312e81";
  ctx.strokeStyle = "#e9d5ff";
  ctx.lineWidth = 2;
  drawRoundedRect(screenX + 14, screenY + 2, 44, 32, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = phaseTwo ? "#fecdd3" : "#e9d5ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(screenX + 19, screenY + 7);
  ctx.quadraticCurveTo(screenX + 8, screenY - 12, screenX + 4, screenY - 24);
  ctx.moveTo(screenX + 53, screenY + 7);
  ctx.quadraticCurveTo(screenX + 64, screenY - 12, screenX + 68, screenY - 24);
  ctx.stroke();
  ctx.fillStyle = boss.attackType === "laser" ? "#fecaca" : "#fef3c7";

  if (boss.facing === 1) {
    ctx.fillRect(screenX + 35, screenY + 16, 5, 8);
    ctx.fillRect(screenX + 47, screenY + 16, 5, 8);
  } else {
    ctx.fillRect(screenX + 20, screenY + 16, 5, 8);
    ctx.fillRect(screenX + 32, screenY + 16, 5, 8);
  }

  ctx.strokeStyle = phaseTwo ? "#fda4af" : "#7dd3fc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(screenX + 36, screenY + 43, 9 + pulse * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyAttacks() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    if (enemy.type === "melee") {
      drawMeleeEnemyAttack(enemy);
    }

    if (enemy.type === "shooter") {
      drawShooterCharge(enemy);
    }
  }

  drawBossAttackWarning();
}

function drawMeleeEnemyAttack(enemy) {
  if (enemy.attackTimer <= 0) {
    return;
  }

  const hitbox = getBlockedEnemyAttackHitbox(enemy);

  if (hitbox.width <= 2) {
    return;
  }

  const screenX = hitbox.x - camera.x;
  const screenY = hitbox.y - camera.y;
  const active = isEnemyAttackActive(enemy);
  ctx.save();

  if (!active) {
    ctx.globalAlpha = 0.24 + Math.sin(frameCount * 0.35) * 0.08;
    ctx.fillStyle = "#ef4444";
    drawRoundedRect(screenX, screenY, hitbox.width, hitbox.height, 12);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "#fca5a5";
    ctx.lineWidth = 2;
    drawRoundedRect(screenX, screenY, hitbox.width, hitbox.height, 12);
    ctx.stroke();
    ctx.fillStyle = "#fecaca";
    ctx.font = "18px Arial";
    ctx.fillText("!", screenX + hitbox.width / 2 - 4, screenY - 6);
  } else {
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = "#ef4444";
    drawRoundedRect(screenX, screenY, hitbox.width, hitbox.height, 14);
    ctx.fill();
  }

  ctx.restore();
}

function drawShooterCharge(enemy) {
  if (enemy.shootTimer <= 0) {
    return;
  }

  const startX = enemy.shootDirection === 1 ? enemy.x + enemy.width : enemy.x;
  const startY = enemy.y + enemy.height / 2;
  const screenX = startX - camera.x;
  const screenY = startY - camera.y;
  ctx.save();
  ctx.globalAlpha = 0.25 + Math.sin(frameCount * 0.35) * 0.08;
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + enemy.shootDirection * 180, screenY);
  ctx.stroke();
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = "#fecaca";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + enemy.shootDirection * 180, screenY);
  ctx.stroke();
  ctx.fillStyle = "#fecaca";
  ctx.font = "18px Arial";
  ctx.fillText("!", screenX - 4, screenY - 18);
  ctx.restore();
}

function drawBossAttackWarning() {
  if (!boss.alive || boss.attackTimer <= 0) {
    return;
  }

  ctx.save();

  if (boss.attackType === "shardRain") {
    drawBossShardRainWarning();
  } else if (boss.attackType === "shockwave") {
    drawBossShockwaveWarning();
  } else if (boss.attackType === "jumpSlam") {
    drawBossJumpSlamWarning();
  } else if (boss.attackType === "teleportSlam") {
    drawBossTeleportSlamWarning();
  } else if (boss.attackType === "laser") {
    drawBossLaserWarning();
  }

  ctx.restore();
}

function drawBossShardRainWarning() {
  const screenX = boss.x - camera.x;
  const screenY = boss.y - camera.y;
  ctx.globalAlpha = 0.22 + Math.sin(frameCount * 0.3) * 0.08;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(10920 - camera.x, 250 - camera.y, 1380, 44);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 22px Arial";
  ctx.fillText("기억 파편 낙하", screenX - 20, screenY - 22);
}

function drawBossShockwaveWarning() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const fireFrame = isBossPhaseTwo() ? 21 : 27;
  const screenX = boss.x - camera.x;
  const screenY = boss.baseY - camera.y;

  if (elapsed < fireFrame) {
    ctx.globalAlpha = 0.2 + Math.sin(frameCount * 0.35) * 0.08;
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(screenX - 170, screenY + boss.height - 18, boss.width + 340, 18);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#fecdd3";
    ctx.font = "22px Arial";
    ctx.fillText("!", screenX + boss.width / 2 - 5, screenY - 14);
  }
}

function drawBossJumpSlamWarning() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const prepEnd = isBossPhaseTwo() ? 13 : 17;
  const screenX = boss.targetX - camera.x;
  const screenY = boss.baseY - camera.y;
  ctx.globalAlpha = elapsed < prepEnd ? 0.24 + Math.sin(frameCount * 0.4) * 0.08 : 0.16 + Math.sin(frameCount * 0.4) * 0.06;
  ctx.fillStyle = "#facc15";
  drawRoundedRect(screenX - 45, screenY + boss.height - 28, boss.width + 90, 28, 10);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 3;
  drawRoundedRect(screenX - 45, screenY + boss.height - 28, boss.width + 90, 28, 10);
  ctx.stroke();
  ctx.fillStyle = "#fef3c7";
  ctx.font = "22px Arial";
  ctx.fillText("!", screenX + boss.width / 2 - 5, screenY - 18);
}

function drawBossTeleportSlamWarning() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const appearFrame = isBossPhaseTwo() ? 32 : 38;
  const screenX = boss.targetX + boss.width / 2 - camera.x;
  const groundY = boss.baseY + boss.height - camera.y;
  const progress = Math.min(1, elapsed / appearFrame);
  ctx.globalAlpha = 0.25 + progress * 0.45;
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.ellipse(screenX, groundY - 10, 42 + progress * 18, 12 + progress * 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#fecdd3";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(screenX, groundY - 10, 30 + progress * 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#fecdd3";
  ctx.font = "bold 20px Arial";
  ctx.fillText("순간이동", screenX - 38, groundY - 44);
}

function drawBossLaserWarning() {
  const elapsed = boss.attackDuration - boss.attackTimer;
  const chargeEnd = isBossPhaseTwo() ? 32 : 40;
  const activeEnd = isBossPhaseTwo() ? 48 : 58;
  const hitbox = getBossLaserHitbox();
  const screenX = hitbox.x - camera.x;
  const screenY = hitbox.y - camera.y;

  if (elapsed < chargeEnd) {
    const progress = elapsed / chargeEnd;
    ctx.globalAlpha = 0.22 + progress * 0.35;
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(screenX, screenY + hitbox.height / 2 - 3, hitbox.width, 6);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY + hitbox.height / 2);
    ctx.lineTo(screenX + hitbox.width, screenY + hitbox.height / 2);
    ctx.stroke();
    ctx.fillStyle = "#fecaca";
    ctx.font = "bold 18px Arial";
    ctx.fillText("레이저 충전", boss.x - camera.x - 30, boss.y - camera.y - 18);
  } else if (elapsed <= activeEnd) {
    ctx.globalAlpha = 0.48 + Math.sin(frameCount * 0.6) * 0.12;
    ctx.fillStyle = "#ef4444";
    drawRoundedRect(screenX, screenY, hitbox.width, hitbox.height, 12);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#fecaca";
    drawRoundedRect(screenX, screenY + hitbox.height / 2 - 4, hitbox.width, 8, 4);
    ctx.fill();
  }
}

function drawShardWarnings() {
  for (const warning of shardWarnings) {
    const screenX = warning.x - camera.x;
    const groundY = warning.y - camera.y;
    const warningTopY = warning.y - 620 - camera.y;
    const progress = 1 - warning.timer / warning.maxTimer;
    const ringRadiusX = 18 + progress * 12;
    const ringRadiusY = 7 + progress * 3;
    ctx.save();
    ctx.globalAlpha = 0.25 + progress * 0.35;
    ctx.fillStyle = "#7dd3fc";
    ctx.beginPath();
    ctx.ellipse(screenX, groundY, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55 + progress * 0.35;
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX, warningTopY);
    ctx.lineTo(screenX, groundY - 5);
    ctx.stroke();
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "16px Arial";
    ctx.fillText("!", screenX - 4, warningTopY - 10);
    ctx.restore();
  }
}

function drawProjectiles() {
  for (const projectile of projectiles) {
    const screenX = projectile.x - camera.x;
    const screenY = projectile.y - camera.y;
    ctx.save();

    if (projectile.type === "memoryShard") {
      drawMemoryShardProjectile(projectile, screenX, screenY);
      ctx.restore();
      continue;
    }

    if (projectile.type === "bossWave") {
      drawBossWaveProjectile(projectile, screenX, screenY);
    } else {
      drawEnemyBulletProjectile(projectile, screenX, screenY);
    }

    ctx.restore();
  }
}

function drawMemoryShardProjectile(projectile, screenX, screenY) {
  ctx.fillStyle = "rgba(125, 211, 252, 0.28)";
  drawRoundedRect(screenX - 7, screenY - 7, projectile.width + 14, projectile.height + 14, 8);
  ctx.fill();
  ctx.fillStyle = "#7dd3fc";
  ctx.beginPath();
  ctx.moveTo(screenX + projectile.width / 2, screenY);
  ctx.lineTo(screenX + projectile.width, screenY + projectile.height - 4);
  ctx.lineTo(screenX + projectile.width / 2, screenY + projectile.height);
  ctx.lineTo(screenX, screenY + projectile.height - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e0f2fe";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBossWaveProjectile(projectile, screenX, screenY) {
  ctx.fillStyle = "rgba(251, 113, 133, 0.25)";
  drawRoundedRect(screenX - 8, screenY - 6, projectile.width + 16, projectile.height + 12, 10);
  ctx.fill();
  ctx.fillStyle = "#fb7185";
  drawRoundedRect(screenX, screenY, projectile.width, projectile.height, 8);
  ctx.fill();
  ctx.fillStyle = "#fecdd3";
  drawRoundedRect(screenX + 4, screenY + 4, projectile.width - 8, projectile.height - 8, 4);
  ctx.fill();
}

function drawEnemyBulletProjectile(projectile, screenX, screenY) {
  ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
  drawRoundedRect(screenX - 6, screenY - 4, projectile.width + 12, projectile.height + 8, 8);
  ctx.fill();
  ctx.fillStyle = "#fca5a5";
  drawRoundedRect(screenX, screenY, projectile.width, projectile.height, 5);
  ctx.fill();
  ctx.fillStyle = "#fee2e2";
  drawRoundedRect(screenX + 3, screenY + 2, projectile.width - 6, projectile.height - 4, 3);
  ctx.fill();
}

function drawParticles() {
  ctx.save();

  for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;
    const screenX = particle.x - camera.x;
    const screenY = particle.y - camera.y;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(screenX, screenY);
    ctx.rotate(particle.rotation);

    if (particle.type === "dust") {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, particle.width * (1 + (1 - alpha) * 0.6), particle.height * alpha, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (particle.type === "dash") {
      ctx.fillStyle = particle.color;
      drawRoundedRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height, particle.height / 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = "#e0f2fe";
      drawRoundedRect(-particle.width / 2, -particle.height / 4, particle.width * 0.8, particle.height / 2, particle.height / 4);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

function drawFloatingTexts() {
  ctx.save();

  for (const text of floatingTexts) {
    const alpha = text.life / text.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = text.color;
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text.text, text.x - camera.x, text.y - camera.y);
  }

  ctx.textAlign = "left";
  ctx.restore();
}

function drawRoomLabels() {
  for (const room of rooms) {
    const screenX = room.x + 35 - camera.x;
    const screenY = 90 - camera.y;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "22px Arial";
    ctx.fillText(room.name, screenX, screenY);
    ctx.fillStyle = "rgba(203, 213, 225, 0.85)";
    ctx.font = "15px Arial";
    ctx.fillText(room.guide, screenX, screenY + 28);
  }
}

function drawWarnings() {
  const warnings = [
    { text: "v56 1차 보강: 튜토리얼은 소형 방, 첫 지역은 초대형 방 6개", x: 120, y: 210 },
    { text: "각 초대형 방에는 체크포인트가 있어 낙하 시 마지막 저장점으로 복귀", x: 8700, y: 960 },
    { text: "현재 단계는 전체 골격과 카메라 기믹 확인용", x: 13600, y: 1180 },
    { text: "하층은 강제 구멍 낙하가 아니라 선택 진입 구조로 유지", x: 21600, y: 2380 },
    { text: "세로 상승 구역은 이후 큰 벽 안의 파인 공간으로 보강 예정", x: 34200, y: 3950 }
  ];

  for (const warning of warnings) {
    ctx.fillStyle = "#facc15";
    ctx.font = "14px Arial";
    ctx.fillText(warning.text, warning.x - camera.x, warning.y - camera.y);
  }
}

function drawDashAfterImages(screenX, screenY, bob) {
  ctx.save();

  for (let i = 1; i <= 4; i++) {
    const offsetX = screenX - player.facing * i * 14;
    const alpha = 0.22 - i * 0.04;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = player.dashInvincibleTimer > 0 ? "#fef08a" : "#7dd3fc";
    drawRoundedRect(offsetX + 4, screenY + 7 + bob, 24, 32, 8);
    ctx.fill();
    ctx.fillStyle = "#e0f2fe";
    drawRoundedRect(offsetX + 8, screenY + 4 + bob, 16, 16, 6);
    ctx.fill();
  }

  ctx.restore();
}

function drawAttack() {
  if (player.attackTimer <= 0) {
    return;
  }

  const rawHitbox = getAttackHitbox();
  let hitbox = rawHitbox;

  if (player.attackDirection === "side") {
    hitbox = getClippedHitboxByWalls(rawHitbox, player, player.facing);
  }

  if (hitbox.width <= 2 || hitbox.height <= 2) {
    return;
  }

  const screenX = hitbox.x - camera.x;
  const screenY = hitbox.y - camera.y;
  const progress = player.attackTimer / player.attackDuration;
  const sweep = 1 - progress;
  ctx.save();
  ctx.lineCap = "round";

  if (player.attackDirection === "up") {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(screenX + 4, screenY + hitbox.height - 2);
    ctx.quadraticCurveTo(screenX + hitbox.width / 2, screenY - 10, screenX + hitbox.width - 4, screenY + hitbox.height - 2);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY + hitbox.height - 4);
    ctx.quadraticCurveTo(screenX + hitbox.width / 2, screenY - 4, screenX + hitbox.width - 8, screenY + hitbox.height - 4);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (player.attackDirection === "down") {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(screenX + 4, screenY + 2);
    ctx.quadraticCurveTo(screenX + hitbox.width / 2, screenY + hitbox.height + 8, screenX + hitbox.width - 4, screenY + 2);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY + 4);
    ctx.quadraticCurveTo(screenX + hitbox.width / 2, screenY + hitbox.height + 2, screenX + hitbox.width - 8, screenY + 4);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = "#e0f2fe";
  ctx.lineWidth = 5;
  ctx.beginPath();

  if (player.facing === 1) {
    ctx.moveTo(screenX + 5, screenY + 30);
    ctx.quadraticCurveTo(screenX + 22 + sweep * 10, screenY - 8, screenX + hitbox.width - 2, screenY + 12 + sweep * 5);
  } else {
    ctx.moveTo(screenX + hitbox.width - 5, screenY + 30);
    ctx.quadraticCurveTo(screenX + 30 - sweep * 10, screenY - 8, screenX + 2, screenY + 12 + sweep * 5);
  }

  ctx.stroke();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 12;
  ctx.beginPath();

  if (player.facing === 1) {
    ctx.moveTo(screenX + 2, screenY + 32);
    ctx.quadraticCurveTo(screenX + 28 + sweep * 8, screenY - 10, screenX + hitbox.width, screenY + 18);
  } else {
    ctx.moveTo(screenX + hitbox.width - 2, screenY + 32);
    ctx.quadraticCurveTo(screenX + 24 - sweep * 8, screenY - 10, screenX, screenY + 18);
  }

  ctx.stroke();
  ctx.restore();
}

function getCharacterVisual(state) {
  const visual = Object.assign({}, characterVisuals[state] || characterVisuals.idle);

  if (state === "dash") {
    visual.lean = player.facing * 4;
    visual.leftBottom = player.facing === 1 ? -2 : 3;
    visual.rightBottom = player.facing === 1 ? 29 : 34;
    visual.centerBottom = player.facing === 1 ? 18 : 14;
  } else if (state === "attack") {
    if (player.attackDirection === "up") {
      visual.lean = 0;
      visual.headY = -2;
    } else if (player.attackDirection === "down") {
      visual.lean = 0;
      visual.headY = 2;
    } else {
      visual.lean = player.facing * 3;
    }

    visual.leftBottom = player.facing === 1 ? 0 : 4;
    visual.rightBottom = player.facing === 1 ? 28 : 32;
    visual.centerBottom = player.facing === 1 ? 18 : 14;
  } else {
    visual.lean = 0;
  }

  return visual;
}

function getCharacterBob(visual) {
  if (visual.bobSpeed === 0 || visual.bobAmount === 0) {
    return 0;
  }

  return Math.sin(frameCount * visual.bobSpeed) * visual.bobAmount;
}

function drawStateEffects(screenX, screenY, state) {
  ctx.save();

  if (state === "jump") {
    ctx.strokeStyle = "rgba(125, 211, 252, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX + 6, screenY + 52);
    ctx.lineTo(screenX + 2, screenY + 62);
    ctx.moveTo(screenX + 16, screenY + 54);
    ctx.lineTo(screenX + 16, screenY + 65);
    ctx.moveTo(screenX + 26, screenY + 52);
    ctx.lineTo(screenX + 31, screenY + 62);
    ctx.stroke();
  }

  if (state === "wallSlide") {
    ctx.strokeStyle = "rgba(167, 243, 208, 0.5)";
    ctx.lineWidth = 3;
    const wallX = player.wallDirection === -1 ? screenX - 4 : screenX + player.width + 4;
    ctx.beginPath();
    ctx.moveTo(wallX, screenY + 2);
    ctx.lineTo(wallX, screenY + player.height - 2);
    ctx.stroke();
  }

  if (state === "fall") {
    ctx.strokeStyle = "rgba(203, 213, 225, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX + 2, screenY - 8);
    ctx.lineTo(screenX + 2, screenY + 5);
    ctx.moveTo(screenX + 30, screenY - 6);
    ctx.lineTo(screenX + 30, screenY + 8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlayerShadow(screenX, screenY, visual) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(screenX + player.width / 2, screenY + player.height + 3, visual.shadowWidth, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHealAura(screenX, screenY) {
  if (player.healTimer <= 0) {
    return;
  }

  const progress = 1 - player.healTimer / player.healDuration;
  const radius = 18 + progress * 12;
  const pulse = Math.sin(frameCount * 0.25) * 4;
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#86efac";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(screenX + player.width / 2, screenY + player.height / 2, radius + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#86efac";
  ctx.beginPath();
  ctx.arc(screenX + player.width / 2, screenY + player.height / 2, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCharacterBody(state, visual, bob) {
  const walkCycle = state === "walk" ? Math.sin(playerAnimation.stateFrame * 0.35) : 0;
  ctx.save();
  ctx.translate(visual.lean, bob);
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = state === "heal" ? "#86efac" : player.dashInvincibleTimer > 0 ? "#fef08a" : "#38bdf8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(7, visual.bodyTop);
  ctx.lineTo(25, visual.bodyTop);
  ctx.lineTo(visual.rightBottom, 44);
  ctx.lineTo(22, 48);
  ctx.lineTo(visual.centerBottom, 43);
  ctx.lineTo(10, 48);
  ctx.lineTo(visual.leftBottom, 44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(10, 24);
  ctx.lineTo(22, 24);
  ctx.lineTo(24, 42);
  ctx.lineTo(16, 38);
  ctx.lineTo(8, 42);
  ctx.closePath();
  ctx.fill();

  if (state === "attack") {
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 3;
    ctx.beginPath();

    if (player.attackDirection === "up") {
      ctx.moveTo(16, 24);
      ctx.lineTo(16, 10);
    } else if (player.attackDirection === "down") {
      ctx.moveTo(16, 34);
      ctx.lineTo(16, 51);
    } else if (player.facing === 1) {
      ctx.moveTo(23, 25);
      ctx.lineTo(34, 20);
    } else {
      ctx.moveTo(9, 25);
      ctx.lineTo(-2, 20);
    }

    ctx.stroke();
  }

  ctx.fillStyle = "#020617";

  if (state === "walk") {
    ctx.fillRect(8, 43 + walkCycle, 7, 5);
    ctx.fillRect(18, 43 - walkCycle, 7, 5);
  } else {
    ctx.fillRect(8, 43, 7, 5);
    ctx.fillRect(18, 43, 7, 5);
  }

  ctx.strokeStyle = visual.coreColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(16, 29, visual.coreRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCharacterHead(state, visual, bob) {
  ctx.save();
  ctx.translate(visual.lean, bob + visual.headY);
  ctx.strokeStyle = "#dbeafe";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(9, 8);
  ctx.quadraticCurveTo(4 - (state === "dash" ? player.facing * 4 : 0), 0, 2 - (state === "dash" ? player.facing * 7 : 0), -5);
  ctx.moveTo(23, 8);
  ctx.quadraticCurveTo(28 - (state === "dash" ? player.facing * 4 : 0), 0, 30 - (state === "dash" ? player.facing * 7 : 0), -5);
  ctx.stroke();
  ctx.fillStyle = "#dbeafe";
  ctx.strokeStyle = state === "heal" ? "#86efac" : player.dashInvincibleTimer > 0 ? "#fef08a" : "#f8fafc";
  ctx.lineWidth = 2;
  drawRoundedRect(5, 4, 22, 18, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = state === "heal" ? "#bbf7d0" : "#bfdbfe";
  drawRoundedRect(7, 13, 18, 7, 4);
  ctx.fill();
  ctx.fillStyle = "#020617";
  let eyeOffset = state === "dash" ? player.facing * 2 : state === "attack" && player.attackDirection === "side" ? player.facing : 0;

  if (player.facing === 1) {
    ctx.fillRect(14 + eyeOffset, 11, 3, 5);
    ctx.fillRect(21 + eyeOffset, 11, 3, 5);
  } else {
    ctx.fillRect(8 + eyeOffset, 11, 3, 5);
    ctx.fillRect(15 + eyeOffset, 11, 3, 5);
  }

  ctx.restore();
}

function drawVectorCharacter(screenX, screenY, state, visual, bob) {
  ctx.save();
  ctx.translate(screenX, screenY);
  drawCharacterBody(state, visual, bob);
  drawCharacterHead(state, visual, bob);
  ctx.restore();
}

function drawPlayer() {
  const screenX = player.x - camera.x;
  const screenY = player.y - camera.y;
  const state = playerAnimation.state;
  const visual = getCharacterVisual(state);
  const bob = getCharacterBob(visual);

  if (state === "dash") {
    drawDashAfterImages(screenX, screenY, bob);
  }

  drawStateEffects(screenX, screenY, state);
  drawPlayerShadow(screenX, screenY, visual);
  drawHealAura(screenX, screenY);
  ctx.save();

  if (player.dashInvincibleTimer > 0) {
    ctx.globalAlpha = 0.78;
  } else if (player.invincibleTimer > 0 && frameCount % 8 < 4) {
    ctx.globalAlpha = 0.45;
  }

  drawVectorCharacter(screenX, screenY, state, visual, bob);
  ctx.restore();
}

function drawMiniMap() {
  const mapX = canvas.width - 270;
  const mapY = 25;
  const mapWidth = 230;
  const mapHeight = 34;
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(mapX - 10, mapY - 10, mapWidth + 20, mapHeight + 38);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "13px Arial";
  ctx.fillText("방 구조", mapX, mapY - 16);

  for (const room of rooms) {
    const roomX = mapX + (room.x / world.width) * mapWidth;
    const roomW = (room.width / world.width) * mapWidth;
    ctx.fillStyle = "rgba(148, 163, 184, 0.28)";
    ctx.fillRect(roomX, mapY, roomW - 2, mapHeight);
    ctx.strokeStyle = "rgba(226, 232, 240, 0.5)";
    ctx.strokeRect(roomX, mapY, roomW - 2, mapHeight);
  }

  const playerMarkerX = mapX + (player.x / world.width) * mapWidth;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(playerMarkerX - 2, mapY - 4, 4, mapHeight + 8);
}

function drawHealthUI() {
  const startX = 20;
  const startY = 360;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText("체력", startX, startY);

  for (let i = 0; i < player.maxHealth; i++) {
    const x = startX + 45 + i * 24;
    const y = startY - 13;
    ctx.fillStyle = i < player.health ? "#f87171" : "rgba(148, 163, 184, 0.35)";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawCoreEnergyUI() {
  const startX = 20;
  const startY = 390;
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText("코어 에너지", startX, startY);

  for (let i = 0; i < player.maxCoreEnergy; i++) {
    const x = startX + 90 + i * 18;
    const y = startY - 13;
    ctx.fillStyle = i < player.coreEnergy ? "#86efac" : "rgba(148, 163, 184, 0.3)";
    drawRoundedRect(x, y, 12, 12, 4);
    ctx.fill();
    ctx.strokeStyle = "#bbf7d0";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "13px Arial";
  ctx.fillText("L 회복: 에너지 3칸 소모", startX, startY + 22);
}

function drawBossHealthBar() {
  if (!boss.alive || player.x < 10700) {
    return;
  }

  const barX = canvas.width / 2 - 190;
  const barY = 82;
  const barWidth = 380;
  const barHeight = 18;
  const ratio = boss.health / boss.maxHealth;
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
  drawRoundedRect(barX - 12, barY - 28, barWidth + 24, 58, 12);
  ctx.fill();
  ctx.fillStyle = isBossPhaseTwo() ? "#fecdd3" : "#e9d5ff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(isBossPhaseTwo() ? "기억 파수자 - 2페이즈" : "기억 파수자", canvas.width / 2, barY - 8);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(71, 85, 105, 0.9)";
  drawRoundedRect(barX, barY, barWidth, barHeight, 8);
  ctx.fill();
  ctx.fillStyle = isBossPhaseTwo() ? "#f43f5e" : "#fb7185";
  drawRoundedRect(barX, barY, barWidth * ratio, barHeight, 8);
  ctx.fill();
  ctx.strokeStyle = "#fecdd3";
  ctx.lineWidth = 2;
  drawRoundedRect(barX, barY, barWidth, barHeight, 8);
  ctx.stroke();
  ctx.restore();
}

function drawBossClearEffect() {
  if (gameState.bossClearEffectTimer <= 0) {
    return;
  }

  const alpha = gameState.bossClearEffectTimer / 150;
  ctx.save();
  ctx.globalAlpha = alpha * 0.26;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(999999 - camera.x, 0 - camera.y, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 26px Arial";
  ctx.fillText("보스방 봉인이 해제되었습니다", 11400 - camera.x, 360 - camera.y);
  ctx.restore();
}

function drawBossPhaseBanner() {
  if (gameState.bossPhaseBannerTimer <= 0) {
    return;
  }

  const alpha = Math.min(1, gameState.bossPhaseBannerTimer / 45);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2, 6, 23, 0.62)";
  ctx.fillRect(0, canvas.height / 2 - 55, canvas.width, 110);
  ctx.fillStyle = "#fecdd3";
  ctx.font = "bold 34px Arial";
  ctx.textAlign = "center";
  ctx.fillText("2페이즈 진입", canvas.width / 2, canvas.height / 2 - 8);
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "18px Arial";
  ctx.fillText("순간이동, 레이저, 기억 파편 빈도 증가", canvas.width / 2, canvas.height / 2 + 28);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawBossStartBanner() {
  if (gameState.bossStartBannerTimer <= 0) {
    return;
  }

  const alpha = Math.min(1, gameState.bossStartBannerTimer / 45);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
  ctx.fillRect(0, canvas.height / 2 - 55, canvas.width, 110);
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 34px Arial";
  ctx.textAlign = "center";
  ctx.fillText("기억 파수자", canvas.width / 2, canvas.height / 2 - 8);
  ctx.fillStyle = "#fecdd3";
  ctx.font = "18px Arial";
  ctx.fillText("최종 보스전 시작", canvas.width / 2, canvas.height / 2 + 28);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawEndingPanel() {
  if (!gameState.endingReached) {
    return;
  }

  const frame = gameState.endingFrame;
  const lineCount = clamp(Math.floor((frame - 60) / 95) + 1, 0, endingLines.length);
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 23, 0.86)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const glow = 0.18 + Math.sin(frameCount * 0.04) * 0.05;
  ctx.globalAlpha = glow;
  ctx.fillStyle = "#7dd3fc";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 - 110, 95, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Coreless", canvas.width / 2, 105);
  ctx.fillStyle = "#bae6fd";
  ctx.font = "17px Arial";
  ctx.fillText("원점 코어가 반응합니다.", canvas.width / 2, 142);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "20px Arial";

  for (let i = 0; i < lineCount; i++) {
    ctx.fillText(endingLines[i], canvas.width / 2, 210 + i * 42);
  }

  if (gameState.endingInputUnlocked) {
    ctx.fillStyle = "#fef3c7";
    ctx.font = "18px Arial";
    ctx.fillText("R 키를 누르면 다시 시작합니다.", canvas.width / 2, canvas.height - 65);
  } else {
    const dots = ".".repeat(Math.floor(frameCount / 25) % 4);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Arial";
    ctx.fillText("엔딩 진행 중" + dots, canvas.width / 2, canvas.height - 65);
  }

  ctx.textAlign = "left";
  ctx.restore();
}

function drawUI() {
  const currentRoom = getCurrentRoom();
  const playerState = playerAnimation.state;
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("13단계-2 v56 1차 보강 수정: 무빙 회복 + 바닥 표지판", 20, 35);
  ctx.font = "16px Arial";
  ctx.fillText("A/D 이동 | Space 점프/벽점프 | Shift/K 대시 | J 공격 | W+J 위 | 공중 S+J 아래 | L 회복", 20, 65);
  ctx.fillStyle = "#bfdbfe";
  ctx.fillText("현재 방: " + currentRoom.name, 20, 95);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("방 설명: " + currentRoom.guide + " / 역할: " + currentRoom.role, 20, 120);
  ctx.fillStyle = "#fef08a";
  ctx.fillText("캐릭터 상태: " + getStateName(playerState), 20, 150);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("맵 구조: 소형 튜토리얼 방 + 초대형 방 6개 / 체크포인트: " + activeCheckpoint.name, 20, 180);
  ctx.fillStyle = gameState.hasKey ? "#fef08a" : "#fecaca";
  ctx.fillText(gameState.hasKey ? "열쇠: 보유 중" : "열쇠: 없음", 20, 210);

  if (player.dashCooldown <= 0) {
    ctx.fillStyle = "#bbf7d0";
    ctx.fillText("대시: 사용 가능", 20, 240);
  } else {
    const cooldownPercent = Math.ceil((player.dashCooldown / player.dashCooldownMax) * 100);
    ctx.fillStyle = player.dashInvincibleTimer > 0 ? "#fef08a" : "#fde68a";
    ctx.fillText(player.dashInvincibleTimer > 0 ? "대시 무적 중" : "대시 쿨타임: " + cooldownPercent + "%", 20, 240);
  }

  ctx.fillStyle = player.hasDoubleJump ? "#c4b5fd" : "#cbd5e1";
  ctx.fillText(player.hasDoubleJump ? "능력: 이중 점프 획득" : "능력: 없음", 20, 265);
  if (player.isWallSliding) {
    ctx.fillStyle = "#a7f3d0";
    ctx.fillText("벽 상태: 미끄러짐 중", 180, 265);
  } else if (player.hasWallJump) {
    ctx.fillStyle = "#86efac";
    ctx.fillText("벽 점프: 사용 가능", 180, 265);
  }
  ctx.fillStyle = "#fef3c7";
  ctx.fillText("기억 조각: " + gameState.memoryFragments + "개", 20, 290);
  ctx.fillStyle = "#e9d5ff";
  ctx.fillText("기억 핵: " + gameState.memoryCores + "개", 20, 315);
  ctx.fillStyle = "#bae6fd";
  ctx.fillText("원점 코어: " + gameState.originCores + "개", 20, 340);
  ctx.fillStyle = "#bbf7d0";
  ctx.fillText("숨겨진 보상: " + gameState.hiddenRewards + "개", 20, 365);
  drawHealthUI();
  drawCoreEnergyUI();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "15px Arial";
  ctx.fillText(gameState.message, 20, 472);
  drawBossHealthBar();
  drawMiniMap();
}

function drawWorld() {
  ctx.save();
  ctx.translate(camera.shakeX, camera.shakeY);
  drawRoomBackgrounds();
  drawTutorialRoomFrames();
  drawBackgroundDecorations();
  drawBossRoomDecorations();
  drawRoomLabels();
  drawDoors();
  drawBossArenaGates();
  drawDashHazards();
  drawPlatforms();
  drawCheckpoints();
  drawTutorialSigns();
  drawKeyItem();
  drawAbilityItems();
  drawRewardItems();
  drawWarnings();
  drawEnemies();
  drawBoss();
  drawEnemyAttacks();
  drawShardWarnings();
  drawProjectiles();
  drawParticles();
  drawFloatingTexts();
  drawPlayer();
  drawAttack();
  drawBossClearEffect();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWorld();
  drawUI();
  drawBossStartBanner();
  drawBossPhaseBanner();
  drawEndingPanel();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
