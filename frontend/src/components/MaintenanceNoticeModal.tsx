import React from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  X, 
  Activity, 
  Zap, 
  RefreshCw 
} from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const MaintenanceNoticeModal: React.FC<MaintenanceModalProps> = ({ isOpen, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onDismiss} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-[540px] rounded-2xl bg-[#091222] border border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden animate-scaleUp my-auto flex flex-col">
        {/* Glowing top line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-[#00F0FF]" />

        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-[#162742] relative flex items-start justify-between gap-3 bg-[#0A1628]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-[11px] font-black tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>Scheduled Infrastructure Upgrade</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Core Cloud Node Synchronization
              </h2>
            </div>
          </div>

          <button
            onClick={onDismiss}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#0D1A30] border border-[#1E3354] hover:border-amber-500/60 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-[13px] text-gray-300">
          {/* Main Notice Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/30 via-[#0B172A] to-[#0A1A32] border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-[12px] sm:text-[13px]">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Maintenance Window: Until Tomorrow, 06:00 AM IST</span>
            </div>
            <p className="text-gray-300 leading-relaxed text-[11.5px] sm:text-[12.5px]">
              Our engineers are currently performing a scheduled database optimization and global mining node capacity expansion to ensure zero-latency high-volume execution for all users.
            </p>
          </div>

          {/* Key Assurance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#0D1B2E] border border-emerald-500/30 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-emerald-300 font-bold text-[11px] sm:text-[12px]">Assets 100% Secure</div>
                <div className="text-gray-400 text-[10.5px] sm:text-[11px] mt-0.5 leading-snug">
                  All user balances, deposits, and funds remain fully protected in cold custody.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0D1B2E] border border-[#00F0FF]/30 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
              <div>
                <div className="text-[#00F0FF] font-bold text-[11px] sm:text-[12px]">Mining Yields Active</div>
                <div className="text-gray-400 text-[10.5px] sm:text-[11px] mt-0.5 leading-snug">
                  Cloud hashing algorithms continue calculating yields uninterrupted in the background.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0D1B2E] border border-cyan-500/30 flex items-start gap-2.5">
              <RefreshCw className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-cyan-300 font-bold text-[11px] sm:text-[12px]">Automatic Resumption</div>
                <div className="text-gray-400 text-[10.5px] sm:text-[11px] mt-0.5 leading-snug">
                  Real-time database queries, downlines, and ledger sync automatically restore at 06:00 AM IST.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0D1B2E] border border-amber-500/30 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-amber-300 font-bold text-[11px] sm:text-[12px]">No Action Required</div>
                <div className="text-gray-400 text-[10.5px] sm:text-[11px] mt-0.5 leading-snug">
                  Zero manual intervention needed. System will reload with high-speed performance.
                </div>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="p-3 rounded-xl bg-[#060D1A] border border-[#162742] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-[#00F0FF] animate-pulse" />
                Infrastructure Node Synchronization
              </span>
              <span className="text-amber-400 font-mono font-bold">88% Completed</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0D1A30] overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-[#00F0FF] transition-all duration-500" 
                style={{ width: '88%' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 pt-3 border-t border-[#162742] bg-[#0A1628]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Platform operational in preview / read-safe mode</span>
          </div>

          <button
            onClick={onDismiss}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 hover:from-amber-400 to-yellow-500 hover:to-yellow-400 text-[#030712] font-black text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer text-center"
          >
            I Understand & Explore Platform
          </button>
        </div>
      </div>
    </div>
  );
};

interface MaintenanceBannerProps {
  onOpenNotice: () => void;
}

export const MaintenanceTopBanner: React.FC<MaintenanceBannerProps> = ({ onOpenNotice }) => {
  return (
    <div className="w-full bg-gradient-to-r from-amber-950/90 via-[#1e1503]/95 to-slate-950 border-b border-amber-500/40 text-amber-200 text-xs py-2 px-3 sm:px-4 flex items-center justify-between gap-2 z-40 relative backdrop-blur-md">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 truncate text-[11px] sm:text-xs">
          <span className="font-extrabold text-amber-400 uppercase tracking-wider shrink-0">
            System Notice:
          </span>
          <span className="text-gray-200 truncate">
            Scheduled Cloud Node Upgrade in progress until <strong className="text-amber-300">Oct 10, 06:00 AM IST</strong>.
          </span>
          <span className="hidden md:inline-block text-emerald-400 font-medium">
            (All funds & mining yields are 100% secure)
          </span>
        </div>
      </div>

      <button
        onClick={onOpenNotice}
        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-[11px] font-bold tracking-tight shrink-0 transition-colors cursor-pointer whitespace-nowrap shadow-[0_0_10px_rgba(245,158,11,0.2)]"
      >
        View Notice
      </button>
    </div>
  );
};
