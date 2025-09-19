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
                  <div className={`w-2 h-2 rounded-full ${
                    message.source === 'local' ? 'bg-blue-400' : 
                    message.source === 'bedrock' ? 'bg-slate-900' : 
                    'bg-green-400'
                  }`}></div>
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
                // For all assistant/error messages, render as HTML
                return (
                  <div
                    className="text-slate-700 leading-relaxed"
                    style={{ 
                      lineHeight: '1.6',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                    dangerouslySetInnerHTML={{ __html: content }}
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