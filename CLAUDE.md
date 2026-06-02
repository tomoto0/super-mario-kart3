# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A 3D Mario Kart-style racing game built on **Three.js r128**, served as a **zero-build, classic-script** web app. There is no bundler, no `node_modules` used at runtime, and no TypeScript/React despite what the README's "stack" section claims — the actual playable game is plain ES5/ES6 scripts in `client/public/`.

## Repository

- **GitHub (public):** https://github.com/tomoto0/super-mario-kart2 — remote `origin`, default branch `main`.
- The README's clone example points at `tomoto0/3d-super-mario-kart`; that is a *separate, earlier* repo. This codebase lives in `super-mario-kart2`.
- **Gitignored (do not commit):** `.claude/settings.local.json` (machine-local Claude Code permissions), `.DS_Store`, `node_modules/`, lockfiles. See `.gitignore`.
- No CI/CD, no GitHub Actions, no release process is configured — pushing to `main` is the whole workflow. There are no dependencies to install for the game itself (`package.json` has no `dependencies`/`devDependencies`).

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

- **Characters** (`config.js` `MK.CHARACTERS`): ★1–5 stats → physics via `MK.deriveStats` → `{maxSpeed, accel, turnRate, weight}`. Models are built procedurally in `characters.js` (`MK.Characters.build(id, colors)`); the kart chassis in `kart.js` (`MK.buildChassis(color, accent)` — `accent` is the character's `colors.secondary`, used for stripes/wing/spokes). All user-facing text is **English**; the `jp` field on characters/courses is now unused metadata.
- **Items** (`config.js` `MK.ITEMS`): the item box roulette uses `MK.rollItem(place, racerCount)`, which is **rubber-banded** (back-of-pack gets stronger items). `ItemSystem` (`items.js`) owns boxes, projectiles (shells/bomb), bananas, and lightning; **kart-vs-kart collisions and star-ram are in `Game._resolveCollisions`**, not `ItemSystem`. Items with a `count` (`triple` mushrooms, `tripleGreen` shells) deal a stack. **`tripleGreen` (type `tripleShell`) is stateful**: the first Space press calls `_activateTripleShell` → 3 shells orbit the kart (`ItemSystem.orbiters`, updated in `_updateOrbiters`: ram enemies / cancel incoming projectiles / shield the owner — the `kart._orbiter` back-ref). **Each ram, block, or fire consumes exactly one shell** (`sh.dead` flag → cleanup pass updates `itemCount`); pressing Space again `_fireOrbitShell`s one forward. Shells also all drop if the owner is hit/shrunk/falls. Lightning spawns 3D `_spawnBolt` meshes (`this.bolts`) and drops victims' orbiters; reusable effect presets live in `particles.js` (`shockwave`/`burst`/`itemPop`/`starBurst`/`shellTrail`/`boltFlash`). `ItemSystem.reset()` must dispose orbiters+bolts.
- **Courses** (`courses.js` `MK.COURSES`): each is plain data — `points` (`[x,z]` flat or `[x,y,z]` for elevation; the `y` gives rolling hills, all four courses now undulate), a `theme` (sky/ground/fog/light colors + a `props` set: `grass|snow|castle|rainbow`; `lava: true` for the castle), `hasWalls`, `voidRespawn` (fall-off + Lakitu respawn), an optional `tension` (Catmull-Rom; **low tension ≈ angular corners**), `shoulder`, item-box fractions, a `banner` (English start/finish flag text) + `theme.bannerColor`, and a `music` path (race BGM, served from `client/public/music/`). The closed spline is `THREE.CatmullRomCurve3`; **Bowser's Castle is a closed "castle arena" rounded-rectangle** (12 points: corner chamfers + straight midpoints so the offset road/walls never bowtie — min curvature radius ≈ 21 ≫ wallHalf 12; `tension` 0.5) over an animated lava sea (rendered in `scenery.js`, walled walkways). **Validate any new/edited winding course with the offset-self-intersection check** (replicate THREE's closed Catmull-Rom, offset by `wallHalf`, test for segment crossings) — sharp turns with offset > local radius are what make road/walls look "broken". The README mentions JSON course files, but the runtime uses this JS data to avoid `fetch`/`file://` issues. Add a course by appending to `MK.COURSES` (give it a `music` entry; validate no self-intersection if it winds).
- **Hazards / enemies** (`hazards.js` `MK.HazardSystem`): theme-keyed obstacles placed along the track — `grass`→Goomba/Koopa/Piranha/Monty-Mole, `snow`→Penguin/Snowball/Icicle, `castle`→Thwomp/Fire-Bar/Podoboo(lava bubble)/Flame-Jet, `rainbow`→Chain-Chomp/Comet/Star-Bar. Each `hz` exposes `hitPoints[]` (world `Vector3`s), `dangerous` (often time-gated by its motion cycle), `radius`, `effect` (`spin`|`launch`), and `markerPos`; meshes are built in the `Build` map and animated per-kind in `_animate`. Collisions are gated by `kart.isHittable()` (Star/invuln immune). `nearestDangerAhead(kart, dist)` feeds the AI's avoidance nudge in `ai.js`, and `hazards` are drawn as red minimap markers. Built/updated/reset by `Game` alongside scenery/items. Add a kind: a `Build.*` mesh + an `_add` branch (set `radius`/`effect`/`hitPoints`) + an `_animate` case + an entry in the `build()` per-theme plan.
- **Difficulty**: `DIFF` in `game.js` scales **AI** `maxSpeed`/`accel` and skill; the player is unaffected.

