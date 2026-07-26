import fs from "node:fs";
import { createAuthConfig } from "../server/src/auth-config.mjs";
import {
  callbackUrls,
  providerAvailability,
} from "../server/src/provider-config.mjs";
import { validateCloudSavePayload } from "../server/src/save-contract.mjs";

const env = {
  AUTH_SECRET: "a".repeat(64),
  AUTH_GOOGLE_ID: "id",
  AUTH_GOOGLE_SECRET: "secret",
  AUTH_KAKAO_ID: "id",
  AUTH_KAKAO_SECRET: "secret",
  AUTH_FACEBOOK_ID: "id",
  AUTH_FACEBOOK_SECRET: "secret",
  AUTH_NAVER_ID: "id",
  AUTH_NAVER_SECRET: "secret",
};
const providers = providerAvailability(env);
const auth = createAuthConfig({ query() {} }, env);
const callbacks = callbackUrls("https://game.example.com/");
const valid = validateCloudSavePayload({
  schemaVersion: 1,
  build: "coreless-v4",
  slotId: "primary",
  revision: 2,
  updatedAt: "2026-07-26T01:00:00.000Z",
  sourceGuestId: "guest_aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  progress: { checkpointId: "S30", checkpointOrder: 5 },
});
const sql = fs.readFileSync("server/sql/001_auth_and_saves.sql", "utf8");
const checks = [
  ["fourProvidersConfigured", providers.length === 4 &&
    providers.every(item => item.enabled)],
  ["authUsesDatabaseSessions", auth.providers.length === 4 &&
    auth.session.strategy === "database"],
  ["fourCallbackUrls", callbacks.length === 4],
  ["callbackUrlsUseHttps", callbacks.every(item =>
    item.url.startsWith("https://game.example.com/auth/callback/"))],
  ["validSaveAccepted", valid?.progress.checkpointId === "S30"],
  ["wrongOrderRejected", validateCloudSavePayload({
    ...valid,
    progress: { checkpointId: "S30", checkpointOrder: 4 },
  }) === null],
  ["authTablesPresent", ["users", "accounts", "sessions", "verification_token"]
    .every(table => sql.includes(`TABLE IF NOT EXISTS ${table}`))],
  ["gameSavesPresent", sql.includes("TABLE IF NOT EXISTS game_saves")],
  ["revisionPresent", sql.includes("revision INTEGER")],
  ["secretFileIgnored", fs.readFileSync(".gitignore", "utf8")
    .includes("server/.env")],
].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
const result = {
  build: "coreless-v4-account-server-foundation",
  generatedAt: new Date().toISOString(),
  passed: checks.every(item => item.passed),
  passedCount: checks.filter(item => item.passed).length,
  totalCount: checks.length,
  checks,
  measurements: { providers, callbacks },
};
fs.mkdirSync("docs/rebuild-v4", { recursive: true });
fs.writeFileSync(
  "docs/rebuild-v4/account-server-results.json",
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify({
  passed: result.passed,
  passedCount: result.passedCount,
  totalCount: result.totalCount,
  failed: checks.filter(item => !item.passed).map(item => item.name),
}, null, 2));
if (!result.passed) process.exitCode = 1;
