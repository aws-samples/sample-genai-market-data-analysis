import React, { useState } from 'react';

export interface ActionButtonsProps {
  onSendLocal: () => void;
  onSendRemote: () => void;
  onClear: () => void;
  disabled?: boolean;
  isInputEmpty?: boolean;
  isLoading?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSendLocal,
  onSendRemote,
  onClear,
  disabled = false,
  isInputEmpty = false,
  isLoading = false,
}) => {
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const handleClearClick = () => {
    setShowClearConfirmation(true);
  };

  const handleConfirmClear = () => {
    onClear();
    setShowClearConfirmation(false);
  };

  const handleCancelClear = () => {
    setShowClearConfirmation(false);
  };

  const isSendDisabled = disabled || isInputEmpty || isLoading;

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={onSendLocal}
          disabled={isSendDisabled}
          className={`
            px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${isSendDisabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'btn-primary'
            }
          `}
          aria-label="Send query to local research engine"
          aria-describedby="send-local-help"
          type="button"
        >
          <span className="flex items-center justify-center">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Local
              </>
            )}
          </span>
        </button>

        <button
          onClick={onSendRemote}
          disabled={isSendDisabled}
          className={`
            flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
            ${isSendDisabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800'
            }
          `}
          aria-label="Send query to cloud research platform"
          aria-describedby="send-remote-help"
          type="button"
        >
          <span className="flex items-center justify-center">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting to Cloud...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Research
              </>
            )}
          </span>
        </button>

        <button
          onClick={handleClearClick}
          disabled={disabled}
          className={`
            px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
            ${disabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'btn-secondary'
            }
          `}
          aria-label="Clear research session"
          aria-describedby="clear-chat-help"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>



      {/* Confirmation Dialog */}
      {showClearConfirmation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
          aria-describedby="clear-dialog-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelClear();
            }
          }}
        >
          <div className="financial-card p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 id="clear-dialog-title" className="text-lg font-semibold financial-heading">
                  Clear Research Session
                </h3>
                <p className="financial-caption">This action cannot be undone</p>
              </div>
            </div>
            <p id="clear-dialog-description" className="financial-body text-sm mb-6">
              Are you sure you want to clear all research queries and responses? This will permanently remove your current session data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelClear}
                className="px-4 py-2 btn-secondary rounded-lg text-sm font-medium"
                aria-label="Cancel clearing session"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 btn-danger rounded-lg text-sm font-medium"
                aria-label="Confirm clearing session"
                autoFocus
                type="button"
              >
                Clear Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionButtons;