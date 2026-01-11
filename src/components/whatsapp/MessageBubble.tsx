import React, { useState } from 'react';
import { WhatsAppMessage } from '../../types';
import { Check, CheckCheck, Download, Play, Pause, Reply, Forward, Star, Trash2, MoreVertical, File } from 'lucide-react';

interface MessageBubbleProps {
  message: WhatsAppMessage;
  onReply: (message: WhatsAppMessage) => void;
  onForward?: (message: WhatsAppMessage) => void;
  onDelete?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReply,
  onForward,
  onDelete,
  onStar,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const isOutgoing = message.fromMe;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <span className="w-3 h-3 rounded-full border border-gray-400 border-t-transparent animate-spin" />;
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
      case 'failed':
        return <span className="text-xs text-red-500">!</span>;
      default:
        return null;
    }
  };

  const renderQuotedMessage = () => {
    if (!message.quotedMessage) return null;

    return (
      <div className={`mb-2 px-3 py-2 rounded-lg border-l-4 ${
        isOutgoing ? 'bg-green-700/30 border-green-400' : 'bg-gray-200 border-gray-400'
      }`}>
        <p className="text-xs text-gray-600 truncate">{message.quotedMessage.body}</p>
      </div>
    );
  };

  const renderMediaContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={message.mediaUrl}
              alt="Image"
              className="max-w-[280px] rounded-lg cursor-pointer"
              onClick={() => window.open(message.mediaUrl, '_blank')}
            />
            {message.caption && (
              <p className="mt-2 text-sm">{message.caption}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            <video
              src={message.mediaUrl}
              controls
              className="max-w-[280px] rounded-lg"
            />
            {message.caption && (
              <p className="mt-2 text-sm">{message.caption}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isOutgoing ? 'bg-green-700' : 'bg-orange-500'
              } text-white`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-gray-300 rounded-full">
                <div
                  className={`h-full rounded-full ${isOutgoing ? 'bg-green-700' : 'bg-orange-500'}`}
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">0:00</span>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center gap-3 min-w-[200px] p-2 bg-white/50 rounded-lg">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isOutgoing ? 'bg-green-700' : 'bg-orange-500'
            }`}>
              <File className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.mediaFileName || 'Document'}</p>
              <p className="text-xs text-gray-500">
                {message.mediaSize ? `${(message.mediaSize / 1024).toFixed(1)} KB` : 'PDF'}
              </p>
            </div>
            <a
              href={message.mediaUrl}
              download={message.mediaFileName}
              className="p-2 hover:bg-gray-200 rounded-full"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </a>
          </div>
        );

      case 'sticker':
        return (
          <img
            src={message.mediaUrl}
            alt="Sticker"
            className="w-32 h-32 object-contain"
          />
        );

      case 'location':
        return (
          <div className="w-[250px] h-[150px] bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-4xl">📍</span>
          </div>
        );

      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>;
    }
  };

  return (
    <div
      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-1 group relative`}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div
        className={`relative max-w-[75%] px-3 py-2 rounded-lg shadow-sm ${
          isOutgoing
            ? 'bg-green-100 rounded-tr-none'
            : 'bg-white rounded-tl-none'
        }`}
      >
        {/* Forwarded indicator */}
        {message.isForwarded && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Forward className="w-3 h-3" />
            <span>Forwarded</span>
          </div>
        )}

        {/* Quoted message */}
        {renderQuotedMessage()}

        {/* Message content */}
        {renderMediaContent()}

        {/* Time and status */}
        <div className={`flex items-center gap-1 mt-1 ${
          message.type === 'text' ? 'float-right ml-2 -mb-1' : 'justify-end'
        }`}>
          {message.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
          <span className="text-[10px] text-gray-500">{formatTime(message.timestamp)}</span>
          {isOutgoing && getStatusIcon()}
        </div>

        {/* Hover actions */}
        <div
          className={`absolute top-1 ${isOutgoing ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'}
            opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          <div className="flex items-center gap-0.5 bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => onReply(message)}
              className="p-1.5 hover:bg-gray-100 rounded"
              title="Reply"
            >
              <Reply className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Dropdown menu */}
          {showMenu && (
            <div className={`absolute top-full mt-1 ${isOutgoing ? 'right-0' : 'left-0'}
              bg-white rounded-lg shadow-lg py-1 min-w-[150px] z-10`}>
              {onForward && (
                <button
                  onClick={() => { onForward(message); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Forward className="w-4 h-4" />
                  Forward
                </button>
              )}
              {onStar && (
                <button
                  onClick={() => { onStar(message.id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  {message.isStarred ? 'Unstar' : 'Star'}
                </button>
              )}
              {onDelete && isOutgoing && (
                <button
                  onClick={() => { onDelete(message.id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
