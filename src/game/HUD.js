function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function setBar(el, value01) {
  if (!(el instanceof HTMLElement)) return;
  el.style.width = `${Math.round(clamp01(value01) * 100)}%`;
}

function setText(el, text) {
  if (!(el instanceof HTMLElement)) return;
  el.textContent = text;
}

export class HUD {
  constructor() {
    this.playerHpBar = document.getElementById("playerHpBar");
    this.playerHpText = document.getElementById("playerHpText");
    this.enemyHpBar = document.getElementById("enemyHpBar");
    this.enemyHpText = document.getElementById("enemyHpText");
  }

  setHealth({ playerHp, playerHpMax, enemyHp, enemyHpMax }) {
    setBar(this.playerHpBar, playerHpMax > 0 ? playerHp / playerHpMax : 0);
    setText(this.playerHpText, String(Math.max(0, Math.round(playerHp))));

    setBar(this.enemyHpBar, enemyHpMax > 0 ? enemyHp / enemyHpMax : 0);
    setText(this.enemyHpText, String(Math.max(0, Math.round(enemyHp))));
  }
}

