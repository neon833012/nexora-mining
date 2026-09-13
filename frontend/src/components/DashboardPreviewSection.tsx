import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  Sparkles,
  Trophy,
  ArrowUpRight,
  Cpu,
  Activity,
  Server,
  Thermometer,
  ShieldCheck,
  Radio,
  Gauge,
  Wallet,
  CheckCircle2,
  Lock,
  LogOut,
  User,
  Copy,
  Check
} from 'lucide-react';
import { TeamTurnover } from '../types/mining';

interface Props {
  // Balances
  totalBalance?: number;
  depositBalance?: number;
  availableWithdrawal?: number;
  referralBalance?: number;
  totalReferralIncome?: number;
  totalWithdrawn?: number;

  // Incomes
  yesterdaysIncome: number;
  todaysIncome: number;
  totalIncome: number;
  unclaimedYield?: number;

  // Plan & Power
  activeMiningPower: number;
  activePlanName?: string;
  activePlanDailyRate?: number;

  // 24H Mining Telemetry
  isMiningActive: boolean;
  isCompoundingActive: boolean;
  countdownText: string;
  userName?: string;
  userReferralCode?: string;

  // Lists & Turnover
  referredUsers?: any[];
  transactions?: any[];
  teamTurnover: TeamTurnover;

  // 24H Compound Lock State
  isCompoundLocked?: boolean;
  compoundSecondsLeft?: number;
  compoundCountdownText?: string;
  onClaimInterestToWallet?: () => void;

  // Actions
  onDepositClick?: () => void;
  onWithdrawClick?: () => void;
  onUpgradePlanClick: () => void;
  onToggleMining: () => void;
  onCompoundSingleDay: () => void;
  onNavigateToReferral?: () => void;
  onLogout?: () => void;
}

