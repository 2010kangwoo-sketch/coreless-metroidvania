import { PLAYER_PHYSICS } from "../v3/player-physics.js";
import { zoneAtWorldPoint } from "./pass03-world-streaming.js";
import { Pass04WorldRuntime } from "./pass04-world-runtime.js";
import {
  PASS05_GUIDANCE_UI,
  PASS05_PROLOGUE,
  guidanceForZone,
  objectiveForSequence,
  restoredGuidanceState,
  tutorialForZone,
} from "./pass05-story-guidance.js";

const horizontalInputActive = keys =>
  keys.has("KeyA") ||
  keys.has("KeyD") ||
  keys.has("ArrowLeft") ||
  keys.has("ArrowRight");

const guidanceMessage = (id, kind, title, text, priority) => ({
  id,
  kind,
  title,
  text,
  priority,
  durationSeconds: PASS05_GUIDANCE_UI.bannerSeconds,
  elapsed: 0,
});

export class Pass05StoryRuntime extends Pass04WorldRuntime {
  constructor(canvas, storage = window.localStorage) {
    super(canvas, storage);
    this.initializeStoryGuidance();
  }

  initializeStoryGuidance() {
    const restored = restoredGuidanceState(this.currentCheckpointId);
    this.currentZoneId = restored.currentZoneId;
    this.currentObjective = restored.objective;
    this.announcedZoneIds = new Set(restored.seenZoneIds);
    this.storyLog = restored.logEntries.map(item => ({ ...item }));
    this.messageQueue = [];
    this.activeMessage = null;
    this.logOpen = false;
    this.guidanceAudit = {
      zoneAnnouncements: 0,
      objectiveChanges: 0,
      messagesQueued: 0,
      messagesDisplayed: 0,
      maximumQueueDepth: 0,
      queueDrops: 0,
      duplicateAnnouncementAttempts: 0,
      logToggles: 0,
      movementFramesWithLogOpen: 0,
      movementFramesWithBanner: 0,
      longestMessageSeconds: 0,
      blockedGameplayFrames: 0,
      announcedZoneIds: [],
      objectiveIds: [this.currentObjective.id],
    };

    if (this.currentCheckpointId === "S01") {
      this.enqueueMessage(guidanceMessage(
        "prologue",
        "story",
        PASS05_PROLOGUE.title,
        PASS05_PROLOGUE.text,
        3,
      ));
    }
    this.announceZone(this.currentZoneId);
  }

  clearProgress() {
    super.clearProgress();
    this.initializeStoryGuidance();
  }

  addLogEntry(entry) {
    const existing = this.storyLog.find(item => item.id === entry.id);
    if (existing) return;
    this.storyLog.push({
      id: entry.id,
      title: entry.title,
      detail: entry.detail ?? entry.text,
    });
    if (this.storyLog.length > PASS05_GUIDANCE_UI.maximumLogEntries) {
      this.storyLog.splice(
        0,
        this.storyLog.length - PASS05_GUIDANCE_UI.maximumLogEntries,
      );
    }
  }

  enqueueMessage(message) {
    if (
      this.activeMessage?.id === message.id ||
      this.messageQueue.some(item => item.id === message.id)
    ) {
      return false;
    }
    this.messageQueue.push(message);
    this.messageQueue.sort((a, b) => b.priority - a.priority);
    if (this.messageQueue.length > PASS05_GUIDANCE_UI.maximumQueueDepth) {
      this.messageQueue.pop();
      this.guidanceAudit.queueDrops += 1;
    }
    this.guidanceAudit.messagesQueued += 1;
    this.guidanceAudit.maximumQueueDepth = Math.max(
      this.guidanceAudit.maximumQueueDepth,
      this.messageQueue.length,
    );
    return true;
  }

  activateNextMessage() {
    if (this.activeMessage || this.messageQueue.length === 0) return;
    this.activeMessage = this.messageQueue.shift();
    this.guidanceAudit.messagesDisplayed += 1;
    this.addLogEntry(this.activeMessage);
  }

  announceZone(zoneId) {
    const guide = guidanceForZone(zoneId);
    if (!guide) return false;
    if (this.announcedZoneIds.has(zoneId)) {
      this.guidanceAudit.duplicateAnnouncementAttempts += 1;
      return false;
    }
    this.announcedZoneIds.add(zoneId);
    this.guidanceAudit.zoneAnnouncements += 1;
    this.guidanceAudit.announcedZoneIds.push(zoneId);
    return this.enqueueMessage(guidanceMessage(
      `zone-${zoneId}`,
      "story",
      `${zoneId} · ${guide.zoneName}`,
      guide.cue,
      1,
    ));
  }

