/* ============================================================================
 *  characters.js — キャラクターのローポリ造形（マリオらしさ重視のチビ体型）
 *  進行方向（前方）= -Z。各 build* は Group を返す（座席原点 y=0、頭は上方）。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;

  /* ---- メッシュ生成ヘルパ ---- */
  function mat(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.66, metalness: 0.05, flatShading: true,
    }, opts || {}));
  }
  function box(w, h, d, color, opts) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts)); }
  function sph(r, color, seg, opts) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg || 16, seg || 12), mat(color, opts)); }
  function cyl(rt, rb, h, color, seg, opts) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), mat(color, opts)); }
  function cone(r, h, color, seg, opts) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 16), mat(color, opts)); }
  // 上半球ドーム
  function dome(r, color, opts) { return new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14, 0, U.TAU, 0, Math.PI / 2), mat(color, opts)); }
  function place(m, x, y, z) { m.position.set(x, y, z); return m; }

  // 白目＋黒目（-Z向き）。x を左右に符号付きで。
  function eye(x, y, z, scaleY, look) {
    const g = new THREE.Group();
    const white = sph(0.14, 0xffffff, 12);
    white.scale.set(0.9, scaleY || 1.3, 0.72);
    g.add(white);
    const pupil = sph(0.07, 0x20232a, 10);
    pupil.position.set((look || 0) * 0.04, -0.01, -0.11);
    pupil.scale.set(0.9, 1.35, 0.6);
    g.add(pupil);
    // 瞳のハイライト
    const shine = sph(0.025, 0xffffff, 6);
    shine.position.set((look || 0) * 0.04 - 0.035, 0.05, -0.16);
    g.add(shine);
    g.position.set(x, y, z);
    return g;
  }

  // 帽子のエンブレム（丸地に文字）
  function emblem(letter, bg, fg) {
    const tex = U.makeCanvasTexture(128, (ctx, s) => {
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - 4, 0, U.TAU); ctx.fill();
      ctx.fillStyle = fg; ctx.font = 'bold 92px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(letter, s / 2, s / 2 + 6);
    });
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.18, 20),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }));
    return m;
  }

  // 帽子（丸いドーム＋前方へ突き出す半円のつば）。letter があればエンブレム付き。
  function cap(col, letter, fg) {
    const g = new THREE.Group();
    const d = dome(0.52, col); d.scale.set(1.04, 0.96, 1.08); d.position.y = 0.0; g.add(d);
    // つば（半円の板を前へ）
    const brim = new THREE.Mesh(new THREE.CircleGeometry(0.54, 20, 0, Math.PI), mat(col));
    brim.rotation.x = -Math.PI / 2; brim.position.set(0, 0.02, -0.04); brim.scale.set(1, 1.15, 1); g.add(brim);
    const brimLip = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.03, 6, 20, Math.PI), mat(col));
    brimLip.rotation.x = -Math.PI / 2; brimLip.position.set(0, 0.02, -0.04); brimLip.scale.set(1, 1.15, 1); g.add(brimLip);
    if (letter) {
      const e = emblem(letter, '#ffffff', fg || '#e52521');
      e.position.set(0, 0.2, -0.5); e.rotation.x = -0.2; g.add(e);
    }
    return g;
  }

  // 口ひげ。pointed=true でワリオのとがったジグザグ髭。
  function mustache(col, pointed) {
    const g = new THREE.Group();
    col = col || 0x5a3210;
    if (pointed) {
      for (const s of [-1, 1]) {
        const lobe = box(0.24, 0.12, 0.15, col); lobe.rotation.z = s * 0.5; place(lobe, s * 0.15, 0, 0); g.add(lobe);
        const tip = cone(0.07, 0.2, col, 6); tip.rotation.z = s * Math.PI / 2; place(tip, s * 0.32, 0.07, 0); g.add(tip);
      }
    } else {
      const c = sph(0.15, col, 10); c.scale.set(1.5, 0.78, 0.95); g.add(c);
      for (const s of [-1, 1]) { const lobe = sph(0.16, col, 10); lobe.scale.set(1, 0.85, 0.9); place(lobe, s * 0.24, -0.04, 0); g.add(lobe); }
    }
    return g;
  }

  // 共通：座ってハンドルを握る人型（マリオ／ルイージ／ワリオ）。チビ体型で頭が大きい。
  function humanoidBody(c, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const shirt = c.primary, overalls = c.secondary, skin = c.skin || 0xffc9a0;

    // 胴（丸みのあるシャツ）＋腰
    const torso = sph(0.4, shirt, 16); torso.scale.set(1.05, 1.05, 0.95); place(torso, 0, 0.58, 0); g.add(torso);
    const hips = cyl(0.34, 0.3, 0.3, opts.overalls === false ? shirt : overalls, 14); place(hips, 0, 0.28, 0); g.add(hips);

    // オーバーオール（前当て＋肩ひも＋金ボタン）
    if (opts.overalls !== false) {
      const bib = box(0.46, 0.5, 0.16, overalls); place(bib, 0, 0.54, -0.34); g.add(bib);
      for (const s of [-1, 1]) {
        const strap = box(0.09, 0.5, 0.1, overalls); place(strap, s * 0.22, 0.72, -0.3); g.add(strap);
        const btn = sph(0.05, 0xffd24a, 8, { metalness: 0.5, roughness: 0.3 }); place(btn, s * 0.16, 0.46, -0.42); g.add(btn);
      }
    }

    // 腕（ハンドルへ）＋白手袋
    for (const s of [-1, 1]) {
      const shoulder = sph(0.18, shirt, 12); shoulder.position.set(s * 0.38, 0.78, 0); g.add(shoulder);
      const arm = cyl(0.1, 0.13, 0.5, shirt, 10); arm.position.set(s * 0.36, 0.55, -0.26); arm.rotation.x = 1.18; arm.rotation.z = s * 0.16; g.add(arm);
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.045, 6, 12), mat(opts.glove || 0xffffff)); cuff.position.set(s * 0.33, 0.44, -0.5); cuff.rotation.x = 1.18; g.add(cuff);
      const glove = sph(0.15, opts.glove || 0xffffff, 12); glove.position.set(s * 0.32, 0.37, -0.57); g.add(glove);
    }
    // 首
    const neck = cyl(0.16, 0.18, 0.16, skin, 10); place(neck, 0, 0.98, 0); g.add(neck);
    // 脚・靴（茶色）
    for (const s of [-1, 1]) {
      const shin = cyl(0.11, 0.13, 0.32, overalls, 8); shin.position.set(s * 0.2, 0.16, -0.34); shin.rotation.x = 1.2; g.add(shin);
      const shoe = sph(0.2, opts.shoe || 0x5a3210, 12); shoe.scale.set(1, 0.7, 1.5); place(shoe, s * 0.2, 0.06, -0.62); g.add(shoe);
    }

    // 頭（大きめ＝チビ体型）
    const head = new THREE.Group();
    const face = sph(0.52, skin, 20); head.add(face);
    for (const s of [-1, 1]) { const ear = sph(0.14, skin, 10); place(ear, s * 0.5, 0.0, 0.04); head.add(ear); }
    // 大きな丸い鼻
    const nose = sph(opts.noseR || 0.2, opts.noseColor || skin, 14); nose.scale.set(1.05, 0.95, 1.12); place(nose, 0, -0.06, -0.5); head.add(nose);
    // 目
    head.add(eye(-0.2, 0.18, -0.45, 1.35, 1));
    head.add(eye(0.2, 0.18, -0.45, 1.35, -1));
    // 眉
    if (opts.brow) { for (const s of [-1, 1]) { const b = box(0.18, 0.06, 0.07, opts.hair || 0x3a2410); place(b, s * 0.2, 0.37, -0.48); head.add(b); } }
    // 口ひげ
    if (opts.mustache) { const m = mustache(opts.hair || 0x5a3210, opts.wario); m.position.set(0, -0.2, -0.47); head.add(m); }
    // もみあげ/後ろ髪
    if (opts.hair && opts.sideburns !== false) {
      for (const s of [-1, 1]) { const sb = box(0.13, 0.32, 0.24, opts.hair); place(sb, s * 0.42, 0.04, 0.06); head.add(sb); }
      const back = sph(0.52, opts.hair, 14); back.scale.set(1.0, 1.0, 0.62); place(back, 0, 0.1, 0.24); head.add(back);
    }
    // 帽子
    if (opts.cap) { const cp = cap(opts.capColor || shirt, opts.letter, opts.letterColor); cp.position.set(0, 0.36, 0.04); head.add(cp); }

    head.position.set(0, 1.24, 0);
    head.scale.setScalar(opts.headScale || 1.15);
    g.add(head);
    g.userData.head = head;
    return g;
  }

  /* ---- 各キャラ ---- */
  function buildMario(c) {
    return humanoidBody(c, { cap: true, letter: 'M', letterColor: '#e52521', capColor: c.primary, mustache: true, hair: 0x3a2410, brow: true, glove: 0xffffff, shoe: 0x5a3210, noseR: 0.21 });
  }
  function buildLuigi(c) {
    const g = humanoidBody(c, { cap: true, letter: 'L', letterColor: '#1fa12f', capColor: c.primary, mustache: true, hair: 0x3a2410, brow: true, glove: 0xffffff, shoe: 0x4a2c10, noseR: 0.21, headScale: 1.12 });
    g.scale.set(0.96, 1.12, 0.96); // ルイージは細長い
    return g;
  }
  function buildWario(c) {
    // 黄シャツ＋紫オーバーオール＋黄帽子。大きなピンクの鼻＆とがった髭。
    const g = humanoidBody(c, { cap: true, letter: 'W', letterColor: '#2c2cae', capColor: c.primary, mustache: true, wario: true, hair: 0x6a4a18, brow: true, noseR: 0.27, noseColor: 0xffb6a6, glove: 0xffd24a, shoe: 0x1f7a3a, headScale: 1.2 });
    g.scale.set(1.16, 0.98, 1.16); // がっしり
    return g;
  }
  function buildPeach(c) {
    const g = new THREE.Group();
    const skin = c.skin || 0xffdcb6, dress = c.primary, trim = c.secondary || 0xf6a5c0, hair = 0xffe28a, glove = 0xffffff;
    // ボディス＋ふくらんだスカート
    const bodice = cyl(0.3, 0.4, 0.5, dress, 16); place(bodice, 0, 0.62, 0); g.add(bodice);
    const skirt = cone(0.66, 0.78, dress, 22); place(skirt, 0, 0.3, 0); g.add(skirt);
    const skirtTrim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 8, 24), mat(trim)); skirtTrim.rotation.x = Math.PI / 2; place(skirtTrim, 0, 0.0, 0); g.add(skirtTrim);
    // 胸元の青い宝石
    const gem = sph(0.08, 0x59b6ff, 10, { emissive: 0x1a3a6a, emissiveIntensity: 0.4 }); place(gem, 0, 0.82, -0.3); g.add(gem);
    // パフスリーブ＋腕＋長手袋
    for (const s of [-1, 1]) {
      const puff = sph(0.17, dress, 12); place(puff, s * 0.34, 0.8, 0); g.add(puff);
      const arm = cyl(0.08, 0.1, 0.4, glove, 10); arm.position.set(s * 0.34, 0.56, -0.24); arm.rotation.x = 1.16; g.add(arm);
      const hand = sph(0.11, glove, 10); hand.position.set(s * 0.31, 0.4, -0.5); g.add(hand);
    }
    // 首
    const neck = cyl(0.12, 0.14, 0.16, skin, 10); place(neck, 0, 0.96, 0); g.add(neck);
    // 頭
    const head = new THREE.Group();
    const face = sph(0.48, skin, 20); head.add(face);
    const nose = sph(0.08, skin, 10); place(nose, 0, -0.04, -0.46); head.add(nose);
    head.add(eye(-0.18, 0.08, -0.42, 1.5, 1));
    head.add(eye(0.18, 0.08, -0.42, 1.5, -1));
    // ブロンドの髪（前髪ドーム＋後ろ＋サイド＋ロングポニー）
    const bangs = dome(0.5, hair); bangs.scale.set(1.06, 0.95, 1.0); place(bangs, 0, 0.1, 0.02); head.add(bangs);
    const back = sph(0.5, hair, 16); back.scale.set(1.12, 1.1, 0.92); place(back, 0, 0.06, 0.2); head.add(back);
    for (const s of [-1, 1]) { const side = cyl(0.1, 0.13, 0.52, hair, 10); place(side, s * 0.44, -0.1, 0.12); head.add(side); }
    const pony = cyl(0.2, 0.09, 0.85, hair, 12); place(pony, 0, -0.12, 0.52); pony.rotation.x = -0.32; head.add(pony);
    // 王冠（金＋赤宝石）
    const band = cyl(0.26, 0.28, 0.14, 0xffd24a, 18, { metalness: 0.6, roughness: 0.3 }); place(band, 0, 0.48, 0.02); head.add(band);
    for (let i = 0; i < 5; i++) { const sp = cone(0.05, 0.14, 0xffd24a, 6, { metalness: 0.6, roughness: 0.3 }); const a = (i / 5) * U.TAU; place(sp, Math.cos(a) * 0.24, 0.6, 0.02 + Math.sin(a) * 0.24); head.add(sp); }
    const cgem = sph(0.06, 0xe23b6a, 8, { emissive: 0x6a0a2a, emissiveIntensity: 0.5 }); place(cgem, 0, 0.48, -0.24); head.add(cgem);
    head.position.set(0, 1.16, 0);
    head.scale.setScalar(1.08);
    g.add(head); g.userData.head = head;
    return g;
  }
  function buildToad(c) {
    const g = new THREE.Group();
    const skin = 0xffe8d0, vest = c.secondary || 0xe52521;
    // ずんぐり体（白ズボン＋ベスト）
    const torso = sph(0.34, 0xffffff, 14); torso.scale.set(1, 1.1, 1); place(torso, 0, 0.42, 0); g.add(torso);
    const vestM = cyl(0.3, 0.36, 0.42, vest, 14); place(vestM, 0, 0.52, 0); g.add(vestM);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), mat(0xffffff)); collar.rotation.x = Math.PI / 2; place(collar, 0, 0.7, 0); g.add(collar);
    // 腕
    for (const s of [-1, 1]) {
      const arm = cyl(0.08, 0.1, 0.36, skin, 10); arm.position.set(s * 0.3, 0.48, -0.2); arm.rotation.x = 1.15; g.add(arm);
      const hand = sph(0.11, 0xffffff, 12); hand.position.set(s * 0.27, 0.34, -0.46); g.add(hand);
    }
    // 足
    for (const s of [-1, 1]) { const shoe = sph(0.16, 0xf0e0c0, 12); shoe.scale.set(1, 0.7, 1.4); place(shoe, s * 0.16, 0.08, -0.4); g.add(shoe); }
    // 大きな頭（きのこ）
    const head = new THREE.Group();
    const facePart = sph(0.44, skin, 18); facePart.scale.set(1.06, 0.9, 1); head.add(facePart);
    head.add(eye(-0.17, -0.02, -0.4, 2.3, 1));
    head.add(eye(0.17, -0.02, -0.4, 2.3, -1));
    for (const s of [-1, 1]) { const ch = sph(0.08, 0xffb0b0, 10); place(ch, s * 0.28, -0.12, -0.34); head.add(ch); }
    // きのこ傘（大きいドーム）＋赤い斑
    const capMesh = dome(0.66, 0xfdfdfd); capMesh.scale.set(1.18, 0.82, 1.18); place(capMesh, 0, 0.26, 0); head.add(capMesh);
    const spots = [[0, 0.56, -0.56], [-0.52, 0.42, -0.04], [0.52, 0.42, -0.04], [-0.34, 0.4, 0.48], [0.34, 0.4, 0.48]];
    spots.forEach((p) => { const sp = sph(0.19, 0xe52521, 14); sp.scale.set(1.1, 0.5, 1.1); place(sp, p[0], p[1], p[2]); head.add(sp); });
    head.position.set(0, 1.02, 0);
    g.add(head); g.userData.head = head;
    return g;
  }
  function buildYoshi(c) {
    const g = new THREE.Group();
    const green = 0x5cd246, belly = 0xfff6e0, saddle = 0xe2402e, shoe = 0xff7a2a;
    // ふっくら胴＋白い腹
    const torso = sph(0.5, green, 18); torso.scale.set(1, 1.2, 1.05); place(torso, 0, 0.55, 0); g.add(torso);
    const bel = sph(0.4, belly, 16); bel.scale.set(0.82, 1.05, 0.6); place(bel, 0, 0.45, -0.34); g.add(bel);
    // 背中の赤いサドル＋白フチ
    const sd = dome(0.42, saddle); place(sd, 0, 0.74, 0.16); g.add(sd);
    const sdRim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 8, 20), mat(0xffffff)); sdRim.rotation.x = Math.PI / 2; place(sdRim, 0, 0.5, 0.16); g.add(sdRim);
    // 腕
    for (const s of [-1, 1]) {
      const arm = cyl(0.1, 0.12, 0.4, green, 10); arm.position.set(s * 0.36, 0.55, -0.22); arm.rotation.x = 1.1; g.add(arm);
      const hand = sph(0.13, 0xffffff, 12); hand.position.set(s * 0.32, 0.4, -0.5); g.add(hand);
    }
    // 脚＋大きなオレンジ靴
    for (const s of [-1, 1]) { const leg = cyl(0.12, 0.14, 0.3, green, 10); leg.position.set(s * 0.2, 0.16, -0.3); leg.rotation.x = 1.2; g.add(leg); const shoeM = sph(0.21, shoe, 12); shoeM.scale.set(1, 0.7, 1.6); place(shoeM, s * 0.2, 0.06, -0.58); g.add(shoeM); }
    // 頭（大きな丸頭＋でかい鼻先）
    const head = new THREE.Group();
    const face = sph(0.46, green, 18); face.scale.set(1, 1.05, 1); head.add(face);
    const snout = sph(0.37, green, 16); snout.scale.set(1.18, 0.92, 1.28); place(snout, 0, -0.14, -0.46); head.add(snout);
    for (const s of [-1, 1]) { const nl = sph(0.055, 0x2f7a25, 8); place(nl, s * 0.14, 0.0, -0.84); head.add(nl); }
    // 大きな白目（頭の上で近接）＋黒目
    for (const s of [-1, 1]) {
      const wsock = sph(0.21, 0xffffff, 14); wsock.scale.set(0.92, 1.4, 0.82); place(wsock, s * 0.16, 0.44, -0.18); head.add(wsock);
      const pup = sph(0.085, 0x20232a, 10); pup.scale.set(0.9, 1.35, 0.7); place(pup, s * 0.16, 0.4, -0.34); head.add(pup);
    }
    // 頭頂の赤いとさか
    const crest = box(0.1, 0.32, 0.48, saddle); place(crest, 0, 0.54, 0.18); crest.rotation.x = 0.4; head.add(crest);
    // 頬の張り出し
    for (const s of [-1, 1]) { const cheek = sph(0.18, green, 12); place(cheek, s * 0.4, -0.04, -0.06); head.add(cheek); }
    head.position.set(0, 1.18, 0);
    g.add(head); g.userData.head = head;
    return g;
  }
  function buildDK(c) {
    const g = new THREE.Group();
    const fur = 0x6e3f1c, face = 0xcfa06a, chest = 0xe0bd92, tie = 0xc8102e;
    // でかい胴＋胸
    const torso = sph(0.5, fur, 16); torso.scale.set(1.18, 1.0, 0.95); place(torso, 0, 0.55, 0); g.add(torso);
    const ch = sph(0.44, chest, 14); ch.scale.set(1.05, 0.95, 0.6); place(ch, 0, 0.58, -0.34); g.add(ch);
    // 赤ネクタイ＋DK
    const tieKnot = box(0.16, 0.14, 0.06, tie); place(tieKnot, 0, 0.78, -0.52); g.add(tieKnot);
    const tieBody = box(0.2, 0.4, 0.06, tie); place(tieBody, 0, 0.5, -0.52); g.add(tieBody);
    const dk = emblem('DK', '#ffe14d', '#7a3b12'); dk.scale.setScalar(0.68); place(dk, 0, 0.5, -0.56); g.add(dk);
    // 太い腕
    for (const s of [-1, 1]) {
      const arm = cyl(0.16, 0.2, 0.6, fur, 12); arm.position.set(s * 0.5, 0.5, -0.18); arm.rotation.x = 1.0; g.add(arm);
      const hand = sph(0.2, fur, 12); hand.position.set(s * 0.46, 0.32, -0.5); g.add(hand);
    }
    // 頭
    const head = new THREE.Group();
    const skull = sph(0.5, fur, 18); skull.scale.set(1, 1.05, 1); head.add(skull);
    const muzzle = sph(0.39, face, 16); muzzle.scale.set(1.16, 0.8, 1.0); place(muzzle, 0, -0.14, -0.4); head.add(muzzle);
    for (const s of [-1, 1]) { const n = sph(0.05, 0x2a1808, 8); place(n, s * 0.11, -0.04, -0.76); head.add(n); }
    // 大きな眉＋目
    const brow = box(0.62, 0.18, 0.22, fur); place(brow, 0, 0.22, -0.42); head.add(brow);
    head.add(eye(-0.16, 0.08, -0.42, 1.2, 1));
    head.add(eye(0.16, 0.08, -0.42, 1.2, -1));
    // 耳（内側付き）
    for (const s of [-1, 1]) { const ear = sph(0.14, fur, 10); place(ear, s * 0.5, 0.05, 0.06); head.add(ear); const inner = sph(0.08, face, 8); place(inner, s * 0.53, 0.05, 0.0); head.add(inner); }
    head.position.set(0, 1.28, 0);
    g.add(head); g.userData.head = head;
    g.scale.setScalar(1.05);
    return g;
  }
  function buildBowser(c) {
    const g = new THREE.Group();
    const skin = 0xd9e84a, shell = 0x2c9d44, shellRim = 0xf3c800, horn = 0xf2ead2, mane = 0xe2401f, plate = 0xf2e7a0;
    // 体＋腹板
    const torso = cyl(0.48, 0.56, 0.7, skin, 16); place(torso, 0, 0.55, 0); g.add(torso);
    const belly = sph(0.44, plate, 16); belly.scale.set(1, 0.95, 0.6); place(belly, 0, 0.55, -0.36); g.add(belly);
    for (let i = 0; i < 3; i++) { const ln = box(0.46 - i * 0.05, 0.04, 0.02, 0xcaa83a); place(ln, 0, 0.4 + i * 0.16, -0.66); g.add(ln); }
    // 甲羅＋黄フチ
    const shellMesh = sph(0.58, shell, 18); shellMesh.scale.set(1.08, 1.05, 0.82); place(shellMesh, 0, 0.62, 0.34); g.add(shellMesh);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.1, 8, 20), mat(shellRim)); rim.rotation.x = Math.PI / 2 - 0.28; place(rim, 0, 0.56, 0.3); g.add(rim);
    // 甲羅のトゲ（白い土台＋トゲ）
    const spikes = [[0, 1.05, 0.42], [-0.36, 0.74, 0.58], [0.36, 0.74, 0.58], [0, 0.5, 0.74], [-0.5, 0.52, 0.4], [0.5, 0.52, 0.4]];
    spikes.forEach((p) => {
      const ringB = cyl(0.1, 0.13, 0.08, 0xffffff, 8); place(ringB, p[0], p[1], p[2]); ringB.rotation.x = -0.6; g.add(ringB);
      const sp = cone(0.1, 0.26, horn, 8); place(sp, p[0], p[1] + 0.06, p[2] - 0.04); sp.rotation.x = -0.6; g.add(sp);
    });
    // 腕＋爪＋トゲ付きリストバンド
    for (const s of [-1, 1]) {
      const arm = cyl(0.16, 0.18, 0.5, skin, 12); arm.position.set(s * 0.5, 0.55, -0.2); arm.rotation.x = 1.05; g.add(arm);
      const hand = sph(0.18, skin, 12); hand.position.set(s * 0.45, 0.38, -0.5); g.add(hand);
      for (let i = -1; i <= 1; i++) { const claw = cone(0.04, 0.13, 0xffffff, 6); place(claw, s * 0.45 + i * 0.09, 0.3, -0.62); claw.rotation.x = -1.4; g.add(claw); }
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.07, 6, 14), mat(0x222831)); band.position.set(s * 0.48, 0.5, -0.3); band.rotation.y = Math.PI / 2; g.add(band);
      for (let i = 0; i < 4; i++) { const sp = cone(0.05, 0.14, 0xffffff, 6); const a = (i / 4) * U.TAU; place(sp, s * 0.48 + Math.cos(a) * 0.18, 0.5 + Math.sin(a) * 0.18, -0.3); sp.rotation.x = s * Math.PI / 2; g.add(sp); }
    }
    // 頭
    const head = new THREE.Group();
    const skull = sph(0.52, skin, 18); head.add(skull);
    const snout = sph(0.4, skin, 16); snout.scale.set(1.12, 0.78, 1.05); place(snout, 0, -0.2, -0.4); head.add(snout);
    for (const s of [-1, 1]) { const n = sph(0.05, 0x6a7a10, 8); place(n, s * 0.12, -0.08, -0.74); head.add(n); }
    // 牙
    for (const s of [-1, 1]) { const t = cone(0.06, 0.2, 0xffffff, 6); place(t, s * 0.18, -0.34, -0.52); head.add(t); }
    // 角
    for (const s of [-1, 1]) { const hn = cone(0.09, 0.3, horn, 8); place(hn, s * 0.36, 0.4, -0.02); hn.rotation.z = s * -0.5; hn.rotation.x = -0.3; head.add(hn); }
    // 赤いたてがみ
    const maneBack = sph(0.42, mane, 12); maneBack.scale.set(1.12, 1.0, 0.8); place(maneBack, 0, 0.32, 0.28); head.add(maneBack);
    for (let i = 0; i < 6; i++) { const sp = cone(0.07, 0.3, mane, 6); place(sp, (i - 2.5) * 0.16, 0.52, 0.18); sp.rotation.x = 0.5; head.add(sp); }
    // 眉＋目
    const brow = box(0.62, 0.13, 0.18, 0x8a2810); place(brow, 0, 0.26, -0.44); head.add(brow);
    head.add(eye(-0.19, 0.14, -0.44, 1.2, 1));
    head.add(eye(0.19, 0.14, -0.44, 1.2, -1));
    head.position.set(0, 1.34, 0);
    head.scale.setScalar(1.08);
    g.add(head); g.userData.head = head;
    g.scale.setScalar(1.14);
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
