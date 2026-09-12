import React, { useState } from 'react';
import {
  X,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  User,
  Lock,
  Coins,
  ArrowUpRight
} from 'lucide-react';
import { AdminUserRecord } from '../types/mining';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  availableBalance: number;
  depositBalance?: number;
  userFundPassword?: string;
  adminUsers?: AdminUserRecord[];
  currentUserId?: string;
  onConfirmTransfer: (
    recipientId: string,
    amount: number,
    fundPin: string,
    sourceWallet: 'deposit' | 'withdrawable'
  ) => void;
}

export const P2PTransferModal: React.FC<Props> = ({
  isOpen,
  onDismiss,
  availableBalance,
  depositBalance = 0,
  userFundPassword = '',
  adminUsers = [],
  currentUserId = '',
  onConfirmTransfer
}) => {
  const [sourceWallet, setSourceWallet] = useState<'deposit' | 'withdrawable'>('deposit');
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [fundPin, setFundPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const safeDepositBalance = Number(depositBalance) || 0;
  const safeWithdrawableBalance = Number(availableBalance) || 0;
  const activeSourceBalance = sourceWallet === 'deposit' ? safeDepositBalance : safeWithdrawableBalance;

  // Real-time recipient lookup
  const cleanRecipientId = recipientId.trim().toUpperCase();
  const matchedUser = adminUsers.find(
    (u) => u.id.toUpperCase() === cleanRecipientId || u.name.toUpperCase() === cleanRecipientId
  );

  const numAmount = parseFloat(amount) || 0;

  const handleSelectSourceWallet = (wallet: 'deposit' | 'withdrawable') => {
    setSourceWallet(wallet);
    setAmount('');
    setErrorMessage('');
  };

  const handlePercentageClick = (pct: number) => {
    const calculated = +((activeSourceBalance * pct) / 100).toFixed(2);
    setAmount(calculated > 0 ? calculated.toString() : '');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cleanRecipientId) {
      setErrorMessage('Please enter a recipient User ID.');
      return;
    }

    if (currentUserId && cleanRecipientId === currentUserId.toUpperCase()) {
      setErrorMessage('You cannot transfer funds to your own User ID.');
      return;
    }

    if (numAmount <= 0) {
      setErrorMessage('Please enter a valid transfer amount greater than $0.');
      return;
    }

    if (numAmount > activeSourceBalance) {
      const label = sourceWallet === 'deposit' ? 'deposit' : 'withdrawable';
      setErrorMessage(`Insufficient ${label} balance. You have $${activeSourceBalance.toFixed(2)} USDT available.`);
      return;
    }

    if (userFundPassword && fundPin !== userFundPassword) {
      setErrorMessage('Incorrect 6-digit Fund Password / PIN. Please re-enter.');
      return;
    }

    if (!userFundPassword && fundPin.length < 4) {
      setErrorMessage('Please enter at least a 4-digit Fund PIN to authorize this transfer.');
      return;
    }

    onConfirmTransfer(cleanRecipientId, numAmount, fundPin, sourceWallet);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div onClick={onDismiss} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-[450px] rounded-2xl bg-[#081120] border border-[#7C3AED]/50 shadow-[0_0_35px_rgba(124,58,237,0.25)] p-5 space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#14233D] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/30 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white tracking-wide">P2P Member Transfer</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9.5px] font-black uppercase">
                  0% Fee
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Send funds from your Deposit or Withdrawable balance directly to any member
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Wallet Selector (Deposit Balance vs Withdrawable Balance) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#CBD5E1]">
              Select Source Balance to Transfer From:
            </label>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">
              Active: {sourceWallet === 'deposit' ? 'Deposit Balance' : 'Withdrawable Balance'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Deposit Balance Card */}
            <button
              type="button"
              onClick={() => handleSelectSourceWallet('deposit')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                sourceWallet === 'deposit'
                  ? 'bg-gradient-to-br from-cyan-950/50 to-[#0A1A2F] border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/60'
                  : 'bg-[#060D1A] border-[#142642] hover:border-[#1E3A66] opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] uppercase font-black tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-cyan-400" />
                  Deposit Balance
                </span>
                {sourceWallet === 'deposit' && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                )}
              </div>
              <span className="text-lg sm:text-xl font-mono font-black text-white block">
                ${safeDepositBalance.toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">USDT</span>
              </span>
              <span className="text-[10px] text-cyan-400/90 font-medium">
                Deposited Capital
              </span>
            </button>

            {/* Withdrawable Balance Card */}
            <button
              type="button"
              onClick={() => handleSelectSourceWallet('withdrawable')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                sourceWallet === 'withdrawable'
                  ? 'bg-gradient-to-br from-purple-950/50 to-[#140E29] border-purple-400 shadow-lg shadow-purple-500/20 ring-1 ring-purple-400/60'
                  : 'bg-[#060D1A] border-[#142642] hover:border-[#1E3A66] opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] uppercase font-black tracking-wider text-purple-300 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
                  Withdrawable
                </span>
                {sourceWallet === 'withdrawable' && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                )}
              </div>
              <span className="text-lg sm:text-xl font-mono font-black text-white block">
                ${safeWithdrawableBalance.toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">USDT</span>
              </span>
              <span className="text-[10px] text-purple-400/90 font-medium">
                Mining Yield & Bonus
              </span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Recipient User ID */}
          <div>
            <label className="text-[11px] font-bold text-[#CBD5E1] block mb-1">
              Recipient Member User ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Recipient ID (e.g. NEON741289)"
                value={recipientId}
                onChange={(e) => {
                  setRecipientId(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-[#050B14] border border-[#1C3252] text-white font-mono text-[12.5px] focus:outline-none focus:border-purple-400 uppercase placeholder:normal-case placeholder:text-[#64748B]"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* Recipient Verification Feedback */}
            {cleanRecipientId && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                {matchedUser ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified: {matchedUser.name} ({matchedUser.id})
                  </span>
                ) : (
                  <span className="text-cyan-400 font-medium">
                    → Will be credited directly to User ID: <strong className="font-mono">{cleanRecipientId}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-[#CBD5E1]">
                Transfer Amount (USDT)
              </label>
              <div className="flex items-center gap-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageClick(pct)}
                    className="px-2 py-0.5 rounded bg-[#13233C] hover:bg-[#1A3154] text-[10px] font-mono font-bold text-[#38BDF8] border border-[#1E375E] transition-all cursor-pointer"
                  >
                    {pct === 100 ? 'MAX' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={activeSourceBalance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full pl-3 pr-16 py-2.5 rounded-xl bg-[#050B14] border border-[#1C3252] text-white font-mono font-bold text-[14px] focus:outline-none focus:border-purple-400 placeholder:text-[#64748B]"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">
                USDT
              </span>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">
              Available in {sourceWallet === 'deposit' ? 'Deposit Balance' : 'Withdrawable Balance'}: <strong className="text-white font-mono">${activeSourceBalance.toFixed(2)} USDT</strong>
            </span>
          </div>

          {/* Fund Password / PIN */}
          <div>
            <label className="text-[11px] font-bold text-[#CBD5E1] block mb-1">
              {!userFundPassword ? 'Create 6-Digit Fund Password / Security PIN' : '6-Digit Fund Password / Security PIN'}
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                placeholder={!userFundPassword ? "Create 6-Digit PIN (e.g. 888888)" : "Enter 6-Digit Fund Password"}
                value={fundPin}
                onChange={(e) => {
                  setFundPin(e.target.value.replace(/\D/g, ''));
                  setErrorMessage('');
                }}
                className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-[#050B14] border border-[#1C3252] text-white font-mono text-[13px] tracking-widest focus:outline-none focus:border-purple-400"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] text-[#64748B] mt-0.5 block">
              {!userFundPassword
                ? '🔒 First-Time Setup: Set your 6-digit PIN to authorize this transfer and secure your account.'
                : 'Required to authorize peer-to-peer wallet transfers'}
            </span>
          </div>

          {/* Breakdown Preview (Zero Fee Guarantee) */}
          <div className="p-3 rounded-xl bg-[#06101E] border border-purple-500/25 space-y-1.5 text-[11.5px]">
            <div className="flex justify-between text-[#94A3B8]">
              <span>Deducted from your {sourceWallet === 'deposit' ? 'Deposit Balance' : 'Withdrawable Balance'}:</span>
              <span className="font-mono text-white font-bold">${numAmount.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-[#94A3B8]">
              <span>P2P Transfer Fee (0%):</span>
              <span className="font-mono text-emerald-400 font-bold">$0.00 (Zero Fee)</span>
            </div>
            <div className="h-px bg-[#14233C]" />
            <div className="flex justify-between text-white font-bold">
              <span>Recipient receives into Deposit Balance:</span>
              <span className="font-mono text-[#10B981] font-black text-sm">
                +${numAmount.toFixed(2)} USDT (100% Full)
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 text-[11.5px] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 py-2.5 rounded-xl bg-[#0B172A] border border-[#1E3352] text-gray-300 hover:text-white font-bold text-[12px] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numAmount <= 0 || !cleanRecipientId}
              className="flex-[1.5] py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[12.5px] flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm & Transfer {numAmount > 0 ? `($${numAmount.toFixed(2)})` : ''}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
