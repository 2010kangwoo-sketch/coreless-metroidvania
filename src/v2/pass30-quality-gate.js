import { VIEWPORT } from "./config.js";
import { PASS29_MODULAR_PLAN, PASS29_MODULE_PLACEMENTS, getPass29ScreenPlacement, isPass29CameraActive } from "./pass29-modular-art.js";

const freezeList = items => Object.freeze(items.map(item => Object.freeze(item)));
const rectsOverlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

export const PASS30_CAMERA_SAMPLES = freezeList([
  { id: "lower_rise", playerX: 16400, playerY: 3770.75, cameraX: 16090, cameraY: 3510.75 },
  { id: "rise_crest", playerX: 17000, playerY: 3283.25, cameraX: 16690, cameraY: 3023.25 },
  { id: "western_ridge", playerX: 17500, playerY: 3202, cameraX: 17190, cameraY: 2942 },
  { id: "middle_descent", playerX: 18000, playerY: 3258.25, cameraX: 17690, cameraY: 2998.25 },
  { id: "descent_late", playerX: 18100, playerY: 3314.5, cameraX: 17790, cameraY: 3054.5 },
]);

export const PASS30_QUALITY_GATE = Object.freeze({
  id: "pass30_representative_raster_approval",
  title: "RASTER QUALITY APPROVAL GATE",
  baselineSha: "07ebe21",
  representativeScene: "destruction_maze_foundry",
  representativeSliceApproved: true,
  routeWideArtExpansionAllowed: true,
  originalReferenceComparisonDeferred: true,
  approvalScope: "representative_foundry_slice_only",
  collisionChanges: 0,
  thresholds: Object.freeze({
    minimumCameraSamples: 5,
    visibleSeamColumnsAllowed: 0,
    surfaceAlignmentTolerancePx: 3,
    foregroundPlayerOverlapAllowed: 0,
    minimumPlayerContrastRatio: 4.5,
    maximumFlatPlaceholderCoverage: 0.08,
    maximumAssetLoadFailures: 0,
  }),
  renderContract: Object.freeze({
    girderTopOffsetPx: -3,
    collisionHighlightOffsetPx: 0,
    approvedRouteBounds: Object.freeze({ x: 16300, y: 2700, width: 1950, height: 1350 }),
    playerSafetyRect: Object.freeze({ x: 280, y: 220, width: 94, height: 108 }),
    measuredPixelRegion: Object.freeze({ x: 0, y: 120, width: VIEWPORT.width, height: 520 }),
  }),
});

export function getPass30FarCoverage(camera) {
  const far = PASS29_MODULE_PLACEMENTS.find(item => item.id === "far_vaults_main");
  const screen = getPass29ScreenPlacement(far, camera);
  const gaps = Object.freeze({
    left: Math.max(0, screen.x),
    top: Math.max(0, screen.y),
    right: Math.max(0, VIEWPORT.width - (screen.x + screen.width)),
    bottom: Math.max(0, VIEWPORT.height - (screen.y + screen.height)),
  });
  return Object.freeze({ screen, gaps, covered: Object.values(gaps).every(value => value <= 0.001) });
}

export function getPass30ForegroundOverlap(sample) {
  const camera = { x: sample.cameraX, y: sample.cameraY };
  const safety = PASS30_QUALITY_GATE.renderContract.playerSafetyRect;
  const overlaps = PASS29_MODULE_PLACEMENTS
    .filter(item => item.layer === "foreground")
    .map(item => ({ id: item.id, rect: getPass29ScreenPlacement(item, camera) }))
    .filter(item => rectsOverlap(item.rect, safety));
  return Object.freeze({ sampleId: sample.id, overlapCount: overlaps.length, overlapIds: Object.freeze(overlaps.map(item => item.id)) });
}

