// Business Suite – Messages
// Route: /admin/messages
// Full: thread list, compose, send, reply, mark read

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import { getMessages, getMessageThread, sendMessage, broadcastMessage, markThreadRead, MessageThread } from "@/services/vendor";
import {
  FaEnvelope, FaPaperPlane, FaSpinner, FaSearch, FaTimes,
  FaInbox, FaReply, FaCircle, FaChevronLeft, FaBullhorn, FaUsers,
} from "react-icons/fa";

function fmtTime(t: string) {
  try {
    const d = new Date(t);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return ""; }
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.charAt(0).toUpperCase();
}

const TYPE_COLORS: Record<string, string> = {
  application: "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300",
  campaign: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  system: "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300",
  work: "bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300",
};

// ── Broadcast Modal ─────────────────────────────────────────────────────────────
function BroadcastModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [targetGroup, setTargetGroup] = useState<"all" | "partners" | "brands">("all");

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;
    setIsSending(true);
    try {
      await broadcastMessage({
        subject: subject.trim(),
        content: content.trim(),
        targetGroup: targetGroup === "all" ? "all" : targetGroup === "partners" ? "all" : "brand",
      });
      toast.success(`Broadcast sent to ${targetGroup}`);
      onSent();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/20 flex items-center justify-center">
            <FaBullhorn className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Broadcast Message</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Send a message to multiple recipients</p>
          </div>
        </div>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Group *</label>
            <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value as any)}
              className={inputCls}>
              <option value="all">All Partners & Brands</option>
              <option value="partners">All Partners</option>
              <option value="brands">All Brands</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required
              placeholder="Campaign update, new opportunity…" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={6}
              placeholder="Write your broadcast message here…"
              className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSending || !subject || !content}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold text-sm disabled:opacity-50">
              {isSending ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaBullhorn className="h-3.5 w-3.5" />}
              {isSending ? "Sending…" : "Send Broadcast"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Compose Modal ─────────────────────────────────────────────────────────────
function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !content.trim()) return;
    setIsSending(true);
    try {
      await sendMessage({ recipientEmail: to.trim(), subject: subject.trim(), content: content.trim() });
      toast.success("Message sent successfully");
      onSent();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send message");
    } finally { setIsSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5">New Message</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">To *</label>
            <input type="email" value={to} onChange={(e) => setTo(e.target.value)} required
              placeholder="recipient@example.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject *</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required
              placeholder="Campaign collaboration opportunity…" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={5}
              placeholder="Write your message here…"
              className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSending || !to || !subject || !content}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50">
              {isSending ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaPaperPlane className="h-3.5 w-3.5" />}
              {isSending ? "Sending…" : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AdminMessagesPage: React.FC = () => {
  const router = useRouter();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [reply, setReply] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getMessages();
      setThreads(res.data || []);
    } catch (err: any) {
      if (err?.response?.status === 401) { router.push("/admin/auth"); return; }
      setThreads([]);
    } finally { setIsLoading(false); }
  }, [router]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread]);

  const openThread = async (thread: MessageThread) => {
    setIsThreadLoading(true);
    setActiveThread(thread);
    try {
      const full = await getMessageThread(thread.id);
      setActiveThread(full as any);
      // Mark thread as read when opened
      if (thread.unreadCount > 0) {
        try {
          await markThreadRead(thread.id);
          // Update thread in list
          setThreads((prev) => prev.map((t) => t.id === thread.id ? { ...t, unreadCount: 0 } : t));
        } catch {
          // Ignore errors marking as read
        }
      }
    } catch {
      // use the preview version
    } finally { setIsThreadLoading(false); }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !reply.trim()) return;
    setIsSendingReply(true);
    try {
      await sendMessage({
        recipientId: activeThread.partner?.id,
        recipientEmail: activeThread.partner?.email,
        subject: `Re: ${activeThread.subject || 'Message'}`,
        content: reply.trim(),
        campaignId: activeThread.campaign?.id,
        applicationId: activeThread.application?.id,
      });
      toast.success("Reply sent");
      setReply("");
      // Refresh thread to get updated messages
      const full = await getMessageThread(activeThread.id);
      setActiveThread(full as any);
      // Refresh thread list
      fetchThreads();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send reply");
    } finally { setIsSendingReply(false); }
  };

  const filtered = threads.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.subject?.toLowerCase().includes(q) || t.partner?.name?.toLowerCase().includes(q) || t.partner?.email?.toLowerCase().includes(q);
  });

  const unreadCount = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread · ` : ""}{threads.length} conversations
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
              <FaBullhorn className="h-3.5 w-3.5" /> Broadcast
            </button>
            <button onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all">
              <FaPaperPlane className="h-3.5 w-3.5" /> Compose
            </button>
          </div>
        </div>

        <div
          className="grid min-w-0 w-full grid-cols-1 gap-4 @lg/bus-main:grid-cols-3"
          style={{ minHeight: 520 }}
        >
          {/* Thread list */}
          <div
            className={`@lg/bus-main:col-span-1 rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 overflow-hidden flex flex-col ${activeThread ? "hidden @lg/bus-main:flex" : "flex"}`}
          >
            {/* Search */}
            <div className="p-3 border-b border-slate-200 dark:border-white/8">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 dark:text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50" />
              </div>
            </div>

            {/* Threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <FaSpinner className="animate-spin text-xl text-emerald-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <FaInbox className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">No messages yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Compose a message to get started</p>
                </div>
              ) : (
                filtered.map((thread) => (
                  <button key={thread.id} onClick={() => openThread(thread)}
                    className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors ${
                      activeThread?.id === thread.id ? "bg-emerald-50 dark:bg-emerald-500/5 border-l-2 border-emerald-400 dark:border-emerald-500" : ""
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-700 dark:text-white text-xs font-bold flex-shrink-0">
                        {getInitials(thread.partner?.name || thread.partner?.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate ${thread.unreadCount > 0 ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                            {thread.partner?.name || thread.partner?.email || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{fmtTime(thread.lastMessageAt || thread.createdAt)}</span>
                            {thread.unreadCount > 0 && <FaCircle className="h-1.5 w-1.5 text-emerald-500" />}
                          </div>
                        </div>
                        <p className={`text-[11px] mt-0.5 truncate ${thread.unreadCount > 0 ? "font-semibold text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>
                          {thread.subject || 'No subject'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{thread.lastMessagePreview}</p>
                        {thread.type && (
                          <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${TYPE_COLORS[thread.type] || TYPE_COLORS.system}`}>
                            {thread.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Thread detail */}
          <div
            className={`@lg/bus-main:col-span-2 rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 overflow-hidden flex flex-col ${!activeThread ? "hidden @lg/bus-main:flex" : "flex"}`}
          >
            {!activeThread ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <FaEnvelope className="h-14 w-14 text-slate-200 dark:text-slate-700 mb-4" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select a conversation</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Choose a thread to read and reply</p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-white/8 flex items-center gap-3">
                  <button onClick={() => setActiveThread(null)} className="@lg/bus-main:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <FaChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 text-xs font-bold flex-shrink-0">
                    {getInitials(activeThread.partner?.name || activeThread.partner?.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{activeThread.subject || 'No subject'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeThread.partner?.name || activeThread.partner?.email || 'Unknown'}</p>
                  </div>
                  {activeThread.type && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${TYPE_COLORS[activeThread.type] || TYPE_COLORS.system}`}>
                      {activeThread.type}
                    </span>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {isThreadLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <FaSpinner className="animate-spin text-xl text-emerald-500" />
                    </div>
                  ) : !(activeThread as any).messages || (activeThread as any).messages.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">No messages in this thread</p>
                  ) : (
                    ((activeThread as any).messages || []).map((msg: any, i: number) => {
                      // Check if message is from vendor (not from partner)
                      const isMe = msg.sender?.role === 'VENDOR' || (activeThread.partner && msg.sender?.id !== activeThread.partner.id);
                      return (
                        <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs lg:max-w-sm xl:max-w-md rounded-2xl px-4 py-3 ${
                            isMe
                              ? "bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950"
                              : "bg-slate-100 dark:bg-white/8 text-slate-900 dark:text-white"
                          }`}>
                            {!isMe && msg.sender && (
                              <p className="text-[10px] font-semibold mb-1 text-slate-500 dark:text-slate-400">{msg.sender.name || msg.sender.email}</p>
                            )}
                            <p className="text-xs leading-relaxed">{msg.content}</p>
                            <p className={`text-[9px] mt-1.5 ${isMe ? "text-slate-700" : "text-slate-400 dark:text-slate-500"}`}>
                              {fmtTime(msg.createdAt || msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply box */}
                <form onSubmit={handleReply} className="p-4 border-t border-slate-200 dark:border-white/8 flex gap-2">
                  <input value={reply} onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15" />
                  <button type="submit" disabled={isSendingReply || !reply.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-all whitespace-nowrap">
                    {isSendingReply ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaPaperPlane className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">Reply</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {showCompose && (
        <ComposeModal onClose={() => setShowCompose(false)} onSent={fetchThreads} />
      )}

      {showBroadcastModal && (
        <BroadcastModal onClose={() => setShowBroadcastModal(false)} onSent={fetchThreads} />
      )}
    </AdminLayout>
  );
};

export default AdminMessagesPage;
