import React from 'react';
import { MINING_PLANS, getTranslation } from '../data/miningPlans';
import { MiningPlan, LanguageCode } from '../types/mining';
import { Zap, ArrowRight, ShieldCheck, Cpu, Flame, Calculator } from 'lucide-react';

interface HomeFeaturedPlansProps {
  activeMiningPower: number;
  onSelectPlan: (plan: MiningPlan, isUpgrade?: boolean, diffAmount?: number) => void;
  onViewAllPlans: () => void;
  onOpenCalculator: () => void;
  miningPlans?: MiningPlan[];
  currentLang?: LanguageCode;
}

export const HomeFeaturedPlans: React.FC<HomeFeaturedPlansProps> = ({
  activeMiningPower,
  onSelectPlan,
  onViewAllPlans,
  onOpenCalculator,
  miningPlans = MINING_PLANS,
  currentLang = 'en'
}) => {
  // Highlight top active non-coming-soon plans
  const activeOnly = miningPlans.filter((p) => !p.isComingSoon);
  const plansToShow = activeOnly.length >= 3 ? activeOnly.slice(0, 3) : miningPlans.slice(0, 3);


  return (
    <section className="w-full px-3.5 lg:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
            <span className="text-[11px] font-bold tracking-[1.5px] text-[#00F0FF] uppercase">
              HIGH-EFFICIENCY ASIC RIGS
            </span>
          </div>
          <h2 className="text-[20px] lg:text-[26px] font-extrabold text-white">
            {getTranslation('featuredNodes', currentLang, 'Featured Mining Nodes')}
          </h2>
          <p className="text-[12px] lg:text-[13px] text-[#94A3B8] mt-1 max-w-2xl">
            {getTranslation('featuredNodesSubtitle', currentLang, 'Directly stake into liquid-cooled Antminer S21 Pro and Whatsminer clusters. Real-time daily yield distributed every 24 hours in USDT (BEP-20).')}
          </p>
        </div>

        <div className="mt-3 md:mt-0 flex items-center gap-2">
          <button
            onClick={onOpenCalculator}
            className="px-3 py-2 rounded-xl bg-[#0E1B2E] border border-[#1E3352] text-[#38BDF8] hover:border-[#38BDF8] text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{getTranslation('yieldCalculator', currentLang, 'Yield Calculator')}</span>
          </button>
          <button
            onClick={onViewAllPlans}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#031020] hover:brightness-110 text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <span>{getTranslation('allPlans', currentLang, 'All Plans (5 Active)')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-5">
        {plansToShow.map((plan, idx) => {
          const isPro = idx === 1; // Plan 04 is the middle Pro card
          const isUpgradable = activeMiningPower > 0 && activeMiningPower < plan.amount;
          const upgradeCost = isUpgradable ? plan.amount - activeMiningPower : 0;
          const isCurrentActive = activeMiningPower === plan.amount;
          const isLowerActive = activeMiningPower > 0 && activeMiningPower > plan.amount;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px] ${
                isPro
                  ? 'bg-gradient-to-b from-[#0A1D38] via-[#06152B] to-[#040C1A] border-2 border-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.18)]'
                  : 'bg-[#081220] border border-[#162740] hover:border-[#00F0FF]/50 shadow-md'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-black tracking-wider text-[#00F0FF] uppercase bg-[#00F0FF]/10 px-3 py-1 rounded-full border border-[#00F0FF]/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.15)]">
                  <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" />
                  {plan.planName || 'ASIC NODE'}
                </span>

                {isPro ? (
                  <span className="text-[10px] font-bold uppercase bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Flame className="w-3 h-3" />
                    {getTranslation('mostPopular', currentLang, 'MOST POPULAR')}
                  </span>
                ) : idx === 2 ? (
                  <span className="text-[10px] font-bold uppercase bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 px-2.5 py-1 rounded-full">
                    {getTranslation('vipInstitutional', currentLang, 'VIP INSTITUTIONAL')}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 px-2.5 py-1 rounded-full">
                    {getTranslation('entryLevel', currentLang, 'ENTRY LEVEL')}
                  </span>
                )}
              </div>

              {/* Price & Rate */}
              <div className="my-3.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[32px] lg:text-[38px] font-black text-white font-mono tracking-tight">
                    ${plan.amount.toFixed(0)}
                  </span>
                  <span className="text-[13px] font-bold text-[#00F0FF]">USD</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                    +{plan.dailyRatePercent.toFixed(1)}% {getTranslation('dailyYield', currentLang, 'Daily Yield')}
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    ${(plan.amount * (plan.dailyRatePercent / 100)).toFixed(2)} / day
                  </span>
                </div>
              </div>

              {/* Upgrade Tag if Applicable */}
              {isUpgradable && (
                <div className="mb-3.5 p-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[11px] text-[#00F0FF] flex items-center justify-between">
                  <span>Upgrade difference:</span>
                  <strong className="font-mono font-bold">Pay +${upgradeCost.toFixed(0)}</strong>
                </div>
              )}

              {/* Stats breakdown */}
              <div className="space-y-2 py-3 border-y border-[#162740] text-[12px]">
                <div className="flex justify-between items-center text-[#94A3B8]">
                  <span>{getTranslation('contractTerm', currentLang, 'Contract Term')}</span>
                  <span className="font-bold text-white">{getTranslation('days365', currentLang, '365 Days')}</span>
                </div>
                <div className="flex justify-between items-center text-[#94A3B8]">
                  <span>{getTranslation('compoundYield', currentLang, '365D Compound Yield')}</span>
                  <span className="font-bold text-[#00F0FF] font-mono">
                    ${plan.dailyReinvestTotalCompound.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#94A3B8]">
                  <span>Hardware Fleet</span>
                  <span className="text-[#E2E8F0]">Antminer S21 Pro (234 TH/s)</span>
                </div>
                <div className="flex justify-between items-center text-[#94A3B8]">
                  <span>Payout Protocol</span>
                  <span className="text-[#10B981] font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                    USDT (BEP-20)
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectPlan(plan, isUpgradable, isUpgradable ? upgradeCost : undefined)}
                disabled={isCurrentActive || isLowerActive}
                className={`mt-4 w-full py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 ${
                  isCurrentActive
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 cursor-not-allowed'
                    : isLowerActive
                    ? 'bg-[#0A101C] text-[#64748B] border border-[#162234] cursor-not-allowed'
                    : isPro
                    ? 'bg-gradient-to-r from-[#00F0FF] to-[#0284C7] text-[#031020] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                    : 'bg-[#112238] text-white hover:bg-[#162D4A] border border-[#1E3758] hover:border-[#00F0FF]'
                }`}
              >
                {isCurrentActive ? (
                  <span>✓ {getTranslation('currentlyStaked', currentLang, 'Currently Staked Node')}</span>
                ) : isLowerActive ? (
                  <span>🔒 {getTranslation('lockedHigher', currentLang, 'Locked (Higher Node Active)')}</span>
                ) : isUpgradable ? (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{getTranslation('upgradeNode', currentLang, 'Upgrade to Node')} (+${upgradeCost.toFixed(0)})</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{getTranslation('stakeNode', currentLang, 'Stake Node')} (${plan.amount.toFixed(0)})</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
