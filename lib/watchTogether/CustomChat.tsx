'use client';
import * as React from 'react';
import {
  ChatEntry,
  useChat,
  useMaybeLayoutContext,
  type ChatProps,
} from '@livekit/components-react';
import { useWatchTogether } from './WatchTogetherContext';
import { parseVideoUrl } from './parseVideoUrl';

export function CustomChat({
  messageFormatter,
  messageDecoder,
  messageEncoder,
  channelTopic,
  ...props
}: ChatProps) {
  const layoutContext = useMaybeLayoutContext();
  const ulRef = React.useRef<HTMLUListElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const lastReadTimestamp = React.useRef(0);

  const chatOptions = React.useMemo(
    () => ({ messageDecoder, messageEncoder, channelTopic }),
    [messageDecoder, messageEncoder, channelTopic],
  );
  const { chatMessages, send, isSending } = useChat(chatOptions);
  const { embed, startEmbed, startStream } = useWatchTogether();

  React.useEffect(() => {
    if (ulRef.current) ulRef.current.scrollTo({ top: ulRef.current.scrollHeight });
  }, [chatMessages]);

  React.useEffect(() => {
    if (!layoutContext || chatMessages.length === 0) return;
    const last = chatMessages[chatMessages.length - 1];
    if (layoutContext.widget.state?.showChat && lastReadTimestamp.current !== last.timestamp) {
      lastReadTimestamp.current = last.timestamp;
      return;
    }
    const unread = chatMessages.filter(
      (m) => !lastReadTimestamp.current || m.timestamp > lastReadTimestamp.current,
    ).length;
    if (unread > 0 && layoutContext.widget.state?.unreadMessages !== unread) {
      layoutContext.widget.dispatch?.({ msg: 'unread_msg', count: unread });
    }
  }, [chatMessages, layoutContext]);

  const handleVideoCommand = (arg: string) => {
    if (embed.active && !embed.isHost) {
      alert('Сейчас просмотром управляет другой участник. Дождитесь завершения показа.');
      return;
    }
    const trimmed = arg.trim();
    if (!trimmed) {
      fileInputRef.current?.click();
      return;
    }
    const parsed = parseVideoUrl(trimmed);
    if (!parsed) {
      alert(`Unrecognized URL: ${trimmed}`);
      return;
    }
    if (parsed.kind === 'youtube') startEmbed('youtube', parsed.videoId);
    else startEmbed('url', parsed.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    if (text === '/video' || text.startsWith('/video ')) {
      handleVideoCommand(text.slice('/video'.length));
      input.value = '';
      input.focus();
      return;
    }

    try {
      await send(text);
    } catch (err) {
      console.error('Failed to send chat message', err);
      return; // keep the draft so the user can retry
    }
    input.value = '';
    input.focus();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    startStream(file);
  };

  return (
    <div {...props} className="lk-chat">
      <div className="lk-chat-header">
        Messages
        {layoutContext && (
          <button
            type="button"
            className="lk-button lk-chat-close-button"
            aria-label="Закрыть чат"
            title="Закрыть чат"
            onClick={() => layoutContext.widget.dispatch?.({ msg: 'toggle_chat' })}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>
      <ul className="lk-list lk-chat-messages" ref={ulRef}>
        {chatMessages.map((msg, idx, arr) => {
          const hideName = idx >= 1 && arr[idx - 1].from === msg.from;
          const hideTimestamp = hideName && msg.timestamp - arr[idx - 1].timestamp < 60_000;
          return (
            <ChatEntry
              key={msg.id ?? idx}
              hideName={hideName}
              hideTimestamp={hideTimestamp}
              entry={msg}
              messageFormatter={messageFormatter}
            />
          );
        })}
      </ul>
      <form className="lk-chat-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="lk-form-control lk-chat-form-input"
          disabled={isSending}
          type="text"
          placeholder="Сообщение · /video <ссылка>"
          onInput={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
        />
        <button type="submit" className="lk-button lk-chat-form-button" disabled={isSending}>
          Send
        </button>
      </form>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
    </div>
  );
}
