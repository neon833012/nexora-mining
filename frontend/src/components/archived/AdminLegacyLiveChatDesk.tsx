import React from 'react';
import {
  MessageSquare,
  Search,
  Trash2,
  Send,
  User,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Headphones,
  Bot
} from 'lucide-react';
import { LiveChatSession, ChatMessage } from '../../types/mining';

/**
 * ARCHIVED: AdminLegacyLiveChatDesk
 * Preserved for future reference. This was previously the live chat response desk
 * where admin could reply directly to real-time chat sessions from NeonAIChatAssistant.
 */
interface Props {
  liveSessions: LiveChatSession[];
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  sessionFilter: 'all' | 'waiting' | 'active' | 'resolved';
  setSessionFilter: (f: 'all' | 'waiting' | 'active' | 'resolved') => void;
  chatSearchQuery: string;
  setChatSearchQuery: (q: string) => void;
  adminReplyText: string;
  setAdminReplyText: (text: string) => void;
  handleSendAdminReply: (session: LiveChatSession, cannedText?: string) => void;
  handleResolveSession: (sessionId: string) => void;
  handlePurgeAllChats: () => void;
  waitingChatsCount: number;
  activeChatsCount: number;
  resolvedChatsCount: number;
  isSubadmin?: boolean;
}

export const AdminLegacyLiveChatDesk: React.FC<Props> = ({
  liveSessions,
  selectedSessionId,
  setSelectedSessionId,
  sessionFilter,
  setSessionFilter,
  chatSearchQuery,
  setChatSearchQuery,
  adminReplyText,
  setAdminReplyText,
  handleSendAdminReply,
  handleResolveSession,
  handlePurgeAllChats,
  waitingChatsCount,
  activeChatsCount,
  resolvedChatsCount,
  isSubadmin
}) => {
  const filteredSessions = liveSessions.filter((s) => {
    if (sessionFilter === 'waiting') return s.status === 'waiting_admin';
    if (sessionFilter === 'active') return s.status === 'active_admin';
    if (sessionFilter === 'resolved') return s.status === 'resolved';
    return true;
  }).filter((s) => {
    if (!chatSearchQuery.trim()) return true;
    const q = chatSearchQuery.toLowerCase();
    return (
      s.userName?.toLowerCase().includes(q) ||
      s.userMobile?.toLowerCase().includes(q) ||
      s.userId?.toLowerCase().includes(q) ||
      s.lastMessageText?.toLowerCase().includes(q)
    );
  });

  const selectedSession = liveSessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="space-y-4">
      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'waiting', 'active', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSessionFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all capitalize whitespace-nowrap cursor-pointer ${
                sessionFilter === f
                  ? 'bg-[#14233C] text-cyan-400 border border-cyan-500/50'
                  : 'bg-[#070E1B] text-gray-400 hover:text-gray-200 border border-transparent'
              }`}
            >
              {f === 'all' && `All (${liveSessions.length})`}
              {f === 'waiting' && `🔴 Waiting (${waitingChatsCount})`}
              {f === 'active' && `🟢 Active (${activeChatsCount})`}
              {f === 'resolved' && `⚪ Resolved (${resolvedChatsCount})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {liveSessions.length > 0 && !isSubadmin && (
            <button
              type="button"
              onClick={handlePurgeAllChats}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-500/30 hover:bg-red-900/60 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Clear all chat conversations"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Chats</span>
            </button>
          )}

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search miner name, phone, message..."
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {liveSessions.length === 0 ? (
        <div className="py-14 text-center rounded-2xl bg-[#070E1B] border border-[#14233C] space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="text-white font-bold text-sm">No Live Support Sessions Active</h4>
          <p className="text-gray-400 text-xs max-w-md mx-auto">
            Archived component for legacy live chat interactions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={`p-3 rounded-xl transition-all cursor-pointer border text-left ${
                  selectedSession?.id === session.id
                    ? 'bg-[#0E1E38] border-cyan-500/60 shadow-lg'
                    : 'bg-[#070E1B] border-[#14233C] hover:border-[#1E3558]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{session.userName}</span>
                  <span className="text-[10px] text-gray-400">{session.updatedAt}</span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-1">{session.lastMessageText}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-8 flex flex-col bg-[#070E1B] border border-[#14233C] rounded-2xl h-[600px] overflow-hidden">
            {selectedSession ? (
              <div className="flex-1 flex flex-col p-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#14233C]">
                  <div>
                    <h4 className="text-white font-bold text-xs">{selectedSession.userName}</h4>
                    <span className="text-[10px] text-gray-400">ID: {selectedSession.userId}</span>
                  </div>
                  <button
                    onClick={() => handleResolveSession(selectedSession.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30"
                  >
                    Resolve Session
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2.5 py-3">
                  {selectedSession.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl max-w-[80%] text-xs ${
                        m.sender === 'admin'
                          ? 'ml-auto bg-emerald-900/60 text-emerald-100 border border-emerald-500/40'
                          : 'mr-auto bg-[#0F1E36] text-white border border-[#193259]'
                      }`}
                    >
                      <span className="block text-[9.5px] opacity-70 mb-0.5">{m.senderName || m.sender}</span>
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-[#14233C] flex gap-2">
                  <input
                    type="text"
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder="Type reply..."
                    className="flex-1 p-2 rounded-xl bg-[#040812] border border-[#14233C] text-xs text-white"
                  />
                  <button
                    onClick={() => handleSendAdminReply(selectedSession)}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs"
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
                Select a conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminLegacyLiveChatDesk;
