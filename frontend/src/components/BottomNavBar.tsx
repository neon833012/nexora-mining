import React from 'react';
import { Home, Layers, Users, LayoutDashboard, Wallet } from 'lucide-react';
import { LanguageCode } from '../types/mining';
import { getTranslation } from '../data/miningPlans';

export type NavRoute =
  | 'home'
  | 'plans'
  | 'calculator'
  | 'dashboard'
  | 'wallet'
  | 'referral'
  | 'about'
  | 'faq'
  | 'contact';

interface Props {
  activeRoute: NavRoute;
  onRouteChange: (route: NavRoute) => void;
  currentLang?: LanguageCode;
}

const BOTTOM_TABS: { route: NavRoute; key: string; label: string; icon: React.ElementType }[] = [
  { route: 'home', key: 'home', label: 'Home', icon: Home },
  { route: 'plans', key: 'plans', label: 'Plans', icon: Layers },
  { route: 'referral', key: 'referral', label: 'Referral', icon: Users },
  { route: 'dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: 'wallet', key: 'wallet', label: 'Wallet', icon: Wallet }
];

export const BottomNavBar: React.FC<Props> = ({ activeRoute, onRouteChange, currentLang = 'en' }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none lg:hidden">
      <div className="w-full max-w-[430px] bg-[#060D1A]/95 backdrop-blur-lg border-t border-[#16253C] px-3 py-2 flex items-center justify-around pointer-events-auto shadow-[0_-8px_25px_rgba(0,0,0,0.5)]">
        {BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeRoute === tab.route;

          return (
            <button
              key={tab.route}
              onClick={() => onRouteChange(tab.route)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer relative active:scale-95 ${
                isActive ? 'text-[#00F0FF]' : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {/* Active Glow Pill */}
              {isActive && (
                <div className="absolute -top-1 w-6 h-0.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.9)] animate-pulse" />
              )}

              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#00F0FF]' : ''}`} />
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-[#00F0FF]' : 'text-[#94A3B8]'}`}>
                {getTranslation(tab.key, currentLang, tab.label)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
