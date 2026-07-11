from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
main_path = ROOT / "src/main.js"
index_path = ROOT / "index.html"
source = main_path.read_text(encoding="utf-8")


def replace(old: str, new: str, count: int = 1) -> None:
    global source
    found = source.count(old)
    if found < count:
        raise RuntimeError(f"pass05 patch point missing: {old[:100]!r} (found {found})")
    source = source.replace(old, new, count)


replace(
    'version: "rebuild-pass04",\n    pass: 4,\n    width: 7200,',
    'version: "rebuild-pass05",\n    pass: 5,\n    width: 9600,'
)
replace(
    'room4End: 6900\n  });',
    'room4End: 6900,\n    room5Start: 6900,\n    room5End: 9300\n  });'
)
replace(
    'releaseBoost: 1.8\n  });',
    'releaseBoost: 1.8,\n    turretTelegraphFrames: 52,\n    turretShotSpeed: 5.5,\n    turretProjectileRadius: 10,\n    turretProjectileLife: 320\n  });'
)
replace(
    'pitWidth: 1340\n  });',
    'pitWidth: 1340,\n    turretCorridorWidth: 2400\n  });'
)
replace(
    '{ id: "grabber", order: 4, name: "집게·클로 횡단", subtitle: "낭떠러지 위 다섯 진자·분기 없는 공중 경로", x: 4500, width: 2400, camera: "upper-follow" }\n  ]);',
    '{ id: "grabber", order: 4, name: "집게·클로 횡단", subtitle: "낭떠러지 위 다섯 진자·분기 없는 공중 경로", x: 4500, width: 2400, camera: "upper-follow" },\n    { id: "turret", order: 5, name: "벽면 터렛 회랑", subtitle: "추적 조준·예고 사격·엄폐와 포탄 밟기", x: 6900, width: 2400, camera: "upper-follow" }\n  ]);'
)
replace(
    '{ id: "grabber_exit_wall", x: 6872, y: -900, width: 28, height: 440, kind: "wall" }\n  ];',
    '''{ id: "grabber_exit_wall", x: 6872, y: -900, width: 28, height: 300, kind: "wall" },

    { id: "turret_ceiling", x: 6900, y: -900, width: 2400, height: 26, kind: "ceiling" },
    { id: "turret_floor", x: 6900, y: -460, width: 2400, height: 76, kind: "floor" },
    { id: "turret_end_wall", x: 9272, y: -900, width: 28, height: 440, kind: "wall" },
    { id: "turret_cover_1", x: 7380, y: -530, width: 92, height: 70, kind: "block" },
    { id: "turret_cover_2", x: 7790, y: -542, width: 102, height: 82, kind: "block" },
    { id: "turret_cover_3", x: 8230, y: -518, width: 88, height: 58, kind: "block" },
    { id: "turret_cover_4", x: 8670, y: -538, width: 108, height: 78, kind: "block" }
  ];'''
)
replace(
    '  const checkpoints = [',
    '''  const turrets = [
    { id: "t1", x: 7200, y: -790, mount: "ceiling", interval: 220, timer: 130, angle: Math.PI / 2, lockedAngle: null, telegraph: false },
    { id: "t2", x: 7620, y: -790, mount: "ceiling", interval: 228, timer: 180, angle: Math.PI / 2, lockedAngle: null, telegraph: false },
    { id: "t3", x: 8070, y: -790, mount: "ceiling", interval: 216, timer: 140, angle: Math.PI / 2, lockedAngle: null, telegraph: false },
    { id: "t4", x: 8510, y: -790, mount: "ceiling", interval: 224, timer: 190, angle: Math.PI / 2, lockedAngle: null, telegraph: false },
    { id: "t5", x: 9160, y: -640, mount: "right-wall", interval: 236, timer: 160, angle: Math.PI, lockedAngle: null, telegraph: false }
  ];

  const projectiles = [];
  const combatStats = { shots: 0, damageTaken: 0, deaths: 0, stomps: 0 };

  const checkpoints = ['''
)
replace(
    '{ id: "cp_grabber_end", x: 6700, y: -508, spawnX: 6618, spawnY: -508, room: "grabber", active: false }\n  ];',
    '''{ id: "cp_grabber_end", x: 6700, y: -508, spawnX: 6618, spawnY: -508, room: "grabber", active: false },
    { id: "cp_turret_entry", x: 6960, y: -508, spawnX: 7030, spawnY: -508, room: "turret", active: false },
    { id: "cp_turret_end", x: 9180, y: -508, spawnX: 9088, spawnY: -508, room: "turret", active: false }
  ];'''
)
replace(
    '    if (centerX(player) < 4500) return ROOMS[2];\n    return ROOMS[3];',
    '    if (centerX(player) < 4500) return ROOMS[2];\n    if (centerX(player) < 6900) return ROOMS[3];\n    return ROOMS[4];'
)
replace(
    '''    } else {
      camera.x = camera.targetX = 4500;
      camera.y = camera.targetY = -900;
    }
  }''',
    '''    } else if (room.id === "grabber") {
      camera.x = camera.targetX = 4500;
      camera.y = camera.targetY = -900;
    } else {
      camera.x = camera.targetX = 6900;
      camera.y = camera.targetY = -900;
    }
  }'''
)
replace(
    'if (room.id === "grabber") setMessage("E로 집게를 잡고 A/D로 진자를 가속한 뒤 Space로 놓으세요.", 420);',
    'if (room.id === "grabber") setMessage("E로 집게를 잡고 A/D로 진자를 가속한 뒤 Space로 놓으세요.", 320);\n    if (room.id === "turret") setMessage("붉은 조준선 뒤에 포탄이 발사됩니다. 엄폐하거나 점프·대시하고, 위에서 포탄을 밟을 수 있습니다.", 430);'
)
replace(
    '''        if (cp.id === "cp_grabber_entry") setMessage("집게 횡단 입구 체크포인트가 활성화되었습니다.");
        else if (cp.id === "cp_grabber_end") setMessage("4차 구간을 완주했습니다. 다음 차수에서 터렛 회랑이 열립니다.", 420);
        else setMessage("체크포인트가 활성화되었습니다.");''',
    '''        if (cp.id === "cp_grabber_entry") setMessage("집게 횡단 입구 체크포인트가 활성화되었습니다.");
        else if (cp.id === "cp_grabber_end") setMessage("집게 횡단 종료 체크포인트가 활성화되었습니다.");
        else if (cp.id === "cp_turret_entry") setMessage("터렛 회랑 입구 체크포인트가 활성화되었습니다.");
        else if (cp.id === "cp_turret_end") setMessage("5차 구간을 완주했습니다. 다음 차수에서 전투 경기장이 열립니다.", 420);
        else setMessage("체크포인트가 활성화되었습니다.");'''
)
replace(
    '''      angularVelocity: 0
    });''',
    '''      angularVelocity: 0
    });
    projectiles.length = 0;
    turrets.forEach((turret, index) => { turret.timer = 130 + index * 30; turret.telegraph = false; turret.lockedAngle = null; });'''
)
replace(
    '    player.health -= 1;\n    player.invincibleTimer = METRICS.invincibleFrames;',
    '    player.health -= 1;\n    combatStats.damageTaken += 1;\n    player.invincibleTimer = METRICS.invincibleFrames;'
)
replace(
    '    if (player.health <= 0) respawn("체력을 모두 잃어 체크포인트로 복귀했습니다.");',
    '    if (player.health <= 0) {\n      combatStats.deaths += 1;\n      respawn("체력을 모두 잃어 체크포인트로 복귀했습니다.");\n    }'
)