  synchronizeObjective(zone) {
    if (!zone) return;
    const nextObjective = objectiveForSequence(zone.sequence);
    if (nextObjective.id === this.currentObjective.id) return;
    this.currentObjective = nextObjective;
    this.guidanceAudit.objectiveChanges += 1;
    this.guidanceAudit.objectiveIds.push(nextObjective.id);
    this.addLogEntry(nextObjective);
    this.enqueueMessage(guidanceMessage(
      `objective-${nextObjective.id}`,
      "objective",
      "새 목표",
      nextObjective.title,
      2,
    ));
  }

  synchronizeZoneGuidance() {
    const zone = zoneAtWorldPoint(
      this.player.x + PLAYER_PHYSICS.width / 2,
      this.player.y + PLAYER_PHYSICS.height / 2,
    );
    if (!zone) return;
    if (zone.id !== this.currentZoneId) {
      this.currentZoneId = zone.id;
      this.synchronizeObjective(zone);
      this.announceZone(zone.id);
    }
  }

  updateGuidance(dt, beforeX) {
    this.synchronizeZoneGuidance();
    this.activateNextMessage();
    if (this.activeMessage) {
      this.activeMessage.elapsed += dt;
      this.guidanceAudit.longestMessageSeconds = Math.max(
        this.guidanceAudit.longestMessageSeconds,
        Math.min(
          this.activeMessage.elapsed,
          this.activeMessage.durationSeconds,
        ),
      );
      if (horizontalInputActive(this.keys) && this.player.x !== beforeX) {
        this.guidanceAudit.movementFramesWithBanner += 1;
      }
      if (this.activeMessage.elapsed >= this.activeMessage.durationSeconds) {
        this.activeMessage = null;
        this.activateNextMessage();
      }
    }
    if (
      this.logOpen &&
      horizontalInputActive(this.keys) &&
      this.player.x !== beforeX
    ) {
      this.guidanceAudit.movementFramesWithLogOpen += 1;
    }
  }

  onKeyDown(event) {
    if (event.code === PASS05_GUIDANCE_UI.logKey) {
      event.preventDefault();
      if (!this.keys.has(event.code)) {
        this.logOpen = !this.logOpen;
        this.guidanceAudit.logToggles += 1;
      }
      this.keys.add(event.code);
      return;
    }
    super.onKeyDown(event);
  }

  update(dt) {
    const beforeX = this.player.x;
    super.update(dt);
    if (!this.recovery) this.updateGuidance(dt, beforeX);
  }

  messageAlpha(message) {
    if (!message) return 0;
    const fade = PASS05_GUIDANCE_UI.fadeSeconds;
    const remaining = message.durationSeconds - message.elapsed;
    return Math.max(
      0,
      Math.min(1, message.elapsed / fade, remaining / fade),
    );
  }

  drawWrappedText(text, x, y, maximumWidth, lineHeight, maximumLines = 2) {
    const context = this.context;
    const characters = [...text];
    const lines = [];
    let line = "";
    for (const character of characters) {
      const candidate = `${line}${character}`;
      if (line && context.measureText(candidate).width > maximumWidth) {
        lines.push(line);
        line = character;
        if (lines.length >= maximumLines) break;
      } else {
        line = candidate;
      }
    }
    if (lines.length < maximumLines && line) lines.push(line);
    lines.slice(0, maximumLines).forEach((item, index) => {
      context.fillText(item, x, y + index * lineHeight);
    });
  }

