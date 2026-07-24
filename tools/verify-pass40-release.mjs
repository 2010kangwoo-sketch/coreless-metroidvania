import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PASS28_RASTER_ASSETS } from "../src/v2/pass28-art-direction.js";
import { PASS29_MODULE_ASSETS } from "../src/v2/pass29-modular-art.js";
import { PASS31_ENTRANCE_ASSETS } from "../src/v2/pass31-entrance-art.js";
import { PASS32_BURIED_ASSETS } from "../src/v2/pass32-buried-rise-art.js";
import { PASS33_TUNNEL_ASSETS } from "../src/v2/pass33-uneven-tunnel-art.js";
import { PASS34_DESTRUCTION_ASSETS } from "../src/v2/pass34-destruction-maze-art.js";
import { PASS35_CURVE_ASSETS } from "../src/v2/pass35-giant-curve-art.js";
import { PASS36_INTERNAL_ASSETS } from "../src/v2/pass36-internal-chase-art.js";
import { PASS37_GRAPPLE_ASSETS } from "../src/v2/pass37-grapple-dash-art.js";
import { PASS38_PRECISION_ASSETS } from "../src/v2/pass38-precision-curve-art.js";
import { PASS39_BRIDGE_ASSETS } from "../src/v2/pass39-bridge-aftershock-art.js";
import { PASS40_RELEASE_PLAN, validatePass40Release } from "../src/v2/pass40-release.js";

const groups = [
  PASS28_RASTER_ASSETS,
  PASS29_MODULE_ASSETS,
  PASS31_ENTRANCE_ASSETS,
  PASS32_BURIED_ASSETS,
  PASS33_TUNNEL_ASSETS,
  PASS34_DESTRUCTION_ASSETS,
  PASS35_CURVE_ASSETS,
  PASS36_INTERNAL_ASSETS,
  PASS37_GRAPPLE_ASSETS,
  PASS38_PRECISION_ASSETS,
  PASS39_BRIDGE_ASSETS,
];
const declaredAssets = groups.flat();
const uniquePaths = [...new Set(declaredAssets.map(asset => asset.src))].sort();
const declarationByPath = new Map(declaredAssets.map(asset => [asset.src, asset]));
const files = uniquePaths.map(file => ({
  file,
  exists: fs.existsSync(file),
  bytes: fs.existsSync(file) ? fs.statSync(file).size : 0,
  image: fs.existsSync(file)
    ? execFileSync("identify", ["-format", "%w %h %[channels]", file], { encoding: "utf8" }).trim()
    : "",
}));
const runtimeAssetBytes = files.reduce((total, file) => total + file.bytes, 0);
const index = fs.readFileSync("index.html", "utf8");
const style = fs.readFileSync("style.css", "utf8");
const workflow = fs.readFileSync(".github/workflows/rebuild-v2-browser-verify.yml", "utf8");
const changedCollisionFiles = execFileSync("git", [
  "diff",
  "--name-only",
  PASS40_RELEASE_PLAN.baselineSha,
  "--",
  "src/v2/pass03-level.js",
  "src/v2/pass04-level.js",
  "src/v2/pass05-level.js",
  "src/v2/pass06-level.js",
  "src/v2/pass07-level.js",
  "src/v2/pass08-level.js",
  "src/v2/pass09-level.js",
  "src/v2/pass10-level.js",
  "src/v2/pass11-level.js",
  "src/v2/pass12-level.js",
  "src/v2/pass13-level.js",
  "src/v2/pass14-level.js",
  "src/v2/pass15-level.js",
  "src/v2/pass18-level.js",
  "src/v2/pass19-level.js",
  "src/v2/pass20-level.js",
  "src/v2/pass22-level.js",
  "src/v2/pass23-level.js",
], { encoding: "utf8" }).trim().split("\n").filter(Boolean);

const validation = validatePass40Release();
const checks = {
  releasePlan: validation.passed && validation.passedCount === 32,
  elevenAssetGroups: groups.length === PASS40_RELEASE_PLAN.startupAssetGroups,
  sixtyUniqueAssets: uniquePaths.length === PASS40_RELEASE_PLAN.runtimeAssetFiles,
  allAssetsExist: files.every(file => file.exists),
  allAssetsWebp: files.every(file => path.extname(file.file) === ".webp"),
  allDeclarationsWebp: declaredAssets.every(asset => asset.type === "image/webp" && asset.src.endsWith(".webp")),
  allAssetDimensions: files.every(file => {
    const declaration = declarationByPath.get(file.file);
    const [width, height] = file.image.split(" ").map(Number);
    return width === declaration?.expectedWidth && height === declaration?.expectedHeight;
  }),
  alphaCutoutsPreserved: files.every(file => declarationByPath.get(file.file)?.alpha !== true || file.image.split(" ")[2]?.includes("a")),
  exactRuntimeBytes: runtimeAssetBytes === PASS40_RELEASE_PLAN.optimizedRuntimeAssetBytes,
  runtimeBudget: runtimeAssetBytes <= PASS40_RELEASE_PLAN.maximumRuntimeAssetBytes,
  directEntryTitle: index.includes("<title>Coreless · Mega Room · Complete</title>"),
  canvasPresent: index.includes('id="gameCanvas"') && index.includes('aria-busy="true"'),
  loadingSurfacePresent: PASS40_RELEASE_PLAN.requiredDomIds.every(id => index.includes(`id="${id}"`)),
  visibleFailureHandler: index.includes("showBootFailure") && index.includes("unhandledrejection"),
  pass40ModuleEntry: index.includes("src/v2/main.js?v=rebuild-v2-pass40"),
  responsiveCanvas: style.includes("aspect-ratio: 1200 / 680") && style.includes("@media (max-width: 720px)"),
  loadingReleaseCss: style.includes('html[data-coreless-ready="true"] .loading-panel'),
  reducedMotion: style.includes("@media (prefers-reduced-motion: reduce)"),
  pass40Workflow: workflow.includes("Verify pass 40") && workflow.includes("pass40_document_ready"),
  collisionFilesUnchanged: changedCollisionFiles.length === 0,
  sourceEvidenceExcludedFromRuntime: !uniquePaths.some(file => file.includes("docs/")),
  postReleasePolishDeferred: PASS40_RELEASE_PLAN.postReleasePolish.status === "deferred",
};

const result = {
  version: "rebuild-v2-pass40-release",
  passed: Object.values(checks).every(Boolean),
  checks,
  measurements: {
    assetGroups: groups.length,
    declaredAssetReferences: declaredAssets.length,
    uniqueRuntimeAssets: uniquePaths.length,
    originalRuntimeAssetBytes: PASS40_RELEASE_PLAN.originalRuntimeAssetBytes,
    optimizedRuntimeAssetBytes: runtimeAssetBytes,
    originalRuntimeAssetMiB: PASS40_RELEASE_PLAN.originalRuntimeAssetBytes / 1048576,
    optimizedRuntimeAssetMiB: runtimeAssetBytes / 1048576,
    reductionRatio: 1 - runtimeAssetBytes / PASS40_RELEASE_PLAN.originalRuntimeAssetBytes,
    changedCollisionFiles,
  },
  validation,
};

const serialized = JSON.stringify(result, null, 2);
if (process.env.CORELESS_RELEASE_RESULT) {
  fs.mkdirSync(path.dirname(process.env.CORELESS_RELEASE_RESULT), { recursive: true });
  fs.writeFileSync(process.env.CORELESS_RELEASE_RESULT, `${serialized}\n`);
}
console.log(serialized);
if (!result.passed) process.exitCode = 1;