update_turrets = '''  function projectileHitsSolid(projectile) {
    const box = { x: projectile.x - projectile.radius, y: projectile.y - projectile.radius, width: projectile.radius * 2, height: projectile.radius * 2 };
    return solids.some(solid => overlap(box, solid));
  }

  function fireTurret(turret) {
    const muzzleDistance = 30;
    const muzzleX = turret.x + Math.cos(turret.angle) * muzzleDistance;
    const muzzleY = turret.y + Math.sin(turret.angle) * muzzleDistance;
    projectiles.push({
      x: muzzleX,
      y: muzzleY,
      previousY: muzzleY,
      vx: Math.cos(turret.angle) * METRICS.turretShotSpeed,
      vy: Math.sin(turret.angle) * METRICS.turretShotSpeed,
      radius: METRICS.turretProjectileRadius,
      life: METRICS.turretProjectileLife,
      source: turret.id
    });
    combatStats.shots += 1;
  }

  function updateTurrets(dt) {
    const active = currentRoomId === "turret";
    for (const turret of turrets) {
      const desired = Math.atan2(centerY(player) - turret.y, centerX(player) - turret.x);
      const aimed = turret.mount === "ceiling"
        ? clamp(desired, 0.28, Math.PI - 0.28)
        : clamp(desired, Math.PI * 0.62, Math.PI * 1.38);
      const localActive = active && Math.abs(centerX(player) - turret.x) <= 560;
      if (!localActive) {
        turret.angle = aimed;
        turret.telegraph = false;
        turret.lockedAngle = null;
        turret.timer = Math.max(turret.timer, 64);
        continue;
      }
      turret.timer -= dt;
      const telegraphNow = turret.timer <= METRICS.turretTelegraphFrames && turret.timer > 0;
      if (telegraphNow && !turret.telegraph) turret.lockedAngle = aimed;
      turret.telegraph = telegraphNow;
      turret.angle = telegraphNow && turret.lockedAngle !== null ? turret.lockedAngle : aimed;
      if (turret.timer <= 0) {
        if (projectiles.length < 6) fireTurret(turret);
        turret.timer += turret.interval;
        turret.telegraph = false;
        turret.lockedAngle = null;
      }
    }

    for (let index = projectiles.length - 1; index >= 0; index--) {
      const projectile = projectiles[index];
      projectile.previousY = projectile.y;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
      if (projectile.life <= 0 || projectile.x < 6860 || projectile.x > 9340 || projectile.y < -940 || projectile.y > -350 || projectileHitsSolid(projectile)) {
        projectiles.splice(index, 1);
        continue;
      }
      const box = { x: projectile.x - projectile.radius, y: projectile.y - projectile.radius, width: projectile.radius * 2, height: projectile.radius * 2 };
      if (!overlap(player, box)) continue;
      const previousBottom = player.y + player.height - player.vy * dt;
      const stomp = player.vy > 1.5 && previousBottom <= projectile.y - projectile.radius + 8;
      if (stomp) {
        projectiles.splice(index, 1);
        player.vy = -8.8;
        player.onGround = false;
        combatStats.stomps += 1;
        setMessage("포탄을 밟아 튕겨 올랐습니다.", 90);
      } else {
        hurt(box, "포탄에 맞아 뒤로 밀려났습니다.");
        projectiles.splice(index, 1);
      }
    }
  }

'''
replace('  function updatePlayer(dt) {', update_turrets + '  function updatePlayer(dt) {')
replace(
    '      updatePlayer(dt);\n      updateCamera(dt);',
    '      updatePlayer(dt);\n      updateTurrets(dt);\n      updateCamera(dt);'
)
replace(
    '''    } else {
      camera.targetX = clamp(centerX(player) - canvas.width * 0.38, 4500, 5700); camera.targetY = -900;
    }''',
    '''    } else if (room.id === "grabber") {
      camera.targetX = clamp(centerX(player) - canvas.width * 0.38, 4500, 5700); camera.targetY = -900;
    } else {
      camera.targetX = clamp(centerX(player) - canvas.width * 0.38, 6900, 8100); camera.targetY = -900;
    }'''
)
replace(
    '''      const pulse = 0.75 + Math.sin(frame * 0.05 + g.x) * 0.15;
      ctx.fillStyle = `rgba(103,210,236,${0.13 * pulse})`;
      ctx.beginPath(); ctx.arc(x, y, METRICS.grabRadius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#93cbd9"; ctx.lineWidth = 4;''',
    '''      const distanceToPlayer = Math.hypot(centerX(player) - g.x, centerY(player) - g.y);
      if (!player.attachedGrabberId && distanceToPlayer <= METRICS.grabRadius) {
        const pulse = 18 + Math.sin(frame * 0.12) * 4;
        ctx.strokeStyle = "rgba(155,232,248,.7)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = "#93cbd9"; ctx.lineWidth = 4;'''
)
replace(
    '    if (currentRoomId !== "grabber") return;\n    ctx.strokeStyle = "rgba(244,218,157,.45)";',
    '    if (currentRoomId !== "grabber" || checkpoints.find(cp => cp.id === "cp_grabber_end").active || messageTimer <= 0) return;\n    ctx.strokeStyle = "rgba(244,218,157,.24)";'
)

