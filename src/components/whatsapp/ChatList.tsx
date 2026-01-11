import React, { useState } from 'react';
import { WhatsAppChat, WhatsAppAccount } from '../../types';
import { ChatListItem } from './ChatListItem';
import { Search, Filter, Archive, MessageSquarePlus, ChevronDown, X } from 'lucide-react';

interface ChatListProps {
  chats: WhatsAppChat[];
  accounts: WhatsAppAccount[];
  activeChat: string | null;
  activeAccount: string | null;
  searchQuery: string;
  currentUserId: string;
  onSelectChat: (chatId: string) => void;
  onSearch: (query: string) => void;
  onSelectAccount: (accountId: string | null) => void;
  onNewChat?: () => void;
  onViewArchived?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  accounts,
  activeChat,
  activeAccount,
  searchQuery,
  currentUserId,
  onSelectChat,
  onSearch,
  onSelectAccount,
  onNewChat,
  onViewArchived,
}) => {
  const [showAccountFilter, setShowAccountFilter] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'groups'>('all');

  const filteredChats = chats.filter((chat) => {
    // Account filter
    if (activeAccount && chat.accountId !== activeAccount) return false;

    // Type filter
    if (filterType === 'unread' && chat.unreadCount === 0) return false;
    if (filterType === 'groups' && !chat.contact.isGroup) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = chat.contact.name.toLowerCase().includes(query);
      const matchesPhone = chat.contact.phoneNumber.includes(query);
      const matchesMessage = chat.lastMessage?.body.toLowerCase().includes(query);
      if (!matchesName && !matchesPhone && !matchesMessage) return false;
    }

    return true;
  });

  const pinnedChats = filteredChats.filter((chat) => chat.isPinned);
  const regularChats = filteredChats.filter((chat) => !chat.isPinned);

  const activeAccountData = accounts.find((acc) => acc.id === activeAccount);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Chats</h1>
          <div className="flex items-center gap-2">
            {onNewChat && (
              <button
                onClick={onNewChat}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="New chat"
              >
                <MessageSquarePlus className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
          {/* Account filter */}
          {accounts.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowAccountFilter(!showAccountFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  activeAccount
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeAccount ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {activeAccountData?.name || 'Account'}
                  </>
                ) : (
                  <>All Accounts</>
                )}
                <ChevronDown className="w-3 h-3" />
              </button>

              {showAccountFilter && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowAccountFilter(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-20 min-w-[180px]">
                    <button
                      onClick={() => { onSelectAccount(null); setShowAccountFilter(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        !activeAccount ? 'bg-orange-50 text-orange-700' : ''
                      }`}
                    >
                      All Accounts
                    </button>
                    {accounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => { onSelectAccount(account.id); setShowAccountFilter(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                          activeAccount === account.id ? 'bg-orange-50 text-orange-700' : ''
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          account.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="truncate">{account.name}</span>
                        <span className="text-xs text-gray-400">{account.phoneNumber}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Chat type filters */}
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              filterType === 'unread'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterType('groups')}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              filterType === 'groups'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned chats */}
        {pinnedChats.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
              Pinned
            </div>
            {pinnedChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={activeChat === chat.id}
                onClick={() => onSelectChat(chat.id)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}

        {/* Regular chats */}
        {regularChats.length > 0 && (
          <div>
            {pinnedChats.length > 0 && (
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
                All Chats
              </div>
            )}
            {regularChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={activeChat === chat.id}
                onClick={() => onSelectChat(chat.id)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            {searchQuery ? (
              <>
                <Search className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center">No chats found for "{searchQuery}"</p>
              </>
            ) : (
              <>
                <MessageSquarePlus className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center">No chats yet</p>
                <p className="text-sm text-center text-gray-400 mt-1">
                  Messages from connected WhatsApp accounts will appear here
                </p>
              </>
            )}
          </div>
        )}

        {/* Archived chats link */}
        {onViewArchived && (
          <button
            onClick={onViewArchived}
            className="w-full px-4 py-3 flex items-center gap-3 text-orange-600 hover:bg-orange-50 border-t border-gray-100"
          >
            <Archive className="w-5 h-5" />
            <span>Archived</span>
          </button>
        )}
      </div>
    </div>
  );
};
