import React from 'react';
import { Zap, ArrowRight, ShieldCheck, Calculator, Sparkles } from 'lucide-react';

interface HomeCtaBannerProps {
  onOpenSignUp: () => void;
  onExplorePlans: () => void;
  onOpenCalculator: () => void;
  activeUsersCount?: number;
  activeMinersCount?: number;
  isLoggedIn?: boolean;
}

export const HomeCtaBanner: React.FC<HomeCtaBannerProps> = ({
  onOpenSignUp,
  onExplorePlans,
  onOpenCalculator,
  activeUsersCount = 18429,
  activeMinersCount = 10742,
  isLoggedIn = false,
}) => {
  return (
    <section className="w-full px-3.5 lg:px-0">
      <div className="relative rounded-2xl lg:rounded-3xl p-6 lg:p-10 overflow-hidden bg-gradient-to-br from-[#061830] via-[#081F3D] to-[#040E1C] border-2 border-[#00F0FF]/40 shadow-[0_0_50px_rgba(0,240,255,0.15)]">
        {/* Background Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#00F0FF]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#0284C7]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>JOIN {activeUsersCount.toLocaleString()}+ CLOUD MINERS WORLDWIDE</span>
          </div>

          <h2 className="text-[24px] lg:text-[36px] font-black text-white leading-tight">
            Deploy Your High-Hash Cloud Mining Node in Under 60 Seconds
          </h2>

          <p className="mt-2.5 text-[13px] lg:text-[15px] text-[#94A3B8] leading-relaxed">
            No expensive ASIC rigs to buy, zero electric bills to manage, and zero maintenance downtime. Start earning automated daily USDT rewards with as little as $20 USDT.
          </p>

          {/* Quick Pillars */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 border-y border-[#162F4F] text-[12px]">
            <div>
              <span className="text-[#94A3B8] block text-[11px]">Min Cashout</span>
              <strong className="text-white font-mono text-[14px]">$2.00 USDT</strong>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[11px]">Settlement</span>
              <strong className="text-[#00F0FF] font-mono text-[14px]">BEP-20</strong>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[11px]">Daily Cycle</span>
              <strong className="text-[#10B981] font-mono text-[14px]">24H Automated</strong>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {!isLoggedIn && (
              <button
                onClick={onOpenSignUp}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#0284C7] text-[#031020] font-black text-[14px] flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Create Miner Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onExplorePlans}
              className="px-5 py-3.5 rounded-xl bg-[#0D1F38] hover:bg-[#122A4C] border border-[#1E3E66] text-white font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <span>Explore All Plans</span>
            </button>

            <button
              onClick={onOpenCalculator}
              className="px-4 py-3.5 rounded-xl bg-transparent hover:bg-[#0D1F38]/50 border border-transparent hover:border-[#1E3E66] text-[#38BDF8] font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate Compound Yield</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
