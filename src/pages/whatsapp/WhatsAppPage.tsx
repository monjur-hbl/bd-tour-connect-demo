import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useWhatsAppStore } from '../../stores/whatsappStore';
import { whatsappSocket } from '../../services/whatsappSocket';
import { ChatList, ChatWindow, QRScanner } from '../../components/whatsapp';
import { WhatsAppMessageType } from '../../types';
import { Settings, Bell, BellOff, WifiOff, RefreshCw, MessageSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const WhatsAppPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    accounts,
    chats,
    messages,
    activeChat,
    activeServer,
    serverStatuses,
    serverQRCodes,
    serverChats,
    searchQuery,
    unreadTotal,
    isLoading,
    soundEnabled,
    replyToMessage,
    error,
    setActiveChat,
    setActiveServer,
    setSearchQuery,
    setQrCode,
    setReplyToMessage,
    setSoundEnabled,
    updateChat,
    setError,
    setLoading,
    getServerName,
  } = useWhatsAppStore();

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Connect to WhatsApp servers on mount
  useEffect(() => {
    if (user?.agencyId) {
      console.log('Connecting to WhatsApp servers for agency:', user.agencyId);
      whatsappSocket.connect(user.agencyId);

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, [user?.agencyId]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error, setError]);

  // Check if user is admin (can scan QR)
  const isAdmin = user?.role === 'agency_admin' || user?.role === 'system_admin';

  // Get current server status and data
  const currentServerStatus = serverStatuses[activeServer];
  const currentServerQR = serverQRCodes[activeServer];
  const currentServerChats = serverChats[activeServer] || [];

  // Filter active chats for the current server
  const activeChats = currentServerChats.filter((chat) => !chat.isArchived);
  const activeChatData = currentServerChats.find((chat) => chat.id === activeChat);
  const activeChatMessages = activeChat ? messages[activeChat] || [] : [];

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChat(chatId);
  }, [setActiveChat]);

  const handleSendMessage = useCallback(async (messageData: { type: WhatsAppMessageType; body?: string; file?: File; caption?: string }) => {
    if (!activeChat || !activeChatData) return;

    let socketMessage: {
      type: string;
      body?: string;
      mediaData?: string;
      mediaMimeType?: string;
      mediaFileName?: string;
      caption?: string;
    } = {
      type: messageData.type,
      body: messageData.body,
      caption: messageData.caption,
    };

    if (messageData.file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        socketMessage.mediaData = base64;
        socketMessage.mediaMimeType = messageData.file!.type;
        socketMessage.mediaFileName = messageData.file!.name;
        whatsappSocket.sendMessage(activeServer, activeChat, socketMessage);
      };
      reader.readAsDataURL(messageData.file);
    } else {
      whatsappSocket.sendMessage(activeServer, activeChat, socketMessage);
    }
  }, [activeChat, activeChatData, activeServer]);

  const handleRequestQR = useCallback((serverId: number) => {
    setIsConnecting(true);
    toast.loading(`Initializing WhatsApp ${serverId}...`, { id: `qr-loading-${serverId}` });

    whatsappSocket.requestQR(serverId);

    setTimeout(() => {
      toast.dismiss(`qr-loading-${serverId}`);
      setIsConnecting(false);
    }, 30000);
  }, []);

  const handleCancelQR = useCallback(() => {
    setQrCode(null);
    setShowQRScanner(false);
    setIsConnecting(false);
    toast.dismiss('qr-loading-1');
    toast.dismiss('qr-loading-2');
  }, [setQrCode]);

  const handleDisconnect = useCallback((serverId: number) => {
    whatsappSocket.disconnectAccount(serverId);
    toast.success(`WhatsApp ${serverId} disconnected`);
  }, []);

  const handleRefreshChats = useCallback(() => {
    setLoading(true);
    whatsappSocket.fetchChats(activeServer);
    setTimeout(() => setLoading(false), 2000);
  }, [activeServer, setLoading]);

  const handlePin = useCallback((pinned: boolean) => {
    if (activeChat) {
      updateChat(activeChat, { isPinned: pinned });
      toast.success(pinned ? 'Chat pinned' : 'Chat unpinned');
    }
  }, [activeChat, updateChat]);

  const handleMute = useCallback((muted: boolean) => {
    if (activeChat) {
      updateChat(activeChat, { isMuted: muted });
      toast.success(muted ? 'Chat muted' : 'Chat unmuted');
    }
  }, [activeChat, updateChat]);

  const handleArchive = useCallback(() => {
    if (activeChat) {
      updateChat(activeChat, { isArchived: true });
      setActiveChat(null);
      toast.success('Chat archived');
    }
  }, [activeChat, updateChat, setActiveChat]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Server status indicator
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  // Show QR Scanner when clicked or if both servers are disconnected for admin
  const bothDisconnected = serverStatuses[1]?.status !== 'connected' && serverStatuses[2]?.status !== 'connected';

  if (showQRScanner) {
    return (
      <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Manage WhatsApp Accounts</h2>
            <button
              onClick={() => setShowQRScanner(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
              Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WhatsApp 1 */}
            <div className="border rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                {getStatusIcon(serverStatuses[1]?.status)}
                {getServerName(1)}
              </h3>
              {serverStatuses[1]?.status === 'connected' ? (
                <div>
                  <p className="text-green-600 mb-2">Connected</p>
                  <p className="text-sm text-gray-600 mb-4">
                    {serverStatuses[1]?.account?.phoneNumber}
                  </p>
                  <button
                    onClick={() => handleDisconnect(1)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Disconnect
                  </button>
                </div>
              ) : serverQRCodes[1] ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">Scan with WhatsApp</p>
                  <img
                    src={`data:image/png;base64,${serverQRCodes[1]}`}
                    alt="QR Code"
                    className="mx-auto w-48 h-48"
                  />
                </div>
              ) : (
                <button
                  onClick={() => handleRequestQR(1)}
                  disabled={isConnecting}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect WhatsApp 1'}
                </button>
              )}
            </div>

            {/* WhatsApp 2 */}
            <div className="border rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                {getStatusIcon(serverStatuses[2]?.status)}
                {getServerName(2)}
              </h3>
              {serverStatuses[2]?.status === 'connected' ? (
                <div>
                  <p className="text-green-600 mb-2">Connected</p>
                  <p className="text-sm text-gray-600 mb-4">
                    {serverStatuses[2]?.account?.phoneNumber}
                  </p>
                  <button
                    onClick={() => handleDisconnect(2)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Disconnect
                  </button>
                </div>
              ) : serverQRCodes[2] ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">Scan with WhatsApp</p>
                  <img
                    src={`data:image/png;base64,${serverQRCodes[2]}`}
                    alt="QR Code"
                    className="mx-auto w-48 h-48"
                  />
                </div>
              ) : (
                <button
                  onClick={() => handleRequestQR(2)}
                  disabled={isConnecting}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect WhatsApp 2'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-admin without connected accounts
  if (!isAdmin && bothDisconnected) {
    return (
      <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm overflow-hidden flex items-center justify-center">
        <div className="text-center p-8">
          <WifiOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No WhatsApp Connected</h2>
          <p className="text-gray-600">
            Ask your agency admin to connect a WhatsApp account to start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm overflow-hidden flex">
      {/* WhatsApp Server Tabs - Sidebar */}
      <div className="w-16 bg-gray-100 border-r border-gray-200 flex flex-col items-center py-4 gap-2">
        {[1, 2].map((serverId) => {
          const status = serverStatuses[serverId];
          const isActive = activeServer === serverId;
          const serverName = getServerName(serverId);

          return (
            <button
              key={serverId}
              onClick={() => setActiveServer(serverId)}
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white hover:bg-gray-50 text-gray-600'
              }`}
              title={serverName}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium truncate max-w-[40px]">
                {status?.status === 'connected' && status?.account?.name
                  ? status.account.name.split(' ')[0].substring(0, 5)
                  : serverId}
              </span>
              <span
                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  status?.status === 'connected'
                    ? 'bg-green-400'
                    : status?.status === 'connecting'
                    ? 'bg-yellow-400'
                    : 'bg-gray-300'
                }`}
              />
            </button>
          );
        })}

        {/* Settings button for admin */}
        {isAdmin && (
          <button
            onClick={() => setShowQRScanner(true)}
            className="w-12 h-12 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center mt-auto"
            title="Manage WhatsApp accounts"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Left sidebar - Chat list */}
      <div className={`w-full lg:w-[350px] lg:border-r border-gray-200 flex-shrink-0 ${
        activeChat ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
      }`}>
        {/* Header */}
        <div className="h-14 px-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentServerStatus?.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm">{getServerName(activeServer)}</h1>
              <p className="text-xs text-gray-500">
                {currentServerStatus?.status === 'connected'
                  ? currentServerStatus.account?.phoneNumber
                  : currentServerStatus?.status === 'connecting'
                  ? 'Connecting...'
                  : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefreshChats}
              className="p-2 hover:bg-gray-200 rounded-full"
              title="Refresh chats"
              disabled={isLoading || currentServerStatus?.status !== 'connected'}
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-gray-200 rounded-full"
              title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4 text-gray-600" />
              ) : (
                <BellOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Show connect prompt if not connected */}
        {currentServerStatus?.status !== 'connected' ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">{getServerName(activeServer)} not connected</p>
              {isAdmin && (
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Connect Now
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Chat list */
          <ChatList
            chats={activeChats}
            accounts={accounts}
            activeChat={activeChat}
            activeAccount={null}
            searchQuery={searchQuery}
            currentUserId={user?.id || ''}
            onSelectChat={handleSelectChat}
            onSearch={setSearchQuery}
            onSelectAccount={() => {}}
          />
        )}
      </div>

      {/* Right side - Chat window or empty state */}
      <div className={`flex-1 flex flex-col ${
        activeChat ? 'flex' : 'hidden lg:flex'
      }`}>
        {activeChatData ? (
          <ChatWindow
            chat={activeChatData}
            messages={activeChatMessages}
            account={currentServerStatus?.account || undefined}
            currentUserId={user?.id || ''}
            currentUserName={user?.name || ''}
            replyToMessage={replyToMessage}
            isLoading={isLoading}
            onBack={() => setActiveChat(null)}
            onSendMessage={handleSendMessage}
            onReply={setReplyToMessage}
            onCancelReply={() => setReplyToMessage(null)}
            onStartTyping={() => {}}
            onStopTyping={() => {}}
            onPin={handlePin}
            onMute={handleMute}
            onArchive={handleArchive}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💬</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp Web</h2>
              <p className="text-gray-600 max-w-md">
                Select a chat from {getServerName(activeServer)} to start messaging.
              </p>
              {unreadTotal > 0 && (
                <p className="mt-4 text-orange-600 font-medium">
                  You have {unreadTotal} unread message{unreadTotal > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
