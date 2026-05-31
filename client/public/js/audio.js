/* ============================================================================
 *  audio.js — Web Audio による効果音 / エンジン音 / オリジナルBGM
 *  すべて手続き生成（外部アセット不要）。著作権配慮でメロディは独自。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.sfxGain = null;
      this.musicGain = null;
      this.engineNodes = null;
      this.muted = false;
      this.musicOn = true;
      this._musicTimer = null;
      this._noiseBuffer = null;
    }

    /* 初回ユーザー操作で起動 */
    init() {
      if (this.ctx) { this.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.9;
        this.master.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.9;
        this.sfxGain.connect(this.master);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.32;
        this.musicGain.connect(this.master);

        this._buildNoise();
      } catch (e) {
        console.warn('AudioEngine init failed', e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
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

    /* ---- BGM（オリジナルの陽気なループ） ---- */
    startMusic() {
      if (!this.ctx || this._musicTimer || !this.musicOn) return;
      // C メジャー系の軽快なループ。[半音番号]（A4=440 基準で算出）
      const N = (semi) => 440 * Math.pow(2, (semi - 9) / 12); // semi: 0=C4
      // メロディ（16ステップ×4小節）
      const mel = [
        12, null, 16, 12, 19, null, 16, 12, 17, null, 19, 21, 19, 16, 12, null,
        14, null, 17, 14, 21, null, 19, 17, 16, null, 12, 16, 19, 16, 12, null,
        12, 14, 16, 17, 19, 21, 23, 24, 23, 21, 19, 17, 16, 14, 12, null,
        7, null, 12, null, 16, null, 19, null, 24, 23, 21, 19, 16, 12, 7, null,
      ];
      const bass = [0, 7, 0, 7, 5, 0, 7, 0, -3, 4, -3, 4, 5, 7, 5, 7];
      this._melIdx = 0; this._barStep = 0;
      const stepDur = 0.16; // 約 BPM 156 の 8 分
      let nextTime = this.now + 0.1;
      const lookahead = 0.2;
      const schedule = () => {
        if (!this.ctx) return;
        while (nextTime < this.now + lookahead) {
          const i = this._melIdx % mel.length;
          const note = mel[i];
          if (note != null) {
            this._musicTone(N(note), stepDur * 0.95, 'square', 0.18, nextTime);
            this._musicTone(N(note) * 2, stepDur * 0.5, 'triangle', 0.05, nextTime);
          }
          const bnote = bass[this._barStep % bass.length];
          this._musicTone(N(bnote) / 2, stepDur * 0.9, 'triangle', 0.16, nextTime);
          // ハイハット
          if (this._barStep % 2 === 0) this._musicNoise(0.04, 0.05, nextTime);
          this._melIdx++; this._barStep++;
          nextTime += stepDur;
        }
        this._musicTimer = setTimeout(schedule, 60);
      };
      schedule();
    }
    _musicTone(freq, dur, type, gain, when) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(gain, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(this.musicGain);
      o.start(when); o.stop(when + dur + 0.02);
    }
    _musicNoise(dur, gain, when) {
      if (!this._noiseBuffer) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuffer;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 7000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      src.connect(f); f.connect(g); g.connect(this.musicGain);
      src.start(when); src.stop(when + dur);
    }
    stopMusic() {
      if (this._musicTimer) { clearTimeout(this._musicTimer); this._musicTimer = null; }
    }
    toggleMusic() {
      this.musicOn = !this.musicOn;
      if (this.musicOn) this.startMusic(); else this.stopMusic();
      return this.musicOn;
    }
  }

  MK.AudioEngine = AudioEngine;
  MK.audio = new AudioEngine();

})(window.MK);
