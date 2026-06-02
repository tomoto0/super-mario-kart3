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
      const n = 2;
      for (let i = 0; i < n; i++) {
        this.spawn({
          x: x + U.randRange(-0.3, 0.3), y: y + U.randRange(0, 0.3), z: z + U.randRange(-0.3, 0.3),
          vx: backx * U.randRange(2, 6) + U.randRange(-3, 3),
          vy: U.randRange(2, 6),
          vz: backz * U.randRange(2, 6) + U.randRange(-3, 3),
          gravity: -16, drag: 1.5,
          life: U.randRange(0.18, 0.36), size: U.randRange(0.5, 0.9), sizeEnd: 0.05,
          color, fadePow: 1.4,
        });
      }
    }

    boostFlame(x, y, z, color) {
      this.spawn({
        x: x + U.randRange(-0.3, 0.3), y: y + U.randRange(0, 0.4), z: z + U.randRange(-0.3, 0.3),
        vx: U.randRange(-2, 2), vy: U.randRange(1, 4), vz: U.randRange(-2, 2),
        gravity: 6, drag: 2,
        life: U.randRange(0.2, 0.4), size: U.randRange(0.8, 1.5), sizeEnd: 0.1,
        color: color || 0xffa531, fadePow: 1.2,
      });
    }

    dust(x, y, z) {
      this.spawn({
        x: x + U.randRange(-0.4, 0.4), y: y + 0.1, z: z + U.randRange(-0.4, 0.4),
        vx: U.randRange(-2, 2), vy: U.randRange(0.5, 2), vz: U.randRange(-2, 2),
        gravity: 2, drag: 1.5,
        life: U.randRange(0.3, 0.6), size: 0.6, sizeEnd: 2.2,
        color: 0xcdbb88, opacity: 0.5, blending: THREE.NormalBlending, fadePow: 1.5,
      });
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
      // 中心フラッシュ
      this.spawn({ x, y: y + 0.6, z, vx: 0, vy: 1, vz: 0, life: 0.32, size: 1, sizeEnd: 9 * sc, color: color || 0xffd24a, fadePow: 1.6 });
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * U.TAU;
        const sp = U.randRange(6, 18) * sc;
        this.spawn({
          x, y: y + 0.6, z,
          vx: Math.cos(a) * sp, vy: U.randRange(2, 12) * sc, vz: Math.sin(a) * sp,
          gravity: -16, drag: 0.8,
          life: U.randRange(0.4, 0.8), size: U.randRange(0.8, 1.8), sizeEnd: 0.1,
          color: i % 3 === 0 ? 0xffffff : (i % 3 === 1 ? 0xff7a1f : 0xffd24a), fadePow: 1.3,
        });
      }
      // 煙
      for (let i = 0; i < 8; i++) {
        this.spawn({
          x: x + U.randRange(-1, 1) * sc, y: y + 0.6, z: z + U.randRange(-1, 1) * sc,
          vx: U.randRange(-2, 2), vy: U.randRange(1, 3), vz: U.randRange(-2, 2),
          gravity: 1, drag: 1.2,
          life: U.randRange(0.6, 1.0), size: 1.5, sizeEnd: 5 * sc,
          color: 0x555555, opacity: 0.5, blending: THREE.NormalBlending, fadePow: 1.4,
        });
      }
    }

    sparkle(x, y, z, color) {
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * U.TAU;
        const sp = U.randRange(2, 8);
        this.spawn({
          x, y: y + U.randRange(0, 1.5), z,
          vx: Math.cos(a) * sp, vy: U.randRange(2, 6), vz: Math.sin(a) * sp,
          gravity: -14, drag: 1,
          life: U.randRange(0.3, 0.6), size: U.randRange(0.4, 0.8), sizeEnd: 0.05,
          color: color || 0xfff04d, fadePow: 1.2,
        });
      }
    }

    starTrail(x, y, z) {
      const cols = [0xff5d5d, 0xffba4d, 0xfff04d, 0x5dff8a, 0x5db9ff, 0xc45dff];
      this.spawn({
        x: x + U.randRange(-0.6, 0.6), y: y + U.randRange(0, 1.2), z: z + U.randRange(-0.6, 0.6),
        vx: U.randRange(-1, 1), vy: U.randRange(0, 2), vz: U.randRange(-1, 1),
        gravity: -4, drag: 1,
        life: U.randRange(0.3, 0.55), size: U.randRange(0.5, 1), sizeEnd: 0.05,
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
      this.shockwave(x, y, z, color);
      this.burst(x, y, z, color, 10, 7);
    }
    // スター取得の虹バースト
    starBurst(x, y, z) {
      const cols = [0xff5d5d, 0xffba4d, 0xfff04d, 0x5dff8a, 0x5db9ff, 0xc45dff];
      this.shockwave(x, y, z, 0xffffff);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * U.TAU; const sp = U.randRange(5, 13);
        this.spawn({ x, y: y + 0.6, z, vx: Math.cos(a) * sp, vy: U.randRange(2, 9), vz: Math.sin(a) * sp, gravity: -12, drag: 0.9, life: U.randRange(0.4, 0.85), size: U.randRange(0.6, 1.3), sizeEnd: 0.05, color: cols[i % cols.length], fadePow: 1.2 });
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
  }

  MK.ParticleSystem = ParticleSystem;

})(window.MK);
