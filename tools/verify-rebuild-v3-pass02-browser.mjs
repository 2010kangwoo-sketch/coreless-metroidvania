import fs from "node:fs";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V3_PASS02_BROWSER_RESULT ?? "docs/rebuild-v3/pass-02-browser-results.json";
const artifactDirectory = "browser-artifacts/v3-pass02";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4245"], {
  cwd: process.cwd(),
  stdio: "ignore",
});
await new Promise(resolve => setTimeout(resolve, 700));

let browser;
try {
  const executablePath = fs.existsSync("/tmp/coreless138/chromium")
    ? "/tmp/coreless138/chromium"
    : await chromium.executablePath();
  const args = chromium.args.filter(arg =>
    arg !== "--single-process" &&
    arg !== "--in-process-gpu" &&
    arg !== "--ignore-gpu-blocklist" &&
    !arg.startsWith("--use-gl=") &&
    !arg.startsWith("--use-angle=") &&
    arg !== "--enable-unsafe-swiftshader");
  args.push("--disable-gpu");
  browser = await playwright.launch({ executablePath, args, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => pageErrors.push(String(error)));

  await page.goto("http://127.0.0.1:4245/v3.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.corelessV3Ready === "true");
  await page.locator("#v3Canvas").focus();
  await page.screenshot({ path: `${artifactDirectory}/entry.png` });

  const initial = await page.evaluate(() => ({
    x: window.__corelessV3.runtime.player.x,
    y: window.__corelessV3.runtime.player.y,
    room: window.__corelessV3.runtime.currentRoom,
    audit: window.__corelessV3.structuralAudit,
  }));

  const jumpedZones = [];
  const jumpPlan = [
    ["r1-low", 390, 515, false],
    ["r1-mid", 650, 835, false],
    ["r1-high", 875, 1135, false],
    ["r1-exit", 1300, 1450, false],
    ["r2-low", 1635, 1805, false],
    ["r2-recovery", 2770, 2935, false],
    ["r3-altar", 3235, 3410, false],
    ["r3-rise-one", 3580, 3815, true],
    ["r3-rise-two", 3890, 4145, true],
    ["r3-landing", 4320, 4485, false],
  ];

  await page.keyboard.down("KeyD");
  const samples = [];
  const start = Date.now();
  let capturedMiddle = false;
  let planIndex = 0;
  let lastJumpAt = 0;
  while (Date.now() - start < 30000) {
    const state = await page.evaluate(() => ({
      x: window.__corelessV3.runtime.player.x,
      y: window.__corelessV3.runtime.player.y,
      vx: window.__corelessV3.runtime.player.vx,
      vy: window.__corelessV3.runtime.player.vy,
      grounded: window.__corelessV3.runtime.player.grounded,
      doubleJump: window.__corelessV3.runtime.player.abilities.doubleJump,
      room: window.__corelessV3.runtime.currentRoom,
      finished: window.__corelessV3.runtime.audit.finished,
    }));
    samples.push(state);

    if (!capturedMiddle && state.x > 1750) {
      capturedMiddle = true;
      await page.screenshot({ path: `${artifactDirectory}/variable-jump-room.png` });
    }
    if (state.finished) break;

    while (planIndex < jumpPlan.length && state.x > jumpPlan[planIndex][2]) planIndex += 1;
    const zone = jumpPlan[planIndex];
    if (zone && state.x >= zone[1] && state.grounded && Date.now() - lastJumpAt > 560) {
      const [id, , , doubleJump] = zone;
      jumpedZones.push(id);
      lastJumpAt = Date.now();
      await page.keyboard.down("Space");
      await page.waitForTimeout(doubleJump ? 190 : 400);
      await page.keyboard.up("Space");
      if (doubleJump) {
        await page.waitForTimeout(75);
        await page.keyboard.down("Space");
        await page.waitForTimeout(250);
        await page.keyboard.up("Space");
      }
    } else {
      await page.waitForTimeout(35);
    }
  }
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${artifactDirectory}/final.png` });

  const final = await page.evaluate(() => ({
    player: { ...window.__corelessV3.runtime.player },
    camera: { ...window.__corelessV3.runtime.camera },
    room: window.__corelessV3.runtime.currentRoom,
    audit: { ...window.__corelessV3.runtime.audit },
    ready: document.documentElement.dataset.corelessV3Ready,
  }));

  const checks = [
    ["documentReady", final.ready === "true"],
    ["structuralAudit", initial.audit.passed],
    ["startsInRoomOne", initial.room === "r01"],
    ["actualKeyboardMovedPlayer", final.player.x > initial.x + 4000],
    ["visitedAllThreeRooms", final.audit.roomTransitions >= 2],
    ["doubleJumpUnlocked", final.audit.doubleJumpUnlocked && final.player.abilities.doubleJump],
    ["jumpEventsObserved", final.audit.jumps >= 8],
    ["doubleJumpObserved", final.audit.doubleJumps >= 1],
    ["landingsObserved", final.audit.landings >= 5],
    ["finishReached", final.audit.finished],
    ["topSpeedBounded", final.audit.maximumHorizontalSpeed <= 421],
    ["cameraStepBounded", final.audit.maximumCameraStep < 85],
    ["noUnexpectedReset", final.audit.resets === 0],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 2,
    generatedAt: new Date().toISOString(),
    passed: checks.every(check => check.passed),
    passedCount: checks.filter(check => check.passed).length,
    totalCount: checks.length,
    checks,
    initial,
    final,
    jumpZonesUsed: jumpedZones,
    sampleCount: samples.length,
    consoleErrors,
    pageErrors,
  };
  fs.mkdirSync(new URL(".", `file://${process.cwd()}/${outputPath}`).pathname, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({
    passed: result.passed,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    failed: checks.filter(check => !check.passed).map(check => check.name),
    finalX: final.player.x,
    finalY: final.player.y,
    room: final.room,
    audit: final.audit,
  }, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
