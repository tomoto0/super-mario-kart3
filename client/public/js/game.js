/* ============================================================================
 *  game.js — 全体統合（レンダラ/状態機械/レース構築/メインループ）
 *  この Game インスタンスが各システムから参照される "world"。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;
  const C = MK.CONFIG;

  const DIFF = {
    EASY: { skill: 0.55, speedMul: 0.9, accelMul: 0.95 },
    NORMAL: { skill: 0.8, speedMul: 1.0, accelMul: 1.0 },
    HARD: { skill: 0.96, speedMul: 1.07, accelMul: 1.08 },
  };

  class Game {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if ('outputEncoding' in this.renderer) this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.setClearColor(0x101020, 1);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(C.fov, window.innerWidth / window.innerHeight, 0.5, C.drawDistance);
      this.camera.position.set(0, 10, 20);
      this.cameraCtrl = new MK.CameraController(this.camera);

      this.clock = new THREE.Clock();
      this.state = 'title';

      // レース系（毎レース生成）
      this.track = null; this.scenery = null; this.items = null; this.particles = null;
      this.hazards = null;
      this.karts = []; this.player = null; this.lights = null; this.envFog = null;

      this.raceTime = 0;
      this.countTimer = 0;
      this.lastCountShown = -1;
      this.finishDelay = 0;
      this._starMusicOn = false;

      U.initTmp();
      this._initRendererTargets();
      this._bindGlobal();
    }

    _initRendererTargets() {
      // メニュー表示用の薄い背景シーン
      this.scene.background = new THREE.Color(0x0b1024);
    }

    _bindGlobal() {
      window.addEventListener('resize', () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      });
    }

    /* ---- world インターフェース ---- */
    onLightning(owner) {
      if (MK.hud) MK.hud.lightningFlash();
      this.cameraCtrl.shake(this.player && this.player !== owner ? 0.95 : 0.4);
    }
    shake(a) { this.cameraCtrl.shake(a); }

    /* ============ レース構築 ============ */
    startRace(character, course, difficulty) {
      this.cleanupRace();
      this.selectedChar = character;
      this.selectedCourse = course;
      this.difficulty = difficulty || 'NORMAL';
      const diff = DIFF[this.difficulty] || DIFF.NORMAL;

      MK.ui.showLoading(0.2);
      MK.audio.init();

      // 次フレームで重い構築（ローディング表示のため）
      setTimeout(() => this._buildRace(character, course, diff), 40);
    }

    _buildRace(character, course, diff) {
      const scene = this.scene;
      const theme = course.theme;

      // 背景・霧・ライト
      scene.background = new THREE.Color(theme.sky ? theme.sky[1] : 0x88c0ff);
      this.envFog = new THREE.Fog(theme.fog, theme.fogNear, theme.fogFar);
      scene.fog = this.envFog;

      this.lights = new THREE.Group();
      const hemi = new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, theme.light != null ? theme.light : 1.0);
      this.lights.add(hemi);
      const dir = new THREE.DirectionalLight(0xffffff, 0.7);
      dir.position.set(60, 120, 40);
      this.lights.add(dir);
      const amb = new THREE.AmbientLight(0xffffff, 0.18);
      this.lights.add(amb);
      scene.add(this.lights);

      MK.ui.showLoading(0.45);

      // コース
      this.track = new MK.Track(scene, course).build();

      // 装飾
      this.scenery = new MK.Scenery(scene, course, this.track);
      this.scenery.build();

      // パーティクル / アイテム
      this.particles = new MK.ParticleSystem(scene, 460);
      this.items = new MK.ItemSystem(this);
      this.items.buildBoxes(this.track.itemBoxPositions);

      // 敵キャラ（コース妨害）
      this.hazards = new MK.HazardSystem(this);
      this.hazards.build(course);

      MK.ui.showLoading(0.7);

      // キャラ割り当て
      const others = MK.CHARACTERS.filter((c) => c.id !== character.id);
      this._shuffle(others);
      const lineup = [];
      const grid = this.track.startGrid(C.racerCount);
      const playerSlot = Math.min(C.racerCount - 3, 5); // 後方スタートで追い上げ
      let oi = 0;
      this.karts = [];
      this.aiControllers = [];
      for (let slot = 0; slot < C.racerCount; slot++) {
        const isPlayer = slot === playerSlot;
        const cdef = isPlayer ? character : others[oi++ % others.length];
        const kart = new MK.Kart({ index: slot, character: cdef, isPlayer, scene, world: this, track: this.track });
        const g = grid[slot];
        kart.group.position.copy(g.pos);
        kart.yaw = g.yaw;
        kart.place = slot + 1;
        const info = this.track.project(kart.group.position);
        kart.sampleIndex = info.index;
        kart.lastFraction = info.index / this.track.sampleCount;
        if (isPlayer) {
          this.player = kart;
          this.cameraCtrl.setTarget(kart);
        } else {
          // 難易度でAIの性能を微調整
          kart.derived.maxSpeed *= diff.speedMul;
          kart.derived.accel *= diff.accelMul;
          const ai = new MK.AIController(kart, this.track, this, diff.skill + U.randRange(-0.06, 0.06));
          this.aiControllers.push(ai);
        }
        this.karts.push(kart);
      }

      MK.ui.showLoading(0.9);

      // HUD
      MK.hud.initMinimap(this.track);
      MK.hud.reset();
      MK.hud.show(true);
      MK.input.showTouch(true);

      // カメラ・イントロ
      this.cameraCtrl.startIntro(3.2);
      this.raceTime = 0;
      this.countTimer = 4.0;
      this.lastCountShown = -1;
      this.finishDelay = 0;

      MK.input.attach();
      MK.audio.startEngine();
      MK.audio.playCourseMusic(course);
      this._starMusicOn = false;

      MK.ui.hideAll();
      this.state = 'countdown';
    }

    _shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }

    cleanupRace() {
      MK.audio.stopEngine();
      this._starMusicOn = false;
      if (this.items) this.items.reset();
      if (this.scenery) this.scenery.reset();
      if (this.hazards) this.hazards.reset();
      for (const k of this.karts) k.dispose();
      if (this.particles) { for (const s of this.particles.pool) this.scene.remove(s); }
      if (this.track) this.track.reset();
      if (this.lights) this.scene.remove(this.lights);
      this.scene.fog = null;
      this.karts = []; this.aiControllers = []; this.player = null;
      this.track = null; this.scenery = null; this.items = null; this.particles = null; this.hazards = null; this.lights = null;
    }

    quitToTitle() {
      this.cleanupRace();
      MK.hud.show(false);
      MK.input.showTouch(false);
      this.state = 'title';
      this.scene.background = new THREE.Color(0x0b1024);
      MK.ui.showTitle();
    }

    toCourseSelect() {
      this.cleanupRace();
      MK.hud.show(false);
      MK.input.showTouch(false);
      this.state = 'courseselect';
      this.scene.background = new THREE.Color(0x0b1024);
      MK.ui.showCourseSelect();
    }

    /* ============ ループ ============ */
    start() {
      const loop = () => {
        requestAnimationFrame(loop);
        this.frame();
      };
      loop();
    }

    frame() {
      const dt = Math.min(this.clock.getDelta(), 0.045);

      if (this.state === 'countdown') this._updateCountdown(dt);
      else if (this.state === 'racing') this._updateRacing(dt);
      else if (this.state === 'finished') this._updateFinished(dt);
      // paused / title / results は更新せず描画のみ

      this.renderer.render(this.scene, this.camera);
      MK.input.endFrame();
    }

    _updateCountdown(dt) {
      this.cameraCtrl.update(dt);
      if (this.scenery) this.scenery.update(dt, this.karts);
      if (this.particles) this.particles.update(dt);

      // エンジン空ぶかし
      MK.audio.setEngine(0.2 + Math.sin(performance.now() * 0.01) * 0.1, false);

      this.countTimer -= dt;
      const n = Math.ceil(this.countTimer - 1); // 3,2,1
      if (n !== this.lastCountShown) {
        this.lastCountShown = n;
        if (n === 3) { MK.hud.countdown('3'); MK.audio.countdownBeep(false); this.scenery && this.scenery.setSignal(1, false); }
        else if (n === 2) { MK.hud.countdown('2'); MK.audio.countdownBeep(false); this.scenery && this.scenery.setSignal(2, false); }
        else if (n === 1) { MK.hud.countdown('1'); MK.audio.countdownBeep(false); this.scenery && this.scenery.setSignal(3, false); }
      }
      if (this.countTimer <= 1.0) {
        // GO!
        MK.hud.go();
        MK.audio.countdownBeep(true);
        this.scenery && this.scenery.setSignal(3, true);
        this.state = 'racing';
        // スタートダッシュ判定（簡易）：GOの瞬間にアクセルでミニブースト
        const c = MK.input.getDriveControls();
        if (this.player && c.throttle > 0) this.player.applyBoost(6, 0.6);
      }
    }

    _handlePlayerInput() {
      const p = this.player;
      if (!p) return;
      const controls = MK.input.getDriveControls();
      if (!p.finished) p.setControls(controls);
      else p.setControls({ throttle: 0.6, brake: 0, steer: 0, drift: false, reverseHeld: false });

      if (!p.finished && MK.input.consumeItemPress() && p.item && p.item !== '__rolling__') {
        this.items.useItem(p);
        MK.hud.setItem(p.item, p.itemCount, p.rouletteTime > 0);
      }
      if (MK.input.wasPressed('KeyP')) this.togglePause();
      if (MK.input.wasPressed('KeyC')) this.cameraCtrl.cycle();
      if (MK.input.wasPressed('KeyM')) { const on = MK.audio.toggleMute(); }
      if (MK.input.wasPressed('KeyB')) { MK.audio.toggleMusic(); }
    }

    _updateRacing(dt) {
      this.raceTime += dt;
      this._handlePlayerInput();
      if (this.state !== 'racing') return; // ポーズに入った場合

      // AI
      for (const ai of this.aiControllers) ai.update(dt);
      // 物理
      for (const k of this.karts) k.update(dt, this.raceTime);
      // 衝突
      this._resolveCollisions(dt);
      // システム
      this.items.update(dt);
      this.scenery.update(dt, this.karts);
      this.hazards.update(dt);
      this.particles.update(dt);
      // 順位
      this._rank();
      // カメラ・HUD
      this.cameraCtrl.update(dt);
      MK.hud.update(dt, this);
      // プレイヤーのアイテム枠
      const p = this.player;
      MK.hud.setItem(p.rouletteTime > 0 ? null : p.item, p.itemCount, p.rouletteTime > 0);
      // エンジン音
      MK.audio.setEngine(U.clamp(Math.abs(p.speed) / p.derived.maxSpeed, 0, 1.2), p.controls.throttle > 0);
      // スター無敵中は BGM をスター曲へ
      this._updateStarMusic();

      // ゴール判定
      if (p.finished && this.finishDelay <= 0) {
        this.finishDelay = 5.0;
        MK.hud.finish();
        MK.audio.finishJingle();
        this.state = 'finished';
      }
    }

    _updateFinished(dt) {
      this.raceTime += dt;
      this._handlePlayerInput();
      for (const ai of this.aiControllers) ai.update(dt);
      for (const k of this.karts) k.update(dt, this.raceTime);
      this._resolveCollisions(dt);
      this.items.update(dt);
      this.scenery.update(dt, this.karts);
      this.hazards.update(dt);
      this.particles.update(dt);
      this._rank();
      this.cameraCtrl.update(dt);
      MK.hud.update(dt, this);
      MK.audio.setEngine(U.clamp(Math.abs(this.player.speed) / this.player.derived.maxSpeed, 0, 1.2), false);
      this._updateStarMusic();

      this.finishDelay -= dt;
      if (this.finishDelay <= 0) this._showResults();
    }

    // プレイヤーのスター状態に合わせて BGM を切り替える
    _updateStarMusic() {
      const p = this.player;
      if (!p) return;
      if (p.hasStar()) {
        if (!this._starMusicOn) { MK.audio.playStarMusic(); this._starMusicOn = true; }
      } else if (this._starMusicOn) {
        MK.audio.endStarMusic(); this._starMusicOn = false;
      }
    }

    _showResults() {
      this.state = 'results';
      MK.audio.stopEngine();
      this._starMusicOn = false;
      MK.audio.playMenuMusic('results');
      MK.hud.show(false);
      MK.input.showTouch(false);
      const sorted = this._sortedKarts();
      const standings = sorted.map((k) => ({
        kart: k, isPlayer: k.isPlayer, finished: k.finished, time: k.finishTime,
      }));
      MK.ui.showResults(standings, this.player);
    }

    _sortedKarts() {
      return [...this.karts].sort((a, b) => {
        if (a.finished && b.finished) return a.finishTime - b.finishTime;
        if (a.finished) return -1;
        if (b.finished) return 1;
        return b.progress - a.progress;
      });
    }

    _rank() {
      const sorted = this._sortedKarts();
      for (let i = 0; i < sorted.length; i++) sorted[i].place = i + 1;
    }

    _resolveCollisions(dt) {
      const ks = this.karts;
      const R = C.kartRadius;
      for (let i = 0; i < ks.length; i++) {
        for (let j = i + 1; j < ks.length; j++) {
          const a = ks[i], b = ks[j];
          const dx = b.group.position.x - a.group.position.x;
          const dz = b.group.position.z - a.group.position.z;
          let d = Math.hypot(dx, dz);
          const minD = R * 2;
          if (d < minD && d > 0.0001) {
            // スターのひき逃げ
            if (a.hasStar() && !b.hasStar() && b.isHittable()) { b.spinOut(); a.applyBoost(2, 0.2); }
            else if (b.hasStar() && !a.hasStar() && a.isHittable()) { a.spinOut(); b.applyBoost(2, 0.2); }

            const nx = dx / d, nz = dz / d;
            const overlap = (minD - d);
            const wa = a.derived.weight, wb = b.derived.weight;
            const total = wa + wb;
            // 重い方が押し勝つ
            const pushA = overlap * (wb / total);
            const pushB = overlap * (wa / total);
            a.group.position.x -= nx * pushA; a.group.position.z -= nz * pushA;
            b.group.position.x += nx * pushB; b.group.position.z += nz * pushB;
            // 体当たり：横に弾くだけで、ほぼ失速させない
            const relPush = 2.5;
            a.speed *= 0.99; b.speed *= 0.99;
            a.group.position.x -= nx * relPush * (wb / total) * dt; a.group.position.z -= nz * relPush * (wb / total) * dt;
            b.group.position.x += nx * relPush * (wa / total) * dt; b.group.position.z += nz * relPush * (wa / total) * dt;
            if (a.isPlayer || b.isPlayer) {
              if (Math.abs(a.speed) + Math.abs(b.speed) > 20 && Math.random() < 0.3) MK.audio.bump();
            }
          }
        }
      }
    }

    togglePause() {
      if (this.state === 'racing' || this.state === 'finished') {
        this._resumeState = this.state;
        this.state = 'paused';
        MK.audio.stopEngine();
        MK.audio.pauseMusic();
        MK.ui.showPause();
      } else if (this.state === 'paused') {
        this.resume();
      }
    }
    resume() {
      if (this.state !== 'paused') return;
      MK.ui.hidePause();
      this.state = this._resumeState || 'racing';
      MK.audio.startEngine();
      MK.audio.resumeMusic();
      this.clock.getDelta(); // dt リセット
    }
    restart() {
      MK.ui.hidePause();
      this.startRace(this.selectedChar, this.selectedCourse, this.difficulty);
    }
  }

  MK.Game = Game;

})(window.MK);
