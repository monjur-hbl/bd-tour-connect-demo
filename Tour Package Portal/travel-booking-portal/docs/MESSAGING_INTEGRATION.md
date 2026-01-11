# 💬 Messaging Integration Guide - BD Tour Connect

## Overview

BD Tour Connect integrates with multiple messaging platforms to provide a unified inbox for travel agencies. This document covers the setup and implementation of:

1. **WhatsApp Business** (2 connections via QR code)
2. **Facebook Messenger** (Page + Profile support)

---

## 🟢 WhatsApp Integration

### Option 1: Evolution API (Recommended - Free)

Evolution API is an open-source WhatsApp integration that uses the Baileys library.

#### Setup

```bash
# Clone Evolution API
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run with Docker
docker-compose up -d
```

#### Environment Variables

```env
# Evolution API Configuration
SERVER_PORT=8080
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=your-api-key-here
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# Database (Using Firebase Firestore instead)
DATABASE_ENABLED=false

# WebSocket for real-time events
WEBSOCKET_ENABLED=true

# QR Code settings
QRCODE_LIMIT=5
QRCODE_COLOR=#000000
```

#### API Integration

```typescript
// services/evolution-api.ts
import axios from 'axios';

const EVOLUTION_API_URL = process.env.REACT_APP_EVOLUTION_API_URL;
const API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY;

const api = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    'apikey': API_KEY,
    'Content-Type': 'application/json'
  }
});

export class EvolutionWhatsAppService {
  private instanceName: string;
  
  constructor(instanceName: string) {
    this.instanceName = instanceName;
  }
  
  // Create new instance
  async createInstance(): Promise<{ instance: string; qrcode: string }> {
    const response = await api.post('/instance/create', {
      instanceName: this.instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    });
    return response.data;
  }
  
  // Get QR Code for scanning
  async getQRCode(): Promise<string> {
    const response = await api.get(`/instance/connect/${this.instanceName}`);
    return response.data.qrcode?.base64 || response.data.qrcode;
  }
  
  // Check connection status
  async getConnectionStatus(): Promise<'open' | 'close' | 'connecting'> {
    const response = await api.get(`/instance/connectionState/${this.instanceName}`);
    return response.data.state;
  }
  
  // Send text message
  async sendTextMessage(to: string, text: string): Promise<any> {
    const response = await api.post(`/message/sendText/${this.instanceName}`, {
      number: to,
      text: text
    });
    return response.data;
  }
  
  // Send media (image, document, etc.)
  async sendMedia(
    to: string, 
    mediaUrl: string, 
    mediaType: 'image' | 'document' | 'audio' | 'video',
    caption?: string
  ): Promise<any> {
    const response = await api.post(`/message/sendMedia/${this.instanceName}`, {
      number: to,
      mediatype: mediaType,
      media: mediaUrl,
      caption: caption
    });
    return response.data;
  }
  
  // Set typing indicator
  async setTyping(to: string, duration: number = 3000): Promise<void> {
    await api.post(`/chat/presence/${this.instanceName}`, {
      number: to,
      presence: 'composing'
    });
    
    // Stop typing after duration
    setTimeout(async () => {
      await api.post(`/chat/presence/${this.instanceName}`, {
        number: to,
        presence: 'available'
      });
    }, duration);
  }
  
  // Get messages history
  async getMessages(chatId: string, limit: number = 50): Promise<any[]> {
    const response = await api.post(`/chat/findMessages/${this.instanceName}`, {
      where: {
        key: {
          remoteJid: chatId
        }
      },
      limit: limit
    });
    return response.data;
  }
  
  // Disconnect instance
  async disconnect(): Promise<void> {
    await api.delete(`/instance/logout/${this.instanceName}`);
  }
}

// Create instances for two WhatsApp connections
export const whatsapp1 = new EvolutionWhatsAppService('agency-whatsapp-1');
export const whatsapp2 = new EvolutionWhatsAppService('agency-whatsapp-2');
```

#### Webhook Handler

