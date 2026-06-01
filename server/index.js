/* ============================================================================
 *  server/index.js — 依存ゼロの静的ファイルサーバー
 *  client/public を配信。`node server/index.js` で起動。
 * ==========================================================================*/
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'client', 'public');
const PORT = process.env.PORT || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

// ファイル送出（HTTP Range 対応。BGM(MP3) 等のメディアは Safari が
// Range/206 を要求するため、createReadStream でストリーミング配信する）
function sendFile(req, res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end('Not Found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const base = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Accept-Ranges': 'bytes' };
    const total = stat.size;
    const range = req.headers.range;
    const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      let start = m[1] === '' ? null : parseInt(m[1], 10);
      let end = m[2] === '' ? null : parseInt(m[2], 10);
      if (start === null) { start = Math.max(0, total - (end || 0)); end = total - 1; }  // suffix range
      else if (end === null || end >= total) { end = total - 1; }
      if (isNaN(start) || isNaN(end) || start > end || start >= total) {
        res.writeHead(416, { 'Content-Range': 'bytes */' + total, 'Accept-Ranges': 'bytes' });
        res.end(); return;
      }
      res.writeHead(206, Object.assign({}, base, {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
        'Content-Length': end - start + 1,
      }));
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(filePath, { start, end }).on('error', () => res.end()).pipe(res);
      return;
    }
    res.writeHead(200, Object.assign({}, base, { 'Content-Length': total }));
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(filePath).on('error', () => { try { res.end(); } catch (e) {} }).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/game.html';

  // パストラバーサル対策
  const safe = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.stat(filePath, (err, stat) => {
    // フォールバック：見つからなければ game.html
    if (err || !stat.isFile()) filePath = path.join(ROOT, 'game.html');
    sendFile(req, res, filePath);
  });
});

server.listen(PORT, () => {
  console.log('🏎️  3D Super Mario Kart');
  console.log('   → http://localhost:' + PORT + '/game.html');
});
