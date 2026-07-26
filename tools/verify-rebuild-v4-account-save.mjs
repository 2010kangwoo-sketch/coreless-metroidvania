import fs from "node:fs";
import path from "node:path";
import {
  V4_ACCOUNT,
  createCloudSaveClient,
  createCloudSaveRecord,
  createGuestIdentityStore,
  parseCloudSaveRecord,
  validateV4AccountSave,
} from "../src/v4/account-save.js";
import {
  createMemoryStorage,
  createSaveRecord,
} from "../src/v4/pass04-checkpoints.js";

const audit = validateV4AccountSave();
const storage = createMemoryStorage();
const guests = createGuestIdentityStore(storage, {
  now: () => Date.UTC(2026, 6, 26),
  randomUUID: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
});
const guest = guests.ensure().identity;
const cloud = createCloudSaveRecord(createSaveRecord("S24"), {
  guestId: guest.id,
  revision: 7,
  updatedAt: "2026-07-26T01:00:00.000Z",
});
const unavailable = await createCloudSaveClient({
  configuration: Object.freeze({
    origin: null,
    cloudEnabled: false,
    reason: "not-configured",
  }),
}).session();
const checks = [
  ...audit.checks,
  {
    name: "guestStoredUnderDedicatedKey",
    passed: storage.getItem(V4_ACCOUNT.guestStorageKey) !== null,
  },
  {
    name: "cloudRoundTrip",
    passed: parseCloudSaveRecord(JSON.stringify(cloud))?.revision === 7,
  },
  {
    name: "unconfiguredClientDoesNotFetch",
    passed: unavailable.status === "unavailable",
  },
];
const result = {
  build: "coreless-v4-account-save-foundation",
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
};
fs.mkdirSync("docs/rebuild-v4", { recursive: true });
fs.writeFileSync(
  "docs/rebuild-v4/account-save-results.json",
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify({
  passed: result.passed,
  passedCount: result.passedCount,
  totalCount: result.totalCount,
  failed: checks.filter(item => !item.passed).map(item => item.name),
}, null, 2));
if (!result.passed) process.exitCode = 1;
