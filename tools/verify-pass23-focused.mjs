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

const server = spawn('python3', ['-m', 'http.server', '4201'], { cwd: process.cwd(), stdio: 'ignore' });
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
await page.goto('http://127.0.0.1:4201/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });

await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  Object.assign(runtime.progress, {
    pass10Completed: true, grappleAnchorOneUsed: true, grappleAnchorTwoUsed: true, grappleAnchorThreeUsed: true,
    grappleChainCompleted: true, pass11Completed: true, pass12Completed: true, pass13Completed: true,
    pass14Completed: true, pass15Completed: true, pass18Completed: true, pass19Completed: true,
    pass20Completed: true, pass21Completed: true, pass22Entered: true, pass22FirstLanding: true,
    pass22SecondLanding: true, pass22ExitReached: true, pass22Completed: true,
    grappleAttaches: 3, grappleReleases: 3, grappleUniqueAnchors: 3,
  });
  runtime.usedGrappleAnchorIds = new Set(window.__corelessV2.pass11.zone.anchors.map(item => item.id));
  runtime.chase.active = false;
  runtime.chase.sealed = true;
  const platform = runtime.movingPlatforms.find(item => item.id === 'pass23_chase_carriage');
  platform.x = platform.xMax;
  platform.previousX = platform.x;
  platform.direction = -1;
  Object.assign(runtime.player, {
    x: 29140, y: 11832, previousX: 29140, previousY: 11832,
    vx: 0, vy: 0, facing: -1, grounded: true, wallSide: 0,
    dashAvailable: true, dashFrames: 0, dashCooldown: 0,
    grappleLaunchFrames: 0, springLaunchFrames: 0,
    standingPlatformId: null, standingFloorId: 'pass23_entry_shelf',
  });
  runtime.snapCamera();
});

await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass23-focused-entry.png' });
const zone = await page.evaluate(() => window.__corelessV2.pass23.zone);
let heldDirection = null;
const setDirection = async direction => {
  if (heldDirection === direction) return;
  if (heldDirection) await page.keyboard.up(heldDirection);
  heldDirection = direction;
  if (heldDirection) await page.keyboard.down(heldDirection);
};

let traversalFailure = null;
let dashGapUsed = false;
let jumpHeld = false;
let jumpStartFrame = 0;
let mixedScreenshotTaken = false;
const samples = [];
for (let iteration = 0; iteration < 2400; iteration += 1) {
  const state = await page.evaluate(() => window.__corelessV2.debug());
  const p = state.player;
  if (iteration % 5 === 0) samples.push({ iteration, frame: state.frameCount, x: p.x, y: p.y, floor: p.standingFloorId, platform: p.standingPlatformId, enemies: state.progress.pass23EnemyDefeats, anchors: state.progress.pass23GrappleAttaches, spring: state.progress.pass23SpringLaunched, pursuer: state.pass23Pursuer.active, pursuerGap: state.pass23Pursuer.minimumGap });
  if (!mixedScreenshotTaken && state.progress.pass23PlatformBoarded && state.progress.pass23PursuerStarted) {
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass23-focused-mixed.png' });
    mixedScreenshotTaken = true;
  }
  if (state.resetCount > 0) {
    traversalFailure = `reset at ${p.x.toFixed(1)},${p.y.toFixed(1)} floor=${p.standingFloorId ?? 'none'}`;
    break;
  }
  if (state.progress.pass23Completed) break;

  const aliveEnemies = state.pass23Enemies.filter(item => !item.defeated);
  const enemyData = zone.enemies.find(item => item.id === aliveEnemies[0]?.id);
  const centerX = p.x + 17;
  if (enemyData && Math.abs(enemyData.x - centerX) <= 200) await page.keyboard.press('f');

  if (state.grapple.active) {
    await setDirection('a');
    const releaseReady = state.grapple.anchorId === 'pass23_anchor_four'
      ? (p.x <= 26730 && p.vx < 0) || state.grapple.attachedFrames >= 110
      : (p.x <= 26080 && p.vy >= -1) || state.grapple.attachedFrames >= 90;
    if (releaseReady) await page.keyboard.press('e');
  } else {
    const expectedAnchor = zone.anchors.find(item => item.order === state.grapple.usedAnchorIds.length + 1);
    const distance = expectedAnchor ? Math.hypot(expectedAnchor.x - centerX, expectedAnchor.y - (p.y + 24)) : Number.POSITIVE_INFINITY;
    if (expectedAnchor && state.grapple.cooldown === 0 && distance <= expectedAnchor.attachRadius) await page.keyboard.press('e');
    const carriage = state.movingPlatforms.find(item => item.id === 'pass23_chase_carriage');
    const waitingForCarriage = !state.progress.pass23PlatformBoarded && p.grounded && p.standingFloorId === 'pass23_platform_departure' && p.x <= 28340 && carriage?.x < 28120;
    const ridingCarriage = state.progress.pass23PlatformBoarded && !state.progress.pass23PlatformCrossed && p.standingPlatformId === 'pass23_chase_carriage' && carriage?.x > 27580;
    await setDirection(waitingForCarriage || ridingCarriage ? null : 'a');
  }

  if (!dashGapUsed && state.progress.pass23GrappleChainCompleted && p.grounded && p.standingFloorId === 'pass23_anchor_landing' && p.x <= 26090) {
    await page.keyboard.down('Space');
    jumpHeld = true;
    jumpStartFrame = state.frameCount;
  }
  if (jumpHeld && !dashGapUsed && state.frameCount - jumpStartFrame >= 5) {
    await page.keyboard.press('Shift');
    dashGapUsed = true;
  }
  if (jumpHeld && state.frameCount - jumpStartFrame >= 14) {
    await page.keyboard.up('Space');
    jumpHeld = false;
  }
  await page.waitForTimeout(18);
}

