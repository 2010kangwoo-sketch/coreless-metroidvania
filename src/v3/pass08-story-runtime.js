import { Pass07LayeredRuntime } from "./pass07-layered-runtime.js";
import {
  PASS08_BUILD,
  PASS08_PLAYABLE_BEATS,
  createPass08StoryProgress,
} from "./pass08-story.js";

export class Pass08StoryRuntime extends Pass07LayeredRuntime {
  constructor(canvas, statusNodes = {}) {
    super(canvas, statusNodes);
    this.config.build = PASS08_BUILD;
    this.config.finishMessage = "첫 추적 구간 완료 · 서쪽의 파수기 신호를 확인했습니다";
    this.storyStarted = false;
    this.storyJournalOpen = false;
    this.storyProgress = createPass08StoryProgress();
    this.storyLog = [];
    this.storyObjective = "원점 코어의 신호를 추적하라";
    Object.assign(this.audit, {
      storyBeatsDiscovered: 0,
      storyOrder: [],
      prologueDismissed: false,
      journalOpened: 0,
      narrativeGoalVisible: true,
    });
  }

  onKeyDown(event) {
    if (!this.storyStarted && ["Enter", "Space"].includes(event.code)) {
      event.preventDefault();
      this.storyStarted = true;
      this.audit.prologueDismissed = true;
      this.markStoryBeat("prologue");
      this.message = "원점 코어의 신호를 따라 위층으로 이동하세요";
      this.messageTimer = 5;
      return;
    }
    if (event.code === "Tab") {
      event.preventDefault();
      this.storyJournalOpen = !this.storyJournalOpen;
      if (this.storyJournalOpen) this.audit.journalOpened += 1;
      return;
    }
    if (this.storyJournalOpen) {
      event.preventDefault();
      return;
    }
    super.onKeyDown(event);
  }

  update(dt, overrideInput = null) {
    if (!this.storyStarted || this.storyJournalOpen) return;
    super.update(dt, overrideInput);

    if (this.currentRoom === "r01" && this.player.x >= 430) {
      this.markStoryBeat("awakeningEcho");
    }
    if (this.currentRoom === "r02" && this.player.x >= 1650) {
      this.markStoryBeat("separationRecord");
    }
    if (this.audit.doubleJumpUnlocked) {
      this.markStoryBeat("resonanceWing");
    }
    if (this.audit.liftCompleted) {
      this.markStoryBeat("upperSignal");
    }
    if (this.currentRoom === "r04" && this.player.x <= 3750) {
      if (this.markStoryBeat("hunterWarning")) {
        this.storyObjective = "서쪽의 깨어난 파수기 신호를 확인하라";
      }
    }
  }

  markStoryBeat(id) {
    if (this.storyProgress[id]) return false;
    const beat = PASS08_PLAYABLE_BEATS.find(item => item.id === id);
    if (!beat) return false;
    this.storyProgress[id] = true;
    this.storyLog.push(beat);
    this.audit.storyBeatsDiscovered = this.storyLog.length;
    this.audit.storyOrder.push(id);
    if (id !== "prologue") {
      this.message = `${beat.title} · ${beat.text}`;
      this.messageTimer = 6;
    }
    return true;
  }

