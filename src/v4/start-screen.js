import {
  PASS04_SAVE,
  checkpointById,
  createCheckpointStore,
} from "./pass04-checkpoints.js";

export const V4_START_SCREEN = Object.freeze({
  id: "coreless-v4-start-screen",
  title: "CORELESS",
  subtitle: "중심 없이 깨어난 자",
  fadeOutMilliseconds: 620,
  menuActions: Object.freeze(["continue", "new", "account", "controls"]),
  keyboardNavigation: Object.freeze([
    "ArrowUp",
    "ArrowDown",
    "KeyW",
    "KeyS",
    "Enter",
    "Escape",
  ]),
  pointerSupported: true,
  continueRequiresValidSave: true,
  confirmsBeforeOverwrite: true,
  fakeSettingsAllowed: false,
  reducedMotionSupported: true,
});

const isActivationKey = code => code === "Enter" || code === "Space";

export function inspectStartScreenSave(storage) {
  const store = createCheckpointStore(storage);
  const result = store.read();
  if (result.status !== "ok") {
    return Object.freeze({
      status: result.status,
      hasSave: false,
      checkpointId: null,
      checkpointTier: null,
      label: "저장 기록 없음",
    });
  }
  const checkpoint = checkpointById(result.record.checkpointId);
  return Object.freeze({
    status: "ok",
    hasSave: true,
    checkpointId: checkpoint.id,
    checkpointTier: checkpoint.tier,
    label: `${checkpoint.id} · ${checkpoint.tier}층 체크포인트`,
  });
}

export function validateV4StartScreen() {
  const checks = [
    ["fourRealMenuActions", V4_START_SCREEN.menuActions.join(",") ===
      "continue,new,account,controls"],
    ["continueRequiresSave", V4_START_SCREEN.continueRequiresValidSave],
    ["newGameConfirmsOverwrite", V4_START_SCREEN.confirmsBeforeOverwrite],
    ["keyboardNavigationComplete",
      ["ArrowUp", "ArrowDown", "KeyW", "KeyS", "Enter", "Escape"].every(key =>
        V4_START_SCREEN.keyboardNavigation.includes(key))],
    ["pointerSupported", V4_START_SCREEN.pointerSupported],
    ["fadeIsBrief", V4_START_SCREEN.fadeOutMilliseconds >= 350 &&
      V4_START_SCREEN.fadeOutMilliseconds <= 850],
    ["noFakeSettings", V4_START_SCREEN.fakeSettingsAllowed === false],
    ["reducedMotionSupported", V4_START_SCREEN.reducedMotionSupported],
    ["saveKeyIsV4Scoped", PASS04_SAVE.key.startsWith("coreless.v4.")],
  ].map(([name, passed]) => Object.freeze({
    name,
    passed: Boolean(passed),
  }));
  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements: Object.freeze({
      menuActions: V4_START_SCREEN.menuActions.length,
      keyboardBindings: V4_START_SCREEN.keyboardNavigation.length,
      fadeOutMilliseconds: V4_START_SCREEN.fadeOutMilliseconds,
    }),
  });
}

export class V4StartScreenController {
  constructor(root, {
    initialSave,
    onContinue,
    onNewGame,
    onStart,
  }) {
    this.root = root;
    this.initialSave = initialSave;
    this.onContinue = onContinue;
    this.onNewGame = onNewGame;
    this.onStart = onStart;
    this.menuButtons = [...root.querySelectorAll("[data-start-action]")]
      .filter(button => ["continue", "new", "account", "controls"]
        .includes(button.dataset.startAction));
    this.continueButton = root.querySelector('[data-start-action="continue"]');
    this.saveLabel = root.querySelector("[data-start-save-label]");
    this.dialogs = [...root.querySelectorAll("[data-start-dialog]")];
    this.activeDialog = null;
    this.startedMode = null;
    this.closed = false;
    this.selectedIndex = 0;
    this.boundKeyDown = event => this.onKeyDown(event);
    this.boundClick = event => this.onClick(event);
    this.boundFocus = event => this.onFocus(event);
    this.initialize();
  }

