# 💬 Messaging Integration Guide

## WhatsApp & Facebook Messenger Setup

---

## WhatsApp Integration (Evolution API)

### Overview
We use Evolution API (Baileys-based) for WhatsApp integration. This allows:
- QR code-based connection (no business API needed)
- Multiple instances (2 WhatsApp accounts)
- Send/receive messages
- Typing indicators
- Media support

### Setup Evolution API

```bash
# Docker deployment
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=your-api-key \
  atendai/evolution-api
```

### API Service

```typescript
// src/services/evolutionAPI.ts
const EVOLUTION_API_URL = process.env.REACT_APP_EVOLUTION_API_URL;
const API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY;

export const evolutionAPI = {
  // Create WhatsApp instance
  async createInstance(instanceName: string) {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    });
    return response.json();
  },

  // Get QR Code
  async getQRCode(instanceName: string) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      { headers: { 'apikey': API_KEY } }
    );
    return response.json();
  },

  // Get connection status
  async getConnectionStatus(instanceName: string) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
      { headers: { 'apikey': API_KEY } }
    );
    return response.json();
  },

  // Send text message
  async sendTextMessage(instanceName: string, to: string, text: string) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({
          number: to,
          text
        })
      }
    );
    return response.json();
  },

  // Send media
  async sendMedia(instanceName: string, to: string, mediaUrl: string, caption?: string) {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({
          number: to,
          mediatype: 'image',
          media: mediaUrl,
          caption
        })
      }
    );
    return response.json();
  },

  // Set typing indicator
  async setTyping(instanceName: string, to: string, isTyping: boolean) {
    await fetch(
      `${EVOLUTION_API_URL}/chat/presence/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({
          number: to,
          presence: isTyping ? 'composing' : 'paused'
        })
      }
    );
  }
};
```

### Webhook Handler (Cloud Function)

```typescript
// functions/src/webhooks/whatsappWebhook.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  const { event, data, instance } = req.body;

  if (event === 'messages.upsert') {
    const message = data.message;
    const from = message.key.remoteJid.replace('@s.whatsapp.net', '');
    const content = message.message?.conversation || 
                   message.message?.extendedTextMessage?.text || '';

    // Determine which WhatsApp instance
    const platform = instance === 'whatsapp1' ? 'whatsapp1' : 'whatsapp2';

    // Find or create conversation
    const conversationsRef = admin.firestore().collection('conversations');
    const q = conversationsRef
      .where('customer.id', '==', from)
      .where('platform', '==', platform)
      .limit(1);

    const snapshot = await q.get();
    let conversationId: string;

    if (snapshot.empty) {
      // Create new conversation
      const newConv = await conversationsRef.add({
        agencyId: await getAgencyIdForInstance(instance),
        platform,
        customer: { id: from, phone: from },
        lastMessage: { content, timestamp: admin.firestore.FieldValue.serverTimestamp(), isFromCustomer: true },
        unreadCount: 1,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      conversationId = newConv.id;
    } else {
      conversationId = snapshot.docs[0].id;
      await conversationsRef.doc(conversationId).update({
        lastMessage: { content, timestamp: admin.firestore.FieldValue.serverTimestamp(), isFromCustomer: true },
        unreadCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Save message
    await conversationsRef.doc(conversationId).collection('messages').add({
      sender: { type: 'customer', id: from },
      content,
      contentType: 'text',
      externalMessageId: message.key.id,
      status: 'delivered',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  res.status(200).send('OK');
});
```

---

## Facebook Messenger Integration

### Setup Facebook App

1. Create Facebook App at developers.facebook.com
2. Add Messenger product
3. Configure webhook
4. Get Page Access Token

### OAuth Flow

```typescript
// src/services/messengerService.ts
const FB_APP_ID = process.env.REACT_APP_FB_APP_ID;
const REDIRECT_URI = process.env.REACT_APP_FB_REDIRECT_URI;

export const messengerService = {
  // Get OAuth URL
  getOAuthURL(agencyId: string) {
    const scopes = [
      'pages_messaging',
      'pages_manage_metadata',
      'pages_read_engagement'
    ].join(',');

    return `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FB_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${scopes}` +
      `&state=${agencyId}`;
  },

  // Send message
  async sendMessage(pageAccessToken: string, recipientId: string, text: string) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pageAccessToken}`
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text }
        })
      }
    );
    return response.json();
  },

  // Set typing indicator
  async setTyping(pageAccessToken: string, recipientId: string, isTyping: boolean) {
    await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pageAccessToken}`
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: isTyping ? 'typing_on' : 'typing_off'
      })
    });
  },

  // Mark as seen
  async markSeen(pageAccessToken: string, recipientId: string) {
    await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pageAccessToken}`
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: 'mark_seen'
      })
    });
  }
};
```

### Messenger Webhook

```typescript
// functions/src/webhooks/messengerWebhook.ts
export const messengerWebhook = functions.https.onRequest(async (req, res) => {
  // Webhook verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
    return;
  }

  // Handle incoming messages
  const { object, entry } = req.body;

  if (object === 'page') {
    for (const pageEntry of entry) {
      const pageId = pageEntry.id;
      const messaging = pageEntry.messaging || [];

      for (const event of messaging) {
        if (event.message) {
          const senderId = event.sender.id;
          const content = event.message.text;

          // Find agency by page ID
          const agencyId = await getAgencyIdByPageId(pageId);
          
          // Create/update conversation and save message
          await handleIncomingMessage(agencyId, 'messenger', senderId, content);
        }
      }
    }
  }

  res.status(200).send('EVENT_RECEIVED');
});
```

---

## Agent Typing Indicator

### Firestore Structure

```typescript
// In conversation document
{
  isAgentTyping: boolean,
  typingAgentId: string | null,
  typingAgentName: string | null,
  typingStartedAt: Timestamp | null
}
```

### Typing Hook

```typescript
// src/hooks/useTypingIndicator.ts
export function useTypingIndicator(conversationId: string) {
  const { user } = useAuthStore();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startTyping = useCallback(async () => {
    const convRef = doc(db, 'conversations', conversationId);
    
    await updateDoc(convRef, {
      isAgentTyping: true,
      typingAgentId: user.uid,
      typingAgentName: user.name,
      typingStartedAt: serverTimestamp()
    });

    // Auto-stop after 5 seconds
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(stopTyping, 5000);
  }, [conversationId, user]);

  const stopTyping = useCallback(async () => {
    const convRef = doc(db, 'conversations', conversationId);
    
    await updateDoc(convRef, {
      isAgentTyping: false,
      typingAgentId: null,
      typingAgentName: null,
      typingStartedAt: null
    });
    
    clearTimeout(timeoutRef.current);
  }, [conversationId]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return { startTyping, stopTyping };
}
```

### Other Agent Typing Listener

```typescript
// src/hooks/useOtherAgentTyping.ts
export function useOtherAgentTyping(conversationId: string) {
  const { user } = useAuthStore();
  const [otherAgent, setOtherAgent] = useState<{
    isTyping: boolean;
    name: string | null;
  }>({ isTyping: false, name: null });

  useEffect(() => {
    const convRef = doc(db, 'conversations', conversationId);
    
    const unsubscribe = onSnapshot(convRef, (snapshot) => {
      const data = snapshot.data();
      
      if (data?.isAgentTyping && data.typingAgentId !== user.uid) {
        setOtherAgent({
          isTyping: true,
          name: data.typingAgentName
        });
      } else {
        setOtherAgent({ isTyping: false, name: null });
      }
    });

    return unsubscribe;
  }, [conversationId, user.uid]);

  return otherAgent;
}
```

### Typing Indicator Component

```tsx
// src/components/messaging/TypingIndicator.tsx
export function TypingIndicator({ agentName }: { agentName: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 text-warning-800 text-sm rounded-lg">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-warning-500 rounded-full animate-bounce" 
          style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-warning-500 rounded-full animate-bounce" 
          style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-warning-500 rounded-full animate-bounce" 
          style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {agentName} is replying...
        <span className="font-bengali ml-1">{agentName} উত্তর দিচ্ছেন...</span>
      </span>
    </div>
  );
}
```

---

## QR Code Scanner Component

```tsx
// src/components/messaging/WhatsAppQRScanner.tsx
interface QRScannerProps {
  instanceId: 'whatsapp1' | 'whatsapp2';
  agencyId: string;
  onConnected: () => void;
}

export function WhatsAppQRScanner({ instanceId, agencyId, onConnected }: QRScannerProps) {
  const [status, setStatus] = useState<'loading' | 'waiting' | 'connected' | 'error'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkConnection = async () => {
      try {
        const instanceName = `${agencyId}_${instanceId}`;
        const connStatus = await evolutionAPI.getConnectionStatus(instanceName);

        if (connStatus.state === 'open') {
          setStatus('connected');
          onConnected();
          clearInterval(interval);
        } else {
          const qr = await evolutionAPI.getQRCode(instanceName);
          setQrCode(qr.base64);
          setStatus('waiting');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    checkConnection();
    interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, [instanceId, agencyId, onConnected]);

  return (
    <div className="card p-8 text-center">
      <h3 className="heading-md mb-6">
        Connect WhatsApp {instanceId === 'whatsapp1' ? '#1' : '#2'}
        <span className="font-bengali block text-lg text-sand-600">
          হোয়াটসঅ্যাপ {instanceId === 'whatsapp1' ? '#১' : '#২'} সংযুক্ত করুন
        </span>
      </h3>

      {status === 'loading' && (
        <div className="flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent 
            rounded-full animate-spin" />
        </div>
      )}

      {status === 'waiting' && qrCode && (
        <div className="space-y-4">
          <img 
            src={qrCode} 
            alt="WhatsApp QR Code" 
            className="mx-auto w-64 h-64 rounded-xl shadow-lg"
          />
          <p className="text-sand-600">
            Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
          </p>
          <p className="font-bengali text-sand-500">
            আপনার ফোনে WhatsApp খুলুন → সেটিংস → লিঙ্কড ডিভাইস → একটি ডিভাইস লিঙ্ক করুন
          </p>
        </div>
      )}

      {status === 'connected' && (
        <div className="py-8">
          <div className="w-20 h-20 mx-auto bg-success-100 rounded-full 
            flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-12 h-12 text-success-500" />
          </div>
          <p className="text-success-600 font-semibold text-lg">
            Connected Successfully!
            <span className="font-bengali block">সফলভাবে সংযুক্ত!</span>
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="py-8">
          <p className="text-danger-600">
            Connection failed. Please try again.
            <span className="font-bengali block">সংযোগ ব্যর্থ। আবার চেষ্টা করুন।</span>
          </p>
          <Button onClick={() => setStatus('loading')} className="mt-4">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

*Messaging Integration Guide v1.0 - BD Tour Connect*
