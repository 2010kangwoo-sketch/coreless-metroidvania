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

const server = spawn('python3', ['-m', 'http.server', '4199'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const executablePath = fs.existsSync('/tmp/coreless138/chromium') ? '/tmp/coreless138/chromium' : await chromium.executablePath();
const launchArgs = chromium.args.filter(arg => arg !== '--single-process' && arg !== '--in-process-gpu' && arg !== '--ignore-gpu-blocklist' && !arg.startsWith('--use-gl=') && !arg.startsWith('--use-angle=') && arg !== '--enable-unsafe-swiftshader');
launchArgs.push('--disable-gpu');
const browser = await playwright.launch({ executablePath, args: launchArgs, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4199/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  Object.assign(runtime.progress, {
    pass15Completed: true,
    pass18Completed: true,
    pass19Completed: true,
    pass20Entered: true,
    pass20SpringReady: true,
    pass20SpringLaunched: true,
    pass20SpringApexReached: true,
    pass20ChasmCleared: true,
    pass20SpringLanded: true,
    pass20ExitReached: true,
    pass20Completed: true,
    pass20SpringLaunches: 1,
    pass20SpringLandings: 1,
    pass21PacingEngaged: true,
    pass21Completed: true,
  });
  runtime.chase.active = false;
  runtime.chase.sealed = true;
  Object.assign(runtime.player, {
    x: 33700, y: 11122, previousX: 33700, previousY: 11122,
    vx: 0, vy: 0, facing: -1, grounded: true, wallSide: 0,
    dashAvailable: true, dashFrames: 0, dashCooldown: 0,
    grappleLaunchFrames: 0, springLaunchFrames: 0,
    standingPlatformId: null, standingFloorId: 'pass20_exit_slope',
  });
  runtime.snapCamera();
});

await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass22-focused-entry.png' });
const samples = [];
let failure = null;
await page.keyboard.down('a');
for (let iteration = 0; iteration < 900; iteration += 1) {
  const state = await page.evaluate(() => window.__corelessV2.debug());
  const p = state.player;
  if (iteration % 4 === 0) samples.push({ iteration, frame: state.frameCount, x: p.x, y: p.y, vx: p.vx, vy: p.vy, grounded: p.grounded, floor: p.standingFloorId });
  if (state.resetCount > 0) {
    failure = `reset at ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    break;
  }
  if (state.progress.pass22Completed) break;
  await page.waitForTimeout(18);
}
await page.keyboard.up('a');
await page.waitForTimeout(260);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass22-focused-exit.png' });

const state = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
  validation: window.__corelessV2.pass22.validate(),
}));
const visitedFloors = [...new Set(samples.map(sample => sample.floor).filter(Boolean))];
const checks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 22',
  runtimeAudit: state.audit.passed && state.audit.passedCount === 31,
  pass21Retained: state.audit.pass21.passed && state.audit.pass21.passedCount === 29,
  pass22Audit: state.validation.passed && state.validation.passedCount === 12,
  threeSurfaces: ['pass22_west_step', 'pass22_lower_shelf', 'pass22_exit_slope'].every(id => visitedFloors.includes(id)),
  entered: state.debug.progress.pass22Entered,
  firstLanding: state.debug.progress.pass22FirstLanding,
  secondLanding: state.debug.progress.pass22SecondLanding,
  completed: state.debug.progress.pass22ExitReached && state.debug.progress.pass22Completed,
  noReset: state.debug.resetCount === 0,
  keyboard: state.audit.inputProbe.usedCodes.includes('KeyA'),
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass22-focused',
  category: 'focused actual-keyboard recovery-shaft traversal after helper placement at the Pass 20 exit',
  helperCoordinateMovement: true,
  actualKeyboardRoute: 'Pass 20 exit helper placement -> leftward handoff -> west step -> lower shelf -> Pass 22 checkpoint',
  failure,
  passed: !failure && Object.values(checks).every(Boolean),
  checks,
  visitedFloors,
  state,
  samples,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass22-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, failure, checks, visitedFloors, final: state.debug.player }, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
