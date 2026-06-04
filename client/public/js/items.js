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
    const g = new THREE.Group();
    const tex = U.questionTexture();
    const mat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, roughness: 0.25, metalness: 0.15,
      emissive: 0x553300, emissiveIntensity: 0.55, opacity: 0.94,
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), mat);
    g.add(box);
    // 明るい縁取り
    const edge = new THREE.Mesh(new THREE.BoxGeometry(2.52, 2.52, 2.52),
      new THREE.MeshBasicMaterial({ color: 0xffe27a, wireframe: true, transparent: true, opacity: 0.5 }));
    g.add(edge);
    // ふわっと光るオーラ
    const auraTex = U.softCircleTexture('rgba(255,232,150,0.9)', 'rgba(255,210,80,0)');
    const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    aura.scale.set(4.4, 4.4, 1); g.add(aura);
    return g;
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

  // トゲゾー甲羅：紫のトゲトゲ甲羅（一位を自動追尾する特別なこうら）
  function buildSpinyShell() {
    const g = new THREE.Group();
    const purple = 0x9b30ff, dark = 0x5e1b9e;
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.82, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
      new THREE.MeshStandardMaterial({ color: purple, roughness: 0.42, metalness: 0.18 }));
    shell.scale.set(1, 0.86, 1); g.add(shell);
    // 甲羅の暗い斑（六角）
    const spotMat = new THREE.MeshStandardMaterial({ color: dark, roughness: 0.5 });
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 6), spotMat); sp.position.set(Math.cos(a) * 0.4, 0.42, Math.sin(a) * 0.4); g.add(sp); }
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.8, 18, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45),
      new THREE.MeshStandardMaterial({ color: 0xfff0d0, roughness: 0.6 }));
    g.add(belly);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.13, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xfff0d0, roughness: 0.6 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; g.add(rim);
    // 大きく目立つ白いトゲ（頂点＋放射状に7本、外向きに傾ける）
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.52, 8), spikeMat); top.position.set(0, 0.66, 0); g.add(top);
    const ring = 7;
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.44, 7), spikeMat);
      sp.position.set(Math.cos(a) * 0.52, 0.34, Math.sin(a) * 0.52);
      sp.rotation.z = -Math.cos(a) * 0.8; sp.rotation.x = Math.sin(a) * 0.8; // 外向きに開く
      g.add(sp);
    }
    // 紫の発光オーラ
    const auraTex = U.softCircleTexture('rgba(190,110,255,0.85)', 'rgba(150,60,255,0)');
    const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    aura.scale.set(3.6, 3.6, 1); g.add(aura);
    return g;
  }

  class ItemSystem {
    constructor(world) {
      this.world = world;
      this.scene = world.scene;
      this.boxes = [];
      this.projectiles = [];
      this.orbiters = [];   // 周回するこうら（トリプルグリーン）
      this.bolts = [];      // 落雷ビジュアル
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
      const def = MK.ITEMS[id];
      if (id === 'triple') { kart.item = 'mushroom'; kart.itemCount = 3; }
      else if (def && def.count) { kart.item = id; kart.itemCount = def.count; }
      else { kart.item = id; kart.itemCount = 1; }
      kart.rouletteTime = 0;
      if (kart.isPlayer) MK.audio.itemGet();
      const gp = kart.group.position;
      if (this.world.particles) this.world.particles.sparkle(gp.x, gp.y + 1.2, gp.z, def ? def.color : 0xffffff);
    }

    /* ---- アイテム使用 ---- */
    useItem(kart) {
      if (!kart.item || kart.item === '__rolling__') return;
      const item = MK.ITEMS[kart.item];
      if (!item) { kart.item = null; return; }
      const gp = kart.group.position;
      const fwd = kart.forward(new THREE.Vector3());

      // トリプルグリーンこうら：1回目で周囲に展開、以降は1発ずつ発射
      if (item.type === 'tripleShell') {
        if (!kart._orbiter) this._activateTripleShell(kart);
        else this._fireOrbitShell(kart, fwd, gp);
        return; // 在庫は内部で管理
      }

      // 発動の演出
      if (this.world.particles && item.type !== 'lightning') this.world.particles.itemPop(gp.x, gp.y + 0.6, gp.z, item.color || 0xffffff);

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
        case 'spiny':
          this._spawnSpiny(kart);
          MK.audio.shellFire();
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
        spin: U.randRange(-3, 3), _si: kart.sampleIndex,
      });
    }
    _spawnBanana(kart, fwd, gp) {
      const mesh = buildBanana();
      mesh.position.set(gp.x - fwd.x * 2.6, gp.y + 0.4, gp.z - fwd.z * 2.6);
      this.scene.add(mesh);
      this.projectiles.push({ type: 'banana', mesh, vel: new THREE.Vector3(), life: 28, owner: kart, grace: 0.7, spin: 0.6, _si: kart.sampleIndex });
    }
    _spawnBomb(kart, fwd, gp) {
      const mesh = buildBomb();
      // 高めの位置から前方へ放り投げる：上向き初速＋重力で弧を描いて遠くへ着弾する
      mesh.position.set(gp.x + fwd.x * 2.6, gp.y + 1.1, gp.z + fwd.z * 2.6);
      this.scene.add(mesh);
      const speed = 50;                       // 前方への投擲速度（速いほど遠くへ）
      this.projectiles.push({
        type: 'bomb', mesh,
        vel: new THREE.Vector3(fwd.x * speed, 0, fwd.z * speed),
        vy: 19, gravity: 40,                  // 上向き初速＋重力＝アーチ軌道
        arc: true,
        life: 4.0, owner: kart, grace: 0.1, spin: 3, _si: kart.sampleIndex,
      });
    }
    /* ---- トゲゾー甲羅（一位を自動追尾する特別なこうら） ---- */
    // コース中央（センターライン）を走り続け、常に現在の一位を狙う。
    // 一位をクラッシュさせるまで消えない（無敵中は隣で待機）。
    _spawnSpiny(kart) {
      const gp = kart.group.position;
      const mesh = buildSpinyShell();
      mesh.position.set(gp.x, gp.y + 1.2, gp.z);
      this.scene.add(mesh);
      this.projectiles.push({
        type: 'spiny', mesh, owner: kart,
        _f: kart.progress * this.world.track.sampleCount, // 弧長（サンプル単位・周回考慮）
        speed: 85, grace: 0.4, age: 0, _si: kart.sampleIndex,
      });
    }

    // 戻り値 true で除去。位置・追尾・起爆をすべてここで処理する。
    _updateSpiny(pr, dt) {
      const track = this.world.track;
      const karts = this.world.karts;
      const N = track.sampleCount;
      pr.age += dt;
      pr.grace = Math.max(0, pr.grace - dt);
      // 現在の一位（オーナー自身と未ゴール者を除く＝先頭の標的）
      let leader = null, best = -Infinity;
      for (const k of karts) {
        if (k === pr.owner || k.finished) continue;
        if (k.progress > best) { best = k.progress; leader = k; }
      }
      if (!leader) return true; // 標的がいない → 消滅
      const spacing = track.length / N;
      pr._f += (pr.speed * dt) / spacing;             // センターラインを前進
      const leaderAbs = leader.progress * N;          // 一位の弧長位置
      if (pr.grace <= 0 && pr._f >= leaderAbs) {       // 一位に追いついた
        if (leader.isHittable()) { this._detonateSpiny(leader); return true; }
        pr._f = leaderAbs;                             // 無敵中はクラッシュさせるまで隣で待機
      }
      // センターライン上の補間位置に配置（コースの真ん中）
      const fi = ((pr._f % N) + N) % N;
      const i0 = Math.floor(fi) % N, i1 = (i0 + 1) % N, t = fi - Math.floor(fi);
      const p0 = track.samples[i0].point, p1 = track.samples[i1].point;
      const m = pr.mesh;
      m.position.set(U.lerp(p0.x, p1.x, t), U.lerp(p0.y, p1.y, t) + 0.8 + Math.sin(pr.age * 8) * 0.15, U.lerp(p0.z, p1.z, t));
      m.rotation.y += dt * 7;
      pr._si = i0;
      // 道中で偶然ぶつかった「一位以外」のカートもクラッシュさせる（甲羅は消費されず走り続ける）。
      // 被弾直後は isHittable()=false（launch の無敵）になるので同じカートを連打しない。
      if (pr.grace <= 0) {
        const hitR2 = (C.itemHitRadius + 1.2) * (C.itemHitRadius + 1.2);
        for (const k of karts) {
          if (k === pr.owner || k === leader || !k.isHittable()) continue;
          const dx = k.group.position.x - m.position.x, dz = k.group.position.z - m.position.z;
          if (dx * dx + dz * dz < hitR2) {
            k.launch();
            if (this.world.particles) this.world.particles.sparkle(k.group.position.x, k.group.position.y + 0.5, k.group.position.z, 0xb060ff);
            MK.audio.hit();
          }
        }
      }
      if (this.world.particles && Math.random() < 0.7) this.world.particles.shellTrail(m.position.x, m.position.y, m.position.z, 0xb060ff);
      if (pr.age > 60) return true; // 安全装置（万一追いつけない場合）
      return false;
    }

    _detonateSpiny(leader) {
      const pos = leader.group.position;
      if (this.world.particles) {
        this.world.particles.explosion(pos.x, pos.y, pos.z, 0xb060ff, 1.4);
        this.world.particles.shockwave(pos.x, pos.y + 0.5, pos.z, 0xd0a0ff, 1.4);
      }
      MK.audio.explosion();
      if (this.world.shake) this.world.shake(1.0);
      if (leader.isHittable()) leader.launch();              // 一位を確実にクラッシュ
      for (const k of this.world.karts) {                    // 近くのカートも巻き込む
        if (k === leader) continue;
        if (k.isHittable() && k.group.position.distanceTo(pos) < 6) k.launch();
      }
    }

    _castLightning(owner) {
      for (const k of this.world.karts) {
        if (k === owner) continue;
        if (k.squish()) {
          if (k._orbiter) this._removeOrbiter(k._orbiter); // 縮むとこうらは落ちる
          this._spawnBolt(k.group.position);
        }
      }
      if (this.world.onLightning) this.world.onLightning(owner);
      MK.audio.thunder();
    }

    explodeAt(pos, radius, owner) {
      const R = radius * 1.5;          // 爆発の当たり判定を 1.5 倍に拡大
      const vis = R / 7;               // 半径に応じて爆風の見た目もスケール
      this.world.particles.explosion(pos.x, pos.y, pos.z, 0xffd24a, vis);
      this.world.particles.shockwave(pos.x, pos.y + 0.5, pos.z, 0xffc090, vis);
      MK.audio.explosion();
      if (this.world.shake) this.world.shake(0.9);
      for (const k of this.world.karts) {
        if (k === owner) continue;     // 自分が投げたボムでは自爆しない（他カートのみに影響）
        const d = k.group.position.distanceTo(pos);
        if (d < R && k.isHittable()) k.launch();
      }
    }

    /* ---- トリプルグリーンこうら（周回シールド） ---- */
    _activateTripleShell(kart) {
      const orb = { owner: kart, shells: [], spin: Math.random() * U.TAU };
      const n = Math.max(1, kart.itemCount || 3);
      for (let i = 0; i < n; i++) {
        const mesh = buildShell(0x2fae4a, 0xffffff);
        mesh.scale.setScalar(0.82);
        this.scene.add(mesh);
        orb.shells.push({ mesh, dead: false });
      }
      kart._orbiter = orb;
      this.orbiters.push(orb);
      MK.audio.shield();
      const gp = kart.group.position;
      if (this.world.particles) this.world.particles.itemPop(gp.x, gp.y + 0.6, gp.z, 0x2fae4a);
    }

    _fireOrbitShell(kart, fwd, gp) {
      const orb = kart._orbiter;
      if (!orb || orb.shells.length === 0) return;
      const sh = orb.shells.shift();
      this.scene.remove(sh.mesh); this._disposeMesh(sh.mesh);
      const mesh = buildShell(0x2fae4a, 0xffffff);
      mesh.position.set(gp.x + fwd.x * 2.4, gp.y + 0.6, gp.z + fwd.z * 2.4);
      this.scene.add(mesh);
      this.projectiles.push({
        type: 'greenShell', mesh, vel: new THREE.Vector3(fwd.x * 54, 0, fwd.z * 54),
        life: 7, owner: kart, grace: 0.15, bounces: 0, spin: U.randRange(-3, 3), _si: kart.sampleIndex,
      });
      MK.audio.shellFire();
      kart.itemCount = orb.shells.length;
      if (orb.shells.length === 0) this._removeOrbiter(orb);
    }

    _breakOneShell(kart) {
      const orb = kart._orbiter;
      if (!orb || orb.shells.length === 0) return false;
      const sh = orb.shells.pop();
      const p = sh.mesh.position;
      if (this.world.particles) this.world.particles.burst(p.x, p.y, p.z, 0x7affa0, 8, 6);
      this.scene.remove(sh.mesh); this._disposeMesh(sh.mesh);
      kart.itemCount = orb.shells.length;
      if (orb.shells.length === 0) this._removeOrbiter(orb);
      return true;
    }

    _removeOrbiter(orb) {
      for (const sh of orb.shells) { this.scene.remove(sh.mesh); this._disposeMesh(sh.mesh); }
      orb.shells.length = 0;
      const i = this.orbiters.indexOf(orb);
      if (i >= 0) this.orbiters.splice(i, 1);
      if (orb.owner) {
        orb.owner._orbiter = null;
        if (orb.owner.itemCount <= 0 && orb.owner.item === 'tripleGreen') { orb.owner.item = null; orb.owner.itemCount = 0; }
      }
    }

    _updateOrbiters(dt) {
      const R = 2.9;
      for (let oi = this.orbiters.length - 1; oi >= 0; oi--) {
        const orb = this.orbiters[oi];
        const owner = orb.owner;
        // オーナーが脱落・被弾・縮小・スター中はシールド解除
        if (!owner || owner._orbiter !== orb || owner.finished || owner.falling ||
            owner.respawnTimer > 0 || owner.spinTimer > 0 || owner.squishTimer > 0) {
          this._removeOrbiter(orb); continue;
        }
        orb.spin += dt * 3.2;
        const gp = owner.group.position, m = orb.shells.length;
        // 配置＋体当たり：当てた甲羅は消費（dead 印）
        for (let i = 0; i < orb.shells.length; i++) {
          const sh = orb.shells[i];
          const a = orb.spin + (i / m) * U.TAU;
          sh.mesh.position.set(gp.x + Math.cos(a) * R, gp.y + 0.5, gp.z + Math.sin(a) * R);
          sh.mesh.rotation.y += dt * 9;
          if (sh.dead) continue;
          for (const k of this.world.karts) {
            if (k === owner || !k.isHittable()) continue;
            if (k.group.position.distanceTo(sh.mesh.position) < C.kartRadius + 0.6) {
              if (k._orbiter) this._breakOneShell(k); else k.spinOut();
              if (this.world.particles) this.world.particles.sparkle(k.group.position.x, k.group.position.y + 0.5, k.group.position.z, 0x7affa0);
              MK.audio.hit(); sh.dead = true; break; // 体当たりで1つ消費
            }
          }
        }
        // 飛んでくるアイテムを打ち消す：1ブロックにつき甲羅1つ消費
        const shieldR = R + 1.0;
        for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
          if (!orb.shells.some((s) => !s.dead)) break; // 残弾なし＝防げない
          const pr = this.projectiles[pi];
          if (pr.owner === owner) continue;
          if (pr.type === 'spiny') continue; // トゲゾー甲羅はシールドで防げない（一位を必ず狙う）
          if (pr.mesh.position.distanceTo(gp) < shieldR) {
            if (this.world.particles) this.world.particles.burst(pr.mesh.position.x, pr.mesh.position.y, pr.mesh.position.z, 0x7affa0, 8, 6);
            if (pr.type === 'bomb') this.explodeAt(pr.mesh.position, 5, pr.owner);
            this.scene.remove(pr.mesh); this._disposeMesh(pr.mesh); this.projectiles.splice(pi, 1);
            MK.audio.bump();
            const live = orb.shells.find((s) => !s.dead); if (live) live.dead = true; // 打ち消しで1つ消費
          }
        }
        // 消費した甲羅を取り除き、在庫を更新
        let changed = false;
        for (let i = orb.shells.length - 1; i >= 0; i--) {
          if (orb.shells[i].dead) {
            const sh = orb.shells[i];
            this.scene.remove(sh.mesh); this._disposeMesh(sh.mesh);
            orb.shells.splice(i, 1); changed = true;
          }
        }
        if (changed) {
          owner.itemCount = orb.shells.length;
          if (orb.shells.length === 0) this._removeOrbiter(orb);
        }
      }
    }

    /* ---- 落雷ビジュアル ---- */
    _spawnBolt(target) {
      const topY = target.y + 42, segs = 7, pts = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const jit = (i === 0 || i === segs) ? 0 : (1 - t) * 3.0;
        pts.push(new THREE.Vector3(target.x + U.randRange(-jit, jit), U.lerp(topY, target.y + 0.5, t), target.z + U.randRange(-jit, jit)));
      }
      const g = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0xe6d4ff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], len = a.distanceTo(b);
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, len, 5), mat);
        seg.position.copy(a).add(b).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(b, a).normalize();
        seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        g.add(seg);
      }
      this.scene.add(g);
      this.bolts.push({ group: g, mat, life: 0.42, max: 0.42 });
      if (this.world.particles) this.world.particles.boltFlash(target.x, target.y + 0.5, target.z);
    }

    _updateBolts(dt) {
      for (let i = this.bolts.length - 1; i >= 0; i--) {
        const bl = this.bolts[i];
        bl.life -= dt;
        bl.mat.opacity = Math.max(0, bl.life / bl.max) * (0.5 + Math.random() * 0.5);
        if (bl.life <= 0) {
          this.scene.remove(bl.group);
          bl.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
          bl.mat.dispose();
          this.bolts.splice(i, 1);
        }
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
            // 水平距離で判定（ボックスは宙に浮いて上下動するので、Yを含めると端を掠めた時に取り損ねる）
            const bdx = k.group.position.x - b.mesh.position.x;
            const bdz = k.group.position.z - b.mesh.position.z;
            if (bdx * bdx + bdz * bdz < 2.9 * 2.9 && Math.abs(k.group.position.y - b.mesh.position.y) < 3.2) {
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

      // 周回こうら・落雷の更新
      this._updateOrbiters(dt);
      this._updateBolts(dt);

      // 弾の更新
      const track = this.world.track;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        // トゲゾー甲羅はセンターライン追尾の特別処理（通常の速度/壁/命中ロジックは通さない）
        if (pr.type === 'spiny') {
          if (this._updateSpiny(pr, dt)) { this.scene.remove(pr.mesh); this._disposeMesh(pr.mesh); this.projectiles.splice(i, 1); }
          continue;
        }
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
        // 路面追従 / ボムの弧
        let info;
        if (pr.type === 'bomb' && pr.arc) {
          // 弾道：上昇→落下。地面に着いた瞬間に起爆する（壁は飛び越える）
          pr.vy -= pr.gravity * dt;
          m.position.y += pr.vy * dt;
          info = track.project(m.position, pr._si); pr._si = info.index;
          m.rotation.x += pr.spin * dt * 2.5; m.rotation.y += pr.spin * dt * 1.5;
          const groundY = info.point.y + 0.5;
          if (pr.vy <= 0 && m.position.y <= groundY) {
            m.position.y = groundY;
            this.explodeAt(m.position, 7, pr.owner);
            remove = true;
          }
        } else {
          info = track.project(m.position, pr._si); pr._si = info.index;
          m.position.y = info.point.y + (pr.type === 'bomb' ? 0.5 : 0.6);
          m.rotation.y += pr.spin * dt * 4;
        }
        if ((pr.type === 'greenShell' || pr.type === 'redShell') && this.world.particles && Math.random() < 0.5) {
          this.world.particles.shellTrail(m.position.x, m.position.y, m.position.z, pr.type === 'redShell' ? 0xff8a7a : 0x7affa0);
        }

        // 壁で反射 / 落下消滅（空中を飛ぶ弧ボムは壁を越えるので除外）
        if (!remove && (pr.type === 'greenShell' || pr.type === 'redShell' || (pr.type === 'bomb' && !pr.arc))) {
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
            if (k === pr.owner) {
              // ボムは投げ主には決して当たらない（自爆しない）。他の弾は短いグレース後に当たる
              if (pr.type === 'bomb' || pr.grace > 0) continue;
            }
            if (!k.isHittable()) continue;
            const d = k.group.position.distanceTo(m.position);
            if (d < C.itemHitRadius + 0.4) {
              if (k._orbiter && k._orbiter.shells.length > 0) { // こうらシールドで1つ消費して防御
                this._breakOneShell(k);
                MK.audio.bump(); remove = true; break;
              }
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

    _disposeMesh(m) { U.disposeObject(m); }

    reset() {
      for (const b of this.boxes) { this.scene.remove(b.mesh); this._disposeMesh(b.mesh); }
      for (const pr of this.projectiles) { this.scene.remove(pr.mesh); this._disposeMesh(pr.mesh); }
      for (const orb of this.orbiters) {
        for (const sh of orb.shells) { this.scene.remove(sh.mesh); this._disposeMesh(sh.mesh); }
        if (orb.owner) orb.owner._orbiter = null;
      }
      for (const bl of this.bolts) {
        this.scene.remove(bl.group);
        bl.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
        if (bl.mat && bl.mat.dispose) bl.mat.dispose();
      }
      this.boxes = []; this.projectiles = []; this.orbiters = []; this.bolts = [];
    }
  }

  MK.ItemSystem = ItemSystem;
  MK.buildShell = buildShell;
  MK.buildBanana = buildBanana;
  MK.buildSpinyShell = buildSpinyShell;

})(window.MK);
