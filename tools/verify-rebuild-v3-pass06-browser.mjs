import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V3_PASS06_BROWSER_RESULT ??
  "docs/rebuild-v3/pass-06-browser-results.json";
const artifactDirectory = "browser-artifacts/v3-pass06";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4249"], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 700));

const getState = page => page.evaluate(() => ({
  x: window.__corelessV3.runtime.player.x,
  y: window.__corelessV3.runtime.player.y,
  vx: window.__corelessV3.runtime.player.vx,
  vy: window.__corelessV3.runtime.player.vy,
  grounded: window.__corelessV3.runtime.player.grounded,
  jumpsUsed: window.__corelessV3.runtime.player.jumpsUsed,
  doubleJump: window.__corelessV3.runtime.player.abilities.doubleJump,
  room: window.__corelessV3.runtime.currentRoom,
  checkpoint: window.__corelessV3.runtime.currentCheckpointId,
  progress: { ...window.__corelessV3.runtime.tutorialProgress },
  audit: { ...window.__corelessV3.runtime.audit },
}));

async function waitForState(page, predicate, timeout = 10000) {
  const started = Date.now();
  let state = await getState(page);
  while (Date.now() - started < timeout) {
    if (predicate(state)) return state;
    await page.waitForTimeout(24);
    state = await getState(page);
  }
  return state;
}

async function heldJump(page, holdMs) {
  await page.keyboard.down("Space");
  await page.waitForTimeout(holdMs);
  await page.keyboard.up("Space");
}