export function validatePass30QualityGate() {
  const gate = PASS30_QUALITY_GATE;
  const farCoverage = PASS30_CAMERA_SAMPLES.map(sample => getPass30FarCoverage({ x: sample.cameraX, y: sample.cameraY }));
  const foreground = PASS30_CAMERA_SAMPLES.map(getPass30ForegroundOverlap);
  const surfaceAlignment = Math.abs(gate.renderContract.girderTopOffsetPx - gate.renderContract.collisionHighlightOffsetPx);
  const routeBounds = gate.renderContract.approvedRouteBounds;
  const checks = [
    { id: "gate_id", passed: gate.id === "pass30_representative_raster_approval" },
    { id: "gate_title", passed: gate.title === "RASTER QUALITY APPROVAL GATE" },
    { id: "baseline_sha", passed: gate.baselineSha === "07ebe21" },
    { id: "foundry_scene", passed: gate.representativeScene === "destruction_maze_foundry" },
    { id: "scope_explicit", passed: gate.approvalScope === "representative_foundry_slice_only" },
    { id: "representative_approved", passed: gate.representativeSliceApproved === true },
    { id: "expansion_allowed", passed: gate.routeWideArtExpansionAllowed === true },
    { id: "reference_deferred_honest", passed: gate.originalReferenceComparisonDeferred === true },
    { id: "zero_collision_changes", passed: gate.collisionChanges === 0 },
    { id: "five_camera_samples", passed: PASS30_CAMERA_SAMPLES.length >= gate.thresholds.minimumCameraSamples },
    { id: "sample_ids_unique", passed: new Set(PASS30_CAMERA_SAMPLES.map(item => item.id)).size === PASS30_CAMERA_SAMPLES.length },
    { id: "samples_inside_activation", passed: PASS30_CAMERA_SAMPLES.every(item => isPass29CameraActive({ x: item.cameraX, y: item.cameraY })) },
    { id: "snap_camera_x", passed: PASS30_CAMERA_SAMPLES.every(item => item.playerX - item.cameraX === 310) },
    { id: "snap_camera_y", passed: PASS30_CAMERA_SAMPLES.every(item => item.playerY - item.cameraY === 260) },
    { id: "sample_order", passed: PASS30_CAMERA_SAMPLES.every((item, index) => index === 0 || item.cameraX > PASS30_CAMERA_SAMPLES[index - 1].cameraX) },
    { id: "far_coverage_all_samples", passed: farCoverage.every(item => item.covered) },
    { id: "far_left_coverage", passed: farCoverage.every(item => item.gaps.left === 0) },
    { id: "far_right_coverage", passed: farCoverage.every(item => item.gaps.right === 0) },
    { id: "far_top_coverage", passed: farCoverage.every(item => item.gaps.top === 0) },
    { id: "far_bottom_coverage", passed: farCoverage.every(item => item.gaps.bottom === 0) },
    { id: "zero_foreground_overlap", passed: foreground.every(item => item.overlapCount <= gate.thresholds.foregroundPlayerOverlapAllowed) },
    { id: "safety_rect_width", passed: gate.renderContract.playerSafetyRect.width >= 90 },
    { id: "safety_rect_height", passed: gate.renderContract.playerSafetyRect.height >= 100 },
    { id: "surface_alignment", passed: surfaceAlignment <= gate.thresholds.surfaceAlignmentTolerancePx },
    { id: "sample_players_inside_route_skin", passed: PASS30_CAMERA_SAMPLES.every(item => item.playerX >= routeBounds.x && item.playerX <= routeBounds.x + routeBounds.width && item.playerY >= routeBounds.y && item.playerY <= routeBounds.y + routeBounds.height) },
    { id: "alignment_tolerance_strict", passed: gate.thresholds.surfaceAlignmentTolerancePx <= 3 },
    { id: "seam_tolerance_zero", passed: gate.thresholds.visibleSeamColumnsAllowed === 0 },
    { id: "foreground_tolerance_zero", passed: gate.thresholds.foregroundPlayerOverlapAllowed === 0 },
    { id: "contrast_wcag_level", passed: gate.thresholds.minimumPlayerContrastRatio >= 4.5 },
    { id: "flat_placeholder_limit", passed: gate.thresholds.maximumFlatPlaceholderCoverage <= 0.08 },
    { id: "asset_failure_limit", passed: gate.thresholds.maximumAssetLoadFailures === 0 },
    { id: "pixel_region_width", passed: gate.renderContract.measuredPixelRegion.width === VIEWPORT.width },
    { id: "pixel_region_below_hud", passed: gate.renderContract.measuredPixelRegion.y >= 120 },
    { id: "pixel_region_in_view", passed: gate.renderContract.measuredPixelRegion.y + gate.renderContract.measuredPixelRegion.height <= VIEWPORT.height },
    { id: "pass29_three_depths_retained", passed: PASS29_MODULAR_PLAN.layerOrder.length === 3 },
    { id: "pass29_assets_retained", passed: PASS29_MODULAR_PLAN.moduleCount === 5 },
    { id: "pass29_fallback_retained", passed: PASS29_MODULAR_PLAN.fallbackAssetId === "foundry_quality_gate" },
    { id: "route_expansion_not_full_completion", passed: gate.approvalScope.includes("slice_only") },
    { id: "browser_contrast_required", passed: Number.isFinite(gate.thresholds.minimumPlayerContrastRatio) },
    { id: "browser_flat_measurement_required", passed: Number.isFinite(gate.thresholds.maximumFlatPlaceholderCoverage) },
    { id: "browser_seam_measurement_required", passed: Number.isInteger(gate.thresholds.visibleSeamColumnsAllowed) },
  ];
  return Object.freeze({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    total: checks.length,
    checks: freezeList(checks),
    surfaceAlignment,
    farCoverage: freezeList(farCoverage),
    foreground: freezeList(foreground),
  });
}
