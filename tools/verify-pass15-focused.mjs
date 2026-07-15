import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4216'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const localChromium = ['/tmp/coreless138/chromium', '/tmp/chromium'].find(path => { try { return fs.statSync(path).size > 0; } catch { return false; } });
const browser = await playwright.launch({ executablePath: localChromium ?? await chromium.executablePath(), args: chromium.args, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4216/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

const pausedScreenshot = async path => {
  await page.evaluate(() => { const r = window.__corelessV2.runtime; r.running = false; r.draw(); });
  await page.locator('#gameCanvas').screenshot({ path });
  await page.evaluate(() => { const r = window.__corelessV2.runtime; r.running = true; r.frameHandle = requestAnimationFrame(() => r.frame()); });
};

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  const pass14 = window.__corelessV2.pass14;
  Object.assign(runtime.progress, {
    pass07Completed: true, pass08Completed: true, zone07ExitReached: true, pass09Completed: true,
    zone08ExitReached: true, pass10Completed: true, grappleChainCompleted: true, zone09ExitReached: true,
    pass11Completed: true, dashSpikeCleared: true, zone09DashExitReached: true, pass12Completed: true,
    precisionShortGapCleared: true, precisionLowCeilingCleared: true, precisionDirectionReversed: true,
    precisionLongGapCleared: true, precisionExitReached: true, pass13Completed: true,
    giantCurveUpperGapCleared: true, giantCurveSteepCommitted: true, giantCurveDropStarted: true,
    giantCurveLowerLanded: true, giantCurveDirectionReversed: true, giantCurveExitReached: true,
    pass14Completed: true, boulderStarted: true, boulderAtInternalEntry: true, internalStructureBreached: true,
    floorsCollapsed: pass14.chase.collapsePanels.length, supportsDestroyed: pass14.chase.supportTargets.length,
  });
  Object.assign(runtime.player, { x: 19010, y: 8953, previousX: 19010, previousY: 8953, vx: 0, vy: 0, facing: 1, grounded: true, wallSide: 0, dashAvailable: true });
  runtime.collapsedFloorIds = new Set(pass14.chase.collapsePanels.map(item => item.floorId));
  runtime.destroyedSupportIds = new Set(pass14.chase.supportTargets.map(item => item.id));
  Object.assign(runtime.chase, {
    triggered: true, active: true, sealed: false, delayFrames: 0, breachDelayFrames: 0, breachComplete: true,
    internalBreakpointIndex: pass14.chase.boulder.internalBreakpoints.length, internalPauseFrames: 0,
    pass14HeadStartFrames: 0, pass15HeadStartFrames: 220, activeFrames: 0,
    pathDistance: pass14.chase.path.totalDistance, pathIndex: 0,
  });
  runtime.updateBoulderPosition();
  runtime.snapCamera();
});

await pausedScreenshot('browser-artifacts/pass15-focused-entry.png');
const routeSamples = [];
const inputEvents = [];
let traversalFailure = null;
let jumpHeld = false;
let jumpStartFrame = 0;
let finalDashSent = false;
let waitingAtExit = false;
await page.keyboard.down('d');
inputEvents.push({ type: 'direction_right' });

