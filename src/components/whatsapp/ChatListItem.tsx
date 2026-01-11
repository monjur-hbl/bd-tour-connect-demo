import React from 'react';
import { WhatsAppChat } from '../../types';
import { Check, CheckCheck, Image, Video, Mic, FileText, Pin, Volume2, VolumeX } from 'lucide-react';

interface ChatListItemProps {
  chat: WhatsAppChat;
  isActive: boolean;
  onClick: () => void;
  currentUserId: string;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isActive,
  onClick,
  currentUserId,
}) => {
  const { contact, lastMessage, unreadCount, isPinned, isMuted, activeReplyBy, activeReplyByName } = chat;

  const getMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';

    let prefix = '';
    if (lastMessage.fromMe) {
      prefix = 'You: ';
    }

    switch (lastMessage.type) {
      case 'image':
        return `${prefix}📷 Photo`;
      case 'video':
        return `${prefix}🎥 Video`;
      case 'audio':
        return `${prefix}🎵 Audio`;
      case 'document':
        return `${prefix}📄 ${lastMessage.mediaFileName || 'Document'}`;
      case 'sticker':
        return `${prefix}🎭 Sticker`;
      case 'location':
        return `${prefix}📍 Location`;
      case 'contact':
        return `${prefix}👤 Contact`;
      default:
        return `${prefix}${lastMessage.body}`;
    }
  };

  const getMessageStatusIcon = () => {
    if (!lastMessage?.fromMe) return null;

    switch (lastMessage.status) {
      case 'sending':
        return <span className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />;
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <span className="w-3 h-3 rounded-full bg-red-500" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isOtherAgentReplying = activeReplyBy && activeReplyBy !== currentUserId;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
        isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
      } ${isPinned ? 'bg-orange-25' : ''}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
          {contact.profilePicture ? (
            <img src={contact.profilePicture} alt={contact.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white text-lg font-semibold">
              {contact.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {contact.isGroup && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">G</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{contact.name}</span>
            {isPinned && <Pin className="w-3 h-3 text-gray-400" />}
            {isMuted && <VolumeX className="w-3 h-3 text-gray-400" />}
          </div>
          <span className={`text-xs ${unreadCount > 0 ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
            {lastMessage ? formatTime(lastMessage.timestamp) : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-gray-500 truncate flex-1">
            {getMessageStatusIcon()}
            <span className="truncate">{getMessagePreview()}</span>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {isOtherAgentReplying && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                {activeReplyByName} typing...
              </span>
            )}
            {unreadCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-orange-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
