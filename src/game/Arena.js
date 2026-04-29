import * as THREE from "three";

function makeBox({ w, h, d, color }) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0.06,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * @typedef {{ minX:number, minZ:number, maxX:number, maxZ:number }} AabbXZ
 */

/**
 * Builds the arena and returns collision AABBs (XZ plane).
 * @param {THREE.Scene} scene
 */
export function buildArena(scene) {
  const aabbs = /** @type {AabbXZ[]} */ ([]);

  const floorSize = 46;
  const wallH = 4;
  const wallT = 1.4;

  const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize, 1, 1);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0b1022"),
    roughness: 0.95,
    metalness: 0.02,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.receiveShadow = true;
  scene.add(floor);

  const half = floorSize / 2;
  const wallColor = new THREE.Color("#111a34");

  // Walls (axis-aligned)
  const north = makeBox({ w: floorSize + wallT * 2, h: wallH, d: wallT, color: wallColor });
  north.position.set(0, wallH / 2, -half - wallT / 2);
  scene.add(north);
  aabbs.push({
    minX: -half - wallT,
    maxX: half + wallT,
    minZ: -half - wallT,
    maxZ: -half,
  });

  const south = makeBox({ w: floorSize + wallT * 2, h: wallH, d: wallT, color: wallColor });
  south.position.set(0, wallH / 2, half + wallT / 2);
  scene.add(south);
  aabbs.push({
    minX: -half - wallT,
    maxX: half + wallT,
    minZ: half,
    maxZ: half + wallT,
  });

  const west = makeBox({ w: wallT, h: wallH, d: floorSize, color: wallColor });
  west.position.set(-half - wallT / 2, wallH / 2, 0);
  scene.add(west);
  aabbs.push({
    minX: -half - wallT,
    maxX: -half,
    minZ: -half,
    maxZ: half,
  });

  const east = makeBox({ w: wallT, h: wallH, d: floorSize, color: wallColor });
  east.position.set(half + wallT / 2, wallH / 2, 0);
  scene.add(east);
  aabbs.push({
    minX: half,
    maxX: half + wallT,
    minZ: -half,
    maxZ: half,
  });

  // Cover blocks
  const coverColor = new THREE.Color("#16224a");
  const coverSpecs = [
    { x: -10, z: -10, w: 4, d: 6, h: 2.6 },
    { x: 11, z: -9, w: 6, d: 3.5, h: 2.4 },
    { x: -12, z: 12, w: 5.5, d: 4, h: 2.2 },
    { x: 8, z: 11, w: 4, d: 6.5, h: 2.7 },
    { x: 0, z: 0, w: 6, d: 2.8, h: 2.2 },
  ];

  for (const c of coverSpecs) {
    const m = makeBox({ w: c.w, h: c.h, d: c.d, color: coverColor });
    m.position.set(c.x, c.h / 2, c.z);
    scene.add(m);
    aabbs.push({
      minX: c.x - c.w / 2,
      maxX: c.x + c.w / 2,
      minZ: c.z - c.d / 2,
      maxZ: c.z + c.d / 2,
    });
  }

  // A subtle “center marker”
  const ringGeo = new THREE.RingGeometry(0.6, 0.72, 48);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#7aa7ff"), transparent: true, opacity: 0.45 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 0.02, 0);
  scene.add(ring);

  return { aabbs, halfSize: half };
}