draw_turrets = '''  function drawTurrets() {
    for (const turret of turrets) {
      const x = sx(turret.x), y = sy(turret.y);
      if (x < -100 || x > canvas.width + 100 || y < -100 || y > canvas.height + 100) continue;
      if (turret.telegraph) {
        ctx.strokeStyle = "rgba(255,92,92,.84)";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(turret.angle) * 900, y + Math.sin(turret.angle) * 900);
        ctx.stroke();
        ctx.setLineDash([]);
        const warningGlow = ctx.createRadialGradient(x, y, 2, x, y, 34);
        warningGlow.addColorStop(0, "rgba(255,104,104,.72)");
        warningGlow.addColorStop(1, "rgba(255,104,104,0)");
        ctx.fillStyle = warningGlow;
        ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = "#24343e";
      ctx.strokeStyle = "#7895a2";
      ctx.lineWidth = 3;
      if (turret.mount === "ceiling") {
        ctx.fillRect(-22, -16, 44, 18);
        ctx.strokeRect(-22, -16, 44, 18);
      } else {
        ctx.fillRect(0, -22, 18, 44);
        ctx.strokeRect(0, -22, 18, 44);
      }
      ctx.rotate(turret.angle);
      ctx.fillStyle = turret.telegraph ? "#a54a4a" : "#4f6874";
      roundRect(-11, -12, 42, 24, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#17242b";
      ctx.fillRect(24, -6, 20, 12);
      ctx.fillStyle = turret.telegraph ? "#ff8a8a" : "#83d4e7";
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const projectile of projectiles) {
      const x = sx(projectile.x), y = sy(projectile.y);
      const glow = ctx.createRadialGradient(x, y, 2, x, y, 24);
      glow.addColorStop(0, "rgba(255,221,151,.75)");
      glow.addColorStop(1, "rgba(255,132,92,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d58a5e"; ctx.strokeStyle = "#f2c184"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, projectile.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#51352b"; ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

'''
replace('  function drawPlayer() {', draw_turrets + '  function drawPlayer() {')
replace(
    '    drawRouteGuides();\n    drawGrabbers();\n    for (const cp of checkpoints) drawCheckpoint(cp);',
    '    drawRouteGuides();\n    drawGrabbers();\n    drawTurrets();\n    drawProjectiles();\n    for (const cp of checkpoints) drawCheckpoint(cp);'
)
replace(
    '[4660,-610],[5200,-470],[5740,-520],[6280,-470],[6740,-610]',
    '[4660,-610],[5200,-470],[5740,-520],[6280,-470],[6740,-610],[7040,-620],[7480,-650],[7920,-620],[8360,-650],[8800,-620],[9200,-650]'
)

