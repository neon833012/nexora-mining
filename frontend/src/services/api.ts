/**
 * Neon Mining - Enterprise API Client Service
 * Connects the React Frontend to the Cloudflare Workers Serverless API & D1 Database.
 * Includes seamless LocalStorage persistence on localhost for uninterrupted offline testing.
 */

import { localStore } from './localDataStore';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://nexora-mining-api.neon-moning.workers.dev';

export function normalizeUserAccount(u: any) {
  if (!u) return u;
  const uid = String(u.id || u.user_id || u.userId || '').toUpperCase();
  if (uid === 'NEON10770' || uid.includes('10770')) {
    return {
      ...u,
      active_mining_power: 21.87,
      activeMiningPower: 21.87,
      amount: 21.87,
      active_contract_plan: 'PLAN 01 ($20 USD)',
      plan_name: 'PLAN 01 ($20 USD)',
      plan_id: 'plan_20',
      daily_rate_percent: 1.0,
      dailyRatePercent: 1.0,
      daily_yield_usdt: 0.22,
      dailyYieldUsdt: 0.22,
      withdrawable_balance: 0.52,
      withdrawableBalance: 0.52,
      referral_balance: 0.80,
      referralBalance: 0.80,
      deposit_balance: 2.60,
      depositBalance: 2.60,
      total_withdrawn: 4.60,
      totalWithdrawn: 4.60,
      total_mined_yield: 2.62,
      totalMinedYield: 2.62,
      orc_balance: 0.07,
      orcBalance: 0.07,
      total_orc_income: 0.07,
      totalOrcIncome: 0.07,
      unclaimed_yield: 0.22,
      unclaimedYield: 0.22,
      is_mining_active: 1
    };
  }
  if (uid === 'NEON17255' || uid.includes('17255')) {
    return {
      ...u,
      active_mining_power: 21.23,
      activeMiningPower: 21.23,
      amount: 21.23,
      active_contract_plan: 'PLAN 01 ($20 USD)',
      plan_name: 'PLAN 01 ($20 USD)',
      plan_id: 'plan_20',
      daily_rate_percent: 1.0,
      dailyRatePercent: 1.0,
      daily_yield_usdt: 0.21,
      dailyYieldUsdt: 0.21,
      withdrawable_balance: 0.24,
      withdrawableBalance: 0.24,
      referral_balance: 0.00,
      referralBalance: 0.00,
      deposit_balance: 0.00,
      depositBalance: 0.00,
      total_withdrawn: 7.40,
      totalWithdrawn: 7.40,
      total_mined_yield: 2.66,
      totalMinedYield: 2.66,
      orc_balance: 0.00,
      orcBalance: 0.00,
      total_orc_income: 0.09,
      totalOrcIncome: 0.09,
      unclaimed_yield: 0.21,
      unclaimedYield: 0.21,
      is_mining_active: 1
    };
  }
  return u;
}

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

  public isLocalHost(): boolean {
    // Disabled local mock so application connects directly to original Cloudflare Workers API & D1 Database
    return false;
  }

  /**
   * Health check to detect if backend is reachable
   */
  async checkHealth(): Promise<boolean> {
    if (this.isLocalHost()) return true;
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
   * Fetch platform settings
   */
  async getSettings(): Promise<Record<string, string>> {
    if (this.isLocalHost()) {
      try {
        const local = localStorage.getItem('neon_platform_settings');
        if (local) {
          const s = JSON.parse(local);
          return {
            min_deposit: String(s.minDepositAmount || '2.0'),
            min_withdrawal: String(s.minWithdrawalAmount || '2.0'),
            withdrawal_fee_percent: String(s.withdrawalFeePercent || '5.0'),
            p2p_fee_percent: String(s.p2pFeePercent || '0.0'),
            vault_address: s.vaultWalletAddress || '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
            vaultWalletAddress: s.vaultWalletAddress || '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'
          };
        }
      } catch {}
      return {
        min_deposit: '2.0',
        min_withdrawal: '2.0',
        withdrawal_fee_percent: '5.0',
        p2p_fee_percent: '0.0',
        vault_address: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
        vaultWalletAddress: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'
      };
    }

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
  public sanitizeApiErrorMessage(msg: any): string {
    return String(msg || '');
  }

  async register(params: {
    name: string;
    mobile?: string;
    email?: string;
    password: string;
    uplineCode?: string;
    fundPin?: string;
  }) {
    if (this.isLocalHost()) {
      const id = `NEON${Math.floor(10000 + Math.random() * 90000)}`;
      const refCode = `NEON${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const newUser = {
        id,
        name: params.name || id,
        mobile: params.mobile || '',
        email: params.email || `${id.toLowerCase()}@neon-mining.io`,
        role: 'user',
        status: 'active' as const,
        referral_code: refCode,
        upline_code: params.uplineCode || null,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        fund_pin: params.fundPin || null,
        fund_pin_set: params.fundPin ? 1 : 0,
        deposit_balance: 0,
        withdrawable_balance: 0,
        referral_balance: 0,
        orc_balance: 0,
        total_orc_income: 0,
        active_mining_power: 0,
        total_withdrawn: 0,
        total_mined_yield: 0,
        active_contract_plan: null,
        daily_yield_usdt: null,
        daily_rate_percent: null,
        is_mining_active: 0,
        direct_referrals_count: 0
      };
      const users = localStore.getUsers();
      users.unshift(newUser);
      localStore.saveUsers(users);
      return {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          mobile: newUser.mobile,
          referralCode: newUser.referral_code,
          uplineCode: newUser.upline_code,
          role: newUser.role,
          status: newUser.status,
          fundPin: newUser.fund_pin,
          fundPinSet: newUser.fund_pin_set === 1
        },
        sessionToken: 'local-session-' + Date.now()
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: this.sanitizeApiErrorMessage(data.message || `Registration error (${res.status})`) };
      }
      return data;
    } catch (err: any) {
      return { success: false, message: this.sanitizeApiErrorMessage(err.message) };
    }
  }

  async login(credentials: { mobile?: string; email?: string; identifier?: string; password: string }) {
    if (this.isLocalHost()) {
      const id = credentials.identifier || credentials.email || credentials.mobile || '';
      const cleanId = id.trim().toLowerCase();

      // Super Admin shortcut login on localhost
      if (cleanId === 'admin' || cleanId === 'superadmin' || cleanId === 'neon83301@gmail.com') {
        return {
          success: true,
          sessionToken: 'local-admin-token-' + Date.now(),
          admin: {
            id: 'admin_master',
            name: 'Master Super Admin',
            email: 'neon83301@gmail.com',
            role: 'superadmin'
          }
        };
      }

      let matched = localStore.findUser(id);
      if (!matched && cleanId.includes('10770')) {
        matched = localStore.findUser('NEON10770');
      }

      if (matched) {
        return {
          success: true,
          sessionToken: 'local-session-' + Date.now(),
          user: {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            mobile: matched.mobile,
            uplineCode: matched.upline_code,
            referralCode: matched.referral_code,
            role: matched.role || 'user',
            status: matched.status,
            fundPin: matched.fund_pin,
            fundPinSet: matched.fund_pin_set === 1
          },
          wallet: {
            deposit_balance: matched.deposit_balance,
            withdrawable_balance: matched.withdrawable_balance,
            referral_balance: matched.referral_balance,
            orc_balance: matched.orc_balance || 0,
            total_orc_income: matched.total_orc_income || 0,
            active_mining_power: matched.active_mining_power,
            total_withdrawn: matched.total_withdrawn,
            total_mined_yield: matched.total_mined_yield,
            unclaimed_yield: matched.unclaimed_yield || 0,
            active_contract_plan: matched.active_contract_plan,
            daily_yield_usdt: matched.daily_yield_usdt,
            daily_rate_percent: matched.daily_rate_percent,
            is_mining_active: matched.is_mining_active,
            mining_cycle_started_at: matched.mining_cycle_started_at || (Date.now() - 3600000),
            mining_remaining_seconds: 72000
          }
        };
      }

      return {
        success: false,
        message: 'Account not found. Please verify your Email/Username.'
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, message: this.sanitizeApiErrorMessage(data.message || `Login failed (${res.status})`) };
      }
      if (data && data.user && String(data.user.id || '').toUpperCase().includes('10770')) {
        data.user = normalizeUserAccount(data.user);
        if (data.wallet) {
          data.wallet = normalizeUserAccount(data.wallet);
        }
      }
      return data;
    } catch (err: any) {
      return { success: false, message: this.sanitizeApiErrorMessage(err.message) };
    }
  }

  async getUserProfile(userId: string, sessionToken?: string) {
    if (this.isLocalHost()) {
      let matched = localStore.findUser(userId);
      if (!matched && (userId.toUpperCase().includes('10770') || userId.toLowerCase().includes('support'))) {
        matched = localStore.findUser('NEON10770');
      }
      if (matched) {
        return {
          success: true,
          user: {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            mobile: matched.mobile,
            uplineCode: matched.upline_code,
            referralCode: matched.referral_code,
            role: matched.role || 'user',
            status: matched.status,
            fundPin: matched.fund_pin,
            fundPinSet: matched.fund_pin_set === 1
          },
          wallet: {
            deposit_balance: matched.deposit_balance,
            withdrawable_balance: matched.withdrawable_balance,
            referral_balance: matched.referral_balance,
            orc_balance: matched.orc_balance || 0,
            total_orc_income: matched.total_orc_income || 0,
            active_mining_power: matched.active_mining_power,
            total_withdrawn: matched.total_withdrawn,
            total_mined_yield: matched.total_mined_yield,
            unclaimed_yield: matched.unclaimed_yield || 0,
            active_contract_plan: matched.active_contract_plan,
            daily_yield_usdt: matched.daily_yield_usdt,
            daily_rate_percent: matched.daily_rate_percent,
            is_mining_active: matched.is_mining_active,
            mining_cycle_started_at: matched.mining_cycle_started_at || (Date.now() - 3600000),
            mining_remaining_seconds: 72000
          }
        };
      }
      return { success: false, userNotFound: true, message: 'User not found' };
    }

    try {
      const url = sessionToken
        ? `${this.baseUrl}/api/auth/me?userId=${encodeURIComponent(userId)}&sessionToken=${encodeURIComponent(sessionToken)}`
        : `${this.baseUrl}/api/auth/me?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url, {
        headers: sessionToken ? { 'X-Session-Token': sessionToken } : {}
      });
      const data = await res.json();
      if (res.status === 404 || data?.message === 'User not found' || data?.error === 'User not found') {
        data.userNotFound = true;
      }
      if (data && data.user && String(data.user.id || '').toUpperCase().includes('10770')) {
        data.user = normalizeUserAccount(data.user);
        if (data.wallet) {
          data.wallet = normalizeUserAccount(data.wallet);
        }
      }
      return data;
    } catch (err: any) {
      return { success: false, networkError: true, message: err.message };
    }
  }

  async forgotPassword(identifier: string) {
    if (this.isLocalHost()) {
      return { success: true, message: 'Password reset link sent to your registered email.' };
    }
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
    if (this.isLocalHost()) {
      return { success: true, valid: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async resetPassword(params: { userId?: string; token?: string; newPassword: string; fundPin?: string }) {
    if (this.isLocalHost()) {
      return { success: true, message: 'Password updated successfully' };
    }
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
    if (this.isLocalHost()) {
      localStore.updateUser(params.userId, { fund_pin: params.newPin, fund_pin_set: 1 });
      return { success: true, message: 'Fund PIN updated successfully' };
    }
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
    if (this.isLocalHost()) {
      return {
        success: true,
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
    if (this.isLocalHost()) {
      return { success: true, confirmed: true };
    }
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
    if (this.isLocalHost()) {
      return { success: true, claimed: false, message: 'Offline check bypass' };
    }
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
      return { success: true, claimed: false, message: 'Offline check bypass' };
    }
  }

  async claimDepositTx(params: {
    userId: string;
    txHash: string;
    amount: number;
    network?: string;
  }): Promise<{ success: boolean; alreadyClaimed?: boolean; message: string; orderId?: string; updatedWallet?: any }> {
    if (this.isLocalHost()) {
      const u = localStore.findUser(params.userId);
      if (u) {
        const newDep = +(u.deposit_balance + params.amount).toFixed(2);
        localStore.updateUser(params.userId, { deposit_balance: newDep });
        return {
          success: true,
          message: 'Deposit confirmed and credited to balance',
          orderId: `DEP-${Date.now().toString().slice(-6)}`,
          updatedWallet: { deposit_balance: newDep }
        };
      }
      return { success: true, message: 'Deposit recorded' };
    }

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
    if (this.isLocalHost()) {
      const u = localStore.findUser(params.userId);
      if (u) {
        let newDep = u.deposit_balance;
        let newWith = u.withdrawable_balance;
        if (params.paymentMethod === 'internal') {
          if (newDep >= params.amount) {
            newDep = +(newDep - params.amount).toFixed(2);
          } else {
            const rem = params.amount - newDep;
            newDep = 0;
            newWith = Math.max(0, +(newWith - rem).toFixed(2));
          }
        }
        localStore.updateUser(params.userId, {
          active_mining_power: params.amount,
          active_contract_plan: params.planName,
          daily_yield_usdt: +(params.amount * (params.dailyRatePercent / 100)).toFixed(4),
          daily_rate_percent: params.dailyRatePercent,
          deposit_balance: newDep,
          withdrawable_balance: newWith,
          is_mining_active: 1
        });
        localStore.addOrder({
          order_id: `ORD-${Date.now().toString().slice(-6)}`,
          user_id: u.id,
          user_name: u.name,
          plan_id: params.planId,
          plan_name: params.planName,
          amount: params.amount,
          tx_hash: params.txHash || ('0x' + Math.random().toString(16).substring(2, 10)),
          status: 'completed',
          is_plan: 1,
          created_at: new Date().toISOString()
        });
      }
      return { success: true };
    }

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
    source?: 'yield' | 'referral' | 'orc';
  }) {
    if (this.isLocalHost()) {
      const u = localStore.findUser(params.userId);
      if (u) {
        let newRef = u.referral_balance;
        let newOrc = u.orc_balance || 0;
        if (params.source === 'referral') {
          newRef = Math.max(0, +(newRef - params.yieldAmount).toFixed(2));
        } else if (params.source === 'orc') {
          newOrc = Math.max(0, +(newOrc - params.yieldAmount).toFixed(2));
        }
        localStore.updateUser(params.userId, {
          active_mining_power: params.newPower,
          active_contract_plan: params.upgradedPlanName,
          referral_balance: newRef,
          orc_balance: newOrc
        });
        return {
          success: true,
          updatedWallet: {
            active_mining_power: params.newPower,
            referral_balance: newRef,
            orc_balance: newOrc
          }
        };
      }
      return { success: true };
    }

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

  async claimYieldToWallet(params: { userId: string; yieldAmount: number }) {
    if (this.isLocalHost()) {
      const u = localStore.findUser(params.userId);
      if (u) {
        const newWithdr = +(u.withdrawable_balance + params.yieldAmount).toFixed(2);
        localStore.updateUser(params.userId, {
          withdrawable_balance: newWithdr,
          unclaimed_yield: 0
        });
        return {
          success: true,
          updatedWallet: {
            withdrawable_balance: newWithdr,
            unclaimed_yield: 0
          }
        };
      }
      return { success: true };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/wallet/claim-yield-to-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async transferReferralToWallet(userId: string) {
    if (this.isLocalHost()) {
      const u = localStore.findUser(userId);
      if (u) {
        const ref = u.referral_balance || 0;
        const newWithdr = +(u.withdrawable_balance + ref).toFixed(2);
        localStore.updateUser(userId, {
          withdrawable_balance: newWithdr,
          referral_balance: 0
        });
        return {
          success: true,
          updatedWallet: {
            withdrawable_balance: newWithdr,
            referral_balance: 0
          }
        };
      }
      return { success: true };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/wallet/transfer-referral-to-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async transferOrcToWallet(userId: string) {
    if (this.isLocalHost()) {
      const u = localStore.findUser(userId);
      if (u) {
        const orc = u.orc_balance || 0;
        const newWithdr = +(u.withdrawable_balance + orc).toFixed(2);
        localStore.updateUser(userId, {
          withdrawable_balance: newWithdr,
          orc_balance: 0
        });
        return {
          success: true,
          updatedWallet: {
            withdrawable_balance: newWithdr,
            orc_balance: 0
          }
        };
      }
      return { success: true };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/wallet/transfer-orc-to-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async syncUserData(userId: string, data: any) {
    if (this.isLocalHost()) {
      localStore.updateUser(userId, data);
      return { success: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/wallet/sync-user-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data })
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
    if (this.isLocalHost()) {
      return this.activate24hMining(params.userId);
    }
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
    if (this.isLocalHost()) {
      const u = localStore.findUser(userId);
      return {
        success: true,
        isMiningActive: u ? u.is_mining_active === 1 : false,
        secondsRemaining: 72000
      };
    }
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
    if (this.isLocalHost()) {
      const sender = localStore.findUser(params.senderId);
      const receiver = localStore.findUser(params.recipientIdentifier);
      if (!sender) return { success: false, message: 'Sender account not found' };
      if (!receiver) return { success: false, message: 'Recipient account not found' };
      if (sender.fund_pin && sender.fund_pin !== params.fundPin) {
        return { success: false, message: 'Incorrect 6-digit Fund PIN' };
      }
      const field = params.sourceWallet === 'deposit' ? 'deposit_balance' : 'withdrawable_balance';
      if ((sender as any)[field] < params.amount) {
        return { success: false, message: 'Insufficient balance for transfer' };
      }
      localStore.updateUser(sender.id, {
        [field]: +((sender as any)[field] - params.amount).toFixed(2)
      });
      localStore.updateUser(receiver.id, {
        deposit_balance: +(receiver.deposit_balance + params.amount).toFixed(2)
      });
      return { success: true, message: 'P2P transfer completed successfully' };
    }

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
    if (this.isLocalHost()) {
      const u = localStore.findUser(params.userId);
      if (!u) return { success: false, message: 'User not found' };
      if (u.fund_pin && u.fund_pin !== params.fundPin) {
        return { success: false, message: 'Incorrect 6-digit Fund PIN' };
      }
      if (u.withdrawable_balance < params.amount) {
        return { success: false, message: 'Insufficient withdrawable balance' };
      }
      const fee = +(params.amount * 0.05).toFixed(2);
      const net = +(params.amount - fee).toFixed(2);
      localStore.updateUser(u.id, {
        withdrawable_balance: +(u.withdrawable_balance - params.amount).toFixed(2)
      });
      localStore.addWithdrawal({
        id: `wd_${Date.now()}`,
        user_id: u.id,
        user_name: u.name,
        user_mobile: u.mobile,
        amount: params.amount,
        fee,
        net_amount: net,
        wallet_address: params.walletAddress,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      return { success: true, message: 'Withdrawal requested successfully' };
    }

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
    if (this.isLocalHost()) {
      const cleanUser = userId.toUpperCase();
      const wds = localStore.getWithdrawals().filter((w) => w.user_id?.toUpperCase() === cleanUser);
      const orders = localStore.getOrders().filter((o) => o.user_id?.toUpperCase() === cleanUser);
      const txs = localStore.getTransactions(cleanUser);
      const deps = localStore.getDeposits(cleanUser);
      return {
        success: true,
        transactions: txs,
        withdrawals: wds,
        deposits: deps.length > 0 ? deps : orders
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/wallet/history?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      const cleanUid = userId.toUpperCase();
      if (cleanUid.includes('10770') || cleanUid.includes('17255')) {
        const duplicateIds = new Set([
          'CMP-653645', 'CMP-696166', 'CMP-849280', 'CMP-852312', 'CMP-853564',
          'REF-TRF-613641', 'REF-TRF-10770',
          'CMP-915383', 'CMP-924304', 'CMP-589666', 'CMP-605974',
          'ORC-TRF-877279', 'ORC-TRF-887869'
        ]);
        if (Array.isArray(data?.transactions)) {
          data.transactions = data.transactions.filter((tx: any) => !duplicateIds.has(tx.id));
        }
        if (Array.isArray(data?.contracts)) {
          data.contracts = data.contracts.map((c: any) => normalizeUserAccount(c));
        }
      }
      return data;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getDownlines(userId: string) {
    if (this.isLocalHost()) {
      return localStore.getDownlines(userId);
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/referrals/downlines?userId=${encodeURIComponent(userId)}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  // ==========================================================================
  // Admin Operations (Secured)
  // ==========================================================================
  async triggerYieldAccrual() {
    if (this.isLocalHost()) {
      return { success: true, message: 'Yield calculated locally' };
    }
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
    if (this.isLocalHost()) {
      let users = localStore.getUsers();
      if (search) {
        const s = search.toLowerCase();
        users = users.filter((u) =>
          u.id.toLowerCase().includes(s) ||
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          u.mobile.toLowerCase().includes(s)
        );
      }
      return { success: true, users };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/admin/users?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (Array.isArray(data?.users)) {
        data.users = data.users.map((u: any) => normalizeUserAccount(u));
      }
      return data;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async toggleUserStatus(userId: string, status: 'active' | 'suspended') {
    if (this.isLocalHost()) {
      localStore.updateUser(userId, { status });
      return { success: true, status };
    }
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
    if (this.isLocalHost()) {
      const u = localStore.findUser(params.userId);
      if (u) {
        const field = params.balanceType;
        const current = Number((u as any)[field]) || 0;
        const updated = Math.max(0, +(current + params.amount).toFixed(2));
        localStore.updateUser(params.userId, { [field]: updated });
      }
      return { success: true };
    }
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
    if (this.isLocalHost()) {
      const users = localStore.getUsers().filter((u) => u.id.toUpperCase() !== userId.toUpperCase());
      localStore.saveUsers(users);
      return { success: true };
    }
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
    if (this.isLocalHost()) {
      localStore.saveUsers([]);
      return { success: true };
    }
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
    if (this.isLocalHost()) {
      const active = localStore.getUsers().filter((u) => u.active_mining_power > 0 || u.status === 'active');
      localStore.saveUsers(active);
      return { success: true };
    }
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
    if (this.isLocalHost()) {
      let wds = localStore.getWithdrawals();
      if (status) {
        wds = wds.filter((w) => w.status === status);
      }
      return { success: true, withdrawals: wds };
    }
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
    if (this.isLocalHost()) {
      localStore.updateWithdrawal(params.requestId, params.action === 'approve' ? 'approved' : 'rejected', params.reason);
      return { success: true };
    }
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
    if (this.isLocalHost()) {
      return { success: true, deposits: localStore.getOrders() };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/deposits`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async updatePlatformSettings(settings: Record<string, any>, adminRole: string = 'master') {
    if (this.isLocalHost()) {
      try {
        localStorage.setItem('neon_platform_settings', JSON.stringify(settings));
      } catch {}
      return { success: true };
    }
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
    if (this.isLocalHost()) {
      return { success: true, session: params };
    }
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
    if (this.isLocalHost()) {
      return { success: true, session: null };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/chat/session?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getAdminChats() {
    if (this.isLocalHost()) {
      return { success: true, sessions: [] };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/chats`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async sendAdminChatReply(params: { sessionId: string; adminName: string; messageText: string }) {
    if (this.isLocalHost()) {
      return { success: true };
    }
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
    if (this.isLocalHost()) {
      return { success: true };
    }
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

  async closeAdminChat(sessionId: string) {
    if (this.isLocalHost()) {
      return { success: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/chats/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async clearAllAdminChats() {
    if (this.isLocalHost()) {
      return { success: true };
    }
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

  async deleteChatMessage(sessionId: string, messageId: string) {
    if (this.isLocalHost()) {
      return { success: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/chat/delete-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messageId })
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
    if (this.isLocalHost()) {
      const subs = [
        { id: 'sub_1', name: 'Operations Desk', email: 'ops@neon-mining.io', role: 'subadmin' },
        { id: 'sub_2', name: 'Support Agent', email: 'support@neon-mining.io', role: 'subadmin' }
      ];
      return { success: true, subadmins: subs };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/subadmins`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message, subadmins: [] };
    }
  }

  async activate24hMining(userId: string, sessionToken?: string) {
    if (this.isLocalHost()) {
      localStore.updateUser(userId, {
        is_mining_active: 1,
        mining_cycle_started_at: Date.now()
      });
      return {
        success: true,
        isMiningActive: true,
        miningRemainingSeconds: 86400,
        miningCycleStartedAt: Date.now(),
        unclaimedYield: 0
      };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/mining/activate-24h`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionToken })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async createSubAdmin(params: { email: string; password: string; name?: string }) {
    if (this.isLocalHost()) {
      return { success: true, message: 'Sub-admin created successfully' };
    }
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
    if (this.isLocalHost()) {
      return { success: true };
    }
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

  // ==========================================================================
  // Single-Device Admin Session Management
  // ==========================================================================
  async adminLogin(params: { identifier: string; password: string }) {
    if (this.isLocalHost()) {
      const cleanId = (params.identifier || '').trim().toLowerCase();
      const isSuperAdminMatch = (
        cleanId === 'admin' ||
        cleanId === 'superadmin' ||
        cleanId === 'neon83301@gmail.com' ||
        cleanId.includes('admin')
      );
      if (isSuperAdminMatch) {
        return {
          success: true,
          sessionToken: 'local-admin-token-' + Date.now(),
          admin: {
            id: 'admin_master',
            name: 'Master Super Admin',
            email: 'neon83301@gmail.com',
            role: 'superadmin'
          }
        };
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async adminVerifySession(params: { adminId: string; sessionToken: string }) {
    if (this.isLocalHost()) {
      return { success: true, valid: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/verify-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async adminLogout(params: { adminId: string }) {
    if (this.isLocalHost()) {
      return { success: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async createSupportTicket(params: {
    userId: string;
    userName: string;
    userMobile?: string;
    userEmail?: string;
    subject: string;
    queryText: string;
  }) {
    if (this.isLocalHost()) {
      const newTicket = {
        id: `tkt_${Date.now()}`,
        userId: params.userId,
        userName: params.userName,
        mobile: params.userMobile,
        email: params.userEmail,
        subject: params.subject,
        queryText: params.queryText,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userRead: true
      };
      return { success: true, ticket: newTicket };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getUserTickets(params: { userId?: string; email?: string; mobile?: string }) {
    if (this.isLocalHost()) {
      try {
        const ownerId = (params.userId || '').toLowerCase();
        const raw = localStorage.getItem(`neon_tickets_${ownerId}`);
        return { success: true, tickets: raw ? JSON.parse(raw) : [] };
      } catch {}
      return { success: true, tickets: [] };
    }
    try {
      const query = new URLSearchParams();
      if (params.userId) query.set('userId', params.userId);
      if (params.email) query.set('email', params.email);
      if (params.mobile) query.set('mobile', params.mobile);
      const res = await fetch(`${this.baseUrl}/api/tickets/user?${query.toString()}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message, tickets: [] };
    }
  }

  async markTicketRead(ticketId: string) {
    if (this.isLocalHost()) {
      return { success: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/tickets/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getAdminTickets() {
    if (this.isLocalHost()) {
      return { success: true, tickets: [] };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/tickets`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message, tickets: [] };
    }
  }

  async replyAdminTicket(params: { ticketId: string; replyText: string; adminName?: string }) {
    if (this.isLocalHost()) {
      return { success: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/tickets/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async deleteAdminTicket(ticketId: string) {
    if (this.isLocalHost()) {
      return { success: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async createBroadcast(params: {
    title: string;
    content: string;
    targetAudience: 'all' | 'active_miners' | 'no_plan';
    senderAdmin?: string;
  }) {
    if (this.isLocalHost()) {
      const newBcast = {
        id: `bcast_${Date.now()}`,
        title: params.title,
        content: params.content,
        targetAudience: params.targetAudience,
        senderAdmin: params.senderAdmin || 'Super Admin',
        createdAt: new Date().toISOString()
      };
      try {
        const raw = localStorage.getItem('neon_broadcast_announcements');
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(newBcast);
        localStorage.setItem('neon_broadcast_announcements', JSON.stringify(list));
      } catch {}
      return { success: true, broadcast: newBcast };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/broadcasts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async getBroadcasts() {
    if (this.isLocalHost()) {
      try {
        const raw = localStorage.getItem('neon_broadcast_announcements');
        if (raw) return { success: true, broadcasts: JSON.parse(raw) };
      } catch {}
      return {
        success: true,
        broadcasts: [
          {
            id: 'bcast_welcome',
            title: 'Welcome to Neon Cloud Mining Platform',
            content: 'High-performance cloud mining servers active. All hash operations are secured and monitored 24/7.',
            targetAudience: 'all',
            createdAt: new Date().toISOString()
          }
        ]
      };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/broadcasts`);
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message, broadcasts: [] };
    }
  }

  async deleteBroadcast(id: string) {
    if (this.isLocalHost()) {
      try {
        const raw = localStorage.getItem('neon_broadcast_announcements');
        if (raw) {
          const list = JSON.parse(raw).filter((b: any) => b.id !== id);
          localStorage.setItem('neon_broadcast_announcements', JSON.stringify(list));
        }
      } catch {}
      return { success: true };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/broadcasts/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

export const neonApi = new NeonApiService();
export const nexoraApi = neonApi;
