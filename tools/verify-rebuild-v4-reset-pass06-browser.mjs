import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from
  "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from
  "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath =
  process.env.CORELESS_V4_RESET_PASS06_BROWSER_RESULT ??
  "docs/rebuild-v4/reset-pass-06-browser-results.json";
const screenshotPath =
  process.env.CORELESS_V4_RESET_PASS06_SCREENSHOT ??
  "docs/rebuild-v4/assets/reset-pass06-camera-lab.png";
const liftScreenshotPath =
  process.env.CORELESS_V4_RESET_PASS06_LIFT_SCREENSHOT ??
  "docs/rebuild-v4/assets/reset-pass06-lift-transition.png";
const hitScreenshotPath =
  process.env.CORELESS_V4_RESET_PASS06_HIT_SCREENSHOT ??
  "docs/rebuild-v4/assets/reset-pass06-hit-damping.png";
const port = 4266;
const server = spawn("python3", ["-m", "http.server", String(port)], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 650));

let browser;
try {
  const executablePath = fs.existsSync("/tmp/coreless138/chromium")
    ? "/tmp/coreless138/chromium"
    : process.env.CHROMIUM_EXECUTABLE_PATH ??
      await chromium.executablePath();
  if (!executablePath) throw new Error("Chromium executable is unavailable");
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

  await page.goto(`http://127.0.0.1:${port}/v4-reset-pass06.html`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() =>
    document.documentElement.dataset.corelessV4ResetPass06Ready === "true");
  await page.locator("#resetPass06CameraLab").focus();

  const tap = async (code, milliseconds = 35) => {
    await page.keyboard.down(code);
    await page.waitForTimeout(milliseconds);
    await page.keyboard.up(code);
  };

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass06.runtime.snapshot().player.x >= 1400);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(220);

  await page.keyboard.down("KeyA");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass06.runtime.snapshot().player.x <= 1050);
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(240);

  await tap("Space", 170);
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass06.runtime.snapshot().player.grounded);
  await tap("KeyB");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass06.runtime.snapshot()
      .player.attack.phase === "idle");

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() => {
    const state = window.__corelessV4ResetPass06.runtime.snapshot();
    return state.player.x >= 2035 && state.player.x <= 2150;
  });
  await page.keyboard.up("KeyD");
  await page.waitForFunction(() => {
    const state = window.__corelessV4ResetPass06.runtime.snapshot();
    return state.lift.active && state.player.y <= 1390;
  });
  await page.evaluate(() => {
    const runtime = window.__corelessV4ResetPass06.runtime;
    runtime.stop();
    runtime.render();
  });
  fs.mkdirSync(path.dirname(liftScreenshotPath), { recursive: true });
  await page.locator("#resetPass06CameraLab").screenshot({
    path: liftScreenshotPath,
  });
  await page.evaluate(() =>
    window.__corelessV4ResetPass06.runtime.start());
  await page.waitForFunction(() => {
    const state = window.__corelessV4ResetPass06.runtime.snapshot();
    return state.lift.arrived && state.audit.upperDeckReached;
  });

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass06.runtime.snapshot().player.x >= 3600);
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass06.runtime.snapshot().audit.damageTaken === 1);
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass06.runtime.snapshot().audit.damageIgnored > 0);
  await page.keyboard.up("KeyD");
  const hitState = await page.evaluate(() => {
    const runtime = window.__corelessV4ResetPass06.runtime;
    runtime.render();
    return runtime.snapshot();
  });
  fs.mkdirSync(path.dirname(hitScreenshotPath), { recursive: true });
  await page.locator("#resetPass06CameraLab").screenshot({
    path: hitScreenshotPath,
  });

  await page.waitForFunction(() =>
    window.__corelessV4ResetPass06.runtime.snapshot()
      .player.hitstunRemaining <= 0);
  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass06.runtime.snapshot().audit.completed);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(180);

  const state = await page.evaluate(() => {
    const root = window.__corelessV4ResetPass06;
    root.runtime.render();
    const runtimeState = root.runtime.snapshot();
    const canvas = document.querySelector("#resetPass06CameraLab");
    const status = document.querySelector("#resetPass06AuditStatus");
    return {
      build: { ...root.build },
      contract: { ...root.contract },
      world: { ...root.world },
      staticAudit: root.audit,
      runtime: runtimeState,
      status: status.textContent,
      statusState: status.dataset.state,
      canvas: {
        width: canvas.width,
        height: canvas.height,
      },
    };
  });
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.locator("#resetPass06CameraLab").screenshot({
    path: screenshotPath,
  });

  const keyCodes = state.runtime.audit.keyEvents.map(event => event.code);
  const ratios = state.contract.parallaxRatios;
  const checks = [
    ["documentReady", true],
    ["staticAuditPassed", state.statusState === "pass"],
    ["statusShowsPass", /^CAMERA 24\/24$/.test(state.status)],
    ["canvasResolutionCorrect",
      state.canvas.width === 1400 && state.canvas.height === 900],
    ["actualRightInputRecorded", keyCodes.includes("KeyD")],
    ["actualLeftInputRecorded", keyCodes.includes("KeyA")],
    ["actualJumpInputRecorded", keyCodes.includes("Space")],
    ["actualAttackInputRecorded", keyCodes.includes("KeyB")],
    ["directionReversalObserved",
      state.runtime.audit.directionReversals >= 1],
    ["positiveLookAheadObserved",
      state.runtime.audit.maximumPositiveLead >= 145],
    ["negativeLookAheadObserved",
      state.runtime.audit.maximumNegativeLead <= -105],
    ["horizontalCameraTravelObserved",
      state.runtime.audit.horizontalTravel >= 3400],
    ["liftActivated", state.runtime.audit.liftActivated],
    ["liftArrived", state.runtime.audit.liftArrived],
    ["upperDeckReached", state.runtime.audit.upperDeckReached],
    ["verticalCameraTravelObserved",
      state.runtime.audit.verticalTravel >= 760],
    ["horizontalFrameStepBounded",
      state.runtime.audit.maximumHorizontalCameraStep < 12],
    ["verticalFrameStepBounded",
      state.runtime.audit.maximumVerticalCameraStep < 12],
    ["combinedFrameStepBounded",
      state.runtime.audit.maximumCameraStep < 16],
    ["hitObserved",
      state.runtime.audit.damageTaken === 1 &&
      hitState.player.health === 3],
    ["invulnerableContactIgnored",
      state.runtime.audit.damageIgnored > 0],
    ["hitCameraStepBounded", state.runtime.audit.cameraHitStep < 12],
    ["hitShakeBounded",
      state.runtime.audit.cameraShakeMaximum <= 5.2],
    ["threeParallaxLayersOrdered",
      ratios.far === 0.16 &&
      ratios.middle === 0.38 &&
      ratios.near === 0.68],
    ["cameraNeverLeftWorld",
      state.runtime.audit.cameraOutOfBoundsFrames === 0],
    ["noBoundaryCorrection",
      state.runtime.audit.boundaryContacts === 0],
    ["noResetUsed", state.runtime.audit.resets === 0],
    ["routeCompleted", state.runtime.audit.completed],
    ["cameraSamplesRecorded",
      state.runtime.audit.cameraSamples.length >= 20],
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
      maximumHorizontalCameraStep:
        state.runtime.audit.maximumHorizontalCameraStep,
      maximumVerticalCameraStep:
        state.runtime.audit.maximumVerticalCameraStep,
      maximumCameraStep: state.runtime.audit.maximumCameraStep,
      maximumPlayerStep: state.runtime.audit.maximumPlayerStep,
      maximumPositiveLead: state.runtime.audit.maximumPositiveLead,
      maximumNegativeLead: state.runtime.audit.maximumNegativeLead,
      horizontalTravel: state.runtime.audit.horizontalTravel,
      verticalTravel: state.runtime.audit.verticalTravel,
      cameraHitStep: state.runtime.audit.cameraHitStep,
      cameraShakeMaximum: state.runtime.audit.cameraShakeMaximum,
      damageTaken: state.runtime.audit.damageTaken,
      damageIgnored: state.runtime.audit.damageIgnored,
      finalHealth: state.runtime.player.health,
      finalPlayer: {
        x: state.runtime.player.x,
        y: state.runtime.player.y,
      },
      finalCamera: state.runtime.camera,
      fixedFrames: state.runtime.audit.fixedFrames,
      keyEvents: state.runtime.audit.keyEvents,
      cameraSamples: state.runtime.audit.cameraSamples,
    },
    errors: {
      console: consoleErrors,
      page: pageErrors,
    },
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({
    passed: result.passed,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    failed: checks.filter(check => !check.passed).map(
      check => check.name,
    ),
    measurements: result.measurements,
  }, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
