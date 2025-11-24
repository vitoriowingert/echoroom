import { Message, User } from '../../types';
import { MessageItem } from './MessageItem';
import { useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface MessageListProps {
  messages: Message[];
  users: Map<string, User>;
  currentUserId: string;
  roomId?: string;
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onPinMessage?: (messageId: string) => void;
}

export function MessageList({
  messages,
  users,
  currentUserId,
  roomId,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
}: MessageListProps) {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-discord-gray-lighter">
        <div className="text-center">
          <p className="text-lg mb-2">{t.chat.noMessages}</p>
          <p className="text-sm">{t.chat.startConversation}</p>
        </div>
      </div>
    );
  }

  // Group consecutive messages from the same user and add date separators
  const groupedMessages: Array<{
    message: Message;
    showAvatar: boolean;
    showUsername: boolean;
    showDateSeparator?: boolean;
  }> = [];

  messages.forEach((message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isSameUser = prevMessage?.user_id === message.user_id;
    const timeDiff =
      prevMessage
        ? new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()
        : Infinity;
    const isWithin5Minutes = timeDiff < 5 * 60 * 1000;

    // Check if we need a date separator
    let showDateSeparator = false;
    if (!prevMessage) {
      showDateSeparator = true; // First message
    } else {
      const prevDate = new Date(prevMessage.created_at);
      const currentDate = new Date(message.created_at);
      // Show separator if different day
      if (
        prevDate.getDate() !== currentDate.getDate() ||
        prevDate.getMonth() !== currentDate.getMonth() ||
        prevDate.getFullYear() !== currentDate.getFullYear()
      ) {
        showDateSeparator = true;
      }
    }

    groupedMessages.push({
      message,
      showAvatar: !isSameUser || !isWithin5Minutes,
      showUsername: !isSameUser || !isWithin5Minutes,
      showDateSeparator,
    });
  });

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDate.getTime() === todayDate.getTime()) {
      return 'Hoje';
    } else if (messageDate.getTime() === yesterdayDate.getTime()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-discord-gray">
      <div className="py-4 px-4">
        {groupedMessages.map(({ message, showAvatar, showUsername, showDateSeparator }) => {
          const user = users.get(message.user_id);
          const isOwn = message.user_id === currentUserId;

          return (
            <div key={message.id}>
              {showDateSeparator && (
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-discord-gray-light"></div>
                  <div className="text-discord-gray-lighter text-xs font-semibold uppercase px-2">
                    {formatDateSeparator(message.created_at)}
                  </div>
                  <div className="flex-1 h-px bg-discord-gray-light"></div>
                </div>
              )}
              <MessageItem
                message={message}
                user={user}
                isOwn={isOwn}
                showAvatar={showAvatar}
                showUsername={showUsername}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onPin={onPinMessage}
                roomId={roomId}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
