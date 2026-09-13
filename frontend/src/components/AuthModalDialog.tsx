import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Phone,
  ShieldCheck,
  Mail,
  CheckCircle2,
  ArrowRight,
  Users,
  Eye,
  EyeOff,
  Zap,
  Calendar,
  User,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { COUNTRY_CODES } from '../data/miningPlans';
import { CountryCode } from '../types/mining';
import { nexoraApi } from '../services/api';

interface Props {
  isOpen: boolean;
  isSignUp: boolean;
  initialReferralCode?: string;
  incomingResetToken?: string | null;
  incomingResetEmail?: string | null;
  onDismiss: () => void;
  onAuthSuccess: (userName: string, mobile: string, fundPin?: string, email?: string, referralCode?: string, ownReferralCode?: string) => void;
  onSwitchAuthMode: () => void;
}

export const AuthModalDialog: React.FC<Props> = ({
  isOpen,
  isSignUp,
  initialReferralCode = '',
  incomingResetToken = null,
  incomingResetEmail = null,
  onDismiss,
  onAuthSuccess,
  onSwitchAuthMode
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    () => COUNTRY_CODES.find((c) => c.code === '+1' && c.name === 'United States') || COUNTRY_CODES[0]
  );
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(initialReferralCode);

  // Signup success screen state
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    userId: string;
    email: string;
    mobile: string;
    joiningDate: string;
    referral: string;
    ownReferralCode?: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode);
    }
  }, [initialReferralCode]);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showSetNewPass, setShowSetNewPass] = useState(false);
  const [activeResetToken, setActiveResetToken] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Handle incoming email reset link
  useEffect(() => {
    if (incomingResetToken) {
      setActiveResetToken(incomingResetToken);
      setShowForgotPassword(true);
      setShowSetNewPass(true);
      if (incomingResetEmail) {
        setResetEmail(incomingResetEmail);
      }
    }
  }, [incomingResetToken, incomingResetEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!email.trim() || !email.includes('@')) {
          setApiError('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }
        if (!mobileNumber.trim() || mobileNumber.trim().length < 6) {
          setApiError('Mobile number is required to register an account.');
          setIsLoading(false);
          return;
        }
        if (!loginPassword || loginPassword.length < 6) {
          setApiError('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        const isAlphaNumeric = /[a-zA-Z]/.test(loginPassword) && /[0-9]/.test(loginPassword);
        if (!isAlphaNumeric) {
          setApiError('Password must be alphanumeric (contain both letters and numbers, e.g. Pass123).');
          setIsLoading(false);
          return;
        }

        const fullMobile = `${selectedCountry.code} ${mobileNumber.trim()}`;

        const res = await nexoraApi.register({
          name: '',
          mobile: fullMobile,
          email: email.trim().toLowerCase(),
          password: loginPassword,
          uplineCode: referralCode.trim() || undefined
        });

        if (res && res.success && res.user) {
          if (res.sessionToken) {
            try {
              localStorage.setItem('neon_session_token', res.sessionToken);
            } catch (e) {}
          }
          const assignedId = res.user.id;
          const now = new Date();
          const joiningDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

          setSuccessData({
            userId: assignedId,
            email: email.trim().toLowerCase(),
            mobile: fullMobile,
            joiningDate,
            referral: referralCode.trim() || '',
            ownReferralCode: res.user.referralCode || ''
          });
          setSignupSuccess(true);
        } else if (res?.message?.toLowerCase().includes('already registered')) {
          setApiError(res.message || 'This email or mobile number is already registered. Please click "Sign In" below to log in.');
        } else {
          setApiError(res?.message || 'Registration failed. Please verify your details.');
        }
      } else {
        // Sign In Mode: Accepts registered Email Address OR Username
        const identifier = email.trim();
        if (!identifier) {
          setApiError('Please enter your Email Address or Username.');
          setIsLoading(false);
          return;
        }
        if (!loginPassword) {
          setApiError('Please enter your Login Password.');
          setIsLoading(false);
          return;
        }

        const res = await nexoraApi.login({
          identifier: identifier,
          password: loginPassword
        });

        if (res && res.success && res.user) {
          if (res.sessionToken) {
            try {
              localStorage.setItem('neon_session_token', res.sessionToken);
            } catch (e) {}
          }
          onAuthSuccess(res.user.id, res.user.mobile || '', undefined, res.user.email || identifier, res.user.uplineCode || undefined, res.user.referralCode || undefined);
        } else {
          if (res?.suspended || res?.message?.toLowerCase().includes('suspended')) {
            setApiError('Your account has been suspended due to irregular mining activity and security policy violations. Please contact support@neon-mining.io for assistance.');
            setIsLoading(false);
            return;
          }
          // Secondary live check: verify if this user is marked suspended in D1 database
          try {
            const checkUser = await nexoraApi.getAdminUsers(identifier);
            const matched = checkUser?.users?.find((u: any) => 
              (u.email && u.email.toLowerCase() === identifier.toLowerCase()) || 
              (u.id && u.id.toUpperCase() === identifier.toUpperCase()) ||
              (u.mobile && u.mobile.replace(/\s+/g, '') === identifier.replace(/\s+/g, ''))
            );
            if (matched && matched.status === 'suspended') {
              setApiError('Your account has been suspended due to irregular mining activity and security policy violations. Please contact support@neon-mining.io for assistance.');
              setIsLoading(false);
              return;
            }
          } catch {}

          setApiError(res?.message || 'Invalid credentials. Please verify your Email/Username and Password.');
        }
      }
    } catch {
      setApiError('Unable to connect to authentication server. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = resetEmail.trim().toLowerCase();
    if (!clean) {
      setApiError('Please enter your registered email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      setApiError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    setIsLoading(true);
    setApiError('');
    try {
      const res = await nexoraApi.forgotPassword(clean);
      if (res && res.success) {
        setResetSent(true);
        if (res.message) {
          setResetSuccessMsg(res.message);
        }
      } else {
        setApiError(res?.message || 'This email is not registered in our database. Please check your email or create an account.');
      }
    } catch {
      setApiError('Unable to connect to recovery server. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = newPasswordInput.trim();
    if (!cleanPass || cleanPass.length < 6) {
      setApiError('New password must be at least 6 characters long.');
      return;
    }
    const isAlphaNumeric = /[a-zA-Z]/.test(cleanPass) && /[0-9]/.test(cleanPass);
    if (!isAlphaNumeric) {
      setApiError('New password must be alphanumeric (contain both letters and numbers, e.g. Pass123).');
      return;
    }

    const tokenToUse = incomingResetToken || activeResetToken;
    if (!tokenToUse) {
      setApiError('Reset authorization token missing. Please use the link sent to your email.');
      return;
    }

    setIsLoading(true);
    setApiError('');
    try {
      const res = await nexoraApi.resetPassword({
        token: tokenToUse,
        newPassword: cleanPass
      });

      if (res && res.success) {
        setLoginPassword(cleanPass);
        if (incomingResetEmail) {
          setEmail(incomingResetEmail);
        } else if (resetEmail) {
          setEmail(resetEmail);
        }
        setResetSuccessMsg(res.message || '✓ Password updated successfully! Please sign in.');
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setTimeout(() => {
          setShowForgotPassword(false);
          setShowSetNewPass(false);
          setActiveResetToken(null);
          setResetSent(false);
          setResetSuccessMsg('');
          if (incomingResetToken) {
            window.location.href = window.location.pathname;
          }
        }, 1600);
      } else {
        setApiError(res?.message || 'Failed to update password. Reset link may be expired or already used.');
      }
    } catch (err: any) {
      setApiError(err.message || 'Error updating password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    if (successData) {
      navigator.clipboard?.writeText(successData.userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // ─── SIGNUP SUCCESS SCREEN ─────────────────────────────────────────────────
  if (signupSuccess && successData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-[370px] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.15)] animate-scaleUp">

          {/* Top glow bar */}
          <div className="h-[3px] w-full bg-gradient-to-r from-[#00F0FF] via-[#10B981] to-[#0284C7]" />

          <div className="bg-gradient-to-b from-[#071320] via-[#060E1C] to-[#040A14] border border-[#0D2540] border-t-0 p-6 relative">
            <button
              type="button"
              onClick={() => {
                if (successData) {
                  onAuthSuccess(
                    successData.userId,
                    successData.mobile,
                    undefined,
                    successData.email,
                    successData.referral || undefined,
                    successData.ownReferralCode || undefined
                  );
                }
                onDismiss();
              }}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:text-white hover:bg-[#142338] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + Header */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full bg-[#064E3B]/40 border-2 border-[#10B981] flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00F0FF] flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.8)]">
                  <Zap className="w-3 h-3 text-[#021024]" />
                </span>
              </div>
              <span className="text-[10px] font-black tracking-[3px] text-[#00F0FF] uppercase bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-3 py-0.5 rounded-full mb-2">
                ACCOUNT ACTIVATED
              </span>
              <h2 className="text-[22px] font-black text-white leading-tight">
                Welcome to <span className="text-[#00F0FF]">Neon</span> Mining!
              </h2>
              <p className="text-[11px] text-[#64748B] mt-1">
                Your miner node is ready. Save your User ID below.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1C3252] to-transparent mb-4" />

            {/* Info rows */}
            <div className="space-y-2.5">

              {/* User ID — copyable */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B1E35] border border-[#00F0FF]/30 shadow-[0_0_10px_rgba(0,240,255,0.08)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-[#00F0FF]" />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-bold text-[#64748B] tracking-wider uppercase block">User ID</span>
                    <span className="text-[14px] font-black text-[#00F0FF] font-mono tracking-wider">
                      {successData.userId}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCopyId}
                  className="p-1.5 rounded-lg bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 transition-all cursor-pointer"
                  title="Copy User ID"
                >
                  {copiedId
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    : <Copy className="w-3.5 h-3.5 text-[#00F0FF]" />}
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#080F1E] border border-[#132236]">
                <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-[#38BDF8]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold text-[#64748B] tracking-wider uppercase block">Email Address</span>
                  <span className="text-[12.5px] font-semibold text-[#E2E8F0] break-all">{successData.email || '—'}</span>
                </div>
              </div>

              {/* Mobile */}
              {successData.mobile && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#080F1E] border border-[#132236]">
                  <div className="w-7 h-7 rounded-lg bg-[#10B981]/10 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-bold text-[#64748B] tracking-wider uppercase block">Mobile Number</span>
                    <span className="text-[12.5px] font-semibold text-[#E2E8F0]">{successData.mobile}</span>
                  </div>
                </div>
              )}

              {/* Joining Date */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#080F1E] border border-[#132236]">
                <div className="w-7 h-7 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#FBBF24]" />
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-[#64748B] tracking-wider uppercase block">Date of Joining</span>
                  <span className="text-[12.5px] font-semibold text-[#E2E8F0]">{successData.joiningDate}</span>
                </div>
              </div>

              {/* Referred By (only if used) */}
              {successData.referral && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#080F1E] border border-[#132236]">
                  <div className="w-7 h-7 rounded-lg bg-[#A855F7]/10 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#A855F7]" />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-bold text-[#64748B] tracking-wider uppercase block">Referred By</span>
                    <span className="text-[12.5px] font-semibold text-[#E2E8F0] font-mono">{successData.referral}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Go to Dashboard button */}
            <button
              onClick={() => {
                if (successData) {
                  onAuthSuccess(
                    successData.userId,
                    successData.mobile,
                    undefined,
                    successData.email,
                    successData.referral || undefined,
                    successData.ownReferralCode || undefined
                  );
                }
                onDismiss();
              }}
              className="mt-4 w-full h-[46px] rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#0284C7] to-[#10B981] text-[#021024] font-extrabold text-[14px] tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── NORMAL LOGIN / REGISTER FORM ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-[400px] rounded-2xl bg-[#091220] border border-[#1C3252] shadow-2xl p-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0C1E34] border border-[#00F0FF] flex items-center justify-center text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider block">
                {(incomingResetToken || showSetNewPass) ? 'SET NEW PASSWORD' : showForgotPassword ? 'ACCOUNT RECOVERY' : isSignUp ? 'CREATE NEW ACCOUNT' : 'SECURE LOGIN'}
              </span>
              <h3 className="text-[17px] font-black text-[#F8FAFC]">
                {(incomingResetToken || showSetNewPass) ? 'Create New Password' : showForgotPassword ? 'Reset Password via Email' : isSignUp ? 'Register Miner ID' : 'Welcome Back'}
              </h3>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#142338] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Error Notification */}
        {apiError && (
          <div className={`mt-3.5 p-3 rounded-xl ${
            apiError.toLowerCase().includes('suspended')
              ? 'bg-red-950/95 border-2 border-red-500 text-red-100 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
              : 'bg-red-950/85 border border-red-500/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
          } text-[12px] flex items-start gap-2.5 animate-fadeIn`}>
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-red-400 block text-[11px] uppercase tracking-wider">
                {apiError.toLowerCase().includes('suspended') ? '🚫 Account Suspended' : 'Authentication Error'}
              </span>
              <span className="text-red-200 text-[11.5px] leading-relaxed">{apiError}</span>
            </div>
          </div>
        )}

        {/* CASE 1: SET NEW PASSWORD (When opened via Email 1-click reset link) */}
        {(incomingResetToken || showSetNewPass) ? (
          <form onSubmit={handleSaveNewPassword} className="mt-4 space-y-3.5 text-[12px]">
            <div className="p-3 rounded-xl bg-[#0369A1]/15 border border-[#0284C7]/30 text-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF] block mb-0.5">
                Verified Email Reset Link
              </span>
              <p className="text-[11.5px]">
                Enter a new secure password for account <strong className="text-white font-mono">{incomingResetEmail || resetEmail || 'Verified Miner'}</strong>.
              </p>
            </div>

            <div>
              <label className="font-medium text-[#94A3B8] block mb-1">New Login Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPasswordInput}
                  onChange={(e) => {
                    setNewPasswordInput(e.target.value);
                    if (apiError) setApiError('');
                  }}
                  placeholder="Alphanumeric (letters & numbers, min 6)"
                  className="w-full rounded-xl bg-[#050B14] border border-[#162740] pl-8 pr-9 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#00F0FF]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[44px] rounded-xl bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021326] font-extrabold text-[13.5px] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer mt-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#021326] border-t-transparent rounded-full animate-spin" />
                  <span>Saving New Password...</span>
                </>
              ) : (
                <span>Save New Password & Sign In</span>
              )}
            </button>

            {resetSuccessMsg && (
              <p className="text-[12px] text-emerald-400 font-bold text-center mt-1.5">{resetSuccessMsg}</p>
            )}
          </form>
        ) : showForgotPassword ? (
          /* CASE 2: FORGOT PASSWORD REQUEST FORM */
          <div className="mt-4 space-y-3.5 text-[12px]">
            {!resetSent ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                <p className="text-[#94A3B8] leading-[17px]">
                  Enter your registered Email Address. A secure password reset link will be sent directly to your email inbox.
                </p>
                <div>
                  <label className="font-medium text-[#94A3B8] block mb-1">Registered Email Address:</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (apiError) setApiError('');
                      }}
                      placeholder="name@gmail.com"
                      className="w-full rounded-xl bg-[#050B14] border border-[#162740] pl-8 pr-3 py-2.5 text-white focus:outline-none focus:border-[#00F0FF]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setResetSent(false); setApiError(''); }}
                    className="flex-1 py-2.5 rounded-xl bg-[#142236] text-[#94A3B8] font-bold hover:text-white transition-colors cursor-pointer"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#0284C7] text-white font-bold hover:bg-[#0369A1] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(2,132,199,0.4)] cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* REAL RESET CONFIRMATION SCREEN - NO DEMO BUTTONS */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-100 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-[13px] text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />
                    <span>Password Reset Link Dispatched!</span>
                  </div>
                  <p className="text-[12px] text-emerald-200/90 leading-relaxed pl-7">
                    A secure password reset link has been dispatched to <span className="font-mono font-bold text-white">{resetEmail}</span>.
                  </p>
                  <div className="p-3 rounded-lg bg-black/40 border border-emerald-900/60 text-[11.5px] text-emerald-300/90 space-y-1.5 pl-3">
                    <div className="font-semibold text-white">Next Steps:</div>
                    <p>1. Open your <strong>Email Inbox</strong> (check Spam or Promotions folder if not in primary).</p>
                    <p>2. Click the <strong>RESET PASSWORD NOW</strong> button in the email.</p>
                    <p>3. You will be redirected here securely to set your new password.</p>
                  </div>
                  <p className="text-[10.5px] text-slate-400 italic pl-7">
                    ⚠️ Note: The link is strictly time-limited and expires in 15 minutes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setApiError('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#142236] text-[#94A3B8] font-bold hover:text-white transition-colors cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-[12px]">
            {/* Email / Identifier */}
            <div>
              <label className="font-medium text-[#94A3B8] block mb-1">
                {isSignUp ? 'Email Address' : 'Email Address or Username'}
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={isSignUp ? 'email' : 'text'}
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (apiError) setApiError('');
                  }}
                  placeholder={isSignUp ? 'name@gmail.com' : 'Email or Username (e.g. name@gmail.com or NEON...)'}
                  className="w-full rounded-xl bg-[#050B14] border border-[#162740] pl-8 pr-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>

            {/* Mobile (signup only - mandatory) */}
            {isSignUp && (
              <div>
                <label className="font-medium text-[#94A3B8] block mb-1">
                  Mobile Number <span className="text-[#00F0FF] text-[10.5px] font-semibold">(Required)</span>
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={`${selectedCountry.code}|${selectedCountry.name}`}
                    onChange={(e) => {
                      const [code, name] = e.target.value.split('|');
                      const match = COUNTRY_CODES.find((c) => c.code === code && c.name === name);
                      if (match) setSelectedCountry(match);
                    }}
                    className="rounded-xl bg-[#050B14] border border-[#162740] px-2 py-2 text-[12px] text-white focus:outline-none focus:border-[#00F0FF] cursor-pointer max-w-[140px] sm:max-w-[155px]"
                  >
                    {COUNTRY_CODES.map((c, idx) => (
                      <option key={`${c.code}-${c.name}-${idx}`} value={`${c.code}|${c.name}`} className="bg-[#091220] text-white">
                        {c.flag} {c.code} ({c.name})
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={16}
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        if (apiError) setApiError('');
                      }}
                      placeholder="Mobile phone number"
                      className="w-full rounded-xl bg-[#050B14] border border-[#162740] pl-8 pr-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#00F0FF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password with show/hide toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-[#94A3B8]">Login Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setApiError('');
                      setShowForgotPassword(true);
                    }}
                    className="text-[10.5px] text-[#38BDF8] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (apiError) setApiError('');
                  }}
                  placeholder={isSignUp ? "Alphanumeric (letters & numbers, min 6)" : "Enter login password"}
                  className="w-full rounded-xl bg-[#050B14] border border-[#162740] pl-8 pr-9 py-2 text-[13px] text-white focus:outline-none focus:border-[#00F0FF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] cursor-pointer transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Referral code (signup only) */}
            {isSignUp && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-[#94A3B8] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Referral Code</span>
                    <span className="text-[#64748B] text-[10.5px] font-normal">(Optional)</span>
                  </label>
                  {referralCode && (
                    <span className="text-[10px] text-[#10B981] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Auto-applied
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder=""
                  className="w-full rounded-xl bg-[#050B14] border border-[#162740] px-3 py-2 text-[13px] font-mono tracking-wider uppercase text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[44px] rounded-xl bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021326] font-extrabold text-[13.5px] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#021326] border-t-transparent rounded-full animate-spin" />
                  <span>{isSignUp ? 'Creating Account...' : 'Verifying Credentials...'}</span>
                </>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In to Portal'}</span>
              )}
            </button>

            {/* Switch mode */}
            <div className="pt-2 text-center text-[11px] text-[#94A3B8]">
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setApiError('');
                  onSwitchAuthMode();
                }}
                className="text-[#00F0FF] font-bold hover:underline cursor-pointer ml-1"
              >
                {isSignUp ? 'Sign In' : 'Create One'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
