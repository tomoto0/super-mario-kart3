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

  // 星形スプライト（スター用）。outline で縁取り色を指定できる（赤/青/緑の星など）。
  U.starTexture = function (color, outline) {
    color = color || '#fff04d';
    outline = outline || '#caa400';
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
      ctx.lineWidth = 6; ctx.strokeStyle = outline; ctx.stroke();
      // 目
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.ellipse(-12, -2, 5, 9, 0, 0, U.TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(12, -2, 5, 9, 0, 0, U.TAU); ctx.fill();
    });
  };

  /* ---- アイテムアイコン（絵文字ではなく描画したもの）------------------- */
  function _mushroom(ctx, s, OUT) {
    const cx = s / 2, lw = s * 0.05;
    ctx.lineWidth = lw; ctx.strokeStyle = OUT;
    // 軸
    ctx.fillStyle = '#ffe9c8';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.20, s * 0.50);
    ctx.lineTo(cx - s * 0.18, s * 0.80);
    ctx.quadraticCurveTo(cx, s * 0.90, cx + s * 0.18, s * 0.80);
    ctx.lineTo(cx + s * 0.20, s * 0.50);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 目
    ctx.fillStyle = '#5a3a2a';
    ctx.beginPath(); ctx.ellipse(cx - s * 0.08, s * 0.66, s * 0.028, s * 0.05, 0, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + s * 0.08, s * 0.66, s * 0.028, s * 0.05, 0, 0, U.TAU); ctx.fill();
    // 赤い傘
    ctx.fillStyle = '#e8352b';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.36, s * 0.50);
    ctx.quadraticCurveTo(cx - s * 0.40, s * 0.14, cx, s * 0.14);
    ctx.quadraticCurveTo(cx + s * 0.40, s * 0.14, cx + s * 0.36, s * 0.50);
    ctx.quadraticCurveTo(cx, s * 0.58, cx - s * 0.36, s * 0.50);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 白斑
    ctx.fillStyle = '#fff';
    [[cx, s * 0.29, s * 0.11], [cx - s * 0.24, s * 0.40, s * 0.06], [cx + s * 0.24, s * 0.40, s * 0.06]].forEach((p) => {
      ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, U.TAU); ctx.fill(); ctx.stroke();
    });
  }
  function _shell(ctx, s, col, colDark, OUT) {
    const cx = s / 2, cy = s * 0.5, r = s * 0.36, lw = s * 0.05;
    ctx.lineWidth = lw; ctx.strokeStyle = OUT;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.94, 0, 0, U.TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.rect(0, cy + r * 0.28, s, s); ctx.clip();
    ctx.fillStyle = '#fff1d2';
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.94, 0, 0, U.TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = colDark; ctx.lineWidth = lw * 0.8;
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.08, r * 0.48, r * 0.42, 0, 0, U.TAU); ctx.stroke();
    for (const dx of [-0.62, 0, 0.62]) {
      ctx.beginPath(); ctx.moveTo(cx + dx * r * 0.46, cy - r * 0.20); ctx.lineTo(cx + dx * r, cy - r * 0.82); ctx.stroke();
    }
    ctx.strokeStyle = OUT; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(cx - r * 0.95, cy + r * 0.28); ctx.lineTo(cx + r * 0.95, cy + r * 0.28); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.94, 0, 0, U.TAU); ctx.stroke();
  }
  function _tripleShell(ctx, s, OUT) {
    const draw = (ox, oy, sc) => {
      ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc); ctx.translate(-s / 2, -s / 2);
      _shell(ctx, s, '#2fae4a', '#1c7b32', OUT); ctx.restore();
    };
    draw(s * 0.30, s * 0.64, 0.52);
    draw(s * 0.70, s * 0.64, 0.52);
    draw(s * 0.50, s * 0.36, 0.56);
  }
  function _banana(ctx, s, OUT) {
    const ccx = s / 2, ccy = s * 0.62, R = s * 0.34, a1 = Math.PI * 1.12, a2 = Math.PI * 1.98;
    ctx.lineCap = 'round';
    ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.27;
    ctx.beginPath(); ctx.arc(ccx, ccy, R, a1, a2); ctx.stroke();
    ctx.strokeStyle = '#ffd633'; ctx.lineWidth = s * 0.18;
    ctx.beginPath(); ctx.arc(ccx, ccy, R, a1, a2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = s * 0.04;
    ctx.beginPath(); ctx.arc(ccx, ccy, R - s * 0.05, a1 + 0.12, a2 - 0.22); ctx.stroke();
    ctx.fillStyle = '#5e4015';
    [a1, a2].forEach((a) => { const x = ccx + Math.cos(a) * R, y = ccy + Math.sin(a) * R; ctx.beginPath(); ctx.arc(x, y, s * 0.055, 0, U.TAU); ctx.fill(); });
  }
  function _bomb(ctx, s, OUT) {
    const cx = s / 2, cy = s * 0.58, r = s * 0.29, lw = s * 0.05;
    ctx.lineWidth = lw; ctx.strokeStyle = OUT;
    ctx.fillStyle = '#e8a02a';
    [-1, 1].forEach((d) => { ctx.beginPath(); ctx.ellipse(cx + d * r * 0.55, cy + r * 0.95, s * 0.09, s * 0.05, 0, 0, U.TAU); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = '#23262e';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, U.TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.beginPath(); ctx.arc(cx - r * 0.34, cy - r * 0.34, r * 0.28, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = '#cbb27c'; ctx.lineWidth = s * 0.045;
    ctx.beginPath(); ctx.arc(cx, cy - r - s * 0.05, s * 0.05, 0, U.TAU); ctx.stroke();
    ctx.strokeStyle = '#a98a55'; ctx.lineWidth = s * 0.04;
    ctx.beginPath(); ctx.moveTo(cx + r * 0.55, cy - r * 0.78); ctx.quadraticCurveTo(cx + r * 1.2, cy - r * 1.2, cx + r * 0.95, cy - r * 1.7); ctx.stroke();
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(cx + r * 0.92, cy - r * 1.78, s * 0.05, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(cx + r * 0.92, cy - r * 1.78, s * 0.022, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(cx - r * 0.32, cy - r * 0.05, s * 0.06, s * 0.085, 0, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + r * 0.32, cy - r * 0.05, s * 0.06, s * 0.085, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(cx - r * 0.30, cy - r * 0.02, s * 0.026, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.34, cy - r * 0.02, s * 0.026, 0, U.TAU); ctx.fill();
  }
  function _starIcon(ctx, s) {
    ctx.save(); ctx.translate(s / 2, s * 0.52);
    ctx.beginPath();
    const spikes = 5, outer = s * 0.42, inner = s * 0.18;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (spikes * 2)) * U.TAU - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffe14d'; ctx.fill();
    ctx.lineWidth = s * 0.055; ctx.strokeStyle = '#caa400'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath(); ctx.ellipse(-s * 0.10, 0, s * 0.045, s * 0.075, 0, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.10, 0, s * 0.045, s * 0.075, 0, 0, U.TAU); ctx.fill();
    ctx.restore();
  }
  function _lightning(ctx, s) {
    const cx = s / 2;
    ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = '#c79b00'; ctx.lineWidth = s * 0.05; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.12, s * 0.08);
    ctx.lineTo(cx - s * 0.22, s * 0.48);
    ctx.lineTo(cx - s * 0.02, s * 0.48);
    ctx.lineTo(cx - s * 0.16, s * 0.92);
    ctx.lineTo(cx + s * 0.24, s * 0.42);
    ctx.lineTo(cx + s * 0.03, s * 0.42);
    ctx.lineTo(cx + s * 0.22, s * 0.08);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  const _ICON_CACHE = {};
  // アイテムIDから描画アイコンの dataURL を返す（キャッシュ）
  U.itemIcon = function (id) {
    if (_ICON_CACHE[id] != null) return _ICON_CACHE[id];
    let url = '';
    try {
      const s = 96;
      const c = document.createElement('canvas'); c.width = c.height = s;
      const ctx = c.getContext('2d');
      if (ctx && ctx.beginPath) {
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        const OUT = '#241a12';
        switch (id) {
          case 'greenShell': _shell(ctx, s, '#2fae4a', '#1c7b32', OUT); break;
          case 'redShell': _shell(ctx, s, '#e83b2e', '#a31f17', OUT); break;
          case 'tripleGreen': _tripleShell(ctx, s, OUT); break;
          case 'banana': _banana(ctx, s, OUT); break;
          case 'bomb': _bomb(ctx, s, OUT); break;
          case 'star': _starIcon(ctx, s); break;
          case 'lightning': _lightning(ctx, s); break;
          case 'mushroom': case 'triple': default: _mushroom(ctx, s, OUT);
        }
        if (c.toDataURL) url = c.toDataURL();
      }
    } catch (e) { url = ''; }
    _ICON_CACHE[id] = url;
    return url;
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

  // シーンから外したオブジェクト木を完全に解放する。
  // ジオメトリ・マテリアルに加えて、マテリアルが抱える全テクスチャ(map/emissiveMap…)も dispose する。
  // （material.dispose() はテクスチャを解放しないため、これを怠ると毎レース GPU メモリが漏れる）
  U.disposeObject = function (root) {
    if (!root || !root.traverse) return;
    root.traverse((o) => {
      if (o.geometry && o.geometry.dispose) o.geometry.dispose();
      const m = o.material;
      if (!m) return;
      const mats = Array.isArray(m) ? m : [m];
      for (const mat of mats) {
        if (!mat) continue;
        for (const key in mat) {
          const v = mat[key];
          if (v && v.isTexture && v.dispose) v.dispose();
        }
        if (mat.dispose) mat.dispose();
      }
    });
  };

  MK.U = U;

})(window.MK);
