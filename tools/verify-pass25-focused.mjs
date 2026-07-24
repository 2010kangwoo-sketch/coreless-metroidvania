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

const server = spawn('python3', ['-m', 'http.server', '4205'], { cwd: process.cwd(), stdio: 'ignore' });
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
await page.goto('http://127.0.0.1:4205/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(450);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

for (const key of ['a', 'd', 'Space', 'Shift', 'e', 'f']) {
  await page.keyboard.press(key);
  await page.waitForTimeout(45);
}

const views = [
  { id: 'entry', x: 5200, y: 2502 },
  { id: 'atrium', x: 7580, y: 1810 },
  { id: 'gallery', x: 8300, y: 1552 },
];
const states = [];
for (const view of views) {
  await page.evaluate(({ x, y }) => {
    const runtime = window.__corelessV2.runtime;
    Object.assign(runtime.player, {
      x, y, previousX: x, previousY: y, vx: 0, vy: 0,
      grounded: true, standingFloorId: null, standingPlatformId: null,
    });
    runtime.snapCamera();
  }, view);
  await page.waitForTimeout(120);
  await page.locator('#gameCanvas').screenshot({ path: `browser-artifacts/pass25-${view.id}.png` });
  states.push(await page.evaluate(() => window.__corelessV2.debug()));
}

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  Object.assign(runtime.progress, {
    pass07Completed: true,
    pass10Completed: true,
    pass11Completed: true,
    pass13Completed: true,
    pass14Completed: true,
    pass15Completed: true,
    pass18Completed: true,
    pass19Completed: true,
    pass20Completed: true,
    pass21Completed: true,
    pass22Completed: true,
    pass23Completed: true,
    movingPlatformCrossed: true,
    pass23PlatformCrossed: true,
    chaseEscaped: true,
    pass23PursuerEscaped: true,
    pass23GrappleChainCompleted: true,
    pass23SpringLanded: true,
    pass23CombatCleared: true,
  });
  runtime.pass24ObjectiveIdsSeen = new Set(window.__corelessV2.pass24.integration.objectives.map(item => item.id));
  runtime.updatePass24Integration();
  runtime.chase.triggered = true;
  runtime.chase.active = false;
  runtime.chase.sealed = true;
  runtime.chase.pathDistance = window.__corelessV2.pass15.chase.path.totalDistance;
  Object.assign(runtime.player, {
    x: 24256.94, y: 12046.61, previousX: 24256.94, previousY: 12046.61,
    vx: 0, vy: 0, grounded: true, standingFloorId: 'pass23_exit_slope', standingPlatformId: null,
  });
  runtime.snapCamera();
});
await page.waitForTimeout(120);
await page.screenshot({ path: 'browser-artifacts/pass25-exit.png', fullPage: true });

await page.keyboard.press('b');
await page.waitForTimeout(100);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass25-blueprint.png' });
await page.keyboard.press('b');
await page.waitForTimeout(80);

const resultData = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  validation: window.__corelessV2.pass25.validate(),
  visuals: window.__corelessV2.pass25.visuals,
  debug: window.__corelessV2.debug(),
}));
const usedCodes = resultData.audit.inputProbe.usedCodes;
const checks = {
  title: resultData.title === 'Coreless · Rebuild V2 · Pass 25',
  runtimeAudit: resultData.audit.passed && resultData.audit.passedCount === 34,
  visualAudit: resultData.validation.passed && resultData.validation.passedCount === 30,
  sevenLayers: resultData.visuals.layers.length === 7,
  monumentalSeal: resultData.visuals.monument.outerRadius >= 600 && resultData.visuals.monument.spokes === 12,
  denseArchitecture: resultData.visuals.farVaults.length === 13 && resultData.visuals.buttresses.length === 11,
  routeReadability: resultData.visuals.routeLanterns.length === 6 && resultData.visuals.lightShafts.length === 5,
  visualOnly: resultData.visuals.collisionChanges === 0,
  threeViews: states.length === 3 && states.every(state => state.camera.x >= 0 && state.camera.y >= 0),
  inputSurface: ['KeyA', 'KeyD', 'KeyE', 'KeyF', 'ShiftLeft', 'Space'].every(code => usedCodes.includes(code)),
  noReset: resultData.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass25-focused',
  category: 'focused visual-slice rendering and input-surface verification; helper placement is not a traversal claim',
  helperCoordinateMovement: true,
  passed: Object.values(checks).every(Boolean),
  checks,
  states,
  resultData,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass25-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks, audit: `${resultData.audit.passedCount}/${resultData.audit.total}`, visual: `${resultData.validation.passedCount}/${resultData.validation.total}` }, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
