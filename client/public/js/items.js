/* ============================================================================
 *  items.js — アイテムボックス / ルーレット / こうら・バナナ・ボム・スター・サンダー
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;
  const C = MK.CONFIG;

  /* ---- 見た目ビルダ ---- */
  function buildItemBox() {
    const tex = U.questionTexture();
    const mat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, roughness: 0.3, metalness: 0.1,
      emissive: 0x332200, emissiveIntensity: 0.4, opacity: 0.92,
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), mat);
    return box;
  }
  function buildShell(color, dark) {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1, flatShading: true }));
    shell.scale.set(1, 0.85, 1); g.add(shell);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.78, 16, 8, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45),
      new THREE.MeshStandardMaterial({ color: 0xfff0d0, roughness: 0.6 }));
    g.add(belly);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.12, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0xfff0d0, roughness: 0.6 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; g.add(rim);
    // トゲ
    const spikeMat = new THREE.MeshStandardMaterial({ color: dark || 0xffffff, roughness: 0.5, flatShading: true });
    const tips = [[0, 0.7, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [0, 0.5, 0.5], [0, 0.5, -0.5]];
    tips.forEach((p) => { const s = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 7), spikeMat); s.position.set(p[0], p[1], p[2]); g.add(s); });
    return g;
  }
  function buildBanana() {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffe14d, roughness: 0.5, flatShading: true });
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.18, 8, 14, Math.PI * 1.1), mat);
    b.rotation.z = -0.5; g.add(b);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x6b4a12 }));
    tip.position.set(0.5, 0.45, 0); tip.rotation.z = -1.2; g.add(tip);
    g.scale.setScalar(1.1);
    return g;
  }
  function buildBomb() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.4, metalness: 0.3, flatShading: true }));
    g.add(body);
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0xaa8855 }));
    fuse.position.set(0, 0.8, 0); fuse.rotation.z = 0.3; g.add(fuse);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd24a }));
    spark.position.set(0.12, 1.0, 0); g.add(spark);
    g.userData.spark = spark;
    // 目
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      eye.position.set(s * 0.22, 0.1, -0.6); g.add(eye);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      p.position.set(s * 0.22, 0.1, -0.7); g.add(p);
    }
    return g;
  }

  class ItemSystem {
    constructor(world) {
      this.world = world;
      this.scene = world.scene;
      this.boxes = [];
      this.projectiles = [];
      this._tmpl = { shellG: null };
    }

    buildBoxes(positions) {
      for (const pos of positions) {
        const mesh = buildItemBox();
        mesh.position.copy(pos);
        mesh.position.y = pos.y + 1.8;
        this.scene.add(mesh);
        this.boxes.push({ mesh, base: mesh.position.y, active: true, timer: 0, pos: pos.clone() });
      }
    }

    /* ---- ルーレット開始 ---- */
    startRoulette(kart) {
      kart.rouletteTime = 1.15;
      kart._rollFinal = MK.rollItem(kart.place - 1, this.world.karts.length);
      kart.item = '__rolling__';
      kart.itemCount = 0;
      kart._rouletteTick = 0;
    }

    _finalizeRoulette(kart) {
      const id = kart._rollFinal;
      if (id === 'triple') { kart.item = 'mushroom'; kart.itemCount = 3; }
      else { kart.item = id; kart.itemCount = 1; }
      kart.rouletteTime = 0;
      if (kart.isPlayer) MK.audio.itemGet();
    }

    /* ---- アイテム使用 ---- */
    useItem(kart) {
      if (!kart.item || kart.item === '__rolling__') return;
      const item = MK.ITEMS[kart.item];
      if (!item) { kart.item = null; return; }
      const gp = kart.group.position;
      const fwd = kart.forward(new THREE.Vector3());
      switch (item.type) {
        case 'boost':
          kart.useMushroom();
          break;
        case 'shellGreen':
          this._spawnShell(kart, false, fwd, gp);
          MK.audio.shellFire();
          break;
        case 'shellRed':
          this._spawnShell(kart, true, fwd, gp);
          MK.audio.shellFire();
          break;
        case 'banana':
          this._spawnBanana(kart, fwd, gp);
          break;
        case 'bomb':
          this._spawnBomb(kart, fwd, gp);
          MK.audio.shellFire();
          break;
        case 'star':
          kart.giveStar();
          break;
        case 'lightning':
          this._castLightning(kart);
          break;
        default: break;
      }
      // 在庫処理
      kart.itemCount--;
      if (kart.itemCount <= 0) { kart.item = null; kart.itemCount = 0; }
    }

    _spawnShell(kart, homing, fwd, gp) {
      const mesh = buildShell(homing ? 0xe23b2e : 0x2fae4a, homing ? 0xffffff : 0xffffff);
      mesh.position.set(gp.x + fwd.x * 2.4, gp.y + 0.6, gp.z + fwd.z * 2.4);
      this.scene.add(mesh);
      const speed = homing ? 48 : 54;
      this.projectiles.push({
        type: homing ? 'redShell' : 'greenShell',
        mesh, vel: new THREE.Vector3(fwd.x * speed, 0, fwd.z * speed),
        life: homing ? 8 : 7, owner: kart, grace: 0.15, bounces: 0,
        spin: U.randRange(-3, 3),
      });
    }
    _spawnBanana(kart, fwd, gp) {
      const mesh = buildBanana();
      mesh.position.set(gp.x - fwd.x * 2.6, gp.y + 0.4, gp.z - fwd.z * 2.6);
      this.scene.add(mesh);
      this.projectiles.push({ type: 'banana', mesh, vel: new THREE.Vector3(), life: 28, owner: kart, grace: 0.7, spin: 0.6 });
    }
    _spawnBomb(kart, fwd, gp) {
      const mesh = buildBomb();
      mesh.position.set(gp.x + fwd.x * 2.4, gp.y + 0.5, gp.z + fwd.z * 2.4);
      this.scene.add(mesh);
      this.projectiles.push({ type: 'bomb', mesh, vel: new THREE.Vector3(fwd.x * 30, 0, fwd.z * 30), life: 1.5, owner: kart, grace: 0.1, spin: 2 });
    }
    _castLightning(owner) {
      for (const k of this.world.karts) {
        if (k === owner) continue;
        k.squish();
      }
      if (this.world.onLightning) this.world.onLightning(owner);
      MK.audio.explosion();
    }

    explodeAt(pos, radius, owner) {
      this.world.particles.explosion(pos.x, pos.y, pos.z, 0xffd24a);
      MK.audio.explosion();
      if (this.world.shake) this.world.shake(0.9);
      for (const k of this.world.karts) {
        const d = k.group.position.distanceTo(pos);
        if (d < radius && k.isHittable()) k.launch();
      }
    }

    /* ---- 更新 ---- */
    update(dt) {
      const karts = this.world.karts;

      // ボックスの回転・取得・復活
      for (const b of this.boxes) {
        if (b.active) {
          b.mesh.rotation.y += dt * 1.5;
          b.mesh.rotation.x += dt * 0.6;
          b.mesh.position.y = b.base + Math.sin(performance.now() * 0.003 + b.pos.x) * 0.25;
          for (const k of karts) {
            if (k.item || k.rouletteTime > 0 || k.finished) continue;
            if (k.group.position.distanceTo(b.mesh.position) < 2.6) {
              b.active = false; b.timer = 3.5; b.mesh.visible = false;
              this.startRoulette(k);
              this.world.particles.sparkle(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z, 0xffffff);
              break;
            }
          }
        } else {
          b.timer -= dt;
          if (b.timer <= 0) { b.active = true; b.mesh.visible = true; }
        }
      }

      // ルーレット進行
      for (const k of karts) {
        if (k.rouletteTime > 0) {
          k.rouletteTime -= dt;
          k._rouletteTick = (k._rouletteTick || 0) + dt;
          if (k.isPlayer && k._rouletteTick > 0.07) { k._rouletteTick = 0; MK.audio.itemRouletteTick(); }
          if (k.rouletteTime <= 0) this._finalizeRoulette(k);
        }
      }

      // 弾の更新
      const track = this.world.track;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        pr.life -= dt; pr.grace = Math.max(0, pr.grace - dt);
        const m = pr.mesh;
        let remove = false;

        if (pr.type === 'redShell') {
          const target = this._findTargetAhead(pr.owner);
          if (target) {
            const dir = U.tmpV1.copy(target.group.position).sub(m.position); dir.y = 0;
            if (dir.lengthSq() > 0.01) {
              dir.normalize();
              const cur = pr.vel.clone().normalize();
              cur.lerp(dir, 0.08).normalize();
              const sp = pr.vel.length();
              pr.vel.set(cur.x * sp, 0, cur.z * sp);
            }
          }
        }

        if (pr.type !== 'banana') {
          m.position.x += pr.vel.x * dt;
          m.position.z += pr.vel.z * dt;
        }
        // 路面追従
        const info = track.project(m.position);
        m.position.y = info.point.y + (pr.type === 'bomb' ? 0.5 : 0.6);
        m.rotation.y += pr.spin * dt * 4;

        // 壁で反射 / 落下消滅
        if (pr.type === 'greenShell' || pr.type === 'redShell' || pr.type === 'bomb') {
          if (Math.abs(info.lateral) > track.wallHalf) {
            if (track.course.voidRespawn) { remove = true; }
            else {
              const n = info.normal;
              const dot = pr.vel.x * n.x + pr.vel.z * n.z;
              pr.vel.x -= 2 * dot * n.x; pr.vel.z -= 2 * dot * n.z;
              const sgn = info.lateral > 0 ? 1 : -1;
              const over = Math.abs(info.lateral) - track.wallHalf;
              m.position.x -= n.x * sgn * over * 1.2;
              m.position.z -= n.z * sgn * over * 1.2;
              pr.bounces = (pr.bounces || 0) + 1;
              if (pr.type === 'bomb' || pr.bounces > 5) { if (pr.type === 'bomb') this.explodeAt(m.position, 7, pr.owner); remove = true; }
              else MK.audio.bump();
            }
          }
        }

        // カートへの命中
        if (!remove) {
          for (const k of karts) {
            if (k === pr.owner && pr.grace > 0) continue;
            if (!k.isHittable()) continue;
            const d = k.group.position.distanceTo(m.position);
            if (d < C.itemHitRadius + 0.4) {
              if (pr.type === 'bomb') { this.explodeAt(m.position, 7, pr.owner); }
              else { k.spinOut(); this.world.particles.sparkle(m.position.x, m.position.y, m.position.z, pr.type === 'redShell' ? 0xff6a5a : 0x7affa0); MK.audio.hit(); }
              remove = true; break;
            }
          }
        }

        // ボムの起爆（寿命）
        if (!remove && pr.type === 'bomb' && pr.life <= 0) { this.explodeAt(m.position, 7, pr.owner); remove = true; }
        // 演出（ボムのスパーク点滅）
        if (pr.type === 'bomb' && m.userData.spark) m.userData.spark.visible = (performance.now() * 0.02 | 0) % 2 === 0;
        // バナナの浮遊
        if (pr.type === 'banana') { m.position.y = info.point.y + 0.4 + Math.sin(performance.now() * 0.004) * 0.08; m.rotation.y += dt * 0.6; }

        if (pr.life <= 0 && pr.type !== 'bomb') remove = true;

        if (remove) { this.scene.remove(m); this._disposeMesh(m); this.projectiles.splice(i, 1); }
      }
    }

    _findTargetAhead(owner) {
      let best = null, bestDiff = Infinity;
      for (const k of owner.world ? owner.world.karts : this.world.karts) {
        if (k === owner || k.finished) continue;
        let diff = k.progress - owner.progress;
        if (diff <= 0) diff += 0.0; // 先頭なら一番近い前を狙う
        if (diff > 0 && diff < bestDiff) { bestDiff = diff; best = k; }
      }
      if (!best) {
        // 前方がいなければ最近傍
        let bd = Infinity;
        for (const k of this.world.karts) {
          if (k === owner || k.finished) continue;
          const d = k.group.position.distanceTo(owner.group.position);
          if (d < bd) { bd = d; best = k; }
        }
      }
      return best;
    }

    _disposeMesh(m) {
      m.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (Array.isArray(o.material)) o.material.forEach((x) => x.dispose()); else o.material.dispose(); }
      });
    }

    reset() {
      for (const b of this.boxes) this.scene.remove(b.mesh);
      for (const pr of this.projectiles) this.scene.remove(pr.mesh);
      this.boxes = []; this.projectiles = [];
    }
  }

  MK.ItemSystem = ItemSystem;
  MK.buildShell = buildShell;
  MK.buildBanana = buildBanana;

})(window.MK);
