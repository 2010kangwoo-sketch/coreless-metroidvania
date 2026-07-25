import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V3_PASS05_BROWSER_RESULT ??
  "docs/rebuild-v3/pass-05-browser-results.json";
const artifactDirectory = "browser-artifacts/v3-pass05";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4248"], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 700));

const getState = page => page.evaluate(() => ({
  x: window.__corelessV3Slope.runtime.player.x,
  y: window.__corelessV3Slope.runtime.player.y,
  vx: window.__corelessV3Slope.runtime.player.vx,
  vy: window.__corelessV3Slope.runtime.player.vy,
  grounded: window.__corelessV3Slope.runtime.player.grounded,
  standingSlopeId: window.__corelessV3Slope.runtime.player.standingSlopeId,
  audit: { ...window.__corelessV3Slope.runtime.audit },
  visitedSlopes: [...window.__corelessV3Slope.runtime.visitedSlopes],
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

  await page.goto("http://127.0.0.1:4248/v3-slope-test.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.corelessV3SlopeReady === "true");
  await page.locator("#slopeCanvas").focus();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${artifactDirectory}/entry.png` });
  const initial = await getState(page);

  await page.keyboard.down("KeyD");
  const gentle = await waitForState(
    page,
    state => state.standingSlopeId === "gentle-climb" && state.x >= 500,
  );
  await page.screenshot({ path: `${artifactDirectory}/gentle-climb.png` });

  const slopeLandingsBeforeJump = gentle.audit.slopeLandings;
  await page.keyboard.down("Space");
  await page.waitForTimeout(140);
  const airborne = await getState(page);
  await page.screenshot({ path: `${artifactDirectory}/slope-jump.png` });
  await page.waitForTimeout(190);
  await page.keyboard.up("Space");
  const landed = await waitForState(
    page,
    state =>
      state.grounded &&
      state.audit.slopeLandings > slopeLandingsBeforeJump &&
      state.standingSlopeId === "gentle-climb",
  );
  await page.screenshot({ path: `${artifactDirectory}/slope-landing.png` });

  const crest = await waitForState(page, state => state.grounded && state.x >= 950);
  await page.keyboard.up("KeyD");
  const crestReleaseX = crest.x;
  await page.waitForTimeout(1000);
  const crestStopped = await getState(page);
  await page.screenshot({ path: `${artifactDirectory}/crest-stop.png` });

  await page.keyboard.down("KeyD");
  const steep = await waitForState(
    page,
    state => state.standingSlopeId === "steep-descent" && state.x >= 1240,
  );
  await page.keyboard.up("KeyD");
  const steepReleaseX = steep.x;
  await page.waitForTimeout(750);
  const steepReleased = await getState(page);
  await page.screenshot({ path: `${artifactDirectory}/steep-release.png` });

  await page.keyboard.down("KeyD");
  const finished = await waitForState(page, state => state.audit.finished, 12000);
  await page.keyboard.up("KeyD");
  const final = await waitForState(page, state => state.grounded, 1800);
  await page.screenshot({ path: `${artifactDirectory}/final.png` });

  const checks = [
    ["documentReady", initial.grounded && initial.x === 120 && initial.y === 696],
    ["structuralAuditReady", await page.evaluate(() => window.__corelessV3Slope.structuralAudit.passed)],
    ["gentleSlopeReached", gentle.standingSlopeId === "gentle-climb"],
    ["jumpActuallyDetached", !airborne.grounded && airborne.vy < 0 && airborne.standingSlopeId === null],
    ["jumpLandedBackOnSlope", landed.audit.slopeLandings > slopeLandingsBeforeJump],
    ["crestStopsWithoutStickyDrift", Math.abs(crestStopped.vx) < 30],
    ["crestStoppingDistanceShort", crestStopped.x - crestReleaseX < 80],
    ["steepSlopeReached", steep.standingSlopeId === "steep-descent"],
    ["steepReleaseMovesDownhill", steepReleased.x - steepReleaseX >= 45],
    ["steepReleaseKeepsSliding", steepReleased.vx >= 160 && steepReleased.vx <= 280],
    ["steepReleaseStaysGrounded", steepReleased.grounded && steepReleased.standingSlopeId === "steep-descent"],
    ["allPurposefulSlopesVisited", final.visitedSlopes.length === 3],
    ["finishReached", finished.audit.finished && final.audit.finished],
    ["finishedOnExitPlateau", final.grounded && final.x >= 2680 && Math.abs(final.y - 636) < 0.1],
    ["airbornePositionStepBounded", final.audit.maximumPositionStep < 8],
    ["groundedPositionStepBounded", final.audit.maximumGroundedPositionStep < 5],
    ["slopeVerticalStepBounded", final.audit.maximumVerticalStepOnSlope < 4],
    ["edgeCorrectionNotUsed", final.audit.edgeCorrections === 0],
    ["cameraStepBounded", final.audit.maximumCameraStep < 15],
    ["noResets", final.audit.resets === 0],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 5,
    generatedAt: new Date().toISOString(),
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      gentleX: Number(gentle.x.toFixed(2)),
      airborneVy: Number(airborne.vy.toFixed(2)),
      slopeLandingX: Number(landed.x.toFixed(2)),
      crestReleaseTravel: Number((crestStopped.x - crestReleaseX).toFixed(2)),
      crestReleasedSpeed: Number(crestStopped.vx.toFixed(2)),
      steepReleaseTravel: Number((steepReleased.x - steepReleaseX).toFixed(2)),
      steepReleasedSpeed: Number(steepReleased.vx.toFixed(2)),
      slopeContacts: final.audit.slopeContacts,
      slopeLandings: final.audit.slopeLandings,
      jumps: final.audit.jumps,
      visitedSlopes: final.visitedSlopes,
      maximumPositionStep: Number(final.audit.maximumPositionStep.toFixed(3)),
      maximumGroundedPositionStep: Number(final.audit.maximumGroundedPositionStep.toFixed(3)),
      maximumVerticalStepOnSlope: Number(final.audit.maximumVerticalStepOnSlope.toFixed(3)),
      maximumCameraStep: Number(final.audit.maximumCameraStep.toFixed(3)),
      edgeCorrections: final.audit.edgeCorrections,
      resets: final.audit.resets,
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