export const DashboardPreviewSection: React.FC<Props> = ({
  totalBalance = 0,
  depositBalance = 0,
  availableWithdrawal = 0,
  referralBalance = 0,
  totalReferralIncome = 0,
  totalWithdrawn = 0,
  yesterdaysIncome,
  todaysIncome,
  totalIncome,
  unclaimedYield = 0,
  activeMiningPower,
  activePlanName = 'No Active Plan',
  activePlanDailyRate = 1.0,
  isMiningActive,
  isCompoundingActive,
  countdownText,
  userName = 'Miner',
  userReferralCode = 'NEON',
  referredUsers = [],
  transactions = [],
  teamTurnover,
  isCompoundLocked = false,
  compoundSecondsLeft = 0,
  compoundCountdownText = '24:00:00',
  onClaimInterestToWallet,
  onDepositClick,
  onWithdrawClick,
  onUpgradePlanClick,
  onToggleMining,
  onCompoundSingleDay,
  onNavigateToReferral,
  onLogout
}) => {
  // Random Data Center campus assigned per session / login (strictly the 4 home data centers)
  const [activeCampus, setActiveCampus] = useState(() => {
    const centers = [
      'Campus 01 (Iceland)',
      'Campus 02 (Norway)',
      'Campus 03 (Texas, USA)',
      'Campus 04 (Canada)'
    ];
    return centers[Math.floor(Math.random() * centers.length)];
  });

  useEffect(() => {
    const centers = [
      'Campus 01 (Iceland)',
      'Campus 02 (Norway)',
      'Campus 03 (Texas, USA)',
      'Campus 04 (Canada)'
    ];
    setActiveCampus(centers[Math.floor(Math.random() * centers.length)]);
  }, [userName]);

  // 24-Hour Dynamic Stratum Port (changes 24 times in 24 hours to a random 4-digit port)
  const [stratumPort, setStratumPort] = useState<number>(() => {
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const hour = now.getHours();
    const hash = Math.sin(seed * 31 + hour * 17) * 10000;
    return Math.floor(1000 + Math.abs(hash - Math.floor(hash)) * 8999);
  });

  useEffect(() => {
    const computePort = () => {
      const now = new Date();
      const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      const hour = now.getHours();
      const hash = Math.sin(seed * 31 + hour * 17) * 10000;
      setStratumPort(Math.floor(1000 + Math.abs(hash - Math.floor(hash)) * 8999));
    };

    computePort();
    const timer = setInterval(computePort, 30000);
    return () => clearInterval(timer);
  }, []);

  // Milestone progress calculations ($1,000 -> 1.5%, $2,500 -> 2%)
  const isTier2Reached = teamTurnover.totalVolume >= 2500;
  const isTier1Reached = teamTurnover.totalVolume >= 1000;
  const nextTarget = isTier1Reached ? 2500 : 1000;
  const currentBoostRate = isTier2Reached ? 2.0 : isTier1Reached ? 1.5 : 1.0;
  const progressPercent = Math.min(100, Math.floor((teamTurnover.totalVolume / nextTarget) * 100));

  const pureMinedYield = +(totalIncome - totalReferralIncome).toFixed(2);

  return (
    <section className="w-full px-3.5 lg:px-0 space-y-5">

      {/* 1. Mining Operations Command Center Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 lg:p-6 rounded-2xl bg-gradient-to-r from-[#071324] via-[#0A1A2F] to-[#07172B] border border-[#192E4C] shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] font-black tracking-[1.2px] text-[#00F0FF] uppercase bg-[#00F0FF]/10 px-2.5 py-0.5 rounded-full border border-[#00F0FF]/30">
              MINING COMMAND CENTER
            </span>
            <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/30 font-bold">
              ASIC CLUSTER 04 · ONLINE
            </span>
          </div>

          <h2 className="text-[20px] lg:text-[26px] font-black text-white">
            Mining Operations & Telemetry
          </h2>
          <p className="text-[11.5px] lg:text-[13px] text-[#94A3B8] max-w-2xl leading-relaxed mt-0.5">
            Monitor real-time cloud hashrate, 24-hour mining cycles, immersion cooling diagnostics, and automated daily yield compounding.
          </p>
        </div>

        {/* Live Core Status Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#050C18] border border-[#142338] rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner">
            <div className={`w-3 h-3 rounded-full ${isMiningActive ? 'bg-[#10B981] animate-ping' : 'bg-[#EF4444]'}`} />
            <div>
              <span className="text-[9.5px] font-bold text-[#64748B] uppercase tracking-wider block">
                Cluster Engine
              </span>
              <span className={`text-[12px] font-mono font-black ${isMiningActive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {isMiningActive ? 'ACTIVE HASHING' : 'IDLE / STOPPED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Financial Metric Cards (6 Cards Grid) */}
      {/* 2. Active Plan Specifications Card */}
      <div className="p-4 lg:p-6 rounded-2xl bg-gradient-to-r from-[#071324] via-[#0A1A2F] to-[#07172B] border border-[#1A3354] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>{activeMiningPower > 0 ? 'ACTIVE MINING PLAN' : 'NO PLAN ACTIVE'}</span>
              </span>
              {activeMiningPower > 0 && (
                <span className="text-[10.5px] text-[#00F0FF] font-mono font-bold bg-[#00F0FF]/10 px-2 py-0.5 rounded-full border border-[#00F0FF]/25">
                  {activeMiningPower} TH/s SHA-256 Hashrate
                </span>
              )}
              <span className="text-[10px] text-[#94A3B8] font-mono">
                Hardware: Antminer S21 Pro Hydro · Immersion Cooled
              </span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <h3 className="text-[20px] lg:text-[25px] font-black text-white tracking-tight">
                {activeMiningPower > 0 ? activePlanName : 'No Active Plan'}
              </h3>
              {activeMiningPower > 0 && (
                <span className="text-[14px] font-mono font-bold text-[#10B981]">
                  (${activeMiningPower.toFixed(2)} USD Staked)
                </span>
              )}
            </div>
          </div>

          {activeMiningPower <= 0 && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={onUpgradePlanClick}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#10B981] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>⚡ Activate Mining Plan</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Plan Specifications Clean Grid */}
        {activeMiningPower > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-[#142642]">
            <div className="p-2.5 rounded-xl bg-[#061120] border border-[#142844]">
              <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Daily Return Rate</span>
              <span className="text-[14px] font-mono font-black text-[#10B981]">
                {activePlanDailyRate.toFixed(2)}% / day
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#061120] border border-[#142844]">
              <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Daily Est. Yield</span>
              <span className="text-[14px] font-mono font-black text-[#00F0FF]">
                +${todaysIncome.toFixed(2)} USD
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#061120] border border-[#142844]">
              <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Contract Term</span>
              <span className="text-[14px] font-mono font-black text-white">
                365 Days
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#061120] border border-[#142844]">
              <span className="text-[10px] text-[#94A3B8] uppercase block font-bold">Payout Currency</span>
              <span className="text-[14px] font-mono font-black text-[#FBBF24]">
                USDT
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. 4 Core Mining Yield & Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3.5">
        {/* Metric 1: Today's Mined Yield */}
        <div className="rounded-2xl bg-[#081322] border border-[#00F0FF]/30 p-3.5 lg:p-4 space-y-1 shadow-[0_0_15px_rgba(0,240,255,0.05)]">
          <div className="flex items-center justify-between text-[11px] text-[#00F0FF]">
            <span className="font-bold uppercase tracking-wider text-[10px]">Today's Yield</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="text-[20px] lg:text-[24px] font-black font-mono text-[#00F0FF]">
            +${todaysIncome.toFixed(2)} <span className="text-[11px] font-normal text-[#64748B]">USD</span>
          </div>
          <div className="text-[10.5px] text-[#94A3B8] flex justify-between pt-1 border-t border-[#10243C]">
            <span>Rate: <strong className="text-[#10B981]">{activePlanDailyRate.toFixed(1)}% / day</strong></span>
            <span className="text-[#00F0FF]">Active Cycle</span>
          </div>
        </div>

        {/* Metric 2: Yesterday's Settled Yield */}
        <div className="rounded-2xl bg-[#081220] border border-[#16273F] p-3.5 lg:p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span className="font-bold uppercase tracking-wider text-[10px]">Yesterday's Settled</span>
            <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
          </div>
          <div className="text-[20px] lg:text-[24px] font-black font-mono text-white">
            +${yesterdaysIncome.toFixed(2)} <span className="text-[11px] font-normal text-[#64748B]">USD</span>
          </div>
          <div className="text-[10.5px] text-[#94A3B8] flex justify-between pt-1 border-t border-[#122034]">
            <span>Status: <strong className="text-[#10B981]">Settled</strong></span>
            <span>24H Cycle</span>
          </div>
        </div>

        {/* Metric 3: Cumulative Plan Yield */}
        <div className="rounded-2xl bg-[#081220] border border-[#16273F] p-3.5 lg:p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Plan Yield</span>
            <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div className="text-[20px] lg:text-[24px] font-black font-mono text-[#10B981]">
            +${pureMinedYield} <span className="text-[11px] font-normal text-[#64748B]">USD</span>
          </div>
          <div className="text-[10.5px] text-[#94A3B8] flex justify-between pt-1 border-t border-[#122034]">
            <span>From 24H Cycles</span>
            <span className="text-[#10B981] font-bold">Plan Rewards</span>
          </div>
        </div>

        {/* Metric 4: Active Hardware Capital Staked */}
        <div className="rounded-2xl bg-[#081220] border border-[#16273F] p-3.5 lg:p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span className="font-bold uppercase tracking-wider text-[10px]">Hardware Staked</span>
            <Server className="w-3.5 h-3.5 text-[#FBBF24]" />
          </div>
          <div className="text-[20px] lg:text-[24px] font-black font-mono text-white">
            ${activeMiningPower.toFixed(2)} <span className="text-[11px] font-normal text-[#64748B]">USD</span>
          </div>
          <div className="text-[10.5px] text-[#94A3B8] flex justify-between pt-1 border-t border-[#122034]">
            <span>Dedicated Power</span>
            <span className="text-[#38BDF8] font-bold">{activeMiningPower} TH/s</span>
          </div>
        </div>
      </div>

      {/* 4. Real-time Immersion Cooling & Rig Diagnostics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#060D18] border border-[#132238] text-[11.5px]">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#081220] border border-[#122034]">
          <Thermometer className="w-4 h-4 text-[#00F0FF] shrink-0" />
          <div>
            <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">Immersion Temp</span>
            <span className="text-white font-mono font-bold">32.4°C · Optimal</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#081220] border border-[#122034]">
          <Gauge className="w-4 h-4 text-[#10B981] shrink-0" />
          <div>
            <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">Pool Difficulty</span>
            <span className="text-white font-mono font-bold">84.2 T · 18ms</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#081220] border border-[#122034]">
          <Radio className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <div>
            <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">Data Center</span>
            <span className="text-white font-mono font-bold">{activeCampus}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#081220] border border-[#122034]">
          <ShieldCheck className="w-4 h-4 text-[#FBBF24] shrink-0" />
          <div>
            <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">Hashing Uptime</span>
            <span className="text-white font-mono font-bold">99.98% SLA</span>
          </div>
        </div>
      </div>

      {/* 4. 2-Column Telemetry & Mining Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 24H Mining Engine */}
        <div className="lg:col-span-7 space-y-4">
          {/* 24-HOUR MINING ENGINE & DAILY PLAN COMPOUNDING ENGINE */}
          <div
            className={`rounded-2xl border p-4 lg:p-5 shadow-xl transition-all duration-500 space-y-4 ${
              isMiningActive
                ? 'bg-gradient-to-b from-[#062419] to-[#04120D] border-[#10B981]/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-gradient-to-b from-[#240808] to-[#120404] border-[#EF4444]/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            }`}
          >
            {/* Top: 24-Hour Mining Engine Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isMiningActive ? 'bg-[#10B981] animate-ping' : 'bg-[#EF4444] animate-pulse'
                    }`}
                  />
                  <span
                    className={`text-[12.5px] lg:text-[14px] font-black tracking-wider ${
                      isMiningActive ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {isMiningActive ? '🟢 MINING ACTIVE (24H PROOF-OF-ACTIVITY)' : '🔴 MINING STOPPED (TAP TO START 24H CYCLE)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-[12px] font-mono text-[#CBD5E1]">
                  <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Cycle Timer: <strong className={isMiningActive ? 'text-[#10B981] text-[13px]' : 'text-[#EF4444] text-[13px]'}>{countdownText}</strong></span>
                </div>

                <span className="text-[10.5px] text-[#94A3B8] block mt-0.5">
                  24-Hour Mining Engine: Start button dabate hi 24-hour cycle shuru hota hai. Cycle poora hote hi aapke plan ka daily yield (1.0% se 2.0%) unlock ho jata hai. Mining ka koi alag se fee ya extra charge nahi hai.
                </span>
              </div>

              {/* Toggle Mining Button */}
              <button
                onClick={onToggleMining}
                className={`px-4 lg:px-5 py-2.5 rounded-xl text-[12px] lg:text-[12.5px] font-black tracking-wide transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5 shrink-0 ${
                  isMiningActive
                    ? 'bg-[#064E3B]/80 border border-[#10B981]/70 text-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                }`}
              >
                <Zap className={`w-4 h-4 ${isMiningActive ? 'text-[#10B981]' : 'text-white'}`} />
                <span>{isMiningActive ? `🟢 MINING ACTIVE (${countdownText})` : '🔴 START 24H MINING'}</span>
              </button>
            </div>

            <div className="h-px bg-white/10" />

            {/* Re-invest & Send to Wallet Action Buttons */}
            {(() => {
              const projectedDailyYield = activeMiningPower > 0 ? +(activeMiningPower * (activePlanDailyRate / 100)).toFixed(2) : 0.20;
              const readyYield = unclaimedYield !== undefined && unclaimedYield > 0 ? unclaimedYield : 0;
              const isYieldReady = readyYield > 0;

              return (
                <div className="space-y-2 pt-1">
                  {/* 1. Re-invest Button */}
                  <button
                    type="button"
                    disabled={!isYieldReady}
                    onClick={isYieldReady ? onCompoundSingleDay : undefined}
                    className={`w-full py-3 px-4 rounded-xl text-[12.5px] font-black flex items-center justify-center gap-2 transition-all ${
                      isYieldReady
                        ? 'bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#F59E0B] text-[#1A1202] hover:brightness-110 cursor-pointer active:scale-[0.98] shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse'
                        : 'bg-[#0A1422] text-[#64748B] border border-[#16273F] cursor-not-allowed opacity-70'
                    }`}
                  >
                    {isYieldReady ? (
                      <>
                        <Sparkles className="w-4 h-4 text-[#1A1202]" />
                        <span>Re-invest into Plan (+${readyYield.toFixed(2)} USD into Plan Value)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-[#64748B]" />
                        <span>
                          {activeMiningPower <= 0
                            ? 'Re-invest into Plan (Buy a plan first)'
                            : isMiningActive
                            ? `Re-invest into Plan (Locked — 24H Cycle in progress: ${countdownText})`
                            : `Re-invest into Plan (Locked — Start 24H Mining to unlock +$${projectedDailyYield.toFixed(2)} USD)`}
                        </span>
                      </>
                    )}
                  </button>

                  {/* 2. Send to Wallet Button */}
                  {onClaimInterestToWallet && (
                    <button
                      type="button"
                      disabled={!isYieldReady}
                      onClick={isYieldReady ? onClaimInterestToWallet : undefined}
                      className={`w-full py-3 px-4 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all ${
                        isYieldReady
                          ? 'bg-[#0B1E36] hover:bg-[#0F294A] text-[#00F0FF] border border-[#00F0FF]/40 hover:border-[#00F0FF] cursor-pointer active:scale-[0.98] shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                          : 'bg-[#060D17] text-[#475569] border border-[#121E30] cursor-not-allowed opacity-60'
                      }`}
                    >
                      {isYieldReady ? (
                        <>
                          <Wallet className="w-4 h-4 text-[#00F0FF]" />
                          <span>Send to Wallet (+${readyYield.toFixed(2)} USDT for Withdrawal)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-[#475569]" />
                          <span>
                            {activeMiningPower <= 0
                              ? 'Send to Wallet (Buy a plan first)'
                              : `Send to Wallet (Locked — Unlocks after 24H Cycle: +$${projectedDailyYield.toFixed(2)} USDT)`}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* TEAM TURNOVER VOLUME MILESTONES */}
          <div className="rounded-2xl bg-[#0C1526] border border-[#1E304E] p-4 lg:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/40 flex items-center justify-center text-[#FBBF24]">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-[#F8FAFC] block leading-tight">
                    Team Turnover Volume Milestone
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    Combined: Personal Staked + 3-Level Downline Volume
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#94A3B8] block">Current Boost</span>
                <span className="text-[15px] font-black text-[#10B981]">
                  {currentBoostRate.toFixed(1)}% / day
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#060C16] border border-[#132034] text-[11.5px]">
              <div className="text-center">
                <span className="text-[9.5px] text-[#64748B] block uppercase">Own Staked</span>
                <strong className="text-white font-mono text-[13px]">${teamTurnover.personalStaked.toFixed(0)}</strong>
              </div>
              <div className="text-center border-x border-[#142338]">
                <span className="text-[9.5px] text-[#64748B] block uppercase">Team Staked</span>
                <strong className="text-[#38BDF8] font-mono text-[13px]">
                  ${(teamTurnover.downlineL1 + teamTurnover.downlineL2 + teamTurnover.downlineL3).toFixed(0)}
                </strong>
              </div>
              <div className="text-center">
                <span className="text-[9.5px] text-[#64748B] block uppercase">Combined Total</span>
                <strong className="text-[#FBBF24] font-mono text-[13px]">${teamTurnover.totalVolume.toFixed(0)}</strong>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11.5px]">
                <span className="text-[#94A3B8]">
                  Progress to {isTier1Reached ? '$2,500 VIP Milestone (2% Rate)' : '$1,000 Milestone (1.5% Rate)'}:
                </span>
                <span className="font-bold text-[#F8FAFC]">
                  ${teamTurnover.totalVolume.toFixed(0)} / ${nextTarget} USD ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-[#060C16] h-2.5 rounded-full overflow-hidden border border-[#16253C]">
                <div
                  className="h-full bg-gradient-to-r from-[#0284C7] via-[#FBBF24] to-[#10B981] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time ASIC Stratum V2 Telemetry Engine */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-[#091220] border border-[#142338] p-4 lg:p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#14233A]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[11px] font-bold tracking-wider text-[#94A3B8] uppercase">
                  ASIC STRATUM V2 TELEMETRY
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-md border border-[#00F0FF]/25 font-bold">
                PORT {stratumPort} · TLS
              </span>
            </div>

            {/* Stratum Engine Real-Time Specs */}
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050B14] border border-[#101C2E]">
                <span className="text-[#94A3B8]">Stratum Endpoint</span>
                <span className="font-mono text-[#38BDF8] text-[11px] truncate max-w-[190px]">
                  stratum+tcp://pool.neoncryptomining.com:{stratumPort}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#101C2E]">
                  <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">Accepted Shares</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-white font-black text-[13px]">18,420</span>
                    <span className="text-[10px] text-[#10B981] font-bold">(100%)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#101C2E]">
                  <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">Rejected / Stale</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-white font-black text-[13px]">0</span>
                    <span className="text-[10px] text-[#10B981] font-bold">(0.00%)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#101C2E]">
                  <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">Rig Efficiency</span>
                  <span className="font-mono text-[#FBBF24] font-bold text-[12.5px] block mt-0.5">29.5 J/TH</span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#101C2E]">
                  <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">Target Difficulty</span>
                  <span className="font-mono text-[#00F0FF] font-bold text-[12.5px] block mt-0.5">84.28 T</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#050B14] border border-[#101C2E] text-[11px]">
                <span className="text-[#94A3B8]">Acoustic Profile</span>
                <span className="text-[#10B981] font-bold">0 dB · Submerged Silent</span>
              </div>
            </div>

            {/* Live Rig Event Ticker */}
            <div className="p-2.5 rounded-xl bg-[#040810] border border-[#0F1A2A] space-y-1 font-mono text-[10px] text-[#64748B]">
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>DIAGNOSTIC LOGS</span>
                <span className="text-[#10B981]">SYSTEM NOMINAL</span>
              </div>
              <div className="text-[#38BDF8] truncate">• [04:00:00] 24H proof-of-work cycle synced with network</div>
              <div className="text-[#94A3B8] truncate">• [04:00:01] Dielectric coolant flow 4.2 L/min stable</div>
              <div className="text-[#94A3B8] truncate">• [04:00:02] Immersion thermal dissipation nominal (32.4°C)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Mining Consensus & Operational SLA (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-[#060D18] border border-[#142338] flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-[12.5px] text-white block">24-Hour Settlement Cycle</strong>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
              Mining yields calculate and credit every 24 hours directly to your available balance without manual claim delays.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#060D18] border border-[#142338] flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-[12.5px] text-white block">0% Stratum Pool Fee</strong>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
              100% of proof-of-work rewards belong to your account with zero pool fee deductions or hidden hashrate taxes.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#060D18] border border-[#142338] flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#FBBF24]/15 border border-[#FBBF24]/40 flex items-center justify-center text-[#FBBF24] shrink-0 mt-0.5">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-[12.5px] text-white block">Immersion Overclocking</strong>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
              Submerged in synthetic dielectric coolant for sustained peak TH/s performance and 0% thermal throttling.
            </p>
          </div>
        </div>
      </div>

      {/* Dedicated Sign Out / Logout Button at bottom of Dashboard */}
      {onLogout && (
        <div className="pt-4 pb-6 flex justify-center">
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-500/10 via-rose-600/15 to-red-500/10 hover:from-red-500/20 hover:to-rose-600/25 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 font-bold text-[13px] tracking-wide shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out Account</span>
          </button>
        </div>
      )}
    </section>
  );
};