```typescript
// functions/whatsapp-webhook.ts (Firebase Cloud Function)
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  const event = req.body;
  const db = admin.firestore();
  
  try {
    switch (event.event) {
      case 'messages.upsert':
        await handleNewMessage(db, event.data);
        break;
      case 'connection.update':
        await handleConnectionUpdate(db, event.data);
        break;
      case 'qrcode.updated':
        await handleQRCodeUpdate(db, event.data);
        break;
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

async function handleNewMessage(db: FirebaseFirestore.Firestore, data: any) {
  const message = data.message;
  const instanceName = data.instance;
  
  // Determine which WhatsApp connection this is
  const platform = instanceName.includes('-1') ? 'whatsapp1' : 'whatsapp2';
  
  // Extract message details
  const remoteJid = message.key.remoteJid;
  const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');
  const isFromMe = message.key.fromMe;
  const content = message.message?.conversation || 
                  message.message?.extendedTextMessage?.text ||
                  '[Media]';
  
  // Find or create conversation
  const conversationsRef = db.collection('conversations');
  const existingConv = await conversationsRef
    .where('platformId', '==', phoneNumber)
    .where('platform', '==', platform)
    .limit(1)
    .get();
  
  let conversationId: string;
  
  if (existingConv.empty) {
    // Create new conversation
    const newConv = await conversationsRef.add({
      agencyId: getAgencyIdFromInstance(instanceName),
      platform: platform,
      platformId: phoneNumber,
      customer: {
        id: phoneNumber,
        name: message.pushName || phoneNumber,
        phone: phoneNumber
      },
      lastMessage: {
        content: content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isFromCustomer: !isFromMe
      },
      status: 'active',
      unreadCount: isFromMe ? 0 : 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    conversationId = newConv.id;
  } else {
    conversationId = existingConv.docs[0].id;
    // Update conversation
    await conversationsRef.doc(conversationId).update({
      lastMessage: {
        content: content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isFromCustomer: !isFromMe
      },
      unreadCount: isFromMe 
        ? 0 
        : admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Add message to sub-collection
  await conversationsRef.doc(conversationId).collection('messages').add({
    conversationId: conversationId,
    senderId: isFromMe ? 'agent' : phoneNumber,
    senderName: isFromMe ? 'Agent' : (message.pushName || phoneNumber),
    senderType: isFromMe ? 'agent' : 'customer',
    content: content,
    contentType: getContentType(message.message),
    attachments: extractAttachments(message.message),
    platformMessageId: message.key.id,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

function getContentType(message: any): string {
  if (message.imageMessage) return 'image';
  if (message.documentMessage) return 'document';
  if (message.audioMessage) return 'audio';
  if (message.videoMessage) return 'video';
  return 'text';
}

function extractAttachments(message: any): any[] {
  // Extract media URLs from message
  // Implementation depends on media storage strategy
  return [];
}
```

### Option 2: WhatsApp Business Cloud API (Official)

For businesses with official WhatsApp Business API access.

```typescript
// services/whatsapp-cloud.ts
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.REACT_APP_WA_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.REACT_APP_WA_ACCESS_TOKEN;

export async function sendWhatsAppMessage(to: string, text: string) {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
      })
    }
  );
  return response.json();
}

// Typing indicator
export async function sendTypingIndicator(to: string) {
  await fetch(
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'reaction',
        typing: true
      })
    }
  );
}
```

---

## 🔵 Facebook Messenger Integration

### Setup Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → Select "Business" type
3. Add "Messenger" product
4. Set up Webhooks

### Environment Variables

```env
# Facebook App Configuration
REACT_APP_FB_APP_ID=your-app-id
REACT_APP_FB_APP_SECRET=your-app-secret
REACT_APP_FB_VERIFY_TOKEN=your-verify-token

# Page Access Token (obtained after OAuth)
# Stored in Firestore per agency
```

### OAuth Flow for Page Connection

