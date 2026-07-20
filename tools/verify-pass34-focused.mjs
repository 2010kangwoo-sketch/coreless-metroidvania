import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";
import fs from "node:fs";
import { spawn } from "node:child_process";

const server = spawn("python3", ["-m", "http.server", "4226"], { cwd: process.cwd(), stdio: "ignore" });
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
await page.goto("http://127.0.0.1:4226/index.html", { waitUntil: "networkidle" });
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

const sampleMetrics = [];
const samples = await page.evaluate(() => window.__corelessV2.pass34.cameraSamples);
for (const sample of samples) {
  const metrics = await page.evaluate(sampleData => {
    const runtime = window.__corelessV2.runtime;
    const pass34 = window.__corelessV2.pass34;
    Object.assign(runtime.player, { x: sampleData.playerX, y: sampleData.playerY, previousX: sampleData.playerX, previousY: sampleData.playerY, vx: 0, vy: 0, grounded: true, dashFrames: 0, standingFloorId: sampleData.id, standingPlatformId: null });
    Object.assign(runtime.camera, { x: sampleData.cameraX, y: sampleData.cameraY, zoom: 1 });
    runtime.__focusedDraw();
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d");
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
    for (let y = 266; y < 305; y += 2) for (let x = 319; x < 335; x += 2) playerPixels.push(at(x, y));
    const backgroundPixels = [];
    for (let y = 220; y < 330; y += 3) for (let x = 270; x < 390; x += 3) {
      if (x >= 304 && x <= 350 && y >= 246 && y <= 316) continue;
      backgroundPixels.push(at(x, y));
    }
    const playerLuminance = meanLuminance(playerPixels);
    const backgroundLuminance = meanLuminance(backgroundPixels);
    const contrastRatio = (Math.max(playerLuminance, backgroundLuminance) + 0.05) / (Math.min(playerLuminance, backgroundLuminance) + 0.05);
    const placeholderColors = [[31, 52, 58], [136, 170, 176], [23, 49, 57], [16, 35, 42], [69, 111, 119], [91, 75, 62]];
    let placeholderPixels = 0;
    let measuredPixels = 0;
    for (let y = 110; y < 660; y += 2) for (let x = 0; x < 1200; x += 2) {
      const color = at(x, y);
      if (placeholderColors.some(target => Math.abs(color[0] - target[0]) <= 2 && Math.abs(color[1] - target[1]) <= 2 && Math.abs(color[2] - target[2]) <= 2)) placeholderPixels += 1;
      measuredPixels += 1;
    }
    let visibleSeamColumns = 0;
    for (let x = 1; x < 1200; x += 1) {
      let highDifferenceRows = 0;
      let rows = 0;
      for (let y = 110; y < 660; y += 5) {
        const left = at(x - 1, y);
        const right = at(x, y);
        const difference = (Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) + Math.abs(left[2] - right[2])) / 3;
        if (difference > 100) highDifferenceRows += 1;
        rows += 1;
      }
      if (highDifferenceRows / rows > 0.82) visibleSeamColumns += 1;
    }
    const scene = pass34.scenes.find(item => item.id === sampleData.sceneId);
    const safety = pass34.plan.renderContract.playerSafetyRect;
    const screenRect = placement => ({ id: placement.id, x: placement.x - (runtime.camera.x - scene.anchorCamera.x) * placement.cameraRatioX, y: placement.y - (runtime.camera.y - scene.anchorCamera.y) * placement.cameraRatioY, width: placement.width, height: placement.height });
    const activeForeground = pass34.placements.filter(item => item.sceneId === scene.id && item.layer === "foreground" && (item.minCameraX === undefined || runtime.camera.x >= item.minCameraX) && (item.maxCameraX === undefined || runtime.camera.x <= item.maxCameraX));
    const foregroundOverlapIds = [];
    for (const placement of activeForeground) {
      const rect = screenRect(placement);
      const record = pass34.assetState.byId.get(placement.assetId);
      const alphaCanvas = document.createElement("canvas");
      alphaCanvas.width = 1200;
      alphaCanvas.height = 680;
      const alphaContext = alphaCanvas.getContext("2d", { willReadFrequently: true });
      alphaContext.drawImage(record.image, rect.x, rect.y, rect.width, rect.height);
      const alpha = alphaContext.getImageData(safety.x, safety.y, safety.width, safety.height).data;
      let opaquePixels = 0;
      for (let index = 3; index < alpha.length; index += 4) if (alpha[index] > 32) opaquePixels += 1;
      if (opaquePixels > 25) foregroundOverlapIds.push(placement.id);
    }
    const continuationBottoms = pass34.placements.filter(item => item.sceneId === scene.id && item.continuesBelowViewport).map(screenRect).map(rect => ({ id: rect.id, bottom: rect.y + rect.height }));
    return { id: sampleData.id, sceneId: sampleData.sceneId, contrastRatio, flatPlaceholderCoverage: placeholderPixels / measuredPixels, visibleSeamColumns, foregroundOverlapIds, continuationBottoms };
  }, sample);
  sampleMetrics.push(metrics);
  await page.locator("#gameCanvas").screenshot({ path: `browser-artifacts/pass34-sweep-${sample.id}.png` });
}

