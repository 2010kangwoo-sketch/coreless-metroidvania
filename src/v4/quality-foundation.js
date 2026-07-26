import {
  FIRST_MEGA_ROOM_ZONES,
  MEGA_ROOM_CAMPAIGN,
  STARTING_ABILITIES,
} from "./pass01-scale-layout.js";
import {
  BLUEPRINT_CATEGORY_COLORS,
  BLUEPRINT_CATEGORY_LABELS,
} from "./pass01-blueprint.js";
import { PASS05_TUTORIAL_SEQUENCE } from "./pass05-story-guidance.js";

export const QUALITY_FOUNDATION_BUILD = Object.freeze({
  id: "rebuild-v4-quality-foundation",
  afterPass: 5,
  beforePass: 6,
  branch: "rebuild/mega-room-v4-40pass",
  scope:
    "binding room, terrain, chase, motion, object, progression, and approval gates",
});

const task = (
  zoneId,
  kind,
  completionSignal,
  exitFeedback,
) => Object.freeze({
  zoneId,
  kind,
  completionSignal,
  exitRule: "sealed-until-complete",
  exitFeedback,
  bypassAllowed: false,
  failureRecovery: "restart-current-room-with-cleared-entry-space",
});

export const MANDATORY_ROOM_TASKS = Object.freeze([
  task("S01", "tutorial", "horizontal-movement-demonstrated", "출구 맥동이 밝아진다"),
  task("S02", "tutorial", "low-and-high-jump-gates-cleared", "높이 표식 두 개가 연결된다"),
  task("S03", "tutorial", "low-ceiling-route-cleared", "천장 봉인이 부드럽게 해제된다"),
  task("S04", "tutorial", "safe-landing-demonstrated", "회수등이 다음 길을 비춘다"),
  task("S05", "observation", "east-signal-observed", "승강축 신호가 활성화된다"),
  task("S06", "interaction", "east-lift-activated", "동부 승강문이 천천히 열린다"),
  task("S08", "calibration", "both-safe-targets-cleared", "교정 고리가 정렬되며 출구가 열린다"),
  task("S09", "combat", "crawler-defeated", "전투 봉인이 사라진다"),
  task("S11", "combat", "shield-sentinel-defeated", "방패 문양이 꺼진다"),
  task("S12", "interaction", "west-lift-activated", "정비축 상부문이 열린다"),
  task("S14", "combat", "all-vent-crawlers-defeated", "환기구 경보가 꺼진다"),
  task("S17", "combat", "all-active-threats-defeated", "세 갈래 봉인이 함께 해제된다"),
  task("S18", "interaction", "memory-lift-activated", "기억 승강고가 상승한다"),
  task("S22", "combat", "flying-sentinel-defeated", "온실 차단막이 걷힌다"),
  task("S24", "interaction", "recovery-lift-activated", "서부 회수문이 열린다"),
  task("S25", "story-interaction", "one-critical-memory-restored", "기억못의 다음 통로가 떠오른다"),
  task("S29", "combat", "all-arena-threats-defeated", "조립 경기장 출구가 열린다"),
  task("S30", "rest", "rest-checkpoint-confirmed", "최종 승강기가 호출된다"),
  task("S31", "boss-lesson", "two-guardian-telegraphs-observed", "외곽 고리 접근문이 열린다"),
  task("S32", "combat", "outer-defenders-defeated", "수호자실 봉인이 약해진다"),
  task("S33", "boss", "guardian-phase-one-cleared", "중앙 바닥이 2막 형태로 전환된다"),
  task("S34", "boss", "guardian-defeated", "공명 회수실이 열린다"),
  task("S35", "reward-interaction", "record-and-shortcut-claimed", "냉각 수로 출구가 활성화된다"),
]);

export const ROOM_FRAMING_CONTRACT = Object.freeze({
  visibleCeilingFraction: Object.freeze({ minimum: 0.06, maximum: 0.12 }),
  visibleCeilingPurpose:
    "show enclosure without hiding jump destinations or reducing playable headroom",
  entranceLanguage: "distinct-threshold-light-and-side-frame",
  exitLanguage: "distinct-threshold-light-and-side-frame",
  roomBoundaryRule:
    "each room must read as a contained volume with ceiling, side thresholds, floor, and depth layers",
  supportTerminationRule:
    "supports must meet a visible foundation or continue below the camera; never end in open air",
  collisionVisibilityRule:
    "visual silhouettes may decorate collision, but may not imply a walkable or blocking surface that does not exist",
});

