import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useWhatsAppStore } from '../../stores/whatsappStore';
import { whatsappSocket } from '../../services/whatsappSocket';
import { ChatList, ChatWindow, QRScanner } from '../../components/whatsapp';
import { WhatsAppMessageType } from '../../types';
import { Settings, Bell, BellOff, WifiOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const WhatsAppPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    accounts,
    chats,
    messages,
    activeChat,
    activeAccount,
    qrCode,
    searchQuery,
    unreadTotal,
    isLoading,
    soundEnabled,
    replyToMessage,
    error,
    setActiveChat,
    setActiveAccount,
    setSearchQuery,
    setQrCode,
    addMessage,
    setReplyToMessage,
    setSoundEnabled,
    updateChat,
    setError,
    setLoading,
  } = useWhatsAppStore();

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Connect to WhatsApp server on mount
  useEffect(() => {
    if (user?.agencyId) {
      console.log('Connecting to WhatsApp server for agency:', user.agencyId);
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

  const activeChats = chats.filter((chat) => !chat.isArchived);
  const activeChatData = chats.find((chat) => chat.id === activeChat);
  const activeChatMessages = activeChat ? messages[activeChat] || [] : [];
  const activeAccountData = accounts.find((acc) => acc.id === (activeChatData?.accountId || activeAccount));

  // Get the slot number from account ID (format: agencyId_slot)
  const getSlotFromAccount = (accountId: string) => {
    const parts = accountId.split('_');
    return parseInt(parts[parts.length - 1]) || 1;
  };

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChat(chatId);

    // Fetch messages for the selected chat
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      const slot = getSlotFromAccount(chat.accountId);
      whatsappSocket.fetchMessages(slot, chatId, 50);
    }
  }, [chats, setActiveChat]);

  const handleSendMessage = useCallback(async (messageData: { type: WhatsAppMessageType; body?: string; file?: File; caption?: string }) => {
    if (!activeChat || !activeChatData) return;

    const slot = getSlotFromAccount(activeChatData.accountId);

    // Prepare message for socket
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

    // If there's a file, convert to base64
    if (messageData.file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        socketMessage.mediaData = base64;
        socketMessage.mediaMimeType = messageData.file!.type;
        socketMessage.mediaFileName = messageData.file!.name;

        whatsappSocket.sendMessage(slot, activeChat, socketMessage);
      };
      reader.readAsDataURL(messageData.file);
    } else {
      whatsappSocket.sendMessage(slot, activeChat, socketMessage);
    }

    // Stop replying indicator
    if (user) {
      whatsappSocket.stopReplying(activeChat, user.id);
    }
  }, [activeChat, activeChatData, user]);

  const handleStartTyping = useCallback(() => {
    if (!activeChat || !user) return;
    whatsappSocket.startReplying(activeChat, user.id, user.name);
  }, [activeChat, user]);

  const handleStopTyping = useCallback(() => {
    if (!activeChat || !user) return;
    whatsappSocket.stopReplying(activeChat, user.id);
  }, [activeChat, user]);

  const handleRequestQR = useCallback((slot: number) => {
    setIsConnecting(true);
    toast.loading('Initializing WhatsApp...', { id: 'qr-loading' });

    whatsappSocket.requestQR(slot);

    // Timeout for QR generation
    setTimeout(() => {
      toast.dismiss('qr-loading');
      setIsConnecting(false);
      if (!qrCode) {
        toast.error('Failed to generate QR code. Make sure the WhatsApp server is running.');
      }
    }, 30000);
  }, [qrCode]);

  const handleCancelQR = useCallback(() => {
    setQrCode(null);
    setShowQRScanner(false);
    setIsConnecting(false);
    toast.dismiss('qr-loading');
  }, [setQrCode]);

  const handleDisconnect = useCallback((accountId: string) => {
    const slot = getSlotFromAccount(accountId);
    whatsappSocket.disconnectAccount(slot);
    toast.success('WhatsApp account disconnected');
  }, []);

  const handleRefreshChats = useCallback(() => {
    if (accounts.length > 0) {
      setLoading(true);
      accounts.forEach(acc => {
        const slot = getSlotFromAccount(acc.id);
        whatsappSocket.fetchChats(slot);
      });
      setTimeout(() => setLoading(false), 2000);
    }
  }, [accounts, setLoading]);

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

  // Show QR Scanner for admins if no accounts connected or explicitly requested
  if (showQRScanner || (isAdmin && accounts.filter(a => a.status === 'connected').length === 0)) {
    return (
      <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm overflow-hidden">
        <QRScanner
          qrCode={qrCode}
          accounts={accounts}
          maxAccounts={2}
          isLoading={isConnecting}
          onRequestQR={handleRequestQR}
          onCancel={handleCancelQR}
          onDisconnect={handleDisconnect}
        />
      </div>
    );
  }

  // Non-admin without connected accounts
  if (!isAdmin && accounts.filter(a => a.status === 'connected').length === 0) {
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
      {/* Left sidebar - Chat list */}
      <div className={`w-full lg:w-[400px] lg:border-r border-gray-200 flex-shrink-0 ${
        activeChat ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
      }`}>
        {/* Header with settings */}
        <div className="h-14 px-4 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <span className="text-white text-lg">💬</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">WhatsApp</h1>
              <p className="text-xs text-gray-500">
                {accounts.filter((a) => a.status === 'connected').length} connected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefreshChats}
              className="p-2 hover:bg-gray-200 rounded-full"
              title="Refresh chats"
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-gray-200 rounded-full"
              title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
            >
              {soundEnabled ? (
                <Bell className="w-5 h-5 text-gray-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowQRScanner(true)}
                className="p-2 hover:bg-gray-200 rounded-full"
                title="Manage WhatsApp accounts"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Chat list */}
        <ChatList
          chats={activeChats}
          accounts={accounts}
          activeChat={activeChat}
          activeAccount={activeAccount}
          searchQuery={searchQuery}
          currentUserId={user?.id || ''}
          onSelectChat={handleSelectChat}
          onSearch={setSearchQuery}
          onSelectAccount={setActiveAccount}
        />
      </div>

      {/* Right side - Chat window or empty state */}
      <div className={`flex-1 flex flex-col ${
        activeChat ? 'flex' : 'hidden lg:flex'
      }`}>
        {activeChatData ? (
          <ChatWindow
            chat={activeChatData}
            messages={activeChatMessages}
            account={activeAccountData}
            currentUserId={user?.id || ''}
            currentUserName={user?.name || ''}
            replyToMessage={replyToMessage}
            isLoading={isLoading}
            onBack={() => setActiveChat(null)}
            onSendMessage={handleSendMessage}
            onReply={setReplyToMessage}
            onCancelReply={() => setReplyToMessage(null)}
            onStartTyping={handleStartTyping}
            onStopTyping={handleStopTyping}
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
                Select a chat to start messaging or wait for new messages from your connected WhatsApp accounts.
              </p>
              {unreadTotal > 0 && (
                <p className="mt-4 text-orange-600 font-medium">
                  You have {unreadTotal} unread message{unreadTotal > 1 ? 's' : ''}
                </p>
              )}
              {!whatsappSocket.isConnected() && (
                <p className="mt-4 text-yellow-600 text-sm">
                  Connecting to WhatsApp server...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
