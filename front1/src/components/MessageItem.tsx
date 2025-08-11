import React from 'react';
import { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  isLatest?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isLatest = false }) => {
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStyles = () => {
    switch (message.type) {

      case 'user':
        return {
          container: 'flex justify-start mb-4',
          bubble: 'financial-card bg-white border-slate-200 px-4 py-3 max-w-6xl',
          timestamp: 'text-slate-400 text-xs mt-2 text-left font-medium',
          label: 'Research Query',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="black" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'assistant':
        return {
          container: 'flex justify-start mb-4',
          bubble: 'financial-card bg-white border-slate-200 px-4 py-3 max-w-6xl',
          timestamp: 'text-slate-400 text-xs mt-2 text-left font-medium',
          label: 'Research Response',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'error':
        return {
          container: 'flex justify-center mb-4',
          bubble: 'financial-card bg-red-50 border-red-200 text-red-800 px-4 py-3 max-w-4xl',
          timestamp: 'text-red-400 text-xs mt-2 text-center font-medium',
          label: 'System Error',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default:
        return {
          container: 'flex justify-start mb-4',
          bubble: 'financial-card bg-white border-slate-200 px-4 py-3 max-w-6xl',
          timestamp: 'text-slate-400 text-xs mt-2 text-left font-medium',
          label: 'System Message',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const styles = getMessageStyles();

  return (
    <div
      className={`${styles.container} message-slide-in`}
      role="listitem"
      aria-label={`${styles.label} from ${formatTimestamp(message.timestamp)}`}
    >
      <div className="flex flex-col w-full">
        <div
          className={styles.bubble}
          aria-live={isLatest ? "polite" : "off"}
          aria-atomic="true"
        >
          {/* Message Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-opacity-20 border-current">
            <div className="flex items-center space-x-2">
              <div className={`p-1 rounded ${message.type === 'user' ? 'bg-blue-500 bg-opacity-20' : message.type === 'error' ? 'bg-red-500 bg-opacity-20' : 'bg-slate-500 bg-opacity-20'}`}>
                {styles.icon}
              </div>
              <span className="text-sm font-semibold">{styles.label}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs opacity-75">
              <span>{formatTimestamp(message.timestamp)}</span>
              {message.source && (
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${message.source === 'local' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                  <span className="capitalize">{message.source}</span>
                </div>
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className="break-words max-w-none text-sm leading-relaxed">
            {(() => {
              // Ensure content is a string
              let content = '';
              if (typeof message.content === 'string') {
                content = message.content;
              } else if (message.content && typeof message.content === 'object') {
                content = JSON.stringify(message.content, null, 2);
              } else {
                content = '[Empty message content]';
              }

              if (message.type === 'user') {
                // For user messages, display as plain text with high contrast
                return (
                  <div className="text-slate-700 font-medium text-base whitespace-pre-line">
                    {content}
                  </div>
                );
              } else {
                // For assistant/error messages, clean HTML and render properly
                const cleanContent = content
                  .replace(/>\s+</g, '><') // Remove whitespace between tags
                  .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
                  .trim();

                return (
                  <div
                    // className="text-slate-700 prose prose-sm max-w-none [&>*]:my-2 [&>p]:my-2 [&>p]:text-slate-700 [&>h1]:text-lg [&>h1]:font-semibold [&>h1]:text-slate-900 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:text-slate-900 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-slate-900 [&>ul]:pl-4 [&>ol]:pl-4 [&>li]:mb-1 [&>li]:text-slate-700 [&>blockquote]:border-l-4 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:border-slate-300 [&>blockquote]:text-slate-600 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>code]:bg-slate-100 [&>code]:text-slate-800 [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>pre]:text-xs [&>pre]:font-mono [&>pre]:bg-slate-100 [&>pre]:text-slate-800 [&>img]:max-w-full [&>img]:h-auto [&>img]:rounded-lg [&>img]:shadow-md [&>img]:my-4 [&>img]:mx-auto [&>img]:block [&>table]:w-full [&>table]:border-collapse [&>td]:border [&>td]:p-2 [&>td]:border-slate-300 [&>td]:text-slate-700 [&>th]:border [&>th]:p-2 [&>th]:border-slate-300 [&>th]:bg-slate-100 [&>th]:text-slate-900 [&>th]:font-semibold [&>strong]:text-slate-900 [&>em]:text-slate-600 [&>a]:text-blue-600 [&>a]:underline"
                    dangerouslySetInnerHTML={{ __html: cleanContent }}
                  />
                );
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;