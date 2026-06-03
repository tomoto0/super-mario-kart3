/* ============================================================================
 *  scenery.js — マリオ世界の小物 & テーマ環境（地面/空/背景/装飾/コイン）
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;

  function M(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0.02, flatShading: true }, o || {})); }
  function basic(color, o) { return new THREE.MeshBasicMaterial(Object.assign({ color }, o || {})); }

  // スタート/ゴール旗に書くメッセージのテクスチャ（mirror=true で左右反転＝裏面用）
  function bannerTexture(message, bg, mirror) {
    const w = 1024, h = 192;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    if (mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    // 旗の布（テーマ色）
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, bg); grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    // 上下のチェッカー帯（スタート/ゴールの象徴）
    const cs = Math.round(h * 0.16);
    for (let i = 0; i * cs < w; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#1a1a1a';
      ctx.fillRect(i * cs, 0, cs, cs);
      ctx.fillRect(i * cs, h - cs, cs, cs);
    }
    // メッセージ（白＋濃い縁取りでどのテーマでも視認可）
    ctx.font = '900 76px "Trebuchet MS", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText(message, w / 2, h / 2 + 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(message, w / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(cv);
    if ('anisotropy' in tex) tex.anisotropy = 4;
    return tex;
  }

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
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.14, 22),
        new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.22, metalness: 0.8, emissive: 0x6a4a00, emissiveIntensity: 0.4 }));
      c.rotation.x = Math.PI / 2; g.add(c);
      // 明るい縁
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.1, 10, 24),
        new THREE.MeshStandardMaterial({ color: 0xffe98a, roughness: 0.28, metalness: 0.7 }));
      g.add(rim);
      // 中央の窪み（両面）
      const inner = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 8, 18),
        new THREE.MeshStandardMaterial({ color: 0xe0a800, roughness: 0.4, metalness: 0.6 }));
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
      // 滑らかシェーディングのマッシュルーム体
      const sm = (geo, color, o) => new THREE.Mesh(geo, M(color, Object.assign({ flatShading: false, roughness: 0.72 }, o || {})));
      // 頭＋体（栗色のドーム・上が濃い茶）
      const body = sm(new THREE.SphereGeometry(0.95, 24, 18), 0x8a5a2a);
      body.scale.set(1.08, 0.94, 1.0); body.position.y = 0.9; g.add(body);
      // 下半分の明るいフェイス帯
      const faceBand = sm(new THREE.SphereGeometry(0.9, 24, 16, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.5), 0xc28a48);
      faceBand.scale.set(1.06, 0.94, 1.0); faceBand.position.y = 0.9; g.add(faceBand);
      // 底（クリーム）
      const under = sm(new THREE.SphereGeometry(0.86, 22, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), 0xf0d8b0);
      under.position.y = 0.9; g.add(under);
      for (const s of [-1, 1]) {
        const eye = sm(new THREE.SphereGeometry(0.2, 16, 12), 0xffffff); eye.position.set(s * 0.26, 0.98, -0.74); eye.scale.set(0.8, 1.32, 0.55); g.add(eye);
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), basic(0x141414)); p.position.set(s * 0.2, 0.94, -0.86); g.add(p);
        // 怒り眉（内側に大きく傾斜）
        const brow = sm(new THREE.BoxGeometry(0.44, 0.14, 0.12), 0x2a1a0a); brow.position.set(s * 0.28, 1.2, -0.76); brow.rotation.z = -s * 0.62; g.add(brow);
        const foot = sm(new THREE.SphereGeometry(0.34, 14, 10), 0x3f280f); foot.scale.set(1, 0.5, 1.5); foot.position.set(s * 0.43, 0.12, 0.0); g.add(foot);
      }
      // 口（しかめっ面）＋中央の牙
      for (const s of [-1, 1]) { const mh = sm(new THREE.BoxGeometry(0.36, 0.1, 0.09), 0x231405); mh.position.set(s * 0.17, 0.62, -0.9); mh.rotation.z = -s * 0.34; g.add(mh); }
      for (const s of [-1, 1]) { const fang = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.17, 8), basic(0xffffff)); fang.position.set(s * 0.1, 0.55, -0.9); fang.rotation.x = Math.PI; g.add(fang); }
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
      g.userData.flame = flame; g.userData.light = light; g.userData.flameBase = [1.6, 2.4];
      return g;
    },
    lavaBubble() {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0xff6a1a, emissive: 0xff3a00, emissiveIntensity: 0.9, roughness: 0.5 }));
      return m;
    },
    // 溶岩から立ち上がる石柱（高架通路を支える城内の柱・上に篝火）
    castlePillar() {
      const g = new THREE.Group();
      const h = 34;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.2, h, 10), M(0x453f4b)); g.add(col);
      for (let i = 0; i < 5; i++) { const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.95, 1.2, 10), M(0x352f3a)); ring.position.y = -h / 2 + 4 + i * 7; g.add(ring); }
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.7, 1.0, 10), M(0x4f4956)); cap.position.y = h / 2 - 0.3; g.add(cap);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.6, 0.9, 10), M(0x241c22)); bowl.position.y = h / 2 + 0.6; g.add(bowl);
      const tex = U.softCircleTexture('rgba(255,185,55,1)', 'rgba(255,70,0,0)');
      const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffae33 }));
      flame.scale.set(2.6, 3.8, 1); flame.position.y = h / 2 + 2.4; g.add(flame);
      // ※ 柱ごとに PointLight を持たせると城コースで光源が数十個になり激重化するため、
      //   光源は持たせず加算発光の炎スプライトで「灯り」を表現する（溶岩面の点光源で全体を照らす）。
      g.userData.flame = flame; g.userData.flameBase = [2.6, 3.8];
      return g;
    },
    // 草原の花
    flower(color) {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.0, 6), M(0x2f9d3a)); stem.position.y = 0.5; g.add(stem);
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), M(0xffe14d)); center.position.y = 1.05; g.add(center);
      for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU; const pet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M(color)); pet.scale.set(1, 0.4, 1.5); pet.position.set(Math.cos(a) * 0.28, 1.05, Math.sin(a) * 0.28); g.add(pet); }
      return g;
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
    // ピーチ城（草原の遠景ランドマーク）
    peachCastle() {
      const g = new THREE.Group();
      const wall = 0xfdeef5, brick = 0xf3c4da, roof = 0xe24a8a;
      const base = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 24), M(brick)); base.position.y = 3.5; g.add(base);
      const keep = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8.5, 16, 14), M(wall)); keep.position.y = 13; g.add(keep);
      const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(9, 11, 14), M(roof)); keepRoof.position.y = 26; g.add(keepRoof);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), M(0xffd24a, { emissive: 0x6a4a00, emissiveIntensity: 0.3 })); finial.position.y = 32; g.add(finial);
      for (const t of [[-10, -10, 13, 3], [10, -10, 13, 3], [-10, 10, 11, 2.6], [10, 10, 11, 2.6]]) {
        const tw = new THREE.Mesh(new THREE.CylinderGeometry(t[3], t[3] * 1.12, t[2], 12), M(wall)); tw.position.set(t[0], t[2] / 2 + 1, t[1]); g.add(tw);
        const tr = new THREE.Mesh(new THREE.ConeGeometry(t[3] * 1.3, t[3] * 2.4, 12), M(roof)); tr.position.set(t[0], t[2] + 1 + t[3] * 1.2, t[1]); g.add(tr);
      }
      const win = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd24a, emissiveIntensity: 0.5 })); win.position.set(0, 13, -8.55); g.add(win);
      const gate = new THREE.Mesh(new THREE.BoxGeometry(4.5, 6, 1), M(0x9a4060)); gate.position.set(0, 3.5, -12.05); g.add(gate);
      return g;
    },
    // かまくら（雪原）
    igloo() {
      const g = new THREE.Group();
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 10, 0, U.TAU, 0, Math.PI * 0.5), M(0xeaf4ff)); dome.position.y = 0.02; g.add(dome);
      for (let i = 0; i < 3; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4 - i * 0.55, 0.06, 6, 18, Math.PI), M(0xcfe6f7)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.4 + i * 0.7; g.add(ring); }
      const entry = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 10, 1, true, 0, Math.PI), M(0xdfeefc)); entry.rotation.z = Math.PI / 2; entry.position.set(0, 0.9, -2.4); g.add(entry);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.8, 12), basic(0x3a5a7a)); hole.position.set(0, 0.9, -3.0); g.add(hole);
      return g;
    },
    // クッパの塔（城の遠景シルエット）
    bowserKeep() {
      const g = new THREE.Group();
      const stone = 0x35313b, dark = 0x241f29;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(6, 8.5, 32, 10), M(stone)); body.position.y = 16; g.add(body);
      for (let i = 0; i < 8; i++) { const a = i / 8 * U.TAU; const m = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.6, 1.7), M(stone)); m.position.set(Math.cos(a) * 6.4, 32.5, Math.sin(a) * 6.4); g.add(m); }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 10, 10), M(dark)); roof.position.y = 38; g.add(roof);
      for (const s of [-1, 1]) { const horn = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.2, 8), M(0xf2ead2)); horn.position.set(s * 2.6, 41, 0); horn.rotation.z = s * -0.3; g.add(horn); }
      for (const s of [-1, 1]) { const eye = new THREE.Mesh(new THREE.CircleGeometry(1.0, 10), new THREE.MeshStandardMaterial({ color: 0xff5a1a, emissive: 0xff2a00, emissiveIntensity: 1.0 })); eye.position.set(s * 2.2, 23, -6.05); g.add(eye); }
      return g;
    },
    // ウォンプ（怒り顔の石壁ブロック・城）
    whompBlock() {
      const g = new THREE.Group();
      const block = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.4, 1.5), M(0x6a6470)); block.position.y = 2.7; g.add(block);
      const face = new THREE.Mesh(new THREE.BoxGeometry(3.5, 4.5, 0.2), M(0x837e88)); face.position.set(0, 2.9, -0.78); g.add(face);
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffe6e6, emissive: 0xff2a00, emissiveIntensity: 0.95 })); eye.scale.set(1, 0.8, 0.5); eye.position.set(s * 0.85, 3.5, -0.86); g.add(eye);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), basic(0x1a0000)); pupil.position.set(s * 0.9, 3.4, -1.02); g.add(pupil);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.32, 0.2), M(0x45414c)); brow.position.set(s * 0.85, 4.05, -0.9); brow.rotation.z = -s * 0.5; g.add(brow);
      }
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 0.2), basic(0x2a0e0e)); mouth.position.set(0, 1.95, -0.9); g.add(mouth);
      for (let i = -1; i <= 1; i++) { const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 6), M(0xffffff)); tooth.position.set(i * 0.65, 2.05, -1.0); g.add(tooth); }
      g.userData.isWhomp = true;
      return g;
    },
    // 環のある惑星（虹の遠景）
    ringedPlanet(color, r) {
      const g = new THREE.Group();
      const pl = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), M(color, { emissive: color, emissiveIntensity: 0.28 })); g.add(pl);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.7, r * 0.16, 8, 32), new THREE.MeshStandardMaterial({ color: 0xffe7b0, emissive: 0xffcf80, emissiveIntensity: 0.45, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); ring.rotation.x = Math.PI / 2.4; g.add(ring);
      return g;
    },
    lakitu() {
      const g = new THREE.Group();
      const skin = 0xf3d24a, shellG = 0x2fae4a, cream = 0xf3e6b0;
      const sm = (geo, color, o) => new THREE.Mesh(geo, M(color, Object.assign({ flatShading: false }, o || {})));
      // 雲（顔つき）
      const cloud = new THREE.Group();
      const cmat = M(0xffffff, { flatShading: false, roughness: 0.95, metalness: 0 });
      [[0, 0, 0, 1.5], [1.35, -0.12, 0, 1.05], [-1.35, -0.12, 0, 1.05], [0.8, 0.22, 0.7, 0.92], [-0.8, 0.22, -0.6, 0.92], [0, -0.05, 0.95, 0.86], [0, 0.12, -0.9, 0.86]]
        .forEach((p) => { const s = new THREE.Mesh(new THREE.SphereGeometry(p[3], 16, 12), cmat); s.position.set(p[0], p[1], p[2]); s.scale.y = 0.78; cloud.add(s); });
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), basic(0x33405a)); e.position.set(s * 0.3, 0.05, -1.42); cloud.add(e); }
      const smile = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 14, Math.PI), M(0x33405a, { flatShading: false })); smile.position.set(0, -0.12, -1.42); smile.rotation.z = Math.PI; cloud.add(smile);
      g.add(cloud); g.userData.cloud = cloud;
      // 乗り手（ジュゲム）— 緑甲羅＋黄土色の頭＋丸メガネ
      const rider = new THREE.Group(); rider.position.y = 0.92; g.add(rider);
      const body = sm(new THREE.SphereGeometry(0.5, 16, 14), skin); body.scale.set(1, 0.92, 1); body.position.y = 0.42; rider.add(body);
      const shell = sm(new THREE.SphereGeometry(0.6, 18, 16), shellG); shell.scale.set(1.05, 1.05, 0.78); shell.position.set(0, 0.56, 0.34); rider.add(shell);
      const shellRim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 10, 20), M(cream, { flatShading: false })); shellRim.rotation.x = Math.PI / 2 - 0.2; shellRim.position.set(0, 0.4, 0.3); rider.add(shellRim);
      const head = sm(new THREE.SphereGeometry(0.46, 16, 14), skin); head.position.set(0, 1.04, -0.06); rider.add(head);
      const beak = sm(new THREE.ConeGeometry(0.17, 0.3, 12), 0xe8901f); beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.98, -0.5); rider.add(beak);
      // 丸メガネ（オレンジ縁＋レンズ＋瞳）
      for (const s of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 8, 16), M(0xff9b2f, { flatShading: false })); rim.position.set(s * 0.21, 1.1, -0.42); rider.add(rim);
        const lens = sm(new THREE.SphereGeometry(0.14, 12, 10), 0xeaf6ff); lens.scale.set(1, 1, 0.4); lens.position.set(s * 0.21, 1.1, -0.46); rider.add(lens);
        const pup = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), basic(0x1a1a1a)); pup.position.set(s * 0.21, 1.1, -0.54); rider.add(pup);
      }
      // 腕
      for (const s of [-1, 1]) { const arm = sm(new THREE.SphereGeometry(0.16, 10, 10), skin); arm.scale.set(1, 1.4, 1); arm.position.set(s * 0.52, 0.5, -0.18); arm.rotation.z = s * 0.5; rider.add(arm); }
      g.userData.rider = rider;
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
    // スタート/ゴールのゲート。ポールは路面の左右端に立ち、上部の旗にコース別メッセージ。
    // 配置時 rotation.y=接線角 → ローカル +X が路面の法線(横方向)に一致するので、
    // x=±(roadHalf+margin) で道の左右両側にポールが立つ。
    startGate(roadHalf, theme, message) {
      const g = new THREE.Group();
      const W = roadHalf + 1.3;            // 路肩(縁石)の少し外側
      const postH = 10.5;
      const isCastle = theme.props === 'castle';
      const isRainbow = theme.props === 'rainbow';
      const postCol = isCastle ? 0x4a4550 : isRainbow ? 0xffffff : 0xf3f3f3;
      const trimCol = isCastle ? 0x2a2630 : isRainbow ? 0x66ccff : 0xe23b2e;
      const postMat = M(postCol, { roughness: 0.5, metalness: 0.2 });
      const trimMat = isRainbow ? M(trimCol, { emissive: trimCol, emissiveIntensity: 0.8 }) : M(trimCol, { roughness: 0.5 });
      for (const s of [-1, 1]) {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.7, 14), postMat);
        base.position.set(s * W, 0.35, 0); g.add(base);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, postH, 14), postMat);
        post.position.set(s * W, postH / 2 + 0.4, 0); g.add(post);
        // 赤白のしましま（マリオらしい支柱）
        for (let i = 0; i < 5; i++) {
          const band = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 14), trimMat);
          band.position.set(s * W, 1.2 + i * 1.9, 0); g.add(band);
        }
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.72, 14, 12), trimMat);
        cap.position.set(s * W, postH + 0.7, 0); g.add(cap);
      }
      // 上の横梁（旗を吊る構造材）
      const beam = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 1.4, 0.55, 0.55), postMat);
      beam.position.set(0, postH + 0.5, 0); g.add(beam);

      // メッセージ旗（前後どちらからでも正しく読めるよう、表＝通常／裏＝反転テクスチャ）
      const bw = W * 2 - 0.6, bh = 2.9, bg = theme.bannerColor || '#1b2350';
      const banner = new THREE.Group();
      const geo = new THREE.PlaneGeometry(bw, bh);
      const front = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: bannerTexture(message, bg, false), transparent: true }));
      front.position.z = 0.06;
      const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: bannerTexture(message, bg, true), transparent: true }));
      back.rotation.y = Math.PI; back.position.z = -0.06;
      banner.add(front); banner.add(back);
      banner.position.set(0, postH - 1.5, 0);
      g.add(banner);
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
        const planets = [[0x59b6ff, 40, -300, 120, -200], [0xff8ad6, 28, 250, 90, -260], [0xffd24a, 60, -120, 160, -420], [0x6affc0, 22, 330, 60, -120]];
        planets.forEach((p) => { const pl = Build.planet(p[0], p[1]); pl.position.set(p[2], p[3], p[4]); this.root.add(pl); });
        // 環のある惑星
        const saturn = Build.ringedPlanet(0xc9a0ff, 34); saturn.position.set(300, 130, -130); saturn.rotation.z = 0.35; this.root.add(saturn);
        // 銀河の中心（淡く光るネビュラ）
        const core = new THREE.Mesh(new THREE.SphereGeometry(95, 20, 16), new THREE.MeshBasicMaterial({ color: 0x6a4aff, transparent: true, opacity: 0.16, fog: false })); core.position.set(-170, 190, -470); this.root.add(core);
        const core2 = new THREE.Mesh(new THREE.SphereGeometry(46, 18, 14), new THREE.MeshBasicMaterial({ color: 0xff8ad6, transparent: true, opacity: 0.22, fog: false })); core2.position.set(-170, 190, -470); this.root.add(core2);
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
      // 草原：遠景にピーチ城
      if (t.props === 'grass') {
        const castle = Build.peachCastle();
        castle.position.set(95, 0, -300); castle.rotation.y = -0.32; castle.scale.setScalar(2.4);
        this.root.add(castle);
      }
      // 雪原：巨大な氷山
      if (t.props === 'snow') {
        for (const p of [[-185, -255, 1.3], [215, -175, 1.05], [-55, -325, 1.5]]) {
          const berg = new THREE.Mesh(new THREE.ConeGeometry(40, 96, 5), M(0xeaf4ff, { roughness: 0.45 })); berg.position.set(p[0], 18, p[1]); berg.scale.setScalar(p[2]); this.root.add(berg);
          const cap = new THREE.Mesh(new THREE.ConeGeometry(15, 30, 5), M(0xffffff)); cap.position.set(p[0], 18 + 33 * p[2], p[1]); cap.scale.setScalar(p[2]); this.root.add(cap);
        }
      }
      // 城コース：高架の通路の下に広がる溶岩の海
      if (t.props === 'castle') {
        const lavaTex = U.makeCanvasTexture(256, (ctx, s) => {
          ctx.fillStyle = '#ff5210'; ctx.fillRect(0, 0, s, s);
          ctx.fillStyle = '#ffd24a';
          for (let i = 0; i < 28; i++) { ctx.globalAlpha = 0.4 + Math.random() * 0.55; const x = Math.random() * s, y = Math.random() * s, r = 4 + Math.random() * 16; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
          ctx.globalAlpha = 1; ctx.strokeStyle = '#9a1f00'; ctx.lineWidth = 3;
          for (let i = 0; i < 22; i++) { ctx.beginPath(); ctx.moveTo(Math.random() * s, Math.random() * s); ctx.lineTo(Math.random() * s, Math.random() * s); ctx.stroke(); }
        });
        lavaTex.wrapS = lavaTex.wrapT = THREE.RepeatWrapping; lavaTex.repeat.set(10, 10);
        const lava = new THREE.Mesh(new THREE.CircleGeometry(690, 56),
          new THREE.MeshStandardMaterial({ map: lavaTex, emissive: 0xff3400, emissiveIntensity: 0.85, emissiveMap: lavaTex, roughness: 0.5, metalness: 0.0 }));
        lava.rotation.x = -Math.PI / 2; lava.position.y = -6; this.root.add(lava);
        this.lavaMesh = lava; this.lavaTex = lavaTex;
        // 溶岩からの照り返し
        for (let i = 0; i < 5; i++) { const a = i / 5 * U.TAU; const pl = new THREE.PointLight(0xff5a1a, 0.7, 220); pl.position.set(Math.cos(a) * 130, 0, Math.sin(a) * 130); this.root.add(pl); }
        // 遠景：クッパの塔
        for (const p of [[-225, -185, 1.7], [245, -120, 1.5], [55, -345, 2.0], [-300, 60, 1.6]]) {
          const keep = Build.bowserKeep(); keep.position.set(p[0], -6, p[1]); keep.scale.setScalar(p[2]); keep.rotation.y = Math.random() * U.TAU; this.root.add(keep);
        }
        // 周囲を囲む城壁（歯壁＋埋め込まれたウォンプ）
        const ringR = 250, segN = 44;
        for (let i = 0; i < segN; i++) {
          const a = i / segN * U.TAU, cx = Math.cos(a) * ringR, cz = Math.sin(a) * ringR;
          const seg = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 9), M(0x35313b)); seg.position.set(cx, 7, cz); seg.rotation.y = -a; this.root.add(seg);
          const mer = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 9), M(0x2a2630)); mer.position.set(cx, 24, cz); mer.rotation.y = -a; this.root.add(mer);
          if (i % 7 === 3) {
            const wh = Build.whompBlock(); wh.position.set(Math.cos(a) * (ringR - 7), 9, Math.sin(a) * (ringR - 7));
            wh.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); wh.scale.setScalar(2.6); this.root.add(wh);
          }
        }
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
      const skip = t.props === 'castle' ? 0.8 : t.props === 'rainbow' ? 0.55 : 0.42;
      for (let i = 0; i < N; i += step) {
        const sm = samples[i];
        for (const side of [-1, 1]) {
          if (Math.random() < skip) continue;
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
        if (r < 0.34) return Build.tree(false);
        if (r < 0.5) return Build.bush();
        if (r < 0.66) { const fc = ['#ff5d8a', '#ff8a2a', '#ffe14d', '#9b6bff', '#ffffff'][(Math.random() * 5) | 0]; return Build.flower(fc); }
        if (r < 0.78) { const g = Build.pipe(U.randRange(3, 6)); return g; }
        if (r < 0.9) { const gb = Build.goomba(); this.goombas.push({ mesh: gb, phase: Math.random() * 10, base: null }); return gb; }
        return Build.qblock();
      } else if (theme === 'snow') {
        if (r < 0.34) return Build.tree(true);
        if (r < 0.5) return Build.snowman();
        if (r < 0.66) return Build.igloo();
        if (r < 0.82) { const g = Build.pipe(U.randRange(3, 5)); return g; }
        return Build.tree(true);
      } else if (theme === 'castle') {
        if (r < 0.66) { const p = Build.castlePillar(); this.torches.push(p); return p; }
        const b = Build.lavaBubble(); this.bubbles.push({ mesh: b, phase: Math.random() * 10, baseY: -5.5 }); return b;
      } else if (theme === 'rainbow') {
        if (r < 0.5) { const p = Build.pylon([0xff5d5d, 0x5db9ff, 0xfff04d, 0xc45dff][(Math.random() * 4) | 0]); return p; }
        const s = Build.starProp(); s.position.y = 2 + Math.random() * 3; this.spinners.push({ mesh: s, kind: 'star' }); return s;
      }
      return null;
    }

    _buildStartArea() {
      const sm = this.track.samples[2];
      const message = this.course.banner || 'START / FINISH';
      const gate = Build.startGate(this.track.roadHalf, this.course.theme, message);
      const ang = Math.atan2(sm.tangent.x, sm.tangent.z);
      gate.position.set(sm.point.x, sm.point.y, sm.point.z);
      gate.rotation.y = ang;
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
      // たいまつ / 篝火
      for (const t of this.torches) {
        const f = 0.85 + Math.sin(now * 18 + t.position.x) * 0.15 + Math.random() * 0.1;
        const fb = t.userData.flameBase || [1.4, 2.0];
        if (t.userData.flame) t.userData.flame.scale.set(fb[0] * (0.92 + f * 0.14), fb[1] * (0.9 + f * 0.18), 1);
        if (t.userData.light) t.userData.light.intensity = 0.9 + f * 0.5;
      }
      // 溶岩バブル（溶岩面から立ち上る）
      for (const b of this.bubbles) {
        const base = b.baseY != null ? b.baseY : -0.5;
        b.mesh.position.y = base + Math.abs(Math.sin(now * 1.2 + b.phase)) * 3.0;
        const sc = 0.7 + Math.sin(now * 4 + b.phase) * 0.2;
        b.mesh.scale.setScalar(sc);
      }
      // 溶岩面の脈動・流動
      if (this.lavaMesh) {
        this.lavaMesh.material.emissiveIntensity = 0.72 + Math.sin(now * 0.8) * 0.18;
        if (this.lavaTex) { this.lavaTex.offset.x = now * 0.012; this.lavaTex.offset.y = now * 0.008; }
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
      U.disposeObject(this.root);
    }
  }

  MK.Scenery = Scenery;
  MK.SceneryBuild = Build;

})(window.MK);
