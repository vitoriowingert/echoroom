import { useState, FormEvent, KeyboardEvent, useRef, ChangeEvent, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuth } from '../../hooks/useAuth';

interface MessageInputProps {
  onSendMessage: (content: string, fileUrl?: string, fileName?: string, fileSize?: number, fileType?: string) => void;
  roomId?: string;
  disabled?: boolean;
}

interface FilePreview {
  file: File;
  preview?: string;
}

export function MessageInput({ onSendMessage, roomId, disabled }: MessageInputProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  // Common emojis
  const commonEmojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const previews: FilePreview[] = selectedFiles.map((file) => {
      const preview: FilePreview = { file };
      if (file.type.startsWith('image/')) {
        preview.preview = URL.createObjectURL(file);
      }
      return preview;
    });

    setFiles((prev) => [...prev, ...previews]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFile = async (file: File): Promise<{ fileUrl: string; fileName: string; fileSize: number; fileType: string }> => {
    if (!roomId) throw new Error('Room ID is required');

    const token = await getToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload/rooms/${roomId}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    const result = await response.json();
    // Backend returns { url, fileName, fileSize, fileType } from upload.service
    // But we need { fileUrl, fileName, fileSize, fileType } for the message
    return {
      fileUrl: result.url || result.fileUrl,
      fileName: result.fileName,
      fileSize: result.fileSize,
      fileType: result.fileType,
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && files.length === 0) || disabled || uploading) return;

    try {
      setUploading(true);
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let fileType: string | undefined;

      // Upload first file if any
      if (files.length > 0) {
        const uploadResult = await uploadFile(files[0].file);
        fileUrl = uploadResult.fileUrl;
        fileName = uploadResult.fileName;
        fileSize = uploadResult.fileSize;
        fileType = uploadResult.fileType;
      }

      // Send message with or without file
      onSendMessage(content.trim() || '', fileUrl, fileName, fileSize, fileType);

      // Cleanup
      setContent('');
      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setFiles([]);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 border-t border-discord-gray-light bg-discord-gray">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* File previews */}
        {files.length > 0 && (
          <div className="mb-2 px-4">
            <div className="flex flex-wrap gap-2">
              {files.map((filePreview, index) => (
                <div key={index} className="relative group">
                  {filePreview.preview ? (
                    <div className="relative">
                      <img
                        src={filePreview.preview}
                        alt={filePreview.file.name}
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative bg-discord-gray-light rounded-lg p-2 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-discord-gray-lighter" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs truncate">{filePreview.file.name}</div>
                          <div className="text-discord-gray-lighter text-xs">
                            {(filePreview.file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-discord-gray-lighter hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Left side icons */}
        <div className="flex items-center gap-1">
          {/* Plus/Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="p-1.5 text-discord-gray-lighter hover:text-white hover:bg-discord-gray-light rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Anexar arquivo"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        {/* Message input container */}
        <div className="flex-1 bg-discord-gray-light rounded-lg px-4 py-3 flex items-center gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || uploading}
            placeholder={uploading ? 'Uploading...' : disabled ? t.chat.selectRoomToStart : t.chat.typeMessage}
            className="flex-1 bg-transparent text-white placeholder-discord-gray-lighter focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm leading-5"
            rows={1}
            style={{ minHeight: '20px', maxHeight: '200px' }}
          />
          
          {/* Right side icons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Gift */}
            <button
              type="button"
              onClick={() => {
                // Insert gift emoji or show gift modal
                insertEmoji('🎁');
              }}
              className="p-1.5 text-discord-gray-lighter hover:text-white hover:bg-discord-gray rounded transition-colors"
              title="Enviar presente"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0V5a1 1 0 10-1 1h1z" clipRule="evenodd" />
                <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
              </svg>
            </button>
            
            {/* GIF */}
            <button
              type="button"
              onClick={() => {
                // Show GIF picker (placeholder)
                alert('GIF picker - Coming soon! Use Tenor API or similar service.');
              }}
              className="px-2 py-1 text-discord-gray-lighter hover:text-white hover:bg-discord-gray rounded transition-colors font-semibold text-xs"
              title="GIF"
            >
              GIF
            </button>
            
            {/* Emoji */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-discord-gray-lighter hover:text-white hover:bg-discord-gray rounded transition-colors"
                title="Emoji"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                </svg>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 bg-discord-dark border border-discord-gray-light rounded-lg shadow-xl p-3 w-64 max-h-64 overflow-y-auto scrollbar-thin z-50">
                  <div className="grid grid-cols-8 gap-1">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="p-1 hover:bg-discord-gray rounded text-lg transition-colors"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sticker */}
            <button
              type="button"
              onClick={() => {
                // Show sticker picker (placeholder)
                alert('Sticker picker - Coming soon!');
              }}
              className="p-1.5 text-discord-gray-lighter hover:text-white hover:bg-discord-gray rounded transition-colors"
              title="Adesivos"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

