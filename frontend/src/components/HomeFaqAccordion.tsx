import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const HomeFaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First open by default

  const faqs: FaqItem[] = [
    {
      question: 'What is Neon Cloud Mining and how are daily returns generated?',
      answer:
        'Neon Mining provides seamless access to institutional-grade ASIC computing clusters (Antminer S21 Pro & Whatsminer M60S+) housed across 4 low-cost green energy facilities (Iceland, Norway, Texas, Canada). Instead of managing physical rigs, power, and cooling, you lease dedicated hashrate that automatically mines top proof-of-work protocols, with daily yields converted and credited directly in USDT to your account every 24 hours.',
    },
    {
      question: 'What is the minimum withdrawal limit and payout processing time?',
      answer:
        'The minimum withdrawal is set to just 2.00 USDT. Requests below $2.00 cannot be submitted. All payouts settle on the Binance Smart Chain (BEP-20) network with a flat 5% network gas and liquidity fee. Payouts are processed swiftly directly into your specified BEP-20 crypto wallet.',
    },
    {
      question: 'How does the Difference-Only Plan Upgrade work?',
      answer:
        'We never penalize active miners. If you currently hold a $20 Starter plan and wish to upgrade to a $50 Pro plan, you only pay the remaining $30 difference rather than the full $50. Your account hashrate and daily yield automatically increase to the new tier level upon confirmation.',
    },
    {
      question: 'Why do referral links require an active mining plan to earn commissions?',
      answer:
        'To prevent automated sybil attacks and bot network abuse, an account must hold at least one active staked plan (starting at $20 USDT) for its referral link and downline commissions to activate. Once active, you earn 10% Level 1, 5% Level 2, and 2% Level 3 rewards plus milestone turnover volume bonuses.',
    },
    {
      question: 'What is the 6-digit Fund Password and what if I forget it?',
      answer:
        'Your Fund Password is an additional financial security PIN required whenever you initiate a withdrawal request. It ensures your assets remain secure even if someone accesses your login device. If you ever forget your fund password, you can submit a reset request directly to our 24/7 audit support desk via the withdrawal screen or AI assistant.',
    },
  ];

  return (
    <section className="w-full px-3.5 lg:px-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-[11px] font-bold tracking-[1.5px] text-[#00F0FF] uppercase">
            CLEAR & TRANSPARENT
          </span>
        </div>
        <h2 className="text-[20px] lg:text-[26px] font-extrabold text-white">
          Frequently Asked Questions
        </h2>
        <p className="text-[12px] lg:text-[13px] text-[#94A3B8] mt-1 max-w-2xl">
          Everything you need to know about cloud mining contracts, difference upgrades, minimum cashouts, and security PINs.
        </p>
      </div>

      <div className="space-y-2.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.question}
              className={`rounded-xl border transition-all ${
                isOpen
                  ? 'bg-[#0A172A] border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.06)]'
                  : 'bg-[#081220] border-[#162740] hover:border-[#1F3658]'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer gap-3"
              >
                <span className="text-[13.5px] lg:text-[15px] font-bold text-white">
                  {faq.question}
                </span>
                <span className="w-7 h-7 rounded-lg bg-[#112035] flex items-center justify-center text-[#00F0FF] shrink-0 border border-[#1B3150]">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-[12.5px] lg:text-[13px] leading-[20px] text-[#94A3B8] border-t border-[#132338]">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
