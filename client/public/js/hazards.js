/* ============================================================================
 *  hazards.js — コース上の敵キャラ（カートをクラッシュさせる障害物）
 *  テーマ別:  grass=クリボー/パックン  snow=ペンギン
 *            castle=ドッスン/ファイアバー  rainbow=ワンワン
 *  被弾でスピン/吹っ飛び（スター・無敵中は無効）。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;
  const C = MK.CONFIG;

  function M(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.7, metalness: 0.05, flatShading: true }, o || {})); }
  function basic(color, o) { return new THREE.MeshBasicMaterial(Object.assign({ color }, o || {})); }
  function box(w, h, d, c, o) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o)); }
  function sph(r, c, seg, o) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg || 14, seg || 10), M(c, o)); }
  function cyl(rt, rb, h, c, s) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s || 12), M(c)); }
  function cone(r, h, c, s) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, s || 10), M(c)); }
  function eyes(g, y, z, sep, look) {
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), basic(0xffffff));
      w.position.set(s * sep, y, z); w.scale.set(0.8, 1.2, 0.6); g.add(w);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), basic(0x18181f));
      p.position.set(s * sep + (look || 0) * 0.02, y, z - 0.12); g.add(p);
    }
  }
  function glowSprite(color, size) {
    const tex = U.softCircleTexture('rgba(255,210,120,1)', 'rgba(255,80,0,0)');
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: color || 0xffae33 }));
    s.scale.set(size || 2, size || 2, 1); return s;
  }
  function blob(r) {
    const tex = U.softCircleTexture('rgba(0,0,0,0.5)', 'rgba(0,0,0,0)');
    const m = new THREE.Mesh(new THREE.CircleGeometry(r || 2, 18), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.6 }));
    m.rotation.x = -Math.PI / 2; return m;
  }

  /* ---- 敵メッシュ ---- */
  const Build = {
    piranha() {
      const g = new THREE.Group();
      const pipe = cyl(1.0, 1.0, 1.4, 0x2fae4a, 14); pipe.position.y = 0.7; g.add(pipe);
      const rim = cyl(1.2, 1.2, 0.4, 0x36c957, 14); rim.position.y = 1.4; g.add(rim);
      const stalk = new THREE.Group(); stalk.position.y = 1.4; g.add(stalk);
      const stem = cyl(0.18, 0.22, 1.6, 0x3fa83f, 8); stem.position.y = 0.8; stalk.add(stem);
      for (const s of [-1, 1]) { const leaf = cone(0.3, 0.7, 0x4fd33d, 6); leaf.position.set(s * 0.4, 0.7, 0); leaf.rotation.z = s * 1.1; stalk.add(leaf); }
      const head = new THREE.Group(); head.position.y = 1.7; stalk.add(head);
      const bulb = sph(0.62, 0xe23b2e, 14); bulb.scale.set(1, 0.95, 1); head.add(bulb);
      // 白い水玉
      for (let i = 0; i < 7; i++) { const sp = sph(0.1, 0xffffff, 8); const a = i / 7 * U.TAU; sp.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.35, -0.35); head.add(sp); }
      // 口（白い歯のリング）＋暗い口内
      const mouth = sph(0.4, 0x6b0f0a, 10); mouth.position.set(0, -0.05, -0.5); mouth.scale.set(1, 0.7, 0.6); head.add(mouth);
      const lipT = box(0.7, 0.12, 0.2, 0xffffff); lipT.position.set(0, 0.18, -0.55); head.add(lipT);
      const lipB = box(0.7, 0.12, 0.2, 0xffffff); lipB.position.set(0, -0.28, -0.55); head.add(lipB);
      g.userData.stalk = stalk; g.userData.head = head;
      return g;
    },
    penguin() {
      const g = new THREE.Group();
      const body = sph(0.6, 0x2b2f3a, 14); body.scale.set(1, 1.25, 1); body.position.y = 0.75; g.add(body);
      const belly = sph(0.45, 0xffffff, 14); belly.scale.set(0.85, 1.1, 0.5); belly.position.set(0, 0.7, -0.3); g.add(belly);
      const head = sph(0.42, 0x2b2f3a, 14); head.position.y = 1.45; g.add(head);
      const face = sph(0.3, 0xffffff, 12); face.scale.set(0.9, 0.9, 0.5); face.position.set(0, 1.42, -0.26); g.add(face);
      const beak = cone(0.16, 0.34, 0xff8a2a, 8); beak.position.set(0, 1.38, -0.5); beak.rotation.x = -Math.PI / 2; g.add(beak);
      eyes(g, 1.55, -0.32, 0.15, 1);
      for (const s of [-1, 1]) {
        const flip = sph(0.16, 0x2b2f3a, 8); flip.scale.set(0.5, 1.3, 0.7); flip.position.set(s * 0.6, 0.75, 0); g.add(flip);
        const foot = box(0.34, 0.12, 0.5, 0xff8a2a); foot.position.set(s * 0.25, 0.06, -0.2); g.add(foot);
      }
      return g;
    },
    thwomp() {
      const g = new THREE.Group();
      const block = box(2.0, 2.4, 1.5, 0x7f8bb0); block.position.y = 1.2; g.add(block);
      const plate = box(1.7, 2.05, 0.12, 0x9aa6cc); plate.position.set(0, 1.2, -0.78); g.add(plate);
      // スタッド
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const st = cone(0.16, 0.28, 0xc8d0e8, 4); st.position.set(sx * 0.78, 1.2 + sy * 0.85, -0.84); st.rotation.x = -Math.PI / 2; g.add(st); }
      // 顔
      eyes(g, 1.5, -0.82, 0.32, 1);
      for (const s of [-1, 1]) { const brow = box(0.5, 0.12, 0.12, 0x3a4360); brow.position.set(s * 0.32, 1.72, -0.86); brow.rotation.z = -s * 0.5; g.add(brow); }
      const mouth = box(1.2, 0.5, 0.12, 0xffffff); mouth.position.set(0, 0.8, -0.86); g.add(mouth);
      for (let i = -1; i <= 1; i++) { const t = box(0.1, 0.5, 0.14, 0x4a5170); t.position.set(i * 0.35, 0.8, -0.9); g.add(t); }
      return g;
    },
    fireball() {
      const g = new THREE.Group();
      const core = sph(0.45, 0xffd24a, 12, { emissive: 0xff6a1a, emissiveIntensity: 1.0 });
      g.add(core); g.add(glowSprite(0xffae33, 1.8));
      return g;
    },
    chompBall() {
      const g = new THREE.Group();
      const ball = sph(1.0, 0x202028, 18, { metalness: 0.3, roughness: 0.5 }); g.add(ball);
      // 歯（白いリング）
      const teeth = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.16, 8, 16), M(0xffffff));
      teeth.position.set(0, -0.05, -0.62); g.add(teeth);
      const mouth = sph(0.5, 0x401015, 10); mouth.position.set(0, -0.05, -0.7); mouth.scale.set(1, 0.8, 0.5); g.add(mouth);
      eyes(g, 0.45, -0.66, 0.26, 1);
      // 留め金
      const bolt = sph(0.18, 0xb8bcc4, 8, { metalness: 0.7, roughness: 0.3 }); bolt.position.set(0, 0.7, 0.6); g.add(bolt);
      return g;
    },
    chompPost() {
      const g = new THREE.Group();
      const post = cyl(0.22, 0.28, 1.6, 0x8a8f99, 10); post.position.y = 0.8; g.add(post);
      const cap = sph(0.3, 0xb8bcc4, 10, { metalness: 0.6, roughness: 0.3 }); cap.position.y = 1.6; g.add(cap);
      return g;
    },
  };

  /* ---- システム ---- */
  class HazardSystem {
    constructor(world) {
      this.world = world;
      this.scene = world.scene;
      this.track = world.track;
      this.root = new THREE.Group();
      this.scene.add(this.root);
      this.hazards = [];
    }

    build(course) {
      const props = course.theme.props;
      const plans = {
        grass: [['goomba', 4], ['piranha', 2]],
        snow: [['penguin', 5]],
        castle: [['thwomp', 3], ['firebar', 2]],
        rainbow: [['chomp', 3]],
      }[props] || [];

      // 0.15〜0.95 の範囲に種類ごとへ均等配置
      let slot = 0, totalSlots = plans.reduce((a, p) => a + p[1], 0);
      for (const [kind, count] of plans) {
        for (let i = 0; i < count; i++) {
          const f = 0.15 + (slot + 0.5) / totalSlots * 0.78;
          slot++;
          this._add(kind, f, (i % 2 === 0 ? 1 : -1));
        }
      }
    }

    _baseIndex(f) { return Math.floor(f * this.track.sampleCount) % this.track.sampleCount; }

    _add(kind, f, side) {
      const idx = this._baseIndex(f);
      const sample = this.track.samples[idx];
      const rh = this.track.roadHalf;
      const hz = {
        kind, side, sample, t: Math.random() * 10, phase: Math.random() * 10,
        dangerous: false, radius: 1.6, effect: 'spin',
        hitPoints: [], markerPos: new THREE.Vector3(), lateral: 0, _p: new THREE.Vector3(),
        _prevDown: false,
      };

      if (kind === 'goomba') {
        hz.group = MK.SceneryBuild.goomba(); hz.group.scale.setScalar(1.05);
        hz.amp = rh * 0.78; hz.speed = 1.25; hz.radius = 1.5; hz.effect = 'spin';
        hz.hitPoints = [hz._p];
      } else if (kind === 'piranha') {
        hz.group = Build.piranha();
        hz.lateral = (rh - 0.4) * side; hz.radius = 2.3; hz.effect = 'spin';
        hz.hitPoints = [hz._p];
      } else if (kind === 'penguin') {
        hz.group = Build.penguin(); hz.group.scale.setScalar(1.1);
        hz.amp = rh * 0.92; hz.speed = 1.6; hz.radius = 1.6; hz.effect = 'spin';
        hz.hitPoints = [hz._p];
      } else if (kind === 'thwomp') {
        hz.group = Build.thwomp();
        hz.lateral = U.randRange(-rh * 0.45, rh * 0.45); hz.radius = 2.6; hz.effect = 'launch';
        hz.shadow = blob(2.4); this.root.add(hz.shadow);
        hz.cycle = 3.8; hz.hover = 8; hz.y = hz.hover;
        hz.hitPoints = [hz._p];
      } else if (kind === 'firebar') {
        hz.group = new THREE.Group();
        hz.lateral = U.randRange(-rh * 0.3, rh * 0.3); hz.radius = 1.3; hz.effect = 'spin';
        hz.pivot = new THREE.Group(); hz.group.add(hz.pivot);
        hz.balls = []; hz.dists = [2.2, 3.4, 4.6, 5.8]; hz.rot = 1.5 * (side > 0 ? 1 : -1);
        hz._pts = [];
        const hub = cyl(0.5, 0.6, 1.2, 0x3a3a44, 8); hub.position.y = 1.4; hz.group.add(hub);
        for (const d of hz.dists) {
          const fb = Build.fireball(); fb.position.set(d, 1.4, 0); hz.pivot.add(fb); hz.balls.push(fb);
          hz._pts.push(new THREE.Vector3());
        }
        hz.hitPoints = hz._pts;
      } else if (kind === 'chomp') {
        hz.group = new THREE.Group();
        hz.radius = 2.3; hz.effect = 'launch';
        const sm = hz.sample;
        const postLat = (rh + 1.0) * side;
        hz.post = new THREE.Vector3(sm.point.x + sm.normal.x * postLat, sm.point.y, sm.point.z + sm.normal.z * postLat);
        hz.inward = new THREE.Vector3(-sm.normal.x * side, 0, -sm.normal.z * side); // コース中心方向
        const postMesh = Build.chompPost(); postMesh.position.copy(hz.post); hz.group.add(postMesh);
        hz.ball = Build.chompBall(); hz.group.add(hz.ball);
        hz.links = [];
        for (let i = 0; i < 4; i++) { const l = sph(0.2, 0x33343d, 8, { metalness: 0.4 }); hz.group.add(l); hz.links.push(l); }
        hz.reachBase = rh * 0.3; hz.reachAmp = rh * 1.05;
        hz.hitPoints = [hz._p];
      }

      this.root.add(hz.group);
      // 初期配置
      this._place(hz);
      this.hazards.push(hz);
    }

    _place(hz) {
      // 初期位置（中心線上）
      const sm = hz.sample;
      hz._p.set(sm.point.x, sm.point.y, sm.point.z);
      hz.markerPos.copy(hz._p);
      if (hz.group && hz.kind !== 'chomp' && hz.kind !== 'firebar') hz.group.position.copy(sm.point);
      if (hz.kind === 'firebar') hz.group.position.set(sm.point.x + sm.normal.x * hz.lateral, sm.point.y, sm.point.z + sm.normal.z * hz.lateral);
    }

    /* ---- 更新 ---- */
    update(dt) {
      const karts = this.world.karts;
      for (const hz of this.hazards) {
        hz.t += dt;
        this._animate(hz, dt);
        // markerPos の横ずれをキャッシュ（AI回避用）
        const pr = this.track.project(hz.markerPos);
        hz.lateral = pr.lateral;
        // 当たり判定
        if (hz.dangerous) this._collide(hz, karts);
      }
    }

    _animate(hz, dt) {
      const sm = hz.sample, nrm = sm.normal, bp = sm.point;
      switch (hz.kind) {
        case 'goomba': {
          const lat = Math.sin(hz.t * hz.speed + hz.phase) * hz.amp;
          const vx = Math.cos(hz.t * hz.speed + hz.phase);
          hz.group.position.set(bp.x + nrm.x * lat, bp.y + Math.abs(Math.sin(hz.t * 7)) * 0.12, bp.z + nrm.z * lat);
          hz.group.rotation.y = Math.atan2(-nrm.x * Math.sign(vx || 1), -nrm.z * Math.sign(vx || 1));
          hz._p.copy(hz.group.position); hz.markerPos.copy(hz._p);
          hz.dangerous = true; break;
        }
        case 'penguin': {
          const w = hz.speed / hz.amp * 6;
          const lat = Math.sin(hz.t * 1.2 + hz.phase) * hz.amp;
          const vx = Math.cos(hz.t * 1.2 + hz.phase);
          hz.group.position.set(bp.x + nrm.x * lat, bp.y + 0.05, bp.z + nrm.z * lat);
          hz.group.rotation.y = Math.atan2(-nrm.x * Math.sign(vx || 1), -nrm.z * Math.sign(vx || 1));
          hz.group.rotation.z = Math.sin(hz.t * 8) * 0.12;
          hz._p.copy(hz.group.position); hz.markerPos.copy(hz._p);
          hz.dangerous = true; break;
        }
        case 'piranha': {
          // 周期的に伸び上がって噛みつく
          const cyc = (hz.t + hz.phase) % 3.0;
          const out = cyc < 1.0;                // 噛みつき中（危険）
          const ext = out ? Math.sin(cyc * Math.PI) : 0; // 0..1
          hz.group.position.copy(bp);
          hz.group.rotation.y = Math.atan2(-nrm.x, -nrm.z); // コース側を向く
          const stalk = hz.group.userData.stalk, head = hz.group.userData.head;
          if (stalk) stalk.scale.y = 0.4 + ext * 0.8;
          if (head) head.position.y = 1.4 + ext * 0.6;
          // 噛みつき位置はやや中心寄り
          const lat = hz.lateralBase != null ? hz.lateralBase : (hz.lateralBase = hz.lateral);
          const hitLat = hz.lateral - Math.sign(hz.lateral || 1) * ext * 2.2;
          hz._p.set(bp.x + nrm.x * hitLat, bp.y + 1.6, bp.z + nrm.z * hitLat);
          hz.markerPos.copy(bp);
          hz.dangerous = ext > 0.4; break;
        }
        case 'thwomp': {
          const c = (hz.t % hz.cycle) / hz.cycle; // 0..1
          let y;
          if (c < 0.45) y = hz.hover;                       // 上で待機
          else if (c < 0.52) y = hz.hover * (1 - (c - 0.45) / 0.07); // 落下
          else if (c < 0.72) y = 0;                          // 着地（危険）
          else y = hz.hover * ((c - 0.72) / 0.28);           // 上昇
          hz.y = y;
          const cx = bp.x + nrm.x * hz.lateral, cz = bp.z + nrm.z * hz.lateral;
          hz.group.position.set(cx, bp.y + y, cz);
          if (hz.shadow) {
            hz.shadow.position.set(cx, bp.y + 0.06, cz);
            const k = U.clamp(1 - y / hz.hover, 0.2, 1);
            hz.shadow.scale.set(1.2 + k * 1.4, 1.2 + k * 1.4, 1);
            hz.shadow.material.opacity = 0.25 + k * 0.5;
          }
          const down = y < 2.2;
          // 着地の瞬間に演出
          if (down && !hz._prevDown) {
            if (this.world.particles) for (let i = 0; i < 8; i++) this.world.particles.dust(cx + U.randRange(-2, 2), bp.y, cz + U.randRange(-2, 2));
            MK.audio.bump();
            if (this._playerNear(cx, cz, 18)) this.world.shake(0.5);
          }
          hz._prevDown = down;
          hz._p.set(cx, bp.y, cz); hz.markerPos.set(cx, bp.y, cz);
          hz.dangerous = down; break;
        }
        case 'firebar': {
          const a = hz.t * hz.rot;
          hz.pivot.rotation.y = a;
          const cx = hz.group.position.x, cy = hz.group.position.y + 1.4, cz = hz.group.position.z;
          for (let i = 0; i < hz.dists.length; i++) {
            const d = hz.dists[i];
            hz._pts[i].set(cx + Math.cos(a) * d, cy, cz - Math.sin(a) * d);
            const core = hz.balls[i].children[0];
            if (core && core.material) core.material.emissiveIntensity = 0.7 + Math.sin(hz.t * 12 + i) * 0.3;
          }
          hz.markerPos.set(cx, cy, cz);
          hz.dangerous = true; break;
        }
        case 'chomp': {
          const reach = hz.reachBase + hz.reachAmp * (0.5 + 0.5 * Math.sin(hz.t * 1.7 + hz.phase));
          const sweep = Math.sin(hz.t * 1.15) * 0.5;
          // inward を Y 周りに sweep 回転
          const ix = hz.inward.x, iz = hz.inward.z;
          const dx = ix * Math.cos(sweep) + iz * Math.sin(sweep);
          const dz = -ix * Math.sin(sweep) + iz * Math.cos(sweep);
          const hop = Math.abs(Math.sin(hz.t * 3.0)) * 0.6;
          const bx = hz.post.x + dx * reach, bz = hz.post.z + dz * reach, by = hz.post.y + 1.0 + hop;
          hz.ball.position.set(bx, by, bz);
          hz.ball.rotation.y = Math.atan2(-dx, -dz);
          hz.ball.rotation.x += dt * 4;
          for (let i = 0; i < hz.links.length; i++) {
            const u = (i + 1) / (hz.links.length + 1);
            hz.links[i].position.set(
              hz.post.x + (bx - hz.post.x) * u,
              hz.post.y + 1.2 + (by - hz.post.y - 1.2) * u,
              hz.post.z + (bz - hz.post.z) * u);
          }
          hz._p.set(bx, by, bz); hz.markerPos.set(bx, by, bz);
          hz.dangerous = true; break;
        }
      }
    }

    _collide(hz, karts) {
      const rr = (hz.radius + C.kartRadius * 0.6);
      const rr2 = rr * rr;
      for (const k of karts) {
        if (!k.isHittable()) continue;
        for (const hp of hz.hitPoints) {
          const dx = k.group.position.x - hp.x, dz = k.group.position.z - hp.z;
          if (dx * dx + dz * dz < rr2) {
            if (hz.effect === 'launch') {
              if (k.launch()) {
                if (this.world.particles) this.world.particles.explosion(k.group.position.x, k.group.position.y, k.group.position.z, 0xffd24a);
                if (k.isPlayer) this.world.shake(0.8);
              }
            } else {
              if (k.spinOut() && this.world.particles) this.world.particles.sparkle(k.group.position.x, k.group.position.y + 0.5, k.group.position.z, 0xffd24a);
            }
            break;
          }
        }
      }
    }

    _playerNear(x, z, d) {
      const p = this.world.player;
      if (!p) return false;
      const dx = p.group.position.x - x, dz = p.group.position.z - z;
      return dx * dx + dz * dz < d * d;
    }

    // AI回避用：前方 dist 内で最も近い危険ハザードを返す
    nearestDangerAhead(kart, dist) {
      let best = null, bd = dist * dist;
      const fwd = kart.forward(U.tmpV1);
      for (const hz of this.hazards) {
        if (!hz.dangerous) continue;
        const dx = hz.markerPos.x - kart.group.position.x, dz = hz.markerPos.z - kart.group.position.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < bd) {
          const dot = dx * fwd.x + dz * fwd.z;
          if (dot > 0) { bd = d2; best = hz; }
        }
      }
      return best;
    }

    reset() {
      this.scene.remove(this.root);
      this.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose()); else o.material.dispose(); }
      });
      this.hazards = [];
    }
  }

  MK.HazardSystem = HazardSystem;
  MK.HazardBuild = Build;

})(window.MK);
