/* ============================================================================
 *  hud.js — レース中の HUD（アイテム枠/ラップ/順位/速度/コイン/ミニマップ等）
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;

  const ROULETTE = ['mushroom', 'tripleGreen', 'greenShell', 'redShell', 'banana', 'fakeBox', 'bomb', 'golden', 'star', 'lightning', 'spiny'];
  const ORD = ['', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH'];

  class HUD {
    constructor() {
      this.el = {};
      this.mapPts = null;
      this.bounds = null;
      this._rouletteT = 0;
      this._rouletteI = 0;
      this.rolling = false;
    }

    build(container) {
      const root = document.createElement('div');
      root.id = 'hud';
      root.innerHTML = `
        <div class="hud-top">
          <div id="hud-item" class="hud-item"><div id="hud-item-icon">　</div><div id="hud-item-count"></div></div>
          <div class="hud-center-top">
            <div id="hud-lap">LAP 1/3</div>
            <div id="hud-pos">1ST</div>
          </div>
          <div id="hud-map-wrap"><canvas id="hud-map" width="170" height="170"></canvas></div>
        </div>
        <div id="hud-coins">🪙 <span id="hud-coin-n">0</span></div>
        <div id="hud-speed"><span id="hud-speed-n">0</span><span class="unit">km/h</span></div>
        <div id="hud-center-msg"></div>
        <div id="hud-wrongway">⚠ WRONG WAY</div>
        <div id="hud-flash"></div>
        <div id="hud-ink"></div>
      `;
      container.appendChild(root);
      this.root = root;
      this.el.item = root.querySelector('#hud-item');
      this.el.itemIcon = root.querySelector('#hud-item-icon');
      this.el.itemCount = root.querySelector('#hud-item-count');
      this.el.lap = root.querySelector('#hud-lap');
      this.el.pos = root.querySelector('#hud-pos');
      this.el.coinN = root.querySelector('#hud-coin-n');
      this.el.speedN = root.querySelector('#hud-speed-n');
      this.el.msg = root.querySelector('#hud-center-msg');
      this.el.wrong = root.querySelector('#hud-wrongway');
      this.el.flash = root.querySelector('#hud-flash');
      this.el.ink = root.querySelector('#hud-ink');
      this.canvas = root.querySelector('#hud-map');
      this.ctx = this.canvas.getContext('2d');
      this.show(false);
    }

    show(v) { if (this.root) this.root.style.display = v ? 'block' : 'none'; }

    reset() {
      this.setCoins(0);
      this._itemKey = null;
      this.setItem(null, 0, false);
      this.el.msg.textContent = ''; this.el.msg.className = '';
      this.el.wrong.classList.remove('on');
      if (this.el.ink) this.el.ink.innerHTML = '';
    }

    // ゲッソーの墨：画面に黒いインクのしぶきを散らす（数秒で滴り落ちて消える）
    ink() {
      const wrap = this.el.ink;
      if (!wrap) return;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const d = document.createElement('div');
        d.className = 'ink-splat';
        const sz = 16 + Math.random() * 26;
        d.style.left = (Math.random() * 84) + '%';
        d.style.top = (Math.random() * 64) + '%';
        d.style.width = sz + 'vmin';
        d.style.height = sz * (0.78 + Math.random() * 0.45) + 'vmin';
        d.style.animationDelay = (Math.random() * 0.22) + 's';
        wrap.appendChild(d);
        setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 5000);
      }
    }

    /* ---- 値の更新 ---- */
    setItem(itemId, count, rolling) {
      // 内容が変わったときだけ更新（毎フレームのpop再始動によるちらつき防止）
      const key = rolling ? 'roll' : (itemId || 'none') + ':' + (count || 0);
      if (key === this._itemKey) { this.rolling = !!rolling; return; }
      this._itemKey = key;
      this.rolling = !!rolling;
      if (rolling) { this.el.item.classList.add('rolling'); return; }
      this.el.item.classList.remove('rolling');
      if (!itemId) {
        this._setIcon(null);
        this.el.itemCount.textContent = '';
        this.el.item.classList.remove('filled');
        return;
      }
      this._setIcon(itemId);
      this.el.itemCount.textContent = count > 1 ? '×' + count : '';
      this.el.item.classList.add('filled');
      this.el.item.classList.remove('pop'); void this.el.item.offsetWidth; this.el.item.classList.add('pop');
    }
    // 描画アイテムアイコンを枠にセット（絵文字ではなく画像）
    _setIcon(id) {
      const el = this.el.itemIcon;
      el.textContent = '';
      el.style.backgroundImage = id ? 'url(' + MK.U.itemIcon(id) + ')' : '';
    }
    setLap(lap, total) { this.el.lap.textContent = `LAP ${Math.min(lap, total)}/${total}`; }
    setPosition(place, total) {
      this.el.pos.textContent = ORD[place] || (place + 'TH');
      this.el.pos.className = place === 1 ? 'p1' : place === 2 ? 'p2' : place === 3 ? 'p3' : '';
    }
    setSpeed(kmh) { this.el.speedN.textContent = Math.round(kmh); }
    setCoins(n) { this.el.coinN.textContent = n; }
    setWrongWay(v) { this.el.wrong.classList.toggle('on', !!v); }

    centerMessage(text, cls, dur) {
      this.el.msg.textContent = text;
      this.el.msg.className = ''; void this.el.msg.offsetWidth;
      this.el.msg.className = (cls || '') + ' show';
      if (dur) {
        clearTimeout(this._msgT);
        this._msgT = setTimeout(() => { this.el.msg.className = (cls || ''); this.el.msg.textContent = ''; }, dur);
      }
    }
    countdown(n) { this.centerMessage(n, 'countdown', 1000); }
    go() { this.centerMessage('GO!', 'go', 1200); }
    finish() { this.centerMessage('FINISH!', 'finish', 4000); }
    flashLap(text) { this.centerMessage(text, 'laptext', 1400); }

    lightningFlash() {
      this.el.flash.classList.remove('on'); void this.el.flash.offsetWidth;
      this.el.flash.classList.add('on');
      setTimeout(() => this.el.flash.classList.remove('on'), 350);
    }

    /* ---- ミニマップ ---- */
    initMinimap(track) {
      const pad = 16, size = this.canvas.width;
      let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
      for (const s of track.samples) {
        minx = Math.min(minx, s.point.x); maxx = Math.max(maxx, s.point.x);
        minz = Math.min(minz, s.point.z); maxz = Math.max(maxz, s.point.z);
      }
      const w = maxx - minx, h = maxz - minz;
      const scale = Math.min((size - pad * 2) / w, (size - pad * 2) / h);
      const ox = (size - w * scale) / 2 - minx * scale;
      const oz = (size - h * scale) / 2 - minz * scale;
      this.bounds = { minx, minz, scale, ox, oz };
      this.mapPts = track.samples.map((s) => ({ x: s.point.x * scale + ox, y: s.point.z * scale + oz }));
      this.track = track;
    }
    _toMap(p) {
      const b = this.bounds;
      return { x: p.x * b.scale + b.ox, y: p.z * b.scale + b.oz };
    }
    drawMinimap(karts, player, hazards) {
      if (!this.mapPts) return;
      const ctx = this.ctx, size = this.canvas.width;
      ctx.clearRect(0, 0, size, size);
      // コースの帯
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 11;
      this._strokePath(ctx);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 7;
      this._strokePath(ctx);
      // スタートライン
      const s0 = this.mapPts[4];
      if (s0) { ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(s0.x, s0.y, 4, 0, Math.PI * 2); ctx.fill(); }
      // 敵キャラ（赤いひし形）
      if (hazards) {
        for (const hz of hazards) {
          const m = this._toMap(hz.markerPos);
          ctx.save();
          ctx.translate(m.x, m.y); ctx.rotate(Math.PI / 4);
          ctx.fillStyle = hz.dangerous ? '#ff2a2a' : 'rgba(200,60,60,0.55)';
          ctx.fillRect(-3.2, -3.2, 6.4, 6.4);
          ctx.restore();
        }
      }
      // カート
      for (const k of karts) {
        const m = this._toMap(k.group.position);
        const isP = k === player;
        ctx.beginPath();
        ctx.arc(m.x, m.y, isP ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#' + (k.character.colors.primary).toString(16).padStart(6, '0');
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isP ? '#ffffff' : 'rgba(0,0,0,0.5)';
        ctx.stroke();
      }
    }
    _strokePath(ctx) {
      const pts = this.mapPts;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.stroke();
    }

    /* ---- 毎フレーム ---- */
    update(dt, game) {
      const p = game.player;
      if (!p) return;
      // アイテムルーレット演出
      if (this.rolling) {
        this._rouletteT += dt;
        if (this._rouletteT > 0.07) {
          this._rouletteT = 0;
          this._rouletteI = (this._rouletteI + 1) % ROULETTE.length;
          this._setIcon(ROULETTE[this._rouletteI]);
        }
      }
      // 速度
      this.setSpeed(Math.abs(p.speed) * 3.0);
      // 順位
      this.setPosition(p.place, game.karts.length);
      // ラップ
      this.setLap(Math.min(p.lap + 1, MK.CONFIG.laps), MK.CONFIG.laps);
      // 逆走
      this.setWrongWay(p.wrongWay && !p.finished);
      // ミニマップ
      this.drawMinimap(game.karts, p, game.hazards ? game.hazards.hazards : null);
    }
  }

  MK.HUD = HUD;
  MK.hud = new HUD();

})(window.MK);
