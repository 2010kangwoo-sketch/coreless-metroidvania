import { ResetPass03AirRuntime } from "./reset-pass03-air-runtime.js";

export class ReleasePass03AirRuntime extends ResetPass03AirRuntime {
  render() {
    super.render();
    const context = this.context;
    context.fillStyle = "rgba(2, 8, 11, 0.96)";
    context.fillRect(46, 40, 548, 36);
    context.fillStyle = "#edf3ed";
    context.font = '700 23px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText("RELEASE PASS 03 · AIR FORGIVENESS", 54, 64);
  }
}
