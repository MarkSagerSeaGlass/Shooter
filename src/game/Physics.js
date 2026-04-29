import * as THREE from "three";

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function clamp01(n) {
  return clamp(n, 0, 1);
}

export function wrapAngleRad(a) {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

/**
 * AABB shape stored in XZ plane.
 * @typedef {{ minX:number, minZ:number, maxX:number, maxZ:number }} AabbXZ
 */

/**
 * Resolve circle-vs-AABB penetration in XZ and return corrected position.
 * @param {{x:number,z:number}} pos
 * @param {number} radius
 * @param {AabbXZ} box
 */
export function resolveCircleAabbXZ(pos, radius, box) {
  const closestX = clamp(pos.x, box.minX, box.maxX);
  const closestZ = clamp(pos.z, box.minZ, box.maxZ);
  const dx = pos.x - closestX;
  const dz = pos.z - closestZ;
  const d2 = dx * dx + dz * dz;
  if (d2 >= radius * radius || d2 === 0) return pos;

  const d = Math.sqrt(d2);
  const push = radius - d;
  return {
    x: pos.x + (dx / d) * push,
    z: pos.z + (dz / d) * push,
  };
}

/**
 * Raycast a segment (origin->target) against XZ AABBs. Returns true if blocked.
 * We ignore Y for MVP (arena is flat); this acts like a top-down LOS blocker.
 * @param {THREE.Vector3} origin
 * @param {THREE.Vector3} target
 * @param {AabbXZ[]} blockers
 */
export function isLineBlockedXZ(origin, target, blockers) {
  const o = new THREE.Vector2(origin.x, origin.z);
  const t = new THREE.Vector2(target.x, target.z);
  for (const b of blockers) {
    if (segmentIntersectsAabb2(o, t, b)) return true;
  }
  return false;
}

/**
 * Liang–Barsky style segment-AABB intersection in 2D.
 * @param {THREE.Vector2} p0
 * @param {THREE.Vector2} p1
 * @param {AabbXZ} b
 */
export function segmentIntersectsAabb2(p0, p1, b) {
  const d = p1.clone().sub(p0);
  let t0 = 0;
  let t1 = 1;

  const checks = [
    { p: -d.x, q: p0.x - b.minX },
    { p: d.x, q: b.maxX - p0.x },
    { p: -d.y, q: p0.y - b.minZ },
    { p: d.y, q: b.maxZ - p0.y },
  ];

  for (const { p, q } of checks) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
  }
  return true;
}

