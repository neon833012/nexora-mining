import React, { useState } from 'react';
import { Zap, ArrowRight, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { MiningPlan } from '../types/mining';
import { MINING_PLANS, getPlanForAmount } from '../data/miningPlans';

interface Props {
  activeMiningPower: number;
  onSelectPlan: (plan: MiningPlan, isUpgrade?: boolean, diffAmount?: number) => void;
  miningPlans?: MiningPlan[];
}

export const MiningPlanCards: React.FC<Props> = ({
  activeMiningPower,
  onSelectPlan,
  miningPlans = MINING_PLANS
}) => {
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPlanId((prev) => (prev === id ? null : id));
  };

  const plansToRender = miningPlans;
  const activeTiersCount = plansToRender.filter((p) => !p.isComingSoon).length;
  const comingSoonCount = plansToRender.filter((p) => p.isComingSoon).length;

  return (
    <section className="w-full px-3.5 lg:px-0">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-[1.2px] text-[#00F0FF] uppercase">
            MINING PLANS
          </span>
          <span className="px-1.5 py-0.2 rounded bg-[#00F0FF]/15 text-[10px] font-bold text-[#00F0FF]">
            {activeTiersCount} ACTIVE TIERS {comingSoonCount > 0 ? `+ ${comingSoonCount} COMING SOON` : ''}
          </span>
        </div>
        <h2 className="text-[22px] lg:text-[28px] font-bold text-[#F8FAFC]">
          Choose your allocation tier
        </h2>
        <p className="mt-1 text-[12px] lg:text-[14px] leading-[17px] text-[#94A3B8]">
          Plans allocated in Dollars ($). Upgrade anytime by paying the difference only. All rewards and earnings are fully withdrawable in <strong>USDT (BEP-20)</strong>.
        </p>
      </div>

      {/* Smart Auto-Upgrade & Single Plan Policy Banner */}
      <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#0C1E34] to-[#081526] border border-[#00F0FF]/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[12px] shadow-[0_0_20px_rgba(0,240,255,0.08)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">
              Strict Single-Active Node Policy + 🚀 Automatic Tier Upgrading
            </span>
            <span className="text-[#94A3B8] text-[11.5px]">
              Only 1 node runs at a time. When daily auto-compounding hits each tier threshold ($50, $150, $350...), your daily yield rate automatically upgrades!
            </span>
          </div>
        </div>
        {activeMiningPower > 0 && (
          <div className="flex items-center gap-2 bg-[#061220] px-3 py-1.5 rounded-xl border border-[#162740] shrink-0">
            <span className="text-[11px] text-[#94A3B8]">Current Node:</span>
            <span className="font-mono font-bold text-[#00F0FF]">${activeMiningPower.toFixed(2)} USD</span>
          </div>
        )}
      </div>

      {/* Plans List - Responsive Grid */}
      {(() => {
        const currentActivePlan = getPlanForAmount(activeMiningPower, plansToRender);
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plansToRender.map((plan) => {
              const isExpanded = expandedPlanId === plan.id;
              const isCurrentPlan = currentActivePlan?.id === plan.id;
              const isUpgrade = activeMiningPower > 0 && plan.amount > activeMiningPower;
              const isLowerPlan = activeMiningPower > 0 && !isCurrentPlan && plan.amount < (currentActivePlan ? currentActivePlan.amount : activeMiningPower);
              const diffAmount = isUpgrade ? +(plan.amount - activeMiningPower).toFixed(2) : plan.amount;

          return (
            <div
              key={plan.id}
              className={`rounded-[16px] bg-[#0C1424] border transition-all duration-300 p-4 shadow-lg flex flex-col justify-between ${
                plan.isComingSoon
                  ? 'border-[#F59E0B]/70 shadow-[0_0_25px_rgba(245,158,11,0.2)] bg-gradient-to-b from-[#1A1305] via-[#110D03] to-[#0C1424]'
                  : plan.isVip
                  ? 'border-[#A855F7]/70 shadow-[0_0_25px_rgba(168,85,247,0.2)] bg-gradient-to-b from-[#120D22] to-[#0C1424]'
                  : plan.isElite
                  ? 'border-[#FBBF24]/50 shadow-[0_0_20px_rgba(251,191,36,0.12)]'
                  : 'border-[#1B2A44]'
              }`}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCurrentPlan && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      ACTIVE
                    </span>
                  )}
                  {plan.isComingSoon && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#F59E0B]/20 border border-[#F59E0B]/50 text-[#FBBF24] text-[10px] font-black uppercase tracking-wider animate-pulse">
                      <Lock className="w-3 h-3" />
                      COMING SOON
                    </span>
                  )}
                  {!plan.isComingSoon && isUpgrade && (
                    <span className="px-1.5 py-0.5 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-[9.5px] font-bold">
                      UPGRADE (SAVE ${activeMiningPower})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {plan.isComingSoon ? (
                    <span className="flex items-center gap-1 text-[10px] font-black tracking-wider text-[#FBBF24] uppercase">
                      <Sparkles className="w-3 h-3" />
                      ELITE VIP
                    </span>
                  ) : plan.isVip ? (
                    <span className="flex items-center gap-1 text-[10px] font-black tracking-wider text-[#C084FC]">
                      <Sparkles className="w-3 h-3 text-[#C084FC]" />
                      VIP 2.0%
                    </span>
                  ) : plan.isElite ? (
                    <span className="text-[10px] font-bold tracking-wider text-[#FBBF24]">
                      INSTITUTIONAL
                    </span>
                  ) : null}

                  <div className="w-6 h-6 rounded-full bg-[#132238] flex items-center justify-center">
                    <Zap
                      className={`w-4 h-4 ${
                        plan.isComingSoon
                          ? 'text-[#FBBF24]'
                          : plan.isVip
                          ? 'text-[#C084FC]'
                          : plan.isElite
                          ? 'text-[#FBBF24]'
                          : 'text-[#00F0FF]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Plan Brand Name */}
              {plan.planName && (
                <div className="mt-1.5 flex items-center justify-between">
                  <h3 className="text-[17px] font-black tracking-wide text-white">
                    {plan.planName}
                  </h3>
                  <span className="text-[9.5px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/25 uppercase tracking-wider">
                    ASIC NODE
                  </span>
                </div>
              )}

              {/* Amount Row in Dollars */}
              <div className="mt-1.5 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-[20px] font-black text-[#00F0FF]">$</span>
                  <span className="text-[32px] font-black text-[#F8FAFC] tracking-tight font-mono">
                    {plan.amount.toLocaleString()}
                  </span>
                  <span className="text-[12px] font-bold text-[#94A3B8] uppercase ml-1">
                    USD
                  </span>
                </div>

                {isUpgrade && !plan.isComingSoon && (
                  <div className="text-right">
                    <span className="text-[10px] text-[#94A3B8] block">Upgrade Diff</span>
                    <span className="text-[14px] font-extrabold text-[#10B981] font-mono">
                      +${diffAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="my-3.5 h-px bg-[#152238]" />

              {/* Key Details */}
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Daily Reference Rate</span>
                  <span
                    className={`font-bold ${
                      plan.isComingSoon
                        ? 'text-[#FBBF24]'
                        : plan.isVip
                        ? 'text-[#C084FC]'
                        : plan.isElite
                        ? 'text-[#FBBF24]'
                        : 'text-[#F8FAFC]'
                    }`}
                  >
                    {plan.dailyRatePercent.toFixed(2)}% / day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Plan Duration</span>
                  <span className="font-semibold text-[#F8FAFC]">
                    {plan.durationDays} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Compounding</span>
                  <span className="font-semibold text-[#10B981]">
                    {plan.compoundingAvailable ? 'Available' : 'No'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectPlan(plan, isUpgrade, diffAmount)}
                disabled={isCurrentPlan || isLowerPlan}
                className={`mt-3.5 w-full h-[44px] rounded-lg font-bold text-[13.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                  isCurrentPlan
                    ? 'bg-[#122033] text-[#94A3B8] border border-[#1F304B] cursor-default'
                    : isLowerPlan
                    ? 'bg-[#0A101C] text-[#64748B] border border-[#162234] cursor-not-allowed'
                    : plan.isComingSoon
                    ? 'bg-gradient-to-r from-[#92400E] to-[#B45309] text-white border border-[#F59E0B]/70 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:brightness-110'
                    : isUpgrade
                    ? 'bg-gradient-to-r from-[#0284C7] to-[#10B981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110'
                    : 'bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-[0_0_15px_rgba(2,132,199,0.3)]'
                }`}
              >
                <span>
                  {isCurrentPlan
                    ? '✓ Current Active Node'
                    : isLowerPlan
                    ? '🔒 Locked (Higher Node Active)'
                    : plan.isComingSoon
                    ? '🔒 Coming Soon — Launching Soon!'
                    : isUpgrade
                    ? `⚡ Upgrade to ${plan.planName || ''} (Pay Diff $${diffAmount.toLocaleString()})`
                    : `⚡ Activate Plan ($${plan.amount})`}
                </span>
                {!isCurrentPlan && !isLowerPlan && !plan.isComingSoon && <ArrowRight className="w-4 h-4" />}
                {(plan.isComingSoon || isLowerPlan) && <Lock className="w-4 h-4" />}
              </button>

              {/* Expandable Breakdown Toggle */}
              <button
                onClick={() => toggleExpand(plan.id)}
                className="mt-2 w-full py-1 flex items-center justify-center gap-1 text-[12px] font-medium text-[#38BDF8] hover:text-[#00F0FF] transition-colors cursor-pointer"
              >
                <span>{isExpanded ? 'Hide 365D Math' : 'View 365D Compound Math'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Animated Expandable Mathematical Details */}
              {isExpanded && (
                <div className="mt-2 rounded-lg bg-[#070E1A] p-3 border border-[#14243A] space-y-2 text-[12px] animate-fadeIn">
                  <span className="text-[10px] font-bold tracking-wider text-[#FBBF24] uppercase block">
                    365-DAY ALLOCATION MATH
                  </span>

                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">
                      Day 1 Daily ({plan.dailyRatePercent}%)
                    </span>
                    <span className="font-semibold text-[#F8FAFC]">
                      +${(plan.amount * (plan.dailyRatePercent / 100)).toFixed(2)} / day
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Simple 365D Total (No Reinvest)</span>
                    <span className="font-semibold text-[#F8FAFC]">
                      ${plan.simpleTotalNoReinvest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Daily Reinvest 365D (Compound)</span>
                    <span className="font-semibold text-[#10B981]">
                      ${plan.dailyReinvestTotalCompound.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Day 365 Final Daily Yield</span>
                    <span className="font-semibold text-[#F8FAFC]">
                      +${plan.day365FinalDailyYield.toLocaleString(undefined, { minimumFractionDigits: 2 })} / day
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-[#14243A] pt-1.5">
                    <span className="text-[#94A3B8]">Total Compound Advantage</span>
                    <span className="font-bold text-[#FBBF24]">
                      +${plan.totalAdvantage.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <p className="mt-2 text-[10px] text-[#64748B]">
                ❄ Rewards earned in USD ($) · Withdrawals paid in USDT (BEP-20).
              </p>
            </div>
          );
        })}
      </div>
    );
  })()}
</section>
);
};
