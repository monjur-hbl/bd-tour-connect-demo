import React, { useState, useRef, useEffect } from 'react';
import { WhatsAppMessage, WhatsAppMessageType } from '../../types';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  X,
  Image,
  FileText,
  Camera,
  Video,
  StopCircle
} from 'lucide-react';

interface MessageInputProps {
  onSend: (message: { type: WhatsAppMessageType; body?: string; file?: File; caption?: string }) => void;
  replyTo: WhatsAppMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  replyTo,
  onCancelReply,
  disabled,
  onTypingStart,
  onTypingEnd,
  placeholder = 'Type a message',
}) => {
  const [message, setMessage] = useState('');
  const [showAttachment, setShowAttachment] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<{ file: File; type: WhatsAppMessageType; preview?: string } | null>(null);
  const [caption, setCaption] = useState('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

    // Typing indicator
    if (onTypingStart && e.target.value.length > 0) {
      onTypingStart();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (onTypingEnd) onTypingEnd();
      }, 2000);
    }
  };

  const handleSend = () => {
    if (selectedFile) {
      onSend({
        type: selectedFile.type,
        file: selectedFile.file,
        caption: caption || undefined,
      });
      setSelectedFile(null);
      setCaption('');
    } else if (message.trim()) {
      onSend({ type: 'text', body: message.trim() });
      setMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }

    if (onTypingEnd) onTypingEnd();
    if (replyTo) onCancelReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (type: WhatsAppMessageType) => {
    if (fileInputRef.current) {
      let accept = '';
      switch (type) {
        case 'image':
          accept = 'image/*';
          break;
        case 'video':
          accept = 'video/*';
          break;
        case 'audio':
          accept = 'audio/*';
          break;
        case 'document':
          accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';
          break;
      }
      fileInputRef.current.accept = accept;
      fileInputRef.current.dataset.type = type;
      fileInputRef.current.click();
    }
    setShowAttachment(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = (e.target.dataset.type as WhatsAppMessageType) || 'document';
    let preview: string | undefined;

    if (type === 'image' || type === 'video') {
      preview = URL.createObjectURL(file);
    }

    setSelectedFile({ file, type, preview });
    e.target.value = '';
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    // In real implementation, this would send the audio file
    // For now, we'll just show that it was "recorded"
    setRecordingTime(0);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const commonEmojis = ['😀', '😂', '❤️', '👍', '🙏', '🎉', '🔥', '💯', '✅', '👋', '😊', '🤔'];

  return (
    <div className="border-t border-gray-200 bg-gray-100">
      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <div className="w-1 h-10 bg-orange-500 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-orange-600">
              {replyTo.fromMe ? 'You' : 'Reply'}
            </p>
            <p className="text-sm text-gray-500 truncate">{replyTo.body}</p>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start gap-3">
            {selectedFile.preview && (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                {selectedFile.type === 'image' ? (
                  <img src={selectedFile.preview} alt="Preview" className="w-full h-full object-cover" />
                ) : selectedFile.type === 'video' ? (
                  <video src={selectedFile.preview} className="w-full h-full object-cover" />
                ) : null}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{selectedFile.file.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {(selectedFile.type === 'image' || selectedFile.type === 'video') && (
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="mt-2 w-full text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              )}
            </div>
            <button
              onClick={() => { setSelectedFile(null); setCaption(''); }}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 flex items-end gap-2">
        {/* Emoji button */}
        <div className="relative">
          <button
            onClick={() => { setShowEmoji(!showEmoji); setShowAttachment(false); }}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500"
            disabled={disabled || isRecording}
          >
            <Smile className="w-6 h-6" />
          </button>

          {/* Emoji picker */}
          {showEmoji && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg p-3 z-10">
              <div className="grid grid-cols-6 gap-2">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessage((m) => m + emoji);
                      inputRef.current?.focus();
                    }}
                    className="text-2xl hover:bg-gray-100 rounded p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attachment button */}
        <div className="relative">
          <button
            onClick={() => { setShowAttachment(!showAttachment); setShowEmoji(false); }}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500"
            disabled={disabled || isRecording}
          >
            <Paperclip className="w-6 h-6" />
          </button>

          {/* Attachment menu */}
          {showAttachment && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg py-2 z-10 min-w-[180px]">
              <button
                onClick={() => handleFileSelect('image')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <span>Photos</span>
              </button>
              <button
                onClick={() => handleFileSelect('video')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span>Videos</span>
              </button>
              <button
                onClick={() => handleFileSelect('document')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span>Document</span>
              </button>
              <button
                onClick={() => handleFileSelect('audio')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <span>Audio</span>
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Text input / Recording display */}
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 bg-white rounded-full px-4 py-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-gray-600">{formatRecordingTime(recordingTime)}</span>
            <div className="flex-1 h-1 bg-gray-200 rounded-full">
              <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: '30%' }} />
            </div>
          </div>
        ) : (
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || !!selectedFile}
            rows={1}
            className="flex-1 resize-none bg-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 max-h-[120px] disabled:opacity-50"
            style={{ minHeight: '42px' }}
          />
        )}

        {/* Send / Record button */}
        {message.trim() || selectedFile ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : isRecording ? (
          <button
            onClick={stopRecording}
            className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          >
            <StopCircle className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
