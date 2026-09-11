import React, { useState } from 'react';
import {
  X,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Send
} from 'lucide-react';
import { WithdrawalRequest } from '../types/mining';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  withdrawalRequests: WithdrawalRequest[];
  onRequestNewWithdrawal?: () => void;
}

export const WithdrawalHistoryModal: React.FC<Props> = ({
  isOpen,
  onDismiss,
  withdrawalRequests,
  onRequestNewWithdrawal
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRequests = withdrawalRequests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const totalWithdrawn = withdrawalRequests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingAmount = withdrawalRequests
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingCount = withdrawalRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = withdrawalRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = withdrawalRequests.filter((r) => r.status === 'rejected').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-[560px] max-h-[90vh] flex flex-col rounded-2xl bg-[#081220] border border-[#1C3558] shadow-[0_10px_40px_rgba(0,0,0,0.7)] animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#14263D] flex items-center justify-between bg-gradient-to-r from-[#091526] to-[#0A1B30]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-white flex items-center gap-2">
                <span>Withdrawal History</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF]">
                  BEP-20
                </span>
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Real-time on-chain payout status & settlement ledger
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            title="Close"
            className="w-8 h-8 rounded-lg bg-[#0E1E34] hover:bg-[#1A345A] text-[#94A3B8] hover:text-white border border-[#1C3558] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-[#050D18] border-b border-[#122237] text-[11px]">
          <div className="p-2.5 rounded-xl bg-[#081525] border border-[#162C47]">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">Settled Total</span>
            <span className="text-[14px] font-mono font-black text-[#10B981] block mt-0.5">
              ${totalWithdrawn.toFixed(2)}
            </span>
            <span className="text-[9.5px] text-[#94A3B8]">{approvedCount} Cashout{approvedCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#081525] border border-[#162C47]">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">Pending Audit</span>
            <span className="text-[14px] font-mono font-black text-[#FBBF24] block mt-0.5">
              ${pendingAmount.toFixed(2)}
            </span>
            <span className="text-[9.5px] text-[#94A3B8]">{pendingCount} Request{pendingCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#081525] border border-[#162C47]">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">Network Fee</span>
            <span className="text-[14px] font-mono font-black text-[#00F0FF] block mt-0.5">
              Flat 5%
            </span>
            <span className="text-[9.5px] text-[#94A3B8]">Binance Smart Chain</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto border-b border-[#122237]">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#00F0FF] text-[#04111D] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-[#0C192C] text-[#94A3B8] hover:text-white'
            }`}
          >
            All ({withdrawalRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filter === 'pending'
                ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-[#0C192C] text-[#94A3B8] hover:text-amber-400'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('approved')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filter === 'approved'
                ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-[#0C192C] text-[#94A3B8] hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Settled ({approvedCount})</span>
          </button>
          {rejectedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('rejected')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filter === 'rejected'
                  ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'bg-[#0C192C] text-[#94A3B8] hover:text-red-400'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Rejected ({rejectedCount})</span>
            </button>
          )}
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-[#0F1E33] border border-[#1A3150] flex items-center justify-center text-[#64748B] mb-3">
                <History className="w-6 h-6" />
              </div>
              <p className="text-[13px] font-bold text-[#CBD5E1]">No withdrawal records found</p>
              <p className="text-[11px] text-[#64748B] max-w-xs mt-1">
                {filter === 'all'
                  ? 'You have not submitted any withdrawal requests yet. Minimum required balance is 2.00 USDT.'
                  : `There are currently no withdrawals matching "${filter}" status.`}
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isP2P = req.type === 'p2p_transfer';

              return (
                <div
                  key={req.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2.5 shadow-sm ${
                    isP2P
                      ? 'bg-gradient-to-r from-[#0C1026] to-[#070D1C] border-[#2E1E52] hover:border-purple-500/50'
                      : 'bg-[#060F1C] border-[#162842] hover:border-[#213C64]'
                  }`}
                >
                  {/* Row 1: Amount & Status Badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-[16px] font-black font-mono ${isP2P ? 'text-purple-300' : 'text-white'}`}>
                          -${req.amount.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#00F0FF]">USDT</span>
                        {!isP2P && (
                          <span className="text-[10px] text-[#94A3B8] font-mono">
                            (Net: ${req.netAmount.toFixed(2)})
                          </span>
                        )}
                      </div>
                      <span className={`text-[9.5px] block mt-0.5 ${isP2P ? 'text-purple-400 font-bold' : 'text-[#64748B]'}`}>
                        {isP2P ? 'P2P Member Transfer · 0% Gas Fee' : `5% Gas Fee: -$${req.fee.toFixed(2)} USDT`}
                      </span>
                    </div>

                    <div>
                      {isP2P ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold text-[10.5px]">
                          <Send className="w-3 h-3 text-purple-400" />
                          <span>P2P Transfer Sent</span>
                        </span>
                      ) : req.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-[10.5px]">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Pending Settlement & Audit</span>
                        </span>
                      ) : req.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-[10.5px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Settled & Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 font-bold text-[10.5px]">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Destination Wallet Address or Recipient Member */}
                  <div className="p-2 rounded-lg bg-[#040A14] border border-[#101E31] flex items-center justify-between text-[11px]">
                    <div className="truncate mr-2">
                      <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">
                        {isP2P ? 'Transferred To (Recipient Member):' : 'Destination Wallet (BEP-20):'}
                      </span>
                      <span className={`font-mono text-[10.5px] truncate block ${isP2P ? 'text-purple-300 font-bold' : 'text-[#CBD5E1]'}`}>
                        {isP2P ? `@${req.recipientId || req.walletAddress.replace('P2P Transfer to @', '')}` : req.walletAddress}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(isP2P ? (req.recipientId || req.walletAddress) : req.walletAddress, `wallet_${req.id}`)}
                      className="shrink-0 px-2 py-1 rounded bg-[#0D1E34] hover:bg-[#162D4C] text-[#00F0FF] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedId === `wallet_${req.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                {/* Row 3: Meta & TX Hash */}
                <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-0.5">
                  <span>{req.timestamp}</span>
                  {req.txHash && (
                    <div className="flex items-center gap-1 font-mono text-[#00F0FF]">
                      <span>Hash: {req.txHash}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(req.txHash || '', `tx_${req.id}`)}
                        className="hover:text-white cursor-pointer ml-0.5"
                      >
                        {copiedId === `tx_${req.id}` ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  )}
                  {req.rejectionReason && (
                    <span className="text-red-400 font-medium truncate max-w-[200px]">
                      Reason: {req.rejectionReason}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#14263D] bg-[#050D18] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10.5px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Audited by Binance Smart Chain Smart Contract</span>
          </div>
          <span className="text-[10px] text-[#64748B] font-mono">Instant BEP-20 Ledger</span>
        </div>
      </div>
    </div>
  );
};
