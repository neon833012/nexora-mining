import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserPlus,
  Users,
  Clock,
  KeyRound,
  Coins,
  Lock,
  ArrowUpRight,
  Copy,
  Link2,
  Settings,
  Sparkles,
  LayoutDashboard,
  Layers,
  Cpu,
  Landmark,
  Headphones,
  Sliders,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ArrowDownRight,
  Activity,
  UserX,
  UserCheck,
  RefreshCw,
  LogOut,
  ChevronDown,
  DollarSign,
  AlertCircle,
  Hash,
  Database,
  Plus,
  Edit3,
  Trash2,
  Save,
  Menu,
  X,
  Radio,
  Eye,
  EyeOff,
  Check,
  MessageSquare,
  Bot,
  User,
  Send,
  Wallet
} from 'lucide-react';
import {
  UserRole,
  WithdrawalRequest,
  SupportTicket,
  SubAdminUser,
  AdminUserRecord,
  AdminOrderRecord,
  AdminTelemetry,
  PlatformSettings,
  MiningPlan,
  LiveChatSession,
  ChatMessage
} from '../types/mining';
import { MINING_PLANS } from '../data/miningPlans';

interface Props {
  isOpen: boolean;
  currentRole: UserRole;
  withdrawalRequests: WithdrawalRequest[];
  supportTickets: SupportTicket[];
  subAdmins: SubAdminUser[];
  adminUsers: AdminUserRecord[];
  adminOrders: AdminOrderRecord[];
  telemetry: AdminTelemetry;
  platformSettings: PlatformSettings;
  activeUsersCount: number;
  miningPlans?: MiningPlan[];
  onUpdateMiningPlans?: (plans: MiningPlan[]) => void;
  onSelectRole: (role: UserRole) => void;
  onApproveWithdrawal: (id: string, txHash?: string) => void;
  onRejectWithdrawal: (id: string, reason: string) => void;
  onResetUserFundPin: (ticketId: string, userName: string, newPin: string) => void;
  onQuickResetUserPin: (userId: string, newPin: string) => void;
  onToggleUserStatus: (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => void;
  onAddSubAdmin: (admin: SubAdminUser) => void;
  onDeleteSubAdmin?: (id: string) => void;
  onUpdatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
  onResetAllData?: () => void;
  onDeleteUser?: (userId: string) => void;
  onPurgeInactiveUsers?: () => void;
  onClearAllUsers?: () => void;
  onRefreshMiners?: () => void;
  onClose: () => void;
}

type AdminTab =
  | 'overview'
  | 'users'
  | 'plans'
  | 'mining'
  | 'withdrawals'
  | 'treasury'
  | 'support'
  | 'subadmins'
  | 'settings';

export const AdminSystemPortal: React.FC<Props> = ({
  isOpen,
  currentRole,
  withdrawalRequests = [],
  supportTickets = [],
  subAdmins = [],
  adminUsers = [],
  adminOrders = [],
  telemetry,
  platformSettings,
  activeUsersCount,
  miningPlans = MINING_PLANS,
  onUpdateMiningPlans,
  onSelectRole,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onResetUserFundPin,
  onQuickResetUserPin,
  onToggleUserStatus,
  onRefreshMiners,
  onAddSubAdmin,
  onDeleteSubAdmin,
  onUpdatePlatformSettings,
  onResetAllData,
  onDeleteUser,
  onPurgeInactiveUsers,
  onClearAllUsers,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Secure Admin Authentication Gate State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('neon_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [authenticatedRole, setAuthenticatedRole] = useState<'superadmin' | 'subadmin'>(() => {
    try {
      const stored = sessionStorage.getItem('neon_admin_role');
      if (stored === 'subadmin') return 'subadmin';
      if (stored === 'superadmin') return 'superadmin';
    } catch {}
    return currentRole === 'subadmin' ? 'subadmin' : 'superadmin';
  });
  const [authenticatedName, setAuthenticatedName] = useState<string>(() => {
    try {
      return sessionStorage.getItem('neon_admin_name') || 'Master Super Admin';
    } catch {
      return 'Master Super Admin';
    }
  });

  const isSuperadmin = authenticatedRole === 'superadmin';
  const isSubadmin = authenticatedRole === 'subadmin';

  const [adminLoginId, setAdminLoginId] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsAuthenticating(true);

    setTimeout(() => {
      const cleanId = adminLoginId.trim().toLowerCase();
      const enteredPassword = adminLoginPassword.trim();

      // 1. Super Admin Credentials Check (Strict Single Production Admin)
      const currentAdminPass = localStorage.getItem('neon_custom_admin_password') || 'admin123456';
      const isSuperAdminMatch = (cleanId === 'admin' || cleanId === 'superadmin') && enteredPassword === currentAdminPass;

      // 2. Provisioned Staff Sub-Admin Check (Created only by Super Admin in Staff RBAC)
      const matchedDelegated = subAdmins.find(
        (sa) =>
          (sa.username && sa.username.toLowerCase() === cleanId) ||
          (sa.email && sa.email.toLowerCase() === cleanId)
      );
      const isDelegatedSubMatch =
        Boolean(matchedDelegated && matchedDelegated.password && matchedDelegated.password === enteredPassword);

      if (isSuperAdminMatch) {
        try {
          sessionStorage.setItem('neon_admin_auth', 'true');
          sessionStorage.setItem('neon_admin_role', 'superadmin');
          sessionStorage.setItem('neon_admin_name', 'Master Super Admin');
        } catch (err) {}
        setAuthenticatedRole('superadmin');
        setAuthenticatedName('Master Super Admin');
        setIsAdminAuthenticated(true);
        setIsAuthenticating(false);
        onSelectRole('superadmin');
        setActionNotice('✓ Authenticated as Super Admin (Full Control)');
        setTimeout(() => setActionNotice(null), 4000);
        return;
      }

      if (isDelegatedSubMatch) {
        const staffName = matchedDelegated?.name || 'Staff Sub-Admin';
        try {
          sessionStorage.setItem('neon_admin_auth', 'true');
          sessionStorage.setItem('neon_admin_role', 'subadmin');
          sessionStorage.setItem('neon_admin_name', staffName);
        } catch (err) {}
        setAuthenticatedRole('subadmin');
        setAuthenticatedName(staffName);
        setIsAdminAuthenticated(true);
        setIsAuthenticating(false);
        onSelectRole('subadmin');
        setActionNotice(`✓ Authenticated as Sub-Admin (${staffName}) - Audit & Read-Only Mode`);
        setTimeout(() => setActionNotice(null), 4000);
        return;
      }

      setAdminLoginError('Invalid ID or Password. Verify your credentials or ask Super Admin.');
      setIsAuthenticating(false);
    }, 450);
  };



  const handleAdminSignOut = () => {
    try {
      sessionStorage.removeItem('neon_admin_auth');
      sessionStorage.removeItem('neon_admin_role');
      sessionStorage.removeItem('neon_admin_name');
    } catch (err) {}
    setIsAdminAuthenticated(false);
    setAdminLoginPassword('');
    setAdminLoginError(null);
    if (onClose) onClose();
  };

  // Mining Plans Governance State
  const currentPlans = miningPlans || MINING_PLANS;
  const [editingPlan, setEditingPlan] = useState<MiningPlan | null>(null);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [planSuccessNotice, setPlanSuccessNotice] = useState<string | null>(null);

