import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from
  "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";

const outputPath = process.env.CORELESS_V4_RELEASE_PASS02_BROWSER_RESULT ??
  "docs/rebuild-v4/release-cycle/pass-02-browser-results.json";
const screenshotPath = process.env.CORELESS_V4_RELEASE_PASS02_SCREENSHOT ??
  "docs/rebuild-v4/assets/release-pass02-ground-lab.png";
const port = 4282;
const server = spawn("python3", ["-m", "http.server", String(port)], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 650));

let browser;
try {
  const executablePath = [
    "/tmp/coreless138/chromium",
    "/tmp/chromium",
    process.env.CHROMIUM_EXECUTABLE_PATH,
  ].find(candidate => candidate && fs.existsSync(candidate));
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

  await page.goto(`http://127.0.0.1:${port}/v4-release-pass02.html`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() =>
    document.documentElement.dataset.corelessV4ReleasePass02Ready === "true");
  await page.locator("#releasePass02GroundLab").focus();

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass02.runtime.snapshot()
      .audit.accelerationSamples.length >= 1);
  await page.waitForTimeout(140);
  await page.keyboard.up("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass02.runtime.snapshot()
      .audit.stopSamples.length >= 1);

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass02.runtime.snapshot().player.vx >= 360);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyA");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass02.runtime.snapshot()
      .audit.reversalSamples.length >= 1);
  await page.keyboard.up("KeyA");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass02.runtime.snapshot()
      .audit.stopSamples.length >= 2);

  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass02.runtime.snapshot().player.vx >= 360);
  await page.keyboard.up("ArrowRight");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass02.runtime.snapshot()
      .audit.stopSamples.length >= 3);

  await page.waitForTimeout(80);
  const state = await page.evaluate(() => {
    const root = window.__corelessV4ReleasePass02;
    root.runtime.render();
    const canvas = document.querySelector("#releasePass02GroundLab");
    const status = document.querySelector("#releasePass02AuditStatus");
    return {
      build: { ...root.build },
      audit: { ...root.audit },
      movement: { ...root.movement },
      acceptance: { ...root.acceptance },
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
  await page.locator("#releasePass02GroundLab").screenshot({
    path: screenshotPath,
  });

  const latestAcceleration =
    state.runtime.audit.accelerationSamples.at(-1);
  const latestStop = state.runtime.audit.stopSamples.at(-1);
  const reversal = state.runtime.audit.reversalSamples[0];
  const states = new Set(state.runtime.audit.stateSequence);
  const checks = [
    ["releaseDocumentReady",
      state.build.id === "coreless-v4-release-pass02-ground-baseline"],
    ["staticAuditPassed", state.audit.passed],
    ["statusShowsPass",
      state.statusState === "pass" &&
      state.statusText.includes(
        `${state.audit.passedCount}/${state.audit.totalCount}`,
      )],
    ["canvasResolutionCorrect",
      state.canvas.width === 1400 && state.canvas.height === 900],
    ["actualKeyboardEventsRecorded",
      state.runtime.audit.keyDowns >= 4 &&
      state.runtime.audit.keyUps >= 4],
    ["bothKeyboardLayoutsExercised",
      state.runtime.audit.keyEvents.some(event => event.code === "KeyD") &&
      state.runtime.audit.keyEvents.some(event =>
        event.code === "ArrowRight")],
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
    ["turnClearanceExceedsOvershootByTwoBodies",
      state.movement.directionTurnClearancePlayerBodiesMinimum *
        state.movement.playerWidth -
        reversal?.forwardOvershoot >= state.movement.playerWidth * 2],
    ["allGroundMotionStatesObserved",
      state.acceptance.requiredStates.every(name => states.has(name))],
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
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
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
      directionTurnClearancePixels:
        state.movement.directionTurnClearancePlayerBodiesMinimum *
        state.movement.playerWidth,
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
    failed: checks.filter(check => !check.passed).map(check => check.name),
    measurements: result.measurements,
  }, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
