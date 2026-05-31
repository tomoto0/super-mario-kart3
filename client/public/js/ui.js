/* ============================================================================
 *  ui.js — メニュー画面（タイトル / キャラ選択 / コース選択 / ポーズ / リザルト）
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;

  /* ---- キャラ選択用のミニ3Dプレビュー ---- */
  class CharacterPreview {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this._resize();
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      this.camera.position.set(0, 2.4, 6.2);
      this.camera.lookAt(0, 1.0, 0);
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x556070, 1.1));
      const dir = new THREE.DirectionalLight(0xffffff, 0.9); dir.position.set(3, 6, 4); this.scene.add(dir);
      // 台座
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.4, 28),
        new THREE.MeshStandardMaterial({ color: 0x2a2f4a, roughness: 0.6, metalness: 0.3 }));
      disc.position.y = -0.2; this.scene.add(disc);
      this.holder = new THREE.Group(); this.scene.add(this.holder);
      this.running = false;
      this._raf = null;
    }
    _resize() {
      const r = this.canvas.getBoundingClientRect();
      const w = Math.max(120, r.width), h = Math.max(120, r.height);
      this.renderer.setSize(w, h, false);
      if (this.camera) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    }
    setCharacter(charDef) {
      while (this.holder.children.length) {
        const c = this.holder.children.pop();
        c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { Array.isArray(o.material) ? o.material.forEach((m) => m.dispose()) : o.material.dispose(); } });
        this.holder.remove(c);
      }
      const chassis = MK.buildChassis(charDef.colors.kart);
      const driver = MK.Characters.build(charDef.id, charDef.colors);
      driver.position.set(0, 0.7, 0.35);
      chassis.add(driver);
      chassis.position.y = 0.2;
      this.holder.add(chassis);
    }
    start() {
      if (this.running) return;
      this.running = true;
      const loop = () => {
        if (!this.running) return;
        this.holder.rotation.y += 0.012;
        this.renderer.render(this.scene, this.camera);
        this._raf = requestAnimationFrame(loop);
      };
      loop();
    }
    stop() { this.running = false; if (this._raf) cancelAnimationFrame(this._raf); }
  }

  class UI {
    constructor() {
      this.cb = {};
      this.selectedChar = MK.CHARACTERS[0];
      this.selectedCourse = MK.COURSES[0];
      this.difficulty = 'NORMAL';
      this.preview = null;
    }

    build(container) {
      const root = document.createElement('div');
      root.id = 'ui-root';
      root.innerHTML = this._template();
      container.appendChild(root);
      this.root = root;
      this._cacheEls();
      this._bind();
      this._buildCharacterGrid();
      this._buildCourseGrid();
    }

    _template() {
      return `
      <!-- TITLE -->
      <section id="screen-title" class="screen">
        <div class="title-bg"></div>
        <div class="title-emojis">🍄⭐🏎️🌈🐢🍌💣👑</div>
        <h1 class="game-logo"><span class="l1">SUPER</span><span class="l2">KART</span></h1>
        <p class="game-sub">3D マリオカート風レース</p>
        <button id="btn-start" class="big-btn">▶ スタート / START</button>
        <div class="title-controls">
          <b>そうさ:</b> ↑↓←→ / WASD = 走行・ハンドル ｜ Shift = ドリフト ｜ Space = アイテム ｜ R = バック ｜ C = カメラ ｜ P = ポーズ ｜ M = 音
        </div>
        <div class="title-credit">Three.js 製 / フルブラウザ対応</div>
      </section>

      <!-- CHARACTER SELECT -->
      <section id="screen-char" class="screen hidden">
        <h2 class="screen-title">ドライバーをえらぶ</h2>
        <div class="char-layout">
          <div id="char-grid" class="char-grid"></div>
          <div class="char-preview">
            <canvas id="char-preview-canvas"></canvas>
            <div id="char-info">
              <div id="char-name" class="char-name"></div>
              <div id="char-class" class="char-class"></div>
              <div id="char-blurb" class="char-blurb"></div>
              <div class="stat-list">
                <div class="stat"><span>スピード</span><div class="pips" data-stat="speed"></div></div>
                <div class="stat"><span>かそく</span><div class="pips" data-stat="accel"></div></div>
                <div class="stat"><span>ハンドル</span><div class="pips" data-stat="handling"></div></div>
                <div class="stat"><span>おもさ</span><div class="pips" data-stat="weight"></div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="screen-nav">
          <button id="btn-char-back" class="nav-btn back">◀ もどる</button>
          <button id="btn-char-next" class="nav-btn go">このキャラで決定 ▶</button>
        </div>
      </section>

      <!-- COURSE SELECT -->
      <section id="screen-course" class="screen hidden">
        <h2 class="screen-title">コースをえらぶ</h2>
        <div id="course-grid" class="course-grid"></div>
        <div class="diff-row">
          <span>むずかしさ:</span>
          <button class="diff-btn" data-diff="EASY">50cc かんたん</button>
          <button class="diff-btn active" data-diff="NORMAL">100cc ふつう</button>
          <button class="diff-btn" data-diff="HARD">150cc むずかしい</button>
        </div>
        <div class="screen-nav">
          <button id="btn-course-back" class="nav-btn back">◀ もどる</button>
          <button id="btn-course-go" class="nav-btn go">レース スタート 🏁</button>
        </div>
      </section>

      <!-- LOADING -->
      <section id="screen-loading" class="screen hidden">
        <div class="loading-text">コースを よみこみ中…</div>
        <div class="loading-bar"><div class="loading-fill"></div></div>
      </section>

      <!-- PAUSE -->
      <section id="screen-pause" class="screen overlay hidden">
        <div class="pause-box">
          <h2>ポーズ</h2>
          <button id="btn-resume" class="big-btn">▶ つづける</button>
          <button id="btn-restart" class="nav-btn">↻ さいしょから</button>
          <button id="btn-quit" class="nav-btn back">⌂ タイトルへ</button>
          <div class="pause-toggles">
            <button id="btn-mute" class="toggle-btn">🔊 BGM/SE</button>
          </div>
        </div>
      </section>

      <!-- RESULTS -->
      <section id="screen-results" class="screen overlay hidden">
        <div class="results-box">
          <h2 id="results-title">リザルト</h2>
          <ol id="results-list" class="results-list"></ol>
          <div class="screen-nav">
            <button id="btn-retry" class="nav-btn">↻ もう一度</button>
            <button id="btn-next" class="nav-btn go">べつのコース ▶</button>
            <button id="btn-results-title" class="nav-btn back">⌂ タイトル</button>
          </div>
        </div>
      </section>`;
    }

    _cacheEls() {
      const $ = (s) => this.root.querySelector(s);
      this.screens = {
        title: $('#screen-title'), char: $('#screen-char'), course: $('#screen-course'),
        loading: $('#screen-loading'), pause: $('#screen-pause'), results: $('#screen-results'),
      };
      this.charGrid = $('#char-grid');
      this.courseGrid = $('#course-grid');
      this.previewCanvas = $('#char-preview-canvas');
      this.charName = $('#char-name'); this.charClass = $('#char-class'); this.charBlurb = $('#char-blurb');
      this.statPips = {};
      this.root.querySelectorAll('.pips').forEach((p) => { this.statPips[p.dataset.stat] = p; });
      this.resultsList = $('#results-list');
      this.resultsTitle = $('#results-title');
      this.loadingFill = $('.loading-fill');
    }

    _bind() {
      const $ = (s) => this.root.querySelector(s);
      const click = (sel, fn) => { const e = $(sel); if (e) e.addEventListener('click', () => { MK.audio.init(); MK.audio.itemRouletteTick(); fn(); }); };
      click('#btn-start', () => this.showCharacterSelect());
      click('#btn-char-back', () => this.showTitle());
      click('#btn-char-next', () => this.showCourseSelect());
      click('#btn-course-back', () => this.showCharacterSelect());
      click('#btn-course-go', () => { if (this.cb.startRace) this.cb.startRace(this.selectedChar, this.selectedCourse, this.difficulty); });
      click('#btn-resume', () => { if (this.cb.resume) this.cb.resume(); });
      click('#btn-restart', () => { if (this.cb.restart) this.cb.restart(); });
      click('#btn-quit', () => { if (this.cb.quit) this.cb.quit(); });
      click('#btn-retry', () => { if (this.cb.restart) this.cb.restart(); });
      click('#btn-next', () => { if (this.cb.nextCourse) this.cb.nextCourse(); else this.showCourseSelect(); });
      click('#btn-results-title', () => this.showTitle());
      const mute = $('#btn-mute');
      if (mute) mute.addEventListener('click', () => { const m = MK.audio.toggleMute(); mute.textContent = m ? '🔇 ミュート中' : '🔊 BGM/SE'; });

      this.root.querySelectorAll('.diff-btn').forEach((b) => {
        b.addEventListener('click', () => {
          this.root.querySelectorAll('.diff-btn').forEach((x) => x.classList.remove('active'));
          b.classList.add('active'); this.difficulty = b.dataset.diff; MK.audio.itemRouletteTick();
        });
      });

      // タイトルはクリック/Enterでも開始
      this.screens.title.addEventListener('keydown', () => {});
      window.addEventListener('keydown', (e) => {
        if (this.screens.title && !this.screens.title.classList.contains('hidden')) {
          if (e.code === 'Enter' || e.code === 'Space') { MK.audio.init(); this.showCharacterSelect(); }
        }
      });
    }

    _statPips(stat, value) {
      let h = '';
      for (let i = 0; i < 5; i++) h += `<i class="pip ${i < value ? 'on' : ''}"></i>`;
      return h;
    }

    _buildCharacterGrid() {
      this.charGrid.innerHTML = '';
      MK.CHARACTERS.forEach((c) => {
        const card = document.createElement('button');
        card.className = 'char-card';
        const col = '#' + c.colors.primary.toString(16).padStart(6, '0');
        card.style.setProperty('--c', col);
        card.innerHTML = `<div class="char-swatch" style="background:${col}"></div>
          <div class="char-card-name">${c.jp}</div>
          <div class="char-card-en">${c.name}</div>`;
        card.addEventListener('click', () => { MK.audio.init(); MK.audio.itemRouletteTick(); this._selectChar(c, card); });
        card._charId = c.id;
        this.charGrid.appendChild(card);
      });
    }

    _selectChar(c, card) {
      this.selectedChar = c;
      this.charGrid.querySelectorAll('.char-card').forEach((x) => x.classList.remove('selected'));
      card.classList.add('selected');
      this.charName.textContent = c.jp + ' / ' + c.name;
      this.charClass.textContent = { LIGHT: '軽量級', MEDIUM: '中量級', HEAVY: '重量級' }[c.cls] || c.cls;
      this.charBlurb.textContent = c.blurb;
      this.statPips.speed.innerHTML = this._statPips('speed', c.stats.speed);
      this.statPips.accel.innerHTML = this._statPips('accel', c.stats.accel);
      this.statPips.handling.innerHTML = this._statPips('handling', c.stats.handling);
      this.statPips.weight.innerHTML = this._statPips('weight', c.stats.weight);
      if (this.preview) this.preview.setCharacter(c);
    }

    _buildCourseGrid() {
      this.courseGrid.innerHTML = '';
      MK.COURSES.forEach((co) => {
        const card = document.createElement('button');
        card.className = 'course-card';
        card.style.setProperty('--c', co.uiColor);
        let stars = '';
        for (let i = 0; i < 4; i++) stars += i < co.difficulty ? '★' : '☆';
        card.innerHTML = `<div class="course-emoji">${co.emoji}</div>
          <div class="course-name">${co.jp}</div>
          <div class="course-en">${co.name}</div>
          <div class="course-diff">${stars}</div>
          <div class="course-blurb">${co.blurb}</div>`;
        card.addEventListener('click', () => { MK.audio.init(); MK.audio.itemRouletteTick(); this._selectCourse(co, card); });
        this.courseGrid.appendChild(card);
      });
    }
    _selectCourse(co, card) {
      this.selectedCourse = co;
      this.courseGrid.querySelectorAll('.course-card').forEach((x) => x.classList.remove('selected'));
      card.classList.add('selected');
    }

    _show(name) {
      Object.keys(this.screens).forEach((k) => {
        const s = this.screens[k];
        if (!s) return;
        if (k === name) s.classList.remove('hidden'); else s.classList.add('hidden');
      });
    }

    showTitle() { this._stopPreview(); this._show('title'); }
    showCharacterSelect() {
      this._show('char');
      if (!this.preview) { this.preview = new CharacterPreview(this.previewCanvas); }
      setTimeout(() => { this.preview._resize(); this.preview.start(); }, 30);
      // 初期選択
      const firstCard = this.charGrid.querySelector('.char-card');
      this._selectChar(this.selectedChar, [...this.charGrid.children].find((x) => x._charId === this.selectedChar.id) || firstCard);
    }
    showCourseSelect() { this._stopPreview(); this._show('course'); if (!this.courseGrid.querySelector('.selected')) this._selectCourse(this.selectedCourse, this.courseGrid.firstChild); }
    showLoading(p) { this._show('loading'); if (this.loadingFill) this.loadingFill.style.width = Math.round((p || 0) * 100) + '%'; }
    hideAll() { this._stopPreview(); Object.values(this.screens).forEach((s) => s && s.classList.add('hidden')); }
    showPause() { this.screens.pause.classList.remove('hidden'); }
    hidePause() { this.screens.pause.classList.add('hidden'); }
    _stopPreview() { if (this.preview) this.preview.stop(); }

    showResults(standings, playerKart) {
      this._show('results');
      this.resultsList.innerHTML = '';
      standings.forEach((s, i) => {
        const li = document.createElement('li');
        li.className = 'result-row' + (s.isPlayer ? ' me' : '');
        const medal = ['🥇', '🥈', '🥉'][i] || (i + 1) + '.';
        const col = '#' + s.kart.character.colors.primary.toString(16).padStart(6, '0');
        li.innerHTML = `<span class="r-place">${medal}</span>
          <span class="r-swatch" style="background:${col}"></span>
          <span class="r-name">${s.kart.character.jp}</span>
          <span class="r-time">${s.finished ? U.formatTime(s.time) : 'DNF'}</span>`;
        this.resultsList.appendChild(li);
      });
      const pPlace = standings.findIndex((s) => s.isPlayer) + 1;
      this.resultsTitle.textContent = pPlace === 1 ? '🏆 1位 ゴール！' : `ゴール！  ${pPlace}位`;
    }
  }

  MK.UI = UI;
  MK.ui = new UI();

})(window.MK);
