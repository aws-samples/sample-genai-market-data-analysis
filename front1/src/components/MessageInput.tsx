import React, { useState, useRef, useEffect } from 'react';

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onEnterPress?: () => void;
  autoFocus?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  value: controlledValue,
  onChange: controlledOnChange,
  onEnterPress,
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Use controlled value if provided, otherwise use internal state
  const inputValue = controlledValue !== undefined ? controlledValue : internalValue;
  const handleChange = controlledOnChange || setInternalValue;

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    handleChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      if (onEnterPress) {
        onEnterPress();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = inputValue.trim();
    
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      
      // Clear input after sending (only if using internal state)
      if (controlledValue === undefined) {
        setInternalValue('');
      }
    }
  };

  const isEmpty = !inputValue.trim();

  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor="research-query-input" className="sr-only">
          Enter your research query
        </label>
        <textarea
          id="research-query-input"
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={`
            w-full px-4 py-3 border rounded-lg resize-none text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50
            transition-all duration-200 hover:border-slate-400
            ${disabled ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'}
            text-slate-900 placeholder-slate-500 font-medium
          `}
          aria-label="Research query input"
          aria-describedby="query-input-help query-input-status"
          aria-invalid={false}
          aria-required="false"
        />
        
        {/* Status indicator */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
          {disabled && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span id="query-input-status" className="text-xs text-slate-500 font-medium" aria-live="polite">
                Processing...
              </span>
            </div>
          )}
          {!disabled && inputValue.length > 0 && (
            <div className="text-xs text-slate-400 font-medium">
              {inputValue.length} characters
            </div>
          )}
        </div>
      </div>
      
      {/* Professional help text */}
      <div id="query-input-help" className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4 text-slate-500">
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Enter</kbd>
            <span>to submit</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Shift</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Enter</kbd>
            <span>for new line</span>
          </div>
        </div>
        <div className="text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;