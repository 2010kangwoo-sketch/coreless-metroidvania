import fs from "node:fs";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const artifactDirectory = "browser-artifacts/v4-account";
fs.mkdirSync(artifactDirectory, { recursive: true });
const server = spawn("python3", ["-m", "http.server", "4260"], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 700));

let browser;
try {
  const executablePath = fs.existsSync("/tmp/coreless138/chromium")
    ? "/tmp/coreless138/chromium"
    : await chromium.executablePath();
  const args = chromium.args.filter(arg =>
    arg !== "--single-process" &&
    arg !== "--in-process-gpu" &&
    !arg.startsWith("--use-gl=") &&
    !arg.startsWith("--use-angle="));
  args.push("--disable-gpu");
  browser = await playwright.launch({ executablePath, args, headless: true });
  const page = await browser.newPage({
    viewport: { width: 1680, height: 1050 },
  });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => pageErrors.push(String(error)));
  const ready = async () => {
    await page.waitForFunction(() =>
      document.documentElement.dataset.corelessV4Ready === "true");
  };
  await page.goto("http://127.0.0.1:4260/v4.html", {
    waitUntil: "networkidle",
  });
  await ready();
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await ready();
  const before = await page.evaluate(() => window.__corelessV4.account.snapshot());
  await page.click('[data-start-action="account"]');
  await page.waitForTimeout(250);
  const dialog = await page.evaluate(() => ({
    active: window.__corelessV4.startScreen.snapshot().activeDialog,
    title: document.querySelector(
      '[data-start-dialog="account"] h2',
    )?.textContent,
    status: document.querySelector(
      '[data-start-dialog="account"] [data-account-status]',
    )?.textContent,
    providers: [...document.querySelectorAll("[data-account-provider]")]
      .map(button => ({
        id: button.dataset.accountProvider,
        disabled: button.disabled,
      })),
    notice: document.querySelector("[data-account-notice]")?.textContent,
  }));
  await page.screenshot({
    path: `${artifactDirectory}/account-dialog.png`,
  });
  await page.reload({ waitUntil: "networkidle" });
  await ready();
  const after = await page.evaluate(() => window.__corelessV4.account.snapshot());
  const checks = [
    ["guestMode", before.mode === "guest"],
    ["guestIdentityStable", before.guestId === after.guestId],
    ["accountDialogOpens", dialog.active === "account"],
    ["accountTitleVisible", dialog.title === "계정 및 저장"],
    ["guestStatusVisible", dialog.status.includes("게스트")],
    ["fourProviders", dialog.providers.map(item => item.id).join(",") ===
      "google,kakao,facebook,naver"],
    ["providersDisabledWithoutDomain",
      dialog.providers.every(item => item.disabled)],
    ["waitingReasonVisible", dialog.notice.includes("최종 사이트 주소")],
    ["consoleErrorsZero", consoleErrors.length === 0],
    ["pageErrorsZero", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
  const result = {
    build: "coreless-v4-account-browser",
    generatedAt: new Date().toISOString(),
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      providerCount: dialog.providers.length,
      guestStable: before.guestId === after.guestId,
      consoleErrors,
      pageErrors,
    },
  };
  fs.mkdirSync("docs/rebuild-v4", { recursive: true });
  fs.writeFileSync(
    "docs/rebuild-v4/account-browser-results.json",
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(JSON.stringify({
    passed: result.passed,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    failed: checks.filter(item => !item.passed).map(item => item.name),
    measurements: result.measurements,
  }, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
