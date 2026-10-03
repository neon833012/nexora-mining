import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Clock,
  Headphones,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Download,
  FileText,
  ExternalLink,
  Ticket
} from 'lucide-react';
import { ChatMessage, SupportTicket, LiveChatSession } from '../types/mining';
import { nexoraApi } from '../services/api';

interface Props {
  onDispatchEmergencyTicket?: (ticket: SupportTicket) => void;
  currentUser?: {
    id?: string;
    name?: string;
    mobile?: string;
    email?: string;
    planName?: string;
    availableBalance?: number;
  };
  onOpenInbox?: () => void;
}

const STORAGE_KEY = 'neon_live_chat_sessions';

const getStoredSessions = (): LiveChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading chat sessions:', e);
    return [];
  }
};

const saveStoredSessions = (sessions: LiveChatSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new Event('neon_chat_sync'));
  } catch (e) {
    console.error('Error saving chat sessions:', e);
  }
};

// Robust 1-Click File Downloader — opens in new tab so user sees full PDF, also triggers download
export const triggerPdfDownload = (
  url: string = '/Neon Mining Official Info.pdf',
  filename: string = 'Neon Mining Official Info.pdf'
) => {
  try {
    // Open in new tab first so the full PDF renders without being cut
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (e) {
    window.open(url, '_blank');
  }
};

// Clean Inline Text Formatter: Strips ALL raw asterisks (* and **) completely and renders clean bold text, links, and readable text
const parseInlineFormatting = (line: string): React.ReactNode => {
  if (!line) return '';
  const normalized = line.replace(/\*\*\*/g, '**');
  const tokens = normalized.split(/(\*\*[^*]+?\*\*|\[[^\]]+?\]\([^)]+?\))/g);

  return tokens.map((token, i) => {
    // Markdown link: [text](url)
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1].replace(/[*_]/g, '');
      const linkHref = linkMatch[2];
      return (
        <a
          key={i}
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00F0FF] hover:underline font-bold"
        >
          {linkText}
        </a>
      );
    }

    // Markdown bold: **text**
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      const inner = token.slice(2, -2).replace(/[*_]/g, '').trim();
      return (
        <strong key={i} className="font-bold text-white">
          {inner}
        </strong>
      );
    }

    // Standard text: Strip any isolated or stray * or ** so stars NEVER appear raw
    return <span key={i}>{token.replace(/[*_]/g, '')}</span>;
  });
};

