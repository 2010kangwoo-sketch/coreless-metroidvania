import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";
import fs from "node:fs";
import { spawn } from "node:child_process";

const server = spawn("python3", ["-m", "http.server", "4240"], { cwd: process.cwd(), stdio: "ignore" });
await new Promise(resolve => setTimeout(resolve, 800));
const executablePath = fs.existsSync("/tmp/coreless138/chromium") ? "/tmp/coreless138/chromium" : await chromium.executablePath();
const launchArgs = chromium.args.filter(arg => arg !== "--single-process" && arg !== "--in-process-gpu" && arg !== "--ignore-gpu-blocklist" && !arg.startsWith("--use-gl=") && !arg.startsWith("--use-angle=") && arg !== "--enable-unsafe-swiftshader");
launchArgs.push("--disable-gpu");
const browser = await playwright.launch({ executablePath, args: launchArgs, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", error => pageErrors.push(String(error)));
await page.goto("http://127.0.0.1:4240/index.html", { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.locator("#gameCanvas").focus();
fs.mkdirSync("browser-artifacts", { recursive: true });
for (const key of ["a", "d", "Space", "Shift", "e", "f"]) {
  await page.keyboard.press(key);
  await page.waitForTimeout(45);
}
await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  runtime.__focusedDraw = runtime.draw.bind(runtime);
  runtime.draw = () => {};
  runtime.attackFrames = 0;
});

const samples = await page.evaluate(() => window.__corelessV2.pass37.cameraSamples);
const sampleMetrics = [];
for (const sample of samples) {
  const metrics = await page.evaluate(sampleData => {
    const runtime = window.__corelessV2.runtime;
    const pass37 = window.__corelessV2.pass37;
    runtime.progress.pass06Completed = true;
    runtime.progress.zone06Entered = true;
    runtime.progress.curveCommitted = true;
    runtime.progress.zone07Entered = true;
    runtime.progress.zone07FirstLanding = true;
    runtime.progress.zone07MiddleTurn = true;
    runtime.progress.zone07SecondLanding = true;
    runtime.progress.pass10Completed = true;
    runtime.progress.zone09Entered = true;
    Object.assign(runtime.player, { x: sampleData.playerX, y: sampleData.playerY, previousX: sampleData.playerX, previousY: sampleData.playerY, vx: 0, vy: 0, grounded: true, dashFrames: 0, standingFloorId: sampleData.id, standingPlatformId: null });
    Object.assign(runtime.camera, { x: sampleData.cameraX, y: sampleData.cameraY, zoom: 1 });
    runtime.__focusedDraw();
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const at = (x, y) => {
      const index = (y * pixels.width + x) * 4;
      return [pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]];
    };
    const linear = value => { const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; };
    const luminance = color => 0.2126 * linear(color[0]) + 0.7152 * linear(color[1]) + 0.0722 * linear(color[2]);
    const meanLuminance = colors => colors.reduce((sum, color) => sum + luminance(color), 0) / Math.max(1, colors.length);
    const screenPlayerX = Math.round(sampleData.playerX - sampleData.cameraX);
    const screenPlayerY = Math.round(sampleData.playerY - sampleData.cameraY);
    const playerPixels = [];
    for (let y = screenPlayerY + 6; y < screenPlayerY + 43; y += 2) for (let x = screenPlayerX + 7; x < screenPlayerX + 27; x += 2) playerPixels.push(at(x, y));
    const backgroundPixels = [];
    for (let y = Math.max(110, screenPlayerY - 45); y < Math.min(650, screenPlayerY + 95); y += 3) for (let x = Math.max(0, screenPlayerX - 60); x < Math.min(1200, screenPlayerX + 95); x += 3) {
      if (x >= screenPlayerX - 8 && x <= screenPlayerX + 42 && y >= screenPlayerY - 8 && y <= screenPlayerY + 58) continue;
      backgroundPixels.push(at(x, y));
    }
    const playerLuminance = meanLuminance(playerPixels);
    const backgroundLuminance = meanLuminance(backgroundPixels);
    const contrastRatio = (Math.max(playerLuminance, backgroundLuminance) + 0.05) / (Math.min(playerLuminance, backgroundLuminance) + 0.05);
    const placeholderColors = [[31, 52, 58], [136, 170, 176], [23, 49, 57], [16, 35, 42], [69, 111, 119], [91, 75, 62]];
    let placeholderPixels = 0;
    let magentaPixels = 0;
    let measuredPixels = 0;
    for (let y = 110; y < 660; y += 2) for (let x = 0; x < 1200; x += 2) {
      const color = at(x, y);
      if (placeholderColors.some(target => Math.abs(color[0] - target[0]) <= 2 && Math.abs(color[1] - target[1]) <= 2 && Math.abs(color[2] - target[2]) <= 2)) placeholderPixels += 1;
      if (color[0] > 210 && color[2] > 210 && color[1] < 80) magentaPixels += 1;
      measuredPixels += 1;
    }
    const scene = pass37.scenes.find(item => item.id === sampleData.sceneId);
    const screenRect = placement => ({ id: placement.id, x: placement.x - (runtime.camera.x - scene.anchorCamera.x) * placement.cameraRatioX, y: placement.y - (runtime.camera.y - scene.anchorCamera.y) * placement.cameraRatioY, width: placement.width, height: placement.height });
    const continuationBottoms = pass37.placements.filter(item => item.sceneId === scene.id && item.continuesBelowViewport).map(screenRect).map(rect => ({ id: rect.id, bottom: rect.y + rect.height }));
    return { id: sampleData.id, sceneId: sampleData.sceneId, contrastRatio, flatPlaceholderCoverage: placeholderPixels / measuredPixels, magentaLeakCoverage: magentaPixels / measuredPixels, continuationBottoms };
  }, sample);
  sampleMetrics.push(metrics);
  await page.locator("#gameCanvas").screenshot({ path: `browser-artifacts/pass37-sweep-${sample.id}.png` });
}

const assetBottomCoverage = await page.evaluate(() => {
  const result = {};
  for (const id of ["grapple_nave", "grapple_exit", "dash_spike", "dash_exit"]) {
    const record = window.__corelessV2.pass37.assetState.byId.get(id);
    const canvas = document.createElement("canvas");
    canvas.width = record.width;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(record.image, 0, record.height - 1, record.width, 1, 0, 0, record.width, 1);
    const alpha = context.getImageData(0, 0, record.width, 1).data;
    let covered = 0;
    for (let index = 3; index < alpha.length; index += 4) if (alpha[index] > 12) covered += 1;
    result[id] = covered / record.width;
  }
  return result;
});

const parallaxProbe = await page.evaluate(() => {
  const pass37 = window.__corelessV2.pass37;
  const scene = pass37.scenes[0];
  const far = pass37.placements.find(item => item.sceneId === scene.id && item.layer === "far_background");
  const foreground = pass37.placements.find(item => item.sceneId === scene.id && item.layer === "foreground");
  const screenX = (placement, cameraX) => placement.x - (cameraX - scene.anchorCamera.x) * placement.cameraRatioX;
  return { cameraDelta: 100, farDelta: Math.abs(screenX(far, scene.anchorCamera.x + 100) - screenX(far, scene.anchorCamera.x)), foregroundDelta: Math.abs(screenX(foreground, scene.anchorCamera.x + 100) - screenX(foreground, scene.anchorCamera.x)) };
});

await page.keyboard.press("b");
await page.evaluate(() => window.__corelessV2.runtime.__focusedDraw());
await page.locator("#gameCanvas").screenshot({ path: "browser-artifacts/pass37-blueprint-focused.png" });
await page.keyboard.press("b");

const resultData = await page.evaluate(() => ({ title: document.title, audit: window.__corelessV2.audit(), validation: window.__corelessV2.pass37.validate(), plan: window.__corelessV2.pass37.plan, assetState: { loadedCount: window.__corelessV2.pass37.assetState.loadedCount, failedCount: window.__corelessV2.pass37.assetState.failedCount, dimensionsValid: window.__corelessV2.pass37.assetState.dimensionsValid }, debug: window.__corelessV2.debug() }));
const minimumContrast = Math.min(...sampleMetrics.map(item => item.contrastRatio));
const maximumFlatCoverage = Math.max(...sampleMetrics.map(item => item.flatPlaceholderCoverage));
const maximumMagentaLeakCoverage = Math.max(...sampleMetrics.map(item => item.magentaLeakCoverage));
const minimumContinuationBottom = Math.min(...sampleMetrics.flatMap(item => item.continuationBottoms).map(item => item.bottom));
const minimumAssetBottomCoverage = Math.min(...Object.values(assetBottomCoverage));
const usedCodes = resultData.audit.inputProbe.usedCodes;
const checks = {
  title: resultData.title === "Coreless · Rebuild V2 · Pass 37",
  runtimeAudit: resultData.audit.passed && resultData.audit.passedCount === 80,
  pass37Validation: resultData.validation.passed && resultData.validation.passedCount === 44,
  explicitScope: resultData.plan.scope === "triple_grapple_and_air_dash_spike_corridor_only",
  assetsLoaded: resultData.assetState.loadedCount === 8 && resultData.assetState.failedCount === 0,
  assetDimensions: resultData.assetState.dimensionsValid === true,
  twelveCameraSamples: sampleMetrics.length === 12,
  sevenScenesCovered: new Set(sampleMetrics.map(item => item.sceneId)).size === 7,
  farParallaxSlower: Math.abs(parallaxProbe.farDelta - 5) < 0.01,
  foregroundParallaxFaster: Math.abs(parallaxProbe.foregroundDelta - 108) < 0.01,
  parallaxSeparation: parallaxProbe.foregroundDelta - parallaxProbe.farDelta >= 95,
  fourValuePlanes: resultData.plan.valuePlanes.length >= 4,
  supportAssetsContinueAtBottom: minimumAssetBottomCoverage >= resultData.plan.thresholds.minimumBottomEdgeCoverage,
  supportPlacementsExtendBelowView: minimumContinuationBottom >= 680 + resultData.plan.thresholds.minimumBelowViewportExtensionPx,
  noMagentaLeak: maximumMagentaLeakCoverage <= 0.0002,
  playerContrast: minimumContrast >= resultData.plan.thresholds.minimumPlayerContrastRatio,
  flatPlaceholderCoverage: maximumFlatCoverage <= resultData.plan.thresholds.maximumFlatPlaceholderCoverage,
  exactCollisionRetention: resultData.plan.collisionChanges === 0,
  detailedGrappleSprite: resultData.plan.grappleSpriteAssetId === "grapple_anchor",
  postPass40PolishDeferred: resultData.plan.postPass40Polish.timing === "after_pass40_integration",
  inputSurface: ["KeyA", "KeyD", "KeyE", "KeyF", "ShiftLeft", "Space"].every(code => usedCodes.includes(code)),
  noReset: resultData.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = { version: "rebuild-v2-pass37-focused", category: "triple grapple and air-dash spike corridor raster depth across twelve helper-positioned camera samples; helper movement is not a traversal claim", helperCoordinateMovement: true, passed: Object.values(checks).every(Boolean), checks, measurements: { minimumContrast, maximumFlatCoverage, maximumMagentaLeakCoverage, minimumContinuationBottom, assetBottomCoverage, parallaxProbe, sampleMetrics }, resultData, consoleErrors, pageErrors };
fs.writeFileSync("browser-artifacts/pass37-focused-results.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks, measurements: result.measurements, audit: `${resultData.audit.passedCount}/${resultData.audit.total}`, pass37: `${resultData.validation.passedCount}/${resultData.validation.total}` }, null, 2));
await browser.close();
server.kill("SIGTERM");
if (!result.passed) process.exitCode = 1;
