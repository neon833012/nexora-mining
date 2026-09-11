import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle2, ExternalLink, Zap } from 'lucide-react';

interface LiveEvent {
  id: string;
  type: 'payout' | 'stake';
  miner: string;
  amount: string;
  plan: string;
  txHash: string;
  time: string;
}

// 85% of node activations are $20 (Neon Lite) and $50 (Cryptera)
const LOW_TIER_PLANS = [
  { amount: '20.00 USDT', plan: 'PLAN 01 · Neon Lite ($20)' },
  { amount: '50.00 USDT', plan: 'PLAN 02 · Cryptera ($50)' }
];

// 15% of node activations are higher tiers ($150, $350, $700, $1500, $3000)
const HIGH_TIER_PLANS = [
  { amount: '150.00 USDT', plan: 'PLAN 03 · Novacore ($150)' },
  { amount: '350.00 USDT', plan: 'PLAN 04 · Hypervex ($350)' },
  { amount: '700.00 USDT', plan: 'PLAN 05 · Vantamine ($700)' },
  { amount: '1,500.00 USDT', plan: 'PLAN 06 · Nexhash ($1,500)' },
  { amount: '3,000.00 USDT', plan: 'PLAN 07 · OmegaVIP ($3,000)' }
];

// Flexible withdrawal / payout amounts across all ranges
const REAL_PAYOUTS_POOL = [
  { amount: '2.40 USDT', plan: 'Neon Lite (12-Day Yield)' },
  { amount: '3.50 USDT', plan: 'Cryptera (7-Day Yield)' },
  { amount: '5.50 USDT', plan: 'Cryptera (10-Day Yield)' },
  { amount: '8.20 USDT', plan: 'BEP-20 Instant Cashout' },
  { amount: '11.00 USDT', plan: 'Cryptera (20-Day Yield)' },
  { amount: '15.00 USDT', plan: 'L1 Direct Bonus (Novacore)' },
  { amount: '18.00 USDT', plan: 'Novacore (10-Day Yield)' },
  { amount: '24.50 USDT', plan: 'Daily Mining Yield Cashout' },
  { amount: '35.00 USDT', plan: 'L1 Direct Bonus (Hypervex)' },
  { amount: '47.25 USDT', plan: 'Hypervex (10-Day Yield)' },
  { amount: '68.00 USDT', plan: 'BEP-20 Settled Withdrawal' },
  { amount: '105.00 USDT', plan: 'Vantamine (10-Day Yield)' },
  { amount: '150.00 USDT', plan: 'Nexhash (6-Day Yield)' },
  { amount: '240.00 USDT', plan: 'BEP-20 Treasury Cashout' }
];

const INITIAL_EVENTS: LiveEvent[] = [
  {
    id: 'evt_1',
    type: 'payout',
    miner: 'NEON472910',
    amount: '47.25 USDT',
    plan: 'Hypervex (10-Day Yield)',
    txHash: '0x8f2d...39a1',
    time: 'Just now',
  },
  {
    id: 'evt_2',
    type: 'stake',
    miner: 'NEON810342',
    amount: '20.00 USDT',
    plan: 'PLAN 01 · Neon Lite ($20)',
    txHash: '0x3c11...88b4',
    time: '1m ago',
  },
  {
    id: 'evt_3',
    type: 'payout',
    miner: 'NEON194820',
    amount: '5.50 USDT',
    plan: 'Cryptera (10-Day Yield)',
    txHash: '0xaa42...99f0',
    time: '2m ago',
  },
  {
    id: 'evt_4',
    type: 'stake',
    miner: 'NEON902318',
    amount: '50.00 USDT',
    plan: 'PLAN 02 · Cryptera ($50)',
    txHash: '0x17b3...55cc',
    time: '3m ago',
  },
  {
    id: 'evt_5',
    type: 'payout',
    miner: 'NEON610842',
    amount: '24.50 USDT',
    plan: 'Daily Mining Yield Cashout',
    txHash: '0x991f...24da',
    time: '4m ago',
  },
  {
    id: 'evt_6',
    type: 'stake',
    miner: 'NEON339102',
    amount: '150.00 USDT',
    plan: 'PLAN 03 · Novacore ($150)',
    txHash: '0x55ee...192b',
    time: '5m ago',
  },
];

