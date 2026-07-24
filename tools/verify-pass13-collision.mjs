import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4206'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const localChromium = ['/tmp/coreless138/chromium', '/tmp/chromium'].find(path => {
  try { return fs.statSync(path).size > 0; } catch { return false; }
});
const browser = await playwright.launch({
  executablePath: localChromium ?? await chromium.executablePath(),
  args: chromium.args,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1200, height: 680 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4206/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

const probe = await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  const zone = window.__corelessV2.pass13.zone;
  const chase = window.__corelessV2.pass13.chase;
  runtime.progress.pass12Completed = true;

  Object.assign(runtime.player, {
    x: 19810,
    y: 7280,
    previousX: 19810,
    previousY: 7280,
    vx: 0,
    vy: 4,
    grounded: false,
  });
  const upperHazardContact = runtime.checkPrecisionHazardContact();
  const resetAfterHazard = runtime.resetCount;

  runtime.progress.pass12Completed = true;
  Object.assign(runtime.player, {
    x: 19790,
    y: 7472,
    previousX: 19790,
    previousY: 7472,
    vx: 0,
    vy: 0,
    grounded: true,
  });
  const lowerReturnContact = runtime.checkPrecisionHazardContact();

  runtime.progress.pass12Completed = true;
  Object.assign(runtime.player, {
    x: 19840,
    y: 7165,
    previousX: 19840,
    previousY: 7165,
    vx: 0,
    vy: -10,
    grounded: false,
  });
  const bumpsBefore = runtime.progress.precisionCeilingBumps;
  runtime.moveVertical(false);
  const ceilingCollision = {
    y: runtime.player.y,
    vy: runtime.player.vy,
    bumpsAdded: runtime.progress.precisionCeilingBumps - bumpsBefore,
  };

  Object.assign(runtime.progress, {
    pass12Completed: true,
    precisionShortGapCleared: true,
  });
  Object.assign(runtime.player, {
    x: 18780,
    y: 7382,
    previousX: 18780,
    previousY: 7382,
    vx: -5.35,
    vy: 0,
    facing: -1,
    grounded: true,
  });
  runtime.updateProgress();
  const turnCollapse = {
    reached: runtime.progress.precisionTurnReached,
    floorCollapsed: runtime.collapsedFloorIds.has('precision_turn_descent'),
  };

  const pathSegments = zone.boulderCorridor.points.slice(1).map((point, index) => ({
    from: zone.boulderCorridor.points[index],
    to: point,
    length: Math.hypot(point.x - zone.boulderCorridor.points[index].x, point.y - zone.boulderCorridor.points[index].y),
  }));
  return {
    upperHazardContact,
    resetAfterHazard,
    lowerReturnContact,
    ceilingCollision,
    turnCollapse,
    hazards: zone.hazards,
    corridor: zone.boulderCorridor,
    pathSegments,
    chasePathEnd: chase.path.points.at(-1),
    zoneExit: zone.exit,
    audit: runtime.audit(),
  };
});

const pass13Audit = probe.audit.pass13;
const checks = {
  upperHazardContactDetected: probe.upperHazardContact === true,
  exactlyOneHazardReset: probe.resetAfterHazard === 1,
  lowerReturnDoesNotTouchUpperHazard: probe.lowerReturnContact === false,
  fullJumpHitsLowCeiling: probe.ceilingCollision.y === 7160 && probe.ceilingCollision.vy === 0 && probe.ceilingCollision.bumpsAdded === 1,
  turnFloorCollapses: probe.turnCollapse.reached && probe.turnCollapse.floorCollapsed,
  bothHazardsIgnoredByBoulder: probe.hazards.length === 2 && probe.hazards.every(item => item.ignoredByBoulder),
  smoothBoulderSegments: probe.pathSegments.every(item => item.length < 500),
  boulderPathEndsAtSharedExit: probe.chasePathEnd.x === probe.zoneExit.x && probe.chasePathEnd.y === probe.zoneExit.y,
  exitRunoutBuffer: pass13Audit.exitRunout >= 102 && Math.abs(pass13Audit.exitFloorYAtMarker - probe.zoneExit.y) <= 1,
  shortCutCannotClearLong: pass13Audit.longGap > pass13Audit.shortCutLongReach + 34,
  fullJumpClearsLong: pass13Audit.longGap < pass13Audit.fullLongReach + 34,
  runtimeAudit: probe.audit.passed && probe.audit.passedCount === 22,
  pass13Audit: pass13Audit.passed && pass13Audit.passedCount === 37,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass13-collision',
  category: 'deterministic collision and route probes with helper placement',
  passed: Object.values(checks).every(Boolean),
  checks,
  probe,
  consoleErrors,
  pageErrors,
  limitation: 'These helper probes are deterministic feature checks, not a keyboard traversal or completion run.',
};
fs.mkdirSync('browser-artifacts', { recursive: true });
fs.writeFileSync('browser-artifacts/pass13-collision-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
