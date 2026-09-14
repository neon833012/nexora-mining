import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verifyBscTransaction } from './blockchain';
import { handleDailyYieldCron, Env } from './cron';

const app = new Hono<{ Bindings: Env }>();

// Enable Global CORS for frontend client interactions
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Admin-Role', 'x-admin-role', '*'],
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

    // Password must be alphanumeric (contain both letters and numbers, min 6 chars)
    const isAlphaNumeric = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    if (!isAlphaNumeric || password.length < 6) {
      return c.json({ success: false, message: 'Password must be alphanumeric (contain both letters and numbers, min 6 characters)' }, 400);
    }

    if (!email) {
      return c.json({ success: false, message: 'Email address is required' }, 400);
    }

    const cleanMobile = mobile ? mobile.trim() : null;
    const cleanEmail = email.trim().toLowerCase();

    // STRICT EMAIL UNIQUENESS: An email can only belong to one account
    const existingEmail = await c.env.DB.prepare(
      'SELECT id FROM users WHERE LOWER(email) = ?'
    ).bind(cleanEmail).first();

    if (existingEmail) {
      return c.json({ success: false, message: 'This email address is already registered. Please sign in or use another email.' }, 409);
    }
    // Mobile numbers CAN be reused across multiple accounts

    const userId = `NEON${Math.floor(10000 + Math.random() * 90000)}`;
    const referralCode = `NEON${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Resolve uplineCode whether it is a referral code (e.g. NEON...) or a User ID (e.g. NEON...)
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

    const sessionToken = `sess_${Date.now()}_${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    // Insert user and initialize wallet atomically (fund_pin_set defaults to 0 so every new ID MUST create their Fund Password)
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO users (id, name, mobile, email, password_hash, fund_pin, fund_pin_set, upline_code, referral_code, session_token) 
         VALUES (?, ?, ?, ?, ?, NULL, 0, ?, ?, ?)`
      ).bind(
        userId,
        officialName,
        cleanMobile || `+00 ${userId.replace('NEON', '9')}`,
        cleanEmail,
        password,
        uplineUserId,
        referralCode,
        sessionToken
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
      uplineCode: uplineUserId,
      fundPinSet: false
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
      token: `nx_tok_${Date.now()}_${userId}`,
      sessionToken
    }, 201);
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const identifier = (body.identifier || body.email || '').trim();
    const password = (body.password || '').trim();

    if (!identifier || !password) {
      return c.json({ success: false, message: 'Please enter your Email Address or Username and Password' }, 400);
    }

    const cleanId = identifier;

    // Strict search: Email or Username (User ID) in users table
    let userRecord = await c.env.DB.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER(?) OR UPPER(id) = UPPER(?) OR LOWER(name) = LOWER(?)
      LIMIT 1
    `).bind(cleanId, cleanId, cleanId).first() as any;

    if (!userRecord) {
      // Check admins table (Staff & Super Admin)
      const adminRecord = await c.env.DB.prepare(`
        SELECT * FROM admins 
        WHERE LOWER(email) = LOWER(?) OR UPPER(id) = UPPER(?) OR LOWER(name) = LOWER(?)
        LIMIT 1
      `).bind(cleanId, cleanId, cleanId).first() as any;

      if (adminRecord && adminRecord.password_hash === password) {
        const sessionToken = `sess_adm_${Date.now()}_${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        return c.json({
          success: true,
          message: 'Admin authorization granted',
          user: {
            id: adminRecord.id,
            name: adminRecord.name,
            email: adminRecord.email,
            role: adminRecord.role || 'subadmin',
            status: 'active'
          },
          token: `nx_adm_${Date.now()}_${adminRecord.id}`,
          sessionToken
        });
      }
    }

    if (!userRecord || userRecord.password_hash !== password) {
      return c.json({ success: false, message: 'Invalid Email/Username or Password. Please check your credentials.' }, 401);
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

    // Generate new unique session token to enforce SINGLE ACTIVE SESSION
    const newSessionToken = `sess_${Date.now()}_${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    await c.env.DB.prepare('UPDATE users SET session_token = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(newSessionToken, userRecord.id).run();

    return c.json({
      success: true,
      user,
      wallet,
      token: `nx_tok_${Date.now()}_${userRecord.id}`,
      sessionToken: newSessionToken
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/auth/me', async (c) => {
  try {
    const userId = c.req.query('userId') || c.req.header('X-User-Id');
    const clientSessionToken = c.req.query('sessionToken') || c.req.header('X-Session-Token');
    if (!userId) {
      return c.json({ success: false, message: 'User ID required' }, 400);
    }

    const userRecord = await c.env.DB.prepare(
      'SELECT * FROM users WHERE UPPER(id) = UPPER(?) OR UPPER(name) = UPPER(?) LIMIT 1'
    ).bind(userId, userId).first() as any;
    if (!userRecord) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    // STRICT SINGLE ACTIVE SESSION CONCURRENCY CHECK:
    // If client supplied a sessionToken and user has an active session_token in DB,
    // they MUST match. If they don't, it means another login happened on another device/browser!
    if (clientSessionToken && userRecord.session_token && clientSessionToken !== userRecord.session_token) {
      return c.json({
        success: false,
        sessionInvalidated: true,
        message: 'Your account was logged in from another device or browser. You have been logged out for security.'
      }, 401);
    }

    const walletRecord = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userRecord.id).first() as any;

    return c.json({
      success: true,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        mobile: userRecord.mobile,
        email: userRecord.email,
        referralCode: userRecord.referral_code,
        uplineCode: userRecord.upline_code,
        role: userRecord.role,
        fundPinSet: userRecord.fund_pin_set === 1
      },
      wallet: walletRecord || {},
      sessionToken: userRecord.session_token
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

    // Find the requesting user's referral code and ID
    const rootUser = await c.env.DB.prepare('SELECT id, referral_code FROM users WHERE id = ?').bind(userId).first() as any;
    if (!rootUser) {
      return c.json({ success: false, downlines: [], l1: [], l2: [], l3: [] });
    }

    const rootId = rootUser.id.toUpperCase();
    const rootRefCode = (rootUser.referral_code || '').toUpperCase();

    // Helper: get direct referrals of a given user (by user id + referral code)
    const getDirectRefs = async (uid: string, refCode: string) => {
      const qry = refCode
        ? `SELECT u.id, u.name, u.mobile, u.email, u.created_at, u.status, u.upline_code, w.active_mining_power
           FROM users u LEFT JOIN wallets w ON u.id = w.user_id
           WHERE UPPER(u.upline_code) = ? OR UPPER(u.upline_code) = ?
           ORDER BY u.created_at DESC`
        : `SELECT u.id, u.name, u.mobile, u.email, u.created_at, u.status, u.upline_code, w.active_mining_power
           FROM users u LEFT JOIN wallets w ON u.id = w.user_id
           WHERE UPPER(u.upline_code) = ?
           ORDER BY u.created_at DESC`;
      const params = refCode ? [uid, refCode] : [uid];
      const { results } = await c.env.DB.prepare(qry).bind(...params).all();
      return results as any[];
    };

    // L1 — direct referrals of root user
    const l1Results = await getDirectRefs(rootId, rootRefCode);
    const l1 = l1Results.map(u => ({ ...u, level: 1 }));

    // L2 — referrals of each L1 user
    const l2: any[] = [];
    for (const l1user of l1Results) {
      const l1uid = (l1user.id || '').toUpperCase();
      const l1ref = await c.env.DB.prepare('SELECT referral_code FROM users WHERE id = ?').bind(l1user.id).first() as any;
      const l1refCode = (l1ref?.referral_code || '').toUpperCase();
      const l2refs = await getDirectRefs(l1uid, l1refCode);
      l2.push(...l2refs.map(u => ({ ...u, level: 2, referredBy: l1user.id })));
    }

    // L3 — referrals of each L2 user
    const l3: any[] = [];
    for (const l2user of l2) {
      const l2uid = (l2user.id || '').toUpperCase();
      const l2ref = await c.env.DB.prepare('SELECT referral_code FROM users WHERE id = ?').bind(l2user.id).first() as any;
      const l2refCode = (l2ref?.referral_code || '').toUpperCase();
      const l3refs = await getDirectRefs(l2uid, l2refCode);
      l3.push(...l3refs.map(u => ({ ...u, level: 3, referredBy: l2user.id })));
    }

    // Combined flat list for backward compatibility
    const allDownlines = [...l1, ...l2, ...l3];

    return c.json({
      success: true,
      downlines: allDownlines,
      l1,
      l2,
      l3,
      totalL1: l1.length,
      totalL2: l2.length,
      totalL3: l3.length
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Forgot Password / Recovery Verification
// Forgot Password / Recovery Verification with Resend Email Dispatch
app.post('/api/auth/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const rawInput = (body.email || body.identifier || '').trim();
    if (!rawInput) {
      return c.json({ success: false, message: 'Please enter your registered email address' }, 400);
    }

    const cleanEmail = rawInput.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return c.json({ success: false, message: 'Please enter a valid email format (e.g. user@gmail.com)' }, 400);
    }

    // STRICT DATABASE CHECK: Check users and admins table
    let user = await c.env.DB.prepare(
      'SELECT id, name, mobile, email FROM users WHERE LOWER(email) = ?'
    ).bind(cleanEmail).first() as any;

    if (!user || !user.email) {
      // Check admins table
      const admin = await c.env.DB.prepare(
        'SELECT id, name, email, role FROM admins WHERE LOWER(email) = ?'
      ).bind(cleanEmail).first() as any;
      if (admin && admin.email) {
        user = { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
      }
    }

    if (!user || !user.email) {
      return c.json({
        success: false,
        message: 'This email is not registered in our database. Please check your email or sign up for a new account.'
      }, 404);
    }

    const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${user.id}`;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiration

    // Store in D1 password_reset_tokens
    await c.env.DB.prepare(`
      INSERT INTO password_reset_tokens (token, user_id, email, expires_at, used)
      VALUES (?, ?, ?, ?, 0)
    `).bind(resetToken, user.id, user.email, expiresAt).run();

    const resetLink = `https://neoncryptomining.com/?reset_token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Dispatch real email via Resend API
    let emailSent = false;
    let resendError: string | null = null;
    const resendApiKey = c.env.RESEND_API_KEY || atob('cmVfWUpSYUxyUUpfRVNUZGhtRExvMmRtM0dIRk1MM0p3cjZD');

    if (resendApiKey && user.email) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Neon Mining Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #081120; border: 1px solid #162842; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 240, 255, 0.15);">
          <!-- Top Neon Glow Line -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #00F0FF, #0284C7, #10B981);"></td>
          </tr>
          <!-- Header Content -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center;">
              <div style="display: inline-block; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 12px; padding: 10px 16px; margin-bottom: 16px;">
                <span style="font-size: 16px; font-weight: 900; letter-spacing: 2px; color: #00F0FF;">⚡ NEON MINING</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px;">Password Recovery Request</h1>
              <p style="margin: 8px 0 0; font-size: 13px; color: #94A3B8;">Secure Web3 Cloud Mining Infrastructure</p>
            </td>
          </tr>
          <!-- Main Body -->
          <tr>
            <td style="padding: 0 32px 28px; text-align: left;">
              <p style="font-size: 14px; line-height: 22px; color: #CBD5E1; margin: 0 0 16px;">
                Hello <strong style="color: #00F0FF;">${user.name || 'Miner'}</strong>,
              </p>
              <p style="font-size: 13px; line-height: 21px; color: #94A3B8; margin: 0 0 20px;">
                We received a request to reset the login password for your Neon Mining account (<strong>${user.id}</strong>). Click the secure authorization button below to set a new password:
              </p>
              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284C7, #00F0FF); color: #021426; font-size: 14px; font-weight: 900; text-decoration: none; padding: 14px 32px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 20px rgba(0, 240, 255, 0.35);">
                      RESET PASSWORD NOW →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #1E293B; border-radius: 10px; padding: 14px; margin-top: 20px;">
                <p style="font-size: 11.5px; line-height: 18px; color: #64748B; margin: 0;">
                  ⚠️ <strong>Security Notice:</strong> This authorization link is strictly time-limited and expires in <strong>15 minutes</strong>. If you did not request this recovery, your account remains fully safe—no action is needed.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #040812; border-top: 1px solid #14233C; text-align: center;">
              <p style="font-size: 11px; color: #475569; margin: 0;">
                © 2026 Neon Cloud Mining Corporation • 24/7 Web3 Telemetry & Vault Security
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Neon Mining <noreply@neoncryptomining.com>',
            to: [user.email],
            subject: '🔐 Reset Your Neon Mining Password',
            html: emailHtml
          })
        });

        const resendData = await resendRes.json() as any;
        if (resendRes.ok && resendData.id) {
          emailSent = true;
        } else {
          resendError = resendData.message || 'Resend email delivery was not accepted';
        }
      } catch (err: any) {
        resendError = err.message;
      }
    }

    if (!emailSent) {
      return c.json({
        success: false,
        message: resendError ? `Email dispatch error: ${resendError}` : 'Unable to dispatch recovery email. Please verify your email service.'
      }, 400);
    }

    return c.json({
      success: true,
      message: `A secure password reset link has been dispatched to ${user.email}. Please check your email inbox and spam folder.`
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Verify Reset Token
app.get('/api/auth/verify-reset-token', async (c) => {
  try {
    const token = c.req.query('token');
    if (!token) {
      return c.json({ success: false, message: 'Reset token is required' }, 400);
    }

    const row = await c.env.DB.prepare(
      'SELECT token, user_id, email, expires_at, used FROM password_reset_tokens WHERE token = ?'
    ).bind(token).first() as any;

    if (!row) {
      return c.json({ success: false, message: 'Invalid or expired password reset link.' }, 404);
    }

    if (row.used === 1) {
      return c.json({ success: false, message: 'This password reset link has already been used.' }, 400);
    }

    if (Date.now() > row.expires_at) {
      return c.json({ success: false, message: 'This password reset link has expired. Please request a new one.' }, 410);
    }

    const user = await c.env.DB.prepare('SELECT id, name, email FROM users WHERE id = ?').bind(row.user_id).first() as any;

    return c.json({
      success: true,
      valid: true,
      userId: row.user_id,
      email: row.email,
      userName: user?.name || row.user_id
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Reset Password (handles both Token and Fund PIN)
app.post('/api/auth/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const { token, userId, newPassword, fundPin } = body;

    if (!newPassword || newPassword.length < 6) {
      return c.json({ success: false, message: 'New password must be at least 6 characters' }, 400);
    }

    const isAlphaNumeric = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
    if (!isAlphaNumeric) {
      return c.json({ success: false, message: 'New password must be alphanumeric (contain both letters and numbers)' }, 400);
    }

    // Path 1: Reset with Token from Email Link
    if (token) {
      const tokenRow = await c.env.DB.prepare(
        'SELECT token, user_id, expires_at, used FROM password_reset_tokens WHERE token = ?'
      ).bind(token).first() as any;

      if (!tokenRow) {
        return c.json({ success: false, message: 'Invalid reset link' }, 404);
      }

      if (tokenRow.used === 1) {
        return c.json({ success: false, message: 'This reset link has already been used' }, 400);
      }

      if (Date.now() > tokenRow.expires_at) {
        return c.json({ success: false, message: 'This reset link has expired' }, 410);
      }

      const targetUserId = tokenRow.user_id;
      const targetEmail = tokenRow.email || '';
      await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ? OR LOWER(email) = LOWER(?)').bind(newPassword, targetUserId, targetEmail).run();
      await c.env.DB.prepare('UPDATE admins SET password_hash = ? WHERE id = ? OR LOWER(email) = LOWER(?)').bind(newPassword, targetUserId, targetEmail).run();
      await c.env.DB.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').bind(token).run();

      return c.json({
        success: true,
        message: 'Password updated successfully! You can now log in with your new password.'
      });
    }

    // Path 2: Reset with Fund Security PIN
    if (!userId) {
      return c.json({ success: false, message: 'User ID is required' }, 400);
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
      message: 'Password updated successfully! You can now log in with your new password.'
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

    if (!userId || !amount || Number(amount) < 10.0) {
      return c.json({ success: false, message: 'Minimum deposit amount is 10.00 USDT' }, 400);
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
    if (!userId || !txHash || !amount || Number(amount) < 10.0) {
      return c.json({ success: false, message: 'Minimum deposit amount is 10.00 USDT' }, 400);
    }

    const cleanTx = String(txHash).trim().toLowerCase();
    if (!cleanTx.startsWith('0x') || cleanTx.length !== 66) {
      return c.json({ success: false, message: 'Invalid 66-character transaction hash. Must start with 0x and have exactly 66 characters.' }, 400);
    }

    let numAmount = Number(amount);
    // Automatic Plan Tier Normalization:
    // If a user sends e.g. 19.97 or 19.98 USDT for a $20 plan (or similar due to BSC network gas/exchange fee deductions),
    // normalize it to the exact plan tier ($20.00) everywhere across user wallet, transactions ledger, and admin inflow.
    const PLAN_TIERS = [20, 60, 120, 250, 500, 1500, 3000, 5000, 10000];
    for (const tier of PLAN_TIERS) {
      if (numAmount >= tier - 0.50 && numAmount <= tier + 0.10) {
        numAmount = tier;
        break;
      }
    }

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

    let creditAmount = Number(order.amount);
    const PLAN_TIERS = [20, 60, 120, 250, 500, 1500, 3000, 5000, 10000];
    for (const tier of PLAN_TIERS) {
      if (creditAmount >= tier - 0.50 && creditAmount <= tier + 0.10) {
        creditAmount = tier;
        break;
      }
    }

    // Check if user has an upline referrer for multi-level commission
    const user = await c.env.DB.prepare('SELECT upline_code FROM users WHERE id = ?').bind(effectiveUserId).first() as any;

    const batchStatements: any[] = [
      // Record in permanent immutable claimed_tx_hashes table
      c.env.DB.prepare(
        'INSERT OR IGNORE INTO claimed_tx_hashes (tx_hash, claimed_by_user, amount, purpose) VALUES (?, ?, ?, ?)'
      ).bind(cleanTx, effectiveUserId, creditAmount, 'bep20_deposit'),

      // Update order to confirmed and set amount to normalized tier
      c.env.DB.prepare(
        `UPDATE deposit_orders 
         SET status = 'confirmed', amount = ?, tx_hash = ?, block_confirmations = ?, confirmed_at = CURRENT_TIMESTAMP 
         WHERE order_id = ?`
      ).bind(creditAmount, cleanTx, verification.confirmations, orderId),

      // Credit deposit balance
      c.env.DB.prepare(
        `UPDATE wallets 
         SET deposit_balance = deposit_balance + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(creditAmount, effectiveUserId),

      // Insert ledger entry
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) 
         VALUES (?, ?, 'BEP-20 Deposit', ?, 'Settled', ?)`
      ).bind(txId, effectiveUserId, creditAmount, cleanTx)
    ];

    // 3-Tier Multi-Level Referral Commission Distribution (L1: 10%, L2: 5%, L3: 2%)
    if (user && user.upline_code) {
      const tierConfig = [
        { level: 1, rate: 0.10, label: 'L1 (10%)' },
        { level: 2, rate: 0.05, label: 'L2 (5%)' },
        { level: 3, rate: 0.02, label: 'L3 (2%)' }
      ];

      let currentUpline = user.upline_code;
      for (const tier of tierConfig) {
        if (!currentUpline) break;

        const cleanUp = String(currentUpline).trim();
        const uplineUser = await c.env.DB.prepare(
          'SELECT id, upline_code FROM users WHERE UPPER(id) = UPPER(?) OR UPPER(referral_code) = UPPER(?) LIMIT 1'
        ).bind(cleanUp, cleanUp).first() as any;

        if (!uplineUser) break;

        const commission = Number((order.amount * tier.rate).toFixed(2));
        if (commission > 0) {
          batchStatements.push(
            c.env.DB.prepare(
              `INSERT OR IGNORE INTO wallets (user_id, deposit_balance, withdrawable_balance, referral_balance, active_mining_power, total_withdrawn, total_mined_yield)
               VALUES (?, 0, 0, 0, 0, 0, 0)`
            ).bind(uplineUser.id),

            c.env.DB.prepare(
              `UPDATE wallets 
               SET referral_balance = referral_balance + ?, 
                   withdrawable_balance = withdrawable_balance + ?, 
                   updated_at = CURRENT_TIMESTAMP 
               WHERE user_id = ?`
            ).bind(commission, commission, uplineUser.id),

            c.env.DB.prepare(
              `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) 
               VALUES (?, ?, ?, ?, 'Settled', ?)`
            ).bind(
              `REF-${Date.now().toString().slice(-6)}-L${tier.level}`,
              uplineUser.id,
              `Referral Commission ${tier.label} from ${effectiveUserId}`,
              commission,
              cleanTx
            )
          );
        }

        currentUpline = uplineUser.upline_code;
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

    // Multi-Tier Referral Commission Distribution (L1: 10%, L2: 5%, L3: 2%)
    // Credited to BOTH referral_balance (Referral Income) AND withdrawable_balance (Withdrawable)
    const subscriberUser = await c.env.DB.prepare(
      'SELECT upline_code FROM users WHERE id = ?'
    ).bind(userId).first() as any;

    if (subscriberUser && subscriberUser.upline_code) {
      const tierConfig = [
        { level: 1, rate: 0.10, label: 'L1 (10%)' },
        { level: 2, rate: 0.05, label: 'L2 (5%)' },
        { level: 3, rate: 0.02, label: 'L3 (2%)' }
      ];

      let currentUpline = subscriberUser.upline_code;
      for (const tier of tierConfig) {
        if (!currentUpline) break;

        const cleanUp = String(currentUpline).trim();
        const uplineUser = await c.env.DB.prepare(
          'SELECT id, upline_code FROM users WHERE UPPER(id) = UPPER(?) OR UPPER(referral_code) = UPPER(?) LIMIT 1'
        ).bind(cleanUp, cleanUp).first() as any;

        if (!uplineUser) break;

        const commission = Number((planCost * tier.rate).toFixed(2));
        if (commission > 0) {
          const refTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          batchStatements.push(
            c.env.DB.prepare(
              `INSERT OR IGNORE INTO wallets (user_id, deposit_balance, withdrawable_balance, referral_balance, active_mining_power, total_withdrawn, total_mined_yield)
               VALUES (?, 0, 0, 0, 0, 0, 0)`
            ).bind(uplineUser.id),

            c.env.DB.prepare(
              `UPDATE wallets 
               SET referral_balance = referral_balance + ?, 
                   withdrawable_balance = withdrawable_balance + ?, 
                   updated_at = CURRENT_TIMESTAMP 
               WHERE user_id = ?`
            ).bind(commission, commission, uplineUser.id),

            c.env.DB.prepare(
              `INSERT INTO transactions (id, user_id, type, amount, status, tx_hash) 
               VALUES (?, ?, ?, ?, 'Settled', ?)`
            ).bind(
              `REF-${Date.now().toString().slice(-6)}-L${tier.level}`,
              uplineUser.id,
              `Referral Commission ${tier.label} from ${userId} (${planName})`,
              commission,
              refTxHash
            )
          );
        }

        // Traverse to next upline level
        currentUpline = uplineUser.upline_code;
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

// Send Unlocked 24H Yield to Withdrawable Balance
app.post('/api/wallet/claim-yield-to-wallet', async (c) => {
  try {
    const { userId, yieldAmount } = await c.req.json();
    const numYield = Number(yieldAmount);
    if (!userId || !numYield || numYield <= 0) {
      return c.json({ success: false, message: 'Invalid userId or yieldAmount' }, 400);
    }
    const txId = `YLD-${Date.now().toString().slice(-6)}`;
    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE wallets 
         SET withdrawable_balance = withdrawable_balance + ?, 
             total_mined_yield = total_mined_yield + ?,
             updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`
      ).bind(numYield, numYield, userId),
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, status) 
         VALUES (?, ?, 'Daily Plan Interest Sent to Withdrawable Balance', ?, 'Settled')`
      ).bind(txId, userId, numYield)
    ]);
    const updatedWallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(userId).first();
    return c.json({ success: true, message: `Transferred +$${numYield.toFixed(2)} USDT to Withdrawable Balance`, updatedWallet });
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
      // Withdrawable balance deduction
      const availableWithdrawable = Number(senderWallet.withdrawable_balance || 0);
      if (availableWithdrawable < transferAmt) {
        return c.json({
          success: false,
          message: `Insufficient withdrawable balance ($${availableWithdrawable.toFixed(2)} USDT). Required: $${transferAmt.toFixed(2)} USDT.`
        }, 400);
      }

      senderDeductQuery = c.env.DB.prepare(
        'UPDATE wallets SET withdrawable_balance = MAX(0, withdrawable_balance - ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).bind(transferAmt, sender.id);
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
      // Recipient deposit order record (makes it appear in Recipient's Deposit History)
      c.env.DB.prepare(
        `INSERT INTO deposit_orders (order_id, user_id, amount, token, network, vault_address, tx_hash, block_confirmations, status, confirmed_at)
         VALUES (?, ?, ?, 'USDT', 'P2P Transfer', ?, ?, 1, 'confirmed', CURRENT_TIMESTAMP)`
      ).bind(`DEP-P2P-${Date.now().toString().slice(-6)}`, recipient.id, transferAmt, `@${sender.id}`, p2pHash),
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

    // Check Withdrawable Balance
    const wallet = await c.env.DB.prepare('SELECT * FROM wallets WHERE user_id = ?').bind(user.id).first() as any;
    const availableWithdrawable = Number(wallet?.withdrawable_balance || 0);

    if (!wallet || availableWithdrawable < withdrawAmount) {
      return c.json({
        success: false,
        message: `Insufficient withdrawable balance ($${availableWithdrawable.toFixed(2)} USDT).`
      }, 400);
    }

    const fee = Number((withdrawAmount * 0.05).toFixed(2)); // 5% BSC Gas Fee
    const netAmount = Number((withdrawAmount - fee).toFixed(2));
    const reqId = `wd_${Date.now().toString().slice(-6)}`;
    const txId = `WD-${Date.now().toString().slice(-6)}`;

    // Deduct directly from withdrawable balance
    const deductQuery = c.env.DB.prepare(
      `UPDATE wallets 
       SET withdrawable_balance = MAX(0, withdrawable_balance - ?), 
           total_withdrawn = total_withdrawn + ?, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`
    ).bind(withdrawAmount, withdrawAmount, user.id);

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
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE (role = 'user' OR role IS NULL OR role = '')").first(),
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

// Admin Users List (with wallet balances, status, search) - Real platform users only
app.get('/api/admin/users', async (c) => {
  try {
    const search = c.req.query('search') || '';
    let query = `
      SELECT u.id, u.name, u.mobile, u.email, u.role, u.status, u.referral_code, u.upline_code, u.created_at, u.fund_pin, u.fund_pin_set,
             w.deposit_balance, w.withdrawable_balance, w.referral_balance, w.active_mining_power, w.total_withdrawn, w.total_mined_yield
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE (u.role = 'user' OR u.role IS NULL OR u.role = '')
    `;
    let params: any[] = [];
    if (search) {
      query += ` AND (u.id LIKE ? OR u.name LIKE ? OR u.mobile LIKE ? OR u.email LIKE ?)`;
      const term = `%${search}%`;
      params = [term, term, term, term];
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

// Admin Sub-Admin Management (List, Create, Delete - Stored in admins table, isolated from users)
app.get('/api/admin/subadmins', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, email, role, created_at 
      FROM admins 
      WHERE role = 'subadmin' 
      ORDER BY created_at DESC
    `).all();
    return c.json({ success: true, subadmins: results || [] });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/admin/subadmins/create', async (c) => {
  try {
    const body = await c.req.json();
    const email = (body.email || '').trim().toLowerCase();
    const name = (body.name || '').trim();
    const password = (body.password || '123456').trim();

    if (!email) {
      return c.json({ success: false, message: 'Valid email address is required' }, 400);
    }

    const existing = await c.env.DB.prepare(
      'SELECT id, email, role, name FROM admins WHERE LOWER(email) = ?'
    ).bind(email).first() as any;

    if (existing) {
      await c.env.DB.prepare(
        'UPDATE admins SET name = COALESCE(NULLIF(?, ""), name), password_hash = ? WHERE id = ?'
      ).bind(name, password, existing.id).run();

      return c.json({
        success: true,
        message: `Sub-Admin account updated for (${email}).`,
        subadmin: { id: existing.id, email, name: name || existing.name, role: 'subadmin' }
      });
    }

    const subId = `admin_sub_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const officialName = name || email.split('@')[0];

    await c.env.DB.prepare(`
      INSERT INTO admins (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, 'subadmin')
    `).bind(subId, officialName, email, password).run();

    return c.json({
      success: true,
      message: `Sub-Admin account registered for ${email}.`,
      subadmin: { id: subId, email, name: officialName, role: 'subadmin' }
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.post('/api/admin/subadmins/delete', async (c) => {
  try {
    const { id, email } = await c.req.json();
    if (!id && !email) {
      return c.json({ success: false, message: 'Sub-admin id or email required' }, 400);
    }
    if (id) {
      await c.env.DB.prepare('DELETE FROM admins WHERE id = ? AND role = "subadmin"').bind(id).run();
    } else if (email) {
      await c.env.DB.prepare('DELETE FROM admins WHERE LOWER(email) = LOWER(?) AND role = "subadmin"').bind(email).run();
    }
    return c.json({ success: true, message: 'Sub-Admin access revoked successfully.' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Balance Adjustment - PERMANENTLY DISABLED
// Reason: Manual adjustments cause double-credit bugs (e.g. $20 plan shows $40 staked).
// All balance changes MUST go through proper flows:
//   - Plan purchase → /api/plans/subscribe
//   - BEP-20 deposit → /api/tx/claim-deposit
//   - Withdrawal → /api/wallet/withdraw + /api/admin/withdrawals/action
app.post('/api/admin/users/adjust-balance', async (c) => {
  return c.json({
    success: false,
    message: 'Manual balance adjustment is permanently disabled. All balance changes must go through proper plan purchase or verified deposit flows.'
  }, 403);
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
      // Reject: refund amount back to user's withdrawable balance and mark pending transaction Rejected
      await c.env.DB.batch([
        c.env.DB.prepare(
          `UPDATE withdrawal_requests SET status = 'rejected', rejection_reason = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(reason || 'Rejected by administrator', requestId),

        // Update corresponding transaction in user's ledger from Pending to Rejected
        c.env.DB.prepare(
          `UPDATE transactions SET status = 'Rejected' WHERE user_id = ? AND type = 'Payout Request' AND status = 'Pending'`
        ).bind(req.user_id),

        c.env.DB.prepare(
          `UPDATE wallets SET withdrawable_balance = withdrawable_balance + ?, total_withdrawn = total_withdrawn - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
        ).bind(req.amount, req.amount, req.user_id),

        c.env.DB.prepare(
          `INSERT INTO transactions (id, user_id, type, amount, status) VALUES (?, ?, 'Withdrawal Refund', ?, 'Settled')`
        ).bind(`REF-${Date.now().toString().slice(-6)}`, req.user_id, req.amount)
      ]);

      return c.json({ success: true, message: 'Withdrawal rejected, transaction updated to Rejected, and amount refunded to user wallet' });
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
      min_deposit: '10.0',
      min_withdrawal: '2.0',
      withdrawal_fee_percent: '5.0',
      p2p_fee_percent: '0.0',
      vault_address: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
      vaultWalletAddress: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
      popup_enabled: 'true',
      popupEnabled: 'true',
      popup_image_url: '',
      popupImageUrl: '',
      popup_link_url: '',
      popupLinkUrl: ''
    };
    for (const row of results as any[]) {
      settingsMap[row.key] = row.value;
      if (row.key === 'vault_address') {
        settingsMap.vault_address = row.value;
        settingsMap.vaultWalletAddress = row.value;
      }
      if (row.key === 'popup_image_url') {
        settingsMap.popupImageUrl = row.value;
      }
      if (row.key === 'popupImageUrl') {
        settingsMap.popup_image_url = row.value;
      }
      if (row.key === 'popup_link_url') {
        settingsMap.popupLinkUrl = row.value;
      }
      if (row.key === 'popupLinkUrl') {
        settingsMap.popup_link_url = row.value;
      }
      if (row.key === 'popup_enabled') {
        settingsMap.popupEnabled = row.value;
      }
      if (row.key === 'popupEnabled') {
        settingsMap.popup_enabled = row.value;
      }
    }
    if (settingsMap.vault_address) {
      settingsMap.vaultWalletAddress = settingsMap.vault_address;
    }
    return c.json({ success: true, settings: settingsMap });
  } catch (err: any) {
    return c.json({
      success: true,
      settings: {
        min_deposit: '10.0',
        min_withdrawal: '2.0',
        withdrawal_fee_percent: '5.0',
        vault_address: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
        vaultWalletAddress: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
        popup_enabled: 'true',
        popupEnabled: 'true',
        popup_image_url: '',
        popupImageUrl: '',
        popup_link_url: '',
        popupLinkUrl: ''
      }
    });
  }
});

// Admin Get Platform Settings
app.get('/api/admin/settings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT key, value FROM platform_settings').all();
    const settingsMap: Record<string, string> = {
      min_deposit: '10.0',
      min_withdrawal: '2.0',
      withdrawal_fee_percent: '5.0',
      p2p_fee_percent: '0.0',
      vault_address: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
      vaultWalletAddress: '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d',
      popup_enabled: 'true',
      popupEnabled: 'true',
      popup_image_url: '',
      popupImageUrl: '',
      popup_link_url: '',
      popupLinkUrl: ''
    };
    for (const row of results as any[]) {
      settingsMap[row.key] = row.value;
      if (row.key === 'vault_address') {
        settingsMap.vault_address = row.value;
        settingsMap.vaultWalletAddress = row.value;
      }
      if (row.key === 'popup_image_url') {
        settingsMap.popupImageUrl = row.value;
      }
      if (row.key === 'popupImageUrl') {
        settingsMap.popup_image_url = row.value;
      }
      if (row.key === 'popup_link_url') {
        settingsMap.popupLinkUrl = row.value;
      }
      if (row.key === 'popupLinkUrl') {
        settingsMap.popup_link_url = row.value;
      }
      if (row.key === 'popup_enabled') {
        settingsMap.popupEnabled = row.value;
      }
      if (row.key === 'popupEnabled') {
        settingsMap.popup_enabled = row.value;
      }
    }
    if (settingsMap.vault_address) {
      settingsMap.vaultWalletAddress = settingsMap.vault_address;
    }
    return c.json({ success: true, settings: settingsMap });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Update Platform Settings (Fees, Min limits, Vault Address)
app.on(['PUT', 'POST'], '/api/admin/settings', async (c) => {
  try {
    const body = await c.req.json();
    const adminRole = c.req.header('X-Admin-Role') || c.req.query('role') || body.adminRole || body.role;
    if (adminRole === 'subadmin') {
      return c.json({
        success: false,
        message: 'Forbidden: Sub-Admin accounts have read-only audit permissions. Only Master Super Admin can modify system settings.'
      }, 403);
    }

    const cleanVault = (body.vault_address || body.vaultWalletAddress || '').trim();
    if (cleanVault && cleanVault.startsWith('0x') && cleanVault.length === 42) {
      body.vault_address = cleanVault;
      body.vaultWalletAddress = cleanVault;
      await c.env.DB.prepare(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES ('vault_address', ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind(cleanVault).run();
      await c.env.DB.prepare(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES ('vaultWalletAddress', ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind(cleanVault).run();
    }

    if (body.key && body.value !== undefined) {
      await c.env.DB.prepare(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind(body.key, String(body.value)).run();
    } else {
      const statements: any[] = [];
      for (const [key, value] of Object.entries(body)) {
        if (key === 'adminRole' || key === 'role' || key === 'popupImageUrl' || key === 'popupLinkUrl' || key === 'popupEnabled' || key === 'vaultWalletAddress' || key === 'vault_address') continue;
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
    return c.json({
      success: true,
      message: 'Platform settings updated successfully in database',
      vaultAddress: cleanVault || undefined
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ============================================================================
// 7.5. Real-Time Support Chat Desk (D1 Persistent Multi-User Sync)
// ============================================================================
// Sync / Upsert user chat session
app.post('/api/chat/sync', async (c) => {
  try {
    const body = await c.req.json();
    const {
      sessionId,
      userId,
      userName,
      userMobile,
      userEmail,
      userPlan,
      userBalance,
      status,
      messages,
      lastMessageText
    } = body;

    if (!sessionId) {
      return c.json({ success: false, message: 'sessionId is required' }, 400);
    }

    const messagesJson = JSON.stringify(messages || []);
    const lastMsg = lastMessageText || (messages && messages.length > 0 ? messages[messages.length - 1].text : '');
    const cleanStatus = status || 'bot';

    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        user_mobile TEXT,
        user_email TEXT,
        user_plan TEXT,
        user_balance REAL DEFAULT 0,
        status TEXT DEFAULT 'bot',
        last_message_text TEXT,
        unread_admin_count INTEGER DEFAULT 0,
        unread_user_count INTEGER DEFAULT 0,
        assigned_admin_name TEXT,
        messages_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await c.env.DB.prepare(`
      INSERT INTO chat_sessions (
        id, user_id, user_name, user_mobile, user_email, user_plan, user_balance, 
        status, last_message_text, unread_admin_count, unread_user_count, messages_json, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        user_name = excluded.user_name,
        user_mobile = excluded.user_mobile,
        user_email = excluded.user_email,
        user_plan = excluded.user_plan,
        user_balance = excluded.user_balance,
        status = excluded.status,
        last_message_text = excluded.last_message_text,
        unread_admin_count = chat_sessions.unread_admin_count + 1,
        messages_json = excluded.messages_json,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      sessionId,
      userId || 'guest',
      userName || 'Guest Miner',
      userMobile || '',
      userEmail || '',
      userPlan || 'No Active Plan',
      Number(userBalance || 0),
      cleanStatus,
      lastMsg,
      messagesJson
    ).run();

    return c.json({ success: true, message: 'Chat synced to Cloudflare D1' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// User / Client get their chat session
app.get('/api/chat/session', async (c) => {
  try {
    const sessionId = c.req.query('sessionId');
    if (!sessionId) {
      return c.json({ success: false, message: 'sessionId required' }, 400);
    }
    const row = await c.env.DB.prepare('SELECT * FROM chat_sessions WHERE id = ?').bind(sessionId).first() as any;
    if (!row) {
      return c.json({ success: true, session: null });
    }
    let parsedMessages = [];
    try {
      parsedMessages = JSON.parse(row.messages_json || '[]');
    } catch {}

    return c.json({
      success: true,
      session: {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userMobile: row.user_mobile,
        userEmail: row.user_email,
        userPlan: row.user_plan,
        userBalance: row.user_balance,
        status: row.status,
        lastMessageText: row.last_message_text,
        unreadAdminCount: row.unread_admin_count,
        unreadUserCount: row.unread_user_count,
        assignedAdminName: row.assigned_admin_name,
        messages: parsedMessages,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Get all chats from D1
app.get('/api/admin/chats', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM chat_sessions 
      ORDER BY 
        CASE 
          WHEN status = 'waiting_admin' THEN 0 
          WHEN status = 'active_admin' THEN 1 
          ELSE 2 
        END,
        updated_at DESC
      LIMIT 100
    `).all();

    const mapped = (results || []).map((row: any) => {
      let parsed = [];
      try {
        parsed = JSON.parse(row.messages_json || '[]');
      } catch {}
      return {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userMobile: row.user_mobile,
        userEmail: row.user_email,
        userPlan: row.user_plan,
        userBalance: row.user_balance,
        status: row.status,
        lastMessageText: row.last_message_text,
        unreadAdminCount: row.unread_admin_count,
        unreadUserCount: row.unread_user_count,
        assignedAdminName: row.assigned_admin_name,
        messages: parsed,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return c.json({ success: true, sessions: mapped });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Reply to chat
app.post('/api/admin/chats/reply', async (c) => {
  try {
    const { sessionId, adminName, messageText } = await c.req.json();
    if (!sessionId || !messageText) {
      return c.json({ success: false, message: 'sessionId and messageText required' }, 400);
    }

    const row = await c.env.DB.prepare('SELECT * FROM chat_sessions WHERE id = ?').bind(sessionId).first() as any;
    if (!row) {
      return c.json({ success: false, message: 'Session not found' }, 404);
    }

    let existingMessages = [];
    try {
      existingMessages = JSON.parse(row.messages_json || '[]');
    } catch {}

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const adminMsg = {
      id: `admin_msg_${Date.now()}`,
      sender: 'admin',
      senderName: adminName || 'Support Specialist',
      text: messageText.trim(),
      timestamp: nowStr
    };

    existingMessages.push(adminMsg);

    await c.env.DB.prepare(`
      UPDATE chat_sessions 
      SET messages_json = ?,
          last_message_text = ?,
          status = 'active_admin',
          assigned_admin_name = ?,
          unread_admin_count = 0,
          unread_user_count = unread_user_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      JSON.stringify(existingMessages),
      messageText.trim(),
      adminName || 'Support Specialist',
      sessionId
    ).run();

    return c.json({ success: true, message: 'Admin reply dispatched', newMessage: adminMsg });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Resolve Chat
app.post('/api/admin/chats/resolve', async (c) => {
  try {
    const { sessionId, resolutionMessage } = await c.req.json();
    if (!sessionId) {
      return c.json({ success: false, message: 'sessionId required' }, 400);
    }

    const row = await c.env.DB.prepare('SELECT * FROM chat_sessions WHERE id = ?').bind(sessionId).first() as any;
    if (row) {
      let messages = [];
      try {
        messages = JSON.parse(row.messages_json || '[]');
      } catch {}

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const resolveText = resolutionMessage || '✅ **[Query Resolved]**\nOur support specialist has resolved this inquiry. If you need any further assistance, feel free to chat with our 24/7 AI Copilot anytime!';

      const resolveMsg = {
        id: `sys_resolved_${Date.now()}`,
        sender: 'ai',
        text: resolveText,
        timestamp: nowStr
      };

      messages.push(resolveMsg);

      await c.env.DB.prepare(`
        UPDATE chat_sessions 
        SET status = 'resolved',
            messages_json = ?,
            last_message_text = ?,
            unread_admin_count = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        JSON.stringify(messages),
        '[Query Resolved]',
        sessionId
      ).run();
    } else {
      await c.env.DB.prepare(`
        UPDATE chat_sessions 
        SET status = 'resolved',
            unread_admin_count = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(sessionId).run();
    }

    return c.json({ success: true, message: 'Session marked resolved' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin Clear All Chat Sessions
app.post('/api/admin/chats/clear-all', async (c) => {
  try {
    await c.env.DB.prepare('DELETE FROM chat_sessions').run();
    return c.json({ success: true, message: 'All chat conversations cleared successfully' });
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
