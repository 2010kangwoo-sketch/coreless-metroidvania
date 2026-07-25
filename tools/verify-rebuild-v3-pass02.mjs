import fs from "node:fs";
import path from "node:path";
import {
  PASS02_ROOM_SUMMARIES,
  PASS02_SOLIDS,
  PASS02_TUNING_TARGETS,
  PASS02_WORLD,
  validatePass02Graybox,
} from "../src/v3/pass02-graybox.js";
import {
  CAMERA_PHYSICS,
  PLAYER_PHYSICS,
  createCamera,
  createPlayer,
  stepCamera,
  stepPlayer,
} from "../src/v3/player-physics.js";

const DT = 1 / 120;
const neutral = Object.freeze({ left: false, right: false, jumpPressed: false, jumpHeld: false });
const within = (value, [minimum, maximum]) => value >= minimum && value <= maximum;
const floorOnly = PASS02_SOLIDS.filter(solid => solid.id === "room1-floor");

function groundedPlayer(x = 180) {
  const player = createPlayer(x, PASS02_WORLD.floorY - PLAYER_PHYSICS.height);
  player.grounded = true;
  return player;
}

function measureAcceleration() {
  let player = groundedPlayer();
  let timeToNinety = null;
  for (let frame = 0; frame < 180; frame += 1) {
    player = stepPlayer(player, { ...neutral, right: true }, DT, floorOnly);
    if (timeToNinety === null && player.vx >= PLAYER_PHYSICS.runSpeed * 0.9) {
      timeToNinety = (frame + 1) * DT;
    }
  }
  return { maximumSpeed: player.vx, timeToNinety };
}

function measureStop() {
  let player = groundedPlayer();
  player.vx = PLAYER_PHYSICS.runSpeed;
  let previous = player.vx;
  let monotonic = true;
  let stopTime = null;
  for (let frame = 0; frame < 120; frame += 1) {
    player = stepPlayer(player, neutral, DT, floorOnly);
    monotonic &&= Math.abs(player.vx) <= Math.abs(previous) + 0.001;
    previous = player.vx;
    if (stopTime === null && Math.abs(player.vx) < 1) stopTime = (frame + 1) * DT;
  }
  return { stopTime, monotonic, finalSpeed: player.vx };
}

function measureJump(holdSeconds, doubleJumpAt = null) {
  let player = groundedPlayer();
  player.abilities.doubleJump = doubleJumpAt !== null;
  let minimumY = player.y;
  let landed = false;
  let doubleJumpTriggered = false;
  let airborneFrames = 0;
  for (let frame = 0; frame < 360; frame += 1) {
    const time = frame * DT;
    const doublePress = doubleJumpAt !== null && !doubleJumpTriggered && time >= doubleJumpAt;
    if (doublePress) doubleJumpTriggered = true;
    const input = {
      left: false,
      right: false,
      jumpPressed: frame === 0 || doublePress,
      jumpHeld: time < holdSeconds || (doubleJumpAt !== null && time >= doubleJumpAt && time < doubleJumpAt + 0.28),
    };
    player = stepPlayer(player, input, DT, floorOnly);
    minimumY = Math.min(minimumY, player.y);
    if (!player.grounded) airborneFrames += 1;
    if (frame > 8 && player.grounded) {
      landed = true;
      break;
    }
  }
  return {
    height: PASS02_WORLD.floorY - PLAYER_PHYSICS.height - minimumY,
    landed,
    airborneSeconds: airborneFrames * DT,
    jumpsUsedAtEnd: player.jumpsUsed,
    minimumY,
  };
}

function measureBufferedJump() {
  let player = createPlayer(180, 650);
  player.vy = 260;
  player.jumpsUsed = 1;
  let buffered = false;
  let launched = false;
  for (let frame = 0; frame < 80; frame += 1) {
    const nearFloor = player.y + PLAYER_PHYSICS.height > PASS02_WORLD.floorY - 18;
    const press = nearFloor && !buffered;
    if (press) buffered = true;
    player = stepPlayer(player, { ...neutral, jumpPressed: press, jumpHeld: true }, DT, floorOnly);
    if (buffered && player.vy < -500) launched = true;
  }
  return { buffered, launched };
}

function measureCoyoteJump() {
  const ledge = [{ id: "ledge", x: 0, y: 760, width: 230, height: 140 }];
  let player = groundedPlayer(185);
  player.vx = PLAYER_PHYSICS.runSpeed;
  let leftGroundAt = null;
  let jumped = false;
  for (let frame = 0; frame < 80; frame += 1) {
    const time = frame * DT;
    const press = leftGroundAt !== null && time - leftGroundAt >= 0.055 && !jumped;
    player = stepPlayer(player, { ...neutral, right: true, jumpPressed: press, jumpHeld: true }, DT, ledge);
    if (!player.grounded && leftGroundAt === null && player.vy >= 0) leftGroundAt = time;
    if (press && player.vy < -500) jumped = true;
  }
  return { leftGroundAt, jumped };
}

