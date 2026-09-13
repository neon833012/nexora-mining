import React, { useState } from 'react';
import {
  X,
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
  Check,
  Link2,
  Settings,
  Sparkles
} from 'lucide-react';
import { UserRole, WithdrawalRequest, SupportTicket, SubAdminUser } from '../types/mining';

interface Props {
  isOpen: boolean;
  currentRole: UserRole;
  withdrawalRequests: WithdrawalRequest[];
  supportTickets: SupportTicket[];
  subAdmins: SubAdminUser[];
  onSelectRole: (role: UserRole) => void;
  onApproveWithdrawal: (id: string) => void;
  onRejectWithdrawal: (id: string, reason: string) => void;
  onResetUserFundPin: (ticketId: string, userName: string, newPin: string) => void;
  onAddSubAdmin: (admin: SubAdminUser) => void;
  onClose: () => void;
}

export const AdminPortalModal: React.FC<Props> = ({
  isOpen,
  currentRole,
  withdrawalRequests = [],
  supportTickets = [],
  subAdmins = [],
  onSelectRole,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onResetUserFundPin,
  onAddSubAdmin,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'tickets' | 'users' | 'subadmins' | 'settings'>('withdrawals');
  const [newSubAdminName, setNewSubAdminName] = useState('');
  const [newSubAdminEmail, setNewSubAdminEmail] = useState('');
  const [canApprove, setCanApprove] = useState(true);
  const [canResetPin, setCanResetPin] = useState(true);
  const [rejectPromptId, setRejectPromptId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Security audit pending');
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null);
  const handleCopyWallet = (address: string, id: string) => {
    if (!address) return;
    navigator.clipboard?.writeText(address);
    setCopiedWalletId(id);
    setTimeout(() => setCopiedWalletId(null), 2000);
  };

  if (!isOpen) return null;

  const isSuperadmin = currentRole === 'superadmin';
  const isSubadmin = currentRole === 'subadmin';

  const pendingWithdrawals = withdrawalRequests.filter((r) => r.status === 'pending');
  const pendingTickets = supportTickets.filter((t) => t.status === 'pending');

  const handleCreateSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubAdminName.trim() || !newSubAdminEmail.trim()) return;

    const newAdmin: SubAdminUser = {
      id: `sub_${Date.now()}`,
      name: newSubAdminName.trim(),
      email: newSubAdminEmail.trim(),
      canApproveWithdrawals: canApprove,
      canResetPasswords: canResetPin,
      maxApprovalLimit: 100
    };

    onAddSubAdmin(newAdmin);
    setNewSubAdminName('');
    setNewSubAdminEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#091220] border border-[#1E3352] shadow-2xl flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="p-4 bg-[#0D1829] border-b border-[#182840] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 border border-[#EF4444] flex items-center justify-center text-[#EF4444]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#F43F5E] uppercase tracking-wider block">
                MANAGEMENT CONSOLE
              </span>
              <h3 className="text-[16px] font-black text-[#F8FAFC] flex items-center gap-1.5">
                <span>{isSuperadmin ? 'Superadmin Executive Portal' : isSubadmin ? 'Sub-Admin Operations Desk' : 'Admin Control Room'}</span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#15253C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Private Direct Owner Link Notice */}
        <div className="px-4 py-2 bg-[#061122] border-b border-[#142338] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-[#38BDF8]">
            <Link2 className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
            <span>Private Admin Link: <code className="bg-black/50 px-2 py-0.5 rounded text-[#00F0FF] font-mono font-bold">/?admin=portal</code></span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(`${window.location.origin}/?admin=portal`);
              setCopiedAdminLink(true);
              setTimeout(() => setCopiedAdminLink(false), 2000);
            }}
            className="text-[10.5px] px-2.5 py-1 rounded bg-[#0A1E38] border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 flex items-center gap-1 cursor-pointer font-bold transition-all"
          >
            <Copy className="w-3 h-3" />
            <span>{copiedAdminLink ? 'Copied URL!' : 'Copy Direct Link'}</span>
          </button>
        </div>

        {/* Role Switcher */}
        <div className="p-3 bg-[#060D17] border-b border-[#142338]">
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mb-1.5 font-semibold">
            <span>ACTIVE ROLE VIEW:</span>
            <span className="text-[#00F0FF] uppercase">{currentRole}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['user', 'subadmin', 'superadmin'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => onSelectRole(role)}
                className={`py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  currentRole === role
                    ? role === 'superadmin'
                      ? 'bg-[#EF4444] text-white shadow-md'
                      : role === 'subadmin'
                      ? 'bg-[#FBBF24] text-black shadow-md'
                      : 'bg-[#0284C7] text-white shadow-md'
                    : 'bg-[#0D1829] border border-[#1C2C44] text-[#94A3B8] hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#162740] bg-[#0A1424] text-[11px] font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 min-w-[100px] py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#0E1E34]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <span>Withdrawals</span>
            {pendingWithdrawals.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] flex items-center justify-center font-bold">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 min-w-[90px] py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#0E1E34]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <span>PIN Resets</span>
            {pendingTickets.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FBBF24] text-black text-[9px] flex items-center justify-center font-bold">
                {pendingTickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[90px] py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#0E1E34]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Miners</span>
          </button>

          <button
            onClick={() => setActiveTab('subadmins')}
            className={`flex-1 min-w-[90px] py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'subadmins'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#0E1E34]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <span>Sub-Admins</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 min-w-[90px] py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#00F0FF] text-[#00F0FF] bg-[#0E1E34]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>Rules</span>
          </button>
        </div>

        {/* Tab 1: Pending Withdrawals Queue */}
        {activeTab === 'withdrawals' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span>Pending Approvals ({pendingWithdrawals.length})</span>
              {isSubadmin && (
                <span className="text-amber-400">Sub-Admin: Max $100 Approval</span>
              )}
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="py-8 text-center text-[#64748B] text-[12px] space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-[#10B981]/50" />
                <p>All withdrawal requests have been audited & settled!</p>
              </div>
            ) : (
              pendingWithdrawals.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-[#060D18] border border-[#142338] space-y-2 text-[12px]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-white text-[13px]">{req.userName}</strong>
                      <span className="text-[10.5px] text-[#94A3B8] block font-mono">{req.userMobile}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyWallet(req.walletAddress, req.id)}
                        className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0A1628] hover:bg-cyan-500/20 border border-[#162B48] hover:border-cyan-500/40 text-[10px] text-gray-300 hover:text-cyan-300 font-mono transition-all cursor-pointer group"
                        title="Click to copy recipient wallet"
                      >
                        <span className="truncate max-w-[170px]">{req.walletAddress}</span>
                        {copiedWalletId === req.id ? (
                          <span className="text-[9px] text-emerald-400 font-bold">✓ Copied</span>
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-gray-400 group-hover:text-cyan-300" />
                        )}
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[15px] font-black text-[#F8FAFC] block">
                        {req.amount.toFixed(2)} USDT
                      </span>
                      <span className="text-[10px] text-[#10B981] font-bold">
                        Net: {req.netAmount.toFixed(2)} USDT
                      </span>
                    </div>
                  </div>

                  {/* Actions: Approve / Reject */}
                  {rejectPromptId === req.id ? (
                    <div className="p-2 rounded bg-[#101C2E] border border-[#1D304C] space-y-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason..."
                        className="w-full text-[11px] p-1.5 rounded bg-[#070D18] border border-[#1E304B] text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRejectPromptId(null)}
                          className="flex-1 py-1 rounded bg-[#1C2C44] text-[11px] text-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onRejectWithdrawal(req.id, rejectReason);
                            setRejectPromptId(null);
                          }}
                          className="flex-1 py-1 rounded bg-red-600 text-white font-bold text-[11px]"
                        >
                          Confirm Reject & Refund
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setRejectPromptId(req.id)}
                        className="flex-1 py-1.5 rounded-lg bg-[#3B0A0A] border border-[#EF4444]/40 text-[#EF4444] font-bold text-[11px] hover:bg-[#EF4444] hover:text-white transition-all cursor-pointer"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => onApproveWithdrawal(req.id)}
                        disabled={isSubadmin && req.amount > 100}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isSubadmin && req.amount > 100
                            ? 'bg-[#152438] text-[#64748B] border border-[#1A2C42] cursor-not-allowed'
                            : 'bg-[#10B981] text-[#02180F] hover:bg-[#059669]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isSubadmin && req.amount > 100 ? 'Limit Exceeded ($100)' : 'Approve & Release'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Fund Password Reset Requests */}
        {activeTab === 'tickets' && (
          <div className="p-4 space-y-3">
            <span className="text-[11px] text-[#94A3B8] block">
              Pending Fund PIN Reset Requests ({pendingTickets.length})
            </span>

            {pendingTickets.length === 0 ? (
              <div className="py-8 text-center text-[#64748B] text-[12px]">
                <KeyRound className="w-8 h-8 mx-auto text-[#00F0FF]/40 mb-1" />
                <p>No pending PIN reset tickets.</p>
              </div>
            ) : (
              pendingTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3 rounded-xl bg-[#060D18] border border-[#142338] space-y-2 text-[12px]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-white">{ticket.userName}</strong>
                      <span className="text-[10px] text-[#94A3B8] block font-mono">{ticket.mobile}</span>
                      <p className="mt-1 text-[11px] text-[#CBD5E1] bg-[#0A1526] p-2 rounded border border-[#15233A]">
                        "{ticket.details}"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onResetUserFundPin(ticket.id, ticket.userName, '888888')}
                    className="w-full py-1.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Approve & Reset PIN to '888888'</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Sub-Admin Delegation (Superadmin Only) */}
        {activeTab === 'subadmins' && (
          <div className="p-4 space-y-4">
            {/* Create Sub-Admin Form */}
            {isSuperadmin ? (
              <form onSubmit={handleCreateSubAdmin} className="p-3.5 rounded-xl bg-[#060D18] border border-[#142338] space-y-3">
                <span className="text-[11px] font-bold text-[#00F0FF] uppercase tracking-wider block">
                  Add New Sub-Admin with Restrictions
                </span>

                <div>
                  <label className="text-[10.5px] text-[#94A3B8] block">Sub-Admin Name:</label>
                  <input
                    type="text"
                    required
                    value={newSubAdminName}
                    onChange={(e) => setNewSubAdminName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full mt-1 p-2 rounded-lg bg-[#0A1424] border border-[#1A2C44] text-[12px] text-white"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] text-[#94A3B8] block">Official Email:</label>
                  <input
                    type="email"
                    required
                    value={newSubAdminEmail}
                    onChange={(e) => setNewSubAdminEmail(e.target.value)}
                    placeholder="e.g. audit.desk@neon-mining.io"
                    className="w-full mt-1 p-2 rounded-lg bg-[#0A1424] border border-[#1A2C44] text-[12px] text-white"
                  />
                </div>

                {/* Granular Restrictions Checkboxes */}
                <div className="space-y-1.5 text-[11px]">
                  <label className="flex items-center gap-2 text-[#CBD5E1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canApprove}
                      onChange={(e) => setCanApprove(e.target.checked)}
                      className="rounded border-[#1A2C44]"
                    />
                    <span>Can Audit & Approve Withdrawals (&lt; $100)</span>
                  </label>

                  <label className="flex items-center gap-2 text-[#CBD5E1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canResetPin}
                      onChange={(e) => setCanResetPin(e.target.checked)}
                      className="rounded border-[#1A2C44]"
                    />
                    <span>Can Reset User Fund Passwords</span>
                  </label>

                  <div className="flex items-center gap-2 text-[#EF4444] text-[10.5px] font-bold pt-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Treasury Reserves & Smart Contract Parameters: BLOCKED ❌</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Sub-Admin</span>
                </button>
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-[#3B0A0A]/40 border border-[#EF4444]/40 text-[#EF4444] text-[12px]">
                ⚠️ Only Superadmin can create or delegate Sub-Admins. Switch active view to "Superadmin" above.
              </div>
            )}

            {/* List of Existing Sub-Admins */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase block">
                Active Sub-Admins ({subAdmins.length})
              </span>

              {subAdmins.map((adm) => (
                <div
                  key={adm.id}
                  className="p-3 rounded-xl bg-[#060D18] border border-[#142338] text-[11.5px] space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-white">{adm.name}</strong>
                    <span className="px-2 py-0.5 rounded bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24] font-bold text-[9.5px]">
                      SUB-ADMIN
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] block">{adm.email}</span>
                  <div className="flex gap-3 text-[10px] text-[#10B981] pt-1">
                    <span>✓ Approvals &lt; ${adm.maxApprovalLimit}</span>
                    <span>✓ PIN Resets</span>
                    <span className="text-[#EF4444]">✕ Treasury Locked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Miners Directory */}
        {activeTab === 'users' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span>REGISTERED MINERS & STAKES</span>
              <span className="text-[#00F0FF] font-mono font-bold">18,420+ Online</span>
            </div>

            <div className="space-y-2 text-[12px]">
              {[
                { id: 'NEON473628', mobile: '+91 9876543210', stake: '50.00 USDT', pin: '888888', refStatus: 'ACTIVE (Plan Active)', balance: '412.68 USDT', isCurrent: true },
                { id: 'NEON912248', mobile: '+91 9811223344', stake: '20.00 USDT', pin: '888888', refStatus: 'ACTIVE (Plan Active)', balance: '94.20 USDT', isCurrent: false },
                { id: 'NEON319082', mobile: '+44 7911123456', stake: '0.00 USDT', pin: '123456', refStatus: 'INACTIVE (No Plan Purchased)', balance: '0.00 USDT', isCurrent: false },
                { id: 'NEON882419', mobile: '+971 501234567', stake: '200.00 USDT', pin: '888888', refStatus: 'ACTIVE (Tier 4 VIP)', balance: '782.50 USDT', isCurrent: false },
              ].map((user) => (
                <div key={user.id} className={`p-3 rounded-xl border ${user.isCurrent ? 'bg-[#08182E] border-[#00F0FF]/40' : 'bg-[#060D18] border-[#142338]'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-white">{user.id}</span>
                      {user.isCurrent && (
                        <span className="px-1.5 py-0.2 rounded bg-[#00F0FF]/20 text-[#00F0FF] text-[9.5px] font-bold">YOU</span>
                      )}
                    </div>
                    <span className="text-[#10B981] font-bold font-mono">{user.balance}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>Mobile: {user.mobile}</span>
                    <span className="font-mono">Fund PIN: <strong className="text-amber-300">{user.pin}</strong></span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
                    <span className="text-[#CBD5E1]">Stake: <strong className="text-white">{user.stake}</strong></span>
                    <span className={`px-2 py-0.5 rounded font-bold ${user.refStatus.startsWith('ACTIVE') ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                      {user.refStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Platform Rules & Settings */}
        {activeTab === 'settings' && (
          <div className="p-4 space-y-3.5 text-[12px]">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span>ACTIVE SYSTEM RULES & POLICIES</span>
              <span className="text-emerald-400 font-bold">● ENFORCED</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#060D18] border border-[#162740] flex items-center justify-between">
                <div>
                  <strong className="text-white block">Minimum Withdrawal Threshold</strong>
                  <span className="text-[11px] text-[#94A3B8]">Requests below this amount are blocked automatically</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] font-black font-mono">
                  2.00 USDT
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#060D18] border border-[#162740] flex items-center justify-between">
                <div>
                  <strong className="text-white block">Withdrawal Fee Rate</strong>
                  <span className="text-[11px] text-[#94A3B8]">Deducted upon admin on-chain queue dispatch</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 font-black font-mono">
                  5.00%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#060D18] border border-[#162740] flex items-center justify-between">
                <div>
                  <strong className="text-white block">Withdrawal Velocity Rate Limit</strong>
                  <span className="text-[11px] text-[#94A3B8]">Cooldown required between successive requests</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black font-mono">
                  1 per 24 Hours
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#060D18] border border-[#162740] flex items-center justify-between">
                <div>
                  <strong className="text-white block">Active Miners Velocity</strong>
                  <span className="text-[11px] text-[#94A3B8]">Live counter dynamic progression</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-black font-mono">
                  +10 Miners / Min
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#060D18] border border-[#162740] flex items-center justify-between">
                <div>
                  <strong className="text-white block">Referral Code Activation Rule</strong>
                  <span className="text-[11px] text-[#94A3B8]">Must purchase at least 1 plan to earn commissions</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] font-bold">
                  Strictly Enforced
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
