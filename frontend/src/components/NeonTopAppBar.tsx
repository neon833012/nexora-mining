import React, { useState, useRef, useEffect } from 'react';
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
  isStandaloneApp?: boolean;
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
  onNavigateHome,
  isStandaloneApp
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangMenu]);

  const currentLangObj = LANGUAGES_LIST.find((l) => l.code === currentLang) || LANGUAGES_LIST[0];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#030712]/95 backdrop-blur-md border-b border-[#162338]">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-3.5 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-1 sm:gap-2 flex-nowrap min-h-[48px] sm:min-h-[54px]">
        {/* Left: Brand Logo (App-style, no hamburger) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none group"
          >
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 -translate-y-0.5">
              <img
                src="/neon_hex_clean.png"
                alt="Neon Mining Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-[0_0_10px_rgba(0,240,255,0.7)] group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <span translate="no" className="notranslate text-[13.5px] sm:text-[15px] lg:text-[17px] font-black tracking-wider text-[#F8FAFC] group-hover:text-[#00F0FF] transition-colors whitespace-nowrap">
                NEON MINING
              </span>
              <span translate="no" className="notranslate hidden lg:block text-[9.5px] font-bold text-[#00F0FF] tracking-widest uppercase whitespace-nowrap">
                BEP-20 CLOUD PROTOCOL
              </span>
            </div>
          </div>
        </div>

        {/* Center: "Get App" button on Mobile - ONLY on Home Screen (Hidden when inside App) */}
        {activeRoute === 'home' && !isStandaloneApp && (
          <div className="lg:hidden flex items-center justify-center shrink-0">
            <button
              onClick={onGetAppClick}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-[#00F0FF]/15 via-[#0284C7]/20 to-[#00F0FF]/15 hover:from-[#00F0FF]/25 hover:to-[#0284C7]/30 border border-[#00F0FF]/40 text-[10px] font-black text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)] hover:border-[#00F0FF] transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
              title="Download Official Neon Mining App"
            >
              <Smartphone className="w-3 h-3 text-[#00F0FF] shrink-0" />
              <span className="tracking-wide uppercase font-mono">Get App</span>
            </button>
          </div>
        )}

        {/* Center: Desktop Navigation Bar (Visible only on desktop screens) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.route;
            const translatedLabel = getTranslation(item.key, currentLang, item.label);

            return (
              <button
                key={item.route}
                onClick={() => onRouteChange ? onRouteChange(item.route) : (item.route === 'home' ? onNavigateHome() : undefined)}
                className={`px-2.5 xl:px-3 py-1 rounded-xl text-[12px] xl:text-[13px] font-bold transition-all cursor-pointer relative whitespace-nowrap ${
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

          {/* Desktop "Get App" Button - ONLY on Home Screen (Hidden when inside App) */}
          {activeRoute === 'home' && !isStandaloneApp && (
            <button
              onClick={onGetAppClick}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#00F0FF]/15 via-[#0284C7]/25 to-[#00F0FF]/15 hover:from-[#00F0FF]/30 hover:to-[#0284C7]/40 border border-[#00F0FF]/50 text-[11px] xl:text-[12px] font-black text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)] hover:border-[#00F0FF] transition-all cursor-pointer active:scale-95 ml-1.5 whitespace-nowrap shrink-0"
              title="Download Official Neon Mining App"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
              <span className="tracking-wide uppercase font-mono">Get App</span>
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* 25-Language Selector Dropdown - Only visible on Home Screen */}
          {activeRoute === 'home' && (
            <div className="relative shrink-0" ref={langMenuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg bg-[#0A1322] border border-[#16243A] text-[10.5px] sm:text-[11.5px] font-semibold text-[#CBD5E1] hover:border-[#00F0FF]/50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Change Language (25 Languages)"
              >
                <span>{currentLangObj.flag}</span>
                <span className="hidden sm:inline">{currentLangObj.label}</span>
                <span className="sm:hidden font-mono uppercase text-[9.5px]">{currentLangObj.code}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-52 max-h-[340px] overflow-y-auto rounded-xl bg-[#0C1424] border border-[#00F0FF]/40 py-1 shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-[100] animate-scaleUp">
                  <div className="px-3 py-1.5 border-b border-[#182840] text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider sticky top-0 bg-[#0C1424]">
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
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-[#0A1628] border border-[#00F0FF]/40 text-[10.5px] sm:text-[11.5px] font-bold text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)] hover:border-[#00F0FF] transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="View Dashboard"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono">{userName}</span>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-2.5 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021020] text-[11px] sm:text-[12px] font-black hover:brightness-110 shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            >
              {getTranslation('signIn', currentLang, 'Sign In')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
