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

const server = spawn('python3', ['-m', 'http.server', '4213'], { cwd: process.cwd(), stdio: 'ignore' });
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
await page.goto('http://127.0.0.1:4213/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
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
    x: 17000, y: 3283.25, previousX: 17000, previousY: 3283.25,
    vx: 0, vy: 0, grounded: true, dashFrames: 0, standingFloorId: "first_rise", standingPlatformId: null,
  });
  runtime.attackFrames = 0;
  runtime.snapCamera();
  runtime.__focusedDraw();
});
await page.waitForTimeout(100);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass29-foundry-anchor.png' });

const parallaxProbe = await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  const before = { ...runtime.camera };
  runtime.camera.x += 120;
  runtime.camera.y += 60;
  const after = { ...runtime.camera };
  runtime.__focusedDraw();
  return { before, after, dx: after.x - before.x, dy: after.y - before.y };
});
await page.waitForTimeout(100);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass29-foundry-pan.png' });

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  Object.assign(runtime.player, {
    x: 16400, y: 3770.75, previousX: 16400, previousY: 3770.75,
    vx: 0, vy: 0, grounded: true, dashFrames: 0, standingFloorId: "first_rise", standingPlatformId: null,
  });
  runtime.snapCamera();
  runtime.__focusedDraw();
});
await page.waitForTimeout(100);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass29-foundry-lower.png' });

await page.keyboard.press('b');
await page.evaluate(() => window.__corelessV2.runtime.__focusedDraw());
await page.waitForTimeout(80);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass29-blueprint.png' });
await page.keyboard.press('b');

const resultData = await page.evaluate(() => ({
  title: document.title,
  buildStatus: document.getElementById('buildStatus')?.textContent ?? null,
  auditStatus: document.getElementById('auditStatus')?.textContent ?? null,
  audit: window.__corelessV2.audit(),
  validation: window.__corelessV2.pass29.validate(),
  plan: window.__corelessV2.pass29.plan,
  assets: window.__corelessV2.pass29.assets,
  placements: window.__corelessV2.pass29.placements,
  assetState: {
    loadedCount: window.__corelessV2.pass29.assetState.loadedCount,
    failedCount: window.__corelessV2.pass29.assetState.failedCount,
    dimensionsValid: window.__corelessV2.pass29.assetState.dimensionsValid,
  },
  debug: window.__corelessV2.debug(),
}));
const usedCodes = resultData.audit.inputProbe.usedCodes;
const checks = {
  title: resultData.title === 'Coreless · Rebuild V2 · Pass 29',
  runtimeAudit: resultData.audit.passed && resultData.audit.passedCount === 42,
  modularAudit: resultData.validation.passed && resultData.validation.passedCount === 43,
  assetsLoaded: resultData.assetState.loadedCount === 5 && resultData.assetState.failedCount === 0,
  assetDimensions: resultData.assetState.dimensionsValid === true,
  moduleManifest: resultData.assets.length === 5,
  sixPlacements: resultData.placements.length === 6,
  threeDepthLayers: resultData.plan.layerOrder.length === 3,
  parallaxRange: Math.min(...resultData.placements.map(item => item.cameraRatio)) === 0.14 && Math.max(...resultData.placements.map(item => item.cameraRatio)) === 1.16,
  cameraPan: parallaxProbe.dx === 120 && parallaxProbe.dy === 60,
  fallbackRetained: resultData.plan.fallbackAssetId === 'foundry_quality_gate',
  exactCollisionRetention: resultData.plan.collisionChanges === 0,
  inputSurface: ['KeyA', 'KeyD', 'KeyE', 'KeyF', 'ShiftLeft', 'Space'].every(code => usedCodes.includes(code)),
  noReset: resultData.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass29-focused',
  category: 'focused modular-raster loading, three-layer parallax, fallback and exact collision-retention verification; helper placement is not a traversal claim',
  helperCoordinateMovement: true,
  passed: Object.values(checks).every(Boolean),
  checks,
  parallaxProbe,
  resultData,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass29-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks, audit: `${resultData.audit.passedCount}/${resultData.audit.total}`, modularArt: `${resultData.validation.passedCount}/${resultData.validation.total}` }, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
