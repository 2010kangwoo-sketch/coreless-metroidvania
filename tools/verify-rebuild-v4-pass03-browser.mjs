import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V4_PASS03_BROWSER_RESULT ??
  "docs/rebuild-v4/pass-03-browser-results.json";
const artifactDirectory = process.env.CORELESS_V4_BROWSER_ARTIFACT_DIR ??
  "browser-artifacts/v4-pass03";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4253"], {
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

  await page.goto("http://127.0.0.1:4253/v4.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.corelessV4Ready === "true");
  await page.locator("#v4StreamingLab").focus();
  await page.waitForTimeout(250);
  await page.locator("#v4StreamingLab").screenshot({
    path: `${artifactDirectory}/pass03-streaming-entry.png`,
  });

  await page.keyboard.down("KeyD");
  await page.waitForTimeout(2200);
  await page.keyboard.up("KeyD");
  const realtime = await page.evaluate(() => window.__corelessV4.runtime.snapshot());

  await page.keyboard.press("KeyR");
  await page.waitForTimeout(50);
  await page.evaluate(() => window.__corelessV4.runtime.pauseForAudit());
  await page.waitForTimeout(50);

  let middle = null;
  for (let tier = 1; tier <= 6; tier += 1) {
    const directionKey = tier % 2 === 1 ? "KeyD" : "KeyA";
    await page.keyboard.down(directionKey);
    let batches = 0;
    while (batches < 16) {
      const snapshot = await page.evaluate(() =>
        window.__corelessV4.runtime.advanceAuditFrames(480));
      if (snapshot.atConnector || snapshot.completed) break;
      batches += 1;
    }
    await page.keyboard.up(directionKey);
    const endpoint = await page.evaluate(() => window.__corelessV4.runtime.snapshot());
    if (tier < 6) {
      if (!endpoint.atConnector) throw new Error(`Tier ${tier} did not reach its connector`);
      await page.keyboard.press("KeyE");
      await page.evaluate(() => window.__corelessV4.runtime.advanceAuditFrames(240));
      const afterLift = await page.evaluate(() => window.__corelessV4.runtime.snapshot());
      if (afterLift.currentTier !== tier + 1) {
        throw new Error(`Tier ${tier} lift did not reach tier ${tier + 1}`);
      }
      if (tier === 3) {
        middle = afterLift;
        await page.locator("#v4StreamingLab").screenshot({
          path: `${artifactDirectory}/pass03-tier-four.png`,
        });
      }
    }
  }

  const final = await page.evaluate(() => {
    window.__corelessV4.runtime.render();
    return window.__corelessV4.runtime.snapshot();
  });
  await page.locator("#v4StreamingLab").screenshot({
    path: `${artifactDirectory}/pass03-streaming-complete.png`,
  });
  await page.screenshot({
    path: `${artifactDirectory}/pass03-page.png`,
    fullPage: true,
  });

  const state = await page.evaluate(() => {
    const v4 = window.__corelessV4;
    const canvas = document.querySelector("#v4StreamingLab");
    const status = document.querySelector("#v4AuditStatus");
    return {
      build: { ...v4.build },
      audit: { ...v4.audit },
      pass01Audit: { ...v4.pass01Audit },
      pass02Audit: { ...v4.pass02Audit },
      config: { ...v4.streaming.config },
      tiers: v4.streaming.tiers.map(item => ({ ...item })),
      zones: v4.streaming.zones.map(item => ({
        id: item.id,
        tier: item.tier,
        column: item.column,
        bounds: { ...item.bounds },
      })),
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
    ["documentReady", state.build.id === "rebuild-v4-pass03"],
    ["pass01StillValid", state.pass01Audit.passed],
    ["pass02StillValid", state.pass02Audit.passed],
    ["staticStreamingAuditPassed", state.audit.passed],
    ["statusShowsStreamingPass", state.statusState === "pass" && state.statusText.includes("30/30")],
    ["canvasHasExpectedResolution", state.canvas.width === 1400 && state.canvas.height === 900],
    ["realKeyboardMovesPlayer", realtime.player.x > 700],
    ["realTimeCameraFollows", realtime.camera.x > 50],
    ["realTimeCameraIsSmooth", realtime.audit.maximumCameraStep > 0 && realtime.audit.maximumCameraStep <= 4],
    ["middleCaptureReachedTierFour", middle?.currentTier === 4],
    ["fullSixTierRouteCompleted", final.audit.completed && final.currentTier === 6],
    ["fiveLiftTransitions", final.audit.tierTransitions === 5],
    ["allThirtySixZonesVisited", final.visitedZoneIds.length === 36],
    ["allThirtySixZonesStreamed", final.streamedZoneIds.length === 36],
    ["activeZonesStayBounded", final.audit.peakActiveZones <= state.config.maximumActiveZones],
    ["activeZonesNeverEmpty", final.audit.emptyStreamFrames === 0],
    ["finalActiveSetIsSmall", final.activeZoneIds.length > 0 && final.activeZoneIds.length <= 4],
    ["playerNeverTeleports", final.audit.maximumPositionStep <= 7.25],
    ["cameraNeverTeleports", final.audit.maximumCameraStep <= 7.25],
    ["horizontalCameraStepBounded", final.audit.maximumHorizontalCameraStep <= 4],
    ["verticalCameraStepBounded", final.audit.maximumVerticalCameraStep <= 7.25],
    ["completionTimeMatchesWorldScale", final.audit.completionSeconds >= 235 && final.audit.completionSeconds <= 260],
    ["cameraEndsInsideWorld", final.camera.x >= 0 && final.camera.x <= 15400 && final.camera.y >= 0 && final.camera.y <= 6500],
    ["sixDataTiersRendered", state.tiers.length === 6],
    ["thirtySixDataZonesRendered", state.zones.length === 36],
    ["streamLoadsAndUnloadsOccurred", final.audit.streamLoads >= 36 && final.audit.streamUnloads >= 30],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 3,
    generatedAt: new Date().toISOString(),
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      realtimePlayerX: realtime.player.x,
      realtimeCameraMaximumStep: realtime.audit.maximumCameraStep,
      completionSeconds: final.audit.completionSeconds,
      tierTransitions: final.audit.tierTransitions,
      visitedZones: final.visitedZoneIds.length,
      streamedZones: final.streamedZoneIds.length,
      peakActiveZones: final.audit.peakActiveZones,
      finalActiveZones: final.activeZoneIds.length,
      streamLoads: final.audit.streamLoads,
      streamUnloads: final.audit.streamUnloads,
      maximumPositionStep: final.audit.maximumPositionStep,
      maximumCameraStep: final.audit.maximumCameraStep,
      maximumHorizontalCameraStep: final.audit.maximumHorizontalCameraStep,
      maximumVerticalCameraStep: final.audit.maximumVerticalCameraStep,
      emptyStreamFrames: final.audit.emptyStreamFrames,
      fixedFrames: final.audit.fixedFrames,
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