export const TERRAIN_QUALITY_CONTRACT = Object.freeze({
  maximumSustainedWalkableSlopeDegrees: 32,
  maximumAdjacentSlopeChangeDegrees: 10,
  minimumSlopeBlendLengthPx: 140,
  minimumLandingWidthPlayerBodies: 2.2,
  precisionLandingWidthPlayerBodies: 1.45,
  maximumConsecutivePrecisionLandings: 2,
  identicalAdjacentTerrainSignaturesAllowed: false,
  suddenVerticalCorrectionAllowed: false,
  automaticWallVaultAllowed: false,
  unreachableFloatingFloorAllowed: false,
  routeRule:
    "every collision surface must serve traversal, recovery, combat position, hazard timing, interaction, or story staging",
});

export const MOTION_AND_EFFECT_CONTRACT = Object.freeze({
  fixedSimulationStep: true,
  renderInterpolation: true,
  cameraUsesDampedFollow: true,
  effectEvents: Object.freeze([
    "takeoff",
    "landing",
    "hard-landing",
    "direction-reversal",
    "dash-start",
    "attack-contact",
    "damage-contact",
    "structure-break",
    "room-task-complete",
  ]),
  effectRule:
    "dust, debris, light, and shake must originate at the physical event and inherit its direction; constant decorative emission is forbidden",
  cameraShakeRule:
    "short, amplitude-bounded, event-specific, and never strong enough to hide the next required landing",
});

export const PLAYER_MOTION_STATES = Object.freeze([
  "idle",
  "run-start",
  "run-loop",
  "run-stop",
  "turn",
  "jump-anticipation",
  "rise",
  "apex",
  "fall",
  "soft-land",
  "hard-land",
  "attack-start",
  "attack-active",
  "attack-recover",
  "hurt",
  "defeat",
]);

export const ENEMY_MOTION_REQUIREMENTS = Object.freeze([
  "idle",
  "locomotion",
  "notice",
  "attack-telegraph",
  "attack-active",
  "attack-recover",
  "hurt",
  "defeat",
]);

export const OBJECT_FAMILIES = Object.freeze([
  "forged-stone-shell",
  "ribbed-metal-support",
  "service-bridge",
  "lift-and-counterweight",
  "pipe-and-vent",
  "memory-terminal",
  "resonance-seal",
  "maintenance-flora",
  "hazard-machinery",
  "enemy-nest",
]);

export const OBJECT_PURPOSE_RULE = Object.freeze({
  requiredPurposeTags: Object.freeze([
    "traversal",
    "recovery",
    "combat-position",
    "hazard",
    "interaction",
    "story",
  ]),
  minimumPurposeTagsPerCollidableObject: 1,
  decorativeCollisionAllowed: false,
  unreachableWalkableSurfaceAllowed: false,
  rule:
    "an object with no gameplay or story purpose is removed instead of being used as filler",
});

export const CHASE_CONTRACT = Object.freeze({
  phases: Object.freeze([
    "foreshadow",
    "safe-launch",
    "readable-basics",
    "route-escalation",
    "short-breather",
    "combined-climax",
    "player-caused-resolution",
  ]),
  checkpointImmediatelyBefore: true,
  introducesNewAbility: false,
  pursuerSpawnRule:
    "spawn on a validated supporting surface behind the player, outside overlap, and never below terrain",
  pursuerTeleportAllowed: false,
  adaptivePacing: Object.freeze({
    minimumLeadPx: 650,
    preferredLeadPx: Object.freeze({ minimum: 1800, maximum: 3600 }),
    maximumLeadPx: 5400,
    closeResponse: "decelerate-or-enter-authored-destruction-recovery",
    farResponse: "gradual-acceleration-with-bounded-maximum-speed",
  }),
  minimumObstacleTelegraphSeconds: 0.55,
  minimumRecoveryWindows: 1,
  failureResetSecondsMaximum: 0.7,
  obstacleRule:
    "all mandatory obstacles use previously taught inputs and remain readable at chase camera speed",
  resolutionRule:
    "the player closes, breaks, redirects, or escapes through a structure; the pursuer may not simply disappear at a coordinate",
  verificationRule:
    "continuous real key events, no coordinate injection, no pursuer contact, no trapped state, and deterministic restart",
});

