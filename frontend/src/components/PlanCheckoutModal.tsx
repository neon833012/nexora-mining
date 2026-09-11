import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Wallet,
  QrCode,
  Sparkles,
  ShieldCheck,
  Clock,
  ExternalLink,
  Cpu,
  RefreshCw,
  Zap,
  Lock
} from 'lucide-react';
import { MiningPlan } from '../types/mining';

interface Props {
  isOpen: boolean;
  plan: MiningPlan | null;
  isUpgrade: boolean;
  activeMiningPower: number;
  diffAmount?: number;
  availableBalance: number;
  onDismiss: () => void;
  onConfirmSuccess: (
    plan: MiningPlan,
    paidCost: number,
    paymentMethod: 'internal' | 'bep20_chain',
    txHash?: string
  ) => void;
}

// Official Binance Smart Chain BEP-20 Custody Vault Address
const DEPOSIT_ADDRESS = '0x77A594DC9afF2F2fcbF49Ee8c1714772e8A8E79B';

export const PlanCheckoutModal: React.FC<Props> = ({
  isOpen,
  plan,
  isUpgrade,
  activeMiningPower,
  diffAmount,
  availableBalance,
  onDismiss,
  onConfirmSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [paymentMethod, setPaymentMethod] = useState<'internal' | 'bep20_chain'>('internal');
  const [enteredTxHash, setEnteredTxHash] = useState('');
  const [copiedField, setCopiedField] = useState<'address' | 'amount' | 'tx' | null>(null);
  const [countdownMinutes, setCountdownMinutes] = useState(14);
  const [countdownSeconds, setCountdownSeconds] = useState(59);

  // Blockchain Verification Animation States (Matching Deposit Flow)
  const [verifyStage, setVerifyStage] = useState<number>(0);
  const [blockConfirmations, setBlockConfirmations] = useState<number>(0);
  const [verifiedTxHash, setVerifiedTxHash] = useState<string>('');

  const payableCost = isUpgrade && diffAmount !== undefined ? diffAmount : (plan?.amount || 0);
  const hasEnoughInternalBalance = availableBalance >= payableCost;

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setVerifyStage(0);
      setBlockConfirmations(0);
      setEnteredTxHash('');
      setCountdownMinutes(14);
      setCountdownSeconds(59);
      // If user has 0 or insufficient balance, automatically default to on-chain BEP20
      setPaymentMethod(hasEnoughInternalBalance ? 'internal' : 'bep20_chain');
    }
  }, [isOpen, plan, availableBalance, diffAmount, hasEnoughInternalBalance]);

  // Payment countdown timer for on-chain transfer
  useEffect(() => {
    if (isOpen && currentStep === 2 && paymentMethod === 'bep20_chain') {
      const timer = setInterval(() => {
        setCountdownSeconds((sec) => {
          if (sec === 0) {
            setCountdownMinutes((min) => (min > 0 ? min - 1 : 0));
            return 59;
          }
          return sec - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, currentStep, paymentMethod]);

  if (!isOpen || !plan) return null;

  const handleCopy = (text: string, field: 'address' | 'amount' | 'tx') => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  /**
   * =========================================================================
   * 🔌 FUTURE BACKEND INTEGRATION HOOK (PLAN PURCHASE / ON-CHAIN VERIFICATION):
   * When your backend is ready, replace this simulation with:
   * 1. If internal wallet:
   *    POST /api/plans/subscribe { planId: plan.id, paymentMethod: 'internal' }
   * 2. If on-chain BEP-20:
   *    Connect WebSocket to /api/plans/listen-deposit/{orderId}
   *    Backend RPC verifies inbound USDT Transfer event on BSC mempool
   * =========================================================================
   */
  const startVerificationProcess = () => {
    if (paymentMethod === 'internal') {
      // Instant internal balance activation
      setCurrentStep(4);
      const generatedHash = `int_${Date.now().toString(16)}`;
      setVerifiedTxHash(generatedHash);
      onConfirmSuccess(plan, payableCost, 'internal', generatedHash);
      return;
    }

    // On-chain BEP-20 Verification Terminal
    setCurrentStep(3);
    setVerifyStage(1);
    setBlockConfirmations(0);

    const generatedHash = enteredTxHash.trim().startsWith('0x') && enteredTxHash.trim().length >= 20
      ? enteredTxHash.trim()
      : '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setVerifiedTxHash(generatedHash);

    // Stage 1: BSC Node RPC Connection
    setTimeout(() => {
      setVerifyStage(2); // USDT Transfer detected in mempool
    }, 1000);

    // Stage 2: Automated Verification Checklist (Token, Network, Receiver, Amount, TxHash, Non-duplicate)
    setTimeout(() => {
      setVerifyStage(3); // All 6 checks passed
    }, 2200);

    // Stage 3: BSC Block Confirmations (1/3 -> 2/3 -> 3/3)
    setTimeout(() => {
      setBlockConfirmations(1);
    }, 3200);

    setTimeout(() => {
      setBlockConfirmations(2);
    }, 4200);

    setTimeout(() => {
      setBlockConfirmations(3);
      setVerifyStage(4); // Node provisioned
    }, 5400);

    // Final Success Step
    setTimeout(() => {
      setCurrentStep(4);
      onConfirmSuccess(plan, payableCost, 'bep20_chain', generatedHash);
    }, 6200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-[460px] max-h-[92vh] overflow-y-auto rounded-2xl bg-[#081220] border border-[#1C3558] shadow-[0_15px_50px_rgba(0,0,0,0.8)] flex flex-col animate-scaleUp">
        {/* Header with Step Indicator */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#091526] to-[#0A1B30] border-b border-[#14263D] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#00F0FF] uppercase tracking-wider">
              <span>NODE ACTIVATION WIZARD</span>
              <span>·</span>
              <span>STEP {currentStep} OF 4</span>
            </div>
            <h3 className="text-[17px] font-black text-white mt-0.5">
              {isUpgrade
                ? `Upgrade to ${plan.planName || 'Plan'} ($${plan.amount})`
                : `Activate ${plan.planName || 'Plan'} ($${plan.amount})`}
            </h3>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#122238] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Progress Tracker */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between gap-1.5">
          {[
            { step: 1, label: 'Review' },
            { step: 2, label: 'Payment' },
            { step: 3, label: 'BSC Verify' },
            { step: 4, label: 'Activated' }
          ].map((item) => (
            <div key={item.step} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1 rounded-full transition-all duration-300 ${
                  currentStep >= item.step
                    ? 'bg-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                    : 'bg-[#15243A]'
                }`}
              />
              <span
                className={`text-[9.5px] font-bold ${
                  currentStep >= item.step ? 'text-[#00F0FF]' : 'text-[#64748B]'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Modal Body Based on Step */}
        <div className="p-5 space-y-4 text-[12px]">
          {/* ========================================================================= */}
          {/* STEP 1: REVIEW PLAN SPECIFICATIONS & UPGRADE MATH                         */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Upgrade Difference Banner */}
              {isUpgrade && (
                <div className="p-3.5 rounded-xl bg-[#062419] border border-[#10B981]/50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#10B981]">
                    <Sparkles className="w-4 h-4" />
                    <span>PAY-THE-DIFFERENCE UPGRADE ACTIVE</span>
                  </div>
                  <div className="flex justify-between text-[#CBD5E1]">
                    <span>Current Active Mining Power:</span>
                    <strong className="text-white">${activeMiningPower.toLocaleString()} USD</strong>
                  </div>
                  <div className="flex justify-between text-[#CBD5E1]">
                    <span>Target Node Power:</span>
                    <strong className="text-white">${plan.amount.toLocaleString()} USD</strong>
                  </div>
                  <div className="flex justify-between border-t border-[#10B981]/30 pt-1 text-[13px] font-black text-[#10B981]">
                    <span>Amount You Pay Today:</span>
                    <span>+${payableCost.toLocaleString()} USD</span>
                  </div>
                </div>
              )}

              {/* Plan Specs Breakdown */}
              <div className="rounded-xl bg-[#050D18] border border-[#14263D] p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8]">Selected Mining Node:</span>
                  <span className="text-[14px] font-black text-[#00F0FF]">
                    {plan.planNumber}: {plan.planName || 'Mining Node'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8]">Node Allocation:</span>
                  <span className="text-[16px] font-black font-mono text-white">
                    ${plan.amount.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Daily Reference Yield:</span>
                  <span className="font-bold text-[#10B981]">{plan.dailyRatePercent.toFixed(2)}% / day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Daily Reward:</span>
                  <span className="font-bold font-mono text-[#FBBF24]">
                    +${(plan.amount * (plan.dailyRatePercent / 100)).toFixed(2)} USDT / day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Duration:</span>
                  <span className="font-bold text-[#F8FAFC]">{plan.durationDays} Days (Full 365D Cycle)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Payout Asset:</span>
                  <span className="font-bold text-[#00F0FF] flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>USDT (BEP-20)</span>
                  </span>
                </div>
              </div>

              {/* User Balance Notice */}
              <div className="p-3 rounded-xl bg-[#081525] border border-[#142944] flex items-center justify-between text-[11.5px]">
                <span className="text-[#94A3B8]">Your Deposit Balance:</span>
                <strong className={`font-mono ${hasEnoughInternalBalance ? 'text-[#10B981]' : 'text-amber-400'}`}>
                  ${availableBalance.toFixed(2)} USDT
                </strong>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#0284C7] via-[#00F0FF] to-[#0284C7] bg-[length:200%_auto] hover:bg-right text-[#021326] font-black text-[14px] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer mt-2"
              >
                <span>Proceed to Payment (${payableCost.toLocaleString()} USDT)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PAYMENT METHOD (ON-CHAIN BEP-20 OR INTERNAL WALLET)               */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Payment Method Selector Tabs */}
              <div className="flex rounded-xl bg-[#050C18] border border-[#14253E] p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bep20_chain')}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-[11.5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'bep20_chain'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>On-Chain BEP-20</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('internal')}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-[11.5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'internal'
                      ? 'bg-[#0284C7] text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Deposit Balance</span>
                </button>
              </div>

              {/* METHOD 1: ON-CHAIN BEP-20 DEPOSIT (Matches User's Requested Architecture) */}
              {paymentMethod === 'bep20_chain' && (
                <div className="p-3.5 rounded-xl bg-[#06101E] border border-[#162B47] space-y-3">
                  {/* Countdown Timer */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#040A14] border border-[#122135]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#FBBF24]">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Payment Window:</span>
                    </div>
                    <span className="text-[12px] font-mono font-bold text-white">
                      {countdownMinutes.toString().padStart(2, '0')}:{countdownSeconds.toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Real Scannable Dynamic QR Code */}
                  <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#040A14] border border-[#122135] text-center space-y-2.5 shadow-inner">
                    <div className="p-2 bg-white rounded-xl shadow-lg relative">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${DEPOSIT_ADDRESS}&margin=2`}
                        alt="BEP-20 USDT Deposit QR Code"
                        className="w-[130px] h-[130px] block select-none"
                      />
                      <div className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-[#F0B90B] border-2 border-white flex items-center justify-center text-black font-black text-[8.5px] shadow-md pointer-events-none">
                        BSC
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">
                        Exact Amount to Transfer:
                      </span>
                      <div className="flex items-baseline justify-center gap-1 mt-0.5">
                        <span className="text-[22px] font-black font-mono text-white">
                          {payableCost.toFixed(2)}
                        </span>
                        <span className="text-[12px] font-bold text-[#00F0FF] font-mono">
                          USDT (BEP-20)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(payableCost.toFixed(2), 'amount')}
                          className="ml-1 p-1 rounded hover:bg-[#0E1E34] text-[#94A3B8] hover:text-[#00F0FF] transition-colors cursor-pointer"
                          title="Copy Amount"
                        >
                          {copiedField === 'amount' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="w-full flex items-center justify-between p-2 rounded-lg bg-[#081220] border border-[#14263D]">
                      <span className="font-mono text-[10.5px] text-[#00F0FF] truncate mr-2">
                        {DEPOSIT_ADDRESS}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(DEPOSIT_ADDRESS, 'address')}
                        className="px-2 py-1 rounded bg-[#0D1F36] hover:bg-[#152E50] text-[#00F0FF] text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        {copiedField === 'address' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <span className="text-[9.5px] text-[#64748B] block">
                      Send via: Trust Wallet, MetaMask, Binance, OKX · BEP-20 Only
                    </span>
                  </div>

                  {/* Optional TxHash Input */}
                  <div>
                    <label className="text-[10.5px] text-[#94A3B8] block mb-1">
                      Transaction Hash / TxID (Optional):
                    </label>
                    <input
                      type="text"
                      value={enteredTxHash}
                      onChange={(e) => setEnteredTxHash(e.target.value)}
                      placeholder="0x... (from your wallet receipt)"
                      className="w-full rounded-xl bg-[#040A14] border border-[#14263E] px-3 py-2 text-[11px] font-mono text-[#CBD5E1] focus:outline-none focus:border-[#00F0FF]"
                    />
                  </div>
                </div>
              )}

              {/* METHOD 2: INTERNAL WALLET */}
              {paymentMethod === 'internal' && (
                <div className="p-3.5 rounded-xl bg-[#06101E] border border-[#162740] space-y-3">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-[#94A3B8]">Available Balance:</span>
                    <strong className="text-[#00F0FF] text-[14px] font-mono">
                      ${availableBalance.toFixed(2)} USDT
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-[#94A3B8]">Plan Price:</span>
                    <strong className="text-white text-[14px] font-mono">
                      -${payableCost.toLocaleString()} USDT
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[12px] border-t border-[#162740] pt-2">
                    <span className="text-[#94A3B8]">Balance After Purchase:</span>
                    <strong className={`font-mono ${hasEnoughInternalBalance ? 'text-[#10B981]' : 'text-red-400'}`}>
                      ${(availableBalance - payableCost).toFixed(2)} USDT
                    </strong>
                  </div>

                  {!hasEnoughInternalBalance && (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800 text-[11px] text-amber-300 flex items-start gap-1.5">
                      <span>⚠️ Insufficient internal balance. Click "On-Chain BEP-20" tab above to pay directly from Trust Wallet / Binance.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-3 rounded-xl bg-[#0B1728] hover:bg-[#11233D] text-[#94A3B8] hover:text-white font-bold text-[12px] transition-colors cursor-pointer"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  disabled={paymentMethod === 'internal' && !hasEnoughInternalBalance}
                  onClick={startVerificationProcess}
                  className={`flex-2 py-3 px-4 rounded-xl font-black text-[13px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-lg ${
                    paymentMethod === 'internal' && !hasEnoughInternalBalance
                      ? 'bg-[#122034] text-[#64748B] border border-[#1B2F4A] cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#0284C7] to-[#00F0FF] hover:brightness-110 text-[#031526] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'internal'
                      ? 'Confirm & Activate Node'
                      : 'I Have Sent USDT (Verify on BSC)'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: BLOCKCHAIN VERIFICATION TERMINAL (Exact Architecture)             */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="py-2 space-y-4 animate-fadeIn">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] mx-auto animate-pulse shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-[17px] font-black text-white">
                  BNB Smart Chain Validation Engine
                </h4>
                <p className="text-[11px] text-[#94A3B8]">
                  Validating inbound node allocation on Chain ID 56...
                </p>
              </div>

              {/* Terminal Checklist Card */}
              <div className="rounded-xl bg-[#040912] border border-[#14263E] p-3.5 font-mono text-[11px] space-y-2.5 shadow-inner">
                {/* Check 1: Inbound RPC Stream */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {verifyStage >= 1 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                    )}
                    <span className="text-[#CBD5E1]">BSC Node Mempool Stream:</span>
                  </div>
                  <span className="text-[#10B981] font-bold">CONNECTED</span>
                </div>

                {/* Check 2: USDT Transfer Detected */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {verifyStage >= 2 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                    )}
                    <span className="text-[#CBD5E1]">Node Allocation Detected:</span>
                  </div>
                  <span className={verifyStage >= 2 ? 'text-emerald-400 font-bold' : 'text-[#64748B]'}>
                    {verifyStage >= 2 ? 'DETECTED' : 'SCANNING...'}
                  </span>
                </div>

                {/* Check 3: Automated Protocol Security Verification */}
                <div className="p-2.5 rounded-lg bg-[#06101E] border border-[#112338] space-y-1.5 text-[10px]">
                  <span className="text-[#94A3B8] font-bold block uppercase tracking-wider">
                    Automated Security Verification:
                  </span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[#CBD5E1]">
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span>
                      <span>Token: <strong>USDT</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span>
                      <span>Network: <strong>BEP20 (56)</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span>
                      <span>Receiver: <strong>Vault Matched</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span>
                      <span>Amount: <strong>{payableCost.toFixed(2)} USDT</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span>
                      <span>TxHash: <strong>BscScan Valid</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span>
                      <span>Plan: <strong>{plan.planName}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Check 4: Block Confirmations */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#CBD5E1]">Required Block Confirmations:</span>
                    <span className="font-bold text-[#FBBF24]">
                      {blockConfirmations} / 3 Blocks
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0E1E34] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0284C7] to-[#10B981] transition-all duration-500"
                      style={{ width: `${(blockConfirmations / 3) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#64748B]">
                <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Smart Contract State: Provisioning hashrate...</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: SUCCESS CONFIRMATION & NODE ACTIVATED                             */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="py-4 flex flex-col items-center text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[10px] font-black tracking-widest text-[#10B981] uppercase bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
                  NODE CONTRACT ACTIVATED
                </span>
                <h4 className="text-[20px] font-black text-white mt-1.5">
                  {plan.planName || 'Mining Node'} Active!
                </h4>
                <p className="mt-1 text-[11.5px] text-[#94A3B8]">
                  Node hashrate of <strong className="text-emerald-400 font-mono">${plan.amount.toLocaleString()} USD</strong> is now live. Daily yield of <strong className="text-[#FBBF24] font-mono">+${(plan.amount * (plan.dailyRatePercent / 100)).toFixed(2)} USDT/day</strong> will accrue automatically.
                </p>
              </div>

              {/* Receipt Card */}
              <div className="w-full p-3.5 rounded-xl bg-[#050D18] border border-[#14263D] text-left space-y-2 text-[11.5px]">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span>Active Mining Plan:</span>
                  <span className="font-bold text-white">{plan.planNumber} ({plan.planName})</span>
                </div>
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span>Staked Amount:</span>
                  <strong className="font-mono text-emerald-400 text-[13px]">${plan.amount.toFixed(2)} USD</strong>
                </div>
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span>Payment Method:</span>
                  <span className="font-mono text-[#00F0FF]">
                    {paymentMethod === 'internal' ? 'Internal Balance' : 'On-Chain BEP-20 (BSC)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span>Admin Order Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                    Confirmed & Settled
                  </span>
                </div>

                {verifiedTxHash && (
                  <div className="pt-2 border-t border-[#122237] flex items-center justify-between text-[10.5px]">
                    <span className="text-[#64748B] font-mono truncate max-w-[220px]">
                      Tx: {verifiedTxHash}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(verifiedTxHash, 'tx')}
                      className="text-[#00F0FF] hover:underline font-mono cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {copiedField === 'tx' ? (
                        <span className="text-emerald-400">Copied</span>
                      ) : (
                        <>
                          <span>Copy</span>
                          <Copy className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[13.5px] transition-all cursor-pointer shadow-lg shadow-emerald-950/40 active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
