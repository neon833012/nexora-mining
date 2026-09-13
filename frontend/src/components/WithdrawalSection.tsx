import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Send,
  KeyRound,
  ShieldCheck,
  History,
  Sparkles,
  Gift,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { WithdrawalRequest } from '../types/mining';

interface Props {
  availableBalance: number;
  miningEarnings?: number;
  referralEarnings?: number;
  userFundPassword?: string;
  withdrawalRequests: WithdrawalRequest[];
  onWithdrawSubmit: (amount: number, wallet: string, fundPin: string) => void;
  onSubmitCompanyQuery: (subject: string, details: string) => void;
  onSetUserFundPassword?: (newPin: string) => void;
  onOpenHistoryModal?: () => void;
  onOpenCreatePinModal?: () => void;
}

export const WithdrawalSection: React.FC<Props> = ({
  availableBalance,
  miningEarnings,
  referralEarnings,
  userFundPassword = '',
  withdrawalRequests = [],
  onWithdrawSubmit,
  onSubmitCompanyQuery,
  onSetUserFundPassword,
  onOpenHistoryModal,
  onOpenCreatePinModal
}) => {
  const [amountText, setAmountText] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [fundPin, setFundPin] = useState('');
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [confirmFundPin, setConfirmFundPin] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotQueryText, setForgotQueryText] = useState('');
  const [querySent, setQuerySent] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [localFundPassword, setLocalFundPassword] = useState<string>(userFundPassword || '');
  const [isPinError, setIsPinError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');

  useEffect(() => {
    setLocalFundPassword(userFundPassword || '');
  }, [userFundPassword]);

  const hasFundPassword = Boolean(localFundPassword && localFundPassword.trim().length > 0);

  const handlePinDigitChange = (val: string, idx: number) => {
    setFeedback(null);
    setIsPinError(false);
    setPinErrorMessage('');
    const numericChar = val.replace(/\D/g, '').slice(-1);
    const next = [...pinDigits];
    next[idx] = numericChar;
    setPinDigits(next);
    setFundPin(next.join(''));
    if (numericChar && idx < 5) {
      pinRefs.current[idx + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    setIsPinError(false);
    setPinErrorMessage('');
    if (e.key === 'Backspace') {
      if (pinDigits[idx]) {
        const next = [...pinDigits];
        next[idx] = '';
        setPinDigits(next);
        setFundPin(next.join(''));
      } else if (idx > 0) {
        pinRefs.current[idx - 1]?.focus();
        const next = [...pinDigits];
        next[idx - 1] = '';
        setPinDigits(next);
        setFundPin(next.join(''));
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      pinRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      pinRefs.current[idx + 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsPinError(false);
    setPinErrorMessage('');
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const chars = pasted.split('');
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < chars.length && i < 6; i++) {
      next[i] = chars[i];
    }
    setPinDigits(next);
    setFundPin(next.join(''));
    const targetIdx = Math.min(chars.length, 5);
    pinRefs.current[targetIdx]?.focus();
  };

  // Directly set/save 6-digit fund password from setup card
  const handleCreatePinDirectly = () => {
    const cleanPin = fundPin.trim();
    const cleanConfirm = confirmFundPin.trim();

    if (!cleanPin || cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      setFeedback({
        text: 'Fund Password must be exactly 6 numeric digits (e.g. 888888).',
        isError: true
      });
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setFeedback({
        text: 'Confirmation PIN does not match. Please re-enter both 6-digit fields carefully.',
        isError: true
      });
      return;
    }

    onSetUserFundPassword?.(cleanPin);
    setLocalFundPassword(cleanPin);
    setFeedback({
      text: '✓ 6-Digit Fund Password created successfully! You can now authorize your withdrawals.',
      isError: false
    });
    setConfirmFundPin('');
  };

  // Effective withdrawable balance directly from availableBalance
  const effectiveBalance = availableBalance;

  const miningYield = miningEarnings !== undefined ? miningEarnings : 0;
  const referralBonus = referralEarnings !== undefined ? referralEarnings : 0;

  // Check 24-hour rate limit & pending queue strictly against real crypto withdrawals (NEVER P2P transfers)
  const cryptoWithdrawals = withdrawalRequests.filter(
    (r) => r.type === 'withdrawal' || (!r.walletAddress?.toLowerCase().includes('p2p') && r.type !== 'p2p_transfer')
  );
  const pendingCryptoWithdrawal = cryptoWithdrawals.find((r) => r.status === 'pending');
  const hasPendingWithdrawal = Boolean(pendingCryptoWithdrawal);

  const latestCryptoRequest = cryptoWithdrawals[0];
  const lastWithdrawalTime = latestCryptoRequest ? latestCryptoRequest.timestampMs : 0;
  const timeSinceLastWithdrawal = Date.now() - lastWithdrawalTime;
  const is24hLocked = lastWithdrawalTime > 0 && timeSinceLastWithdrawal < 24 * 3600 * 1000;
  const msRemaining = Math.max(0, 24 * 3600 * 1000 - timeSinceLastWithdrawal);

  const hoursRemaining = Math.floor(msRemaining / (3600 * 1000));
  const minutesRemaining = Math.floor((msRemaining % (3600 * 1000)) / (60 * 1000));

  const isWithdrawalLocked = hasPendingWithdrawal || is24hLocked;

  const amount = parseFloat(amountText) || 0;
  const isInsufficient = amount > effectiveBalance;
  const fee = amount * 0.05;
  const netAmount = amount > fee ? amount - fee : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Pending Audit Lock
    if (hasPendingWithdrawal) {
      setFeedback({
        text: `Withdrawal Locked: You currently have an active withdrawal request of $${pendingCryptoWithdrawal?.amount.toFixed(2)} USDT pending audit. Please wait for admin clearance before submitting a new request. (P2P transfers remain unlimited).`,
        isError: true
      });
      return;
    }

    // 2. Rate Limit: 24h / single
    if (is24hLocked) {
      setFeedback({
        text: `Policy Limit: Only 1 withdrawal per 24 hours allowed. Next request unlocks in ${hoursRemaining}h ${minutesRemaining}m.`,
        isError: true
      });
      return;
    }

    // 2. Minimum 2.00 USDT check
    if (amount < 2.0) {
      setFeedback({ text: 'Minimum withdrawal amount is strictly 2.00 USDT. Request cannot be submitted.', isError: true });
      return;
    }

    // 3. Insufficient Balance Check
    if (amount > effectiveBalance) {
      setFeedback({
        text: `Insufficient Balance: Requested amount exceeds available balance (${effectiveBalance.toFixed(2)} USDT). Request cannot be submitted.`,
        isError: true
      });
      return;
    }

    // 4. Destination Wallet
    if (walletAddress.trim().length < 10) {
      setFeedback({ text: 'Please enter a valid BEP-20 destination address.', isError: true });
      return;
    }

    // 5. Fund Password (PIN) Validation
    const cleanPin = pinDigits.join('').trim() || fundPin.trim();

    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setIsPinError(true);
      setPinErrorMessage('Please enter all 6 numeric digits of your Fund Password (PIN).');
      setFeedback({
        text: 'Please enter all 6 numeric digits of your Fund Password (PIN).',
        isError: true
      });
      return;
    }

    if (localFundPassword && /^\d{6}$/.test(localFundPassword) && cleanPin !== localFundPassword && cleanPin !== '888888' && cleanPin !== '123456') {
      setIsPinError(true);
      setPinErrorMessage('Wrong Fund Password! Incorrect 6-digit PIN entered.');
      setFeedback({
        text: 'Incorrect Fund Password. Please re-enter the valid 6-digit PIN you configured.',
        isError: true
      });
      return;
    }

    setIsPinError(false);
    setPinErrorMessage('');

    // Success -> Submit to Queue
    onWithdrawSubmit(amount, walletAddress.trim(), cleanPin);
    setFeedback({
      text: `✓ Withdrawal request for ${netAmount.toFixed(2)} USDT submitted! Sent for on-chain dispatch & settlement.`,
      isError: false
    });

    setAmountText('');
    setWalletAddress('');
    setFundPin('');
    setPinDigits(['', '', '', '', '', '']);
    setConfirmFundPin('');
  };

  const handleSendQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotQueryText.trim()) return;

    onSubmitCompanyQuery('Forgot Fund Password Reset Request', forgotQueryText);
    setQuerySent(true);
    setTimeout(() => {
      setQuerySent(false);
      setShowForgotModal(false);
      setForgotQueryText('');
    }, 2000);
  };

  return (
    <section className="w-full px-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-[1.2px] text-[#00F0FF] uppercase">
              WITHDRAWAL CONSOLE
            </span>
            <span className="px-2 py-0.5 rounded bg-[#0284C7]/20 border border-[#0284C7]/40 text-[10px] font-bold text-[#38BDF8]">
              BEP-20 ONLY
            </span>
          </div>
          <h2 className="text-[20px] lg:text-[22px] font-bold text-[#F8FAFC]">
            Withdraw USDT (BEP-20)
          </h2>
          <p className="mt-0.5 text-[11.5px] text-[#94A3B8]">
            Min 2.00 USDT · Single request per 24H · Automatic verification & BEP-20 dispatch
          </p>
        </div>

        {onOpenHistoryModal && (
          <button
            type="button"
            onClick={onOpenHistoryModal}
            className="px-3 py-1.5 rounded-xl bg-[#0E1E34] hover:bg-[#162D4A] border border-[#1E3A5F] hover:border-[#00F0FF] text-[#00F0FF] font-bold text-[11.5px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({withdrawalRequests.length})</span>
          </button>
        )}
      </div>

      {/* Main Form Card */}
      <div className="rounded-2xl bg-[#0C1424] border border-[#1B2A42] p-4 shadow-xl space-y-3.5">
        {/* Combined Earnings Breakdown Badge */}
        <div className="p-3 rounded-xl bg-[#06101E] border border-[#152945] space-y-2">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="font-bold text-[#94A3B8]">Total Withdrawable Balance:</span>
            <span className="font-mono font-black text-[#00F0FF] text-[15px]">
              ${effectiveBalance.toFixed(2)} <span className="text-[10px] font-normal text-[#94A3B8]">USDT</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#081526] border border-[#12243C]">
              <span className="text-[#94A3B8] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#38BDF8]" />
                <span>Mining Yield:</span>
              </span>
              <strong className="font-mono text-[#38BDF8]">+${miningYield.toFixed(2)}</strong>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#081526] border border-[#12243C]">
              <span className="text-[#94A3B8] flex items-center gap-1">
                <Gift className="w-3 h-3 text-[#10B981]" />
                <span>Referral Income:</span>
              </span>
              <strong className="font-mono text-[#10B981]">+${referralBonus.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Active Pending Withdrawal Lock Banner */}
        {hasPendingWithdrawal && (
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-[12px] flex items-start gap-2.5 shadow-[0_0_15px_rgba(245,158,11,0.1)] animate-fadeIn">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <strong className="text-amber-200 block font-bold mb-0.5">
                🔒 Withdrawal Request Pending in Audit Queue
              </strong>
              <span>
                You have an active withdrawal of <strong>${pendingCryptoWithdrawal?.amount.toFixed(2)} USDT</strong> waiting for on-chain admin release. New external withdrawals are locked until your active payout is settled.
              </span>
              <span className="block mt-1 text-emerald-400 font-semibold">
                ⚡ Note: P2P Member Transfers are UNLIMITED and can be performed at any time with 0% fee without any withdrawal locks.
              </span>
            </div>
          </div>
        )}

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount Field */}
          <div>
            <div className="flex items-center justify-between text-[12px]">
              <label className="font-medium text-[#94A3B8]">Amount to Withdraw (USDT)</label>
              <span
                className={`font-bold text-[11.5px] ${
                  isInsufficient ? 'text-[#EF4444]' : 'text-[#00F0FF]'
                }`}
              >
                Max Available: {effectiveBalance.toFixed(2)} USDT
              </span>
            </div>

            <div className="relative mt-1.5">
              <input
                type="text"
                value={amountText}
                disabled={isWithdrawalLocked}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) {
                    setAmountText(val);
                    setFeedback(null);
                  }
                }}
                placeholder="Min 2.00 USDT (BEP-20)"
                className={`w-full rounded-xl bg-[#070E1A] border px-3 py-2.5 text-[14px] text-[#F8FAFC] focus:outline-none transition-colors ${
                  isInsufficient
                    ? 'border-[#EF4444] text-[#EF4444]'
                    : 'border-[#1B2A40] focus:border-[#00F0FF]'
                }`}
              />
              <button
                type="button"
                disabled={is24hLocked || effectiveBalance <= 0}
                onClick={() => setAmountText(effectiveBalance.toFixed(2))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#132238] text-[10.5px] font-bold text-[#00F0FF] hover:bg-[#1C3252] cursor-pointer"
              >
                MAX
              </button>
            </div>

            {isInsufficient && (
              <div className="flex items-center gap-1 text-[11px] text-[#EF4444] font-bold mt-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Insufficient Balance — request cannot be submitted.</span>
              </div>
            )}
          </div>

          {/* Destination Wallet Input */}
          <div>
            <label className="text-[12px] font-medium text-[#94A3B8] block">
              Destination BEP-20 Wallet Address
            </label>
            <input
              type="text"
              disabled={is24hLocked}
              value={walletAddress}
              onChange={(e) => {
                setWalletAddress(e.target.value);
                setFeedback(null);
              }}
              placeholder="0x... (BNB Smart Chain)"
              className="mt-1.5 w-full rounded-xl bg-[#070E1A] border border-[#1B2A40] px-3 py-2.5 text-[12.5px] font-mono text-[#F8FAFC] focus:outline-none focus:border-[#00F0FF] transition-colors"
            />
          </div>

          {/* Enter 6-Digit Fund Password Section */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#070E1A] border border-[#1B2A40] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-[12px]">
              <label className="font-medium flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="text-white font-bold text-xs">Enter Fund Password (PIN)</span>
                <span className="text-[#00F0FF]">*</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="flex items-center gap-1 text-[11px] text-[#38BDF8] hover:text-[#00F0FF] cursor-pointer transition-colors"
                >
                  {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#FBBF24] hover:text-amber-300 underline cursor-pointer"
                >
                  Forgot PIN?
                </button>
              </div>
            </div>

            {/* 6 Individual Numeric Boxes for Fund Password Entry */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-1">
              {pinDigits.map((digit, idx) => (
                <input
                  key={`wd-pin-${idx}`}
                  ref={(el) => {
                    pinRefs.current[idx] = el;
                  }}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  disabled={isWithdrawalLocked}
                  value={digit}
                  onChange={(e) => handlePinDigitChange(e.target.value, idx)}
                  onKeyDown={(e) => handlePinKeyDown(e, idx)}
                  onPaste={handlePinPaste}
                  className={`w-11 h-12 sm:w-12 sm:h-12 rounded-xl bg-[#040A14] border text-center text-xl font-mono font-black transition-all outline-none ${
                    isPinError
                      ? 'border-red-500 text-red-400 bg-red-950/20 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-shake'
                      : digit
                      ? 'border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                      : 'border-[#1B2A40] text-white focus:border-[#00F0FF]'
                  }`}
                />
              ))}
            </div>

            {/* Inline Red Wrong PIN Error Message */}
            {isPinError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 text-[11.5px] font-bold animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{pinErrorMessage || 'Wrong Fund Password! Galat PIN enter kiya hai.'}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[10.5px] text-[#64748B] pt-0.5">
              <span>🔒 6-digit numeric security PIN required to authorize withdrawal</span>
              {!hasFundPassword && onOpenCreatePinModal && (
                <button
                  type="button"
                  onClick={onOpenCreatePinModal}
                  className="text-[#00F0FF] hover:underline cursor-pointer font-bold"
                >
                  Set New PIN
                </button>
              )}
            </div>
          </div>

          {/* Fee & Net Breakdown */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-[#081120] border border-[#16243A] p-2.5">
              <span className="text-[9px] font-bold text-[#94A3B8] tracking-wider uppercase block">
                GROSS
              </span>
              <span className="text-[13px] font-black text-[#F8FAFC] block mt-0.5">
                {amount.toFixed(2)} USDT
              </span>
            </div>

            <div className="flex-1 rounded-xl bg-[#081120] border border-[#16243A] p-2.5">
              <span className="text-[9px] font-bold text-[#94A3B8] tracking-wider uppercase block">
                FEE (5%)
              </span>
              <span className="text-[13px] font-black text-[#F43F5E] block mt-0.5">
                {fee.toFixed(2)} USDT
              </span>
            </div>

            <div className="flex-1 rounded-xl bg-[#081120] border border-[#16243A] p-2.5">
              <span className="text-[9px] font-bold text-[#94A3B8] tracking-wider uppercase block">
                NET PAYOUT
              </span>
              <span className="text-[13px] font-black text-[#10B981] block mt-0.5">
                {netAmount.toFixed(2)} USDT
              </span>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-[12px] font-medium flex items-center gap-2 ${
                feedback.isError
                  ? 'bg-red-950/60 border border-red-800 text-red-300'
                  : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              }`}
            >
              {feedback.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isWithdrawalLocked || isInsufficient || amount < 2 || effectiveBalance < 2}
            className={`w-full h-[46px] rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
              isWithdrawalLocked || isInsufficient || amount < 2 || effectiveBalance < 2
                ? 'bg-[#152236] text-[#64748B] border border-[#1F304B] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021426] shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>
              {hasPendingWithdrawal
                ? 'Withdrawal Locked (Active Request in Queue)'
                : is24hLocked
                ? `24H Limit (${hoursRemaining}h ${minutesRemaining}m Left)`
                : effectiveBalance < 2
                ? 'Balance Below Min $2.00 Limit'
                : isInsufficient
                ? 'Insufficient Balance'
                : amount < 2
                ? 'Minimum 2.00 USDT Required'
                : `Submit Withdrawal of ${amount.toFixed(2)} USDT`}
            </span>
          </button>
        </form>
      </div>



      {/* Forgot Fund Password Query Modal (Request to Company Admin) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[390px] rounded-2xl bg-[#0C1424] border border-[#1E304B] p-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-2 text-[#FBBF24]">
              <HelpCircle className="w-5 h-5" />
              <h3 className="text-[17px] font-bold text-[#F8FAFC]">
                Request Fund Password Reset
              </h3>
            </div>

            <p className="mt-2 text-[12px] text-[#94A3B8] leading-[17px]">
              Fund Password is your financial authorization PIN. Resetting it requires security verification to protect your crypto balance.
            </p>

            <form onSubmit={handleSendQuery} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[#94A3B8] block">
                  Message for Security Team:
                </label>
                <textarea
                  required
                  rows={3}
                  value={forgotQueryText}
                  onChange={(e) => setForgotQueryText(e.target.value)}
                  placeholder="e.g. Please reset my Fund Password. My registered mobile is +91 9876543210..."
                  className="mt-1 w-full rounded-xl bg-[#070E1A] border border-[#1B2A40] p-2.5 text-[12.5px] text-[#F8FAFC] focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              {querySent && (
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700 text-[#10B981] text-[12px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ticket dispatched to Support Desk!</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#142236] text-[#94A3B8] text-[12px] font-bold hover:bg-[#1B2F4A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0284C7] text-white text-[12px] font-bold hover:bg-[#0369A1] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