```typescript
// services/facebook-auth.ts
const FB_APP_ID = process.env.REACT_APP_FB_APP_ID;
const REDIRECT_URI = 'https://your-app.com/auth/facebook/callback';

export function initiateMetaLogin(): void {
  const scope = [
    'pages_messaging',
    'pages_manage_metadata',
    'pages_read_engagement'
  ].join(',');
  
  const loginUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${FB_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${scope}` +
    `&response_type=code`;
  
  window.location.href = loginUrl;
}

// Handle OAuth callback
export async function handleFacebookCallback(code: string): Promise<{
  pageId: string;
  pageName: string;
  accessToken: string;
}> {
  // Exchange code for access token (do this server-side)
  const tokenResponse = await fetch('/api/facebook/exchange-token', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  const { accessToken, userId } = await tokenResponse.json();
  
  // Get user's pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/${userId}/accounts?access_token=${accessToken}`
  );
  const { data: pages } = await pagesResponse.json();
  
  // Return first page (or let user select)
  return {
    pageId: pages[0].id,
    pageName: pages[0].name,
    accessToken: pages[0].access_token // Page access token
  };
}
```

### Messenger Service

```typescript
// services/messenger.ts
export class MessengerService {
  private pageAccessToken: string;
  private pageId: string;
  
  constructor(pageAccessToken: string, pageId: string) {
    this.pageAccessToken = pageAccessToken;
    this.pageId = pageId;
  }
  
  // Send text message
  async sendMessage(recipientId: string, text: string): Promise<any> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${this.pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: text },
          messaging_type: 'RESPONSE'
        })
      }
    );
    return response.json();
  }
  
  // Send attachment
  async sendAttachment(
    recipientId: string, 
    type: 'image' | 'video' | 'audio' | 'file',
    url: string
  ): Promise<any> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${this.pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: type,
              payload: {
                url: url,
                is_reusable: true
              }
            }
          }
        })
      }
    );
    return response.json();
  }
  
  // Set typing indicator
  async setTypingOn(recipientId: string): Promise<void> {
    await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${this.pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: 'typing_on'
        })
      }
    );
  }
  
  async setTypingOff(recipientId: string): Promise<void> {
    await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${this.pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: 'typing_off'
        })
      }
    );
  }
  
  // Mark message as read
  async markSeen(recipientId: string): Promise<void> {
    await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${this.pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: 'mark_seen'
        })
      }
    );
  }
  
  // Get user profile
  async getUserProfile(psid: string): Promise<{
    name: string;
    profilePic: string;
  }> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${psid}?fields=name,profile_pic&access_token=${this.pageAccessToken}`
    );
    return response.json();
  }
}
```

### Messenger Webhook Handler

