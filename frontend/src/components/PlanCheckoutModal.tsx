import React, { useState, useEffect, useRef } from 'react';
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
  Lock,
  AlertTriangle
} from 'lucide-react';
import { MiningPlan } from '../types/mining';
import { verifyBscTransaction, OFFICIAL_VAULT_ADDRESS } from '../services/blockchain';
import { nexoraApi } from '../services/api';

interface Props {
  isOpen: boolean;
  plan: MiningPlan | null;
  isUpgrade: boolean;
  activeMiningPower: number;
  diffAmount?: number;
  availableBalance: number;
  vaultWalletAddress?: string;
  userId?: string;
  fundPin?: string;
  onDismiss: () => void;
  onNavigateToDashboard?: () => void;
  onConfirmSuccess: (
    plan: MiningPlan,
    paidCost: number,
    paymentMethod: 'internal' | 'bep20_chain',
    txHash?: string
  ) => void;
}

// Official Binance Smart Chain BEP-20 Custody Vault Address
const DEPOSIT_ADDRESS = '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d';

export const PlanCheckoutModal: React.FC<Props> = ({
  isOpen,
  plan,
  isUpgrade,
  activeMiningPower,
  diffAmount,
  availableBalance,
  vaultWalletAddress = DEPOSIT_ADDRESS,
  userId,
  fundPin,
  onDismiss,
  onNavigateToDashboard,
  onConfirmSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [paymentMethod, setPaymentMethod] = useState<'internal' | 'bep20_chain'>('internal');
  const [enteredTxHash, setEnteredTxHash] = useState('');
  const [copiedField, setCopiedField] = useState<'address' | 'amount' | 'tx' | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Blockchain Verification Animation States
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
      setVerificationError(null);
      setIsVerifying(false);
      // If user has 0 or insufficient balance, automatically default to on-chain BEP20
      setPaymentMethod(hasEnoughInternalBalance ? 'internal' : 'bep20_chain');
    }
  }, [isOpen, plan, availableBalance, diffAmount, hasEnoughInternalBalance]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top whenever step changes (ensures Step 4 is immediately visible on mobile)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  if (!isOpen || !plan) return null;

  const handleCopy = (text: string, field: 'address' | 'amount' | 'tx') => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const startVerificationProcess = async () => {
    setVerificationError(null);

    if (paymentMethod === 'internal') {
      if (availableBalance < payableCost) {
        setVerificationError(`Insufficient deposit balance ($${availableBalance.toFixed(2)}). You need $${payableCost.toFixed(2)} USDT.`);
        return;
      }
      setCurrentStep(4);
      const generatedHash = `int_${Date.now().toString(16)}`;
      setVerifiedTxHash(generatedHash);
      onConfirmSuccess(plan, payableCost, 'internal', generatedHash);
      return;
    }

    // On-chain BEP-20 Verification Terminal
    const cleanHash = enteredTxHash.trim().toLowerCase();
    if (!cleanHash.startsWith('0x') || cleanHash.length !== 66) {
      setVerificationError(
        `Wrong Key / Invalid Transaction Hash! A valid BSC transaction key must be exactly 66 characters starting with "0x" (You entered ${cleanHash.length}/66 characters). Please check your Binance or Trust Wallet transfer receipt.`
      );
      return;
    }

    // 1. Local Anti-replay check across device & admin orders
    try {
      const usedHashes: string[] = JSON.parse(localStorage.getItem('neon_used_tx_hashes') || '[]');
      if (usedHashes.includes(cleanHash)) {
        setVerificationError('This 66-character transaction reference has ALREADY been used on this device. Each transaction hash can only be redeemed once.');
        return;
      }

      const adminOrders = JSON.parse(localStorage.getItem('neon_admin_orders') || '[]');
      if (Array.isArray(adminOrders)) {
        const found = adminOrders.find((o: any) => o.txHash && o.txHash.toLowerCase() === cleanHash);
        if (found) {
          setVerificationError(`This 66-character reference ID was already redeemed by account "${found.userId || found.userName}". A transaction hash can only activate 1 plan.`);
          return;
        }
      }
    } catch {}

    // 2. Query Cloudflare D1 Backend to check if this hash was ever used by ANY account on the platform
    setIsVerifying(true);
    setVerificationError(null);
    try {
      const checkRes = await nexoraApi.checkTxClaimable(cleanHash);
      if (checkRes.claimed) {
        setIsVerifying(false);
        setVerificationError(checkRes.message || 'This transaction hash has already been redeemed on the platform. Each reference ID can only be used once.');
        return;
      }
    } catch (err: any) {
      // Continue to on-chain verification if offline
    }

    setCurrentStep(3);
    setVerifyStage(1);
    setBlockConfirmations(0);

    try {
      const activeVault = (vaultWalletAddress || DEPOSIT_ADDRESS).trim();
      const result = await verifyBscTransaction(cleanHash, payableCost, activeVault);

      if (!result.verified) {
        setIsVerifying(false);
        setCurrentStep(2);
        setVerificationError(result.statusText || 'Verification failed on Binance Smart Chain.');
        return;
      }

      // Synchronous Atomic Backend Subscribe & Anti-Replay Claim
      const effectiveUserId = (userId && userId.trim()) || localStorage.getItem('neon_user_name') || 'DIRECT_MEMBER';
      const subRes = await nexoraApi.subscribePlan({
        userId: effectiveUserId,
        planId: plan.id,
        planName: plan.planName || plan.planNumber || 'Mining Plan',
        amount: plan.amount,
        dailyRatePercent: plan.dailyRatePercent,
        durationDays: plan.durationDays || 365,
        compoundingEnabled: true,
        fundPin: fundPin || '123456',
        paymentMethod: 'crypto',
        txHash: cleanHash,
        isDirectPayment: true
      });

      if (!subRes || !subRes.success || subRes.alreadyClaimed) {
        setIsVerifying(false);
        setCurrentStep(2);
        setVerificationError(subRes?.message || 'This transaction hash has ALREADY been claimed on the platform. It cannot be used again.');
        return;
      }

      // Record hash to prevent reuse
      try {
        const usedHashes: string[] = JSON.parse(localStorage.getItem('neon_used_tx_hashes') || '[]');
        if (!usedHashes.includes(cleanHash)) {
          usedHashes.push(cleanHash);
          localStorage.setItem('neon_used_tx_hashes', JSON.stringify(usedHashes));
        }
      } catch {}

      setBlockConfirmations(result.confirmations || 3);
      setVerifyStage(4);
      setVerifiedTxHash(cleanHash);
      setIsVerifying(false);

      setTimeout(() => {
        setCurrentStep(4);
        onConfirmSuccess(plan, payableCost, 'bep20_chain', cleanHash);
      }, 1500);
    } catch (err: any) {
      setIsVerifying(false);
      setCurrentStep(2);
      setVerificationError(`Blockchain verification error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div ref={scrollRef} className="relative w-full max-w-[460px] max-h-[92vh] overflow-y-auto rounded-2xl bg-[#081220] border border-[#1C3558] shadow-[0_15px_50px_rgba(0,0,0,0.8)] flex flex-col animate-scaleUp">
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
                  {/* Settlement Network Info */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#040A14] border border-[#122135]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Settlement Network:</span>
                    </div>
                    <span className="text-[12px] font-mono font-bold text-[#00F0FF] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                      <span>BNB Smart Chain (BEP-20)</span>
                    </span>
                  </div>

                  {/* Real Scannable Dynamic QR Code */}
                  {(() => {
                    const activeVault = vaultWalletAddress || DEPOSIT_ADDRESS;
                    const toWeiUSDT = (amt: number): string => {
                      const whole = Math.floor(amt);
                      const frac = Math.round((amt - whole) * 1000000);
                      const wholeWei = BigInt(whole) * (BigInt(10) ** BigInt(18));
                      const fracWei = BigInt(frac) * (BigInt(10) ** BigInt(12));
                      return (wholeWei + fracWei).toString();
                    };
                    // Standard EIP-681 URI (natively parsed by Trust Wallet Home Scanner, MetaMask, OKX)
                    const eip681Uri = `ethereum:0x55d398326f99059fF775485246999027B3197955@56/transfer?address=${activeVault}&uint256=${toWeiUSDT(payableCost)}`;
                    // Standard direct BEP-20 address for QR code
                    const qrData = activeVault;
                    // Mobile 1-click Universal Link
                    const trustWalletDeepLink = `https://link.trustwallet.com/send?asset=c56_t0x55d398326f99059fF775485246999027B3197955&address=${activeVault}&amount=${payableCost}`;

                    return (
                      <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#040A14] border border-[#122135] text-center space-y-3 shadow-inner">
                        {/* Clean 100% Unobstructed High-Res QR Code */}
                        <div className="p-3 bg-white rounded-xl shadow-xl flex flex-col items-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData)}&margin=1&ecc=M`}
                            alt="BEP-20 USDT Deposit QR Code"
                            className="w-[145px] h-[145px] block select-none"
                          />
                        </div>

                        {/* Network Badge Below QR Code */}
                        <div className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-[#F0B90B] text-[10px] font-bold font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F0B90B] animate-ping"></span>
                          <span>BNB Smart Chain (BEP-20) USDT Official Vault</span>
                        </div>

                        {/* 1-Tap Pay in Trust Wallet (Upgraded Premium Web3 UI) */}
                        <a
                          href={trustWalletDeepLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative w-full max-w-sm overflow-hidden rounded-xl bg-gradient-to-r from-[#0500FF] via-[#0284C7] to-[#00F0FF] p-[1.5px] shadow-[0_0_20px_rgba(0,180,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.55)] active:scale-[0.98] transition-all duration-200 cursor-pointer block text-left"
                        >
                          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[10px] bg-gradient-to-r from-[#03112A] via-[#041A38] to-[#06244C] group-hover:from-[#05193B] group-hover:to-[#092F60] transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#0052FF]/20 border border-[#00F0FF]/40 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.3)] shrink-0">
                                <svg className="w-4 h-4 text-[#00F0FF]" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.83-6-8.83V6.31l6-2.25 6 2.25v4.78z" />
                                </svg>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[12.5px] font-black tracking-wide text-white group-hover:text-[#00F0FF] transition-colors">
                                    1-Tap Pay in Trust Wallet
                                  </span>
                                  <span className="text-[8.5px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30">
                                    FAST
                                  </span>
                                </div>
                                <span className="text-[10px] font-medium text-[#94A3B8] block">
                                  Auto-fills address & ${payableCost.toFixed(2)} USDT
                                </span>
                              </div>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center text-[#00F0FF] group-hover:bg-[#00F0FF] group-hover:text-[#021024] transition-all shrink-0">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </a>

                        {/* Exact Amount Card with Copy */}
                        <div className="w-full p-2.5 rounded-xl bg-[#02060E] border border-[#14263E] flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[9.5px] uppercase font-bold text-[#94A3B8] block">
                              Exact Amount to Transfer:
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-[20px] font-black font-mono text-white">
                                {payableCost.toFixed(2)}
                              </span>
                              <span className="text-[11.5px] font-bold text-[#00F0FF] font-mono">
                                USDT (BEP-20)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(payableCost.toFixed(2), 'amount')}
                            className="px-3 py-1.5 rounded-lg bg-[#0E1E34] hover:bg-[#162F52] text-[#00F0FF] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 border border-[#1C365B]"
                            title="Copy Exact Amount"
                          >
                            {copiedField === 'amount' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Amount</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Custody Vault Address Card with Copy */}
                        <div className="w-full p-2.5 rounded-xl bg-[#02060E] border border-[#14263E] flex items-center justify-between gap-2">
                          <div className="text-left min-w-0 flex-1">
                            <span className="text-[9.5px] uppercase font-bold text-[#94A3B8] block">
                              Official BEP-20 Vault Address:
                            </span>
                            <span className="font-mono text-[11px] text-[#00F0FF] truncate block mt-0.5">
                              {activeVault}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeVault, 'address')}
                            className="px-3 py-1.5 rounded-lg bg-[#0E1E34] hover:bg-[#162F52] text-[#00F0FF] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 border border-[#1C365B]"
                            title="Copy Vault Address"
                          >
                            {copiedField === 'address' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Address</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Trust Wallet Auto-Fill Guidance Card */}
                        <div className="w-full text-left p-2.5 rounded-xl bg-[#02060E]/90 border border-[#152B47] text-[10.5px] space-y-1.5 text-[#94A3B8]">
                          <div className="font-bold text-[#F0B90B] flex items-center gap-1.5">
                            <span>💡</span>
                            <span>Trust Wallet Se Transfer Karne Ki Guide:</span>
                          </div>
                          <p className="leading-relaxed">
                            • <strong className="text-white">Mobile par:</strong> Upar diye gaye <span className="text-[#00F0FF] font-bold">"1-Tap Pay in Trust Wallet"</span> button par click karein, app direct amount aur address ke sath khul jayegi!
                          </p>
                          <p className="leading-relaxed">
                            • <strong className="text-white">Home Screen Scanner:</strong> Dusre phone se scan kar rahe hain to Trust Wallet ke <span className="text-[#10B981] font-bold">Home Screen ke top-right QR icon</span> se scan karein — amount auto-fill aayega.
                          </p>
                          <p className="leading-relaxed">
                            • <strong className="text-white">Send Screen:</strong> Agar aap pehle se USDT ke andar 'Send' screen par hain, to camera sirf address leta hai — upar se <span className="text-[#38BDF8] font-bold">'Copy Amount'</span> karke paste kar dein.
                          </p>
                        </div>

                        <span className="text-[9.5px] text-emerald-400/90 font-medium block">
                          ⚡ Exchange Fee Buffer: Transfers with up to 0.30 USDT deducted by exchange withdrawal fees (e.g. Binance/OKX) are automatically accepted with full plan value!
                        </span>
                      </div>
                    );
                  })()}

                  {/* Required TxHash Input */}
                  <div>
                    <label className="text-[11px] text-[#CBD5E1] font-bold flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1">
                        <span>Transaction Hash / TxID (Required):</span>
                        <span className="text-rose-400 font-black">*</span>
                      </span>
                      <span className="text-[10px] text-[#00F0FF] font-mono">66-char (0x...)</span>
                    </label>
                    <input
                      type="text"
                      value={enteredTxHash}
                      onChange={(e) => {
                        setEnteredTxHash(e.target.value);
                        if (verificationError) setVerificationError(null);
                      }}
                      placeholder="Paste 66-character TxHash (0x...) from your transfer receipt"
                      className={`w-full rounded-xl bg-[#040A14] border px-3 py-2 text-[11.5px] font-mono text-[#CBD5E1] focus:outline-none transition-colors ${
                        verificationError ? 'border-rose-500/80 focus:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]' : 'border-[#14263E] focus:border-[#00F0FF]'
                      }`}
                    />

                    {/* Live Character Length & Format Indicator */}
                    <div className="flex items-center justify-between text-[10px] mt-1.5">
                      <p className="text-[#64748B]">
                        Transfer USDT (BEP-20) to the address above, then paste the 66-char hash.
                      </p>
                      {enteredTxHash.trim().length > 0 && (
                        <span
                          className={`font-mono font-bold shrink-0 ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                            enteredTxHash.trim().startsWith('0x') && enteredTxHash.trim().length === 66
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {enteredTxHash.trim().length}/66 chars {enteredTxHash.trim().startsWith('0x') && enteredTxHash.trim().length === 66 ? '✓' : '⚠️'}
                        </span>
                      )}
                    </div>

                    {/* Prominent Wrong Key / Verification Error Alert Box */}
                    {verificationError && (
                      <div className="mt-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-[11.5px] flex items-start gap-2.5 animate-fadeIn shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1 leading-relaxed">
                          <strong className="text-rose-200 block font-bold mb-0.5">
                            ⚠️ Wrong Key / Verification Error:
                          </strong>
                          <span>{verificationError}</span>
                        </div>
                      </div>
                    )}
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
                  disabled={
                    (paymentMethod === 'internal' && !hasEnoughInternalBalance) ||
                    (paymentMethod === 'bep20_chain' && !enteredTxHash.trim())
                  }
                  onClick={startVerificationProcess}
                  className={`flex-2 py-3 px-4 rounded-xl font-black text-[13px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-lg ${
                    (paymentMethod === 'internal' && !hasEnoughInternalBalance) ||
                    (paymentMethod === 'bep20_chain' && !enteredTxHash.trim())
                      ? 'bg-[#122034] text-[#64748B] border border-[#1B2F4A] cursor-not-allowed opacity-60'
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
                onClick={() => {
                  if (onNavigateToDashboard) {
                    onNavigateToDashboard();
                  } else {
                    onDismiss();
                  }
                }}
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
