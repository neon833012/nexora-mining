import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types/mining';
import { getTranslation } from '../data/miningPlans';

interface LiveStatsProps {
  activeUsersCount?: number;
  activeMinersCount?: number;
  currentLang?: LanguageCode;
}

export const LiveStatsGrid: React.FC<LiveStatsProps> = ({
  activeUsersCount = 18420,
  currentLang = 'en'
}) => {
  // Dynamically calculate 75% to 85% of active users (center baseline at ~80%)
  const [displayedMiners, setDisplayedMiners] = useState(() => Math.floor(activeUsersCount * 0.798));

  // Sync baseline when active users increase (+40/min)
  useEffect(() => {
    setDisplayedMiners((prev) => {
      const min = Math.floor(activeUsersCount * 0.75);
      const max = Math.floor(activeUsersCount * 0.85);
      if (prev < min || prev > max) {
        return Math.floor(activeUsersCount * 0.798);
      }
      return prev;
    });
  }, [activeUsersCount]);

  // Dynamic live fluctuation every 2-3 seconds within 75% - 85% boundary
  useEffect(() => {
    let timeoutRef: ReturnType<typeof setTimeout>;

    const tick = () => {
      setDisplayedMiners((prev) => {
        const min = Math.floor(activeUsersCount * 0.75);
        const max = Math.floor(activeUsersCount * 0.85);
        const delta = Math.floor(Math.random() * 32) - 15;
        const next = prev + delta;
        if (next < min) return min + Math.floor(Math.random() * 40);
        if (next > max) return max - Math.floor(Math.random() * 40);
        return next;
      });

      const nextIn = 2000 + Math.floor(Math.random() * 1200);
      timeoutRef = setTimeout(tick, nextIn);
    };

    timeoutRef = setTimeout(tick, 2000);
    return () => clearTimeout(timeoutRef);
  }, [activeUsersCount]);

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
