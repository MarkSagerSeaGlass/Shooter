import * as THREE from "three";
import { clamp, isLineBlockedXZ, wrapAngleRad } from "./Physics.js";

export class EnemyController {
  /**
   * @param {{position?:THREE.Vector3}} params
   */
  constructor({ position } = {}) {
    this.position = position?.clone() ?? new THREE.Vector3(0, 1.7, -16);
    this.yaw = Math.PI;
    this.radius = 0.8;

    this.moveSpeed = 7.4;
    this.turnSpeed = 2.5;

    this.fireCooldownMs = 520;
    this._fireTimerMs = 0;

    this._mode = "roam"; // roam | engage
    this._waypoint = this.position.clone();
    this._waypointTimer = 0;

    this._strafeDir = 1;
    this._strafeTimer = 0;
  }

  reset(position) {
    this.position.copy(position);
    this.yaw = Math.PI;
    this._mode = "roam";
    this._waypoint.copy(position);
    this._waypointTimer = 0;
    this._strafeDir = 1;
    this._strafeTimer = 0;
    this._fireTimerMs = 0;
  }

  canFire() {
    return this._fireTimerMs <= 0;
  }

  markFired() {
    this._fireTimerMs = this.fireCooldownMs;
  }

  /**
   * @param {number} dt
   * @param {{
   *  playerPos:THREE.Vector3,
   *  blockers:any[],
   *  arenaHalfSize:number
   * }} ctx
   */
  update(dt, ctx) {
    const toPlayer = ctx.playerPos.clone().sub(this.position);
    const dist = toPlayer.length();

    const hasLos =
      dist < 22 &&
      !isLineBlockedXZ(this.position, ctx.playerPos, ctx.blockers);

    this._mode = hasLos ? "engage" : "roam";

    this._fireTimerMs = Math.max(0, this._fireTimerMs - dt * 1000);

    if (this._mode === "roam") {
      this._waypointTimer -= dt;
      const close = this.position.clone().sub(this._waypoint).length() < 1.2;
      if (this._waypointTimer <= 0 || close) {
        this._waypoint.copy(randomPointInArena(ctx.arenaHalfSize - 2.5));
        this._waypointTimer = 1.7 + Math.random() * 1.6;
      }

      const desired = this._waypoint.clone().sub(this.position);
      desired.y = 0;
      if (desired.lengthSq() > 0.001) {
        desired.normalize();
        const desiredYaw = Math.atan2(desired.x, -desired.z);
        this.yaw = turnToward(this.yaw, desiredYaw, this.turnSpeed * dt);

        const step = desired.multiplyScalar(this.moveSpeed * dt);
        this.position.add(step);
      }

      return { wantFire: false, aimDir: null };
    }

    // Engage: face player + strafe + maintain distance
    const flat = toPlayer.clone();
    flat.y = 0;
    const flatDist = flat.length();
    if (flatDist > 0.0001) flat.normalize();

    const desiredYaw = Math.atan2(flat.x, -flat.z);
    this.yaw = turnToward(this.yaw, desiredYaw, this.turnSpeed * dt);

    this._strafeTimer -= dt;
    if (this._strafeTimer <= 0) {
      this._strafeDir = Math.random() < 0.5 ? -1 : 1;
      this._strafeTimer = 0.8 + Math.random() * 0.7;
    }

    // Choose movement: strafe + (approach/retreat)
    const desiredRange = 12;
    const forwardIntent = clamp((flatDist - desiredRange) / desiredRange, -1, 1);

    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    right.normalize();

    const v = new THREE.Vector3();
    v.addScaledVector(right, this._strafeDir);
    v.addScaledVector(forward, forwardIntent);
    if (v.lengthSq() > 0.0001) v.normalize().multiplyScalar(this.moveSpeed * dt);
    this.position.add(v);

    // Aim (with fair inaccuracy)
    const aimDir = ctx.playerPos.clone().sub(this.position).normalize();
    applyAimSpread(aimDir, 0.055);

    const wantFire = dist < 20 && hasLos;
    return { wantFire, aimDir };
  }
}

function randomPointInArena(half) {
  return new THREE.Vector3((Math.random() * 2 - 1) * half, 1.7, (Math.random() * 2 - 1) * half);
}

function turnToward(currentYaw, desiredYaw, maxStep) {
  const delta = wrapAngleRad(desiredYaw - currentYaw);
  const step = clamp(delta, -maxStep, maxStep);
  return wrapAngleRad(currentYaw + step);
}

function applyAimSpread(dir, amountRad) {
  // Spread around yaw/pitch axes (small).
  const yaw = (Math.random() * 2 - 1) * amountRad;
  const pitch = (Math.random() * 2 - 1) * (amountRad * 0.7);
  dir.applyEuler(new THREE.Euler(pitch, yaw, 0, "YXZ")).normalize();
}

