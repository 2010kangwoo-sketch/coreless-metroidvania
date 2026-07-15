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

const server = spawn('python3', ['-m', 'http.server', '4193'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const executablePath = fs.existsSync('/tmp/coreless138/chromium') ? '/tmp/coreless138/chromium' : await chromium.executablePath();
const browser = await playwright.launch({ executablePath, args: chromium.args.filter(arg => arg !== '--single-process'), headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4193/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  runtime.progress.pass14Completed = true;
  runtime.progress.pass15Completed = true;
  runtime.progress.bridgeExitReached = true;
  runtime.progress.bridgeBoulderPlunged = true;
  runtime.progress.chaseEscaped = true;
  runtime.chase.active = false;
  runtime.chase.sealed = true;
  runtime.chase.pathDistance = window.__corelessV2.pass15.chase.path.totalDistance;
  Object.assign(runtime.player, {
    x: 25520, y: 9588, previousX: 25520, previousY: 9588,
    vx: 0, vy: 0, facing: 1, grounded: true, wallSide: 0,
    dashAvailable: true, dashFrames: 0, dashCooldown: 0,
    standingPlatformId: null, standingFloorId: 'pass18_entry_slope',
  });
  runtime.snapCamera();
});
await page.waitForTimeout(200);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass19-focused-entry.png' });

const floorEnds = new Map([
  ['pass18_entry_slope', 25740], ['pass18_narrow_01', 25980], ['pass18_narrow_02', 26210],
  ['pass18_narrow_03', 26435], ['pass18_narrow_04', 26665], ['pass18_narrow_05', 26900],
  ['pass18_narrow_06', 27140], ['pass18_narrow_07', 27380], ['pass18_narrow_08', 27625],
  ['pass18_narrow_09', 27875], ['pass18_narrow_10', 28140], ['pass18_narrow_11', 28420],
  ['pass18_narrow_12', 28715],
]);
const shortTakeoffs = new Set(['pass18_narrow_01', 'pass18_narrow_02']);
let jumpHeld = false;
let jumpStartFrame = 0;
let jumpSource = null;
let movingRight = true;
let failure = null;
const samples = [];
await page.keyboard.down('d');

for (let iteration = 0; iteration < 2600; iteration += 1) {
  const state = await page.evaluate(() => window.__corelessV2.debug());
  const p = state.player;
  if (iteration % 5 === 0) samples.push({
    iteration, frame: state.frameCount, x: p.x, y: p.y, vx: p.vx, vy: p.vy,
    grounded: p.grounded, floor: p.standingFloorId,
    landings: state.progress.pass18NarrowLandings,
    armed: state.progress.pass19FloorsArmed,
    collapsed: state.progress.pass19FloorsCollapsed,
    debrisBursts: state.progress.pass19DebrisBursts,
  });
  if (state.resetCount > 0) { failure = `reset at ${p.x.toFixed(1)},${p.y.toFixed(1)}`; break; }
  if (state.progress.pass19Completed) break;

  if (state.progress.pass18Completed && movingRight) {
    await page.keyboard.up('d');
    movingRight = false;
  }
  const edge = floorEnds.get(p.standingFloorId);
  if (!jumpHeld && p.grounded && edge && p.x + 34 >= edge - 24) {
    await page.keyboard.down('Space');
    jumpHeld = true;
    jumpStartFrame = state.frameCount;
    jumpSource = p.standingFloorId;
  }
  if (jumpHeld) {
    const holdFrames = shortTakeoffs.has(jumpSource) ? 4 : 13;
    if (state.frameCount - jumpStartFrame >= holdFrames) {
      await page.keyboard.up('Space');
      jumpHeld = false;
      jumpSource = null;
    }
  }
  await page.waitForTimeout(18);
}

if (jumpHeld) await page.keyboard.up('Space');
if (movingRight) await page.keyboard.up('d');
await page.waitForTimeout(500);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass19-focused-exit.png' });
await page.keyboard.press('b');
await page.waitForTimeout(150);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass19-focused-blueprint.png' });
await page.keyboard.press('b');
await page.waitForTimeout(150);

const state = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
  validation: window.__corelessV2.pass19.validate(),
}));
const checks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 19',
  runtimeAudit: state.audit.passed && state.audit.passedCount === 28,
  pass18Retained: state.audit.pass18.passed && state.audit.pass18.passedCount === 32,
  pass19Audit: state.validation.passed && state.validation.passedCount === 30,
  twelveLandings: state.debug.progress.pass18NarrowLandings === 12,
  allArmed: state.debug.progress.pass19FloorsArmed === 12,
  allCollapsed: state.debug.progress.pass19FloorsCollapsed === 12,
  allDebrisBursts: state.debug.progress.pass19DebrisBursts === 12,
  departureTriggered: state.debug.progress.pass19PeakPending >= 1,
  completed: state.debug.progress.pass19Completed && state.debug.progress.pass19CheckpointStabilized,
  noReset: state.debug.resetCount === 0,
  keyboard: ['KeyD', 'Space'].every(code => state.audit.inputProbe.usedCodes.includes(code)),
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass19-focused',
  category: 'focused actual-keyboard precision traversal and departure-triggered aftershock collapse after helper placement',
  helperCoordinateMovement: true,
  actualKeyboardRoute: 'pass 17 final landing -> twelve narrow platforms -> twelve collapses behind player -> stabilized lower checkpoint',
  failure,
  passed: !failure && Object.values(checks).every(Boolean),
  checks,
  state,
  samples,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass19-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
