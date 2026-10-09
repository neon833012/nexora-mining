import React, { useState } from 'react';
import {
  Zap,
  Layers,
  Sparkles,
  CheckCircle2,
  Info,
  Crown,
  Award,
  TrendingUp,
  Coins,
  ArrowUpRight,
  Repeat,
  Wallet
} from 'lucide-react';
import { ReferredUserItem } from '../types/mining';

interface Props {
  referredUsers?: ReferredUserItem[];
  myStake?: number;
  userName?: string;
  orcBalance?: number;
  totalOrcIncome?: number;
  onSendOrcToWallet?: () => void;
  onReinvestOrcToPlan?: () => void;
}

// 10-Tier ORC Rate Schedule
export const ORC_TIER_RATES: Record<number, number> = {
  1: 5.0, // Level 1: 5% of member's daily mining earnings
  2: 3.0, // Level 2: 3% of member's daily mining earnings
  3: 2.0, // Level 3: 2% of member's daily mining earnings
  4: 1.0, // Level 4: 1%
  5: 1.0, // Level 5: 1%
  6: 1.0, // Level 6: 1%
  7: 1.0, // Level 7: 1%
  8: 1.0, // Level 8: 1%
  9: 1.0, // Level 9: 1%
  10: 1.0 // Level 10: 1%
};

// Helper: Estimate daily mining earnings for a member based on their active power
export const getMemberDailyEarning = (planAmount: number): number => {
  if (!planAmount || planAmount <= 0) return 0;
  const ratePercent = planAmount >= 3000 ? 2.0 : planAmount >= 1500 ? 1.7 : planAmount >= 700 ? 1.5 : planAmount >= 350 ? 1.35 : planAmount >= 150 ? 1.2 : planAmount >= 50 ? 1.1 : 1.0;
  return +(planAmount * (ratePercent / 100)).toFixed(4);
};

// Helper: Calculate ORC earned by upline from this member's daily yield
export const getMemberOrcDailyYield = (user: ReferredUserItem): number => {
  const lvl = user.level || 1;
  const orcRate = ORC_TIER_RATES[lvl] || 1.0;
  const memberDailyEarn = getMemberDailyEarning(user.planAmount);
  return +(memberDailyEarn * (orcRate / 100)).toFixed(4);
};

