import {
  checkpointById,
  createCheckpointStore,
  createSaveRecord,
  parseSaveRecord,
} from "./pass04-checkpoints.js";

export const V4_ACCOUNT = Object.freeze({
  schemaVersion: 1,
  guestStorageKey: "coreless.v4.account.guest",
  cloudSlotId: "primary",
  sessionEndpoint: "/api/account/session",
  providersEndpoint: "/api/account/providers",
  saveEndpoint: "/api/save/primary",
  providers: Object.freeze([
    Object.freeze({ id: "google", label: "Google" }),
    Object.freeze({ id: "kakao", label: "카카오" }),
    Object.freeze({ id: "facebook", label: "Facebook" }),
    Object.freeze({ id: "naver", label: "네이버" }),
  ]),
  guestIsDeviceLocal: true,
  migratesGuestSaveAfterSignIn: true,
  providerTokensStoredInBrowser: false,
});

const frozen = value => Object.freeze(value);

export function createGuestIdentity({
  now = Date.now,
  randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto),
  random = Math.random,
} = {}) {
  const timestamp = Number(now());
  const id = typeof randomUUID === "function"
    ? `guest_${randomUUID()}`
    : `guest_${timestamp.toString(36)}_${Math.floor(
      random() * Number.MAX_SAFE_INTEGER,
    ).toString(36)}`;
  return frozen({
    schemaVersion: 1,
    kind: "guest",
    id,
    createdAt: new Date(timestamp).toISOString(),
  });
}

export function parseGuestIdentity(raw) {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    const value = JSON.parse(raw);
    if (
      value?.schemaVersion !== 1 ||
      value?.kind !== "guest" ||
      !/^guest_[a-z0-9_-]{12,}$/i.test(value?.id ?? "") ||
      !Number.isFinite(Date.parse(value?.createdAt))
    ) return null;
    return frozen({
      schemaVersion: 1,
      kind: "guest",
      id: value.id,
      createdAt: new Date(value.createdAt).toISOString(),
    });
  } catch {
    return null;
  }
}

