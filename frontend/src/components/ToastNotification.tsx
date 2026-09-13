import React from 'react';

interface Props {
  message: string | null;
  onDismiss?: () => void;
}

export const ToastNotification: React.FC<Props> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed top-16 sm:top-6 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-[420px] animate-slideDown pointer-events-auto">
      <div className="rounded-2xl bg-[#081527]/95 backdrop-blur-md border border-[#00F0FF]/50 px-4 py-3 text-[13px] font-medium text-[#F8FAFC] shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_15px_rgba(0,240,255,0.2)] flex items-center justify-between gap-3">
        <span>{message}</span>
        <button
          onClick={onDismiss}
          className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] text-[12px] font-bold hover:underline shrink-0 cursor-pointer"
        >
          OK
        </button>
      </div>
    </div>
  );
};
