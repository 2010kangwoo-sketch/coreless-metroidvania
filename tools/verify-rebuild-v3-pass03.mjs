import fs from "node:fs";
import path from "node:path";
import { PASS02_WORLD } from "../src/v3/pass02-graybox.js";
import {
  CAMERA_PHYSICS,
  PLAYER_PHYSICS,
  createPlayer,
  stepCamera,
  stepPlayer,
} from "../src/v3/player-physics.js";
import {
  PASS03_FEEL_TARGETS,
  PASS03_MOTION_VISUAL,
  validatePass03Feel,
} from "../src/v3/pass03-feel.js";

const DT = 1 / 120;
const neutral = Object.freeze({ left: false, right: false, jumpPressed: false, jumpHeld: false });
const floor = Object.freeze([{ id: "floor", x: 0, y: 760, width: 1800, height: 140, role: "terrain" }]);
const within = (value, range) => value >= range[0] && value <= range[1];

function groundedPlayer(x = 300) {
  const player = createPlayer(x, PASS02_WORLD.floorY - PLAYER_PHYSICS.height);
  player.grounded = true;
  return player;
}

function measureReversal(grounded) {
  let player = grounded ? groundedPlayer() : createPlayer(300, 420);
  player.vx = PLAYER_PHYSICS.runSpeed;
  player.vy = grounded ? 0 : 100;
  let zeroTime = null;
  let oppositeNinetyTime = null;
  for (let frame = 0; frame < 180; frame += 1) {
    const beforeVx = player.vx;
    player = stepPlayer(player, { ...neutral, left: true }, DT, grounded ? floor : []);
    if (zeroTime === null && beforeVx > 0 && player.vx <= 0) zeroTime = (frame + 1) * DT;
    if (oppositeNinetyTime === null && player.vx <= -PLAYER_PHYSICS.runSpeed * 0.9) {
      oppositeNinetyTime = (frame + 1) * DT;
      break;
    }
  }
  return { zeroTime, oppositeNinetyTime, finalVx: player.vx };
}

function measureAirMomentum() {
  let player = createPlayer(300, 300);
  player.vx = PLAYER_PHYSICS.runSpeed;
  for (let frame = 0; frame < 60; frame += 1) player = stepPlayer(player, neutral, DT, []);
  return {
    retainedSpeed: player.vx,
    retentionRatio: player.vx / PLAYER_PHYSICS.runSpeed,
  };
}

function measureAirDirectionChange() {
  let player = createPlayer(300, 300);
  player.vx = PLAYER_PHYSICS.runSpeed;
  for (let frame = 0; frame < 30; frame += 1) {
    player = stepPlayer(player, { ...neutral, left: true }, DT, []);
  }
  return {
    finalVx: player.vx,
    velocityChange: PLAYER_PHYSICS.runSpeed - player.vx,
  };
}

function measureEdgeCorrection() {
  const step = [{ id: "edge-step", x: 100, y: 700, width: 220, height: 60, role: "practice" }];
  let near = createPlayer(60, 637);
  near.vx = 420;
  near.vy = 20;
  near = stepPlayer(near, { ...neutral, right: true }, DT, step);
  const correction = 637 - near.y;

  let tooLow = createPlayer(60, 650);
  tooLow.vx = 420;
  tooLow.vy = 20;
  tooLow = stepPlayer(tooLow, { ...neutral, right: true }, DT, step);
  return {
    corrected: near.edgeCorrectedThisFrame,
    correction,
    passedEdgeX: near.x > 62,
    rejectedLargeCorrection: !tooLow.edgeCorrectedThisFrame && tooLow.x <= 62,
  };
}

function measureBufferedLandingInput() {
  let player = createPlayer(300, 650);
  player.vy = 270;
  player.jumpsUsed = 1;
  let buffered = false;
  let launched = false;
  let horizontalSpeedAtLaunch = 0;
  for (let frame = 0; frame < 100; frame += 1) {
    const nearLanding = player.y + PLAYER_PHYSICS.height > 742;
    const press = nearLanding && !buffered;
    if (press) buffered = true;
    player = stepPlayer(player, {
      left: false,
      right: true,
      jumpPressed: press,
      jumpHeld: true,
    }, DT, floor);
    if (buffered && player.vy < -500) {
      launched = true;
      horizontalSpeedAtLaunch = player.vx;
      break;
    }
  }
  return { buffered, launched, horizontalSpeedAtLaunch };
}

