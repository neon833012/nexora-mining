import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types/mining';
import { getTranslation } from '../data/miningPlans';

interface LiveStatsProps {
  activeUsersCount?: number;
  activeMinersCount?: number;
  currentLang?: LanguageCode;
}

export const LiveStatsGrid: React.FC<LiveStatsProps> = ({
  activeUsersCount = 20437,
  activeMinersCount = 14500,
  currentLang = 'en'
}) => {
  // Use globally synchronized activeMinersCount passed from App (same across all phones)
  const displayedMiners = activeMinersCount;

  return (
    <section className="w-full px-3.5 lg:px-0">
      <div className="w-full rounded-xl bg-[#091322] border border-[#182C48] px-4 py-2.5 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:border-[#10B981]/40 transition-colors">
        {/* Left: Active Miners Label */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <span className="text-[13px] leading-none select-none">⛏️</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11.5px] font-bold tracking-wider text-[#94A3B8] uppercase">
              {getTranslation('activeMiners', currentLang, 'ACTIVE MINERS')}
            </span>
          </div>
        </div>

        {/* Right: Live Miner Number in front - ONLY number */}
        <div className="flex items-center">
          <span translate="no" className="notranslate text-[17px] lg:text-[19px] font-mono font-black text-[#10B981] tracking-tight">
            {displayedMiners.toLocaleString()}
          </span>
        </div>
      </div>
    </section>
  );
};
