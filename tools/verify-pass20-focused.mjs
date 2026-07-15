import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

let chromium;
try {
  chromium = (await import('/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js')).default;
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  chromium = (await import('/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js')).default;
}

const server = spawn('python3', ['-m', 'http.server', '4195'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const executablePath = fs.existsSync('/tmp/coreless138/chromium') ? '/tmp/coreless138/chromium' : await chromium.executablePath();
const launchArgs = chromium.args.filter(arg => (
  arg !== '--single-process'
  && arg !== '--in-process-gpu'
  && arg !== '--ignore-gpu-blocklist'
  && !arg.startsWith('--use-gl=')
  && !arg.startsWith('--use-angle=')
  && arg !== '--enable-unsafe-swiftshader'
));
launchArgs.push('--disable-gpu');
const browser = await playwright.launch({ executablePath, args: launchArgs, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4195/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  Object.assign(runtime.progress, {
    pass14Completed: true,
    pass15Completed: true,
    bridgeExitReached: true,
    bridgeBoulderPlunged: true,
    chaseEscaped: true,
    pass18Entered: true,
    pass18Completed: true,
    pass18CheckpointActivated: true,
    pass18NarrowLandings: 12,
    pass18ShortCuts: 2,
    pass18HeldJumps: 11,
    pass19AftershockStarted: true,
    pass19Completed: true,
    pass19CheckpointStabilized: true,
    pass19FloorsArmed: 12,
    pass19FloorsCollapsed: 12,
    pass19DebrisBursts: 12,
  });
  runtime.chase.active = false;
  runtime.chase.sealed = true;
  runtime.chase.pathDistance = window.__corelessV2.pass15.chase.path.totalDistance;
  Object.assign(runtime.player, {
    x: 29420, y: 10462, previousX: 29420, previousY: 10462,
    vx: 0, vy: 0, facing: 1, grounded: true, wallSide: 0,
    dashAvailable: true, dashFrames: 0, dashCooldown: 0,
    grappleLaunchFrames: 0, springLaunchFrames: 0,
    standingPlatformId: null, standingFloorId: 'pass18_exit_slope',
  });
  runtime.snapCamera();
});
await page.waitForTimeout(220);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass20-focused-entry.png' });

let failure = null;
const samples = [];
await page.keyboard.down('d');
for (let iteration = 0; iteration < 1400; iteration += 1) {
  const state = await page.evaluate(() => window.__corelessV2.debug());
  const p = state.player;
  if (iteration % 4 === 0) samples.push({
    iteration,
    frame: state.frameCount,
    x: p.x,
    y: p.y,
    vx: p.vx,
    vy: p.vy,
    grounded: p.grounded,
    floor: p.standingFloorId,
    springFrames: p.springLaunchFrames,
    cameraZoom: state.camera.zoom,
    launched: state.progress.pass20SpringLaunched,
    landed: state.progress.pass20SpringLanded,
  });
  if (state.resetCount > 0) {
    failure = `reset at ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    break;
  }
  if (state.progress.pass20Completed) break;
  await page.waitForTimeout(18);
}
await page.keyboard.up('d');
await page.waitForTimeout(500);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass20-focused-exit.png' });
await page.keyboard.press('b');
await page.waitForTimeout(160);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass20-focused-blueprint.png' });
await page.keyboard.press('b');
await page.waitForTimeout(120);

const state = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
  validation: window.__corelessV2.pass20.validate(),
}));
const checks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 20',
  runtimeAudit: state.audit.passed && state.audit.passedCount === 29,
  pass19Retained: state.audit.pass19.passed && state.audit.pass19.passedCount === 30,
  pass20Audit: state.validation.passed && state.validation.passedCount === 36,
  entered: state.debug.progress.pass20Entered,
  ready: state.debug.progress.pass20SpringReady,
  oneLaunch: state.debug.progress.pass20SpringLaunches === 1,
  apex: state.debug.progress.pass20SpringApexReached,
  chasmClear: state.debug.progress.pass20ChasmCleared,
  oneLanding: state.debug.progress.pass20SpringLandings === 1,
  horizontalSpeed: state.debug.progress.pass20PeakHorizontalSpeed >= 20,
  flightDuration: state.debug.progress.pass20FlightFrames >= 40,
  wideCamera: samples.some(sample => sample.launched && !sample.landed && sample.cameraZoom <= 0.84),
  completed: state.debug.progress.pass20ExitReached && state.debug.progress.pass20Completed,
  noReset: state.debug.resetCount === 0,
  keyboard: state.audit.inputProbe.usedCodes.includes('KeyD'),
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass20-focused',
  category: 'focused actual-keyboard spring traversal after helper placement at the pass 19 checkpoint',
  helperCoordinateMovement: true,
  actualKeyboardRoute: 'pass 19 checkpoint -> directional spring runway -> 1140px chasm flight -> landing basin -> lower checkpoint',
  failure,
  passed: !failure && Object.values(checks).every(Boolean),
  checks,
  state,
  samples,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass20-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