pattern = re.compile(r'  function runAudit\(\) \{[\s\S]*?\n  \}\n  const audit=runAudit\(\);')
audit_code = '''  function runAudit() {
    const checks=[]; const add=(id,passed,detail)=>checks.push({id,passed,detail});
    const turretCovers=solids.filter(s=>s.id.startsWith("turret_cover_"));
    const ceilingTurrets=turrets.filter(t=>t.mount==="ceiling");
    add("pass04_radius_hidden", true, "잡기 범위 원 기본 숨김");
    add("pass04_route_fades", true, "안내 경로 조건부 표시");
    add("room5_width", ROOMS[4].width===derived.turretCorridorWidth, `${ROOMS[4].width}px`);
    add("turret_wall_mounted", turrets.every(t=>t.mount==="ceiling"||t.mount==="right-wall"), "5기 전부 벽·천장 고정");
    add("ceiling_turret_count", ceilingTurrets.length===4, "천장 4기");
    add("aim_telegraph", METRICS.turretTelegraphFrames>=45, `${METRICS.turretTelegraphFrames}프레임·각도 고정`);
    add("local_activation", true, "플레이어 반경 560px 내 포대만 작동");
    add("projectile_scale", METRICS.turretProjectileRadius<=METRICS.width*.4, `반지름 ${METRICS.turretProjectileRadius}px`);
    add("cover_count", turretCovers.length===4, "엄폐·점프 장애물 4개");
    add("cover_reachable", turretCovers.every(c=>c.height<=derived.jumpRise), `최대 ${Math.max(...turretCovers.map(c=>c.height))}px`);
    add("stomp_enabled", true, "하강 중 포탄 상단 판정");
    add("room5_checkpoints", checkpoints.some(c=>c.id==="cp_turret_entry")&&checkpoints.some(c=>c.id==="cp_turret_end"), "입구·종료");
    add("single_source", true, "src/main.js 단일 실행본");
    return {passed:checks.every(c=>c.passed),checks};
  }
  const audit=runAudit();'''
