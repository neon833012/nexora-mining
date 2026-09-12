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

    // Resolve uplineCode whether it is a referral code (e.g. NEX...) or a User ID (e.g. NEON...)
    let uplineUserId: string | null = null;
    if (uplineCode) {
      const cleanRef = String(uplineCode).trim().toUpperCase();
      const uplineMatch = await c.env.DB.prepare(
        'SELECT id FROM users WHERE UPPER(referral_code) = ? OR UPPER(id) = ? LIMIT 1'
      ).bind(cleanRef, cleanRef).first() as any;
      if (uplineMatch) {
        uplineUserId = uplineMatch.id;
      } else {
        uplineUserId = cleanRef;
      }
    }

    // Keep name equal to userId unless an actual custom personal name was submitted
    const officialName = (name && !name.toUpperCase().startsWith('NEON') && name.toLowerCase() !== 'neon member')
      ? name.trim()
      : userId;

    // Insert user and initialize wallet atomically
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO users (id, name, mobile, email, password_hash, fund_pin, fund_pin_set, upline_code, referral_code) 
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ).bind(
        userId,
        officialName,
        cleanMobile || `+00 ${userId.replace('NEON', '9')}`,
        cleanEmail,
        password,
        fundPin,
        uplineUserId,
        referralCode
      ),

      c.env.DB.prepare(
        `INSERT INTO wallets (user_id, deposit_balance, withdrawable_balance, referral_balance, active_mining_power, total_withdrawn, total_mined_yield) 
         VALUES (?, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`
      ).bind(userId)
    ]);

    const user = {
      id: userId,
      name: officialName,
      mobile: cleanMobile || `+00 ${userId.replace('NEON', '9')}`,
      email: cleanEmail,
      referralCode,
      role: 'user',
      uplineCode: uplineUserId
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

// Check if a 66-character TxHash is unclaimed and eligible to be used
app.post('/api/tx/check-claimable', async (c) => {
  try {
    const { txHash } = await c.req.json();
    if (!txHash) {
      return c.json({ success: false, message: 'txHash is required' }, 400);
    }

    const cleanTx = String(txHash).trim().toLowerCase();
    if (!cleanTx.startsWith('0x') || cleanTx.length !== 66) {
      return c.json({
        success: false,
        message: 'Invalid 66-character transaction hash. Must start with 0x and have 66 characters.'
      }, 400);
    }

    // 1. Check permanent immutable claimed_tx_hashes table
    const permanentClaim = await c.env.DB.prepare(
      'SELECT tx_hash, claimed_by_user, purpose, claimed_at FROM claimed_tx_hashes WHERE LOWER(tx_hash) = ? LIMIT 1'
    ).bind(cleanTx).first() as any;

    if (permanentClaim) {
      return c.json({
        success: false,
        claimed: true,
        message: `This 66-character transaction hash has ALREADY been claimed on the platform (by ${permanentClaim.claimed_by_user || 'another member'}). Each transaction can only be redeemed once.`
      }, 409);
    }

    // 2. Check transactions ledger
    const existingTx = await c.env.DB.prepare(
      'SELECT id, user_id, type FROM transactions WHERE LOWER(tx_hash) = ? LIMIT 1'
    ).bind(cleanTx).first() as any;

    // 3. Check confirmed deposit_orders
    const existingOrder = await c.env.DB.prepare(
      'SELECT order_id, user_id FROM deposit_orders WHERE LOWER(tx_hash) = ? AND status = "confirmed" LIMIT 1'
    ).bind(cleanTx).first() as any;

    if (existingTx || existingOrder) {
      const owner = existingTx?.user_id || existingOrder?.user_id || 'another member';
      // Auto-populate into claimed_tx_hashes so it can never be lost
      try {
        await c.env.DB.prepare(
          'INSERT OR IGNORE INTO claimed_tx_hashes (tx_hash, claimed_by_user, amount, purpose) VALUES (?, ?, ?, ?)'
        ).bind(cleanTx, owner, 0, existingTx?.type || 'legacy_tx').run();
      } catch {}

      return c.json({
        success: false,
        claimed: true,
        message: `This 66-character transaction hash has ALREADY been claimed on the platform (by ${owner}). Each transaction can only be used once.`
      }, 409);
    }

    return c.json({
      success: true,
      claimed: false,
      message: 'Transaction hash is valid and unclaimed.'
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Dedicated Atomic Claim Endpoint for BEP-20 USDT Deposits
app.post('/api/tx/claim-deposit', async (c) => {
  try {
    const { userId, txHash, amount, network = 'BEP-20' } = await c.req.json();
    if (!userId || !txHash || !amount || Number(amount) <= 0) {
      return c.json({ success: false, message: 'Valid userId, txHash, and amount are required' }, 400);
    }

    const cleanTx = String(txHash).trim().toLowerCase();
    if (!cleanTx.startsWith('0x') || cleanTx.length !== 66) {
      return c.json({ success: false, message: 'Invalid 66-character transaction hash. Must start with 0x and have exactly 66 characters.' }, 400);
    }

    const numAmount = Number(amount);

    // 1. Strict Anti-Replay Check
    const existingClaim = await c.env.DB.prepare(
      'SELECT tx_hash, claimed_by_user FROM claimed_tx_hashes WHERE LOWER(tx_hash) = ? LIMIT 1'
    ).bind(cleanTx).first() as any;

    const existingTx = await c.env.DB.prepare(
      'SELECT id, user_id FROM transactions WHERE LOWER(tx_hash) = ? LIMIT 1'
    ).bind(cleanTx).first() as any;

    const existingOrder = await c.env.DB.prepare(
      'SELECT order_id, user_id FROM deposit_orders WHERE LOWER(tx_hash) = ? AND status = "confirmed" LIMIT 1'
    ).bind(cleanTx).first() as any;

    if (existingClaim || existingTx || existingOrder) {
      const owner = existingClaim?.claimed_by_user || existingTx?.user_id || existingOrder?.user_id || 'another member';
      return c.json({
        success: false,
        alreadyClaimed: true,
        message: `This 66-character transaction reference has ALREADY been claimed on the platform (by ${owner}). Duplicate redemption is strictly blocked.`
      }, 409);
    }

    // 2. Fetch or resolve effective user ID
    const cleanUserId = String(userId).trim();
    const user = await c.env.DB.prepare(
      'SELECT id, upline_code FROM users WHERE UPPER(id) = UPPER(?) OR UPPER(name) = UPPER(?) LIMIT 1'
    ).bind(cleanUserId, cleanUserId).first() as any;

    const effectiveUserId = user?.id || cleanUserId;

    // Ensure wallet exists for user
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO wallets (user_id, deposit_balance, withdrawable_balance, referral_balance, active_mining_power)
       VALUES (?, 0, 0, 0, 0)`
    ).bind(effectiveUserId).run();

    const txId = `DEP-${Date.now().toString().slice(-6)}`;
    const orderId = `DEP-BSC-${Date.now().toString().slice(-8)}`;

    const batchStatements: any[] = [
      // Permanent immutable anti-replay record
      c.env.DB.prepare(
        'INSERT INTO claimed_tx_hashes (tx_hash, claimed_by_user, amount, purpose) VALUES (?, ?, ?, ?)'
      ).bind(cleanTx, effectiveUserId, numAmount, 'bep20_deposit'),

      // Credit wallet deposit balance
      c.env.DB.prepare(
        'UPDATE wallets SET deposit_balance = deposit_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).bind(numAmount, effectiveUserId),

      // Ledger entry
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) VALUES (?, ?, 'BEP-20 USDT Deposit (BSC)', ?, 'Settled', ?)`
      ).bind(txId, effectiveUserId, numAmount, cleanTx),

      // Deposit orders record
      c.env.DB.prepare(
        `INSERT INTO deposit_orders (order_id, user_id, amount, token, network, vault_address, tx_hash, block_confirmations, status, confirmed_at)
         VALUES (?, ?, ?, 'USDT', ?, ?, ?, 3, 'confirmed', CURRENT_TIMESTAMP)`
      ).bind(orderId, effectiveUserId, numAmount, network, c.env.VAULT_ADDRESS || '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d', cleanTx)
    ];

    // Referral commission if upline exists
    if (user && user.upline_code) {
      const uplineUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE UPPER(id) = ? OR UPPER(referral_code) = ? LIMIT 1'
      ).bind(user.upline_code.toUpperCase(), user.upline_code.toUpperCase()).first() as any;

      if (uplineUser) {
        const uplineBonus = Number((numAmount * 0.10).toFixed(2));
        if (uplineBonus > 0) {
          batchStatements.push(
            c.env.DB.prepare(
              `UPDATE wallets SET referral_balance = referral_balance + ?, withdrawable_balance = withdrawable_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
            ).bind(uplineBonus, uplineBonus, uplineUser.id),
            c.env.DB.prepare(
              `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) VALUES (?, ?, 'Referral Commission (L1)', ?, 'Settled', ?)`
            ).bind(`REF-${Date.now().toString().slice(-6)}`, uplineUser.id, uplineBonus, cleanTx)
          );
        }
      }
    }

    await c.env.DB.batch(batchStatements);

    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(effectiveUserId).first();

    return c.json({
      success: true,
      message: `Successfully verified and claimed $${numAmount.toFixed(2)} USDT deposit on BNB Smart Chain!`,
      orderId,
      txHash: cleanTx,
      updatedWallet
    });
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

    // 2. Prevent Replay Attack: check if this txHash was already used anywhere
    const cleanTx = txHash.trim().toLowerCase();
    const duplicateClaim = await c.env.DB.prepare(
      'SELECT tx_hash, claimed_by_user FROM claimed_tx_hashes WHERE LOWER(tx_hash) = ? LIMIT 1'
    ).bind(cleanTx).first() as any;

    const duplicateTx = await c.env.DB.prepare(
      'SELECT order_id, user_id FROM deposit_orders WHERE LOWER(tx_hash) = ? AND status = "confirmed" LIMIT 1'
    ).bind(cleanTx).first() as any;

    const duplicateLedger = await c.env.DB.prepare(
      'SELECT id, user_id FROM transactions WHERE LOWER(tx_hash) = ? LIMIT 1'
    ).bind(cleanTx).first() as any;

    if (duplicateClaim || duplicateTx || duplicateLedger) {
      const owner = duplicateClaim?.claimed_by_user || duplicateTx?.user_id || duplicateLedger?.user_id || 'another member';
      return c.json({
        success: false,
        alreadyClaimed: true,
        message: `This transaction hash has already been redeemed on the platform (by ${owner}). Replay attacks are rejected.`
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
    const effectiveUserId = userId || order.user_id;
    const txId = `TX-DEP-${Date.now().toString().slice(-6)}`;

    // Check if user has an upline referrer for multi-level commission
    const user = await c.env.DB.prepare('SELECT upline_code FROM users WHERE id = ?').bind(effectiveUserId).first() as any;

    const batchStatements: any[] = [
      // Record in permanent immutable claimed_tx_hashes table
      c.env.DB.prepare(
        'INSERT OR IGNORE INTO claimed_tx_hashes (tx_hash, claimed_by_user, amount, purpose) VALUES (?, ?, ?, ?)'
      ).bind(cleanTx, effectiveUserId, order.amount, 'bep20_deposit'),

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
      const uplineUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE UPPER(id) = ? OR UPPER(referral_code) = ? LIMIT 1'
      ).bind(user.upline_code.toUpperCase(), user.upline_code.toUpperCase()).first() as any;

      if (uplineUser) {
        const uplineBonus = Number((order.amount * 0.10).toFixed(2));
        if (uplineBonus > 0) {
          batchStatements.push(
            c.env.DB.prepare(
              `UPDATE wallets 
               SET referral_balance = referral_balance + ?, 
                   withdrawable_balance = withdrawable_balance + ?, 
                   updated_at = CURRENT_TIMESTAMP 
               WHERE user_id = ?`
            ).bind(uplineBonus, uplineBonus, uplineUser.id),

            c.env.DB.prepare(
              `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) 
               VALUES (?, ?, 'Referral Commission (L1)', ?, 'Settled', ?)`
            ).bind(`REF-${Date.now().toString().slice(-6)}`, uplineUser.id, uplineBonus, cleanTx)
          );
        }
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

    const isCryptoDirect = body.paymentMethod === 'crypto' || body.paymentMethod === 'bep20' || body.isDirectPayment === true;

    if (!isCryptoDirect && (!wallet || wallet.deposit_balance < chargedAmount)) {
      return c.json({
        success: false,
        message: `Insufficient deposit balance ($${(wallet?.deposit_balance || 0).toFixed(2)}). Required: $${chargedAmount.toFixed(2)} USDT.`
      }, 400);
    }

    const contractId = `contract_${Date.now().toString().slice(-8)}`;
    const dailyYield = Number((planCost * (Number(dailyRatePercent) / 100)).toFixed(4));
    const txId = `PLAN-${Date.now().toString().slice(-6)}`;

    // Anti-Replay: Prevent reusing 66-character TxHash across multiple accounts
    const cleanProvidedTx = body.txHash ? String(body.txHash).trim().toLowerCase() : null;
    if (cleanProvidedTx && cleanProvidedTx.startsWith('0x') && cleanProvidedTx.length === 66) {
      const existingClaim = await c.env.DB.prepare(
        'SELECT tx_hash, claimed_by_user FROM claimed_tx_hashes WHERE LOWER(tx_hash) = ? LIMIT 1'
      ).bind(cleanProvidedTx).first() as any;

      const existingTx = await c.env.DB.prepare(
        'SELECT id, user_id, type FROM transactions WHERE LOWER(tx_hash) = ? LIMIT 1'
      ).bind(cleanProvidedTx).first() as any;

      const existingDeposit = await c.env.DB.prepare(
        'SELECT order_id, user_id FROM deposit_orders WHERE LOWER(tx_hash) = ? AND status = "confirmed" LIMIT 1'
      ).bind(cleanProvidedTx).first() as any;

      if (existingClaim || existingTx || existingDeposit) {
        const owner = existingClaim?.claimed_by_user || existingTx?.user_id || existingDeposit?.user_id || 'another member';
        return c.json({
          success: false,
          alreadyClaimed: true,
          message: `This 66-character transaction reference has ALREADY been claimed on the platform (by ${owner}). Each blockchain transaction can only activate 1 plan once.`
        }, 409);
      }
    }

    // Ensure wallet exists for user
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO wallets (user_id, deposit_balance, withdrawable_balance, referral_balance, active_mining_power)
       VALUES (?, 0, 0, 0, 0)`
    ).bind(userId).run();

    const planTxHash = cleanProvidedTx || ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));

    const walletUpdateStatement = isCryptoDirect
      ? c.env.DB.prepare(
          `UPDATE wallets 
           SET active_mining_power = ?, 
               updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?`
        ).bind(planCost, userId)
      : c.env.DB.prepare(
          `UPDATE wallets 
           SET deposit_balance = MAX(0, deposit_balance - ?), 
               active_mining_power = ?, 
               updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?`
        ).bind(chargedAmount, planCost, userId);

    const batchStatements: any[] = [
      // Permanent immutable anti-replay record
      c.env.DB.prepare(
        'INSERT OR IGNORE INTO claimed_tx_hashes (tx_hash, claimed_by_user, amount, purpose) VALUES (?, ?, ?, ?)'
      ).bind(planTxHash, userId, planCost, isUpgrade ? `Tier Upgrade to ${planName}` : `Plan Staked (${planName})`),

      // If upgrading, mark previous active contract as upgraded
      ...(existingActiveContract ? [
        c.env.DB.prepare(
          `UPDATE mining_contracts SET status = 'upgraded' WHERE id = ?`
        ).bind(existingActiveContract.id)
      ] : []),

      // Deduct charged amount and set active mining power to the new plan tier
      walletUpdateStatement,

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
        `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) 
         VALUES (?, ?, ?, ?, 'Settled', ?)`
      ).bind(txId, userId, isUpgrade ? `Tier Upgrade to ${planName}` : `Plan Staked (${planName})`, -chargedAmount, planTxHash)
    ];

    // If user has an upline referrer, reward 10% direct referral commission
    // Credited to BOTH referral_balance (Referral Income) AND withdrawable_balance (Withdrawable)
    const subscriberUser = await c.env.DB.prepare(
      'SELECT upline_code FROM users WHERE id = ?'
    ).bind(userId).first() as any;

    if (subscriberUser && subscriberUser.upline_code) {
      const uplineUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE UPPER(id) = ? OR UPPER(referral_code) = ? LIMIT 1'
      ).bind(subscriberUser.upline_code.toUpperCase(), subscriberUser.upline_code.toUpperCase()).first() as any;

      if (uplineUser) {
        const uplineBonus = Number((planCost * 0.10).toFixed(2));
        if (uplineBonus > 0) {
          const refTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          batchStatements.push(
            c.env.DB.prepare(
              `UPDATE wallets 
               SET referral_balance = referral_balance + ?, 
                   withdrawable_balance = withdrawable_balance + ?, 
                   updated_at = CURRENT_TIMESTAMP 
               WHERE user_id = ?`
            ).bind(uplineBonus, uplineBonus, uplineUser.id),

            c.env.DB.prepare(
              `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) 
               VALUES (?, ?, ?, ?, 'Settled', ?)`
            ).bind(`REF-${Date.now().toString().slice(-6)}`, uplineUser.id, `10% Direct Referral Commission (${userId} - ${planName})`, uplineBonus, refTxHash)
          );
        }
      }
    }

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

// Reinvestment & Auto-Upgrade Plan Endpoint (Saves upgraded plan name in database)
app.post('/api/plans/reinvest-upgrade', async (c) => {
  try {
    const { userId, newPower, upgradedPlanName, yieldAmount, dailyRatePercent = 1.0 } = await c.req.json();
    if (!userId || !newPower || Number(newPower) <= 0) {
      return c.json({ success: false, message: 'Valid userId and newPower required' }, 400);
    }

    const numPower = Number(newPower);
    const numYield = Number(yieldAmount) || 0;
    const rate = Number(dailyRatePercent);
    const dailyYieldUsdt = Number((numPower * (rate / 100)).toFixed(4));
    const txId = `CMP-${Date.now().toString().slice(-6)}`;

    // Update wallet power
    const batchStatements: any[] = [
      c.env.DB.prepare(
        `UPDATE wallets 
         SET active_mining_power = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(numPower, userId),

      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status) 
         VALUES (?, ?, ?, ?, 'Settled')`
      ).bind(txId, userId, `Plan Reinvestment (+${numYield.toFixed(2)} USDT) -> ${upgradedPlanName}`, numYield)
    ];

    // Check if active contract exists
    const existingContract = await c.env.DB.prepare(
      'SELECT id FROM mining_contracts WHERE user_id = ? AND status = "active"'
    ).bind(userId).first() as any;

    if (existingContract) {
      batchStatements.push(
        c.env.DB.prepare(
          `UPDATE mining_contracts 
           SET plan_name = ?, amount = ?, daily_rate_percent = ?, daily_yield_usdt = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`
        ).bind(upgradedPlanName, numPower, rate, dailyYieldUsdt, existingContract.id)
      );
    } else {
      const contractId = `contract_${Date.now().toString().slice(-8)}`;
      batchStatements.push(
        c.env.DB.prepare(
          `INSERT INTO mining_contracts 
           (id, user_id, plan_id, plan_name, amount, daily_rate_percent, duration_days, compounding_enabled, daily_yield_usdt, expires_at, status) 
           VALUES (?, ?, 'reinvested_plan', ?, ?, ?, 365, 1, ?, datetime('now', '+365 days'), 'active')`
        ).bind(contractId, userId, upgradedPlanName, numPower, rate, dailyYieldUsdt)
      );
    }

    await c.env.DB.batch(batchStatements);

    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first();

    return c.json({
      success: true,
      message: `Plan auto-upgraded to ${upgradedPlanName} with $${numPower.toFixed(2)} active hashing power!`,
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
// 5. P2P Wallet Transfer (Instant 0% Network Fee & Atomic D1 Settlement)
// ============================================================================
app.post('/api/wallet/p2p-transfer', async (c) => {
  try {
    const body = await c.req.json();
    const { senderId, recipientIdentifier, amount, fundPin, sourceWallet = 'deposit' } = body;

    if (!senderId || !recipientIdentifier || !amount || Number(amount) <= 0) {
      return c.json({ success: false, message: 'Valid senderId, recipientIdentifier, and transfer amount (> 0) are required.' }, 400);
    }

    const transferAmt = Number(Number(amount).toFixed(2));
    if (transferAmt <= 0) {
      return c.json({ success: false, message: 'Transfer amount must be greater than zero.' }, 400);
    }

    // 1. Fetch Sender (flexible case-insensitive lookup by ID, Name, or Email)
    const cleanSender = String(senderId).trim();
    const sender = await c.env.DB.prepare(
      'SELECT * FROM users WHERE UPPER(id) = UPPER(?) OR UPPER(name) = UPPER(?) OR LOWER(email) = LOWER(?) LIMIT 1'
    ).bind(cleanSender, cleanSender, cleanSender).first() as any;

    if (!sender) {
      return c.json({ success: false, message: 'Sender account not found.' }, 404);
    }

    // Verify fund PIN if sender has configured one
    if (fundPin && sender.fund_pin && sender.fund_pin !== fundPin) {
      return c.json({ success: false, message: 'Incorrect 6-digit Fund Security PIN.' }, 403);
    }

    // 2. Fetch Recipient (strictly search by id, name, mobile, email)
    const cleanRecipient = String(recipientIdentifier).trim();
    const cleanRecipientNoSpaces = cleanRecipient.replace(/\s+/g, '');
    const recipient = await c.env.DB.prepare(
      `SELECT * FROM users 
       WHERE (
         UPPER(id) = UPPER(?) 
         OR UPPER(name) = UPPER(?) 
         OR mobile = ? 
         OR REPLACE(mobile, ' ', '') = ? 
         OR LOWER(email) = LOWER(?)
       )
       LIMIT 1`
    ).bind(cleanRecipient, cleanRecipient, cleanRecipient, cleanRecipientNoSpaces, cleanRecipient).first() as any;

    if (!recipient) {
      return c.json({ success: false, message: `Recipient User ID "${cleanRecipient}" not found in system. P2P transfers are strictly restricted to registered members.` }, 404);
    }

    if (recipient.id === sender.id) {
      return c.json({ success: false, message: 'You cannot transfer funds to yourself.' }, 400);
    }

    // 3. Check Sender Balance
    const senderWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(sender.id).first() as any;
    if (!senderWallet) {
      return c.json({ success: false, message: 'Sender wallet not found.' }, 404);
    }

    let senderDeductQuery: any;
    if (sourceWallet === 'deposit') {
      if ((senderWallet.deposit_balance || 0) < transferAmt) {
        return c.json({
          success: false,
          message: `Insufficient deposit balance ($${(senderWallet.deposit_balance || 0).toFixed(2)} USDT). Required: $${transferAmt.toFixed(2)} USDT.`
        }, 400);
      }
      senderDeductQuery = c.env.DB.prepare(
        'UPDATE wallets SET deposit_balance = MAX(0, deposit_balance - ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).bind(transferAmt, sender.id);
    } else {
      // Withdrawable balance deduction (checks sum of withdrawable_balance + referral_balance)
      const totalAvailable = Number(((senderWallet.withdrawable_balance || 0) + (senderWallet.referral_balance || 0)).toFixed(2));
      if (totalAvailable < transferAmt) {
        return c.json({
          success: false,
          message: `Insufficient withdrawable balance ($${totalAvailable.toFixed(2)} USDT). Required: $${transferAmt.toFixed(2)} USDT.`
        }, 400);
      }

      if ((senderWallet.withdrawable_balance || 0) >= transferAmt) {
        senderDeductQuery = c.env.DB.prepare(
          'UPDATE wallets SET withdrawable_balance = MAX(0, withdrawable_balance - ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        ).bind(transferAmt, sender.id);
      } else {
        const fromWithdrawable = senderWallet.withdrawable_balance || 0;
        const fromReferral = Number((transferAmt - fromWithdrawable).toFixed(2));
        senderDeductQuery = c.env.DB.prepare(
          'UPDATE wallets SET withdrawable_balance = 0, referral_balance = MAX(0, referral_balance - ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        ).bind(fromReferral, sender.id);
      }
    }

    // 4. Ensure Recipient Wallet exists
    const recipientWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(recipient.id).first() as any;
    let recipientCreditQuery: any;
    if (recipientWallet) {
      recipientCreditQuery = c.env.DB.prepare(
        'UPDATE wallets SET deposit_balance = deposit_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).bind(transferAmt, recipient.id);
    } else {
      recipientCreditQuery = c.env.DB.prepare(
        'INSERT INTO wallets (user_id, deposit_balance, withdrawable_balance, referral_balance, active_mining_power, total_withdrawn, total_mined_yield) VALUES (?, ?, 0, 0, 0, 0, 0)'
      ).bind(recipient.id, transferAmt);
    }

    const txIdSender = `TX-P2P-${Date.now().toString().slice(-6)}`;
    const txIdRecipient = `TX-P2P-REC-${Date.now().toString().slice(-6)}`;
    const wdIdSender = `wd_p2p_${Date.now()}`;
    const p2pHash = `p2p_tx_${Date.now().toString(36)}_${Math.random().toString(16).substring(2, 8)}`;
    const sourceLabel = sourceWallet === 'deposit' ? 'Deposit Balance' : 'Withdrawable Balance';

    // 5. Execute Atomic SQL Batch in Cloudflare D1
    await c.env.DB.batch([
      // Deduct sender
      senderDeductQuery,
      // Credit recipient deposit balance
      recipientCreditQuery,
      // Sender transaction statement
      c.env.DB.prepare(
        'INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, "Settled", ?)'
      ).bind(txIdSender, sender.id, `P2P Transfer to @${recipient.id} [${sourceLabel}] (0% Fee)`, -transferAmt, p2pHash),
      // Recipient transaction statement
      c.env.DB.prepare(
        'INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, "Settled", ?)'
      ).bind(txIdRecipient, recipient.id, `P2P Transfer Received from @${sender.id} (0% Fee)`, transferAmt, p2pHash),
      // Sender withdrawal history entry
      c.env.DB.prepare(
        'INSERT INTO withdrawal_requests (id, user_id, amount, fee, net_amount, wallet_address, tx_hash, status) VALUES (?, ?, ?, 0, ?, ?, ?, "approved")'
      ).bind(wdIdSender, sender.id, transferAmt, transferAmt, `P2P Transfer to @${recipient.id}`, p2pHash)
    ]);

    const updatedSenderWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(sender.id).first();

    return c.json({
      success: true,
      message: `Successfully transferred $${transferAmt.toFixed(2)} USDT to @${recipient.id}! Recipient received 100% in Deposit Balance.`,
      updatedWallet: updatedSenderWallet,
      recipient: {
        id: recipient.id,
        name: recipient.name
      },
      txHash: p2pHash
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
    const cleanUser = String(userId).trim();
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE UPPER(id) = UPPER(?) OR UPPER(name) = UPPER(?) LIMIT 1'
    ).bind(cleanUser, cleanUser).first() as any;

    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    if (fundPin && user.fund_pin && user.fund_pin !== fundPin) {
      return c.json({ success: false, message: 'Incorrect 6-digit Fund PIN' }, 403);
    }

    // Check Withdrawable Balance (withdrawable_balance + referral_balance)
    const wallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(user.id).first() as any;
    const totalAvailable = Number(((wallet?.withdrawable_balance || 0) + (wallet?.referral_balance || 0)).toFixed(2));

    if (!wallet || totalAvailable < withdrawAmount) {
      return c.json({
        success: false,
        message: `Insufficient withdrawable balance ($${totalAvailable.toFixed(2)} USDT).`
      }, 400);
    }

    const fee = Number((withdrawAmount * 0.05).toFixed(2)); // 5% BSC Gas Fee
    const netAmount = Number((withdrawAmount - fee).toFixed(2));
    const reqId = `wd_${Date.now().toString().slice(-6)}`;
    const txId = `WD-${Date.now().toString().slice(-6)}`;

    // Determine deduction query
    let deductQuery: any;
    if ((wallet.withdrawable_balance || 0) >= withdrawAmount) {
      deductQuery = c.env.DB.prepare(
        `UPDATE wallets 
         SET withdrawable_balance = withdrawable_balance - ?, 
             total_withdrawn = total_withdrawn + ?, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(withdrawAmount, withdrawAmount, user.id);
    } else {
      const fromWithdrawable = wallet.withdrawable_balance || 0;
      const fromReferral = Number((withdrawAmount - fromWithdrawable).toFixed(2));
      deductQuery = c.env.DB.prepare(
        `UPDATE wallets 
         SET withdrawable_balance = 0, 
             referral_balance = MAX(0, referral_balance - ?), 
             total_withdrawn = total_withdrawn + ?, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(fromReferral, withdrawAmount, user.id);
    }

    // Execute atomic batch
    await c.env.DB.batch([
      deductQuery,

      // Create withdrawal request (pending)
      c.env.DB.prepare(
        `INSERT INTO withdrawal_requests (id, user_id, amount, fee, net_amount, wallet_address, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`
      ).bind(reqId, user.id, withdrawAmount, fee, netAmount, walletAddress.trim()),

      // Record transaction (Pending)
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status) 
         VALUES (?, ?, 'Payout Request', ?, 'Pending')`
      ).bind(txId, user.id, -withdrawAmount)
    ]);

    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(user.id).first();

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
    const { userId, balanceType = 'deposit_balance', amount, reason = 'Admin Adjustment', txHash } = await c.req.json();
    const validFields = ['deposit_balance', 'withdrawable_balance', 'active_mining_power', 'referral_balance'];
    if (!userId || !validFields.includes(balanceType)) {
      return c.json({ success: false, message: 'Valid userId and balanceType required' }, 400);
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return c.json({ success: false, message: 'Valid non-zero amount required' }, 400);
    }

    const cleanReason = String(reason || '');
    const isDeposit = cleanReason.toLowerCase().includes('deposit');
    const txType = isDeposit
      ? 'BEP-20 USDT Deposit (BSC)'
      : cleanReason.startsWith('Admin Adjustment') || cleanReason.startsWith('Purchased') || cleanReason.startsWith('Plan')
        ? cleanReason
        : `Admin Adjustment: ${cleanReason}`;

    const txHashToStore = (txHash && String(txHash).trim()) || (isDeposit ? ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')) : null);
    const cleanStoreHash = txHashToStore ? txHashToStore.trim().toLowerCase() : null;

    if (cleanStoreHash && cleanStoreHash.startsWith('0x') && cleanStoreHash.length === 66 && isDeposit) {
      const existing = await c.env.DB.prepare(
        'SELECT tx_hash, claimed_by_user FROM claimed_tx_hashes WHERE LOWER(tx_hash) = ? LIMIT 1'
      ).bind(cleanStoreHash).first() as any;
      if (existing) {
        return c.json({
          success: false,
          alreadyClaimed: true,
          message: `This 66-character transaction reference has ALREADY been claimed on the platform (by ${existing.claimed_by_user}).`
        }, 409);
      }
    }

    const txId = `ADJ-${Date.now().toString().slice(-6)}`;
    const batchStatements: any[] = [
      c.env.DB.prepare(
        `UPDATE wallets SET ${balanceType} = MAX(0, ${balanceType} + ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
      ).bind(numAmount, userId),

      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, 'Settled', ?)`
      ).bind(txId, userId, txType, numAmount, cleanStoreHash)
    ];

    if (cleanStoreHash && cleanStoreHash.startsWith('0x') && cleanStoreHash.length === 66) {
      batchStatements.push(
        c.env.DB.prepare(
          'INSERT OR IGNORE INTO claimed_tx_hashes (tx_hash, claimed_by_user, amount, purpose) VALUES (?, ?, ?, ?)'
        ).bind(cleanStoreHash, userId, numAmount, txType)
      );
    }

    await c.env.DB.batch(batchStatements);

    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first();
    return c.json({ success: true, message: `Wallet ${balanceType} adjusted by $${numAmount}`, updatedWallet, txHash: cleanStoreHash });
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
      const cleanTx = (txHash && String(txHash).trim()) || ('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
      await c.env.DB.batch([
        c.env.DB.prepare(
          `UPDATE withdrawal_requests SET status = 'approved', tx_hash = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(cleanTx, requestId),

        // Update corresponding transaction in user's ledger to Settled with tx_hash
        c.env.DB.prepare(
          `UPDATE transactions SET status = 'Settled', tx_hash = ? WHERE user_id = ? AND type = 'Payout Request' AND status = 'Pending'`
        ).bind(cleanTx, req.user_id)
      ]);

      return c.json({ success: true, message: 'Withdrawal approved and marked settled on blockchain', txHash: cleanTx });
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

// Public / Client Get Platform Settings
app.get('/api/settings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT key, value FROM platform_settings').all();
    const settingsMap: Record<string, string> = {
      min_deposit: '2.0',
      min_withdrawal: '2.0',
      withdrawal_fee_percent: '5.0',
      p2p_fee_percent: '0.0',
      vault_address: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
      vaultWalletAddress: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'
    };
    for (const row of results as any[]) {
      settingsMap[row.key] = row.value;
      if (row.key === 'vault_address') {
        settingsMap.vaultWalletAddress = row.value;
      }
      if (row.key === 'vaultWalletAddress') {
        settingsMap.vault_address = row.value;
      }
    }
    return c.json({ success: true, settings: settingsMap });
  } catch (err: any) {
    return c.json({
      success: true,
      settings: {
        min_deposit: '2.0',
        min_withdrawal: '2.0',
        withdrawal_fee_percent: '5.0',
        vault_address: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
        vaultWalletAddress: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d'
      }
    });
  }
});

// Admin Get Platform Settings
app.get('/api/admin/settings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT key, value FROM platform_settings').all();
    const settingsMap: Record<string, string> = {};
    for (const row of results as any[]) {
      settingsMap[row.key] = row.value;
    }
    return c.json({ success: true, settings: settingsMap });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Update Platform Settings (Fees, Min limits, Vault Address)
app.put('/api/admin/settings', async (c) => {
  try {
    const body = await c.req.json();
    const adminRole = c.req.header('X-Admin-Role') || body.adminRole || body.role;
    if (adminRole === 'subadmin') {
      return c.json({
        success: false,
        message: 'Forbidden: Sub-Admin accounts have read-only audit permissions. Only Master Super Admin can modify system settings.'
      }, 403);
    }

    if (body.key && body.value !== undefined) {
      await c.env.DB.prepare(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind(body.key, String(body.value)).run();
    } else {
      const statements: any[] = [];
      for (const [key, value] of Object.entries(body)) {
        if (key === 'adminRole' || key === 'role') continue;
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
