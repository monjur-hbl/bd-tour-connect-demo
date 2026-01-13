import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useWhatsAppStore } from '../../stores/whatsappStore';
import { useFacebookStore } from '../../stores/facebookStore';
import { whatsappSocket } from '../../services/whatsappSocket';
import { facebookService } from '../../services/facebookService';
import { ChatList, ChatWindow, QRScanner } from '../../components/whatsapp';
import { WhatsAppMessageType, MessagingPlatform } from '../../types';
import {
  Settings, Bell, BellOff, WifiOff, RefreshCw, MessageSquare,
  CheckCircle, AlertCircle, Loader2, Plus, Link2, Unlink
} from 'lucide-react';
import toast from 'react-hot-toast';

// Platform icons
const WhatsAppIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const MessengerIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.302 2.246.465 3.443.465 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.1l3.131 3.26 5.887-3.26-6.559 6.863z"/>
  </svg>
);

const FacebookPageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// WhatsApp Server URLs for REST API polling
const WHATSAPP_SERVER_1_URL = process.env.REACT_APP_WHATSAPP_SERVER_1_URL || 'https://bd-tour-whatsapp-1-1006186358018.us-central1.run.app';
const WHATSAPP_SERVER_2_URL = process.env.REACT_APP_WHATSAPP_SERVER_2_URL || 'https://bd-tour-whatsapp-2-1006186358018.us-central1.run.app';

type PlatformTab = 'whatsapp' | 'messenger' | 'facebook_page';

