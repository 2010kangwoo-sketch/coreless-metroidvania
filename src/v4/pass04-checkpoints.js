import { PLAYER_PHYSICS } from "../v3/player-physics.js";
import {
  PASS03_TIERS,
  PASS03_ZONES,
  validatePass03WorldStreaming,
} from "./pass03-world-streaming.js";

export const PASS04_BUILD = Object.freeze({
  id: "rebuild-v4-pass04",
  pass: 4,
  branch: "rebuild/mega-room-v4-40pass",
  scope: "tier checkpoints, short recovery, and resilient browser persistence",
  finalArtIncluded: false,
});

export const PASS04_SAVE = Object.freeze({
  key: "coreless.v4.megaRoom01.save",
  schemaVersion: 1,
  recoveryFadeInSeconds: 0.45,
  recoveryFadeOutSeconds: 0.25,
  maximumRecoverySeconds: 0.75,
  maximumReplayDistance: 16800,
});

const CHECKPOINT_ZONE_IDS = Object.freeze([
  "S01",
  "S06",
  "S12",
  "S18",
  "S24",
  "S30",
  "S35",
]);

const checkpointPosition = zone => {
  const tier = PASS03_TIERS[zone.tier - 1];
  if (zone.id === "S01") {
    return Object.freeze({
      x: 120,
      y: tier.floorY - PLAYER_PHYSICS.height,
    });
  }
  const x = zone.direction === "east"
    ? zone.bounds.x + zone.bounds.width - PLAYER_PHYSICS.width - 160
    : zone.bounds.x + 160;
  return Object.freeze({
    x,
    y: tier.floorY - PLAYER_PHYSICS.height,
  });
};

export const PASS04_CHECKPOINTS = Object.freeze(
  CHECKPOINT_ZONE_IDS.map((zoneId, index) => {
    const zone = PASS03_ZONES.find(item => item.id === zoneId);
    return Object.freeze({
      id: zone.id,
      order: index,
      sequence: zone.sequence,
      tier: zone.tier,
      direction: zone.direction,
      position: checkpointPosition(zone),
      activationRule: zone.direction === "east" ? "x-at-or-after" : "x-at-or-before",
      visitedThroughSequence: zone.sequence,
      label: index === 0 ? "arrival" : `tier-${zone.tier}-safe-exit`,
    });
  }),
);

export function checkpointById(id) {
  return PASS04_CHECKPOINTS.find(item => item.id === id) ?? null;
}

export function checkpointReached(checkpoint, player, currentTier) {
  if (!checkpoint || currentTier !== checkpoint.tier) return false;
  return checkpoint.direction === "east"
    ? player.x >= checkpoint.position.x
    : player.x <= checkpoint.position.x;
}

export function createSaveRecord(checkpointId) {
  const checkpoint = checkpointById(checkpointId);
  if (!checkpoint) throw new Error(`Unknown checkpoint: ${checkpointId}`);
  return Object.freeze({
    schemaVersion: PASS04_SAVE.schemaVersion,
    build: "coreless-v4",
    checkpointId: checkpoint.id,
    checkpointOrder: checkpoint.order,
    checksum: `${checkpoint.id}:${checkpoint.order}:v${PASS04_SAVE.schemaVersion}`,
  });
}

export function parseSaveRecord(raw) {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    const record = JSON.parse(raw);
    const checkpoint = checkpointById(record?.checkpointId);
    if (
      record?.schemaVersion !== PASS04_SAVE.schemaVersion ||
      record?.build !== "coreless-v4" ||
      !checkpoint ||
      record?.checkpointOrder !== checkpoint.order ||
      record?.checksum !== `${checkpoint.id}:${checkpoint.order}:v${PASS04_SAVE.schemaVersion}`
    ) {
      return null;
    }
    return createSaveRecord(checkpoint.id);
  } catch {
    return null;
  }
}

export function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

