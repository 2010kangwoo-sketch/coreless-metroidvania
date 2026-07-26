import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V4_PASS02_BROWSER_RESULT ??
  "docs/rebuild-v4/pass-02-browser-results.json";
const artifactDirectory = process.env.CORELESS_V4_BROWSER_ARTIFACT_DIR ??
  "browser-artifacts/v4-pass02";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4252"], {
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

  await page.goto("http://127.0.0.1:4252/v4.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.corelessV4Ready === "true");
  await page.locator("#v4MovementLab").focus();
  await page.waitForTimeout(250);
  await page.locator("#v4MovementLab").screenshot({
    path: `${artifactDirectory}/pass02-movement-entry.png`,
  });

  await page.keyboard.down("Space");
  await page.waitForTimeout(65);
  await page.keyboard.up("Space");
  await page.waitForTimeout(850);
  const shortJump = await page.evaluate(() => window.__corelessV4.runtime.snapshot());

  await page.keyboard.press("KeyR");
  await page.keyboard.down("Space");
  await page.waitForTimeout(420);
  await page.keyboard.up("Space");
  await page.waitForTimeout(850);
  const fullJump = await page.evaluate(() => window.__corelessV4.runtime.snapshot());

  await page.keyboard.press("KeyR");
  await page.keyboard.down("KeyD");
  await page.waitForFunction(() => window.__corelessV4.runtime.snapshot().completed, null, {
    timeout: 12000,
  });
  await page.keyboard.up("KeyD");
  const direct = await page.evaluate(() => window.__corelessV4.runtime.snapshot());
  await page.locator("#v4MovementLab").screenshot({
    path: `${artifactDirectory}/pass02-direct-finish.png`,
  });

  await page.keyboard.press("KeyR");
  await page.keyboard.down("KeyD");
  let attackLoop = 0;
  while (attackLoop < 30) {
    const completed = await page.evaluate(() => window.__corelessV4.runtime.snapshot().completed);
    if (completed) break;
    await page.keyboard.press("KeyB");
    await page.waitForTimeout(420);
    attackLoop += 1;
  }
  await page.keyboard.up("KeyD");
  await page.waitForFunction(() => window.__corelessV4.runtime.snapshot().completed, null, {
    timeout: 4000,
  });
  const attack = await page.evaluate(() => window.__corelessV4.runtime.snapshot());
  await page.locator("#v4MovementLab").screenshot({
    path: `${artifactDirectory}/pass02-attack-finish.png`,
  });
  await page.screenshot({
    path: `${artifactDirectory}/pass02-page.png`,
    fullPage: true,
  });

  const state = await page.evaluate(() => {
    const v4 = window.__corelessV4;
    const canvas = document.querySelector("#v4MovementLab");
    const status = document.querySelector("#v4AuditStatus");
    return {
      build: { ...v4.build },
      audit: { ...v4.audit },
      pass01Audit: { ...v4.pass01Audit },
      measurements: { ...v4.movement.measurements },
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

  const checks = [
    ["documentReady", state.build.id === "rebuild-v4-pass02"],
    ["pass01StillValid", state.pass01Audit.passed],
    ["staticMovementAuditPassed", state.audit.passed],
    ["statusShowsMovementPass", state.statusState === "pass" && state.statusText.includes("29/29")],
    ["movementCanvasHasExpectedResolution", state.canvas.width === 1400 && state.canvas.height === 900],
    ["realKeyboardShortJumpInBand", shortJump.audit.maximumJumpHeight >= 70 && shortJump.audit.maximumJumpHeight <= 100],
    ["realKeyboardFullJumpInBand", fullJump.audit.maximumJumpHeight >= 120 && fullJump.audit.maximumJumpHeight <= 145],
    ["realKeyboardJumpProfilesDiffer", fullJump.audit.maximumJumpHeight - shortJump.audit.maximumJumpHeight >= 30],
    ["realKeyboardDirectRunCompleted", direct.audit.completed],
    ["realKeyboardDirectRunWithinBand", direct.audit.completionSeconds >= 6.6 && direct.audit.completionSeconds <= 7.4],
    ["directRunReachesFinish", direct.player.x >= 2900],
    ["directRunHasNoTeleport", direct.audit.maximumPositionStep <= 4.2],
    ["cameraFollowIsSmooth", direct.audit.maximumCameraStep <= 12],
    ["realKeyboardAttackRunCompleted", attack.audit.completed],
    ["attackRunUsedAttacks", attack.audit.attacks >= 15],
    ["attackRunSlowerThanDirect", attack.audit.completionSeconds > direct.audit.completionSeconds],
    ["attackRunDoesNotStopMovement", attack.audit.completionSeconds <= direct.audit.completionSeconds * 1.35],
    ["deterministicAndBrowserDirectTimesAgree", Math.abs(
      state.measurements.sprint.seconds - direct.audit.completionSeconds
    ) <= 0.2],
    ["twentySecondBudgetStillNeedsAuthoredPlay", state.measurements.spaceBudget.requiredAuthoredSeconds >= 13],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 2,
    generatedAt: new Date().toISOString(),
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      deterministicDirectSeconds: state.measurements.sprint.seconds,
      browserShortJumpHeight: shortJump.audit.maximumJumpHeight,
      browserFullJumpHeight: fullJump.audit.maximumJumpHeight,
      browserDirectSeconds: direct.audit.completionSeconds,
      browserAttackSeconds: attack.audit.completionSeconds,
      attackCount: attack.audit.attacks,
      directMaximumSpeed: direct.audit.maximumSpeed,
      directMaximumPositionStep: direct.audit.maximumPositionStep,
      directMaximumCameraStep: direct.audit.maximumCameraStep,
      requiredAuthoredSeconds: state.measurements.spaceBudget.requiredAuthoredSeconds,
      resets: attack.audit.resets,
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
