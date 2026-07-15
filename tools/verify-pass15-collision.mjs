import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4217'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const localChromium = ['/tmp/coreless138/chromium', '/tmp/chromium'].find(path => { try { return fs.statSync(path).size > 0; } catch { return false; } });
const browser = await playwright.launch({ executablePath: localChromium ?? await chromium.executablePath(), args: chromium.args, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 680 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4217/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(350);

const probe = await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  const pass14 = window.__corelessV2.pass14;
  const pass15 = window.__corelessV2.pass15;
  runtime.running = false;
  const bridgeFloor = pass15.zone.floors[0];
  const finalLanding = pass15.zone.floors.at(-1);
  runtime.progress.pass14Completed = false;
  const floorBeforePass14 = runtime.isFloorActive(bridgeFloor);
  runtime.progress.pass14Completed = true;
  const floorAfterPass14 = runtime.isFloorActive(bridgeFloor);
  const gapOverlaps = pass15.zone.gaps.map(gap => pass15.zone.floors.some(item => item.x1 < gap.x2 && item.x2 > gap.x1));
  const pass15Panels = pass15.chase.collapsePanels.filter(item => item.zone === 10);
  const finalLandingCollapsible = pass15.chase.collapsePanels.some(item => item.floorId === finalLanding.id);
  const firstPanel = pass15Panels[0];
  runtime.chase.triggered = true;
  runtime.chase.active = true;
  runtime.chase.sealed = false;
  runtime.chase.breachComplete = true;
  runtime.chase.internalBreakpointIndex = pass15.chase.boulder.internalBreakpoints.length;
  runtime.chase.pathDistance = firstPanel.triggerDistance + pass15.chase.boulder.floorCollapseLag - pass15.chase.boulder.maximumSpeed - 2;
  runtime.updateBoulderPosition();
  runtime.updateBoulder();
  const firstDeckBeforeThreshold = runtime.collapsedFloorIds.has(firstPanel.floorId);
  runtime.chase.pathDistance = firstPanel.triggerDistance + pass15.chase.boulder.floorCollapseLag + 2;
  runtime.updateBoulderPosition();
  runtime.updateBoulder();
  const firstDeckAfterThreshold = runtime.collapsedFloorIds.has(firstPanel.floorId);

  Object.assign(runtime.progress, {
    bridgeGapOneCleared: true, bridgeGapTwoCleared: true, bridgeGapThreeCleared: true,
    bridgeFinalAirDash: false, bridgeExitReached: true, pass15Completed: false,
  });
  runtime.chase.pathDistance = pass15.chase.path.totalDistance;
  runtime.updateChaseCompletion();
  const completionWithoutDash = runtime.progress.pass15Completed;
  runtime.progress.bridgeFinalAirDash = true;
  runtime.updateChaseCompletion();
  const completionWithDash = runtime.progress.pass15Completed;
  runtime.running = true;
  return {
    floorBeforePass14, floorAfterPass14, gapOverlaps, pass15PanelCount: pass15Panels.length,
    finalLandingCollapsible, firstDeckBeforeThreshold, firstDeckAfterThreshold,
    completionWithoutDash, completionWithDash,
    pass14PathEnd: pass14.chase.path.points.at(-1), pass15PathStart: pass15.zone.boulderCorridor.points[0],
    boulderEnd: pass15.chase.path.points.at(-1), worldHeight: window.__corelessV2.blueprint.world.height,
    audit: runtime.audit(),
  };
});

const checks = {
  bridgeLockedBeforePass14: probe.floorBeforePass14 === false,
  bridgeEnabledAfterPass14: probe.floorAfterPass14 === true,
  threePhysicalVoids: probe.gapOverlaps.length === 3 && probe.gapOverlaps.every(value => value === false),
  elevenCollapsibleDecks: probe.pass15PanelCount === 11,
  finalLandingPreserved: probe.finalLandingCollapsible === false,
  collapseWaitsForThreshold: probe.firstDeckBeforeThreshold === false,
  collapseBeginsAfterThreshold: probe.firstDeckAfterThreshold === true,
  pass14ToPass15PathContinuous: probe.pass14PathEnd.x === probe.pass15PathStart.x && probe.pass14PathEnd.y === probe.pass15PathStart.y,
  boulderPlungesAtExit: probe.boulderEnd.x === 25200 && probe.boulderEnd.y === probe.worldHeight,
  completionRequiresFinalDash: probe.completionWithoutDash === false && probe.completionWithDash === true,
  runtimeAudit: probe.audit.passed && probe.audit.passedCount === 24,
  pass14Audit: probe.audit.pass14.passed && probe.audit.pass14.passedCount === 43,
  pass15Audit: probe.audit.pass15.passed && probe.audit.pass15.passedCount === 29,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass15-collision', category: 'deterministic bridge collision, collapse, and completion probes with helper state',
  passed: Object.values(checks).every(Boolean), checks, probe, consoleErrors, pageErrors,
  limitation: 'These helper probes are deterministic feature checks, not a keyboard traversal or completion run.',
};
fs.mkdirSync('browser-artifacts', { recursive: true });
fs.writeFileSync('browser-artifacts/pass15-collision-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
