import React, { useState, useEffect } from 'react';
import { ArrowRight, UserPlus, Zap, Clock, Users, Activity } from 'lucide-react';
import { InteractiveMayajalBackground } from './InteractiveMayajalBackground';
import { NeonMiningCoreVisual } from './NeonMiningCoreVisual';
import { LanguageCode } from '../types/mining';
import { getTranslation } from '../data/miningPlans';

interface Props {
  isMiningActive: boolean;
  onToggleMining: () => void;
  miningCountdownText: string;
  onExplorePlans: () => void;
  onCreateAccount: () => void;
  activePlanName?: string;
  activeUsersCount?: number;
  isLoggedIn?: boolean;
  currentLang?: LanguageCode;
}

export const FuturisticHeroSection: React.FC<Props> = ({
  isMiningActive,
  onToggleMining,
  miningCountdownText,
  onExplorePlans,
  onCreateAccount,
  activePlanName = '',
  activeUsersCount = 18429,
  isLoggedIn = false,
  currentLang = 'en'
}) => {
  // 1. Live synchronized active users count
  const activeUsers = activeUsersCount;
  // 2. Real-time dynamic hashrate fluctuation
  const [hashrate, setHashrate] = useState('428.5');
  // 3. Dynamic network node syncing
  const [syncedNodes, setSyncedNodes] = useState(12);
  // 4. Dynamic block time variance
  const [blockTime, setBlockTime] = useState('3.0s');

  useEffect(() => {
    // Fluctuate hashrate and network telemetry
    const hashrateInterval = setInterval(() => {
      const delta = (Math.random() * 1.4 - 0.7);
      const base = 428.5 + (activeUsers - 18429) * 0.05;
      const current = (base + delta).toFixed(1);
      setHashrate(current);

      // Random micro-shift in nodes (12 to 18, strictly 2 digits) and block time (2.9s to 3.1s)
      setSyncedNodes(12 + Math.floor(Math.random() * 7));
      setBlockTime(`${(2.9 + Math.random() * 0.2).toFixed(1)}s`);
    }, 2500);

    return () => {
      clearInterval(hashrateInterval);
    };
  }, [activeUsers]);

  return (
    <section className="relative mx-3.5 lg:mx-0 my-1 rounded-[20px] lg:rounded-[28px] overflow-hidden border border-[#00F0FF]/30 shadow-[0_0_35px_rgba(0,240,255,0.12)] bg-gradient-to-b from-[#091426] via-[#060D1A] to-[#040812]">
      {/* Interactive Mayajal Neural Background */}
      <InteractiveMayajalBackground />

      <div className="relative z-10 p-[18px] lg:p-8 flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
        {/* Left Column on Desktop (Content, Headline, CTAs, Telemetry) */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* 1. Protocol Chip & Live Timer */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D1C33] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              <span className="text-[#00F0FF] text-[12px]">❖</span>
              <span translate="no" className="notranslate text-[11px] font-bold tracking-wider text-[#00F0FF]">
                NEON MINING
              </span>
              <span translate="no" className="notranslate text-[11px] font-semibold text-[#94A3B8] tracking-wide">
                · BEP-20 CLOUD PROTOCOL
              </span>
            </div>

            {/* 24H Cycle Status Indicator */}
            <div
              onClick={onToggleMining}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold cursor-pointer transition-all ${
                isMiningActive
                  ? 'bg-[#064E3B]/60 border-[#10B981] text-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-[#450A0A]/60 border-[#EF4444] text-[#EF4444] animate-pulse'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span translate="no" className="notranslate">
                {isMiningActive ? miningCountdownText : getTranslation('miningPaused', currentLang, 'CYCLE PAUSED')}
              </span>
            </div>
          </div>

          {/* 2. Display Headline */}
          <div className="mt-4 lg:mt-6">
            <h1 className="text-[32px] lg:text-[46px] font-black tracking-tight text-[#F8FAFC] leading-[36px] lg:leading-[50px]">
              {getTranslation('heroHeadline1', currentLang, 'POWER THE FUTURE')}
            </h1>
            <h2 className="text-[32px] lg:text-[46px] font-black tracking-tight bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#60A5FA] bg-clip-text text-transparent leading-[36px] lg:leading-[50px]">
              {getTranslation('heroHeadline2', currentLang, 'OF DIGITAL MINING')}
            </h2>
          </div>

          {/* 3. Subtitle */}
          <p className="mt-3 text-[13.5px] lg:text-[15px] leading-[20px] lg:leading-[24px] text-[#94A3B8] max-w-2xl">
            {getTranslation('heroSubtitle', currentLang, 'Next-generation cloud-hosted hashrate, enterprise-grade BEP-20 node infrastructure, and automated smart reward distribution engineered for transparent, high-efficiency digital asset participation.')}
          </p>

          {/* 4. Action Buttons */}
          {!isLoggedIn && (
            <div className="mt-5 lg:mt-7 flex gap-2.5 max-w-xs">
              <button
                onClick={onCreateAccount}
                className="w-full h-[50px] rounded-[10px] p-[1px] bg-gradient-to-r from-[#0284C7] via-[#00B4D8] to-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="w-full h-full rounded-[9px] bg-gradient-to-r from-[#0284C7] via-[#00B4D8] to-[#00F0FF] flex items-center justify-center gap-2 px-5">
                  <UserPlus className="w-4 h-4 text-[#021024] shrink-0" />
                  <span className="text-[12.5px] lg:text-[13.5px] font-bold text-[#021024] tracking-wide whitespace-nowrap">
                    {getTranslation('createAccount', currentLang, 'CREATE ACCOUNT')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#021024] shrink-0" />
                </div>
              </button>
            </div>
          )}

          {/* 5. Live Telemetry Badges (Fluctuating dynamically) */}
          <div className="mt-4 flex items-center gap-3.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isMiningActive ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'
                }`}
              />
              <span className="text-[11.5px] font-medium text-[#CBD5E1]">
                {isMiningActive
                  ? getTranslation('miningActive', currentLang, 'Mining active')
                  : getTranslation('miningStopped', currentLang, 'Mining stopped')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
              <span className="text-[11.5px] font-medium text-[#CBD5E1]">
                <span translate="no" className="notranslate font-mono font-bold text-white">{syncedNodes}</span> {getTranslation('nodesSynced', currentLang, 'nodes synced')}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#FBBF24]" />
              <span className="text-[11px] font-medium text-[#CBD5E1] font-mono">
                <span translate="no" className="notranslate">{blockTime}</span> {getTranslation('blockTime', currentLang, 'block time')}
              </span>
            </div>
          </div>

          {/* 7. Quick Telemetry Strip on Desktop (hidden on mobile) */}
          <div className="mt-4 rounded-xl bg-[#081220]/90 border border-[#14243B] py-2.5 px-4 hidden lg:flex items-center justify-around shadow-inner">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[9px] font-semibold text-[#64748B] tracking-wider">
                <Activity className="w-2.5 h-2.5 text-[#00F0FF]" />
                <span>{getTranslation('hashrate', currentLang, 'GLOBAL HASHRATE')}</span>
              </div>
              <span translate="no" className="notranslate text-[12.5px] lg:text-[14px] font-bold font-mono text-[#00F0FF] mt-0.5 transition-all">
                {hashrate} TH/s
              </span>
            </div>

            <div className="w-px h-6 bg-[#16253C]" />

            <div className="flex flex-col items-center">
              <span className="text-[9px] font-semibold text-[#64748B] tracking-wider">
                {getTranslation('rewards24h', currentLang, '24H REWARDS')}
              </span>
              <span translate="no" className="notranslate text-[12.5px] lg:text-[14px] font-bold font-mono text-[#10B981] mt-0.5 transition-all">
                {(activeUsers * 7.75 + (parseFloat(hashrate) - 428) * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} USDT
              </span>
            </div>

            <div className="w-px h-6 bg-[#16253C]" />

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[9px] font-semibold text-[#64748B] tracking-wider">
                <Users className="w-2.5 h-2.5 text-[#10B981]" />
                <span>{getTranslation('activeMiners', currentLang, 'ACTIVE USERS')}</span>
              </div>
              <span translate="no" className="notranslate text-[12.5px] lg:text-[14px] font-bold font-mono text-[#E2E8F0] mt-0.5 transition-all">
                {activeUsers.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column on Desktop: Neon Core Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center mt-3 lg:mt-0 w-full">
          <NeonMiningCoreVisual
            isMiningActive={isMiningActive}
            onToggleMining={onToggleMining}
            hashrate={hashrate}
            activePlanName={activePlanName}
          />

          {/* Action button directly below core visual */}
          <button
            onClick={onToggleMining}
            className={`mt-3 px-6 py-2.5 rounded-xl font-black text-xs tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 shadow-lg ${
              isMiningActive
                ? 'bg-[#064E3B]/80 border border-[#10B981]/70 text-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isMiningActive ? 'text-[#10B981]' : 'text-white'}`} />
            <span>
              {!isLoggedIn
                ? `🟢 ${getTranslation('miningOnline', currentLang, 'START 24H MINING')}`
                : isMiningActive
                ? `🟢 ${getTranslation('miningActive', currentLang, 'MINING ACTIVE')} · ${miningCountdownText}`
                : `🔴 ${getTranslation('miningPaused', currentLang, 'START 24H MINING (Node Stopped)')}`}
            </span>
          </button>

          {/* Quick Telemetry Strip on Mobile (Positioned BELOW the mining core visual) */}
          <div className="mt-4 w-full rounded-xl bg-[#081220]/90 border border-[#14243B] py-2.5 px-4 flex lg:hidden items-center justify-around shadow-inner">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[9px] font-semibold text-[#64748B] tracking-wider">
                <Activity className="w-2.5 h-2.5 text-[#00F0FF]" />
                <span>{getTranslation('hashrate', currentLang, 'GLOBAL HASHRATE')}</span>
              </div>
              <span translate="no" className="notranslate text-[12.5px] font-bold font-mono text-[#00F0FF] mt-0.5 transition-all">
                {hashrate} TH/s
              </span>
            </div>

            <div className="w-px h-6 bg-[#16253C]" />

            <div className="flex flex-col items-center">
              <span className="text-[9px] font-semibold text-[#64748B] tracking-wider">
                24H REWARDS
              </span>
              <span className="text-[12.5px] font-bold font-mono text-[#10B981] mt-0.5 transition-all">
                {(activeUsers * 7.75 + (parseFloat(hashrate) - 428) * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} USDT
              </span>
            </div>

            <div className="w-px h-6 bg-[#16253C]" />

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[9px] font-semibold text-[#64748B] tracking-wider">
                <Users className="w-2.5 h-2.5 text-[#10B981]" />
                <span>ACTIVE USERS</span>
              </div>
              <span className="text-[12.5px] font-bold font-mono text-[#E2E8F0] mt-0.5 transition-all">
                {activeUsers.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
