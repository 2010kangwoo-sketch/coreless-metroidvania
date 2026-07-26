import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V4_PASS04_BROWSER_RESULT ??
  "docs/rebuild-v4/pass-04-browser-results.json";
const artifactDirectory = process.env.CORELESS_V4_BROWSER_ARTIFACT_DIR ??
  "browser-artifacts/v4-pass04";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4254"], {
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

  const waitReady = async () => {
    await page.waitForFunction(() =>
      document.documentElement.dataset.corelessV4Ready === "true");
    await page.locator("#v4CheckpointLab").focus();
    await page.waitForTimeout(80);
  };
  const snapshot = () =>
    page.evaluate(() => window.__corelessV4.runtime.snapshot());
  const pause = () =>
    page.evaluate(() => window.__corelessV4.runtime.pauseForAudit());
  const advance = frames =>
    page.evaluate(count => window.__corelessV4.runtime.advanceAuditFrames(count), frames);
  const driveTier = async tier => {
    const key = tier % 2 === 1 ? "KeyD" : "KeyA";
    await page.keyboard.down(key);
    let state;
    for (let batch = 0; batch < 16; batch += 1) {
      state = await advance(480);
      if (state.atConnector || state.completed) break;
    }
    await page.keyboard.up(key);
    if (!state?.atConnector && !state?.completed) {
      throw new Error(`Tier ${tier} did not reach its endpoint`);
    }
    return state;
  };
  const useLift = async expectedTier => {
    await page.keyboard.press("KeyE");
    const state = await advance(240);
    if (state.currentTier !== expectedTier || state.lift) {
      throw new Error(`Lift did not reach tier ${expectedTier}`);
    }
    return state;
  };
  const reloadReady = async () => {
    await page.reload({ waitUntil: "networkidle" });
    await waitReady();
    return snapshot();
  };

  await page.goto("http://127.0.0.1:4254/v4.html", { waitUntil: "networkidle" });
  await waitReady();
  await page.evaluate(() => localStorage.clear());
  const initial = await reloadReady();
  await pause();
  await page.locator("#v4CheckpointLab").screenshot({
    path: `${artifactDirectory}/pass04-clean-start.png`,
  });

  const tierOneEnd = await driveTier(1);
  await page.locator("#v4CheckpointLab").screenshot({
    path: `${artifactDirectory}/pass04-s06-checkpoint.png`,
  });
  await useLift(2);
  await page.keyboard.down("KeyA");
  await advance(960);
  await page.keyboard.up("KeyA");
  const beforeDefeat = await snapshot();
  await page.keyboard.press("KeyK");
  await advance(30);
  await page.locator("#v4CheckpointLab").screenshot({
    path: `${artifactDirectory}/pass04-defeat-recovery.png`,
  });
  await advance(70);
  const afterDefeat = await snapshot();

  await driveTier(1);
  await useLift(2);
  const tierTwoEnd = await driveTier(2);
  await useLift(3);
  await page.keyboard.down("KeyD");
  await advance(960);
  await page.keyboard.up("KeyD");
  const beforeFall = await snapshot();
  await page.keyboard.press("KeyF");
  await advance(30);
  await page.locator("#v4CheckpointLab").screenshot({
    path: `${artifactDirectory}/pass04-fall-recovery.png`,
  });
  await advance(70);
  const afterFall = await snapshot();

  const reloadS12 = await reloadReady();
  await page.evaluate(key => localStorage.setItem(key, "{broken-save"), "coreless.v4.megaRoom01.save");
  const corruptFallback = await reloadReady();

  await pause();
  for (let tier = 1; tier <= 6; tier += 1) {
    await driveTier(tier);
    if (tier < 6) await useLift(tier + 1);
  }
  const fullRoute = await snapshot();
  await page.locator("#v4CheckpointLab").screenshot({
    path: `${artifactDirectory}/pass04-full-route.png`,
  });

  const restoredS35 = await reloadReady();
  await pause();
  const finalAfterReload = await driveTier(6);
  await page.evaluate(() => window.__corelessV4.runtime.render());
  await page.locator("#v4CheckpointLab").screenshot({
    path: `${artifactDirectory}/pass04-restored-finish.png`,
  });
  await page.screenshot({
    path: `${artifactDirectory}/pass04-page.png`,
    fullPage: true,
  });

  const state = await page.evaluate(() => {
    const v4 = window.__corelessV4;
    const status = document.querySelector("#v4AuditStatus");
    const canvas = document.querySelector("#v4CheckpointLab");
    return {
      build: { ...v4.build },
      audits: {
        pass01: { ...v4.pass01Audit },
        pass02: { ...v4.pass02Audit },
        pass03: { ...v4.pass03Audit },
        pass04: { ...v4.audit },
      },
      checkpoints: v4.persistence.checkpoints.map(item => ({
        id: item.id,
        tier: item.tier,
        position: { ...item.position },
      })),
      save: { ...v4.persistence.config },
      statusText: status.textContent,
      statusState: status.dataset.state,
      canvas: {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
      },
    };
  });

  const defeatRecoverySeconds =
    afterDefeat.audit.recoveryFrames / 120;
  const fallRecoverySeconds =
    (afterFall.audit.recoveryFrames - afterDefeat.audit.recoveryFrames) / 120;
  const expectedCheckpointIds = "S01,S06,S12,S18,S24,S30,S35";
  const checks = [
    ["documentReady", state.build.id === "rebuild-v4-pass04"],
    ["previousAuditsPass", Object.values(state.audits).every(audit => audit.passed)],
    ["statusShowsSavePass", state.statusState === "pass" && state.statusText.includes("34/34")],
    ["canvasHasExpectedResolution", state.canvas.width === 1400 && state.canvas.height === 900],
    ["cleanStartUsesS01", initial.checkpointId === "S01" && initial.currentTier === 1],
    ["cleanStartCreatesSafeSave", initial.saveRecord?.checkpointId === "S01"],
    ["tierOneActivatesS06", tierOneEnd.checkpointId === "S06" && tierOneEnd.saveRecord?.checkpointId === "S06"],
    ["defeatTestStartedAfterCompletedTier", beforeDefeat.currentTier === 2 && beforeDefeat.checkpointId === "S06"],
    ["defeatReturnsToS06", afterDefeat.checkpointId === "S06" && afterDefeat.currentTier === 1],
    ["defeatRecoveryIsShort", defeatRecoverySeconds <= state.save.maximumRecoverySeconds],
    ["tierTwoActivatesS12", tierTwoEnd.checkpointId === "S12" && tierTwoEnd.saveRecord?.checkpointId === "S12"],
    ["fallTestStartedOnTierThree", beforeFall.currentTier === 3 && beforeFall.checkpointId === "S12"],
    ["fallReturnsToS12", afterFall.checkpointId === "S12" && afterFall.currentTier === 2],
    ["fallRecoveryIsShort", fallRecoverySeconds <= state.save.maximumRecoverySeconds],
    ["reloadRestoresS12", reloadS12.checkpointId === "S12" && reloadS12.currentTier === 2 && reloadS12.audit.checkpointLoads === 1],
    ["corruptSaveFallsBackToS01", corruptFallback.checkpointId === "S01" && corruptFallback.audit.invalidSaves === 1],
    ["corruptSaveReplacedWithValidS01", corruptFallback.saveRecord?.checkpointId === "S01"],
    ["fullRouteCompletesAfterFallback", fullRoute.audit.completed && fullRoute.currentTier === 6],
    ["allSevenCheckpointsActivated", fullRoute.audit.activatedCheckpointIds.join(",") === expectedCheckpointIds],
    ["fullRouteSavedS35", fullRoute.checkpointId === "S35" && fullRoute.saveRecord?.checkpointId === "S35"],
    ["fullRouteVisitsAllZones", fullRoute.visitedZoneIds.length === 36],
    ["fullRouteStreamingStillBounded", fullRoute.audit.peakActiveZones <= 4 && fullRoute.audit.emptyStreamFrames === 0],
    ["saveReloadRestoresS35", restoredS35.checkpointId === "S35" && restoredS35.currentTier === 6],
    ["restoredProgressDerivesThirtyFiveZones", restoredS35.visitedZoneIds.length === 35],
    ["shortFinalReplayCompletes", finalAfterReload.audit.completed && finalAfterReload.visitedZoneIds.length === 36],
    ["replayDistanceStaysWithinOneTier", afterFall.audit.maximumReplayDistance <= state.save.maximumReplayDistance],
    ["fallVisualStepBounded", afterFall.audit.maximumRecoveryFallStep <= 6],
    ["recoveryCameraSnapsOnlyUnderFade", afterFall.audit.cameraSnapsUnderFullFade === 2],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 4,
    generatedAt: new Date().toISOString(),
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      checkpoints: state.checkpoints.length,
      cleanStartCheckpoint: initial.checkpointId,
      defeatOriginTier: beforeDefeat.currentTier,
      defeatRespawnCheckpoint: afterDefeat.checkpointId,
      defeatRecoverySeconds,
      fallOriginTier: beforeFall.currentTier,
      fallRespawnCheckpoint: afterFall.checkpointId,
      fallRecoverySeconds,
      reloadCheckpoint: reloadS12.checkpointId,
      corruptFallbackCheckpoint: corruptFallback.checkpointId,
      activatedCheckpointIds: fullRoute.audit.activatedCheckpointIds,
      fullRouteCompletionSeconds: fullRoute.audit.completionSeconds,
      fullRouteVisitedZones: fullRoute.visitedZoneIds.length,
      fullRoutePeakActiveZones: fullRoute.audit.peakActiveZones,
      maximumReplayDistance: afterFall.audit.maximumReplayDistance,
      restoredFinalCheckpoint: restoredS35.checkpointId,
      restoredVisitedZones: restoredS35.visitedZoneIds.length,
      finalReplaySeconds: finalAfterReload.audit.completionSeconds,
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
