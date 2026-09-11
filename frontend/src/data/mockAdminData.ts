import { AdminUserRecord, AdminOrderRecord, AdminTelemetry, PlatformSettings } from '../types/mining';

// Clean initial empty datasets for fresh real-time testing
export const INITIAL_ADMIN_USERS: AdminUserRecord[] = [];

export const INITIAL_ADMIN_ORDERS: AdminOrderRecord[] = [];

export const INITIAL_ADMIN_TELEMETRY: AdminTelemetry = {
  totalPlatformRevenue: 0.0,
  totalStakedPower: 0.0,
  totalMinedAcrossPlatform: 0.0,
  totalWithdrawalsApproved: 0.0,
  totalPendingWithdrawals: 0.0,
  totalFeesCollected: 0.0,
  platformNetReserves: 0.0,
  activeMinersCount: 0,
  totalOrdersCount: 0,
  totalRegisteredUsers: 0,
  systemHashrateTH: 0.0
};

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
  minWithdrawalAmount: 2.0,
  withdrawalFeePercent: 5.0,
  minersGrowthRatePerMin: 10,
  cycleDurationHours: 24,
  maintenanceMode: false,
  emergencyBroadcast: 'NEON MINING Enterprise Hash Engine v4.2 Running Normally. Zero Latency.',
  popupEnabled: true,
  popupImageUrl: '',
  popupLinkUrl: ''
};
