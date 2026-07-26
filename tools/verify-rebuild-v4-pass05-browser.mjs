import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V4_PASS05_BROWSER_RESULT ??
  "docs/rebuild-v4/pass-05-browser-results.json";
const artifactDirectory = process.env.CORELESS_V4_BROWSER_ARTIFACT_DIR ??
  "browser-artifacts/v4-pass05";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4255"], {
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
    await page.locator("#v4StoryLab").focus();
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
    await pause();
    return snapshot();
  };

  await page.goto("http://127.0.0.1:4255/v4.html", { waitUntil: "networkidle" });
  await waitReady();
  await page.evaluate(() => localStorage.clear());
  const initial = await reloadReady();
  await page.locator("#v4StoryLab").screenshot({
    path: `${artifactDirectory}/pass05-prologue.png`,
  });

  const beforeGuidedMove = await snapshot();
  await page.keyboard.down("KeyD");
  await advance(180);
  await page.keyboard.press("Tab");
  const logOpened = await advance(240);
  await page.locator("#v4StoryLab").screenshot({
    path: `${artifactDirectory}/pass05-moving-log.png`,
  });
  await page.keyboard.press("Tab");
  await page.keyboard.up("KeyD");
  const afterGuidedMove = await snapshot();

  const tierOneEnd = await driveTier(1);
  await page.locator("#v4StoryLab").screenshot({
    path: `${artifactDirectory}/pass05-first-objective-turn.png`,
  });
  await useLift(2);

  const tierEnds = [tierOneEnd];
  for (let tier = 2; tier <= 6; tier += 1) {
    const tierEnd = await driveTier(tier);
    tierEnds.push(tierEnd);
    if (tier < 6) await useLift(tier + 1);
  }
  const fullRoute = await snapshot();
  await page.locator("#v4StoryLab").screenshot({
    path: `${artifactDirectory}/pass05-full-route.png`,
  });

  const restoredS35 = await reloadReady();
  await page.locator("#v4StoryLab").screenshot({
    path: `${artifactDirectory}/pass05-restored-s35.png`,
  });
  const finalAfterReload = await driveTier(6);
  await page.evaluate(() => window.__corelessV4.runtime.render());
  await page.locator("#v4StoryLab").screenshot({
    path: `${artifactDirectory}/pass05-final-objective.png`,
  });
  await page.screenshot({
    path: `${artifactDirectory}/pass05-page.png`,
    fullPage: true,
  });

  const state = await page.evaluate(() => {
    const v4 = window.__corelessV4;
    const status = document.querySelector("#v4AuditStatus");
    const canvas = document.querySelector("#v4StoryLab");
    return {
      build: { ...v4.build },
      audits: {
        pass01: { ...v4.pass01Audit },
        pass02: { ...v4.pass02Audit },
        pass03: { ...v4.pass03Audit },
        pass04: { ...v4.pass04Audit },
        pass05: { ...v4.audit },
      },
      story: {
        prologue: { ...v4.story.prologue },
        objectives: v4.story.objectives.map(item => ({ ...item })),
        tutorial: v4.story.tutorial.map(item => ({ ...item })),
        tierArcs: v4.story.tierArcs.map(item => ({ ...item })),
        zoneGuides: v4.story.zones.length,
        ui: { ...v4.story.ui },
      },
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

  const expectedObjectives =
    "wake,ascend-east,calibrate-cut,test-cut,trace-workers,trace-wings,find-last-memory,prepare-guardian,defeat-guardian,claim-record,leave-for-waterway";
  const checks = [
    ["documentReady", state.build.id === "rebuild-v4-pass05"],
    ["allStaticAuditsPass", Object.values(state.audits).every(audit => audit.passed)],
    ["statusShowsStoryPass", state.statusState === "pass" &&
      state.statusText.includes("42/42")],
    ["canvasHasExpectedResolution", state.canvas.width === 1400 &&
      state.canvas.height === 900],
    ["prologueIsExplicit", state.story.prologue.text.includes("원점 코어") &&
      state.story.prologue.campaignPromise.includes("근원")],
    ["allThirtySixGuidesExposed", state.story.zoneGuides === 36],
    ["sixTutorialLessonsExposed", state.story.tutorial.length === 6],
    ["sixTierArcsExposed", state.story.tierArcs.length === 6],
    ["initialObjectiveIsWake", initial.guidance.objective.id === "wake"],
    ["initialPrologueDisplayed", initial.guidance.activeMessage?.id === "prologue"],
    ["initialTutorialIsMovement", initial.guidance.tutorial?.id === "move"],
    ["bannerDoesNotBlockMovement", afterGuidedMove.player.x >
      beforeGuidedMove.player.x + 100],
    ["logOpenedWithoutPause", logOpened.guidance.logOpen &&
      logOpened.guidance.audit.movementFramesWithLogOpen > 0],
    ["bannerAllowsMovement", afterGuidedMove.guidance.audit
      .movementFramesWithBanner > 0],
    ["logClosedAfterTest", afterGuidedMove.guidance.logOpen === false],
    ["tierOneAnnouncesSixSpaces", tierOneEnd.guidance.announcedZoneIds.length === 6],
    ["tierOneObjectiveTurnsAtS06", tierOneEnd.guidance.objective.id ===
      "ascend-east"],
    ["allSixTiersComplete", fullRoute.completed && fullRoute.currentTier === 6],
    ["allThirtySixSpacesVisited", fullRoute.visitedZoneIds.length === 36],
    ["allThirtySixSpacesAnnounced", fullRoute.guidance.announcedZoneIds.length === 36],
    ["objectiveOrderComplete", fullRoute.guidance.audit.objectiveIds.join(",") ===
      expectedObjectives],
    ["elevenObjectiveStagesReached", fullRoute.guidance.audit.objectiveChanges === 10],
    ["finalObjectiveNamesNextRegion", fullRoute.guidance.objective.id ===
      "leave-for-waterway"],
    ["messageQueueRemainsBounded", fullRoute.guidance.audit.maximumQueueDepth <=
      state.story.ui.maximumQueueDepth],
    ["noGuidanceQueueDrops", fullRoute.guidance.audit.queueDrops === 0],
    ["storyLogRemainsBounded", fullRoute.guidance.storyLog.length <=
      state.story.ui.maximumLogEntries],
    ["guidanceNeverBlocksSimulation", fullRoute.guidance.audit
      .blockedGameplayFrames === 0],
    ["streamingStillBounded", fullRoute.audit.peakActiveZones <= 4 &&
      fullRoute.audit.emptyStreamFrames === 0],
    ["allCheckpointsStillActivate", fullRoute.audit.activatedCheckpointIds.join(",") ===
      "S01,S06,S12,S18,S24,S30,S35"],
    ["s35ReloadRestoresRewardObjective", restoredS35.checkpointId === "S35" &&
      restoredS35.guidance.objective.id === "claim-record"],
    ["s35ReloadMarksPastGuidesSeen", restoredS35.guidance.announcedZoneIds.length === 35],
    ["s35ReloadOnlyAnnouncesCurrentZone", restoredS35.guidance.audit.zoneAnnouncements === 1 &&
      restoredS35.guidance.audit.announcedZoneIds.join(",") === "S35"],
    ["s35ReloadDoesNotFloodQueue", restoredS35.guidance.queuedMessages.length <= 1],
    ["s35RestoredLogBounded", restoredS35.guidance.storyLog.length <=
      state.story.ui.maximumLogEntries],
    ["shortFinalReplayCompletes", finalAfterReload.completed &&
      finalAfterReload.visitedZoneIds.length === 36],
    ["finalReplayUpdatesExitObjective", finalAfterReload.guidance.objective.id ===
      "leave-for-waterway"],
    ["tierEndsPreserveAlternation", tierEnds.map(item => item.direction).join(",") ===
      "east,west,east,west,east,west"],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 5,
    generatedAt: new Date().toISOString(),
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      movementWhileGuidedPixels:
        afterGuidedMove.player.x - beforeGuidedMove.player.x,
      movementFramesWithBanner:
        afterGuidedMove.guidance.audit.movementFramesWithBanner,
      movementFramesWithLogOpen:
        afterGuidedMove.guidance.audit.movementFramesWithLogOpen,
      fullRouteCompletionSeconds: fullRoute.audit.completionSeconds,
      visitedZones: fullRoute.visitedZoneIds.length,
      announcedZones: fullRoute.guidance.announcedZoneIds.length,
      objectiveChanges: fullRoute.guidance.audit.objectiveChanges,
      objectiveIds: fullRoute.guidance.audit.objectiveIds,
      maximumQueueDepth: fullRoute.guidance.audit.maximumQueueDepth,
      queueDrops: fullRoute.guidance.audit.queueDrops,
      finalStoryLogEntries: fullRoute.guidance.storyLog.length,
      restoredCheckpoint: restoredS35.checkpointId,
      restoredSeenGuides: restoredS35.guidance.announcedZoneIds.length,
      restoredSessionAnnouncements:
        restoredS35.guidance.audit.announcedZoneIds,
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
