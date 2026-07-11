(async function loadCorelessPass16() {
  const canvas = document.getElementById("gameCanvas");
  const loadStatus = document.getElementById("loadStatus");

  function setLoadStatus(message, isError = false) {
    if (!loadStatus) return;
    loadStatus.hidden = false;
    loadStatus.textContent = message;
    loadStatus.classList.toggle("is-error", isError);
  }

  function showLoadError(error) {
    console.error("Coreless v59-16 load failed", error);
    const message = String(error && error.message ? error.message : error);
    setLoadStatus("게임 로드 실패: " + message, true);

    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.fillStyle = "#111827";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fecaca";
    context.font = "bold 20px Arial";
    context.fillText("게임 코드를 불러오지 못했습니다.", 34, 72);
    context.fillStyle = "#cbd5e1";
    context.font = "14px Arial";
    context.fillText(message, 34, 104);
  }

  try {
    setLoadStatus("v59-16 게임 코드 확인 중…");

    if (!("DecompressionStream" in window)) {
      throw new Error("이 브라우저는 gzip 압축 해제를 지원하지 않습니다.");
    }

    const encoded = window.__corelessGzip || "";
    if (encoded.length < 100000) {
      throw new Error("게임 코드 묶음이 완전하지 않습니다.");
    }

    setLoadStatus("v59-16 게임 코드 압축 해제 중…");

    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    let source = await new Response(stream).text();

    const messagePanelPattern = /  \/\/ 하단 메시지 패널[\s\S]*?  drawBossHealthBar\(\);/;
    if (!messagePanelPattern.test(source)) {
      throw new Error("추격 화면 메시지 패널 수정 지점을 찾지 못했습니다.");
    }

    source = source.replace(
      messagePanelPattern,
      `  // 추격 중에는 하단 메시지 패널이 캐릭터와 붕괴석을 가리지 않도록 숨긴다.
  if (!isMegaBoulderChaseCameraActive()) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.62)";
    drawRoundedRect(16, canvas.height - 62, 470, 42, 10);
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "14px Arial";
    ctx.fillText(gameState.message, 28, canvas.height - 35);
  }

  drawBossHealthBar();`
    );

    const playtestBridge = `\nwindow.__corelessPlaytest = {
      version: mapData.version,
      snapshot: function() {
        return {
          version: mapData.version,
          playerX: player.x,
          playerY: player.y,
          cameraX: camera.x,
          cameraY: camera.y,
          chaseState: megaBoulderChase.state,
          boulderScreenX: megaBoulderChase.x - camera.x,
          playerScreenX: centerX(player) - camera.x,
          overlayActive: gameState.transitionOverlayActive,
          readabilityAudit: pass16ScreenReadabilityAudit.passed,
          chaseAudit: megaBoulderChaseAudit.passed,
          traversalAudit: criticalTraversalAudit.passed,
          checkpointAudit: checkpointSafetyAudit.passed,
          routeAudit: megaStageRouteGraphAudit.passed
        };
      },
      setChaseGap: function(gap) {
        megaStageRouteState.highestOrder = 21;
        megaStageRouteState.activeOrder = 19;
        activeMegaStageScreenId = "mega_19";
        activeMegaStageScreenCache = megaStageScreenById.get("mega_19");
        megaBoulderChase.state = "chasing";
        megaBoulderChase.completed = false;
        megaBoulderChase.x = 10450;
        megaBoulderChase.speed = 5.1;
        megaBoulderChase.crashTimer = 0;
        setMegaBoulderOnSurface();
        player.x = megaBoulderChase.x + gap - player.width / 2;
        player.y = getMegaBoulderChaseSurfaceY(centerX(player)) - player.height;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
        gameState.transitionOverlayActive = true;
        gameState.transitionOverlayTimer = 80;
        for (let i = 0; i < 50; i++) {
          updateRoomTransitionOverlay();
          updateCamera();
        }
        draw();
        return this.snapshot();
      }
    };`;

    setLoadStatus("v59-16 게임 실행 준비 중…");
    (0, eval)(source + playtestBridge);

    delete window.__corelessGzip;
    window.__corelessLoaded = true;
    window.__corelessBuild = {
      version: "v59-16",
      pass: 16,
      verified: true
    };

    setLoadStatus("v59-16 실행 준비 완료");
    window.setTimeout(function() {
      if (loadStatus) loadStatus.hidden = true;
      if (canvas) canvas.focus({ preventScroll: true });
    }, 900);

    window.dispatchEvent(
      new CustomEvent("coreless-loaded", {
        detail: { version: "v59-16", pass: 16 }
      })
    );
  } catch (error) {
    window.__corelessLoadError = String(
      error && error.stack ? error.stack : error
    );
    showLoadError(error);
  }
})();
