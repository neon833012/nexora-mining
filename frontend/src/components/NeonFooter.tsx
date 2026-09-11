import React from 'react';

interface Props {
  onNavigate: (section: string) => void;
  onOpenAdminPortal?: () => void;
}

const PLATFORM_LINKS = [
  'Home',
  'About Neon',
  'Mining Plans',
  'Calculator',
  'Referral',
  'Dashboard',
  'FAQ',
  'Contact'
];

const LEGAL_LINKS = [
  'Terms & Conditions',
  'Privacy Policy',
  'Risk Disclosure',
  'Referral Policy',
  'Support'
];

export const NeonFooter: React.FC<Props> = ({ onNavigate, onOpenAdminPortal }) => {
  return (
    <footer className="w-full bg-[#050B14] border-t border-[#101C2E] p-5 lg:p-10">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Brand Info */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            <span className="text-[17px] font-black tracking-wider text-[#F8FAFC]">
              NEON MINING
            </span>
          </div>

          <p className="text-[12px] leading-[18px] text-[#94A3B8] max-w-md">
            NEON MINING operates at the intersection of blockchain technology, computing infrastructure and digital assets. All figures shown are illustrative mathematical projections based on entered assumptions and are not guaranteed returns.
          </p>


        </div>

        {/* Column 2: Platform Navigation Links */}
        <div>
          <h4 className="text-[13px] font-bold text-[#F8FAFC] tracking-wider uppercase">Platform</h4>
          <div className="mt-3 grid grid-cols-1 gap-y-2">
            {PLATFORM_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => onNavigate(link)}
                className="text-left text-[12.5px] text-[#94A3B8] hover:text-[#00F0FF] transition-colors cursor-pointer"
              >
                {link}
              </button>
            ))}
          </div>
        </div>

        {/* Column 3: Legal Links */}
        <div>
          <h4 className="text-[13px] font-bold text-[#F8FAFC] tracking-wider uppercase">Legal & Security</h4>
          <div className="mt-3 space-y-2">
            {LEGAL_LINKS.map((legal) => (
              <div
                key={legal}
                className="text-[12.5px] text-[#94A3B8] cursor-default hover:text-[#CBD5E1] transition-colors"
              >
                {legal}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto my-6 h-px bg-[#142236]" />

      {/* Copyright Notes */}
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#64748B] gap-2">
        <div className="flex items-center gap-3">
          <span>© 2026 NEON MINING. All rights reserved.</span>
        </div>
        <div>Secured by Institutional Cold-Storage Reserves & Multi-Signature Protocols.</div>
      </div>
    </footer>
  );
};
