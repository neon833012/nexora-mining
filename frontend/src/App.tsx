import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { NeonTopAppBar } from './components/NeonTopAppBar';
import { NeonAppSplashScreen } from './components/NeonAppSplashScreen';
import { BlockchainLiveTicker } from './components/BlockchainLiveTicker';
import { FuturisticHeroSection } from './components/FuturisticHeroSection';
import { LiveStatsGrid } from './components/LiveStatsGrid';
import { AboutNeonSection } from './components/AboutNeonSection';
import { MiningPlanCards } from './components/MiningPlanCards';
import { InteractiveMiningCalculator } from './components/InteractiveMiningCalculator';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ReferralNetworkSection } from './components/ReferralNetworkSection';
import { OrcCommissionSection, getMemberOrcDailyYield } from './components/OrcCommissionSection';
import { DashboardPreviewSection } from './components/DashboardPreviewSection';
import { WithdrawalSection } from './components/WithdrawalSection';
import { SecurityAndFaqSection } from './components/SecurityAndFaqSection';
import { ContactSection } from './components/ContactSection';
import { NeonFooter } from './components/NeonFooter';
import { HomeMiningFarmStats } from './components/HomeMiningFarmStats';
import { HomePlatformFeatures } from './components/HomePlatformFeatures';
import { HomeLivePayoutsTicker } from './components/HomeLivePayoutsTicker';
import { HomeFaqAccordion } from './components/HomeFaqAccordion';
import { NeonNavDrawer } from './components/NeonNavDrawer';
import { AuthModalDialog } from './components/AuthModalDialog';
import { PlanCheckoutModal } from './components/PlanCheckoutModal';
import { PromotionalPlanPopupModal } from './components/PromotionalPlanPopupModal';
import { DepositDemoDialog } from './components/DepositDemoDialog';
import { P2PTransferModal } from './components/P2PTransferModal';
import { WithdrawalHistoryModal } from './components/WithdrawalHistoryModal';
import { CreateFundPasswordModal } from './components/CreateFundPasswordModal';
import { DepositHistoryModal } from './components/DepositHistoryModal';
import { LegalPolicyModal, LegalPolicyKey } from './components/LegalPolicyModal';
import { ToastNotification } from './components/ToastNotification';
import { NeonAIChatAssistant } from './components/NeonAIChatAssistant';
import { SupportInboxModal } from './components/SupportInboxModal';
import { AdminSystemPortal } from './components/AdminSystemPortal';
import { BottomNavBar, NavRoute } from './components/BottomNavBar';
import { Smartphone, Download } from 'lucide-react';
import { nexoraApi } from './services/api';
import { formatUsaDateTime, parseUtcMs } from './utils/dateUtils';
import {
  MiningPlan,
  TransactionRecord,
  LanguageCode,
  UserRole,
  WithdrawalRequest,
  DepositRecord,
  SupportTicket,
  AdminBroadcastMessage,
  SubAdminUser,
  TeamTurnover,
  AdminUserRecord,
  AdminOrderRecord,
  AdminTelemetry,
  PlatformSettings,
  ReferredUserItem
} from './types/mining';

const DEFAULT_INITIAL_REFERRED_USERS: ReferredUserItem[] = [];

export const getDeviceGuestId = (): string => {
  if (typeof window === 'undefined') return 'guest_dev';
  let gId = localStorage.getItem('neon_device_guest_id');
  if (!gId || gId === 'guest') {
    gId = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('neon_device_guest_id', gId);
  }
  return gId;
};
import { MINING_PLANS, INITIAL_TRANSACTIONS, INITIAL_WITHDRAWAL_REQUESTS, getTranslation, getPlanForAmount } from './data/miningPlans';
import { getSavedLanguage, applyLanguageChange, retriggerGoogleTranslate } from './utils/languageManager';
import { startUniversalTranslator } from './utils/universalTranslator';
import {
  INITIAL_ADMIN_USERS,
  INITIAL_ADMIN_ORDERS,
  INITIAL_ADMIN_TELEMETRY,
  INITIAL_PLATFORM_SETTINGS
} from './data/mockAdminData';
import {
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Layers,
  Calculator,
  Wallet,
  Lock,
  LogIn,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  FileText,
  Gift,
  Users,
  Zap,
  TrendingUp,
  Send,
  History,
  Copy,
  ExternalLink,
  Coins
} from 'lucide-react';

// Known development/testing user accounts to exclude from production admin directories
export const KNOWN_TEST_USER_IDS: string[] = ['USR_782910'];

export const isTestAccount = (id?: string, name?: string, email?: string): boolean => {
  const upperId = (id || '').toUpperCase();
  const lowerEmail = (email || '').toLowerCase();
  
  if (KNOWN_TEST_USER_IDS.some((tid) => upperId === tid)) return true;
  if (
    lowerEmail.includes('mock_sample') ||
    lowerEmail.includes('test_dummy')
  ) {
    return true;
  }
  return false;
};

// LocalStorage Persistence Helpers for Enterprise Data Synchronization
const loadStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const loadStorageNum = (key: string, fallback: number): number => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    const n = parseFloat(item);
    return isNaN(n) ? fallback : n;
  } catch {
    return fallback;
  }
};

const loadStorageStr = (key: string, fallback: string = ''): string => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const loadStorageBool = (key: string, fallback: boolean = false): boolean => {
  try {
    const item = localStorage.getItem(key);
    return item === null ? fallback : item === 'true';
  } catch {
    return fallback;
  }
};

export interface UserPersistentData {
  activeMiningPower?: number;
  currentPlanName?: string;
  depositBalance?: number;
  availableWithdrawal?: number;
  totalBalance?: number;
  totalRewards?: number;
  referralIncome?: number;
  referralBalance?: number;
  totalOrcIncome?: number;
  orcBalance?: number;
  yesterdaysIncome?: number;
  isMiningActive?: boolean;
  miningStartTime?: number;
  secondsRemaining?: number;
  unclaimedYield?: number;
  transactions?: TransactionRecord[];
  depositRecords?: DepositRecord[];
  totalWithdrawn?: number;
  fundPin?: string;
}

export const getUserStorageKey = (uid: string) => `neon_user_${uid.toUpperCase()}`;

export const loadUserSavedData = (uid?: string): UserPersistentData | null => {
  if (!uid) return null;
  const clean = uid.toUpperCase();
  const data = loadStorage<UserPersistentData | null>(getUserStorageKey(clean), null);
  if (clean === 'NEON10770' || clean.includes('10770')) {
    return {
      ...(data || {}),
      activeMiningPower: 21.87,
      totalWithdrawn: 4.6,
      totalRewards: 2.62,
      orcBalance: 0.07,
      totalOrcIncome: 0.07,
      unclaimedYield: 0.22,
      isMiningActive: true
    };
  }
  if (clean === 'NEON17255' || clean.includes('17255')) {
    return {
      ...(data || {}),
      activeMiningPower: 21.23,
      totalWithdrawn: 7.4,
      totalRewards: 2.66,
      orcBalance: 0.0,
      totalOrcIncome: 0.09,
      unclaimedYield: 0.21,
      isMiningActive: true
    };
  }
  return data;
};

export const saveUserSavedData = (uid: string, data: Partial<UserPersistentData>) => {
  if (!uid) return;
  try {
    const key = getUserStorageKey(uid);
    const existing = loadStorage<UserPersistentData | null>(key, null) || {};
    localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
  } catch (e) {}
  try {
    nexoraApi.syncUserData(uid, data).catch(() => {});
  } catch (e) {}
};

export const normalizeToPlanTier = (amt: number): number => {
  const PLAN_TIERS = [20, 60, 120, 250, 500, 1500, 3000, 5000, 10000];
  for (const tier of PLAN_TIERS) {
    if (amt >= tier - 0.50 && amt <= tier + 0.10) return tier;
  }
  return +(amt).toFixed(2);
};

export const getStoredAdminRole = (): UserRole => {
  try {
    const stored = localStorage.getItem('neon_admin_role') || sessionStorage.getItem('neon_admin_role');
    if (stored === 'subadmin') return 'subadmin';
    if (stored === 'superadmin') return 'superadmin';
  } catch {}
  return 'superadmin';
};

