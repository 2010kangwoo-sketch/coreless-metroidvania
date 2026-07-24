import { WORLD } from "./blueprint.js";
import { PASS18_LEVEL, PASS18_ZONE } from "./pass18-level.js";

const support = (id, floorId, x, y, width, height, delayOffset) => Object.freeze({
  id, floorId, x, y, width, height, delayOffset,
});

const narrowFloors = PASS18_ZONE.floors.filter(item => item.lane === "narrow");

export const PASS19_DESTRUCTION = Object.freeze({
  id: "pass19_aftershock_collapse",
  name: "AFTERSHOCK COLLAPSE",
  bounds: PASS18_ZONE.bounds,
  trigger: Object.freeze({
    requiresBridgePlunge: true,
    requiresPass18Entry: true,
    description: "The sealed boulder's bridge impact sends a delayed fracture wave through the precision grotto.",
  }),
  collapseFloorIds: Object.freeze(narrowFloors.map(item => item.id)),
  supports: Object.freeze(narrowFloors.map((item, index) => support(
    `pass19_fracture_support_${String(index + 1).padStart(2, "0")}`,
    item.id,
    (item.x1 + item.x2) * 0.5 - 18,
    Math.max(item.y1, item.y2) + 28,
    36,
    145 + (index % 3) * 22,
    index % 4,
  ))),
  timing: Object.freeze({
    leaveDelayFrames: 24,
    pulseIntervalFrames: 4,
    warningFrames: 12,
  }),
  milestones: Object.freeze({
    requiredArmedFloors: 12,
    requiredCollapsedFloors: 12,
    requiredDebrisBursts: 12,
    completionX: PASS18_ZONE.milestones.completionX,
    completionY: PASS18_ZONE.milestones.completionY,
  }),
  checkpoint: PASS18_ZONE.checkpoint,
  palette: Object.freeze({
    warning: "#e3b06f",
    fracture: "#d9745b",
    dust: "#a6876e",
    stabilized: "#92d8b7",
  }),
});

export const PASS19_LEVEL = Object.freeze({
  id: "pass19_post_chase_aftershock_destruction",
  bounds: PASS18_LEVEL.bounds,
  cameraBounds: PASS18_LEVEL.cameraBounds,
  spawn: PASS18_LEVEL.spawn,
  floors: PASS18_LEVEL.floors,
  solids: PASS18_LEVEL.solids,
  hazards: PASS18_LEVEL.hazards,
  exit: PASS18_LEVEL.exit,
});

const boundsInside = (inner, outer) => inner.x >= outer.x && inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

export function validatePass19Level() {
  const destruction = PASS19_DESTRUCTION;
  const supports = destruction.supports;
  const floorIds = new Set(narrowFloors.map(item => item.id));
  const supportFloorIds = new Set(supports.map(item => item.floorId));
  const checks = [
    { id: "world_retained", passed: WORLD.width >= 30500 && WORLD.height >= 11200 },
    { id: "pass18_level_retained", passed: PASS19_LEVEL.floors === PASS18_LEVEL.floors && PASS19_LEVEL.solids === PASS18_LEVEL.solids },
    { id: "bounds_retained", passed: PASS19_LEVEL.bounds === PASS18_LEVEL.bounds && PASS19_LEVEL.cameraBounds === PASS18_LEVEL.cameraBounds },
    { id: "spawn_retained", passed: PASS19_LEVEL.spawn.x === 600 && PASS19_LEVEL.spawn.y === 852 },
    { id: "exit_retained", passed: PASS19_LEVEL.exit.x === PASS18_ZONE.exit.x && PASS19_LEVEL.exit.y === PASS18_ZONE.exit.y },
    { id: "destruction_in_world", passed: boundsInside(destruction.bounds, WORLD.cameraBounds) },
    { id: "bridge_plunge_trigger", passed: destruction.trigger.requiresBridgePlunge },
    { id: "pass18_entry_trigger", passed: destruction.trigger.requiresPass18Entry },
    { id: "twelve_narrow_sources", passed: narrowFloors.length === 12 },
    { id: "twelve_collapse_targets", passed: destruction.collapseFloorIds.length === 12 },
    { id: "collapse_targets_unique", passed: new Set(destruction.collapseFloorIds).size === 12 },
    { id: "collapse_targets_are_narrow", passed: destruction.collapseFloorIds.every(id => floorIds.has(id)) },
    { id: "collapse_order_matches_route", passed: destruction.collapseFloorIds.every((id, index) => id === narrowFloors[index].id) },
    { id: "twelve_fracture_supports", passed: supports.length === 12 },
    { id: "support_ids_unique", passed: new Set(supports.map(item => item.id)).size === 12 },
    { id: "one_support_per_floor", passed: supportFloorIds.size === 12 && [...floorIds].every(id => supportFloorIds.has(id)) },
    { id: "supports_inside_zone", passed: supports.every(item => item.x >= destruction.bounds.x && item.x + item.width <= destruction.bounds.x + destruction.bounds.width && item.y >= destruction.bounds.y && item.y + item.height <= destruction.bounds.y + destruction.bounds.height) },
    { id: "support_dimensions", passed: supports.every(item => item.width === 36 && item.height >= 145 && item.height <= 189) },
    { id: "support_offsets_bounded", passed: supports.every(item => item.delayOffset >= 0 && item.delayOffset <= 3) },
    { id: "leave_delay_safe", passed: destruction.timing.leaveDelayFrames >= 20 && destruction.timing.leaveDelayFrames <= 36 },
    { id: "warning_before_collapse", passed: destruction.timing.warningFrames > 0 && destruction.timing.warningFrames < destruction.timing.leaveDelayFrames },
    { id: "pulse_interval_bounded", passed: destruction.timing.pulseIntervalFrames >= 3 && destruction.timing.pulseIntervalFrames <= 8 },
    { id: "requires_all_armed", passed: destruction.milestones.requiredArmedFloors === 12 },
    { id: "requires_all_collapsed", passed: destruction.milestones.requiredCollapsedFloors === 12 },
    { id: "requires_all_debris_bursts", passed: destruction.milestones.requiredDebrisBursts === 12 },
    { id: "completion_matches_pass18", passed: destruction.milestones.completionX === PASS18_ZONE.milestones.completionX && destruction.milestones.completionY === PASS18_ZONE.milestones.completionY },
    { id: "checkpoint_retained", passed: destruction.checkpoint === PASS18_ZONE.checkpoint },
    { id: "hazards_retained", passed: PASS19_LEVEL.hazards === PASS18_LEVEL.hazards && PASS19_LEVEL.hazards.length === 2 },
    { id: "palette_complete", passed: ["warning", "fracture", "dust", "stabilized"].every(key => typeof destruction.palette[key] === "string") },
    { id: "single_forward_destruction_chain", passed: supports.every((item, index) => index === 0 || item.x > supports[index - 1].x) },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    collapseFloorCount: destruction.collapseFloorIds.length,
    supportCount: supports.length,
    checks: Object.freeze(checks),
  });
}
