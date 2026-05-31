/* ============================================================================
 *  utils.js — 数学 / 補間 / 乱数 / キャンバステクスチャ補助
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';

  const U = {};

  U.TAU = Math.PI * 2;

  U.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  U.smoothstep = (t) => t * t * (3 - 2 * t);
  U.randRange = (a, b) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

  // フレームレート非依存の指数ダンピング（lerp 係数を dt から算出）
  // rate が大きいほど速く目標へ寄る。
  U.dampFactor = (rate, dt) => 1 - Math.exp(-rate * dt);
  U.damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));

  // 角度を [-PI, PI] に正規化
  U.wrapAngle = (a) => {
    a = (a + Math.PI) % U.TAU;
    if (a < 0) a += U.TAU;
    return a - Math.PI;
  };
  // 角度差（最短回り）
  U.angleDelta = (from, to) => U.wrapAngle(to - from);
  // 角度の補間（最短回り）
  U.lerpAngle = (from, to, t) => from + U.angleDelta(from, to) * t;
  U.dampAngle = (from, to, rate, dt) =>
    from + U.angleDelta(from, to) * (1 - Math.exp(-rate * dt));

  // mulberry32 — 決定論的な乱数（リプレイ性のため）
  U.makeRNG = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // 順位の序数表記
  U.ordinal = function (n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // 秒 → m:ss.mmm
  U.formatTime = function (sec) {
    if (sec == null || !isFinite(sec)) return "--'--''---";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec * 1000) % 1000);
    const pad = (x, n) => String(x).padStart(n, '0');
    return `${m}'${pad(s, 2)}''${pad(ms, 3)}`;
  };

  /* ---- THREE が読み込まれている前提のヘルパ（実行時に使用） -------------- */

  // キャンバスに描いてテクスチャ化
  U.makeCanvasTexture = function (size, draw) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    draw(ctx, size);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  };

  // アイテムボックスの「?」面テクスチャ
  U.questionTexture = function () {
    return U.makeCanvasTexture(128, (ctx, s) => {
      // 虹色グラデの台
      const g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0.0, '#ff5d5d');
      g.addColorStop(0.2, '#ffba4d');
      g.addColorStop(0.4, '#fff04d');
      g.addColorStop(0.6, '#5dff8a');
      g.addColorStop(0.8, '#5db9ff');
      g.addColorStop(1.0, '#c45dff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      // 枠
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, s - 16, s - 16);
      // ?
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(40,30,0,0.55)';
      ctx.lineWidth = 6;
      ctx.font = 'bold 84px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText('?', s / 2, s / 2 + 4);
      ctx.fillText('?', s / 2, s / 2 + 4);
    });
  };

  // ?ブロック（黄）テクスチャ
  U.questionBlockTexture = function () {
    return U.makeCanvasTexture(128, (ctx, s) => {
      ctx.fillStyle = '#f7b733';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#e8932a';
      ctx.fillRect(0, 0, s, 10); ctx.fillRect(0, s - 10, s, 10);
      ctx.fillRect(0, 0, 10, s); ctx.fillRect(s - 10, 0, 10, s);
      // リベット
      ctx.fillStyle = '#fff3c4';
      const r = 8;
      [[18, 18], [s - 18, 18], [18, s - 18], [s - 18, s - 18]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
      });
      ctx.fillStyle = '#7a4a12';
      ctx.font = 'bold 88px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', s / 2, s / 2 + 6);
    });
  };

  // 放射状グラデのソフト円（パーティクル／ブロブ影に使用）
  U.softCircleTexture = function (inner, outer) {
    inner = inner || 'rgba(255,255,255,1)';
    outer = outer || 'rgba(255,255,255,0)';
    return U.makeCanvasTexture(64, (ctx, s) => {
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, inner);
      g.addColorStop(0.5, inner);
      g.addColorStop(1, outer);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    });
  };

  // 星形スプライト（スター用）
  U.starTexture = function (color) {
    color = color || '#fff04d';
    return U.makeCanvasTexture(128, (ctx, s) => {
      ctx.translate(s / 2, s / 2);
      ctx.beginPath();
      const spikes = 5, outer = s * 0.46, inner = s * 0.2;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i / (spikes * 2)) * U.TAU - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#caa400'; ctx.stroke();
      // 目
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.ellipse(-12, -2, 5, 9, 0, 0, U.TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(12, -2, 5, 9, 0, 0, U.TAU); ctx.fill();
    });
  };

  // チェッカー（スタート/フィニッシュ）テクスチャ
  U.checkerTexture = function (cells, c1, c2) {
    cells = cells || 8; c1 = c1 || '#ffffff'; c2 = c2 || '#1a1a1a';
    return U.makeCanvasTexture(256, (ctx, s) => {
      const cs = s / cells;
      for (let y = 0; y < cells; y++)
        for (let x = 0; x < cells; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? c1 : c2;
          ctx.fillRect(x * cs, y * cs, cs, cs);
        }
    });
  };

  // THREE.Color へ
  U.color = (hex) => new THREE.Color(hex);

  // ベクトル小物（毎フレーム new を避けたい所で使う一時オブジェクト）
  U.tmpV1 = null; // 実行時（THREE 読込後）に初期化
  U.initTmp = function () {
    U.tmpV1 = new THREE.Vector3();
    U.tmpV2 = new THREE.Vector3();
    U.tmpV3 = new THREE.Vector3();
  };

  MK.U = U;

})(window.MK);
