# Arena FPS Website + Playable Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static website that includes a playable Three.js keyboard-controlled 3D arena shooter (1 player vs 1 AI opponent) with the control scheme defined in the spec.

**Architecture:** A small static site (`index.html`, `play.html`) loads ES modules from `src/`. `play.html` boots a `Game` module that owns the Three.js scene, controllers, physics helpers, bullets, HUD state, and win/lose overlays.

**Tech Stack:** HTML/CSS/JS (no build), Three.js via CDN import map, simple local static server for testing.

---

## File structure (to create)
- Create: `index.html` — marketing home page + “Play Now”
- Create: `play.html` — full-screen canvas page + HUD/overlays
- Create: `styles/site.css` — shared site styling
- Create: `styles/play.css` — play page + HUD styling
- Create: `src/site/nav.js` — small helper to set active nav link
- Create: `src/site/home.js` — home page interactions (CTA scroll, etc.)
- Create: `src/play/bootstrap.js` — page entrypoint; starts game; wires pause/restart UI
- Create: `src/game/Game.js` — owns Three.js renderer, loop, state
- Create: `src/game/InputController.js` — keyboard state → intentions (move/turn/look/shoot)
- Create: `src/game/PlayerController.js` — camera yaw/pitch + movement + fire
- Create: `src/game/EnemyController.js` — AI roam/engage + steering + fire
- Create: `src/game/Physics.js` — collision helpers (circle-vs-AABB), ray LOS checks, bullet collisions
- Create: `src/game/Arena.js` — builds arena meshes + returns collision AABBs
- Create: `src/game/HUD.js` — lightweight HUD state sync (DOM updates)

---

### Task 1: Scaffold static site pages

**Files:**
- Create: `index.html`
- Create: `play.html`
- Create: `styles/site.css`
- Create: `styles/play.css`
- Create: `src/site/nav.js`
- Create: `src/site/home.js`

- [ ] **Step 1: Add `index.html` with hero + controls card**
  - Include top nav with links to `index.html` and `play.html`.
  - Include a “Play Now” button that links to `play.html`.

- [ ] **Step 2: Add `play.html` with full-screen canvas + HUD DOM**
  - Provide HUD elements: player health, enemy health, status (paused/win/lose), and control hints.
  - Include an import map for Three.js and a module script `src/play/bootstrap.js`.

- [ ] **Step 3: Add shared CSS**
  - Site: dark esports vibe, responsive layout.
  - Play: fixed HUD, pause overlay, mobile warning.

- [ ] **Step 4: Smoke-test pages load**
  - Run: `py -m http.server 5173`
  - Open: `http://localhost:5173/` and `http://localhost:5173/play.html`
  - Expected: pages render; no console errors (game may not run yet).

---

### Task 2: Implement input + player camera control

**Files:**
- Create: `src/play/bootstrap.js`
- Create: `src/game/InputController.js`
- Create: `src/game/PlayerController.js`

- [ ] **Step 1: Implement keyboard mapping**
  - W forward, X back
  - ArrowLeft/ArrowRight strafe
  - A/D yaw rotation
  - ArrowUp/ArrowDown pitch
  - Space shoot (with edge-trigger so holding doesn’t spam unless intended)
  - Esc pause toggle
  - R restart (when paused or ended)

- [ ] **Step 2: Implement player yaw/pitch with clamp**
  - Clamp pitch to [-80°, +80°]
  - Apply yaw/pitch to camera orientation

- [ ] **Step 3: Implement player movement intent**
  - Move on ground plane using camera forward/right projected onto XZ
  - Speed tuned for arena feel

- [ ] **Step 4: Manual test**
  - Open `play.html` and confirm moving/looking/turning works (no arena collision yet).

---

### Task 3: Create arena geometry and collisions

**Files:**
- Create: `src/game/Arena.js`
- Create: `src/game/Physics.js`
- Modify: `src/game/Game.js` (created in Task 4 but planned)

- [ ] **Step 1: Build arena meshes**
  - Floor plane, 4 perimeter walls
  - 4–8 cover blocks
  - Return a list of AABBs for collision and ray tests

- [ ] **Step 2: Implement circle-vs-AABB resolution**
  - Treat player and enemy as circles on XZ with a radius
  - Resolve penetration by pushing out along shortest vector

- [ ] **Step 3: Manual test**
  - Confirm player cannot leave arena and slides along walls/cover.

---

### Task 4: Implement Game loop + rendering

**Files:**
- Create: `src/game/Game.js`
- Modify: `src/play/bootstrap.js`

- [ ] **Step 1: Initialize renderer/scene/camera/lights**
  - Renderer attaches to a `<canvas>` in `play.html`
  - Resize handling

- [ ] **Step 2: Create player + enemy entities**
  - Spawn positions on opposite sides
  - Stats: health=100

- [ ] **Step 3: Implement fixed-timestep-ish update**
  - Use `requestAnimationFrame` and delta time
  - Pause stops update but continues rendering UI

- [ ] **Step 4: Manual test**
  - Page loads; scene renders; movement/collision works.

---

### Task 5: Bullets, damage, win/lose

**Files:**
- Modify: `src/game/Game.js`
- Modify: `src/game/Physics.js`
- Create: `src/game/HUD.js`

- [ ] **Step 1: Bullet spawning + update**
  - Bullets are spheres with velocity and TTL
  - Destroy on wall/cover hit

- [ ] **Step 2: Hit detection**
  - Bullet vs player/enemy circle radius
  - Apply damage (default 10), update health

- [ ] **Step 3: End states**
  - Win when enemy health <= 0
  - Lose when player health <= 0
  - Show overlay, allow restart

- [ ] **Step 4: Manual test**
  - Player shoots enemy, health decreases; win triggers.

---

### Task 6: Enemy AI (roam + engage)

**Files:**
- Create: `src/game/EnemyController.js`
- Modify: `src/game/Game.js`
- Modify: `src/game/Physics.js`

- [ ] **Step 1: Roam behavior**
  - Pick random waypoint; steer; avoid walls via collision system

- [ ] **Step 2: Engage behavior**
  - Detect player within range
  - Optional line-of-sight check via ray vs AABBs
  - Strafe while facing player; maintain distance; shoot with cooldown + aim spread

- [ ] **Step 3: Manual test**
  - Enemy wanders; when near/visible, it fights back.

---

### Task 7: Final polish + verification

**Files:**
- Modify: `index.html`, `play.html`, `styles/*`, `src/*` as needed

- [ ] **Step 1: UX polish**
  - Clear controls panel; pause/help overlay; restart UX
  - “Desktop recommended” message on small screens for `play.html`

- [ ] **Step 2: Verification pass**
  - Run local server
  - Play one full round: move, rotate, pitch, shoot, get hit, win/lose, restart
  - Check browser console for errors

