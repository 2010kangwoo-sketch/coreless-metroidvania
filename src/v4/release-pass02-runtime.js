import { ResetPass02GroundRuntime } from "./reset-pass02-ground-runtime.js";

export class ReleasePass02GroundRuntime extends ResetPass02GroundRuntime {
  render() {
    super.render();
    const context = this.context;
    context.fillStyle = "rgba(2, 8, 11, 0.96)";
    context.fillRect(46, 42, 552, 36);
    context.fillStyle = "#edf3ed";
    context.font = '700 23px "Coreless Noto Sans KR", Arial, sans-serif';
    context.fillText("RELEASE PASS 02 · GROUND BASELINE", 54, 66);
  }
}
