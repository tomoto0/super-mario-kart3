/* ============================================================================
 *  scenery.js — マリオ世界の小物 & テーマ環境（地面/空/背景/装飾/コイン）
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;

  function M(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0.02, flatShading: true }, o || {})); }
  function basic(color, o) { return new THREE.MeshBasicMaterial(Object.assign({ color }, o || {})); }

  /* ---- 個別ビルダ ---- */
  const Build = {
    pipe(h) {
      const g = new THREE.Group();
      h = h || 4;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, h, 16), M(0x2fae4a));
      body.position.y = h / 2; g.add(body);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 1.0, 16), M(0x36c957));
      rim.position.y = h; g.add(rim);
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.3, 16), M(0x176b2a));
      inner.position.y = h + 0.36; g.add(inner);
      // ハイライト
      const hi = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, 0.1), M(0x7ee08a));
      hi.position.set(-0.8, h / 2, -1.3); g.add(hi);
      return g;
    },
    coin() {
      const g = new THREE.Group();
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.14, 18),
        new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.3, metalness: 0.6, emissive: 0x6a4a00, emissiveIntensity: 0.3 }));
      c.rotation.x = Math.PI / 2; g.add(c);
      const inner = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xe0a800, roughness: 0.4, metalness: 0.5 }));
      g.add(inner);
      return g;
    },
    qblock() {
      const tex = U.questionBlockTexture();
      const m = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0x3a2a00, emissiveIntensity: 0.25 }));
      return m;
    },
    goomba() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), M(0x8a5a2b));
      body.scale.set(1, 0.85, 1); body.position.y = 0.8; g.add(body);
      const under = new THREE.Mesh(new THREE.SphereGeometry(0.88, 16, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), M(0xf0d8b0));
      under.position.y = 0.8; g.add(under);
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), basic(0xffffff)); eye.position.set(s * 0.28, 0.95, -0.7); eye.scale.set(0.8, 1.2, 0.6); g.add(eye);
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), basic(0x1a1a1a)); p.position.set(s * 0.3, 0.92, -0.82); g.add(p);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.08), M(0x3a2410)); brow.position.set(s * 0.3, 1.12, -0.7); brow.rotation.z = -s * 0.4; g.add(brow);
        const foot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), M(0x5a3a1a)); foot.scale.set(1, 0.5, 1.3); foot.position.set(s * 0.4, 0.12, 0); g.add(foot);
      }
      return g;
    },
    tree(snow) {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 2.4, 8), M(0x7a4a23));
      trunk.position.y = 1.2; g.add(trunk);
      const folMat = M(snow ? 0xeaf4ff : 0x36a83f);
      const tiers = [[0, 3.2, 2.0], [0, 4.2, 1.5], [0, 5.0, 1.0]];
      tiers.forEach((t) => { const c = new THREE.Mesh(new THREE.ConeGeometry(t[2], 1.8, 9), folMat); c.position.set(t[0], t[1], 0); g.add(c); });
      if (snow) { const cap = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 8), M(0xffffff)); cap.position.y = 5.8; g.add(cap); }
      return g;
    },
    bush() {
      const g = new THREE.Group();
      const mat = M(0x2f9d3a);
      [[0, 0, 0, 1], [-0.9, -0.1, 0, 0.7], [0.9, -0.1, 0, 0.7]].forEach((p) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(p[3], 12, 8), mat); s.position.set(p[0], p[1] + 0.6, p[2]); s.scale.y = 0.8; g.add(s);
      });
      return g;
    },
    cloud() {
      const g = new THREE.Group();
      const mat = basic(0xffffff); mat.transparent = true; mat.opacity = 0.95;
      [[0, 0, 0, 1.6], [1.5, -0.2, 0, 1.2], [-1.5, -0.2, 0, 1.2], [0.7, 0.4, 0.5, 1.0], [-0.7, 0.3, -0.4, 1.0]].forEach((p) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(p[3], 12, 8), mat); s.position.set(p[0], p[1], p[2]); s.scale.y = 0.7; g.add(s);
      });
      return g;
    },
    snowman() {
      const g = new THREE.Group();
      const mat = M(0xffffff);
      const b1 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10), mat); b1.position.y = 1.0; g.add(b1);
      const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 10), mat); b2.position.y = 2.4; g.add(b2);
      const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), mat); b3.position.y = 3.5; g.add(b3);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), M(0xff8a2a)); nose.position.set(0, 3.5, -0.6); nose.rotation.x = -Math.PI / 2; g.add(nose);
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), basic(0x222222)); e.position.set(s * 0.2, 3.7, -0.5); g.add(e); }
      return g;
    },
    torch() {
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.6, 8), M(0x3a3a44)); post.position.y = 1.8; g.add(post);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 0.5, 10), M(0x222222)); bowl.position.y = 3.7; g.add(bowl);
      const tex = U.softCircleTexture('rgba(255,180,40,1)', 'rgba(255,80,0,0)');
      const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffae33 }));
      flame.scale.set(1.6, 2.4, 1); flame.position.y = 4.5; g.add(flame);
      const light = new THREE.PointLight(0xff8a2a, 1.2, 16); light.position.y = 4.4; g.add(light);
      g.userData.flame = flame; g.userData.light = light;
      return g;
    },
    lavaBubble() {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0xff6a1a, emissive: 0xff3a00, emissiveIntensity: 0.9, roughness: 0.5 }));
      return m;
    },
    statue() {
      const g = new THREE.Group();
      const ped = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 3), M(0x55505a)); ped.position.y = 0.6; g.add(ped);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 2.4, 10), M(0x6b6670)); body.position.y = 2.4; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), M(0x6b6670)); head.position.y = 3.8; g.add(head);
      for (const s of [-1, 1]) { const hn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 7), M(0x837e88)); hn.position.set(s * 0.5, 4.4, 0); hn.rotation.z = s * -0.4; g.add(hn); }
      const snout = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), M(0x6b6670)); snout.scale.set(1, 0.7, 1.1); snout.position.set(0, 3.6, -0.7); g.add(snout);
      g.scale.setScalar(1.4);
      return g;
    },
    starProp() {
      const tex = U.starTexture('#fff04d');
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      s.scale.set(3, 3, 1);
      return s;
    },
    pylon(color) {
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 8),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, roughness: 0.4 }));
      post.position.y = 2; g.add(post);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), basic(0xffffff));
      ball.position.y = 4.2; g.add(ball);
      return g;
    },
    planet(color, r) {
      return new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), M(color, { emissive: color, emissiveIntensity: 0.15 }));
    },
    lakitu() {
      const g = new THREE.Group();
      const cloud = Build.cloud(); cloud.scale.setScalar(1.0); g.add(cloud);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), M(0xf0e26a)); body.position.y = 1.0; g.add(body);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), M(0x36c957)); shell.scale.set(1, 1, 0.7); shell.position.set(0, 1.1, 0.4); g.add(shell);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), M(0xf0e26a)); head.position.set(0, 1.7, -0.1); g.add(head);
      // メガネ
      for (const s of [-1, 1]) { const gl = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12), M(0x222222)); gl.position.set(s * 0.2, 1.75, -0.5); g.add(gl); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), basic(0xffffff)); eye.position.set(s * 0.2, 1.75, -0.55); g.add(eye); }
      g.userData.bob = Math.random() * Math.PI * 2;
      return g;
    },
    signal() {
      const g = new THREE.Group();
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.4, 0.3), M(0x222831));
      g.add(board);
      const lamps = [];
      for (let i = 0; i < 3; i++) {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshStandardMaterial({ color: 0x551111, emissive: 0x000000 }));
        l.position.set(0, 0.7 - i * 0.7, -0.2); g.add(l); lamps.push(l);
      }
      g.userData.lamps = lamps;
      return g;
    },
    startGate(theme) {
      const g = new THREE.Group();
      const postMat = M(0xf2f2f2);
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 9, 10), postMat);
        post.position.set(s, 4.5, 0); g.add(post);
      }
      const tex = U.checkerTexture(10, '#ffffff', '#1a1a1a');
      tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(3, 1);
      const banner = new THREE.Mesh(new THREE.BoxGeometry(2, 1.4, 0.2),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
      banner.position.y = 9; g.add(banner);
      g.userData.banner = banner;
      return g;
    },
  };

  /* ---- 環境 + 配置の管理 ---- */
  class Scenery {
    constructor(scene, course, track) {
      this.scene = scene;
      this.course = course;
      this.track = track;
      this.root = new THREE.Group();
      scene.add(this.root);
      this.coins = [];
      this.spinners = [];   // コイン/?ブロック等
      this.torches = [];
      this.bubbles = [];
      this.lakitus = [];
      this.banners = [];
      this.goombas = [];
      this.signal = null;
      this.coinCounters = {}; // kartIndex -> count
    }

    build() {
      this._buildEnvironment();
      this._scatterProps();
      this._buildStartArea();
      this._placeCoins();
    }

    _buildEnvironment() {
      const t = this.course.theme;
      // 空ドーム
      const skyTex = U.makeCanvasTexture(256, (ctx, s) => {
        const g = ctx.createLinearGradient(0, 0, 0, s);
        g.addColorStop(0, t.sky[0]); g.addColorStop(1, t.sky[1]);
        ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
      });
      const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 16),
        new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
      this.root.add(sky);

      // 地面
      if (t.props !== 'rainbow') {
        const ground = new THREE.Mesh(new THREE.CircleGeometry(620, 48),
          M(t.ground, { roughness: 0.95 }));
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        this.root.add(ground);
      } else {
        // 虹コース：星空
        this._buildStarfield();
        // 遠景の惑星
        const planets = [[0x59b6ff, 40, -300, 120, -200], [0xff8ad6, 28, 250, 90, -260], [0xffd24a, 60, -120, 160, -420]];
        planets.forEach((p) => { const pl = Build.planet(p[0], p[1]); pl.position.set(p[2], p[3], p[4]); this.root.add(pl); });
      }

      // 遠景の山（grass/snow）
      if (t.props === 'grass' || t.props === 'snow') {
        const mtnColor = t.props === 'snow' ? 0xdfeaf6 : 0x6fae5a;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * U.TAU;
          const r = 360 + (i % 3) * 40;
          const mtn = new THREE.Mesh(new THREE.ConeGeometry(60 + (i % 4) * 18, 90 + (i % 5) * 25, 6), M(mtnColor, { fog: true }));
          mtn.position.set(Math.cos(a) * r, 20, Math.sin(a) * r);
          this.root.add(mtn);
          if (t.props === 'snow') { const cap = new THREE.Mesh(new THREE.ConeGeometry(22, 30, 6), M(0xffffff)); cap.position.set(mtn.position.x, 75, mtn.position.z); this.root.add(cap); }
        }
      }
      // 城コース：溶岩の海
      if (t.props === 'castle') {
        const lava = new THREE.Mesh(new THREE.CircleGeometry(620, 48),
          new THREE.MeshStandardMaterial({ color: 0xff5a1a, emissive: 0xff3000, emissiveIntensity: 0.7, roughness: 0.6 }));
        lava.rotation.x = -Math.PI / 2; lava.position.y = -1.2; this.root.add(lava);
      }
    }

    _buildStarfield() {
      const N = 600;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const a = Math.random() * U.TAU, b = Math.acos(2 * Math.random() - 1);
        const r = 500;
        pos[i * 3] = Math.sin(b) * Math.cos(a) * r;
        pos[i * 3 + 1] = Math.abs(Math.cos(b)) * r * 0.8 + 20;
        pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, fog: false });
      this.root.add(new THREE.Points(geo, mat));
    }

    _scatterProps() {
      const t = this.course.theme;
      const samples = this.track.samples;
      const N = samples.length;
      const step = Math.max(4, Math.floor(N / 90));
      const edge = this.track.wallHalf + 4;
      for (let i = 0; i < N; i += step) {
        const sm = samples[i];
        for (const side of [-1, 1]) {
          if (Math.random() < 0.45) continue;
          const dist = edge + U.randRange(1, 14);
          const px = sm.point.x + sm.normal.x * side * dist;
          const pz = sm.point.z + sm.normal.z * side * dist;
          const prop = this._pickProp(t.props);
          if (!prop) continue;
          prop.position.set(px, sm.point.y, pz);
          prop.rotation.y = Math.random() * U.TAU;
          this.root.add(prop);
        }
      }
      // 雲
      const cloudN = t.props === 'castle' ? 0 : 16;
      for (let i = 0; i < cloudN; i++) {
        const a = Math.random() * U.TAU, r = U.randRange(120, 380);
        const c = Build.cloud();
        c.position.set(Math.cos(a) * r, U.randRange(40, 110), Math.sin(a) * r);
        c.scale.setScalar(U.randRange(2, 5));
        this.root.add(c);
      }
    }

    _pickProp(theme) {
      const r = Math.random();
      if (theme === 'grass') {
        if (r < 0.4) return Build.tree(false);
        if (r < 0.6) return Build.bush();
        if (r < 0.75) { const g = Build.pipe(U.randRange(3, 6)); return g; }
        if (r < 0.9) { const gb = Build.goomba(); this.goombas.push({ mesh: gb, phase: Math.random() * 10, base: null }); return gb; }
        return Build.qblock();
      } else if (theme === 'snow') {
        if (r < 0.4) return Build.tree(true);
        if (r < 0.6) return Build.snowman();
        if (r < 0.8) { const g = Build.pipe(U.randRange(3, 5)); return g; }
        return Build.tree(true);
      } else if (theme === 'castle') {
        if (r < 0.35) { const tor = Build.torch(); this.torches.push(tor); return tor; }
        if (r < 0.6) return Build.statue();
        if (r < 0.8) { const b = Build.lavaBubble(); b.position.y = -0.5; this.bubbles.push({ mesh: b, phase: Math.random() * 10 }); return b; }
        return Build.statue();
      } else if (theme === 'rainbow') {
        if (r < 0.5) { const p = Build.pylon([0xff5d5d, 0x5db9ff, 0xfff04d, 0xc45dff][(Math.random() * 4) | 0]); return p; }
        const s = Build.starProp(); s.position.y = 2 + Math.random() * 3; this.spinners.push({ mesh: s, kind: 'star' }); return s;
      }
      return null;
    }

    _buildStartArea() {
      const sm = this.track.samples[2];
      const gate = Build.startGate(this.course.theme);
      const ang = Math.atan2(sm.tangent.x, sm.tangent.z);
      gate.position.set(sm.point.x, sm.point.y, sm.point.z);
      gate.rotation.y = ang;
      gate.scale.x = this.track.roadHalf / 9;
      this.root.add(gate);
      this.banners.push(gate.userData.banner);

      // スタート/フィニッシュのチェッカー床
      const ctex = U.checkerTexture(8, '#ffffff', '#1a1a1a');
      ctex.wrapS = ctex.wrapT = THREE.RepeatWrapping; ctex.repeat.set(this.track.roadHalf / 2.5, 1);
      const line = new THREE.Mesh(new THREE.PlaneGeometry(this.track.roadHalf * 2, 4),
        new THREE.MeshStandardMaterial({ map: ctex, roughness: 0.7 }));
      line.rotation.x = -Math.PI / 2;
      line.position.set(sm.point.x, sm.point.y + 0.06, sm.point.z);
      line.rotation.z = -ang;
      this.root.add(line);

      // ラキトゥ（信号）
      const lak = Build.lakitu();
      const off = 8;
      lak.position.set(sm.point.x + sm.normal.x * (this.track.roadHalf + off), sm.point.y + 6, sm.point.z + sm.normal.z * (this.track.roadHalf + off));
      lak.rotation.y = ang + Math.PI;
      this.root.add(lak); this.lakitus.push(lak);
      const sig = Build.signal();
      sig.position.set(lak.position.x, lak.position.y - 0.5, lak.position.z + 0.5);
      sig.rotation.y = ang;
      this.root.add(sig); this.signal = sig;
    }

    _placeCoins() {
      if (this.course.theme.props === 'castle') { /* 城は控えめ */ }
      const samples = this.track.samples;
      const N = samples.length;
      const step = Math.max(8, Math.floor(N / 26));
      for (let i = 10; i < N; i += step) {
        const sm = samples[i];
        const lateral = (Math.random() - 0.5) * this.track.roadHalf * 0.8;
        const row = 1 + (Math.random() < 0.4 ? 2 : 0);
        for (let k = 0; k < row; k++) {
          const fwdShift = k * 4;
          const sm2 = samples[(i + Math.round(fwdShift / 1)) % N] || sm;
          const px = sm2.point.x + sm2.normal.x * lateral;
          const pz = sm2.point.z + sm2.normal.z * lateral;
          const coin = Build.coin();
          coin.position.set(px, sm2.point.y + 1.2, pz);
          this.root.add(coin);
          this.coins.push({ mesh: coin, active: true, timer: 0, phase: Math.random() * 10 });
        }
      }
    }

    setSignal(litCount, go) {
      if (!this.signal) return;
      const lamps = this.signal.userData.lamps;
      for (let i = 0; i < lamps.length; i++) {
        const on = (lamps.length - i) <= litCount;
        const mat = lamps[i].material;
        if (go) { mat.color.setHex(0x33dd44); mat.emissive.setHex(0x33dd44); }
        else if (on) { mat.color.setHex(0xff3b30); mat.emissive.setHex(0xff3b30); }
        else { mat.color.setHex(0x551111); mat.emissive.setHex(0x000000); }
      }
    }

    update(dt, karts) {
      const now = performance.now() * 0.001;
      // コイン
      for (const c of this.coins) {
        if (c.active) {
          c.mesh.rotation.y += dt * 3;
          c.mesh.position.y += Math.sin(now * 3 + c.phase) * dt * 0.4;
          for (const k of karts) {
            if (k.finished) continue;
            if (k.group.position.distanceTo(c.mesh.position) < 2.2) {
              c.active = false; c.mesh.visible = false; c.timer = 8;
              this.coinCounters[k.index] = (this.coinCounters[k.index] || 0) + 1;
              k.applyBoost(2.2, 0.25);
              if (k.isPlayer) { MK.audio.coin(); MK.hud && MK.hud.setCoins(this.coinCounters[k.index]); }
              MK.game && MK.game.particles && MK.game.particles.coinPop(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z);
              break;
            }
          }
        } else {
          c.timer -= dt;
          if (c.timer <= 0) { c.active = true; c.mesh.visible = true; }
        }
      }
      // 回転系（虹の星など）
      for (const s of this.spinners) { s.mesh.material.rotation += dt * 1.5; }
      // たいまつ
      for (const t of this.torches) {
        const f = 0.85 + Math.sin(now * 18 + t.position.x) * 0.15 + Math.random() * 0.1;
        if (t.userData.flame) t.userData.flame.scale.set(1.4 + f * 0.3, 2.0 + f * 0.6, 1);
        if (t.userData.light) t.userData.light.intensity = 1.0 + f * 0.5;
      }
      // 溶岩バブル
      for (const b of this.bubbles) {
        const y = Math.abs(Math.sin(now * 1.2 + b.phase)) * 2.5 - 0.8;
        b.mesh.position.y = y;
        const sc = 0.7 + Math.sin(now * 4 + b.phase) * 0.2;
        b.mesh.scale.setScalar(sc);
      }
      // ラキトゥの上下
      for (const l of this.lakitus) { l.position.y += Math.sin(now * 1.5 + l.userData.bob) * dt * 0.4; }
      // バナーの揺れ
      for (const bn of this.banners) { bn.rotation.z = Math.sin(now * 1.2) * 0.04; }
      // クリボーの徘徊
      for (const g of this.goombas) {
        if (g.base === null) g.base = g.mesh.position.x;
        g.mesh.position.x = g.base + Math.sin(now * 0.8 + g.phase) * 3;
        g.mesh.rotation.y = Math.cos(now * 0.8 + g.phase) > 0 ? 0.4 : -0.4 + Math.PI;
      }
    }

    reset() {
      this.scene.remove(this.root);
      this.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose()); else o.material.dispose(); }
      });
    }
  }

  MK.Scenery = Scenery;
  MK.SceneryBuild = Build;

})(window.MK);
