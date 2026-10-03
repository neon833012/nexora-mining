-- =========================================================================
-- Nexora Mining - Cloudflare D1 SQL Schema
-- =========================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                       -- e.g. NEON10821
  name TEXT NOT NULL,                        -- e.g. Rahul_Trader
  mobile TEXT NOT NULL UNIQUE,               -- e.g. +91 98112 45890
  email TEXT,                                -- e.g. rahul@trader.io
  password_hash TEXT NOT NULL,               -- Hashed login credential
  fund_pin TEXT DEFAULT '123456',            -- 6-digit financial authorization PIN
  fund_pin_set INTEGER DEFAULT 1,            -- 0 or 1
  upline_code TEXT,                          -- Referrer's member ID
  referral_code TEXT UNIQUE NOT NULL,        -- User's own invitation code
  status TEXT DEFAULT 'active',              -- active, inactive, suspended
  role TEXT DEFAULT 'user',                  -- user only (staff stored in admins table)
  session_token TEXT,                        -- Active session identifier for single-device login
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 1b. Admins Table (Staff & Super Admin - Isolated from platform users)
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'subadmin',     -- superadmin, subadmin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_upline_code ON users(upline_code);

-- 2. Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY,
  deposit_balance REAL DEFAULT 0.0,          -- Unutilized funds for buying plans
  withdrawable_balance REAL DEFAULT 0.0,     -- Liquid yield earnings available for cashout
  referral_balance REAL DEFAULT 0.0,         -- Commissions from downlines (L1, L2, L3)
  active_mining_power REAL DEFAULT 0.0,      -- Total Staked Node Power ($ USD)
  total_withdrawn REAL DEFAULT 0.0,          -- Total historical settled payouts
  total_mined_yield REAL DEFAULT 0.0,        -- Total historical mined rewards
  unclaimed_yield REAL DEFAULT 0.0,          -- Unlocked 24H cycle yield pending claim/reinvest
  mining_cycle_started_at INTEGER DEFAULT 0, -- Unix ms timestamp when current 24H cycle started
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Deposit Orders Table (BEP-20 Cryptocurrency Deposits)
CREATE TABLE IF NOT EXISTS deposit_orders (
  order_id TEXT PRIMARY KEY,                 -- e.g. DEP-BSC-891024
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,                      -- Expected amount in USDT
  token TEXT DEFAULT 'USDT',
  network TEXT DEFAULT 'BEP-20',             -- BNB Smart Chain
  vault_address TEXT NOT NULL,               -- Receiving company wallet
  tx_hash TEXT UNIQUE,                       -- On-chain transaction hash
  block_confirmations INTEGER DEFAULT 0,     -- 0, 1, 2, 3+
  status TEXT DEFAULT 'pending',             -- pending, confirmed, expired, rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_deposit_tx_hash ON deposit_orders(tx_hash);
CREATE INDEX IF NOT EXISTS idx_deposit_status ON deposit_orders(status);

-- 4. Mining Contracts Table (Purchased Node Allocations)
CREATE TABLE IF NOT EXISTS mining_contracts (
  id TEXT PRIMARY KEY,                       -- e.g. contract_17892019
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,                     -- plan_20, plan_50, plan_150, etc.
  plan_name TEXT NOT NULL,                   -- Neon Lite, Cryptera, Novacore, etc.
  amount REAL NOT NULL,                      -- Staked cost in USD
  daily_rate_percent REAL NOT NULL,          -- 1.0, 1.1, 1.2, 1.35, 1.5, 1.7, 2.0
  duration_days INTEGER DEFAULT 365,
  compounding_enabled INTEGER DEFAULT 1,     -- 1 = Auto-Reinvest, 0 = Simple
  daily_yield_usdt REAL NOT NULL,            -- amount * (daily_rate_percent / 100)
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  last_yield_accrual DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',              -- active, completed, cancelled
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contracts_user ON mining_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON mining_contracts(status);

-- 5. Withdrawal Requests Table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id TEXT PRIMARY KEY,                       -- e.g. wd_991024
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,                      -- Gross withdrawal amount in USDT
  fee REAL NOT NULL,                         -- 5% BSC network gas fee
  net_amount REAL NOT NULL,                  -- amount - fee (95%)
  wallet_address TEXT NOT NULL,              -- User's BEP-20 destination wallet
  tx_hash TEXT,                              -- Disbursed on-chain transaction hash
  status TEXT DEFAULT 'pending',             -- pending, approved, rejected
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);

-- 6. Transactions Ledger Table (Complete Audit Trail)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                        -- BEP-20 Deposit, Plan Staked, Daily Yield, P2P Transfer, Payout
  amount REAL NOT NULL,                      -- Positive (inflow) or Negative (outflow)
  status TEXT DEFAULT 'Settled',             -- Settled, Pending, Rejected, Compounded
  tx_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- 7. Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Default Settings
INSERT OR IGNORE INTO platform_settings (key, value) VALUES
  ('min_deposit', '2.0'),
  ('min_withdrawal', '2.0'),
  ('withdrawal_fee_percent', '5.0'),
  ('p2p_fee_percent', '0.0'),
  ('referral_l1_percent', '10.0'),
  ('referral_l2_percent', '5.0'),
  ('referral_l3_percent', '2.0'),
  ('vault_address', '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'),
  ('usdt_contract', '0x55d398326f99059ff775485246999027B3197955');

-- 8. Claimed On-Chain Transaction Hashes (Permanent Anti-Replay Protection)
CREATE TABLE IF NOT EXISTS claimed_tx_hashes (
  tx_hash TEXT PRIMARY KEY,                  -- Normalized lowercase 66-character BEP-20 hash
  claimed_by_user TEXT NOT NULL,             -- User ID who redeemed the payment
  amount REAL NOT NULL,                      -- Verified USDT amount
  purpose TEXT,                              -- Deposit, Plan Staked, Upgrade, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claimed_tx_hash ON claimed_tx_hashes(tx_hash);

-- 9. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_mobile TEXT,
  user_email TEXT,
  subject TEXT,
  query_text TEXT,
  status TEXT DEFAULT 'pending',
  admin_reply TEXT,
  admin_name TEXT,
  replied_at DATETIME,
  user_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- 10. Global Broadcast Announcements Table
CREATE TABLE IF NOT EXISTS broadcast_announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'all',
  sender_admin TEXT DEFAULT 'Company Administration',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcast_audience ON broadcast_announcements(target_audience);
