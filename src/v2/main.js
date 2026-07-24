import { BUILD } from "./config.js";
import { BOULDER_ROUTE, CHASE_FEATURES, PLAYER_ROUTE, WORLD, ZONES, validateBlueprint } from "./blueprint.js";
import { PASS03_LEVEL, PLAYER_PHYSICS, validatePass03Level } from "./pass03-level.js";
import { PASS04_LEVEL, PASS04_ZONE, validatePass04Level } from "./pass04-level.js";
import { PASS05_LEVEL, PASS05_ZONE, validatePass05Level } from "./pass05-level.js";
import { PASS06_LEVEL, PASS06_ZONE, validatePass06Level } from "./pass06-level.js";
import { PASS07_LEVEL, PASS07_ZONE, validatePass07Level } from "./pass07-level.js";
import { PASS08_CHASE, PASS08_LEVEL, validatePass08Level } from "./pass08-level.js";
import { PASS09_CHASE, PASS09_LEVEL, PASS09_ZONE, validatePass09Level } from "./pass09-level.js";
import { PASS10_CHASE, PASS10_LEVEL, PASS10_ZONE, validatePass10Level } from "./pass10-level.js";
import { PASS11_CHASE, PASS11_LEVEL, PASS11_ZONE, validatePass11Level } from "./pass11-level.js";
import { PASS12_CHASE, PASS12_LEVEL, PASS12_ZONE, validatePass12Level } from "./pass12-level.js";
import { PASS13_CHASE, PASS13_LEVEL, PASS13_ZONE, validatePass13Level } from "./pass13-level.js";
import { PASS14_CHASE, PASS14_LEVEL, PASS14_ZONE, validatePass14Level } from "./pass14-level.js";
import { PASS15_CHASE, PASS15_LEVEL, PASS15_ZONE, validatePass15Level } from "./pass15-level.js";
import { PASS16_LIGHTS, PASS16_THEMES, PASS16_VISUALS, validatePass16Visuals } from "./pass16-visuals.js";
import { PASS17_ART, PASS17_MATERIALS, PASS17_REINFORCEMENTS, PASS17_SUPPORTS, PASS17_VEGETATION, validatePass17Art } from "./pass17-art.js";
import { PASS18_LEVEL, PASS18_ZONE, validatePass18Level } from "./pass18-level.js";
import { PASS19_DESTRUCTION, PASS19_LEVEL, validatePass19Level } from "./pass19-level.js";
import { PASS20_LEVEL, PASS20_ZONE, validatePass20Level } from "./pass20-level.js";
import { PASS21_PACING, getPass21DestructionMultiplier, getPass21TargetSpeed, validatePass21Pacing } from "./pass21-pacing.js";
import { PASS22_LEVEL, PASS22_ZONE, validatePass22Level } from "./pass22-level.js";
import { PASS23_LEVEL, PASS23_ZONE, validatePass23Level } from "./pass23-level.js";
import { PASS24_INTEGRATION, getPass24IntegrationState, validatePass24Integration } from "./pass24-integration.js";
import { PASS25_VISUAL_SLICE, validatePass25Visuals } from "./pass25-visuals.js";
import { PASS26_TERRAIN, validatePass26Terrain } from "./pass26-terrain.js";
import { PASS27_STRUCTURE_PLAN, validatePass27Structures } from "./pass27-structures.js";
import { PASS28_ART_DIRECTION, PASS28_ART_LAYERS, PASS28_RASTER_ASSETS, loadPass28RasterAssets, validatePass28ArtDirection } from "./pass28-art-direction.js";
import { PASS29_MODULAR_PLAN, PASS29_MODULE_ASSETS, PASS29_MODULE_PLACEMENTS, loadPass29ModuleAssets, validatePass29ModularArt } from "./pass29-modular-art.js";
import { PASS30_CAMERA_SAMPLES, PASS30_QUALITY_GATE, validatePass30QualityGate } from "./pass30-quality-gate.js";
import { PASS31_CAMERA_SAMPLES, PASS31_ENTRANCE_ASSETS, PASS31_ENTRANCE_PLAN, PASS31_ENTRANCE_PLACEMENTS, PASS31_ENTRANCE_SCENES, loadPass31EntranceAssets, validatePass31EntranceArt } from "./pass31-entrance-art.js";
import { PASS32_BURIED_ASSETS, PASS32_BURIED_PLAN, PASS32_BURIED_PLACEMENTS, PASS32_BURIED_SCENES, PASS32_CAMERA_SAMPLES, loadPass32BuriedAssets, validatePass32BuriedRiseArt } from "./pass32-buried-rise-art.js";
import { PASS33_CAMERA_SAMPLES, PASS33_TUNNEL_ASSETS, PASS33_TUNNEL_PLAN, PASS33_TUNNEL_PLACEMENTS, PASS33_TUNNEL_SCENES, loadPass33TunnelAssets, validatePass33UnevenTunnelArt } from "./pass33-uneven-tunnel-art.js";
import { PASS34_CAMERA_SAMPLES, PASS34_DESTRUCTION_ASSETS, PASS34_DESTRUCTION_PLAN, PASS34_DESTRUCTION_PLACEMENTS, PASS34_DESTRUCTION_SCENES, PASS34_GATE_SPRITES, loadPass34DestructionAssets, validatePass34DestructionMazeArt } from "./pass34-destruction-maze-art.js";
import { PASS35_CAMERA_SAMPLES, PASS35_CURVE_ASSETS, PASS35_CURVE_PLAN, PASS35_CURVE_PLACEMENTS, PASS35_CURVE_SCENES, PASS35_DASH_GAP_SPRITES, loadPass35CurveAssets, validatePass35GiantCurveArt } from "./pass35-giant-curve-art.js";
import { PASS36_CAMERA_SAMPLES, PASS36_INTERNAL_ASSETS, PASS36_INTERNAL_PLAN, PASS36_INTERNAL_PLACEMENTS, PASS36_INTERNAL_SCENES, PASS36_WALL_FACES, loadPass36InternalAssets, validatePass36InternalChaseArt } from "./pass36-internal-chase-art.js";
import { PASS37_CAMERA_SAMPLES, PASS37_GRAPPLE_ASSETS, PASS37_GRAPPLE_PLAN, PASS37_GRAPPLE_PLACEMENTS, PASS37_GRAPPLE_SCENES, loadPass37GrappleAssets, validatePass37GrappleDashArt } from "./pass37-grapple-dash-art.js";
import { PASS38_CAMERA_SAMPLES, PASS38_PRECISION_ASSETS, PASS38_PRECISION_PLAN, PASS38_PRECISION_PLACEMENTS, PASS38_PRECISION_SCENES, loadPass38PrecisionAssets, validatePass38PrecisionCurveArt } from "./pass38-precision-curve-art.js";
import { PASS39_BRIDGE_ASSETS, PASS39_BRIDGE_PLAN, PASS39_BRIDGE_PLACEMENTS, PASS39_BRIDGE_SCENES, PASS39_CAMERA_SAMPLES, loadPass39BridgeAssets, validatePass39BridgeAftershockArt } from "./pass39-bridge-aftershock-art.js";
import { Pass39Runtime } from "./runtime.js";

