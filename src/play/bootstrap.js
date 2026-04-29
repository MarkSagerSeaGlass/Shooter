import { setActiveNav } from "../site/nav.js";
import { Game } from "../game/Game.js";

setActiveNav("play");

function isProbablyMobile() {
  return window.matchMedia?.("(max-width: 800px)")?.matches ?? window.innerWidth < 800;
}

const mobileGate = document.getElementById("mobileGate");
if (mobileGate && isProbablyMobile()) {
  mobileGate.hidden = false;
}

const canvas = document.getElementById("gameCanvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #gameCanvas");
}

const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayResumeBtn = document.getElementById("overlayResumeBtn");
const overlayRestartBtn = document.getElementById("overlayRestartBtn");

const game = new Game({
  canvas,
  onUiStateChange: (ui) => {
    const paused = ui.mode === "paused";
    const ended = ui.mode === "won" || ui.mode === "lost";

    if (restartBtn instanceof HTMLButtonElement) {
      restartBtn.disabled = !(paused || ended);
    }
    if (pauseBtn instanceof HTMLButtonElement) {
      pauseBtn.textContent = paused ? "Resume (Esc)" : "Pause (Esc)";
    }

    if (overlay instanceof HTMLElement) {
      overlay.hidden = !(paused || ended);
    }
    if (overlayTitle instanceof HTMLElement) {
      overlayTitle.textContent =
        ui.mode === "won" ? "You won" : ui.mode === "lost" ? "You lost" : "Paused";
    }
    if (overlayResumeBtn instanceof HTMLButtonElement) {
      overlayResumeBtn.disabled = ended;
      overlayResumeBtn.textContent = ended ? "Round ended" : "Resume";
    }
  },
});

game.start();

pauseBtn?.addEventListener("click", () => {
  game.togglePause();
});
restartBtn?.addEventListener("click", () => {
  game.restart();
});
overlayResumeBtn?.addEventListener("click", () => {
  game.setPaused(false);
});
overlayRestartBtn?.addEventListener("click", () => {
  game.restart();
});

