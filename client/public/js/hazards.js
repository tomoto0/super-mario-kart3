/* ============================================================================
 *  hazards.js — コース上の敵キャラ（カートをクラッシュさせる障害物）
 *  テーマ別:  grass=クリボー/パックン  snow=ペンギン
 *            castle=ドッスン/ファイアバー  rainbow=ワンワン
 *  被弾でスピン/吹っ飛び（スター・無敵中は無効）。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;
  const C = MK.CONFIG;

  function M(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.62, metalness: 0.04 }, o || {})); }
  function basic(color, o) { return new THREE.MeshBasicMaterial(Object.assign({ color }, o || {})); }
  function box(w, h, d, c, o) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o)); }
  function sph(r, c, seg, o) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg || 14, seg || 10), M(c, o)); }
  function cyl(rt, rb, h, c, s) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s || 12), M(c)); }
  function cone(r, h, c, s) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, s || 10), M(c)); }
  function eyes(g, y, z, sep, look) {
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), basic(0xffffff));
      w.position.set(s * sep, y, z); w.scale.set(0.8, 1.2, 0.6); g.add(w);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), basic(0x18181f));
      p.position.set(s * sep + (look || 0) * 0.02, y, z - 0.12); g.add(p);
    }
  }
  function glowSprite(color, size) {
    const tex = U.softCircleTexture('rgba(255,210,120,1)', 'rgba(255,80,0,0)');
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: color || 0xffae33 }));
    s.scale.set(size || 2, size || 2, 1); return s;
  }
  function blob(r) {
    const tex = U.softCircleTexture('rgba(0,0,0,0.5)', 'rgba(0,0,0,0)');
    const m = new THREE.Mesh(new THREE.CircleGeometry(r || 2, 18), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.6 }));
    m.rotation.x = -Math.PI / 2; return m;
  }

  /* ---- 敵メッシュ ---- */
  const Build = {
    piranha() {
      const g = new THREE.Group();
      const pipe = cyl(1.0, 1.0, 1.4, 0x2fae4a, 14); pipe.position.y = 0.7; g.add(pipe);
      const rim = cyl(1.2, 1.2, 0.4, 0x36c957, 14); rim.position.y = 1.4; g.add(rim);
      const stalk = new THREE.Group(); stalk.position.y = 1.4; g.add(stalk);
      const stem = cyl(0.18, 0.22, 1.6, 0x3fa83f, 8); stem.position.y = 0.8; stalk.add(stem);
      for (const s of [-1, 1]) { const leaf = cone(0.3, 0.7, 0x4fd33d, 6); leaf.position.set(s * 0.4, 0.7, 0); leaf.rotation.z = s * 1.1; stalk.add(leaf); }
      const head = new THREE.Group(); head.position.y = 1.7; stalk.add(head);
      const bulb = sph(0.66, 0xe2342a, 18); bulb.scale.set(1.05, 1.0, 1.0); head.add(bulb);
      // 白い水玉（前面の上半分にオーバル）
      [[-0.34, 0.34], [0.34, 0.34], [0, 0.52], [-0.52, 0.04], [0.52, 0.04], [0, 0.0]].forEach((p) => {
        const sp = sph(0.14, 0xffffff, 12); sp.scale.set(1.1, 0.85, 0.4); sp.position.set(p[0], p[1], -0.5); head.add(sp);
      });
      // 暗い口内
      const mouth = sph(0.42, 0x6b0f0a, 14); mouth.position.set(0, -0.06, -0.46); mouth.scale.set(1.05, 0.78, 0.65); head.add(mouth);
      // 白い唇（リング状）
      const lips = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.12, 10, 22), M(0xffffff)); lips.position.set(0, -0.04, -0.52); lips.scale.set(1.05, 0.82, 0.7); head.add(lips);
      // 白い牙（上下）
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * 0.17;
        const tT = cone(0.055, 0.18, 0xffffff, 8); tT.rotation.x = Math.PI; tT.position.set(x, 0.12, -0.58); head.add(tT);
        const tB = cone(0.055, 0.18, 0xffffff, 8); tB.position.set(x, -0.2, -0.58); head.add(tB);
      }
      g.userData.stalk = stalk; g.userData.head = head;
      return g;
    },
    penguin() {
      const g = new THREE.Group();
      const body = sph(0.6, 0x2b2f3a, 14); body.scale.set(1, 1.25, 1); body.position.y = 0.75; g.add(body);
      const belly = sph(0.45, 0xffffff, 14); belly.scale.set(0.85, 1.1, 0.5); belly.position.set(0, 0.7, -0.3); g.add(belly);
      const head = sph(0.42, 0x2b2f3a, 14); head.position.y = 1.45; g.add(head);
      const face = sph(0.3, 0xffffff, 12); face.scale.set(0.9, 0.9, 0.5); face.position.set(0, 1.42, -0.26); g.add(face);
      const beak = cone(0.16, 0.34, 0xff8a2a, 8); beak.position.set(0, 1.38, -0.5); beak.rotation.x = -Math.PI / 2; g.add(beak);
      eyes(g, 1.55, -0.32, 0.15, 1);
      for (const s of [-1, 1]) {
        const flip = sph(0.16, 0x2b2f3a, 8); flip.scale.set(0.5, 1.3, 0.7); flip.position.set(s * 0.6, 0.75, 0); g.add(flip);
        const foot = box(0.34, 0.12, 0.5, 0xff8a2a); foot.position.set(s * 0.25, 0.06, -0.2); g.add(foot);
      }
      return g;
    },
    thwomp() {
      const g = new THREE.Group();
      const stone = 0x8a92b4, stoneD = 0x5b6488, face = 0x6f7aa0;
      const block = box(2.0, 2.4, 1.5, stone); block.position.y = 1.2; g.add(block);
      // 全周の石トゲ（上下左右の縁すべて）
      const spike = (x, y, rz) => { const s = cone(0.2, 0.38, stoneD, 4); s.position.set(x, y, -0.08); s.rotation.z = rz; g.add(s); };
      for (let i = 0; i < 4; i++) { const x = -0.78 + i * 0.52; spike(x, 2.48, 0); spike(x, -0.08, Math.PI); }
      for (let i = 0; i < 3; i++) { const y = 0.5 + i * 0.7; spike(-1.07, y, Math.PI / 2); spike(1.07, y, -Math.PI / 2); }
      // 凹んだ顔プレート（前面 -Z）
      const plate = box(1.62, 1.9, 0.16, face); plate.position.set(0, 1.2, -0.78); g.add(plate);
      // 怒り眉
      for (const s of [-1, 1]) { const brow = box(0.64, 0.17, 0.16, stoneD); brow.position.set(s * 0.36, 1.72, -0.92); brow.rotation.z = -s * 0.62; g.add(brow); }
      // 白目（怒り）＋黒目
      eyes(g, 1.44, -0.9, 0.34, 1);
      // 食いしばった歯（白い歯＋縦の歯間＋上下の境目）
      const mouth = box(1.24, 0.58, 0.1, 0xffffff); mouth.position.set(0, 0.74, -0.9); g.add(mouth);
      for (let i = -2; i <= 2; i++) { const t = box(0.07, 0.58, 0.13, 0x3a4264); t.position.set(i * 0.26, 0.74, -0.93); g.add(t); }
      const midline = box(1.24, 0.08, 0.13, 0x3a4264); midline.position.set(0, 0.74, -0.93); g.add(midline);
      return g;
    },
    fireball() {
      const g = new THREE.Group();
      const core = sph(0.45, 0xffd24a, 12, { emissive: 0xff6a1a, emissiveIntensity: 1.0 });
      g.add(core); g.add(glowSprite(0xffae33, 1.8));
      return g;
    },
    chompBall() {
      const g = new THREE.Group();
      const R = 1.0;
      const ball = sph(R, 0x23232b, 24, { metalness: 0.4, roughness: 0.4 }); g.add(ball);
      // 大きく開いた赤い口（黒球の前面にほぼ面一）＋舌
      const mouth = sph(0.54, 0xcc1818, 18, { roughness: 0.55 }); mouth.position.set(0, -0.18, -0.86); mouth.scale.set(1.16, 1.02, 0.34); g.add(mouth);
      const tongue = sph(0.24, 0xff5a6a, 12); tongue.position.set(0, -0.34, -1.04); tongue.scale.set(1.05, 0.55, 0.5); g.add(tongue);
      // 口を囲む大きな牙（球面に沿わせ、先端を口の中心へ）
      const nT = 14, rr = 0.6, ymc = -0.18;
      for (let i = 0; i < nT; i++) {
        const a = (i / nT) * U.TAU;
        const fx = Math.cos(a) * rr, fy = ymc + Math.sin(a) * rr;
        const zs = -Math.sqrt(Math.max(0.12, R * R - fx * fx - fy * fy));
        const tooth = cone(0.13, 0.4, 0xffffff, 8);
        tooth.position.set(fx, fy, zs + 0.05);
        tooth.rotation.z = a + Math.PI / 2;
        g.add(tooth);
      }
      // 大きな目（白＋黒目＋ハイライト）＋つり上がった眉
      for (const s of [-1, 1]) {
        const eye = sph(0.31, 0xffffff, 16); eye.scale.set(0.95, 1.1, 0.6); eye.position.set(s * 0.33, 0.52, -0.84); g.add(eye);
        const pup = sph(0.14, 0x111118, 12); pup.position.set(s * 0.35, 0.48, -1.05); g.add(pup);
        const hi = sph(0.05, 0xffffff, 8); hi.position.set(s * 0.28, 0.58, -1.11); g.add(hi);
        const brow = box(0.42, 0.12, 0.13, 0x101017); brow.position.set(s * 0.33, 0.83, -0.66); brow.rotation.z = -s * 0.36; g.add(brow);
      }
      // 留め金（チェーンの付け根）
      const bolt = sph(0.2, 0xc2c6cf, 10, { metalness: 0.7, roughness: 0.3 }); bolt.position.set(0, 0.8, 0.62); g.add(bolt);
      return g;
    },
    chompPost() {
      const g = new THREE.Group();
      const post = cyl(0.22, 0.28, 1.6, 0x8a8f99, 10); post.position.y = 0.8; g.add(post);
      const cap = sph(0.3, 0xb8bcc4, 10, { metalness: 0.6, roughness: 0.3 }); cap.position.y = 1.6; g.add(cap);
      return g;
    },
    // --- 草原：モグラ（穴から飛び出す）---
    montyMole() {
      const g = new THREE.Group();
      const mound = new THREE.Mesh(new THREE.SphereGeometry(1.35, 16, 8, 0, U.TAU, 0, Math.PI * 0.5), M(0x6f4521));
      mound.scale.set(1, 0.42, 1); mound.position.y = 0.02; g.add(mound);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.22, 8, 16), M(0x4f3018)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.04; g.add(ring);
      const mole = new THREE.Group();
      const body = sph(0.56, 0x8a6a4a, 12); body.scale.set(1, 1.1, 1); body.position.y = 0.5; mole.add(body);
      const belly = sph(0.4, 0xf0d8b8, 12); belly.scale.set(0.8, 1.0, 0.5); belly.position.set(0, 0.45, -0.3); mole.add(belly);
      const snout = sph(0.26, 0xf0d0b0, 10); snout.scale.set(1.1, 0.8, 1.2); snout.position.set(0, 0.5, -0.5); mole.add(snout);
      const noseTip = sph(0.13, 0xe07a6a, 8); noseTip.position.set(0, 0.5, -0.7); mole.add(noseTip);
      eyes(mole, 0.78, -0.46, 0.16, 1);
      for (const s of [-1, 1]) { const claw = box(0.2, 0.16, 0.34, 0xedeff4); claw.position.set(s * 0.42, 0.16, -0.42); mole.add(claw); }
      mole.position.y = -1.0; g.add(mole); g.userData.mole = mole;
      return g;
    },
    // --- 草原：ノコノコ（左右に歩く）---
    koopa() {
      const g = new THREE.Group();
      const skin = 0xf3d24a, beakCol = 0xe88a20, boot = 0x2fae4a, shellG = 0x2fae4a, cream = 0xf3e6b0;
      // 緑のブーツ＋脚
      for (const s of [-1, 1]) {
        const leg = cyl(0.17, 0.19, 0.34, skin, 10); leg.position.set(s * 0.27, 0.34, 0.04); g.add(leg);
        const shoe = sph(0.26, boot, 12); shoe.scale.set(1.0, 0.7, 1.45); shoe.position.set(s * 0.27, 0.12, -0.06); g.add(shoe);
      }
      // クリーム色の腹甲
      const belly = sph(0.52, cream, 16); belly.scale.set(0.92, 1.0, 0.62); belly.position.set(0, 0.84, -0.32); g.add(belly);
      // 緑の甲羅（背中）＋クリームのリム
      const shell = sph(0.66, shellG, 18); shell.scale.set(1.12, 1.06, 0.94); shell.position.set(0, 0.94, 0.16); g.add(shell);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.14, 10, 22), M(cream)); rim.rotation.x = Math.PI / 2 - 0.18; rim.position.set(0, 0.76, 0.14); g.add(rim);
      // 甲羅の六角模様（濃緑）
      const segMat = M(0x1c7a34);
      const topHex = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.08, 6), segMat); topHex.position.set(0, 1.24, 0.18); g.add(topHex);
      for (let i = 0; i < 5; i++) { const a = i / 5 * U.TAU + 0.3; const hx = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.06, 6), segMat); hx.position.set(Math.cos(a) * 0.44, 1.02, Math.sin(a) * 0.4 + 0.18); g.add(hx); }
      // 小さな腕
      for (const s of [-1, 1]) { const arm = sph(0.16, skin, 10); arm.scale.set(1, 1.3, 1); arm.position.set(s * 0.56, 0.86, -0.18); g.add(arm); }
      // 首・頭
      const neck = cyl(0.19, 0.22, 0.34, skin, 10); neck.position.set(0, 1.2, -0.16); g.add(neck);
      const head = sph(0.4, skin, 16); head.scale.set(1.0, 0.96, 1.05); head.position.set(0, 1.5, -0.2); g.add(head);
      // くちばし（上下＋小さな鼻穴）
      const beakT = cone(0.2, 0.34, beakCol, 12); beakT.position.set(0, 1.46, -0.56); beakT.rotation.x = -Math.PI / 2; g.add(beakT);
      const beakB = box(0.26, 0.1, 0.22, beakCol); beakB.position.set(0, 1.36, -0.52); g.add(beakB);
      eyes(g, 1.62, -0.46, 0.16, 1);
      // 眉
      for (const s of [-1, 1]) { const brow = box(0.2, 0.06, 0.08, 0x7a5a12); brow.position.set(s * 0.18, 1.78, -0.5); brow.rotation.z = -s * 0.25; g.add(brow); }
      g.userData.head = head;
      return g;
    },
    // --- 雪：練り歩く雪だるま ---
    snowman() {
      const g = new THREE.Group();
      const snow = (r, y) => { const m = sph(r, 0xfbfdff, 18, { roughness: 0.92 }); m.position.y = y; g.add(m); return m; };
      snow(0.85, 0.82);                    // 胴（下）
      snow(0.6, 1.85);                     // 胴（上）
      const head = snow(0.45, 2.7);        // 頭
      // 目（炭）
      for (const s of [-1, 1]) { const e = sph(0.075, 0x20242c, 10); e.position.set(s * 0.16, 2.8, -0.4); g.add(e); }
      // にんじんの鼻
      const nose = cone(0.1, 0.42, 0xff8a2a, 10); nose.rotation.x = -Math.PI / 2; nose.position.set(0, 2.68, -0.5); g.add(nose);
      // 炭の口（弧）
      for (let i = 0; i < 5; i++) { const a = -0.6 + i * 0.3; const m = sph(0.04, 0x20242c, 6); m.position.set(Math.sin(a) * 0.26, 2.54, -0.4); g.add(m); }
      // ボタン（炭）
      for (let i = 0; i < 3; i++) { const b = sph(0.06, 0x20242c, 8); b.position.set(0, 1.58 + i * 0.3, -0.58); g.add(b); }
      // 枝の腕＋小枝
      for (const s of [-1, 1]) {
        const arm = cyl(0.04, 0.05, 1.0, 0x7a4a22, 6); arm.position.set(s * 0.62, 1.95, 0); arm.rotation.z = s * 1.0; g.add(arm);
        const tw = cyl(0.03, 0.03, 0.32, 0x7a4a22, 6); tw.position.set(s * 1.02, 2.2, 0); tw.rotation.z = s * 0.5; g.add(tw);
      }
      // 赤いマフラー＋たれ
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.13, 8, 18), M(0xe23b2e)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 2.32; g.add(scarf);
      const tailEnd = box(0.18, 0.5, 0.12, 0xe23b2e); tailEnd.position.set(0.3, 2.05, -0.22); tailEnd.rotation.z = 0.3; g.add(tailEnd);
      // 黒いシルクハット＋赤帯
      const brim = cyl(0.52, 0.52, 0.07, 0x232831, 18); brim.position.y = 3.12; g.add(brim);
      const top = cyl(0.36, 0.38, 0.55, 0x232831, 18); top.position.y = 3.42; g.add(top);
      const band = cyl(0.385, 0.385, 0.13, 0xe23b2e, 18); band.position.y = 3.2; g.add(band);
      g.userData.head = head;
      return g;
    },
    // --- 雪：落ちてくるつらら ---
    icicle() {
      const g = new THREE.Group();
      const iceMat = new THREE.MeshStandardMaterial({ color: 0xa9dcff, roughness: 0.14, metalness: 0.22, transparent: true, opacity: 0.9 });
      const iceLit = new THREE.MeshStandardMaterial({ color: 0xe9f7ff, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.8 });
      // 主体（大きく長い氷柱）
      const ice = new THREE.Mesh(new THREE.ConeGeometry(0.78, 3.6, 8), iceMat); ice.rotation.x = Math.PI; ice.position.y = -1.8; g.add(ice);
      // つららの節（段々）
      for (let i = 0; i < 3; i++) { const r = 0.66 - i * 0.16; const seg = new THREE.Mesh(new THREE.ConeGeometry(r, 0.55, 8), iceMat); seg.rotation.x = Math.PI; seg.position.y = -0.45 - i * 0.78; g.add(seg); }
      // 光るハイライト筋
      const hi = new THREE.Mesh(new THREE.ConeGeometry(0.2, 2.6, 6), iceLit); hi.rotation.x = Math.PI; hi.position.set(-0.2, -1.4, -0.2); g.add(hi);
      // 付け根の霜（天井に付く部分）
      const frost = sph(0.6, 0xffffff, 14, { roughness: 0.95 }); frost.scale.set(1, 0.45, 1); frost.position.y = 0.12; g.add(frost);
      g.userData.ice = ice;
      return g;
    },
    // --- 城：溶岩から飛び出す火の玉（プクプク）---
    podoboo() {
      const g = new THREE.Group();
      const core = sph(0.72, 0xff8a2a, 14, { emissive: 0xff3a00, emissiveIntensity: 1.0, roughness: 0.4 }); g.add(core);
      const inner = sph(0.5, 0xffe27a, 12, { emissive: 0xffb030, emissiveIntensity: 1.0 }); inner.position.z = -0.2; g.add(inner);
      eyes(g, 0.18, -0.62, 0.2, 1);
      const mouth = box(0.4, 0.1, 0.1, 0x7a1500); mouth.position.set(0, -0.12, -0.66); g.add(mouth);
      g.add(glowSprite(0xff7a2a, 2.8));
      g.userData.core = core;
      return g;
    },
    // --- 城：垂直に噴き上がる炎 ---
    flameJet() {
      const g = new THREE.Group();
      const base = cyl(0.5, 0.72, 0.6, 0x33292f, 10); base.position.y = 0.3; g.add(base);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 8, 14), M(0x59453a)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.6; g.add(ring);
      const flame = new THREE.Group();
      const tex = U.softCircleTexture('rgba(255,205,90,1)', 'rgba(255,60,0,0)');
      for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffae33 })); s.scale.set(1.7, 2.3, 1); s.position.y = 0.9 + i * 1.05; flame.add(s); }
      flame.visible = false; g.add(flame); g.userData.flame = flame;
      return g;
    },
    // --- 虹：横切る彗星 ---
    comet() {
      const g = new THREE.Group();
      // 白熱した核＋暖色の大きな輝き（暗い宇宙でよく目立つ）
      const core = sph(0.6, 0xffffff, 18, { emissive: 0xffd24a, emissiveIntensity: 1.0 }); g.add(core);
      const inner = sph(0.4, 0xfff6e0, 12, { emissive: 0xffffff, emissiveIntensity: 1.0 }); g.add(inner);
      g.add(glowSprite(0xffb84a, 3.6));
      // 炎の尾（後方 +Z へだんだん小さく＝彗星と分かる筋）
      const tailTex = U.softCircleTexture('rgba(255,224,150,1)', 'rgba(255,110,30,0)');
      const tail = new THREE.Group();
      [[1.5, 3.2, 1.9, 0xffd27a, 0.95], [2.9, 2.4, 1.4, 0xffae4a, 0.8], [4.2, 1.7, 0.95, 0xff7a2a, 0.6]].forEach((s) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tailTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: s[3], opacity: s[4] }));
        sp.position.set(0, 0, s[0]); sp.scale.set(s[1], s[2], 1); tail.add(sp);
      });
      g.add(tail);
      g.userData.core = core; g.userData.tail = tail;
      return g;
    },
    // --- 虹：回転するスター・バー（火柱の星版）。fill/outline/coreで色を指定 ---
    starOrb(fill, outline, coreCol, em) {
      const g = new THREE.Group();
      const tex = U.starTexture(fill || '#fff04d', outline);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.set(1.5, 1.5, 1); g.add(s);
      const core = sph(0.3, coreCol || 0xfff7c0, 10, { emissive: em != null ? em : 0xffe14d, emissiveIntensity: 1.0 }); g.add(core);
      return g;
    },
  };

  /* ---- システム ---- */
  class HazardSystem {
    constructor(world) {
      this.world = world;
      this.scene = world.scene;
      this.track = world.track;
      this.root = new THREE.Group();
      this.scene.add(this.root);
      this.hazards = [];
    }

    build(course) {
      const props = course.theme.props;
      this._spinBarN = 0;   // スターバーの色割り当てカウンタ（赤→青→緑）
      this._spawnQueue = []; // ジュゲムが落とすノコノコの遅延スポーン待ち
      this._needCull = false;
      const plans = {
        grass: [['goomba', 3], ['koopa', 2], ['piranha', 2], ['montyMole', 3]],
        snow: [['penguin', 4], ['snowman', 2], ['icicle', 3]],
        castle: [['thwomp', 2], ['firebar', 2], ['podoboo', 3], ['flameJet', 2]],
        rainbow: [['chomp', 2], ['comet', 2], ['spinBar', 3]],
      }[props] || [];

      // 0.15〜0.95 の範囲に種類ごとへ均等配置
      let slot = 0, totalSlots = plans.reduce((a, p) => a + p[1], 0);
      for (const [kind, count] of plans) {
        for (let i = 0; i < count; i++) {
          const f = 0.15 + (slot + 0.5) / totalSlots * 0.78;
          slot++;
          this._add(kind, f, (i % 2 === 0 ? 1 : -1));
        }
      }

      // ジュゲム（ラキトゥ）— 各コースに1匹、上空を旋回しノコノコを落とす
      this._addLakitu();
    }

    _baseIndex(f) { return Math.floor(f * this.track.sampleCount) % this.track.sampleCount; }

    _add(kind, f, side) {
      const idx = this._baseIndex(f);
      const sample = this.track.samples[idx];
      const rh = this.track.roadHalf;
      const hz = {
        kind, side, sample, t: Math.random() * 10, phase: Math.random() * 10,
        dangerous: false, radius: 1.6, effect: 'spin',
        hitPoints: [], markerPos: new THREE.Vector3(), lateral: 0, _p: new THREE.Vector3(),
        _prevDown: false, _baseIndex: idx,
      };

      if (kind === 'goomba') {
        hz.group = MK.SceneryBuild.goomba(); hz.group.scale.setScalar(1.05);
        hz.amp = rh * 0.78; hz.speed = 1.25; hz.radius = 1.5; hz.effect = 'spin';
        hz.hitPoints = [hz._p];
      } else if (kind === 'piranha') {
        hz.group = Build.piranha();
        hz.lateral = (rh - 0.4) * side; hz.radius = 2.3; hz.effect = 'spin';
        hz.hitPoints = [hz._p];
      } else if (kind === 'penguin') {
        hz.group = Build.penguin(); hz.group.scale.setScalar(1.1);
        hz.amp = rh * 0.92; hz.speed = 1.6; hz.radius = 1.6; hz.effect = 'spin';
        hz.hitPoints = [hz._p];
      } else if (kind === 'thwomp') {
        hz.group = Build.thwomp();
        hz.lateral = U.randRange(-rh * 0.45, rh * 0.45); hz.radius = 2.6; hz.effect = 'launch';
        hz.shadow = blob(2.4); this.root.add(hz.shadow);
        hz.cycle = 3.8; hz.hover = 8; hz.y = hz.hover;
        hz.hitPoints = [hz._p];
      } else if (kind === 'firebar') {
        hz.group = new THREE.Group();
        hz.lateral = U.randRange(-rh * 0.3, rh * 0.3); hz.radius = 1.3; hz.effect = 'spin';
        hz.pivot = new THREE.Group(); hz.group.add(hz.pivot);
        hz.balls = []; hz.dists = [2.2, 3.4, 4.6, 5.8]; hz.rot = 1.5 * (side > 0 ? 1 : -1);
        hz._pts = [];
        const hub = cyl(0.5, 0.6, 1.2, 0x3a3a44, 8); hub.position.y = 1.4; hz.group.add(hub);
        for (const d of hz.dists) {
          const fb = Build.fireball(); fb.position.set(d, 1.4, 0); hz.pivot.add(fb); hz.balls.push(fb);
          hz._pts.push(new THREE.Vector3());
        }
        hz.hitPoints = hz._pts;
      } else if (kind === 'chomp') {
        hz.group = new THREE.Group();
        hz.radius = 2.3; hz.effect = 'launch';
        const sm = hz.sample;
        const postLat = (rh + 1.0) * side;
        hz.post = new THREE.Vector3(sm.point.x + sm.normal.x * postLat, sm.point.y, sm.point.z + sm.normal.z * postLat);
        hz.inward = new THREE.Vector3(-sm.normal.x * side, 0, -sm.normal.z * side); // コース中心方向
        const postMesh = Build.chompPost(); postMesh.position.copy(hz.post); hz.group.add(postMesh);
        hz.ball = Build.chompBall(); hz.group.add(hz.ball);
        hz.links = [];
        for (let i = 0; i < 4; i++) { const l = sph(0.2, 0x33343d, 8, { metalness: 0.4 }); hz.group.add(l); hz.links.push(l); }
        hz.reachBase = rh * 0.3; hz.reachAmp = rh * 1.05;
        hz.hitPoints = [hz._p];
      } else if (kind === 'koopa') {
        hz.group = Build.koopa();
        hz.amp = rh * 0.72; hz.speed = 0.95; hz.radius = 1.5; hz.effect = 'spin';
        hz.hitPoints = [hz._p];
      } else if (kind === 'montyMole') {
        hz.group = Build.montyMole();
        hz.lateral = U.randRange(-rh * 0.7, rh * 0.7); hz.radius = 1.5; hz.effect = 'spin';
        hz._yaw = Math.random() * U.TAU; hz.cycle = U.randRange(2.6, 3.8);
        hz.hitPoints = [hz._p];
      } else if (kind === 'snowman') {
        hz.group = Build.snowman(); hz.group.scale.setScalar(0.95);
        hz.amp = rh * 0.78; hz.speed = 0.85; hz.radius = 1.7; hz.effect = 'spin';
        hz.hitPoints = [hz._p];
      } else if (kind === 'icicle') {
        hz.group = Build.icicle();
        hz.lateral = U.randRange(-rh * 0.65, rh * 0.65); hz.radius = 1.7; hz.effect = 'spin';
        hz.hangY = 7.0; hz.cycle = U.randRange(3.4, 4.6); hz.shadow = blob(1.8); this.root.add(hz.shadow);
        hz.hitPoints = [hz._p];
      } else if (kind === 'podoboo') {
        hz.group = Build.podoboo();
        hz.lateral = U.randRange(-rh * 0.55, rh * 0.55); hz.radius = 1.7; hz.effect = 'launch';
        hz.cycle = U.randRange(2.6, 3.6); hz.lavaY = -6; hz.height = (hz.sample.point.y - hz.lavaY) + 4;
        hz.hitPoints = [hz._p];
      } else if (kind === 'flameJet') {
        hz.group = Build.flameJet();
        hz.lateral = (rh - 0.6) * side; hz.radius = 1.5; hz.effect = 'spin';
        hz.cycle = U.randRange(2.2, 3.2);
        hz.hitPoints = [hz._p];
      } else if (kind === 'comet') {
        hz.group = Build.comet();
        hz.radius = 1.9; hz.effect = 'launch';
        hz.bounceH = 8.0; hz.bounceFreq = 0.72;          // 大きな放物線で跳ねる
        hz.travelSpeed = U.randRange(16, 24);             // コースに沿って移動
        hz._f = idx;                                      // 現在のコース位置（サンプル）
        hz._latCur = 0; hz._latTarget = U.randRange(-1, 1) * rh * 0.6;
        hz.shadow = blob(2.0); this.root.add(hz.shadow);
        hz._lastPhase = 0; hz._lastPos = new THREE.Vector3(sample.point.x, sample.point.y, sample.point.z);
        hz.hitPoints = [hz._p];
      } else if (kind === 'spinBar') {
        hz.group = new THREE.Group();
        hz.lateral = U.randRange(-rh * 0.2, rh * 0.2); hz.radius = 1.3; hz.effect = 'spin';
        hz.playerOnly = true; // 回転する星形バーはプレイヤーのみクラッシュ（AIはすり抜ける）
        hz.pivot = new THREE.Group(); hz.group.add(hz.pivot);
        hz.balls = []; hz.dists = [2.1, 3.2, 4.3]; hz.rot = 1.05 * (side > 0 ? 1 : -1); hz._pts = [];
        // 赤／青／緑をバーごとに割り当て（各所で色が変わる）
        const STARBAR = [
          { fill: '#ff5d5d', out: '#9a1f1f', core: 0xffd6d6, em: 0xff3b3b, hub: 0xff7a7a },
          { fill: '#5db9ff', out: '#1f5ba0', core: 0xd6ecff, em: 0x3b8bff, hub: 0x7ab8ff },
          { fill: '#5dff8a', out: '#1f8a3f', core: 0xd6ffe0, em: 0x35dd5d, hub: 0x7aff9a },
        ];
        const col = STARBAR[((this._spinBarN = (this._spinBarN || 0) + 1) - 1) % STARBAR.length];
        const hub2 = cyl(0.4, 0.5, 1.3, col.hub, 10); hub2.position.y = 1.6; hz.group.add(hub2);
        for (const sgn of [1, -1]) for (const d of hz.dists) { const so = Build.starOrb(col.fill, col.out, col.core, col.em); so.position.set(sgn * d, 1.6, 0); hz.pivot.add(so); hz.balls.push(so); hz._pts.push(new THREE.Vector3()); }
        hz.hitPoints = hz._pts;
      }

      this.root.add(hz.group);
      // 初期配置
      this._place(hz);
      this.hazards.push(hz);
    }

    _place(hz) {
      // 初期位置（中心線上）
      const sm = hz.sample;
      hz._p.set(sm.point.x, sm.point.y, sm.point.z);
      hz.markerPos.copy(hz._p);
      if (hz.group && hz.kind !== 'chomp' && hz.kind !== 'firebar' && hz.kind !== 'spinBar') hz.group.position.copy(sm.point);
      if (hz.kind === 'firebar' || hz.kind === 'spinBar') hz.group.position.set(sm.point.x + sm.normal.x * hz.lateral, sm.point.y, sm.point.z + sm.normal.z * hz.lateral);
    }

    // ジュゲム本体（上空を旋回し、定期的にノコノコを落とす）。各コースに1匹。
    _addLakitu() {
      const rh = this.track.roadHalf;
      const f = 0.4 + Math.random() * 0.2;          // 中盤の見やすい位置
      const idx = this._baseIndex(f);
      const sm = this.track.samples[idx];
      const center = new THREE.Vector3(sm.point.x, sm.point.y, sm.point.z);
      const alt = sm.point.y + 13;
      const hz = {
        kind: 'lakitu', side: 1, sample: sm, t: 0, phase: Math.random() * U.TAU,
        dangerous: false, radius: 1.5, effect: 'spin',
        hitPoints: [], markerPos: center.clone(), lateral: 0, _p: new THREE.Vector3(), _baseIndex: idx,
        center, alt, orbitR: Math.min(rh * 0.5, 6), orbitW: 0.65,
        dropTimer: 1.8, dropEvery: 3.4, maxDrops: 3, _throw: 0,
      };
      hz.group = MK.SceneryBuild.lakitu();
      hz.group.position.set(center.x, alt, center.z);
      this.root.add(hz.group);
      this.hazards.push(hz);
    }

    // ジュゲムが落としたノコノコを実体化（update のループ外で呼ぶ）
    _createFallingKoopa(s) {
      const idx = s.idx;
      const groundY = this.track.samples[idx].point.y;
      const koopa = Build.koopa(); koopa.scale.setScalar(0.92);
      koopa.position.set(s.x, s.y, s.z);
      this.root.add(koopa);
      const shadow = blob(1.5); shadow.position.set(s.x, groundY + 0.06, s.z); this.root.add(shadow);
      const hz = {
        kind: 'fallingKoopa', side: 1, sample: this.track.samples[idx], t: 0, phase: 0,
        dangerous: false, radius: 1.45, effect: 'spin',
        hitPoints: [], markerPos: new THREE.Vector3(s.x, groundY, s.z), lateral: 0,
        _p: new THREE.Vector3(s.x, s.y, s.z), _baseIndex: idx,
        group: koopa, shadow, vy: 1.5, gravity: 30, groundY, _landed: false, life: 0,
        _tumX: Math.random() * U.TAU, _tumZ: Math.random() * U.TAU,
      };
      hz.hitPoints = [hz._p];
      this.hazards.push(hz);
    }

    _countFallingKoopas() {
      let n = this._spawnQueue ? this._spawnQueue.length : 0;
      for (const h of this.hazards) if (h.kind === 'fallingKoopa' && !h._remove) n++;
      return n;
    }

    /* ---- 更新 ---- */
    update(dt) {
      const karts = this.world.karts;
      for (const hz of this.hazards) {
        hz.t += dt;
        this._animate(hz, dt);
        // markerPos の横ずれをキャッシュ（AI回避用）。基準サンプル付近のみ探索＝高速
        const pr = this.track.project(hz.markerPos, hz._baseIndex);
        hz.lateral = pr.lateral;
        // 当たり判定
        if (hz.dangerous) this._collide(hz, karts);
      }
      // ジュゲムが落としたノコノコの遅延スポーン（ループ外で安全に追加）
      if (this._spawnQueue && this._spawnQueue.length) {
        for (const s of this._spawnQueue) this._createFallingKoopa(s);
        this._spawnQueue.length = 0;
      }
      // 寿命切れハザードの除去（メッシュ＆テクスチャを解放）
      if (this._needCull) {
        this._needCull = false;
        for (let i = this.hazards.length - 1; i >= 0; i--) {
          const hz = this.hazards[i];
          if (!hz._remove) continue;
          if (hz.group) { this.root.remove(hz.group); U.disposeObject(hz.group); }
          if (hz.shadow) { this.root.remove(hz.shadow); U.disposeObject(hz.shadow); }
          this.hazards.splice(i, 1);
        }
      }
    }

    _animate(hz, dt) {
      const sm = hz.sample, nrm = sm.normal, bp = sm.point;
      switch (hz.kind) {
        case 'goomba': {
          const lat = Math.sin(hz.t * hz.speed + hz.phase) * hz.amp;
          const vx = Math.cos(hz.t * hz.speed + hz.phase);
          hz.group.position.set(bp.x + nrm.x * lat, bp.y + Math.abs(Math.sin(hz.t * 7)) * 0.12, bp.z + nrm.z * lat);
          hz.group.rotation.y = Math.atan2(-nrm.x * Math.sign(vx || 1), -nrm.z * Math.sign(vx || 1));
          hz._p.copy(hz.group.position); hz.markerPos.copy(hz._p);
          hz.dangerous = true; break;
        }
        case 'penguin': {
          const w = hz.speed / hz.amp * 6;
          const lat = Math.sin(hz.t * 1.2 + hz.phase) * hz.amp;
          const vx = Math.cos(hz.t * 1.2 + hz.phase);
          hz.group.position.set(bp.x + nrm.x * lat, bp.y + 0.05, bp.z + nrm.z * lat);
          hz.group.rotation.y = Math.atan2(-nrm.x * Math.sign(vx || 1), -nrm.z * Math.sign(vx || 1));
          hz.group.rotation.z = Math.sin(hz.t * 8) * 0.12;
          hz._p.copy(hz.group.position); hz.markerPos.copy(hz._p);
          hz.dangerous = true; break;
        }
        case 'piranha': {
          // 周期的に伸び上がって噛みつく
          const cyc = (hz.t + hz.phase) % 3.0;
          const out = cyc < 1.0;                // 噛みつき中（危険）
          const ext = out ? Math.sin(cyc * Math.PI) : 0; // 0..1
          hz.group.position.copy(bp);
          hz.group.rotation.y = Math.atan2(-nrm.x, -nrm.z); // コース側を向く
          const stalk = hz.group.userData.stalk, head = hz.group.userData.head;
          if (stalk) stalk.scale.y = 0.4 + ext * 0.8;
          if (head) head.position.y = 1.4 + ext * 0.6;
          // 噛みつき位置はやや中心寄り
          const lat = hz.lateralBase != null ? hz.lateralBase : (hz.lateralBase = hz.lateral);
          const hitLat = hz.lateral - Math.sign(hz.lateral || 1) * ext * 2.2;
          hz._p.set(bp.x + nrm.x * hitLat, bp.y + 1.6, bp.z + nrm.z * hitLat);
          hz.markerPos.copy(bp);
          hz.dangerous = ext > 0.4; break;
        }
        case 'thwomp': {
          const c = (hz.t % hz.cycle) / hz.cycle; // 0..1
          let y;
          if (c < 0.45) y = hz.hover;                       // 上で待機
          else if (c < 0.52) y = hz.hover * (1 - (c - 0.45) / 0.07); // 落下
          else if (c < 0.72) y = 0;                          // 着地（危険）
          else y = hz.hover * ((c - 0.72) / 0.28);           // 上昇
          hz.y = y;
          const cx = bp.x + nrm.x * hz.lateral, cz = bp.z + nrm.z * hz.lateral;
          hz.group.position.set(cx, bp.y + y, cz);
          if (hz.shadow) {
            hz.shadow.position.set(cx, bp.y + 0.06, cz);
            const k = U.clamp(1 - y / hz.hover, 0.2, 1);
            hz.shadow.scale.set(1.2 + k * 1.4, 1.2 + k * 1.4, 1);
            hz.shadow.material.opacity = 0.25 + k * 0.5;
          }
          const down = y < 2.2;
          // 着地の瞬間に演出
          if (down && !hz._prevDown) {
            if (this.world.particles) for (let i = 0; i < 8; i++) this.world.particles.dust(cx + U.randRange(-2, 2), bp.y, cz + U.randRange(-2, 2));
            MK.audio.bump();
            if (this._playerNear(cx, cz, 18)) this.world.shake(0.5);
          }
          hz._prevDown = down;
          hz._p.set(cx, bp.y, cz); hz.markerPos.set(cx, bp.y, cz);
          hz.dangerous = down; break;
        }
        case 'firebar': {
          const a = hz.t * hz.rot;
          hz.pivot.rotation.y = a;
          const cx = hz.group.position.x, cy = hz.group.position.y + 1.4, cz = hz.group.position.z;
          for (let i = 0; i < hz.dists.length; i++) {
            const d = hz.dists[i];
            hz._pts[i].set(cx + Math.cos(a) * d, cy, cz - Math.sin(a) * d);
            const core = hz.balls[i].children[0];
            if (core && core.material) core.material.emissiveIntensity = 0.7 + Math.sin(hz.t * 12 + i) * 0.3;
          }
          hz.markerPos.set(cx, cy, cz);
          hz.dangerous = true; break;
        }
        case 'chomp': {
          const reach = hz.reachBase + hz.reachAmp * (0.5 + 0.5 * Math.sin(hz.t * 1.7 + hz.phase));
          const sweep = Math.sin(hz.t * 1.15) * 0.5;
          // inward を Y 周りに sweep 回転
          const ix = hz.inward.x, iz = hz.inward.z;
          const dx = ix * Math.cos(sweep) + iz * Math.sin(sweep);
          const dz = -ix * Math.sin(sweep) + iz * Math.cos(sweep);
          const hop = Math.abs(Math.sin(hz.t * 3.0)) * 0.6;
          const bx = hz.post.x + dx * reach, bz = hz.post.z + dz * reach, by = hz.post.y + 1.0 + hop;
          hz.ball.position.set(bx, by, bz);
          hz.ball.rotation.y = Math.atan2(-dx, -dz);   // 顔(-Z)を突進方向＝コース側へ向ける
          hz.ball.rotation.x = Math.sin(hz.t * 9) * 0.12; // 噛みつくような小刻みな上下（顔は正面のまま）
          for (let i = 0; i < hz.links.length; i++) {
            const u = (i + 1) / (hz.links.length + 1);
            hz.links[i].position.set(
              hz.post.x + (bx - hz.post.x) * u,
              hz.post.y + 1.2 + (by - hz.post.y - 1.2) * u,
              hz.post.z + (bz - hz.post.z) * u);
          }
          hz._p.set(bx, by, bz); hz.markerPos.set(bx, by, bz);
          hz.dangerous = true; break;
        }
        case 'koopa': {
          const lat = Math.sin(hz.t * hz.speed + hz.phase) * hz.amp;
          const vx = Math.cos(hz.t * hz.speed + hz.phase);
          hz.group.position.set(bp.x + nrm.x * lat, bp.y + Math.abs(Math.sin(hz.t * 5)) * 0.08, bp.z + nrm.z * lat);
          hz.group.rotation.y = Math.atan2(-nrm.x * Math.sign(vx || 1), -nrm.z * Math.sign(vx || 1));
          if (hz.group.userData.head) hz.group.userData.head.rotation.z = Math.sin(hz.t * 6) * 0.12;
          hz._p.copy(hz.group.position); hz.markerPos.copy(hz._p);
          hz.dangerous = true; break;
        }
        case 'montyMole': {
          const cyc = (hz.t + hz.phase) % hz.cycle;
          const out = cyc > 1.0 && cyc < hz.cycle - 0.4;
          const span = (hz.cycle - 0.4) - 1.0;
          const ext = out ? Math.sin((cyc - 1.0) / span * Math.PI) : 0;
          const cx = bp.x + nrm.x * hz.lateral, cz = bp.z + nrm.z * hz.lateral;
          hz.group.position.set(cx, bp.y, cz);
          hz.group.rotation.y = hz._yaw;
          if (hz.group.userData.mole) hz.group.userData.mole.position.y = -1.0 + ext * 1.05;
          hz._p.set(cx, bp.y + 0.6, cz); hz.markerPos.set(cx, bp.y, cz);
          hz.dangerous = ext > 0.45; break;
        }
        case 'snowman': {
          // 横に練り歩く（ワドル）＋上下に弾む
          const cyc = hz.t * hz.speed + hz.phase;
          const lat = Math.sin(cyc) * hz.amp;
          const vx = Math.cos(cyc);
          const bob = Math.abs(Math.sin(hz.t * 3.4)) * 0.16;
          const cx = bp.x + nrm.x * lat, cz = bp.z + nrm.z * lat;
          hz.group.position.set(cx, bp.y + bob, cz);
          hz.group.rotation.y = Math.atan2(-nrm.x * Math.sign(vx || 1), -nrm.z * Math.sign(vx || 1));
          hz.group.rotation.z = Math.sin(hz.t * 6.5) * 0.13; // ワドルの傾き
          hz._p.set(cx, bp.y + 1.0, cz); hz.markerPos.set(cx, bp.y, cz);
          hz.dangerous = true; break;
        }
        case 'icicle': {
          const cyc = (hz.t + hz.phase) % hz.cycle;
          const cx = bp.x + nrm.x * hz.lateral, cz = bp.z + nrm.z * hz.lateral;
          let y, danger = false;
          const dropAt = hz.cycle - 1.5;
          if (cyc < dropAt) { y = hz.hangY + Math.sin(hz.t * 8) * 0.06; }
          else if (cyc < dropAt + 0.32) { y = hz.hangY * (1 - (cyc - dropAt) / 0.32); danger = true; }
          else if (cyc < dropAt + 1.1) { y = 0; danger = true; }
          else { y = hz.hangY; }
          hz.group.position.set(cx, bp.y + y, cz);
          if (hz.shadow) { hz.shadow.position.set(cx, bp.y + 0.06, cz); const k = U.clamp(1 - y / hz.hangY, 0.15, 1); hz.shadow.scale.set(0.7 + k, 0.7 + k, 1); hz.shadow.material.opacity = 0.18 + k * 0.5; }
          const grounded = y < 1.0;
          if (grounded && !hz._prevDown) { if (this.world.particles) for (let i = 0; i < 6; i++) this.world.particles.dust(cx + U.randRange(-1.5, 1.5), bp.y, cz + U.randRange(-1.5, 1.5)); MK.audio.bump(); }
          hz._prevDown = grounded;
          hz._p.set(cx, bp.y + 0.5, cz); hz.markerPos.set(cx, bp.y, cz);
          hz.dangerous = danger; break;
        }
        case 'podoboo': {
          const u = (hz.t + hz.phase) % hz.cycle / hz.cycle;
          const jump = Math.sin(u * Math.PI);
          const y = hz.lavaY + jump * hz.height;
          const cx = bp.x + nrm.x * hz.lateral, cz = bp.z + nrm.z * hz.lateral;
          hz.group.position.set(cx, y, cz);
          hz.group.rotation.y += dt * 3;
          if (hz.group.userData.core) hz.group.userData.core.material.emissiveIntensity = 0.8 + Math.sin(hz.t * 10) * 0.3;
          hz._p.set(cx, y, cz); hz.markerPos.set(cx, bp.y, cz);
          hz.dangerous = Math.abs(y - bp.y) < 2.4; break;
        }
        case 'flameJet': {
          const cyc = (hz.t + hz.phase) % hz.cycle;
          const on = cyc > hz.cycle * 0.45;
          const cx = bp.x + nrm.x * hz.lateral, cz = bp.z + nrm.z * hz.lateral;
          hz.group.position.set(cx, bp.y, cz);
          const flame = hz.group.userData.flame;
          if (flame) {
            flame.visible = on;
            if (on) { const f = 0.85 + Math.sin(hz.t * 22) * 0.15; flame.scale.set(1, f + 0.15, 1); flame.children.forEach((s, i) => { s.material.opacity = 0.7 + Math.sin(hz.t * 16 + i) * 0.3; }); }
          }
          hz._p.set(cx, bp.y + 1.6, cz); hz.markerPos.set(cx, bp.y, cz);
          hz.dangerous = on; break;
        }
        case 'comet': {
          // コース上を移動しながら大きく跳ねる（着地ごとに進路をランダムに変える）
          const N = this.track.sampleCount, samples = this.track.samples;
          const spacing = this.track.length / N;
          hz._f += (hz.travelSpeed * dt) / spacing;          // コースに沿って前進
          const fi = ((hz._f % N) + N) % N;
          const i0 = Math.floor(fi) % N, i1 = (i0 + 1) % N, tt = fi - Math.floor(fi);
          const s0 = samples[i0].point, s1 = samples[i1].point, nr = samples[i0].normal;
          const baseX = U.lerp(s0.x, s1.x, tt), baseY = U.lerp(s0.y, s1.y, tt), baseZ = U.lerp(s0.z, s1.z, tt);
          const ph = (((hz.t * hz.bounceFreq + hz.phase) % 1) + 1) % 1; // 0..1（0/1で接地）
          const hop = hz.bounceH * 4 * ph * (1 - ph);                   // 放物線（中央で頂点）
          hz._latCur = U.damp(hz._latCur, hz._latTarget, 2.2, dt);      // 横へなめらかに蛇行
          const cx = baseX + nr.x * hz._latCur, cz = baseZ + nr.z * hz._latCur, cy = baseY + 0.6 + hop;
          hz.group.position.set(cx, cy, cz);
          // 進行方向の逆へ尾をなびかせる
          const vx = cx - hz._lastPos.x, vy = cy - hz._lastPos.y, vz = cz - hz._lastPos.z;
          if (vx * vx + vy * vy + vz * vz > 1e-4) hz.group.lookAt(cx + vx, cy + vy, cz + vz);
          hz._lastPos.set(cx, cy, cz);
          if (ph < hz._lastPhase) {                                     // 着地ごとに進路と速度をランダム更新
            hz._latTarget = U.randRange(-1, 1) * this.track.roadHalf * 0.62;
            hz.travelSpeed = U.randRange(15, 26);
            if (this._playerNear(cx, cz, 40)) {
              if (this.world.particles) for (let k = 0; k < 6; k++) this.world.particles.starTrail(cx + U.randRange(-1.2, 1.2), baseY + 0.3, cz + U.randRange(-1.2, 1.2));
              MK.audio.bump();
              if (this._playerNear(cx, cz, 16)) this.world.shake(0.3);
            }
          }
          hz._lastPhase = ph;
          hz._baseIndex = i0;                                           // 投影ヒントを移動に追従させる
          if (hz.shadow) {
            const k = U.clamp(1 - hop / hz.bounceH, 0.15, 1);
            hz.shadow.position.set(cx, baseY + 0.06, cz);
            hz.shadow.scale.set(1.2 + k * 1.6, 1.2 + k * 1.6, 1);
            hz.shadow.material.opacity = 0.2 + k * 0.5;
          }
          if (this.world.particles && Math.random() < 0.5) this.world.particles.starTrail(cx, cy, cz);
          hz._p.set(cx, cy, cz); hz.markerPos.set(cx, baseY, cz);
          hz.dangerous = hop < 2.6; // 低い時（着地付近）のみ危険
          break;
        }
        case 'spinBar': {
          const a = hz.t * hz.rot; hz.pivot.rotation.y = a;
          const cx = hz.group.position.x, cy = hz.group.position.y + 1.6, cz = hz.group.position.z;
          const n = hz.dists.length;
          for (let i = 0; i < n; i++) {
            const d = hz.dists[i];
            hz._pts[i].set(cx + Math.cos(a) * d, cy, cz - Math.sin(a) * d);
            hz._pts[i + n].set(cx - Math.cos(a) * d, cy, cz + Math.sin(a) * d);
          }
          hz.markerPos.set(cx, cy, cz);
          hz.dangerous = true; break;
        }
        case 'lakitu': {
          // 上空を旋回しながら一定間隔でノコノコを投下
          const a = hz.t * hz.orbitW + hz.phase;
          const cx = hz.center.x + Math.cos(a) * hz.orbitR;
          const cz = hz.center.z + Math.sin(a) * hz.orbitR;
          const cy = hz.alt + Math.sin(hz.t * 1.5 + hz.phase) * 0.6;
          hz.group.position.set(cx, cy, cz);
          const vx = -Math.sin(a), vz = Math.cos(a);
          hz.group.rotation.y = Math.atan2(-vx, -vz);  // 進行方向(-Z)へ向ける
          // 投げモーション（乗り手が一瞬かがむ）
          if (hz._throw > 0) { hz._throw -= dt; const rider = hz.group.userData.rider; if (rider) rider.rotation.x = -Math.max(0, hz._throw) / 0.3 * 0.5; }
          // ノコノコ投下（同時上限 maxDrops）
          hz.dropTimer -= dt;
          if (hz.dropTimer <= 0) {
            hz.dropTimer = hz.dropEvery;
            if (this._countFallingKoopas() < hz.maxDrops) {
              (this._spawnQueue || (this._spawnQueue = [])).push({ x: cx, y: cy - 0.7, z: cz, idx: hz._baseIndex });
              hz._throw = 0.3;
              if (MK.audio && MK.audio.bump) MK.audio.bump();
            }
          }
          hz.markerPos.set(cx, hz.center.y, cz);
          hz.dangerous = false; break;
        }
        case 'fallingKoopa': {
          const groundY = hz.groundY;
          if (!hz._landed) {
            hz.vy -= hz.gravity * dt;
            hz._p.y += hz.vy * dt;
            hz._tumX += dt * 7; hz._tumZ += dt * 4;
            hz.group.rotation.set(hz._tumX, 0, hz._tumZ);  // 落下中はくるくる回転
            if (hz._p.y <= groundY) {
              hz._p.y = groundY; hz._landed = true; hz.vy = 0; hz.life = 2.4;
              hz.group.rotation.set(0, Math.random() * U.TAU, 0);
              if (this.world.particles) for (let i = 0; i < 8; i++) this.world.particles.dust(hz._p.x + U.randRange(-1.2, 1.2), groundY, hz._p.z + U.randRange(-1.2, 1.2));
              if (MK.audio && MK.audio.bump) MK.audio.bump();
            }
          } else {
            hz.life -= dt;
            hz.group.rotation.y += dt * 1.2;
            if (hz.group.userData.head) hz.group.userData.head.rotation.z = Math.sin(hz.t * 7) * 0.14;
            if (hz.life < 0.8) hz.group.visible = Math.sin(hz.t * 30) > -0.2;  // 退場間際は点滅
            if (hz.life <= 0) { hz.group.visible = true; hz._remove = true; this._needCull = true; }
          }
          hz.group.position.copy(hz._p);
          if (hz.shadow) {
            const h = Math.max(0, hz._p.y - groundY);
            const k = U.clamp(1 - h / 13, 0.15, 1);
            hz.shadow.position.set(hz._p.x, groundY + 0.06, hz._p.z);
            hz.shadow.scale.set(0.8 + k, 0.8 + k, 1);
            hz.shadow.material.opacity = hz._landed ? 0.55 : 0.15 + k * 0.5;
            hz.shadow.visible = hz.group.visible;
          }
          hz.markerPos.set(hz._p.x, groundY, hz._p.z);
          hz.dangerous = (hz._p.y - groundY) < 2.6;  // 地面近くのみ危険
          break;
        }
      }
    }

    _collide(hz, karts) {
      const rr = (hz.radius + C.kartRadius * 0.6);
      const rr2 = rr * rr;
      for (const k of karts) {
        if (!k.isHittable()) continue;
        if (hz.playerOnly && !k.isPlayer) continue; // プレイヤー専用ハザード（星形バー）はAIに当たらない
        for (const hp of hz.hitPoints) {
          const dx = k.group.position.x - hp.x, dz = k.group.position.z - hp.z;
          if (dx * dx + dz * dz < rr2) {
            if (hz.effect === 'launch') {
              if (k.launch()) {
                if (this.world.particles) this.world.particles.explosion(k.group.position.x, k.group.position.y, k.group.position.z, 0xffd24a);
                if (k.isPlayer) this.world.shake(0.8);
              }
            } else {
              if (k.spinOut() && this.world.particles) this.world.particles.sparkle(k.group.position.x, k.group.position.y + 0.5, k.group.position.z, 0xffd24a);
            }
            break;
          }
        }
      }
    }

    _playerNear(x, z, d) {
      const p = this.world.player;
      if (!p) return false;
      const dx = p.group.position.x - x, dz = p.group.position.z - z;
      return dx * dx + dz * dz < d * d;
    }

    // AI回避用：前方 dist 内で最も近い危険ハザードを返す
    nearestDangerAhead(kart, dist) {
      let best = null, bd = dist * dist;
      const fwd = kart.forward(U.tmpV1);
      for (const hz of this.hazards) {
        if (!hz.dangerous) continue;
        if (hz.playerOnly) continue; // プレイヤー専用ハザードはAIの回避対象にしない（すり抜ける）
        const dx = hz.markerPos.x - kart.group.position.x, dz = hz.markerPos.z - kart.group.position.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < bd) {
          const dot = dx * fwd.x + dz * fwd.z;
          if (dot > 0) { bd = d2; best = hz; }
        }
      }
      return best;
    }

    reset() {
      this.scene.remove(this.root);
      U.disposeObject(this.root);
      this.hazards = [];
    }
  }

  MK.HazardSystem = HazardSystem;
  MK.HazardBuild = Build;

})(window.MK);