for (let loop = 0; loop < 7000; loop += 1) {
  const state = await page.evaluate(() => window.__corelessV2.debug());
  const p = state.player;
  if (loop % 5 === 0) routeSamples.push({
    frame: state.frameCount, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10,
    vx: Math.round(p.vx * 10) / 10, vy: Math.round(p.vy * 10) / 10, grounded: p.grounded,
    cameraZoom: Math.round(state.camera.zoom * 1000) / 1000,
    boulderProgress: Math.round(state.chase.pathProgress * 10000) / 10000,
    gap1: state.progress.bridgeGapOneCleared, gap2: state.progress.bridgeGapTwoCleared,
    gap3: state.progress.bridgeGapThreeCleared, exit: state.progress.bridgeExitReached,
  });
  if (state.resetCount > 0 || state.boulderCatchCount > 0) {
    traversalFailure = `reset/catch at x=${p.x.toFixed(1)} y=${p.y.toFixed(1)}`;
    break;
  }
  if (state.progress.pass15Completed) break;
  const nextGap = windowGap(state.progress);
  if (!jumpHeld && nextGap && p.grounded && p.x + 34 >= nextGap - 35 && p.x + 34 <= nextGap - 5) {
    await page.keyboard.down('Space');
    jumpHeld = true;
    jumpStartFrame = state.frameCount;
    inputEvents.push({ type: 'jump_down', frame: state.frameCount, gap: nextGap, x: p.x });
  }
  if (jumpHeld && state.frameCount - jumpStartFrame >= 18) {
    await page.keyboard.up('Space');
    jumpHeld = false;
    inputEvents.push({ type: 'jump_up', frame: state.frameCount, x: p.x });
  }
  if (jumpHeld && nextGap === 23400 && !finalDashSent && state.frameCount - jumpStartFrame >= 10) {
    await page.keyboard.press('Shift');
    finalDashSent = true;
    inputEvents.push({ type: 'final_air_dash', frame: state.frameCount, x: p.x });
  }
  if (state.progress.bridgeExitReached && !waitingAtExit) {
    await page.keyboard.up('d');
    waitingAtExit = true;
  }
  await page.waitForTimeout(16);
}

function windowGap(progress) {
  if (!progress.bridgeGapOneCleared) return 20100;
  if (!progress.bridgeGapTwoCleared) return 21800;
  if (!progress.bridgeGapThreeCleared) return 23400;
  return null;
}

await page.keyboard.up('d').catch(() => {});
await page.keyboard.up('Space').catch(() => {});
await page.waitForTimeout(160);
await pausedScreenshot('browser-artifacts/pass15-focused-exit.png');
await page.keyboard.press('b');
await page.waitForTimeout(80);
await pausedScreenshot('browser-artifacts/pass15-blueprint.png');
await page.keyboard.press('b');
const state = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
}));
const usedCodes = state.audit.inputProbe.usedCodes;
const checks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 15',
  runtimeAudit: state.audit.passed === true && state.audit.passedCount === 24,
  pass15Audit: state.audit.pass15.passed === true && state.audit.pass15.passedCount === 29,
  actualKeyboardInput: ['KeyB', 'KeyD', 'ShiftLeft', 'Space'].every(code => usedCodes.includes(code)),
  threeJumps: state.debug.progress.bridgeJumps === 3,
  threeGaps: state.debug.progress.bridgeGapOneCleared && state.debug.progress.bridgeGapTwoCleared && state.debug.progress.bridgeGapThreeCleared,
  finalAirDash: state.debug.progress.bridgeFinalAirDash && state.debug.progress.bridgeAirDashes === 1,
  exitReached: state.debug.progress.bridgeExitReached,
  boulderPlunged: state.debug.progress.bridgeBoulderPlunged,
  pass15Completed: state.debug.progress.pass15Completed,
  cameraFinale: routeSamples.some(item => item.cameraZoom <= 0.64),
  boulderSealed: state.debug.chase.sealed && !state.debug.chase.active && state.debug.chase.pathProgress >= 0.995,
  noResetOrCatch: state.debug.resetCount === 0 && state.debug.boulderCatchCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass15-focused', category: 'focused keyboard traversal after helper placement at the pass 14 bridge handoff',
  helperCoordinateMovement: true, actualKeyboardRoute: 'pass 14 handoff -> three broken bridge gaps -> stone landing -> final boulder plunge',
  traversalFailure, inputEvents, routeSamples, state, checks,
  passed: !traversalFailure && Object.values(checks).every(Boolean), consoleErrors, pageErrors,
  limitation: 'The helper prepares only the pass 14 handoff and prior chase state; this focused run is not counted as a full start-to-exit traversal.',
};
fs.writeFileSync('browser-artifacts/pass15-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