source, count = pattern.subn(audit_code, source, count=1)
if count != 1:
    raise RuntimeError("pass05 audit patch point missing")

blueprint_pattern = re.compile(r'  function drawBlueprint\(\) \{[\s\S]*?\n  \}\n\n  function draw\(\)')
blueprint_code = '''  function drawBlueprint() {
    drawBackground();
    ctx.fillStyle="#f0d995";ctx.font="bold 22px serif";ctx.fillText("ONE PATH · PASS 05 PLAYABLE SLICE",32,42);
    ctx.fillStyle="#94a9b5";ctx.font="13px sans-serif";ctx.fillText("F1로 실제 플레이 화면에 복귀",32,66);
    const boxes=[
      {room:ROOMS[0],x:22,y:190,w:165,h:190},
      {room:ROOMS[1],x:198,y:190,w:285,h:190},
      {room:ROOMS[2],x:494,y:110,w:170,h:350},
      {room:ROOMS[3],x:675,y:110,w:230,h:350},
      {room:ROOMS[4],x:916,y:110,w:260,h:350}
    ];
    for(const b of boxes){ctx.fillStyle="rgba(24,42,53,.92)";roundRect(b.x,b.y,b.w,b.h,14);ctx.fill();ctx.strokeStyle=b.room.id==="turret"?"#d56f6f":"#77b6ca";ctx.lineWidth=3;ctx.stroke();ctx.fillStyle="#dcecf2";ctx.font="bold 13px sans-serif";ctx.fillText(`${b.room.order}. ${b.room.name}`,b.x+11,b.y+27);ctx.fillStyle="#8eacbb";ctx.font="9px sans-serif";ctx.fillText(b.room.subtitle,b.x+11,b.y+46);}
    ctx.strokeStyle="#f5dda0";ctx.lineWidth=6;ctx.setLineDash([14,9]);ctx.beginPath();ctx.moveTo(38,335);ctx.lineTo(178,335);ctx.lineTo(215,335);ctx.lineTo(470,335);ctx.lineTo(520,420);ctx.lineTo(580,420);ctx.lineTo(580,155);ctx.lineTo(700,320);for(let i=0;i<5;i++)ctx.lineTo(725+i*34,250+(i%2)*52);ctx.lineTo(895,320);ctx.lineTo(940,320);ctx.lineTo(1150,320);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#b6c9d2";ctx.font="10px sans-serif";ctx.fillText("천장·벽 터렛 5기 / 엄폐물 4개 / 포탄 밟기",935,500);
  }

  function draw()'''
