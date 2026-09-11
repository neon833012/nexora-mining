import React from 'react';
import { UserPlus, Wallet, Zap, LineChart, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    stepNum: 'STEP 01',
    title: 'Create Account',
    description: 'Instant registration with auto-generated NEON ID and referral link activation.',
    icon: UserPlus,
    accentColor: '#00F0FF',
  },
  {
    stepNum: 'STEP 02',
    title: 'Fund Wallet',
    description: 'Add USDT via fast Binance Smart Chain (BEP-20) network with 0-delay confirmation.',
    icon: Wallet,
    accentColor: '#38BDF8',
  },
  {
    stepNum: 'STEP 03',
    title: 'Stake Mining Node',
    description: 'Select your computing tier ($20 - $3,000) with up to 2% daily return and unlock automated 24-hour payouts.',
    icon: Zap,
    accentColor: '#FBBF24',
  },
  {
    stepNum: 'STEP 04',
    title: 'Compound or Cashout',
    description: 'Reinvest daily yield to compound earnings or withdraw anytime once reaching $2.00 USDT.',
    icon: LineChart,
    accentColor: '#10B981',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="w-full px-3.5 lg:px-0">
      {/* Header */}
      <div className="mb-4">
        <span className="text-[11px] font-bold tracking-[1.5px] text-[#00F0FF] uppercase">
          EASY 4-STEP ONBOARDING
        </span>
        <h2 className="text-[20px] lg:text-[26px] font-extrabold text-[#F8FAFC]">
          How Neon Cloud Mining Works
        </h2>
        <p className="mt-1 text-[12px] lg:text-[13px] text-[#94A3B8] max-w-2xl">
          From account generation to daily automated USDT payouts. Zero hardware setup or technical knowledge needed.
        </p>
      </div>

      {/* Steps Grid (1 col on mobile, 2 on tablet, 4 on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.stepNum}
              className="relative rounded-2xl bg-[#091424] border border-[#172A45] p-4 lg:p-5 flex flex-col justify-between shadow-md hover:border-[#00F0FF]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${step.accentColor}15`,
                      borderColor: `${step.accentColor}35`,
                      color: step.accentColor,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className="text-[11px] font-black tracking-wider uppercase font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${step.accentColor}10`,
                      borderColor: `${step.accentColor}30`,
                      color: step.accentColor,
                    }}
                  >
                    {step.stepNum}
                  </span>
                </div>

                <h3 className="text-[15px] lg:text-[16px] font-bold text-white mb-1.5">
                  {step.title}
                </h3>
                <p className="text-[12px] leading-[18px] text-[#94A3B8]">
                  {step.description}
                </p>
              </div>

              {idx < STEPS.length - 1 && (
                <div className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-[#475569] mt-3 pt-2 border-t border-[#132338]">
                  <span>Next Step</span>
                  <ArrowRight className="w-3 h-3 text-[#00F0FF]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
