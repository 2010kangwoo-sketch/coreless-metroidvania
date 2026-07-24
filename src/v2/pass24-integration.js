import { PASS23_ZONE } from "./pass23-level.js";

const system = (id, label, requirement) => Object.freeze({ id, label, requirement: Object.freeze(requirement) });
const objective = (id, order, label, hint, completionKey) => Object.freeze({ id, order, label, hint, completionKey });

export const PASS24_INTEGRATION = Object.freeze({
  id: "pass24_graybox_integration",
  title: "SYSTEMS INTEGRATION RUN",
  baselineSha: "19b95aa",
  route: Object.freeze({
    start: Object.freeze({ x: 600, y: 852, label: "START SLOPE" }),
    goal: Object.freeze({ x: PASS23_ZONE.checkpoint.x, y: PASS23_ZONE.checkpoint.y, label: "LATE CHECKPOINT" }),
    zoneCount: 14,
  }),
  objectives: Object.freeze([
    objective("foundation_route", 1, "CROSS THE FOUNDATION ROUTE", "MOVE · JUMP · DASH", "pass07Completed"),
    objective("chase_core", 2, "SURVIVE THE CHASE CORE", "KEEP MOVING · BREAK THROUGH", "pass10Completed"),
    objective("tech_chain", 3, "CHAIN GRAPPLE AND AIR DASH", "E GRAPPLE · SHIFT DASH", "pass13Completed"),
    objective("bridge_finale", 4, "ROUND THE CURVE AND CROSS", "REVERSE · JUMP · AIR DASH", "pass15Completed"),
    objective("aftershock", 5, "CLEAR THE AFTERSHOCK", "SHORT JUMPS · KEEP RHYTHM", "pass19Completed"),
    objective("spring_recovery", 6, "LAUNCH AND RECOVER", "HOLD D · LAND · RETURN LEFT", "pass22Completed"),
    objective("convergence", 7, "COMPLETE THE CONVERGENCE", "RIDE · F ATTACK · E GRAPPLE · HOLD A", "pass23Completed"),
  ]),
  systems: Object.freeze([
    system("movement", "MOVE", ["pass07Completed", "pass15Completed"]),
    system("platform", "PLATFORM", ["movingPlatformCrossed", "pass23PlatformCrossed"]),
    system("pursuit", "PURSUIT", ["chaseEscaped", "pass23PursuerEscaped"]),
    system("destruction", "BREAK", ["pass19Completed"]),
    system("grapple", "GRAPPLE", ["pass11Completed", "pass23GrappleChainCompleted"]),
    system("spring", "SPRING", ["pass20Completed", "pass23SpringLanded"]),
    system("combat", "COMBAT", ["pass23CombatCleared"]),
  ]),
  requiredInputs: Object.freeze(["KeyA", "KeyB", "KeyD", "KeyE", "KeyF", "ShiftLeft", "Space"]),
  checkpoint: Object.freeze({
    id: "mega_stage_integration_cp",
    screenId: "mega_24",
    requiredOrder: 24,
    x: PASS23_ZONE.checkpoint.x,
    y: PASS23_ZONE.checkpoint.y,
  }),
  palette: Object.freeze({ panel: "rgba(3, 9, 13, 0.9)", edge: "#8dd8c2", active: "#efd58d", complete: "#88e0b9", muted: "#6f8589" }),
});

export function getPass24IntegrationState(progress = {}) {
  const completedObjectives = PASS24_INTEGRATION.objectives.filter(item => progress[item.completionKey] === true);
  const activeObjective = PASS24_INTEGRATION.objectives.find(item => progress[item.completionKey] !== true) ?? null;
  const systems = PASS24_INTEGRATION.systems.map(item => Object.freeze({
    id: item.id,
    label: item.label,
    complete: item.requirement.every(key => progress[key] === true),
  }));
  const completedSystems = systems.filter(item => item.complete).length;
  return Object.freeze({
    activeObjective,
    completedObjectiveCount: completedObjectives.length,
    objectiveCount: PASS24_INTEGRATION.objectives.length,
    systems: Object.freeze(systems),
    completedSystemCount: completedSystems,
    systemCount: systems.length,
    allSystemsComplete: completedSystems === systems.length,
    routeComplete: progress.pass23Completed === true,
  });
}

