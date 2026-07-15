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

const server = spawn('python3', ['-m', 'http.server', '4189'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const executablePath = fs.existsSync('/tmp/coreless138/chromium') ? '/tmp/coreless138/chromium' : await chromium.executablePath();
const launchArgs = chromium.args.filter(arg => arg !== '--single-process');
const browser = await playwright.launch({ executablePath, args: launchArgs, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4189/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

const probe = await page.evaluate(() => {
  const api = window.__corelessV2;
  const audit = api.audit();
  const runtime = api.runtime;
  runtime.running = false;
  return {
    title: document.title,
    audit,
    artValidation: api.pass17.validate(),
    materials: api.pass17.materials.map(item => ({ zoneId: item.zoneId, type: item.type, capWidth: item.capWidth })),
    counts: {
      reinforcements: api.pass17.reinforcements.length,
      vegetation: api.pass17.vegetation.length,
      supports: api.pass17.supports.length,
      floors: api.pass15.level.floors.length,
      solids: api.pass15.level.solids.length,
    },
    rawCollisionOutlines: api.pass17.art.rawCollisionOutlines,
    depthLayers: [...api.pass17.art.depthLayers],
  };
});

const captures = [
  { name: 'upper', x: 5200, y: 1900, zoom: 0.48 },
  { name: 'industrial', x: 15400, y: 3350, zoom: 0.46 },
  { name: 'descent', x: 16600, y: 7700, zoom: 0.43 },
  { name: 'finale', x: 20500, y: 8800, zoom: 0.4 },
];
for (const capture of captures) {
  await page.evaluate(({ x, y, zoom }) => {
    const runtime = window.__corelessV2.runtime;
    runtime.camera = { x, y, zoom };
    runtime.draw();
  }, capture);
  await page.locator('#gameCanvas').screenshot({ path: `browser-artifacts/pass17-art-${capture.name}.png` });
}

const checks = {
  title: probe.title === 'Coreless · Rebuild V2 · Pass 17',
  runtimeAudit: probe.audit.passed && probe.audit.passedCount === 26,
  pass16Retained: probe.audit.pass16.passed && probe.audit.pass16.passedCount === 20,
  artAudit: probe.artValidation.passed && probe.artValidation.passedCount === 24,
  tenMaterials: probe.materials.length === 10 && new Set(probe.materials.map(item => item.type)).size === 10,
  structuralDetails: probe.counts.reinforcements === 30 && probe.counts.supports === 20,
  vegetation: probe.counts.vegetation === 12,
  rawCollisionHidden: probe.rawCollisionOutlines === false,
  depthLayers: probe.depthLayers.length === 5 && probe.depthLayers.at(-1) === 'route_readability',
  collisionRetained: probe.counts.floors === 120 && probe.counts.solids === 30,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass17-art',
  category: 'deterministic authored-terrain visual and retained-collision probe',
  passed: Object.values(checks).every(Boolean),
  checks,
  probe,
  consoleErrors,
  pageErrors,
  limitation: 'Camera placement is used only for four visual inspection captures and is not counted as traversal.',
};
fs.writeFileSync('browser-artifacts/pass17-art-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
