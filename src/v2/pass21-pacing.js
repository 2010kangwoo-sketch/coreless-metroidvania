import { PASS15_CHASE } from "./pass15-level.js";

export const PASS21_PACING = Object.freeze({
  id: "pass21_boulder_pacing",
  lead: Object.freeze({
    safety: 650,
    target: 1700,
    catchup: 3300,
    maximum: 5400,
  }),
  speed: Object.freeze({
    minimum: 2.2,
    cruise: 5.55,
    catchup: 7.15,
    maximum: 8.1,
    accelerationResponse: 0.035,
    brakingResponse: 0.22,
  }),
  destruction: Object.freeze({
    baseSlowdownFrames: 30,
    additionalFramesPerSupport: 7,
    maximumSlowdownFrames: 58,
    initialMultiplier: 0.36,
    minimumAbsoluteSpeed: 1.8,
  }),
  pause: Object.freeze({
    catchupDecrement: 4,
    maximumDecrement: 14,
  }),
  projection: Object.freeze({
    searchBehindSegments: 1,
    searchAheadSegments: 5,
    bootstrapAheadSegments: 14,
    maximumLateralDistance: 1400,
  }),
});

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const mix = (from, to, ratio) => from + (to - from) * clamp(ratio, 0, 1);

export function getPass21TargetSpeed(leadDistance) {
  const lead = PASS21_PACING.lead;
  const speed = PASS21_PACING.speed;
  if (leadDistance <= lead.safety) return speed.minimum;
  if (leadDistance <= lead.target) {
    return mix(speed.minimum, speed.cruise, (leadDistance - lead.safety) / (lead.target - lead.safety));
  }
  if (leadDistance <= lead.catchup) {
    return mix(speed.cruise, speed.catchup, (leadDistance - lead.target) / (lead.catchup - lead.target));
  }
  return mix(speed.catchup, speed.maximum, (leadDistance - lead.catchup) / (lead.maximum - lead.catchup));
}

export function getPass21DestructionMultiplier(framesRemaining) {
  const destruction = PASS21_PACING.destruction;
  if (framesRemaining <= 0) return 1;
  const ratio = 1 - clamp(framesRemaining / destruction.maximumSlowdownFrames, 0, 1);
  return mix(destruction.initialMultiplier, 1, ratio);
}

export function validatePass21Pacing() {
  const pacing = PASS21_PACING;
  const samples = [
    getPass21TargetSpeed(0),
    getPass21TargetSpeed(pacing.lead.safety),
    getPass21TargetSpeed(pacing.lead.target),
    getPass21TargetSpeed(pacing.lead.catchup),
    getPass21TargetSpeed(pacing.lead.maximum),
    getPass21TargetSpeed(pacing.lead.maximum * 2),
  ];
  const slowdownStart = getPass21DestructionMultiplier(pacing.destruction.maximumSlowdownFrames);
  const slowdownMiddle = getPass21DestructionMultiplier(Math.floor(pacing.destruction.maximumSlowdownFrames * 0.5));
  const checks = [
    { id: "retains_complete_chase_path", passed: PASS15_CHASE.path.points.length === 95 && PASS15_CHASE.path.totalDistance > 68000 },
    { id: "lead_bands_ordered", passed: pacing.lead.safety < pacing.lead.target && pacing.lead.target < pacing.lead.catchup && pacing.lead.catchup < pacing.lead.maximum },
    { id: "safety_lead_bounded", passed: pacing.lead.safety >= 500 && pacing.lead.safety <= 900 },
    { id: "target_lead_bounded", passed: pacing.lead.target >= 1400 && pacing.lead.target <= 2200 },
    { id: "maximum_lead_bounded", passed: pacing.lead.maximum >= 4500 && pacing.lead.maximum <= 6000 },
    { id: "speed_bands_ordered", passed: pacing.speed.minimum < pacing.speed.cruise && pacing.speed.cruise < pacing.speed.catchup && pacing.speed.catchup < pacing.speed.maximum },
    { id: "minimum_speed_safe", passed: pacing.speed.minimum >= 1.8 && pacing.speed.minimum <= 2.8 },
    { id: "cruise_near_previous_base", passed: Math.abs(pacing.speed.cruise - PASS15_CHASE.boulder.baseSpeed) <= 0.15 },
    { id: "catchup_speed_bounded", passed: pacing.speed.catchup >= 6.8 && pacing.speed.catchup <= 7.5 },
    { id: "maximum_speed_bounded", passed: pacing.speed.maximum >= 7.8 && pacing.speed.maximum <= 8.4 },
    { id: "braking_faster_than_acceleration", passed: pacing.speed.brakingResponse >= pacing.speed.accelerationResponse * 4 },
    { id: "acceleration_response_bounded", passed: pacing.speed.accelerationResponse >= 0.02 && pacing.speed.accelerationResponse <= 0.06 },
    { id: "braking_response_bounded", passed: pacing.speed.brakingResponse >= 0.15 && pacing.speed.brakingResponse <= 0.3 },
    { id: "target_samples_monotonic", passed: samples.every((value, index) => index === 0 || value >= samples[index - 1]) },
    { id: "target_samples_bounded", passed: samples.every(value => value >= pacing.speed.minimum && value <= pacing.speed.maximum) },
    { id: "far_lead_uses_maximum", passed: samples.at(-1) === pacing.speed.maximum },
    { id: "slowdown_duration_bounded", passed: pacing.destruction.baseSlowdownFrames >= 24 && pacing.destruction.maximumSlowdownFrames <= 64 },
    { id: "slowdown_stack_bounded", passed: pacing.destruction.additionalFramesPerSupport >= 4 && pacing.destruction.additionalFramesPerSupport <= 10 },
    { id: "slowdown_multiplier_bounded", passed: pacing.destruction.initialMultiplier >= 0.3 && pacing.destruction.initialMultiplier <= 0.5 },
    { id: "slowdown_absolute_floor", passed: pacing.destruction.minimumAbsoluteSpeed >= 1.5 && pacing.destruction.minimumAbsoluteSpeed < pacing.speed.minimum },
    { id: "slowdown_starts_reduced", passed: slowdownStart === pacing.destruction.initialMultiplier },
    { id: "slowdown_recovers", passed: slowdownMiddle > slowdownStart && slowdownMiddle < 1 && getPass21DestructionMultiplier(0) === 1 },
    { id: "adaptive_pause_enabled", passed: pacing.pause.catchupDecrement > 1 && pacing.pause.maximumDecrement > pacing.pause.catchupDecrement },
    { id: "catchup_pause_decrement_bounded", passed: pacing.pause.catchupDecrement >= 3 && pacing.pause.catchupDecrement <= 6 },
    { id: "maximum_pause_decrement_bounded", passed: pacing.pause.maximumDecrement >= 10 && pacing.pause.maximumDecrement <= 18 },
    { id: "long_breakpoint_present", passed: PASS15_CHASE.boulder.internalBreakpoints.some(item => item.delayFrames >= 1800) },
    { id: "projection_window_bounded", passed: pacing.projection.searchBehindSegments === 1 && pacing.projection.searchAheadSegments >= 4 && pacing.projection.searchAheadSegments <= 7 },
    { id: "projection_bootstrap_ahead", passed: pacing.projection.bootstrapAheadSegments > pacing.projection.searchAheadSegments },
    { id: "projection_lateral_tolerance", passed: pacing.projection.maximumLateralDistance >= PASS15_CHASE.boulder.radius * 10 },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    targetSpeedSamples: Object.freeze(samples),
    slowdownStart,
    slowdownMiddle,
    checks: Object.freeze(checks),
  });
}
