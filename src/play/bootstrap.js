import { setActiveNav } from "../site/nav.js";
import { Game } from "../game/Game.js";

setActiveNav("play");

function shouldBlockForMobileGate() {
  const narrow = window.matchMedia?.("(max-width: 800px)")?.matches ?? window.innerWidth < 800;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const touchCapable = (navigator.maxTouchPoints ?? 0) > 0 || "ontouchstart" in window;
  return narrow && (coarse || touchCapable);
}

const mobileGate = document.getElementById("mobileGate");
const playAnywayBtn = document.getElementById("playAnywayBtn");
let forcePlay = false;

function syncMobileGate() {
  if (!(mobileGate instanceof HTMLElement)) return;
  mobileGate.hidden = forcePlay || !shouldBlockForMobileGate();
}

syncMobileGate();
window.addEventListener("resize", syncMobileGate);
playAnywayBtn?.addEventListener("click", () => {
  forcePlay = true;
  syncMobileGate();
  ensureGameStarted();
});

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

let game = null;

function ensureGameStarted() {
  if (game) return;
  if (mobileGate instanceof HTMLElement && !mobileGate.hidden) return;

  game = new Game({
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
}

ensureGameStarted();
window.addEventListener("resize", ensureGameStarted);

pauseBtn?.addEventListener("click", () => {
  ensureGameStarted();
  game?.togglePause();
});
restartBtn?.addEventListener("click", () => {
  ensureGameStarted();
  game?.restart();
});
overlayResumeBtn?.addEventListener("click", () => {
  ensureGameStarted();
  game?.setPaused(false);
});
overlayRestartBtn?.addEventListener("click", () => {
  ensureGameStarted();
  game?.restart();
});

