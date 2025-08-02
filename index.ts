// CONFIG: Your bot server URL to receive webhook updates
const BOT_UPDATE_FORWARD_URL = 'https://yourdomain.com/my-bot-handler'; // change this

const TELEGRAM_API_BASE = 'https://api.telegram.org';

const DOC_HTML = `<!DOCTYPE html>
<html>
<head>
    <title>Telegram Bot API Proxy Documentation</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #0088cc; }
        .code {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            overflow-x: auto;
        }
        .note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
        .example {
            background: #e7f5ff;
            border-left: 4px solid #0088cc;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>Telegram Bot API Proxy</h1>
    <p>This service acts as a transparent proxy for the Telegram Bot API. It allows you to bypass network restrictions and create middleware for your Telegram bot applications.</p>
    <h2>How to Use</h2>
    <p>Replace <code>api.telegram.org</code> with this worker's URL in your API calls.</p>
    <div class="example">
        <h3>Example Usage:</h3>
        <p>Original Telegram API URL:</p>
        <div class="code">https://api.telegram.org/bot{YOUR_BOT_TOKEN}/sendMessage</div>
        <p>Using this proxy:</p>
        <div class="code">https://{YOUR_WORKER_URL}/bot{YOUR_BOT_TOKEN}/sendMessage</div>
    </div>
    <h2>Features</h2>
    <ul>
        <li>Supports all Telegram Bot API methods</li>
        <li>Handles both GET and POST requests</li>
        <li>Full CORS support for browser-based applications</li>
        <li>Transparent proxying of responses</li>
        <li>Maintains original status codes and headers</li>
    </ul>
    <div class="note">
        <strong>Note:</strong> This proxy does not store or modify your bot tokens. All requests are forwarded directly to Telegram's API servers.
    </div>
    <h2>Example Code</h2>
    <div class="code">
// JavaScript Example
fetch('https://{YOUR_WORKER_URL}/bot{YOUR_BOT_TOKEN}/sendMessage', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        chat_id: "123456789",
        text: "Hello from Telegram Bot API Proxy!"
    })
})
.then(response => response.json())
.then(data => console.log(data));
    </div>
</body>
</html>`;

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Serve docs
  if (url.pathname === '/' || pathParts.length === 0) {
    return new Response(DOC_HTML, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Webhook redirection: POST to /botRedirect<TOKEN>
  if (pathParts.length === 1 && pathParts[0].startsWith('botRedirect') && request.method === 'POST') {
    try {
      const forwardReq = new Request(BOT_UPDATE_FORWARD_URL, {
        method: 'POST',
        headers: request.headers,
        body: request.body,
      });
      const response = await fetch(forwardReq);
      return new Response(response.body, response);
    } catch (err) {
      return new Response(`Failed to forward webhook: ${err.message}`, { status: 500 });
    }
  }

  // Proxy to Telegram API
  const isFileReq = pathParts[0] === 'file';
  const isBotReq = pathParts[0].startsWith('bot');
  if ((!isFileReq && !isBotReq) || (isFileReq && (!pathParts[1] || !pathParts[1].startsWith('bot')))) {
    return new Response('Invalid request format', { status: 400 });
  }

  const telegramUrl = `${TELEGRAM_API_BASE}${url.pathname}${url.search}`;
  const headers = new Headers(request.headers);
  const contentType = headers.get('Content-Type');
  if (contentType && contentType.startsWith('application/json') && !contentType.includes('charset')) {
    headers.set('Content-Type', 'application/json; charset=UTF-8');
  }

  const init = {
    method: request.method,
    headers,
    redirect: 'follow',
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  };

  try {
    const tgRes = await fetch(telegramUrl, init);
    const res = new Response(tgRes.body, tgRes);
    const reqAllowHeaders = request.headers.get('Access-Control-Request-Headers');
    const allowHeaders = reqAllowHeaders || 'Content-Type';
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.headers.set('Access-Control-Allow-Headers', allowHeaders);
    return res;
  } catch (err) {
    return new Response(`Error proxying request: ${err.message}`, { status: 500 });
  }
}

function handleOptions(request) {
  const reqAllowHeaders = request.headers.get('Access-Control-Request-Headers');
  const allowHeaders = reqAllowHeaders || 'Content-Type';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': allowHeaders,
    'Access-Control-Max-Age': '86400',
  };

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

addEventListener('fetch', event => {
  const request = event.request;
  if (request.method === 'OPTIONS') {
    event.respondWith(handleOptions(request));
  } else {
    event.respondWith(handleRequest(request));
  }
});
