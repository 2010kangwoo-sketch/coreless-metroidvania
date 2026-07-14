import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4202'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const localChromium = ['/tmp/coreless138/chromium', '/tmp/chromium'].find(path => {
  try { return fs.statSync(path).size > 0; } catch { return false; }
});
const executablePath = localChromium ?? await chromium.executablePath();
const browser = await playwright.launch({ executablePath, args: chromium.args, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));

await page.goto('http://127.0.0.1:4202/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  Object.assign(runtime.progress, {
    pass07Completed: true,
    pass08Completed: true,
    zone07Entered: true,
    zone07UpperDrop: true,
    zone07MiddleReturn: true,
    zone07MiddleDrop: true,
    zone07LowerRun: true,
    zone07ExitReached: true,
    boulderStarted: true,
    boulderAtInternalEntry: true,
    internalStructureBreached: true,
    pass09Completed: true,
    zone08Entered: true,
    zone08ShaftOneDropped: true,
    zone08ShaftOneCleared: true,
    zone08ShaftTwoDropped: true,
    zone08ShaftTwoCleared: true,
    zone08LowerHallReached: true,
    zone08ExitReached: true,
    pass10Completed: true,
  });
  Object.assign(runtime.player, {
    x: 23595,
    y: 5852,
    previousX: 23595,
    previousY: 5852,
    vx: 0,
    vy: 0,
    grounded: true,
    wallSide: 0,
    dashAvailable: true,
  });
  const pass10Distance = window.__corelessV2.pass10.chase.path.totalDistance;
  Object.assign(runtime.chase, {
    triggered: true,
    active: true,
    sealed: false,
    delayFrames: 0,
    breachDelayFrames: 0,
    breachComplete: true,
    internalBreakpointIndex: 7,
    internalPauseFrames: 0,
    pathDistance: pass10Distance * 0.96,
    pathIndex: 0,
  });
  runtime.updateBoulderPosition();
  runtime.snapCamera();
});

await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass11-focused-entry.png' });
const debug = () => page.evaluate(() => window.__corelessV2.debug());
let heldDirection = null;
const setDirection = async direction => {
  if (heldDirection === direction) return;
  if (heldDirection) await page.keyboard.up(heldDirection);
  heldDirection = direction;
  if (direction) await page.keyboard.down(direction);
};

const routeSamples = [];
const attachShots = new Set();
const releaseShots = new Set();
const anchorData = await page.evaluate(() => window.__corelessV2.pass11.zone.anchors);
let traversalFailure = null;
let loop = 0;

while (loop < 7000) {
  loop += 1;
  const state = await debug();
  const p = state.player;
  const grapple = state.grapple;
  const used = grapple.usedAnchorIds.length;
  if (loop % 12 === 0) routeSamples.push({
    frame: state.frameCount,
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10,
    vx: Math.round(p.vx * 10) / 10,
    vy: Math.round(p.vy * 10) / 10,
    grounded: p.grounded,
    grappleActive: grapple.active,
    anchorId: grapple.anchorId,
    attachedFrames: grapple.attachedFrames,
    usedAnchors: used,
    boulderProgress: Math.round(state.chase.pathProgress * 1000) / 1000,
  });
  if (state.resetCount > 0 || state.boulderCatchCount > 0) {
    traversalFailure = `reset/catch at x=${p.x.toFixed(1)} y=${p.y.toFixed(1)} used=${used}`;
    break;
  }
  if (state.progress.pass11Completed) break;

  const expected = anchorData[used];
  const centerX = p.x + 17;
  const centerY = p.y + 24;
  const expectedDistance = expected ? Math.hypot(expected.x - centerX, expected.y - centerY) : Number.POSITIVE_INFINITY;

  const attachThreshold = expected?.order === 3 ? 0.98 : 0.92;
  if (!grapple.active && expected && grapple.cooldown === 0 && expectedDistance <= expected.attachRadius * attachThreshold) {
    await page.keyboard.press('e');
  }

  if (grapple.active) {
    const order = anchorData.find(item => item.id === grapple.anchorId)?.order ?? used;
    await setDirection(order === 1 ? 'd' : 'a');
    if (!attachShots.has(order)) {
      attachShots.add(order);
    }
    const readyToRelease = order === 1
      ? grapple.attachedFrames >= 34
      : order === 2
        ? grapple.attachedFrames >= 46
        : (p.x <= 22920 && p.y <= 6820) || grapple.attachedFrames >= 180;
    if (readyToRelease) {
      await page.keyboard.press('e');
      if (!releaseShots.has(order)) {
        releaseShots.add(order);
      }
    }
  } else if (used === 0 || used === 1) {
    await setDirection('d');
  } else if (used === 3 && !p.grounded && p.x <= 22780) {
    await setDirection('d');
  } else {
    await setDirection('a');
  }

  if (state.progress.zone09ExitReached) await setDirection(null);
  await page.waitForTimeout(24);
}

await setDirection(null);
await page.waitForTimeout(180);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass11-focused-exit.png' });
const state = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
}));
const requiredCodes = ['KeyA', 'KeyD', 'KeyE'];
const usedCodes = state.audit.inputProbe.usedCodes;
const deterministicChecks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 11',
  runtimeAudit: state.audit.passed === true && state.audit.passedCount === 20,
  pass11Audit: state.audit.pass11.passed === true && state.audit.pass11.passedCount === 31,
  completed: state.debug.progress.pass11Completed === true,
  threeUniqueAnchors: state.debug.progress.grappleUniqueAnchors === 3,
  threeAttaches: state.debug.progress.grappleAttaches === 3,
  threeReleases: state.debug.progress.grappleReleases === 3,
  orderedAnchorFlags: state.debug.progress.grappleAnchorOneUsed && state.debug.progress.grappleAnchorTwoUsed && state.debug.progress.grappleAnchorThreeUsed,
  exitReached: state.debug.progress.zone09ExitReached === true,
  boulderCoveredRoute: state.debug.chase.pathProgress >= 0.965,
  boulderSealed: state.debug.chase.sealed === true && state.debug.chase.active === false,
  noReset: state.debug.resetCount === 0,
  noBoulderCatch: state.debug.boulderCatchCount === 0,
  keyboard: requiredCodes.every(code => usedCodes.includes(code)),
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const passed = !traversalFailure && Object.values(deterministicChecks).every(Boolean);
const result = {
  version: 'rebuild-v2-pass11-focused',
  testedWith: 'Chromium + Playwright actual keyboard events',
  actualKeyboardRoute: 'pass 10 exit helper placement -> launch ramp -> grapple one -> grapple two -> grapple three -> lower-left exit shelf',
  helperCoordinateMovement: true,
  traversalFailure,
  state,
  routeSamples,
  deterministicChecks,
  passed,
  consoleErrors,
  pageErrors,
  limitations: [
    'The helper only places the player at the Pass 10 exit and configures prior completion state.',
    'This focused run is not counted as a full start-to-exit traversal.',
  ],
};
fs.writeFileSync('browser-artifacts/pass11-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!passed) process.exitCode = 1;
