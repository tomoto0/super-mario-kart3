/* ============================================================================
 *  config.js — グローバル設定 / キャラクター / アイテム定義
 *  3D Super Mario Kart  (Three.js r128, classic-script build)
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';

  /* ---- ゲーム全体の物理・ルール定数 -------------------------------------- */
  const CONFIG = {
    laps: 3,                 // 周回数
    racerCount: 8,           // 走者の総数（プレイヤー含む）

    // コース寸法（ワールド単位）
    roadHalfWidth: 11,       // 路面の半幅
    shoulderWidth: 6,        // 路肩（オフロード）の幅
    wallBounce: 0.02,        // 壁接触時の減速（小さいほど失速しない＝高弾力）

    // 速度（units/sec）— stat=3(標準)基準。★1あたり ±speedPerStar
    baseMaxSpeed: 33,
    speedPerStar: 2.4,
    offRoadMaxFactor: 0.46,  // オフロード時の最高速倍率
    offRoadDrag: 1.9,        // オフロード時の追加減速

    // 加速（reach max にかかる秒数）— accel stat が高いほど短い
    accelTimeBase: 2.7,
    accelTimePerStar: -0.22,
    reverseMaxSpeed: 14,
    brakeDecel: 46,
    coastDecel: 14,          // アクセルオフ時の自然減速

    // 旋回
    baseTurnRate: 1.55,      // rad/s (handling stat=3)
    turnPerStar: 0.16,
    driftTurnBoost: 1.65,    // ドリフト中の旋回倍率
    minTurnSpeed: 4,         // これ未満ではほぼ曲がれない
    turnSpeedFalloff: 26,    // 高速ほど曲がりにくくする基準

    // ドリフト / ミニターボ
    driftMinSpeed: 16,       // ドリフト開始に必要な最低速
    miniTurbo: [
      { charge: 0.85, boost: 9,  duration: 0.85, color: 0x55ccff }, // 青
      { charge: 1.85, boost: 13, duration: 1.15, color: 0xff9b2f }, // 橙
      { charge: 3.0,  boost: 18, duration: 1.55, color: 0xb46bff }, // 紫(ウルトラ)
    ],

    // ブースト（キノコ / ミニターボ）
    boostMaxExtra: 20,       // 最高速に上乗せできる上限
    boostDecay: 16,          // ブースト減衰(units/s^2)
    mushroomBoost: 16,
    mushroomDuration: 1.4,
    goldenDuration: 7.5,     // ゴールデンキノコの有効時間（連打でブーストし放題）

    // ブーストパッド（路面の矢印ゾーン）
    padBoost: 15,
    padDuration: 1.0,

    // スリップストリーム（前走者の真後ろを走り続けると加速）
    draftDist: 16,           // 後方この距離以内
    draftLatMax: 2.6,        // 横ずれ許容
    draftTime: 1.0,          // 必要追走時間(s)
    draftBoost: 9,
    draftDuration: 1.1,

    // コイン：1枚取得するごとに最高速を恒久的に加算
    // （HUD表示は内部速度×3.0なので 0.2km/h ＝ 0.2/3.0 units/s）
    coinSpeedBonus: 0.2 / 3.0,

    // 当たり判定
    kartRadius: 2.0,
    itemHitRadius: 2.4,

    // スピン / つぶし
    spinOutTime: 1.25,
    squishTime: 4.5,
    squishSpeedFactor: 0.55,
    starTime: 7.5,
    starSpeedBoost: 8,

    // カメラ
    cameraModes: ['chase', 'far', 'bumper'],
    fov: 68,

    // 描画
    fogColorDefault: 0x9fd3ff,
    drawDistance: 900,

    // 入力
    deadzone: 0.12,
  };

  /* ---- キャラクター（stat は ★1〜5） ------------------------------------ */
  // speed  : 最高速
  // accel  : 加速力
  // handling: 旋回性能
  // weight : 重量（重いほど押し勝つ／加速やや不利）
  const CHARACTERS = [
    {
      id: 'mario', name: 'MARIO', jp: 'マリオ',
      cls: 'MEDIUM',
      stats: { speed: 3, accel: 3, handling: 3, weight: 3 },
      colors: { primary: 0xe52521, secondary: 0x2b50c8, kart: 0xe23b2e, skin: 0xffc9a0 },
      blurb: 'All-around balanced hero',
    },
    {
      id: 'luigi', name: 'LUIGI', jp: 'ルイージ',
      cls: 'MEDIUM',
      stats: { speed: 3, accel: 3, handling: 4, weight: 3 },
      colors: { primary: 0x1fa12f, secondary: 0x2b50c8, kart: 0x33b04a, skin: 0xffc9a0 },
      blurb: 'The brother with sharper handling',
    },
    {
      id: 'peach', name: 'PEACH', jp: 'ピーチ',
      cls: 'LIGHT',
      stats: { speed: 3, accel: 4, handling: 4, weight: 2 },
      colors: { primary: 0xf45ba5, secondary: 0xf6a5c0, kart: 0xff8ec4, skin: 0xffdcb6 },
      blurb: 'Light and easy to handle',
    },
    {
      id: 'yoshi', name: 'YOSHI', jp: 'ヨッシー',
      cls: 'LIGHT',
      stats: { speed: 3, accel: 4, handling: 4, weight: 2 },
      colors: { primary: 0x49c63a, secondary: 0xffffff, kart: 0x4fd33d, skin: 0x49c63a },
      blurb: 'Great acceleration and cornering',
    },
    {
      id: 'toad', name: 'TOAD', jp: 'キノピオ',
      cls: 'LIGHT',
      stats: { speed: 2, accel: 5, handling: 4, weight: 1 },
      colors: { primary: 0xffffff, secondary: 0x2b6fd6, kart: 0xf1f1f1, skin: 0xffe0c0 },
      blurb: 'Fastest acceleration, lightest weight',
    },
    {
      id: 'dk', name: 'D.K.', jp: 'ドンキー',
      cls: 'HEAVY',
      stats: { speed: 4, accel: 2, handling: 3, weight: 4 },
      colors: { primary: 0x7a4a23, secondary: 0xc8102e, kart: 0x8a5a2b, skin: 0x6b3f1d },
      blurb: 'Powerful heavyweight',
    },
    {
      id: 'wario', name: 'WARIO', jp: 'ワリオ',
      cls: 'HEAVY',
      stats: { speed: 4, accel: 2, handling: 2, weight: 5 },
      colors: { primary: 0xf3c800, secondary: 0x7a3b9a, kart: 0xf4cf1f, skin: 0xffcf9e },
      blurb: 'Heaviest — wins every bump',
    },
    {
      id: 'bowser', name: 'BOWSER', jp: 'クッパ',
      cls: 'HEAVY',
      stats: { speed: 5, accel: 1, handling: 2, weight: 5 },
      colors: { primary: 0x2fae4a, secondary: 0xf3c800, kart: 0x2c9d44, skin: 0xd7e34a },
      blurb: 'Top-speed king of the Koopas',
    },
  ];

  /* ---- アイテム定義 ------------------------------------------------------ */
  // type:  boost / shellGreen / shellRed / banana / bomb / star / lightning / triple
  const ITEMS = {
    mushroom:    { id: 'mushroom',    name: 'Mushroom',           emoji: '🍄', type: 'boost',      color: 0xff4438 },
    triple:      { id: 'triple',      name: 'Triple Mushrooms',   emoji: '🍄', type: 'triple',     color: 0xff4438, count: 3 },
    tripleGreen: { id: 'tripleGreen', name: 'Triple Green Shells', emoji: '🐢', type: 'tripleShell', color: 0x2fae4a, count: 3 },
    greenShell:  { id: 'greenShell',  name: 'Green Shell',        emoji: '🟢', type: 'shellGreen', color: 0x2fae4a },
    redShell:   { id: 'redShell',   name: 'Red Shell',        emoji: '🔴', type: 'shellRed',   color: 0xe23b2e },
    banana:     { id: 'banana',     name: 'Banana',           emoji: '🍌', type: 'banana',     color: 0xffe14d },
    bomb:       { id: 'bomb',       name: 'Bob-omb',          emoji: '💣', type: 'bomb',        color: 0x222831 },
    star:       { id: 'star',       name: 'Star',             emoji: '⭐', type: 'star',        color: 0xffe14d },
    lightning:  { id: 'lightning',  name: 'Lightning',        emoji: '⚡', type: 'lightning',   color: 0xfff04d },
    spiny:      { id: 'spiny',      name: 'Spiny Shell',      emoji: '🐚', type: 'spiny',       color: 0x9b30ff },
    fakeBox:    { id: 'fakeBox',    name: 'Fake Item Box',    emoji: '❓', type: 'fakeBox',     color: 0xe23b2e },
    golden:     { id: 'golden',     name: 'Golden Mushroom',  emoji: '🍄', type: 'golden',      color: 0xffc41f },
  };

  // 順位に応じた抽選テーブル（前方ほど弱い／後方ほど強いアイテム = ラバーバンド）
  // pos は 0=先頭。weight の比率で抽選。
  function itemRollTable(pos, racerCount) {
    const last = racerCount - 1;
    const r = racerCount <= 1 ? 0 : pos / last; // 0(先頭)〜1(最後尾)
    if (r < 0.18) {        // トップ集団（ニセアイテムボックスは先頭の防衛アイテム）
      return [
        ['banana', 20], ['greenShell', 20], ['fakeBox', 14], ['mushroom', 12],
        ['redShell', 12], ['bomb', 8], ['triple', 7], ['tripleGreen', 7],
      ];
    } else if (r < 0.5) {  // 中団前
      return [
        ['mushroom', 20], ['greenShell', 15], ['redShell', 15], ['fakeBox', 8],
        ['banana', 10], ['triple', 12], ['tripleGreen', 12], ['bomb', 9], ['star', 5],
      ];
    } else if (r < 0.8) {  // 中団後（ゴールデンキノコが出始める）
      return [
        ['mushroom', 16], ['redShell', 15], ['triple', 13], ['tripleGreen', 11],
        ['star', 13], ['bomb', 11], ['golden', 9], ['greenShell', 8], ['lightning', 8], ['spiny', 3],
      ];
    } else {               // 後方（トゲゾー甲羅は最後尾ほど出やすい・全体では稀）
      return [
        ['triple', 17], ['star', 19], ['golden', 14], ['mushroom', 10], ['tripleGreen', 9],
        ['lightning', 15], ['redShell', 10], ['bomb', 8], ['spiny', 7],
      ];
    }
  }

  function rollItem(pos, racerCount, rng) {
    const table = itemRollTable(pos, racerCount);
    let total = 0;
    for (const [, w] of table) total += w;
    let pick = (rng ? rng() : Math.random()) * total;
    for (const [id, w] of table) {
      pick -= w;
      if (pick <= 0) return id;
    }
    return table[0][0];
  }

  /* ---- 派生ステータス計算 ------------------------------------------------ */
  function deriveStats(character) {
    const s = character.stats;
    const maxSpeed = CONFIG.baseMaxSpeed + (s.speed - 3) * CONFIG.speedPerStar;
    const accelTime = Math.max(0.9, CONFIG.accelTimeBase + (s.accel - 3) * CONFIG.accelTimePerStar);
    const accel = maxSpeed / accelTime;
    const turnRate = CONFIG.baseTurnRate + (s.handling - 3) * CONFIG.turnPerStar;
    const weight = 0.7 + (s.weight - 1) * 0.16; // 0.7 〜 1.34
    return { maxSpeed, accel, turnRate, weight };
  }

  MK.CONFIG = CONFIG;
  MK.CHARACTERS = CHARACTERS;
  MK.ITEMS = ITEMS;
  MK.rollItem = rollItem;
  MK.deriveStats = deriveStats;

})(window.MK);
