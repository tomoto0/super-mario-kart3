/* ============================================================================
 *  kart.js — カート（物理 + 見た目）。プレイヤー / AI 共通。
 *  前方 = -Z。group.rotation.y = yaw。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;
  const C = MK.CONFIG;

  /* ---- カートのシャシー造形（親しみやすいゴーカート風）---- */
  // letter を渡すとボンネットのナンバー丸にキャライニシャルが入る
  function buildChassis(color, accent, letter) {
    accent = accent != null ? accent : 0xffffff;
    const g = new THREE.Group();
    // スムーズシェーディング（コンセプトアートのなめらかなカートに合わせる）
    const M = (col, o) => new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.4, metalness: 0.28 }, o || {}));
    const dark = 0x2a2d34, chrome = 0xc8ccd4;

    // 黒い下回り（シャシー）
    const under = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 2.7), M(dark, { metalness: 0.2, roughness: 0.6 }));
    under.position.y = 0.3; g.add(under);
    // 丸みのある本体タブ
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.1), M(color));
    body.position.y = 0.6; g.add(body);
    // 丸い肩（左右のふくらみ）
    for (const s of [-1, 1]) {
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.0, 20), M(color));
      sh.rotation.x = Math.PI / 2; sh.position.set(s * 0.76, 0.62, 0.0); g.add(sh);
    }
    // 前方の丸いカウル（ボンネット）
    const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.78, 26, 18, 0, Math.PI * 2, 0, Math.PI / 2), M(color));
    cowl.scale.set(1.05, 0.72, 1.15); cowl.position.set(0, 0.58, -0.85); g.add(cowl);
    // 丸いノーズ先端
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.6, 22, 16), M(color));
    nose.scale.set(1.2, 0.6, 0.95); nose.position.set(0, 0.5, -1.4); g.add(nose);
    // フロントリップ（アクセント）
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 10), M(accent, { metalness: 0.45 }));
    lip.rotation.z = Math.PI / 2; lip.position.set(0, 0.33, -1.5); g.add(lip);
    // ヘッドライト
    for (const s of [-1, 1]) {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), M(0xfff6c0, { emissive: 0xffe49a, emissiveIntensity: 0.55 }));
      hl.scale.set(1, 0.85, 0.6); hl.position.set(s * 0.4, 0.6, -1.52); g.add(hl);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 14), M(chrome, { metalness: 0.8, roughness: 0.25 }));
      ring.position.set(s * 0.4, 0.6, -1.5); g.add(ring);
    }
    // フロントグリル（暗いスリット＋クロムのバー）
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.1), M(0x15171b));
    grille.position.set(0, 0.42, -1.45); g.add(grille);
    for (let i = -1; i <= 1; i++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.12), M(chrome, { metalness: 0.7, roughness: 0.3 })); bar.position.set(i * 0.2, 0.42, -1.47); g.add(bar); }
    // ボンネットのナンバー丸（キャラのイニシャル入り）
    const roundel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 18), M(0xffffff, { roughness: 0.4 }));
    roundel.rotation.x = -Math.PI / 2 + 0.08; roundel.position.set(0, 0.78, -0.72); g.add(roundel);
    const rring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 8, 20), M(accent, { metalness: 0.4 }));
    rring.rotation.x = -Math.PI / 2 + 0.08; rring.position.set(0, 0.79, -0.72); g.add(rring);
    if (letter) {
      const ltex = MK.U.makeCanvasTexture(128, (ctx, s) => {
        ctx.clearRect(0, 0, s, s);
        ctx.fillStyle = '#1f2330'; ctx.font = '900 92px "Trebuchet MS", Arial, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(letter, s / 2, s / 2 + 4);
      });
      const lmesh = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20),
        new THREE.MeshBasicMaterial({ map: ltex, transparent: true }));
      lmesh.rotation.x = -Math.PI / 2 + 0.08; lmesh.position.set(0, 0.815, -0.72);
      g.add(lmesh);
    }
    // コックピットの縁（アクセント）
    const cockpit = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 10, 22), M(accent, { metalness: 0.4 }));
    cockpit.rotation.x = -Math.PI / 2; cockpit.scale.set(1.0, 1.25, 1); cockpit.position.set(0, 0.85, 0.3); g.add(cockpit);
    // 座席
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.2, 0.78), M(0x33363d));
    seat.position.set(0, 0.74, 0.42); g.add(seat);
    const seatback = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.58, 0.2), M(0x33363d));
    seatback.position.set(0, 1.0, 0.8); g.add(seatback);
    // ロールフープ
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 16, Math.PI), M(chrome, { metalness: 0.7, roughness: 0.3 }));
    hoop.position.set(0, 1.08, 0.86); g.add(hoop);
    // ステアリング（ドライバーが両手で握る位置・スポーク付き・操舵で回る）
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 8), M(0x202327));
    column.position.set(0, 0.86, -0.54); column.rotation.x = 1.0; g.add(column);
    const wheelPivot = new THREE.Group();
    wheelPivot.position.set(0, 1.06, -0.42); wheelPivot.rotation.x = 1.22; g.add(wheelPivot);
    const wheelSpin = new THREE.Group(); wheelPivot.add(wheelSpin);
    const rimW = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 10, 22), M(0x202327, { roughness: 0.55 }));
    wheelSpin.add(rimW);
    for (let i = 0; i < 3; i++) {
      const a = i * (Math.PI * 2 / 3) + Math.PI / 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.035), M(0x33363d));
      spoke.rotation.z = a - Math.PI / 2;
      spoke.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0);
      wheelSpin.add(spoke);
    }
    const hubBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 12), M(accent, { metalness: 0.4 }));
    hubBtn.rotation.x = Math.PI / 2; wheelSpin.add(hubBtn);
    g.userData.steerWheel = wheelSpin;
    // 背後に立ち上がるツインマフラー（クロム）— マリオカートらしさ
    for (const s of [-1, 1]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.7, 10), M(chrome, { metalness: 0.8, roughness: 0.25 }));
      pipe.position.set(s * 0.42, 0.82, 1.24); pipe.rotation.x = -0.35; g.add(pipe);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.16, 10), M(0x33363d));
      tip.position.set(s * 0.46, 1.12, 1.31); tip.rotation.x = -0.35; g.add(tip);
      const tipGlow = new THREE.Mesh(new THREE.CircleGeometry(0.09, 10), new THREE.MeshBasicMaterial({ color: 0xff8a3a }));
      tipGlow.position.set(s * 0.47, 1.17, 1.35); tipGlow.rotation.x = Math.PI - 0.35; g.add(tipGlow);
    }
    // リアバンパー（アクセント）
    const rear = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.3), M(accent, { metalness: 0.4 }));
    rear.position.set(0, 0.5, 1.3); g.add(rear);
    // サイドのアクセントライン
    for (const s of [-1, 1]) { const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 1.5), M(accent, { metalness: 0.4 })); stripe.position.set(s * 0.79, 0.66, 0.0); g.add(stripe); }
    // リアのナンバープレート（白丸＋アクセント縁）
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16), M(0xffffff, { roughness: 0.5 }));
    plate.rotation.x = Math.PI / 2; plate.position.set(0, 0.66, 1.46); g.add(plate);
    const plateRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 18), M(accent, { metalness: 0.4 }));
    plateRing.rotation.x = Math.PI / 2; plateRing.position.set(0, 0.66, 1.47); g.add(plateRing);

    // ホイール（太いカートタイヤ＋アクセントのホイールキャップ）
    const wheels = [], steerPivots = [];
    const tireMat = M(0x16181c, { metalness: 0.05, roughness: 0.9 });
    const hubMat = M(0xeef0f4, { metalness: 0.7, roughness: 0.25 });
    const capMat = M(accent, { metalness: 0.5, roughness: 0.35 });
    const wallMat = M(0xf2f2f2, { roughness: 0.55, metalness: 0.05 });
    function makeWheel(big) {
      const wg = new THREE.Group();
      const r = big ? 0.5 : 0.42, w = big ? 0.42 : 0.36;
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 24), tireMat);
      tire.rotation.z = Math.PI / 2; wg.add(tire);
      // 外周を膨らませて極太タイヤに
      const tread = new THREE.Mesh(new THREE.TorusGeometry(r, w * 0.5, 12, 28), tireMat);
      tread.rotation.y = Math.PI / 2; wg.add(tread);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, w + 0.02, 18), hubMat);
      hub.rotation.z = Math.PI / 2; wg.add(hub);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.26, r * 0.26, w + 0.04, 14), capMat);
      cap.rotation.z = Math.PI / 2; wg.add(cap);
      // 白いサイドウォールリング（両面）— マリオカートらしいタイヤの顔
      for (const s of [-1, 1]) {
        const wall = new THREE.Mesh(new THREE.TorusGeometry(r * 0.7, 0.024, 6, 20), wallMat);
        wall.rotation.y = Math.PI / 2;
        wall.position.x = s * (w * 0.5 + 0.012);
        wg.add(wall);
      }
      return wg;
    }
    const positions = [
      [-0.92, 0.46, -1.02, false], [0.92, 0.46, -1.02, false], // 前
      [-0.98, 0.5, 1.08, true], [0.98, 0.5, 1.08, true],        // 後（大）
    ];
    positions.forEach((p, i) => {
      const w = makeWheel(p[3]);
      if (i < 2) {
        const piv = new THREE.Group();
        piv.position.set(p[0], p[1], p[2]);
        piv.add(w);
        g.add(piv);
        steerPivots.push(piv);
      } else {
        w.position.set(p[0], p[1], p[2]);
        g.add(w);
      }
      wheels.push(w);
    });

    g.userData.wheels = wheels;
    g.userData.steerPivots = steerPivots;
    return g;
  }

  class Kart {
    constructor(opts) {
      this.index = opts.index;
      this.character = opts.character;
      this.isPlayer = !!opts.isPlayer;
      this.scene = opts.scene;
      this.world = opts.world;       // Game への参照（particles/audio/items/track）
      this.track = opts.track;
      this.derived = MK.deriveStats(this.character);
      this.color = this.character.colors.kart;

      // 物理状態
      this.yaw = 0;
      this.speed = 0;
      this.boostTimer = 0;
      this.boostPower = 0;
      this.bumpVel = new THREE.Vector3();   // 体当たりの横ノックバック（_resolveCollisions が加算）

      // ドリフト
      this.drifting = false;
      this.driftDir = 0;
      this.driftCharge = 0;
      this.driftReady = 0;       // 点火可能なミニターボのレベル(0-3)
      this.hop = 0; this.hopVel = 0;
      this._driftHeld = false;

      // 被弾状態
      this.spinTimer = 0;
      this.spinAngle = 0;
      this.squishTimer = 0;
      this.starTimer = 0;
      this.invulnTimer = 0;
      this.falling = false;
      this.respawnTimer = 0;
      this._wallContact = false;

      // レース進行
      this.lap = 0;
      this.sampleIndex = 0;
      this.progress = 0;
      this.lateral = 0;
      this.lastFraction = 0;
      this.passedHalf = false;
      this.finished = false;
      this.finishTime = 0;
      this.place = opts.index + 1;
      this.wrongWay = false;

      // 入力
      this.controls = { throttle: 0, brake: 0, steer: 0, drift: false, reverseHeld: false };
      this.useItemPressed = false;

      // アイテム
      this.item = null;
      this.itemCount = 0;
      this.rouletteTime = 0;
      this._orbiter = null;      // トリプルグリーンこうらの周回シールド（ItemSystem が管理）
      this.goldenTimer = 0;      // ゴールデンキノコの残り時間（>0 の間は連打でブースト）
      this.inkTimer = 0;         // ゲッソーの墨（プレイヤーのみ：視界＋ハンドルが揺れる）

      // ブーストパッド / スリップストリーム
      this._padCD = 0;
      this.draftT = 0;           // 追走の蓄積時間（負はクールダウン）

      this._build();
    }

    _build() {
      const g = new THREE.Group();
      this.group = g;

      // ブロブ影
      const shTex = U.softCircleTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)');
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20),
        new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, opacity: 0.6 }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.03;
      g.add(shadow);
      this.shadow = shadow;

      // 傾き用グループ（ドリフトロール・ホップ）
      const tilt = new THREE.Group();
      g.add(tilt);
      this.tilt = tilt;

      const chassis = buildChassis(this.color, this.character.colors.secondary, (this.character.name || '?')[0]);
      // 体格でカートの大きさを変える（軽量級は小ぶり、重量級はワイド）
      this._sizeScale = 0.92 + (this.character.stats.weight - 1) * 0.045;
      chassis.scale.setScalar(this._sizeScale);
      tilt.add(chassis);
      this.chassis = chassis;
      this.wheels = chassis.userData.wheels;
      this.steerPivots = chassis.userData.steerPivots;

      // ドライバー
      const driver = MK.Characters.build(this.character.id, this.character.colors);
      driver.position.set(0, 0.7, 0.35);
      chassis.add(driver);
      this.driver = driver;

      // スター用のオーラ
      const auraTex = U.softCircleTexture('rgba(255,240,120,0.8)', 'rgba(255,240,120,0)');
      const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
      aura.scale.set(5, 5, 1); aura.position.y = 1.2;
      g.add(aura);
      this.aura = aura;

      // スター無敵中の虹リング
      const starRing = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.18, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      starRing.rotation.x = Math.PI / 2; starRing.position.y = 0.5; starRing.visible = false;
      g.add(starRing);
      this.starRing = starRing;

      this.scene.add(g);
      this._wheelSpin = 0;
    }

    forward(out) {
      out = out || new THREE.Vector3();
      return out.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    }

    setControls(c) { this.controls = c; }

    /* ---- 被弾 / 効果 ---- */
    spinOut() {
      if (!this.isHittable()) return false;
      this.spinTimer = C.spinOutTime;
      this.drifting = false; this.driftCharge = 0; this.driftReady = 0;
      this.boostTimer = 0; this.boostPower = 0;
      this.speed *= 0.25;
      this.invulnTimer = C.spinOutTime + 0.6;
      if (this.isPlayer) MK.audio.spinOut();
      return true;
    }
    squish() {
      if (!this.isHittable()) return false;
      this.squishTimer = C.squishTime;
      this.boostTimer = 0; this.boostPower = 0;
      this.speed *= 0.5;
      if (this.isPlayer) MK.audio.spinOut();
      return true;
    }
    launch() {
      // 爆発などの吹っ飛び（強いスピン）
      if (!this.isHittable()) return false;
      this.spinTimer = C.spinOutTime * 1.3;
      this.hopVel = 7;
      this.drifting = false; this.driftCharge = 0;
      this.boostTimer = 0; this.boostPower = 0;
      this.speed *= 0.15;
      this.invulnTimer = C.spinOutTime * 1.3 + 0.6;
      if (this.isPlayer) MK.audio.spinOut();
      return true;
    }
    giveStar() {
      this.starTimer = C.starTime;
      this.applyBoost(C.starSpeedBoost, 0.6);
      if (this.isPlayer) MK.audio.starGet();
      const gp = this.group.position;
      if (this.world.particles) this.world.particles.starBurst(gp.x, gp.y + 0.6, gp.z);
    }
    applyBoost(power, duration) {
      this.boostPower = Math.max(this.boostPower, power);
      this.boostTimer = Math.max(this.boostTimer, duration);
      this.speed = Math.max(this.speed, this.derived.maxSpeed * 0.8);
      this.spinTimer = 0; // ブーストで復帰
    }
    isHittable() {
      return this.starTimer <= 0 && this.invulnTimer <= 0 && !this.finished && !this.falling && this.respawnTimer <= 0;
    }
    hasStar() { return this.starTimer > 0; }

    respawn(point, yaw) {
      this.group.position.set(point.x, point.y + 8, point.z);
      this.yaw = yaw;
      this.speed = 0;
      this.falling = false;
      this.respawnTimer = 0.9;
      this.invulnTimer = 2.0;
      this.boostTimer = 0; this.boostPower = 0;
      this.drifting = false; this.driftCharge = 0;
    }

    /* ---- メイン更新 ---- */
    update(dt, raceTime) {
      const track = this.track;
      const d = this.derived;

      // タイマー減衰
      this.spinTimer = Math.max(0, this.spinTimer - dt);
      this.squishTimer = Math.max(0, this.squishTimer - dt);
      this.starTimer = Math.max(0, this.starTimer - dt);
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
      this.boostTimer = Math.max(0, this.boostTimer - dt);
      this.inkTimer = Math.max(0, this.inkTimer - dt);
      if (this.boostTimer <= 0) this.boostPower = U.damp(this.boostPower, 0, 8, dt);

      // 復帰演出中
      if (this.respawnTimer > 0) {
        this.respawnTimer -= dt;
        const gp = this.group.position;
        gp.y = U.damp(gp.y, 0, 10, dt);
        this._updateVisual(dt, true);
        return;
      }

      // 落下中
      if (this.falling) {
        this.hopVel -= 30 * dt;
        this.group.position.y += this.hopVel * dt;
        this.spinAngle += dt * 6;
        if (this.group.position.y < -25) {
          const info = track.project(this.group.position); // 復帰位置は全探索で再取得
          this.sampleIndex = info.index;                   // 以降のヒント探索を正しく種付け
          this.respawn(info.point, Math.atan2(-info.tangent.x, -info.tangent.z));
        }
        this._updateVisual(dt, true);
        return;
      }

      // 路面情報（前フレームの近傍だけ探索＝高速）
      const info = track.project(this.group.position, this.sampleIndex);
      this.sampleIndex = info.index;
      this.lateral = info.lateral;
      const absLat = Math.abs(info.lateral);
      const onRoad = absLat <= track.roadHalf;
      const offRoad = absLat > track.roadHalf && absLat <= track.wallHalf + 2;
      // 壁に沿って滑っている間はオフロード減速を免除（ぶつかっても失速しない）
      const offSlow = offRoad && !this._wallContact;

      const spinning = this.spinTimer > 0;

      // 最高速の決定
      let maxV = d.maxSpeed;
      if (offSlow) maxV *= C.offRoadMaxFactor;
      if (this.squishTimer > 0) maxV *= C.squishSpeedFactor;
      if (this.starTimer > 0) maxV += C.starSpeedBoost;
      const boosting = this.boostTimer > 0;
      if (boosting) maxV += this.boostPower;

      const ctrl = this.controls;

      /* --- 加速 / 減速 --- */
      if (spinning) {
        this.speed = U.damp(this.speed, 0, 3.5, dt);
      } else {
        const accel = d.accel * (boosting ? 1.6 : 1);
        if (this.speed > maxV) {
          this.speed = Math.max(maxV, this.speed - C.boostDecay * dt);
        } else if (ctrl.reverseHeld || (ctrl.brake && this.speed <= 0.5)) {
          this.speed = Math.max(-C.reverseMaxSpeed, this.speed - C.brakeDecel * 0.5 * dt);
        } else if (ctrl.throttle > 0) {
          this.speed = Math.min(maxV, this.speed + accel * dt);
        } else if (ctrl.brake > 0) {
          this.speed = Math.max(0, this.speed - C.brakeDecel * dt);
        } else {
          // 自然減速
          this.speed = U.damp(this.speed, 0, C.coastDecel / Math.max(8, Math.abs(this.speed) + 8), dt);
          if (Math.abs(this.speed) < 0.05) this.speed = 0;
        }
        if (offSlow) this.speed = Math.max(0, this.speed - C.offRoadDrag * dt);
      }

      /* --- ドリフト処理 --- */
      this._updateDrift(dt, ctrl, spinning, onRoad);

      /* --- 旋回 --- */
      if (!spinning && Math.abs(this.speed) > 0.4) {
        let turn = d.turnRate;
        let steerEff = ctrl.steer;
        if (this.drifting) {
          turn *= C.driftTurnBoost;
          steerEff = U.clamp(this.driftDir * 0.6 + ctrl.steer * 0.55, -1.4, 1.4);
        }
        // 墨を浴びている間はハンドルがふらつく
        if (this.inkTimer > 0) steerEff += Math.sin(performance.now() * 0.007) * 0.16;
        const speedFactor = U.clamp(Math.abs(this.speed) / 9, 0, 1);
        const dir = this.speed >= 0 ? 1 : -1;
        this.yaw += -steerEff * turn * speedFactor * dir * dt;
      }

      /* --- 移動 --- */
      const fwd = this.forward(U.tmpV1);
      const gp = this.group.position;
      gp.x += fwd.x * this.speed * dt;
      gp.z += fwd.z * this.speed * dt;
      gp.y = U.damp(gp.y, info.point.y, 12, dt);

      // 体当たりの弾き（横ノックバック）を加算して減衰
      if (this.bumpVel.x !== 0 || this.bumpVel.z !== 0) {
        gp.x += this.bumpVel.x * dt;
        gp.z += this.bumpVel.z * dt;
        this.bumpVel.x = U.damp(this.bumpVel.x, 0, 5.5, dt);
        this.bumpVel.z = U.damp(this.bumpVel.z, 0, 5.5, dt);
        if (Math.abs(this.bumpVel.x) < 0.05 && Math.abs(this.bumpVel.z) < 0.05) { this.bumpVel.x = 0; this.bumpVel.z = 0; }
      }

      /* --- 壁 / 落下 判定 --- */
      const after = track.project(gp, this.sampleIndex);
      this.lateral = after.lateral;
      const absL = Math.abs(after.lateral);
      if (absL > track.wallHalf) {
        if (track.course.voidRespawn) {
          if (!this.falling) { this.falling = true; this.hopVel = 1.5; if (this.isPlayer) MK.audio.bump(); }
        } else {
          // 壁：めり込みを戻し、弾力を保って壁沿いに滑らせる（失速・スタックを防ぐ）
          const over = absL - track.wallHalf;
          const sgn = after.lateral > 0 ? 1 : -1;
          const n = after.normal;
          // 内側へ少し余裕をつけて押し戻す（再衝突を防ぐ）
          gp.x -= n.x * sgn * (over + 0.08);
          gp.z -= n.z * sgn * (over + 0.08);
          // 壁へ向かう進行成分を取り除き、壁沿い方向へ向き直す（沿って滑る）
          const ox = n.x * sgn, oz = n.z * sgn;        // 壁の外向き法線
          const into = fwd.x * ox + fwd.z * oz;        // >0 で壁へ突っ込んでいる
          if (into > 0) {
            const sx = fwd.x - into * ox, sz = fwd.z - into * oz; // 壁に平行な成分
            const len = Math.hypot(sx, sz);
            if (len > 0.0001) this.yaw = U.dampAngle(this.yaw, Math.atan2(-sx / len, -sz / len), 14, dt);
          }
          // 接触した「瞬間」だけわずかに減速。沿って滑る間は失速させない。
          if (!this._wallContact) { this.speed *= (1 - C.wallBounce); if (this.isPlayer && into > 0.3) MK.audio.bump(); }
        }
      }
      // 壁ヒステリシス：少し内側まで接触中とみなし、毎フレームの減速を防ぐ
      this._wallContact = absL > track.wallHalf - 1.0;

      /* --- 進行・周回 --- */
      this._updateProgress(track, after, raceTime);

      /* --- ブーストパッド / スリップストリーム / ゴールデンキノコ --- */
      this._updateRaceExtras(dt);

      /* --- パーティクル --- */
      this._emit(dt, offRoad, boosting);

      /* --- 見た目更新 --- */
      this._updateVisual(dt, false, offRoad);
    }

    _updateDrift(dt, ctrl, spinning, onRoad) {
      if (spinning) { this.drifting = false; this.driftCharge = 0; this.driftReady = 0; this._driftHeld = ctrl.drift; return; }

      const wantDrift = ctrl.drift;
      const startEdge = wantDrift && !this._driftHeld;
      this._driftHeld = wantDrift;

      // ホップ（ドリフト押し込みの瞬間）
      if (startEdge && Math.abs(this.speed) > C.driftMinSpeed && this.hop < 0.05) {
        this.hopVel = 4.2;
      }

      if (!this.drifting) {
        if (wantDrift && Math.abs(this.speed) > C.driftMinSpeed && Math.abs(ctrl.steer) > 0.25 && this.hop > 0.02) {
          this.drifting = true;
          this.driftDir = U.sign(ctrl.steer);
          this.driftCharge = 0;
          this.driftReady = 0;
        }
      } else {
        if (!wantDrift || Math.abs(this.speed) < C.driftMinSpeed * 0.55) {
          // 解放 → ミニターボ点火
          this._fireMiniTurbo();
          this.drifting = false;
          this.driftCharge = 0;
        } else {
          // 蓄積（イン側に切るほど速く貯まる）
          const into = Math.max(0, this.driftDir * ctrl.steer);
          this.driftCharge += dt * (1.0 + into * 0.9);
          // 到達レベル更新
          let lvl = 0;
          for (let i = 0; i < C.miniTurbo.length; i++) if (this.driftCharge >= C.miniTurbo[i].charge) lvl = i + 1;
          if (lvl > this.driftReady) {
            this.driftReady = lvl;
            if (this.isPlayer) MK.audio.drift(lvl);
          }
        }
      }
      // ホップの積分
      if (this.hop > 0 || this.hopVel !== 0) {
        this.hopVel -= 26 * dt;
        this.hop += this.hopVel * dt;
        if (this.hop <= 0) { this.hop = 0; this.hopVel = 0; }
      }
    }

    _fireMiniTurbo() {
      const lvl = this.driftReady;
      this.driftReady = 0;
      if (lvl <= 0) return;
      const t = C.miniTurbo[lvl - 1];
      this.applyBoost(t.boost, t.duration);
      this._boostColor = t.color;
      if (this.isPlayer) MK.audio.boost();
      // 火花バースト＋点火リング
      const p = this.world.particles;
      const back = this.forward(new THREE.Vector3()).multiplyScalar(-1);
      const gp = this.group.position;
      if (p) {
        for (let i = 0; i < 12; i++) p.driftSpark(gp.x, gp.y + 0.3, gp.z, t.color, back.x, back.z);
        p.boostRing(gp.x, gp.y + 0.3, gp.z, t.color);
      }
    }

    useMushroom(color) {
      const col = color || 0xff7a1f;
      this.applyBoost(C.mushroomBoost, C.mushroomDuration);
      this._boostColor = col;
      if (this.isPlayer) MK.audio.boost();
      const p = this.world.particles, gp = this.group.position;
      if (p) p.boostRing(gp.x, gp.y + 0.3, gp.z, col);
    }

    // ブーストパッド通過 / スリップストリーム / ゴールデンキノコの時間管理
    _updateRaceExtras(dt) {
      const track = this.track;

      // ゴールデンキノコ：時間切れで手放す
      if (this.goldenTimer > 0) {
        this.goldenTimer -= dt;
        if (this.goldenTimer <= 0 && this.item === 'golden') { this.item = null; this.itemCount = 0; }
      }

      // ブーストパッド（路面の矢印ゾーンを踏むと加速）
      this._padCD = Math.max(0, this._padCD - dt);
      const pads = track.boostPads;
      if (pads && pads.length && this._padCD <= 0 && Math.abs(this.speed) > 2 && this.spinTimer <= 0) {
        const N = track.sampleCount;
        for (const pad of pads) {
          const di = (this.sampleIndex - pad.index + N) % N;
          if (di <= pad.lenSamples && Math.abs(this.lateral - pad.lat) <= pad.halfW + 0.5) {
            this._padCD = 1.1;
            this.applyBoost(C.padBoost, C.padDuration);
            this._boostColor = 0xffc41f;
            const p = this.world.particles, gp = this.group.position;
            if (p) p.boostRing(gp.x, gp.y + 0.3, gp.z, 0xffc41f);
            if (this.isPlayer) { MK.audio.boostPad(); this.world.shake(0.12); }
            break;
          }
        }
      }

      // スリップストリーム：前走者の真後ろに付き続けると風をもらって加速
      if (this.draftT < 0) { this.draftT = Math.min(0, this.draftT + dt); return; }
      if (this.finished || this.spinTimer > 0 || this.falling || this.respawnTimer > 0 ||
          Math.abs(this.speed) < this.derived.maxSpeed * 0.6) { this.draftT = Math.max(0, this.draftT - dt * 2); return; }
      let lead = null;
      for (const k of this.world.karts) {
        if (k === this || k.finished) continue;
        const gap = (k.progress - this.progress) * track.length;
        if (gap > 2.5 && gap < C.draftDist &&
            Math.abs(k.lateral - this.lateral) < C.draftLatMax &&
            Math.abs(U.angleDelta(this.yaw, k.yaw)) < 0.55) { lead = k; break; }
      }
      if (lead) {
        this.draftT += dt;
        const p = this.world.particles, gp = this.group.position;
        if (p && Math.random() < 0.35) p.draftStreak(gp.x, gp.y + 1.0, gp.z, this.forward(U.tmpV2));
        if (this.draftT >= C.draftTime) {
          this.draftT = -1.8;        // クールダウン
          this.applyBoost(C.draftBoost, C.draftDuration);
          this._boostColor = 0x9fd8ff;
          if (p) p.boostRing(gp.x, gp.y + 0.3, gp.z, 0x9fd8ff);
          if (this.isPlayer) MK.audio.draftWhoosh();
        }
      } else {
        this.draftT = Math.max(0, this.draftT - dt * 1.5);
      }
    }

    _updateProgress(track, info, raceTime) {
      const N = track.sampleCount;
      const frac = info.index / N;
      // 中間チェックポイント通過
      if (frac > 0.45 && frac < 0.55) this.passedHalf = true;
      // スタートライン通過（前進方向に frac が 0 付近へ巻き戻る）
      if (this.lastFraction > 0.85 && frac < 0.15 && this.passedHalf) {
        this.lap++;
        this.passedHalf = false;
        if (this.lap >= C.laps && !this.finished) {
          this.finished = true;
          this.finishTime = raceTime;
        } else if (!this.finished && this.lap >= 1) {
          if (this.isPlayer) MK.audio.lapJingle();
        }
      }
      this.lastFraction = frac;
      this.progress = this.lap + frac;

      // 逆走判定（前方tangentと速度の向き）
      const fwd = this.forward(U.tmpV2);
      const dot = fwd.x * info.tangent.x + fwd.z * info.tangent.z;
      this.wrongWay = this.speed > 4 && dot < -0.3;
    }

    _emit(dt, offRoad, boosting) {
      const p = this.world.particles;
      if (!p) return;
      const gp = this.group.position;
      const back = this.forward(U.tmpV3).multiplyScalar(-1);
      // ドリフト火花
      if (this.drifting && this.driftReady > 0 && Math.random() < 0.9) {
        const col = C.miniTurbo[this.driftReady - 1].color;
        for (const s of [-1, 1]) {
          const ox = Math.cos(this.yaw) * s * 0.8;
          const oz = -Math.sin(this.yaw) * s * 0.8;
          p.driftSpark(gp.x + back.x * 1.1 + ox, gp.y + 0.25, gp.z + back.z * 1.1 + oz, col, back.x, back.z);
        }
      }
      // ブーストの炎（ツインマフラーから二条）
      if (boosting) {
        const col = this._boostColor || 0xffa531;
        const sidex = Math.cos(this.yaw) * 0.42, sidez = -Math.sin(this.yaw) * 0.42;
        p.boostFlame(gp.x + back.x * 1.5 + sidex, gp.y + 0.5, gp.z + back.z * 1.5 + sidez, col);
        p.boostFlame(gp.x + back.x * 1.5 - sidex, gp.y + 0.5, gp.z + back.z * 1.5 - sidez, col);
      }
      // オフロードの砂煙（テーマ別の色）
      const props = this.track.course.theme.props;
      const sprayCol = props === 'snow' ? 0xf2f8ff
        : (props === 'beach' || props === 'desert') ? 0xeed9a0
        : props === 'castle' ? 0x6a5a60
        : props === 'rainbow' ? 0xd0baff : 0xcdbb88;
      if (offRoad && Math.abs(this.speed) > 6 && Math.random() < 0.5) {
        p.dust(gp.x + back.x * 1.2, gp.y, gp.z + back.z * 1.2, sprayCol);
      }
      // 路面のしぶき（コンセプトアートの「タイヤの蹴り上げ」：雪・砂は走るだけで、虹はきらめき）
      if (!offRoad && Math.abs(this.speed) > 12) {
        const kick = this.drifting ? 0.75 : 0.22;
        if ((props === 'snow' || props === 'beach' || props === 'desert') && Math.random() < kick) {
          const s = Math.random() < 0.5 ? 1 : -1;
          const ox = Math.cos(this.yaw) * s * 0.9, oz = -Math.sin(this.yaw) * s * 0.9;
          p.dust(gp.x + back.x * 1.1 + ox, gp.y + 0.1, gp.z + back.z * 1.1 + oz, sprayCol);
        } else if (props === 'rainbow' && this.drifting && Math.random() < 0.5) {
          p.starTrail(gp.x + back.x * 1.2, gp.y + 0.2, gp.z + back.z * 1.2);
        }
      }
      // スターの軌跡
      if (this.starTimer > 0 && Math.random() < 0.7) p.starTrail(gp.x, gp.y, gp.z);
    }

    _updateVisual(dt, frozen, offRoad) {
      // ホイール回転
      this._wheelSpin += this.speed * dt * 1.6;
      for (const w of this.wheels) w.rotation.x = this._wheelSpin;
      const steerVis = U.clamp(this.controls.steer + (this.drifting ? this.driftDir * 0.5 : 0), -1, 1);
      for (const piv of this.steerPivots) piv.rotation.y = U.damp(piv.rotation.y, -steerVis * 0.4, 16, dt);
      // ステアリングホイールも切れ角に合わせて回す
      const sw = this.chassis.userData.steerWheel;
      if (sw) sw.rotation.z = U.damp(sw.rotation.z, -steerVis * 0.85, 16, dt);

      // ドライバーの動き：コーナーへ体を倒し、進行方向へ顔を向ける。ゴール後はバンザイの上下
      if (this.driver) {
        const head = this.driver.userData.head;
        if (this.finished) {
          const tn = performance.now() * 0.001;
          this.driver.position.y = 0.7 + Math.abs(Math.sin(tn * 5)) * 0.16;
          this.driver.rotation.z = Math.sin(tn * 5) * 0.1;
          this.driver.rotation.y = U.damp(this.driver.rotation.y, 0, 8, dt);
          if (head) head.rotation.y = U.damp(head.rotation.y, 0, 8, dt);
        } else {
          const lean = U.clamp(this.controls.steer + (this.drifting ? this.driftDir * 0.7 : 0), -1.4, 1.4);
          this.driver.position.y = 0.7;
          this.driver.rotation.z = U.damp(this.driver.rotation.z, -lean * 0.1, 10, dt);
          this.driver.rotation.y = U.damp(this.driver.rotation.y, -lean * 0.2, 10, dt);
          if (head) head.rotation.y = U.damp(head.rotation.y, -lean * 0.3, 10, dt);
        }
      }

      // ドリフトのロール
      let targetRoll = -this.controls.steer * 0.08;
      if (this.drifting) targetRoll = -this.driftDir * 0.28;
      this.tilt.rotation.z = U.damp(this.tilt.rotation.z, targetRoll, 12, dt);
      // 前後の揺れ
      const pitch = U.clamp(-this.speed * 0.0008, -0.05, 0.02);
      this.tilt.rotation.x = U.damp(this.tilt.rotation.x, pitch, 8, dt);
      // ホップ
      this.tilt.position.y = this.hop;

      // スピン
      if (this.spinTimer > 0) this.spinAngle += dt * 16 * (this.spinTimer / C.spinOutTime + 0.3);
      else this.spinAngle = U.dampAngle(this.spinAngle, 0, 12, dt);
      this.group.rotation.y = this.yaw + this.spinAngle;

      // つぶし（サンダー）
      const squishK = this.squishTimer > 0 ? 0.45 : 1;
      const sx = this.squishTimer > 0 ? 1.25 : 1;
      this.tilt.scale.set(
        U.damp(this.tilt.scale.x, sx, 10, dt),
        U.damp(this.tilt.scale.y, squishK, 10, dt),
        U.damp(this.tilt.scale.z, sx, 10, dt));

      // スター無敵の演出（虹色発光＋オーラ＋回転リング）
      if (this.starTimer > 0) {
        const tnow = performance.now();
        const flash = (Math.sin(tnow * 0.03) + 1) * 0.5;
        const cols = [0xff5d5d, 0xffba4d, 0xfff04d, 0x5dff8a, 0x5db9ff, 0xc45dff];
        const col = cols[(tnow * 0.012 | 0) % cols.length];
        this.aura.material.opacity = 0.45 + flash * 0.45;
        this.aura.scale.setScalar(4.6 + flash * 1.0);
        this.driver.traverse((o) => { if (o.isMesh && o.material.emissive) { o.material.emissive.setHex(col); o.material.emissiveIntensity = 0.55; } });
        this.starRing.visible = true;
        this.starRing.material.color.setHex(col);
        this.starRing.material.opacity = 0.5 + flash * 0.35;
        this.starRing.rotation.z += dt * 6;
        // 点滅で半透明（無敵の点滅）
        const blink = (tnow * 0.02 | 0) % 2 === 0 ? 1 : 0.55;
        this.chassis.scale.setScalar(blink * this._sizeScale);
      } else {
        this.aura.material.opacity = U.damp(this.aura.material.opacity, 0, 10, dt);
        if (this.chassis.scale.x !== this._sizeScale) this.chassis.scale.setScalar(this._sizeScale);
        if (this.starRing && this.starRing.visible) {
          this.starRing.material.opacity = U.damp(this.starRing.material.opacity, 0, 12, dt);
          if (this.starRing.material.opacity < 0.02) {
            this.starRing.visible = false;
            this.driver.traverse((o) => { if (o.isMesh && o.material.emissive) { o.material.emissive.setHex(0x000000); o.material.emissiveIntensity = 0; } });
          }
        }
      }

      // 影サイズ（ホップで小さく・体格に追従）
      const sc = U.clamp(1 - this.hop * 0.15, 0.6, 1) * this._sizeScale;
      this.shadow.scale.set(sc, sc, 1);
      this.shadow.position.x = 0; this.shadow.position.z = 0;
    }

    dispose() {
      this.scene.remove(this.group);
      U.disposeObject(this.group);
    }
  }

  MK.Kart = Kart;
  MK.buildChassis = buildChassis;

})(window.MK);
