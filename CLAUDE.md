# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A 3D Mario Kart-style racing game built on **Three.js r128**, served as a **zero-build, classic-script** web app. There is no bundler, no `node_modules` used at runtime, and no TypeScript/React despite what the README's "stack" section claims — the actual playable game is plain ES5/ES6 scripts in `client/public/`.

## Commands

```bash
npm start          # = node server/index.js  → http://localhost:5173/game.html
npm run dev        # identical (alias)
npm run serve      # identical (alias)
npm run build      # no-op; there is NO build step

# Alternatives
npx serve client/public                 # any static server works
# Opening client/public/game.html directly via file:// also works
# (classic scripts + no fetch). Internet is required once for the Three.js CDN.
```

`server/index.js` is a dependency-free Node static server that serves `client/public` (root `/` → `game.html`, unknown paths fall back to `game.html`).

### Verifying changes (no test framework)

There is no test runner or linter configured. Smoke-check syntax after edits:

```bash
node --check client/public/js/<file>.js      # one file
for f in client/public/js/*.js; do node --check "$f"; done
```

`node --check` only validates syntax (it cannot run the game — every module references the global `THREE`). To exercise runtime logic headlessly, scripts can be `vm.runInThisContext`-loaded in order against a `THREE`/`window`/`document` mock; nothing depends on a real WebGL context until `renderer.render` is called.

## Architecture

### The `window.MK` namespace + ordered script loading (read this first)

Everything lives on one global object, `window.MK`. Each file is an IIFE — `(function (MK) { 'use strict'; ... })(window.MK)` — that attaches classes (`MK.Kart`), singletons (`MK.audio`, `MK.input`, `MK.hud`, `MK.ui`, `MK.game`), or data (`MK.CONFIG`, `MK.CHARACTERS`, `MK.ITEMS`, `MK.COURSES`). **There are no imports.** Cross-module access is always `MK.*`.

`game.html` loads the 17 scripts in a **fixed dependency order** — changing it breaks `class X extends MK.Y` and top-level data references (most runtime cross-calls are order-independent, but class inheritance and load-time data are not):

```
config → utils → audio → input → particles → characters → kart → items →
scenery → track → ai → camera → hud → courses → ui → game → main
```

When adding a module: wrap it in the IIFE pattern and insert its `<script>` in `game.html` at the right point in this chain.

### `Game` is the "world"

`MK.Game` (`game.js`) owns the renderer/scene/camera, the state machine, and the per-frame loop. **The `Game` instance is passed as `world` into `Kart`, `ItemSystem`, and `AIController`**, which reach back through it: `world.scene`, `world.particles`, `world.items`, `world.track`, `world.karts`, `world.player`, plus callbacks `world.onLightning(owner)` and `world.shake(amount)`. To understand any system you usually need `game.js` open alongside it.

State machine: `title → charselect → courseselect → countdown → racing → finished → results` (+ `paused`). `main.js` wires DOM-menu callbacks (`MK.ui.cb.*`) to `Game` methods. The UI (`ui.js`) only handles menu screens; `Game` owns the transitions that must tear down a race (`quitToTitle`, `toCourseSelect`, `restart`, via `cleanupRace`/`_buildRace`). Per-frame work is split by state in `Game.frame` → `_updateCountdown` / `_updateRacing` / `_updateFinished`; menus/pause render only.

### Coordinate & heading conventions (used everywhere)

- **Forward = `-Z`.** `group.rotation.y = yaw`; `forward = (-sin yaw, 0, -cos yaw)` (see `Kart.forward`).
- **Steering:** `steer > 0` means right, which *decreases* yaw.
- **Track normal points LEFT.** `track.project(pos).lateral = (pos - point) · normal`, so positive lateral = left of the centerline.

Kart, track, AI, and camera all assume these. Break one and motion goes wrong silently.

### Track model (`track.js`)

A course centerline is a closed `THREE.CatmullRomCurve3` built from `course.points`. It is sampled into `track.samples[i] = {point, tangent, normal}` at uniform arc-length (`getPointAt`/`getTangentAt`). Road, curbs, and (optionally) walls are generated as ribbon `BufferGeometry`. `track.project(pos)` does a global nearest-sample search and returns `{index, fraction, lateral, point, tangent, normal}`.

