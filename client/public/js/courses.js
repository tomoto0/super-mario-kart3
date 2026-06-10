/* ============================================================================
 *  courses.js — コース定義（中心線の制御点 + テーマ + ルール）
 *  points: [x, z] もしくは [x, y, z]（閉ループ。Catmull-Rom で補間）
 *  y を与えると起伏（坂・うねり）になる。
 *  boostPads: [{f, lat, w}] … 路面のブーストパッド（f=周回率, lat=-1..1, w=半幅率）
 *  train: 砂漠の機関車（独自の閉ループを走り、コースと平面交差する）
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
      banner: "LET'S-A-GO!",
      music: 'music/02_Moo_Moo_Farm.mp3',
      difficulty: 1,
      emoji: '🌱',
      uiColor: '#5fbf3f',
      roadHalf: 12,
      hasWalls: true,
      voidRespawn: false,
      boxesPerRow: 5,
      itemBoxFractions: [0.16, 0.4, 0.62, 0.85],
      boostPads: [{ f: 0.3, lat: 0, w: 0.45 }, { f: 0.72, lat: -0.35, w: 0.4 }],
      // 緩やかに上り下りする草原サーキット（y で起伏）
      points: [
        [0, 0, -130], [60, 2, -120], [94, 7, -80], [88, 10, -32], [112, 8, 12],
        [122, 3, 64], [82, 1, 112], [10, 5, 128], [-66, 10, 116], [-112, 6, 70],
        [-122, 2, 0], [-100, 0, -70], [-50, 0, -116],
      ],
      theme: {
        sky: ['#5fb0ff', '#cdeeff'], ground: 0x69bf3e, fog: 0xc4e8ff,
        fogNear: 130, fogFar: 640, light: 1.05,
        hemiSky: 0xbfe6ff, hemiGround: 0x4a7a2a,
        road: '#5b616d', wall: 0xc9b793, props: 'grass', bannerColor: '#2e8b35',
      },
    },
    {
      id: 'koopa-beach',
      name: 'KOOPA TROOPA BEACH',
      jp: 'ノコノコビーチ',
      blurb: 'Sun-soaked sands with leaping Cheep-Cheeps',
      banner: "SURF'S UP!",
      music: 'music/08_Koopa_Troopa_Beach.mp3',
      difficulty: 2,
      emoji: '🏖️',
      uiColor: '#ffc44d',
      roadHalf: 12.5,
      hasWalls: false,          // 壁メッシュなし（路肩の見えない境界で押し戻す）
      voidRespawn: false,
      shoulder: 7,
      boxesPerRow: 5,
      itemBoxFractions: [0.18, 0.42, 0.66, 0.88],
      boostPads: [{ f: 0.34, lat: 0, w: 0.45 }, { f: 0.78, lat: 0.35, w: 0.4 }],
      // 南国の入り江をめぐる砂浜コース（ゆるい起伏＋海沿いのうねり）
      points: [
        [0, 0, -125], [65, 1, -118], [110, 4, -80], [122, 1, -18], [112, 0, 40],
        [110, 2, 88], [56, 5, 126], [-15, 1, 135], [-80, 0, 112], [-118, 3, 58],
        [-110, 1, -8], [-122, 2, -65], [-70, 4, -112],
      ],
      theme: {
        sky: ['#3fa9ff', '#c8f0ff'], ground: 0xeedfa8, fog: 0xd4f0ff,
        fogNear: 140, fogFar: 640, light: 1.14,
        hemiSky: 0xd4f0ff, hemiGround: 0x9a8a5a,
        road: '#bda176', props: 'beach', bannerColor: '#0a7a9a',
      },
    },
    {
      id: 'sherbet-land',
      name: 'SHERBET LAND',
      jp: 'シャーベットランド',
      blurb: 'Slippery ice over frozen, undulating hills',
      banner: 'KEEP IT COOL!',
      music: 'music/03_Frappe_Snowland.mp3',
      difficulty: 2,
      emoji: '❄️',
      uiColor: '#7fd0ff',
      roadHalf: 12.5,
      hasWalls: true,
      voidRespawn: false,
      boxesPerRow: 5,
      itemBoxFractions: [0.2, 0.45, 0.68, 0.88],
      boostPads: [{ f: 0.36, lat: 0, w: 0.45 }, { f: 0.82, lat: 0, w: 0.45 }],
      // 凍った丘をうねる氷のコース
      points: [
        [0, 0, -115], [82, 5, -104], [120, 9, -52], [114, 5, 2], [134, 2, 62],
        [72, 7, 116], [-18, 11, 124], [-92, 6, 104], [-126, 1, 42], [-114, 5, -18],
        [-117, 8, -78], [-58, 3, -114],
      ],
      theme: {
        sky: ['#bfe3ff', '#ffffff'], ground: 0xe9f4ff, fog: 0xeaf6ff,
        fogNear: 110, fogFar: 560, light: 1.0,
        hemiSky: 0xeaf6ff, hemiGround: 0x9fc0d8,
        road: '#a7c2d4', wall: 0xdfeefc, props: 'snow', bannerColor: '#2f6fb0',
      },
    },
    {
      id: 'kalimari-desert',
      name: 'KALIMARI DESERT',
      jp: 'カラカラさばく',
      blurb: 'Mind the crossing — the express train waits for no one',
      banner: 'ALL ABOARD!',
      music: 'music/10_Kalimari_Desert.mp3',
      difficulty: 3,
      emoji: '🌵',
      uiColor: '#e8a04a',
      roadHalf: 13,
      hasWalls: false,
      voidRespawn: false,
      shoulder: 8,
      boxesPerRow: 5,
      itemBoxFractions: [0.15, 0.38, 0.6, 0.84],
      boostPads: [{ f: 0.28, lat: 0, w: 0.45 }, { f: 0.55, lat: 0.3, w: 0.4 }, { f: 0.9, lat: 0, w: 0.5 }],
      // 赤土のメサに囲まれた大砂漠の周回路。機関車の線路が4箇所で横切る（踏切注意！）
      points: [
        [0, 0, -150], [70, 2, -140], [120, 3, -95], [135, 1, -25], [120, 0, 40],
        [130, 1, 105], [70, 6, 150], [-10, 8, 155], [-85, 5, 135], [-130, 1, 75],
        [-120, 0, 0], [-135, 2, -70], [-90, 5, -125], [-40, 2, -148],
      ],
      // 機関車：内側の平原を大きく回り、東西の直線を横切る
      train: {
        points: [
          [185, 5], [160, 75], [80, 108], [0, 118], [-80, 108], [-160, 75],
          [-185, 5], [-160, -65], [-80, -100], [0, -110], [80, -100], [160, -65],
        ],
        speed: 26, cars: 6,
      },
      theme: {
        sky: ['#6ab8ff', '#ffe8c0'], ground: 0xddb277, fog: 0xf2dcb2,
        fogNear: 140, fogFar: 660, light: 1.1,
        hemiSky: 0xffe8c8, hemiGround: 0x9a7a4a,
        road: '#857862', props: 'desert', bannerColor: '#9a5a1f',
      },
    },
    {
      id: 'bowser-castle',
      name: "BOWSER'S CASTLE",
      jp: 'クッパキャッスル',
      blurb: 'Indoor stone walkways winding over a sea of lava',
      banner: 'ENTER IF YOU DARE!',
      music: 'music/04_Bowser_Castle.mp3',
      difficulty: 3,
      emoji: '🏰',
      uiColor: '#e2562e',
      roadHalf: 9,
      hasWalls: true,
      voidRespawn: false,
      shoulder: 3,
      tension: 0.5,            // 直角コーナーをきれいに丸める（路面・壁が破綻しない半径）
      boxesPerRow: 3,
      itemBoxFractions: [0.14, 0.34, 0.52, 0.7, 0.88],
      boostPads: [{ f: 0.26, lat: 0, w: 0.5 }, { f: 0.59, lat: 0, w: 0.5 }, { f: 0.92, lat: 0, w: 0.5 }],
      // 溶岩の海に浮かぶ城内アリーナ：直角に折れる回廊を、半径>wallHalf を保って閉ループ化。
      // 各コーナーは面取り＋直線中点で接線を整え、路肩の壁が交差(破綻)しないよう検証済み。
      // 中点(0,*)は長い直線、(±66,*)はコーナー入口、(±92,*)は壁沿いの縦回廊。
      points: [
        [-66, 12, 104], [0, 12, 104], [66, 13, 104],   // 下の回廊（スタート/フィニッシュ直線）→
        [92, 14, 78], [92, 15, 0], [92, 14, -78],       // 右の壁沿いを下る ↓
        [66, 13, -104], [0, 11, -104], [-66, 10, -104], // 上の回廊 ←
        [-92, 9, -78], [-92, 10, 0], [-92, 11, 78],     // 左の壁沿いを上ってスタートへ ↑
      ],
      theme: {
        sky: ['#1c0a06', '#52160c'], ground: 0x1a1014, fog: 0x35100a,
        fogNear: 70, fogFar: 360, light: 0.72,
        hemiSky: 0x6e2410, hemiGround: 0x140a08,
        road: '#3f3a47', wall: 0x4a4550, props: 'castle', bannerColor: '#7a1f0c',
        lava: true,
      },
    },
    {
      id: 'rainbow-road',
      name: 'RAINBOW ROAD',
      jp: 'レインボーロード',
      blurb: 'The ultimate floating track high in space',
      banner: 'RIDE THE RAINBOW!',
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
      boostPads: [{ f: 0.3, lat: 0, w: 0.5 }, { f: 0.56, lat: 0, w: 0.5 }, { f: 0.84, lat: 0, w: 0.5 }],
      points: [
        [0, 0, -155], [92, 14, -132], [152, 24, -58], [120, 30, 22],
        [162, 16, 92], [82, 6, 152], [-12, 20, 162], [-102, 30, 120],
        [-162, 18, 40], [-130, 8, -42], [-162, 18, -112], [-80, 6, -150],
      ],
      theme: {
        sky: ['#05050e', '#11113a'], ground: 0x05050e, fog: 0x11113a,
        fogNear: 170, fogFar: 720, light: 1.1,
        hemiSky: 0x6a6aff, hemiGround: 0x201040,
        road: '#888', props: 'rainbow', roadTransparent: true, bannerColor: '#3a1f6b',
      },
    },
  ];

  MK.COURSES = COURSES;

})(window.MK);
