/* ============================================================================
 *  courses.js — コース定義（中心線の制御点 + テーマ + ルール）
 *  points: [x, z] もしくは [x, y, z]（閉ループ。Catmull-Rom で補間）
 *  y を与えると起伏（坂・うねり）になる。
 * ==========================================================================*/
window.MK = window.MK || {};

(function (MK) {
  'use strict';

  const COURSES = [
    {
      id: 'mario-circuit',
      name: 'MARIO CIRCUIT',
      jp: 'マリオサーキット',
      blurb: 'Gentle rolling hills — perfect for beginners',
      music: 'music/02_Moo_Moo_Farm.mp3',
      difficulty: 1,
      emoji: '🌱',
      uiColor: '#5fbf3f',
      roadHalf: 12,
      hasWalls: true,
      voidRespawn: false,
      boxesPerRow: 5,
      itemBoxFractions: [0.16, 0.4, 0.62, 0.85],
      // 緩やかに上り下りする草原サーキット（y で起伏）
      points: [
        [0, 0, -130], [60, 2, -120], [98, 7, -82], [82, 11, -32], [112, 8, 12],
        [122, 3, 64], [82, 1, 112], [10, 5, 128], [-66, 10, 116], [-112, 6, 70],
        [-122, 2, 0], [-100, 0, -70], [-50, -1, -116],
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
      blurb: 'Slippery ice over frozen, undulating hills',
      music: 'music/03_Frappe_Snowland.mp3',
      difficulty: 2,
      emoji: '❄️',
      uiColor: '#7fd0ff',
      roadHalf: 12.5,
      hasWalls: true,
      voidRespawn: false,
      boxesPerRow: 5,
      itemBoxFractions: [0.2, 0.45, 0.68, 0.88],
      // 凍った丘をうねる氷のコース
      points: [
        [0, 0, -115], [82, 5, -104], [124, 9, -52], [92, 5, 2], [134, 2, 62],
        [72, 7, 116], [-18, 11, 124], [-92, 6, 104], [-126, 1, 42], [-92, 5, -18],
        [-126, 8, -72], [-58, 3, -114],
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
      blurb: 'Indoor stone walkways winding over a sea of lava',
      music: 'music/04_Bowser_Castle.mp3',
      difficulty: 3,
      emoji: '🏰',
      uiColor: '#e2562e',
      roadHalf: 9,
      hasWalls: true,
      voidRespawn: false,
      shoulder: 3,
      tension: 0.42,           // 角を立てて 90 度に近い屈曲にする
      boxesPerRow: 3,
      itemBoxFractions: [0.14, 0.34, 0.52, 0.7, 0.88],
      // 角ばった 90 度コーナーで折れ曲がる、溶岩上の城内回廊（面取り点で直角を作る）
      points: [
        [-81, 12, 92], [81, 13, 92],            // 下の回廊（スタート直線）→
        [95, 15, 78], [95, 17, 50],             // 右上へ ↑
        [81, 18, 36], [-36, 15, 36],            // 中段の回廊 ←
        [-50, 13, 22], [-50, 9, -6],            // 短い縦路 ↑
        [-36, 8, -20], [81, 13, -20],           // 回廊 →
        [95, 16, -34], [95, 12, -78],           // 右を上へ ↑
        [81, 10, -92], [-81, 12, -92],          // 上の回廊 ←
        [-95, 14, -78], [-95, 13, 78],          // 左の壁沿いを下りてスタートへ ↓
      ],
      theme: {
        sky: ['#1c0a06', '#52160c'], ground: 0x1a1014, fog: 0x35100a,
        fogNear: 70, fogFar: 360, light: 0.72,
        hemiSky: 0x6e2410, hemiGround: 0x140a08,
        road: '#3f3a47', wall: 0x4a4550, props: 'castle',
        lava: true,
      },
    },
    {
      id: 'rainbow-road',
      name: 'RAINBOW ROAD',
      jp: 'レインボーロード',
      blurb: 'The ultimate floating track high in space',
      music: 'music/12_Rainbow_Road.mp3',
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
        [0, 0, -155], [92, 14, -132], [152, 24, -58], [120, 30, 22],
        [162, 16, 92], [82, 6, 152], [-12, 20, 162], [-102, 30, 120],
        [-162, 18, 40], [-130, 8, -42], [-162, 18, -112], [-80, 6, -150],
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
