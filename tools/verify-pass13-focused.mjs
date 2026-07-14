import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4205'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const localChromium = ['/tmp/coreless138/chromium', '/tmp/chromium'].find(path => {
  try { return fs.statSync(path).size > 0; } catch { return false; }
});
const browser = await playwright.launch({
  executablePath: localChromium ?? await chromium.executablePath(),
  args: chromium.args,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));

await page.goto('http://127.0.0.1:4205/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });
const pausedScreenshot = async path => {
  await page.evaluate(() => {
    const runtime = window.__corelessV2.runtime;
    runtime.running = false;
    runtime.draw();
  });
  await page.locator('#gameCanvas').screenshot({ path });
  await page.evaluate(() => {
    const runtime = window.__corelessV2.runtime;
    runtime.running = true;
    runtime.frameHandle = requestAnimationFrame(() => runtime.frame());
  });
};

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
    dashSpikeEntered: true,
    dashSpikeTakeoff: true,
    dashSpikeAirDashUsed: true,
    dashSpikeCleared: true,
    zone09DashExitReached: true,
    pass12Completed: true,
    boulderStarted: true,
    boulderAtInternalEntry: true,
    internalStructureBreached: true,
  });
  Object.assign(runtime.player, {
    x: 20307,
    y: 7152,
    previousX: 20307,
    previousY: 7152,
    vx: 0,
    vy: 0,
    facing: -1,
    grounded: true,
    wallSide: 0,
    dashAvailable: true,
  });
  const pass12Distance = window.__corelessV2.pass12.chase.path.totalDistance;
  Object.assign(runtime.chase, {
    triggered: true,
    active: true,
    sealed: false,
    delayFrames: 0,
    breachDelayFrames: 0,
    breachComplete: true,
    internalBreakpointIndex: window.__corelessV2.pass12.chase.boulder.internalBreakpoints.length,
    internalPauseFrames: 0,
    activeFrames: 0,
    pathDistance: pass12Distance * 0.99,
    pathIndex: 0,
  });
  runtime.updateBoulderPosition();
  runtime.snapCamera();
});

await pausedScreenshot('browser-artifacts/pass13-focused-entry.png');
const debug = () => page.evaluate(() => window.__corelessV2.debug());
const routeSamples = [];
const inputEvents = [];
let traversalFailure = null;
let shortTakeoffShot = false;
let shortJumpHeld = false;
let shortJumpStartFrame = null;
let shortLandingShot = false;
let movingRight = false;
let waitingAtExit = false;
let longJumpHeld = false;
let longLandingShot = false;

await page.keyboard.down('a');
for (let loop = 0; loop < 6000; loop += 1) {
  const state = await debug();
  const p = state.player;
  if (loop % 5 === 0) routeSamples.push({
    frame: state.frameCount,
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10,
    vx: Math.round(p.vx * 10) / 10,
    vy: Math.round(p.vy * 10) / 10,
    grounded: p.grounded,
    jumpKind: state.precisionJump.kind,
    shortCleared: state.progress.precisionShortGapCleared,
    turnReached: state.progress.precisionTurnReached,
    reversed: state.progress.precisionDirectionReversed,
    longCleared: state.progress.precisionLongGapCleared,
    boulderProgress: Math.round(state.chase.pathProgress * 10000) / 10000,
  });
  if (state.resetCount > 0 || state.boulderCatchCount > 0) {
    traversalFailure = `reset/catch at x=${p.x.toFixed(1)} y=${p.y.toFixed(1)}`;
    break;
  }
  if (state.progress.pass13Completed) break;

  if (!shortTakeoffShot && p.grounded && p.x <= 20000 && p.x >= 19970) {
    await page.keyboard.up('a');
    await pausedScreenshot('browser-artifacts/pass13-focused-short-takeoff.png');
    await page.keyboard.down('a');
    shortTakeoffShot = true;
  }
  if (!shortJumpHeld && !state.progress.precisionShortGapCleared && p.grounded && p.x <= 19890 && p.x >= 19825) {
    inputEvents.push({ type: 'short_down', frame: state.frameCount, x: p.x, vx: p.vx });
    await page.keyboard.down('Space');
    shortJumpHeld = true;
    shortJumpStartFrame = (await debug()).frameCount;
  }
  if (shortJumpHeld && state.frameCount - shortJumpStartFrame >= 2) {
    inputEvents.push({ type: 'short_up', frame: state.frameCount, x: p.x, vx: p.vx });
    await page.keyboard.up('Space');
    shortJumpHeld = false;
  }
  if (!shortLandingShot && state.progress.precisionShortGapCleared) {
    shortLandingShot = true;
    await pausedScreenshot('browser-artifacts/pass13-focused-short-landing.png');
  }
  if (state.progress.precisionTurnReached && !movingRight && !waitingAtExit) {
    inputEvents.push({ type: 'reverse', frame: state.frameCount, x: p.x, vx: p.vx });
    await page.keyboard.up('a');
    await page.keyboard.down('d');
    movingRight = true;
  }
  if (movingRight && !longJumpHeld && !state.progress.precisionLongGapCleared && p.grounded && p.vx >= 4.8 && p.x >= 18945 && p.x <= 18980) {
    inputEvents.push({ type: 'long_down', frame: state.frameCount, x: p.x, vx: p.vx });
    await page.keyboard.down('Space');
    longJumpHeld = true;
  }
  if (longJumpHeld && state.progress.precisionLongGapCleared) {
    await page.keyboard.up('Space');
    longJumpHeld = false;
  }
  if (!longLandingShot && state.progress.precisionLongGapCleared) {
    longLandingShot = true;
    await pausedScreenshot('browser-artifacts/pass13-focused-long-landing.png');
  }
  if (state.progress.precisionExitReached && movingRight) {
    await page.keyboard.up('d');
    movingRight = false;
    waitingAtExit = true;
  }
  await page.waitForTimeout(16);
}

