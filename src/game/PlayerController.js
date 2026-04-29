import * as THREE from "three";
import { clamp } from "./Physics.js";

const DEG = Math.PI / 180;

export class PlayerController {
  /**
   * @param {{camera:THREE.PerspectiveCamera}} params
   */
  constructor({ camera }) {
    this.camera = camera;
    this.yaw = 0;
    this.pitch = 0;

    this.moveSpeed = 10.5; // units/sec
    this.turnSpeed = 2.3; // rad/sec
    this.lookSpeed = 1.6; // rad/sec

    this.radius = 0.7;
    this.position = new THREE.Vector3(0, 1.7, 16);

    this.fireCooldownMs = 260;
    this._fireTimerMs = 0;
  }

  /**
   * @param {number} dt
   * @param {{forward:number,strafe:number,yaw:number,pitch:number,shoot:boolean}} intent
   */
  update(dt, intent) {
    this.yaw += intent.yaw * this.turnSpeed * dt;
    this.pitch += intent.pitch * this.lookSpeed * dt;
    this.pitch = clamp(this.pitch, -80 * DEG, 80 * DEG);

    // basis vectors on ground plane (XZ)
    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw) * -1);
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).multiplyScalar(-1);

    const v = new THREE.Vector3();
    v.addScaledVector(fwd, intent.forward);
    v.addScaledVector(right, intent.strafe);
    if (v.lengthSq() > 0.0001) v.normalize().multiplyScalar(this.moveSpeed * dt);

    this.position.add(v);

    // Fire timer
    this._fireTimerMs = Math.max(0, this._fireTimerMs - dt * 1000);

    // Apply camera transform
    this.camera.position.copy(this.position);
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  canFire() {
    return this._fireTimerMs <= 0;
  }

  markFired() {
    this._fireTimerMs = this.fireCooldownMs;
  }

  /**
   * Returns a forward direction vector in world space.
   */
  aimDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, "YXZ"));
    dir.normalize();
    return dir;
  }
}