### Assets: procedural graphics/SFX + real MP3 BGM

- **Procedural (no files):** all textures are canvas-generated (`utils.js`: `questionTexture`, `checkerTexture`, sprite/particle textures), **sound effects and the speed-linked engine tone are synthesized at runtime** with the Web Audio API (`audio.js`), and every mesh is built from Three.js primitives. `client/public/assets/` is empty by design. Concept-art references for the art direction live in `concept_art/` (not loaded at runtime).
- **Set pieces & decoration** are all procedural meshes: themed **roadside fences/guardrails** follow the track in `track.js` (`_buildFences` → `_fencePost`/`_fenceRail`, keyed by `theme.props`), and per-course **background landmarks + props** are in `scenery.js` `Build.*` (e.g. `peachCastle`, `bowserKeep` + an encircling battlement ring with embedded `whompBlock` faces, `igloo`, ice-bergs, `castlePillar`, `ringedPlanet`, `flower`), placed in `_buildEnvironment`/`_pickProp`.
- **Real BGM (`client/public/music/*.mp3`):** background music is no longer synthesized — it plays scene-appropriate MP3 tracks via HTML5 `Audio` elements (crossfaded, looped) in `audio.js`. The scene→track map is `MK.MUSIC` (`title`/`select`/`results`/`star`) in `audio.js`; per-course tracks are the `music` field on each course in `courses.js`. `Game`/`UI` drive it: `playMenuMusic(key)` (title/char-select/course-select/results), `playCourseMusic(course)` (race build), and a per-frame `playStarMusic()`/`endStarMusic()` overlay (`Game._updateStarMusic`) that swaps to the Star track while the player is invincible and reverts to the course track. Autoplay-policy is handled by retrying `.play()` on the first user gesture (`_attemptPlay`/`_kickPending`); `M` mutes everything, `B` toggles music (`toggleMusic`), pause uses `pauseMusic`/`resumeMusic`.
- **The `music/` MP3s are committed** (`client/public/music/*.mp3`, ~77 MB) — they are real Mario Kart 64 OST tracks and are tracked in the repo by project decision (they were previously gitignored; that exclusion was removed). Without them the game still runs (SFX work; menus/races are just silent). Code degrades gracefully if `Audio` is unavailable (headless) or a file is missing.

### Frame timing

Physics is frame-rate independent: `dt` is clamped (`≤0.045`) and smoothing uses exponential damping helpers `U.damp` / `U.dampAngle` / `U.dampFactor` rather than fixed lerp factors. `performance.now()` drives cosmetic animations (bobbing, flicker, star flash).
