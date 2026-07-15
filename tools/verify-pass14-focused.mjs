import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4215'], { cwd: process.cwd(), stdio: 'ignore' });
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

await page.goto('http://127.0.0.1:4215/index.html', { waitUntil: 'networkidle' });
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
  const pass13 = window.__corelessV2.pass13;
  Object.assign(runtime.progress, {
    pass07Completed: true,
    pass08Completed: true,
    zone07ExitReached: true,
    pass09Completed: true,
    zone08ExitReached: true,
    pass10Completed: true,
    grappleChainCompleted: true,
    zone09ExitReached: true,
    pass11Completed: true,
    dashSpikeCleared: true,
    zone09DashExitReached: true,
    pass12Completed: true,
    precisionShortGapCleared: true,
    precisionLowCeilingCleared: true,
    precisionDirectionReversed: true,
    precisionLongGapCleared: true,
    precisionExitReached: true,
    pass13Completed: true,
    boulderStarted: true,
    boulderAtInternalEntry: true,
    internalStructureBreached: true,
    floorsCollapsed: pass13.chase.collapsePanels.length,
    supportsDestroyed: pass13.chase.supportTargets.length,
  });
  Object.assign(runtime.player, {
    x: 19792,
    y: 7472,
    previousX: 19792,
    previousY: 7472,
    vx: 0,
    vy: 0,
    facing: -1,
    grounded: true,
    wallSide: 0,
    dashAvailable: true,
  });
  runtime.collapsedFloorIds = new Set(pass13.chase.collapsePanels.map(item => item.floorId));
  runtime.destroyedSupportIds = new Set(pass13.chase.supportTargets.map(item => item.id));
  Object.assign(runtime.chase, {
    triggered: true,
    active: true,
    sealed: false,
    delayFrames: 0,
    breachDelayFrames: 0,
    breachComplete: true,
    internalBreakpointIndex: pass13.chase.boulder.internalBreakpoints.length,
    internalPauseFrames: 0,
    pass14HeadStartFrames: 180,
    activeFrames: 0,
    pathDistance: pass13.chase.path.totalDistance,
    pathIndex: 0,
  });
  runtime.updateBoulderPosition();
  runtime.snapCamera();
});

await pausedScreenshot('browser-artifacts/pass14-focused-entry.png');
const debug = () => page.evaluate(() => window.__corelessV2.debug());
const routeSamples = [];
const inputEvents = [];
let traversalFailure = null;
let jumpHeld = false;
let jumpStartFrame = null;
let movingRight = false;
let waitingAtExit = false;
let overviewShot = false;

await page.keyboard.down('a');
inputEvents.push({ type: 'direction_left' });
for (let loop = 0; loop < 6500; loop += 1) {
  const state = await debug();
  const p = state.player;
  if (loop % 5 === 0) routeSamples.push({
    frame: state.frameCount,
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10,
    vx: Math.round(p.vx * 10) / 10,
    vy: Math.round(p.vy * 10) / 10,
    grounded: p.grounded,
    cameraZoom: Math.round(state.camera.zoom * 1000) / 1000,
    boulderX: Math.round(state.chase.x * 10) / 10,
    boulderY: Math.round(state.chase.y * 10) / 10,
    boulderProgress: Math.round(state.chase.pathProgress * 10000) / 10000,
    upperGap: state.progress.giantCurveUpperGapCleared,
    steep: state.progress.giantCurveSteepCommitted,
    drop: state.progress.giantCurveDropStarted,
    landed: state.progress.giantCurveLowerLanded,
    reversed: state.progress.giantCurveDirectionReversed,
  });
  if (state.resetCount > 0 || state.boulderCatchCount > 0) {
    traversalFailure = `reset/catch at x=${p.x.toFixed(1)} y=${p.y.toFixed(1)}`;
    break;
  }
  if (state.progress.pass14Completed) break;

  if (!jumpHeld && !state.progress.giantCurveUpperGapCleared && p.grounded && p.x <= 18970 && p.x >= 18925) {
    inputEvents.push({ type: 'jump_down', frame: state.frameCount, x: p.x, vx: p.vx });
    await page.keyboard.down('Space');
    jumpHeld = true;
    jumpStartFrame = state.frameCount;
  }
  if (jumpHeld && state.frameCount - jumpStartFrame >= 12) {
    inputEvents.push({ type: 'jump_up', frame: state.frameCount, x: p.x, vx: p.vx });
    await page.keyboard.up('Space');
    jumpHeld = false;
  }
  if (state.progress.giantCurveLowerLanded && !movingRight && !waitingAtExit) {
    inputEvents.push({ type: 'direction_right', frame: state.frameCount, x: p.x, y: p.y });
    await page.keyboard.up('a');
    await page.keyboard.down('d');
    movingRight = true;
  }
  if (state.progress.giantCurveDirectionReversed && !overviewShot) {
    overviewShot = true;
    await pausedScreenshot('browser-artifacts/pass14-focused-overview.png');
  }
  if (state.progress.giantCurveExitReached && movingRight) {
    await page.keyboard.up('d');
    movingRight = false;
    waitingAtExit = true;
  }
  await page.waitForTimeout(16);
}

