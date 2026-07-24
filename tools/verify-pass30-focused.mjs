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

const server = spawn('python3', ['-m', 'http.server', '4215'], { cwd: process.cwd(), stdio: 'ignore' });
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
await page.goto('http://127.0.0.1:4215/index.html', { waitUntil: 'networkidle' });
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
  runtime.attackFrames = 0;
});

const sampleMetrics = [];
const samples = await page.evaluate(() => window.__corelessV2.pass30.cameraSamples);
for (const sample of samples) {
  const metrics = await page.evaluate(sampleData => {
    const runtime = window.__corelessV2.runtime;
    Object.assign(runtime.player, {
      x: sampleData.playerX,
      y: sampleData.playerY,
      previousX: sampleData.playerX,
      previousY: sampleData.playerY,
      vx: 0,
      vy: 0,
      grounded: true,
      dashFrames: 0,
      standingFloorId: sampleData.id,
      standingPlatformId: null,
    });
    Object.assign(runtime.camera, { x: sampleData.cameraX, y: sampleData.cameraY, zoom: 1 });
    runtime.__focusedDraw();

    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const at = (x, y) => {
      const index = (y * pixels.width + x) * 4;
      return [pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]];
    };
    const linear = value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };
    const luminance = color => 0.2126 * linear(color[0]) + 0.7152 * linear(color[1]) + 0.0722 * linear(color[2]);
    const meanLuminance = colors => colors.reduce((sum, color) => sum + luminance(color), 0) / colors.length;

    const playerPixels = [];
    for (let y = 281; y < 297; y += 1) for (let x = 320; x < 334; x += 1) playerPixels.push(at(x, y));
    const backgroundPixels = [];
    for (let y = 238; y < 322; y += 3) {
      for (let x = 286; x < 366; x += 3) {
        if (x >= 305 && x <= 345 && y >= 247 && y <= 312) continue;
        backgroundPixels.push(at(x, y));
      }
    }
    const playerLuminance = meanLuminance(playerPixels);
    const backgroundLuminance = meanLuminance(backgroundPixels);
    const contrastRatio = (Math.max(playerLuminance, backgroundLuminance) + 0.05) / (Math.min(playerLuminance, backgroundLuminance) + 0.05);

    const placeholderColors = [
      [31, 52, 58], [136, 170, 176], [23, 49, 57], [16, 35, 42], [69, 111, 119],
    ];
    let placeholderPixels = 0;
    let measuredPixels = 0;
    for (let y = 120; y < 640; y += 2) {
      for (let x = 0; x < 1200; x += 2) {
        const color = at(x, y);
        if (placeholderColors.some(target => Math.abs(color[0] - target[0]) <= 2 && Math.abs(color[1] - target[1]) <= 2 && Math.abs(color[2] - target[2]) <= 2)) placeholderPixels += 1;
        measuredPixels += 1;
      }
    }
    const flatPlaceholderCoverage = placeholderPixels / measuredPixels;

    let visibleSeamColumns = 0;
    let maximumAdjacentColumnDifference = 0;
    for (let x = 1; x < 1200; x += 1) {
      let difference = 0;
      let count = 0;
      for (let y = 120; y < 640; y += 4) {
        const left = at(x - 1, y);
        const right = at(x, y);
        difference += (Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) + Math.abs(left[2] - right[2])) / 3;
        count += 1;
      }
      const meanDifference = difference / count;
      maximumAdjacentColumnDifference = Math.max(maximumAdjacentColumnDifference, meanDifference);
      if (meanDifference > 45) visibleSeamColumns += 1;
    }
    return {
      id: sampleData.id,
      camera: { x: runtime.camera.x, y: runtime.camera.y },
      player: { x: runtime.player.x, y: runtime.player.y },
      contrastRatio,
      playerLuminance,
      backgroundLuminance,
      flatPlaceholderCoverage,
      visibleSeamColumns,
      maximumAdjacentColumnDifference,
    };
  }, sample);
  sampleMetrics.push(metrics);
  await page.waitForTimeout(80);
  await page.locator('#gameCanvas').screenshot({ path: `browser-artifacts/pass30-sweep-${sample.id}.png` });
}

await page.keyboard.press('b');
await page.evaluate(() => window.__corelessV2.runtime.__focusedDraw());
await page.waitForTimeout(80);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass30-blueprint.png' });
await page.keyboard.press('b');

const resultData = await page.evaluate(() => ({
  title: document.title,
  buildStatus: document.getElementById('buildStatus')?.textContent ?? null,
  auditStatus: document.getElementById('auditStatus')?.textContent ?? null,
  audit: window.__corelessV2.audit(),
  validation: window.__corelessV2.pass30.validate(),
  gate: window.__corelessV2.pass30.gate,
  pass29AssetState: {
    loadedCount: window.__corelessV2.pass29.assetState.loadedCount,
    failedCount: window.__corelessV2.pass29.assetState.failedCount,
    dimensionsValid: window.__corelessV2.pass29.assetState.dimensionsValid,
  },
  debug: window.__corelessV2.debug(),
}));
const minimumContrast = Math.min(...sampleMetrics.map(item => item.contrastRatio));
const maximumFlatCoverage = Math.max(...sampleMetrics.map(item => item.flatPlaceholderCoverage));
const totalVisibleSeamColumns = sampleMetrics.reduce((sum, item) => sum + item.visibleSeamColumns, 0);
const usedCodes = resultData.audit.inputProbe.usedCodes;
const checks = {
  title: resultData.title === 'Coreless · Rebuild V2 · Pass 30',
  runtimeAudit: resultData.audit.passed && resultData.audit.passedCount === 45,
  qualityGateAudit: resultData.validation.passed && resultData.validation.passedCount === 41,
  representativeApproved: resultData.gate.representativeSliceApproved === true,
  explicitScope: resultData.gate.approvalScope === 'representative_foundry_slice_only',
  assetsLoaded: resultData.pass29AssetState.loadedCount === 5 && resultData.pass29AssetState.failedCount === 0,
  assetDimensions: resultData.pass29AssetState.dimensionsValid === true,
  fiveCameraSamples: sampleMetrics.length === 5,
  noVisibleSeams: totalVisibleSeamColumns <= resultData.gate.thresholds.visibleSeamColumnsAllowed,
  surfaceAlignment: resultData.validation.surfaceAlignment <= resultData.gate.thresholds.surfaceAlignmentTolerancePx,
  noForegroundOverlap: resultData.validation.foreground.every(item => item.overlapCount <= resultData.gate.thresholds.foregroundPlayerOverlapAllowed),
  playerContrast: minimumContrast >= resultData.gate.thresholds.minimumPlayerContrastRatio,
  flatPlaceholderCoverage: maximumFlatCoverage <= resultData.gate.thresholds.maximumFlatPlaceholderCoverage,
  exactCollisionRetention: resultData.gate.collisionChanges === 0,
  inputSurface: ['KeyA', 'KeyD', 'KeyE', 'KeyF', 'ShiftLeft', 'Space'].every(code => usedCodes.includes(code)),
  noReset: resultData.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass30-focused',
  category: 'representative foundry raster approval across five camera samples; helper placement is not a traversal claim',
  helperCoordinateMovement: true,
  passed: Object.values(checks).every(Boolean),
  checks,
  measurements: { minimumContrast, maximumFlatCoverage, totalVisibleSeamColumns, sampleMetrics },
  resultData,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass30-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks, measurements: result.measurements, audit: `${resultData.audit.passedCount}/${resultData.audit.total}`, qualityGate: `${resultData.validation.passedCount}/${resultData.validation.total}` }, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
