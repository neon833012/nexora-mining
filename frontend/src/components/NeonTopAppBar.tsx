import React, { useState } from 'react';
import { Globe, ShieldCheck, Smartphone } from 'lucide-react';
import { LanguageCode, UserRole } from '../types/mining';
import { NavRoute } from './BottomNavBar';
import { LANGUAGES_LIST, getTranslation } from '../data/miningPlans';

interface Props {
  activeRoute: NavRoute;
  onRouteChange?: (route: NavRoute) => void;
  isLoggedIn: boolean;
  userName: string;
  currentLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  userRole?: UserRole;
  onOpenAdminPortal?: () => void;
  onOpenDrawer?: () => void;
  onLoginClick: () => void;
  onGetAppClick?: () => void;
  onNavigateHome: () => void;
}

const DESKTOP_NAV_ITEMS: { route: NavRoute; key: string; label: string }[] = [
  { route: 'home', key: 'home', label: 'Home' },
  { route: 'plans', key: 'miningPlans', label: 'Mining Plans' },
  { route: 'calculator', key: 'calculator', label: 'Calculator' },
  { route: 'dashboard', key: 'dashboard', label: 'Dashboard' },
  { route: 'wallet', key: 'wallet', label: 'Wallet' },
  { route: 'referral', key: 'referral', label: 'Referral' },
  { route: 'about', key: 'about', label: 'Protocol' },
  { route: 'faq', key: 'faq', label: 'FAQ' },
  { route: 'contact', key: 'contact', label: 'Support' }
];

export const NeonTopAppBar: React.FC<Props> = ({
  activeRoute,
  onRouteChange,
  isLoggedIn,
  userName,
  currentLang,
  onSelectLang,
  userRole,
  onOpenAdminPortal,
  onOpenDrawer,
  onLoginClick,
  onGetAppClick,
  onNavigateHome
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLangObj = LANGUAGES_LIST.find((l) => l.code === currentLang) || LANGUAGES_LIST[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030712]/95 backdrop-blur-md border-b border-[#162338]">
      <div className="w-full max-w-7xl mx-auto px-3.5 lg:px-8 py-2.5 flex items-center justify-between">
        {/* Left: Brand Logo (App-style, no hamburger) */}
        <div className="flex items-center gap-2">
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0 -translate-y-0.5">
              <img
                src="/neon_hex_clean.png"
                alt="Neon Mining Logo"
                className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(0,240,255,0.7)] group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <span translate="no" className="notranslate text-[15px] lg:text-[17px] font-black tracking-wider text-[#F8FAFC] group-hover:text-[#00F0FF] transition-colors">
                NEON MINING
              </span>
              <span translate="no" className="notranslate hidden lg:block text-[9.5px] font-bold text-[#00F0FF] tracking-widest uppercase">
                BEP-20 CLOUD PROTOCOL
              </span>
            </div>
          </div>
        </div>

        {/* Center: "Get App" button on Mobile - ONLY on Home Screen */}
        {activeRoute === 'home' && (
          <div className="lg:hidden flex items-center justify-center">
            <button
              onClick={onGetAppClick}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00F0FF]/15 via-[#0284C7]/20 to-[#00F0FF]/15 hover:from-[#00F0FF]/25 hover:to-[#0284C7]/30 border border-[#00F0FF]/40 text-[11px] font-black text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:border-[#00F0FF] transition-all cursor-pointer active:scale-95"
              title="Download Official Neon Mining App"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="tracking-wide uppercase font-mono">Get App</span>
            </button>
          </div>
        )}

        {/* Center: Desktop Navigation Bar (Visible only on desktop screens) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.route;
            const translatedLabel = getTranslation(item.key, currentLang, item.label);

            return (
              <button
                key={item.route}
                onClick={() => onRouteChange ? onRouteChange(item.route) : (item.route === 'home' ? onNavigateHome() : undefined)}
                className={`px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-[#00F0FF] bg-[#0C1D33] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0B1526] border border-transparent'
                }`}
              >
                <span>{translatedLabel}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-[#00F0FF] rounded-full shadow-[0_0_8px_rgba(0,240,255,0.9)]" />
                )}
              </button>
            );
          })}

          {/* Desktop "Get App" Button - ONLY on Home Screen */}
          {activeRoute === 'home' && (
            <button
              onClick={onGetAppClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00F0FF]/15 via-[#0284C7]/25 to-[#00F0FF]/15 hover:from-[#00F0FF]/30 hover:to-[#0284C7]/40 border border-[#00F0FF]/50 text-[12px] font-black text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)] hover:border-[#00F0FF] transition-all cursor-pointer active:scale-95 ml-2"
              title="Download Official Neon Mining App"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="tracking-wide uppercase font-mono">Get App</span>
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* 25-Language Selector Dropdown - Only visible on Home Screen */}
          {activeRoute === 'home' && (
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0A1322] border border-[#16243A] text-[11.5px] font-semibold text-[#CBD5E1] hover:border-[#00F0FF]/50 transition-colors cursor-pointer"
                title="Change Language (25 Languages)"
              >
                <span>{currentLangObj.flag}</span>
                <span className="hidden sm:inline">{currentLangObj.label}</span>
                <span className="sm:hidden font-mono uppercase text-[10px]">{currentLangObj.code}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1 w-52 max-h-[340px] overflow-y-auto rounded-xl bg-[#0C1424] border border-[#1F304B] py-1 shadow-2xl z-50 animate-scaleUp">
                  <div className="px-3 py-1.5 border-b border-[#182840] text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider">
                    {getTranslation('selectLanguage', currentLang, 'Select Language (25)')}
                  </div>
                  {LANGUAGES_LIST.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelectLang(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-[11.5px] text-left hover:bg-[#122036] transition-colors cursor-pointer ${
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
          )}

          {/* Top Bar Action: User ID when logged in, "Sign In" when logged out */}
          {isLoggedIn ? (
            <div
              onClick={() => onRouteChange ? onRouteChange('dashboard') : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A1628] border border-[#00F0FF]/40 text-[11.5px] lg:text-[12px] font-bold text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:border-[#00F0FF] transition-all cursor-pointer"
              title="View Dashboard"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">{userName}</span>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021020] text-[12px] font-black hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer active:scale-95"
            >
              {getTranslation('signIn', currentLang, 'Sign In')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
