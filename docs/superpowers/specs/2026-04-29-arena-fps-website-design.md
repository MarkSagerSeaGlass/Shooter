## Arena FPS Website + Playable Demo (Design Spec)

### Goal
Build a static website that includes a **playable 3D first-person arena shooter** where the player fights **one computer-controlled opponent**. Controls must be keyboard-first and match the user-provided mapping.

### Non-goals
- Multiplayer / networking
- Multiple weapons, levels, inventories, progression
- Photoreal assets, complex character rigs/animations
- Persistent saves, accounts, leaderboards

### Target platform
- Modern desktop browsers (Chrome/Edge/Firefox)
- Runs as **static files** (no backend). Local dev served via a simple static server.

---

## Controls (MVP)
### Movement / look / shoot
- **W**: move forward
- **X**: move backward
- **Arrow Left / Arrow Right**: strafe left / right
- **Arrow Up / Arrow Down**: look up / down (pitch)
- **A / D**: rotate left / right (yaw)
- **Space**: shoot

### Quality-of-life (site/demo)
- **Esc**: pause / show help overlay
- **R**: restart round (only when paused or game ended)

Notes:
- Pitch will be clamped to avoid flipping (e.g. \(-80^\circ\) to \(+80^\circ\)).
- Movement uses camera forward/right vectors projected to the ground plane.

---

## Website IA (information architecture)
### Pages
- `index.html`
  - Hero: game name + “Play Now”
  - Short pitch + feature bullets
  - Controls card (exact bindings)
  - “Tech notes” (Three.js + static)
- `play.html`
  - Full-screen WebGL canvas
  - HUD + overlays (pause/help, win/lose)
- Optional: `about.html` (may be skipped for MVP)

### Navigation
Top nav with `Home`, `Play`, optional `About`. Prominent CTA to `Play`.

---

## Visual + UX direction
- Clean “esports/arena” vibe: dark background, high-contrast accent, readable UI.
- Mobile: site responsive; **play demo is desktop-only** (keyboard required). On small screens show a friendly “Desktop recommended” message.

---

## Game design (MVP)
### Arena
- Flat floor plane, surrounding walls (rectangular arena)
- A few rectangular cover blocks
- Lighting: hemisphere + directional; subtle fog optional

### Player
- First-person camera with yaw/pitch.
- Collision: simple capsule-ish approximation (player radius + height) implemented as:
  - horizontal collision with AABBs (walls/blocks) via circle-vs-AABB resolution, and
  - floor at y=0.
- Stats:
  - Health: 100
  - Fire cooldown: e.g. 250–400ms

### Weapon + projectiles
- Projectile bullets (small spheres) with velocity, TTL (time-to-live)
- Collision against:
  - walls/blocks: destroy bullet on hit
  - opponent/player: apply damage, destroy bullet
- Damage: e.g. 10 per hit (tunable)

### Opponent (AI)
- One opponent with:
  - Health: 100
  - State machine:
    - **Roam**: wander between random waypoints; avoid walls
    - **Engage**: if player within detection radius and (optionally) line-of-sight, face player, strafe, shoot with cooldown
  - Aim model: faces player with a small random spread for fairness
- Line-of-sight:
  - Raycast from opponent to player against cover blocks; if blocked, AI repositions (or returns to roam).

### Win/Lose
- Win: opponent health <= 0
- Lose: player health <= 0
- End screen overlay with:
  - result text
  - restart button + key hint (`R`)

---

## Rendering / tech choices
- **Three.js** via CDN import map (no bundler).
- Static assets kept minimal; geometry created procedurally (boxes/planes).
- Modules:
  - `src/game/` (core loop, entities, input, collisions)
  - `src/site/` (site UI behaviors)

---

## Data flow / architecture
### Main loop responsibilities
- Input sampling (keyboard)
- Integrate movement (player + AI)
- Spawn/update bullets
- Collision detection + damage
- Update HUD state
- Render frame

### Key modules (planned)
- `InputController`: keydown/keyup map, provides intent values
- `PlayerController`: turns/looks/moves player camera, handles fire
- `EnemyController`: simple AI FSM + steering + firing
- `Physics`: collision helpers (circle-vs-AABB, bullet-vs-AABB, raycast checks)
- `GameState`: health, cooldown timers, pause/end state

---

## Performance + constraints
- Keep draw calls low: simple meshes, shared materials.
- Avoid heavy postprocessing.
- Target stable 60fps on typical laptops.

---

## Acceptance criteria
- Website loads with clear CTA and control list matching spec.
- `play.html` starts a round; player can:
  - move with W/X + arrow strafing
  - rotate with A/D
  - pitch with arrow up/down
  - shoot with space
- One enemy spawns, moves, and shoots back.
- Health decreases on hits; win/lose overlays appear correctly; restart works.

