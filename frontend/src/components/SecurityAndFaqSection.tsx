import React, { useState } from 'react';
import {
  FileText,
  Shield,
  Lock,
  History,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FAQ_ITEMS } from '../data/miningPlans';

const SECURITY_CARDS = [
  {
    title: 'Blockchain Transactions',
    description: 'BEP-20 network interactions with visible transaction hashes for transparent verification on BscScan.',
    icon: FileText
  },
  {
    title: 'Wallet Security',
    description: 'Guidance on non-custodial best practices, session seed handling, and hardware wallet usage for user-controlled funds.',
    icon: Shield
  },
  {
    title: 'Account Protection',
    description: 'Strong password requirements, session management, and rate-limited authentication endpoints on the platform side.',
    icon: Lock
  },
  {
    title: 'Transaction History',
    description: 'Every account action is recorded in a transparent activity log accessible directly from your dashboard.',
    icon: History
  },
  {
    title: 'Reward Calculation',
    description: 'Displayed rewards are deterministic mathematical projections based on the amount, reference rate, and duration you select.',
    icon: BarChart3
  },
  {
    title: 'User Dashboard',
    description: 'Consolidated overview showing balances, active plans, projected rewards, referrals, and withdrawal availability at a glance.',
    icon: ShieldCheck
  }
];

export const SecurityAndFaqSection: React.FC = () => {
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="w-full space-y-7">
      {/* 1. Security & Transparency Section */}
      <section className="w-full px-4">
        <div>
          <span className="text-[11px] font-bold tracking-[1.2px] text-[#00F0FF] uppercase">
            SECURITY & TRANSPARENCY
          </span>
          <h2 className="text-[22px] font-bold text-[#F8FAFC]">
            Six pillars of a credible protocol
          </h2>
          <p className="mt-1 text-[12px] leading-[17px] text-[#94A3B8]">
            NEON publishes the mathematics behind projections and prioritizes user-controlled security practices.
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {SECURITY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-xl bg-[#0B1322] border border-[#192840] p-3.5 flex items-start gap-3 shadow-md"
              >
                <div className="w-9 h-9 rounded-lg bg-[#132238] flex items-center justify-center text-[#00F0FF] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-bold text-[#F8FAFC]">
                    {card.title}
                  </h3>
                  <p className="text-[11px] leading-[15px] text-[#94A3B8] mt-0.5">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. FAQ Section */}
      <section className="w-full px-4">
        <div>
          <span className="text-[11px] font-bold tracking-[1.2px] text-[#00F0FF] uppercase">
            FAQ
          </span>
          <h2 className="text-[22px] font-bold text-[#F8FAFC]">
            Frequently asked questions
          </h2>
          <p className="mt-1 text-[12px] text-[#94A3B8]">
            Clear, neutral explanations of how the platform works.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = expandedFaqIndex === index;
            return (
              <div
                key={faq.question}
                onClick={() => toggleFaq(index)}
                className={`rounded-[10px] p-3.5 border transition-all cursor-pointer ${
                  isOpen
                    ? 'bg-[#0F1E33] border-[#0284C7]'
                    : 'bg-[#091220] border-[#16253C] hover:border-[#38BDF8]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[#F8FAFC]">
                    {faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-[18px] h-[18px] text-[#00F0FF] shrink-0" />
                  ) : (
                    <ChevronDown className="w-[18px] h-[18px] text-[#94A3B8] shrink-0" />
                  )}
                </div>

                {isOpen && (
                  <p className="mt-2.5 text-[12px] leading-[17px] text-[#CBD5E1]">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>


      </section>
    </div>
  );
};
