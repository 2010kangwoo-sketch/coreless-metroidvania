const frozen = value => Object.freeze(value);

export const RELEASE_FOUNDATION_BUILD = frozen({
  id: "coreless-v4-release-foundation",
  cycle: "v4-release-40pass",
  stage: 0,
  branch: "rebuild/mega-room-v4-40pass",
  referenceBaseline: "38001905938f7e19d37d277bae70dc2c6ec88e56",
  completedReleasePass: 0,
  nextReleasePass: 1,
  rule:
    "earlier V4 reset passes remain reusable evidence, but do not count as completed passes in the release cycle",
});

export const RELEASE_SCOPE_CONTRACT = frozen({
  campaignMegaRooms: 20,
  campaignTargetMinutes: 240,
  releaseCycleRuntimeScope: "M01 빈 제련소",
  firstMegaRoomTiers: 6,
  firstMegaRoomSpaces: 36,
  firstMegaRoomTargetMinutes: frozen({ minimum: 11, target: 12, maximum: 15 }),
  laterMegaRooms: "design-contract-only",
  firstNewMajorAbilityMegaRoom: "M02 냉각 수로",
  target:
    "a browser-playable release candidate, not a prototype, tech demo, or automatic-audit showcase",
});

export const TRAVERSAL_FORGIVENESS_CONTRACT = frozen({
  requiredOrdinaryReachRatioMaximum: 0.8,
  requiredDemandingReachRatioMaximum: 0.9,
  optionalMasteryReachRatioMaximum: 0.96,
  requiredRouteMayUseMasteryRatio: false,
  ordinaryLandingWidthPlayerBodiesMinimum: 2.2,
  precisionLandingWidthPlayerBodiesMinimum: 1.45,
  consecutivePrecisionLandingsMaximum: 2,
  requiredHazardTelegraphSecondsMinimum: 0.55,
  failureRestartSecondsMaximum: 0.7,
  recoveryAfterHighIntensityRequired: true,
  destinationVisibleBeforeCommitRequired: true,
  singleFrameTimingRequiredAllowed: false,
  hiddenPhysicsCorrectionAllowed: false,
  principle:
    "difficulty comes from readable decisions, rhythm, and learned combinations rather than near-perfect distance or frame timing",
});

export const SPACE_SIGNATURE_AXES = frozen([
  "silhouette",
  "primary-direction",
  "elevation-pattern",
  "anchor-structure",
  "traversal-rhythm",
  "hazard-or-enemy-role",
  "lighting-depth",
  "story-purpose",
]);

export const SPATIAL_DIVERSITY_CONTRACT = frozen({
  uniqueSpaceSignaturesRequired: 36,
  adjacentAxesDifferentMinimum: 3,
  silhouettesPerTierMinimum: 4,
  traversalRhythmsPerTierMinimum: 3,
  anchorStructuresPerTierMinimum: 3,
  identicalAdjacentSignatureAllowed: false,
  identicalThreeRoomRhythmAllowed: false,
  highIntensitySpacesConsecutiveMaximum: 2,
  fillerCollisionAllowed: false,
  unreachableWalkableDecorationAllowed: false,
  supportEndingInOpenAirAllowed: false,
  principle:
    "spaces share one world language while changing shape, elevation, rhythm, structure, hazard, lighting, and purpose",
});

export const RELEASE_QUALITY_CONTRACT = frozen({
  placeholderCollisionArtAllowedAtPass40: false,
  continuousRealKeyboardCompletionRequired: true,
  coordinateInjectionMayProveCompletion: false,
  consoleErrorsAllowed: 0,
  pageErrorsAllowed: 0,
  progressionBlockersAllowed: 0,
  targetFramesPerSecond: 60,
  heavySceneFramesPerSecondMinimum: 50,
  saveRestoreRequired: true,
  checkpointRestoreRequired: true,
  browserDirectLaunchRequired: true,
  finalUserApprovalRequired: true,
  automatedAuditMayOverrideBadFeel: false,
  completionEvidence: frozen([
    "verified commit sha",
    "verified bundle ancestry",
    "continuous real-key completion record",
    "deterministic regression results",
    "console and page error report",
    "representative screenshots",
    "performance measurements",
    "known-limitations report",
  ]),
});