function measureLanding() {
  let player = createPlayer(350, 300);
  player.vy = 0;
  let landed = false;
  let penetrated = false;
  for (let frame = 0; frame < 240; frame += 1) {
    player = stepPlayer(player, neutral, DT, floorOnly);
    penetrated ||= player.y + PLAYER_PHYSICS.height > PASS02_WORLD.floorY + 0.01;
    if (player.grounded) {
      landed = true;
      break;
    }
  }
  return { landed, penetrated, restingY: player.y, restingVelocity: player.vy };
}

function measureCamera() {
  const player = groundedPlayer(180);
  let camera = createCamera(player);
  let maximumStep = 0;
  const initialDistance = Math.abs(camera.x - 1200);
  for (let frame = 0; frame < 120; frame += 1) {
    const movingPlayer = { ...player, x: 1800, vx: PLAYER_PHYSICS.runSpeed };
    const next = stepCamera(camera, movingPlayer, DT, PASS02_WORLD);
    maximumStep = Math.max(maximumStep, Math.abs(next.x - camera.x));
    camera = next;
  }
  const finalDistance = Math.abs(camera.x - camera.targetX);
  return { maximumStep, initialDistance, finalDistance, camera };
}

const structureAudit = validatePass02Graybox();
const acceleration = measureAcceleration();
const stopping = measureStop();
const shortJump = measureJump(0.055);
const fullJump = measureJump(0.5);
const doubleJump = measureJump(0.5, 0.34);
const bufferedJump = measureBufferedJump();
const coyoteJump = measureCoyoteJump();
const landing = measureLanding();
const camera = measureCamera();
const additionalDoubleJumpHeight = doubleJump.height - fullJump.height;

const checks = [
  ["topSpeedInTarget", within(acceleration.maximumSpeed, PASS02_TUNING_TARGETS.horizontalTopSpeed)],
  ["accelerationTimeInTarget", within(acceleration.timeToNinety, PASS02_TUNING_TARGETS.timeToNinetyPercentSpeed)],
  ["groundStopInTarget", within(stopping.stopTime, PASS02_TUNING_TARGETS.groundStopTime)],
  ["decelerationMonotonic", stopping.monotonic && Math.abs(stopping.finalSpeed) < 0.01],
  ["shortJumpInTarget", within(shortJump.height, PASS02_TUNING_TARGETS.shortJumpHeight)],
  ["fullJumpInTarget", within(fullJump.height, PASS02_TUNING_TARGETS.fullJumpHeight)],
  ["variableJumpMeaningful", fullJump.height - shortJump.height >= 35],
  ["singleJumpLands", shortJump.landed && fullJump.landed],
  ["doubleJumpInTarget", within(additionalDoubleJumpHeight, PASS02_TUNING_TARGETS.doubleJumpAdditionalHeight)],
  ["doubleJumpLands", doubleJump.landed],
  ["jumpBufferWorks", bufferedJump.buffered && bufferedJump.launched],
  ["coyoteJumpWorks", coyoteJump.leftGroundAt !== null && coyoteJump.jumped],
  ["landingWithoutPenetration", landing.landed && !landing.penetrated],
  ["landingVelocityCleared", landing.restingVelocity === 0],
  ["landingHeightExact", Math.abs(landing.restingY - (PASS02_WORLD.floorY - PLAYER_PHYSICS.height)) < 0.01],
  ["cameraMovesGradually", camera.maximumStep > 0 && camera.maximumStep < 80],
  ["cameraConverges", camera.finalDistance < 2],
  ["cameraHalfLifeInTarget", within(CAMERA_PHYSICS.followHalfLife, PASS02_TUNING_TARGETS.cameraFollowHalfLifeSeconds)],
  ["coyoteTuningInTarget", within(PLAYER_PHYSICS.coyoteTime, PASS02_TUNING_TARGETS.coyoteTimeSeconds)],
  ["bufferTuningInTarget", within(PLAYER_PHYSICS.jumpBufferTime, PASS02_TUNING_TARGETS.jumpBufferSeconds)],
].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
checks.unshift(...structureAudit.checks);

const result = {
  pass: 2,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    rooms: PASS02_ROOM_SUMMARIES.length,
    topSpeed: Number(acceleration.maximumSpeed.toFixed(2)),
    timeToNinetyPercentSpeed: Number(acceleration.timeToNinety.toFixed(3)),
    groundStopTime: Number(stopping.stopTime.toFixed(3)),
    shortJumpHeight: Number(shortJump.height.toFixed(2)),
    fullJumpHeight: Number(fullJump.height.toFixed(2)),
    doubleJumpHeight: Number(doubleJump.height.toFixed(2)),
    doubleJumpAdditionalHeight: Number(additionalDoubleJumpHeight.toFixed(2)),
    jumpBufferWorks: bufferedJump.launched,
    coyoteJumpWorks: coyoteJump.jumped,
    cameraMaximumStepAt120Hz: Number(camera.maximumStep.toFixed(3)),
    cameraFinalError: Number(camera.finalDistance.toFixed(3)),
  },
};

if (process.env.CORELESS_V3_PASS02_RESULT) {
  const output = path.resolve(process.env.CORELESS_V3_PASS02_RESULT);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