export const QUALITY_APPROVAL_GATES = Object.freeze({
  requiredManualPlaytestPasses: Object.freeze([10, 20, 30, 40]),
  firstPlayMinutes: Object.freeze({ minimum: 11, maximum: 14 }),
  repeatPlayMinutes: Object.freeze({ minimum: 8, maximum: 11 }),
  fastRouteMinutesMinimum: 7,
  ordinaryRoomSeconds: Object.freeze({ minimum: 10, maximum: 35 }),
  bossPairSeconds: Object.freeze({ minimum: 60, maximum: 100 }),
  actualKeyEventsRequired: true,
  coordinateInjectionAllowed: false,
  consoleErrorsAllowed: 0,
  pageErrorsAllowed: 0,
  unresolvedTaskBypassAllowed: false,
  approvalRule:
    "automated checks are necessary but cannot overrule an unfriendly, unnatural, repetitive, or visually misleading playtest result",
});

export function validateQualityFoundation() {
  const zoneIds = new Set(FIRST_MEGA_ROOM_ZONES.map(zone => zone.id));
  const mandatoryTaskIds = new Set(MANDATORY_ROOM_TASKS.map(item => item.zoneId));
  const mandatoryCombatIds = FIRST_MEGA_ROOM_ZONES
    .filter(zone => ["combat", "boss"].includes(zone.category))
    .map(zone => zone.id);
  const tutorialIds = PASS05_TUTORIAL_SEQUENCE.map(item => item.zoneId);
  const primaryMechanics = FIRST_MEGA_ROOM_ZONES.map(zone => zone.primaryMechanic);
  const checks = [
    ["runsBetweenPassFiveAndSix",
      QUALITY_FOUNDATION_BUILD.afterPass === 5 &&
      QUALITY_FOUNDATION_BUILD.beforePass === 6],
    ["allTaskZonesExist", MANDATORY_ROOM_TASKS.every(item =>
      zoneIds.has(item.zoneId))],
    ["allZoneCategoriesRenderWithLabels", FIRST_MEGA_ROOM_ZONES.every(zone =>
      Boolean(BLUEPRINT_CATEGORY_COLORS[zone.category]) &&
      Boolean(BLUEPRINT_CATEGORY_LABELS[zone.category]))],
    ["taskIdsAreUnique", mandatoryTaskIds.size === MANDATORY_ROOM_TASKS.length],
    ["allTutorialRoomsAreGated", tutorialIds.every(id =>
      mandatoryTaskIds.has(id))],
    ["allCombatAndBossRoomsAreGated", mandatoryCombatIds.every(id =>
      mandatoryTaskIds.has(id))],
    ["allTasksBlockBypass", MANDATORY_ROOM_TASKS.every(item =>
      item.exitRule === "sealed-until-complete" && !item.bypassAllowed)],
    ["allTasksHaveReadableFeedback", MANDATORY_ROOM_TASKS.every(item =>
      item.exitFeedback.length >= 10)],
    ["allTasksHaveLocalRecovery", MANDATORY_ROOM_TASKS.every(item =>
      item.failureRecovery.includes("current-room"))],
    ["ceilingIsSlightlyVisible",
      ROOM_FRAMING_CONTRACT.visibleCeilingFraction.minimum >= 0.05 &&
      ROOM_FRAMING_CONTRACT.visibleCeilingFraction.maximum <= 0.14],
    ["supportsNeverEndInOpenAir",
      ROOM_FRAMING_CONTRACT.supportTerminationRule.includes("never end in open air")],
    ["walkableSlopeIsBounded",
      TERRAIN_QUALITY_CONTRACT.maximumSustainedWalkableSlopeDegrees <= 32],
    ["slopeTransitionsAreGradual",
      TERRAIN_QUALITY_CONTRACT.maximumAdjacentSlopeChangeDegrees <= 10 &&
      TERRAIN_QUALITY_CONTRACT.minimumSlopeBlendLengthPx >= 120],
    ["precisionChainsAreBounded",
      TERRAIN_QUALITY_CONTRACT.maximumConsecutivePrecisionLandings <= 2],
    ["noAutomaticTraversalCorrection",
      !TERRAIN_QUALITY_CONTRACT.suddenVerticalCorrectionAllowed &&
      !TERRAIN_QUALITY_CONTRACT.automaticWallVaultAllowed],
    ["noUnreachableFloatingFloors",
      !TERRAIN_QUALITY_CONTRACT.unreachableFloatingFloorAllowed],
    ["zonePrimaryMechanicsAreUnique",
      new Set(primaryMechanics).size === primaryMechanics.length],
    ["motionsCoverTakeoffLandingAndInteraction",
      ["takeoff", "landing", "direction-reversal", "room-task-complete"].every(event =>
        MOTION_AND_EFFECT_CONTRACT.effectEvents.includes(event))],
    ["playerHasDistinctMotionStates", PLAYER_MOTION_STATES.length >= 16],
    ["enemyTelegraphAndRecoveryRequired",
      ENEMY_MOTION_REQUIREMENTS.includes("attack-telegraph") &&
      ENEMY_MOTION_REQUIREMENTS.includes("attack-recover")],
    ["objectFamiliesAreDiverse", OBJECT_FAMILIES.length >= 10],
    ["meaninglessCollidersForbidden",
      OBJECT_PURPOSE_RULE.minimumPurposeTagsPerCollidableObject >= 1 &&
      !OBJECT_PURPOSE_RULE.decorativeCollisionAllowed],
    ["chaseHasCompleteArc", CHASE_CONTRACT.phases.length === 7 &&
      CHASE_CONTRACT.phases[0] === "foreshadow" &&
      CHASE_CONTRACT.phases.at(-1) === "player-caused-resolution"],
    ["chaseSpawnRequiresTerrain",
      CHASE_CONTRACT.pursuerSpawnRule.includes("supporting surface") &&
      CHASE_CONTRACT.pursuerSpawnRule.includes("never below terrain")],
    ["chaseCannotTeleport", !CHASE_CONTRACT.pursuerTeleportAllowed],
    ["chaseLeadWindowIsOrdered",
      CHASE_CONTRACT.adaptivePacing.minimumLeadPx <
      CHASE_CONTRACT.adaptivePacing.preferredLeadPx.minimum &&
      CHASE_CONTRACT.adaptivePacing.preferredLeadPx.maximum <
      CHASE_CONTRACT.adaptivePacing.maximumLeadPx],
    ["chaseUsesKnownAbilities", !CHASE_CONTRACT.introducesNewAbility],
    ["firstMegaRoomHasNoNewSkill",
      MEGA_ROOM_CAMPAIGN[0].skillRewards.length === 0 &&
      FIRST_MEGA_ROOM_ZONES.every(zone =>
        zone.unlock === null || zone.unlock === "forge_access")],
    ["skillGrowthStartsInSecondMegaRoom",
      MEGA_ROOM_CAMPAIGN[1].skillRewards.length > 0],
    ["startingAbilitiesIncludeBasicCombat",
      STARTING_ABILITIES.includes("basic_attack")],
    ["manualPlaytestsAreMilestoned",
      QUALITY_APPROVAL_GATES.requiredManualPlaytestPasses.join(",") ===
      "10,20,30,40"],
    ["automationCannotApproveBadFeel",
      QUALITY_APPROVAL_GATES.approvalRule.includes("cannot overrule")],
  ].map(([name, passed]) => Object.freeze({
    name,
    passed: Boolean(passed),
  }));

  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements: Object.freeze({
      mandatoryRoomTasks: MANDATORY_ROOM_TASKS.length,
      gatedCombatAndBossRooms: mandatoryCombatIds.length,
      roomObjectFamilies: OBJECT_FAMILIES.length,
      playerMotionStates: PLAYER_MOTION_STATES.length,
      enemyMotionRequirements: ENEMY_MOTION_REQUIREMENTS.length,
      chasePhases: CHASE_CONTRACT.phases.length,
      firstMegaRoomSkillRewards: MEGA_ROOM_CAMPAIGN[0].skillRewards.length,
      secondMegaRoomSkillRewards: MEGA_ROOM_CAMPAIGN[1].skillRewards.length,
    }),
  });
}
