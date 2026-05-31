/* ============================================================================
 *  camera.js — 追従カメラ（chase / far / bumper）+ FOVキック + シェイク + イントロ
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;
  const C = MK.CONFIG;

  const PRESETS = {
    chase: { back: 9.5, height: 4.6, lookAhead: 7, lookUp: 1.6, rate: 6 },
    far: { back: 15, height: 7.5, lookAhead: 9, lookUp: 2.2, rate: 5 },
    bumper: { back: -1.4, height: 1.7, lookAhead: 14, lookUp: 1.2, rate: 14 },
  };

  class CameraController {
    constructor(camera) {
      this.camera = camera;
      this.target = null;
      this.modeIndex = 0;
      this.mode = C.cameraModes[0];
      this.pos = new THREE.Vector3();
      this.look = new THREE.Vector3();
      this.shakeAmt = 0;
      this.fov = C.fov;
      this.introTime = 0;
      this.introDur = 0;
      this._initialized = false;
    }

    setTarget(kart) { this.target = kart; this._initialized = false; }
    setMode(m) { this.mode = m; this.modeIndex = Math.max(0, C.cameraModes.indexOf(m)); }
    cycle() {
      this.modeIndex = (this.modeIndex + 1) % C.cameraModes.length;
      this.mode = C.cameraModes[this.modeIndex];
      return this.mode;
    }
    shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }
    startIntro(dur) { this.introDur = dur || 3.0; this.introTime = this.introDur; this._initialized = false; }

    _forward(kart, out) {
      return out.set(-Math.sin(kart.yaw), 0, -Math.cos(kart.yaw));
    }

    update(dt) {
      const k = this.target;
      if (!k) return;
      const gp = k.group.position;
      const fwd = this._forward(k, U.tmpV1);

      let desiredPos = U.tmpV2;
      let desiredLook = U.tmpV3;

      if (this.introTime > 0) {
        // スタート前：スロー周回
        this.introTime -= dt;
        const t = 1 - this.introTime / this.introDur;
        const ang = k.yaw + Math.PI + (1 - t) * Math.PI * 1.4;
        const r = U.lerp(16, 10, t);
        const h = U.lerp(8, 4.8, t);
        desiredPos.set(gp.x + Math.sin(ang) * r, gp.y + h, gp.z + Math.cos(ang) * r);
        desiredLook.set(gp.x, gp.y + 1.4, gp.z);
        const f = U.dampFactor(4, dt);
        if (!this._initialized) { this.pos.copy(desiredPos); this.look.copy(desiredLook); this._initialized = true; }
        this.pos.lerp(desiredPos, f);
        this.look.lerp(desiredLook, f);
        this.camera.position.copy(this.pos);
        this.camera.lookAt(this.look);
        return;
      }

      const p = PRESETS[this.mode] || PRESETS.chase;
      // 速度で少し引く
      const speedK = U.clamp(Math.abs(k.speed) / k.derived.maxSpeed, 0, 1.3);
      const back = p.back + speedK * 1.8;
      const height = p.height + speedK * 0.6;

      desiredPos.set(
        gp.x - fwd.x * back,
        gp.y + height,
        gp.z - fwd.z * back);
      desiredLook.set(
        gp.x + fwd.x * p.lookAhead,
        gp.y + p.lookUp,
        gp.z + fwd.z * p.lookAhead);

      if (!this._initialized) { this.pos.copy(desiredPos); this.look.copy(desiredLook); this._initialized = true; }

      const f = U.dampFactor(p.rate, dt);
      this.pos.lerp(desiredPos, f);
      this.look.lerp(desiredLook, f);

      // シェイク
      this.shakeAmt = U.damp(this.shakeAmt, 0, 6, dt);
      const sx = (Math.random() - 0.5) * this.shakeAmt;
      const sy = (Math.random() - 0.5) * this.shakeAmt;

      this.camera.position.set(this.pos.x + sx, this.pos.y + sy, this.pos.z);
      this.camera.lookAt(this.look);

      // FOV キック（ブースト/高速）
      let targetFov = C.fov + speedK * 6;
      if (k.boostTimer > 0) targetFov += 8;
      if (k.starTimer > 0) targetFov += 3;
      this.fov = U.damp(this.fov, targetFov, 6, dt);
      if (Math.abs(this.camera.fov - this.fov) > 0.05) {
        this.camera.fov = this.fov;
        this.camera.updateProjectionMatrix();
      }
    }
  }

  MK.CameraController = CameraController;

})(window.MK);