export const App: React.FC = () => {
  // Standalone App / APK detection
  const isStandaloneApp = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const isFromUrl = urlParams.get('source') === 'app' || urlParams.get('twa') === '1' || urlParams.get('mode') === 'app';
    const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isStoredApp = localStorage.getItem('neon_is_app') === 'true';
    if (isFromUrl || isStandaloneMatch || isStoredApp) {
      try { localStorage.setItem('neon_is_app', 'true'); } catch {}
      return true;
    }
    return false;
  }, []);

  const [showAppSplash, setShowAppSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const isFromUrl = urlParams.get('source') === 'app' || urlParams.get('twa') === '1' || urlParams.get('mode') === 'app';
    const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isStoredApp = localStorage.getItem('neon_is_app') === 'true';
    return isFromUrl || isStandaloneMatch || isStoredApp;
  });

  // Navigation & Multi-Page View
  const [activeRoute, setActiveRoute] = useState<NavRoute>('home');
  const [activeTeamTab, setActiveTeamTab] = useState<'select' | 'referral' | 'orc'>('select');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Centralized Navigation with Browser History Stack (Enables step-by-step phone back button)
  const navigateTo = (route: NavRoute, replace: boolean = false) => {
    if (route === 'referral') {
      if (activeRoute === 'referral') {
        if (activeTeamTab !== 'select') {
          setActiveTeamTab('select');
          window.history.pushState({ route: 'referral', teamTab: 'select' }, '', '#referral');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      setActiveTeamTab('select');
      if (replace) {
        window.history.replaceState({ route: 'referral', teamTab: 'select' }, '', '#referral');
      } else {
        window.history.pushState({ route: 'referral', teamTab: 'select' }, '', '#referral');
      }
      setActiveRoute('referral');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        retriggerGoogleTranslate();
      }, 60);
      return;
    }

    if (route === activeRoute) return;
    if (replace) {
      window.history.replaceState({ route }, '', `#${route}`);
    } else {
      window.history.pushState({ route }, '', `#${route}`);
    }
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!isLoggedIn && (route === 'dashboard' || route === 'wallet')) {
      showToast('🔒 Please Sign In or Create an Account to access your personal dashboard & wallet!');
      setIsSignUpMode(false);
      setShowAuthModal(true);
      setActiveRoute('home');
      window.history.replaceState({ route: 'home' }, '', '#home');
      return;
    }
    setTimeout(() => {
      retriggerGoogleTranslate();
    }, 60);
  };

  // Open Team Sub-view with History Stack Push (Step-by-step flow)
  const openTeamSubTab = (tab: 'referral' | 'orc') => {
    setActiveTeamTab(tab);
    window.history.pushState({ route: 'referral', teamTab: tab }, '', `#referral/${tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step-by-Step Back Navigation from Team Sub-view
  const handleBackFromTeamSubTab = () => {
    if (window.history.state?.teamTab === 'orc' || window.history.state?.teamTab === 'referral') {
      window.history.back();
    } else {
      setActiveTeamTab('select');
      window.history.replaceState({ route: 'referral', teamTab: 'select' }, '', '#referral');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Back Navigation from Team Select (2-cards) screen to Previous screen
  const handleBackFromTeamSelect = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('plans');
    }
  };

  // Listen for browser popstate & hashchange (phone back button & direct #hash changes)
  useEffect(() => {
    const validRoutes: NavRoute[] = [
      'home',
      'plans',
      'calculator',
      'dashboard',
      'wallet',
      'referral',
      'about',
      'faq',
      'contact'
    ];

    // One-time initialization: clear legacy deleted user id blacklist
    try {
      localStorage.removeItem('neon_deleted_user_ids');
    } catch {}

    const urlParams = new URLSearchParams(window.location.search);
    const rawHash = window.location.hash.replace('#', '');
    const cleanHash = rawHash.split('/')[0] as NavRoute;
    const adminParam = urlParams.get('admin');
    const hasAdminAuth = !isStandaloneApp && (
      localStorage.getItem('neon_admin_auth') === 'true' ||
      sessionStorage.getItem('neon_admin_auth') === 'true'
    );
    const isAdminRequested = !isStandaloneApp && (
      (cleanHash as any) === 'admin' ||
      adminParam === 'portal' ||
      adminParam === 'true' ||
      adminParam === '1' ||
      (hasAdminAuth && ((cleanHash as string) === 'admin' || !cleanHash || cleanHash === 'home'))
    );

    if (isAdminRequested) {
      setUserRole(getStoredAdminRole());
      setShowAdminPortal(true);
      window.history.replaceState({ route: 'admin' }, '', '#admin');
    } else {
      const initialRoute = validRoutes.includes(cleanHash) ? cleanHash : 'home';
      setActiveRoute(initialRoute);
      if (initialRoute === 'referral') {
        const sub = rawHash.includes('/orc') ? 'orc' : rawHash.includes('/referral') ? 'referral' : 'select';
        setActiveTeamTab(sub);
        window.history.replaceState({ route: 'referral', teamTab: sub }, '', `#${rawHash || 'referral'}`);
      } else {
        window.history.replaceState({ route: initialRoute }, '', `#${initialRoute}`);
      }
    }
    setTimeout(() => {
      retriggerGoogleTranslate();
    }, 100);

    const handlePopState = (event: PopStateEvent) => {
      try {
        const now = String(Date.now());
        localStorage.setItem('neon_last_active_time', now);
        if (localStorage.getItem('neon_admin_auth') === 'true') {
          localStorage.setItem('neon_admin_last_active', now);
        }
      } catch {}

      const currentHash = window.location.hash.replace('#', '');
      const rootHash = currentHash.split('/')[0];
      const hasCurrentAdminAuth = !isStandaloneApp && (
        localStorage.getItem('neon_admin_auth') === 'true' ||
        sessionStorage.getItem('neon_admin_auth') === 'true'
      );
      if (rootHash === 'admin' || (hasCurrentAdminAuth && (event.state?.route === 'admin' || rootHash === 'admin'))) {
        if (isStandaloneApp) {
          setActiveRoute('home');
          window.history.replaceState({ route: 'home' }, '', '#home');
          return;
        }
        setUserRole(getStoredAdminRole());
        setShowAdminPortal(true);
        return;
      }
      setShowAdminPortal(false);

      const poppedRoute = (event.state?.route as NavRoute) || (validRoutes.includes(rootHash as NavRoute) ? (rootHash as NavRoute) : undefined);
      if (poppedRoute && validRoutes.includes(poppedRoute)) {
        setActiveRoute(poppedRoute);
        if (poppedRoute === 'referral') {
          const targetTeamTab = event.state?.teamTab || (currentHash.includes('/orc') ? 'orc' : currentHash.includes('/referral') ? 'referral' : 'select');
          setActiveTeamTab(targetTeamTab);
        }
      } else {
        setActiveRoute('home');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        retriggerGoogleTranslate();
      }, 60);
    };

    const handleHashChange = () => {
      try {
        const now = String(Date.now());
        localStorage.setItem('neon_last_active_time', now);
        if (localStorage.getItem('neon_admin_auth') === 'true') {
          localStorage.setItem('neon_admin_last_active', now);
        }
      } catch {}

      const currentHash = window.location.hash.replace('#', '');
      const rootHash = currentHash.split('/')[0];
      if (rootHash === 'admin') {
        if (isStandaloneApp) {
          setActiveRoute('home');
          window.history.replaceState({ route: 'home' }, '', '#home');
          return;
        }
        setUserRole(getStoredAdminRole());
        setShowAdminPortal(true);
        return;
      }
      setShowAdminPortal(false);
      if (validRoutes.includes(rootHash as NavRoute)) {
        setActiveRoute(rootHash as NavRoute);
        if (rootHash === 'referral') {
          const sub = currentHash.includes('/orc') ? 'orc' : currentHash.includes('/referral') ? 'referral' : 'select';
          setActiveTeamTab(sub);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          retriggerGoogleTranslate();
        }, 60);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret Admin Hotkey: Ctrl+Shift+A (or Cmd+Shift+A) toggles the Admin Portal (Disabled in Standalone App)
      if (!isStandaloneApp && (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setUserRole(getStoredAdminRole());
        setShowAdminPortal((prev) => !prev);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Multi-Language State (25 Languages - Persistent & Synchronized)
  const [currentLang, setCurrentLang] = useState<LanguageCode>(getSavedLanguage);

  useEffect(() => {
    startUniversalTranslator(currentLang);
  }, [currentLang, activeRoute]);

  // Role Management State
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('neon_admin_role') || sessionStorage.getItem('neon_admin_role');
      if (stored === 'subadmin') return 'subadmin';
      if (stored === 'superadmin') return 'superadmin';
    } catch {}
    return 'user';
  });
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  // Sub-Admins List - Clean initial empty state for fresh production
  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>(() => {
    const raw = loadStorage<SubAdminUser[]>('neon_sub_admins', []);
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const clean = raw.filter((s) => {
      const k = (s.id || s.email || s.username || '').toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (clean.length !== raw.length) {
      try {
        localStorage.setItem('neon_sub_admins', JSON.stringify(clean));
      } catch (e) {}
    }
    return clean;
  });

  // Enterprise Admin System State (Users, Orders, Telemetry, Rules) - Pure D1 Live Database Driven
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [adminOrders, setAdminOrders] = useState<AdminOrderRecord[]>([]);
  const [adminTelemetry, setAdminTelemetry] = useState<AdminTelemetry>(INITIAL_ADMIN_TELEMETRY);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => loadStorage('neon_platform_settings', INITIAL_PLATFORM_SETTINGS));

  // Auth & Session State - Persisted in LocalStorage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => loadStorageBool('neon_is_logged_in', false));
  const [userName, setUserName] = useState<string>(() => loadStorageStr('neon_user_name', ''));
  const [userMobile, setUserMobile] = useState<string>(() => loadStorageStr('neon_user_mobile', ''));
  const [userEmail, setUserEmail] = useState<string>(() => loadStorageStr('neon_user_email', ''));
  const [userFundPassword, setUserFundPassword] = useState<string>(() => loadStorageStr('neon_fund_password', ''));
  const [userFundPinSet, setUserFundPinSet] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [incomingResetToken, setIncomingResetToken] = useState<string | null>(null);
  const [incomingResetEmail, setIncomingResetEmail] = useState<string | null>(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [preFilledRefCode, setPreFilledRefCode] = useState('');
  const [userUplineCode, setUserUplineCode] = useState<string>(() => loadStorageStr('neon_upline_code', ''));
  const [userReferralCode, setUserReferralCode] = useState<string>(() => loadStorageStr('neon_referral_code', ''));

  // Detect email reset link parameters (?reset_token=...&email=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('reset_token');
      const email = params.get('email');
      if (token) {
        setIncomingResetToken(token);
        if (email) setIncomingResetEmail(email);
        setShowAuthModal(true);
      }
    } catch (e) {}
  }, []);

  // 3-Second Promotional Plans Showcase Popup Modal State
  const [showPromoPopup, setShowPromoPopup] = useState(false);

  const isLocalHostEnv = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.includes('.local') || Boolean((import.meta as any).env?.DEV);
  }, []);

  // Maintenance mode completely disabled - System live on production database
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);
  const handleDismissMaintenance = () => setShowMaintenanceModal(false);

  // Globally Synchronized Active Users & Miners Counter
  // Base: 20437 users starting on 2026-09-17 13:00:00 UTC (1789650000000 ms)
  // Increases by exactly 40 per hour across all devices globally (1 user every 90 seconds)
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(() => Date.now());

  useEffect(() => {
    // Tick every 3 seconds to re-calculate synchronized counts
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const BASE_SYNCHRONIZED_USERS = 20437;
  const BASE_SYNCHRONIZED_EPOCH = 1789650000000; // 2026-09-17 13:00:00 UTC

  // Total Active Users = 20437 + (elapsedSeconds * 40 / 3600) + real registered users
  const activeUsersCount = useMemo(() => {
    const elapsedSecs = Math.max(0, Math.floor((currentTimestamp - BASE_SYNCHRONIZED_EPOCH) / 1000));
    const addedGrowth = Math.floor(elapsedSecs * (40 / 3600)); // Exactly 40 users per 3600s
    return BASE_SYNCHRONIZED_USERS + addedGrowth + (adminUsers ? adminUsers.length : 0);
  }, [currentTimestamp, adminUsers]);

  // Active Miners: Universally synchronized across all devices, fluctuating smoothly between 80% and 90% of total active users
  const activeMinersCount = useMemo(() => {
    const minMiners = Math.floor(activeUsersCount * 0.80);
    const maxMiners = Math.floor(activeUsersCount * 0.90);
    const midMiners = (minMiners + maxMiners) / 2;
    const amplitude = (maxMiners - minMiners) / 2;

    const step = Math.floor(currentTimestamp / 3000);
    const primaryWave = Math.sin(step * 0.08);
    const microWave = Math.cos(step * 0.35) * 0.15;
    const waveFactor = Math.max(-1, Math.min(1, primaryWave * 0.85 + microWave));

    const calculated = Math.floor(midMiners + waveFactor * amplitude);
    return Math.min(maxMiners, Math.max(minMiners, calculated));
  }, [currentTimestamp, activeUsersCount]);

  // Dynamic Mining Plans State - Persisted in LocalStorage
  const [miningPlans, setMiningPlans] = useState<MiningPlan[]>(() => loadStorage('neon_mining_plans', MINING_PLANS));

  const handleUpdateMiningPlans = (updated: MiningPlan[]) => {
    setMiningPlans(updated);
    try {
      localStorage.setItem('neon_mining_plans', JSON.stringify(updated));
    } catch (e) {}
    showToast('✓ Mining plans configuration updated across platform!');
  };

  // Financial Dashboard State - Authenticated Live Database Driven (Initializes clean, instantly hydrated by D1)
  const [totalBalance, setTotalBalance] = useState<number>(0.0);
  const [depositBalance, setDepositBalance] = useState<number>(0.0);
  const [activeMiningPower, setActiveMiningPower] = useState<number>(() => {
    try {
      const u = loadStorageStr('neon_user_name', '');
      const ud = loadUserSavedData(u);
      return ud?.activeMiningPower ?? loadStorageNum('neon_mining_power', 0.0);
    } catch {
      return 0.0;
    }
  });
  const [totalRewards, setTotalRewards] = useState<number>(0.0);
  const [referralIncome, setReferralIncome] = useState<number>(0.0);
  const [referralBalance, setReferralBalance] = useState<number>(0.0);
  const [totalOrcIncome, setTotalOrcIncome] = useState<number>(() => {
    try {
      const u = loadStorageStr('neon_user_name', '');
      const ud = loadUserSavedData(u);
      return ud?.totalOrcIncome ?? loadStorageNum('neon_total_orc_income', 0.0);
    } catch {
      return 0.0;
    }
  });
  const [orcBalance, setOrcBalance] = useState<number>(() => {
    try {
      const u = loadStorageStr('neon_user_name', '');
      const ud = loadUserSavedData(u);
      return ud?.orcBalance ?? loadStorageNum('neon_orc_balance', 0.0);
    } catch {
      return 0.0;
    }
  });
  const [yesterdaysIncome, setYesterdaysIncome] = useState<number>(0.0);
  const [availableWithdrawal, setAvailableWithdrawal] = useState<number>(0.0);
  const [serverTotalWithdrawn, setServerTotalWithdrawn] = useState<number>(0.0);
  const [isCompoundingActive, setIsCompoundingActive] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [walletTxFilter, setWalletTxFilter] = useState<'all' | 'mining' | 'deposit' | 'referral' | 'orc' | 'withdraw'>('all');
  const [referredUsers, setReferredUsers] = useState<ReferredUserItem[]>(() => {
    try {
      const stored = localStorage.getItem('neon_cached_downlines');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Team Turnover Volume Milestones ($1,000 -> 1.5%, $2,500 -> 2%) - Clean 0
  const [teamTurnover, setTeamTurnover] = useState<TeamTurnover>(() => ({
    personalStaked: 0.0,
    downlineL1: 0.0,
    downlineL2: 0.0,
    downlineL3: 0.0,
    totalVolume: 0.0,
    boostedRate: 1.0
  }));

  // Dynamic calculation of daily reward based on active plan rate (e.g. 1.0% for $20, 1.1% for $50)
  // Milestone 1 ($1,000 Total Team Volume + 25% Self & L1 Rule ($250 min)): Boosts personal daily reward to 1.5%!
  const basePlanRate = getPlanForAmount(activeMiningPower, miningPlans)?.dailyRatePercent || 1.0;
  const isMilestone1Achieved = (teamTurnover.totalVolume >= 1000) && ((teamTurnover.personalStaked + teamTurnover.downlineL1) >= 250);
  const activePlanRate = isMilestone1Achieved ? Math.max(basePlanRate, 1.5) : basePlanRate;
  const todaysReward = +(activeMiningPower * (activePlanRate / 100)).toFixed(2);

  // 24-Hour Proof-of-Activity Mining Engine
  // By default, mining starts STOPPED (RED) with 0s remaining.
  // Only turns GREEN when user buys a plan AND taps Start Mining.
  const [isMiningActive, setIsMiningActive] = useState<boolean>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    const savedActive = ud?.isMiningActive ?? loadStorageBool('neon_mining_active', false);
    const savedStartTime = ud?.miningStartTime ?? loadStorageNum('neon_mining_start_time', 0);
    if (savedActive && savedStartTime > 0) {
      const elapsed = Math.floor((Date.now() - savedStartTime) / 1000);
      return elapsed < 24 * 3600;
    }
    return false;
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    const savedActive = ud?.isMiningActive ?? loadStorageBool('neon_mining_active', false);
    const savedStartTime = ud?.miningStartTime ?? loadStorageNum('neon_mining_start_time', 0);
    if (savedActive && savedStartTime > 0) {
      const elapsed = Math.floor((Date.now() - savedStartTime) / 1000);
      return Math.max(0, 24 * 3600 - elapsed);
    }
    return 0;
  });

  // 1-Minute Cooldown Period Engine (Water-Blue phase directly following 24H completion)
  const [isCoolingDown, setIsCoolingDown] = useState<boolean>(() => {
    const savedCooldown = loadStorageBool('neon_mining_cooldown_active', false);
    const savedCooldownStart = loadStorageNum('neon_cooldown_start_time', 0);
    if (savedCooldown && savedCooldownStart > 0) {
      const elapsed = Math.floor((Date.now() - savedCooldownStart) / 1000);
      return elapsed < 60;
    }
    return false;
  });
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState<number>(() => {
    const savedCooldown = loadStorageBool('neon_mining_cooldown_active', false);
    const savedCooldownStart = loadStorageNum('neon_cooldown_start_time', 0);
    if (savedCooldown && savedCooldownStart > 0) {
      const elapsed = Math.floor((Date.now() - savedCooldownStart) / 1000);
      if (elapsed < 60) {
        return 60 - elapsed;
      }
    }
    return 60;
  });

  // 24-Hour Compound Interest & Reinvestment Engine
  // Yield generates ONLY when 24h mining cycle completes. Re-invest is unlocked ONLY when unclaimedYield > 0.
  const [unclaimedYield, setUnclaimedYield] = useState<number>(() => loadStorageNum('neon_unclaimed_yield', 0.0));
  const [lastCompoundTimestamp, setLastCompoundTimestamp] = useState<number>(0);
  const [compoundSecondsLeft, setCompoundSecondsLeft] = useState<number>(0);
  const isCompoundLocked = activeMiningPower <= 0 || unclaimedYield <= 0;
  const isClaimingYieldRef = useRef(false);

  // Formatted timestamp helper for consistent ledger auditing
  const getFormattedTimestamp = () => {
    const now = new Date();
    const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
  };

  // Withdrawal Requests Queue & P2P Outgoing Ledger (Personal User History - Hydrated from D1)
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  // Dedicated Admin System Withdrawals Queue (All Users Across Entire Platform - Hydrated from D1)
  const [adminWithdrawals, setAdminWithdrawals] = useState<WithdrawalRequest[]>([]);

  // Deposit & Inflow Ledger (BEP-20 Blockchain Deposits + Incoming P2P Transfers - Hydrated from D1)
  const [depositRecords, setDepositRecords] = useState<DepositRecord[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('neon_deposit_records', JSON.stringify(depositRecords));
    } catch (e) {
      console.error(e);
    }
  }, [depositRecords]);

  useEffect(() => {
    try {
      localStorage.removeItem('neon_last_compound_time');
    } catch (e) {}
  }, []);

  // Save Admin System State to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('neon_admin_users', JSON.stringify(adminUsers));
    } catch (e) {
      console.error(e);
    }
  }, [adminUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('neon_admin_orders', JSON.stringify(adminOrders));
    } catch (e) {
      console.error(e);
    }
  }, [adminOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('neon_admin_telemetry', JSON.stringify(adminTelemetry));
    } catch (e) {
      console.error(e);
    }
  }, [adminTelemetry]);

  useEffect(() => {
    try {
      localStorage.setItem('neon_platform_settings', JSON.stringify(platformSettings));
    } catch (e) {
      console.error(e);
    }
  }, [platformSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('neon_withdrawal_requests', JSON.stringify(withdrawalRequests));
    } catch (e) {
      console.error(e);
    }
  }, [withdrawalRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('neon_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('neon_referred_users', JSON.stringify(referredUsers));
    } catch (e) {
      console.error(e);
    }
  }, [referredUsers]);

  // Save User Session & Balance State to LocalStorage (Only when user is active)
  useEffect(() => {
    if (!isLoggedIn || !userName) return;

    const cleanId = userName.toUpperCase();
    const planObj = getPlanForAmount(activeMiningPower, miningPlans);
    const planLabel = planObj ? `${planObj.planName} ($${planObj.amount} Tier)` : (activeMiningPower > 0 ? `Active Node ($${activeMiningPower})` : 'No Plan Purchased (Inactive)');
    const currentPlan = planLabel;

    saveUserSavedData(cleanId, {
      activeMiningPower,
      currentPlanName: currentPlan,
      depositBalance,
      availableWithdrawal,
      totalBalance,
      totalRewards,
      referralIncome,
      referralBalance,
      totalOrcIncome,
      orcBalance,
      yesterdaysIncome,
      isMiningActive,
      miningStartTime: loadStorageNum('neon_mining_start_time', 0),
      secondsRemaining,
      unclaimedYield,
      transactions,
      depositRecords,
      fundPin: userFundPassword
    });

    try {
      localStorage.setItem('neon_is_logged_in', String(isLoggedIn));
      localStorage.setItem('neon_user_name', userName);
      localStorage.setItem('neon_user_mobile', userMobile);
      localStorage.setItem('neon_user_email', userEmail);
      localStorage.setItem('neon_fund_password', userFundPassword);
      localStorage.setItem('neon_upline_code', userUplineCode);
      localStorage.setItem('neon_referral_code', userReferralCode);
      localStorage.setItem('neon_total_balance', String(totalBalance));
      localStorage.setItem('neon_deposit_balance', String(depositBalance));
      localStorage.setItem('neon_mining_power', String(activeMiningPower));
      localStorage.setItem('neon_total_rewards', String(totalRewards));
      localStorage.setItem('neon_referral_income', String(referralIncome));
      localStorage.setItem('neon_referral_balance', String(referralBalance));
      localStorage.setItem('neon_total_orc_income', String(totalOrcIncome));
      localStorage.setItem('neon_orc_balance', String(orcBalance));
      localStorage.setItem('neon_yesterdays_income', String(yesterdaysIncome));
      localStorage.setItem('neon_available_withdrawal', String(availableWithdrawal));
      localStorage.setItem('neon_mining_active', String(isMiningActive));
      localStorage.setItem('neon_seconds_remaining', String(secondsRemaining));
      localStorage.setItem('neon_unclaimed_yield', String(unclaimedYield));
    } catch (e) {
      console.error(e);
    }
  }, [
    isLoggedIn,
    userName,
    userMobile,
    userEmail,
    userFundPassword,
    userUplineCode,
    totalBalance,
    depositBalance,
    activeMiningPower,
    totalRewards,
    referralIncome,
    referralBalance,
    totalOrcIncome,
    orcBalance,
    yesterdaysIncome,
    availableWithdrawal,
    isMiningActive,
    secondsRemaining,
    unclaimedYield
  ]);

  // Total Settled Cashouts / Outflows (Approved external withdrawals + Outbound P2P transfers, strictly excluding rejected)
  const settledFromRequests = +(
    withdrawalRequests
      .filter((r) => r.status !== 'rejected' && (r.status === 'approved' || r.type === 'p2p_transfer'))
      .reduce((sum, r) => sum + Number(r.amount || 0), 0)
  ).toFixed(2);
  const totalWithdrawn = Math.max(serverTotalWithdrawn, settledFromRequests);

  // Total Cumulative Income (Total Mined + Total Referral Earned)
  const totalCumulativeIncome = +(totalRewards + referralIncome).toFixed(2);

  // Active Plan Name calculation (Tiered Threshold System: 20-49.99 = Neon Lite, 50-149.99 = Cryptera, etc.)
  const activePlanObj = getPlanForAmount(activeMiningPower, miningPlans) || getPlanForAmount(activeMiningPower, MINING_PLANS);
  const activePlanDisplayName = (isLoggedIn && activeMiningPower > 0)
    ? (activePlanObj ? (activePlanObj.planName || activePlanObj.planNumber) : `Active Rig ($${activeMiningPower})`)
    : '';
  const activePlanName = activeMiningPower > 0
    ? (activePlanObj ? `${activePlanObj.planName || activePlanObj.planNumber} ($${activePlanObj.amount} Tier)` : `Active Mining Plan ($${activeMiningPower} USD)`)
    : 'No Active Plan';

  // Support Tickets Queue & Inbox State (Strictly scoped per user / device guest ID)
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      localStorage.removeItem('neon_user_tickets'); // Purge legacy shared key
      const ownerId = (isLoggedIn && userName ? userName : getDeviceGuestId()).toLowerCase();
      const raw = localStorage.getItem(`neon_tickets_${ownerId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Re-sync local tickets whenever user logs in or switches account
  useEffect(() => {
    const ownerId = (isLoggedIn && userName ? userName : getDeviceGuestId()).toLowerCase();
    const raw = localStorage.getItem(`neon_tickets_${ownerId}`);
    setSupportTickets(raw ? JSON.parse(raw) : []);
  }, [isLoggedIn, userName]);

  const [showSupportInboxModal, setShowSupportInboxModal] = useState(false);
  const [inboxInitialTab, setInboxInitialTab] = useState<'new' | 'inbox' | 'broadcasts'>('new');

  const hasUnreadTicketReply = useMemo(() => {
    return supportTickets.some(
      (t) => (t.status === 'replied' || !!t.adminReply) && t.userRead === false
    );
  }, [supportTickets]);

  // Global Broadcast Announcements & Read Tracking
  const [broadcastVersion, setBroadcastVersion] = useState(0);

  useEffect(() => {
    const fetchBroadcastsFromD1 = async () => {
      try {
        const res = await nexoraApi.getBroadcasts();
        if (res && res.success && Array.isArray(res.broadcasts)) {
          try {
            localStorage.setItem('neon_broadcast_announcements', JSON.stringify(res.broadcasts));
            setBroadcastVersion((v) => v + 1);
          } catch {}
        }
      } catch (e) {}
    };
    fetchBroadcastsFromD1();
    const interval = setInterval(fetchBroadcastsFromD1, 60000);

    const handleBroadcastSync = () => {
      setBroadcastVersion((v) => v + 1);
    };
    window.addEventListener('storage', handleBroadcastSync);
    window.addEventListener('neon_broadcast_sync', handleBroadcastSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleBroadcastSync);
      window.removeEventListener('neon_broadcast_sync', handleBroadcastSync);
    };
  }, []);

  const hasUnreadBroadcast = useMemo(() => {
    try {
      const raw = localStorage.getItem('neon_broadcast_announcements');
      if (!raw) return false;
      const all: AdminBroadcastMessage[] = JSON.parse(raw);
      const readRaw = localStorage.getItem('neon_read_broadcasts');
      const readIds: string[] = readRaw ? JSON.parse(readRaw) : [];
      const userHasPlan = activeMiningPower > 0;

      return all.some((b) => {
        if (readIds.includes(b.id)) return false;
        if (b.targetAudience === 'all') return true;
        if (userHasPlan && b.targetAudience === 'active_miners') return true;
        if (!userHasPlan && b.targetAudience === 'no_plan') return true;
        return false;
      });
    } catch {
      return false;
    }
  }, [activeMiningPower, broadcastVersion]);

  const hasUnreadInboxNotification = hasUnreadTicketReply || hasUnreadBroadcast;

  const handleOpenSupportInbox = (tab?: 'new' | 'inbox' | 'broadcasts') => {
    let targetTab: 'new' | 'inbox' | 'broadcasts' = tab || 'inbox';
    if (!tab) {
      if (hasUnreadBroadcast && !hasUnreadTicketReply) {
        targetTab = 'broadcasts';
      } else {
        targetTab = 'inbox';
      }
    }
    setInboxInitialTab(targetTab);
    setShowSupportInboxModal(true);
  };

  // Sync user tickets with Cloudflare D1 backend strictly scoped to active user
  useEffect(() => {
    const fetchLiveTickets = async () => {
      try {
        const ownerId = (isLoggedIn && userName ? userName : getDeviceGuestId()).toLowerCase();
        const res = await nexoraApi.getUserTickets({
          userId: ownerId,
          email: isLoggedIn && userEmail ? userEmail : undefined,
          mobile: isLoggedIn && userMobile ? userMobile : undefined
        });
        if (res && res.success && Array.isArray(res.tickets)) {
          setSupportTickets(res.tickets);
          try {
            localStorage.setItem(`neon_tickets_${ownerId}`, JSON.stringify(res.tickets));
          } catch {}
        }
      } catch (e) {}
    };

    fetchLiveTickets();
    const interval = setInterval(fetchLiveTickets, 45000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userName, userEmail, userMobile]);

  // Checkout Modal State
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<MiningPlan | null>(null);
  const [isUpgradeModal, setIsUpgradeModal] = useState(false);
  const [upgradeDiffAmount, setUpgradeDiffAmount] = useState<number | undefined>(undefined);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showCreateFundPasswordModal, setShowCreateFundPasswordModal] = useState(false);
  const [showP2PTransferModal, setShowP2PTransferModal] = useState(false);
  const [showWithdrawalHistoryModal, setShowWithdrawalHistoryModal] = useState(false);
  const [showDepositHistoryModal, setShowDepositHistoryModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<LegalPolicyKey>('terms');

  // Pending plan checkout intent if user clicked buy while logged out
  const [pendingPlanAfterAuth, setPendingPlanAfterAuth] = useState<{
    plan: MiningPlan;
    isUpgrade?: boolean;
    diffAmount?: number;
  } | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Blockchain Ticker State
  const [blockNumber, setBlockNumber] = useState(34912882);

  const showToast = (msg: string) => {
    if (showAdminPortal) return; // Completely isolate user-facing toasts from admin portal
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Isolate Admin Portal: Dismiss promotional popup and user toasts whenever Admin is active
  useEffect(() => {
    if (showAdminPortal) {
      setShowPromoPopup(false);
      setToastMessage(null);
    }
  }, [showAdminPortal]);

  // Multi-Language Retrigger Hook (Ensures Google Translate processes dynamic modals, popups, and route changes)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      retriggerGoogleTranslate();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [
    activeRoute,
    isLoggedIn,
    showDepositDialog,
    showWithdrawalModal,
    showP2PTransferModal,
    showWithdrawalHistoryModal,
    showDepositHistoryModal,
    showAdminPortal,
    showAuthModal,
    selectedPlanForCheckout
  ]);

  // Live Cloudflare D1 Backend Admin Miners Synchronizer
  const fetchLiveAdminUsers = useCallback(async () => {
    try {
      const res = await nexoraApi.getAdminUsers();
      if (res && res.success && Array.isArray(res.users)) {
        const activeDbUsers = res.users.filter((u: any) => !isTestAccount(u.id, u.name, u.email));
        // Dynamically compute direct referrals count from upline connections
        const getDirectRefsCount = (user: any) => {
          if (user.direct_referrals_count !== undefined && user.direct_referrals_count !== null && Number(user.direct_referrals_count) > 0) {
            return Number(user.direct_referrals_count);
          }
          const uId = (user.id || '').toUpperCase();
          const uRef = (user.referral_code || '').toUpperCase();
          const uRefSuffix = uRef.length >= 5 ? uRef.slice(-5) : uRef;

          return activeDbUsers.filter((other: any) => {
            if (other.id === user.id) return false;
            const upline = (other.upline_code || '').toUpperCase();
            if (!upline) return false;
            return (
              upline === uId ||
              (uRef && upline === uRef) ||
              (uRefSuffix && upline.endsWith(uRefSuffix))
            );
          }).length;
        };

        const mappedUsers: AdminUserRecord[] = activeDbUsers.map((u: any) => {
          const staked = Number(u.active_mining_power) || 0;
          const depBal = Number(u.deposit_balance) || 0;
          const withBal = Number(u.withdrawable_balance) || 0;
          const available = withBal; // Strictly actual withdrawable balance
          const isMining = Boolean(
            u.is_mining_active === 1 ||
            u.isMiningActive === true ||
            (staked > 0 && (u.status === 'active' || !u.status))
          );
          return {
            id: u.id,
            name: u.name || u.id,
            email: u.email || `${u.id.toLowerCase()}@nexora.io`,
            mobile: u.mobile || '',
            country: 'IN',
            registeredAt: formatUsaDateTime(u.created_at),
            status: (u.status as any) || 'active',
            currentPlanName: u.active_contract_plan || (staked > 0 ? `Active Plan ($${staked})` : 'No Plan Purchased (Inactive)'),
            stakedAmount: staked,
            totalMinedYield: Number(u.total_mined_yield) || 0,
            availableBalance: available,
            depositBalance: depBal,
            totalWithdrawn: Number(u.total_withdrawn) || 0,
            fundPin: u.fund_pin || '',
            fundPinSet: u.fund_pin_set === 1,
            referralCode: u.referral_code || '',
            invitedBy: u.upline_code || 'DIRECT',
            directReferralsCount: getDirectRefsCount(u),
            referralEarnings: Number(u.referral_balance) || 0,
            dailyYieldUsdt: Number(u.daily_yield_usdt) || 0,
            dailyRatePercent: Number(u.daily_rate_percent) || 0,
            lastLogin: 'Active',
            walletAddress: '0x' + u.id,
            isMiningActive: isMining
          };
        });
        if (mappedUsers.length === 0) {
          setAdminUsers([]);
          setAdminOrders([]);
          setAdminTelemetry((prev) => ({
            ...prev,
            totalRegisteredUsers: 0,
            totalOrdersCount: 0,
            totalPlatformRevenue: 0,
            totalStakedPower: 0,
            activeMinersCount: 0
          }));
          try {
            localStorage.setItem('neon_admin_orders', '[]');
            localStorage.setItem('neon_admin_users', '[]');
          } catch (e) {}
        } else {
          setAdminUsers(mappedUsers);
          setAdminTelemetry((prev) => ({
            ...prev,
            totalRegisteredUsers: mappedUsers.length,
            totalStakedPower: mappedUsers.reduce((sum, u) => sum + u.stakedAmount, 0),
            activeMinersCount: mappedUsers.filter((u) => u.stakedAmount > 0).length
          }));
          try {
            localStorage.setItem('neon_admin_users', JSON.stringify(mappedUsers));
          } catch (e) {}

          // Live sync real orders from D1 deposits
          try {
            const depRes = await nexoraApi.getAdminDeposits();
            if (depRes && depRes.success && Array.isArray(depRes.deposits)) {
              const liveOrders: AdminOrderRecord[] = depRes.deposits
                .filter((d: any) => mappedUsers.some((u) => u.id === d.user_id || u.name === d.user_name))
                .filter((d: any) => d.network !== 'P2P Transfer' && !String(d.network).includes('P2P') && d.token !== 'P2P')
                .map((d: any) => {
                  const amt = Number(d.amount) || 0;
                  const isP2P = d.network === 'P2P Transfer' || d.token === 'P2P';
                  const isPlan = d.is_plan === 1 || String(d.order_id).startsWith('PLAN-');
                  return {
                    id: d.order_id,
                    orderNumber: d.order_id,
                    userId: d.user_id,
                    userName: d.user_name || d.user_id,
                    planId: isPlan ? 'plan_bought' : (isP2P ? 'p2p_transfer' : 'direct_deposit'),
                    planName: isPlan ? (d.plan_name || `Plan Bought ($${amt.toFixed(2)})`) : (isP2P ? `P2P Inbound Transfer ($${amt.toFixed(2)})` : `Direct BEP-20 Deposit ($${amt.toFixed(2)})`),
                    planAmount: amt,
                    amountPaid: amt,
                    txHash: d.tx_hash,
                    paymentMethod: isPlan ? 'crypto' : (isP2P ? 'p2p' : 'bep20'),
                    status: d.status === 'confirmed' || d.status === 'Settled' ? 'completed' : (d.status as any),
                    createdAt: formatUsaDateTime(d.created_at)
                  };
                });
              setAdminOrders(liveOrders);
              try {
                localStorage.setItem('neon_admin_orders', JSON.stringify(liveOrders));
              } catch (e) {}
            }
          } catch (err) {}
        }
        // Also fetch real sub-admins from Cloudflare D1
        nexoraApi.getSubAdmins().then((subRes) => {
          if (subRes && subRes.success && Array.isArray(subRes.subadmins)) {
            const mappedSubs: SubAdminUser[] = subRes.subadmins.map((s: any) => ({
              id: s.id,
              name: s.name || s.email?.split('@')[0] || 'Staff Sub-Admin',
              email: s.email,
              username: s.email?.split('@')[0]?.toLowerCase(),
              password: s.password_hash || '••••••••',
              canApproveWithdrawals: false,
              canResetPasswords: false,
              maxApprovalLimit: 0
            }));
            const seen = new Set<string>();
            const uniqueSubs = mappedSubs.filter((s) => {
              const k = (s.id || s.email || '').toLowerCase();
              if (!k || seen.has(k)) return false;
              seen.add(k);
              return true;
            });
            setSubAdmins(uniqueSubs);
            try {
              localStorage.setItem('neon_sub_admins', JSON.stringify(uniqueSubs));
            } catch (e) {}
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to sync admin users from D1:', err);
    }
  }, []);

  // Live Cloudflare D1 Backend Admin Withdrawals Synchronizer
  const fetchLiveAdminWithdrawals = useCallback(async () => {
    try {
      const res = await nexoraApi.getAdminWithdrawals();
      if (res && res.success && Array.isArray(res.withdrawals)) {
        const mappedWithdrawals: WithdrawalRequest[] = res.withdrawals.map((w: any) => ({
          id: w.id,
          userId: w.user_id,
          userName: w.user_name || w.user_id,
          userMobile: w.user_mobile || '',
          amount: Number(w.amount) || 0,
          fee: Number(w.fee) || 0,
          netAmount: Number(w.net_amount) || 0,
          walletAddress: w.wallet_address || '',
          status: (w.status as any) || 'pending',
          timestamp: formatUsaDateTime(w.created_at),
          timestampMs: w.created_at ? new Date(w.created_at).getTime() : Date.now(),
          type: w.wallet_address?.startsWith('P2P') ? 'p2p_transfer' : 'blockchain',
          txHash: w.tx_hash || '',
          rejectionReason: w.rejection_reason
        }));
        setAdminWithdrawals(mappedWithdrawals);
        try {
          localStorage.setItem('neon_admin_withdrawals', JSON.stringify(mappedWithdrawals));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[App] Failed to sync admin withdrawals from D1:', err);
    }
  }, []);

  // Live Cloudflare D1 Backend Platform Settings Synchronizer
  const fetchPlatformSettings = useCallback(async () => {
    try {
      const data = await nexoraApi.getSettings();
      if (data) {
        const vaultAddr = (data.vault_address || data.vaultWalletAddress || '').trim();
        setPlatformSettings((prev) => {
          const updated = {
            ...prev,
            vaultWalletAddress: (vaultAddr && vaultAddr.startsWith('0x') && vaultAddr.length === 42) ? vaultAddr : prev.vaultWalletAddress,
            minDepositAmount: data.min_deposit ? parseFloat(data.min_deposit) : prev.minDepositAmount,
            minWithdrawalAmount: data.min_withdrawal ? parseFloat(data.min_withdrawal) : prev.minWithdrawalAmount,
            withdrawalFeePercent: data.withdrawal_fee_percent ? parseFloat(data.withdrawal_fee_percent) : prev.withdrawalFeePercent,
            p2pFeePercent: data.p2p_fee_percent ? parseFloat(data.p2p_fee_percent) : prev.p2pFeePercent,
            popupImageUrl: data.popup_image_url !== undefined ? data.popup_image_url : (data.popupImageUrl !== undefined ? data.popupImageUrl : prev.popupImageUrl),
            popupLinkUrl: data.popup_link_url !== undefined ? data.popup_link_url : (data.popupLinkUrl !== undefined ? data.popupLinkUrl : prev.popupLinkUrl),
            popupEnabled: data.popup_enabled !== undefined ? (String(data.popup_enabled) === 'true' || String(data.popup_enabled) === '1') : prev.popupEnabled
          };
          try {
            localStorage.setItem('neon_platform_settings', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    } catch (err) {
      console.warn('[App] Failed to sync platform settings from D1:', err);
    }
  }, []);

  // Live Cloudflare D1 Backend Data Synchronization
  useEffect(() => {
    // 1. Initial fetch & periodic background polling every 12 seconds
    fetchLiveAdminUsers();
    fetchLiveAdminWithdrawals();
    fetchPlatformSettings();
    const syncInterval = setInterval(() => {
      fetchLiveAdminUsers();
      fetchLiveAdminWithdrawals();
      fetchPlatformSettings();
    }, 12000);
    return () => clearInterval(syncInterval);
  }, [fetchLiveAdminUsers, fetchLiveAdminWithdrawals, fetchPlatformSettings]);

  // Helper to perform full clean session logout
  const performLogout = useCallback((reasonMessage?: string) => {
    const keysToRemove = [
      'neon_is_logged_in', 'neon_user_name', 'neon_user_mobile', 'neon_user_email',
      'neon_fund_password', 'neon_upline_code', 'neon_referral_code', 'neon_session_token',
      'neon_total_balance', 'neon_deposit_balance', 'neon_mining_power', 'neon_total_rewards',
      'neon_referral_income', 'neon_referral_balance', 'neon_total_orc_income', 'neon_orc_balance', 'neon_yesterdays_income',
      'neon_available_withdrawal', 'neon_mining_active', 'neon_seconds_remaining',
      'neon_unclaimed_yield', 'neon_transactions', 'neon_withdrawal_requests',
      'neon_referred_users', 'neon_total_withdrawn'
    ];
    keysToRemove.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });

    setIsLoggedIn(false);
    setShowAuthModal(false);
    setIsSignUpMode(false);
    setIncomingResetToken(null);
    setIncomingResetEmail(null);
    setUserName('');
    setUserMobile('');
    setUserEmail('');
    setUserFundPassword('');
    setUserFundPinSet(false);
    setActiveMiningPower(0);
    setIsMiningActive(false);
    setSecondsRemaining(24 * 3600);
    setDepositBalance(0);
    setAvailableWithdrawal(0);
    setTotalBalance(0);
    setTotalRewards(0);
    setServerTotalWithdrawn(0);
    setReferralIncome(0);
    setReferralBalance(0);
    setTotalOrcIncome(0);
    setOrcBalance(0);
    setYesterdaysIncome(0);
    setTransactions([]);
    setWithdrawalRequests([]);
    setReferredUsers([]);

    if (reasonMessage) {
      showToast(reasonMessage);
    }
  }, []);

  // Helper to perform full clean admin session logout
  const performAdminLogout = useCallback((reasonMessage?: string) => {
    try {
      localStorage.removeItem('neon_admin_auth');
      localStorage.removeItem('neon_admin_role');
      localStorage.removeItem('neon_admin_name');
      localStorage.removeItem('neon_admin_last_active');
      sessionStorage.removeItem('neon_admin_auth');
      sessionStorage.removeItem('neon_admin_role');
      sessionStorage.removeItem('neon_admin_name');
    } catch {}
    setShowAdminPortal(false);
    if (reasonMessage) {
      showToast(reasonMessage);
    }
  }, []);

  // 15-Minute Auto-Logout Engine for User & Admin (Active on-screen vs Background / Idle)
  useEffect(() => {
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (900,000 ms)

    // Ensure neon_last_active_time is initialized
    try {
      if (!localStorage.getItem('neon_last_active_time')) {
        localStorage.setItem('neon_last_active_time', String(Date.now()));
      }
    } catch {}

    const checkAndEnforceInactivity = () => {
      try {
        // Standalone Mobile App Rule: NEVER auto-logout!
        if (isStandaloneApp) {
          return;
        }

        const now = Date.now();
        const storedLastActive = Number(localStorage.getItem('neon_last_active_time')) || now;
        const elapsed = now - storedLastActive;

        const isUserActive = localStorage.getItem('neon_is_logged_in') === 'true' || isLoggedIn;

        // Auto-logout ONLY normal web users after 15 minutes of inactivity
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          if (isUserActive) {
            performLogout('Signed out due to inactivity.');
            try {
              localStorage.setItem('neon_last_active_time', String(now));
            } catch {}
          }
        }
      } catch {}
    };

    // Check immediately on mount (e.g. if user/admin opened Chrome/app after > 15 minutes)
    checkAndEnforceInactivity();

    // Throttled activity recorder while active on screen
    let lastRecord = 0;
    const recordUserActivity = () => {
      const now = Date.now();
      if (now - lastRecord > 4000) {
        lastRecord = now;
        try {
          localStorage.setItem('neon_last_active_time', String(now));
          if (localStorage.getItem('neon_admin_auth') === 'true') {
            localStorage.setItem('neon_admin_last_active', String(now));
          }
        } catch {}
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App backgrounded, tab switched, or phone locked: record exact exit timestamp
        const now = Date.now();
        try {
          localStorage.setItem('neon_last_active_time', String(now));
          if (localStorage.getItem('neon_admin_auth') === 'true') {
            localStorage.setItem('neon_admin_last_active', String(now));
          }
        } catch {}
      } else if (document.visibilityState === 'visible') {
        // Returned to screen: check if >= 15 minutes elapsed
        checkAndEnforceInactivity();
        recordUserActivity();
      }
    };

    const handleFocus = () => {
      checkAndEnforceInactivity();
      recordUserActivity();
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Periodic check every 10 seconds (handles both idle on-screen and returning tab)
    const inactivityInterval = setInterval(checkAndEnforceInactivity, 10000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, recordUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(inactivityInterval);
    };
  }, [isLoggedIn, performLogout, performAdminLogout]);

  // Fetch real wallet history (transactions, withdrawals, deposits) from Cloudflare D1
  const fetchWalletHistory = useCallback(() => {
    if (!userName) return;
    nexoraApi.getWalletHistory(userName).then((res) => {
      if (res && res.success) {
        if (Array.isArray(res.transactions)) {
          const mappedTxs: TransactionRecord[] = res.transactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount) || 0,
            date: formatUsaDateTime(t.created_at),
            status: t.status || 'Settled',
            txHash: t.tx_hash || t.id
          }));
          setTransactions(mappedTxs);
        }
        if (Array.isArray(res.withdrawals)) {
          const mappedWd: WithdrawalRequest[] = res.withdrawals.map((w: any) => {
            const isP2P = w.wallet_address?.toLowerCase().includes('p2p');
            const recipientMatch = isP2P ? w.wallet_address.match(/@([a-zA-Z0-9_]+)/) : null;
            return {
              id: w.id,
              userId: w.user_id,
              userName: userName,
              userMobile: userMobile,
              amount: Number(w.amount) || 0,
              fee: Number(w.fee) || 0,
              netAmount: Number(w.net_amount) || 0,
              walletAddress: w.wallet_address || '',
              status: w.status || 'pending',
              timestamp: formatUsaDateTime(w.created_at),
              timestampMs: parseUtcMs(w.created_at) || Date.now(),
              txHash: w.tx_hash,
              type: isP2P ? 'p2p_transfer' : 'withdrawal',
              recipientId: recipientMatch ? recipientMatch[1] : (isP2P ? w.wallet_address.replace(/.*@/, '') : undefined),
              rejectionReason: w.rejection_reason
            };
          });
          setWithdrawalRequests(mappedWd);
        }

        // Sync deposit history: Merge real on-chain deposits + incoming P2P transfers
        const allDeposits: DepositRecord[] = [];
        const seenHashes = new Set<string>();

        if (Array.isArray(res.deposits)) {
          for (const d of res.deposits) {
            const isP2P = d.network === 'P2P Transfer' || d.token === 'P2P' || (d.vault_address && d.vault_address.startsWith('@'));
            const cleanSender = isP2P ? (d.vault_address || '').replace(/^@/, '') : undefined;
            const hashKey = (d.tx_hash || d.order_id || '').toLowerCase();
            if (hashKey) seenHashes.add(hashKey);
            allDeposits.push({
              id: d.order_id || `dep_${d.id || Date.now()}`,
              amount: normalizeToPlanTier(Number(d.amount) || 0),
              timestamp: formatUsaDateTime(d.created_at || d.confirmed_at),
              timestampMs: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
              status: (d.status === 'confirmed' || d.status === 'completed') ? 'completed' : 'pending',
              type: isP2P ? 'p2p_received' : 'bep20_deposit',
              token: d.token || 'USDT',
              network: isP2P ? 'P2P Transfer' : (d.network || 'BNB Smart Chain (BEP-20)'),
              txHash: d.tx_hash,
              senderId: cleanSender
            });
          }
        }

        if (Array.isArray(res.transactions)) {
          const incomingTxs = res.transactions.filter(
            (t: any) => Number(t.amount) > 0 && (
              t.type?.toLowerCase().includes('deposit') || 
              t.type?.toLowerCase().includes('p2p')
            )
          );
          for (const t of incomingTxs) {
            const hashKey = (t.tx_hash || t.id || '').toLowerCase();
            if (hashKey && seenHashes.has(hashKey)) continue;
            if (hashKey) seenHashes.add(hashKey);
            const isP2P = t.type?.toLowerCase().includes('p2p');
            const senderMatch = isP2P ? t.type.match(/@([a-zA-Z0-9_]+)/) : null;
            allDeposits.push({
              id: t.id || `DEP-${Math.random().toString(36).substring(2, 8)}`,
              amount: normalizeToPlanTier(Number(t.amount) || 0),
              timestamp: formatUsaDateTime(t.created_at),
              timestampMs: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
              status: 'completed',
              type: isP2P ? 'p2p_received' : 'bep20_deposit',
              token: 'USDT',
              network: isP2P ? 'P2P Transfer' : 'BNB Smart Chain (BEP-20)',
              txHash: t.tx_hash || t.id,
              senderId: senderMatch ? senderMatch[1] : undefined
            });
          }
        }

        // Clean out any legacy demo / seeded records
        const cleanDeposits = allDeposits.filter(
          (r) => !r.id?.startsWith('dep_seed_') && !r.id?.startsWith('demo_') && !r.id?.startsWith('dep_demo_')
        );
        setDepositRecords(cleanDeposits);
      }
    }).catch(() => {});
  }, [userName, userMobile]);

  // 2. If user is logged in, verify session & sync real wallet from D1 (Single Active Session Enforcement)
  useEffect(() => {
    if (!isLoggedIn || !userName) return;

    const verifyAndSyncSession = async () => {
      try {
        const storedToken = localStorage.getItem('neon_session_token') || '';
        const res = await nexoraApi.getUserProfile(userName, storedToken);

        // CONCURRENT LOGIN DETECTION:
        // If another device logged in with the same user ID & password, kick this session out immediately!
        if (res && res.sessionInvalidated) {
          performLogout('Session expired. Logged in from another device.');
          return;
        }

        if (res && res.success && res.user && res.wallet) {
          if (res.sessionToken && !storedToken) {
            try {
              localStorage.setItem('neon_session_token', res.sessionToken);
            } catch (e) {}
          }
          const w = res.wallet;
          const dep = Number(w.depositBalance ?? w.deposit_balance) || 0;
          const withdr = Number(w.withdrawableBalance ?? w.withdrawable_balance) || 0;
          const ref = Number(w.referralBalance ?? w.referral_balance) || 0;
          const power = Number(w.activeMiningPower ?? w.active_mining_power) || 0;
          const mined = Number(w.totalMinedYield ?? w.total_mined_yield) || 0;

          // Cloudflare D1 Database is the single source of truth
          if (power > 0) {
            setActiveMiningPower(power);
            try {
              localStorage.setItem('neon_mining_power', String(power));
            } catch (e) {}
          } else if (w.activeMiningPower !== undefined || w.active_mining_power !== undefined) {
            setActiveMiningPower(0);
          }
          setDepositBalance(dep);
          setAvailableWithdrawal(withdr);
          setReferralBalance(ref);
          setReferralIncome((prev) => Math.max(prev, ref));
          const orcInc = Number((w as any).totalOrcIncome ?? (w as any).total_orc_income) || 0;
          const orcBal = Number((w as any).orcBalance ?? (w as any).orc_balance) || 0;
          if (orcInc > 0) setTotalOrcIncome((prev) => Math.max(prev, orcInc));
          setOrcBalance(orcBal);
          try {
            localStorage.setItem('neon_referral_balance', String(ref));
            localStorage.setItem('neon_orc_balance', String(orcBal));
            localStorage.setItem('neon_available_withdrawal', String(withdr));
          } catch (e) {}
          if (mined > 0) setTotalRewards(mined);
          const settled = Number(w.totalWithdrawn ?? w.total_withdrawn) || 0;
          setServerTotalWithdrawn(settled);
          try {
            localStorage.setItem('neon_total_withdrawn', String(settled));
          } catch (e) {}
          setTotalBalance(+(dep + withdr).toFixed(2));

          // Sync Unclaimed Mining Yield from Server (Cloudflare D1 is single source of truth)
          const unc = Number(w.unclaimedYield ?? w.unclaimed_yield) || 0;
          setUnclaimedYield(unc);
          try {
            localStorage.setItem('neon_unclaimed_yield', String(unc));
          } catch (e) {}

          if (res.user.email) setUserEmail(res.user.email);
          if (res.user.mobile) setUserMobile(res.user.mobile);
          if (res.user.referralCode) setUserReferralCode(res.user.referralCode);

          // Server-driven 24H cloud mining state sync across all phones
          const serverStartedAt = Number(w.miningCycleStartedAt ?? w.mining_cycle_started_at) || 0;
          const hasServerMiningField = w.miningCycleStartedAt !== undefined || w.mining_cycle_started_at !== undefined || w.isMiningActive !== undefined;
          if (hasServerMiningField) {
            const elapsed = serverStartedAt > 0 ? (Date.now() - serverStartedAt) : Infinity;
            const CYCLE_MS = 24 * 3600 * 1000;
            if (serverStartedAt > 0 && elapsed < CYCLE_MS) {
              setIsMiningActive(true);
              const rem = w.miningRemainingSeconds !== undefined ? Number(w.miningRemainingSeconds) : Math.max(0, Math.floor((CYCLE_MS - elapsed) / 1000));
              setSecondsRemaining(rem);
              try {
                localStorage.setItem('neon_mining_active', 'true');
                localStorage.setItem('neon_mining_start_time', String(serverStartedAt));
                localStorage.setItem('neon_seconds_remaining', String(rem));
              } catch (e) {}
            } else {
              setIsMiningActive(false);
              setSecondsRemaining(0);
              try {
                localStorage.setItem('neon_mining_active', 'false');
                localStorage.removeItem('neon_mining_start_time');
              } catch (e) {}
              if (serverStartedAt > 0 && power > 0 && unc <= 0) {
                complete24HourMiningCycle(power);
              }
            }
          }

          // FUND PIN STATUS: Directly sync from D1 database for THIS specific user ID.
          if (res.user.fundPinSet !== undefined) {
            setUserFundPinSet(Boolean(res.user.fundPinSet));
          }
        } else if (res && !res.networkError && (res.userNotFound || res.message === 'User not found' || (res.error && String(res.error).toLowerCase().includes('not found')))) {
          // Stale / invalid session (user deleted, wiped from D1, or not found)
          performLogout();
        }
      } catch (e) {}
    };

    verifyAndSyncSession();

    const handleFocusSync = () => {
      if (document.visibilityState === 'visible') {
        verifyAndSyncSession();
        fetchWalletHistory();
      }
    };
    window.addEventListener('visibilitychange', handleFocusSync);
    window.addEventListener('focus', handleFocusSync);

    fetchWalletHistory();

    // Periodic sync every 30 seconds when tab is active (pauses when minimized to save D1 reads)
    const sessionInterval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      verifyAndSyncSession();
      fetchWalletHistory();
    }, 30000);

      // 4. Fetch real referred downlines (L1 + L2 + L3) from Cloudflare D1
      nexoraApi.getDownlines(userName).then((res) => {
        if (res && res.success) {
          // Helper to map a downline record with correct level info
          const mapDownline = (d: any, lvl: number): ReferredUserItem => {
            const power = Number(d.active_mining_power) || 0;
            const commissionRate = lvl === 1 ? 0.10 : lvl === 2 ? 0.05 : lvl === 3 ? 0.02 : 0;
            const memberWithdrawable = Number(d.withdrawable_balance || 0);
            const memberYield = Number(d.total_mined_yield || 0);
            const memberRef = Number(d.referral_balance || 0);
            const totalEarnings = memberWithdrawable > 0 ? memberWithdrawable : (memberYield + memberRef);
            return {
              id: d.id,
              name: d.name || d.id,
              mobile: d.mobile || '',
              registeredAt: d.created_at || 'Recently',
              planName: power > 0 ? `Active Node ($${power})` : 'No Plan',
              planAmount: power,
              commissionEarned: totalEarnings > 0 ? +totalEarnings.toFixed(2) : +(power * commissionRate).toFixed(2),
              status: d.status === 'active' ? 'active' : 'inactive',
              level: lvl,
              invitedBy: lvl === 1 ? 'Direct (You)' : lvl === 2 ? 'Your L1 Referral' : lvl === 3 ? 'Your L2 Referral' : `Your L${lvl - 1} Referral`,
              teamSize: Number(d.team_size ?? d.teamSize ?? 0)
            };
          };

          // Use structured downlines (10 tiers) from API
          let allMapped: ReferredUserItem[] = [];
          if (Array.isArray(res.downlines) && res.downlines.length > 0) {
            allMapped = res.downlines.map((d: any) => mapDownline(d, d.level || 1));
          } else if (Array.isArray(res.l1) || Array.isArray(res.l2) || Array.isArray(res.l3)) {
            const l1Mapped = (res.l1 || []).map((d: any) => mapDownline(d, 1));
            const l2Mapped = (res.l2 || []).map((d: any) => mapDownline(d, 2));
            const l3Mapped = (res.l3 || []).map((d: any) => mapDownline(d, 3));
            allMapped = [...l1Mapped, ...l2Mapped, ...l3Mapped];
          }

          if (allMapped.length > 0) {
            // Update team turnover & Milestone 1 calculation ($1,000 Total Team + $250 Self+L1)
            const l1Mapped = allMapped.filter((d) => d.level === 1);
            const l2Mapped = allMapped.filter((d) => d.level === 2);
            const l3Mapped = allMapped.filter((d) => d.level === 3);
            const l1Vol = l1Mapped.reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            const l2Vol = l2Mapped.reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            const l3Vol = l3Mapped.reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            const totalAllDownlineVol = allMapped.reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            const totalMilestoneVol = activeMiningPower + totalAllDownlineVol;
            const directEligible = activeMiningPower + l1Vol;
            const isMilestone1 = totalMilestoneVol >= 1000 && directEligible >= 250;

            setTeamTurnover({
              personalStaked: activeMiningPower,
              downlineL1: l1Vol,
              downlineL2: l2Vol,
              downlineL3: l3Vol,
              totalVolume: totalMilestoneVol,
              boostedRate: isMilestone1 ? 1.5 : 1.0
            });

            setReferredUsers(allMapped);
            try {
              localStorage.setItem('neon_cached_downlines', JSON.stringify(allMapped));
              localStorage.setItem('neon_cached_downlines_' + userName.toUpperCase(), JSON.stringify(allMapped));
            } catch (e) {}

            // Update referral stake commission (strictly cumulative lifetime tiers 1 to 3)
            const tier1to3Commission = allMapped
              .filter((d: ReferredUserItem) => (d.level || 1) <= 3)
              .reduce((s: number, d: ReferredUserItem) => s + (d.commissionEarned || 0), 0);
            if (tier1to3Commission > 0) {
              setReferralIncome((prev) => +(Math.max(prev, tier1to3Commission)).toFixed(2));
            }

            // Calculate Over-Ride Commission (ORC across all 10 tiers)
            const orcDailyYield = allMapped.reduce((s: number, d: ReferredUserItem) => {
              return s + getMemberOrcDailyYield(d);
            }, 0);
            if (orcDailyYield > 0) {
              setTotalOrcIncome((prev) => +(Math.max(prev, orcDailyYield)).toFixed(2));
            }
          }
        }
      }).catch(() => {
        // Fall back to cached downlines on temporary network/database limits
        const cached = localStorage.getItem('neon_cached_downlines_' + userName.toUpperCase()) || localStorage.getItem('neon_cached_downlines');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setReferredUsers(parsed);
            }
          } catch (e) {}
        }
      });

      return () => {
        clearInterval(sessionInterval);
        window.removeEventListener('visibilitychange', handleFocusSync);
        window.removeEventListener('focus', handleFocusSync);
      };
  }, [isLoggedIn, userName, showAdminPortal, performLogout]);

  // Automatically trigger promotional popup modal 3.5 seconds after opening (User side only, if not on maintenance notice)
  useEffect(() => {
    if (showAdminPortal || showMaintenanceModal) return;
    const promoTimer = setTimeout(() => {
      if (!showAdminPortal && !showMaintenanceModal) {
        setShowPromoPopup(true);
      }
    }, 3500);
    return () => clearTimeout(promoTimer);
  }, [showAdminPortal, showMaintenanceModal]);

  // Check URL query parameters (?ref=CODE, ?admin=portal) on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const refParam = searchParams.get('ref');
      if (refParam) {
        const cleanRef = refParam.toUpperCase();
        setPreFilledRefCode(cleanRef);
        setUserUplineCode(cleanRef);
        setIsSignUpMode(true);
        setShowAuthModal(true);
      }
      const adminParam = searchParams.get('admin');
      if (!isStandaloneApp && (adminParam === 'portal' || adminParam === 'true' || adminParam === '1')) {
        setUserRole(getStoredAdminRole());
        setShowAdminPortal(true);
      }
    }
  }, [isStandaloneApp]);

  // Strict ZERO-ADMIN policy in Standalone Android APK (Admin only allowed in standard Web Browser)
  useEffect(() => {
    if (isStandaloneApp) {
      if (showAdminPortal) {
        setShowAdminPortal(false);
      }
      if (userRole === 'superadmin' || userRole === 'subadmin') {
        setUserRole('user');
      }
      if (typeof window !== 'undefined' && window.location.hash === '#admin') {
        window.history.replaceState({ route: 'home' }, '', '#home');
        setActiveRoute('home');
      }
    }
  }, [isStandaloneApp, showAdminPortal, userRole]);

  // Helper: Complete 24-Hour Mining Cycle & Distribute Yield
  const complete24HourMiningCycle = (stakedAmount: number) => {
    if (stakedAmount <= 0) {
      setIsMiningActive(false);
      setSecondsRemaining(0);
      try {
        localStorage.setItem('neon_mining_active', 'false');
        localStorage.setItem('neon_seconds_remaining', '0');
        localStorage.removeItem('neon_mining_start_time');
      } catch (e) {}
      return;
    }

    // Find active plan daily yield rate (Tiered: 20 -> 1.0%, 50 -> 1.1%, 150 -> 1.2%, etc.)
    const currentPlan = getPlanForAmount(stakedAmount, miningPlans);
    const dailyRate = currentPlan?.dailyRatePercent || 1.0;
    const cycleYield = +(stakedAmount * (dailyRate / 100)).toFixed(2);

    // 1. Credit Yield to Unclaimed Reinvestment Balance (Strictly single cycle yield, never stacked)
    setUnclaimedYield(cycleYield);
    try {
      localStorage.setItem('neon_unclaimed_yield', String(cycleYield));
    } catch (e) {}
    setTotalRewards((prev) => +(prev + cycleYield).toFixed(2));
    setYesterdaysIncome(cycleYield);

    // 2. Add Ledger Record to Transactions
    const yieldTx: TransactionRecord = {
      id: `tx_${Date.now()}_yield`,
      type: `24H Mining Cycle Complete (${dailyRate}% on $${stakedAmount} USD Node - ${dailyRate}% Yield Unlocked)`,
      amount: cycleYield,
      date: 'Just now',
      status: 'Settled',
      txHash: '0x' + Math.random().toString(16).substring(2, 10) + '..core'
    };
    setTransactions((prev) => [yieldTx, ...prev]);

    // 3. Update Admin Directory Record
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (
          (userName && u.name.toUpperCase() === userName.toUpperCase()) ||
          (userName && u.id.toUpperCase() === userName.toUpperCase())
        ) {
          return {
            ...u,
            totalMinedYield: +(u.totalMinedYield + cycleYield).toFixed(2),
            lastLogin: 'Just now'
          };
        }
        return u;
      })
    );

    // 4. CRITICAL: Stop mining immediately and enter 1-Minute Cooldown (Water Blue)!
    // Exactly 1 cycle yield has been credited to unclaimed yield.
    setIsMiningActive(false);
    setSecondsRemaining(0);
    setIsCoolingDown(true);
    setCooldownSecondsRemaining(60);
    try {
      localStorage.setItem('neon_mining_active', 'false');
      localStorage.setItem('neon_seconds_remaining', '0');
      localStorage.removeItem('neon_mining_start_time');
      localStorage.setItem('neon_last_completed_mining_time', String(Date.now()));
      localStorage.setItem('neon_mining_cooldown_active', 'true');
      localStorage.setItem('neon_cooldown_start_time', String(Date.now()));
    } catch (e) {}

    showToast(
      `🎉 24-Hour Mining Cycle Complete! +$${cycleYield.toFixed(2)} USD yield unlocked. System entered 1-Minute Cool Down period (Water Blue).`
    );
  };

  // 1-Minute Cooldown Countdown Engine (Runs every second while isCoolingDown is true)
  useEffect(() => {
    if (!isCoolingDown) return;

    const timer = setInterval(() => {
      setCooldownSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Exactly 1 minute (60s) complete! Return to STOPPED (RED) state.
          setIsCoolingDown(false);
          try {
            localStorage.removeItem('neon_mining_cooldown_active');
            localStorage.removeItem('neon_cooldown_start_time');
          } catch (e) {}
          showToast('🔴 Cool Down complete! Core returned to RED. Tap to start next 24H cycle.');
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCoolingDown]);

  // 24H Proof-of-Activity Engine: Mount & Offline Continuity Check
  useEffect(() => {
    // Check if cooldown was active before reload
    const savedCooldown = loadStorageBool('neon_mining_cooldown_active', false);
    const savedCooldownStart = loadStorageNum('neon_cooldown_start_time', 0);
    if (savedCooldown && savedCooldownStart > 0) {
      const elapsedCd = Math.floor((Date.now() - savedCooldownStart) / 1000);
      if (elapsedCd < 60) {
        setIsCoolingDown(true);
        setCooldownSecondsRemaining(60 - elapsedCd);
      } else {
        setIsCoolingDown(false);
        try {
          localStorage.removeItem('neon_mining_cooldown_active');
          localStorage.removeItem('neon_cooldown_start_time');
        } catch (e) {}
      }
    }

    if (activeMiningPower <= 0) return;

    const savedActive = loadStorageBool('neon_mining_active', false);
    const savedStartTime = loadStorageNum('neon_mining_start_time', 0);

    if (savedActive && savedStartTime > 0) {
      const elapsedSeconds = Math.floor((Date.now() - savedStartTime) / 1000);
      const CYCLE_DURATION = 24 * 3600;

      if (elapsedSeconds < CYCLE_DURATION) {
        // Still running within current 24-hour cycle
        setIsMiningActive(true);
        setSecondsRemaining(CYCLE_DURATION - elapsedSeconds);
      } else {
        // 24-hour cycle finished while user was away!
        complete24HourMiningCycle(activeMiningPower);
        const overDue = elapsedSeconds - CYCLE_DURATION;
        if (overDue < 60) {
          setIsCoolingDown(true);
          setCooldownSecondsRemaining(60 - overDue);
          try {
            localStorage.setItem('neon_mining_cooldown_active', 'true');
            localStorage.setItem('neon_cooldown_start_time', String(Date.now() - overDue * 1000));
          } catch (e) {}
        } else {
          setIsCoolingDown(false);
          try {
            localStorage.removeItem('neon_mining_cooldown_active');
            localStorage.removeItem('neon_cooldown_start_time');
          } catch (e) {}
        }
      }
    }
  }, [activeMiningPower]);

  // 24H Auto-Stop Countdown Engine (Runs every second while mining is GREEN)
  useEffect(() => {
    if (!isMiningActive) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Exactly 24 hours completed!
          complete24HourMiningCycle(activeMiningPower);
          return 0;
        }
        const updated = prev - 1;
        try {
          localStorage.setItem('neon_seconds_remaining', String(updated));
        } catch (e) {}
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMiningActive, activeMiningPower]);

  // 24H Compound Lock Countdown Engine
  useEffect(() => {
    if (compoundSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setCompoundSecondsLeft((prev) => {
        if (prev <= 1) {
          showToast('✨ 24-Hour cycle complete! Next day plan interest is unlocked and ready for compounding.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [compoundSecondsLeft]);

  const formatCountdown = (totalSecs: number) => {
    if (totalSecs <= 0) return '00:00:00';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const countdownText = formatCountdown(secondsRemaining);
  const compoundCountdownText = formatCountdown(compoundSecondsLeft);

  // Visual Mining State:
  // - When NOT signed in (!isLoggedIn): Center mining core visual is GREEN (online showcase for guests)
  // - As soon as signed in (isLoggedIn): Turns RED (stopped/inactive) until user purchases a plan and taps Start Mining
  const isVisualMiningActive = !isLoggedIn ? true : isMiningActive;

  // Toggle / Start 24-Hour Mining Cycle with strict guards
  const handleToggleMining = () => {
    // 0. Cool Down Period Active Guard
    if (isCoolingDown) {
      showToast(`💧 Cool Down in progress (${cooldownSecondsRemaining}s remaining). System is cooling down before the next 24H cycle can begin.`);
      return;
    }

    // 1. Must be signed in / registered first
    if (!isLoggedIn) {
      showToast('🔒 Please Sign In or Create Account to start personal mining!');
      setIsSignUpMode(true);
      setShowAuthModal(true);
      return;
    }

    // 2. Must have bought a mining plan first
    if (activeMiningPower <= 0) {
      showToast('⚠️ No active mining plan! Please buy a plan first to start mining.');
      navigateTo('plans');
      return;
    }

    // 3. User is signed in AND has purchased a plan -> Start fresh 24-Hour Cycle
    // If mining is STOPPED (RED), start 24h cycle in Cloudflare D1
    if (!isMiningActive) {
      const cycleDuration = 24 * 3600;
      const now = Date.now();
      setIsMiningActive(true);
      setSecondsRemaining(cycleDuration);

      try {
        localStorage.setItem('neon_mining_active', 'true');
        localStorage.setItem('neon_mining_start_time', String(now));
        localStorage.setItem('neon_seconds_remaining', String(cycleDuration));
      } catch (e) {}

      if (userName) {
        const storedToken = localStorage.getItem('neon_session_token') || '';
        const cleanUserId = userName.toUpperCase();
        saveUserSavedData(cleanUserId, {
          isMiningActive: true,
          miningStartTime: now,
          secondsRemaining: cycleDuration
        });

        // Set user status to 'active' in adminUsers
        setAdminUsers((prev) =>
          prev.map((u) => {
            if (u.id.toUpperCase() === cleanUserId || u.name.toUpperCase() === cleanUserId) {
              return {
                ...u,
                status: 'active',
                isMiningActive: true,
                lastLogin: '🟢 Mining Active'
              };
            }
            return u;
          })
        );

        setAdminTelemetry((prev) => ({
          ...prev,
          activeMinersCount: Math.max(prev.activeMinersCount, prev.activeMinersCount + 1)
        }));

        // Persist 24-Hour cycle directly to Cloudflare D1 Database
        nexoraApi.activate24hMining(userName, storedToken).then((res) => {
          if (res && res.sessionInvalidated) {
            performLogout('Session expired. Logged in from another device.');
            return;
          }
          if (res && res.isMiningActive && res.miningCycleStartedAt) {
            setIsMiningActive(true);
            setSecondsRemaining(res.miningRemainingSeconds || cycleDuration);
          }
          if (res && res.unclaimedYield !== undefined && res.unclaimedYield > 0) {
            setUnclaimedYield(Number(res.unclaimedYield));
            try { localStorage.setItem('neon_unclaimed_yield', String(res.unclaimedYield)); } catch (e) {}
          }
        }).catch(() => {});
      }

      showToast('🟢 Mining Node Started! Core turned GREEN. 24-Hour cloud cycle running non-stop. Cannot be stopped manually.');
    } else {
      // Mining is actively running - LOCKED against manual stoppage
      const hrs = Math.floor(secondsRemaining / 3600);
      const mins = Math.floor((secondsRemaining % 3600) / 60);
      const secs = secondsRemaining % 60;
      showToast(`🔒 24-Hour Cloud Mining is running (${hrs}h ${mins}m ${secs}s remaining). Core is GREEN. It runs 24/7 on the cloud and cannot be stopped manually.`);
    }
  };

  // Rolling block ticker simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockNumber((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Open Checkout Wizard for Plan with strict Authentication and Coming Soon guards
  const handleSelectPlan = (plan: MiningPlan, isUpgrade?: boolean, diffAmount?: number) => {
    // 1. Guard against Coming Soon plans ($1,500 and $3,000)
    if (plan.isComingSoon) {
      showToast(`🔒 ${plan.planName} ($${plan.amount.toLocaleString()} USD) is Coming Soon! Stay tuned for the official launch.`);
      return;
    }

    // 2. Strict Auth Guard: User MUST be signed in / registered first to purchase a plan
    if (!isLoggedIn) {
      showToast('🔒 Please Sign In or Create an Account first to purchase a mining plan!');
      setPendingPlanAfterAuth({ plan, isUpgrade, diffAmount });
      setIsSignUpMode(true);
      setShowAuthModal(true);
      return;
    }

    // 3. Single Active Plan Guard: Only 1 active plan permitted
    if (activeMiningPower > 0) {
      const currentPlan = getPlanForAmount(activeMiningPower, miningPlans);
      if (currentPlan && plan.id === currentPlan.id) {
        showToast(`✓ You already have the ${currentPlan.planName} plan active! To upgrade your hash rate, choose a higher tier plan or reinvest your daily earnings.`);
        return;
      }
      if (plan.amount <= activeMiningPower) {
        showToast(`🔒 You currently have $${activeMiningPower.toFixed(2)} active power (${currentPlan?.planName || 'Active Tier'}). You cannot purchase a lower tier plan. You can only upgrade to a higher tier plan!`);
        return;
      }
      // If plan.amount > activeMiningPower, this is an UPGRADE!
      isUpgrade = true;
      diffAmount = +(plan.amount - activeMiningPower).toFixed(2);
    }

    setSelectedPlanForCheckout(plan);
    setIsUpgradeModal(!!isUpgrade);
    setUpgradeDiffAmount(diffAmount);
  };

  // Final Step of Checkout Wizard Completed
  const handleCheckoutSuccess = (
    plan: MiningPlan,
    paidCost: number,
    paymentMethod: 'internal' | 'bep20_chain',
    txHash?: string
  ) => {
    // Anti-Replay: Ensure TxHash is recorded to prevent duplicate reuse
    if (txHash && txHash.startsWith('0x') && txHash.length === 66) {
      const cleanTx = txHash.trim().toLowerCase();
      try {
        const usedHashes: string[] = JSON.parse(localStorage.getItem('neon_used_tx_hashes') || '[]');
        if (!usedHashes.includes(cleanTx)) {
          usedHashes.push(cleanTx);
          localStorage.setItem('neon_used_tx_hashes', JSON.stringify(usedHashes));
        }
      } catch {}
    }

    if (paymentMethod === 'internal') {
      if (depositBalance >= paidCost) {
        setDepositBalance((prev) => +(prev - paidCost).toFixed(2));
      } else {
        const fromDeposit = depositBalance;
        const remainder = paidCost - fromDeposit;
        setDepositBalance(0);
        setAvailableWithdrawal((prev) => Math.max(0, +(prev - remainder).toFixed(2)));
      }
      setTotalBalance((prev) => Math.max(0, +(prev - paidCost).toFixed(2)));
    } else {
      setTotalBalance((prev) => +(prev + paidCost).toFixed(2));
    }

    // STRICT SINGLE ACTIVE PLAN ENFORCEMENT:
    // Active mining power is always set directly to the plan amount (replacing previous)
    setActiveMiningPower(plan.amount);

    // Update team turnover
    setTeamTurnover((prev) => {
      const newPersonal = isUpgradeModal ? plan.amount : +(prev.personalStaked + plan.amount).toFixed(2);
      const newTotal = +(newPersonal + prev.downlineL1 + prev.downlineL2 + prev.downlineL3).toFixed(2);
      const newRate = newTotal >= 2500 ? 2.5 : newTotal >= 1000 ? 1.5 : 1.0;
      return {
        ...prev,
        personalStaked: newPersonal,
        totalVolume: newTotal,
        boostedRate: newRate
      };
    });

    const newTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      type: isUpgradeModal ? `Tier Upgrade to ${plan.planNumber} ($${plan.amount} USD Node)` : `${plan.planNumber} ($${plan.amount} USD) Node Staked`,
      amount: -paidCost,
      date: 'Just now',
      status: 'Settled',
      txHash: txHash || '0x' + Math.random().toString(16).substring(2, 10) + '..bep20'
    };
    setTransactions((prev) => [newTx, ...prev]);

    const activeUser = userName || `NEON${Math.floor(100000 + Math.random() * 900000)}`;
    if (!userName) {
      setUserName(activeUser);
      setIsLoggedIn(true);
    }

    // Record order in Admin System Orders Ledger (Only for genuine users)
    if (!isTestAccount(activeUser, activeUser, userEmail)) {
      const newAdminOrder: AdminOrderRecord = {
        orderId: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: activeUser,
        userName: activeUser,
        userEmail: userEmail || `${activeUser.toLowerCase()}@neon-mining.io`,
        planId: plan.id,
        planName: `${plan.planNumber} ($${plan.amount} USD)`,
        planAmount: plan.amount,
        paymentType: isUpgradeModal ? 'upgrade_difference' : 'new_purchase',
        amountPaid: paidCost,
        previousCreditedAmount: isUpgradeModal ? activeMiningPower : 0,
        dailyRatePercent: plan.dailyRatePercent,
        dailyYieldUSDT: +(plan.amount * (plan.dailyRatePercent / 100)).toFixed(2),
        txHash: txHash || '0x' + Math.random().toString(16).substring(2, 10) + '..bep20',
        orderDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'active'
      };
      setAdminOrders((prev) => [newAdminOrder, ...prev]);

      // Update user record in Admin Directory (Case-insensitive matching)
      setAdminUsers((prev) => {
        const exists = prev.some(
          (u) =>
            u.id.toUpperCase() === activeUser.toUpperCase() ||
            u.name.toUpperCase() === activeUser.toUpperCase() ||
            (userMobile && u.mobile === userMobile)
        );
        if (exists) {
          return prev.map((u) => {
            if (
              u.id.toUpperCase() === activeUser.toUpperCase() ||
              u.name.toUpperCase() === activeUser.toUpperCase() ||
              (userMobile && u.mobile === userMobile)
            ) {
              return {
                ...u,
                status: 'active',
                currentPlanName: `${plan.planNumber} ($${plan.amount} USD)`,
                stakedAmount: isUpgradeModal ? plan.amount : (u.stakedAmount + plan.amount),
                availableBalance: paymentMethod === 'internal' ? Math.max(0, u.availableBalance - paidCost) : u.availableBalance,
                lastLogin: 'Just now'
              };
            }
            return u;
          });
        } else {
          const newRecord: AdminUserRecord = {
            id: activeUser,
            name: activeUser,
            email: userEmail || `${activeUser.toLowerCase()}@neon-mining.io`,
            mobile: userMobile || '+91 9876543210',
            country: 'IN',
            registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            status: 'active',
            currentPlanName: `${plan.planNumber} ($${plan.amount} USD)`,
            stakedAmount: plan.amount,
            totalMinedYield: 0,
            availableBalance: availableWithdrawal,
            totalWithdrawn: 0,
            fundPin: userFundPassword || '888888',
            fundPinSet: !!userFundPassword,
            referralCode: activeUser,
            invitedBy: preFilledRefCode || 'DIRECT',
            directReferralsCount: 0,
            referralEarnings: 0,
            lastLogin: 'Just now'
          };
          return [newRecord, ...prev];
        }
      });
    }

    // Update user persistent storage immediately
    const cleanUserId = activeUser.toUpperCase();
    const newDepBal = paymentMethod === 'internal' ? Math.max(0, depositBalance - paidCost) : depositBalance;
    const newWithBal = paymentMethod === 'internal' && depositBalance < paidCost 
      ? Math.max(0, availableWithdrawal - (paidCost - depositBalance)) 
      : availableWithdrawal;
    const newTotBal = +(newDepBal + newWithBal).toFixed(2);

    saveUserSavedData(cleanUserId, {
      activeMiningPower: plan.amount,
      currentPlanName: `${plan.planNumber} ($${plan.amount} USD)`,
      depositBalance: newDepBal,
      availableWithdrawal: newWithBal,
      totalBalance: newTotBal
    });

    // Synchronize subscription & active mining power directly with Cloudflare D1 database
    // NOTE: subscribePlan handles everything atomically in D1 (active_mining_power + deduction).
    // Do NOT call adjustUserBalance here - it causes double-credit (2x staking amount).
    if (activeUser && !isTestAccount(activeUser, activeUser, userEmail)) {
      nexoraApi.subscribePlan({
        userId: activeUser,
        planId: plan.id,
        planName: plan.planName || plan.planNumber || 'Mining Plan',
        amount: plan.amount,
        dailyRatePercent: plan.dailyRatePercent,
        durationDays: plan.durationDays || 365,
        compoundingEnabled: true,
        fundPin: userFundPassword || '123456',
        paymentMethod: paymentMethod === 'bep20_chain' ? 'crypto' : 'internal',
        txHash: txHash,
        isDirectPayment: paymentMethod === 'bep20_chain'
      }).then((res) => {
        if (res && res.alreadyClaimed) {
          showToast(`🚫 ${res.message}`);
        }
        fetchLiveAdminUsers();
      }).catch(() => {});
    }

    // Update global telemetry
    setAdminTelemetry((prev) => ({
      ...prev,
      totalPlatformRevenue: +(prev.totalPlatformRevenue + paidCost).toFixed(2),
      totalStakedPower: +(isUpgradeModal ? prev.totalStakedPower + (plan.amount - activeMiningPower) : prev.totalStakedPower + plan.amount).toFixed(2),
      totalOrdersCount: prev.totalOrdersCount + 1,
      activeMinersCount: Math.max(prev.activeMinersCount, prev.activeMinersCount + (isUpgradeModal ? 0 : 1))
    }));

    showToast(`🎉 Successfully activated ${plan.planNumber} ($${plan.amount} USD)! Mining rig is live.`);

    // Dispatch real stake event to Home Screen Live Staking ticker
    try {
      window.dispatchEvent(new CustomEvent('neon_real_stake', {
        detail: {
          miner: activeUser || 'NEON MEMBER',
          amount: `${plan.amount.toFixed(2)} USDT`,
          plan: `${plan.planNumber || 'PLAN'} · ${plan.planName || 'Mining Node'} ($${plan.amount})`,
          txHash: txHash || ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')),
          time: 'Just now'
        }
      }));
    } catch (e) {}

    // ================= 10% DIRECT UPLINE REFERRAL COMMISSION =================
    const upline = userUplineCode || preFilledRefCode;
    const planCommission = +(paidCost * 0.10).toFixed(2);

    if (upline && upline !== 'DIRECT' && upline.toUpperCase() !== activeUser.toUpperCase() && planCommission > 0) {
      const uplineTarget = upline.toUpperCase();

      setAdminUsers((prev) => {
        const uplineExists = prev.some(
          (u) =>
            u.id.toUpperCase() === uplineTarget ||
            u.name.toUpperCase() === uplineTarget ||
            u.referralCode?.toUpperCase() === uplineTarget
        );
        if (uplineExists) {
          return prev.map((u) => {
            if (
              u.id.toUpperCase() === uplineTarget ||
              u.name.toUpperCase() === uplineTarget ||
              u.referralCode?.toUpperCase() === uplineTarget
            ) {
              return {
                ...u,
                availableBalance: +(u.availableBalance + planCommission).toFixed(2),
                totalMinedYield: +(u.totalMinedYield + planCommission).toFixed(2),
                referralEarnings: +((u.referralEarnings || 0) + planCommission).toFixed(2),
                directReferralsCount: (u.directReferralsCount || 0) + 1
              };
            }
            return u;
          });
        } else {
          const newUplineRecord: AdminUserRecord = {
            id: upline,
            name: upline,
            email: `${upline.toLowerCase()}@neon-mining.io`,
            mobile: '+91 9876543210',
            country: 'IN',
            registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            status: 'active',
            currentPlanName: 'Active Sponsor (10% Comm)',
            stakedAmount: 0,
            totalMinedYield: 0,
            availableBalance: planCommission,
            totalWithdrawn: 0,
            fundPin: '888888',
            fundPinSet: true,
            referralCode: upline,
            invitedBy: 'DIRECT',
            directReferralsCount: 1,
            referralEarnings: planCommission,
            lastLogin: 'Just now'
          };
          return [newUplineRecord, ...prev];
        }
      });

      // If currently logged-in user is this upline
      if (userName && userName.toUpperCase() === uplineTarget) {
        setReferralIncome((prev) => +(prev + planCommission).toFixed(2));
        setReferralBalance((prev) => +(prev + planCommission).toFixed(2));
        setTransactions((prev) => [
          {
            id: `tx_${Date.now()}_ref`,
            type: `10% Direct Referral Commission (${activeUser} - ${plan.planNumber})`,
            amount: planCommission,
            date: 'Just now',
            status: 'Settled',
            txHash: '0x' + Math.random().toString(16).substring(2, 10) + '..ref'
          },
          ...prev
        ]);
        const newRefUser: ReferredUserItem = {
          id: activeUser,
          name: activeUser,
          mobile: userMobile || '+91 9876543210',
          registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          planName: plan.planNumber,
          planAmount: plan.amount,
          commissionEarned: planCommission,
          status: 'active',
          level: 1
        };
        setReferredUsers((prev) => [newRefUser, ...prev]);
        const orcEarn = getMemberOrcDailyYield(newRefUser);
        if (orcEarn > 0) {
          setTotalOrcIncome((prev) => +(prev + orcEarn).toFixed(2));
          setOrcBalance((prev) => +(prev + orcEarn).toFixed(2));
        }
      }

      showToast(`💰 10% Direct Referral Commission (+$${planCommission.toFixed(2)}) credited to upline (${upline})!`);
    }

    // STRICT 24H PROOF-OF-ACTIVITY & RE-INVESTMENT LOCK:
    // Yield does NOT arrive immediately. Re-invest is locked (0% ready).
    // Node starts in STOPPED (RED) state. User must explicitly tap "START 24H MINING" to begin.
    // 1% daily yield arrives strictly after 24h cycle finishes, which then turns Re-invest ON!
    setUnclaimedYield(0);
    try {
      localStorage.setItem('neon_unclaimed_yield', '0');
    } catch (e) {}
    setIsMiningActive(false);
    setSecondsRemaining(0);
    try {
      localStorage.setItem('neon_mining_active', 'false');
      localStorage.setItem('neon_seconds_remaining', '0');
      localStorage.removeItem('neon_mining_start_time');
    } catch (e) {}

    showToast(
      isUpgradeModal
        ? `⚡ Upgraded to ${plan.planNumber} ($${plan.amount})! Node is STOPPED (RED). Tap START MINING to begin 24h cycle.`
        : `⚡ Plan ${plan.planNumber} ($${plan.amount}) Activated! Node is STOPPED (RED). Tap START MINING below to run 24h cycle & earn yield.`
    );
  };

  // Transfer referral income to main wallet (Withdrawable Balance for Instant Cashout)
  const handleTransferReferralToMainWallet = async () => {
    if (referralBalance <= 0) {
      showToast('⚠️ No referral balance available to send to wallet!');
      return;
    }
    const transferAmt = referralBalance;

    const res = await nexoraApi.transferReferralToWallet(userName);
    if (res && res.success) {
      if (res.updatedWallet) {
        const w = res.updatedWallet;
        const newWithdr = Number(w.withdrawable_balance ?? w.withdrawableBalance) || +(availableWithdrawal + transferAmt).toFixed(2);
        const newRef = Number(w.referral_balance ?? w.referralBalance) || 0;
        setAvailableWithdrawal(newWithdr);
        setReferralBalance(newRef);
        setTotalBalance(+(depositBalance + newWithdr).toFixed(2));
      } else {
        const newWithdrawable = +(availableWithdrawal + transferAmt).toFixed(2);
        setAvailableWithdrawal(newWithdrawable);
        setReferralBalance(0.0);
        setTotalBalance(+(depositBalance + newWithdrawable).toFixed(2));
      }

      try {
        localStorage.setItem('neon_referral_balance', '0');
        localStorage.setItem('neon_available_withdrawal', String(availableWithdrawal + transferAmt));
      } catch (e) {}

      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}_ref_transfer`,
        type: 'Referral Balance Sent to Withdrawable Balance',
        amount: transferAmt,
        date: 'Just now',
        status: 'Settled',
        txHash: '0x' + Math.random().toString(16).substring(2, 10) + '..trans'
      };
      setTransactions((prev) => [newTx, ...prev]);
      fetchWalletHistory();

      showToast(`🎉 Sent $${transferAmt.toFixed(2)} USDT from Referral Balance to Withdrawable Wallet!`);
    } else {
      showToast(`⚠️ Transfer failed: ${res?.message || 'Please try again'}`);
    }
  };

  // Re-invest Referral balance directly into current active plan / mining power
  const handleReinvestReferralToPlan = async () => {
    if (activeMiningPower <= 0) {
      showToast('⚠️ No active plan found! Please buy a plan first to re-invest your referral earnings.');
      return;
    }

    if (referralBalance <= 0) {
      showToast('⚠️ No referral balance available to re-invest!');
      return;
    }

    const amountToReinvest = referralBalance;
    const previousPlan = getPlanForAmount(activeMiningPower, miningPlans);
    const updatedPlanPower = +(activeMiningPower + amountToReinvest).toFixed(2);
    const upgradedPlan = getPlanForAmount(updatedPlanPower, miningPlans);
    const newPlanName = upgradedPlan ? `${upgradedPlan.planNumber} ($${upgradedPlan.amount} USD)` : `Active Plan ($${updatedPlanPower})`;

    const res = await nexoraApi.reinvestUpgradePlan({
      userId: userName,
      newPower: updatedPlanPower,
      upgradedPlanName: newPlanName,
      yieldAmount: amountToReinvest,
      dailyRatePercent: upgradedPlan?.dailyRatePercent || 1.0,
      source: 'referral'
    });

    if (res && res.success) {
      const finalPower = res.updatedWallet ? (Number(res.updatedWallet.active_mining_power ?? res.updatedWallet.activeMiningPower) || updatedPlanPower) : updatedPlanPower;
      const finalRef = res.updatedWallet ? (Number(res.updatedWallet.referral_balance ?? res.updatedWallet.referralBalance) || 0) : 0;

      setActiveMiningPower(finalPower);
      setReferralBalance(finalRef);
      try {
        localStorage.setItem('neon_referral_balance', String(finalRef));
        localStorage.setItem('neon_mining_power', String(finalPower));
      } catch (e) {}

      // Update personal stake in team turnover
      setTeamTurnover((prev) => {
        const newPersonal = +(prev.personalStaked + amountToReinvest).toFixed(2);
        const newTotal = +(newPersonal + prev.downlineL1 + prev.downlineL2 + prev.downlineL3).toFixed(2);
        const newRate = newTotal >= 2500 ? 2.5 : newTotal >= 1000 ? 1.5 : 1.0;
        return {
          ...prev,
          personalStaked: newPersonal,
          totalVolume: newTotal,
          boostedRate: newRate
        };
      });

      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}_ref_reinvest`,
        type: `Referral Commission Re-invested (+${amountToReinvest.toFixed(2)} USD Added to Plan Capital)`,
        amount: amountToReinvest,
        date: 'Just now',
        status: 'Compounded',
        txHash: '0x' + Math.random().toString(16).substring(2, 10) + '..ref_cmp'
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (userName) {
        const cleanId = userName.toUpperCase();
        setAdminUsers((prev) =>
          prev.map((u) => {
            if (u.id.toUpperCase() === cleanId || u.name.toUpperCase() === cleanId || (userMobile && u.mobile === userMobile)) {
              return {
                ...u,
                stakedAmount: finalPower,
                currentPlanName: newPlanName,
                status: 'active'
              };
            }
            return u;
          })
        );
      }

      fetchWalletHistory();
      fetchLiveAdminUsers();

      if (upgradedPlan && previousPlan && upgradedPlan.amount > previousPlan.amount) {
        showToast(
          `🚀 AUTO-UPGRADE TRIGGERED! Reinvested referral earnings reached $${finalPower.toFixed(2)} USD! Plan automatically upgraded to ${upgradedPlan.planName} ($${upgradedPlan.amount} Tier) hashing at higher ${upgradedPlan.dailyRatePercent}% daily!`
        );
      } else {
        showToast(`🎉 Re-invested +$${amountToReinvest.toFixed(2)} USDT from Referral Balance into plan! Active Plan Capital is now $${finalPower.toFixed(2)} USD.`);
      }
    } else {
      showToast(`⚠️ Re-invest failed: ${res?.message || 'Please try again'}`);
    }
  };

  // Transfer ORC income to main wallet (Withdrawable Balance for Instant Cashout)
  const handleTransferOrcToMainWallet = async () => {
    if (orcBalance <= 0) {
      showToast('⚠️ No ORC balance available to send to wallet!');
      return;
    }
    const transferAmt = orcBalance;

    const res = await nexoraApi.transferOrcToWallet(userName);
    if (res && res.success) {
      if (res.updatedWallet) {
        const w = res.updatedWallet;
        const newWithdr = Number(w.withdrawable_balance ?? w.withdrawableBalance) || +(availableWithdrawal + transferAmt).toFixed(2);
        const newOrc = Number(w.orc_balance ?? w.orcBalance) || 0;
        setAvailableWithdrawal(newWithdr);
        setOrcBalance(newOrc);
        setTotalBalance(+(depositBalance + newWithdr).toFixed(2));
      } else {
        const newWithdrawable = +(availableWithdrawal + transferAmt).toFixed(2);
        setAvailableWithdrawal(newWithdrawable);
        setOrcBalance(0.0);
        setTotalBalance(+(depositBalance + newWithdrawable).toFixed(2));
      }

      try {
        localStorage.setItem('neon_orc_balance', '0');
        localStorage.setItem('neon_available_withdrawal', String(availableWithdrawal + transferAmt));
      } catch (e) {}

      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}_orc_transfer`,
        type: '10-Tier ORC Balance Sent to Withdrawable Balance',
        amount: transferAmt,
        date: 'Just now',
        status: 'Settled',
        txHash: '0x' + Math.random().toString(16).substring(2, 10) + '..orc'
      };
      setTransactions((prev) => [newTx, ...prev]);
      fetchWalletHistory();

      showToast(`🎉 Sent $${transferAmt.toFixed(2)} USDT from ORC Balance to Withdrawable Wallet!`);
    } else {
      showToast(`⚠️ Transfer failed: ${res?.message || 'Please try again'}`);
    }
  };

  // Re-invest ORC balance directly into current active plan / mining power
  const handleReinvestOrcToPlan = async () => {
    if (activeMiningPower <= 0) {
      showToast('⚠️ No active plan found! Please buy a plan first to re-invest your ORC.');
      return;
    }

    if (orcBalance <= 0) {
      showToast('⚠️ No ORC balance available to re-invest!');
      return;
    }

    const amountToReinvest = orcBalance;
    const previousPlan = getPlanForAmount(activeMiningPower, miningPlans);
    const updatedPlanPower = +(activeMiningPower + amountToReinvest).toFixed(2);
    const upgradedPlan = getPlanForAmount(updatedPlanPower, miningPlans);
    const newPlanName = upgradedPlan ? `${upgradedPlan.planNumber} ($${upgradedPlan.amount} USD)` : `Active Plan ($${updatedPlanPower})`;

    const res = await nexoraApi.reinvestUpgradePlan({
      userId: userName,
      newPower: updatedPlanPower,
      upgradedPlanName: newPlanName,
      yieldAmount: amountToReinvest,
      dailyRatePercent: upgradedPlan?.dailyRatePercent || 1.0,
      source: 'orc'
    });

    if (res && res.success) {
      const finalPower = res.updatedWallet ? (Number(res.updatedWallet.active_mining_power ?? res.updatedWallet.activeMiningPower) || updatedPlanPower) : updatedPlanPower;
      const finalOrc = res.updatedWallet ? (Number(res.updatedWallet.orc_balance ?? res.updatedWallet.orcBalance) || 0) : 0;

      setActiveMiningPower(finalPower);
      setOrcBalance(finalOrc);
      try {
        localStorage.setItem('neon_orc_balance', String(finalOrc));
        localStorage.setItem('neon_mining_power', String(finalPower));
      } catch (e) {}

      // Update personal stake in team turnover
      setTeamTurnover((prev) => {
        const newPersonal = +(prev.personalStaked + amountToReinvest).toFixed(2);
        const newTotal = +(newPersonal + prev.downlineL1 + prev.downlineL2 + prev.downlineL3).toFixed(2);
        const newRate = newTotal >= 2500 ? 2.5 : newTotal >= 1000 ? 1.5 : 1.0;
        return {
          ...prev,
          personalStaked: newPersonal,
          totalVolume: newTotal,
          boostedRate: newRate
        };
      });

      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}_orc_reinvest`,
        type: `ORC Royalty Re-invested (+${amountToReinvest.toFixed(2)} USD Added to Plan Capital)`,
        amount: amountToReinvest,
        date: 'Just now',
        status: 'Compounded',
        txHash: '0x' + Math.random().toString(16).substring(2, 10) + '..orc_cmp'
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (userName) {
        const cleanId = userName.toUpperCase();
        setAdminUsers((prev) =>
          prev.map((u) => {
            if (u.id.toUpperCase() === cleanId || u.name.toUpperCase() === cleanId || (userMobile && u.mobile === userMobile)) {
              return {
                ...u,
                stakedAmount: finalPower,
                currentPlanName: newPlanName,
                status: 'active'
              };
            }
            return u;
          })
        );
      }

      fetchWalletHistory();
      fetchLiveAdminUsers();

      if (upgradedPlan && previousPlan && upgradedPlan.amount > previousPlan.amount) {
        showToast(
          `🚀 AUTO-UPGRADE TRIGGERED! Reinvested ORC reached $${finalPower.toFixed(2)} USD! Plan automatically upgraded to ${upgradedPlan.planName} ($${upgradedPlan.amount} Tier) hashing at higher ${upgradedPlan.dailyRatePercent}% daily!`
        );
      } else {
        showToast(`🎉 Re-invested +$${amountToReinvest.toFixed(2)} USDT from ORC into plan! Active Plan Capital is now $${finalPower.toFixed(2)} USD.`);
      }
    } else {
      showToast(`⚠️ Re-invest failed: ${res?.message || 'Please try again'}`);
    }
  };

  // Dashboard Upgrade Plan Click Handler
  const handleDashboardUpgradeClick = () => {
    if (activeMiningPower <= 0) {
      navigateTo('plans');
      return;
    }
    const currentPlan = getPlanForAmount(activeMiningPower, miningPlans);
    const nextPlan = miningPlans.find((p) => !p.isComingSoon && p.amount > (currentPlan ? currentPlan.amount : activeMiningPower));
    if (nextPlan) {
      const diff = +(nextPlan.amount - activeMiningPower).toFixed(2);
      handleSelectPlan(nextPlan, true, diff > 0 ? diff : undefined);
    } else {
      navigateTo('plans');
    }
  };

  // Daily Plan Interest Re-invest (Directly adds 1% daily interest to plan capital, e.g. $20 -> $20.20 USD, no fees)
  const handleCompoundSingleDay = async () => {
    if (activeMiningPower <= 0) {
      showToast('⚠️ No active plan found! Please buy a plan first.');
      return;
    }

    if (unclaimedYield <= 0) {
      showToast('🔒 Re-invest is locked! Your 1% daily yield unlocks strictly after your 24-hour mining cycle completes.');
      return;
    }

    const yieldToReinvest = unclaimedYield;
    const previousPlan = getPlanForAmount(activeMiningPower, miningPlans);
    const updatedPlanPower = +(activeMiningPower + yieldToReinvest).toFixed(2);
    const upgradedPlan = getPlanForAmount(updatedPlanPower, miningPlans);
    const newPlanName = upgradedPlan ? `${upgradedPlan.planNumber} ($${upgradedPlan.amount} USD)` : `Active Plan ($${updatedPlanPower})`;

    const res = await nexoraApi.reinvestUpgradePlan({
      userId: userName,
      newPower: updatedPlanPower,
      upgradedPlanName: newPlanName,
      yieldAmount: yieldToReinvest,
      dailyRatePercent: upgradedPlan?.dailyRatePercent || 1.0,
      source: 'yield'
    });

    if (res && res.success) {
      const finalPower = res.updatedWallet ? (Number(res.updatedWallet.active_mining_power ?? res.updatedWallet.activeMiningPower) || updatedPlanPower) : updatedPlanPower;
      const finalUnclaimed = res.updatedWallet ? (Number(res.updatedWallet.unclaimed_yield ?? res.updatedWallet.unclaimedYield) || 0) : 0;

      setActiveMiningPower(finalPower);
      setUnclaimedYield(finalUnclaimed);
      try {
        localStorage.setItem('neon_unclaimed_yield', String(finalUnclaimed));
        localStorage.setItem('neon_mining_power', String(finalPower));
      } catch (e) {}

      setTeamTurnover((prev) => {
        const newPersonal = +(prev.personalStaked + yieldToReinvest).toFixed(2);
        const newTotal = +(newPersonal + prev.downlineL1 + prev.downlineL2 + prev.downlineL3).toFixed(2);
        const newRate = newTotal >= 2500 ? 2.5 : newTotal >= 1000 ? 1.5 : 1.0;
        return {
          ...prev,
          personalStaked: newPersonal,
          totalVolume: newTotal,
          boostedRate: newRate
        };
      });

      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}_cmp`,
        type: `Plan Interest Re-invested (+${yieldToReinvest.toFixed(2)} USD Added to Plan Capital)`,
        amount: yieldToReinvest,
        date: 'Just now',
        status: 'Compounded',
        txHash: '0x' + Math.random().toString(16).substring(2, 10) + '..cmp'
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (userName) {
        const cleanId = userName.toUpperCase();
        setAdminUsers((prev) =>
          prev.map((u) => {
            if (u.id.toUpperCase() === cleanId || u.name.toUpperCase() === cleanId || (userMobile && u.mobile === userMobile)) {
              return {
                ...u,
                stakedAmount: finalPower,
                currentPlanName: newPlanName,
                status: 'active'
              };
            }
            return u;
          })
        );
      }

      fetchWalletHistory();
      fetchLiveAdminUsers();

      if (upgradedPlan && previousPlan && upgradedPlan.amount > previousPlan.amount) {
        showToast(
          `🚀 AUTO-UPGRADE TRIGGERED! Reinvested balance reached $${finalPower.toFixed(2)} USD! Plan automatically upgraded to ${upgradedPlan.planName} ($${upgradedPlan.amount} Tier) hashing at higher ${upgradedPlan.dailyRatePercent}% daily!`
        );
      } else {
        showToast(`🎉 Re-invested +$${yieldToReinvest.toFixed(2)} USD into plan! Active Plan Value is now $${finalPower.toFixed(2)} USD (${previousPlan?.planName || 'Active Node'}).`);
      }
    } else {
      showToast(`⚠️ Re-invest failed: ${res?.message || 'Please try again'}`);
    }
  };

  // Send today's completed 24h interest to Wallet for Withdrawal
  const handleClaimInterestToWallet = async () => {
    if (activeMiningPower <= 0) {
      showToast('⚠️ No active plan found! Please purchase a plan first.');
      return;
    }

    if (isClaimingYieldRef.current) return;

    if (unclaimedYield <= 0) {
      showToast('🔒 Yield is locked! Your 1% daily interest unlocks strictly after your 24-hour mining cycle completes.');
      return;
    }

    isClaimingYieldRef.current = true;
    setTimeout(() => { isClaimingYieldRef.current = false; }, 4000);

    const yieldToSend = unclaimedYield;

    const res = await nexoraApi.claimYieldToWallet({
      userId: userName,
      yieldAmount: yieldToSend
    });

    if (res && res.success) {
      const newWithdr = res.updatedWallet ? (Number(res.updatedWallet.withdrawable_balance ?? res.updatedWallet.withdrawableBalance) || +(availableWithdrawal + yieldToSend).toFixed(2)) : +(availableWithdrawal + yieldToSend).toFixed(2);
      const newUnclaimed = res.updatedWallet ? (Number(res.updatedWallet.unclaimed_yield ?? res.updatedWallet.unclaimedYield) || 0) : 0;

      setAvailableWithdrawal(newWithdr);
      setTotalBalance(+(depositBalance + newWithdr).toFixed(2));
      setUnclaimedYield(newUnclaimed);
      try {
        localStorage.setItem('neon_unclaimed_yield', String(newUnclaimed));
        localStorage.setItem('neon_available_withdrawal', String(newWithdr));
      } catch (e) {}

      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}_yield`,
        type: `Daily Plan Interest Sent to Withdrawable Balance`,
        amount: yieldToSend,
        date: 'Just now',
        status: 'Settled',
        txHash: '0x' + Math.random().toString(16).substring(2, 10) + '..bep20'
      };
      setTransactions((prev) => [newTx, ...prev]);

      fetchWalletHistory();
      fetchLiveAdminUsers();
      showToast(`💰 Sent +$${yieldToSend.toFixed(2)} USDT to Wallet! Now available in Wallet for immediate withdrawal.`);
    } else {
      showToast(`⚠️ Claim failed: ${res?.message || 'Please try again'}`);
    }
  };

  // Fast-Forward 24H cycle (Immediately unlocks next day's interest for testing)
  const handleFastForward24H = () => {
    if (activeMiningPower <= 0) {
      showToast('⚠️ No active plan found! Please buy a plan first to test the 24H cycle.');
      return;
    }
    setLastCompoundTimestamp(0);
    try {
      localStorage.removeItem('neon_last_compound_time');
    } catch (e) {}
    setCompoundSecondsLeft(0);

    if (isMiningActive) {
      // Advance to 2 seconds so user sees live completion and transition to RED
      setSecondsRemaining(2);
      showToast(`⚡ Fast-Forwarding 24H cycle! Will complete in 2 seconds and credit yield...`);
    } else {
      // Directly execute 1 completed cycle
      complete24HourMiningCycle(activeMiningPower);
    }
  };

  // Deposit Confirmation (On-Chain BEP-20 Verified)
  const handleDepositConfirmed = (amount: number, txHash?: string, orderId?: string) => {
    const effectiveAmount = normalizeToPlanTier(amount);
    setDepositBalance((prev) => +(prev + effectiveAmount).toFixed(2));
    setTotalBalance((prev) => +(prev + effectiveAmount).toFixed(2));

    const finalTxHash = txHash || ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    const finalOrderId = orderId || `DEP-BSC-${Date.now()}`;
    const formattedTimestamp = getFormattedTimestamp();

    // 0. Deposit Records Ledger for Deposit History Modal
    const newDepRecord: DepositRecord = {
      id: `dep_${Date.now()}`,
      type: 'bep20_deposit',
      amount: effectiveAmount,
      txHash: finalTxHash,
      timestamp: formattedTimestamp,
      timestampMs: Date.now(),
      status: 'completed',
      network: 'BNB Smart Chain (BEP-20)'
    };
    setDepositRecords((prev) => [newDepRecord, ...prev]);

    // 1. User Ledger Statement Record
    const newTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      type: 'BEP-20 USDT Deposit (BSC)',
      amount: effectiveAmount,
      date: formattedTimestamp,
      status: 'Settled',
      txHash: finalTxHash
    };
    setTransactions((prev) => [newTx, ...prev]);

    // 2. Admin Panel Orders Record (Only for genuine users)
    if (userName && !isTestAccount(userName, userName, userEmail)) {
      const newAdminOrder: AdminOrderRecord = {
        orderId: finalOrderId,
        userId: userName,
        userName: userName,
        userEmail: userEmail || `${userName.toLowerCase()}@nexora.io`,
        planId: 'bep20_deposit',
        planName: 'USDT (BEP-20) Deposit',
        planAmount: effectiveAmount,
        paymentType: 'new_purchase',
        amountPaid: effectiveAmount,
        previousCreditedAmount: 0,
        dailyRatePercent: 0,
        dailyYieldUSDT: 0,
        txHash: finalTxHash,
        orderDate: 'Just now',
        status: 'completed'
      };
      setAdminOrders((prev) => [newAdminOrder, ...prev]);

      // 3. Admin Telemetry Update
      setAdminTelemetry((prev) => ({
        ...prev,
        totalPlatformRevenue: +(prev.totalPlatformRevenue + effectiveAmount).toFixed(2),
        platformNetReserves: +(prev.platformNetReserves + effectiveAmount).toFixed(2)
      }));

      // 4. Update Current User Record in Admin Users Table
      setAdminUsers((prev) =>
        prev.map((u) => {
          if (u.id.toUpperCase() === userName.toUpperCase() || u.name.toUpperCase() === userName.toUpperCase()) {
            return {
              ...u,
              availableBalance: +(u.availableBalance + effectiveAmount).toFixed(2)
            };
          }
          return u;
        })
      );
    }

    // 5. Synchronize deposit balance & order directly with Cloudflare D1 backend
    if (userName && !isTestAccount(userName, userName, userEmail)) {
      const cleanUserId = userName.toUpperCase();
      const newDepBal = +(depositBalance + effectiveAmount).toFixed(2);
      saveUserSavedData(cleanUserId, {
        depositBalance: newDepBal,
        totalBalance: +(newDepBal + availableWithdrawal).toFixed(2)
      });

      // Deposit was already claimed atomically in DepositDemoDialog.tsx.
      // Refresh admin panel data and live wallet from D1 database.
      fetchLiveAdminUsers();
    }

    showToast(`✓ Received +$${effectiveAmount.toFixed(2)} USDT on BNB Smart Chain! Confirmed in Deposit Balance & Admin Panel.`);
  };

  // User creates/confirms their 6-digit fund password from CreateFundPasswordModal
  const handleFundPasswordCreated = async (newPin: string) => {
    setUserFundPassword(newPin);
    setUserFundPinSet(true);
    try {
      localStorage.setItem('neon_fund_password', newPin);
    } catch (e) {}

    if (userName) {
      const cleanId = userName.toUpperCase();
      saveUserSavedData(cleanId, { fundPin: newPin });
      setAdminUsers((prev) =>
        prev.map((u) =>
          u.id.toUpperCase() === cleanId || u.name.toUpperCase() === cleanId
            ? { ...u, fundPin: newPin, fundPinSet: true }
            : u
        )
      );
      // Persist to Cloudflare D1 Backend
      try {
        await nexoraApi.changeFundPin({
          userId: userName,
          newPin: newPin
        });
      } catch (err) {}
    }

    showToast('✓ 6-Digit Fund Password created successfully! You can now proceed with withdrawals.');
    setShowCreateFundPasswordModal(false);
    setShowWithdrawalModal(true);
  };

  // User submits withdrawal request -> enters Pending Admin Queue
  const handleWithdrawSubmit = (amount: number, wallet: string, fundPin: string) => {
    if (!userFundPassword && fundPin) {
      setUserFundPassword(fundPin);
      try {
        localStorage.setItem('neon_fund_password', fundPin);
      } catch (e) {}
    }
    // Deduct from combined available balance (first from availableWithdrawal, then referralBalance)
    if (amount <= availableWithdrawal) {
      setAvailableWithdrawal((prev) => Math.max(0, +(prev - amount).toFixed(2)));
    } else {
      const fromAvailable = availableWithdrawal;
      const fromReferral = +(amount - fromAvailable).toFixed(2);
      setAvailableWithdrawal(0);
      setReferralBalance((prev) => Math.max(0, +(prev - fromReferral).toFixed(2)));
    }

    const fee = +(amount * 0.05).toFixed(2);
    const netAmount = +(amount - fee).toFixed(2);

    const formattedTimestamp = getFormattedTimestamp();

    const newRequest: WithdrawalRequest = {
      id: `wd_${Date.now()}`,
      userId: userName || 'usr_8824',
      userName: userName,
      userMobile: userMobile,
      amount,
      fee,
      netAmount,
      walletAddress: wallet,
      status: 'pending',
      timestamp: formattedTimestamp,
      timestampMs: Date.now(),
      type: 'withdrawal'
    };

    setWithdrawalRequests((prev) => [newRequest, ...prev]);
    setAdminWithdrawals((prev) => [newRequest, ...prev]);
    setAdminTelemetry((prev) => ({
      ...prev,
      totalPendingWithdrawals: +(prev.totalPendingWithdrawals + amount).toFixed(2)
    }));

    // Synchronize withdrawal with Cloudflare D1 database
    if (userName && !isTestAccount(userName, userName, userEmail)) {
      nexoraApi.requestWithdrawal({
        userId: userName,
        amount,
        walletAddress: wallet,
        fundPin: fundPin || userFundPassword || '123456'
      }).then(() => {
        fetchLiveAdminWithdrawals();
      }).catch(() => {});
    }
    showToast(`Withdrawal of ${amount.toFixed(2)} USDT submitted! Sent to Admin queue for on-chain release.`);
  };

  // Admin approves withdrawal
  const handleApproveWithdrawal = async (id: string, customTxHash?: string) => {
    const req = adminWithdrawals.find((r) => r.id === id) || withdrawalRequests.find((r) => r.id === id);
    if (!req) return;

    const finalTx = (customTxHash && customTxHash.trim()) || ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));

    // Call Cloudflare D1 Backend to persist approved payout reference
    try {
      await nexoraApi.actionWithdrawal({
        requestId: id,
        action: 'approve',
        txHash: finalTx
      });
    } catch (e) {}

    setWithdrawalRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved', txHash: finalTx } : r))
    );
    setAdminWithdrawals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved', txHash: finalTx } : r))
    );

    // Deduct from total balance
    setTotalBalance((prev) => Math.max(0, prev - req.amount));

    // Update admin telemetry
    setAdminTelemetry((prev) => ({
      ...prev,
      totalWithdrawalsApproved: +(prev.totalWithdrawalsApproved + req.amount).toFixed(2),
      totalPendingWithdrawals: +(Math.max(0, prev.totalPendingWithdrawals - req.amount)).toFixed(2),
      totalFeesCollected: +(prev.totalFeesCollected + req.fee).toFixed(2),
      platformNetReserves: +(prev.platformNetReserves - req.netAmount).toFixed(2)
    }));

    setTransactions((prev) => {
      const hasPending = prev.some((t) => t.type?.toLowerCase().includes('payout') && t.status === 'Pending');
      if (hasPending) {
        return prev.map((t) =>
          t.type?.toLowerCase().includes('payout') && t.status === 'Pending'
            ? { ...t, status: 'Settled' as any, txHash: finalTx }
            : t
        );
      }
      const newTx: TransactionRecord = {
        id: `tx_${Date.now()}`,
        type: 'BEP-20 Withdrawal Approved',
        amount: -req.amount,
        date: getFormattedTimestamp(),
        status: 'Settled',
        txHash: finalTx
      };
      return [newTx, ...prev];
    });

    showToast(`✓ Approved withdrawal of ${req.amount.toFixed(2)} USDT for ${req.userName}! Reference: ${finalTx.slice(0, 10)}...`);
  };

  // Admin rejects withdrawal
  const handleRejectWithdrawal = async (id: string, reason: string) => {
    const req = adminWithdrawals.find((r) => r.id === id) || withdrawalRequests.find((r) => r.id === id);
    if (!req) return;

    try {
      await nexoraApi.actionWithdrawal({
        requestId: id,
        action: 'reject',
        reason
      });
    } catch (e) {}

    setWithdrawalRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected', rejectionReason: reason } : r))
    );
    setAdminWithdrawals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected', rejectionReason: reason } : r))
    );

    // 1. Refund back to available withdrawal & total balance
    setAvailableWithdrawal((prev) => +(prev + req.amount).toFixed(2));
    setTotalBalance((prev) => +(prev + req.amount).toFixed(2));

    // 2. Update transactions ledger: mark pending payout as Rejected and insert refund entry
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.type?.toLowerCase().includes('payout') && t.status === 'Pending') {
          return { ...t, status: 'Rejected' as any };
        }
        return t;
      });
      const refundTx: TransactionRecord = {
        id: `REF-${Date.now().toString().slice(-6)}`,
        type: 'Withdrawal Refund',
        amount: req.amount,
        date: getFormattedTimestamp(),
        status: 'Settled',
        txHash: 'N/A'
      };
      return [refundTx, ...updated];
    });

    // 3. Update admin user record if available
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id === req.userId || u.name === req.userName) {
          return {
            ...u,
            availableBalance: +(u.availableBalance + req.amount).toFixed(2),
            totalWithdrawn: Math.max(0, +(u.totalWithdrawn - req.amount).toFixed(2))
          };
        }
        return u;
      })
    );

    // 4. Update user's saved data in localStorage
    if (userName && (req.userId === userName || req.userName === userName)) {
      const cleanId = userName.toUpperCase();
      const currentSaved = loadUserSavedData(cleanId);
      const newWithdr = +((currentSaved?.availableWithdrawal || availableWithdrawal) + req.amount).toFixed(2);
      saveUserSavedData(cleanId, {
        availableWithdrawal: newWithdr,
        totalBalance: +((currentSaved?.depositBalance || depositBalance) + newWithdr).toFixed(2)
      });
    }

    // 5. Deduct from pending telemetry
    setAdminTelemetry((prev) => ({
      ...prev,
      totalPendingWithdrawals: +(Math.max(0, prev.totalPendingWithdrawals - req.amount)).toFixed(2)
    }));

    showToast(`✕ Withdrawal rejected (${reason}). ${req.amount.toFixed(2)} USDT refunded to user balance.`);
  };

  // P2P Member Transfer Handler (0% fee, instant credit into recipient's deposit balance)
  const handleConfirmP2PTransfer = async (
    recipientId: string,
    amount: number,
    fundPin: string,
    sourceWallet: 'deposit' | 'withdrawable' = 'deposit'
  ) => {
    const cleanRecipient = recipientId.trim();
    if (!cleanRecipient) {
      showToast('✕ Error: Recipient User ID is required.');
      return;
    }

    if (amount <= 0) {
      showToast('✕ Error: Transfer amount must be greater than zero.');
      return;
    }

    if (!userFundPassword && fundPin) {
      setUserFundPassword(fundPin);
      try {
        localStorage.setItem('neon_fund_password', fundPin);
      } catch (e) {}
    }

    // Call Cloudflare D1 Backend FIRST to ensure atomic verification and persistence
    if (userName) {
      try {
        const res = await nexoraApi.p2pTransfer({
          senderId: userName,
          recipientIdentifier: cleanRecipient,
          amount,
          fundPin,
          sourceWallet
        });

        if (!res || !res.success) {
          showToast(`✕ P2P Transfer Rejected: ${res?.message || 'Transaction failed. Please check recipient ID and balance.'}`);
          return;
        }

        const p2pHash = res.txHash || ('p2p_tx_' + Date.now().toString(36) + '_' + Math.random().toString(16).substring(2, 8));
        const formattedTimestamp = getFormattedTimestamp();
        const sourceLabel = sourceWallet === 'deposit' ? 'Deposit Balance' : 'Withdrawable Balance';

        // Update sender wallet balances strictly from backend D1 source of truth
        if (res.updatedWallet) {
          const w = res.updatedWallet;
          if (w.deposit_balance !== undefined) setDepositBalance(Number(w.deposit_balance) || 0);
          if (w.withdrawable_balance !== undefined) setAvailableWithdrawal(Number(w.withdrawable_balance) || 0);
          if (w.referral_balance !== undefined) setReferralBalance(Number(w.referral_balance) || 0);
          setTotalBalance(+(Number(w.deposit_balance || 0) + Number(w.withdrawable_balance || 0)).toFixed(2));
        }

        // 3. Log in SENDER's Withdrawal History modal with exact P2P Hash
        const senderWithdrawalRecord: WithdrawalRequest = {
          id: `wd_p2p_${Date.now()}`,
          userId: userName,
          userName: userName,
          userMobile: userMobile || '',
          amount: amount,
          fee: 0,
          netAmount: amount,
          walletAddress: `P2P Transfer to @${res.recipient?.id || cleanRecipient}`,
          status: 'approved',
          timestamp: formattedTimestamp,
          timestampMs: Date.now(),
          type: 'p2p_transfer',
          recipientId: res.recipient?.id || cleanRecipient,
          txHash: p2pHash
        };
        setWithdrawalRequests((prev) => [senderWithdrawalRecord, ...prev]);

        // 4. Sender transaction statement record
        const p2pTx: TransactionRecord = {
          id: `tx_p2p_${Date.now()}`,
          type: `P2P Transfer to @${res.recipient?.id || cleanRecipient} [${sourceLabel}] (0% Fee)`,
          amount: -amount,
          date: formattedTimestamp,
          status: 'Settled',
          txHash: p2pHash
        };
        setTransactions((prev) => [p2pTx, ...prev]);

        // Refresh admin users
        fetchLiveAdminUsers();

        showToast(`✓ Transferred $${amount.toFixed(2)} USDT from ${sourceLabel} to @${res.recipient?.id || cleanRecipient}! (0% fee, settled in D1).`);
      } catch (err: any) {
        showToast(`✕ P2P Transfer Error: ${err.message || 'Connection failed'}`);
      }
    }
  };

  // Forgot Fund Password Support Ticket Submit
  const handleCompanyQuery = (subject: string, details: string) => {
    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      type: 'forgot_fund_password',
      userId: 'usr_current',
      userName: userName,
      mobile: userMobile,
      subject,
      details,
      status: 'pending',
      priority: 'normal',
      timestamp: 'Just now'
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    showToast('✓ Support ticket dispatched to Company Admin portal!');
  };

  // Admin resets Fund PIN (persisted in D1 Database)
  const handleResetUserFundPin = async (ticketId: string, uName: string, newPin?: string) => {
    const role = localStorage.getItem('neon_admin_role') || sessionStorage.getItem('neon_admin_role');
    if (role === 'subadmin') return;
    const finalPin = newPin || String(Math.floor(100000 + Math.random() * 900000));
    
    // Find matching user ID
    const targetUser = adminUsers.find(u => u.name === uName || u.id === uName || u.name.includes(uName));
    const targetUserId = targetUser ? targetUser.id : uName;

    try {
      await nexoraApi.changeFundPin({ userId: targetUserId, newPin: finalPin });
    } catch (err) {
      console.warn('[Admin] Failed to persist ticket fund PIN reset to D1', err);
    }

    setUserFundPassword(finalPin);
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'replied' } : t))
    );
    setAdminUsers((prev) =>
      prev.map((u) => (u.name.includes(uName) || u.id === targetUserId ? { ...u, fundPin: finalPin, fundPinSet: true } : u))
    );
    showToast(`✓ Fund PIN for ${uName} reset to "${finalPin}"!`);
  };

  // Admin quick resets any user's PIN from directory (Persisted in D1 Database)
  const handleQuickResetUserPin = async (userId: string, newPin: string) => {
    const role = localStorage.getItem('neon_admin_role') || sessionStorage.getItem('neon_admin_role');
    if (role === 'subadmin') return;

    try {
      await nexoraApi.changeFundPin({ userId, newPin });
    } catch (err) {
      console.warn('[Admin] Failed to update fund PIN in D1 backend', err);
    }

    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, fundPin: newPin, fundPinSet: true } : u))
    );
    if (userId === userName) {
      setUserFundPassword(newPin);
      setUserFundPinSet(true);
    }
    showToast(`✓ Reset PIN for ${userId} to ${newPin} in live database!`);
  };

  // Admin toggles user status (active, inactive, suspended)
  const handleToggleUserStatus = (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    const backendStatus = newStatus === 'suspended' ? 'suspended' : 'active';
    nexoraApi.toggleUserStatus(userId, backendStatus).catch(() => {});
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    showToast(`✓ User ${userId} status updated to ${newStatus.toUpperCase()}`);
  };

  // Admin deletes user account
  const handleDeleteUser = (userId: string) => {
    const target = adminUsers.find((u) => u.id === userId);
    nexoraApi.deleteUser(userId, target?.email).then(() => {
      fetchLiveAdminUsers();
    }).catch(() => {});
    setAdminUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(`✓ Permanently deleted miner account ${userId} from database.`);
  };

  // Admin purges all inactive test accounts (0 staked power & 0 balance)
  const handlePurgeInactiveUsers = () => {
    nexoraApi.purgeInactiveUsers().then(() => {
      fetchLiveAdminUsers();
    }).catch(() => {});
    setAdminUsers((prev) =>
      prev.filter((u) => (u.stakedAmount && u.stakedAmount > 0) || (u.availableBalance && u.availableBalance > 0))
    );
    showToast(`✓ Cleaned out inactive test accounts from admin directory.`);
  };

  // Admin completely clears all users and resets directory to clean 0
  const handleClearAllUsers = () => {
    nexoraApi.purgeAllUsers().then(() => {
      fetchLiveAdminUsers();
    }).catch(() => {});
    localStorage.removeItem('neon_admin_users');
    localStorage.removeItem('neon_admin_orders');
    setAdminUsers([]);
    setAdminOrders([]);
    setAdminTelemetry((prev) => ({
      ...prev,
      totalRegisteredUsers: 0,
      totalOrdersCount: 0,
      totalStakedPower: 0,
      totalPlatformRevenue: 0,
      activeMinersCount: 0
    }));
    showToast('✓ Cleared all accounts from directory.');
  };

  // Admin updates platform settings
  const handleUpdatePlatformSettings = async (settings: Partial<PlatformSettings>) => {
    setPlatformSettings((prev) => {
      const updated = { ...prev, ...settings };
      try {
        localStorage.setItem('neon_platform_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Persist live to Cloudflare D1 database so all users globally get updated rules & vault address
    const payload: Record<string, any> = {};
    if (settings.vaultWalletAddress) {
      const cleanVault = settings.vaultWalletAddress.trim();
      payload.vault_address = cleanVault;
      payload.vaultWalletAddress = cleanVault;
    }
    if (settings.minDepositAmount !== undefined) payload.min_deposit = String(settings.minDepositAmount);
    if (settings.minWithdrawalAmount !== undefined) payload.min_withdrawal = String(settings.minWithdrawalAmount);
    if (settings.withdrawalFeePercent !== undefined) payload.withdrawal_fee_percent = String(settings.withdrawalFeePercent);
    if (settings.p2pFeePercent !== undefined) payload.p2p_fee_percent = String(settings.p2pFeePercent);
    if (settings.popupImageUrl !== undefined) {
      payload.popup_image_url = settings.popupImageUrl;
    }
    if (settings.popupLinkUrl !== undefined) {
      payload.popup_link_url = settings.popupLinkUrl;
    }
    if (settings.popupEnabled !== undefined) {
      payload.popup_enabled = String(settings.popupEnabled);
    }

    if (Object.keys(payload).length > 0) {
      try {
        const res = await nexoraApi.updatePlatformSettings(payload, 'master');
        if (res && res.success) {
          showToast('✓ Platform rules & popup updated live across all users!');
          await fetchPlatformSettings();
        } else {
          showToast(`✓ Local updated (${res?.message || 'Saved locally'})`);
        }
      } catch (err) {
        showToast('✓ Updated locally');
      }
    } else {
      showToast('✓ Platform rules and thresholds updated!');
    }
  };

  // Superadmin adds new Sub-Admin
  const handleAddSubAdmin = useCallback((newAdmin: SubAdminUser) => {
    setSubAdmins((prev) => {
      if (prev.some((a) => a.id === newAdmin.id || (a.email && newAdmin.email && a.email.toLowerCase() === newAdmin.email.toLowerCase()))) {
        return prev;
      }
      const updated = [...prev, newAdmin];
      try {
        localStorage.setItem('neon_sub_admins', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`✓ Sub-Admin "${newAdmin.name}" authorized.`);
  }, []);

  // Superadmin revokes Sub-Admin
  const handleDeleteSubAdmin = (id: string) => {
    setSubAdmins((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem('neon_sub_admins', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast('✓ Sub-Admin credentials revoked.');
  };

  // Auth Success Handler
  const handleAuthSuccess = (
    name: string,
    mobile: string,
    fundPin?: string,
    email?: string,
    referralCode?: string,
    ownReferralCode?: string,
    walletData?: any
  ) => {
    const cleanId = name.toUpperCase();
    setUserName(name);
    setUserMobile(mobile);
    if (email) setUserEmail(email);
    if (fundPin) setUserFundPassword(fundPin);
    if (referralCode) {
      const cleanRef = referralCode.toUpperCase();
      setUserUplineCode(cleanRef);
    }
    if (ownReferralCode) {
      setUserReferralCode(ownReferralCode.toUpperCase());
    }
    // Check if account is suspended in admin directory
    const existing = adminUsers.find(
      (u) =>
        u.id.toUpperCase() === cleanId ||
        u.name.toUpperCase() === cleanId ||
        (mobile && u.mobile === mobile)
    );

    if (existing && existing.status === 'suspended') {
      showToast('🚫 Your account has been suspended due to irregular mining activity and security policy violations.');
      setIsLoggedIn(false);
      setShowAuthModal(false);
      return;
    }

    setIsLoggedIn(true);
    setShowAuthModal(false);
    try {
      localStorage.setItem('neon_last_active_time', String(Date.now()));
    } catch {}

    // Refresh real D1 admin users immediately
    fetchLiveAdminUsers();

    // 1. RESTORE FROM SERVER WALLET OR PERSISTED PROFILE:
    const savedData = loadUserSavedData(cleanId);

    const activePower = Number(
      walletData?.activeMiningPower ??
      walletData?.active_mining_power ??
      savedData?.activeMiningPower ??
      existing?.stakedAmount ??
      0
    );

    const depBal = Number(
      walletData?.depositBalance ??
      walletData?.deposit_balance ??
      savedData?.depositBalance ??
      existing?.availableBalance ??
      0
    );

    const withBal = Number(
      walletData?.withdrawableBalance ??
      walletData?.withdrawable_balance ??
      savedData?.availableWithdrawal ??
      0
    );

    const refBal = Number(
      walletData?.referralBalance ??
      walletData?.referral_balance ??
      savedData?.referralBalance ??
      0
    );

    const minedYield = Number(
      walletData?.totalMinedYield ??
      walletData?.total_mined_yield ??
      savedData?.totalRewards ??
      0
    );

    const orcInc = Number(
      (walletData as any)?.totalOrcIncome ??
      (walletData as any)?.total_orc_income ??
      savedData?.totalOrcIncome ??
      0
    );

    const orcBal = Number(
      (walletData as any)?.orcBalance ??
      (walletData as any)?.orc_balance ??
      savedData?.orcBalance ??
      0
    );

    if (activePower > 0) {
      setActiveMiningPower(activePower);
      try {
        localStorage.setItem('neon_mining_power', String(activePower));
      } catch (e) {}
    }
    if (walletData) {
      setDepositBalance(depBal);
      setAvailableWithdrawal(withBal);
      setReferralBalance(refBal);
      setReferralIncome(refBal);
      setTotalOrcIncome(orcInc);
      setOrcBalance(orcBal);
    } else {
      if (depBal > 0) setDepositBalance(depBal);
      if (withBal > 0) setAvailableWithdrawal(withBal);
      if (refBal > 0) {
        setReferralBalance(refBal);
        setReferralIncome(refBal);
      }
      if (orcInc > 0) setTotalOrcIncome(orcInc);
      if (orcBal > 0) setOrcBalance(orcBal);
    }
    if (minedYield > 0) {
      setTotalRewards(minedYield);
    }
    const settled = Number(
      walletData?.totalWithdrawn ??
      walletData?.total_withdrawn ??
      savedData?.totalWithdrawn ??
      0
    );
    setServerTotalWithdrawn(settled);
    try {
      localStorage.setItem('neon_total_withdrawn', String(settled));
    } catch (e) {}
    setTotalBalance(+(depBal + withBal).toFixed(2));

    // Sync Unclaimed Mining Yield from Server / D1
    const serverUnclaimed = Number(walletData?.unclaimedYield ?? walletData?.unclaimed_yield ?? savedData?.unclaimedYield ?? 0);
    setUnclaimedYield(serverUnclaimed);
    try {
      localStorage.setItem('neon_unclaimed_yield', String(serverUnclaimed));
    } catch (e) {}

    if (savedData?.transactions && savedData.transactions.length > 0) {
      const duplicateIds = new Set([
        'CMP-653645', 'CMP-696166', 'CMP-849280', 'CMP-852312', 'CMP-853564',
        'REF-TRF-613641', 'REF-TRF-10770',
        'CMP-915383', 'CMP-924304', 'CMP-589666', 'CMP-605974',
        'ORC-TRF-877279', 'ORC-TRF-887869'
      ]);
      setTransactions(savedData.transactions.filter((tx: any) => !duplicateIds.has(tx.id)));
    }
    if (savedData?.depositRecords && savedData.depositRecords.length > 0) {
      const cleanSavedDeps = savedData.depositRecords.filter(
        (r) => !r.id?.startsWith('dep_seed_') && !r.id?.startsWith('demo_') && !r.id?.startsWith('dep_demo_')
      );
      setDepositRecords(cleanSavedDeps);
    }

    // 2. RESTORE / INITIALIZE FUND PASSWORD (PIN) PER USER:
    const hasPin = Boolean(existing?.fundPinSet);
    const userPin = hasPin && existing?.fundPin ? existing.fundPin : '';
    setUserFundPassword(userPin);
    setUserFundPinSet(hasPin);
    try {
      if (userPin) {
        localStorage.setItem('neon_fund_password', userPin);
      } else {
        localStorage.removeItem('neon_fund_password');
      }
    } catch (e) {}

    // 3. RESTORE 24H MINING CONTINUITY (Server D1 is primary source of truth):
    const serverMiningStart = Number(walletData?.miningCycleStartedAt ?? walletData?.mining_cycle_started_at ?? 0);
    const localMiningActive = savedData?.isMiningActive ?? false;
    const localMiningStart = savedData?.miningStartTime ?? 0;

    const miningStart = serverMiningStart > 0 ? serverMiningStart : (localMiningActive ? localMiningStart : 0);
    const isServerMining = Boolean(walletData?.isMiningActive || (serverMiningStart > 0 && (Date.now() - serverMiningStart < 24 * 3600 * 1000)));

    if ((isServerMining || (localMiningActive && localMiningStart > 0)) && miningStart > 0) {
      const elapsed = Math.floor((Date.now() - miningStart) / 1000);
      const CYCLE_DURATION = 24 * 3600;
      if (elapsed < CYCLE_DURATION) {
        setIsMiningActive(true);
        const rem = walletData?.miningRemainingSeconds !== undefined ? Number(walletData.miningRemainingSeconds) : Math.max(0, CYCLE_DURATION - elapsed);
        setSecondsRemaining(rem);
        try {
          localStorage.setItem('neon_mining_active', 'true');
          localStorage.setItem('neon_mining_start_time', String(miningStart));
          localStorage.setItem('neon_seconds_remaining', String(rem));
        } catch (e) {}
      } else {
        // Mining cycle finished while user was logged out! Credit yield if not already credited
        if (serverUnclaimed <= 0) {
          complete24HourMiningCycle(activePower);
        } else {
          setIsMiningActive(false);
          setSecondsRemaining(0);
          try {
            localStorage.setItem('neon_mining_active', 'false');
            localStorage.removeItem('neon_mining_start_time');
          } catch (e) {}
        }
      }
    }

    if (existing) {
      if (existing.invitedBy && existing.invitedBy !== 'DIRECT') {
        setUserUplineCode(existing.invitedBy);
      }
    } else {
      if (!isTestAccount(name, name, email)) {
        const newAccount: AdminUserRecord = {
          id: name,
          name: name,
          email: email || `${name.toLowerCase()}@neon-mining.io`,
          mobile: mobile,
          country: 'IN',
          registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: activePower > 0 ? 'active' : 'inactive',
          currentPlanName: activePower > 0 ? `Active Plan ($${activePower})` : 'No Plan Purchased (Inactive)',
          stakedAmount: activePower,
          totalMinedYield: 0,
          availableBalance: depBal,
          totalWithdrawn: 0,
          fundPin: fundPin || '',
          fundPinSet: !!fundPin,
          referralCode: name,
          invitedBy: referralCode || userUplineCode || preFilledRefCode || 'DIRECT',
          directReferralsCount: 0,
          referralEarnings: 0,
          lastLogin: 'Just now'
        };
        setAdminUsers((prev) => [newAccount, ...prev.filter((u) => u.id !== name)]);
        setAdminTelemetry((prev) => ({ ...prev, totalRegisteredUsers: prev.totalRegisteredUsers + 1 }));
      }
    }

    if (referralCode) {
      showToast(`🎉 Welcome ${name}! Applied referral code: ${referralCode}`);
    } else {
      showToast(isSignUpMode ? `🎉 Account created! Miner ID: ${name}` : `Welcome back, ${name}!`);
    }

    // Auto-resume plan checkout if user selected a plan before logging in
    if (pendingPlanAfterAuth) {
      const { plan: planToBuy, isUpgrade: upgradeFlag, diffAmount: diffVal } = pendingPlanAfterAuth;
      setPendingPlanAfterAuth(null);
      setTimeout(() => {
        setSelectedPlanForCheckout(planToBuy);
        setIsUpgradeModal(!!upgradeFlag);
        setUpgradeDiffAmount(diffVal);
      }, 400);
    }
  };

  // Dedicated Logout Handler
  const handleLogout = () => {
    // 1. Save user state before session exit (NEVER delete user plan or mining)
    if (userName) {
      const cleanId = userName.toUpperCase();
      const planObj = getPlanForAmount(activeMiningPower, miningPlans);
      const planLabel = planObj ? `${planObj.planName} ($${planObj.amount} Tier)` : (activeMiningPower > 0 ? `Active Node ($${activeMiningPower})` : 'No Plan Purchased (Inactive)');
      const currentPlan = planLabel;
      
      saveUserSavedData(cleanId, {
        activeMiningPower,
        currentPlanName: currentPlan,
        depositBalance,
        availableWithdrawal,
        totalBalance,
        totalRewards,
        referralIncome,
        referralBalance,
        yesterdaysIncome,
        isMiningActive,
        miningStartTime: loadStorageNum('neon_mining_start_time', Date.now()),
        secondsRemaining,
        unclaimedYield,
        transactions,
        depositRecords,
        fundPin: userFundPassword
      });
    }

    // 2. Clear ONLY active session auth flags
    localStorage.removeItem('neon_is_logged_in');
    localStorage.removeItem('neon_user_name');
    localStorage.removeItem('neon_user_mobile');
    localStorage.removeItem('neon_user_email');
    localStorage.removeItem('neon_fund_password');
    localStorage.removeItem('neon_upline_code');

    // 3. Reset in-memory view to guest mode
    setIsLoggedIn(false);
    setShowAuthModal(false);
    setIsSignUpMode(false);
    setIncomingResetToken(null);
    setIncomingResetEmail(null);
    setUserName('');
    setUserMobile('');
    setUserEmail('');
    setUserFundPassword('');
    setActiveMiningPower(0);
    setIsMiningActive(false);
    setSecondsRemaining(24 * 3600);
    setDepositBalance(0);
    setAvailableWithdrawal(0);
    setTotalBalance(0);
    setTotalRewards(0);
    setReferralIncome(0);
    setReferralBalance(0);
    setYesterdaysIncome(0);
    setTransactions([]);
    setDepositRecords([]);
    setWithdrawalRequests([]);
    navigateTo('home', true);
    showToast('Successfully logged out. See you soon! 👋');
  };

  // Auth Barrier Guard for Protected Screens
  const renderAuthBarrier = (title: string, subtitle: string, featureBadge: string) => (
    <div className="mx-4 my-6 p-6 rounded-2xl bg-[#0B1528]/95 border border-[#1E2E4A] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-center text-center space-y-4 animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
        <Lock className="w-7 h-7" />
      </div>

      <div>
        <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#00F0FF] px-2.5 py-0.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20">
          {featureBadge}
        </span>
        <h2 className="text-xl font-bold text-white mt-2">{title}</h2>
        <p className="text-xs text-[#94A3B8] max-w-xs mt-1.5 leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="w-full space-y-2.5 pt-2">
        <button
          onClick={() => {
            setIsSignUpMode(false);
            setShowAuthModal(true);
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0284C7] text-black font-extrabold text-sm shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:opacity-95 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to Access</span>
        </button>

        <button
          onClick={() => {
            setIsSignUpMode(true);
            setShowAuthModal(true);
          }}
          className="w-full py-3 rounded-xl bg-[#0F1D33] border border-[#1E3352] text-[#F8FAFC] font-bold text-sm hover:border-[#00F0FF]/50 transition-all cursor-pointer active:scale-95"
        >
          Create Minor Account
        </button>
      </div>
    </div>
  );

  const handleSplashComplete = useCallback(() => {
    setShowAppSplash(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-start text-[#F8FAFC]">
      {/* High-Tech Dedicated Cyberpunk Mining Splash Screen */}
      {showAppSplash && (
        <NeonAppSplashScreen onComplete={handleSplashComplete} />
      )}

      {/* Main Responsive Container: 100% on mobile, up to max-w-7xl on desktop */}
      <main className="w-full max-w-7xl mx-auto bg-[#030712] min-h-screen relative flex flex-col transition-all duration-300">

        {/* Top App Bar with Desktop Navigation & 25-Language Switcher */}
        <NeonTopAppBar
          activeRoute={activeRoute}
          onRouteChange={(route) => navigateTo(route)}
          isLoggedIn={isLoggedIn}
          userName={userName}
          currentLang={currentLang}
          onSelectLang={(lang) => {
            setCurrentLang(lang);
            applyLanguageChange(lang);
            showToast(`Language switched to: ${lang.toUpperCase()}`);
          }}
          userRole={userRole}
          onOpenAdminPortal={isStandaloneApp ? undefined : () => setShowAdminPortal(true)}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onGetAppClick={() => {
            const link = document.createElement('a');
            link.href = 'https://github.com/neon833012/nexora-mining/releases/download/v1.0.0/Neon_Mining.apk';
            link.download = 'Neon Mining.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('📲 Downloading Neon Mining Official APK (2.6 MB)...');
          }}
          onLoginClick={() => {
            setIsSignUpMode(false);
            setShowAuthModal(true);
          }}
          onNavigateHome={() => navigateTo('home')}
          isStandaloneApp={isStandaloneApp}
          onOpenInbox={() => handleOpenSupportInbox()}
          hasUnreadReply={hasUnreadInboxNotification}
        />

        {/* Rolling Blockchain Live Ticker */}
        <BlockchainLiveTicker blockNumber={blockNumber} />

        {/* ================= TRUE DEDICATED SCREEN ROUTING ================= */}
        <div className="flex-1 pb-24 lg:pb-12 pt-2 lg:pt-4 px-0 lg:px-4">
          {/* SCREEN 1: HOME */}
          <div className={activeRoute === 'home' ? 'space-y-5 animate-fadeIn' : 'hidden'}>
              <FuturisticHeroSection
                isMiningActive={isVisualMiningActive}
                isCoolingDown={isLoggedIn ? isCoolingDown : false}
                cooldownSecondsRemaining={cooldownSecondsRemaining}
                onToggleMining={handleToggleMining}
                miningCountdownText={countdownText}
                onExplorePlans={() => navigateTo('plans')}
                onCreateAccount={() => {
                  setIsSignUpMode(true);
                  setShowAuthModal(true);
                }}
                activePlanName={activePlanDisplayName}
                activeUsersCount={activeUsersCount}
                isLoggedIn={isLoggedIn}
                currentLang={currentLang}
              />

              <LiveStatsGrid
                activeUsersCount={activeUsersCount}
                activeMinersCount={activeMinersCount}
                currentLang={currentLang}
              />

              {/* Live Blockchain Stream of Confirmed Payouts & Stakes */}
              <HomeLivePayoutsTicker />

              {/* Physical Mining Facilities & Live Telemetry */}
              <HomeMiningFarmStats />

              {/* Enterprise Platform Features */}
              <HomePlatformFeatures />

              {/* 4-Step Onboarding Roadmap */}
              <HowItWorksSection />

              {/* Transparent FAQ Accordion */}
              <HomeFaqAccordion />



              {/* Footer */}
              <NeonFooter 
                onNavigate={(sec) => {
                  if (sec === 'Mining Plans') navigateTo('plans');
                  else if (sec === 'Calculator') navigateTo('calculator');
                  else if (sec === 'Referral' || sec === 'Team') navigateTo('referral');
                  else if (sec === 'Dashboard') navigateTo('dashboard');
                  else if (sec === 'FAQ') navigateTo('faq');
                  else if (sec === 'Contact') navigateTo('contact');
                  else if (sec === 'About Neon') navigateTo('about');
                  else navigateTo('home');
                }} 
                onOpenAdminPortal={isStandaloneApp ? undefined : () => {
                  setUserRole(getStoredAdminRole());
                  setShowAdminPortal(true);
                }} 
                onOpenLegalPolicy={(policyKey) => {
                  setActiveLegalTab(policyKey);
                  setShowLegalModal(true);
                }}
              />
          </div>

          {/* SCREEN 2: MINING PLANS */}
          <div className={activeRoute === 'plans' ? 'space-y-4 animate-fadeIn' : 'hidden'}>
            <MiningPlanCards
              activeMiningPower={activeMiningPower}
              onSelectPlan={handleSelectPlan}
              miningPlans={miningPlans}
            />
          </div>

          {/* SCREEN 3: CALCULATOR */}
          <div className={activeRoute === 'calculator' ? 'space-y-4 animate-fadeIn' : 'hidden'}>
            <InteractiveMiningCalculator
              miningPlans={miningPlans}
              onSelectPlan={handleSelectPlan}
            />
          </div>

          {/* SCREEN 4: DASHBOARD */}
          <div className={activeRoute === 'dashboard' ? 'space-y-4 animate-fadeIn' : 'hidden'}>
            {!isLoggedIn ? (
              renderAuthBarrier(
                'Dashboard Telemetry Locked',
                'Please sign in or create an account to view your live mining telemetry, 24-hour cycle timer, daily yield compounding, and real-time hash performance.',
                'Authentication Required'
              )
            ) : (
              <DashboardPreviewSection
                totalBalance={totalBalance}
                depositBalance={depositBalance}
                availableWithdrawal={+availableWithdrawal.toFixed(2)}
                referralBalance={referralBalance}
                totalReferralIncome={referralIncome}
                totalWithdrawn={totalWithdrawn}
                yesterdaysIncome={yesterdaysIncome}
                todaysIncome={unclaimedYield}
                unclaimedYield={unclaimedYield}
                totalIncome={totalCumulativeIncome}
                activeMiningPower={activeMiningPower}
                activePlanName={activePlanName}
                activePlanDailyRate={activePlanObj?.dailyRatePercent || 1.0}
                isMiningActive={isMiningActive}
                isCoolingDown={isCoolingDown}
                cooldownSecondsRemaining={cooldownSecondsRemaining}
                isCompoundingActive={isCompoundingActive}
                countdownText={countdownText}
                userName={userName}
                userReferralCode={userUplineCode || userName || 'NEON'}
                referredUsers={referredUsers}
                transactions={transactions}
                teamTurnover={teamTurnover}
                isCompoundLocked={isCompoundLocked}
                compoundSecondsLeft={compoundSecondsLeft}
                compoundCountdownText={compoundCountdownText}
                onDepositClick={() => setShowDepositDialog(true)}
                onWithdrawClick={() => navigateTo('wallet')}
                onUpgradePlanClick={handleDashboardUpgradeClick}
                onToggleMining={handleToggleMining}
                onCompoundSingleDay={handleCompoundSingleDay}
                onClaimInterestToWallet={handleClaimInterestToWallet}
                onNavigateToReferral={() => navigateTo('referral')}
                onLogout={handleLogout}
              />
            )}
          </div>

          {/* SCREEN 5: WALLET & WITHDRAW */}
          <div className={activeRoute === 'wallet' ? 'space-y-5 animate-fadeIn px-3.5 lg:px-0' : 'hidden'}>
              {!isLoggedIn ? (
                renderAuthBarrier(
                  'BEP-20 Custody Wallet Locked',
                  'Please sign in to access your personal USDT balance, deposit crypto via BEP-20 network, or submit withdrawal requests to your external wallet.',
                  'Secured Wallet Access'
                )
              ) : (
                <div className="space-y-5">
                  {/* 1. Wallet Header Banner */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 lg:p-6 rounded-2xl bg-gradient-to-r from-[#071324] via-[#0A1A2F] to-[#07172B] border border-[#192E4C] shadow-xl">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-[10px] font-black tracking-[1.2px] text-[#00F0FF] uppercase bg-[#00F0FF]/10 px-2.5 py-0.5 rounded-full border border-[#00F0FF]/30">
                          ENTERPRISE ASSET CUSTODY
                        </span>
                        <span className="text-[10px] font-mono text-[#FBBF24] bg-[#FBBF24]/10 px-2.5 py-0.5 rounded-full border border-[#FBBF24]/30 font-bold">
                          BINANCE SMART CHAIN · BEP-20
                        </span>
                      </div>
                      <h2 className="text-[20px] lg:text-[26px] font-black text-white">
                        BEP-20 Financial Wallet & Statement
                      </h2>
                      <p className="text-[11.5px] lg:text-[13px] text-[#94A3B8] max-w-2xl leading-relaxed mt-0.5">
                        Manage liquid balances, fund PIN security, submit instant on-chain cashouts, and inspect your full ledger statement.
                      </p>
                    </div>

                    {/* Fast Action Buttons in Header: Single row on phone & desktop + Withdrawal History Button */}
                    <div className="flex flex-col gap-2.5 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
                      <div className="grid grid-cols-3 gap-2 w-full lg:min-w-[440px]">
                        <button
                          type="button"
                          onClick={() => setShowDepositDialog(true)}
                          className="py-2.5 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11.5px] sm:text-[12.5px] flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/30 border border-emerald-400/30 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          <ArrowDown className="w-3.5 h-3.5 shrink-0 text-emerald-200" />
                          <span>Deposit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isLoggedIn) {
                              setIsSignUpMode(false);
                              setShowAuthModal(true);
                              return;
                            }
                            if (!userFundPinSet) {
                              setShowCreateFundPasswordModal(true);
                            } else {
                              setShowWithdrawalModal(true);
                            }
                          }}
                          className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#0284C7] to-[#0369A1] hover:brightness-110 text-white font-black text-[13px] sm:text-[14px] flex items-center justify-center gap-1.5 sm:gap-2 shadow-[0_0_22px_rgba(0,240,255,0.45)] border border-[#00F0FF]/80 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          <ArrowUp className="w-4 h-4 shrink-0 text-white stroke-[3]" />
                          <span>Withdraw</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isLoggedIn) {
                              setIsSignUpMode(false);
                              setShowAuthModal(true);
                              return;
                            }
                            setShowP2PTransferModal(true);
                          }}
                          className="py-2.5 px-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11.5px] sm:text-[12.5px] flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/30 border border-purple-400/30 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5 shrink-0 text-purple-200" />
                          <span>P2P Transfer</span>
                        </button>
                      </div>

                      {/* Withdrawal & Deposit History Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => setShowWithdrawalHistoryModal(true)}
                          className="py-2 px-2 sm:px-3 rounded-xl bg-[#091526] hover:bg-[#0E2038] border border-[#1B3252] hover:border-[#00F0FF]/60 text-[#CBD5E1] hover:text-[#00F0FF] font-bold text-[10.5px] sm:text-[12px] flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                          <span className="truncate">Withdrawal History</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDepositHistoryModal(true)}
                          className="py-2 px-2 sm:px-3 rounded-xl bg-[#091526] hover:bg-[#0E2038] border border-[#1B3252] hover:border-emerald-500/60 text-[#CBD5E1] hover:text-emerald-400 font-bold text-[10.5px] sm:text-[12px] flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">Deposit History</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. 6-Card Financial Portfolio Grid (Total Investment, Total Earning, Deposit Balance, Referral Income, Withdrawable, Settled) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                    {/* Box 1: Total Investment / Staked Capital */}
                    <div className="p-4 rounded-2xl bg-[#081220] border border-[#00F0FF]/30 shadow-md hover:border-[#00F0FF]/60 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          Total Investment
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center text-[#00F0FF]">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] lg:text-[22px] font-black text-white font-mono">
                          ${activeMiningPower.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#00F0FF]">USD</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#122034]">
                        <span className="text-[10px] text-[#94A3B8]">Active Rig</span>
                        <span className="text-[10px] text-[#10B981] font-mono font-bold">Staked</span>
                      </div>
                    </div>

                    {/* Box 2: Total Earning (Mined Yield + Referral Income) */}
                    <div className="p-4 rounded-2xl bg-[#081220] border border-[#A855F7]/30 shadow-md hover:border-[#A855F7]/60 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#C084FC]">
                          Total Earning
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#A855F7]/15 flex items-center justify-center text-[#C084FC]">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] lg:text-[22px] font-black text-[#C084FC] font-mono">
                          ${(totalRewards + referralIncome).toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#C084FC]">USDT</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#122034]">
                        <span className="text-[10px] text-[#94A3B8]">Lifetime</span>
                        <span className="text-[10px] text-[#C084FC] font-mono font-bold">Accumulated</span>
                      </div>
                    </div>

                    {/* Box 3: Available Deposit Balance / Unutilized Funds */}
                    <div className="p-4 rounded-2xl bg-[#081220] border border-[#10B981]/30 shadow-md hover:border-[#10B981]/60 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          Deposit Balance
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] lg:text-[22px] font-black text-[#10B981] font-mono">
                          ${depositBalance.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#10B981]">USDT</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#122034]">
                        <span className="text-[10px] text-[#94A3B8]">Unutilized</span>
                        <span className="text-[10px] text-[#10B981] font-mono font-bold">Available</span>
                      </div>
                    </div>

                    {/* Box 4: Total Referral Income / Available Balance */}
                    <div className="p-4 rounded-2xl bg-[#081220] border border-[#10B981]/40 shadow-md hover:border-[#10B981]/70 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          Referral Balance
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
                          <Gift className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] lg:text-[22px] font-black text-[#10B981] font-mono">
                          ${referralBalance.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#10B981]">USDT</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#122034]">
                        <span className="text-[10px] text-[#94A3B8]">Tier 1-3</span>
                        <span className="text-[10px] text-[#10B981] font-mono font-bold">Earned</span>
                      </div>
                    </div>

                    {/* Box 5: Withdrawable Earnings / Daily Mining & Referral Profits */}
                    <div className="p-4 rounded-2xl bg-[#081220] border border-[#38BDF8]/30 shadow-md hover:border-[#38BDF8]/60 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          Withdrawable
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] lg:text-[22px] font-black text-[#38BDF8] font-mono">
                          ${availableWithdrawal.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#38BDF8]">USDT</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#122034]">
                        <span className="text-[10px] text-[#94A3B8]">Earned Yield</span>
                        <span className="text-[10px] text-[#38BDF8] font-mono font-bold">Instant Cashout</span>
                      </div>
                    </div>

                    {/* Box 6: Total Settled Cashouts */}
                    <div className="p-4 rounded-2xl bg-[#081220] border border-[#FBBF24]/30 shadow-md hover:border-[#FBBF24]/60 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          Settled Cashouts
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center text-[#FBBF24]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] lg:text-[22px] font-black text-[#FBBF24] font-mono">
                          ${totalWithdrawn.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#FBBF24]">USDT</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#122034]">
                        <span className="text-[10px] text-[#94A3B8]">Settled</span>
                        <span className="text-[10px] text-[#FBBF24] font-mono font-bold">Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. 2-Card ORC Metric Boxes (Total ORC and ORC Balance) */}
                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    {/* Box 1: Total ORC */}
                    <div className="p-4 rounded-2xl bg-[#081220] border border-[#00F0FF]/30 shadow-md hover:border-[#00F0FF]/60 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#00F0FF] truncate">
                            Total ORC
                          </span>
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25">
                            10 Levels
                          </span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center text-[#00F0FF] shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] lg:text-[22px] font-black text-[#00F0FF] font-mono">
                          ${totalOrcIncome.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#00F0FF]">USDT</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#122034]">
                        <span className="text-[10px] text-[#94A3B8] truncate">Lifetime Yield</span>
                        <button
                          type="button"
                          onClick={() => openTeamSubTab('orc')}
                          className="text-[10px] text-[#00F0FF] hover:underline font-mono font-bold flex items-center gap-0.5 cursor-pointer shrink-0"
                        >
                          <span>10 Tiers</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>

                    {/* Box 2: ORC Balance */}
                    <div className="p-4 rounded-2xl bg-[#081220] border border-[#10B981]/30 shadow-md hover:border-[#10B981]/60 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#10B981] truncate">
                            ORC Balance
                          </span>
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25">
                            Claimable
                          </span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981] shrink-0">
                          <Coins className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] lg:text-[22px] font-black text-[#10B981] font-mono">
                          ${orcBalance.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#10B981]">USDT</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#122034]">
                        <span className="text-[10px] text-[#94A3B8]">10 Tiers</span>
                        <span className="text-[10px] text-[#10B981] font-mono font-bold">Earned</span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Complete On-Chain Transaction Statement (The Ledger!) */}
                  <div className="p-4 lg:p-6 rounded-2xl bg-[#08101E] border border-[#182C48] shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#142338]">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                            <FileText className="w-4 h-4" />
                          </div>
                          <h3 className="text-[17px] lg:text-[20px] font-black text-white">
                            Transaction Statement & Ledger
                          </h3>
                        </div>
                        <p className="text-[11.5px] text-[#94A3B8] mt-0.5">
                          Complete cryptographic record of mining yield settlements, deposits, referral rewards, and external withdrawals.
                        </p>
                      </div>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(
                          [
                            { id: 'all', label: 'All' },
                            { id: 'mining', label: 'Mining Yields' },
                            { id: 'deposit', label: 'Deposits' },
                            { id: 'referral', label: 'Referrals' },
                            { id: 'orc', label: 'ORC Royalty' },
                            { id: 'withdraw', label: 'Withdrawals' }
                          ] as const
                        ).map((tab) => {
                          const isActive = walletTxFilter === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setWalletTxFilter(tab.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#0284C7] text-white shadow-sm'
                                  : 'bg-[#060D18] border border-[#142338] text-[#94A3B8] hover:text-white'
                              }`}
                            >
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filtered Transactions List */}
                    {(() => {
                      const filtered = transactions.filter((tx) => {
                        if (walletTxFilter === 'mining') return tx.type.toLowerCase().includes('mining') || tx.type.toLowerCase().includes('compound') || tx.type.toLowerCase().includes('reinvest');
                        if (walletTxFilter === 'deposit') return tx.type.toLowerCase().includes('deposit') || tx.type.toLowerCase().includes('bep-20');
                        if (walletTxFilter === 'referral') return tx.type.toLowerCase().includes('referral');
                        if (walletTxFilter === 'orc') return tx.type.toLowerCase().includes('orc');
                        if (walletTxFilter === 'withdraw') return tx.type.toLowerCase().includes('withdraw') || tx.type.toLowerCase().includes('payout');
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-10 text-center text-[12.5px] text-[#64748B] space-y-1">
                            <p>No transaction records found under this filter.</p>
                            <span className="text-[11px] text-[#475569]">
                              Transactions from active mining cycles, deposits, and cashouts will be audited here.
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="rounded-xl border border-[#142338] overflow-hidden bg-[#050B14]">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11.5px]">
                              <thead>
                                <tr className="border-b border-[#14233C] bg-[#070E1A] text-[#64748B] uppercase text-[10px] tracking-wider">
                                  <th className="py-3 px-3.5">Date & Time</th>
                                  <th className="py-3 px-3.5">Transaction Type</th>
                                  <th className="py-3 px-3.5">Hash / Reference</th>
                                  <th className="py-3 px-3.5 text-right">Amount (USDT)</th>
                                  <th className="py-3 px-3.5 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#101C2E]">
                                {filtered.map((tx) => (
                                  <tr key={tx.id} className="hover:bg-[#0A1628] transition-colors">
                                    <td className="py-3 px-3.5 font-mono text-[#94A3B8] whitespace-nowrap">
                                      {tx.date}
                                    </td>
                                    <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                                      {tx.type}
                                    </td>
                                    <td className="py-3 px-3.5 font-mono text-[#38BDF8] text-[11px] whitespace-nowrap">
                                      {tx.txHash ? (
                                        <div className="flex items-center gap-1">
                                          {tx.txHash.startsWith('0x') && tx.txHash.length === 66 ? (
                                            <a
                                              href={`https://bscscan.com/tx/${tx.txHash}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="hover:underline flex items-center gap-0.5 text-[#00F0FF]"
                                              title="View on BscScan"
                                            >
                                              <span>{tx.txHash.substring(0, 10)}...{tx.txHash.substring(tx.txHash.length - 8)}</span>
                                              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                                            </a>
                                          ) : (
                                            <span>{tx.txHash.length > 24 ? `${tx.txHash.substring(0, 10)}...${tx.txHash.substring(tx.txHash.length - 8)}` : tx.txHash}</span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard?.writeText(tx.txHash || '');
                                              showToast('✓ Hash copied to clipboard!');
                                            }}
                                            className="hover:text-white cursor-pointer ml-1 text-gray-500 hover:text-white transition-colors"
                                            title="Copy transaction hash"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-gray-500">N/A</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-3.5 text-right font-mono font-black text-[12.5px] whitespace-nowrap">
                                      <span className={
                                        tx.status?.toLowerCase().includes('reject')
                                          ? 'text-[#64748B] line-through'
                                          : tx.amount > 0
                                          ? 'text-[#10B981]'
                                          : 'text-[#EF4444]'
                                      }>
                                        {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} USDT
                                      </span>
                                    </td>
                                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          tx.status?.toLowerCase().includes('settled') || tx.status?.toLowerCase().includes('approved')
                                            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                                            : tx.status?.toLowerCase().includes('reject')
                                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-extrabold'
                                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                        }`}
                                      >
                                        {tx.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
          </div>

          {/* SCREEN 6: TEAM & DOWNLINE NETWORK */}
          <div className={activeRoute === 'referral' ? 'space-y-6 animate-fadeIn' : 'hidden'}>
            {!isLoggedIn ? (
              renderAuthBarrier(
                'Team Network Locked',
                'Please sign in to generate your affiliate link, view multi-tier downline structure, track team turnover, and collect team rewards.',
                'Team Portal'
              )
            ) : activeTeamTab === 'select' ? (
              <div className="py-2 animate-fadeIn space-y-3">
                <div>
                  <button
                    type="button"
                    onClick={handleBackFromTeamSelect}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B1424] hover:bg-[#0F1D33] border border-[#192A44] hover:border-[#00F0FF]/50 text-[#CBD5E1] hover:text-[#00F0FF] text-[12px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>← Back</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {/* Card 1: Referral */}
                  <button
                    type="button"
                    onClick={() => openTeamSubTab('referral')}
                    className="relative p-5 sm:p-6 rounded-2xl bg-[#0B1424] hover:bg-[#0E1A2E] border border-[#192A44] hover:border-[#00F0FF]/80 shadow-xl hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] transition-all cursor-pointer group flex flex-col justify-between text-left active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/25 flex items-center justify-center text-[#00F0FF] group-hover:scale-105 group-hover:bg-[#00F0FF]/20 transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]">
                          <Users className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
                          3 Tiers
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#00F0FF] transition-colors">
                        Referral
                      </h3>
                      <p className="text-[12px] font-bold text-[#00F0FF] tracking-wide mt-1">
                        Direct Stake Bonus · 10% · 5% · 2%
                      </p>
                      <p className="text-[12.5px] text-[#94A3B8] leading-relaxed mt-2.5">
                        Earn instant affiliate commissions whenever your 3-tier downline activates or upgrades mining rigs.
                      </p>
                    </div>

                    <div className="pt-4 mt-5 border-t border-[#152438] flex items-center justify-between">
                      <span className="text-[11.5px] font-mono text-[#64748B]">
                        Sponsor Network
                      </span>
                      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021020] font-black text-[11.5px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.25)] group-hover:brightness-110 transition-all">
                        <span>Open Referral</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>

                  {/* Card 2: ORC */}
                  <button
                    type="button"
                    onClick={() => openTeamSubTab('orc')}
                    className="relative p-5 sm:p-6 rounded-2xl bg-[#0B1424] hover:bg-[#0E1A2E] border border-[#192A44] hover:border-[#00F0FF]/80 shadow-xl hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] transition-all cursor-pointer group flex flex-col justify-between text-left active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/25 flex items-center justify-center text-[#00F0FF] group-hover:scale-105 group-hover:bg-[#00F0FF]/20 transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]">
                          <Zap className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
                          10 Levels
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#00F0FF] transition-colors">
                        ORC
                      </h3>
                      <p className="text-[12px] font-bold text-[#00F0FF] tracking-wide mt-1">
                        Daily Yield Royalty · 5% · 3% · 2% · 1%
                      </p>
                      <p className="text-[12.5px] text-[#94A3B8] leading-relaxed mt-2.5">
                        Earn passive daily royalties calculated directly from your 10-tier team's mined yield every 24 hours.
                      </p>
                    </div>

                    <div className="pt-4 mt-5 border-t border-[#152438] flex items-center justify-between">
                      <span className="text-[11.5px] font-mono text-[#64748B]">
                        Royalty Engine
                      </span>
                      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021020] font-black text-[11.5px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.25)] group-hover:brightness-110 transition-all">
                        <span>Open ORC</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : activeTeamTab === 'referral' ? (
              <div className="space-y-4 animate-fadeIn">
                <button
                  type="button"
                  onClick={handleBackFromTeamSubTab}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B1424] hover:bg-[#0F1D33] border border-[#192A44] hover:border-[#00F0FF]/50 text-[#CBD5E1] hover:text-[#00F0FF] text-[12px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
                  <span>← Back to Team</span>
                </button>

                <ReferralNetworkSection
                  referralLink={activeMiningPower > 0 ? `${typeof window !== 'undefined' ? window.location.origin : 'https://www.neoncryptomining.com'}?ref=${(userReferralCode || userName).toUpperCase()}` : ''}
                  isAccountActive={activeMiningPower > 0}
                  onCopyReferral={() => {
                    if (activeMiningPower <= 0) {
                      showToast('⚠️ Referral link locked! Please activate any mining plan ($20+) to unlock sharing.');
                      return;
                    }
                    const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.neoncryptomining.com'}?ref=${(userReferralCode || userName).toUpperCase()}`;
                    navigator.clipboard?.writeText(link);
                    showToast('✓ Referral link copied to clipboard!');
                  }}
                  referralIncome={referralIncome}
                  referralBalance={referralBalance}
                  onSendReferralToWallet={handleTransferReferralToMainWallet}
                  onReinvestReferralToPlan={handleReinvestReferralToPlan}
                  referredUsers={referredUsers}
                  myStake={activeMiningPower}
                  teamTurnover={teamTurnover}
                />
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <button
                  type="button"
                  onClick={handleBackFromTeamSubTab}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B1424] hover:bg-[#0F1D33] border border-[#192A44] hover:border-[#00F0FF]/50 text-[#CBD5E1] hover:text-[#00F0FF] text-[12px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
                  <span>← Back to Team</span>
                </button>

                <OrcCommissionSection
                  referredUsers={referredUsers}
                  myStake={activeMiningPower}
                  userName={userName}
                  orcBalance={orcBalance}
                  totalOrcIncome={totalOrcIncome}
                  onSendOrcToWallet={handleTransferOrcToMainWallet}
                  onReinvestOrcToPlan={handleReinvestOrcToPlan}
                />
              </div>
            )}
          </div>

          {/* SCREEN 7: ABOUT & PROTOCOL */}
          <div className={activeRoute === 'about' ? 'space-y-4 animate-fadeIn' : 'hidden'}>
            <AboutNeonSection />
            <HowItWorksSection />
          </div>

          {/* SCREEN 8: FAQ & SECURITY */}
          <div className={activeRoute === 'faq' ? 'space-y-4 animate-fadeIn' : 'hidden'}>
            <SecurityAndFaqSection />
          </div>

          {/* SCREEN 9: CONTACT & SUPPORT */}
          <div className={activeRoute === 'contact' ? 'space-y-4 animate-fadeIn' : 'hidden'}>
            <ContactSection />
          </div>
        </div>

        {/* Persistent Bottom Mobile Navigation Bar */}
        <BottomNavBar
          activeRoute={activeRoute}
          onRouteChange={(route) => navigateTo(route)}
          currentLang={currentLang}
        />

        {/* Slide-over Nav Drawer for all 9 pages */}
        <NeonNavDrawer
          isOpen={isDrawerOpen}
          activeRoute={activeRoute}
          isLoggedIn={isLoggedIn}
          onNavigate={(route) => {
            navigateTo(route);
            setIsDrawerOpen(false);
          }}
          onClose={() => setIsDrawerOpen(false)}
          onAuthClick={() => {
            setIsDrawerOpen(false);
            if (isLoggedIn) {
              handleLogout();
            } else {
              setIsSignUpMode(false);
              setShowAuthModal(true);
            }
          }}
          onOpenAdminPortal={isStandaloneApp ? undefined : () => {
            setIsDrawerOpen(false);
            setUserRole(getStoredAdminRole());
            setShowAdminPortal(true);
          }}
          currentLang={currentLang}
          onSelectLang={(lang) => {
            setCurrentLang(lang);
            applyLanguageChange(lang);
            showToast(`Language switched to: ${lang.toUpperCase()}`);
          }}
          isStandaloneApp={isStandaloneApp}
        />

        {/* Multi-Step Realistic Plan Checkout Wizard Modal */}
        <PlanCheckoutModal
          isOpen={!!selectedPlanForCheckout && !showAdminPortal}
          plan={selectedPlanForCheckout}
          isUpgrade={isUpgradeModal}
          activeMiningPower={activeMiningPower}
          diffAmount={upgradeDiffAmount}
          availableBalance={+(depositBalance + availableWithdrawal).toFixed(2)}
          vaultWalletAddress={platformSettings?.vaultWalletAddress || '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'}
          userId={userName}
          fundPin={userFundPassword}
          onDismiss={() => {
            setSelectedPlanForCheckout(null);
            setIsUpgradeModal(false);
          }}
          onNavigateToDashboard={() => {
            setSelectedPlanForCheckout(null);
            setIsUpgradeModal(false);
            navigateTo('dashboard');
          }}
          onConfirmSuccess={handleCheckoutSuccess}
        />

        {/* Demo Deposit Dialog */}
        <DepositDemoDialog
          isOpen={showDepositDialog && !showAdminPortal}
          onDismiss={() => setShowDepositDialog(false)}
          onDepositConfirmed={handleDepositConfirmed}
          vaultWalletAddress={platformSettings?.vaultWalletAddress || '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'}
          userId={userName}
        />

        {/* P2P Member Transfer Modal */}
        <P2PTransferModal
          isOpen={showP2PTransferModal && !showAdminPortal}
          onDismiss={() => setShowP2PTransferModal(false)}
          depositBalance={depositBalance}
          availableBalance={+availableWithdrawal.toFixed(2)}
          userFundPassword={userFundPassword}
          adminUsers={adminUsers}
          currentUserId={userName}
          onConfirmTransfer={handleConfirmP2PTransfer}
        />

        {/* Withdrawal History Modal */}
        <WithdrawalHistoryModal
          isOpen={showWithdrawalHistoryModal && !showAdminPortal}
          onDismiss={() => setShowWithdrawalHistoryModal(false)}
          withdrawalRequests={withdrawalRequests}
          onRequestNewWithdrawal={() => {
            setShowWithdrawalHistoryModal(false);
            if (!userFundPinSet) {
              setShowCreateFundPasswordModal(true);
            } else {
              setShowWithdrawalModal(true);
            }
          }}
        />

        {/* Dedicated 6-Digit Create Fund Password Modal */}
        <CreateFundPasswordModal
          isOpen={showCreateFundPasswordModal && !showAdminPortal}
          onDismiss={() => setShowCreateFundPasswordModal(false)}
          onSuccess={handleFundPasswordCreated}
        />

        {/* Dedicated Withdrawal Popup Modal Window */}
        {showWithdrawalModal && !showAdminPortal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
            <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#081220] border border-[#1C3558] p-4 sm:p-6 shadow-2xl shadow-cyan-950/50 animate-scaleUp">
              {/* Top Close Button */}
              <button
                type="button"
                onClick={() => setShowWithdrawalModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-[#0E1A2D] hover:bg-[#182C4A] border border-[#1E3658] flex items-center justify-center text-[#94A3B8] hover:text-white transition-all cursor-pointer z-10"
                aria-label="Close"
              >
                ✕
              </button>

              <WithdrawalSection
                availableBalance={+availableWithdrawal.toFixed(2)}
                miningEarnings={Math.max(0, +(availableWithdrawal - referralBalance).toFixed(2))}
                referralEarnings={referralBalance}
                userFundPassword={userFundPassword}
                withdrawalRequests={withdrawalRequests}
                onWithdrawSubmit={(amt, wallet, pin) => {
                  handleWithdrawSubmit(amt, wallet, pin);
                  setShowWithdrawalModal(false);
                }}
                onSubmitCompanyQuery={handleCompanyQuery}
                onOpenCreatePinModal={() => {
                  setShowWithdrawalModal(false);
                  setShowCreateFundPasswordModal(true);
                }}
                onSetUserFundPassword={(newPin) => {
                  setUserFundPassword(newPin);
                  try {
                    localStorage.setItem('neon_fund_password', newPin);
                  } catch (e) {}
                  if (userName) {
                    const cleanId = userName.toUpperCase();
                    saveUserSavedData(cleanId, { fundPin: newPin });
                    setAdminUsers((prev) =>
                      prev.map((u) =>
                        u.id.toUpperCase() === cleanId || u.name.toUpperCase() === cleanId
                          ? { ...u, fundPin: newPin, fundPinSet: true }
                          : u
                      )
                    );
                  }
                  showToast(`🔒 6-digit Fund Password updated!`);
                }}
                onOpenHistoryModal={() => {
                  setShowWithdrawalModal(false);
                  setShowWithdrawalHistoryModal(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Deposit & Inflow History Modal */}
        <DepositHistoryModal
          isOpen={showDepositHistoryModal && !showAdminPortal}
          onDismiss={() => setShowDepositHistoryModal(false)}
          depositRecords={depositRecords}
          onOpenDepositDialog={() => setShowDepositDialog(true)}
        />

        {/* Legal Policies Suite Modal */}
        <LegalPolicyModal
          isOpen={showLegalModal && !showAdminPortal}
          initialTab={activeLegalTab}
          onDismiss={() => setShowLegalModal(false)}
        />

        {/* Enterprise Full-System Admin Portal - COMPLETELY DISABLED IN STANDALONE APP (Browser Only) */}
        {!isStandaloneApp && showAdminPortal && (
          <AdminSystemPortal
            isOpen={showAdminPortal}
            currentRole={userRole}
            withdrawalRequests={adminWithdrawals}
            supportTickets={supportTickets}
            subAdmins={subAdmins}
            adminUsers={adminUsers}
            adminOrders={adminOrders}
            telemetry={adminTelemetry}
            platformSettings={platformSettings}
            activeUsersCount={activeUsersCount}
            miningPlans={miningPlans}
            onUpdateMiningPlans={handleUpdateMiningPlans}
            onSelectRole={(role) => {
              setUserRole(role);
              showToast(`Switched active view to: ${role.toUpperCase()}`);
            }}
            onApproveWithdrawal={handleApproveWithdrawal}
            onRejectWithdrawal={handleRejectWithdrawal}
            onResetUserFundPin={handleResetUserFundPin}
            onQuickResetUserPin={handleQuickResetUserPin}
            onToggleUserStatus={handleToggleUserStatus}
            onAddSubAdmin={handleAddSubAdmin}
            onDeleteSubAdmin={handleDeleteSubAdmin}
            onUpdatePlatformSettings={handleUpdatePlatformSettings}
            onDeleteUser={handleDeleteUser}
            onPurgeInactiveUsers={handlePurgeInactiveUsers}
            onClearAllUsers={handleClearAllUsers}
            onRefreshMiners={fetchLiveAdminUsers}
            onResetAllData={() => {
              // Clear all localStorage keys (keep neon_used_tx_hashes permanently intact)
              const keysToRemove = [
                'neon_admin_users', 'neon_admin_orders', 'neon_admin_telemetry',
                'neon_withdrawal_requests', 'neon_transactions', 'neon_referred_users',
                'neon_sub_admins',
                'neon_is_logged_in', 'neon_user_name', 'neon_user_mobile', 'neon_user_email',
                'neon_fund_password', 'neon_upline_code', 'neon_total_balance',
                'neon_deposit_balance', 'neon_mining_power', 'neon_total_rewards', 'neon_referral_income',
                'neon_referral_balance', 'neon_yesterdays_income', 'neon_available_withdrawal',
                'neon_mining_active', 'neon_seconds_remaining', 'neon_last_compound_time',
                'neon_unclaimed_yield',
                'neon_mining_plans'
              ];
              keysToRemove.forEach((k) => localStorage.removeItem(k));
              // Ensure test users remain tombstoned so they never resurrect on reload
              try {
                localStorage.setItem('neon_deleted_user_ids', JSON.stringify(KNOWN_TEST_USER_IDS));
              } catch {}
              // Reset all in-memory state
              setAdminUsers([]);
              setAdminOrders([]);
              setSubAdmins([]);
              setAdminTelemetry(INITIAL_ADMIN_TELEMETRY);
              setWithdrawalRequests([]);
              setTransactions([]);
              setReferredUsers([]);
              setIsLoggedIn(false);
              setUserName('');
              setUserMobile('');
              setUserEmail('');
              setUserFundPassword('');
              setUserUplineCode('');
              setTotalBalance(0);
              setDepositBalance(0);
              setActiveMiningPower(0);
              setUnclaimedYield(0);
              setLastCompoundTimestamp(0);
              setCompoundSecondsLeft(0);
              setTotalRewards(0);
              setReferralIncome(0);
              setReferralBalance(0);
              setTotalOrcIncome(0);
              setOrcBalance(0);
              setYesterdaysIncome(0);
              setAvailableWithdrawal(0);
              setIsMiningActive(false);
              setSecondsRemaining(24 * 3600);
              setTeamTurnover({ personalStaked: 0, downlineL1: 0, downlineL2: 0, downlineL3: 0, totalVolume: 0, boostedRate: 1.0 });
              setMiningPlans(MINING_PLANS);
              showToast('✓ All platform data reset to clean zero (0) for fresh testing!');
            }}
            onClose={() => {
              setShowAdminPortal(false);
              window.history.replaceState({ route: 'home' }, '', '#home');
              setActiveRoute('home');
            }}
            onReplySupportTicket={(ticketId, replyText, adminName) => {
              const ownerId = (isLoggedIn && userName ? userName : getDeviceGuestId()).toLowerCase();
              setSupportTickets((prev) => {
                const updated: SupportTicket[] = prev.map((t) =>
                  t.id === ticketId
                    ? {
                        ...t,
                        status: 'replied' as const,
                        adminReply: replyText,
                        adminName: adminName || 'Support Desk',
                        repliedAt: new Date().toISOString(),
                        userRead: false
                      }
                    : t
                );
                try {
                  localStorage.setItem(`neon_tickets_${ownerId}`, JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }}
          />
        )}

        {/* Floating AI Mining Assistant Widget with Emergency Ticket Escalation (Home Page Only) */}
        {activeRoute === 'home' && !showAdminPortal && (
          <NeonAIChatAssistant
            currentUser={{
              id: userName || 'guest_user',
              name: userName || 'Guest Miner',
              mobile: userMobile || '',
              email: userEmail || '',
              planName: activeMiningPower > 0 ? (getPlanForAmount(activeMiningPower, miningPlans)?.planName || `$${activeMiningPower} Active Rig`) : 'No Active Plan',
              availableBalance: availableWithdrawal
            }}
            onDispatchEmergencyTicket={(ticket) => {
              setSupportTickets((prev) => [ticket, ...prev]);
              showToast('🚨 Emergency ticket dispatched to Admin On-Call Desk!');
            }}
            onOpenInbox={() => handleOpenSupportInbox('new')}
          />
        )}

        {/* Support Inbox & Query Desk Modal */}
        <SupportInboxModal
          isOpen={showSupportInboxModal}
          onClose={() => setShowSupportInboxModal(false)}
          userId={isLoggedIn && userName ? userName.toLowerCase() : getDeviceGuestId()}
          userName={isLoggedIn && userName ? userName : 'Guest Miner'}
          userMobile={userMobile}
          userEmail={userEmail}
          tickets={supportTickets}
          onTicketCreated={(newTkt) => {
            const ownerId = (isLoggedIn && userName ? userName : getDeviceGuestId()).toLowerCase();
            setSupportTickets((prev) => {
              const updated = [newTkt, ...prev.filter((t) => t.id !== newTkt.id)];
              try {
                localStorage.setItem(`neon_tickets_${ownerId}`, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }}
          onMarkTicketRead={async (tktId) => {
            const ownerId = (isLoggedIn && userName ? userName : getDeviceGuestId()).toLowerCase();
            setSupportTickets((prev) => {
              const updated = prev.map((t) => (t.id === tktId ? { ...t, userRead: true } : t));
              try {
                localStorage.setItem(`neon_tickets_${ownerId}`, JSON.stringify(updated));
              } catch {}
              return updated;
            });
            try {
              await nexoraApi.markTicketRead(tktId);
            } catch (e) {}
          }}
          initialTab={inboxInitialTab}
          userHasActivePlan={activeMiningPower > 0}
        />

        {/* Auth Modal with Mobile + Country Flag + Random Username + Google Auth */}
        <AuthModalDialog
          isOpen={showAuthModal && !isLoggedIn && !showAdminPortal}
          isSignUp={isSignUpMode}
          initialReferralCode={preFilledRefCode}
          incomingResetToken={incomingResetToken}
          incomingResetEmail={incomingResetEmail}
          onDismiss={() => {
            setShowAuthModal(false);
            setIncomingResetToken(null);
            setIncomingResetEmail(null);
          }}
          onAuthSuccess={handleAuthSuccess}
          onSwitchAuthMode={() => setIsSignUpMode(!isSignUpMode)}
        />


        {/* Welcome Promotional Showcase / Featured Mining Plans Popup Modal - USER SIDE ONLY */}
        {!showAdminPortal && (
          <PromotionalPlanPopupModal
            isOpen={showPromoPopup && !showAdminPortal}
            onDismiss={() => setShowPromoPopup(false)}
            onSelectPlan={(plan) => {
              setShowPromoPopup(false);
              handleSelectPlan(plan);
            }}
            onViewAllPlans={() => {
              setShowPromoPopup(false);
              navigateTo('plans');
            }}
            adminPopupImageUrl={(platformSettings?.popupEnabled !== false) ? (platformSettings?.popupImageUrl || '') : ''}
            adminPopupLinkUrl={platformSettings?.popupLinkUrl || ''}
            miningPlans={miningPlans}
          />
        )}

        {/* Global Toast Notification - USER SIDE ONLY */}
        {!showAdminPortal && (
          <ToastNotification message={toastMessage} onDismiss={() => setToastMessage(null)} />
        )}
      </main>
    </div>
  );
};

export default App;
