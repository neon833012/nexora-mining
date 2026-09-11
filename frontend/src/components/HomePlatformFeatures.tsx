import React from 'react';
import {
  Zap,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const HomePlatformFeatures: React.FC = () => {
  const features = [
    {
      icon: DollarSign,
      color: '#10B981',
      title: '$2.00 Min Withdrawal',
      description: 'Lowest cashout threshold in the cloud mining space. Withdraw your earned USDT via BEP-20 as soon as you hit 2.00 USDT with zero artificial locks.',
      badge: 'User Friendly',
    },
    {
      icon: TrendingUp,
      color: '#00F0FF',
      title: 'Difference-Only Upgrade',
      description: 'Already staked on a $20 plan and want to scale to $50? Pay only the $30 difference rather than repurchasing. Your active hash rate scales instantly.',
      badge: 'Cost Efficient',
    },
    {
      icon: Zap,
      color: '#FBBF24',
      title: '24-Hour Automated Cycle',
      description: 'Mining rewards distribute every 24 hours like clockwork. Track your real-time countdown timer directly from the live telemetry console.',
      badge: 'Fully Automated',
    },
    {
      icon: RefreshCw,
      color: '#38BDF8',
      title: 'Exponential Compounding',
      description: 'Toggle automatic daily reinvestment with 1 click to compound your hash output over 365 days, turning 1.0% daily into massive annualized APY.',
      badge: 'High APY',
    },
    {
      icon: Users,
      color: '#A855F7',
      title: '3-Tier Affiliate Engine',
      description: 'Earn 10% Level 1, 5% Level 2, and 2% Level 3 commissions. Unlock up to +2% team turnover booster when your community volume hits milestones.',
      badge: 'Passive Income',
    },
    {
      icon: ShieldCheck,
      color: '#06B6D4',
      title: 'Dual Fund PIN Protection',
      description: 'Withdrawals are protected by a dedicated 6-digit Fund Password PIN separate from your login password, ensuring maximum asset isolation and security.',
      badge: 'Enterprise Security',
    },
  ];

  return (
    <section className="w-full px-3.5 lg:px-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-[11px] font-bold tracking-[1.5px] text-[#00F0FF] uppercase">
            WHY MINERS CHOOSE NEON MINING
          </span>
        </div>
        <h2 className="text-[20px] lg:text-[26px] font-extrabold text-white">
          Built For Yield. Engineered For Security.
        </h2>
        <p className="text-[12px] lg:text-[13px] text-[#94A3B8] mt-1 max-w-3xl">
          Everything you need for effortless, profitable cloud mining — from low minimum payouts to instant plan upgrades and transparent blockchain settlement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 lg:gap-4">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-4 rounded-xl bg-[#091424] border border-[#162740] hover:border-[#00F0FF]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border"
                    style={{
                      backgroundColor: `${item.color}15`,
                      borderColor: `${item.color}35`,
                      color: item.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${item.color}12`,
                      borderColor: `${item.color}30`,
                      color: item.color,
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-[15px] font-bold text-white mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[12px] leading-[18px] text-[#94A3B8]">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