await page.keyboard.up('a').catch(() => {});
await page.keyboard.up('d').catch(() => {});
if (shortJumpHeld || longJumpHeld) await page.keyboard.up('Space').catch(() => {});
await page.waitForTimeout(180);
await pausedScreenshot('browser-artifacts/pass13-focused-exit.png');
await page.keyboard.press('b');
await page.waitForTimeout(80);
await pausedScreenshot('browser-artifacts/pass13-blueprint.png');
await page.keyboard.press('b');

const state = await page.evaluate(() => ({
  title: document.title,
  buildStatus: document.getElementById('buildStatus')?.textContent,
  auditStatus: document.getElementById('auditStatus')?.textContent,
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
  hazards: window.__corelessV2.pass13.zone.hazards,
}));
const requiredCodes = ['KeyA', 'KeyD', 'Space'];
const usedCodes = state.audit.inputProbe.usedCodes;
const pass13Audit = state.audit.pass13;
const checks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 13',
  runtimeAudit: state.audit.passed === true && state.audit.passedCount === 22,
  pass13Audit: pass13Audit.passed === true && pass13Audit.passedCount === 36,
  shortGapDimensions: pass13Audit.shortGap === 100,
  shortCutClears: pass13Audit.shortGap < pass13Audit.shortCutReach + 34,
  lowCeilingDiscriminates: pass13Audit.shortCutRise < pass13Audit.ceilingHeadroom && pass13Audit.fullJumpRise > pass13Audit.ceilingHeadroom,
  longGapDimensions: pass13Audit.longGap === 195,
  shortCutCannotClearLong: pass13Audit.longGap > pass13Audit.shortCutLongReach + 34,
  fullJumpClearsLong: pass13Audit.longGap < pass13Audit.fullLongReach + 34,
  shortSequence: state.debug.progress.precisionShortTakeoff && state.debug.progress.precisionShortJumpCut && state.debug.progress.precisionShortGapCleared,
  noCeilingBump: state.debug.progress.precisionLowCeilingCleared && state.debug.progress.precisionCeilingBumps === 0,
  turnSequence: state.debug.progress.precisionTurnReached && state.debug.progress.precisionDirectionReversed && state.debug.progress.precisionDirectionChanges === 1,
  turnFloorCollapsed: state.debug.collapsedFloorIds.includes('precision_turn_descent'),
  longSequence: state.debug.progress.precisionLongTakeoff && state.debug.progress.precisionLongGapCleared,
  exitReached: state.debug.progress.precisionExitReached,
  completed: state.debug.progress.pass13Completed,
  boulderCoveredRoute: state.debug.chase.pathProgress >= 0.99,
  boulderSealed: state.debug.chase.sealed && !state.debug.chase.active,
  boulderIgnoredSpikes: state.hazards.every(item => item.ignoredByBoulder),
  noReset: state.debug.resetCount === 0,
  noBoulderCatch: state.debug.boulderCatchCount === 0,
  keyboard: requiredCodes.every(code => usedCodes.includes(code)),
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const passed = !traversalFailure && Object.values(checks).every(Boolean);
const result = {
  version: 'rebuild-v2-pass13-focused',
  testedWith: 'Chromium + Playwright actual keyboard events',
  actualKeyboardRoute: 'Pass 12 exit helper placement -> A left -> short Space with early release -> low-ceiling landing -> left descent -> D reversal -> held Space long jump -> right exit',
  helperCoordinateMovement: true,
  traversalFailure,
  state,
  routeSamples,
  inputEvents,
  checks,
  passed,
  consoleErrors,
  pageErrors,
  screenshots: [
    'browser-artifacts/pass13-focused-entry.png',
    'browser-artifacts/pass13-focused-short-takeoff.png',
    'browser-artifacts/pass13-focused-short-landing.png',
    'browser-artifacts/pass13-focused-long-landing.png',
    'browser-artifacts/pass13-focused-exit.png',
    'browser-artifacts/pass13-blueprint.png',
  ],
  limitations: [
    'The helper only places the player at the verified Pass 12 exit and configures prior completion state.',
    'This focused run is not counted as a full start-to-exit traversal.',
  ],
};
fs.writeFileSync('browser-artifacts/pass13-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!passed) process.exitCode = 1;
