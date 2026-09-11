import React from 'react';
import { X, ArrowUpRight, Sparkles } from 'lucide-react';
import { MiningPlan } from '../types/mining';

interface Props {
  plan: MiningPlan | null;
  isUpgrade?: boolean;
  activeMiningPower?: number;
  diffAmount?: number;
  onDismiss: () => void;
  onConfirmActivation: (plan: MiningPlan, diffAmount?: number) => void;
}

export const PlanActivationDialog: React.FC<Props> = ({
  plan,
  isUpgrade = false,
  activeMiningPower = 0,
  diffAmount,
  onDismiss,
  onConfirmActivation
}) => {
  if (!plan) return null;

  const cost = isUpgrade && diffAmount !== undefined ? diffAmount : plan.amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-[390px] rounded-2xl bg-[#0C1424] border border-[#1F304B] p-5 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span
              className={`text-[11px] font-bold tracking-wider uppercase ${
                isUpgrade ? 'text-[#10B981]' : 'text-[#00F0FF]'
              }`}
            >
              {isUpgrade ? '⚡ TIER UPGRADE (PAY DIFF ONLY)' : `${plan.planName || 'MINING NODE'} ALLOCATION`}
            </span>
            <h3 className="text-[20px] font-bold text-[#F8FAFC] mt-0.5">
              {isUpgrade
                ? `Upgrade to ${plan.planName || `$${plan.amount.toLocaleString()} Plan`}`
                : `Activate ${plan.planName || `$${plan.amount.toLocaleString()} Plan`}`}
            </h3>
          </div>

          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upgrade Difference Banner */}
        {isUpgrade && (
          <div className="mt-3 p-3 rounded-xl bg-[#062419] border border-[#10B981]/50 text-[12px] space-y-1">
            <div className="flex justify-between text-[#A7F3D0]">
              <span>Active Current Plan:</span>
              <strong className="text-white">${activeMiningPower.toLocaleString()} USD</strong>
            </div>
            <div className="flex justify-between text-[#A7F3D0]">
              <span>New Target Tier:</span>
              <strong className="text-white">${plan.amount.toLocaleString()} USD</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#10B981]/30 font-bold text-[#10B981]">
              <span>Amount You Pay Today:</span>
              <span className="text-[14px]">+${cost.toLocaleString()} USD</span>
            </div>
          </div>
        )}

        {/* Breakdown Box */}
        <div className="mt-3 rounded-lg bg-[#070E1A] p-3 border border-[#14243A] space-y-2 text-[12px]">
          <div className="flex justify-between">
            <span className="text-[#94A3B8]">
              Daily Yield ({plan.dailyRatePercent.toFixed(2)}%):
            </span>
            <span className="font-bold text-[#10B981]">
              +${(plan.amount * (plan.dailyRatePercent / 100)).toFixed(2)} / day
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#94A3B8]">Compounding Potential (365D):</span>
            <span className="font-bold text-[#FBBF24]">
              ${plan.dailyReinvestTotalCompound.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#94A3B8]">Payout Protocol:</span>
            <span className="font-bold text-[#00F0FF]">USDT (BEP-20)</span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => onConfirmActivation(plan, cost)}
          className={`mt-4 w-full h-[46px] rounded-lg text-white font-bold text-[14px] shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
            isUpgrade
              ? 'bg-gradient-to-r from-[#0284C7] to-[#10B981] hover:brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-[#0284C7] hover:bg-[#0369A1] shadow-[0_0_15px_rgba(2,132,199,0.3)]'
          }`}
        >
          <span>
            {isUpgrade
              ? `Confirm Upgrade (+$${cost.toLocaleString()})`
              : `Confirm & Start Mining ($${cost.toLocaleString()})`}
          </span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
