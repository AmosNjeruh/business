import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import { checkAuth, getCurrentUser, setUser, setUserTypePreference } from "@/services/auth";
import {
  getMyHiringProfile,
  upsertMyHiringProfile,
  listHiringExperts,
  getHiringExpert,
  getCampaigns,
  shortlistCampaignExpert,
  hireCampaignExpert,
  listMyHiredCampaigns,
  type AgentHireRow,
  type HiringWorkSample,
  type VendorHiringProfile,
  type HiringExpertListItem,
} from "@/services/vendor";
import { getConversationMessages, sendChatMessage, type ChatMessage } from "@/services/chat";
import { FaBriefcase, FaSearch, FaSpinner, FaSave, FaPlus, FaTrash, FaCheckCircle, FaEye, FaPaperPlane, FaTimes } from "react-icons/fa";

type TabKey = "portfolio" | "discover" | "hires";

function cleanUrl(u: string) {
  const t = (u || "").trim();
  return t;
}

function normalizeUrl(u: string) {
  const t = cleanUrl(u);
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  if (/^[a-z0-9-]+\.[a-z]{2,}([/:?#]|$)/i.test(t)) return `https://${t}`;
  return t;
}

function isHttpUrl(u: string) {
  const t = cleanUrl(u);
  return /^https?:\/\//i.test(t) || /^www\./i.test(t) || /^[a-z0-9-]+\.[a-z]{2,}([/:?#]|$)/i.test(t);
}

export default function AgentsCabinPage() {
  const [tab, setTab] = useState<TabKey>("discover");
  const [isAgent, setIsAgent] = useState(false);
  const [prefLoading, setPrefLoading] = useState(true);
  const [switchingPref, setSwitchingPref] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>(() => getCurrentUser()?.id || "");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState<VendorHiringProfile | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [bio, setBio] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [portfolioLinksText, setPortfolioLinksText] = useState("");
  const [workSamples, setWorkSamples] = useState<HiringWorkSample[]>([]);

  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [experts, setExperts] = useState<HiringExpertListItem[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewExpert, setPreviewExpert] = useState<HiringExpertListItem | null>(null);

  const [hireOpen, setHireOpen] = useState(false);
  const [hireExpert, setHireExpert] = useState<HiringExpertListItem | null>(null);
  const [hireCampaignsLoading, setHireCampaignsLoading] = useState(false);
  const [hireCampaigns, setHireCampaigns] = useState<any[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [hireSaving, setHireSaving] = useState(false);
  const [hireDone, setHireDone] = useState<{ mode: "HIRE" | "SHORTLIST"; campaignTitles: string[] } | null>(null);

  const [hiresLoading, setHiresLoading] = useState(false);
  const [hires, setHires] = useState<AgentHireRow[]>([]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadPref = async () => {
      try {
        setPrefLoading(true);
        const user = getCurrentUser();
        if (user) {
          const pref = String(user.userTypePreference || "").toUpperCase();
          setIsAgent(pref === "AGENT");
          setTab(pref === "AGENT" ? "portfolio" : "discover");
          setCurrentUserId(user.id || "");
        }
        const fresh = await checkAuth();
        if (cancelled) return;
        if (fresh?.user) {
          setUser(fresh.user);
          const pref = String(fresh.user.userTypePreference || "").toUpperCase();
          setIsAgent(pref === "AGENT");
          setTab(pref === "AGENT" ? "portfolio" : "discover");
          setCurrentUserId(fresh.user.id || "");
        }
      } catch {
        const user = getCurrentUser();
        const pref = String(user?.userTypePreference || "").toUpperCase();
        setIsAgent(pref === "AGENT");
        setTab(pref === "AGENT" ? "portfolio" : "discover");
        setCurrentUserId(user?.id || "");
      } finally {
        if (!cancelled) setPrefLoading(false);
      }
    };
    loadPref();
    return () => {
      cancelled = true;
    };
  }, []);

  // React immediately when Settings toggles userTypePreference (same-tab).
  useEffect(() => {
    const syncFromStorage = () => {
      const u = getCurrentUser();
      const pref = String(u?.userTypePreference || "").toUpperCase();
      const nextIsAgent = pref === "AGENT";
      setCurrentUserId(u?.id || "");
      setIsAgent(nextIsAgent);
      // Force vendor view to discover-only; agent can keep current tab.
      if (!nextIsAgent) {
        setTab("discover");
      }
    };

    const onUserUpdated = () => syncFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "user") syncFromStorage();
    };

    window.addEventListener("t360:userUpdated" as any, onUserUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("t360:userUpdated" as any, onUserUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      if (!isAgent) {
        setLoadingProfile(false);
        return;
      }
      try {
        setLoadingProfile(true);
        const p = await getMyHiringProfile();
        if (cancelled) return;
        setProfile(p);
        setBio(p.bio || "");
        setSkillsText((p.skillsTags || []).join(", "));
        setPortfolioLinksText((p.portfolioLinks || []).join("\n"));
        setWorkSamples(Array.isArray(p.workSamples) ? p.workSamples : []);
      } catch (e: any) {
        toast.error(e?.response?.data?.error || "Failed to load hiring profile");
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isAgent]);

  useEffect(() => {
    let cancelled = false;
    const loadHires = async () => {
      if (!isAgent || tab !== "hires") return;
      try {
        setHiresLoading(true);
        const rows = await listMyHiredCampaigns();
        if (cancelled) return;
        setHires(Array.isArray(rows) ? rows : []);
      } catch (err: any) {
        if (!cancelled) setHires([]);
        toast.error(err?.response?.data?.error || "Failed to load hired campaigns");
      } finally {
        if (!cancelled) setHiresLoading(false);
      }
    };
    loadHires();
    return () => {
      cancelled = true;
    };
  }, [isAgent, tab]);

  const openChat = async (conversationId: string) => {
    setChatConversationId(conversationId);
    setChatOpen(true);
    try {
      setChatLoading(true);
      const data = await getConversationMessages(conversationId, 60, 0);
      const msgs = (data?.messages || data || []) as ChatMessage[];
      setChatMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err: any) {
      setChatMessages([]);
      toast.error(err?.response?.data?.error || "Failed to load messages");
    } finally {
      setChatLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatConversationId || !chatText.trim()) return;
    setChatSending(true);
    try {
      await sendChatMessage(chatConversationId, chatText.trim());
      setChatText("");
      const data = await getConversationMessages(chatConversationId, 60, 0);
      const msgs = (data?.messages || data || []) as ChatMessage[];
      setChatMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send message");
    } finally {
      setChatSending(false);
    }
  };

  const normalizedSkills = useMemo(() => {
    return skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [skillsText]);

  const normalizedLinks = useMemo(() => {
    return portfolioLinksText
      .split("\n")
      .map((l) => normalizeUrl(l))
      .filter(Boolean);
  }, [portfolioLinksText]);

  const onSave = async () => {
    if (!isAgent) {
      toast.error("Enable Agent mode to edit your portfolio");
      return;
    }
    const badLink = normalizedLinks.find((l) => !isHttpUrl(l));
    if (badLink) {
      toast.error("Please enter a valid portfolio URL");
      return;
    }
    const badSample = workSamples.find((s) => s?.link && !isHttpUrl(s.link));
    if (badSample) {
      toast.error("Please enter a valid work sample URL");
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await upsertMyHiringProfile({
        bio: bio.trim() ? bio.trim() : null,
        skillsTags: normalizedSkills,
        portfolioLinks: normalizedLinks,
        workSamples: workSamples
          .map((s) => ({ ...s, link: normalizeUrl(s.link) }))
          .filter((s) => s.title?.trim() && s.link?.trim()),
      });
      setProfile(updated);
      setBio(updated.bio || "");
      setSkillsText((updated.skillsTags || []).join(", "));
      setPortfolioLinksText((updated.portfolioLinks || []).join("\n"));
      setWorkSamples(Array.isArray(updated.workSamples) ? updated.workSamples : []);
      setLastSavedAt(new Date());
      setJustSaved(true);
      toast.success("Profile saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const enableAgentMode = async () => {
    try {
      setSwitchingPref(true);
      const res = await setUserTypePreference("AGENT");
      if (res?.user) setUser(res.user);
      setIsAgent(true);
      setTab("portfolio");
      toast.success("Agent mode enabled");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to enable agent mode");
    } finally {
      setSwitchingPref(false);
    }
  };

  useEffect(() => {
    if (!justSaved) return;
    const t = window.setTimeout(() => setJustSaved(false), 2200);
    return () => window.clearTimeout(t);
  }, [justSaved]);

  const onDiscover = async () => {
    try {
      setDiscoverLoading(true);
      const res = await listHiringExperts({ search: discoverSearch.trim(), limit: 30 });
      setExperts(res.data || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load experts");
    } finally {
      setDiscoverLoading(false);
    }
  };

  const openPreview = async (vendorId: string) => {
    try {
      setPreviewOpen(true);
      setPreviewLoading(true);
      const full = await getHiringExpert(vendorId);
      setPreviewExpert(full);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load expert profile");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const openHire = async (expert: HiringExpertListItem) => {
    setHireExpert(expert);
    setSelectedCampaignIds([]);
    setHireDone(null);
    setHireOpen(true);
    try {
      setHireCampaignsLoading(true);
      const res = await getCampaigns({ limit: 50 });
      setHireCampaigns(res?.data || []);
    } catch {
      setHireCampaigns([]);
    } finally {
      setHireCampaignsLoading(false);
    }
  };

  const submitHire = async (mode: "SHORTLIST" | "HIRE") => {
    if (!hireExpert) return;
    if (currentUserId && hireExpert.vendorId === currentUserId) {
      toast.error("You can’t hire yourself");
      return;
    }
    if (!selectedCampaignIds.length) {
      toast.error("Select at least one campaign");
      return;
    }
    try {
      setHireSaving(true);
      const selected = hireCampaigns.filter((c) => selectedCampaignIds.includes(String(c.id)));
      const titles = selected.map((c) => String(c.title || "Untitled"));

      for (const c of selected) {
        const cid = String(c.id);
        if (mode === "SHORTLIST") {
          await shortlistCampaignExpert(cid, hireExpert.vendorId);
        } else {
          await hireCampaignExpert(cid, hireExpert.vendorId);
        }
      }

      setHireDone({ mode, campaignTitles: titles });
      toast.success(mode === "SHORTLIST" ? `Shortlisted in ${titles.length} campaign(s)` : `Hired in ${titles.length} campaign(s)`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to update campaign hiring");
    } finally {
      setHireSaving(false);
    }
  };

  useEffect(() => {
    if (tab !== "discover") return;
    onDiscover();
  }, [tab]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                {isAgent ? "Agent mode" : "Vendor mode"}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {isAgent ? "My Agent Workspace" : "Discover Experts"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {isAgent
                  ? "Build your expert portfolio and manage your hires from vendors."
                  : "Discover professionals you can hire for campaign execution."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAgent && (
                <>
                  <button
                    onClick={() => setTab("portfolio")}
                    disabled={prefLoading}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      tab === "portfolio"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-white/3 border-slate-200 dark:border-white/8 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/6"
                    }`}
                  >
                    My Portfolio
                  </button>
                  <button
                    onClick={() => setTab("hires")}
                    disabled={prefLoading}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      tab === "hires"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-white/3 border-slate-200 dark:border-white/8 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/6"
                    }`}
                  >
                    My Hires
                  </button>
                </>
              )}
              <button
                onClick={() => setTab("discover")}
                disabled={prefLoading}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  tab === "discover"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-50 dark:bg-white/3 border-slate-200 dark:border-white/8 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/6"
                }`}
              >
                Discover Experts
              </button>
            </div>
          </div>
        </div>

        {!prefLoading && !isAgent && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">You’re in Vendor mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Vendors browse and hire experts. Only agents need a portfolio.
                </p>
              </div>
              <button
                onClick={enableAgentMode}
                disabled={switchingPref}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 text-xs font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {switchingPref ? "Enabling…" : "Become an Agent"}
              </button>
            </div>
          </div>
        )}

        {tab === "portfolio" && isAgent && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            {loadingProfile ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaBriefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Hiring Profile</h2>
                    {lastSavedAt && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-500">
                        Saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onSave}
                    disabled={savingProfile}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all disabled:opacity-60 ${
                      justSaved
                        ? "bg-emerald-600 text-white shadow-emerald-500/20"
                        : "bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 shadow-emerald-500/20 hover:opacity-90"
                    }`}
                  >
                    {justSaved ? <FaCheckCircle className="h-3.5 w-3.5" /> : <FaSave className="h-3.5 w-3.5" />}
                    {savingProfile ? "Saving…" : justSaved ? "Saved" : "Save"}
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/60"
                      placeholder="What do you specialize in? What outcomes have you delivered?"
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Skills (comma-separated)
                    </label>
                    <input
                      value={skillsText}
                      onChange={(e) => setSkillsText(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/60"
                      placeholder="e.g. Meta Ads, TikTok UGC, Copywriting, Influencer outreach"
                    />

                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mt-4 mb-1.5">
                      Portfolio Links (one per line)
                    </label>
                    <textarea
                      value={portfolioLinksText}
                      onChange={(e) => setPortfolioLinksText(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/60"
                      placeholder={"https://linkedin.com/in/...\nhttps://portfolio.example.com"}
                    />
                  </div>

                  <div className="xl:col-span-1">
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 p-4">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Preview</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        This is how vendors will see you in discovery.
                      </p>

                      <div className="mt-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {profile?.vendorId ? "Your expert profile" : "Expert profile"}
                        </p>
                        {bio.trim() ? (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-5">{bio.trim()}</p>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                            Add a bio to improve conversions.
                          </p>
                        )}

                        {normalizedSkills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {normalizedSkills.slice(0, 8).map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 text-[10px] font-semibold rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {normalizedLinks.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {normalizedLinks.slice(0, 3).map((l) => (
                              <p key={l} className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
                                {l}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Work Samples</p>
                    <button
                      onClick={() =>
                        setWorkSamples((prev) => [
                          ...prev,
                          { title: "", link: "", description: "" },
                        ])
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/6"
                    >
                      <FaPlus className="h-3 w-3" />
                      Add Sample
                    </button>
                  </div>

                  {workSamples.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add at least one sample to help vendors evaluate your work.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {workSamples.map((s, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Title
                              </label>
                              <input
                                value={s.title}
                                onChange={(e) =>
                                  setWorkSamples((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x))
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/60"
                                placeholder="e.g. Product launch campaign"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Link
                              </label>
                              <input
                                value={s.link}
                                onChange={(e) =>
                                  setWorkSamples((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, link: e.target.value } : x))
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/60"
                                placeholder="https://..."
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Description (optional)
                            </label>
                            <textarea
                              value={s.description || ""}
                              onChange={(e) =>
                                setWorkSamples((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, description: e.target.value } : x
                                  )
                                )
                              }
                              rows={3}
                              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white p-3 outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/60"
                              placeholder="Context, your role, and results."
                            />
                          </div>

                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => setWorkSamples((prev) => prev.filter((_, i) => i !== idx))}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/15"
                            >
                              <FaTrash className="h-3 w-3" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-500">
                  Profile ID: {profile?.vendorId || "—"}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "discover" && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <FaSearch className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Discover Experts</h2>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  placeholder="Search name, email, slug…"
                  className="w-64 max-w-[55vw] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400/60"
                />
                <button
                  onClick={onDiscover}
                  disabled={discoverLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {discoverLoading ? <FaSpinner className="h-3.5 w-3.5 animate-spin" /> : <FaSearch className="h-3.5 w-3.5" />}
                  Search
                </button>
              </div>
            </div>

            {discoverLoading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : experts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">No experts found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Try a different search or ask experts to enable agent preference.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {experts.map((e) => (
                  <div
                    key={e.vendorId}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center justify-center">
                        {e.picture ? (
                          <img src={e.picture} alt={e.name || "Expert"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {(e.name || e.email || "E").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {e.name || "Expert"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {e.vendorSlug || e.email || e.vendorId}
                        </p>
                      </div>
                    </div>

                    {e.bio && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-4">
                        {e.bio}
                      </p>
                    )}

                    {(e.skillsTags || []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {e.skillsTags.slice(0, 6).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {(e.portfolioLinks || []).length > 0 && (
                      <div className="mt-3 space-y-1">
                        {e.portfolioLinks.slice(0, 2).map((l) => (
                          <a
                            key={l}
                            href={l}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline truncate"
                          >
                            {l}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => openPreview(e.vendorId)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/6"
                      >
                        <FaEye className="h-3.5 w-3.5" />
                        Preview
                      </button>
                      <button
                        onClick={() => openHire(e)}
                        disabled={!!currentUserId && e.vendorId === currentUserId}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-xs font-semibold hover:opacity-90"
                      >
                        <FaPaperPlane className="h-3.5 w-3.5" />
                        {!!currentUserId && e.vendorId === currentUserId ? "You" : "Hire"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {previewOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-xl overflow-hidden flex flex-col">
              <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                    Expert Portfolio
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {previewExpert?.name || "Expert"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPreviewOpen(false);
                    setPreviewExpert(null);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {previewLoading ? (
                  <div className="flex items-center justify-center py-14">
                    <FaSpinner className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                ) : previewExpert ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center justify-center">
                        {previewExpert.picture ? (
                          <img src={previewExpert.picture} alt={previewExpert.name || "Expert"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {(previewExpert.name || previewExpert.email || "E").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-slate-900 dark:text-white truncate">{previewExpert.name || "Expert"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{previewExpert.vendorSlug || previewExpert.email || previewExpert.vendorId}</p>
                      </div>
                      <button
                        onClick={() => openHire(previewExpert)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-xs font-semibold hover:opacity-90"
                      >
                        <FaPaperPlane className="h-3.5 w-3.5" />
                        Hire
                      </button>
                    </div>

                    {(previewExpert.contactEmail || previewExpert.contactPhone || previewExpert.whatsapp || previewExpert.email) && (
                      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3 p-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact</p>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="text-slate-600 dark:text-slate-300">
                            <span className="text-slate-500 dark:text-slate-500">Email:</span>{" "}
                            {previewExpert.contactEmail || previewExpert.email || "—"}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300">
                            <span className="text-slate-500 dark:text-slate-500">Phone:</span>{" "}
                            {previewExpert.contactPhone || "—"}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300">
                            <span className="text-slate-500 dark:text-slate-500">WhatsApp:</span>{" "}
                            {previewExpert.whatsapp || "—"}
                          </div>
                        </div>
                      </div>
                    )}

                    {previewExpert.bio && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bio</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line">{previewExpert.bio}</p>
                      </div>
                    )}

                    {(previewExpert.skillsTags || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Skills</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {previewExpert.skillsTags.map((s) => (
                            <span key={s} className="px-2 py-0.5 text-[10px] font-semibold rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(previewExpert.workSamples || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Work Samples</p>
                        <div className="mt-2 space-y-2">
                          {previewExpert.workSamples.slice(0, 8).map((w, idx) => (
                            <div key={`${w.link}-${idx}`} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{w.title}</p>
                              <a href={w.link} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline truncate block mt-1">
                                {w.link}
                              </a>
                              {w.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">{w.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(previewExpert.portfolioLinks || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Portfolio Links</p>
                        <div className="mt-2 space-y-1">
                          {previewExpert.portfolioLinks.map((l) => (
                            <a key={l} href={l} target="_blank" rel="noreferrer" className="block text-xs text-emerald-700 dark:text-emerald-300 hover:underline truncate">
                              {l}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {hireOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Hire Expert</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{hireExpert?.name || "Expert"}</p>
                </div>
                <button
                  onClick={() => {
                    setHireOpen(false);
                    setHireExpert(null);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Select campaign(s)</label>
                  {hireCampaignsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <FaSpinner className="h-3.5 w-3.5 animate-spin" /> Loading campaigns…
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 max-h-56 overflow-y-auto space-y-2">
                      {hireCampaigns.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No campaigns found.</p>
                      ) : (
                        hireCampaigns.map((c) => {
                          const cid = String(c.id);
                          const checked = selectedCampaignIds.includes(cid);
                          return (
                            <label key={cid} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? Array.from(new Set([...selectedCampaignIds, cid]))
                                    : selectedCampaignIds.filter((x) => x !== cid);
                                  setSelectedCampaignIds(next);
                                }}
                                className="mt-0.5"
                              />
                              <span className="flex-1 min-w-0">
                                <span className="font-semibold text-slate-900 dark:text-white">{c.title || "Untitled"}</span>{" "}
                                <span className="text-slate-500 dark:text-slate-400">({c.status})</span>
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {hireDone && (
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-3">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                      {hireDone.mode === "HIRE" ? "Hired" : "Shortlisted"} successfully
                    </p>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-1">
                      {hireDone.campaignTitles.join(", ")}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => submitHire("SHORTLIST")}
                    disabled={hireSaving || hireCampaignsLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-60"
                  >
                    {hireSaving ? "…" : "Shortlist"}
                  </button>
                  <button
                    onClick={() => submitHire("HIRE")}
                    disabled={hireSaving || hireCampaignsLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    {hireSaving ? "…" : "Hire"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "hires" && isAgent && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">My Hires</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Campaigns you’ve been hired for. Open a thread to coordinate requirements and delivery.
                </p>
              </div>
              <button
                onClick={() => setTab("discover")}
                className="px-3 py-2 rounded-xl text-xs font-semibold border bg-slate-50 dark:bg-white/3 border-slate-200 dark:border-white/8 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/6"
              >
                Find more work
              </button>
            </div>

            {hiresLoading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : hires.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">No hires yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  When a vendor hires you, you’ll see it here with a chat thread and campaign details.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {hires.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">HIRED</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{h.campaign.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {h.campaign.description}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                          Hired by{" "}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {h.hiredBy?.name || "Vendor"}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => h.conversationId && openChat(h.conversationId)}
                          disabled={!h.conversationId}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 disabled:opacity-50"
                        >
                          <FaPaperPlane className="h-3.5 w-3.5" />
                          Open chat
                        </button>
                      </div>
                    </div>

                    {Array.isArray(h.campaign.requirements) && h.campaign.requirements.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Requirements
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                          {h.campaign.requirements.slice(0, 4).map((r, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
                              <span className="flex-1">{r}</span>
                            </li>
                          ))}
                          {h.campaign.requirements.length > 4 && (
                            <li className="text-[11px] text-slate-500 dark:text-slate-400">
                              +{h.campaign.requirements.length - 4} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {h.notes && (
                      <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/20 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Notes
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">
                          {h.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {chatOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
            <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Hiring thread</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Ask for requirements, assets, timelines</p>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-3">
                {chatLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <FaSpinner className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">No messages yet.</p>
                  </div>
                ) : (
                  chatMessages.map((m) => (
                    <div key={m.id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{m.sender?.name || "User"}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-500">
                          {new Date(m.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex-none border-t border-slate-200 dark:border-white/10 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    rows={2}
                    placeholder="Write a message…"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 resize-none"
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatSending || !chatText.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 text-xs font-semibold disabled:opacity-50"
                  >
                    {chatSending ? <FaSpinner className="h-3.5 w-3.5 animate-spin" /> : <FaPaperPlane className="h-3.5 w-3.5" />}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

