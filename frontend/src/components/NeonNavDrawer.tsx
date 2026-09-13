import React, { useState } from 'react';
import {
  X,
  Home,
  Info,
  Layers,
  Calculator,
  Users,
  LayoutDashboard,
  Wallet,
  HelpCircle,
  Mail,
  ChevronRight,
  LogOut,
  Globe,
  ShieldCheck,
  Smartphone,
  Download
} from 'lucide-react';
import { NavRoute } from './BottomNavBar';
import { LanguageCode } from '../types/mining';
import { LANGUAGES_LIST, getTranslation } from '../data/miningPlans';

interface Props {
  isOpen: boolean;
  activeRoute: NavRoute;
  isLoggedIn: boolean;
  onNavigate: (route: NavRoute) => void;
  onClose: () => void;
  onAuthClick: () => void;
  onOpenAdminPortal?: () => void;
  currentLang?: LanguageCode;
  onSelectLang?: (lang: LanguageCode) => void;
}

const NAV_ITEMS: { route: NavRoute; key: string; name: string; icon: React.ElementType }[] = [
  { route: 'home', key: 'home', name: 'Home', icon: Home },
  { route: 'plans', key: 'miningPlans', name: 'Mining Plans', icon: Layers },
  { route: 'calculator', key: 'calculator', name: 'Calculator', icon: Calculator },
  { route: 'dashboard', key: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { route: 'wallet', key: 'wallet', name: 'Wallet & Withdraw', icon: Wallet },
  { route: 'referral', key: 'referral', name: 'Referral Network', icon: Users },
  { route: 'about', key: 'about', name: 'About Protocol', icon: Info },
  { route: 'faq', key: 'faq', name: 'Security & FAQ', icon: HelpCircle },
  { route: 'contact', key: 'contact', name: 'Contact & Support', icon: Mail }
];

export const NeonNavDrawer: React.FC<Props> = ({
  isOpen,
  activeRoute,
  isLoggedIn,
  onNavigate,
  onClose,
  onAuthClick,
  onOpenAdminPortal,
  currentLang = 'en',
  onSelectLang
}) => {
  const [showDrawerLangMenu, setShowDrawerLangMenu] = useState(false);
  if (!isOpen) return null;

  const currentLangObj = LANGUAGES_LIST.find((l) => l.code === currentLang) || LANGUAGES_LIST[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Panel (85% width on mobile) */}
      <div className="relative z-10 w-[85%] max-w-[360px] h-full bg-[#060D1A]/95 border-l border-[#1A2B42] p-5 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slideLeft">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-[26px] h-[26px] flex items-center justify-center">
                <img src="/neon_hex_clean.png" alt="Neon Logo" className="w-[26px] h-[26px] object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]" />
              </div>
              <span translate="no" className="notranslate text-[16px] font-extrabold text-[#F8FAFC]">
                NEON MINING
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Drawer Language Switcher Banner - Only on Home */}
          {onSelectLang && activeRoute === 'home' && (
            <>
              <div className="mt-3 relative">
                <button
                  onClick={() => setShowDrawerLangMenu(!showDrawerLangMenu)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0B1526] border border-[#1E2F48] hover:border-[#00F0FF]/50 text-[12px] font-semibold text-[#CBD5E1] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00F0FF]" />
                    <span>{currentLangObj.flag} {currentLangObj.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-[#00F0FF] bg-[#00F0FF]/10 px-1.5 py-0.5 rounded">
                    {currentLangObj.code}
                  </span>
                </button>

                {showDrawerLangMenu && (
                  <div className="mt-1 w-full max-h-[220px] overflow-y-auto rounded-xl bg-[#0C1424] border border-[#1F304B] py-1 shadow-2xl z-50">
                    <div className="px-3 py-1.5 border-b border-[#182840] text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider">
                      {getTranslation('selectLanguage', currentLang, 'Select Language (25)')}
                    </div>
                    {LANGUAGES_LIST.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onSelectLang(lang.code);
                          setShowDrawerLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] text-left hover:bg-[#122036] transition-colors cursor-pointer ${
                          currentLang === lang.code ? 'text-[#00F0FF] font-bold bg-[#0F2038]' : 'text-[#94A3B8]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                        <span className="text-[9.5px] text-[#64748B] font-mono uppercase">{lang.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="my-3 h-px bg-[#16253A]" />
            </>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = activeRoute === item.route;
              const translatedName = getTranslation(item.key, currentLang, item.name);

              return (
                <button
                  key={item.route}
                  onClick={() => {
                    onNavigate(item.route);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F2642] text-[#00F0FF] font-bold shadow-sm'
                      : 'text-[#F8FAFC] hover:bg-[#0B172A] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon
                      className={`w-[18px] h-[18px] ${
                        isSelected ? 'text-[#00F0FF]' : 'text-[#94A3B8]'
                      }`}
                    />
                    <span className="text-[14px]">{translatedName}</span>
                  </div>

                  <ChevronRight
                    className={`w-[18px] h-[18px] ${
                      isSelected ? 'text-[#00F0FF]' : 'text-[#334155]'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Download Official Android App (APK) */}
          <div className="pt-3">
            <a
              href="/neon-mining.apk"
              download="Neon_Mining_App.apk"
              onClick={onClose}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF]/15 via-[#0284C7]/20 to-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] hover:border-[#00F0FF] font-bold text-[13px] shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-[#00F0FF] shrink-0" />
                <span>Download Official App (APK)</span>
              </div>
              <Download className="w-4 h-4 text-[#00F0FF] shrink-0" />
            </a>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-[#16253A] space-y-2">
          <button
            onClick={() => {
              onAuthClick();
              onClose();
            }}
            className={`w-full h-[44px] rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
              isLoggedIn
                ? 'bg-[#111D30] text-[#94A3B8] border border-[#1E2F48] hover:text-white'
                : 'bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-[0_0_15px_rgba(2,132,199,0.3)]'
            }`}
          >
            {isLoggedIn ? (
              <>
                <LogOut className="w-4 h-4" />
                <span>{getTranslation('logout', currentLang, 'Log out')}</span>
              </>
            ) : (
              <span>{getTranslation('createAccount', currentLang, 'Sign in / Register')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