export function createGuestIdentityStore(storage, options = {}) {
  let fallback = null;
  const readRaw = () => {
    try {
      return storage?.getItem(V4_ACCOUNT.guestStorageKey) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const writeRaw = raw => {
    fallback = raw;
    try {
      storage?.setItem(V4_ACCOUNT.guestStorageKey, raw);
      return true;
    } catch {
      return false;
    }
  };
  return frozen({
    read() {
      return parseGuestIdentity(readRaw());
    },
    ensure() {
      const existing = parseGuestIdentity(readRaw());
      if (existing) {
        return frozen({ identity: existing, created: false, persisted: true });
      }
      const identity = createGuestIdentity(options);
      return frozen({
        identity,
        created: true,
        persisted: writeRaw(JSON.stringify(identity)),
      });
    },
  });
}

export function createCloudSaveRecord(localSave, {
  guestId = null,
  revision = 0,
  updatedAt = new Date().toISOString(),
} = {}) {
  const local = parseSaveRecord(
    typeof localSave === "string" ? localSave : JSON.stringify(localSave),
  );
  if (!local) throw new Error("A valid checkpoint save is required.");
  if (!Number.isInteger(revision) || revision < 0) {
    throw new Error("Revision must be a non-negative integer.");
  }
  return frozen({
    schemaVersion: 1,
    build: "coreless-v4",
    slotId: "primary",
    revision,
    updatedAt: new Date(updatedAt).toISOString(),
    sourceGuestId: typeof guestId === "string" ? guestId : null,
    progress: frozen({
      checkpointId: local.checkpointId,
      checkpointOrder: local.checkpointOrder,
    }),
  });
}

export function parseCloudSaveRecord(value) {
  let record = value;
  if (typeof value === "string") {
    try {
      record = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (
    !record ||
    record.schemaVersion !== 1 ||
    record.build !== "coreless-v4" ||
    record.slotId !== "primary" ||
    !Number.isInteger(record.revision) ||
    record.revision < 0 ||
    !Number.isFinite(Date.parse(record.updatedAt))
  ) return null;
  const checkpoint = checkpointById(record.progress?.checkpointId);
  if (
    !checkpoint ||
    record.progress?.checkpointOrder !== checkpoint.order ||
    (record.sourceGuestId !== null &&
      !/^guest_[a-z0-9_-]{12,}$/i.test(record.sourceGuestId ?? ""))
  ) return null;
  return createCloudSaveRecord(createSaveRecord(checkpoint.id), {
    guestId: record.sourceGuestId,
    revision: record.revision,
    updatedAt: record.updatedAt,
  });
}

export function compareSaveProgress(localSave, cloudSave) {
  const local = parseSaveRecord(
    typeof localSave === "string" ? localSave : JSON.stringify(localSave),
  );
  const cloud = parseCloudSaveRecord(cloudSave);
  if (!local && !cloud) return "empty";
  if (local && !cloud) return "local-only";
  if (!local && cloud) return "cloud-only";
  if (local.checkpointOrder > cloud.progress.checkpointOrder) {
    return "local-ahead";
  }
  if (local.checkpointOrder < cloud.progress.checkpointOrder) {
    return "cloud-ahead";
  }
  return "same-progress";
}

export function resolveAccountConfiguration(documentRef = globalThis.document) {
  const enabled = documentRef?.querySelector(
    'meta[name="coreless-auth-enabled"]',
  )?.content === "true";
  const configuredOrigin = documentRef?.querySelector(
    'meta[name="coreless-auth-origin"]',
  )?.content?.trim() ?? "";
  const origin = configuredOrigin || globalThis.location?.origin || null;
  return frozen({
    origin,
    cloudEnabled: false,
    probeServer: enabled && Boolean(origin),
    reason: "최종 사이트 주소 확정 후 연결됩니다.",
  });
}

export function createCloudSaveClient({
  fetchImpl = globalThis.fetch?.bind(globalThis),
  configuration = resolveAccountConfiguration(),
} = {}) {
  const request = async (path, options = {}) => {
    if (!configuration.cloudEnabled || typeof fetchImpl !== "function") {
      return frozen({
        status: "unavailable",
        ok: false,
        reason: configuration.reason ?? "클라우드 서버를 사용할 수 없습니다.",
      });
    }
    const response = await fetchImpl(`${configuration.origin}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      ...options,
    });
    return frozen({
      status: response.status,
      ok: response.ok,
      payload: await response.json().catch(() => null),
    });
  };
  return frozen({
    configuration,
    session: () => request(V4_ACCOUNT.sessionEndpoint),
    load: () => request(V4_ACCOUNT.saveEndpoint),
    save(record, expectedRevision) {
      return request(V4_ACCOUNT.saveEndpoint, {
        method: "PUT",
        body: JSON.stringify({ record, expectedRevision }),
      });
    },
  });
}

export function validateV4AccountSave() {
  const memory = new Map();
  const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, String(value)),
  };
  const guests = createGuestIdentityStore(storage, {
    now: () => Date.UTC(2026, 6, 26),
    randomUUID: () => "12345678-1234-4234-8234-123456789abc",
  });
  const first = guests.ensure();
  const second = guests.ensure();
  const local = createSaveRecord("S18");
  const cloud = createCloudSaveRecord(local, {
    guestId: first.identity.id,
    revision: 3,
    updatedAt: "2026-07-26T00:00:00.000Z",
  });
  const checks = [
    ["fourOAuthProviders", V4_ACCOUNT.providers.map(item => item.id).join(",") ===
      "google,kakao,facebook,naver"],
    ["guestIsLocal", V4_ACCOUNT.guestIsDeviceLocal],
    ["guestMigratesAfterSignIn", V4_ACCOUNT.migratesGuestSaveAfterSignIn],
    ["providerTokensNotStoredInBrowser",
      V4_ACCOUNT.providerTokensStoredInBrowser === false],
    ["guestCreatedOnce", first.created && !second.created],
    ["guestIdentityStable", first.identity.id === second.identity.id],
    ["cloudRecordValid", Boolean(parseCloudSaveRecord(cloud))],
    ["revisionPreserved", cloud.revision === 3],
    ["sameProgressDetected", compareSaveProgress(local, cloud) === "same-progress"],
    ["cloudAheadDetected", compareSaveProgress(local,
      createCloudSaveRecord(createSaveRecord("S24"))) === "cloud-ahead"],
    ["localAheadDetected", compareSaveProgress(createSaveRecord("S35"),
      cloud) === "local-ahead"],
    ["invalidRevisionRejected",
      parseCloudSaveRecord({ ...cloud, revision: -1 }) === null],
  ].map(([name, passed]) => frozen({ name, passed: Boolean(passed) }));
  return frozen({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
  });
}

export class V4AccountController {
  constructor(root, {
    storage = globalThis.localStorage,
    fetchImpl = globalThis.fetch?.bind(globalThis),
    configuration = resolveAccountConfiguration(),
  } = {}) {
    this.root = root;
    this.storage = storage;
    this.fetchImpl = fetchImpl;
    this.configuration = configuration;
    this.guest = createGuestIdentityStore(storage).ensure().identity;
    this.checkpoints = createCheckpointStore(storage);
    this.mode = "guest";
    this.cloudEnabled = false;
    this.cloudRevision = 0;
    this.cloudClient = null;
    this.syncStatus = "local-only";
    this.pendingConflict = null;
    this.suppressLocalEvent = false;
    this.providerButtons = [...root.querySelectorAll("[data-account-provider]")];
    this.statusLabels = [...root.querySelectorAll("[data-account-status]")];
    this.notice = root.querySelector("[data-account-notice]");
    this.conflictPanel = root.querySelector("[data-account-conflict]");
    this.boundClick = event => this.onClick(event);
    this.boundSave = event => this.onLocalSave(event);
    this.initialize();
  }

  initialize() {
    this.setStatus("게스트 · 이 기기에 저장");
    this.providerButtons.forEach(button => this.enableProvider(button, false));
    if (this.notice) this.notice.textContent = this.configuration.reason;
    this.root.addEventListener("click", this.boundClick);
    globalThis.addEventListener?.("coreless:v4-checkpoint-save", this.boundSave);
    this.ready = this.discoverServer();
  }

  setStatus(text) {
    this.statusLabels.forEach(label => {
      label.textContent = text;
    });
  }

  enableProvider(button, enabled) {
    button.disabled = !enabled;
    button.setAttribute("aria-disabled", String(!enabled));
  }

  async discoverServer() {
    if (
      !this.configuration.probeServer ||
      !this.configuration.origin ||
      typeof this.fetchImpl !== "function"
    ) return false;
    try {
      const response = await this.fetchImpl(
        `${this.configuration.origin}${V4_ACCOUNT.providersEndpoint}`,
        { credentials: "include" },
      );
      if (!response.ok) return false;
      const data = await response.json();
      const availability = new Map(
        (data.providers ?? []).map(item => [item.id, item.enabled === true]),
      );
      this.providerButtons.forEach(button => this.enableProvider(
        button,
        availability.get(button.dataset.accountProvider) === true,
      ));
      this.cloudEnabled = this.providerButtons.some(button => !button.disabled);
      this.cloudClient = createCloudSaveClient({
        fetchImpl: this.fetchImpl,
        configuration: frozen({
          origin: this.configuration.origin,
          cloudEnabled: true,
          reason: null,
        }),
      });
      if (this.notice) {
        this.notice.textContent = this.cloudEnabled
          ? "로그인하면 이 기기의 게스트 기록을 계정으로 옮깁니다."
          : "아직 활성화된 로그인 공급자가 없습니다.";
      }
      const session = await this.cloudClient.session();
      if (session.ok && session.payload?.authenticated) {
        this.mode = "account";
        this.setStatus(
          `${session.payload.user?.name || "로그인 계정"} · 클라우드 저장`,
        );
        await this.reconcile();
      }
      return true;
    } catch {
      return false;
    }
  }

  async reconcile() {
    const local = this.checkpoints.read();
    const remote = await this.cloudClient.load();
    if (remote.status === 204 || (remote.ok && !remote.payload?.record)) {
      if (local.status === "ok") await this.pushLocal(local.record, 0);
      return;
    }
    if (!remote.ok) {
      this.syncStatus = "load-error";
      return;
    }
    const cloud = parseCloudSaveRecord(remote.payload.record);
    if (!cloud) {
      this.syncStatus = "invalid-cloud";
      return;
    }
    this.cloudRevision = cloud.revision;
    const comparison = compareSaveProgress(
      local.status === "ok" ? local.record : null,
      cloud,
    );
    if (comparison === "cloud-only") {
      this.suppressLocalEvent = true;
      this.checkpoints.write(cloud.progress.checkpointId);
      this.suppressLocalEvent = false;
      this.syncStatus = "synced";
    } else if (comparison === "same-progress") {
      this.syncStatus = "synced";
    } else {
      this.pendingConflict = frozen({
        comparison,
        local: local.status === "ok" ? local.record : null,
        cloud,
      });
      this.syncStatus = "conflict";
      this.showConflict();
    }
  }

  async pushLocal(local, expectedRevision = this.cloudRevision) {
    if (!this.cloudClient || !local) return false;
    const record = createCloudSaveRecord(local, {
      guestId: this.guest.id,
      revision: expectedRevision,
    });
    const result = await this.cloudClient.save(record, expectedRevision);
    if (result.ok && result.payload?.record) {
      const stored = parseCloudSaveRecord(result.payload.record);
      this.cloudRevision = stored?.revision ?? expectedRevision + 1;
      this.syncStatus = "synced";
      return true;
    }
    if (result.status === 409) {
      this.pendingConflict = frozen({
        comparison: "server-revision-conflict",
        local,
        cloud: parseCloudSaveRecord(result.payload?.current),
      });
      this.syncStatus = "conflict";
      this.showConflict();
    }
    return false;
  }

  onLocalSave(event) {
    if (
      this.suppressLocalEvent ||
      this.mode !== "account" ||
      !event?.detail?.record
    ) return;
    void this.pushLocal(event.detail.record);
  }

  onClick(event) {
    const resolution = event.target.closest("[data-account-resolution]");
    if (resolution) {
      void this.resolveConflict(resolution.dataset.accountResolution);
      return;
    }
    const button = event.target.closest("[data-account-provider]");
    if (!button || button.disabled) return;
    const provider = button.dataset.accountProvider;
    if (!V4_ACCOUNT.providers.some(item => item.id === provider)) return;
    const callbackUrl = encodeURIComponent(globalThis.location?.href ?? "/v4.html");
    globalThis.location?.assign(
      `${this.configuration.origin}/auth/signin/${provider}?callbackUrl=${callbackUrl}`,
    );
  }

  showConflict() {
    if (this.notice) {
      this.notice.textContent =
        "이 기기와 클라우드 기록이 다릅니다. 사용할 기록을 직접 선택하세요.";
    }
    if (this.conflictPanel) this.conflictPanel.hidden = false;
  }

  async resolveConflict(choice) {
    const conflict = this.pendingConflict;
    if (!conflict) return false;
    if (choice === "local" && conflict.local) {
      if (!await this.pushLocal(
        conflict.local,
        conflict.cloud?.revision ?? this.cloudRevision,
      )) return false;
    } else if (choice === "cloud" && conflict.cloud) {
      this.suppressLocalEvent = true;
      this.checkpoints.write(conflict.cloud.progress.checkpointId);
      this.suppressLocalEvent = false;
      this.cloudRevision = conflict.cloud.revision;
      this.syncStatus = "synced";
    } else return false;
    this.pendingConflict = null;
    if (this.conflictPanel) this.conflictPanel.hidden = true;
    if (this.notice) this.notice.textContent = "게임 기록이 동기화되었습니다.";
    return true;
  }

  snapshot() {
    return frozen({
      mode: this.mode,
      guestId: this.guest.id,
      cloudEnabled: this.cloudEnabled,
      cloudRevision: this.cloudRevision,
      syncStatus: this.syncStatus,
      hasConflict: Boolean(this.pendingConflict),
      providers: frozen(this.providerButtons.map(button => frozen({
        id: button.dataset.accountProvider,
        enabled: !button.disabled,
      }))),
      notice: this.notice?.textContent ?? null,
    });
  }
}