function measureVerticalCamera() {
  const world = { width: 4800, height: 1800 };
  const desiredScreenY = CAMERA_PHYSICS.viewportHeight / 2 - CAMERA_PHYSICS.verticalBias;
  const base = {
    x: 0,
    y: 500,
    targetX: 0,
    targetY: 500,
  };
  const centeredPlayer = createPlayer(600, 500 + desiredScreenY - PLAYER_PHYSICS.height / 2);
  centeredPlayer.vx = 0;

  const insidePlayer = { ...centeredPlayer, y: centeredPlayer.y + CAMERA_PHYSICS.verticalDeadZone - 12 };
  const inside = stepCamera(base, insidePlayer, DT, world);

  const outsidePlayer = { ...centeredPlayer, y: centeredPlayer.y + CAMERA_PHYSICS.verticalDeadZone + 120 };
  const outside = stepCamera(base, outsidePlayer, DT, world);
  let converged = outside;
  for (let frame = 0; frame < 240; frame += 1) converged = stepCamera(converged, outsidePlayer, DT, world);
  return {
    insideMovement: Math.abs(inside.y - base.y),
    outsideFirstStep: Math.abs(outside.y - base.y),
    outsideTargetDistance: Math.abs(converged.y - converged.targetY),
    targetShift: outside.targetY - base.targetY,
  };
}

const staticAudit = validatePass03Feel();
const groundReversal = measureReversal(true);
const airReversal = measureReversal(false);
const airMomentum = measureAirMomentum();
const airDirection = measureAirDirectionChange();
const edge = measureEdgeCorrection();
const bufferedLanding = measureBufferedLandingInput();
const verticalCamera = measureVerticalCamera();

const checks = [
  ...staticAudit.checks,
  ["groundReversalInTarget", within(groundReversal.oppositeNinetyTime, PASS03_FEEL_TARGETS.reversalToOppositeNinetySeconds)],
  ["groundReversalCrossesZero", groundReversal.zeroTime > 0.16 && groundReversal.zeroTime < 0.3],
  ["airReversalSlowerThanGround", airReversal.oppositeNinetyTime > groundReversal.oppositeNinetyTime],
  ["airMomentumInTarget", within(airMomentum.retentionRatio, PASS03_FEEL_TARGETS.airMomentumRetentionAfterHalfSecond)],
  ["airDirectionChangeInTarget", within(airDirection.velocityChange, PASS03_FEEL_TARGETS.airDirectionChangeAfterQuarterSecond)],
  ["edgeCorrectionOccurs", edge.corrected && edge.passedEdgeX],
  ["edgeCorrectionWithinLimit", edge.correction > 0 && edge.correction <= PLAYER_PHYSICS.maximumEdgeCorrection],
  ["largeEdgeCorrectionRejected", edge.rejectedLargeCorrection],
  ["bufferedLandingJumpWorks", bufferedLanding.buffered && bufferedLanding.launched],
  ["landingPreservesDirectionInput", bufferedLanding.horizontalSpeedAtLaunch > 0],
  ["cameraIgnoresInsideDeadZone", verticalCamera.insideMovement < 0.01],
  ["cameraFollowsOutsideDeadZone", verticalCamera.outsideFirstStep > 0 && verticalCamera.targetShift > 0],
  ["cameraVerticalStepIsSoft", verticalCamera.outsideFirstStep < 8],
  ["cameraVerticalConverges", verticalCamera.outsideTargetDistance < 0.1],
  ["landingVisualRecoveryInTarget", within(PASS03_MOTION_VISUAL.landingRecoverySeconds, PASS03_FEEL_TARGETS.landingVisualRecoverySeconds)],
].map(check => Array.isArray(check)
  ? { name: check[0], passed: Boolean(check[1]) }
  : check);

const result = {
  pass: 3,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    groundReversalZeroSeconds: Number(groundReversal.zeroTime.toFixed(3)),
    groundReversalToOppositeNinetySeconds: Number(groundReversal.oppositeNinetyTime.toFixed(3)),
    airReversalToOppositeNinetySeconds: Number(airReversal.oppositeNinetyTime.toFixed(3)),
    airMomentumRetentionAfterHalfSecond: Number(airMomentum.retentionRatio.toFixed(3)),
    airDirectionVelocityChangeAfterQuarterSecond: Number(airDirection.velocityChange.toFixed(2)),
    edgeCorrectionPixels: Number(edge.correction.toFixed(2)),
    bufferedLandingHorizontalSpeed: Number(bufferedLanding.horizontalSpeedAtLaunch.toFixed(2)),
    verticalCameraInsideDeadZoneMovement: Number(verticalCamera.insideMovement.toFixed(3)),
    verticalCameraOutsideFirstStep: Number(verticalCamera.outsideFirstStep.toFixed(3)),
    verticalCameraFinalError: Number(verticalCamera.outsideTargetDistance.toFixed(3)),
  },
};

if (process.env.CORELESS_V3_PASS03_RESULT) {
  const output = path.resolve(process.env.CORELESS_V3_PASS03_RESULT);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;

