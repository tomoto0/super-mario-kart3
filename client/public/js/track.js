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

    /* ---- 投影：位置→(最寄りサンプル, 横ずれ) ---- */
    project(pos) {
      const N = this.sampleCount;
      let bestI = 0, bestD = Infinity;
      for (let i = 0; i < N; i++) {
        const sm = this.samples[i];
        const dx = pos.x - sm.point.x, dz = pos.z - sm.point.z;
        const d = dx * dx + dz * dz;
        if (d < bestD) { bestD = d; bestI = i; }
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
      this.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose()); else o.material.dispose(); }
      });
    }
  }

  MK.Track = Track;

})(window.MK);