```typescript
// functions/messenger-webhook.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

// Webhook verification (GET request from Facebook)
export const messengerWebhookVerify = functions.https.onRequest((req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook for incoming messages (POST request)
export const messengerWebhook = functions.https.onRequest(async (req, res) => {
  const body = req.body;
  
  if (body.object !== 'page') {
    res.sendStatus(404);
    return;
  }
  
  const db = admin.firestore();
  
  for (const entry of body.entry) {
    const pageId = entry.id;
    
    for (const event of entry.messaging) {
      const senderId = event.sender.id;
      
      if (event.message) {
        await handleIncomingMessage(db, pageId, senderId, event.message);
      }
      
      if (event.read) {
        await handleReadReceipt(db, pageId, senderId, event.read);
      }
      
      if (event.delivery) {
        await handleDeliveryReceipt(db, pageId, senderId, event.delivery);
      }
    }
  }
  
  res.status(200).send('EVENT_RECEIVED');
});

async function handleIncomingMessage(
  db: FirebaseFirestore.Firestore,
  pageId: string,
  senderId: string,
  message: any
) {
  // Find agency by page ID
  const agenciesRef = db.collection('agencies');
  const agencyQuery = await agenciesRef
    .where('messagingConfig.messenger.pageId', '==', pageId)
    .limit(1)
    .get();
  
  if (agencyQuery.empty) {
    console.error('No agency found for page:', pageId);
    return;
  }
  
  const agency = agencyQuery.docs[0];
  const agencyId = agency.id;
  
  // Get message content
  const content = message.text || '[Attachment]';
  const attachments = message.attachments?.map((att: any) => ({
    type: att.type,
    url: att.payload.url
  })) || [];
  
  // Find or create conversation
  const conversationsRef = db.collection('conversations');
  const existingConv = await conversationsRef
    .where('platformId', '==', senderId)
    .where('platform', '==', 'messenger')
    .where('agencyId', '==', agencyId)
    .limit(1)
    .get();
  
  let conversationId: string;
  
  if (existingConv.empty) {
    // Get user profile from Facebook
    const pageToken = agency.data().messagingConfig.messenger.pageAccessToken;
    const userProfile = await getUserProfile(senderId, pageToken);
    
    // Create new conversation
    const newConv = await conversationsRef.add({
      agencyId: agencyId,
      platform: 'messenger',
      platformId: senderId,
      customer: {
        id: senderId,
        name: userProfile.name,
        avatar: userProfile.profile_pic
      },
      lastMessage: {
        content: content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isFromCustomer: true
      },
      status: 'active',
      unreadCount: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    conversationId = newConv.id;
  } else {
    conversationId = existingConv.docs[0].id;
    await conversationsRef.doc(conversationId).update({
      lastMessage: {
        content: content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isFromCustomer: true
      },
      unreadCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Add message
  await conversationsRef.doc(conversationId).collection('messages').add({
    conversationId: conversationId,
    senderId: senderId,
    senderName: 'Customer',
    senderType: 'customer',
    content: content,
    contentType: attachments.length > 0 ? attachments[0].type : 'text',
    attachments: attachments,
    platformMessageId: message.mid,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function getUserProfile(psid: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${psid}?fields=name,profile_pic&access_token=${accessToken}`
  );
  return response.json();
}
```

---

## 🤝 Agent Typing Indicator Implementation

### Real-time Typing Status with Firestore

```typescript
// hooks/useTypingIndicator.ts
import { useEffect, useCallback } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UseTypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
}

export function useTypingIndicator({
  conversationId,
  currentUserId,
  currentUserName
}: UseTypingIndicatorProps) {
  
  // Start typing
  const startTyping = useCallback(async () => {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      isAgentTyping: true,
      typingAgentId: currentUserId,
      typingAgentName: currentUserName,
      typingStartedAt: new Date()
    });
  }, [conversationId, currentUserId, currentUserName]);
  
  // Stop typing
  const stopTyping = useCallback(async () => {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      isAgentTyping: false,
      typingAgentId: null,
      typingAgentName: null,
      typingStartedAt: null
    });
  }, [conversationId]);
  
  // Auto-stop after 5 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleKeyPress = () => {
      startTyping();
      clearTimeout(timeout);
      timeout = setTimeout(stopTyping, 5000);
    };
    
    // Listen for input events
    document.addEventListener('keypress', handleKeyPress);
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeout);
    };
  }, [startTyping, stopTyping]);
  
  return { startTyping, stopTyping };
}

// Listen for other agents typing
export function useOtherAgentTyping(
  conversationId: string,
  currentUserId: string
) {
  const [typingAgent, setTypingAgent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  
  useEffect(() => {
    const conversationRef = doc(db, 'conversations', conversationId);
    
    const unsubscribe = onSnapshot(conversationRef, (doc) => {
      const data = doc.data();
      
      if (
        data?.isAgentTyping && 
        data?.typingAgentId !== currentUserId
      ) {
        setTypingAgent({
          id: data.typingAgentId,
          name: data.typingAgentName
        });
      } else {
        setTypingAgent(null);
      }
    });
    
    return () => unsubscribe();
  }, [conversationId, currentUserId]);
  
  return typingAgent;
}
```

### Typing Indicator Component

```typescript
// components/messaging/TypingIndicator.tsx
interface TypingIndicatorProps {
  agentName: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ agentName }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-sand-500">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" 
              style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" 
              style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" 
              style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-primary-600 font-medium">{agentName}</span>
      <span>is replying...</span>
    </div>
  );
};
```

---

## 🔐 Security Considerations

### Token Storage
- Store page access tokens encrypted in Firestore
- Use Firebase Functions to handle token operations
- Never expose tokens to client-side code

### Webhook Verification
- Always verify webhook signatures
- Use HTTPS for all webhook endpoints
- Implement rate limiting

### User Privacy
- Comply with GDPR and local data protection laws
- Allow users to request data deletion
- Implement conversation archiving

---

## 📱 QR Code Scanner Component

```typescript
// components/messaging/WhatsAppQRScanner.tsx
import { useState, useEffect } from 'react';
import { whatsapp1, whatsapp2 } from '../services/evolution-api';

