# cf-worker-telegram

[English](#english)

![Telegram Bot API Proxy](https://img.shields.io/badge/Telegram-Bot%20API%20Proxy-blue?logo=telegram)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)
![License](https://img.shields.io/badge/license-MIT-green)

## English

A lightweight and efficient Cloudflare Worker that acts as a transparent proxy for the Telegram Bot API.  
Now includes **bidirectional redirection**:
- You can send requests to Telegram via the proxy
- Telegram webhook updates will be forwarded to your own backend server

---

## Features

- Supports all Telegram Bot API methods
- Full CORS support for web applications
- High performance with Cloudflare's global edge network
- Embedded API documentation page
- Handles all HTTP methods: GET, POST, PUT, DELETE
- Supports `multipart/form-data` for file uploads (`sendPhoto`, `sendDocument`, etc.)
- Stable handling of emojis and special characters
- Access Telegram file paths via `/file/bot{TOKEN}/{file_path}`
- Automatically forwards webhook updates to your own bot server

---

## 🔧 Configuration

> ⚠️ You must change the `BOT_UPDATE_FORWARD_URL` constant in the code to point to your server URL that handles Telegram webhook updates.

```javascript
const BOT_UPDATE_FORWARD_URL = 'https://yourdomain.com/my-bot-handler';
````

This allows the worker to forward incoming Telegram webhook requests directly to your backend.

---

## Installation

1. Download the file:

   ```bash
   telegram-bot-proxy.js
   ```
2. Follow this guide to set up your Cloudflare Worker:
   [How to deploy Cloudflare Worker with a custom domain](https://dev.to/andyjessop/setting-up-a-new-cloudflare-worker-with-a-custom-domain-fl9)
3. Deploy:
   Paste the code into the Cloudflare Worker editor, update the `BOT_UPDATE_FORWARD_URL`, and deploy.

---

## Usage

Replace `api.telegram.org` with your Cloudflare Worker domain:

Original Telegram API:

```
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/sendMessage
```

Using the proxy:

```
https://{YOUR_WORKER_URL}/bot{YOUR_BOT_TOKEN}/sendMessage
```

---

### Webhook Setup

Set your webhook to use the proxy domain:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
     -H "Content-Type: application/json" \
     -d '{"url": "https://{YOUR_WORKER_URL}/botRedirect<YOUR_BOT_TOKEN>"}'
```

Now Telegram will POST updates to your proxy → which forwards it to your server.

---

### Example Code

```javascript
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
```

---

### Downloading Files from Telegram

```
https://{YOUR_WORKER_URL}/file/bot{YOUR_BOT_TOKEN}/{file_path}
```

---

## 🔒 Security

* This proxy does not store or modify your bot token
* All requests are forwarded directly to Telegram’s official servers
* HTTPS enforced by default (Cloudflare Workers)
* No logging or data storage
* Powered by Cloudflare’s global CDN — perfect for web apps

---

## 📚 Documentation

Visit the worker root URL in your browser for API documentation:

```
https://{YOUR_WORKER_URL}/
```
