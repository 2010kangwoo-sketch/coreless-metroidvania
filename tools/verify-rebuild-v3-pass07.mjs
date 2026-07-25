import fs from "node:fs";
import path from "node:path";
import {
  PLAYER_PHYSICS,
  createPlayer,
  slopeSurfaceYAt,
  stepPlayer,
} from "../src/v3/player-physics.js";
import {
  PASS07_LAYER,
  PASS07_LIFT,
  PASS07_ROOM_SUMMARIES,
  PASS07_SOLIDS,
  PASS07_TARGETS,
  PASS07_WORLD,
  pass07RoomAtPosition,
  validatePass07LayeredLevel,
} from "../src/v3/pass07-layered-level.js";

const DT = 1 / 120;
const left = Object.freeze({
  left: true,
  right: false,
  jumpPressed: false,
  jumpHeld: false,
});

function measureUpperRoute() {
  const collisionSolids = PASS07_SOLIDS.filter(item => item.role !== "noncollision");
  let player = createPlayer(4660, 636);
  player.grounded = true;
  player.abilities.doubleJump = true;
  const visited = new Set();
  let maximumGroundedStep = 0;
  let airborneFrames = 0;
  let previousY = player.y;
  let unexpectedVerticalDirectionChanges = 0;

  for (let frame = 0; frame < 1000 && player.x > 3210; frame += 1) {
    const before = player;
    player = stepPlayer(player, left, DT, collisionSolids);
    if (player.standingSlopeId) visited.add(player.standingSlopeId);
    if (before.grounded && player.grounded) {
      maximumGroundedStep = Math.max(
        maximumGroundedStep,
        Math.hypot(player.x - before.x, player.y - before.y),
      );
    }
    if (!player.grounded) airborneFrames += 1;
    if (
      player.standingSlopeId === "room4-gentle-climb" &&
      player.y > previousY + 0.01
    ) {
      unexpectedVerticalDirectionChanges += 1;
    }
    previousY = player.y;
  }

  return {
    finalX: player.x,
    finalY: player.y,
    grounded: player.grounded,
    visited: [...visited],
    maximumGroundedStep,
    airborneFrames,
    unexpectedVerticalDirectionChanges,
    westwardDistance: 4660 - player.x,
  };
}

const structuralAudit = validatePass07LayeredLevel();
const upperRoute = measureUpperRoute();
const gentle = PASS07_SOLIDS.find(item => item.id === "room4-gentle-climb");
const crest = PASS07_SOLIDS.find(item => item.id === "room4-crest-stop");
const steep = PASS07_SOLIDS.find(item => item.id === "room4-steep-descent");
const brake = PASS07_SOLIDS.find(item => item.id === "room4-west-brake-exit");
const liftDuration = (PASS07_LIFT.startY - PASS07_LIFT.endY) / PASS07_LIFT.speed;
const lowerRoom = pass07RoomAtPosition({ x: 4700, y: 1500 });
const upperRoom = pass07RoomAtPosition({ x: 4700, y: 700 });

const checks = [
  ...structuralAudit.checks,
  ["roomResolverSeparatesSameColumnByHeight", lowerRoom.id === "r03" && upperRoom.id === "r04"],
  ["gentleMeetsArrival", slopeSurfaceYAt(gentle, gentle.x + gentle.width) === 700],
  ["gentleMeetsCrest", slopeSurfaceYAt(gentle, gentle.x) === crest.y],
  ["steepMeetsCrest", slopeSurfaceYAt(steep, steep.x + steep.width) === crest.y],
  ["steepMeetsBrake", slopeSurfaceYAt(steep, steep.x) === brake.y],
  ["upperRouteVisitsBothPurposefulSlopes", upperRoute.visited.join(",") === "room4-gentle-climb,room4-steep-descent"],
  ["upperRouteStaysGrounded", upperRoute.airborneFrames === 0],
  ["upperRouteMovesWestMeaningfully", upperRoute.westwardDistance >= 1400],
  ["upperRouteEndsOnWestBrake", upperRoute.finalX < 3220 && upperRoute.grounded],
  ["upperRouteStepBounded", upperRoute.maximumGroundedStep <= PASS07_TARGETS.maximumGroundedPositionStep],
  ["gentleClimbNeverMovesDownUnexpectedly", upperRoute.unexpectedVerticalDirectionChanges === 0],
  ["liftDurationReadable", liftDuration >= PASS07_TARGETS.liftDurationSeconds[0] && liftDuration <= PASS07_TARGETS.liftDurationSeconds[1]],
  ["worldSpawnStartsOnLowerTier", PASS07_WORLD.spawn.y >= PASS07_LAYER.lowerY],
  ["roomFourIsOnlyUpperPlayableRoom", PASS07_ROOM_SUMMARIES.filter(room => room.y === 0).length === 1],
].map(check => Array.isArray(check)
  ? { name: check[0], passed: Boolean(check[1]) }
  : check);

const result = {
  pass: 7,
  generatedAt: new Date().toISOString(),
  passed: checks.every(check => check.passed),
  passedCount: checks.filter(check => check.passed).length,
  totalCount: checks.length,
  checks,
  measurements: {
    worldWidth: PASS07_WORLD.width,
    worldHeight: PASS07_WORLD.height,
    playableTiers: new Set(PASS07_ROOM_SUMMARIES.map(room => room.tier)).size,
    lowerRoomY: PASS07_LAYER.lowerY,
    upperRoomY: PASS07_LAYER.upperY,
    tierGap: PASS07_LAYER.tierGap,
    liftTravel: PASS07_LIFT.startY - PASS07_LIFT.endY,
    liftDurationSeconds: Number(liftDuration.toFixed(3)),
    upperRouteWestwardDistance: Number(upperRoute.westwardDistance.toFixed(2)),
    upperRouteMaximumGroundedStep: Number(upperRoute.maximumGroundedStep.toFixed(3)),
    upperRouteAirborneFrames: upperRoute.airborneFrames,
    upperRouteFinalX: Number(upperRoute.finalX.toFixed(2)),
    upperRouteFinalY: Number(upperRoute.finalY.toFixed(2)),
    visitedSlopes: upperRoute.visited,
  },
};

if (process.env.CORELESS_V3_PASS07_RESULT) {
  const output = path.resolve(process.env.CORELESS_V3_PASS07_RESULT);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