  drawHud() {
    super.drawHud();
    const context = this.context;
    context.fillStyle = "rgba(3, 9, 13, 0.88)";
    context.fillRect(20, 60, 455, 58);
    context.fillStyle = "#d8c57e";
    context.font = "700 11px Arial, sans-serif";
    context.fillText("현재 목표", 34, 80);
    context.fillStyle = "#e7eee9";
    context.font = "700 14px Arial, sans-serif";
    context.fillText(this.storyObjective, 34, 102);

    context.fillStyle = "rgba(3, 9, 13, 0.82)";
    context.fillRect(this.canvas.width - 210, 20, 190, 32);
    context.fillStyle = "#9fb9bd";
    context.font = "700 11px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(
      `기억 기록 ${this.storyLog.length}/${PASS08_PLAYABLE_BEATS.length} · TAB`,
      this.canvas.width - 115,
      41,
    );
    context.textAlign = "left";
  }

  drawStoryPanel() {
    const context = this.context;
    context.fillStyle = "rgba(2, 7, 10, 0.88)";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const panelX = 260;
    const panelY = 155;
    const panelWidth = this.canvas.width - 520;
    const panelHeight = 530;
    context.fillStyle = "rgba(8, 20, 26, 0.97)";
    context.fillRect(panelX, panelY, panelWidth, panelHeight);
    context.strokeStyle = "rgba(157, 225, 223, 0.55)";
    context.lineWidth = 3;
    context.strokeRect(panelX, panelY, panelWidth, panelHeight);

    context.fillStyle = "#9de1df";
    context.font = "700 14px Arial, sans-serif";
    context.fillText("CORELESS · PROLOGUE", panelX + 52, panelY + 58);
    context.fillStyle = "#edf3ee";
    context.font = "700 30px Arial, sans-serif";
    context.fillText("중심 신호 감지", panelX + 52, panelY + 110);

    context.fillStyle = "#c4d3d4";
    context.font = "400 18px Arial, sans-serif";
    const lines = [
      "기억 없음. 중심 코어 없음.",
      "당신은 폐쇄된 제련소에서 깨어난 ‘코어리스’입니다.",
      "위쪽에서 원점 코어가 당신만 알아들을 수 있는 신호를 보냅니다.",
      "흩어진 기능 기억을 회수하고, 강해지는 오염체를 넘어 근원에 도달하세요.",
    ];
    lines.forEach((line, index) => {
      context.fillText(line, panelX + 52, panelY + 175 + index * 52);
    });

    context.fillStyle = "rgba(216, 197, 126, 0.12)";
    context.fillRect(panelX + 52, panelY + 395, panelWidth - 104, 68);
    context.fillStyle = "#e8dcae";
    context.font = "700 17px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(
      "목표 · 기억 조각을 회수하여 원점 코어의 검은 공명을 멈춘다",
      this.canvas.width / 2,
      panelY + 436,
    );
    context.fillStyle = "#a9bdc1";
    context.font = "700 14px Arial, sans-serif";
    context.fillText("ENTER 또는 SPACE로 시작", this.canvas.width / 2, panelY + 500);
    context.textAlign = "left";
  }

  drawJournal() {
    const context = this.context;
    context.fillStyle = "rgba(2, 7, 10, 0.92)";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = "#edf3ee";
    context.font = "700 28px Arial, sans-serif";
    context.fillText("기억 기록", 170, 120);
    context.fillStyle = "#91aeb4";
    context.font = "400 14px Arial, sans-serif";
    context.fillText("TAB을 다시 누르면 돌아갑니다", 170, 153);

    PASS08_PLAYABLE_BEATS.forEach((beat, index) => {
      const discovered = this.storyProgress[beat.id];
      const y = 210 + index * 92;
      context.fillStyle = discovered ? "rgba(24, 52, 58, 0.9)" : "rgba(11, 24, 30, 0.85)";
      context.fillRect(170, y, this.canvas.width - 340, 70);
      context.strokeStyle = discovered ? "rgba(157, 225, 223, 0.42)" : "rgba(91, 112, 118, 0.24)";
      context.strokeRect(170, y, this.canvas.width - 340, 70);
      context.fillStyle = discovered ? "#d8c57e" : "#667a80";
      context.font = "700 14px Arial, sans-serif";
      context.fillText(discovered ? beat.title : `미발견 기록 ${String(index + 1).padStart(2, "0")}`, 194, y + 27);
      context.fillStyle = discovered ? "#c7d6d7" : "#53666c";
      context.font = "400 13px Arial, sans-serif";
      context.fillText(discovered ? beat.text : "신호를 따라가면 기록이 복원됩니다.", 194, y + 51);
    });
  }

  draw() {
    super.draw();
    if (!this.storyStarted) this.drawStoryPanel();
    else if (this.storyJournalOpen) this.drawJournal();

    if (this.statusNodes.audit) {
      this.statusNodes.audit.textContent = this.audit.finished
        ? "STORY CHAPTER COMPLETE"
        : "STORY ROUTE ACTIVE";
      this.statusNodes.audit.dataset.state = this.audit.finished ? "pass" : "active";
    }
  }
}