export function validatePass24Integration() {
  const integration = PASS24_INTEGRATION;
  const blank = getPass24IntegrationState({});
  const completedProgress = Object.fromEntries([
    ...integration.objectives.map(item => item.completionKey),
    ...integration.systems.flatMap(item => item.requirement),
  ].map(key => [key, true]));
  const completed = getPass24IntegrationState(completedProgress);
  const checks = [
    { id: "integration_id", passed: integration.id === "pass24_graybox_integration" },
    { id: "integration_title", passed: integration.title === "SYSTEMS INTEGRATION RUN" },
    { id: "baseline_sha", passed: integration.baselineSha === "19b95aa" },
    { id: "route_starts_at_spawn", passed: integration.route.start.x === 600 && integration.route.start.y === 852 },
    { id: "route_ends_at_pass23_checkpoint", passed: integration.route.goal.x === PASS23_ZONE.checkpoint.x && integration.route.goal.y === PASS23_ZONE.checkpoint.y },
    { id: "fourteen_zone_route", passed: integration.route.zoneCount === 14 },
    { id: "seven_objectives", passed: integration.objectives.length === 7 },
    { id: "objective_ids_unique", passed: new Set(integration.objectives.map(item => item.id)).size === integration.objectives.length },
    { id: "objective_order", passed: integration.objectives.every((item, index) => item.order === index + 1) },
    { id: "objective_labels", passed: integration.objectives.every(item => item.label.length >= 8 && item.hint.length >= 8) },
    { id: "objective_completion_keys", passed: integration.objectives.every(item => item.completionKey.startsWith("pass")) },
    { id: "foundation_first", passed: integration.objectives[0].completionKey === "pass07Completed" },
    { id: "convergence_last", passed: integration.objectives.at(-1).completionKey === "pass23Completed" },
    { id: "seven_systems", passed: integration.systems.length === 7 },
    { id: "system_ids_unique", passed: new Set(integration.systems.map(item => item.id)).size === integration.systems.length },
    { id: "movement_system", passed: integration.systems.some(item => item.id === "movement") },
    { id: "platform_system", passed: integration.systems.some(item => item.id === "platform") },
    { id: "pursuit_system", passed: integration.systems.some(item => item.id === "pursuit") },
    { id: "destruction_system", passed: integration.systems.some(item => item.id === "destruction") },
    { id: "grapple_system", passed: integration.systems.some(item => item.id === "grapple") },
    { id: "spring_system", passed: integration.systems.some(item => item.id === "spring") },
    { id: "combat_system", passed: integration.systems.some(item => item.id === "combat") },
    { id: "requirements_nonempty", passed: integration.systems.every(item => item.requirement.length >= 1) },
    { id: "seven_actual_inputs", passed: integration.requiredInputs.length === 7 && new Set(integration.requiredInputs).size === 7 },
    { id: "attack_input_required", passed: integration.requiredInputs.includes("KeyF") },
    { id: "blueprint_input_required", passed: integration.requiredInputs.includes("KeyB") },
    { id: "late_checkpoint_identity", passed: integration.checkpoint.id === "mega_stage_integration_cp" && integration.checkpoint.screenId === "mega_24" },
    { id: "late_checkpoint_order", passed: integration.checkpoint.requiredOrder === 24 },
    { id: "blank_state", passed: blank.completedObjectiveCount === 0 && blank.completedSystemCount === 0 && blank.activeObjective?.order === 1 },
    { id: "completed_state", passed: completed.activeObjective === null && completed.completedObjectiveCount === 7 && completed.allSystemsComplete && completed.routeComplete },
    { id: "palette_complete", passed: ["panel", "edge", "active", "complete", "muted"].every(key => typeof integration.palette[key] === "string") },
  ];
  return Object.freeze({ passed: checks.every(check => check.passed), passedCount: checks.filter(check => check.passed).length, total: checks.length, checks: Object.freeze(checks) });
}
