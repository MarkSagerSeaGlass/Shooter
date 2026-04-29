import * as THREE from "three";
import { buildArena } from "./Arena.js";
import { InputController } from "./InputController.js";
import { PlayerController } from "./PlayerController.js";
import { EnemyController } from "./EnemyController.js";
import { resolveCircleAabbXZ } from "./Physics.js";
import { HUD } from "./HUD.js";

function nowMs() {
  return performance.now();
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function isWin(mode) {
  return mode === "won";
}
function isLose(mode) {
  return mode === "lost";
}

export class Game {
  /**
   * @param {{
   *  canvas: HTMLCanvasElement,
   *  onUiStateChange?: (ui: {mode:"running"|"paused"|"won"|"lost"}) => void
   * }} params
   */
  constructor({ canvas, onUiStateChange }) {
    this.canvas = canvas;
    this.onUiStateChange = onUiStateChange ?? (() => {});

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(new THREE.Color("#060914"), 0.035);

    this.camera = new THREE.PerspectiveCamera(72, 1, 0.1, 120);

    this.input = new InputController();
    this.hud = new HUD();

    this.player = new PlayerController({ camera: this.camera });
    this.enemy = new EnemyController({ position: new THREE.Vector3(0, 1.7, -16) });

    this.playerHpMax = 100;
    this.enemyHpMax = 100;
    this.playerHp = this.playerHpMax;
    this.enemyHp = this.enemyHpMax;

    this._mode = "running"; // running | paused | won | lost

    const { aabbs, halfSize } = buildArena(this.scene);
    this._aabbs = aabbs;
    this._arenaHalfSize = halfSize;

    this._coverOnlyAabbs = aabbs.filter((b) => {
      // heuristic: walls are large and on edges; cover blocks are inside
      return (
        b.minX > -halfSize + 1.5 &&
        b.maxX < halfSize - 1.5 &&
        b.minZ > -halfSize + 1.5 &&
        b.maxZ < halfSize - 1.5
      );
    });

    this._enemyMesh = this._makeEnemyMesh();
    this.scene.add(this._enemyMesh);

    this._bullets = [];
    this._bulletGeo = new THREE.SphereGeometry(0.12, 10, 10);
    this._bulletMatPlayer = new THREE.MeshStandardMaterial({ color: new THREE.Color("#8cffd1"), roughness: 0.35, metalness: 0.15 });
    this._bulletMatEnemy = new THREE.MeshStandardMaterial({ color: new THREE.Color("#ff4d79"), roughness: 0.35, metalness: 0.15 });

    this._addLights();
    this._addCrosshair();

    this._lastMs = nowMs();
    this._raf = null;

    this._onResize = () => this._resize();
    window.addEventListener("resize", this._onResize);
    this._resize();
    this._syncHud();
    this.onUiStateChange({ mode: this._mode });
  }

  start() {
    if (this._raf != null) return;
    this._lastMs = nowMs();
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      this._frame();
    };
    this._raf = requestAnimationFrame(tick);
  }

  dispose() {
    if (this._raf != null) cancelAnimationFrame(this._raf);
    this._raf = null;
    window.removeEventListener("resize", this._onResize);
    this.input.dispose();
    this.renderer.dispose();
  }

  setPaused(paused) {
    if (isWin(this._mode) || isLose(this._mode)) return;
    this._mode = paused ? "paused" : "running";
    this.onUiStateChange({ mode: this._mode });
  }

  togglePause() {
    if (this._mode === "paused") this.setPaused(false);
    else this.setPaused(true);
  }

  restart() {
    this.playerHp = this.playerHpMax;
    this.enemyHp = this.enemyHpMax;

    this.player.position.set(0, 1.7, 16);
    this.player.yaw = 0;
    this.player.pitch = 0;

    this.enemy.reset(new THREE.Vector3(0, 1.7, -16));

    for (const b of this._bullets) {
      this.scene.remove(b.mesh);
    }
    this._bullets = [];

    this._mode = "running";
    this._syncHud();
    this.onUiStateChange({ mode: this._mode });
  }

  _resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w <= 0 || h <= 0) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _frame() {
    const ms = nowMs();
    const dt = Math.min(0.05, (ms - this._lastMs) / 1000);
    this._lastMs = ms;

    const intent = this.input.intentions();
    // Prepare for next frame edge-triggers
    this.input.beginFrame();

    if (intent.pausePressed) this.togglePause();
    if (intent.restartPressed && (this._mode === "paused" || isWin(this._mode) || isLose(this._mode))) {
      this.restart();
    }

    if (this._mode === "running") {
      this.player.update(dt, intent);
      this._applyCollisions(this.player.position, this.player.radius);

      // Enemy update
      const ai = this.enemy.update(dt, {
        playerPos: this.player.position,
        blockers: this._coverOnlyAabbs,
        arenaHalfSize: this._arenaHalfSize,
      });
      this._applyCollisions(this.enemy.position, this.enemy.radius);

      this._enemyMesh.position.copy(this.enemy.position);
      this._enemyMesh.rotation.y = this.enemy.yaw;

      // Player fire
      if (intent.shoot && this.player.canFire()) {
        this._spawnBullet({
          from: "player",
          origin: this.player.position,
          dir: this.player.aimDirection(),
          speed: 26,
        });
        this.player.markFired();
      }

      // Enemy fire
      if (ai.wantFire && this.enemy.canFire() && ai.aimDir) {
        this._spawnBullet({
          from: "enemy",
          origin: this.enemy.position,
          dir: ai.aimDir,
          speed: 22,
        });
        this.enemy.markFired();
      }

      this._updateBullets(dt);
      this._syncHud();
      this._checkEnd();
    }

    this.renderer.render(this.scene, this.camera);
  }

  _applyCollisions(pos, radius) {
    // Constrain roughly within arena (also via wall AABBs)
    const next = { x: pos.x, z: pos.z };
    for (const box of this._aabbs) {
      const res = resolveCircleAabbXZ(next, radius, box);
      next.x = res.x;
      next.z = res.z;
    }
    pos.x = next.x;
    pos.z = next.z;
  }

  _spawnBullet({ from, origin, dir, speed }) {
    const mesh = new THREE.Mesh(
      this._bulletGeo,
      from === "player" ? this._bulletMatPlayer : this._bulletMatEnemy,
    );
    mesh.castShadow = true;

    const pos = origin.clone().add(dir.clone().multiplyScalar(1.1));
    mesh.position.copy(pos);
    this.scene.add(mesh);

    const vel = dir.clone().multiplyScalar(speed);
    this._bullets.push({
      from,
      mesh,
      pos,
      vel,
      ttl: 2.0,
      radius: 0.14,
      damage: 10,
    });
  }

  _updateBullets(dt) {
    for (const b of this._bullets) {
      b.ttl -= dt;
      b.pos.addScaledVector(b.vel, dt);
      b.mesh.position.copy(b.pos);
    }

    const alive = [];
    for (const b of this._bullets) {
      if (b.ttl <= 0) {
        this.scene.remove(b.mesh);
        continue;
      }

      // Collision vs cover/walls (XZ)
      let hitWall = false;
      for (const box of this._aabbs) {
        if (b.pos.x >= box.minX && b.pos.x <= box.maxX && b.pos.z >= box.minZ && b.pos.z <= box.maxZ) {
          hitWall = true;
          break;
        }
      }
      if (hitWall) {
        this.scene.remove(b.mesh);
        continue;
      }

      // Hit entities (circle in XZ + small Y gate)
      if (b.from === "player") {
        if (distXZ(b.pos, this.enemy.position) <= this.enemy.radius + b.radius) {
          this.enemyHp = Math.max(0, this.enemyHp - b.damage);
          this.scene.remove(b.mesh);
          continue;
        }
      } else {
        if (distXZ(b.pos, this.player.position) <= this.player.radius + b.radius) {
          this.playerHp = Math.max(0, this.playerHp - b.damage);
          this.scene.remove(b.mesh);
          continue;
        }
      }

      alive.push(b);
    }

    this._bullets = alive;
  }

  _checkEnd() {
    if (this._mode !== "running") return;
    if (this.enemyHp <= 0) {
      this._mode = "won";
      this.onUiStateChange({ mode: this._mode });
    } else if (this.playerHp <= 0) {
      this._mode = "lost";
      this.onUiStateChange({ mode: this._mode });
    }
  }

  _syncHud() {
    this.hud.setHealth({
      playerHp: this.playerHp,
      playerHpMax: this.playerHpMax,
      enemyHp: this.enemyHp,
      enemyHpMax: this.enemyHpMax,
    });
  }

  _addLights() {
    const hemi = new THREE.HemisphereLight(
      new THREE.Color("#7aa7ff"),
      new THREE.Color("#060914"),
      0.9,
    );
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 1.1);
    dir.position.set(9, 14, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 60;
    dir.shadow.camera.left = -30;
    dir.shadow.camera.right = 30;
    dir.shadow.camera.top = 30;
    dir.shadow.camera.bottom = -30;
    this.scene.add(dir);
  }

  _makeEnemyMesh() {
    const geo = new THREE.CapsuleGeometry(0.65, 1.15, 6, 10);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#ff4d79"),
      roughness: 0.6,
      metalness: 0.08,
      emissive: new THREE.Color("#1a0309"),
      emissiveIntensity: 0.6,
    });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.copy(this.enemy.position);
    return m;
  }

  _addCrosshair() {
    // Simple reticle in 3D space (attached to camera)
    const geo = new THREE.RingGeometry(0.012, 0.016, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: 0.7,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0, -0.6);
    this.camera.add(mesh);
    this.scene.add(this.camera);

    // Also add a faint dot
    const dotGeo = new THREE.CircleGeometry(0.004, 18);
    const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#8cffd1"), transparent: true, opacity: 0.75, depthTest: false });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(0, 0, -0.6);
    this.camera.add(dot);
  }
}

function distXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

