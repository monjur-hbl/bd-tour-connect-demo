import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useWhatsAppStore } from '../../stores/whatsappStore';
import { ChatList, ChatWindow, QRScanner } from '../../components/whatsapp';
import {
  WhatsAppChat,
  WhatsAppMessage,
  WhatsAppMessageType,
  WhatsAppAccount,
  WhatsAppContact,
} from '../../types';
import { Settings, Bell, BellOff, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

// Mock data for demo purposes - in production this would come from backend
const generateMockData = (agencyId: string): { accounts: WhatsAppAccount[]; chats: WhatsAppChat[]; messages: Record<string, WhatsAppMessage[]> } => {
  const accounts: WhatsAppAccount[] = [
    {
      id: 'wa-1',
      phoneNumber: '+880 1712-345678',
      name: 'BD Tour Main',
      status: 'connected',
      connectedAt: new Date().toISOString(),
      agencyId,
    },
  ];

  const contacts: WhatsAppContact[] = [
    {
      id: '8801711111111@c.us',
      phoneNumber: '+880 1711-111111',
      name: 'Rahim Ahmed',
      pushName: 'Rahim',
      isBlocked: false,
      isGroup: false,
      lastMessageAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: '8801722222222@c.us',
      phoneNumber: '+880 1722-222222',
      name: 'Karim Hassan',
      pushName: 'Karim',
      isBlocked: false,
      isGroup: false,
      lastMessageAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: '8801733333333@c.us',
      phoneNumber: '+880 1733-333333',
      name: 'Fatima Begum',
      pushName: 'Fatima',
      isBlocked: false,
      isGroup: false,
      lastMessageAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'coxsbazar-tour-group@g.us',
      phoneNumber: '',
      name: "Cox's Bazar Tour - Jan 2025",
      isBlocked: false,
      isGroup: true,
      lastMessageAt: new Date(Date.now() - 10 * 60000).toISOString(),
    },
  ];

  const chats: WhatsAppChat[] = contacts.map((contact, index) => ({
    id: contact.id,
    accountId: 'wa-1',
    contact,
    type: contact.isGroup ? 'group' : 'individual',
    unreadCount: index === 0 ? 3 : index === 1 ? 1 : 0,
    isPinned: index === 0,
    isMuted: false,
    isArchived: false,
    lastMessage: {
      id: `msg-${index}-last`,
      accountId: 'wa-1',
      chatId: contact.id,
      fromMe: index === 2,
      from: index === 2 ? 'me' : contact.id,
      to: index === 2 ? contact.id : 'me',
      type: 'text',
      body: index === 0
        ? 'Hi, I want to book for the Sundarbans trip. How many seats are available?'
        : index === 1
        ? 'Thank you for the booking confirmation!'
        : index === 2
        ? 'Your booking has been confirmed. Please check your email for details.'
        : 'Everyone please confirm your seat preferences',
      timestamp: contact.lastMessageAt || new Date().toISOString(),
      status: index === 2 ? 'read' : 'delivered',
    },
  }));

  const messages: Record<string, WhatsAppMessage[]> = {};

  // Generate some sample messages for the first chat
  messages[contacts[0].id] = [
    {
      id: 'msg-1-1',
      accountId: 'wa-1',
      chatId: contacts[0].id,
      fromMe: false,
      from: contacts[0].id,
      to: 'me',
      type: 'text',
      body: 'Assalamu Alaikum',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-1-2',
      accountId: 'wa-1',
      chatId: contacts[0].id,
      fromMe: true,
      from: 'me',
      to: contacts[0].id,
      type: 'text',
      body: 'Walaikum Assalam! Welcome to BD Tour Connect. How can I help you today?',
      timestamp: new Date(Date.now() - 58 * 60000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-1-3',
      accountId: 'wa-1',
      chatId: contacts[0].id,
      fromMe: false,
      from: contacts[0].id,
      to: 'me',
      type: 'text',
      body: 'I saw your Sundarbans tour package on Facebook. Is it still available?',
      timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-1-4',
      accountId: 'wa-1',
      chatId: contacts[0].id,
      fromMe: true,
      from: 'me',
      to: contacts[0].id,
      type: 'text',
      body: 'Yes, the Sundarbans Adventure Tour is still available! We have departures on January 15th and 22nd.',
      timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-1-5',
      accountId: 'wa-1',
      chatId: contacts[0].id,
      fromMe: false,
      from: contacts[0].id,
      to: 'me',
      type: 'text',
      body: 'Great! What is the price per person?',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-1-6',
      accountId: 'wa-1',
      chatId: contacts[0].id,
      fromMe: true,
      from: 'me',
      to: contacts[0].id,
      type: 'text',
      body: 'The package is ৳12,500 per person which includes:\n• AC bus transport\n• 2 nights accommodation\n• All meals\n• Boat safari\n• Professional guide\n\nWould you like me to send the detailed itinerary?',
      timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-1-7',
      accountId: 'wa-1',
      chatId: contacts[0].id,
      fromMe: false,
      from: contacts[0].id,
      to: 'me',
      type: 'text',
      body: 'Yes please! Also, I want to book for 4 people',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-1-8',
      accountId: 'wa-1',
      chatId: contacts[0].id,
      fromMe: false,
      from: contacts[0].id,
      to: 'me',
      type: 'text',
      body: 'Hi, I want to book for the Sundarbans trip. How many seats are available?',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      status: 'delivered',
    },
  ];

  return { accounts, chats, messages };
};

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
    setAccounts,
    setChats,
    setMessages,
    setActiveChat,
    setActiveAccount,
    setSearchQuery,
    setQrCode,
    addMessage,
    startReplying,
    stopReplying,
    setReplyToMessage,
    setSoundEnabled,
    playNotificationSound,
    updateChat,
  } = useWhatsAppStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Initialize with mock data
  useEffect(() => {
    if (user?.agencyId) {
      const mockData = generateMockData(user.agencyId);
      setAccounts(mockData.accounts);
      setChats(mockData.chats);
      Object.entries(mockData.messages).forEach(([chatId, msgs]) => {
        setMessages(chatId, msgs);
      });
    }
  }, [user?.agencyId]);

  // Check if user is admin (can scan QR)
  const isAdmin = user?.role === 'agency_admin' || user?.role === 'system_admin';

  const activeChats = chats.filter((chat) => !chat.isArchived);
  const activeChatData = chats.find((chat) => chat.id === activeChat);
  const activeChatMessages = activeChat ? messages[activeChat] || [] : [];
  const activeAccountData = accounts.find((acc) => acc.id === (activeChatData?.accountId || activeAccount));

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleSendMessage = useCallback((messageData: { type: WhatsAppMessageType; body?: string; file?: File; caption?: string }) => {
    if (!activeChat || !activeChatData) return;

    const newMessage: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      accountId: activeChatData.accountId,
      chatId: activeChat,
      fromMe: true,
      from: 'me',
      to: activeChat,
      type: messageData.type,
      body: messageData.body || messageData.caption || '',
      caption: messageData.caption,
      mediaUrl: messageData.file ? URL.createObjectURL(messageData.file) : undefined,
      mediaFileName: messageData.file?.name,
      mediaSize: messageData.file?.size,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    addMessage(activeChat, newMessage);

    // Simulate message being sent
    setTimeout(() => {
      useWhatsAppStore.getState().updateMessage(activeChat, newMessage.id, { status: 'sent' });
    }, 500);

    setTimeout(() => {
      useWhatsAppStore.getState().updateMessage(activeChat, newMessage.id, { status: 'delivered' });
    }, 1500);

    // Stop replying indicator
    stopReplying(activeChat);
  }, [activeChat, activeChatData, addMessage, stopReplying]);

  const handleStartTyping = useCallback(() => {
    if (!activeChat || !user) return;
    startReplying(activeChat, user.id, user.name);
  }, [activeChat, user, startReplying]);

  const handleStopTyping = useCallback(() => {
    if (!activeChat) return;
    stopReplying(activeChat);
  }, [activeChat, stopReplying]);

  const handleRequestQR = (slot: number) => {
    // In production, this would call the backend to generate a QR code
    // For demo, we'll simulate showing a QR code
    toast.loading('Generating QR code...', { id: 'qr-loading' });

    setTimeout(() => {
      toast.dismiss('qr-loading');
      // This would be a real QR code from the backend
      setQrCode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
      toast.success('Scan this QR code with WhatsApp');
    }, 1500);
  };

  const handleCancelQR = () => {
    setQrCode(null);
    setShowQRScanner(false);
  };

  const handleDisconnect = (accountId: string) => {
    toast.success('WhatsApp account disconnected');
    // In production, this would disconnect from the backend
  };

  const handlePin = (pinned: boolean) => {
    if (activeChat) {
      updateChat(activeChat, { isPinned: pinned });
      toast.success(pinned ? 'Chat pinned' : 'Chat unpinned');
    }
  };

  const handleMute = (muted: boolean) => {
    if (activeChat) {
      updateChat(activeChat, { isMuted: muted });
      toast.success(muted ? 'Chat muted' : 'Chat unmuted');
    }
  };

  const handleArchive = () => {
    if (activeChat) {
      updateChat(activeChat, { isArchived: true });
      setActiveChat(null);
      toast.success('Chat archived');
    }
  };

  // Show QR Scanner for admins if no accounts connected
  if (showQRScanner || (isAdmin && accounts.length === 0)) {
    return (
      <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)] bg-white rounded-xl shadow-sm overflow-hidden">
        <QRScanner
          qrCode={qrCode}
          accounts={accounts}
          maxAccounts={2}
          isLoading={isLoading}
          onRequestQR={handleRequestQR}
          onCancel={handleCancelQR}
          onDisconnect={handleDisconnect}
        />
      </div>
    );
  }

  // Non-admin without connected accounts
  if (!isAdmin && accounts.length === 0) {
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