  // New Plan form state
  const [newPlanNumber, setNewPlanNumber] = useState('PLAN 08');
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanAmount, setNewPlanAmount] = useState<number>(500);
  const [newPlanRate, setNewPlanRate] = useState<number>(1.4);
  const [newPlanDuration, setNewPlanDuration] = useState<number>(365);
  const [newPlanComingSoon, setNewPlanComingSoon] = useState<boolean>(false);
  const [newPlanIsElite, setNewPlanIsElite] = useState<boolean>(false);

  const computePlanMath = (amount: number, dailyRatePercent: number, days: number = 365) => {
    const r = (Number(dailyRatePercent) || 0) / 100;
    const a = Number(amount) || 0;
    const d = Number(days) || 365;
    const simple = +(a * r * d).toFixed(2);
    const compound = +(a * Math.pow(1 + r, d)).toFixed(2);
    const finalDaily = +(compound * r).toFixed(2);
    const advantage = +(compound - simple).toFixed(2);
    return { simple, compound, finalDaily, advantage };
  };

  const handleToggleComingSoon = (planId: string) => {
    if (!onUpdateMiningPlans) return;
    const updated = currentPlans.map((p) =>
      p.id === planId ? { ...p, isComingSoon: !p.isComingSoon } : p
    );
    onUpdateMiningPlans(updated);
    setPlanSuccessNotice(`✓ Updated Coming Soon status for ${planId}!`);
    setTimeout(() => setPlanSuccessNotice(null), 3000);
  };

  const handleSaveEditPlan = () => {
    if (!editingPlan || !onUpdateMiningPlans) return;
    const math = computePlanMath(editingPlan.amount, editingPlan.dailyRatePercent, editingPlan.durationDays || 365);
    const updatedPlan: MiningPlan = {
      ...editingPlan,
      simpleTotalNoReinvest: math.simple,
      dailyReinvestTotalCompound: math.compound,
      day365FinalDailyYield: math.finalDaily,
      totalAdvantage: math.advantage
    };
    const updated = currentPlans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
    onUpdateMiningPlans(updated);
    setEditingPlan(null);
    setPlanSuccessNotice(`✓ Successfully updated plan ${updatedPlan.planName} ($${updatedPlan.amount})!`);
    setTimeout(() => setPlanSuccessNotice(null), 3000);
  };

  const handleCreateNewPlan = () => {
    if (!onUpdateMiningPlans || !newPlanName || newPlanAmount <= 0) return;
    const math = computePlanMath(newPlanAmount, newPlanRate, newPlanDuration);
    const newPlan: MiningPlan = {
      id: `plan_${Date.now()}`,
      planNumber: newPlanNumber,
      planName: newPlanName,
      amount: newPlanAmount,
      dailyRatePercent: newPlanRate,
      durationDays: newPlanDuration,
      compoundingAvailable: true,
      simpleTotalNoReinvest: math.simple,
      dailyReinvestTotalCompound: math.compound,
      day365FinalDailyYield: math.finalDaily,
      totalAdvantage: math.advantage,
      isComingSoon: newPlanComingSoon,
      isElite: newPlanIsElite
    };
    onUpdateMiningPlans([...currentPlans, newPlan]);
    setIsAddPlanModalOpen(false);
    setNewPlanName('');
    setNewPlanAmount(500);
    setNewPlanRate(1.4);
    setPlanSuccessNotice(`✓ Successfully added new plan ${newPlan.planName} ($${newPlan.amount})!`);
    setTimeout(() => setPlanSuccessNotice(null), 3000);
  };

  const handleDeletePlan = (planId: string) => {
    if (!onUpdateMiningPlans) return;
    const pToDelete = currentPlans.find((p) => p.id === planId);
    const name = pToDelete ? pToDelete.planName : planId;
    const updated = currentPlans.filter((p) => p.id !== planId);
    onUpdateMiningPlans(updated);
    setPlanSuccessNotice(`✓ Plan ${name} removed from platform!`);
    setTimeout(() => setPlanSuccessNotice(null), 3000);
  };

  const handleResetPlans = () => {
    if (!onUpdateMiningPlans) return;
    onUpdateMiningPlans(MINING_PLANS);
    setPlanSuccessNotice(`✓ Plans reset to standard default!`);
    setTimeout(() => setPlanSuccessNotice(null), 3000);
  };

  // Sub-admin creation state
  const [newSubAdminName, setNewSubAdminName] = useState('');
  const [newSubAdminEmail, setNewSubAdminEmail] = useState('');
  const [newSubAdminUsername, setNewSubAdminUsername] = useState('');
  const [newSubAdminPassword, setNewSubAdminPassword] = useState('');
  const [canApprove, setCanApprove] = useState(false);
  const [canResetPin, setCanResetPin] = useState(false);
  const [maxLimit, setMaxLimit] = useState(0);

  // Rejection prompt state
  const [rejectPromptId, setRejectPromptId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Security audit pending');

  // Copy link feedback
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // User search & filters
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserRecord | null>(null);
  const [isRefreshingMiners, setIsRefreshingMiners] = useState(false);

  // Auto-refresh miners from live D1 database when switching to Users tab
  useEffect(() => {
    if (activeTab === 'users' && onRefreshMiners) {
      onRefreshMiners();
    }
  }, [activeTab, onRefreshMiners]);

  // Real-Time Institutional Live Clock for Liability Desk
  const [livePortalTime, setLivePortalTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLivePortalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe fallbacks for platformSettings and telemetry
  const safeSettings: PlatformSettings = platformSettings || {
    minWithdrawalAmount: 2.0,
    withdrawalFeePercent: 5.0,
    minersGrowthRatePerMin: 10,
    cycleDurationHours: 24,
    maintenanceMode: false,
    emergencyBroadcast: 'NEON MINING Enterprise Hash Engine v4.2 Running Normally. Zero Latency.'
  };

  // DYNAMIC CALCULATIONS - STRICTLY DERIVED FROM REAL CLOUDFLARE D1 DATA
  // If zero registered users exist, orders and inflow MUST be strictly empty []
  const safeAdminOrders = useMemo(() => {
    if (!adminUsers || adminUsers.length === 0) return [];
    return (adminOrders || []).filter((o) =>
      adminUsers.some((u) => u.id === o.userId || u.name === o.userName)
    );
  }, [adminOrders, adminUsers]);

  const dynamicInflow = useMemo(() => {
    return safeAdminOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  }, [safeAdminOrders]);

  const dynamicStaked = useMemo(() => {
    return (adminUsers || []).reduce((sum, u) => sum + (u.stakedAmount || 0), 0);
  }, [adminUsers]);

  const dynamicMined = useMemo(() => {
    return (adminUsers || []).reduce((sum, u) => sum + (u.totalMinedYield || 0), 0);
  }, [adminUsers]);

  // If zero registered users exist, withdrawal requests MUST be strictly empty []
  const safeWithdrawalRequests = useMemo(() => {
    if (!adminUsers || adminUsers.length === 0) return [];
    return (withdrawalRequests || []).filter((r) =>
      adminUsers.some((u) => u.id === r.userId || u.name === r.userName)
    );
  }, [adminUsers, withdrawalRequests]);

  const approvedWithdrawals = useMemo(() => {
    return safeWithdrawalRequests.filter((r) => r.status === 'approved');
  }, [safeWithdrawalRequests]);

  const pendingWithdrawals = useMemo(() => {
    return safeWithdrawalRequests.filter((r) => r.status === 'pending');
  }, [safeWithdrawalRequests]);

  const rejectedWithdrawals = useMemo(() => {
    return safeWithdrawalRequests.filter((r) => r.status === 'rejected');
  }, [safeWithdrawalRequests]);

  const dynamicApprovedWithdrawalsAmount = useMemo(() => {
    return approvedWithdrawals.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [approvedWithdrawals]);

  const dynamicPendingWithdrawalsAmount = useMemo(() => {
    return pendingWithdrawals.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [pendingWithdrawals]);

  const dynamicFees = useMemo(() => {
    return approvedWithdrawals.reduce((sum, r) => sum + (r.fee || 0), 0);
  }, [approvedWithdrawals]);

  const dynamicReserves = useMemo(() => {
    return Math.max(0, dynamicInflow - dynamicApprovedWithdrawalsAmount);
  }, [dynamicInflow, dynamicApprovedWithdrawalsAmount]);

  const dynamicActiveMinersCount = useMemo(() => {
    return (adminUsers || []).filter((u) => (u.stakedAmount || 0) > 0).length;
  }, [adminUsers]);

  const dynamicHashrate = useMemo(() => {
    return dynamicStaked > 0 ? (dynamicStaked * 0.85).toFixed(2) : '0.00';
  }, [dynamicStaked]);

  // Settings form state
  const [editMinWithdrawal, setEditMinWithdrawal] = useState(safeSettings.minWithdrawalAmount);
  const [editFeePercent, setEditFeePercent] = useState(safeSettings.withdrawalFeePercent);
  const [editVaultWalletAddress, setEditVaultWalletAddress] = useState(
    safeSettings.vaultWalletAddress || '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'
  );

  const [isEditingVault, setIsEditingVault] = useState(false);

  useEffect(() => {
    if (safeSettings.vaultWalletAddress && !isEditingVault) {
      setEditVaultWalletAddress(safeSettings.vaultWalletAddress);
    }
  }, [safeSettings.vaultWalletAddress, isEditingVault]);

  // Popup management state
  const [popupEnabled, setPopupEnabled] = useState(safeSettings.popupEnabled !== false);
  const [popupImageUrl, setPopupImageUrl] = useState(safeSettings.popupImageUrl || '');
  const [popupLinkUrl, setPopupLinkUrl] = useState(safeSettings.popupLinkUrl || '');
  const [popupImagePreview, setPopupImagePreview] = useState(safeSettings.popupImageUrl || '');
  const [popupSaveMsg, setPopupSaveMsg] = useState('');

  // Payout Reference / Approval Modal State
  const [payoutModalReq, setPayoutModalReq] = useState<WithdrawalRequest | null>(null);
  const [payoutTxHash, setPayoutTxHash] = useState('');

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return (adminUsers || []).filter((u) => {
      const matchSearch =
        u.id.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.mobile.toLowerCase().includes(userSearch.toLowerCase());
      const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [adminUsers, userSearch, userStatusFilter]);

  // Plan Sales & Distribution Breakdown across real tiers
  const planSalesBreakdown = useMemo(() => {
    const plans = [
      { id: 'plan_20', amount: 20, name: 'Neon Lite', tier: 'PLAN 01', color: '#00F0FF' },
      { id: 'plan_50', amount: 50, name: 'Cryptera', tier: 'PLAN 02', color: '#10B981' },
      { id: 'plan_150', amount: 150, name: 'Novacore', tier: 'PLAN 03', color: '#F59E0B' },
      { id: 'plan_350', amount: 350, name: 'Hypervex', tier: 'PLAN 04', color: '#A855F7' },
      { id: 'plan_700', amount: 700, name: 'Vantamine', tier: 'PLAN 05', color: '#38BDF8' },
      { id: 'plan_1500', amount: 1500, name: 'Nexhash', tier: 'PLAN 06', color: '#EAB308' },
      { id: 'plan_3000', amount: 3000, name: 'OmegaVIP', tier: 'PLAN 07', color: '#EC4899' }
    ];

    return plans.map((p) => {
      const matchingOrders = safeAdminOrders.filter(
        (o) => o.planAmount === p.amount || o.planId === p.id || o.planName?.toLowerCase().includes(`$${p.amount}`)
      );
      const matchingUsers = (adminUsers || []).filter(
        (u) => u.stakedAmount === p.amount || u.currentPlanName?.toLowerCase().includes(`$${p.amount}`)
      );

      const soldCount = matchingOrders.length > 0 ? matchingOrders.length : matchingUsers.length;
      const totalRevenue = matchingOrders.length > 0
        ? matchingOrders.reduce((sum, o) => sum + (o.amountPaid || o.planAmount), 0)
        : matchingUsers.reduce((sum, u) => sum + (u.stakedAmount || 0), 0);

      return {
        ...p,
        soldCount,
        totalRevenue
      };
    });
  }, [safeAdminOrders, adminUsers]);

  const totalPlansSoldAcrossTiers = useMemo(() => {
    return planSalesBreakdown.reduce((sum, p) => sum + p.soldCount, 0);
  }, [planSalesBreakdown]);

  const totalRevenueAcrossTiers = useMemo(() => {
    return planSalesBreakdown.reduce((sum, p) => sum + p.totalRevenue, 0);
  }, [planSalesBreakdown]);

  // INSTITUTIONAL REAL-TIME WITHDRAWAL LIABILITY & SOLVENCY DESK CALCULATION
  // Evaluated 100% from real database state. When database is empty, everything is exactly 0.
  const liveLiabilityDesk = useMemo(() => {
    const totalUsers = adminUsers ? adminUsers.length : 0;
    const totalStakedCapital = (adminUsers || []).reduce((sum, u) => sum + (u.stakedAmount || 0), 0);
    const totalDailyMiningYield = (adminUsers || []).reduce(
      (sum, u) => sum + (u.totalMinedYield || (u.stakedAmount ? u.stakedAmount * 0.01 : 0)),
      0
    );
    const totalReferralIncome = (adminUsers || []).reduce((sum, u) => sum + (u.referralEarnings || 0), 0);
    const totalWithdrawnDone = dynamicApprovedWithdrawalsAmount;
    const totalGrossEarnings = Math.max(0, totalDailyMiningYield + totalReferralIncome - totalWithdrawnDone);

    const eligibleUsers = (adminUsers || []).filter((u) => (u.availableBalance || 0) >= safeSettings.minWithdrawalAmount);
    const eligibleCount = eligibleUsers.length;
    const accumulatingCount = Math.max(0, totalUsers - eligibleCount);
    const accumulatingSum = (adminUsers || [])
      .filter((u) => (u.availableBalance || 0) < safeSettings.minWithdrawalAmount)
      .reduce((sum, u) => sum + (u.availableBalance || 0), 0);

    const grossPayableLiability = eligibleUsers.reduce((sum, u) => sum + (u.availableBalance || 0), 0);
    const gasFeePercent = safeSettings.withdrawalFeePercent;
    const gasFeeDeducted = +(grossPayableLiability * (gasFeePercent / 100)).toFixed(2);
    const netCashoutPayable = +(grossPayableLiability - gasFeeDeducted).toFixed(2);

    const activeMinersOnly = (adminUsers || []).filter((u) => (u.stakedAmount || 0) > 0);
    const userRows = activeMinersOnly.map((u) => {
      const staked = u.stakedAmount || 0;
      const dailyYield = +(
        u.totalMinedYield !== undefined && u.totalMinedYield > 0
          ? u.totalMinedYield
          : staked * 0.01
      ).toFixed(2);
      const refIncome = +(u.referralEarnings || 0).toFixed(2);
      const refsCount = u.directReferralsCount || 0;
      const withdrawn = +(u.totalWithdrawn || 0).toFixed(2);
      const balance = +(u.availableBalance || 0).toFixed(2);
      const isEligible = balance >= safeSettings.minWithdrawalAmount;
      const payableNow = isEligible ? balance : 0.00;

      return {
        user: u,
        staked,
        planName: u.currentPlanName || (staked > 0 ? `$${staked} Node` : 'No Active Plan'),
        dailyYield,
        refIncome,
        refsCount,
        withdrawn,
        balance,
        isEligible,
        payableNow
      };
    });

    return {
      totalUsers,
      totalStakedCapital: +totalStakedCapital.toFixed(2),
      totalDailyMiningYield: +totalDailyMiningYield.toFixed(2),
      totalReferralIncome: +totalReferralIncome.toFixed(2),
      totalGrossEarnings: +totalGrossEarnings.toFixed(2),
      totalWithdrawnDone: +totalWithdrawnDone.toFixed(2),
      eligibleCount,
      accumulatingCount,
      accumulatingSum: +accumulatingSum.toFixed(2),
      grossPayableLiability: +grossPayableLiability.toFixed(2),
      gasFeePercent,
      gasFeeDeducted,
      netCashoutPayable,
      userRows
    };
  }, [adminUsers, dynamicApprovedWithdrawalsAmount, safeSettings.minWithdrawalAmount, safeSettings.withdrawalFeePercent]);

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCreateSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubAdminName || !newSubAdminEmail) return;

    const assignedUsername = (newSubAdminUsername.trim() || newSubAdminEmail.split('@')[0] || `sub_${Date.now().toString().slice(-4)}`).toLowerCase();
    const assignedPassword = newSubAdminPassword.trim() || 'subadmin123';

    const newAdmin: SubAdminUser = {
      id: `sub_${Date.now()}`,
      name: newSubAdminName.trim(),
      email: newSubAdminEmail.trim().toLowerCase(),
      username: assignedUsername,
      password: assignedPassword,
      canApproveWithdrawals: false, // strictly restricted as per user instructions
      canResetPasswords: false,
      maxApprovalLimit: 0
    };

    onAddSubAdmin(newAdmin);
    setNewSubAdminName('');
    setNewSubAdminEmail('');
    setNewSubAdminUsername('');
    setNewSubAdminPassword('');
    triggerNotice(`✓ Sub-Admin ${newAdmin.name} authorized! (ID: ${assignedUsername} / Pass: ${assignedPassword})`);
  };

  // Live Support Desk State (Escalated from NeonAIChatAssistant)
  const [liveSessions, setLiveSessions] = useState<LiveChatSession[]>(() => {
    try {
      const raw = localStorage.getItem('neon_live_chat_sessions');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'waiting' | 'active' | 'resolved'>('all');
  const [supportSubTab, setSupportSubTab] = useState<'chats' | 'pins'>('chats');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [manualResetUserId, setManualResetUserId] = useState('');
  const [manualResetNewPin, setManualResetNewPin] = useState('888888');

  // Sync sessions with localStorage and cross-window/tab events
  useEffect(() => {
    const syncSessions = () => {
      try {
        const raw = localStorage.getItem('neon_live_chat_sessions');
        if (raw) {
          setLiveSessions(JSON.parse(raw));
        }
      } catch (e) {
        console.error('Error syncing live chat sessions:', e);
      }
    };
    window.addEventListener('storage', syncSessions);
    window.addEventListener('neon_chat_sync', syncSessions);
    return () => {
      window.removeEventListener('storage', syncSessions);
      window.removeEventListener('neon_chat_sync', syncSessions);
    };
  }, []);

  const saveLiveSessions = (updated: LiveChatSession[]) => {
    setLiveSessions(updated);
    try {
      localStorage.setItem('neon_live_chat_sessions', JSON.stringify(updated));
      window.dispatchEvent(new Event('neon_chat_sync'));
    } catch (e) {
      console.error('Error saving live chat sessions:', e);
    }
  };

  const handleSendAdminReply = (session: LiveChatSession, cannedText?: string) => {
    if (isSubadmin) {
      triggerNotice('⚠️ Sub-Admins have read-only access and cannot send replies.');
      return;
    }
    const textToSend = (cannedText || adminReplyText).trim();
    if (!textToSend) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const adminMsg: ChatMessage = {
      id: `admin_msg_${Date.now()}`,
      sender: 'admin',
      senderName: isSuperadmin ? 'Super Admin / Lead Support' : 'Support Specialist',
      text: textToSend,
      timestamp: now
    };

    const updatedMessages = [...session.messages, adminMsg];
    const updatedSessions = liveSessions.map((s) => {
      if (s.id === session.id) {
        return {
          ...s,
          messages: updatedMessages,
          status: 'active_admin' as const,
          lastMessageText: `[Admin] ${textToSend}`,
          unreadAdminCount: 0,
          unreadUserCount: (s.unreadUserCount || 0) + 1,
          assignedAdminName: isSuperadmin ? 'Super Admin' : 'Support Specialist',
          updatedAt: now
        };
      }
      return s;
    });

    saveLiveSessions(updatedSessions);
    setAdminReplyText('');
    triggerNotice(`✓ Live reply sent to ${session.userName}`);
  };

  const handleResolveSession = (sessionId: string) => {
    if (isSubadmin) {
      triggerNotice('⚠️ Only Super Admin can resolve customer support tickets.');
      return;
    }
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedSessions = liveSessions.map((s) => {
      if (s.id === sessionId) {
        const resolveMsg: ChatMessage = {
          id: `sys_resolved_${Date.now()}`,
          sender: 'ai',
          text: '✅ **[ISSUE RESOLVED BY SUPPORT DESK]**\nOur admin specialist has resolved this inquiry. If you have any further questions, feel free to message our AI Copilot anytime!',
          timestamp: now
        };
        return {
          ...s,
          status: 'resolved' as const,
          messages: [...s.messages, resolveMsg],
          lastMessageText: '[Resolved by Admin]',
          updatedAt: now
        };
      }
      return s;
    });

    saveLiveSessions(updatedSessions);
    triggerNotice('✓ Support conversation marked as resolved');
  };

  const waitingChatsCount = useMemo(() => {
    return liveSessions.filter((s) => s.status === 'waiting_admin').length;
  }, [liveSessions]);

  const activeChatsCount = useMemo(() => {
    return liveSessions.filter((s) => s.status === 'active_admin').length;
  }, [liveSessions]);

  const resolvedChatsCount = useMemo(() => {
    return liveSessions.filter((s) => s.status === 'resolved').length;
  }, [liveSessions]);

  const filteredSessions = useMemo(() => {
    return liveSessions.filter((s) => {
      const matchesFilter =
        sessionFilter === 'all' ? true :
        sessionFilter === 'waiting' ? s.status === 'waiting_admin' :
        sessionFilter === 'active' ? s.status === 'active_admin' :
        s.status === 'resolved';

      const q = chatSearchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        s.userName.toLowerCase().includes(q) ||
        (s.userMobile && s.userMobile.toLowerCase().includes(q)) ||
        (s.userEmail && s.userEmail.toLowerCase().includes(q)) ||
        s.lastMessageText.toLowerCase().includes(q);

      return matchesFilter && matchesQuery;
    });
  }, [liveSessions, sessionFilter, chatSearchQuery]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return filteredSessions[0] || liveSessions[0] || null;
    return liveSessions.find((s) => s.id === selectedSessionId) || null;
  }, [liveSessions, selectedSessionId, filteredSessions]);

  const pendingTickets = supportTickets.filter((t) => t.status === 'pending');

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, badge: null, category: 'Core' },
    { id: 'users', label: 'Miners', icon: Users, badge: adminUsers.length, category: 'Core' },
    { id: 'plans', label: 'Plans & Rates', icon: Sparkles, badge: `${currentPlans.length}T`, category: 'Finance' },
    { id: 'mining', label: 'Global Yield', icon: Cpu, badge: null, category: 'Finance' },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight, badge: pendingWithdrawals.length || null, alert: pendingWithdrawals.length > 0, category: 'Finance' },
    { id: 'treasury', label: 'Treasury', icon: Landmark, badge: null, category: 'Finance' },
    {
      id: 'support',
      label: 'Support & PINs',
      icon: Headphones,
      badge: (pendingTickets.length + waitingChatsCount) || null,
      alert: pendingTickets.length > 0 || waitingChatsCount > 0,
      category: 'Security'
    },
    { id: 'subadmins', label: 'Staff (RBAC)', icon: ShieldCheck, badge: subAdmins.length, category: 'Security' },
    { id: 'settings', label: 'Rules & Popup', icon: Sliders, badge: null, category: 'Security' },
  ];
  // =========================================================================
  // SECURE MASTER ADMIN AUTHENTICATION GATE
  // =========================================================================
  if (!isAdminAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] min-h-screen bg-[#020712] text-[#F8FAFC] flex items-center justify-center p-4 select-none overflow-y-auto">
        {/* Futuristic Background Circuit / Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#00F0FF]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[320px] h-[320px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative w-full max-w-md rounded-2xl bg-[#081220]/95 border border-[#00F0FF]/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] backdrop-blur-2xl animate-scaleUp">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-16 h-16 rounded-2xl bg-[#0C1A2E] border border-[#00F0FF]/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              <img
                src="/neon_hex_clean.png"
                alt="Neon Admin"
                className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
              />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase mb-2">
              <Shield className="w-3 h-3" />
              <span>Restricted Master Console</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide">
              ADMINISTRATOR LOGIN
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Authorised access only. Please provide your master administrator credentials.
            </p>
          </div>

          {/* Error Banner */}
          {adminLoginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{adminLoginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Administrator ID / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={adminLoginId}
                  onChange={(e) => setAdminLoginId(e.target.value)}
                  placeholder="e.g. admin"
                  autoFocus
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-[#050C18] border border-[#162942] text-white text-sm font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={adminLoginPassword}
                  onChange={(e) => setAdminLoginPassword(e.target.value)}
                  placeholder="Enter master password"
                  required
                  className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#050C18] border border-[#162942] text-white text-sm font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>



            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#00F0FF] hover:from-[#0369A1] hover:to-[#00D0DF] text-[#021024] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isAuthenticating ? 'VERIFYING SECURITY TOKENS...' : 'AUTHENTICATE & ENTER CONSOLE'}</span>
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-transparent hover:bg-[#0E1B2E] text-[#64748B] hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              ← Return to Miner Web App
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] min-h-screen bg-[#030712] text-[#F8FAFC] flex flex-col md:flex-row font-sans overflow-hidden animate-fadeIn select-none">
      {/* Action Notice Floating Pill */}
      {actionNotice && (
        <div className="fixed top-4 right-4 z-[150] px-4 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF] text-[#00F0FF] font-bold text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md animate-bounce">
          <Sparkles className="w-4 h-4 text-[#00F0FF]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ===================== MOBILE TOP NAVIGATION BAR (< md) ===================== */}
      <header className="md:hidden flex flex-col bg-[#070E1B] border-b border-[#14233C] shrink-0 z-30">
        <div className="h-14 px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-[#0E1A2E] text-gray-300 hover:text-white border border-[#1A2E4C] cursor-pointer"
              aria-label="Toggle admin drawer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center p-0.5 shadow-md shadow-cyan-500/20">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-[13px] tracking-wider text-white">NEON</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold uppercase">
                ADMIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cloudflare D1 Pulse Status */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9.5px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>D1 REALTIME</span>
            </div>

            {/* Role Badge */}
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
              isSuperadmin ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {currentRole}
            </span>

            {/* Lock & Exit to Main App */}
            <button
              onClick={handleAdminSignOut}
              className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              title="Lock & Exit Admin Console"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Horizontal Swipeable Tab Navigation Bar */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-[#050A14] overflow-x-auto no-scrollbar scroll-smooth border-t border-[#0F1B2F]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={`mobile-tab-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id as AdminTab);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-[#00F0FF] border border-[#00F0FF]/50 shadow-md shadow-cyan-500/10'
                    : 'text-gray-400 bg-[#0B1424] border border-[#14233C] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black ${
                    item.alert ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ===================== MOBILE SLIDE-OUT DRAWER OVERLAY ===================== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex">
          <div className="w-72 bg-[#070E1B] border-r border-[#15233C] h-full flex flex-col p-4 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#14233C]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-black text-white">NEON ADMIN</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg bg-[#0E1B2E] text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={`drawer-tab-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id as AdminTab);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-[#00F0FF] border border-[#00F0FF]/40'
                        : 'text-gray-400 hover:bg-[#0E1A2E] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.alert ? 'bg-red-500 text-white' : 'bg-[#14233C] text-gray-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* User Identity & Exit inside Mobile Drawer */}
            <div className="pt-3 border-t border-[#14233C] space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span className="font-semibold uppercase tracking-wider">SESSION ROLE:</span>
                <span className={`font-bold font-mono uppercase ${isSuperadmin ? 'text-red-400' : 'text-amber-400'}`}>
                  {isSuperadmin ? 'Super Admin' : 'Sub-Admin'}
                </span>
              </div>
              <button
                onClick={handleAdminSignOut}
                className="w-full py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock & Exit Console</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* ===================== DESKTOP EXECUTIVE SIDEBAR (>= md) ===================== */}
      <aside className="hidden md:flex w-64 bg-[#070D18] border-r border-[#14233C] flex-col shrink-0">
        {/* Brand Banner */}
        <div className="p-4 border-b border-[#14233C] bg-[#050A14] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070D18] rounded-[10px] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#00F0FF]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-black tracking-wider text-white">NEON</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-extrabold uppercase">
                  v4.2
                </span>
              </div>
              <span className="text-[9.5px] text-gray-400 font-mono font-medium block">
                CLOUD MINING DESK
              </span>
            </div>
          </div>
        </div>

        {/* Live BSC Node & Cloudflare D1 Status Strip */}
        <div className="px-4 py-2 bg-[#050A14]/80 border-b border-[#101D33] flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">D1 // BSC #34912</span>
          </div>
          <span className="text-[#64748B]">24ms Latency</span>
        </div>

        {/* Categorized Desktop Navigation Links */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {['Core', 'Finance', 'Security'].map((cat) => {
            const items = navItems.filter((i) => i.category === cat);
            return (
              <div key={`cat-${cat}`} className="space-y-1">
                <span className="px-3 text-[9.5px] font-bold text-[#475569] uppercase tracking-wider block">
                  {cat === 'Core' ? 'Platform Operations' : cat === 'Finance' ? 'Finance & Treasury' : 'Administration & Rules'}
                </span>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as AdminTab)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-lg shadow-cyan-500/10'
                          : 'text-[#94A3B8] hover:bg-[#0B1628] hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && (
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold ${
                          item.alert
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-[#101C30] text-[#38BDF8] border border-[#162740]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Identity & Exit in Desktop Sidebar */}
        <div className="p-3 bg-[#050A14] border-t border-[#121F33] space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider">SESSION ROLE:</span>
            <span className={`font-bold font-mono uppercase ${isSuperadmin ? 'text-red-400' : 'text-amber-400'}`}>
              {isSuperadmin ? 'Super Admin' : 'Sub-Admin'}
            </span>
          </div>

          <button
            onClick={handleAdminSignOut}
            className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-[#101E33] to-[#162842] hover:from-[#162842] hover:to-[#1F395E] text-[#38BDF8] hover:text-white font-bold text-[11px] flex items-center justify-center gap-2 border border-[#1F395E] transition-all cursor-pointer shadow-md"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock & Exit Console</span>
          </button>
        </div>
      </aside>

      {/* ===================== MAIN SYSTEM CONTENT VIEWPORT ===================== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#040812]">
        {/* Desktop Management Header Bar */}
        <header className="hidden md:flex h-14 px-5 bg-[#070E1B] border-b border-[#14233C] items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
              {activeTab === 'overview' && 'Executive Overview & Solvency Desk'}
              {activeTab === 'users' && 'Registered Miners & Accounts Directory'}
              {activeTab === 'plans' && 'Mining Plans Governance & Rate Controls'}
              {activeTab === 'mining' && 'Global Mining Telemetry & Fleet Yield'}
              {activeTab === 'withdrawals' && 'Withdrawal Settlement & Compliance Desk'}
              {activeTab === 'treasury' && 'Platform Treasury & Cold Vault Reserves'}
              {activeTab === 'support' && 'Security & Fund Password Reset Desk'}
              {activeTab === 'subadmins' && 'Sub-Admin Role Delegation (RBAC)'}
              {activeTab === 'settings' && 'Platform Rules, Economic Parameters & Popup'}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Direct Admin Link Copy */}
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/?admin=portal`);
                setCopiedAdminLink(true);
                triggerNotice('Admin Direct URL copied to clipboard!');
                setTimeout(() => setCopiedAdminLink(false), 2500);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1A2E] border border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-bold hover:bg-[#00F0FF]/15 transition-all cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{copiedAdminLink ? 'Copied!' : 'Share URL'}</span>
            </button>

            {/* Role indicator badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050A14] border border-[#14233C]">
              <span className={`w-2 h-2 rounded-full ${isSuperadmin ? 'bg-red-400' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-bold text-gray-300">
                {isSuperadmin ? 'Super Admin' : 'Sub-Admin (Audit Mode)'}
              </span>
            </div>

            {/* Lock & Exit to Mining App button */}
            <button
              onClick={handleAdminSignOut}
              className="px-3.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Lock Console</span>
            </button>
          </div>
        </header>

        {/* Scrollable Tab Content Container */}
        <main className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-5">
          {/* Sub-Admin Strict Read-Only Mode Banner */}
          {isSubadmin && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <span>Sub-Admin Audit Mode (Strict Read-Only)</span>
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-200">
                      View-Only
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                    You have view-only access across all records, telemetry, users, orders, and ledger history like a PDF. All modifications, balance adjustments, payout approvals, plan updates, and wallet address settings are strictly locked to Master Super Admin.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 text-center">
                CHANGES LOCKED
              </span>
            </div>
          )}

          {/* ==================== 1. EXECUTIVE DASHBOARD ==================== */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Top Hero 4 Bento KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Platform Gross Revenue */}
                <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] shadow-lg relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-semibold">
                    <span>PLATFORM GROSS INFLOW</span>
                    <Coins className="w-4 h-4 text-[#00F0FF]" />
                  </div>
                  <div className="my-2 text-2xl font-black text-white font-mono">
                    ${dynamicInflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-400 font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{safeAdminOrders.length} plan orders recorded</span>
                  </div>
                </div>

                {/* Total Active Staked Power */}
                <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] shadow-lg relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-semibold">
                    <span>ACTIVE STAKED FLEET</span>
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="my-2 text-2xl font-black text-white font-mono">
                    ${dynamicStaked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-amber-400 font-bold">
                    <span>{dynamicActiveMinersCount} active miners</span>
                    <span className="text-[#64748B] font-normal">• 100% online</span>
                  </div>
                </div>

                {/* Total Mining Rewards Distributed */}
                <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] shadow-lg relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-semibold">
                    <span>TOTAL MINED YIELD</span>
                    <Cpu className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="my-2 text-2xl font-black text-emerald-400 font-mono">
                    ${dynamicMined.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-[#94A3B8]">
                    <span>24h Engine Output</span>
                    <span className="text-[#64748B]">• Auto-Compounding</span>
                  </div>
                </div>

                {/* Platform Net Reserves */}
                <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] shadow-lg relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-semibold">
                    <span>NET COLD VAULT RESERVE</span>
                    <Landmark className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="my-2 text-2xl font-black text-white font-mono">
                    ${dynamicReserves.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-purple-400 font-bold">
                    <span>Inflow - Withdrawals</span>
                    <span className="text-[#64748B] font-normal">• Fully Solvent</span>
                  </div>
                </div>
              </div>

              {/* Secondary Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233C] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#64748B] block font-bold uppercase">REGISTERED USERS</span>
                    <span className="text-base font-black text-cyan-400 font-mono">
                      {adminUsers.length} ({dynamicActiveMinersCount} Active)
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-[10.5px] text-cyan-400 font-bold hover:underline cursor-pointer"
                  >
                    View →
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233C] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#64748B] block font-bold uppercase">ACTIVE TIERS</span>
                    <span className="text-base font-black text-amber-400 font-mono">
                      {currentPlans.filter((p) => !p.isComingSoon).length} Active
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="text-[10.5px] text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Plans →
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233C] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#64748B] block font-bold uppercase">SECURITY TICKETS</span>
                    <span className="text-base font-black text-red-400 font-mono">
                      {pendingTickets.length} Pending
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('support')}
                    className="text-[10.5px] text-cyan-400 font-bold hover:underline cursor-pointer"
                  >
                    Solve →
                  </button>
                </div>
              </div>

              {/* Conditional Alert Banner - Only displays when real pending withdrawals arrive */}
              {pendingWithdrawals.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
                  <div className="flex items-center gap-2.5 text-amber-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {pendingWithdrawals.length} Pending Withdrawal Request(s) awaiting verification (${dynamicPendingWithdrawalsAmount.toFixed(2)} USDT)
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer transition-all shrink-0"
                  >
                    Audit Now →
                  </button>
                </div>
              )}

              {/* PLAN SALES & NODE DISTRIBUTION BREAKDOWN ("Kaun sa plan kitna bika") */}
              <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#14233C]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00F0FF]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                        <span>Plan Sales & Node Distribution</span>
                        <span className="text-[9.5px] text-[#10B981] font-mono font-bold bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25">
                          Live Tally
                        </span>
                      </h3>
                      <p className="text-[10.5px] text-[#64748B]">
                        Real-time breakdown of units sold and volume across all 7 platform mining tiers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap text-[10.5px] font-mono">
                    <span className="text-[#CBD5E1] bg-[#040812] px-2.5 py-1 rounded-lg border border-[#14233C]">
                      Total Plans Sold: <strong className="text-white">{totalPlansSoldAcrossTiers} Units</strong>
                    </span>
                    <span className="text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-lg border border-[#10B981]/25">
                      Total Inflow: <strong>${totalRevenueAcrossTiers.toLocaleString()} USD</strong>
                    </span>
                  </div>
                </div>

                {/* 7 Plan Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                  {planSalesBreakdown.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-3 rounded-xl bg-[#040812] border transition-all hover:border-[#2C4A75] flex flex-col justify-between"
                      style={{ borderColor: plan.soldCount > 0 ? `${plan.color}50` : '#14233C' }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-mono text-[#64748B] font-bold uppercase">
                            {plan.tier}
                          </span>
                          <span
                            className="text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded"
                            style={{ color: plan.color, backgroundColor: `${plan.color}15`, border: `1px solid ${plan.color}30` }}
                          >
                            ${plan.amount}
                          </span>
                        </div>

                        <h4 className="text-[12px] font-black text-white truncate" title={plan.name}>
                          {plan.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#0E1A2E] space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] text-[#94A3B8]">Units Sold:</span>
                          <span
                            className="text-[14px] font-black font-mono"
                            style={{ color: plan.soldCount > 0 ? plan.color : '#64748B' }}
                          >
                            {plan.soldCount}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9.5px] font-mono text-[#64748B]">
                          <span>Volume:</span>
                          <span className="text-white font-bold">${plan.totalRevenue.toLocaleString()}</span>
                        </div>

                        <div className="w-full h-1 bg-[#0E1A2E] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${totalPlansSoldAcrossTiers > 0 ? Math.max(8, Math.round((plan.soldCount / totalPlansSoldAcrossTiers) * 100)) : 0}%`,
                              backgroundColor: plan.color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 🔴 INSTITUTIONAL REAL-TIME WITHDRAWAL LIABILITY & SOLVENCY DESK */}
              <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] shadow-xl space-y-4">
                {/* Desk Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#14233C]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#10B981]">
                      <Activity className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
                        <span>Withdrawal Liability & Solvency Desk</span>
                        <span className="text-[9.5px] text-[#10B981] font-mono font-bold bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                          <span>LIVE · {livePortalTime}</span>
                        </span>
                        <span className="text-[9.5px] text-[#F59E0B] font-mono font-bold bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/25">
                          Threshold: ${safeSettings.minWithdrawalAmount.toFixed(2)} USDT
                        </span>
                      </h3>
                      <p className="text-[10.5px] text-[#94A3B8]">
                        Immediate payable treasury outflow if all eligible miners (balance &ge; ${safeSettings.minWithdrawalAmount.toFixed(2)} USDT) request withdrawal right now.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10.5px] font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-[#040812] border border-[#14233C] text-[#64748B]">
                      Active Fleet: <strong className="text-white">{liveLiabilityDesk.totalUsers}</strong> Nodes
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-bold">
                      Eligible Now: {liveLiabilityDesk.eligibleCount} Miners
                    </span>
                  </div>
                </div>

                {/* 4 Core Executive KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Card 1: Active Fleet & Staked Capital */}
                  <div className="p-3.5 rounded-xl bg-[#040812] border border-[#14233C] space-y-1">
                    <span className="text-[9.5px] text-[#94A3B8] uppercase block font-bold tracking-wider">
                      1. Active Network Nodes (Fleet)
                    </span>
                    <div className="text-[20px] font-black text-white font-mono flex items-baseline gap-1.5">
                      {liveLiabilityDesk.totalUsers} <span className="text-[11px] font-normal text-[#64748B]">Miners</span>
                    </div>
                    <div className="text-[10.5px] text-[#94A3B8] font-mono">
                      Staked Capital: <strong className="text-white">${liveLiabilityDesk.totalStakedCapital.toLocaleString()} USD</strong>
                    </div>
                  </div>

                  {/* Card 2: Cumulative Daily 1% Yield */}
                  <div className="p-3.5 rounded-xl bg-[#040812] border border-cyan-500/25 space-y-1 bg-gradient-to-b from-cyan-500/5 to-transparent">
                    <span className="text-[9.5px] text-[#00F0FF] uppercase block font-bold tracking-wider">
                      2. Daily Yield Accrual (24h)
                    </span>
                    <div className="text-[20px] font-black text-[#00F0FF] font-mono flex items-baseline gap-1.5">
                      +${liveLiabilityDesk.totalDailyMiningYield.toFixed(2)} <span className="text-[11px] font-normal text-[#00F0FF]/70">USDT</span>
                    </div>
                    <div className="text-[10.5px] text-[#94A3B8] font-mono">
                      Daily contract yield across fleet
                    </div>
                  </div>

                  {/* Card 3: 3-Tier Referral Commissions Earned (L1: 10% · L2: 5% · L3: 2%) */}
                  <div className="p-3.5 rounded-xl bg-[#040812] border border-emerald-500/25 space-y-1 bg-gradient-to-b from-emerald-500/5 to-transparent">
                    <span className="text-[9.5px] text-[#10B981] uppercase block font-bold tracking-wider">
                      3. Referral Commissions (L1: 10% · L2: 5% · L3: 2%)
                    </span>
                    <div className="text-[20px] font-black text-[#10B981] font-mono flex items-baseline gap-1.5">
                      +${liveLiabilityDesk.totalReferralIncome.toFixed(2)} <span className="text-[11px] font-normal text-[#10B981]/70">USDT</span>
                    </div>
                    <div className="text-[10.5px] text-[#94A3B8] font-mono">
                      Multi-level team commissions (10% + 5% + 2%)
                    </div>
                  </div>

                  {/* Card 4: Immediate Treasury Payable Outflow */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1C1425] to-[#050A14] border-2 border-[#F59E0B]/40 shadow-lg shadow-[#F59E0B]/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] text-[#F59E0B] uppercase font-bold tracking-wider">
                        4. Immediate Payable Outflow
                      </span>
                      <span className="text-[9px] text-[#10B981] font-mono font-bold bg-[#10B981]/15 px-1.5 py-0.5 rounded">
                        {liveLiabilityDesk.eligibleCount} Eligible
                      </span>
                    </div>
                    <div className="text-[20px] font-black text-[#F59E0B] font-mono flex items-baseline gap-1.5">
                      ${liveLiabilityDesk.grossPayableLiability.toFixed(2)} <span className="text-[11px] font-normal text-[#F59E0B]/80">USDT</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#CBD5E1]">
                      <span>Net Cashout: <strong className="text-white">${liveLiabilityDesk.netCashoutPayable.toFixed(2)}</strong></span>
                      <span className="text-[#10B981] font-bold">5% Gas: -${liveLiabilityDesk.gasFeeDeducted.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Mathematical Equation & Liability Formula Strip */}
                <div className="p-3 rounded-xl bg-[#040812] border border-[#14233C] space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-[10.5px] font-mono">
                    <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[9.5px]">
                      📐 TREASURY SOLVENCY AUDIT TRAIL:
                    </span>
                    <span className="text-[#64748B]">
                      {liveLiabilityDesk.accumulatingCount} Miners accumulating (&lt; ${safeSettings.minWithdrawalAmount.toFixed(2)}) · Ineligible until threshold reached
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10.5px] font-mono">
                    <div className="p-2 rounded-lg bg-[#070E1B] border border-[#14233C] flex flex-col justify-center">
                      <span className="text-[#64748B] text-[9px] uppercase">Daily Yield</span>
                      <span className="text-[13px] font-black text-[#00F0FF]">+${liveLiabilityDesk.totalDailyMiningYield.toFixed(2)}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-[#070E1B] border border-[#14233C] flex flex-col justify-center">
                      <span className="text-[#64748B] text-[9px] uppercase">10% Referral Cut</span>
                      <span className="text-[13px] font-black text-[#10B981]">+${liveLiabilityDesk.totalReferralIncome.toFixed(2)}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-[#070E1B] border border-[#14233C] flex flex-col justify-center">
                      <span className="text-[#64748B] text-[9px] uppercase">Settled Payouts</span>
                      <span className="text-[13px] font-black text-[#EF4444]">-${liveLiabilityDesk.totalWithdrawnDone.toFixed(2)}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-[#070E1B] border border-[#14233C] flex flex-col justify-center">
                      <span className="text-[#64748B] text-[9px] uppercase">Network Balance</span>
                      <span className="text-[13px] font-black text-white">${liveLiabilityDesk.totalGrossEarnings.toFixed(2)}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-[#150F22] border border-[#F59E0B]/30 flex flex-col justify-center col-span-2 sm:col-span-1">
                      <span className="text-[#F59E0B] text-[9px] uppercase font-bold">Payable Outflow</span>
                      <span className="text-[13px] font-black text-[#F59E0B]">${liveLiabilityDesk.grossPayableLiability.toFixed(2)} USDT</span>
                    </div>
                  </div>
                </div>

                {/* Live Real-Time Miners Fleet Ledger Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Active Miner Accounts & Downline Referral Ledger</span>
                    </span>
                    <span className="text-[10px] text-[#10B981] font-mono">
                      ● Cloudflare D1 Real-Time Sync
                    </span>
                  </div>

                  {liveLiabilityDesk.userRows.length === 0 ? (
                    <div className="py-10 text-center rounded-xl border border-[#14233C] bg-[#040812] space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <h4 className="text-white font-bold text-xs">No Active Miners in Fleet Yet</h4>
                      <p className="text-[#64748B] text-[11px] max-w-sm mx-auto">
                        There are currently 0 active staked miners in the system. When a user creates an account and purchases a mining plan, their node power and daily yields will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#14233C] bg-[#040812]">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead className="bg-[#070E1B] text-[#64748B] uppercase text-[9.5px] border-b border-[#14233C]">
                          <tr>
                            <th className="py-2.5 px-3">Miner Node / Account</th>
                            <th className="py-2.5 px-3">Staked Plan</th>
                            <th className="py-2.5 px-3">Daily Yield</th>
                            <th className="py-2.5 px-3">Referral Cut</th>
                            <th className="py-2.5 px-3">Withdrawable Balance</th>
                            <th className="py-2.5 px-3">Status (&ge; ${safeSettings.minWithdrawalAmount})</th>
                            <th className="py-2.5 px-3 text-right">Payable Outflow</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#0E1A2E]">
                          {liveLiabilityDesk.userRows.map((row, idx) => (
                            <tr key={`live-user-row-${row.user.id || idx}`} className="hover:bg-[#081220]/60 transition-colors">
                              <td className="py-2.5 px-3">
                                <span className="font-mono font-bold text-cyan-400 block">{row.user.id}</span>
                                <span className="text-[9.5px] text-[#64748B]">{row.user.mobile}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-white font-bold block">{row.planName}</span>
                                <span className="text-[9.5px] text-[#64748B]">${row.staked} USD Staked</span>
                              </td>
                              <td className="py-2.5 px-3 text-[#00F0FF] font-bold">
                                +${row.dailyYield.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-[#10B981] font-bold">
                                +${row.refIncome.toFixed(2)}
                                <span className="text-[9px] text-[#64748B] block font-normal font-mono">
                                  {row.refsCount} Referrals
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-white font-black">
                                ${row.balance.toFixed(2)} USDT
                              </td>
                              <td className="py-2.5 px-3">
                                {row.isEligible ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-[#10B981] font-bold bg-[#10B981]/15 px-2 py-0.5 rounded-full border border-[#10B981]/30">
                                    <span>✓ Eligible (&ge; ${safeSettings.minWithdrawalAmount})</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-[#94A3B8] font-bold bg-[#14233C] px-2 py-0.5 rounded-full border border-[#1E3354]">
                                    <span>⏳ Accumulating</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {row.isEligible ? (
                                  <span className="text-[#F59E0B] font-bold text-[11.5px]">
                                    ${row.payableNow.toFixed(2)} USDT
                                  </span>
                                ) : (
                                  <span className="text-[#475569] font-mono text-[10px]">
                                    $0.00 (Ineligible)
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. MINERS DIRECTORY (ALL USERS) ==================== */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#070E1B] border border-[#14233C]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white">Registered Miners Directory</h3>
                    <p className="text-[10.5px] text-[#64748B]">
                      Total {adminUsers.length} accounts • {dynamicActiveMinersCount} active plan subscribers
                    </p>
                  </div>
                </div>

                {/* Search & Status Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search User ID, Name, Email, Mobile..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#040812] border border-[#14233C] text-[11.5px] text-white focus:outline-none focus:border-cyan-400 w-52 sm:w-64"
                    />
                  </div>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as any)}
                    className="py-1.5 px-3 rounded-xl bg-[#040812] border border-[#14233C] text-[11px] text-gray-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="all">All Statuses ({adminUsers.length})</option>
                    <option value="active">Active ({dynamicActiveMinersCount} Plans)</option>
                    <option value="inactive">Inactive ({adminUsers.length - dynamicActiveMinersCount} No Plans)</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  {onRefreshMiners && (
                    <button
                      type="button"
                      onClick={async () => {
                        setIsRefreshingMiners(true);
                        try {
                          await onRefreshMiners();
                          triggerNotice('✓ Database synchronized: Real accounts reloaded.');
                        } finally {
                          setIsRefreshingMiners(false);
                        }
                      }}
                      disabled={isRefreshingMiners}
                      className="py-1.5 px-3 rounded-xl bg-[#0C1F38] hover:bg-[#122A4A] border border-[#00F0FF]/30 text-cyan-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                      title="Fetch latest registered accounts from Cloudflare D1 SQL database"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshingMiners ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingMiners ? 'Syncing...' : 'Sync Database'}</span>
                    </button>
                  )}

                  {onClearAllUsers && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('⚠️ ATTENTION: Are you sure you want to permanently DELETE ALL registered users from the database? This will completely wipe all accounts, contracts, and wallets to a clean 0.')) {
                          onClearAllUsers();
                          triggerNotice('✓ All user accounts permanently purged.');
                        }
                      }}
                      className="py-1.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                      title="Delete all users and reset directory to 0"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>Purge All Users</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Users Master Table / Mobile Cards */}
              {filteredUsers.length === 0 ? (
                <div className="py-14 text-center rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-3 p-6 shadow-xl">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                    <UserCheck className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-black text-base sm:text-lg tracking-wide">
                      Clean Slate • 0 Users Registered
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                      All mock and test users have been removed from the database directory. The system is completely clean and production-ready. As soon as a user registers on the website, their live account and mining nodes will appear here.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      DATABASE READY (0 / ACTIVE ONLY)
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile Cards View (< sm) */}
                  <div className="sm:hidden space-y-2.5">
                    {filteredUsers.map((user) => (
                      <div
                        key={`m-user-${user.id}`}
                        onClick={() => setSelectedUserDetail(user)}
                        className="p-3 rounded-xl bg-[#070E1B] border border-[#14233C] space-y-2.5 active:bg-[#0B1526] cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono font-black text-cyan-400 text-xs block">{user.id}</span>
                            {user.name && user.name.toUpperCase() !== user.id.toUpperCase() && !user.name.toUpperCase().startsWith('NEON') && user.name.toLowerCase() !== 'neon member' && (
                              <span className="font-bold text-gray-300 text-[11px] block">{user.name}</span>
                            )}
                            <span className="text-[10px] text-gray-400 block">{user.mobile}</span>
                          </div>
                          {user.status === 'active' || user.stakedAmount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[9.5px]">
                              Active Plan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold text-[9.5px]">
                              No Plan
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono bg-[#040812] p-2 rounded-lg border border-[#101E33]">
                          <div>
                            <span className="text-gray-500 block">Staked</span>
                            <strong className="text-white">${user.stakedAmount.toFixed(0)}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Yield</span>
                            <strong className="text-emerald-400">+${user.totalMinedYield.toFixed(2)}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Balance</span>
                            <strong className="text-cyan-300">${user.availableBalance.toFixed(2)}</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[10.5px]">
                          <span className="text-gray-400 font-mono">
                            PIN: <strong className="text-amber-300">{user.fundPin || 'Not set'}</strong>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickResetUserPin(user.id, '888888');
                                triggerNotice(`Reset PIN for ${user.id} to 888888`);
                              }}
                              className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]"
                            >
                              Reset PIN
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserDetail(user);
                              }}
                              className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]"
                            >
                              View Details
                            </button>
                            {onDeleteUser && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Permanently delete miner account ${user.id} (${user.email || user.name})? All database records will be wiped so this email can be re-used.`)) {
                                    onDeleteUser(user.id);
                                    triggerNotice(`✓ Deleted account ${user.id}`);
                                  }
                                }}
                                className="px-2 py-1 rounded bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white border border-red-500/40 transition-all font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-2.5 h-2.5 text-red-400" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (>= sm) */}
                  <div className="hidden sm:block rounded-2xl bg-[#070E1B] border border-[#14233C] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11.5px]">
                        <thead>
                          <tr className="border-b border-[#14233C] bg-[#050A14] text-[#64748B] uppercase text-[9.5px] tracking-wider font-mono">
                            <th className="py-3 px-3">Miner Account</th>
                            <th className="py-3 px-3">Contact</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Staked Plan</th>
                            <th className="py-3 px-3">Power</th>
                            <th className="py-3 px-3">Yield</th>
                            <th className="py-3 px-3">Balance</th>
                            <th className="py-3 px-3">Fund PIN</th>
                            <th className="py-3 px-3">Referrals</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#0E1A2E]">
                          {filteredUsers.map((user) => (
                            <tr
                              key={user.id}
                              onClick={() => setSelectedUserDetail(user)}
                              className="hover:bg-[#0A1324] transition-colors cursor-pointer"
                            >
                              <td className="py-3 px-3">
                                <span className="font-mono font-black text-cyan-400 block">{user.id}</span>
                                {user.name && user.name.toUpperCase() !== user.id.toUpperCase() && !user.name.toUpperCase().startsWith('NEON') && user.name.toLowerCase() !== 'neon member' && (
                                  <span className="text-gray-400 font-medium text-[11px] block">{user.name}</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-gray-300 block text-[11px]">{user.email}</span>
                                <span className="text-gray-400 font-mono text-[10px]">{user.mobile}</span>
                              </td>
                              <td className="py-3 px-3">
                                {user.status === 'active' || user.stakedAmount > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[9.5px]">
                                    Active
                                  </span>
                                ) : user.status === 'suspended' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-[9.5px]">
                                    Suspended
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[9.5px]">
                                    No Plan
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                {user.stakedAmount > 0 ? (
                                  <div>
                                    <span className="font-bold text-emerald-400 block text-[11px]">{user.currentPlanName}</span>
                                    <span className="text-[9.5px] text-gray-400 font-mono">${user.stakedAmount} USD</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 italic text-[10.5px]">0 Plans</span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-white">
                                ${user.stakedAmount.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                                +${user.totalMinedYield.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 font-mono text-cyan-300 font-bold">
                                ${user.availableBalance.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 font-mono text-amber-300 font-bold">
                                {user.fundPin || 'Not set'}
                              </td>
                              <td className="py-3 px-3 font-mono text-center">
                                <span className="px-2 py-0.5 rounded bg-[#101C30] text-purple-300 text-[10px] font-bold">
                                  {user.directReferralsCount}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedUserDetail(user);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-[10.5px] font-bold"
                                  >
                                    Details
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onQuickResetUserPin(user.id, '888888');
                                      triggerNotice(`Reset PIN for ${user.id} to 888888`);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10.5px] font-bold"
                                  >
                                    PIN
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const next = user.status === 'suspended' ? 'active' : 'suspended';
                                      onToggleUserStatus(user.id, next);
                                      triggerNotice(`User ${user.id} is now ${next.toUpperCase()}`);
                                    }}
                                    className={`px-2 py-1 rounded-lg border text-[10.5px] font-bold ${
                                      user.status === 'suspended'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                        : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                                    }`}
                                  >
                                    {user.status === 'suspended' ? 'Unban' : 'Suspend'}
                                  </button>
                                  {onDeleteUser && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to permanently delete miner ${user.id} (${user.email || user.name})? All database records and wallet data will be wiped so this email can be re-used.`)) {
                                          onDeleteUser(user.id);
                                          triggerNotice(`✓ Deleted user ${user.id}`);
                                        }
                                      }}
                                      className="px-2 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 transition-all text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                                      title="Delete account permanently"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* User Detailed Inspection Modal */}
              {selectedUserDetail && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                  <div className="w-full max-w-lg rounded-2xl bg-[#070E1B] border border-[#14233C] shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-[#14233C] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                          ID
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-cyan-400 font-mono">{selectedUserDetail.id}</h4>
                          {selectedUserDetail.name && selectedUserDetail.name.toUpperCase() !== selectedUserDetail.id.toUpperCase() && !selectedUserDetail.name.toUpperCase().startsWith('NEON') && selectedUserDetail.name.toLowerCase() !== 'neon member' && (
                            <span className="text-[11px] font-semibold text-gray-300 block">{selectedUserDetail.name}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedUserDetail(null)}
                        className="text-gray-400 hover:text-white p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Plan Status Banner */}
                    {selectedUserDetail.stakedAmount > 0 ? (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            ACTIVE MINING PLAN
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                            ${selectedUserDetail.stakedAmount.toFixed(0)} USD
                          </span>
                        </div>
                        <div className="text-sm font-black text-white">
                          {selectedUserDetail.currentPlanName}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-400 block">
                          NO ACTIVE PLAN PURCHASED
                        </span>
                        <p className="text-xs text-gray-400">
                          This user is registered but has not yet deposited or purchased a mining node.
                        </p>
                      </div>
                    )}

                    {/* User Profile Attributes */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#040812] border border-[#14233C]">
                        <span className="text-gray-500 block text-[10px]">Email</span>
                        <strong className="text-white truncate block">{selectedUserDetail.email}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#040812] border border-[#14233C]">
                        <span className="text-gray-500 block text-[10px]">Mobile</span>
                        <strong className="text-white font-mono">{selectedUserDetail.mobile}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#040812] border border-[#14233C]">
                        <span className="text-gray-500 block text-[10px]">Available Balance</span>
                        <strong className="text-cyan-400 font-mono">${selectedUserDetail.availableBalance.toFixed(2)} USDT</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#040812] border border-[#14233C]">
                        <span className="text-gray-500 block text-[10px]">Fund PIN</span>
                        <strong className="text-amber-300 font-mono">{selectedUserDetail.fundPin || 'Not set'}</strong>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => {
                          onQuickResetUserPin(selectedUserDetail.id, '888888');
                          setSelectedUserDetail({ ...selectedUserDetail, fundPin: '888888', fundPinSet: true });
                          triggerNotice(`Reset Fund PIN for ${selectedUserDetail.name} to 888888`);
                        }}
                        className="flex-1 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                      >
                        Reset PIN to 888888
                      </button>
                      <button
                        onClick={() => setSelectedUserDetail(null)}
                        className="flex-1 py-2 rounded-xl bg-[#14233C] text-gray-300 hover:text-white font-bold text-xs cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 3. MINING PLANS GOVERNANCE ==================== */}
          {activeTab === 'plans' && (
            <div className="space-y-4 animate-fadeIn">
              {planSuccessNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{planSuccessNotice}</span>
                  </div>
                  <button onClick={() => setPlanSuccessNotice(null)} className="text-gray-400 hover:text-white">✕</button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#070E1B] border border-[#14233C]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white">Mining Plans & Rate Controls</h3>
                    <p className="text-[10.5px] text-[#64748B]">
                      Manage all 7 mining tiers, daily rates %, and coming soon locks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSuperadmin ? (
                    <>
                      <button
                        onClick={handleResetPlans}
                        className="px-3 py-1.5 rounded-xl bg-[#0E1A2E] text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Reset Defaults
                      </button>
                      <button
                        onClick={() => {
                          setNewPlanNumber(`PLAN 0${currentPlans.length + 1}`);
                          setNewPlanName('');
                          setNewPlanAmount(500);
                          setNewPlanRate(1.4);
                          setIsAddPlanModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Plan</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      <Lock className="w-3 h-3" />
                      <span>Read-Only Plans View</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {currentPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">{plan.planNumber}</span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono text-xs font-black">
                          ${plan.amount} USD
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white">{plan.planName}</h4>
                      <p className="text-[11px] text-emerald-400 font-mono font-bold">
                        {plan.dailyRatePercent}% Daily Yield (+${(plan.amount * (plan.dailyRatePercent / 100)).toFixed(2)}/day)
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#040812] border border-[#101E33] space-y-1 text-[10.5px] font-mono">
                      <div className="flex justify-between text-gray-400">
                        <span>365D Compound:</span>
                        <span className="text-white font-bold">${plan.dailyReinvestTotalCompound?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Duration:</span>
                        <span className="text-gray-300">{plan.durationDays || 365} Days</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#101E33]">
                      {isSuperadmin ? (
                        <>
                          <button
                            onClick={() => handleToggleComingSoon(plan.id)}
                            className={`px-2 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors ${
                              plan.isComingSoon
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {plan.isComingSoon ? '🔒 Coming Soon' : '✅ Active'}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingPlan(plan)}
                              className="p-1.5 rounded-lg bg-[#0E1A2E] text-cyan-300 hover:text-white cursor-pointer"
                              title="Edit Rate & Duration"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {currentPlans.length > 7 && (
                              <button
                                onClick={() => handleDeletePlan(plan.id)}
                                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:text-red-200 cursor-pointer"
                                title="Remove Plan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${plan.isComingSoon ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                            {plan.isComingSoon ? 'Coming Soon' : 'Active Tier'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit Plan Modal */}
              {editingPlan && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                  <div className="w-full max-w-sm rounded-2xl bg-[#070E1B] border border-[#14233C] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">Edit Plan: {editingPlan.planName}</h4>
                      <button onClick={() => setEditingPlan(null)} className="text-gray-400 hover:text-white">✕</button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-gray-400 block mb-1">Daily Yield Rate (%):</label>
                        <input
                          type="number"
                          step="0.05"
                          value={editingPlan.dailyRatePercent}
                          onChange={(e) => setEditingPlan({ ...editingPlan, dailyRatePercent: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 rounded-xl bg-[#040812] border border-[#14233C] text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 block mb-1">Duration (Days):</label>
                        <input
                          type="number"
                          value={editingPlan.durationDays || 365}
                          onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: parseInt(e.target.value) || 365 })}
                          className="w-full p-2 rounded-xl bg-[#040812] border border-[#14233C] text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveEditPlan}
                        className="flex-1 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs cursor-pointer hover:bg-cyan-400"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingPlan(null)}
                        className="flex-1 py-2 rounded-xl bg-[#14233C] text-gray-300 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 5. GLOBAL MINING YIELD ==================== */}
          {activeTab === 'mining' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Global Mining Yield Telemetry</span>
                  </h3>
                  <p className="text-[10.5px] text-[#64748B]">
                    Consolidated 24-hour mining output across all active rigs
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono block">
                    ${dynamicMined.toFixed(2)} USDT
                  </span>
                  <span className="text-[10px] text-gray-500">Fleet Hashrate: {dynamicHashrate} TH/s</span>
                </div>
              </div>

              {adminUsers.filter((u) => (u.stakedAmount || 0) > 0).length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-2 p-6">
                  <Cpu className="w-10 h-10 mx-auto text-emerald-400/50" />
                  <h4 className="text-white font-bold text-sm">No Active Miners In Fleet</h4>
                  <p className="text-gray-400 text-xs max-w-md mx-auto">
                    Global mining rewards will begin calculating as soon as the first user activates a mining contract.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#070E1B] border border-[#14233C] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11.5px]">
                      <thead>
                        <tr className="border-b border-[#14233C] bg-[#050A14] text-[#64748B] uppercase text-[9.5px] tracking-wider font-mono">
                          <th className="py-3 px-3">Miner</th>
                          <th className="py-3 px-3">Staked Tier</th>
                          <th className="py-3 px-3">Total Mined</th>
                          <th className="py-3 px-3">Available Balance</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#0E1A2E]">
                        {adminUsers.filter((u) => (u.stakedAmount || 0) > 0).map((u) => (
                          <tr key={u.id} className="hover:bg-[#0A1324] transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-white block">{u.name}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{u.id}</span>
                            </td>
                            <td className="py-3 px-3 text-gray-300 font-mono">${u.stakedAmount} ({u.currentPlanName})</td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">+${u.totalMinedYield.toFixed(2)}</td>
                            <td className="py-3 px-3 font-mono text-cyan-300 font-bold">${u.availableBalance.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                                Online
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 6. WITHDRAWAL SETTLEMENT DESK ==================== */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#070E1B] border border-[#14233C]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white">Withdrawal Settlement Desk</h3>
                    <p className="text-[10.5px] text-[#64748B]">
                      Audit user cashout requests, enforce min ${safeSettings.minWithdrawalAmount.toFixed(2)} threshold, and approve on-chain
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10.5px]">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold">
                    Fee: {safeSettings.withdrawalFeePercent}%
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 font-bold">
                    Min: ${safeSettings.minWithdrawalAmount.toFixed(2)} USDT
                  </span>
                </div>
              </div>

              {isSubadmin && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Sub-Admin Read-Only Audit:</strong> You have full visibility to monitor miner payout queues, but approval & cashout settlement is strictly restricted to Super Admin.
                  </span>
                </div>
              )}

              {pendingWithdrawals.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-2 p-6">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                  <h4 className="text-white font-bold text-sm">All Clear! No Pending Withdrawals</h4>
                  <p className="text-gray-400 text-xs max-w-md mx-auto">
                    There are no payout requests awaiting audit. New withdrawal requests submitted by miners will appear here immediately.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingWithdrawals.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#101E33] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{req.userName}</span>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                              {req.userId}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 font-mono block mt-1">
                            BEP20: {req.walletAddress}
                          </span>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-lg font-black text-white font-mono block">
                            ${req.amount.toFixed(2)} USDT
                          </span>
                          <span className="text-xs text-emerald-400 font-bold">
                            Net Dispatch: ${req.netAmount.toFixed(2)} USDT (5% fee: ${req.fee.toFixed(2)})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        {isSubadmin ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Approval Restricted (Super Admin Only)</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setPayoutModalReq(req);
                                const autoHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                                setPayoutTxHash(autoHash);
                              }}
                              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs cursor-pointer transition-all"
                            >
                              ✓ Approve & Dispatch
                            </button>
                            <button
                              onClick={() => {
                                onRejectWithdrawal(req.id, 'Security audit failed');
                                triggerNotice(`Rejected withdrawal for ${req.userName} (Refunded)`);
                              }}
                              className="px-4 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs cursor-pointer transition-all"
                            >
                              ✕ Reject & Refund
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== 7. TREASURY BALANCE SHEET ==================== */}
          {activeTab === 'treasury' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-purple-400" />
                    <span>Treasury Balance Sheet & Reserve</span>
                  </h3>
                  <p className="text-[10.5px] text-[#64748B]">
                    Multi-sig vault cashflow, collected fees, and network solvency
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-xs">
                  Solvency: {dynamicInflow > 0 ? `${((dynamicReserves / dynamicInflow) * 100).toFixed(1)}%` : '100.0%'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233C] space-y-1">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">TOTAL INFLOW</span>
                  <span className="text-xl font-black text-white font-mono">${dynamicInflow.toFixed(2)}</span>
                </div>
                <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233C] space-y-1">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">SETTLED CASHOUTS</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">${dynamicApprovedWithdrawalsAmount.toFixed(2)}</span>
                </div>
                <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233C] space-y-1">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">FEES COLLECTED (5%)</span>
                  <span className="text-xl font-black text-cyan-400 font-mono">${dynamicFees.toFixed(2)}</span>
                </div>
                <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233C] space-y-1">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">NET COLD VAULT</span>
                  <span className="text-xl font-black text-purple-400 font-mono">${dynamicReserves.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 8. LIVE USER SUPPORT DESK & SECURITY PIN DESK ==================== */}
          {activeTab === 'support' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Top Banner with Real-Time Badges */}
              <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-cyan-400" />
                    <span>Live User Support Desk & Security Control</span>
                  </h3>
                  <p className="text-[10.5px] text-[#64748B]">
                    Real-time two-way chat with escalated miners and 6-digit withdrawal Fund PIN recovery
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {waitingChatsCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      {waitingChatsCount} Waiting Agent
                    </span>
                  )}
                  {activeChatsCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {activeChatsCount} Active
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/30">
                    {pendingTickets.length} PIN Tickets
                  </span>
                </div>
              </div>

              {/* Sub-Tab Navigation Switcher */}
              <div className="flex items-center gap-2 border-b border-[#14233C] pb-2">
                <button
                  type="button"
                  onClick={() => setSupportSubTab('chats')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    supportSubTab === 'chats'
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                      : 'bg-[#0E1A2E] text-gray-400 hover:text-white border border-[#14233C]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Live Customer Chats</span>
                  {waitingChatsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black animate-bounce">
                      {waitingChatsCount}
                    </span>
                  )}
                  <span className="text-[10px] opacity-80">({liveSessions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSupportSubTab('pins')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    supportSubTab === 'pins'
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                      : 'bg-[#0E1A2E] text-gray-400 hover:text-white border border-[#14233C]'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Fund PIN Reset Desk</span>
                  <span className="text-[10px] opacity-80">({pendingTickets.length})</span>
                </button>
              </div>

              {/* SUB-TAB 1: LIVE CHAT SESSIONS */}
              {supportSubTab === 'chats' && (
                <div className="space-y-4">
                  {/* Filters & Search Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {(['all', 'waiting', 'active', 'resolved'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setSessionFilter(f)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all capitalize whitespace-nowrap cursor-pointer ${
                            sessionFilter === f
                              ? 'bg-[#14233C] text-cyan-400 border border-cyan-500/50'
                              : 'bg-[#070E1B] text-gray-400 hover:text-gray-200 border border-transparent'
                          }`}
                        >
                          {f === 'all' && `All (${liveSessions.length})`}
                          {f === 'waiting' && `🔴 Waiting (${waitingChatsCount})`}
                          {f === 'active' && `🟢 Active (${activeChatsCount})`}
                          {f === 'resolved' && `⚪ Resolved (${resolvedChatsCount})`}
                        </button>
                      ))}
                    </div>

                    <div className="relative min-w-[220px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search miner name, phone, message..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {liveSessions.length === 0 ? (
                    <div className="py-14 text-center rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-3 p-6">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <h4 className="text-white font-bold text-sm">No Live Support Sessions Active</h4>
                      <p className="text-gray-400 text-xs max-w-md mx-auto">
                        When users interact with the 24/7 AI Copilot or tap <strong>'👤 Talk to Human Agent'</strong>, their conversation and telemetry appear here instantly for real-time live support.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Left: Chat Session Threads List */}
                      <div className="lg:col-span-4 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                        {filteredSessions.length === 0 ? (
                          <div className="p-6 text-center text-xs text-gray-500 bg-[#070E1B] rounded-xl border border-[#14233C]">
                            No conversations match the current filter.
                          </div>
                        ) : (
                          filteredSessions.map((session) => {
                            const isSelected = selectedSession?.id === session.id;
                            const isWaiting = session.status === 'waiting_admin';
                            const isActive = session.status === 'active_admin';
                            const isResolved = session.status === 'resolved';

                            return (
                              <div
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={`p-3 rounded-xl transition-all cursor-pointer border text-left ${
                                  isSelected
                                    ? 'bg-[#0E1A2E] border-cyan-500 shadow-md shadow-cyan-500/10'
                                    : isWaiting
                                    ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/80 animate-pulse'
                                    : 'bg-[#070E1B] border-[#14233C] hover:border-[#1E3A5F]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-black shrink-0">
                                      {session.userName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <strong className="text-white text-xs truncate">{session.userName}</strong>
                                  </div>
                                  <span className="text-[10px] text-gray-500 shrink-0">{session.updatedAt}</span>
                                </div>

                                <div className="flex items-center gap-2 mb-1.5 text-[10px] text-[#64748B]">
                                  <span className="font-mono text-cyan-400">{session.userMobile || session.userId}</span>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 font-bold">
                                    {session.userPlan || 'No Plan'}
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-bold">
                                    ${(session.userBalance || 0).toFixed(2)}
                                  </span>
                                </div>

                                <p className="text-[11px] text-gray-300 line-clamp-1 truncate bg-[#040812] px-2 py-1 rounded border border-[#101E33]">
                                  {session.lastMessageText || 'No message content'}
                                </p>

                                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#101E33]">
                                  {isWaiting && (
                                    <span className="text-[9.5px] font-black text-red-400 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                                      WAITING HUMAN AGENT
                                    </span>
                                  )}
                                  {isActive && (
                                    <span className="text-[9.5px] font-black text-emerald-400 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                      ACTIVE SUPPORT
                                    </span>
                                  )}
                                  {isResolved && (
                                    <span className="text-[9.5px] font-bold text-gray-500 flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      RESOLVED
                                    </span>
                                  )}
                                  {session.status === 'bot' && (
                                    <span className="text-[9.5px] font-bold text-cyan-400 flex items-center gap-1">
                                      <Bot className="w-3 h-3 text-cyan-400" />
                                      AI COPILOT
                                    </span>
                                  )}

                                  <span className="text-[10px] text-gray-500">
                                    {session.messages?.length || 0} msgs
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Right: Selected Active Conversation Desk */}
                      <div className="lg:col-span-8 bg-[#070E1B] rounded-2xl border border-[#14233C] flex flex-col h-[600px] overflow-hidden">
                        {selectedSession ? (
                          <>
                            {/* Chat Header with User Telemetry & Actions */}
                            <div className="p-3.5 border-b border-[#14233C] bg-[#0A1224] flex items-center justify-between gap-3 shrink-0">
                              <div className="flex items-center gap-2.5 truncate">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-sm shrink-0">
                                  {selectedSession.userName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="truncate">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-white font-bold text-xs sm:text-sm truncate">
                                      {selectedSession.userName}
                                    </h4>
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                                      {selectedSession.userPlan || 'Active Rig'}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                                      Bal: ${(selectedSession.userBalance || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                                    <span>{selectedSession.userMobile || selectedSession.userId}</span>
                                    {selectedSession.userEmail && <span>• {selectedSession.userEmail}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isSubadmin ? (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>Read-Only Audit</span>
                                  </div>
                                ) : (
                                  <>
                                    {selectedSession.status !== 'resolved' && (
                                      <button
                                        onClick={() => handleResolveSession(selectedSession.id)}
                                        className="px-2.5 py-1.5 rounded-xl bg-[#0E1A2E] hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Mark Resolved</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        onResetUserFundPin('manual', selectedSession.userName, '888888');
                                        handleSendAdminReply(selectedSession, '🔑 Security Update: Your 6-digit withdrawal Fund PIN has been safely reset to 888888. Please change it immediately in your Security settings.');
                                        triggerNotice(`Reset PIN for ${selectedSession.userName} to 888888`);
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <KeyRound className="w-3.5 h-3.5" />
                                      <span>Reset PIN (888888)</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Message History Transcript Pane */}
                            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#030712]/50">
                              {selectedSession.messages?.map((msg) => {
                                const isUser = msg.sender === 'user';
                                const isAdmin = msg.sender === 'admin';
                                const isAi = msg.sender === 'ai';

                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                                  >
                                    {/* Sender Meta Tag */}
                                    <div className="flex items-center gap-1.5 text-[9.5px] text-gray-500 mb-1 px-1">
                                      {isUser && (
                                        <>
                                          <User className="w-3 h-3 text-cyan-400" />
                                          <span className="text-cyan-300 font-bold">{selectedSession.userName}</span>
                                        </>
                                      )}
                                      {isAi && (
                                        <>
                                          <Bot className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400 font-bold">Neon AI Copilot</span>
                                        </>
                                      )}
                                      {isAdmin && (
                                        <>
                                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                                          <span className="text-amber-400 font-bold">{msg.senderName || 'Support Specialist (You)'}</span>
                                        </>
                                      )}
                                      <span>•</span>
                                      <span>{msg.timestamp}</span>
                                    </div>

                                    {/* Message Bubble */}
                                    <div
                                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                                        isAdmin
                                          ? 'bg-gradient-to-tr from-amber-600/30 to-amber-500/20 border border-amber-500/40 text-amber-100 rounded-tr-none'
                                          : isAi
                                          ? 'bg-[#0B1A28] border border-emerald-500/30 text-emerald-100 rounded-tl-none'
                                          : 'bg-[#0E1A2E] border border-cyan-500/30 text-white rounded-tl-none'
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {isSubadmin ? (
                              <div className="p-3.5 border-t border-[#14233C] bg-[#0A1224] flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-2.5 text-amber-300 text-xs font-medium">
                                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span>
                                    <strong>Sub-Admin Read-Only:</strong> You can view and audit user live chats, but replying is restricted to Super Admin.
                                  </span>
                                </div>
                                <span className="text-[10px] bg-amber-500/15 border border-amber-500/40 text-amber-400 px-2.5 py-1 rounded-lg uppercase tracking-wider font-bold shrink-0">
                                  Chatting Disabled
                                </span>
                              </div>
                            ) : (
                              <>
                                {/* Canned Quick Response Chips */}
                                <div className="p-2 border-t border-[#14233C] bg-[#070E1B] flex items-center gap-1.5 overflow-x-auto shrink-0">
                                  <span className="text-[10px] text-gray-500 font-bold uppercase shrink-0 pl-1">Canned:</span>
                                  {[
                                    '👋 Hello! How may I assist you today?',
                                    '🔑 Your Fund PIN has been reset to 888888.',
                                    '💸 Your withdrawal request has been verified and approved.',
                                    '💎 Your deposit transaction has been confirmed and credited.',
                                    '⏱️ Note: 24h proof-of-activity check-in is required daily.'
                                  ].map((reply, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => handleSendAdminReply(selectedSession, reply)}
                                      className="px-2.5 py-1 rounded-lg bg-[#0E1A2E] hover:bg-cyan-500/20 border border-[#1A2E4C] hover:border-cyan-500/40 text-[10.5px] text-gray-300 hover:text-white whitespace-nowrap transition-all cursor-pointer"
                                    >
                                      {reply}
                                    </button>
                                  ))}
                                </div>

                                {/* Admin Reply Input Box */}
                                <div className="p-3 border-t border-[#14233C] bg-[#0A1224] flex items-center gap-2 shrink-0">
                                  <textarea
                                    rows={2}
                                    value={adminReplyText}
                                    onChange={(e) => setAdminReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendAdminReply(selectedSession);
                                      }
                                    }}
                                    placeholder={`Reply directly to ${selectedSession.userName}... (Press Enter to send)`}
                                    className="flex-1 p-2.5 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                                  />
                                  <button
                                    onClick={() => handleSendAdminReply(selectedSession)}
                                    disabled={!adminReplyText.trim()}
                                    className="h-full px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Send</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2">
                            <MessageSquare className="w-10 h-10 text-gray-600" />
                            <h4 className="text-white font-bold text-sm">No Conversation Selected</h4>
                            <p className="text-gray-500 text-xs max-w-xs">
                              Select a user session from the left list to view transcript history and reply.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: FUND PIN RESET DESK */}
              {supportSubTab === 'pins' && (
                <div className="space-y-4">
                  {/* Manual Quick Reset PIN Card */}
                  <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-3">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Direct Fund PIN Override Utility</span>
                    </span>
                    <p className="text-[11px] text-gray-400">
                      Override or assign a new 6-digit withdrawal Fund PIN for any registered user immediately.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10.5px] text-gray-400 block mb-1">Target User ID or Name:</label>
                        <input
                          type="text"
                          value={manualResetUserId}
                          onChange={(e) => setManualResetUserId(e.target.value)}
                          placeholder="e.g. Rahul Sharma or usr_123"
                          className="w-full p-2 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-gray-400 block mb-1">New 6-Digit PIN:</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={manualResetNewPin}
                          onChange={(e) => setManualResetNewPin(e.target.value)}
                          placeholder="e.g. 888888"
                          className="w-full p-2 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!manualResetUserId) {
                              triggerNotice('Please provide a User ID or Username');
                              return;
                            }
                            onQuickResetUserPin(manualResetUserId, manualResetNewPin || '888888');
                            triggerNotice(`✓ Fund PIN for ${manualResetUserId} overridden to ${manualResetNewPin || '888888'}`);
                            setManualResetUserId('');
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition-all cursor-pointer"
                        >
                          Update Fund PIN Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pending PIN Reset Tickets */}
                  <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Queued Reset Requests ({pendingTickets.length})</span>
                      </h4>
                    </div>

                    {pendingTickets.length === 0 ? (
                      <div className="py-8 text-center rounded-xl bg-[#040812] border border-[#101E33] space-y-2 p-4">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                        <h5 className="text-white font-bold text-xs">No Pending Reset Tickets</h5>
                        <p className="text-gray-500 text-[11px]">All security recovery tickets are fully resolved.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingTickets.map((tkt) => (
                          <div key={tkt.id} className="p-3.5 rounded-xl bg-[#040812] border border-[#101E33] space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div>
                                <strong className="text-white text-xs block">{tkt.userName}</strong>
                                <span className="text-[10px] text-cyan-400 font-mono">{tkt.mobile}</span>
                              </div>
                              <span className="text-[10px] text-gray-500">{tkt.timestamp}</span>
                            </div>
                            <p className="text-xs text-gray-300 bg-[#070E1B] p-2.5 rounded-lg border border-[#14233C]">
                              "{tkt.details}"
                            </p>
                            <button
                              onClick={() => {
                                onResetUserFundPin(tkt.id, tkt.userName, '888888');
                                triggerNotice(`Reset PIN for ${tkt.userName} to 888888`);
                              }}
                              className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition-all cursor-pointer"
                            >
                              Approve & Reset Fund PIN to 888888
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 9. SUB-ADMIN STAFF MANAGEMENT ==================== */}
          {activeTab === 'subadmins' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Sub-Admin Staff Management (RBAC)</span>
                  </h3>
                  <p className="text-[10.5px] text-[#64748B]">
                    Delegated accounts can inspect all platform modules, but cannot approve payouts and cannot reply in live chat.
                  </p>
                </div>
              </div>

              {isSuperadmin ? (
                <form onSubmit={handleCreateSubAdmin} className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                    Authorize New Sub-Admin Staff Member
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Full Name:</label>
                      <input
                        type="text"
                        required
                        value={newSubAdminName}
                        onChange={(e) => setNewSubAdminName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full p-2.5 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Official Email:</label>
                      <input
                        type="email"
                        required
                        value={newSubAdminEmail}
                        onChange={(e) => setNewSubAdminEmail(e.target.value)}
                        placeholder="e.g. rahul@nexora.io"
                        className="w-full p-2.5 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Staff Login ID / Username:</label>
                      <input
                        type="text"
                        value={newSubAdminUsername}
                        onChange={(e) => setNewSubAdminUsername(e.target.value)}
                        placeholder="e.g. subadmin1 (default: email prefix)"
                        className="w-full p-2.5 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Login Password:</label>
                      <input
                        type="text"
                        value={newSubAdminPassword}
                        onChange={(e) => setNewSubAdminPassword(e.target.value)}
                        placeholder="e.g. subadmin123"
                        className="w-full p-2.5 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Delegated Permissions Notice */}
                  <div className="p-3 rounded-xl bg-[#040812] border border-[#14233C] text-[11px] text-gray-400 space-y-1">
                    <span className="font-bold text-gray-300 block">Enforced Role Permissions:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10.5px]">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span>✓</span> Full Admin Panel Visibility
                      </span>
                      <span className="text-amber-400 flex items-center gap-1.5">
                        <span>✕</span> Cannot Accept Withdrawals
                      </span>
                      <span className="text-amber-400 flex items-center gap-1.5">
                        <span>✕</span> Cannot Send Live Chat Replies
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer transition-all flex items-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Authorize Sub-Admin Credentials</span>
                  </button>
                </form>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Sub-Admin Audit Notice:</strong> You can inspect active staff records and permissions, but only Superadmin can authorize or revoke staff credentials.
                  </span>
                </div>
              )}

              {/* Built-in default subadmin reminder */}
              <div className="p-3 rounded-xl bg-[#070E1B] border border-[#14233C] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-300">Default Built-in Sub-Admin Account:</span>
                  <span className="text-white font-mono font-bold">ID: <span className="text-cyan-400">subadmin</span> | Pass: <span className="text-amber-300">subadmin123</span></span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  Active in Login Gate
                </span>
              </div>

              {subAdmins.length === 0 ? (
                <div className="py-8 text-center rounded-2xl bg-[#070E1B] border border-[#14233C] text-gray-400 text-xs space-y-1">
                  <p className="text-white font-bold">No custom delegated sub-admins yet.</p>
                  <p className="text-[11px]">Authorize staff members above or log in with the built-in subadmin credentials.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {subAdmins.map((adm) => (
                    <div
                      key={adm.id}
                      className="p-3.5 rounded-xl bg-[#070E1B] border border-[#14233C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">{adm.name}</strong>
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase">
                            Sub-Admin
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-mono">
                          <span>Email: <span className="text-gray-200">{adm.email}</span></span>
                          <span>Login ID: <span className="text-cyan-400 font-bold">{adm.username || adm.email}</span></span>
                          <span>Password: <span className="text-amber-300 font-bold">{adm.password || 'subadmin123'}</span></span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[9.5px]">
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Full Portal View</span>
                          <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Payout Approval: Blocked</span>
                          <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Live Chat: Read-Only</span>
                        </div>
                      </div>

                      {isSuperadmin && onDeleteSubAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Revoke Sub-Admin credentials for ${adm.name}?`)) {
                              onDeleteSubAdmin(adm.id);
                              triggerNotice(`Revoked credentials for ${adm.name}`);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-[11px] transition-all cursor-pointer self-start sm:self-center"
                        >
                          Revoke Access
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== 10. SYSTEM RULES & POPUP ==================== */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C]">
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Platform Parameters & Economic Rules</span>
                </h3>
                <p className="text-[10.5px] text-[#64748B]">
                  Enforce minimum withdrawal thresholds, network fees, and promotional modal
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Custody Vault Wallet Address Card (Super Admin ONLY - Hidden completely from Sub-Admin) */}
                {isSuperadmin && (
                  <div className="p-4 rounded-2xl bg-[#070E1B] border border-cyan-500/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <strong className="text-white text-xs flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-cyan-400" />
                          <span>BEP-20 USDT Custody Deposit / Vault Wallet Address</span>
                        </strong>
                        <span className="text-[11px] text-gray-400">
                          Official blockchain address where user deposits and plan subscriptions are transferred
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
                        Super Admin Access
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={editVaultWalletAddress}
                          onFocus={() => setIsEditingVault(true)}
                          onChange={(e) => {
                            setIsEditingVault(true);
                            setEditVaultWalletAddress(e.target.value);
                          }}
                          placeholder="0x... (42-character BSC address)"
                          className="flex-1 p-2 rounded-xl bg-[#040812] border border-[#14233C] font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          onClick={async () => {
                            const clean = editVaultWalletAddress.trim();
                            if (!clean.startsWith('0x') || clean.length !== 42) {
                              triggerNotice('Error: Must be a valid 42-character BSC address starting with 0x');
                              return;
                            }
                            setIsEditingVault(false);
                            await onUpdatePlatformSettings({ vaultWalletAddress: clean });
                            setEditVaultWalletAddress(clean);
                            triggerNotice(`✓ Saved Custody Vault Address to Database: ${clean.slice(0, 8)}...${clean.slice(-6)}`);
                          }}
                          className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs cursor-pointer hover:bg-cyan-400 shadow-md transition-all active:scale-95"
                        >
                          Save Address
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Updates instantly sync across all deposit modals, plan checkouts, and dynamic Web3 QR code generators.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Minimum Withdrawal Threshold */}
                <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="text-white text-xs block">Minimum Withdrawal Threshold</strong>
                    <span className="text-[11px] text-gray-400">Users cannot request payouts below this balance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      disabled={!isSuperadmin}
                      value={editMinWithdrawal}
                      onChange={(e) => setEditMinWithdrawal(parseFloat(e.target.value) || 2)}
                      className="w-20 p-1.5 rounded-lg bg-[#040812] border border-[#14233C] text-center font-mono font-bold text-white text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-gray-400">USDT</span>
                    {isSuperadmin ? (
                      <button
                        onClick={() => {
                          onUpdatePlatformSettings({ minWithdrawalAmount: editMinWithdrawal });
                          triggerNotice(`Updated minimum withdrawal to ${editMinWithdrawal} USDT`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs cursor-pointer hover:bg-cyan-400"
                      >
                        Save
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-gray-500">🔒 Locked</span>
                    )}
                  </div>
                </div>

                {/* 3. Withdrawal Fee */}
                <div className="p-4 rounded-2xl bg-[#070E1B] border border-[#14233C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="text-white text-xs block">Withdrawal Platform Fee (%)</strong>
                    <span className="text-[11px] text-gray-400">Fee auto-deducted when generating net cashout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      disabled={!isSuperadmin}
                      value={editFeePercent}
                      onChange={(e) => setEditFeePercent(parseFloat(e.target.value) || 5)}
                      className="w-20 p-1.5 rounded-lg bg-[#040812] border border-[#14233C] text-center font-mono font-bold text-white text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-gray-400">%</span>
                    {isSuperadmin ? (
                      <button
                        onClick={() => {
                          onUpdatePlatformSettings({ withdrawalFeePercent: editFeePercent });
                          triggerNotice(`Updated withdrawal fee to ${editFeePercent}%`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs cursor-pointer hover:bg-cyan-400"
                      >
                        Save
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-gray-500">🔒 Locked</span>
                    )}
                  </div>
                </div>

                {/* 4. Promotional Welcome Popup Manager */}
                <div className="p-4 rounded-2xl bg-[#070E1B] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>Welcome Modal / Promotional Showcase</span>
                      </h4>
                      <p className="text-[10.5px] text-gray-400">Manage promotional image shown when users enter site</p>
                    </div>
                    {isSuperadmin ? (
                      <button
                        onClick={() => {
                          const next = !popupEnabled;
                          setPopupEnabled(next);
                          onUpdatePlatformSettings({ popupEnabled: next });
                          triggerNotice(next ? 'Welcome popup enabled' : 'Welcome popup disabled');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          popupEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {popupEnabled ? 'Popup: ON' : 'Popup: OFF'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-gray-500">
                        {popupEnabled ? 'Popup: ON (Locked)' : 'Popup: OFF (Locked)'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {isSuperadmin && (
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Upload New Popup Image:</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="popup-file-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const dataUrl = ev.target?.result as string;
                              setPopupImageUrl(dataUrl);
                              setPopupImagePreview(dataUrl);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <label
                          htmlFor="popup-file-upload"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#040812] border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400 text-xs font-bold cursor-pointer transition-all"
                        >
                          <Database className="w-4 h-4" />
                          <span>Click to Select Image (JPG / PNG / WEBP)</span>
                        </label>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Popup Image URL:</label>
                      <input
                        type="url"
                        disabled={!isSuperadmin}
                        value={popupImageUrl.startsWith('data:') ? '' : popupImageUrl}
                        onChange={(e) => {
                          setPopupImageUrl(e.target.value);
                          setPopupImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/promo.jpg"
                        className="w-full p-2 rounded-xl bg-[#040812] border border-[#14233C] text-white text-xs font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>

                    {popupImagePreview && (
                      <div className="rounded-xl overflow-hidden border border-[#14233C] bg-[#040812] max-h-40 flex items-center justify-center p-2">
                        <img
                          src={popupImagePreview}
                          alt="Popup preview"
                          className="max-h-36 object-contain"
                          onError={() => setPopupImagePreview('')}
                        />
                      </div>
                    )}

                    {isSuperadmin && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            onUpdatePlatformSettings({
                              popupImageUrl,
                              popupLinkUrl,
                              popupEnabled
                            });
                            setPopupSaveMsg('✓ Popup saved successfully!');
                            setTimeout(() => setPopupSaveMsg(''), 3000);
                          }}
                          className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs cursor-pointer hover:bg-cyan-400"
                        >
                          Save Popup
                        </button>
                        {popupImageUrl && (
                          <button
                            onClick={() => {
                              setPopupImageUrl('');
                              setPopupImagePreview('');
                              onUpdatePlatformSettings({ popupImageUrl: '' });
                              setPopupSaveMsg('✓ Popup image removed.');
                              setTimeout(() => setPopupSaveMsg(''), 3000);
                            }}
                            className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold cursor-pointer"
                          >
                            Remove Image
                          </button>
                        )}
                        {popupSaveMsg && <span className="text-emerald-400 text-xs font-bold">{popupSaveMsg}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Clean Slate System Reset (Super Admin Only) */}
                {isSuperadmin && (
                  <div className="p-4 rounded-2xl bg-[#140606] border border-red-500/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span>Clean Slate: Reset All Plans & Orders</span>
                        </h4>
                        <p className="text-[10.5px] text-gray-400">
                          Resets all active bought plans to 0, purges orders and test data, restoring a fresh clean slate for production.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to RESET ALL PLANS & ORDERS to a clean slate? This will clear all active mining plans and order history.')) {
                            if (onResetAllData) onResetAllData();
                            triggerNotice('✓ System Clean Slate: All active plans and orders reset to 0!');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer transition-all shadow-md active:scale-95 whitespace-nowrap"
                      >
                        Reset to Clean Slate (0 Plans)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Admin Withdrawal Approval & Payout Reference Modal */}
      {payoutModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-[#081220] border border-cyan-500/40 p-5 sm:p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#14233C] pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Approve Payout & Enter Reference Hash</span>
              </h3>
              <button
                onClick={() => setPayoutModalReq(null)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050D18] border border-[#14233C] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Recipient Member:</span>
                <span className="font-bold text-white">{payoutModalReq.userName} (@{payoutModalReq.userId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Destination BEP-20 Wallet:</span>
                <span className="font-mono text-cyan-300 truncate max-w-[260px]">{payoutModalReq.walletAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gross Amount:</span>
                <span className="font-mono font-bold text-white">${payoutModalReq.amount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">5% Network Gas Fee:</span>
                <span className="font-mono text-red-400">-${payoutModalReq.fee.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#14233C]">
                <span className="font-bold text-emerald-400">Net Amount to Dispatch:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">${payoutModalReq.netAmount.toFixed(2)} USDT</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300">
                  Payout Reference / BscScan Tx Hash <span className="text-cyan-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const freshHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                    setPayoutTxHash(freshHash);
                  }}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
                >
                  ↻ Generate Fresh Hash
                </button>
              </div>
              <input
                type="text"
                value={payoutTxHash}
                onChange={(e) => setPayoutTxHash(e.target.value)}
                placeholder="0x... (Enter BscScan Tx Hash or Reference ID)"
                className="w-full p-2.5 rounded-xl bg-[#040812] border border-[#14233C] font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[10.5px] text-gray-400">
                This payout reference will be recorded in the database and displayed in the user's Withdrawal Ledger and history.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayoutModalReq(null)}
                className="px-4 py-2 rounded-xl bg-[#14233C] text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const cleanHash = payoutTxHash.trim() || ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
                  onApproveWithdrawal(payoutModalReq.id, cleanHash);
                  triggerNotice(`✓ Approved withdrawal of $${payoutModalReq.amount} with reference ${cleanHash.slice(0, 10)}...`);
                  setPayoutModalReq(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                ✓ Confirm & Dispatch Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