export function createCheckpointStore(storage) {
  let memoryFallback = null;
  const readRaw = () => {
    try {
      return storage?.getItem(PASS04_SAVE.key) ?? memoryFallback;
    } catch {
      return memoryFallback;
    }
  };
  const writeRaw = value => {
    memoryFallback = value;
    try {
      storage?.setItem(PASS04_SAVE.key, value);
      return true;
    } catch {
      return false;
    }
  };
  const clearRaw = () => {
    memoryFallback = null;
    try {
      storage?.removeItem(PASS04_SAVE.key);
      return true;
    } catch {
      return false;
    }
  };
  return Object.freeze({
    read() {
      const raw = readRaw();
      if (raw === null) return Object.freeze({ status: "empty", record: null });
      const record = parseSaveRecord(raw);
      if (record) return Object.freeze({ status: "ok", record });
      clearRaw();
      return Object.freeze({ status: "invalid", record: null });
    },
    write(checkpointId) {
      const record = createSaveRecord(checkpointId);
      const persisted = writeRaw(JSON.stringify(record));
      if (
        typeof globalThis.dispatchEvent === "function" &&
        typeof globalThis.CustomEvent === "function"
      ) {
        globalThis.dispatchEvent(new CustomEvent(
          "coreless:v4-checkpoint-save",
          { detail: { record, persisted } },
        ));
      }
      return Object.freeze({ record, persisted });
    },
    clear() {
      return clearRaw();
    },
    raw() {
      return readRaw();
    },
  });
}

export function checkpointRestoreState(checkpointId) {
  const checkpoint = checkpointById(checkpointId) ?? PASS04_CHECKPOINTS[0];
  return Object.freeze({
    checkpoint,
    currentTier: checkpoint.tier,
    player: Object.freeze({
      x: checkpoint.position.x,
      y: checkpoint.position.y,
    }),
    visitedZoneIds: Object.freeze(
      PASS03_ZONES
        .filter(zone => zone.sequence <= checkpoint.visitedThroughSequence)
        .map(zone => zone.id),
    ),
  });
}

