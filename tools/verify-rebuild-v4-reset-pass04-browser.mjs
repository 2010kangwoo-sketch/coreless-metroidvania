import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from
  "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";

const outputPath = process.env.CORELESS_V4_RESET_PASS04_BROWSER_RESULT ??
  "docs/rebuild-v4/reset-pass-04-browser-results.json";
const screenshotPath = process.env.CORELESS_V4_RESET_PASS04_SCREENSHOT ??
  "docs/rebuild-v4/assets/reset-pass04-collision-lab.png";
const wallScreenshotPath =
  process.env.CORELESS_V4_RESET_PASS04_WALL_SCREENSHOT ??
  "docs/rebuild-v4/assets/reset-pass04-wall-contact.png";
const port = 4264;
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

  await page.goto(`http://127.0.0.1:${port}/v4-reset-pass04.html`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() =>
    document.documentElement.dataset.corelessV4ResetPass04Ready === "true");
  await page.locator("#resetPass04CollisionLab").focus();

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass04.runtime.snapshot().player.x >= 2400);
  const slopeState = await page.evaluate(() =>
    window.__corelessV4ResetPass04.runtime.snapshot());
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass04.runtime.snapshot()
      .audit.groundedWallHits >= 1);
  await page.keyboard.up("KeyD");
  const wallState = await page.evaluate(() => {
    const root = window.__corelessV4ResetPass04;
    root.runtime.render();
    return root.runtime.snapshot();
  });
  fs.mkdirSync(path.dirname(wallScreenshotPath), { recursive: true });
  await page.locator("#resetPass04CollisionLab").screenshot({
    path: wallScreenshotPath,
  });

  await page.keyboard.down("Space");
  await page.keyboard.down("KeyD");
  await page.waitForFunction(() => {
    const player = window.__corelessV4ResetPass04.runtime.snapshot().player;
    return player.y + 64 <= 598;
  }, null, { polling: 5 });
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass04.runtime.snapshot().player.x >= 2600);
  await page.keyboard.up("KeyD");
  await page.waitForFunction(() => {
    const state = window.__corelessV4ResetPass04.runtime.snapshot();
    return state.player.grounded &&
      Math.abs(state.player.y - 536) <= 0.1;
  });
  await page.keyboard.up("Space");
  const wallTopState = await page.evaluate(() =>
    window.__corelessV4ResetPass04.runtime.snapshot());

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() => {
    const state = window.__corelessV4ResetPass04.runtime.snapshot();
    return state.player.grounded &&
      state.player.x >= 3000 &&
      Math.abs(state.player.y - 656) <= 0.1;
  });
  await page.keyboard.up("KeyD");

  await page.keyboard.down("Space");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass04.runtime.snapshot()
      .audit.ceilingHits >= 1);
  const ceilingState = await page.evaluate(() =>
    window.__corelessV4ResetPass04.runtime.snapshot());
  await page.keyboard.up("Space");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass04.runtime.snapshot().player.grounded);

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass04.runtime.snapshot()
      .audit.completed);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(80);

  const state = await page.evaluate(() => {
    const root = window.__corelessV4ResetPass04;
    root.runtime.render();
    const canvas = document.querySelector("#resetPass04CollisionLab");
    const status = document.querySelector("#resetPass04AuditStatus");
    return {
      build: { ...root.build },
      audit: { ...root.audit },
      contract: { ...root.contract },
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
  await page.locator("#resetPass04CollisionLab").screenshot({
    path: screenshotPath,
  });

  const checks = [
    ["documentReady",
      state.build.id === "rebuild-v4-reset-pass04-collision"],
    ["staticAuditPassed", state.audit.passed],
    ["statusShowsPass",
      state.statusState === "pass" &&
      state.statusText.includes(`${state.audit.passedCount}/${state.audit.totalCount}`)],
    ["canvasResolutionCorrect",
      state.canvas.width === 1400 && state.canvas.height === 900],
    ["actualKeyboardEventsRecorded",
      state.runtime.audit.keyDowns >= 6 &&
      state.runtime.audit.keyUps >= 6],
    ["allTerrainSegmentsVisited",
      slopeState.audit.visitedTerrainSegments.length === 17],
    ["slopeTraversalStayedGrounded",
      slopeState.audit.slopeAirborneFrames === 0],
    ["slopeAdjustmentBounded",
      slopeState.audit.maximumSlopeAdjustment <= 2.1],
    ["slopeVerticalStepBounded",
      slopeState.audit.maximumVerticalStep <= 2.1],
    ["wallStopsGroundRun",
      wallState.player.x === 2510 &&
      wallState.player.grounded],
    ["wallDoesNotLiftGroundedPlayer",
      wallState.audit.maximumGroundWallVerticalStep === 0],
    ["wallContactVisible",
      wallState.audit.groundedWallHits >= 1],
    ["wallTopReachedByActualJump",
      wallTopState.audit.landedOnWallTop &&
      wallTopState.player.grounded &&
      wallTopState.player.jumpsStarted === 1],
    ["noAutomaticVault",
      wallTopState.audit.automaticVaults === 0],
    ["ceilingCollisionObserved",
      ceilingState.audit.ceilingHits >= 1],
    ["ceilingStopsAtExactBottom",
      Math.abs(ceilingState.player.y - 620) <= 0.1 &&
      ceilingState.player.vy === 0],
    ["noSolidPenetration",
      state.runtime.audit.solidOverlapFrames === 0],
    ["onlyTwoIntentionalJumps",
      state.runtime.player.jumpsStarted === 2],
    ["horizontalStepBounded",
      state.runtime.audit.maximumHorizontalStep <= 3.4],
    ["verticalStepBounded",
      state.runtime.audit.maximumVerticalStep <= 8.8],
    ["combinedStepBounded",
      state.runtime.audit.maximumPositionStep <= 9.4],
    ["noBoundaryCorrection",
      state.runtime.audit.boundaryContacts === 0],
    ["noResetUsed", state.runtime.audit.resets === 0],
    ["routeCompleted", state.runtime.audit.completed],
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
      slopeVisitedSegments:
        slopeState.audit.visitedTerrainSegments.length,
      slopeAirborneFrames: slopeState.audit.slopeAirborneFrames,
      maximumSlopeAdjustment:
        slopeState.audit.maximumSlopeAdjustment,
      wallContactX: wallState.player.x,
      groundedWallHits: wallState.audit.groundedWallHits,
      landedOnWallTop: wallTopState.audit.landedOnWallTop,
      ceilingHits: ceilingState.audit.ceilingHits,
      ceilingContactY: ceilingState.player.y,
      jumpsStarted: state.runtime.player.jumpsStarted,
      automaticVaults: state.runtime.audit.automaticVaults,
      solidOverlapFrames: state.runtime.audit.solidOverlapFrames,
      maximumHorizontalStep:
        state.runtime.audit.maximumHorizontalStep,
      maximumVerticalStep: state.runtime.audit.maximumVerticalStep,
      maximumPositionStep: state.runtime.audit.maximumPositionStep,
      maximumCameraStep: state.runtime.audit.maximumCameraStep,
      boundaryContacts: state.runtime.audit.boundaryContacts,
      fixedFrames: state.runtime.audit.fixedFrames,
      keyEvents: state.runtime.audit.keyEvents,
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
