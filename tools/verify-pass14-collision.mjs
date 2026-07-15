import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4216'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const localChromium = ['/tmp/coreless138/chromium', '/tmp/chromium'].find(path => {
  try { return fs.statSync(path).size > 0; } catch { return false; }
});
const browser = await playwright.launch({ executablePath: localChromium ?? await chromium.executablePath(), args: chromium.args, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 680 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4216/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

const probe = await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  const zone = window.__corelessV2.pass14.zone;
  const chase = window.__corelessV2.pass14.chase;
  const pass13 = window.__corelessV2.pass13;
  const lowerFloor = zone.floors.find(item => item.id === 'giant_curve_lower_landing');

  runtime.progress.pass12Completed = true;
  Object.assign(runtime.player, { x: 19170, y: 7580, previousX: 19170, previousY: 7580, vx: 0, vy: 0, grounded: false });
  const legacyHazardBeforeCompletion = runtime.checkPrecisionHazardContact();
  const resetAfterLegacyHazard = runtime.resetCount;

  runtime.progress.pass12Completed = true;
  runtime.progress.pass13Completed = true;
  Object.assign(runtime.player, { x: 19170, y: 7580, previousX: 19170, previousY: 7580, vx: 0, vy: 0, grounded: false });
  const legacyHazardAfterCompletion = runtime.checkPrecisionHazardContact();

  runtime.progress.pass13Completed = true;
  runtime.progress.giantCurveDropStarted = false;
  const lowerFloorBeforeDrop = runtime.isFloorActive(lowerFloor);
  runtime.progress.giantCurveDropStarted = true;
  const lowerFloorAfterDrop = runtime.isFloorActive(lowerFloor);

  Object.assign(runtime.chase, {
    triggered: true,
    active: true,
    sealed: false,
    pathDistance: chase.path.totalDistance,
    pathIndex: chase.path.points.length - 2,
  });
  runtime.updateBoulderPosition();
  Object.assign(runtime.player, {
    x: zone.exit.x - 34,
    y: zone.exit.y - 48,
    previousX: zone.exit.x - 34,
    previousY: zone.exit.y - 48,
    vx: 0,
    vy: 0,
    grounded: true,
  });
  const catchBefore = runtime.boulderCatchCount;
  runtime.checkBoulderContact();
  const safeExitCatchDelta = runtime.boulderCatchCount - catchBefore;

  const segmentLengths = zone.boulderCorridor.points.slice(1).map((item, index) => Math.hypot(
    item.x - zone.boulderCorridor.points[index].x,
    item.y - zone.boulderCorridor.points[index].y,
  ));
  const floorSegmentIndices = [...Array(10).keys(), 11, 12, 13, 14];
  const boulderFloorAlignment = zone.boulderFloors.map((item, floorIndex) => {
    const segmentIndex = floorSegmentIndices[floorIndex];
    const endpoints = [zone.boulderCorridor.points[segmentIndex], zone.boulderCorridor.points[segmentIndex + 1]].sort((a, b) => a.x - b.x);
    return item.x1 === endpoints[0].x && item.x2 === endpoints[1].x &&
      item.y1 === endpoints[0].y + zone.boulderCorridor.floorOffset &&
      item.y2 === endpoints[1].y + zone.boulderCorridor.floorOffset;
  });

  const completionProgress = {
    pass13Completed: true,
    giantCurveUpperGapCleared: true,
    giantCurveSteepCommitted: true,
    giantCurveDropStarted: true,
    giantCurveLowerLanded: true,
    giantCurveDirectionReversed: true,
    giantCurveExitReached: false,
  };
  Object.assign(runtime.progress, completionProgress);
  runtime.chase.active = true;
  runtime.chase.sealed = false;
  runtime.updateChaseCompletion();
  const completionWithoutExit = runtime.progress.pass14Completed;
  runtime.progress.giantCurveExitReached = true;
  runtime.updateChaseCompletion();
  const completionWithExit = runtime.progress.pass14Completed;

  return {
    legacyHazardBeforeCompletion,
    resetAfterLegacyHazard,
    legacyHazardAfterCompletion,
    lowerFloorBeforeDrop,
    lowerFloorAfterDrop,
    safeExitCatchDelta,
    boulderEnd: { x: runtime.chase.x, y: runtime.chase.y },
    playerExit: zone.exit,
    segmentLengths,
    boulderFloorAlignment,
    completionWithoutExit,
    completionWithExit,
    pathEnd: chase.path.points.at(-1),
    pass13PathEnd: pass13.chase.path.points.at(-1),
    pass14PathStart: zone.boulderCorridor.points[0],
    audit: runtime.audit(),
  };
});

const checks = {
  legacyHazardStillWorksInPass13: probe.legacyHazardBeforeCompletion && probe.resetAfterLegacyHazard === 1,
  legacyHazardDisabledInPass14: probe.legacyHazardAfterCompletion === false,
  lowerRouteLockedBeforeNaturalDrop: probe.lowerFloorBeforeDrop === false,
  lowerRouteEnabledAfterNaturalDrop: probe.lowerFloorAfterDrop === true,
  boulderExitVerticallySafe: probe.safeExitCatchDelta === 0 && probe.boulderEnd.y - probe.playerExit.y >= 250,
  smoothVisibleCurve: probe.segmentLengths.every(length => length < 950),
  physicalFloorOffset: probe.boulderFloorAlignment.every(Boolean),
  pass13ToPass14PathContinuous: probe.pass13PathEnd.x === probe.pass14PathStart.x && probe.pass13PathEnd.y === probe.pass14PathStart.y,
  completionRequiresExit: probe.completionWithoutExit === false && probe.completionWithExit === true,
  runtimeAudit: probe.audit.passed && probe.audit.passedCount === 23,
  pass13Audit: probe.audit.pass13.passed && probe.audit.pass13.passedCount === 37,
  pass14Audit: probe.audit.pass14.passed && probe.audit.pass14.passedCount === 43,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass14-collision',
  category: 'deterministic collision and route probes with helper placement',
  passed: Object.values(checks).every(Boolean),
  checks,
  probe,
  consoleErrors,
  pageErrors,
  limitation: 'These helper probes are deterministic feature checks, not a keyboard traversal or completion run.',
};
fs.mkdirSync('browser-artifacts', { recursive: true });
fs.writeFileSync('browser-artifacts/pass14-collision-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