// Rich Interactive Content & Direct PDF Download Card Renderer
const renderRichMessageContent = (text: string, isUserMessage: boolean = false) => {
  if (isUserMessage) {
    return <p className="whitespace-pre-wrap">{text.replace(/[*_]/g, '')}</p>;
  }

  const isPdfMessage =
    text.includes('.pdf') ||
    text.includes('Business Plan PDF') ||
    text.includes('Official Presentation') ||
    text.includes('Official PDF Presentation') ||
    text.includes('Download Official PDF');

  if (isPdfMessage) {
    return (
      <div className="space-y-2.5">
        <div className="font-medium text-[11.5px] text-gray-200">
          <span className="text-white font-bold">📄 Official Neon Mining Info PDF</span>
          <p className="text-[10.5px] text-gray-400 mt-0.5">
            Complete official presentation with plan economics, cycles, and rules.
          </p>
        </div>

        {/* Primary Direct Download Action Card */}
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#0284C7]/20 to-[#00F0FF]/15 border border-[#00F0FF]/40 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF]/50 flex items-center justify-center text-[#00F0FF] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate flex-1">
              <span className="text-[11.5px] font-bold text-white block truncate">
                Neon Mining Official Info.pdf
              </span>
              <span className="text-[9.5px] text-cyan-300 font-mono">
                Official Guide • Full Info Document
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {/* Button 1: Open PDF in new tab for full viewing */}
            <a
              href="/Neon Mining Official Info.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 rounded-lg bg-[#00F0FF] hover:bg-cyan-300 active:scale-95 text-black font-black text-[10.5px] flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer no-underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open PDF</span>
            </a>
            {/* Button 2: Direct download */}
            <a
              href="/Neon Mining Official Info.pdf"
              download="Neon Mining Official Info.pdf"
              className="px-2 py-1.5 rounded-lg bg-[#07162C] hover:bg-[#0E2548] active:scale-95 border border-cyan-500/40 text-cyan-300 font-bold text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer no-underline"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </a>
          </div>
        </div>

        <p className="text-[10px] text-gray-400">
          • Includes: All plan details, daily rates, withdrawal rules, referral system & more.
        </p>
      </div>
    );
  }

  // Clean Structured Text Formatter: Strips stars, renders clean bold and bullet points
  const lines = text.split('\n');
  const formattedElements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Spacing for empty lines
    if (!trimmed) {
      formattedElements.push(<div key={`gap_${idx}`} className="h-1" />);
      return;
    }

    // Bullet points (• , - , * )
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletContent = trimmed.replace(/^[•\-*]\s+/, '');
      formattedElements.push(
        <div key={`line_${idx}`} className="flex items-start gap-1.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] mt-1.5 shrink-0 shadow-[0_0_5px_#00F0FF]" />
          <div className="flex-1 text-[#CBD5E1] text-[11px] sm:text-[11.5px] leading-relaxed">
            {parseInlineFormatting(bulletContent)}
          </div>
        </div>
      );
      return;
    }

    // Numbered list items (1. , 2. )
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const content = numberedMatch[2];
      formattedElements.push(
        <div key={`line_${idx}`} className="flex items-start gap-1.5 py-0.5">
          <span className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/40 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <div className="flex-1 text-[#CBD5E1] text-[11px] sm:text-[11.5px] leading-relaxed">
            {parseInlineFormatting(content)}
          </div>
        </div>
      );
      return;
    }

    // Highlight / Notice box (⚡, ⚠️, 🚨, 🎫, 👉)
    if (
      trimmed.startsWith('⚡') ||
      trimmed.startsWith('⚠️') ||
      trimmed.startsWith('🚨') ||
      trimmed.startsWith('🎫') ||
      trimmed.startsWith('👉')
    ) {
      formattedElements.push(
        <div
          key={`line_${idx}`}
          className="my-1 p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-[10.5px] sm:text-[11px] leading-relaxed shadow-sm"
        >
          {parseInlineFormatting(trimmed)}
        </div>
      );
      return;
    }

    // Standard Heading or Paragraph
    formattedElements.push(
      <p key={`line_${idx}`} className="text-[#CBD5E1] text-[11px] sm:text-[11.5px] leading-relaxed">
        {parseInlineFormatting(trimmed)}
      </p>
    );
  });

  return <div className="space-y-0.5">{formattedElements}</div>;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    sender: 'ai',
    text: "👋 Welcome to Neon Support! I am your 24/7 intelligent mining assistant. Ask me anything about all 7 mining plans ($20 to $3,000), 24h proof-of-activity cycles, $2.00 min cashouts, 0% P2P transfers, or compounding auto-upgrades!\n\nIf you need personal assistance, tap 'Raise Ticket' anytime.",
    timestamp: 'Just now'
  }
];

const PRESET_PROMPTS = [
  '📄 Official PDF',
  '⚡ 7 Mining Plans',
  '💰 Withdraw & Fee',
  '⏱️ 24H Mining Cycle',
  '🔄 Compounding',
  '🤝 0% P2P Transfers',
  '👥 Referral Boosters',
  '🎫 Raise Ticket'
];

const filterCleanMessages = (msgs: ChatMessage[]): ChatMessage[] => {
  return (msgs || []).filter((msg) => {
    const textLower = (msg.text || '').toLowerCase();
    return (
      !textLower.includes('query resolved') &&
      !textLower.includes('resolved your inquiry') &&
      !textLower.includes('specialist has resolved') &&
      !textLower.includes('[query resolved]')
    );
  });
};

