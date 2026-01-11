import React, { useRef, useEffect } from 'react';
import { WhatsAppChat, WhatsAppMessage, WhatsAppAccount, WhatsAppMessageType } from '../../types';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
  chat: WhatsAppChat;
  messages: WhatsAppMessage[];
  account?: WhatsAppAccount;
  currentUserId: string;
  currentUserName: string;
  replyToMessage: WhatsAppMessage | null;
  isLoading?: boolean;
  onBack: () => void;
  onSendMessage: (message: { type: WhatsAppMessageType; body?: string; file?: File; caption?: string }) => void;
  onReply: (message: WhatsAppMessage) => void;
  onCancelReply: () => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  onPin?: (pinned: boolean) => void;
  onMute?: (muted: boolean) => void;
  onArchive?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  account,
  currentUserId,
  currentUserName,
  replyToMessage,
  isLoading,
  onBack,
  onSendMessage,
  onReply,
  onCancelReply,
  onStartTyping,
  onStopTyping,
  onPin,
  onMute,
  onArchive,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, WhatsAppMessage[]>);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const isOtherAgentReplying = Boolean(chat.activeReplyBy && chat.activeReplyBy !== currentUserId);

  return (
    <div className="h-full flex flex-col bg-[#efeae2]">
      {/* Header */}
      <ChatHeader
        chat={chat}
        account={account}
        onBack={onBack}
        onPin={onPin}
        onMute={onMute}
        onArchive={onArchive}
      />

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-md">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-center">No messages yet</p>
            <p className="text-sm text-center text-gray-400 mt-1">
              Start the conversation!
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex justify-center my-4">
                  <span className="px-4 py-1 bg-white rounded-lg text-xs text-gray-500 shadow-sm">
                    {formatDateHeader(date)}
                  </span>
                </div>

                {/* Messages for this date */}
                {dateMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onReply={onReply}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Other agent replying indicator */}
      {isOtherAgentReplying && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-yellow-700">
            <strong>{chat.activeReplyByName}</strong> is replying to this conversation...
          </span>
        </div>
      )}

      {/* Message input */}
      <MessageInput
        onSend={onSendMessage}
        replyTo={replyToMessage}
        onCancelReply={onCancelReply}
        disabled={isOtherAgentReplying}
        onTypingStart={onStartTyping}
        onTypingEnd={onStopTyping}
        placeholder={isOtherAgentReplying ? `Wait for ${chat.activeReplyByName} to finish...` : 'Type a message'}
      />
    </div>
  );
};
