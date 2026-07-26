import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from
  "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";

const outputPath = process.env.CORELESS_V4_RESET_PASS02_BROWSER_RESULT ??
  "docs/rebuild-v4/reset-pass-02-browser-results.json";
const screenshotPath = process.env.CORELESS_V4_RESET_PASS02_SCREENSHOT ??
  "docs/rebuild-v4/assets/reset-pass02-ground-lab.png";
const port = 4262;
const server = spawn("python3", ["-m", "http.server", String(port)], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 650));

let browser;
try {
  const executablePath = fs.existsSync("/tmp/coreless138/chromium")
    ? "/tmp/coreless138/chromium"
    : process.env.CHROMIUM_EXECUTABLE_PATH;
  if (!executablePath) {
    throw new Error("Chromium executable is unavailable");
  }
  browser = await playwright.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1120 },
    deviceScaleFactor: 1,
  });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => pageErrors.push(String(error)));

  await page.goto(`http://127.0.0.1:${port}/v4-reset-pass02.html`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() =>
    document.documentElement.dataset.corelessV4ResetPass02Ready === "true");
  await page.locator("#resetPass02GroundLab").focus();

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass02.runtime.snapshot()
      .audit.accelerationSamples.length >= 1);
  await page.waitForTimeout(140);
  await page.keyboard.up("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass02.runtime.snapshot()
      .audit.stopSamples.length >= 1);

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass02.runtime.snapshot().player.vx >= 360);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyA");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass02.runtime.snapshot()
      .audit.reversalSamples.length >= 1);
  await page.keyboard.up("KeyA");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass02.runtime.snapshot()
      .audit.stopSamples.length >= 2);

  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass02.runtime.snapshot().player.vx >= 360);
  await page.keyboard.up("ArrowRight");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass02.runtime.snapshot()
      .audit.stopSamples.length >= 3);

  await page.waitForTimeout(80);
  const state = await page.evaluate(() => {
    const root = window.__corelessV4ResetPass02;
    root.runtime.render();
    const canvas = document.querySelector("#resetPass02GroundLab");
    const status = document.querySelector("#resetPass02AuditStatus");
    return {
      build: { ...root.build },
      audit: { ...root.audit },
      movement: { ...root.movement },
      lab: { ...root.lab },
      runtime: root.runtime.snapshot(),
      canvas: {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
      },
      statusText: status.textContent,
      statusState: status.dataset.state,
    };
  });
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.locator("#resetPass02GroundLab").screenshot({
    path: screenshotPath,
  });

  const latestAcceleration =
    state.runtime.audit.accelerationSamples.at(-1);
  const latestStop = state.runtime.audit.stopSamples.at(-1);
  const reversal = state.runtime.audit.reversalSamples[0];
  const states = new Set(state.runtime.audit.stateSequence);
  const checks = [
    ["documentReady",
      state.build.id === "rebuild-v4-reset-pass02-ground-movement"],
    ["staticAuditPassed", state.audit.passed],
    ["statusShowsPass",
      state.statusState === "pass" &&
      state.statusText.includes(`${state.audit.passedCount}/${state.audit.totalCount}`)],
    ["canvasResolutionCorrect",
      state.canvas.width === 1400 && state.canvas.height === 900],
    ["actualKeyboardEventsRecorded",
      state.runtime.audit.keyDowns >= 4 &&
      state.runtime.audit.keyUps >= 4],
    ["noSyntheticRepeatDependency",
      state.runtime.audit.repeatedKeyDowns === 0],
    ["accelerationMeasured",
      state.runtime.audit.accelerationSamples.length >= 3],
    ["accelerationTimingResponsive",
      latestAcceleration?.seconds >= 0.12 &&
      latestAcceleration?.seconds <= 0.21],
    ["stopMeasured", state.runtime.audit.stopSamples.length >= 3],
    ["stopTimingBounded",
      latestStop?.seconds >= 0.1 && latestStop?.seconds <= 0.17],
    ["stopDistanceBounded",
      latestStop?.distance >= 18 && latestStop?.distance <= 31],
    ["reversalMeasured",
      state.runtime.audit.reversalSamples.length === 1],
    ["reversalTimingBounded",
      reversal?.seconds >= 0.16 && reversal?.seconds <= 0.25],
    ["reversalOvershootBounded",
      reversal?.forwardOvershoot >= 14 &&
      reversal?.forwardOvershoot <= 25],
    ["reversalEndsInOppositeDirection", reversal?.endSpeed < 0],
    ["facingChangesOnlyWithRealDirection",
      state.runtime.audit.facingChanges === 2],
    ["allGroundMotionStatesObserved",
      ["idle", "run-start", "run-loop", "run-stop", "turn"]
        .every(name => states.has(name))],
    ["positionStepBounded",
      state.runtime.audit.maximumPositionStep <= 3.4],
    ["noBoundaryCorrection",
      state.runtime.audit.boundaryContacts === 0],
    ["noResetUsed", state.runtime.audit.resets === 0],
    ["playerEndsIdle", state.runtime.player.state === "idle"],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
  const result = {
    build: state.build,
    generatedAt: new Date().toISOString(),
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      accelerationSamples: state.runtime.audit.accelerationSamples,
      stopSamples: state.runtime.audit.stopSamples,
      reversalSamples: state.runtime.audit.reversalSamples,
      stateSequence: state.runtime.audit.stateSequence,
      keyEvents: state.runtime.audit.keyEvents,
      maximumPositionStep: state.runtime.audit.maximumPositionStep,
      facingChanges: state.runtime.audit.facingChanges,
      boundaryContacts: state.runtime.audit.boundaryContacts,
      fixedFrames: state.runtime.audit.fixedFrames,
    },
    consoleErrors,
    pageErrors,
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
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
