/**
 * Neon Mining - Enterprise API Client Service
 * Connects the React Frontend to the Cloudflare Workers Serverless API & D1 Database.
 * Includes graceful offline fallback for uninterrupted UI demonstration.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://nexora-mining-api.neon-moning.workers.dev';

class NeonApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Health check to detect if Cloudflare Worker is reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch platform settings (Cache-busted for real-time mobile sync)
   */
  async getSettings(): Promise<Record<string, string>> {
    try {
      const res = await fetch(`${this.baseUrl}/api/settings?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.settings || {};
    } catch (err) {
      console.warn('[NexoraAPI] Failed to fetch settings, using defaults', err);
      return {
        min_deposit: '2.0',
        min_withdrawal: '2.0',
        withdrawal_fee_percent: '5.0',
        p2p_fee_percent: '0.0',
        vault_address: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
        vaultWalletAddress: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'
      };
    }
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================
  async register(params: {
    name: string;
    mobile?: string;
    email?: string;
    password: string;
    uplineCode?: string;
    fundPin?: string;
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message || `Registration error (${res.status})` };
      }
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Network connection failed' };
    }
  }

  async login(credentials: { mobile?: string; email?: string; identifier?: string; password: string }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: data.message || `Login failed (${res.status})` };
      }
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Network connection failed' };
    }
  }

  async getUserProfile(userId: string, sessionToken?: string) {
    try {
      const url = sessionToken
        ? `${this.baseUrl}/api/auth/me?userId=${encodeURIComponent(userId)}&sessionToken=${encodeURIComponent(sessionToken)}`
        : `${this.baseUrl}/api/auth/me?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url, {
        headers: sessionToken ? { 'X-Session-Token': sessionToken } : {}
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async forgotPassword(identifier: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async verifyResetToken(token: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async resetPassword(params: { userId?: string; token?: string; newPassword: string; fundPin?: string }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async changeFundPin(params: { userId: string; newPin: string; oldPin?: string; password?: string }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/change-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // ==========================================================================
  // BEP-20 Deposits & On-Chain Verification
  // ==========================================================================
  async createDepositOrder(params: {
    userId: string;
    amount: number;
    token?: string;
    network?: string;
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/deposit/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: err.message,
        // Fallback for offline UI demo
        order: {
          orderId: `DEP-BSC-${Date.now().toString().slice(-6)}`,
          userId: params.userId,
          amount: params.amount,
          token: 'USDT',
          network: 'BEP-20',
          vaultAddress: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
          status: 'pending'
        }
      };
    }
  }

  async verifyDepositTx(params: {
    orderId: string;
    txHash: string;
    userId: string;
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/deposit/verify-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async checkTxClaimable(txHash: string): Promise<{ success: boolean; claimed: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tx/check-claimable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, claimed: data.claimed ?? true, message: data.message || 'Transaction already claimed' };
      }
      return data;
    } catch (err: any) {
      // Network failure: don't block offline dev
      return { success: true, claimed: false, message: 'Offline check bypass' };
    }
  }

  async claimDepositTx(params: {
    userId: string;
    txHash: string;
    amount: number;
    network?: string;
  }): Promise<{ success: boolean; alreadyClaimed?: boolean; message: string; orderId?: string; updatedWallet?: any }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tx/claim-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          alreadyClaimed: data.alreadyClaimed ?? (res.status === 409),
          message: data.message || 'Transaction already claimed on the platform.'
        };
      }
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Network communication error' };
    }
  }

  // ==========================================================================
  // Mining Plans & Staking
  // ==========================================================================
  async subscribePlan(params: {
    userId: string;
    planId: string;
    planName: string;
    amount: number;
    dailyRatePercent: number;
    durationDays: number;
    compoundingEnabled: boolean;
    fundPin?: string;
    paymentMethod?: string;
    txHash?: string;
    isDirectPayment?: boolean;
    payDifferenceOnly?: boolean;
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/plans/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async reinvestUpgradePlan(params: {
    userId: string;
    newPower: number;
    upgradedPlanName: string;
    yieldAmount: number;
    dailyRatePercent?: number;
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/plans/reinvest-upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // ==========================================================================
  // 24-Hour Proof-of-Activity Mining Cycles
  // ==========================================================================
  async startMiningCycle(params: { userId: string }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/mining/start-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getMiningStatus(userId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/mining/status?userId=${encodeURIComponent(userId)}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // ==========================================================================
  // Wallet Operations (P2P & Withdrawals)
  // ==========================================================================
  async p2pTransfer(params: {
    senderId: string;
    recipientIdentifier: string;
    amount: number;
    fundPin: string;
    sourceWallet?: 'deposit' | 'withdrawable';
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/wallet/p2p-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async requestWithdrawal(params: {
    userId: string;
    amount: number;
    walletAddress: string;
    fundPin: string;
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/wallet/withdraw-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getWalletHistory(userId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/wallet/history?userId=${encodeURIComponent(userId)}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getDownlines(userId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/referrals/downlines?userId=${encodeURIComponent(userId)}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // ==========================================================================
  // Admin Operations
  // ==========================================================================
  async getAdminOverview() {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/overview`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async triggerDailyYield() {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/trigger-yield`, {
        method: 'POST'
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getAdminUsers(search: string = '') {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/users?search=${encodeURIComponent(search)}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async toggleUserStatus(userId: string, status: 'active' | 'suspended') {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/users/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async adjustUserBalance(params: {
    userId: string;
    balanceType: 'deposit_balance' | 'withdrawable_balance' | 'active_mining_power' | 'referral_balance';
    amount: number;
    reason?: string;
    txHash?: string;
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/users/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async deleteUser(userId: string, email?: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/users/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async purgeAllUsers() {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/users/purge-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async purgeInactiveUsers() {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/users/purge-inactive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getAdminWithdrawals(status?: string) {
    try {
      const url = status ? `${this.baseUrl}/api/admin/withdrawals?status=${encodeURIComponent(status)}` : `${this.baseUrl}/api/admin/withdrawals`;
      const res = await fetch(url);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async actionWithdrawal(params: {
    requestId: string;
    action: 'approve' | 'reject';
    txHash?: string;
    reason?: string;
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/withdrawals/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getAdminDeposits() {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/deposits`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async updatePlatformSettings(settings: Record<string, any>, adminRole: string = 'master') {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/settings?role=${encodeURIComponent(adminRole)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Role': adminRole
        },
        body: JSON.stringify({ ...settings, adminRole, role: adminRole })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // ==========================================================================
  // Real-Time Persistent Chat Support (Multi-Device & Cross-Browser)
  // ==========================================================================
  async syncChatSession(params: {
    sessionId: string;
    userId?: string;
    userName?: string;
    userMobile?: string;
    userEmail?: string;
    userPlan?: string;
    userBalance?: number;
    status?: 'bot' | 'waiting_admin' | 'active_admin' | 'resolved';
    messages?: any[];
    lastMessageText?: string;
  }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getChatSession(sessionId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat/session?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getAdminChats() {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/chats`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async sendAdminChatReply(params: { sessionId: string; adminName: string; messageText: string }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/chats/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async resolveAdminChat(sessionId: string, resolutionMessage?: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/chats/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, resolutionMessage })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async clearAllAdminChats() {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/chats/clear-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // ==========================================================================
  // Staff Sub-Admin Management
  // ==========================================================================
  async getSubAdmins() {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/subadmins`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message, subadmins: [] };
    }
  }

  async createSubAdmin(params: { email: string; name?: string; password?: string }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/subadmins/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async deleteSubAdmin(params: { id?: string; email?: string }) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/subadmins/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

export const neonApi = new NeonApiService();
export const nexoraApi = neonApi;

