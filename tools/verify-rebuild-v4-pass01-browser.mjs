import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const outputPath = process.env.CORELESS_V4_PASS01_BROWSER_RESULT ??
  "docs/rebuild-v4/pass-01-browser-results.json";
const artifactDirectory = process.env.CORELESS_V4_BROWSER_ARTIFACT_DIR ??
  "browser-artifacts/v4-pass01";
fs.mkdirSync(artifactDirectory, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "4251"], {
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
  const page = await browser.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => pageErrors.push(String(error)));

  await page.goto("http://127.0.0.1:4251/v4.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.corelessV4Ready === "true");
  await page.waitForTimeout(250);

  const state = await page.evaluate(() => {
    const megaCanvas = document.querySelector("#v4MegaRoomBlueprint");
    const campaignCanvas = document.querySelector("#v4CampaignBlueprint");
    const status = document.querySelector("#v4AuditStatus");
    const v4 = window.__corelessV4;
    const pixels = megaCanvas.getContext("2d").getImageData(0, 0, megaCanvas.width, megaCanvas.height).data;
    let visiblePixels = 0;
    for (let index = 3; index < pixels.length; index += 4 * 2000) {
      if (pixels[index] > 0) visiblePixels += 1;
    }
    return {
      build: { ...v4.build },
      contract: { ...v4.contract },
      audit: { ...v4.audit },
      zones: v4.zones.map(item => ({ ...item })),
      placement: v4.placement.map(item => ({ ...item })),
      campaign: v4.campaign.map(item => ({ ...item })),
      statusText: status.textContent,
      statusState: status.dataset.state,
      megaCanvas: {
        width: megaCanvas.width,
        height: megaCanvas.height,
        clientWidth: megaCanvas.clientWidth,
        clientHeight: megaCanvas.clientHeight,
      },
      campaignCanvas: {
        width: campaignCanvas.width,
        height: campaignCanvas.height,
        clientWidth: campaignCanvas.clientWidth,
        clientHeight: campaignCanvas.clientHeight,
      },
      visiblePixels,
    };
  });

  await page.locator("#v4MegaRoomBlueprint").screenshot({
    path: `${artifactDirectory}/pass01-mega-room-blueprint.png`,
  });
  await page.locator("#v4CampaignBlueprint").screenshot({
    path: `${artifactDirectory}/pass01-campaign-blueprint.png`,
  });
  await page.screenshot({
    path: `${artifactDirectory}/pass01-page.png`,
    fullPage: true,
  });

  const directions = Array.from({ length: 6 }, (_, index) =>
    state.placement.find(item => item.tier === index + 1)?.direction);
  const totalSeconds = state.zones.reduce((sum, item) => sum + item.targetSeconds, 0);
  const campaignSeconds = state.campaign.reduce((sum, item) => sum + item.targetSeconds, 0);
  const checks = [
    ["documentReady", state.build.id === "rebuild-v4-pass01"],
    ["staticAuditPassed", state.audit.passed],
    ["statusShowsAuditPass", state.statusState === "pass" && state.statusText.includes("35/35")],
    ["megaRoomCanvasRendered", state.megaCanvas.width === 1600 && state.megaCanvas.height === 980],
    ["campaignCanvasRendered", state.campaignCanvas.width === 1600 && state.campaignCanvas.height === 650],
    ["canvasHasVisiblePixels", state.visiblePixels > 100],
    ["thirtySixVisibleSpacesBackedByData", state.zones.length === 36],
    ["sixTierPlacementsBackedByData", new Set(state.placement.map(item => item.tier)).size === 6],
    ["zigzagRenderedFromPlacement", directions.join(",") === "east,west,east,west,east,west"],
    ["firstRoomTimeBudgetIsTwelveMinutes", totalSeconds === 720],
    ["twentyMegaRoomsBackCampaign", state.campaign.length === 20],
    ["campaignTimeBudgetIsFourHours", campaignSeconds === 14400],
    ["nominalWorldIsSixTierScale", state.contract.nominalWorld.width === 16800 && state.contract.nominalWorld.height === 7400],
    ["noConsoleErrors", consoleErrors.length === 0],
    ["noPageErrors", pageErrors.length === 0],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));

  const result = {
    pass: 1,
    generatedAt: new Date().toISOString(),
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks,
    measurements: {
      spaces: state.zones.length,
      tiers: new Set(state.placement.map(item => item.tier)).size,
      firstMegaRoomSeconds: totalSeconds,
      megaRooms: state.campaign.length,
      campaignSeconds,
      nominalWorldWidth: state.contract.nominalWorld.width,
      nominalWorldHeight: state.contract.nominalWorld.height,
      visiblePixelSamples: state.visiblePixels,
      megaCanvasClientWidth: state.megaCanvas.clientWidth,
      megaCanvasClientHeight: state.megaCanvas.clientHeight,
    },
    consoleErrors,
    pageErrors,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({
    passed: result.passed,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    failed: checks.filter(item => !item.passed).map(item => item.name),
    measurements: result.measurements,
  }, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