  initialize() {
    document.body.dataset.startScreen = "open";
    this.continueButton.disabled = !this.initialSave.hasSave;
    this.continueButton.setAttribute(
      "aria-disabled",
      String(!this.initialSave.hasSave),
    );
    this.saveLabel.textContent = this.initialSave.label;
    this.root.addEventListener("click", this.boundClick);
    this.root.addEventListener("focusin", this.boundFocus);
    window.addEventListener("keydown", this.boundKeyDown);
    this.select(0, { focus: false });
    queueMicrotask(() => this.selectedButton()?.focus());
  }

  enabledButtons() {
    return this.menuButtons.filter(button => !button.disabled);
  }

  selectedButton() {
    return this.enabledButtons()[this.selectedIndex] ?? null;
  }

  select(index, { focus = true } = {}) {
    const enabled = this.enabledButtons();
    if (enabled.length === 0) return;
    this.selectedIndex = (index + enabled.length) % enabled.length;
    this.menuButtons.forEach(button => {
      button.dataset.selected = String(
        button === enabled[this.selectedIndex],
      );
    });
    if (focus) enabled[this.selectedIndex].focus();
  }

  moveSelection(direction) {
    this.select(this.selectedIndex + direction);
  }

  onFocus(event) {
    const index = this.enabledButtons().indexOf(event.target);
    if (index >= 0) this.select(index, { focus: false });
  }

  onKeyDown(event) {
    if (this.closed) return;
    if (event.code === "Escape" && this.activeDialog) {
      event.preventDefault();
      this.closeDialog();
      return;
    }
    if (this.activeDialog) return;
    if (event.code === "ArrowUp" || event.code === "KeyW") {
      event.preventDefault();
      this.moveSelection(-1);
    } else if (event.code === "ArrowDown" || event.code === "KeyS") {
      event.preventDefault();
      this.moveSelection(1);
    } else if (isActivationKey(event.code)) {
      event.preventDefault();
      this.selectedButton()?.click();
    }
  }

  onClick(event) {
    const button = event.target.closest("[data-start-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.startAction;
    if (action === "continue") {
      this.begin("continue");
    } else if (action === "new") {
      if (this.initialSave.hasSave) this.openDialog("new-confirm");
      else this.begin("new");
    } else if (action === "account") {
      this.openDialog("account");
    } else if (action === "controls") {
      this.openDialog("controls");
    } else if (action === "confirm-new") {
      this.begin("new");
    } else if (action === "close-dialog") {
      this.closeDialog();
    }
  }

  openDialog(name) {
    this.activeDialog = name;
    this.dialogs.forEach(dialog => {
      const active = dialog.dataset.startDialog === name;
      dialog.setAttribute("aria-hidden", String(!active));
      if (active) {
        queueMicrotask(() =>
          dialog.querySelector("button")?.focus());
      }
    });
  }

  closeDialog() {
    this.activeDialog = null;
    this.dialogs.forEach(dialog =>
      dialog.setAttribute("aria-hidden", "true"));
    queueMicrotask(() => this.selectedButton()?.focus());
  }

  begin(mode, { immediate = false } = {}) {
    if (this.closed || this.startedMode) return false;
    this.startedMode = mode;
    this.closeDialog();
    if (mode === "new") this.onNewGame();
    else this.onContinue();
    window.removeEventListener("keydown", this.boundKeyDown);
    this.root.removeEventListener("click", this.boundClick);
    this.root.removeEventListener("focusin", this.boundFocus);
    const complete = () => {
      this.root.dataset.state = "closed";
      document.body.dataset.startScreen = "closed";
      this.closed = true;
      this.onStart(mode);
    };
    if (immediate) {
      complete();
    } else {
      this.root.dataset.state = "closing";
      window.setTimeout(complete, V4_START_SCREEN.fadeOutMilliseconds);
    }
    return true;
  }

  startNewGameForAudit() {
    return this.begin("new", { immediate: true });
  }

  continueForAudit() {
    if (!this.initialSave.hasSave) return false;
    return this.begin("continue", { immediate: true });
  }

  snapshot() {
    return Object.freeze({
      state: this.root.dataset.state,
      closed: this.closed,
      startedMode: this.startedMode,
      activeDialog: this.activeDialog,
      selectedAction: this.selectedButton()?.dataset.startAction ?? null,
      continueEnabled: !this.continueButton.disabled,
      save: { ...this.initialSave },
    });
  }
}
