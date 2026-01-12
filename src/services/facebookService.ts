import { useFacebookStore } from '../stores/facebookStore';
import {
  FacebookPage,
  FacebookPageConversation,
  FacebookPageMessage,
  FacebookMessengerAccount,
  FacebookConnectionStatus,
} from '../types';

// Facebook Graph API base URL
const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

// Facebook App credentials (should be in env)
const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.REACT_APP_FACEBOOK_APP_SECRET || '';

class FacebookService {
  private agencyId: string | null = null;

  // Initialize service for an agency
  init(agencyId: string) {
    this.agencyId = agencyId;
    console.log('Facebook Service initialized for agency:', agencyId);
  }

  // ============================================
  // FACEBOOK LOGIN & AUTH
  // ============================================

  // Get Facebook Login URL for OAuth
  getFacebookLoginUrl(redirectUri: string, scope: string[]): string {
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      redirect_uri: redirectUri,
      scope: scope.join(','),
      response_type: 'code',
      state: this.agencyId || '',
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  // Exchange auth code for access token
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri: redirectUri,
      code,
    });

    const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }
    return response.json();
  }

  // Get long-lived token from short-lived token
  async getLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to get long-lived token');
    }
    return response.json();
  }

  // ============================================
  // FACEBOOK PAGE MANAGEMENT
  // ============================================

  // Get pages managed by user
  async getUserPages(accessToken: string): Promise<FacebookPage[]> {
    const response = await fetch(
      `${GRAPH_API_BASE}/me/accounts?fields=id,name,category,picture,cover,access_token,followers_count,fan_count&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user pages');
    }

    const data = await response.json();

    return data.data.map((page: any) => ({
      id: `fb_page_${page.id}`,
      pageId: page.id,
      name: page.name,
      category: page.category,
      profilePicture: page.picture?.data?.url,
      coverPhoto: page.cover?.source,
      accessToken: page.access_token,
      status: 'disconnected' as FacebookConnectionStatus,
      agencyId: this.agencyId || '',
      followers: page.followers_count,
      likes: page.fan_count,
    }));
  }

  // Connect a Facebook Page
  async connectPage(page: FacebookPage): Promise<void> {
    // Subscribe to webhooks for this page
    const subscribeResponse = await fetch(
      `${GRAPH_API_BASE}/${page.pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,message_reads&access_token=${page.accessToken}`,
      { method: 'POST' }
    );

    if (!subscribeResponse.ok) {
      throw new Error('Failed to subscribe page to webhooks');
    }

    // Update store
    useFacebookStore.getState().addPage({
      ...page,
      status: 'connected',
      connectedAt: new Date().toISOString(),
    });
  }

  // Disconnect a Facebook Page
  async disconnectPage(pageId: string): Promise<void> {
    const pages = useFacebookStore.getState().pages;
    const page = pages.find((p) => p.id === pageId);

    if (page) {
      // Unsubscribe from webhooks
      await fetch(
        `${GRAPH_API_BASE}/${page.pageId}/subscribed_apps?access_token=${page.accessToken}`,
        { method: 'DELETE' }
      );
    }

    useFacebookStore.getState().removePage(pageId);
  }

  // ============================================
  // PAGE CONVERSATIONS
  // ============================================

  // Get conversations for a page
  async getPageConversations(page: FacebookPage): Promise<FacebookPageConversation[]> {
    const response = await fetch(
      `${GRAPH_API_BASE}/${page.pageId}/conversations?fields=id,participants,updated_time,unread_count,snippet&access_token=${page.accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch page conversations');
    }

    const data = await response.json();

    return data.data.map((conv: any) => {
      const participant = conv.participants?.data?.find((p: any) => p.id !== page.pageId);

      return {
        id: conv.id,
        pageId: page.id,
        participantId: participant?.id || '',
        participantName: participant?.name || 'Unknown',
        participantProfilePic: participant?.picture?.data?.url,
        unreadCount: conv.unread_count || 0,
        isActive: true,
        snippet: conv.snippet,
        updatedAt: conv.updated_time,
      };
    });
  }

  // Get messages for a conversation
  async getConversationMessages(
    page: FacebookPage,
    conversationId: string
  ): Promise<FacebookPageMessage[]> {
    const response = await fetch(
      `${GRAPH_API_BASE}/${conversationId}/messages?fields=id,message,from,to,created_time,attachments&access_token=${page.accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch conversation messages');
    }

    const data = await response.json();

    return data.data.map((msg: any) => ({
      id: msg.id,
      pageId: page.id,
      conversationId,
      senderId: msg.from?.id,
      senderName: msg.from?.name,
      recipientId: msg.to?.data?.[0]?.id,
      fromPage: msg.from?.id === page.pageId,
      type: msg.attachments ? 'image' : 'text',
      body: msg.message || '',
      attachmentUrl: msg.attachments?.data?.[0]?.image_data?.url,
      timestamp: msg.created_time,
      status: 'delivered',
    }));
  }

  // Send message from page
  async sendPageMessage(
    page: FacebookPage,
    recipientId: string,
    message: { text?: string; attachment?: { type: string; payload: { url: string } } }
  ): Promise<FacebookPageMessage> {
    const response = await fetch(`${GRAPH_API_BASE}/${page.pageId}/messages?access_token=${page.accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();

    return {
      id: data.message_id,
      pageId: page.id,
      conversationId: '',
      senderId: page.pageId,
      recipientId,
      fromPage: true,
      type: message.text ? 'text' : 'image',
      body: message.text || '',
      attachmentUrl: message.attachment?.payload?.url,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
  }

  // ============================================
  // MESSENGER (Personal Account)
  // ============================================

  // Get user's Messenger profile
  async getMessengerProfile(accessToken: string): Promise<FacebookMessengerAccount> {
    const response = await fetch(
      `${GRAPH_API_BASE}/me?fields=id,name,picture&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Messenger profile');
    }

    const data = await response.json();

    return {
      id: `messenger_${data.id}`,
      userId: data.id,
      name: data.name,
      profilePicture: data.picture?.data?.url,
      accessToken,
      status: 'connected',
      connectedAt: new Date().toISOString(),
      agencyId: this.agencyId || '',
    };
  }

  // ============================================
  // WEBHOOK HANDLING (for backend)
  // ============================================

  // Verify webhook callback (used by backend)
  verifyWebhook(mode: string, token: string, challenge: string, verifyToken: string): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  // Process incoming webhook event (used by backend)
  processWebhookEvent(event: any): void {
    const { object, entry } = event;

    if (object === 'page') {
      entry.forEach((pageEntry: any) => {
        const pageId = pageEntry.id;

        pageEntry.messaging?.forEach((messagingEvent: any) => {
          if (messagingEvent.message) {
            this.handleIncomingMessage(pageId, messagingEvent);
          } else if (messagingEvent.read) {
            this.handleMessageRead(pageId, messagingEvent);
          } else if (messagingEvent.delivery) {
            this.handleMessageDelivery(pageId, messagingEvent);
          }
        });
      });
    }
  }

  private handleIncomingMessage(pageId: string, event: any): void {
    const { sender, message, timestamp } = event;

    const newMessage: FacebookPageMessage = {
      id: message.mid,
      pageId: `fb_page_${pageId}`,
      conversationId: '',
      senderId: sender.id,
      recipientId: pageId,
      fromPage: false,
      type: message.attachments ? message.attachments[0]?.type || 'text' : 'text',
      body: message.text || '',
      attachmentUrl: message.attachments?.[0]?.payload?.url,
      timestamp: new Date(timestamp).toISOString(),
      status: 'delivered',
    };

    console.log('Incoming Facebook message:', newMessage);
    // In real implementation, this would be handled by backend and pushed via socket
  }

  private handleMessageRead(pageId: string, event: any): void {
    console.log('Message read:', pageId, event);
    // Update message status to 'read'
  }

  private handleMessageDelivery(pageId: string, event: any): void {
    console.log('Message delivered:', pageId, event);
    // Update message status to 'delivered'
  }
}

// Singleton instance
export const facebookService = new FacebookService();

// Hook for easy access
export function useFacebookService() {
  return facebookService;
}
