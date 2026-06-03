/* ============================================================================
 *  track.js — コース生成（路面/縁石/壁）+ 進行度・横ずれ投影 + スタートグリッド
 *  中心線は閉じた Catmull-Rom 曲線。samples[i] = {point,tangent,normal,...}
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;
  const C = MK.CONFIG;

  function roadTexture(theme) {
    return U.makeCanvasTexture(256, (ctx, s) => {
      if (theme.props === 'rainbow') {
        const cols = ['#ff5d5d', '#ffba4d', '#fff04d', '#5dff8a', '#5db9ff', '#c45dff', '#ff7ad6'];
        const bw = s / cols.length;
        cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * bw, 0, bw + 1, s); });
        // きらめき
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
        return;
      }
      const base = theme.road || '#5a5f6a';
      ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
      // ノイズ
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * s, Math.random() * s, 3, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      // 端の白線
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(6, 0, 6, s); ctx.fillRect(s - 12, 0, 6, s);
      // 中央の破線
      ctx.fillStyle = 'rgba(255,235,120,0.6)';
      for (let y = 0; y < s; y += 64) ctx.fillRect(s / 2 - 4, y, 8, 34);
    });
  }

  class Track {
    constructor(scene, course) {
      this.scene = scene;
      this.course = course;
      this.root = new THREE.Group();
      scene.add(this.root);

      this.roadHalf = course.roadHalf || C.roadHalfWidth;
      const shoulder = course.voidRespawn ? (course.shoulder != null ? course.shoulder : 1.5)
        : (course.shoulder != null ? course.shoulder : C.shoulderWidth);
      this.wallHalf = this.roadHalf + shoulder;

      this.samples = [];
      this.sampleCount = 0;
      this.length = 0;
      this.itemBoxPositions = [];
    }

    build() {
      const pts = this.course.points.map((p) => new THREE.Vector3(
        p[0], p.length >= 3 ? p[1] : 0, p.length >= 3 ? p[2] : p[1]));
      this.curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', this.course.tension != null ? this.course.tension : 0.5);
      this.length = this.curve.getLength();

      const spacing = 3.0;
      let N = Math.round(this.length / spacing);
      N = U.clamp(N, 160, 520);
      this.sampleCount = N;

      const up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < N; i++) {
        const t = i / N;
        const point = this.curve.getPointAt(t);
        const tangent = this.curve.getTangentAt(t).setY(0).normalize();
        const normal = new THREE.Vector3().crossVectors(up, tangent).normalize(); // 左方向
        this.samples.push({ point, tangent, normal });
      }

      this._buildRoad();
      this._buildCurbs();
      if (this.course.hasWalls) this._buildWalls();
      this._buildFences();
      this._buildItemBoxes();

      return this;
    }

    _ribbon(innerHalf, outerHalf, yOff, material, vRepeat) {
      const N = this.sampleCount;
      const positions = [];
      const uvs = [];
      const indices = [];
      for (let i = 0; i < N; i++) {
        const sm = this.samples[i];
        // 内側・外側の2頂点（左右どちらの帯かは符号で指定）
        const ix = sm.point.x + sm.normal.x * innerHalf;
        const iz = sm.point.z + sm.normal.z * innerHalf;
        const ox = sm.point.x + sm.normal.x * outerHalf;
        const oz = sm.point.z + sm.normal.z * outerHalf;
        positions.push(ix, sm.point.y + yOff, iz);
        positions.push(ox, sm.point.y + yOff, oz);
        const v = (i / N) * vRepeat;
        uvs.push(0, v); uvs.push(1, v);
      }
      for (let i = 0; i < N; i++) {
        const a0 = i * 2, b0 = i * 2 + 1;
        const ni = (i + 1) % N;
        const a1 = ni * 2, b1 = ni * 2 + 1;
        indices.push(a0, b0, b1);
        indices.push(a0, b1, a1);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, material);
      this.root.add(mesh);
      return mesh;
    }

    _buildRoad() {
      const theme = this.course.theme;
      const tex = roadTexture(theme);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 1);
      const mat = new THREE.MeshStandardMaterial({
        map: tex, side: THREE.DoubleSide, roughness: 0.85, metalness: 0.05,
        emissive: theme.props === 'rainbow' ? 0x222233 : 0x000000,
        emissiveIntensity: theme.props === 'rainbow' ? 0.5 : 0,
        emissiveMap: theme.props === 'rainbow' ? tex : null,
        transparent: !!theme.roadTransparent, opacity: theme.roadTransparent ? 0.92 : 1,
      });
      const vRep = Math.max(2, Math.round(this.length / 8));
      this.roadMesh = this._ribbon(this.roadHalf, -this.roadHalf, 0.02, mat, vRep);
    }

    _buildCurbs() {
      const theme = this.course.theme;
      let mat;
      if (theme.props === 'rainbow') {
        mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x88aaff, emissiveIntensity: 0.8, side: THREE.DoubleSide, roughness: 0.4 });
      } else {
        const ctex = U.checkerTexture(2, '#ff4438', '#ffffff');
        ctex.wrapS = ctex.wrapT = THREE.RepeatWrapping;
        mat = new THREE.MeshStandardMaterial({ map: ctex, side: THREE.DoubleSide, roughness: 0.6 });
      }
      const curbW = 1.4;
      const vRep = Math.max(20, Math.round(this.length / 3));
      // 左右の縁石
      this._ribbon(this.roadHalf, this.roadHalf + curbW, 0.06, mat, vRep);
      this._ribbon(-this.roadHalf, -(this.roadHalf + curbW), 0.06, mat, vRep);
    }

    _buildWalls() {
      const theme = this.course.theme;
      const N = this.sampleCount;
      const wallH = 2.2;
      const mat = new THREE.MeshStandardMaterial({ color: theme.wall || 0xb8c0cc, side: THREE.DoubleSide, roughness: 0.8, flatShading: true });
      for (const side of [1, -1]) {
        const positions = [], indices = [], uvs = [];
        for (let i = 0; i < N; i++) {
          const sm = this.samples[i];
          const bx = sm.point.x + sm.normal.x * this.wallHalf * side;
          const bz = sm.point.z + sm.normal.z * this.wallHalf * side;
          positions.push(bx, sm.point.y, bz);
          positions.push(bx, sm.point.y + wallH, bz);
          const v = (i / N) * Math.max(10, Math.round(this.length / 4));
          uvs.push(0, v); uvs.push(1, v);
        }
        for (let i = 0; i < N; i++) {
          const a0 = i * 2, b0 = i * 2 + 1, ni = (i + 1) % N, a1 = ni * 2, b1 = ni * 2 + 1;
          indices.push(a0, b0, b1); indices.push(a0, b1, a1);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices); geo.computeVertexNormals();
        this.root.add(new THREE.Mesh(geo, mat));
      }
    }

    _buildItemBoxes() {
      const fr = this.course.itemBoxFractions || [0.2, 0.42, 0.64, 0.84];
      const per = this.course.boxesPerRow || 4;
      for (const f of fr) {
        const idx = Math.floor(f * this.sampleCount) % this.sampleCount;
        const sm = this.samples[idx];
        const spread = this.roadHalf * 1.4;
        for (let k = 0; k < per; k++) {
          const lat = per === 1 ? 0 : (k / (per - 1) - 0.5) * spread;
          const pos = new THREE.Vector3(
            sm.point.x + sm.normal.x * lat,
            sm.point.y,
            sm.point.z + sm.normal.z * lat);
          this.itemBoxPositions.push(pos);
        }
      }
    }

    /* ---- 沿道の柵（ガードレール）。テーマ別。起伏に追従 ---- */
    _buildFences() {
      const props = this.course.theme.props;
      const N = this.sampleCount;
      const lat = this.roadHalf + (props === 'rainbow' ? 0.8 : 1.3);
      const step = Math.max(3, Math.round(N / 80));
      const mk = (col, o) => new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.7, metalness: 0.08, flatShading: true }, o || {}));
      // テーマ別マテリアル
      let postMat, railMat, accMat;
      if (props === 'grass') { postMat = mk(0xf6f6f6); railMat = mk(0xf6f6f6); accMat = mk(0xe23b2e, { roughness: 0.5 }); }
      else if (props === 'snow') { postMat = mk(0x8a5a34); railMat = mk(0xa7c2d4); accMat = mk(0xffffff); }
      else if (props === 'castle') { postMat = mk(0x4a4550); railMat = mk(0x3a3640); accMat = mk(0x2a2630); }
      else { postMat = mk(0xffffff, { emissive: 0x66ccff, emissiveIntensity: 0.9 }); railMat = mk(0xffffff, { emissive: 0x4499ff, emissiveIntensity: 0.8 }); accMat = mk(0xffffff); }
      this._fenceMats = [postMat, railMat, accMat];
      for (const side of [1, -1]) {
        const posts = [];
        for (let i = 0; i < N; i += step) {
          const sm = this.samples[i];
          const px = sm.point.x + sm.normal.x * lat * side;
          const pz = sm.point.z + sm.normal.z * lat * side;
          const ang = Math.atan2(sm.tangent.x, sm.tangent.z);
          const post = this._fencePost(props, postMat, accMat);
          post.position.set(px, sm.point.y, pz);
          post.rotation.y = ang;
          this.root.add(post);
          posts.push({ x: px, y: sm.point.y, z: pz });
        }
        for (let k = 0; k < posts.length; k++) {
          const rail = this._fenceRail(props, posts[k], posts[(k + 1) % posts.length], railMat);
          if (rail) this.root.add(rail);
        }
      }
    }

    _fencePost(props, postMat, accMat) {
      const g = new THREE.Group();
      if (props === 'grass') {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.15, 0.16), postMat); p.position.y = 0.57; g.add(p);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), accMat); cap.position.y = 1.2; g.add(cap);
      } else if (props === 'snow') {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.25, 8), postMat); p.position.y = 0.62; g.add(p);
        const snow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), accMat); snow.scale.y = 0.6; snow.position.y = 1.26; g.add(snow);
      } else if (props === 'castle') {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.0, 0.5), postMat); base.position.y = 0.5; g.add(base);
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.55, 0.5), postMat); merlon.position.y = 1.28; g.add(merlon);
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.18, 0.12), accMat); slit.position.set(0, 0.7, -0.2); g.add(slit);
      } else {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.05, 8), postMat); p.position.y = 0.52; g.add(p);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); ball.position.y = 1.15; g.add(ball);
      }
      return g;
    }

    _fenceRail(props, a, b, railMat) {
      const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
      if (len > 40 || len < 0.01) return null; // 閉ループの不正な渡りを除外
      const ang = Math.atan2(dx, dz);
      const g = new THREE.Group();
      const mkRail = (h, w, t) => {
        const r = new THREE.Mesh(new THREE.BoxGeometry(w || 0.1, t || 0.12, len), railMat);
        r.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + h, (a.z + b.z) / 2);
        r.rotation.y = ang; return r;
      };
      if (props === 'grass') { g.add(mkRail(0.42)); g.add(mkRail(0.82)); }
      else if (props === 'snow') { g.add(mkRail(0.45)); g.add(mkRail(0.88, 0.12, 0.16)); }
      else if (props === 'castle') { g.add(mkRail(0.5, 0.34, 0.6)); }
      else { g.add(mkRail(0.7, 0.14, 0.14)); }
      return g;
    }

    /* ---- 投影：位置→(最寄りサンプル, 横ずれ) ----
     * hint を渡すと、その付近のサンプルだけを探索する（連続移動する物体向けの高速版）。
     * カートは毎フレーム数 units しか動かない（サンプル間隔 3.0）ので ±WIN の窓で十分。
     * hint 省略時は全サンプルを総当たり（初期配置・復帰・落下後の再取得用）。 */
    project(pos, hint) {
      const N = this.sampleCount;
      let bestI = 0, bestD = Infinity;
      if (hint != null && hint >= 0 && hint < N) {
        const WIN = 40;
        for (let o = -WIN; o <= WIN; o++) {
          const i = ((hint + o) % N + N) % N;
          const sm = this.samples[i];
          const dx = pos.x - sm.point.x, dz = pos.z - sm.point.z;
          const d = dx * dx + dz * dz;
          if (d < bestD) { bestD = d; bestI = i; }
        }
      } else {
        for (let i = 0; i < N; i++) {
          const sm = this.samples[i];
          const dx = pos.x - sm.point.x, dz = pos.z - sm.point.z;
          const d = dx * dx + dz * dz;
          if (d < bestD) { bestD = d; bestI = i; }
        }
      }
      const sm = this.samples[bestI];
      const dx = pos.x - sm.point.x, dz = pos.z - sm.point.z;
      const lateral = dx * sm.normal.x + dz * sm.normal.z;
      return {
        index: bestI,
        fraction: bestI / N,
        lateral,
        point: sm.point,
        tangent: sm.tangent,
        normal: sm.normal,
        length: this.length,
      };
    }

    /* ---- スタートグリッド ---- */
    startGrid(count) {
      const startIdx = 4;
      const sm = this.samples[startIdx];
      const tangent = sm.tangent;
      const normal = sm.normal;
      const yaw = Math.atan2(-tangent.x, -tangent.z);
      const grid = [];
      const rowSpacing = 5.0;
      const laneOffset = this.roadHalf * 0.42;
      for (let r = 0; r < count; r++) {
        const row = Math.floor(r / 2);
        const col = r % 2;
        const back = (row + 1) * rowSpacing;
        const lat = (col === 0 ? -1 : 1) * laneOffset + (row % 2 === 0 ? 0 : 0);
        const pos = new THREE.Vector3(
          sm.point.x - tangent.x * back + normal.x * lat,
          sm.point.y,
          sm.point.z - tangent.z * back + normal.z * lat);
        grid.push({ pos, yaw });
      }
      return grid;
    }

    reset() {
      this.scene.remove(this.root);
      U.disposeObject(this.root);
    }
  }

  MK.Track = Track;

})(window.MK);
