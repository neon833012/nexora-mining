import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { NeonTopAppBar } from './components/NeonTopAppBar';
import { BlockchainLiveTicker } from './components/BlockchainLiveTicker';
import { FuturisticHeroSection } from './components/FuturisticHeroSection';
import { LiveStatsGrid } from './components/LiveStatsGrid';
import { AboutNeonSection } from './components/AboutNeonSection';
import { MiningPlanCards } from './components/MiningPlanCards';
import { InteractiveMiningCalculator } from './components/InteractiveMiningCalculator';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ReferralNetworkSection } from './components/ReferralNetworkSection';
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
import { AdminSystemPortal } from './components/AdminSystemPortal';
import { BottomNavBar, NavRoute } from './components/BottomNavBar';
import { nexoraApi } from './services/api';
import {
  MiningPlan,
  TransactionRecord,
  LanguageCode,
  UserRole,
  WithdrawalRequest,
  DepositRecord,
  SupportTicket,
  SubAdminUser,
  TeamTurnover,
  AdminUserRecord,
  AdminOrderRecord,
  AdminTelemetry,
  PlatformSettings,
  ReferredUserItem
} from './types/mining';

const DEFAULT_INITIAL_REFERRED_USERS: ReferredUserItem[] = [];
import { MINING_PLANS, INITIAL_TRANSACTIONS, INITIAL_WITHDRAWAL_REQUESTS, getTranslation, getPlanForAmount } from './data/miningPlans';
import { getSavedLanguage, applyLanguageChange, retriggerGoogleTranslate } from './utils/languageManager';
import {
  INITIAL_ADMIN_USERS,
  INITIAL_ADMIN_ORDERS,
  INITIAL_ADMIN_TELEMETRY,
  INITIAL_PLATFORM_SETTINGS
} from './data/mockAdminData';
import {
  ArrowRight,
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
  TrendingUp,
  Send,
  History,
  Copy,
  ExternalLink
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
  yesterdaysIncome?: number;
  isMiningActive?: boolean;
  miningStartTime?: number;
  secondsRemaining?: number;
  unclaimedYield?: number;
  transactions?: TransactionRecord[];
  depositRecords?: DepositRecord[];
  fundPin?: string;
}

export const getUserStorageKey = (uid: string) => `neon_user_${uid.toUpperCase()}`;

export const loadUserSavedData = (uid?: string): UserPersistentData | null => {
  if (!uid) return null;
  return loadStorage<UserPersistentData | null>(getUserStorageKey(uid), null);
};

export const saveUserSavedData = (uid: string, data: Partial<UserPersistentData>) => {
  if (!uid) return;
  try {
    const key = getUserStorageKey(uid);
    const existing = loadStorage<UserPersistentData | null>(key, null) || {};
    localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
  } catch (e) {}
};

