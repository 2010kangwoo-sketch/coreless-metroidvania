import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";
import fs from "node:fs";
import { spawn } from "node:child_process";

const server = spawn("python3", ["-m", "http.server", "4216"], { cwd: process.cwd(), stdio: "ignore" });
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
await page.goto("http://127.0.0.1:4216/index.html", { waitUntil: "networkidle" });
await page.waitForTimeout(650);
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
const samples = await page.evaluate(() => window.__corelessV2.pass31.cameraSamples);
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
    for (let y = 230; y < 328; y += 3) {
      for (let x = 278; x < 374; x += 3) {
        if (x >= 306 && x <= 348 && y >= 248 && y <= 314) continue;
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

    let visibleSeamColumns = 0;
    const visibleSeamXs = [];
    let intentionalCollisionEdgeColumns = 0;
    const collisionEdgeXs = runtime.collisionSolids.filter(solid => runtime.isSolidActive(solid)).flatMap(solid => [
      Math.round((solid.x - runtime.camera.x) * runtime.camera.zoom),
      Math.round((solid.x + solid.width - runtime.camera.x) * runtime.camera.zoom),
    ]);
    let maximumAdjacentColumnDifference = 0;
    for (let x = 1; x < 1200; x += 1) {
      let difference = 0;
      let count = 0;
      let highDifferenceRows = 0;
      for (let y = 120; y < 640; y += 4) {
        const left = at(x - 1, y);
        const right = at(x, y);
        const rowDifference = (Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) + Math.abs(left[2] - right[2])) / 3;
        difference += rowDifference;
        if (rowDifference > 80) highDifferenceRows += 1;
        count += 1;
      }
      const meanDifference = difference / count;
      maximumAdjacentColumnDifference = Math.max(maximumAdjacentColumnDifference, meanDifference);
      if (meanDifference > 45 && highDifferenceRows / count > 0.78) {
        if (collisionEdgeXs.some(edgeX => Math.abs(edgeX - x) <= 3)) {
          intentionalCollisionEdgeColumns += 1;
        } else {
          visibleSeamColumns += 1;
          visibleSeamXs.push(x);
        }
      }
    }

    const pass31 = window.__corelessV2.pass31;
    const scene = pass31.scenes.find(item => item.id === sampleData.sceneId);
    const safety = pass31.plan.renderContract.playerSafetyRect;
    const foregroundRects = pass31.placements.filter(item => item.sceneId === scene.id && item.layer === "foreground").map(item => ({
      id: item.id,
      x: item.x - (runtime.camera.x - scene.anchorCamera.x) * item.cameraRatioX,
      y: item.y - (runtime.camera.y - scene.anchorCamera.y) * item.cameraRatioY,
      width: item.width,
      height: item.height,
    }));
    const foregroundOverlapIds = foregroundRects.filter(rect => rect.x < safety.x + safety.width && rect.x + rect.width > safety.x && rect.y < safety.y + safety.height && rect.y + rect.height > safety.y).map(rect => rect.id);
    return {
      id: sampleData.id,
      sceneId: sampleData.sceneId,
      camera: { x: runtime.camera.x, y: runtime.camera.y },
      player: { x: runtime.player.x, y: runtime.player.y },
      contrastRatio,
      playerLuminance,
      backgroundLuminance,
      flatPlaceholderCoverage: placeholderPixels / measuredPixels,
      visibleSeamColumns,
      visibleSeamXs,
      intentionalCollisionEdgeColumns,
      maximumAdjacentColumnDifference,
      foregroundOverlapIds,
    };
  }, sample);
  sampleMetrics.push(metrics);
  await page.waitForTimeout(80);
  await page.locator("#gameCanvas").screenshot({ path: `browser-artifacts/pass31-sweep-${sample.id}.png` });
}

for (const sample of [
  { id: "transition_west", cameraX: 2380, cameraY: 1450 },
  { id: "transition_mid", cameraX: 2500, cameraY: 1450 },
  { id: "transition_east", cameraX: 2620, cameraY: 1450 },
]) {
  await page.evaluate(sampleData => {
    const runtime = window.__corelessV2.runtime;
    Object.assign(runtime.player, { x: sampleData.cameraX + 310, y: sampleData.cameraY + 260, previousX: sampleData.cameraX + 310, previousY: sampleData.cameraY + 260, vx: 0, vy: 0, dashFrames: 0 });
    Object.assign(runtime.camera, { x: sampleData.cameraX, y: sampleData.cameraY, zoom: 1 });
    runtime.__focusedDraw();
  }, sample);
  await page.locator("#gameCanvas").screenshot({ path: `browser-artifacts/pass31-${sample.id}.png` });
}

