const { app, BrowserWindow, screen } = require('electron');
const http = require('http');
const path = require('path');

const PORT = 4848;
const WIDTH = 220;
const HEIGHT = 220;

let win;

function createWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: sw - WIDTH - 20,
    y: sh - HEIGHT - 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false, // keep the sprite animating while unfocused
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function sendEvent(status) {
  if (win && !win.isDestroyed()) {
    win.webContents.send('pet-event', status);
  }
}

function startServer() {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/event') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const valid = ['start', 'success', 'fail', 'idle'];
          const status = valid.includes(data.status) ? data.status : 'idle';
          sendEvent(status);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'invalid json' }));
        }
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.on('error', (err) => {
    console.error('claw-pet server error:', err.message);
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`claw-pet listening on http://127.0.0.1:${PORT}`);
  });
}

app.whenReady().then(() => {
  createWindow();
  startServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
