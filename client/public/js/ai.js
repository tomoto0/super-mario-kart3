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
    }

    update(dt) {
      const k = this.kart;
      if (k.finished) { k.setControls({ throttle: 1, brake: 0, steer: 0, drift: false, reverseHeld: false }); return; }

      const track = this.track;
      const N = track.sampleCount;
      const i = k.sampleIndex;

      // レーン（左右の取り回し）をゆっくり変える
      this.laneTimer -= dt;
      if (this.laneTimer <= 0) { this.lane = U.randRange(-0.5, 0.5) * track.roadHalf; this.laneTimer = U.randRange(2, 5); }

      // 先読みサンプル
      const ahead = Math.round(U.clamp(Math.abs(k.speed) * 0.42 + 5, 6, 30));
      const sNear = track.samples[(i + 3) % N];
      const sFar = track.samples[(i + ahead) % N];

      // コーナーの鋭さ（近先と遠先の進行方向差）
      const turnAng = Math.abs(U.angleDelta(
        Math.atan2(sNear.tangent.x, sNear.tangent.z),
        Math.atan2(sFar.tangent.x, sFar.tangent.z)));

      // 目標点（コーナーではインへ寄せる）
      let lane = this.lane;
      const cross = sNear.tangent.x * sFar.tangent.z - sNear.tangent.z * sFar.tangent.x;
      if (turnAng > 0.25) lane = U.clamp(-Math.sign(cross) * track.roadHalf * 0.55, -track.roadHalf, track.roadHalf);
      // オフロードなら中央へ戻す
      if (Math.abs(k.lateral) > track.roadHalf * 0.9) lane = 0;

      // 前方の敵キャラを避ける（反対側へ寄せる）
      if (this.world.hazards) {
        const hz = this.world.hazards.nearestDangerAhead(k, 22);
        if (hz) {
          const away = hz.lateral >= 0 ? -1 : 1;
          lane = U.clamp(hz.lateral + away * track.roadHalf * 0.85, -track.roadHalf, track.roadHalf);
        }
      }

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

      // ドリフト判断
      let drift = false;
      if (this.skill > 0.4 && Math.abs(k.speed) > C.driftMinSpeed + 3 && turnAng > 0.34 && this.reverseTimer <= 0) {
        this.driftHold = true;
      } else if (turnAng < 0.18 || Math.abs(k.speed) < C.driftMinSpeed) {
        this.driftHold = false;
      }
      drift = this.driftHold && Math.abs(steer) > 0.15;

      // 鋭すぎるコーナーでわずかに減速（上級ほど減速しない）
      if (turnAng > 0.9 && Math.abs(k.speed) > k.derived.maxSpeed * 0.7) throttle = 0.92 - (1 - this.skill) * 0.1;

      // ラバーバンド（プレイヤー基準）
      const player = this.world.player;
      if (player && !player.finished) {
        const gap = player.progress - k.progress;
        if (gap > 0.25 && Math.random() < 0.004) k.applyBoost(6, 0.5);   // 大きく離されたら追い上げ
        if (gap < -0.5) throttle = Math.min(throttle, 0.94);             // 大きく先行したら自重
      }

      k.setControls({ throttle, brake, steer, drift, reverseHeld });

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
        case 'bomb':
          if (nearestAheadDist < 30 || nearestBehindDist < 16) use();
          break;
        case 'star':
          use();
          break;
        case 'lightning':
          if (k.place > 2) use();
          break;
        default: use();
      }
    }
  }

  MK.AIController = AIController;

})(window.MK);
