import React, { useState } from 'react';
import {
  X,
  ArrowDown,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Send,
  Wallet,
  ExternalLink
} from 'lucide-react';
import { DepositRecord } from '../types/mining';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  depositRecords: DepositRecord[];
  onOpenDepositDialog?: () => void;
}

export const DepositHistoryModal: React.FC<Props> = ({
  isOpen,
  onDismiss,
  depositRecords,
  onOpenDepositDialog
}) => {
  const [filter, setFilter] = useState<'all' | 'bep20' | 'p2p'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const validRecords = depositRecords.filter(
    (r) => !r.id?.startsWith('dep_seed_') && !r.id?.startsWith('demo_') && !r.id?.startsWith('dep_demo_')
  );

  const filteredRecords = validRecords.filter((rec) => {
    if (filter === 'all') return true;
    if (filter === 'bep20') return rec.type === 'bep20_deposit';
    if (filter === 'p2p') return rec.type === 'p2p_received';
    return true;
  });

  const totalDeposited = validRecords
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalP2PReceived = validRecords
    .filter((r) => r.type === 'p2p_received')
    .reduce((sum, r) => sum + r.amount, 0);

  const bep20Count = validRecords.filter((r) => r.type === 'bep20_deposit').length;
  const p2pCount = validRecords.filter((r) => r.type === 'p2p_received').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-[560px] max-h-[90vh] flex flex-col rounded-2xl bg-[#081220] border border-[#1C3558] shadow-[0_10px_40px_rgba(0,0,0,0.7)] animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Identical styling to WithdrawalHistoryModal */}
        <div className="px-5 py-4 border-b border-[#14263D] flex items-center justify-between bg-gradient-to-r from-[#091526] to-[#0A1B30]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <ArrowDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-white flex items-center gap-2">
                <span>Deposit History</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF]">
                  BEP-20
                </span>
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Real-time on-chain deposit & incoming transfer ledger
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

        {/* Quick Metrics Bar - Matching WithdrawalHistoryModal */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-[#050D18] border-b border-[#122237] text-[11px]">
          <div className="p-2.5 rounded-xl bg-[#081525] border border-[#162C47]">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">Settled Total</span>
            <span className="text-[14px] font-mono font-black text-[#10B981] block mt-0.5">
              +${totalDeposited.toFixed(2)}
            </span>
            <span className="text-[9.5px] text-[#94A3B8]">Completed Inflows</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#081525] border border-[#162C47]">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">P2P Inbound</span>
            <span className="text-[14px] font-mono font-black text-purple-400 block mt-0.5">
              +${totalP2PReceived.toFixed(2)}
            </span>
            <span className="text-[9.5px] text-[#94A3B8]">Internal Transfers</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#081525] border border-[#162C47]">
            <span className="text-[10px] uppercase font-bold text-[#64748B] block">Deposit Fee</span>
            <span className="text-[14px] font-mono font-black text-[#00F0FF] block mt-0.5">
              Flat 0%
            </span>
            <span className="text-[9.5px] text-[#94A3B8]">Binance Smart Chain</span>
          </div>
        </div>

        {/* Filter Pills - Matching WithdrawalHistoryModal */}
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
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('bep20')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filter === 'bep20'
                ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-[#0C192C] text-[#94A3B8] hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>BEP-20</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('p2p')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filter === 'p2p'
                ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-[#0C192C] text-[#94A3B8] hover:text-purple-400'
            }`}
          >
            <Send className="w-3 h-3" />
            <span>P2P Inbound</span>
          </button>
        </div>

        {/* Deposits List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-[#0F1E33] border border-[#1A3150] flex items-center justify-center text-[#64748B] mb-3">
                <ArrowDown className="w-6 h-6" />
              </div>
              <p className="text-[13px] font-bold text-[#CBD5E1]">No deposit records found</p>
              <p className="text-[11px] text-[#64748B] max-w-xs mt-1">
                {filter === 'all'
                  ? 'You have not made any deposits or received any P2P transfers yet.'
                  : 'There are currently no records matching this filter.'}
              </p>
              {onOpenDepositDialog && (
                <button
                  type="button"
                  onClick={() => {
                    onDismiss();
                    onOpenDepositDialog();
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[12px] flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Deposit USDT via BEP-20</span>
                </button>
              )}
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isP2P = rec.type === 'p2p_received';

              return (
                <div
                  key={rec.id}
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
                        <span className={`text-[16px] font-black font-mono ${isP2P ? 'text-purple-300' : 'text-[#10B981]'}`}>
                          +${rec.amount.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-[#00F0FF]">USDT</span>
                      </div>
                      <span className={`text-[9.5px] block mt-0.5 ${isP2P ? 'text-purple-400 font-bold' : 'text-[#64748B]'}`}>
                        {isP2P ? 'P2P Member Transfer · 0% Gas Fee' : 'BEP-20 On-Chain Deposit · 0% Fee'}
                      </span>
                    </div>

                    <div>
                      {isP2P ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold text-[10.5px]">
                          <Send className="w-3 h-3 text-purple-400" />
                          <span>P2P Transfer In</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-[10.5px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Settled & Confirmed</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Origin / Sender */}
                  <div className="p-2 rounded-lg bg-[#040A14] border border-[#101E31] flex items-center justify-between text-[11px]">
                    <div className="truncate mr-2">
                      <span className="text-[9.5px] text-[#64748B] block uppercase font-bold">
                        {isP2P ? 'Transferred By (Sender Member):' : 'Receiving Network (BEP-20):'}
                      </span>
                      <span className={`font-mono text-[10.5px] truncate block ${isP2P ? 'text-purple-300 font-bold' : 'text-[#CBD5E1]'}`}>
                        {isP2P ? `@${(rec.senderId || '').replace(/^@/, '') || 'Internal Member'}` : 'BNB Smart Chain (BEP-20)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(isP2P ? ((rec.senderId || '').replace(/^@/, '') || 'Member') : 'BNB Smart Chain (BEP-20)', `dep_source_${rec.id}`)}
                      className="shrink-0 px-2 py-1 rounded bg-[#0D1E34] hover:bg-[#162D4C] text-[#00F0FF] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedId === `dep_source_${rec.id}` ? (
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
                    <span>{rec.timestamp}</span>
                    {rec.txHash && (
                      <div className="flex items-center gap-1 font-mono text-[#00F0FF]">
                        {rec.txHash.startsWith('0x') && rec.txHash.length === 66 ? (
                          <a
                            href={`https://bscscan.com/tx/${rec.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-0.5"
                            title="View on BscScan Explorer"
                          >
                            <span>Hash: {rec.txHash.substring(0, 10)}...${rec.txHash.substring(rec.txHash.length - 8)}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        ) : (
                          <span>Hash: {rec.txHash.length > 22 ? `${rec.txHash.substring(0, 10)}...${rec.txHash.substring(rec.txHash.length - 8)}` : rec.txHash}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(rec.txHash || '', `dep_tx_${rec.id}`)}
                          className="hover:text-white cursor-pointer ml-0.5"
                          title="Copy full transaction hash"
                        >
                          {copiedId === `dep_tx_${rec.id}` ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer - Identical to WithdrawalHistoryModal */}
        <div className="px-5 py-3 border-t border-[#14263D] bg-[#050D18] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10.5px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Audited by Binance Smart Chain Smart Contract</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenDepositDialog && (
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onOpenDepositDialog();
                }}
                className="px-3 py-1 rounded-lg bg-[#0E1E34] hover:bg-[#1A345A] border border-[#1C3558] hover:border-[#00F0FF]/60 text-[#00F0FF] text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              >
                <ArrowDown className="w-3 h-3" />
                <span>+ Deposit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