await page.keyboard.press("b");
await page.evaluate(() => window.__corelessV2.runtime.__focusedDraw());
await page.locator("#gameCanvas").screenshot({ path: "browser-artifacts/pass31-blueprint-focused.png" });
await page.keyboard.press("b");

const resultData = await page.evaluate(() => ({
  title: document.title,
  buildStatus: document.getElementById("buildStatus")?.textContent ?? null,
  auditStatus: document.getElementById("auditStatus")?.textContent ?? null,
  audit: window.__corelessV2.audit(),
  validation: window.__corelessV2.pass31.validate(),
  plan: window.__corelessV2.pass31.plan,
  assetState: {
    loadedCount: window.__corelessV2.pass31.assetState.loadedCount,
    failedCount: window.__corelessV2.pass31.assetState.failedCount,
    dimensionsValid: window.__corelessV2.pass31.assetState.dimensionsValid,
  },
  debug: window.__corelessV2.debug(),
}));
const minimumContrast = Math.min(...sampleMetrics.map(item => item.contrastRatio));
const maximumFlatCoverage = Math.max(...sampleMetrics.map(item => item.flatPlaceholderCoverage));
const totalVisibleSeamColumns = sampleMetrics.reduce((sum, item) => sum + item.visibleSeamColumns, 0);
const foregroundOverlapCount = sampleMetrics.reduce((sum, item) => sum + item.foregroundOverlapIds.length, 0);
const usedCodes = resultData.audit.inputProbe.usedCodes;
const checks = {
  title: resultData.title === "Coreless · Rebuild V2 · Pass 31",
  runtimeAudit: resultData.audit.passed && resultData.audit.passedCount === 50,
  pass31Validation: resultData.validation.passed && resultData.validation.passedCount === 60,
  explicitScope: resultData.plan.scope === "start_slope_and_double_wall_only",
  assetsLoaded: resultData.assetState.loadedCount === 5 && resultData.assetState.failedCount === 0,
  assetDimensions: resultData.assetState.dimensionsValid === true,
  sixCameraSamples: sampleMetrics.length === 6,
  bothScenesCovered: new Set(sampleMetrics.map(item => item.sceneId)).size === 2,
  noVisibleSeams: totalVisibleSeamColumns <= resultData.plan.thresholds.visibleSeamColumnsAllowed,
  noForegroundOverlap: foregroundOverlapCount <= resultData.plan.thresholds.foregroundPlayerOverlapAllowed,
  playerContrast: minimumContrast >= resultData.plan.thresholds.minimumPlayerContrastRatio,
  flatPlaceholderCoverage: maximumFlatCoverage <= resultData.plan.thresholds.maximumFlatPlaceholderCoverage,
  exactCollisionRetention: resultData.plan.collisionChanges === 0,
  inputSurface: ["KeyA", "KeyD", "KeyE", "KeyF", "ShiftLeft", "Space"].every(code => usedCodes.includes(code)),
  noReset: resultData.debug.resetCount === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};
const result = {
  version: "rebuild-v2-pass31-focused",
  category: "entrance raster expansion across six helper-positioned camera samples; helper movement is not a traversal claim",
  helperCoordinateMovement: true,
  passed: Object.values(checks).every(Boolean),
  checks,
  measurements: { minimumContrast, maximumFlatCoverage, totalVisibleSeamColumns, foregroundOverlapCount, sampleMetrics },
  resultData,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync("browser-artifacts/pass31-focused-results.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify({ passed: result.passed, checks, measurements: result.measurements, audit: `${resultData.audit.passedCount}/${resultData.audit.total}`, pass31: `${resultData.validation.passedCount}/${resultData.validation.total}` }, null, 2));
await browser.close();
server.kill("SIGTERM");
if (!result.passed) process.exitCode = 1;