export const RELEASE_PASS_GATES = frozen({
  manualApprovalPasses: frozen([10, 20, 30, 40]),
  passMayAdvanceWithFailedAcceptance: false,
  previousPassMustRunBeforeImplementation: true,
  realKeyTestRequiredEveryImplementationPass: true,
  deterministicTestRequiredEveryImplementationPass: true,
  browserInspectionRequiredEveryImplementationPass: true,
  commitAndBundleRequiredEveryCompletedPass: true,
  mainMergeAllowed: false,
});

export function validateReleaseFoundation() {
  const checks = [
    ["releaseCycleStartsAtZero",
      RELEASE_FOUNDATION_BUILD.completedReleasePass === 0 &&
      RELEASE_FOUNDATION_BUILD.nextReleasePass === 1],
    ["campaignAndVerticalSliceScopesAreSeparate",
      RELEASE_SCOPE_CONTRACT.campaignMegaRooms === 20 &&
      RELEASE_SCOPE_CONTRACT.releaseCycleRuntimeScope === "M01 빈 제련소" &&
      RELEASE_SCOPE_CONTRACT.laterMegaRooms === "design-contract-only"],
    ["firstMegaRoomScaleIsLocked",
      RELEASE_SCOPE_CONTRACT.firstMegaRoomTiers === 6 &&
      RELEASE_SCOPE_CONTRACT.firstMegaRoomSpaces === 36],
    ["majorSkillStartsInSecondMegaRoom",
      RELEASE_SCOPE_CONTRACT.firstNewMajorAbilityMegaRoom.startsWith("M02")],
    ["ordinaryTraversalKeepsMargin",
      TRAVERSAL_FORGIVENESS_CONTRACT.requiredOrdinaryReachRatioMaximum <= 0.8],
    ["demandingTraversalKeepsMargin",
      TRAVERSAL_FORGIVENESS_CONTRACT.requiredDemandingReachRatioMaximum <= 0.9],
    ["masteryDistancesAreOptional",
      !TRAVERSAL_FORGIVENESS_CONTRACT.requiredRouteMayUseMasteryRatio],
    ["precisionChainsAreShort",
      TRAVERSAL_FORGIVENESS_CONTRACT.consecutivePrecisionLandingsMaximum <= 2],
    ["hazardsHaveReadableWarning",
      TRAVERSAL_FORGIVENESS_CONTRACT.requiredHazardTelegraphSecondsMinimum >= 0.55],
    ["failureRecoveryIsFast",
      TRAVERSAL_FORGIVENESS_CONTRACT.failureRestartSecondsMaximum <= 0.7],
    ["singleFrameTimingIsForbidden",
      !TRAVERSAL_FORGIVENESS_CONTRACT.singleFrameTimingRequiredAllowed],
    ["spaceSignatureHasEnoughAxes", SPACE_SIGNATURE_AXES.length >= 8],
    ["allSpacesNeedUniqueSignatures",
      SPATIAL_DIVERSITY_CONTRACT.uniqueSpaceSignaturesRequired === 36 &&
      !SPATIAL_DIVERSITY_CONTRACT.identicalAdjacentSignatureAllowed],
    ["adjacentSpacesMustChangeMaterially",
      SPATIAL_DIVERSITY_CONTRACT.adjacentAxesDifferentMinimum >= 3],
    ["eachTierNeedsShapeAndRhythmVariety",
      SPATIAL_DIVERSITY_CONTRACT.silhouettesPerTierMinimum >= 4 &&
      SPATIAL_DIVERSITY_CONTRACT.traversalRhythmsPerTierMinimum >= 3 &&
      SPATIAL_DIVERSITY_CONTRACT.anchorStructuresPerTierMinimum >= 3],
    ["threeRoomRhythmLoopsAreForbidden",
      !SPATIAL_DIVERSITY_CONTRACT.identicalThreeRoomRhythmAllowed],
    ["highIntensityChainsAreBounded",
      SPATIAL_DIVERSITY_CONTRACT.highIntensitySpacesConsecutiveMaximum <= 2],
    ["meaninglessTerrainIsForbidden",
      !SPATIAL_DIVERSITY_CONTRACT.fillerCollisionAllowed &&
      !SPATIAL_DIVERSITY_CONTRACT.unreachableWalkableDecorationAllowed &&
      !SPATIAL_DIVERSITY_CONTRACT.supportEndingInOpenAirAllowed],
    ["releaseRequiresRealCompletion",
      RELEASE_QUALITY_CONTRACT.continuousRealKeyboardCompletionRequired &&
      !RELEASE_QUALITY_CONTRACT.coordinateInjectionMayProveCompletion],
    ["releaseRequiresZeroRuntimeErrors",
      RELEASE_QUALITY_CONTRACT.consoleErrorsAllowed === 0 &&
      RELEASE_QUALITY_CONTRACT.pageErrorsAllowed === 0 &&
      RELEASE_QUALITY_CONTRACT.progressionBlockersAllowed === 0],
    ["releasePerformanceTargetIsLocked",
      RELEASE_QUALITY_CONTRACT.targetFramesPerSecond >= 60 &&
      RELEASE_QUALITY_CONTRACT.heavySceneFramesPerSecondMinimum >= 50],
    ["automationCannotApproveBadFeel",
      !RELEASE_QUALITY_CONTRACT.automatedAuditMayOverrideBadFeel &&
      RELEASE_QUALITY_CONTRACT.finalUserApprovalRequired],
    ["manualApprovalMilestonesAreLocked",
      RELEASE_PASS_GATES.manualApprovalPasses.join(",") === "10,20,30,40"],
    ["failedPassCannotAdvance",
      !RELEASE_PASS_GATES.passMayAdvanceWithFailedAcceptance],
    ["completedPassRequiresEvidence",
      RELEASE_PASS_GATES.realKeyTestRequiredEveryImplementationPass &&
      RELEASE_PASS_GATES.deterministicTestRequiredEveryImplementationPass &&
      RELEASE_PASS_GATES.browserInspectionRequiredEveryImplementationPass &&
      RELEASE_PASS_GATES.commitAndBundleRequiredEveryCompletedPass],
    ["mainMergeIsForbidden", !RELEASE_PASS_GATES.mainMergeAllowed],
  ].map(([name, passed]) => frozen({ name, passed: Boolean(passed) }));

  return frozen({
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks: frozen(checks),
    measurements: frozen({
      campaignMegaRooms: RELEASE_SCOPE_CONTRACT.campaignMegaRooms,
      releaseRuntimeMegaRooms: 1,
      firstMegaRoomSpaces: RELEASE_SCOPE_CONTRACT.firstMegaRoomSpaces,
      ordinaryReachRatioMaximum:
        TRAVERSAL_FORGIVENESS_CONTRACT.requiredOrdinaryReachRatioMaximum,
      demandingReachRatioMaximum:
        TRAVERSAL_FORGIVENESS_CONTRACT.requiredDemandingReachRatioMaximum,
      adjacentAxesDifferentMinimum:
        SPATIAL_DIVERSITY_CONTRACT.adjacentAxesDifferentMinimum,
      requiredUniqueSignatures:
        SPATIAL_DIVERSITY_CONTRACT.uniqueSpaceSignaturesRequired,
      completionEvidenceItems:
        RELEASE_QUALITY_CONTRACT.completionEvidence.length,
    }),
  });
}
