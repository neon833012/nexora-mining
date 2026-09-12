import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: (pin: string) => void;
}

export const CreateFundPasswordModal: React.FC<Props> = ({
  isOpen,
  onDismiss,
  onSuccess
}) => {
  const [createDigits, setCreateDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [confirmDigits, setConfirmDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showDigits, setShowDigits] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const createRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setCreateDigits(['', '', '', '', '', '']);
      setConfirmDigits(['', '', '', '', '', '']);
      setErrorMessage('');
      setShowDigits(false);
      setTimeout(() => {
        createRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (
    value: string,
    index: number,
    isConfirm: boolean
  ) => {
    setErrorMessage('');
    const numericChar = value.replace(/\D/g, '').slice(-1);

    if (isConfirm) {
      const next = [...confirmDigits];
      next[index] = numericChar;
      setConfirmDigits(next);
      if (numericChar && index < 5) {
        confirmRefs.current[index + 1]?.focus();
      }
    } else {
      const next = [...createDigits];
      next[index] = numericChar;
      setCreateDigits(next);
      if (numericChar && index < 5) {
        createRefs.current[index + 1]?.focus();
      } else if (numericChar && index === 5) {
        // Auto move to first box of confirm PIN
        confirmRefs.current[0]?.focus();
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    isConfirm: boolean
  ) => {
    const digits = isConfirm ? confirmDigits : createDigits;
    const refs = isConfirm ? confirmRefs : createRefs;

    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current box
        const next = [...digits];
        next[index] = '';
        if (isConfirm) setConfirmDigits(next);
        else setCreateDigits(next);
      } else if (index > 0) {
        // Focus previous box and clear it
        refs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        if (isConfirm) setConfirmDigits(next);
        else setCreateDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    isConfirm: boolean
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const chars = pasted.split('');
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < chars.length && i < 6; i++) {
      newDigits[i] = chars[i];
    }

    if (isConfirm) {
      setConfirmDigits(newDigits);
      const targetIndex = Math.min(chars.length, 5);
      confirmRefs.current[targetIndex]?.focus();
    } else {
      setCreateDigits(newDigits);
      if (chars.length === 6) {
        confirmRefs.current[0]?.focus();
      } else {
        createRefs.current[chars.length]?.focus();
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const createPin = createDigits.join('');
    const confirmPin = confirmDigits.join('');

    if (createPin.length !== 6 || !/^\d{6}$/.test(createPin)) {
      setErrorMessage('Please enter all 6 numeric digits for Create Fund Password.');
      const firstEmpty = createDigits.findIndex((d) => !d);
      createRefs.current[firstEmpty !== -1 ? firstEmpty : 0]?.focus();
      return;
    }

    if (confirmPin.length !== 6 || !/^\d{6}$/.test(confirmPin)) {
      setErrorMessage('Please enter all 6 numeric digits for Confirm Fund Password.');
      const firstEmpty = confirmDigits.findIndex((d) => !d);
      confirmRefs.current[firstEmpty !== -1 ? firstEmpty : 0]?.focus();
      return;
    }

    if (createPin !== confirmPin) {
      setErrorMessage('Confirm Fund Password does not match. Please re-enter both 6-digit fields.');
      return;
    }

    // Success -> pass pin to caller
    onSuccess(createPin);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-[#081220] border border-[#00F0FF]/40 p-5 sm:p-6 shadow-2xl shadow-cyan-950/60 animate-scaleUp">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-[#0E1A2D] hover:bg-[#182C4A] border border-[#1E3658] flex items-center justify-center text-[#94A3B8] hover:text-white transition-all cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#14233D]">
          <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)] shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-[#00F0FF] uppercase">
                SECURITY SETUP
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-bold">
                REQUIRED
              </span>
            </div>
            <h3 className="text-lg font-black text-white">Create Fund Password</h3>
          </div>
        </div>

        <p className="text-[11.5px] text-[#94A3B8] mt-2.5 leading-relaxed">
          Set your 6-digit numeric PIN to authorize withdrawals and P2P transfers. This protects your wallet from unauthorized cashouts.
        </p>

        {/* Eye Toggle for PIN Visibility */}
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => setShowDigits((prev) => !prev)}
            className="flex items-center gap-1.5 text-[11px] text-[#38BDF8] hover:text-[#00F0FF] cursor-pointer transition-colors"
          >
            {showDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showDigits ? 'Hide PIN' : 'Show PIN'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Section 1: Create Fund Password (6 boxes) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#CBD5E1] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>Create Fund Password</span>
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span className="text-[10px] text-[#64748B] font-mono">6 Digits (Numbers Only)</span>
            </label>
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              {createDigits.map((digit, idx) => (
                <input
                  key={`create-${idx}`}
                  ref={(el) => {
                    createRefs.current[idx] = el;
                  }}
                  type={showDigits ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(e.target.value, idx, false)}
                  onKeyDown={(e) => handleKeyDown(e, idx, false)}
                  onPaste={(e) => handlePaste(e, false)}
                  className={`w-11 h-12 sm:w-12 sm:h-14 rounded-xl bg-[#040A14] border text-center text-xl sm:text-2xl font-mono font-black transition-all outline-none ${
                    digit
                      ? 'border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'border-[#1B2A40] text-white focus:border-[#00F0FF]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Section 2: Confirm Fund Password (6 boxes) */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-[#CBD5E1] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>Confirm Fund Password</span>
                <span className="text-[#00F0FF]">*</span>
              </span>
              <span className="text-[10px] text-[#64748B] font-mono">Re-enter same 6 Digits</span>
            </label>
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              {confirmDigits.map((digit, idx) => (
                <input
                  key={`confirm-${idx}`}
                  ref={(el) => {
                    confirmRefs.current[idx] = el;
                  }}
                  type={showDigits ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(e.target.value, idx, true)}
                  onKeyDown={(e) => handleKeyDown(e, idx, true)}
                  onPaste={(e) => handlePaste(e, true)}
                  className={`w-11 h-12 sm:w-12 sm:h-14 rounded-xl bg-[#040A14] border text-center text-xl sm:text-2xl font-mono font-black transition-all outline-none ${
                    digit
                      ? 'border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                      : 'border-[#1B2A40] text-white focus:border-emerald-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-[11.5px] animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Info note */}
          <div className="p-2.5 rounded-xl bg-[#06101E] border border-[#152945] text-[10.5px] text-[#94A3B8] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
            <span>
              Remember this PIN. You will enter it each time you submit a withdrawal or P2P transfer.
            </span>
          </div>

          {/* Action Buttons: OK Submit */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#0284C7] to-[#0369A1] hover:brightness-110 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] border border-[#00F0FF]/80 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>OK · Set Fund Password</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-2 text-center text-xs text-[#64748B] hover:text-[#94A3B8] cursor-pointer transition-colors"
            >
              Cancel & Return to Wallet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