Two important contracts:
- `project()` returns **references to the sample's shared vectors** (`point/tangent/normal`). Do not mutate them, and consume the result before the next `project()` call.
- **Lap counting lives in `Kart._updateProgress`**, not the track: it watches the fraction wrap (`>0.85 → <0.15`) and only counts it after a half-lap checkpoint (`passedHalf`) was crossed. Karts must be initialized with a correct `sampleIndex` and `lastFraction` after placement (see `Game._buildRace`).

### Kart physics (`kart.js`)

Arcade model: a scalar `speed` advanced along `yaw`. Controls are pushed in from outside as `controls = {throttle, brake, steer, drift, reverseHeld}` — the **player fills them from `MK.input`, the AI fills the same struct from `AIController`** (`ai.js`). Drift accumulates a charge that crosses `CONFIG.miniTurbo` tiers (blue/orange/purple) and fires `applyBoost` on release. Hit reactions (`spinOut` / `squish` / `launch` / `giveStar`) are gated by `isHittable()`. Visual transform hierarchy: `group` (yaw + world position) → `tilt` (drift roll + hop) → `chassis` (+ driver model). Shadows are fake blob sprites, not real shadow maps.

### Data-driven content

- **Characters** (`config.js` `MK.CHARACTERS`): ★1–5 stats → physics via `MK.deriveStats` → `{maxSpeed, accel, turnRate, weight}`. Models are built procedurally in `characters.js` (`MK.Characters.build(id, colors)`); the kart chassis in `kart.js` (`MK.buildChassis(color)`).
- **Items** (`config.js` `MK.ITEMS`): the item box roulette uses `MK.rollItem(place, racerCount)`, which is **rubber-banded** (back-of-pack gets stronger items). `ItemSystem` (`items.js`) owns boxes, projectiles (shells/bomb), bananas, and lightning; **kart-vs-kart collisions and star-ram are in `Game._resolveCollisions`**, not `ItemSystem`.
- **Courses** (`courses.js` `MK.COURSES`): each is plain data — `points` (`[x,z]` or `[x,y,z]` control points for the closed spline), a `theme` (sky/ground/fog/light colors + a `props` set: `grass|snow|castle|rainbow`), `hasWalls`, `voidRespawn` (fall-off + Lakitu respawn), and item-box fractions. The README mentions JSON course files, but the runtime uses this JS data to avoid `fetch`/`file://` issues. Add a course by appending to `MK.COURSES`.
- **Hazards / enemies** (`hazards.js` `MK.HazardSystem`): theme-keyed obstacles placed along the track (`grass`→Goomba/Piranha, `snow`→Penguin, `castle`→Thwomp/Fire Bar, `rainbow`→Chain Chomp). Each `hz` exposes `hitPoints[]` (world `Vector3`s), `dangerous`, `radius`, `effect` (`spin`|`launch`), and `markerPos`; collisions are gated by `kart.isHittable()` (so Star/invuln are immune). `nearestDangerAhead(kart, dist)` feeds the AI's avoidance nudge in `ai.js`, and `hazards` are drawn as red minimap markers. Built/updated/reset by `Game` alongside scenery/items.
- **Difficulty**: `DIFF` in `game.js` scales **AI** `maxSpeed`/`accel` and skill; the player is unaffected.

### No binary assets (intentional)

All textures are canvas-generated (`utils.js`: `questionTexture`, `checkerTexture`, sprite/particle textures), all audio is synthesized at runtime with the Web Audio API (`audio.js`, including the original looping BGM scheduler and a speed-linked engine tone), and every mesh is built from Three.js primitives. `client/public/assets/` is empty by design.

### Frame timing

Physics is frame-rate independent: `dt` is clamped (`≤0.045`) and smoothing uses exponential damping helpers `U.damp` / `U.dampAngle` / `U.dampFactor` rather than fixed lerp factors. `performance.now()` drives cosmetic animations (bobbing, flicker, star flash).
