import React from 'react';

interface Props {
  message: string | null;
  onDismiss?: () => void;
}

export const ToastNotification: React.FC<Props> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] animate-slideUp">
      <div className="rounded-xl bg-[#0F2642] border border-[#00F0FF]/40 px-4 py-3 text-[13px] font-medium text-[#F8FAFC] shadow-[0_4px_25px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3">
        <span>{message}</span>
        <button
          onClick={onDismiss}
          className="text-[#00F0FF] text-[12px] font-bold hover:underline shrink-0"
        >
          OK
        </button>
      </div>
    </div>
  );
};
