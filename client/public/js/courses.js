/* ============================================================================
 *  courses.js — コース定義（中心線の制御点 + テーマ + ルール）
 *  points: [x, z] もしくは [x, y, z]（閉ループ。Catmull-Rom で補間）
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';

  const COURSES = [
    {
      id: 'mario-circuit',
      name: 'MARIO CIRCUIT',
      jp: 'マリオサーキット',
      blurb: 'ゆるやかなカーブの初心者向け',
      difficulty: 1,
      emoji: '🌱',
      uiColor: '#5fbf3f',
      roadHalf: 12,
      hasWalls: true,
      voidRespawn: false,
      boxesPerRow: 5,
      itemBoxFractions: [0.16, 0.4, 0.62, 0.85],
      points: [
        [0, -130], [60, -120], [98, -82], [82, -32], [112, 12],
        [122, 64], [82, 112], [10, 128], [-66, 116], [-112, 70],
        [-122, 0], [-100, -70], [-50, -116],
      ],
      theme: {
        sky: ['#5fb0ff', '#cdeeff'], ground: 0x69bf3e, fog: 0xc4e8ff,
        fogNear: 130, fogFar: 640, light: 1.05,
        hemiSky: 0xbfe6ff, hemiGround: 0x4a7a2a,
        road: '#5b616d', wall: 0xc9b793, props: 'grass',
      },
    },
    {
      id: 'sherbet-land',
      name: 'SHERBET LAND',
      jp: 'シャーベットランド',
      blurb: 'つるつる滑る氷のコース',
      difficulty: 2,
      emoji: '❄️',
      uiColor: '#7fd0ff',
      roadHalf: 12.5,
      hasWalls: true,
      voidRespawn: false,
      boxesPerRow: 5,
      itemBoxFractions: [0.2, 0.45, 0.68, 0.88],
      points: [
        [0, -115], [82, -104], [124, -52], [92, 2], [134, 62],
        [72, 116], [-18, 124], [-92, 104], [-126, 42], [-92, -18],
        [-126, -72], [-58, -114],
      ],
      theme: {
        sky: ['#bfe3ff', '#ffffff'], ground: 0xe9f4ff, fog: 0xeaf6ff,
        fogNear: 110, fogFar: 560, light: 1.0,
        hemiSky: 0xeaf6ff, hemiGround: 0x9fc0d8,
        road: '#a7c2d4', wall: 0xdfeefc, props: 'snow',
      },
    },
    {
      id: 'bowser-castle',
      name: "BOWSER'S CASTLE",
      jp: 'クッパキャッスル',
      blurb: '溶岩と障害物の難関コース',
      difficulty: 3,
      emoji: '🏰',
      uiColor: '#e2562e',
      roadHalf: 9.5,
      hasWalls: true,
      voidRespawn: false,
      boxesPerRow: 4,
      itemBoxFractions: [0.18, 0.42, 0.66, 0.88],
      points: [
        [0, -98], [56, -92], [98, -56], [86, -4], [104, 46],
        [62, 92], [0, 104], [-62, 90], [-100, 46], [-92, -10],
        [-98, -62], [-50, -94],
      ],
      theme: {
        sky: ['#3a1408', '#7e2c16'], ground: 0x2a2026, fog: 0x4a1808,
        fogNear: 80, fogFar: 420, light: 0.85,
        hemiSky: 0x7e2c16, hemiGround: 0x1a1014,
        road: '#4a4450', wall: 0x55505a, props: 'castle',
      },
    },
    {
      id: 'rainbow-road',
      name: 'RAINBOW ROAD',
      jp: 'レインボーロード',
      blurb: '宇宙に浮かぶ究極コース',
      difficulty: 4,
      emoji: '🌈',
      uiColor: '#c45dff',
      roadHalf: 10,
      hasWalls: false,
      voidRespawn: true,
      shoulder: 1.5,
      boxesPerRow: 3,
      itemBoxFractions: [0.22, 0.48, 0.72, 0.9],
      points: [
        [0, 0, -155], [92, 8, -132], [152, 18, -58], [120, 28, 22],
        [162, 14, 92], [82, 4, 152], [-12, 16, 162], [-102, 26, 120],
        [-162, 16, 40], [-130, 6, -42], [-162, 14, -112], [-80, 4, -150],
      ],
      theme: {
        sky: ['#05050e', '#11113a'], ground: 0x05050e, fog: 0x11113a,
        fogNear: 170, fogFar: 720, light: 1.1,
        hemiSky: 0x6a6aff, hemiGround: 0x201040,
        road: '#888', props: 'rainbow', roadTransparent: true,
      },
    },
  ];

  MK.COURSES = COURSES;

})(window.MK);