interface WhatsAppQRScannerProps {
  instanceNumber: 1 | 2;
  onConnected: () => void;
}

export const WhatsAppQRScanner: React.FC<WhatsAppQRScannerProps> = ({
  instanceNumber,
  onConnected
}) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'waiting' | 'connected' | 'error'>('loading');
  
  const service = instanceNumber === 1 ? whatsapp1 : whatsapp2;
  
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const initConnection = async () => {
      try {
        // Create instance and get QR code
        await service.createInstance();
        const qr = await service.getQRCode();
        setQrCode(qr);
        setStatus('waiting');
        
        // Poll for connection status
        pollInterval = setInterval(async () => {
          const state = await service.getConnectionStatus();
          if (state === 'open') {
            setStatus('connected');
            clearInterval(pollInterval);
            onConnected();
          }
        }, 2000);
        
      } catch (error) {
        console.error('QR init error:', error);
        setStatus('error');
      }
    };
    
    initConnection();
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [instanceNumber]);
  
  return (
    <div className="bg-white rounded-2xl shadow-card p-8 text-center">
      <h3 className="heading-sm mb-4">
        WhatsApp {instanceNumber} কানেক্ট করুন
      </h3>
      
      {status === 'loading' && (
        <div className="w-64 h-64 mx-auto bg-sand-100 rounded-xl animate-pulse flex items-center justify-center">
          <span className="text-sand-400">Loading...</span>
        </div>
      )}
      
      {status === 'waiting' && qrCode && (
        <>
          <div className="w-64 h-64 mx-auto bg-white p-4 rounded-xl border-2 border-sand-200">
            <img 
              src={`data:image/png;base64,${qrCode}`} 
              alt="WhatsApp QR Code"
              className="w-full h-full"
            />
          </div>
          <p className="mt-4 text-sand-600">
            WhatsApp ওপেন করে এই QR কোড স্ক্যান করুন
          </p>
          <p className="text-sm text-sand-400 mt-2">
            Settings → Linked Devices → Link a Device
          </p>
        </>
      )}
      
      {status === 'connected' && (
        <div className="py-12">
          <div className="w-20 h-20 mx-auto bg-success-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">✓</span>
          </div>
          <p className="text-success-600 font-semibold">সফলভাবে কানেক্ট হয়েছে!</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="py-12">
          <p className="text-danger-600">কানেকশনে সমস্যা হয়েছে</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 🚀 Deployment Checklist

### WhatsApp (Evolution API)
- [ ] Deploy Evolution API to Cloud Run or VPS
- [ ] Configure webhook URLs
- [ ] Set up SSL certificate
- [ ] Test QR code flow
- [ ] Test message sending/receiving
- [ ] Test typing indicators

### Facebook Messenger
- [ ] Create Facebook App
- [ ] Configure Messenger product
- [ ] Set up webhook subscriptions
- [ ] Complete App Review (if needed)
- [ ] Test OAuth flow
- [ ] Test message flow

### Security
- [ ] Store tokens securely
- [ ] Implement rate limiting
- [ ] Set up error monitoring
- [ ] Configure backup webhooks

---

*Messaging Integration Guide v1.0 - BD Tour Connect*
