import React from 'react';
import { X, Sparkles, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { MiningPlan } from '../types/mining';
import { MINING_PLANS } from '../data/miningPlans';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  onSelectPlan: (plan: MiningPlan) => void;
  onViewAllPlans: () => void;
  adminPopupImageUrl?: string;
  adminPopupLinkUrl?: string;
  miningPlans?: MiningPlan[];
}

export const PromotionalPlanPopupModal: React.FC<Props> = ({
  isOpen,
  onDismiss,
  onSelectPlan,
  onViewAllPlans,
  adminPopupImageUrl = '',
  adminPopupLinkUrl = '',
  miningPlans = MINING_PLANS
}) => {
  if (!isOpen) return null;

  // ── ADMIN IMAGE MODE: Show custom uploaded image instead of plan cards ──
  if (adminPopupImageUrl) {
    const handleImageClick = () => {
      if (adminPopupLinkUrl) {
        if (adminPopupLinkUrl.startsWith('#') || adminPopupLinkUrl.startsWith('/')) {
          window.location.hash = adminPopupLinkUrl.replace('#', '');
        } else {
          window.open(adminPopupLinkUrl, '_blank');
        }
      }
      onDismiss();
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
        <div className="absolute inset-0" onClick={onDismiss} />
        <div className="relative z-10 w-full max-w-[420px] animate-scaleUp">
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-[#0D1A30] border border-[#1E3354] hover:border-red-500/60 flex items-center justify-center text-[#94A3B8] hover:text-white transition-all cursor-pointer shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Image */}
          <div
            onClick={handleImageClick}
            className={`rounded-2xl overflow-hidden border border-[#00F0FF]/30 shadow-[0_0_40px_rgba(0,240,255,0.2)] ${adminPopupLinkUrl ? 'cursor-pointer hover:brightness-105 transition-all' : ''}`}
          >
            <img
              src={adminPopupImageUrl}
              alt="Neon Mining Promotion"
              className="w-full h-auto block"
            />
          </div>

          {/* Skip text */}
          <button
            onClick={onDismiss}
            className="mt-2 w-full text-center text-[11px] text-[#64748B] hover:text-[#94A3B8] cursor-pointer transition-colors"
          >
            Tap anywhere or press ✕ to close
          </button>
        </div>
      </div>
    );
  }

  // ── DEFAULT MODE: Show plan cards ──
  // Top 3 featured plans
  const featuredPlans = miningPlans.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop handler */}
      <div className="absolute inset-0" onClick={onDismiss} />

      {/* Modal Container - Compact & responsive */}
      <div className="relative z-10 w-full max-w-[370px] sm:max-w-[620px] lg:max-w-[760px] rounded-2xl bg-[#091222] border border-[#00F0FF]/40 shadow-[0_0_35px_rgba(0,240,255,0.25)] overflow-hidden animate-scaleUp max-h-[82vh] sm:max-h-[90vh] flex flex-col">
        {/* Glow accent banner */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#10B981]" />

        {/* Modal Header */}
        <div className="p-3 sm:p-5 pb-2.5 sm:pb-3 border-b border-[#162742] relative flex items-start justify-between gap-2">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-[9.5px] sm:text-[10.5px] font-extrabold tracking-wider">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
              <span>SPECIAL PROMOTION · FEATURED CONTRACTS</span>
            </div>
            <h2 className="text-[16px] sm:text-[22px] font-black text-white tracking-tight leading-tight">
              Start Cloud Mining Today
            </h2>
            <p className="text-[10.5px] sm:text-[12.5px] text-[#94A3B8] line-clamp-1 sm:line-clamp-none">
              Choose an ASIC mining node to start receiving daily automated 24H yields.
            </p>
          </div>

          {/* Close / Cut button */}
          <button
            onClick={onDismiss}
            aria-label="Close"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0D1A30] hover:bg-[#1A2D4F] border border-[#1E3354] hover:border-red-500/50 flex items-center justify-center text-[#94A3B8] hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Modal Body: Mobile Compact Rows (< sm) AND Desktop 3-Card Grid (>= sm) */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          {/* MOBILE COMPACT VIEW (< 640px) */}
          <div className="space-y-2 sm:hidden">
            {featuredPlans.map((plan, index) => {
              const isPopular = index === 1;
              const isBestValue = index === 2;

              return (
                <div
                  key={plan.id}
                  onClick={() => onSelectPlan(plan)}
                  className={`p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                    isPopular
                      ? 'bg-gradient-to-r from-[#0A223D] to-[#081529] border border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : isBestValue
                      ? 'bg-gradient-to-r from-[#092523] to-[#07171E] border border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-[#0B172B] border border-[#182C48]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-12 h-11 rounded-lg bg-[#050C18] border border-[#162740] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[14px] font-black font-mono text-white leading-none">
                        ${plan.amount}
                      </span>
                      <span className="text-[7.5px] font-bold text-[#94A3B8] uppercase">USD</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-bold text-white truncate">
                          {plan.planName}
                        </span>
                        {isPopular && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] text-[8px] font-black">
                            POPULAR
                          </span>
                        )}
                        {isBestValue && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#10B981]/20 text-[#10B981] text-[8px] font-black">
                            BEST
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] mt-0.5">
                        <span className="text-[#10B981] font-bold">+{plan.dailyRatePercent}% / day</span>
                        <span>·</span>
                        <span>{plan.amount} TH/s</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                      isPopular
                        ? 'bg-[#00F0FF] text-[#021020] shadow-sm'
                        : isBestValue
                        ? 'bg-[#10B981] text-[#021810]'
                        : 'bg-[#11233D] text-[#00F0FF] border border-[#1E3A60]'
                    }`}
                  >
                    <span>Select</span>
                    <Zap className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* DESKTOP 3-CARD VIEW (>= sm) */}
          <div className="hidden sm:grid sm:grid-cols-3 sm:gap-3">
            {featuredPlans.map((plan, index) => {
              const isPopular = index === 1;
              const isBestValue = index === 2;

              return (
                <div
                  key={plan.id}
                  onClick={() => onSelectPlan(plan)}
                  className={`relative rounded-xl p-3.5 flex flex-col justify-between transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                    isPopular
                      ? 'bg-gradient-to-b from-[#0A223D] to-[#081529] border-2 border-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.25)] hover:border-[#38BDF8]'
                      : isBestValue
                      ? 'bg-gradient-to-b from-[#092523] to-[#07171E] border border-[#10B981]/80 hover:border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : 'bg-[#0B172B] border border-[#182C48] hover:border-[#00F0FF]/50'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021020] text-[9.5px] font-black tracking-wider shadow-md whitespace-nowrap">
                      🔥 MOST POPULAR
                    </div>
                  )}
                  {isBestValue && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#10B981] text-[#021810] text-[9.5px] font-black tracking-wider shadow-md whitespace-nowrap">
                      ⭐ BEST VALUE
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[12px] font-black tracking-wide text-white">
                        {plan.planName}
                      </span>
                      <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 px-1.5 py-0.5 rounded">
                        {plan.dailyRatePercent}% Daily
                      </span>
                    </div>

                    <div className="mt-2 text-center py-1">
                      <div className="text-[26px] sm:text-[28px] font-black font-mono text-white leading-none">
                        ${plan.amount}
                      </div>
                      <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">
                        USD ($) Allocation
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#192C47] space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-[#CBD5E1]">
                        <span>Hashpower:</span>
                        <strong className="font-mono text-[#00F0FF]">{plan.amount} TH/s</strong>
                      </div>
                      <div className="flex items-center justify-between text-[#CBD5E1]">
                        <span>Est. Daily:</span>
                        <strong className="font-mono text-[#10B981]">
                          +${(plan.amount * (plan.dailyRatePercent / 100)).toFixed(2)} / day
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[#CBD5E1]">
                        <span>Contract:</span>
                        <strong className="text-white">{plan.durationDays} Days</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`mt-3.5 w-full py-2 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-[#00F0FF] to-[#0284C7] text-[#021020] hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                        : isBestValue
                        ? 'bg-[#10B981] text-[#021810] hover:brightness-110 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-[#11233D] hover:bg-[#162D4E] text-[#00F0FF] border border-[#1E3A60]'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Choose Plan</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-2.5 sm:p-4 bg-[#070D18] border-t border-[#162742] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#94A3B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
            <span className="truncate">Instant Deployment · Payouts in USDT (BEP-20)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDismiss}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-[11.5px] font-semibold text-[#94A3B8] hover:text-white hover:bg-[#112038] transition-colors cursor-pointer"
            >
              Cut / Skip
            </button>
            <button
              onClick={() => {
                onDismiss();
                onViewAllPlans();
              }}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#0E1E36] hover:bg-[#152B4D] border border-[#213B63] text-[#00F0FF] text-[11px] sm:text-[11.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>View Plans</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
