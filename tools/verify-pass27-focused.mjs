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

const server = spawn('python3', ['-m', 'http.server', '4209'], { cwd: process.cwd(), stdio: 'ignore' });
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
await page.goto('http://127.0.0.1:4209/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(450);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

for (const key of ['a', 'd', 'Space', 'Shift', 'e', 'f']) {
  await page.keyboard.press(key);
  await page.waitForTimeout(45);
}
await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  runtime.__focusedDraw = runtime.draw.bind(runtime);
  runtime.draw = () => {};
});

const views = [
  { id: 'start-gate', x: 1500, y: 992 },
  { id: 'buried-crown', x: 7580, y: 1810 },
  { id: 'foundry', x: 17000, y: 3500 },
  { id: 'curve-aqueduct', x: 23500, y: 5100 },
  { id: 'descent-spines', x: 18000, y: 8050 },
  { id: 'bridge-pylons', x: 22500, y: 9272 },
  { id: 'spring-frames', x: 31800, y: 10830 },
  { id: 'late-nave', x: 27000, y: 11882 },
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
    runtime.__focusedDraw();
  }, view);
  await page.waitForTimeout(50);
  await page.screenshot({ path: `browser-artifacts/pass27-${view.id}.png`, fullPage: true });
  states.push(await page.evaluate(() => window.__corelessV2.debug()));
}

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  const completedKeys = [
    'pass07Completed', 'pass10Completed', 'pass11Completed', 'pass13Completed', 'pass15Completed',
    'pass19Completed', 'pass20Completed', 'pass22Completed', 'pass23Completed',
    'movingPlatformCrossed', 'pass23PlatformCrossed', 'chaseEscaped', 'pass23PursuerEscaped',
    'pass23GrappleChainCompleted', 'pass23SpringLanded', 'pass23CombatCleared',
  ];
  for (const key of completedKeys) runtime.progress[key] = true;
  runtime.progress.pass24IntegratedCompleted = true;
  Object.assign(runtime.player, {
    x: 24267.5, y: 12045.55, previousX: 24267.5, previousY: 12045.55,
    vx: 0, vy: 0, grounded: true, standingFloorId: 'pass23_exit_slope', standingPlatformId: null,
  });
  runtime.snapCamera();
  runtime.__focusedDraw();
});
await page.waitForTimeout(50);
await page.screenshot({ path: 'browser-artifacts/pass27-exit-focused.png', fullPage: true });

await page.keyboard.press('b');
await page.evaluate(() => window.__corelessV2.runtime.__focusedDraw());
await page.waitForTimeout(50);
await page.screenshot({ path: 'browser-artifacts/pass27-blueprint.png', fullPage: true });
await page.keyboard.press('b');
await page.waitForTimeout(50);

const resultData = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  validation: window.__corelessV2.pass27.validate(),
  structures: window.__corelessV2.pass27.structures,
  debug: window.__corelessV2.debug(),
}));
const usedCodes = resultData.audit.inputProbe.usedCodes;
const checks = {
  title: resultData.title === 'Coreless · Rebuild V2 · Pass 27',
  runtimeAudit: resultData.audit.passed && resultData.audit.passedCount === 36,
  structureAudit: resultData.validation.passed && resultData.validation.passedCount === 36,
  fourteenScenes: resultData.structures.scenes.length === 14,
  twentyEightLandmarks: resultData.structures.structures.length === 28,
  monumentalScale: Math.max(...resultData.structures.structures.map(item => item.width)) >= 4900,
  descentSpines: resultData.structures.structures.filter(item => item.kind === 'descent_spine').length === 3,
  exactCollisionRetention: resultData.structures.collisionChanges === 0,
  eightViews: states.length === 8 && states.every(state => state.camera.x >= 0 && state.camera.y >= 0),
  inputSurface: ['KeyA', 'KeyD', 'KeyE', 'KeyF', 'ShiftLeft', 'Space'].every(code => usedCodes.includes(code)),
  noReset: resultData.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass27-focused',
  category: 'focused monumental structure scale and route-framing verification; helper placement is not a traversal claim',
  helperCoordinateMovement: true,
  passed: Object.values(checks).every(Boolean),
  checks,
  states,
  resultData,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass27-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks, audit: `${resultData.audit.passedCount}/${resultData.audit.total}`, structures: `${resultData.validation.passedCount}/${resultData.validation.total}` }, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
