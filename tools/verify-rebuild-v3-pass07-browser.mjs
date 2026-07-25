import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V3_PASS07_BROWSER_RESULT ??
  "docs/rebuild-v3/pass-07-browser-results.json";
const artifactDirectory = process.env.CORELESS_V3_BROWSER_ARTIFACT_DIR ??
  "browser-artifacts/v3-pass07";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4250"], {
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
  standingSlopeId: window.__corelessV3.runtime.player.standingSlopeId,
  doubleJump: window.__corelessV3.runtime.player.abilities.doubleJump,
  room: window.__corelessV3.runtime.currentRoom,
  checkpoint: window.__corelessV3.runtime.currentCheckpointId,
  liftActive: window.__corelessV3.runtime.liftActive,
  storyStarted: window.__corelessV3.runtime.storyStarted ?? true,
  storyJournalOpen: window.__corelessV3.runtime.storyJournalOpen ?? false,
  storyObjective: window.__corelessV3.runtime.storyObjective ?? null,
  storyProgress: { ...(window.__corelessV3.runtime.storyProgress ?? {}) },
  progress: { ...window.__corelessV3.runtime.tutorialProgress },
  audit: {
    ...window.__corelessV3.runtime.audit,
    slopeSequence: [...window.__corelessV3.runtime.audit.slopeSequence],
  },
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

  await page.goto("http://127.0.0.1:4250/v3.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.corelessV3Ready === "true");
  await page.locator("#v3Canvas").focus();
  await page.waitForTimeout(250);
  const initial = await getState(page);
  await page.screenshot({ path: `${artifactDirectory}/lower-tier-entry.png` });
  if (!initial.storyStarted) {
    await page.keyboard.press("Enter");
    await waitForState(page, state => state.storyStarted, 1500);
    await page.keyboard.press("Tab");
    const journalOpen = await waitForState(page, state => state.storyJournalOpen, 1500);
    if (journalOpen.storyJournalOpen) {
      await page.screenshot({ path: `${artifactDirectory}/story-journal.png` });
    }
    await page.keyboard.press("Tab");
    await waitForState(page, state => !state.storyJournalOpen, 1500);
  }

  const roomOnePlan = [
    ["low", 390, 520],
    ["mid", 650, 840],
    ["high", 875, 1140],
    ["exit", 1290, 1460],
  ];
  let roomOnePlanIndex = 0;
  let lastJumpAt = 0;
  await page.keyboard.down("KeyD");
  const roomOneStarted = Date.now();
  while (Date.now() - roomOneStarted < 18000) {
    const state = await getState(page);
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
  await heldJump(page, 65);
  const shortLanded = await waitForState(
    page,
    state => state.grounded && state.audit.landings > shortBeforeLandings,
  );

  const fullBeforeLandings = shortLanded.audit.landings;
  await page.keyboard.down("Space");
  await page.waitForTimeout(220);
  await page.screenshot({ path: `${artifactDirectory}/lower-tier-jump-workshop.png` });
  await page.waitForTimeout(210);
  await page.keyboard.up("Space");
  const fullLanded = await waitForState(
    page,
    state => state.grounded && state.audit.landings > fullBeforeLandings,
  );

  await page.keyboard.down("KeyD");
  const openGate = await waitForState(
    page,
    state => state.audit.gateOpened && state.x >= 3000,
    12000,
  );
  const altar = await waitForState(
    page,
    state => state.doubleJump && state.progress.doubleJumpUnlock,
    6000,
  );

  const roomThreePlan = [
    ["altar", 3320, 3710],
    ["rise-one", 3570, 4090],
    ["rise-two", 3890, 4160],
    ["landing", 4300, 4490],
  ];
  let roomThreePlanIndex = 0;
  lastJumpAt = 0;
  const roomThreeStarted = Date.now();
  while (Date.now() - roomThreeStarted < 20000) {
    const state = await getState(page);
    if (state.audit.liftStarted) break;
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
    } else {
      await page.waitForTimeout(28);
    }
  }
  await page.keyboard.up("KeyD");
  const liftStarted = await waitForState(page, state => state.audit.liftStarted, 2500);
  await page.screenshot({ path: `${artifactDirectory}/lower-tier-lift-entry.png` });

  const liftMiddle = await waitForState(
    page,
    state => state.liftActive && state.y <= 1080 && state.y >= 900,
    5000,
  );
  await page.screenshot({ path: `${artifactDirectory}/tier-ascent.png` });

  const upperArrival = await waitForState(
    page,
    state => state.audit.liftCompleted && state.room === "r04" && state.grounded,
    6000,
  );
  await page.screenshot({ path: `${artifactDirectory}/upper-tier-arrival.png` });

  await page.keyboard.down("KeyA");
  const gentle = await waitForState(
    page,
    state => state.standingSlopeId === "room4-gentle-climb",
    6000,
  );
  await page.screenshot({ path: `${artifactDirectory}/upper-gentle-climb.png` });

  const crestEntry = await waitForState(
    page,
    state => state.x <= 3970 && state.grounded && !state.standingSlopeId,
    6000,
  );
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(800);
  const crestStopped = await getState(page);
  await page.screenshot({ path: `${artifactDirectory}/upper-crest-stop.png` });

  await page.keyboard.down("KeyA");
  const steepEntry = await waitForState(
    page,
    state => state.standingSlopeId === "room4-steep-descent",
    6000,
  );
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(650);
  const steepReleased = await getState(page);
  await page.screenshot({ path: `${artifactDirectory}/upper-steep-release.png` });

  await page.keyboard.down("KeyA");
  const final = await waitForState(page, state => state.audit.finished, 6000);
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${artifactDirectory}/layered-route-final.png` });

  const layerData = await page.evaluate(() => ({
    world: { ...window.__corelessV3.world },
    layer: { ...window.__corelessV3.layer },
    rooms: window.__corelessV3.rooms.map(room => ({ ...room })),
    parallax: { ...window.__corelessV3.parallax },
    auditsPassed: Object.values(window.__corelessV3.audits).every(audit => audit.passed),
  }));
  const lowerRooms = layerData.rooms.filter(room => room.tier === 0);
  const upperRooms = layerData.rooms.filter(room => room.tier === 1);
  const liftTravel = final.audit.liftTravel;
  const crestStopTravel = Math.abs(crestStopped.x - crestEntry.x);
  const steepReleaseTravel = steepEntry.x - steepReleased.x;
  const lessons = Object.values(final.progress);

  const checks = [
    ["documentReadyOnLowerTier", initial.x === 170 && initial.y === 1836 && initial.room === "r01"],
    ["startupAuditsPassed", layerData.auditsPassed],
    ["worldHeightContainsTwoTiers", layerData.world.height === 2040],
    ["threeRoomsShareLowerTier", lowerRooms.length === 3 && lowerRooms.every(room => room.y === 1140)],
    ["roomFourOccupiesUpperTier", upperRooms.length === 1 && upperRooms[0].y === 0],
    ["roomFourStackedAboveRoomThree", upperRooms[0].x === lowerRooms[2].x],
    ["backgroundMovesSlowerThanTerrain", layerData.parallax.farX < layerData.parallax.midX && layerData.parallax.midX < 1 && layerData.parallax.farY < layerData.parallax.midY && layerData.parallax.midY < 1],
    ["tutorialJumpProfilesStillWork", fullLanded.audit.shortJumpHeight >= 55 && fullLanded.audit.fullJumpHeight >= 125],
    ["lowerTutorialCompleted", lessons.length === 8 && lessons.every(Boolean)],
    ["doubleJumpUsedBeforeLift", altar.doubleJump && final.audit.doubleJumps >= 1],
    ["liftStartedFromRoomThree", liftStarted.room === "r03" && liftStarted.audit.liftStarted],
    ["liftShowsContinuousMiddleState", liftMiddle.liftActive && liftMiddle.y < liftStarted.y && liftMiddle.y > upperArrival.y],
    ["liftCompletedOnUpperTier", upperArrival.room === "r04" && upperArrival.checkpoint === "upper-arrival"],
    ["liftTravelMatchesTier", liftTravel >= 760 && liftTravel <= 780],
    ["oneTierTransition", final.audit.tierTransitions === 1],
    ["routeDirectionReversesWest", final.audit.westwardRoomFourDistance >= 1350],
    ["gentleSlopeReached", gentle.standingSlopeId === "room4-gentle-climb"],
    ["crestStopReadable", crestStopTravel <= 35 && Math.abs(crestStopped.vx) <= 5],
    ["steepReleaseMovesWest", steepReleaseTravel >= 45 && steepReleased.vx < 0],
    ["bothPurposefulSlopesVisited", final.audit.slopeSequence.join(",") === "room4-gentle-climb,room4-steep-descent"],
    ["fourRoomsVisited", final.audit.roomTransitions === 3],
    ["layeredRouteFinished", final.audit.finished && final.room === "r04"],
    ["noUnexpectedReset", final.audit.resets === 0],
    ["groundedPositionStepBounded", final.audit.maximumGroundedPositionStep < 5],
    ["cameraStepBounded", final.audit.maximumCameraStep < 15],
    ["verticalCameraStepBounded", final.audit.maximumVerticalCameraStep < 8.5],
    ["liftCameraStepBounded", final.audit.maximumLiftCameraStep < 5],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 7,
    generatedAt: new Date().toISOString(),
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      worldWidth: layerData.world.width,
      worldHeight: layerData.world.height,
      lowerTierY: layerData.layer.lowerY,
      upperTierY: layerData.layer.upperY,
      tierGap: layerData.layer.tierGap,
      shortJumpHeight: Number(fullLanded.audit.shortJumpHeight.toFixed(2)),
      fullJumpHeight: Number(fullLanded.audit.fullJumpHeight.toFixed(2)),
      gateOpenX: Number(openGate.x.toFixed(2)),
      liftTravel: Number(liftTravel.toFixed(2)),
      liftFrames: final.audit.liftFrames,
      maximumLiftStep: Number(final.audit.maximumLiftStep.toFixed(3)),
      tierTransitions: final.audit.tierTransitions,
      roomTransitions: final.audit.roomTransitions,
      crestStopTravel: Number(crestStopTravel.toFixed(2)),
      steepReleaseTravel: Number(steepReleaseTravel.toFixed(2)),
      slopeSequence: final.audit.slopeSequence,
      westwardRoomFourDistance: Number(final.audit.westwardRoomFourDistance.toFixed(2)),
      maximumGroundedPositionStep: Number(final.audit.maximumGroundedPositionStep.toFixed(3)),
      maximumCameraStep: Number(final.audit.maximumCameraStep.toFixed(3)),
      maximumVerticalCameraStep: Number(final.audit.maximumVerticalCameraStep.toFixed(3)),
      maximumLiftCameraStep: Number(final.audit.maximumLiftCameraStep.toFixed(3)),
      resets: final.audit.resets,
      finalX: Number(final.x.toFixed(2)),
      finalY: Number(final.y.toFixed(2)),
      storyBeatsDiscovered: final.audit.storyBeatsDiscovered ?? 0,
      storyOrder: final.audit.storyOrder ?? [],
      prologueDismissed: final.audit.prologueDismissed ?? false,
      journalOpened: final.audit.journalOpened ?? 0,
      storyObjective: final.storyObjective,
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
