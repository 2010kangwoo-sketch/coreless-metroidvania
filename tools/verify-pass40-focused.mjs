import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const port = 4253;
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: process.cwd(), stdio: "ignore" });
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

const startedAt = Date.now();
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
const readyMs = Date.now() - startedAt;
await page.locator("#gameCanvas").focus();
for (const key of ["a", "d", "Space", "Shift", "e", "f", "b", "b"]) {
  await page.keyboard.press(key);
  await page.waitForTimeout(45);
}

const state = await page.evaluate(() => {
  const audit = window.__corelessV2?.audit?.() ?? null;
  const release = window.__corelessV2?.pass40?.validate?.() ?? null;
  const loadingPanel = document.getElementById("loadingPanel");
  const runtimeAssetUrls = performance.getEntriesByType("resource")
    .map(entry => entry.name)
    .filter(url => url.includes("/assets/v2/"));
  return {
    title: document.title,
    pathname: location.pathname,
    ready: document.documentElement.dataset.corelessReady,
    bodyLoading: document.body.classList.contains("is-loading"),
    activeElement: document.activeElement?.id ?? null,
    canvasBusy: document.getElementById("gameCanvas")?.getAttribute("aria-busy") ?? null,
    loadingState: loadingPanel?.dataset.state ?? null,
    loadingVisibility: loadingPanel ? getComputedStyle(loadingPanel).visibility : null,
    loadingOpacity: loadingPanel ? Number(getComputedStyle(loadingPanel).opacity) : null,
    audit,
    release,
    debug: window.__corelessV2?.debug?.() ?? null,
    runtimeAssetUrls,
  };
});

const runtimeAssets = [];
for (const directory of fs.readdirSync("assets/v2", { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  const directoryPath = path.join("assets/v2", directory.name);
  for (const file of fs.readdirSync(directoryPath)) {
    const filePath = path.join(directoryPath, file);
    if (fs.statSync(filePath).isFile()) runtimeAssets.push(filePath);
  }
}
const runtimeAssetBytes = runtimeAssets.reduce((total, file) => total + fs.statSync(file).size, 0);
const requiredCodes = ["KeyA", "KeyB", "KeyD", "KeyE", "KeyF", "ShiftLeft", "Space"];
const usedCodes = state.audit?.inputProbe?.usedCodes ?? [];
const checks = {
  title: state.title === "Coreless · Mega Room · Complete",
  directEntry: state.pathname === "/" || state.pathname.endsWith("/index.html"),
  runtimeAudit: state.audit?.passed === true && state.audit?.passedCount === 98,
  pass40Audit: state.release?.passed === true && state.release?.passedCount === 32,
  documentReady: state.ready === "true" && state.bodyLoading === false,
  canvasReady: state.canvasBusy === "false" && state.activeElement === "gameCanvas",
  loadingReleased: state.loadingState === "ready" && state.loadingVisibility === "hidden" && state.loadingOpacity === 0,
  sixtyRuntimeAssets: runtimeAssets.length === 60,
  allRuntimeAssetsWebp: runtimeAssets.every(file => file.endsWith(".webp")) && state.runtimeAssetUrls.every(url => url.endsWith(".webp")),
  runtimeAssetBudget: runtimeAssetBytes <= 16 * 1024 * 1024,
  assetGroupsReady: state.audit?.checks?.some(check => check.id === "pass40_all_asset_groups_ready" && check.passed === true),
  actualInputSurface: requiredCodes.every(code => usedCodes.includes(code)),
  noReset: state.debug?.resetCount === 0,
  noErrors: consoleErrors.length === 0 && pageErrors.length === 0,
};

fs.mkdirSync("browser-artifacts", { recursive: true });
await page.screenshot({ path: "browser-artifacts/pass40-direct-entry.png", fullPage: true });
const result = {
  version: "rebuild-v2-pass40-focused",
  category: "direct-entry, optimized boot, focus, release audit and runtime asset budget",
  passed: Object.values(checks).every(Boolean),
  checks,
  measurements: {
    readyMs,
    runtimeAssetFiles: runtimeAssets.length,
    runtimeAssetBytes,
    runtimeAssetMiB: runtimeAssetBytes / 1048576,
  },
  state,
  consoleErrors,
  pageErrors,
};
fs.writeFileSync("browser-artifacts/pass40-focused-results.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  passed: result.passed,
  checks,
  measurements: result.measurements,
  audit: `${state.audit?.passedCount}/${state.audit?.total}`,
  pass40: `${state.release?.passedCount}/${state.release?.total}`,
}, null, 2));

await browser.close();
server.kill("SIGTERM");
if (!result.passed) process.exitCode = 1;
