import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4204'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const localChromium = ['/tmp/coreless138/chromium', '/tmp/chromium'].find(path => {
  try { return fs.statSync(path).size > 0; } catch { return false; }
});
const browser = await playwright.launch({
  executablePath: localChromium ?? await chromium.executablePath(),
  args: chromium.args,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1200, height: 680 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4204/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

const probe = await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  runtime.progress.pass11Completed = true;
  runtime.usedGrappleAnchorIds.add('probe_anchor');
  runtime.grapple.active = true;
  runtime.grapple.anchorId = 'probe_anchor';
  Object.assign(runtime.player, {
    x: 21400,
    y: 7030,
    previousX: 21400,
    previousY: 7030,
    vx: 0,
    vy: 4,
    grounded: false,
  });
  const contacted = runtime.checkDashSpikeContact();
  return {
    contacted,
    state: runtime.getDebugState(),
    audit: runtime.audit(),
    spike: window.__corelessV2.pass12.zone.spikeBed,
    corridor: window.__corelessV2.pass12.zone.boulderCorridor,
  };
});

const checks = {
  playerSpikeContactDetected: probe.contacted === true,
  exactlyOneReset: probe.state.resetCount === 1,
  resetReturnedToSpawn: probe.state.player.x === 600 && probe.state.player.y === 852,
  resetClearedGrapple: probe.state.grapple.active === false && probe.state.grapple.usedAnchorIds.length === 0,
  spikeIgnoredByBoulder: probe.spike.ignoredByBoulder === true,
  boulderCorridorCrossesSpikeBand: probe.corridor.points.some(point => point.x >= probe.spike.x1 && point.x <= probe.spike.x2),
  pass12Audit: probe.audit.pass12.passed === true && probe.audit.pass12.passedCount === 32,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass12-collision',
  category: 'deterministic collision probe with helper placement',
  passed: Object.values(checks).every(Boolean),
  checks,
  probe,
  consoleErrors,
  pageErrors,
  limitation: 'This helper collision probe is not a keyboard traversal and is not counted as a completion run.',
};
fs.mkdirSync('browser-artifacts', { recursive: true });
fs.writeFileSync('browser-artifacts/pass12-collision-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