export function validatePass04Checkpoints() {
  const pass03 = validatePass03WorldStreaming();
  const memory = createMemoryStorage();
  const store = createCheckpointStore(memory);
  const empty = store.read();
  const write = store.write("S24");
  const restored = store.read();
  memory.setItem(PASS04_SAVE.key, "{broken");
  const corrupted = store.read();
  memory.setItem(PASS04_SAVE.key, JSON.stringify({
    ...createSaveRecord("S12"),
    schemaVersion: 99,
  }));
  const futureVersion = store.read();
  memory.setItem(PASS04_SAVE.key, JSON.stringify({
    ...createSaveRecord("S18"),
    checkpointId: "S99",
  }));
  const unknownCheckpoint = store.read();
  const unavailableStore = createCheckpointStore({
    getItem() {
      throw new Error("storage unavailable");
    },
    setItem() {
      throw new Error("storage unavailable");
    },
    removeItem() {
      throw new Error("storage unavailable");
    },
  });
  const fallbackWrite = unavailableStore.write("S18");
  const fallbackRead = unavailableStore.read();
  const restoreSamples = PASS04_CHECKPOINTS.map(checkpoint =>
    checkpointRestoreState(checkpoint.id));
  const checks = [
    ["pass03StillValid", pass03.passed],
    ["passSequence", PASS04_BUILD.pass === 4],
    ["sevenCheckpoints", PASS04_CHECKPOINTS.length === 7],
    ["checkpointIdsMatchContract", PASS04_CHECKPOINTS.map(item => item.id).join(",") === CHECKPOINT_ZONE_IDS.join(",")],
    ["checkpointOrdersContinuous", PASS04_CHECKPOINTS.every((item, index) => item.order === index)],
    ["checkpointSequencesIncrease", PASS04_CHECKPOINTS.every((item, index) => index === 0 || item.sequence > PASS04_CHECKPOINTS[index - 1].sequence)],
    ["allCheckpointZonesExist", PASS04_CHECKPOINTS.every(item => PASS03_ZONES.some(zone => zone.id === item.id))],
    ["allCheckpointPositionsInsideZones", PASS04_CHECKPOINTS.every(item => {
      const zone = PASS03_ZONES.find(candidate => candidate.id === item.id);
      return item.position.x >= zone.bounds.x &&
        item.position.x + PLAYER_PHYSICS.width <= zone.bounds.x + zone.bounds.width &&
        item.position.y >= zone.bounds.y &&
        item.position.y + PLAYER_PHYSICS.height <= zone.bounds.y + zone.bounds.height;
    })],
    ["checkpointPositionsUseFloor", PASS04_CHECKPOINTS.every(item => item.position.y + PLAYER_PHYSICS.height === PASS03_TIERS[item.tier - 1].floorY)],
    ["eastCheckpointsNearExit", PASS04_CHECKPOINTS.filter(item => item.id !== "S01" && item.direction === "east").every(item => {
      const zone = PASS03_ZONES.find(candidate => candidate.id === item.id);
      return zone.bounds.x + zone.bounds.width - (item.position.x + PLAYER_PHYSICS.width) <= 200;
    })],
    ["westCheckpointsNearExit", PASS04_CHECKPOINTS.filter(item => item.direction === "west").every(item => {
      const zone = PASS03_ZONES.find(candidate => candidate.id === item.id);
      return item.position.x - zone.bounds.x <= 200;
    })],
    ["emptyStoreHandled", empty.status === "empty" && empty.record === null],
    ["validRecordPersisted", write.record.checkpointId === "S24"],
    ["validRecordRestored", restored.status === "ok" && restored.record.checkpointId === "S24"],
    ["corruptedJsonRejected", corrupted.status === "invalid" && corrupted.record === null],
    ["futureVersionRejected", futureVersion.status === "invalid" && futureVersion.record === null],
    ["unknownCheckpointRejected", unknownCheckpoint.status === "invalid" && unknownCheckpoint.record === null],
    ["invalidRecordCleared", store.raw() === null],
    ["unavailableStorageUsesMemory", fallbackWrite.persisted === false && fallbackRead.status === "ok"],
    ["memoryFallbackPreservesCheckpoint", fallbackRead.record?.checkpointId === "S18"],
    ["restoreTierMatchesCheckpoint", restoreSamples.every(sample => sample.currentTier === sample.checkpoint.tier)],
    ["restorePositionMatchesCheckpoint", restoreSamples.every(sample => sample.player.x === sample.checkpoint.position.x && sample.player.y === sample.checkpoint.position.y)],
    ["visitedProgressDerived", restoreSamples.every(sample => sample.visitedZoneIds.length === sample.checkpoint.visitedThroughSequence)],
    ["noArbitraryCoordinatesPersisted", !Object.hasOwn(createSaveRecord("S30"), "x") && !Object.hasOwn(createSaveRecord("S30"), "y")],
    ["saveRecordIsMinimal", Object.keys(createSaveRecord("S30")).length === 5],
    ["checksumChangesPerCheckpoint", new Set(PASS04_CHECKPOINTS.map(item => createSaveRecord(item.id).checksum)).size === PASS04_CHECKPOINTS.length],
    ["recoveryUnderOneSecond", PASS04_SAVE.recoveryFadeInSeconds + PASS04_SAVE.recoveryFadeOutSeconds < 1],
    ["recoveryUnderConfiguredMaximum", PASS04_SAVE.recoveryFadeInSeconds + PASS04_SAVE.recoveryFadeOutSeconds <= PASS04_SAVE.maximumRecoverySeconds],
    ["replayBoundIsOneTier", PASS04_SAVE.maximumReplayDistance === 16800],
    ["finalCheckpointBeforeExit", PASS04_CHECKPOINTS.at(-1).id === "S35"],
    ["finalCheckpointOnTierSix", PASS04_CHECKPOINTS.at(-1).tier === 6],
    ["storageKeyIsV4Scoped", PASS04_SAVE.key.startsWith("coreless.v4." )],
    ["schemaVersionPositive", PASS04_SAVE.schemaVersion === 1],
    ["noFinalArt", PASS04_BUILD.finalArtIncluded === false],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements: Object.freeze({
      checkpoints: PASS04_CHECKPOINTS.length,
      schemaVersion: PASS04_SAVE.schemaVersion,
      recoverySeconds:
        PASS04_SAVE.recoveryFadeInSeconds + PASS04_SAVE.recoveryFadeOutSeconds,
      maximumReplayDistance: PASS04_SAVE.maximumReplayDistance,
      finalCheckpoint: PASS04_CHECKPOINTS.at(-1).id,
    }),
  });
}
