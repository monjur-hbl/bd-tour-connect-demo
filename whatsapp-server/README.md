# BD Tour Connect - WhatsApp Server

This is the WhatsApp Web backend server for BD Tour Connect. It uses `whatsapp-web.js` to connect to WhatsApp via QR code scanning.

## Prerequisites

- Node.js 18+ (LTS recommended)
- Google Chrome or Chromium browser installed on the server

## Installation

```bash
cd whatsapp-server
npm install
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |

## How It Works

1. **QR Code Scanning**: Agency admins can scan a QR code from their WhatsApp mobile app to link the account
2. **Session Persistence**: Sessions are stored locally in `.wwebjs_auth/` directory
3. **Real-time Communication**: Uses Socket.IO for real-time messaging
4. **Multi-Account Support**: Supports up to 2 WhatsApp accounts per agency

## API Endpoints

### REST API

- `GET /api/health` - Health check
- `GET /api/status/:agencyId` - Get WhatsApp connection status for an agency

### Socket.IO Events

**Client → Server:**
- `join` - Join agency room
- `whatsapp:connect` - Request QR code to connect
- `whatsapp:disconnect` - Disconnect WhatsApp account
- `whatsapp:send` - Send a message
- `whatsapp:fetch_messages` - Fetch messages for a chat
- `whatsapp:fetch_chats` - Fetch all chats
- `whatsapp:start_reply` - Start replying indicator
- `whatsapp:stop_reply` - Stop replying indicator

**Server → Client:**
- `whatsapp:qr` - QR code received
- `whatsapp:connected` - WhatsApp connected successfully
- `whatsapp:disconnected` - WhatsApp disconnected
- `whatsapp:chats` - Chat list received
- `whatsapp:messages` - Messages for a chat received
- `whatsapp:message` - New message received
- `whatsapp:message_sent` - Message sent confirmation
- `whatsapp:notification` - New message notification
- `whatsapp:error` - Error occurred

## Deployment Options

### Option 1: Local Server
Run on your local machine or a dedicated server. This is the simplest option for testing.

### Option 2: VPS/Cloud Server
Deploy to a VPS (DigitalOcean, Linode, AWS EC2, etc.) for production use.

Requirements:
- At least 1GB RAM
- Chrome/Chromium installed
- Node.js 18+
- Persistent storage for session data

### Option 3: Docker
```dockerfile
FROM node:18-slim

# Install Chrome
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["npm", "start"]
```

## Important Notes

⚠️ **WhatsApp Terms of Service**: Using unofficial WhatsApp automation may violate WhatsApp's Terms of Service. Use at your own risk. WhatsApp may ban accounts that use automation.

⚠️ **Keep Phone Connected**: Your phone must stay connected to the internet for WhatsApp Web to work.

⚠️ **Session Backup**: Regularly backup the `.wwebjs_auth/` directory to avoid re-scanning QR codes.

## Troubleshooting

### QR Code not appearing
- Make sure Chrome/Chromium is installed
- Check if port 3001 is not blocked by firewall
- Look at server logs for errors

### Session expired
- Delete the session folder in `.wwebjs_auth/`
- Restart the server and scan QR code again

### High memory usage
- Puppeteer (Chrome) uses significant memory
- Consider increasing server RAM or using swap space
