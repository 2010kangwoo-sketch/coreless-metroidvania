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

const server = spawn('python3', ['-m', 'http.server', '4197'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(resolve => setTimeout(resolve, 800));
const executablePath = fs.existsSync('/tmp/coreless138/chromium') ? '/tmp/coreless138/chromium' : await chromium.executablePath();
const launchArgs = chromium.args.filter(arg => (
  arg !== '--single-process'
  && arg !== '--in-process-gpu'
  && arg !== '--ignore-gpu-blocklist'
  && !arg.startsWith('--use-gl=')
  && !arg.startsWith('--use-angle=')
  && arg !== '--enable-unsafe-swiftshader'
));
launchArgs.push('--disable-gpu');

const browser = await playwright.launch({ executablePath, args: launchArgs, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(String(error)));
await page.goto('http://127.0.0.1:4197/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
fs.mkdirSync('browser-artifacts', { recursive: true });

const pacingResult = await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  const pacing = window.__corelessV2.pass21.pacing;
  const initialAudit = runtime.audit();
  runtime.running = false;
  cancelAnimationFrame(runtime.frameHandle);
  runtime.frameHandle = 0;

  const sampleBand = (lead, frames, startingSpeed) => {
    runtime.chase.leadDistance = lead;
    runtime.chase.speed = startingSpeed;
    runtime.chase.basePacedSpeed = startingSpeed;
    runtime.chase.destructionSlowdownFrames = 0;
    const speeds = [];
    for (let frame = 0; frame < frames; frame += 1) {
      runtime.updatePass21PacingSpeed();
      speeds.push(runtime.chase.speed);
    }
    return { lead, speeds, finalSpeed: runtime.chase.speed, targetSpeed: runtime.chase.targetSpeed };
  };

  const safety = sampleBand(pacing.lead.safety - 100, 32, pacing.speed.maximum);
  const cruise = sampleBand(pacing.lead.target, 110, pacing.speed.minimum);
  const catchup = sampleBand(pacing.lead.maximum + 600, 190, pacing.speed.minimum);
  runtime.chase.leadDistance = pacing.lead.maximum + 100;
  const skippedBefore = runtime.progress.pass21AdaptivePauseFramesSkipped;
  const adaptivePauseRemaining = runtime.updatePass21PauseFrames(100);
  const adaptivePauseSkipped = runtime.progress.pass21AdaptivePauseFramesSkipped - skippedBefore;

  runtime.chase.leadDistance = pacing.lead.catchup;
  runtime.chase.speed = pacing.speed.catchup;
  runtime.chase.basePacedSpeed = pacing.speed.catchup;
  runtime.triggerPass21DestructionSlowdown(4);
  const slowdown = [];
  for (let frame = 0; frame < pacing.destruction.maximumSlowdownFrames + 12; frame += 1) {
    runtime.updatePass21PacingSpeed();
    slowdown.push({ frame, speed: runtime.chase.speed, remaining: runtime.chase.destructionSlowdownFrames });
  }

  const chasePath = window.__corelessV2.pass15.chase.path;
  const locate = distance => {
    let index = 0;
    while (index < chasePath.cumulativeDistances.length - 2 && chasePath.cumulativeDistances[index + 1] < distance) index += 1;
    const start = chasePath.points[index];
    const end = chasePath.points[index + 1];
    const startDistance = chasePath.cumulativeDistances[index];
    const segmentLength = Math.max(1, chasePath.cumulativeDistances[index + 1] - startDistance);
    const ratio = Math.max(0, Math.min(1, (distance - startDistance) / segmentLength));
    return { index, x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
  };
  const supports = window.__corelessV2.pass15.chase.supportTargets;
  const targetSupport = supports[8];
  runtime.destroyedSupportIds = new Set(supports.slice(0, 8).map(item => item.id));
  runtime.progress.supportsDestroyed = 8;
  runtime.progress.pass21DestructionSlowdowns = 0;
  runtime.progress.pass21StructuresSlowed = 0;
  runtime.chase.triggered = true;
  runtime.chase.active = true;
  runtime.chase.sealed = false;
  runtime.chase.delayFrames = 0;
  runtime.chase.breachComplete = true;
  runtime.chase.internalBreakpointIndex = window.__corelessV2.pass15.chase.boulder.internalBreakpoints?.length ?? 0;
  runtime.chase.pass14HeadStartFrames = 0;
  runtime.chase.pass15HeadStartFrames = 0;
  runtime.chase.pathDistance = targetSupport.triggerDistance + window.__corelessV2.pass15.chase.boulder.supportBreakLag - 2;
  runtime.chase.speed = pacing.speed.cruise;
  runtime.chase.basePacedSpeed = pacing.speed.cruise;
  runtime.chase.destructionSlowdownFrames = 0;
  runtime.updateBoulderPosition();
  const playerDistance = Math.min(chasePath.totalDistance - 100, runtime.chase.pathDistance + pacing.lead.target);
  const playerPoint = locate(playerDistance);
  Object.assign(runtime.player, {
    x: playerPoint.x - 17,
    y: playerPoint.y - 24,
    previousX: playerPoint.x - 17,
    previousY: playerPoint.y - 24,
    vx: 0,
    vy: 0,
    grounded: false,
    standingFloorId: null,
  });
  runtime.chase.playerPathDistance = playerDistance;
  runtime.chase.playerPathIndex = playerPoint.index;
  runtime.chase.leadDistance = playerDistance - runtime.chase.pathDistance;
  runtime.updateBoulder();
  runtime.snapCamera();
  runtime.context.setTransform(1, 0, 0, 1, 0, 0);
  runtime.context.globalAlpha = 1;
  runtime.draw();

  return {
    safety,
    cruise,
    catchup,
    adaptivePauseRemaining,
    adaptivePauseSkipped,
    slowdown,
    linkedSupport: {
      id: targetSupport.id,
      destroyed: runtime.destroyedSupportIds.has(targetSupport.id),
      events: runtime.progress.pass21DestructionSlowdowns,
      structures: runtime.progress.pass21StructuresSlowed,
      remainingFrames: runtime.chase.destructionSlowdownFrames,
    },
    validation: window.__corelessV2.pass21.validate(),
    audit: initialAudit,
    debug: runtime.getDebugState(),
  };
});

await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass21-focused-pacing.png' });
await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  runtime.context.setTransform(1, 0, 0, 1, 0, 0);
  runtime.context.globalAlpha = 1;
  runtime.blueprintVisible = true;
  runtime.draw();
});
await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass21-focused-blueprint.png' });

const slowdownSpeeds = pacingResult.slowdown.map(item => item.speed);
const checks = {
  title: await page.title() === 'Coreless · Rebuild V2 · Pass 21',
  runtimeAudit: pacingResult.audit.passed && pacingResult.audit.passedCount === 30,
  pass21Audit: pacingResult.validation.passed && pacingResult.validation.passedCount === 29,
  safetyBrakes: pacingResult.safety.finalSpeed <= 2.3 && pacingResult.safety.targetSpeed === 2.2,
  cruiseRecovers: Math.abs(pacingResult.cruise.finalSpeed - 5.55) < 0.05,
  catchupAccelerates: pacingResult.catchup.finalSpeed >= 8.05 && pacingResult.catchup.targetSpeed === 8.1,
  adaptivePause: pacingResult.adaptivePauseRemaining === 86 && pacingResult.adaptivePauseSkipped === 13,
  destructionSlows: Math.min(...slowdownSpeeds) < 4,
  destructionRecovers: slowdownSpeeds.at(-1) >= 7,
  supportLinked: pacingResult.linkedSupport.destroyed && pacingResult.linkedSupport.events === 1 && pacingResult.linkedSupport.structures === 1,
  slowdownArmed: pacingResult.linkedSupport.remainingFrames >= 29,
  noErrors: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: 'rebuild-v2-pass21-focused',
  category: 'helper-driven deterministic boulder pacing and destruction-slowdown inspection',
  helperCoordinateMovement: true,
  passed: Object.values(checks).every(Boolean),
  checks,
  pacingResult,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync('browser-artifacts/pass21-focused-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  passed: result.passed,
  checks,
  safetyFinal: pacingResult.safety.finalSpeed,
  cruiseFinal: pacingResult.cruise.finalSpeed,
  catchupFinal: pacingResult.catchup.finalSpeed,
  slowdownMinimum: Math.min(...slowdownSpeeds),
  slowdownFinal: slowdownSpeeds.at(-1),
  linkedSupport: pacingResult.linkedSupport,
  consoleErrors,
  pageErrors,
}, null, 2));

await browser.close();
server.kill('SIGTERM');
if (!result.passed) process.exitCode = 1;
