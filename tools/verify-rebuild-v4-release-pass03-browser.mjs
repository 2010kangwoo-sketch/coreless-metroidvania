import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from
  "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from
  "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V4_RELEASE_PASS03_BROWSER_RESULT ??
  "docs/rebuild-v4/release-cycle/pass-03-browser-results.json";
const screenshotPath = process.env.CORELESS_V4_RELEASE_PASS03_SCREENSHOT ??
  "docs/rebuild-v4/assets/release-pass03-air-lab.png";
const port = 4283;
const server = spawn("python3", ["-m", "http.server", String(port)], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 650));

let browser;
try {
  const localExecutablePath = [
    "/tmp/coreless138/chromium",
    "/tmp/chromium",
    process.env.CHROMIUM_EXECUTABLE_PATH,
  ].find(candidate => candidate && fs.existsSync(candidate));
  const executablePath = localExecutablePath ??
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

  await page.goto(`http://127.0.0.1:${port}/v4-release-pass03.html`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() =>
    document.documentElement.dataset.corelessV4ReleasePass03Ready === "true");
  await page.locator("#releasePass03AirLab").focus();

  await page.keyboard.down("Space");
  await page.waitForTimeout(60);
  await page.keyboard.up("Space");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot()
      .audit.jumpProfiles.length >= 1);

  await page.keyboard.down("Space");
  await page.waitForFunction(() => {
    const player = window.__corelessV4ReleasePass03.runtime.snapshot().player;
    return !player.grounded && player.vy >= 0;
  }, null, { polling: 5 });
  await page.keyboard.up("Space");
  const jumpCountBeforeRejectedPress = await page.evaluate(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot().audit.jumpStarts);
  await page.waitForTimeout(24);
  await page.keyboard.down("Space");
  await page.waitForTimeout(30);
  await page.keyboard.up("Space");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot()
      .audit.jumpProfiles.length >= 2);
  const jumpCountAfterRejectedPress = await page.evaluate(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot().audit.jumpStarts);

  await page.keyboard.down("KeyD");
  await page.keyboard.down("Space");
  await page.waitForFunction(() => {
    const player = window.__corelessV4ReleasePass03.runtime.snapshot().player;
    return !player.grounded && player.vx >= 240;
  });
  const airSpeedBeforeTurn = await page.evaluate(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot().player.vx);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyA");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot().player.vx <= -220);
  const airSpeedAfterTurn = await page.evaluate(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot().player.vx);
  await page.keyboard.up("KeyA");
  await page.keyboard.up("Space");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot()
      .audit.jumpProfiles.length >= 3);

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() => {
    const root = window.__corelessV4ReleasePass03;
    const player = root.runtime.snapshot().player;
    return !player.grounded && player.x > root.lab.upperFloorEndX;
  }, null, { polling: 5 });
  await page.waitForTimeout(42);
  await page.keyboard.down("Space");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot()
      .audit.coyoteJumps >= 1);
  await page.waitForTimeout(65);
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
  await page.waitForFunction(() => {
    const state = window.__corelessV4ReleasePass03.runtime.snapshot();
    return state.audit.jumpProfiles.length >= 4 &&
      state.player.grounded;
  });

  await page.keyboard.down("Space");
  await page.waitForTimeout(80);
  await page.keyboard.up("Space");
  await page.waitForFunction(() => {
    const player = window.__corelessV4ReleasePass03.runtime.snapshot().player;
    return player.state === "fall" && player.y >= 690;
  }, null, { polling: 5 });
  const jumpCountBeforeBuffer = await page.evaluate(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot().audit.jumpStarts);
  await page.keyboard.down("Space");
  await page.waitForTimeout(24);
  await page.keyboard.up("Space");
  await page.waitForFunction(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot()
      .audit.bufferedLandingJumps >= 1);
  const bufferedLaunch = await page.evaluate(() =>
    window.__corelessV4ReleasePass03.runtime.snapshot());
  await page.waitForFunction(() => {
    const state = window.__corelessV4ReleasePass03.runtime.snapshot();
    return state.audit.jumpProfiles.length >= 6 &&
      state.player.grounded;
  });

  await page.waitForTimeout(80);
  const state = await page.evaluate(() => {
    const root = window.__corelessV4ReleasePass03;
    root.runtime.render();
    const canvas = document.querySelector("#releasePass03AirLab");
    const status = document.querySelector("#releasePass03AuditStatus");
    return {
      build: { ...root.build },
      audit: { ...root.audit },
      movement: { ...root.movement },
      acceptance: { ...root.acceptance },
      measurements: { ...root.measurements },
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
  await page.locator("#releasePass03AirLab").screenshot({
    path: screenshotPath,
  });

  const profiles = state.runtime.audit.jumpProfiles;
  const shortJump = profiles[0];
  const fullJump = profiles[1];
  const sources = profiles.map(profile => profile.source);
  const observedStates = new Set(state.runtime.audit.stateSequence);
  const checks = [
    ["releaseDocumentReady",
      state.build.id === "coreless-v4-release-pass03-air-forgiveness"],
    ["staticAuditPassed", state.audit.passed],
    ["statusShowsPass",
      state.statusState === "pass" &&
      state.statusText.includes(
        `${state.audit.passedCount}/${state.audit.totalCount}`,
      )],
    ["canvasResolutionCorrect",
      state.canvas.width === 1400 && state.canvas.height === 900],
    ["actualKeyboardEventsRecorded",
      state.runtime.audit.keyDowns >= 10 &&
      state.runtime.audit.keyUps >= 10],
    ["shortJumpMeasured",
      shortJump?.height >= 72 && shortJump?.height <= 103],
    ["fullJumpMeasured",
      fullJump?.height >= 135 && fullJump?.height <= 155],
    ["variableHeightVisible",
      fullJump?.height - shortJump?.height >= 38],
    ["earlyAirPressRejected",
      jumpCountAfterRejectedPress === jumpCountBeforeRejectedPress],
    ["airPressRecorded",
      state.runtime.audit.airJumpPresses >= 2],
    ["airControlStartsRight", airSpeedBeforeTurn >= 240],
    ["airControlReversesLeft", airSpeedAfterTurn <= -220],
    ["coyoteJumpRecorded", state.runtime.audit.coyoteJumps === 1],
    ["coyoteSourceRecorded", sources.includes("coyote")],
    ["bufferedLandingJumpRecorded",
      state.runtime.audit.bufferedLandingJumps === 1],
    ["bufferAddsExactlyOneJump",
      bufferedLaunch.audit.jumpStarts === jumpCountBeforeBuffer + 1],
    ["bufferLaunchesUpward",
      bufferedLaunch.player.vy < 0 &&
      bufferedLaunch.player.lastJumpSource === "buffered-landing"],
    ["bufferSourceRecorded", sources.includes("buffered-landing")],
    ["sixCompletedJumpProfiles", profiles.length >= 6],
    ["airStatesObserved",
      state.acceptance.requiredStates.every(name =>
        observedStates.has(name))],
    ["groundStatesPreserved",
      ["idle", "run-loop", "run-stop"].every(name =>
        observedStates.has(name))],
    ["ordinaryReachHasTwentyPercentReserve",
      state.measurements.maximumOrdinaryDesignRatio <= 0.8 &&
      state.measurements.reservedOrdinaryReachPixels >= 50],
    ["demandingReachHasTenPercentReserve",
      state.measurements.maximumDemandingDesignRatio <= 0.9 &&
      state.measurements.reservedDemandingReachPixels >= 25],
    ["horizontalStepBounded",
      state.runtime.audit.maximumHorizontalStep <= 3.4],
    ["verticalStepBounded",
      state.runtime.audit.maximumVerticalStep <= 8.8],
    ["combinedStepBounded",
      state.runtime.audit.maximumPositionStep <= 9.3],
    ["noBoundaryCorrection",
      state.runtime.audit.boundaryContacts === 0],
    ["noResetUsed", state.runtime.audit.resets === 0],
    ["playerEndsGroundedIdle",
      state.runtime.player.grounded &&
      ["idle", "soft-land", "hard-land"].includes(
        state.runtime.player.state,
      )],
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
      jumpProfiles: profiles,
      jumpStarts: state.runtime.audit.jumpStarts,
      landings: state.runtime.audit.landings,
      coyoteJumps: state.runtime.audit.coyoteJumps,
      bufferedLandingJumps: state.runtime.audit.bufferedLandingJumps,
      airJumpPresses: state.runtime.audit.airJumpPresses,
      airSpeedBeforeTurn,
      airSpeedAfterTurn,
      fullRunningJumpReach:
        state.measurements.fullRunningJump.horizontalReach,
      ordinaryRequiredReachPixels:
        state.measurements.ordinaryRequiredReachPixels,
      demandingRequiredReachPixels:
        state.measurements.demandingRequiredReachPixels,
      reservedOrdinaryReachPixels:
        state.measurements.reservedOrdinaryReachPixels,
      reservedDemandingReachPixels:
        state.measurements.reservedDemandingReachPixels,
      maximumHorizontalStep:
        state.runtime.audit.maximumHorizontalStep,
      maximumVerticalStep:
        state.runtime.audit.maximumVerticalStep,
      maximumPositionStep:
        state.runtime.audit.maximumPositionStep,
      boundaryContacts: state.runtime.audit.boundaryContacts,
      stateSequence: state.runtime.audit.stateSequence,
      keyEvents: state.runtime.audit.keyEvents,
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
    failed: checks.filter(check => !check.passed).map(check => check.name),
    measurements: result.measurements,
  }, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
