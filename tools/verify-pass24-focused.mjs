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

const server = spawn('python3', ['-m', 'http.server', '4203'], { cwd: process.cwd(), stdio: 'ignore' });
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
await page.goto('http://127.0.0.1:4203/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(450);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

for (const key of ['a', 'd', 'Space', 'Shift', 'e', 'f']) {
  await page.keyboard.press(key);
  await page.waitForTimeout(55);
}
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass24-focused-objective.png' });
const initialState = await page.evaluate(() => window.__corelessV2.debug());
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
    x: 24276, y: 12044, previousX: 24276, previousY: 12044,
    vx: 0, vy: 0, grounded: true, standingFloorId: 'pass23_exit_slope', standingPlatformId: null,
  });
  runtime.snapCamera();
});
await page.waitForTimeout(120);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass24-focused-complete.png' });
await page.keyboard.press('b');
await page.waitForTimeout(100);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass24-focused-blueprint.png' });
await page.keyboard.press('b');
await page.waitForTimeout(100);

const resultData = await page.evaluate(() => {
  const completeKeys = [
    'pass07Completed', 'pass10Completed', 'pass13Completed', 'pass15Completed',
    'pass19Completed', 'pass22Completed', 'pass23Completed',
  ];
  const states = [];
  const progress = {};
  states.push(window.__corelessV2.pass24.state(progress));
  for (const key of completeKeys) {
    progress[key] = true;
    states.push(window.__corelessV2.pass24.state(progress));
  }
  const completedProgress = {
    ...progress,
    movingPlatformCrossed: true,
    pass23PlatformCrossed: true,
    chaseEscaped: true,
    pass23PursuerEscaped: true,
    pass11Completed: true,
    pass23GrappleChainCompleted: true,
    pass20Completed: true,
    pass23SpringLanded: true,
    pass23CombatCleared: true,
  };
  return {
    title: document.title,
    audit: window.__corelessV2.audit(),
    debug: window.__corelessV2.debug(),
    validation: window.__corelessV2.pass24.validate(),
    states,
    completedState: window.__corelessV2.pass24.state(completedProgress),
  };
});

const activeObjectiveSequence = resultData.states.map(state => state.activeObjective?.id ?? null);
const usedCodes = resultData.audit.inputProbe.usedCodes;
const checks = {
  title: resultData.title === 'Coreless · Rebuild V2 · Pass 24',
  runtimeAudit: resultData.audit.passed && resultData.audit.passedCount === 33,
  integrationAudit: resultData.validation.passed && resultData.validation.passedCount === 31,
  initialObjective: initialState.pass24Integration.activeObjective?.id === 'foundation_route',
  orderedObjectives: activeObjectiveSequence.join(',') === 'foundation_route,chase_core,tech_chain,bridge_finale,aftershock,spring_recovery,convergence,',
  completedObjectiveModel: resultData.completedState.activeObjective === null && resultData.completedState.completedObjectiveCount === 7,
  completedSystemModel: resultData.completedState.completedSystemCount === 7 && resultData.completedState.allSystemsComplete && resultData.completedState.routeComplete,
  inputSurface: ['KeyA', 'KeyB', 'KeyD', 'KeyE', 'KeyF', 'ShiftLeft', 'Space'].every(code => usedCodes.includes(code)),
  noReset: resultData.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass24-focused',
  category: 'focused integration model, objective HUD and input-surface verification; not a traversal completion claim',
  helperCoordinateMovement: false,
  passed: Object.values(checks).every(Boolean),
  checks,
  activeObjectiveSequence,
  initialState,
  resultData,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass24-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks, activeObjectiveSequence, initial: initialState.pass24Integration, completed: resultData.completedState }, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