async function doubleJump(page) {
  await page.keyboard.down("Space");
  await page.waitForTimeout(210);
  await page.keyboard.up("Space");
  await page.waitForTimeout(80);
  await page.keyboard.down("Space");
  await page.waitForTimeout(250);
  await page.keyboard.up("Space");
}

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

  await page.goto("http://127.0.0.1:4249/v3.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.corelessV3Ready === "true");
  await page.locator("#v3Canvas").focus();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${artifactDirectory}/entry.png` });
  const initial = await getState(page);

  const roomOnePlan = [
    ["low", 390, 520],
    ["mid", 650, 840],
    ["high", 875, 1140],
    ["exit", 1290, 1460],
  ];
  let roomOnePlanIndex = 0;
  let lastJumpAt = 0;
  let roomOneCaptured = false;
  await page.keyboard.down("KeyD");
  const roomOneStarted = Date.now();
  while (Date.now() - roomOneStarted < 18000) {
    const state = await getState(page);
    if (!roomOneCaptured && state.x >= 820) {
      roomOneCaptured = true;
      await page.screenshot({ path: `${artifactDirectory}/room-one-steps.png` });
    }
    if (state.room === "r02" && state.grounded) break;
    while (
      roomOnePlanIndex < roomOnePlan.length &&
      state.x > roomOnePlan[roomOnePlanIndex][2]
    ) {
      roomOnePlanIndex += 1;
    }
    const zone = roomOnePlan[roomOnePlanIndex];
    if (
      zone &&
      state.x >= zone[1] &&
      state.grounded &&
      Date.now() - lastJumpAt > 480
    ) {
      lastJumpAt = Date.now();
      await heldJump(page, 380);
    } else {
      await page.waitForTimeout(28);
    }
  }
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(500);
  const roomTwoEntry = await getState(page);

  const shortBeforeLandings = roomTwoEntry.audit.landings;
  await page.keyboard.down("Space");
  await page.waitForTimeout(65);
  await page.keyboard.up("Space");
  await page.waitForTimeout(90);
  await page.screenshot({ path: `${artifactDirectory}/short-jump.png` });
  const shortLanded = await waitForState(
    page,
    state => state.grounded && state.audit.landings > shortBeforeLandings,
  );

  const fullBeforeLandings = shortLanded.audit.landings;
  await page.keyboard.down("Space");
  await page.waitForTimeout(220);
  await page.screenshot({ path: `${artifactDirectory}/full-jump.png` });
  await page.waitForTimeout(210);
  await page.keyboard.up("Space");
  const fullLanded = await waitForState(
    page,
    state => state.grounded && state.audit.landings > fullBeforeLandings,
  );

  await page.locator("#v3Canvas").focus();
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(180);
  const roomTwoDriveStart = await getState(page);
  const openGate = await waitForState(
    page,
    state => state.audit.gateOpened && state.x >= 3000,
    12000,
  );
  await page.screenshot({ path: `${artifactDirectory}/open-learning-gate.png` });

  const altar = await waitForState(
    page,
    state => state.doubleJump && state.progress.doubleJumpUnlock,
    6000,
  );
  await page.screenshot({ path: `${artifactDirectory}/double-jump-altar.png` });

  const roomThreePlan = [
    ["altar", 3320, 3710],
    ["rise-one", 3570, 4090],
    ["rise-two", 3890, 4160],
    ["landing", 4300, 4490],
  ];
  let roomThreePlanIndex = 0;
  let doubleCaptured = false;
  lastJumpAt = 0;
  const roomThreeStarted = Date.now();
  while (Date.now() - roomThreeStarted < 18000) {
    const state = await getState(page);
    if (state.audit.finished) break;
    while (
      roomThreePlanIndex < roomThreePlan.length &&
      state.x > roomThreePlan[roomThreePlanIndex][2]
    ) {
      roomThreePlanIndex += 1;
    }
    const zone = roomThreePlan[roomThreePlanIndex];
    if (
      zone &&
      state.x >= zone[1] &&
      state.grounded &&
      Date.now() - lastJumpAt > 520
    ) {
      lastJumpAt = Date.now();
      await doubleJump(page);
      if (!doubleCaptured) {
        doubleCaptured = true;
        await page.screenshot({ path: `${artifactDirectory}/double-jump-use.png` });
      }
    } else {
      await page.waitForTimeout(28);
    }
  }
  await page.keyboard.up("KeyD");
  const final = await waitForState(page, state => state.grounded, 1800);
  await page.screenshot({ path: `${artifactDirectory}/final.png` });

  const lessonValues = Object.values(final.progress);
  const checks = [
    ["documentReady", initial.x === 170 && initial.y === 696 && initial.room === "r01"],
    ["tutorialAuditReady", await page.evaluate(() => window.__corelessV3.tutorial.audit.passed)],
    ["startsWithNoLessonsCompleted", Object.values(initial.progress).every(value => !value)],
    ["roomOneMovementLearned", final.progress.move && final.progress.basicJumps],
    ["shortJumpRecognized", fullLanded.audit.shortJumpHeight >= 55 && fullLanded.audit.shortJumpHeight <= 115],
    ["fullJumpRecognized", fullLanded.audit.fullJumpHeight >= 125 && fullLanded.audit.fullJumpHeight <= 175],
    ["gateOpenedAfterBothProfiles", openGate.audit.gateOpened],
    ["enteredRoomThree", altar.room === "r03" && altar.checkpoint === "altar"],
    ["doubleJumpUnlocked", altar.doubleJump && final.progress.doubleJumpUnlock],
    ["doubleJumpActuallyUsed", final.audit.doubleJumps >= 1 && final.progress.doubleJumpUse],
    ["allLessonsCompleted", lessonValues.length === 8 && lessonValues.every(Boolean)],
    ["tutorialFinishReached", final.audit.finished],
    ["threeRoomsVisited", final.audit.roomTransitions === 2],
    ["twoCheckpointsActivated", final.audit.checkpointActivations === 2],
    ["noFinishBacktracking", final.audit.finishBlocked === 0],
    ["noUnexpectedReset", final.audit.resets === 0],
    ["airbornePositionStepBounded", final.audit.maximumPositionStep < 11],
    ["groundedPositionStepBounded", final.audit.maximumGroundedPositionStep < 5],
    ["cameraStepBounded", final.audit.maximumCameraStep < 15],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 6,
    generatedAt: new Date().toISOString(),
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      roomOneJumps: roomTwoEntry.audit.jumps,
      shortJumpHeight: Number(fullLanded.audit.shortJumpHeight?.toFixed(2) ?? 0),
      fullJumpHeight: Number(fullLanded.audit.fullJumpHeight?.toFixed(2) ?? 0),
      gateOpenX: Number(openGate.x.toFixed(2)),
      tutorialLessonsCompleted: final.audit.tutorialLessonsCompleted,
      promptsShown: final.audit.tutorialPromptsShown,
      checkpointActivations: final.audit.checkpointActivations,
      jumps: final.audit.jumps,
      doubleJumps: final.audit.doubleJumps,
      landings: final.audit.landings,
      roomTransitions: final.audit.roomTransitions,
      maximumPositionStep: Number(final.audit.maximumPositionStep.toFixed(3)),
      maximumGroundedPositionStep: Number(final.audit.maximumGroundedPositionStep.toFixed(3)),
      maximumCameraStep: Number(final.audit.maximumCameraStep.toFixed(3)),
      resets: final.audit.resets,
      finishBlocked: final.audit.finishBlocked,
      optionalRewardCollected: final.audit.optionalRewardCollected,
      finalX: Number(final.x.toFixed(2)),
      finalY: Number(final.y.toFixed(2)),
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