export const OrcCommissionSection: React.FC<Props> = ({
  referredUsers = [],
  myStake = 0,
  userName = '',
  orcBalance = 0,
  totalOrcIncome = 0,
  onSendOrcToWallet,
  onReinvestOrcToPlan
}) => {
  const [selectedLevelTab, setSelectedLevelTab] = useState<'all' | number>('all');

  // Compute breakdown across all 10 levels
  const tierCounts: Record<number, number> = {};
  const tierOrcEarnings: Record<number, number> = {};

  for (let l = 1; l <= 10; l++) {
    const usersInTier = referredUsers.filter((u) => (u.level || 1) === l);
    tierCounts[l] = usersInTier.length;
    tierOrcEarnings[l] = usersInTier.reduce((sum, u) => sum + getMemberOrcDailyYield(u), 0);
  }

  const total10TierMiners = referredUsers.length;
  const totalDailyOrcEstimate = Object.values(tierOrcEarnings).reduce((a, b) => a + b, 0);

  // ── MILESTONE 1 CALCULATIONS ($1,000 Total Team Volume + 25% Direct/L1 Rule) ──
  const l1Miners = referredUsers.filter((u) => (u.level || 1) === 1);
  const l1Volume = l1Miners.reduce((sum, u) => sum + (u.planAmount || 0), 0);
  const directSelfAndL1 = myStake + l1Volume;
  const totalTeamDownlinesVolume = referredUsers.reduce((sum, u) => sum + (u.planAmount || 0), 0);
  const totalTurnoverVolume = myStake + totalTeamDownlinesVolume;

  const MILESTONE_TOTAL_TARGET = 1000; // $1,000 USD
  const MILESTONE_DIRECT_TARGET = 250; // $250 USD (25% of $1,000)

  const isDirectConditionMet = directSelfAndL1 >= MILESTONE_DIRECT_TARGET;
  const isTotalConditionMet = totalTurnoverVolume >= MILESTONE_TOTAL_TARGET;
  const isMilestone1Unlocked = isDirectConditionMet && isTotalConditionMet;

  const totalProgressPercent = Math.min(100, Math.max(0, +((totalTurnoverVolume / MILESTONE_TOTAL_TARGET) * 100).toFixed(1)));
  const directProgressPercent = Math.min(100, Math.max(0, +((directSelfAndL1 / MILESTONE_DIRECT_TARGET) * 100).toFixed(1)));

  // ── ROYALTY MILESTONES (COMPANY NET PROFIT SHARED POOL) ──
  const ROYALTY_TIERS = [
    {
      tier: 1,
      title: "Milestone 1",
      subtitle: "$50,000 Team Investment",
      targetVolume: 50000,
      poolPercent: 5,
      accentColor: "#00F0FF",
      gradient: "from-[#0284C7] to-[#00F0FF]",
      borderActive: "border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.25)] ring-1 ring-[#00F0FF]/40",
      badgeColor: "bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30",
    },
    {
      tier: 2,
      title: "Milestone 2",
      subtitle: "$100,000 Team Investment",
      targetVolume: 100000,
      poolPercent: 3,
      accentColor: "#A855F7",
      gradient: "from-[#7C3AED] to-[#A855F7]",
      borderActive: "border-[#A855F7] shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-1 ring-[#A855F7]/40",
      badgeColor: "bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30",
    },
    {
      tier: 3,
      title: "Milestone 3",
      subtitle: "$200,000 Team Investment",
      targetVolume: 200000,
      poolPercent: 2,
      accentColor: "#F59E0B",
      gradient: "from-[#D97706] to-[#F59E0B]",
      borderActive: "border-[#F59E0B] shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-[#F59E0B]/40",
      badgeColor: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
    },
  ];

  // Filtered downline for table/cards view
  const filteredUsers = referredUsers.filter((u) => {
    const lvl = u.level || 1;
    if (selectedLevelTab !== 'all' && lvl !== selectedLevelTab) return false;
    return true;
  });

  // Calculate member's own team size (downline count)
  const getMemberTeamSize = (user: ReferredUserItem): number => {
    if (typeof user.teamSize === 'number' && user.teamSize > 0) {
      return user.teamSize;
    }
    const directSubs = referredUsers.filter((u) => {
      if (!u.invitedBy) return false;
      const inv = u.invitedBy.toUpperCase();
      return (
        inv === user.id.toUpperCase() ||
        (user.name && inv === user.name.toUpperCase()) ||
        (user.level === 1 && u.level === 2 && inv.includes('L1')) ||
        (user.level === 2 && u.level === 3 && inv.includes('L2'))
      );
    }).length;
    return Math.max(user.teamSize || 0, directSubs);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── HEADER BANNER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#060D1A] via-[#091527] to-[#0D1B2A] border border-[#192A44] p-5 lg:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[11px] font-black text-[#00F0FF] tracking-wider uppercase mb-1 shadow-inner">
            <Zap className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>ORC · Over-Ride Commission · 10 Levels Active</span>
          </div>
          <h2 className="text-[22px] lg:text-[28px] font-black text-white tracking-tight">
            Over-Ride Commission
          </h2>
          <p className="text-[12px] lg:text-[13.5px] text-[#94A3B8] max-w-2xl leading-relaxed">
            Earn recurring daily royalties calculated directly from your entire 10-tier team's daily mining earnings.
            <strong className="text-[#00F0FF] ml-1">L1: 5% · L2: 3% · L3: 2% · L4 to L10: 1% each</strong> every single 24-hour cycle!
          </p>
        </div>
      </div>

      {/* ── ORC BALANCE & FINANCIAL ACTIONS (SEND TO WALLET / RE-INVEST) ── */}
      <div className="rounded-2xl bg-gradient-to-br from-[#081324] via-[#0B1A30] to-[#081220] border border-[#00F0FF]/30 p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#00F0FF]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Balance Block */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#94A3B8] block">
                  Available ORC Balance
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] sm:text-[30px] font-black font-mono text-white tracking-tight">
                    ${orcBalance.toFixed(2)}
                  </span>
                  <span className="text-[12px] font-bold text-[#00F0FF]">USDT</span>
                  <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-bold">
                    Claimable
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1 text-[11px] text-[#94A3B8]">
              <span>
                Lifetime ORC: <strong className="text-white font-mono">${totalOrcIncome.toFixed(2)}</strong>
              </span>
              <span>•</span>
              <span>
                Est. Daily ORC: <strong className="text-[#10B981] font-mono">+{totalDailyOrcEstimate.toFixed(4)}/d</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons (Send to Wallet & Re-invest) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Button 1: Send to Wallet */}
            <button
              type="button"
              onClick={onSendOrcToWallet}
              className={`py-2.5 px-4 rounded-xl font-black text-[12px] sm:text-[13px] flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                orcBalance > 0
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#00F0FF] hover:brightness-110 text-[#021020] shadow-[0_0_20px_rgba(0,240,255,0.35)] border border-[#00F0FF]'
                  : 'bg-[#0E1F35] text-[#64748B] border border-[#192D47] hover:text-[#94A3B8]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>Send to Wallet</span>
            </button>

            {/* Button 2: Re-invest into Plan */}
            <button
              type="button"
              onClick={onReinvestOrcToPlan}
              className={`py-2.5 px-4 rounded-xl font-black text-[12px] sm:text-[13px] flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                orcBalance > 0 && myStake > 0
                  ? 'bg-gradient-to-r from-[#059669] to-[#10B981] hover:brightness-110 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-[#10B981]'
                  : 'bg-[#0E1F35] text-[#64748B] border border-[#192D47] hover:text-[#94A3B8]'
              }`}
            >
              <Repeat className="w-4 h-4 stroke-[2.5]" />
              <span>Re-invest in Plan</span>
            </button>
          </div>
        </div>

        {/* Explanatory Footer */}
        <div className="mt-3 pt-2.5 border-t border-[#122338] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10.5px] text-[#64748B]">
          <span>
            💡 <strong className="text-[#94A3B8]">Send to Wallet</strong> credits your Withdrawable Balance for instant payout.
          </span>
          <span>
            ⚡ <strong className="text-[#94A3B8]">Re-invest</strong> adds to your active plan capital (${myStake.toFixed(2)}) to compound daily hashing returns!
          </span>
        </div>
      </div>

      {/* ── 1.5% YIELD BOOST PROGRESS CARD (COMPACT) ── */}
      <div className={`rounded-xl bg-[#0B1424] border p-3.5 sm:p-4 shadow-lg space-y-3 transition-all ${
        isMilestone1Unlocked
          ? 'border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)] ring-1 ring-[#00F0FF]/30'
          : 'border-[#192A44]'
      }`}>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 transition-all ${
              isMilestone1Unlocked
                ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
                : 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]'
            }`}>
              {isMilestone1Unlocked ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] sm:text-[15px] font-black text-white">
                  1.5% Daily Mining Yield Boost
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25 font-bold">
                  $1,000 Target
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Upgrade personal mining rig return to <strong className="text-[#00F0FF]">1.5% Daily</strong> (requires min $250 from Self + L1)
              </p>
            </div>
          </div>

          <div className="self-start sm:self-auto shrink-0">
            {isMilestone1Unlocked ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                ✓ 1.5% BOOST ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                IN PROGRESS ({totalProgressPercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#94A3B8]">
              Team Staked Volume: <strong className="text-white font-mono">${totalTurnoverVolume.toFixed(2)}</strong> / $1,000.00 USD
            </span>
            <span className="font-mono font-bold text-[#00F0FF]">{totalProgressPercent}%</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#060D18] border border-[#16273F] overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isMilestone1Unlocked
                  ? 'bg-gradient-to-r from-[#059669] to-[#10B981]'
                  : 'bg-gradient-to-r from-[#0284C7] to-[#00F0FF]'
              }`}
              style={{ width: `${totalProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Compact Inline Conditions & Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          {/* 25% Rule status */}
          <div className="px-3 py-1.5 rounded-lg bg-[#060D18] border border-[#16273F] flex items-center justify-between">
            <span className="text-[#94A3B8]">
              25% Direct Rule (Self + L1): <strong className="text-white font-mono">${directSelfAndL1.toFixed(2)}</strong> / $250
            </span>
            {isDirectConditionMet ? (
              <span className="text-[#10B981] font-bold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Met
              </span>
            ) : (
              <span className="text-[#F59E0B] font-bold font-mono text-[10px]">
                ${(250 - directSelfAndL1).toFixed(2)} needed
              </span>
            )}
          </div>

          {/* Quick breakdown */}
          <div className="px-3 py-1.5 rounded-lg bg-[#060D18] border border-[#16273F] flex items-center justify-between text-[#94A3B8]">
            <span>Self: <strong className="text-white font-mono">${myStake.toFixed(0)}</strong></span>
            <span>L1 Direct: <strong className="text-[#00F0FF] font-mono">${l1Volume.toFixed(0)}</strong></span>
            <span>Total Team: <strong className="text-[#38BDF8] font-mono">${totalTeamDownlinesVolume.toFixed(0)}</strong></span>
          </div>
        </div>
      </div>

      {/* ── ROYALTY SECTION: COMPANY NET PROFIT POOL (3 MILESTONES) ── */}
      <div className="rounded-2xl bg-[#0B1424] border border-[#192A44] p-5 lg:p-6 shadow-xl space-y-5">
        {/* Royalty Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#16273F] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F59E0B]/20 via-[#00F0FF]/15 to-[#A855F7]/20 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Crown className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
                  Royalty Program · Company Net Profit Pool
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 font-mono">
                  Global Profit Share
                </span>
              </div>
              <p className="text-[12px] text-[#94A3B8]">
                Achieve collective team investment milestones to unlock recurring allocations from the company's net profit pool.
              </p>
            </div>
          </div>
        </div>

        {/* Shared Pool Clarification Callout */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#060D18] via-[#0A1628] to-[#060D18] border border-[#00F0FF]/25 flex items-start gap-3 shadow-inner">
          <Info className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
          <div className="text-[11.5px] text-[#CBD5E1] leading-relaxed">
            <span className="font-bold text-[#00F0FF] uppercase tracking-wider block mb-0.5">
              Shared Profit-Sharing Distribution Rule
            </span>
            The royalty percentages (<strong className="text-white">5%, 3%, and 2%</strong>) represent allocations of the <strong className="text-white">Company's Net Profit</strong>. These rewards are <span className="text-[#00F0FF] font-semibold">not given individually in full</span> to one single member; instead, each designated profit pool is <strong className="text-[#10B981]">divided equally among all qualifying leaders</strong> who achieve that milestone.
            <div className="text-[11px] text-[#94A3B8] mt-1 italic">
              Example: If 10 leaders achieve the $50,000 milestone with their teams, the 5% company net profit pool will be split equally among all 10 qualifiers.
            </div>
          </div>
        </div>

        {/* 3 Royalty Milestones Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ROYALTY_TIERS.map((tier) => {
            const isQualified = totalTurnoverVolume >= tier.targetVolume;
            const progress = Math.min(100, Math.max(0, +((totalTurnoverVolume / tier.targetVolume) * 100).toFixed(1)));
            const remaining = Math.max(0, tier.targetVolume - totalTurnoverVolume);

            return (
              <div
                key={'royalty_tier_' + tier.tier}
                className={`rounded-xl bg-[#060D18] border p-4 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  isQualified
                    ? tier.borderActive
                    : 'border-[#16273F] hover:border-[#253D63]'
                }`}
              >
                {/* Subtle Glow in background if qualified */}
                {isQualified && (
                  <div
                    className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20"
                    style={{ backgroundColor: tier.accentColor }}
                  />
                )}

                <div className="space-y-3 relative z-10">
                  {/* Tier Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center border font-mono font-bold text-xs"
                        style={{
                          backgroundColor: `${tier.accentColor}15`,
                          borderColor: `${tier.accentColor}40`,
                          color: tier.accentColor
                        }}
                      >
                        T{tier.tier}
                      </div>
                      <div>
                        <h4 className="text-[14px] font-black text-white">{tier.title}</h4>
                        <span className="text-[11px] font-mono text-[#94A3B8] block">
                          ${tier.targetVolume.toLocaleString('en-US')} Team Investment
                        </span>
                      </div>
                    </div>

                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-black border font-mono tracking-tight"
                      style={{
                        backgroundColor: `${tier.accentColor}15`,
                        borderColor: `${tier.accentColor}40`,
                        color: tier.accentColor
                      }}
                    >
                      {tier.poolPercent}% Net Profit
                    </span>
                  </div>

                  {/* Reward Highlights */}
                  <div className="p-2.5 rounded-lg bg-[#081220] border border-[#142338]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#94A3B8]">Royalty Reward:</span>
                      <span className="font-bold font-mono text-white">
                        <strong style={{ color: tier.accentColor }}>{tier.poolPercent}%</strong> Company Net Profit Pool
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] mt-1 pt-1 border-t border-[#142338]/60 text-[#64748B]">
                      <span>Distribution:</span>
                      <span className="text-[#94A3B8]">Equal split among all T{tier.tier} qualifiers</span>
                    </div>
                  </div>

                  {/* Progress Bar & Numerical Counter */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#94A3B8] font-bold">Progress</span>
                      <span className="font-mono font-bold text-white">
                        <span style={{ color: isQualified ? '#10B981' : tier.accentColor }}>
                          ${totalTurnoverVolume.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[#64748B]"> / ${tier.targetVolume.toLocaleString('en-US')} USD</span>
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-3 rounded-full bg-[#030712] border border-[#16273F] overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${tier.gradient}`}
                        style={{
                          width: `${progress}%`,
                          boxShadow: isQualified ? `0 0 10px ${tier.accentColor}` : undefined
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                      <span>{progress}% Achieved</span>
                      {isQualified ? (
                        <span className="text-[#10B981] font-bold">✓ Target Reached</span>
                      ) : (
                        <span className="text-[#CBD5E1] font-mono">
                          ${remaining.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} needed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Status Footer */}
                <div className="pt-3 mt-3 border-t border-[#142338] relative z-10">
                  {isQualified ? (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-[11px] font-black uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>QUALIFIED · EQUAL POOL ACTIVE</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#081220] border border-[#142338] text-[10.5px]">
                      <span className="text-[#64748B]">Status:</span>
                      <span className="font-bold text-[#F59E0B] font-mono">
                        IN PROGRESS ({progress}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* ── 10-TIER DOWNLINE DIRECTORY ── */}
      <div className="rounded-2xl bg-[#0B1424] border border-[#192A44] p-4 lg:p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#16273F] pb-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#00F0FF]" />
            <div>
              <h3 className="text-[16px] lg:text-[18px] font-black text-white">
                10-Level Downline Miners Directory
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Real-time tracking of team mining earnings and your respective override royalties
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/25 font-bold">
            Live Telemetry Sync
          </span>
        </div>

        {/* 10 Level Tabs Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedLevelTab('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer active:scale-95 border ${
              selectedLevelTab === 'all'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021020] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)] font-black'
                : 'bg-[#060D18] border-[#16273F] text-[#94A3B8] hover:text-[#00F0FF]'
            }`}
          >
            All 10 Levels ({total10TierMiners})
          </button>

          {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => {
            const count = tierCounts[lvl] || 0;
            const rate = ORC_TIER_RATES[lvl] || 1.0;
            const isSelected = selectedLevelTab === lvl;

            return (
              <button
                key={'tab_' + lvl}
                type="button"
                onClick={() => setSelectedLevelTab(lvl)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer active:scale-95 border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021020] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)] font-black'
                    : 'bg-[#060D18] border-[#16273F] text-[#94A3B8] hover:text-[#00F0FF]'
                }`}
              >
                <span>L{lvl} ({rate}%)</span>
                <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-black/30' : 'bg-white/10'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Directory Content */}
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center rounded-xl bg-[#060D18] border border-[#16273F] space-y-2">
            <Zap className="w-8 h-8 text-[#192A44] mx-auto" />
            <p className="text-[13px] font-bold text-[#CBD5E1]">
              No miners currently registered in {selectedLevelTab === 'all' ? 'the 10-tier tree' : `Level ${selectedLevelTab}`}
            </p>
            <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
              Share your personal link to recruit Tier 1 members. When they build downlines, your ORC extends across all 10 levels automatically!
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-[#192A44]">
              <table className="w-full text-left text-[11.5px]">
                <thead className="bg-[#081220] text-[#94A3B8] uppercase tracking-wider text-[10px] font-bold border-b border-[#192A44]">
                  <tr>
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Sponsor</th>
                    <th className="py-3 px-4">Staked Plan</th>
                    <th className="py-3 px-4">Member Daily Yield</th>
                    <th className="py-3 px-4">Your ORC %</th>
                    <th className="py-3 px-4 text-right">Your Daily ORC</th>
                    <th className="py-3 px-4 text-center">Team Size</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#16273F] bg-[#0B1424]">
                  {filteredUsers.map((user, idx) => {
                    const lvl = user.level || 1;
                    const orcRate = ORC_TIER_RATES[lvl] || 1.0;
                    const memberDailyEarn = getMemberDailyEarning(user.planAmount);
                    const yourDailyOrc = getMemberOrcDailyYield(user);

                    return (
                      <tr key={'orc_row_' + user.id + '_' + idx} className="hover:bg-[#0E1A2E] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white font-mono text-[12px]">{user.id}</div>
                          {user.name && user.name.toUpperCase() !== user.id.toUpperCase() && (
                            <div className="text-[9.5px] text-[#94A3B8]">{user.name}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            lvl === 1
                              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30'
                              : lvl === 2
                              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'
                              : lvl === 3
                              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                              : 'bg-[#0284C7]/15 text-[#38BDF8] border-[#0284C7]/30'
                          }`}>
                            Level {lvl}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#94A3B8]">
                          {user.invitedBy || 'Direct'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          ${user.planAmount || 0} USD
                        </td>
                        <td className="py-3 px-4 font-mono text-[#FBBF24]">
                          ~${memberDailyEarn.toFixed(2)}/day
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-[#00F0FF]">
                          {orcRate}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-black text-[#10B981] text-[13px]">
                            +${yourDailyOrc.toFixed(4)}
                          </span>
                          <span className="text-[9.5px] text-[#64748B] block">USDT/day</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF] font-mono font-bold text-[10.5px]">
                            {getMemberTeamSize(user)} {getMemberTeamSize(user) === 1 ? 'Member' : 'Members'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2.5">
              {filteredUsers.map((user, idx) => {
                const lvl = user.level || 1;
                const orcRate = ORC_TIER_RATES[lvl] || 1.0;
                const memberDailyEarn = getMemberDailyEarning(user.planAmount);
                const yourDailyOrc = getMemberOrcDailyYield(user);

                return (
                  <div
                    key={'orc_card_' + user.id + '_' + idx}
                    className="p-3.5 rounded-xl bg-[#060D18] border border-[#16273F] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-[12.5px] font-mono">{user.id}</div>
                        {user.name && user.name.toUpperCase() !== user.id.toUpperCase() && (
                          <div className="text-[9.5px] text-[#94A3B8]">{user.name}</div>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black border ${
                        lvl === 1
                          ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30'
                          : lvl === 2
                          ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'
                          : lvl === 3
                          ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          : 'bg-[#0284C7]/15 text-[#38BDF8] border-[#0284C7]/30'
                      }`}>
                        Level {lvl} · {orcRate}% ORC
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#16273F]">
                      <div>
                        <span className="text-[#64748B] block text-[9.5px] uppercase">Node & Daily Yield:</span>
                        <span className="font-mono text-white font-bold">${user.planAmount || 0} (~${memberDailyEarn.toFixed(2)}/d)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#64748B] block text-[9.5px] uppercase">Your Daily ORC:</span>
                        <span className="font-mono font-black text-[#10B981] text-[12.5px]">+${yourDailyOrc.toFixed(4)}/d</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1.5 border-t border-[#16273F]">
                      <span>Sponsor: <strong className="text-[#94A3B8]">{user.invitedBy || 'Direct'}</strong></span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF] font-mono font-bold">
                        Team: {getMemberTeamSize(user)} {getMemberTeamSize(user) === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── EXPLANATION FAQ BOX ── */}
      <div className="rounded-2xl bg-[#081220] border border-[#192A44] p-4 lg:p-5 text-[11.5px] text-[#94A3B8] space-y-2">
        <div className="flex items-center gap-2 text-white font-bold text-[12.5px]">
          <Info className="w-4 h-4 text-[#00F0FF]" />
          <span>Understanding ORC vs. Direct Referral Commission</span>
        </div>
        <p className="leading-relaxed">
          • <strong className="text-white">Referral Stake Commission (3 Tiers):</strong> Paid as a one-time bounty when a member buys or stakes a node (Level 1: 10%, Level 2: 5%, Level 3: 2%).
        </p>
        <p className="leading-relaxed">
          • <strong className="text-white">Over-Ride Commission (ORC · 10 Levels):</strong> Paid on a recurring 24-hour cycle calculated on the actual mining profits mined by your team:
          <span className="text-[#00F0FF] ml-1">L1 gives 5%, L2 gives 3%, L3 gives 2%, and L4 through L10 give 1% each of their daily yield.</span>
        </p>
      </div>
    </div>
  );
};
