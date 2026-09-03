// claw-pet hook for Claude Code.
// Usage: node claude-code-hook.js [start]
//   no arg  -> PostToolUse: reads stdin payload, reports success/fail
//   "start" -> PreToolUse: reports start immediately (no stdin needed)

const http = require('http');

function send(status) {
  const body = JSON.stringify({ status });
  const req = http.request(
    {
      host: '127.0.0.1',
      port: 4848,
      path: '/event',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 1000,
    },
    () => process.exit(0)
  );
  req.on('error', () => process.exit(0));
  req.on('timeout', () => {
    req.destroy();
    process.exit(0);
  });
  req.end(body);
}

if (process.argv[2] === 'start') {
  send('start');
} else {
  let raw = '';
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    let failed = false;
    try {
      const payload = JSON.parse(raw || '{}');
      const response = payload.tool_response;
      if (response && typeof response === 'object') {
        failed = response.is_error === true || response.interrupted === true;
      }
    } catch {
      // unparseable payload: treat as success so the pet never lies about errors
    }
    send(failed ? 'fail' : 'success');
  }

  // safety net: never let a stuck/absent stdin leave the pet typing forever
  const fallback = setTimeout(finish, 1500);
  fallback.unref();

  process.stdin.on('data', (chunk) => {
    raw += chunk;
  });
  process.stdin.on('end', finish);
  process.stdin.on('error', finish);
  process.stdin.resume();
}
