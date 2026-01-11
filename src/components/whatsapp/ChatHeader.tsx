import React, { useState } from 'react';
import { WhatsAppChat, WhatsAppAccount } from '../../types';
import {
  ArrowLeft,
  MoreVertical,
  Search,
  Phone,
  Video,
  Pin,
  Volume2,
  VolumeX,
  Archive,
  Trash2,
  UserCircle
} from 'lucide-react';

interface ChatHeaderProps {
  chat: WhatsAppChat;
  account?: WhatsAppAccount;
  onBack: () => void;
  onSearch?: () => void;
  onPin?: (pinned: boolean) => void;
  onMute?: (muted: boolean) => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onViewContact?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  account,
  onBack,
  onSearch,
  onPin,
  onMute,
  onArchive,
  onDelete,
  onViewContact,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const { contact, isPinned, isMuted, activeReplyByName } = chat;

  const getLastSeen = () => {
    if (!contact.lastMessageAt) return 'Tap for contact info';

    const lastSeen = new Date(contact.lastMessageAt);
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'online';
    if (minutes < 60) return `last seen ${minutes} min ago`;
    if (hours < 24) return `last seen ${hours}h ago`;
    if (days === 1) return 'last seen yesterday';
    return `last seen ${days} days ago`;
  };

  return (
    <div className="h-16 px-4 bg-gray-100 border-b border-gray-200 flex items-center gap-3">
      {/* Back button (mobile) */}
      <button
        onClick={onBack}
        className="lg:hidden p-1 hover:bg-gray-200 rounded-full"
      >
        <ArrowLeft className="w-6 h-6 text-gray-600" />
      </button>

      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer flex-shrink-0"
        onClick={onViewContact}
      >
        {contact.profilePicture ? (
          <img src={contact.profilePicture} alt={contact.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white text-lg font-semibold">
            {contact.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onViewContact}>
        <h2 className="font-semibold text-gray-900 truncate">{contact.name}</h2>
        <p className="text-xs text-gray-500 truncate">
          {activeReplyByName ? (
            <span className="text-orange-600">{activeReplyByName} is replying...</span>
          ) : (
            getLastSeen()
          )}
        </p>
      </div>

      {/* Account badge */}
      {account && (
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="truncate max-w-[80px]">{account.name}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onSearch && (
          <button
            onClick={onSearch}
            className="p-2 hover:bg-gray-200 rounded-full hidden sm:block"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-2 z-20 min-w-[200px]">
                {onViewContact && (
                  <button
                    onClick={() => { onViewContact(); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                  >
                    <UserCircle className="w-4 h-4" />
                    Contact info
                  </button>
                )}
                {onSearch && (
                  <button
                    onClick={() => { onSearch(); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-sm sm:hidden"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                )}
                {onPin && (
                  <button
                    onClick={() => { onPin(!isPinned); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                  >
                    <Pin className="w-4 h-4" />
                    {isPinned ? 'Unpin chat' : 'Pin chat'}
                  </button>
                )}
                {onMute && (
                  <button
                    onClick={() => { onMute(!isMuted); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                  >
                    {isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                )}
                {onArchive && (
                  <button
                    onClick={() => { onArchive(); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-sm"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-sm text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete chat
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