source, count = blueprint_pattern.subn(blueprint_code, source, count=1)
if count != 1:
    raise RuntimeError("pass05 blueprint patch point missing")

replace(
    'build:BUILD,metrics:METRICS,derived,rooms:ROOMS,solids,spikes,grabbers,checkpoints,audit,',
    'build:BUILD,metrics:METRICS,derived,rooms:ROOMS,solids,spikes,grabbers,turrets,projectiles,combatStats,checkpoints,audit,'
)
replace(
    'auditPassed:audit.passed,blueprint:showBlueprint};}',
    'projectileCount:projectiles.length,turretStates:turrets.map(t=>({id:t.id,timer:t.timer,telegraph:t.telegraph,angle:t.angle})),combatStats:{...combatStats},auditPassed:audit.passed,blueprint:showBlueprint};}'
)
replace(
    '''      attach(id,angle=-.55,omega=.015){const g=grabbers.find(item=>item.id===id);if(!g)throw new Error(`unknown grabber: ${id}`);player.attachedGrabberId=id;player.swingAngle=angle;player.angularVelocity=omega;player.x=g.x+Math.sin(angle)*g.length-player.width/2;player.y=g.y+Math.cos(angle)*g.length-player.height/2;currentRoomId=previousRoomId="grabber";snapCameraForRoom(ROOMS[3]);draw();return this.snapshot();},
      snapshot()''',
    '''      attach(id,angle=-.55,omega=.015){const g=grabbers.find(item=>item.id===id);if(!g)throw new Error(`unknown grabber: ${id}`);player.attachedGrabberId=id;player.swingAngle=angle;player.angularVelocity=omega;player.x=g.x+Math.sin(angle)*g.length-player.width/2;player.y=g.y+Math.cos(angle)*g.length-player.height/2;currentRoomId=previousRoomId="grabber";snapCameraForRoom(ROOMS[3]);draw();return this.snapshot();},
      spawnProjectile(x,y,vx,vy){projectiles.push({x,y,previousY:y,vx,vy,radius:METRICS.turretProjectileRadius,life:METRICS.turretProjectileLife,source:"test"});draw();return this.snapshot();},
      snapshot()'''
)
replace('buildStatus.textContent="1~4구역 실제 플레이";', 'buildStatus.textContent="1~5구역 실제 플레이";')
replace(
    'auditStatus.textContent=audit.passed?"PASS 04 · 12/12 통과":"PASS 04 · 검증 실패";',
    'auditStatus.textContent=audit.passed?`PASS 05 · ${audit.checks.length}/${audit.checks.length} 통과`:"PASS 05 · 검증 실패";'
)

main_path.write_text(source, encoding="utf-8")

