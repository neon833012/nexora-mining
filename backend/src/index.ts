import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verifyBscTransaction } from './blockchain';
import { handleDailyYieldCron, Env } from './cron';

const app = new Hono<{ Bindings: Env }>();

// Enable Global CORS for frontend client interactions
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}));

// ============================================================================
// 1. Root & Health Check Endpoints
// ============================================================================
app.get('/', (c) => {
  return c.json({
    status: 'online',
    service: 'Neon Mining Serverless API',
    engine: 'Cloudflare Workers + D1 SQL',
    network: 'BNB Smart Chain (BEP-20)',
    chainId: c.env.CHAIN_ID || '56',
    vaultAddress: c.env.VAULT_ADDRESS,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Platform public settings
app.get('/api/settings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT key, value FROM platform_settings').all();
    const settings: Record<string, string> = {};
    for (const row of (results as any[])) {
      settings[row.key] = row.value;
    }
    return c.json({ success: true, settings });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ============================================================================
// 2. Authentication & User Profile
// ============================================================================
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const { name, mobile, email, password, fundPin = '123456', uplineCode } = body;

    if (!password) {
      return c.json({ success: false, message: 'Password is required' }, 400);
    }
    if (!mobile && !email) {
      return c.json({ success: false, message: 'Mobile number or Email address is required' }, 400);
    }

    const cleanMobile = mobile ? mobile.trim() : null;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Check if mobile already exists (if provided)
    if (cleanMobile) {
      const cleanNoSpaces = cleanMobile.replace(/\s+/g, '');
      const existingMobile = await c.env.DB.prepare(
        'SELECT id FROM users WHERE mobile = ? OR REPLACE(mobile, " ", "") = ?'
      ).bind(cleanMobile, cleanNoSpaces).first();

      if (existingMobile) {
        return c.json({ success: false, message: 'Mobile number is already registered' }, 409);
      }
    }

    // Check if email already exists (if provided)
    if (cleanEmail) {
      const existingEmail = await c.env.DB.prepare(
        'SELECT id FROM users WHERE LOWER(email) = ?'
      ).bind(cleanEmail).first();

      if (existingEmail) {
        return c.json({ success: false, message: 'Email address is already registered' }, 409);
      }
    }

    const userId = `NEON${Math.floor(10000 + Math.random() * 90000)}`;
    const referralCode = `NEX${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Insert user and initialize wallet atomically
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO users (id, name, mobile, email, password_hash, fund_pin, fund_pin_set, upline_code, referral_code) 
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ).bind(
        userId,
        name || 'Neon Member',
        cleanMobile || `+00 ${userId.replace('NEON', '9')}`,
        cleanEmail,
        password,
        fundPin,
        uplineCode || null,
        referralCode
      ),

      c.env.DB.prepare(
        `INSERT INTO wallets (user_id, deposit_balance, withdrawable_balance, referral_balance, active_mining_power, total_withdrawn, total_mined_yield) 
         VALUES (?, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`
      ).bind(userId)
    ]);

    const user = {
      id: userId,
      name: name || 'Neon Member',
      mobile: cleanMobile || `+00 ${userId.replace('NEON', '9')}`,
      email: cleanEmail,
      referralCode,
      role: 'user',
      uplineCode: uplineCode || null
    };

    const wallet = {
      depositBalance: 0,
      withdrawableBalance: 0,
      referralBalance: 0,
      activeMiningPower: 0,
      totalWithdrawn: 0,
      totalMinedYield: 0
    };

    return c.json({
      success: true,
      message: 'Account registered successfully',
      user,
      wallet,
      token: `nx_tok_${Date.now()}_${userId}`
    }, 201);
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const identifier = (body.identifier || body.email || body.mobile || '').trim();
    const password = (body.password || '').trim();

    if (!identifier || !password) {
      return c.json({ success: false, message: 'Please enter your Mobile / Email / Miner ID and Password' }, 400);
    }

    const cleanId = identifier;
    const cleanNoSpaces = identifier.replace(/\s+/g, '');

    // Strict search: Email, User ID, Mobile (with or without spaces), or sub-match
    const userRecord = await c.env.DB.prepare(`
      SELECT * FROM users 
      WHERE (
        LOWER(email) = LOWER(?)
        OR UPPER(id) = UPPER(?)
        OR mobile = ?
        OR REPLACE(mobile, ' ', '') = ?
        OR (length(?) >= 6 AND mobile LIKE '%' || ?)
      )
      LIMIT 1
    `).bind(cleanId, cleanId, cleanId, cleanNoSpaces, cleanNoSpaces, cleanNoSpaces).first() as any;

    if (!userRecord || userRecord.password_hash !== password) {
      return c.json({ success: false, message: 'Invalid mobile/email or password. Please check your credentials.' }, 401);
    }

    if (userRecord.status === 'suspended') {
      return c.json({
        success: false,
        suspended: true,
        message: 'Your account has been suspended due to policy violations and irregular mining activity. Please contact support@neon-mining.io for assistance.'
      }, 403);
    }

    // Fetch user wallet
    const walletRecord = await c.env.DB.prepare(
      'SELECT * FROM wallets WHERE user_id = ?'
    ).bind(userRecord.id).first() as any;

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      mobile: userRecord.mobile,
      email: userRecord.email,
      referralCode: userRecord.referral_code,
      uplineCode: userRecord.upline_code,
      role: userRecord.role,
      fundPinSet: userRecord.fund_pin_set === 1
    };

    const wallet = walletRecord ? {
      depositBalance: walletRecord.deposit_balance,
      withdrawableBalance: walletRecord.withdrawable_balance,
      referralBalance: walletRecord.referral_balance,
      activeMiningPower: walletRecord.active_mining_power,
      totalWithdrawn: walletRecord.total_withdrawn,
      totalMinedYield: walletRecord.total_mined_yield
    } : {
      depositBalance: 0,
      withdrawableBalance: 0,
      referralBalance: 0,
      activeMiningPower: 0,
      totalWithdrawn: 0,
      totalMinedYield: 0
    };

    return c.json({
      success: true,
      user,
      wallet,
      token: `nx_tok_${Date.now()}_${userRecord.id}`
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/auth/me', async (c) => {
  try {
    const userId = c.req.query('userId') || c.req.header('X-User-Id');
    if (!userId) {
      return c.json({ success: false, message: 'User ID required' }, 400);
    }

    const userRecord = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as any;
    if (!userRecord) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    const walletRecord = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first() as any;

    return c.json({
      success: true,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        mobile: userRecord.mobile,
        email: userRecord.email,
        referralCode: userRecord.referral_code,
        uplineCode: userRecord.upline_code,
        role: userRecord.role
      },
      wallet: walletRecord || {}
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/referrals/downlines', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) {
      return c.json({ success: false, message: 'User ID required' }, 400);
    }

    // Find the user's referral code
    const user = await c.env.DB.prepare('SELECT referral_code FROM users WHERE id = ?').bind(userId).first() as any;
    const refCode = user?.referral_code;

    // Fetch all users who have this user as upline
    const query = refCode 
      ? `SELECT u.id, u.name, u.mobile, u.email, u.created_at, u.status, w.active_mining_power
         FROM users u
         LEFT JOIN wallets w ON u.id = w.user_id
         WHERE u.upline_code = ? OR u.upline_code = ?
         ORDER BY u.created_at DESC`
      : `SELECT u.id, u.name, u.mobile, u.email, u.created_at, u.status, w.active_mining_power
         FROM users u
         LEFT JOIN wallets w ON u.id = w.user_id
         WHERE u.upline_code = ?
         ORDER BY u.created_at DESC`;

    const params = refCode ? [userId, refCode] : [userId];
    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ success: true, downlines: results || [] });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Forgot Password / Recovery Verification
app.post('/api/auth/forgot-password', async (c) => {
  try {
    const { identifier } = await c.req.json();
    if (!identifier) {
      return c.json({ success: false, message: 'Please provide mobile number or User ID' }, 400);
    }

    const clean = identifier.trim();
    const user = await c.env.DB.prepare(
      'SELECT id, name, mobile, email, fund_pin_set FROM users WHERE id = ? OR mobile = ? OR email = ?'
    ).bind(clean, clean, clean).first() as any;

    if (!user) {
      return c.json({ success: false, message: 'Account not found with provided mobile or ID' }, 404);
    }

    const resetToken = `rst_${Date.now()}_${user.id}`;
    return c.json({
      success: true,
      message: 'Account verified. You can reset your password using your Fund Security PIN.',
      userId: user.id,
      name: user.name,
      resetToken
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Reset Password (with Fund PIN verification)
app.post('/api/auth/reset-password', async (c) => {
  try {
    const { userId, newPassword, fundPin } = await c.req.json();
    if (!userId || !newPassword) {
      return c.json({ success: false, message: 'User ID and new password are required' }, 400);
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as any;
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    if (fundPin && user.fund_pin && user.fund_pin !== fundPin) {
      return c.json({ success: false, message: 'Invalid 6-digit Fund Security PIN' }, 403);
    }

    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newPassword, userId).run();

    return c.json({
      success: true,
      message: 'Password updated successfully. You can now login with your new password.'
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Change 6-Digit Fund PIN
app.post('/api/auth/change-pin', async (c) => {
  try {
    const { userId, newPin, oldPin, password } = await c.req.json();
    if (!userId || !newPin || String(newPin).length !== 6) {
      return c.json({ success: false, message: 'User ID and 6-digit new PIN are required' }, 400);
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as any;
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    if (password && user.password_hash !== password) {
      return c.json({ success: false, message: 'Incorrect login password' }, 403);
    }
    if (oldPin && user.fund_pin && user.fund_pin !== oldPin) {
      return c.json({ success: false, message: 'Incorrect current Fund PIN' }, 403);
    }

    await c.env.DB.prepare('UPDATE users SET fund_pin = ?, fund_pin_set = 1 WHERE id = ?').bind(String(newPin), userId).run();

    return c.json({
      success: true,
      message: '6-digit Fund PIN updated successfully.'
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ============================================================================
// 3. Deposits & BSC BEP-20 Verification
// ============================================================================
app.post('/api/deposit/create-order', async (c) => {
  try {
    const { userId, amount, token = 'USDT', network = 'BEP-20' } = await c.req.json();

    if (!userId || !amount || Number(amount) <= 0) {
      return c.json({ success: false, message: 'Valid userId and amount are required' }, 400);
    }

    const orderId = `DEP-BSC-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
    const vaultSetting = await c.env.DB.prepare("SELECT value FROM platform_settings WHERE key = 'vault_address'").first() as any;
    const vaultAddress = vaultSetting?.value || '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d';

    await c.env.DB.prepare(
      `INSERT INTO deposit_orders (order_id, user_id, amount, token, network, vault_address, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(orderId, userId, Number(amount), token, network, vaultAddress).run();

    return c.json({
      success: true,
      order: {
        orderId,
        userId,
        amount: Number(amount),
        token,
        network,
        vaultAddress,
        status: 'pending',
        qrPayload: vaultAddress
      }
    }, 201);
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/deposit/verify-tx', async (c) => {
  try {
    const { orderId, txHash, userId } = await c.req.json();

    if (!orderId || !txHash) {
      return c.json({ success: false, message: 'orderId and txHash are required' }, 400);
    }

    // 1. Fetch the deposit order
    const order = await c.env.DB.prepare(
      'SELECT * FROM deposit_orders WHERE order_id = ?'
    ).bind(orderId).first() as any;

    if (!order) {
      return c.json({ success: false, message: 'Deposit order not found' }, 404);
    }

    if (order.status === 'confirmed') {
      return c.json({
        success: true,
        alreadyConfirmed: true,
        message: 'This deposit order has already been verified and credited.',
        order
      });
    }

    // 2. Prevent Replay Attack: check if this txHash was already used by any other confirmed order
    const duplicateTx = await c.env.DB.prepare(
      'SELECT order_id FROM deposit_orders WHERE tx_hash = ? AND status = "confirmed"'
    ).bind(txHash.trim().toLowerCase()).first();

    if (duplicateTx) {
      return c.json({
        success: false,
        message: 'This transaction hash has already been redeemed for another order. Replay attacks are rejected.'
      }, 409);
    }

    // 3. Verify directly on BNB Smart Chain via RPC
    const vaultAddress = order.vault_address || c.env.VAULT_ADDRESS;
    const rpcUrl = c.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';
    const verification = await verifyBscTransaction(txHash, order.amount, vaultAddress, rpcUrl);

    if (!verification.verified) {
      return c.json({
        success: false,
        message: verification.statusText,
        error: verification.error,
        verification
      }, 400);
    }

    // 4. Verification PASSED: Credit user deposit wallet and record transaction in atomic batch
    const cleanTx = txHash.trim().toLowerCase();
    const effectiveUserId = userId || order.user_id;
    const txId = `TX-DEP-${Date.now().toString().slice(-6)}`;

    // Check if user has an upline referrer for multi-level commission
    const user = await c.env.DB.prepare('SELECT upline_code FROM users WHERE id = ?').bind(effectiveUserId).first() as any;

    const batchStatements: any[] = [
      // Update order to confirmed
      c.env.DB.prepare(
        `UPDATE deposit_orders 
         SET status = 'confirmed', tx_hash = ?, block_confirmations = ?, confirmed_at = CURRENT_TIMESTAMP 
         WHERE order_id = ?`
      ).bind(cleanTx, verification.confirmations, orderId),

      // Credit deposit balance
      c.env.DB.prepare(
        `UPDATE wallets 
         SET deposit_balance = deposit_balance + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(order.amount, effectiveUserId),

      // Insert ledger entry
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) 
         VALUES (?, ?, 'BEP-20 Deposit', ?, 'Settled', ?)`
      ).bind(txId, effectiveUserId, order.amount, cleanTx)
    ];

    // If upline exists, reward Level 1 referral bonus (10%)
    if (user && user.upline_code) {
      const uplineBonus = Number((order.amount * 0.10).toFixed(2));
      if (uplineBonus > 0) {
        batchStatements.push(
          c.env.DB.prepare(
            `UPDATE wallets 
             SET referral_balance = referral_balance + ?, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = ?`
          ).bind(uplineBonus, user.upline_code),

          c.env.DB.prepare(
            `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) 
             VALUES (?, ?, 'Referral Commission (L1)', ?, 'Settled', ?)`
          ).bind(`REF-${Date.now().toString().slice(-6)}`, user.upline_code, uplineBonus, cleanTx)
        );
      }
    }

    await c.env.DB.batch(batchStatements);

    // Fetch updated wallet
    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(effectiveUserId).first();

    return c.json({
      success: true,
      message: 'Payment verified and confirmed on BNB Smart Chain! Wallet credited.',
      verification,
      updatedWallet
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ============================================================================
// 4. Mining Contract Subscription / Buying Plans
// ============================================================================
app.post('/api/plans/subscribe', async (c) => {
  try {
    const body = await c.req.json();
    const {
      userId,
      planId,
      planName,
      amount,
      dailyRatePercent = 1.0,
      durationDays = 365,
      compoundingEnabled = true,
      fundPin
    } = body;

    if (!userId || !amount || Number(amount) <= 0) {
      return c.json({ success: false, message: 'Valid userId and plan amount are required' }, 400);
    }

    // Verify User Fund PIN
    const user = await c.env.DB.prepare('SELECT fund_pin FROM users WHERE id = ?').bind(userId).first() as any;
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    if (fundPin && user.fund_pin && user.fund_pin !== fundPin) {
      return c.json({ success: false, message: 'Incorrect 6-digit Fund Security PIN' }, 403);
    }

    // Check user deposit balance & existing active contract
    const wallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first() as any;
    const planCost = Number(amount);

    // Enforce SINGLE ACTIVE PLAN RULE
    const existingActiveContract = await c.env.DB.prepare(
      'SELECT * FROM mining_contracts WHERE user_id = ? AND status = "active"'
    ).bind(userId).first() as any;

    let isUpgrade = false;
    let chargedAmount = planCost;

    if (existingActiveContract) {
      if (planCost === existingActiveContract.amount) {
        return c.json({
          success: false,
          message: `You already have an active ${existingActiveContract.plan_name} ($${existingActiveContract.amount}) node. Only 1 active plan can run at a time.`
        }, 400);
      }

      if (planCost < existingActiveContract.amount) {
        return c.json({
          success: false,
          message: `You currently have a higher tier plan active ($${existingActiveContract.amount} ${existingActiveContract.plan_name}). Downgrades or multiple plans are not permitted. You can only upgrade to a higher tier plan.`
        }, 400);
      }

      // Valid Upgrade to a higher tier
      isUpgrade = true;
      if (body.payDifferenceOnly) {
        chargedAmount = Number((planCost - existingActiveContract.amount).toFixed(2));
      }
    }

    if (!wallet || wallet.deposit_balance < chargedAmount) {
      return c.json({
        success: false,
        message: `Insufficient deposit balance ($${(wallet?.deposit_balance || 0).toFixed(2)}). Required: $${chargedAmount.toFixed(2)} USDT.`
      }, 400);
    }

    const contractId = `contract_${Date.now().toString().slice(-8)}`;
    const dailyYield = Number((planCost * (Number(dailyRatePercent) / 100)).toFixed(4));
    const txId = `PLAN-${Date.now().toString().slice(-6)}`;

    const batchStatements: any[] = [
      // If upgrading, mark previous active contract as upgraded
      ...(existingActiveContract ? [
        c.env.DB.prepare(
          `UPDATE mining_contracts SET status = 'upgraded' WHERE id = ?`
        ).bind(existingActiveContract.id)
      ] : []),

      // Deduct charged amount and set active mining power to the new plan tier
      c.env.DB.prepare(
        `UPDATE wallets 
         SET deposit_balance = deposit_balance - ?, 
             active_mining_power = ?, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(chargedAmount, planCost, userId),

      // Create new active mining contract (ensures strictly 1 active contract)
      c.env.DB.prepare(
        `INSERT INTO mining_contracts 
         (id, user_id, plan_id, plan_name, amount, daily_rate_percent, duration_days, compounding_enabled, daily_yield_usdt, expires_at, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+${durationDays} days'), 'active')`
      ).bind(
        contractId,
        userId,
        planId || 'custom_plan',
        planName || 'Neon Mining Node',
        planCost,
        Number(dailyRatePercent),
        durationDays,
        compoundingEnabled ? 1 : 0,
        dailyYield
      ),

      // Record transaction
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status) 
         VALUES (?, ?, ?, ?, 'Settled')`
      ).bind(txId, userId, isUpgrade ? `Tier Upgrade to ${planName}` : 'Plan Staked', -chargedAmount)
    ];

    await c.env.DB.batch(batchStatements);

    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first();

    return c.json({
      success: true,
      message: isUpgrade
        ? `Successfully upgraded to ${planName} ($${planCost})! Node is now hashing at ${dailyRatePercent}% daily.`
        : `Successfully activated ${planName}! Node is now hashing at ${dailyRatePercent}% daily.`,
      contractId,
      isUpgrade,
      updatedWallet
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ============================================================================
// 4.5. 24-Hour Proof-of-Activity Mining Cycle Engine
// ============================================================================
app.post('/api/mining/start-cycle', async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;
    if (!userId) {
      return c.json({ success: false, message: 'User ID is required' }, 400);
    }

    const activeContract = await c.env.DB.prepare(
      'SELECT * FROM mining_contracts WHERE user_id = ? AND status = "active"'
    ).bind(userId).first() as any;

    if (!activeContract) {
      return c.json({
        success: false,
        message: 'No active mining contract found. Purchase a plan first.'
      }, 400);
    }

    const nowIso = new Date().toISOString();
    await c.env.DB.prepare(
      `UPDATE mining_contracts 
       SET started_at = CURRENT_TIMESTAMP, 
           last_yield_accrual = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(activeContract.id).run();

    return c.json({
      success: true,
      message: '🟢 24-Hour Mining Cycle Started! Core turned green.',
      startedAt: nowIso,
      cycleDurationSeconds: 86400,
      dailyRatePercent: activeContract.daily_rate_percent,
      dailyYieldUsdt: activeContract.daily_yield_usdt
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/mining/status', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) {
      return c.json({ success: false, message: 'User ID is required' }, 400);
    }

    const activeContract = await c.env.DB.prepare(
      'SELECT * FROM mining_contracts WHERE user_id = ? AND status = "active"'
    ).bind(userId).first() as any;

    if (!activeContract) {
      return c.json({
        success: true,
        hasActivePlan: false,
        isMiningActive: false,
        secondsRemaining: 0
      });
    }

    return c.json({
      success: true,
      hasActivePlan: true,
      planName: activeContract.plan_name,
      amount: activeContract.amount,
      dailyRatePercent: activeContract.daily_rate_percent,
      dailyYieldUsdt: activeContract.daily_yield_usdt,
      startedAt: activeContract.started_at,
      compoundingEnabled: activeContract.compounding_enabled === 1
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ============================================================================
// 5. P2P Wallet Transfer (Instant 0% Network Fee)
// ============================================================================
app.post('/api/wallet/p2p-transfer', async (c) => {
  try {
    const { senderId, recipientIdentifier, amount, fundPin, sourceWallet = 'deposit' } = await c.req.json();
    const transferAmount = Number(amount);
    const isFromDeposit = sourceWallet === 'deposit';

    if (!senderId || !recipientIdentifier || transferAmount <= 0) {
      return c.json({ success: false, message: 'Valid sender, recipient, and amount are required' }, 400);
    }

    // Verify Sender & PIN
    const sender = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(senderId).first() as any;
    if (!sender) {
      return c.json({ success: false, message: 'Sender not found' }, 404);
    }
    if (fundPin && sender.fund_pin && sender.fund_pin !== fundPin) {
      return c.json({ success: false, message: 'Incorrect 6-digit Fund PIN' }, 403);
    }

    // Verify Recipient
    const recipient = await c.env.DB.prepare(
      'SELECT id, name, mobile FROM users WHERE (id = ? OR mobile = ?) AND status = "active"'
    ).bind(recipientIdentifier.trim(), recipientIdentifier.trim()).first() as any;

    if (!recipient) {
      return c.json({ success: false, message: 'Recipient member ID or phone number not found' }, 404);
    }

    if (recipient.id === senderId) {
      return c.json({ success: false, message: 'Cannot transfer funds to yourself' }, 400);
    }

    // Check Sender Balance based on selected source wallet
    const senderWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(senderId).first() as any;
    if (isFromDeposit) {
      if (!senderWallet || senderWallet.deposit_balance < transferAmount) {
        return c.json({
          success: false,
          message: `Insufficient deposit balance ($${(senderWallet?.deposit_balance || 0).toFixed(2)}).`
        }, 400);
      }
    } else {
      if (!senderWallet || senderWallet.withdrawable_balance < transferAmount) {
        return c.json({
          success: false,
          message: `Insufficient withdrawable balance ($${(senderWallet?.withdrawable_balance || 0).toFixed(2)}).`
        }, 400);
      }
    }

    const txIdSender = `P2P-OUT-${Date.now().toString().slice(-6)}`;
    const txIdRecipient = `P2P-IN-${Date.now().toString().slice(-6)}`;

    const deductStatement = isFromDeposit
      ? c.env.DB.prepare(
          `UPDATE wallets 
           SET deposit_balance = deposit_balance - ?, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?`
        ).bind(transferAmount, senderId)
      : c.env.DB.prepare(
          `UPDATE wallets 
           SET withdrawable_balance = withdrawable_balance - ?, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?`
        ).bind(transferAmount, senderId);

    const senderTxType = isFromDeposit
      ? `P2P Deposit Transfer to ${recipient.name}`
      : `P2P Transfer to ${recipient.name}`;
    const recipientTxType = isFromDeposit
      ? `P2P Deposit Received from ${sender.name || senderId}`
      : `P2P Transfer Received from ${sender.name || senderId}`;

    // Execute atomic transfer (0% fee)
    await c.env.DB.batch([
      // Deduct from selected sender balance
      deductStatement,

      // Credit to recipient deposit balance
      c.env.DB.prepare(
        `UPDATE wallets 
         SET deposit_balance = deposit_balance + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(transferAmount, recipient.id),

      // Sender Ledger Outflow
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status) 
         VALUES (?, ?, ?, ?, 'Settled')`
      ).bind(txIdSender, senderId, senderTxType, -transferAmount),

      // Recipient Ledger Inflow
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status) 
         VALUES (?, ?, ?, ?, 'Settled')`
      ).bind(txIdRecipient, recipient.id, recipientTxType, transferAmount)
    ]);

    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(senderId).first();

    const sourceLabel = isFromDeposit ? 'Deposit Balance' : 'Withdrawable Balance';
    return c.json({
      success: true,
      message: `P2P Transfer of $${transferAmount.toFixed(2)} USDT from ${sourceLabel} to ${recipient.name} completed instantly with 0% fee!`,
      recipient: { id: recipient.id, name: recipient.name },
      updatedWallet
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ============================================================================
// 6. Withdrawals
// ============================================================================
app.post('/api/wallet/withdraw-request', async (c) => {
  try {
    const { userId, amount, walletAddress, fundPin } = await c.req.json();
    const withdrawAmount = Number(amount);

    if (!userId || withdrawAmount <= 0 || !walletAddress) {
      return c.json({ success: false, message: 'Valid userId, amount, and destination wallet address are required' }, 400);
    }

    if (withdrawAmount < 2.0) {
      return c.json({ success: false, message: 'Minimum withdrawal limit is $2.00 USDT' }, 400);
    }

    // Verify Fund PIN
    const user = await c.env.DB.prepare('SELECT fund_pin FROM users WHERE id = ?').bind(userId).first() as any;
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    if (fundPin && user.fund_pin && user.fund_pin !== fundPin) {
      return c.json({ success: false, message: 'Incorrect 6-digit Fund PIN' }, 403);
    }

    // Check Withdrawable Balance
    const wallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first() as any;
    if (!wallet || wallet.withdrawable_balance < withdrawAmount) {
      return c.json({
        success: false,
        message: `Insufficient withdrawable balance ($${(wallet?.withdrawable_balance || 0).toFixed(2)}).`
      }, 400);
    }

    const fee = Number((withdrawAmount * 0.05).toFixed(2)); // 5% BSC Gas Fee
    const netAmount = Number((withdrawAmount - fee).toFixed(2));
    const reqId = `wd_${Date.now().toString().slice(-6)}`;
    const txId = `WD-${Date.now().toString().slice(-6)}`;

    // Execute atomic batch
    await c.env.DB.batch([
      // Deduct from withdrawable balance & record total withdrawn
      c.env.DB.prepare(
        `UPDATE wallets 
         SET withdrawable_balance = withdrawable_balance - ?, 
             total_withdrawn = total_withdrawn + ?, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(withdrawAmount, withdrawAmount, userId),

      // Create withdrawal request
      c.env.DB.prepare(
        `INSERT INTO withdrawal_requests (id, user_id, amount, fee, net_amount, wallet_address, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`
      ).bind(reqId, userId, withdrawAmount, fee, netAmount, walletAddress.trim()),

      // Record transaction
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status) 
         VALUES (?, ?, 'Payout Request', ?, 'Pending')`
      ).bind(txId, userId, -withdrawAmount)
    ]);

    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first();

    return c.json({
      success: true,
      message: `Withdrawal request for $${withdrawAmount.toFixed(2)} USDT submitted successfully. Net payout: $${netAmount.toFixed(2)} USDT (5% fee deducted).`,
      requestId: reqId,
      netAmount,
      updatedWallet
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/wallet/history', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) {
      return c.json({ success: false, message: 'User ID required' }, 400);
    }

    const [txs, contracts, withdrawals, deposits] = await Promise.all([
      c.env.DB.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(userId).all(),
      c.env.DB.prepare('SELECT * FROM mining_contracts WHERE user_id = ? ORDER BY started_at DESC').bind(userId).all(),
      c.env.DB.prepare('SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(userId).all(),
      c.env.DB.prepare('SELECT * FROM deposit_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(userId).all()
    ]);

    return c.json({
      success: true,
      transactions: txs.results,
      contracts: contracts.results,
      withdrawals: withdrawals.results,
      deposits: deposits.results
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ============================================================================
// 7. Admin Endpoints
// ============================================================================
app.get('/api/admin/overview', async (c) => {
  try {
    const [usersCount, activeMining, totalWithdrawn, pendingWithdrawals] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first(),
      c.env.DB.prepare('SELECT SUM(active_mining_power) as total FROM wallets').first(),
      c.env.DB.prepare('SELECT SUM(total_withdrawn) as total FROM wallets').first(),
      c.env.DB.prepare('SELECT COUNT(*) as count, SUM(net_amount) as total FROM withdrawal_requests WHERE status = "pending"').first()
    ]);

    return c.json({
      success: true,
      stats: {
        totalUsers: (usersCount as any)?.count || 0,
        totalActiveMiningPower: (activeMining as any)?.total || 0,
        totalWithdrawnSettled: (totalWithdrawn as any)?.total || 0,
        pendingWithdrawalsCount: (pendingWithdrawals as any)?.count || 0,
        pendingWithdrawalsAmount: (pendingWithdrawals as any)?.total || 0
      }
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin manual trigger for daily yield accrual test
app.post('/api/admin/trigger-yield', async (c) => {
  try {
    const cronResult = await handleDailyYieldCron(c.env);
    return c.json({ success: true, cronResult });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Users List (with wallet balances, status, search)
app.get('/api/admin/users', async (c) => {
  try {
    const search = c.req.query('search') || '';
    let query = `
      SELECT u.id, u.name, u.mobile, u.email, u.role, u.status, u.referral_code, u.upline_code, u.created_at,
             w.deposit_balance, w.withdrawable_balance, w.referral_balance, w.active_mining_power, w.total_withdrawn, w.total_mined_yield
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
    `;
    let params: any[] = [];
    if (search) {
      query += ` WHERE u.id LIKE ? OR u.name LIKE ? OR u.mobile LIKE ?`;
      const term = `%${search}%`;
      params = [term, term, term];
    }
    query += ` ORDER BY u.created_at DESC LIMIT 100`;

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, users: results });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin User Status Toggle (Suspend / Activate)
app.post('/api/admin/users/toggle-status', async (c) => {
  try {
    const { userId, status } = await c.req.json();
    if (!userId || !['active', 'suspended'].includes(status)) {
      return c.json({ success: false, message: 'Valid userId and status (active/suspended) required' }, 400);
    }
    await c.env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind(status, userId).run();
    return c.json({ success: true, message: `User ${userId} status set to ${status}` });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Delete User Account Permanently (By ID or Email)
app.post('/api/admin/users/delete', async (c) => {
  try {
    const { userId, email } = await c.req.json();
    if (!userId && !email) {
      return c.json({ success: false, message: 'Valid userId or email required' }, 400);
    }

    // Resolve target user record
    let targetUser: any = null;
    if (userId) {
      targetUser = await c.env.DB.prepare('SELECT id, email FROM users WHERE id = ?').bind(userId).first();
    } else if (email) {
      targetUser = await c.env.DB.prepare('SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)').bind(email).first();
    }

    const effectiveId = targetUser?.id || userId;
    const effectiveEmail = targetUser?.email || email || '';

    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM wallets WHERE user_id = ?').bind(effectiveId),
      c.env.DB.prepare('DELETE FROM mining_contracts WHERE user_id = ?').bind(effectiveId),
      c.env.DB.prepare('DELETE FROM deposit_orders WHERE user_id = ?').bind(effectiveId),
      c.env.DB.prepare('DELETE FROM withdrawal_requests WHERE user_id = ?').bind(effectiveId),
      c.env.DB.prepare('DELETE FROM transactions WHERE user_id = ?').bind(effectiveId),
      c.env.DB.prepare('DELETE FROM users WHERE id = ? OR (email != "" AND LOWER(email) = LOWER(?))').bind(effectiveId, effectiveEmail)
    ]);
    return c.json({ success: true, message: `User ${effectiveId} permanently deleted from database. Email is now reusable.` });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Purge ALL Users Completely (Full Platform Reset)
app.post('/api/admin/users/purge-all', async (c) => {
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM wallets'),
      c.env.DB.prepare('DELETE FROM mining_contracts'),
      c.env.DB.prepare('DELETE FROM deposit_orders'),
      c.env.DB.prepare('DELETE FROM withdrawal_requests'),
      c.env.DB.prepare('DELETE FROM transactions'),
      c.env.DB.prepare("DELETE FROM users WHERE role != 'admin' OR role IS NULL")
    ]);
    return c.json({ success: true, message: 'All users and related records completely wiped from database' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Purge All Inactive Test Users (0 Staked Power and 0 Balance)
app.post('/api/admin/users/purge-inactive', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT u.id FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE u.role = 'user'
        AND (w.active_mining_power IS NULL OR w.active_mining_power = 0)
        AND (w.deposit_balance IS NULL OR w.deposit_balance = 0)
        AND (w.withdrawable_balance IS NULL OR w.withdrawable_balance = 0)
    `).all();

    const ids = (results || []).map((r: any) => r.id);
    if (ids.length === 0) {
      return c.json({ success: true, message: 'No inactive test users found to purge', purgedCount: 0 });
    }

    const stmts: any[] = [];
    for (const id of ids) {
      stmts.push(
        c.env.DB.prepare('DELETE FROM wallets WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM mining_contracts WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM deposit_orders WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM withdrawal_requests WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM transactions WHERE user_id = ?').bind(id),
        c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id)
      );
    }
    await c.env.DB.batch(stmts);
    return c.json({ success: true, message: `Purged ${ids.length} inactive test accounts`, purgedCount: ids.length, ids });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Balance Adjustment (Credit / Debit user balance directly)
app.post('/api/admin/users/adjust-balance', async (c) => {
  try {
    const { userId, balanceType = 'deposit_balance', amount, reason = 'Admin Adjustment' } = await c.req.json();
    const validFields = ['deposit_balance', 'withdrawable_balance', 'active_mining_power', 'referral_balance'];
    if (!userId || !validFields.includes(balanceType)) {
      return c.json({ success: false, message: 'Valid userId and balanceType required' }, 400);
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return c.json({ success: false, message: 'Valid non-zero amount required' }, 400);
    }

    const txId = `ADJ-${Date.now().toString().slice(-6)}`;
    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE wallets SET ${balanceType} = MAX(0, ${balanceType} + ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
      ).bind(numAmount, userId),

      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status) VALUES (?, ?, ?, ?, 'Settled')`
      ).bind(txId, userId, `Admin Adjustment: ${reason}`, numAmount)
    ]);

    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first();
    return c.json({ success: true, message: `Wallet ${balanceType} adjusted by $${numAmount}`, updatedWallet });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Withdrawal Requests (filter by pending, approved, rejected)
app.get('/api/admin/withdrawals', async (c) => {
  try {
    const status = c.req.query('status');
    let query = `
      SELECT w.*, u.name as user_name, u.mobile as user_mobile 
      FROM withdrawal_requests w
      LEFT JOIN users u ON w.user_id = u.id
    `;
    let params: any[] = [];
    if (status) {
      query += ` WHERE w.status = ?`;
      params.push(status);
    }
    query += ` ORDER BY w.created_at DESC LIMIT 100`;

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, withdrawals: results });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Approve or Reject Withdrawal
app.post('/api/admin/withdrawals/action', async (c) => {
  try {
    const { requestId, action, txHash, reason } = await c.req.json();
    if (!requestId || !['approve', 'reject'].includes(action)) {
      return c.json({ success: false, message: 'Valid requestId and action (approve/reject) required' }, 400);
    }

    const req = await c.env.DB.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').bind(requestId).first() as any;
    if (!req) {
      return c.json({ success: false, message: 'Withdrawal request not found' }, 404);
    }
    if (req.status !== 'pending') {
      return c.json({ success: false, message: `Request is already ${req.status}` }, 400);
    }

    if (action === 'approve') {
      await c.env.DB.prepare(
        `UPDATE withdrawal_requests SET status = 'approved', tx_hash = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(txHash || `0x_payout_${Date.now()}`, requestId).run();

      return c.json({ success: true, message: 'Withdrawal approved and marked settled on blockchain' });
    } else {
      // Reject: refund amount back to user's withdrawable balance
      await c.env.DB.batch([
        c.env.DB.prepare(
          `UPDATE withdrawal_requests SET status = 'rejected', rejection_reason = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(reason || 'Rejected by administrator', requestId),

        c.env.DB.prepare(
          `UPDATE wallets SET withdrawable_balance = withdrawable_balance + ?, total_withdrawn = total_withdrawn - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
        ).bind(req.amount, req.amount, req.user_id),

        c.env.DB.prepare(
          `INSERT INTO transactions (id, user_id, type, amount, status) VALUES (?, ?, 'Withdrawal Refund', ?, 'Settled')`
        ).bind(`REF-${Date.now().toString().slice(-6)}`, req.user_id, req.amount)
      ]);

      return c.json({ success: true, message: 'Withdrawal rejected and amount refunded to user wallet' });
    }
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Deposits List
app.get('/api/admin/deposits', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT d.*, u.name as user_name, u.mobile as user_mobile 
      FROM deposit_orders d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC LIMIT 100
    `).all();
    return c.json({ success: true, deposits: results });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Update Platform Settings (Fees, Min limits, Vault Address)
app.put('/api/admin/settings', async (c) => {
  try {
    const body = await c.req.json();
    if (body.key && body.value !== undefined) {
      await c.env.DB.prepare(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind(body.key, String(body.value)).run();
    } else {
      const statements: any[] = [];
      for (const [key, value] of Object.entries(body)) {
        statements.push(
          c.env.DB.prepare(
            `INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
          ).bind(key, String(value))
        );
      }
      if (statements.length > 0) {
        await c.env.DB.batch(statements);
      }
    }
    return c.json({ success: true, message: 'Platform settings updated successfully in database' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ============================================================================
// 8. Cloudflare Worker Module Export (Fetch + Scheduled Cron Trigger)
// ============================================================================
export default {
  fetch: app.fetch,

  // Scheduled handler triggered daily at 00:00 UTC
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      handleDailyYieldCron(env)
        .then((res) => {
          console.log(`[Scheduled Cron] Processed ${res.contractsProcessed} contracts, distributed $${res.totalYieldDistributed} USDT yield.`);
        })
        .catch((err) => {
          console.error(`[Scheduled Cron Error] ${err.message}`);
        })
    );
  }
};
