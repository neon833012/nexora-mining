import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  AlertTriangle, 
  Users, 
  Cpu, 
  X, 
  CheckCircle2
} from 'lucide-react';

export type LegalPolicyKey = 'terms' | 'privacy' | 'risk' | 'referral' | 'mining';

interface Props {
  isOpen: boolean;
  initialTab?: LegalPolicyKey;
  onDismiss: () => void;
}

const TABS: { key: LegalPolicyKey; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'terms', label: 'Terms & Conditions', icon: FileText },
  { key: 'privacy', label: 'Privacy Policy', icon: Lock },
  { key: 'risk', label: 'Risk Disclosure', icon: AlertTriangle },
  { key: 'referral', label: 'Referral Policy', icon: Users },
  { key: 'mining', label: 'Mining & Yield Rules', icon: Cpu }
];

export const LegalPolicyModal: React.FC<Props> = ({
  isOpen,
  initialTab = 'terms',
  onDismiss
}) => {
  const [activeTab, setActiveTab] = useState<LegalPolicyKey>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#081220] border border-[#1C3558] shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-scaleUp overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#14263D] flex items-center justify-between bg-gradient-to-r from-[#0A1628] to-[#0D2138]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00F0FF] shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Platform Legal & Governance Protocols</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00F0FF]">
                  v2.6 COMPLIANT
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Institutional computing transparency, user security rights, and digital asset compliance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="w-9 h-9 rounded-xl bg-[#0E1E34] hover:bg-[#1A345A] text-[#94A3B8] hover:text-white border border-[#1C3558] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#050B14] border-b border-[#122237] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'bg-[#091526] text-[#94A3B8] hover:text-white hover:bg-[#0E2038]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-cyan-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-[#CBD5E1] text-xs sm:text-[13px] leading-relaxed custom-scrollbar">

          {/* TAB 1: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-200">
                <strong className="text-white block text-sm font-bold mb-1">
                  Summary of Core Terms
                </strong>
                By accessing or creating an account on Neon Mining, you agree to be bound by these binding terms governing cloud hashrate leases, daily yield accruals, single active plan limits, and 0% internal P2P settlements.
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  1. Account Registration & Member Security
                </h4>
                <p>
                  Each member is assigned a unique immutable User ID (e.g. NEONxxxx) upon registration. Users are responsible for maintaining confidentiality of both their Login Password and their mandatory 6-digit Fund Security PIN. Any transaction verified via the correct 6-digit Fund PIN is deemed authoritatively approved by the account owner.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  2. Single Active Plan Rule & Tier Upgrades
                </h4>
                <p>
                  To maintain fair computational resource distribution across the global cluster, each user account is strictly limited to <strong>one (1) active mining plan at a time</strong>. Multiple concurrent duplicate tiers are not allowed. A user may upgrade to a higher tier plan at any time by paying the difference, which immediately scales their active hashrate power.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  3. Deposits & BEP-20 Custody
                </h4>
                <p>
                  All platform deposits are conducted exclusively in Tether USD (USDT) on the BNB Smart Chain (BEP-20) network. Minimum deposit threshold is 10.00 USDT. Deposits are verified on-chain via public RPC nodes and credited with flat 0% deposit fees. Users must transfer only BEP-20 USDT to the designated official Custody Vault Address.
                </p>
                <p className="mt-2 text-cyan-300 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/30">
                  ⏱️ <strong>3-Minute Hash Submission Rule:</strong> After completing the on-chain transfer, members must submit their 66-character transaction hash within three (3) minutes. Any transaction hash submitted after the 3-minute window will require manual compliance verification and will be subject to up to a 24-hour administrative approval hold.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  4. Withdrawals & Payout Settlement
                </h4>
                <p>
                  Minimum withdrawal is 2.00 USDT. All on-chain withdrawals are subject to a flat 5% network gas fee for automated BSC smart contract dispatch. Payout requests are verified by treasury multi-sig protocols, settled on BNB Smart Chain, and permanently logged with public BscScan transaction reference hashes.
                </p>
                <p className="mt-2 text-purple-300 bg-purple-950/40 p-2.5 rounded-xl border border-purple-500/30 text-[12px] leading-relaxed">
                  ⚡ <strong>Unlimited P2P Member Transfers (0% Fee):</strong> Unlike external on-chain crypto withdrawals which are subject to rate limits and administrative audit holds, internal member-to-member P2P transfers are <strong>100% UNLIMITED</strong>. Members can transfer funds to any registered member User ID as many times per day as they desire with <strong>0% network fee</strong>. There is no daily limit, no cooldown period, and P2P transfers can be performed even when an external crypto withdrawal is locked or pending in audit.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  5. Zero Tolerance for Fraud & Sybil Abuse
                </h4>
                <p>
                  Creating automated bot rings, self-referral commission arbitrage, or exploiting test mock telemetry will result in immediate permanent account suspension and freezing of disputed funds.
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200">
                <strong className="text-white block text-sm font-bold mb-1">
                  Privacy by Design
                </strong>
                Neon Mining implements zero-knowledge access paradigms where personal metadata is kept minimal. We never sell, monetize, or disclose user data to commercial advertising brokers.
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  1. Information We Collect
                </h4>
                <p>
                  We collect strictly the minimum information required for account authorization and cryptographic fund routing: registered Mobile Number, Email Address, public blockchain wallet addresses submitted for withdrawals, and on-chain deposit transaction hashes.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  2. Fund PIN & Cryptographic Protection
                </h4>
                <p>
                  Your 6-digit Fund Security PIN and Login Passwords are encrypted using irreversible salted hashes. Neither platform operators nor sub-administrators can view your plaintext security PIN.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  3. Cloudflare Edge Security
                </h4>
                <p>
                  Platform communications, API endpoints, and ledger queries are routed through Cloudflare's enterprise edge network with TLS 1.3 encryption, DDoS mitigation, and encrypted D1 database storage.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: RISK DISCLOSURE */}
          {activeTab === 'risk' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/40 text-amber-200">
                <strong className="text-white block text-sm font-bold mb-1">
                  Important Risk Warning
                </strong>
                Participation in cloud cryptocurrency hashrates involves operational, technological, and market risks. Historical mining yields are mathematical illustrative models and do not represent a guaranteed financial instrument.
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  1. Hardware & Network Hashrate Volatility
                </h4>
                <p>
                  Global mining difficulty adjustments, ASIC hardware degradation, cooling costs in institutional data centers (Iceland, Norway, USA, Canada), and power grid adjustments can affect net computing outputs.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  2. Blockchain & Digital Asset Volatility
                </h4>
                <p>
                  While Neon Mining operates in Tether USD (USDT) on BEP-20 to minimize coin volatility, underlying crypto assets and smart contract protocols carry systemic market risks. Never allocate funds you cannot afford to risk.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  3. User Responsibility for Destination Addresses
                </h4>
                <p>
                  Transfers on blockchain networks are immutable and irreversible. If a user submits an incorrect BEP-20 destination address during withdrawal, settled funds cannot be reversed or recovered by the platform.
                </p>
              </section>
            </div>
          )}

          {/* TAB 4: REFERRAL & AFFILIATE POLICY */}
          {activeTab === 'referral' && (
            <div className="space-y-5 animate-fadeIn">
              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  1. Instant Credit Settlement
                </h4>
                <p>
                  Referral commissions are credited to your <strong>Referral Income Ledger</strong> (for transparent accounting) and your <strong>Withdrawable Balance</strong> (for immediate cashout or internal P2P transfers).
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  2. Minimum Active Plan Required to Earn Referral Commissions
                </h4>
                <p>
                  To qualify for and receive referral commissions, members must maintain an active mining plan. Holding an active computing contract is mandatory to earn commissions and unlock multi-tier team turnover benefits.
                </p>
              </section>
            </div>
          )}

          {/* TAB 5: MINING & YIELD RULES */}
          {activeTab === 'mining' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-cyan-950/25 border border-cyan-500/40 text-cyan-200">
                <strong className="text-white block text-sm font-bold mb-1">
                  Automated 24-Hour Cycle & Milestone Upgrades
                </strong>
                Neon Mining operates dynamic 24-hour cycles with real-time countdown telemetry, milestone auto-upgrades, and instant interest cashout.
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  1. Daily Mining Cycle & Yield Unlock
                </h4>
                <p>
                  Each mining cycle runs for exactly 24 hours (86,400 seconds). Upon completion of the cycle, your daily earned yield unlocks instantly. You have full freedom to either:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#94A3B8]">
                  <li><strong>Claim to Withdrawable Wallet:</strong> Instantly cash out via BEP-20 or P2P transfer.</li>
                  <li><strong>Compound & Reinvest:</strong> Add yield directly into your active hashing power.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  2. Automatic Tier Upgrade Mechanism
                </h4>
                <p>
                  When continuous daily compounding or manual re-investment causes your Active Mining Power to reach the threshold of the next tier plan (e.g. crossing $20, $60, $120, $250, $500, $1,500, $3,000, etc.), the system <strong>automatically upgrades your plan tier in the database</strong>. Your node begins hashing at the higher daily percentage rate automatically!
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  3. 0% Fee P2P Member Transfers
                </h4>
                <p>
                  Members can transfer funds from their Withdrawable or Deposit balance to any other registered member using their User ID with <strong>flat 0% network fees</strong>. Transferred funds are credited instantly to the recipient's Deposit balance and recorded in both members' ledgers.
                </p>
              </section>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#060D18] border-t border-[#14263D] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cryptographically enforced by Cloudflare D1 Ledger & BEP-20 Protocols.</span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer shadow-lg shadow-cyan-950/40 transition-all"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
};