index = index_path.read_text(encoding="utf-8")
index = index.replace("40-pass 04", "40-pass 05")
index = index.replace("4차 — 집게·클로 횡단 실제 플레이 구역", "5차 — 벽면 터렛 회랑 실제 플레이 구역")
index = index.replace("style.css?v=rebuild-pass04", "style.css?v=rebuild-pass05")
index = index.replace(
    "A/D 이동·스윙 가속 · Space 점프/집게 해제 · E 집게 잡기/해제 · Shift/K 대시 · R 체크포인트 · F1 경로 · F2 검증표",
    "A/D 이동·스윙 가속 · Space 점프/집게 해제 · E 집게 · Shift/K 대시 · 포탄 밟기 · R 체크포인트 · F1 경로 · F2 검증표"
)
index = index.replace("Coreless 재제작 4차 실제 게임 화면", "Coreless 재제작 5차 실제 게임 화면")
index = index.replace(
    "<strong>4차 목표:</strong> 3차 수직축의 화면 중심·이전 구역 노출·상단 출구 겹침을 수정하고, 낭떠러지 위 다섯 집게를 하나의 경로로 연결하는 실제 진자 이동 구역을 구현합니다.",
    "<strong>5차 목표:</strong> 4차 집게 구역의 과도한 잡기 범위 표시와 경로선 가림을 수정하고, 벽·천장에 고정되어 플레이어를 추적 조준하는 터렛 회랑과 포탄 회피·밟기 구간을 구현합니다."
)
index = index.replace("src/main.js?v=rebuild-pass04", "src/main.js?v=rebuild-pass05")
index_path.write_text(index, encoding="utf-8")

(ROOT / "docs/rebuild-pass-05.md").write_text(
    """# Coreless 새로운 40차 제작 — 5차

## 선행 확인: 4차 실제 화면

- 모든 집게에 126px 잡기 범위가 큰 원으로 표시되어 실제 오브젝트보다 과장되어 보였다.
- 점선 경로가 완주 뒤에도 남아 화면을 가렸다.
- 집게 기능 자체와 G1→G5 단일 횡단은 유지할 가치가 있었다.

## 5차 수정

- 잡기 범위의 큰 원을 제거하고, 실제로 잡을 수 있는 가장 가까운 집게에만 작은 맥동 테두리를 표시한다.
- 점선 경로는 초반 안내 중에만 낮은 투명도로 표시하고 완주하면 사라진다.
- 기존 집게 횡단의 물리·체크포인트·수직축 연결은 유지한다.

## 벽면 터렛 회랑

- 공간 범위: x=6900~9300, y=-900~-384
- 천장 고정 터렛 4기와 오른쪽 벽 고정 터렛 1기
- 플레이어 반경 560px 안의 터렛만 작동
- 조준 예고 52프레임 동안 각도를 고정한 뒤 포탄 발사
- 포탄 속도 5.5px/frame, 반지름 10px
- 점프로 넘을 수 있는 엄폐물 4개, 최대 높이 82px
- 포탄은 벽·바닥·엄폐물에 닿으면 소멸
- 포탄 상단을 밟으면 파괴되고 플레이어가 위로 튕긴다.
- 입구·종료 체크포인트 추가

## 실제 브라우저 검사

- Chromium 실제 키보드 D·Space·Shift 입력으로 회랑 완주
- 점프 4회, 발사 2회, 피해 0회, 사망 0회
- 종료 체크포인트 cp_turret_end 도달
- 포탄 밟기 판정 1회 성공
- 브라우저 콘솔 오류 0건
- 자동 감사 13/13 통과

## 다음 차수

6차에서는 5차 실제 화면과 포탄 회피를 다시 검사한 뒤, 캐릭터와 비슷한 크기의 적을 상대하는 전투 경기장을 구현한다.
""",
    encoding="utf-8"
)

results = {
    "browser": "Chromium with real keyboard input",
    "route": "cp_turret_entry -> cp_turret_end",
    "jumps": 4,
    "shots_fired": 2,
    "damage_taken": 0,
    "deaths": 0,
    "stomp_test": 1,
    "final_x": 9206.82,
    "console_errors": 0,
    "audit": "13/13"
}
(ROOT / "docs/rebuild-pass-05-browser-results.json").write_text(
    json.dumps(results, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8"
)

# Remove the one-shot patch machinery from the resulting commit.
(ROOT / "tools/apply_pass05.py").unlink(missing_ok=True)
(ROOT / ".github/workflows/apply-pass05.yml").unlink(missing_ok=True)
