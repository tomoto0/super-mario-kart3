/* ============================================================================
 *  main.js — 起動エントリ（DOM構築・配線・ループ開始）
 * ==========================================================================*/
(function () {
  'use strict';
  const MK = window.MK;

  function boot() {
    if (typeof THREE === 'undefined') {
      document.body.innerHTML = '<div style="color:#fff;font-family:sans-serif;padding:40px;text-align:center">' +
        '<h2>Three.js の読み込みに失敗しました</h2><p>インターネット接続を確認するか、ローカルサーバー経由で開いてください。</p></div>';
      return;
    }

    const overlay = document.getElementById('overlay');

    // HUD（下層）→ UI（上層）の順に構築
    MK.hud.build(overlay);
    MK.ui.build(overlay);

    const game = new MK.Game();
    MK.game = game;

    // UI コールバック配線
    MK.ui.cb.startRace = (char, course, diff) => game.startRace(char, course, diff);
    MK.ui.cb.resume = () => game.resume();
    MK.ui.cb.restart = () => game.restart();
    MK.ui.cb.quit = () => game.quitToTitle();
    MK.ui.cb.nextCourse = () => game.toCourseSelect();

    // 初回ジェスチャでオーディオを起動
    const initAudio = () => { MK.audio.init(); };
    window.addEventListener('pointerdown', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    MK.input.attach();
    MK.ui.showTitle();
    game.start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
