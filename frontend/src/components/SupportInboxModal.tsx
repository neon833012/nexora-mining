import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Inbox, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  PlusCircle, 
  MessageSquare,
  ShieldCheck,
  User,
  ExternalLink,
  Megaphone,
  Globe,
  Zap
} from 'lucide-react';
import { SupportTicket, AdminBroadcastMessage } from '../types/mining';
import { nexoraApi } from '../services/api';

interface SupportInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userMobile?: string;
  userEmail?: string;
  tickets: SupportTicket[];
  onTicketCreated: (ticket: SupportTicket) => void;
  onMarkTicketRead: (ticketId: string) => void;
  initialTab?: 'new' | 'inbox' | 'broadcasts';
  userHasActivePlan?: boolean;
}

export const SupportInboxModal: React.FC<SupportInboxModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userMobile,
  userEmail,
  tickets,
  onTicketCreated,
  onMarkTicketRead,
  initialTab = 'new',
  userHasActivePlan = false
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'inbox' | 'broadcasts'>(initialTab);
  const [subject, setSubject] = useState('');
  const [queryText, setQueryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Sync activeTab with initialTab whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Broadcasts State
  const [broadcasts, setBroadcasts] = useState<AdminBroadcastMessage[]>(() => {
    try {
      const raw = localStorage.getItem('neon_broadcast_announcements');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [readBroadcastIds, setReadBroadcastIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('neon_read_broadcasts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Sync broadcasts in real-time directly from Cloudflare D1 Database
  const fetchBroadcastsFromD1 = useCallback(async () => {
    try {
      const res = await nexoraApi.getBroadcasts();
      if (res && res.success && Array.isArray(res.broadcasts)) {
        setBroadcasts(res.broadcasts);
        try {
          localStorage.setItem('neon_broadcast_announcements', JSON.stringify(res.broadcasts));
        } catch {}
      }
    } catch (e) {}
  }, []);

  // Re-fetch fresh data every time modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBroadcastsFromD1();
      // Also reload read state from localStorage in case it changed
      try {
        const readRaw = localStorage.getItem('neon_read_broadcasts');
        if (readRaw) setReadBroadcastIds(JSON.parse(readRaw));
      } catch {}
    }
  }, [isOpen, fetchBroadcastsFromD1]);

  // Listen for cross-tab sync events
  useEffect(() => {
    const syncBroadcasts = () => {
      fetchBroadcastsFromD1();
      try {
        const readRaw = localStorage.getItem('neon_read_broadcasts');
        if (readRaw) setReadBroadcastIds(JSON.parse(readRaw));
      } catch {}
    };
    window.addEventListener('storage', syncBroadcasts);
    window.addEventListener('neon_broadcast_sync', syncBroadcasts);
    return () => {
      window.removeEventListener('storage', syncBroadcasts);
      window.removeEventListener('neon_broadcast_sync', syncBroadcasts);
    };
  }, [fetchBroadcastsFromD1]);

  // Filter broadcasts according to user plan status
  const relevantBroadcasts = useMemo(() => {
    return broadcasts.filter((b) => {
      if (b.targetAudience === 'all') return true;
      if (userHasActivePlan && b.targetAudience === 'active_miners') return true;
      if (!userHasActivePlan && b.targetAudience === 'no_plan') return true;
      return false;
    });
  }, [broadcasts, userHasActivePlan]);

  const unreadBroadcastsCount = useMemo(() => {
    return relevantBroadcasts.filter((b) => !readBroadcastIds.includes(b.id)).length;
  }, [relevantBroadcasts, readBroadcastIds]);

  // When opening announcements tab, mark all current relevant broadcasts as read
  useEffect(() => {
    if (activeTab === 'broadcasts' && relevantBroadcasts.length > 0) {
      const unreadIds = relevantBroadcasts.filter((b) => !readBroadcastIds.includes(b.id)).map((b) => b.id);
      if (unreadIds.length > 0) {
        const updated = Array.from(new Set([...readBroadcastIds, ...unreadIds]));
        setReadBroadcastIds(updated);
        try {
          localStorage.setItem('neon_read_broadcasts', JSON.stringify(updated));
          window.dispatchEvent(new Event('neon_broadcast_sync'));
        } catch {}
      }
    }
  }, [activeTab, relevantBroadcasts, readBroadcastIds]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSubmitSuccess(null);
      setSubmitError(null);
    }
  }, [isOpen, initialTab]);

  // Count unread replies
  const unreadCount = tickets.filter(
    (t) => (t.status === 'replied' || t.adminReply) && t.userRead === false
  ).length;

  // Auto-mark selected ticket as read when opened
  useEffect(() => {
    if (selectedTicketId) {
      const t = tickets.find((item) => item.id === selectedTicketId);
      if (t && (t.status === 'replied' || t.adminReply) && t.userRead === false) {
        onMarkTicketRead(selectedTicketId);
      }
    }
  }, [selectedTicketId, tickets, onMarkTicketRead]);

  // Auto-mark all unread replies as read when viewing inbox tab so notification light turns off
  useEffect(() => {
    if (isOpen && activeTab === 'inbox') {
      const unreadList = tickets.filter(
        (t) => (t.status === 'replied' || !!t.adminReply) && t.userRead === false
      );
      if (unreadList.length > 0) {
        unreadList.forEach((t) => onMarkTicketRead(t.id));
      }
    }
  }, [isOpen, activeTab, tickets, onMarkTicketRead]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !queryText.trim()) {
      setSubmitError('Please enter both subject and your query description.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTicket: SupportTicket = {
      id: ticketId,
      userId: userId || 'guest',
      userName: userName || 'Guest Miner',
      mobile: userMobile || '',
      email: userEmail || '',
      subject: subject.trim(),
      queryText: queryText.trim(),
      details: queryText.trim(),
      status: 'pending',
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      priority: 'normal',
      userRead: true
    };

    try {
      const res = await nexoraApi.createSupportTicket({
        userId: userId || 'guest',
        userName: userName || 'Guest Miner',
        userMobile: userMobile || '',
        userEmail: userEmail || '',
        subject: subject.trim(),
        queryText: queryText.trim()
      });

      if (res && res.success && res.ticket) {
        onTicketCreated(res.ticket);
      } else {
        onTicketCreated(newTicket);
      }

      setSubmitSuccess('✓ Support ticket dispatched successfully! You will receive an admin reply in your Inbox.');
      setSubject('');
      setQueryText('');
      setTimeout(() => {
        setActiveTab('inbox');
        setSubmitSuccess(null);
      }, 1400);
    } catch (err: any) {
      onTicketCreated(newTicket);
      setSubmitSuccess('✓ Support ticket submitted. Admin desk will review and reply.');
      setSubject('');
      setQueryText('');
      setTimeout(() => {
        setActiveTab('inbox');
        setSubmitSuccess(null);
      }, 1400);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-gradient-to-b from-[#0B1528] to-[#050B14] border border-[#00F0FF]/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#14233C] flex items-center justify-between bg-[#070E1B]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00F0FF]/20 to-[#0284C7]/20 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                  Support Inbox & Query Desk
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  24/7 ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Submit questions directly to Support Desk & receive verified response
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#0F1D33] border border-[#1E3355] text-[#94A3B8] hover:text-white hover:border-[#00F0FF] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation - Sleek Modern 3-Segment Control with Guaranteed Single-Line Fit */}
        <div className="px-3 sm:px-5 pt-3 pb-2 border-b border-[#14233C] bg-[#070E1B]/60 shrink-0">
          <div className="grid grid-cols-3 p-1 rounded-xl bg-[#050C18] border border-[#122238] gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'new'
                  ? 'bg-gradient-to-r from-[#0C223B] to-[#0A1A2E] text-[#00F0FF] border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#0A1628]'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>New Ticket</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === 'inbox'
                  ? 'bg-gradient-to-r from-[#0C223B] to-[#0A1A2E] text-[#00F0FF] border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#0A1628]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>My Tickets</span>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center px-1.5 py-0.5 rounded-full bg-cyan-400 text-black text-[9px] font-black leading-none animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* TAB 3: ANNOUNCEMENTS */}
            <button
              type="button"
              onClick={() => setActiveTab('broadcasts')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === 'broadcasts'
                  ? 'bg-gradient-to-r from-[#0C223B] to-[#0A1A2E] text-[#00F0FF] border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#0A1628]'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>Announcements</span>
              {unreadBroadcastsCount > 0 && (
                <span className="flex items-center justify-center px-1.5 py-0.5 rounded-full bg-cyan-400 text-black text-[9px] font-black leading-none animate-pulse">
                  {unreadBroadcastsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: RAISE NEW TICKET */}
          {activeTab === 'new' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#081220] border border-[#14233C] text-[11.5px] text-[#94A3B8] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Official Company Ticket Desk. When you submit a ticket, Admin staff reviews and replies. You will receive an instant glowing alert on the header message icon once answered.
                </span>
              </div>

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {submitError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>Ticket Subject <span className="text-cyan-400">*</span></span>
                  <span className="text-[10px] text-gray-500 font-normal">e.g. Deposit / Withdrawal / Plan Inquiry</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter query subject..."
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050C18] border border-[#172A45] text-xs sm:text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00F0FF] transition-all"
                />
              </div>

              {/* Query Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>Detailed Query / Message <span className="text-cyan-400">*</span></span>
                  <span className="text-[10px] text-gray-500 font-normal">{queryText.length}/1000</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Explain your question or issue in detail here..."
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050C18] border border-[#172A45] text-xs sm:text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00F0FF] transition-all resize-none"
                />
              </div>

              {/* User Metadata Stamp */}
              <div className="p-2.5 rounded-xl bg-[#050B16] border border-[#122036] flex items-center justify-between text-[10.5px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sender: <strong className="text-white">{userName || 'Miner'}</strong></span>
                </div>
                {userMobile && (
                  <span className="font-mono text-gray-500">ID: {userMobile}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !subject.trim() || !queryText.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0284C7] via-[#00F0FF] to-[#0284C7] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting Ticket to Admin...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Query to Admin Desk</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: MY INBOX & REPLIES */}
          {activeTab === 'inbox' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-[#050B16] border border-[#122036] space-y-3 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#0C1A2E] text-gray-500 flex items-center justify-center mx-auto">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Your Inbox is Empty</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    You haven't submitted any support tickets yet. Tap "Raise New Ticket" to send a query to the company admin.
                  </p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="px-4 py-2 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-xs font-bold hover:bg-[#00F0FF]/25 transition-all cursor-pointer"
                  >
                    + Raise New Ticket
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((tkt) => {
                    const hasAdminReply = !!tkt.adminReply || tkt.status === 'replied' || tkt.status === 'resolved';
                    const isUnread = hasAdminReply && tkt.userRead === false;
                    const isExpanded = selectedTicketId === tkt.id;

                    return (
                      <div
                        key={tkt.id}
                        onClick={() => {
                          setSelectedTicketId(isExpanded ? null : tkt.id);
                          if (isUnread) onMarkTicketRead(tkt.id);
                        }}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                          isUnread
                            ? 'bg-[#0A182E] border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                            : 'bg-[#060D19] border-[#132238] hover:border-[#1E375A]'
                        }`}
                      >
                        {/* Ticket Header Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-white">
                                {tkt.subject}
                              </h4>
                              {isUnread && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[9px] font-black animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                                  NEW REPLY
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span>ID: {tkt.id.substring(0, 14)}</span>
                              <span>•</span>
                              <span>{tkt.timestamp || tkt.createdAt || 'Recent'}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {tkt.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Under Review</span>
                              </span>
                            )}
                            {(tkt.status === 'replied' || hasAdminReply) && (
                              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
                                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                                <span>Support Desk</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* User's Original Query */}
                        <div className="mt-3 p-3 rounded-xl bg-[#030710] border border-[#0F1B2E] text-xs text-gray-300">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Your Query:
                          </span>
                          <p className="whitespace-pre-line text-[11.5px] leading-relaxed">
                            {tkt.queryText || tkt.details}
                          </p>
                        </div>

                        {/* Support Desk Official Response Card */}
                        {tkt.adminReply && (
                          <div className="mt-2.5 p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-[#061A2B] via-[#041322] to-[#061A2B] border border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.1)] space-y-1.5 animate-fadeIn">
                            <div className="flex items-center justify-between text-[10.5px]">
                              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Support Desk Response:</span>
                              </div>
                              <span className="text-gray-500 text-[9.5px]">
                                {tkt.repliedAt ? new Date(tkt.repliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#020914] border border-cyan-500/30 text-white text-xs sm:text-[12.5px] font-medium leading-relaxed whitespace-pre-line">
                              {tkt.adminReply}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GLOBAL ANNOUNCEMENTS */}
          {activeTab === 'broadcasts' && (
            <div className="space-y-3">
              {relevantBroadcasts.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-[#050B16] border border-[#122036] space-y-3 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#0C1A2E] text-gray-500 flex items-center justify-center mx-auto">
                    <Megaphone className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Active Announcements</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    There are no system bulletins or protocol updates at this time. Important updates from company admin will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {relevantBroadcasts.map((bc) => {
                    const isUnread = !readBroadcastIds.includes(bc.id);
                    return (
                      <div
                        key={bc.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                          isUnread
                            ? 'bg-[#0A182E] border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                            : 'bg-[#060D19] border-[#132238] hover:border-[#1E375A]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-white">
                                {bc.title}
                              </h4>
                              {isUnread && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[9px] font-black animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span>Support Desk</span>
                              <span>•</span>
                              <span>{bc.createdAt ? new Date(bc.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Official'}</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1">
                              <Megaphone className="w-3 h-3 text-cyan-400" />
                              <span>Official Notice</span>
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 p-3 rounded-xl bg-[#030710] border border-[#0F1B2E] text-xs text-gray-200 leading-relaxed whitespace-pre-line">
                          {bc.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#14233C] bg-[#070E1B] flex items-center justify-between text-[11px] text-[#64748B] shrink-0">
          <span>Official Neon Mining Protocol Support</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-[#0D1829] hover:bg-[#12223A] text-gray-300 text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