  drawGuidanceHud() {
    const context = this.context;
    const tutorial = tutorialForZone(this.currentZoneId);
    context.fillStyle = "#03090d";
    context.fillRect(24, 24, 820, 192);
    context.strokeStyle = "rgba(143, 181, 184, 0.62)";
    context.strokeRect(24, 24, 820, 192);
    context.fillStyle = "#e9f0eb";
    context.font = '700 22px "Noto Sans KR", "Malgun Gothic", Arial, sans-serif';
    context.fillText("PASS 05 · STORY AND GUIDANCE", 44, 58);
    context.font = '700 14px "Noto Sans KR", "Malgun Gothic", Arial, sans-serif';
    context.fillStyle = "#8fb5b8";
    context.fillText(
      `${this.currentZoneId} · TIER ${this.currentTier}/6 · TAB 기록`,
      44,
      84,
    );
    context.fillStyle = "#d8c57e";
    context.font = '700 18px "Noto Sans KR", "Malgun Gothic", Arial, sans-serif';
    context.fillText(`목표 · ${this.currentObjective.title}`, 44, 116);
    context.fillStyle = "#b7c8c5";
    context.font = '15px "Noto Sans KR", "Malgun Gothic", Arial, sans-serif';
    context.fillText(this.currentObjective.detail, 44, 143);
    context.fillStyle = tutorial ? "#9ed8d4" : "#748d8e";
    context.fillText(
      tutorial ? `안내 · ${tutorial.prompt}` : "안내 · 이동 중 발견한 기록은 TAB에서 다시 확인",
      44,
      176,
    );
    context.fillStyle = "#6f898a";
    context.fillText(
      `기록 ${this.storyLog.length}/${PASS05_GUIDANCE_UI.maximumLogEntries} · 안내 ${this.announcedZoneIds.size}/36`,
      44,
      200,
    );
  }

  drawStoryBanner() {
    if (!this.activeMessage) return;
    const context = this.context;
    const alpha = this.messageAlpha(this.activeMessage);
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = "rgba(4, 12, 16, 0.96)";
    context.fillRect(190, 748, 1020, 122);
    context.strokeStyle = this.activeMessage.kind === "objective"
      ? "#d8c57e"
      : "#729fa1";
    context.lineWidth = 2;
    context.strokeRect(190, 748, 1020, 122);
    context.fillStyle = this.activeMessage.kind === "objective"
      ? "#ead892"
      : "#9ed8d4";
    context.font = '700 17px "Noto Sans KR", "Malgun Gothic", Arial, sans-serif';
    context.fillText(this.activeMessage.title, 218, 782);
    context.fillStyle = "#e7eeea";
    context.font = '18px "Noto Sans KR", "Malgun Gothic", Arial, sans-serif';
    this.drawWrappedText(this.activeMessage.text, 218, 817, 964, 26, 2);
    context.restore();
  }

  drawStoryLog() {
    if (!this.logOpen) return;
    const context = this.context;
    context.fillStyle = "rgba(2, 8, 12, 0.91)";
    context.fillRect(820, 236, 540, 450);
    context.strokeStyle = "rgba(216, 197, 126, 0.76)";
    context.strokeRect(820, 236, 540, 450);
    context.fillStyle = "#ead892";
    context.font = '700 20px "Noto Sans KR", "Malgun Gothic", Arial, sans-serif';
    context.fillText("발견 기록 · 게임은 계속 진행됩니다", 846, 272);
    context.font = '13px "Noto Sans KR", "Malgun Gothic", Arial, sans-serif';
    this.storyLog.slice(-PASS05_GUIDANCE_UI.maximumLogEntries)
      .forEach((entry, index) => {
        const y = 310 + index * 59;
        context.fillStyle = "#a8d0ce";
        context.fillText(entry.title, 846, y);
        context.fillStyle = "#a9b9b7";
        this.drawWrappedText(entry.detail, 846, y + 21, 480, 18, 2);
      });
    context.fillStyle = "#718788";
    context.fillText("TAB 닫기 · A/D 이동 가능", 846, 662);
  }

  render() {
    super.render();
    this.drawGuidanceHud();
    this.drawStoryLog();
    this.drawStoryBanner();
  }

  snapshot() {
    const base = super.snapshot();
    return {
      ...base,
      guidance: {
        currentZoneId: this.currentZoneId,
        objective: { ...this.currentObjective },
        tutorial: tutorialForZone(this.currentZoneId),
        activeMessage: this.activeMessage ? { ...this.activeMessage } : null,
        queuedMessages: this.messageQueue.map(item => ({ ...item })),
        announcedZoneIds: [...this.announcedZoneIds],
        storyLog: this.storyLog.map(item => ({ ...item })),
        logOpen: this.logOpen,
        audit: {
          ...this.guidanceAudit,
          announcedZoneIds: [...this.guidanceAudit.announcedZoneIds],
          objectiveIds: [...this.guidanceAudit.objectiveIds],
        },
      },
    };
  }
}