export const App: React.FC = () => {
  // Navigation & Multi-Page View
  const [activeRoute, setActiveRoute] = useState<NavRoute>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Centralized Navigation with Browser History Stack (Enables step-by-step phone back button)
  const navigateTo = (route: NavRoute, replace: boolean = false) => {
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
    }
    setTimeout(() => {
      retriggerGoogleTranslate();
    }, 60);
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

    try {
      // Purge test accounts from neon_admin_users
      const rawAdminUsers = localStorage.getItem('neon_admin_users');
      if (rawAdminUsers) {
        const parsedUsers = JSON.parse(rawAdminUsers);
        if (Array.isArray(parsedUsers)) {
          const cleanUsers = parsedUsers.filter((u: any) => !isTestAccount(u.id, u.name, u.email));
          if (cleanUsers.length !== parsedUsers.length) {
            localStorage.setItem('neon_admin_users', JSON.stringify(cleanUsers));
            setAdminUsers(cleanUsers);
          }
        }
      }

      // Purge orphan orders from neon_admin_orders
      const rawAdminOrders = localStorage.getItem('neon_admin_orders');
      if (rawAdminOrders) {
        const parsedOrders = JSON.parse(rawAdminOrders);
        if (Array.isArray(parsedOrders)) {
          const rawAdminUsers = localStorage.getItem('neon_admin_users');
          const parsedUsers = rawAdminUsers ? JSON.parse(rawAdminUsers) : [];
          const userIds = new Set((parsedUsers || []).map((u: any) => (u.id || u.name || '').toLowerCase()));
          const cleanOrders = (userIds.size === 0)
            ? []
            : parsedOrders.filter((o: any) => {
                if (isTestAccount(o.userId, o.userName, o.userEmail)) return false;
                const uid = (o.userId || o.userName || '').toLowerCase();
                return userIds.has(uid);
              });
          localStorage.setItem('neon_admin_orders', JSON.stringify(cleanOrders));
          setAdminOrders(cleanOrders);
        }
      }
    } catch {}

    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '') as NavRoute;
    const adminParam = urlParams.get('admin');
    const isAdminRequested = (hash as any) === 'admin' || adminParam === 'portal' || adminParam === 'true' || adminParam === '1';

    if (isAdminRequested) {
      setUserRole('superadmin');
      setShowAdminPortal(true);
      window.history.replaceState({ route: 'admin' }, '', '#admin');
    } else {
      const initialRoute = validRoutes.includes(hash) ? hash : 'home';
      setActiveRoute(initialRoute);
      window.history.replaceState({ route: initialRoute }, '', `#${initialRoute}`);
    }
    setTimeout(() => {
      retriggerGoogleTranslate();
    }, 100);

    const handlePopState = (event: PopStateEvent) => {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash === 'admin') {
        setUserRole('superadmin');
        setShowAdminPortal(true);
        return;
      }
      const poppedRoute = event.state?.route as NavRoute;
      if (poppedRoute && validRoutes.includes(poppedRoute)) {
        setActiveRoute(poppedRoute);
      } else {
        if (validRoutes.includes(currentHash as NavRoute)) {
          setActiveRoute(currentHash as NavRoute);
        } else {
          setActiveRoute('home');
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        retriggerGoogleTranslate();
      }, 60);
    };

    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash === 'admin') {
        setUserRole('superadmin');
        setShowAdminPortal(true);
        return;
      }
      if (validRoutes.includes(currentHash as NavRoute)) {
        setActiveRoute(currentHash as NavRoute);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          retriggerGoogleTranslate();
        }, 60);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret Admin Hotkey: Ctrl+Shift+A (or Cmd+Shift+A) toggles the Admin Portal
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setUserRole('superadmin');
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

  // Role Management State
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  // Sub-Admins List - Clean initial empty state for fresh production
  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>(() => loadStorage('neon_sub_admins', []));

  // Enterprise Admin System State (Users, Orders, Telemetry, Rules) - Persisted in LocalStorage
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(() => {
    const loaded = loadStorage<AdminUserRecord[]>('neon_admin_users', []);
    return (loaded || []).filter((u) => !isTestAccount(u.id, u.name, u.email));
  });
  const [adminOrders, setAdminOrders] = useState<AdminOrderRecord[]>(() => {
    const loadedUsers = loadStorage<AdminUserRecord[]>('neon_admin_users', []);
    if (!loadedUsers || loadedUsers.length === 0) {
      try {
        localStorage.setItem('neon_admin_orders', '[]');
      } catch (e) {}
      return [];
    }
    const loaded = loadStorage<AdminOrderRecord[]>('neon_admin_orders', []);
    return (loaded || []).filter(
      (o) => !isTestAccount(o.userId, o.userName, o.userEmail) && loadedUsers.some((u) => u.id === o.userId || u.name === o.userName)
    );
  });
  const [adminTelemetry, setAdminTelemetry] = useState<AdminTelemetry>(() => loadStorage('neon_admin_telemetry', INITIAL_ADMIN_TELEMETRY));
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => loadStorage('neon_platform_settings', INITIAL_PLATFORM_SETTINGS));

  // Auth & Session State - Persisted in LocalStorage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => loadStorageBool('neon_is_logged_in', false));
  const [userName, setUserName] = useState<string>(() => loadStorageStr('neon_user_name', ''));
  const [userMobile, setUserMobile] = useState<string>(() => loadStorageStr('neon_user_mobile', ''));
  const [userEmail, setUserEmail] = useState<string>(() => loadStorageStr('neon_user_email', ''));
  const [userFundPassword, setUserFundPassword] = useState<string>(() => loadStorageStr('neon_fund_password', ''));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [preFilledRefCode, setPreFilledRefCode] = useState('');
  const [userUplineCode, setUserUplineCode] = useState<string>(() => loadStorageStr('neon_upline_code', ''));
  const [userReferralCode, setUserReferralCode] = useState<string>(() => loadStorageStr('neon_referral_code', ''));

  // 3-Second Promotional Plans Showcase Popup Modal State
  const [showPromoPopup, setShowPromoPopup] = useState(false);

  // Active Users Counter - Increases by exactly 40 per hour (1 every 90 seconds = 90,000 ms) + real users (adminUsers.length)
  const [simulatedUsersCount, setSimulatedUsersCount] = useState<number>(() => {
    let saved = loadStorageNum('neon_simulated_users', 19480);
    if (saved > 30000) saved = 19480;
    const lastTime = loadStorageNum('neon_simulated_users_time', Date.now());
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - lastTime) / 1000));
    // 40 users per hour = (40 / 3600) per second = 1 user every 90 seconds
    const addedSince = Math.floor(elapsedSecs * (40 / 3600));
    return saved + addedSince;
  });

  // Ticking effect: exactly 40 per hour = 1 user every 90,000 ms (90 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedUsersCount((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem('neon_simulated_users', String(next));
          localStorage.setItem('neon_simulated_users_time', String(Date.now()));
        } catch (e) {}
        return next;
      });
    }, 90000); // 3,600,000 ms / 40 = 90,000 ms (40 users/hour)

    return () => clearInterval(interval);
  }, []);

  // Total Active Users = Simulated baseline (40/min) + Real registered users
  const activeUsersCount = simulatedUsersCount + adminUsers.length;

  // Active Miners = 75% to 85% of activeUsersCount (baseline ~80%) + real users who have an active staked plan
  const realActiveMinersCount = useMemo(
    () => (adminUsers || []).filter((u) => u.status === 'active' || (u.stakedAmount && u.stakedAmount > 0)).length,
    [adminUsers]
  );
  const activeMinersCount = useMemo(
    () => Math.floor(activeUsersCount * 0.798) + realActiveMinersCount,
    [activeUsersCount, realActiveMinersCount]
  );

  // Dynamic Mining Plans State - Persisted in LocalStorage
  const [miningPlans, setMiningPlans] = useState<MiningPlan[]>(() => loadStorage('neon_mining_plans', MINING_PLANS));

  const handleUpdateMiningPlans = (updated: MiningPlan[]) => {
    setMiningPlans(updated);
    try {
      localStorage.setItem('neon_mining_plans', JSON.stringify(updated));
    } catch (e) {}
    showToast('✓ Mining plans configuration updated across platform!');
  };

  // Financial Dashboard State - Persisted in LocalStorage (User-scoped)
  const [totalBalance, setTotalBalance] = useState<number>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    if (ud?.totalBalance !== undefined) return ud.totalBalance;
    return loadStorageNum('neon_total_balance', 0.0);
  });
  const [depositBalance, setDepositBalance] = useState<number>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    if (ud?.depositBalance !== undefined) return ud.depositBalance;
    return loadStorageNum('neon_deposit_balance', 0.0);
  });
  const [activeMiningPower, setActiveMiningPower] = useState<number>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    if (ud?.activeMiningPower !== undefined && ud.activeMiningPower > 0) return ud.activeMiningPower;
    return loadStorageNum('neon_mining_power', 0.0);
  });
  const [totalRewards, setTotalRewards] = useState<number>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    if (ud?.totalRewards !== undefined) return ud.totalRewards;
    return loadStorageNum('neon_total_rewards', 0.0);
  });
  const [referralIncome, setReferralIncome] = useState<number>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    if (ud?.referralIncome !== undefined) return ud.referralIncome;
    return loadStorageNum('neon_referral_income', 0.0);
  });
  const [referralBalance, setReferralBalance] = useState<number>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    if (ud?.referralBalance !== undefined) return ud.referralBalance;
    return loadStorageNum('neon_referral_balance', 0.0);
  });
  const [yesterdaysIncome, setYesterdaysIncome] = useState<number>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    if (ud?.yesterdaysIncome !== undefined) return ud.yesterdaysIncome;
    return loadStorageNum('neon_yesterdays_income', 0.0);
  });
  const [availableWithdrawal, setAvailableWithdrawal] = useState<number>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    if (ud?.availableWithdrawal !== undefined) return ud.availableWithdrawal;
    return loadStorageNum('neon_available_withdrawal', 0.0);
  });
  const [isCompoundingActive, setIsCompoundingActive] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    const saved = loadStorage<TransactionRecord[]>('neon_transactions', []);
    return saved && saved.length > 0 ? saved : [];
  });
  const [walletTxFilter, setWalletTxFilter] = useState<'all' | 'mining' | 'deposit' | 'referral' | 'withdraw'>('all');
  const [referredUsers, setReferredUsers] = useState<ReferredUserItem[]>(() => loadStorage('neon_referred_users', []));

  // Team Turnover Volume Milestones ($1,000 -> 1.5%, $2,500 -> 2%) - Clean 0
  const [teamTurnover, setTeamTurnover] = useState<TeamTurnover>(() => {
    const u = loadStorageStr('neon_user_name', '');
    const ud = loadUserSavedData(u);
    const power = (ud?.activeMiningPower && ud.activeMiningPower > 0) ? ud.activeMiningPower : loadStorageNum('neon_mining_power', 0.0);
    return {
      personalStaked: power,
      downlineL1: 0.0,
      downlineL2: 0.0,
      downlineL3: 0.0,
      totalVolume: power,
      boostedRate: power >= 2500 ? 2.5 : power >= 1000 ? 1.5 : 1.0
    };
  });

  // Dynamic calculation of daily reward based on turnover boost rate
  const todaysReward = +(activeMiningPower * (teamTurnover.boostedRate / 100)).toFixed(2);

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

  // 24-Hour Compound Interest & Reinvestment Engine
  // Yield generates ONLY when 24h mining cycle completes. Re-invest is unlocked ONLY when unclaimedYield > 0.
  const [unclaimedYield, setUnclaimedYield] = useState<number>(() => loadStorageNum('neon_unclaimed_yield', 0.0));
  const [lastCompoundTimestamp, setLastCompoundTimestamp] = useState<number>(0);
  const [compoundSecondsLeft, setCompoundSecondsLeft] = useState<number>(0);
  const isCompoundLocked = activeMiningPower <= 0 || unclaimedYield <= 0;

  // Formatted timestamp helper for consistent ledger auditing
  const getFormattedTimestamp = () => {
    const now = new Date();
    const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${datePart}, ${timePart}`;
  };

  // Withdrawal Requests Queue & P2P Outgoing Ledger - Persisted in LocalStorage
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    try {
      const saved = loadStorage<WithdrawalRequest[]>('neon_withdrawal_requests', []);
      return saved || [];
    } catch (e) {
      return [];
    }
  });

  // Deposit & Inflow Ledger (BEP-20 Blockchain Deposits + Incoming P2P Transfers) - Persisted in LocalStorage
  const [depositRecords, setDepositRecords] = useState<DepositRecord[]>(() => {
    try {
      const saved = loadStorage<DepositRecord[]>('neon_deposit_records', []);
      if (saved && saved.length > 0) return saved;
      const curDepBalance = loadStorageNum('neon_deposit_balance', 0);
      if (curDepBalance > 0) {
        const now = new Date();
        const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        return [
          {
            id: `dep_seed_${Date.now()}`,
            type: 'bep20_deposit',
            amount: curDepBalance,
            txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            timestamp: `${datePart}, ${timePart}`,
            timestampMs: Date.now(),
            status: 'completed',
            network: 'BNB Smart Chain (BEP-20)'
          }
        ];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

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
    yesterdaysIncome,
    availableWithdrawal,
    isMiningActive,
    secondsRemaining,
    unclaimedYield
  ]);

  // Total Withdrawn (sum of approved withdrawals)
  const totalWithdrawn = +(withdrawalRequests.filter((r) => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0)).toFixed(2);

  // Total Cumulative Income (Total Mined + Total Referral Earned)
  const totalCumulativeIncome = +(totalRewards + referralIncome).toFixed(2);

  // Active Plan Name calculation (Tiered Threshold System: 20-49.99 = Neon Lite, 50-149.99 = Cryptera, etc.)
  const activePlanObj = getPlanForAmount(activeMiningPower, miningPlans);
  const activePlanDisplayName = (isLoggedIn && activeMiningPower > 0)
    ? (activePlanObj ? (activePlanObj.planName || activePlanObj.planNumber) : `Node $${activeMiningPower}`)
    : '';
  const activePlanName = activeMiningPower > 0
    ? (activePlanObj ? `${activePlanObj.planName || activePlanObj.planNumber} ($${activePlanObj.amount} Tier)` : `Mining Node ($${activeMiningPower} USD)`)
    : 'No Active Plan';

  // Support Tickets Queue
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

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
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

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
        const mappedUsers: AdminUserRecord[] = activeDbUsers.map((u: any) => {
          const staked = Number(u.active_mining_power) || 0;
          const depBal = Number(u.deposit_balance) || 0;
          const withBal = Number(u.withdrawable_balance) || 0;
          const available = depBal > 0 ? depBal : withBal;
          return {
            id: u.id,
            name: u.name || u.id,
            email: u.email || `${u.id.toLowerCase()}@nexora.io`,
            mobile: u.mobile || '',
            country: 'IN',
            registeredAt: u.created_at || 'Recently',
            status: (u.status as any) || 'active',
            currentPlanName: staked > 0 ? `Active Plan ($${staked})` : 'No Plan Purchased (Inactive)',
            stakedAmount: staked,
            totalMinedYield: Number(u.total_mined_yield) || 0,
            availableBalance: available,
            totalWithdrawn: Number(u.total_withdrawn) || 0,
            fundPin: '123456',
            fundPinSet: true,
            referralCode: u.referral_code || '',
            invitedBy: u.upline_code || 'DIRECT',
            directReferralsCount: 0,
            referralEarnings: Number(u.referral_balance) || 0,
            lastLogin: 'Active',
            walletAddress: '0x' + u.id
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
            totalRegisteredUsers: mappedUsers.length
          }));

          // Live sync real orders from D1 deposits
          try {
            const depRes = await nexoraApi.getAdminDeposits();
            if (depRes && depRes.success && Array.isArray(depRes.deposits)) {
              const liveOrders: AdminOrderRecord[] = depRes.deposits
                .filter((d: any) => mappedUsers.some((u) => u.id === d.user_id || u.name === d.user_name))
                .map((d: any) => ({
                  id: d.order_id,
                  orderNumber: d.order_id,
                  userId: d.user_id,
                  userName: d.user_name || d.user_id,
                  planId: `plan_${d.amount}`,
                  planName: `Node Plan ($${d.amount})`,
                  planAmount: Number(d.amount),
                  amountPaid: Number(d.amount),
                  txHash: d.tx_hash,
                  paymentMethod: 'bep20',
                  status: d.status === 'confirmed' ? 'completed' : (d.status as any),
                  createdAt: d.created_at || 'Recently'
                }));
              setAdminOrders(liveOrders);
              try {
                localStorage.setItem('neon_admin_orders', JSON.stringify(liveOrders));
              } catch (e) {}
            }
          } catch (err) {}
        }
      }
    } catch (err) {
      console.error('Failed to sync admin users from D1:', err);
    }
  }, []);

  // Live Cloudflare D1 Backend Platform Settings Synchronizer
  const fetchPlatformSettings = useCallback(async () => {
    try {
      const data = await nexoraApi.getSettings();
      if (data) {
        const vaultAddr = (data.vault_address || data.vaultWalletAddress || '').trim();
        if (vaultAddr && vaultAddr.startsWith('0x') && vaultAddr.length === 42) {
          setPlatformSettings((prev) => {
            const updated = {
              ...prev,
              vaultWalletAddress: vaultAddr,
              minDepositAmount: data.min_deposit ? parseFloat(data.min_deposit) : prev.minDepositAmount,
              minWithdrawalAmount: data.min_withdrawal ? parseFloat(data.min_withdrawal) : prev.minWithdrawalAmount,
              withdrawalFeePercent: data.withdrawal_fee_percent ? parseFloat(data.withdrawal_fee_percent) : prev.withdrawalFeePercent,
              p2pFeePercent: data.p2p_fee_percent ? parseFloat(data.p2p_fee_percent) : prev.p2pFeePercent
            };
            try {
              localStorage.setItem('neon_platform_settings', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      }
    } catch (err) {
      console.warn('[App] Failed to sync platform settings from D1:', err);
    }
  }, []);

  // Live Cloudflare D1 Backend Data Synchronization
  useEffect(() => {
    // 1. Initial fetch & periodic background polling every 12 seconds
    fetchLiveAdminUsers();
    fetchPlatformSettings();
    const syncInterval = setInterval(() => {
      fetchLiveAdminUsers();
      fetchPlatformSettings();
    }, 12000);
    return () => clearInterval(syncInterval);
  }, [fetchLiveAdminUsers, fetchPlatformSettings]);

  // Helper to perform full clean session logout
  const performLogout = useCallback((reasonMessage?: string) => {
    localStorage.removeItem('neon_is_logged_in');
    localStorage.removeItem('neon_user_name');
    localStorage.removeItem('neon_user_mobile');
    localStorage.removeItem('neon_user_email');
    localStorage.removeItem('neon_fund_password');
    localStorage.removeItem('neon_upline_code');
    localStorage.removeItem('neon_session_token');

    setIsLoggedIn(false);
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

    if (reasonMessage) {
      showToast(reasonMessage);
    }
  }, []);

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
          performLogout('⚠️ Session Expired: Aapka account dusre device/browser par login ho chuka hai. Yahan se logout ho gaya.');
          return;
        }

        if (res && res.success && res.user && res.wallet) {
          if (res.sessionToken && !storedToken) {
            try {
              localStorage.setItem('neon_session_token', res.sessionToken);
            } catch (e) {}
          }
          const w = res.wallet;
          const dep = Number(w.deposit_balance) || 0;
          const withdr = Number(w.withdrawable_balance) || 0;
          const ref = Number(w.referral_balance) || 0;
          const power = Number(w.active_mining_power) || 0;
          const mined = Number(w.total_mined_yield) || 0;

          // Cloudflare D1 Database is the single source of truth
          setActiveMiningPower(power);
          setDepositBalance(dep);
          setAvailableWithdrawal(withdr);
          setReferralBalance(ref);
          setReferralIncome(ref);
          if (mined > 0) setTotalRewards(mined);
          setTotalBalance(+(dep + withdr + ref).toFixed(2));
          if (res.user.email) setUserEmail(res.user.email);
          if (res.user.mobile) setUserMobile(res.user.mobile);
          if (res.user.referralCode) setUserReferralCode(res.user.referralCode);

          // FUND PIN SYNC: If DB says pin is already set, but localStorage is empty
          // (e.g. new browser/device), set a placeholder so the Create Pin modal
          // does NOT pop up on Withdraw button. The actual pin verification happens server-side.
          if (res.user.fundPinSet === true && (!userFundPassword || userFundPassword.trim().length === 0)) {
            const savedPin = localStorage.getItem('neon_fund_password') || '';
            if (!savedPin) {
              // Mark as set with placeholder so withdraw modal opens directly
              setUserFundPassword('PIN_SET_ON_SERVER');
              try {
                localStorage.setItem('neon_fund_password', 'PIN_SET_ON_SERVER');
              } catch (e) {}
            }
          }
        } else if (res && !res.success && res.message?.toLowerCase().includes('not found')) {
          // Stale / invalid session (user deleted or not in D1)
          performLogout();
        }
      } catch (e) {}
    };

    verifyAndSyncSession();

    // Fast polling: check every 3.5 seconds so if someone else signs in, this session gets kicked out immediately!
    const sessionInterval = setInterval(verifyAndSyncSession, 3500);

      // 3. Fetch real wallet history (transactions, withdrawals)
      nexoraApi.getWalletHistory(userName).then((res) => {
        if (res && res.success) {
          if (Array.isArray(res.transactions)) {
            const mappedTxs: TransactionRecord[] = res.transactions.map((t: any) => ({
              id: t.id,
              type: t.type,
              amount: Number(t.amount) || 0,
              date: t.created_at || 'Recently',
              status: t.status || 'Settled',
              txHash: t.tx_hash || t.id
            }));
            setTransactions(mappedTxs);
          }
          if (Array.isArray(res.withdrawals)) {
            const mappedWd: WithdrawalRequest[] = res.withdrawals.map((w: any) => ({
              id: w.id,
              userId: w.user_id,
              userName: userName,
              userMobile: userMobile,
              amount: Number(w.amount) || 0,
              fee: Number(w.fee) || 0,
              netAmount: Number(w.net_amount) || 0,
              walletAddress: w.wallet_address || '',
              status: w.status || 'pending',
              timestamp: w.created_at || 'Recently',
              timestampMs: Date.now(),
              txHash: w.tx_hash,
              rejectionReason: w.rejection_reason
            }));
            setWithdrawalRequests(mappedWd);
          }
        }
      }).catch(() => {});

      // 4. Fetch real referred downlines (L1 + L2 + L3) from Cloudflare D1
      nexoraApi.getDownlines(userName).then((res) => {
        if (res && res.success) {
          // Helper to map a downline record with correct level info
          const mapDownline = (d: any, lvl: 1 | 2 | 3): ReferredUserItem => {
            const power = Number(d.active_mining_power) || 0;
            const commissionRate = lvl === 1 ? 0.10 : lvl === 2 ? 0.05 : 0.02;
            return {
              id: d.id,
              name: d.name || d.id,
              mobile: d.mobile || '',
              registeredAt: d.created_at || 'Recently',
              planName: power > 0 ? `Active Node ($${power})` : 'No Plan',
              planAmount: power,
              commissionEarned: +(power * commissionRate).toFixed(2),
              status: d.status === 'active' ? 'active' : 'inactive',
              level: lvl,
              invitedBy: lvl === 1 ? 'Direct (You)' : lvl === 2 ? 'Your L1 Referral' : 'Your L2 Referral'
            };
          };

          // Use structured l1/l2/l3 from API if available, else fall back to flat list
          let allMapped: ReferredUserItem[] = [];
          if (Array.isArray(res.l1) || Array.isArray(res.l2) || Array.isArray(res.l3)) {
            const l1Mapped = (res.l1 || []).map((d: any) => mapDownline(d, 1));
            const l2Mapped = (res.l2 || []).map((d: any) => mapDownline(d, 2));
            const l3Mapped = (res.l3 || []).map((d: any) => mapDownline(d, 3));
            allMapped = [...l1Mapped, ...l2Mapped, ...l3Mapped];

            // Update team turnover for all 3 levels
            const l1Vol = l1Mapped.reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            const l2Vol = l2Mapped.reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            const l3Vol = l3Mapped.reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            setTeamTurnover((prev) => ({
              ...prev,
              downlineL1: l1Vol,
              downlineL2: l2Vol,
              downlineL3: l3Vol,
              totalVolume: prev.personalStaked + l1Vol + l2Vol + l3Vol,
              boostedRate: (prev.personalStaked + l1Vol) >= 2500 ? 2.5 : (prev.personalStaked + l1Vol) >= 1000 ? 1.5 : 1.0
            }));
          } else if (Array.isArray(res.downlines)) {
            // Fallback: use level field from API if present, else default L1
            allMapped = res.downlines.map((d: any) => mapDownline(d, (d.level === 2 ? 2 : d.level === 3 ? 3 : 1) as 1 | 2 | 3));
            const l1Vol = allMapped.filter((d: ReferredUserItem) => d.level === 1).reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            const l2Vol = allMapped.filter((d: ReferredUserItem) => d.level === 2).reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            const l3Vol = allMapped.filter((d: ReferredUserItem) => d.level === 3).reduce((s: number, d: ReferredUserItem) => s + d.planAmount, 0);
            setTeamTurnover((prev) => ({
              ...prev,
              downlineL1: l1Vol,
              downlineL2: l2Vol,
              downlineL3: l3Vol,
              totalVolume: prev.personalStaked + l1Vol + l2Vol + l3Vol,
              boostedRate: (prev.personalStaked + l1Vol) >= 2500 ? 2.5 : (prev.personalStaked + l1Vol) >= 1000 ? 1.5 : 1.0
            }));
          }

          setReferredUsers(allMapped);

          // Update referral income based on commission earned across all levels
          const totalCommission = allMapped.reduce((s: number, d: ReferredUserItem) => s + (d.commissionEarned || 0), 0);
          if (totalCommission > 0) {
            setReferralIncome((prev) => +(Math.max(prev, totalCommission)).toFixed(2));
            setReferralBalance((prev) => +(Math.max(prev, totalCommission)).toFixed(2));
            setAvailableWithdrawal((prev) => +(Math.max(prev, totalCommission)).toFixed(2));
          }
        }
      }).catch(() => {});

      return () => clearInterval(sessionInterval);
  }, [isLoggedIn, userName, showAdminPortal, performLogout]);

  // Automatically trigger promotional plan popup modal 3 seconds after opening
  useEffect(() => {
    const promoTimer = setTimeout(() => {
      setShowPromoPopup(true);
    }, 3000);
    return () => clearTimeout(promoTimer);
  }, []);

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
      if (adminParam === 'portal' || adminParam === 'true' || adminParam === '1') {
        setUserRole('superadmin');
        setShowAdminPortal(true);
      }
    }
  }, []);

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
    const dailyRate = currentPlan?.dailyRatePercent || (teamTurnover.boostedRate || 1.0);
    const cycleYield = +(stakedAmount * (dailyRate / 100)).toFixed(2);

    // 1. Credit Yield to Unclaimed Reinvestment Balance (Unlocks Re-invest!)
    setUnclaimedYield((prev) => +(prev + cycleYield).toFixed(2));
    try {
      localStorage.setItem('neon_unclaimed_yield', String(cycleYield));
    } catch (e) {}
    setTotalRewards((prev) => +(prev + cycleYield).toFixed(2));
    setYesterdaysIncome(cycleYield);

    // 2. Add Ledger Record to Transactions
    const yieldTx: TransactionRecord = {
      id: `tx_${Date.now()}_yield`,
      type: `24H Mining Cycle Complete (${dailyRate}% on $${stakedAmount} USD Node - 1% Yield Unlocked)`,
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

    // 4. CRITICAL: Stop mining immediately and turn RED!
    // Exactly 1 cycle yield has been credited to unclaimed yield.
    // If user does not tap Start Mining for days, it stays RED and NO extra yield is credited.
    setIsMiningActive(false);
    setSecondsRemaining(0);
    try {
      localStorage.setItem('neon_mining_active', 'false');
      localStorage.setItem('neon_seconds_remaining', '0');
      localStorage.removeItem('neon_mining_start_time');
      localStorage.setItem('neon_last_completed_mining_time', String(Date.now()));
    } catch (e) {}

    showToast(
      `🎉 24-Hour Mining Cycle Complete! +$${cycleYield.toFixed(2)} USD (1.0%) yield unlocked. Re-invest is now ON! Node stopped (RED).`
    );
  };

  // 24H Proof-of-Activity Engine: Mount & Offline Continuity Check
  useEffect(() => {
    if (activeMiningPower <= 0) {
      setIsMiningActive(false);
      setSecondsRemaining(0);
      return;
    }

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
        // Credit exactly ONE cycle yield, then STOP (turn RED).
        // Any subsequent inactive days earn 0 yield.
        complete24HourMiningCycle(activeMiningPower);
      }
    } else {
      setIsMiningActive(false);
      setSecondsRemaining(0);
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
    // If mining is STOPPED (RED), start 24h cycle
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

        // Notify Cloudflare API backend
        nexoraApi.toggleUserStatus(userName, 'active').catch(() => {});
        nexoraApi.startMiningCycle({ userId: userName }).catch(() => {});
      }

      showToast('🟢 Mining Node Started! Core turned GREEN. 24-Hour Proof-of-Activity running. Yield credited in 24h.');
    } else {
      // Mining is actively running - show countdown info, do NOT reset timer
      const hrs = Math.floor(secondsRemaining / 3600);
      const mins = Math.floor((secondsRemaining % 3600) / 60);
      const secs = secondsRemaining % 60;
      showToast(`⛏️ Mining is running — ${hrs}h ${mins}m ${secs}s remaining. Core is GREEN. Yield will be credited when 24h cycle finishes.`);
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
          status: 'active'
        };
        setReferredUsers((prev) => [newRefUser, ...prev]);
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

    setSelectedPlanForCheckout(null);
    setIsUpgradeModal(false);
  };

  // Transfer referral income to main wallet
  const handleTransferReferralToMainWallet = () => {
    if (referralBalance <= 0) {
      showToast('⚠️ No referral balance available to transfer!');
      return;
    }
    const transferAmt = referralBalance;
    setTotalBalance((prev) => +(prev + transferAmt).toFixed(2));
    setAvailableWithdrawal((prev) => +(prev + transferAmt).toFixed(2));
    setReferralBalance(0.0);

    const newTx: TransactionRecord = {
      id: `tx_${Date.now()}_transfer`,
      type: 'Referral Balance Transferred to Main Wallet',
      amount: transferAmt,
      date: 'Just now',
      status: 'Settled',
      txHash: '0x' + Math.random().toString(16).substring(2, 10) + '..trans'
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(`🎉 Transferred $${transferAmt.toFixed(2)} USDT from Referral Wallet to Main Wallet!`);
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
  const handleCompoundSingleDay = () => {
    if (activeMiningPower <= 0) {
      showToast('⚠️ No active plan found! Please buy a plan first.');
      return;
    }

    if (unclaimedYield <= 0) {
      showToast('🔒 Re-invest is locked! Your 1% daily yield unlocks strictly after your 24-hour mining cycle completes.');
      return;
    }

    const yieldToReinvest = unclaimedYield;
    const updatedPlanPower = +(activeMiningPower + yieldToReinvest).toFixed(2);

    setActiveMiningPower(updatedPlanPower);
    setUnclaimedYield(0);
    try {
      localStorage.setItem('neon_unclaimed_yield', '0');
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

    // CHECK FOR AUTOMATIC TIER UPGRADE ON COMPOUNDING
    const previousPlan = getPlanForAmount(activeMiningPower, miningPlans);
    const upgradedPlan = getPlanForAmount(updatedPlanPower, miningPlans);

    // Sync admin users directory with updated power and upgraded plan name
    if (userName) {
      const cleanId = userName.toUpperCase();
      const newPlanName = upgradedPlan ? `${upgradedPlan.planNumber} ($${upgradedPlan.amount} USD)` : `Active Plan ($${updatedPlanPower})`;
      setAdminUsers((prev) =>
        prev.map((u) => {
          if (u.id.toUpperCase() === cleanId || u.name.toUpperCase() === cleanId || (userMobile && u.mobile === userMobile)) {
            return {
              ...u,
              stakedAmount: updatedPlanPower,
              currentPlanName: newPlanName,
              status: 'active'
            };
          }
          return u;
        })
      );

      // Persist upgraded plan name and new hashing power directly into Cloudflare D1 database
      nexoraApi.reinvestUpgradePlan({
        userId: userName,
        newPower: updatedPlanPower,
        upgradedPlanName: newPlanName,
        yieldAmount: yieldToReinvest,
        dailyRatePercent: upgradedPlan?.dailyRatePercent || 1.0
      }).then(() => {
        fetchLiveAdminUsers();
      }).catch(() => {});
    }

    if (upgradedPlan && previousPlan && upgradedPlan.amount > previousPlan.amount) {
      showToast(
        `🚀 AUTO-UPGRADE TRIGGERED! Reinvested balance reached $${updatedPlanPower.toFixed(2)} USD! Plan automatically upgraded to ${upgradedPlan.planName} ($${upgradedPlan.amount} Tier) hashing at higher ${upgradedPlan.dailyRatePercent}% daily!`
      );
    } else {
      showToast(`🎉 Re-invested +$${yieldToReinvest.toFixed(2)} USD into plan! Active Plan Value is now $${updatedPlanPower.toFixed(2)} USD (${previousPlan?.planName || 'Active Node'}).`);
    }
  };

  // Send today's completed 24h interest to Wallet for Withdrawal
  const handleClaimInterestToWallet = () => {
    if (activeMiningPower <= 0) {
      showToast('⚠️ No active plan found! Please purchase a plan first.');
      return;
    }

    if (unclaimedYield <= 0) {
      showToast('🔒 Yield is locked! Your 1% daily interest unlocks strictly after your 24-hour mining cycle completes.');
      return;
    }

    const yieldToSend = unclaimedYield;

    setAvailableWithdrawal((prev) => +(prev + yieldToSend).toFixed(2));
    setTotalBalance((prev) => +(prev + yieldToSend).toFixed(2));
    setUnclaimedYield(0);
    try {
      localStorage.setItem('neon_unclaimed_yield', '0');
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

    showToast(`💰 Sent +$${yieldToSend.toFixed(2)} USDT to Wallet! Now available in Wallet for immediate withdrawal.`);
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
    setDepositBalance((prev) => +(prev + amount).toFixed(2));
    setTotalBalance((prev) => +(prev + amount).toFixed(2));

    const finalTxHash = txHash || ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    const finalOrderId = orderId || `DEP-BSC-${Date.now()}`;
    const formattedTimestamp = getFormattedTimestamp();

    // 0. Deposit Records Ledger for Deposit History Modal
    const newDepRecord: DepositRecord = {
      id: `dep_${Date.now()}`,
      type: 'bep20_deposit',
      amount: amount,
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
      amount: amount,
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
        planAmount: amount,
        paymentType: 'new_purchase',
        amountPaid: amount,
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
        totalPlatformRevenue: +(prev.totalPlatformRevenue + amount).toFixed(2),
        platformNetReserves: +(prev.platformNetReserves + amount).toFixed(2)
      }));

      // 4. Update Current User Record in Admin Users Table
      setAdminUsers((prev) =>
        prev.map((u) => {
          if (u.id.toUpperCase() === userName.toUpperCase() || u.name.toUpperCase() === userName.toUpperCase()) {
            return {
              ...u,
              availableBalance: +(u.availableBalance + amount).toFixed(2)
            };
          }
          return u;
        })
      );
    }

    // 5. Synchronize deposit balance & order directly with Cloudflare D1 backend
    if (userName && !isTestAccount(userName, userName, userEmail)) {
      const cleanUserId = userName.toUpperCase();
      const newDepBal = +(depositBalance + amount).toFixed(2);
      saveUserSavedData(cleanUserId, {
        depositBalance: newDepBal,
        totalBalance: +(newDepBal + availableWithdrawal).toFixed(2)
      });

      // Use the atomic claim-deposit endpoint — this handles deposit_balance credit,
      // transaction record, and anti-replay in one shot. Do NOT call adjustUserBalance
      // separately — that causes duplicate balance credits.
      nexoraApi.claimDepositTx({
        userId: userName,
        txHash: finalTxHash,
        amount,
        network: 'BEP-20'
      }).then(() => {
        fetchLiveAdminUsers();
      }).catch(() => {});
    }

    showToast(`✓ Received +$${amount.toFixed(2)} USDT on BNB Smart Chain! Confirmed in Deposit Balance & Admin Panel.`);
  };

  // User creates/confirms their 6-digit fund password from CreateFundPasswordModal
  const handleFundPasswordCreated = async (newPin: string) => {
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
    // User remains right on the wallet page
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
      }).catch(() => {});
    }
    showToast(`Withdrawal of ${amount.toFixed(2)} USDT submitted! Sent to Admin queue for on-chain release.`);
  };

  // Admin approves withdrawal
  const handleApproveWithdrawal = async (id: string, customTxHash?: string) => {
    const req = withdrawalRequests.find((r) => r.id === id);
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

    const newTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      type: 'BEP-20 Withdrawal Approved',
      amount: -req.amount,
      date: getFormattedTimestamp(),
      status: 'Settled',
      txHash: finalTx
    };
    setTransactions((prev) => [newTx, ...prev]);

    showToast(`✓ Approved withdrawal of ${req.amount.toFixed(2)} USDT for ${req.userName}! Reference: ${finalTx.slice(0, 10)}...`);
  };

  // Admin rejects withdrawal
  const handleRejectWithdrawal = async (id: string, reason: string) => {
    const req = withdrawalRequests.find((r) => r.id === id);
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

    // Refund back to available withdrawal
    setAvailableWithdrawal((prev) => +(prev + req.amount).toFixed(2));
    setTotalBalance((prev) => +(prev + req.amount).toFixed(2));

    // Deduct from pending telemetry
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
          setTotalBalance(+(Number(w.deposit_balance || 0) + Number(w.withdrawable_balance || 0) + Number(w.referral_balance || 0)).toFixed(2));
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

  // Admin resets Fund PIN
  const handleResetUserFundPin = (ticketId: string, uName: string, newPin: string) => {
    setUserFundPassword(newPin);
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
    setAdminUsers((prev) =>
      prev.map((u) => (u.name.includes(uName) || u.id === uName ? { ...u, fundPin: newPin, fundPinSet: true } : u))
    );
    showToast(`✓ Fund PIN for ${uName} reset to "${newPin}"!`);
  };

  // Admin quick resets any user's PIN from directory
  const handleQuickResetUserPin = (userId: string, newPin: string) => {
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, fundPin: newPin, fundPinSet: true } : u))
    );
    if (userId === userName) {
      setUserFundPassword(newPin);
    }
    showToast(`✓ Reset PIN for ${userId} to ${newPin}`);
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

    if (Object.keys(payload).length > 0) {
      try {
        const res = await nexoraApi.updatePlatformSettings(payload, 'master');
        if (res && res.success) {
          showToast('✓ Platform rules & vault address updated live across all users!');
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
  const handleAddSubAdmin = (newAdmin: SubAdminUser) => {
    setSubAdmins((prev) => {
      const updated = [...prev, newAdmin];
      try {
        localStorage.setItem('neon_sub_admins', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`✓ Sub-Admin "${newAdmin.name}" authorized.`);
  };

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
    ownReferralCode?: string
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

    // Refresh real D1 admin users immediately
    fetchLiveAdminUsers();

    // 1. RESTORE FROM USER'S PERSISTED PROFILE:
    const savedData = loadUserSavedData(cleanId);

    const activePower = (savedData?.activeMiningPower && savedData.activeMiningPower > 0)
      ? savedData.activeMiningPower
      : (existing?.stakedAmount || 0);

    const depBal = (savedData?.depositBalance !== undefined && savedData.depositBalance > 0)
      ? savedData.depositBalance
      : (existing?.availableBalance || 0);

    const withBal = savedData?.availableWithdrawal || 0;

    if (activePower > 0) {
      setActiveMiningPower(activePower);
    }
    if (depBal > 0) {
      setDepositBalance(depBal);
    }
    if (withBal > 0) {
      setAvailableWithdrawal(withBal);
    }
    setTotalBalance(+(depBal + withBal).toFixed(2));

    if (savedData?.totalRewards) setTotalRewards(savedData.totalRewards);
    if (savedData?.referralIncome) setReferralIncome(savedData.referralIncome);
    if (savedData?.referralBalance) setReferralBalance(savedData.referralBalance);
    if (savedData?.transactions && savedData.transactions.length > 0) {
      setTransactions(savedData.transactions);
    }
    if (savedData?.depositRecords && savedData.depositRecords.length > 0) {
      setDepositRecords(savedData.depositRecords);
    }

    // 2. RESTORE / INITIALIZE FUND PASSWORD (PIN) PER USER:
    const userPin = savedData?.fundPin || (existing?.fundPinSet ? existing?.fundPin : '') || '';
    setUserFundPassword(userPin);
    try {
      if (userPin) {
        localStorage.setItem('neon_fund_password', userPin);
      } else {
        localStorage.removeItem('neon_fund_password');
      }
    } catch (e) {}

    // 2. RESTORE 24H MINING CONTINUITY:
    const miningActive = savedData?.isMiningActive ?? false;
    const miningStart = savedData?.miningStartTime ?? 0;

    if (miningActive && miningStart > 0) {
      const elapsed = Math.floor((Date.now() - miningStart) / 1000);
      const CYCLE_DURATION = 24 * 3600;
      if (elapsed < CYCLE_DURATION) {
        setIsMiningActive(true);
        const rem = CYCLE_DURATION - elapsed;
        setSecondsRemaining(rem);
        try {
          localStorage.setItem('neon_mining_active', 'true');
          localStorage.setItem('neon_mining_start_time', String(miningStart));
          localStorage.setItem('neon_seconds_remaining', String(rem));
        } catch (e) {}
      } else {
        // Mining cycle finished while user was logged out! Credit yield
        complete24HourMiningCycle(activePower);
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

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-start text-[#F8FAFC]">
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
          onOpenAdminPortal={() => setShowAdminPortal(true)}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onLoginClick={() => {
            if (isLoggedIn) {
              handleLogout();
            } else {
              setIsSignUpMode(false);
              setShowAuthModal(true);
            }
          }}
          onNavigateHome={() => navigateTo('home')}
        />

        {/* Rolling Blockchain Live Ticker */}
        <BlockchainLiveTicker blockNumber={blockNumber} />

        {/* ================= TRUE DEDICATED SCREEN ROUTING ================= */}
        <div className="flex-1 pb-24 lg:pb-12 pt-2 lg:pt-4 px-0 lg:px-4">
          {/* SCREEN 1: HOME */}
          <div className={activeRoute === 'home' ? 'space-y-5 animate-fadeIn' : 'hidden'}>
              <FuturisticHeroSection
                isMiningActive={isVisualMiningActive}
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
                  else if (sec === 'Referral') navigateTo('referral');
                  else if (sec === 'Dashboard') navigateTo('dashboard');
                  else if (sec === 'FAQ') navigateTo('faq');
                  else if (sec === 'Contact') navigateTo('contact');
                  else if (sec === 'About Neon') navigateTo('about');
                  else navigateTo('home');
                }} 
                onOpenAdminPortal={() => {
                  setUserRole('superadmin');
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
                activePlanDailyRate={teamTurnover.boostedRate}
                isMiningActive={isMiningActive}
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
              />
            )}
          </div>

          {/* SCREEN 5: WALLET & WITHDRAW */}
          <div className={activeRoute === 'wallet' ? 'space-y-5 animate-fadeIn px-3.5 lg:px-0' : 'hidden'}>
              {!isLoggedIn ? (
                renderAuthBarrier(
                  'BEP-20 Wallet & Treasury Locked',
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
                            if (!userFundPassword || userFundPassword.trim().length === 0) {
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
                          {withdrawalRequests.length > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] text-[9px] font-mono font-bold shrink-0">
                              {withdrawalRequests.length}
                            </span>
                          )}
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
                        <span className="text-[10px] text-[#94A3B8]">Mined: ${totalRewards.toFixed(0)}</span>
                        <span className="text-[10px] text-[#10B981] font-mono font-bold">Ref: ${referralIncome.toFixed(0)}</span>
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

                    {/* Box 4: Total Referral Income / Affiliate Downline Commissions */}
                    <div className="p-4 rounded-2xl bg-[#081220] border border-[#10B981]/40 shadow-md hover:border-[#10B981]/70 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          Referral Income
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
                          <Gift className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] lg:text-[22px] font-black text-[#10B981] font-mono">
                          ${referralIncome.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#10B981]">USDT</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#122034]">
                        <span className="text-[10px] text-[#94A3B8]">3 Levels</span>
                        <span className="text-[10px] text-[#10B981] font-mono font-bold">Commission</span>
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
                                      <span className={tx.amount > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                                        {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} USDT
                                      </span>
                                    </td>
                                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          tx.status.toLowerCase().includes('settled') || tx.status.toLowerCase().includes('approved')
                                            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
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

          {/* SCREEN 6: REFERRAL NETWORK */}
          <div className={activeRoute === 'referral' ? 'space-y-4 animate-fadeIn' : 'hidden'}>
            {!isLoggedIn ? (
              renderAuthBarrier(
                'Referral Network Locked',
                'Please sign in to generate your affiliate link, view multi-tier downline structure, track team turnover, and collect referral rewards.',
                'Affiliate Portal'
              )
            ) : (
              <ReferralNetworkSection
                referralLink={`${typeof window !== 'undefined' ? window.location.origin : 'https://nexora-mining.pages.dev'}?ref=${(userReferralCode || userName).toUpperCase()}`}
                isAccountActive={activeMiningPower > 0}
                onCopyReferral={() => {
                  const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://nexora-mining.pages.dev'}?ref=${(userReferralCode || userName).toUpperCase()}`;
                  navigator.clipboard?.writeText(link);
                  showToast('✓ Referral link copied to clipboard!');
                }}
                referralIncome={referralIncome}
                referredUsers={referredUsers}
              />
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
          onOpenAdminPortal={() => {
            setIsDrawerOpen(false);
            setUserRole('superadmin');
            setShowAdminPortal(true);
          }}
          currentLang={currentLang}
          onSelectLang={(lang) => {
            setCurrentLang(lang);
            applyLanguageChange(lang);
            showToast(`Language switched to: ${lang.toUpperCase()}`);
          }}
        />

        {/* Multi-Step Realistic Plan Checkout Wizard Modal */}
        <PlanCheckoutModal
          isOpen={!!selectedPlanForCheckout}
          plan={selectedPlanForCheckout}
          isUpgrade={isUpgradeModal}
          activeMiningPower={activeMiningPower}
          diffAmount={upgradeDiffAmount}
          availableBalance={+(depositBalance + availableWithdrawal).toFixed(2)}
          vaultWalletAddress={platformSettings?.vaultWalletAddress || '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'}
          userId={userName}
          fundPin={userFundPassword}
          onDismiss={() => setSelectedPlanForCheckout(null)}
          onNavigateToDashboard={() => {
            setSelectedPlanForCheckout(null);
            navigateTo('dashboard');
          }}
          onConfirmSuccess={handleCheckoutSuccess}
        />

        {/* Demo Deposit Dialog */}
        <DepositDemoDialog
          isOpen={showDepositDialog}
          onDismiss={() => setShowDepositDialog(false)}
          onDepositConfirmed={handleDepositConfirmed}
          vaultWalletAddress={platformSettings?.vaultWalletAddress || '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'}
          userId={userName}
        />

        {/* P2P Member Transfer Modal */}
        <P2PTransferModal
          isOpen={showP2PTransferModal}
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
          isOpen={showWithdrawalHistoryModal}
          onDismiss={() => setShowWithdrawalHistoryModal(false)}
          withdrawalRequests={withdrawalRequests}
          onRequestNewWithdrawal={() => {
            setShowWithdrawalHistoryModal(false);
            if (!userFundPassword || userFundPassword.trim().length === 0) {
              setShowCreateFundPasswordModal(true);
            } else {
              setShowWithdrawalModal(true);
            }
          }}
        />

        {/* Dedicated 6-Digit Create Fund Password Modal */}
        <CreateFundPasswordModal
          isOpen={showCreateFundPasswordModal}
          onDismiss={() => setShowCreateFundPasswordModal(false)}
          onSuccess={handleFundPasswordCreated}
        />

        {/* Dedicated Withdrawal Popup Modal Window */}
        {showWithdrawalModal && (
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
          isOpen={showDepositHistoryModal}
          onDismiss={() => setShowDepositHistoryModal(false)}
          depositRecords={depositRecords}
          onOpenDepositDialog={() => setShowDepositDialog(true)}
        />

        {/* Legal Policies Suite Modal */}
        <LegalPolicyModal
          isOpen={showLegalModal}
          initialTab={activeLegalTab}
          onDismiss={() => setShowLegalModal(false)}
        />

        {/* Enterprise Full-System Admin Portal */}
        {showAdminPortal && (
          <AdminSystemPortal
            isOpen={showAdminPortal}
            currentRole={userRole}
            withdrawalRequests={withdrawalRequests}
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
              setYesterdaysIncome(0);
              setAvailableWithdrawal(0);
              setIsMiningActive(false);
              setSecondsRemaining(24 * 3600);
              setSimulatedUsersCount(18429);
              setTeamTurnover({ personalStaked: 0, downlineL1: 0, downlineL2: 0, downlineL3: 0, totalVolume: 0, boostedRate: 1.0 });
              setMiningPlans(MINING_PLANS);
              showToast('✓ All platform data reset to clean zero (0) for fresh testing!');
            }}
            onClose={() => {
              setShowAdminPortal(false);
              window.history.replaceState({ route: 'home' }, '', '#home');
              setActiveRoute('home');
            }}
          />
        )}

        {/* Floating AI Mining Assistant Widget with Emergency Ticket Escalation */}
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
        />

        {/* Auth Modal with Mobile + Country Flag + Random Username + Google Auth */}
        <AuthModalDialog
          isOpen={showAuthModal}
          isSignUp={isSignUpMode}
          initialReferralCode={preFilledRefCode}
          onDismiss={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          onSwitchAuthMode={() => setIsSignUpMode(!isSignUpMode)}
        />

        {/* 3-Second Welcome Promotional Mining Plans Showcase Popup Modal */}
        <PromotionalPlanPopupModal
          isOpen={showPromoPopup && (platformSettings?.popupEnabled !== false)}
          onDismiss={() => setShowPromoPopup(false)}
          onSelectPlan={(plan) => {
            setShowPromoPopup(false);
            handleSelectPlan(plan);
          }}
          onViewAllPlans={() => {
            setShowPromoPopup(false);
            navigateTo('plans');
          }}
          adminPopupImageUrl={platformSettings?.popupImageUrl || ''}
          adminPopupLinkUrl={platformSettings?.popupLinkUrl || ''}
          miningPlans={miningPlans}
        />

        {/* Global Toast Notification */}
        <ToastNotification message={toastMessage} onDismiss={() => setToastMessage(null)} />
      </main>
    </div>
  );
};

export default App;
