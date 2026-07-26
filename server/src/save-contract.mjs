const ORDER = Object.freeze({
  S01: 0,
  S06: 1,
  S12: 2,
  S18: 3,
  S24: 4,
  S30: 5,
  S35: 6,
});

export function validateCloudSavePayload(value) {
  const checkpointId = value?.progress?.checkpointId;
  if (
    value?.schemaVersion !== 1 ||
    value?.build !== "coreless-v4" ||
    value?.slotId !== "primary" ||
    !Number.isInteger(value?.revision) ||
    value.revision < 0 ||
    !Number.isFinite(Date.parse(value?.updatedAt)) ||
    ORDER[checkpointId] === undefined ||
    value.progress.checkpointOrder !== ORDER[checkpointId] ||
    (value.sourceGuestId !== null &&
      value.sourceGuestId !== undefined &&
      !/^guest_[a-z0-9_-]{12,}$/i.test(value.sourceGuestId))
  ) return null;
  return Object.freeze({
    schemaVersion: 1,
    build: "coreless-v4",
    slotId: "primary",
    revision: value.revision,
    updatedAt: new Date(value.updatedAt).toISOString(),
    sourceGuestId: value.sourceGuestId ?? null,
    progress: Object.freeze({
      checkpointId,
      checkpointOrder: ORDER[checkpointId],
    }),
  });
}
