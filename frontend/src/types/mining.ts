export interface MiningPlan {
  id: string;
  planNumber: string;
  planName?: string;
  amount: number;
  dailyRatePercent: number;
  durationDays: number;
  compoundingAvailable: boolean;
  simpleTotalNoReinvest: number;
  dailyReinvestTotalCompound: number;
  day365FinalDailyYield: number;
  totalAdvantage: number;
  isElite?: boolean;
  isVip?: boolean;
  isComingSoon?: boolean;
  requiresFreshDeposit50Percent?: boolean;
  descriptionNote?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface TransactionRecord {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  txHash: string;
}

export interface ReferredUserItem {
  id: string;
  name: string;
  mobile: string;
  registeredAt: string;
  planName: string;
  planAmount: number;
  commissionEarned: number;
  status: 'active' | 'inactive';
  level?: 1 | 2 | 3;
  invitedBy?: string;
}

export interface CountryCode {
  code: string;
  name: string;
  flag: string;
}

export type UserRole = 'user' | 'subadmin' | 'superadmin';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'ur'
  | 'es'
  | 'ar'
  | 'zh'
  | 'ru'
  | 'fr'
  | 'de'
  | 'pt'
  | 'ja'
  | 'ko'
  | 'it'
  | 'tr'
  | 'vi'
  | 'id'
  | 'th'
  | 'nl'
  | 'pl'
  | 'bn'
  | 'te'
  | 'mr'
  | 'ta'
  | 'fa'
  | 'sw';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  amount: number;
  fee: number;
  netAmount: number;
  walletAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  timestampMs: number;
  txHash?: string;
  rejectionReason?: string;
  type?: 'withdrawal' | 'p2p_transfer';
  recipientId?: string;
}

export interface DepositRecord {
  id: string;
  type: 'bep20_deposit' | 'p2p_received';
  amount: number;
  senderId?: string;
  txHash: string;
  timestamp: string;
  timestampMs: number;
  status: 'completed' | 'pending';
  network?: string;
  token?: string;
}

export interface SupportTicket {
  id: string;
  type: 'forgot_fund_password' | 'emergency_ai' | 'general' | 'deposit';
  userId: string;
  userName: string;
  mobile: string;
  subject: string;
  details: string;
  status: 'pending' | 'resolved';
  timestamp: string;
  priority: 'normal' | 'emergency';
}

export interface SubAdminUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  canApproveWithdrawals: boolean;
  canResetPasswords: boolean;
  maxApprovalLimit: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'admin';
  text: string;
  timestamp: string;
  isEmergency?: boolean;
  senderName?: string;
}

export interface LiveChatSession {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userMobile?: string;
  userPlan?: string;
  userBalance?: number;
  status: 'bot' | 'waiting_admin' | 'active_admin' | 'resolved';
  createdAt: string;
  updatedAt: string;
  lastMessageText: string;
  unreadAdminCount: number;
  unreadUserCount: number;
  assignedAdminName?: string;
  messages: ChatMessage[];
}

export interface TeamTurnover {
  personalStaked: number;
  downlineL1: number;
  downlineL2: number;
  downlineL3: number;
  totalVolume: number;
  boostedRate: number; // 1.0%, 1.5% if >= 1000, 2% if >= 2500
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  mobile: string;
  country: string;
  registeredAt: string;
  status: 'active' | 'inactive' | 'suspended';
  currentPlanName: string;
  stakedAmount: number;
  totalMinedYield: number;
  availableBalance: number;
  totalWithdrawn: number;
  fundPin: string;
  fundPinSet: boolean;
  referralCode: string;
  invitedBy: string;
  directReferralsCount: number;
  referralEarnings?: number;
  lastLogin: string;
  walletAddress?: string;
}

export interface AdminOrderRecord {
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  planAmount: number;
  paymentType: 'new_purchase' | 'upgrade_difference';
  amountPaid: number;
  previousCreditedAmount: number;
  dailyRatePercent: number;
  dailyYieldUSDT: number;
  txHash: string;
  orderDate: string;
  status: 'active' | 'completed' | 'cancelled';
  paymentMethod?: string;
}

export interface AdminTelemetry {
  totalPlatformRevenue: number;
  totalStakedPower: number;
  totalMinedAcrossPlatform: number;
  totalWithdrawalsApproved: number;
  totalPendingWithdrawals: number;
  totalFeesCollected: number;
  platformNetReserves: number;
  activeMinersCount: number;
  totalOrdersCount: number;
  totalRegisteredUsers: number;
  systemHashrateTH: number;
}

export interface PlatformSettings {
  minWithdrawalAmount: number;
  withdrawalFeePercent: number;
  minersGrowthRatePerMin: number;
  cycleDurationHours: number;
  maintenanceMode: boolean;
  emergencyBroadcast: string;
  popupEnabled: boolean;
  popupImageUrl: string;
  popupLinkUrl: string;
  vaultWalletAddress?: string;
  minDepositAmount?: number;
  p2pFeePercent?: number;
}
