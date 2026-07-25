import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V3_PASS04_BROWSER_RESULT ??
  "docs/rebuild-v3/pass-04-browser-results.json";
const artifactDirectory = "browser-artifacts/v3-pass04";
const PASS04_WORLD_FLOOR_PLAYER_Y = 1236;
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4247"], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 700));

const getState = page => page.evaluate(() => ({
  x: window.__corelessV3Wall.runtime.player.x,
  y: window.__corelessV3Wall.runtime.player.y,
  vx: window.__corelessV3Wall.runtime.player.vx,
  vy: window.__corelessV3Wall.runtime.player.vy,
  grounded: window.__corelessV3Wall.runtime.player.grounded,
  wallSide: window.__corelessV3Wall.runtime.player.wallSide,
  wallSliding: window.__corelessV3Wall.runtime.player.wallSliding,
  cameraY: window.__corelessV3Wall.runtime.camera.y,
  audit: { ...window.__corelessV3Wall.runtime.audit },
}));

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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => pageErrors.push(String(error)));

  await page.goto("http://127.0.0.1:4247/v3-wall-test.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.corelessV3WallReady === "true");
  await page.locator("#wallCanvas").focus();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${artifactDirectory}/entry.png` });
  const initial = await getState(page);

  await page.keyboard.down("KeyA");
  await page.waitForTimeout(1200);
  await page.keyboard.up("KeyA");
  const noJumpHold = await getState(page);
  await page.screenshot({ path: `${artifactDirectory}/no-auto-climb.png` });

  await page.keyboard.press("KeyR");
  await page.waitForTimeout(140);
  let direction = -1;
  let lastJumpSide = 0;
  let lastJumpAt = 0;
  let lowerCaptured = false;
  let middleCaptured = false;
  let upperCaptured = false;
  let minimumY = Infinity;
  let settledSlideMaximum = 0;
  const wallJumpSamples = [];

  const launchFromFloor = async () => {
    const state = await getState(page);
    const moveRight = state.x < 660;
    direction = moveRight ? -1 : 1;
    await page.keyboard.up(moveRight ? "KeyD" : "KeyA");
    await page.keyboard.down(moveRight ? "KeyA" : "KeyD");
    await page.keyboard.down("Space");
    lastJumpAt = Date.now();
    await page.waitForTimeout(320);
    await page.keyboard.up("Space");
    lastJumpSide = 0;
  };
  await launchFromFloor();

  const started = Date.now();
  while (Date.now() - started < 30000) {
    const sample = await getState(page);
    minimumY = Math.min(minimumY, sample.y);
    if (sample.wallSliding && Date.now() - lastJumpAt > 140) {
      settledSlideMaximum = Math.max(settledSlideMaximum, sample.vy);
    }
    if (!lowerCaptured && sample.y < 1000) {
      lowerCaptured = true;
      await page.screenshot({ path: `${artifactDirectory}/lower-wall-jump.png` });
    }
    if (!middleCaptured && sample.y < 700) {
      middleCaptured = true;
      await page.screenshot({ path: `${artifactDirectory}/middle-rest.png` });
    }
    if (!upperCaptured && sample.y < 410) {
      upperCaptured = true;
      await page.screenshot({ path: `${artifactDirectory}/upper-wall-jump.png` });
    }
    if (sample.audit.finished) break;

    if (sample.y <= 150 && (sample.vx > 0 || sample.grounded)) {
      await page.keyboard.up("KeyA");
      await page.keyboard.down("KeyD");
      direction = 1;
      await page.waitForTimeout(24);
    } else if (sample.grounded && sample.y >= 1200 && Date.now() - lastJumpAt > 420) {
      await launchFromFloor();
    } else if (sample.grounded && sample.y < 1200 && Date.now() - lastJumpAt > 420) {
      direction = sample.x < 660 ? 1 : -1;
      await page.keyboard.up(direction > 0 ? "KeyA" : "KeyD");
      await page.keyboard.down(direction > 0 ? "KeyD" : "KeyA");
      await page.keyboard.down("Space");
      lastJumpAt = Date.now();
      await page.waitForTimeout(330);
      await page.keyboard.up("Space");
    } else if (
      sample.wallSide !== 0 &&
      sample.wallSide !== lastJumpSide &&
      Date.now() - lastJumpAt > 260
    ) {
      const beforeCount = sample.audit.wallJumps;
      lastJumpSide = sample.wallSide;
      direction = -sample.wallSide;
      await page.keyboard.up(direction > 0 ? "KeyA" : "KeyD");
      await page.keyboard.down(direction > 0 ? "KeyD" : "KeyA");
      await page.keyboard.down("Space");
      lastJumpAt = Date.now();
      await page.waitForTimeout(40);
      const after = await getState(page);
      if (after.audit.wallJumps > beforeCount) {
        wallJumpSamples.push({
          side: sample.wallSide,
          vx: after.vx,
          vy: after.vy,
          y: after.y,
        });
      }
      await page.waitForTimeout(290);
      await page.keyboard.up("Space");
    } else {
      await page.waitForTimeout(24);
    }
  }
  await page.keyboard.up("KeyA");
  await page.keyboard.up("KeyD");
  const landingStarted = Date.now();
  while (Date.now() - landingStarted < 1800) {
    if ((await getState(page)).grounded) break;
    await page.waitForTimeout(24);
  }
  await page.screenshot({ path: `${artifactDirectory}/final.png` });
  const final = await getState(page);

  const minimumJumpHorizontalSpeed = wallJumpSamples.length
    ? Math.min(...wallJumpSamples.map(sample => Math.abs(sample.vx)))
    : 0;
  const maximumJumpVerticalSpeed = wallJumpSamples.length
    ? Math.max(...wallJumpSamples.map(sample => -sample.vy))
    : 0;
  const checks = [
    ["documentReady", initial.grounded && initial.y === 1236],
    ["structuralAuditReady", await page.evaluate(() => window.__corelessV3Wall.structuralAudit.passed)],
    ["holdingWallDoesNotClimb", noJumpHold.y >= initial.y - 0.1],
    ["holdingWallDoesNotJump", noJumpHold.audit.wallJumps === 0],
    ["wallContactsRecorded", final.audit.wallContacts >= 7],
    ["wallSlidesRecorded", final.audit.wallSlideFrames > 0],
    ["actualWallJumpsRecorded", final.audit.wallJumps >= 7 && final.audit.wallJumps <= 14],
    ["wallJumpMovesHorizontally", minimumJumpHorizontalSpeed > 250],
    ["wallJumpMovesUpward", maximumJumpVerticalSpeed > 450],
    ["climbedVerticalShaft", minimumY < 360],
    ["finishReached", final.audit.finished],
    ["finishedOnExitPlatform", final.grounded && final.x >= 820 && final.y <= 210],
    ["onlyPlannedResetUsed", final.audit.resets === 1],
    ["edgeCorrectionNotUsedAsClimb", final.audit.edgeCorrections <= 1],
    ["cameraStepBounded", final.audit.maximumCameraStep < 15],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 4,
    generatedAt: new Date().toISOString(),
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      noJumpHoldStartY: Number(initial.y.toFixed(2)),
      noJumpHoldEndY: Number(noJumpHold.y.toFixed(2)),
      wallContacts: final.audit.wallContacts,
      wallSlideFrames: final.audit.wallSlideFrames,
      wallJumps: final.audit.wallJumps,
      minimumJumpHorizontalSpeed: Number(minimumJumpHorizontalSpeed.toFixed(2)),
      maximumJumpVerticalSpeed: Number(maximumJumpVerticalSpeed.toFixed(2)),
      minimumY: Number(minimumY.toFixed(2)),
      climbedHeight: Number((PASS04_WORLD_FLOOR_PLAYER_Y - minimumY).toFixed(2)),
      settledSlideMaximum: Number(settledSlideMaximum.toFixed(2)),
      finalX: Number(final.x.toFixed(2)),
      finalY: Number(final.y.toFixed(2)),
      edgeCorrections: final.audit.edgeCorrections,
      resets: final.audit.resets,
      maximumCameraStep: Number(final.audit.maximumCameraStep.toFixed(3)),
    },
    wallJumpSamples,
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
