/* ============================================================================
 *  input.js — キーボード / タッチ入力管理
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';

  class InputManager {
    constructor() {
      this.down = Object.create(null);     // 現在押されているキー
      this.pressed = Object.create(null);  // このフレームに押された（エッジ）
      this.virtual = Object.create(null);  // タッチ等の仮想入力
      this.enabled = true;
      this._bound = false;
      this.onTouch = null;                 // タッチボタンの押下フック (role, isDown) — メニュー操作に使う
    }

    attach() {
      if (this._bound) return;
      this._bound = true;
      window.addEventListener('keydown', (e) => this._onKey(e, true), { passive: false });
      window.addEventListener('keyup', (e) => this._onKey(e, false));
      window.addEventListener('blur', () => { this.down = Object.create(null); });
      this._buildTouch();
    }

    _onKey(e, isDown) {
      const code = e.code;
      // ゲーム用キーはスクロール等を抑止
      const handled = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space',
        'ShiftLeft', 'ShiftRight', 'KeyR', 'KeyP', 'KeyC', 'KeyM', 'KeyB',
      ].includes(code);
      if (handled) e.preventDefault();
      if (isDown) {
        if (!this.down[code]) this.pressed[code] = true;
        this.down[code] = true;
      } else {
        this.down[code] = false;
      }
    }

    // 毎フレーム末に呼ぶ（エッジをクリア）
    endFrame() { this.pressed = Object.create(null); }

    isDown(code) { return !!this.down[code] || !!this.virtual[code]; }
    wasPressed(code) { return !!this.pressed[code] || !!this.virtual['_press_' + code]; }
    consumeVirtualPress(code) { this.virtual['_press_' + code] = false; }

    /* ---- 運転入力に変換 ---- */
    // 戻り値: { throttle(0..1), brake(0..1 / 後退), steer(-1..1), drift, reverseHeld }
    getDriveControls() {
      const up = this.isDown('ArrowUp') || this.isDown('KeyW');
      const down = this.isDown('ArrowDown') || this.isDown('KeyS');
      const left = this.isDown('ArrowLeft') || this.isDown('KeyA');
      const right = this.isDown('ArrowRight') || this.isDown('KeyD');
      const reverse = this.isDown('KeyR');
      const drift = this.isDown('ShiftLeft') || this.isDown('ShiftRight') || this.isDown('_drift');

      let steer = 0;
      if (left) steer -= 1;
      if (right) steer += 1;

      return {
        throttle: up ? 1 : 0,
        brake: down ? 1 : 0,
        reverseHeld: reverse,
        steer,
        drift,
      };
    }

    consumeItemPress() {
      const p = this.wasPressed('Space');
      if (this.virtual['_press_Space']) { this.virtual['_press_Space'] = false; return true; }
      return p;
    }

    /* ---- モバイル用オンスクリーンボタン ---- */
    _buildTouch() {
      const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      if (!isTouch) return;
      document.body.classList.add('is-touch');
      const root = document.createElement('div');
      root.id = 'touch-controls';
      root.classList.add('mode-race');
      // 左：アイテム(★)＋ステア(◀▶) / 右：アクセル。
      // data-role はメニューでのカーソル操作にも使う（onTouch フック）。
      // race-only はメニュー中は非表示（CSS）。
      root.innerHTML = `
        <div class="tc-left">
          <button class="tc-btn tc-item" data-press="Space" data-role="item">★</button>
          <div class="tc-steer-row">
            <button class="tc-btn tc-steer" data-key="_left" data-role="left">◀</button>
            <button class="tc-btn tc-steer" data-key="_right" data-role="right">▶</button>
          </div>
        </div>
        <div class="tc-right">
          <button class="tc-btn tc-accel race-only" data-key="ArrowUp" data-role="accel">ACCEL</button>
        </div>`;
      document.body.appendChild(root);

      const setV = (key, val) => {
        // _left/_right は steer に合成するため ArrowLeft/Right にマップ
        if (key === '_left') this.virtual['ArrowLeft'] = val;
        else if (key === '_right') this.virtual['ArrowRight'] = val;
        else this.virtual[key] = val;
      };
      root.querySelectorAll('.tc-btn').forEach((btn) => {
        const key = btn.getAttribute('data-key');
        const press = btn.getAttribute('data-press');
        const role = btn.getAttribute('data-role');
        const start = (e) => {
          e.preventDefault();
          if (key) setV(key, true);
          if (press) this.virtual['_press_' + press] = true;
          btn.classList.add('active');
          MK.audio && MK.audio.init();
          if (role && this.onTouch) this.onTouch(role, true);
        };
        const end = (e) => {
          e.preventDefault();
          if (key) setV(key, false);
          btn.classList.remove('active');
          if (role && this.onTouch) this.onTouch(role, false);
        };
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', end, { passive: false });
        btn.addEventListener('touchcancel', end, { passive: false });
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
      });
    }

    showTouch(v) {
      const el = document.getElementById('touch-controls');
      if (el) el.style.display = v ? 'flex' : 'none';
    }

    // 'menu' = メニュー操作中（走行ボタンを隠し、◀▶★ のみ）/ 'race' = 走行中
    setTouchMode(mode) {
      const el = document.getElementById('touch-controls');
      if (!el) return;
      el.classList.toggle('mode-menu', mode === 'menu');
      el.classList.toggle('mode-race', mode !== 'menu');
    }
  }

  MK.InputManager = InputManager;
  MK.input = new InputManager();

})(window.MK);