if (jumpHeld) await page.keyboard.up('Space');
await setDirection(null);
await page.waitForTimeout(220);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass23-focused-exit.png' });
await page.keyboard.press('b');
await page.waitForTimeout(100);
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass23-focused-blueprint.png' });
await page.keyboard.press('b');

const state = await page.evaluate(() => ({
  title: document.title,
  audit: window.__corelessV2.audit(),
  debug: window.__corelessV2.debug(),
  validation: window.__corelessV2.pass23.validate(),
}));
const usedCodes = state.audit.inputProbe.usedCodes;
const checks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 23',
  runtimeAudit: state.audit.passed && state.audit.passedCount === 32,
  pass23Audit: state.validation.passed && state.validation.passedCount === 24,
  platform: state.debug.progress.pass23PlatformBoarded && state.debug.progress.pass23PlatformCrossed && state.debug.progress.pass23PlatformRides === 1,
  combat: state.debug.progress.pass23CombatCleared && state.debug.progress.pass23EnemyDefeats === 2 && state.debug.pass23Enemies.every(item => item.defeated),
  grapple: state.debug.progress.pass23AnchorFourUsed && state.debug.progress.pass23AnchorFiveUsed && state.debug.progress.pass23GrappleChainCompleted && state.debug.progress.pass23GrappleAttaches === 2 && state.debug.progress.pass23GrappleReleases === 2,
  spring: state.debug.progress.pass23SpringLaunched && state.debug.progress.pass23SpringLanded && state.debug.progress.pass23SpringLaunches === 1 && state.debug.progress.pass23SpringLandings === 1,
  pursuit: state.debug.progress.pass23PursuerStarted && state.debug.progress.pass23PursuerActiveFrames >= 100 && state.debug.progress.pass23PursuerContacts === 0 && state.debug.progress.pass23PursuerEscaped,
  completed: state.debug.progress.pass23ExitReached && state.debug.progress.pass23Completed,
  keyboard: ['KeyA', 'KeyE', 'KeyF'].every(code => usedCodes.includes(code)),
  noReset: state.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass23-focused',
  category: 'focused actual-keyboard mixed traversal after helper placement at the Pass 22 exit',
  helperCoordinateMovement: true,
  actualKeyboardRoute: 'Pass 22 exit helper placement -> moving carriage -> two sentinels -> anchors four/five -> left spring -> late checkpoint',
  traversalFailure,
  mixedScreenshotTaken,
  passed: !traversalFailure && Object.values(checks).every(Boolean),
  checks,
  state,
  samples,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass23-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, traversalFailure, checks, final: state.debug.player, progress: state.debug.progress, pursuer: state.debug.pass23Pursuer }, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
