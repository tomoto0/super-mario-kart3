/* ============================================================================
 *  characters.js — キャラクターのロー�ポリ造形
 *  進行方向（前方）= -Z。各 build* は Group を返す（座席原点 y=0）。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;

  /* ---- メッシュ生成ヘルパ ---- */
  function mat(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.72, metalness: 0.04, flatShading: true,
    }, opts || {}));
  }
  function box(w, h, d, color, opts) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts)); }
  function sph(r, color, seg, opts) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg || 16, seg || 12), mat(color, opts)); }
  function cyl(rt, rb, h, color, seg, opts) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), mat(color, opts)); }
  function cone(r, h, color, seg, opts) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 16), mat(color, opts)); }

  function place(m, x, y, z) { m.position.set(x, y, z); return m; }

  // 白目＋黒目（-Z向き）。x を左右に符号付きで。
  function eye(x, y, z, scaleY, look) {
    const g = new THREE.Group();
    const white = sph(0.13, 0xffffff, 12);
    white.scale.set(0.85, scaleY || 1.25, 0.7);
    g.add(white);
    const pupil = sph(0.06, 0x20232a, 10);
    pupil.position.set((look || 0) * 0.04, -0.01, -0.1);
    pupil.scale.set(0.9, 1.3, 0.6);
    g.add(pupil);
    // 瞳のハイライト（生き生きとした表情に）
    const shine = sph(0.022, 0xffffff, 6);
    shine.position.set((look || 0) * 0.04 - 0.03, 0.045, -0.155);
    g.add(shine);
    g.position.set(x, y, z);
    return g;
  }

  // 帽子のエンブレム（丸地に文字）
  function emblem(letter, bg, fg) {
    const tex = U.makeCanvasTexture(128, (ctx, s) => {
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - 4, 0, U.TAU); ctx.fill();
      ctx.fillStyle = fg; ctx.font = 'bold 90px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(letter, s / 2, s / 2 + 6);
    });
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    return m;
  }

  // 帽子（半球＋つば）。col=帽子色。letter があればエンブレム付き。
  function cap(col, letter, fg) {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 12, 0, U.TAU, 0, Math.PI / 2), mat(col));
    dome.position.y = 0.02;
    g.add(dome);
    const brim = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), mat(col));
    brim.rotation.x = -Math.PI / 2 + 0.32;
    brim.position.set(0, 0.0, -0.34);
    brim.scale.set(0.9, 1.25, 1);
    g.add(brim);
    if (letter) {
      const e = emblem(letter, '#ffffff', fg || '#e52521');
      e.position.set(0, 0.16, -0.45);
      e.rotation.x = -0.15;
      g.add(e);
    }
    return g;
  }

  // 口ひげ（マリオ／ワリオ）
  function mustache(col) {
    const g = new THREE.Group();
    const c = box(0.5, 0.13, 0.16, col || 0x5a3210);
    g.add(c);
    const l = box(0.16, 0.11, 0.14, col || 0x5a3210); place(l, -0.27, -0.04, 0);
    const r = box(0.16, 0.11, 0.14, col || 0x5a3210); place(r, 0.27, -0.04, 0);
    g.add(l); g.add(r);
    return g;
  }

  // 共通：座って腕をハンドルへ伸ばす人型胴体
  function humanoidBody(c, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const shirt = c.primary, overalls = c.secondary, skin = c.skin || 0xffc9a0;

    // 胴（シャツ）
    const torso = cyl(0.34, 0.42, 0.7, shirt, 14); place(torso, 0, 0.55, 0);
    g.add(torso);
    // オーバーオール（前当て）
    if (opts.overalls !== false) {
      const bib = box(0.5, 0.45, 0.2, overalls); place(bib, 0, 0.5, -0.32); g.add(bib);
      const strapL = box(0.1, 0.5, 0.1, overalls); place(strapL, -0.2, 0.62, -0.28); g.add(strapL);
      const strapR = box(0.1, 0.5, 0.1, overalls); place(strapR, 0.2, 0.62, -0.28); g.add(strapR);
      // 金ボタン
      [-0.16, 0.16].forEach((x) => { const b = sph(0.05, 0xffd24a, 8); place(b, x, 0.4, -0.42); g.add(b); });
    }

    // 腕（前方のハンドルへ）
    const armColor = shirt;
    for (const s of [-1, 1]) {
      const shoulder = sph(0.17, shirt, 10); shoulder.position.set(s * 0.36, 0.8, 0); g.add(shoulder);
      const arm = cyl(0.1, 0.12, 0.5, armColor, 10);
      arm.position.set(s * 0.34, 0.55, -0.25);
      arm.rotation.x = 1.15; arm.rotation.z = s * 0.18;
      g.add(arm);
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 12), mat(opts.glove || 0xffffff)); cuff.position.set(s * 0.31, 0.42, -0.5); cuff.rotation.x = 1.15; g.add(cuff);
      const glove = sph(0.14, opts.glove || 0xffffff, 12);
      glove.position.set(s * 0.30, 0.36, -0.55);
      g.add(glove);
    }
    // 首
    const neck = cyl(0.17, 0.19, 0.2, skin, 10); place(neck, 0, 1.0, 0); g.add(neck);

    // 脚・靴（ペダルへ伸ばす）
    for (const s of [-1, 1]) {
      const shin = cyl(0.1, 0.12, 0.34, overalls, 8); shin.position.set(s * 0.2, 0.18, -0.34); shin.rotation.x = 1.2; g.add(shin);
      const shoe = box(0.26, 0.2, 0.46, opts.shoe || 0x5a3210); place(shoe, s * 0.2, 0.06, -0.6); g.add(shoe);
    }

    // 頭
    const head = new THREE.Group();
    const face = sph(0.5, skin, 18); head.add(face);
    // 耳
    for (const s of [-1, 1]) { const ear = sph(0.13, skin, 10); place(ear, s * 0.48, 0.0, 0.02); head.add(ear); }
    // 鼻
    const nose = sph(opts.noseR || 0.17, skin, 12); place(nose, 0, -0.05, -0.46); nose.scale.set(1.1, 0.9, 1.1); head.add(nose);
    // 目
    head.add(eye(-0.2, 0.16, -0.42, 1.3, 1));
    head.add(eye(0.2, 0.16, -0.42, 1.3, -1));
    // 眉
    if (opts.brow) {
      for (const s of [-1, 1]) { const b = box(0.16, 0.05, 0.05, opts.hair || 0x3a2410); place(b, s * 0.2, 0.34, -0.46); head.add(b); }
    }
    // 口ひげ
    if (opts.mustache) { const m = mustache(opts.hair || 0x5a3210); m.position.set(0, -0.16, -0.44); head.add(m); }
    // もみあげ/髪
    if (opts.hair && opts.sideburns !== false) {
      for (const s of [-1, 1]) { const sb = box(0.12, 0.3, 0.22, opts.hair); place(sb, s * 0.4, 0.05, 0.05); head.add(sb); }
      const back = sph(0.5, opts.hair, 14, {}); back.scale.set(1.0, 1.0, 0.6); place(back, 0, 0.08, 0.22); head.add(back);
    }
    // 帽子
    if (opts.cap) { const cp = cap(opts.capColor || shirt, opts.letter, opts.letterColor); cp.position.set(0, 0.34, 0.04); head.add(cp); }
    // 髪（ピーチ等の長い髪）
    if (opts.longHair) {
      const h = sph(0.55, opts.longHair, 14); h.scale.set(1.05, 1.0, 0.9); place(h, 0, 0.18, 0.18); head.add(h);
      const pony = cyl(0.16, 0.1, 0.7, opts.longHair, 10); place(pony, 0, 0.0, 0.5); pony.rotation.x = -0.4; head.add(pony);
    }
    // 王冠
    if (opts.crown) {
      const cr = cyl(0.24, 0.26, 0.16, 0xffd24a, 8); place(cr, 0, 0.5, 0.06); head.add(cr);
      for (let i = 0; i < 5; i++) { const sp = cone(0.05, 0.12, 0xffd24a, 6); const a = (i / 5) * U.TAU; place(sp, Math.cos(a) * 0.22, 0.62, 0.06 + Math.sin(a) * 0.22); head.add(sp); }
      const gem = sph(0.06, 0x59b6ff, 8); place(gem, 0, 0.5, -0.2); head.add(gem);
    }

    head.position.set(0, 1.25, 0);
    head.scale.setScalar(opts.headScale || 1);
    g.add(head);
    g.userData.head = head;
    return g;
  }

  /* ---- 各キャラ ---- */
  function buildMario(c) {
    return humanoidBody(c, { cap: true, letter: 'M', letterColor: '#e52521', capColor: c.primary, mustache: true, hair: 0x4a2c10, brow: true, glove: 0xffffff });
  }
  function buildLuigi(c) {
    const g = humanoidBody(c, { cap: true, letter: 'L', letterColor: '#1fa12f', capColor: c.primary, mustache: true, hair: 0x4a2c10, brow: true, glove: 0xffffff });
    g.scale.y = 1.08; // ルイージは少し背が高い
    return g;
  }
  function buildWario(c) {
    const g = humanoidBody(c, { cap: true, letter: 'W', letterColor: '#7a3b9a', capColor: c.primary, mustache: true, hair: 0x6a4a18, brow: true, noseR: 0.24, glove: 0xffd24a });
    // ピンクの大きな鼻に
    const head = g.userData.head;
    head.children.forEach((m) => { if (m.geometry && m.geometry.type === 'SphereGeometry' && m.position.z < -0.4 && Math.abs(m.position.x) < 0.05) m.material.color.setHex(0xffb0a0); });
    g.scale.set(1.12, 1.0, 1.12);
    return g;
  }
  function buildPeach(c) {
    return humanoidBody(c, { overalls: false, longHair: 0xffe28a, crown: true, glove: 0xffffff, skin: 0xffdcb6, headScale: 1.0, sideburns: false });
  }
  function buildToad(c) {
    const g = new THREE.Group();
    const skin = 0xffe0c0;
    // ずんぐり体（ベスト）
    const torso = cyl(0.34, 0.42, 0.55, c.secondary, 14); place(torso, 0, 0.5, 0); g.add(torso);
    const vest = box(0.2, 0.4, 0.46, 0xffffff); place(vest, 0, 0.5, -0.16); g.add(vest);
    // 腕
    for (const s of [-1, 1]) {
      const arm = cyl(0.09, 0.11, 0.42, c.secondary, 10); arm.position.set(s * 0.32, 0.5, -0.22); arm.rotation.x = 1.15; g.add(arm);
      const glove = sph(0.12, 0xffffff, 12); glove.position.set(s * 0.28, 0.34, -0.5); g.add(glove);
    }
    // 頭（きのこ）
    const head = new THREE.Group();
    const facePart = sph(0.42, skin, 16); facePart.scale.set(1, 0.85, 1); head.add(facePart);
    head.add(eye(-0.16, 0.0, -0.36, 2.0, 1));
    head.add(eye(0.16, 0.0, -0.36, 2.0, -1));
    // ほっぺ
    for (const s of [-1, 1]) { const ch = sph(0.07, 0xffb0b0, 8); place(ch, s * 0.26, -0.1, -0.32); head.add(ch); }
    // きのこ傘
    const capMesh = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 12, 0, U.TAU, 0, Math.PI / 1.7), mat(0xffffff));
    capMesh.scale.set(1, 0.7, 1); place(capMesh, 0, 0.34, 0); head.add(capMesh);
    // 赤い斑点
    const spots = [[0, 0.5, -0.5], [-0.42, 0.45, -0.1], [0.42, 0.45, -0.1], [-0.3, 0.4, 0.42], [0.3, 0.4, 0.42]];
    spots.forEach((p) => { const sp = sph(0.16, 0xe52521, 12); sp.scale.set(1, 0.5, 1); place(sp, p[0], p[1], p[2]); head.add(sp); });
    head.position.set(0, 1.15, 0);
    g.add(head); g.userData.head = head;
    return g;
  }
  function buildYoshi(c) {
    const g = new THREE.Group();
    const green = 0x4fd33d, belly = 0xffffff, saddle = 0xd13b2e, boots = 0xc8102e;
    // 胴
    const torso = sph(0.5, green, 18); torso.scale.set(1, 1.15, 1.1); place(torso, 0, 0.55, 0); g.add(torso);
    const bel = sph(0.4, belly, 16); bel.scale.set(0.8, 1.0, 0.6); place(bel, 0, 0.45, -0.34); g.add(bel);
    // サドル
    const sd = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 10, 0, U.TAU, 0, Math.PI / 2), mat(saddle));
    place(sd, 0, 0.78, 0.12); g.add(sd);
    // 腕
    for (const s of [-1, 1]) {
      const arm = cyl(0.1, 0.12, 0.4, green, 10); arm.position.set(s * 0.34, 0.55, -0.22); arm.rotation.x = 1.1; g.add(arm);
      const glove = sph(0.13, 0xffffff, 12); glove.position.set(s * 0.3, 0.4, -0.5); g.add(glove);
    }
    // 頭
    const head = new THREE.Group();
    const face = sph(0.46, green, 18); head.add(face);
    // 大きな鼻（口先）
    const snout = sph(0.34, green, 16); snout.scale.set(1.2, 0.85, 1.2); place(snout, 0, -0.18, -0.42); head.add(snout);
    const nl = sph(0.06, 0x2f7a25, 8); place(nl, -0.13, -0.05, -0.72); head.add(nl);
    const nr = sph(0.06, 0x2f7a25, 8); place(nr, 0.13, -0.05, -0.72); head.add(nr);
    // 目（上方の大きな白目）
    const el = eye(-0.18, 0.4, -0.28, 1.6, 1); el.scale.setScalar(1.3); head.add(el);
    const er = eye(0.18, 0.4, -0.28, 1.6, -1); er.scale.setScalar(1.3); head.add(er);
    // 頭の赤い突起
    const spike = box(0.12, 0.34, 0.5, saddle); place(spike, 0, 0.5, 0.2); spike.rotation.x = 0.5; head.add(spike);
    head.position.set(0, 1.2, 0);
    g.add(head); g.userData.head = head;
    return g;
  }
  function buildDK(c) {
    const g = new THREE.Group();
    const fur = 0x7a4a23, face = 0xc99a5b, chest = 0xd9b483;
    const torso = cyl(0.44, 0.5, 0.7, fur, 14); place(torso, 0, 0.55, 0); g.add(torso);
    const ch = sph(0.42, chest, 14); ch.scale.set(1.0, 0.9, 0.6); place(ch, 0, 0.6, -0.32); g.add(ch);
    // ネクタイ
    const tie = box(0.18, 0.4, 0.06, 0xc8102e); place(tie, 0, 0.55, -0.5); g.add(tie);
    const tieKnot = box(0.14, 0.12, 0.06, 0xc8102e); place(tieKnot, 0, 0.78, -0.5); g.add(tieKnot);
    // "DK" エンブレム風
    const dk = emblem('DK', '#ffe14d', '#7a3b12'); dk.scale.setScalar(0.8); place(dk, 0, 0.5, -0.54); g.add(dk);
    // 腕
    for (const s of [-1, 1]) {
      const arm = cyl(0.14, 0.16, 0.55, fur, 10); arm.position.set(s * 0.44, 0.55, -0.2); arm.rotation.x = 1.05; g.add(arm);
      const hand = sph(0.18, fur, 12); hand.position.set(s * 0.4, 0.36, -0.52); g.add(hand);
    }
    // 頭
    const head = new THREE.Group();
    const skull = sph(0.5, fur, 18); head.add(skull);
    const muzzle = sph(0.36, face, 16); muzzle.scale.set(1.1, 0.85, 1.0); place(muzzle, 0, -0.16, -0.4); head.add(muzzle);
    // 鼻孔
    for (const s of [-1, 1]) { const n = sph(0.05, 0x3a2410, 8); place(n, s * 0.1, -0.05, -0.74); head.add(n); }
    // 眉（張り出し）
    const brow = box(0.6, 0.16, 0.2, fur); place(brow, 0, 0.22, -0.42); head.add(brow);
    head.add(eye(-0.16, 0.1, -0.4, 1.3, 1));
    head.add(eye(0.16, 0.1, -0.4, 1.3, -1));
    head.position.set(0, 1.28, 0);
    g.add(head); g.userData.head = head;
    return g;
  }
  function buildBowser(c) {
    const g = new THREE.Group();
    const skin = 0xd7e34a, shell = 0x2c9d44, shellRim = 0xf3c800, horn = 0xf2ead2, hair = 0xd2401f;
    // 体
    const torso = cyl(0.46, 0.54, 0.7, skin, 14); place(torso, 0, 0.55, 0); g.add(torso);
    const belly = sph(0.42, 0xf2e7a0, 14); belly.scale.set(1, 0.95, 0.6); place(belly, 0, 0.55, -0.34); g.add(belly);
    // 甲羅（背中）
    const shellMesh = sph(0.55, shell, 16); shellMesh.scale.set(1.05, 1.0, 0.8); place(shellMesh, 0, 0.6, 0.32); g.add(shellMesh);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 8, 18), mat(shellRim)); rim.rotation.x = Math.PI / 2 - 0.3; place(rim, 0, 0.55, 0.3); g.add(rim);
    // 背中のトゲ
    const spikes = [[0, 1.0, 0.4], [-0.34, 0.7, 0.55], [0.34, 0.7, 0.55], [0, 0.5, 0.7]];
    spikes.forEach((p) => { const sp = cone(0.12, 0.28, horn, 8); place(sp, p[0], p[1], p[2]); sp.rotation.x = -0.6; g.add(sp); });
    // 腕＋トゲ付きリストバンド
    for (const s of [-1, 1]) {
      const arm = cyl(0.15, 0.17, 0.5, skin, 10); arm.position.set(s * 0.46, 0.55, -0.2); arm.rotation.x = 1.05; g.add(arm);
      const hand = sph(0.17, skin, 12); hand.position.set(s * 0.42, 0.38, -0.5); g.add(hand);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 6, 12), mat(0x222831)); band.position.set(s * 0.45, 0.5, -0.32); band.rotation.y = Math.PI / 2; g.add(band);
      for (let i = 0; i < 4; i++) { const sp = cone(0.04, 0.1, horn, 6); const a = (i / 4) * U.TAU; place(sp, s * 0.45 + Math.cos(a) * 0.16, 0.5 + Math.sin(a) * 0.16, -0.32); sp.rotation.z = a; g.add(sp); }
    }
    // 頭
    const head = new THREE.Group();
    const skull = sph(0.5, skin, 18); head.add(skull);
    const snout = sph(0.36, skin, 16); snout.scale.set(1.1, 0.8, 1.1); place(snout, 0, -0.18, -0.4); head.add(snout);
    // 牙
    for (const s of [-1, 1]) { const t = cone(0.05, 0.16, horn, 6); place(t, s * 0.16, -0.32, -0.5); t.rotation.x = Math.PI; head.add(t); }
    // 角
    for (const s of [-1, 1]) { const hn = cone(0.08, 0.26, horn, 8); place(hn, s * 0.34, 0.36, -0.05); hn.rotation.z = s * -0.4; head.add(hn); }
    // 赤い髪
    const hairTuft = sph(0.4, hair, 12); hairTuft.scale.set(1.0, 0.9, 0.8); place(hairTuft, 0, 0.34, 0.26); head.add(hairTuft);
    for (let i = 0; i < 5; i++) { const sp = cone(0.06, 0.22, hair, 6); place(sp, (i - 2) * 0.16, 0.5, 0.2); sp.rotation.x = 0.6; head.add(sp); }
    // 眉＋目
    const brow = box(0.6, 0.12, 0.16, 0x9a3010); place(brow, 0, 0.24, -0.42); head.add(brow);
    head.add(eye(-0.18, 0.12, -0.42, 1.2, 1));
    head.add(eye(0.18, 0.12, -0.42, 1.2, -1));
    head.position.set(0, 1.32, 0);
    head.scale.setScalar(1.05);
    g.add(head); g.userData.head = head;
    g.scale.setScalar(1.12);
    return g;
  }

  const BUILDERS = {
    mario: buildMario, luigi: buildLuigi, peach: buildPeach, yoshi: buildYoshi,
    toad: buildToad, dk: buildDK, wario: buildWario, bowser: buildBowser,
  };

  MK.Characters = {
    build(id, colors) {
      const fn = BUILDERS[id] || buildMario;
      const g = fn(colors);
      g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
      return g;
    },
    list: Object.keys(BUILDERS),
  };

})(window.MK);
