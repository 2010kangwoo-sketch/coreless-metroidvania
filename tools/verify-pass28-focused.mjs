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

const server = spawn('python3', ['-m', 'http.server', '4211'], { cwd: process.cwd(), stdio: 'ignore' });
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
await page.goto('http://127.0.0.1:4211/index.html', { waitUntil: 'networkidle' });
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
  Object.assign(runtime.player, {
    x: 17000, y: 3537.4, previousX: 17000, previousY: 3537.4,
    vx: 0, vy: 0, grounded: false, dashFrames: 0, standingFloorId: null, standingPlatformId: null,
  });
  runtime.attackFrames = 0;
  runtime.snapCamera();
  runtime.__focusedDraw();
});
await page.waitForTimeout(80);
await page.screenshot({ path: 'browser-artifacts/pass28-foundry-integrated.png', fullPage: true });

await page.keyboard.press('b');
await page.evaluate(() => window.__corelessV2.runtime.__focusedDraw());
await page.waitForTimeout(60);
await page.screenshot({ path: 'browser-artifacts/pass28-blueprint.png', fullPage: true });
await page.keyboard.press('b');

const resultData = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  validation: window.__corelessV2.pass28.validate(),
  direction: window.__corelessV2.pass28.direction,
  layers: window.__corelessV2.pass28.layers,
  assets: window.__corelessV2.pass28.assets,
  assetState: {
    loadedCount: window.__corelessV2.pass28.assetState.loadedCount,
    failedCount: window.__corelessV2.pass28.assetState.failedCount,
    dimensionsValid: window.__corelessV2.pass28.assetState.dimensionsValid,
  },
  debug: window.__corelessV2.debug(),
}));
const usedCodes = resultData.audit.inputProbe.usedCodes;
const checks = {
  title: resultData.title === 'Coreless · Rebuild V2 · Pass 28',
  runtimeAudit: resultData.audit.passed && resultData.audit.passedCount === 39,
  artDirectionAudit: resultData.validation.passed && resultData.validation.passedCount === 38,
  assetLoaded: resultData.assetState.loadedCount === 1 && resultData.assetState.failedCount === 0,
  assetDimensions: resultData.assetState.dimensionsValid === true,
  fiveDepthLayers: resultData.layers.length === 5,
  pass30Gate: resultData.direction.qualityGate.approvalPass === 30,
  exactCollisionRetention: resultData.direction.collisionChanges === 0,
  rasterManifest: resultData.assets.length === 1 && resultData.assets[0].type === 'image/webp',
  inputSurface: ['KeyA', 'KeyD', 'KeyE', 'KeyF', 'ShiftLeft', 'Space'].every(code => usedCodes.includes(code)),
  noReset: resultData.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass28-focused',
  category: 'focused raster-art loading, in-engine quality-gate and exact collision-retention verification; helper placement is not a traversal claim',
  helperCoordinateMovement: true,
  passed: Object.values(checks).every(Boolean),
  checks,
  resultData,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass28-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks, audit: `${resultData.audit.passedCount}/${resultData.audit.total}`, artDirection: `${resultData.validation.passedCount}/${resultData.validation.total}` }, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
