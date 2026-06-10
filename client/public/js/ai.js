/* ============================================================================
 *  ai.js — CPU レーサーの制御（先読み追従 + ドリフト + アイテム判断）
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;
  const C = MK.CONFIG;

  class AIController {
    constructor(kart, track, world, skill) {
      this.kart = kart;
      this.track = track;
      this.world = world;
      this.skill = skill != null ? skill : 0.8;     // 0..1
      this.lane = U.randRange(-0.45, 0.45) * track.roadHalf;
      this.laneTimer = U.randRange(2, 5);
      this.itemTimer = U.randRange(0.5, 2.0);
      this.stuckTimer = 0;
      this.reverseTimer = 0;
      this.driftHold = false;
      this._prevLat = 0;        // 前フレームの横位置（横速度＝外へ流れているかの判定用）
    }

    update(dt) {
      const k = this.kart;
      if (k.finished) { k.setControls({ throttle: 1, brake: 0, steer: 0, drift: false, reverseHeld: false }); return; }

      const track = this.track;
      const N = track.sampleCount;
      const i = k.sampleIndex;
      const rh = track.roadHalf;

      // 壁が無く転落するコース（レインボー等）は安全マージンを厚く取り、攻めすぎない
      const voidCourse = !!track.course.voidRespawn;
      const safeLane = rh * (voidCourse ? 0.52 : 0.92);  // 目標として許す横位置の上限
      const edgeFrac = Math.abs(k.lateral) / rh;         // 0=中央, 1=路面端
      // 横方向の移動（＞0 で外側＝縁へ流れている）
      const latVel = (k.lateral - this._prevLat) / Math.max(dt, 1e-3);
      const driftingOut = U.sign(latVel) === U.sign(k.lateral) && Math.abs(k.lateral) > rh * 0.4;

      // レーン（左右の取り回し）をゆっくり変える（縁に寄り過ぎない範囲で）
      this.laneTimer -= dt;
      if (this.laneTimer <= 0) { this.lane = U.randRange(-0.6, 0.6) * safeLane; this.laneTimer = U.randRange(2, 5); }

      // 先読みサンプル（壁無しコースは控えめにして膨らみ過ぎ＝外への飛び出しを防ぐ）
      const ahead = Math.round(U.clamp(Math.abs(k.speed) * (voidCourse ? 0.3 : 0.42) + 5, 6, voidCourse ? 18 : 30));
      const sNear = track.samples[(i + 3) % N];
      const sFar = track.samples[(i + ahead) % N];

      // コーナーの鋭さ（近先と遠先の進行方向差）
      const turnAng = Math.abs(U.angleDelta(
        Math.atan2(sNear.tangent.x, sNear.tangent.z),
        Math.atan2(sFar.tangent.x, sFar.tangent.z)));

      // 目標点（コーナーではインへ寄せる。壁無しコースは控えめ＝中央寄りに保ち外へ膨らまない）
      let lane = this.lane;
      const cross = sNear.tangent.x * sFar.tangent.z - sNear.tangent.z * sFar.tangent.x;
      if (turnAng > 0.25) lane = U.clamp(-Math.sign(cross) * rh * (voidCourse ? 0.4 : 0.55), -safeLane, safeLane);

      // 前方の敵キャラを避ける（反対側へ。安全レーン内に制限して縁から落ちないように）
      if (this.world.hazards) {
        const hz = this.world.hazards.nearestDangerAhead(k, 22);
        if (hz) {
          const away = hz.lateral >= 0 ? -1 : 1;
          lane = U.clamp(hz.lateral + away * rh * 0.7, -safeLane, safeLane);
        }
      }

      // 路面端に近いときは中央へ強く引き戻す（転落・脱輪防止：最優先で上書き）
      const nearEdge = edgeFrac > (voidCourse ? 0.42 : 0.85);
      if (nearEdge) lane = -U.sign(k.lateral) * safeLane * (voidCourse ? 0.1 : 0.25);

      const tx = sFar.point.x + sFar.normal.x * lane;
      const tz = sFar.point.z + sFar.normal.z * lane;

      const dirx = tx - k.group.position.x, dirz = tz - k.group.position.z;
      const desiredYaw = Math.atan2(-dirx, -dirz);
      const err = U.angleDelta(k.yaw, desiredYaw);
      let steer = U.clamp(-err * 1.9, -1, 1);

      let throttle = 1, brake = 0, reverseHeld = false;

      // スタック処理
      if (Math.abs(k.speed) < 2 && k.spinTimer <= 0 && k.respawnTimer <= 0) this.stuckTimer += dt;
      else this.stuckTimer = 0;
      if (this.stuckTimer > 1.0 && this.reverseTimer <= 0) { this.reverseTimer = 0.7; }
      if (this.reverseTimer > 0) {
        this.reverseTimer -= dt;
        reverseHeld = true; throttle = 0; steer = -steer;
      }

      // コーナー減速：壁無しコースは早め・強めに緩めて外へ飛び出さないようにする
      const slowTurn = voidCourse ? 0.3 : 0.9;
      if (this.reverseTimer <= 0 && turnAng > slowTurn && Math.abs(k.speed) > k.derived.maxSpeed * (voidCourse ? 0.52 : 0.7)) {
        throttle = Math.min(throttle, voidCourse ? 0.62 : (0.92 - (1 - this.skill) * 0.1));
        if (voidCourse) brake = Math.max(brake, 0.2);
      }

      // 縁へ流れているとき（壁無しコース）：ブレーキ＋中央へ直接ステア＝転落の最終防波堤
      if (voidCourse && this.reverseTimer <= 0 && (nearEdge || driftingOut)) {
        throttle = Math.min(throttle, 0.45);
        if (driftingOut) brake = Math.max(brake, 0.55);
        // steer>0=右=lateral 減少。lateral>0(左寄り)なら右へ＝+、lateral<0なら左へ＝- → sign(lateral)
        const pull = U.clamp((edgeFrac - 0.42) / 0.4, 0, 1) * 0.9;
        steer = U.clamp(steer + U.sign(k.lateral) * pull, -1, 1);
      }

      // ドリフト判断（壁無しコースでは縁に寄っている間はドリフトしない＝外へ膨らむのを防ぐ）
      const allowDrift = !voidCourse || edgeFrac < 0.4;
      let drift = false;
      if (allowDrift && this.skill > 0.4 && Math.abs(k.speed) > C.driftMinSpeed + 3 && turnAng > 0.34 && this.reverseTimer <= 0) {
        this.driftHold = true;
      } else if (!allowDrift || turnAng < 0.18 || Math.abs(k.speed) < C.driftMinSpeed) {
        this.driftHold = false;
      }
      drift = this.driftHold && Math.abs(steer) > 0.15;

      // ラバーバンド（プレイヤー基準）。壁無しコースでは「離されたら加速」はしない（無理な速度で落ちるため）
      const player = this.world.player;
      if (player && !player.finished) {
        const gap = player.progress - k.progress;
        if (!voidCourse && gap > 0.25 && Math.random() < 0.004) k.applyBoost(6, 0.5);  // 大きく離されたら追い上げ
        if (gap < -0.5) throttle = Math.min(throttle, 0.94);                            // 大きく先行したら自重
      }

      k.setControls({ throttle, brake, steer, drift, reverseHeld });
      this._prevLat = k.lateral;

      // アイテム判断
      this.itemTimer -= dt;
      if (this.itemTimer <= 0 && k.item && k.item !== '__rolling__' && k.respawnTimer <= 0) {
        this._maybeUseItem();
        this.itemTimer = U.randRange(0.3, 1.2);
      }
    }

    _maybeUseItem() {
      const k = this.kart;
      const item = MK.ITEMS[k.item];
      if (!item) return;
      const karts = this.world.karts;

      // 直近の前後の相手を探す
      let nearestAheadDist = Infinity, nearestBehindDist = Infinity, aheadAligned = false;
      const fwd = k.forward(new THREE.Vector3());
      for (const o of karts) {
        if (o === k || o.finished) continue;
        const dx = o.group.position.x - k.group.position.x;
        const dz = o.group.position.z - k.group.position.z;
        const dist = Math.hypot(dx, dz);
        const dot = (dx * fwd.x + dz * fwd.z) / (dist + 0.001);
        if (dot > 0.2) { if (dist < nearestAheadDist) { nearestAheadDist = dist; aheadAligned = dot > 0.85; } }
        else { if (dist < nearestBehindDist) nearestBehindDist = dist; }
      }

      const use = () => this.world.items.useItem(k);
      switch (item.type) {
        case 'boost':
          if (Math.abs(this.kart.controls.steer) < 0.3 || Math.abs(k.lateral) > this.track.roadHalf) use();
          break;
        case 'shellGreen':
          if (aheadAligned && nearestAheadDist < 45) use();
          else if (nearestBehindDist < 18) use(); // 後方けん制
          break;
        case 'shellRed':
          if (nearestAheadDist < 90) use();
          break;
        case 'banana':
          if (nearestBehindDist < 26) use();
          break;
        case 'fakeBox':
          if (nearestBehindDist < 30 || Math.random() < 0.2) use(); // 追っ手への置き土産
          break;
        case 'golden':
          use(); // 時間制なので即発動してそのまま連打（itemTimer の周期で再使用される）
          break;
        case 'bomb':
          // 弧を描いて遠投するので、前方やや遠めの相手にも投げる
          if (nearestAheadDist < 52 || nearestBehindDist < 16) use();
          break;
        case 'star':
          use();
          break;
        case 'tripleShell':
          // 未展開なら即シールド展開、展開後は前後に敵がいれば1発発射
          if (!k._orbiter) use();
          else if (nearestAheadDist < 60 || nearestBehindDist < 22) use();
          break;
        case 'lightning':
          if (k.place > 2) use();
          break;
        case 'spiny':
          use(); // 一位を自動追尾するので即発射
          break;
        default: use();
      }
    }
  }

  MK.AIController = AIController;

})(window.MK);
