import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4203'], { cwd: process.cwd(), stdio: 'ignore' });
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

await page.goto('http://127.0.0.1:4203/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  Object.assign(runtime.progress, {
    pass07Completed: true,
    pass08Completed: true,
    zone07ExitReached: true,
    pass09Completed: true,
    zone08ExitReached: true,
    pass10Completed: true,
    zone09Entered: true,
    grappleAnchorOneUsed: true,
    grappleAnchorTwoUsed: true,
    grappleAnchorThreeUsed: true,
    grappleChainCompleted: true,
    zone09ExitReached: true,
    pass11Completed: true,
    boulderStarted: true,
    boulderAtInternalEntry: true,
    internalStructureBreached: true,
  });
  Object.assign(runtime.player, {
    x: 22440,
    y: 6852,
    previousX: 22440,
    previousY: 6852,
    vx: 0,
    vy: 0,
    grounded: true,
    wallSide: 0,
    dashAvailable: true,
  });
  const pass11Distance = window.__corelessV2.pass11.chase.path.totalDistance;
  Object.assign(runtime.chase, {
    triggered: true,
    active: true,
    sealed: false,
    delayFrames: 0,
    breachDelayFrames: 0,
    breachComplete: true,
    internalBreakpointIndex: 10,
    internalPauseFrames: 0,
    pathDistance: pass11Distance * 0.965,
    pathIndex: 0,
  });
  runtime.updateBoulderPosition();
  runtime.snapCamera();
});

await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass12-focused-entry.png' });
const debug = () => page.evaluate(() => window.__corelessV2.debug());
const routeSamples = [];
let traversalFailure = null;
let jumpHeld = false;
let dashPressed = false;
let landingShot = false;

await page.keyboard.down('a');
for (let loop = 0; loop < 2600; loop += 1) {
  const state = await debug();
  const p = state.player;
  if (loop % 8 === 0) routeSamples.push({
    frame: state.frameCount,
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10,
    vx: Math.round(p.vx * 10) / 10,
    vy: Math.round(p.vy * 10) / 10,
    grounded: p.grounded,
    dashAvailable: p.dashAvailable,
    dashSpikeEntered: state.progress.dashSpikeEntered,
    dashSpikeTakeoff: state.progress.dashSpikeTakeoff,
    dashSpikeAirDashUsed: state.progress.dashSpikeAirDashUsed,
    dashSpikeCleared: state.progress.dashSpikeCleared,
    boulderProgress: Math.round(state.chase.pathProgress * 1000) / 1000,
  });
  if (state.resetCount > 0 || state.boulderCatchCount > 0) {
    traversalFailure = `reset/catch at x=${p.x.toFixed(1)} y=${p.y.toFixed(1)}`;
    break;
  }
  if (state.progress.pass12Completed) break;

  if (!jumpHeld && p.grounded && p.x <= 21688 && !state.progress.dashSpikeCleared) {
    await page.keyboard.down('Space');
    jumpHeld = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass12-focused-takeoff.png' });
  }
  if (jumpHeld && !dashPressed && !p.grounded && p.x <= 21645) {
    await page.keyboard.press('Shift');
    dashPressed = true;
  }
  if (jumpHeld && dashPressed && p.x <= 21440) {
    await page.keyboard.up('Space');
    jumpHeld = false;
  }
  if (!landingShot && state.progress.dashSpikeCleared) {
    landingShot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass12-focused-landing.png' });
  }
  if (state.progress.zone09DashExitReached) await page.keyboard.up('a');
  await page.waitForTimeout(24);
}

await page.keyboard.up('a').catch(() => {});
if (jumpHeld) await page.keyboard.up('Space').catch(() => {});
await page.waitForTimeout(180);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass12-focused-exit.png' });
const state = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
}));
const requiredCodes = ['KeyA', 'Space', 'ShiftLeft'];
const usedCodes = state.audit.inputProbe.usedCodes;
const pass12Audit = state.audit.pass12;
const deterministicChecks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 12',
  runtimeAudit: state.audit.passed === true && state.audit.passedCount === 21,
  pass12Audit: pass12Audit.passed === true && pass12Audit.passedCount === 32,
  jumpOnlyInsufficient: pass12Audit.horizontalGap > pass12Audit.jumpOnlyReach + 34,
  jumpDashSufficient: pass12Audit.horizontalGap < pass12Audit.jumpDashReach + 34,
  entered: state.debug.progress.dashSpikeEntered === true,
  takeoff: state.debug.progress.dashSpikeTakeoff === true,
  airDashUsed: state.debug.progress.dashSpikeAirDashUsed === true && state.debug.progress.chaseAirDashes === 1,
  landing: state.debug.progress.dashSpikeCleared === true,
  exitReached: state.debug.progress.zone09DashExitReached === true,
  completed: state.debug.progress.pass12Completed === true,
  boulderCoveredSpikes: state.debug.chase.pathProgress >= 0.99,
  boulderSealed: state.debug.chase.sealed === true && state.debug.chase.active === false,
  noReset: state.debug.resetCount === 0,
  noBoulderCatch: state.debug.boulderCatchCount === 0,
  keyboard: requiredCodes.every(code => usedCodes.includes(code)),
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const passed = !traversalFailure && Object.values(deterministicChecks).every(Boolean);
const result = {
  version: 'rebuild-v2-pass12-focused',
  testedWith: 'Chromium + Playwright actual keyboard events',
  actualKeyboardRoute: 'Pass 11 exit helper placement -> left takeoff slope -> Space jump -> Shift air dash -> long spike landing -> Pass 12 exit',
  helperCoordinateMovement: true,
  traversalFailure,
  state,
  routeSamples,
  deterministicChecks,
  passed,
  consoleErrors,
  pageErrors,
  limitations: [
    'The helper only places the player at the Pass 11 exit and configures prior completion state.',
    'This focused run is not counted as a full start-to-exit traversal.',
  ],
};
fs.writeFileSync('browser-artifacts/pass12-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!passed) process.exitCode = 1;
