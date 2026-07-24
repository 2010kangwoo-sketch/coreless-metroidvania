import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4179'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const executablePath = fs.existsSync('/tmp/chromium') ? '/tmp/chromium' : await chromium.executablePath();
const browser = await playwright.launch({ executablePath, args: chromium.args, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));

await page.goto('http://127.0.0.1:4179/index.html', { waitUntil: 'networkidle' });
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
  });
  Object.assign(runtime.player, {
    x: 15202,
    y: 5452,
    previousX: 15202,
    previousY: 5452,
    vx: 0,
    vy: 0,
    grounded: true,
    wallSide: 0,
    dashAvailable: true,
  });
  const pass09Distance = window.__corelessV2.pass09.chase.path.totalDistance;
  Object.assign(runtime.chase, {
    triggered: true,
    active: true,
    sealed: false,
    delayFrames: 0,
    breachDelayFrames: 0,
    breachComplete: true,
    internalBreakpointIndex: 3,
    internalPauseFrames: 0,
    pathDistance: pass09Distance - 900,
    pathIndex: 0,
  });
  runtime.updateBoulderPosition();
  runtime.snapCamera();
});

await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-focused-entry.png' });
const debug = () => page.evaluate(() => window.__corelessV2.debug());
let heldDirection = null;
const setDirection = async direction => {
  if (heldDirection === direction) return;
  if (heldDirection) await page.keyboard.up(heldDirection);
  heldDirection = direction;
  if (direction) await page.keyboard.down(direction);
};

let firstLipDash = false;
let secondLipDash = false;
let firstDropShot = false;
let firstClearShot = false;
let secondDropShot = false;
let secondClearShot = false;
let traversalFailure = null;
const routeSamples = [];
let loop = 0;

while (loop < 10000) {
  loop += 1;
  const state = await debug();
  const p = state.player;
  if (loop % 20 === 0) routeSamples.push({
    frame: state.frameCount,
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10,
    vx: Math.round(p.vx * 10) / 10,
    vy: Math.round(p.vy * 10) / 10,
    wallSide: p.wallSide,
    boulderProgress: Math.round(state.chase.pathProgress * 1000) / 1000,
    chaseWallJumps: state.progress.chaseWallJumps,
  });
  if (state.resetCount > 0 || state.boulderCatchCount > 0) {
    traversalFailure = `reset/catch at x=${p.x.toFixed(1)} y=${p.y.toFixed(1)}`;
    break;
  }
  if (state.progress.pass10Completed) break;

  const firstActive = state.progress.zone08ShaftOneDropped && !state.progress.zone08ShaftOneCleared;
  const secondActive = state.progress.zone08ShaftTwoDropped && !state.progress.zone08ShaftTwoCleared;
  if (firstActive || secondActive) {
    const lipTop = firstActive ? 5840 : 6200;
    if (p.y + 48 <= lipTop + 50) {
      await setDirection('d');
      if (p.dashAvailable && ((firstActive && !firstLipDash) || (secondActive && !secondLipDash))) {
        await page.keyboard.press('Shift');
        if (firstActive) firstLipDash = true;
        else secondLipDash = true;
      }
    } else if (p.wallSide === 1 && p.vy >= -0.5) {
      await page.keyboard.press('Space');
      await setDirection('a');
    } else if (p.wallSide === -1 && p.vy >= -0.5) {
      await page.keyboard.press('Space');
      await setDirection('d');
    } else if (p.grounded) {
      await setDirection('d');
      await page.keyboard.press('Space');
    }
  } else if (state.progress.zone08ExitReached) {
    await setDirection(null);
  } else {
    await setDirection('d');
  }

  if (state.progress.zone08ShaftOneDropped && !firstDropShot) {
    firstDropShot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-focused-shaft-one-drop.png' });
  }
  if (state.progress.zone08ShaftOneCleared && !firstClearShot) {
    firstClearShot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-focused-shaft-one-clear.png' });
  }
  if (state.progress.zone08ShaftTwoDropped && !secondDropShot) {
    secondDropShot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-focused-shaft-two-drop.png' });
  }
  if (state.progress.zone08ShaftTwoCleared && !secondClearShot) {
    secondClearShot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-focused-shaft-two-clear.png' });
  }
  await page.waitForTimeout(32);
}

await setDirection(null);
await page.waitForTimeout(180);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-focused-exit.png' });
const state = await page.evaluate(() => ({
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
}));
const checks = {
  runtimeAudit: state.audit.passed === true && state.audit.passedCount === 19,
  pass10Audit: state.audit.pass10.passed === true && state.audit.pass10.passedCount === 30,
  entered: state.debug.progress.zone08Entered === true,
  firstDrop: state.debug.progress.zone08ShaftOneDropped === true,
  firstClear: state.debug.progress.zone08ShaftOneCleared === true,
  secondDrop: state.debug.progress.zone08ShaftTwoDropped === true,
  secondClear: state.debug.progress.zone08ShaftTwoCleared === true,
  lowerHall: state.debug.progress.zone08LowerHallReached === true,
  exit: state.debug.progress.zone08ExitReached === true,
  completed: state.debug.progress.pass10Completed === true,
  repeatedWallJumps: state.debug.progress.chaseWallJumps >= 4,
  boulderCoveredRoute: state.debug.chase.pathProgress >= 0.95,
  sealed: state.debug.chase.sealed === true && state.debug.chase.active === false,
  noReset: state.debug.resetCount === 0,
  noCatch: state.debug.boulderCatchCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const passed = !traversalFailure && Object.values(checks).every(Boolean);
const result = {
  version: 'rebuild-v2-pass10-focused',
  testedWith: 'Chromium + Playwright helper start placement, then actual keyboard events',
  helperCoordinateMovement: true,
  helperUse: 'Only to place the player and boulder at the Pass 09 exit; not a full traversal.',
  actualKeyboardRoute: 'Pass 09 exit -> shaft one wall jumps -> connector -> shaft two wall jumps -> lower hall -> Pass 10 exit',
  traversalFailure,
  state,
  routeSamples,
  checks,
  passed,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass10-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!passed) process.exitCode = 1;
