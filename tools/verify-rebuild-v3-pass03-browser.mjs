import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V3_PASS03_BROWSER_RESULT ??
  "docs/rebuild-v3/pass-03-browser-results.json";
const artifactDirectory = "browser-artifacts/v3-pass03";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4246"], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 700));

const state = page => page.evaluate(() => ({
  x: window.__corelessV3.runtime.player.x,
  y: window.__corelessV3.runtime.player.y,
  vx: window.__corelessV3.runtime.player.vx,
  vy: window.__corelessV3.runtime.player.vy,
  grounded: window.__corelessV3.runtime.player.grounded,
  room: window.__corelessV3.runtime.currentRoom,
  doubleJump: window.__corelessV3.runtime.player.abilities.doubleJump,
  cameraX: window.__corelessV3.runtime.camera.x,
  cameraY: window.__corelessV3.runtime.camera.y,
  audit: { ...window.__corelessV3.runtime.audit },
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

  await page.goto("http://127.0.0.1:4246/v3.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.corelessV3Ready === "true");
  await page.locator("#v3Canvas").focus();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${artifactDirectory}/entry.png` });
  const initial = await state(page);

  await page.keyboard.down("KeyD");
  await page.waitForTimeout(780);
  await page.keyboard.up("KeyD");
  const forward = await state(page);
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(470);
  const reverse = await state(page);
  await page.keyboard.up("KeyA");
  await page.screenshot({ path: `${artifactDirectory}/direction-reversal.png` });

  await page.keyboard.press("KeyR");
  await page.waitForTimeout(120);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(620);
  await page.keyboard.down("Space");
  await page.waitForTimeout(180);
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyD");
  const airBefore = await state(page);
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(250);
  const airAfter = await state(page);
  await page.keyboard.up("KeyA");

  await page.keyboard.press("KeyR");
  await page.waitForTimeout(120);
  const jumpCountBeforeBuffer = (await state(page)).audit.jumps;
  await page.keyboard.down("Space");
  await page.waitForTimeout(420);
  await page.keyboard.up("Space");
  let fallingNearFloor = false;
  const cameraYDuringJump = [];
  const bufferWaitStarted = Date.now();
  while (Date.now() - bufferWaitStarted < 2200) {
    const sample = await state(page);
    cameraYDuringJump.push(sample.cameraY);
    if (sample.vy > 0 && sample.y > 620) {
      fallingNearFloor = true;
      break;
    }
    await page.waitForTimeout(16);
  }
  if (fallingNearFloor) {
    await page.keyboard.down("Space");
    await page.waitForTimeout(190);
    await page.keyboard.up("Space");
  }
  const bufferedLaunch = await state(page);
  await page.screenshot({ path: `${artifactDirectory}/buffered-landing-jump.png` });

  await page.keyboard.press("KeyR");
  await page.waitForTimeout(120);
  const jumpPlan = [
    ["r1-low", 390, 515, false],
    ["r1-mid", 650, 835, false],
    ["r1-high", 875, 1135, false],
    ["r1-exit", 1300, 1450, false],
    ["r2-low", 1635, 1805, false],
    ["r2-recovery", 2770, 2935, false],
    ["r3-altar", 3235, 3410, false],
    ["r3-rise-one", 3580, 3815, true],
    ["r3-rise-two", 3890, 4145, true],
    ["r3-landing", 4320, 4485, false],
  ];
  const jumpAttempts = [];
  let planIndex = 0;
  let lastJumpAt = 0;
  let middleCaptured = false;
  await page.keyboard.down("KeyD");
  const routeStarted = Date.now();
  while (Date.now() - routeStarted < 30000) {
    const sample = await state(page);
    if (!middleCaptured && sample.x > 1770) {
      middleCaptured = true;
      await page.screenshot({ path: `${artifactDirectory}/air-control-room.png` });
    }
    if (sample.audit.finished) break;
    while (planIndex < jumpPlan.length && sample.x > jumpPlan[planIndex][2]) planIndex += 1;
    const zone = jumpPlan[planIndex];
    if (zone && sample.x >= zone[1] && sample.grounded && Date.now() - lastJumpAt > 560) {
      const [id, , , doubleJump] = zone;
      jumpAttempts.push(id);
      lastJumpAt = Date.now();
      await page.keyboard.down("Space");
      await page.waitForTimeout(doubleJump ? 190 : 400);
      await page.keyboard.up("Space");
      if (doubleJump) {
        await page.waitForTimeout(75);
        await page.keyboard.down("Space");
        await page.waitForTimeout(250);
        await page.keyboard.up("Space");
      }
    } else {
      await page.waitForTimeout(35);
    }
  }
  await page.keyboard.up("KeyD");
  const landingWaitStarted = Date.now();
  while (Date.now() - landingWaitStarted < 1400) {
    if ((await state(page)).grounded) break;
    await page.waitForTimeout(24);
  }
  await page.screenshot({ path: `${artifactDirectory}/final.png` });
  const final = await state(page);

  const cameraVerticalRange = cameraYDuringJump.length
    ? Math.max(...cameraYDuringJump) - Math.min(...cameraYDuringJump)
    : Infinity;
  const checks = [
    ["documentReady", initial.room === "r01"],
    ["feelAuditReady", await page.evaluate(() => window.__corelessV3.feel.audit.passed)],
    ["forwardSpeedReached", forward.vx > 350],
    ["directionReversed", reverse.vx < -350],
    ["directionReversalRecorded", reverse.audit.directionReversals >= 1],
    ["airControlChangedDirection", airBefore.vx > 0 && airAfter.vx < airBefore.vx - 220],
    ["airMomentumNotInstantlyCancelled", airAfter.vx > -250],
    ["fallingStateObserved", fallingNearFloor],
    ["bufferedLandingRelaunched", bufferedLaunch.vy < 0 && bufferedLaunch.audit.jumps >= jumpCountBeforeBuffer + 2],
    ["verticalCameraStableDuringJump", cameraVerticalRange < 45],
    ["actualKeyboardCrossedThreeRooms", final.x > 4700 && final.audit.roomTransitions >= 2],
    ["doubleJumpUnlocked", final.doubleJump && final.audit.doubleJumpUnlocked],
    ["doubleJumpUsed", final.audit.doubleJumps >= 2],
    ["finishReached", final.audit.finished],
    ["noResetDuringFullRoute", final.audit.resets === 3],
    ["horizontalSpeedBounded", final.audit.maximumHorizontalSpeed <= 421],
    ["cameraFrameStepBounded", final.audit.maximumCameraStep < 15],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 3,
    generatedAt: new Date().toISOString(),
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      forwardVx: Number(forward.vx.toFixed(2)),
      reverseVx: Number(reverse.vx.toFixed(2)),
      airVxBeforeTurn: Number(airBefore.vx.toFixed(2)),
      airVxAfterTurn: Number(airAfter.vx.toFixed(2)),
      bufferedLaunchVy: Number(bufferedLaunch.vy.toFixed(2)),
      verticalCameraRangeDuringJump: Number(cameraVerticalRange.toFixed(2)),
      finalX: Number(final.x.toFixed(2)),
      finalY: Number(final.y.toFixed(2)),
      directionReversals: final.audit.directionReversals,
      edgeCorrections: final.audit.edgeCorrections,
      jumps: final.audit.jumps,
      doubleJumps: final.audit.doubleJumps,
      landings: final.audit.landings,
      resetsIncludingThreeTestResets: final.audit.resets,
    },
    jumpAttempts,
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
