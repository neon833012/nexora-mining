import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calculator,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Award,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { MiningPlan } from '../types/mining';
import { MINING_PLANS } from '../data/miningPlans';

interface Props {
  miningPlans?: MiningPlan[];
  onSelectPlan?: (plan: MiningPlan) => void;
}

export const InteractiveMiningCalculator: React.FC<Props> = ({
  miningPlans,
  onSelectPlan
}) => {
  const plans = useMemo(
    () => (miningPlans && miningPlans.length > 0 ? miningPlans : MINING_PLANS),
    [miningPlans]
  );

  // Default to Plan 03 (Novacore - $150) or first plan
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const defaultPlan = plans.find((p) => p.amount === 150) || plans[0];
    return defaultPlan ? defaultPlan.id : 'plan_150';
  });

  const currentPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || plans[0],
    [plans, selectedPlanId]
  );

  const [amountText, setAmountText] = useState<string>(() =>
    currentPlan ? currentPlan.amount.toString() : '150'
  );
  const [days, setDays] = useState<number>(365);
  const [compoundingOn, setCompoundingOn] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // When a user clicks a plan preset chip
  const handleChoosePlan = (plan: MiningPlan) => {
    setSelectedPlanId(plan.id);
    setAmountText(plan.amount.toString());
    setDays(plan.durationDays || 365);
  };

  const numAmount = parseFloat(amountText) || 0;

  // Determine effective daily rate based on exact plan or custom amount bracket
  const effectiveDailyRatePercent = useMemo(() => {
    // If user input matches current selected plan's amount
    if (currentPlan && numAmount === currentPlan.amount) {
      return currentPlan.dailyRatePercent;
    }
    // If user input matches another plan's exact amount
    const exactMatch = plans.find((p) => p.amount === numAmount);
    if (exactMatch) {
      return exactMatch.dailyRatePercent;
    }
    // If custom amount, find highest bracket
    const sorted = [...plans].sort((a, b) => a.amount - b.amount);
    let matchedRate = sorted[0]?.dailyRatePercent || 1.0;
    for (const p of sorted) {
      if (numAmount >= p.amount) {
        matchedRate = p.dailyRatePercent;
      }
    }
    return matchedRate;
  }, [plans, currentPlan, numAmount]);

  const dailyRate = effectiveDailyRatePercent / 100;
  const dailyRewardInitial = +(numAmount * dailyRate).toFixed(2);

  // Accurate Calculation based on Plan's official values when matching 365 days
  const isExactPlanMatch = currentPlan && numAmount === currentPlan.amount && days === 365;

  const projectedTotal = useMemo(() => {
    if (numAmount <= 0) return 0;
    if (compoundingOn) {
      if (isExactPlanMatch && currentPlan.dailyReinvestTotalCompound) {
        return currentPlan.dailyReinvestTotalCompound;
      }
      return +(numAmount * Math.pow(1.0 + dailyRate, days)).toFixed(2);
    } else {
      if (isExactPlanMatch && currentPlan.simpleTotalNoReinvest) {
        return currentPlan.simpleTotalNoReinvest;
      }
      return +(numAmount + numAmount * dailyRate * days).toFixed(2);
    }
  }, [numAmount, compoundingOn, isExactPlanMatch, currentPlan, dailyRate, days]);

  const netGain = Math.max(0, +(projectedTotal - numAmount).toFixed(2));
  const multiplier = numAmount > 0 ? +(projectedTotal / numAmount).toFixed(2) : 0;

  // Simple total for comparison to calculate compounding advantage
  const simpleTotal = isExactPlanMatch && currentPlan.simpleTotalNoReinvest
    ? currentPlan.simpleTotalNoReinvest
    : +(numAmount + numAmount * dailyRate * days).toFixed(2);

  const compoundingAdvantage = Math.max(0, +(projectedTotal - simpleTotal).toFixed(2));

  // Day 365 Final Daily Yield
  const day365Yield = useMemo(() => {
    if (!compoundingOn) return dailyRewardInitial;
    if (isExactPlanMatch && currentPlan.day365FinalDailyYield) {
      return currentPlan.day365FinalDailyYield;
    }
    return +(projectedTotal * dailyRate).toFixed(2);
  }, [compoundingOn, isExactPlanMatch, currentPlan, projectedTotal, dailyRate, dailyRewardInitial]);

  // Render Canvas Growth Curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Subtle horizontal gridline
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();

    // Draw growth curve
    ctx.strokeStyle = compoundingOn ? '#FBBF24' : '#00F0FF';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.88);

    const steps = 40;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const x = progress * w;
      // Exponential curve for compounding, linear curve for simple
      const y = compoundingOn
        ? h * (0.88 - 0.82 * Math.pow(progress, 2.2))
        : h * (0.88 - 0.55 * progress);
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Area fill under curve
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(
      0,
      compoundingOn ? 'rgba(251, 191, 36, 0.18)' : 'rgba(0, 240, 255, 0.18)'
    );
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [compoundingOn, days, numAmount, dailyRate]);

  return (
    <section className="w-full px-3.5 lg:px-0">
      <div className="rounded-[18px] lg:rounded-[24px] bg-[#0A1322] border border-[#182C48] p-4 lg:p-7 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#132338]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black tracking-[1.3px] text-[#00F0FF] uppercase bg-[#00F0FF]/10 px-2.5 py-0.5 rounded-full border border-[#00F0FF]/30">
                PROFITABILITY MATRIX
              </span>
              <span className="text-[10px] font-mono text-[#FBBF24] bg-[#FBBF24]/10 px-2 py-0.5 rounded-full border border-[#FBBF24]/30 font-bold">
                100% PLAN-ALIGNED
              </span>
            </div>
            <h3 className="text-[19px] lg:text-[24px] font-black text-[#F8FAFC]">
              Mining Plan Profit Calculator
            </h3>
            <p className="text-[11.5px] lg:text-[13px] text-[#94A3B8] max-w-2xl leading-relaxed mt-0.5">
              Select any official Neon Mining BEP-20 node plan to simulate exact daily earnings, 365-day yields, and automated compound acceleration.
            </p>
          </div>
          <div className="w-11 h-11 lg:w-13 lg:h-13 rounded-2xl bg-[#0F2238] border border-[#1E3B60] flex items-center justify-center text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)] shrink-0">
            <Calculator className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
        </div>

        {/* 1. Official Mining Plans Selector Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#CBD5E1] tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Select Official Plan ({plans.length} Tiers Available)</span>
            </span>
            {currentPlan && (
              <span className="text-[11px] font-mono text-[#00F0FF] font-bold">
                {currentPlan.planNumber}: {currentPlan.planName} (${currentPlan.amount}) · {currentPlan.dailyRatePercent}%/day
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {plans.map((plan) => {
              const isSelected = plan.id === selectedPlanId || (numAmount === plan.amount && isExactPlanMatch);
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleChoosePlan(plan)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#0C2744] to-[#08182B] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-1 ring-[#00F0FF]/50'
                      : 'bg-[#060E1A] border-[#16273E] hover:border-[#223E63] text-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9.5px] font-mono font-bold ${isSelected ? 'text-[#00F0FF]' : 'text-[#64748B]'}`}>
                      {plan.planNumber}
                    </span>
                    {plan.isElite && (
                      <span className="text-[8.5px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        ELITE
                      </span>
                    )}
                  </div>
                  <div className={`text-[12.5px] font-black truncate mt-0.5 ${isSelected ? 'text-white' : 'text-[#CBD5E1]'}`}>
                    {plan.planName}
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-[14px] font-mono font-black text-white">
                      ${plan.amount}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#10B981]">
                      {plan.dailyRatePercent}%/d
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 2-Column Responsive Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start pt-1">
          {/* Left Column: Interactive Inputs & Controls */}
          <div className="lg:col-span-5 space-y-4">
            {/* Amount Field */}
            <div className="p-4 rounded-2xl bg-[#070F1C] border border-[#162942] space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-[11.5px]">
                <label className="font-bold text-[#CBD5E1]">
                  Investment Capital ($ USDT)
                </label>
                <span className="text-[11px] font-mono text-[#10B981] font-bold">
                  Daily Yield: {effectiveDailyRatePercent}%
                </span>
              </div>

              <div className="relative rounded-xl bg-[#040912] border border-[#1E3452] focus-within:border-[#00F0FF] transition-colors shadow-inner">
                <input
                  type="text"
                  value={amountText}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) {
                      setAmountText(val);
                    }
                  }}
                  className="w-full bg-transparent px-3.5 py-3 text-[18px] font-black text-white focus:outline-none font-mono"
                  placeholder="150"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12.5px] font-bold font-mono text-[#00F0FF]">
                  USDT
                </span>
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleChoosePlan(p)}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                      numAmount === p.amount
                        ? 'bg-[#00F0FF] text-[#051322] shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                        : 'bg-[#0B1728] text-[#94A3B8] border border-[#162C48] hover:text-white'
                    }`}
                  >
                    ${p.amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="p-4 rounded-2xl bg-[#070F1C] border border-[#162942] space-y-2.5 shadow-inner">
              <div className="flex justify-between items-center text-[12px]">
                <span className="font-bold text-[#CBD5E1]">Contract Duration</span>
                <span className="font-bold text-[#38BDF8] font-mono text-[14px]">
                  {days} Days {days === 365 && '(Full Cycle)'}
                </span>
              </div>

              {/* Quick Duration Pills */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '30 Days', val: 30 },
                  { label: '90 Days', val: 90 },
                  { label: '180 Days', val: 180 },
                  { label: '365 Days', val: 365 }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDays(item.val)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
                      days === item.val
                        ? 'bg-[#0284C7] text-white border border-[#38BDF8] shadow-sm'
                        : 'bg-[#0B1728] text-[#94A3B8] border border-[#162C48] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full mt-1 h-2 bg-[#12243C] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
              />
            </div>

            {/* Compounding Switch */}
            <div className="rounded-2xl bg-[#070F1C] border border-[#162942] p-4 flex items-center justify-between shadow-inner">
              <div>
                <div className="text-[13px] font-black text-white flex items-center gap-1.5">
                  <Flame className={`w-4 h-4 ${compoundingOn ? 'text-[#FBBF24]' : 'text-[#64748B]'}`} />
                  <span>Daily Reinvestment Compounding</span>
                </div>
                <div className={`text-[11px] font-medium mt-0.5 ${compoundingOn ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                  {compoundingOn
                    ? '⚡ Exponential automated daily balance reinvestment'
                    : 'Linear simple daily yield payout without reinvestment'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCompoundingOn(!compoundingOn)}
                className={`w-13 h-7 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ml-3 ${
                  compoundingOn ? 'bg-[#0284C7]' : 'bg-[#152338]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    compoundingOn ? 'translate-x-6 bg-[#00F0FF]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Smart Auto-Upgrade Dynamic Alert */}
            {compoundingOn && (
              <div className="rounded-2xl bg-gradient-to-r from-[#071F1B] to-[#081726] border border-[#10B981]/40 p-3.5 flex items-start gap-2.5 text-[11.5px] shadow-sm animate-fadeIn">
                <div className="w-6 h-6 rounded-lg bg-[#10B981]/20 border border-[#10B981]/50 flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#A7F3D0] block">
                    Automatic Tier Upgrade Algorithm Active
                  </strong>
                  <span className="text-[#94A3B8] leading-[16px] block mt-0.5">
                    As your daily compounded balance crosses each plan threshold ($50 ➔ 1.1%, $150 ➔ 1.2%, $350 ➔ 1.35%...), your node rate auto-upgrades immediately!
                  </span>
                </div>
              </div>
            )}

            {/* Direct Plan Activation CTA */}
            {onSelectPlan && currentPlan && (
              <button
                type="button"
                onClick={() => onSelectPlan(currentPlan)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0284C7] via-[#00F0FF] to-[#0284C7] bg-[length:200%_auto] hover:bg-right transition-all text-[#031526] font-black text-[13.5px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>Activate {currentPlan.planName} Plan (${currentPlan.amount} USDT)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Column: Dynamic Growth Canvas + Projection Metrics */}
          <div className="lg:col-span-7 space-y-4">
            {/* Canvas Growth Curve */}
            <div className="p-4 rounded-2xl bg-[#070F1C] border border-[#162942] shadow-inner space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black tracking-wider text-[#94A3B8] uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>PROJECTED YIELD TRAJECTORY</span>
                </span>
                <span
                  className={`text-[10.5px] font-mono font-bold ${
                    compoundingOn ? 'text-[#FBBF24]' : 'text-[#00F0FF]'
                  }`}
                >
                  {compoundingOn ? '⚡ Exponential Compounding Growth' : 'Linear Daily Mining Curve'}
                </span>
              </div>
              <div className="relative w-full h-[120px] lg:h-[150px] rounded-xl bg-[#040912] border border-[#132338] p-2 overflow-hidden shadow-inner">
                <canvas ref={canvasRef} className="w-full h-full" />
              </div>
            </div>

            {/* 4-Card Projection Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl bg-[#070F1C] border border-[#162942] p-3 shadow-md">
                <span className="text-[9.5px] font-bold tracking-wider text-[#94A3B8] uppercase block">
                  DAILY ({effectiveDailyRatePercent}%)
                </span>
                <span className="text-[17px] font-black text-[#38BDF8] mt-1 block font-mono">
                  ${dailyRewardInitial.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#64748B]">USDT / day</span>
              </div>

              <div className="rounded-xl bg-[#070F1C] border border-[#162942] p-3 shadow-md">
                <span className="text-[9.5px] font-bold tracking-wider text-[#94A3B8] uppercase block">
                  PROJECTED TOTAL
                </span>
                <span
                  className={`text-[17px] font-black mt-1 block font-mono ${
                    compoundingOn ? 'text-[#FBBF24]' : 'text-[#00F0FF]'
                  }`}
                >
                  ${projectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#64748B]">USDT in {days}d</span>
              </div>

              <div className="rounded-xl bg-[#070F1C] border border-[#162942] p-3 shadow-md">
                <span className="text-[9.5px] font-bold tracking-wider text-[#94A3B8] uppercase block">
                  ESTIMATED PROFIT
                </span>
                <span className="text-[17px] font-black text-[#10B981] mt-1 block font-mono">
                  +${netGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#64748B]">Pure Net Return</span>
              </div>

              <div className="rounded-xl bg-[#070F1C] border border-[#162942] p-3 shadow-md">
                <span className="text-[9.5px] font-bold tracking-wider text-[#94A3B8] uppercase block">
                  ROI MULTIPLIER
                </span>
                <span className="text-[17px] font-black text-white mt-1 block font-mono">
                  {multiplier.toFixed(2)}x
                </span>
                <span className="text-[10px] text-[#64748B]">Capital Multiple</span>
              </div>
            </div>

            {/* Compounding Advantage Highlight Strip */}
            {compoundingOn && compoundingAdvantage > 0 && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#171406] via-[#1C1608] to-[#120E04] border border-[#F59E0B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FBBF24]/15 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24] shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[12px] font-black text-[#FDE68A] block">
                      Compounding Advantage: +${compoundingAdvantage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                    </span>
                    <span className="text-[10.5px] text-[#94A3B8]">
                      Extra return generated solely by automated daily reinvestment vs simple daily yield.
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9.5px] text-[#94A3B8] uppercase font-bold block">Day 365 Daily Yield</span>
                  <span className="text-[14px] font-mono font-black text-[#FBBF24]">
                    ${day365Yield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-[#060E1A] border border-[#132236] flex items-start gap-2 text-[10.5px] text-[#64748B] leading-[15px]">
              <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>
                Calculated strictly in accordance with Neon Smart Contract BEP-20 parameters. Yields accrue every 24 hours and are liquidly withdrawable to any personal BEP-20 wallet address.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