await page.keyboard.up('a').catch(() => {});
await page.keyboard.up('d').catch(() => {});
if (jumpHeld) await page.keyboard.up('Space').catch(() => {});
await page.waitForTimeout(180);
await pausedScreenshot('browser-artifacts/pass14-focused-exit.png');
await page.keyboard.press('b');
await page.waitForTimeout(80);
await pausedScreenshot('browser-artifacts/pass14-blueprint.png');
await page.keyboard.press('b');

const state = await page.evaluate(() => ({
  title: document.title,
  buildStatus: document.getElementById('buildStatus')?.textContent,
  auditStatus: document.getElementById('auditStatus')?.textContent,
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
}));
const usedCodes = state.audit.inputProbe.usedCodes;
const checks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 14',
  runtimeAudit: state.audit.passed === true && state.audit.passedCount === 23,
  pass14Audit: state.audit.pass14.passed === true && state.audit.pass14.passedCount === 43,
  actualKeyboardInput: ['KeyA', 'KeyB', 'KeyD', 'Space'].every(code => usedCodes.includes(code)),
  upperGapJump: state.debug.progress.giantCurveUpperTakeoff && state.debug.progress.giantCurveUpperGapCleared && state.debug.progress.giantCurveUpperJumps === 1,
  steepCurve: state.debug.progress.giantCurveSteepCommitted,
  naturalDrop: state.debug.progress.giantCurveDropStarted && state.debug.progress.giantCurveLowerLanded && state.debug.progress.giantCurveNaturalDrops === 1,
  oppositeDirection: state.debug.progress.giantCurveDirectionReversed && state.debug.progress.giantCurveDirectionChanges === 1,
  exitReached: state.debug.progress.giantCurveExitReached,
  pass14Completed: state.debug.progress.pass14Completed,
  cameraWideEnough: routeSamples.some(item => item.cameraZoom <= 0.41),
  boulderCoveredCurve: state.debug.chase.pathProgress >= 0.99,
  boulderSealed: state.debug.chase.sealed && !state.debug.chase.active,
  noResetOrCatch: state.debug.resetCount === 0 && state.debug.boulderCatchCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass14-focused',
  category: 'focused keyboard traversal after helper placement at the pass 13 exit',
  helperCoordinateMovement: true,
  actualKeyboardRoute: 'pass 13 exit -> left upper survival slope -> jump upper gap -> steep curve -> natural fall -> right lower return -> pass 14 bridge handoff',
  traversalFailure,
  inputEvents,
  routeSamples,
  state,
  checks,
  passed: !traversalFailure && Object.values(checks).every(Boolean),
  consoleErrors,
  pageErrors,
  limitation: 'The helper prepares only the pass 13 exit and prior chase state; this focused run is not counted as a full start-to-exit traversal.',
};
fs.writeFileSync('browser-artifacts/pass14-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