const canvas = document.getElementById("gameCanvas");
const buildStatus = document.getElementById("buildStatus");
const auditStatus = document.getElementById("auditStatus");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Coreless V2 could not find #gameCanvas.");
}

const [pass28AssetState, pass29AssetState, pass31AssetState, pass32AssetState, pass33AssetState, pass34AssetState, pass35AssetState, pass36AssetState, pass37AssetState, pass38AssetState, pass39AssetState] = await Promise.all([loadPass28RasterAssets(), loadPass29ModuleAssets(), loadPass31EntranceAssets(), loadPass32BuriedAssets(), loadPass33TunnelAssets(), loadPass34DestructionAssets(), loadPass35CurveAssets(), loadPass36InternalAssets(), loadPass37GrappleAssets(), loadPass38PrecisionAssets(), loadPass39BridgeAssets()]);
const runtime = new Pass39Runtime(canvas, {
  build: buildStatus,
  audit: auditStatus,
}, pass28AssetState, pass29AssetState, pass31AssetState, pass32AssetState, pass33AssetState, pass34AssetState, pass35AssetState, pass36AssetState, pass37AssetState, pass38AssetState, pass39AssetState);

runtime.start();

requestAnimationFrame(() => {
  runtime.updateStatus();
});

window.__corelessV2 = Object.freeze({
  build: BUILD,
  blueprint: Object.freeze({
    world: WORLD,
    zones: ZONES,
    playerRoute: PLAYER_ROUTE,
    boulderRoute: BOULDER_ROUTE,
    chaseFeatures: CHASE_FEATURES,
    validate: validateBlueprint,
  }),
  pass03: Object.freeze({
    level: PASS03_LEVEL,
    physics: PLAYER_PHYSICS,
    validate: validatePass03Level,
  }),
  pass04: Object.freeze({
    level: PASS04_LEVEL,
    zone: PASS04_ZONE,
    validate: validatePass04Level,
  }),
  pass05: Object.freeze({
    level: PASS05_LEVEL,
    zone: PASS05_ZONE,
    validate: validatePass05Level,
  }),
  pass06: Object.freeze({
    level: PASS06_LEVEL,
    zone: PASS06_ZONE,
    validate: validatePass06Level,
  }),
  pass07: Object.freeze({
    level: PASS07_LEVEL,
    zone: PASS07_ZONE,
    validate: validatePass07Level,
  }),
  pass08: Object.freeze({
    level: PASS08_LEVEL,
    chase: PASS08_CHASE,
    validate: validatePass08Level,
  }),
  pass09: Object.freeze({
    level: PASS09_LEVEL,
    zone: PASS09_ZONE,
    chase: PASS09_CHASE,
    validate: validatePass09Level,
  }),
  pass10: Object.freeze({
    level: PASS10_LEVEL,
    zone: PASS10_ZONE,
    chase: PASS10_CHASE,
    validate: validatePass10Level,
  }),
  pass11: Object.freeze({
    level: PASS11_LEVEL,
    zone: PASS11_ZONE,
    chase: PASS11_CHASE,
    validate: validatePass11Level,
  }),
  pass12: Object.freeze({
    level: PASS12_LEVEL,
    zone: PASS12_ZONE,
    chase: PASS12_CHASE,
    validate: validatePass12Level,
  }),
  pass13: Object.freeze({
    level: PASS13_LEVEL,
    zone: PASS13_ZONE,
    chase: PASS13_CHASE,
    validate: validatePass13Level,
  }),
  pass14: Object.freeze({
    level: PASS14_LEVEL,
    zone: PASS14_ZONE,
    chase: PASS14_CHASE,
    validate: validatePass14Level,
  }),
  pass15: Object.freeze({
    level: PASS15_LEVEL,
    zone: PASS15_ZONE,
    chase: PASS15_CHASE,
    validate: validatePass15Level,
  }),
  pass16: Object.freeze({
    visuals: PASS16_VISUALS,
    themes: PASS16_THEMES,
    lights: PASS16_LIGHTS,
    validate: validatePass16Visuals,
  }),
  pass17: Object.freeze({
    art: PASS17_ART,
    materials: PASS17_MATERIALS,
    reinforcements: PASS17_REINFORCEMENTS,
    vegetation: PASS17_VEGETATION,
    supports: PASS17_SUPPORTS,
    validate: validatePass17Art,
  }),
  pass18: Object.freeze({
    level: PASS18_LEVEL,
    zone: PASS18_ZONE,
    validate: validatePass18Level,
  }),
  pass19: Object.freeze({
    level: PASS19_LEVEL,
    destruction: PASS19_DESTRUCTION,
    validate: validatePass19Level,
  }),
  pass20: Object.freeze({
    level: PASS20_LEVEL,
    zone: PASS20_ZONE,
    validate: validatePass20Level,
  }),
  pass21: Object.freeze({
    pacing: PASS21_PACING,
    targetSpeed: getPass21TargetSpeed,
    destructionMultiplier: getPass21DestructionMultiplier,
    validate: validatePass21Pacing,
  }),
  pass22: Object.freeze({ level: PASS22_LEVEL, zone: PASS22_ZONE, validate: validatePass22Level }),
  pass23: Object.freeze({ level: PASS23_LEVEL, zone: PASS23_ZONE, validate: validatePass23Level }),
  pass24: Object.freeze({ integration: PASS24_INTEGRATION, state: getPass24IntegrationState, validate: validatePass24Integration }),
  pass25: Object.freeze({ visuals: PASS25_VISUAL_SLICE, validate: validatePass25Visuals }),
  pass26: Object.freeze({ terrain: PASS26_TERRAIN, validate: validatePass26Terrain }),
  pass27: Object.freeze({ structures: PASS27_STRUCTURE_PLAN, validate: validatePass27Structures }),
  pass28: Object.freeze({
    direction: PASS28_ART_DIRECTION,
    layers: PASS28_ART_LAYERS,
    assets: PASS28_RASTER_ASSETS,
    assetState: pass28AssetState,
    validate: validatePass28ArtDirection,
  }),
  pass29: Object.freeze({
    plan: PASS29_MODULAR_PLAN,
    assets: PASS29_MODULE_ASSETS,
    placements: PASS29_MODULE_PLACEMENTS,
    assetState: pass29AssetState,
    validate: validatePass29ModularArt,
  }),
  pass30: Object.freeze({
    gate: PASS30_QUALITY_GATE,
    cameraSamples: PASS30_CAMERA_SAMPLES,
    validate: validatePass30QualityGate,
  }),
  pass31: Object.freeze({
    plan: PASS31_ENTRANCE_PLAN,
    assets: PASS31_ENTRANCE_ASSETS,
    scenes: PASS31_ENTRANCE_SCENES,
    placements: PASS31_ENTRANCE_PLACEMENTS,
    cameraSamples: PASS31_CAMERA_SAMPLES,
    assetState: pass31AssetState,
    validate: validatePass31EntranceArt,
  }),
  pass32: Object.freeze({
    plan: PASS32_BURIED_PLAN,
    assets: PASS32_BURIED_ASSETS,
    scenes: PASS32_BURIED_SCENES,
    placements: PASS32_BURIED_PLACEMENTS,
    cameraSamples: PASS32_CAMERA_SAMPLES,
    assetState: pass32AssetState,
    validate: validatePass32BuriedRiseArt,
  }),
  pass33: Object.freeze({
    plan: PASS33_TUNNEL_PLAN,
    assets: PASS33_TUNNEL_ASSETS,
    scenes: PASS33_TUNNEL_SCENES,
    placements: PASS33_TUNNEL_PLACEMENTS,
    cameraSamples: PASS33_CAMERA_SAMPLES,
    assetState: pass33AssetState,
    validate: validatePass33UnevenTunnelArt,
  }),
  pass34: Object.freeze({
    plan: PASS34_DESTRUCTION_PLAN,
    assets: PASS34_DESTRUCTION_ASSETS,
    scenes: PASS34_DESTRUCTION_SCENES,
    placements: PASS34_DESTRUCTION_PLACEMENTS,
    gateSprites: PASS34_GATE_SPRITES,
    cameraSamples: PASS34_CAMERA_SAMPLES,
    assetState: pass34AssetState,
    validate: validatePass34DestructionMazeArt,
  }),
  pass35: Object.freeze({
    plan: PASS35_CURVE_PLAN,
    assets: PASS35_CURVE_ASSETS,
    scenes: PASS35_CURVE_SCENES,
    placements: PASS35_CURVE_PLACEMENTS,
    dashGapSprites: PASS35_DASH_GAP_SPRITES,
    cameraSamples: PASS35_CAMERA_SAMPLES,
    assetState: pass35AssetState,
    validate: validatePass35GiantCurveArt,
  }),
  pass36: Object.freeze({
    plan: PASS36_INTERNAL_PLAN,
    assets: PASS36_INTERNAL_ASSETS,
    scenes: PASS36_INTERNAL_SCENES,
    placements: PASS36_INTERNAL_PLACEMENTS,
    wallFaces: PASS36_WALL_FACES,
    cameraSamples: PASS36_CAMERA_SAMPLES,
    assetState: pass36AssetState,
    validate: validatePass36InternalChaseArt,
  }),
  pass37: Object.freeze({
    plan: PASS37_GRAPPLE_PLAN,
    assets: PASS37_GRAPPLE_ASSETS,
    scenes: PASS37_GRAPPLE_SCENES,
    placements: PASS37_GRAPPLE_PLACEMENTS,
    cameraSamples: PASS37_CAMERA_SAMPLES,
    assetState: pass37AssetState,
    validate: validatePass37GrappleDashArt,
  }),
  pass38: Object.freeze({
    plan: PASS38_PRECISION_PLAN,
    assets: PASS38_PRECISION_ASSETS,
    scenes: PASS38_PRECISION_SCENES,
    placements: PASS38_PRECISION_PLACEMENTS,
    cameraSamples: PASS38_CAMERA_SAMPLES,
    assetState: pass38AssetState,
    validate: validatePass38PrecisionCurveArt,
  }),
  pass39: Object.freeze({
    plan: PASS39_BRIDGE_PLAN,
    assets: PASS39_BRIDGE_ASSETS,
    scenes: PASS39_BRIDGE_SCENES,
    placements: PASS39_BRIDGE_PLACEMENTS,
    cameraSamples: PASS39_CAMERA_SAMPLES,
    assetState: pass39AssetState,
    validate: validatePass39BridgeAftershockArt,
  }),
  runtime,
  audit: () => runtime.audit(),
  debug: () => runtime.getDebugState(),
});
