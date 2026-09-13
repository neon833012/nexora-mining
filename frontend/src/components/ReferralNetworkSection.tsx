import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Sparkles,
  Users,
  Clock,
  Layers
} from 'lucide-react';
import { ReferredUserItem, TeamTurnover } from '../types/mining';

interface Props {
  referralLink?: string;
  isAccountActive?: boolean;
  onCopyReferral: () => void;
  referralIncome?: number;
  referredUsers?: ReferredUserItem[];
  myStake?: number;
  teamTurnover?: TeamTurnover;
}

export const ReferralNetworkSection: React.FC<Props> = ({
  referralLink = 'https://neon-mining.io/ref/NEON-882941',
  isAccountActive = true,
  onCopyReferral,
  referralIncome = 0.0,
  referredUsers = [],
  myStake = 0,
  teamTurnover
}) => {
  const [activeLevelTab, setActiveLevelTab] = useState<'all' | 1 | 2 | 3>('all');

  // 3-Tier Downline Analytics
  const level1Users = referredUsers.filter((u) => (u.level || 1) === 1);
  const level2Users = referredUsers.filter((u) => u.level === 2);
  const level3Users = referredUsers.filter((u) => u.level === 3);

  const l1Turnover = level1Users.reduce((sum, u) => sum + (u.planAmount || 0), 0);
  const l2Turnover = level2Users.reduce((sum, u) => sum + (u.planAmount || 0), 0);
  const l3Turnover = level3Users.reduce((sum, u) => sum + (u.planAmount || 0), 0);
  const totalTurnover = l1Turnover + l2Turnover + l3Turnover;

  const l1Earned = level1Users.reduce((sum, u) => sum + (u.commissionEarned || 0), 0);
  const l2Earned = level2Users.reduce((sum, u) => sum + (u.commissionEarned || 0), 0);
  const l3Earned = level3Users.reduce((sum, u) => sum + (u.commissionEarned || 0), 0);
  const totalCommissionEarned = l1Earned + l2Earned + l3Earned;

  // Filtered members directly by selected tab (Total Team or Level 1 / 2 / 3)
  const filteredUsers = referredUsers.filter((u) => {
    const userLvl = u.level || 1;
    if (activeLevelTab !== 'all' && userLvl !== activeLevelTab) return false;
    return true;
  });

  return (
    <section className="w-full px-3.5 lg:px-0 space-y-6">
      {/* Header with Referral Balance KPI Badge */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[10.5px] font-bold text-[#00F0FF] uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Affiliate Protocol · 3 Tiers</span>
          </div>
          <h2 className="text-[22px] lg:text-[28px] font-bold text-[#F8FAFC]">
            Referral Network & Downline Hub
          </h2>
          <p className="mt-0.5 text-[12px] lg:text-[14px] text-[#94A3B8] max-w-2xl leading-relaxed">
            Share your unique referral link to unlock 3-tier perpetual commission: 10% on direct sponsors, 5% on team referrals, and 2% on network expansion.
          </p>
        </div>

      </div>

      {/* ── CARD 1: AFFILIATE LINK & ONE-TAP SHARING ── */}
      <div className="rounded-2xl bg-[#0B1424] border border-[#192A44] p-4 lg:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#94A3B8] uppercase block">
              Your Personal Affiliate Link
            </span>
            <span className="text-[11.5px] text-[#64748B]">
              Direct registrations through this link are automatically assigned to your Level 1 downline.
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold border self-start sm:self-auto ${
              isAccountActive
                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAccountActive ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'}`} />
            {isAccountActive ? 'ACTIVE & READY' : 'REQUIRES PLAN'}
          </span>
        </div>

        {/* Monospace Link Box & Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="flex-1 rounded-xl bg-[#060D18] border border-[#16273F] px-4 py-3 flex items-center justify-between overflow-hidden shadow-inner">
            <span className="text-[12.5px] font-mono text-[#00F0FF] truncate select-all">
              {isAccountActive ? referralLink : 'REFERRAL INACTIVE · BUY PLAN TO UNLOCK'}
            </span>
          </div>
          <button
            type="button"
            onClick={onCopyReferral}
            disabled={!isAccountActive}
            className={`px-6 py-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
              isAccountActive
                ? 'bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021020] hover:brightness-110 cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-black'
                : 'bg-[#152236] text-[#64748B] border border-[#1F304B] cursor-not-allowed'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>{isAccountActive ? 'Copy Referral Link' : 'Locked'}</span>
          </button>
        </div>

        {/* One-Tap Direct Social Share Buttons */}
        <div className="pt-2 border-t border-[#132338]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider">
              Share link directly via:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:items-center">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🚀 Join Neon Mining and start earning daily USDT rewards!\n\nUse my referral link to sign up:\n${referralLink}\n\n💎 Plans from $20 — automated 24H cloud mining!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#064E3B]/30 border border-[#25D366]/40 hover:border-[#25D366] hover:bg-[#064E3B]/60 transition-all cursor-pointer text-[#25D366] text-[11px] font-bold active:scale-95 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🚀 Join Neon Mining — earn daily USDT rewards with automated cloud mining! Use my referral link:')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A2744]/30 border border-[#229ED9]/40 hover:border-[#229ED9] hover:bg-[#0A2744]/60 transition-all cursor-pointer text-[#229ED9] text-[11px] font-bold active:scale-95 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#229ED9">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span>Telegram</span>
              </a>

              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('🚀 Join Neon Mining and earn daily USDT rewards with automated cloud mining! Use my referral link:')}&url=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F172A] border border-[#38BDF8]/40 hover:border-[#38BDF8] hover:bg-[#0F172A]/80 transition-all cursor-pointer text-[#38BDF8] text-[11px] font-bold active:scale-95 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Twitter / X</span>
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1877F2]/15 border border-[#1877F2]/40 hover:border-[#1877F2] hover:bg-[#1877F2]/30 transition-all cursor-pointer text-[#38BDF8] text-[11px] font-bold active:scale-95 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </a>

              {/* Instagram */}
              <button
                type="button"
                onClick={onCopyReferral}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3B0764]/30 border border-[#E1306C]/40 hover:border-[#E1306C] hover:bg-[#3B0764]/60 transition-all cursor-pointer text-[#E1306C] text-[11px] font-bold active:scale-95 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="url(#ig-grad-clean)">
                  <defs>
                    <linearGradient id="ig-grad-clean" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFDC80" />
                      <stop offset="30%" stopColor="#F77737" />
                      <stop offset="60%" stopColor="#E1306C" />
                      <stop offset="100%" stopColor="#833AB4" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span style={{background:'linear-gradient(45deg,#F77737,#E1306C,#833AB4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Instagram</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 2: MY STAKE & TEAM TURNOVER PORTFOLIO ── */}
      {(() => {
        const effectiveMyStake = Number(myStake) || (teamTurnover?.personalStaked ? Number(teamTurnover.personalStaked) : 0);
        const effectiveTeamStake = l1Turnover + l2Turnover + l3Turnover;
        const combinedTotalTurnover = effectiveMyStake + effectiveTeamStake;
        const currentBoostRate = (effectiveMyStake + l1Turnover) >= 2500 ? 2.5 : (effectiveMyStake + l1Turnover) >= 1000 ? 1.5 : 1.0;
        const nextTarget = (effectiveMyStake + l1Turnover) >= 1000 ? 2500 : 1000;
        const progressPercent = Math.min(100, Math.floor(((effectiveMyStake + l1Turnover) / nextTarget) * 100));

        return (
          <div className="rounded-2xl bg-gradient-to-r from-[#071324] via-[#0B1C33] to-[#08152A] border border-[#00F0FF]/30 p-4 lg:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#142642] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] lg:text-[18px] font-black text-white">
                    Staking & Team Turnover Analytics
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    Personal staked power combined with multi-tier downline team volume
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-mono text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded-full border border-[#10B981]/30 font-bold">
                  Boost Rate: {currentBoostRate.toFixed(1)}% Daily
                </span>
              </div>
            </div>

            {/* 4 KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: My Personal Stake */}
              <div className="p-3.5 rounded-xl bg-[#050C18] border border-[#142338]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                  My Stake
                </span>
                <div className="text-[20px] font-black text-[#00F0FF] font-mono mt-1">
                  ${effectiveMyStake.toFixed(2)}
                </div>
                <span className="text-[9.5px] text-[#64748B]">Active Personal Node</span>
              </div>

              {/* Card 2: Team Downline Stake */}
              <div className="p-3.5 rounded-xl bg-[#050C18] border border-[#142338]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                  Team Stake
                </span>
                <div className="text-[20px] font-black text-[#38BDF8] font-mono mt-1">
                  ${effectiveTeamStake.toFixed(2)}
                </div>
                <span className="text-[9.5px] text-[#64748B]">L1: ${l1Turnover.toFixed(0)} · L2: ${l2Turnover.toFixed(0)} · L3: ${l3Turnover.toFixed(0)}</span>
              </div>

              {/* Card 3: Total Combined Turnover */}
              <div className="p-3.5 rounded-xl bg-[#050C18] border border-[#142338]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                  Total Turnover
                </span>
                <div className="text-[20px] font-black text-white font-mono mt-1">
                  ${combinedTotalTurnover.toFixed(2)}
                </div>
                <span className="text-[9.5px] text-[#10B981]">My Stake + Team Stake</span>
              </div>

              {/* Card 4: Total Referral Income Earned */}
              <div className="p-3.5 rounded-xl bg-[#050C18] border border-[#142338]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                  Referral Income
                </span>
                <div className="text-[20px] font-black text-[#10B981] font-mono mt-1">
                  +${(referralIncome || totalCommissionEarned).toFixed(2)}
                </div>
                <span className="text-[9.5px] text-[#94A3B8]">Paid to Wallet</span>
              </div>
            </div>

            {/* Turnover Boost Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94A3B8]">Turnover Boost Progress:</span>
                <span className="font-mono font-bold text-[#00F0FF]">
                  ${(effectiveMyStake + l1Turnover).toFixed(0)} / ${nextTarget} USD ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#050B14] border border-[#142338] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0284C7] via-[#00F0FF] to-[#10B981] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 3-LEVEL DOWNLINE TEAM HIERARCHY HUB ── */}
      <div className="mt-6 rounded-[16px] lg:rounded-[24px] bg-[#0C1424] border border-[#1B2A42] p-4 lg:p-7 shadow-xl space-y-5">
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1A2940] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] lg:text-[20px] font-bold text-white flex items-center gap-2">
                Downline Team Hierarchy
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  3 Levels Active
                </span>
              </h3>
              <p className="text-[11.5px] text-[#94A3B8]">
                Real-time tracking of direct and multi-tier affiliate team turnover & commissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
            <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Auto-synced with on-chain nodes</span>
          </div>
        </div>

        {/* 4 Clickable Level Selector Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Button 1: Total Team */}
          <button
            type="button"
            onClick={() => setActiveLevelTab('all')}
            className={`rounded-xl p-3.5 space-y-1 text-left transition-all cursor-pointer active:scale-95 border ${
              activeLevelTab === 'all'
                ? 'bg-[#0E2038] border-[#00F0FF] shadow-[0_0_18px_rgba(0,240,255,0.25)] ring-2 ring-[#00F0FF]/60'
                : 'bg-[#081120] border-[#16273F] hover:border-[#00F0FF]/40 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Total Team</span>
              <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
            </div>
            <div className="text-[20px] lg:text-[24px] font-black text-white font-mono">
              {referredUsers.length} <span className="text-[11px] font-normal text-[#64748B]">members</span>
            </div>
            <div className="text-[10.5px] text-[#94A3B8] flex justify-between pt-1 border-t border-[#122034]">
              <span>Volume: ${totalTurnover.toFixed(0)}</span>
              <span className="text-[#10B981] font-bold">+${totalCommissionEarned.toFixed(2)}</span>
            </div>
          </button>

          {/* Button 2: Level 1 Direct */}
          <button
            type="button"
            onClick={() => setActiveLevelTab(1)}
            className={`rounded-xl p-3.5 space-y-1 text-left transition-all cursor-pointer active:scale-95 border ${
              activeLevelTab === 1
                ? 'bg-[#0E2238] border-[#00F0FF] shadow-[0_0_18px_rgba(0,240,255,0.25)] ring-2 ring-[#00F0FF]/60'
                : 'bg-[#071626] border-[#00F0FF]/30 hover:border-[#00F0FF]/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#00F0FF]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Level 1 (Direct)</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00F0FF]/15">10%</span>
            </div>
            <div className="text-[20px] lg:text-[24px] font-black text-[#00F0FF] font-mono">
              {level1Users.length} <span className="text-[11px] font-normal text-[#64748B]">users</span>
            </div>
            <div className="text-[10.5px] text-[#94A3B8] flex justify-between pt-1 border-t border-[#0F2A44]">
              <span>Vol: ${l1Turnover.toFixed(0)}</span>
              <span className="text-[#00F0FF] font-bold">+${l1Earned.toFixed(2)}</span>
            </div>
          </button>

          {/* Button 3: Level 2 Secondary */}
          <button
            type="button"
            onClick={() => setActiveLevelTab(2)}
            className={`rounded-xl p-3.5 space-y-1 text-left transition-all cursor-pointer active:scale-95 border ${
              activeLevelTab === 2
                ? 'bg-[#0A223B] border-[#38BDF8] shadow-[0_0_18px_rgba(56,189,248,0.25)] ring-2 ring-[#38BDF8]/60'
                : 'bg-[#071424] border-[#38BDF8]/30 hover:border-[#38BDF8]/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#38BDF8]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Level 2 (Team)</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#38BDF8]/15">5%</span>
            </div>
            <div className="text-[20px] lg:text-[24px] font-black text-[#38BDF8] font-mono">
              {level2Users.length} <span className="text-[11px] font-normal text-[#64748B]">users</span>
            </div>
            <div className="text-[10.5px] text-[#94A3B8] flex justify-between pt-1 border-t border-[#0F2840]">
              <span>Vol: ${l2Turnover.toFixed(0)}</span>
              <span className="text-[#38BDF8] font-bold">+${l2Earned.toFixed(2)}</span>
            </div>
          </button>

          {/* Button 4: Level 3 Tertiary */}
          <button
            type="button"
            onClick={() => setActiveLevelTab(3)}
            className={`rounded-xl p-3.5 space-y-1 text-left transition-all cursor-pointer active:scale-95 border ${
              activeLevelTab === 3
                ? 'bg-[#221B0A] border-[#FBBF24] shadow-[0_0_18px_rgba(251,191,36,0.25)] ring-2 ring-[#FBBF24]/60'
                : 'bg-[#141208] border-[#FBBF24]/30 hover:border-[#FBBF24]/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#FBBF24]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Level 3 (Network)</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FBBF24]/15">2%</span>
            </div>
            <div className="text-[20px] lg:text-[24px] font-black text-[#FBBF24] font-mono">
              {level3Users.length} <span className="text-[11px] font-normal text-[#64748B]">users</span>
            </div>
            <div className="text-[10.5px] text-[#94A3B8] flex justify-between pt-1 border-t border-[#292210]">
              <span>Vol: ${l3Turnover.toFixed(0)}</span>
              <span className="text-[#FBBF24] font-bold">+${l3Earned.toFixed(2)}</span>
            </div>
          </button>
        </div>

        {/* Downline Members Directory */}
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="py-10 text-center rounded-xl bg-[#081120] border border-[#16273F] space-y-2">
              <Users className="w-8 h-8 text-[#334155] mx-auto" />
              <p className="text-[13px] font-bold text-[#94A3B8]">No downline members found</p>
              <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                No members currently registered under {activeLevelTab === 'all' ? 'any level' : `Level ${activeLevelTab}`}. Share your link to start growing your team!
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-[#172840]">
                <table className="w-full text-left text-[11.5px]">
                  <thead className="bg-[#07111E] text-[#64748B] uppercase tracking-wider text-[10px] font-bold border-b border-[#172840]">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Tier / Level</th>
                      <th className="py-3 px-4">Invited By (Sponsor)</th>
                      <th className="py-3 px-4">Mining Plan</th>
                      <th className="py-3 px-4 text-right">Your Commission</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132238] bg-[#091526]">
                    {filteredUsers.map((user, idx) => {
                      const lvl = user.level || 1;
                      const levelRate = lvl === 1 ? '10%' : lvl === 2 ? '5%' : '2%';
                      const levelBadgeClass =
                        lvl === 1
                          ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30'
                          : lvl === 2
                          ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'
                          : 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30';

                      return (
                        <tr key={user.id + '_' + idx} className="hover:bg-[#0C1A30] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#10243C] border border-[#1E3A5F] flex items-center justify-center font-bold text-[11px] text-[#00F0FF]">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-white text-[12px] font-mono">{user.id}</div>
                                {user.name && user.name.toUpperCase() !== user.id.toUpperCase() && !user.name.toUpperCase().startsWith('NEON') && user.name.toLowerCase() !== 'neon member' && (
                                  <div className="text-[10px] text-[#94A3B8]">{user.name}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelBadgeClass}`}>
                              Level {lvl} · {levelRate}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-[#94A3B8]">{user.invitedBy || 'Direct'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{user.planName}</div>
                            <div className="text-[10px] text-[#64748B] font-mono">${user.planAmount} USDT</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-bold text-[#10B981] text-[12.5px]">
                              +${user.commissionEarned.toFixed(2)}
                            </span>
                            <div className="text-[9.5px] text-[#64748B]">USDT</div>
                          </td>
                          <td className="py-3 px-4 text-[#94A3B8] font-mono text-[11px]">
                            {user.registeredAt ? user.registeredAt.split(' ')[0] : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2.5">
                {filteredUsers.map((user, idx) => {
                  const lvl = user.level || 1;
                  const levelRate = lvl === 1 ? '10%' : lvl === 2 ? '5%' : '2%';
                  const levelBadgeClass =
                    lvl === 1
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30'
                      : lvl === 2
                      ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'
                      : 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30';

                  return (
                    <div
                      key={'m_' + user.id + '_' + idx}
                      className="p-3 rounded-xl bg-[#091526] border border-[#172840] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#10243C] border border-[#1E3A5F] flex items-center justify-center font-bold text-[10px] text-[#00F0FF]">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-[12px] font-mono">{user.id}</div>
                            {user.name && user.name.toUpperCase() !== user.id.toUpperCase() && !user.name.toUpperCase().startsWith('NEON') && user.name.toLowerCase() !== 'neon member' && (
                              <div className="text-[9.5px] text-[#94A3B8]">{user.name}</div>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${levelBadgeClass}`}>
                          Level {lvl} · {levelRate}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#132238]">
                        <div>
                          <span className="text-[#64748B] block text-[9.5px] uppercase">Plan Purchased:</span>
                          <span className="font-medium text-white">{user.planName} (${user.planAmount})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[#64748B] block text-[9.5px] uppercase">Your Commission:</span>
                          <span className="font-mono font-bold text-[#10B981]">+${user.commissionEarned.toFixed(2)} USDT</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1 border-t border-[#132238]">
                        <span>Sponsor: <strong className="text-[#94A3B8]">{user.invitedBy || 'Direct'}</strong></span>
                        <span>Date: {user.registeredAt ? user.registeredAt.split(' ')[0] : '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>


      </div>

    </section>
  );
};