export const MessagingPage: React.FC = () => {
  const { user } = useAuthStore();
  const whatsappStore = useWhatsAppStore();
  const facebookStore = useFacebookStore();

  const [activePlatform, setActivePlatform] = useState<PlatformTab>('whatsapp');
  const [showSettings, setShowSettings] = useState(false);
  const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({});
  const pollingRef = useRef<Record<number, NodeJS.Timeout | null>>({});

  // Get server URL by ID
  const getServerUrl = (serverId: number) => {
    return serverId === 1 ? WHATSAPP_SERVER_1_URL : WHATSAPP_SERVER_2_URL;
  };

  // Poll WhatsApp server status via REST API (defined before useEffect that uses it)
  const pollServerStatus = useCallback(async (serverId: number, showToast: boolean = false) => {
    if (!user?.agencyId) return;

    try {
      const response = await fetch(`${getServerUrl(serverId)}/status?agencyId=${user.agencyId}&slot=${serverId}`);
      const data = await response.json();

      const currentStatus = useWhatsAppStore.getState().serverStatuses[serverId];
      const wasNotConnected = currentStatus?.status !== 'connected';

      if (data.status === 'connected' && data.account) {
        useWhatsAppStore.getState().setServerStatuses({
          ...useWhatsAppStore.getState().serverStatuses,
          [serverId]: {
            status: 'connected',
            account: {
              id: data.account.id,
              phoneNumber: data.account.phoneNumber,
              name: data.account.name,
              status: 'connected',
              agencyId: user.agencyId,
              serverId: serverId,
            },
          },
        });
        if (pollingRef.current[serverId]) {
          clearInterval(pollingRef.current[serverId]!);
          pollingRef.current[serverId] = null;
        }
        toast.dismiss(`qr-loading-${serverId}`);
        if (showToast && wasNotConnected) {
          toast.success(`WhatsApp ${serverId} connected!`);
        }
        setIsConnecting((prev) => ({ ...prev, [`whatsapp_${serverId}`]: false }));
      } else if (data.status === 'qr_ready' && data.qrCode) {
        useWhatsAppStore.getState().setActiveServerQR(serverId, data.qrCode);
        useWhatsAppStore.getState().setServerStatuses({
          ...useWhatsAppStore.getState().serverStatuses,
          [serverId]: {
            status: 'qr_ready',
            account: null,
          },
        });
        toast.dismiss(`qr-loading-${serverId}`);
      } else if (data.status === 'connecting') {
        useWhatsAppStore.getState().setServerStatuses({
          ...useWhatsAppStore.getState().serverStatuses,
          [serverId]: {
            status: 'connecting',
            account: null,
          },
        });
      }
    } catch (err) {
      console.error(`Error polling server ${serverId}:`, err);
    }
  }, [user?.agencyId]);

  // Initialize services on mount
  useEffect(() => {
    if (user?.agencyId) {
      // Initialize WhatsApp
      whatsappSocket.connect(user.agencyId);

      // Poll status immediately and continuously
      pollServerStatus(1);
      pollServerStatus(2);

      // Set up continuous status polling every 5 seconds
      const statusInterval = setInterval(() => {
        pollServerStatus(1);
        pollServerStatus(2);
      }, 5000);

      // Initialize Facebook
      facebookService.init(user.agencyId);

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        clearInterval(statusInterval);
        Object.values(pollingRef.current).forEach((interval) => {
          if (interval) clearInterval(interval);
        });
      };
    }
  }, [user?.agencyId, pollServerStatus]);

  // Fetch messages and send read receipts when active chat changes
  useEffect(() => {
    if (whatsappStore.activeChat && whatsappStore.activeServer) {
      // Fetch message history for this chat
      whatsappSocket.fetchMessages(whatsappStore.activeServer, whatsappStore.activeChat);

      // Get unread messages to mark as read
      const messages = whatsappStore.messages[whatsappStore.activeChat] || [];
      const unreadMessageIds = messages
        .filter(msg => !msg.fromMe && msg.status !== 'read')
        .map(msg => msg.id);

      // Send read receipts for unread messages
      if (unreadMessageIds.length > 0) {
        whatsappSocket.markAsRead(whatsappStore.activeServer, whatsappStore.activeChat, unreadMessageIds);
      }
    }
  }, [whatsappStore.activeChat, whatsappStore.activeServer, whatsappStore.messages]);

  // Check if user is admin
  const isAdmin = user?.role === 'agency_admin' || user?.role === 'system_admin';

  // WhatsApp handlers
  const handleWhatsAppConnect = useCallback(async (serverId: number) => {
    if (!user?.agencyId) return;

    setIsConnecting((prev) => ({ ...prev, [`whatsapp_${serverId}`]: true }));
    toast.loading(`Initializing WhatsApp ${serverId}...`, { id: `qr-loading-${serverId}` });

    try {
      const response = await fetch(`${getServerUrl(serverId)}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: user.agencyId, slot: serverId }),
      });

      if (!response.ok) throw new Error('Failed to connect');

      if (pollingRef.current[serverId]) {
        clearInterval(pollingRef.current[serverId]!);
      }

      pollingRef.current[serverId] = setInterval(() => {
        pollServerStatus(serverId, true);
      }, 2000);

      pollServerStatus(serverId, true);
      whatsappSocket.requestQR(serverId);

      setTimeout(() => {
        if (pollingRef.current[serverId]) {
          clearInterval(pollingRef.current[serverId]!);
          pollingRef.current[serverId] = null;
        }
        setIsConnecting((prev) => ({ ...prev, [`whatsapp_${serverId}`]: false }));
        toast.dismiss(`qr-loading-${serverId}`);
      }, 60000);
    } catch (err) {
      console.error(`Error connecting to server ${serverId}:`, err);
      toast.dismiss(`qr-loading-${serverId}`);
      toast.error(`Failed to connect to WhatsApp ${serverId}`);
      setIsConnecting((prev) => ({ ...prev, [`whatsapp_${serverId}`]: false }));
    }
  }, [user?.agencyId, pollServerStatus]);

  const handleWhatsAppDisconnect = useCallback(async (serverId: number) => {
    if (!user?.agencyId) return;

    try {
      await fetch(`${getServerUrl(serverId)}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: user.agencyId, slot: serverId }),
      });

      whatsappSocket.disconnectWhatsApp(serverId);

      useWhatsAppStore.getState().setActiveServerQR(serverId, null);
      useWhatsAppStore.getState().setServerStatuses({
        ...whatsappStore.serverStatuses,
        [serverId]: {
          status: 'disconnected',
          account: null,
        },
      });

      toast.success(`WhatsApp ${serverId} disconnected`);
    } catch (err) {
      console.error(`Error disconnecting server ${serverId}:`, err);
      toast.error(`Failed to disconnect WhatsApp ${serverId}`);
    }
  }, [user?.agencyId, whatsappStore.serverStatuses]);

  // Facebook Page handlers
  const handleFacebookPageConnect = useCallback(async () => {
    // Open Facebook OAuth popup
    const redirectUri = `${window.location.origin}/auth/facebook/callback`;
    const scope = ['pages_show_list', 'pages_messaging', 'pages_manage_metadata', 'pages_read_engagement'];
    const loginUrl = facebookService.getFacebookLoginUrl(redirectUri, scope);

    const popup = window.open(loginUrl, 'facebook_login', 'width=600,height=700');

    // Listen for callback
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
        const { code } = event.data;
        popup?.close();

        try {
          setIsConnecting((prev) => ({ ...prev, facebook_page: true }));

          // Exchange code for token
          const tokenData = await facebookService.exchangeCodeForToken(code, redirectUri);

          // Get long-lived token
          const longLivedToken = await facebookService.getLongLivedToken(tokenData.access_token);

          // Get user's pages
          const pages = await facebookService.getUserPages(longLivedToken.access_token);

          if (pages.length === 0) {
            toast.error('No Facebook Pages found. Please create a Facebook Page first.');
            return;
          }

          // Connect all pages
          for (const page of pages) {
            await facebookService.connectPage(page);
          }

          toast.success(`Connected ${pages.length} Facebook Page(s)!`);
        } catch (err) {
          console.error('Facebook auth error:', err);
          toast.error('Failed to connect Facebook Page');
        } finally {
          setIsConnecting((prev) => ({ ...prev, facebook_page: false }));
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup listener when popup closes
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        setIsConnecting((prev) => ({ ...prev, facebook_page: false }));
      }
    }, 1000);
  }, []);

  const handleFacebookPageDisconnect = useCallback(async (pageId: string) => {
    try {
      await facebookService.disconnectPage(pageId);
      toast.success('Facebook Page disconnected');
    } catch (err) {
      console.error('Error disconnecting page:', err);
      toast.error('Failed to disconnect Facebook Page');
    }
  }, []);

  // Status indicator
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />;
      case 'qr_ready':
        return <RefreshCw className="w-3 h-3 text-blue-500" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  // Get connection counts
  const whatsappConnectedCount = [1, 2].filter(
    (id) => whatsappStore.serverStatuses[id]?.status === 'connected'
  ).length;
  const facebookPageConnectedCount = facebookStore.pages.filter(
    (p) => p.status === 'connected'
  ).length;

  // Render settings panel
  const renderSettingsPanel = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Manage Connections</h2>
        <button
          onClick={() => setShowSettings(false)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          Back
        </button>
      </div>

      {/* WhatsApp Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
          <WhatsAppIcon />
          WhatsApp Accounts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((serverId) => {
            const status = whatsappStore.serverStatuses[serverId];
            const qrCode = whatsappStore.serverQRCodes[serverId];
            const connecting = isConnecting[`whatsapp_${serverId}`];

            return (
              <div key={serverId} className="border rounded-xl p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  {getStatusIcon(status?.status || 'disconnected')}
                  WhatsApp {serverId}
                </h4>

                {status?.status === 'connected' ? (
                  <div>
                    <p className="text-green-600 text-sm mb-1">Connected</p>
                    <p className="text-xs text-gray-600 mb-3">
                      {status.account?.name} - {status.account?.phoneNumber}
                    </p>
                    <button
                      onClick={() => handleWhatsAppDisconnect(serverId)}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : status?.status === 'connecting' || connecting ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Connecting...</p>
                  </div>
                ) : qrCode ? (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Scan with WhatsApp</p>
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="QR Code"
                      className="mx-auto w-40 h-40"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => handleWhatsAppConnect(serverId)}
                    disabled={connecting}
                    className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Facebook Pages Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-600">
          <FacebookPageIcon />
          Facebook Pages
        </h3>

        {facebookStore.pages.length > 0 ? (
          <div className="space-y-3">
            {facebookStore.pages.map((page) => (
              <div key={page.id} className="flex items-center justify-between p-4 border rounded-xl">
                <div className="flex items-center gap-3">
                  {page.profilePicture ? (
                    <img src={page.profilePicture} alt={page.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FacebookPageIcon />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{page.name}</p>
                    <p className="text-xs text-gray-500">{page.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(page.status)}
                  <button
                    onClick={() => handleFacebookPageDisconnect(page.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Disconnect"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-xl">
            <FacebookPageIcon />
            <p className="text-gray-600 mt-2 mb-4">No Facebook Pages connected</p>
            <button
              onClick={handleFacebookPageConnect}
              disabled={isConnecting.facebook_page}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isConnecting.facebook_page ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Connect Facebook Page
            </button>
          </div>
        )}

        {facebookStore.pages.length > 0 && (
          <button
            onClick={handleFacebookPageConnect}
            disabled={isConnecting.facebook_page}
            className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Page
          </button>
        )}
      </div>

      {/* Facebook Messenger Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-600">
          <MessengerIcon />
          Facebook Messenger
        </h3>
        <div className="text-center py-8 border rounded-xl bg-gray-50">
          <MessengerIcon />
          <p className="text-gray-600 mt-2 mb-2">Coming Soon</p>
          <p className="text-xs text-gray-400">
            Personal Messenger integration will be available in a future update
          </p>
        </div>
      </div>
    </div>
  );

  // Render platform tabs
  const renderPlatformTabs = () => (
    <div className="w-16 bg-gray-100 border-r border-gray-200 flex flex-col items-center py-4 gap-2">
      {/* WhatsApp Tab */}
      <button
        onClick={() => setActivePlatform('whatsapp')}
        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all relative ${
          activePlatform === 'whatsapp'
            ? 'bg-green-500 text-white shadow-lg'
            : 'bg-white hover:bg-gray-50 text-gray-600'
        }`}
        title="WhatsApp"
      >
        <WhatsAppIcon />
        <span className="text-[10px] mt-0.5">WA</span>
        {whatsappConnectedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full text-[10px] text-white flex items-center justify-center">
            {whatsappConnectedCount}
          </span>
        )}
      </button>

      {/* Facebook Page Tab */}
      <button
        onClick={() => setActivePlatform('facebook_page')}
        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all relative ${
          activePlatform === 'facebook_page'
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-white hover:bg-gray-50 text-gray-600'
        }`}
        title="Facebook Page"
      >
        <FacebookPageIcon />
        <span className="text-[10px] mt-0.5">Page</span>
        {facebookPageConnectedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full text-[10px] text-white flex items-center justify-center">
            {facebookPageConnectedCount}
          </span>
        )}
      </button>

      {/* Messenger Tab */}
      <button
        onClick={() => setActivePlatform('messenger')}
        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
          activePlatform === 'messenger'
            ? 'bg-purple-500 text-white shadow-lg'
            : 'bg-white hover:bg-gray-50 text-gray-600'
        }`}
        title="Messenger (Coming Soon)"
      >
        <MessengerIcon />
        <span className="text-[10px] mt-0.5">MSG</span>
      </button>

      {/* Settings */}
      {isAdmin && (
        <button
          onClick={() => setShowSettings(true)}
          className="w-12 h-12 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center mt-auto"
          title="Manage connections"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );

  // Render WhatsApp content
  const renderWhatsAppContent = () => {
    const activeServer = whatsappStore.activeServer;
    const currentStatus = whatsappStore.serverStatuses[activeServer];
    const currentChats = whatsappStore.serverChats[activeServer] || [];
    const activeChats = currentChats.filter((chat) => !chat.isArchived);
    const activeChatData = currentChats.find((chat) => chat.id === whatsappStore.activeChat);
    const activeChatMessages = whatsappStore.activeChat
      ? whatsappStore.messages[whatsappStore.activeChat] || []
      : [];

    const bothDisconnected =
      whatsappStore.serverStatuses[1]?.status !== 'connected' &&
      whatsappStore.serverStatuses[2]?.status !== 'connected';

    if (bothDisconnected && !isAdmin) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <WifiOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No WhatsApp Connected</h2>
            <p className="text-gray-600">
              Ask your agency admin to connect a WhatsApp account.
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* WhatsApp Server Selector */}
        <div className="w-14 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 gap-2">
          {[1, 2].map((serverId) => {
            const status = whatsappStore.serverStatuses[serverId];
            const isActive = activeServer === serverId;

            return (
              <button
                key={serverId}
                onClick={() => whatsappStore.setActiveServer(serverId)}
                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-all relative ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-600'
                }`}
              >
                <span className="text-sm font-medium">{serverId}</span>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${
                    status?.status === 'connected'
                      ? 'bg-green-400'
                      : status?.status === 'connecting'
                      ? 'bg-yellow-400 animate-pulse'
                      : 'bg-gray-300'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Chat List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="h-14 px-4 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WhatsAppIcon />
              <div>
                <p className="font-medium text-sm">
                  {currentStatus?.account?.name || `WhatsApp ${activeServer}`}
                </p>
                <p className="text-xs text-gray-500">
                  {currentStatus?.status === 'connected'
                    ? currentStatus.account?.phoneNumber
                    : 'Not connected'}
                </p>
              </div>
            </div>
            <button
              onClick={() => whatsappSocket.fetchChats(activeServer)}
              className="p-2 hover:bg-gray-200 rounded-full"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {currentStatus?.status !== 'connected' ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Not connected</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ChatList
              chats={activeChats}
              accounts={whatsappStore.accounts}
              activeChat={whatsappStore.activeChat}
              activeAccount={null}
              searchQuery={whatsappStore.searchQuery}
              currentUserId={user?.id || ''}
              onSelectChat={whatsappStore.setActiveChat}
              onSearch={whatsappStore.setSearchQuery}
              onSelectAccount={() => {}}
            />
          )}
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {activeChatData ? (
            <ChatWindow
              chat={activeChatData}
              messages={activeChatMessages}
              account={currentStatus?.account || undefined}
              currentUserId={user?.id || ''}
              currentUserName={user?.name || ''}
              replyToMessage={whatsappStore.replyToMessage}
              isLoading={whatsappStore.isLoading}
              onBack={() => whatsappStore.setActiveChat(null)}
              onSendMessage={(msg) => {
                if (whatsappStore.activeChat) {
                  whatsappSocket.sendMessage(activeServer, whatsappStore.activeChat, {
                    type: msg.type,
                    body: msg.body,
                  });
                }
              }}
              onReply={whatsappStore.setReplyToMessage}
              onCancelReply={() => whatsappStore.setReplyToMessage(null)}
              onStartTyping={() => {
                if (whatsappStore.activeChat) {
                  whatsappSocket.sendTyping(activeServer, whatsappStore.activeChat, true);
                }
              }}
              onStopTyping={() => {
                if (whatsappStore.activeChat) {
                  whatsappSocket.sendTyping(activeServer, whatsappStore.activeChat, false);
                }
              }}
              onPin={(pinned) => {
                if (whatsappStore.activeChat) {
                  whatsappStore.updateChat(whatsappStore.activeChat, { isPinned: pinned });
                }
              }}
              onMute={(muted) => {
                if (whatsappStore.activeChat) {
                  whatsappStore.updateChat(whatsappStore.activeChat, { isMuted: muted });
                }
              }}
              onArchive={() => {
                if (whatsappStore.activeChat) {
                  whatsappStore.updateChat(whatsappStore.activeChat, { isArchived: true });
                  whatsappStore.setActiveChat(null);
                }
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a chat</h2>
                <p className="text-gray-600">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  // Render Facebook Page content
  const renderFacebookPageContent = () => {
    if (facebookStore.pages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FacebookPageIcon />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Facebook Pages Connected</h2>
            <p className="text-gray-600 mb-6">
              Connect your Facebook Page to receive and respond to messages
            </p>
            {isAdmin && (
              <button
                onClick={handleFacebookPageConnect}
                disabled={isConnecting.facebook_page}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isConnecting.facebook_page ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Link2 className="w-5 h-5" />
                )}
                Connect Facebook Page
              </button>
            )}
          </div>
        </div>
      );
    }

    // Show connected pages and their conversations
    return (
      <>
        {/* Page selector */}
        <div className="w-14 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 gap-2">
          {facebookStore.pages.map((page) => (
            <button
              key={page.id}
              onClick={() => facebookStore.setActivePage(page.id)}
              className={`w-10 h-10 rounded-lg overflow-hidden transition-all ${
                facebookStore.activePage === page.id
                  ? 'ring-2 ring-blue-500'
                  : 'hover:bg-gray-100'
              }`}
              title={page.name}
            >
              {page.profilePicture ? (
                <img src={page.profilePicture} alt={page.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                  <FacebookPageIcon />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Conversations list */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="h-14 px-4 bg-gray-50 border-b flex items-center">
            <div>
              <p className="font-medium text-sm">
                {facebookStore.pages.find((p) => p.id === facebookStore.activePage)?.name || 'Select a Page'}
              </p>
              <p className="text-xs text-gray-500">Facebook Page Messages</p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Messages will appear here</p>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Facebook Page Messages</h2>
            <p className="text-gray-600">Select a conversation to reply</p>
          </div>
        </div>
      </>
    );
  };

  // Render Messenger content (coming soon)
  const renderMessengerContent = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessengerIcon />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Messenger Integration</h2>
        <p className="text-gray-600 mb-2">Coming Soon</p>
        <p className="text-sm text-gray-400 max-w-md">
          Personal Messenger integration will allow you to manage your personal Facebook messages
          alongside WhatsApp and Page messages.
        </p>
      </div>
    </div>
  );

  // Main render
  if (showSettings) {
    return (
      <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm overflow-hidden">
        {renderSettingsPanel()}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm overflow-hidden flex">
      {/* Platform Tabs */}
      {renderPlatformTabs()}

      {/* Content Area */}
      {activePlatform === 'whatsapp' && renderWhatsAppContent()}
      {activePlatform === 'facebook_page' && renderFacebookPageContent()}
      {activePlatform === 'messenger' && renderMessengerContent()}
    </div>
  );
};
