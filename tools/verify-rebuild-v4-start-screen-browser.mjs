import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V4_START_SCREEN_BROWSER_RESULT ??
  "docs/rebuild-v4/start-screen-browser-results.json";
const artifactDirectory = process.env.CORELESS_V4_START_SCREEN_ARTIFACT_DIR ??
  "browser-artifacts/v4-start-screen";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4256"], {
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
    arg !== "--ignore-gpu-blocklist" &&
    !arg.startsWith("--use-gl=") &&
    !arg.startsWith("--use-angle=") &&
    arg !== "--enable-unsafe-swiftshader");
  args.push("--disable-gpu");
  browser = await playwright.launch({ executablePath, args, headless: true });
  const page = await browser.newPage({
    viewport: { width: 1680, height: 1050 },
    deviceScaleFactor: 1,
  });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => pageErrors.push(String(error)));

  const waitReady = async () => {
    await page.waitForFunction(() =>
      document.documentElement.dataset.corelessV4Ready === "true");
    await page.waitForTimeout(80);
  };
  const startSnapshot = () =>
    page.evaluate(() => window.__corelessV4.startScreen.snapshot());
  const runtimeSnapshot = () =>
    page.evaluate(() => window.__corelessV4.runtime.snapshot());
  const setS35Save = () => page.evaluate(() => {
    localStorage.setItem("coreless.v4.megaRoom01.save", JSON.stringify({
      schemaVersion: 1,
      build: "coreless-v4",
      checkpointId: "S35",
      checkpointOrder: 6,
      checksum: "S35:6:v1",
    }));
  });
  const reload = async () => {
    await page.reload({ waitUntil: "networkidle" });
    await waitReady();
  };
  const waitClosed = async () => {
    await page.waitForFunction(() =>
      window.__corelessV4.startScreen.snapshot().closed);
  };

  await page.goto("http://127.0.0.1:4256/v4.html", {
    waitUntil: "networkidle",
  });
  await waitReady();
  await page.evaluate(() => localStorage.clear());
  await reload();

  const empty = await startSnapshot();
  const emptyDom = await page.evaluate(() => ({
    title: document.querySelector(".v4-start-brand h1")?.textContent,
    subtitle: document.querySelector(".v4-start-brand span")?.textContent,
    continueDisabled: document.querySelector(
      '[data-start-action="continue"]',
    )?.disabled,
    saveLabel: document.querySelector("[data-start-save-label]")?.textContent,
    bodyState: document.body.dataset.startScreen,
    activeElement: document.activeElement?.dataset?.startAction ?? null,
  }));
  await page.screenshot({
    path: `${artifactDirectory}/start-empty.png`,
  });

  await page.click('[data-start-action="controls"]');
  await page.waitForTimeout(300);
  const controlsOpened = await startSnapshot();
  const controlsVisible = await page.locator(
    '[data-start-dialog="controls"]',
  ).getAttribute("aria-hidden");
  await page.screenshot({
    path: `${artifactDirectory}/start-controls.png`,
  });
  await page.keyboard.press("Escape");
  const controlsClosed = await startSnapshot();

  await page.focus('[data-start-action="new"]');
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  const selectedControls = await startSnapshot();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await waitClosed();
  const newGameStart = await startSnapshot();
  const newGameRuntime = await runtimeSnapshot();
  await page.evaluate(() => window.__corelessV4.runtime.pauseForAudit());

  await setS35Save();
  await reload();
  const saved = await startSnapshot();
  const savedLabel = await page.locator(
    "[data-start-save-label]",
  ).textContent();
  await page.screenshot({
    path: `${artifactDirectory}/start-saved.png`,
  });

  await page.click('[data-start-action="new"]');
  await page.waitForTimeout(300);
  const confirmationOpened = await startSnapshot();
  await page.screenshot({
    path: `${artifactDirectory}/start-confirm.png`,
  });
  await page.click(
    '[data-start-dialog="new-confirm"] [data-start-action="close-dialog"]',
  );
  const confirmationCancelled = await startSnapshot();

  await page.click('[data-start-action="new"]');
  await page.click('[data-start-action="confirm-new"]');
  await waitClosed();
  const confirmedNewRuntime = await runtimeSnapshot();
  await page.evaluate(() => window.__corelessV4.runtime.pauseForAudit());

  await setS35Save();
  await reload();
  const continueReady = await startSnapshot();
  await page.keyboard.press("Enter");
  await waitClosed();
  const continued = await startSnapshot();
  const continuedRuntime = await runtimeSnapshot();
  await page.evaluate(() => window.__corelessV4.runtime.pauseForAudit());

  const state = await page.evaluate(() => ({
    contract: { ...window.__corelessV4.startScreenContract },
    audit: { ...window.__corelessV4.startScreenAudit },
    menuButtons: [...document.querySelectorAll(".v4-start-menu button")]
      .map(button => button.dataset.startAction),
    dialogs: [...document.querySelectorAll("[data-start-dialog]")]
      .map(dialog => dialog.dataset.startDialog),
  }));
  const checks = [
    ["staticStartScreenAuditPasses", state.audit.passed],
    ["modernTitleIsVisible", emptyDom.title === "CORELESS" &&
      emptyDom.subtitle === "중심 없이 깨어난 자"],
    ["fourRealMenuActions", state.menuButtons.join(",") ===
      "continue,new,account,controls"],
    ["emptySaveDisablesContinue", !empty.continueEnabled &&
      emptyDom.continueDisabled &&
      emptyDom.saveLabel === "저장 기록 없음"],
    ["newGameSelectedWithoutSave", empty.selectedAction === "new" &&
      emptyDom.activeElement === "new"],
    ["startScreenLocksPageScroll", emptyDom.bodyState === "open"],
    ["controlsOpenByPointer", controlsOpened.activeDialog === "controls" &&
      controlsVisible === "false"],
    ["escapeClosesControls", controlsClosed.activeDialog === null],
    ["keyboardChangesSelection",
      selectedControls.selectedAction === "controls"],
    ["enterStartsNewGame", newGameStart.closed &&
      newGameStart.startedMode === "new"],
    ["newGameBeginsAtS01", newGameRuntime.checkpointId === "S01"],
    ["validSaveEnablesContinue", saved.continueEnabled &&
      saved.save.checkpointId === "S35" &&
      savedLabel.includes("S35")],
    ["newGameRequiresConfirmation",
      confirmationOpened.activeDialog === "new-confirm"],
    ["confirmationCanBeCancelled",
      confirmationCancelled.activeDialog === null &&
      !confirmationCancelled.closed],
    ["confirmedNewGameClearsProgress",
      confirmedNewRuntime.checkpointId === "S01"],
    ["savedMenuDefaultsToContinue",
      continueReady.selectedAction === "continue"],
    ["enterContinuesSavedGame", continued.closed &&
      continued.startedMode === "continue" &&
      continuedRuntime.checkpointId === "S35"],
    ["controlsDialogExists", state.dialogs.includes("controls")],
    ["accountDialogExists", state.dialogs.includes("account")],
    ["overwriteDialogExists", state.dialogs.includes("new-confirm")],
    ["consoleErrorsZero", consoleErrors.length === 0],
    ["pageErrorsZero", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
  const result = {
    build: state.contract.id,
    generatedAt: new Date().toISOString(),
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      menuActions: state.menuButtons,
      dialogs: state.dialogs,
      emptySaveSelectedAction: empty.selectedAction,
      savedCheckpoint: saved.save.checkpointId,
      confirmedNewCheckpoint: confirmedNewRuntime.checkpointId,
      continuedCheckpoint: continuedRuntime.checkpointId,
      consoleErrors,
      pageErrors,
    },
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({
    passed: result.passed,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    failed: result.checks.filter(item => !item.passed)
      .map(item => item.name),
    measurements: result.measurements,
  }, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
