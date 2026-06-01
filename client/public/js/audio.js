/* ============================================================================
 *  audio.js — Web Audio による効果音 / エンジン音 + シーン別BGM(MP3)
 *  効果音・エンジン音は手続き生成。BGM は client/public/music/ の MP3 を
 *  画面/コースごとに切り替えて再生する（MK.MUSIC + course.music を参照）。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';

  // ---- 画面/状況に割り当てる BGM（パスは game.html からの相対）----
  //  コースの BGM は courses.js の course.music で指定する。
  const MUSIC = {
    title:   'music/01_Opening_Theme.mp3',        // タイトル / オープニング
    select:  'music/05_Setup_and_Kart_Select.mp3', // キャラ選択・コース選択
    results: 'music/01_Opening_Theme.mp3',         // レース終了後（リザルト）
    star:    'music/11_Star_Power.mp3',            // スター無敵中（レース上書き）
  };
  MK.MUSIC = MUSIC;

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.sfxGain = null;
      this.engineNodes = null;
      this.muted = false;
      this.musicOn = true;
      this._noiseBuffer = null;
      // ---- BGM(MP3) 状態 ----
      this._tracks = {};          // url -> HTMLAudioElement（キャッシュ）
      this._curMusic = null;      // 再生中の要素
      this._curUrl = null;        // 再生中の url
      this._wantUrl = null;       // 現在のシーンが鳴らしたい url（mute/トグルをまたいで保持）
      this._musicVol = 0.55;      // BGM の基準音量
      this._starReturnUrl = null; // スター終了後に戻す url
      this._fades = new Map();    // 要素 -> フェード用 interval id
    }

    /* 初回ユーザー操作で起動 */
    init() {
      if (this.ctx) { this.resume(); this._kickPending(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          this.ctx = new AC();
          this.master = this.ctx.createGain();
          this.master.gain.value = this.muted ? 0 : 0.9;
          this.master.connect(this.ctx.destination);

          this.sfxGain = this.ctx.createGain();
          this.sfxGain.gain.value = 0.9;
          this.sfxGain.connect(this.master);

          this._buildNoise();
        }
      } catch (e) {
        console.warn('AudioEngine init failed', e);
      }
      // BGM(MP3) は AudioContext と独立。最初のジェスチャで保留中の曲を鳴らす。
      this._kickPending();
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this._kickPending();
    }

    _buildNoise() {
      const len = this.ctx.sampleRate * 1.0;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this._noiseBuffer = buf;
    }

    get now() { return this.ctx ? this.ctx.currentTime : 0; }

    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.now, 0.05);
      if (this._curMusic) this._fade(this._curMusic, m ? 0 : this._musicVol, 0.2);
    }
    toggleMute() { this.setMuted(!this.muted); return this.muted; }

    /* ---- 低レベル：トーン ---- */
    tone(freq, dur, type, gain, when, glideTo) {
      if (!this.ctx) return;
      when = when || this.now;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, when);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), when + dur);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(gain || 0.25, when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(this.sfxGain);
      o.start(when); o.stop(when + dur + 0.02);
    }

    noise(dur, gain, filterType, freq, when) {
      if (!this.ctx || !this._noiseBuffer) return;
      when = when || this.now;
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuffer;
      const f = this.ctx.createBiquadFilter();
      f.type = filterType || 'bandpass';
      f.frequency.value = freq || 1200;
      f.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain || 0.3, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      src.connect(f); f.connect(g); g.connect(this.sfxGain);
      src.start(when); src.stop(when + dur);
    }

    /* ---- 効果音 ---- */
    itemRouletteTick() { this.tone(880, 0.05, 'square', 0.12); }
    itemGet() {
      const t = this.now;
      [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, 'square', 0.2, t + i * 0.06));
    }
    boost() {
      const t = this.now;
      this.tone(220, 0.35, 'sawtooth', 0.25, t, 880);
      this.noise(0.35, 0.2, 'highpass', 600, t);
    }
    drift(level) {
      // ミニターボ点火
      const t = this.now;
      const base = 300 + level * 180;
      this.tone(base, 0.18, 'square', 0.18, t, base * 1.8);
    }
    coin() {
      const t = this.now;
      this.tone(988, 0.08, 'square', 0.22, t);
      this.tone(1319, 0.18, 'square', 0.22, t + 0.07);
    }
    shellFire() {
      const t = this.now;
      this.tone(700, 0.18, 'sawtooth', 0.2, t, 200);
    }
    explosion() {
      const t = this.now;
      this.noise(0.5, 0.5, 'lowpass', 400, t);
      this.tone(90, 0.5, 'sawtooth', 0.3, t, 40);
    }
    hit() {
      const t = this.now;
      this.noise(0.25, 0.4, 'bandpass', 300, t);
      this.tone(160, 0.25, 'square', 0.25, t, 80);
    }
    spinOut() {
      const t = this.now;
      for (let i = 0; i < 4; i++) this.tone(500 - i * 60, 0.1, 'triangle', 0.18, t + i * 0.08);
    }
    bump() { this.tone(120, 0.1, 'square', 0.18); this.noise(0.08, 0.15, 'lowpass', 300); }
    countdownBeep(go) {
      if (go) {
        const t = this.now;
        this.tone(660, 0.1, 'square', 0.3, t);
        this.tone(990, 0.4, 'square', 0.3, t + 0.1);
      } else {
        this.tone(440, 0.18, 'square', 0.3);
      }
    }
    lapJingle() {
      const t = this.now;
      [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.15, 'triangle', 0.22, t + i * 0.08));
    }
    finishJingle() {
      const t = this.now;
      const seq = [523, 659, 784, 1046, 784, 1046, 1318];
      seq.forEach((f, i) => this.tone(f, 0.2, 'square', 0.22, t + i * 0.12));
    }
    starGet() {
      const t = this.now;
      [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.12, 'square', 0.2, t + i * 0.05));
    }
    thunder() {
      const t = this.now;
      this.noise(0.6, 0.6, 'lowpass', 320, t);
      this.noise(0.22, 0.5, 'highpass', 2200, t);     // 落雷のクラック
      this.tone(70, 0.7, 'sawtooth', 0.32, t, 28);    // 低い轟き
    }
    shield() {
      const t = this.now;
      [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.18, t + i * 0.05));
    }

    /* ---- エンジン音（速度連動の連続音） ---- */
    startEngine() {
      if (!this.ctx || this.engineNodes) return;
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      o1.type = 'sawtooth'; o2.type = 'square';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 700;
      const g = this.ctx.createGain();
      g.gain.value = 0.0;
      o1.frequency.value = 70; o2.frequency.value = 71.5;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfxGain);
      o1.start(); o2.start();
      this.engineNodes = { o1, o2, f, g };
    }
    setEngine(intensity, throttle) {
      if (!this.engineNodes) return;
      const n = this.engineNodes;
      const base = 60 + intensity * 150;
      n.o1.frequency.setTargetAtTime(base, this.now, 0.08);
      n.o2.frequency.setTargetAtTime(base * 1.01 + 1, this.now, 0.08);
      n.f.frequency.setTargetAtTime(500 + intensity * 1800, this.now, 0.1);
      const vol = 0.05 + intensity * 0.12 + (throttle ? 0.04 : 0);
      n.g.gain.setTargetAtTime(vol, this.now, 0.1);
    }
    stopEngine() {
      if (!this.engineNodes) return;
      const n = this.engineNodes;
      try {
        n.g.gain.setTargetAtTime(0, this.now, 0.1);
        n.o1.stop(this.now + 0.3); n.o2.stop(this.now + 0.3);
      } catch (e) { /* noop */ }
      this.engineNodes = null;
    }

    /* ====================================================================
     *  BGM（シーン別の MP3 をクロスフェード再生）
     * ==================================================================*/

    /* ---- 公開 API：シーン別の再生 ---- */
    // 画面用 BGM（'title' | 'select' | 'results' …）
    playMenuMusic(key) { this.playMusic(MUSIC[key] || MUSIC.title); }
    // コース用 BGM（course.music を使用）
    playCourseMusic(course) { this.playMusic((course && course.music) || MUSIC.title); }

    // 任意 url へ切り替え（通常のシーン遷移。スター文脈は破棄）
    playMusic(url) { this._starReturnUrl = null; this._request(url); }

    // スター無敵：今のコース曲を覚えてスター曲へ。endStarMusic で戻す。
    playStarMusic() {
      const url = MUSIC.star;
      if (this._curUrl === url) return;
      if (this._starReturnUrl == null) this._starReturnUrl = this._wantUrl || this._curUrl;
      this._request(url);
    }
    endStarMusic() {
      if (this._starReturnUrl == null) return;
      const back = this._starReturnUrl;
      this._starReturnUrl = null;
      this._request(back);
    }

    // 一時停止（ポーズ）：位置を保ったまま止める / 再開する
    pauseMusic() { const el = this._curMusic; if (el) { try { el.pause(); } catch (e) {} } }
    resumeMusic() {
      if (!this.musicOn) return;
      const el = this._curMusic;
      if (el) { this._attemptPlay(el); this._fade(el, this.muted ? 0 : this._musicVol, 0.3); }
      else if (this._wantUrl) this._switchTo(this._wantUrl);
    }

    // 完全停止（フェードアウト）。_wantUrl は残すのでトグルで復帰できる。
    stopMusic() {
      const el = this._curMusic;
      if (el) this._fade(el, 0, 0.4, () => { try { el.pause(); } catch (e) {} });
      this._curMusic = null; this._curUrl = null;
    }

    // B キー：BGM オン/オフ
    toggleMusic() {
      this.musicOn = !this.musicOn;
      if (this.musicOn) { if (this._wantUrl) this._switchTo(this._wantUrl); }
      else { this.stopMusic(); }
      return this.musicOn;
    }

    /* ---- 内部実装 ---- */
    _request(url) {
      this._wantUrl = url;
      if (!this.musicOn || !url || typeof Audio === 'undefined') return;
      if (this._curUrl === url && this._curMusic && !this._curMusic.paused) return; // 既に再生中
      this._switchTo(url);
    }

    _trackEl(url) {
      if (typeof Audio === 'undefined') return null;
      let el = this._tracks[url];
      if (el) return el;
      try {
        el = new Audio();
        el.src = url; el.loop = true; el.preload = 'auto'; el.volume = 0;
        this._tracks[url] = el;
      } catch (e) { return null; }
      return el;
    }

    _switchTo(url) {
      const next = this._trackEl(url);
      if (!next) return;
      const old = this._curMusic;
      if (old && old !== next) this._fade(old, 0, 0.5, () => { try { old.pause(); } catch (e) {} });
      this._curMusic = next; this._curUrl = url; next.loop = true;
      this._attemptPlay(next);
      this._fade(next, this.muted ? 0 : this._musicVol, 0.5);
    }

    // 自動再生がブロックされたら、次のユーザー操作で再試行
    _attemptPlay(el) {
      if (!el) return;
      let p;
      try { p = el.play(); } catch (e) { p = null; }
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (typeof window === 'undefined' || !window.addEventListener) return;
          const retry = () => {
            window.removeEventListener('pointerdown', retry);
            window.removeEventListener('keydown', retry);
            window.removeEventListener('touchstart', retry);
            if (this._curMusic === el && this.musicOn) { try { el.play().catch(() => {}); } catch (e) {} }
          };
          window.addEventListener('pointerdown', retry, { once: true });
          window.addEventListener('keydown', retry, { once: true });
          window.addEventListener('touchstart', retry, { once: true });
        });
      }
    }

    // 最初のジェスチャ等で、保留中の曲があれば鳴らす
    _kickPending() {
      if (!this.musicOn || !this._wantUrl || typeof Audio === 'undefined') return;
      if (!this._curMusic || this._curMusic.paused || this._curUrl !== this._wantUrl) this._switchTo(this._wantUrl);
    }

    // 要素の音量フェード（HTMLAudioElement には組み込みフェードが無いので自前）
    _fade(el, target, dur, onDone) {
      if (!el) return;
      const prev = this._fades.get(el);
      if (prev) { clearInterval(prev); this._fades.delete(el); }
      const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
      const start = (typeof el.volume === 'number') ? el.volume : 0;
      const t0 = now();
      const step = () => {
        let k = dur > 0 ? (now() - t0) / (dur * 1000) : 1;
        if (k > 1) k = 1;
        const v = start + (target - start) * k;
        try { el.volume = v < 0 ? 0 : v > 1 ? 1 : v; } catch (e) {}
        if (k >= 1) {
          const id = this._fades.get(el); if (id) clearInterval(id);
          this._fades.delete(el);
          if (onDone) onDone();
        }
      };
      const id = setInterval(step, 40);
      this._fades.set(el, id);
      step();
    }
  }

  MK.AudioEngine = AudioEngine;
  MK.audio = new AudioEngine();

})(window.MK);
