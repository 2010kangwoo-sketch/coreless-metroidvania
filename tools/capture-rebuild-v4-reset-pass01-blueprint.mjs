import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium as playwright } from "/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs";
import chromium from "/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/esm/index.js";

const sourcePath = path.resolve(
  process.env.CORELESS_V4_RESET_PASS01_BLUEPRINT ??
  "docs/rebuild-v4/assets/reset-pass01-room-plan.svg",
);
const outputPath = path.resolve(
  process.env.CORELESS_V4_RESET_PASS01_BLUEPRINT_PNG ??
  "docs/rebuild-v4/assets/reset-pass01-room-plan.png",
);
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

const browser = await playwright.launch({
  executablePath,
  args,
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 2200, height: 1500 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(sourcePath).href, {
    waitUntil: "load",
  });
  await page.waitForTimeout(200);
  const state = await page.evaluate(() => ({
    root: document.documentElement.tagName.toLowerCase(),
    rooms: document.querySelectorAll("g.room").length,
    width: document.documentElement.getAttribute("width"),
    height: document.documentElement.getAttribute("height"),
  }));
  if (
    state.root !== "svg" ||
    state.rooms !== 36 ||
    state.width !== "2200" ||
    state.height !== "1500"
  ) {
    throw new Error(`Unexpected blueprint state: ${JSON.stringify(state)}`);
  }
  await page.screenshot({
    path: outputPath,
    fullPage: false,
  });
  console.log(JSON.stringify({ outputPath, ...state }, null, 2));
} finally {
  await browser.close();
}
