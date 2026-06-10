/* ============================================================================
 *  particles.js — プール式パーティクル
 *  ドリフト火花 / ブーストの炎 / 砂煙 / 爆発 / きらめき / コインの光 など
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;

  class ParticleSystem {
    constructor(scene, count) {
      this.scene = scene;
      this.count = count || 420;
      this.pool = [];
      this.free = [];
      const tex = U.softCircleTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
      this.tex = tex;
      for (let i = 0; i < this.count; i++) {
        const mat = new THREE.SpriteMaterial({
          map: tex, color: 0xffffff, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false, opacity: 1,
        });
        const s = new THREE.Sprite(mat);
        s.visible = false;
        s.userData.p = { active: false };
        scene.add(s);
        this.pool.push(s);
        this.free.push(i);
      }
    }

    _get() {
      if (this.free.length === 0) return null;
      const idx = this.free.pop();
      return this.pool[idx];
    }

    spawn(o) {
      const s = this._get();
      if (!s) return null;
      const p = s.userData.p;
      p.active = true;
      p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
      p.life = 0; p.maxLife = o.life || 0.6;
      p.size0 = o.size != null ? o.size : 1;
      p.size1 = o.sizeEnd != null ? o.sizeEnd : p.size0 * 0.2;
      p.gravity = o.gravity != null ? o.gravity : 0;
      p.drag = o.drag != null ? o.drag : 0.0;
      p.fadePow = o.fadePow || 1;
      p.spin = o.spin || 0;
      s.position.set(o.x || 0, o.y || 0, o.z || 0);
      s.material.color.setHex(o.color != null ? o.color : 0xffffff);
      s.material.opacity = o.opacity != null ? o.opacity : 1;
      s.material.blending = o.blending != null ? o.blending : THREE.AdditiveBlending;
      s.scale.set(p.size0, p.size0, 1);
      s.material.rotation = o.rot || 0;
      s.visible = true;
      return s;
    }

    update(dt) {
      for (let i = 0; i < this.pool.length; i++) {
        const s = this.pool[i];
        const p = s.userData.p;
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false; s.visible = false; this.free.push(i);
          continue;
        }
        const t = p.life / p.maxLife;
        const dragF = 1 - p.drag * dt;
        p.vx *= dragF; p.vz *= dragF;
        p.vy += p.gravity * dt;
        s.position.x += p.vx * dt;
        s.position.y += p.vy * dt;
        s.position.z += p.vz * dt;
        const sz = U.lerp(p.size0, p.size1, t);
        s.scale.set(sz, sz, 1);
        s.material.opacity = Math.pow(1 - t, p.fadePow);
        if (p.spin) s.material.rotation += p.spin * dt;
      }
    }

    /* ---- 効果プリセット ---- */
    driftSpark(x, y, z, color, backx, backz) {
      const n = 3;
      for (let i = 0; i < n; i++) {
        const white = Math.random() < 0.3;
        this.spawn({
          x: x + U.randRange(-0.35, 0.35), y: y + U.randRange(0, 0.35), z: z + U.randRange(-0.35, 0.35),
          vx: backx * U.randRange(2, 7) + U.randRange(-4, 4),
          vy: U.randRange(2, 8),
          vz: backz * U.randRange(2, 7) + U.randRange(-4, 4),
          gravity: -16, drag: 1.5,
          life: U.randRange(0.2, 0.42), size: U.randRange(0.6, 1.2), sizeEnd: 0.05,
          color: white ? 0xffffff : color, fadePow: 1.4,
        });
      }
    }

    boostFlame(x, y, z, color) {
      this.spawn({
        x: x + U.randRange(-0.35, 0.35), y: y + U.randRange(0, 0.45), z: z + U.randRange(-0.35, 0.35),
        vx: U.randRange(-2.5, 2.5), vy: U.randRange(1, 5), vz: U.randRange(-2.5, 2.5),
        gravity: 7, drag: 2,
        life: U.randRange(0.22, 0.46), size: U.randRange(1.0, 2.0), sizeEnd: 0.1,
        color: color || 0xffa531, fadePow: 1.2,
      });
      // 白熱コア
      this.spawn({ x, y: y + 0.1, z, vy: U.randRange(1, 3), life: 0.2, size: U.randRange(0.5, 0.9), sizeEnd: 0.05, color: 0xfff3c0, fadePow: 1.5 });
    }

    // ブースト点火時の派手なリング＋放射バースト
    boostRing(x, y, z, color) {
      this.spawn({ x, y: y + 0.4, z, life: 0.4, size: 1.2, sizeEnd: 10, color: 0xffffff, fadePow: 2.2, opacity: 0.95 });
      this.spawn({ x, y: y + 0.4, z, life: 0.46, size: 0.8, sizeEnd: 8.5, color: color || 0xffd24a, fadePow: 2.0, opacity: 0.9 });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * U.TAU, sp = U.randRange(7, 13);
        this.spawn({
          x, y: y + 0.3, z,
          vx: Math.cos(a) * sp, vy: U.randRange(1, 4), vz: Math.sin(a) * sp,
          gravity: -10, drag: 1.0, life: U.randRange(0.3, 0.55), size: U.randRange(0.6, 1.2), sizeEnd: 0.05,
          color: i % 2 ? (color || 0xffd24a) : 0xffffff, fadePow: 1.3,
        });
      }
    }

    dust(x, y, z, color) {
      this.spawn({
        x: x + U.randRange(-0.4, 0.4), y: y + 0.1, z: z + U.randRange(-0.4, 0.4),
        vx: U.randRange(-2, 2), vy: U.randRange(0.5, 2), vz: U.randRange(-2, 2),
        gravity: 2, drag: 1.5,
        life: U.randRange(0.3, 0.6), size: 0.6, sizeEnd: 2.2,
        color: color != null ? color : 0xcdbb88, opacity: 0.5, blending: THREE.NormalBlending, fadePow: 1.5,
      });
    }

    // ゲッソーの墨（プレイヤーへ向けて黒い飛沫を噴く）
    inkJet(x, y, z, dx, dz) {
      const len = Math.hypot(dx, dz) || 1;
      const nx = dx / len, nz = dz / len;
      for (let i = 0; i < 16; i++) {
        this.spawn({
          x, y: y + U.randRange(-0.3, 0.3), z,
          vx: nx * U.randRange(14, 26) + U.randRange(-4, 4),
          vy: U.randRange(-2, 3),
          vz: nz * U.randRange(14, 26) + U.randRange(-4, 4),
          gravity: -6, drag: 0.8,
          life: U.randRange(0.3, 0.6), size: U.randRange(0.8, 1.6), sizeEnd: 2.4,
          color: 0x14141c, opacity: 0.85, blending: THREE.NormalBlending, fadePow: 1.1,
        });
      }
    }

    // 機関車の煙突から立ち上る煙
    smoke(x, y, z) {
      this.spawn({
        x: x + U.randRange(-0.3, 0.3), y, z: z + U.randRange(-0.3, 0.3),
        vx: U.randRange(-0.6, 0.6), vy: U.randRange(2.5, 4.2), vz: U.randRange(-0.6, 0.6),
        gravity: 0.5, drag: 0.6,
        life: U.randRange(0.8, 1.4), size: 1.0, sizeEnd: 3.4,
        color: 0xcfcfd4, opacity: 0.45, blending: THREE.NormalBlending, fadePow: 1.2,
      });
    }

    // スリップストリーム中の風の筋（前方から後ろへ流れる）
    draftStreak(x, y, z, fwd) {
      const side = Math.random() < 0.5 ? 1 : -1;
      const ox = -fwd.z * side * U.randRange(0.9, 1.7), oz = fwd.x * side * U.randRange(0.9, 1.7);
      this.spawn({
        x: x + fwd.x * 3.2 + ox, y: y + U.randRange(-0.3, 0.9), z: z + fwd.z * 3.2 + oz,
        vx: -fwd.x * 28, vy: 0, vz: -fwd.z * 28,
        life: U.randRange(0.16, 0.26), size: 0.55, sizeEnd: 0.1,
        color: 0xcfe8ff, opacity: 0.5, fadePow: 1.1,
      });
    }

    // ゴールの紙吹雪（カラフル・ひらひら落ちる）
    confetti(x, y, z, n) {
      const cols = [0xff5d5d, 0xffba4d, 0xfff04d, 0x5dff8a, 0x5db9ff, 0xc45dff, 0xffffff, 0xff7ad6];
      n = n || 46;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * U.TAU, sp = U.randRange(3, 12);
        this.spawn({
          x: x + U.randRange(-2, 2), y: y + U.randRange(2, 7), z: z + U.randRange(-2, 2),
          vx: Math.cos(a) * sp, vy: U.randRange(4, 12), vz: Math.sin(a) * sp,
          gravity: -9, drag: 1.4,
          life: U.randRange(1.0, 1.9), size: U.randRange(0.35, 0.6), sizeEnd: 0.3,
          color: cols[(Math.random() * cols.length) | 0], opacity: 0.95,
          blending: THREE.NormalBlending, fadePow: 0.6, spin: U.randRange(-8, 8),
        });
      }
    }

    splash(x, y, z, color) {
      for (let i = 0; i < 6; i++) {
        this.spawn({
          x, y: y + 0.2, z,
          vx: U.randRange(-4, 4), vy: U.randRange(3, 7), vz: U.randRange(-4, 4),
          gravity: -18, drag: 0.5,
          life: U.randRange(0.3, 0.55), size: 0.5, sizeEnd: 0.1,
          color: color || 0x9fd8ff, fadePow: 1.2,
        });
      }
    }

    explosion(x, y, z, color, scale) {
      const sc = scale || 1;
      // 中心フラッシュ（白熱コア＋色付き）
      this.spawn({ x, y: y + 0.6, z, vy: 1, life: 0.36, size: 1.5, sizeEnd: 13 * sc, color: 0xffffff, fadePow: 1.8 });
      this.spawn({ x, y: y + 0.6, z, vy: 1, life: 0.42, size: 1, sizeEnd: 10 * sc, color: color || 0xffd24a, fadePow: 1.6 });
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * U.TAU;
        const sp = U.randRange(8, 22) * sc;
        this.spawn({
          x, y: y + 0.6, z,
          vx: Math.cos(a) * sp, vy: U.randRange(2, 14) * sc, vz: Math.sin(a) * sp,
          gravity: -16, drag: 0.8,
          life: U.randRange(0.4, 0.9), size: U.randRange(0.9, 2.0), sizeEnd: 0.1,
          color: i % 3 === 0 ? 0xffffff : (i % 3 === 1 ? 0xff7a1f : 0xffd24a), fadePow: 1.3,
        });
      }
      // 煙
      for (let i = 0; i < 12; i++) {
        this.spawn({
          x: x + U.randRange(-1, 1) * sc, y: y + 0.6, z: z + U.randRange(-1, 1) * sc,
          vx: U.randRange(-2, 2), vy: U.randRange(1, 3.5), vz: U.randRange(-2, 2),
          gravity: 1, drag: 1.2,
          life: U.randRange(0.6, 1.1), size: 1.6, sizeEnd: 6 * sc,
          color: 0x555555, opacity: 0.5, blending: THREE.NormalBlending, fadePow: 1.4,
        });
      }
    }

    sparkle(x, y, z, color) {
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * U.TAU;
        const sp = U.randRange(2, 9);
        this.spawn({
          x, y: y + U.randRange(0, 1.6), z,
          vx: Math.cos(a) * sp, vy: U.randRange(2, 7), vz: Math.sin(a) * sp,
          gravity: -14, drag: 1,
          life: U.randRange(0.3, 0.65), size: U.randRange(0.5, 1.0), sizeEnd: 0.05,
          color: color || 0xfff04d, fadePow: 1.2,
        });
      }
    }

    starTrail(x, y, z) {
      const cols = [0xff5d5d, 0xffba4d, 0xfff04d, 0x5dff8a, 0x5db9ff, 0xc45dff];
      for (let i = 0; i < 2; i++) this.spawn({
        x: x + U.randRange(-0.7, 0.7), y: y + U.randRange(0, 1.3), z: z + U.randRange(-0.7, 0.7),
        vx: U.randRange(-1.5, 1.5), vy: U.randRange(0, 2.5), vz: U.randRange(-1.5, 1.5),
        gravity: -4, drag: 1,
        life: U.randRange(0.3, 0.6), size: U.randRange(0.6, 1.2), sizeEnd: 0.05,
        color: cols[(Math.random() * cols.length) | 0], fadePow: 1.2,
      });
    }

    coinPop(x, y, z) {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * U.TAU;
        this.spawn({
          x, y: y + 0.5, z,
          vx: Math.cos(a) * U.randRange(1, 4), vy: U.randRange(3, 6), vz: Math.sin(a) * U.randRange(1, 4),
          gravity: -16, drag: 0.6,
          life: 0.45, size: 0.6, sizeEnd: 0.1, color: 0xffe14d, fadePow: 1.2,
        });
      }
    }

    // 拡大して消える閃光リング（衝撃波）
    shockwave(x, y, z, color, scale) {
      this.spawn({ x, y: y + 0.5, z, life: 0.34, size: 0.6, sizeEnd: 7 * (scale || 1), color: color != null ? color : 0xffffff, fadePow: 2.0, opacity: 0.9 });
    }
    // 放射状バースト
    burst(x, y, z, color, n, speed) {
      n = n || 12; speed = speed || 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * U.TAU + Math.random() * 0.3;
        this.spawn({
          x, y: y + 0.5, z,
          vx: Math.cos(a) * speed * U.randRange(0.6, 1.2), vy: U.randRange(1, 5), vz: Math.sin(a) * speed * U.randRange(0.6, 1.2),
          gravity: -12, drag: 1.0, life: U.randRange(0.3, 0.6), size: U.randRange(0.5, 1.1), sizeEnd: 0.05,
          color: color != null ? color : 0xffffff, fadePow: 1.3,
        });
      }
    }
    // アイテム発動の演出
    itemPop(x, y, z, color) {
      this.shockwave(x, y, z, 0xffffff, 1.2);
      this.shockwave(x, y, z, color);
      this.burst(x, y, z, color, 14, 8);
    }
    // スター取得の虹バースト
    starBurst(x, y, z) {
      const cols = [0xff5d5d, 0xffba4d, 0xfff04d, 0x5dff8a, 0x5db9ff, 0xc45dff];
      this.shockwave(x, y, z, 0xffffff, 1.5);
      for (let i = 0; i < 34; i++) {
        const a = (i / 34) * U.TAU; const sp = U.randRange(6, 15);
        this.spawn({ x, y: y + 0.6, z, vx: Math.cos(a) * sp, vy: U.randRange(2, 10), vz: Math.sin(a) * sp, gravity: -12, drag: 0.9, life: U.randRange(0.4, 0.95), size: U.randRange(0.7, 1.5), sizeEnd: 0.05, color: cols[i % cols.length], fadePow: 1.2 });
      }
    }
    // こうらの軌跡
    shellTrail(x, y, z, color) {
      this.spawn({ x, y: y + 0.2, z, vy: U.randRange(0, 1), drag: 2, life: 0.22, size: 0.5, sizeEnd: 0.05, color: color != null ? color : 0x7affa0, opacity: 0.8, fadePow: 1.4 });
    }
    // 落雷の着弾フラッシュ
    boltFlash(x, y, z) {
      this.spawn({ x, y, z, life: 0.3, size: 1, sizeEnd: 6, color: 0xc9a0ff, fadePow: 2.0, opacity: 1 });
      this.burst(x, y, z, 0xe0c0ff, 14, 10);
    }

    // レース終了時の解放：プール全スプライトのマテリアルと共有テクスチャを破棄
    dispose() {
      for (const s of this.pool) {
        this.scene.remove(s);
        if (s.material && s.material.dispose) s.material.dispose();
      }
      if (this.tex && this.tex.dispose) this.tex.dispose();
      this.pool = []; this.free = [];
    }
  }

  MK.ParticleSystem = ParticleSystem;

})(window.MK);
