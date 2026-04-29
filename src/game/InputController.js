const KEY = {
  W: "KeyW",
  X: "KeyX",
  A: "KeyA",
  D: "KeyD",
  SPACE: "Space",
  ESC: "Escape",
  R: "KeyR",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
};

export class InputController {
  constructor() {
    this.down = new Set();
    this._pressed = new Set();
    this._released = new Set();

    this._onKeyDown = (e) => {
      if (e.repeat) return;
      this.down.add(e.code);
      this._pressed.add(e.code);
      if ([KEY.SPACE, KEY.ARROW_UP, KEY.ARROW_DOWN, KEY.ARROW_LEFT, KEY.ARROW_RIGHT].includes(e.code)) {
        e.preventDefault();
      }
    };

    this._onKeyUp = (e) => {
      this.down.delete(e.code);
      this._released.add(e.code);
    };

    window.addEventListener("keydown", this._onKeyDown, { passive: false });
    window.addEventListener("keyup", this._onKeyUp);
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }

  beginFrame() {
    this._pressed.clear();
    this._released.clear();
  }

  isDown(code) {
    return this.down.has(code);
  }

  wasPressed(code) {
    return this._pressed.has(code);
  }

  intentions() {
    const forward = (this.isDown(KEY.W) ? 1 : 0) + (this.isDown(KEY.X) ? -1 : 0);
    const strafe = (this.isDown(KEY.ARROW_RIGHT) ? 1 : 0) + (this.isDown(KEY.ARROW_LEFT) ? -1 : 0);
    const yaw = (this.isDown(KEY.D) ? 1 : 0) + (this.isDown(KEY.A) ? -1 : 0);
    const pitch = (this.isDown(KEY.ARROW_DOWN) ? 1 : 0) + (this.isDown(KEY.ARROW_UP) ? -1 : 0);

    return {
      forward: Math.max(-1, Math.min(1, forward)),
      strafe: Math.max(-1, Math.min(1, strafe)),
      yaw: Math.max(-1, Math.min(1, yaw)),
      pitch: Math.max(-1, Math.min(1, pitch)),
      shoot: this.isDown(KEY.SPACE),
      shootPressed: this.wasPressed(KEY.SPACE),
      pausePressed: this.wasPressed(KEY.ESC),
      restartPressed: this.wasPressed(KEY.R),
    };
  }
}

