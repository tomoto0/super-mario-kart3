/* ============================================================================
 *  characters.js — キャラクターのローポリ造形（マリオらしさ重視のチビ体型）
 *  進行方向（前方）= -Z。各 build* は Group を返す（座席原点 y=0、頭は上方）。
 *  コンセプトアート（concept_art/Mario_Kart_2.png）の任天堂風スムーズ造形に寄せる。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';
  const U = MK.U;
  const TAU = U.TAU;

  /* ---- メッシュ生成ヘルパ（既定はスムーズシェーディング＝なめらかな任天堂風）---- */
  function mat(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: 0.56, metalness: 0.04,
    }, opts || {}));
  }
  function box(w, h, d, color, opts) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts)); }
  function sph(r, color, seg, opts) { const s = seg || 20; return new THREE.Mesh(new THREE.SphereGeometry(r, s, Math.max(8, Math.round(s * 0.72))), mat(color, opts)); }
  function cyl(rt, rb, h, color, seg, opts) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 18), mat(color, opts)); }
  function cone(r, h, color, seg, opts) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 16), mat(color, opts)); }
  function dome(r, color, opts) { return new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16, 0, TAU, 0, Math.PI / 2), mat(color, opts)); }
  function tor(R, r, color, seg, arc, opts) { return new THREE.Mesh(new THREE.TorusGeometry(R, r, seg || 10, 24, arc != null ? arc : TAU), mat(color, opts)); }
  function place(m, x, y, z) { m.position.set(x, y, z); return m; }

  // 白目＋（虹彩）＋黒目＋ハイライト（-Z向き）。x を左右に符号付きで。
  function eye(x, y, z, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const sx = opts.sx || 0.82, sy = opts.tall || 1.5;
    const white = sph(0.17, 0xffffff, 18); white.scale.set(sx, sy, 0.64); g.add(white);
    if (opts.iris != null) { const ir = sph(0.09, opts.iris, 14); ir.scale.set(0.95, 1.2, 0.5); ir.position.set(0, -0.03, -0.12); g.add(ir); }
    const pr = opts.iris != null ? 0.05 : 0.082;
    const pupil = sph(pr, 0x15171d, 14); pupil.scale.set(0.95, 1.32, 0.5); pupil.position.set((opts.look || 0) * 0.03, opts.iris != null ? -0.05 : -0.01, -0.155); g.add(pupil);
    const shine = sph(0.03, 0xffffff, 8); shine.position.set((opts.look || 0) * 0.03 - 0.045, 0.07, -0.2); g.add(shine);
    g.position.set(x, y, z);
    if (opts.tilt) g.rotation.z = opts.tilt;
    return g;
  }

  // 帽子のエンブレム（丸地に文字）
  function emblem(letter, bg, fg) {
    const tex = U.makeCanvasTexture(128, (ctx, s) => {
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - 4, 0, TAU); ctx.fill();
      ctx.fillStyle = fg; ctx.font = 'bold 96px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(letter, s / 2, s / 2 + 6);
    });
    return new THREE.Mesh(new THREE.CircleGeometry(0.17, 22),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, side: THREE.DoubleSide }));
  }

  // 帽子（頭に沿う丸ドーム＋前方へ反るつば）。letter があればエンブレム付き。
  function cap(col, letter, fg, headR) {
    const g = new THREE.Group();
    const r = headR || 0.56;
    const crown = dome(r * 1.03, col); crown.scale.set(1.05, 0.9, 1.08); g.add(crown);
    // 後頭部まで回り込むバンド
    const band = sph(r * 0.99, col, 20); band.scale.set(1.06, 0.52, 1.06); place(band, 0, -0.06, 0.05); g.add(band);
    // つば（半円板＋縁）— 前へ少し反らせる
    const brim = new THREE.Mesh(new THREE.CircleGeometry(r * 0.96, 24, 0, Math.PI), mat(col));
    brim.rotation.x = -Math.PI / 2 + 0.16; brim.rotation.z = Math.PI; brim.position.set(0, -0.05, -r * 0.5); brim.scale.set(0.96, 1.06, 1); g.add(brim);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r * 0.96, 0.035, 8, 24, Math.PI), mat(col));
    lip.rotation.x = -Math.PI / 2 + 0.16; lip.rotation.z = Math.PI; lip.position.set(0, -0.05, -r * 0.5); lip.scale.set(0.96, 1, 1.06); g.add(lip);
    if (letter) { const e = emblem(letter, '#ffffff', fg || '#e52521'); e.position.set(0, 0.22, -r * 1.0); e.rotation.y = Math.PI; e.scale.setScalar(1.1); g.add(e); }
    return g;
  }

  // 口ひげ。pointed=true でワリオのとがったジグザグ髭。
  function mustache(col, pointed) {
    const g = new THREE.Group();
    col = col || 0x4a2c10;
    if (pointed) {
      for (const s of [-1, 1]) {
        const lobe = box(0.26, 0.13, 0.16, col); lobe.rotation.z = s * 0.55; place(lobe, s * 0.16, 0, 0); g.add(lobe);
        const tip = cone(0.075, 0.22, col, 6); tip.rotation.z = s * Math.PI / 2; place(tip, s * 0.34, 0.08, 0); g.add(tip);
      }
    } else {
      const c = sph(0.16, col, 12); c.scale.set(1.55, 0.8, 0.98); g.add(c);
      for (const s of [-1, 1]) {
        const lobe = sph(0.17, col, 12); lobe.scale.set(1, 0.86, 0.92); place(lobe, s * 0.25, -0.05, 0); g.add(lobe);
        const tip = sph(0.09, col, 10); tip.scale.set(1, 0.8, 0.9); place(tip, s * 0.4, -0.02, 0.02); g.add(tip);
      }
    }
    return g;
  }

  // 眉
  function brows(head, col, y, z, w) {
    for (const s of [-1, 1]) { const b = box(w || 0.2, 0.055, 0.07, col); place(b, s * 0.2, y != null ? y : 0.37, z != null ? z : -0.49); b.rotation.z = s * 0.08; head.add(b); }
  }
  // ほっぺ（赤み）を頭に付ける
  function cheeks(head, color, y, z, sx) {
    for (const s of [-1, 1]) { const ch = sph(0.1, color || 0xff9a86, 12); ch.scale.set(1.1, 0.72, 0.6); place(ch, s * (sx || 0.33), y != null ? y : -0.06, z != null ? z : -0.42); head.add(ch); }
  }
  // 笑顔の口（下向きの弧）
  function mouthArc(w, col, y, z, thick) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(w || 0.16, thick || 0.035, 6, 16, Math.PI), mat(col || 0x6a241a));
    m.rotation.z = Math.PI; m.position.set(0, y != null ? y : -0.26, z != null ? z : -0.47);
    return m;
  }

  // 共通：座ってハンドルを握る人型（マリオ／ルイージ／ワリオ）。チビ体型で頭が大きい。
  function humanoidBody(c, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const shirt = c.primary, overalls = c.secondary, skin = c.skin || 0xffc9a0;

    // 胴（丸みのあるシャツ）＋腰
    const torso = sph(0.42, shirt, 18); torso.scale.set(1.06, 1.04, 0.95); place(torso, 0, 0.56, 0); g.add(torso);
    const hips = cyl(0.36, 0.32, 0.3, opts.overalls === false ? shirt : overalls, 16); place(hips, 0, 0.27, 0); g.add(hips);

    // オーバーオール（前当て＋肩ひも＋金ボタン）
    if (opts.overalls !== false) {
      const bib = box(0.48, 0.5, 0.16, overalls); place(bib, 0, 0.52, -0.35); g.add(bib);
      for (const s of [-1, 1]) {
        const strap = box(0.1, 0.52, 0.1, overalls); place(strap, s * 0.22, 0.72, -0.31); g.add(strap);
        const btn = sph(0.055, 0xffd24a, 10, { metalness: 0.5, roughness: 0.3 }); place(btn, s * 0.17, 0.45, -0.43); g.add(btn);
      }
    }

    // 腕（ハンドルへ）＋手袋
    for (const s of [-1, 1]) {
      const shoulder = sph(0.19, shirt, 14); shoulder.position.set(s * 0.39, 0.76, 0); g.add(shoulder);
      const arm = cyl(0.11, 0.14, 0.5, shirt, 12); arm.position.set(s * 0.37, 0.54, -0.27); arm.rotation.x = 1.2; arm.rotation.z = s * 0.16; g.add(arm);
      const cuff = tor(0.14, 0.05, opts.glove || 0xffffff, 8); cuff.position.set(s * 0.34, 0.43, -0.51); cuff.rotation.x = 1.2; g.add(cuff);
      const glove = sph(0.16, opts.glove || 0xffffff, 14); glove.position.set(s * 0.33, 0.36, -0.58); g.add(glove);
    }
    // 首
    const neck = cyl(0.17, 0.19, 0.16, skin, 12); place(neck, 0, 0.97, 0); g.add(neck);
    // 脚・靴
    for (const s of [-1, 1]) {
      const shin = cyl(0.12, 0.14, 0.32, overalls, 10); shin.position.set(s * 0.2, 0.15, -0.34); shin.rotation.x = 1.2; g.add(shin);
      const shoe = sph(0.21, opts.shoe || 0x5a3210, 14); shoe.scale.set(1, 0.72, 1.55); place(shoe, s * 0.2, 0.05, -0.63); g.add(shoe);
    }

    // 頭（大きめ＝チビ体型）
    const head = new THREE.Group();
    const R = 0.56;
    const face = sph(R, skin, 24); face.scale.set(1, opts.faceY || 1.0, 1); head.add(face);
    for (const s of [-1, 1]) { const ear = sph(0.15, skin, 12); place(ear, s * 0.54, -0.02, 0.05); head.add(ear); }
    // 大きな丸い鼻
    const nose = sph(opts.noseR || 0.21, opts.noseColor || skin, 16); nose.scale.set(1.05, 0.96, 1.16); place(nose, 0, -0.05, -0.55); head.add(nose);
    // 目（少し内寄せ・上向き）
    head.add(eye(-0.21, 0.2, -0.49, { look: 1, iris: opts.iris }));
    head.add(eye(0.21, 0.2, -0.49, { look: -1, iris: opts.iris }));
    // 眉
    if (opts.brow) brows(head, opts.hair || 0x3a2410, 0.4, -0.52, 0.2);
    // 口ひげ
    if (opts.mustache) { const m = mustache(opts.hair || 0x4a2c10, opts.wario); m.position.set(0, -0.21, -0.52); head.add(m); }
    // ほっぺ＆笑顔の口（ひげの下）
    cheeks(head, 0xff9a86, -0.08, -0.46, 0.35);
    head.add(mouthArc(0.15, 0x6a241a, opts.mustache ? -0.35 : -0.27, -0.5));
    // もみあげ/後ろ髪
    if (opts.hair && opts.sideburns !== false) {
      for (const s of [-1, 1]) { const sb = box(0.14, 0.34, 0.26, opts.hair); place(sb, s * 0.46, 0.02, 0.07); head.add(sb); }
      const back = sph(0.56, opts.hair, 16); back.scale.set(1.0, 1.0, 0.6); place(back, 0, 0.08, 0.26); head.add(back);
    }
    // 帽子
    if (opts.cap) { const cp = cap(opts.capColor || shirt, opts.letter, opts.letterColor, R); cp.position.set(0, 0.34, 0.04); head.add(cp); }

    head.position.set(0, 1.24, 0);
    head.scale.setScalar(opts.headScale || 1.16);
    g.add(head);
    g.userData.head = head;
    return g;
  }

  /* ---- 各キャラ ---- */
  function buildMario(c) {
    return humanoidBody(c, { cap: true, letter: 'M', letterColor: '#e52521', capColor: c.primary, mustache: true, hair: 0x351f0e, brow: true, glove: 0xffffff, shoe: 0x5a3210, noseR: 0.22, iris: 0x4a6fb0 });
  }
  function buildLuigi(c) {
    const g = humanoidBody(c, { cap: true, letter: 'L', letterColor: '#1fa12f', capColor: c.primary, mustache: true, hair: 0x351f0e, brow: true, glove: 0xffffff, shoe: 0x4a2c10, noseR: 0.22, faceY: 1.08, iris: 0x4a6fb0 });
    g.scale.set(0.95, 1.14, 0.95); // ルイージは細長い
    return g;
  }
  function buildWario(c) {
    // 黄シャツ＋紫オーバーオール＋黄帽子。大きなピンクの鼻＆とがった髭。
    const g = humanoidBody(c, { cap: true, letter: 'W', letterColor: '#2c2cae', capColor: c.primary, mustache: true, wario: true, hair: 0x6a4a18, brow: true, noseR: 0.29, noseColor: 0xffb6a6, glove: 0xffd24a, shoe: 0x1f7a3a, headScale: 1.2, iris: 0x4a6fb0 });
    g.scale.set(1.18, 0.97, 1.18); // がっしり
    return g;
  }
  function buildPeach(c) {
    const g = new THREE.Group();
    const skin = c.skin || 0xffdcb6, dress = c.primary, trim = c.secondary || 0xf6a5c0, hair = 0xffe28a, glove = 0xffffff;
    // ボディス＋ふくらんだスカート
    const bodice = cyl(0.3, 0.42, 0.5, dress, 18); place(bodice, 0, 0.62, 0); g.add(bodice);
    const skirt = cone(0.68, 0.78, dress, 24); place(skirt, 0, 0.3, 0); g.add(skirt);
    const skirtTrim = tor(0.64, 0.07, trim, 10); skirtTrim.rotation.x = Math.PI / 2; place(skirtTrim, 0, 0.0, 0); g.add(skirtTrim);
    // 胸元の青い宝石（金縁）
    const collar = tor(0.12, 0.04, 0xffd24a, 8, null, { metalness: 0.6, roughness: 0.3 }); collar.rotation.x = Math.PI / 2; place(collar, 0, 0.83, -0.3); g.add(collar);
    const gem = sph(0.08, 0x59b6ff, 12, { emissive: 0x1a3a6a, emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.2 }); place(gem, 0, 0.83, -0.33); g.add(gem);
    // パフスリーブ＋腕＋長手袋
    for (const s of [-1, 1]) {
      const puff = sph(0.18, dress, 14); place(puff, s * 0.35, 0.79, 0); g.add(puff);
      const arm = cyl(0.085, 0.1, 0.4, glove, 12); arm.position.set(s * 0.35, 0.55, -0.25); arm.rotation.x = 1.18; g.add(arm);
      const hand = sph(0.12, glove, 12); hand.position.set(s * 0.32, 0.39, -0.51); g.add(hand);
    }
    // 首
    const neck = cyl(0.13, 0.15, 0.16, skin, 12); place(neck, 0, 0.96, 0); g.add(neck);
    // 頭
    const head = new THREE.Group();
    const face = sph(0.5, skin, 24); face.scale.set(1, 1.04, 1); head.add(face);
    const nose = sph(0.075, skin, 12); place(nose, 0, -0.03, -0.5); head.add(nose);
    head.add(eye(-0.19, 0.1, -0.46, { iris: 0x3f86d0, tall: 1.55, look: 1 }));
    head.add(eye(0.19, 0.1, -0.46, { iris: 0x3f86d0, tall: 1.55, look: -1 }));
    // まつ毛・ほっぺ・口・青い宝石のイヤリング
    for (const s of [-1, 1]) { const lash = box(0.12, 0.04, 0.05, 0x3a2a18); place(lash, s * 0.27, 0.22, -0.46); lash.rotation.z = s * -0.32; head.add(lash); }
    cheeks(head, 0xffb0c4, -0.05, -0.42, 0.3);
    head.add(mouthArc(0.09, 0xc0506a, -0.22, -0.48, 0.03));
    for (const s of [-1, 1]) { const earg = sph(0.06, 0x59b6ff, 10, { emissive: 0x1a3a6a, emissiveIntensity: 0.4 }); place(earg, s * 0.48, -0.22, -0.08); head.add(earg); }
    // ブロンドの髪（前髪＋顔まわりのサイドロック＋ふんわり後ろ＋ロングポニー）
    const bangs = dome(0.52, hair); bangs.scale.set(1.08, 0.62, 1.04); place(bangs, 0, 0.18, 0.0); head.add(bangs);
    // 前髪の左右の房（顔の輪郭に沿わせる）
    for (const s of [-1, 1]) { const fr = sph(0.2, hair, 12); fr.scale.set(0.7, 1.1, 0.8); place(fr, s * 0.4, 0.18, -0.28); head.add(fr); }
    const back = sph(0.52, hair, 18); back.scale.set(1.14, 1.12, 0.95); place(back, 0, 0.06, 0.22); head.add(back);
    for (const s of [-1, 1]) { const side = cyl(0.11, 0.15, 0.6, hair, 12); place(side, s * 0.46, -0.16, 0.1); side.rotation.z = s * 0.06; head.add(side); }
    const pony = cyl(0.22, 0.1, 0.9, hair, 14); place(pony, 0, -0.14, 0.5); pony.rotation.x = -0.34; head.add(pony);
    const ponyTip = sph(0.12, hair, 12); place(ponyTip, 0, -0.5, 0.78); head.add(ponyTip);
    // 王冠（金＋赤宝石）
    const band = cyl(0.27, 0.29, 0.14, 0xffd24a, 20, { metalness: 0.7, roughness: 0.25 }); place(band, 0, 0.5, 0.04); head.add(band);
    for (let i = 0; i < 5; i++) { const sp = cone(0.055, 0.15, 0xffd24a, 8, { metalness: 0.7, roughness: 0.25 }); const a = (i / 5) * TAU; place(sp, Math.cos(a) * 0.25, 0.62, 0.04 + Math.sin(a) * 0.25); head.add(sp); const jw = sph(0.035, i % 2 ? 0x59b6ff : 0xe23b6a, 8, { emissive: 0x222, emissiveIntensity: 0.3 }); place(jw, Math.cos(a) * 0.25, 0.6, 0.04 + Math.sin(a) * 0.25 - 0.05); head.add(jw); }
    const cgem = sph(0.06, 0xe23b6a, 10, { emissive: 0x6a0a2a, emissiveIntensity: 0.5 }); place(cgem, 0, 0.5, -0.22); head.add(cgem);
    head.position.set(0, 1.17, 0);
    head.scale.setScalar(1.1);
    g.add(head); g.userData.head = head;
    return g;
  }
  function buildToad(c) {
    const g = new THREE.Group();
    const skin = 0xffe8d0, vest = c.secondary || 0x2b6fd6;
    // ずんぐり体（白い体＋青ベスト＋金縁）
    const torso = sph(0.36, 0xffffff, 16); torso.scale.set(1, 1.12, 1); place(torso, 0, 0.42, 0); g.add(torso);
    const vestM = cyl(0.32, 0.38, 0.44, vest, 16); place(vestM, 0, 0.5, 0); g.add(vestM);
    // ベストの前合わせ（白）＋金ボタン
    const placket = box(0.12, 0.42, 0.06, 0xffffff); place(placket, 0, 0.5, -0.34); g.add(placket);
    for (let i = 0; i < 3; i++) { const b = sph(0.035, 0xffd24a, 8, { metalness: 0.5 }); place(b, 0, 0.62 - i * 0.13, -0.37); g.add(b); }
    const collar = tor(0.24, 0.05, 0xffffff, 8); collar.rotation.x = Math.PI / 2; place(collar, 0, 0.69, 0); g.add(collar);
    // 腕
    for (const s of [-1, 1]) {
      const arm = cyl(0.085, 0.1, 0.36, skin, 12); arm.position.set(s * 0.31, 0.47, -0.21); arm.rotation.x = 1.16; g.add(arm);
      const hand = sph(0.12, 0xffffff, 12); hand.position.set(s * 0.28, 0.33, -0.47); g.add(hand);
    }
    // 足（茶色いブーツ）
    for (const s of [-1, 1]) { const shoe = sph(0.16, 0xc98a4a, 12); shoe.scale.set(1, 0.72, 1.45); place(shoe, s * 0.16, 0.07, -0.4); g.add(shoe); }
    // 大きな頭（きのこ）
    const head = new THREE.Group();
    const facePart = sph(0.46, skin, 20); facePart.scale.set(1.08, 0.92, 1); head.add(facePart);
    head.add(eye(-0.18, -0.02, -0.42, { tall: 2.4, look: 1 }));
    head.add(eye(0.18, -0.02, -0.42, { tall: 2.4, look: -1 }));
    cheeks(head, 0xffb0b0, -0.14, -0.36, 0.29);
    head.add(mouthArc(0.1, 0x8a4a4a, -0.2, -0.42, 0.03));
    // きのこ傘（大きいドーム）＋赤い斑
    const capMesh = dome(0.72, 0xfdfdfd); capMesh.scale.set(1.2, 0.86, 1.2); place(capMesh, 0, 0.24, 0); head.add(capMesh);
    const capRim = tor(0.72 * 1.2, 0.06, 0xf3f3f3, 8); capRim.rotation.x = Math.PI / 2; place(capRim, 0, 0.24, 0); capRim.scale.set(1, 1, 0.7); head.add(capRim);
    const spots = [[0, 0.62, -0.64], [-0.56, 0.46, -0.34], [0.56, 0.46, -0.34], [-0.5, 0.5, 0.34], [0.5, 0.5, 0.34]];
    spots.forEach((p) => { const sp = sph(0.22, 0xe52521, 16); sp.scale.set(1.1, 0.66, 1.1); place(sp, p[0], p[1], p[2]); head.add(sp); });
    head.position.set(0, 1.0, 0);
    g.add(head); g.userData.head = head;
    return g;
  }
  function buildYoshi(c) {
    const g = new THREE.Group();
    const green = 0x52cf3e, belly = 0xfff4d8, saddle = 0xe2402e, shoe = 0xff7a2a, snoutCol = 0x52cf3e;
    // ふっくら胴＋白い腹
    const torso = sph(0.5, green, 20); torso.scale.set(1, 1.22, 1.05); place(torso, 0, 0.54, 0); g.add(torso);
    const bel = sph(0.4, belly, 18); bel.scale.set(0.84, 1.08, 0.6); place(bel, 0, 0.44, -0.35); g.add(bel);
    // 背中の赤いサドル＋白フチ
    const sd = dome(0.44, saddle); place(sd, 0, 0.74, 0.18); g.add(sd);
    const sdRim = tor(0.42, 0.07, 0xffffff, 10); sdRim.rotation.x = Math.PI / 2; place(sdRim, 0, 0.5, 0.18); g.add(sdRim);
    // 腕
    for (const s of [-1, 1]) {
      const arm = cyl(0.1, 0.13, 0.4, green, 12); arm.position.set(s * 0.37, 0.54, -0.23); arm.rotation.x = 1.12; g.add(arm);
      const hand = sph(0.14, green, 12); hand.position.set(s * 0.33, 0.39, -0.51); g.add(hand);
    }
    // 脚＋大きなオレンジ靴
    for (const s of [-1, 1]) { const leg = cyl(0.13, 0.15, 0.3, green, 12); leg.position.set(s * 0.2, 0.15, -0.3); leg.rotation.x = 1.2; g.add(leg); const shoeM = sph(0.22, shoe, 14); shoeM.scale.set(1, 0.72, 1.6); place(shoeM, s * 0.2, 0.05, -0.59); g.add(shoeM); }

    // 頭（丸い頭＋前に大きく突き出す鼻先＝ヨッシーらしさの肝）
    const head = new THREE.Group();
    const skull = sph(0.46, green, 20); skull.scale.set(1.04, 1.0, 1.0); head.add(skull);
    // スナウト（鼻先）：前方 -Z へ長く張り出すカプセル状
    const snout = sph(0.34, snoutCol, 18); snout.scale.set(1.18, 0.96, 1.55); place(snout, 0, -0.16, -0.6); head.add(snout);
    const snoutTip = sph(0.3, snoutCol, 16); snoutTip.scale.set(1.16, 0.94, 1.0); place(snoutTip, 0, -0.16, -0.95); head.add(snoutTip);
    // 鼻の穴
    for (const s of [-1, 1]) { const nl = sph(0.05, 0x2f7a25, 8); nl.scale.set(1, 1.2, 0.8); place(nl, s * 0.13, -0.04, -1.18); head.add(nl); }
    // にっこり口（スナウト下面）
    { const ym = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 18, Math.PI), mat(0x2f7a25)); ym.rotation.z = Math.PI; ym.position.set(0, -0.32, -0.86); head.add(ym); }
    // 大きな白目（頭頂で近接した一対）＋黒目。下半分がスナウトに乗る卵形。
    for (const s of [-1, 1]) {
      const stalk = sph(0.22, green, 14); stalk.scale.set(0.92, 1.45, 0.92); place(stalk, s * 0.17, 0.4, -0.12); head.add(stalk);
      const wsock = sph(0.2, 0xffffff, 16); wsock.scale.set(0.95, 1.5, 0.92); place(wsock, s * 0.16, 0.5, -0.26); head.add(wsock);
      const pup = sph(0.09, 0x20232a, 12); pup.scale.set(0.95, 1.45, 0.7); place(pup, s * 0.16, 0.46, -0.42); head.add(pup);
      const shine = sph(0.03, 0xffffff, 8); place(shine, s * 0.16 - 0.04, 0.56, -0.45); head.add(shine);
    }
    // 頬の張り出し（白め）
    for (const s of [-1, 1]) { const cheek = sph(0.17, green, 14); place(cheek, s * 0.42, -0.1, -0.18); head.add(cheek); }
    // 頭頂～背の赤いとさか（板を数枚）
    for (let i = 0; i < 3; i++) { const cr = box(0.09, 0.26 - i * 0.04, 0.18, saddle); place(cr, 0, 0.62 - i * 0.02, 0.16 + i * 0.18); cr.rotation.x = 0.5; head.add(cr); }
    head.position.set(0, 1.14, 0);
    g.add(head); g.userData.head = head;
    return g;
  }
  function buildDK(c) {
    const g = new THREE.Group();
    const fur = 0x5e3618, faceCol = 0xceaa72, chest = 0xe2c79a, tie = 0xc8102e;
    // でかい胴＋胸
    const torso = sph(0.52, fur, 18); torso.scale.set(1.22, 1.02, 0.96); place(torso, 0, 0.54, 0); g.add(torso);
    const ch = sph(0.46, chest, 16); ch.scale.set(1.08, 0.98, 0.58); place(ch, 0, 0.56, -0.34); g.add(ch);
    // 赤ネクタイ＋黄DK
    const tieKnot = box(0.18, 0.15, 0.07, tie); place(tieKnot, 0, 0.82, -0.62); g.add(tieKnot);
    const tieBody = box(0.26, 0.44, 0.07, tie); place(tieBody, 0, 0.54, -0.66); g.add(tieBody);
    const dk = emblem('DK', '#ffe14d', '#7a3b12'); dk.scale.setScalar(0.86); place(dk, 0, 0.54, -0.7); dk.rotation.y = Math.PI; g.add(dk);
    // 太い腕（肩→前腕→大きなこぶし）
    for (const s of [-1, 1]) {
      const shoulder = sph(0.26, fur, 14); place(shoulder, s * 0.56, 0.66, 0); g.add(shoulder);
      const arm = cyl(0.17, 0.21, 0.62, fur, 14); arm.position.set(s * 0.54, 0.46, -0.18); arm.rotation.x = 1.0; g.add(arm);
      const fist = sph(0.22, fur, 14); fist.position.set(s * 0.5, 0.3, -0.5); g.add(fist);
    }
    // 頭（丸い頭＋下半分の大きなマズル＋ニカッと笑う口）
    const head = new THREE.Group();
    const skull = sph(0.5, fur, 20); skull.scale.set(1.02, 1.06, 1); head.add(skull);
    // 額の房（フリンジ）
    const fringe = sph(0.5, fur, 16); fringe.scale.set(1.05, 0.5, 1.0); place(fringe, 0, 0.34, -0.06); head.add(fringe);
    // マズル（口元）：前方へ突き出す大きな面
    const muzzle = sph(0.42, faceCol, 18); muzzle.scale.set(1.2, 0.92, 1.05); place(muzzle, 0, -0.16, -0.42); head.add(muzzle);
    // 大きな鼻＋鼻の穴
    const noseTop = sph(0.16, faceCol, 12); noseTop.scale.set(1.3, 0.7, 0.8); place(noseTop, 0, 0.06, -0.78); head.add(noseTop);
    for (const s of [-1, 1]) { const n = sph(0.055, 0x241407, 8); place(n, s * 0.12, -0.02, -0.84); head.add(n); }
    // ニカッと笑う口（横長＋上歯列）
    { const grin = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 6, 18, Math.PI), mat(0x2a1608)); grin.rotation.z = Math.PI; grin.position.set(0, -0.3, -0.66); grin.scale.set(1.1, 0.8, 1); head.add(grin); }
    const teeth = box(0.34, 0.08, 0.06, 0xfffaf0); place(teeth, 0, -0.26, -0.72); head.add(teeth);
    // 重い眉＋小さめの目
    const brow = box(0.66, 0.16, 0.2, fur); place(brow, 0, 0.18, -0.46); head.add(brow);
    head.add(eye(-0.17, 0.07, -0.46, { tall: 1.15, look: 1 }));
    head.add(eye(0.17, 0.07, -0.46, { tall: 1.15, look: -1 }));
    // 耳（内側付き）
    for (const s of [-1, 1]) { const ear = sph(0.16, fur, 12); place(ear, s * 0.52, 0.06, 0.08); head.add(ear); const inner = sph(0.09, faceCol, 10); place(inner, s * 0.56, 0.06, 0.02); head.add(inner); }
    head.position.set(0, 1.28, 0);
    g.add(head); g.userData.head = head;
    g.scale.setScalar(1.06);
    return g;
  }
  function buildBowser(c) {
    const g = new THREE.Group();
    const skin = 0xdfe84a, shell = 0x2c9d44, shellRim = 0xf3c800, horn = 0xf2ead2, mane = 0xe2401f, plate = 0xf4ecae;
    // 体＋腹板
    const torso = cyl(0.5, 0.58, 0.72, skin, 18); place(torso, 0, 0.54, 0); g.add(torso);
    const belly = sph(0.46, plate, 18); belly.scale.set(1, 0.98, 0.6); place(belly, 0, 0.54, -0.37); g.add(belly);
    for (let i = 0; i < 3; i++) { const ln = box(0.48 - i * 0.05, 0.04, 0.02, 0xcaa83a); place(ln, 0, 0.38 + i * 0.16, -0.67); g.add(ln); }
    // 甲羅＋黄フチ
    const shellMesh = sph(0.62, shell, 20); shellMesh.scale.set(1.1, 1.08, 0.84); place(shellMesh, 0, 0.62, 0.36); g.add(shellMesh);
    const rim = tor(0.58, 0.1, shellRim, 10); rim.rotation.x = Math.PI / 2 - 0.28; place(rim, 0, 0.56, 0.32); g.add(rim);
    // 甲羅のトゲ（白い土台＋トゲ）
    const spikes = [[0, 1.1, 0.44], [-0.38, 0.78, 0.6], [0.38, 0.78, 0.6], [0, 0.52, 0.78], [-0.54, 0.54, 0.42], [0.54, 0.54, 0.42]];
    spikes.forEach((p) => {
      const ringB = cyl(0.11, 0.14, 0.08, 0xffffff, 10); place(ringB, p[0], p[1], p[2]); ringB.rotation.x = -0.6; g.add(ringB);
      const sp = cone(0.11, 0.28, horn, 10); place(sp, p[0], p[1] + 0.07, p[2] - 0.04); sp.rotation.x = -0.6; g.add(sp);
    });
    // 腕＋爪＋トゲ付きリストバンド
    for (const s of [-1, 1]) {
      const arm = cyl(0.17, 0.19, 0.5, skin, 14); arm.position.set(s * 0.52, 0.54, -0.2); arm.rotation.x = 1.05; g.add(arm);
      const hand = sph(0.19, skin, 12); hand.position.set(s * 0.47, 0.37, -0.51); g.add(hand);
      for (let i = -1; i <= 1; i++) { const claw = cone(0.045, 0.14, 0xffffff, 6); place(claw, s * 0.47 + i * 0.1, 0.29, -0.63); claw.rotation.x = -1.4; g.add(claw); }
      const band = tor(0.19, 0.07, 0x222831, 6); band.position.set(s * 0.5, 0.49, -0.31); band.rotation.y = Math.PI / 2; g.add(band);
      for (let i = 0; i < 4; i++) { const sp = cone(0.05, 0.15, 0xffffff, 6); const a = (i / 4) * TAU; place(sp, s * 0.5 + Math.cos(a) * 0.19, 0.49 + Math.sin(a) * 0.19, -0.31); sp.rotation.x = s * Math.PI / 2; g.add(sp); }
    }
    // トゲ付き首輪
    const collar = tor(0.46, 0.09, 0x222831, 8); collar.rotation.x = Math.PI / 2 - 0.1; place(collar, 0, 0.92, 0.02); g.add(collar);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; const sp = cone(0.06, 0.18, 0xffffff, 6); place(sp, Math.cos(a) * 0.46, 0.92 + Math.sin(a) * 0.1, 0.02 + Math.sin(a) * 0.42); sp.rotation.x = Math.PI / 2 + Math.sin(a); g.add(sp); }
    // 頭
    const head = new THREE.Group();
    const skull = sph(0.54, skin, 20); head.add(skull);
    const snout = sph(0.42, skin, 18); snout.scale.set(1.14, 0.8, 1.08); place(snout, 0, -0.2, -0.42); head.add(snout);
    for (const s of [-1, 1]) { const n = sph(0.055, 0x6a7a10, 8); place(n, s * 0.13, -0.06, -0.78); head.add(n); }
    // 牙（下あごから上向き）
    for (const s of [-1, 1]) { const t = cone(0.065, 0.22, 0xffffff, 8); place(t, s * 0.19, -0.36, -0.55); head.add(t); }
    // 角（外向きに反る）
    for (const s of [-1, 1]) { const hn = cone(0.1, 0.34, horn, 10); place(hn, s * 0.4, 0.42, 0.0); hn.rotation.z = s * -0.55; hn.rotation.x = -0.3; head.add(hn); }
    // 赤いたてがみ（後頭部の塊＋トゲ状の房）
    const maneBack = sph(0.46, mane, 14); maneBack.scale.set(1.14, 1.04, 0.82); place(maneBack, 0, 0.34, 0.3); head.add(maneBack);
    for (let i = 0; i < 7; i++) { const sp = cone(0.08, 0.34, mane, 6); place(sp, (i - 3) * 0.15, 0.54, 0.2); sp.rotation.x = 0.55; sp.rotation.z = (i - 3) * 0.06; head.add(sp); }
    // 眉＋赤目
    const brow = box(0.66, 0.13, 0.18, 0x8a2810); place(brow, 0, 0.27, -0.46); brow.rotation.z = 0; head.add(brow);
    head.add(eye(-0.2, 0.14, -0.46, { iris: 0xd83a14, tall: 1.2, look: 1 }));
    head.add(eye(0.2, 0.14, -0.46, { iris: 0xd83a14, tall: 1.2, look: -1 }));
    head.position.set(0, 1.36, 0);
    head.scale.setScalar(1.08);
    g.add(head); g.userData.head = head;
    g.scale.setScalar(1.16);
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
