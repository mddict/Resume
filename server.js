const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg'
};
const files = new Set(['index.html', 'style.css', 'script.js', 'waves.js', 'project.html', 'assets/profile.png', 'assets/typography.css', 'assets/theme.css', 'assets/button-click.mp3', 'assets/button-close.mp3']);

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const resolved = path.resolve(__dirname, file);
    if (!resolved.startsWith(__dirname + path.sep)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }
    const isShowcaseImage = /^assets\/image[1-9]\.png$/.test(file);
    const isVendor = /^assets\/vendor\/[a-zA-Z0-9-]+\.(js|woff2|ttf)$/.test(file);

    const isCoursework = /^WeeklyAssignment\/W[3-7]\//.test(file) &&
      !file.includes('__MACOSX') && !file.split('/').some(part => part.startsWith('.')) &&
      /\.(html|css|js|jpeg|jpg|png|gif|svg|webp)$/i.test(file);

    if (!files.has(file) && !isVendor && !isShowcaseImage && !isCoursework) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    const content = await fs.readFile(path.join(__dirname, file));
    response.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(3000, '127.0.0.1', () => {
  console.log('Personal Space: http://localhost:3000');
});
