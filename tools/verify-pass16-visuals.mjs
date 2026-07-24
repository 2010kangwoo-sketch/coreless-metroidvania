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

const server = spawn('python3', ['-m', 'http.server', '4187'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const executablePath = fs.existsSync('/tmp/coreless138/chromium') ? '/tmp/coreless138/chromium' : await chromium.executablePath();
const browser = await playwright.launch({ executablePath, args: chromium.args, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4187/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

const probe = await page.evaluate(() => {
  const api = window.__corelessV2;
  const runtime = api.runtime;
  const audit = api.audit();
  runtime.running = false;
  const floorFingerprint = JSON.stringify(api.pass15.level.floors.map(item => [item.id, item.x1, item.y1, item.x2, item.y2, item.zone, item.phase]));
  const solidFingerprint = JSON.stringify(api.pass15.level.solids.map(item => [item.id, item.x, item.y, item.width, item.height, item.role]));
  return {
    title: document.title,
    audit,
    visualValidation: api.pass16.validate(),
    themes: api.pass16.themes.map(item => ({ zoneId: item.zoneId, motif: item.motif })),
    lightsByZone: Object.fromEntries(api.blueprint.zones.map(zone => [zone.id, api.pass16.lights.filter(light => light.zoneId === zone.id).length])),
    layerNames: [...api.pass16.visuals.layers],
    collisionDebugVisible: api.pass16.visuals.collisionDebugVisible,
    floorCount: api.pass15.level.floors.length,
    solidCount: api.pass15.level.solids.length,
    floorFingerprint,
    solidFingerprint,
  };
});

for (const view of [
  { name: 'upper', x: 5600, y: 2100, zoom: 0.42 },
  { name: 'middle', x: 17500, y: 5100, zoom: 0.4 },
  { name: 'finale', x: 20500, y: 8800, zoom: 0.4 },
]) {
  await page.evaluate(({ x, y, zoom }) => {
    const runtime = window.__corelessV2.runtime;
    runtime.camera = { x, y, zoom };
    runtime.draw();
  }, view);
  await page.locator('#gameCanvas').screenshot({ path: `browser-artifacts/pass16-visual-${view.name}.png` });
}

const checks = {
  title: probe.title === 'Coreless · Rebuild V2 · Pass 16',
  runtimeAudit: probe.audit.passed && probe.audit.passedCount === 25,
  pass15Retained: probe.audit.pass15.passed && probe.audit.pass15.passedCount === 29,
  visualAudit: probe.visualValidation.passed && probe.visualValidation.passedCount === 20,
  tenThemes: probe.themes.length === 10 && new Set(probe.themes.map(item => item.zoneId)).size === 10,
  uniqueMotifs: new Set(probe.themes.map(item => item.motif)).size === 10,
  lights: Object.values(probe.lightsByZone).every(count => count === 2),
  layers: JSON.stringify(probe.layerNames) === JSON.stringify(['far_silhouette', 'mid_architecture', 'route_lights', 'terrain_skin', 'actors']),
  collisionHidden: probe.collisionDebugVisible === false,
  collisionRetained: probe.floorCount === 120 && probe.solidCount === 30 && probe.floorFingerprint.length > 1000 && probe.solidFingerprint.length > 100,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass16-visuals',
  category: 'deterministic visual-layer and retained-collision probe',
  passed: Object.values(checks).every(Boolean),
  checks,
  probe,
  consoleErrors,
  pageErrors,
  limitation: 'Camera placement is used only to inspect the three visual overview captures; it is not a traversal result.',
};
fs.writeFileSync('browser-artifacts/pass16-visual-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
