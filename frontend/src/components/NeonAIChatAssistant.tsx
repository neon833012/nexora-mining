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
  RotateCcw
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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    sender: 'ai',
    text: "👋 Welcome to Neon AI Copilot! I am your 24/7 intelligent Web3 mining assistant. Ask me anything about all 7 mining plans ($20 to $3,000), 24h proof-of-activity cycles, $2.00 min withdrawals, 0% P2P transfers, or compounding auto-upgrades!\n\nIf you need personal assistance, tap **'👤 Talk to Human Agent'** anytime.",
    timestamp: 'Just now'
  }
];

const PRESET_PROMPTS = [
  '📄 Download Official PDF Business Plan',
  'What are all 7 official mining plans?',
  'What is minimum withdrawal & fee?',
  'How does 24H proof-of-activity cycle work?',
  'How does auto-upgrade compounding work?',
  'How do 0% fee P2P transfers work?',
  'How does referral & turnover boosters work?',
  '👤 Talk to Human Support'
];

export const NeonAIChatAssistant: React.FC<Props> = ({ onDispatchEmergencyTicket, currentUser }) => {
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

  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    hasMoved: false
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: btnPos.x,
      origY: btnPos.y,
      hasMoved: false
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (Math.hypot(dx, dy) > 5) {
      dragRef.current.hasMoved = true;
    }

    const nextX = Math.min(Math.max(10, dragRef.current.origX + dx), window.innerWidth - 64);
    const nextY = Math.min(Math.max(10, dragRef.current.origY + dy), window.innerHeight - 74);

    setBtnPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    const hasMoved = dragRef.current.hasMoved;
    dragRef.current.isDragging = false;

    if (!hasMoved) {
      setIsOpen(true);
    } else {
      try {
        localStorage.setItem('neon_chatbot_btn_pos', JSON.stringify(btnPos));
      } catch (err) {}
    }
  };

  // Sync with localStorage on load and when storage events fire
  useEffect(() => {
    localStorage.setItem(`neon_chat_session_${userIdentifier}`, sessionId);

    const loadSession = async () => {
      const all = getStoredSessions();
      const current = all.find((s) => s.id === sessionId);
      if (current && current.status !== 'waiting_admin') {
        setMessages(current.messages.length > 0 ? current.messages : INITIAL_MESSAGES);
        setHasHumanJoined(current.status === 'active_admin');
        setAssignedAdmin(current.assignedAdminName);
        setIsWaitingHuman(false);
      } else {
        setMessages(current?.messages?.length ? current.messages : INITIAL_MESSAGES);
        setIsWaitingHuman(false);
        setHasHumanJoined(false);
        setAssignedAdmin(undefined);
      }

      // Also pull latest authoritative state from Cloudflare D1
      try {
        const res = await nexoraApi.getChatSession(sessionId);
        if (res.success && res.session) {
          const remote = res.session;
          if (remote.messages && remote.messages.length > 0) {
            setMessages(remote.messages);
          }
          if (remote.status === 'active_admin') {
            setHasHumanJoined(true);
            setIsWaitingHuman(false);
            if (remote.assignedAdminName) setAssignedAdmin(remote.assignedAdminName);
          } else if (remote.status === 'waiting_admin') {
            setIsWaitingHuman(true);
            setHasHumanJoined(false);
          } else {
            // resolved or bot
            setIsWaitingHuman(false);
            setHasHumanJoined(false);
          }
        } else {
          // No session in D1 (database cleared or clean slate) -> Ensure no queue!
          setIsWaitingHuman(false);
          setHasHumanJoined(false);
          setAssignedAdmin(undefined);
          try {
            const filtered = getStoredSessions().filter((s) => s.id !== sessionId);
            saveStoredSessions(filtered);
          } catch {}
        }
      } catch (e) {
        setIsWaitingHuman(false);
      }
    };

    loadSession();

    const handleSync = () => loadSession();
    window.addEventListener('storage', handleSync);
    window.addEventListener('neon_chat_sync', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('neon_chat_sync', handleSync);
    };
  }, [sessionId, userIdentifier]);

  // Real-time Cloudflare D1 Polling when Chat Drawer is Open or Human Support Requested
  useEffect(() => {
    const shouldPoll = isOpen || isWaitingHuman || hasHumanJoined;
    if (!shouldPoll) return;

    const pollChat = async () => {
      try {
        const res = await nexoraApi.getChatSession(sessionId);
        if (res.success && res.session) {
          const remote = res.session;
          if (remote.messages && Array.isArray(remote.messages) && remote.messages.length > 0) {
            setMessages((prev) => {
              if (remote.messages.length !== prev.length || JSON.stringify(remote.messages) !== JSON.stringify(prev)) {
                return remote.messages;
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
            // resolved or bot -> reset back to normal mode (Green Blink)
            setIsWaitingHuman(false);
            setHasHumanJoined(false);
            setAssignedAdmin(undefined);
          }
        } else {
          setIsWaitingHuman(false);
          setHasHumanJoined(false);
        }
      } catch (err) {}
    };

    pollChat();
    const interval = setInterval(pollChat, isOpen ? 2500 : 3500);
    return () => clearInterval(interval);
  }, [isOpen, sessionId, isWaitingHuman, hasHumanJoined]);

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
    setIsWaitingHuman(true);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const escalationMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      sender: 'ai',
      text: "🚨 **[CONNECTED TO LIVE HUMAN DESK]**\n\nYour chat session and account telemetry have been routed to our **24/7 Human Support Team**! A support specialist has received an urgent on-screen notification and will reply directly in this window shortly. Please type any questions or details below.",
      timestamp: now,
      isEmergency: true
    };

    const updated = [...messages, escalationMsg];
    setMessages(updated);
    persistSession(updated, 'waiting_admin');

    if (onDispatchEmergencyTicket) {
      onDispatchEmergencyTicket({
        id: `ticket_${Date.now()}`,
        type: 'emergency_ai',
        userId: currentUser?.id || userIdentifier,
        userName: currentUser?.name || userIdentifier,
        mobile: currentUser?.mobile || '+91 9876543210',
        subject: 'Live Chat Support Escalation',
        details: customPrompt || 'User requested live human agent from AI chat assistant.',
        status: 'pending',
        priority: 'emergency',
        timestamp: 'Just now'
      });
    }
  };

  const handleClearChat = async () => {
    setMessages(INITIAL_MESSAGES);
    setIsWaitingHuman(false);
    setHasHumanJoined(false);
    setAssignedAdmin(undefined);
    try {
      await nexoraApi.resolveAdminChat(sessionId);
      const all = getStoredSessions().filter((s) => s.id !== sessionId);
      saveStoredSessions(all);
      localStorage.removeItem(`neon_chat_session_${userIdentifier}`);
    } catch {}
  };

  const handleSendMessage = (textToSend?: string) => {
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

    // If already waiting for or speaking with a human agent, forward directly to admin queue
    if (isWaitingHuman || hasHumanJoined) {
      persistSession(updatedMessages, isWaitingHuman ? 'waiting_admin' : 'active_admin');
      return;
    }

    const lower = text.toLowerCase();

    // Check if user specifically requests a human agent or urgent help
    const isHumanRequest =
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
          "📄 **Official Neon Mining Presentation & Business Plan PDF:**\n\n" +
          "You can view and download our complete 16-page high-definition corporate presentation deck below:\n\n" +
          "👉 **[📥 Download Official PDF Presentation](/Neon_Mining_Official_Presentation.pdf)**\n\n" +
          "👉 **[🌐 View Fullscreen HD Slide Deck](/neon_mining_presentation.html)**\n\n" +
          "Contains: Infrastructure, 7 Mining Node Tiers, 24H Proof-of-Activity Engine, 3-Tier Referral Rewards (10%-5%-2%), Team Turnover Boosters, and Security Protocols.";
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
        lower.includes('nikal') ||
        lower.includes('paise kaise nikale') ||
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
        lower.includes('paise kaise dale') ||
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
        lower.includes('ghanta') ||
        lower.includes('mining kaise start')
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
        lower.includes('compounding kaise')
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
        lower.includes('upgrade kaise kare')
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
        lower.includes('bhejna') ||
        lower.includes('dost') ||
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
        lower.includes('bhul') ||
        lower.includes('forgot') ||
        lower.includes('reset')
      ) {
        aiResponse =
          "🔑 **Fund Security PIN Recovery:**\n\n" +
          "Your 6-digit Fund PIN is required to authorize all cashouts and P2P transfers. If you have forgotten or need to reset your PIN:\n" +
          "1. Go to **Wallet ➔ Request Fund PIN Reset**.\n" +
          "2. Or click **'👤 Talk to Human Support'** below — our on-call support specialist can verify your account and reset your PIN immediately!";
      }

      // 10. ABOUT NEON MINING & 10-YEAR HERITAGE (PROF. JIAWEI HAN)
      else if (
        lower.includes('about') ||
        lower.includes('company') ||
        lower.includes('history') ||
        lower.includes('jiawei') ||
        lower.includes('han') ||
        lower.includes('10 year') ||
        lower.includes('30 year') ||
        lower.includes('decade') ||
        lower.includes('founder') ||
        lower.includes('data center') ||
        lower.includes('kya hai')
      ) {
        aiResponse =
          "🏛️ **About Neon Mining (A Decade of Green Hashrate Excellence):**\n\n" +
          "• **10-Year Infrastructure Legacy (Est. 2016)**: Founded in 2016, Neon Mining spent a decade operating industrial hydro and geothermal ASIC clusters across 4 mega-campuses.\n" +
          "• **Chief Scientific Fellow — Prof. Jiawei Han**: World-renowned pioneer in Data Mining & parallel compute (ACM/IEEE Fellow, 150k+ citations). He architected our proprietary *Adaptive Hash-Balancing Architecture (AHBA)*, achieving **+34.2% higher hash efficiency**.\n" +
          "• **4 Global Renewable Mega-Campuses**: Tier-4 data centers in Iceland (100% Geothermal), Sweden (Luleå Hydro), Texas (350MW Solar/Wind), and Quebec (Hydro-Québec) powering 45,000+ Hydro ASICs.\n" +
          "• **2026 Launch of Neon Cloud Mining**: In 2026, we officially launched our consumer cloud mining platform, democratizing institutional hashrate for everyday global users starting from just **$20.00** with 0% P2P transfers and automated 24h compounding!";
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
          "How can I help you today? Or tap **'👤 Talk to Human Support'** below for live specialist assistance!";
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
    }, 850);
  };

  return (
    <>
      {/* Floating Draggable Trigger Button */}
      {!isOpen && (
        <button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            left: `${btnPos.x}px`,
            top: `${btnPos.y}px`,
            touchAction: 'none'
          }}
          className="fixed z-50 select-none w-13 h-13 rounded-full bg-gradient-to-r from-[#0284C7] to-[#00F0FF] text-[#021426] flex items-center justify-center shadow-[0_4px_25px_rgba(0,240,255,0.45)] hover:scale-105 active:scale-95 transition-transform cursor-grab active:cursor-grabbing group"
          title="Drag anywhere • Tap to open Neon AI Copilot"
        >
          {isWaitingHuman || hasHumanJoined ? (
            <div className="absolute -top-1 -right-1 flex items-center justify-center">
              <span className="w-4 h-4 rounded-full bg-red-500 animate-ping absolute" />
              <span className="w-4 h-4 rounded-full bg-red-600 border-2 border-[#030712] animate-pulse relative" />
            </div>
          ) : (
            <div className="absolute -top-1 -right-1 flex items-center justify-center">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#030712] animate-pulse" />
            </div>
          )}
          <Bot className="w-6 h-6 text-[#021426]" />
        </button>
      )}

      {/* Slide-Up Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 xs:right-4 z-50 w-[340px] xs:w-[380px] h-[520px] max-h-[80vh] max-w-[calc(100vw-24px)] rounded-2xl bg-[#091220]/95 backdrop-blur-md border border-[#00F0FF]/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-scaleUp">
          {/* Header */}
          <div className="p-3 bg-[#0C1A2E] border-b border-[#162740] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center text-[#00F0FF]">
                {hasHumanJoined ? <Headphones className="w-4 h-4 text-emerald-400" /> : <Bot className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#F8FAFC] flex items-center gap-1.5">
                  <span>{hasHumanJoined ? `Support Specialist (${assignedAdmin || 'Support'})` : 'Neon AI Copilot'}</span>
                </h4>
                <div className="flex items-center gap-1.5 text-[10px]">
                  {isWaitingHuman ? (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      Live Human Support Requested
                    </span>
                  ) : hasHumanJoined ? (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Live Human Support Active
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      24/7 Web3 Autonomous AI
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isWaitingHuman && !hasHumanJoined && (
                <button
                  onClick={() => handleEscalateToHuman()}
                  className="px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Connect with Human Support Specialist"
                >
                  <Headphones className="w-3 h-3 text-red-400" />
                  <span>Talk to Human</span>
                </button>
              )}

              <button
                onClick={handleClearChat}
                title="Reset conversation"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-cyan-400 hover:bg-[#0D1B2E] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Banner when human requested */}
          {isWaitingHuman && (
            <div className="px-3 py-2 bg-red-950/70 border-b border-red-600/40 flex items-center justify-between text-[11px] text-red-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <span>Live Support Desk Notified • Specialist will reply here</span>
              </div>
              <button
                onClick={handleClearChat}
                className="text-[10px] text-red-300 hover:text-white underline cursor-pointer font-bold"
                title="Cancel human support request"
              >
                Cancel
              </button>
            </div>
          )}

          {hasHumanJoined && (
            <div className="px-3 py-2 bg-emerald-950/60 border-b border-emerald-600/40 flex items-center justify-between text-[11px] text-emerald-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Connected with Specialist: <strong>{assignedAdmin || 'Agent'}</strong></span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/40 px-1.5 py-0.5 rounded">Live</span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-[11.5px]">
            {messages.map((msg) => {
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
                    className={`max-w-[85%] rounded-xl p-2.5 leading-[16px] whitespace-pre-line ${
                      isUser
                        ? 'bg-[#0284C7] text-white rounded-br-none shadow-md'
                        : isAdmin
                        ? 'bg-gradient-to-r from-[#06241B] to-[#041A14] border border-emerald-500/60 text-emerald-100 rounded-bl-none shadow-lg'
                        : msg.isEmergency
                        ? 'bg-[#3D0A0A] border border-[#EF4444] text-[#FCA5A5]'
                        : 'bg-[#0E1A2E] border border-[#1B2F4A] text-[#CBD5E1] rounded-bl-none'
                    }`}
                  >
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                        <Sparkles className="w-3 h-3 text-emerald-300" />
                        <span>Support Specialist ({msg.senderName || 'Support Desk'})</span>
                      </div>
                    )}
                    {msg.text}
                    <span className="text-[9px] opacity-60 block text-right mt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#00F0FF]">
                <Bot className="w-3.5 h-3.5 animate-spin" />
                <span>Neon AI is querying protocol knowledge...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Persistent 'Talk to Human' Action Bar if not yet escalated */}
          {!isWaitingHuman && !hasHumanJoined && (
            <div className="px-3 py-1.5 bg-[#081220] border-t border-[#14233C] flex items-center justify-between">
              <span className="text-[10.5px] text-[#94A3B8]">Query not resolved?</span>
              <button
                type="button"
                onClick={() => handleEscalateToHuman()}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600/30 to-amber-500/30 hover:from-amber-600/50 hover:to-amber-500/50 border border-amber-500/50 text-amber-300 font-bold text-[10.5px] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Headphones className="w-3 h-3 text-amber-300" />
                <span>Talk to Human Specialist</span>
              </button>
            </div>
          )}

          {/* Preset Questions Strip */}
          <div className="p-2 bg-[#060D17] border-t border-[#132034] flex gap-1.5 overflow-x-auto no-scrollbar">
            {PRESET_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  if (prompt.includes('Human')) {
                    handleEscalateToHuman();
                  } else {
                    handleSendMessage(prompt);
                  }
                }}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer shrink-0 transition-all ${
                  prompt.includes('Human')
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
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
              handleSendMessage();
            }}
            className="p-2.5 bg-[#0C1A2E] border-t border-[#162740] flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                hasHumanJoined
                  ? 'Message live support specialist...'
                  : isWaitingHuman
                  ? 'Add notes for human support agent...'
                  : "Ask AI or type 'talk to human'..."
              }
              className="flex-1 rounded-xl bg-[#060D18] border border-[#192D48] px-3 py-2 text-[12px] text-white focus:outline-none focus:border-[#00F0FF]"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