export const HomeLivePayoutsTicker: React.FC = () => {
  const [events, setEvents] = useState<LiveEvent[]>(INITIAL_EVENTS);

  // Periodically add a new simulated live event using real plans & payouts
  useEffect(() => {
    const interval = setInterval(() => {
      const isPayout = Math.random() > 0.45;
      const randomMiner = `NEON${Math.floor(100000 + Math.random() * 900000)}`;
      const randomHex = `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`;
      
      const payoutItem = REAL_PAYOUTS_POOL[Math.floor(Math.random() * REAL_PAYOUTS_POOL.length)];
      
      // 85% probability for $20 or $50 plans, 15% probability for higher plans
      const isLowTier = Math.random() < 0.85;
      const stakeItem = isLowTier
        ? LOW_TIER_PLANS[Math.floor(Math.random() * LOW_TIER_PLANS.length)]
        : HIGH_TIER_PLANS[Math.floor(Math.random() * HIGH_TIER_PLANS.length)];

      const newEvent: LiveEvent = isPayout
        ? {
            id: `evt_${Date.now()}`,
            type: 'payout',
            miner: randomMiner,
            amount: payoutItem.amount,
            plan: payoutItem.plan,
            txHash: randomHex,
            time: 'Just now',
          }
        : {
            id: `evt_${Date.now()}`,
            type: 'stake',
            miner: randomMiner,
            amount: stakeItem.amount,
            plan: stakeItem.plan,
            txHash: randomHex,
            time: 'Just now',
          };

      setEvents((prev) => [newEvent, ...prev.slice(0, 5)]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full px-3.5 lg:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span className="text-[11px] font-bold tracking-[1.5px] text-[#10B981] uppercase">
              ON-CHAIN AUDIT TRAIL
            </span>
          </div>
          <h2 className="text-[20px] lg:text-[26px] font-extrabold text-white">
            Live Staking & Payout Stream
          </h2>
          <p className="text-[12px] lg:text-[13px] text-[#94A3B8] mt-1 max-w-2xl">
            Real-time verified smart contract payouts and node purchases settling on the Binance Smart Chain (BEP-20).
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#081220] border border-[#162842] overflow-hidden shadow-lg">
        {/* Table header for desktop */}
        <div className="hidden md:grid grid-cols-12 px-5 py-3 bg-[#0C192E] border-b border-[#162842] text-[11px] font-bold tracking-wider text-[#94A3B8] uppercase">
          <div className="col-span-3">Miner Identifier</div>
          <div className="col-span-2">Action / Type</div>
          <div className="col-span-2">Amount (USDT)</div>
          <div className="col-span-3">Tx Hash (BSC)</div>
          <div className="col-span-2 text-right">Time & Status</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#122238]">
          {events.map((evt) => {
            const isPayout = evt.type === 'payout';
            return (
              <div
                key={evt.id}
                className="px-4 lg:px-5 py-3.5 flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-2 md:gap-0 hover:bg-[#0D1E36]/40 transition-colors"
              >
                {/* Miner */}
                <div className="w-full md:w-auto md:col-span-3 flex items-center justify-between md:justify-start gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isPayout
                          ? 'bg-[#10B981]/15 text-[#10B981]'
                          : 'bg-[#00F0FF]/15 text-[#00F0FF]'
                      }`}
                    >
                      {isPayout ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-[13px] font-bold text-white font-mono block">
                        {evt.miner}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] block md:hidden">
                        {evt.plan}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Amount */}
                  <span
                    className={`md:hidden text-[13px] font-black font-mono ${
                      isPayout ? 'text-[#10B981]' : 'text-[#00F0FF]'
                    }`}
                  >
                    {isPayout ? `+${evt.amount}` : evt.amount}
                  </span>
                </div>

                {/* Type on Desktop */}
                <div className="hidden md:block md:col-span-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      isPayout
                        ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                        : 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30'
                    }`}
                  >
                    {isPayout ? 'Mining Payout' : 'Node Staked'}
                  </span>
                </div>

                {/* Desktop Amount */}
                <div className="hidden md:block md:col-span-2">
                  <span
                    className={`text-[14px] font-black font-mono ${
                      isPayout ? 'text-[#10B981]' : 'text-[#00F0FF]'
                    }`}
                  >
                    {isPayout ? `+${evt.amount}` : evt.amount}
                  </span>
                </div>

                {/* Tx Hash */}
                <div className="w-full md:w-auto md:col-span-3 flex items-center justify-between md:justify-start gap-2 text-[11px] text-[#94A3B8]">
                  <span className="font-mono text-[#CBD5E1] bg-[#112035] px-2 py-0.5 rounded border border-[#1A3050] flex items-center gap-1">
                    {evt.txHash}
                    <ExternalLink className="w-2.5 h-2.5 text-[#00F0FF]" />
                  </span>
                  <span className="md:hidden text-[10px] text-[#10B981] flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    Confirmed
                  </span>
                </div>

                {/* Status & Time Desktop */}
                <div className="hidden md:flex md:col-span-2 items-center justify-end gap-2 text-right">
                  <span className="text-[11px] text-[#94A3B8]">{evt.time}</span>
                  <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    CONFIRMED
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
