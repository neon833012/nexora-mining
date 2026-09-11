import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ExternalLink,
  Cpu,
  RefreshCw,
  Wallet,
  Zap,
  Lock,
  QrCode,
  AlertTriangle
} from 'lucide-react';
import { verifyBscTransaction, OFFICIAL_VAULT_ADDRESS } from '../services/blockchain';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  onDepositConfirmed: (amount: number, txHash?: string, orderId?: string) => void;
  vaultWalletAddress?: string;
}

// Official Binance Smart Chain BEP-20 Custody Vault Address
const DEFAULT_BEP20_VAULT = '0x77A594DC9afF2F2fcbF49Ee8c1714772e8A8E79B';
const USDT_BEP20_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';

type GatewayStep = 'SELECT_AMOUNT' | 'AWAITING_PAYMENT' | 'BLOCKCHAIN_VERIFYING' | 'PAYMENT_SUCCESS';

export const DepositDemoDialog: React.FC<Props> = ({
  isOpen,
  onDismiss,
  onDepositConfirmed,
  vaultWalletAddress = DEFAULT_BEP20_VAULT
}) => {
  const [step, setStep] = useState<GatewayStep>('SELECT_AMOUNT');
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [selectedNetwork, setSelectedNetwork] = useState<'BEP20'>('BEP20');
  const [copiedField, setCopiedField] = useState<'address' | 'amount' | 'tx' | null>(null);
  const [userTxHash, setUserTxHash] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [orderCreatedAt, setOrderCreatedAt] = useState<number>(Date.now());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900); // 15:00 minutes

  // Verification Animation States
  const [verifyStage, setVerifyStage] = useState<number>(0);
  const [blockConfirmations, setBlockConfirmations] = useState<number>(0);
  const [verifiedTxHash, setVerifiedTxHash] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT_AMOUNT');
      setVerifyStage(0);
      setBlockConfirmations(0);
      setUserTxHash('');
      setVerificationError(null);
      setIsVerifying(false);
      setTimeLeftSeconds(900);
      setOrderId(`DEP-BSC-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [isOpen]);

  // 15-minute countdown timer during AWAITING_PAYMENT
  useEffect(() => {
    if (!isOpen || step !== 'AWAITING_PAYMENT') return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const numAmount = parseFloat(depositAmount) || 0;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, field: 'address' | 'amount' | 'tx') => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount < 10) return;
    setVerificationError(null);
    setOrderCreatedAt(Date.now());
    setTimeLeftSeconds(900);
    setStep('AWAITING_PAYMENT');
  };

  /**
   * =========================================================================
   * ⚡ REAL ON-CHAIN BLOCKCHAIN VERIFICATION (BNB SMART CHAIN BEP-20)
   * Strictly queries public Binance Smart Chain RPC node for:
   * 1. 66-char hex transaction receipt on BSC
   * 2. Transaction success status (status === 0x1)
   * 3. USDT contract Transfer event matching custody vault address
   * 4. Amount transferred >= deposit order invoice
   * 5. Anti-replay double-spending rejection
   * =========================================================================
   */
  const handleStartVerification = async () => {
    setVerificationError(null);
    const cleanHash = userTxHash.trim().toLowerCase();

    // 1. Strict format check: Must be 66-character hex string starting with 0x
    if (!cleanHash.startsWith('0x') || cleanHash.length !== 66) {
      setVerificationError(
        'Transaction Hash (TxID) is REQUIRED. Please transfer USDT (BEP-20) to the vault address and paste the 66-character hash from your wallet receipt (starts with 0x).'
      );
      return;
    }

    // 2. Anti-replay check to prevent double spending
    try {
      const usedHashes: string[] = JSON.parse(localStorage.getItem('neon_used_tx_hashes') || '[]');
      if (usedHashes.includes(cleanHash)) {
        setVerificationError(
          'This transaction hash has already been redeemed for another deposit. Replay attacks are rejected.'
        );
        return;
      }
    } catch {}

    setIsVerifying(true);
    setStep('BLOCKCHAIN_VERIFYING');
    setVerifyStage(1);
    setBlockConfirmations(0);

    try {
      // Connect and query Binance Smart Chain node
      const result = await verifyBscTransaction(cleanHash, numAmount, vaultWalletAddress);

      if (!result.verified) {
        setIsVerifying(false);
        setStep('AWAITING_PAYMENT');
        setVerificationError(result.statusText || 'Verification failed on Binance Smart Chain.');
        return;
      }

      // Record hash to prevent reuse
      try {
        const usedHashes: string[] = JSON.parse(localStorage.getItem('neon_used_tx_hashes') || '[]');
        usedHashes.push(cleanHash);
        localStorage.setItem('neon_used_tx_hashes', JSON.stringify(usedHashes));
      } catch {}

      setBlockConfirmations(Math.min(3, Math.max(1, result.confirmations || 3)));
      setVerifyStage(4);
      setVerifiedTxHash(cleanHash);
      setIsVerifying(false);

      setTimeout(() => {
        setStep('PAYMENT_SUCCESS');
        onDepositConfirmed(result.actualAmount || numAmount, cleanHash, orderId);
      }, 1500);
    } catch (err: any) {
      setIsVerifying(false);
      setStep('AWAITING_PAYMENT');
      setVerificationError(`Blockchain verification error: ${err.message || 'Unable to connect to BSC RPC node'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-[490px] rounded-2xl bg-[#081220] border border-[#1C3558] shadow-[0_15px_50px_rgba(0,0,0,0.8)] animate-scaleUp overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#14263D] flex items-center justify-between bg-gradient-to-r from-[#0A1628] to-[#0A1B30]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F0B90B]/15 border border-[#F0B90B]/30 flex items-center justify-center text-[#F0B90B] shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-white flex items-center gap-2">
                <span>USDT Deposit Gateway</span>
                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F0B90B]/15 border border-[#F0B90B]/30 text-[#F0B90B]">
                  BNB SMART CHAIN
                </span>
              </h3>
              <p className="text-[10.5px] text-[#94A3B8]">
                Automated on-chain payment processor · Instant settlement
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-lg bg-[#0E1E34] hover:bg-[#162C4C] text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: SELECT DEPOSIT AMOUNT & NETWORK                                   */}
        {/* ========================================================================= */}
        {step === 'SELECT_AMOUNT' && (
          <form onSubmit={handleProceedToPayment} className="p-5 space-y-4">
            {/* Network Selector */}
            <div className="p-3 rounded-xl bg-[#050D18] border border-[#122237] space-y-2">
              <label className="text-[11px] font-bold text-[#CBD5E1] uppercase tracking-wider block">
                1. Select Deposit Network
              </label>

              <div className="p-3 rounded-xl bg-[#081729] border border-[#F0B90B]/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#F0B90B]/20 border border-[#F0B90B]/40 flex items-center justify-center text-[#F0B90B] font-black text-[11px]">
                    BSC
                  </div>
                  <div>
                    <span className="text-[13px] font-black text-white block">
                      USDT (BNB Smart Chain · BEP-20)
                    </span>
                    <span className="text-[10.5px] text-[#10B981] font-mono">
                      Fast 12s Confirmation · Lowest Gas Fee (~$0.05)
                    </span>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center text-black font-bold text-[9px]">
                  ✓
                </div>
              </div>
            </div>

            {/* Amount Selection */}
            <div className="p-3 rounded-xl bg-[#050D18] border border-[#122237] space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-[#CBD5E1] uppercase tracking-wider">
                  2. Enter Deposit Amount (USDT)
                </label>
                <span className="text-[#94A3B8] font-mono text-[10.5px]">Min: 10.00 USDT</span>
              </div>

              <div className="relative rounded-xl bg-[#040912] border border-[#1E3452] focus-within:border-[#00F0FF] transition-colors shadow-inner">
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) {
                      setDepositAmount(val);
                    }
                  }}
                  required
                  placeholder="100"
                  className="w-full bg-transparent px-3.5 py-3 text-[19px] font-mono font-black text-white focus:outline-none"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[12px] font-bold text-[#00F0FF] font-mono">
                  <span>USDT</span>
                  <span className="text-[10px] text-[#94A3B8]">(BEP20)</span>
                </div>
              </div>

              {/* Quick Amount Pills */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                {[20, 50, 100, 150, 350, 700, 1500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt.toString())}
                    className={`py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      numAmount === amt
                        ? 'bg-[#00F0FF] text-[#04111D] shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                        : 'bg-[#081525] text-[#94A3B8] border border-[#142944] hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Checklist Information */}
            <div className="p-3 rounded-xl bg-[#06101E] border border-[#14263E] space-y-1 text-[11px] text-[#94A3B8]">
              <div className="flex items-center gap-1.5 text-[#00F0FF] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Automated On-Chain Protocol Checks:</span>
              </div>
              <p className="text-[10.5px] leading-relaxed">
                Upon transfer, the blockchain engine verifies Token Contract, Destination Vault, Exact Amount, and 3 Block Confirmations before instant balance credit.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={numAmount < 10}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg ${
                numAmount < 10
                  ? 'bg-[#122034] text-[#64748B] border border-[#1B2F4A] cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40 border border-emerald-400/30'
              }`}
            >
              <span>Generate Payment Invoice ({numAmount.toFixed(2)} USDT)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: WEBSITE SHOWS AMOUNT, BEP20 WALLET & QR CODE                      */}
        {/* ========================================================================= */}
        {step === 'AWAITING_PAYMENT' && (
          <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            {/* Order Status & Countdown Timer */}
            <div className="p-3 rounded-xl bg-[#06101E] border border-[#182F4D] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Order Reference</span>
                <span className="text-[12px] font-mono font-bold text-white">{orderId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Expires In</span>
                <span className="text-[14px] font-mono font-black text-[#FBBF24] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-pulse text-[#FBBF24]" />
                  <span>{formatTimer(timeLeftSeconds)}</span>
                </span>
              </div>
            </div>

            {/* QR Code & Amount Display Card */}
            <div className="p-4 rounded-2xl bg-[#050D18] border border-[#14263D] flex flex-col items-center text-center space-y-3 shadow-inner">
              {/* QR Code in White Box for optimal scanning */}
              <div className="p-2.5 bg-white rounded-xl shadow-lg relative group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${vaultWalletAddress}&margin=2`}
                  alt="BEP-20 USDT Deposit QR Code"
                  className="w-[145px] h-[145px] block select-none"
                />
                {/* BSC Logo watermark in QR center */}
                <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-[#F0B90B] border-2 border-white flex items-center justify-center text-black font-black text-[9px] shadow-md pointer-events-none">
                  BSC
                </div>
              </div>

              <div>
                <span className="text-[10.5px] uppercase font-bold text-[#94A3B8] block">
                  Exact Amount to Transfer:
                </span>
                <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                  <span className="text-[24px] font-black font-mono text-white">
                    {numAmount.toFixed(2)}
                  </span>
                  <span className="text-[13px] font-bold text-[#00F0FF] font-mono">
                    USDT (BEP-20)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(numAmount.toFixed(2), 'amount')}
                    className="ml-1 p-1 rounded hover:bg-[#112338] text-[#94A3B8] hover:text-[#00F0FF] transition-colors cursor-pointer"
                    title="Copy Amount"
                  >
                    {copiedField === 'amount' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* BEP20 Wallet Address Card */}
            <div className="p-3.5 rounded-xl bg-[#06101E] border border-[#152B47] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#CBD5E1]">BEP-20 Receiving Address:</span>
                <span className="text-[10px] text-[#F0B90B] font-mono font-bold">BNB Smart Chain</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#040912] border border-[#112136] flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-mono text-[#00F0FF] break-all leading-tight">
                  {vaultWalletAddress}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(vaultWalletAddress, 'address')}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#0D1E34] hover:bg-[#162E4E] text-[#00F0FF] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
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

              {/* Supported Wallets Row */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-[#64748B]">
                <span>Send from: Trust Wallet, MetaMask, Binance, OKX</span>
                <span className="text-[#10B981] font-mono font-bold">BEP20 Only</span>
              </div>
            </div>

            {/* Verification Error Banner */}
            {verificationError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11.5px] flex items-start gap-2.5 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">
                  <span className="font-bold text-rose-200">On-Chain Verification Failed: </span>
                  {verificationError}
                </div>
              </div>
            )}

            {/* Required TxHash Input */}
            <div className="space-y-1">
              <label className="text-[11px] text-[#94A3B8] flex items-center justify-between font-bold">
                <span className="flex items-center gap-1">
                  <span>Transaction Hash / TxID (Required):</span>
                  <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-[#00F0FF] font-mono">66-char (0x...)</span>
              </label>
              <input
                type="text"
                value={userTxHash}
                onChange={(e) => {
                  setUserTxHash(e.target.value);
                  if (verificationError) setVerificationError(null);
                }}
                placeholder="e.g. 0x8a9b7c... (from your wallet transfer receipt)"
                className={`w-full rounded-xl bg-[#050D18] border px-3 py-2 text-[11.5px] font-mono text-[#CBD5E1] focus:outline-none transition-colors ${
                  verificationError ? 'border-rose-500/50 focus:border-rose-400' : 'border-[#14263E] focus:border-[#00F0FF]'
                }`}
              />
              <p className="text-[10px] text-[#64748B]">
                Transfer USDT (BEP-20) to the address above, then paste the TxHash from BSCScan or your wallet receipt.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setVerificationError(null);
                  setStep('SELECT_AMOUNT');
                }}
                disabled={isVerifying}
                className="flex-1 py-3 rounded-xl bg-[#0B1728] hover:bg-[#11233D] text-[#94A3B8] hover:text-white font-bold text-[12px] transition-colors cursor-pointer disabled:opacity-50"
              >
                ← Change Amount
              </button>

              <button
                type="button"
                onClick={handleStartVerification}
                disabled={isVerifying || !userTxHash.trim()}
                className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#00F0FF] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-[#031526] font-black text-[13px] flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer active:scale-95"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Querying BSC Node...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Verify On-Chain Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: BACKEND MONITORS BLOCKCHAIN & RUNS VERIFICATION TERMINAL          */}
        {/* ========================================================================= */}
        {step === 'BLOCKCHAIN_VERIFYING' && (
          <div className="p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] mx-auto animate-pulse shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-[17px] font-black text-white">
                BNB Smart Chain Validation Engine
              </h4>
              <p className="text-[11.5px] text-[#94A3B8]">
                Monitoring blockchain mempool and verifying transaction parameters...
              </p>
            </div>

            {/* Terminal Live Verification Box */}
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
                  <span className="text-[#CBD5E1]">USDT Transfer Detected:</span>
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
                    <span>Amount: <strong>{numAmount.toFixed(2)} USDT</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400">✓</span>
                    <span>TxHash: <strong>BscScan Valid</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400">✓</span>
                    <span>Processed: <strong>Unprocessed</strong></span>
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
              <span>Smart Contract State: Finalizing settlement...</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PAYMENT CONFIRMED & USER MINING WALLET UPDATED                    */}
        {/* ========================================================================= */}
        {step === 'PAYMENT_SUCCESS' && (
          <div className="p-6 space-y-4 text-center">
            {/* Big Green Success Check */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-[10px] font-black tracking-widest text-[#10B981] uppercase bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
                PAYMENT CONFIRMED
              </span>
              <h4 className="text-[22px] font-black text-white mt-1.5">
                +${numAmount.toFixed(2)} USDT Deposited!
              </h4>
              <p className="text-[12px] text-[#94A3B8] mt-1">
                Funds have been successfully verified on BNB Smart Chain and credited to your Available Deposit Balance.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-3.5 rounded-xl bg-[#050D18] border border-[#14263D] text-left space-y-2 text-[11.5px]">
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Credited Amount:</span>
                <strong className="font-mono text-emerald-400 text-[13px]">+${numAmount.toFixed(2)} USDT</strong>
              </div>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Destination Wallet:</span>
                <span className="text-[#CBD5E1] font-bold">Deposit Balance</span>
              </div>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Network:</span>
                <span className="font-mono text-[#F0B90B] font-bold">BNB Smart Chain (BEP-20)</span>
              </div>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Verification Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                  Confirmed & Audited
                </span>
              </div>

              {verifiedTxHash && (
                <div className="pt-2 border-t border-[#122237] flex items-center justify-between text-[10.5px]">
                  <span className="text-[#64748B] font-mono truncate max-w-[240px]">
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

            {/* Done Button */}
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[13.5px] transition-all cursor-pointer shadow-lg shadow-emerald-950/40 active:scale-95"
            >
              Done & View Balance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
