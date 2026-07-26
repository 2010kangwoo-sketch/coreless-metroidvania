import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from
  "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";

const outputPath =
  process.env.CORELESS_V4_RESET_PASS05_BROWSER_RESULT ??
  "docs/rebuild-v4/reset-pass-05-browser-results.json";
const screenshotPath =
  process.env.CORELESS_V4_RESET_PASS05_SCREENSHOT ??
  "docs/rebuild-v4/assets/reset-pass05-combat-lab.png";
const hitScreenshotPath =
  process.env.CORELESS_V4_RESET_PASS05_HIT_SCREENSHOT ??
  "docs/rebuild-v4/assets/reset-pass05-hit-recovery.png";
const attackScreenshotPath =
  process.env.CORELESS_V4_RESET_PASS05_ATTACK_SCREENSHOT ??
  "docs/rebuild-v4/assets/reset-pass05-attack-active.png";
const port = 4265;
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

  await page.goto(`http://127.0.0.1:${port}/v4-reset-pass05.html`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() =>
    document.documentElement.dataset.corelessV4ResetPass05Ready === "true");
  await page.locator("#resetPass05CombatLab").focus();

  const tap = async (code, milliseconds = 35) => {
    await page.keyboard.down(code);
    await page.waitForTimeout(milliseconds);
    await page.keyboard.up(code);
  };

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.player.x >= 610);
  await page.keyboard.up("KeyD");

  await tap("KeyB");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.targets[0].health === 1);
  await page.evaluate(() => {
    const runtime = window.__corelessV4ResetPass05.runtime;
    runtime.stop();
    runtime.render();
  });
  fs.mkdirSync(path.dirname(attackScreenshotPath), { recursive: true });
  await page.locator("#resetPass05CombatLab").screenshot({
    path: attackScreenshotPath,
  });
  await page.evaluate(() =>
    window.__corelessV4ResetPass05.runtime.start());
  await page.waitForFunction(() => {
    const player = window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.player;
    return player.attack.phase === "recovery" &&
      0.18 - player.attack.phaseElapsed <= 0.11;
  });
  await tap("KeyB");
  await page.waitForFunction(() => {
    const state = window.__corelessV4ResetPass05.runtime.snapshot();
    return state.scenario.targets[0].health === 0 &&
      state.audit.bufferedAttacksStarted === 1;
  });
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.player.attack.phase === "idle");

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.player.x >= 1160);
  await page.keyboard.down("Space");
  await page.waitForFunction(() => {
    const player = window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.player;
    return player.y <= 585 && player.x >= 1170;
  });
  await tap("KeyB");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.targets[1].health === 0);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("Space");
  await page.waitForFunction(() => {
    const state = window.__corelessV4ResetPass05.runtime.snapshot();
    return state.scenario.player.grounded && state.scenario.gateOpen;
  });
  const calibrationState = await page.evaluate(() =>
    window.__corelessV4ResetPass05.runtime.snapshot());

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.player.x >= 1765);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyB");
  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .audit.damageTaken === 1);
  await page.keyboard.up("KeyB");
  await page.keyboard.up("KeyD");
  const hitState = await page.evaluate(() => {
    const root = window.__corelessV4ResetPass05;
    root.runtime.render();
    return root.runtime.snapshot();
  });
  fs.mkdirSync(path.dirname(hitScreenshotPath), { recursive: true });
  await page.locator("#resetPass05CombatLab").screenshot({
    path: hitScreenshotPath,
  });

  await page.keyboard.down("KeyD");
  await page.waitForFunction(() => {
    const state = window.__corelessV4ResetPass05.runtime.snapshot();
    return state.scenario.player.hitstunRemaining <= 0 &&
      state.scenario.player.invulnerabilityRemaining > 0 &&
      state.audit.damageIgnored > 0;
  });
  await page.keyboard.up("KeyD");
  const recoveryState = await page.evaluate(() =>
    window.__corelessV4ResetPass05.runtime.snapshot());

  await page.keyboard.down("Space");
  await page.keyboard.down("KeyD");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.player.x >= 2050);
  await page.keyboard.up("Space");
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .scenario.player.grounded);
  await page.waitForFunction(() =>
    window.__corelessV4ResetPass05.runtime.snapshot()
      .audit.completed);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(80);

  const state = await page.evaluate(() => {
    const root = window.__corelessV4ResetPass05;
    root.runtime.render();
    const runtimeState = root.runtime.snapshot();
    const canvas = document.querySelector("#resetPass05CombatLab");
    const status = document.querySelector("#resetPass05AuditStatus");
    return {
      build: { ...root.build },
      audit: runtimeState.audit,
      contract: { ...root.contract },
      scenario: runtimeState.scenario,
      status: status.textContent,
      statusState: status.dataset.state,
      canvas: {
        width: canvas.width,
        height: canvas.height,
      },
    };
  });
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  await page.locator("#resetPass05CombatLab").screenshot({
    path: screenshotPath,
  });

  const attackPhases = new Set(state.audit.attackPhaseSequence);
  const keyCodes = state.audit.keyEvents.map(event => event.code);
  const checks = [
    ["documentReady", true],
    ["staticAuditPassed", state.statusState === "pass"],
    ["statusShowsPass", /^COMBAT 24\/24$/.test(state.status)],
    ["canvasResolutionCorrect",
      state.canvas.width === 1400 && state.canvas.height === 900],
    ["actualMovementKeysRecorded",
      keyCodes.includes("KeyD") && state.audit.keyDowns > 0],
    ["actualJumpKeyRecorded", keyCodes.includes("Space")],
    ["actualAttackKeyRecorded", keyCodes.includes("KeyB")],
    ["allAttackPhasesObserved",
      ["startup", "active", "recovery"].every(
        phase => attackPhases.has(phase),
      )],
    ["lowTargetNeededTwoAttacks",
      state.audit.targetHitEvents.filter(
        event => event.id === "low-calibration-target",
      ).length === 2],
    ["highTargetHitInAir",
      state.audit.targetHitEvents.some(
        event => event.id === "high-calibration-target",
      ) &&
      calibrationState.scenario.targets[1].health === 0],
    ["allCalibrationTargetsDestroyed",
      state.audit.targetsDestroyed === 2 &&
      state.scenario.targets.every(target => target.health === 0)],
    ["bufferedAttackQueuedOnce",
      state.audit.bufferedAttacksQueued === 1],
    ["bufferedAttackStartedOnce",
      state.audit.bufferedAttacksStarted === 1],
    ["gateOpenedOnlyAfterTargets",
      state.audit.gateOpened && calibrationState.scenario.gateOpen],
    ["incomingHitObserved",
      state.audit.damageTaken === 1 &&
      hitState.scenario.player.health === 3],
    ["incomingHitCancelledAttack",
      state.audit.hitCancels >= 1 &&
      hitState.scenario.player.attack.phase === "idle"],
    ["knockbackMovesAwayAndUp",
      hitState.scenario.player.vx < 0 &&
      hitState.scenario.player.vy < 0],
    ["repeatedContactIgnoredDuringInvulnerability",
      state.audit.damageIgnored > 0 &&
      recoveryState.scenario.player.health === 3],
    ["controlRecoveredBeforeInvulnerabilityEnded",
      state.audit.recoveredControl &&
      recoveryState.scenario.player.invulnerabilityRemaining > 0],
    ["attackMovementSpeedBounded",
      state.audit.maximumAttackSpeed <= 328.01],
    ["healthDidNotRapidlyDrain", state.scenario.player.health === 3],
    ["horizontalStepBounded",
      state.audit.maximumHorizontalStep <= 4.1],
    ["verticalStepBounded",
      state.audit.maximumVerticalStep <= 8.8],
    ["combinedStepBounded",
      state.audit.maximumPositionStep <= 9.2],
    ["noBoundaryCorrection", state.audit.boundaryContacts === 0],
    ["noResetUsed", state.audit.resets === 0],
    ["routeCompleted", state.audit.completed],
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
      attackStarts: state.audit.attackStarts,
      attackActivations: state.audit.attackActivations,
      attackRecoveries: state.audit.attackRecoveries,
      attackPhaseSequence: state.audit.attackPhaseSequence,
      targetHits: state.audit.targetHits,
      targetsDestroyed: state.audit.targetsDestroyed,
      bufferedAttacksQueued: state.audit.bufferedAttacksQueued,
      bufferedAttacksStarted: state.audit.bufferedAttacksStarted,
      hitCancels: state.audit.hitCancels,
      damageTaken: state.audit.damageTaken,
      damageIgnored: state.audit.damageIgnored,
      recoveryInvulnerabilityRemaining:
        recoveryState.scenario.player.invulnerabilityRemaining,
      finalHealth: state.scenario.player.health,
      maximumAttackSpeed: state.audit.maximumAttackSpeed,
      maximumHorizontalStep: state.audit.maximumHorizontalStep,
      maximumVerticalStep: state.audit.maximumVerticalStep,
      maximumPositionStep: state.audit.maximumPositionStep,
      maximumCameraStep: state.audit.maximumCameraStep,
      boundaryContacts: state.audit.boundaryContacts,
      fixedFrames: state.audit.fixedFrames,
      keyEvents: state.audit.keyEvents,
      targetHitEvents: state.audit.targetHitEvents,
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