const assetBottomCoverage = await page.evaluate(() => {
  const result = {};
  for (const id of ["west_vault", "central_maze", "high_gallery", "east_breaker"]) {
    const record = window.__corelessV2.pass34.assetState.byId.get(id);
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
  const pass34 = window.__corelessV2.pass34;
  const scene = pass34.scenes[0];
  const far = pass34.placements.find(item => item.sceneId === scene.id && item.layer === "far_background");
  const foreground = pass34.placements.find(item => item.sceneId === scene.id && item.layer === "foreground");
  const screenX = (placement, cameraX) => placement.x - (cameraX - scene.anchorCamera.x) * placement.cameraRatioX;
  return { cameraDelta: 100, farDelta: Math.abs(screenX(far, scene.anchorCamera.x + 100) - screenX(far, scene.anchorCamera.x)), foregroundDelta: Math.abs(screenX(foreground, scene.anchorCamera.x + 100) - screenX(foreground, scene.anchorCamera.x)) };
});

await page.keyboard.press("b");
await page.evaluate(() => window.__corelessV2.runtime.__focusedDraw());
await page.locator("#gameCanvas").screenshot({ path: "browser-artifacts/pass34-blueprint-focused.png" });
await page.keyboard.press("b");

const resultData = await page.evaluate(() => ({ title: document.title, audit: window.__corelessV2.audit(), validation: window.__corelessV2.pass34.validate(), plan: window.__corelessV2.pass34.plan, assetState: { loadedCount: window.__corelessV2.pass34.assetState.loadedCount, failedCount: window.__corelessV2.pass34.assetState.failedCount, dimensionsValid: window.__corelessV2.pass34.assetState.dimensionsValid }, debug: window.__corelessV2.debug() }));
const minimumContrast = Math.min(...sampleMetrics.map(item => item.contrastRatio));
const maximumFlatCoverage = Math.max(...sampleMetrics.map(item => item.flatPlaceholderCoverage));
const totalVisibleSeamColumns = sampleMetrics.reduce((sum, item) => sum + item.visibleSeamColumns, 0);
const foregroundOverlapCount = sampleMetrics.reduce((sum, item) => sum + item.foregroundOverlapIds.length, 0);
const minimumContinuationBottom = Math.min(...sampleMetrics.flatMap(item => item.continuationBottoms).map(item => item.bottom));
const minimumAssetBottomCoverage = Math.min(...Object.values(assetBottomCoverage));
const usedCodes = resultData.audit.inputProbe.usedCodes;
const checks = {
  title: resultData.title === "Coreless · Rebuild V2 · Pass 34",
  runtimeAudit: resultData.audit.passed && resultData.audit.passedCount === 65,
  pass34Validation: resultData.validation.passed && resultData.validation.passedCount === 73,
  explicitScope: resultData.plan.scope === "destruction_maze_only",
  assetsLoaded: resultData.assetState.loadedCount === 8 && resultData.assetState.failedCount === 0,
  assetDimensions: resultData.assetState.dimensionsValid === true,
  twelveCameraSamples: sampleMetrics.length === 12,
  fourScenesCovered: new Set(sampleMetrics.map(item => item.sceneId)).size === 4,
  farParallaxSlower: Math.abs(parallaxProbe.farDelta - 7) < 0.01,
  foregroundParallaxFaster: Math.abs(parallaxProbe.foregroundDelta - 108) < 0.01,
  parallaxSeparation: parallaxProbe.foregroundDelta - parallaxProbe.farDelta >= 95,
  fourValuePlanes: resultData.plan.valuePlanes.length >= 4,
  supportAssetsContinueAtBottom: minimumAssetBottomCoverage >= resultData.plan.thresholds.minimumBottomEdgeCoverage,
  supportPlacementsExtendBelowView: minimumContinuationBottom >= 680 + resultData.plan.thresholds.minimumBelowViewportExtensionPx,
  noVisibleSeams: totalVisibleSeamColumns <= resultData.plan.thresholds.visibleSeamColumnsAllowed,
  noForegroundOverlap: foregroundOverlapCount <= resultData.plan.thresholds.foregroundPlayerOverlapAllowed,
  playerContrast: minimumContrast >= resultData.plan.thresholds.minimumPlayerContrastRatio,
  flatPlaceholderCoverage: maximumFlatCoverage <= resultData.plan.thresholds.maximumFlatPlaceholderCoverage,
  exactCollisionRetention: resultData.plan.collisionChanges === 0,
  gatesRasterized: resultData.plan.gateSpriteCount === 3 && resultData.plan.gateAssetId === "dash_gates",
  postPass40PolishDeferred: resultData.plan.postPass40Polish.timing === "after_pass40_integration",
  inputSurface: ["KeyA", "KeyD", "KeyE", "KeyF", "ShiftLeft", "Space"].every(code => usedCodes.includes(code)),
  noReset: resultData.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = { version: "rebuild-v2-pass34-focused", category: "destruction maze raster depth across twelve helper-positioned camera samples; helper movement is not a traversal claim", helperCoordinateMovement: true, passed: Object.values(checks).every(Boolean), checks, measurements: { minimumContrast, maximumFlatCoverage, totalVisibleSeamColumns, foregroundOverlapCount, minimumContinuationBottom, assetBottomCoverage, parallaxProbe, sampleMetrics }, resultData, consoleErrors, pageErrors };
fs.writeFileSync("browser-artifacts/pass34-focused-results.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks, measurements: result.measurements, audit: `${resultData.audit.passedCount}/${resultData.audit.total}`, pass34: `${resultData.validation.passedCount}/${resultData.validation.total}` }, null, 2));
await browser.close();
server.kill("SIGTERM");
if (!result.passed) process.exitCode = 1;