export const NeonAIChatAssistant: React.FC<Props> = ({ onDispatchEmergencyTicket, currentUser, onOpenInbox }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rawUserId = currentUser?.id && currentUser.id !== 'guest_user' ? currentUser.id : null;
  const userIdentifier = rawUserId || (typeof window !== 'undefined' ? localStorage.getItem('neon_guest_chat_id') || `guest_${Date.now().toString().slice(-4)}` : 'guest');
  
  useEffect(() => {
    if (!rawUserId && typeof window !== 'undefined' && !localStorage.getItem('neon_guest_chat_id') && userIdentifier.startsWith('guest_')) {
      localStorage.setItem('neon_guest_chat_id', userIdentifier);
    }
  }, [rawUserId, userIdentifier]);

  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem(`neon_chat_session_${userIdentifier}`) || `session_${userIdentifier}`;
  });

  useEffect(() => {
    const key = `neon_chat_session_${userIdentifier}`;
    let sId = localStorage.getItem(key);
    if (!sId) {
      sId = `session_${userIdentifier}`;
      localStorage.setItem(key, sId);
    }
    setSessionId(sId);
  }, [userIdentifier]);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingHuman, setIsWaitingHuman] = useState(false);
  const [hasHumanJoined, setHasHumanJoined] = useState(false);
  const [assignedAdmin, setAssignedAdmin] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Floating Draggable Position
  const [btnPos, setBtnPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('neon_chatbot_btn_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return {
            x: Math.min(Math.max(12, parsed.x), (typeof window !== 'undefined' ? window.innerWidth : 400) - 64),
            y: Math.min(Math.max(12, parsed.y), (typeof window !== 'undefined' ? window.innerHeight : 700) - 74)
          };
        }
      }
    } catch (e) {}
    const initialX = typeof window !== 'undefined' ? Math.max(12, window.innerWidth - 72) : 320;
    const initialY = typeof window !== 'undefined' ? Math.max(12, window.innerHeight - 150) : 550;
    return { x: initialX, y: initialY };
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, origX: 0, origY: 0, hasMoved: false });
  const lastOpenTimeRef = useRef<number>(0);
  const [isJustOpened, setIsJustOpened] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only primary pointer button
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = btnPos.x;
    const origY = btnPos.y;
    dragStartRef.current = { x: startX, y: startY, origX, origY, hasMoved: false };
    isDraggingRef.current = true;

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.hypot(dx, dy) > 5) {
        dragStartRef.current.hasMoved = true;
      }
      const maxX = typeof window !== 'undefined' ? window.innerWidth - 64 : 340;
      const maxY = typeof window !== 'undefined' ? window.innerHeight - 74 : 600;
      const nx = Math.min(Math.max(10, origX + dx), maxX);
      const ny = Math.min(Math.max(10, origY + dy), maxY);
      setBtnPos({ x: nx, y: ny });
    };

    const onPointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      isDraggingRef.current = false;

      if (!dragStartRef.current.hasMoved) {
        // Clean tap/click — open chat without ghost click
        lastOpenTimeRef.current = Date.now();
        setIsJustOpened(true);
        setIsOpen(true);
        setTimeout(() => {
          setIsJustOpened(false);
        }, 400);
      } else {
        // Drag finished — persist coordinates
        try {
          const maxX = typeof window !== 'undefined' ? window.innerWidth - 64 : 340;
          const maxY = typeof window !== 'undefined' ? window.innerHeight - 74 : 600;
          const nx = Math.min(Math.max(10, origX + (ev.clientX - startX)), maxX);
          const ny = Math.min(Math.max(10, origY + (ev.clientY - startY)), maxY);
          localStorage.setItem('neon_chatbot_btn_pos', JSON.stringify({ x: nx, y: ny }));
        } catch {}
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Sync with localStorage on load (no API call - polling handles remote sync)
  useEffect(() => {
    localStorage.setItem(`neon_chat_session_${userIdentifier}`, sessionId);

    const loadSessionFromStorage = () => {
      const all = getStoredSessions();
      const current = all.find((s) => s.id === sessionId);
      const cleanMsgs = filterCleanMessages(current?.messages || []);
      if (current && current.status !== 'waiting_admin') {
        setMessages(cleanMsgs.length > 0 ? cleanMsgs : INITIAL_MESSAGES);
        setHasHumanJoined(current.status === 'active_admin');
        setAssignedAdmin(current.assignedAdminName);
        setIsWaitingHuman(false);
      } else {
        setMessages(cleanMsgs.length ? cleanMsgs : INITIAL_MESSAGES);
        setIsWaitingHuman(false);
        setHasHumanJoined(false);
        setAssignedAdmin(undefined);
      }
    };

    loadSessionFromStorage();
    // No storage event listener - prevents cascading API calls causing 429 errors
  }, [sessionId, userIdentifier]);

  // Real-time Cloudflare D1 Polling when Chat Drawer is Open
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let isPolling = false;
    let errorCount = 0;

    const pollChat = async () => {
      if (isPolling || cancelled) return;
      isPolling = true;
      try {
        const res = await nexoraApi.getChatSession(sessionId);
        if (cancelled) return;
        errorCount = 0; // Reset on success
        if (res.success && res.session) {
          const remote = res.session;
          if (remote.messages && Array.isArray(remote.messages) && remote.messages.length > 0) {
            const cleanRemote = filterCleanMessages(remote.messages);
            setMessages((prev) => {
              if (cleanRemote.length !== prev.length || JSON.stringify(cleanRemote) !== JSON.stringify(prev)) {
                return cleanRemote;
              }
              return prev;
            });
          }
          if (remote.status === 'active_admin') {
            setHasHumanJoined(true);
            setIsWaitingHuman(false);
            if (remote.assignedAdminName) setAssignedAdmin(remote.assignedAdminName);
          } else if (remote.status === 'waiting_admin') {
            setIsWaitingHuman(true);
            setHasHumanJoined(false);
          } else {
            setIsWaitingHuman(false);
            setHasHumanJoined(false);
            setAssignedAdmin(undefined);
          }
        }
      } catch (err) {
        errorCount++;
      } finally {
        isPolling = false;
      }
    };

    // Initial poll after 1s delay (not instant to avoid burst on open)
    const initTimer = setTimeout(pollChat, 1000);
    // Poll every 8 seconds (prevents 429 rate limiting)
    const interval = setInterval(() => {
      if (errorCount < 5) pollChat();
    }, 8000);
    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const persistSession = (newMessages: ChatMessage[], newStatus?: 'bot' | 'waiting_admin' | 'active_admin' | 'resolved', adminName?: string) => {
    const all = getStoredSessions();
    const existingIndex = all.findIndex((s) => s.id === sessionId);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const lastMsg = newMessages[newMessages.length - 1]?.text || '';
    const resolvedStatus = newStatus || (isWaitingHuman ? 'waiting_admin' : hasHumanJoined ? 'active_admin' : 'bot');

    const sessionData: LiveChatSession = {
      id: sessionId,
      userId: currentUser?.id || userIdentifier,
      userName: currentUser?.name || (userIdentifier.startsWith('guest_') ? 'Guest Miner' : userIdentifier),
      userEmail: currentUser?.email || '',
      userMobile: currentUser?.mobile || '',
      userPlan: currentUser?.planName || 'No Active Plan',
      userBalance: currentUser?.availableBalance || 0,
      status: resolvedStatus,
      createdAt: existingIndex >= 0 ? all[existingIndex].createdAt : now,
      updatedAt: now,
      lastMessageText: lastMsg,
      unreadAdminCount: (existingIndex >= 0 ? all[existingIndex].unreadAdminCount || 0 : 0) + 1,
      unreadUserCount: 0,
      assignedAdminName: adminName || assignedAdmin,
      messages: newMessages
    };

    if (existingIndex >= 0) {
      all[existingIndex] = sessionData;
    } else {
      all.unshift(sessionData);
    }
    saveStoredSessions(all);

    // Sync to Cloudflare D1 real-time database
    nexoraApi.syncChatSession({
      sessionId,
      userId: currentUser?.id || userIdentifier,
      userName: currentUser?.name || (userIdentifier.startsWith('guest_') ? 'Guest Miner' : userIdentifier),
      userEmail: currentUser?.email || '',
      userMobile: currentUser?.mobile || '',
      userPlan: currentUser?.planName || 'No Active Plan',
      userBalance: currentUser?.availableBalance || 0,
      status: resolvedStatus,
      messages: newMessages,
      lastMessageText: lastMsg
    }).catch(() => {});
  };

  const handleEscalateToHuman = (customPrompt?: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const escalationMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      sender: 'ai',
      text: "🎫 **[OFFICIAL SUPPORT TICKET DESK]**\n\nNeed personal assistance or want to send a query directly to our administration team? Please click **'Raise Ticket'** (at the top/bottom of this chat or tap the **Mail/Inbox icon** in the top header).\n\nOnce our team reviews and replies to your ticket, an on-screen notification light will blink on your header Mail icon!",
      timestamp: now,
      isEmergency: false
    };

    const updated = [...messages, escalationMsg];
    setMessages(updated);
    persistSession(updated, 'bot');

    // Optionally auto-open the Support Inbox modal for immediate ticket creation
    if (onOpenInbox) {
      setTimeout(() => {
        onOpenInbox();
      }, 600);
    }
  };

  const handleClearChat = async () => {
    setMessages(INITIAL_MESSAGES);
    setIsWaitingHuman(false);
    setHasHumanJoined(false);
    setAssignedAdmin(undefined);
    try {
      const all = getStoredSessions().filter((s) => s.id !== sessionId);
      saveStoredSessions(all);
      const newSessionId = `session_${userIdentifier}_${Date.now()}`;
      localStorage.setItem(`neon_chat_session_${userIdentifier}`, newSessionId);
      setSessionId(newSessionId);
    } catch {}
  };

  const handleSendMessage = (textToSend?: string) => {
    // Ignore any clicks that fire within 450ms of opening (prevents touch bleed ghost clicks)
    if (Date.now() - lastOpenTimeRef.current < 450) {
      return;
    }

    const text = textToSend || inputText;
    if (!text.trim()) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: now
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputText('');

    const lower = text.toLowerCase();
    const isPdfRequest =
      lower.includes('pdf') ||
      lower.includes('presentation') ||
      lower.includes('whitepaper') ||
      lower.includes('business plan') ||
      lower.includes('ppt') ||
      lower.includes('brochure') ||
      lower.includes('deck');

    // PDF Card Response — show card in chat, user taps View/Download from card
    if (isPdfRequest) {
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        const aiResponse =
          "📄 **Official Neon Mining Info PDF:**\n\n" +
          "Tap the button below to view or download the complete official guide:\n\n" +
          "👉 **[📥 View / Download Official Info PDF](/Neon Mining Official Info.pdf)**\n\n" +
          "Contains: All plan details, daily rates, withdrawal rules, referral system & more.";

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: aiResponse,
          timestamp: now
        };

        const withAi = [...updatedMessages, aiMsg];
        setMessages(withAi);
        persistSession(withAi, isWaitingHuman ? 'waiting_admin' : hasHumanJoined ? 'active_admin' : 'bot');
      }, 350);
      return;
    }

    // If already waiting for or speaking with a human agent, forward directly to admin queue
    if (isWaitingHuman || hasHumanJoined) {
      persistSession(updatedMessages, isWaitingHuman ? 'waiting_admin' : 'active_admin');
      return;
    }

    // Check if user requests a ticket, human agent, or management help
    const isHumanRequest =
      lower.includes('ticket') ||
      lower.includes('raise ticket') ||
      lower.includes('support ticket') ||
      lower.includes('human') ||
      lower.includes('admin') ||
      lower.includes('agent') ||
      lower.includes('person') ||
      lower.includes('talk to human') ||
      lower.includes('support agent') ||
      lower.includes('customer care') ||
      lower.includes('real person') ||
      lower.includes('baat karni') ||
      lower.includes('madad');

    if (isHumanRequest) {
      handleEscalateToHuman(text.trim());
      return;
    }

    setIsTyping(true);

    setTimeout(() => {
      let aiResponse = '';

      // 0. PDF / PRESENTATION / WHITEPAPER / BUSINESS PLAN
      if (
        lower.includes('pdf') ||
        lower.includes('presentation') ||
        lower.includes('whitepaper') ||
        lower.includes('business plan') ||
        lower.includes('ppt') ||
        lower.includes('brochure') ||
        lower.includes('deck')
      ) {
        aiResponse =
          "📄 **Official Neon Mining Info PDF:**\n\n" +
          "You can view and download our official info document below:\n\n" +
          "👉 **[📥 View / Download Official Info PDF](/Neon Mining Official Info.pdf)**\n\n" +
          "Contains: All plan details, daily rates, withdrawal rules, referral system & more.";
      }

      // 1. ALL 7 MINING PLANS
      else if (
        lower.includes('plan') ||
        lower.includes('tier') ||
        lower.includes('package') ||
        lower.includes('kitne plan') ||
        lower.includes('plans kya hai')
      ) {
        aiResponse =
          "📊 **Neon Mining — 7 Official Node Plans (365-Day Duration):**\n\n" +
          "• **Plan 01 — Neon Lite**: $20.00 (1.0% daily / $0.20/day / $73.00/yr)\n" +
          "• **Plan 02 — Cryptera**: $50.00 (1.1% daily / $0.55/day / $200.75/yr)\n" +
          "• **Plan 03 — Novacore**: $150.00 (1.2% daily / $1.80/day / $657.00/yr)\n" +
          "• **Plan 04 — Hypervex**: $350.00 (1.35% daily / $4.73/day / $1,724.63/yr)\n" +
          "• **Plan 05 — Vantamine**: $700.00 (1.5% daily / $10.50/day / $3,832.50/yr)\n" +
          "• **Plan 06 — Nexhash**: $1,500.00 (1.7% daily / VIP Institutional — Coming Soon)\n" +
          "• **Plan 07 — OmegaVIP**: $3,000.00 (2.0% daily / Elite Flagship — Coming Soon)\n\n" +
          "⚡ **Single-Active Node Policy**: Only 1 plan can run at a time. Lower plans are locked, and you can upgrade anytime by paying the price difference only!";
      }

      // 2. WITHDRAWAL RULES & LIMITS
      else if (
        lower.includes('withdraw') ||
        lower.includes('cashout') ||
        lower.includes('payout') ||
        lower.includes('how to withdraw') ||
        lower.includes('minimum withdrawal') ||
        lower.includes('fee')
      ) {
        aiResponse =
          "🔒 **Official Withdrawal & Cashout Protocol:**\n\n" +
          "• **Minimum Withdrawal**: Strictly **2.00 USDT**\n" +
          "• **Platform Gas Fee**: Flat **5.0%** deducted to cover Binance Smart Chain validator fees\n" +
          "• **Rate Limit**: Strictly **1 withdrawal request per account per 24 hours**\n" +
          "• **Security Required**: Your dedicated **6-digit Fund Password PIN**\n" +
          "• **Blockchain Network**: Binance Smart Chain (**BEP-20 USDT**)\n" +
          "• **Settlement**: Rapid automated on-chain processing straight to your external wallet.";
      }

      // 3. DEPOSIT RULES
      else if (
        lower.includes('deposit') ||
        lower.includes('recharge') ||
        lower.includes('fund') ||
        lower.includes('how to deposit') ||
        lower.includes('add money') ||
        lower.includes('minimum deposit')
      ) {
        aiResponse =
          "💳 **Official BEP-20 Deposit Rules:**\n\n" +
          "• **Minimum Deposit**: **10.00 USDT**\n" +
          "• **Accepted Token**: Tether USD (**USDT**) on Binance Smart Chain (**BEP-20**)\n" +
          "• **Deposit Fee**: **0% (Free)** — 100% of deposited funds are credited to your Deposit Balance\n" +
          "• **Verification**: Automatic on-chain BSC RPC verification within 15–60 seconds\n" +
          "• **Usage**: Use your Deposit Balance to stake into any of our 7 mining node plans!";
      }

      // 4. 24-HOUR PROOF-OF-ACTIVITY MINING CYCLE
      else if (
        lower.includes('24') ||
        lower.includes('cycle') ||
        lower.includes('proof') ||
        lower.includes('red') ||
        lower.includes('green') ||
        lower.includes('start mining') ||
        lower.includes('stop') ||
        lower.includes('how to start mining')
      ) {
        aiResponse =
          "⏱️ **24-Hour Proof-of-Activity Mining Mechanics:**\n\n" +
          "1. **Purchase State (STOPPED - Red)**: When you buy a plan, the node starts in STOPPED state. No interest is credited upon purchase.\n" +
          "2. **Activation**: Tap **'Start 24H Mining'** or the glowing central core — it turns EMERALD GREEN and begins a precise 24-hour countdown timer.\n" +
          "3. **Reward Settlement**: Exactly 24 hours later, your daily yield (1.0% to 1.5%) is automatically credited to your wallet, and the core turns RED (STOPPED).\n" +
          "4. ⚠️ **Missed Days Rule**: If you do not tap 'Start Mining' for 2 or more days, you receive **0 yield** for those missed days! You must activate your cycle daily.";
      }

      // 5. COMPOUNDING & AUTOMATIC TIER UPGRADES
      else if (
        lower.includes('compound') ||
        lower.includes('auto upgrade') ||
        lower.includes('reinvest') ||
        lower.includes('apy') ||
        lower.includes('auto-upgrade') ||
        lower.includes('how to compound')
      ) {
        aiResponse =
          "🚀 **Daily Auto-Compounding & Automatic Tier Upgrades:**\n\n" +
          "• **Exponential Yield**: When you reinvest daily earnings into your plan principal, you earn compound returns that multiply your 365-day APY.\n" +
          "• **Automatic Plan Upgrades**: As soon as your compounded principal crosses higher tier thresholds ($50, $150, $350, $700, $1,500, $3,000), the protocol **automatically upgrades** your account to that higher tier and unlocks the higher daily percentage rate immediately!";
      }

      // 6. DIFFERENCE-ONLY UPGRADES
      else if (
        lower.includes('upgrade') ||
        lower.includes('difference') ||
        lower.includes('diff') ||
        lower.includes('how to upgrade')
      ) {
        aiResponse =
          "⚡ **Difference-Only Plan Upgrades:**\n\n" +
          "You never pay full price when upgrading to a higher node tier! You only pay the exact difference:\n" +
          "• From $20 (Neon Lite) to $50 (Cryptera) ➔ Pay only **$30 difference**\n" +
          "• From $50 (Cryptera) to $150 (Novacore) ➔ Pay only **$100 difference**\n" +
          "• From $150 (Novacore) to $350 (Hypervex) ➔ Pay only **$200 difference**\n\n" +
          "Your hashrate and daily yield rate increase immediately upon upgrade!";
      }

      // 7. P2P INTERNAL WALLET TRANSFERS
      else if (
        lower.includes('p2p') ||
        lower.includes('transfer') ||
        lower.includes('internal transfer') ||
        lower.includes('peer to peer') ||
        lower.includes('send to friend')
      ) {
        aiResponse =
          "🤝 **Instant 0% Fee P2P Wallet Transfers:**\n\n" +
          "• **Fee**: **0.0% Network Fee** (100% full transfer amount credited)\n" +
          "• **Dual Source Support**: You can send directly from your **Deposit Balance** (deposited funds) OR **Withdrawable Balance** (daily mining yield & referral commissions)!\n" +
          "• **Recipient**: Send to any registered member using their User ID or registered mobile\n" +
          "• **Security**: Protected by your 6-digit Fund Security PIN\n" +
          "• **Credit**: Funds arrive instantly in the recipient's Deposit Balance ready for node staking!";
      }

      // 8. REFERRAL PROGRAM & TURNOVER BOOSTERS
      else if (
        lower.includes('refer') ||
        lower.includes('commission') ||
        lower.includes('downline') ||
        lower.includes('turnover') ||
        lower.includes('booster') ||
        lower.includes('team') ||
        lower.includes('affiliate')
      ) {
        aiResponse =
          "🏆 **3-Tier Referral Commissions & Turnover Yield Boosters:**\n\n" +
          "• **Level 1 (Direct)**: **10% Instant Commission** on every node purchase\n" +
          "• **Level 2 (Team)**: **5% Commission** on secondary network stakes\n" +
          "• **Level 3 (Community)**: **2% Commission** on tertiary network stakes\n\n" +
          "🔥 **Turnover Yield Boosters:**\n" +
          "• When Personal Stake + 3-Level Team Turnover crosses **$1,000 USDT**, your daily mining rate boosts to **1.5% daily**!\n" +
          "• When Team Turnover crosses **$2,500 USDT**, your daily rate boosts to **2.5% daily**!";
      }

      // 9. FUND PASSWORD / FORGOTTEN PIN
      else if (
        lower.includes('pin') ||
        lower.includes('password') ||
        lower.includes('forgot pin') ||
        lower.includes('forgot') ||
        lower.includes('reset')
      ) {
        aiResponse =
          "🔑 **Fund Security PIN Recovery:**\n\n" +
          "Your 6-digit Fund PIN is required to authorize all cashouts and P2P transfers. If you have forgotten or need to reset your PIN:\n" +
          "1. Go to **Wallet ➔ Request Fund PIN Reset**.\n" +
          "2. Or click **'🎫 Raise Ticket'** below — our support specialist can assist you directly via your personal Support Inbox!";
      }

      // 10. ABOUT NEON MINING & LEADERSHIP (PROF. JIAWEI HAN & MARINA GURYEVA)
      else if (
        lower.includes('about') ||
        lower.includes('company') ||
        lower.includes('history') ||
        lower.includes('jiawei') ||
        lower.includes('han') ||
        lower.includes('prof') ||
        lower.includes('professor') ||
        lower.includes('marina') ||
        lower.includes('guryeva') ||
        lower.includes('adviser') ||
        lower.includes('advisor') ||
        lower.includes('founder') ||
        lower.includes('leadership') ||
        lower.includes('data center') ||
        lower.includes('what is neon')
      ) {
        aiResponse =
          "🏛️ **About Neon Mining & Leadership:**\n\n" +
          "• **13 Years of Excellence (Est. 2013)**: Established in late 2013 as an independent industrial cloud mining pioneer, our infrastructure has scaled across Iceland, Europe, and North America, serving over 2,000,000+ miners.\n" +
          "• **Chief Scientific Fellow — Prof. Jiawei Han**: ACM/IEEE Fellow with 150,000+ academic citations. He directed the implementation of our proprietary *Adaptive Hash-Balancing Architecture (AHBA)*, delivering **+34.2% hash efficiency** across our 45,000+ Hydro ASIC fleet.\n" +
          "• **Chief Blockchain Adviser — Marina Guryeva**: A prominent authority in blockchain architecture, smart contracts, and Web3 ecosystems with over 10 years of executive leadership, advising Neon Mining's decentralized computing and yield distribution architecture.\n" +
          "• **2026 Flagship Launch**: In 2026, we launched **Neon Mining** as our most advanced retail cloud mining platform, bringing enterprise-grade ASIC power directly to global users starting from just **$20.00**.\n" +
          "• **4 Global Renewable Mega-Campuses**: Powered by 100% green tier-4 infrastructure in Iceland (Geothermal), Sweden (Hydro), Texas (Solar/Wind), and Quebec (Hydro-Québec) with a 45,000+ Hydro ASIC fleet.";
      }

      // DEFAULT FALLBACK GREETING
      else {
        aiResponse =
          "👋 Welcome to Neon Mining! I am your AI Copilot.\n\n" +
          "I can assist you with:\n" +
          "• **7 Mining Plans** ($20 to $3,000 USD, 365-day contracts)\n" +
          "• **24H Proof-of-Activity Cycles** (Red stopped vs Green active)\n" +
          "• **Withdrawals**: $2.00 min cashout, 5% fee, BEP-20 network\n" +
          "• **Deposits**: $10.00 min on BSC, instant automated credit\n" +
          "• **0% P2P Transfers** & **Daily Compounding Auto-Upgrades**\n\n" +
          "How can I help you today? Or tap **'🎫 Raise Ticket'** below to submit an official query!";
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      setIsTyping(false);
      persistSession(finalMessages);
    }, 700);
  };

  // Ghost Delete Message: Completely removes message from UI and Cloudflare D1 without leaving any trace
  const handleDeleteUserMessage = async (msgId: string) => {
    const updated = messages.filter((m) => m.id !== msgId);
    setMessages(updated);
    persistSession(updated);

    // Silently remove from D1 Database
    try {
      await nexoraApi.deleteChatMessage(sessionId, msgId);
    } catch (e) {}
  };

  return (
    <>
      {/* Floating Draggable Trigger Button */}
      {!isOpen && (
        <button
          onPointerDown={handlePointerDown}
          style={{
            left: `${btnPos.x}px`,
            top: `${btnPos.y}px`,
            touchAction: 'none'
          }}
          className="fixed z-50 select-none w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#00F0FF] text-[#021426] flex items-center justify-center shadow-[0_4px_25px_rgba(0,240,255,0.45)] hover:scale-105 active:scale-95 transition-transform cursor-grab active:cursor-grabbing group"
          title="Neon Support (Tap to open • Drag anywhere)"
        >
          <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-[#021426]" />
        </button>
      )}

      {/* Slide-Up Chat Window - Compact & Non-intrusive */}
      {isOpen && (
        <div
          className={`fixed bottom-20 right-3 sm:right-5 z-50 w-[315px] sm:w-[350px] h-[450px] max-h-[72vh] rounded-2xl bg-[#091220]/95 backdrop-blur-md border border-[#00F0FF]/40 shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-scaleUp ${
            isJustOpened ? 'pointer-events-none' : ''
          }`}
        >
          {/* Header */}
          <div className="p-2.5 sm:p-3 bg-[#0C1A2E] border-b border-[#162740] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center text-[#00F0FF] shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[12.5px] sm:text-[13px] font-bold text-white flex items-center gap-1.5 leading-tight">
                  <span>Neon Support</span>
                </h4>
                <div className="flex items-center gap-1 text-[9.5px] text-cyan-400 font-medium">
                  <span>24/7 Active Support</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* PDF Action */}
              <button
                type="button"
                onClick={() => triggerPdfDownload()}
                className="px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Download Official PDF Presentation"
              >
                <FileText className="w-3 h-3 text-cyan-400" />
                <span>PDF</span>
              </button>

              {/* Raise Ticket Action */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenInbox) onOpenInbox();
                }}
                className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/35 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Raise Official Support Ticket"
              >
                <Ticket className="w-3 h-3 text-cyan-400" />
                <span>Raise Ticket</span>
              </button>

              {/* Reset Chat */}
              <button
                type="button"
                onClick={handleClearChat}
                title="Reset conversation"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-cyan-400 hover:bg-[#0D1B2E] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-2.5 sm:p-3 overflow-y-auto space-y-2 text-[11.5px]">
            {filterCleanMessages(messages).map((msg) => {
              const isUser = msg.sender === 'user';
              const isAdmin = msg.sender === 'admin';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isAdmin
                          ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                          : 'bg-[#0E223D] border-[#00F0FF]/50 text-[#00F0FF]'
                      }`}
                    >
                      {isAdmin ? <Headphones className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-2 sm:p-2.5 text-[11px] sm:text-[11.5px] leading-relaxed ${
                      isUser
                        ? 'bg-[#0284C7] text-white rounded-br-none shadow-md whitespace-pre-wrap'
                        : isAdmin
                        ? 'bg-gradient-to-r from-[#06241B] to-[#041A14] border border-emerald-500/60 text-emerald-100 rounded-bl-none shadow-lg'
                        : msg.isEmergency
                        ? 'bg-[#3D0A0A] border border-[#EF4444] text-[#FCA5A5]'
                        : 'bg-[#0E1A2E] border border-[#1B2F4A] text-[#CBD5E1] rounded-bl-none'
                    }`}
                  >
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-emerald-500/30 text-[9.5px] font-bold text-emerald-400">
                        <Sparkles className="w-3 h-3 text-emerald-300" />
                        <span>Support Specialist</span>
                      </div>
                    )}
                    {renderRichMessageContent(msg.text, isUser)}
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <span className="text-[9px] opacity-60">
                        {msg.timestamp}
                      </span>
                      {isUser && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUserMessage(msg.id)}
                          title="Delete message"
                          className="opacity-40 hover:opacity-100 hover:text-red-300 transition-all cursor-pointer p-0.5 rounded"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-[10.5px] text-[#00F0FF]">
                <Bot className="w-3.5 h-3.5 animate-spin" />
                <span>Neon AI is querying protocol knowledge...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Preset Questions Strip */}
          <div className="p-1.5 sm:p-2 bg-[#060D17] border-t border-[#132034] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {PRESET_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (Date.now() - lastOpenTimeRef.current < 450) return;
                  if (prompt.includes('Ticket')) {
                    setIsOpen(false);
                    if (onOpenInbox) onOpenInbox();
                  } else {
                    handleSendMessage(prompt);
                  }
                }}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer shrink-0 transition-all ${
                  prompt.includes('Ticket')
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'bg-[#0D1829] border border-[#192C45] text-[#38BDF8] hover:border-[#00F0FF]'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (Date.now() - lastOpenTimeRef.current < 450) return;
              handleSendMessage();
            }}
            className="p-2 sm:p-2.5 bg-[#0C1A2E] border-t border-[#162740] flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question or tap 'Raise Ticket'..."
              className="flex-1 rounded-xl bg-[#060D18] border border-[#192D48] px-3 py-1.5 text-[11.5px] text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00F0FF]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
